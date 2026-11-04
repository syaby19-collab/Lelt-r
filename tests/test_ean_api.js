// Contract tests use synthetic tokens and mocked API responses, never paid queries.
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const TOKEN = 'synthetic-test-token';
(async () => {
 const html = await fs.readFile(path.resolve(__dirname, '../Leltar.html'));
 const server = http.createServer((req,res) => {res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html);});
 await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
 const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try {
  async function setup(handler) {
   const context = await browser.newContext({acceptDownloads:true});
   const page = await context.newPage();
   await page.route('https://api.ean-search.org/api?*',handler);
   await page.goto('http://127.0.0.1:'+server.address().port);
   await page.locator('#apiPanel summary').click();
   await page.locator('#apiToken').fill(TOKEN);
   await page.locator('#apiEnable').click();
   assert.equal(await page.locator('#apiToken').inputValue(),'');
   return {context,page};
  }
  async function scan(page,code) {await page.locator('#barcode').fill(code);await page.locator('#barcode').press('Enter');}
  const requests=[];
  let fixture = await setup(async route => {
   const url = new URL(route.request().url());requests.push({time:Date.now(),code:url.searchParams.get('ean')});
   assert.equal(url.searchParams.get('token'),TOKEN);
   assert.equal(url.searchParams.get('language'),'7');
   await new Promise(resolve=>setTimeout(resolve,350));
   await route.fulfill({json:[{ean:url.searchParams.get('ean'),name:'Teszttermék '+requests.length}]});
  });
  let {page,context}=fixture;
  await scan(page,'4009026918845');await scan(page,'4009026918845');await scan(page,'3165143609255');
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('bolti-leltar-v1')).every(row=>row.name));
  assert.equal(requests.length,2,'One lookup per pending barcode');
  assert(requests[1].time-requests[0].time>=1000,'Rate limit: no more than one request per second');
  assert.equal(await page.locator('#total').textContent(),'3');
  await scan(page,'4009026918845');await page.waitForTimeout(1200);
  assert.equal(requests.length,2,'Saved names do not spend more credits');
  const local=await page.evaluate(()=>JSON.stringify(localStorage));assert(!local.includes(TOKEN));
  const downloadEvent=page.waitForEvent('download');await page.locator('#backup').click();
  const backup=await fs.readFile(await (await downloadEvent).path(),'utf8');assert(!backup.includes(TOKEN));
  await page.reload();assert(await page.locator('#apiFill').isDisabled());assert.equal(await page.locator('#total').textContent(),'4');
  await context.close();
  // A manually saved name wins over a slower API result.
  fixture=await setup(async route=>{await new Promise(resolve=>setTimeout(resolve,600));await route.fulfill({json:[{ean:'4009026918845',name:'API test name'}]});});
  ({page,context}=fixture);await scan(page,'4009026918845');
  const name=page.getByRole('textbox',{name:'Terméknév: 4009026918845',exact:true});
  await name.fill('Saját megnevezés');await page.getByRole('button',{name:'Mentés',exact:true}).click();
  await page.waitForTimeout(900);assert.equal(await name.inputValue(),'Saját megnevezés');await context.close();
  // Failures stop the queue while keeping stock data intact.
  for(const status of [401,402,429,'network']) {
   let count=0;
   fixture=await setup(async route=>{count++;if(status==='network')await route.abort('failed');else await route.fulfill({status,json:{error:'test error'}});});
   ({page,context}=fixture);await scan(page,'4009026918845');
   await page.waitForFunction(()=>document.querySelector('#apiFill').disabled);
   await scan(page,'3165143609255');await page.waitForTimeout(100);
   assert.equal(count,1);assert.equal(await page.locator('#total').textContent(),'2');
   assert.equal(await page.evaluate(()=>apiToken),'');await context.close();
  }
  // Missing results can be retried, and old blank names can be filled in bulk.
  let count=0;
  fixture=await setup(async route=>{count++;await route.fulfill({json:count===1?{error:'Barcode not found'}:[{ean:'4009026918845',name:'Utólagos tesztnév'}]});});
  ({page,context}=fixture);await scan(page,'4009026918845');
  await page.waitForFunction(()=>document.querySelector('#apiStatus').textContent.includes('Nincs terméknév'));
  await page.locator('#apiFill').click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('bolti-leltar-v1'))[0].name==='Utólagos tesztnév');
  assert.equal(count,2);assert.equal(await page.locator('#total').textContent(),'1');await context.close();
  console.log('EAN API mocked browser checks passed: naming, rate limit, deduplication, saved-name reuse, secret exclusion, manual-name race, auth/quota/network failures and bulk retry. No live API calls made.');
 } finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});

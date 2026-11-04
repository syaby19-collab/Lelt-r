const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const http=require('node:http');
(async()=>{
 const html=await fs.readFile(path.resolve(__dirname,'../Leltar.html'));
 const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html);});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const context=await browser.newContext({acceptDownloads:true});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port);
  assert.equal(await page.locator('#total').textContent(),'0','Preset shelves do not seed inventory');
  const presetOptions=await page.locator('#knownShelf option').allTextContents();
  for(const name of ['01','16','bf polc 01','jf polc 02','h rakt 01','motul','visszáru'])assert(presetOptions.includes(name),'Layout shelf missing: '+name);
  assert.equal(await page.locator('#knownShelf optgroup').count(),6);
  await page.locator('#knownShelf').selectOption('01');
  assert.equal(await page.locator('#activeShelf').textContent(),'01','Leading zeros survive shelf selection');
  await page.locator('#barcode').fill('000987');await page.locator('#barcode').press('Enter');
  await page.locator('#knownShelf').selectOption('jf polc 02');
  await page.locator('#barcode').fill('000987');await page.locator('#barcode').press('Enter');
  assert.equal(await page.locator('#total').textContent(),'2');assert.equal(await page.locator('#types').textContent(),'1');
  assert.equal(await page.locator('#rows tr').count(),2,'Choosing a shelf immediately routes scans');
  await page.locator('#shelfFilter').selectOption({label:'h rakt 01'});
  assert.equal(await page.locator('#rows tr').count(),0,'Empty predefined shelves can be filtered');
  await page.locator('#shelfFilter').selectOption('*');
  await page.evaluate(()=>localStorage.setItem('bolti-leltar-v1',JSON.stringify([{barcode:'001234',name:'Olajszűrő',quantity:4}])));
  await page.reload();
  const data=()=>page.evaluate(()=>read());
  assert.deepEqual(await data(),[{barcode:'001234',name:'Olajszűrő',shelf:'',quantity:4}]);
  async function scan(code){await page.locator('#barcode').fill(code);await page.locator('#barcode').press('Enter');}
  async function choose(shelf){await page.locator('#shelf').fill(shelf);await page.getByRole('button',{name:'Polchely használata',exact:true}).click();}
  const row=(code,shelf)=>page.locator('#rows tr').filter({has:page.locator('td:first-child',{hasText:new RegExp('^'+code+'$')})}).filter({has:page.getByRole('combobox',{name:'Polchely: '+code+(shelf?' / '+shelf:''),exact:true})});
  await scan('001234');assert.equal((await data()).length,1,'No scan counts before shelf selection');
  await choose(' A1 ');await page.locator('#barcode').press('Enter');
  assert((await page.locator('#knownShelf option').allTextContents()).includes('A1'),'Custom shelves remain selectable');
  await scan('001234');await scan('999');
  assert.equal((await data()).find(x=>x.barcode==='001234'&&x.shelf==='A1').quantity,2);
  assert.equal((await data()).find(x=>x.barcode==='001234'&&x.shelf==='A1').name,'Olajszűrő');
  await choose('B2');await scan('001234');
  assert.equal(await page.locator('#types').textContent(),'2','Distinct barcodes, not shelf rows');
  assert.equal(await page.locator('#total').textContent(),'8');
  await choose('a1');await scan('001234');
  assert.equal((await data()).find(x=>x.barcode==='001234'&&x.shelf==='A1').quantity,3,'Shelf case does not create duplicates');
  await page.locator('#shelfFilter').selectOption({label:'B2'});
  assert.equal(await page.locator('#rows tr').count(),1);
  assert.equal(await page.locator('#total').textContent(),'9','Totals stay global');
  await page.locator('#shelfFilter').selectOption('*');
  await page.locator('#search').fill('B2');assert.equal(await page.locator('#rows tr').count(),1);await page.locator('#search').fill('');
  // Assign the legacy stock to a shelf without changing its count.
  await row('001234','').getByRole('combobox',{name:'Polchely: 001234',exact:true}).fill('Régi polc');
  await row('001234','').getByRole('button',{name:'Mentés',exact:true}).click();
  assert.equal((await data()).find(x=>x.shelf==='Régi polc').quantity,4);
  // Moving into an existing destination explicitly merges counts, preserving total.
  page.on('dialog',dialog=>dialog.accept());
  await row('001234','B2').getByRole('combobox',{name:'Polchely: 001234 / B2',exact:true}).fill('A1');
  await row('001234','B2').getByRole('button',{name:'Mentés',exact:true}).click();
  assert.equal((await data()).find(x=>x.barcode==='001234'&&x.shelf==='A1').quantity,4);
  assert.equal(await page.locator('#total').textContent(),'9');
  await row('001234','A1').getByRole('textbox',{name:'Terméknév: 001234 / A1',exact:true}).fill('Közös terméknév');
  await row('001234','A1').getByRole('button',{name:'Mentés',exact:true}).click();
  assert((await data()).filter(x=>x.barcode==='001234').every(x=>x.name==='Közös terméknév'));
  const downloadEvent=page.waitForEvent('download');await page.locator('#backup').click();
  const saved=JSON.parse(await fs.readFile(await (await downloadEvent).path(),'utf8'));
  assert.equal(saved.version,2);assert(saved.products.some(x=>x.shelf==='Régi polc'));
  const csvEvent=page.waitForEvent('download');await page.locator('#csv').click();
  const csv=await fs.readFile(await (await csvEvent).path(),'utf8');assert(csv.includes('"Polchely"'));assert(csv.includes('"Régi polc"'));
  await page.reload();assert.equal(await page.locator('#total').textContent(),'9');
  assert.equal(await page.locator('#activeShelf').textContent(),'Még nincs kiválasztva');
  await page.getByText('Biztonsági mentés visszatöltése',{exact:true}).click();
  async function restore(products,version=2){await page.locator('#status').evaluate(e=>e.textContent='');await page.locator('#file').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({format:'bolti-leltar',version,products}))});await page.locator('#restore').click();await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Visszatölt'));}
  await restore(saved.products);assert.equal(await page.locator('#total').textContent(),'9','Repeated restore must not double stock');
  await restore([{barcode:'001234',name:'Polc C',shelf:'C3',quantity:7}]);
  assert.equal(await page.locator('#total').textContent(),'16');
  await restore([{barcode:'old',name:'Régi mentés',quantity:2}],1);
  assert((await data()).some(x=>x.barcode==='old'&&x.shelf===''&&x.quantity===2));
  await restore([{barcode:'bad',name:'',shelf:'X',quantity:1},{barcode:'bad',name:'',shelf:' x ',quantity:2}]);
  assert((await page.locator('#status').textContent()).includes('Visszatöltési hiba'));
  assert.equal(await page.locator('#total').textContent(),'18','Invalid imports must be atomic');
  assert.deepEqual(errors,[]);
  await page.screenshot({path:'/tmp/leltar-shelves.png',fullPage:true});
  await context.close();
  console.log('Shelf browser checks passed: legacy migration, required shelf, per-shelf counts, canonical names, global totals, filtering, edit/move/merge, shared product name, CSV, v1/v2 backups and duplicate rejection.');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});

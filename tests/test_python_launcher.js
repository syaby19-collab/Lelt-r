// Test the actual Python HTTP entry point with a temporary legacy SQLite DB.
const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const assert=require('node:assert/strict');
(async()=>{
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'leltar-launcher-'));
 const cwd=path.resolve(__dirname,'..');
 const script="import app; app.update({'barcode':'000123'},scan=True); app.update({'barcode':'000123','name':'Régi termék','quantity':3}); server=app.ThreadingHTTPServer(('127.0.0.1',0),app.Handler); print(server.server_port,flush=True); server.serve_forever()";
 const child=spawn('python3',['-c',script],{cwd,env:{...process.env,LELTAR_DB:path.join(tmp,'test.sqlite3')},stdio:['ignore','pipe','pipe']});
 child.stderr.resume();
 let browser;
 try{
  const port=await new Promise((resolve,reject)=>{
   let text='';const timer=setTimeout(()=>reject(Error('Python startup timed out')),10000);
   child.stdout.on('data',chunk=>{text+=chunk.toString();if(text.includes('\n')){clearTimeout(timer);resolve(Number(text.split('\n')[0]));}});
   child.once('error',error=>{clearTimeout(timer);reject(error);});
   child.once('exit',code=>{clearTimeout(timer);reject(Error('Python exited: '+code));});
  });
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
  const context=await browser.newContext();const page=await context.newPage();
  await page.goto('http://127.0.0.1:'+port);
  assert(await page.getByRole('heading',{name:'Bolt polctérképe',exact:true}).isVisible());
  assert.equal(await page.locator('#total').textContent(),'3');
  assert((await page.locator('#status').textContent()).includes('régi helyi adatbázisból'));
  assert.deepEqual(await page.evaluate(()=>read()),[{barcode:'000123',name:'Régi termék',shelf:'',quantity:3}]);
  await page.locator('#floorPanel').getByRole('button',{name:'Polc kiválasztása: bf polc 01',exact:true}).click();
  await page.locator('#barcode').fill('000123');await page.locator('#barcode').press('Enter');
  assert.equal(await page.locator('#total').textContent(),'4');
  await page.reload();assert.equal(await page.locator('#total').textContent(),'4','Reload does not re-add legacy quantities');
  const old=await page.evaluate(async()=>await (await fetch('/api/products')).json());
  assert.equal(old[0].quantity,3,'Legacy database remains unchanged');
  // Existing modern inventories must never be overwritten by the legacy seed.
  await page.evaluate(()=>localStorage.setItem('bolti-leltar-v1',JSON.stringify([{barcode:'999',name:'Új készlet',shelf:'01',quantity:7}])));
  await page.reload();assert.equal(await page.locator('#total').textContent(),'7');
  assert.equal((await page.evaluate(()=>read()))[0].barcode,'999');
  await page.screenshot({path:'/tmp/leltar-python-map.png',fullPage:true});
  await context.close();
  console.log('Python launcher browser checks passed: current map at HTTP root, legacy stock migration, scanner, reload without duplication, old database preservation, existing browser inventory preservation.');
 }finally{
  if(browser)await browser.close();child.kill();
  if(child.exitCode===null&&child.signalCode===null)await new Promise(resolve=>child.once('exit',resolve));
  await fs.rm(tmp,{recursive:true,force:true});
 }
})().catch(error=>{console.error(error);process.exitCode=1;});

// Optional development check: requires Playwright and Chromium; the app itself has no dependencies.
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');

(async () => {
  // Cloud browser policy blocks file: navigation; serve the exact standalone file
  // only for this test. Production usage does not require this server.
  const html = await fs.readFile(path.resolve(__dirname, '../Leltar.html'));
  const server = http.createServer((req, res) => {res.setHeader('Content-Type', 'text/html; charset=utf-8');res.end(html);});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox']});
  try {
    const context = await browser.newContext({acceptDownloads: true});
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:'+server.address().port);
    const barcode = page.locator('#barcode');
    await barcode.fill('001234');
    await page.waitForFunction(() => document.querySelector('#total').textContent === '1');
    await barcode.fill('001234');
    await barcode.press('Enter');
    await page.waitForTimeout(650);
    assert.equal(await page.locator('#total').textContent(), '2');
    assert.equal(await page.locator('#types').textContent(), '1');
    assert.equal(await page.locator('#rows tr').count(), 1);
    assert.equal(await barcode.inputValue(), '');
    assert.equal(await page.locator('#rows a').getAttribute('href'), 'https://www.ean-search.org/?q=001234');
    await page.getByRole('textbox', {name: 'Terméknév: 001234', exact: true}).fill('Olajszűrő');
    await page.getByRole('spinbutton', {name: 'Darabszám: 001234', exact: true}).fill('8');
    await page.getByRole('button', {name: 'Mentés', exact: true}).click();
    await page.reload();
    assert.equal(await page.locator('#total').textContent(), '8');
    assert.equal(await page.getByRole('textbox', {name: 'Terméknév: 001234', exact: true}).inputValue(), 'Olajszűrő');
    const backupEvent = page.waitForEvent('download');
    await page.locator('#backup').click();
    const backup = JSON.parse(await fs.readFile(await (await backupEvent).path(), 'utf8'));
    assert.deepEqual(backup.products, [{barcode: '001234', name: 'Olajszűrő', quantity: 8}]);
    const csvEvent = page.waitForEvent('download');
    await page.locator('#csv').click();
    const csv = await fs.readFile(await (await csvEvent).path(), 'utf8');
    assert(csv.includes('"001234";"Olajszűrő";"8"'));
    await page.locator('summary').click();
    async function importRows(products) {
      await page.locator('#file').setInputFiles({name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({format:'bolti-leltar',version:1,products}))});
      await page.locator('#restore').click();
    }
    page.on('dialog', dialog => dialog.accept());
    await importRows([{barcode:'001234',name:'Szűrő',quantity:3},{barcode:'999',name:'Teszt',quantity:1}]);
    await page.waitForFunction(() => document.querySelector('#total').textContent === '4');
    // Repeated restore replaces counts; it never adds them again.
    await importRows([{barcode:'001234',name:'Szűrő',quantity:3}]);
    await page.waitForFunction(() => document.querySelector('#status').textContent.includes('Visszatöltve: 1'));
    assert.equal(await page.locator('#total').textContent(), '4');
    await importRows([{barcode:'001234',name:'Szűrő',quantity:-1}]);
    await page.waitForFunction(() => document.querySelector('#status').textContent.includes('Visszatöltési hiba'));
    assert.equal(await page.locator('#total').textContent(), '4');
    await page.evaluate(() => {Storage.prototype.setItem = () => {throw Error('A tárhely megtelt');};});
    await barcode.fill('001234');
    await barcode.press('Enter');
    assert(await barcode.isDisabled());
    assert.equal(await page.locator('#total').textContent(), '4');
    assert((await page.locator('#status').textContent()).includes('NEM lett elmentve'));
    await page.reload();
    assert.equal(await page.locator('#total').textContent(), '4');
    assert.deepEqual(errors, []);
    await page.screenshot({path:'/tmp/leltar-standalone.png', fullPage:true});
    await context.close();
    console.log('Standalone browser checks passed: scan without Enter, repeated scan, no double count, editing, reload persistence, EAN link, JSON/CSV download, restore, invalid input and failed storage.');
  } finally {await browser.close();await new Promise(resolve => server.close(resolve));}
})().catch(error => {console.error(error);process.exitCode=1;});

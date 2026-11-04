// Scanner input regression checks without a browser or external dependencies.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '../static/index.html'), 'utf8');
const code = html.slice(html.indexOf('let queue='), html.indexOf("$('search').oninput"));
const fields = {barcode: {value: '', focus() {}}, automatic: {checked: true}, scan: {}};
const timers = new Map();
const calls = [];
let timerId = 0;
const context = vm.createContext({
  $: id => fields[id], items: [], render() {}, status() {}, alert() {},
  clearTimeout: id => timers.delete(id),
  setTimeout: callback => {timers.set(++timerId, callback); return timerId;},
  request: async (route, data) => {calls.push(data.barcode); return {...data, quantity: calls.length};}
});
vm.runInContext(code, context);
async function settle() { await vm.runInContext('queue', context); }
function input(value) { fields.barcode.value = value; fields.barcode.oninput(); }
function tick() {const pending = [...timers.values()]; timers.clear(); pending.forEach(fn => fn());}
function enter() {fields.scan.onsubmit({preventDefault() {}});}
(async () => {
  input('00'); input('001234');
  assert.equal(timers.size, 1, 'Each character resets the waiting period');
  tick(); await settle();
  assert.deepEqual(calls, ['001234'], 'A scanner without Enter saves exactly once');
  assert.equal(fields.barcode.value, '', 'Input clears for next scan');
  input('001234'); enter(); tick(); await settle();
  assert.deepEqual(calls, ['001234', '001234'], 'Enter cancels automatic submission');
  enter(); tick(); await settle();
  assert.equal(calls.length, 2, 'Empty submission does not count');
  input('987'); fields.automatic.checked = false; fields.automatic.onchange();
  tick(); await settle(); assert.equal(calls.length, 2, 'Disabling auto cancels pending timer');
  input('987654'); tick(); await settle(); assert.equal(calls.length, 2, 'Manual entry waits');
  enter(); await settle(); assert.equal(calls[2], '987654', 'Manual entry supports Enter');
  console.log('Scanner checks passed: no Enter, debounce, no duplicate count, manual mode.');
})().catch(error => {console.error(error); process.exitCode = 1;});

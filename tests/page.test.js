const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const path = require('node:path');
function load() {
  const file = path.resolve(__dirname, '../miniprogram/pages/index/index.js');
  let page;
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), { require: createRequire(file), Page(p) { page = p; }, wx: { showToast() {}, navigateTo() {} } });
  page.setData = function(data) { Object.assign(this.data, data); };
  return page;
}
test('示例、计算、清空和定缺改变后结果失效', () => {
  const page = load(); page.sample(); page.calculate();
  assert.match(page.data.result, /可组成胡牌/); assert.match(page.data.result, /待确认/);
  page.changeSuit({ detail: { value: '0' } }); assert.equal(page.data.result, '');
  page.calculate(); assert.match(page.data.result, /定缺/);
  page.clear(); assert.equal(page.data.count, 0); assert.equal(page.data.result, '');
});
test('录牌数量限制与移除', () => {
  const page = load(); const event = { currentTarget: { dataset: { id: 'm1' } } };
  for (let n = 0; n < 5; n++) page.addTile(event);
  assert.equal(page.data.count, 4);
  page.removeTile({ currentTarget: { dataset: { index: 0 } } }); assert.equal(page.data.count, 3);
  page.sample(); page.addTile(event); assert.equal(page.data.count, 14);
});

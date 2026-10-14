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
  assert.match(page.data.result, /可组成胡牌/); assert.equal(page.data.scoring.fan, 0); assert.equal(page.data.scoring.points, 1);
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
test('碰杠录入改变手牌目标且含副露同牌最多四张', () => {
  const page = load();
  page.changePicker({currentTarget:{dataset:{key:'entryIndex'}},detail:{value:'2'}});
  page.addTile({currentTarget:{dataset:{id:'m1'}}});
  assert.equal(page.data.melds.length,1); assert.equal(page.data.target,11);
  page.changePicker({currentTarget:{dataset:{key:'entryIndex'}},detail:{value:'0'}});
  page.addTile({currentTarget:{dataset:{id:'m1'}}}); assert.equal(page.data.count,0);
  for (const id of ['m4','m5','m6','p1','p2','p3','p7','p8','p9','p5','p5']) page.addTile({currentTarget:{dataset:{id}}});
  page.changePicker({currentTarget:{dataset:{key:'finishIndex'}},detail:{value:'1'}});
  page.calculate(); assert.equal(page.data.scoring.fan,3);
  page.removeMeld({currentTarget:{dataset:{index:0}}}); assert.equal(page.data.target,14); assert.equal(page.data.scoring,null);
});
test('更改底分、经过和番表均清除旧结果，海底需显式启用', () => {
  const page = load(); page.sample(); page.calculate();
  page.changeNumber({currentTarget:{dataset:{key:'base'}},detail:{value:'2.5'}}); assert.equal(page.data.scoring,null);
  page.calculate(); assert.equal(page.data.scoring.points,2.5);
  page.changeEvent({currentTarget:{dataset:{key:'sea'}},detail:{value:true}}); page.calculate(); assert.match(page.data.result,/启用海底/);
  page.changeOptional({currentTarget:{dataset:{key:'sea'}},detail:{value:true}}); page.calculate(); assert.equal(page.data.scoring.fan,1);
  page.changeRule({currentTarget:{dataset:{key:'sea'}},detail:{value:'2'}}); page.calculate(); assert.equal(page.data.scoring.fan,2);
  page.changeNumber({currentTarget:{dataset:{key:'cap'}},detail:{value:''}}); page.calculate(); assert.equal(page.data.scoring,null);
});

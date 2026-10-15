const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {createRequire}=require('node:module');
const path=require('node:path');
function load(){const file=path.resolve(__dirname,'../miniprogram/pages/index/index.js');let page;vm.runInNewContext(fs.readFileSync(file,'utf8'),{require:createRequire(file),Page(p){page=p;},wx:{showToast(){},navigateTo(){}}});page.setData=function(data,callback){Object.assign(this.data,data);if(callback)callback();};return page;}
const normal=['m1','m2','m3','m4','m5','m6','p1','p2','p3','p7','p8','p9','p5','p5'];
const tap=(key,value)=>({currentTarget:{dataset:{key,value}}});
const tile=id=>({currentTarget:{dataset:{id}}});
const select=index=>({currentTarget:{dataset:{index}}});
test('录入限制、选牌移除、更改选项与清空均清除旧结果',()=>{
 const page=load();for(let n=0;n<5;n++)page.addTile(tile('m1'));assert.equal(page.data.count,4);
 page.selectTile(select(0));page.removeFocused();assert.equal(page.data.count,3);
 page.updateHand(normal);page.addTile(tile('m9'));assert.equal(page.data.count,14);page.calculate();assert.equal(page.data.scoring.points,1);
 page.changeBase({detail:{value:'2'}});assert.equal(page.data.scoring,null);page.calculate();assert.equal(page.data.scoring.points,2);
 page.clear();assert.equal(page.data.count,0);assert.equal(page.data.melds.length,0);
});
test('从手牌转碰，保留实体数量；退回碰不丢牌',()=>{
 const page=load();page.updateHand(['m1','m1','m1','m4','m5','m6','p1','p2','p3','p7','p8','p9','p5','p5']);
 page.selectTile(select(0));page.makeMeld({currentTarget:{dataset:{type:'pong'}}});assert.equal(page.data.count,11);assert.equal(page.data.target,11);assert.equal(page.data.melds.length,1);
 page.calculate();assert.ok(page.data.scoring);page.restoreMeld(select(0));assert.equal(page.data.count,14);assert.equal(page.data.target,14);assert.equal(page.data.hand.filter(t=>t==='m1').length,3);
});
test('从手牌转杠后补牌，退回杠保留全部四张并允许移除多余补牌',()=>{
 const page=load();page.updateHand(['m1','m1','m1','m1','m4','m5','m6','p1','p2','p3','p7','p8','p9','p5']);page.selectTile(select(0));
 page.makeMeld({currentTarget:{dataset:{type:'kong'}}});assert.equal(page.data.count,10);assert.equal(page.data.target,11);
 page.addTile(tile('p5'));page.addTile(tile('m1'));assert.equal(page.data.count,11);
 page.choose(tap('finishIndex',1));page.calculate();assert.equal(page.data.scoring.fan,4); // root + kong draw 2 + self draw 1
 page.restoreMeld(select(0));assert.equal(page.data.count,15);assert.equal(page.data.target,14);assert.equal(page.data.hand.filter(t=>t==='m1').length,4);
 page.selectTile(select(0));page.removeFocused();assert.equal(page.data.count,14);
});
test('不足同牌不能转碰杠，无选牌和非法索引不改变牌面',()=>{
 const page=load();page.updateHand(normal);page.makeMeld({currentTarget:{dataset:{type:'kong'}}});assert.equal(page.data.count,14);
 page.selectTile(select(0));page.makeMeld({currentTarget:{dataset:{type:'pong'}}});assert.equal(page.data.melds.length,0);
 page.restoreMeld(select(99));assert.equal(page.data.count,14);page.selectTile(select(99));assert.equal(page.data.selectedIndex,0);
});
test('直接点选联动避免明显冲突，自摸默认翻倍并包含在封顶',()=>{
 const page=load();page.updateHand(normal);page.choose(tap('winIndex',1));page.calculate();assert.equal(page.data.scoring.factor,2);assert.equal(page.data.formulaVisible,true);
 page.choose(tap('openingIndex',1));assert.equal(page.data.winIndex,1);page.choose(tap('winIndex',0));assert.equal(page.data.openingIndex,0);
 page.choose(tap('finishIndex',3));assert.equal(page.data.winIndex,0);page.choose(tap('winIndex',1));assert.equal(page.data.finishIndex,0);
 page.toggleEvent(tap('sea'));page.calculate();assert.equal(page.data.scoring.fan,2);
 page.changeCap({detail:{value:'0'}});assert.equal(page.data.cap,'1');page.calculate();assert.equal(page.data.scoring.fan,1);
 page.changeCap({detail:{value:'7'}});assert.equal(page.data.cap,'8');page.changeCap({detail:{value:'15'}});assert.equal(page.data.cap,'16');page.changeCap({detail:{value:'16'}});assert.equal(page.data.cap,'16');
});
test('算式、次方色彩与解释倍数保持一致；没有练习与额外倍数输入',()=>{
 const page=load();assert.equal(page.sample,undefined);assert.equal(page.data.multiplier,undefined);
 page.updateHand(['m1','m1','m1','m1','m2','m2','m3','m3','m4','m4','m5','m5','m6','m6']);page.changeCap({detail:{value:'7'}});page.calculate();
 assert.equal(page.data.scoring.fan,5);assert.match(page.data.scoring.fanClass,/gradient-ink/);
 const dragon=page.data.scoring.lines.find(l=>l.key==='dragonPairs');assert.equal(dragon.tone,'crimson');assert.equal(dragon.factor,8);
 assert.equal(page.data.scoring.lines.find(l=>l.key==='pureSuit').tone,'blue');assert.equal(page.data.scoring.points,32);
 page.changeBase({detail:{value:'2.5'}});assert.equal(page.data.scoring,null);page.calculate();assert.equal(page.data.scoring.points,80);
 page.changeBase({detail:{value:''}});page.calculate();assert.equal(page.data.scoring,null);
});

test('自动检查缺门，包含明牌；不再依赖定缺选择',()=>{
 const page=load();
 page.updateHand(['m1','m2','m3','m4','m5','m6','s1','s2','s3','s7','s8','s9','s5','s5']);
 page.calculate();assert.ok(page.data.scoring);assert.equal(page.data.missingIndex,undefined);
 page.updateHand(['m1','m2','m3','p4','p5','p6','s1','s2','s3','s7','s8','s9','s5','s5']);
 page.calculate();assert.equal(page.data.scoring,null);assert.match(page.data.result,/缺一门/);
 page.updateHand(['p4','p5','p6','s1','s2','s3','s7','s8','s9','s5','s5'],[{type:'pong',tile:'m1'}]);
 page.calculate();assert.equal(page.data.scoring,null);assert.match(page.data.result,/缺一门/);
});

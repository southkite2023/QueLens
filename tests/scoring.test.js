const test = require('node:test');
const assert = require('node:assert/strict');
const { analyzeHand } = require('../miniprogram/domain/hand');
const { scoreHand } = require('../miniprogram/domain/scoring');
const rules = require('../miniprogram/domain/rules');
const normal = 'm1 m2 m3 m4 m5 m6 p1 p2 p3 p7 p8 p9 p5 p5';
const context = {winType:'discard',opening:'none',finish:'normal',sea:false,declaredReady:false};
const settings = {base:'1',multiplier:'1',cap:'16'};
const analyze = (s,melds=[]) => analyzeHand({concealed:s.split(' '),melds,missingSuit:'s'});
function score(s, {melds=[],profile=rules,events={},config={}}={}) { return scoreHand(analyze(s,melds),profile,{...context,...events},{...settings,...config}); }
test('参考番表：普通、对对、清一色、七对、龙七对和清龙；不重复计基础型或龙根', () => {
  assert.equal(score(normal).fan,0);
  assert.equal(score('m1 m1 m1 m2 m2 m2 p3 p3 p3 p4 p4 p4 p5 p5').fan,1);
  assert.equal(score('m1 m2 m3 m2 m3 m4 m5 m6 m7 m7 m8 m9 m5 m5').fan,2);
  assert.equal(score('m1 m1 m2 m2 m3 m3 p1 p1 p2 p2 p3 p3 p4 p4').fan,2);
  assert.equal(score('m1 m1 m1 m1 m2 m2 m3 m3 p1 p1 p2 p2 p3 p3').fan,3);
  const dragon = score('m1 m1 m1 m1 m2 m2 m3 m3 m4 m4 m5 m5 m6 m6');
  assert.equal(dragon.fan,5); assert.equal(dragon.lines.filter(l => l.key === 'root').length,0);
  assert.equal(score('m1 m1 m1 m1 m2 m2 m2 m2 p3 p3 p4 p4 p5 p5').fan,4);
});
test('幺九需要每组与将符合条件；将对可关；金钩钓依赖真实副露', () => {
  assert.equal(score('m1 m2 m3 m7 m8 m9 p1 p2 p3 p9 p9 p9 p1 p1').fan,2);
  assert.equal(score('m1 m2 m3 m7 m8 m9 p1 p2 p3 p9 p9 p9 p5 p5').fan,0);
  const jiang = 'm2 m2 m2 m5 m5 m5 p2 p2 p2 p8 p8 p8 p5 p5';
  assert.equal(score(jiang).fan,3);
  assert.equal(score(jiang,{profile:{...rules,optional:{...rules.optional,jiangTriplets:false}}}).fan,1);
  assert.equal(score('p5 p5',{melds:['m1','m2','p3','p4'].map(tile=>({type:'pong',tile}))}).fan,2);
});
test('特殊事件：天地替代牌型与根，杠上花2番，杠上炮/抢杠1番', () => {
  assert.equal(score(normal,{events:{winType:'self',opening:'heaven'}}).fan,5);
  assert.equal(score(normal,{events:{winType:'self',opening:'earth'}}).fan,5);
  const kong = score('m4 m5 m6 p1 p2 p3 p7 p8 p9 p5 p5',{melds:[{type:'kong',tile:'m1'}],events:{winType:'self',finish:'kongDraw'}});
  assert.equal(kong.fan,4); // 1 root + 2 event fan + 1 self draw
  assert.equal(score(normal,{events:{finish:'kongDiscard'}}).fan,1);
  assert.equal(score(normal,{events:{finish:'robKong'}}).fan,1);
  assert.throws(()=>score(normal,{events:{opening:'heaven'}}),/天地胡/);
  assert.throws(()=>score(normal,{events:{winType:'self',finish:'kongDraw'}}),/至少一组杠/);
  assert.throws(()=>score(normal,{events:{winType:'self',finish:'robKong'}}),/点炮胡/);
  assert.throws(()=>score(normal,{events:{sea:true}}),/启用海底/);
  assert.throws(()=>score(normal,{events:{declaredReady:true}}),/启用报叫/);
  assert.equal(score(normal,{profile:{...rules,optional:{...rules.optional,sea:true}},events:{sea:true}}).fan,1);
});
test('自摸加底/加番，封顶先后与天地封顶可选，分值按单份算', () => {
  const pairs = 'm1 m1 m2 m2 m3 m3 p1 p1 p2 p2 p3 p3 p4 p4';
  const baseProfile = {...rules,selfDrawMode:'base'};
  const r=score(pairs,{profile:baseProfile,events:{winType:'self'},config:{cap:'1',base:'2.5',multiplier:'2'}});
  assert.equal(r.fan,1); assert.equal(r.factor,3); assert.equal(r.points,15);
  assert.equal(score(pairs,{profile:{...rules,selfDrawMode:'fan'},events:{winType:'self'},config:{cap:'2'}}).fan,2);
  assert.equal(score(pairs,{profile:{...rules,selfDrawMode:'fan',capMode:'base'},events:{winType:'self'},config:{cap:'2'}}).fan,3);
  assert.equal(score(normal,{profile:{...baseProfile,openingMode:'cap'},events:{winType:'self',opening:'heaven'},config:{cap:'3'}}).factor,8);
});
test('空值、小数番、负值、非数值和精度异常拒绝，未胡不算', () => {
  for (const config of [{cap:''},{cap:'1.5'},{cap:'17'},{base:'0'},{base:'-1'},{multiplier:'NaN'},{base:'0.001'},{multiplier:''}]) assert.throws(()=>score(normal,{config}));
  assert.throws(()=>score(normal,{profile:{...rules,events:{...rules.events,sea:-1}}}),/每项番数/);
  assert.equal(scoreHand({status:'not-winning'},rules,context,settings).status,'unavailable');
});

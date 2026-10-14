const test = require('node:test');
const assert = require('node:assert/strict');
const { analyzeHand } = require('../miniprogram/domain/hand');
const { scoreBasicHand } = require('../miniprogram/domain/scoring');
const draft = require('../miniprogram/domain/rules');
const hand = (tiles, melds = [], missingSuit = 's') => ({ concealed: tiles.split(' '), melds, missingSuit });
const normal = hand('m1 m2 m3 m4 m5 m6 p1 p2 p3 p7 p8 p9 p5 p5');
const triplets = hand('m1 m1 m1 m2 m2 m2 p3 p3 p3 p4 p4 p4 p5 p5');
const pairs = hand('m1 m1 m2 m2 m3 m3 p1 p1 p2 p2 p3 p3 p4 p4');
const pure = hand('m1 m2 m3 m2 m3 m4 m5 m6 m7 m7 m8 m9 m5 m5');
test('普通胡牌、对对胡、七对、清一色', () => {
  assert.deepEqual(analyzeHand(normal).patterns, ['standard']);
  assert.ok(analyzeHand(triplets).patterns.includes('allTriplets'));
  assert.ok(analyzeHand(pairs).patterns.includes('sevenPairs'));
  assert.ok(analyzeHand(pure).patterns.includes('pureSuit'));
});
test('搜索所有拆解，发现顺子与刻子歧义', () => {
  const result = analyzeHand(hand('m1 m1 m1 m2 m2 m2 m3 m3 m3 p4 p4 p4 p5 p5'));
  assert.ok(result.decompositions.length > 1);
  assert.ok(result.patterns.includes('allTriplets'));
});
test('根与龙七对结构（四张算两对）', () => {
  const result = analyzeHand(hand('m1 m1 m1 m1 m2 m2 m3 m3 p1 p1 p2 p2 p3 p3'));
  assert.equal(result.roots, 1);
  assert.ok(result.patterns.includes('sevenPairs'));
});
test('非胡牌、未打完定缺、三门、数量错误', () => {
  assert.equal(analyzeHand(hand('m1 m2 m3 m4 m5 m6 p1 p2 p3 p7 p8 p9 p5 p6')).status, 'not-winning');
  assert.equal(analyzeHand({ ...normal, missingSuit: 'm' }).status, 'invalid');
  assert.equal(analyzeHand(hand('m1 m2 m3 p1 p2 p3 s1 s2 s3 m4 m5 m6 p5 p5')).status, 'invalid');
  assert.equal(analyzeHand(hand('m1 m1')).status, 'invalid');
});
test('拒绝超过四张、字牌、无定缺、空输入', () => {
  assert.equal(analyzeHand(hand('m1 m1 m1 m1 m1 m2 m3 p1 p2 p3 p4 p5 p6 p7')).status, 'invalid');
  assert.equal(analyzeHand({ ...normal, concealed: ['east'].concat(normal.concealed.slice(1)) }).status, 'invalid');
  assert.equal(analyzeHand({ ...normal, missingSuit: '' }).status, 'invalid');
  assert.equal(analyzeHand(null).status, 'invalid');
});
test('碰杠缩减手牌数，杠按四张实体牌计算根', () => {
  const result = analyzeHand(hand('m4 m5 m6 p1 p2 p3 p7 p8 p9 p5 p5', [{ type: 'kong', tile: 'm1' }]));
  assert.equal(result.status, 'winning'); assert.equal(result.roots, 1);
  assert.equal(analyzeHand(hand('m1 m2 m3 p1 p2 p3 p7 p8 p9 p5 p5', [{ type: 'kong', tile: 'm1' }])).status, 'invalid');
});
test('禁止吃副露与副露七对', () => {
  assert.equal(analyzeHand(hand('m4 m5 m6 p1 p2 p3 p7 p8 p9 p5 p5', [{ type: 'chow', tile: 'm1' }])).status, 'invalid');
  assert.ok(!analyzeHand(hand('m4 m5 m6 p1 p2 p3 p7 p8 p9 p5 p5', [{ type: 'pong', tile: 'm1' }])).patterns.includes('sevenPairs'));
});
test('四副露单吊；不修改调用方数据', () => {
  const input = hand('p5 p5', ['m1','m2','p3','p4'].map(tile => ({ type: 'pong', tile })));
  const copy = JSON.stringify(input);
  assert.ok(analyzeHand(input).patterns.includes('allTriplets'));
  assert.equal(JSON.stringify(input), copy);
});
test('牌顺序不影响结果', () => {
  assert.deepEqual(analyzeHand({ ...normal, concealed: normal.concealed.slice().reverse() }), analyzeHand(normal));
});
test('未确认场规绝不展示数值', () => {
  const result = scoreBasicHand(analyzeHand(normal), { ...draft, confirmed: false });
  assert.equal(result.status, 'rules-pending'); assert.equal(result.fan, undefined);
});
test('明确配置的基础番计算、互斥、叠加与封顶', () => {
  const profile = { ...draft, confirmed: true, cap: 4 };
  assert.equal(scoreBasicHand(analyzeHand(normal), profile).fan, 0);
  assert.equal(scoreBasicHand(analyzeHand(triplets), profile).fan, 1);
  assert.equal(scoreBasicHand(analyzeHand(pairs), profile).fan, 2);
  const dragon = analyzeHand(hand('m1 m1 m1 m1 m2 m2 m3 m3 m4 m4 m5 m5 m6 m6'));
  assert.equal(scoreBasicHand(dragon, profile).rawFan, 5);
  assert.equal(scoreBasicHand(dragon, profile).fan, 4);
  assert.equal(scoreBasicHand(dragon, profile).includesEventFan, false);
});
test('非法配置拒绝计算', () => {
  assert.throws(() => scoreBasicHand(analyzeHand(normal), { confirmed: true }));
  assert.throws(() => scoreBasicHand(analyzeHand(normal), { ...draft, confirmed: true, cap: -1 }));
});

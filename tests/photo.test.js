const test = require('node:test');
const assert = require('node:assert/strict');
const { choosePhoto } = require('../miniprogram/services/photo');
const enabled = { photoEnabled: true, recognitionReady: true };
test('默认不访问隐私接口；未准备识牌也不开启', async () => {
  let called = false;
  await assert.rejects(choosePhoto({ requirePrivacyAuthorize() { called = true; } }, require('../miniprogram/config')));
  await assert.rejects(choosePhoto({}, { photoEnabled: true, recognitionReady: false }));
  assert.equal(called, false);
});
test('低版本不可绕过隐私授权', async () => { await assert.rejects(choosePhoto({ chooseMedia() {} }, enabled), /更新微信/); });
test('先授权，后选择；只返回临时照片路径', async () => {
  const order = [];
  const result = await choosePhoto({
    requirePrivacyAuthorize(opts) { order.push('privacy'); opts.success(); },
    chooseMedia(opts) { order.push('media'); assert.deepEqual(opts.mediaType, ['image']); assert.equal(opts.count, 1); opts.success({ tempFiles: [{ tempFilePath: '/tmp/test.jpg' }] }); }
  }, enabled);
  assert.deepEqual(order, ['privacy', 'media']); assert.deepEqual(result, { path: '/tmp/test.jpg' });
});
test('授权拒绝不读取照片', async () => {
  let called = false;
  await assert.rejects(choosePhoto({ requirePrivacyAuthorize(opts) { opts.fail(new Error('拒绝')); }, chooseMedia() { called = true; } }, enabled), /拒绝/);
  assert.equal(called, false);
});
test('选择取消、空结果都可恢复', async () => {
  await assert.rejects(choosePhoto({ requirePrivacyAuthorize(o) { o.success(); }, chooseMedia(o) { o.fail(new Error('取消')); } }, enabled), /取消/);
  await assert.rejects(choosePhoto({ requirePrivacyAuthorize(o) { o.success(); }, chooseMedia(o) { o.success({ tempFiles: [] }); } }, enabled), /有效照片/);
});

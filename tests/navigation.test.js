const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { createRequire } = require('node:module');
const { regions, variants, playUrl } = require('../miniprogram/domain/regions');
const { matchLocation, locateVariant } = require('../miniprogram/services/location');
function load(name, api) {
  const file = path.resolve(__dirname, '../miniprogram/pages/' + name + '/' + name + '.js');
  let page;
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), { require: createRequire(file), Page(p) { page = p; }, wx: api });
  page.setData = function(data) { Object.assign(this.data, data); };
  return page;
}
const event = id => ({ currentTarget: { dataset: { id } } });
test('三个地区入口、四个四川城市与三/四人日麻跳转', () => {
  const urls = [];
  const api = { navigateTo(o) { urls.push(o.url); }, setNavigationBarTitle() {}, redirectTo(o) { urls.push(o.url); } };
  const home = load('home', api);
  for (const region of regions) home.openRegion(event(region.id));
  assert.deepEqual(urls, ['/pages/region/region?id=sichuan', '/pages/play/play?variant=national', '/pages/region/region?id=riichi']);
  const region = load('region', api);
  region.onLoad({ id: 'sichuan' });
  assert.equal(region.data.variants.length, 4);
  region.onLoad({ id: 'riichi' });
  assert.deepEqual(region.data.variants.map(v => v.id), ['riichi3', 'riichi4']);
  for (const variant of variants) {
    assert.ok(fs.existsSync(path.resolve(__dirname, '../miniprogram/assets/regions/' + variant.art + '.svg')));
    const count = urls.length;
    const play = load('play', api); play.onLoad({ variant: variant.id });
    if (variant.ready) {
      assert.equal(playUrl(variant.id), '/pages/index/index?variant=' + variant.id);
      assert.equal(urls[count], playUrl(variant.id));
    } else {
      assert.equal(playUrl(variant.id), '/pages/play/play?variant=' + variant.id);
      assert.equal(play.data.variant.id, variant.id);
    }
  }
});
test('未知入口安全回到首页', () => {
  let url;
  const api = { redirectTo(o) { url = o.url; } };
  load('region', api).onLoad({ id: 'unknown' }); assert.equal(url, '/pages/home/home');
  load('play', api).onLoad({ variant: 'unknown' }); assert.equal(url, '/pages/home/home');
});
test('只匹配精度可靠的附近城市，不把远处位置强制分配到四川', () => {
  for (const [lat, lng, id] of [[30.5728,104.0668,'chengdu'],[28.8717,105.4423,'luzhou'],[29.5521,103.7656,'leshan'],[29.5802,105.0584,'neijiang']]) assert.equal(matchLocation(lat,lng,100).id,id);
  for (const args of [[31.23,121.47,100],[35.68,139.69,100],[30.5728,104.0668,9000],[NaN,104,100],[91,104,100],[30.5728,104.0668,undefined]]) assert.equal(matchLocation(...args),null);
});
test('定位严格先隐私授权，拒绝后不访问位置', async () => {
  const calls = [];
  const result = await locateVariant({ requirePrivacyAuthorize(o) { calls.push('privacy'); o.success(); }, getLocation(o) { calls.push('location'); o.success({latitude:30.5728,longitude:104.0668,accuracy:100}); } });
  assert.deepEqual(calls,['privacy','location']); assert.equal(result.id,'chengdu');
  await assert.rejects(locateVariant({ requirePrivacyAuthorize(o) { o.fail(); }, getLocation() { assert.fail('不得读取位置'); } }), /未同意/);
  await assert.rejects(locateVariant({ requirePrivacyAuthorize(o) { o.success(); }, getLocation(o) { o.fail(); } }), /定位未授权/);
  await assert.rejects(locateVariant({}), /不支持/);
});
test('首页定位成功跳转；未匹配、拒绝和失败可恢复手动选择', async () => {
  for (const mode of ['success','outside','deny','failure']) {
    let url;
    const api = {
      requirePrivacyAuthorize(o) { mode === 'deny' ? o.fail() : o.success(); },
      getLocation(o) { mode === 'failure' ? o.fail() : o.success({latitude:mode === 'outside' ? 0 : 30.5728,longitude:104.0668,accuracy:100}); },
      navigateTo(o) { url = o.url; }
    };
    const page = load('home',api); await page.locate();
    assert.equal(page.data.locating,false);
    assert.equal(url,mode === 'success' ? '/pages/index/index?variant=chengdu' : undefined);
    assert.ok(page.data.locationMessage);
    page.openRegion(event('sichuan')); assert.equal(url,'/pages/region/region?id=sichuan');
  }
});

const { getVariant } = require('../domain/regions');
// Only match near these city centers. This is a nearby-city hint, not administrative geocoding.
const cities = [
  { id: 'chengdu', lat: 30.5728, lng: 104.0668 },
  { id: 'luzhou', lat: 28.8717, lng: 105.4423 },
  { id: 'leshan', lat: 29.5521, lng: 103.7656 },
  { id: 'neijiang', lat: 29.5802, lng: 105.0584 }
];
function matchLocation(latitude, longitude, accuracy) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  if (!Number.isFinite(accuracy) || accuracy < 0 || accuracy > 5000) return null;
  const rad = value => value * Math.PI / 180;
  const distances = cities.map(city => {
    const a = Math.sin(rad(city.lat - latitude) / 2) ** 2 + Math.cos(rad(latitude)) * Math.cos(rad(city.lat)) * Math.sin(rad(city.lng - longitude) / 2) ** 2;
    return { id: city.id, km: 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, a))) };
  }).sort((a, b) => a.km - b.km);
  return distances[0].km + accuracy / 1000 <= 35 ? getVariant(distances[0].id) : null;
}
function locateVariant(api) {
  if (typeof api.requirePrivacyAuthorize !== 'function' || typeof api.getLocation !== 'function') return Promise.reject(new Error('当前微信不支持定位授权，请更新微信或手动选择。'));
  return new Promise((resolve, reject) => {
    api.requirePrivacyAuthorize({
      success() {
        api.getLocation({ type: 'wgs84', isHighAccuracy: false,
          success(result) { resolve(matchLocation(result.latitude, result.longitude, result.accuracy)); },
          fail() { reject(new Error('定位未授权或暂不可用，请手动选择；如需重试，可在微信设置中开启位置权限。')); }
        });
      },
      fail() { reject(new Error('未同意位置隐私授权，仍可手动选择玩法。')); }
    });
  });
}
module.exports = { matchLocation, locateVariant };

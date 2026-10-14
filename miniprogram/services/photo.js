function choosePhoto(api, config) {
  if (!config.photoEnabled || !config.recognitionReady) return Promise.reject(new Error('拍照识牌尚未开放，请使用手动录牌'));
  if (typeof api.requirePrivacyAuthorize !== 'function' || typeof api.chooseMedia !== 'function') return Promise.reject(new Error('请更新微信后使用拍照功能'));
  return new Promise((resolve, reject) => {
    // 使用微信官方隐私弹窗；拒绝时不选择/上传照片。
    api.requirePrivacyAuthorize({
      success() {
        api.chooseMedia({ count: 1, mediaType: ['image'], sourceType: ['camera', 'album'], sizeType: ['compressed'],
          success(result) {
            const file = result.tempFiles && result.tempFiles[0];
            if (!file || !file.tempFilePath) return reject(new Error('未选择有效照片'));
            resolve({ path: file.tempFilePath }); // 临时路径，不持久化，不上传
          }, fail: reject });
      }, fail: reject
    });
  });
}
module.exports = { choosePhoto };

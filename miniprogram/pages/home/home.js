const { regions, playUrl } = require('../../domain/regions');
const { locateVariant } = require('../../services/location');
Page({
  data: { regions, locating: false, locationMessage: '' },
  openRegion(event) {
    if (this.data.locating) return;
    const id = event.currentTarget.dataset.id;
    if (!regions.some(item => item.id === id)) return;
    wx.navigateTo({ url: id === 'national' ? playUrl(id) : '/pages/region/region?id=' + id });
  },
  async locate() {
    if (this.data.locating) return;
    this.setData({ locating: true, locationMessage: '' });
    try {
      const variant = await locateVariant(wx);
      if (!variant) return this.setData({ locationMessage: '附近暂未匹配到已收录的城市，请手动选择玩法。' });
      this.setData({ locationMessage: '已匹配附近城市：' + variant.name + '，可返回首页更换。' });
      wx.navigateTo({ url: playUrl(variant.id), fail: () => this.setData({ locationMessage: '页面打开失败，请手动选择玩法。' }) });
    } catch (error) { this.setData({ locationMessage: error.message || '未能获取位置，请手动选择玩法。' }); }
    finally { this.setData({ locating: false }); }
  },
  about() { wx.navigateTo({ url: '/pages/about/about' }); }
});

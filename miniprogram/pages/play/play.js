const { getVariant } = require('../../domain/regions');
Page({
  data: { variant: null },
  onLoad(options) {
    const variant = getVariant(options.variant);
    if (!variant) return wx.redirectTo({ url: '/pages/home/home' });
    this.setData({ variant });
    wx.setNavigationBarTitle({ title: variant.name });
  },
  practice() { if (this.data.variant && this.data.variant.ready) wx.navigateTo({ url: '/pages/index/index' }); },
  home() { wx.reLaunch({ url: '/pages/home/home' }); }
});
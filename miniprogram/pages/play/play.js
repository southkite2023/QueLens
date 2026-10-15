const { getVariant } = require('../../domain/regions');
Page({
  data: { variant: null },
  onLoad(options) {
    const variant = getVariant(options.variant);
    if (!variant) return wx.redirectTo({ url: '/pages/home/home' });
    if (variant.ready) return wx.redirectTo({ url: '/pages/index/index?variant=' + encodeURIComponent(variant.id) });
    this.setData({ variant });
    wx.setNavigationBarTitle({ title: variant.name });
  },
  home() { wx.reLaunch({ url: '/pages/home/home' }); }
});
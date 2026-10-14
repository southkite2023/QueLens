const { regions, variants, playUrl } = require('../../domain/regions');
Page({
  data: { region: null, variants: [] },
  onLoad(options) {
    const region = regions.find(item => item.id === options.id);
    if (!region) return wx.redirectTo({ url: '/pages/home/home' });
    this.setData({ region, variants: variants.filter(item => item.region === region.id) });
    wx.setNavigationBarTitle({ title: region.name });
  },
  openPlay(event) {
    const id = event.currentTarget.dataset.id;
    if (this.data.variants.some(item => item.id === id)) wx.navigateTo({ url: playUrl(id) });
  }
});
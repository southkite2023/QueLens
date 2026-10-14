const { TILES, SUIT_NAMES, label } = require('../../domain/tiles');
const { analyzeHand } = require('../../domain/hand');
const { scoreBasicHand } = require('../../domain/scoring');
const rules = require('../../domain/rules');
const names = { standard: '四组面子和一对将', allTriplets: '对对胡', sevenPairs: '七对', pureSuit: '清一色' };
Page({
  data: { palette: TILES.map(id => ({ id, label: label(id) })), hand: [], selected: [], suits: ['万', '筒', '条'], missingIndex: 2, result: '', count: 0 },
  updateHand(hand) { this.setData({ hand, selected: hand.map((id, index) => ({ id, index, label: label(id) })), count: hand.length, result: '' }); },
  addTile(event) {
    const id = event.currentTarget.dataset.id;
    if (TILES.indexOf(id) < 0) return;
    const hand = this.data.hand;
    if (hand.length >= 14 || hand.filter(x => x === id).length >= 4) return wx.showToast({ title: '最多14张，同牌最多4张', icon: 'none' });
    this.updateHand(hand.concat(id));
  },
  removeTile(event) { const hand = this.data.hand.slice(); hand.splice(Number(event.currentTarget.dataset.index), 1); this.updateHand(hand); },
  clear() { this.updateHand([]); },
  changeSuit(event) { this.setData({ missingIndex: Number(event.detail.value), result: '' }); },
  sample() { this.setData({ missingIndex: 2 }); this.updateHand(['m1','m2','m3','m4','m5','m6','p1','p2','p3','p7','p8','p9','p5','p5']); },
  calculate() {
    const missingSuit = ['m', 'p', 's'][this.data.missingIndex];
    const analysis = analyzeHand({ concealed: this.data.hand.slice(), melds: [], missingSuit });
    if (analysis.status !== 'winning') return this.setData({ result: analysis.error });
    const scoring = scoreBasicHand(analysis, rules);
    const details = analysis.patterns.map(k => names[k]).join('、') + (analysis.roots ? '，根数：' + analysis.roots : '');
    this.setData({ result: '可组成胡牌：' + details + '。' + (scoring.status === 'rules-pending' ? '番数表待确认，当前仅展示牌型。' : '基础番数：' + scoring.fan + '，未含事件番。') });
  },
  about() { wx.navigateTo({ url: '/pages/about/about' }); }
});

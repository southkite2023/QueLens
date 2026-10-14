// Reference profile, not a claim of one universal Chengdu rulebook.
// Fan uses 0 = 1x, 1 = 2x. Tournament base values: SSVA 2025 attachment 2-5.
module.exports = {
  id: 'chengdu-reference-v2', name: '成都参考场规（可调整）', confirmed: true,
  fan: { standard: 0, allTriplets: 1, sevenPairs: 2, pureSuit: 2, root: 1 }, cap: 5,
  special: { goldenHook: 2, terminals: 2, jiangTriplets: 3, dragonPairs: 3, heaven: 5, earth: 5 },
  events: { kongDraw: 2, kongDiscard: 1, robKong: 1, sea: 1, declaredReady: 2 },
  optional: { goldenHook: true, terminals: true, jiangTriplets: true, sea: false, declaredReady: false },
  selfDrawMode: 'fan', capMode: 'all', openingMode: 'fixed',
  sources: [
    { title: '四川赛事2025附件2-5（22—24页）', url: 'https://www.ssva.org.cn/upload/file/2025-08-22/6389146967009551555075859.pdf' },
    { title: '游戏茶苑：四川麻将算牌（倍数口径与可选场规）', url: 'https://www.gametea.com/news/202010/9858.html' },
    { title: '91y：龙七对不重复计根', url: 'https://m.91y.com/help/guize/338.html' },
    { title: '游戏茶苑：成都换三张（报叫、天地胡；龙七对有不同口径）', url: 'https://www.gametea.com/news/201910/9099.html' }
  ]
};

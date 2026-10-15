const regions = [
  { id: 'sichuan', name: '四川麻将', caption: '一城一味，巴蜀牌桌', tag: '巴蜀风味', art: 'sichuan', tone: 'jade' },
  { id: 'national', name: '国标麻将', caption: '以牌会友，经典竞技', tag: '国标规则', art: 'national', tone: 'sand' },
  { id: 'riichi', name: '日本麻将', caption: '一巡一役，和风雀庄', tag: '立直麻将', art: 'riichi', tone: 'rose' }
];
const variants = [
  { id: 'chengdu', region: 'sichuan', name: '成都麻将', caption: '蓉城茶馆 · 血战到底', art: 'chengdu', tone: 'jade', ready: true },
  { id: 'luzhou', region: 'sichuan', name: '泸州麻将', caption: '酒城白塔 · 江畔牌趣', art: 'luzhou', tone: 'sand' },
  { id: 'leshan', region: 'sichuan', name: '乐山麻将', caption: '大佛临江 · 嘉州风物', art: 'leshan', tone: 'jade' },
  { id: 'neijiang', region: 'sichuan', name: '内江麻将', caption: '甜城书画 · 大千故里', art: 'neijiang', tone: 'rose' },
  { id: 'national', region: 'national', name: '国标麻将', caption: '中国麻将竞赛规则', art: 'national', tone: 'sand' },
  { id: 'riichi3', region: 'riichi', name: '三人麻将', caption: '三席对坐 · 三人立直', art: 'riichi3', tone: 'sand' },
  { id: 'riichi4', region: 'riichi', name: '四人麻将', caption: '四方相聚 · 四人立直', art: 'riichi4', tone: 'rose' }
];
function getVariant(id) { return variants.find(item => item.id === id); }
function playUrl(id) {
  const variant = getVariant(id);
  return (variant && variant.ready ? '/pages/index/index' : '/pages/play/play') + '?variant=' + encodeURIComponent(id);
}
module.exports = { regions, variants, getVariant, playUrl };

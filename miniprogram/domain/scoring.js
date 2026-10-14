// 番数与牌型分离。未确认的场规不得返回数值，特殊事件/结算尚未实现。
function scoreBasicHand(analysis, profile) {
  if (analysis.status !== 'winning') return { status: 'unavailable' };
  if (!profile || profile.confirmed !== true) return { status: 'rules-pending' };
  const keys = ['standard', 'allTriplets', 'sevenPairs', 'pureSuit', 'root'];
  if (!profile.id || !profile.fan || !keys.every(k => Number.isInteger(profile.fan[k]) && profile.fan[k] >= 0 && profile.fan[k] <= 16) || !Number.isInteger(profile.cap) || profile.cap < 0 || profile.cap > 16) throw new Error('番数配置无效');
  // 标准型、对对胡、七对是候选基础型，取最大值，避免重复叠加。
  const candidates = ['standard', 'allTriplets', 'sevenPairs'].filter(k => analysis.patterns.indexOf(k) >= 0);
  const baseFan = Math.max.apply(null, candidates.map(k => profile.fan[k]));
  const rawFan = baseFan + (analysis.patterns.indexOf('pureSuit') >= 0 ? profile.fan.pureSuit : 0) + analysis.roots * profile.fan.root;
  return { status: 'basic-only', profileId: profile.id, fan: Math.min(rawFan, profile.cap), rawFan, includesEventFan: false };
}
module.exports = { scoreBasicHand };

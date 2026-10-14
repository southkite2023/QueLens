// 基础策略接口与完整参考算番分离；特殊事件来自用户输入，不从牌面猜测。
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
const titles = { standard: '平胡', allTriplets: '对对胡', sevenPairs: '七对', dragonPairs: '龙七对', pureSuit: '清一色', goldenHook: '金钩钓', terminals: '带幺九', jiangTriplets: '将对', root: '根', heaven: '天胡', earth: '地胡', kongDraw: '杠上花', kongDiscard: '杠上炮', robKong: '抢杠胡', sea: '海底', declaredReady: '报叫', selfDraw: '自摸加番' };
function checkContext(analysis, profile, context) {
  const opening = context.opening || 'none';
  const finish = context.finish || 'normal';
  if (!['none', 'heaven', 'earth'].includes(opening) || !['normal', 'kongDraw', 'kongDiscard', 'robKong'].includes(finish) || !['discard', 'self'].includes(context.winType)) throw new Error('胡牌方式无效');
  if (opening !== 'none' && (context.winType !== 'self' || analysis.melds.length || finish !== 'normal' || context.sea || context.declaredReady)) throw new Error('天地胡需选择自摸、无碰杠，且不能同时选杠后胡、海底或报叫');
  if (finish === 'kongDraw' && (context.winType !== 'self' || !analysis.melds.some(m => m.type === 'kong'))) throw new Error('杠上花需选择自摸，并录入至少一组杠');
  if (['kongDiscard', 'robKong'].includes(finish) && context.winType !== 'discard') throw new Error('杠上炮、抢杠胡应选择点炮胡');
  if (context.sea && !profile.optional.sea) throw new Error('请先启用海底加番场规');
  if (context.declaredReady && !profile.optional.declaredReady) throw new Error('请先启用报叫加番场规');
  if (context.sea && finish === 'robKong') throw new Error('海底与抢杠胡不能同时选择');
}
function scoreHand(analysis, profile, context, settings) {
  if (analysis.status !== 'winning') return { status: 'unavailable' };
  if (!profile || profile.confirmed !== true) return { status: 'rules-pending' };
  if (!settings || !/^\d{1,2}$/.test(String(settings.cap))) throw new Error('封顶番数须为0至16的整数');
  if (![settings.base, settings.multiplier].every(v => /^\d+(\.\d{1,2})?$/.test(String(v)))) throw new Error('底分、倍数须为有效数字，最多两位小数');
  const cap = Number(settings.cap), base = Number(settings.base), multiplier = Number(settings.multiplier);
  if (!Number.isInteger(cap) || cap < 0 || cap > 16) throw new Error('封顶番数须为0至16的整数');
  if (![base, multiplier].every(n => Number.isFinite(n) && n > 0 && n <= 1000000 && Math.abs(n * 100 - Math.round(n * 100)) < 0.00001)) throw new Error('底分、倍数须大于0、不超过100万，最多两位小数');
  if (!['none','fan','base'].includes(profile.selfDrawMode) || !['all','base'].includes(profile.capMode) || !['fixed','cap'].includes(profile.openingMode)) throw new Error('场规选项无效');
  const fanValues = [...Object.values(profile.fan), ...Object.values(profile.special), ...Object.values(profile.events)];
  if (!fanValues.every(n => Number.isInteger(n) && n >= 0 && n <= 16)) throw new Error('每项番数须为0至16的整数');
  checkContext(analysis, profile, context);
  const candidates = [];
  const pure = analysis.patterns.includes('pureSuit');
  const makeCandidate = (key, fan, consumedRoots = 0) => {
    const lines = [{ key, label: titles[key], fan }];
    if (pure) lines.push({ key: 'pureSuit', label: titles.pureSuit, fan: profile.fan.pureSuit });
    const roots = Math.max(0, analysis.roots - consumedRoots);
    if (roots) lines.push({ key: 'root', label: roots + '根' + (consumedRoots ? '（龙七对已含1根）' : ''), fan: roots * profile.fan.root });
    candidates.push({ lines, fan: lines.reduce((sum, line) => sum + line.fan, 0) });
  };
  for (const d of analysis.decompositions) {
    makeCandidate('standard', profile.fan.standard);
    const triplets = d.groups.every(g => g.type === 'triplet');
    if (triplets) makeCandidate('allTriplets', profile.fan.allTriplets);
    if (profile.optional.goldenHook && analysis.melds.length === 4) makeCandidate('goldenHook', profile.special.goldenHook);
    const isTerminal = index => [0,8].includes(index % 9);
    if (profile.optional.terminals && isTerminal(d.pair) && d.groups.every(g => g.type === 'triplet' ? isTerminal(g.index) : [0,6].includes(g.index % 9)) && analysis.melds.every(m => [1,9].includes(Number(m.tile.slice(1))))) makeCandidate('terminals', profile.special.terminals);
    if (profile.optional.jiangTriplets && triplets && analysis.concealed.concat(analysis.melds.map(m => m.tile)).every(tile => [2,5,8].includes(Number(tile.slice(1))))) makeCandidate('jiangTriplets', profile.special.jiangTriplets);
  }
  if (analysis.patterns.includes('sevenPairs')) {
    if (analysis.roots) makeCandidate('dragonPairs', profile.special.dragonPairs, 1);
    else makeCandidate('sevenPairs', profile.fan.sevenPairs);
  }
  const best = candidates.sort((a,b) => b.fan - a.fan)[0];
  if (!best) throw new Error('缺少可计分牌型');
  let lines = best.lines.slice(), baseFan = best.fan;
  if (context.opening !== 'none') {
    baseFan = profile.openingMode === 'cap' ? cap : profile.special[context.opening];
    lines = [{ key: context.opening, label: titles[context.opening] + '（替代牌型与根）', fan: baseFan }];
  }
  const eventLines = [];
  if (context.finish !== 'normal') eventLines.push({ key: context.finish, label: titles[context.finish], fan: profile.events[context.finish] });
  if (context.sea) eventLines.push({ key: 'sea', label: '海底（自选场规）', fan: profile.events.sea });
  if (context.declaredReady) eventLines.push({ key: 'declaredReady', label: titles.declaredReady, fan: profile.events.declaredReady });
  if (context.winType === 'self' && profile.selfDrawMode === 'fan' && context.opening === 'none') eventLines.push({ key: 'selfDraw', label: titles.selfDraw, fan: 1 });
  const eventFan = eventLines.reduce((sum,line) => sum + line.fan,0);
  const rawFan = baseFan + eventFan;
  const fan = profile.capMode === 'all' ? Math.min(rawFan,cap) : Math.min(baseFan,cap) + eventFan;
  const extraBase = context.winType === 'self' && profile.selfDrawMode === 'base' && context.opening === 'none' ? 1 : 0;
  const factor = 2 ** fan + extraBase;
  const points = Math.round(base * multiplier * factor * 100) / 100;
  if (!Number.isSafeInteger(Math.round(points * 100))) throw new Error('分值过大，请降低底分或倍数');
  return { status: 'scored', lines: lines.concat(eventLines), baseFan, eventFan, rawFan, fan, cap, factor, extraBase, points, base, multiplier, capMode: profile.capMode };
}
module.exports = { scoreBasicHand, scoreHand };

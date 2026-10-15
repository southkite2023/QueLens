const { SUITS, indexOf } = require('./tiles');
// concealed 包含胡牌张；碰/杠独立表示，杠计一个面子、四张实体牌。
function validate(input) {
  if (!input || !Array.isArray(input.concealed) || !Array.isArray(input.melds)) return '手牌格式不正确';
  if (input.missingSuit !== undefined && SUITS.indexOf(input.missingSuit) < 0) return '定缺花色无效';
  if (input.melds.length > 4) return '最多四组碰杠';
  const counts = Array(27).fill(0);
  for (const tile of input.concealed) {
    const i = indexOf(tile); if (i < 0) return '仅支持万、筒、条的1至9'; counts[i]++;
  }
  for (const meld of input.melds) {
    if (!meld || ['pong', 'kong'].indexOf(meld.type) < 0 || indexOf(meld.tile) < 0) return '血战到底仅支持碰或杠副露';
    counts[indexOf(meld.tile)] += meld.type === 'kong' ? 4 : 3;
  }
  if (counts.some(n => n > 4)) return '同一种牌不能超过四张（含碰杠）';
  if (input.concealed.length !== 14 - input.melds.length * 3) return '手牌数量与碰杠不匹配';
  if (SUITS.every((_, suit) => counts.slice(suit * 9, suit * 9 + 9).some(Boolean))) return '胡牌时须缺一门，请检查手牌与明牌';
  if (counts.some((n, i) => n && Math.floor(i / 9) === SUITS.indexOf(input.missingSuit))) return '定缺花色尚未打完';
  return null;
}
function decompositions(counts, groupsLeft, groups, output) {
  const i = counts.findIndex(n => n > 0);
  if (i < 0) { if (groupsLeft === 0) output.push(groups.slice()); return; }
  if (!groupsLeft) return;
  if (counts[i] >= 3) {
    counts[i] -= 3; groups.push({ type: 'triplet', index: i });
    decompositions(counts, groupsLeft - 1, groups, output);
    groups.pop(); counts[i] += 3;
  }
  if (i % 9 <= 6 && counts[i + 1] && counts[i + 2]) {
    counts[i]--; counts[i + 1]--; counts[i + 2]--; groups.push({ type: 'sequence', index: i });
    decompositions(counts, groupsLeft - 1, groups, output);
    groups.pop(); counts[i]++; counts[i + 1]++; counts[i + 2]++;
  }
}
function analyzeHand(input) {
  const error = validate(input);
  if (error) return { status: 'invalid', error };
  const counts = Array(27).fill(0);
  input.concealed.forEach(tile => counts[indexOf(tile)]++);
  const decomposed = [];
  for (let i = 0; i < 27; i++) {
    if (counts[i] < 2) continue;
    counts[i] -= 2;
    const groups = [];
    decompositions(counts, 4 - input.melds.length, [], groups);
    groups.forEach(melds => decomposed.push({ pair: i, groups: melds }));
    counts[i] += 2;
  }
  const sevenPairs = input.melds.length === 0 && counts.every(n => n % 2 === 0);
  if (!decomposed.length && !sevenPairs) return { status: 'not-winning', error: '当前牌型尚未组成胡牌' };
  const physical = counts.slice();
  input.melds.forEach(meld => { physical[indexOf(meld.tile)] += meld.type === 'kong' ? 4 : 3; });
  const pureSuit = SUITS.filter((_, suit) => physical.slice(suit * 9, suit * 9 + 9).some(Boolean)).length === 1;
  const allTriplets = decomposed.some(x => x.groups.every(g => g.type === 'triplet'));
  const roots = physical.filter(n => n === 4).length;
  const patterns = [];
  if (decomposed.length) patterns.push('standard');
  if (allTriplets) patterns.push('allTriplets');
  if (sevenPairs) patterns.push('sevenPairs');
  if (pureSuit) patterns.push('pureSuit');
  return { status: 'winning', patterns, roots, decompositions: decomposed, melds: input.melds.map(m => ({ ...m })), concealed: input.concealed.slice().sort((a, b) => indexOf(a) - indexOf(b)) };
}
module.exports = { validate, analyzeHand };

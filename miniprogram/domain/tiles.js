const SUITS = ['m', 'p', 's'];
const SUIT_NAMES = { m: '万', p: '筒', s: '条' };
const TILES = [];
SUITS.forEach(suit => { for (let rank = 1; rank <= 9; rank++) TILES.push(suit + rank); });
function indexOf(tile) { return TILES.indexOf(tile); }
function label(tile) { return tile.slice(1) + SUIT_NAMES[tile[0]]; }
module.exports = { SUITS, SUIT_NAMES, TILES, indexOf, label };

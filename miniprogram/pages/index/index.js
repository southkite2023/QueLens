const { TILES, label } = require('../../domain/tiles');
const { analyzeHand } = require('../../domain/hand');
const { scoreHand } = require('../../domain/scoring');
const rules = require('../../domain/rules');
const fields = [
  ['fan','standard','平胡'], ['fan','allTriplets','对对胡'], ['fan','sevenPairs','七对'], ['fan','pureSuit','清一色附加'], ['fan','root','每根附加'],
  ['special','dragonPairs','龙七对（已含1根）'], ['special','goldenHook','金钩钓基础'], ['special','terminals','带幺九基础'], ['special','jiangTriplets','将对基础'], ['special','heaven','天胡固定番'], ['special','earth','地胡固定番'],
  ['events','kongDraw','杠上花附加'], ['events','kongDiscard','杠上炮附加'], ['events','robKong','抢杠胡附加'], ['events','sea','海底附加（自选）'], ['events','declaredReady','报叫附加（自选）']
].map(([group,key,name]) => ({ group,key,name,value: String(rules[group][key]) }));
const options = [ ['goldenHook','金钩钓'], ['terminals','带幺九'], ['jiangTriplets','将对'], ['sea','海底加番'], ['declaredReady','报叫加番'] ].map(([key,name]) => ({key,name,enabled:rules.optional[key]}));
Page({
  data: {
    palette: TILES.map(id => ({ id, label: label(id), suit: id[0] })), hand: [], selected: [], melds: [], count: 0, target: 14,
    suits: ['万','筒','条'], missingIndex: 2, entryModes: ['手牌','碰（三张）','杠（四张）'], entryIndex: 0,
    winTypes: ['点炮胡','自摸'], winIndex: 0, openings: ['普通开局','天胡（庄家起手即胡）','地胡（闲家起手听牌，首轮自摸）'], openingIndex: 0,
    finishes: ['普通胡牌','杠上花（杠后补牌自摸）','杠上炮（他人杠后打出）','抢杠胡（抢他人补杠）'], finishIndex: 0,
    sea: false, declaredReady: false, base: '1', multiplier: '1', cap: '5', result: '', scoring: null,
    rulesExpanded: false, ruleFields: fields, optionalRules: options, sources: rules.sources,
    selfDrawModes: ['自摸不加分','自摸加1番（封顶内/外按设置）','自摸加1底（封顶后）'], selfDrawIndex: 0,
    capModes: ['总番封顶（含特殊加番）','牌型封顶，特殊加番在封顶外'], capIndex: 0,
    openingModes: ['天地胡固定番（见番表）','天地胡直接按所设封顶番'], openingModeIndex: 0
  },
  invalidate(data) { this.setData({ ...data, result: '', scoring: null }); },
  updateHand(hand, melds = this.data.melds) {
    this.invalidate({ hand, melds, selected: hand.map((id,index) => ({id,index,label:label(id)})), count: hand.length, target: 14 - melds.length * 3 });
  },
  addTile(event) {
    const id = event.currentTarget.dataset.id;
    if (!TILES.includes(id)) return;
    const type = ['hand','pong','kong'][this.data.entryIndex];
    const amount = type === 'hand' ? 1 : type === 'pong' ? 3 : 4;
    const physical = this.data.hand.filter(t => t === id).length + this.data.melds.filter(m => m.tile === id).reduce((sum,m) => sum + (m.type === 'kong' ? 4 : 3),0);
    if (physical + amount > 4) return wx.showToast({ title: '同牌最多4张（含碰杠）', icon: 'none' });
    if (type === 'hand') {
      if (this.data.hand.length >= this.data.target) return wx.showToast({ title: '手牌已满，请先移除', icon: 'none' });
      this.updateHand(this.data.hand.concat(id));
    } else {
      if (this.data.melds.length >= 4 || this.data.hand.length > this.data.target - 3) return wx.showToast({ title: '请先移除手牌，再录入碰杠', icon: 'none' });
      this.updateHand(this.data.hand, this.data.melds.concat({type,tile:id,label:label(id),name:type === 'pong' ? '碰' : '杠'}));
    }
  },
  removeTile(event) { const hand = this.data.hand.slice(); hand.splice(Number(event.currentTarget.dataset.index),1); this.updateHand(hand); },
  removeMeld(event) { const melds = this.data.melds.slice(); melds.splice(Number(event.currentTarget.dataset.index),1); this.updateHand(this.data.hand,melds); },
  clear() { this.invalidate({ openingIndex:0,finishIndex:0,sea:false,declaredReady:false }); this.updateHand([],[]); },
  sample() { this.invalidate({ missingIndex:2,winIndex:0,openingIndex:0,finishIndex:0,sea:false,declaredReady:false }); this.updateHand(['m1','m2','m3','m4','m5','m6','p1','p2','p3','p7','p8','p9','p5','p5'],[]); },
  changeSuit(event) { this.invalidate({ missingIndex:Number(event.detail.value) }); },
  changePicker(event) {
    const key = event.currentTarget.dataset.key;
    if (!['entryIndex','winIndex','openingIndex','finishIndex','selfDrawIndex','capIndex','openingModeIndex'].includes(key)) return;
    const value = Number(event.detail.value), data = { [key]:value };
    if (key === 'openingIndex' && value > 0) Object.assign(data,{winIndex:1,finishIndex:0,sea:false,declaredReady:false});
    if (key === 'finishIndex' && value > 0) Object.assign(data,{openingIndex:0,winIndex:value === 1 ? 1 : 0});
    this.invalidate(data);
  },
  changeNumber(event) { const key = event.currentTarget.dataset.key; if (['base','multiplier','cap'].includes(key)) this.invalidate({[key]:event.detail.value}); },
  changeEvent(event) { const key = event.currentTarget.dataset.key; if (['sea','declaredReady'].includes(key)) this.invalidate({[key]:event.detail.value}); },
  toggleRules() { this.setData({rulesExpanded:!this.data.rulesExpanded}); },
  changeRule(event) {
    const key = event.currentTarget.dataset.key;
    this.invalidate({ruleFields:this.data.ruleFields.map(field => field.key === key ? {...field,value:event.detail.value} : field)});
  },
  changeOptional(event) {
    const key = event.currentTarget.dataset.key, enabled = event.detail.value;
    const data = { optionalRules:this.data.optionalRules.map(item => item.key === key ? {...item,enabled} : item) };
    if (!enabled && ['sea','declaredReady'].includes(key)) data[key] = false;
    this.invalidate(data);
  },
  resetRules() { this.invalidate({ruleFields:fields.map(f => ({...f})),optionalRules:options.map(o => ({...o})),selfDrawIndex:0,capIndex:0,openingModeIndex:0,sea:false,declaredReady:false}); },
  copySource(event) { const source = this.data.sources[Number(event.currentTarget.dataset.index)]; if (source) wx.setClipboardData({data:source.url}); },
  calculate() {
    const analysis = analyzeHand({concealed:this.data.hand.slice(),melds:this.data.melds,missingSuit:['m','p','s'][this.data.missingIndex]});
    if (analysis.status !== 'winning') return this.setData({result:analysis.error,scoring:null});
    try {
      const profile = {...rules,fan:{...rules.fan},special:{...rules.special},events:{...rules.events},optional:{}};
      for (const field of this.data.ruleFields) {
        if (!/^\d{1,2}$/.test(field.value)) throw new Error(field.name + '须为0至16的整数');
        profile[field.group][field.key] = Number(field.value);
      }
      this.data.optionalRules.forEach(item => {profile.optional[item.key] = item.enabled;});
      profile.selfDrawMode = ['none','fan','base'][this.data.selfDrawIndex];
      profile.capMode = ['all','base'][this.data.capIndex]; profile.openingMode = ['fixed','cap'][this.data.openingModeIndex];
      const scoring = scoreHand(analysis,profile,{winType:['discard','self'][this.data.winIndex],opening:['none','heaven','earth'][this.data.openingIndex],finish:['normal','kongDraw','kongDiscard','robKong'][this.data.finishIndex],sea:this.data.sea,declaredReady:this.data.declaredReady},{base:this.data.base,multiplier:this.data.multiplier,cap:this.data.cap});
      this.setData({result:'可组成胡牌，按当前参考场规计算',scoring});
    } catch (error) { this.setData({result:error.message,scoring:null}); }
  },
  about() { wx.navigateTo({url:'/pages/about/about'}); }
});

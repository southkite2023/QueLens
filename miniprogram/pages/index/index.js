const { TILES, label } = require('../../domain/tiles');
const { analyzeHand } = require('../../domain/hand');
const { scoreHand } = require('../../domain/scoring');
const rules = require('../../domain/rules');
const fields = [
  ['fan','standard','平胡'], ['fan','allTriplets','对对胡'], ['fan','sevenPairs','七对'], ['fan','pureSuit','清一色附加'], ['fan','root','每根附加'],
  ['special','dragonPairs','龙七对（已含1根）'], ['special','goldenHook','金钩钓基础'], ['special','terminals','带幺九基础'], ['special','jiangTriplets','将对基础'], ['special','heaven','天胡固定番'], ['special','earth','地胡固定番'],
  ['events','kongDraw','杠上花附加'], ['events','kongDiscard','杠上炮附加'], ['events','robKong','抢杠胡附加'], ['events','sea','海底附加（自选）'], ['events','declaredReady','报叫附加（自选）']
].map(([group,key,name]) => ({ group,key,name,value: String(rules[group][key]) }));
const fanColors = ['#26709d','#217b9a','#237c72','#648037','#a16d22','#b94b31','#b73732','#bd263d','#b51e37'];
const lineTones = { dragonPairs:'crimson', heaven:'crimson', earth:'crimson', jiangTriplets:'crimson', pureSuit:'blue', sevenPairs:'violet', allTriplets:'teal', goldenHook:'amber', terminals:'amber', root:'green', kongDraw:'orange', kongDiscard:'orange', robKong:'orange', sea:'blue', declaredReady:'violet', selfDraw:'teal', standard:'neutral' };
Page({
  data: {
    palette:TILES.map(id=>({id,label:label(id),suit:id[0]})), hand:[],selected:[],melds:[],count:0,target:14, selectedIndex:-1, focusedLabel:'',
    winTypes:['点炮胡','自摸 ×2'],winIndex:0,
    openings:['普通','天胡','地胡'],openingIndex:0,
    finishes:['普通','杠上花','杠上炮','抢杠胡'],finishIndex:0,
    sea:false,declaredReady:false,base:'1',caps:Array.from({length:16},(_,i)=>i+1),capIndex:4,cap:'5',
    result:'',scoring:null,rulesExpanded:false,ruleFields:fields,sources:rules.sources,formulaVisible:false
  },
  invalidate(data) { this.setData({...data,result:'',scoring:null,formulaVisible:false}); },
  updateHand(hand,melds=this.data.melds) {
    this.invalidate({hand,melds:melds.map(m=>({...m,label:label(m.tile),name:m.type==='pong'?'碰':'杠',tiles:Array.from({length:m.type==='kong'?4:3},(_,slot)=>({slot,label:label(m.tile)}))})),selected:hand.map((id,index)=>({id,index,label:label(id),focused:false})),count:hand.length,target:14-melds.length*3,selectedIndex:-1,focusedLabel:''});
  },
  addTile(event) {
    const id=event.currentTarget.dataset.id;
    if (!TILES.includes(id)) return;
    const physical=this.data.hand.filter(t=>t===id).length+this.data.melds.filter(m=>m.tile===id).reduce((sum,m)=>sum+(m.type==='kong'?4:3),0);
    if (physical>=4) return wx.showToast({title:'同牌最多4张（含明牌）',icon:'none'});
    if (this.data.hand.length>=this.data.target) return wx.showToast({title:'手牌已满，请先移除或转成碰杠',icon:'none'});
    this.updateHand(this.data.hand.concat(id));
  },
  selectTile(event) {
    const index=Number(event.currentTarget.dataset.index);
    if (!Number.isInteger(index)||index<0||index>=this.data.hand.length) return;
    const selectedIndex=this.data.selectedIndex===index?-1:index;
    this.setData({selectedIndex,focusedLabel:selectedIndex<0?'':label(this.data.hand[selectedIndex]),selected:this.data.selected.map(t=>({...t,focused:t.index===selectedIndex}))});
  },
  removeFocused() {
    const index=this.data.selectedIndex;
    if (index<0) return;
    const hand=this.data.hand.slice();hand.splice(index,1);this.updateHand(hand);
  },
  makeMeld(event) {
    const type=event.currentTarget.dataset.type;
    if (!['pong','kong'].includes(type)||this.data.selectedIndex<0) return;
    if (this.data.melds.length>=4) return wx.showToast({title:'最多四组碰杠',icon:'none'});
    const tile=this.data.hand[this.data.selectedIndex],amount=type==='pong'?3:4;
    if (this.data.hand.filter(id=>id===tile).length<amount) return wx.showToast({title:'手牌中需要'+amount+'张相同牌',icon:'none'});
    let remaining=amount;
    const hand=this.data.hand.filter(id=>{if(id===tile&&remaining>0){remaining--;return false;}return true;});
    this.updateHand(hand,this.data.melds.concat({type,tile}));
  },
  restoreMeld(event) {
    const index=Number(event.currentTarget.dataset.index);
    if (!Number.isInteger(index)||index<0||index>=this.data.melds.length) return;
    const meld=this.data.melds[index],melds=this.data.melds.slice();melds.splice(index,1);
    this.updateHand(this.data.hand.concat(Array(meld.type==='kong'?4:3).fill(meld.tile)),melds);
    if(this.data.hand.length>this.data.target) wx.showToast({title:'杠牌已退回，请移除多余补牌',icon:'none'});
  },
  clear() { this.invalidate({openingIndex:0,finishIndex:0,sea:false,declaredReady:false});this.updateHand([],[]); },
  choose(event) {
    const {key,value}=event.currentTarget.dataset;
    const sizes={winIndex:2,openingIndex:3,finishIndex:4},n=Number(value);
    if(!sizes[key]||!Number.isInteger(n)||n<0||n>=sizes[key]) return;
    const data={[key]:n};
    if(key==='openingIndex'&&n>0) Object.assign(data,{winIndex:1,finishIndex:0,sea:false,declaredReady:false});
    if(key==='finishIndex'&&n>0) Object.assign(data,{openingIndex:0,winIndex:n===1?1:0});
    if(key==='winIndex'&&n===0) {data.openingIndex=0;if(this.data.finishIndex===1)data.finishIndex=0;}
    if(key==='winIndex'&&n===1&&this.data.finishIndex>1) data.finishIndex=0;
    this.invalidate(data);
  },
  toggleEvent(event) {
    const key=event.currentTarget.dataset.key;
    if(!['sea','declaredReady'].includes(key)) return;
    const data={[key]:!this.data[key]};
    if(data[key]) data.openingIndex=0;
    if(key==='sea'&&data.sea&&this.data.finishIndex===3)data.finishIndex=0;
    this.invalidate(data);
  },
  changeBase(event) { this.invalidate({base:event.detail.value}); },
  changeCap(event) {
    const index=Number(event.detail.value);
    if(Number.isInteger(index)&&index>=0&&index<this.data.caps.length)this.invalidate({capIndex:index,cap:String(this.data.caps[index])});
  },
  toggleRules() { this.setData({rulesExpanded:!this.data.rulesExpanded}); },
  copySource(event) { const source=this.data.sources[Number(event.currentTarget.dataset.index)];if(source)wx.setClipboardData({data:source.url}); },
  calculate() {
    const analysis=analyzeHand({concealed:this.data.hand.slice(),melds:this.data.melds});
    if(analysis.status!=='winning')return this.setData({result:analysis.error,scoring:null,formulaVisible:false});
    try {
      const profile={...rules,selfDrawMode:'fan',capMode:'all',openingMode:'fixed',optional:{...rules.optional,sea:true,declaredReady:true}};
      const scoring=scoreHand(analysis,profile,{winType:['discard','self'][this.data.winIndex],opening:['none','heaven','earth'][this.data.openingIndex],finish:['normal','kongDraw','kongDiscard','robKong'][this.data.finishIndex],sea:this.data.sea,declaredReady:this.data.declaredReady},{base:this.data.base,multiplier:'1',cap:this.data.cap});
      scoring.color=fanColors[Math.min(scoring.fan,8)];scoring.fanClass='heat-'+Math.min(scoring.fan,8)+(scoring.fan>=5?' gradient-ink':'');
      scoring.lines=scoring.lines.map(line=>({...line,factor:2**line.fan,tone:lineTones[line.key]||'neutral'}));
      this.setData({result:'这手牌，可以胡。',scoring,formulaVisible:false},()=>{
        // Recreate the equation node so every calculation replays the CSS animation.
        this.setData({formulaVisible:true});
      });
    }catch(error){this.setData({result:error.message,scoring:null,formulaVisible:false});}
  },
  about(){wx.navigateTo({url:'/pages/about/about'});}
});

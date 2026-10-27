'use strict';
// ===== Dino Colossus: 2D side-scrolling platformer =====
const cv=document.getElementById('c'),ctx=cv.getContext('2d'),$=id=>document.getElementById(id);
const secLen=n=>SEC_L; // section length unchanged (3000)
const T=30,GY=360,GRAV=.5,JV=-12.5,SPD=3.5,SEC_L=3000,CROWD=30,MAXB=30;
// belly stages: 0 normal, 1 fat waddle (FAT_AT+ eaten), 2 rolling ball (ROLL_AT+ eaten)
const FAT_AT=12,ROLL_AT=22,FAT_SPD=.72,FAT_JMP=.83,ROLL_JMP=.83,ROLL_MAX=2.3,ROLL_ACC=.09,ROLL_FRIC=.988,ROLL_CAP=11;
const R=(a,b)=>a+Math.random()*(b-a),RI=(a,b)=>Math.floor(R(a,b+1)),pickA=a=>a[Math.random()*a.length|0];
const PEOPLE=['🧍','🧍‍♀️','🧑','👧','👦','👩','👨','🧓'];
const DINOS=[{n:'Rexy',e:'🦖',h:0,t:'Carnivore'},{n:'Blue',e:'🦖',h:200,t:'Carnivore'},{n:'Rosie',e:'🦖',h:300,t:'Carnivore'},{n:'Bronto',e:'🦕',h:0,t:'Herbivore'},{n:'Sunny',e:'🦕',h:40,t:'Herbivore'},{n:'Purps',e:'🦕',h:250,t:'Herbivore'}];
const BIOMES_OLD=[{n:'Jungle',top:'#43a047',dirt:'#795548',tint:'#c8f7c5',d:['🌴','🌿','🌺']},{n:'Desert',top:'#e9c46a',dirt:'#c08a3e',tint:'#ffe8b0',d:['🌵','🏜️','🌵']},{n:'Snowy',top:'#f5fbff',dirt:'#90a4ae',tint:'#e3f2fd',d:['🌲','⛄','🌲']},{n:'Swamp',top:'#558b2f',dirt:'#4e342e',tint:'#b5c99a',d:['🍄','🌾','🐸']},{n:'Beach',top:'#ffe082',dirt:'#d7a86e',tint:'#b3e5fc',d:['🌴','⛱️','🐚']},{n:'City Outskirts',top:'#8bc34a',dirt:'#757575',tint:'#cfd8dc',d:['🏢','🏠','🌳']}];
const BIOMES=[{n:'Jungle',sky:'#5c94fc',top:'#5a9e2f',stone:'#a0612c',dark:'#5c3414',hill:'#3cb043',d:['fern','cycad','shroom','fern']},
 {n:'Swamp',sky:'#7fa8a0',top:'#4f6b2a',stone:'#5d4a2e',dark:'#2e2416',hill:'#4f7d3a',d:['shroom','fern','shroom','cycad']},
 {n:'Desert Badlands',sky:'#f0b878',top:'#d9a441',stone:'#c0703a',dark:'#7a3d18',hill:'#c98a4b',d:['cycad','bone','cycad','fern']},
 {n:'Ice Age',sky:'#a8d8ff',top:'#f2fbff',stone:'#8fa9bf',dark:'#4e6680',hill:'#e3f2fd',d:['bone','fern','bone','cycad']},
 {n:'Beach',sky:'#6fc3ff',top:'#f6dc8a',stone:'#d1a463',dark:'#8a6534',hill:'#55c06a',d:['cycad','cycad','fern','bone']},
 {n:'Volcanic',sky:'#c4766a',top:'#5b5b5b',stone:'#3d3d3d',dark:'#1d1d1d',hill:'#6b4a4a',d:['bone','shroom','fern','cycad']}];
let W,H,S,VW,VH,OY,WY=0,portrait;
// landscape: zoomed-in view, ground band = bottom 30% of the screen (touch buttons live there)
const BIG_SPD=4.1,BIG_CHANCE=.5; // big people-eater: a bit faster than your 3.5 run; at most one per section, ~half the sections (never section 1)
const LVH=285,BVH=440,GBAND=.3;let ZK=0; // normal levels zoomed in (285 world px tall); boss fights zoom out (440) smoothly
function layout(){W=cv.width=innerWidth;H=cv.height=innerHeight;portrait=H>W;const hud=44,ctrl=portrait?150:0;
 view();
 if(!portrait){['bl','br','bj','bp'].forEach(i=>$(i).style.opacity=.55)}}
function view(){const hud=44,ctrl=portrait?150:0;if(portrait){VH=420;WY=0;S=W/448;OY=Math.max(hud,(H-ctrl-VH*S)/2)}else{VH=LVH+(BVH-LVH)*ZK;WY=GY-VH*(1-GBAND);S=H/VH;OY=0}VW=W/S}
const bossVW=()=>portrait?W/(W/448):W/(H/BVH);const AW=()=>G.arenaW||VW;
layout();addEventListener('resize',layout);
// ---- persistent ----
const LS=localStorage;const DIFFS={easy:'EASY',medium:'MEDIUM',hard:'HARD'};let diff=DIFFS[LS.dinoColossus_Diff]?LS.dinoColossus_Diff:'medium';
// ---- v15 difficulty (see DIFFICULTY.md). Level keys easy/medium/hard and all saves are unchanged; only their meaning changed.
// Base values = the v14 'hard' settings. D = 1 (easy), 2 (medium), 8 (hard). Ramp: within each 5-section stretch before a boss,
// Dx = D*(1+0.4*p), p = 0 on the first section after a boss .. 1 on the boss-approach section (resets after every boss).
const DMUL={easy:1,medium:2,hard:8};
const rampP=n=>((Math.max(1,n)-1)%5)/4;
function Dbase(){return DMUL[G&&G.diff]||1}
function Dx(n){return Dbase()*(1+.4*rampP(n==null?(G.cur||1):n))}
const DK={
 rate:x=>Math.pow(x,.6),                       // spawn counts / spawn frequency: 2x->1.52, 8x->3.48 (8x ramped 11.2 -> 4.26)
 spd:x=>Math.min(1.7,Math.pow(x,.25)),         // enemy/boulder/lava speed: 2x->1.19, 8x->1.68, capped 1.7 (dino runs 3.5)
 bossSpd:x=>Math.min(1.5,Math.pow(x,.2)),      // boss move speed on top of the old hard curve: 1.15, 1.5 cap
 bossHP:x=>Math.pow(x,.4),                     // boss HP: 2x->1.32, 8x->2.30
 bad:x=>Math.min(.6,.35*Math.pow(x,.3)),       // chance a ? block is a bad surprise: .35 / .43 / .6 cap
 throwEvery:x=>Math.max(.9,2.3/Math.pow(x,.5)),// seconds between boss weapon throws: 2.3 / 1.63 / .9 floor
 throwT:x=>Math.max(40,Math.round(64/Math.pow(x,.25))), // frames a throw is in the air (reaction window): 64 / 54 / 40 floor (0.67 s)
 extra:x=>Math.min(2,Math.floor(Math.log2(x)+1e-9)) // extra simultaneous boss throws / challenge level: 0 / 1 / 2
};
function thrCfg(){const x=Dbase();return {every:DK.throwEvery(x),T:DK.throwT(x)}}
if(LS.dinoColossus_Best&&!LS.dinoColossus_Best_hard)LS.dinoColossus_Best_hard=LS.dinoColossus_Best;
const bestKey=()=>'dinoColossus_Best_'+diff;
// ---- Top 10 per difficulty (arcade initials) ----
const topKey=d=>'dinoColossus_Top10_'+d;
function loadTop(d){let a;try{a=JSON.parse(LS[topKey(d)]||'[]')}catch(e){a=[]}if(!Array.isArray(a))a=[];const ok=v=>Number.isFinite(v)&&v>=0&&v<1e9;
 return a.filter(e=>e&&typeof e.i==='string'&&/^[A-Z]{3}$/.test(e.i)&&ok(e.s)).map(e=>({i:e.i,s:Math.round(e.s),sec:+e.sec||0,v:+e.v||0,dn:+e.dn||0,t:+e.t||0})).sort((x,y)=>y.s-x.s||x.t-y.t).slice(0,10)}
function saveTop(d,t){try{LS[topKey(d)]=JSON.stringify(t)}catch(e){}}
for(const d of Object.keys(DIFFS)){if(!LS[topKey(d)]){const ob=+LS['dinoColossus_Best_'+d]||0;saveTop(d,ob>0?[{i:'YOU',s:ob,sec:0,dn:0,t:1}]:[])}}
function qualifies(d,sc){const t=loadTop(d);return sc>0&&(t.length<10||sc>t[t.length-1].s)}
function insertTop(d,e){e.t=e.t||Date.now();const t=loadTop(d);t.push(e);t.sort((x,y)=>y.s-x.s||x.t-y.t);const r=t.slice(0,10);saveTop(d,r);const k=r.findIndex(q=>q.t===e.t&&q.s===e.s&&q.i===e.i);if(r[0])try{LS['dinoColossus_Best_'+d]=Math.max(+LS['dinoColossus_Best_'+d]||0,r[0].s)}catch(_){}return k}
function topBest(d){const t=loadTop(d);return t.length?t[0].s:0}
function boardHTML(d,hi,title,sub){const t=loadTop(d),rows=[];for(let k=0;k<10;k++){const e=t[k];rows.push('<tr class="'+(e&&k===hi?'new':'')+(e?'':' empty')+'"><td>'+(k+1)+'</td><td>'+(e?e.i:'---')+'</td><td>'+(e?e.s:'-')+'</td><td>'+(e&&e.sec?e.sec:'-')+'</td><td>'+(e&&e.sec?e.v:'-')+'</td></tr>')}
 return '<div class="tpanel" data-d="'+d+'"><div class="thead"><span class="ttl">'+(title||'🏆 TOP 10')+'</span><span class="tabs">'+Object.keys(DIFFS).map(k=>'<button type="button" data-d="'+k+'" aria-pressed="'+(k===d)+'" class="'+(k===d?'on':'')+'">'+DIFFS[k][0]+DIFFS[k].slice(1).toLowerCase()+'</button>').join('')+'</span></div>'
  +(sub?'<div class="tsub">'+sub+'</div>':'')+'<div class="twrap"><table class="top"><thead><tr><th>#</th><th>NAME</th><th>SCORE</th><th>LEVEL</th><th>🌋 PEOPLE</th></tr></thead><tbody>'+rows.join('')+'</tbody></table></div></div>'}
let best=topBest(diff),snd=LS.dinoColossus_Snd!=='0',pick=+LS.dinoColossus_Dino||0,gems=+LS.dinoColossus_Diamonds||0;
let unl=JSON.parse(LS.dinoColossus_Unlocks||'{}'),stats=JSON.parse(LS.dinoColossus_Stats||'{"eaten":0,"erupts":0}');
const POWERS={speed:{e:'⚡',n:'Speed Boost',how:'eat 25 people (total)'},big:{e:'🍔',n:'Big Belly',how:'do 4 volcano eruptions (total)'},flame:{e:'🔥',n:'Flame Breath',how:'collect 5 💎 or beat the first boss'}};
// ---- sound ----
let AC;function ac(){return AC=AC||new (window.AudioContext||window.webkitAudioContext)()}
function beep(f,d=.12,t='square',s=0,v=.08){if(!snd)return;try{const a=ac(),o=a.createOscillator(),g=a.createGain();o.type=t;o.frequency.value=f;if(s)o.frequency.linearRampToValueAtTime(s,a.currentTime+d);g.gain.value=v;g.gain.linearRampToValueAtTime(0,a.currentTime+d);o.connect(g).connect(VIS.sfxOut()||a.destination);o.start();o.stop(a.currentTime+d)}catch(e){}}
function boomSnd(n){if(!snd)return;try{const a=ac(),t=a.currentTime,o=a.createOscillator(),g=a.createGain();o.frequency.setValueAtTime(90,t);o.frequency.exponentialRampToValueAtTime(28,t+1);g.gain.setValueAtTime(.35+n*.02,t);g.gain.exponentialRampToValueAtTime(.001,t+1.1);o.connect(g).connect(VIS.sfxOut()||a.destination);o.start();o.stop(t+1.1);
 const b=a.createBuffer(1,a.sampleRate*.9,a.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2);const ns=a.createBufferSource(),f=a.createBiquadFilter(),ng=a.createGain();f.type='lowpass';f.frequency.value=600;ng.gain.value=.3;ns.buffer=b;ns.connect(f).connect(ng).connect(VIS.sfxOut()||a.destination);ns.start()}catch(e){}
 setTimeout(()=>beep(300,.45,'sine',1500),250);setTimeout(()=>beep(1500,.12,'sine',200),700);setTimeout(()=>{beep(90,.5,'sawtooth',60);beep(95,.5,'square',55)},820)}
function barfSnd(){beep(220,.5,'sawtooth',70);setTimeout(()=>beep(160,.25,'square',300),250)}
// ---- input ----
const keys={},btn={};addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=1;if([' ','arrowup','arrowdown'].includes(e.key.toLowerCase()))e.preventDefault()});addEventListener('keyup',e=>keys[e.key.toLowerCase()]=0);
[['bl','l'],['br','r'],['bj','j']].forEach(([id,k])=>{const b=$(id);b.addEventListener('pointerdown',e=>{e.preventDefault();if(e.pointerType!=='mouse'&&e.width>90&&e.height>90)return;btn[k]=1});['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>btn[k]=0))});
$('ba').addEventListener('pointerdown',e=>{e.preventDefault();useAtk()});
$('bp').addEventListener('pointerdown',e=>{e.preventDefault();usePower()});
$('bs').onclick=()=>{const ks=Object.keys(POWERS).filter(k=>unl[k]);if(ks.length){G.pwSel=ks[(ks.indexOf(G.pwSel)+1)%ks.length];updPw()}};
$('snd').onclick=()=>{snd=!snd;LS.dinoColossus_Snd=snd?1:0;$('snd').textContent=snd?'🔊':'🔇'};$('snd').textContent=snd?'🔊':'🔇';
// ---- menu ----
function renderPick(){$('dinos').innerHTML=DINOS.map((d,i)=>'<button type="button" data-i="'+i+'" aria-pressed="'+(i==pick)+'" style="border-color:'+(i==pick?'#fff':'transparent')+'"><img src="'+SPR.dino[i][0].toDataURL()+'" width="40" height="40" draggable="false" style="image-rendering:pixelated;display:block;pointer-events:none"></button>').join('');$('dname').textContent=DINOS[pick].n+' · '+DINOS[pick].t+''}
function choose(e){const b=e.target.closest&&e.target.closest('button[data-i]');if(!b)return;e.preventDefault();const i=+b.dataset.i;if(i!==pick){pick=i;try{LS.dinoColossus_Dino=pick}catch(_){}}renderPick()}
$('dinos').addEventListener('click',choose);$('dinos').addEventListener('pointerup',choose);
function showPowers(){$('powers').innerHTML=Object.entries(POWERS).map(([k,p])=>'<div>'+(unl[k]?p.e+' <b>'+p.n+'</b> ✅ unlocked':'🔒 '+p.n+': '+p.how)+'</div>').join('')}
function renderDiff(){document.querySelectorAll('#diffs button').forEach(b=>{const on=b.dataset.d===diff;b.setAttribute('aria-pressed',on);b.style.borderColor=on?'#fff':'transparent';b.style.background=on?'#2e7d32':'#0004'});best=topBest(diff);$('best').textContent=best;$('bestd').textContent=DIFFS[diff]}
$('diffs').addEventListener('click',e=>{const b=e.target.closest('button[data-d]');if(!b)return;diff=b.dataset.d;LS.dinoColossus_Diff=diff;renderDiff()});
renderPick();showPowers();renderDiff();setTimeout(renderCont,0);
$('go').onclick=()=>{clearRun();start()};$('cont').onclick=()=>{const sv=loadRun();if(sv)start(sv);else renderCont()};$('howb').onclick=()=>{showPowers();$('how').classList.remove('hide')};$('howx').onclick=()=>{stopRead();$('how').classList.add('hide')};
function showPicker(){$('end').classList.add('hide');$('champ').classList.add('hide');$('quitq').classList.add('hide');renderCont();$('board').classList.add('hide');renderPick();renderDiff();$('start').classList.remove('hide')}
// ---- read to me (Web Speech API, works offline with the phone's built-in voice) ----
const SS=window.speechSynthesis;let rdOn=false;
function pickVoice(){if(!SS)return null;const vs=SS.getVoices().filter(v=>/^en/i.test(v.lang));if(!vs.length)return null;
 const sc=v=>(v.localService?10:0)+(/en[-_]US/i.test(v.lang)?3:0)+(/samantha|karen|moira|tessa|zira|aria|jenny|female|google us english|en-us-x-.*-local/i.test(v.name)?4:0)+(v.default?1:0);return vs.slice().sort((a,b)=>sc(b)-sc(a))[0]}
function readLines(){return [...document.querySelectorAll('#how [data-say]')].map(e=>({e,t:e.dataset.say}))}
function setRd(on){rdOn=on;$('readb').classList.toggle('hide',on);$('stopb').classList.toggle('hide',!on);if(!on)document.querySelectorAll('#how .reading').forEach(e=>e.classList.remove('reading'))}
function stopRead(){if(SS)try{SS.cancel()}catch(e){}setRd(false)}
function readAloud(){if(!SS){$('readmsg').textContent='Sorry, this phone cannot read out loud.';return}stopRead();const ls=readLines(),v=pickVoice();setRd(true);
 ls.forEach((o,k)=>{const u=new SpeechSynthesisUtterance(o.t);u.rate=.85;u.pitch=1.1;u.lang=v?v.lang:'en-US';if(v)u.voice=v;
  u.onstart=()=>{document.querySelectorAll('#how .reading').forEach(e=>e.classList.remove('reading'));o.e.classList.add('reading');try{o.e.scrollIntoView({block:'nearest',behavior:'smooth'})}catch(_){}};
  if(k==ls.length-1){u.onend=()=>setRd(false);u.onerror=()=>setRd(false)}SS.speak(u)})}
if(SS&&SS.addEventListener)SS.addEventListener('voiceschanged',()=>{});
function say(t){if(!SS||!snd||rdOn)return;try{SS.cancel();const u=new SpeechSynthesisUtterance(t),v=pickVoice();u.rate=.85;u.pitch=1.1;u.lang=v?v.lang:'en-US';if(v)u.voice=v;SS.speak(u)}catch(e){}}
$('readb').onclick=readAloud;$('stopb').onclick=stopRead;if(!SS)$('readb').classList.add('hide');
// ---- world ----
let G={running:false};
const carn=()=>true; // all dinos eat the same way now
const CRIT=[{k:'liz',w:28,h:10,s:2},{k:'dodo',w:16,h:16,s:2},{k:'mammoth',w:30,h:20,s:2.5},{k:'bug',w:16,h:14,s:2}];
const ov=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
function near(x){return G.solids.filter(s=>s.x<x+300&&s.x+s.w>x-300)}
function moveBody(b){b.hitWall=0;b.bonk=null;const ss=near(b.x);b.x+=b.vx;for(const s of ss)if(ov(b,s)){if(s.k=='wall')b.x=(b.x+b.w/2<s.x+s.w/2)?s.x-b.w:s.x+s.w;else if(b.vx>0)b.x=s.x-b.w;else if(b.vx<0)b.x=s.x+s.w;b.hitWall=1}
 b.vy=Math.min(b.vy+GRAV,12);b.y+=b.vy;b.on=null;for(const s of ss)if(s.k!='wall'&&ov(b,s)){if(b.vy>0){b.y=s.y-b.h;b.vy=0;b.on=s}else{b.y=s.y+s.h;b.vy=0;b.bonk=s}}}
function groundTop(x){let t=null;for(const s of G.solids)if(s.k=='g'||s.k=='arena'){if(x>=s.x&&x<=s.x+s.w&&(t==null||s.y<t))t=s.y}return t}
function solidBelow(x,y){return G.solids.some(s=>x>=s.x&&x<=s.x+s.w&&y>=s.y-2&&y<=s.y+8)}
function addGround(x,w,top){G.solids.push({x,y:top,w,h:800,k:'g'})}
function genSection(n,x0){let b;do{b=pickA(BIOMES)}while(G.lastBiome&&b.n==G.lastBiome);G.lastBiome=b.n;
 const DX=Dx(n),RT=DK.rate(DX),SP=DK.spd(DX),SL=secLen(n),sec={n,x0,L:SL,biome:b,goal:3+Math.min(5,n>>1),ate:0,pits:[],steps:[]};let x=x0,lastTop=GY;const end=x0+SL,diff=Math.min(1,n/8);
 const flat=w=>{addGround(x,w,GY);const g={x,w,top:GY};x+=w;lastTop=GY;return g},grounds=[],vols=[x0+R(.4,.55)*SL];let cracked=n>1&&Math.random()<.55;
 grounds.push(flat(n==1?T*14:T*6));
 while(x<end-T*16){
  if(vols.length&&x>=vols[0]){vols.shift();const g=flat(T*10);G.vols.push({x:g.x+T*3,y:GY,w:T*4});continue}
  const r=Math.random();
  if(r<(.22+diff*.1)*Math.min(1.25,Math.pow(DX,.1))){const w=T*(Math.random()<.3+diff*.4?3:2);sec.pits.push({x,w});x+=w;grounds.push(flat(T*RI(3,5)))}
  else if(r<.42){const h=pickA([30,60]),w=T*RI(4,7);addGround(x,w,GY-h);sec.steps.push({x,w,h});grounds.push({x,w,top:GY-h});x+=w;grounds.push(flat(T*RI(3,5)))}
  else if(r<.62){const g=flat(T*8);G.solids.push({x:g.x+T*2,y:GY-110,w:T*RI(3,4),h:18,k:'p'});grounds.push(g);grounds.push({x:g.x+T*2,w:T*3,top:GY-110})}
  else if(r<.8){const g=flat(T*7);grounds.push(g);for(let i=0;i<3;i++){const k=cracked&&i==1?'cr':(i==1?'q':'brick');if(k=='cr')cracked=false;G.solids.push({x:g.x+T*2+i*T,y:GY-120,w:T,h:T,k,item:null})}}
  else if(r<.9){const g=flat(T*7);grounds.push(g);const hh=pickA([60,90]),kind=pickA(['log','stump','pillar']);G.solids.push({x:g.x+T*3,y:GY-hh,w:T*2,h:hh,k:kind});sec.steps.push({x:g.x+T*3,w:T*2,h:hh,obst:1})}
  else grounds.push(flat(T*RI(5,9)));}
 {const g=flat(end-x+T);grounds.push(g);G.vols.push({x:end-T*9,y:GY,w:T*4,end:1,sec:n})}
 const gs=grounds.filter(g=>g.w>=T*2&&g.x>x0+(n==1?T*6:0));
 const onG=(w,h)=>{const g=pickA(gs);return {x:R(g.x+4,g.x+g.w-w-4),y:g.top-h}};
 for(let i=0;i<CROWD;i++){const p=onG(18,26);G.people.push({...p,w:18,h:26,vx:0,vy:0,e:pickA(PEOPLE),v:RI(0,5)})}
 for(let i=0;i<RI(4,6);i++){const c=pickA(CRIT),p=onG(c.w,c.h);G.critters.push({...p,w:c.w,h:c.h,k:c.k,sc:c.s,vx:pickA([-.5,.5]),vy:0})}
 for(let i=0;i<Math.min(24,Math.round((5+Math.min(6,n))*RT));i++){const p=onG(26,22);G.littles.push({...p,w:26,h:22,vx:-.8*SP,vy:0,c:RI(0,3)})}
 for(let i=0;i<Math.min(12,Math.round(Math.min(5,1+(n>>1))*RT));i++){const p=onG(24,34);if(p.x>x0+T*12)G.rangers.push({...p,w:24,h:34,vx:.8*SP,vy:0,stun:0,sp:SP})}
 const gsB=gs.filter(g=>g.top>=GY-1&&g.w>=T*4);for(let i=0;i<(n>1&&Math.random()<BIG_CHANCE?1:0);i++){const gg=pickA(gsB.length?gsB:gs),p={x:R(gg.x+4,gg.x+Math.max(8,gg.w-60)),y:gg.top-60};if(p.x>x0+T*16)G.bigs.push({...p,w:56,h:60,vx:-.6,vy:0,f:-1,chomp:0,ate:0,bcd:0})}
 for(let i=0;i<6;i++){const g=pickA(gs);G.pel.push({x:R(g.x+10,g.x+g.w-10),y:g.top-70})}
 if(Math.random()<.35){const g=pickA(gs);G.gemsW.push({x:g.x+g.w/2,y:g.top-60})}
 for(let i=0;i<16;i++)G.deco.push({x:R(x0,end),e:pickA(b.d),s:pickA([2,3])});for(let i=0;i<3;i++){const gg=pickA(gs.filter(q=>q.top==GY&&q.w>=T*4)||gs);if(gg)G.deco.push({x:gg.x+R(10,gg.w-60),e:pickA(['hut','fire','hut']),s:3,front:1})}
 G.secs.push(sec);return sec}
function curSec(x){for(let i=G.secs.length-1;i>=0;i--)if(x>=G.secs[i].x0)return G.secs[i];return G.secs[0]}
function start(sv){if(!sv||!sv.bossN)sv=null;if(sv){diff=sv.diff in DIFFS?sv.diff:diff;if(sv.pick>=0&&sv.pick<DINOS.length)pick=sv.pick}ZK=0;view();ORDER=ORDER_ALL;G={diff,running:true,score:0,hearts:5,lives:5,belly:0,bv:0,jig:0,eaten:0,grow:1,erupts:0,bossN:0,boss:null,solids:[],people:[],littles:[],critters:[],rangers:[],boulders:[],vols:[],pel:[],gemsW:[],deco:[],portals:[],secs:[],fly:[],safe:[],toss:[],parts:[],goo:[],smoke:[],msgs:[],waves:[],meteors:[],lava:[],rival:null,ch:null,chN:0,chT:14,banner:null,secBanner:null,shake:0,flash:0,burst:null,hit:0,dash:0,charge:0,pwSel:null,pwOn:0,pwKind:null,flame:0,bigSec:-1,dayT:0,el:0,boulT:5,camX:0,cur:1,inBonus:0,lastBiome:null,lastSafe:{x:60,y:GY-40},trail:[],lines:[],bigs:[],noms:[],thrown:0,drops:[],bitems:[],pshots:[],bshots:[],held:null,sjump:0,magnet:0,star:0,buddy:null,lastSurprise:null,bossHint:null,stage:0,fat:false,roll:false,wad:0,strk:0};
 const n0=sv?5*sv.bossN+1:1;let x0=0;for(let i=1;i<n0;i++)x0+=secLen(i);G.d={x:x0+60,y:GY-40,w:34,h:36,vx:0,vy:0,f:1,on:null};genSection(n0,x0);genSection(n0+1,x0+secLen(n0));G.cur=0;G.champ=0;G.paused=0;$('quitq').classList.add('hide');$('contq').classList.add('hide');$('champ').classList.add('hide');
 if(sv){Object.assign(G,{score:sv.score|0,lives:Math.max(1,sv.lives|0),hearts:Math.max(1,sv.hearts|0),bossN:sv.bossN,thrown:sv.thrown|0,eaten:sv.eaten|0,camX:x0,lastSafe:{x:x0+60,y:GY-40}});G.secBanner=null}
 ['start','end','how'].forEach(i=>$(i).classList.add('hide'));enterSec(G.secs[0]);hud();updPw();beep(440,.1);beep(660,.15)}
function enterSec(s){G.cur=s.n;G.secBanner={t:'SECTION '+s.n+' · '+s.biome.n,l:2.4};const p=G.secs.find(q=>q.n==s.n-1);if(p&&carn()&&p.ate>=p.goal){G.score+=200;msg('Dino goal met! +200',G.d.x,G.d.y-60,'#ffea00')}hud()}
const cap=()=>(MAXB+Math.min(6,Math.floor(G.eaten/20)))*(G.bigSec===G.cur?2:1);
const stageOf=n=>n>=ROLL_AT?2:n>=FAT_AT?1:0,STAGE_N=['HUNGRY','FAT','ROLL!'];
function hud(){$('score').textContent=G.score;$('hearts').textContent=G.hearts>5?'❤️x'+G.hearts:'❤️'.repeat(Math.max(0,G.hearts));$('belly').textContent='😋'+G.belly+'/'+cap();const s=curSec(G.d.x);$('goal').textContent=carn()?'🦎'+s.ate+'/'+s.goal:'';$('gems').textContent=gems;$('sec').textContent=G.inBonus?'★':G.cur}
function msg(t,x,y,c='#fff'){const o=G.msgs.find(m=>m.t===t&&Math.abs(m.x-x)<120);if(o){if(o.l<.7){o.l=.9;o.x=x;o.y=y}return}G.msgs.push({t,x,y,l:.9,c});while(G.msgs.length>5)G.msgs.shift()}
function poof(x,y,n=8){for(let i=0;i<n;i++){const a=i/n*6.283;G.smoke.push({x,y,vx:Math.cos(a)*1.6,vy:Math.sin(a)*1.2-.4,r:7,l:.55})}for(let i=0;i<8;i++)G.parts.push({x,y,vx:R(-3,3),vy:R(-5,-1),l:.6,r:3,c:pickA(['#fff','#ffea00'])});beep(520,.06,'square',1040);setTimeout(()=>beep(880,.08,'sine',1320),60)}
// ---- powers ----
function UNL(k){if(unl[k])return;unl[k]=1;LS.dinoColossus_Unlocks=JSON.stringify(unl);G.banner={t:'🔓 UNLOCKED! '+POWERS[k].e+' '+POWERS[k].n,l:2.5};G.pwSel=k;confetti(G.camX+VW/2,GY-200,50);beep(523,.15);setTimeout(()=>beep(659,.15),150);setTimeout(()=>beep(1046,.35),300);updPw();showPowers()}
function saveStats(){LS.dinoColossus_Stats=JSON.stringify(stats);if(stats.eaten>=25)UNL('speed');if(stats.erupts>=4)UNL('big')}
function updPw(){const ks=Object.keys(POWERS).filter(k=>unl[k]);$('bp').classList.toggle('hide',!ks.length);$('bs').classList.toggle('hide',ks.length<2);if(!ks.length)return;if(!G.pwSel||!unl[G.pwSel])G.pwSel=ks[0];$('bp').innerHTML=POWERS[G.pwSel].e+'<small>'+Math.floor(G.charge)+'%</small>';$('bp').style.filter=G.charge>=100?'none':'grayscale(.6)'}
function usePower(){const k=G.pwSel;if(!G.running||!k||!unl[k]||G.charge<100||G.pwOn)return;G.charge=0;G.pwKind=k;const d=G.d;
 if(k=='speed'){G.pwOn=8;msg('SPEED BOOST!',d.x,d.y-50,'#00e5ff')}else if(k=='big'){G.bigSec=G.cur;G.pwOn=.01;msg('BIG BELLY x2!',d.x,d.y-50,'#00e5ff')}else{G.flame=120;G.pwOn=2;msg('FLAME BREATH!',d.x,d.y-50,'#ff9800');beep(150,1.5,'sawtooth',90)}beep(700,.1,'sine',1400);updPw();hud()}
function confetti(x,y,n){for(let i=0;i<n;i++)G.parts.push({x,y,vx:R(-6,6),vy:R(-9,-2),l:1.3,r:R(3,6),c:pickA(['#f44336','#ffeb3b','#4caf50','#2196f3','#e91e63'])})}
// ---- damage ----
function hurt(why,o){o=o||{};if(G.hit||G.safeT>0||!G.running||G.inv)return;VIS.buzz(40);G.hit=70;
 if(G.belly&&!o.keep){dropLoad(true);G.hit=70;msg('BLEH! You lost your snack!',G.d.x+G.d.w/2,G.d.y-40,'#b2ff59');for(let i=0;i<14;i++)G.goo.push({x:G.d.x+G.d.w/2+G.d.f*12,y:G.d.y+10,vx:G.d.f*R(1,4),vy:R(-6,-2),l:.8,r:R(3,6)});barfSnd();G.d.vy=-6;hud();return}
 G.hearts--;msg(why,G.d.x,G.d.y-40);for(let i=0;i<8;i++)G.smoke.push({x:G.d.x+17,y:G.d.y+10,vx:R(-1.5,1.5),vy:R(-2,-.5),r:8,l:.8});G.d.vy=-6;beep(200,.3,'triangle',80);hud();if(G.hearts<=0&&!G.dying)loseLife()}
// ---- v17 respawn: safe spot back from pit edges, 0.5 s blink pause, 1.5 s safe moment, held left/right ignored until released
function safeSpot(){const d=G.d,ok=x=>[-24,0,d.w/2,d.w,d.w+40].every(o=>groundTop(x+o)!=null);let x=Math.max(G.camX+10,G.lastSafe.x-10);
 for(let k=0;k<60&&!ok(x);k++)x-=10;if(x<G.camX+10||!ok(x))x=Math.max(G.camX+10,G.lastSafe.x-10);const gt=groundTop(x+d.w/2);return {x,y:(gt!=null?gt:G.lastSafe.y+d.h)-d.h-2}}
function respawn(how){const d=G.d;if(G.inBonus){d.x=Math.min(Math.max(d.x,G.camX+2),G.camX+VW-d.w-2);d.y=GY-d.h-2}else if(how!=='stay'){const p=safeSpot();d.x=p.x;d.y=p.y}
 d.vx=0;d.vy=0;G.spawnT=30;G.safeT=90;G.needRel=1;G.hit=Math.max(G.hit,90)}
function loseLife(){G.lives--;if(G.lives<=0){G.dying=1;G.hearts=0;G.banner={t:'OUT OF LIVES!',l:2};const tok=G;setTimeout(()=>{if(G===tok)askCont()},900);hud();return}
 G.hearts=5;G.hit=150;G.belly=0;G.banner={t:'LIFE LOST! '+G.lives+' LEFT',l:2};beep(330,.25,'triangle',165);setTimeout(()=>beep(220,.35,'triangle',110),250);
 respawn(G.boss?'stay':'');hud()}
// ---- v16 Continue? after OUT OF LIVES: 20 s real-time countdown (paused while the app is hidden), Yes = 5 hearts + 5 lives
// at the same section (or the start of the same boss, boss back to full health), score kept. No / time up = normal game over + Top 10 entry, once.
let contT=null;
function askCont(){if(!G.dying||G.cont||G.contDone)return;G.running=false;G.banner=null;G.secBanner=null;G.cont={left:20,last:performance.now()};
 $('contN').textContent='20';$('contRing').style.setProperty('--p','1');$('contq').classList.remove('hide');beep(440,.15);
 clearInterval(contT);contT=setInterval(contTick,100)}
function contTick(){const c=G.cont;if(!c){clearInterval(contT);return}const now=performance.now();if(!document.hidden)c.left-=(now-c.last)/1000;c.last=now;
 const n=Math.max(0,Math.ceil(c.left));if($('contN').textContent!=String(n)){$('contN').textContent=n;if(n>0&&n<=5)beep(660,.05)}$('contRing').style.setProperty('--p',String(Math.max(0,c.left/20)));if(c.left<=0)contNo()}
function contClose(){clearInterval(contT);G.cont=null;$('contq').classList.add('hide')}
function contYes(){if(!G.cont)return;contClose();G.continues=(G.continues|0)+1;G.dying=0;G.lives=5;G.hearts=5;G.hit=150;G.inv=0;G.belly=0;G.banner={t:'CONTINUE! 5 LIVES',l:2};
 const d=G.d;d.vx=0;d.vy=0;const b=G.boss;
 if(b&&!b.gone){G.bossHint=null;b.hp=b.max;b.vuln=0;b.bonked=0;b.inv=0;b.say='';G.bshots=[];G.pshots=[];G.drops=[];G.bitems=[];G.held=null;d.x=G.camX+60;d.y=GY-80;try{ARCH[b.T.a].init(b)}catch(_){}b.hp=b.max;updAtk()}
 if(!b||b.gone)respawn('');else respawn('stay')
 G.running=true;hud();beep(523,.12);setTimeout(()=>beep(784,.2),120)}
function contNo(){if(!G.cont)return;contClose();G.contDone=1;G.running=true;end()}
$('contYes').onclick=contYes;$('contNo').onclick=contNo;
function dropLoad(silent){if(!G.belly||G.inv)return;const d=G.d;if(G.boss){G.belly=0;msg('They ran home!',d.x,d.y-60,'#fff');hud();return}for(let i=0;i<G.belly;i++)G.people.push({x:d.x+R(-30,50),y:d.y-10,w:18,h:26,vx:R(-3,3),vy:R(-6,-3),e:pickA(PEOPLE)});G.belly=0;if(!silent){G.hit=50;msg('Oops! Dropped them!',d.x,d.y-40);beep(200,.3,'triangle',80)}hud()}
function knock(from){G.d.vx=(G.d.x<from.x?-1:1)*7;G.d.vy=-5;G.push=14}
// ---- volcano ----
function erupt(v){const n=G.belly;G.belly=0;G.thrown=(G.thrown||0)+n;hud();const d=G.d,cx=v.x+v.w/2,cy=v.y-95;
 for(let i=0;i<n;i++)G.toss.push({x:d.x+17,y:d.y,tx:cx+R(-8,8),ty:cy,t:-i*5,e:pickA(PEOPLE)});
 for(let i=0;i<25;i++)G.goo.push({x:d.x+17+d.f*15,y:d.y+8,vx:(cx-d.x)/28+R(-1.5,1.5),vy:R(-9,-5),l:1,r:R(4,9)});
 msg('BLEHHH!',d.x+17,d.y-30,'#76ff03');barfSnd();G.busyVol=v;setTimeout(()=>boom(n,v),900)}
function boom(n,v){if(!G.running)return;G.busyVol=null;const cx=v.x+v.w/2,cy=v.y-120,pts=n*n*10,k=.6+Math.max(n,v.end?3:0)*.25;G.score+=pts;if(n){G.erupts++;stats.erupts++;saveStats()}G.grow=Math.min(1.4,G.grow+.04);
 const nn=Math.max(n,v.end?3:0);G.shake=15+nn*6;G.flash=.35;G.burst={x:cx,y:cy,r:0,max:60+nn*30,l:1};
 for(let i=0;i<n;i++)G.fly.push({x:cx,y:cy,vx:R(-4,4),vy:R(-13,-9),e:pickA(PEOPLE),chute:0});
 for(let i=0;i<30+nn*15;i++)G.parts.push({x:cx,y:cy,vx:R(-6,6)*k,vy:R(-12,-3)*k,l:1,r:R(4,10),c:pickA(['#ff3d00','#ff6d00','#ffb300','#ffea00'])});
 for(let i=0;i<6+nn*2;i++)G.smoke.push({x:cx+R(-20,20),y:cy-10,vx:R(-1.2,1.2),vy:R(-2,-.8),r:R(15,25)*k,l:1});
 msg(n?'+'+pts+(n>=5?' MEGA BOOM!':' BOOM!'):'BOOM!',cx,cy-60,'#ffea00');boomSnd(nn);hud();if(v.end&&v.sec%5==0&&!G.boss)setTimeout(startBoss,2600)}
// ---- challenges (add new types here) ----
const CHALLENGES={
 meteor:{name:'METEOR SHOWER!',dur:12,start(c){c.next=1},update(c){c.next-=1/60;if(c.next<=0){c.next=Math.max(.35,1.1-c.lvl*.2);for(let i=0;i<1+(c.lvl>>1)+1;i++){const x=Math.random()<.4?G.d.x+R(-40,60):R(G.camX+30,G.camX+VW-30),t=groundTop(x);if(t!=null)G.meteors.push({x,y:t,t:0,T:80})}}}},
 rival:{name:'RIVAL RACE!',dur:20,start(c){c.you=0;c.riv=0;G.rival={x:G.camX+VW-60,y:GY-120,w:34,h:36,vx:0,vy:0,f:-1,dizzy:0,ate:0}},
  update(c){const r=G.rival;if(!r)return;if(r.dizzy>0){r.dizzy-=1/60;r.vx=0;moveBody(r);return}let tg=null,bd=1e9;for(const p of G.people){const q=Math.abs(p.x-r.x);if(q<bd&&p.x>G.camX-50&&p.x<G.camX+VW+300){bd=q;tg=p}}
   r.vx=tg?Math.sign(tg.x-r.x)*(2.4+c.lvl*.3):0;r.f=r.vx<0?-1:1;if(r.on){const ax=r.x+(r.vx>0?r.w+8:-8);if(!solidBelow(ax,r.y+r.h+2)||r.hitWall)r.vy=JV}moveBody(r);if(r.y>GY+300){r.x=G.camX+VW-60;r.y=GY-200;r.vy=0}
   for(let i=G.people.length-1;i>=0;i--)if(ov(r,G.people[i])){G.people.splice(i,1);c.riv++;r.ate++;beep(200,.08)}
   if(ov(r,G.d)&&G.d.h>r.h*1.08&&!(G.d.vy>0&&G.d.y+G.d.h-r.y<16)){const n=r.ate;for(let i=0;i<n;i++)G.people.push({x:r.x+R(-20,40),y:r.y-20,w:18,h:26,vx:R(-3,3),vy:-5,e:pickA(PEOPLE),v:RI(0,5)});if(G.belly<cap())eat();c.riv=0;c.you+=1;G.score+=150;msg('You ate the smaller rival! +150',r.x,r.y-30,'#ffea00');G.rival=null;c.t=.01;return}
   if(ov(r,G.d)){if(G.d.vy>0&&G.d.y+G.d.h-r.y<16){poof(r.x+r.w/2,r.y+r.h/2);r.dizzy=2;G.d.vy=-8;msg(r.ate?'Stomp! Rival drops '+r.ate:'Stomp! Rival dizzy!',r.x,r.y-30,'#ffea00');for(let i=0;i<r.ate;i++)G.people.push({x:r.x+R(-20,40),y:r.y-20,w:18,h:26,vx:R(-3,3),vy:-5,e:pickA(PEOPLE)});c.riv=Math.max(0,c.riv-r.ate);r.ate=0;beep(900,.15,'square',300)}}},
  finish(c){if(c.you>c.riv){const b=150*c.lvl;G.score+=b;msg('You beat the rival! +'+b,G.d.x,G.d.y-70,'#ffea00')}else msg('Rival wins this time!',G.d.x,G.d.y-70);G.rival=null}},
 lava:{name:'LAVA FLOW!',dur:13,start(c){c.next=1.6;beep(50,1.2,'sawtooth',35);G.shake=25;msg('Rumble rumble…',G.d.x,G.d.y-60,'#ffab40')},update(c){c.next-=1/60;if(c.next<=0){c.next=Math.max(1.6,3.2-c.lvl*.4);G.lava.push({x:G.camX+VW+10,w:Math.min(90,R(36,56)+c.lvl*10),vx:-Math.min(4.2,(1.4+c.lvl*.3)),ph:0})}}}
};
const ORDER_ALL=['meteor','rival','lava'];let ORDER=ORDER_ALL;
function startChallenge(){const k=ORDER[G.chN%ORDER.length],lvl=1+Math.floor(G.chN/ORDER.length)+Math.floor(G.cur/4)+DK.extra(Dx());G.chN++;G.ch={k,lvl,t:CHALLENGES[k].dur};G.banner={t:CHALLENGES[k].name,l:1.6};beep(600,.15);setTimeout(()=>beep(600,.15),200);CHALLENGES[k].start(G.ch)}
function endChallenge(){const c=G.ch;if(!c)return;if(CHALLENGES[c.k].finish)CHALLENGES[c.k].finish(c);else{const b=50*c.lvl;G.score+=b;msg('Survived! +'+b,G.d.x,G.d.y-70,'#ffea00');beep(784,.3,'sine',1046)}G.ch=null;G.chT=Math.max(3,Math.max(8,16-G.cur)/DK.rate(Dx()));hud()}
// ---- bosses (side-view arenas) ----
const NBOSS=20;
// each boss: own species art (SPR.boss[i]), own move style (a) and own throw (throwK); later bosses = more HP, faster, more throws
const BOSSES=[
 ['BRONTOSAURUS','stomp','rock',{}],['PTERODACTYL','fly','bone',{}],['T-REX','charge','fire',{roar:1}],['TRICERATOPS','charge','log',{horn:1}],
 ['STEGOSAURUS','stomp','spike',{tail:'Spiky tail! JUMP'}],['ANKYLOSAURUS','stomp','shell',{big:1,tail:'Tail club! JUMP'}],['SPINOSAURUS','leap','fish',{snap:1}],['PARASAUROLOPHUS','spit','note',{honk:1}],
 ['RAPTOR LEADER','leap','egg',{quick:1}],['PACHYCEPHALOSAURUS','charge','coconut',{bounce:1}],['ALLOSAURUS','charge','tooth',{roar:1}],['DILOPHOSAURUS','spit','acid',{}],
 ['CARNOTAURUS','charge','mud',{fast:1}],['MOSASAURUS','swim','water',{}],['QUETZALCOATLUS','fly','feather',{twice:1}],['THERIZINOSAURUS','leap','leaf',{slash:1}],
 ['IGUANODON','stomp','pinecone',{two:1}],['GIGANOTOSAURUS','charge','lava',{roar:1,fast:1}],['BARYONYX','swim','crab',{}],['COLOSSUS KING','mega','comet',{roar:1,big:1}]
].map(([name,a,throwK,o],i)=>({i,n:i+1,name:'👑 '+name,short:name,a,throwK,o,fly:a=='fly',sc:a=='fly'?3.3:(i==19?4.6:3.5+i*.03)}));
const THROWN={rock:'Bonk! A rock!',bone:'Bonk! A bone!',fire:'Hot! Fireball!',log:'Bonk! A log!',spike:'Ouch! A spike!',shell:'Bonk! Armor plate!',fish:'Splat! A fish!',note:'HONK! Too loud!',egg:'Splat! An egg!',coconut:'Bonk! A coconut!',tooth:'Ouch! A big tooth!',acid:'Yuck! Goo spit!',mud:'Splat! Mud ball!',water:'Splash! Water!',feather:'Whoosh! Feather!',leaf:'Slap! Leaves!',pinecone:'Ouch! Pinecone!',lava:'Hot! Lava blob!',crab:'Pinch! A crab!',comet:'Zap! A comet!'};
function bossSpd(n){return 1.15*(1+.03*(n-1))*DK.bossSpd(Dbase())} // v15: old hard curve x D
function bossHP(n){return Math.max(4,Math.round((5+n*.55)*1.2*DK.bossHP(Dbase())))} // v15: old hard HP x D^0.4
const ARCH={
 stomp:{init(b){b.x=G.camX+AW()-b.w-30;b.y=GY-b.h;b.cd=2;b.step=0},
  act(b){if(b.vuln)return;if(b.w2&&--b.w2==0)G.waves.push({x:b.x,vx:-4.5*b.s,h:18});b.cd-=1/60;b.tele=b.cd<.7;if(b.cd<=0){b.cd=2.6/b.s;if(b.step++%2==0){G.shake=b.T.o.big?24:18;beep(60,.4,'sawtooth',30);G.waves.push({x:b.x,vx:-4.5*b.s,h:b.T.o.big?26:22});if(b.T.o.two)b.w2=45;b.vuln=2.4;b.say='Head down! Jump on it!'}else{G.waves.push({x:b.x,vx:-6.5*b.s,h:16,tail:1});msg(b.T.o.tail||'Tail sweep! JUMP',b.x,b.y-20)}}}},
 fly:{init(b){b.x=G.camX+AW()/2;b.y=GY-215;b.cd=2;b.mode='fly';b.dv=0},
  act(b){b.cd-=1/60;if(b.mode=='fly'){b.x=G.camX+AW()/2-b.w/2+Math.sin(G.el*1.3*b.s)*(AW()/2-b.w/2-30);b.y+=(GY-215-b.y)*.1;b.tele=b.cd<.7;if(b.cd<=0){b.mode='dive';b.tx=G.d.x-b.w/4;b.cd=1.1/b.s}}
   else if(b.mode=='dive'){b.x+=(b.tx-b.x)*.08*b.s;b.y+=(GY-b.h-b.y)*.08*b.s;if(b.cd<=0){if(b.T.o.twice&&!b.dv){b.dv=1;b.mode='fly';b.y=GY-150;b.cd=.6;return}b.dv=0;b.mode='rest';b.y=GY-b.h;b.vuln=2.6;b.say='Resting! Jump on it!';b.cd=2.6}}
   else if(!b.vuln){b.y-=4;if(b.y<GY-200){b.mode='fly';b.cd=2.4/b.s}}}},
 charge:{init(b){b.x=G.camX+AW()-b.w-20;b.y=GY-b.h;b.cd=2;b.vx=0},
  act(b){if(b.vuln)return;if(b.vx){b.x+=b.vx;if(b.T.o.bounce&&b.y>=GY-b.h)b.hop=(b.hop||0)+1;const L=G.camX+4,Rr=G.camX+AW()-b.w-4;if(b.x<L||b.x>Rr){b.x=Math.max(L,Math.min(Rr,b.x));b.vx=0;G.shake=15;beep(70,.3,'square',40);b.vuln=b.T.o.horn?3:2.6;b.say=b.T.o.horn?'Horns stuck! Jump on it!':'Dizzy! Jump on its head!'}return}
   b.cd-=1/60;b.tele=b.cd<.8;if(b.cd<=0){if(b.T.o.roar&&Math.random()<.35){msg('ROAAAR!',b.x+b.w/2,b.y-20,'#ff5252');beep(110,.6,'sawtooth',60);G.d.vx=Math.sign(G.d.x-b.x)*10;G.push=20;b.cd=1.5}else{b.vx=Math.sign(G.d.x-b.x)*Math.min(10.5,(b.T.o.fast?8.5:7.5)*b.s);b.cd=2.2/b.s;if(b.T.o.horn)msg('HORN CHARGE!',b.x+b.w/2,b.y-20,'#ffab40')}}}},
 leap:{init(b){b.x=G.camX+AW()-b.w-30;b.y=GY-b.h;b.cd=2;b.air=0;b.vx=0},
  act(b){if(b.air){b.vy+=.5;b.x+=b.vx;b.y+=b.vy;const L=G.camX+4,Rr=G.camX+AW()-b.w-4;b.x=Math.max(L,Math.min(Rr,b.x));if(b.y>=GY-b.h){b.y=GY-b.h;b.air=0;b.vx=0;G.shake=12;beep(80,.3,'square',40);
     if(!b.T.o.quick){G.waves.push({x:b.x,vx:-4*b.s,h:14});G.waves.push({x:b.x+b.w,vx:4*b.s,h:14})}b.vuln=b.T.o.quick?1.8:2.3;b.say='Landed! Jump on it!'}return}
   if(b.vuln)return;b.cd-=1/60;b.tele=b.cd<.7;if(b.cd<=0){b.air=1;b.vy=-11;const tx=G.d.x+G.d.w/2-b.w/2;b.vx=Math.max(-9,Math.min(9,(tx-b.x)/44));b.cd=(b.T.o.quick?1.6:2.4)/b.s;msg(b.T.o.snap?'SNAP!':b.T.o.slash?'SLASH!':'POUNCE!',b.x+b.w/2,b.y-20,'#ff8a80');beep(500,.12,'square',200)}}},
 swim:{init(b){b.x=G.camX+AW()-b.w-30;b.y=GY+8;b.cd=2;b.mode='under'},
  act(b){if(b.mode=='under'){b.y=GY+8;const tx=G.d.x+G.d.w/2-b.w/2;b.x+=Math.sign(tx-b.x)*Math.min(Math.abs(tx-b.x),2*b.s);b.cd-=1/60;b.tele=b.cd<.8;
     if(G.pshots.length||b.cd<=0){b.mode='up';b.y=GY-b.h;b.cd=.45;G.shake=14;beep(150,.3,'sine',500);for(let i=0;i<16;i++)G.parts.push({x:b.x+R(0,b.w),y:GY-4,vx:R(-3,3),vy:R(-8,-3),l:.8,r:R(3,6),c:'#81d4fa'});msg('SPLASH!',b.x+b.w/2,b.y-20,'#81d4fa')}return}
   if(b.mode=='up'){b.cd-=1/60;if(b.cd<=0){b.mode='rest';b.vuln=2.6;b.say='Out of the water! Jump on it!'}return}
   if(!b.vuln){b.mode='under';b.cd=2.6/b.s}}},
 spit:{init(b){b.x=G.camX+AW()-b.w-30;b.y=GY-b.h;b.cd=2;b.vx=-.6},
  act(b){if(b.vuln)return;const L=G.camX+AW()*.45,Rr=G.camX+AW()-b.w-6;b.x+=b.vx*b.s;if(b.x<L||b.x>Rr){b.x=Math.max(L,Math.min(Rr,b.x));b.vx=-b.vx}
   b.cd-=1/60;b.tele=b.cd<.8;if(b.cd<=0){b.cd=3/b.s;const n=3+(Dbase()>=8?1:0),cfg=thrCfg();
    if(b.T.o.honk){msg('HONK HONK!',b.x+b.w/2,b.y-20,'#fff59d');beep(220,.4,'square',330);G.waves.push({x:b.x,vx:-5*b.s,h:16})}else msg('SPIT!',b.x+b.w/2,b.y-20,'#b2ff59');
    for(let i=0;i<n;i++){const tx=G.d.x+G.d.w/2+(i-(n-1)/2)*90,ty=groundTop(tx);if(ty!=null)G.bshots.push({k:b.T.throwK,sx:b.x+b.w*.85,sy:b.y+12,tx,ty,t:0,T:cfg.T+10})}b.vuln=2.2;b.say='Out of breath! Jump on it!'}}},
 mega:{init(b){ARCH.charge.init(b);b.ph=0},act(b){const k=['charge','leap','stomp'][b.ph%3];if(k!='charge')b.vx=b.air?b.vx:0;ARCH[k].act(b)}}
};
function startBoss(){if(!G.running||G.boss||G.inBonus)return;const T0=BOSSES[G.bossN%NBOSS];G.bossN++;G.ch=null;G.rival=null;G.lava=[];G.meteors=[];G.waves=[];
 const KS=['people','critters','littles','rangers','bigs','boulders'];G.bossStash={};KS.forEach(k=>{G.bossStash[k]=G[k];G[k]=[]});G.fly=[];G.safe=[];G.toss=[];G.noms=[];
 G.arenaW=bossVW();G.arena=[{x:G.camX-40,y:GY,w:AW()+80,h:800,k:'arena'},{x:G.camX-30,y:GY-900,w:30,h:900,k:'wall'},{x:G.camX+AW(),y:GY-900,w:30,h:900,k:'wall'}];G.solids.push(...G.arena);
 G.solids=G.solids.filter(s=>!(s.k!='arena'&&s.k!='wall'&&s.x<G.camX+AW()&&s.x+s.w>G.camX&&s.y<GY));if(G.d.y>GY-G.d.h)G.d.y=GY-G.d.h-2;
 const c=SPR.boss[T0.i][0],n=T0.n,b={T:T0,n,w:Math.round(c.width*T0.sc*.8),h:Math.round(c.height*T0.sc*.8),hp:bossHP(n),s:bossSpd(n),vuln:0,bonked:0,say:''};b.max=b.hp;b.inv=0;ARCH[T0.a].init(b);G.boss=b;
 G.banner={t:'BOSS '+n+'/'+NBOSS+'!',l:2};G.bossHint={t:'GRAB THE FALLING WEAPONS! DODGE THE BOSS!',n:'BOSS '+n+'/'+NBOSS+' · '+T0.short,l:5.5};G.drops=[];G.bitems=[];G.pshots=[];G.bshots=[];G.held=null;G.dropT=2;b.thT=thrCfg().every+1;updAtk();say('Grab the falling weapons! Dodge the boss!');beep(300,.2);setTimeout(()=>beep(200,.4),200)}
function updBoss(){const b=G.boss,d=G.d;if(b.gone){b.x+=7;b.y-=2;if(b.x>G.camX+AW()+200){G.boss=null;G.drops=[];G.bitems=[];G.pshots=[];G.bshots=[];G.held=null;updAtk();G.solids=G.solids.filter(s=>!G.arena.includes(s));const ax=G.camX+AW()+40;G.arenaW=0;if(G.bossStash)for(const k in G.bossStash)G[k]=G[k].concat(G.bossStash[k].filter(o=>o.x>ax));G.bossStash=null;G.arena=null;if(G.bossN>=NBOSS)setTimeout(champion,400);else saveRun()}return}
 ARCH[b.T.a].act(b);bossArms(b);if(b.inv)b.inv--;if(b.vuln){b.vuln-=1/60;if(b.vuln<=0){b.vuln=0;b.bonked=0;b.say='';if(b.T.a=='mega')b.ph++}}
 if(ov(d,b)){const top=d.vy>0&&d.y+d.h-b.y<Math.max(26,b.h*.45);if(top){d.vy=-10;d.y=b.y-d.h;if(!b.inv)hitBoss(b,'BONK!')}
  else if(G.roll&&Math.abs(d.vx)>3&&!b.inv){hitBoss(b,'SPIN ATTACK!');d.vx=-Math.sign(d.vx)*6;d.vy=-6}
  else if(!b.vuln&&!G.hit&&!b.inv){hurt('Ouch!');knock({x:b.x+b.w/2})}else if(!G.push)knock({x:b.x+b.w/2})}}
function hitBoss(b,t,dmg,force){if(b.gone||(b.inv&&!force))return;b.bonked=1;b.hp=Math.max(0,b.hp-(dmg||1));b.inv=45;b.vuln=Math.min(b.vuln||.5,.5);G.bossHint=null;G.shake=10;beep(900,.15,'square',300);msg(t,b.x+b.w/2,b.y-20,'#ffea00');
 if(b.hp<=0){b.gone=1;b.vuln=0;const pts=500*G.bossN;G.score+=pts;msg('Boss beaten! +'+pts,G.d.x,G.d.y-80,'#ffea00');b.say='💫 KNOCKED OUT! 💫';G.bossHint=null;G.bshots=[];G.banner={t:'KNOCKED OUT!',l:2.2};UNL('flame');beep(523,.2);setTimeout(()=>beep(784,.2),200);setTimeout(()=>beep(1046,.4),400);hud()}}
// ---- boss weapons (parachute drops) + boss throws ----
const THROW={easy:{every:5,T:100},medium:{every:3.4,T:82},hard:{every:2.3,T:64}};
const ITEMS={flame:{n:'FIRE',e:'🔥',dmg:2,say:'FIRE BREATH!'},hammer:{n:'STONE HAMMER',e:'🔨',dmg:3,say:'HAMMER SMASH!'},wheel:{n:'STONE WHEEL',e:'🛞',dmg:2,say:'WHEEL ROLL!'}};
function updAtk(){const b=$('ba');if(!b)return;b.classList.toggle('hide',!(G.held&&G.boss&&!G.boss.gone));if(G.held)b.innerHTML=ITEMS[G.held].e+'<small>ATTACK</small>'}
function useAtk(){if(!G.running||!G.held||!G.boss||G.boss.gone)return;const k=G.held,d=G.d,b=G.boss;G.held=null;updAtk();d.f=b.x+b.w/2>d.x+d.w/2?1:-1;
 const sh={k,x:d.x+d.w/2,y:k=='wheel'?GY-24:d.y+8,vx:d.f*7,vy:k=='wheel'?0:-6,a:0,l:150};G.pshots.push(sh);if(k=='flame'){G.flame=40}msg(ITEMS[k].say,d.x+d.w/2,d.y-40,'#ffea00');beep(700,.1,'sine',1400);setTimeout(()=>beep(300,.2,'sawtooth',120),90)}
function bossArms(b){const d=G.d,cfg=thrCfg();
 if(!b.gone){if((G.dropT-=1/60)<=0){G.dropT=R(5,10);const k=pickA(Object.keys(ITEMS));G.drops.push({x:R(G.camX+50,G.camX+AW()*.55),y:-40,k,st:'fall',vx:0,v:RI(0,5)})}
  if(!b.vuln&&b.mode!='under'&&(b.thT-=1/60)<=0){b.thT=cfg.every*Math.max(.6,1-.022*((b.n||1)-1))*R(.85,1.15);b.thTele=.75;beep(880,.08);setTimeout(()=>beep(880,.08),130)}
  if(b.thTele>0){b.thTele-=1/60;if(b.thTele<=0){const tx=d.x+d.w/2+R(-10,10),ty=groundTop(tx);if(ty!=null)G.bshots.push({k:b.T.throwK,sx:b.x+b.w*(b.x>d.x?.15:.85),sy:b.y+12,tx,ty,t:0,T:cfg.T});const ex=Math.min(3,(b.n>=12?1:0)+(b.n>=6?1:0)+DK.extra(Dbase()));for(let i=0;i<ex;i++){const x2=tx+(i%2?-1:1)*R(70,110)*(1+(i>>1)),y2=groundTop(x2);if(y2!=null)G.bshots.push({k:b.T.throwK,sx:b.x+b.w/2,sy:b.y+12,tx:x2,ty:y2,t:0,T:cfg.T+8})}beep(240,.15,'triangle',120)}}}
 G.drops=G.drops.filter(c=>{if(c.st=='fall'){c.y+=2.1;c.x+=Math.sin(G.el*2+c.v)*.3;if(c.y+26>=GY){c.y=GY-26;c.st='run';G.bitems.push({x:c.x-2,y:GY-22,w:22,h:22,k:c.k,l:900});c.vx=(c.x<d.x?-1:1)*3;msg('HERE!',c.x+9,c.y-20,'#b2ff59')}}else c.x+=c.vx;return c.x>G.camX-40&&c.x<G.camX+VW+40});
 G.bitems=G.bitems.filter(it=>{it.l--;if(!G.held&&ov(d,it)){G.held=it.k;updAtk();msg('GOT '+ITEMS[it.k].n+'! TAP ATTACK!',d.x+d.w/2,d.y-50,'#ffea00');beep(988,.1);setTimeout(()=>beep(1319,.15),90);return false}return it.l>0});
 G.pshots=G.pshots.filter(q=>{q.l--;q.a+=.3;const cx=b.x+b.w/2,cy=b.y+b.h/2;if(q.k=='wheel'&&Math.abs(cx-q.x)>50&&!(b.mode=='fly')){q.x+=q.vx;q.vx+=Math.sign(cx-q.x)*.15;q.vx=Math.max(-9,Math.min(9,q.vx))}
  else{const dx=cx-q.x,dy=cy-q.y,L=Math.hypot(dx,dy)||1;q.vx+=(dx/L*9-q.vx)*.12;q.vy+=(dy/L*9-q.vy)*.12;q.x+=q.vx;q.y+=q.vy}
  if(q.k=='flame')G.parts.push({x:q.x,y:q.y,vx:R(-1,1),vy:R(-1,1),l:.4,r:R(4,7),c:pickA(['#ff6d00','#ffea00'])});
  if(!b.gone&&q.x>b.x-8&&q.x<b.x+b.w+8&&q.y>b.y-12&&q.y<b.y+b.h+12){hitBoss(b,ITEMS[q.k].say,ITEMS[q.k].dmg,true);for(let i=0;i<14;i++)G.parts.push({x:q.x,y:q.y,vx:R(-4,4),vy:R(-6,-1),l:.8,r:R(3,6),c:q.k=='flame'?'#ff6d00':'#bdbdbd'});return false}return q.l>0&&!b.gone});
 G.bshots=G.bshots.filter(o=>{o.t++;if(o.t>=o.T){for(let i=0;i<10;i++)G.parts.push({x:o.tx,y:o.ty,vx:R(-3,3),vy:R(-5,-1),l:.7,r:R(3,6),c:THROWC[o.k]||'#8d6e63'});beep(110,.15,'triangle',60);
  if(Math.abs(d.x+d.w/2-o.tx)<20+d.w/2&&d.y+d.h>o.ty-55)hurt(THROWN[o.k]||'Bonk!');return false}return true})}
function drawItem(k,x,y,s,a){ctx.save();ctx.translate(x,y);if(a)ctx.rotate(a);if(k=='flame')spr(SPR.flame,-8*s/2.6,-6*s/2.6,s);else if(k=='hammer'){ctx.fillStyle='#000';ctx.fillRect(-2,-4,5,18);ctx.fillStyle='#8d5a2b';ctx.fillRect(-1,-3,3,16);ctx.fillStyle='#000';ctx.fillRect(-10,-12,21,11);ctx.fillStyle='#9e9e9e';ctx.fillRect(-9,-11,19,9);ctx.fillStyle='#cfcfcf';ctx.fillRect(-9,-11,19,3)}
 else{ctx.fillStyle='#000';ctx.beginPath();ctx.arc(0,0,12,0,7);ctx.fill();ctx.fillStyle='#9e9e9e';ctx.beginPath();ctx.arc(0,0,10.5,0,7);ctx.fill();ctx.fillStyle='#6d6d6d';ctx.fillRect(-10,-1.5,20,3);ctx.fillRect(-1.5,-10,3,20);ctx.fillStyle='#3e3e3e';ctx.beginPath();ctx.arc(0,0,3.5,0,7);ctx.fill()}ctx.restore()}
const THROWC={rock:'#8d6e63',bone:'#fff8e1',fire:'#ff6d00',log:'#8d5a2b',spike:'#e65100',shell:'#a1887f',fish:'#4fc3f7',note:'#fff59d',egg:'#fffde7',coconut:'#6d4c41',tooth:'#ffffff',acid:'#76ff03',mud:'#5d4037',water:'#4fc3f7',feather:'#ff8a65',leaf:'#66bb6a',pinecone:'#a1887f',lava:'#ff3d00',crab:'#ef5350',comet:'#ffd600'};
function drawThrow(k,x,y){const c=THROWC[k]||'#888',spin=G.el*8;ctx.save();ctx.translate(x,y);const C=(r,col)=>{ctx.fillStyle=col;ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.fill()};const E=(rx,ry,col,a)=>{ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(0,0,rx,ry,a||0,0,7);ctx.fill()};
 if(k=='rock')spr(SPR.boulder,-12,-12,3);else if(k=='bone'){ctx.rotate(spin);spr(SPR.bone,-12,-4.5,3)}else if(k=='fire')spr(SPR.meteor,-12,-12,3);
 else if(k=='log'){ctx.rotate(spin);ctx.fillStyle='#000';ctx.fillRect(-15,-7,30,14);ctx.fillStyle=c;ctx.fillRect(-14,-6,28,12);ctx.fillStyle='#d7a86e';ctx.fillRect(10,-6,4,12)}
 else if(k=='spike'){ctx.rotate(spin);ctx.fillStyle='#000';ctx.beginPath();ctx.moveTo(0,-15);ctx.lineTo(9,9);ctx.lineTo(-9,9);ctx.fill();ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(7,7);ctx.lineTo(-7,7);ctx.fill()}
 else if(k=='shell'){ctx.rotate(spin);E(13,9,'#000');E(11,7,c);ctx.fillStyle='#6d4c41';ctx.fillRect(-6,-2,4,4);ctx.fillRect(2,-2,4,4)}
 else if(k=='fish'||k=='crab'){if(k=='fish'){ctx.rotate(Math.sin(spin)*.5);E(13,7,'#000');E(11,5,c);ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(-10,0);ctx.lineTo(-17,-7);ctx.lineTo(-17,7);ctx.fill();ctx.fillStyle='#000';ctx.fillRect(5,-2,3,3)}else{E(12,8,'#000');E(10,6,c);ctx.fillStyle=c;ctx.fillRect(-16,-9,6,6);ctx.fillRect(10,-9,6,6);ctx.fillStyle='#fff';ctx.fillRect(-4,-6,3,3);ctx.fillRect(2,-6,3,3)}}
 else if(k=='note'){ctx.fillStyle='#000';ctx.font='bold 30px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('♪',1,1);ctx.fillStyle=c;ctx.fillText('♪',0,0)}
 else if(k=='egg'){ctx.rotate(spin*.5);E(9,12,'#000');E(7.5,10.5,c);ctx.fillStyle='#8bc34a';ctx.fillRect(-3,-4,3,3);ctx.fillRect(2,3,3,3)}
 else if(k=='coconut'||k=='mud'||k=='pinecone'){C(11,'#000');C(9.5,c);ctx.fillStyle=k=='coconut'?'#3e2723':k=='mud'?'#3e2723':'#6d4c41';if(k=='pinecone'){for(let i=-6;i<=6;i+=4)ctx.fillRect(-7,i,14,2)}else{ctx.fillRect(-4,-4,3,3);ctx.fillRect(2,1,3,3);ctx.fillRect(-2,3,2,2)}}
 else if(k=='tooth'){ctx.rotate(spin);ctx.fillStyle='#000';ctx.beginPath();ctx.moveTo(-8,-10);ctx.lineTo(8,-10);ctx.lineTo(0,14);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(-6,-8);ctx.lineTo(6,-8);ctx.lineTo(0,10);ctx.fill()}
 else if(k=='acid'||k=='water'||k=='lava'){C(11,'#000');C(9.5,c);C(4,k=='lava'?'#ffea00':'#fff')}
 else if(k=='feather'||k=='leaf'){ctx.rotate(Math.sin(spin*.6)*.8);E(14,6,'#000');E(12.5,4.5,c);ctx.fillStyle='#000';ctx.fillRect(-14,-1,26,2)}
 else{ctx.rotate(spin);for(let i=0;i<10;i++){ctx.fillStyle=['#f44336','#ffeb3b','#4caf50','#2196f3','#e040fb'][i%5];ctx.fillRect(-18-i*2,-3,6,6)}ctx.fillStyle='#000';ctx.beginPath();for(let i=0;i<10;i++){const r=i%2?6:14,a=i*Math.PI/5;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}ctx.fill();ctx.fillStyle=c;ctx.beginPath();for(let i=0;i<10;i++){const r=i%2?4:12,a=i*Math.PI/5;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}ctx.fill()}
 ctx.restore()}
function drawBossArms(){const b=G.boss;if(!b)return;
 for(const o of G.bshots){const k=o.t/o.T,x=o.sx+(o.tx-o.sx)*k,y=o.sy+(o.ty-20-o.sy)*k-Math.sin(k*Math.PI)*150;const fl=(G.el*8|0)%2;
  ctx.fillStyle='rgba(0,0,0,'+(.15+.3*k)+')';ctx.fillRect(o.tx-(20*k+8),o.ty-4,(20*k+8)*2,6);ctx.fillStyle=fl?'#ff1744':'#ffea00';ctx.fillRect(o.tx-30,o.ty-3,10,4);ctx.fillRect(o.tx+20,o.ty-3,10,4);ctx.fillRect(o.tx-2,o.ty-14,4,8);
  drawThrow(o.k,x,y)}
 if(b.thTele>0&&!b.gone){pxText('!',b.x+b.w/2,b.y-90,34,'#ff1744','center')}
 for(const c of G.drops){if(c.st=='fall'){spr(SPR.chute,c.x-13,c.y-34,3);drawItem(c.k,c.x+9,c.y+30,2.2)}spr(SPR.person[c.v][(c.st=='run'&&(G.el*10|0)%2)?1:0],Math.round(c.x),Math.round(c.y),2.2,c.vx<0)}
 for(const it of G.bitems){if(it.l<120&&(it.l>>3)%2)continue;const bob=Math.sin(G.el*5)*3;ctx.fillStyle='rgba(255,234,0,.35)';ctx.beginPath();ctx.arc(it.x+11,it.y+8+bob,18,0,7);ctx.fill();drawItem(it.k,it.x+11,it.y+10+bob,2.6)}
 for(const q of G.pshots)drawItem(q.k,q.x,q.y,2.6,q.k=='flame'?0:q.a);
 if(G.held){const d=G.d;drawItem(G.held,d.x+d.w/2,d.y-24+Math.sin(G.el*6)*2,2)}}
// ---- bonus room ----
function enterBonus(){if(G.inBonus||G.boss)return;const keep=['solids','people','littles','critters','rangers','bigs','boulders','vols','pel','gemsW','deco','portals'];G.saved={camX:G.camX,dx:G.d.x,dy:G.d.y,ch:G.ch,rival:G.rival};keep.forEach(k=>G.saved[k]=G[k]);
 G.inBonus=1;G.bonusT=12;G.ch=null;G.rival=null;G.lava=[];G.meteors=[];const X=-5000,w=Math.max(VW,420);G.camX=X;
 G.solids=[{x:X-30,y:GY,w:w+60,h:800,k:'g'},{x:X-30,y:GY-900,w:30,h:900,k:'wall'},{x:X+w,y:GY-900,w:30,h:900,k:'wall'},{x:X+60,y:GY-110,w:T*3,h:18,k:'p'},{x:X+w-150,y:GY-110,w:T*3,h:18,k:'p'}];
 G.people=Array.from({length:40},()=>({x:R(X+20,X+w-40),y:GY-26,w:18,h:26,vx:0,vy:0,e:pickA(PEOPLE)}));G.littles=[];G.critters=[];G.rangers=[];G.bigs=[];G.boulders=[];G.vols=[];G.portals=[];G.deco=[];
 G.pel=Array.from({length:6},()=>({x:R(X+30,X+w-30),y:GY-R(60,170)}));G.gemsW=[{x:X+w/2,y:GY-150}];G.d.x=X+30;G.d.y=GY-60;G.d.vx=G.d.vy=0;
 G.banner={t:'🤫 SECRET BONUS ROOM!',l:2};beep(880,.1);setTimeout(()=>beep(1175,.2),120);hud()}
function exitBonus(){const s=G.saved;Object.assign(G,{solids:s.solids,people:s.people,littles:s.littles,critters:s.critters,rangers:s.rangers,bigs:s.bigs,boulders:s.boulders,vols:s.vols,pel:s.pel,gemsW:s.gemsW,deco:s.deco,portals:s.portals,camX:s.camX});G.d.x=s.dx;G.d.y=s.dy-40;G.d.vy=0;G.inBonus=0;G.chT=8;msg('Back to the run!',G.d.x,G.d.y-40,'#ffea00');hud()}
// ---- update ----
function update(){const d=G.d;{const zt=G.boss&&!G.boss.gone?1:0;if(Math.abs(zt-ZK)>.001){ZK+=(zt-ZK)*.035;if(Math.abs(zt-ZK)<.002)ZK=zt;view()}}G.el+=1/60;G.dayT+=1/60;
 let L=keys.arrowleft||keys.a||btn.l,Rt=keys.arrowright||keys.d||btn.r;if(G.safeT>0)G.safeT--;if(G.needRel){if(L||Rt){L=Rt=false}else G.needRel=0}if(G.spawnT>0){G.spawnT--;L=Rt=false;d.vx=0}if(G.rev){G.rev--;[L,Rt]=[Rt,L]}if(G.inv)G.inv--;if(G.shrink)G.shrink--;const J=keys[' ']||keys.arrowup||keys.w||btn.j;
 const st=G.inBonus?Math.min(1,stageOf(G.belly)):stageOf(G.belly),wasSt=G.stage||0;G.stage=st;G.fat=st==1;
 const sp=SPD*(G.pwKind=='speed'?1.6:1)*(G.dash?1.9:1)*(st==1?FAT_SPD:1);
 const wasRoll=G.roll;G.roll=st==2;if(st==1&&wasSt==0){msg('BIG BELLY! WADDLE…',d.x+17,d.y-30,'#ffcc80');beep(180,.25,'triangle',120)}
 if(G.roll&&!wasRoll){msg('ROLL! ZOOOM!',d.x+17,d.y-30,'#ffea00');beep(400,.12,'sine',900);setTimeout(()=>beep(900,.25,'sine',1600),110)}else if(!G.roll&&wasRoll){d.y-=4}
 if(G.push){G.push--;d.vx*=.92}else if(G.roll){const dir=(Rt?1:0)-(L?1:0),mx=Math.min(ROLL_CAP,sp*ROLL_MAX);if(dir){if(dir*d.vx<0)d.vx+=dir*ROLL_ACC*2.5;else d.vx+=dir*ROLL_ACC*(Math.abs(d.vx)<3?2.2:1)}else d.vx*=ROLL_FRIC;d.vx=Math.max(-mx,Math.min(mx,d.vx));if(Math.abs(d.vx)<.05)d.vx=0}else d.vx=(Rt?sp:0)-(L?sp:0);if(d.vx)d.f=d.vx<0?-1:1;G.rollA=(G.rollA||0)+d.vx/(d.h/2);if(G.fat&&d.on&&d.vx)G.wad=(G.wad||0)+.16+Math.abs(d.vx)*.02;else if(G.fat)G.wad=(G.wad||0)*.9;
 if(G.sil&&G.sil.fx)sillyMove(d);
 if(J&&d.on&&!G.jumpHeld&&!(G.sil&&G.sil.fx&&G.sil.fx.k=='bubble')){d.vy=JV*(G.sjump?1.4:1)*(G.dash?1.08:1)*(G.shrink&&!G.fat&&!G.roll?.85:1)*(G.fat?FAT_JMP:G.roll?ROLL_JMP:1);beep(500,.1,'sine',900)}G.jumpHeld=J;if(!J&&d.vy<-4)d.vy=-4;
 {const gs=G.grow*(G.shrink?.65:1),nh=(G.roll?40:36)*gs;d.y+=d.h-nh;d.w=(G.roll?40:34*(1+.3*Math.min(1.3,G.bv)))*gs;d.h=nh}const pvy=d.vy,pvx=d.vx;moveBody(d);if(G.roll&&d.hitWall){d.vx=-pvx*.25;if(Math.abs(pvx)>5){G.shake=4;beep(160,.06,'square',90)}}if(G.roll&&d.on&&pvy>3.5){d.vy=-pvy*.38;G.squish=8;beep(250,.06,'sine',350)}if(G.squish)G.squish--;if(d.x<G.camX)d.x=G.camX;
 if(d.bonk){const b=d.bonk;if(b.k=='q'){b.k='used';mystery(b)}else if(b.k=='cr'){G.solids.splice(G.solids.indexOf(b),1);for(let i=0;i<10;i++)G.parts.push({x:b.x+15,y:b.y+15,vx:R(-3,3),vy:R(-6,-1),l:.9,r:5,c:'#a1887f'});G.portals.push({x:b.x,y:b.y-T,w:T,h:T});msg('A secret door!',b.x,b.y-40,'#e1bee7');beep(400,.3,'sine',1200)}else if(b.k=='brick')breakBrick(b)}
 if(d.on&&(d.on.k=='g')&&!G.inBonus)G.lastSafe={x:d.x,y:d.y};
 if(G.inBonus&&(d.y>GY-d.h+4||d.y<10)){if(d.y<10){d.y=10;if(d.vy<0)d.vy=0}else{d.y=GY-d.h;d.vy=0}}if(G.inBonus){d.x=Math.min(Math.max(d.x,G.camX),G.camX+VW-d.w)}
 if((G.silGrace>0||G.safeT>0)&&d.y>GY+24&&!G.inBonus&&!G.arena){const p=safeSpot();d.x=p.x;d.y=p.y;d.vy=0;d.vx=0;G.needRel=1;msg('Safe!',d.x,d.y-20,'#b2ff59')}
 if(d.y>GY+24&&!G.inBonus&&!G.arena){for(let i=0;i<10;i++)G.parts.push({x:d.x+17,y:GY+20,vx:R(-3,3),vy:R(-7,-3),l:.8,r:4,c:pickA(['#ff6d00','#ffea00'])});G.hit=0;const lv=G.lives;hurt('Lava! Hot hot!',{keep:1});if(G.running&&!G.dying&&G.lives===lv)respawn('')}
 if(d.y>GY+260&&!G.inBonus){G.hit=0;const lv=G.lives;hurt('Fell in a pit!',{keep:1});if(G.running&&!G.dying&&G.lives===lv)respawn('')}
 // camera
 if(!G.boss&&!G.inBonus)G.camX=Math.max(G.camX,d.x-VW*.4);
 // sections
 if(!G.inBonus){const s=curSec(d.x);if(s.n!=G.cur)enterSec(s);const last=G.secs[G.secs.length-1];if(d.x>last.x0-1500)genSection(last.n+1,last.x0+last.L);
  if(G.secs.length>4){const old=G.secs.shift();const cut=old.x0+old.L;G.huts=(G.huts||[]).filter(o=>o.x>cut);G.solids=G.solids.filter(s=>s.x+s.w>cut-50||s.k=='arena'||s.k=='wall');['people','littles','critters','rangers','bigs','pel','gemsW','deco','vols'].forEach(k=>G[k]=G[k].filter(o=>o.x>cut-50))}}
 // belly anim, timers
 {const tb=G.belly<FAT_AT?.5*G.belly/FAT_AT:1+.3*Math.min(1,(G.belly-FAT_AT)/(ROLL_AT-FAT_AT));G.bv+=(tb-G.bv)*.12}G.jig=Math.max(0,G.jig-.03);if(G.hit)G.hit--;if(G.dash)G.dash--;
 if(G.pwKind=='speed'||G.dash)G.trail.push({x:d.x,y:d.y,l:1});if(G.roll&&Math.abs(d.vx)>4.5&&(G.el*60|0)%2==0)G.lines.push({x:d.x+d.w/2-Math.sign(d.vx)*d.w*.6,y:d.y+R(4,d.h-4),vx:-d.vx*.25,len:R(14,30)*Math.min(1.6,Math.abs(d.vx)/6),l:1});G.lines=G.lines.filter(q=>{q.x+=q.vx;return (q.l-=.05)>0});G.trail=G.trail.filter(t=>(t.l-=.07)>0);
 if(G.pwOn>0){G.pwOn-=1/60;if(G.pwOn<=0){G.pwOn=0;G.pwKind=null;updPw()}}if(keys.e)usePower();if(keys.f)useAtk();
 // people
 const vis=o=>o.x>G.camX-200&&o.x<G.camX+VW+200;
 for(const p of G.people){if(!vis(p))continue;const dx=p.x-d.x;if(p.dance>0){p.dance--;p.vx=0;if(p.on&&Math.random()<.05)p.vy=-3.5}else if(G.magnet&&Math.abs(dx)<240&&Math.abs(p.y-d.y)<150){p.vx=-Math.sign(dx||1)*3.4;if(p.on&&Math.random()<.04)p.vy=-3}else if(Math.abs(dx)<150&&Math.abs(p.y-d.y)<120)p.vx=Math.sign(dx||1)*1.9;else if(Math.random()<.01)p.vx=pickA([-.6,0,.6]);
  if(p.on){const ax=p.x+(p.vx>0?p.w+2:-2);if(!solidBelow(ax,p.y+p.h+2)){p.vx=-p.vx*.5}}if(p.vy<0||!p.on||p.vx)moveBody(p);if(p.hitWall)p.vx=-p.vx;if(p.smoky)p.smoky--}
 G.people=G.people.filter(p=>p.y<GY+300);
 for(let i=G.people.length-1;i>=0;i--){const p=G.people[i];if(p.bowl){p.bowl--;continue}if(!G.hit&&ov(d,p)){if(G.belly<cap()){G.people.splice(i,1);eat();if(G.ch&&G.ch.k=='rival')G.ch.you++;msg(G.roll?'Spin-gulp!':'Gulp!',d.x+17,d.y-10)}else if(G.roll&&Math.abs(d.vx)>2)bowl(p)}}
 // little dinos (goombas)
 for(let i=G.littles.length-1;i>=0;i--){const l=G.littles[i];if(!vis(l))continue;if(l.on){const ax=l.x+(l.vx>0?l.w+2:-2);if(!solidBelow(ax,l.y+l.h+2))l.vx=-l.vx}moveBody(l);if(l.hitWall)l.vx=-l.vx;if(l.y>GY+300){G.littles.splice(i,1);continue}
  if(ov(d,l)&&!G.hit){if(d.vy>0&&d.y+d.h-l.y<16){G.littles.splice(i,1);d.vy=-7;G.score+=20;msg('Stomp! +20',l.x,l.y-10,'#fff');squash(l);poof(l.x+13,l.y+11);beep(700,.08,'square',200);hud()}
   else if(carn()){G.littles.splice(i,1);const s=curSec(l.x);s.ate++;if(G.belly<cap())eat();else hud();msg('Chomp! 🦎',l.x,l.y-10,'#c6ff00');if(s.ate==s.goal){msg('Dino goal done! ✅',d.x,d.y-60,'#ffea00');beep(784,.2)}}
   else{knock(l);G.hit=30;msg('Bonk! (stomp it!)',d.x,d.y-30)}}}
 // critters (edible animals)
 for(let i=G.critters.length-1;i>=0;i--){const c=G.critters[i];if(!vis(c))continue;if(Math.abs(c.x-d.x)<120&&Math.abs(c.y-d.y)<100)c.vx=Math.sign(c.x-d.x||1)*1.3;else if(Math.random()<.01)c.vx=pickA([-.5,.5]);if(c.on){const ax=c.x+(c.vx>0?c.w+2:-2);if(!solidBelow(ax,c.y+c.h+2))c.vx=-c.vx}moveBody(c);if(c.hitWall)c.vx=-c.vx;if(c.y>GY+300){G.critters.splice(i,1);continue}
  if(c.bowl){c.bowl--;continue}if(ov(d,c)&&!G.hit&&d.vy>0&&d.y+d.h-c.y<16){G.critters.splice(i,1);d.vy=-7;poof(c.x+c.w/2,c.y+c.h/2);if(G.belly<cap()){eat();msg('Stomp & gulp!',c.x,c.y-10,'#c6ff00')}else{G.score+=20;hud();msg('Stomp! +20',c.x,c.y-10,'#fff')}continue}if(ov(d,c)&&G.roll&&G.belly>=cap()&&!G.hit&&Math.abs(d.vx)>2){bowl(c);continue}if(ov(d,c)&&G.belly<cap()&&!G.hit){G.critters.splice(i,1);eat();msg({liz:'Crunchy lizard!',dodo:'Gobbled a dodo!',mammoth:'Baby mammoth! Yum',bug:'Big bug! Crunch'}[c.k],c.x,c.y-10,'#c6ff00')}}
 // v15 hard-only silly human
 sillyUpd(d);
 // timed surprises
 if(G.sjump)G.sjump--;if(G.magnet){G.magnet--;if(G.el%.2<1/60)for(let i=0;i<2;i++)G.parts.push({x:d.x+d.w/2+R(-90,90),y:d.y+R(-30,30),vx:0,vy:0,l:.4,r:2,c:'#e040fb'})}if(G.star)G.star--;
 if(G.buddy){const u=G.buddy;u.t--;let tg=null,bd=170;for(const p of G.people){const q=Math.hypot(p.x-u.x,p.y-u.y);if(q<bd){bd=q;tg=p}}const gx=tg?tg.x:d.x-d.f*40;u.vx=Math.max(-4.5,Math.min(4.5,(gx-u.x)*.08));u.f=u.vx<0?-1:1;moveBody(u);if(u.on&&(u.hitWall||(tg&&tg.y<u.y-10)))u.vy=-8;if(u.y>GY+200){u.x=d.x;u.y=d.y-20;u.vy=0}
  if(u.cd>0)u.cd--;else for(let i=G.people.length-1;i>=0;i--){const p=G.people[i];if(ov(u,p)){G.people.splice(i,1);u.cd=25;u.ate++;if(G.belly<cap())eat();else{G.score+=20;hud()}msg('Buddy nom!',u.x+10,u.y-10,'#b2ff59');break}}
  if(u.t<=0){msg('Bye bye, buddy!',u.x,u.y-20,'#fff');G.buddy=null}}
 // big dinos: harmless food rivals that gobble the people in front of you
 for(const g of G.bigs){if(g.x<G.camX-250||g.x>G.camX+VW+450)continue;if(g.bcd>0)g.bcd--;
  if(g.chomp>0){g.chomp--;if(g.on)g.vx=0}else if(g.on){let tg=null,bd=700;for(const p of G.people){const q=Math.abs(p.x+9-(g.x+g.w/2));if(q<bd&&Math.abs(p.y+p.h-(g.y+g.h))<150&&!p.bowl){bd=q;tg=p}}
   // roam: chase the nearest person; with nobody near, stroll toward the area just ahead of the player
   const gx=tg?tg.x+9:d.x+d.w/2+(d.f>=0?260:-260);g.vx=Math.abs(gx-(g.x+g.w/2))<6?0:Math.sign(gx-(g.x+g.w/2))*(tg?BIG_SPD:1.6);
   if(g.vx){const ax=g.x+(g.vx>0?g.w+4:-4);if(!solidBelow(ax,g.y+g.h+2)){const gt=groundTop(ax);if(gt==null){const far=groundTop(ax+Math.sign(g.vx)*110);if(far!=null){g.vy=-10.5;g.vx=Math.sign(g.vx)*BIG_SPD}else g.vx=0}}
    else if(tg&&tg.y+tg.h<g.y+g.h-40&&Math.abs(tg.x-g.x)<70)g.vy=-10}}
  if(g.vx)g.f=g.vx<0?-1:1;const wx=g.vx;moveBody(g);if(g.hitWall&&g.on){g.vy=-10.5;g.vx=wx}
  if(g.y>GY+200){const t=groundTop(d.x+VW*.6);g.x=d.x+VW*.6;g.y=(t==null?GY:t)-g.h-40;g.vy=0}
  if(g.chomp<=0)for(let i=G.people.length-1;i>=0;i--){const p=G.people[i];if(!p.bowl&&ov(g,p)){G.people.splice(i,1);g.chomp=24;g.ate++;G.noms.push({x:p.x,y:p.y,g,t:0,v:p.v||0});msg('NOM!',g.x+g.w/2,g.y-14,'#ffab91');beep(150,.09,'square',80);setTimeout(()=>beep(120,.08,'square',70),110);break}}
  // landing on a big dino: one soft bounce, then slide off. No hurt, no text, no loop.
  if(ov(d,g)&&d.vy>0&&d.y+d.h-g.y<24){const side=(d.x+d.w/2<g.x+g.w/2)?-1:1;if(!(g.bcd>0)){g.bcd=50;d.y=g.y-d.h;d.vy=-6;d.x+=side*6;beep(300,.06,'sine',200)}else{d.x+=side*7;if(d.vy>2)d.vy=2}}}
 G.bigs=G.bigs.filter(g=>g.y<GY+300);G.noms=G.noms.filter(n=>++n.t<22);
 // rangers
 for(const r of G.rangers){if(!vis(r))continue;if(r.stun){r.stun--;r.vx=0}else{const dx=d.x-r.x;if(G.belly&&Math.abs(dx)<260)r.vx=Math.sign(dx)*1.5*(r.sp||1);else if(!r.vx||Math.random()<.005)r.vx=pickA([-.8,.8])*(r.sp||1);if(r.on){const ax=r.x+(r.vx>0?r.w+2:-2);if(!solidBelow(ax,r.y+r.h+2))r.vx=-r.vx}}moveBody(r);if(r.hitWall)r.vx=-r.vx;
  if(ov(d,r)&&!G.hit){if(d.vy>0&&d.y+d.h-r.y<18){d.vy=-8;if(r.stun){poof(r.x+12,r.y+r.h/2);G.score+=50;hud();msg('Knocked out! +50',r.x,r.y-30,'#ffea00');r.y=GY+999}else{hurt('Ouch! Pointy spear!');msg('Spear points up! Jump OVER them.',r.x+12,r.y-30,'#ff8a80')}}else if(!r.stun){if(G.belly)dropLoad();else G.hit=30;knock(r)}}}
 G.rangers=G.rangers.filter(r=>r.y<GY+300);
 // boulders
 if(!G.boss&&!G.inBonus&&(G.boulT-=1/60)<=0){G.boulT=Math.max(1.6,(R(6,10)-Math.min(3,G.cur*.3))/DK.rate(Dx()));const x=G.camX+VW+20,t=groundTop(x);if(t!=null)G.boulders.push({x,y:t-28,w:28,h:28,vx:-2.6*DK.spd(Dx()),sp:DK.spd(Dx()),vy:0,a:0})}
 G.boulders=G.boulders.filter(b=>{b.vx=-2.6*(b.sp||1);moveBody(b);b.a-=.09;if(b.hitWall){b.vy=-7;b.x-=2}if(ov(d,b)&&!G.hit){if(G.belly)dropLoad();else G.hit=30;knock(b)}return b.y<GY+300&&b.x>G.camX-80});
 // volcano
 for(const v of G.vols){if(!G.busyVol&&d.on&&d.x+d.w>v.x&&d.x<v.x+v.w){if(v.end&&!v.done){v.done=1;const n=G.belly,bonus=100*v.sec+n*50;G.score+=bonus;G.banner={t:'SECTION '+v.sec+' CLEAR! +'+bonus,l:2.4};G.chT=Math.max(G.chT,6);if(n)erupt(v);else{G.belly=0;boom(0,v)}beep(784,.15);setTimeout(()=>beep(1046,.3),160)}else if(G.belly&&!v.end)erupt(v)}}
 // pickups
 G.pel=G.pel.filter(p=>{if(Math.abs(p.x-d.x-d.w/2)<d.w/2+10&&Math.abs(p.y-d.y-d.h/2)<d.h/2+10){VIS.starBurst(p.x,p.y,'#fff176');G.dash=70;beep(1200,.25,'sawtooth',300);msg('DASH!',d.x,d.y-30,'#fff59d');return false}return true});
 G.gemsW=G.gemsW.filter(g=>{if(Math.abs(g.x-d.x-d.w/2)<d.w/2+12&&Math.abs(g.y-d.y-d.h/2)<d.h/2+14){VIS.starBurst(g.x,g.y,'#80deea');gems++;LS.dinoColossus_Diamonds=gems;G.score+=100;msg('💎 +1 ('+gems+')',d.x,d.y-40,'#80deea');beep(1320,.1);setTimeout(()=>beep(1760,.2),100);if(gems>=5)UNL('flame');hud();return false}return true});
 for(const p of G.portals)if(ov(d,p)){G.portals.splice(G.portals.indexOf(p),1);enterBonus();break}
 if(G.inBonus&&(G.bonusT-=1/60)<=0){const b=G.belly;exitBonus()}
 // flame breath
 if(G.flame>0){G.flame--;const fx=d.x+(d.f>0?d.w:0);for(let i=0;i<2;i++)G.parts.push({x:fx,y:d.y+10,vx:d.f*R(6,10),vy:R(-1.2,1.2),l:.6,r:R(5,10),c:pickA(['#ff6d00','#ffea00','#ff3d00'])});
  const inF=o=>{const dx=(o.x+(o.w||0)/2-(d.x+d.w/2))*d.f;return dx>0&&dx<170+d.w&&o.y<d.y+d.h+10&&o.y+(o.h||20)>d.y-30};
  G.rangers.forEach(r=>{if(inF(r)&&!r.stun){r.stun=240;msg('💫 Zonked!',r.x,r.y-10)}});
  for(let i=G.littles.length-1;i>=0;i--)if(inF(G.littles[i])){squash(G.littles[i]);G.littles.splice(i,1);G.score+=20}
  G.people.forEach(p=>{if(inF(p)){p.smoky=150;p.vx=d.f*3}});if(G.rival&&inF(G.rival)&&!(G.rival.dizzy>0))G.rival.dizzy=2.5;
  if(G.boss&&!G.boss.gone&&!G.boss.flamed&&!G.boss.inv&&inF(G.boss)){G.boss.flamed=1;hitBoss(G.boss,'Toasty! 🔥')}}else if(G.boss)G.boss.flamed=0;
 // challenges / boss
 if(G.boss)updBoss();else if(!G.inBonus){if(G.ch){G.ch.t-=1/60;CHALLENGES[G.ch.k].update(G.ch);if(G.ch&&G.ch.t<=0.02)endChallenge()}else if((G.chT-=1/60)<=0&&G.d.x>400)startChallenge()}
 G.meteors=G.meteors.filter(m=>{m.t++;if(m.t>=m.T){if(m.mini){if(Math.abs(d.x+d.w/2-m.x)<18+d.w/2&&d.y+d.h>m.y-50)hurt('Bonk! Mini meteor');return false}for(let i=0;i<10;i++)G.parts.push({x:m.x,y:m.y,vx:R(-3,3),vy:R(-5,-1),l:.8,r:R(3,6),c:m.rock?'#8d6e63':'#ff6d00'});beep(90,.2,'triangle',40);if(Math.abs(d.x+d.w/2-m.x)<26+d.w/2&&d.y+d.h>m.y-60)hurt(m.rock?'Bonk! 🪨':'Bonk! ☄️');return false}return true});
 G.lava=G.lava.filter(f=>{f.x+=f.vx;f.ph+=.1;const t=groundTop(f.x+f.w/2);if(t==null)return false;f.y=t;if(d.x+d.w>f.x+4&&d.x<f.x+f.w-4&&d.y+d.h>=t-3&&d.on)hurt('Hot hot! 🔥');return f.x+f.w>G.camX});
 G.waves=G.waves.filter(w=>{w.x+=w.vx;if(w.vx>0&&w.x>G.camX+VW+30)return false;if(d.x+d.w>w.x&&d.x<w.x+20&&d.y+d.h>=GY-w.h&&d.on&&!G.hit)hurt(w.tail?'Swish! Tail!':'Stomp wave!');return w.x>G.camX-30});
 // fx
 G.toss=G.toss.filter(o=>++o.t<30);G.goo=G.goo.filter(g=>{g.x+=g.vx;g.y+=g.vy;g.vy+=.3;g.l-=.025;return g.l>0});
 G.fly=G.fly.filter(f=>{f.x+=f.vx;if(f.vy>0){f.chute=1;f.vy=Math.min(f.vy+.05,1.3);f.vx*=.98}else f.vy+=.35;f.y+=f.vy;if(f.v==null)f.v=RI(0,5);const t=groundTop(f.x);if(f.chute&&t==null&&f.y>GY-60){f.y=GY-60;f.vx=(Math.sign(f.vx)||1)*1.4}
  if(f.chute&&t!=null&&f.y>=t-26){G.safe.push({x:f.x,y:t-26,vx:pickA([-1.6,1.6]),v:f.v,t:0});return false}return f.y<GY+400});
 G.safe=G.safe.filter(q=>{q.t++;const nx=q.x+q.vx,gt=groundTop(nx+(q.vx>0?18:0));if(gt==null||Math.abs(gt-(q.y+26))>2)q.vx=-q.vx;else q.x=nx;return q.t<720&&q.x>G.camX-80&&q.x<G.camX+VW+80});
 G.parts=G.parts.filter(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.3;p.l-=.02;return p.l>0});G.smoke=G.smoke.filter(m=>{m.x+=m.vx;m.y+=m.vy;m.r+=.4;m.l-=.008;return m.l>0});
 G.msgs=G.msgs.filter(m=>{m.y-=.7;m.l-=.02;return m.l>0});if(G.shake)G.shake--;if(G.flash)G.flash=Math.max(0,G.flash-.02);
 if(G.burst){const b=G.burst;b.r+=(b.max-b.r)*.15;b.l-=.03;if(b.l<=0)G.burst=null}
 for(const k of['banner','secBanner','bossHint'])if(G[k]&&(G[k].l-=1/60)<=0)G[k]=null;
 if(G.el%0.25<1/60){$('score').textContent=G.score;updPw()}}
const GOOD_OLD=[['DASH PELLET!',b=>G.pel.push({x:b.x+15,y:b.y-30})],['DIAMOND!',b=>G.gemsW.push({x:b.x+15,y:b.y-30})],['+1 HEART!',()=>{G.hearts=Math.min(6,G.hearts+1);hud()}],['FULL BELLY +3!',()=>{for(let i=0;i<3&&G.belly<cap();i++)eat()}],['INVINCIBLE!',()=>{G.inv=360}]];
const GOOD=GOOD_OLD.concat([
 ['SUPER JUMP!',()=>{G.sjump=480}],
 ['PEOPLE MAGNET!',()=>{G.magnet=360}],
 ['GOLDEN EGG! +1000',b=>{G.score+=1000;confetti(b.x+15,b.y-20,40);hud()}],
 ['EXTRA LIFE!',()=>{if(G.lives<5)G.lives++;else G.hearts=Math.min(6,G.hearts+1);hud()}],
 ['SUPER STAR!',()=>{G.inv=420;G.star=420}],
 ['FREE DIAMOND!',()=>{gems++;try{LS.dinoColossus_Diamonds=gems}catch(e){}if(gems>=5)UNL('flame');hud()}],
 ['TINY FRIEND!',()=>{const d=G.d;G.buddy={x:d.x-30,y:d.y-10,w:22,h:22,vx:0,vy:0,f:d.f,t:900,cd:0,ate:0,k:(pick+2)%6}}],
 ['PARTY HORN!',()=>{let n=0;for(const p of G.people)if(Math.abs(p.x-G.d.x)<340){p.dance=420;n++}G.party=n}]]);
const BAD=[['SHRINK!',()=>{G.shrink=480}],['BACKWARDS!',()=>{G.rev=300}],['STINKY BURP!',()=>{if(G.belly){G.belly--;G.people.push({x:G.d.x+R(-20,40),y:G.d.y-20,w:18,h:26,vx:R(-2,2),vy:-5,e:pickA(PEOPLE),v:RI(0,5)});hud()}for(let i=0;i<5;i++)G.smoke.push({x:G.d.x+17,y:G.d.y,vx:R(-1,1),vy:-1,r:8,l:.7})}],['MINI METEOR!',()=>{const x=G.d.x+G.d.w/2+G.d.f*R(30,60),t=groundTop(x);if(t!=null)G.meteors.push({x,y:t,t:0,T:90,mini:1})}]];
function happySnd(){beep(784,.09);setTimeout(()=>beep(988,.09),80);setTimeout(()=>beep(1175,.09),160);setTimeout(()=>beep(1568,.22,'sine'),240)}
function breakBrick(b){const i=G.solids.indexOf(b);if(i<0)return;G.solids.splice(i,1);for(let j=0;j<12;j++)G.parts.push({x:b.x+R(4,26),y:b.y+R(4,26),vx:R(-3.5,3.5),vy:R(-7,-2),l:1,r:R(4,7),c:pickA(['#8a8070','#5f574a','#b0a690'])});G.score+=10;G.broke=(G.broke||0)+1;G.shake=Math.max(G.shake||0,4);msg('+10',b.x+15,b.y-10,'#ffe0b2');beep(180,.12,'square',60);hud()}
function mystery(b){const good=Math.random()>=DK.bad(Dx()),bad=BAD,pool=good?GOOD:bad;let ch=pickA(pool);if(pool.length>1)while(ch[0]===G.lastSurprise)ch=pickA(pool);G.lastSurprise=ch[0];const [t,f]=ch;f(b);msg(t,b.x+15,b.y-20,good?'#b2ff59':'#ff8a80');G.banner={t:t,l:1.3};if(good){happySnd();VIS.starBurst(b.x+15,b.y,'#b2ff59')}else{beep(300,.2,'triangle',150)}G.lastMystery={good,t}}
function eat(){G.belly++;G.eaten++;stats.eaten++;saveStats();G.charge=Math.min(100,G.charge+12);G.jig=1;beep(300+G.belly*60,.08);hud();updPw()}
function bowl(o){o.bowl=40;o.vx=Math.sign(G.d.vx||1)*R(4,6);o.vy=R(-8,-5);o.on=null;G.score+=10;G.strk=(G.strk||0)+1;msg(G.strk%3==0?'STRIKE! +30':'BOWLED! +10',o.x,o.y-10,'#80d8ff');if(G.strk%3==0)G.score+=20;beep(520+G.strk%5*80,.08,'square',260);hud()}
function squash(o){VIS.play('stomp',.1);VIS.buzz(15);for(let i=0;i<6;i++)G.parts.push({x:o.x+13,y:o.y+11,vx:R(-2,2),vy:R(-4,-1),l:.6,r:4,c:'#fff'});G.smoke.push({x:o.x+13,y:o.y+10,vx:0,vy:-1,r:10,l:.6})}
let ini=[0,0,0],pendTop=null;
function buildIni(){const w=$('iniCols');w.innerHTML='';ini.forEach((v,k)=>{const c=document.createElement('div');c.className='col';
 const up=document.createElement('button');up.type='button';up.textContent='▲';up.className='up';up.setAttribute('aria-label','letter '+(k+1)+' up');up.onclick=()=>{ini[k]=(ini[k]+1)%26;beep(700+k*80,.05);buildIni()};
 const L=document.createElement('div');L.className='L';L.textContent=String.fromCharCode(65+v);
 const dn=document.createElement('button');dn.type='button';dn.textContent='▼';dn.className='dn';dn.setAttribute('aria-label','letter '+(k+1)+' down');dn.onclick=()=>{ini[k]=(ini[k]+25)%26;beep(500+k*80,.05);buildIni()};c.append(up,L,dn);w.append(c)})}
$('iniSave').onclick=()=>{if(!pendTop)return;const e=pendTop;pendTop=null;e.i=ini.map(v=>String.fromCharCode(65+v)).join('');try{LS.dinoColossus_Ini=e.i}catch(_){}const r=insertTop(e.d,{i:e.i,s:e.s,sec:e.sec,v:e.v,dn:e.dn});
 $('ini').classList.add('hide');endShowBoard(e.d,r);best=topBest(diff);$('best').textContent=best;beep(523,.12);setTimeout(()=>beep(784,.12),120);setTimeout(()=>beep(1046,.25),240)};
function showEnd(){const d=G.diff,sc=G.score,q=qualifies(d,sc),prev=topBest(d),nb=sc>prev?'🎉 NEW HIGH SCORE! 🎉':'🏆 Best: '+Math.max(prev,sc);
 if(sc>prev){confetti(G.camX+VW/2,GY-250,90);beep(523,.15);setTimeout(()=>beep(784,.3),150)}
 $('final').textContent=sc;$('nb').textContent=nb;document.querySelector('#endL h1').textContent=G.champ?'👑 DINO CHAMPION!':'Game over!';$('estats').textContent=DIFFS[d]+' · LEVEL '+G.cur+' · 🌋 '+(G.thrown||0)+' PEOPLE · 👑 '+bossesBeat()+'/'+NBOSS+' BOSSES';$('endBoard').innerHTML='';endB=null;$('endL').classList.remove('hide');$('endR').classList.add('hide');$('end').classList.remove('hide');
 if(q){pendTop={d,s:sc,sec:G.cur,v:G.thrown||0,dn:pick};const p=(LS.dinoColossus_Ini||'AAA');ini=[0,1,2].map(k=>Math.max(0,(p.charCodeAt(k)||65)-65)%26);buildIni();$('ini').classList.remove('hide')}
 else{$('ini').classList.add('hide');endShowBoard(d,-1)}}
let endB=null;function endTitle(){return '⭐ '+endB.s+(endB.nb?' · NEW BEST!':'')}
function endShowBoard(d,hi){endB={d,hi,run:d,s:G.score,nb:G.score>=topBest(d)&&G.score>0,t:Date.now(),sub:DIFFS[d]+' · LEVEL '+G.cur+' · 🌋 '+(G.thrown||0)+' PEOPLE IN VOLCANOES'};$('endL').classList.add('hide');$('endR').classList.remove('hide');renderEndBoard()}
function renderEndBoard(){$('endBoard').innerHTML=boardHTML(endB.d,endB.d===endB.run?endB.hi:-1,endTitle(),endB.sub)}
$('end').addEventListener('click',e=>{if(pendTop||!endB||$('endR').classList.contains('hide'))return;const b=e.target.closest('.tabs button[data-d]');if(b){endB.d=b.dataset.d;renderEndBoard();return}if(Date.now()-endB.t<700)return;showPicker()});
function end(){if(!G.running)return;G.running=false;clearRun();finishRun();showEnd()}
function finishRun(){VIS.award(G);const prev=topBest(G.diff),nb=G.score>prev?'🎉 NEW HIGH SCORE! 🎉':'🏆 Best: '+Math.max(prev,G.score);
 $('starth').textContent='Pick a new dino!';$('lastrun').innerHTML='Last run ('+DIFFS[G.diff]+'): ⭐ <b>'+G.score+'</b> (Section '+G.cur+') · '+nb;$('lastrun').classList.remove('hide');$('go').textContent='PLAY AGAIN'}
let boardD='medium',boardT=0;function showBoard(){$('boardList').innerHTML=boardHTML(boardD,-1)}
$('topb').onclick=()=>{boardD=diff;showBoard();boardT=Date.now();$('board').classList.remove('hide')};
$('board').addEventListener('click',e=>{const b=e.target.closest('.tabs button[data-d]');if(b){boardD=b.dataset.d;showBoard();return}if(Date.now()-boardT<300)return;$('board').classList.add('hide')});
// ---- run save / continue / quit / champion ----
function bossesBeat(){return Math.max(0,(G.bossN||0)-(G.boss&&!G.boss.gone?1:0))}
function saveRun(){try{LS.dinoColossus_Run=JSON.stringify({diff:G.diff,pick,score:G.score,lives:G.lives,hearts:G.hearts,bossN:G.bossN,thrown:G.thrown||0,eaten:G.eaten||0,t:Date.now()})}catch(_){}}
function loadRun(){try{const r=JSON.parse(LS.dinoColossus_Run||'null');return r&&r.bossN>0&&r.bossN<NBOSS?r:null}catch(_){return null}}
function clearRun(){try{delete LS.dinoColossus_Run}catch(_){}}
function renderCont(){const r=loadRun(),b=$('cont');if(!b)return;b.classList.toggle('hide',!r);if(r)b.innerHTML='▶ CONTINUE<small>'+DIFFS[r.diff]+' · BOSS '+(r.bossN+1)+'/'+NBOSS+' NEXT · ⭐'+r.score+'</small>'}
$('menub').onclick=()=>{if(!G.running||G.dying)return;G.running=false;G.paused=1;$('quitq').classList.remove('hide');beep(500,.08)};
$('quitNo').onclick=()=>{$('quitq').classList.add('hide');if(G.paused){G.paused=0;G.running=true}};
$('quitYes').onclick=()=>{$('quitq').classList.add('hide');G.paused=0;clearRun();finishRun();$('starth').textContent='Pick your dino:';showPicker()};
let champT=0,champRAF=0,champConf=[];
function champion(){if(!G.running)return;G.running=false;G.champ=1;G.score+=5000;clearRun();finishRun();$('champ').classList.remove('hide');champT=Date.now();champConf=[];say('Dino Champion! You beat all twenty bosses!');
 [523,659,784,1046,784,1046].forEach((f,i)=>setTimeout(()=>beep(f,.18,'square',f*1.01),i*160));cancelAnimationFrame(champRAF);champRAF=requestAnimationFrame(champDraw)}
function champDraw(){const cv=$('champc');if($('champ').classList.contains('hide'))return;const w=cv.width=innerWidth,h=cv.height=innerHeight,x=cv.getContext('2d'),t=(Date.now()-champT)/1000;x.imageSmoothingEnabled=false;
 const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#311b92');g.addColorStop(1,'#e91e63');x.fillStyle=g;x.fillRect(0,0,w,h);
 for(let i=0;i<8;i++){x.save();x.translate(w/2,h*.62);x.rotate(t*.4+i*Math.PI/4);x.fillStyle='rgba(255,235,59,.12)';x.beginPath();x.moveTo(0,0);x.lineTo(w,-60);x.lineTo(w,60);x.fill();x.restore()}
 const gy=Math.round(h*.8);x.fillStyle='#5d4037';x.fillRect(0,gy,w,h-gy);x.fillStyle='#7cb342';x.fillRect(0,gy,w,8);
 const S=Math.max(4,Math.min(8,h/70)),dn=SPR.dino[pick][(t*6|0)%2],hop=Math.abs(Math.sin(t*5))*S*6,fl=(t*1.6|0)%2==1;
 const dw=dn.width*S,dx=w/2-dw/2,dy=gy-dn.height*S-hop;x.save();x.translate(dx+dw/2,dy+dn.height*S);x.rotate(Math.sin(t*5)*.15);if(fl)x.scale(-1,1);x.drawImage(dn,-dw/2,-dn.height*S,dw,dn.height*S);x.restore();
 x.fillStyle='#ffd600';const cx=w/2+(fl?-1:1)*S*2,cy=dy-S*2;x.beginPath();x.moveTo(cx-S*4,cy);x.lineTo(cx-S*4,cy-S*4);x.lineTo(cx-S*2,cy-S*2);x.lineTo(cx,cy-S*5);x.lineTo(cx+S*2,cy-S*2);x.lineTo(cx+S*4,cy-S*4);x.lineTo(cx+S*4,cy);x.fill();
 const ps=S*.7,np=8;for(let i=0;i<np;i++){const side=i<np/2?-1:1,k=i%(np/2),px=w/2+side*(dw*.75+k*ps*14),pp=SPR.person[i%SPR.person.length][((t*8|0)+i)%2],jy=Math.abs(Math.sin(t*6+i*1.3))*ps*10;
  x.save();x.translate(px,gy-jy);if(((t*2+i)|0)%2)x.scale(-1,1);x.rotate(Math.sin(t*8+i)*.2);x.drawImage(pp,-pp.width*ps/2,-pp.height*ps,pp.width*ps,pp.height*ps);x.restore();
  if(((t*3+i)|0)%2){x.fillStyle='#ffe0b2';x.fillRect(px-ps*5,gy-jy-pp.height*ps*.7,ps*2,ps*2);x.fillRect(px+ps*3,gy-jy-pp.height*ps*.7,ps*2,ps*2)}}
 if(champConf.length<220)for(let i=0;i<6;i++)champConf.push({x:Math.random()*w,y:-10,vx:R(-1.5,1.5),vy:R(1.5,4),a:R(0,6),va:R(-.2,.2),c:pickA(['#f44336','#ffeb3b','#4caf50','#2196f3','#e91e63','#ffffff','#ff9800'])});
 champConf=champConf.filter(p=>{p.x+=p.vx+Math.sin(t*3+p.a)*.6;p.y+=p.vy;p.a+=p.va;x.save();x.translate(p.x,p.y);x.rotate(p.a);x.fillStyle=p.c;x.fillRect(-5,-3,10,6);x.restore();return p.y<h+10});
 champRAF=requestAnimationFrame(champDraw)}
$('champ').addEventListener('click',()=>{if(Date.now()-champT<900)return;$('champ').classList.add('hide');cancelAnimationFrame(champRAF);showEnd()});
// ---- draw ----
function belMeter(x,y){const c=cap(),w=Math.max(80,Math.min(160,VW/4-40)),h=12,by=y+18,st=G.inBonus?Math.min(1,stageOf(G.belly)):stageOf(G.belly),SC=['#8bc34a','#ffa726','#e040fb'];
 pxText('BELLY',x,y,14,'#fff');pxText(G.belly+'/'+c,x+56,y+1,12,G.belly>=c?'#ffea00':'#fff');
 const fx=k=>x+Math.round(w*Math.min(1,k/c));ctx.fillStyle='#000';ctx.fillRect(x-2,by-2,w+4,h+4);
 ctx.fillStyle='#2e3b23';ctx.fillRect(x,by,fx(FAT_AT)-x,h);ctx.fillStyle='#4a3417';ctx.fillRect(fx(FAT_AT),by,fx(ROLL_AT)-fx(FAT_AT),h);ctx.fillStyle='#3d1f45';ctx.fillRect(fx(ROLL_AT),by,x+w-fx(ROLL_AT),h);
 const f=fx(G.belly)-x;ctx.fillStyle=SC[st];ctx.fillRect(x,by,f,h);if(st==2&&(G.el*6|0)%2){ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(x,by,f,h)}
 ctx.fillStyle='#fff';ctx.fillRect(fx(FAT_AT)-1,by-3,2,h+6);ctx.fillRect(fx(ROLL_AT)-1,by-3,2,h+6);pxText(String(FAT_AT),fx(FAT_AT),by+h+3,10,'#ffa726','center');pxText(String(ROLL_AT),fx(ROLL_AT),by+h+3,10,'#e040fb','center');pxText(STAGE_N[st],x+w/2,by+1,10,'#fff','center');
}
function em(e,x,y,s){ctx.font=s+'px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(e,x,y)}
const SKY=[[0,'#ffd8a8','#8fd3ff'],[.2,'#4fc3f7','#b3e5fc'],[.42,'#ff8a65','#ffd54f'],[.52,'#3949ab','#7e57c2'],[.6,'#0b1033','#1a237e'],[.85,'#0b1033','#1a237e'],[.93,'#f48fb1','#ffcc80'],[1,'#ffd8a8','#8fd3ff']];
function lerpC(a,b,k){const pa=parseInt(a.slice(1),16),pb=parseInt(b.slice(1),16);const c=[16,8,0].map(s=>Math.round(((pa>>s)&255)*(1-k)+((pb>>s)&255)*k));return 'rgb('+c.join(',')+')'}
function skyAt(p){for(let i=0;i<SKY.length-1;i++)if(p>=SKY[i][0]&&p<=SKY[i+1][0]){const k=(p-SKY[i][0])/(SKY[i+1][0]-SKY[i][0]);return [lerpC(SKY[i][1],SKY[i+1][1],k),lerpC(SKY[i][2],SKY[i+1][2],k)]}return [SKY[0][1],SKY[0][2]]}
const CYCLE=180;function darkness(p){if(p<.42)return 0;if(p<.6)return (p-.42)/.18*.42;if(p<.85)return .42;if(p<.97)return .42*(1-(p-.85)/.12);return 0}
function hash(n){n=Math.sin(n*127.1)*43758.5453;return n-Math.floor(n)}
function pxText(t,x,y,sz,c,al='left'){ctx.font='bold '+sz+'px "Courier New",monospace';ctx.textAlign=al;ctx.textBaseline='top';ctx.fillStyle='#000';ctx.fillText(t,x+1.5,y+1.5);ctx.fillStyle=c;ctx.fillText(t,x,y)}
function cloud(x,y,s){ctx.fillStyle='#fff';const u=s*6;ctx.fillRect(x+u,y,u*3,u);ctx.fillRect(x,y+u,u*5,u);ctx.fillRect(x+u*.5,y+u*2,u*4,u*.8);ctx.fillStyle='#d6ecff';ctx.fillRect(x+u*.5,y+u*2.5,u*4,u*.3)}
function hill(x,base,r,col){ctx.fillStyle=col;ctx.beginPath();ctx.arc(x,base,r,Math.PI,0);ctx.fill();ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(x-r*.3,base-r*.6,4,8);ctx.fillRect(x+r*.15,base-r*.45,4,8)}
function volcanoPx(cx,base,big,dk){const h=big===2?170:big?120:70,w0=big===2?230:big?160:90,w1=big?44:26,step=6;for(let y=0;y<h;y+=step){const k=y/h,w=w0+(w1-w0)*k;ctx.fillStyle=((y/step)|0)%2?'#6d5a4a':'#7d6a58';ctx.fillRect(Math.round(cx-w/2),base-y-step,Math.round(w),step)}
 ctx.fillStyle='#ff6d00';ctx.fillRect(cx-w1/2+4,base-h-4,w1-8,6);ctx.fillStyle='#ffea00';ctx.fillRect(cx-w1/2+10,base-h-4,w1-20,3);if(big){ctx.fillStyle='#ff6d00';ctx.fillRect(cx-6,base-h+2,6,24);ctx.fillRect(cx+8,base-h+2,5,14)}
 if(dk>.2){const rg=ctx.createRadialGradient(cx,base-h,6,cx,base-h,110);rg.addColorStop(0,'rgba(255,140,0,'+dk+')');rg.addColorStop(1,'rgba(255,140,0,0)');ctx.fillStyle=rg;ctx.fillRect(cx-110,base-h-110,220,220)}}
function drawSolid(s,B){const x=Math.round(s.x),y=Math.round(s.y);
 if(s.k=='g'||s.k=='arena'){const bb=G.inBonus?{top:'#6d4c41',stone:'#4e342e',dark:'#2b1a14'}:B;ctx.fillStyle=bb.stone;ctx.fillRect(x,y,s.w,s.h);ctx.fillStyle=bb.dark;
  for(let ty=y;ty<y+150;ty+=T){const off=((ty-y)/T)%2?15:0;for(let tx=x-off;tx<x+s.w;tx+=T){ctx.fillRect(Math.max(x,tx),ty,1+0,T);ctx.fillRect(Math.max(x,tx),ty+T-2,Math.min(T,x+s.w-Math.max(x,tx)),2);ctx.fillRect(Math.max(x,tx)+2,ty+2,3,3)
   if(hash(tx*.37+ty)>.88&&tx>=x&&tx+24<x+s.w)spr(SPR.bone,tx+7,ty+12,2)}}ctx.fillStyle=bb.top;ctx.fillRect(x,y,s.w,6);ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(x,y+6,s.w,2)}
 else if(s.k=='p'){ctx.fillStyle='#8b5a2b';ctx.fillRect(x,y,s.w,s.h);ctx.fillStyle='#5d3a1a';for(let i=0;i<s.w;i+=10)ctx.fillRect(x+i,y+4,6,2);ctx.fillStyle='#c48a4a';ctx.fillRect(x,y,s.w,3);ctx.fillStyle='#d9a066';ctx.fillRect(x,y,8,s.h);ctx.fillRect(x+s.w-8,y,8,s.h);ctx.fillStyle='#5d3a1a';ctx.fillRect(x+3,y+6,2,6);ctx.fillRect(x+s.w-5,y+6,2,6)}
 else if(s.k=='q'){ctx.fillStyle='#000';ctx.fillRect(x,y,30,30);ctx.fillStyle='#ffb300';ctx.fillRect(x+1,y+1,28,28);ctx.fillStyle='#ffd54f';ctx.fillRect(x+3,y+3,24,4);ctx.fillStyle='#e65100';ctx.fillRect(x+3,y+25,24,2);ctx.fillStyle='#6d3a00';ctx.fillRect(x+11,y+8,8,3);ctx.fillRect(x+17,y+10,3,5);ctx.fillRect(x+13,y+14,5,3);ctx.fillRect(x+13,y+19,4,3);ctx.fillStyle='#000';ctx.fillRect(x+3,y+3,2,2);ctx.fillRect(x+25,y+3,2,2)}
 else if(s.k=='used'){ctx.fillStyle='#000';ctx.fillRect(x,y,30,30);ctx.fillStyle='#8d6e63';ctx.fillRect(x+1,y+1,28,28);ctx.fillStyle='#5d4037';ctx.fillRect(x+4,y+4,3,3);ctx.fillRect(x+23,y+23,3,3)}
 else if(s.k=='brick'||s.k=='cr'){ctx.fillStyle='#000';ctx.fillRect(x,y,30,30);ctx.fillStyle='#8a8070';ctx.fillRect(x+1,y+1,28,28);ctx.fillStyle='#5f574a';ctx.fillRect(x+1,y+14,28,2);ctx.fillRect(x+14,y+1,2,13);ctx.fillRect(x+7,y+16,2,13);ctx.fillRect(x+22,y+16,2,13);ctx.fillStyle='#b0a690';ctx.fillRect(x+2,y+2,10,2);
  if(s.k=='cr'){ctx.fillStyle='#111';ctx.fillRect(x+6,y+4,3,6);ctx.fillRect(x+8,y+9,3,6);ctx.fillRect(x+6,y+15,3,6);ctx.fillRect(x+9,y+20,8,3);ctx.fillRect(x+17,y+18,3,8);spr(SPR.bone,x+15,y+5,1.5)}}
 else if(s.k=='log'){ctx.fillStyle='#000';ctx.fillRect(x-1,y-1,s.w+2,s.h+1);ctx.fillStyle='#7b4a22';ctx.fillRect(x,y,s.w,s.h);ctx.fillStyle='#9c6430';for(let i=4;i<s.w;i+=12)ctx.fillRect(x+i,y+8,4,s.h-8);ctx.fillStyle='#c79257';ctx.fillRect(x,y,s.w,10);ctx.fillStyle='#2b1a0e';ctx.fillRect(x+10,y+2,s.w-20,6)}
 else if(s.k=='stump'){ctx.fillStyle='#000';ctx.fillRect(x-1,y-1,s.w+2,s.h+1);ctx.fillStyle='#6d4424';ctx.fillRect(x,y,s.w,s.h);ctx.fillRect(x-6,y+s.h-12,s.w+12,12);ctx.fillStyle='#e0b47a';ctx.fillRect(x,y,s.w,8);ctx.fillStyle='#a8743c';ctx.fillRect(x+12,y+2,s.w-24,4);ctx.fillStyle='#4e2e14';for(let i=6;i<s.w;i+=14)ctx.fillRect(x+i,y+10,3,s.h-12)}
 else if(s.k=='pillar'){for(let yy=0;yy<s.h;yy+=30){ctx.fillStyle='#000';ctx.fillRect(x,y+yy,s.w,30);ctx.fillStyle=(yy/30)%2?'#8f8f8f':'#a3a3a3';ctx.fillRect(x+1+(yy/30%2?3:0),y+yy+1,s.w-5,28);ctx.fillStyle='#6b6b6b';ctx.fillRect(x+8,y+yy+10,6,4);ctx.fillRect(x+34,y+yy+18,8,4)}}}
function draw(){ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);if(!G.d)return;
 const p=G.inBonus?.25:(G.dayT%CYCLE)/CYCLE,dk=G.inBonus?0:darkness(p);
 const sec=G.inBonus?null:curSec(G.camX+VW/2),B=sec?sec.biome:BIOMES[0];
 ctx.save();ctx.beginPath();ctx.rect(0,OY,W,VH*S);ctx.clip();const so=VIS.shakeOff();ctx.translate(so[0],OY+so[1]);ctx.scale(S,S);
 // flat retro sky (tinted to night)
 if(G.inBonus){ctx.fillStyle='#120c08';ctx.fillRect(0,0,VW,VH)}else VIS.bgFar(B,p,dk);ctx.translate(0,-WY);
 ctx.translate(-Math.round(G.camX),0);
 for(const o of G.deco){if(o.front||o.x<G.camX-80||o.x>G.camX+VW+80)continue;const c=SPR[o.e];if(c)spr(c,Math.round(o.x),GY-c.height*o.s,o.s)}
 for(const o of G.deco){if(!o.front||o.x<G.camX-80||o.x>G.camX+VW+80)continue;const c=SPR[o.e];if(c)spr(c,Math.round(o.x),GY-c.height*o.s,o.s)}
 for(const s of G.solids){if(s.x>G.camX+VW+10||s.x+s.w<G.camX-10)continue;drawSolid(s,s.k=='g'&&!G.inBonus?curSec(s.x).biome:B)}
 if(!G.inBonus)for(const s2 of G.secs)for(const pt of s2.pits){if(pt.x>G.camX+VW||pt.x+pt.w<G.camX)continue;ctx.fillStyle='#ff3d00';ctx.fillRect(pt.x,GY+22,pt.w,VH);ctx.fillStyle='#ff9100';ctx.fillRect(pt.x,GY+22,pt.w,8);ctx.fillStyle='#ffea00';for(let i=0;i<pt.w;i+=10){const by=Math.round(Math.sin(G.el*4+i+pt.x)*3);ctx.fillRect(pt.x+i+2,GY+18+by,6,6)}if(Math.random()<.05)G.parts.push({x:pt.x+R(4,pt.w-4),y:GY+20,vx:0,vy:R(-3,-1.5),l:.5,r:3,c:'#ffea00'});const gl=ctx.createLinearGradient(0,GY-40,0,GY+22);gl.addColorStop(0,'rgba(255,120,0,0)');gl.addColorStop(1,'rgba(255,120,0,.45)');ctx.fillStyle=gl;ctx.fillRect(pt.x,GY-40,pt.w,62)}
 for(const v of G.vols){const cx=v.x+v.w/2;volcanoPx(cx,GY,v.end?2:true,dk);if(v.end&&!v.done)pxText('SECTION END',cx,GY-200+Math.sin(G.el*4)*3,12,'#ffea00','center');else if(G.belly&&!G.busyVol&&!v.end)pxText('BARF HERE!',cx,GY-150+Math.sin(G.el*5)*3,12,'#fff','center')}
 for(const pt of G.portals){spr(SPR.cave,pt.x-6,pt.y+6,3.5)}
 for(const f of G.lava){ctx.fillStyle='#ff3d00';ctx.fillRect(f.x,f.y-8,f.w,8);ctx.fillStyle='#ffea00';for(let x=0;x<f.w;x+=6)ctx.fillRect(f.x+x,f.y-10-Math.round(Math.sin(x*.3+f.ph)*2+2),4,4);if(dk>.2){ctx.fillStyle='rgba(255,180,0,.3)';ctx.fillRect(f.x-10,f.y-30,f.w+20,34)}}
 for(const w of G.waves){ctx.fillStyle=w.tail?'#6d8fa8':'#8d6e63';for(let i=0;i<4;i++)ctx.fillRect(w.x+i*5,GY-w.h+Math.abs(i-1.5)*5,5,w.h-Math.abs(i-1.5)*5)}
 for(const m of G.meteors){const k=m.t/m.T;ctx.fillStyle='rgba(0,0,0,'+(.15+.3*k)+')';ctx.fillRect(m.x-(22*k+6),m.y-4,(22*k+6)*2,6);ctx.fillStyle='#ff1744';ctx.fillRect(m.x-28,m.y-2,8,3);ctx.fillRect(m.x+20,m.y-2,8,3);if(m.rock)spr(SPR.boulder,m.x-12,m.y-(1-k)*360-28,3);else spr(SPR.meteor,m.x+(1-k)*90-16*(m.mini?.5:1),m.y-(1-k)*360-30*(m.mini?.5:1),m.mini?2:4)}
 VIS.pickupGlow();for(const q of G.pel)spr(SPR.pellet,Math.round(q.x-7),Math.round(q.y-7+Math.sin(G.el*6)*2),3);
 for(const gm of G.gemsW)spr(SPR.gem,Math.round(gm.x-10),Math.round(gm.y-10+Math.sin(G.el*5)*3),3);
 const fr=(G.el*8|0)%2;
 for(const q of G.people){if(q.x<G.camX-40||q.x>G.camX+VW+40)continue;spr(SPR.person[q.v||0][q.vx?fr:0],Math.round(q.x-1),Math.round(q.y-0.5),2.2,q.vx<0);if(q.dance>0&&(q.dance>>4)%2)pxText('♪',q.x+9,q.y-14,14,'#ff80ab','center');if(q.smoky){ctx.fillStyle='#777';ctx.fillRect(q.x+4,q.y-8,6,6);ctx.fillRect(q.x+10,q.y-14,5,5)}}
 for(const c of G.critters){if(c.x<G.camX-40||c.x>G.camX+VW+40)continue;const sp=SPR[c.k];spr(sp,Math.round(c.x+c.w/2-sp.width*c.sc/2),Math.round(c.y+c.h-sp.height*c.sc),c.sc,c.vx<0)}
 for(const l of G.littles){if(l.x<G.camX-40||l.x>G.camX+VW+40)continue;spr(SPR.little[l.c||0][fr],Math.round(l.x-1.5),Math.round(l.y-2),2.4,l.vx>0)}
 for(const r of G.rangers){spr(SPR.ranger,Math.round(r.x),Math.round(r.y-0.5),2.8,r.vx<0);if(r.stun)spr(SPR.star,r.x+4,r.y-14,2);else{const f=r.vx<0?-1:1,sx=r.x+(f<0?-4:24);ctx.fillStyle='#6d4c2e';ctx.fillRect(f<0?sx-24:sx,r.y+12,28,3);ctx.fillStyle='#9e9e9e';const tx=f<0?sx-30:sx+28;ctx.fillRect(tx,r.y+10,6,7);ctx.fillStyle='#e0e0e0';ctx.fillRect(f<0?tx:tx+3,r.y+12,3,3)}}
 for(const bo of G.boulders){ctx.save();ctx.translate(bo.x+14,bo.y+14);ctx.rotate(Math.round(bo.a/(Math.PI/2))*(Math.PI/2));spr(SPR.boulder,-14,-14,3.5);ctx.restore()}
 for(const g of G.bigs){if(g.x<G.camX-80||g.x>G.camX+VW+80)continue;const ch=g.chomp>0,bob=ch?Math.round(Math.sin(g.chomp*.6)*3):0,c=SPR.bigDino[ch?((g.chomp>>2)%2):(g.vx?fr:0)],sc=3.75;
  spr(c,Math.round(g.x+g.w/2-c.width*sc/2),Math.round(g.y+g.h-c.height*sc+bob),sc,g.f<0);if(ch&&g.chomp>12){ctx.fillStyle='#fff';ctx.fillRect(g.x+(g.f>0?g.w-4:-4),g.y+6+bob,6,6)}}
 for(const n of G.noms){const g=n.g,k=n.t/22,mx=g.x+(g.f>0?g.w-8:8),my=g.y+12,x=n.x+(mx-n.x)*k,y=n.y+(my-n.y)*k-Math.sin(k*Math.PI)*16;ctx.globalAlpha=1-k*.6;spr(SPR.person[n.v][0],Math.round(x),Math.round(y),2.2*(1-k*.7));ctx.globalAlpha=1}
 if(G.rival){const r=G.rival;spr(SPR.rival[r.vx?fr:0],Math.round(r.x-4),Math.round(r.y-6),2.6,r.f<0);if(r.dizzy>0)spr(SPR.star,r.x+8,r.y-18,2)}
 VIS.bossAura(G.boss);const b=G.boss;if(b){if(b.tele&&!b.vuln)pxText('!',b.x+b.w/2,b.y-40,30,'#ff1744','center');const c=SPR.boss[b.T.i][(b.T.fly?(G.el*6|0):(b.vx||b.air||b.mode=='dive'?fr:(G.el*2|0)))%2],sc=b.T.sc;const flip=b.vx?b.vx<0:(G.d.x+G.d.w/2<b.x+b.w/2);const wob=(b.vuln||b.gone)?Math.round(Math.sin(G.el*20)*3):0;if(b.inv&&(b.inv>>2)%2)ctx.globalAlpha=.45;if(b.mode=='under'){const fx=b.x+b.w/2,wv=Math.sin(G.el*6)*3;ctx.fillStyle='#000';ctx.beginPath();ctx.moveTo(fx-16,GY+2);ctx.lineTo(fx+4,GY-30);ctx.lineTo(fx+14,GY+2);ctx.fill();ctx.fillStyle='#455a64';ctx.beginPath();ctx.moveTo(fx-12,GY);ctx.lineTo(fx+4,GY-25);ctx.lineTo(fx+11,GY);ctx.fill();ctx.fillStyle='rgba(129,212,250,.8)';ctx.fillRect(fx-34+wv,GY-4,68,4)}else spr(c,Math.round(b.x+b.w/2-c.width*sc/2+wob),Math.round(b.y+b.h-c.height*sc),sc,flip);
  ctx.globalAlpha=1;if(!b.gone&&b.mode!='under'&&(!b.T.fly||b.mode!='fly')){const ax=b.x+b.w/2,ay=b.y-58+Math.round(Math.abs(Math.sin(G.el*5))*-10);ctx.fillStyle='#000';ctx.beginPath();ctx.moveTo(ax-16,ay-2);ctx.lineTo(ax+16,ay-2);ctx.lineTo(ax,ay+20);ctx.closePath();ctx.fill();ctx.fillStyle='#ffea00';ctx.beginPath();ctx.moveTo(ax-12,ay);ctx.lineTo(ax+12,ay);ctx.lineTo(ax,ay+16);ctx.closePath();ctx.fill();ctx.fillRect(ax-5,ay-14,10,14)}
  if(b.vuln||b.gone){for(let i=0;i<3;i++)spr(SPR.star,b.x+b.w/2-30+i*22+Math.sin(G.el*8+i)*6,b.y-14,2.5)}
  if(b.say)pxText(b.say.toUpperCase(),b.x+b.w/2,b.y-34,12,'#fff','center')}
 for(const q of G.lines){ctx.globalAlpha=q.l;const x2=q.x-Math.sign(G.d.vx||1)*q.len;ctx.fillStyle='rgba(0,0,60,.35)';ctx.fillRect(Math.min(q.x,x2),q.y-3,Math.abs(q.len),6);ctx.fillStyle='#fff';ctx.fillRect(Math.min(q.x,x2),q.y-2,Math.abs(q.len),4)}ctx.globalAlpha=1;
 for(const t of G.trail){ctx.globalAlpha=t.l*.35;spr(SPR.dino[pick][0],t.x-4,t.y-6,2.6*G.grow,G.d.f<0)}ctx.globalAlpha=1;
 const d=G.d;if(!(G.hit&&(G.hit>>2)%2)){const sc=2.6*d.h/36;if(G.inv&&(G.el*10|0)%2){ctx.globalAlpha=.6}if(G.roll){const r=d.h/2,cx=d.x+d.w/2,cy=d.y+d.h/2,pal=VIS.pal(pick),sq=G.squish?1+G.squish*.02:1;ctx.save();ctx.translate(cx,cy+(sq-1)*r);ctx.scale(sq,1/sq);ctx.fillStyle='#000';ctx.beginPath();ctx.arc(0,0,r+1.5,0,7);ctx.fill();ctx.fillStyle=pal.G;ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.fill();ctx.rotate(G.rollA);ctx.fillStyle=pal.B;ctx.beginPath();ctx.arc(0,r*.25,r*.6,0,7);ctx.fill();ctx.fillStyle=pal.L;for(let i=0;i<4;i++){ctx.rotate(Math.PI/2);ctx.fillRect(r*.55,-2,r*.4,4)}ctx.fillStyle='#fff';ctx.fillRect(r*.15,-r*.6,7,7);ctx.fillStyle='#000';ctx.fillRect(r*.15+3,-r*.6+2,3,3);ctx.restore()}
  else{const fat=1+.3*Math.min(1.3,G.bv),wf=G.fat?(G.wad||0):0,tilt=G.fat&&d.on?Math.sin(wf)*.11:0,bob=G.fat&&d.on&&d.vx?Math.abs(Math.sin(wf))*-3:0,c=VIS.dinoSpr(pick,d.vx&&d.on?(G.fat?(Math.sin(wf)>0?1:0):fr):0),wpx=16*sc*fat,fx=Math.round(d.x+d.w/2),fy=d.y+d.h;
   ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(fx,fy+bob);ctx.rotate(tilt);if(d.f<0)ctx.scale(-1,1);{const q=VIS.sqs(d);ctx.scale(q[0],q[1]);ctx.rotate(VIS.wobble(d))}ctx.drawImage(c,Math.round(-wpx/2-sc*fat),Math.round(-17*sc),Math.round(wpx+2*sc*fat),Math.round(18*sc));ctx.save();ctx.scale(fat,1);VIS.dinoDecor(ctx,pick,sc,d);ctx.restore();
   const pal=VIS.pal(pick);if(G.fat){const rr=d.h*(.4+.08*Math.min(1,G.bv-1)/.3),j=Math.sin(G.el*25)*G.jig*.15,bx=-1,by=-d.h*.4,rw=rr*(1.05+j),rh=rr*(.92-j);
    ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(bx,by,rw+2,rh+2,0,0,7);ctx.fill();ctx.fillStyle=pal.G;ctx.beginPath();ctx.ellipse(bx,by,rw,rh,0,0,7);ctx.fill();
    ctx.fillStyle=pal.B;ctx.beginPath();ctx.ellipse(bx+rw*.12,by+rh*.12,rw*.72,rh*.7,0,0,7);ctx.fill();ctx.fillStyle='rgba(255,255,255,.55)';ctx.beginPath();ctx.ellipse(bx-rw*.3,by-rh*.45,rw*.22,rh*.13,-.5,0,7);ctx.fill();
    ctx.fillStyle=pal.L;ctx.fillRect(Math.round(bx+rw*.1)-2,Math.round(by+rh*.15)-2,4,4);ctx.restore()}
   else{ctx.restore();if(G.bv>.02){const rr=d.h*(.12+.36*G.bv),j=Math.sin(G.el*25)*G.jig*.18,bx=d.x+d.w/2-d.f*3,by=d.y+d.h*.6;const rw=Math.round(rr*(1+j)),rh=Math.round(rr*.85*(1-j));ctx.fillStyle='#000';ctx.fillRect(bx-rw-1,by-rh-1,rw*2+2,rh*2+2);ctx.fillStyle=pal.G;ctx.fillRect(bx-rw,by-rh,rw*2,rh*2);ctx.fillStyle=pal.B;ctx.fillRect(bx-rw*.6,by-rh*.5,rw*1.2,rh*1.3)}}
   if(G.fat&&d.on&&d.vx&&(G.el*60|0)%14==0)G.smoke.push({x:d.x+d.w/2-d.f*d.w*.4,y:d.y+d.h-4,vx:-d.f*.5,vy:-.3,r:5,l:.45})}}
 ctx.globalAlpha=1;if(G.star){const hue=(G.el*400)%360;ctx.strokeStyle='hsl('+hue+',100%,60%)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(d.x+d.w/2,d.y+d.h/2,Math.max(d.w,d.h)*.75,0,7);ctx.stroke();if((G.el*20|0)%3==0)G.parts.push({x:d.x+R(0,d.w),y:d.y+R(0,d.h),vx:0,vy:-1,l:.5,r:2,c:'hsl('+hue+',100%,70%)'})}
 if(G.buddy){const u=G.buddy;if(!(u.t<120&&(u.t>>3)%2))spr(SPR.dino[u.k][u.vx&&u.on?fr:0],Math.round(u.x-4),Math.round(u.y-6),1.7,u.f<0)}
 if(G.sjump&&(G.el*6|0)%2)pxText('^^',d.x+d.w/2,d.y+d.h,10,'#80d8ff','center');
 if(G.inv)spr(SPR.star,d.x+d.w/2-7,d.y-16,2);if(G.rev)pxText('<>',d.x+d.w/2,d.y-20,12,'#ff8a80','center');
 if(G.flame>0)for(let i=0;i<3;i++)spr(SPR.flame,d.x+(d.f>0?d.w+i*22:-22-i*22),d.y+4+Math.sin(G.el*30+i)*3,2.6,d.f<0);
 drawBossArms();
 for(const m of G.smoke){ctx.globalAlpha=m.l*.7;ctx.fillStyle='#9e9e9e';const r=Math.round(m.r/4)*4;ctx.fillRect(m.x-r,m.y-r,r*2,r*2)}
 if(G.burst){const u=G.burst,r=Math.round(u.r/6)*6;ctx.globalAlpha=Math.max(0,u.l);ctx.fillStyle='#ff6d00';ctx.fillRect(u.x-r,u.y-r*.8,r*2,r*1.6);ctx.fillRect(u.x-r*.8,u.y-r,r*1.6,r*2);ctx.fillStyle='#ffea00';ctx.fillRect(u.x-r*.55,u.y-r*.45,r*1.1,r*.9);ctx.fillRect(u.x-r*.45,u.y-r*.55,r*.9,r*1.1)}ctx.globalAlpha=1;
 for(const o of G.toss){if(o.t<0)continue;const k=o.t/30;spr(SPR.person[0][0],o.x+(o.tx-o.x)*k-8,o.y+(o.ty-o.y)*k-Math.sin(k*Math.PI)*70-12,2)}
 for(const q of G.goo){ctx.globalAlpha=q.l;ctx.fillStyle='#76ff03';const r=Math.round(q.r);ctx.fillRect(q.x-r,q.y-r,r*2,r*2)}
 for(const q of G.parts){ctx.globalAlpha=Math.min(1,q.l);ctx.fillStyle=q.c;const r=Math.round(q.r||5);ctx.fillRect(Math.round(q.x-r),Math.round(q.y-r),r*2,r*2)}ctx.globalAlpha=1;
 VIS.fxWorld();VIS.roarText();for(const q of G.safe){const w=(G.el*6+q.v|0)%2;spr(SPR.person[q.v][(G.el*8|0)%2],Math.round(q.x),Math.round(q.y),2.2,q.vx<0);ctx.fillStyle='#000';ctx.fillRect(q.x+(q.vx<0?2:12),q.y-6-w*3,5,7);ctx.fillStyle='#f6c89f';ctx.fillRect(q.x+(q.vx<0?3:13),q.y-5-w*3,3,5);if(q.t<90)pxText('YAY!',q.x+9,q.y-18,10,'#fff59d','center')}
 for(const f of G.fly){if(f.chute)spr(SPR.chute,f.x-13,f.y-32,3);spr(SPR.person[f.v==null?0:f.v][0],f.x-9,f.y-13,2.2);if(!f.chute)pxText('WHEEE!',f.x+12,f.y-18,11,'#fff')}
 sillyDraw();
 for(const m of G.msgs){ctx.globalAlpha=Math.max(0,m.l);const t=m.t.toUpperCase();ctx.font='bold 14px "Courier New",monospace';const hw=ctx.measureText(t).width/2+6,x=Math.max(G.camX+hw,Math.min(G.camX+VW-hw,m.x)),y=Math.max(WY+(OY>0?0:96/S)+4,G.silBot||0,m.y);pxText(t,x,y,14,m.c,'center')}ctx.globalAlpha=1;
 ctx.translate(Math.round(G.camX),WY);VIS.fgNear(B);VIS.leavesDraw(B);
 if(dk>0){ctx.fillStyle='rgba(10,10,60,'+dk*.6+')';ctx.fillRect(0,0,VW,VH)}
 if(G.flash){ctx.fillStyle='rgba(255,240,200,'+VIS.flashA(G.flash)+')';ctx.fillRect(0,0,VW,VH)}
 // retro HUD
 VIS.hudBack(); const hy=10,col=VW/4;pxText('DINO',14,hy,14,'#fff');pxText(String(G.score).padStart(6,'0'),14,hy+16,17,'#fff59d');
 {const vx=col+4,vy=hy+1;ctx.fillStyle='#000';ctx.fillRect(vx,vy+3,16,11);ctx.fillStyle='#8d6e63';ctx.fillRect(vx+1,vy+8,14,6);ctx.fillRect(vx+4,vy+4,8,4);ctx.fillStyle='#ff6d00';ctx.fillRect(vx+5,vy+2,6,3);ctx.fillStyle='#ffea00';ctx.fillRect(vx+7,vy,2,3)}pxText('x'+(G.thrown||0),col+24,hy,14,'#ffcc80');
 spr(SPR.gem,col+4,hy+16,2.2);pxText('x'+String(gems).padStart(2,'0'),col+24,hy+17,13,'#fff');
 pxText('LEVEL',col*2,hy,14,'#fff');pxText(DIFFS[G.diff||diff],col*2+52,hy+1,12,G.diff==='hard'?'#ff8a80':G.diff==='easy'?'#b2ff59':'#ffe082');pxText(G.inBonus?'BONUS':String(G.cur),col*2,hy+16,14,'#fff');pxText('BOSS '+bossesBeat()+'/'+NBOSS,col*2+(G.inBonus?60:36),hy+18,11,'#ffd54f');
 belMeter(col*3,hy);
 for(let i=0;i<Math.min(G.hearts,6);i++)spr(SPR.heart,14+i*17,hy+36,2);if(G.hearts>6)pxText('+'+(G.hearts-6),14+6*17,hy+34,12,'#fff');pxText('LIVES',col*2,hy+36,12,'#fff');for(let i=0;i<G.lives;i++){ctx.save();ctx.beginPath();ctx.rect(col*2+46+i*20,hy+30,18,18);ctx.clip();spr(SPR.dino[pick][0],col*2+46+i*20-12,hy+31,1.5,false);ctx.restore()}
 if(carn()){const s=curSec(G.d.x);spr(SPR.little[0][0],col+4,hy+37,1.3);pxText(s.ate+'/'+s.goal,col+24,hy+36,12,s.ate>=s.goal?'#b2ff59':'#fff')}
 const tc=(t,y,sz,c)=>{ctx.font='bold '+sz+'px "Courier New",monospace';const w=ctx.measureText(t).width;if(w>VW-16)sz=Math.floor(sz*(VW-16)/w);pxText(t,VW/2,y,sz,c,'center')};
 let ty=92;if(b&&!b.gone){const bw=VW*.6,bx=VW*.2,seg=(bw-4)/b.max;tc('BOSS '+(b.n||1)+'/'+NBOSS+' · '+b.T.short,ty,14,'#fff');ty+=17;VIS.bossBar(b,ty);ty+=28;
  if(G.bossHint){const k=Math.min(1,G.bossHint.l);ctx.globalAlpha=k;if(G.bossHint.n)tc(G.bossHint.n,VH*.5-40,34,'#fff');tc(G.bossHint.t,VH*.5+Math.sin(G.el*6)*4,28,'#ffea00');tc('Touch a weapon, then tap ATTACK. Jumping on its head works too!',VH*.5+36,13,'#fff');ctx.globalAlpha=1}}
 if(G.ch&&G.ch.k=='rival'){tc('YOU '+G.ch.you+' VS '+G.ch.riv+' RIVAL',ty,15,'#fff');ty+=20}
 if(G.inBonus){tc('BONUS CAVE '+Math.ceil(G.bonusT),ty,15,'#ffea00');ty+=20}
 if(G.secBanner){ctx.globalAlpha=Math.min(1,G.secBanner.l);tc(G.secBanner.t.toUpperCase(),ty,16,'#fff');ctx.globalAlpha=1}
 if(G.banner)tc(G.banner.t.replace(/[^\x20-\x7E]/g,'').trim().toUpperCase(),G.silBot?VH*.52:VH*.36,26,'#ffea00');
 VIS.hudFront();ctx.restore()}
let acc=0,last=0;function loop(t){const dt=Math.min(100,t-last||16);last=t;acc+=dt;while(acc>=16.67){if(G.running)update();else if(G.parts)G.parts=G.parts.filter(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.3;p.l-=.01;return p.l>0});VIS.step();acc-=16.67}draw();requestAnimationFrame(loop)}requestAnimationFrame(loop);
// ---- v15 HARD-ONLY silly human: warning first (1.2 s), then ONE random harmless effect. Never on easy/medium.
// stink: can't run sideways (jump still works); bubble: floats + drifts, pops, safe drop; pogo: auto-bounces.
// Calm halves effect time. G.silGrace: while an effect runs (+1.5 s), falling into a pit/lava just puts you back, no hurt.
const SIL={gap:[20,35],warn:1.2,dur:{stink:1.8,bubble:2.6,pogo:2},kinds:['stink','bubble','pogo'],
 say:{stink:'TOOT! NO RUNNING!',bubble:'BLOOP! BUBBLE RIDE!',pogo:'BOING! POGO!'},snd:{stink:'toot',bubble:'whoosh',pogo:'boing'}};
function calmOn(){try{return LS.dinoColossus_Calm==='1'}catch(e){return false}}
function sillyBusy(){const b=G.boss;return G.inBonus||G.dying||!G.running||G.paused||G.banner||G.secBanner&&G.secBanner.l>1.8||(b&&!b.gone&&(b.tele||b.roar||G.bossHint&&G.bossHint.l>4))}
function sillyStart(k){const s=G.sil;k=k||pickA(SIL.kinds.filter(q=>q!==s.last));s.last=k;s.k=k;s.warn=SIL.warn;s.side=Math.random()<.5?-1:1;s.fx=null;VIS.play('warn')}
function sillyUpd(d){if(G.diff!=='hard'){G.sil=null;return}if(!G.sil)G.sil={next:R(SIL.gap[0],SIL.gap[1]),n:0};const s=G.sil;if(G.silGrace>0)G.silGrace--;
 if(s.fx){s.fx.t-=1/60;if(s.fx.k=='stink'&&(G.el*60|0)%6==0)G.smoke.push({x:d.x+d.w/2+R(-14,14),y:d.y+R(0,d.h),vx:R(-.6,.6),vy:-.5,r:9,l:.6,g:1});
  if(s.fx.t<=0){const k=s.fx.k;s.fx=null;G.silGrace=90;if(k=='bubble'){VIS.play('pop');G.inv=Math.max(G.inv||0,90);poof(d.x+d.w/2,d.y+d.h/2,6);sillySafeX(d)}s.next=R(SIL.gap[0],SIL.gap[1])}return}
 if(s.warn>0){s.warn-=1/60;if(s.warn<=0){const k=s.k,c=calmOn()?.5:1;s.fx={k,t:SIL.dur[k]*c,T:SIL.dur[k]*c,ph:0};s.n++;G.silGrace=Math.round(SIL.dur[k]*c*60)+90;VIS.play(SIL.snd[k]);if(k=='bubble'){d.vy=-2;sillySafeX(d)}if(!calmOn()){G.shake=Math.max(G.shake||0,4);VIS.buzz(25)}}return}
 if((s.next-=1/60)<=0){if(sillyBusy())s.next=1;else sillyStart()}}
// bubble drift stays over solid ground so the pop never drops you into a pit or lava
function sillySafeX(d){const cx=d.x+d.w/2;if(groundTop(cx)!=null&&groundTop(d.x+2)!=null&&groundTop(d.x+d.w-2)!=null)return;for(let o=10;o<400;o+=10)for(const sg of[-1,1]){const x=cx+sg*o;if(groundTop(x-d.w/2-2)!=null&&groundTop(x+d.w/2+2)!=null&&groundTop(x)!=null&&x-d.w/2>G.camX+4){d.x=x-d.w/2;return}}}
function sillyMove(d){const f=G.sil.fx;f.ph+=1/60;
 if(f.k=='stink'){if(!G.push)d.vx=0}
 else if(f.k=='bubble'){const top=Math.max(GY-210,40);d.vy=d.y>top?-GRAV-1.1:-GRAV;d.vx=Math.sin(f.ph*2.2)*1.6;const nx=d.x+d.vx;if(groundTop(nx+d.w/2)==null&&groundTop(d.x+d.w/2)!=null)d.vx=0}
 else if(f.k=='pogo'){if(d.on){d.vy=JV*.75;VIS.play('boing',.25)}}}
// one big screen-fixed banner below the HUD, always fully inside the view
function silBanner(t,bg,fg,a,k){const bz=Math.round(Math.max(18,Math.min(30,VW/18))*k);ctx.save();ctx.font='bold '+bz+'px "Courier New",monospace';let tw=ctx.measureText(t).width;const pad=12,bw=Math.min(VW-16,tw+pad*2),bh=bz+pad*1.4;
 const bx=G.camX+(VW-bw)/2,by=WY+(OY>0?0:96/S)+4+Math.sin(G.el*10)*2;ctx.globalAlpha=.85+.15*a;ctx.fillStyle=bg;ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect?ctx.roundRect(bx,by,bw,bh,10):ctx.rect(bx,by,bw,bh);ctx.fill();ctx.stroke();ctx.restore();G.silBot=by+bh+4;
 pxText(t,bx+bw/2,by+pad*.7,tw>bw-pad*2?Math.floor(bz*(bw-pad*2)/tw):bz,fg,'center')}
function sillyDraw(){const s=G.sil;G.silBot=0;if(!s||!(s.warn>0||s.fx))return;const d=G.d,cx=d.x+d.w/2,cy=d.y+d.h/2;
 // friendly cartoon human at the screen edge: round face, big smile, cap
 const mx=s.side<0?G.camX+24:G.camX+VW-44,gt=groundTop(mx+10),my=(gt==null?GY:gt)-46,bob=Math.sin(G.el*8)*2;
 ctx.save();ctx.fillStyle='#42a5f5';ctx.fillRect(mx+4,my+20+bob,14,18);ctx.fillStyle='#5d4037';ctx.fillRect(mx+5,my+38,5,8);ctx.fillRect(mx+12,my+38,5,8);
 ctx.fillStyle='#ffcc80';ctx.beginPath();ctx.arc(mx+11,my+12+bob,9,0,6.283);ctx.fill();ctx.fillStyle='#e53935';ctx.fillRect(mx+2,my+2+bob,18,5);
 ctx.fillStyle='#000';ctx.fillRect(mx+7,my+10+bob,2,2);ctx.fillRect(mx+13,my+10+bob,2,2);ctx.strokeStyle='#000';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(mx+11,my+14+bob,4,.2,2.9);ctx.stroke();
 ctx.fillStyle='#ffcc80';const ax=s.side<0?mx+18:mx-4;ctx.fillRect(ax,my+22+bob+(s.warn>0?Math.sin(G.el*14)*3:0),8,4);ctx.restore();
 if(s.warn>0){const k=s.k,ic={stink:'💨',bubble:'🫧',pogo:'🦘'}[k];const a=.5+.5*Math.sin(G.el*12);ctx.save();ctx.globalAlpha=.4+.4*a;ctx.strokeStyle='#ffeb3b';ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy,30+a*6,0,6.283);ctx.stroke();ctx.restore();
  
  // one big banner, screen-fixed below the HUD, clamped inside the view
  silBanner(ic+' SILLY HUMAN! '+ic,'#e53935','#ffeb3b',a,1);
  // bouncing arrow over the human so it is clear where the trick comes from
  const ay=my-26+Math.sin(G.el*12)*4;ctx.save();ctx.fillStyle='#ffeb3b';ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(mx+11,ay+16);ctx.lineTo(mx+1,ay);ctx.lineTo(mx+21,ay);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();return}
 const f=s.fx,ic2={stink:'💨',bubble:'🫧',pogo:'🦘'}[f.k];silBanner(ic2+' '+SIL.say[f.k]+' '+ic2,'#2e7d32','#fff',1,.75);if(f.k=='stink'){ctx.save();for(let i=0;i<5;i++){const a=G.el*2+i*1.25;ctx.globalAlpha=.45;ctx.fillStyle=i%2?'#9ccc65':'#7cb342';ctx.beginPath();ctx.arc(cx+Math.cos(a)*20,cy+Math.sin(a)*12,11,0,6.283);ctx.fill()}ctx.restore()}
 else if(f.k=='bubble'){ctx.save();const r=Math.max(d.w,d.h)*.8+Math.sin(G.el*6)*2;ctx.globalAlpha=.35;ctx.fillStyle='#b3e5fc';ctx.beginPath();ctx.arc(cx,cy,r,0,6.283);ctx.fill();ctx.globalAlpha=.9;ctx.strokeStyle='#e1f5fe';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(cx-r*.4,cy-r*.45,4,0,6.283);ctx.fill();ctx.restore()}
 else if(f.k=='pogo'){ctx.save();ctx.strokeStyle='#ff7043';ctx.lineWidth=3;ctx.beginPath();const by=d.y+d.h;for(let i=0;i<5;i++){ctx.lineTo(cx+(i%2?-6:6),by+i*3)}ctx.stroke();ctx.restore()}}
window.__dc={DMUL,Dx,Dbase,DK,rampP,thrCfg,SIL,sillyStart,sillyUpd,BIG_SPD,BIG_CHANCE,poof,msg,useAtk,ITEMS,THROW,hurt,say,loadTop,insertTop,qualifies,topBest,showEnd,readLines,pickVoice,stageOf,STAGES:{FAT_AT,ROLL_AT,FAT_SPD,FAT_JMP,ROLL_JMP,ROLL_MAX,ROLL_ACC,ROLL_FRIC,ROLL_CAP},get G(){return G},get CHALLENGES(){return CHALLENGES},CRIT,get diff(){return diff},get ORDER(){return ORDER},loseLife,respawn,safeSpot,enterBonus,exitBonus,askCont,contYes,contNo,mystery,breakBrick,BOSSES,NBOSS,ARCH,bossHP,bossSpd,saveRun,loadRun,clearRun,champion,bossesBeat,GOOD,BAD,start,startChallenge,startBoss,enterBonus,exitBonus,UNL,usePower,erupt,cap,genSection,groundTop,get unl(){return unl},get pick(){return pick},consts:{T,GY,JV,GRAV,SPD,SEC_L},secLen,get view(){return {S,VW,VH,WY,OY,ZK,AW:AW()}}};

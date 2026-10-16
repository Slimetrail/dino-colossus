'use strict';
// ===== Dino Colossus: 2D side-scrolling platformer =====
const cv=document.getElementById('c'),ctx=cv.getContext('2d'),$=id=>document.getElementById(id);
const T=30,GY=360,GRAV=.5,JV=-11,SPD=3.5,SEC_L=3000,CROWD=30,MAXB=8;
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
let W,H,S,VW,VH,OY,portrait;
function layout(){W=cv.width=innerWidth;H=cv.height=innerHeight;portrait=H>W;const hud=44,ctrl=portrait?150:0;
 VH=420;if(portrait){S=W/448;OY=Math.max(hud,(H-ctrl-VH*S)/2)}else{S=H/420;OY=0}VW=W/S;
 if(!portrait){['bl','br','bj','bp'].forEach(i=>$(i).style.opacity=.55)}}
layout();addEventListener('resize',layout);
// ---- persistent ----
const LS=localStorage;let best=+LS.dinoColossus_Best||0,snd=LS.dinoColossus_Snd!=='0',pick=+LS.dinoColossus_Dino||0,gems=+LS.dinoColossus_Diamonds||0;
let unl=JSON.parse(LS.dinoColossus_Unlocks||'{}'),stats=JSON.parse(LS.dinoColossus_Stats||'{"eaten":0,"erupts":0}');
const POWERS={speed:{e:'⚡',n:'Speed Boost',how:'eat 25 people (total)'},big:{e:'🍔',n:'Big Belly',how:'do 4 volcano eruptions (total)'},flame:{e:'🔥',n:'Flame Breath',how:'collect 5 💎 or beat the first boss'}};
// ---- sound ----
let AC;function ac(){return AC=AC||new (window.AudioContext||window.webkitAudioContext)()}
function beep(f,d=.12,t='square',s=0,v=.08){if(!snd)return;try{const a=ac(),o=a.createOscillator(),g=a.createGain();o.type=t;o.frequency.value=f;if(s)o.frequency.linearRampToValueAtTime(s,a.currentTime+d);g.gain.value=v;g.gain.linearRampToValueAtTime(0,a.currentTime+d);o.connect(g).connect(a.destination);o.start();o.stop(a.currentTime+d)}catch(e){}}
function boomSnd(n){if(!snd)return;try{const a=ac(),t=a.currentTime,o=a.createOscillator(),g=a.createGain();o.frequency.setValueAtTime(90,t);o.frequency.exponentialRampToValueAtTime(28,t+1);g.gain.setValueAtTime(.35+n*.02,t);g.gain.exponentialRampToValueAtTime(.001,t+1.1);o.connect(g).connect(a.destination);o.start();o.stop(t+1.1);
 const b=a.createBuffer(1,a.sampleRate*.9,a.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2);const ns=a.createBufferSource(),f=a.createBiquadFilter(),ng=a.createGain();f.type='lowpass';f.frequency.value=600;ng.gain.value=.3;ns.buffer=b;ns.connect(f).connect(ng).connect(a.destination);ns.start()}catch(e){}
 setTimeout(()=>beep(300,.45,'sine',1500),250);setTimeout(()=>beep(1500,.12,'sine',200),700);setTimeout(()=>{beep(90,.5,'sawtooth',60);beep(95,.5,'square',55)},820)}
function barfSnd(){beep(220,.5,'sawtooth',70);setTimeout(()=>beep(160,.25,'square',300),250)}
// ---- input ----
const keys={},btn={};addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=1;if([' ','arrowup','arrowdown'].includes(e.key.toLowerCase()))e.preventDefault()});addEventListener('keyup',e=>keys[e.key.toLowerCase()]=0);
[['bl','l'],['br','r'],['bj','j']].forEach(([id,k])=>{const b=$(id);b.addEventListener('pointerdown',e=>{e.preventDefault();btn[k]=1});['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>btn[k]=0))});
$('bp').addEventListener('pointerdown',e=>{e.preventDefault();usePower()});
$('bs').onclick=()=>{const ks=Object.keys(POWERS).filter(k=>unl[k]);if(ks.length){G.pwSel=ks[(ks.indexOf(G.pwSel)+1)%ks.length];updPw()}};
$('snd').onclick=()=>{snd=!snd;LS.dinoColossus_Snd=snd?1:0;$('snd').textContent=snd?'🔊':'🔇'};$('snd').textContent=snd?'🔊':'🔇';
// ---- menu ----
function renderPick(){$('dinos').innerHTML=DINOS.map((d,i)=>'<button data-i="'+i+'" style="border-color:'+(i==pick?'#fff':'transparent')+'"><img src="'+SPR.dino[i][0].toDataURL()+'" width="40" height="40" style="image-rendering:pixelated;display:block"></button>').join('');$('dname').textContent=DINOS[pick].n+' · '+DINOS[pick].t+(DINOS[pick].t=='Carnivore'?' (can eat little dinos)':' (stomps little dinos)');$('dinos').querySelectorAll('button').forEach(b=>b.onclick=()=>{pick=+b.dataset.i;LS.dinoColossus_Dino=pick;renderPick()})}
function showPowers(){$('powers').innerHTML=Object.entries(POWERS).map(([k,p])=>'<div>'+(unl[k]?p.e+' <b>'+p.n+'</b> ✅ unlocked':'🔒 '+p.n+': '+p.how)+'</div>').join('')}
renderPick();showPowers();$('best').textContent=best;
$('go').onclick=start;$('again').onclick=start;$('howb').onclick=()=>{showPowers();$('how').classList.remove('hide')};$('howx').onclick=()=>$('how').classList.add('hide');
$('menu').onclick=()=>{$('end').classList.add('hide');$('start').classList.remove('hide');$('best').textContent=best};
// ---- world ----
let G={running:false};
const carn=()=>DINOS[pick].t=='Carnivore';
const ov=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
function near(x){return G.solids.filter(s=>s.x<x+300&&s.x+s.w>x-300)}
function moveBody(b){b.hitWall=0;b.bonk=null;const ss=near(b.x);b.x+=b.vx;for(const s of ss)if(ov(b,s)){if(b.vx>0)b.x=s.x-b.w;else if(b.vx<0)b.x=s.x+s.w;b.hitWall=1}
 b.vy=Math.min(b.vy+GRAV,12);b.y+=b.vy;b.on=null;for(const s of ss)if(ov(b,s)){if(b.vy>0){b.y=s.y-b.h;b.vy=0;b.on=s}else{b.y=s.y+s.h;b.vy=0;b.bonk=s}}}
function groundTop(x){let t=null;for(const s of G.solids)if(s.k=='g'||s.k=='arena'){if(x>=s.x&&x<=s.x+s.w&&(t==null||s.y<t))t=s.y}return t}
function solidBelow(x,y){return G.solids.some(s=>x>=s.x&&x<=s.x+s.w&&y>=s.y-2&&y<=s.y+8)}
function addGround(x,w,top){G.solids.push({x,y:top,w,h:800,k:'g'})}
function genSection(n,x0){let b;do{b=pickA(BIOMES)}while(G.lastBiome&&b.n==G.lastBiome);G.lastBiome=b.n;
 const sec={n,x0,L:SEC_L,biome:b,goal:3+Math.min(5,n>>1),ate:0,pits:[],steps:[]};let x=x0,lastTop=GY;const end=x0+SEC_L,diff=Math.min(1,n/8);
 const flat=w=>{addGround(x,w,GY);const g={x,w,top:GY};x+=w;lastTop=GY;return g},grounds=[],vols=[x0+R(.4,.55)*SEC_L];let cracked=n>1&&Math.random()<.55;
 grounds.push(flat(n==1?T*14:T*6));
 while(x<end-T*16){
  if(vols.length&&x>=vols[0]){vols.shift();const g=flat(T*10);G.vols.push({x:g.x+T*3,y:GY,w:T*4});continue}
  const r=Math.random();
  if(r<.22+diff*.1){const w=T*(Math.random()<.3+diff*.4?3:2);sec.pits.push({x,w});x+=w;grounds.push(flat(T*RI(3,5)))}
  else if(r<.42){const h=pickA([30,60]),w=T*RI(4,7);addGround(x,w,GY-h);sec.steps.push({x,w,h});grounds.push({x,w,top:GY-h});x+=w;grounds.push(flat(T*RI(3,5)))}
  else if(r<.62){const g=flat(T*8);G.solids.push({x:g.x+T*2,y:GY-110,w:T*RI(3,4),h:18,k:'p'});grounds.push(g);grounds.push({x:g.x+T*2,w:T*3,top:GY-110})}
  else if(r<.8){const g=flat(T*7);grounds.push(g);for(let i=0;i<3;i++){const k=cracked&&i==1?'cr':(i==1?'q':'brick');if(k=='cr')cracked=false;G.solids.push({x:g.x+T*2+i*T,y:GY-120,w:T,h:T,k,item:null})}}
  else if(r<.9){const g=flat(T*7);grounds.push(g);const hh=pickA([60,90]),kind=pickA(['log','stump','pillar']);G.solids.push({x:g.x+T*3,y:GY-hh,w:T*2,h:hh,k:kind});sec.steps.push({x:g.x+T*3,w:T*2,h:hh,obst:1})}
  else grounds.push(flat(T*RI(5,9)));}
 {const g=flat(end-x+T);grounds.push(g);G.vols.push({x:end-T*9,y:GY,w:T*4,end:1,sec:n})}
 const gs=grounds.filter(g=>g.w>=T*2&&g.x>x0+(n==1?T*6:0));
 const onG=(w,h)=>{const g=pickA(gs);return {x:R(g.x+4,g.x+g.w-w-4),y:g.top-h}};
 for(let i=0;i<CROWD;i++){const p=onG(18,26);G.people.push({...p,w:18,h:26,vx:0,vy:0,e:pickA(PEOPLE),v:RI(0,5)})}
 for(let i=0;i<5+Math.min(6,n);i++){const p=onG(26,22);G.littles.push({...p,w:26,h:22,vx:-.8,vy:0})}
 for(let i=0;i<Math.min(5,1+(n>>1));i++){const p=onG(24,34);if(p.x>x0+T*12)G.rangers.push({...p,w:24,h:34,vx:.8,vy:0,stun:0})}
 for(let i=0;i<6;i++){const g=pickA(gs);G.pel.push({x:R(g.x+10,g.x+g.w-10),y:g.top-70})}
 if(Math.random()<.35){const g=pickA(gs);G.gemsW.push({x:g.x+g.w/2,y:g.top-60})}
 for(let i=0;i<16;i++)G.deco.push({x:R(x0,end),e:pickA(b.d),s:pickA([2,3])});for(let i=0;i<3;i++){const gg=pickA(gs.filter(q=>q.top==GY&&q.w>=T*4)||gs);if(gg)G.deco.push({x:gg.x+R(10,gg.w-60),e:pickA(['hut','fire','hut']),s:3,front:1})}
 G.secs.push(sec);return sec}
function curSec(x){for(let i=G.secs.length-1;i>=0;i--)if(x>=G.secs[i].x0)return G.secs[i];return G.secs[0]}
function start(){G={running:true,score:0,hearts:3,belly:0,bv:0,jig:0,eaten:0,grow:1,erupts:0,bossN:0,boss:null,solids:[],people:[],littles:[],rangers:[],boulders:[],vols:[],pel:[],gemsW:[],deco:[],portals:[],secs:[],fly:[],toss:[],parts:[],goo:[],smoke:[],msgs:[],waves:[],meteors:[],lava:[],rival:null,ch:null,chN:0,chT:14,banner:null,secBanner:null,shake:0,flash:0,burst:null,hit:0,dash:0,charge:0,pwSel:null,pwOn:0,pwKind:null,flame:0,bigSec:-1,dayT:0,el:0,boulT:5,camX:0,cur:1,inBonus:0,lastBiome:null,lastSafe:{x:60,y:GY-40},trail:[]};
 G.d={x:60,y:GY-40,w:34,h:36,vx:0,vy:0,f:1,on:null};genSection(1,0);genSection(2,SEC_L);G.cur=0;
 ['start','end','how'].forEach(i=>$(i).classList.add('hide'));enterSec(G.secs[0]);hud();updPw();beep(440,.1);beep(660,.15)}
function enterSec(s){G.cur=s.n;G.secBanner={t:'SECTION '+s.n+' · '+s.biome.n,l:2.4};const p=G.secs.find(q=>q.n==s.n-1);if(p&&carn()&&p.ate>=p.goal){G.score+=200;msg('Dino goal met! +200',G.d.x,G.d.y-60,'#ffea00')}hud()}
const cap=()=>(MAXB+Math.min(4,Math.floor(G.eaten/15)))*(G.bigSec===G.cur?2:1);
function hud(){$('score').textContent=G.score;$('hearts').textContent=G.hearts>5?'❤️x'+G.hearts:'❤️'.repeat(Math.max(0,G.hearts));$('belly').textContent='😋'+G.belly+'/'+cap();const s=curSec(G.d.x);$('goal').textContent=carn()?'🦎'+s.ate+'/'+s.goal:'';$('gems').textContent=gems;$('sec').textContent=G.inBonus?'★':G.cur}
function msg(t,x,y,c='#fff'){G.msgs.push({t,x,y,l:1,c})}
// ---- powers ----
function UNL(k){if(unl[k])return;unl[k]=1;LS.dinoColossus_Unlocks=JSON.stringify(unl);G.banner={t:'🔓 UNLOCKED! '+POWERS[k].e+' '+POWERS[k].n,l:2.5};G.pwSel=k;confetti(G.camX+VW/2,GY-200,50);beep(523,.15);setTimeout(()=>beep(659,.15),150);setTimeout(()=>beep(1046,.35),300);updPw();showPowers()}
function saveStats(){LS.dinoColossus_Stats=JSON.stringify(stats);if(stats.eaten>=25)UNL('speed');if(stats.erupts>=4)UNL('big')}
function updPw(){const ks=Object.keys(POWERS).filter(k=>unl[k]);$('bp').classList.toggle('hide',!ks.length);$('bs').classList.toggle('hide',ks.length<2);if(!ks.length)return;if(!G.pwSel||!unl[G.pwSel])G.pwSel=ks[0];$('bp').innerHTML=POWERS[G.pwSel].e+'<small>'+Math.floor(G.charge)+'%</small>';$('bp').style.filter=G.charge>=100?'none':'grayscale(.6)'}
function usePower(){const k=G.pwSel;if(!G.running||!k||!unl[k]||G.charge<100||G.pwOn)return;G.charge=0;G.pwKind=k;const d=G.d;
 if(k=='speed'){G.pwOn=8;msg('SPEED BOOST!',d.x,d.y-50,'#00e5ff')}else if(k=='big'){G.bigSec=G.cur;G.pwOn=.01;msg('BIG BELLY x2!',d.x,d.y-50,'#00e5ff')}else{G.flame=120;G.pwOn=2;msg('FLAME BREATH!',d.x,d.y-50,'#ff9800');beep(150,1.5,'sawtooth',90)}beep(700,.1,'sine',1400);updPw();hud()}
function confetti(x,y,n){for(let i=0;i<n;i++)G.parts.push({x,y,vx:R(-6,6),vy:R(-9,-2),l:1.3,r:R(3,6),c:pickA(['#f44336','#ffeb3b','#4caf50','#2196f3','#e91e63'])})}
// ---- damage ----
function hurt(why){if(G.hit||!G.running||G.inv)return;G.hearts--;G.hit=70;if(G.belly)dropLoad(true);msg(why,G.d.x,G.d.y-40);for(let i=0;i<8;i++)G.smoke.push({x:G.d.x+17,y:G.d.y+10,vx:R(-1.5,1.5),vy:R(-2,-.5),r:8,l:.8});G.d.vy=-6;beep(200,.3,'triangle',80);hud();if(G.hearts<=0)setTimeout(end,700)}
function dropLoad(silent){if(!G.belly||G.inv)return;const d=G.d;for(let i=0;i<G.belly;i++)G.people.push({x:d.x+R(-30,50),y:d.y-10,w:18,h:26,vx:R(-3,3),vy:R(-6,-3),e:pickA(PEOPLE)});G.belly=0;if(!silent){G.hit=50;msg('Oops! Dropped them!',d.x,d.y-40);beep(200,.3,'triangle',80)}hud()}
function knock(from){G.d.vx=(G.d.x<from.x?-1:1)*7;G.d.vy=-5;G.push=14}
// ---- volcano ----
function erupt(v){const n=G.belly;G.belly=0;hud();const d=G.d,cx=v.x+v.w/2,cy=v.y-95;
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
   if(ov(r,G.d)){if(G.d.vy>0&&G.d.y+G.d.h-r.y<16){r.dizzy=2;G.d.vy=-8;msg('Stomp! Rival drops '+r.ate,r.x,r.y-30,'#ffea00');for(let i=0;i<r.ate;i++)G.people.push({x:r.x+R(-20,40),y:r.y-20,w:18,h:26,vx:R(-3,3),vy:-5,e:pickA(PEOPLE)});c.riv=Math.max(0,c.riv-r.ate);r.ate=0;beep(900,.15,'square',300)}else if(!G.push)knock(r)}},
  finish(c){if(c.you>c.riv){const b=150*c.lvl;G.score+=b;msg('You beat the rival! +'+b,G.d.x,G.d.y-70,'#ffea00')}else msg('Rival wins this time!',G.d.x,G.d.y-70);G.rival=null}},
 lava:{name:'LAVA FLOW!',dur:13,start(c){c.next=1.6;beep(50,1.2,'sawtooth',35);G.shake=25;msg('Rumble rumble…',G.d.x,G.d.y-60,'#ffab40')},update(c){c.next-=1/60;if(c.next<=0){c.next=Math.max(1.6,3.2-c.lvl*.4);G.lava.push({x:G.camX+VW+10,w:Math.min(90,R(36,56)+c.lvl*10),vx:-(1.4+c.lvl*.3),ph:0})}}}
};
const ORDER=['meteor','rival','lava'];
function startChallenge(){const k=ORDER[G.chN%ORDER.length],lvl=1+Math.floor(G.chN/ORDER.length)+Math.floor(G.cur/4);G.chN++;G.ch={k,lvl,t:CHALLENGES[k].dur};G.banner={t:CHALLENGES[k].name,l:1.6};beep(600,.15);setTimeout(()=>beep(600,.15),200);CHALLENGES[k].start(G.ch)}
function endChallenge(){const c=G.ch;if(!c)return;if(CHALLENGES[c.k].finish)CHALLENGES[c.k].finish(c);else{const b=50*c.lvl;G.score+=b;msg('Survived! +'+b,G.d.x,G.d.y-70,'#ffea00');beep(784,.3,'sine',1046)}G.ch=null;G.chT=Math.max(8,16-G.cur);hud()}
// ---- bosses (side-view arenas) ----
const BOSSES=[
 {name:'🦕 BRONTO BOSS',e:'🦕',w:150,h:110,hp:4,init(b){b.x=G.camX+VW-b.w-30;b.y=GY-b.h;b.cd=2;b.step=0},
  act(b){if(b.vuln)return;b.cd-=1/60;b.tele=b.cd<.7;if(b.cd<=0){b.cd=2.6;if(b.step++%2==0){G.shake=18;beep(60,.4,'sawtooth',30);G.waves.push({x:b.x,vx:-4.5,h:22});b.vuln=2.4;b.say='Head down! Jump on it!'}else{G.waves.push({x:b.x,vx:-6.5,h:16,tail:1});msg('Tail sweep! JUMP',b.x,b.y-20)}}}},
 {name:'🦅 PTERO BOSS',e:'🦅',w:90,h:70,hp:4,init(b){b.x=G.camX+VW/2;b.y=GY-300;b.cd=2;b.mode='fly'},
  act(b){b.cd-=1/60;if(b.mode=='fly'){b.x=G.camX+VW/2-45+Math.sin(G.el*1.3)*(VW/2-80);b.y+=(GY-300-b.y)*.1;if(Math.random()<.02){const x=b.x+45,t=groundTop(x);if(t!=null)G.meteors.push({x,y:t,t:0,T:60,rock:1})}b.tele=b.cd<.7;if(b.cd<=0){b.mode='dive';b.tx=G.d.x-20;b.cd=1.1}}
   else if(b.mode=='dive'){b.x+=(b.tx-b.x)*.08;b.y+=(GY-b.h-b.y)*.08;if(b.cd<=0){b.mode='rest';b.y=GY-b.h;b.vuln=2.6;b.say='Resting! Jump on it!';b.cd=2.6}}
   else if(!b.vuln){b.y-=4;if(b.y<GY-280){b.mode='fly';b.cd=2.4}}}},
 {name:'🦖 T-REX BOSS',e:'🦖',w:120,h:110,hp:5,init(b){b.x=G.camX+VW-b.w-20;b.y=GY-b.h;b.cd=2;b.vx=0},
  act(b){if(b.vuln)return;if(b.vx){b.x+=b.vx;const L=G.camX+4,Rr=G.camX+VW-b.w-4;if(b.x<L||b.x>Rr){b.x=Math.max(L,Math.min(Rr,b.x));b.vx=0;G.shake=15;beep(70,.3,'square',40);b.vuln=2.6;b.say='Dizzy! Jump on its head!'}return}
   b.cd-=1/60;b.tele=b.cd<.8;if(b.cd<=0){if(Math.random()<.35){msg('ROAAAR!',b.x+60,b.y-20,'#ff5252');beep(110,.6,'sawtooth',60);G.d.vx=Math.sign(G.d.x-b.x)*10;G.push=20;b.cd=1.5}else{b.vx=Math.sign(G.d.x-b.x)*7.5;b.cd=2.2}}}}];
function startBoss(){if(!G.running||G.boss||G.inBonus)return;const T0=BOSSES[G.bossN%3];G.bossN++;G.ch=null;G.rival=null;G.lava=[];G.meteors=[];
 G.arena=[{x:G.camX-40,y:GY,w:VW+80,h:800,k:'arena'},{x:G.camX-30,y:GY-900,w:30,h:900,k:'wall'},{x:G.camX+VW,y:GY-900,w:30,h:900,k:'wall'}];G.solids.push(...G.arena);
 G.solids=G.solids.filter(s=>!(s.k!='arena'&&s.k!='wall'&&s.x<G.camX+VW&&s.x+s.w>G.camX&&s.y<GY));if(G.d.y>GY-G.d.h)G.d.y=GY-G.d.h-2;
 const b={T:T0,w:T0.w,h:T0.h,hp:T0.hp+Math.floor((G.bossN-1)/3),vuln:0,bonked:0,say:''};b.max=b.hp;T0.init(b);G.boss=b;G.banner={t:T0.name+'!',l:2};beep(300,.2);setTimeout(()=>beep(200,.4),200)}
function updBoss(){const b=G.boss,d=G.d;if(b.gone){b.x+=7;b.y-=2;if(b.x>G.camX+VW+200){G.boss=null;G.solids=G.solids.filter(s=>!G.arena.includes(s));G.arena=null}return}
 b.T.act(b);if(b.vuln){b.vuln-=1/60;if(b.vuln<=0){b.vuln=0;b.bonked=0;b.say=''}}
 if(ov(d,b)){const top=d.vy>0&&d.y+d.h-b.y<20;if(top){d.vy=-9;if(b.vuln&&!b.bonked)hitBoss(b,'BONK!');else msg('Boing!',b.x+b.w/2,b.y-10)}else if(!b.vuln&&!G.hit){hurt('Ouch!');knock({x:b.x+b.w/2})}}}
function hitBoss(b,t){b.bonked=1;b.hp--;b.vuln=Math.min(b.vuln||.5,.5);G.shake=10;beep(900,.15,'square',300);msg(t,b.x+b.w/2,b.y-20,'#ffea00');
 if(b.hp<=0){b.gone=1;b.vuln=0;const pts=500*G.bossN;G.score+=pts;msg('Boss beaten! +'+pts,G.d.x,G.d.y-80,'#ffea00');b.say='💫 dizzy!';UNL('flame');beep(523,.2);setTimeout(()=>beep(784,.2),200);setTimeout(()=>beep(1046,.4),400);hud()}}
// ---- bonus room ----
function enterBonus(){if(G.inBonus||G.boss)return;const keep=['solids','people','littles','rangers','boulders','vols','pel','gemsW','deco','portals'];G.saved={camX:G.camX,dx:G.d.x,dy:G.d.y,ch:G.ch,rival:G.rival};keep.forEach(k=>G.saved[k]=G[k]);
 G.inBonus=1;G.bonusT=12;G.ch=null;G.rival=null;G.lava=[];G.meteors=[];const X=-5000,w=Math.max(VW,420);G.camX=X;
 G.solids=[{x:X-30,y:GY,w:w+60,h:800,k:'g'},{x:X-30,y:GY-900,w:30,h:900,k:'wall'},{x:X+w,y:GY-900,w:30,h:900,k:'wall'},{x:X+60,y:GY-110,w:T*3,h:18,k:'p'},{x:X+w-150,y:GY-110,w:T*3,h:18,k:'p'}];
 G.people=Array.from({length:40},()=>({x:R(X+20,X+w-40),y:GY-26,w:18,h:26,vx:0,vy:0,e:pickA(PEOPLE)}));G.littles=[];G.rangers=[];G.boulders=[];G.vols=[];G.portals=[];G.deco=[];
 G.pel=Array.from({length:6},()=>({x:R(X+30,X+w-30),y:GY-R(60,170)}));G.gemsW=[{x:X+w/2,y:GY-150}];G.d.x=X+30;G.d.y=GY-60;G.d.vx=G.d.vy=0;
 G.banner={t:'🤫 SECRET BONUS ROOM!',l:2};beep(880,.1);setTimeout(()=>beep(1175,.2),120);hud()}
function exitBonus(){const s=G.saved;Object.assign(G,{solids:s.solids,people:s.people,littles:s.littles,rangers:s.rangers,boulders:s.boulders,vols:s.vols,pel:s.pel,gemsW:s.gemsW,deco:s.deco,portals:s.portals,camX:s.camX});G.d.x=s.dx;G.d.y=s.dy-40;G.d.vy=0;G.inBonus=0;G.chT=8;msg('Back to the run!',G.d.x,G.d.y-40,'#ffea00');hud()}
// ---- update ----
function update(){const d=G.d;G.el+=1/60;G.dayT+=1/60;
 let L=keys.arrowleft||keys.a||btn.l,Rt=keys.arrowright||keys.d||btn.r;if(G.rev){G.rev--;[L,Rt]=[Rt,L]}if(G.inv)G.inv--;if(G.shrink)G.shrink--;const J=keys[' ']||keys.arrowup||keys.w||btn.j;
 const sp=SPD*(G.pwKind=='speed'?1.6:1)*(G.dash?1.9:1)*(1-.2*Math.max(0,G.belly/cap()-.6));
 if(G.push){G.push--;d.vx*=.92}else d.vx=(Rt?sp:0)-(L?sp:0);if(d.vx)d.f=d.vx<0?-1:1;
 if(J&&d.on&&!G.jumpHeld){d.vy=JV*(G.dash?1.08:1)*(G.shrink?.85:1);beep(500,.1,'sine',900)}G.jumpHeld=J;if(!J&&d.vy<-4)d.vy=-4;
 {const gs=G.grow*(G.shrink?.65:1),nh=36*gs;d.y+=d.h-nh;d.w=34*gs;d.h=nh}moveBody(d);if(d.x<G.camX)d.x=G.camX;
 if(d.bonk){const b=d.bonk;if(b.k=='q'){b.k='used';mystery(b)}else if(b.k=='cr'){G.solids.splice(G.solids.indexOf(b),1);for(let i=0;i<10;i++)G.parts.push({x:b.x+15,y:b.y+15,vx:R(-3,3),vy:R(-6,-1),l:.9,r:5,c:'#a1887f'});G.portals.push({x:b.x,y:b.y-T,w:T,h:T});msg('A secret door!',b.x,b.y-40,'#e1bee7');beep(400,.3,'sine',1200)}}
 if(d.on&&(d.on.k=='g')&&!G.inBonus)G.lastSafe={x:d.x,y:d.y};
 if(d.y>GY+24&&!G.inBonus&&!G.arena){for(let i=0;i<10;i++)G.parts.push({x:d.x+17,y:GY+20,vx:R(-3,3),vy:R(-7,-3),l:.8,r:4,c:pickA(['#ff6d00','#ffea00'])});G.hit=0;hurt('Lava! Hot hot!');d.x=Math.max(G.camX+10,G.lastSafe.x-10);d.y=G.lastSafe.y-30;d.vy=0;d.vx=0}
 if(d.y>GY+260){hurt('Fell in a pit!');d.x=Math.max(G.camX+10,G.lastSafe.x-10);d.y=G.lastSafe.y-30;d.vy=0;d.vx=0}
 // camera
 if(!G.boss&&!G.inBonus)G.camX=Math.max(G.camX,d.x-VW*.4);
 // sections
 if(!G.inBonus){const s=curSec(d.x);if(s.n!=G.cur)enterSec(s);const last=G.secs[G.secs.length-1];if(d.x>last.x0-SEC_L*.5)genSection(last.n+1,last.x0+SEC_L);
  if(G.secs.length>4){const old=G.secs.shift();const cut=old.x0+SEC_L;G.huts=(G.huts||[]).filter(o=>o.x>cut);G.solids=G.solids.filter(s=>s.x+s.w>cut-50||s.k=='arena'||s.k=='wall');['people','littles','rangers','pel','gemsW','deco','vols'].forEach(k=>G[k]=G[k].filter(o=>o.x>cut-50))}}
 // belly anim, timers
 G.bv+=(G.belly/cap()-G.bv)*.12;G.jig=Math.max(0,G.jig-.03);if(G.hit)G.hit--;if(G.dash)G.dash--;
 if(G.pwKind=='speed'||G.dash)G.trail.push({x:d.x,y:d.y,l:1});G.trail=G.trail.filter(t=>(t.l-=.07)>0);
 if(G.pwOn>0){G.pwOn-=1/60;if(G.pwOn<=0){G.pwOn=0;G.pwKind=null;updPw()}}if(keys.e)usePower();
 // people
 const vis=o=>o.x>G.camX-200&&o.x<G.camX+VW+200;
 for(const p of G.people){if(!vis(p))continue;const dx=p.x-d.x;if(Math.abs(dx)<150&&Math.abs(p.y-d.y)<120)p.vx=Math.sign(dx||1)*1.9;else if(Math.random()<.01)p.vx=pickA([-.6,0,.6]);
  if(p.on){const ax=p.x+(p.vx>0?p.w+2:-2);if(!solidBelow(ax,p.y+p.h+2)){p.vx=-p.vx*.5}}if(p.vy<0||!p.on||p.vx)moveBody(p);if(p.hitWall)p.vx=-p.vx;if(p.smoky)p.smoky--}
 G.people=G.people.filter(p=>p.y<GY+300);
 for(let i=G.people.length-1;i>=0;i--){const p=G.people[i];if(G.belly<cap()&&!G.hit&&ov(d,p)){G.people.splice(i,1);eat();if(G.ch&&G.ch.k=='rival')G.ch.you++;msg('Gulp!',d.x+17,d.y-10)}}
 // little dinos (goombas)
 for(let i=G.littles.length-1;i>=0;i--){const l=G.littles[i];if(!vis(l))continue;if(l.on){const ax=l.x+(l.vx>0?l.w+2:-2);if(!solidBelow(ax,l.y+l.h+2))l.vx=-l.vx}moveBody(l);if(l.hitWall)l.vx=-l.vx;if(l.y>GY+300){G.littles.splice(i,1);continue}
  if(ov(d,l)&&!G.hit){if(d.vy>0&&d.y+d.h-l.y<16){G.littles.splice(i,1);d.vy=-7;G.score+=20;msg('Stomp! +20',l.x,l.y-10,'#fff');squash(l);beep(700,.08,'square',200);hud()}
   else if(carn()){G.littles.splice(i,1);const s=curSec(l.x);s.ate++;if(G.belly<cap())eat();else hud();msg('Chomp! 🦎',l.x,l.y-10,'#c6ff00');if(s.ate==s.goal){msg('Dino goal done! ✅',d.x,d.y-60,'#ffea00');beep(784,.2)}}
   else{knock(l);G.hit=30;msg('Bonk! (stomp it!)',d.x,d.y-30)}}}
 // rangers
 for(const r of G.rangers){if(!vis(r))continue;if(r.stun){r.stun--;r.vx=0}else{const dx=d.x-r.x;if(G.belly&&Math.abs(dx)<260)r.vx=Math.sign(dx)*1.5;else if(!r.vx||Math.random()<.005)r.vx=pickA([-.8,.8]);if(r.on){const ax=r.x+(r.vx>0?r.w+2:-2);if(!solidBelow(ax,r.y+r.h+2))r.vx=-r.vx}}moveBody(r);if(r.hitWall)r.vx=-r.vx;
  if(ov(d,r)&&!G.hit){if(d.vy>0&&d.y+d.h-r.y<18){r.stun=200;d.vy=-8;msg('Zonked! 💫',r.x,r.y-10);beep(600,.1)}else if(!r.stun){if(G.belly)dropLoad();else G.hit=30;knock(r)}}}
 G.rangers=G.rangers.filter(r=>r.y<GY+300);
 // boulders
 if(!G.boss&&!G.inBonus&&(G.boulT-=1/60)<=0){G.boulT=R(6,10)-Math.min(3,G.cur*.3);const x=G.camX+VW+20,t=groundTop(x);if(t!=null)G.boulders.push({x,y:t-28,w:28,h:28,vx:-2.6,vy:0,a:0})}
 G.boulders=G.boulders.filter(b=>{b.vx=-2.6;moveBody(b);b.a-=.09;if(b.hitWall){b.vy=-7;b.x-=2}if(ov(d,b)&&!G.hit){if(G.belly)dropLoad();else G.hit=30;knock(b)}return b.y<GY+300&&b.x>G.camX-80});
 // volcano
 for(const v of G.vols){if(!G.busyVol&&d.on&&d.x+d.w>v.x&&d.x<v.x+v.w){if(v.end&&!v.done){v.done=1;const n=G.belly,bonus=100*v.sec+n*50;G.score+=bonus;G.banner={t:'SECTION '+v.sec+' CLEAR! +'+bonus,l:2.4};G.chT=Math.max(G.chT,6);if(n)erupt(v);else{G.belly=0;boom(0,v)}beep(784,.15);setTimeout(()=>beep(1046,.3),160)}else if(G.belly&&!v.end)erupt(v)}}
 // pickups
 G.pel=G.pel.filter(p=>{if(Math.abs(p.x-d.x-d.w/2)<d.w/2+10&&Math.abs(p.y-d.y-d.h/2)<d.h/2+10){G.dash=70;beep(1200,.25,'sawtooth',300);msg('DASH!',d.x,d.y-30,'#fff59d');return false}return true});
 G.gemsW=G.gemsW.filter(g=>{if(Math.abs(g.x-d.x-d.w/2)<d.w/2+12&&Math.abs(g.y-d.y-d.h/2)<d.h/2+14){gems++;LS.dinoColossus_Diamonds=gems;G.score+=100;msg('💎 +1 ('+gems+')',d.x,d.y-40,'#80deea');beep(1320,.1);setTimeout(()=>beep(1760,.2),100);if(gems>=5)UNL('flame');hud();return false}return true});
 for(const p of G.portals)if(ov(d,p)){G.portals.splice(G.portals.indexOf(p),1);enterBonus();break}
 if(G.inBonus&&(G.bonusT-=1/60)<=0){const b=G.belly;exitBonus()}
 // flame breath
 if(G.flame>0){G.flame--;const fx=d.x+(d.f>0?d.w:0);for(let i=0;i<2;i++)G.parts.push({x:fx,y:d.y+10,vx:d.f*R(6,10),vy:R(-1.2,1.2),l:.6,r:R(5,10),c:pickA(['#ff6d00','#ffea00','#ff3d00'])});
  const inF=o=>{const dx=(o.x+(o.w||0)/2-(d.x+d.w/2))*d.f;return dx>0&&dx<170+d.w&&o.y<d.y+d.h+10&&o.y+(o.h||20)>d.y-30};
  G.rangers.forEach(r=>{if(inF(r)&&!r.stun){r.stun=240;msg('💫 Zonked!',r.x,r.y-10)}});
  for(let i=G.littles.length-1;i>=0;i--)if(inF(G.littles[i])){squash(G.littles[i]);G.littles.splice(i,1);G.score+=20}
  G.people.forEach(p=>{if(inF(p)){p.smoky=150;p.vx=d.f*3}});if(G.rival&&inF(G.rival)&&!(G.rival.dizzy>0))G.rival.dizzy=2.5;
  if(G.boss&&!G.boss.gone&&!G.boss.flamed&&inF(G.boss)){G.boss.flamed=1;hitBoss(G.boss,'Toasty! 🔥')}}else if(G.boss)G.boss.flamed=0;
 // challenges / boss
 if(G.boss)updBoss();else if(!G.inBonus){if(G.ch){G.ch.t-=1/60;CHALLENGES[G.ch.k].update(G.ch);if(G.ch&&G.ch.t<=0)endChallenge()}else if((G.chT-=1/60)<=0&&G.d.x>400)startChallenge()}
 G.meteors=G.meteors.filter(m=>{m.t++;if(m.t>=m.T){if(m.mini){if(Math.abs(d.x+d.w/2-m.x)<18+d.w/2&&d.y+d.h>m.y-50)hurt('Bonk! Mini meteor');return false}for(let i=0;i<10;i++)G.parts.push({x:m.x,y:m.y,vx:R(-3,3),vy:R(-5,-1),l:.8,r:R(3,6),c:m.rock?'#8d6e63':'#ff6d00'});beep(90,.2,'triangle',40);if(Math.abs(d.x+d.w/2-m.x)<26+d.w/2&&d.y+d.h>m.y-60)hurt(m.rock?'Bonk! 🪨':'Bonk! ☄️');return false}return true});
 G.lava=G.lava.filter(f=>{f.x+=f.vx;f.ph+=.1;const t=groundTop(f.x+f.w/2);if(t==null)return false;f.y=t;if(d.x+d.w>f.x+4&&d.x<f.x+f.w-4&&d.y+d.h>=t-3&&d.on)hurt('Hot hot! 🔥');return f.x+f.w>G.camX});
 G.waves=G.waves.filter(w=>{w.x+=w.vx;if(d.x+d.w>w.x&&d.x<w.x+20&&d.y+d.h>=GY-w.h&&d.on&&!G.hit)hurt(w.tail?'Swish! Tail!':'Stomp wave!');return w.x>G.camX-30});
 // fx
 G.toss=G.toss.filter(o=>++o.t<30);G.goo=G.goo.filter(g=>{g.x+=g.vx;g.y+=g.vy;g.vy+=.3;g.l-=.025;return g.l>0});
 G.fly=G.fly.filter(f=>{f.x+=f.vx;if(f.vy>0){f.chute=1;f.vy=Math.min(f.vy+.05,1.3);f.vx*=.98}else f.vy+=.35;f.y+=f.vy;const t=groundTop(f.x);if(f.chute&&t!=null&&f.y>=t-26){G.people.push({x:f.x,y:t-26,w:18,h:26,vx:pickA([-1.5,1.5]),vy:0,e:f.e});return false}return f.y<GY+400});
 G.parts=G.parts.filter(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.3;p.l-=.02;return p.l>0});G.smoke=G.smoke.filter(m=>{m.x+=m.vx;m.y+=m.vy;m.r+=.4;m.l-=.008;return m.l>0});
 G.msgs=G.msgs.filter(m=>{m.y-=.7;m.l-=.015;return m.l>0});if(G.shake)G.shake--;if(G.flash)G.flash=Math.max(0,G.flash-.02);
 if(G.burst){const b=G.burst;b.r+=(b.max-b.r)*.15;b.l-=.03;if(b.l<=0)G.burst=null}
 for(const k of['banner','secBanner'])if(G[k]&&(G[k].l-=1/60)<=0)G[k]=null;
 if(G.el%0.25<1/60){$('score').textContent=G.score;updPw()}}
const GOOD=[['DASH PELLET!',b=>G.pel.push({x:b.x+15,y:b.y-30})],['DIAMOND!',b=>G.gemsW.push({x:b.x+15,y:b.y-30})],['+1 HEART!',()=>{G.hearts=Math.min(6,G.hearts+1);hud()}],['FULL BELLY +3!',()=>{for(let i=0;i<3&&G.belly<cap();i++)eat()}],['INVINCIBLE!',()=>{G.inv=360}]];
const BAD=[['SHRINK!',()=>{G.shrink=480}],['BACKWARDS!',()=>{G.rev=300}],['STINKY BURP!',()=>{if(G.belly){G.belly--;G.people.push({x:G.d.x+R(-20,40),y:G.d.y-20,w:18,h:26,vx:R(-2,2),vy:-5,e:pickA(PEOPLE),v:RI(0,5)});hud()}for(let i=0;i<5;i++)G.smoke.push({x:G.d.x+17,y:G.d.y,vx:R(-1,1),vy:-1,r:8,l:.7})}],['MINI METEOR!',()=>{const x=G.d.x+G.d.w/2+G.d.f*R(30,60),t=groundTop(x);if(t!=null)G.meteors.push({x,y:t,t:0,T:90,mini:1})}]];
function mystery(b){const good=Math.random()<.65,[t,f]=pickA(good?GOOD:BAD);f(b);msg(t,b.x+15,b.y-20,good?'#b2ff59':'#ff8a80');if(good){beep(988,.1);setTimeout(()=>beep(1319,.15),90)}else{beep(300,.2,'triangle',150)}G.lastMystery={good,t}}
function eat(){G.belly++;G.eaten++;stats.eaten++;saveStats();G.charge=Math.min(100,G.charge+12);G.jig=1;beep(300+G.belly*60,.08);hud();updPw()}
function squash(o){for(let i=0;i<6;i++)G.parts.push({x:o.x+13,y:o.y+11,vx:R(-2,2),vy:R(-4,-1),l:.6,r:4,c:'#fff'});G.smoke.push({x:o.x+13,y:o.y+10,vx:0,vy:-1,r:10,l:.6})}
function end(){if(!G.running)return;G.running=false;let nb='🏆 Best: '+Math.max(best,G.score);if(G.score>best){best=G.score;LS.dinoColossus_Best=best;nb='🎉 NEW HIGH SCORE! 🎉';confetti(G.camX+VW/2,GY-250,90);beep(523,.15);setTimeout(()=>beep(784,.3),150)}
 $('final').textContent=G.score+' (Section '+G.cur+')';$('nb').textContent=nb;$('best').textContent=best;$('end').classList.remove('hide')}
// ---- draw ----
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
  for(let ty=y;ty<y+90;ty+=T){const off=((ty-y)/T)%2?15:0;for(let tx=x-off;tx<x+s.w;tx+=T){ctx.fillRect(Math.max(x,tx),ty,1+0,T);ctx.fillRect(Math.max(x,tx),ty+T-2,Math.min(T,x+s.w-Math.max(x,tx)),2);ctx.fillRect(Math.max(x,tx)+2,ty+2,3,3)
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
 ctx.save();ctx.beginPath();ctx.rect(0,OY,W,VH*S);ctx.clip();ctx.translate(G.shake?R(-4,4):0,OY+(G.shake?R(-3,3):0));ctx.scale(S,S);
 // flat retro sky (tinted to night)
 ctx.fillStyle=G.inBonus?'#120c08':lerpC(B.sky,'#0b1033',Math.min(1,dk/.42));ctx.fillRect(0,0,VW,VH);
 if(dk>.25){ctx.globalAlpha=(dk-.25)/.17;ctx.fillStyle='#fff';for(let i=0;i<50;i++)ctx.fillRect(Math.round((i*97-G.camX*.05)%VW+VW)%VW,(i*53)%(VH*.5)+30,2,2);ctx.fillStyle='#fff8c4';ctx.fillRect(VW-70,40,18,18);ctx.fillStyle=lerpC(B.sky,'#0b1033',1);ctx.fillRect(VW-64,38,14,14);ctx.globalAlpha=1}
 if(!G.inBonus){for(let i=0;i<6;i++){const cx=((i*230+60)-G.camX*.2)%1380;cloud((cx+1380)%1380-120,40+(i%3)*28,i%2?1.3:1)}
  for(let i=-1;i<6;i++){const hx=i*260-(G.camX*.35)%260;volcanoPx(hx+130,GY,false,0)}
  for(let i=-1;i<8;i++){const hx=i*200-(G.camX*.5)%200;hill(hx+40,GY,i%2?46:70,B.hill)}}
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
 for(const q of G.pel)spr(SPR.pellet,Math.round(q.x-7),Math.round(q.y-7+Math.sin(G.el*6)*2),3);
 for(const gm of G.gemsW)spr(SPR.gem,Math.round(gm.x-10),Math.round(gm.y-10+Math.sin(G.el*5)*3),3);
 const fr=(G.el*8|0)%2;
 for(const q of G.people){if(q.x<G.camX-40||q.x>G.camX+VW+40)continue;spr(SPR.person[q.v||0][q.vx?fr:0],Math.round(q.x-1),Math.round(q.y-0.5),2.2,q.vx<0);if(q.smoky){ctx.fillStyle='#777';ctx.fillRect(q.x+4,q.y-8,6,6);ctx.fillRect(q.x+10,q.y-14,5,5)}}
 for(const l of G.littles){if(l.x<G.camX-40||l.x>G.camX+VW+40)continue;spr(SPR.little[fr],Math.round(l.x-1.5),Math.round(l.y-2),2.4,l.vx>0)}
 for(const r of G.rangers){spr(SPR.ranger,Math.round(r.x),Math.round(r.y-0.5),2.8,r.vx<0);if(r.stun)spr(SPR.star,r.x+4,r.y-14,2);else{const nx=r.x+(r.vx<0?-10:26);ctx.fillStyle='#6d4c2e';ctx.fillRect(nx,r.y-14,3,30);ctx.strokeStyle='#e0d6c0';ctx.lineWidth=1.5;ctx.strokeRect(nx-6,r.y-22,15,12);ctx.beginPath();ctx.moveTo(nx-6,r.y-16);ctx.lineTo(nx+9,r.y-16);ctx.moveTo(nx+1,r.y-22);ctx.lineTo(nx+1,r.y-10);ctx.stroke()}}
 for(const bo of G.boulders){ctx.save();ctx.translate(bo.x+14,bo.y+14);ctx.rotate(Math.round(bo.a/(Math.PI/2))*(Math.PI/2));spr(SPR.boulder,-14,-14,3.5);ctx.restore()}
 if(G.rival){const r=G.rival;spr(SPR.rival[r.vx?fr:0],Math.round(r.x-4),Math.round(r.y-6),2.6,r.f<0);if(r.dizzy>0)spr(SPR.star,r.x+8,r.y-18,2)}
 const b=G.boss;if(b){if(b.tele&&!b.vuln)pxText('!',b.x+b.w/2,b.y-40,30,'#ff1744','center');let c,sc;if(b.T.e=='🦅'){c=SPR.ptero[(G.el*6|0)%2];sc=4.5}else if(b.T.e=='🦕'){c=SPR.bossBronto[b.vuln?0:fr];sc=9.4}else{c=SPR.bossRex[b.vx?fr:0];sc=8}
  const flip=b.T.e=='🦅'?(b.tx!=null&&b.tx<b.x):!(b.vx>0||(b.x<G.d.x&&!b.vx));const wob=(b.vuln||b.gone)?Math.round(Math.sin(G.el*20)*3):0;spr(c,Math.round(b.x+b.w/2-c.width*sc/2+wob),Math.round(b.y+b.h-c.height*sc),sc,flip);
  if(b.vuln||b.gone){for(let i=0;i<3;i++)spr(SPR.star,b.x+b.w/2-30+i*22+Math.sin(G.el*8+i)*6,b.y-14,2.5)}
  if(b.say)pxText(b.say.toUpperCase(),b.x+b.w/2,b.y-34,12,'#fff','center')}
 for(const t of G.trail){ctx.globalAlpha=t.l*.35;spr(SPR.dino[pick][0],t.x-4,t.y-6,2.6*G.grow,G.d.f<0)}ctx.globalAlpha=1;
 const d=G.d;if(!(G.hit&&(G.hit>>2)%2)){const sc=2.6*d.h/36;if(G.inv&&(G.el*10|0)%2){ctx.globalAlpha=.6}spr(SPR.dino[pick][d.vx&&d.on?fr:0],Math.round(d.x+d.w/2-8*sc),Math.round(d.y+d.h-16*sc),sc,d.f<0);
  if(G.bv>.02){const rr=d.h*(.12+.36*G.bv),j=Math.sin(G.el*25)*G.jig*.18,bx=d.x+d.w/2-d.f*3,by=d.y+d.h*.6,pal=DINO_PAL[pick];const rw=Math.round(rr*(1+j)),rh=Math.round(rr*.85*(1-j));ctx.fillStyle='#000';ctx.fillRect(bx-rw-1,by-rh-1,rw*2+2,rh*2+2);ctx.fillStyle=pal.G;ctx.fillRect(bx-rw,by-rh,rw*2,rh*2);ctx.fillStyle=pal.B;ctx.fillRect(bx-rw*.6,by-rh*.5,rw*1.2,rh*1.3)}}
 ctx.globalAlpha=1;if(G.inv)spr(SPR.star,d.x+d.w/2-7,d.y-16,2);if(G.rev)pxText('<>',d.x+d.w/2,d.y-20,12,'#ff8a80','center');
 if(G.flame>0)for(let i=0;i<3;i++)spr(SPR.flame,d.x+(d.f>0?d.w+i*22:-22-i*22),d.y+4+Math.sin(G.el*30+i)*3,2.6,d.f<0);
 for(const m of G.smoke){ctx.globalAlpha=m.l*.7;ctx.fillStyle='#9e9e9e';const r=Math.round(m.r/4)*4;ctx.fillRect(m.x-r,m.y-r,r*2,r*2)}
 if(G.burst){const u=G.burst,r=Math.round(u.r/6)*6;ctx.globalAlpha=Math.max(0,u.l);ctx.fillStyle='#ff6d00';ctx.fillRect(u.x-r,u.y-r*.8,r*2,r*1.6);ctx.fillRect(u.x-r*.8,u.y-r,r*1.6,r*2);ctx.fillStyle='#ffea00';ctx.fillRect(u.x-r*.55,u.y-r*.45,r*1.1,r*.9);ctx.fillRect(u.x-r*.45,u.y-r*.55,r*.9,r*1.1)}ctx.globalAlpha=1;
 for(const o of G.toss){if(o.t<0)continue;const k=o.t/30;spr(SPR.person[0][0],o.x+(o.tx-o.x)*k-8,o.y+(o.ty-o.y)*k-Math.sin(k*Math.PI)*70-12,2)}
 for(const q of G.goo){ctx.globalAlpha=q.l;ctx.fillStyle='#76ff03';const r=Math.round(q.r);ctx.fillRect(q.x-r,q.y-r,r*2,r*2)}
 for(const q of G.parts){ctx.globalAlpha=Math.min(1,q.l);ctx.fillStyle=q.c;const r=Math.round(q.r||5);ctx.fillRect(Math.round(q.x-r),Math.round(q.y-r),r*2,r*2)}ctx.globalAlpha=1;
 for(const f of G.fly){if(f.chute)spr(SPR.chute,f.x-13,f.y-32,3);spr(SPR.person[(f.x|0)%6][0],f.x-9,f.y-13,2.2);if(!f.chute)pxText('WHEEE!',f.x+12,f.y-18,11,'#fff')}
 for(const m of G.msgs){ctx.globalAlpha=Math.max(0,m.l);pxText(m.t.toUpperCase(),m.x,m.y,14,m.c,'center')}ctx.globalAlpha=1;
 ctx.translate(Math.round(G.camX),0);
 if(dk>0){ctx.fillStyle='rgba(10,10,60,'+dk*.6+')';ctx.fillRect(0,0,VW,VH)}
 if(G.flash){ctx.fillStyle='rgba(255,240,200,'+G.flash+')';ctx.fillRect(0,0,VW,VH)}
 // retro HUD
 const hy=10,col=VW/4;pxText('DINO',14,hy,14,'#fff');pxText(String(G.score).padStart(6,'0'),14,hy+16,14,'#fff');
 spr(SPR.gem,col+4,hy+14,2.2);pxText('x'+String(gems).padStart(2,'0'),col+22,hy+16,14,'#fff');
 pxText('SECTION',col*2,hy,14,'#fff');pxText(G.inBonus?'BONUS':String(G.cur),col*2+14,hy+16,14,'#fff');
 pxText('BELLY',col*3,hy,14,'#fff');pxText(G.belly+'/'+cap(),col*3+6,hy+16,14,G.belly>=cap()?'#ffea00':'#fff');
 for(let i=0;i<Math.min(G.hearts,6);i++)spr(SPR.heart,14+i*17,hy+36,2);if(G.hearts>6)pxText('+'+(G.hearts-6),14+6*17,hy+34,12,'#fff');
 if(carn()){const s=curSec(G.d.x);spr(SPR.little[0],col+4,hy+36,1.3);pxText(s.ate+'/'+s.goal,col+24,hy+36,12,s.ate>=s.goal?'#b2ff59':'#fff')}
 const tc=(t,y,sz,c)=>{ctx.font='bold '+sz+'px "Courier New",monospace';const w=ctx.measureText(t).width;if(w>VW-16)sz=Math.floor(sz*(VW-16)/w);pxText(t,VW/2,y,sz,c,'center')};
 let ty=58;if(b&&!b.gone){ctx.fillStyle='#000';ctx.fillRect(VW*.3,ty,VW*.4,12);ctx.fillStyle='#ff1744';ctx.fillRect(VW*.3+2,ty+2,(VW*.4-4)*b.hp/b.max,8);ty+=16;tc(b.T.name.replace(/^\S+ /,''),ty,12,'#fff');ty+=18}
 if(G.ch&&G.ch.k=='rival'){tc('YOU '+G.ch.you+' VS '+G.ch.riv+' RIVAL',ty,15,'#fff');ty+=20}
 if(G.inBonus){tc('BONUS CAVE '+Math.ceil(G.bonusT),ty,15,'#ffea00');ty+=20}
 if(G.secBanner){ctx.globalAlpha=Math.min(1,G.secBanner.l);tc(G.secBanner.t.toUpperCase(),ty,16,'#fff');ctx.globalAlpha=1}
 if(G.banner)tc(G.banner.t.replace(/[^\x20-\x7E]/g,'').trim().toUpperCase(),VH*.36,26,'#ffea00');
 ctx.restore()}
let acc=0,last=0;function loop(t){const dt=Math.min(100,t-last||16);last=t;acc+=dt;while(acc>=16.67){if(G.running)update();else if(G.parts)G.parts=G.parts.filter(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.3;p.l-=.01;return p.l>0});acc-=16.67}draw();requestAnimationFrame(loop)}requestAnimationFrame(loop);
window.__dc={get G(){return G},mystery,GOOD,BAD,start,startChallenge,startBoss,enterBonus,exitBonus,UNL,usePower,erupt,cap,genSection,groundTop,get unl(){return unl},get pick(){return pick},consts:{T,GY,JV,GRAV,SPD,SEC_L}};

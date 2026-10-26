'use strict';
// v12 look + feel layer: parallax, sky, juice, boss aura, sparkles, dress-up, sound table, music.
// All art is drawn in code. Runs on the game's fixed 60 steps/sec clock (same speed at 60/90/120 Hz).
const VIS=(()=>{
const LS=localStorage,TAU=Math.PI*2;
const rnd=(a,b)=>a+Math.random()*(b-a);
let calm=LS.dinoColossus_Calm==='1',tapped=false;
const MAXP=60; // particle cap for v12 effects
const st={sparks:[],leaves:[],rings:[],pops:[],wasOn:true,lastVy:0,stepT:0,sq:0,sqv:0,blinkT:2.5,blink:0,grin:0,lastScore:0,lastCur:1,bossRef:null,bossGone:false,ghost:0,chimeT:0,hudPulse:0,cheer:null,smokeT:0,running:false};

// ---------- sound table (swap in files later: set url, keep name) ----------
// v13: CC0 files from Kenney (kenney.nl) + SdiviHall Retro Monster Roar (OpenGameArt); no credit required.
// Each entry: {synth(ctx,t,out)} renders once into a buffer; or {url:'sounds/x.mp3'} to use a real file.
const SOUNDS={
 stomp:{url:'sounds/stomp.mp3',vol:.5,synth(a,t,o){const s=a.createOscillator(),g=a.createGain();s.type='sine';s.frequency.setValueAtTime(140,t);s.frequency.exponentialRampToValueAtTime(40,t+.2);g.gain.setValueAtTime(.9,t);g.gain.exponentialRampToValueAtTime(.001,t+.22);s.connect(g).connect(o);s.start(t);s.stop(t+.24);noise(a,t,.08,.35,600,o)},len:.25},
 land:{url:'sounds/land.mp3',vol:.35,synth(a,t,o){const s=a.createOscillator(),g=a.createGain();s.type='sine';s.frequency.setValueAtTime(110,t);s.frequency.exponentialRampToValueAtTime(55,t+.09);g.gain.setValueAtTime(.7,t);g.gain.exponentialRampToValueAtTime(.001,t+.1);s.connect(g).connect(o);s.start(t);s.stop(t+.12)},len:.13},
 roar:{url:'sounds/roar.mp3',vol:.4,synth(a,t,o){const s=a.createOscillator(),l=a.createOscillator(),lg=a.createGain(),f=a.createBiquadFilter(),g=a.createGain();s.type='sawtooth';s.frequency.setValueAtTime(150,t);s.frequency.linearRampToValueAtTime(210,t+.15);s.frequency.exponentialRampToValueAtTime(80,t+.65);l.frequency.value=22;lg.gain.value=18;l.connect(lg).connect(s.frequency);f.type='lowpass';f.frequency.value=900;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.6,t+.06);g.gain.exponentialRampToValueAtTime(.001,t+.7);s.connect(f).connect(g).connect(o);s.start(t);l.start(t);s.stop(t+.72);l.stop(t+.72);noise(a,t,.5,.12,1200,o)},len:.75},
 bigroar:{vol:.45,synth(a,t,o){const s=a.createOscillator(),l=a.createOscillator(),lg=a.createGain(),f=a.createBiquadFilter(),g=a.createGain();s.type='sawtooth';s.frequency.setValueAtTime(150,t);s.frequency.linearRampToValueAtTime(210,t+.15);s.frequency.exponentialRampToValueAtTime(80,t+.65);l.frequency.value=22;lg.gain.value=18;l.connect(lg).connect(s.frequency);f.type='lowpass';f.frequency.value=900;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.6,t+.06);g.gain.exponentialRampToValueAtTime(.001,t+.7);s.connect(f).connect(g).connect(o);s.start(t);l.start(t);s.stop(t+.72);l.stop(t+.72);noise(a,t,.5,.12,1200,o)},len:.75},
 chime:{url:'sounds/chime.mp3',vol:.25,synth(a,t,o){[1318,1976].forEach((fq,i)=>{const s=a.createOscillator(),g=a.createGain();s.type='sine';s.frequency.value=fq;g.gain.setValueAtTime(0,t+i*.06);g.gain.linearRampToValueAtTime(.5,t+i*.06+.01);g.gain.exponentialRampToValueAtTime(.001,t+i*.06+.3);s.connect(g).connect(o);s.start(t+i*.06);s.stop(t+i*.06+.32)})},len:.4},
 cheer:{url:'sounds/cheer.mp3',vol:.35,synth(a,t,o){[523,659,784,1046,1318].forEach((fq,i)=>{const s=a.createOscillator(),g=a.createGain(),tt=t+i*.09;s.type='triangle';s.frequency.value=fq;g.gain.setValueAtTime(0,tt);g.gain.linearRampToValueAtTime(.5,tt+.01);g.gain.exponentialRampToValueAtTime(.001,tt+(i==4?.6:.2));s.connect(g).connect(o);s.start(tt);s.stop(tt+.62)});noise(a,t+.3,.5,.08,3000,o)},len:1},
 sparkle:{url:'sounds/sparkle.mp3',vol:.3,synth(a,t,o){[1760,2349,2637].forEach((fq,i)=>{const s=a.createOscillator(),g=a.createGain(),tt=t+i*.05;s.type='sine';s.frequency.value=fq;g.gain.setValueAtTime(.4,tt);g.gain.exponentialRampToValueAtTime(.001,tt+.18);s.connect(g).connect(o);s.start(tt);s.stop(tt+.2)})},len:.35},
 // v14 music: Beethoven recordings (Musopen, public domain, from Wikimedia Commons). The loop crossfade (1.5 s) is
 // baked into each file. Real recordings play at steady pace (speeding them raises the pitch); the generated
 // music is the backup until the file loads or if it fails, and that backup still speeds up with the game.
 music:{url:'sounds/music-pastoral.mp3',loop:true},
 bossmusic:{url:'sounds/music-minuet.mp3',loop:true}
};
function noise(a,t,d,v,fc,o){const n=Math.floor(a.sampleRate*d),b=a.createBuffer(1,n,a.sampleRate),c=b.getChannelData(0);for(let i=0;i<n;i++)c[i]=(Math.random()*2-1)*(1-i/n);const s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();s.buffer=b;f.type='lowpass';f.frequency.value=fc;g.gain.value=v;s.connect(f).connect(g).connect(o);s.start(t)}
const BUF={},SRC={};let rendering=false,master=null,musicG=null;
function A(){try{if(!tapped)return null;return (typeof ac==='function')?ac():null}catch(e){return null}}
function prerender(){if(rendering)return;rendering=true;const a=A();if(!a)return;const OAC=window.OfflineAudioContext||window.webkitOfflineAudioContext;
 for(const [k,s] of Object.entries(SOUNDS)){if(s.loop)continue;
  const synth=()=>{if(!OAC||!s.synth)return;try{const o=new OAC(1,Math.ceil(a.sampleRate*s.len),a.sampleRate);s.synth(o,0,o.destination);o.startRendering().then(b=>{if(!SRC[k]||SRC[k]==='synth'){BUF[k]=b;SRC[k]='synth'}}).catch(()=>{})}catch(e){}};
  synth(); // generated sound first, replaced by the file once it loads; stays if the file fails
  if(s.url)fetch(s.url).then(r=>{if(!r.ok)throw 0;return r.arrayBuffer()}).then(b=>new Promise((ok,no)=>{const p=a.decodeAudioData(b,ok,no);if(p&&p.catch)p.catch(no)})).then(b=>{BUF[k]=b;SRC[k]='file'}).catch(()=>{});}
 for(const k of ['music','bossmusic']){SRC[k]='synth';const u=SOUNDS[k].url;if(u)fetch(u).then(r=>{if(!r.ok)throw 0;return r.arrayBuffer()}).then(b=>new Promise((ok,no)=>{const p=a.decodeAudioData(b,ok,no);if(p&&p.catch)p.catch(no)})).then(b=>{if(b.duration<5)throw 0;BUF[k]=b;LOOP[k]=edges(b);SRC[k]='file'}).catch(()=>{SRC[k]='synth'})}}
// skip mp3 encoder padding (near-silent samples) at the edges so the loop seam has no gap
const LOOP={};function edges(b){const c=b.getChannelData(0),n=c.length,th=.0005;let i=0,j=n-1;while(i<n&&Math.abs(c[i])<th&&i<b.sampleRate*.2)i++;while(j>i&&Math.abs(c[j])<th&&n-j<b.sampleRate*.2)j--;return [i/b.sampleRate,(j+1)/b.sampleRate]}
function out(){const a=A();if(!a)return null;if(!master){master=a.createGain();master.gain.value=1;master.connect(a.destination);musicG=a.createGain();musicG.gain.value=.5;musicG.connect(master)}return master}
let lastPlay={};
function play(k,minGap){if(typeof snd!=='undefined'&&!snd)return;if(!tapped)return;const a=A();if(!a||!BUF[k])return;const now=a.currentTime;if(minGap&&lastPlay[k]&&now-lastPlay[k]<minGap)return;lastPlay[k]=now;
 try{const s=a.createBufferSource(),g=a.createGain();s.buffer=BUF[k];g.gain.value=(SOUNDS[k].vol||.4);s.connect(g).connect(out());s.start(now+.005)}catch(e){}}
// generated music: cheerful pentatonic bass + arp, scheduled ahead on the audio clock
const PROG=[[0,4,7],[5,9,12],[7,11,14],[0,4,7]],BASE=196;let mNext=0,mStep=0,mTimer=0,mSrc=null;
function bpm(){if(typeof G==='undefined'||!G.running)return 100;let b=96+Math.min(44,((G.cur||1)-1)*4+(G.bossN||0)*2);if(G.boss&&!G.boss.gone)b+=10;if(G.dash||G.pwKind==='speed')b+=8;return Math.min(160,b)}
function note(a,t,f,d,type,v){const o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g).connect(musicG);o.start(t);o.stop(t+d+.02)}
function musicTick(){const a=A();if(!a)return;const want=st.running&&(typeof snd==='undefined'||snd)&&!document.hidden&&tapped;
 if(!want){stopMusic();return}out();
 const mk=(typeof G!=='undefined'&&G.boss&&!G.boss.gone)?'bossmusic':'music';
 if(BUF[mk]){if(!mSrc||mSrc.k!==mk){stopMusic(.6);const g=a.createGain(),s=a.createBufferSource(),[ls,le]=LOOP[mk];s.buffer=BUF[mk];s.loop=true;s.loopStart=ls;s.loopEnd=le;s.k=mk;s.g=g;
   g.gain.setValueAtTime(0,a.currentTime);g.gain.linearRampToValueAtTime(1,a.currentTime+.6);s.connect(g).connect(musicG);s.start(a.currentTime,ls);mSrc=s}return}
 if(mSrc)stopMusic(.3);
 if(mNext<a.currentTime)mNext=a.currentTime+.05;const spb=60/bpm()/2;
 while(mNext<a.currentTime+.25){const ch=PROG[(mStep>>3)%4],i=mStep%8,fq=k=>BASE*Math.pow(2,k/12);
  if(i%4==0)note(a,mNext,fq(ch[0])/2,spb*1.8,'triangle',.22);
  if(i%2==0||(G&&G.boss&&!G.boss.gone))note(a,mNext,fq(ch[(i>>1)%3])*2,spb*.8,'square',.035);
  mNext+=spb;mStep++}}
function stopMusic(f){if(mSrc){const s=mSrc;mSrc=null;try{const a=A();if(f&&a&&s.g){const t=a.currentTime;s.g.gain.cancelScheduledValues(t);s.g.gain.setValueAtTime(s.g.gain.value,t);s.g.gain.linearRampToValueAtTime(0,t+f);s.stop(t+f+.02)}else s.stop()}catch(e){}}}
setInterval(musicTick,90);
function unlock(){tapped=true;const a=A();if(a&&a.state!=='running')a.resume().catch(()=>{});prerender()}
addEventListener('pointerdown',unlock,true);addEventListener('keydown',unlock,true);
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopMusic();const a=A();if(a&&a.state==='running')a.suspend().catch(()=>{})}else if(tapped){const a=A();if(a)a.resume().catch(()=>{});wake()}});
function buzz(p){if(calm||!tapped||!navigator.vibrate)return;if(typeof snd!=='undefined'&&!snd)return;try{navigator.vibrate(p)}catch(e){}}
// screen wake lock while a run is going
let wl=null;async function wake(){try{if(st.running&&navigator.wakeLock&&!wl&&!document.hidden){wl=await navigator.wakeLock.request('screen');wl.addEventListener('release',()=>wl=null)}}catch(e){wl=null}}
function unwake(){try{wl&&wl.release()}catch(e){}wl=null}

// ---------- dress-up ----------
const COLORS=[{id:'orig',n:'Normal',cost:0},{id:'lime',n:'Lime',cost:2,G:'#7ed321',B:'#eaffb8',L:'#4c8a10'},{id:'sky',n:'Sky',cost:2,G:'#29b6f6',B:'#d4f2ff',L:'#0b7fb8'},{id:'orange',n:'Orange',cost:2,G:'#ff9100',B:'#ffe0b2',L:'#c25e00'},
 {id:'pink',n:'Bubblegum',cost:3,G:'#ff5fae',B:'#ffd6ec',L:'#c2307a'},{id:'grape',n:'Grape',cost:3,G:'#9b5cff',B:'#e4d4ff',L:'#6a2fd0'},{id:'red',n:'Ruby',cost:3,G:'#f03a3a',B:'#ffd0d0',L:'#a81e1e'},{id:'gold',n:'Gold',cost:5,G:'#ffc400',B:'#fff6c4',L:'#c79200'}];
const HATS=[{id:'none',n:'No hat',cost:0},{id:'party',n:'Party hat',cost:3},{id:'cap',n:'Propeller',cost:3},{id:'flower',n:'Flower',cost:3},{id:'cowboy',n:'Cowboy',cost:4},{id:'top',n:'Top hat',cost:4},{id:'crown',n:'Crown',cost:6}];
const GLASSES=[{id:'none',n:'No glasses',cost:0},{id:'sun',n:'Sunglasses',cost:3},{id:'star',n:'Star glasses',cost:4},{id:'heart',n:'Heart glasses',cost:4}];
const KS='dinoColossus_DressStars',KO='dinoColossus_DressOwned',KE='dinoColossus_DressOn';
const jget=(k,d)=>{try{const v=JSON.parse(LS[k]||'null');return v==null?d:v}catch(e){return d}};
let stars=Math.max(0,+LS[KS]||0),owned=new Set(jget(KO,[])),on=Object.assign({c:'orig',h:'none',g:'none'},jget(KE,{}));
const isOwned=(it)=>it.cost===0||owned.has(it.id);
function saveDress(){try{LS[KS]=stars;LS[KO]=JSON.stringify([...owned]);LS[KE]=JSON.stringify(on)}catch(e){}}
function starsFor(score,bosses){return Math.min(8,1+Math.floor((score||0)/1500)+(bosses||0))}

// ---------- dino sprites (outlined + glossy + recolourable) ----------
const OUT='#1b1026',sprCache={};
function shade(hex,k){const n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;const f=v=>Math.max(0,Math.min(255,Math.round(k>0?v+(255-v)*k:v*(1+k))));return '#'+[f(r),f(g),f(b)].map(v=>v.toString(16).padStart(2,'0')).join('')}
function pal(i){const c=COLORS.find(x=>x.id===on.c);const p=(c&&c.G)?{G:c.G,B:c.B,L:c.L}:DINO_PAL[i];return p}
function dinoSpr(i,fr){const key=i+'|'+on.c+'|'+fr;if(sprCache[key])return sprCache[key];const carn=i<3,rows=carn?(fr?CARN_B:CARN_A):(fr?HERB_B:HERB_A),p=pal(i);
 const P={G:p.G,B:p.B,L:p.L,W:p.G,K:p.G,T:'#ffffff',D:'#3b2a1a'}; // eye drawn later as a big friendly eye
 const h=rows.length,w=rows[0].length,c=document.createElement('canvas');c.width=w+2;c.height=h+2;const x=c.getContext('2d');const f=(i2,j)=>j>=0&&j<h&&i2>=0&&i2<w&&rows[j][i2]!=='.';
 for(let j=-1;j<=h;j++)for(let i2=-1;i2<=w;i2++){if(f(i2,j))continue;if(f(i2-1,j)||f(i2+1,j)||f(i2,j-1)||f(i2,j+1)){x.fillStyle=OUT;x.fillRect(i2+1,j+1,1,1)}}
 for(let j=0;j<h;j++)for(let i2=0;i2<w;i2++){const ch=rows[j][i2];if(ch==='.')continue;let col=P[ch]||p.G;if(ch==='G'||ch==='W'||ch==='K'){if(!f(i2,j-1))col=shade(p.G,.45);else if(!f(i2,j+1)||!f(i2-1,j)&&j>6)col=shade(p.G,-.25)}x.fillStyle=col;x.fillRect(i2+1,j+1,1,1)}
 // glossy shine on the back / head
 x.fillStyle='rgba(255,255,255,.75)';if(carn){x.fillRect(10,2,2,1);x.fillRect(8,8,2,1)}else{x.fillRect(12,2,1,1);x.fillRect(5,9,2,1)}
 return sprCache[key]=c}
// face + hat + glasses, drawn in sprite pixel units (18x18 outlined grid, feet at bottom)
const FACE=[{ex:11,ey:2,mx:12,my:6},{ex:12,ey:1,mx:12,my:4}];
function px(x,X,Y,W,H,c){x.fillStyle=c;x.fillRect(X,Y,W,H)}
function face(x,i,o){const carn=i<3,F=FACE[carn?0:1],e=F.ex,y=F.ey;
 if(o.dizzy){px(x,e-1,y,4,4,'#fff');px(x,e-1,y,1,1,OUT);px(x,e+2,y,1,1,OUT);px(x,e,y+1,2,2,OUT);px(x,e-1,y+3,1,1,OUT);px(x,e+2,y+3,1,1,OUT)}
 else if(o.g==='none'){if(o.blink){px(x,e-1,y+2,4,1,OUT)}else{px(x,e-1,y,4,4,OUT);px(x,e,y,3,3,'#fff');px(x,e+1,y+1,2,2,'#1b1026');px(x,e+1,y+1,1,1,'#fff')}}
 // mouth
 if(carn){if(o.grin){px(x,F.mx,F.my,5,2,'#5a1020');px(x,F.mx,F.my,5,1,'#fff');px(x,F.mx+1,F.my+1,2,1,'#ff6f91')}else if(o.dizzy){px(x,F.mx+1,F.my,1,1,OUT);px(x,F.mx+2,F.my+1,1,1,OUT);px(x,F.mx+3,F.my,1,1,OUT)}else{px(x,F.mx,F.my-1,4,1,'#fff');px(x,F.mx+3,F.my,1,1,OUT);px(x,F.mx,F.my,3,1,OUT)}}
 else{if(o.grin){px(x,F.mx,F.my-1,3,2,'#5a1020');px(x,F.mx+1,F.my,1,1,'#ff6f91')}else{px(x,F.mx,F.my-1,1,1,OUT);px(x,F.mx+1,F.my,2,1,OUT)}}
 // cheeks
 px(x,e-2,y+4,2,1,'rgba(255,105,150,.7)');
 // glasses
 const g=o.g;if(g!=='none'&&!o.dizzy){if(g==='sun'){px(x,e-3,y,7,1,OUT);px(x,e-2,y,5,3,OUT);px(x,e-1,y+1,1,1,'#7fd3ff')}else if(g==='star'){const C='#ffd600';px(x,e-1,y-1,3,5,C);px(x,e-2,y+1,5,2,C);px(x,e,y+1,1,1,'#ff4081');px(x,e-3,y+1,1,1,OUT)}else if(g==='heart'){const C='#ff3d7f';px(x,e-2,y,2,2,C);px(x,e+1,y,2,2,C);px(x,e-2,y+1,5,2,C);px(x,e-1,y+3,3,1,C);px(x,e-1,y+1,1,1,'#fff')}}
 hat(x,carn,o.h,o.t||0)}
function hat(x,carn,h,t){if(h==='none')return;const cx=carn?11:13,ty=carn?1:1; // top of head
 if(h==='party'){px(x,cx-2,ty-1,5,1,'#ff4081');px(x,cx-1,ty-3,3,2,'#ffd600');px(x,cx,ty-5,1,2,'#29b6f6');px(x,cx-1,ty-2,1,1,'#29b6f6');px(x,cx,ty-6,1,1,'#fff')}
 else if(h==='crown'){px(x,cx-3,ty-3,7,3,'#ffc400');px(x,cx-3,ty-4,1,1,'#ffc400');px(x,cx,ty-4,1,1,'#ffc400');px(x,cx+3,ty-4,1,1,'#ffc400');px(x,cx-1,ty-2,1,1,'#e53935');px(x,cx+1,ty-2,1,1,'#29b6f6');px(x,cx-3,ty-3,7,1,'#fff59d')}
 else if(h==='cowboy'){px(x,cx-5,ty-1,11,1,'#6d4c2e');px(x,cx-2,ty-4,5,3,'#8d6e4a');px(x,cx-2,ty-2,5,1,'#e53935')}
 else if(h==='top'){px(x,cx-4,ty-1,9,1,'#212121');px(x,cx-2,ty-6,5,5,'#212121');px(x,cx-2,ty-2,5,1,'#e53935');px(x,cx-1,ty-6,1,3,'#555')}
 else if(h==='flower'){const P='#ff80c0';px(x,cx-1,ty-3,3,1,P);px(x,cx-2,ty-2,1,1,P);px(x,cx+2,ty-2,1,1,P);px(x,cx-1,ty-1,3,1,P);px(x,cx,ty-2,1,1,'#ffd600');px(x,cx+2,ty-1,2,1,'#43a047')}
 else if(h==='cap'){px(x,cx-3,ty-2,6,2,'#e53935');px(x,cx+2,ty-1,3,1,'#c62828');px(x,cx-1,ty-3,1,1,'#555');const w=Math.round(Math.cos(t*20)*3);px(x,cx-1-Math.abs(w),ty-4,1+2*Math.abs(w),1,'#ffd600')}}
function dinoDecor(x,i,sc,d){x.save();x.scale(sc,sc);x.translate(-9,-17);face(x,i,{dizzy:G.hit>20&&!G.dying?1:0,blink:st.blink>0,grin:st.grin>0,g:on.g,h:on.h,t:G.el});x.restore()}
// squash & stretch factors for the player
function sqs(d){let sx=1,sy=1;if(!d.on){const v=Math.max(-1,Math.min(1,-d.vy/12));if(v>0){sx=1-.12*v;sy=1+.14*v}}const s=calm?st.sq*.5:st.sq;sx*=1+s*.22;sy*=1-s*.2;return [sx,sy]}
function wobble(d){if(!d.on||!d.vx||G.fat)return Math.sin(G.el*2.2)*.025;return Math.sin(G.el*16)*.06}

// ---------- sky, sun, moon, stars ----------
const skyC={};let skyN=0;
function skyCanvas(B,p,dk){const q=Math.round(p*96),key=B.n+q;if(skyC[key])return skyC[key];if(++skyN>60){for(const k in skyC)delete skyC[k];skyN=0}
 const c=document.createElement('canvas');c.width=1;c.height=64;const x=c.getContext('2d'),s=skyAt(q/96),n=Math.min(1,darkness(q/96)/.42);
 const day=q/96<.36||q/96>.95,top=day?shade(B.sky,-.18):s[0],bot=day?shade(B.sky,.35):s[1];const gr=x.createLinearGradient(0,0,0,64);gr.addColorStop(0,lerpC(toHex(top),'#070b26',n*.6));gr.addColorStop(1,lerpC(toHex(bot),'#1a237e',n*.5));x.fillStyle=gr;x.fillRect(0,0,1,64);return skyC[key]=c}
function toHex(c){if(c[0]==='#')return c;const m=c.match(/\d+/g).map(Number);return '#'+m.slice(0,3).map(v=>v.toString(16).padStart(2,'0')).join('')}
let glowC=null,sunC=null,moonC=null;
function glowSpr(){if(glowC)return glowC;const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createRadialGradient(64,64,4,64,64,64);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.35,'rgba(255,255,255,.45)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128);return glowC=c}
const tintC={};function glowTint(col){if(tintC[col])return tintC[col];const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.drawImage(glowSpr(),0,0);x.globalCompositeOperation='source-in';x.fillStyle=col;x.fillRect(0,0,128,128);return tintC[col]=c}
function sunSpr(){if(sunC)return sunC;const c=document.createElement('canvas');c.width=c.height=96;const x=c.getContext('2d');x.drawImage(glowTint('#fff3b0'),0,0,96,96);x.fillStyle='#fff8d0';x.beginPath();x.arc(48,48,15,0,TAU);x.fill();x.fillStyle='#ffe066';x.beginPath();x.arc(48,48,13,0,TAU);x.fill();return sunC=c}
function moonSpr(){if(moonC)return moonC;const c=document.createElement('canvas');c.width=c.height=80;const x=c.getContext('2d');x.globalAlpha=.6;x.drawImage(glowTint('#c5d4ff'),0,0,80,80);x.globalAlpha=1;x.fillStyle='#fdf7d8';x.beginPath();x.arc(40,40,12,0,TAU);x.fill();x.fillStyle='#e6deb4';x.beginPath();x.arc(35,37,3,0,TAU);x.arc(44,45,2,0,TAU);x.fill();return moonC=c}
function sky(B,p,dk){const c=skyCanvas(B,p,dk);ctx.imageSmoothingEnabled=true;ctx.drawImage(c,0,0,VW,VH);ctx.imageSmoothingEnabled=false;
 // stars (slow gentle twinkle, no strobing)
 const n=Math.min(1,dk/.42);if(n>.15){ctx.fillStyle='#fff';for(let i=0;i<60;i++){ctx.globalAlpha=(n-.15)*(.55+.45*Math.sin(G.el*1.3+i*1.7));const sx=((i*97.3-G.camX*.03)%VW+VW)%VW,sy=(i*53.7)%(VH*.55)+6;ctx.fillRect(sx,sy,i%7==0?2:1.3,i%7==0?2:1.3)}ctx.globalAlpha=1}
 // sun arcs across the day, moon across the night
 const sunK=p<.5?p/.5:-1;if(sunK>=0){const sx=VW*(.1+.8*sunK),sy=VH*(.42-.32*Math.sin(sunK*Math.PI));ctx.globalAlpha=1-n;ctx.drawImage(sunSpr(),sx-48,sy-48);ctx.globalAlpha=1}
 const mk=p>=.5&&p<.98?(p-.5)/.48:-1;if(mk>=0){const mx=VW*(.12+.76*mk),my=VH*(.38-.28*Math.sin(mk*Math.PI));ctx.globalAlpha=Math.min(1,n*1.5);ctx.drawImage(moonSpr(),mx-40,my-40);ctx.globalAlpha=1}}
// warm sunset wash over the far layers
function sunsetK(p){return p>.3&&p<.56?Math.sin((p-.3)/.26*Math.PI):p>.86&&p<.99?.6*Math.sin((p-.86)/.13*Math.PI):0}

// ---------- parallax layers (pre-rendered once per biome) ----------
const LW=1024,layC={};
function mk(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
function hsh(n){n=Math.sin(n*91.7+3.1)*43758.5453;return n-Math.floor(n)}
function layers(B){if(layC[B.n])return layC[B.n];const ice=B.n==='Ice Age',L={};
 // far hills/mountains
 {const c=mk(LW,170),x=c.getContext('2d'),col=lerpC(B.hill,B.sky,.55);x.fillStyle=toHex(col);x.beginPath();x.moveTo(0,170);for(let i=0;i<=LW;i+=8){const y=70+Math.sin(i/LW*TAU*3)*28+Math.sin(i/LW*TAU*7+1)*14;x.lineTo(i,y)}x.lineTo(LW,170);x.fill();
  x.fillStyle=ice?'#ffffff':toHex(lerpC(B.hill,'#ffffff',.55));for(let i=0;i<LW;i+=8){const y=70+Math.sin(i/LW*TAU*3)*28+Math.sin(i/LW*TAU*7+1)*14;if(y<62)x.fillRect(i,y,8,4)}L.far=c}
 // big volcano (one per tile) with lava crater
 {const c=mk(LW,190),x=c.getContext('2d'),cx=LW*.62,base=190,top=40;x.fillStyle=toHex(lerpC('#6d5a4a',B.sky,.35));x.beginPath();x.moveTo(cx-170,base);x.lineTo(cx-26,top);x.lineTo(cx+26,top);x.lineTo(cx+170,base);x.fill();
  x.fillStyle=toHex(lerpC('#5a4636',B.sky,.3));x.beginPath();x.moveTo(cx,top);x.lineTo(cx+26,top);x.lineTo(cx+170,base);x.lineTo(cx+60,base);x.fill();
  x.fillStyle='#ff6d00';x.fillRect(cx-22,top-3,44,6);x.fillStyle='#ffd600';x.fillRect(cx-14,top-3,28,3);x.fillStyle='#ff6d00';x.fillRect(cx-8,top+2,6,22);x.fillRect(cx+6,top+2,5,14);L.vol=c;L.volX=cx;L.volTop=top}
 // mist band
 {const c=mk(64,60),x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,60);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.6,'rgba(255,255,255,.35)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,60);L.mist=c}
 // jungle mid layer (trees / ice spires / cacti by biome)
 {const c=mk(LW,130),x=c.getContext('2d'),dk=toHex(lerpC(B.hill,'#0b2b16',.35)),lt=toHex(lerpC(B.hill,'#ffffff',.15));x.fillStyle=dk;x.fillRect(0,112,LW,18);
  for(let i=0;i<22;i++){const tx=i*LW/22+hsh(i)*30,th=50+hsh(i+9)*55,k=hsh(i+3);
   if(B.n==='Desert Badlands'){x.fillStyle=dk;x.fillRect(tx,130-th*.7,10,th*.7);x.fillRect(tx-10,130-th*.5,8,6);x.fillRect(tx-10,130-th*.6,6,14);x.fillRect(tx+10,130-th*.45,8,6);x.fillRect(tx+14,130-th*.55,6,12)}
   else if(ice){x.fillStyle=dk;x.beginPath();x.moveTo(tx-14,130);x.lineTo(tx,130-th);x.lineTo(tx+14,130);x.fill();x.fillStyle='#fff';x.beginPath();x.moveTo(tx-5,130-th*.65);x.lineTo(tx,130-th);x.lineTo(tx+5,130-th*.65);x.fill()}
   else if(k<.5){x.fillStyle='#4e342e';x.fillRect(tx,130-th,5,th);x.fillStyle=dk;for(let a=0;a<5;a++){x.beginPath();x.ellipse(tx+2+Math.cos(a*1.3+.4)*14,130-th+Math.sin(a*1.3+.4)*4,16,5,a*1.3+.4,0,TAU);x.fill()}}
   else{x.fillStyle='#4e342e';x.fillRect(tx+8,130-th*.5,6,th*.5);x.fillStyle=dk;x.beginPath();x.arc(tx+11,130-th*.6,th*.32,0,TAU);x.fill();x.fillStyle=lt;x.beginPath();x.arc(tx+5,130-th*.68,th*.12,0,TAU);x.fill()}}
  L.mid=c}
 // near plants (foreground, below the ground line)
 {const c=mk(LW,60),x=c.getContext('2d'),col=ice?'#cfe8ff':toHex(lerpC(B.hill,'#06200e',.45));x.fillStyle=col;
  for(let i=0;i<40;i++){const tx=i*LW/40+hsh(i+20)*20,h=20+hsh(i+40)*30;if(hsh(i+5)<.45)continue;for(let b=-2;b<=2;b++){x.beginPath();x.moveTo(tx,60);x.quadraticCurveTo(tx+b*6,60-h*.6,tx+b*10,60-h+Math.abs(b)*5);x.lineTo(tx+b*10+3,60-h+Math.abs(b)*5+3);x.quadraticCurveTo(tx+b*4+3,60-h*.5,tx+4,60);x.fill()}}
  L.near=c}
 return layC[B.n]=L}
function tile(c,speed,y,w){const off=((G.camX*speed)%LW+LW)%LW;for(let x=-off;x<VW;x+=LW)ctx.drawImage(c,Math.round(x),Math.round(y))}
// before world translate: ctx is in view coords (0..VW, 0..VH)
function bgFar(B,p,dk){sky(B,p,dk);const L=layers(B),gy=GY-WY;
 tile(L.far,.08,gy-170+10);
 tile(L.vol,.16,gy-190+20);
 // soft smoke + glow from the volcano crater(s)
 const off=((G.camX*.16)%LW+LW)%LW;for(let x=-off;x<VW;x+=LW){const cx=x+L.volX,cy=gy-190+20+L.volTop;if(cx<-80||cx>VW+80)continue;
  ctx.globalAlpha=.35+.25*dk/.42+.08*Math.sin(G.el*1.5);ctx.drawImage(glowTint('#ff7a1a'),cx-50,cy-50,100,100);ctx.globalAlpha=1;
  const n=calm?3:6;for(let i=0;i<n;i++){const k=((G.el*.12+i/n)%1);ctx.globalAlpha=(1-k)*.4;ctx.drawImage(glowTint('#e8e2dc'),cx-10-k*14+Math.sin(i+G.el*.4)*8,cy-12-k*90,22+k*40,22+k*40)}ctx.globalAlpha=1}
 const sk=sunsetK(p);if(sk>0){ctx.fillStyle='rgba(255,120,60,'+(sk*.18).toFixed(3)+')';ctx.fillRect(0,0,VW,gy)}
 ctx.globalAlpha=.8;ctx.imageSmoothingEnabled=true;ctx.drawImage(L.mist,0,gy-120,VW,60);ctx.imageSmoothingEnabled=false;ctx.globalAlpha=1;
 tile(L.mid,.42,gy-130+4)}
// after world drawn (view coords again)
function fgNear(B){if(G.inBonus)return;const L=layers(B),gy=GY-WY;ctx.globalAlpha=.9;tile(L.near,1.25,gy+VH*.3-58+(VH-(GY-WY)-VH*.3));ctx.globalAlpha=1}
// falling leaves (snow in the ice biome)
function leavesDraw(B){if(G.inBonus||calm)return;const ice=B.n==='Ice Age',c=ice?'#ffffff':B.n==='Desert Badlands'?'#d7a86e':'#7cc04a';
 for(const l of st.leaves){ctx.save();ctx.translate(l.x,l.y);ctx.rotate(l.a);ctx.fillStyle=ice?c:(l.k?shade(c,-.25):c);if(ice){ctx.fillRect(-1.5,-1.5,3,3)}else{ctx.beginPath();ctx.ellipse(0,0,4,2,0,0,TAU);ctx.fill();ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(-3,0,6,.6)}ctx.restore()}}

// ---------- effects ----------
function spark(x,y,c,n,spd,life,big){for(let i=0;i<n;i++){if(st.sparks.length>=MAXP)st.sparks.shift();const a=rnd(0,TAU),s=rnd(.4,1)*spd;st.sparks.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-1,l:life,L:life,c,r:big?rnd(2.5,4):rnd(1.5,2.6),star:Math.random()<.5})}}
function starBurst(x,y,c){spark(x,y,c||'#fff59d',calm?6:16,4.5,40,1);st.rings.push({x,y,r:6,R:46,l:1,c:c||'#fff59d'});play('sparkle',.08)}
function dust(x,y,n,s){for(let i=0;i<(calm?Math.ceil(n/2):n);i++){if(G.smoke.length>40)break;G.smoke.push({x:x+rnd(-6,6),y:y-2,vx:rnd(-1,1)*s,vy:rnd(-.8,-.2),r:rnd(3,6),l:.4})}}
function drawStar(x,y,r){ctx.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,rr=i%2?r*.45:r;ctx.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr)}ctx.fill()}
function fxWorld(){ // inside world transform
 for(const r of st.rings){ctx.globalAlpha=Math.max(0,r.l)*.8;ctx.strokeStyle=r.c;ctx.lineWidth=r.w||3;if(r.r<=0)continue;ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,TAU);ctx.stroke()}ctx.globalAlpha=1;
 for(const s of st.sparks){if(s.hud)continue;ctx.globalAlpha=Math.min(1,s.l/s.L*1.5);ctx.fillStyle=s.c;if(s.star)drawStar(s.x,s.y,s.r*1.6);else ctx.fillRect(s.x-s.r/2,s.y-s.r/2,s.r,s.r)}ctx.globalAlpha=1;
 // dizzy stars over the player after a bump
 const d=G.d;if(G.hit>20&&!G.dying&&!G.roll){ctx.fillStyle='#ffea00';for(let i=0;i<3;i++){const a=G.el*5+i*TAU/3;drawStar(d.x+d.w/2+Math.cos(a)*14,d.y-8+Math.sin(a)*4,4)}}}
function glowAt(x,y,r,col,a){ctx.globalAlpha=a;ctx.drawImage(glowTint(col),x-r,y-r,r*2,r*2);ctx.globalAlpha=1}
function pickupGlow(){ // glowing, pulsing pickups
 const pu=.75+.25*Math.sin(G.el*5);
 for(const q of G.pel)glowAt(q.x,q.y+Math.sin(G.el*6)*2,22*pu,'#fff176',.75);
 for(const g of G.gemsW)glowAt(g.x,g.y+Math.sin(G.el*5)*3,24*pu,'#80deea',.8);
 for(const t of (G.bitems||[]))glowAt(t.x+t.w/2,t.y+t.h/2,28*pu,'#ffd54f',.85);
 if(!calm&&(G.el*60|0)%6==0){const all=[...G.pel,...G.gemsW];const o=all[(Math.random()*all.length)|0];if(o&&st.sparks.length<MAXP)st.sparks.push({x:o.x+rnd(-10,10),y:o.y+rnd(-10,10),vx:0,vy:-.3,l:24,L:24,c:'#fff',r:2,star:true})}}
function bossAura(b){if(!b||b.gone||b.mode==='under')return;const i=b.T.i||0,col='hsl('+((i*37)%360)+',100%,60%)',pu=.8+.2*Math.sin(G.el*3.5),r=Math.max(b.w,b.h)*1.15*pu;
 ctx.globalCompositeOperation='lighter';glowAt(b.x+b.w/2,b.y+b.h*.55,r,col,.8);ctx.globalCompositeOperation='source-over'}
function bossBar(b,ty){const bw=VW*.6,bx=VW*.2,seg=(bw-8)/b.max,low=b.hp<=Math.ceil(b.max*.3),H=20;
 st.ghost+=(b.hp-st.ghost)*.06;if(st.ghost<b.hp)st.ghost=b.hp;
 rrect(bx-6,ty-3,bw+12,H+6,8,'#000000cc');rrect(bx-4,ty-1,bw+8,H+2,6,low&&!calm?(Math.sin(G.el*6)>0?'#ff5252':'#b71c1c'):'#ffd54f');rrect(bx-2,ty+1,bw+4,H-2,5,'#2a0a0a');
 for(let i=0;i<b.max;i++){const x=bx+2+i*seg+1,w=seg-2;let c=i<b.hp?'#ff1744':i<st.ghost?'#ffab40':'#4a1010';ctx.fillStyle=c;ctx.fillRect(x,ty+3,w,H-6);if(i<b.hp){ctx.fillStyle='#ff8a80';ctx.fillRect(x,ty+3,w,3)}}
 // boss heart icon
 ctx.fillStyle='#000';drawHeart(bx-14,ty+H/2,10);ctx.fillStyle='#ff1744';drawHeart(bx-14,ty+H/2,8)}
function drawHeart(x,y,r){ctx.beginPath();ctx.moveTo(x,y+r*.8);ctx.bezierCurveTo(x-r*1.4,y-r*.2,x-r*.6,y-r*1.2,x,y-r*.4);ctx.bezierCurveTo(x+r*.6,y-r*1.2,x+r*1.4,y-r*.2,x,y+r*.8);ctx.fill()}
function rrect(x,y,w,h,r,c){ctx.fillStyle=c;ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,y,w,h,r);else ctx.rect(x,y,w,h);ctx.fill()}
const ACC=['#ffd54f','#4dd0e1','#ff8a65','#b388ff','#69f0ae','#ff80ab','#ffab40','#80d8ff','#eeff41','#ea80fc'];
const accent=()=>ACC[((G.cur||1)-1)%ACC.length];
function hudBack(){const a=accent();rrect(4,4,VW-8,56,10,'rgba(10,12,40,.55)');ctx.fillStyle=a;ctx.fillRect(14,58,VW-28,3);document.documentElement.style.setProperty('--acc',a)}
function hudFront(){ // score sparkles + level badge
 for(const s of st.sparks){if(!s.hud)continue;ctx.globalAlpha=Math.min(1,s.l/s.L*1.5);ctx.fillStyle=s.c;drawStar(s.x,s.y,s.r*1.6)}ctx.globalAlpha=1;
 if(st.hudPulse>0){ctx.globalAlpha=st.hudPulse;ctx.strokeStyle=accent();ctx.lineWidth=2;ctx.strokeRect(10,24,90,20);ctx.globalAlpha=1}
 // pop banners: LEVEL UP / BOSS BEATEN
 const c=st.cheer;if(c){const k=c.t/c.T,s=k<.15?k/.15*1.15:k<.25?1.15-(k-.15)*1.5:1,al=k>.8?(1-k)/.2:1,y=VH*.5;ctx.save();ctx.globalAlpha=al;ctx.translate(VW/2,y);ctx.scale(s,s);
  ctx.font='bold 30px "Courier New",monospace';const w=Math.min(VW*.8,ctx.measureText(c.txt).width+60);rrect(-w/2,-24,w,48,22,'#000000aa');rrect(-w/2+3,-21,w-6,42,19,c.col);ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(-w/2+14,-18,w-28,6);
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#3a1a00';let fs=30;while(ctx.measureText(c.txt).width>w-40&&fs>12){fs-=2;ctx.font='bold '+fs+'px "Courier New",monospace'}ctx.fillText(c.txt,1,3);ctx.fillStyle='#fff';ctx.fillText(c.txt,0,1);
  ctx.fillStyle='#fff59d';for(let i=0;i<2;i++){const a=G.el*3+i*Math.PI;drawStar((i?1:-1)*(w/2+4),Math.sin(a)*4,9)}ctx.restore()}}
function cheer(txt,col){st.cheer={txt,col:col||accent(),t:0,T:110};st.grin=90;play('cheer');buzz([20,40,20]);
 if(typeof confetti==='function'&&G.d)confetti(G.d.x+G.d.w/2,G.d.y-30,calm?12:30)}

// ---------- per fixed step (60/s, same as physics) ----------
function step(){if(typeof G==='undefined'||!G.d)return;const d=G.d;
 if(G.running!==st.running){st.running=G.running;if(st.running){st.lastScore=G.score;st.lastCur=G.cur;st.bossRef=null;wake()}else unwake()}
 if(!G.running){tickFx();return}
 // landing squash + dust; steps
 const onG=!!d.on;if(onG&&!st.wasOn&&st.lastVy>3.5){st.sqv=Math.min(1,st.lastVy/12);st.sq=st.sqv;dust(d.x+d.w/2,d.y+d.h,4,1.6);play('land',.08);if(st.lastVy>11){G.shake=Math.max(G.shake||0,6);play('stomp',.15)}}
 st.wasOn=onG;st.lastVy=d.vy;st.sq*=.82;if(st.sq<.01)st.sq=0;
 if(onG&&d.vx&&!G.roll){st.stepT++;if(st.stepT%(G.fat?18:14)==0)dust(d.x+d.w/2-d.f*d.w*.35,d.y+d.h,1,.6)}
 // super jump = roar
 if(!onG&&d.vy<-14&&!st.roared){st.roared=1;play('roar',.6)}if(onG)st.roared=0;
 // blink / grin timers
 if((st.blinkT-=1/60)<=0){st.blink=8;st.blinkT=rnd(2,4.5)}if(st.blink>0)st.blink--;if(st.grin>0)st.grin--;
 // score sparkles + chime
 if(G.score>st.lastScore){const dlt=G.score-st.lastScore;st.hudPulse=1;const n=calm?2:Math.min(8,2+Math.floor(dlt/50));for(let i=0;i<n;i++){if(st.sparks.length>=MAXP)st.sparks.shift();st.sparks.push({hud:1,x:20+rnd(0,70),y:34+rnd(-6,6),vx:rnd(-1,1),vy:rnd(-1.6,-.4),l:30,L:30,c:pickA(['#fff59d','#ffd54f','#ffffff']),r:2.2,star:1})}
  if(dlt>=20)play('chime',.3);if(dlt>=20&&!calm)spark(d.x+d.w/2,d.y-6,'#fff59d',Math.min(6,1+dlt/40|0),2.2,26)}
 st.lastScore=G.score;st.hudPulse=Math.max(0,st.hudPulse-.04);
 // level up
 if(G.cur>st.lastCur&&!G.inBonus){cheer('LEVEL '+G.cur+'!');}if(!G.inBonus)st.lastCur=G.cur;
 // boss arrival roar + beaten cheer
 const b=G.boss;if(b&&b!==st.bossRef){st.bossRef=b;st.bossGone=false;st.ghost=b.hp;const cx=b.x+b.w/2,cy=b.y+b.h/2;for(let i=0;i<3;i++)st.rings.push({x:cx,y:cy,r:10+i*-26,R:260,l:1,c:'#ffffff',w:4,sp:5});G.shake=Math.max(G.shake||0,14);play('bigroar');buzz(60);st.roarTxt=80}
 if(b&&b.gone&&!st.bossGone){st.bossGone=true;cheer('BOSS BEATEN!','#ffd54f');starBurst(b.x+b.w/2,b.y+b.h/2,'#ffd54f')}
 if(st.roarTxt>0)st.roarTxt--;
 // leaves
 const want=calm||G.inBonus?0:10;if(st.leaves.length<want&&Math.random()<.04)st.leaves.push({x:rnd(0,VW),y:-8,vx:rnd(-.6,-.1),vy:rnd(.35,.7),a:rnd(0,TAU),va:rnd(-.05,.05),ph:rnd(0,TAU),k:Math.random()<.5});
 st.leaves=st.leaves.filter(l=>{l.x+=l.vx+Math.sin(G.el*1.5+l.ph)*.5;l.y+=l.vy;l.a+=l.va;return l.y<VH*.75&&l.x>-10});if(calm)st.leaves.length=0;
 if(st.cheer&&++st.cheer.t>=st.cheer.T)st.cheer=null;
 tickFx()}
function tickFx(){st.sparks=st.sparks.filter(s=>{s.x+=s.vx;s.y+=s.vy;if(!s.hud)s.vy+=.08;s.vx*=.97;return --s.l>0});st.rings=st.rings.filter(r=>{r.r+=r.sp||((r.R-r.r)*.12+1);r.l-=r.sp?.016:.05;return r.l>0&&r.r<r.R+40})}
function shakeOff(){const s=G.shake||0;if(!s||calm)return [0,0];const a=Math.min(3,s*.18);return [Math.sin(G.el*53)*a,Math.cos(G.el*41)*a*.7]}
function flashA(f){return Math.min(calm?.08:.3,f)}
function roarText(){if(st.roarTxt>0&&G.boss&&!G.boss.gone){const k=st.roarTxt/80;ctx.globalAlpha=Math.min(1,k*2);pxText('ROAR!',G.boss.x+G.boss.w/2,G.boss.y-70-(1-k)*20,22,'#ffea00','center');ctx.globalAlpha=1}}

// ---------- end-of-run stars ----------
function award(g){const n=starsFor(g.score,Math.max(0,(g.bossN||0)-(g.boss&&!g.boss.gone?1:0)));stars+=n;saveDress();const el=document.getElementById('dstars');if(el){el.textContent='+'+n+' ⭐ for Dress up! (you have '+stars+')';el.classList.remove('hide')}return n}

// ---------- dress-up screen ----------
function icon(kind,it){const c=mk(54,54),x=c.getContext('2d');x.imageSmoothingEnabled=false;
 if(kind==='c'){const p=it.G?it:DINO_PAL[typeof pick!=='undefined'?pick:0];x.fillStyle=OUT;x.beginPath();x.arc(27,27,22,0,TAU);x.fill();x.fillStyle=p.G;x.beginPath();x.arc(27,27,19,0,TAU);x.fill();x.fillStyle=p.B;x.beginPath();x.arc(30,32,10,0,TAU);x.fill();x.fillStyle='rgba(255,255,255,.7)';x.fillRect(16,16,8,4)}
 else{x.save();x.translate(kind==='h'?27:25,kind==='h'?44:24);x.scale(kind==='h'?4:5,kind==='h'?4:5);x.translate(-11,-2);if(kind==='h')hat(x,true,it.id,0);else{if(it.id==='none'){}else face(x,0,{g:it.id,h:'none'})}x.restore();if(it.id==='none'){x.strokeStyle='#fff8';x.lineWidth=4;x.beginPath();x.arc(27,27,16,0,TAU);x.moveTo(16,38);x.lineTo(38,16);x.stroke()}}
 return c.toDataURL()}
function preview(){const c=document.getElementById('dprev');if(!c)return;const x=c.getContext('2d'),i=typeof pick!=='undefined'?pick:0;x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,c.width,c.height);x.imageSmoothingEnabled=false;
 const sc=Math.floor(Math.min(c.width,c.height)/24),t=performance.now()/1000,bob=Math.abs(Math.sin(t*3))*-sc*.6,s=dinoSpr(i,0);
 x.fillStyle='#0003';x.beginPath();x.ellipse(c.width/2,c.height-sc*2,sc*6,sc*1.2,0,0,TAU);x.fill();
 x.save();x.translate(c.width/2,c.height-sc*2+bob);x.drawImage(s,-9*sc,-18*sc,18*sc,18*sc);x.translate(0,-sc);x.scale(sc,sc);x.translate(-9,-16);face(x,i,{g:on.g,h:on.h,grin:st.dgrin>0,blink:(t%3)<.12,t});x.restore();
 if(st.dgrin>0)st.dgrin--;if(!document.getElementById('dress').classList.contains('hide'))requestAnimationFrame(preview)}
let dtab='c';
function renderDress(){const L=dtab==='c'?COLORS:dtab==='h'?HATS:GLASSES,cur=on[dtab];document.getElementById('dstarN').textContent=stars;
 document.querySelectorAll('#dtabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===dtab));
 document.getElementById('dgrid').innerHTML=L.map(it=>{const own=isOwned(it),sel=cur===it.id;return '<button type="button" data-id="'+it.id+'" class="'+(sel?'sel ':'')+(own?'':'lock')+'" aria-label="'+it.n+'"><img src="'+icon(dtab,it)+'" alt="" draggable="false"><span>'+(own?(sel?'✔ ON':it.n):'🔒 ⭐'+it.cost)+'</span></button>'}).join('')}
function dressTap(e){const b=e.target.closest('button[data-id]');if(!b)return;const L=dtab==='c'?COLORS:dtab==='h'?HATS:GLASSES,it=L.find(q=>q.id===b.dataset.id);if(!it)return;const m=document.getElementById('dmsg');
 if(!isOwned(it)){if(stars>=it.cost){stars-=it.cost;owned.add(it.id);on[dtab]=it.id;saveDress();m.textContent='🎉 You got '+it.n+'!';st.dgrin=60;if(tapped)play('cheer')}else{m.textContent='Need ⭐'+(it.cost-stars)+' more. Play to earn stars!';b.animate&&b.animate([{transform:'translateX(-6px)'},{transform:'translateX(6px)'},{transform:'none'}],{duration:250})}}
 else{on[dtab]=it.id;saveDress();m.textContent=it.n+' on!';st.dgrin=30;if(tapped)play('sparkle')}renderDress()}
function openDress(){document.getElementById('dress').classList.remove('hide');document.getElementById('dmsg').textContent='Tap to unlock with ⭐ stars. Tap again to wear.';renderDress();requestAnimationFrame(preview)}
function setCalm(v){calm=!!v;try{LS.dinoColossus_Calm=calm?'1':'0'}catch(e){}const b=document.getElementById('calmb');if(b){b.textContent=calm?'🌙 Calm: ON':'✨ Calm: OFF';b.setAttribute('aria-pressed',calm)}if(calm){st.leaves.length=0}}
function initUI(){const $=id=>document.getElementById(id);if(!$('dress'))return;
 $('dressb').onclick=openDress;$('dressx').onclick=()=>{$('dress').classList.add('hide');if(typeof renderPick==='function')renderPick()};
 $('dtabs').addEventListener('click',e=>{const b=e.target.closest('button[data-t]');if(b){dtab=b.dataset.t;renderDress()}});$('dgrid').addEventListener('click',dressTap);
 $('calmb').onclick=()=>setCalm(!calm);setCalm(calm)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initUI);else setTimeout(initUI,0);

return {step,bgFar,fgNear,leavesDraw,fxWorld,pickupGlow,bossAura,bossBar,hudBack,hudFront,roarText,shakeOff,flashA,dinoSpr,dinoDecor,pal,sqs,wobble,starBurst,dust,play,buzz,award,cheer,setCalm,
 get calm(){return calm},get stars(){return stars},set stars(v){stars=v;saveDress()},get on(){return on},owned:()=>[...owned],SOUNDS,COLORS,HATS,GLASSES,starsFor,st,BUF,SRC,get tapped(){return tapped},LOOP,get mKey(){return mSrc?mSrc.k:null},bpm,openDress}})();

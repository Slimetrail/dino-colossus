'use strict';
// v21 cinematic intro: plays every time the app opens (cold launch, reload, and pageshow restore), tap to skip, ends at the title.
// All drawn on a canvas (no new files). Sound: only the existing CC0 effects (roar/stomp/land/cheer) via VIS.play, which already respects mute and needs a first tap.
const INTRO=(()=>{
const TAU=Math.PI*2,off=/[?&]intro=0\b/.test(location.search);
let cv=null,x=null,W=0,H=0,S=1,VW=844,VH=390,GY=300,DPR=1,raf=0,t0=0,last=0,T=0,ST=0,playing=false,ending=0,calm=false,TS=1,runs=0,lastEnd=null,paused=0,pauseAt=0,skipAt=0,shownAt=0;
let L=null,P={smoke:[],lava:[],ash:[],dust:[]},fired={},ft=[],wk=[],prevC=[0,0,0,0];
// r2 timeline (seconds at normal speed, from performance.now so slow phones keep the same length):
// chase 0-3.4, eruption 3.4, boulder launch 3.65, landing 4.7, 0.1 s freeze, 0.3 s shake, stars 4.8+, lava title 5.2 (lit by 5.6), fade 8.7-9.5
const TE=3.4,TB=3.65,TI=4.7,FZ=.1,TT=5.2,TEND=8.7,FADE=.8;
const R=(a,b)=>a+Math.random()*(b-a),cl=(v,a,b)=>Math.max(a,Math.min(b,v)),ease=p=>p<0?0:p>1?1:p*p*(3-2*p);
function hs(n){n=Math.sin(n*91.7+3.1)*43758.5453;return n-Math.floor(n)}
function title(){const h=document.querySelector('#start h1');return ((h&&h.textContent)||'Dino Colossus').trim()}
function mkc(w,h){const c=document.createElement('canvas');c.width=Math.ceil(w*DPR);c.height=Math.ceil(h*DPR);const g=c.getContext('2d');g.scale(DPR,DPR);return [c,g]}
function size(){W=innerWidth;H=innerHeight;DPR=Math.min(+(window.INTRO_DPR||1.25),devicePixelRatio||1);S=Math.min(H/390,W/700);VW=W/S;VH=H/S;GY=VH*.77;
 cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);L=null}
// ---------- pre-rendered layers (drawn once per size) ----------
function layers(){if(L)return L;L={};
 // skin texture
 let [c,g]=mkc(64,64);for(let i=0;i<70;i++){g.fillStyle=`rgba(${20+hs(i)*30|0},${30+hs(i+5)*30|0},10,${.12+hs(i+9)*.25})`;g.beginPath();g.ellipse(hs(i+1)*64,hs(i+2)*64,1.5+hs(i+3)*4,1+hs(i+4)*2.5,hs(i+7)*3,0,TAU);g.fill()}
 L.skinC=c;
 // far mountains (period 1000)
 [c,g]=mkc(1000,230);g.translate(0,-(GY-210));g.fillStyle='#6f7f8c';g.beginPath();g.moveTo(0,VH);for(let i=0;i<=1000;i+=10){const y=GY-95-55*Math.abs(Math.sin(i*.006+1))-25*Math.sin(i*.021)-12*Math.sin(i*.07);g.lineTo(i,y)}g.lineTo(1000,VH);g.fill();
 let gr=g.createLinearGradient(0,GY-180,0,GY);gr.addColorStop(0,'rgba(200,190,170,0)');gr.addColorStop(1,'rgba(205,190,160,.55)');g.fillStyle=gr;g.fillRect(0,GY-200,1000,220);L.far=c;
 // mid hills + tree ferns (period 800)
 [c,g]=mkc(800,150);g.translate(0,-(GY-130));g.fillStyle='#55693a';g.beginPath();g.moveTo(0,VH);for(let i=0;i<=800;i+=8)g.lineTo(i,GY-38-18*Math.sin(i*TAU/800*2)-8*Math.sin(i*TAU/800*5));g.lineTo(800,VH);g.fill();
 for(let k=0;k<7;k++){const tx=40+k*112+hs(k)*40,ty=GY-30-14*Math.sin(tx*TAU/800*2),th=50+hs(k+3)*40;g.strokeStyle='#3d2f22';g.lineWidth=4;g.beginPath();g.moveTo(tx,ty);g.quadraticCurveTo(tx+6,ty-th/2,tx+2,ty-th);g.stroke();
  for(let f=0;f<9;f++){const a=-Math.PI/2+(f-4)*.36;g.strokeStyle=f%2?'#3f5a27':'#4d6b2f';g.lineWidth=3;g.beginPath();g.moveTo(tx+2,ty-th);g.quadraticCurveTo(tx+2+Math.cos(a)*22,ty-th+Math.sin(a)*22-8,tx+2+Math.cos(a)*38,ty-th+Math.sin(a)*30+14);g.stroke()}}
 gr=g.createLinearGradient(0,GY-90,0,GY);gr.addColorStop(0,'rgba(210,195,165,.0)');gr.addColorStop(1,'rgba(210,195,165,.35)');g.fillStyle=gr;g.fillRect(0,GY-100,800,100);L.mid=c;
 // ground (period 512)
 [c,g]=mkc(512,VH-GY+4);gr=g.createLinearGradient(0,0,0,VH-GY);gr.addColorStop(0,'#7b6a45');gr.addColorStop(.25,'#6a5a3a');gr.addColorStop(1,'#3e3322');g.fillStyle=gr;g.fillRect(0,0,512,VH-GY+4);
 for(let i=0;i<160;i++){const px=hs(i)*512,py=4+hs(i+1)*(VH-GY);g.fillStyle=`rgba(${hs(i+2)>.5?40:150},${hs(i+2)>.5?30:130},20,${.15+hs(i+3)*.2})`;g.fillRect(px,py,2+hs(i+4)*5,1.5)}
 for(let i=0;i<26;i++){const px=hs(i+40)*512;g.strokeStyle=hs(i+41)>.5?'#6d7d35':'#58682b';g.lineWidth=1.5;for(let b=-2;b<=2;b++){g.beginPath();g.moveTo(px,3);g.lineTo(px+b*3,-5-hs(i+b)*5);g.stroke()}}
 for(let i=0;i<8;i++){const px=hs(i+70)*512,py=10+hs(i+71)*30,r=3+hs(i+72)*5;gr=g.createRadialGradient(px-r/3,py-r/3,1,px,py,r);gr.addColorStop(0,'#a09684');gr.addColorStop(1,'#4c443a');g.fillStyle=gr;g.beginPath();g.ellipse(px,py,r*1.4,r,0,0,TAU);g.fill()}
 L.ground=c;
 // near foreground ferns (period 700)
 [c,g]=mkc(700,80);for(let k=0;k<5;k++){const bx=60+k*140+hs(k+90)*50;for(let f=0;f<7;f++){const a=-Math.PI/2+(f-3)*.4;g.strokeStyle=f%2?'#2c3d1a':'#344a1f';g.lineWidth=5;g.beginPath();g.moveTo(bx,82);g.quadraticCurveTo(bx+Math.cos(a)*30,82+Math.sin(a)*40,bx+Math.cos(a)*60,82+Math.sin(a)*45+25);g.stroke()}} L.near=c;
 const puff=(r,g,b)=>{const[c,q]=mkc(64,64),gr=q.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,`rgba(${r},${g},${b},1)`);gr.addColorStop(.5,`rgba(${r},${g},${b},.45)`);gr.addColorStop(1,`rgba(${r},${g},${b},0)`);q.fillStyle=gr;q.fillRect(0,0,64,64);return c};
 L.smoke=puff(70,62,58);L.dust=puff(170,150,115);L.glow=puff(255,110,20);L.sglow=puff(255,230,140);L.crater=puff(255,190,80);
 [c,g]=mkc(VW,GY+20);let sg=g.createLinearGradient(0,0,0,GY);sg.addColorStop(0,'#5d7f98');sg.addColorStop(.7,'#c9b48e');sg.addColorStop(1,'#d8c49a');g.fillStyle=sg;g.fillRect(0,0,VW,GY+20);L.sky=c;
 [c,g]=mkc(VW,GY+20);sg=g.createLinearGradient(0,0,0,GY);sg.addColorStop(0,'rgba(70,30,25,.55)');sg.addColorStop(1,'rgba(220,90,30,.35)');g.fillStyle=sg;g.fillRect(0,0,VW,GY+20);g.fillStyle='rgba(120,60,30,.12)';g.fillRect(0,GY-120,VW,140);L.red=c;[c,g]=mkc(VW,GY+20);g.drawImage(L.sky,0,0,VW,GY+20);g.drawImage(L.red,0,0,VW,GY+20);L.sky2=c;
 const BR=118,BS=Math.ceil(BR*3.4),sx=x;L.BS=BS;
 [c,g]=mkc(BS,BS);x=g;boulder(BS/2,BS/2,BR,0,0);L.rock=c;[c,g]=mkc(BS,BS);x=g;boulder(BS/2,BS/2,BR,0,1);L.hot=c;
 [c,g]=mkc(260,150);x=g;lavaTitle(130,70,1,0,0);L.txt=c;[c,g]=mkc(260,150);x=g;lavaTitle(130,70,1,0,1);L.tglow=c;
 [c,g]=mkc(600,200);g.translate(0,-(GY-200));x=g;cone({x:300,y:GY-190});L.cone=c;
 // r2 baked dinosaur parts (same palette): running body+neck+head, near/far legs, flattened pose
 [c,g]=mkc(560,280);g.translate(280,200);x=g;dinoBody();L.dbody=c;
 [c,g]=mkc(64,150);g.translate(32,38);x=g;legSpr(0);L.legN=c;[c,g]=mkc(64,150);g.translate(32,38);x=g;legSpr(1);L.legF=c;
 [c,g]=mkc(640,150);g.translate(290,130);x=g;dinoFlatSpr();L.flat=c;
 [c,g]=mkc(48,48);g.translate(24,24);x=g;{const r=20,gg=x.createRadialGradient(-r*.2,-r*.3,0,0,0,r);gg.addColorStop(0,'#fffbe6');gg.addColorStop(.5,'#ffd75e');gg.addColorStop(1,'#d9961c');x.fillStyle=gg;x.strokeStyle='rgba(120,70,10,.6)';x.lineWidth=1.3;x.beginPath();for(let k=0;k<10;k++){const q=k*Math.PI/5-Math.PI/2,rr=k%2?r*.46:r;x.lineTo(Math.cos(q)*rr,Math.sin(q)*rr)}x.closePath();x.fill();x.stroke()}L.star=c;
 [c,g]=mkc(640,280);g.translate(290-dinoX(),260-GY);x=g;dinoFlat(dinoX());shadow(dinoX(),118*1.15,.4);rock(dinoX(),GY-118,1,0,0);L.rest=c;x=sx;
 return L}
function tile(c,P,speed,y,cam){const o=((cam*speed)%P+P)%P;for(let px=-o;px<VW;px+=P)x.drawImage(c,px,y,P,c.height/DPR)}
// ---------- camera / timeline ----------
function camAt(t){const v=240,s=4.0;if(t<s)return v*t;if(t<TI){const d=t-s,D=TI-s;return v*s+v*(d-d*d/(2*D))}return v*s+v*(TI-s)/2}
function dinoX(){return VW*.29}
function volc(){return {x:VW*.6-camAt(ST)*.03,y:GY-190}}
// ---------- drawing helpers ----------
function shadow(cx,w,a,h){x.fillStyle=`rgba(20,15,5,${a})`;x.beginPath();x.ellipse(cx,GY+3,w,h||7,0,0,TAU);x.fill()}
function skinGrad(y0,y1){const g=x.createLinearGradient(0,y0,0,y1);g.addColorStop(0,'#46512c');g.addColorStop(.3,'#76834d');g.addColorStop(.62,'#7a8150');g.addColorStop(1,'#4c4a2d');return g} // dark back -> lit side -> darker belly
function skinTex(a){x.save();x.globalAlpha=a;x.fillStyle=x.createPattern(L.skinC,'repeat');x.fill();x.restore()}
function folds(list){x.save();x.strokeStyle='rgba(28,30,14,.38)';x.lineWidth=1.4;x.lineCap='round';for(const f of list){x.beginPath();x.moveTo(f[0],f[1]);x.quadraticCurveTo(f[2],f[3],f[4],f[5]);x.stroke()}x.restore()}
// heavy-browed head with a slightly open toothy mouth; origin at back of skull. dazed=half-closed eye + loose tongue
function headShape(dazed){const g=x.createLinearGradient(0,-26,0,20);g.addColorStop(0,'#46512c');g.addColorStop(.45,'#7a8650');g.addColorStop(1,'#5a5934');
 // mouth interior
 x.fillStyle='#3a1410';x.beginPath();x.moveTo(14,3);x.lineTo(54,1);x.lineTo(48,13);x.lineTo(12,8);x.closePath();x.fill();
 // lower jaw (open)
 x.fillStyle=g;x.beginPath();x.moveTo(-6,8);x.lineTo(14,6);x.lineTo(48,12);x.quadraticCurveTo(51,18,42,19);x.lineTo(8,19);x.quadraticCurveTo(-6,17,-6,8);x.closePath();x.fill();
 x.fillStyle='#e9e1c8';for(let i=0;i<4;i++){const tx=22+i*7;x.beginPath();x.moveTo(tx,11.5+i*.4);x.lineTo(tx+2.2,7.5+i*.3);x.lineTo(tx+4.4,11.8+i*.4);x.closePath();x.fill()}
 // upper head with brow ridge
 x.fillStyle=g;x.beginPath();x.moveTo(-20,-10);x.bezierCurveTo(-14,-24,4,-28,12,-24);x.quadraticCurveTo(20,-27,26,-20);x.quadraticCurveTo(40,-15,52,-7);x.quadraticCurveTo(59,-3,55,2);x.lineTo(14,4);x.lineTo(-6,9);x.bezierCurveTo(-16,8,-22,2,-20,-10);x.closePath();x.fill();
 skinTex(.6);x.strokeStyle='rgba(25,28,12,.45)';x.lineWidth=1.2;x.stroke();
 x.fillStyle='#e9e1c8';for(let i=0;i<5;i++){const tx=18+i*7;x.beginPath();x.moveTo(tx,3.6-i*.25);x.lineTo(tx+2.2,8-i*.2);x.lineTo(tx+4.4,3.4-i*.25);x.closePath();x.fill()}
 // brow ridge shading + narrow eye
 x.fillStyle='rgba(25,28,12,.55)';x.beginPath();x.ellipse(14,-17,11,3.4,-.12,0,TAU);x.fill();
 x.fillStyle='#120b04';x.beginPath();x.ellipse(15,-12,4.6,1.6,-.1,0,TAU);x.fill();
 if(dazed){x.fillStyle='#6d7a46';x.beginPath();x.ellipse(15,-12.6,5.2,1.9,-.1,Math.PI,TAU);x.fill();x.strokeStyle='#2b2a14';x.lineWidth=1.2;x.beginPath();x.ellipse(15,-12.4,5,1.2,-.1,0,Math.PI);x.stroke()}
 else{x.fillStyle='#c8901e';x.beginPath();x.arc(16.4,-12.2,1.1,0,TAU);x.fill()}
 x.fillStyle='#1d160b';x.beginPath();x.ellipse(50,-4,1.8,1.1,-.3,0,TAU);x.fill();
 // jaw muscle fold
 x.strokeStyle='rgba(25,28,12,.4)';x.lineWidth=1.2;x.beginPath();x.moveTo(-8,-2);x.quadraticCurveTo(0,4,-2,12);x.stroke();
 if(dazed){x.fillStyle='#b5605e';x.strokeStyle='#7a3634';x.lineWidth=1;x.beginPath();x.moveTo(36,12);x.bezierCurveTo(40,22,50,26,58,22);x.quadraticCurveTo(62,20,60,24);x.bezierCurveTo(52,31,38,27,32,13);x.closePath();x.fill();x.stroke()}}
// running body + lowered neck reaching for the human (baked once)
function dinoBody(){const hx=200,hy=-92;
 x.beginPath();x.moveTo(-262,12);x.quadraticCurveTo(-150,-30,-80,-44);x.bezierCurveTo(-25,-72,60,-68,92,-34);x.bezierCurveTo(128,-64,150,-98,hx-18,hy-14);
 x.lineTo(hx-6,hy+12);x.bezierCurveTo(158,-60,146,-18,114,16);x.bezierCurveTo(86,56,-55,60,-92,24);x.quadraticCurveTo(-160,22,-262,14);x.closePath();
 x.fillStyle=skinGrad(-75,60);x.fill();skinTex(.75);x.strokeStyle='rgba(28,32,14,.4)';x.lineWidth=1.5;x.stroke();
 folds([[96,-30,104,-8,100,14],[108,-44,118,-30,116,-12],[60,-20,66,0,60,22],[-48,-30,-40,-6,-50,20],[150,-70,162,-62,166,-48],[-150,-6,-140,4,-150,14]]);
 x.fillStyle='rgba(255,245,200,.07)';x.beginPath();x.ellipse(-10,-46,90,9,-.04,0,TAU);x.fill();
 x.save();x.translate(hx-14,hy+2);x.rotate(.12);headShape(false);x.restore()}
// pillar leg: knee bulge, narrow ankle, darker inner edge, rounded pad with 3 toenails. origin = hip, foot sole at y=100
function legSpr(far){const g=x.createLinearGradient(-20,0,20,0);g.addColorStop(0,far?'#262d17':'#36401f');g.addColorStop(.55,far?'#48532c':'#6f7c47');g.addColorStop(1,far?'#353d20':'#4d5830');x.fillStyle=g;
 x.beginPath();x.moveTo(-22,-34);x.lineTo(-19,0);x.bezierCurveTo(-21,22,-17,38,-15,50);x.bezierCurveTo(-12,62,-10,76,-10,86);x.bezierCurveTo(-15,90,-17,97,-13,101);x.lineTo(17,101);x.bezierCurveTo(22,100,22,93,13,88);
 x.bezierCurveTo(10,78,15,62,17,50);x.bezierCurveTo(19,40,19,22,22,-34);x.closePath();x.fill();
 x.strokeStyle='rgba(20,22,10,.4)';x.lineWidth=1.2;x.beginPath();x.moveTo(-12,46);x.quadraticCurveTo(2,52,15,46);x.stroke();x.beginPath();x.moveTo(-10,84);x.quadraticCurveTo(2,88,12,85);x.stroke();
 x.fillStyle='rgba(15,12,6,.45)';x.fillRect(-13,99,30,2);x.fillStyle=far?'#a99f86':'#d9ceb0';for(let i=0;i<3;i++){x.beginPath();x.ellipse(4+i*5.5,99-i*.8,2.6,1.7,0,0,TAU);x.fill()}}
// flattened pose under the boulder (baked): every end closed, pointed tail, soles with nails up, dazed head + tongue
function dinoFlatSpr(){const g=skinGrad(-60,4);
 const flatLeg=(sx,sy,ex,ey,w)=>{const dx=ex-sx,dy=ey-sy,l=Math.hypot(dx,dy),nx=-dy/l,ny=dx/l;const lg=x.createLinearGradient(sx+nx*w,sy+ny*w,sx-nx*w,sy-ny*w);lg.addColorStop(0,'#36401f');lg.addColorStop(.5,'#6f7c47');lg.addColorStop(1,'#3e4824');
  x.fillStyle=lg;x.beginPath();x.moveTo(sx+nx*w,sy+ny*w);x.quadraticCurveTo((sx+ex)/2+nx*w*1.05,(sy+ey)/2+ny*w*1.05,ex+nx*w*.62,ey+ny*w*.62);x.lineTo(ex-nx*w*.62,ey-ny*w*.62);x.quadraticCurveTo((sx+ex)/2-nx*w*.9,(sy+ey)/2-ny*w*.9,sx-nx*w,sy-ny*w);x.closePath();x.fill();
  x.beginPath();x.arc(ex,ey,w*.62,0,TAU);x.fill();
  // upturned foot: rounded pad standing up at the end, tan sole toward the viewer, three nails on top
  const fx=ex+(dx>0?w*.35:-w*.35),fy=ey-w*.25;x.fillStyle='#5f6b3c';x.beginPath();x.ellipse(fx,fy-w*.35,w*.42,w*.78,dx>0?.25:-.25,0,TAU);x.fill();
  x.fillStyle='#8c8160';x.beginPath();x.ellipse(fx+(dx>0?w*.08:-w*.08),fy-w*.3,w*.27,w*.6,dx>0?.25:-.25,0,TAU);x.fill();
  x.fillStyle='#e0d6b8';for(let i=0;i<3;i++){x.beginPath();x.ellipse(fx+(i-1)*w*.24+(dx>0?w*.2:-w*.2),fy-w*1.05+Math.abs(i-1)*w*.12,2.6,1.9,0,0,TAU);x.fill()}};
 // tail tapering to a point
 x.beginPath();x.moveTo(-104,-46);x.bezierCurveTo(-160,-44,-210,-32,-258,-22);x.bezierCurveTo(-210,-18,-160,-8,-104,-4);x.closePath();x.fillStyle=g;x.fill();skinTex(.7);x.strokeStyle='rgba(28,32,14,.4)';x.lineWidth=1.2;x.stroke();
 folds([[-140,-38,-136,-26,-142,-12],[-180,-31,-177,-24,-181,-16]]);
 flatLeg(-80,-30,-150,-14,22);flatLeg(-96,-10,-182,-8,24);flatLeg(40,-12,150,-10,20);
 // neck lying on the ground into the head
 const hx=226,hy=-22;x.beginPath();x.moveTo(20,-56);x.bezierCurveTo(150,-52,200,-40,hx-20,hy-12);x.lineTo(hx-8,hy+12);x.bezierCurveTo(200,-2,150,-2,20,-2);x.closePath();x.fillStyle=g;x.fill();skinTex(.75);x.strokeStyle='rgba(28,32,14,.4)';x.lineWidth=1.4;x.stroke();
 folds([[130,-46,136,-26,130,-4],[176,-40,182,-24,178,-6]]);
 x.save();x.translate(hx-14,hy+4);x.rotate(.06);headShape(true);x.restore()}
function stepFeet(bx,by,ph,bob,dt){const legs=[[Math.PI,-60,1],[0,70,1],[0,-45,0],[Math.PI,85,0]];const out=[];
 legs.forEach(([o,dx,far],i)=>{const sn=Math.sin(ph+o),cs=Math.cos(ph+o),a=sn*.3,lift=Math.max(0,cs)*9,fx=bx+dx+100*Math.sin(a);out.push({o,dx,far,a,lift,fx});
  if(prevC[i]>0&&cs<=0&&dt>0&&P.dust.length<40){for(let k=0;k<(calm?1:3);k++)P.dust.push({x:fx+R(-10,14),y:GY-2,vx:R(-30,30),vy:R(-18,-6),r:R(4,8),a:.45})}prevC[i]=cs});return out}
function dino(bx,t,dt){const by=GY-108,ph=t*7.5,bob=Math.abs(Math.sin(ph))*4;const ft=stepFeet(bx,by,ph,bob,dt);
 shadow(bx,170,.22);for(const f of ft){if(f.lift<3)shadow(f.fx+3,20,.45*(1-f.lift/3),4)}
 const leg=f=>{x.save();x.translate(bx+f.dx,by+8-bob-f.lift);x.rotate(-f.a);x.drawImage(f.far?L.legF:L.legN,-32,-38,64,150);x.restore()};
 ft.filter(f=>f.far).forEach(leg);ft.filter(f=>!f.far).forEach(leg);
 x.drawImage(L.dbody,Math.round((bx-280)*4)/4,by-bob-200+Math.sin(t*3)*1.5,560,280)}
function dinoFlat(bx){x.drawImage(L.flat,bx-290,GY-130,640,150);return {hx:bx+226,hy:GY-34}}
// orbiting stars: big, soft gold glow, a full ring around the head drawn in front of the scenery
function stars(cx,cy,t,a){if(a<=0)return;x.save();x.globalAlpha=a*.5;x.drawImage(L.sglow,cx-80,cy-74,160,80);const n=5;for(let i=0;i<n;i++){const an=t*2.8+i*TAU/n,sx=cx+Math.cos(an)*56,sy=cy-34+Math.sin(an)*15,dp=.75+.25*Math.sin(an),r=18*dp;
 x.globalAlpha=a*(.75+.25*dp);
 x.save();x.translate(sx,sy);x.rotate(t*.8+i);x.drawImage(L.star,-r*1.2,-r*1.2,r*2.4,r*2.4);x.restore()}
 x.globalAlpha=a*.35;x.strokeStyle='#ffe9a0';x.lineWidth=1;x.beginPath();x.ellipse(cx,cy-34,56,15,0,0,TAU);x.stroke();x.restore()}
// human (1.5x): darker shaded skin, leather wrap. mode: run (fear: arms thrown up, head looking back, mouth open) | stand | cheer
function human(hx,t,mode,face,jump){const ph=t*11;shadow(hx,22*(1-jump/70),.3*(1-jump/90),5);x.save();x.translate(hx,GY-jump);x.scale(face*1.5,1.5);
 const lim=(ax,ay,a1,l1,a2,l2,w,c)=>{const kx=ax+Math.sin(a1)*l1,ky=ay+Math.cos(a1)*l1,ex=kx+Math.sin(a2)*l2,ey=ky+Math.cos(a2)*l2;x.strokeStyle=c;x.lineWidth=w;x.lineCap='round';x.lineJoin='round';x.beginPath();x.moveTo(ax,ay);x.lineTo(kx,ky);x.lineTo(ex,ey);x.stroke();return [ex,ey]};
 const lean=mode==='run'?.3:0,hip=[0,-33],sh=[Math.sin(lean)*24,-33-Math.cos(lean)*24];
 const legA=o=>{if(mode==='run'){const s=Math.sin(ph+o);return [s*.8,s*.8-.25-.9*Math.max(0,Math.cos(ph+o))]}if(mode==='cheer')return [(o?.25:-.25),(o?.25:-.25)-(jump>2?.9:.1)];return [o?.08:-.08,o?.08:-.08]};
 const armA=o=>{if(mode==='run'){const w=Math.sin(ph*1.3+o)*.25;return o?[-2.3+w,-2.75+w]:[2.5+w,2.9+w]}if(mode==='cheer'){const w=Math.sin(t*14+o)*.15;return [Math.PI+(o?.45:-.45)+w,Math.PI+(o?.6:-.6)+w]}return [o?.15:-.15,(o?.15:-.15)+.3]};
 const SK1='#5e3720',SK2='#7a4a2b';
 let a=legA(Math.PI),f=lim(hip[0],hip[1],a[0],17,a[1],17,6.2,SK1);x.fillStyle='#2a1d12';x.fillRect(f[0]-2,f[1]-2,8,3);
 a=armA(0);lim(sh[0],sh[1],a[0],13,a[1],12,4.6,SK1);
 x.strokeStyle='#5a3c22';x.lineWidth=12;x.lineCap='round';x.beginPath();x.moveTo(hip[0],hip[1]+2);x.lineTo(sh[0],sh[1]+3);x.stroke();
 x.strokeStyle='rgba(255,225,180,.14)';x.lineWidth=3;x.beginPath();x.moveTo(hip[0]+3,hip[1]);x.lineTo(sh[0]+3,sh[1]+4);x.stroke();
 x.strokeStyle='#3b2616';x.lineWidth=10;x.beginPath();x.moveTo(hip[0]-1,hip[1]+5);x.lineTo(hip[0]+1,hip[1]-2);x.stroke();
 const hd=[sh[0]+Math.sin(lean)*8,sh[1]-8];const sg=x.createRadialGradient(hd[0]+2,hd[1]-2,1,hd[0],hd[1],7.5);sg.addColorStop(0,'#94603d');sg.addColorStop(1,'#5e3720');x.fillStyle=sg;x.beginPath();x.arc(hd[0],hd[1],7,0,TAU);x.fill();
 const back=mode==='run';// in the chase he looks back over his shoulder at the dinosaur
 x.fillStyle='#1d140c';x.beginPath();x.arc(hd[0]+(back?1:-1),hd[1]-2,7.4,Math.PI*.95,Math.PI*2.1);x.fill();x.beginPath();x.ellipse(hd[0]+(back?4:-5),hd[1]+1,3,5,0,0,TAU);x.fill();
 const fx=back?-1:1;x.fillStyle='#f1e6d2';x.beginPath();x.ellipse(hd[0]+4*fx,hd[1]-.8,1.6,1.3,0,0,TAU);x.fill();x.fillStyle='#120b05';x.beginPath();x.arc(hd[0]+4.4*fx,hd[1]-.6,.8,0,TAU);x.fill();
 x.strokeStyle='#1d140c';x.lineWidth=.9;x.beginPath();x.moveTo(hd[0]+2.2*fx,hd[1]-3.4);x.lineTo(hd[0]+5.6*fx,hd[1]-(back?4.4:2.8));x.stroke();
 if(mode!=='stand'){x.fillStyle='#3a140c';x.beginPath();x.ellipse(hd[0]+5*fx,hd[1]+3.6,1.5,back?2.2:1.8+Math.abs(Math.sin(t*10)),0,0,TAU);x.fill()}
 a=legA(0);f=lim(hip[0],hip[1],a[0],17,a[1],17,6.6,SK2);x.fillStyle='#3a2a1a';x.fillRect(f[0]-2,f[1]-2,8,3);
 a=armA(Math.PI);lim(sh[0],sh[1],a[0],13,a[1],12,5,SK2);
 x.restore()}
function boulderPath(r){x.beginPath();const n=24;const pts=[];for(let i=0;i<n;i++){const a=i/n*TAU,rr=r*(.84+hs(i+11)*.14+.06*Math.sin(a*3+1.3)+.04*Math.sin(a*5));pts.push([Math.cos(a)*rr*1.1,Math.sin(a)*rr*(a>.3&&a<2.8?.94:1)])}
 for(let i=0;i<=n;i++){const p=pts[i%n],q=pts[(i+1)%n],m=[(p[0]+q[0])/2,(p[1]+q[1])/2];i?x.quadraticCurveTo(p[0],p[1],m[0],m[1]):x.moveTo(m[0],m[1])}x.closePath()}
const crack=(r,k)=>{x.beginPath();let px=(hs(k+400)-.5)*r*1.4,py=(hs(k+401)-.5)*r*1.4;x.moveTo(px,py);for(let s=0;s<4;s++){px+=(hs(k*7+s)-.5)*r*.5;py+=(hs(k*5+s+1)-.5)*r*.5;x.lineTo(px,py)}x.stroke()};
// baked once: lumpy outline, layered strata, soil streaks, few pits, lava rim light on the volcano (right) side
function boulder(cx,cy,r,rot,heat){x.save();x.translate(cx,cy);x.rotate(rot);
 if(heat>0){x.save();x.globalAlpha=heat*.8;const g=x.createRadialGradient(0,0,r*.6,0,0,r*1.5);g.addColorStop(0,'rgba(255,120,20,.7)');g.addColorStop(1,'rgba(255,80,0,0)');x.fillStyle=g;x.fillRect(-r*1.6,-r*1.6,r*3.2,r*3.2);x.restore()}
 boulderPath(r);const g=x.createRadialGradient(-r*.35,-r*.45,r*.1,0,0,r*1.2);g.addColorStop(0,'#8f8474');g.addColorStop(.5,'#5d5245');g.addColorStop(1,'#29221c');x.fillStyle=g;x.fill();
 x.save();x.clip();
 // strata bands
 for(let k=0;k<7;k++){const y0=-r+k*r*.3+hs(k+90)*r*.1;x.strokeStyle=k%2?'rgba(25,18,12,.32)':'rgba(205,190,165,.13)';x.lineWidth=k%2?2.2:4;x.beginPath();x.moveTo(-r*1.2,y0+r*.12);
  for(let s=1;s<=6;s++){x.lineTo(-r*1.2+s*r*.4,y0+r*.12-s*r*.05+(hs(k*9+s)-.5)*r*.09)}x.stroke()}
 // dark soil streaks running down
 for(let k=0;k<9;k++){const sx=(hs(k+600)-.5)*1.8*r,sy=(hs(k+601)-.5)*1.2*r;x.strokeStyle=`rgba(40,26,14,${.18+hs(k+602)*.2})`;x.lineWidth=3+hs(k+603)*6;x.lineCap='round';x.beginPath();x.moveTo(sx,sy);x.quadraticCurveTo(sx+r*.05,sy+r*.25,sx-r*.03,sy+r*(.35+hs(k+604)*.35));x.stroke()}
 // only a few shallow pits
 for(let i=0;i<5;i++){const px=(hs(i+200)-.5)*1.5*r,py=(hs(i+201)-.5)*1.5*r,pr=3+hs(i+202)*r*.06;x.fillStyle='rgba(20,14,10,.28)';x.beginPath();x.ellipse(px,py,pr*1.4,pr*.8,.3,0,TAU);x.fill();x.fillStyle='rgba(230,215,190,.1)';x.beginPath();x.ellipse(px+1,py+pr*.6,pr*1.2,pr*.35,.3,0,Math.PI);x.fill()}
 x.fillStyle='rgba(255,240,220,.07)';for(let i=0;i<40;i++){x.fillRect((hs(i+300)-.5)*2*r,(hs(i+301)-.5)*2*r,2,1.5)}
 // shadowed underside + lava rim light from the volcano side
 let lg=x.createLinearGradient(0,r*.2,0,r);lg.addColorStop(0,'rgba(10,6,4,0)');lg.addColorStop(1,'rgba(10,6,4,.45)');x.fillStyle=lg;x.fillRect(-r*1.3,-r*1.3,r*2.6,r*2.6);
 lg=x.createLinearGradient(r*.45,-r*.3,r*1.12,r*.1);lg.addColorStop(0,'rgba(255,110,30,0)');lg.addColorStop(.75,'rgba(255,120,35,.38)');lg.addColorStop(1,'rgba(255,170,70,.75)');x.fillStyle=lg;x.fillRect(-r*1.3,-r*1.3,r*2.6,r*2.6);
 x.strokeStyle='rgba(15,10,8,.55)';x.lineWidth=2;for(let k=0;k<4;k++)crack(r,k);
 if(heat>0){x.strokeStyle=`rgba(255,${120+heat*100|0},30,${heat})`;x.lineWidth=2.5;x.shadowColor='#ff6a00';x.shadowBlur=8;for(let k=0;k<4;k++)crack(r,k)}
 x.restore();boulderPath(r);x.strokeStyle='rgba(10,8,6,.5)';x.lineWidth=2;x.stroke();x.restore()}
function rock(cx,cy,sc,rot,heat){const B=L.BS*sc;x.save();x.translate(cx,cy);x.rotate(rot);if(heat>=.5)x.drawImage(L.hot,-B/2,-B/2,B,B);else{x.drawImage(L.rock,-B/2,-B/2,B,B);if(heat>0){x.globalAlpha=heat;x.drawImage(L.hot,-B/2,-B/2,B,B)}}x.restore()}
function lavaTitle(cx,cy,a,t,gl){const words=title().toUpperCase().split(/\s+/),top=words[0]||'DINO',bot=words.slice(1).join(' ');x.save();x.globalAlpha=a;x.textAlign='center';x.textBaseline='middle';
 const line=(s,y,sz)=>{x.font=`900 ${sz}px Georgia,'Times New Roman',serif`;let w=x.measureText(s).width;if(w>210){sz*=210/w;x.font=`900 ${sz}px Georgia,'Times New Roman',serif`}
  x.lineJoin='round';x.strokeStyle='#140a05';x.lineWidth=7;x.strokeText(s,cx,y);
  const g=x.createLinearGradient(0,y-sz/2,0,y+sz/2);g.addColorStop(0,'#fff6b0');g.addColorStop(.45,'#ffb300');g.addColorStop(1,'#e2400e');
  if(gl){x.shadowColor='#ff5a00';x.shadowBlur=16;x.fillStyle='#ff7a10';x.fillText(s,cx,y);x.shadowBlur=0;return}x.fillStyle=g;x.fillText(s,cx,y);x.globalAlpha=a*.3;x.fillStyle='#fffbe0';x.fillText(s,cx,y-1);x.globalAlpha=a};
 line(top,cy-22,46);if(bot)line(bot,cy+24,34);
 x.restore()}
function titleLive(cx,cy,a,t){const w=260,h=150;x.save();x.globalAlpha=a*(.55+.45*Math.sin(t*4));x.drawImage(L.tglow,cx-130,cy-70,w,h);x.globalAlpha=a;x.drawImage(L.txt,cx-130,cy-70,w,h);
 x.fillStyle='#ff8a1a';for(let i=0;i<2;i++){const dx=cx+(i?44:-58),len=cl((t-.3-i*.5)*10,0,14);x.beginPath();x.ellipse(dx,cy+40+len/2,2.2,2+len/2,0,0,TAU);x.fill()}x.restore()}
function cone(v){x.save();
 x.fillStyle='#4b4038';x.beginPath();x.moveTo(v.x-260,GY-40);x.lineTo(v.x-40,v.y);x.quadraticCurveTo(v.x,v.y+10,v.x+40,v.y);x.lineTo(v.x+280,GY-40);x.closePath();x.fill();
 const g=x.createLinearGradient(v.x-100,0,v.x+100,0);g.addColorStop(0,'rgba(0,0,0,.25)');g.addColorStop(.5,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(255,255,255,.06)');x.fillStyle=g;x.fill();
 x.strokeStyle='rgba(30,22,18,.6)';x.lineWidth=2;for(let i=0;i<6;i++){x.beginPath();x.moveTo(v.x-30+i*12,v.y+4);x.lineTo(v.x-120+i*45,GY-42);x.stroke()}x.restore()}
function volcano(v,t){const e=cl((t-TE)/.6,0,1);x.drawImage(L.cone,v.x-300,GY-200,600,200);x.save();
 if(e>0){// lava rivers + crater glow
  for(const [lw,col] of [[9,`rgba(255,90,10,${.3*e})`],[3.5,`rgba(255,${150+60*Math.sin(t*5)|0},40,${.9*e})`]]){x.strokeStyle=col;x.lineWidth=lw;x.lineCap='round';
  for(let i=0;i<3;i++){const len=cl((t-TE-.3-i*.3)/1.8,0,1);if(len<=0)continue;const P0=[v.x-14+i*14,v.y+4],P1=[v.x-30+i*30,v.y+40],P2=[v.x-70+i*70+Math.sin(i*2)*20,v.y+90],P3=[v.x-90+i*90,GY-40],n=Math.max(1,Math.round(14*len));x.beginPath();x.moveTo(P0[0],P0[1]);for(let k=1;k<=n;k++){const u=k/14,w=1-u,b0=w*w*w,b1=3*w*w*u,b2=3*w*u*u,b3=u*u*u;x.lineTo(b0*P0[0]+b1*P1[0]+b2*P2[0]+b3*P3[0],b0*P0[1]+b1*P1[1]+b2*P2[1]+b3*P3[1])}x.stroke()}}
  x.globalAlpha=.9*e;x.drawImage(L.crater,v.x-95,v.y-95,190,190)}
 x.restore()}
// ---------- particles ----------
function spawn(dt){const v=volc(),k=calm?.5:1;
 if(T>TE){if(P.smoke.length<36*k&&Math.random()<dt*18)P.smoke.push({x:v.x+R(-15,15),y:v.y,vx:R(-8,14),vy:R(-60,-35),r:R(10,18),a:.85});
  if(T<TI+2&&P.lava.length<26*k&&Math.random()<dt*(T<TE+1.2?40:12))P.lava.push({x:v.x+R(-8,8),y:v.y,vx:R(-90,90),vy:R(-260,-140),r:R(1.8,3.6),l:1});
  if(P.ash.length<50*k&&Math.random()<dt*25)P.ash.push({x:R(0,VW),y:-5,vx:R(-12,4),vy:R(18,38),r:R(.8,1.8)})}}
function stepP(dt){for(const p of P.smoke){p.x+=p.vx*dt;p.y+=p.vy*dt;p.r=Math.min(p.r+dt*14,34);p.a-=dt*.09}P.smoke=P.smoke.filter(p=>p.a>0&&p.y>-120);
 for(const p of P.lava){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=260*dt;p.l-=dt*.45}P.lava=P.lava.filter(p=>p.l>0&&p.y<GY);
 for(const p of P.ash){p.x+=p.vx*dt;p.y+=p.vy*dt}P.ash=P.ash.filter(p=>p.y<GY+10);
 for(const p of P.dust){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=1-dt*1.8;p.vy*=1-dt*1.8;p.r+=dt*22;p.a-=dt*.42}P.dust=P.dust.filter(p=>p.a>0)}
function drawSmoke(){x.save();for(const p of P.smoke){x.globalAlpha=cl(p.a,0,1);x.drawImage(L.smoke,p.x-p.r,p.y-p.r,p.r*2,p.r*2)}
 for(const p of P.lava){x.globalAlpha=p.l*.7;x.drawImage(L.glow,p.x-p.r*3,p.y-p.r*3,p.r*6,p.r*6);x.globalAlpha=p.l;x.fillStyle='#ffd27a';x.fillRect(p.x-p.r/2,p.y-p.r/2,p.r,p.r)}x.restore()}
function drawDust(){x.save();for(const p of P.dust){x.globalAlpha=cl(p.a,0,1);x.drawImage(L.dust,p.x-p.r,p.y-p.r,p.r*2,p.r*2)}x.restore()}
function sfx(k,at){if(ST>=at&&!fired[k+at]){fired[k+at]=1;try{if(typeof VIS!=='undefined')VIS.play(k)}catch(e){}}}
// ---------- frame ----------
function frame(now){if(!playing)return;raf=requestAnimationFrame(frame);const c0=performance.now();try{draw(c0)}finally{wk.push(performance.now()-c0);if(wk.length>2000)wk.shift()}}
// clock: T comes straight from performance.now() (wall clock x calm scale), never from counting frames
function clock(now){return paused?T:(now-t0)/1000*TS}
function draw(now){const fdt=Math.min(.05,(now-(last||now))/1000);if(last)ft.push(now-last);if(ft.length>2000)ft.shift();last=now;
 const pT=T;T=clock(now);if(T>=TEND&&!ending)finish(true);layers();
 // scene time ST: holds still for the FZ impact freeze, then continues
 ST=T<TI?T:T<TI+FZ?TI:T-FZ;const frozen=T>=TI&&T<TI+FZ;const dt=paused||frozen?0:Math.min(.05*TS,Math.max(0,T-pT));
 const cam=camAt(ST),bx=dinoX(),v=volc(),hit=ST>=TI;spawn(dt);stepP(dt);
 let hx=VW*.66,mode='run',face=1,jump=0;if(hit){const d=ST-TI;hx+=50*ease(d/.7);if(d>.7)mode='stand';if(d>.85)face=-1;if(d>1.0){mode='cheer';jump=Math.abs(Math.sin((d-1.0)*5.2))*22}}
 // shake: light rumble at the eruption; at impact a 0.1 s freeze then a 0.3 s hard shake
 let sk=0;if(!calm){if(ST>TE&&ST<TI)sk=4*(1-(ST-TE)/(TI-TE));const ds=T-TI-FZ;if(ds>=0&&ds<.3)sk=11*(1-ds/.3)}
 x.setTransform(DPR*S,0,0,DPR*S,0,0);if(sk)x.translate(R(-sk,sk),R(-sk,sk));
 const er=cl((ST-TE)/1.2,0,1);x.drawImage(er>=1?L.sky2:L.sky,-12,-12,VW+24,GY+32);
 if(er>0&&er<1){x.globalAlpha=er;x.drawImage(L.red,-12,-12,VW+24,GY+32);x.globalAlpha=1}
 tile(L.far,1000,.08,GY-210,cam);volcano(v,ST);drawSmoke();tile(L.mid,800,.35,GY-130,cam);
 tile(L.ground,512,1,GY-2,cam);
 const tx=bx,ty=GY-118,BR=118;let bp=null,hd=null,sa=0;
 if(ST>=TB&&!hit){const p=(ST-TB)/(TI-TB),q=Math.pow(p,1.4);bp={x:v.x+(tx-v.x)*p,y:v.y+(ty-v.y)*q-230*4*p*(1-p),r:BR*(.22+.78*q),rot:(1-p)*5,h:1-p*.5}}
 if(!hit){dino(bx,ST,dt);if(bp){const sh=cl((ST-TB-.45)/.6,0,1);if(sh>0){x.fillStyle=`rgba(10,8,5,${.35*sh})`;x.beginPath();x.ellipse(bx,GY+2,BR*1.1*sh,10*sh,0,0,TAU);x.fill()}}}
 else{if(!fired.dust){fired.dust=1;const n=calm?14:28;for(let i=0;i<n;i++){const a=R(Math.PI,TAU);P.dust.push({x:bx+R(-110,110),y:GY-R(0,30),vx:Math.cos(a)*R(60,200),vy:Math.sin(a)*R(20,90),r:R(10,22),a:.8})}}
  const d=ST-TI,bnc=d<.4?-Math.abs(Math.sin(d*Math.PI*2.5))*12*(1-d/.4):0,ht=cl(.5-d*.25,0,.5);
  if(bnc){hd=dinoFlat(bx);shadow(bx,BR*1.15,.4);rock(bx,ty+bnc,1,0,ht)}else{hd={hx:bx+226,hy:GY-34};x.drawImage(L.rest,bx-290,GY-260,640,280);if(ht>0){x.globalAlpha=ht;x.drawImage(L.hot,bx-L.BS/2,ty-L.BS/2,L.BS,L.BS);x.globalAlpha=1}}
  sa=cl((T-TI-FZ-.3)/.25,0,1);titleLive(bx,ty,cl((T-TT)/.4,0,1),T-TT+1)}
 human(hx,ST,mode,face,jump);
 if(bp)rock(bp.x,bp.y,bp.r/BR,bp.rot,bp.h);
 drawDust();
 if(!calm&&L.near)tile(L.near,700,1.35,VH-80,cam);
 x.fillStyle='rgba(60,50,45,.6)';for(const p of P.ash)x.fillRect(p.x,p.y,p.r,p.r);
 if(hd)stars(hd.hx,hd.hy,T,sa); // after the near ferns so nothing covers the ring
 if(ST>TE&&ST<TE+.35){x.fillStyle=`rgba(255,200,120,${.35*(1-(ST-TE)/.35)})`;x.fillRect(-20,-20,VW+40,VH+40)}
 if(T>=TI&&T<TI+.2){x.fillStyle=`rgba(255,240,220,${.4*(1-(T-TI)/.2)})`;x.fillRect(-20,-20,VW+40,VH+40)}
 x.setTransform(DPR*S,0,0,DPR*S,0,0);x.fillStyle='#000';x.fillRect(0,0,VW,14);x.fillRect(0,VH-14,VW,14);
 x.fillStyle='rgba(255,255,255,.8)';x.font='bold 12px sans-serif';x.textAlign='right';x.textBaseline='middle';x.fillText('Tap to skip \u25B8',VW-14,VH-7);
 sfx('roar',1.0);sfx('roar',TE+.1);sfx('land',TI);sfx('stomp',TI+.05);sfx('cheer',TI+1.0)}
// ---------- lifecycle ----------
function start(why){if(off)return false;if(!cv){cv=document.createElement('canvas');cv.id='intro';cv.setAttribute('aria-label','Intro movie. Tap to skip.');
  cv.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;z-index:50;background:#000;touch-action:none;transition:opacity .6s';document.body.appendChild(cv);x=cv.getContext('2d');
  cv.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();skipAt=performance.now();finish(false)});addEventListener('resize',()=>{if(playing)size()})}
 calm=!!(typeof VIS!=='undefined'&&VIS.calm)||matchMedia('(prefers-reduced-motion: reduce)').matches;TS=calm?1.5:1;
 cancelAnimationFrame(raf);size();T=0;ST=0;last=0;ending=0;paused=0;prevC=[0,0,0,0];fired={};P={smoke:[],lava:[],ash:[],dust:[]};ft=[];wk=[];playing=true;runs++;lastEnd=null;
 cv.style.transition='opacity .35s';cv.style.display='block';cv.style.opacity='1';cv.style.pointerEvents='auto';t0=performance.now();raf=requestAnimationFrame(frame);return true}
function finish(natural){if(!playing||ending)return;ending=1;lastEnd=natural?'end':'skip';cv.style.transition=natural?`opacity ${FADE/TS}s`:'opacity .3s';cv.style.opacity='0';
 setTimeout(()=>{playing=false;cancelAnimationFrame(raf);cv.style.display='none';cv.style.pointerEvents='none';shownAt=performance.now()},natural?FADE/TS*1000:350)}
addEventListener('keydown',e=>{if(playing&&!ending){skipAt=performance.now();finish(false)}},true);
addEventListener('pageshow',e=>{if(e.persisted&&!(typeof G!=='undefined'&&G&&G.running))start('pageshow')});
start('launch');
function stats(){const a=ft.slice(5).sort((p,q)=>p-q);if(!a.length)return null;const avg=a.reduce((s,v)=>s+v,0)/a.length;const w=wk.slice(5).sort((p,q)=>p-q),wa=w.reduce((s,v)=>s+v,0)/w.length;return {n:a.length,avg,p95:a[Math.floor(a.length*.95)],max:a[a.length-1],fps:1000/avg,drawAvg:wa,drawP95:w[Math.floor(w.length*.95)]}}
return {start,finish,stats,seek:v=>{t0=performance.now()-v/TS*1000;if(paused)T=v},pause:()=>{if(!paused){paused=1;pauseAt=performance.now()}},resume:()=>{if(paused){t0+=performance.now()-pauseAt;paused=0}},get hiddenAt(){return shownAt},get skipAt(){return skipAt},get T(){return T},get playing(){return playing},get runs(){return runs},get lastEnd(){return lastEnd},get calm(){return calm},get off(){return off},
 get counts(){return {smoke:P.smoke.length,lava:P.lava.length,ash:P.ash.length,dust:P.dust.length}},TIMES:{TE,TB,TI,FZ,TT,TEND,FADE,TOTAL:TEND+FADE}};
})();

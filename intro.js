'use strict';
// v21 cinematic intro: plays every time the app opens (cold launch, reload, and pageshow restore), tap to skip, ends at the title.
// All drawn on a canvas (no new files). Sound: only the existing CC0 effects (roar/stomp/land/cheer) via VIS.play, which already respects mute and needs a first tap.
const INTRO=(()=>{
const TAU=Math.PI*2,off=/[?&]intro=0\b/.test(location.search);
let cv=null,x=null,W=0,H=0,S=1,VW=844,VH=390,GY=300,DPR=1,raf=0,t0=0,last=0,T=0,playing=false,ending=0,calm=false,TS=1,runs=0,lastEnd=null;
let L=null,P={smoke:[],lava:[],ash:[],dust:[]},fired={},ft=[],wk=[];
const TE=3.4,TB=6.2,TI=8.0,TF=13.2,TEND=14.0; // eruption, boulder launch, impact, fade start, end (seconds, normal speed)
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
 L.skin=x.createPattern(c,'repeat');
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
 [c,g]=mkc(600,200);g.translate(0,-(GY-200));x=g;cone({x:300,y:GY-190});L.cone=c;x=sx;
 return L}
function tile(c,P,speed,y,cam){const o=((cam*speed)%P+P)%P;for(let px=-o;px<VW;px+=P)x.drawImage(c,px,y,P,c.height/DPR)}
// ---------- camera / timeline ----------
function camAt(t){const v=240,s=6.8;if(t<s)return v*t;if(t<TI){const d=t-s,D=TI-s;return v*s+v*(d-d*d/(2*D))}return v*s+v*(TI-s)/2}
function dinoX(){return VW*.29}
function volc(){return {x:VW*.6-camAt(T)*.03,y:GY-190}}
// ---------- drawing helpers ----------
function skinFill(top,bot,a,b){const g=x.createLinearGradient(0,a,0,b);g.addColorStop(0,top);g.addColorStop(1,bot);return g}
function leg(hx,hy,fx,fy,w,col){const lg=x.createLinearGradient(hx-w,0,hx+w,0);lg.addColorStop(0,col);lg.addColorStop(.6,col==='#3f4a2a'?'#56603a':'#8a9660');lg.addColorStop(1,col);x.fillStyle=lg;x.beginPath();x.moveTo(hx-w,hy);x.quadraticCurveTo(hx-w*1.2,(hy+fy)/2,fx-w*.8,fy-6);x.lineTo(fx-w,fy);x.lineTo(fx+w*1.1,fy);x.lineTo(fx+w*.8,fy-6);x.quadraticCurveTo(hx+w*1.1,(hy+fy)/2,hx+w,hy);x.closePath();x.fill();
 x.globalAlpha=1;x.fillStyle='#d8cfb4';for(let i=-1;i<=1;i++){x.beginPath();x.ellipse(fx+i*w*.6+3,fy-1.5,2.4,1.7,0,0,TAU);x.fill()}}
function shadow(cx,w,a){x.fillStyle=`rgba(20,15,5,${a})`;x.beginPath();x.ellipse(cx,GY+3,w,7,0,0,TAU);x.fill()}
// long-necked dinosaur, running, facing right. bx = hip area screen x
function dino(bx,t){const by=GY-108,ph=t*7.5,bob=Math.abs(Math.sin(ph))*4,sw=Math.sin(t*3)*6;
 shadow(bx,170,.28);x.save();x.translate(bx,by-bob);
 const lg=(o,dx,far)=>{const s=Math.sin(ph+o);leg(dx,10,dx+s*26,GY-(by-bob)+0,15,far?'#3f4a2a':'#556338')};
 lg(Math.PI,-60,1);lg(0,70,1);
 const hx=175+sw*.4,hy=-158+sw;
 x.beginPath();x.moveTo(-250,8+Math.sin(t*5)*6);x.quadraticCurveTo(-150,-28,-80,-42);x.bezierCurveTo(-25,-70,60,-66,92,-32);
 x.bezierCurveTo(120,-60,135,-130,hx-14,hy-12);x.bezierCurveTo(hx+5,hy-22,hx+30,hy-14,hx+44,hy-2);x.quadraticCurveTo(hx+48,hy+6,hx+38,hy+9);
 x.lineTo(hx+10,hy+13);x.bezierCurveTo(hx-6,hy+16,140,-70,112,14);x.bezierCurveTo(85,52,-55,56,-92,22);x.quadraticCurveTo(-160,22,-250,14+Math.sin(t*5)*6);x.closePath();
 x.fillStyle=skinFill('#7d8a52','#c9b98a',-80,55);x.fill();x.save();x.globalAlpha=.9;x.fillStyle=L.skin;x.fill();x.restore();
 x.strokeStyle='rgba(30,35,15,.35)';x.lineWidth=1.5;x.stroke();
 // back shading + eye + nostril + mouth
 x.fillStyle='rgba(40,50,20,.25)';x.beginPath();x.ellipse(0,-40,85,14,-.05,0,TAU);x.fill();
 x.fillStyle='#1b1408';x.beginPath();x.ellipse(hx+16,hy-6,3,2.6,0,0,TAU);x.fill();x.fillStyle='#e8d9a0';x.beginPath();x.arc(hx+16.8,hy-6.8,.9,0,TAU);x.fill();
 x.strokeStyle='#2a1a0e';x.lineWidth=1.6;x.beginPath();x.moveTo(hx+42,hy+4);x.quadraticCurveTo(hx+25,hy+9,hx+12,hy+7);x.stroke();
 lg(0,-45,0);lg(Math.PI,85,0);x.restore()}
// flattened dino under the boulder (no gore): legs, tail tip, long neck and dazed head stick out
function dinoFlat(bx,t,k){const tw=Math.sin(t*9)*3*k;
 x.save();const g=skinFill('#7d8a52','#b9a97a',GY-40,GY);
 const flatLeg=(sx,sy,ex,ey,w,c1,c2)=>{const lg=x.createLinearGradient(sx,sy-w,sx,sy+w);lg.addColorStop(0,c1);lg.addColorStop(1,c2);x.strokeStyle=lg;x.lineCap='round';x.lineWidth=w;
  x.beginPath();x.moveTo(sx,sy);x.quadraticCurveTo((sx+ex)/2,(sy+ey)/2-6,ex,ey+tw);x.stroke();
  // foot pad with three blunt toes, sole facing out
  const d=ex>sx?1:-1;x.fillStyle='#3a3322';x.beginPath();x.ellipse(ex+d*w*.38,ey+tw,w*.22,w*.58,0,0,TAU);x.fill();
  x.fillStyle='#d8cfb4';for(let i=-1;i<=1;i++){x.beginPath();x.ellipse(ex+d*w*.5,ey+tw+i*w*.3,2.6,2,0,0,TAU);x.fill()}};
 // tail tip: tapered, curling up a little, twitching
 x.fillStyle=g;x.beginPath();x.moveTo(bx-108,GY-46);x.bezierCurveTo(bx-160,GY-44,bx-205,GY-30,bx-238,GY-40+tw*1.5);x.quadraticCurveTo(bx-244,GY-34,bx-236,GY-31+tw);x.bezierCurveTo(bx-200,GY-16,bx-160,GY-8,bx-108,GY-6);x.closePath();x.fill();
 x.save();x.globalAlpha=.8;x.fillStyle=L.skin;x.fill();x.restore();x.strokeStyle='rgba(30,35,15,.35)';x.lineWidth=1.2;x.stroke();
 flatLeg(bx-95,GY-60,bx-150,GY-86,24,'#6e7b47','#47522c');flatLeg(bx-100,GY-16,bx-162,GY-20,26,'#7b8850','#4f5b31');
 flatLeg(bx+92,GY-14,bx+150,GY-8,26,'#7b8850','#4f5b31');
 // neck lying on the ground + head
 const hx=bx+250,hy=GY-18;x.beginPath();x.moveTo(bx+95,GY-48);x.bezierCurveTo(bx+150,GY-46,bx+200,GY-34,hx-12,hy-12);x.bezierCurveTo(hx,hy-20,hx+30,hy-14,hx+42,hy-3);x.quadraticCurveTo(hx+46,hy+5,hx+36,hy+8);
 x.lineTo(hx+6,hy+12);x.bezierCurveTo(bx+200,GY,bx+150,GY-2,bx+100,GY-2);x.closePath();x.fillStyle=g;x.fill();x.save();x.globalAlpha=.9;x.fillStyle=L.skin;x.fill();x.restore();
 x.strokeStyle='rgba(30,35,15,.35)';x.lineWidth=1.5;x.stroke();
 // dazed eye: closed swirl
 x.strokeStyle='#1b1408';x.lineWidth=1.4;x.beginPath();for(let a=0;a<TAU*1.6;a+=.3){const r=.6+a*.55;x.lineTo(hx+14+Math.cos(a+t*4)*r,hy-6+Math.sin(a+t*4)*r*.8)}x.stroke();
 x.beginPath();x.moveTo(hx+40,hy+4);x.quadraticCurveTo(hx+24,hy+10,hx+10,hy+7);x.stroke();
 x.restore();return {hx:hx+14,hy:hy-6}}
// orbiting stars (tasteful: small, soft golden glow, depth-sorted)
function stars(cx,cy,t,a){x.save();x.globalAlpha=a;const n=4;for(let i=0;i<n;i++){const an=t*3.2+i*TAU/n,sx=cx+Math.cos(an)*34,sy=cy-30+Math.sin(an)*10,dp=.7+.3*Math.sin(an),r=8*dp;
 x.globalAlpha=a*.5;x.drawImage(L.sglow,sx-r*3,sy-r*3,r*6,r*6);x.globalAlpha=a;
 x.fillStyle=`rgba(255,${210+40*dp|0},120,${.6+.4*dp})`;x.beginPath();for(let k=0;k<10;k++){const q=k*Math.PI/5-Math.PI/2+t,rr=k%2?r*.45:r;x.lineTo(sx+Math.cos(q)*rr,sy+Math.sin(q)*rr)}x.closePath();x.fill()}x.restore()}
// human: shaded limbs, earthy clothes. mode: run | stand | cheer
function human(hx,t,mode,face,jump){const ph=t*11;x.save();x.translate(hx,GY-jump);x.scale(face,1);shadow(0,16*(1-jump/60),.25*(1-jump/80));x.translate(0,-jump*0);
 const lim=(ax,ay,a1,l1,a2,l2,w,c)=>{const kx=ax+Math.sin(a1)*l1,ky=ay+Math.cos(a1)*l1,ex=kx+Math.sin(a2)*l2,ey=ky+Math.cos(a2)*l2;x.strokeStyle=c;x.lineWidth=w;x.lineCap='round';x.lineJoin='round';x.beginPath();x.moveTo(ax,ay);x.lineTo(kx,ky);x.lineTo(ex,ey);x.stroke();return [ex,ey]};
 const lean=mode==='run'?.28:0,hip=[0,-33],sh=[Math.sin(lean)*24,-33-Math.cos(lean)*24];
 const legA=o=>{if(mode==='run'){const s=Math.sin(ph+o);return [s*.8,s*.8-.25-.9*Math.max(0,Math.cos(ph+o))]}if(mode==='cheer')return [(o?.25:-.25),(o?.25:-.25)-(jump>2?.9:.1)];return [o?.08:-.08,o?.08:-.08]};
 const armA=o=>{if(mode==='run'){const s=-Math.sin(ph+o);return [s*.9,s*.9+1.3]}if(mode==='cheer'){const w=Math.sin(t*14+o)*.15;return [Math.PI+(o?.45:-.45)+w,Math.PI+(o?.6:-.6)+w]}return [o?.15:-.15,(o?.15:-.15)+.3]};
 let a=legA(Math.PI),f=lim(hip[0],hip[1],a[0],17,a[1],17,6.2,'#8a5a3a');x.fillStyle='#3a2a1c';x.fillRect(f[0]-2,f[1]-2,8,3);
 a=armA(0);lim(sh[0],sh[1],a[0],13,a[1],12,4.6,'#8a5a3a');
 // torso: leather tunic
 x.strokeStyle='#6b4a2a';x.lineWidth=12;x.lineCap='round';x.beginPath();x.moveTo(hip[0],hip[1]+2);x.lineTo(sh[0],sh[1]+3);x.stroke();
 x.strokeStyle='rgba(255,230,190,.18)';x.lineWidth=3;x.beginPath();x.moveTo(hip[0]+3,hip[1]);x.lineTo(sh[0]+3,sh[1]+4);x.stroke();
 x.strokeStyle='#4b3320';x.lineWidth=10;x.beginPath();x.moveTo(hip[0]-1,hip[1]+5);x.lineTo(hip[0]+1,hip[1]-2);x.stroke();
 // head + hair
 const hd=[sh[0]+Math.sin(lean)*8,sh[1]-8];const sg=x.createRadialGradient(hd[0]+2,hd[1]-2,1,hd[0],hd[1],7.5);sg.addColorStop(0,'#c99068');sg.addColorStop(1,'#8a5a3a');x.fillStyle=sg;x.beginPath();x.arc(hd[0],hd[1],7,0,TAU);x.fill();
 x.fillStyle='#2b1d12';x.beginPath();x.arc(hd[0]-1,hd[1]-2,7.4,Math.PI*.95,Math.PI*2.1);x.fill();x.beginPath();x.ellipse(hd[0]-5,hd[1]+1,3,5,0,0,TAU);x.fill();
 x.fillStyle='#1a120a';x.beginPath();x.arc(hd[0]+4,hd[1]-.5,1,0,TAU);x.fill();
 if(mode==='cheer'){x.fillStyle='#4a1e12';x.beginPath();x.ellipse(hd[0]+5,hd[1]+3.5,1.6,1.8+Math.abs(Math.sin(t*10)),0,0,TAU);x.fill()}
 a=legA(0);f=lim(hip[0],hip[1],a[0],17,a[1],17,6.6,'#a06a45');x.fillStyle='#4a3524';x.fillRect(f[0]-2,f[1]-2,8,3);
 a=armA(Math.PI);lim(sh[0],sh[1],a[0],13,a[1],12,5,'#a06a45');
 x.restore()}
function boulderPath(r){x.beginPath();const n=14;const pts=[];for(let i=0;i<n;i++){const a=i/n*TAU,rr=r*(.86+hs(i+11)*.2);pts.push([Math.cos(a)*rr*1.12,Math.sin(a)*rr])}
 for(let i=0;i<=n;i++){const p=pts[i%n],q=pts[(i+1)%n],m=[(p[0]+q[0])/2,(p[1]+q[1])/2];i?x.quadraticCurveTo(p[0],p[1],m[0],m[1]):x.moveTo(m[0],m[1])}x.closePath()}
function boulder(cx,cy,r,rot,heat){x.save();x.translate(cx,cy);x.rotate(rot);
 if(heat>0){x.save();x.globalAlpha=heat*.8;const g=x.createRadialGradient(0,0,r*.6,0,0,r*1.5);g.addColorStop(0,'rgba(255,120,20,.7)');g.addColorStop(1,'rgba(255,80,0,0)');x.fillStyle=g;x.fillRect(-r*1.6,-r*1.6,r*3.2,r*3.2);x.restore()}
 boulderPath(r);const g=x.createRadialGradient(-r*.35,-r*.4,r*.1,0,0,r*1.15);g.addColorStop(0,'#9b8e7e');g.addColorStop(.55,'#5e5246');g.addColorStop(1,'#2c241e');x.fillStyle=g;x.fill();
 x.save();x.clip();x.fillStyle='rgba(20,14,10,.25)';for(let i=0;i<40;i++){x.beginPath();x.arc((hs(i+200)-.5)*2*r,(hs(i+201)-.5)*2*r,1+hs(i+202)*r*.08,0,TAU);x.fill()}
 x.fillStyle='rgba(255,240,220,.08)';for(let i=0;i<30;i++){x.fillRect((hs(i+300)-.5)*2*r,(hs(i+301)-.5)*2*r,2,2)}
 x.strokeStyle='rgba(15,10,8,.55)';x.lineWidth=2;for(let k=0;k<4;k++){x.beginPath();let px=(hs(k+400)-.5)*r*1.4,py=(hs(k+401)-.5)*r*1.4;x.moveTo(px,py);for(let s=0;s<4;s++){px+=(hs(k*7+s)-.5)*r*.5;py+=(hs(k*5+s+1)-.5)*r*.5;x.lineTo(px,py)}x.stroke()}
 if(heat>0){x.strokeStyle=`rgba(255,${120+heat*100|0},30,${heat})`;x.lineWidth=2.5;x.shadowColor='#ff6a00';x.shadowBlur=8;for(let k=0;k<4;k++){x.beginPath();let px=(hs(k+400)-.5)*r*1.4,py=(hs(k+401)-.5)*r*1.4;x.moveTo(px,py);for(let s=0;s<4;s++){px+=(hs(k*7+s)-.5)*r*.5;py+=(hs(k*5+s+1)-.5)*r*.5;x.lineTo(px,py)}x.stroke()}}
 x.restore();x.strokeStyle='rgba(10,8,6,.5)';x.lineWidth=2;x.stroke();x.restore()}
function rock(cx,cy,sc,rot,heat){const B=L.BS*sc;x.save();x.translate(cx,cy);x.rotate(rot);x.drawImage(L.rock,-B/2,-B/2,B,B);if(heat>0){x.globalAlpha=heat;x.drawImage(L.hot,-B/2,-B/2,B,B)}x.restore()}
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
  for(let i=0;i<3;i++){const len=cl((t-TE-.3-i*.3)/1.8,0,1);x.beginPath();x.moveTo(v.x-14+i*14,v.y+4);x.bezierCurveTo(v.x-30+i*30,v.y+40*len,v.x-70+i*70+Math.sin(i*2)*20,v.y+90*len,v.x-90+i*90,v.y+(GY-40-v.y)*len);x.stroke()}}
  x.globalAlpha=.9*e;x.drawImage(L.crater,v.x-95,v.y-95,190,190)}
 x.restore()}
// ---------- particles ----------
function spawn(dt){const v=volc(),k=calm?.5:1;
 if(T>TE){if(P.smoke.length<36*k&&Math.random()<dt*18)P.smoke.push({x:v.x+R(-15,15),y:v.y,vx:R(-8,14),vy:R(-60,-35),r:R(10,18),a:.85});
  if(T<TI+2&&P.lava.length<26*k&&Math.random()<dt*(T<TE+1.2?40:12))P.lava.push({x:v.x+R(-8,8),y:v.y,vx:R(-90,90),vy:R(-260,-140),r:R(1.8,3.6),l:1});
  if(P.ash.length<50*k&&Math.random()<dt*25)P.ash.push({x:R(0,VW),y:-5,vx:R(-12,4),vy:R(18,38),r:R(.8,1.8)})}}
function stepP(dt){for(const p of P.smoke){p.x+=p.vx*dt;p.y+=p.vy*dt;p.r+=dt*14;p.a-=dt*.09}P.smoke=P.smoke.filter(p=>p.a>0&&p.y>-120);
 for(const p of P.lava){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=260*dt;p.l-=dt*.45}P.lava=P.lava.filter(p=>p.l>0&&p.y<GY);
 for(const p of P.ash){p.x+=p.vx*dt;p.y+=p.vy*dt}P.ash=P.ash.filter(p=>p.y<GY+10);
 for(const p of P.dust){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=1-dt*1.8;p.vy*=1-dt*1.8;p.r+=dt*22;p.a-=dt*.42}P.dust=P.dust.filter(p=>p.a>0)}
function drawSmoke(){x.save();for(const p of P.smoke){x.globalAlpha=cl(p.a,0,1);x.drawImage(L.smoke,p.x-p.r,p.y-p.r,p.r*2,p.r*2)}
 for(const p of P.lava){x.globalAlpha=p.l*.7;x.drawImage(L.glow,p.x-p.r*3,p.y-p.r*3,p.r*6,p.r*6);x.globalAlpha=p.l;x.fillStyle='#ffd27a';x.fillRect(p.x-p.r/2,p.y-p.r/2,p.r,p.r)}x.restore()}
function drawDust(){x.save();for(const p of P.dust){x.globalAlpha=cl(p.a,0,1);x.drawImage(L.dust,p.x-p.r,p.y-p.r,p.r*2,p.r*2)}x.restore()}
function sfx(k,at){if(T>=at&&!fired[k+at]){fired[k+at]=1;try{if(typeof VIS!=='undefined')VIS.play(k)}catch(e){}}}
// ---------- frame ----------
function frame(now){if(!playing)return;raf=requestAnimationFrame(frame);const c0=performance.now();try{draw(now)}finally{wk.push(performance.now()-c0);if(wk.length>2000)wk.shift()}}
function draw(now){const dt=Math.min(.05,(now-(last||now))/1000);if(last)ft.push(now-last);if(ft.length>2000)ft.shift();last=now;
 T+=dt*TS;if(T>=TEND&&!ending)finish(true);layers();
 const cam=camAt(T),bx=dinoX(),v=volc(),hit=T>=TI;spawn(dt*TS);stepP(dt*TS);
 // human screen x
 let hx=VW*.66,mode='run',face=1,jump=0;if(hit){const d=T-TI;hx+=50*ease(d/1.1);if(d>1.1)mode='stand';if(d>1.35)face=-1;if(d>1.5){mode='cheer';jump=Math.abs(Math.sin((d-1.5)*5.2))*22}}
 // shake
 let sk=0;if(!calm){if(T>TE&&T<TE+2.2)sk=5*(1-(T-TE)/2.2);if(hit&&T<TI+.6)sk=Math.max(sk,10*(1-(T-TI)/.6))}
 x.setTransform(DPR*S,0,0,DPR*S,0,0);if(sk)x.translate(R(-sk,sk),R(-sk,sk));
 // sky, redder after eruption
 const er=cl((T-TE)/2,0,1);x.drawImage(er>=1?L.sky2:L.sky,-12,-12,VW+24,GY+32);
 if(er>0&&er<1){x.globalAlpha=er;x.drawImage(L.red,-12,-12,VW+24,GY+32);x.globalAlpha=1}
 tile(L.far,1000,.08,GY-210,cam);volcano(v,T);drawSmoke();tile(L.mid,800,.35,GY-130,cam);
 tile(L.ground,512,1,GY-2,cam);
 // boulder flight
 const tx=bx,ty=GY-118,BR=118;let bp=null;
 if(T>=TB&&!hit){const p=(T-TB)/(TI-TB),q=Math.pow(p,1.4);bp={x:v.x+(tx-v.x)*p,y:v.y+(ty-v.y)*q-230*4*p*(1-p),r:BR*(.22+.78*q),rot:(1-p)*5,h:1-p*.5}}
 if(!hit){dino(bx,T);if(bp){const sh=cl((T-TB-.9)/.9,0,1);if(sh>0){x.fillStyle=`rgba(10,8,5,${.35*sh})`;x.beginPath();x.ellipse(bx,GY+2,BR*1.1*sh,10*sh,0,0,TAU);x.fill()}}}
 else{if(!fired.dust){fired.dust=1;const n=calm?14:28;for(let i=0;i<n;i++){const a=R(Math.PI,TAU);P.dust.push({x:bx+R(-110,110),y:GY-R(0,30),vx:Math.cos(a)*R(60,200),vy:Math.sin(a)*R(20,90),r:R(10,22),a:.8})}}
  const k=cl(1-(T-TI)/3,0,1)*.6+.4,hd=dinoFlat(bx,T,k);shadow(bx,BR*1.15,.4);
  const d=T-TI,bnc=d<.5?-Math.abs(Math.sin(d*Math.PI*2))*14*(1-d/.5):0;rock(bx,ty+bnc,1,0,cl(.5-d*.25,0,.5));
  stars(hd.hx,hd.hy,T,cl((d-.4)/.4,0,1));titleLive(bx,ty,cl((d-1)/.8,0,1),d)}
 human(hx,T,mode,face,jump);
 if(bp)rock(bp.x,bp.y,bp.r/BR,bp.rot,bp.h);
 drawDust();
 if(!calm&&L.near)tile(L.near,700,1.35,VH-80+Math.max(0,VH-GY-90)*0,cam);
 x.fillStyle='rgba(60,50,45,.6)';for(const p of P.ash)x.fillRect(p.x,p.y,p.r,p.r);
 if(T>TE&&T<TE+.35){x.fillStyle=`rgba(255,200,120,${.35*(1-(T-TE)/.35)})`;x.fillRect(-20,-20,VW+40,VH+40)}
 if(hit&&T<TI+.15){x.fillStyle=`rgba(255,240,220,${.4*(1-(T-TI)/.15)})`;x.fillRect(-20,-20,VW+40,VH+40)}
 // letterbox bars for a cinematic look + skip hint
 x.setTransform(DPR*S,0,0,DPR*S,0,0);x.fillStyle='#000';x.fillRect(0,0,VW,14);x.fillRect(0,VH-14,VW,14);
 x.fillStyle='rgba(255,255,255,.75)';x.font='bold 12px sans-serif';x.textAlign='right';x.textBaseline='middle';x.fillText('Tap to skip',VW-14,VH-7);
 sfx('roar',1.0);sfx('roar',TE+.1);sfx('land',TI);sfx('stomp',TI+.05);sfx('cheer',TI+1.6)}
// ---------- lifecycle ----------
function start(why){if(off)return false;if(!cv){cv=document.createElement('canvas');cv.id='intro';cv.setAttribute('aria-label','Intro movie. Tap to skip.');
  cv.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;z-index:50;background:#000;touch-action:none;transition:opacity .6s';document.body.appendChild(cv);x=cv.getContext('2d');
  cv.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();finish(false)});addEventListener('resize',()=>{if(playing)size()})}
 calm=!!(typeof VIS!=='undefined'&&VIS.calm)||matchMedia('(prefers-reduced-motion: reduce)').matches;TS=calm?1.5:1;
 cancelAnimationFrame(raf);size();T=0;last=0;ending=0;fired={};P={smoke:[],lava:[],ash:[],dust:[]};ft=[];wk=[];playing=true;runs++;lastEnd=null;
 cv.style.display='block';cv.style.opacity='1';cv.style.pointerEvents='auto';t0=performance.now();raf=requestAnimationFrame(frame);return true}
function finish(natural){if(!playing||ending)return;ending=1;lastEnd=natural?'end':'skip';cv.style.opacity='0';
 setTimeout(()=>{playing=false;cancelAnimationFrame(raf);cv.style.display='none';cv.style.pointerEvents='none'},natural?600:350)}
addEventListener('keydown',e=>{if(playing&&!ending)finish(false)},true);
addEventListener('pageshow',e=>{if(e.persisted&&!(typeof G!=='undefined'&&G&&G.running))start('pageshow')});
start('launch');
function stats(){const a=ft.slice(5).sort((p,q)=>p-q);if(!a.length)return null;const avg=a.reduce((s,v)=>s+v,0)/a.length;const w=wk.slice(5).sort((p,q)=>p-q),wa=w.reduce((s,v)=>s+v,0)/w.length;return {n:a.length,avg,p95:a[Math.floor(a.length*.95)],max:a[a.length-1],fps:1000/avg,drawAvg:wa,drawP95:w[Math.floor(w.length*.95)]}}
return {start,finish,stats,seek:v=>{T=v},get T(){return T},get playing(){return playing},get runs(){return runs},get lastEnd(){return lastEnd},get calm(){return calm},get off(){return off},
 get counts(){return {smoke:P.smoke.length,lava:P.lava.length,ash:P.ash.length,dust:P.dust.length}},TIMES:{TE,TB,TI,TF,TEND}};
})();

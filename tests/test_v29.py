# Dino Colossus v29 (Jeremy): rolling boulders bounce off rocks; a head stomp pops a spear guy.
# Pretend phone: headless Chromium with touch (not a real phone). Run: python3 tests/test_v29.py
# ROOT=<other copy> runs the same checks on it.
import subprocess,time,sys,os,re,tempfile
from playwright.sync_api import sync_playwright
ROOT=os.environ.get('ROOT') or os.path.dirname(os.path.dirname(os.path.abspath(__file__)));PORT=int(os.environ.get('PORT','8989'))
SRV="""import http.server,sys,os
class H(http.server.SimpleHTTPRequestHandler):
  def list_directory(self,path):self.send_error(404);return None
  def log_message(self,*a):pass
os.chdir(sys.argv[2]);http.server.ThreadingHTTPServer(('127.0.0.1',int(sys.argv[1])),H).serve_forever()"""
srv=subprocess.Popen([sys.executable,'-c',SRV,str(PORT),ROOT],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
URL=f'http://127.0.0.1:{PORT}/?intro=0';fails=[];passes=0
def check(c,m):
    global passes
    print(('PASS ' if c else 'FAIL ')+m,flush=True)
    if c: passes+=1
    else: fails.append(m)
rd=lambda f:open(os.path.join(ROOT,f),encoding='utf8').read() if os.path.exists(os.path.join(ROOT,f)) else ''
sw=rd('sw.js');html=rd('index.html');gj=rd('game.js')
print('--- READ IN CODE ---',flush=True)
check('const VER="29"' in sw and 'PREFIX="dinocol-v"' in sw and 'build=VER' in sw and 'CACHE=PREFIX+build' in sw and sw.count('?v=29')==4,'sw VER 29, cache PREFIX+build, SHELL ?v=29')
check(html.count('?v=29')==4 and '>v29 · A Slimetrail production<' in html,'index.html ?v=29 and footer v29')
check(os.path.exists(os.path.join(ROOT,'CHANGES-v29.md')) and os.path.exists(os.path.join(ROOT,'version.json')) and '"version":29' in rd('version.json'),'CHANGES-v29.md and version.json say 29')
check('Version 29' in rd('README.md'),'README says version 29')
check('holeGone(b)' in gj and 'b.vy=-7;b.x-=2' not in gj,'boulder path still calls holeGone and no longer hops over a face')
check("hurt('Ouch! Pointy spear!')" in gj and "msg(head?'Pop!'" in gj,'pointy-spear hurt remains for a miss; a centered head stomp says Pop')
check('function holeGone' in gj and 'function safeNear' in gj,'v28 holeGone and safeNear are still in the file')
print('--- TESTED (headless Chromium, touch, pretend phone) ---',flush=True)
# Shared setup inside the page. home is the dino. Rocks and the hole are built on the ground under the dino.
BOULDER=r'''()=>{
const D=__dc,G=D.G,GY=D.consts.GY;
const calm=()=>{for(const k of ['bigs','boulders','critters','rangers','littles','meteors','vols','toss','fly','waves','bshots','people','lava'])if(Array.isArray(G[k]))G[k].length=0;G.ch=null;G.rival=null;G.sil=null;G.boulT=999;G.boss=null;G.inBonus=0;G.hit=0;G.safeT=0;G.inv=0;G.belly=0;G.spawnT=0};
calm();
const g=G.solids.find(s=>s.k=='g'&&s.y==GY&&s.w>=400&&G.d.x>=s.x&&G.d.x<=s.x+s.w);
if(!g)return {noground:1};
const gx=g.x,gw=g.w;
G.solids=G.solids.filter(s=>s.k=='g'||s.k=='arena'||s.k=='wall'||s.x>gx+gw||s.x+s.w<gx);
const L={x:gx+120,y:GY-90,w:50,h:90,k:'pillar'},R={x:gx+320,y:GY-90,w:50,h:90,k:'stump'};
G.solids.push(L,R);
const ov=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const home=gx+30;
const pin=()=>{G.d.x=home;G.d.y=GY-G.d.h;G.d.vx=0;G.d.vy=0;G.hit=0;G.boulT=999;G.hearts=5;G.lives=5;G.belly=0};
pin();G.camX=Math.max(0,home-40);
const b={x:L.x+L.w+24,y:GY-28,w:28,h:28,vx:-2.6,sp:1,vy:0,a:0,dir:-1,tag:1};
G.boulders=[b];
let flips=0,prev=-1,minX=1e9,maxX=-1e9,minY=1e9,overlap=0,tunL=0,tunR=0,climbed=0,samples=0;
for(let i=0;i<140;i++){pin();update();const q=G.boulders.find(z=>z.tag);if(!q)break;samples++;
  if(Math.sign(q.vx)!==prev){if(samples>1)flips++;prev=Math.sign(q.vx)}
  minX=Math.min(minX,q.x);maxX=Math.max(maxX,q.x);minY=Math.min(minY,q.y);
  if(q.y<GY-40)climbed++;
  if(ov(q,L)||ov(q,R))overlap++;
  if(q.x+q.w<=L.x+1)tunL++;
  if(q.x>=R.x+R.w-1)tunR++;
}
const q=G.boulders.find(z=>z.tag);
const between={flips,range:Math.round(maxX-minX),overlap,tunL,tunR,climbed,samples,vx:q?+q.vx.toFixed(2):null,y:q?Math.round(q.y):null,alive:!!q};
// one rock, open ground to the right: must reverse and leave, not climb over or pass through
calm();G.solids=G.solids.filter(s=>s!==R);
const one={x:L.x+L.w+16,y:GY-28,w:28,h:28,vx:-2.6,sp:1,vy:0,a:0,tag:2};
G.boulders=[one];
let sawFlip=0,passed=0,hop=0,xs=[];
for(let i=0;i<50;i++){pin();update();const q=G.boulders.find(z=>z.tag);if(!q){passed++;break}
  xs.push(q.x);if(q.vx>0)sawFlip=1;if(q.y<GY-40)hop++;if(q.x+q.w<=L.x+1)passed++}
const rev={sawFlip,passed,hop,x0:Math.round(xs[0]||0),xN:Math.round(xs[xs.length-1]||0),n:xs.length};
// flat ground, no rock: keeps rolling left
calm();G.solids=G.solids.filter(s=>s!==L&&s!==R);
const flat={x:gx+gw-80,y:GY-28,w:28,h:28,vx:-2.6,sp:1,vy:0,a:0,tag:3};
G.boulders=[flat];let fx=[];
for(let i=0;i<40;i++){pin();G.camX=gx;update();const q=G.boulders.find(z=>z.tag);if(q)fx.push(q.x)}
const roll={n:fx.length,dx:fx.length?Math.round(fx[0]-fx[fx.length-1]):0,gone:fx.length<40};
return {between,rev,roll};
}'''
HOLE=r'''()=>{
const D=__dc,G=D.G,GY=D.consts.GY;
const calm=()=>{for(const k of ['bigs','boulders','critters','rangers','littles','meteors','vols','toss','fly','waves','bshots','people','lava'])if(Array.isArray(G[k]))G[k].length=0;G.ch=null;G.rival=null;G.sil=null;G.boulT=999;G.boss=null;G.inBonus=0;G.hit=0;G.safeT=0;G.inv=0;G.belly=0};
calm();
const g=G.solids.find(s=>s.k=='g'&&s.y==GY&&s.w>=400&&G.d.x>=s.x&&G.d.x<=s.x+s.w);
if(!g)return {noground:1};
const rightW=90,holeW=80,rightX=g.x+g.w-rightW,holeX=rightX-holeW;
g.w=holeX-g.x;G.solids.push({x:rightX,y:GY,w:rightW,h:800,k:'g'});
G.d.x=g.x+20;G.d.y=GY-G.d.h;G.camX=Math.max(0,g.x);
const pin=()=>{G.d.x=g.x+20;G.d.y=GY-G.d.h;G.d.vx=0;G.d.vy=0;G.hit=0;G.hearts=5;G.lives=5;G.boulT=999;G.safeT=0};
const bo={x:rightX+8,y:GY-28,w:28,h:28,vx:-2.6,sp:1,vy:0,a:0,tag:1};
G.boulders=[bo];let gone=-1,maxY=-1,back=0;
for(let i=0;i<180;i++){pin();update();const b=G.boulders.find(q=>q.tag);if(b){maxY=Math.max(maxY,b.y);if(b.x>rightX+40)back++}else if(gone<0)gone=i}
const lava={x:rightX+10,w:56,vx:-2,ph:0,tag:1};G.lava=[lava];G.boulders=[];let lg=-1,over=0;
for(let i=0;i<80;i++){pin();G.d.y=GY-G.d.h-80;update();const q=G.lava.find(z=>z.tag);if(q){over=Math.max(over,Math.max(0,rightX-(q.x+2)))}else if(lg<0)lg=i}
return {gone,maxY:Math.round(maxY),left:G.boulders.filter(q=>q.tag).length,back,lg,over:Math.round(over)};
}'''
SPEAR=r'''()=>{
const D=__dc,G=D.G,GY=D.consts.GY;
const calm=()=>{for(const k of ['bigs','boulders','critters','rangers','littles','meteors','vols','toss','fly','waves','bshots','people','lava','msgs','smoke'])if(Array.isArray(G[k]))G[k].length=0;G.ch=null;G.rival=null;G.sil=null;G.boulT=999;G.boss=null;G.inBonus=0;G.hit=0;G.safeT=0;G.inv=0;G.belly=0;G.spawnT=0;G.roll=false;G.fat=false};
const alive=a=>a.filter(o=>o.y<GY+300).length;
function place(kind){
  calm();G.hearts=5;G.lives=5;G.d.x=G.secs[0].x0+80;G.camX=G.secs[0].x0;const base=G.d.x+70;
  const r={x:base,y:GY-34,w:24,h:34,vx:.8,vy:0,stun:0,sp:1};
  const p={x:base,y:GY-26,w:18,h:26,vx:0,vy:0,e:'🧑',v:0};
  const d=G.d;d.h=36;d.w=34;d.vx=0;G.hit=0;
  if(kind=='head'){G.rangers=[r];d.x=r.x+r.w/2-d.w/2;d.vy=4;d.y=r.y-d.h+6}
  else if(kind=='miss'){G.rangers=[r];d.x=r.x-d.w+8;d.vy=3;d.y=r.y-d.h+4}
  else if(kind=='side'){G.rangers=[r];d.x=r.x-d.w+10;d.vy=0;d.y=r.y+8}
  else {G.people=[p];G.belly=999;d.x=p.x+p.w/2-d.w/2;d.vy=4;d.y=p.y-d.h+6}
  const sm=G.smoke.length,h0=G.hearts;update();
  return {rangers:alive(G.rangers),people:G.people.length,hearts:G.hearts,dh:h0-G.hearts,vy:+G.d.vy.toFixed(2),hit:G.hit|0,vx:+G.d.vx.toFixed(2),smoke:G.smoke.length-sm,pop:G.msgs.some(m=>m.t=='Pop!'),spear:G.msgs.some(m=>/Pointy spear/.test(m.t))};
}
return {head:place('head'),miss:place('miss'),side:place('side'),person:place('person')};
}'''
try:
 with sync_playwright() as p:
  b=p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
  for w,h in [(915,412),(412,915)]:
    cx=b.new_context(viewport={'width':w,'height':h},device_scale_factor=2,has_touch=True,is_mobile=True);pg=cx.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and errs.append(m.text))
    def fresh():
        pg.goto(URL);pg.wait_for_timeout(400);pg.tap('#go');pg.wait_for_timeout(400)
        pg.evaluate("()=>{__dc.G.d.x=__dc.G.secs[0].x0+40;__dc.G.camX=__dc.G.secs[0].x0}")
    tag=f'{w}x{h}'
    fresh();r=pg.evaluate(BOULDER)
    check(not r.get('noground'),f'{tag}: TESTED found ground for the rock arena')
    if not r.get('noground'):
        bt,rv,rl=r['between'],r['rev'],r['roll']
        check(bt['alive'] and bt['flips']>=2 and bt['range']>=80 and bt['overlap']==0 and bt['tunL']==0 and bt['tunR']==0 and bt['climbed']==0 and bt['samples']>=100,
              f'{tag}: TESTED boulder bounces between two rocks, no stick, no tunnel, no climb {bt}')
        check(rv['sawFlip']==1 and rv['passed']==0 and rv['hop']==0 and rv['xN']>rv['x0']+30,
              f'{tag}: TESTED boulder reverses on one rock and rolls away, does not climb or pass through {rv}')
        check(rl['n']==40 and rl['dx']>60 and rl['gone'] is False,f'{tag}: TESTED boulder on open ground keeps rolling left {rl}')
    fresh();hole=pg.evaluate(HOLE)
    check(not hole.get('noground'),f'{tag}: TESTED found ground to cut a hole')
    if not hole.get('noground'):
        check(0<=hole['gone']<=90 and hole['left']==0 and hole['maxY']>=340 and hole['back']==0,
              f'{tag}: TESTED boulder falls into a hole and is gone (v28 holeGone) {hole}')
        check(hole['lg']>=0 and hole['over']<=8,f'{tag}: TESTED lava reaching a hole is gone (v28) {hole}')
    fresh();sp=pg.evaluate(SPEAR)
    hd,ms,sd,pe=sp['head'],sp['miss'],sp['side'],sp['person']
    check(hd['rangers']==0 and hd['dh']==0 and hd['vy']<0 and hd['hit']==0 and hd['pop'] and hd['smoke']>0,
          f'{tag}: TESTED head stomp pops the spear guy, no damage, bounce up {hd}')
    check(ms['rangers']==1 and ms['dh']==1 and ms['spear'] and not ms['pop'],f'{tag}: TESTED falling hit that misses the head still hurts {ms}')
    check(sd['rangers']==1 and sd['dh']==0 and sd['hit']>=30 and sd['vx']<0 and not sd['pop'],f'{tag}: TESTED side hit knocks, does not pop, no heart {sd}')
    check(pe['people']==1 and pe['dh']==0 and pe['rangers']==0 and not pe['pop'],f'{tag}: TESTED a normal person is not popped by a head stomp {pe}')
    check(not errs,f'{tag}: TESTED no page errors {errs[:3]}');cx.close()
  b.close()
finally:
  srv.terminate()
print(f'{passes} passed, {len(fails)} failed');sys.exit(1 if fails else 0)

# Dino Colossus v28 (Jeremy t1634u): boulders and lava are gone when they drop into a hole; the dino is never put back stuck over a hole.
# Pretend phone: headless Chromium with touch (not a real phone). Run: python3 tests/test_v28.py   ROOT=<other copy> runs the same checks on it.
import subprocess,time,sys,os,re,tempfile
from playwright.sync_api import sync_playwright
ROOT=os.environ.get('ROOT') or os.path.dirname(os.path.dirname(os.path.abspath(__file__)));PORT=int(os.environ.get('PORT','8981'))
SHOTS=os.environ.get('SHOTS',os.path.join(tempfile.gettempdir(),'dino-shots-v28'));os.makedirs(SHOTS,exist_ok=True)
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
sw=rd('sw.js');html=rd('index.html')
check('const VER="29"' in sw and sw.count('?v=29')==4 and '?v=27' not in sw,'sw VER 29, SHELL ?v=29')
check(html.count('?v=29')==4 and '>v29 · A Slimetrail production<' in html,'index.html ?v=29 and footer v29')
check(os.path.exists(os.path.join(ROOT,'CHANGES-v28.md')),'CHANGES-v28.md exists')
# common: find a pit ahead, clear everything that could hurt, put the camera on it
PREP='''const D=__dc,G=D.G;const calm=()=>{for(const k of ['bigs','boulders','critters','rangers','littles','meteors','vols','toss','fly','waves','bshots','people','lava'])if(Array.isArray(G[k]))G[k].length=0;G.ch=null;G.rival=null;G.sil=null;G.boulT=999};
 let pit=null;for(const s of G.secs)for(const p of s.pits)if(!pit&&p.x>G.d.x+150&&p.w>=60)pit=p;
 const gt=x=>{let t=null;for(const s of G.solids)if((s.k=='g'||s.k=='arena')&&x>=s.x&&x<=s.x+s.w&&(t==null||s.y<t))t=s.y;return t};'''
BOULDER='''()=>{'''+PREP+'''if(!pit)return {nopit:1};calm();G.hit=0;G.safeT=0;G.belly=0;
 G.camX=pit.x-VW*.5;G.d.x=G.camX+20;G.d.y=GY-G.d.h;const r={};
 // dino stands at the bottom of the hole, right under the falling boulder: it must never be hit by it
 const bo={x:pit.x+pit.w-30,y:GY-28,w:28,h:28,vx:-2.6,sp:1,vy:0,a:0,tag:1};G.boulders.push(bo);let gone=-1,maxY=-1,hits=0;const h0=G.hearts;
 for(let i=0;i<240;i++){G.d.x=G.camX+20;G.d.y=GY-G.d.h;G.d.vy=0;G.hit=0;G.boulT=999;update();const b=G.boulders.find(q=>q.tag);if(b){maxY=Math.max(maxY,b.y);if(gt(b.x+b.w/2)==null&&b.x+b.w>G.d.x&&b.x<G.d.x+G.d.w&&b.y+b.h>G.d.y)hits++}else if(gone<0)gone=i}
 r.gone=gone;r.maxY=Math.round(maxY);r.left=G.boulders.filter(q=>q.tag).length;r.hearts=h0-G.hearts;
 // control: a boulder on flat ground (no hole under it) keeps rolling
 calm();let gx=null;for(const s of G.solids)if(s.k=='g'&&s.y==GY&&s.w>300&&s.x>G.camX-2000){gx=s.x+s.w-40;break}
 if(gx!=null){G.camX=gx-VW*.6;G.d.x=G.camX+10;const c={x:gx,y:GY-28,w:28,h:28,vx:-2.6,sp:1,vy:0,a:0,tag:2};G.boulders.push(c);for(let i=0;i<40;i++){G.boulT=999;G.hit=0;update()}r.ctrl=G.boulders.some(q=>q.tag==2)}
 return r}'''
LAVA='''()=>{'''+PREP+'''if(!pit)return {nopit:1};calm();G.hit=0;G.safeT=0;G.camX=pit.x-VW*.4;G.d.x=G.camX+10;G.d.y=GY-G.d.h-200;G.d.vy=0;
 const f={x:pit.x+pit.w+4,w:56,vx:-2,ph:0,tag:1};G.lava.push(f);let gone=-1,over=0,deep=0;
 for(let i=0;i<120;i++){G.d.y=GY-G.d.h-200;G.d.vy=0;G.hit=0;update();const q=G.lava.find(z=>z.tag);if(q){const ov=Math.max(0,Math.min(q.x+q.w,pit.x+pit.w)-Math.max(q.x,pit.x));over=Math.max(over,ov)}else if(gone<0)gone=i}
 // control: lava on flat ground keeps flowing
 calm();let gx=null;for(const s of G.solids)if(s.k=='g'&&s.y==GY&&s.w>300&&s.x>G.camX-2000){gx=s.x+s.w-80;break}let ctrl=null;
 if(gx!=null){G.camX=gx-VW*.6;G.d.x=G.camX+10;G.d.y=GY-G.d.h-200;G.lava.push({x:gx,w:56,vx:-2,ph:0,tag:2});for(let i=0;i<30;i++){G.d.y=GY-G.d.h-200;G.d.vy=0;update()}ctrl=G.lava.some(z=>z.tag==2)}
 return {gone,over:Math.round(over),ctrl}}'''
STUCK='''(how)=>{'''+PREP+'''if(!pit)return {nopit:1};calm();G.hit=0;G.safeT=0;G.belly=0;
 // camera starts at the hole and the last safe spot is the middle of the hole: v27 put the dino straight back in the hole here
 G.camX=pit.x-5;G.lastSafe={x:pit.x+pit.w/2,y:GY-40};G.d.x=pit.x+pit.w/2-17;G.d.y=GY-40;
 const t0=performance.now(),h0=G.hearts+G.lives*10;
 if(how=='respawn')D.respawn('');else if(how=='stay')D.respawn('stay');else if(how=='life'){G.hearts=1;G.hit=0;G.safeT=0;D.hurt('t')}
 const ms=performance.now()-t0,d=G.d,clear=[0,d.w/2,d.w].every(o=>gt(d.x+o)!=null),x=d.x;let falls=0,ph=h0;
 for(let i=0;i<240;i++){calm();update();const h=G.hearts+G.lives*10;if(h<ph&&!(how=='life'&&i==0))falls++;ph=h}
 const onGround=gt(G.d.x+G.d.w/2)!=null&&G.d.y+G.d.h<=gt(G.d.x+G.d.w/2)+1;
 return {clear,falls,onGround,ms:Math.round(ms),dist:Math.round(Math.abs(x-(pit.x+pit.w/2))),onScreen:x>=G.camX-1&&x+d.w<=G.camX+VW+1}}'''
NOGROUND='''()=>{const D=__dc,G=D.G;const keep=G.solids;G.solids=keep.filter(s=>s.k!='g');G.lastSafe={x:G.d.x,y:GY-40};const t0=performance.now();let err=null;try{D.respawn('')}catch(e){err=String(e)}const ms=performance.now()-t0;G.solids=keep;return {ms:Math.round(ms),err}}'''
try:
 with sync_playwright() as p:
  b=p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
  for w,h in [(915,412),(412,915)]:
    cx=b.new_context(viewport={'width':w,'height':h},device_scale_factor=2,has_touch=True,is_mobile=True);pg=cx.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and errs.append(m.text))
    def fresh():
        pg.goto(URL);pg.wait_for_timeout(400);pg.tap('#go');pg.wait_for_timeout(500);pg.evaluate("()=>{__dc.G.d.x=__dc.G.secs[0].x0+60}")
    tag=f'{w}x{h}'
    for diff_try in range(3):
        fresh();r=pg.evaluate(BOULDER)
        if not r.get('nopit'):break
    check(not r.get('nopit'),f'{tag}: found a hole to test')
    if not r.get('nopit'):
        check(0<=r['gone']<=60 and r['left']==0,f'{tag}: boulder rolling into a hole is gone within 1 s {r}')
        check(r['hearts']==0,f'{tag}: boulder in the hole never hurts the dino {r}')
        check(r.get('ctrl') is True,f'{tag}: boulder on flat ground still rolls (not removed) {r}')
    fresh();r=pg.evaluate(LAVA)
    if not r.get('nopit'):
        check(r['gone']>=0 and r['over']<=8,f'{tag}: lava flow reaching a hole is gone (at most {r["over"]} px over the hole) {r}')
        check(r.get('ctrl') is True,f'{tag}: lava on flat ground still flows {r}')
    for how in ['respawn','stay','life']:
        fresh();s=pg.evaluate(STUCK,how)
        if s.get('nopit'):continue
        check(s['clear'] and s['onGround'] and s['falls']==0,f'{tag}: {how}: dino put back over a hole is moved to solid ground, no falls after {s}')
        check(s['ms']<200,f'{tag}: {how}: safe-spot search is quick ({s["ms"]} ms, no endless loop)')
    fresh();n=pg.evaluate(NOGROUND);check(n['err'] is None and n['ms']<200,f'{tag}: no ground loaded at all: respawn still returns quickly, no error {n}')
    if w==915:
        fresh();pg.evaluate("()=>{"+PREP+"calm();G.hit=0;G.safeT=999;G.camX=pit.x-VW*.5;G.d.x=G.camX+40;G.d.y=GY-G.d.h;G.boulders.push({x:pit.x+pit.w+90,y:GY-28,w:28,h:28,vx:-2.6,sp:1,vy:0,a:0,tag:1});window.__pit=pit}")
        pg.wait_for_timeout(500);pg.screenshot(path=SHOTS+'/boulder-at-hole.png')
        pg.wait_for_timeout(900);pg.screenshot(path=SHOTS+'/boulder-gone.png')
        fresh();pg.evaluate("()=>{"+PREP+"calm();G.hit=0;G.camX=pit.x-5;G.lastSafe={x:pit.x+pit.w/2,y:GY-40};G.d.x=pit.x+pit.w/2-17;G.d.y=GY-40;D.respawn('')}")
        pg.wait_for_timeout(900);pg.screenshot(path=SHOTS+'/respawn-next-to-hole.png')
    check(not errs,f'{tag}: no page errors {errs[:3]}');cx.close()
  b.close()
finally:
  srv.terminate()
print(f'{passes} passed, {len(fails)} failed');sys.exit(1 if fails else 0)

# Dino Colossus v24 (Hard only): the silly human appears a safe distance from the dino and walks AWAY, so it is never eaten
# without input; chasing it still catches it. Pretend phone: headless Chromium with touch. Run: python3 tests/test_v24.py
# ROOT env var lets the same checks run against an older copy (to prove they fail there).
import subprocess,time,sys,os,json
from playwright.sync_api import sync_playwright
ROOT=os.environ.get('ROOT') or os.path.dirname(os.path.dirname(os.path.abspath(__file__)));PORT=8894
SHOTS=os.environ.get('SHOTS','/workspace/dino-shots/v24');os.makedirs(SHOTS,exist_ok=True)
srv=subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
URL=f'http://localhost:{PORT}/';fails=[];passes=0
def check(c,m):
    global passes
    print(('PASS ' if c else 'FAIL ')+m)
    if c: passes+=1
    else: fails.append(m)
sw=open(os.path.join(ROOT,'sw.js')).read();html=open(os.path.join(ROOT,'index.html')).read()
check('const VER="26"' in sw and sw.count('?v=26')==4 and '?v=23' not in sw,'sw VER 24, SHELL ?v=26')
check(html.count('?v=26')==4 and '>v26 · A Slimetrail production<' in html,'index.html ?v=26 and footer v24')
check('pops up' not in html and 'walks away' in html,'How to play: silly human "walks away", no "pops up"')
check(os.path.exists(os.path.join(ROOT,'CHANGES-v24.md')),'CHANGES-v24.md exists')
code=' '.join(open(os.path.join(ROOT,f)).read().lower() for f in ['index.html','game.js','vis.js','sprites.js','sw.js','intro.js'])
for w in ['adsense','admob','doubleclick','applovin','unityads','gtag','analytics','fbq','utm_','affiliate','adsbygoogle']: check(w not in code,f'ad scan: no {w}')
SAFE=100  # px between dino body and human at spawn
CASE="""(a)=>{const D=__dc,G=D.G,d=G.d,[face,pos,seed]=a;let r=seed*9301+49297;Math.random=()=>((r=(r*9301+49297)%233280)/233280);
 G.banner=null;G.secBanner=null;const GYf=D.consts.GY;G.solids=[{x:G.camX-3000,y:GYf,w:9000,h:800,k:'g'}];G.lava=[];d.y=GYf-d.h;d.vy=0;d.on=null;G.boss=null;const V=D.view.VW;const px={left:4,middle:V/2-17,right:V-38,edgeL:0,edgeR:V-34}[pos];
 d.x=G.camX+px;d.f=face;d.vx=0;keys.arrowright=0;keys.arrowleft=0;D.sillyStart('pogo');G.sil.next=999;const e0=G.silEaten||0;
 const h0=D.sillyHum();const gap=h=>Math.max(h.x-(d.x+d.w),d.x-(h.x+h.w));const g0=h0?gap(h0):-1;let gmin=g0,walkAway=null,x0=h0?h0.x:0;const dx0=d.x;
 for(let i=0;i<120;i++){G.littles=[];G.rangers=[];G.boulders=[];G.meteors=[];G.critters=[];G.bigs=[];G.inv=9999;G.hearts=5;d.vx=0;keys.arrowright=0;keys.arrowleft=0;
  update();if((G.silEaten||0)>e0||G.sil.fx)break;const h=D.sillyHum();if(!h)break;gmin=Math.min(gmin,gap(h));
  if(i==30)walkAway=(h.x>d.x)==(h.x>x0)}
 return {g0:Math.round(g0),gmin:Math.round(gmin),eaten:(G.silEaten||0)-e0,walkAway,side:G.sil.side,dmove:Math.round(d.x-dx0),dying:!!G.dying}}"""
def mob(b): return b.new_context(viewport={'width':844,'height':390},device_scale_factor=3,has_touch=True,is_mobile=True)
try:
 with sync_playwright() as p:
  b=p.chromium.launch();cx=mob(b);pg=cx.new_page();errs=[];ext=[]
  pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('request',lambda r:(not r.url.startswith(URL)) and not r.url.startswith('data:') and ext.append(r.url))
  pg.goto(URL+'?intro=0');pg.evaluate("localStorage.dinoColossus_Diff='hard'");pg.reload();pg.wait_for_timeout(300);pg.tap('#go');pg.wait_for_timeout(500)
  for face in [-1,1]:
   for pos in ['left','middle','right','edgeL','edgeR']:
    rs=[pg.evaluate(CASE,[face,pos,s]) for s in range(1,6)]
    nm=f"facing {'left' if face<0 else 'right'}, dino at {pos}"
    print('CASE',nm,json.dumps(rs))
    check(all(r['g0']>=SAFE for r in rs),f'{nm}: spawns >= {SAFE} px from the dino (got {[r["g0"] for r in rs]})')
    check(all(r['eaten']==0 for r in rs),f'{nm}: not eaten in 2 s with no input (5 seeds)')
    check(all(r['walkAway'] for r in rs) and all(r['gmin']>=60 for r in rs),f'{nm}: walks away from the dino')
  # chase: dino runs toward it and catches it, trick runs
  for face in [-1,1]:
   r=pg.evaluate("""(face)=>{const D=__dc,G=D.G,d=G.d;G.banner=null;G.secBanner=null;const GYf=D.consts.GY;G.solids=[{x:G.camX-3000,y:GYf,w:9000,h:800,k:'g'}];G.lava=[];d.y=GYf-d.h;d.vy=0;d.on=null;d.x=G.camX+(face<0?D.view.VW*.6:20);d.f=face;D.sillyStart('stink');G.sil.next=999;const e0=G.silEaten||0;
     const k=G.sil.side>0?'arrowright':'arrowleft';keys[k]=1;let i=0;for(;i<600;i++){G.littles=[];G.critters=[];G.bigs=[];G.rangers=[];G.boulders=[];G.meteors=[];G.inv=9999;G.hearts=5;update();if((G.silEaten||0)>e0)break}
     keys[k]=0;return {eaten:(G.silEaten||0)-e0,fx:G.sil.fx&&G.sil.fx.k,frames:i,dx:Math.round(d.x-G.camX),hx:G.sil.hx==null?null:Math.round(G.sil.hx-G.camX),side:G.sil.side,warn:G.sil.warn,run:G.running,dying:G.dying}}""",face)
   print('CHASE',face,r);check(r['eaten']==1 and r['fx']=='stink',f'chasing (dino facing {"left" if face<0 else "right"}) catches it and its trick runs {r}')
  # respawn (dino put back after a pit) right onto the human: not eaten, human placed away again
  r=pg.evaluate("""()=>{const D=__dc,G=D.G,d=G.d;G.banner=null;G.secBanner=null;const GYf=D.consts.GY;G.solids=[{x:G.camX-3000,y:GYf,w:9000,h:800,k:'g'}];G.lava=[];d.y=GYf-d.h;d.vy=0;d.on=null;d.x=G.camX+300;d.f=1;D.sillyStart('pogo');G.sil.next=999;const e0=G.silEaten||0;update();d.x=G.sil.hx-5;let i=0;
   for(;i<120;i++){G.littles=[];G.rangers=[];G.boulders=[];G.meteors=[];G.critters=[];G.bigs=[];G.inv=9999;G.hearts=5;d.vx=0;keys.arrowright=0;keys.arrowleft=0;update();if((G.silEaten||0)>e0)break}
   const h=D.sillyHum();return {eaten:(G.silEaten||0)-e0,gap:h?Math.round(Math.max(h.x-(d.x+d.w),d.x-(h.x+h.w))):null}}""")
  print('RESPAWN',r);check(r['eaten']==0,f'dino put back on top of the human (respawn) does not eat it {r}')
  # QA item 2: Hard spear people = round(v22 x 1.2) per section; Easy/Medium unchanged
  sp=pg.evaluate("""()=>{const D=__dc,G=D.G,o=G.diff,res={};for(const df of ['easy','medium','hard']){G.diff=df;res[df]=[1,2,3,4,5,6,7,8,9,10].map(n=>{const RT=D.DK.rate(D.DMUL[df]*(1+.4*(((n-1)%5)/4))),b=Math.min(5,1+(n>>1))*RT;return {n,base:Math.min(12,Math.round(b)),v22:Math.min(12,Math.round(b*.35)),now:D.rangerN(n,RT)}})}G.diff=o;return res}""")
  print('SPEAR hard v22',[r['v22'] for r in sp['hard']],'v24',[r['now'] for r in sp['hard']])
  check(all(r['now']==min(12,int(r['v22']*1.2+.5)) for r in sp['hard']),'Hard spear people per section = round(v22 x 1.2)')
  check([r['now'] for r in sp['hard']][1:3]==[4,4] and [r['now'] for r in sp['hard']][8:10]==[8,8],'Hard s2,s3 = 4 and s9,s10 = 8')
  check(all(r['now']==r['base'] for d in ['easy','medium'] for r in sp[d]),'Easy/Medium spear people unchanged')
  # QA item 3: it stays on screen (stops at the edge) for 8 s with no input, then is gone; a late chase still catches it
  r=pg.evaluate("""()=>{const D=__dc,G=D.G,d=G.d;G.banner=null;G.secBanner=null;const GYf=D.consts.GY;G.solids=[{x:G.camX-3000,y:GYf,w:9000,h:800,k:'g'}];G.lava=[];d.y=GYf-d.h;d.vy=0;d.on=null;G.camX=Math.max(G.camX,d.x-D.view.VW*.4);d.x=G.camX+D.view.VW*.4;d.f=1;D.sillyStart('pogo');G.sil.next=999;const e0=G.silEaten||0;let on=0,i=0;
   for(;i<60*12;i++){G.littles=[];G.rangers=[];G.boulders=[];G.meteors=[];G.critters=[];G.bigs=[];G.inv=9999;G.hearts=5;d.vx=0;keys.arrowright=0;keys.arrowleft=0;update();const h=D.sillyHum();if(!(G.sil.warn>0)||!h)break;if(h.x>=G.camX-2&&h.x+h.w<=G.camX+D.view.VW+2)on++}
   return {secs:+(i/60).toFixed(2),onScreen:+(on/60).toFixed(2),eaten:(G.silEaten||0)-e0}}""")
  print('STAY',r);check(r['eaten']==0 and r['secs']>=7.5 and r['onScreen']>=7.5,f'silly human stays on screen about 8 s when not chased {r}')
  r=pg.evaluate("""()=>{const D=__dc,G=D.G,d=G.d;G.banner=null;G.secBanner=null;const GYf=D.consts.GY;G.solids=[{x:G.camX-3000,y:GYf,w:9000,h:800,k:'g'}];G.lava=[];d.y=GYf-d.h;d.vy=0;d.on=null;d.x=G.camX+D.view.VW*.4;d.f=1;D.sillyStart('pogo');G.sil.next=999;const e0=G.silEaten||0;let i=0;
   for(;i<60*8;i++){G.littles=[];G.rangers=[];G.boulders=[];G.meteors=[];G.critters=[];G.bigs=[];G.inv=9999;G.hearts=5;keys.arrowright=i>=180?1:0;update();if((G.silEaten||0)>e0)break}keys.arrowright=0;
   return {eaten:(G.silEaten||0)-e0,catchAt:+(i/60).toFixed(2)}}""")
  print('LATE-CHASE',r);check(r['eaten']==1,f'player who starts chasing 3 s late still catches it {r}')
  # screenshots
  for face,pos,nm in [(-1,4,'left-edge-facing-left'),(1,None,'right-edge-facing-right')]:
   pg.evaluate("""([face,px])=>{const D=__dc,G=D.G,d=G.d;G.banner=null;G.secBanner=null;const GYf=D.consts.GY;G.solids=[{x:G.camX-3000,y:GYf,w:9000,h:800,k:'g'}];G.lava=[];d.y=GYf-d.h;d.vy=0;d.on=null;const V=D.view.VW;G.camX=Math.max(G.camX,d.x-V*.4);d.x=G.camX+(px==null?V-38:px);d.f=face;d.vx=0;D.sillyStart('pogo');G.sil.next=999}""",[face,pos])
   pg.wait_for_timeout(900);pg.screenshot(path=f'{SHOTS}/hard-{nm}.png')
  # QA D5: 360x640 credit line on screen; portrait belly meter inside the screen
  cx3=b.new_context(viewport={'width':360,'height':640},device_scale_factor=2,has_touch=True,is_mobile=True);p3=cx3.new_page();p3.goto(URL+'?intro=0');p3.wait_for_timeout(400)
  vb=p3.evaluate("document.getElementById('ver').getBoundingClientRect().bottom");check(vb<=640,f'360x640: credit line inside the screen (bottom {vb})');cx3.close()
  cx3=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True,is_mobile=True);p3=cx3.new_page();p3.goto(URL+'?intro=0');p3.wait_for_timeout(400);p3.tap('#go');p3.wait_for_timeout(500)
  src=open(os.path.join(ROOT,'game.js')).read();check('rs0=portrait?8:' in src,'portrait: belly meter not pushed off by the top buttons (read in code)')
  cx3.close()
  # QA D6: title sound button can be tapped
  pg.goto(URL+'?intro=0');pg.wait_for_timeout(400)
  t=pg.evaluate("(()=>{const b=document.getElementById('snd'),r=b.getBoundingClientRect();const e=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {top:e===b||b.contains(e),txt:b.textContent}})()")
  check(t['top'],f'title: sound button is on top (not covered) {t}')
  try: pg.tap('#snd',timeout=3000)
  except Exception: pass
  t2=pg.evaluate("[document.getElementById('snd').textContent,localStorage.dinoColossus_Snd]")
  check(t2[0]!=t['txt'] and t2[1]=='0',f'title: tapping the sound button mutes {t2}')
  # QA D4: storage blocked -> game still starts
  cx2=mob(b);cx2.add_init_script("Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new DOMException('blocked','SecurityError')}})");p2=cx2.new_page();e2=[]
  p2.on('pageerror',lambda e:e2.append(str(e)));p2.goto(URL+'?intro=0');p2.wait_for_timeout(500)
  try: p2.tap('#go',timeout=4000);p2.wait_for_timeout(800);ok=p2.evaluate("!!(window.__dc&&__dc.G.running)")
  except Exception as ex: ok=False;e2.append(str(ex)[:120])
  check(ok and not e2,f'storage blocked: PLAY still starts the game {e2}');cx2.close()
  check(not errs and not ext,f'no errors / no outside requests {errs} {ext}');cx.close();b.close()
finally:
  srv.terminate()
print(f'{passes} passed, {len(fails)} failed');sys.exit(1 if fails else 0)

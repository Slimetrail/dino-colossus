# Dino Colossus v25: QA E1-E5 + open items. Pretend phone: headless Chromium with touch (not a real phone).
# Run: python3 tests/test_v25.py   ROOT=<older copy> runs the same checks against it (they must fail on v24).
import subprocess,time,sys,os,json,shutil,tempfile,re
from playwright.sync_api import sync_playwright
ROOT=os.environ.get('ROOT') or os.path.dirname(os.path.dirname(os.path.abspath(__file__)));PORT=int(os.environ.get('PORT','8895'))
SHOTS=os.environ.get('SHOTS','/workspace/dino-shots/v25');os.makedirs(SHOTS,exist_ok=True)
SRV="""import http.server,sys,os
class H(http.server.SimpleHTTPRequestHandler):
  def list_directory(self,path):self.send_error(404);return None
  def log_message(self,*a):pass
os.chdir(sys.argv[2]);http.server.ThreadingHTTPServer(('127.0.0.1',int(sys.argv[1])),H).serve_forever()"""
def serve(d,port):return subprocess.Popen([sys.executable,'-c',SRV,str(port),d],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
srv=serve(ROOT,PORT);time.sleep(1)
URL=f'http://127.0.0.1:{PORT}/';fails=[];passes=0;INFO={}
def check(c,m):
    global passes
    print(('PASS ' if c else 'FAIL ')+m,flush=True)
    if c: passes+=1
    else: fails.append(m)
sw=open(os.path.join(ROOT,'sw.js')).read();html=open(os.path.join(ROOT,'index.html')).read()
check('const VER="26"' in sw and sw.count('?v=26')==4 and '?v=24' not in sw,'sw VER 25, SHELL ?v=26')
check(html.count('?v=26')==4 and '>v26 · A Slimetrail production<' in html,'index.html ?v=26 and footer v25')
check(os.path.exists(os.path.join(ROOT,'CHANGES-v25.md')),'CHANGES-v25.md exists')
code=' '.join(open(os.path.join(ROOT,f)).read().lower() for f in ['index.html','game.js','vis.js','sprites.js','sw.js','intro.js'])
for w in ['adsense','admob','doubleclick','applovin','unityads','gtag','analytics','fbq','affiliate','adsbygoogle']: check(w not in code,f'ad scan: no {w}')
diff_doc=open(os.path.join(ROOT,'DIFFICULTY.md')).read()
check('still catches it at about 5.1 s (measured on a pretend phone, flat ground)' not in diff_doc and 'about 5.3 s in landscape' in diff_doc,'DIFFICULTY.md late-starter claim re-measured for portrait AND landscape')
SPY="""(()=>{window.__au=[];const A=window.AudioContext;window.AudioContext=window.webkitAudioContext=function(...a){const c=new A(...a);__au.push('ctx:'+c.state);const r=c.resume.bind(c);c.resume=()=>{__au.push('resume');return r()};window.__ac=c;return c};
 const P=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){__au.push('play');return P.call(this)};
 const S=AudioBufferSourceNode.prototype.start;AudioBufferSourceNode.prototype.start=function(...a){if(!(this.context instanceof OfflineAudioContext))__au.push('LIVEbuf');return S.apply(this,a)};
 const O=OscillatorNode.prototype.start;OscillatorNode.prototype.start=function(...a){if(!(this.context instanceof OfflineAudioContext))__au.push('LIVEosc');return O.apply(this,a)};
 if(window.speechSynthesis){const sp=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=u=>{__au.push('speak');return sp(u)}}})()"""
SOUNDY=lambda a:[x for x in a if x in('resume','play','LIVEbuf','LIVEosc','speak')]
def mob(b,w=844,h=390,**k): return b.new_context(viewport={'width':w,'height':h},device_scale_factor=3,has_touch=True,is_mobile=True,**k)
def pgnew(cx,errs):
    pg=cx.new_page();pg.on('pageerror',lambda e:errs.append(str(e)[:200]));return pg
CLEAR="G.littles=[];G.rangers=[];G.boulders=[];G.meteors=[];G.critters=[];G.bigs=[];G.inv=9999;G.hearts=5;keys.arrowright=0;keys.arrowleft=0;"
SETUP="const D=__dc,G=D.G,d=G.d;G.banner=null;G.secBanner=null;const GYf=D.consts.GY;G.solids=[{x:G.camX-3000,y:GYf,w:90000,h:800,k:'g'}];G.lava=[];d.y=GYf-d.h;d.vy=0;d.on=null;d.x=G.camX+D.view.VW*.4;d.f=1;d.vx=0;"
try:
 with sync_playwright() as p:
  b=p.chromium.launch();allerrs=[]
  # ---- E1: no sound on finger-down; sound only after the finger lifts ----
  for target in ['gate','title_go']:
   cx=mob(b);cx.add_init_script(SPY);errs=[];pg=pgnew(cx,errs);pg.goto(URL+('' if target=='gate' else '?intro=0'));pg.wait_for_timeout(1500)
   if target=='gate':
    st=pg.evaluate("(()=>{const e=document.getElementById('introTap');return e?e.style.display:'none-el'})()");check(st=='flex','E1 gate: Tap to start is showing');x,y=422,195
   else:
    bb=pg.locator('#go').bounding_box();x,y=bb['x']+bb['width']/2,bb['y']+bb['height']/2
   cdp=cx.new_cdp_session(pg);pg.evaluate("__au.length=0")
   cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]});pg.wait_for_timeout(1500)
   down=pg.evaluate("__au.slice()");gate_up=pg.evaluate("!!document.getElementById('introTap')&&document.getElementById('introTap').style.display!=='none'")
   cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});pg.wait_for_timeout(2500)
   up=pg.evaluate("__au.slice()")
   print('E1',target,'down',down,'up',up[:12])
   check(not SOUNDY(down),f'E1 {target}: finger held down 1.5 s, no sound started {SOUNDY(down)}')
   if target=='gate':check(gate_up,'E1 gate: "Tap to start" stays up while the finger is still down')
   check(len(SOUNDY(up))>0,f'E1 {target}: after the finger lifts, sound starts {SOUNDY(up)[:6]}')
   allerrs+=errs;cx.close()
  # ---- E2: storage full (setItem throws QuotaExceededError) with saves in place ----
  INIT="""(()=>{const s={dinoColossus_Best_hard:'7777',dinoColossus_Diff:'hard',dinoColossus_Snd:'0',dinoColossus_Calm:'1',dinoColossus_Top10_hard:JSON.stringify([{i:'ABC',s:7777,sec:3,dn:0,t:1}]),
  dinoColossus_DressStars:'9',dinoColossus_DressOwned:JSON.stringify(['lime']),dinoColossus_DressOn:JSON.stringify({c:'lime'}),dinoColossus_Unlocks:JSON.stringify({flame:1})};
  try{for(const k in s)localStorage.setItem(k,s[k])}catch(e){}Storage.prototype.setItem=function(){throw new DOMException('full','QuotaExceededError')}})()"""
  cx=mob(b);cx.add_init_script(INIT);errs=[];pg=pgnew(cx,errs);pg.goto(URL+'?intro=0');pg.wait_for_timeout(1200)
  r=pg.evaluate("({best:document.getElementById('best').textContent,bestd:document.getElementById('bestd').textContent,snd:document.getElementById('snd').textContent,top:(__dc.loadTop('hard')[0]||{}).i,stars:VIS.stars,dress:VIS.on.c,flame:__dc.unl.flame,calm:VIS.calm})")
  print('E2',r)
  check(r['best']=='7777' and r['bestd']=='HARD','E2 quota_full_with_saves: saved Best 7777 and HARD shown')
  check(r['snd']=='🔇','E2 quota_full_with_saves: saved mute kept')
  check(r['top']=='ABC','E2 quota_full_with_saves: saved Top 10 kept')
  check(r['stars']==9 and r['dress']=='lime','E2 quota_full_with_saves: saved dress-up kept')
  check(r['flame']==1,'E2 quota_full_with_saves: saved unlocks kept')
  check(r['calm'] is True,'E2 quota_full_with_saves: saved Calm kept')
  try:pg.tap('#go',timeout=3000);pg.wait_for_timeout(800);ok=pg.evaluate("__dc.G.running")
  except Exception as e:ok=False;errs.append(str(e)[:100])
  check(ok and not errs,f'E2 quota_full_with_saves: PLAY works, no errors {errs}');cx.close()
  # ---- E3: start-screen buttons >= 44 px, on screen, no scrolling needed ----
  for (w,h) in [(844,390),(390,844),(360,640),(640,360),(915,412),(412,915)]:
   cx=mob(b,w,h);errs=[];pg=pgnew(cx,errs);pg.goto(URL+'?intro=0');pg.wait_for_timeout(700)
   bad=pg.evaluate("[...document.querySelectorAll('#start button,#snd')].filter(e=>e.getBoundingClientRect().width>0).map(e=>{const r=e.getBoundingClientRect();return [e.id||e.dataset.d||e.textContent.trim().slice(0,10),Math.round(r.width),Math.round(r.height),Math.round(r.top),Math.round(r.bottom)]}).filter(x=>x[2]<44||x[1]<44||x[3]<0||x[4]>innerHeight+.5)")
   check(not bad,f'E3 {w}x{h}: every start button and the sound button >= 44 px and on screen {bad}')
   if (w,h) in [(844,390),(390,844),(640,360)]:pg.screenshot(path=f'{SHOTS}/start-{w}x{h}.png',animations='disabled')
   allerrs+=errs;cx.close()
  # ---- open item: home/sound buttons never cover the belly numbers ----
  for (w,h) in [(640,360),(740,360),(844,390),(915,412),(390,844),(360,640)]:
   cx=mob(b,w,h);errs=[];pg=pgnew(cx,errs);pg.goto(URL+'?intro=0');pg.wait_for_timeout(500);pg.tap('#go');pg.wait_for_timeout(700)
   pg.evaluate("__dc.G.belly=15;__dc.G.banner=null;__dc.G.secBanner=null");pg.wait_for_timeout(400)
   o=pg.evaluate("""(()=>{const v=__dc.view,bb=__dc.G.belBox;if(!bb)return {err:'no belBox'};const m=[bb[0]*v.S,bb[1]*v.S+v.OY,(bb[0]+bb[2])*v.S,(bb[1]+bb[3])*v.S+v.OY];
     const hit=['menub','snd'].map(i=>{const r=document.getElementById(i).getBoundingClientRect();return (r.left<m[2]&&r.right>m[0]&&r.top<m[3]&&r.bottom>m[1])?i:null}).filter(Boolean);return {m:m.map(Math.round),hit,inside:m[2]<=innerWidth+1}})()""")
   check(not o.get('err') and not o['hit'] and o['inside'],f'belly numbers not covered by home/sound at {w}x{h} {o}')
   if (w,h)==(640,360):pg.screenshot(path=f'{SHOTS}/game-640x360.png',animations='disabled')
   allerrs+=errs;cx.close()
  # ---- E5: blur / hide pauses the silly human's timer; 80 s mutant: the human must leave after about 8 s ----
  cx=mob(b);errs=[];pg=pgnew(cx,errs);pg.goto(URL+'?intro=0');pg.evaluate("localStorage.dinoColossus_Diff='hard'");pg.reload();pg.wait_for_timeout(400);pg.tap('#go');pg.wait_for_timeout(600)
  E5="""(mode)=>{"""+SETUP+"""D.sillyStart('pogo');G.sil.next=999;const step=n=>{for(let i=0;i<n;i++){"""+CLEAR+"""d.vx=0;update()}};step(30);const w0=G.sil.warn;
   if(mode=='blur')dispatchEvent(new Event('blur'));else{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))}
   step(300);const w1=G.sil.warn;
   if(mode=='blur')dispatchEvent(new Event('focus'));else{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'))}
   step(60);const w2=G.sil.warn;return {w0:+w0.toFixed(2),w1:+w1.toFixed(2),w2:+w2.toFixed(2)}}"""
  for mode in ['blur','hidden']:
   r=pg.evaluate(E5,mode);print('E5',mode,r)
   check(abs(r['w1']-r['w0'])<0.02 and r['w2']<r['w1']-0.5,f'E5 {mode}: human timer stops while away and runs again after {r}')
  LIFE="""(walk)=>{"""+SETUP+"""const o=D.SIL.walk;if(walk)D.SIL.walk=walk;D.sillyStart('pogo');G.sil.next=999;const e0=G.silEaten||0;let i=0;
   for(;i<60*90;i++){"""+CLEAR+"""d.vx=0;update();if(!(G.sil.warn>0)||!D.sillyHum())break}D.SIL.walk=o;return {secs:+(i/60).toFixed(2),eaten:(G.silEaten||0)-e0}}"""
  r=pg.evaluate(LIFE,0);print('LIFE',r);INFO['life']=r
  check(r['eaten']==0 and 7.5<=r['secs']<=9,f'silly human leaves after about 8 s (7.5 to 9 s) when not chased {r}')
  m=pg.evaluate(LIFE,80);print('LIFE mutant walk=80',m)
  check(m['secs']>9,f'mutant check: a human that stays 80 s is caught by the 7.5-9 s check (mutant stayed {m["secs"]} s)')
  allerrs+=errs;cx.close()
  # ---- late starter (3 s late) real-time chase on flat ground with creatures cleared (matches the DIFFICULTY.md claim), portrait and landscape, real touch on the right arrow ----
  for (w,h) in [(844,390),(390,844)]:
   ts=[]
   for rep in range(2):
    cx=mob(b,w,h);errs=[];pg=pgnew(cx,errs);pg.goto(URL+'?intro=0');pg.evaluate("localStorage.dinoColossus_Diff='hard'");pg.reload();pg.wait_for_timeout(500);pg.tap('#go');pg.wait_for_timeout(800)
    pg.evaluate("()=>{const G=__dc.G,GY=__dc.consts.GY;G.solids=[{x:G.camX-3000,y:GY,w:90000,h:800,k:'g'}];G.lava=[];G.inv=1e6;G.banner=null;G.secBanner=null;G.sil=G.sil||{n:0};G.d.f=1;__dc.sillyStart('pogo');G.sil.next=999;window.__e0=G.silEaten||0;window.__g0=G.el;(function c(){const G=__dc.G;G.littles=[];G.rangers=[];G.boulders=[];G.meteors=[];G.critters=[];G.bigs=[];if(G.sil.warn>0)requestAnimationFrame(c)})()}")
    pg.wait_for_timeout(3000);pg.dispatch_event('#br','pointerdown',{'pointerType':'touch'});t=None
    for i in range(60):
     pg.wait_for_timeout(100);x=pg.evaluate("({e:(__dc.G.silEaten||0)-__e0,w:__dc.G.sil.warn,g:__dc.G.el-__g0})")
     if x['e']:t=round(x['g'],2);break
     if not x['w']>0:break
    pg.dispatch_event('#br','pointerup',{'pointerType':'touch'});ts.append(t);allerrs+=errs;cx.close()
   INFO[f'late-{w}x{h}']=ts;print('LATE',w,h,ts)
   check(all(t is not None and 4.5<=t<=6.5 for t in ts),f'late starter (3 s late, flat ground, creatures cleared) catches it at {w}x{h} in 4.5-6.5 game s: {ts}')
  # ---- E4: updates all-or-nothing (server answers 404 for missing files, like GitHub Pages) ----
  VER=re.search(r'const VER="([^"]+)"',sw).group(1)
  for drop in ['game.js','index.html']:
   tmp=tempfile.mkdtemp(prefix='dino25upd-');site=os.path.join(tmp,'s');shutil.copytree(ROOT,site,ignore=shutil.ignore_patterns('.git','tests'))
   up=PORT+10+(drop=='index.html');s2=serve(site,up);time.sleep(.8);U=f'http://127.0.0.1:{up}/'
   cx=mob(b,service_workers='allow');errs=[];pg=pgnew(cx,errs);pg.goto(U+'?intro=0')
   for i in range(40):
    if pg.evaluate("!!navigator.serviceWorker.controller"):break
    pg.wait_for_timeout(250)
   pg.wait_for_timeout(800)
   s=open(os.path.join(site,'sw.js')).read().replace(f'const VER="{VER}"',f'const VER="{VER}.5"');open(os.path.join(site,'sw.js'),'w').write(s)
   os.remove(os.path.join(site,drop))
   pg.evaluate("navigator.serviceWorker.getRegistration().then(r=>r&&r.update()).catch(()=>{})");pg.wait_for_timeout(3000)
   keys=pg.evaluate("caches.keys()")
   check(f'dinocol-v{VER}.5' not in keys and f'dinocol-v{VER}' in keys,f'E4 dropped {drop}: failed update leaves no part-filled cache, old cache kept {keys}')
   try:
    pg.goto(U+'?intro=0');pg.wait_for_timeout(1500);pg.tap('#go',timeout=4000);pg.wait_for_timeout(800);ok=pg.evaluate("typeof __dc!=='undefined'&&__dc.G.running")
   except Exception as e:ok=False;errs.append(str(e)[:120])
   check(ok,f'E4 dropped {drop}: the game still opens and starts {errs[:2]}')
   pg.screenshot(path=f'{SHOTS}/update-dropped-{drop}.png');cx.close();s2.terminate();shutil.rmtree(tmp,ignore_errors=True)
  check(not allerrs,f'no page errors {allerrs[:4]}')
  b.close()
finally:
  srv.terminate()
print('INFO',json.dumps(INFO))
print(f'{passes} passed, {len(fails)} failed');sys.exit(1 if fails else 0)

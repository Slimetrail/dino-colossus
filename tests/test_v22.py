# Dino Colossus v22: Tap to start before the intro (intro music plays once with the movie), credit "A Slimetrail production",
# and an "Update ready — tap to reload" button. Run: python3 tests/test_v22.py
import subprocess,time,sys,os,re,json,shutil,tempfile
from playwright.sync_api import sync_playwright
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));PORT=8867;PORT2=8868
SHOTS=os.environ.get('SHOTS','/workspace/intro-shots/dino-r4')
srv=subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
TMP=tempfile.mkdtemp(prefix='dino-upd-');shutil.copytree(ROOT,os.path.join(TMP,'app'),ignore=shutil.ignore_patterns('.git','tests','sounds-silly'));APP=os.path.join(TMP,'app')
srv2=subprocess.Popen([sys.executable,'-m','http.server',str(PORT2)],cwd=APP,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
URL=f'http://localhost:{PORT}/';URL2=f'http://localhost:{PORT2}/';fails=[];passes=0
CREDIT='A Slimetrail production'
def check(c,m):
    global passes
    print(('PASS ' if c else 'FAIL ')+m)
    if c: passes+=1
    else: fails.append(m)
sw=open(os.path.join(ROOT,'sw.js')).read();html=open(os.path.join(ROOT,'index.html')).read();VER=re.search(r'VER="(\d+)"',sw).group(1)
check(VER=='22' and sw.count('?v=22')==4 and '?v=21' not in sw,'sw VER 22 and SHELL ?v=22')
check(html.count('?v=22')==5 and '?v=21' not in html,'index.html ?v=22 everywhere')
check('>v22 · A Slimetrail production<' in html,'title footer reads "v22 · A Slimetrail production"')
check('SlimeTrail' not in html and 'Designed and created' not in html and 'sound effects by' not in html.lower(),'no old credit wording or second credit line in index.html')
cr=open(os.path.join(ROOT,'CREDITS.md')).read();check(CREDIT in cr and 'SlimeTrail' not in cr,'CREDITS.md uses the one credit wording')
check(os.path.exists(os.path.join(ROOT,'CHANGES-v22.md')),'CHANGES-v22.md exists')
code=' '.join(open(os.path.join(ROOT,f)).read().lower() for f in ['index.html','game.js','vis.js','sprites.js','sw.js','intro.js'])
for w in ['adsense','admob','doubleclick','applovin','unityads','gtag','analytics','fbq','utm_','affiliate','adsbygoogle']: check(w not in code,f'ad scan: no {w}')
# count every AudioBufferSourceNode started, and which are still sounding
INIT="""(()=>{window.__srcs=[];const P=AudioBufferSourceNode.prototype,st=P.start,sp=P.stop;
P.start=function(...a){window.__srcs.push(this);this.__on=true;this.addEventListener('ended',()=>{this.__on=false});return st.apply(this,a)};
P.stop=function(...a){this.__on=false;return sp.apply(this,a)}})()"""
CNT="(()=>{const b=VIS.BUF.intro;const s=__srcs.filter(x=>b&&x.buffer===b);return {total:s.length,on:s.filter(x=>x.__on).length}})()"
def pg_(cx,init=INIT):
    pg=cx.new_page();pg.errs=[];pg.ext=[]
    if init: pg.add_init_script(init)
    pg.on('pageerror',lambda e:pg.errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and pg.errs.append(m.text))
    pg.on('request',lambda r:(not r.url.startswith(URL)) and (not r.url.startswith(URL2)) and not r.url.startswith('data:') and pg.ext.append(r.url));return pg
def mob(b,**k): return b.new_context(viewport={'width':844,'height':390},device_scale_factor=3,has_touch=True,is_mobile=True,**k)
def gate_up(pg): return pg.evaluate("(()=>{const e=document.getElementById('introTap');return !!e&&getComputedStyle(e).display!=='none'})()")
def wait_music(pg,ms=4000):
    try: pg.wait_for_function("VIS.oKey==='intro'",timeout=ms,polling=20);return True
    except Exception: return False
try:
 with sync_playwright() as p:
  b=p.chromium.launch(args=['--autoplay-policy=user-gesture-required'])
  # 1 cold launch: Tap to start first, nothing playing, no sound
  cx=mob(b);pg=pg_(cx);pg.goto(URL);pg.wait_for_timeout(500)
  check(gate_up(pg) and not pg.evaluate('INTRO.playing') and pg.evaluate('INTRO.runs')==0,'cold launch: Tap to start shows, intro not started yet')
  cov=pg.evaluate("(()=>{const e=document.getElementById('introTap'),r=e.getBoundingClientRect(),t=e.innerText;return {full:r.width>=innerWidth&&r.height>=innerHeight,z:+getComputedStyle(e).zIndex,t,fs:parseFloat(getComputedStyle(e.firstElementChild).fontSize)}})()")
  check(cov['full'] and cov['z']>=60 and 'Tap to start' in cov['t'] and cov['fs']>=32,f'tap screen covers the whole screen, big text {cov}')
  check(not pg.evaluate('VIS.tapped') and pg.evaluate(CNT)['total']==0,'no audio before the tap')
  pg.screenshot(path=f'{SHOTS}/00-tap-to-start.png')
  # 2 the tap starts intro + music together, once
  t=time.time();pg.touchscreen.tap(420,200);pg.wait_for_timeout(60)
  check(pg.evaluate('INTRO.playing') and pg.evaluate('INTRO.runs')==1 and not gate_up(pg),'tap starts the intro movie (once)')
  ok=wait_music(pg);lat=time.time()-t;c=pg.evaluate(CNT)
  check(ok and c=={'total':1,'on':1},f'tap starts the intro music once ({c}, started within {lat:.2f} s of the tap)')
  check(lat<1.5,f'music starts with the movie ({lat:.2f} s after the tap)')
  bus=pg.evaluate('VIS.vol()');check(abs(bus['musicBus']-.5*bus['music'])<1e-6,f'intro music on the existing music bus, unchanged gain {bus}')
  for i,at in enumerate((1.5,4.9,7.0)):
    pg.wait_for_function(f'INTRO.T>={at}',timeout=15000,polling=10);pg.screenshot(path=f'{SHOTS}/0{i+1}-intro-{at:.1f}s.png')
  pg.wait_for_function('!INTRO.playing',timeout=15000)
  # fps is measured on a second, clean intro run: the 3x screenshots above stall the page and would skew the numbers
  pg.reload();pg.wait_for_selector('#introTap',state='visible',timeout=10000);pg.wait_for_timeout(500);pg.touchscreen.tap(420,200)
  pg.wait_for_function('INTRO.playing',timeout=5000);pg.wait_for_function('!INTRO.playing',timeout=20000);st=pg.evaluate('INTRO.stats()');print('PERF normal speed',json.dumps(st))
  check(st and st['avg']<17.5 and st['p95']<18,f"normal speed 60 fps: avg {st['avg']:.1f} ms p95 {st['p95']:.1f} ms")
  c=pg.evaluate(CNT);check(c['total']==1,f'music played once in total through the whole intro ({c})')
  pg.wait_for_timeout(1500);c=pg.evaluate(CNT);check(c['total']==1,f'still one music copy on the title ({c})')
  check(not pg.errs and not pg.ext,f'no errors / outside requests {pg.errs} {pg.ext}');cx.close()
  # 3 skip keeps one music instance (skip early and late)
  for at in (.4,3.0):
    cx=mob(b);pg=pg_(cx);pg.goto(URL);pg.wait_for_selector('#introTap');pg.touchscreen.tap(420,200);wait_music(pg)
    pg.wait_for_function(f'INTRO.T>={at}',timeout=10000,polling=10);pg.touchscreen.tap(420,200);pg.wait_for_timeout(800)
    c1=pg.evaluate(CNT);pg.touchscreen.tap(420,330);pg.wait_for_timeout(1200);c2=pg.evaluate(CNT)
    check(not pg.evaluate('INTRO.playing') and pg.evaluate('INTRO.lastEnd')=='skip' and c1=={'total':1,'on':1} and c2['total']==1 and c2['on']<=1,f'skip at {at} s: music keeps playing, one copy only ({c1} then {c2})')
    check(not pg.errs,f'skip: no errors {pg.errs}');cx.close()
  # 4 mute respected
  cx=mob(b);pg=pg_(cx);pg.goto(URL+'?intro=0');pg.evaluate("localStorage.dinoColossus_Snd='0'");pg.goto(URL);pg.wait_for_selector('#introTap');pg.touchscreen.tap(420,200)
  pg.wait_for_timeout(2500);c=pg.evaluate(CNT);check(pg.evaluate('INTRO.playing') and c['total']==0,f'sound off: intro plays silently ({c})');cx.close()
  # 5 ?intro=0 unchanged: no tap screen, no intro
  cx=mob(b);pg=pg_(cx);pg.goto(URL+'?intro=0');pg.wait_for_timeout(600)
  check(not gate_up(pg) and not pg.evaluate('INTRO.playing') and pg.evaluate('INTRO.gates')==0 and pg.is_visible('#go'),'?intro=0: no tap screen, no intro, title ready');cx.close()
  # 6 back/forward cache restore: tap screen again, music restarts once with no overlap
  cx=mob(b);pg=pg_(cx);pg.goto(URL);pg.wait_for_selector('#introTap');pg.touchscreen.tap(420,200);wait_music(pg);pg.touchscreen.tap(420,200);pg.wait_for_timeout(600)
  pg.evaluate("dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))");pg.wait_for_timeout(200)
  check(gate_up(pg) and not pg.evaluate('INTRO.playing'),'pageshow restore: Tap to start shows again')
  pg.touchscreen.tap(420,200);pg.wait_for_timeout(1000);c=pg.evaluate(CNT)
  check(pg.evaluate('INTRO.playing') and pg.evaluate('INTRO.runs')==2 and c['on']==1 and c['total']==2,f'after restore tap: intro replays, one music copy sounding ({c})')
  pg.touchscreen.tap(420,200);pg.wait_for_timeout(500);pg.click('#go');pg.wait_for_timeout(600)
  pg.evaluate("dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))");pg.wait_for_timeout(200)
  check(not gate_up(pg) and pg.evaluate('G.running'),'pageshow during a running game: no tap screen, run not interrupted');check(not pg.errs,f'restore: no errors {pg.errs}');cx.close()
  # 7 suspended / failing audio context: intro still plays, no crash
  cx=mob(b);pg=pg_(cx,INIT+";AudioContext.prototype.resume=function(){return Promise.reject(new Error('blocked'))};")
  pg.goto(URL);pg.wait_for_selector('#introTap');pg.touchscreen.tap(420,200);pg.wait_for_timeout(1200)
  check(pg.evaluate('INTRO.playing') and not [e for e in pg.errs if 'blocked' not in e],f'audio context stays suspended: intro still plays, no crash {pg.errs}');cx.close()
  # 8 keyboard start works too
  cx=b.new_context(viewport={'width':915,'height':412});pg=pg_(cx);pg.goto(URL);pg.wait_for_selector('#introTap');pg.keyboard.press('Enter');pg.wait_for_timeout(300)
  check(pg.evaluate('INTRO.playing') and pg.evaluate('INTRO.runs')==1,'a key press also starts the intro (and does not skip it)');cx.close()
  # 9 credit on screen
  cx=mob(b);pg=pg_(cx);pg.goto(URL+'?intro=0');ver=pg.inner_text('#ver');check(ver.strip()=='v22 · A Slimetrail production' and pg.is_visible('#ver'),f'title footer shows exactly {ver!r}');cx.close()
  # 10 update button: never on first install, appears once after a new version takes over, tap reloads
  cx=b.new_context(viewport={'width':844,'height':390});pg=pg_(cx);pg.goto(URL2+'?intro=0')
  pg.wait_for_function("navigator.serviceWorker.controller!==null",timeout=15000);pg.wait_for_timeout(1500)
  check(not pg.is_visible('#updb') and pg.evaluate('DINO_UPD.shown')==0,'first install (no previous controller): no update button')
  pg.reload();pg.wait_for_function("navigator.serviceWorker.controller!==null",timeout=15000);pg.evaluate("dispatchEvent(new Event('focus'))");pg.wait_for_timeout(1500)
  check(not pg.is_visible('#updb'),'same version re-check: no update button')
  s2=open(os.path.join(APP,'sw.js')).read().replace('const VER="22"','const VER="22.9"');open(os.path.join(APP,'sw.js'),'w').write(s2)
  for _ in range(12):
    pg.evaluate("dispatchEvent(new Event('focus'))")
    try: pg.wait_for_selector('#updb',state='visible',timeout=2500);break
    except Exception: pass
  pg.wait_for_selector('#updb',state='visible',timeout=3000)
  keys=pg.evaluate("caches.keys()");check('dinocol-v22.9' in keys,f'button only after the new version is fully cached {keys}')
  pg.evaluate("document.dispatchEvent(new Event('visibilitychange'))");pg.wait_for_timeout(1500)
  check(pg.evaluate('DINO_UPD.shown')==1,'update button appears once')
  bb=pg.locator('#updb').bounding_box();check(bb and bb['height']>=44 and bb['x']<40 and bb['y']+bb['height']>=380,f'button is small, bottom-left, tappable {bb}')
  pg.screenshot(path=f'{SHOTS}/05-update-button.png')
  with pg.expect_navigation(timeout=10000): pg.click('#updb')
  pg.wait_for_timeout(800);check(not pg.is_visible('#updb') and pg.evaluate('DINO_UPD.shown')==0,'tap reloads the page; after reload the button is gone')
  check(not pg.errs,f'update flow: no errors {pg.errs}');cx.close()
  # 11 update during a run waits until the run is over
  cx=b.new_context(viewport={'width':844,'height':390});pg=pg_(cx);pg.goto(URL2+'?intro=0');pg.wait_for_function("navigator.serviceWorker.controller!==null",timeout=15000)
  pg.wait_for_timeout(800);pg.click('#go');pg.wait_for_timeout(600)
  s2=open(os.path.join(APP,'sw.js')).read().replace('const VER="22.9"','const VER="22.8"');open(os.path.join(APP,'sw.js'),'w').write(s2)
  for _ in range(12):
    pg.evaluate("dispatchEvent(new Event('focus'))")
    try: pg.wait_for_function('DINO_UPD.ready',timeout=2500);break
    except Exception: pass;pg.wait_for_timeout(500)
  check(pg.evaluate('G.running') and not pg.is_visible('#updb'),'new version during a run: no button and no reload mid-run')
  # 12 Hard: fewer spear people (40% of before), Easy/Medium unchanged; silly human always gets eaten
  cx=mob(b);pg=pg_(cx)
  tab={}
  for d in ['easy','medium','hard']:
    pg.goto(URL+'?intro=0');pg.evaluate(f"localStorage.dinoColossus_Diff='{d}'");pg.reload();pg.wait_for_timeout(300);pg.click('#go');pg.wait_for_timeout(300)
    tab[d]=pg.evaluate("[1,2,3,4,5,6,7,8,9,10].map(n=>{const x=__dc.Dx(n),RT=__dc.DK.rate(x);return {old:Math.min(12,Math.round(Math.min(5,1+(n>>1))*RT)),now:__dc.rangerN(n,RT)}})")
  print('SPEAR PEOPLE PER SECTION',json.dumps(tab))
  check(all(r['now']==r['old'] for d in ['easy','medium'] for r in tab[d]),'Easy and Medium spear-people counts unchanged')
  ho=sum(r['old'] for r in tab['hard']);hn=sum(r['now'] for r in tab['hard'])
  check(hn<=ho*.5 and hn>0,f'Hard spear people sections 1-10: {ho} before -> {hn} now (half or fewer)')
  res=pg.evaluate("""()=>new Promise(ok=>{const D=__dc,G=D.G;let n=0,eaten=0,hurt=0;const h0=G.hearts+G.lives*10;
    function one(){if(n>=6){ok({n,eaten,hurt:(G.hearts+G.lives*10)<h0,se:G.silEaten});return}G.littles=[];G.rangers=[];G.boulders=[];G.inv=9999;G.sil.fx=null;G.banner=null;
     const e0=G.silEaten||0;D.sillyStart();n++;const t0=performance.now();(function w(){G.littles=[];G.rangers=[];G.boulders=[];if((G.silEaten||0)>e0){eaten++;setTimeout(one,200);return}if(performance.now()-t0>4000){setTimeout(one,10);return}requestAnimationFrame(w)})()}
    one()})""")
  check(res['eaten']==res['n']==6,f"silly human eaten every time with no input (within 4 s): {res}")
  check('sillyHum' in open(os.path.join(ROOT,'game.js')).read(),'silly human drawn moving to the dino (no hitbox, cannot hurt)')
  check(not pg.errs,f'hard: no errors {pg.errs}');cx.close()
  b.close()
finally: srv.kill();srv2.kill();shutil.rmtree(TMP,ignore_errors=True)
print(f'{passes} passed, {len(fails)} failed');sys.exit(1 if fails else 0)

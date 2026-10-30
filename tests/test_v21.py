# Dino Colossus v21: cinematic intro on every app open (launch, reload, pageshow restore), tap to skip, ends at title. Run: python3 tests/test_v21.py
import subprocess,time,sys,os,re,json
from playwright.sync_api import sync_playwright
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));PORT=8866
srv=subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
URL=f'http://localhost:{PORT}/';fails=[];passes=0;perf={}
CREDIT='Designed and created by SlimeTrail Productions'
def check(c,m):
    global passes
    print(('PASS ' if c else 'FAIL ')+m)
    if c: passes+=1
    else: fails.append(m)
sw=open(os.path.join(ROOT,'sw.js')).read();VER=re.search(r'VER="(\d+)"',sw).group(1)
html=open(os.path.join(ROOT,'index.html')).read();intro=open(os.path.join(ROOT,'intro.js')).read()
check(VER=='21','sw VER is 21');check('"intro.js?v=21"' in sw,'intro.js in SW SHELL')
check('<script src="intro.js?v=21"></script>' in html and '?v=20' not in html,'index.html loads intro.js?v=21, no ?v=20 left')
check('>v21 · '+CREDIT in html,'title line v21 + credit')
code=' '.join(open(os.path.join(ROOT,f)).read().lower() for f in ['index.html','game.js','vis.js','sprites.js','sw.js','intro.js'])
for w in ['adsense','admob','doubleclick','applovin','unityads','gtag','analytics','fbq','utm_','affiliate']: check(w not in code,f'ad scan: no {w}')
check(not re.search(r'\.(ogg|mp3|wav|png|jpg|webp)',intro),'intro.js loads no new media files')
def pg_(cx):
    pg=cx.new_page();pg.errs=[];pg.ext=[]
    pg.on('pageerror',lambda e:pg.errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and pg.errs.append(m.text))
    pg.on('request',lambda r:(not r.url.startswith(URL)) and not r.url.startswith('data:') and pg.ext.append(r.url));return pg
def playing(pg): return pg.evaluate('typeof INTRO!=="undefined"&&INTRO.playing')
def at_title(pg): return pg.evaluate("!INTRO.playing&&!document.getElementById('start').classList.contains('hide')&&getComputedStyle(document.getElementById('intro')).display==='none'&&!(window.G&&G.running)")
try:
 with sync_playwright() as p:
  b=p.chromium.launch()
  cx=b.new_context(viewport={'width':844,'height':390},device_scale_factor=3,has_touch=True,is_mobile=True);pg=pg_(cx)
  for n in (1,2,3):
    pg.goto(URL);pg.wait_for_timeout(400)
    check(playing(pg) and pg.evaluate('INTRO.runs')==1,f'launch {n}: intro plays on open')
    vis=pg.evaluate("(()=>{const c=document.getElementById('intro'),r=c.getBoundingClientRect();return r.width>=innerWidth&&r.height>=innerHeight&&+getComputedStyle(c).zIndex>=50})()");check(vis,f'launch {n}: intro covers the screen')
    if n<3:
      pg.touchscreen.tap(420,200);pg.wait_for_timeout(600)
      check(at_title(pg) and pg.evaluate('INTRO.lastEnd')=='skip',f'launch {n}: tap skips to the title (game not started)')
  # launch 3: let it play to the end
  t0=time.time();pg.wait_for_function('!INTRO.playing',timeout=25000);dur=time.time()-t0+.4;pg.wait_for_timeout(200)
  check(at_title(pg) and pg.evaluate('INTRO.lastEnd')=='end' and 12<=dur<=17,f'launch 3: plays through (~{dur:.1f} s) and ends at title')
  check(CREDIT in pg.inner_text('#ver') and pg.is_visible('#ver') and 'v21' in pg.inner_text('#ver'),'title line still present after intro')
  pg.reload();pg.wait_for_timeout(300);check(playing(pg),'intro plays after reload')
  pg.keyboard.press('Space');pg.wait_for_timeout(600);check(at_title(pg),'key press skips')
  pg.evaluate("dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))");pg.wait_for_timeout(200)
  check(playing(pg) and pg.evaluate('INTRO.runs')==2,'intro plays again on pageshow (restored from background)')
  pg.mouse.click(400,200);pg.wait_for_timeout(600);check(at_title(pg),'mouse click skips')
  pg.click('#go');pg.wait_for_timeout(800);check(pg.evaluate('G.running'),'game starts normally after intro')
  pg.evaluate("dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))");pg.wait_for_timeout(200)
  check(not playing(pg),'pageshow during a running game does not interrupt the run')
  pg.evaluate("dispatchEvent(new PageTransitionEvent('pageshow',{persisted:false}))");pg.wait_for_timeout(200);check(not playing(pg),'normal pageshow does not double-start')
  check(not pg.errs,f'no page errors {pg.errs}');check(not pg.ext,f'no network outside the app {pg.ext}');cx.close()
  # calm: shorter, no shake
  cx=b.new_context(viewport={'width':844,'height':390},has_touch=True);pg=pg_(cx);pg.goto(URL+'?intro=0');pg.evaluate("localStorage.dinoColossus_Calm='1'");pg.goto(URL);pg.wait_for_timeout(200)
  t0=time.time();check(pg.evaluate('INTRO.calm'),'calm mode detected');pg.wait_for_function('!INTRO.playing',timeout=20000);d=time.time()-t0
  check(d<11,f'calm intro is shorter ({d:.1f} s)');check('if(!calm){' in intro,'no screen shake in calm');check(not pg.errs,'calm: no errors');cx.close()
  # reduced motion also counts as calm
  cx=b.new_context(viewport={'width':844,'height':390},reduced_motion='reduce');pg=pg_(cx);pg.goto(URL);pg.wait_for_timeout(200);check(pg.evaluate('INTRO.calm'),'prefers-reduced-motion -> calm intro');cx.close()
  # mute respected: VIS.play is the only sound path, and it checks snd
  check("VIS.play(k)" in intro and not re.search(r'new Audio|AudioContext|createOscillator',intro),'intro sound only through VIS.play (respects mute + effects slider)')
  # performance: 4x CPU throttle (mid phone), 844x390 @2x
  cx=b.new_context(viewport={'width':844,'height':390},device_scale_factor=2,has_touch=True,is_mobile=True);pg=pg_(cx)
  cdp=cx.new_cdp_session(pg);cdp.send('Emulation.setCPUThrottlingRate',{'rate':4});pg.goto(URL);pg.wait_for_function('INTRO.T>7.5',timeout=30000);mid=pg.evaluate('INTRO.counts')
  pg.wait_for_function('!INTRO.playing',timeout=30000);st=pg.evaluate('INTRO.stats()');perf=st
  print('PERF 4x throttle',json.dumps(st),'particles',mid)
  check(st and st['avg']<28 and st['p95']<=34 and st['drawAvg']<4,f"frame time 4x throttle avg {st['avg']:.1f} ms p95 {st['p95']:.1f} ms, script per frame {st['drawAvg']:.2f} ms")
  check(mid['smoke']<=36 and mid['lava']<=26 and mid['ash']<=50,f'particle caps {mid}');cx.close()
  cx=b.new_context(viewport={'width':844,'height':390},device_scale_factor=3,has_touch=True,is_mobile=True);pg=pg_(cx);pg.goto(URL);pg.wait_for_function('!INTRO.playing',timeout=30000);st=pg.evaluate('INTRO.stats()');print('PERF no throttle',json.dumps(st))
  check(st['avg']<17.5 and st['p95']<18,f"unthrottled 60 fps avg {st['avg']:.1f} ms p95 {st['p95']:.1f} ms");cx.close()
  # offline (installed PWA): intro.js cached by SW, intro still plays offline
  cx=b.new_context(viewport={'width':915,'height':412});pg=pg_(cx);pg.goto(URL);pg.wait_for_function("navigator.serviceWorker.ready.then(()=>1)");pg.wait_for_timeout(2500)
  ok=pg.evaluate("caches.open('dinocol-v21').then(c=>c.match('intro.js?v=21')).then(r=>!!r)");check(ok,'intro.js in SW cache v21')
  cx.set_offline(True);pg.reload();pg.wait_for_timeout(600);check(playing(pg),'intro plays offline');check(not pg.errs,f'offline: no errors {pg.errs}');cx.close();b.close()
finally: srv.kill()
print(f'{passes} passed, {len(fails)} failed');sys.exit(1 if fails else 0)

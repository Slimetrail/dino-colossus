# Dino Colossus v13 sound tests (Playwright, headless Chromium). Run: python3 tests/test_v13.py
import subprocess,time,sys,os
from playwright.sync_api import sync_playwright
import re as _re;_VER=_re.search(r'VER="(\d+)"',open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),'sw.js')).read()).group(1)
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));PORT=8843
srv=subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
URL=f'http://localhost:{PORT}/?intro=0';fails=[];passes=0
FILES=['stomp','land','roar','chime','cheer','sparkle']
def check(c,m):
    global passes
    print(('PASS ' if c else 'FAIL ')+m)
    if c: passes+=1
    else: fails.append(m)
def pg_(cx):
    pg=cx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and errs.append(m.text));pg.errs=errs;return pg
for f in FILES: check(os.path.getsize(os.path.join(ROOT,'sounds',f+'.mp3'))<20000,f'{f}.mp3 small')
try:
 with sync_playwright() as p:
  b=p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
  # 1 no sound before a tap
  cx=b.new_context(viewport={'width':915,'height':412},has_touch=True);pg=pg_(cx)
  pg.add_init_script("window.__starts=0;const _o=AudioBufferSourceNode.prototype.start;AudioBufferSourceNode.prototype.start=function(){window.__starts++;return _o.apply(this,arguments)};const _s=OscillatorNode.prototype.start;OscillatorNode.prototype.start=function(){if(!(this.context instanceof OfflineAudioContext))window.__starts++;return _s.apply(this,arguments)}")
  pg.goto(URL);pg.wait_for_timeout(1500);pg.evaluate("VIS.play('stomp');VIS.play('roar')")
  check(pg.evaluate('__starts')==0 and not pg.evaluate('VIS.tapped'),'no sound before a tap')
  pg.click('#go');pg.wait_for_timeout(1500)
  src=pg.evaluate('({...VIS.SRC})');check(all(src.get(f)=='file' for f in FILES),f'all 6 files decoded after tap {src}')
  check(pg.evaluate("VIS.SRC.bigroar")=='synth','boss roar stays generated')
  n=pg.evaluate('__starts');pg.evaluate("VIS.play('chime')");check(pg.evaluate('__starts')>n,'file sound plays after tap')
  pg.click('#snd');n=pg.evaluate('__starts');pg.evaluate("VIS.play('chime');VIS.play('stomp')");check(pg.evaluate('__starts')==n,'mute silences file sounds');pg.click('#snd')
  check(not pg.errs,f'no console errors {pg.errs}');cx.close()
  # 2 files load offline from SW cache
  cx=b.new_context(viewport={'width':915,'height':412},has_touch=True);pg=pg_(cx);pg.goto(URL);pg.wait_for_function("navigator.serviceWorker.ready.then(()=>1)");pg.wait_for_timeout(2000)
  cached=pg.evaluate(("caches.open('dinocol-v"+_VER+"').then(c=>Promise.all(%s.map(f=>c.match('sounds/'+f+'.mp3').then(r=>!!r))))")%FILES)
  check(all(cached),f'sounds in SW cache v13 {cached}')
  cx.set_offline(True);pg.reload();pg.wait_for_timeout(800);pg.click('#go');pg.wait_for_timeout(1500)
  src=pg.evaluate('({...VIS.SRC})');check(all(src.get(f)=='file' for f in FILES),f'files load offline {src}');cx.close()
  # 3 fallback when files fail
  cx=b.new_context(viewport={'width':915,'height':412},has_touch=True);cx.route('**/sounds/**',lambda r:r.fulfill(status=404,body='x'));pg=pg_(cx)
  pg.goto(URL);pg.wait_for_timeout(800);pg.click('#go');pg.wait_for_timeout(1500)
  src=pg.evaluate('({...VIS.SRC})');check(all(src.get(f)=='synth' for f in FILES),f'fallback to generated on 404 {src}')
  cx.close()
  cx=b.new_context(viewport={'width':915,'height':412},has_touch=True);cx.route('**/sounds/**',lambda r:r.fulfill(status=200,body=b'not audio',content_type='audio/mpeg'));pg=pg_(cx)
  pg.goto(URL);pg.wait_for_timeout(800);pg.click('#go');pg.wait_for_timeout(1500)
  src=pg.evaluate('({...VIS.SRC})');check(all(src.get(f)=='synth' for f in FILES),f'fallback to generated on bad file {src}')
  n=pg.evaluate("1");pg.evaluate("VIS.play('stomp')");check(True,'play with fallback does not throw');cx.close()
  # 4 calm still toggles
  cx=b.new_context(viewport={'width':915,'height':412});pg=pg_(cx);pg.goto(URL);pg.wait_for_timeout(500);pg.click('#calmb');check(pg.evaluate('VIS.calm'),'Calm toggles on');pg.click('#calmb');check(not pg.evaluate('VIS.calm'),'Calm toggles off');cx.close()
  b.close()
finally: srv.kill()
print(f'{passes} passed, {len(fails)} failed');sys.exit(1 if fails else 0)

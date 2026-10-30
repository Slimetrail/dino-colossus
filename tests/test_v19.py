# Dino Colossus v19 music tests: original CC0 music (intro once, main + boss loops, boss-beaten fanfare once), Beethoven mp3s removed, credit line (Playwright). Run: python3 tests/test_v19.py
import subprocess,time,sys,os,re
from playwright.sync_api import sync_playwright
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));PORT=8864
srv=subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
URL=os.environ.get('DINO_URL',f'http://localhost:{PORT}/');fails=[];passes=0;SHOTS=os.environ.get('DINO_SHOTS','/workspace/dino-music-shots');os.makedirs(SHOTS,exist_ok=True)
def check(c,m):
    global passes
    print(('PASS ' if c else 'FAIL ')+m)
    if c: passes+=1
    else: fails.append(m)
NEW=['dino-main-loop.ogg','dino-boss-loop.ogg','intro-elise-dino-variation.ogg','boss-beaten-fanfare.ogg'];OLD=['music-pastoral.mp3','music-minuet.mp3']
CREDIT='Designed and created by SlimeTrail Productions'
sw=open(os.path.join(ROOT,'sw.js')).read();VER=re.search(r'VER="(\d+)"',sw).group(1)
check(VER=='19','sw VER is 19')
for f in NEW: check(os.path.isfile(os.path.join(ROOT,'sounds',f)) and f'"sounds/{f}"' in sw,f'{f} exists and is in SW SHELL')
for f in ['OWN-WORK-CC0.txt','VSCO-2-CE-upright-CC0-1.0.txt']: check(os.path.isfile(os.path.join(ROOT,'licences',f)),f'licences/{f} present')
code={n:open(os.path.join(ROOT,n)).read() for n in ['vis.js','game.js','sprites.js','sw.js','index.html']}
for f in OLD: check(not os.path.exists(os.path.join(ROOT,'sounds',f)) and not any(f in c for c in code.values()),f'{f} gone and not referenced')
check(not any(w in c for c in code.values() for w in ['Beethoven','Musopen']),'no Beethoven/Musopen text in code')
check(CREDIT in code['index.html'] and CREDIT in open(os.path.join(ROOT,'CREDITS.md')).read(),'credit line in index.html and CREDITS.md')
check('?v=18' not in code['index.html'] and '?v=19' in code['index.html'],'index.html ?v= bumped to 19')
def pg_(cx):
    pg=cx.new_page();pg.errs=[];pg.bad=[];pg.req=[]
    pg.on('pageerror',lambda e:pg.errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and pg.errs.append(m.text))
    pg.on('response',lambda r:(pg.req.append(r.url),r.status>=400 and pg.bad.append(f'{r.status} {r.url}')));return pg
try:
 with sync_playwright() as p:
  b=p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
  cx=b.new_context(viewport={'width':844,'height':390},device_scale_factor=3,has_touch=True,is_mobile=True);pg=pg_(cx)
  pg.goto(URL);pg.wait_for_timeout(800)
  ver=pg.inner_text('#ver');check(CREDIT in ver and pg.is_visible('#ver'),f'credit line visible on title: {ver!r}')
  pg.screenshot(path=SHOTS+'/title-credit-844x390.png')
  check(pg.evaluate('VIS.oKey') is None,'no intro before a tap')
  pg.mouse.click(5,200);pg.wait_for_timeout(2500)
  check(pg.evaluate('VIS.oKey')=='intro' and pg.evaluate('VIS.oLoop')==False,'intro plays after first tap on title, not looping')
  d=pg.evaluate('VIS.BUF.intro&&VIS.BUF.intro.duration');check(d and 39<d<41.5,f'intro ~40 s ({d})')
  pg.evaluate("document.getElementById('snd').click()");pg.wait_for_timeout(300);check(pg.evaluate('VIS.oKey') is None,'mute stops intro')
  pg.evaluate("document.getElementById('snd').click()");pg.wait_for_timeout(500);check(pg.evaluate('VIS.oKey') is None,'intro does not restart after unmute (plays once)')
  pg.click('#go');pg.wait_for_timeout(2500)
  src=pg.evaluate('({...VIS.SRC})');check(src.get('music')=='file' and src.get('bossmusic')=='file',f'main + boss music load from files {src}')
  check(pg.evaluate('VIS.mKey')=='music' and pg.evaluate('VIS.oKey') is None,'main loop plays in game, intro stopped')
  urls=' '.join(pg.req);check('sounds/dino-main-loop.ogg' in urls and 'sounds/dino-boss-loop.ogg' in urls,'music fetched from new urls')
  lp=pg.evaluate("({m:VIS.LOOP.music,b:VIS.LOOP.bossmusic,dm:VIS.BUF.music.duration,db:VIS.BUF.bossmusic.duration})")
  check(lp['m'][0]<.01 and lp['dm']-lp['m'][1]<.01 and lp['b'][0]<.01 and lp['db']-lp['b'][1]<.01,f'whole file loops (no trim) {lp}')
  pg.screenshot(path=SHOTS+'/playing-844x390.png')
  pg.evaluate('__dc.startBoss()');pg.wait_for_timeout(800);check(pg.evaluate('VIS.mKey')=='bossmusic','boss loop during boss')
  pg.evaluate("()=>{const b=__dc.G.boss;b.hp=0;b.gone=1}");
  pg.wait_for_function("VIS.oKey==='fanfare'",timeout=5000)
  check(pg.evaluate('VIS.oKey')=='fanfare' and pg.evaluate('VIS.oLoop')==False,'fanfare plays once boss beaten, not looping')
  pg.wait_for_timeout(400);check(pg.evaluate('VIS.mKey') is None,'boss music stopped while fanfare plays')
  pg.wait_for_timeout(6000);check(pg.evaluate('VIS.oKey') is None and pg.evaluate('VIS.mKey')=='music','fanfare ends once, main music resumes')
  v=pg.evaluate('VIS.vol()');pg.evaluate('VIS.setVol(0.25,null)');check(abs(pg.evaluate('VIS.vol().musicBus')-.125)<1e-6,'music slider drives music bus');pg.evaluate(f"VIS.setVol({v['music']},null)")
  pg.click('#snd');pg.wait_for_timeout(400);check(pg.evaluate('VIS.mKey') is None and pg.evaluate('VIS.oKey') is None,'mute silences music')
  check(not pg.bad,f'no 404s {pg.bad}');check(not pg.errs,f'no console errors {pg.errs}');cx.close();b.close()
finally: srv.kill()
print(f'{passes} passed, {len(fails)} failed');sys.exit(1 if fails else 0)

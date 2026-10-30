# Dino Colossus v14 Beethoven music tests (Playwright, headless Chromium). Run: python3 tests/test_v14.py
import subprocess,time,sys,os
from playwright.sync_api import sync_playwright
import re as _re;_VER=_re.search(r'VER="(\d+)"',open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),'sw.js')).read()).group(1)
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));PORT=8844
srv=subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
URL=f'http://localhost:{PORT}/?intro=0';fails=[];passes=0;SHOTS='/workspace/dino-shots/v14'
MUS=['dino-main-loop','dino-boss-loop']  # v19: Beethoven mp3s replaced by original CC0 ogg loops
def check(c,m):
    global passes
    print(('PASS ' if c else 'FAIL ')+m)
    if c: passes+=1
    else: fails.append(m)
def pg_(cx):
    pg=cx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and errs.append(m.text));pg.errs=errs;return pg
def ctx(b,**k): return b.new_context(viewport={'width':915,'height':412},has_touch=True,**k)
import hashlib
for f,m in [('dino-main-loop','a495346391b141e736364289765a12eb'),('dino-boss-loop','0a4464f5f9dcc6493ad98f2550a4b6ce')]: check(hashlib.md5(open(os.path.join(ROOT,'sounds',f+'.ogg'),'rb').read()).hexdigest()==m,f'{f}.ogg is the v20 whole-file loop')
for f in MUS: check(os.path.getsize(os.path.join(ROOT,'sounds',f+'.ogg'))<4000000,f'{f}.ogg under 4 MB')
SEAM="""(async()=>{const r={};for(const k of ['music','bossmusic']){const b=VIS.BUF[k],[ls,le]=VIS.LOOP[k],sr=b.sampleRate;
 const o=new OfflineAudioContext(1,Math.ceil(sr*6),sr),s=o.createBufferSource();s.buffer=b;s.loop=true;s.loopStart=ls;s.loopEnd=le;s.connect(o.destination);s.start(0,le-3);
 const d=(await o.startRendering()).getChannelData(0);let minR=1,maxJ=0;const w=Math.floor(sr*.05);
 for(let i=0;i+w<d.length;i+=w){let e=0;for(let j=i;j<i+w;j++)e+=d[j]*d[j];minR=Math.min(minR,Math.sqrt(e/w))}
 const c=Math.floor(sr*3);for(let j=c-200;j<c+200;j++)maxJ=Math.max(maxJ,Math.abs(d[j+1]-d[j]));
 let p=0;for(let j=0;j<d.length;j++)p=Math.max(p,Math.abs(d[j]));r[k]={minRms:minR,seamJump:maxJ,peak:p,len:b.duration}}return r})()"""
try:
 with sync_playwright() as p:
  b=p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
  cx=ctx(b);pg=pg_(cx)
  pg.add_init_script("window.__starts=0;const _o=AudioBufferSourceNode.prototype.start;AudioBufferSourceNode.prototype.start=function(){if(!(this.context instanceof OfflineAudioContext))window.__starts++;return _o.apply(this,arguments)};const _s=OscillatorNode.prototype.start;OscillatorNode.prototype.start=function(){if(!(this.context instanceof OfflineAudioContext))window.__starts++;return _s.apply(this,arguments)}")
  pg.goto(URL);pg.wait_for_timeout(1500)
  ver=pg.inner_text('#ver');check('Designed and created by SlimeTrail Productions' in ver and pg.is_visible('#ver'),f'credits line visible on menu: {ver!r}')
  pg.screenshot(path=SHOTS+'/menu-credits.png')
  check(pg.evaluate('__starts')==0 and not pg.evaluate('VIS.tapped'),'no sound before a tap')
  pg.click('#go');pg.wait_for_timeout(3000)
  src=pg.evaluate('({...VIS.SRC})');check(src.get('music')=='file' and src.get('bossmusic')=='file',f'both music files load after tap {src.get("music")},{src.get("bossmusic")}')
  check(pg.evaluate('VIS.mKey')=='music','main play music = Beethoven Pastoral mvt 3')
  pg.screenshot(path=SHOTS+'/playing.png')
  r=pg.evaluate(SEAM);print('SEAM',r)
  for k,v in r.items(): check(v['minRms']>0.0008 and v['seamJump']<0.08 and v['peak']<0.9,f'{k} loop restarts without silence or click (minRms {v["minRms"]:.4f}, jump {v["seamJump"]:.4f}, peak {v["peak"]:.3f})')
  pg.evaluate('__dc.startBoss()');pg.wait_for_timeout(600)
  check(pg.evaluate('VIS.mKey')=='bossmusic','boss music = Minuet in G during boss')
  pg.screenshot(path=SHOTS+'/boss.png')
  pg.click('#snd');pg.wait_for_timeout(400);check(pg.evaluate('VIS.mKey') is None,'mute silences the music')
  pg.click('#snd');pg.wait_for_timeout(400);check(pg.evaluate('VIS.mKey') is not None,'unmute brings music back')
  check(not pg.errs,f'no console errors {pg.errs}');cx.close()
  # calm
  cx=ctx(b);pg=pg_(cx);pg.goto(URL);pg.wait_for_timeout(500);pg.click('#calmb');check(pg.evaluate('VIS.calm'),'Calm toggles on')
  pg.click('#go');pg.wait_for_timeout(2500);check(pg.evaluate('VIS.mKey')=='music','music still plays with Calm on (as before)')
  pg.evaluate('VIS.setCalm(false)');check(not pg.evaluate('VIS.calm'),'Calm toggles off');cx.close()
  # offline
  cx=ctx(b);pg=pg_(cx);pg.goto(URL);pg.wait_for_function("navigator.serviceWorker.ready.then(()=>1)");pg.wait_for_timeout(4000)
  cached=pg.evaluate(("caches.open('dinocol-v"+_VER+"').then(c=>Promise.all(%s.map(f=>c.match('sounds/'+f+'.ogg').then(r=>!!r))))")%MUS)
  check(all(cached),f'music in SW cache v15 {cached}')
  cx.set_offline(True);pg.reload();pg.wait_for_timeout(800);pg.click('#go');pg.wait_for_timeout(3000)
  src=pg.evaluate('({...VIS.SRC})');check(src.get('music')=='file' and src.get('bossmusic')=='file',f'music loads offline');cx.close()
  # fallback
  for name,h in [('missing',lambda r:r.fulfill(status=404,body='x')),('broken',lambda r:r.fulfill(status=200,body=b'not audio',content_type='audio/mpeg'))]:
   cx=ctx(b);cx.route('**/sounds/dino-*-loop.ogg',h);pg=pg_(cx)
   pg.add_init_script("window.__osc=0;const _s=OscillatorNode.prototype.start;OscillatorNode.prototype.start=function(){if(!(this.context instanceof OfflineAudioContext))window.__osc++;return _s.apply(this,arguments)}")
   pg.goto(URL);pg.wait_for_timeout(800);pg.click('#go');pg.wait_for_timeout(2500)
   n=pg.evaluate('__osc');pg.wait_for_timeout(1000)
   check(pg.evaluate('VIS.SRC.music')=='synth' and pg.evaluate('VIS.mKey') is None and pg.evaluate('__osc')>n,f'generated music takes over when file is {name}')
   check(not [e for e in pg.errs if 'music' not in e and '404' not in e],f'no errors with {name} file {pg.errs}');cx.close()
  b.close()
finally: srv.kill()
print(f'{passes} passed, {len(fails)} failed');sys.exit(1 if fails else 0)

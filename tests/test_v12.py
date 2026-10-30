# Dino Colossus v12 tests (Playwright, headless Chromium). Run: python3 tests/test_v12.py
import subprocess,time,sys,os,json,statistics
from playwright.sync_api import sync_playwright
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));PORT=8842
srv=subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
URL=f'http://localhost:{PORT}/?intro=0';fails=[];passes=0;perf={}
def check(c,m):
    global passes
    print(('PASS ' if c else 'FAIL ')+m)
    if c: passes+=1
    else: fails.append(m)
V11={'dinoColossus_Diff':'hard','dinoColossus_Snd':'1','dinoColossus_Dino':'2','dinoColossus_Diamonds':'7','dinoColossus_Unlocks':'{"flame":1,"speed":1}',
 'dinoColossus_Stats':'{"eaten":40,"erupts":2}','dinoColossus_Top10_hard':json.dumps([{'i':'LEO','s':4321,'sec':3,'v':12,'t':1},{'i':'DAD','s':1200,'sec':2,'v':3,'t':2}]),
 'dinoColossus_Best_hard':'4321','dinoColossus_Run':json.dumps({'diff':'hard','pick':2,'score':900,'lives':2,'hearts':3,'bossN':2,'thrown':5,'eaten':9,'t':1})}
def page(b,w=915,h=412,dpr=1):
    pg=b.new_page(viewport={'width':w,'height':h},has_touch=True,device_scale_factor=dpr);errs=[]
    pg.on('console',lambda m:m.type=='error' and errs.append(m.text));pg.on('pageerror',lambda e:errs.append(str(e)));pg.errs=errs;return pg
def frames(pg,ms):
    return pg.evaluate('''ms=>new Promise(res=>{const dts=[],dr=[];const od=window.draw;window.draw=function(){const t=performance.now();od();dr.push(performance.now()-t)};let l=performance.now(),s=l;
      function f(t){dts.push(t-l);l=t;if(t-s<ms)requestAnimationFrame(f);else{window.draw=od;res({dts,dr})}}requestAnimationFrame(f)})''',ms)
def stats(a):
    a=sorted(a);return {'n':len(a),'avg':round(sum(a)/len(a),2),'p95':round(a[int(len(a)*.95)-1],2),'max':round(a[-1],2)}
try:
 with sync_playwright() as p:
  b=p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
  # ---- old v11 save still loads ----
  pg=page(b);pg.goto(URL);pg.evaluate('d=>{localStorage.clear();for(const k in d)localStorage[k]=d[k]}',V11);pg.reload();pg.wait_for_timeout(300)
  check(pg.evaluate("document.getElementById('best').textContent")=='4321','v11 Top10/best shows 4321 on HARD')
  check(pg.evaluate("__dc.diff")=='hard' and pg.evaluate('__dc.pick')==2,'v11 difficulty + dino pick kept')
  check(pg.evaluate("!document.getElementById('cont').classList.contains('hide')"),'v11 saved run shows CONTINUE')
  check(pg.evaluate("__dc.unl.flame===1&&__dc.unl.speed===1"),'v11 power unlocks kept')
  check(pg.evaluate("__dc.loadTop('hard').length")==2,'v11 Top10 entries intact')
  check(pg.evaluate("VIS.stars")==0 and pg.evaluate("VIS.on.c")=='orig','new dress keys default safely')
  pg.click('#cont');pg.wait_for_timeout(300)
  check(pg.evaluate("__dc.G.running&&__dc.G.bossN==2&&__dc.G.score==900"),'CONTINUE resumes v11 run (boss 2, score 900)')
  check(pg.evaluate("Object.keys(localStorage).filter(k=>k.startsWith('dinoColossus_')).every(k=>['Diff','Snd','Dino','Diamonds','Unlocks','Stats','Top10_hard','Top10_medium','Top10_easy','Best_hard','Best_medium','Best_easy','Ini','Run','DressStars','DressOwned','DressOn','Calm'].includes(k.slice(13)))"),'only known localStorage keys')
  check(not pg.errs,'no console errors (v11 save) '+str(pg.errs));pg.close()
  # ---- play a run: taps, jumps, level-up, boss, power-up ----
  pg=page(b);pg.goto(URL);pg.evaluate('localStorage.clear()');pg.reload();pg.wait_for_timeout(300)
  check(pg.evaluate("typeof AC==='undefined'||!AC"),'no AudioContext before first tap')
  check(pg.evaluate("VIS.SOUNDS.stomp&&VIS.SOUNDS.roar&&VIS.SOUNDS.chime&&VIS.SOUNDS.cheer&&VIS.SOUNDS.music.loop===true"),'sound table has stomp/roar/chime/cheer/music')
  pg.tap('#go');pg.wait_for_timeout(500)
  check(pg.evaluate("__dc.G.running"),'run started by tap')
  check(pg.evaluate("VIS.tapped&&AC&&AC.state==='running'"),'audio unlocked by tap, context running')
  pg.wait_for_timeout(600);check(len(pg.evaluate("Object.keys(VIS.BUF)"))>=5,'synth sounds pre-rendered to buffers')
  x0=pg.evaluate('__dc.G.d.x')
  box=pg.locator('#br').bounding_box()
  pg.dispatch_event('#br','pointerdown',{'pointerType':'touch','width':20,'height':20});pg.wait_for_timeout(1200)
  for i in range(5): pg.dispatch_event('#bj','pointerdown',{'pointerType':'touch'});pg.wait_for_timeout(150);pg.dispatch_event('#bj','pointerup');pg.wait_for_timeout(400)
  pg.dispatch_event('#br','pointerup');x1=pg.evaluate('__dc.G.d.x')
  check(x1>x0+100,f'dino ran right via touch button ({x0:.0f}->{x1:.0f})')
  pg.dispatch_event('#br','pointerdown',{'pointerType':'touch','width':200,'height':200});pg.wait_for_timeout(300);x2=pg.evaluate('__dc.G.d.x');pg.dispatch_event('#br','pointerup')
  check(x2-x1<2,'huge palm touch ignored (no move right; pit respawn may move back)')
  check(pg.evaluate("VIS.st.sparks.length+VIS.st.rings.length+__dc.G.smoke.length")>=0,'effects arrays alive')
  # power-up burst
  pg.evaluate("const G=__dc.G;G.inv=99999;G.pel.push({x:G.d.x+G.d.w/2,y:G.d.y+G.d.h/2})");pg.wait_for_timeout(100)
  check(pg.evaluate("__dc.G.dash>0&&VIS.st.rings.length>0"),'pellet grab -> dash + star burst ring')
  s0=pg.evaluate('__dc.G.score');pg.evaluate("const G=__dc.G;G.gemsW.push({x:G.d.x+G.d.w/2,y:G.d.y+G.d.h/2})");pg.wait_for_timeout(100)
  check(pg.evaluate('__dc.G.score')==s0+100,'gem still +100 (scores unchanged)')
  check(pg.evaluate("VIS.st.sparks.some(s=>s.hud)"),'score sparkles at HUD')
  # level up via real section entry
  pg.evaluate("const G=__dc.G;G.d.x=G.secs[1].x0+30;G.d.y=150;G.camX=G.d.x-200");pg.wait_for_timeout(400)
  check(pg.evaluate("__dc.G.cur")==2 and pg.evaluate("VIS.st.cheer&&VIS.st.cheer.txt")=='LEVEL 2!','level-up cheer banner')
  # day/sunset/night
  for ph in (.1,.45,.7): pg.evaluate(f'__dc.G.dayT={ph}*180');pg.wait_for_timeout(80)
  check(not pg.errs,'no errors through day/sunset/night')
  # boss fight
  pg.evaluate('__dc.startBoss()');pg.wait_for_timeout(150)
  check(pg.evaluate("VIS.st.rings.length>=1&&VIS.st.roarTxt>0"),'boss entrance roar ring + ROAR text')
  hp=pg.evaluate('__dc.G.boss.max');check(hp==pg.evaluate('__dc.bossHP(1)'),'boss HP unchanged by v12')
  pg.wait_for_timeout(2000);pg.evaluate("const b=__dc.G.boss;b.hp=1;b.inv=0;b.vuln=1");pg.evaluate("const G=__dc.G,b=G.boss;G.d.x=b.x+b.w/2-G.d.w/2;G.d.y=b.y-G.d.h-4;G.d.vy=4;G.hit=0");pg.wait_for_timeout(200)
  pg.evaluate("const b=__dc.G.boss;if(b&&!b.gone){b.hp=1;b.inv=0;b.bonked=0}");pg.evaluate("const G=__dc.G,b=G.boss;if(b&&!b.gone){b.hp=0;b.gone=1}");pg.wait_for_timeout(200)
  check(pg.evaluate("VIS.st.bossGone"),'boss beaten -> cheer fired')
  pg.wait_for_timeout(3500)
  # frame timing during play (headless, not phone numbers)
  pg.dispatch_event('#br','pointerdown',{'pointerType':'touch'})
  r=frames(pg,4000);pg.dispatch_event('#br','pointerup');perf['915x412 dpr1']={'frame':stats(r['dts']),'draw':stats(r['dr'])}
  check(stats(r['dr'])['p95']<12,f"draw p95 < 12ms headless: {stats(r['dr'])}")
  # end run -> stars awarded
  st0=pg.evaluate('VIS.stars');pg.evaluate('__dc.G.score=3200;__dc.showEnd&&0');pg.evaluate("(()=>{const G=__dc.G;G.lives=1;__dc.loseLife()})()");pg.wait_for_timeout(1500);pg.click('#contNo');pg.wait_for_timeout(600)  # v16: Continue? screen first, No -> game over
  st1=pg.evaluate('VIS.stars');check(st1>st0 and st1-st0<=8,f'stars awarded at end ({st0}->{st1})')
  check(pg.evaluate("!document.getElementById('dstars').classList.contains('hide')"),'end screen shows stars line')
  check(not pg.errs,'no console errors in full run '+str(pg.errs[:3]));pg.close()
  # ---- dress-up unlock, equip, persistence ----
  pg=page(b);pg.goto(URL);pg.evaluate("localStorage.clear();localStorage.dinoColossus_DressStars='5'");pg.reload();pg.wait_for_timeout(300)
  pg.tap('#dressb');check(pg.is_visible('#dress'),'dress-up opens from menu')
  sm=pg.evaluate("[...document.querySelectorAll('#dgrid button,#dtabs button,#dressx')].filter(b=>{const r=b.getBoundingClientRect();return r.width<44||r.height<44||r.bottom>innerHeight||r.right>innerWidth}).length")
  check(sm==0,'dress-up tap targets >=44px and on screen')
  pg.tap('#dgrid button[data-id=lime]');check(pg.evaluate('VIS.stars')==3 and pg.evaluate("VIS.on.c")=='lime','unlock lime for 2 stars and wear it')
  pg.tap('#dtabs button[data-t=h]');pg.tap('#dgrid button[data-id=crown]')
  check(pg.evaluate("VIS.on.h")=='none' and pg.evaluate('VIS.stars')==3,'crown (6) refused with 3 stars')
  pg.tap('#dgrid button[data-id=party]');check(pg.evaluate("VIS.on.h")=='party' and pg.evaluate('VIS.stars')==0,'party hat bought + worn')
  pg.tap('#dtabs button[data-t=c]');pg.tap('#dgrid button[data-id=orig]');pg.tap('#dgrid button[data-id=lime]')
  check(pg.evaluate("VIS.on.c")=='lime' and pg.evaluate('VIS.stars')==0,'owned colour re-equips free')
  pg.tap('#dressx');pg.reload();pg.wait_for_timeout(300)
  check(pg.evaluate("VIS.on.c=='lime'&&VIS.on.h=='party'&&VIS.owned().includes('lime')&&VIS.stars==0"),'dress-up persists after reload')
  pg.tap('#go');pg.wait_for_timeout(500);check(not pg.errs,'dressed run draws without errors')
  # ---- Calm + mute ----
  pg.tap('#menub');pg.tap('#quitYes');pg.wait_for_timeout(200)
  pg.tap('#calmb');check(pg.evaluate("VIS.calm&&localStorage.dinoColossus_Calm==='1'"),'Calm switch on + saved')
  pg.tap('#go');pg.wait_for_timeout(300);pg.evaluate('__dc.G.shake=20;__dc.G.flash=.35')
  check(pg.evaluate("VIS.shakeOff()[0]==0&&VIS.flashA(.35)<=.08&&VIS.st.leaves.length==0"),'Calm: no shake, dim flash, no leaves')
  pg.reload();pg.wait_for_timeout(200);check(pg.evaluate('VIS.calm'),'Calm persists after reload');pg.tap('#calmb');check(not pg.evaluate('VIS.calm'),'Calm off')
  pg.tap('#go');pg.wait_for_timeout(400);pg.tap('#snd');check(pg.evaluate("localStorage.dinoColossus_Snd")=='0','mute switch still works (same key)')
  pg.wait_for_timeout(300);check(pg.evaluate("!snd"),'muted state active in game');check(pg.evaluate("VIS.play('chime')===undefined"),'muted play is a no-op')
  check(not pg.errs,'no console errors (dress/calm/mute) '+str(pg.errs[:3]));pg.close()
  # ---- sizes + DPR 3.5 (S26 Ultra-ish) ----
  for (w,h,dpr) in [(740,360,1),(892,411,3.5)]:
    pg=page(b,w,h,dpr);pg.goto(URL);pg.wait_for_timeout(300)
    off=pg.evaluate("[...document.querySelectorAll('#start button')].filter(b=>b.offsetParent).filter(b=>{const r=b.getBoundingClientRect();return r.bottom>innerHeight+1||r.right>innerWidth+1||r.top<0}).map(b=>b.id)")
    check(not off,f'{w}x{h} menu buttons on screen {off}')
    pg.tap('#go');pg.wait_for_timeout(300)
    cb=pg.evaluate("['bl','br','bj'].map(i=>{const r=document.getElementById(i).getBoundingClientRect();return [r.width,r.left,innerWidth-r.right]})")
    check(all(c[0]>=48 and c[1]>=8 and c[2]>=8 for c in cb),f'{w}x{h} controls >=48px and away from edges {cb}')
    check(pg.evaluate("document.getElementById('c').width")<=w+1,f'{w}x{h} canvas backing store capped at CSS size (no DPR blow-up)')
    pg.dispatch_event('#br','pointerdown',{'pointerType':'touch'});r=frames(pg,3000);pg.dispatch_event('#br','pointerup')
    perf[f'{w}x{h} dpr{dpr}']={'frame':stats(r['dts']),'draw':stats(r['dr'])}
    check(not pg.errs,f'{w}x{h} no console errors');pg.close()
  # ---- offline PWA ----
  cx=b.new_context(viewport={'width':915,'height':412});pg=cx.new_page();pg.goto(URL);pg.wait_for_function("navigator.serviceWorker.controller||navigator.serviceWorker.ready.then(()=>1)");pg.wait_for_timeout(1500);pg.reload();pg.wait_for_timeout(800)
  keys=pg.evaluate("caches.keys()");import re as _re;_v=_re.search(r'VER="(\d+)"',open(os.path.join(ROOT,'sw.js')).read()).group(1);check('dinocol-v'+_v in keys,f'SW cache v{_v} {keys}')
  cx.set_offline(True);pg.reload();pg.wait_for_timeout(800)
  check(pg.evaluate("typeof VIS==='object'&&typeof __dc==='object'"),'works offline (vis.js + game.js from cache)');cx.close()
  b.close()
finally: srv.kill()
print('PERF',json.dumps(perf))
print(f'{passes} passed, {len(fails)} failed');sys.exit(1 if fails else 0)

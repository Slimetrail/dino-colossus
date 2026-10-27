# Dino Colossus v16 tests: 5 hearts / 5 lives, Continue? screen (20 s countdown, Yes/No), Top 10 entry once. Run: python3 tests/test_v16.py
import subprocess,time,sys,os,json
from playwright.sync_api import sync_playwright
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));PORT=8846
srv=subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
URL=os.environ.get('DINO_URL',f'http://localhost:{PORT}/');fails=[];passes=0;SHOTS='/workspace/dino-shots/v16';os.makedirs(SHOTS,exist_ok=True)
def check(c,m):
    global passes
    print(('PASS ' if c else 'FAIL ')+m)
    if c: passes+=1
    else: fails.append(m)
def pg_(cx):
    pg=cx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and errs.append(m.text));pg.errs=errs;return pg
def ctx(b,w=915,h=412,dpr=1): return b.new_context(viewport={'width':w,'height':h},device_scale_factor=dpr,has_touch=True)
def game(pg,d,clear=True):
    if clear: pg.evaluate("localStorage.clear()")
    pg.evaluate(f"localStorage.dinoColossus_Diff='{d}'");pg.reload();pg.wait_for_timeout(300);pg.click('#go');pg.wait_for_timeout(300)
def kill(pg):  # lose every life the real way (hurt -> loseLife)
    pg.evaluate("()=>{const G=__dc.G;G.inv=0;for(let k=0;k<60&&!G.dying;k++){G.hit=0;G.belly=0;__dc.hurt('test')}}");pg.wait_for_timeout(1200)
def visible(pg,i): return pg.evaluate(f"!document.getElementById('{i}').classList.contains('hide')")
def topN(pg,d): return pg.evaluate(f"JSON.parse(localStorage.dinoColossus_Top10_{d}||'[]').length")
try:
 with sync_playwright() as p:
  b=p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
  cx=ctx(b);pg=pg_(cx);pg.goto(URL);pg.wait_for_timeout(400)
  check('v16' in pg.inner_text('#ver'),'menu shows v16')
  for d in ['easy','medium','hard']:
    game(pg,d);g=pg.evaluate("[__dc.G.hearts,__dc.G.lives]");check(g==[5,5],f'{d}: starts with 5 hearts, 5 lives {g}')
  game(pg,'medium');pg.evaluate("()=>{const G=__dc.G;G.hearts=1;G.hit=0;G.belly=0;G.inv=0;__dc.hurt('t')}");pg.wait_for_timeout(100)
  g=pg.evaluate("[__dc.G.hearts,__dc.G.lives]");check(g==[5,4],f'life lost refills hearts to 5 {g}')
  # ---- out of lives -> Continue? ----
  game(pg,'medium');pg.evaluate("()=>{const G=__dc.G;G.d.x=G.secs[1].x0+30;G.d.y=150;G.camX=G.d.x-200}");pg.wait_for_timeout(1500)
  pg.evaluate("__dc.G.score=1234");sec=pg.evaluate("__dc.G.cur");kill(pg)
  check(visible(pg,'contq'),'out of lives shows Continue? screen');check(not visible(pg,'end'),'no game over yet')
  n0=int(pg.inner_text('#contN'));check(n0 in (20,19),f'countdown starts at 20 ({n0})')
  pg.screenshot(path=SHOTS+'/continue-countdown.png')
  pg.wait_for_timeout(2300);n1=int(pg.inner_text('#contN'));check(n1<=18 and n1>=17,f'countdown ticks in real time ({n0}->{n1})')
  check(pg.evaluate("!__dc.G.running"),'game frozen during countdown')
  for bid in ['contYes','contNo']:
    bb=pg.locator('#'+bid).bounding_box();check(bb['width']>=48 and bb['height']>=48,f'{bid} button >=48 px ({bb["width"]:.0f}x{bb["height"]:.0f})')
  # hidden tab pauses the countdown
  pg.evaluate("Object.defineProperty(document,'hidden',{get:()=>true,configurable:true})");l0=pg.evaluate("__dc.G.cont.left");pg.wait_for_timeout(1500);l1=pg.evaluate("__dc.G.cont.left")
  pg.evaluate("delete document.hidden");check(abs(l0-l1)<.15,f'countdown pauses while app hidden ({l0:.2f}->{l1:.2f})')
  pg.wait_for_timeout(600);check(pg.evaluate("__dc.G.cont.left")<l1-.3,'countdown resumes when back')
  check(not visible(pg,'quitq') and pg.evaluate("(document.getElementById('menub').click(),document.getElementById('quitq').classList.contains('hide'))"),'home button does nothing during countdown')
  t0=topN(pg,'medium')
  pg.tap('#contYes');pg.evaluate("__dc.contYes()");pg.wait_for_timeout(300)  # double tap: second is ignored
  g=pg.evaluate("({h:__dc.G.hearts,l:__dc.G.lives,s:__dc.G.score,c:__dc.G.cur,r:__dc.G.running,dy:__dc.G.dying,n:__dc.G.continues,d:__dc.G.diff})")
  check(g['h']==5 and g['l']==5 and g['r'] and not g['dy'],f'Yes -> 5 hearts, 5 lives, playing {g}')
  check(g['s']>=1234 and g['c']==sec and g['d']=='medium',f'Yes keeps score, section {sec}, difficulty {g}')
  check(g['n']==1,'double tap on Yes counted once');check(not visible(pg,'contq'),'Continue? closed')
  check(topN(pg,'medium')==t0,'no Top 10 entry on Yes');pg.wait_for_timeout(600);pg.screenshot(path=SHOTS+'/after-yes.png')
  # ---- second death -> No -> game over + name entry once ----
  kill(pg);check(visible(pg,'contq'),'unlimited continues: Continue? again after second out-of-lives')
  pg.tap('#contNo');pg.evaluate("__dc.contNo();__dc.contYes()");pg.wait_for_timeout(800)
  check(visible(pg,'end') and not visible(pg,'contq'),'No -> game over screen')
  check(visible(pg,'ini'),'No -> Top 10 name entry shows');pg.screenshot(path=SHOTS+'/name-entry-after-no.png')
  check(pg.evaluate("!__dc.G.running&&!__dc.G.cont"),'no continue after No (Yes ignored)')
  pg.click('#iniSave');pg.wait_for_timeout(300);pg.evaluate("document.getElementById('iniSave').click()")
  check(topN(pg,'medium')==t0+1,f'Top 10 got exactly one entry ({t0}->{topN(pg,"medium")})')
  pg.screenshot(path=SHOTS+'/game-over-after-no.png')
  pg.evaluate("__dc.askCont()");check(not visible(pg,'contq'),'Continue? cannot reopen after game over')
  # ---- timeout path ----
  game(pg,'easy');pg.evaluate("__dc.G.score=777");kill(pg);t0=topN(pg,'easy')
  pg.evaluate("__dc.G.cont.left=0.4");pg.wait_for_timeout(1000)
  check(visible(pg,'end') and not visible(pg,'contq') and visible(pg,'ini'),'timeout -> game over + name entry')
  pg.click('#iniSave');pg.wait_for_timeout(300);check(topN(pg,'easy')==t0+1,'timeout: Top 10 entry once')
  pg.wait_for_timeout(1500);check(topN(pg,'easy')==t0+1 and visible(pg,'end'),'no second game over later')
  # ---- Hard boss death -> continue at that boss, full health ----
  game(pg,'hard');pg.evaluate("()=>{const G=__dc.G;__dc.startBoss()}");pg.wait_for_timeout(2500)
  pg.evaluate("()=>{const b=__dc.G.boss;b.hp=Math.max(1,b.hp-3)}");bn=pg.evaluate("__dc.G.bossN");kill(pg)
  check(visible(pg,'contq'),'boss death shows Continue?');pg.screenshot(path=SHOTS+'/hard-boss-continue.png')
  pg.tap('#contYes');pg.wait_for_timeout(700)
  g=pg.evaluate("({n:__dc.G.bossN,b:!!__dc.G.boss&&!__dc.G.boss.gone,hp:__dc.G.boss&&__dc.G.boss.hp,max:__dc.G.boss&&__dc.G.boss.max,l:__dc.G.lives,h:__dc.G.hearts})")
  check(g['b'] and g['n']==bn and g['hp']==g['max'] and g['l']==5,f'boss continue: same boss, full health, 5 lives {g}')
  pg.screenshot(path=SHOTS+'/hard-boss-after-yes.png')
  # ---- Calm + mute ----
  game(pg,'medium');pg.evaluate("VIS.setCalm(true)");kill(pg);check(visible(pg,'contq'),'Calm: Continue? works');pg.tap('#contYes');pg.wait_for_timeout(200)
  check(pg.evaluate("localStorage.dinoColossus_Calm")=="1" and pg.evaluate("__dc.G.running"),"Calm stays on and game runs after Yes");pg.evaluate("VIS.setCalm(false)")
  pg.goto(URL);pg.wait_for_timeout(300);pg.evaluate("document.getElementById('snd').click()");m=pg.evaluate("localStorage.dinoColossus_Snd");pg.evaluate("document.getElementById('snd').click()");check(m=='0' and pg.evaluate("localStorage.dinoColossus_Snd")=='1','mute toggle still works')
  check(not pg.errs,f'no console errors {pg.errs}')
  # ---- old v14/v15 save + menu Continue ----
  cx2=ctx(b);pg=pg_(cx2);pg.goto(URL);pg.wait_for_timeout(300)
  pg.evaluate("s=>{for(const k in s)localStorage[k]=s[k]}",{'dinoColossus_Diff':'hard','dinoColossus_Best_hard':'4321','dinoColossus_Run':json.dumps({'diff':'hard','pick':2,'score':900,'lives':2,'hearts':3,'bossN':2,'thrown':10,'eaten':30,'t':5}),'dinoColossus_DressOwned':'["lime"]','dinoColossus_DressOn':'{"c":"lime"}'})
  pg.reload();pg.wait_for_timeout(400);check(visible(pg,'cont'),'old save: menu CONTINUE shows')
  pg.click('#cont');pg.wait_for_timeout(300);g=pg.evaluate("[__dc.G.running,__dc.G.diff,__dc.G.bossN,__dc.G.score,__dc.G.lives,__dc.G.hearts]")
  check(g[:4]==[True,'hard',2,900],f'old save continues {g}');check(not pg.errs,f'no console errors (old save) {pg.errs}')
  keys=pg.evaluate("Object.keys(localStorage).sort()");check(not [k for k in keys if 'Cont' in k and k!='dinoColossus_Run'],'no new save keys')
  # ---- HUD fits at 3 phone sizes ----
  for w,h,dpr in [(915,412,1),(740,360,1),(892,411,3.5)]:
    c=ctx(b,w,h,dpr);q=pg_(c);q.goto(URL);q.wait_for_timeout(300);q.evaluate("localStorage.dinoColossus_Diff='medium'");q.reload();q.wait_for_timeout(300);q.click('#go');q.wait_for_timeout(2800)
    r=q.evaluate("(()=>{const col=VW/4;return {heartsEnd:14+6*17,goalX:col+4,livesEnd:col*2+46+5*20,belly:col*3}})()")
    check(r['heartsEnd']<r['goalX'] and r['livesEnd']<=r['belly'],f'{w}x{h} dpr{dpr}: 5 hearts + 5 lives fit {r}')
    q.screenshot(path=SHOTS+f'/hud-{w}x{h}.png');check(not q.errs,f'{w}x{h}: no console errors {q.errs}');c.close()
  b.close()
finally:
  srv.terminate()
print(f'{passes} passed, {len(fails)} failed');sys.exit(1 if fails else 0)

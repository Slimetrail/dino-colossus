# Dino Colossus v27: QA Tester / Skeptic / Security fixes. Pretend phone: headless Chromium with touch (not a real phone).
# Run: python3 tests/test_v27.py   ROOT=<other copy> runs the same checks on it (the new checks must fail on f086eaa).
# REPO=<git repo> is used only to take the v26 copy (commit f086eaa) for the real v26 -> v27 update check.
import subprocess,time,sys,os,json,shutil,tempfile,re
from playwright.sync_api import sync_playwright
ROOT=os.environ.get('ROOT') or os.path.dirname(os.path.dirname(os.path.abspath(__file__)));PORT=int(os.environ.get('PORT','8961'))
REPO=os.environ.get('REPO',ROOT)
SHOTS=os.environ.get('SHOTS',os.path.join(tempfile.gettempdir(),'dino-shots-v27'));os.makedirs(SHOTS,exist_ok=True)
SRV="""import http.server,sys,os
class H(http.server.SimpleHTTPRequestHandler):
  def list_directory(self,path):self.send_error(404);return None
  def log_message(self,*a):pass
os.chdir(sys.argv[2]);http.server.ThreadingHTTPServer(('127.0.0.1',int(sys.argv[1])),H).serve_forever()"""
def serve(d,port):return subprocess.Popen([sys.executable,'-c',SRV,str(port),d],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
srvs=[serve(ROOT,PORT)];time.sleep(1)
URL=f'http://127.0.0.1:{PORT}/';fails=[];passes=0
def check(c,m):
    global passes
    print(('PASS ' if c else 'FAIL ')+m,flush=True)
    if c: passes+=1
    else: fails.append(m)
rd=lambda f,r=ROOT:open(os.path.join(r,f),encoding='utf8').read() if os.path.exists(os.path.join(r,f)) else ''
sw=rd('sw.js');html=rd('index.html');gj=rd('game.js')
# ---- version ----
check('const VER="29"' in sw and sw.count('?v=29')==4 and '?v=27' not in sw,'sw VER 29 (v29 bump), SHELL ?v=29')
check(html.count('?v=29')==4 and '?v=27' not in html and '>v29 · A Slimetrail production<' in html,'index.html ?v=29 and footer "v29 · A Slimetrail production" (v29 bump)')
check(os.path.exists(os.path.join(ROOT,'CHANGES-v27.md')),'CHANGES-v27.md exists')
code=' '.join(rd(f).lower() for f in ['index.html','game.js','vis.js','sprites.js','sw.js','intro.js'])
for w in ['adsense','admob','doubleclick','applovin','unityads','gtag','analytics','fbq','affiliate','adsbygoogle','googlesyndication']: check(w not in code,f'ad scan: no {w}')
# ---- item 1 (code): no plain setTimeout left in game.js (all delayed calls use the game clock pT) ----
check('setTimeout(' not in gj and 'function pT(' in gj,'item1: game.js delayed calls all use the game clock (no setTimeout left)')
# ---- item 5c: register call keeps updateViaCache:'none' ----
m=re.search(r"\.register\(([^)]*)\)",html)
check(bool(m) and re.search(r"updateViaCache\s*:\s*'none'",m.group(1)) and m.group(1).startswith("'sw.js'"),"item5c: sw.register('sw.js',{updateViaCache:'none'}) (fixed address, never from the HTTP cache)")
# ---- item 5b: CREDITS.md licence names match the licence table ----
tab=rd('licences/SOUNDS-AND-ICONS-v26.md');cr=rd('CREDITS.md')
LIC=r'(CC0|CC-BY-NC(?:-SA)?(?: [0-9.]+)?|CC-BY-SA(?: [0-9.]+)?|CC-BY(?: [0-9.]+)?|GPL|MIT|own work)'
trow={}
for l in tab.splitlines():
    c=[x.strip() for x in l.split('|')]
    if len(c)>6 and c[1].startswith('sounds/'): trow[c[1][7:]]=c[5]
check(len(trow)>=11 and all(v=='CC0' for v in trow.values()),f'item5b: licence table: every sound effect row says CC0 ({len(trow)} rows)')
cl={}
for l in cr.splitlines():
    if not l.startswith('- '):continue
    files=re.findall(r'([a-z-]+\.(?:mp3|ogg))',l.split(' – ')[0]); lic=re.findall(LIC,l)
    for f in files: cl.setdefault(f,set()).update(lic)
sil=[l for l in cr.splitlines() if l.startswith('## Silly sounds')]
silLic=set(re.findall(LIC,sil[0])) if sil else set()
bad=[]
for f,v in trow.items():
    got=cl.get(f,set()) or (silLic if f.startswith('silly-') else set())
    if got!={v}: bad.append(f'{f}: CREDITS {sorted(got)} vs table {v}')
check(not bad,'item5b: CREDITS.md licence for each sound matches licences/SOUNDS-AND-ICONS-v26.md '+('; '.join(bad) if bad else ''))
check(not re.search(r'CC-BY|NonCommercial|GPL',cr),'item5b: CREDITS.md names no non-CC0 licence')
# ---- item 6 ----
check('traced to the pages above; page CC0 labels trusted' in cr and 'Still unverified: nothing' not in cr,'item6: CREDITS line "traced to the pages above; page CC0 labels trusted"')
check(not re.search(r'/workspace|/home/',rd('licences/OWN-WORK-CC0.txt')),'item6: licences/OWN-WORK-CC0.txt has no internal path')
lp=[]
for dp,_,fs in os.walk(os.path.join(ROOT,'licences')):
    for f in fs:
        if re.search(r'/workspace/|/home/',open(os.path.join(dp,f),errors='ignore').read()): lp.append(f)
check(not lp and not re.search(r'/workspace/|/home/',cr+rd('README.md')),f'item6: no internal paths in licences/, CREDITS.md, README.md {lp}')
def mob(b,w=844,h=390,**k): return b.new_context(viewport={'width':w,'height':h},device_scale_factor=2,has_touch=True,is_mobile=True,**k)
def pgnew(cx,errs):
    pg=cx.new_page();pg.on('pageerror',lambda e:errs.append(str(e)[:200]));return pg
RECT="(i=>{const e=document.getElementById(i);if(!e)return null;const r=e.getBoundingClientRect();return {l:r.left,r:r.right,t:r.top,b:r.bottom,w:r.width,h:r.height}})"
HID="(v=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>v});Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>v?'hidden':'visible'});document.dispatchEvent(new Event('visibilitychange'))})"
CONTN="(()=>{const e=document.getElementById('contq');return e&&!e.classList.contains('hide')?+document.getElementById('contN').textContent:null})()"
def start_hard(b,w=915,h=412):
    cx=mob(b,w,h);errs=[];pg=pgnew(cx,errs);pg.goto(URL+'?intro=0');pg.wait_for_timeout(600)
    pg.evaluate("localStorage.dinoColossus_Diff='hard'");pg.reload();pg.wait_for_timeout(700);pg.tap('#go');pg.wait_for_timeout(1200);return cx,pg,errs
def die(pg): pg.evaluate("()=>{const G=__dc.G;G.lives=1;G.hearts=1;G.inv=0;G.hit=0;__dc.loseLife()}")
ov=lambda a,c:not(a['r']<=c['l'] or c['r']<=a['l'] or a['b']<=c['t'] or c['b']<=a['t'])
try:
 with sync_playwright() as p:
  b=p.chromium.launch();allerrs=[]
  # ---- item 1: Continue countdown frozen while blurred (Skeptic blur.py repro: hard, last life lost, blur 5 s) ----
  cx,pg,errs=start_hard(b);die(pg);pg.wait_for_timeout(1600)
  n0=pg.evaluate(CONTN);l0=pg.evaluate("__dc.G.cont&&__dc.G.cont.left")
  pg.evaluate("dispatchEvent(new Event('blur'))");pg.wait_for_timeout(5000)
  n1=pg.evaluate(CONTN);l1=pg.evaluate("__dc.G.cont&&__dc.G.cont.left")
  check(n0 is not None and n0==n1 and l0 is not None and l1 is not None and abs(l0-l1)<0.25,f'item1: Continue countdown does not move during 5 s blur ({n0}->{n1}, left {l0}->{l1})')
  pg.screenshot(path=f'{SHOTS}/cont-blur-915x412.png',animations='disabled')
  pg.evaluate("dispatchEvent(new Event('focus'))");pg.wait_for_timeout(1500);l2=pg.evaluate("__dc.G.cont&&__dc.G.cont.left")
  check(l1 is not None and l2 is not None and 1.0<l1-l2<2.2,f'item1: countdown runs again after focus ({l1}->{l2})')
  pg.evaluate("dispatchEvent(new Event('blur'))");pg.evaluate(HID+"(true)");pg.wait_for_timeout(2000);l3=pg.evaluate("__dc.G.cont&&__dc.G.cont.left")
  check(l3 is not None and abs(l3-l2)<0.25,f'item1: countdown frozen while blurred and hidden ({l2}->{l3})')
  allerrs+=errs;cx.close()
  # ---- item 1: delayed calls freeze: Continue prompt after death waits while blurred ----
  cx,pg,errs=start_hard(b);die(pg);pg.evaluate("dispatchEvent(new Event('blur'))");pg.wait_for_timeout(2500)
  q0=pg.evaluate(CONTN);pg.evaluate("dispatchEvent(new Event('focus'))");pg.wait_for_timeout(1500);q1=pg.evaluate(CONTN)
  check(q0 is None and q1==20,f'item1: "Continue?" after OUT OF LIVES waits while blurred (blurred: {q0}, after focus: {q1})')
  r=pg.evaluate("""async()=>{if(typeof pT!=="function")return "no game clock";let n=0;pT(()=>n++,300);dispatchEvent(new Event('blur'));await new Promise(r=>setTimeout(r,900));const a=n;dispatchEvent(new Event('focus'));await new Promise(r=>setTimeout(r,700));return [a,n]}""")
  check(r==[0,1],f'item1: game-clock timer (boss start, champion tune, beeps) frozen while blurred, runs after focus {r}')
  r=pg.evaluate("""async()=>{if(typeof pT!=="function")return "no game clock";let n=0;pT(()=>n++,300);"""+HID.replace('(v=>','((v)=>')+"""(true);await new Promise(r=>setTimeout(r,900));const a=n;"""+HID+"""(false);await new Promise(r=>setTimeout(r,700));return [a,n]}""")
  check(r==[0,1],f'item1: game-clock timer frozen while hidden, runs after visible {r}')
  allerrs+=errs;cx.close()
  # ---- item 1 / QA m3: hidden then visible WITHOUT focus keeps the blur hold; a tap resumes ----
  cx,pg,errs=start_hard(b)
  pg.evaluate("dispatchEvent(new Event('blur'))");pg.evaluate(HID+"(true)");pg.wait_for_timeout(300);pg.evaluate(HID+"(false)")
  e0=pg.evaluate("__dc.G.el");pg.wait_for_timeout(1500);e1=pg.evaluate("__dc.G.el");h=pg.evaluate("__dc.silHold")
  check(h is True and abs(e1-e0)<0.05,f'item1 (QA m3): blur, hide, visible without focus: still paused (game clock {e0:.2f}->{e1:.2f})')
  pg.evaluate("document.getElementById('c').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))");pg.wait_for_timeout(1000);e2=pg.evaluate("__dc.G.el")
  check(e2-e1>0.6,f'item1 (QA m3): a tap on the screen resumes ({e1:.2f}->{e2:.2f})')
  allerrs+=errs;cx.close()
  # ---- item 1: music/audio pause on blur (not only on hidden) ----
  cx=mob(b,915,412);errs=[];pg=pgnew(cx,errs);pg.goto(URL+'?intro=0');pg.wait_for_timeout(600);pg.tap('#go');pg.wait_for_timeout(1500)
  s0=pg.evaluate("(()=>{try{return [ac().state,VIS.mKey||VIS.oKey||null]}catch(e){return null}})()");pg.evaluate("dispatchEvent(new Event('blur'))");pg.wait_for_timeout(500);s1=pg.evaluate("(()=>{try{return [ac().state,VIS.mKey||VIS.oKey||null]}catch(e){return null}})()")
  pg.evaluate("dispatchEvent(new Event('focus'))");pg.wait_for_timeout(500);s2=pg.evaluate("(()=>{try{return [ac().state,VIS.mKey||VIS.oKey||null]}catch(e){return null}})()")
  check(s0 and s0[0]=='running' and s1 and s1[0]=='suspended' and s1[1] is None and s2 and s2[0]=='running',f'item1: sound and music pause on blur and come back on focus ({s0} -> {s1} -> {s2})')
  allerrs+=errs;cx.close()
  # ---- item 5a: silly human first appears 120 px clear (gap0) ----
  cx,pg,errs=start_hard(b)
  g=pg.evaluate("""()=>{const G=__dc.G,d=G.d,out=[];for(const f of [1,-1]){G.sil=null;d.f=f;d.x=G.camX+__dc.VWnow()/2;__dc.sillyUpd(d);__dc.sillyStart('stink');const h=__dc.sillyHum();out.push(h?Math.round(Math.max(h.x-(d.x+d.w),d.x-(h.x+h.w))):null)}return out}""") if pg.evaluate("typeof __dc.VWnow==='function'") else pg.evaluate("""()=>{const G=__dc.G,d=G.d,out=[];for(const f of [1,-1]){G.sil=null;d.f=f;d.x=G.camX+400;__dc.sillyUpd(d);__dc.sillyStart('stink');const h=__dc.sillyHum();out.push(h?Math.round(Math.max(h.x-(d.x+d.w),d.x-(h.x+h.w))):null)}return out}""")
  check(all(x is not None and x>=110 for x in g),f'item5a: silly human starts at least 110 px from the dino, both facings (gaps {g}; gap0 is 120)')
  allerrs+=errs;cx.close()
  # ---- item 2: "Go to the menu?" dialog: home button stays where it was, never over BELLY ----
  for (w,h) in [(740,360),(640,360),(667,375),(915,412)]:
   cx=mob(b,w,h);errs=[];pg=pgnew(cx,errs);pg.goto(URL+'?intro=0');pg.wait_for_timeout(600);pg.tap('#go');pg.wait_for_timeout(900)
   t0=pg.evaluate("document.getElementById('menub').style.top");pg.tap('#menub');pg.wait_for_timeout(500)
   t1=pg.evaluate("document.getElementById('menub').style.top");vis=pg.evaluate("!document.getElementById('quitq').classList.contains('hide')")
   bb=pg.evaluate("(()=>{const G=__dc.G,c=document.getElementById('c').getBoundingClientRect();return G.belBox})()")
   check(vis and t0==t1,f'item2 {w}x{h}: home button stays put when "Go to the menu?" opens (top {t0} -> {t1})')
   pg.screenshot(path=f'{SHOTS}/quit-{w}x{h}.png',animations='disabled');pg.tap('#quitNo');pg.wait_for_timeout(300);allerrs+=errs;cx.close()
  # ---- item 3: small screens ----
  SIZES=[(320,568),(320,480),(360,640),(390,844),(740,360),(915,412),(640,360),(844,390)]
  for (w,h) in SIZES:
   cx=mob(b,w,h);errs=[];pg=pgnew(cx,errs);pg.goto(URL+'?intro=0');pg.wait_for_timeout(800)
   sh=pg.evaluate("Math.max(document.documentElement.scrollHeight,document.getElementById('start').scrollHeight)")
   check(sh<=h+1,f'item3 {w}x{h}: start screen does not scroll ({sh}/{h})')
   for i in ['optb','ver','snd','go','dressb']:
    r=pg.evaluate(RECT+f"('{i}')");check(r and r['t']>=-.5 and r['b']<=h+.5 and r['l']>=-.5 and r['r']<=w+.5,f'item3 {w}x{h}: #{i} fully on screen')
   small=pg.evaluate("[...document.querySelectorAll('#start button')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.width<44||r.height<44)}).map(e=>e.id||e.textContent.trim())")
   check(not small,f'item3 {w}x{h}: start buttons >=44 px {small}')
   if w<=360:pg.screenshot(path=f'{SHOTS}/start-{w}x{h}.png',animations='disabled')
   pg.evaluate("document.getElementById('dressb').click()");pg.wait_for_timeout(400)
   dx=pg.evaluate(RECT+"('dressx')");gr=pg.evaluate(RECT+"('dgrid')")
   items=pg.evaluate("[...document.querySelectorAll('#dgrid button')].map(e=>{const r=e.getBoundingClientRect();return {l:r.left,r:r.right,t:r.top,b:r.bottom}})")
   gv={'l':gr['l'],'r':gr['r'],'t':gr['t'],'b':min(gr['b'],h)}
   cover=[i for i in items if ov(dx,{'l':i['l'],'r':i['r'],'t':max(i['t'],gv['t']),'b':min(i['b'],gv['b'])}) and i['t']<gv['b'] and i['b']>gv['t']]
   check(dx['b']<=h+.5 and dx['t']>=0 and dx['h']>=44 and not cover,f'item3 {w}x{h}: Dress up Done button on screen, >=44 px, covers no item ({len(cover)} covered)')
   if w<=360:pg.screenshot(path=f'{SHOTS}/dress-{w}x{h}.png',animations='disabled')
   pg.evaluate("document.getElementById('dressx').click()");pg.wait_for_timeout(200)
   pg.tap('#go');pg.wait_for_timeout(1200)
   hud=pg.evaluate("(()=>{const G=__dc.G;return {k:G.hudK||1,lr:G.livesR,bel:G.belBox}})()")
   check(hud['lr'] is not None and hud['bel'] and hud['lr']+4<=hud['bel'][0],f'item3 {w}x{h}: lives row ends {hud["lr"]} before the belly meter at {hud["bel"] and round(hud["bel"][0])} (no touch)')
   if (w,h) in [(320,568),(320,480)]:check(hud['k']>=1.1,f'item3 {w}x{h}: HUD drawn bigger on small portrait phones (x{hud["k"]})')
   if w<=360:pg.screenshot(path=f'{SHOTS}/game-{w}x{h}.png',animations='disabled')
   die(pg);pg.wait_for_timeout(1500)
   y,n=pg.evaluate(RECT+"('contYes')"),pg.evaluate(RECT+"('contNo')")
   check(y and n and y['l']>=0 and n['r']<=w and y['b']<=h and n['b']<=h and min(y['w'],y['h'],n['w'],n['h'])>=44 and y['r']<=n['l'],f'item3 {w}x{h}: Continue YES {y and round(y["l"])}..{y and round(y["r"])} / NO {n and round(n["l"])}..{n and round(n["r"])} inside 0..{w}, >=44 px')
   if w<=360:pg.screenshot(path=f'{SHOTS}/cont-{w}x{h}.png',animations='disabled')
   allerrs+=errs;cx.close()
  check(not allerrs,f'no page errors {allerrs[:3]}')
  # ---- item 4: half-finished updates (real service worker, local server) ----
  def bump(d,suffix='9'):
      s=open(os.path.join(d,'sw.js')).read();v=re.search(r'const VER="([^"]+)"',s).group(1);nv=v+suffix
      s=s.replace(f'const VER="{v}"',f'const VER="{nv}"').replace(f'?v={v}',f'?v={nv}');open(os.path.join(d,'sw.js'),'w').write(s)
      t=open(os.path.join(d,'index.html')).read().replace(f'?v={v}',f'?v={nv}').replace(f'>v{v} · ',f'>v{nv} · ');open(os.path.join(d,'index.html'),'w').write(t)
  def put(src,dst,drop=()):
      for f in os.listdir(dst):
          q=os.path.join(dst,f);shutil.rmtree(q) if os.path.isdir(q) else os.remove(q)
      for f in os.listdir(src):
          if f in ('.git','tests','sounds-silly'):continue
          q=os.path.join(src,f)
          shutil.copytree(q,os.path.join(dst,f),copy_function=shutil.copy) if os.path.isdir(q) else shutil.copy(q,os.path.join(dst,f))
      for f in drop: os.remove(os.path.join(dst,f))
  def works(pg): return pg.evaluate("typeof __dc!=='undefined'&&!!__dc.G&&!document.getElementById('updfail')&&document.getElementById('go').getBoundingClientRect().width>0")
  def ver(pg): return pg.evaluate("(document.getElementById('ver')||{}).textContent||''")
  def scen(name,first,second,drop,expect):
      port=PORT+1+scen.n;scen.n+=1;d=tempfile.mkdtemp();put(first,d);s=serve(d,port);srvs.append(s);time.sleep(.8)
      cx=mob(b,915,412);errs=[];pg=pgnew(cx,errs);u=f'http://127.0.0.1:{port}/?intro=0'
      pg.goto(u);pg.wait_for_timeout(500);pg.evaluate("navigator.serviceWorker.ready");pg.wait_for_timeout(1500);pg.reload();pg.wait_for_timeout(1500)
      ctl=pg.evaluate("!!navigator.serviceWorker.controller");put(second,d,drop)
      res=[]
      for i in range(3):
          pg.reload();pg.wait_for_timeout(2500);res.append((works(pg),ver(pg)))
      ok=ctl and all(r[0] for r in res) and expect(res)
      check(ok,f'item4 {name}: game still works after reloads {res} (controlled first: {ctl})')
      pg.screenshot(path=f'{SHOTS}/update-{name}.png');cx.close();s.kill()
  scen.n=0
  tmp=tempfile.mkdtemp();cur=os.path.join(tmp,'cur');shutil.copytree(ROOT,cur,ignore=shutil.ignore_patterns('.git','sounds-silly'),copy_function=shutil.copy)
  nxt=os.path.join(tmp,'nxt');shutil.copytree(cur,nxt,copy_function=shutil.copy);bump(nxt)
  scen('next-version-missing-game.js',cur,nxt,['game.js'],lambda r:all('v29 ·' in v or 'v28 ·' in v for _,v in r) and not any('9 ·' in v for _,v in r))
  old=os.path.join(tmp,'v26');os.makedirs(old)
  if subprocess.run(f"git -C '{REPO}' archive f086eaaa0d21730c8e56f51287a8351021cebb27 | tar -x -C '{old}'",shell=True).returncode==0:
      scen('v26-to-this-missing-game.js',old,cur,['game.js'],lambda r:all(v for _,v in r))
  else: check(False,'item4: could not take the v26 copy (set REPO to the git repo)')
  # no saved copy at all + missing game.js: a clear Try again button
  port=PORT+9;d=tempfile.mkdtemp();put(cur,d,['game.js']);s=serve(d,port);srvs.append(s);time.sleep(.8)
  cx=mob(b,915,412);errs=[];pg=pgnew(cx,errs);pg.goto(f'http://127.0.0.1:{port}/?intro=0');pg.wait_for_timeout(2500)
  r=pg.evaluate(RECT+"('updfail')");bt=pg.evaluate("(()=>{const e=document.querySelector('#updfail button');if(!e)return null;const r=e.getBoundingClientRect();return [r.width,r.height]})()")
  check(r is not None and r['w']>0 and bt and min(bt)>=44,f'item4: first visit with game.js missing shows a clear "Try again" button {bt}')
  pg.screenshot(path=f'{SHOTS}/update-first-visit-missing-game.js.png');cx.close();s.kill()
  b.close()
finally:
  for s in srvs: s.kill()
print(f'\n{passes} passed, {len(fails)} failed');[print('  FAIL',f) for f in fails];sys.exit(1 if fails else 0)

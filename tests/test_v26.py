# Dino Colossus v26: QA/Skeptic/Security fixes. Pretend phone: headless Chromium with touch (not a real phone).
# Run: python3 tests/test_v26.py   ROOT=<older copy> runs the same checks against it (the new checks must fail on c66f5f9).
import subprocess,time,sys,os,json,shutil,tempfile,re
from playwright.sync_api import sync_playwright
ROOT=os.environ.get('ROOT') or os.path.dirname(os.path.dirname(os.path.abspath(__file__)));PORT=int(os.environ.get('PORT','8941'))
SHOTS=os.environ.get('SHOTS','/workspace/dino-shots/v26');os.makedirs(SHOTS,exist_ok=True)
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
rd=lambda f:open(os.path.join(ROOT,f),encoding='utf8').read() if os.path.exists(os.path.join(ROOT,f)) else ''
sw=rd('sw.js');html=rd('index.html')
check('const VER="26"' in sw and sw.count('?v=26')==4 and '?v=25' not in sw,'sw VER 26, SHELL ?v=26')
check(html.count('?v=26')==4 and '?v=25' not in html and '>v26 · A Slimetrail production<' in html,'index.html ?v=26 and footer v26')
check(os.path.exists(os.path.join(ROOT,'CHANGES-v26.md')),'CHANGES-v26.md exists')
code=' '.join(rd(f).lower() for f in ['index.html','game.js','vis.js','sprites.js','sw.js','intro.js'])
for w in ['adsense','admob','doubleclick','applovin','unityads','gtag','analytics','fbq','affiliate','adsbygoogle','googlesyndication']: check(w not in code,f'ad scan: no {w}')
# ---- licences (item 5) ----
tab=rd('licences/SOUNDS-AND-ICONS-v26.md');cr=rd('CREDITS.md')
for f in sorted(os.listdir(os.path.join(ROOT,'sounds'))):
    if f.startswith(('dino-','intro-','boss-')):continue
    row=[l for l in tab.splitlines() if l.startswith('| sounds/'+f+' |')]
    check(row and ('http' in row[0] and 'CC0' in row[0] or 'own-made' in row[0]),f'licence record with source page or own-made for sounds/{f}')
check('greg300' in cr and 'matched by audio comparison on 2026-11-01' in cr and 'byte-identical' in cr,'CREDITS roar line: greg300, matched by audio comparison on 2026-11-01, not byte-identical')
check('Still unverified: nothing' in cr and 'Status: UNVERIFIED' not in cr,'CREDITS: no sound left marked unverified')
check('CC0 1.0 Universal' in rd('licences/CC0-1.0-legalcode.txt') and 'Statement of Purpose' in rd('licences/CC0-1.0-legalcode.txt'),'CC0 full legal text saved')
for p in ['opengameart-retro-monster-roar-2026-11-01.txt','kenney-impact-sounds-License.txt','kenney-interface-sounds-License.txt','kenney-music-jingles-License.txt','kenney-digital-audio-License.txt']:
    check(os.path.exists(os.path.join(ROOT,'licences/pages',p)),f'licences/pages/{p} saved')
check(not any(re.search(r'<script',open(os.path.join(dp,f),errors='ignore').read(),re.I) for dp,_,fs in os.walk(os.path.join(ROOT,'licences')) for f in fs),'licence page copies are plain text (no scripts that could run on the site)')
ic=tempfile.mkdtemp();mk=os.path.join(ROOT,'tools/make_icons.py')
CMP="import sys;from PIL import Image,ImageChops;r,t=sys.argv[1:3];print(all(ImageChops.difference(Image.open(r+'/icons/'+f).convert('RGB'),Image.open(t+'/'+f).convert('RGB')).getbbox() is None for f in ['icon-192.png','icon-512.png','maskable-512.png']))"
same=os.path.exists(mk) and subprocess.run(['python3',mk,ic]).returncode==0 and subprocess.run(['python3','-c',CMP,ROOT,ic],capture_output=True,text=True).stdout.strip()=='True'
check(same,'own-made icons: tools/make_icons.py rebuilds all three icons pixel-for-pixel');shutil.rmtree(ic,ignore_errors=True)
def mob(b,w=844,h=390,**k): return b.new_context(viewport={'width':w,'height':h},device_scale_factor=2,has_touch=True,is_mobile=True,**k)
def pgnew(cx,errs):
    pg=cx.new_page();pg.on('pageerror',lambda e:errs.append(str(e)[:200]));return pg
RECT="(i=>{const r=document.getElementById(i).getBoundingClientRect();return {l:r.left,r:r.right,t:r.top,b:r.bottom,w:r.width,h:r.height}})"
try:
 with sync_playwright() as p:
  b=p.chromium.launch();allerrs=[]
  # ---- item 1: pause dialog buttons >= 44 px; home and sound do not overlap ----
  for (w,h) in [(740,360),(915,412),(667,375),(640,360),(844,390),(390,844),(320,568)]:
   cx=mob(b,w,h);errs=[];pg=pgnew(cx,errs);pg.goto(URL+'?intro=0');pg.wait_for_timeout(600)
   s0,m0=pg.evaluate(RECT+"('snd')"),pg.evaluate(RECT+"('menub')")
   pg.tap('#go');pg.wait_for_timeout(700);pg.tap('#menub');pg.wait_for_timeout(400)
   vis=pg.evaluate("!document.getElementById('quitq').classList.contains('hide')")
   y,n=pg.evaluate(RECT+"('quitYes')"),pg.evaluate(RECT+"('quitNo')")
   check(vis and min(y['h'],n['h'],y['w'],n['w'])>=44 and y['b']<=h+.5 and n['b']<=h+.5,f'item1 {w}x{h}: quit "Yes, menu" {y["h"]:.0f} px and "No, keep playing" {n["h"]:.0f} px tall (>=44), on screen')
   if (w,h) in [(740,360),(320,568)]:pg.screenshot(path=f'{SHOTS}/quit-{w}x{h}.png',animations='disabled')
   pg.tap('#quitNo');pg.wait_for_timeout(300);s1,m1=pg.evaluate(RECT+"('snd')"),pg.evaluate(RECT+"('menub')")
   ok=all(mm['r']<=ss['l'] or mm['b']<=ss['t'] or mm['t']>=ss['b'] for ss,mm in [(s0,m0),(s1,m1)])
   check(ok,f'item1 {w}x{h}: home button and sound button do not overlap (gap {s0["l"]-m0["r"]:.0f} px)')
   allerrs+=errs;cx.close()
  # ---- item 3: 320x568 start screen fits (Top 10, Calm, Sound, credit line on screen, no scroll) ----
  for (w,h) in [(320,568),(360,640),(390,844)]:
   cx=mob(b,w,h);errs=[];pg=pgnew(cx,errs);pg.goto(URL+'?intro=0');pg.wait_for_timeout(700)
   off=pg.evaluate("[...document.querySelectorAll('#start button,#snd,#ver')].filter(e=>e.getBoundingClientRect().width>0).map(e=>{const r=e.getBoundingClientRect();return [e.id||e.textContent.trim().slice(0,10),Math.round(r.top),Math.round(r.bottom),Math.round(r.height)]}).filter(x=>x[1]<0||x[2]>innerHeight+.5||(x[0]!='ver'&&x[3]<44))")
   check(not off,f'item3 {w}x{h}: every start button and the credit line on screen without scrolling, buttons >=44 px {off}')
   pg.screenshot(path=f'{SHOTS}/start-{w}x{h}.png',animations='disabled');allerrs+=errs;cx.close()
  # ---- item 2: blur / hide freezes the whole game ----
  for mode in ['blur','hidden']:
   cx=mob(b);errs=[];pg=pgnew(cx,errs);pg.goto(URL+'?intro=0');pg.evaluate("localStorage.dinoColossus_Diff='hard'");pg.reload();pg.wait_for_timeout(400);pg.tap('#go');pg.wait_for_timeout(600)
   pg.evaluate("()=>{const G=__dc.G;G.inv=1e6;G.hearts=5;G.banner=null;G.secBanner=null}")
   for i in range(60):
    n=pg.evaluate("(()=>{const G=__dc.G;return G.littles.length+G.rangers.length+G.boulders.length})()")
    if n>=1:break
    pg.wait_for_timeout(250)
   SNAP="(()=>{const G=__dc.G,f=a=>a.map(o=>[+o.x.toFixed(2),+o.y.toFixed(2)]);return {el:+G.el.toFixed(3),li:f(G.littles),ra:f(G.rangers),bo:f(G.boulders),sw:G.sil?G.sil.next:null}})()"
   if mode=='blur':pg.evaluate("dispatchEvent(new Event('blur'))")
   else:pg.evaluate("Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))")
   pg.wait_for_timeout(100);a=pg.evaluate(SNAP);pg.wait_for_timeout(1500);bb=pg.evaluate(SNAP)
   if mode=='blur':pg.screenshot(path=f'{SHOTS}/e5-blur-during.png',animations='disabled')
   if mode=='blur':pg.evaluate("dispatchEvent(new Event('focus'))")
   else:pg.evaluate("Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'))")
   pg.wait_for_timeout(800);c=pg.evaluate(SNAP);print('E5',mode,'creatures',n,'el',a['el'],bb['el'],c['el'])
   check(n>=1,f'item2 {mode}: at least one creature or boulder on screen to watch ({n})')
   check(a==bb,f'item2 {mode}: while away, game clock, creatures, boulders and the silly-human timer do not move (clock {a["el"]} -> {bb["el"]})')
   check(c['el']>bb['el']+0.3,f'item2 {mode}: game runs again after coming back (clock {bb["el"]} -> {c["el"]})')
   allerrs+=errs;cx.close()
  # ---- item 6: one update = one tap, one reload (simulated release of a new version) ----
  tmp=tempfile.mkdtemp(prefix='dino26upd-');site=os.path.join(tmp,'s');shutil.copytree(ROOT,site,ignore=shutil.ignore_patterns('.git','tests','licences','tools'))
  up=PORT+20;s2=serve(site,up);time.sleep(.8);U=f'http://127.0.0.1:{up}/'
  cx=mob(b,service_workers='allow');errs=[];pg=pgnew(cx,errs);pg.goto(U+'?intro=0')
  for i in range(40):
   if pg.evaluate("!!navigator.serviceWorker.controller"):break
   pg.wait_for_timeout(250)
  pg.wait_for_timeout(800)
  V=re.search(r'const VER="([^"]+)"',sw).group(1);NV=V+'.5'
  for f in ['sw.js','index.html']:
   s=open(os.path.join(site,f)).read().replace(f'const VER="{V}"',f'const VER="{NV}"').replace(f'?v={V}',f'?v={NV}');open(os.path.join(site,f),'w').write(s)
  pg.evaluate("navigator.serviceWorker.getRegistration().then(r=>r&&r.update()).catch(()=>{})")
  shown=False
  for i in range(40):
   pg.wait_for_timeout(250)
   if pg.evaluate("!document.getElementById('updb').classList.contains('hide')"):shown=True;break
  check(shown,'item6: new version found, "Update ready" button shows')
  if shown:
   with pg.expect_navigation():pg.tap('#updb')
   pg.wait_for_timeout(1500);pg.evaluate("navigator.serviceWorker.getRegistration().then(r=>r&&r.update()).catch(()=>{})");pg.wait_for_timeout(3500)
   again=pg.evaluate("({shown:window.DINO_UPD?DINO_UPD.shown:-1,btn:!document.getElementById('updb').classList.contains('hide')})")
   regs=pg.evaluate("navigator.serviceWorker.getRegistrations().then(rs=>rs.map(r=>[(r.active||{}).scriptURL,!!r.waiting,!!r.installing]))")
   print('UPD after one tap',again,regs)
   check(again['shown']==0 and not again['btn'],f'item6: after one tap and one reload, no second "Update ready" button {again}')
   keys=pg.evaluate("caches.keys()");check(f'dinocol-v{NV}' in keys and f'dinocol-v{V}' not in keys,f'item6: only the new cache is left {keys}')
  cx.close();s2.terminate();shutil.rmtree(tmp,ignore_errors=True);allerrs+=errs
  check(not allerrs,f'no page errors {allerrs[:4]}')
  b.close()
finally:
  srv.terminate()
print(f'{passes} passed, {len(fails)} failed');sys.exit(1 if fails else 0)

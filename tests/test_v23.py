# Dino Colossus v23 (Hard only): eat the WALKING silly human (it no longer races into the mouth), spear people x1.2,
# rolling boulders 30% fewer. Easy/Medium unchanged. Pretend phone: headless Chromium with touch. Run: python3 tests/test_v23.py
import subprocess,time,sys,os,re,json
from playwright.sync_api import sync_playwright
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));PORT=8873
SHOTS=os.environ.get('SHOTS','/workspace/dino-shots/v23');os.makedirs(SHOTS,exist_ok=True)
srv=subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
URL=f'http://localhost:{PORT}/';fails=[];passes=0
def check(c,m):
    global passes
    print(('PASS ' if c else 'FAIL ')+m)
    if c: passes+=1
    else: fails.append(m)
sw=open(os.path.join(ROOT,'sw.js')).read();html=open(os.path.join(ROOT,'index.html')).read()
check('const VER="23"' in sw and sw.count('?v=23')==4 and '?v=22' not in sw,'sw VER 23, cache dinocol-v23, SHELL ?v=23')
check(html.count('?v=23')==5 and '>v23 · A Slimetrail production<' in html,'index.html ?v=23 and footer "v23 · A Slimetrail production"')
check(os.path.exists(os.path.join(ROOT,'CHANGES-v23.md')),'CHANGES-v23.md exists')
code=' '.join(open(os.path.join(ROOT,f)).read().lower() for f in ['index.html','game.js','vis.js','sprites.js','sw.js','intro.js'])
for w in ['adsense','admob','doubleclick','applovin','unityads','gtag','analytics','fbq','utm_','affiliate','adsbygoogle']: check(w not in code,f'ad scan: no {w}')
def mob(b): return b.new_context(viewport={'width':844,'height':390},device_scale_factor=3,has_touch=True,is_mobile=True)
def game(b,d):
    cx=mob(b);pg=cx.new_page();pg.errs=[];pg.ext=[]
    pg.on('pageerror',lambda e:pg.errs.append(str(e)));pg.on('request',lambda r:(not r.url.startswith(URL)) and not r.url.startswith('data:') and pg.ext.append(r.url))
    pg.goto(URL+'?intro=0');pg.evaluate(f"localStorage.dinoColossus_Diff='{d}'");pg.reload();pg.wait_for_timeout(300);pg.tap('#go');pg.wait_for_timeout(400);return cx,pg
try:
 with sync_playwright() as p:
  b=p.chromium.launch()
  # 1 spear people: v22 Hard multiplier .35 -> v23 .42 (x1.2); Easy/Medium = old formula
  tab={}
  for d in ['easy','medium','hard']:
    cx,pg=game(b,d)
    tab[d]=pg.evaluate("[1,2,3,4,5,6,7,8,9,10].map(n=>{const x=__dc.Dx(n),RT=__dc.DK.rate(x),base=Math.min(5,1+(n>>1))*RT;return {n,old:Math.min(12,Math.round(base)),v22:Math.min(12,Math.round(base*.35)),now:__dc.rangerN(n,RT),want:Math.min(12,Math.round(base*.42))}})")
    # 2 rolling boulders: record each new boulder gap (Math.random fixed at 0/.5/.99 -> 6/8/~10 s draws)
    tab[d+'_boul']=pg.evaluate("""()=>{const D=__dc,G=D.G;const out=[];for(const rv of [0,.5,.99]){Math.random=()=>rv;const cur=G.cur;G.boulT=0;G.boulders=[];G.boss=null;G.inBonus=0;
      const n0=G.boulders.length;G.hearts=5;G.inv=9999;update();const got=G.boulT;const x=D.Dx(),f=Math.max(1.6,((6+4*rv)-Math.min(3,G.cur*.3))/D.DK.rate(x));out.push({rv,cur:G.cur,v22gap:+f.toFixed(3),gap:+got.toFixed(3)})}return out}""")
    if d!='hard':
      n=pg.evaluate("()=>{const G=__dc.G;for(let i=0;i<60*60;i++){G.hearts=3;G.inv=10;update();if(G.sil)return 1}return 0}");check(n==0,f'{d}: no silly human in 60 s')
    check(not pg.errs and not pg.ext,f'{d}: no errors / no outside requests {pg.errs} {pg.ext}');cx.close()
  print('SPEAR',json.dumps(tab['hard']));print('BOULDERS',json.dumps({d:tab[d+'_boul'] for d in ['easy','medium','hard']}))
  check(all(r['now']==r['old'] for d in ['easy','medium'] for r in tab[d]),'Easy/Medium spear people unchanged')
  check(all(r['now']==r['want'] for r in tab['hard']),'Hard spear people = v22 value x1.2 (multiplier .42) per section')
  h22=sum(r['v22'] for r in tab['hard']);hn=sum(r['now'] for r in tab['hard']);check(hn>h22,f'Hard spear people sections 1-10: v22 {h22} -> v23 {hn}')
  check(all(abs(r['gap']-r['v22gap'])<.02 for d in ['easy','medium'] for r in tab[d+'_boul']),'Easy/Medium boulder gap unchanged')
  check(all(abs(r['gap']-r['v22gap']/.7)<.02 for r in tab['hard_boul']),'Hard boulder gap = v22 gap / 0.7 (30% fewer rolling boulders)')
  # 3 silly human (Hard): walks on the ground; NOT eaten without input; eaten when the dino walks into it
  cx,pg=game(b,'hard')
  r=pg.evaluate("""()=>{const D=__dc,G=D.G,d=G.d;G.banner=null;G.secBanner=null;D.sillyStart('pogo');const e0=G.silEaten||0;let xs=[],ys=[];
    for(let i=0;i<60*16;i++){G.littles=[];G.rangers=[];G.boulders=[];G.meteors=[];G.inv=9999;G.hearts=5;d.vx=0;keys.arrowright=0;
      const h=D.sillyHum();if(h){xs.push(h.x);ys.push(h.y+h.h)}if(G.sil.fx||!(G.sil.warn>0))break;update()}
    return {eaten:(G.silEaten||0)-e0,fx:!!G.sil.fx,missed:G.sil.missed||0,dx:xs.length?Math.abs(xs[xs.length-1]-xs[0]):0,frames:xs.length}}""")
  print('NO-INPUT',r)
  check(r['eaten']==0 and not r['fx'],f'silly human is NOT eaten by itself (no racing into the mouth) {r}')
  check(r['dx']>20 and r['frames']>60,f'silly human walks along the ground (moved {r["dx"]:.0f} px)')
  pg.evaluate("__dc.G.sil.next=999")
  pg.evaluate("()=>{const D=__dc,G=D.G;G.d.f=1;G.banner=null;G.secBanner=null;D.sillyStart('stink');G.sil.next=999}");pg.wait_for_timeout(900)
  pg.screenshot(path=SHOTS+'/hard-1-walking-silly-human.png')
  r2=pg.evaluate("""()=>new Promise(ok=>{const D=__dc,G=D.G;const e0=G.silEaten||0;G.sil.hx=G.d.x+G.d.w+30;keys.arrowright=1;const t0=performance.now();(function w(){G.littles=[];G.critters=[];G.bigs=[];G.rangers=[];G.boulders=[];G.meteors=[];G.inv=9999;G.hearts=5;
     if((G.silEaten||0)>e0||performance.now()-t0>8000){keys.arrowright=0;ok({eaten:(G.silEaten||0)-e0,fx:G.sil.fx&&G.sil.fx.k});return}requestAnimationFrame(w)})()})""")
  print('RUN-INTO',r2);check(r2['eaten']==1 and r2['fx']=='stink',f'running into the walking silly human eats it and its trick happens {r2}')
  pg.wait_for_timeout(300);pg.screenshot(path=SHOTS+'/hard-2-after-eating.png')
  # 4 ordinary walking people still feed the dino in Hard
  e=pg.evaluate("()=>{const G=__dc.G,d=G.d;G.belly=0;G.hit=0;G.sil.fx=null;G.sil.next=999;const e0=G.eaten,b0=G.belly;G.people.push({x:d.x,y:d.y,w:18,h:26,vx:0,vy:0,e:G.people[0]?G.people[0].e:null});G.hit=0;update();return {de:G.eaten-e0,db:G.belly-b0}}")
  check(e['de']>=1 or e['db']>=1,f'Hard: eating an ordinary walking human still feeds/scores {e}')
  check(not pg.errs and not pg.ext,f'hard: no errors / no outside requests {pg.errs} {pg.ext}');cx.close()
  b.close()
finally: srv.kill()
print(f'{passes} passed, {len(fails)} failed');sys.exit(1 if fails else 0)

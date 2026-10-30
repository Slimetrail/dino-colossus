# Dino Colossus v18 tests: wide phones (2.2:1, left inset) - cave corners visible + grabbable, dino never cut off or under buttons (Playwright). Run: python3 tests/test_v18.py
import subprocess,time,sys,os,io
from playwright.sync_api import sync_playwright
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));PORT=8863
srv=subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
URL=os.environ.get('DINO_URL',f'http://localhost:{PORT}/?intro=0');fails=[];passes=0;SHOTS=os.environ.get('DINO_SHOTS','/workspace/dino-shots/v18');os.makedirs(SHOTS,exist_ok=True)
def check(c,m):
    global passes
    print(('PASS ' if c else 'FAIL ')+m)
    if c: passes+=1
    else: fails.append(m)
SETUP="()=>{localStorage.dinoColossus_Diff='hard';localStorage.dinoColossus_Unlocks=JSON.stringify({speed:1,big:1,flame:1});localStorage.dinoColossus_DressOn=JSON.stringify({h:'top'})}"
# screen boxes: dino drawn sprite (conservative), people, visible buttons, safe area
GEOM='''()=>{const G=__dc.G,v=__dc.view,d=G.d,S=v.S,sap=getComputedStyle(document.getElementById('sap')),sl=parseFloat(sap.paddingLeft)||0,sr=parseFloat(sap.paddingRight)||0;
 const fat=1+.3*Math.min(1.3,G.bv),hw=G.roll?d.h/2+2:9*(2.6*d.h/36)*fat*1.15,cx=d.x+d.w/2,toS=(x,y)=>[(x-G.camX)*S,(y-v.WY)*S+v.OY];
 const a=toS(cx-hw,d.y-d.h*.45),b=toS(cx+hw,d.y+d.h);const btn=[...document.querySelectorAll('.cb,#bs')].filter(e=>!e.classList.contains('hide')&&getComputedStyle(e).display!='none').map(e=>{const r=e.getBoundingClientRect();return {id:e.id,r:[r.left,r.top,r.right,r.bottom]}});
 const ppl=G.people.map(p=>{const q=toS(p.x,p.y),r=toS(p.x+p.w,p.y+p.h);return [q[0],q[1],r[0],r[1]]});return {dino:[a[0],a[1],b[0],b[1]],btn,ppl,sl,sr,W:innerWidth,H:innerHeight,groundY:toS(0,GY)[1]}}'''
CORNER='''([side,belly])=>{const D=__dc,G=D.G;if(G.inBonus)D.exitBonus();D.enterBonus();G.bonusT=999;G.banner=null;G.belly=belly;G.hit=0;G.safeT=0;G.needRel=0;G.spawnT=0;const X=G.bonusX,W=G.bonusW;
 G.people=[{x:side=='l'?X+1:X+W-19,y:GY-26,w:18,h:26,vx:0,vy:0,e:'🧍',dance:99999}];G.pel=[];G.gemsW=[];G.d.x=X+W/2;G.d.y=GY-40;const n0=G.people.length,k='arrow'+(side=='l'?'left':'right');keys[k]=true;
 for(let i=0;i<240;i++){if(i%50==10)keys[' ']=true;if(i%50==20)keys[' ']=false;update()}keys[k]=false;keys[' ']=false;G.belly=belly;
 for(let i=0;i<5;i++){G.d.y=GY-G.d.h;G.d.x=side=='r'?X+W-G.d.w:X;update()}return {grabbed:G.people.length<n0,roomInView:X>=G.camX&&X+W<=G.camX+VW}}'''
def inside(r,g): return r[0]>=g['sl']-.5 and r[2]<=g['W']-g['sr']+.5 and r[1]>=-.5 and r[3]<=g['H']+.5
def hit(a,b): return a[0]<b[2] and b[0]<a[2] and a[1]<b[3] and b[1]<a[3]
try:
 with sync_playwright() as p:
  b=p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
  # (w,h,dpr,left inset px): Jeremy's S26 Ultra window 1024x473 @3 incl. a 42px left cutout bar, 2.2:1 with offset, others
  for w,h,dpr,sal in [(1024,473,3,0),(1024,473,3,42),(1040,473,3,42),(915,412,3.5,0),(960,432,1,0),(1100,500,1,0),(1200,540,1,24),(740,360,1,0)]:
    tag=f'{w}x{h}'+(f'+L{sal}' if sal else '')
    cx=b.new_context(viewport={'width':w,'height':h},device_scale_factor=dpr,has_touch=True,is_mobile=True);pg=cx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and errs.append(m.text))
    pg.goto(URL);pg.evaluate(SETUP);pg.reload();pg.wait_for_timeout(300)
    if w==1024 and not sal: _V=open(os.path.join(ROOT,'sw.js')).read().split('VER="')[1].split('"')[0];check('v'+_V in pg.inner_text('#ver'),'menu shows current version (v18+)')
    if sal: pg.evaluate(f"()=>document.documentElement.style.setProperty('--sal','{sal}px')")
    pg.click('#go');pg.wait_for_timeout(400)
    bad=[]
    for side in 'lr':
      for bl in (0,15,33):  # empty, fat, full (bonus room caps the form at FAT)
        c=pg.evaluate(CORNER,[side,bl]);g=pg.evaluate(GEOM)
        if not c['grabbed']: bad.append(f'{side}{bl} not grabbed')
        if not c['roomInView']: bad.append(f'{side}{bl} room wider than view')
        if not inside(g['dino'],g): bad.append(f'{side}{bl} dino cut off {[round(x) for x in g["dino"]]}')
        for bt in g['btn']:
          if hit(g['dino'],bt['r']): bad.append(f'{side}{bl} dino under #{bt["id"]}')
        # a fresh corner human is visible and not under a button
        pg.evaluate(f"()=>{{const G=__dc.G;G.people=[{{x:{'G.bonusX+1' if side=='l' else 'G.bonusX+G.bonusW-19'},y:GY-26,w:18,h:26,vx:0,vy:0,e:'🧍',dance:99999}}];G.d.x=G.bonusX+G.bonusW/2}}")
        g=pg.evaluate(GEOM)
        if not inside(g['ppl'][0],g): bad.append(f'{side}{bl} corner human off screen')
        for bt in g['btn']:
          if hit(g['ppl'][0],bt['r']): bad.append(f'{side}{bl} corner human under #{bt["id"]}')
    check(not bad,f'{tag}: cave corners (empty/fat/full, top hat, Hard): human grabbed, dino fully on screen, nothing under buttons {bad}')
    g=pg.evaluate(GEOM);bs=[x for x in g['btn'] if x['id']=='bs']
    check(bs and bs[0]['r'][1]>=g['groundY'] and bs[0]['r'][3]-bs[0]['r'][1]>=34,f'{tag}: swap-power button sits in the control strip below the floor, tap target >=34px {bs and [round(x) for x in bs[0]["r"]]} ground {g["groundY"]:.0f}')
    if w==1024 and sal==42:
      for side in 'lr':
        pg.evaluate(CORNER,[side,33]);pg.evaluate("()=>{const G=__dc.G;G.people=[{x:%s,y:GY-26,w:18,h:26,vx:0,vy:0,e:'🧍',dance:99999}]}"%('G.bonusX+G.bonusW-19' if side=='r' else 'G.bonusX+1'))
        pg.evaluate("()=>{const G=__dc.G;G.d.x=%s}"%('G.bonusX+G.bonusW-G.d.w-30' if side=='r' else 'G.bonusX+30'));pg.wait_for_timeout(500);pg.screenshot(path=f'{SHOTS}/after-cave-{side}-corner-1024x473-left42.png')
    # full belly in the cave still grabs (for points, belly stays capped)
    r=pg.evaluate("()=>{const G=__dc.G;G.belly=__dc.cap();const s0=G.score,c0=G.belly;G.people=[{x:G.d.x,y:G.d.y+G.d.h-26,w:18,h:26,vx:0,vy:0,e:'🧍',dance:99999}];G.hit=0;update();return {left:G.people.length,ds:G.score-s0,b:G.belly-c0}}")
    check(r['left']==0 and r['ds']>0 and r['b']==0,f'{tag}: full belly in cave: human still grabbed for points {r}')
    pg.evaluate("()=>{__dc.exitBonus();const G=__dc.G;G.belly=0}")
    # normal level: dino + HUD (roll form)
    pg.evaluate("()=>{const G=__dc.G;G.belly=23;G.hit=0;G.safeT=0;keys[String.fromCharCode(32)]=false;G.sjump=0;for(let i=0;i<20;i++){update()}const d=G.d;d.x=G.camX+VW*.4;d.y=GY-d.h-1;d.vy=0;for(let i=0;i<10;i++)update()}");g=pg.evaluate(GEOM)
    check(inside(g['dino'],g) and not any(hit(g['dino'],bt['r']) for bt in g['btn']),f'{tag}: normal level ROLL dino on screen, clear of buttons {[round(x) for x in g["dino"]]} {[bt["id"] for bt in g["btn"] if hit(g["dino"],bt["r"])]}')
    hud=pg.evaluate("()=>{const r=document.getElementById('menub').getBoundingClientRect();return {ml:r.left,mb:r.bottom}}")
    if w==1024 and not sal: pg.wait_for_timeout(300);pg.screenshot(path=f'{SHOTS}/after-normal-hud-1024x473.png')
    # boss arena: push right / left against the walls
    br=pg.evaluate('''()=>{const D=__dc,G=D.G;G.belly=0;G.hit=0;G.safeT=0;G.needRel=0;G.spawnT=0;D.startBoss();const out={};for(const k of ['arrowright','arrowleft']){keys[k]=true;for(let i=0;i<400;i++){G.hit=Math.max(G.hit,0);G.safeT=99;update()}keys[k]=false;out[k]=1}return out}''')
    g=pg.evaluate(GEOM);pg.evaluate("()=>{keys.arrowright=true}");pg.evaluate("()=>{const G=__dc.G;for(let i=0;i<400;i++){G.safeT=99;update()}keys.arrowright=false}");g2=pg.evaluate(GEOM)
    check(inside(g['dino'],g) and inside(g2['dino'],g2),f'{tag}: boss arena: dino stays fully on screen at both walls {[round(x) for x in g["dino"]]} {[round(x) for x in g2["dino"]]}')
    check(not errs,f'{tag}: no console errors {errs}');cx.close()
  b.close()
finally:
  srv.terminate()
print(f'{passes} passed, {len(fails)} failed');sys.exit(1 if fails else 0)

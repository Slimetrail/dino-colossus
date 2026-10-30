# Dino Colossus v17 tests: bonus cave corners/edges + safe respawn (Playwright, headless Chromium). Run: python3 tests/test_v17.py
import subprocess,time,sys,os,json,re
from playwright.sync_api import sync_playwright
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));PORT=8848
srv=subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
URL=os.environ.get('DINO_URL',f'http://localhost:{PORT}/?intro=0');fails=[];passes=0;SHOTS=os.environ.get('DINO_SHOTS','/workspace/dino-shots/v17');os.makedirs(SHOTS,exist_ok=True)
def check(c,m):
    global passes
    print(('PASS ' if c else 'FAIL ')+m)
    if c: passes+=1
    else: fails.append(m)
FUZZ='''(seed)=>{const D=__dc,G=D.G;let s=seed;const rnd=()=>(s=(s*16807)%2147483647)/2147483647;const r={oob:0,maxOut:0,minY:999,maxY:-999,hurts:0,left:0};
 for(let t=0;t<30;t++){D.enterBonus();G.bonusT=999;G.belly=[0,15,23][t%3];G.sjump=t%4==0?300:0;G.inv=0;G.hit=0;G.safeT=0;const h0=G.hearts+G.lives*10;
  for(let i=0;i<900;i++){if(i%30==0){const q=rnd();keys.arrowright=q<.45;keys.arrowleft=q>.6;keys[' ']=rnd()<.5}update();const d=G.d;if(!G.inBonus){r.left++;break}
   const out=Math.max(G.camX-d.x,d.x+d.w-(G.camX+VW));r.maxOut=Math.max(r.maxOut,out);r.minY=Math.min(r.minY,d.y);r.maxY=Math.max(r.maxY,d.y+d.h);if(out>1||d.y+d.h>GY+1||d.y<0)r.oob++}
  keys.arrowright=keys.arrowleft=keys[' ']=false;if(G.hearts+G.lives*10<h0)r.hurts++;G.hearts=5;G.lives=5;D.exitBonus()}
 return r}'''
CORNER='''([side,belly])=>{const D=__dc,G=D.G;D.enterBonus();G.bonusT=999;G.belly=belly;G.hit=0;G.safeT=0;G.needRel=0;G.spawnT=0;const X=G.camX,W=VW;
 G.people=[{x:side=='l'?X+1:X+W-19,y:GY-26,w:18,h:26,vx:0,vy:0,e:'🧍',dance:99999}];G.d.x=X+W/2;G.d.y=GY-40;const b0=G.belly,k='arrow'+(side=='l'?'left':'right');keys[k]=true;
 for(let i=0;i<240;i++){if(i%50==10)keys[' ']=true;if(i%50==20)keys[' ']=false;update()}keys[k]=false;keys[' ']=false;
 const d=G.d;return {eaten:G.belly>b0,left:G.people.length,dx:Math.round(d.x-X),dy:Math.round(d.y),onScreen:d.x>=X-.5&&d.x+d.w<=X+W+.5&&d.y+d.h<=GY+1}}'''
GROW='''(side)=>{const D=__dc,G=D.G;D.enterBonus();G.bonusT=999;G.belly=0;G.hit=0;G.safeT=0;G.needRel=0;G.spawnT=0;const X=G.camX,k='arrow'+(side=='l'?'left':'right');keys[k]=true;
 for(let i=0;i<200;i++)update();const h0=G.hearts;G.belly=23;let bad=0,miny=999;for(let i=0;i<300;i++){keys[' ']=i%40<15;update();const d=G.d;miny=Math.min(miny,d.y);if(d.y+d.h>GY+1||d.x<X-.5||d.x+d.w>X+VW+.5||!G.inBonus)bad++}
 keys[k]=false;keys[' ']=false;return {bad,miny,hearts:G.hearts-h0}}'''
PIT='''()=>{const D=__dc,G=D.G;let pit=null;for(const s of G.secs){for(const p of s.pits)if(p.x>G.d.x+200){pit=p;break}if(pit)break}if(!pit)return {nopit:1};
 G.d.x=pit.x-40;G.d.y=GY-60;G.camX=Math.max(G.camX,G.d.x-VW*.4);G.hit=0;G.safeT=0;G.spawnT=0;G.needRel=0;G.belly=0;
 for(let i=0;i<30;i++)update();G.lastSafe={x:pit.x-G.d.w+2,y:G.d.y};  // last ground touched = the very edge
 const h0=G.hearts,l0=G.lives;keys.arrowright=true;let falls=0,prevBelow=false,xs=[];G.d.x=pit.x+pit.w/2;G.d.y=GY+30;G.d.vy=2;
 let ph=G.hearts;for(let i=0;i<60*4;i++){update();if(G.hearts<ph)falls++;ph=G.hearts;if(i==1)xs.push(G.d.x);if(i==100)xs.push(G.d.x)}
 const spot={x:G.d.x,clear:[-24,0,G.d.w/2,G.d.w,G.d.w+40].every(o=>__dc.G.solids&&(()=>{let t=null;for(const s of G.solids)if(s.k=='g'&&G.d.x+o>=s.x&&G.d.x+o<=s.x+s.w)t=1;return t})()),edge:pit.x-(G.d.x+G.d.w)};
 const heldX=G.d.x;keys.arrowright=false;for(let i=0;i<5;i++)update();keys.arrowright=true;for(let i=0;i<20;i++)update();const moved=G.d.x-heldX;keys.arrowright=false;
 return {hearts:h0-G.hearts,lives:l0-G.lives,falls,xs,spot,moved}}'''
try:
 with sync_playwright() as p:
  b=p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
  for w,h,dpr in [(915,412,1),(740,360,1),(892,411,3.5)]:
    cx=b.new_context(viewport={'width':w,'height':h},device_scale_factor=dpr,has_touch=True);pg=cx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and errs.append(m.text))
    pg.goto(URL);pg.wait_for_timeout(300);pg.click('#go');pg.wait_for_timeout(300)
    if w==915: _VER=re.search(r'VER="(\d+)"',open(os.path.join(ROOT,'sw.js')).read()).group(1);check('v'+_VER in pg.inner_text('#ver'),'menu shows v'+_VER)
    r=pg.evaluate(FUZZ,4242);check(r['oob']==0 and r['maxOut']<1 and r['minY']>=0 and r['maxY']<=361 and r['left']==0,f'{w}x{h}: bonus cave fuzz (30 runs, jumps, fat/roll, super jump) stays inside the room {r}')
    check(r['hurts']==0,f'{w}x{h}: no hearts lost from walls/corners in bonus cave')
    for side in 'lr':
      g=pg.evaluate(GROW,side);check(g['bad']==0 and g['hearts']==0,f'{w}x{h}: growing fat/rolling against the {side} wall never clips through floor or over wall {g}')
      for bl in (0,15):
        c=pg.evaluate(CORNER,[side,bl]);check(c['eaten'] and c['onScreen'],f'{w}x{h}: human in {side} corner can be grabbed (belly {bl}) {c}')
    if w==915:
      pg.evaluate("()=>{const G=__dc.G;__dc.enterBonus();G.bonusT=999;G.banner=null;G.d.x=G.camX+VW-G.d.w;G.d.y=GY-G.d.h;G.people.push({x:G.camX+VW-19,y:GY-26,w:18,h:26,vx:0,vy:0,e:'🧍',dance:99999})}");pg.wait_for_timeout(600);pg.screenshot(path=SHOTS+'/after-right-corner.png')
      pg.evaluate("()=>{const G=__dc.G;G.d.x=G.camX;G.d.y=GY-G.d.h;G.belly=23}");pg.wait_for_timeout(600);pg.screenshot(path=SHOTS+'/after-left-corner-rolling.png')
      pg.evaluate("()=>{__dc.exitBonus();__dc.G.belly=0}")
    pg.goto(URL);pg.wait_for_timeout(300);pg.click('#go');pg.wait_for_timeout(500)
    r=pg.evaluate(PIT)
    if r.get('nopit'): pg.evaluate("()=>{const G=__dc.G;G.d.x=G.secs[1].x0;}");pg.wait_for_timeout(300);r=pg.evaluate(PIT)
    check(not r.get('nopit'),f'{w}x{h}: found a pit to test')
    if not r.get('nopit'):
      check(r['hearts']+5*r['lives']<=1 and r['falls']==1,f'{w}x{h}: holding forward after a pit fall: one heart lost, no chained falls {r}')
      check(abs(r['xs'][0]-r['xs'][1])<1,f'{w}x{h}: held forward ignored after respawn until released {r["xs"]}')
      check(r['moved']>5,f'{w}x{h}: fresh press moves again ({r["moved"]:.0f}px)')
      check(r['spot']['clear'] and r['spot']['edge']>=30,f'{w}x{h}: respawn spot is on solid ground, back from the pit edge {r["spot"]}')
    if w==915:
      pg.goto(URL);pg.wait_for_timeout(300);pg.click('#go');pg.wait_for_timeout(500)
      s=pg.evaluate("()=>{const G=__dc.G;G.hit=0;G.belly=0;__dc.respawn('');const t={spawnT:G.spawnT,safeT:G.safeT,hit:G.hit};const h=G.hearts;G.hit=0;__dc.hurt('test');t.lost=h-G.hearts;keys.arrowright=true;const x=G.d.x;for(let i=0;i<20;i++)update();t.movedFrozen=G.d.x-x;keys.arrowright=false;for(let i=0;i<100;i++)update();G.hit=0;const h2=G.hearts;__dc.hurt('test');t.lostAfter=h2-G.hearts;return t}")
      check(s['spawnT']==30 and s['safeT']==90 and s['hit']>=90,f'respawn: 0.5 s blink pause + 1.5 s safe moment {s}')
      check(s['lost']==0 and s['lostAfter']==1,'damage ignored during safe moment, works again after')
      check(abs(s['movedFrozen'])<1,'held forward does not move during respawn')
      # screenshot respawn near pit
      pg.evaluate(PIT);pg.evaluate("()=>{const G=__dc.G;G.hit=0;G.belly=0;let pit=null;for(const s of G.secs)for(const p of s.pits)if(!pit&&p.x>G.d.x+100)pit=p;if(!pit)return;G.d.x=pit.x-40;G.camX=Math.max(G.camX,G.d.x-VW*.4);G.lastSafe={x:pit.x-G.d.w+2,y:GY-60};G.d.x=pit.x+pit.w/2;G.d.y=GY+30;G.d.vy=2;G.hit=0;G.safeT=0;for(let i=0;i<20;i++)update()}");pg.wait_for_timeout(150);pg.screenshot(path=SHOTS+'/respawn-near-pit.png')
      # life lost + Continue use the same respawn
      l=pg.evaluate("()=>{const G=__dc.G;G.hit=0;G.safeT=0;G.hearts=1;G.belly=0;__dc.hurt('t');return {lives:G.lives,hearts:G.hearts,safeT:G.safeT,needRel:G.needRel}}")
      check(l['hearts']==5 and l['safeT']>0 and l['needRel']==1,f'life lost uses safe respawn {l}')
      pg.evaluate("()=>{const G=__dc.G;G.lives=1;G.hearts=1;G.hit=0;G.safeT=0;__dc.hurt('t')}");pg.wait_for_timeout(1300)
      pg.click('#contYes');pg.wait_for_timeout(100);c=pg.evaluate("({l:__dc.G.lives,h:__dc.G.hearts,s:__dc.G.safeT,r:__dc.G.running})")
      check(c['l']==5 and c['h']==5 and c['s']>0 and c['r'],f'Continue Yes uses safe respawn {c}')
    check(not errs,f'{w}x{h}: no console errors {errs}');cx.close()
  b.close()
finally:
  srv.terminate()
print(f'{passes} passed, {len(fails)} failed');sys.exit(1 if fails else 0)

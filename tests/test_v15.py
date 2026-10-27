# Dino Colossus v15 difficulty + Hard-only silly human tests (Playwright, headless Chromium). Run: python3 tests/test_v15.py
import subprocess,time,sys,os,json
from playwright.sync_api import sync_playwright
import re as _re;_VER=_re.search(r'VER="(\d+)"',open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),'sw.js')).read()).group(1)
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));PORT=8845
srv=subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
URL=f'http://localhost:{PORT}/';fails=[];passes=0;SHOTS='/workspace/dino-shots/v15';os.makedirs(SHOTS,exist_ok=True)
SIL=['toot','boing','whoosh','pop','warn']
def check(c,m):
    global passes
    print(('PASS ' if c else 'FAIL ')+m)
    if c: passes+=1
    else: fails.append(m)
def pg_(cx):
    pg=cx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and errs.append(m.text));pg.errs=errs;return pg
def ctx(b,w=915,h=412,dpr=1,**k): return b.new_context(viewport={'width':w,'height':h},device_scale_factor=dpr,has_touch=True,**k)
def frames(pg,ms):
    return pg.evaluate('''ms=>new Promise(res=>{const dts=[];let l=performance.now(),s=l;function f(t){dts.push(t-l);l=t;if(t-s<ms)requestAnimationFrame(f);else res(dts)}requestAnimationFrame(f)})''',ms)
def st(a):
    a=sorted(a[2:]);return {'avg':round(sum(a)/len(a),2),'p95':round(a[int(len(a)*.95)-1],2)}
V14SAVE={'dinoColossus_Diff':'hard','dinoColossus_Best':'5000','dinoColossus_Best_easy':'1200','dinoColossus_Best_medium':'2500','dinoColossus_Best_hard':'4321',
 'dinoColossus_Top10_easy':json.dumps([{'i':'LEO','s':1200,'sec':6,'v':0,'dn':1,'t':1}]),'dinoColossus_Top10_medium':json.dumps([{'i':'LEO','s':2500,'sec':9,'v':0,'dn':1,'t':2}]),
 'dinoColossus_Top10_hard':json.dumps([{'i':'DAD','s':4321,'sec':12,'v':0,'dn':2,'t':3},{'i':'LEO','s':900,'sec':4,'v':0,'dn':0,'t':4}]),
 'dinoColossus_Snd':'1','dinoColossus_Dino':'2','dinoColossus_Diamonds':'3','dinoColossus_Unlocks':json.dumps({'speed':1,'flame':1}),
 'dinoColossus_Stats':json.dumps({'eaten':40,'erupts':5}),'dinoColossus_Ini':'LEO','dinoColossus_Calm':'0','dinoColossus_DressStars':'4','dinoColossus_DressOwned':json.dumps(['lime']),'dinoColossus_DressOn':json.dumps({'c':'lime'})}
def run_save(d): return json.dumps({'diff':d,'pick':2,'score':900,'lives':2,'hearts':3,'bossN':2,'thrown':10,'eaten':30,'t':5})
def seed(pg,run):
    s=dict(V14SAVE);s['dinoColossus_Run']=run
    pg.evaluate('s=>{for(const k in s)localStorage[k]=s[k]}',s);pg.reload();pg.wait_for_timeout(500)
def shape(v):
    try: o=json.loads(v)
    except Exception: return 'str'
    if isinstance(o,dict): return 'obj:'+','.join(sorted(o.keys()))
    if isinstance(o,list): return 'list:'+(','.join(sorted(o[0].keys())) if o and isinstance(o[0],dict) else '')
    return type(o).__name__
BOT='''([steps,diff,shield])=>{const D=__dc;let hurts=0,deaths=0,maxSec=0,touch=0,bould=0,lastB=0,sil=0,alive=0,maxLittles=0,maxRangers=0;const was=new Set();let jh=0;
 keys.arrowright=true;
 for(let i=0;i<steps;i++){const G=D.G;if(!G.running||G.dying)break;const d=G.d;alive=i;if(shield){G.hearts=3;G.lives=3}
  const ahead=d.x+d.w/2+d.f*40,gap=D.groundTop(ahead)==null,en=[...G.littles,...G.rangers,...G.boulders].some(o=>o.x>d.x&&o.x-d.x<110&&Math.abs(o.y-d.y)<60);
  if(d.on&&!jh&&(gap||en||(G.boss&&!G.boss.gone&&Math.random()<.05))){jh=22}else if(d.on&&jh<=0&&keys[' ']){keys[' ']=false;jh=-1}if(jh>0){keys[' ']=true;jh--}else if(jh===0){keys[' ']=false;jh=-3}else if(jh<0){keys[' ']=false;jh++}
  const h0=G.hearts,l0=G.lives;update();if(G.hearts<h0||G.lives<l0)hurts++;if(G.lives<l0)deaths++;
  for(const o of [...G.littles,...G.rangers,...G.boulders]){const t=d.x<o.x+o.w&&d.x+d.w>o.x&&d.y<o.y+o.h&&d.y+d.h>o.y;if(t&&!was.has(o)){touch++;was.add(o)}else if(!t)was.delete(o)}
  if(G.boulders.length>lastB)bould+=G.boulders.length-lastB;lastB=G.boulders.length;
  const vis=a=>a.filter(o=>o.x>G.camX&&o.x<G.camX+VW).length;maxLittles=Math.max(maxLittles,vis(G.littles));maxRangers=Math.max(maxRangers,vis(G.rangers));
  maxSec=Math.max(maxSec,G.cur);if(G.sil&&G.sil.fx&&G.sil.fx.t>=G.sil.fx.T-1/60)sil++;
 }
 keys.arrowright=false;keys[' ']=false;return {diff,shield,secs:maxSec,survivedS:Math.round(alive/60),hurts,deaths,touches:touch,boulders:bould,maxLittlesOnScreen:maxLittles,maxRangersOnScreen:maxRangers,silly:sil}}'''
try:
 with sync_playwright() as p:
  b=p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
  # ---- save format: v14 save with all three difficulties + Continue on each diff ----
  cx=ctx(b);pg=pg_(cx);pg.goto(URL);pg.wait_for_timeout(400)
  snap=json.load(open(os.path.join(ROOT,'tests','save_format_v14.json')))
  for d in ['hard','medium','easy']:
    seed(pg,run_save(d))
    check(pg.evaluate("document.getElementById('best').textContent")=='4321','v14 hard best still shows 4321 (hard board kept)') if d=='hard' else None
    check(pg.evaluate("!document.getElementById('cont').classList.contains('hide')"),f'v14 Continue ({d}) shows CONTINUE')
    pg.click('#cont');pg.wait_for_timeout(400)
    g=pg.evaluate("({run:__dc.G.running,diff:__dc.G.diff,bossN:__dc.G.bossN,score:__dc.G.score,D:__dc.Dbase()})")
    check(g['run'] and g['diff']==d and g['bossN']==2 and g['score']==900 and g['D']=={'easy':1,'medium':2,'hard':8}[d],f'Continue keeps diff name {d} and plays at its new meaning D={g["D"]}')
    pg.evaluate("__dc.saveRun()")
    ls=pg.evaluate("({...localStorage})")
    check(shape(ls['dinoColossus_Run'])=='obj:'+','.join(sorted(snap['keys']['dinoColossus_Run']['fields'].keys())),f'Continue save written with same fields ({d})')
    extra=[k for k in ls if k.startswith('dinoColossus_') and k not in snap['keys'] and k not in ('dinoColossus_VolMusic','dinoColossus_VolSfx')]
    check(not extra,f'no new/renamed save keys ({d}) {extra}')
    check(all(shape(ls[k])==shape(V14SAVE[k]) for k in V14SAVE),f'all v14 keys keep their value shape ({d})')
    pg.evaluate("__dc.G.running=false")
  check(pg.evaluate("__dc.loadTop('hard').length")==2 and pg.evaluate("__dc.loadTop('easy')[0].s")==1200,'Top-10 boards per level name intact')
  check(not pg.errs,f'no console errors (save tests) {pg.errs}');cx.close()
  # ---- D values, ramp, boss scaling ----
  cx=ctx(b);pg=pg_(cx);pg.goto(URL);pg.wait_for_timeout(400)
  tab={}
  for d in ['easy','medium','hard']:
    pg.evaluate(f"localStorage.dinoColossus_Diff='{d}'");pg.reload();pg.wait_for_timeout(300);pg.click('#go');pg.wait_for_timeout(200)
    r=pg.evaluate('''()=>{const D=__dc,o={};o.D=D.Dbase();o.ramp=[1,2,3,4,5,6,10].map(n=>+D.Dx(n).toFixed(3));o.hp1=D.bossHP(1);o.hp20=D.bossHP(20);o.spd1=+D.bossSpd(1).toFixed(3);o.thr=D.thrCfg();
      o.lv=[1,3,5].map(n=>{const x=D.Dx(n);return {n,Dx:+x.toFixed(2),littles:Math.min(24,Math.round((5+Math.min(6,n))*D.DK.rate(x))),rangers:Math.min(12,Math.round(Math.min(5,1+(n>>1))*D.DK.rate(x))),enemySpd:+D.DK.spd(x).toFixed(2),boulderGap:+((8-Math.min(3,n*.3))/D.DK.rate(x)).toFixed(2),badChance:+D.DK.bad(x).toFixed(2),pit:+((.22+Math.min(1,n/8)*.1)*Math.min(1.25,Math.pow(x,.1))).toFixed(3)}});return o}''')
    tab[d]=r
  print('DIFF TABLE',json.dumps(tab))
  check([tab[d]['D'] for d in ['easy','medium','hard']]==[1,2,8],'D multiplier = 1 / 2 / 8')
  check(tab['easy']['hp1']==7 and abs(tab['easy']['spd1']-1.15)<1e-6 and tab['easy']['thr']=={'every':2.3,'T':64},'new Easy boss = old v14 Hard boss (HP 7, speed 1.15, throw every 2.3 s)')
  for d in tab:
    rp=tab[d]['ramp'];check(rp[0]<rp[1]<rp[2]<rp[3]<rp[4] and rp[5]==rp[0] and rp[6]==rp[4],f'{d}: ramp climbs toward boss (sections 1..5) and resets after boss {rp}')
  check(tab['easy']['hp1']<tab['medium']['hp1']<tab['hard']['hp1'] and tab['easy']['spd1']<tab['medium']['spd1']<tab['hard']['spd1'],'boss HP + speed grow easy<medium<hard')
  check(all(tab[d]['hp1']<tab[d]['hp20'] for d in tab),'bosses still get harder boss by boss')
  check(tab['hard']['thr']['T']>=40 and tab['hard']['thr']['every']>=.9 and tab['hard']['lv'][2]['enemySpd']<=1.7,'Hard caps keep reaction windows (throw >=0.67 s air, every >=0.9 s, enemy speed <=1.7x)')
  check(not pg.errs,f'no console errors {pg.errs}');cx.close()
  # ---- silly human: hard only; effects; safety; Calm ----
  cx=ctx(b);pg=pg_(cx)
  pg.add_init_script("window.__starts=0;const _o=AudioBufferSourceNode.prototype.start;AudioBufferSourceNode.prototype.start=function(){if(!(this.context instanceof OfflineAudioContext))window.__starts++;return _o.apply(this,arguments)}")
  pg.goto(URL);pg.wait_for_timeout(300)
  for d in ['easy','medium']:
    pg.evaluate(f"localStorage.dinoColossus_Diff='{d}'");pg.reload();pg.wait_for_timeout(300)
    if d=='easy': check(pg.evaluate('__starts')==0,'no sound before the first tap')
    pg.click('#go');pg.wait_for_timeout(200)
    n=pg.evaluate("()=>{const G=__dc.G;for(let i=0;i<60*120;i++){G.hearts=3;G.inv=10;update();if(G.sil)return 'sil'}return 0}")
    check(n==0,f'{d}: no silly human in 2 min of play')
  pg.evaluate("localStorage.dinoColossus_Diff='hard'");pg.reload();pg.wait_for_timeout(300);pg.click('#go');pg.wait_for_timeout(2500)
  src=pg.evaluate('({...VIS.SRC})');check(all(src.get(k)=='file' for k in SIL),f'silly CC0 files load after first tap {[src.get(k) for k in SIL]}')
  cnt=pg.evaluate("()=>{const G=__dc.G;let n=0,first=null;for(let i=0;i<60*120;i++){G.hearts=3;G.inv=10;update();if(G.sil&&G.sil.warn>0&&first==null)first=G.el}return {n:G.sil?G.sil.n:0,first}}")
  check(cnt['n']>=3 and cnt['first'] and 19<cnt['first']<40,f'hard: silly human appears every ~20-35 s ({cnt})')
  # warning shot + each effect + safety
  pg.evaluate("()=>{const G=__dc.G;G.boulders=[];G.banner=null;G.secBanner=null;__dc.sillyStart('stink')}");pg.wait_for_timeout(300)
  check(pg.evaluate('__dc.G.sil.warn>0.5'),'warning shows first (>=1 s telegraph)');pg.screenshot(path=SHOTS+'/hard-warning.png')
  pg.wait_for_timeout(1100);
  # stink: hold right -> no sideways move; jump works
  r=pg.evaluate('''async()=>{const G=__dc.G,d=G.d;keys.arrowright=true;const x0=d.x;await new Promise(r=>setTimeout(r,500));const moved=d.x-x0;keys[' ']=true;await new Promise(r=>setTimeout(r,150));const jumped=d.vy<0||!d.on;keys[' ']=false;keys.arrowright=false;return {k:G.sil.fx&&G.sil.fx.k,moved,jumped}}''')
  check(r['k']=='stink' and abs(r['moved'])<1 and r['jumped'],f'stink cloud stops running but jump works {r}')
  pg.screenshot(path=SHOTS+'/hard-stink.png')
  for k in ['bubble','pogo']:
    pg.evaluate(f"()=>{{const G=__dc.G;G.sil.fx=null;G.sil.warn=0;__dc.sillyStart('{k}');G.sil.warn=.01}}");pg.wait_for_timeout(700)
    check(pg.evaluate(f"__dc.G.sil.fx&&__dc.G.sil.fx.k=='{k}'"),f'{k} effect runs');pg.screenshot(path=SHOTS+f'/hard-{k}.png')
  # safety sim: start each effect many times over random spots incl. pits; count hurts caused (no enemies)
  saf=pg.evaluate('''()=>{const D=__dc,G=D.G,res={};for(const k of ['stink','bubble','pogo']){let hurts=0,lowest=0,inv=0;for(let t=0;t<40;t++){G.littles=[];G.rangers=[];G.boulders=[];G.meteors=[];G.lava=[];G.ch=null;G.chT=99;G.hit=0;G.inv=0;
   const s=G.secs[G.secs.length-2]||G.secs[0];const p=s.pits[t%Math.max(1,s.pits.length)];const d=G.d;if(p){d.x=p.x-d.w-2+(t%3)*10;d.y=GY-d.h-80}d.vy=0;G.camX=Math.max(0,d.x-200);
   D.sillyStart(k);G.sil.warn=1/60;const h=G.hearts+G.lives*10;for(let i=0;i<60*5;i++){G.littles=[];G.rangers=[];G.boulders=[];keys.arrowright=(t%2==0)&&!!(G.sil&&(G.sil.fx||G.sil.warn>0));update()}keys.arrowright=false;if(G.hearts+G.lives*10<h)hurts++;if(k=='bubble'&&G.inv>0)inv++;G.hearts=3;G.lives=3}res[k]=hurts}return res}''')
  check(all(v==0 for v in saf.values()),f'effects never hurt by themselves, even next to pits (40 tries each) {saf}')
  # Calm halves
  pg.evaluate("VIS.setCalm(true)");dur=pg.evaluate("()=>{const G=__dc.G;G.sil.fx=null;__dc.sillyStart('pogo');G.sil.warn=1/60;__dc.sillyUpd(G.d);return G.sil.fx.T}")
  check(abs(dur-1.0)<.01,f'Calm halves effect time (pogo 2 s -> {dur} s)');pg.evaluate("__dc.G.sil.fx.t=1");pg.wait_for_timeout(200);pg.screenshot(path=SHOTS+'/hard-calm-pogo.png');pg.evaluate("VIS.setCalm(false)")
  pg.click('#snd');check(pg.evaluate("localStorage.dinoColossus_Snd")=='0','mute still works');pg.click('#snd')
  check(not pg.errs,f'no console errors (hard + effects) {pg.errs}');cx.close()
  # ---- fallback: missing / broken silly files -> generated sound ----
  for mode in ['missing','broken']:
    cx=ctx(b,service_workers='block');pg=pg_(cx)
    pg.route('**/sounds/silly-*.ogg',lambda r:r.fulfill(status=404) if mode=='missing' else r.fulfill(status=200,body=b'not audio',content_type='audio/ogg'))
    pg.goto(URL);pg.wait_for_timeout(300);pg.click('#go');pg.wait_for_timeout(2500)
    src=pg.evaluate('({...VIS.SRC})');check(all(src.get(k)=='synth' for k in SIL) and pg.evaluate("['toot','boing','whoosh','pop','warn'].every(k=>!!VIS.BUF[k])"),f'generated silly sounds take over when files are {mode}')
    cx.close()
  # ---- offline: silly files cached ----
  cx=ctx(b);pg=pg_(cx);pg.goto(URL);pg.wait_for_function("navigator.serviceWorker.ready.then(()=>1)");pg.wait_for_timeout(3000)
  cached=pg.evaluate(("caches.open('dinocol-v"+_VER+"').then(c=>Promise.all(%s.map(f=>c.match('sounds/silly-'+f+'.ogg').then(r=>!!r))))")%json.dumps(SIL))
  check(all(cached),f'silly files in SW cache v15 {cached}')
  cx.set_offline(True);pg.reload();pg.wait_for_timeout(800);pg.evaluate("localStorage.dinoColossus_Diff='hard'");pg.click('#go');pg.wait_for_timeout(2500)
  src=pg.evaluate('({...VIS.SRC})');check(all(src.get(k)=='file' for k in SIL),'silly files load offline');cx.close()
  # ---- menu + sizes + boss approach + frame timing ----
  perf={}
  for (w,h,dpr,tag) in [(915,412,1,''),(740,360,1,'_740'),(892,411,3.5,'_892')]:
    cx=ctx(b,w,h,dpr);pg=pg_(cx);pg.goto(URL);pg.wait_for_timeout(500)
    if tag!='_892': pg.screenshot(path=SHOTS+f'/menu{tag}.png')
    ver=pg.inner_text('#ver');check(('v'+_VER) in ver and 'Beethoven' in ver,f'{w}x{h}: menu shows v15 + Beethoven credit')
    for d in ['easy','medium','hard']:
      pg.evaluate(f"localStorage.dinoColossus_Diff='{d}'");pg.reload();pg.wait_for_timeout(300);pg.click('#go');pg.wait_for_timeout(200)
      # jump to section 5 (boss approach)
      pg.evaluate("()=>{const G=__dc.G;let x=0;for(let i=1;i<5;i++)x+=3000;__dc.genSection(3,6000);__dc.genSection(4,9000);__dc.genSection(5,12000);__dc.genSection(6,15000);G.d.x=12100;G.d.y=GY-80;G.camX=12100-300;G.lastSafe={x:12100,y:GY-40}}")
      pg.wait_for_timeout(700)
      if tag!='_892': pg.screenshot(path=SHOTS+f'/boss-approach-{d}{tag}.png')
      if d=='hard':
        pg.dispatch_event('#br','pointerdown',{'pointerType':'touch'});pg.evaluate("__dc.sillyStart('bubble')");r=frames(pg,3000);pg.dispatch_event('#br','pointerup')
        perf[f'{w}x{h} dpr{dpr} hard+effect']=st(r)
        if tag=='_740':
          pg.evaluate("__dc.sillyStart('bubble')");pg.wait_for_timeout(300);pg.screenshot(path=SHOTS+'/hard-warning_740.png');pg.wait_for_timeout(1300);pg.screenshot(path=SHOTS+'/hard-bubble_740.png');pg.wait_for_timeout(3000)
          for k in ['stink','pogo']: pg.evaluate(f"__dc.sillyStart('{k}')");pg.wait_for_timeout(1500);pg.screenshot(path=SHOTS+f'/hard-{k}_740.png');pg.wait_for_timeout(2500)
      pg.evaluate("__dc.G.running=false")
    check(pg.evaluate("document.getElementById('c').width")<=w*1.01+1 or dpr>1,f'{w}x{h} canvas ok')
    check(not pg.errs,f'{w}x{h} dpr{dpr}: no console errors {pg.errs}');cx.close()
  print('PERF',json.dumps(perf))
  for k,v in perf.items(): check(v['avg']<20,f'frame timing {k} avg {v["avg"]} ms p95 {v["p95"]}')
  # ---- shop (new items) + Options volume ----
  cx=ctx(b);pg=pg_(cx);pg.goto(URL);pg.wait_for_timeout(300)
  seed(pg,run_save('easy'))
  check(pg.evaluate("VIS.owned().includes('lime')&&VIS.on.c==='lime'&&VIS.stars===4"),'v14 save: owned lime + worn + 4 stars kept')
  n=pg.evaluate("VIS.COLORS.length+VIS.HATS.length+VIS.GLASSES.length+VIS.BACKS.length+VIS.TRAILS.length+VIS.PETS.length-(8+7+4)-3")
  check(15<=n<=25,f'{n} new shop items (target 15-25)')
  check(pg.evaluate("Object.values(VIS.TABS).flat().filter(i=>i.cost>0).every(i=>i.cost>=2&&i.cost<=8)"),'all prices 2-8 stars')
  pg.tap('#dressb');pg.tap('#dtabs button[data-t=p]');pg.wait_for_timeout(200)
  pg.tap('#dgrid button[data-id=babydino]');check(pg.evaluate("!VIS.owned().includes('babydino')&&VIS.stars===4") and 'Need' in pg.inner_text('#dmsg'),'too few stars: baby dino (7) refused')
  pg.tap('#dgrid button[data-id=chick]');check(pg.evaluate("VIS.owned().includes('chick')&&VIS.on.p==='chick'&&VIS.stars===1"),'chick bought for 3 stars and worn')
  pg.evaluate("VIS.stars=40");pg.tap('#dtabs button[data-t=k]');pg.tap('#dgrid button[data-id=cape]');pg.tap('#dtabs button[data-t=r]');pg.tap('#dgrid button[data-id=rainbow]')
  pg.tap('#dtabs button[data-t=c]');pg.tap('#dgrid button[data-id=galaxy]');pg.wait_for_timeout(300);pg.screenshot(path=SHOTS+'/shop-colors.png')
  for t in ['h','g','k','r','p']:
    pg.tap(f'#dtabs button[data-t={t}]');pg.wait_for_timeout(250);pg.screenshot(path=SHOTS+f'/shop-{t}.png')
  pg.tap('#dressx');pg.reload();pg.wait_for_timeout(400)
  on=pg.evaluate("({...VIS.on})");check(on.get('p')=='chick' and on.get('k')=='cape' and on.get('r')=='rainbow' and on.get('c')=='galaxy' and pg.evaluate("VIS.owned().includes('lime')"),f'new items persist after reload (old lime still owned) {on}')
  ls=pg.evaluate("({...localStorage})");check(isinstance(json.loads(ls['dinoColossus_DressOwned']),list) and isinstance(json.loads(ls['dinoColossus_DressOn']),dict),'DressOwned stays a list, DressOn stays an object')
  check(pg.evaluate("localStorage.dinoColossus_VolMusic===undefined&&localStorage.dinoColossus_VolSfx===undefined"),'no volume keys written until a slider moves')
  pg.click('#go');pg.wait_for_timeout(1500);v=pg.evaluate("VIS.vol()")
  print('VOL default',v);check(v['music']==1 and abs(v['sfx']-.4)<1e-9 and abs(v['sfxBus']/v['musicBus']-.4)<1e-6,f"default buses: music {v['musicBus']} > effects {v['sfxBus']} (40%)")
  pg.evaluate("__dc.G.d.vx=3");pg.wait_for_timeout(600);pg.screenshot(path=SHOTS+'/dressed-in-game.png')
  # measure real output: render a level meter on the master path
  lv=pg.evaluate("""async()=>{const a=ac(),an=a.createAnalyser();an.fftSize=2048;const sb=VIS.sfxOut();const out=sb.context.destination;
   const mb=[];sb.connect(an);const d=new Float32Array(2048);let pk=0;for(let i=0;i<20;i++){VIS.play('boing');await new Promise(r=>setTimeout(r,60));an.getFloatTimeDomainData(d);for(const x of d)pk=Math.max(pk,Math.abs(x))}sb.disconnect(an);return {sfxPeakAfterBus:+pk.toFixed(3)}}""")
  print('LEVEL',lv)
  pg.click('#menub') if pg.is_visible('#menub') else None
  pg.evaluate("__dc.G.running=false");pg.reload();pg.wait_for_timeout(300)
  pg.tap('#optb');check(pg.is_visible('#volm') and pg.is_visible('#vols'),'Options opens with two sliders');pg.screenshot(path=SHOTS+'/options.png')
  pg.fill('#volm','70');pg.fill('#vols','25');pg.dispatch_event('#vols','change')
  check(pg.evaluate("localStorage.dinoColossus_VolMusic==='0.7'&&localStorage.dinoColossus_VolSfx==='0.25'"),'sliders save to new keys VolMusic / VolSfx')
  pg.tap('#optx');pg.reload();pg.wait_for_timeout(300);pg.tap('#optb');check(pg.input_value('#volm')=='70' and pg.input_value('#vols')=='25','slider values load back after reload')
  pg.tap('#optx');pg.click('#go');pg.wait_for_timeout(800);v=pg.evaluate("VIS.vol()");check(abs(v['musicBus']-.35)<1e-6 and abs(v['sfxBus']-.125)<1e-6,f'buses follow sliders {v}')
  pg.click('#snd');pg.wait_for_timeout(300);check(pg.evaluate("VIS.mKey") is None and pg.evaluate("localStorage.dinoColossus_Snd")=='0','mute still silences music (same key)');pg.click('#snd')
  pg.evaluate("VIS.setCalm(true)");check(pg.evaluate("VIS.calm"),'Calm still works');pg.evaluate("VIS.setCalm(false)")
  for (w,h) in [(740,360),(892,411)]:
    pg.set_viewport_size({'width':w,'height':h});pg.evaluate("__dc.G.running=false");pg.reload();pg.wait_for_timeout(300)
    pg.tap('#dressb');pg.tap('#dtabs button[data-t=p]');pg.wait_for_timeout(200)
    fit=pg.evaluate("(()=>{const r=document.getElementById('dressx').getBoundingClientRect(),g=[...document.querySelectorAll('#dgrid button')].every(b=>b.getBoundingClientRect().height>=44);return r.bottom<=innerHeight&&r.right<=innerWidth&&g})()")
    check(fit,f'{w}x{h}: shop fits, Done visible, item buttons >=44px')
    if w==740: pg.screenshot(path=SHOTS+'/shop-p_740.png')
    pg.tap('#dressx');pg.tap('#optb');fit=pg.evaluate("document.getElementById('optx').getBoundingClientRect().bottom<=innerHeight");check(fit,f'{w}x{h}: Options fits');
    if w==740: pg.screenshot(path=SHOTS+'/options_740.png')
    pg.tap('#optx')
  check(not pg.errs,f'no console errors (shop/options) {pg.errs}');cx.close()
  # ---- balance: simple scripted bot (runs right, jumps at gaps/enemies). 3 runs each: real hearts, and a shielded run (counts threats) ----
  cx=ctx(b);pg=pg_(cx);pg.goto(URL);pg.wait_for_timeout(300);bal={}
  for d in ['easy','medium','hard']:
    rs=[]
    for t in range(4):
      pg.evaluate(f"localStorage.dinoColossus_Diff='{d}'");pg.reload();pg.wait_for_timeout(300);pg.click('#go');pg.wait_for_timeout(100)
      rs.append(pg.evaluate(BOT,[60*240,d,t==3]))
    bal[d]=rs
  print('BALANCE',json.dumps(bal))
  real=lambda d,k:sum(r[k] for r in bal[d][:3])/3
  sh=lambda d,k:bal[d][3][k]
  allr=lambda d,k:sum(r[k] for r in bal[d])/4
  bpm=lambda d:sum(r['boulders'] for r in bal[d])/max(1,sum(r['survivedS'] for r in bal[d]))*60
  check(allr('easy','maxLittlesOnScreen')<allr('hard','maxLittlesOnScreen'),f"more enemies on screen on Hard (avg max {allr('easy','maxLittlesOnScreen'):.1f} easy / {allr('medium','maxLittlesOnScreen'):.1f} medium / {allr('hard','maxLittlesOnScreen'):.1f} hard)")
  check(bpm('easy')<bpm('hard'),f"more boulders per minute on Hard ({bpm('easy'):.1f} / {bpm('medium'):.1f} / {bpm('hard'):.1f})")
  check(max(r['secs'] for r in bal['hard'])>=2,f"Hard is passable: simple bot got past section 1 on Hard (best section {max(r['secs'] for r in bal['hard'])})")
  check(not pg.errs,f'no console errors (balance) {pg.errs}');cx.close()
finally:
  srv.terminate()
print(f'{passes} passed, {len(fails)} failed');[print(' -',f) for f in fails];sys.exit(1 if fails else 0)

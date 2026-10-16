'use strict';
// Original chunky pixel sprites (drawn on canvas, no external assets)
const SPR={};
function mkSpr(rows,pal){const h=rows.length,w=rows[0].length,c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');
 for(let j=0;j<h;j++)for(let i=0;i<w;i++){const ch=rows[j][i];if(ch!=='.'&&pal[ch]){x.fillStyle=pal[ch];x.fillRect(i,j,1,1)}}return c}
const CARN_A=["........GGGGG...",".......GGGGGGGG.",".......GGWKGGGG.",".......GGGGGGGG.",".......GGGGTTTT.",".......GGGGGGG..","G.....GGGGGG....","GG...GGGGGGGLL..","GGG.GGGGGGGG..L.",".GGGGGGGBBGG....","..GGGGGGBBBG....","...GGGGGBBGG....","....GGGGGGG.....","....GG...GG.....","....GG...GG.....","...DDD..DDD....."];
const CARN_B=CARN_A.slice(0,13).concat(["....GG..GG......","...GG....GG.....","..DDD....DDD...."]);
const HERB_A=["...........GGG..","..........GGWKG.","..........GGGGG.","..........GGG...",".........GGG....",".........GG.....","........GGG.....","..GGGGGGGGG.....",".GGGGGGGGGG.....","GGGGBBBBGGGG....","G.GGBBBBGGGG....","..GGGGGGGGGG....","...GG....GG.....","...GG....GG.....","..DDD...DDD.....","................"];
const HERB_B=HERB_A.slice(0,12).concat(["...GG.....GG....","..GG.......GG...",".DDD.......DDD..","................"]);
const PERSON=[".HHHHH..","HHHHHHH.","HHSSSSH.",".HSKSK..","..SSSS..","...SS...",".CCCCS..","SCCWCCS.",".CCCCC..",".CWCCW..","..S..S..",".SS..SS."];
const PERSON_B=PERSON.slice(0,10).concat([".S....S.","SS....SS"]);
const LITTLE=["....MMMM....","..MMMMMMMM..",".MMWKMMKWMM.","MMMWWMMWWMMM","MMMMMMMMMMMM","MMMTTTTTTMMM",".MMMMMMMMMM.","...LLLLLL...","..DDD..DDD..",".DDDD..DDDD."];
const LITTLE_B=LITTLE.slice(0,8).concat([".DDD....DDD.","DDDD....DDDD"]);
const RANGER=[".HHHHHH.","HHHHHHHH","HHSSSSHH","H.SKSK.H","..HHHH..",".HHHHHH.","SYYYWYYS","S.YYYY.S","..YWYY..","..YYYY..","..S..S..",".SS..SS."];
const PTERO=["......KK............",".....PPPP...........","....PPWKPPPPYYYY....","PP..PPPPPP..........",".PPPPPPPPPPPPPP...PP","..PPPPPPPPPPPPPPPPP.","....PPPPPPPPPPPPP...","......PPPPPPP.......",".......D...D........"];
const PTERO_B=["......KK............",".....PPPP...........","....PPWKPPPPYYYY....","....PPPPPP..........","...PPPPPPPPPP.......","..PPPPPPPPPPPPP.....",".PPPPPPPPPPPPPPPP...","PPP...PPPPPP..PPP...",".......D...D........"];
const BOULDER=["..KKKK..",".KGGGGK.","KGGWGGGK","KGGGGGGK","KGGGGLGK","KGGGLLGK",".KGGGGK.","..KKKK.."];
const GEM=["..CCC..",".CWCCC.","CWCCCCC","CCCCCCB",".CCCCB.","..CCB..","...B..."];
const HEART=[".RR.RR.","RRRRRRR","RRRRRRR",".RRRRR.","..RRR..","...R..."];
const PELLET=["..Y..",".YWY.","YWWWY",".YWY.","..Y.."];
const CHUTE=["..RRRWW..",".RRRWWWR.","RRWWWRRRR","K...K...K",".K..K..K.","..K.K.K.."];
const METEOR=["....OOO.","...OYYYO","..OYYWYO",".OOYYYYO","OOOOYYO.","OO.OOO..","O..O....",".O......"];
const STAR=["...Y...","..YYY..","YYYYYYY",".YYYYY.","..Y.Y..",".Y...Y."];
const FLAME=["..Y.....",".YOY..Y.","YOROY.YO",".ORRROOR","..ORRRR.","...OOO.."];
const PORTAL=["..PPPP..",".PMMMMP.","PMKKKKMP","PMKWWKMP","PMKWWKMP","PMKKKKMP",".PMMMMP.","..PPPP.."];
const BASE={W:'#ffffff',K:'#000000',T:'#ffffff',D:'#3b2a1a'};
const DINO_PAL=[{G:'#3cb043',B:'#b6f28b',L:'#2e8b3a'},{G:'#3a7bd5',B:'#a8d8ff',L:'#285ca8'},{G:'#e75ca6',B:'#ffc4e1',L:'#b8437f'},{G:'#2fa58f',B:'#aef0dc',L:'#1f7b69'},{G:'#e8b923',B:'#fff1a6',L:'#b38b10'},{G:'#8e5ad6',B:'#d9c2ff',L:'#6a3fb0'}];
const PPL_PAL=[{H:'#5a3a1a',S:'#f6c89f',C:'#e08a2e',W:'#5a3a1a'},{H:'#f2c94c',S:'#ffd9b8',C:'#a0522d',W:'#f5deb3'},{H:'#111111',S:'#c68642',C:'#d2a35b',W:'#6b4423'},{H:'#b5651d',S:'#f1c27d',C:'#8b5a2b',W:'#e3c08d'},{H:'#9e9e9e',S:'#ffdbac',C:'#c97b2e',W:'#3e2723'},{H:'#d84315',S:'#ffe0bd',C:'#b8860b',W:'#fff3e0'}];
function buildSprites(){
 SPR.dino=DINO_PAL.map((p,i)=>{const pal={...BASE,...p},carn=i<3;return [mkSpr(carn?CARN_A:HERB_A,pal),mkSpr(carn?CARN_B:HERB_B,pal)]});
 const rp={...BASE,G:'#ff7a1a',B:'#ffd0a1',L:'#c2560c'};SPR.rival=[mkSpr(CARN_A,rp),mkSpr(CARN_B,rp)];
 SPR.bossBronto=[mkSpr(HERB_A,{...BASE,G:'#6d8fa8',B:'#c9dbe8',L:'#4d6b80'}),mkSpr(HERB_B,{...BASE,G:'#6d8fa8',B:'#c9dbe8',L:'#4d6b80'})];
 SPR.bossRex=[mkSpr(CARN_A,{...BASE,G:'#c62828',B:'#ffab91',L:'#8e1c1c'}),mkSpr(CARN_B,{...BASE,G:'#c62828',B:'#ffab91',L:'#8e1c1c'})];
 const pp={...BASE,P:'#8d6e63',Y:'#ffb300',D:'#5d4037'};SPR.ptero=[mkSpr(PTERO,pp),mkSpr(PTERO_B,pp)];
 SPR.person=PPL_PAL.map(p=>[mkSpr(PERSON,{...BASE,...p}),mkSpr(PERSON_B,{...BASE,...p})]);
 const lp={...BASE,M:'#8b4513',L:'#f4a460',D:'#3b2a1a',T:'#ffffff'};SPR.little=[mkSpr(LITTLE,lp),mkSpr(LITTLE_B,lp)];
 SPR.ranger=mkSpr(RANGER,{...BASE,H:'#3e2723',S:'#d7a26b',Y:'#7a5230',W:'#c9a46b'});
 SPR.boulder=mkSpr(BOULDER,{K:'#3e2723',G:'#8d8d8d',W:'#cfcfcf',L:'#5e5e5e'});
 SPR.gem=mkSpr(GEM,{C:'#4dd0e1',W:'#e0ffff',B:'#00838f'});SPR.heart=mkSpr(HEART,{R:'#e53935'});SPR.pellet=mkSpr(PELLET,{Y:'#ffeb3b',W:'#ffffff'});
 SPR.chute=mkSpr(CHUTE,{R:'#e53935',W:'#ffffff',K:'#333333'});SPR.meteor=mkSpr(METEOR,{O:'#e65100',Y:'#ffca28',W:'#fff8e1'});
 SPR.star=mkSpr(STAR,{Y:'#ffeb3b'});SPR.flame=mkSpr(FLAME,{Y:'#ffeb3b',O:'#ff9800',R:'#e53935'});SPR.portal=mkSpr(PORTAL,{P:'#7b1fa2',M:'#ba68c8',K:'#311b92',W:'#e1bee7'})}
const FERN=["....G.....G..","..G.G...G.G..","...GGG.GGG...","G..GG.G.GG..G",".GG.GGGGG.GG.","..GGGGGGGGG..","....GGGGG....","......D......"];
const CYCAD=["G....GG....G",".GG..GG..GG.","..GGGGGGGG..","GGG.GGGG.GGG","...GGDDGG...",".....DD.....",".....DB.....",".....BD.....",".....DB.....",".....BD.....","....DDDD...."];
const SHROOM=["....RRRRRR....","..RRWRRRRWRR..",".RRRRRRWRRRRR.","RRWRRRRRRRRWRR","RRRRRRRRRRRRRR","....SSSSSS....",".....SSSS.....",".....SSSS.....",".....SSSS.....","....SSSSSS...."];
const HUT=["......BB......",".....BYYB.....","....BYYYYB....","...BYYYYYYB...","..BYYYYYYYYB..",".BYYYYYYYYYYB.","BBBBBBBBBBBBBB","..WWWWWWWWWW..","..WWWKKKWWWW..","..WWWKKKWWWW..","..WWWKKKWWWW.."];
const FIRE=["...Y....","..YOY.Y.",".YORY.YO","..ORROR.",".WDWDWD.","DWDWDWDW"];
const BONE=["WW....WW","WWWWWWWW","WW....WW"];
const CAVE=["...SSSSSS...","..SSKKKKSS..",".SSKKKKKKSS.","SSKKKKKKKKSS","SKKKKKKKKKKS","SKKKKKKKKKKS"];
function buildDeco(){SPR.fern=mkSpr(FERN,{G:'#2e9d3a',D:'#5d4037'});SPR.cycad=mkSpr(CYCAD,{G:'#3fae49',D:'#6d4c2e',B:'#8d6e48'});SPR.shroom=mkSpr(SHROOM,{R:'#d84343',W:'#ffffff',S:'#f3e5c8'});SPR.hut=mkSpr(HUT,{B:'#6d4c2e',Y:'#d9b26a',W:'#a1887f',K:'#3e2723'});SPR.fire=mkSpr(FIRE,{Y:'#ffeb3b',O:'#ff9800',R:'#e53935',W:'#8d6e63',D:'#5d4037'});SPR.bone=mkSpr(BONE,{W:'#f5f0e1'});SPR.cave=mkSpr(CAVE,{S:'#6d6d6d',K:'#111111'})}
buildSprites();buildDeco();
function spr(c,x,y,s,flip){ctx.save();ctx.imageSmoothingEnabled=false;if(flip){ctx.translate(x+c.width*s,y);ctx.scale(-1,1);ctx.drawImage(c,0,0,c.width*s,c.height*s)}else ctx.drawImage(c,x,y,c.width*s,c.height*s);ctx.restore()}

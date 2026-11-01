# Dino Colossus app icons, own-made (v26). Draws the game's own CARN_A pixel dino from sprites.js
# (original pixel art made for this game, no outside files) on sky + grass + dirt.
# Run: python3 tools/make_icons.py [outdir]   (needs Pillow)
import re,sys,os
from PIL import Image,ImageDraw
here=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src=open(os.path.join(here,'sprites.js')).read()
rows=eval(re.search(r'const CARN_A=(\[.*?\]);',src).group(1))
PAL={'G':(60,176,67),'W':(255,255,255),'K':(0,0,0),'T':(255,255,255),'B':(182,242,139),'L':(46,139,58),'D':(59,42,26)}
SKY,GRASS,DIRT=(92,148,252),(90,158,47),(160,97,44)
def icon(w,scale,x0,y0):
    im=Image.new('RGB',(w,w),SKY);d=ImageDraw.Draw(im);gy=int(w*.82)
    d.rectangle([0,gy,w-1,gy+w//32],fill=GRASS);d.rectangle([0,gy+w//32+1,w-1,w-1],fill=DIRT)
    for j,r in enumerate(rows):
        for i,c in enumerate(r):
            if c in PAL:d.rectangle([x0+i*scale,y0+j*scale,x0+(i+1)*scale-1,y0+(j+1)*scale-1],fill=PAL[c])
    return im
out=sys.argv[1] if len(sys.argv)>1 else os.path.join(here,'icons')
for name,args in {'icon-512':(512,27,40,20),'icon-192':(192,10,16,9),'maskable-512':(512,19,100,80)}.items():
    icon(*args).save(os.path.join(out,name+'.png'),optimize=True)

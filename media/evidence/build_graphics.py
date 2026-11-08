from PIL import Image, ImageDraw, ImageFont, ImageEnhance
from pathlib import Path
import math
R=Path('/mnt/data/open-pixel-studio-media');A=R/'images';P=R/'projects'
BLACK='#101012';BG='#18191b';RED='#e04a48';GREEN='#83bc8d';WHITE='#f5f1ed';MUTED='#9f9d9c'
FONT='/usr/share/fonts/truetype/lato/Lato-Heavy.ttf';REG='/usr/share/fonts/truetype/lato/Lato-Regular.ttf';MONO='/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'
font=lambda n,b=True:ImageFont.truetype(FONT if b else REG,n)
mono=lambda n:ImageFont.truetype(MONO,n)
app=Image.open(A/'09-slime-timeline.png').convert('RGB')
sword=Image.open(P/'Ember-Blade-frame-01.png').convert('RGBA')
art_names=['Ember-Blade','Crimson-Toadstool','Azure-Potion','Iron-Guardian','Moss-Slime']
arts=[Image.open(P/(n+'-frame-01.png')).convert('RGBA') for n in art_names]

def canvas(w,h):return Image.new('RGB',(w,h),BLACK)
def label(draw,xy,t,size=24,color=MUTED,bold=False):draw.text(xy,t,font=font(size,bold),fill=color)
def brand(d,x,y,sz=20):
 d.rectangle((x,y+4,x+18,y+22),fill=RED);d.rectangle((x+10,y+14,x+28,y+32),fill=RED)
 label(d,(x+42,y),'LUMINARY LABS',sz,WHITE,True)

def framed(img, source, box, border='#454545'):
 x,y,w,h=box
 src=source.copy()
 src.thumbnail((w-8,h-8),Image.Resampling.LANCZOS)
 d=ImageDraw.Draw(img)
 d.rectangle((x,y,x+w,y+h),fill='#252629',outline=border,width=2)
 img.paste(src,(x+(w-src.width)//2,y+(h-src.height)//2))

def sprite(img,art,x,y,size):
 a=art.resize((size,size),Image.Resampling.NEAREST)
 img.paste(a,(x,y),a)

def stripes(d,w,h):
 d.rectangle((0,0,10,h),fill=RED)
 d.rectangle((0,h-7,w,h),fill=GREEN)

def main_cover():
 w,h=630,500;i=canvas(w,h);d=ImageDraw.Draw(i);stripes(d,w,h)
 label(d,(33,12),'OPEN PIXEL',49,WHITE,True);label(d,(33,68),'STUDIO',49,RED,True)
 label(d,(410,99),'BY LUMINARY LABS',13,GREEN,True)
 framed(i,app,(20,142,590,330))
 i.save(A/'Open-Pixel-Studio-Itch-Cover-630x500.png',optimize=True)

def hero():
 w,h=1920,1080;i=canvas(w,h);d=ImageDraw.Draw(i);stripes(d,w,h)
 d.rectangle((610,0,620,h-7),fill='#29292b')
 label(d,(74,144),'OPEN',104,WHITE,True)
 label(d,(74,265),'PIXEL',104,WHITE,True)
 label(d,(74,386),'STUDIO',104,RED,True)
 d.rectangle((77,570,163,578),fill=GREEN)
 label(d,(74,624),'PIXEL ART.',38,WHITE,True)
 label(d,(74,676),'FRAME ANIMATION.',38,WHITE,True)
 label(d,(74,728),'FOCUSED WORKSPACE.',38,WHITE,True)
 brand(d,74,947,24)
 framed(i,app,(655,150,1200,680),border='#5d5d5d')
 for j,a in enumerate(arts):sprite(i,a,725+j*212,849,150)
 i.save(A/'Open-Pixel-Studio-Hero-1920x1080.png',optimize=True)

def square():
 w,h=1080,1080;i=canvas(w,h);d=ImageDraw.Draw(i);stripes(d,w,h)
 label(d,(70,74),'OPEN PIXEL',84,WHITE,True)
 label(d,(70,170),'STUDIO',84,RED,True)
 framed(i,app,(45,319,990,559))
 for j,a in enumerate(arts):sprite(i,a,120+j*178,892,145)
 brand(d,70,262,19)
 i.save(A/'Open-Pixel-Studio-Social-Square-1080.png',optimize=True)

def vertical():
 w,h=1080,1920;i=canvas(w,h);d=ImageDraw.Draw(i);stripes(d,w,h)
 label(d,(67,135),'OPEN',116,WHITE,True);label(d,(67,270),'PIXEL STUDIO',90,RED,True)
 label(d,(67,408),'A focused workspace for',32,WHITE,False)
 label(d,(67,452),'drawing and animating sprites.',32,WHITE,False)
 framed(i,app,(39,570,1000,563))
 label(d,(70,1210),'DRAW  /  LAYER  /  ANIMATE',38,WHITE,True)
 for j,a in enumerate(arts):sprite(i,a,120+(j%3)*320,1280+(j//3)*285,240)
 brand(d,70,1820,26)
 i.save(A/'Open-Pixel-Studio-Social-Vertical-1080x1920.png',optimize=True)

def thumbnail():
 w,h=1280,720;i=Image.new('RGB',(w,h),BLACK);i.paste(ImageEnhance.Brightness(app).enhance(.55),(0,0));
 d=ImageDraw.Draw(i,'RGBA')
 d.rectangle((0,0,660,720),fill=(13,13,15,238))
 d.rectangle((40,125,50,570),fill=RED)
 d.text((77,142),'OPEN',font=font(93),fill=WHITE)
 d.text((77,246),'PIXEL',font=font(93),fill=WHITE)
 d.text((77,350),'STUDIO',font=font(93),fill=RED)
 d.text((80,482),'A 60-SECOND WORKSPACE TOUR',font=font(24),fill=GREEN)
 brand(d,80,630,22)
 i.save(A/'Open-Pixel-Studio-Video-Thumbnail-1280x720.png',optimize=True)

def screenshots():
 # Copy original verified captures under descriptive, storefront-safe titles, no retouching.
 import shutil
 for src,target in [('02-ember-blade-project.png','Screenshot-01-Drawing-Workspace.png'),
                    ('04-mushroom-project.png','Screenshot-02-Sprite-Canvas.png'),
                    ('05-potion-project.png','Screenshot-03-Palette-and-Tools.png'),
                    ('07-guardian-layers.png','Screenshot-04-Layers-Inspector.png'),
                    ('09-slime-timeline.png','Screenshot-05-Animation-Timeline.png'),
                    ('01-startup-workspace.png','Screenshot-06-Example-Animation.png')]:
  shutil.copy2(A/src,A/target)

def contact():
 w,h=1600,1110;i=canvas(w,h);d=ImageDraw.Draw(i)
 label(d,(45,32),'OPEN PIXEL STUDIO  /  CAPTURE CONTACT SHEET',34,WHITE,True)
 sources=['Screenshot-01-Drawing-Workspace.png','Screenshot-02-Sprite-Canvas.png','Screenshot-03-Palette-and-Tools.png','Screenshot-04-Layers-Inspector.png','Screenshot-05-Animation-Timeline.png','Screenshot-06-Example-Animation.png']
 for j,name in enumerate(sources):
  x=35+(j%2)*790;y=115+(j//2)*320
  s=Image.open(A/name).convert('RGB').resize((748,421),Image.Resampling.LANCZOS)
  # Crop lower to fit three rows; full screenshots separately
  s=s.crop((0,0,748,274))
  i.paste(s,(x,y));label(d,(x,y+281),name.replace('Screenshot-','').replace('.png',''),22,GREEN,False)
 i.save(A/'Open-Pixel-Studio-Capture-Contact-Sheet.png',optimize=True)

for fn in [main_cover,hero,square,vertical,thumbnail,screenshots,contact]:fn()
print('Created',len(list(A.glob('Open-Pixel*'))),'brand graphics +',len(list(A.glob('Screenshot*'))),'authentic screenshots')

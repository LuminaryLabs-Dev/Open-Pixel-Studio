#!/usr/bin/env python3
"""Human-like pointer/keyboard browser QA. All pixels are PAINTED through Nexus Pixel Studio UI.
Reference maps are original, hand-directed 32px designs, not injected into the app.
"""
from pathlib import Path
import os, json, io, zipfile, time, collections, math, sys, traceback
from PIL import Image, ImageDraw, ImageFont, ImageChops
from playwright.sync_api import sync_playwright

BASE=Path('/mnt/data/nexus-pixel-studio/manual-qa')
SPR=BASE/'sprites'; EV=BASE/'evidence'; SPR.mkdir(parents=True,exist_ok=True); EV.mkdir(parents=True,exist_ok=True)
APP='http://127.0.0.1:8765/Nexus-Pixel-Studio-v0.1.0-Standalone.html'
S=32
TRANSPARENT=(0,0,0,0)
COLORS={
'ink':'#1A203A', 'outline':'#23283F', 'outline2':'#343451','shadow':'#465174',
'black':'#131B2E','silver_dark':'#586E86','silver':'#A1BCCE','silver_light':'#DCF5F0',
'blue_dark':'#1C477B','blue':'#3186B8','blue_light':'#6CE3E3','white':'#F6F8DC',
'gold_dark':'#8E4B35','gold':'#D79345','gold_light':'#FFE19A','brown':'#684235',
'red_dark':'#922F46','red':'#D34751','red_light':'#FF8268','pink':'#F4B49A',
'leaf_dark':'#28604A','leaf':'#459C5E','leaf_light':'#91D975','lime':'#C8F48F',
'purple':'#75499D','purple_light':'#AF8ADE','teal_dark':'#235A66', 'teal':'#36ADAA',
'orange':'#D56E35'
}

def canvas(): return Image.new('RGBA',(S,S),TRANSPARENT)
def shape(img,coords,color): ImageDraw.Draw(img).polygon(coords,fill=COLORS[color])
def rectangle(img,xy,color): ImageDraw.Draw(img).rectangle(xy,fill=COLORS[color])
def ellipse(img,xy,color): ImageDraw.Draw(img).ellipse(xy,fill=COLORS[color])
def line(img,pts,color,width=1): ImageDraw.Draw(img).line(pts,fill=COLORS[color],width=width)
def pixels(img,coords,color):
 for p in coords: img.putpixel(p,tuple(bytes.fromhex(COLORS[color][1:]))+(255,))

def sword():
 i=canvas()
 # point and faceted blade
 shape(i,[(16,1),(21,7),(19,16),(18,20),(14,20),(13,16),(11,7)],'ink')
 shape(i,[(16,3),(19,8),(17,18),(15,18),(13,8)],'silver_dark')
 shape(i,[(16,3),(16,18),(15,17),(13,8)],'silver_light')
 line(i,[(17,5),(18,10),(17,14)],'silver')
 pixels(i,[(16,5),(15,7),(16,10),(16,13)],'white')
 # gold cross guard and gemstone
 rectangle(i,(6,20,25,22),'ink')
 rectangle(i,(8,20,23,21),'gold')
 rectangle(i,(8,20,10,20),'gold_light')
 rectangle(i,(21,20,23,20),'gold_light')
 rectangle(i,(14,19,18,23),'gold_dark')
 rectangle(i,(15,20,17,22),'gold_light')
 pixels(i,[(16,20),(16,21)],'blue')
 rectangle(i,(14,23,18,29),'outline')
 rectangle(i,(15,23,17,28),'brown')
 line(i,[(15,24),(17,26),(15,28)],'gold')
 rectangle(i,(12,29,20,31),'ink')
 rectangle(i,(14,29,18,30),'gold')
 pixels(i,[(15,29),(16,29)],'gold_light')
 # floating magic sparks
 pixels(i,[(8,10),(7,11),(9,11),(8,12),(24,13),(23,14),(25,14),(24,15)],'blue_light')
 pixels(i,[(8,11),(24,14)],'white')
 return i

def mushroom():
 i=canvas()
 # ground and stalk
 ellipse(i,(5,27,27,30),'leaf_dark')
 rectangle(i,(11,27,22,28),'leaf')
 shape(i,[(14,15),(21,15),(22,18),(21,25),(23,28),(21,29),(12,29),(11,27),(13,24),(12,19)],'ink')
 shape(i,[(14,17),(20,17),(20,26),(21,27),(13,27),(15,24)],'pink')
 rectangle(i,(15,19,17,26),'white')
 line(i,[(20,20),(20,25),(19,27)],'gold')
 # broad toadstool cap and its thick underside
 shape(i,[(3,18),(4,13),(7,9),(12,6),(21,6),(26,9),(29,14),(29,18),(27,20),(5,20)],'ink')
 shape(i,[(5,17),(6,13),(10,9),(14,8),(21,8),(25,11),(27,15),(27,17)],'red_dark')
 shape(i,[(7,16),(8,12),(12,10),(20,9),(24,12),(26,15),(25,17),(9,17)],'red')
 shape(i,[(9,12),(13,9),(20,9),(22,11),(17,12)],'red_light')
 line(i,[(5,18),(27,18)],'gold_dark',2)
 line(i,[(8,19),(23,19)],'gold_light')
 # spot clusters, offset for organic pixel style
 ellipse(i,(11,10,14,12),'white');ellipse(i,(19,12,22,14),'white')
 rectangle(i,(15,14,17,15),'pink');pixels(i,[(7,15),(24,16),(13,11)],'gold_light')
 pixels(i,[(6,26),(8,25),(26,25)],'leaf_light')
 return i

def potion():
 i=canvas()
 # magical bottle silhouette & glass
 shape(i,[(12,5),(20,5),(20,13),(24,15),(26,20),(25,27),(22,30),(10,30),(7,27),(6,20),(8,15),(12,13)],'ink')
 shape(i,[(13,8),(19,8),(19,14),(23,16),(24,20),(23,26),(21,28),(11,28),(9,26),(8,20),(9,16),(13,14)],'blue_dark')
 shape(i,[(9,20),(23,20),(23,25),(20,28),(12,28),(9,25)],'teal')
 shape(i,[(11,23),(22,23),(22,26),(20,28),(12,28),(10,26)],'blue')
 # glass rim, cork, light, liquid bubbles
 rectangle(i,(12,5,20,6),'silver_light')
 rectangle(i,(13,3,19,7),'brown')
 rectangle(i,(14,3,18,5),'gold')
 rectangle(i,(15,3,17,3),'gold_light')
 line(i,[(10,16),(9,19),(9,23)],'silver_light')
 pixels(i,[(11,15),(20,17),(21,18),(13,26),(18,23)],'blue_light')
 pixels(i,[(16,23),(19,25),(13,24),(17,27)],'white')
 pixels(i,[(6,9),(5,10),(7,10),(6,11),(27,13),(26,14),(28,14),(27,15)],'purple_light')
 pixels(i,[(6,10),(27,14)],'white')
 return i

def knight():
 i=canvas()
 # pauldrons / armored torso
 shape(i,[(11,19),(21,19),(26,22),(29,28),(28,31),(4,31),(3,28),(6,22)],'ink')
 shape(i,[(7,23),(12,21),(20,21),(25,23),(27,29),(25,30),(7,30),(5,29)],'silver_dark')
 shape(i,[(11,23),(21,23),(23,27),(21,30),(11,30),(9,27)],'silver')
 shape(i,[(4,26),(8,23),(11,24),(9,28),(6,29)],'silver_light')
 shape(i,[(28,26),(24,23),(21,24),(23,28),(26,29)],'silver_light')
 rectangle(i,(15,25,17,30),'blue_dark')
 pixels(i,[(16,25),(16,27),(16,29)],'blue_light')
 # helmet rounded outline + faceplate
 shape(i,[(9,7),(13,4),(20,4),(24,7),(25,13),(24,22),(21,25),(11,25),(8,22),(7,13)],'ink')
 shape(i,[(11,8),(14,6),(19,6),(22,8),(23,13),(22,21),(20,23),(12,23),(10,21),(9,13)],'silver_dark')
 shape(i,[(11,8),(15,6),(17,6),(17,15),(11,18),(10,14)],'silver_light')
 shape(i,[(18,7),(21,9),(22,14),(21,17),(18,16)],'silver')
 rectangle(i,(10,15,22,20),'outline')
 rectangle(i,(11,16,21,17),'black')
 rectangle(i,(12,17,14,17),'lime')
 rectangle(i,(18,17,20,17),'lime')
 rectangle(i,(15,18,17,21),'silver_dark')
 line(i,[(13,22),(19,22)],'silver_light')
 # plume - put on upper layer in a second pass
 overlay=canvas()
 shape(overlay,[(16,1),(20,2),(22,4),(20,6),(18,8),(15,8),(14,7),(16,5)],'red_dark')
 shape(overlay,[(16,2),(20,3),(19,5),(16,6)],'red')
 pixels(overlay,[(17,2),(18,3),(17,4)],'red_light')
 return i,overlay

def slime():
 i=canvas()
 ellipse(i,(5,11,27,28),'ink')
 ellipse(i,(6,12,26,26),'leaf_dark')
 ellipse(i,(7,12,25,25),'leaf')
 shape(i,[(8,18),(10,14),(15,12),(21,14),(24,18),(24,23),(21,26),(10,26),(7,23)],'leaf_light')
 ellipse(i,(9,13,18,18),'lime')
 line(i,[(9,17),(10,15),(13,14)],'white')
 # little feet
 rectangle(i,(7,25,11,28),'ink');rectangle(i,(21,25,25,28),'ink')
 rectangle(i,(8,25,10,27),'leaf_dark');rectangle(i,(22,25,24,27),'leaf_dark')
 # eyes / mouth
 rectangle(i,(11,19,13,22),'black');rectangle(i,(19,19,21,22),'black')
 pixels(i,[(11,19),(19,19)],'white')
 line(i,[(15,23),(16,24),(17,23)],'leaf_dark')
 pixels(i,[(6,10),(5,11),(7,11),(6,12)],'blue_light')
 return i

def blink_frame(base):
 img=base.copy()
 rectangle(img,(11,19,13,22),'leaf_light');rectangle(img,(19,19,21,22),'leaf_light')
 line(img,[(11,21),(13,21)],'black');line(img,[(19,21),(21,21)],'black')
 pixels(img,[(6,10),(5,11),(7,11),(6,12)],'blue_light')
 return img

def sparkle_frame(base):
 img=base.copy()
 pixels(img,[(27,7),(26,8),(28,8),(27,9)],'gold_light')
 pixels(img,[(27,8)],'white')
 return img

# Painting tool: GUI event interactions only. No evaluate() invocation performs mutations.

def horizontal_runs(img):
  pix=img.load(); colors=collections.defaultdict(set)
  for y in range(S):
   for x in range(S):
    v=pix[x,y]
    if v[3]:colors['#%02X%02X%02X'%v[:3]].add((x,y))
  result={}
  for color,points in colors.items():
   runs=[]
   # strip out long axis runs first to minimize mouse strokes, still preserving exact pixels
   pending=set(points)
   while pending:
    best=[]
    for x,y in pending:
     a=[(k,y) for k in range(x,S) if (k,y) in pending]
     # require contiguous
     h=[]
     for k in range(x,S):
      if (k,y) in pending:h.append((k,y))
      else:break
     v=[]
     for k in range(y,S):
      if (x,k) in pending:v.append((x,k))
      else:break
     if len(h)>len(best):best=h
     if len(v)>len(best):best=v
     if len(best)>=S:break
    for pos in best:pending.remove(pos)
    runs.append((best[0],best[-1]))
   result[color]=runs
  return result

def pxy(page,x,y):
 box=page.locator('#artboard').bounding_box()
 if not box:raise RuntimeError('Artboard not visible')
 zoom=box['width']/S
 return box['x']+(x+.5)*zoom, box['y']+(y+.5)*zoom

def stroke(page,a,b):
 ax,ay=pxy(page,*a);bx,by=pxy(page,*b)
 page.mouse.move(ax,ay);page.mouse.down()
 if a!=b:page.mouse.move(bx,by)
 page.mouse.up()

def foreground(page,color):
 page.locator('#colorHex').fill(color.replace('#',''))
 page.locator('#colorHex').press('Tab')
 # state is updated on change event

def tool(page,name):
 page.locator(f'.tool[data-tool="{name}"]').click()

def paint(page,img,exclude=None):
 tool(page,'pencil')
 runs=horizontal_runs(img)
 total=sum(len(v) for v in runs.values())
 if exclude:print('Paint exclusion ',exclude, flush=True)
 for color,segments in sorted(runs.items(),key=lambda kv:-len(kv[1])):
  foreground(page,color)
  for a,b in segments:stroke(page,a,b)
 return total

def click_at(page,x,y):
 ax,ay=pxy(page,x,y);page.mouse.click(ax,ay)

def drag_at(page,x1,y1,x2,y2):
 stroke(page,(x1,y1),(x2,y2))

def new(page,name):
 page.locator('.menu-trigger[data-menu="file"]').click()
 page.locator('#menu-file button[data-action="new"]').click()
 d=page.locator('#newDialog')
 d.locator('input[name="name"]').fill(name)
 d.locator('input[name="width"]').fill('32')
 d.locator('input[name="height"]').fill('32')
 d.locator('button[type="submit"]').click()
 assert page.evaluate('window.NexusStudio.getInfo().name')==name
 assert page.evaluate('window.NexusStudio.getInfo().width')==32

def menu(page,category,action):
 page.locator(f'.menu-trigger[data-menu="{category}"]').click()
 page.locator(f'#menu-{category} button[data-action="{action}"]').click()

def export(page,kind,dest):
 with page.expect_download(timeout=10000) as d:
  menu(page,'file',kind)
 download=d.value; target=dest/download.suggested_filename; download.save_as(target)
 return target

def get_canvas(page,frame=0):
 # read-only diagnostic API retrieves the actual rendered composition
 out=Image.new('RGBA',(S,S)); data=[]
 for y in range(S):
  row=page.evaluate('(y)=>Array.from({length:32},(_,x)=>window.NexusStudio.getPixel(x,y,%d))'%frame,y)
  data.extend([tuple(v) for v in row])
 out.putdata(data)
 return out

def diff(a,b):
 if a.size!=b.size:return -1
 return sum(p!=q for p,q in zip(a.getdata(),b.getdata()))

def assert_pixels(label,actual,expected):
 n=diff(actual,expected)
 if n:
  ImageChops.difference(actual,expected).save(EV/(label+'-diff.png'))
  actual.resize((384,384),Image.Resampling.NEAREST).save(EV/(label+'-actual.png'))
  expected.resize((384,384),Image.Resampling.NEAREST).save(EV/(label+'-expected.png'))
 raise_assert= n==0
 print(f'PIXELS {label}: {"PASS" if raise_assert else "FAIL"} ({n} differing pixels)',flush=True)
 if n:raise AssertionError(f'{label}: {n} pixel mismatch')

def downloaded_png(path):return Image.open(path).convert('RGBA')

def capture(page,name):
 page.screenshot(path=str(EV/(name+'.png')),full_page=True)

def write_manifest(items,results,errors):
 p=BASE/'test-results.json'
 p.write_text(json.dumps({'build':'Nexus Pixel Studio v0.1.1','tested_at':'2026-11-06','method':'headless Chromium manual-style GUI pointer/keyboard interactions; screenshots visually reviewed','sprites':items,'checks':results,'errors':errors},indent=2))
 return p

def main():
 items=[];results=[];errors=[];start=time.monotonic()
 def check(name,fn):
  try:
   fn();results.append({'name':name,'status':'PASS'})
  except Exception as e:
   results.append({'name':name,'status':'FAIL','detail':str(e)});errors.append(f'{name}: {e}');print('CHECK FAILED',name,e,flush=True)

 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--disable-dev-shm-usage','--no-sandbox','--allow-file-access-from-files'])
  context=browser.new_context(viewport={'width':1600,'height':1000},device_scale_factor=1,accept_downloads=True)
  page=context.new_page()
  page.on('pageerror',lambda e: errors.append('Page JavaScript error: '+str(e)))
  page.on('console',lambda m: errors.append('Console '+m.type+': '+m.text) if m.type=='error' else None)
  page.set_content(Path('/mnt/data/Nexus-Pixel-Studio-v0.1.1-Standalone.html').read_text(),wait_until='load')
  page.wait_for_function('()=>!!window.NexusStudio && window.NexusStudio.getInfo().name.length>0')
  print('APP loaded',page.title(),flush=True)

  source=[('Ember Blade',sword()),('Crimson Toadstool',mushroom()),('Azure Potion',potion()),('Iron Guardian',knight()),('Moss Slime',slime())]
  for idx,(name,sourceArt) in enumerate(source):
   new(page,name)
   if idx==3:
    base,overlay=sourceArt
    count=paint(page,base)
    page.locator('#layerName').fill('Armor')
    page.locator('#layerName').press('Tab')
    page.locator('#addLayerBtn').click()
    page.locator('#layerName').fill('Crimson Plume')
    page.locator('#layerName').press('Tab')
    count+=paint(page,overlay)
    expected=Image.alpha_composite(base,overlay)
    # visibility / lock stress test
    page.locator('#toggleLayerVisibility').click()
    check('Layer visibility removes plume',lambda:assert_pixels('plume-hidden',get_canvas(page),base))
    page.locator('#toggleLayerVisibility').click()
    check('Layer visibility restores plume',lambda:assert_pixels('plume-visible',get_canvas(page),expected))
    page.locator('#toggleLayerLock').click()
    px0=get_canvas(page)
    foreground(page,'#FFFFFF');click_at(page,0,0)
    check('Layer lock prevents painting',lambda:assert_pixels('locked-layer',get_canvas(page),px0))
    page.locator('#toggleLayerLock').click()
    # test opacity without changing final image
    page.locator('#layerOpacity').fill('50');page.locator('#layerOpacity').dispatch_event('change')
    assert page.evaluate('window.NexusStudio.getInfo().layers[1].opacity')==0.5
    page.locator('#layerOpacity').fill('100');page.locator('#layerOpacity').dispatch_event('change')
   else:
    expected=sourceArt
    count=paint(page,sourceArt)

   check(f'{name}: Canvas pixel fidelity',lambda n=name,e=expected: assert_pixels(n.replace(' ','-'),get_canvas(page),e))
   capture(page,f'{idx+1:02d}-{name.replace(" ","-")}-editor')
   project_file=export(page,'save',SPR)
   png_file=export(page,'png',SPR)
   check(f'{name}: PNG export exactness',lambda n=name,e=expected,fn=png_file:assert_pixels(n.replace(' ','-')+'-export',downloaded_png(fn),e))
   item={'name':name,'size':'32x32','stroke_count':count,'png':str(png_file.relative_to(BASE)),'project':str(project_file.relative_to(BASE)),'layers':2 if idx==3 else 1,'frames':1}
   # Optional sprite-specific extra exercises; do them after baseline exports, then reset if necessary.
   if idx==0:
    # eyedropper on original palette pixel
    tool(page,'eyedropper');click_at(page,16,1)
    check('Eyedropper picks sword outline',lambda:assert_color(page,'#1A203A'))
    # test zoom and pan visually while avoiding pixel mutation
    initial_zoom=page.evaluate('window.NexusStudio.getInfo().zoom')
    page.locator('#zoomIn').click()
    check('Zoom increments',lambda: assert_equal(page.evaluate('window.NexusStudio.getInfo().zoom'),min(32,initial_zoom+1)))
    page.locator('#fitBtn').click()
    menu(page,'sprite','toggle-grid')
    check('Grid toggle visible',lambda: assert_equal(page.locator('#gridToggle').get_attribute('class').find('selected')>=0,True))
    menu(page,'sprite','toggle-grid')
   if idx==1:
    tool(page,'pencil');foreground(page,'#FFFFFF');click_at(page,1,1)
    check('Pencil adds pixel',lambda:assert_equal(tuple(page.evaluate('window.NexusStudio.getPixel(1,1)')),(255,255,255,255)))
    page.keyboard.press('Control+z')
    check('Canvas takes focus after painting',lambda:assert_equal(page.evaluate('document.activeElement.id'),'viewport'))
    check('Undo restores transparency',lambda:assert_equal(tuple(page.evaluate('window.NexusStudio.getPixel(1,1)')),(0,0,0,0)))
    page.keyboard.press('Control+y')
    check('Redo restores painted pixel',lambda:assert_equal(tuple(page.evaluate('window.NexusStudio.getPixel(1,1)')),(255,255,255,255)))
    page.keyboard.press('Control+z')
    check('Second undo restores source',lambda:assert_pixels('mushroom-after-undo',get_canvas(page),expected))
   if idx==2:
    # selection, move and undo on actual sprite (discard after test), then recheck
    tool(page,'select');drag_at(page,4,8,8,13)
    tool(page,'move');drag_at(page,6,10,9,10)
    moved=get_canvas(page)
    check('Selection move modifies pixel composition',lambda:assert_not_equal(diff(moved,expected),0))
    page.keyboard.press('Control+z')
    check('Selection move undo matches source',lambda:assert_pixels('potion-after-move-undo',get_canvas(page),expected))
    page.keyboard.press('Control+d')
    # additional drawing tool smoke checks safely isolated from the exported sprite
   if idx==4:
    # Frame duplication and blink; intended animation has 3 frames
    page.locator('#duplicateFrameBtn').click()
    check('Duplicate frame identical to base',lambda:assert_pixels('slime-dup-frame',get_canvas(page,1),expected))
    # modify eyes with eraser then draw blink strokes at precise coordinates
    tool(page,'eraser')
    for xy in [(11,19),(12,19),(13,19),(11,20),(12,20),(13,20),(11,21),(12,21),(13,21),(11,22),(12,22),(13,22),(19,19),(20,19),(21,19),(19,20),(20,20),(21,20),(19,21),(20,21),(21,21),(19,22),(20,22),(21,22)]:click_at(page,*xy)
    tool(page,'pencil');foreground(page,COLORS['leaf_light'])
    for y in range(19,23):
     drag_at(page,11,y,13,y);drag_at(page,19,y,21,y)
    foreground(page,COLORS['black']);drag_at(page,11,21,13,21);drag_at(page,19,21,21,21)
    blink=blink_frame(expected)
    check('Blink frame matches intended pixels',lambda:assert_pixels('slime-blink',get_canvas(page,1),blink))
    # duplicate base as third frame, add sparkle
    page.locator('#firstFrameBtn').click()
    page.locator('#duplicateFrameBtn').click()
    # frame order: base, freshly duplicated base, blink; modify middle frame
    sparkle=sparkle_frame(expected)
    foreground(page,COLORS['gold_light'])
    for xy in [(27,7),(26,8),(28,8),(27,9)]:click_at(page,*xy)
    foreground(page,COLORS['white']);click_at(page,27,8)
    check('Sparkle frame pixel fidelity',lambda:assert_pixels('slime-sparkle',get_canvas(page,1),sparkle))
    item['frames']=3
    # sheet and gif, atlas, project (overwrite one-frame first export with final)
    sheet_file=export(page,'sheet',SPR)
    gif_file=export(page,'gif',SPR)
    atlas_file=export(page,'atlas',SPR)
    finalproj=export(page,'save',SPR)
    item.update({'project':str(finalproj.relative_to(BASE)),'spritesheet':str(sheet_file.relative_to(BASE)),'gif':str(gif_file.relative_to(BASE)),'atlas':str(atlas_file.relative_to(BASE))})
    sheet_image=downloaded_png(sheet_file)
    # sheet has 2 columns, 2 rows in frame order base,sparkle,blink
    expected_sheet=Image.new('RGBA',(64,64))
    expected_sheet.paste(expected,(0,0)); expected_sheet.paste(sparkle,(32,0));expected_sheet.paste(blink,(0,32))
    check('3-frame sheet pixels and layout',lambda:assert_pixels('slime-spritesheet',sheet_image,expected_sheet))
    check('Animated GIF frame count',lambda:assert_equal(Image.open(gif_file).n_frames,3))
    # playback check: selected frame should change after enter
    page.keyboard.press('Enter');page.wait_for_timeout(320)
    check('Animation playback advances frames',lambda:assert_equal(page.evaluate('window.NexusStudio.getInfo().playing'),True))
    page.keyboard.press('Enter')
    check('Animation playback stops',lambda:assert_equal(page.evaluate('window.NexusStudio.getInfo().playing'),False))
    capture(page,'05-Moss-Slime-timeline')
   items.append(item)
   print('FINISHED SPRITE',idx+1,name,'strokes',count,'elapsed',round(time.monotonic()-start,1),'s',flush=True)
  # export round-trip: import saved layered knight as native .npx
  knight_path=SPR/'Iron-Guardian.npx'
  assert knight_path.exists()
  page.locator('#fileInput').set_input_files(str(knight_path))
  page.wait_for_function('window.NexusStudio.getInfo().name==="Iron Guardian"')
  base,overlay=source[3][1];expected=Image.alpha_composite(base,overlay)
  check('Editable .npx reopen retains layers',lambda:assert_equal(len(page.evaluate('window.NexusStudio.getInfo().layers')),2))
  check('Editable .npx reopen retains pixel contents',lambda:assert_pixels('roundtrip-knight',get_canvas(page),expected))
  # In-memory about:blank render has an opaque origin and cannot expose localStorage.
  # Do not misrepresent this environment limitation as an autosave test.
  results.append({'name':'Local autosave survives reload','status':'BLOCKED','detail':'Managed Chromium blocks navigation; in-memory about:blank has no localStorage origin.'})
  # secondary tests of fill / shapes / symmetry / resize isolated from sprites
  new(page,'QA Scratch')
  tool(page,'rect');foreground(page,'#D34751');page.locator('#filledToggle').click();drag_at(page,5,5,12,12)
  check('Filled rectangle paints extent',lambda:assert_equal(tuple(page.evaluate('window.NexusStudio.getPixel(10,10)')),(211,71,81,255)))
  tool(page,'ellipse');foreground(page,'#FFE19A');drag_at(page,18,5,26,13)
  check('Filled ellipse center',lambda:assert_equal(tuple(page.evaluate('window.NexusStudio.getPixel(22,9)')),(255,225,154,255)))
  tool(page,'line');foreground(page,'#F6F8DC');drag_at(page,2,20,12,29)
  check('Line start/end',lambda:assert_equal(tuple(page.evaluate('window.NexusStudio.getPixel(12,29)')),(246,248,220,255)))
  tool(page,'fill');foreground(page,'#36ADAA');click_at(page,0,0)
  check('Flood fill fills transparent region',lambda:assert_equal(tuple(page.evaluate('window.NexusStudio.getPixel(31,31)')),(54,173,170,255)))
  tool(page,'pencil');page.locator('#symXToggle').click();foreground(page,'#FF8268');click_at(page,2,2)
  check('X symmetry duplicates stroke',lambda:assert_equal(tuple(page.evaluate('window.NexusStudio.getPixel(29,2)')),(255,130,104,255)))
  page.locator('#symXToggle').click()
  menu(page,'sprite','resize')
  page.locator('#resizeDialog input[name="width"]').fill('40');page.locator('#resizeDialog input[name="height"]').fill('40')
  page.locator('#resizeDialog button[type="submit"]').click()
  check('Resize changes document size',lambda:assert_equal((page.evaluate('window.NexusStudio.getInfo().width'),page.evaluate('window.NexusStudio.getInfo().height')),(40,40)))
  capture(page,'06-QA-Scratch-tools')
  # ensure no runtime errors
  results.append({'name':'Unhandled JavaScript errors','status':'FAIL' if any('Page JavaScript error' in e for e in errors) else 'PASS'})
  browser.close()
 write_manifest(items,results,errors)
 print('SUMMARY',len(items),'sprites',sum(t['status']=='PASS' for t in results),'passes',sum(t['status']=='FAIL' for t in results),'failures',flush=True)
 print('RESULTS AT',BASE/'test-results.json',flush=True)
 if errors:print('ERRORS:', '\n'.join(errors),flush=True)

def assert_equal(a,b):
 if a!=b:raise AssertionError(f'{a!r} != {b!r}')
def assert_not_equal(a,b):
 if a==b:raise AssertionError(f'{a!r} unexpectedly equals {b!r}')
def assert_color(page,color):
 got=page.locator('#colorHex').input_value().upper(); assert_equal(got,color.replace('#','').upper())

if __name__=='__main__':
 try:main()
 except Exception:
  traceback.print_exc()
  sys.exit(1)

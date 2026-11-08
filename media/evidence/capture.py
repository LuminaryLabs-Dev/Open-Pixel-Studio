#!/usr/bin/env python3
"""Real browser-recorded Open Pixel Studio media, using unchanged Nexus Pixel Studio v0.2.0.
No application source or footage pixels manipulated; only supported UI interactions.
"""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json,time,shutil,os
BASE=Path('/mnt/data/open-pixel-studio-media')
HTML=Path('/mnt/data/Nexus-Pixel-Studio-v0.2.0-Standalone.html')
PROJECTS=BASE/'projects'
RAW=BASE/'raw'
SHOTS=BASE/'images'
LOG=[]

def record(log,action,page):
 info=page.evaluate('NexusStudio.getInfo()')
 log.append({'action':action,'document':info['name'],'layers':len(info['layers']),'frames':info['frames'],'tool':info['tool']})

def wait(page,ms=700): page.wait_for_timeout(ms)
def load(page,name,log):
 page.locator('#fileInput').set_input_files(str(PROJECTS/(name+'.npx')))
 page.wait_for_function('(expected) => NexusStudio.getInfo().name === expected',arg=name.replace('-',' '))
 page.locator('#fitBtn').click()
 for i in range(3):page.locator('#zoomIn').click()
 record(log,'Opened project '+name,page)

def shot(page,name):
 page.screenshot(path=str(SHOTS/name),full_page=True)

def tool(page,name):page.locator('.tool[data-tool="'+name+'"]').click()
def color(page,hexval):
 page.locator('#tabColor').click()
 page.locator('#colorHex').fill(hexval)
 page.locator('#colorHex').press('Tab')
def pixel(page,x,y):
 box=page.locator('#artboard').bounding_box();z=page.evaluate('NexusStudio.getInfo().zoom')
 return box['x']+(x+.5)*z, box['y']+(y+.5)*z

def draw(page,points,delay=135):
 if not points:return
 xy=[pixel(page,*pt) for pt in points]
 page.mouse.move(*xy[0]);page.mouse.down();wait(page,delay)
 for p in xy[1:]:page.mouse.move(*p,steps=5);wait(page,delay)
 page.mouse.up();wait(page,250)

def scene1(page,log):
 wait(page,700)
 shot(page,'01-startup-workspace.png')
 page.locator('#playBtn').click();record(log,'Timeline playback',page);wait(page,2600)
 page.locator('#playBtn').click()
 page.locator('#tabNavigator').click();wait(page,1600);page.locator('#tabColor').click()
 load(page,'Ember-Blade',log);wait(page,900);shot(page,'02-ember-blade-project.png')
 color(page,'FCE49E');tool(page,'pencil')
 draw(page,[(21,4),(22,3)],250)
 draw(page,[(24,7),(25,6)],230)
 record(log,'Two Pencil strokes on open project',page)
 page.keyboard.press('Control+z');wait(page,700)
 page.keyboard.press('Control+y');wait(page,650)
 record(log,'Undo and redo via keyboard',page)
 shot(page,'03-ember-blade-edited.png')
 page.locator('.menu-trigger[data-menu="file"]').click();wait(page,1200)
 page.locator('.menu-trigger[data-menu="file"]').click();wait(page,800)
 page.locator('#tabLayer').click();wait(page,900)
 page.locator('#tabColor').click();wait(page,1200)

def scene2(page,log):
 load(page,'Crimson-Toadstool',log);wait(page,1100)
 shot(page,'04-mushroom-project.png')
 page.locator('#gridToggle').click();wait(page,650)
 page.locator('#gridToggle').click()
 color(page,'FFE8AB');tool(page,'line')
 draw(page,[(7,5),(9,4)],200)
 draw(page,[(23,4),(25,6)],200)
 wait(page,650)
 page.locator('#tabNavigator').click();wait(page,900)
 page.locator('#tabColor').click();record(log,'Line tool, grid, Navigator',page)
 load(page,'Azure-Potion',log);wait(page,800)
 shot(page,'05-potion-project.png')
 tool(page,'eyedropper');page.mouse.click(*pixel(page,15,10));wait(page,700)
 tool(page,'rect');color(page,'8CC4CE');draw(page,[(4,4),(6,6)],260)
 page.keyboard.press('Control+z');wait(page,600)
 tool(page,'pencil');draw(page,[(7,4),(8,4)],300)
 record(log,'Eyedropper, rectangle, undo, pencil',page)
 shot(page,'06-potion-edited.png')
 wait(page,1200)
 wait(page,1000)

def scene3(page,log):
 load(page,'Iron-Guardian',log);wait(page,950)
 page.locator('#tabLayer').click();wait(page,850)
 shot(page,'07-guardian-layers.png')
 page.locator('#addLayerBtn').click();wait(page,600)
 color(page,'83BC8D');tool(page,'pencil');draw(page,[(4,5),(5,4)],220)
 page.locator('#tabLayer').click();wait(page,750)
 record(log,'Added editable layer in real editor',page)
 shot(page,'08-guardian-new-layer.png')
 load(page,'Moss-Slime',log);wait(page,850)
 page.locator('#tabColor').click();shot(page,'09-slime-timeline.png')
 page.locator('#nextFrameBtn').click();wait(page,800)
 page.locator('#nextFrameBtn').click();wait(page,800)
 page.locator('#firstFrameBtn').click();wait(page,800)
 record(log,'Scrubbed three animation frames through timeline',page)
 page.locator('#tabNavigator').click();wait(page,1200)
 page.locator('#tabColor').click();wait(page,900)
 page.locator('.menu-trigger[data-menu="file"]').click();wait(page,1300)
 page.locator('.menu-trigger[data-menu="file"]').click();wait(page,800)

def main():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
  for index,fn in enumerate([scene1,scene2,scene3],start=1):
   if index < int(os.environ.get("START_TAKE","1")): continue
   print("BEGIN TAKE",index,flush=True)
   context=browser.new_context(viewport={'width':1280,'height':720},device_scale_factor=1,
       record_video_dir=str(RAW),record_video_size={'width':1280,'height':720},accept_downloads=True)
   page=context.new_page();page.set_default_timeout(5000);errors=[]
   page.on('pageerror',lambda x:errors.append(str(x)))
   page.set_content(HTML.read_text(),wait_until='load')
   page.wait_for_function('window.NexusStudio && window.NexusStudio.getInfo().name')
   scene_log=[];start=time.monotonic()
   try: fn(page,scene_log)
   except Exception as ex:
    scene_log.append({'error':repr(ex)})
    shot(page,f'error-scene-{index}.png')
    raise
   finally:
    runtime=round(time.monotonic()-start,2)
    # Capture a minimum 22 sec for editorial choice
    if runtime<22: wait(page,int((22-runtime)*1000))
    video=page.video
    page.close();context.close()
    vid_path=Path(video.path());out=RAW/f'take-{index:02d}.webm'
    shutil.move(vid_path,out)
    LOG.append({'take':index,'source':str(HTML),'video':out.name,'duration_interactive_s':runtime,'events':scene_log,'page_errors':errors})
    print('Take',index,'captured',out.stat().st_size,'bytes','events',len(scene_log),'runtime',runtime, 'browser_errors', errors,flush=True)
  browser.close()
 (BASE/'evidence'/'capture-log.json').write_text(json.dumps(LOG,indent=2))

if __name__=='__main__':main()

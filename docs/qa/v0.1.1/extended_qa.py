from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image
import json, sys
from manual_5sprite_test_v011 import new,menu,tool,foreground,drag_at,click_at,get_canvas,diff,assert_equal,assert_pixels,S,SPR,EV
root=Path('/mnt/data/nexus-pixel-studio/manual-qa')
src=Path('/mnt/data/Nexus-Pixel-Studio-v0.1.1-Standalone.html').read_text()
checks=[]
def check(name,fun):
 try:
  fun(); checks.append({'check':name,'result':'PASS'});print('PASS',name,flush=True)
 except Exception as e:
  checks.append({'check':name,'result':'FAIL','error':str(e)});print('FAIL',name,e,flush=True)
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 ctx=b.new_context(viewport={'width':1600,'height':1000},accept_downloads=True)
 page=ctx.new_page();page.set_content(src)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 png=SPR/'Ember-Blade-frame-01.png';gold=Image.open(png).convert('RGBA')
 page.locator('#fileInput').set_input_files(str(png));page.wait_for_function('window.NexusStudio.getInfo().name==="Ember-Blade-frame-01"')
 check('PNG image import preserves pixel data',lambda:assert_pixels('import-sword',get_canvas(page),gold))
 check('PNG image import creates single layer',lambda:assert_equal(len(page.evaluate('window.NexusStudio.getInfo().layers')),1))
 menu(page,'sprite','flip-h');menu(page,'sprite','flip-h')
 check('Double horizontal flip is lossless',lambda:assert_pixels('flip-double-H',get_canvas(page),gold))
 menu(page,'sprite','flip-v');menu(page,'sprite','flip-v')
 check('Double vertical flip is lossless',lambda:assert_pixels('flip-double-V',get_canvas(page),gold))
 # pan using space and mouse, make sure no pixels change
 box=page.locator('#artboard').bounding_box(); beforeX=box['x'];beforeY=box['y']
 cx,cy=box['x']+70,box['y']+70
 page.keyboard.down('Space');page.mouse.move(cx,cy);page.mouse.down();page.mouse.move(cx+35,cy+28);page.mouse.up();page.keyboard.up('Space')
 newbox=page.locator('#artboard').bounding_box()
 check('Space drag pans viewport',lambda:assert_equal((round(newbox['x']-beforeX),round(newbox['y']-beforeY)),(35,28)))
 check('Pan leaves artwork unchanged',lambda:assert_pixels('pan-no-paint',get_canvas(page),gold))
 page.locator('#fitBtn').click()
 # Other major tool actions on scratch
 new(page,'QA CopyPaste')
 tool(page,'rect');page.locator('#filledToggle').click();foreground(page,'#FF8268');drag_at(page,5,5,12,12)
 original=get_canvas(page)
 tool(page,'select');drag_at(page,5,5,12,12)
 page.keyboard.press('Control+x')
 check('Cut removes selected pixels',lambda:assert_equal(tuple(page.evaluate('window.NexusStudio.getPixel(8,8)')),(0,0,0,0)))
 page.keyboard.press('Control+v')
 check('Paste restores selected art',lambda:assert_pixels('cut-paste-recover',get_canvas(page),original))
 page.keyboard.press('Control+d')
 # test flipped and copy current frame via file save, clipboard hotkey
 tool(page,'pencil');foreground(page,'#FFFFFF')
 page.locator('#brushSize').fill('3');page.locator('#brushSize').dispatch_event('input')
 click_at(page,24,24)
 check('3px brush covers 3x3',lambda:assert_equal(tuple(page.evaluate('window.NexusStudio.getPixel(23,23)')),(255,255,255,255)))
 tool(page,'eraser');click_at(page,24,24)
 check('3px eraser clears 3x3',lambda:assert_equal(tuple(page.evaluate('window.NexusStudio.getPixel(24,24)')),(0,0,0,0)))
 tool(page,'pencil');page.locator('#brushSize').fill('1');page.locator('#brushSize').dispatch_event('input')
 # keyboard save shortcut (ensure focus on viewport via painting)
 foreground(page,'#FFE19A');click_at(page,22,22)
 with page.expect_download(timeout=10000) as d:page.keyboard.press('Control+s')
 check('Ctrl+S downloads editable project',lambda:assert_equal(d.value.suggested_filename,'QA-CopyPaste.npx'))
 d.value.save_as(root/'evidence'/'shortcut-save.npx')
 # Test project reimport preserving three-frame animation
 slime=SPR/'Moss-Slime.npx'
 page.locator('#fileInput').set_input_files(str(slime));page.wait_for_function('window.NexusStudio.getInfo().name==="Moss Slime"')
 check('Animated project opens with 3 frames',lambda:assert_equal(page.evaluate('window.NexusStudio.getInfo().frames'),3))
 sheet=Image.open(SPR/'Moss-Slime-spritesheet.png').convert('RGBA')
 for idx in range(3):
  target=sheet.crop(((idx%2)*S,(idx//2)*S,((idx%2)+1)*S,((idx//2)+1)*S))
  check(f'Animated .npx frame {idx+1} lossless',lambda idx=idx,target=target: assert_pixels(f'npx-frame-{idx+1}',get_canvas(page,idx),target))
 atlas=json.loads((SPR/'Moss-Slime-atlas.json').read_text())
 check('Atlas JSON three frame entries',lambda:assert_equal(len(atlas['frames']),3))
 check('Atlas correct frame rectangles',lambda:assert_equal([(a['frame']['x'],a['frame']['y'],a['frame']['w'],a['frame']['h']) for a in atlas['frames']],[(0,0,32,32),(32,0,32,32),(0,32,32,32)]))
 gif=Image.open(SPR/'Moss-Slime.gif')
 check('GIF has three frames',lambda:assert_equal(gif.n_frames,3))
 for idx in range(gif.n_frames):
  gif.seek(idx)
  ref=sheet.crop(((idx%2)*S,(idx//2)*S,((idx%2)+1)*S,((idx//2)+1)*S))
  check(f'GIF frame {idx+1} exact RGBA',lambda g=gif.convert('RGBA'),ref=ref,idx=idx:assert_pixels(f'gif-{idx+1}',g,ref))
 # test palette additions via UI
 new(page,'QA Palette')
 old=len(page.evaluate('window.NexusStudio.toProject().palette'))
 foreground(page,'#EB3F71');page.locator('#addColorBtn').click()
 check('Add color swatch increases palette size',lambda:assert_equal(len(page.evaluate('window.NexusStudio.toProject().palette')),old+1))
 check('Custom palette includes new color',lambda:assert_equal(page.evaluate('window.NexusStudio.toProject().palette')[-1],'#EB3F71'))
 # per-document palette reopens after an import
 check('No uncaught page exceptions',lambda:assert_equal(errors,[]))
 b.close()
(root/'extended-results.json').write_text(json.dumps(checks,indent=2))
print('TOTAL',sum(x['result']=='PASS' for x in checks),'PASS',sum(x['result']=='FAIL' for x in checks),'FAIL',flush=True)

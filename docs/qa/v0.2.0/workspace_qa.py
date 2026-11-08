#!/usr/bin/env python3
"""Interaction-driven visual and functional QA for Luminary Nexus Pixel Studio v0.2."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image
import json, traceback, io
BASE=Path('/mnt/data/nexus-pixel-studio-workspace')
HTML=BASE/'Nexus-Pixel-Studio-v0.2.0-Standalone.html'
CHECKS=[]

def ck(name,fn):
 try:
  res=fn();CHECKS.append({'name':name,'state':'PASS','detail':str(res) if res is not None else ''});print('PASS',name,flush=True)
 except Exception as ex:
  CHECKS.append({'name':name,'state':'FAIL','detail':repr(ex)});print('FAIL',name,ex,flush=True)

def eq(a,b):
 assert a==b,f'Expected {b}, received {a}'

def assert_visible(page,selector,expected=True):eq(page.locator(selector).is_visible(),expected)

def assert_screenshot(page,name):page.screenshot(path=str(BASE/name),full_page=True)

def assert_range(value,minimum,maximum):assert minimum<=value<=maximum,f'got {value}, expected {minimum}–{maximum}'
def assert_name(name,substring):assert substring in name,f'expected {substring} in {name}'

def build():
 s=(BASE/'index.html').read_text()
 s=s.replace('<link rel="stylesheet" href="style.css" />','<style>\n'+(BASE/'style.css').read_text()+'\n</style>')
 s=s.replace('<link rel="stylesheet" href="workspace.css" />','<style>\n'+(BASE/'workspace.css').read_text()+'\n</style>')
 s=s.replace('<script src="app.js"></script>','<script>\n'+(BASE/'app.js').read_text()+'\n</script>')
 HTML.write_text(s)

build()
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 context=browser.new_context(viewport={'width':1440,'height':900},accept_downloads=True)
 page=context.new_page();errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(HTML.read_text(),wait_until='load')
 page.wait_for_function('window.NexusStudio && window.NexusStudio.getInfo().name')
 page.wait_for_timeout(250)
 ck('Boot: editor model and drawing canvas',lambda:(eq(page.evaluate('NexusStudio.getInfo().name'),'Slime Study'),assert_visible(page,'#viewport')))
 ck('Desktop status: storage unavailable is not recovery failure',lambda:eq(page.locator('#saveStatus').inner_text(),'Save project to file'))
 ck('Default: color dock visible',lambda:(eq(page.evaluate('NexusStudio.getWorkspaceInfo().activeDock'),'color'),assert_visible(page,'#dock-color')))
 ck('Default: dashboard preview hidden',lambda:assert_visible(page,'#dock-navigator',False))
 ck('Default: export tiles hidden',lambda:assert_visible(page,'.export-section',False))
 ck('Color palette populated',lambda:eq(page.locator('#paletteGrid .palette-swatch').count(),24))
 ck('Tools replaced with consistent SVG icons',lambda:eq(page.locator('.tool svg').count(),11))
 assert_screenshot(page,'workspace-desktop.png')

 page.locator('#tabLayer').click()
 ck('Layer dock tab shows editable properties',lambda:(assert_visible(page,'#dock-layer'),assert_visible(page,'#dock-color',False),assert_visible(page,'#layerOpacity')))
 assert_screenshot(page,'workspace-layer-dock.png')
 page.locator('#tabNavigator').click()
 ck('Navigator tab shows native preview',lambda:(assert_visible(page,'#dock-navigator'),assert_visible(page,'#previewCanvas')))
 page.locator('#tabColor').click()

 page.locator('#dockPaneBtn').click()
 ck('Right dock collapses',lambda:(eq(page.evaluate('NexusStudio.getWorkspaceInfo().rightDockVisible'),False),assert_visible(page,'#inspector',False)))
 page.locator('#dockPaneBtn').click()
 ck('Right dock restores',lambda:eq(page.evaluate('NexusStudio.getWorkspaceInfo().rightDockVisible'),True))
 page.locator('#timelinePaneBtn').click()
 ck('Timeline collapses',lambda:(eq(page.evaluate('NexusStudio.getWorkspaceInfo().timelineVisible'),False),assert_visible(page,'.timeline-panel',False)))
 assert_screenshot(page,'workspace-focus-mode.png')
 page.locator('#timelinePaneBtn').click()
 ck('Timeline restores',lambda:eq(page.evaluate('NexusStudio.getWorkspaceInfo().timelineVisible'),True))

 d=page.locator('#dockResize').bounding_box()
 old=page.evaluate('NexusStudio.getWorkspaceInfo().dockWidth')
 page.mouse.move(d['x']+d['width']/2,d['y']+d['height']/2)
 page.mouse.down();page.mouse.move(d['x']-64,d['y']+d['height']/2,steps=6);page.mouse.up()
 ck('Dock splitter changes width',lambda:assert_range(page.evaluate('NexusStudio.getWorkspaceInfo().dockWidth'),old+59,old+70))
 t=page.locator('#timelineResize').bounding_box();old=page.evaluate('NexusStudio.getWorkspaceInfo().timelineHeight')
 page.mouse.move(t['x']+50,t['y']+t['height']/2);page.mouse.down();page.mouse.move(t['x']+50,t['y']-43,steps=5);page.mouse.up()
 ck('Timeline splitter changes height',lambda:assert_range(page.evaluate('NexusStudio.getWorkspaceInfo().timelineHeight'),old+40,old+54))
 page.locator('.menu-trigger[data-menu="view"]').click();page.locator('[data-action="reset-workspace"]').click()
 ck('Reset workspace restores panel widths',lambda:(eq(page.evaluate('NexusStudio.getWorkspaceInfo().dockWidth'),262),eq(page.evaluate('NexusStudio.getWorkspaceInfo().timelineHeight'),212)))

 page.locator('.menu-trigger[data-menu="file"]').click();page.locator('[data-action="new"]').click()
 page.locator('#newForm [name="name"]').fill('Luminary QA Canvas')
 page.locator('#newForm [name="width"]').fill('16');page.locator('#newForm [name="height"]').fill('16')
 page.locator('#newForm button[type="submit"]').click()
 ck('New project creates fresh canvas',lambda:(eq(page.evaluate('NexusStudio.getInfo().width'),16),eq(page.evaluate('NexusStudio.getInfo().name'),'Luminary QA Canvas')))
 page.locator('#colorHex').fill('EF4A44');page.locator('#colorHex').press('Tab')
 page.locator('.tool[data-tool="pencil"]').click()
 r=page.locator('#artboard').bounding_box();z=page.evaluate('NexusStudio.getInfo().zoom');cx=r['x']+z*4.5;cy=r['y']+z*7.5
 page.mouse.click(cx,cy)
 ck('Pixel editing works with new workspace layout',lambda:eq(page.evaluate('NexusStudio.getPixel(4,7)'),[239,74,68,255]))
 page.keyboard.press('Control+z')
 ck('Undo works after drawing',lambda:eq(page.evaluate('NexusStudio.getPixel(4,7)'),[0,0,0,0]))
 page.keyboard.press('Control+y')
 ck('Redo restores edit',lambda:eq(page.evaluate('NexusStudio.getPixel(4,7)'),[239,74,68,255]))
 page.locator('#addLayerBtn').click();page.locator('#addFrameBtn').click()
 ck('Layer and frame creation still functional',lambda:(eq(len(page.evaluate('NexusStudio.getInfo().layers')),2),eq(page.evaluate('NexusStudio.getInfo().frames'),2)))

 with page.expect_download() as dload:page.locator('#exportBtn').click()
 sheet=dload.value
 ck('Export button triggers sprite-sheet download',lambda:assert_name(sheet.suggested_filename,'spritesheet'))
 with page.expect_download() as dload:page.locator('.menu-trigger[data-menu="file"]').click();page.locator('#menu-file [data-action="save"]').click()
 project=dload.value
 ck('Project Save exports editable .npx',lambda:assert_name(project.suggested_filename,'.npx'))
 project_path=BASE/'qa-project.npx';project.save_as(str(project_path))
 data=json.loads(project_path.read_text())
 ck('Project structure preserves layers and frames',lambda:(eq(len(data['layers']),2),eq(len(data['frames']),2)))

 # Reopen original layer and pixel through file input
 page.locator('#fileInput').set_input_files(str(project_path))
 page.wait_for_function('NexusStudio.getInfo().name === "Luminary QA Canvas"')
 ck('Editable project loads through file picker',lambda:(eq(page.evaluate('NexusStudio.getInfo().frames'),2),eq(page.evaluate('NexusStudio.getPixel(4,7,0,0)'),[239,74,68,255])))

 # Undo focus restoration persists when adjusting HEX and painting again
 page.locator('#tabColor').click()
 page.locator('#colorHex').fill('83BC8D');page.locator('#colorHex').press('Tab')
 page.locator('.tool[data-tool="pencil"]').click()
 r=page.locator('#artboard').bounding_box();z=page.evaluate('NexusStudio.getInfo().zoom');page.mouse.click(r['x']+z*5.5,r['y']+z*8.5)
 page.keyboard.press('Control+z')
 ck('Undo works after HEX editing',lambda:eq(page.evaluate('NexusStudio.getPixel(5,8)'),[0,0,0,0]))
 ck('Browser JS errors',lambda:eq(errors,[]))
 assert_screenshot(page,'workspace-functional-qa.png')

 # narrow viewport check with side dock, accessible tool and canvas
 page.set_viewport_size({'width':900,'height':700})
 page.wait_for_timeout(180)
 ck('Compact viewport still has editable canvas',lambda:(assert_visible(page,'#viewport'),assert_visible(page,'#inspector'),eq(page.locator('#viewport').bounding_box()['width']>350,True)))
 assert_screenshot(page,'workspace-900px.png')
 browser.close()
(BASE/'workspace-qa-results.json').write_text(json.dumps({'passes':sum(x['state']=='PASS' for x in CHECKS),'failures':[x for x in CHECKS if x['state']=='FAIL'],'checks':CHECKS},indent=2))
print('\nSummary:',sum(x['state']=='PASS' for x in CHECKS),'passed,',sum(x['state']=='FAIL' for x in CHECKS),'failed')


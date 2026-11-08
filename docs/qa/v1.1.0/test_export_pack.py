from pathlib import Path
from PIL import Image
import io,base64,json,zipfile,os,tempfile,atexit,shutil
from playwright.sync_api import sync_playwright

root=Path(tempfile.mkdtemp(prefix='open-pixel-v110-'))
atexit.register(shutil.rmtree, root, ignore_errors=True)
repo_js=Path(__file__).resolve().parents[3] / 'studio' / 'v110.js'
if not repo_js.is_file(): repo_js=Path(__file__).resolve().parent / 'v110.js'
if not repo_js.is_file(): raise RuntimeError('Cannot find studio/v110.js')

def cel(color):
    img=Image.new('RGBA',(4,4),color)
    b=io.BytesIO();img.save(b,format='PNG')
    return 'data:image/png;base64,'+base64.b64encode(b.getvalue()).decode()

project={'format':'NexusPixelStudio','version':1,'name':'Hero-Idle','width':4,'height':4,
'frames':[{'duration':125},{'duration':200},{'duration':300}],
'layers':[{'name':'Background','visible':True,'locked':False,'opacity':1,'cels':[cel((220,45,20,255)),cel((20,220,45,255)),cel((15,30,220,255))]},
{'name':'Hidden','visible':False,'locked':False,'opacity':1,'cels':[cel((0,0,0,255))]*3}],
'paletteKey':'CUSTOM','palette':['#DC2D14']}
extra={'format':'NexusPixelStudio','version':1,'name':'Second.Sprite','width':4,'height':4,
'frames':[{'duration':180}],
'layers':[{'name':'Layer 1','visible':True,'opacity':1,'cels':[cel((4,5,6,255))]}],
'paletteKey':'CUSTOM','palette':['#040506']}
(root/'second.npx').write_text(json.dumps(extra),encoding='utf-8')
html=f'''<!doctype html><html><head><meta charset="utf-8"><title>Pack Export Test</title></head><body>
<div class="menu-group" id="fileMenu"><div id="menu-file"><button data-action="png">PNG</button></div></div>
<button id="exportBtn" data-action="sheet">Export</button>
<script>window.NexusStudio={{toProject:()=>({json.dumps(project)}),toGIF:()=>new Uint8Array([71,73,70,56,57,97])}};</script>
<script src="v110.js"></script></body></html>'''
(root/'fixture.html').write_text(html,encoding='utf-8')

with sync_playwright() as p:
    executable=os.environ.get('PIXEL_CHROMIUM') or ('/usr/bin/chromium' if Path('/usr/bin/chromium').is_file() else None)
    browser=p.chromium.launch(headless=True,executable_path=executable,args=['--no-sandbox'] if executable else [])
    context=browser.new_context(accept_downloads=True)
    page=context.new_page()
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(html.replace('<script src="v110.js"></script>', ''))
    page.add_script_tag(content=repo_js.read_text(encoding='utf-8'))
    page.get_by_role('button',name='Export',exact=True).click()
    assert page.locator('#pixelPackDialog').is_visible(), 'dialog missing'
    assert page.locator('#pixelPackCount').inner_text()=='1 project in this archive'
    page.locator('#pixelPackEngine').select_option('all')
    page.locator('#pixelPackFiles').set_input_files(str(root/'second.npx'))
    assert page.locator('#pixelPackCount').inner_text()=='2 projects in this archive'
    with page.expect_download(timeout=30000) as dl:
        page.get_by_role('button',name='Download ZIP').click()
    download=dl.value
    output=root/download.suggested_filename
    download.save_as(output)
    page.wait_for_function("document.querySelector('#pixelPackStatus').textContent.includes('ZIP ready')",timeout=30000)
    assert not errors,errors
    # Verify configurable atlas padding/spacing and invalid input rejection.
    page.locator('#pixelPackPadding').fill('2')
    page.locator('#pixelPackSpacing').fill('1')
    assert page.evaluate("OpenPixelPack.layout(NexusStudio.toProject(),{padding:2,spacing:1}).width")==13
    with page.expect_download(timeout=30000) as padded_dl:
        page.get_by_role('button',name='Download ZIP').click()
    padded_output=root/'padded-asset-pack.zip'
    padded_dl.value.save_as(padded_output)
    assert page.evaluate("(() => {try {const doc=NexusStudio.toProject(); doc.frames[0].duration=Infinity; OpenPixelPack.verifyProject(doc);return false;} catch(e) {return /Frame duration/.test(e.message)}})()")
    # Source-only packs must not claim PNGs are included.
    page.locator('#pixelPackRaw').uncheck()
    page.locator('#pixelPackAtlas').uncheck()
    with page.expect_download(timeout=30000) as source_dl:
        page.get_by_role('button',name='Download ZIP').click()
    source_output=root/'source-only-asset-pack.zip'
    source_dl.value.save_as(source_output)
    page.locator('#pixelPackSource').uncheck()
    page.get_by_role('button',name='Download ZIP').click()
    page.wait_for_function("document.querySelector('#pixelPackStatus').textContent.includes('Select at least one asset output')")
    assert not errors,errors
    browser.close()

with zipfile.ZipFile(output) as z:
    assert z.testzip() is None
    names=z.namelist()
    print('generated zip:',output.name,'bytes',output.stat().st_size,'files',len(names))
    print('paths:',*names,sep='\n')
    assert 'manifest.json' in names
    assert 'source/Hero-Idle.npx' in names and 'source/Second-Sprite.npx' in names
    assert 'raw/Hero-Idle/frame-0003.png' in names
    assert 'atlases/Hero-Idle/sheet.png' in names
    assert 'atlases/Second-Sprite/atlas.json' in names
    assert all('engines/'+e+'/IMPORT.md' in names for e in ('unity','godot','unreal','generic'))
    assert json.loads(z.read('source/Hero-Idle.npx'))['frames'][2]['duration']==300
    atlas=json.loads(z.read('atlases/Hero-Idle/atlas.json'))
    assert [f['duration'] for f in atlas['frames']]==[125,200,300]
    assert atlas['meta']['size']=={'w':8,'h':8}
    for name,pixel in [('raw/Hero-Idle/frame-0001.png',(220,45,20,255)),('raw/Hero-Idle/frame-0003.png',(15,30,220,255)),('raw/Second-Sprite/frame-0001.png',(4,5,6,255))]:
        img=Image.open(io.BytesIO(z.read(name)))
        assert img.size==(4,4) and img.getpixel((0,0))==pixel,(name,img.size,img.getpixel((0,0)))
    manifest=json.loads(z.read('manifest.json'))
    assert len(manifest['projects'])==2
    assert set(n['path'] for n in manifest['files'])==set(names)-{'manifest.json'}
    for m in manifest['files']:
        assert m['bytes']==len(z.read(m['path']))
        assert m['crc32']==format(z.getinfo(m['path']).CRC,'08x')
print('PASS: browser ZIP export, validation, PNG fidelity, multi-project, manifest, metadata and engine guides')

with zipfile.ZipFile(padded_output) as z:
    atlas = json.loads(z.read('atlases/Hero-Idle/atlas.json'))
    assert atlas['meta']['size'] == {'w':13, 'h':13}
    assert atlas['meta']['padding'] == 2 and atlas['meta']['spacing'] == 1
    assert [tuple((f['frame']['x'],f['frame']['y'])) for f in atlas['frames']]==[(2,2),(7,2),(2,7)]
    img = Image.open(io.BytesIO(z.read('atlases/Hero-Idle/sheet.png')))
    assert img.getpixel((0,0)) == (0,0,0,0)
    assert img.getpixel((2,2)) == (220,45,20,255)
    for engine in ('unity','godot','unreal','generic'):
        mapping=json.loads(z.read(f'engines/{engine}/import-map.json'))
        assert mapping['sprites'][0]['durationsMs']==[125,200,300]
print('PASS: padding/spacing, atlas coordinates and pixels, engine import maps and invalid project rejection')

with zipfile.ZipFile(source_output) as z:
    names=z.namelist()
    assert all(not n.startswith(('raw/','atlases/')) for n in names)
    assert 'source/Hero-Idle.npx' in names
    assert 'This is a source-only archive' in z.read('engines/unity/IMPORT.md').decode()
    assert 'atlases/' not in z.read('README.md').decode()
print('PASS: source-only output and empty-selection guard')

from pathlib import Path
from PIL import Image
import subprocess,json,hashlib,zipfile,shutil,cv2,numpy as np,os
R=Path('/mnt/data/open-pixel-studio-media')
E=R/'evidence';I=R/'images';V=R/'video';RAW=R/'raw';P=R/'projects'
(E/'screenshots-raw').mkdir(exist_ok=True)
(E/'incomplete-attempts').mkdir(exist_ok=True)
for f in I.glob('[0-9][0-9]-*.png'):
 shutil.move(str(f),str(E/'screenshots-raw'/f.name))
for f in RAW.glob('*.webm'):
 if not f.name.startswith('take-'):shutil.move(str(f),str(E/'incomplete-attempts'/f.name))
# An unchanged-pixel illustrative view, upscaled NEAREST only.
a=Image.open(P/'Five-Sprite-Collection.png').convert('RGBA').resize((1600,320),Image.Resampling.NEAREST)
background=Image.new('RGB',a.size,'#18191b');background.paste(a,(0,0),a)
background.save(I/'Open-Pixel-Studio-Five-Sprite-Strip-1600x320.png')

checks=[];probes={}
def check(label,test,detail=''):
 checks.append({'check':label,'pass':bool(test),'detail':detail})
 print(('PASS ' if test else 'FAIL ')+label+(' '+str(detail) if detail else ''),flush=True)

def probe(path):
 q=subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration:stream=codec_name,codec_type,width,height,r_frame_rate,sample_rate','-of','json',str(path)],text=True)
 return json.loads(q)
for f in sorted(V.glob('*.mp4')):
 pr=probe(f);probes[f.name]=pr
 streams=pr['streams'];v=[s for s in streams if s['codec_type']=='video'];aud=[s for s in streams if s['codec_type']=='audio'];dur=float(pr['format']['duration'])
 expect=60 if '60s' in f.name else 20
 check(f'video duration {f.name}',abs(dur-expect)<.09,f'{dur:.3f}s')
 check(f'video format {f.name}',len(v)==1 and v[0]['codec_name']=='h264' and v[0]['width']==1280 and v[0]['height']==720 and v[0]['r_frame_rate']=='25/1')
 check(f'audio policy {f.name}',len(aud)==(0 if 'Silent' in f.name else 1))
 cmd=['ffmpeg','-hide_banner','-loglevel','error','-xerror','-i',str(f),'-map','0:v:0','-f','null','-']
 decode=subprocess.run(cmd,capture_output=True,text=True)
 check(f'video decodes {f.name}',decode.returncode==0,decode.stderr.strip()[:180])
# Screenshot and promotional image validations.
for f in sorted(I.glob('*.png')):
 with Image.open(f) as im:
  im.verify()
 with Image.open(f) as im:
  size=im.size
 check('image decodes '+f.name,size[0]>0 and size[1]>0,str(size))
expected_sizes={'Open-Pixel-Studio-Itch-Cover-630x500.png':(630,500),'Open-Pixel-Studio-Hero-1920x1080.png':(1920,1080),'Open-Pixel-Studio-Social-Square-1080.png':(1080,1080),'Open-Pixel-Studio-Social-Vertical-1080x1920.png':(1080,1920)}
for k,sz in expected_sizes.items():
 check('graphic dimensions '+k,Image.open(I/k).size==sz)
gif=I/'Open-Pixel-Studio-Sample-Animation.gif'
with Image.open(gif) as g:gif_frames=g.n_frames
check('animated studio GIF',gif_frames>=3,f'{gif_frames} frames')
check('studio sprite sheet',Image.open(I/'Open-Pixel-Studio-Sample-Sprite-Sheet.png').size==(64,64))
check('five original editable sprite projects',len(list(P.glob('*.npx')))==5)
check('six genuine editor screenshots',len(list(I.glob('Screenshot-*.png')))==6)
check('three retained complete video takes',len(list(RAW.glob('take-*.webm')))==3)
# Detect blank first-frame bug and widespread blank/frozen output.
f=V/'Open-Pixel-Studio-60s-Workspace-Tour.mp4';cap=cv2.VideoCapture(str(f));frame_count=int(cap.get(cv2.CAP_PROP_FRAME_COUNT));fps=cap.get(cv2.CAP_PROP_FPS)
check('master 1500 frames at 25fps',frame_count==1500 and abs(fps-25)<.05,f'{frame_count} frames')
for t in [0,0.1,3,9,19.8,20.3,31,39.8,40.3,53,59.5]:
 cap.set(cv2.CAP_PROP_POS_MSEC,t*1000);okay,fr=cap.read()
 white=okay and fr.mean()>240
 dark=okay and fr.mean()<10
 check(f'master visible frame {t:g}s',okay and not white and not dark,round(fr.mean(),1) if okay else 'missing')
cap.release()
source=Path('/mnt/data/Nexus-Pixel-Studio-v0.2.0-Standalone.html');src_sha=hashlib.sha256(source.read_bytes()).hexdigest()
paths=[p for p in R.rglob('*') if p.is_file() and p.name not in ['manifest-sha256.json','QA-Results.json']]
manifest={'marketing_name':'Open Pixel Studio','source_app':'Nexus Pixel Studio v0.2.0','branding_scope':'media only','source_app_sha256':src_sha,'files':{str(x.relative_to(R)):hashlib.sha256(x.read_bytes()).hexdigest() for x in sorted(paths)}}
(E/'manifest-sha256.json').write_text(json.dumps(manifest,indent=2))
results={'pass':sum(x['pass'] for x in checks),'failed':sum(not x['pass'] for x in checks),'checks':checks,'video_probes':probes,'source_sha256':src_sha}
(E/'QA-Results.json').write_text(json.dumps(results,indent=2))
check('no failed checks',results['failed']==0)
# zip all curated deliverables as one publication-ready-to-review archive.
archive=Path('/mnt/data/Open-Pixel-Studio-v0.2.0-Media-Pack.zip')
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for f in sorted(R.rglob('*')):
  if f.is_file():z.write(f,f.relative_to(R.parent))
with zipfile.ZipFile(archive) as z:
 bad=z.testzip()
 print('ZIP ENTRIES',len(z.infolist()),'ZIP BYTES',archive.stat().st_size,'ZIP CORRUPT',bad)
 assert not bad
assert results['failed']==0
print('QA SUMMARY',results['pass'],'passes 0 failures')

from pathlib import Path
import numpy as np,wave,subprocess,json,hashlib
R=Path('/mnt/data/open-pixel-studio-media')
vid=R/'video';raw=R/'raw';evidence=R/'evidence'
sr=32000;duration=60
# Original understated electronic score, NOT studio/game audio.
audio=np.zeros(sr*duration,np.float32)
scale=[220,261.625565,293.664768,329.627557]
for bar in range(30):
 start=bar*2.0
 root=scale[(bar//4)%4]
 for beat in range(4):
  at=start+beat*.5
  if at>=60:break
  n=int(sr*.37);t=np.arange(n,dtype=np.float32)/sr
  freq=root*(2 if beat==2 else 1)
  env=np.exp(-t*8)*(1-np.exp(-t*75))
  tone=(.35*np.sin(2*np.pi*freq*t)+.12*np.sin(2*np.pi*freq*2*t))*env
  i=int(at*sr);audio[i:i+n]+=tone
 # sustained muted chord with soft fade
 n=int(sr*2);t=np.arange(n,dtype=np.float32)/sr
 a=0.10*(np.sin(2*np.pi*(root/2)*t)+.50*np.sin(2*np.pi*root*1.5*t))
 a*=np.minimum(1,t/0.15)*np.minimum(1,(2-t)/0.5)
 i=int(start*sr);audio[i:i+n]+=a
# musical texture only, original score; no fake app sounds
fade=np.minimum(1,np.arange(len(audio))/sr/1.5)*np.minimum(1,(len(audio)-np.arange(len(audio)))/sr/2.5)
audio=np.clip(audio*fade*.28,-.9,.9)
pcm=(audio*32767).astype('<i2')
wav=evidence/'original-promotional-score.wav'
with wave.open(str(wav),'wb') as f:f.setnchannels(1);f.setsampwidth(2);f.setframerate(sr);f.writeframes(pcm.tobytes())

f=vid/'Open-Pixel-Studio-60s-Workspace-Tour.mp4'
font='/usr/share/fonts/truetype/lato/Lato-Heavy.ttf'
reg='/usr/share/fonts/truetype/lato/Lato-Regular.ttf'
# Lower thirds only: remain separate from authentic captured application footage.
filters=(
 '[0:v]trim=start=0.5:duration=20,setpts=PTS-STARTPTS,fps=25,scale=1280:720,format=yuv420p[a];'
 '[1:v]trim=start=0.5:duration=20,setpts=PTS-STARTPTS,fps=25,scale=1280:720,format=yuv420p[b];'
 '[2:v]trim=start=0.5:duration=20,setpts=PTS-STARTPTS,fps=25,scale=1280:720,format=yuv420p[c];'
 '[a][b][c]concat=n=3:v=1:a=0,format=yuv420p,'
 "drawbox=x=52:y=383:w=530:h=124:color=black@0.85:t=fill:enable='between(t,0,5)',"
 "drawbox=x=52:y=383:w=8:h=124:color=0xe04a48:t=fill:enable='between(t,0,5)',"
 f"drawtext=fontfile={font}:text='OPEN PIXEL STUDIO':x=76:y=396:fontsize=43:fontcolor=white:enable='between(t,0,5)',"
 f"drawtext=fontfile={reg}:text='BY LUMINARY LABS   /   REAL EDITOR CAPTURE':x=77:y=459:fontsize=19:fontcolor=0x83bc8d:enable='between(t,0,5)',"
 "drawbox=x=52:y=402:w=495:h=82:color=black@0.83:t=fill:enable='between(t,20,23.5)',"
 "drawbox=x=52:y=402:w=8:h=82:color=0xe04a48:t=fill:enable='between(t,20,23.5)',"
 f"drawtext=fontfile={font}:text='DRAW + REFINE':x=75:y=424:fontsize=31:fontcolor=white:enable='between(t,20,23.5)',"
 "drawbox=x=52:y=402:w=485:h=82:color=black@0.83:t=fill:enable='between(t,40,43.5)',"
 "drawbox=x=52:y=402:w=8:h=82:color=0xe04a48:t=fill:enable='between(t,40,43.5)',"
 f"drawtext=fontfile={font}:text='LAYERS + FRAMES':x=75:y=424:fontsize=31:fontcolor=white:enable='between(t,40,43.5)'"
 '[v]'
)
cmd=['ffmpeg','-hide_banner','-loglevel','error','-y', '-i',str(raw/'take-01.webm'),'-i',str(raw/'take-02.webm'),'-i',str(raw/'take-03.webm'),'-i',str(wav),'-filter_complex',filters,'-map','[v]','-map','3:a:0', '-c:v','libx264','-crf','18','-preset','veryfast','-pix_fmt','yuv420p','-r','25','-c:a','aac','-b:a','128k','-movflags','+faststart','-t','60',str(f)]
print('Creating 60s walkthrough...',flush=True)
subprocess.run(cmd,check=True)
# Three independent 20-second edits, distinct visual themes and source sequences.
for idx,title in enumerate(['01-Drawing-and-Workspace','02-Colors-and-Tools','03-Layers-and-Animation'],1):
 out=vid/f'Open-Pixel-Studio-{title}-20s.mp4'
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(raw/f'take-{idx:02d}.webm'),'-i',str(wav),'-ss','0.5','-t','20','-map','0:v:0','-map','1:a:0','-c:v','libx264','-crf','19','-preset','veryfast','-pix_fmt','yuv420p','-r','25','-c:a','aac','-b:a','96k','-movflags','+faststart',str(out)],check=True)
 print(out.name, out.stat().st_size,flush=True)
# Silent studio demonstrator alternative: no external soundtrack.
silent=vid/'Open-Pixel-Studio-60s-Workspace-Tour-Silent.mp4'
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(f),'-c:v','copy','-an','-movflags','+faststart',str(silent)],check=True)
print('Master',f.stat().st_size,flush=True)

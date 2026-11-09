/* Nexus Pixel Studio v0.1 — self-contained HTML Canvas pixel editor.
   RGBA document model: a separate transparent canvas for every layer/frame cel.
   Data stays on the user's device; no accounts or remote services required. */
'use strict';
const $ = id => document.getElementById(id);
const PALETTES = {
 DB32:['000000','222034','45283C','663931','8F563B','DF7126','D9A066','EEC39A','FBF236','99E550','6ABE30','37946E','4B692F','524B24','323C39','3F3F74','306082','5B6EE1','639BFF','5FCDE4','CBDBFC','FFFFFF','9BADB7','847E87','696A6A','595652','76428A','AC3232','D95763','D77BBA','8F974A','8A6F30'],
 PICO8:['000000','1D2B53','7E2553','008751','AB5236','5F574F','C2C3C7','FFF1E8','FF004D','FFA300','FFEC27','00E436','29ADFF','83769C','FF77A8','FFCCAA'],
 FANTASY:['101626','1A2846','263861','354D74','52749D','7A9FB0','CCE7C3','F8F5C9','182D29','245C4D','3E8665','78B879','B7DE88','E1F5B1','50416A','7A5B99','A18CC6','DBA2D4','653A41','A85B50','DE8965','F5BC7D','FFE1A1','FFFFFF']
};
const $canvas=()=>document.createElement('canvas');
function makeCanvas(w,h){const c=$canvas();c.width=w;c.height=h;return c}
function ctx(c){return c.getContext('2d',{willReadFrequently:true})}
function id(){return Math.random().toString(36).slice(2,9)}
function clamp(x,a,b){return Math.min(b,Math.max(a,x))}
function hexToRGB(h){const v=h.replace('#','');return [parseInt(v.slice(0,2),16),parseInt(v.slice(2,4),16),parseInt(v.slice(4,6),16)]}
function rgbToHex(r,g,b){return '#'+[r,g,b].map(x=>Math.round(x).toString(16).padStart(2,'0')).join('')}
function normalHex(h){return /^#?[a-fA-F0-9]{6}$/.test(h)?'#'+h.replace('#','').toUpperCase():null}
function safeName(s){return (s||'sprite').replace(/[^a-z0-9_-]+/ig,'-').slice(0,65)}
function layer(name,w,h,count){return {id:id(),name,visible:true,locked:false,opacity:1,cels:Array.from({length:count},()=>makeCanvas(w,h))}}
function blankProject(w,h,name,white=false){const result={format:'NexusPixelStudio',version:1,name,width:w,height:h,frames:[{duration:125}],layers:[layer(white?'Background':'Layer 1',w,h,1)],paletteKey:'DB32',palette:PALETTES.DB32.map(x=>'#'+x)};if(white){const c=ctx(result.layers[0].cels[0]);c.fillStyle='#ffffff';c.fillRect(0,0,w,h)}return result}
function seedProject(){
 const w=48,h=48,n=4;const result={format:'NexusPixelStudio',version:1,name:'Slime Study',width:w,height:h,frames:Array.from({length:n},()=>({duration:150})),layers:[layer('Ground',w,h,n),layer('Slime',w,h,n),layer('Highlights',w,h,n)],paletteKey:'FANTASY',palette:PALETTES.FANTASY.map(x=>'#'+x)};
 function block(c,col,x,y,wd=1,ht=1){c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),wd,ht)}
 for(let f=0;f<n;f++){
  const g=ctx(result.layers[0].cels[f]);const y= f===3?1:(f===1?-1:0);
  for(let x=5;x<=43;x++){
   const dy=Math.pow((x-24)/20,2);
   for(let py=36;py<=40-dy*4;py++)block(g,py<=37?'#245C4D':(py===38?'#3E8665':'#354D74'),x,py);
   if(x%7===1)block(g,'#78B879',x,35+(x%3));
  }
  for(let x=13;x<=35;x++)block(g,'#182D29',x,37,1,2);
  const s=ctx(result.layers[1].cels[f]);
  // Pixel-defined slime body, fully editable on each cel.
  for(let py=14;py<=35;py++){
   let half=py<17?5+py-14:py<23?10+Math.floor((py-17)/2):py<33?13:13-(py-33)*2;
   if(py>=33)half=13-(py-33);
   const left=24-half, right=24+half;
   for(let x=left;x<=right;x++){
    let color='#245C4D';
    if(x>left+1&&x<right-1&&py>15)color=py<23?'#78B879':(x<20?'#3E8665':'#78B879');
    if(x>23&&py<30&&x<right-2)color='#B7DE88';
    if(py>=32&&x>left+3&&x<right-2)color='#3E8665';
    block(s,color,x,py+y);
   }
  }
  block(s,'#E1F5B1',17,18+y,5,2);block(s,'#E1F5B1',16,20+y,3,4);
  block(s,'#182D29',18,25+y,4,5);block(s,'#182D29',27,25+y,4,5);
  if(f!==2){block(s,'#F8F5C9',18,25+y,3,3);block(s,'#F8F5C9',27,25+y,3,3);block(s,'#263861',20,26+y,1,2);block(s,'#263861',28,26+y,1,2)}
  else{block(s,'#182D29',18,27+y,3,1);block(s,'#182D29',27,27+y,3,1)}
  block(s,'#245C4D',23,31+y,4,1);block(s,'#182D29',24,32+y,2,1);
  block(s,'#DE8965',16,29+y,2,2);block(s,'#DE8965',31,29+y,2,2);
  const hctx=ctx(result.layers[2].cels[f]);
  const sparkles=[[9,14],[39,12],[7,29],[40,27],[35,5]];
  for(let i=0;i<sparkles.length;i++){
   const [x,sy]=sparkles[i];if((i+f)%3===0)continue;
   block(hctx,i%2?'#CCE7C3':'#F8F5C9',x+(f%2),sy);block(hctx,'#7A9FB0',x+(f%2)-1,sy+1);if((i+f)%2===0){block(hctx,'#CCE7C3',x+(f%2),sy-2);block(hctx,'#CCE7C3',x+(f%2),sy+2)}
  }
 }
 return result;
}
let project, history=[], future=[];
let state={tool:'pencil',frame:0,layer:1,fg:'#A6E35F',bg:'#263861',brush:1,brushShape:'square',pixelPerfect:true,pressureEnabled:true,ditherPattern:'checker',zoom:8,panX:0,panY:0,grid:false,onion:false,symX:false,symY:false,filled:false,playing:false,selection:null,clipboard:null,drag:null,space:false,dirty:false};
const maxHistory=24, historyMemoryLimit=80*1024*1024;
const documentMemoryLimit=96*1024*1024;
function fitsMemoryBudget(width=project.width,height=project.height,frames=project.frames.length,layers=project.layers.length){return width*height*4*frames*layers<=documentMemoryLimit}
let autosaveTimer=null,toastTimer=null,renderCount=0,animationTime=0,animationLast=0;
let changeSequence=0, writeQueue=Promise.resolve(), projectDBPromise=null;
const LEGACY_AUTOSAVE_KEY='nexus-pixel-studio-autosave-v1';
function openProjectDB(){
 if(!window.indexedDB)return Promise.resolve(null);
 if(!projectDBPromise)projectDBPromise=new Promise(resolve=>{
  try{const request=window.indexedDB.open('open-pixel-studio-v110',1);
   request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('projects'))request.result.createObjectStore('projects')};
   request.onsuccess=()=>resolve(request.result);request.onerror=()=>resolve(null);request.onblocked=()=>resolve(null);
  }catch(error){console.warn('IndexedDB unavailable',error);resolve(null)}
 });
 return projectDBPromise;
}
async function saveBrowserSnapshot(snapshot){
 const db=await openProjectDB();
 if(db){try{await new Promise((resolve,reject)=>{
  const tx=db.transaction('projects','readwrite');tx.objectStore('projects').put(snapshot,'autosave');
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||Error('IndexedDB transaction failed'));
  tx.onabort=()=>reject(tx.error||Error('IndexedDB transaction aborted'));
 });return 'IndexedDB'}catch(error){console.warn('IndexedDB autosave failed',error)}}
 try{localStorage.setItem(LEGACY_AUTOSAVE_KEY,JSON.stringify(snapshot));return 'localStorage'}
 catch(error){console.warn('Browser autosave unavailable',error);throw error}
}
async function loadBrowserSnapshot(){
 const db=await openProjectDB();
 if(db){try{const data=await new Promise((resolve,reject)=>{
  const tx=db.transaction('projects','readonly'),req=tx.objectStore('projects').get('autosave');
  req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error||Error('IndexedDB read failed'));
 });if(data)return data}catch(error){console.warn('IndexedDB recovery failed',error)}}
 try{const data=localStorage.getItem(LEGACY_AUTOSAVE_KEY);return data?JSON.parse(data):null}
 catch(error){console.warn('Legacy browser storage unavailable',error);return null}
}
function selectedLayer(){return project.layers[state.layer]}
function selectedCel(){return selectedLayer().cels[state.frame]}
function copyCel(c){const copy=makeCanvas(c.width,c.height);ctx(copy).drawImage(c,0,0);return copy}
function capture(){return {name:project.name,width:project.width,height:project.height,frames:project.frames.map(f=>({...f})),layers:project.layers.map(l=>({id:l.id,name:l.name,visible:l.visible,locked:l.locked,opacity:l.opacity,pixels:l.cels.map(c=>ctx(c).getImageData(0,0,c.width,c.height))})),palette:[...project.palette],paletteKey:project.paletteKey,frame:state.frame,layer:state.layer}}
function restore(s){project={format:'NexusPixelStudio',version:1,name:s.name,width:s.width,height:s.height,frames:s.frames.map(x=>({...x})),palette:[...s.palette],paletteKey:s.paletteKey,layers:s.layers.map(l=>({id:l.id,name:l.name,visible:l.visible,locked:l.locked,opacity:l.opacity,cels:l.pixels.map(p=>{const c=makeCanvas(s.width,s.height);ctx(c).putImageData(p,0,0);return c})}))};state.frame=clamp(s.frame,0,project.frames.length-1);state.layer=clamp(s.layer,0,project.layers.length-1);state.selection=null;state.selectionMask=null;state.sg2Polygon=null;state.playing=false;refreshAll();changed()}
function memoryOf(s){return s.width*s.height*4*s.frames.length*s.layers.length}
function checkpoint(){history.push(capture());future=[];while(history.length>maxHistory)history.shift();let size=history.reduce((n,s)=>n+memoryOf(s),0);while(history.length>1&&size>historyMemoryLimit){size-=memoryOf(history.shift())}updateUndoButtons()}
function undo(){if(!history.length)return;future.push(capture());restore(history.pop());updateUndoButtons();toast('Undo applied')}
function redo(){if(!future.length)return;history.push(capture());restore(future.pop());updateUndoButtons();toast('Redo applied')}
function updateUndoButtons(){$('undoBtn').disabled=!history.length;$('redoBtn').disabled=!future.length}
function changed(){changeSequence++;state.dirty=true;$('dirtyDot').classList.add('dirty');$('saveStatus').textContent='Unsaved changes';clearTimeout(autosaveTimer);autosaveTimer=setTimeout(autosave,800)}
function autosave(){
 clearTimeout(autosaveTimer);
 const version=changeSequence;
 let snapshot;try{snapshot=serialize()}catch(error){$('saveStatus').textContent='Save project to file';console.warn('Autosave serialization failed',error);return}
 writeQueue=writeQueue.catch(()=>{}).then(()=>saveBrowserSnapshot(snapshot));
 writeQueue.then(target=>{if(version!==changeSequence)return;state.dirty=false;$('dirtyDot').classList.remove('dirty');$('saveStatus').textContent=target==='IndexedDB'?'Saved in browser':'Saved locally'})
  .catch(error=>{if(version===changeSequence)$('saveStatus').textContent='Save project to file';console.warn('Autosave skipped:',error)});
}
function serialize(){return {...Object.fromEntries(['format','version','name','width','height','frames','paletteKey','palette'].map(k=>[k,project[k]])),layers:project.layers.map(l=>({id:l.id,name:l.name,visible:l.visible,locked:l.locked,opacity:l.opacity,cels:l.cels.map(c=>c.toDataURL('image/png'))}))}}
async function loadSerialized(data){
 if(data?.format!=='NexusPixelStudio'||!Number.isInteger(data.width)||!Number.isInteger(data.height)||data.width<1||data.height<1||data.width>512||data.height>512||!Array.isArray(data.frames)||!data.frames.length||data.frames.length>128||!Array.isArray(data.layers)||!data.layers.length||data.layers.length>64)throw Error('Invalid or unsupported Nexus Pixel project');
 if(data.frames.length*data.layers.length*data.width*data.height*4>documentMemoryLimit)throw Error('Project exceeds safe editor memory budget');
 const loaded={format:'NexusPixelStudio',version:1,name:String(data.name||'Imported').slice(0,60),width:data.width,height:data.height,frames:data.frames.map(f=>({duration:clamp(Number(f.duration)||125,20,5000)})),paletteKey:data.paletteKey||'CUSTOM',palette:Array.isArray(data.palette)?data.palette.map(normalHex).filter(Boolean).slice(0,256):[...PALETTES.DB32],layers:[]};
 for(const l of data.layers){if(!Array.isArray(l.cels)||l.cels.length!==loaded.frames.length)throw Error('Missing cels in layer');const next=layer(String(l.name||'Layer'),loaded.width,loaded.height,loaded.frames.length);next.id=String(l.id||id());next.visible=l.visible!==false;next.locked=!!l.locked;next.opacity=clamp(Number(l.opacity??1),0,1);
  for(let f=0;f<l.cels.length;f++){if(typeof l.cels[f]!=='string'||!l.cels[f].startsWith('data:image/png;base64,'))throw Error('Invalid cel image');const im=new Image();im.src=l.cels[f];await im.decode();if(im.width!==loaded.width||im.height!==loaded.height)throw Error('Cel dimensions mismatch');ctx(next.cels[f]).drawImage(im,0,0)}loaded.layers.push(next)}
 project=loaded;state.frame=0;state.layer=loaded.layers.length-1;state.selection=null;state.selectionMask=null;state.sg2Polygon=null;state.playing=false;history=[];future=[];refreshAll();changed();toast('Project opened')
}
function composeFrame(index,onlyVisible=true){const out=makeCanvas(project.width,project.height),c=ctx(out);for(const l of project.layers){if(onlyVisible&&!l.visible)continue;c.globalAlpha=l.opacity;c.drawImage(l.cels[index],0,0)}c.globalAlpha=1;return out}
function celHasPixels(canvas){const data=ctx(canvas).getImageData(0,0,canvas.width,canvas.height).data;for(let i=3;i<data.length;i+=4)if(data[i])return true;return false}
function renderCanvas(){const w=project.width,h=project.height;const main=$('renderCanvas'),oc=$('onionCanvas');if(main.width!==w||main.height!==h){main.width=oc.width=$('interactiveCanvas').width=w;main.height=oc.height=$('interactiveCanvas').height=h}const composed=composeFrame(state.frame);const m=ctx(main);m.clearRect(0,0,w,h);m.drawImage(composed,0,0);
 const o=ctx(oc);o.clearRect(0,0,w,h);if(state.onion&&project.frames.length>1){o.globalAlpha=.28;o.drawImage(composeFrame((state.frame-1+project.frames.length)%project.frames.length),0,0);o.globalAlpha=.13;o.drawImage(composeFrame((state.frame+1)%project.frames.length),0,0);o.globalAlpha=1}
 const p=$('previewCanvas');if(p.width!==w||p.height!==h){p.width=w;p.height=h}const pc=ctx(p);pc.clearRect(0,0,w,h);pc.drawImage(composed,0,0);$('previewFrame').textContent=`${String(state.frame+1).padStart(2,'0')} / ${String(project.frames.length).padStart(2,'0')}`;renderCount++}
function updateArtboard(){const w=project.width*state.zoom,h=project.height*state.zoom;const a=$('artboard');a.style.width=w+'px';a.style.height=h+'px';a.style.marginLeft=state.panX+'px';a.style.marginTop=state.panY+'px';$('zoomValue').textContent=Math.round(state.zoom*100)+'%';const g=$('pixelGrid');g.classList.toggle('on',state.grid&&state.zoom>=7);g.style.backgroundImage='linear-gradient(90deg,#0b162a41 1px, transparent 1px),linear-gradient(#0b162a41 1px, transparent 1px)';g.style.backgroundSize=`${state.zoom}px ${state.zoom}px`;g.style.backgroundPosition='0 0';updateSelectionBox()}
function updateSelectionBox(){const s=state.selection,box=$('selectionBox'),exact=!!state.selectionMask&&state.selectionMask.length===project.width*project.height;if(!s||s.w<1||s.h<1||exact){box.hidden=true}else{box.hidden=false;box.style.left=s.x*state.zoom+'px';box.style.top=s.y*state.zoom+'px';box.style.width=s.w*state.zoom+'px';box.style.height=s.h*state.zoom+'px'}sg2DrawSelectionOverlay()}
function setZoom(value,around=null){state.zoom=clamp(Math.round(value),2,32);updateArtboard()}
function fit(){const v=$('viewport');state.panX=0;state.panY=0;setZoom(Math.floor(Math.min((v.clientWidth-140)/project.width,(v.clientHeight-100)/project.height,16))||2)}
function updateTimeline(){
 const n=project.frames.length,grid=$('timelineGrid');grid.replaceChildren();grid.style.gridTemplateColumns=`171px repeat(${n}, 58px)`;
 const head=document.createElement('div');head.className='timeline-header';head.textContent='LAYERS / FRAMES';grid.append(head);
 for(let f=0;f<n;f++){const b=document.createElement('button');b.className='frame-header'+(f===state.frame?' active':'');b.innerHTML=`${String(f+1).padStart(2,'0')}`;b.title=`Frame ${f+1} · ${project.frames[f].duration} ms`;b.onclick=()=>{state.frame=f;renderCanvas();updateTimeline();updateMetadata()};grid.append(b)}
 for(let i=project.layers.length-1;i>=0;i--){const l=project.layers[i];const lab=document.createElement('div');lab.className='timeline-layer'+(i===state.layer?' active':'');
 const eye=document.createElement('button');eye.className='layer-visibility'+(l.visible?'':' off');eye.textContent=l.visible?'◉':'◌';eye.title='Toggle visibility';eye.onclick=()=>{checkpoint();l.visible=!l.visible;refreshAll();changed()};
 const lock=document.createElement('button');lock.className='layer-lock'+(l.locked?' locked':'');lock.textContent=l.locked?'▣':'♙';lock.title='Toggle lock';lock.onclick=()=>{checkpoint();l.locked=!l.locked;refreshAll();changed()};
 const nam=document.createElement('button');nam.className='layer-label';nam.textContent=l.name;nam.title='Select; double-click to rename';nam.onclick=()=>{state.layer=i;refreshAll()};nam.ondblclick=()=>{const value=prompt('Layer name',l.name);if(value?.trim()){checkpoint();l.name=value.trim().slice(0,40);refreshAll();changed()}};
 lab.append(eye,lock,nam);grid.append(lab);
 for(let f=0;f<n;f++){const c=l.cels[f],cell=document.createElement('button');cell.className='cel'+(state.layer===i&&state.frame===f?' active':'')+(state.frame===f?' current-frame':'');cell.title=`${l.name} / Frame ${f+1}`;if(celHasPixels(c)){const img=new Image();img.src=c.toDataURL();cell.append(img)}else{const empty=document.createElement('i');empty.className='cel-empty';cell.append(empty)}cell.onclick=()=>{state.frame=f;state.layer=i;refreshAll()};grid.append(cell)}
 }
 $('frameCountLabel').textContent=`${n} frame${n===1?'':'s'}`;
}
function updateInspector(){const l=selectedLayer();document.title=project.name+' — Nexus Pixel Studio';$('docName').value=project.name;$('docMeta').textContent=`${project.width} × ${project.height} px · RGBA`;$('sizeLabel').textContent=`${project.width} × ${project.height}`;$('previewName').textContent=project.name;$('layerName').value=l.name;$('layerOpacity').value=Math.round(l.opacity*100);$('opacityReadout').textContent=Math.round(l.opacity*100)+'%';$('toggleLayerVisibility').textContent=l.visible?'◉ Visible':'◌ Hidden';$('toggleLayerLock').textContent=l.locked?'▣ Locked':'♙ Unlocked';$('layerIndex').textContent=`${String(state.layer+1).padStart(2,'0')} / ${String(project.layers.length).padStart(2,'0')}`;
 $('activeCellLabel').textContent=`${l.name} · Frame ${state.frame+1}`;$('fpsInput').value=clamp(Math.round(1000/project.frames[state.frame].duration),1,30);$('canvasToolName').textContent=state.tool.replace(/^[a-z]/,c=>c.toUpperCase());$('statusTool').textContent=state.tool.toUpperCase();
 $('brushSize').value=state.brush;$('brushSizeLabel').textContent=state.brush+' px';$('sg2BrushShape').value=state.brushShape;$('sg2DitherPattern').value=state.ditherPattern;$('sg2PixelPerfect').setAttribute('aria-pressed',String(state.pixelPerfect));$('sg2Pressure').setAttribute('aria-pressed',String(state.pressureEnabled));document.querySelectorAll('[data-sg2-preset]').forEach(b=>b.classList.toggle('selected',Number(b.dataset.sg2Preset)===state.brush));$('gridToggle').classList.toggle('selected',state.grid);$('onionToggle').classList.toggle('selected',state.onion);$('symXToggle').classList.toggle('selected',state.symX);$('symYToggle').classList.toggle('selected',state.symY);$('filledToggle').classList.toggle('selected',state.filled);
 $('fgSwatch').style.background=state.fg;$('bgSwatch').style.background=state.bg;$('colorHex').value=state.fg.slice(1);$('colorPicker').value=state.fg.toLowerCase();
 $('paletteSelect').value=project.paletteKey in PALETTES||project.paletteKey==='CUSTOM'?project.paletteKey:'CUSTOM';
 $('paletteGrid').replaceChildren();project.palette.forEach((color,i)=>{const sw=document.createElement('button');sw.className='palette-swatch'+(state.fg.toLowerCase()===color.toLowerCase()?' active':'');sw.style.background=color;sw.title=`${i+1}: ${color}`;sw.onclick=e=>{if(e.button===2)return;setForeground(color)};sw.oncontextmenu=e=>{e.preventDefault();state.bg=color;updateInspector()};sw.ondblclick=()=>{const value=prompt('Edit palette color (HEX)',color);const updated=normalHex(value||'');if(updated){checkpoint();project.paletteKey='CUSTOM';project.palette[i]=updated;updateInspector();changed()}};$('paletteGrid').append(sw)});$('paletteInfo').textContent=project.palette.length+' swatches';
 document.querySelectorAll('[data-tool]').forEach(b=>b.classList.toggle('active',b.dataset.tool===state.tool));$('playBtn').textContent=state.playing?'❚❚':'▶';$('previewToggle').textContent=state.playing?'❚❚':'▶';updateUndoButtons()}
function updateMetadata(){$('activeCellLabel').textContent=selectedLayer().name+' · Frame '+(state.frame+1);$('fpsInput').value=clamp(Math.round(1000/project.frames[state.frame].duration),1,30)}
function refreshAll(){renderCanvas();updateArtboard();updateInspector();updateTimeline()}
function toast(message){const t=$('toast');t.textContent=message;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2500)}
function setForeground(col){const c=normalHex(col);if(!c)return;state.fg=c;updateInspector()}
function swapColors(){[state.fg,state.bg]=[state.bg,state.fg];updateInspector()}
function setTool(tool){if(tool!=='select-polygon')sg2PolygonCancel();state.tool=tool;state.drag=null;updateInspector()}
// ----- Pixel operations: integer coordinates; no anti-aliasing -----
function canvasPoint(e){const r=$('artboard').getBoundingClientRect();return {x:Math.floor((e.clientX-r.left)/state.zoom),y:Math.floor((e.clientY-r.top)/state.zoom)}}
function inside(x,y){return x>=0&&y>=0&&x<project.width&&y<project.height}
function withinSelection(x,y){const s=state.selection;if(!s)return true;const m=state.selectionMask;if(m&&m.length===project.width*project.height)return !!m[y*project.width+x];return x>=s.x&&y>=s.y&&x<s.x+s.w&&y<s.y+s.h}

function sg2Pressure(e){return state.pressureEnabled&&e.pointerType==='pen'&&Number(e.pressure)>0?clamp(Number(e.pressure),.15,1):1}
function sg2DitherAllows(x,y){
 if(state.ditherPattern==='checker')return (x+y)%2===0;
 const bayer=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
 const threshold=state.ditherPattern==='bayer25'?4:state.ditherPattern==='bayer75'?12:8;
 return bayer[((y%4)+4)%4][((x%4)+4)%4]<threshold;
}
function paintPixel(c,x,y,color,eraser=false,dither=false,pressure=1){
 const w=project.width,h=project.height,size=clamp(Math.round(state.brush*pressure),1,16),off=Math.floor((size-1)/2);
 const centers=[[x,y]];
 if(state.symX)centers.push([w-1-x,y]);
 if(state.symY){centers.push([x,h-1-y]);if(state.symX)centers.push([w-1-x,h-1-y])}
 for(const [cx,cy] of centers){
  const bx=cx-off,by=cy-off,mid=(size-1)/2;
  for(let py=by;py<by+size;py++)for(let px=bx;px<bx+size;px++){
   if(!inside(px,py)||!withinSelection(px,py))continue;
   if(state.brushShape==='circle'&&Math.hypot(px-bx-mid,py-by-mid)>size/2-(size%2?.5:.1))continue;
   if(dither&&!sg2DitherAllows(px,py))continue;
   if(eraser)c.clearRect(px,py,1,1);else{c.fillStyle=color;c.fillRect(px,py,1,1)}
  }
 }
}
function bresenham(x0,y0,x1,y1,fn){
 let dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1,err=dx+dy;
 while(true){fn(x0,y0);if(x0===x1&&y0===y1)break;const e=2*err;if(e>=dy){err+=dy;x0+=sx}if(e<=dx){err+=dx;y0+=sy}}
}
function strokeSegment(c,a,b,color,eraser=false,dither=false,pressure=1){
 bresenham(a.x,a.y,b.x,b.y,(x,y)=>paintPixel(c,x,y,color,eraser,dither,pressure))
}
// For a one-pixel freehand stroke, suppress the pixel at an orthogonal corner.
// The path is restored from its pre-stroke snapshot before each redraw, so undo,
// erasure, overlap and transparent source pixels remain deterministic.
function sg2AppendPath(points,a,b,pressure){
 bresenham(a.x,a.y,b.x,b.y,(x,y)=>{
  const last=points[points.length-1];
  if(!last||last.x!==x||last.y!==y)points.push({x,y,pressure});
 });
}
function sg2DrawPath(c,points,color){
 for(let i=0;i<points.length;i++){
  const a=points[i-1],b=points[i],d=points[i+1];
  const corner=a&&d&&Math.abs(a.x-d.x)===1&&Math.abs(a.y-d.y)===1
   &&((a.x===b.x&&b.y===d.y)||(a.y===b.y&&b.x===d.x));
  if(!corner)paintPixel(c,b.x,b.y,color,false,false,b.pressure);
 }
}
function drawShape(c,tool,a,b,color){
 const x0=Math.min(a.x,b.x),y0=Math.min(a.y,b.y),x1=Math.max(a.x,b.x),y1=Math.max(a.y,b.y);
 const d=(x,y)=>paintPixel(c,x,y,color,false,false);
 if(tool==='line'){bresenham(a.x,a.y,b.x,b.y,d);return}
 if(tool==='rect'){if(state.filled){for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)d(x,y)}else{bresenham(x0,y0,x1,y0,d);bresenham(x0,y1,x1,y1,d);bresenham(x0,y0,x0,y1,d);bresenham(x1,y0,x1,y1,d)}return}
 if(tool==='ellipse'){
  const rx=(x1-x0)/2,ry=(y1-y0)/2,cx=(x0+x1)/2,cy=(y0+y1)/2;
  if(rx===0||ry===0){bresenham(x0,y0,x1,y1,d);return}
  if(state.filled){for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){if(Math.pow((x-cx)/rx,2)+Math.pow((y-cy)/ry,2)<=1.05)d(x,y)}}
  else{const steps=Math.ceil(2*Math.PI*Math.max(rx,ry)*3);for(let i=0;i<=steps;i++){const t=i/steps*2*Math.PI;d(Math.round(cx+rx*Math.cos(t)),Math.round(cy+ry*Math.sin(t)))}}
 }
}
function floodFill(c,x,y,color){if(!inside(x,y)||!withinSelection(x,y))return;const w=project.width,h=project.height,cx=ctx(c),image=cx.getImageData(0,0,w,h),data=image.data;const start=(y*w+x)*4,target=Array.from(data.slice(start,start+4)),newCol=[...hexToRGB(color),255];if(target.every((v,i)=>v===newCol[i]))return;
 const visited=new Uint8Array(w*h),stack=[y*w+x];while(stack.length){const n=stack.pop();if(visited[n])continue;visited[n]=1;const xx=n%w,yy=Math.floor(n/w),offset=n*4;if(!withinSelection(xx,yy))continue;if(data[offset]!==target[0]||data[offset+1]!==target[1]||data[offset+2]!==target[2]||data[offset+3]!==target[3])continue;data.set(newCol,offset);
  if(xx>0)stack.push(n-1);if(xx<w-1)stack.push(n+1);if(yy>0)stack.push(n-w);if(yy<h-1)stack.push(n+w)
 }cx.putImageData(image,0,0)}
function pickColor(x,y){if(!inside(x,y))return;const d=ctx(composeFrame(state.frame)).getImageData(x,y,1,1).data;if(!d[3]){toast('Transparent pixel');return}setForeground(rgbToHex(d[0],d[1],d[2]))}
function normRect(a,b){const x=clamp(Math.min(a.x,b.x),0,project.width-1),y=clamp(Math.min(a.y,b.y),0,project.height-1),ex=clamp(Math.max(a.x,b.x),0,project.width-1),ey=clamp(Math.max(a.y,b.y),0,project.height-1);return {x,y,w:ex-x+1,h:ey-y+1}}
function finishDraw(){state.drag=null;renderCanvas();updateTimeline();updateSelectionBox();changed()}
function stopPlayback(){if(!state.playing)return;state.playing=false;updateInspector()}
function handlePointerDown(e){if(e.button!==0&&e.button!==1&&e.button!==2)return;e.preventDefault();const target=$('viewport');target.focus({preventScroll:true});const point=canvasPoint(e);const pan=state.space||state.tool==='hand'||e.button===1;
 if(pan){state.drag={tool:'pan',originX:e.clientX,originY:e.clientY,panX:state.panX,panY:state.panY};target.setPointerCapture(e.pointerId);target.style.cursor='grabbing';return}
 if(!inside(point.x,point.y))return;
 target.setPointerCapture(e.pointerId);stopPlayback();
 if(state.tool==='eyedropper'){pickColor(point.x,point.y);return}
 if(sg2SelectionTool(state.tool)){sg2SelectionDown(e,point);return}
 const l=selectedLayer();if(l.locked){toast('Unlock layer to edit pixels');return}if(!l.visible){toast('Show layer to edit pixels');return}
 const tool=state.tool,cell=selectedCel(),c=ctx(cell),color=e.button===2?state.bg:state.fg;
 if(tool==='move'){
  if(sg2StartMove(point))return;
  if(!state.selection)state.selection={x:0,y:0,w:project.width,h:project.height};const s={...state.selection};const base=c.getImageData(0,0,project.width,project.height);const original=copyCel(cell);state.drag={tool, start:point,last:point,base,s,original,moved:false};updateSelectionBox();return;
 }
 checkpoint();const straight=e.shiftKey&&['pencil','eraser','dither'].includes(tool);const pixelPerfect=tool==='pencil'&&state.pixelPerfect&&state.brush===1&&state.brushShape==='square'&&!straight;state.drag={tool,start:point,last:point,straight,pixelPerfect,path:pixelPerfect?[{...point,pressure:sg2Pressure(e)}]:null,base:(straight||pixelPerfect||['line','rect','ellipse'].includes(tool))?c.getImageData(0,0,project.width,project.height):null,color,moved:false};
 if(tool==='fill'){floodFill(cell,point.x,point.y,color);finishDraw();return}
 if(['pencil','eraser','dither'].includes(tool)){paintPixel(c,point.x,point.y,color,tool==='eraser',tool==='dither',sg2Pressure(e));renderCanvas()}
}
function handlePointerMove(e){const point=canvasPoint(e);$('coordLabel').innerHTML=inside(point.x,point.y)?`x: ${point.x} &nbsp; y: ${point.y}`:'x: — &nbsp; y: —';if(state.sg2Polygon)sg2PolygonHover({x:clamp(point.x,0,project.width-1),y:clamp(point.y,0,project.height-1)});const d=state.drag;if(!d)return;
 if(d.tool==='pan'){state.panX=d.panX+(e.clientX-d.originX);state.panY=d.panY+(e.clientY-d.originY);updateArtboard();return}
 if(d.tool==='select'){state.selection=normRect(d.start,point);updateSelectionBox();return}
 const l=selectedLayer(),c=ctx(l.cels[state.frame]);const p={x:clamp(point.x,0,project.width-1),y:clamp(point.y,0,project.height-1)};
 if(d.tool==='sg2select'){sg2SelectionMove(p);return}
 if(d.tool==='sg2move'){sg2MovePreview(p);return}
 if(d.tool==='move'){
  const dx=p.x-d.start.x,dy=p.y-d.start.y;savedMove(c,d,dx,dy);d.moved=dx!==0||dy!==0;d.last=p;state.selection={x:clamp(d.s.x+dx,0,project.width-1),y:clamp(d.s.y+dy,0,project.height-1),w:d.s.w,h:d.s.h};updateSelectionBox();renderCanvas();return;
 }
 if(['pencil','eraser','dither'].includes(d.tool)){if(d.straight){c.putImageData(d.base,0,0);strokeSegment(c,d.start,p,d.color,d.tool==='eraser',d.tool==='dither',sg2Pressure(e))}else if(d.pixelPerfect){sg2AppendPath(d.path,d.last,p,sg2Pressure(e));c.putImageData(d.base,0,0);sg2DrawPath(c,d.path,d.color)}else{strokeSegment(c,d.last,p,d.color,d.tool==='eraser',d.tool==='dither',sg2Pressure(e))}d.last=p;d.moved=true;renderCanvas()}
 else if(['line','rect','ellipse'].includes(d.tool)){c.putImageData(d.base,0,0);drawShape(c,d.tool,d.start,p,d.color);d.last=p;d.moved=true;renderCanvas()}
}
function savedMove(c,d,dx,dy){c.putImageData(d.base,0,0);c.clearRect(d.s.x,d.s.y,d.s.w,d.s.h);c.drawImage(d.original,d.s.x,d.s.y,d.s.w,d.s.h,d.s.x+dx,d.s.y+dy,d.s.w,d.s.h)}
function handlePointerUp(e){const d=state.drag;if(!d)return;if(d.tool==='pan'){$('viewport').style.cursor='crosshair';state.drag=null;return}
 if(d.tool==='sg2select'){sg2SelectionFinish(e);return}
 if(d.tool==='sg2move'){sg2MoveFinish(e);return}
 if(d.tool==='select'){state.drag=null;updateSelectionBox();return}
 if(d.tool==='move'){if(d.moved){const c=ctx(selectedCel());c.putImageData(d.base,0,0);checkpoint();savedMove(c,d,d.last.x-d.start.x,d.last.y-d.start.y);finishDraw()}else state.drag=null;return}
 if(['pencil','eraser','dither'].includes(d.tool)){const p=canvasPoint(e);if(p.x!==d.last.x||p.y!==d.last.y)handlePointerMove(e);finishDraw();return}
 if(['line','rect','ellipse'].includes(d.tool)&&!d.moved){const c=ctx(selectedCel());drawShape(c,d.tool,d.start,d.start,d.color)}finishDraw()}

function sg2AdjustCel(mode){
 const l=selectedLayer();if(l.locked||!l.visible){toast('Unlock and show the layer first');return}
 const c=ctx(selectedCel()),image=c.getImageData(0,0,project.width,project.height),data=image.data;
 const from=hexToRGB(state.bg),to=hexToRGB(state.fg);let changedPixels=0;
 for(let y=0;y<project.height;y++)for(let x=0;x<project.width;x++){
  if(!withinSelection(x,y))continue;
  const i=(y*project.width+x)*4;
  if(!data[i+3])continue;
  if(mode==='replace'&&(data[i]!==from[0]||data[i+1]!==from[1]||data[i+2]!==from[2]))continue;
  const rgb=mode==='invert'?[255-data[i],255-data[i+1],255-data[i+2]]:to;
  if(data[i]===rgb[0]&&data[i+1]===rgb[1]&&data[i+2]===rgb[2])continue;
  data[i]=rgb[0];data[i+1]=rgb[1];data[i+2]=rgb[2];changedPixels++;
 }
 if(!changedPixels){toast('No matching pixels');return}
 checkpoint();c.putImageData(image,0,0);finishDraw();toast(changedPixels+' pixels updated');
}
function copySelection(cut=false){return sg2Copy(cut)}
function pasteSelection(){if(!state.clipboard){toast('Nothing copied yet');return}if(selectedLayer().locked){toast('Unlock layer first');return}checkpoint();const clip=state.clipboard,temp=makeCanvas(clip.width,clip.height);ctx(temp).putImageData(clip,0,0);const x=state.selection?.x??Math.floor((project.width-clip.width)/2),y=state.selection?.y??Math.floor((project.height-clip.height)/2);ctx(selectedCel()).drawImage(temp,x,y);state.selectionMask=null;state.selection={x:clamp(x,0,project.width-1),y:clamp(y,0,project.height-1),w:Math.min(clip.width,project.width-x),h:Math.min(clip.height,project.height-y)};finishDraw();toast('Pixels pasted')}
function deleteSelection(){return sg2Delete()}
function applyFlip(horizontal){if(sg2CurrentMask())return sg2Transform(horizontal?'flip-h':'flip-v');if(selectedLayer().locked)return toast('Unlock layer first');checkpoint();const c=selectedCel(),original=copyCel(c),g=ctx(c);g.clearRect(0,0,c.width,c.height);g.save();if(horizontal){g.translate(c.width,0);g.scale(-1,1)}else{g.translate(0,c.height);g.scale(1,-1)}g.drawImage(original,0,0);g.restore();finishDraw()}
// ----- Layers, animation, document actions -----
function addFrame(duplicate=false){if(project.frames.length>=128){toast('Maximum 128 frames');return}if(!fitsMemoryBudget(project.width,project.height,project.frames.length+1,project.layers.length))return toast('Document memory limit reached');checkpoint();const current=state.frame;project.frames.splice(current+1,0,{duration:project.frames[current].duration});for(const l of project.layers){l.cels.splice(current+1,0,duplicate?copyCel(l.cels[current]):makeCanvas(project.width,project.height))}state.frame=current+1;refreshAll();changed();toast(duplicate?'Frame duplicated':'Empty frame added')}
function deleteFrame(){if(project.frames.length===1)return toast('Keep at least one frame');checkpoint();project.frames.splice(state.frame,1);for(const l of project.layers)l.cels.splice(state.frame,1);state.frame=clamp(state.frame,0,project.frames.length-1);refreshAll();changed()}
function addLayer(){if(project.layers.length>=64)return toast('Maximum 64 layers');if(!fitsMemoryBudget(project.width,project.height,project.frames.length,project.layers.length+1))return toast('Document memory limit reached');checkpoint();project.layers.splice(state.layer+1,0,layer('Layer '+(project.layers.length+1),project.width,project.height,project.frames.length));state.layer++;refreshAll();changed();toast('Layer added')}
function deleteLayer(){if(project.layers.length===1)return toast('Keep at least one layer');checkpoint();project.layers.splice(state.layer,1);state.layer=clamp(state.layer,0,project.layers.length-1);refreshAll();changed()}
function moveLayer(delta){const next=state.layer+delta;if(next<0||next>=project.layers.length)return;checkpoint();[project.layers[state.layer],project.layers[next]]=[project.layers[next],project.layers[state.layer]];state.layer=next;refreshAll();changed()}
function resizeCanvas(w,h){if(w===project.width&&h===project.height)return;if(!fitsMemoryBudget(w,h,project.frames.length,project.layers.length))return toast('New canvas would exceed memory limit');checkpoint();for(const l of project.layers)l.cels=l.cels.map(c=>{const out=makeCanvas(w,h);ctx(out).drawImage(c,0,0);return out});project.width=w;project.height=h;state.selection=null;state.selectionMask=null;state.sg2Polygon=null;refreshAll();fit();changed();toast(`Canvas resized to ${w} × ${h}`)}
function newDocument(w,h,name,white){project=blankProject(w,h,name,white);history=[];future=[];state.frame=0;state.layer=0;state.selection=null;state.selectionMask=null;state.sg2Polygon=null;state.panX=state.panY=0;stopPlayback();refreshAll();fit();changed();toast('New sprite created')}
function togglePlay(){state.playing=!state.playing;animationLast=performance.now();animationTime=0;updateInspector()}
function updateTimelineCursor(){
 document.querySelectorAll('#timelineGrid .frame-header').forEach((node,index)=>node.classList.toggle('active',index===state.frame));
 const cells=document.querySelectorAll('#timelineGrid .cel');let n=0;
 for(let layer=project.layers.length-1;layer>=0;layer--)for(let frame=0;frame<project.frames.length;frame++){
  const cell=cells[n++];if(!cell)continue;cell.classList.toggle('current-frame',frame===state.frame);cell.classList.toggle('active',layer===state.layer&&frame===state.frame);
 }
}
function animationLoop(timestamp){
 if(document.hidden){animationLast=timestamp;requestAnimationFrame(animationLoop);return}
 if(state.playing&&project){animationTime+=Math.min(250,timestamp-animationLast||0);let advanced=false;
  while(animationTime>=project.frames[state.frame].duration){animationTime-=project.frames[state.frame].duration;state.frame=(state.frame+1)%project.frames.length;advanced=true}
  if(advanced){renderCanvas();updateTimelineCursor();updateMetadata()}
 }
 animationLast=timestamp;requestAnimationFrame(animationLoop);
}
// ----- Import, export, native GIF89a encoder -----
function download(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)}
function downloadCanvas(c,name){c.toBlob(blob=>{if(blob)download(blob,name);else toast('Image encoding failed')},'image/png')}
function saveProject(){download(new Blob([JSON.stringify(serialize())],{type:'application/json'}),safeName(project.name)+'.npx');autosave();toast('Editable project downloaded')}
function exportFrame(){downloadCanvas(composeFrame(state.frame),`${safeName(project.name)}-frame-${String(state.frame+1).padStart(2,'0')}.png`);toast('PNG exported')}
function sheetLayout(){const columns=Math.ceil(Math.sqrt(project.frames.length)),rows=Math.ceil(project.frames.length/columns);return {columns,rows,width:columns*project.width,height:rows*project.height}}
function createSpriteSheet(){const d=sheetLayout();if(d.width>16384||d.height>16384)throw Error('Sprite sheet exceeds browser canvas limit');const sheet=makeCanvas(d.width,d.height),c=ctx(sheet);project.frames.forEach((f,i)=>c.drawImage(composeFrame(i),i%d.columns*project.width,Math.floor(i/d.columns)*project.height));return sheet}
function exportSheet(){try{downloadCanvas(createSpriteSheet(),safeName(project.name)+'-spritesheet.png');toast('Sprite sheet exported')}catch(e){toast(e.message)}}
function exportAtlas(){const s=sheetLayout(),name=safeName(project.name);const payload={meta:{app:'Nexus Pixel Studio',version:'0.1',image:name+'-spritesheet.png',format:'RGBA8888',size:{w:s.width,h:s.height},scale:'1'},frames:project.frames.map((f,i)=>({filename:`${name}-${String(i+1).padStart(3,'0')}`,frame:{x:(i%s.columns)*project.width,y:Math.floor(i/s.columns)*project.height,w:project.width,h:project.height},rotated:false,trimmed:false,sourceSize:{w:project.width,h:project.height},duration:f.duration}))};download(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),name+'-atlas.json');toast('Atlas metadata exported')}
function makeGIF(){
 // Exact palette if <=255 opaque colors; nearest-color fallback if artwork exceeds 255.
 const frames=project.frames.map((_,i)=>ctx(composeFrame(i)).getImageData(0,0,project.width,project.height).data);
 const colors=[[0,0,0]],colorIds=new Map(),histogram=new Map();for(const data of frames)for(let i=0;i<data.length;i+=4){if(data[i+3]<128)continue;const key=(data[i]<<16)|(data[i+1]<<8)|data[i+2];histogram.set(key,(histogram.get(key)||0)+1)}
 const frequent=[...histogram].sort((a,b)=>b[1]-a[1]).slice(0,255).map(x=>x[0]);for(const key of frequent){colorIds.set(key,colors.length);colors.push([(key>>16)&255,(key>>8)&255,key&255])}
 function nearest(key){if(colorIds.has(key))return colorIds.get(key);const r=(key>>16)&255,g=(key>>8)&255,b=key&255;let best=1,distance=Infinity;for(let p=1;p<colors.length;p++){const c=colors[p],d=(r-c[0])**2*2+(g-c[1])**2*3+(b-c[2])**2;if(d<distance){distance=d;best=p}}colorIds.set(key,best);return best}
 const out=[];const bytes=(...a)=>out.push(...a);const short=x=>bytes(x&255,(x>>8)&255);const str=s=>{for(let i=0;i<s.length;i++)bytes(s.charCodeAt(i))};
 str('GIF89a');short(project.width);short(project.height);bytes(0xF7,0,0);
 for(let i=0;i<256;i++){const c=colors[i]||[0,0,0];bytes(c[0],c[1],c[2])}
 bytes(0x21,0xFF,11);str('NETSCAPE2.0');bytes(3,1,0,0,0);
 for(let f=0;f<frames.length;f++){
  const duration=clamp(Math.round(project.frames[f].duration/10),2,65535);
  bytes(0x21,0xF9,4,0x09);short(duration);bytes(0,0);
  bytes(0x2C);short(0);short(0);short(project.width);short(project.height);bytes(0);
  bytes(8);const codes=[];const data=frames[f];for(let i=0;i<data.length;i+=4){if((i/4)%200===0)codes.push(256);codes.push(data[i+3]<128?0:nearest((data[i]<<16)|(data[i+1]<<8)|data[i+2]))}codes.push(257);
  // LZW with dictionary-clear every 200 pixels. Deliberately use 9-bit raw indices;
  // decoder resets before its code table can exceed 9 bits.
  const packed=[];let bits=0,held=0;for(const code of codes){held|=code<<bits;bits+=9;while(bits>=8){packed.push(held&255);held>>=8;bits-=8}}if(bits)packed.push(held&255);
  for(let i=0;i<packed.length;i+=255){const block=packed.slice(i,i+255);bytes(block.length,...block)}bytes(0);
 }
 bytes(0x3B);return new Uint8Array(out);
}
function exportGIF(){try{download(new Blob([makeGIF()],{type:'image/gif'}),safeName(project.name)+'.gif');toast('Animated GIF exported')}catch(e){console.error(e);toast('GIF export failed: '+e.message)}}
async function openFile(file){if(!file)return;try{if(file.name.toLowerCase().endsWith('.npx')||file.type==='application/json'||file.name.toLowerCase().endsWith('.json')){await loadSerialized(JSON.parse(await file.text()));return}
 if(!file.type.startsWith('image/'))throw Error('Unsupported file type');const url=URL.createObjectURL(file);const image=new Image();image.src=url;await image.decode();URL.revokeObjectURL(url);if(image.width>512||image.height>512)throw Error('Images must be 512 × 512 px or smaller');newDocument(image.width,image.height,file.name.replace(/\.[^.]+$/,''),false);ctx(selectedCel()).drawImage(image,0,0);refreshAll();changed();toast('Image imported as editable pixels')
 }catch(err){console.error(err);toast('Open failed: '+err.message)}}
// ----- User interface wiring -----
function action(name){document.querySelectorAll('.menu-group.open').forEach(x=>x.classList.remove('open'));switch(name){
 case 'new':$('newDialog').showModal();break;
 case 'open':$('fileInput').click();break;
 case 'save':saveProject();break;
 case 'png':exportFrame();break;
 case 'sheet':exportSheet();break;
 case 'gif':exportGIF();break;
 case 'atlas':exportAtlas();break;
 case 'undo':undo();break;
 case 'redo':redo();break;
 case 'copy':copySelection();break;
 case 'cut':copySelection(true);break;
 case 'paste':pasteSelection();break;
 case 'delete-selection':deleteSelection();break;
 case 'select-all':sg2SelectAll();break;
 case 'invert-selection':sg2InvertSelection();break;
 case 'rotate-cw':sg2Transform('rotate-cw');break;
 case 'rotate-ccw':sg2Transform('rotate-ccw');break;
 case 'crop-selection':sg2CropSelection();break;
 case 'deselect':sg2SetSelection(null);break;
 case 'resize':$('resizeForm').elements.width.value=project.width;$('resizeForm').elements.height.value=project.height;$('resizeDialog').showModal();break;
 case 'flip-h':applyFlip(true);break;
 case 'flip-v':applyFlip(false);break;
 case 'clear-cel':deleteSelection();break;
 case 'toggle-grid':state.grid=!state.grid;updateArtboard();updateInspector();break;
 case 'toggle-onion':state.onion=!state.onion;renderCanvas();updateInspector();break;
 case 'add-frame':addFrame();break;
 case 'duplicate-frame':addFrame(true);break;
 case 'delete-frame':deleteFrame();break;
 case 'play':togglePlay();break;
 case 'fit-view':fit();break;
 case 'toggle-inspector':toggleInspector();break;
 case 'toggle-timeline':toggleTimeline();break;
 case 'reset-workspace':resetWorkspace();break;
 case 'fullscreen':if(document.fullscreenElement){document.exitFullscreen?.().catch(()=>toast('Full screen unavailable'))}else{document.documentElement.requestFullscreen?.().catch(()=>toast('Full screen unavailable'))}break;
 default:console.warn('Unsupported action',name)
}}

// ----- Standalone editor workspace: local panel state, independent of project. -----
const WORKSPACE_KEY='nexus-pixel-studio-workspace-v2';
const WORKSPACE_DEFAULT={dock:true,timeline:true,tab:'color',dockWidth:262,timelineHeight:212};
let workspace={...WORKSPACE_DEFAULT};
function persistWorkspace(){try{localStorage.setItem(WORKSPACE_KEY,JSON.stringify(workspace))}catch(e){/* Graceful in private/file contexts. */}}
function applyWorkspace(){
 document.body.classList.toggle('dock-hidden',!workspace.dock);
 document.body.classList.toggle('timeline-hidden',!workspace.timeline);
 document.documentElement.style.setProperty('--dock-width',workspace.dockWidth+'px');
 document.documentElement.style.setProperty('--timeline-size',workspace.timelineHeight+'px');
 $('inspector').dataset.activeTab=workspace.tab;
 document.querySelectorAll('.dock-tab').forEach(b=>{const active=b.dataset.dockTab===workspace.tab;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1});
 $('dockPaneBtn').setAttribute('aria-pressed',String(workspace.dock));
 $('timelinePaneBtn').setAttribute('aria-pressed',String(workspace.timeline));
}
function toggleInspector(){workspace.dock=!workspace.dock;applyWorkspace();persistWorkspace()}
function toggleTimeline(){workspace.timeline=!workspace.timeline;applyWorkspace();persistWorkspace()}
function resetWorkspace(){workspace={...WORKSPACE_DEFAULT};applyWorkspace();persistWorkspace();fit();toast('Workspace reset')}
function setupSplitter(id,axis){
 const handle=$(id);
 let start=0,base=0,pointer=-1;
 handle.addEventListener('pointerdown',e=>{
  if(e.button!==0)return;
  e.preventDefault();pointer=e.pointerId;start=axis==='dock'?e.clientX:e.clientY;
  base=axis==='dock'?workspace.dockWidth:workspace.timelineHeight;
  handle.setPointerCapture(pointer);handle.classList.add('dragging');document.body.classList.add('is-resizing');document.body.classList.toggle('timeline-drag',axis==='timeline');
 });
 handle.addEventListener('pointermove',e=>{
  if(pointer!==e.pointerId)return;
  if(axis==='dock')workspace.dockWidth=clamp(Math.round(base+start-e.clientX),190,Math.min(480,window.innerWidth-360));
  else workspace.timelineHeight=clamp(Math.round(base+start-e.clientY),112,Math.min(440,window.innerHeight-205));
  applyWorkspace();
 });
 function finish(e){if(pointer!==e.pointerId)return;pointer=-1;handle.classList.remove('dragging');document.body.classList.remove('is-resizing','timeline-drag');persistWorkspace()}
 handle.addEventListener('pointerup',finish);handle.addEventListener('pointercancel',finish);
 handle.addEventListener('keydown',e=>{
  const delta=10*(e.shiftKey?3:1);
  if(axis==='dock'&&['ArrowLeft','ArrowRight'].includes(e.key)){workspace.dockWidth=clamp(workspace.dockWidth+(e.key==='ArrowLeft'?delta:-delta),190,480)}
  else if(axis==='timeline'&&['ArrowUp','ArrowDown'].includes(e.key)){workspace.timelineHeight=clamp(workspace.timelineHeight+(e.key==='ArrowUp'?delta:-delta),112,440)}
  else return;
  e.preventDefault();applyWorkspace();persistWorkspace();
 });
}
function bindToolIcons(){
 const icons={
 pencil:'<path d="m4 20 4.5-1.3L19 8.2 15.8 5 5.3 15.5 4 20Z"/><path d="m13.5 7.2 3.2 3.2M4 20l4.5-1.3"/>',
 eraser:'<path d="m3.8 15.7 9.8-10a2 2 0 0 1 2.8 0l3.1 3.1a2 2 0 0 1 0 2.8L10 21H6l-2.2-2.3a2 2 0 0 1 0-3zM9 11l6 6M10 21h11"/>',
 fill:'<path d="m12 3 8.5 8.5-8.5 8.5L3.5 11.5 12 3Z"/><path d="M5.5 13.5h13M7 7l4 4"/>',
 eyedropper:'<path d="M13 6l5-5 5 5-5 5M10 9l5 5M14.8 9.2 8.2 15.8 5 19l-3 1 1-3 3.2-3.2L12.8 7"/>',
 dither:'<path d="M3 3h18v18H3zM9 3v18M15 3v18M3 9h18M3 15h18"/><path d="M3 3h6v6H3zM15 9h6v6h-6zM9 15h6v6H9z" fill="currentColor" stroke="none"/>',
 line:'<path d="m4 20 16-16"/><path d="M4 17v3h3M17 4h3v3"/>',
 rect:'<rect x="4" y="5" width="16" height="14" rx=".5"/>',
 ellipse:'<ellipse cx="12" cy="12" rx="8" ry="7"/>',
 select:'<path d="M4 7V4h4M12 4h2m3 0h3v3m0 4v2m0 4v3h-3m-4 0h-2m-4 0H4v-3m0-4v-2"/>',
 move:'<path d="M12 2v20M2 12h20M12 2l-3 3m3-3 3 3M22 12l-3-3m3 3-3 3M12 22l3-3m-3 3-3-3M2 12l3 3m-3-3 3-3"/>',
 hand:'<path d="M7 12V7a1.5 1.5 0 0 1 3 0v4-6a1.5 1.5 0 0 1 3 0v5-4a1.5 1.5 0 0 1 3 0v5-2a1.5 1.5 0 0 1 3 0v7a6 6 0 0 1-6 6h-2a6 6 0 0 1-5-2.6l-3.5-5a1.5 1.5 0 0 1 2.4-1.8L7 15"/>'
 };
 document.querySelectorAll('[data-tool]').forEach(b=>{
  const target=b.querySelector('.tool-symbol');if(!target||!icons[b.dataset.tool])return;
  target.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+icons[b.dataset.tool]+'</svg>';
  b.setAttribute('aria-label',b.title||b.dataset.tool);
 });
}
function bindWorkspace(){
 try{const prior=JSON.parse(localStorage.getItem(WORKSPACE_KEY)||'null');if(prior&&typeof prior==='object'){
  workspace={...WORKSPACE_DEFAULT,...prior};workspace.dock=workspace.dock!==false;workspace.timeline=workspace.timeline!==false;
  if(!['color','brush','layer','navigator'].includes(workspace.tab))workspace.tab='color';
  workspace.dockWidth=clamp(Number(workspace.dockWidth)||262,190,480);workspace.timelineHeight=clamp(Number(workspace.timelineHeight)||212,112,440);
 }}catch(e){/* Existing editor works without persistent workspace state. */}
 applyWorkspace();bindToolIcons();
 document.querySelectorAll('.dock-tab').forEach(b=>b.addEventListener('click',()=>{workspace.tab=b.dataset.dockTab;workspace.dock=true;applyWorkspace();persistWorkspace()}));
 $('dockPaneBtn').addEventListener('click',toggleInspector);$('timelinePaneBtn').addEventListener('click',toggleTimeline);
 setupSplitter('dockResize','dock');setupSplitter('timelineResize','timeline');
}
function bindUI(){
 document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>action(b.dataset.action)));
 document.querySelectorAll('[data-tool]').forEach(b=>b.addEventListener('click',()=>setTool(b.dataset.tool)));
 document.querySelectorAll('.menu-trigger').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();const g=b.parentElement;document.querySelectorAll('.menu-group.open').forEach(x=>{if(x!==g)x.classList.remove('open')});g.classList.toggle('open')}));
 document.addEventListener('pointerdown',e=>{if(!e.target.closest('.menu-group'))document.querySelectorAll('.menu-group.open').forEach(x=>x.classList.remove('open'))});
 const viewport=$('viewport');viewport.addEventListener('pointerdown',handlePointerDown);viewport.addEventListener('pointermove',handlePointerMove);viewport.addEventListener('pointerup',handlePointerUp);viewport.addEventListener('pointercancel',handlePointerUp);viewport.addEventListener('contextmenu',e=>e.preventDefault());
 viewport.addEventListener('wheel',e=>{e.preventDefault();setZoom(state.zoom+(e.deltaY<0?1:-1))},{passive:false});
 viewport.addEventListener('dblclick',e=>{if(state.sg2Polygon){e.preventDefault();sg2PolygonFinish()}});
 $('zoomIn').onclick=()=>setZoom(state.zoom+1);$('zoomOut').onclick=()=>setZoom(state.zoom-1);$('fitBtn').onclick=fit;
 $('brushSize').oninput=e=>{state.brush=Number(e.target.value);$('brushSizeLabel').textContent=state.brush+' px';document.querySelectorAll('[data-sg2-preset]').forEach(b=>b.classList.toggle('selected',Number(b.dataset.sg2Preset)===state.brush))};
 $('sg2BrushShape').onchange=e=>{state.brushShape=e.target.value;updateInspector()};
 $('sg2DitherPattern').onchange=e=>{state.ditherPattern=e.target.value;updateInspector()};
 $('sg2PixelPerfect').onclick=()=>{state.pixelPerfect=!state.pixelPerfect;updateInspector()};
 $('sg2Pressure').onclick=()=>{state.pressureEnabled=!state.pressureEnabled;updateInspector()};
 document.querySelectorAll('[data-sg2-preset]').forEach(b=>b.onclick=()=>{state.brush=clamp(Number(b.dataset.sg2Preset),1,16);updateInspector()});
 $('sg2Invert').onclick=()=>sg2AdjustCel('invert');
 $('sg2Replace').onclick=()=>sg2AdjustCel('replace');
 $('sg2Tolerance').oninput=e=>$('sg2ToleranceValue').textContent=e.target.value;
 $('sg2SelectAll').onclick=sg2SelectAll;
 $('sg2InvertSelection').onclick=sg2InvertSelection;
 $('sg2RotateCW').onclick=()=>sg2Transform('rotate-cw');
 $('sg2RotateCCW').onclick=()=>sg2Transform('rotate-ccw');
 $('sg2CropSelection').onclick=sg2CropSelection;
 $('filledToggle').onclick=()=>{state.filled=!state.filled;updateInspector()};$('symXToggle').onclick=()=>{state.symX=!state.symX;updateInspector()};$('symYToggle').onclick=()=>{state.symY=!state.symY;updateInspector()};
 $('gridToggle').onclick=()=>action('toggle-grid');$('onionToggle').onclick=()=>action('toggle-onion');
 $('colorPicker').oninput=e=>setForeground(e.target.value);$('colorHex').addEventListener('change',e=>{if(normalHex(e.target.value))setForeground(e.target.value);else updateInspector()});
 $('swapColors').onclick=swapColors;$('fgSwatch').onclick=()=>$('colorPicker').click();$('bgSwatch').onclick=swapColors;
 $('paletteSelect').onchange=e=>{const key=e.target.value;checkpoint();if(key==='CUSTOM'){project.paletteKey='CUSTOM'}else{project.paletteKey=key;project.palette=PALETTES[key].map(x=>'#'+x)}updateInspector();changed()};
 $('addColorBtn').onclick=()=>{if(project.palette.length>=256)return toast('Palette limit: 256 swatches');checkpoint();project.paletteKey='CUSTOM';project.palette.push(state.fg);updateInspector();changed();toast('Color added to palette')};
 $('docName').addEventListener('focus',e=>e.target.dataset.old=e.target.value);$('docName').addEventListener('change',e=>{const name=e.target.value.trim().slice(0,60)||'Untitled Sprite';if(name!==project.name){checkpoint();project.name=name;refreshAll();changed()}});
 $('layerName').addEventListener('change',e=>{const name=e.target.value.trim().slice(0,40);if(name&&name!==selectedLayer().name){checkpoint();selectedLayer().name=name;refreshAll();changed()}});
 $('layerOpacity').addEventListener('change',e=>{const val=Number(e.target.value)/100;if(selectedLayer().opacity!==val){checkpoint();selectedLayer().opacity=val;refreshAll();changed()}});
 $('layerOpacity').addEventListener('input',e=>$('opacityReadout').textContent=e.target.value+'%');
 $('toggleLayerVisibility').onclick=()=>{checkpoint();selectedLayer().visible=!selectedLayer().visible;refreshAll();changed()};$('toggleLayerLock').onclick=()=>{checkpoint();selectedLayer().locked=!selectedLayer().locked;refreshAll();changed()};
 $('layerUp').onclick=()=>moveLayer(1);$('layerDown').onclick=()=>moveLayer(-1);$('deleteLayerBtn').onclick=deleteLayer;$('addLayerBtn').onclick=addLayer;
 $('addFrameBtn').onclick=()=>addFrame();$('duplicateFrameBtn').onclick=()=>addFrame(true);$('deleteFrameBtn').onclick=deleteFrame;
 $('firstFrameBtn').onclick=()=>{state.frame=0;refreshAll()};$('lastFrameBtn').onclick=()=>{state.frame=project.frames.length-1;refreshAll()};
 $('prevFrameBtn').onclick=()=>{state.frame=(state.frame-1+project.frames.length)%project.frames.length;refreshAll()};$('nextFrameBtn').onclick=()=>{state.frame=(state.frame+1)%project.frames.length;refreshAll()};$('playBtn').onclick=togglePlay;$('previewToggle').onclick=togglePlay;
 $('fpsInput').addEventListener('change',e=>{const fps=clamp(Math.round(Number(e.target.value)||8),1,30);checkpoint();for(const f of project.frames)f.duration=Math.round(1000/fps);updateInspector();changed()});
 $('fileInput').onchange=e=>{openFile(e.target.files[0]);e.target.value=''};
 $('newForm').onsubmit=e=>{e.preventDefault();const fd=new FormData(e.target);const w=Number(fd.get('width')),h=Number(fd.get('height'));if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w>512||h>512){toast('Use dimensions from 1 to 512 pixels');return}newDocument(w,h,String(fd.get('name')||'Untitled Sprite'),fd.get('background')==='white');$('newDialog').close()};
 $('resizeForm').onsubmit=e=>{e.preventDefault();const fd=new FormData(e.target),w=Number(fd.get('width')),h=Number(fd.get('height'));if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w>512||h>512){toast('Use dimensions from 1 to 512 pixels');return}resizeCanvas(w,h);$('resizeDialog').close()};
 $('newCancel').onclick=()=>$('newDialog').close();$('resizeCancel').onclick=()=>$('resizeDialog').close();$('helpBtn').onclick=()=>$('helpDialog').showModal();$('helpClose').onclick=()=>$('helpDialog').close();
 document.addEventListener('keydown',e=>{
  const input=e.target.closest('input,select,textarea,dialog');if(input&&!(e.ctrlKey&&['s','o','n'].includes(e.key.toLowerCase())))return;
  const k=e.key.toLowerCase(),ctrl=e.ctrlKey||e.metaKey;
  if(ctrl){const cmds={z:e.shiftKey?'redo':'undo',y:'redo',s:'save',o:'open',n:'new',c:'copy',x:'cut',v:'paste',d:'deselect',a:'select-all'};if(cmds[k]){e.preventDefault();action(cmds[k]);return}}
  const tools={p:'pencil',e:'eraser',g:'fill',i:'eyedropper',d:'dither',l:'line',r:'rect',o:'ellipse',m:'select',j:'select-ellipse',q:'select-lasso',k:'select-polygon',w:'select-wand',v:'move',h:'hand'};
  if(tools[k]){setTool(tools[k]);return}
  if(k===' '){state.space=true;e.preventDefault();return}
  if(k==='f'){fit();return}
  if(k==='tab'&&(document.activeElement===viewport||document.activeElement===document.body)){e.preventDefault();if(e.shiftKey)toggleTimeline();else toggleInspector();return}
  if(k==='x'){swapColors();return}
  if(k==='escape'&&state.sg2Polygon){sg2PolygonCancel();e.preventDefault();return}
  if(k==='escape'){sg2SetSelection(null);e.preventDefault();return}
  if(k==='enter'&&state.sg2Polygon){sg2PolygonFinish();e.preventDefault();return}
  if(k==='enter'){togglePlay();e.preventDefault();return}
  if(k==='['){state.brush=clamp(state.brush-1,1,16);updateInspector();return}
  if(k===']'){state.brush=clamp(state.brush+1,1,16);updateInspector();return}
  if(k==='delete'||k==='backspace'){e.preventDefault();deleteSelection();return}
  if(k==='arrowleft'||k===','){state.frame=(state.frame-1+project.frames.length)%project.frames.length;refreshAll();return}
  if(k==='arrowright'||k==='.'){state.frame=(state.frame+1)%project.frames.length;refreshAll();return}
 });
 document.addEventListener('keyup',e=>{if(e.code==='Space')state.space=false});
 window.addEventListener('blur',()=>{state.space=false;state.drag=null});
 window.addEventListener('pagehide',()=>{if(state.dirty)autosave()});window.addEventListener('beforeunload',()=>{if(state.dirty)autosave()});
}
async function init(){
 bindUI();bindWorkspace();
 const stored=await loadBrowserSnapshot();
 if(stored){
  try{await loadSerialized(stored);$('saveStatus').textContent='Recovered from browser';}
  catch(error){console.warn('Autosave recovery failed; starter loaded',error);project=seedProject();refreshAll();fit();toast('Saved project could not be recovered');autosave()}
 }else{project=seedProject();refreshAll();fit();autosave()}
 requestAnimationFrame(animationLoop)
}
// Diagnostic, read-only data surface for smoke tests and downstream integrations.
window.NexusStudio={getInfo:()=>({name:project.name,width:project.width,height:project.height,frames:project.frames.length,layers:project.layers.map(l=>({name:l.name,visible:l.visible,locked:l.locked,opacity:l.opacity})),selectedFrame:state.frame,selectedLayer:state.layer,tool:state.tool,zoom:state.zoom,playing:state.playing}),getPixel:(x,y,frame=state.frame,layerIndex=null)=>Array.from(ctx(layerIndex===null?composeFrame(frame):project.layers[layerIndex].cels[frame]).getImageData(x,y,1,1).data),toProject:()=>serialize(),toGIF:()=>makeGIF(),toSheet:()=>createSpriteSheet().toDataURL('image/png')};
window.NexusStudio.getWorkspaceInfo=()=>({rightDockVisible:!document.body.classList.contains('dock-hidden'),timelineVisible:!document.body.classList.contains('timeline-hidden'),activeDock:$('inspector').dataset.activeTab,dockWidth:parseInt(document.documentElement.style.getPropertyValue('--dock-width')||'262',10),timelineHeight:parseInt(document.documentElement.style.getPropertyValue('--timeline-size')||'212',10)});
init();

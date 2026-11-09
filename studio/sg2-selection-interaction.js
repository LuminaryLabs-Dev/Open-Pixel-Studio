/* SG-2 editor integration. Loaded before app.js in the classic-script runtime.
   Selection state is ephemeral: no change to .npx v1 file format. */
'use strict';
function sg2SelectionTool(tool) { return ['select','select-ellipse','select-lasso','select-polygon','select-wand','select-range'].includes(tool); }
function sg2CurrentMask() {
  if (!state.selection) return null;
  const len = project.width * project.height;
  if (state.selectionMask && state.selectionMask.length === len) return state.selectionMask;
  if (state.selection.w < 1 || state.selection.h < 1) return new Uint8Array(len);
  const s = state.selection;
  return SG2Selection.rect(project.width,project.height,{x:s.x,y:s.y},{x:s.x+s.w-1,y:s.y+s.h-1});
}
function sg2SetSelection(mask) {
  if (!mask) { const prior=sg2CurrentMask();if(prior)state.lastSelection=new Uint8Array(prior);state.selectionMask=null;state.selection=null; }
  else {
    const b=SG2Selection.bounds(mask,project.width,project.height);
    state.selectionMask=mask;
    state.selection=b||{x:0,y:0,w:0,h:0};
  }
  updateSelectionBox();
}
function sg2DrawSelectionOverlay() {
  const overlay=$('sg2SelectionCanvas');if(!overlay)return;
  const w=project.width,h=project.height;
  if(overlay.width!==w||overlay.height!==h){overlay.width=w;overlay.height=h;}
  const g=overlay.getContext('2d');g.clearRect(0,0,w,h);
  if(!state.selectionMask)return;
  const mask=sg2CurrentMask();if(!mask)return;
  const image=g.createImageData(w,h),d=image.data;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=y*w+x;if(!mask[i])continue;
    const edge=x===0||y===0||x===w-1||y===h-1||!mask[i-1]||!mask[i+1]||!mask[i-w]||!mask[i+w];
    if(!edge)continue;
    const o=i*4,light=(x+y)%2===0;
    d[o]=light?245:20;d[o+1]=light?245:20;d[o+2]=light?245:20;d[o+3]=255;
  }
  g.putImageData(image,0,0);
}
function sg2SelectionMode(e) {
  if(e.ctrlKey||e.metaKey)return 'intersect';if(e.altKey)return 'subtract';if(e.shiftKey)return 'add';
  return $('sg2SelectMode').value;
}
function sg2SelectionShape(kind,d,p) {
  const w=project.width,h=project.height;
  if(kind==='select')return SG2Selection.rect(w,h,d.start,p);
  if(kind==='select-ellipse')return SG2Selection.ellipse(w,h,d.start,p);
  return SG2Selection.polygon(w,h,d.points);
}
function sg2SelectionDown(e,p) {
  const w=project.width,h=project.height,kind=state.tool;
  if(kind==='select-wand'||kind==='select-range'){
    const pixels=ctx(selectedCel()).getImageData(0,0,w,h).data;
    const mask=SG2Selection.wand(pixels,w,h,p.x,p.y,Number($('sg2Tolerance').value),kind==='select-wand');
    sg2SetSelection(SG2Selection.combine(sg2CurrentMask(),mask,sg2SelectionMode(e)));
    state.drag=null;return;
  }
  if(kind==='select-polygon'){
    if(!state.sg2Polygon){state.sg2Polygon={points:[p],base:sg2CurrentMask(),mode:sg2SelectionMode(e)};toast('Click vertices; Enter or double-click closes polygon');}
    else {const pts=state.sg2Polygon.points,prev=pts[pts.length-1];if(p.x!==prev.x||p.y!==prev.y)pts.push(p);}
    const d=state.sg2Polygon;
    sg2SetSelection(SG2Selection.combine(d.base,SG2Selection.polygon(w,h,d.points),d.mode));
    state.drag=null;return;
  }
  const d={tool:'sg2select',kind,start:p,points:[p],base:sg2CurrentMask(),mode:sg2SelectionMode(e)};
  state.drag=d;sg2SetSelection(SG2Selection.combine(d.base,sg2SelectionShape(kind,d,p),d.mode));
}
function sg2SelectionMove(p) {
  const d=state.drag;if(!d||d.tool!=='sg2select')return;
  if(d.kind==='select-lasso'){const prev=d.points[d.points.length-1];if(prev.x!==p.x||prev.y!==p.y)d.points.push(p);}
  sg2SetSelection(SG2Selection.combine(d.base,sg2SelectionShape(d.kind,d,p),d.mode));
}
function sg2SelectionFinish(e) {
  const d=state.drag;if(!d||d.tool!=='sg2select')return;
  const p=canvasPoint(e);sg2SelectionMove({x:clamp(p.x,0,project.width-1),y:clamp(p.y,0,project.height-1)});
  state.drag=null;
}
function sg2PolygonHover(p) {
  const d=state.sg2Polygon;if(!d||d.points.length<2)return;
  sg2SetSelection(SG2Selection.combine(d.base,SG2Selection.polygon(project.width,project.height,[...d.points,p]),d.mode));
}
function sg2PolygonFinish() {
  const d=state.sg2Polygon;if(!d)return;
  state.sg2Polygon=null;
  if(d.points.length<3){sg2SetSelection(d.base);toast('Polygon needs three vertices');return;}
  sg2SetSelection(SG2Selection.combine(d.base,SG2Selection.polygon(project.width,project.height,d.points),d.mode));
}
function sg2PolygonCancel() {
  if(!state.sg2Polygon)return;
  const original=state.sg2Polygon.base;state.sg2Polygon=null;sg2SetSelection(original);
}
function sg2Image() {return ctx(selectedCel()).getImageData(0,0,project.width,project.height);}
function sg2WritePixels(bytes) {ctx(selectedCel()).putImageData(new ImageData(bytes,project.width,project.height),0,0);}
function sg2Copy(cut=false) {
  if(cut&&(selectedLayer().locked||!selectedLayer().visible)){toast('Unlock and show layer first');return;}
  const w=project.width,h=project.height,mask=sg2CurrentMask()||SG2Selection.all(w,h);
  const pixels=sg2Image();const selection=SG2Selection.copied(pixels.data,mask,w,h);
  if(!selection){toast('Selection is empty');return;}
  state.clipboard=new ImageData(selection.data,selection.width,selection.height);
  if(cut){
    const cleared=SG2Selection.cleared(pixels.data,mask,w,h);
    if(cleared.changed){checkpoint();sg2WritePixels(cleared.data);finishDraw();}
  }
  toast(cut?'Pixels cut':'Pixels copied');
}
function sg2Delete() {
  if(selectedLayer().locked||!selectedLayer().visible){toast('Unlock and show layer first');return;}
  const w=project.width,h=project.height,mask=sg2CurrentMask()||SG2Selection.all(w,h);
  const cleared=SG2Selection.cleared(sg2Image().data,mask,w,h);
  if(!cleared.changed){toast('No pixels to clear');return;}
  checkpoint();sg2WritePixels(cleared.data);finishDraw();
}
function sg2Transform(operation) {
  if(selectedLayer().locked||!selectedLayer().visible){toast('Unlock and show layer first');return;}
  const w=project.width,h=project.height,previous=sg2CurrentMask();
  if((operation==='rotate-cw'||operation==='rotate-ccw')&&!previous){toast('Select pixels before rotating');return;}
  if((operation==='rotate-cw'||operation==='rotate-ccw')&&previous){const b=SG2Selection.bounds(previous,w,h);if(!b){toast('Selection is empty');return;}const x=b.x+Math.floor((b.w-b.h)/2),y=b.y+Math.floor((b.h-b.w)/2);if(x<0||y<0||x+b.h>w||y+b.w>h){toast('Move selection inward before rotating');return;}}
  const source=sg2Image(),result=SG2Selection.transformed(source.data,previous||SG2Selection.all(w,h),w,h,operation);
  if(!result.changed){toast('Nothing to transform');return;}
  checkpoint();sg2WritePixels(result.data);sg2SetSelection(previous?result.mask:null);finishDraw();
}
function sg2StartMove(point) {
  const mask=sg2CurrentMask();if(!mask)return false;
  state.drag={tool:'sg2move',start:point,original:sg2Image(),mask:new Uint8Array(mask),bounds:SG2Selection.bounds(mask,project.width,project.height),dx:0,dy:0};
  return true;
}
function sg2MovePreview(p) {
  const d=state.drag;if(!d||d.tool!=='sg2move'||!d.bounds)return;
  const b=d.bounds;
  const dx=clamp(p.x-d.start.x,-b.x,project.width-b.x-b.w),dy=clamp(p.y-d.start.y,-b.y,project.height-b.y-b.h);
  if(dx===d.dx&&dy===d.dy)return;
  d.dx=dx;d.dy=dy;
  const r=SG2Selection.transformed(d.original.data,d.mask,project.width,project.height,'move',dx,dy);
  sg2WritePixels(r.data);sg2SetSelection(r.mask);renderCanvas();
}
function sg2MoveFinish(e) {
  const d=state.drag;if(!d||d.tool!=='sg2move')return;
  const p=canvasPoint(e);sg2MovePreview(p);
  state.drag=null;sg2WritePixels(d.original.data);sg2SetSelection(d.mask);
  if(!d.dx&&!d.dy){renderCanvas();return;}
  checkpoint();
  const r=SG2Selection.transformed(d.original.data,d.mask,project.width,project.height,'move',d.dx,d.dy);
  sg2WritePixels(r.data);sg2SetSelection(r.mask);finishDraw();
}
function sg2CropSelection() {
  const mask=sg2CurrentMask();if(!mask){toast('Select an area first');return;}
  const b=SG2Selection.bounds(mask,project.width,project.height);if(!b){toast('Selection is empty');return;}
  if(b.w===project.width&&b.h===project.height&&b.x===0&&b.y===0){toast('Selection already fills canvas');return;}
  checkpoint();const oldWidth=project.width;
  for(const layer of project.layers){layer.cels=layer.cels.map(cel=>{const canvas=makeCanvas(b.w,b.h);ctx(canvas).drawImage(cel,b.x,b.y,b.w,b.h,0,0,b.w,b.h);return canvas;});}
  project.width=b.w;project.height=b.h;
  const cropped=new Uint8Array(b.w*b.h);for(let y=0;y<b.h;y++)for(let x=0;x<b.w;x++)cropped[y*b.w+x]=mask[(b.y+y)*oldWidth+b.x+x];
  sg2SetSelection(cropped);refreshAll();changed();fit();toast('Canvas cropped to selection bounds');
}
function sg2SelectAll(){sg2SetSelection(SG2Selection.all(project.width,project.height));}
function sg2InvertSelection(){const base=sg2CurrentMask();if(!base)return sg2SetSelection(new Uint8Array(project.width*project.height));const inverse=new Uint8Array(base.length);for(let i=0;i<base.length;i++)inverse[i]=base[i]?0:1;sg2SetSelection(inverse);}

function sg2Reselect(){if(state.selection){toast('Selection is already active');return}if(!state.lastSelection||state.lastSelection.length!==project.width*project.height){toast('No previous selection');return}sg2SetSelection(new Uint8Array(state.lastSelection))}

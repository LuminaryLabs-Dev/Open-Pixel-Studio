/* SG-2 pass 3 editor bindings: transparent/selection-safe editing. Session-only tool state. */
'use strict';
function sg2CaptureCustomBrush() {
  const w=project.width,h=project.height;
  try {
    const pixels=ctx(selectedCel()).getImageData(0,0,w,h).data;
    const brush=SG2Paint.captureBrush(pixels,w,h,sg2CurrentMask());
    if(!brush){toast('No visible selected pixels to capture');return;}
    state.sg2CustomBrush=brush;state.brushShape='custom';updateInspector();
    toast('Captured '+brush.width+' × '+brush.height+' custom brush');
  }catch(error){toast(error.message||'Unable to capture brush');}
}
function sg2ResetCustomBrush(){state.sg2CustomBrush=null;if(state.brushShape==='custom')state.brushShape='square';updateInspector();toast('Custom brush cleared')}
function sg2CustomStamp(c,x,y,color,eraser=false,pressure=1){
  const brush=state.sg2CustomBrush;if(!brush)return;
  const centers=[[x,y]],w=project.width,h=project.height;
  if(state.symX)centers.push([w-1-x,y]);
  if(state.symY){centers.push([x,h-1-y]);if(state.symX)centers.push([w-1-x,h-1-y]);}
  const bw=brush.width,bh=brush.height;
  let source=brush;
  if(pressure<.999){const data=new Uint8ClampedArray(brush.data);for(let i=3;i<data.length;i+=4)data[i]=Math.round(data[i]*pressure);source={width:bw,height:bh,data};}
  const g=c.getContext('2d',{willReadFrequently:true});
  for(const [cx,cy] of centers){
    const left=cx-Math.floor(bw/2),top=cy-Math.floor(bh/2);
    const patch=g.getImageData(left,top,bw,bh),allowed=new Uint8Array(bw*bh);
    let any=false;
    for(let yy=0;yy<bh;yy++)for(let xx=0;xx<bw;xx++){
      const xxg=left+xx,yyg=top+yy;
      if(xxg>=0&&yyg>=0&&xxg<w&&yyg<h&&withinSelection(xxg,yyg)){allowed[yy*bw+xx]=1;any=true;}
    }
    if(!any)continue;
    if(SG2Paint.stamp(patch.data,bw,bh,source,Math.floor(bw/2),Math.floor(bh/2),color,state.sg2InkMode||'image',allowed,eraser))g.putImageData(patch,left,top);
  }
}
function sg2GradientPreview(d,point){
  const mask=sg2CurrentMask();
  const result=SG2Paint.linearGradient(d.base.data,project.width,project.height,mask,d.start,point,d.color,d.altColor,state.sg2GradientMode||'smooth',state.sg2GradientType||'linear');
  ctx(selectedCel()).putImageData(new ImageData(result.data,project.width,project.height),0,0);
  return result.changed;
}
function sg2RunPaintEffect(name){
  const layer=selectedLayer();if(layer.locked||!layer.visible){toast('Unlock and show the layer first');return;}
  const w=project.width,h=project.height,pixels=ctx(selectedCel()).getImageData(0,0,w,h),mask=sg2CurrentMask();
  let result;
  if(name==='hsv')result=SG2Paint.adjustHSV(pixels.data,w,h,mask,Number($('sg2Hue').value),Number($('sg2Saturation').value),Number($('sg2Value').value));
  else if(name==='outline')result=SG2Paint.outline(pixels.data,w,h,mask,state.fg,$('sg2OutlineDiagonal').checked,Number($('sg2OutlineThickness').value),$('sg2OutlinePlace').value);
  else throw new Error('Unsupported paint adjustment');
  if(!result.changed){toast('No matching pixels to modify');return;}
  checkpoint();ctx(selectedCel()).putImageData(new ImageData(result.data,w,h),0,0);finishDraw();
  toast(result.changed+' pixels updated');
}
function sg2BindPaintUI(){
  $('sg2CaptureBrush').onclick=sg2CaptureCustomBrush;
  $('sg2ResetBrush').onclick=sg2ResetCustomBrush;
  $('sg2BrushInk').onchange=e=>{state.sg2InkMode=e.target.value;};
  $('sg2GradientMode').onchange=e=>{state.sg2GradientMode=e.target.value;};
  $('sg2GradientType').onchange=e=>{state.sg2GradientType=e.target.value;};
  $('sg2ApplyHSV').onclick=()=>sg2RunPaintEffect('hsv');
  $('sg2ApplyOutline').onclick=()=>sg2RunPaintEffect('outline');
  for(const [id,out] of [['sg2Hue','sg2HueValue'],['sg2Saturation','sg2SaturationValue'],['sg2Value','sg2ValueValue']]){
    $(id).oninput=e=>{$(out).textContent=e.target.value;};
  }
}

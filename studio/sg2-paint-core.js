/* SG-2 pass 3: bounded, deterministic RGBA painting effects.
   Pixel buffers are unpremultiplied RGBA, one byte per channel. No DOM needed. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SG2Paint = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const BAYER4 = [0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const integer = (n, lo, hi) => clamp(Math.trunc(Number(n) || 0), lo, hi);
  function validate(pixels, w, h, mask) {
    if (!Number.isInteger(w) || !Number.isInteger(h) || w < 1 || h < 1 || w * h > 512 * 512 ||
      !pixels || pixels.length !== w * h * 4 || (mask && mask.length !== w * h))
      throw new RangeError('SG-2 pixel buffer size mismatch');
  }
  function rgba(color) {
    if (Array.isArray(color) && color.length >= 3)
      return [integer(color[0],0,255),integer(color[1],0,255),integer(color[2],0,255),color.length > 3 ? integer(color[3],0,255) : 255];
    const hex = String(color || '').replace(/^#/, '');
    if (!/^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(hex)) throw new TypeError('Expected #RRGGBB or #RRGGBBAA');
    return [parseInt(hex.slice(0,2),16),parseInt(hex.slice(2,4),16),parseInt(hex.slice(4,6),16),hex.length===8?parseInt(hex.slice(6,8),16):255];
  }
  function samePixel(a,b,off) { for (let k=0;k<4;k++) if (a[off+k]!==b[k]) return false; return true; }
  function linearGradient(pixels,w,h,mask,start,end,first,second,mode='smooth') {
    validate(pixels,w,h,mask);
    if (mode !== 'smooth' && mode !== 'dither') throw new RangeError('Unknown gradient mode');
    const a=rgba(first),b=rgba(second),out=new Uint8ClampedArray(pixels);
    const dx=end.x-start.x,dy=end.y-start.y,den=dx*dx+dy*dy;
    if (!Number.isFinite(den)) throw new RangeError('Invalid gradient coordinates');
    let changed=0;
    for(let y=0;y<h;y++) for(let x=0;x<w;x++) {
      const n=y*w+x;if(mask&&!mask[n])continue;
      const t=den===0?0:clamp(((x-start.x)*dx+(y-start.y)*dy)/den,0,1);
      const c=new Array(4);
      if(mode==='smooth')for(let k=0;k<4;k++)c[k]=Math.round(a[k]+(b[k]-a[k])*t);
      else {const t2=t>=1?true:t>0&&t*16>BAYER4[(y&3)*4+(x&3)];for(let k=0;k<4;k++)c[k]=t2?b[k]:a[k];}
      const i=n*4;if(samePixel(out,c,i))continue;
      out.set(c,i);changed++;
    }
    return {data:out,changed};
  }
  function rgbToHsv(r,g,b){
    r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
    let h=0;if(d){if(max===r)h=((g-b)/d)%6;else if(max===g)h=(b-r)/d+2;else h=(r-g)/d+4;h=(h*60+360)%360;}
    return [h,max===0?0:d/max,max];
  }
  function hsvToRgb(h,s,v){
    const c=v*s,x=c*(1-Math.abs((h/60)%2-1)),m=v-c;
    const sector=Math.floor(h/60)%6;
    const values=sector===0?[c,x,0]:sector===1?[x,c,0]:sector===2?[0,c,x]:sector===3?[0,x,c]:sector===4?[x,0,c]:[c,0,x];
    return values.map(t=>Math.round(clamp(t+m,0,1)*255));
  }
  function adjustHSV(pixels,w,h,mask,hue=0,saturation=0,value=0){
    validate(pixels,w,h,mask);
    hue=Number(hue)||0;saturation=clamp((Number(saturation)||0)/100,-1,1);value=clamp((Number(value)||0)/100,-1,1);
    if(!Number.isFinite(hue))throw new RangeError('Invalid hue');
    const out=new Uint8ClampedArray(pixels);let changed=0;
    for(let n=0;n<w*h;n++){
      if((mask&&!mask[n])||!pixels[n*4+3])continue;
      const i=n*4,[h0,s0,v0]=rgbToHsv(pixels[i],pixels[i+1],pixels[i+2]);
      const rgb=hsvToRgb((h0+hue%360+360)%360,clamp(s0+saturation,0,1),clamp(v0+value,0,1));
      if(rgb.every((v,k)=>v===pixels[i+k]))continue;
      out.set(rgb,i);changed++;
    }
    return {data:out,changed};
  }
  function outline(pixels,w,h,mask,color='#000000',diagonal=false,thickness=1){
    validate(pixels,w,h,mask);const out=new Uint8ClampedArray(pixels),ink=rgba(color);
    thickness=integer(thickness,1,3);
    const originalOpaque=new Uint8Array(w*h),coverage=new Uint8Array(w*h);
    for(let n=0;n<w*h;n++)if(pixels[n*4+3]&&(!mask||mask[n]))originalOpaque[n]=coverage[n]=1;
    const neighbors=diagonal?[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]:[[1,0],[-1,0],[0,1],[0,-1]];
    for(let pass=0;pass<thickness;pass++){
      const grown=new Uint8Array(coverage);
      for(let n=0;n<coverage.length;n++)if(coverage[n]){
        const x=n%w,y=(n/w)|0;
        for(const [dx,dy] of neighbors){const xx=x+dx,yy=y+dy;if(xx<0||xx>=w||yy<0||yy>=h)continue;
          const dst=yy*w+xx;if((!mask||mask[dst])&&!pixels[dst*4+3])grown[dst]=1;
        }
      }
      coverage.set(grown);
    }
    let changed=0;
    for(let n=0;n<coverage.length;n++)if(coverage[n]&&!originalOpaque[n]&&!pixels[n*4+3]){out.set(ink,n*4);changed++;}
    return {data:out,changed};
  }
  function captureBrush(pixels,w,h,mask) {
    validate(pixels,w,h,mask);
    let minX=w,minY=h,maxX=-1,maxY=-1;
    for(let n=0;n<w*h;n++)if((!mask||mask[n])&&pixels[n*4+3]){
      const x=n%w,y=(n/w)|0;minX=Math.min(x,minX);minY=Math.min(y,minY);maxX=Math.max(x,maxX);maxY=Math.max(y,maxY);
    }
    if(maxX<minX)return null;
    const bw=maxX-minX+1,bh=maxY-minY+1;
    if(bw>64||bh>64)throw new RangeError('Custom brush may be at most 64×64 pixels');
    const data=new Uint8ClampedArray(bw*bh*4);
    for(let y=0;y<bh;y++)for(let x=0;x<bw;x++){
      const src=(y+minY)*w+x+minX;
      if(!mask||mask[src])data.set(pixels.subarray(src*4,src*4+4),(y*bw+x)*4);
    }
    return {width:bw,height:bh,data};
  }
  function stamp(pixels,w,h,brush,centerX,centerY,color='#ffffff',mode='image',mask=null,erase=false){
    validate(pixels,w,h,mask);
    if(!brush||!Number.isInteger(brush.width)||!Number.isInteger(brush.height)||brush.width<1||brush.height<1||
       brush.width>64||brush.height>64||!brush.data||brush.data.length!==brush.width*brush.height*4)
      throw new RangeError('Invalid custom brush');
    if(mode!=='image'&&mode!=='tint')throw new RangeError('Unknown brush ink mode');
    const tint=rgba(color);let changed=0;
    const offsetX=Math.trunc(centerX)-Math.floor(brush.width/2),offsetY=Math.trunc(centerY)-Math.floor(brush.height/2);
    for(let y=0;y<brush.height;y++)for(let x=0;x<brush.width;x++){
      const xx=offsetX+x,yy=offsetY+y;if(xx<0||yy<0||xx>=w||yy>=h)continue;
      const n=yy*w+xx;if(mask&&!mask[n])continue;
      const src=(y*brush.width+x)*4,alpha=brush.data[src+3]/255;if(!alpha)continue;
      const at=n*4,oldA=pixels[at+3]/255;
      if(erase){const newA=oldA*(1-alpha);const next=Math.round(newA*255);if(next===pixels[at+3])continue;
        pixels[at+3]=next;if(next===0)pixels.fill(0,at,at+4);changed++;continue;}
      const srcColor=mode==='tint'?tint:brush.data;
      const sr=mode==='tint'?srcColor[0]:srcColor[src],sg=mode==='tint'?srcColor[1]:srcColor[src+1],sb=mode==='tint'?srcColor[2]:srcColor[src+2];
      const newA=alpha+oldA*(1-alpha);if(!newA)continue;
      const next=[Math.round((sr*alpha+pixels[at]*oldA*(1-alpha))/newA),Math.round((sg*alpha+pixels[at+1]*oldA*(1-alpha))/newA),Math.round((sb*alpha+pixels[at+2]*oldA*(1-alpha))/newA),Math.round(newA*255)];
      if(samePixel(pixels,next,at))continue;pixels.set(next,at);changed++;
    }
    return changed;
  }
  return Object.freeze({linearGradient,adjustHSV,outline,captureBrush,stamp,rgba});
});

// SG-2: execute the real offline mask engine under Node (no test-only raster copy).
const {test}=require('node:test');
const assert=require('node:assert/strict');
const s=require('../../../studio/sg2-selection-core.js');
const count=m=>m.reduce((a,v)=>a+v,0);
const rgba=(w,h,fn)=>{const d=new Uint8ClampedArray(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++)d.set(fn(x,y),4*(y*w+x));return d};
test('rectangle inclusive and clipped',()=>{
 const m=s.rect(5,5,{x:2,y:1},{x:8,y:3});assert.equal(count(m),9);assert.deepEqual(s.bounds(m,5,5),{x:2,y:1,w:3,h:3,count:9});
});
test('ellipse mask excludes rectangle corners',()=>{
 const m=s.ellipse(5,5,{x:0,y:0},{x:4,y:4});assert.equal(m[0],0);assert.equal(m[2+5*2],1);assert.equal(count(m),21);
});
test('polygon closure rasterizes boundaries',()=>{
 const m=s.polygon(8,8,[{x:1,y:1},{x:6,y:1},{x:1,y:6}]);assert.equal(m[1*8+1],1);assert.equal(m[5*8+5],0);assert.equal(m[2*8+2],1);
});
test('contiguous and global wand differ',()=>{
 const p=rgba(5,3,x=>[x===2?200:1,0,0,255]);
 assert.equal(count(s.wand(p,5,3,0,0)),6);assert.equal(count(s.wand(p,5,3,0,0,0,false)),12);
});
test('wand tolerance tracks color distance',()=>{
 const p=rgba(3,1,x=>[x*9,0,0,255]);
 assert.equal(count(s.wand(p,3,1,0,0,10,true)),2);assert.equal(count(s.wand(p,3,1,0,0,20,true)),3);
});
test('combine replace/add/subtract/intersect',()=>{
 const a=s.rect(4,4,{x:0,y:0},{x:1,y:1}),b=s.rect(4,4,{x:1,y:1},{x:2,y:2});
 assert.deepEqual(['replace','add','subtract','intersect'].map(op=>count(s.combine(a,b,op))),[4,7,3,1]);
});
test('mask-aware clipboard preserves transparency',()=>{
 const p=rgba(5,5,()=>[80,10,5,255]),m=s.ellipse(5,5,{x:0,y:0},{x:4,y:4});
 const c=s.copied(p,m,5,5);assert.equal(c.width,5);assert.equal(c.data[3],0);assert.equal(c.data[(2*5+2)*4+3],255);
});
test('delete selected pixels only',()=>{
 const p=rgba(3,3,()=>[80,10,5,255]),m=s.rect(3,3,{x:1,y:1},{x:1,y:1});
 const c=s.cleared(p,m,3,3);assert.equal(c.changed,1);assert.equal(c.data[3],255);assert.equal(c.data[(1*3+1)*4+3],0);
});
test('horizontal flip moves only selected pixels',()=>{
 const p=rgba(4,2,x=>[x+1,0,0,255]),m=s.rect(4,2,{x:1,y:0},{x:2,y:0});
 const r=s.transformed(p,m,4,2,'flip-h');assert.equal(r.data[4],3);assert.equal(r.data[8],2);assert.equal(r.data[0],1);assert.equal(r.data[12],4);
});
test('selected movement updates pixels and mask',()=>{
 const p=rgba(4,2,x=>[x+1,0,0,255]),m=s.rect(4,2,{x:1,y:0},{x:1,y:0});
 const r=s.transformed(p,m,4,2,'move',1,1);assert.equal(r.data[(0*4+1)*4+3],0);assert.equal(r.data[(1*4+2)*4],2);assert.equal(r.mask[1*4+2],1);assert.equal(r.data[0],1);
});
test('CW and CCW rotations reverse each other in a square selection',()=>{
 const p=rgba(5,5,(x,y)=>[x*10+y,0,0,255]),m=s.rect(5,5,{x:1,y:1},{x:3,y:3});
 const r=s.transformed(p,m,5,5,'rotate-cw'),back=s.transformed(r.data,r.mask,5,5,'rotate-ccw');
 assert.deepEqual(Array.from(back.data),Array.from(p));
});
test('large transparent regions have bounded contiguous flood',()=>{
 const p=new Uint8ClampedArray(512*512*4);assert.equal(count(s.wand(p,512,512,12,12)),512*512);
});
test('invalid canvas dimensions are rejected',()=>{
 assert.throws(()=>s.all(513,513),RangeError);assert.throws(()=>s.all(-1,2),RangeError);
});

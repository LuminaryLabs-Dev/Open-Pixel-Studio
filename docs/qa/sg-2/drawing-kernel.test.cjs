'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.resolve(__dirname, '../../../studio/app.js'), 'utf8');
const start = source.indexOf('function sg2Pressure(');
const end = source.indexOf('function drawShape(', start);
assert(start >= 0 && end > start, 'SG-2 drawing kernel present');
// Exercise the real editor function bodies with lightweight pixel-canvas adapters.
// Do not silently substitute duplicated test-only rasterizers.
const core = new Function('project','state','inside','withinSelection','clamp',
  source.slice(start,end) + ';return {sg2DitherAllows,paintPixel,sg2AppendPath,sg2DrawPath,sg2Pressure};'
);
function engine(){
 const state={brush:1,brushShape:'square',ditherPattern:'checker',symX:false,symY:false,pressureEnabled:true};
 const project={width:20,height:20};
 const k=core(project,state,(x,y)=>x>=0&&y>=0&&x<20&&y<20,()=>true,(x,a,b)=>Math.max(a,Math.min(b,x)));
 return {state,k};
}
function canvas(){const pixels=new Set();return {pixels,fillRect(x,y){pixels.add(x+','+y)},clearRect(x,y){pixels.delete(x+','+y)}}}
test('single pixel stamp',()=>{const {k}=engine(),c=canvas();k.paintPixel(c,4,5,'#fff');assert.deepEqual([...c.pixels],['4,5'])});
test('3-pixel circle is pixel-aligned',()=>{const {state,k}=engine(),c=canvas();state.brush=3;state.brushShape='circle';k.paintPixel(c,5,5,'#fff');assert.equal(c.pixels.size,5)});
test('square brush size',()=>{const {state,k}=engine(),c=canvas();state.brush=3;k.paintPixel(c,5,5,'#fff');assert.equal(c.pixels.size,9)});
test('pressure shrinks brush deterministically',()=>{const {state,k}=engine(),c=canvas();state.brush=7;k.paintPixel(c,5,5,'#fff',false,false,.3);assert.equal(c.pixels.size,4)});
test('checker dithering coverage',()=>{const {state,k}=engine(),c=canvas();state.brush=4;k.paintPixel(c,5,5,'#fff',false,true);assert.equal(c.pixels.size,8)});
test('Bayer 25% coverage',()=>{const {state,k}=engine(),c=canvas();state.brush=4;state.ditherPattern='bayer25';k.paintPixel(c,6,6,'#fff',false,true);assert.equal(c.pixels.size,4)});
test('pixel-perfect strokes omit sharp inner corners',()=>{const {k}=engine(),c=canvas();k.sg2DrawPath(c,[{x:3,y:3,pressure:1},{x:4,y:3,pressure:1},{x:4,y:4,pressure:1}],'#fff');assert.equal(c.pixels.size,2);assert.equal(c.pixels.has('4,3'),false)});
test('Bresenham sampling reaches endpoint',()=>{const {k}=engine(),pts=[{x:0,y:0,pressure:1}];k.sg2AppendPath(pts,pts[0],{x:5,y:2},1);assert.equal(pts.length,6);assert.equal(pts[pts.length-1].x,5);assert.equal(pts[pts.length-1].y,2)});

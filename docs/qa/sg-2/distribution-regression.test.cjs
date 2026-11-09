// SG-2 pass 3 distribution and regression contract. Run from repository root:
// node --test docs/qa/sg-2/distribution-regression.test.cjs
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'../../..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const modules=[
 'studio/sg2-selection-core.js',
 'studio/sg2-selection-interaction.js',
 'studio/sg2-paint-core.js',
 'studio/sg2-paint-ui.js',
 'studio/app.js',
 'studio/v110.js'
];
const bundles=['studio/standalone.html','release/html5/index.html','desktop/editor.html'];
const split='studio/index.html';
const ids=['sg2CaptureBrush','sg2ResetBrush','sg2BrushInk','sg2GradientMode',
 'sg2GradientType','sg2ApplyHSV','sg2ApplyOutline','sg2OutlinePlace',
 'sg2Hue','sg2Saturation','sg2Value','sg2SelectionCanvas',
 'sg2SelectMode','sg2Tolerance','sg2SelectAll','sg2RotateCW','sg2CropSelection'];
const embedded=html=>[...html.matchAll(/<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
test('classic-script source parses',()=>{for(const name of modules)assert.doesNotThrow(()=>new vm.Script(read(name),{filename:name}))});
test('standalone HTML5 and itch entrypoints are identical',()=>assert.equal(read(bundles[0]),read(bundles[1])));
test('all distribution entrypoints have functional SG-2 controls',()=>{for(const name of [split,...bundles]){const html=read(name);for(const id of ids)assert.match(html,new RegExp('id="'+id+'"'),name+' missing '+id);}});
test('split-source scripts have correct dependency order',()=>{
 const html=read(split);
 let last=-1;for(const name of modules){const pos=html.indexOf('src="'+path.basename(name)+'"');assert.ok(pos>last,'Invalid script order for '+name);last=pos;}
});
test('self-contained bundles embed exact runnable module sources',()=>{
 for(const name of bundles){const blocks=embedded(read(name));
  for(const block of blocks)assert.doesNotThrow(()=>new vm.Script(block,{filename:name}));
  for(const sourceName of modules)assert.ok(blocks.some(block=>block.trim()===read(sourceName).trim()),name+' module drift '+sourceName);
 }
});
test('browser distribution uses only inline JS and CSS',()=>{
 const html=read(bundles[1]);
 assert.doesNotMatch(html,/<script[^>]+src\s*=/i);
 assert.doesNotMatch(html,/<link[^>]+rel=["']stylesheet/i);
 assert.match(html,/<style>/);
});
test('prior editor document and export functions remain implemented',()=>{
 const code=read('studio/app.js');
 for(const symbol of ['function serialize(','function loadSerialized(','function saveProject(',
   'function exportFrame(','function exportSheet(','function exportGIF(',
   'function drawShape(','function floodFill(','function undo(','function redo(',
   'function bindWorkspace('])assert.ok(code.includes(symbol),'Missing legacy function '+symbol);
 assert.ok(read('studio/v110.js').includes('OpenPixelPack'),'v1.1 export pack lost');
});
test('Aseprite parity drawing controls and undo hooks remain connected',()=>{
 const code=read('studio/app.js'),ui=read('studio/sg2-paint-ui.js');
 assert.match(code,/sg2BindPaintUI\(\)/);
 assert.match(code,/tool==='gradient'/);
 assert.match(ui,/checkpoint\(\)/);
 assert.match(ui,/function sg2CustomStamp\(/);
 assert.match(ui,/function sg2RunPaintEffect\(/);
 assert.match(read('studio/sg2-selection-interaction.js'),/function sg2Reselect\(/);
});

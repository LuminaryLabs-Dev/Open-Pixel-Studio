// SG-2: parity of selection modifiers and exact reselect behavior.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const SG2Selection=require('../../../studio/sg2-selection-core.js');
const source=fs.readFileSync(path.resolve(__dirname,'../../../studio/sg2-selection-interaction.js'),'utf8');
function harness(){
 const state={selection:null,selectionMask:null,lastSelection:null,sg2Polygon:null},project={width:8,height:8},messages=[];
 const host={SG2Selection,state,project,$:()=>({value:'replace'}),toast:msg=>messages.push(msg),updateSelectionBox:()=>{}};
 const methods=vm.runInNewContext(source+';({mode:sg2SelectionMode,set:sg2SetSelection,reselect:sg2Reselect,current:sg2CurrentMask})',host);
 return {state,project,messages,...methods};
}
test('Shift adds to selection',()=>{const x=harness();assert.equal(x.mode({shiftKey:true}),'add')});
test('Alt+Shift subtracts, not adds',()=>{const x=harness();assert.equal(x.mode({altKey:true,shiftKey:true}),'subtract')});
test('Ctrl+Shift intersects, not adds',()=>{const x=harness();assert.equal(x.mode({ctrlKey:true,shiftKey:true}),'intersect')});
test('command modifier intersects on macOS',()=>{const x=harness();assert.equal(x.mode({metaKey:true,shiftKey:true}),'intersect')});
test('tool UI mode is fallback',()=>{const x=harness();assert.equal(x.mode({}),'replace')});
test('deselect saves exact 8x8 mask',()=>{const x=harness(),m=SG2Selection.rect(8,8,{x:1,y:1},{x:2,y:2});x.set(m);x.set(null);assert.equal(x.state.selection,null);assert.equal(x.state.lastSelection.reduce((a,b)=>a+b,0),4)});
test('reselect restores mask from remembered state',()=>{const x=harness(),m=SG2Selection.rect(8,8,{x:1,y:1},{x:2,y:2});x.set(m);x.set(null);x.reselect();assert.equal(x.current().reduce((a,b)=>a+b,0),4);assert.notEqual(x.current(),x.state.lastSelection)});
test('reselect without previous selection is safe',()=>{const x=harness();x.reselect();assert.equal(x.state.selection,null);assert.equal(x.messages[0],'No previous selection')});
test('reselect does not overwrite a current selection',()=>{const x=harness(),m=SG2Selection.rect(8,8,{x:1,y:1},{x:2,y:2});x.set(m);x.reselect();assert.equal(x.state.selection.w,2);assert.equal(x.messages[0],'Selection is already active')});

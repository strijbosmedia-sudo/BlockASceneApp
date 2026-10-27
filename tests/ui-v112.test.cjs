const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const M=require('../app/model.js'),P=require('../app/playback.js');
const appHandlers={};let active=null,openedField=null,selected=false,stored={};
const project=M.createProject('Focus Test Film');
const fields=new Map();
function makeField(id,value){
 const field={id,value,checked:false,selectionStart:0,selectionEnd:0,
  focus(){active=this},select(){selected=true;this.selectionStart=0;this.selectionEnd=this.value.length},
  setSelectionRange(s,e){this.selectionStart=s;this.selectionEnd=e}};
 return field;
}
const app={
 _html:'',
 addEventListener(name,fn){(appHandlers[name]??=[]).push(fn)},
 get innerHTML(){return this._html},
 set innerHTML(v){
  this._html=v;fields.clear();
  for(const id of ['entityEditName','beatEditName']){
   const rx=new RegExp('<input[^>]*id="'+id+'"[^>]*value="([^"]*)"','i'),match=v.match(rx);
   if(match)fields.set(id,makeField(id,match[1]));
  }
 },
 querySelector(s){if(s==='.manual-content')return {scrollTop:0};const id=s.startsWith('#')?s.slice(1):null;return fields.get(id)||null},
 querySelectorAll(s){return s.includes('.dialog-card')?[...fields.values()]:[]},
};
const doc={
 get activeElement(){return active},
 getElementById(id){return id==='app'?app:['backgroundFile','projectFile'].includes(id)?{addEventListener(){}}:null},
 querySelector(){return null},querySelectorAll(){return []}
};
const win={B4Model:M,B4Playback:P,B4Manual:[],innerWidth:1400,addEventListener(){}};
const sandbox={window:win,document:doc,performance:{now:()=>0},
 indexedDB:{open(){throw Error('storage mock')}},localStorage:{getItem(){return null},setItem(key,value){stored[key]=value}},
 console,setTimeout(){return 1},clearTimeout(){},innerWidth:1400,innerHeight:900,Date,Math};
sandbox.globalThis=sandbox;
let src=fs.readFileSync(path.join(__dirname,'../app/app.js'),'utf8');
const marker=src.lastIndexOf('})();');assert.ok(marker>0);
src=src.slice(0,marker)+'globalThis.__v112={ui,database,render,modal,inspector,layers,panelMeta,panelStyle,defaultLayout,saveLayout};\n'+src.slice(marker);
vm.runInNewContext(src,sandbox);
const u=sandbox.__v112;u.database.projects=[project];u.ui.projectId=project.id;
u.ui.page='project';u.ui.dialog={kind:'edit-project',id:project.id};u.render();
assert.equal(active?.id,'entityEditName','edit project automatically focuses the name');
assert.equal(active.value,'Focus Test Film');assert.equal(selected,true);
active.value='An unsaved title';active.setSelectionRange(3,6);u.render();
assert.equal(active.value,'An unsaved title','rerenders do not erase typed text');
assert.equal(active.selectionStart,3);assert.equal(active.selectionEnd,6);
u.ui.dialog={kind:'edit-scene',id:project.scenes[0].id};u.render();
assert.equal(active?.id,'entityEditName','edit scene focuses the name');
assert.equal(active.value,project.scenes[0].name);
u.ui.dialog=null;u.ui.page='editor';u.ui.sceneId=project.scenes[0].id;u.ui.beatId=project.scenes[0].beats[0].id;
u.ui.showLayers=true;u.ui.showInspector=true;u.ui.selection={type:'actor',id:project.scenes[0].actors[0].id};
u.ui.layout.layersSide='left';u.ui.layout.layersPinned=true;
u.ui.layout.propertiesSide='right';u.ui.layout.propertiesPinned=true;
assert.match(u.layers(),/data-side="left"/);assert.match(u.layers(),/class="layers-pop side-pop docked"/);
assert.match(u.inspector(),/data-side="right"/);assert.match(u.inspector(),/class="inspector docked"/);
assert.match(u.inspector(),/data-action="switch-panel-side"/);
u.ui.layout.layersPinned=false;u.ui.layout.layersFloatX=145;u.ui.layout.layersFloatY=42;u.ui.layout.layersFloatHeight=430;
assert.match(u.layers(),/data-moved="true"/);
assert.match(u.layers(),/left:145px;top:42px/);
assert.match(u.layers(),/is-floating/);
assert.match(u.panelStyle('layers'),/height:430px/);
u.saveLayout();const prefs=JSON.parse(stored['Block4Film-v11-layout']);assert.equal(prefs.layersSide,'left');assert.equal(prefs.propertiesSide,'right');
const css=fs.readFileSync(path.join(__dirname,'../app/styles.css'),'utf8');
assert.match(css,/panel-resizer\.is-floating/);
assert.match(css,/panel-float\[data-side="left"\]/);
assert.match(css,/\.layers-pop\.docked\[data-side="left"\]/);
console.log('v1.1.2 dialog focus/caret, independent panel sides, floating dimensions and persistence passed');

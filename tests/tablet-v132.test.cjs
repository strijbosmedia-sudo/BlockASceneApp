const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const M=require('../app/model.js'),P=require('../app/playback.js');
const project=M.createProject('On-set Import');
const actor=project.scenes[0].actors[0],beat=project.scenes[0].beats[0];
beat.positions[actor.id].motion={kind:'walk',endX:410,endY:210,endRotation:30,
 pathType:'smooth',keys:[{id:'keyOne',x:370,y:230,rotation:24,t:.5}]};
const app={innerHTML:'',addEventListener(){},querySelector(){return null},querySelectorAll(){return []}};
const fakeInput={addEventListener(){},click(){}};
const toast={textContent:'',classList:{add(){},remove(){}}};
const document={getElementById(id){return id==='app'?app:id==='toast'?toast:fakeInput},
 querySelector(){return null},querySelectorAll(){return []},get activeElement(){return null}};
const win={B4Model:M,B4Playback:P,B4Previews:null,B4Manual:[],innerWidth:720,addEventListener(){}};
const sandbox={document,window:win,performance:{now:()=>0},localStorage:{getItem(){return null},setItem(){}},
 indexedDB:{open(){throw Error('no test storage')}},console,clearTimeout(){},setTimeout(){return 1},
 Date,Math,Map,Set,devicePixelRatio:1};
sandbox.globalThis=sandbox;
let source=fs.readFileSync(path.join(__dirname,'../app/app.js'),'utf8');
source=source.replace('function render(){','function render(){return;');
source=source.replace('(async()=>{try{const layout=','(async()=>{return;try{const layout=');
const last=source.lastIndexOf('})();');assert.ok(last>0);
source=source.slice(0,last)+
 'globalThis.__v132={ui,database,inspector,editor,importProject,readProjectText,action};\n'+source.slice(last);
vm.runInNewContext(source,sandbox);
const appTest=sandbox.__v132;
appTest.database.projects=[project];appTest.ui.projectId=project.id;
appTest.ui.sceneId=project.scenes[0].id;appTest.ui.beatId=beat.id;
appTest.ui.showInspector=true;appTest.ui.selection={type:'actor',id:actor.id};
function assertBalancedDivs(html){
 const tags=html.match(/<\/?(?:div|aside)\b[^>]*>/g)||[],stack=[];
 for(const tag of tags){const name=tag.match(/^<\/?([a-z]+)/)[1];
  if(tag.startsWith('</'))assert.equal(stack.pop(),name,'Mismatched container: '+tag);
  else stack.push(name);
 }
 assert.equal(stack.length,0,'Container left unclosed in Properties HTML');
}
let html=appTest.inspector();
assert.match(html,/class="motion-keyframe-list"/);
assert.match(html,/class="keyframe-row"/);
assertBalancedDivs(html);
assert.ok(html.includes('data-panel="properties"'));
assert.ok(html.includes('data-action="add-motion-keyframe"'));
appTest.ui.selection={type:'camera',id:project.scenes[0].cameras[0].id};
const cameraBeat=project.scenes[0].beats[0].cameras[appTest.ui.selection.id];
cameraBeat.motion={kind:'pan',endX:cameraBeat.x,endY:cameraBeat.y,endRotation:175};
assertBalancedDivs(appTest.inspector());
appTest.ui.selection={type:'actor',id:actor.id};
beat.positions[actor.id].motion=null;
assertBalancedDivs(appTest.inspector());
beat.positions[actor.id].motion={kind:'turn',endX:beat.positions[actor.id].x,endY:beat.positions[actor.id].y,endRotation:80};
assertBalancedDivs(appTest.inspector());
const layout=appTest.editor();
assert.match(layout,/<nav class="utility-rail"/);
assert.match(layout,/<div class="timeline /);
assert.ok(layout.indexOf('<nav class="utility-rail"')<layout.indexOf('<div class="timeline '),'Rail stays above beat timeline');
assert.match(layout,/data-panel="properties"/);
const css=fs.readFileSync(path.join(__dirname,'../app/styles.css'),'utf8');
assert.match(css,/\.motion-keyframe-list/);
assert.match(css,/\.work-canvas>.inspector \.inspect-body\{display:block!important/);
const handle=source.match(/function paintDirectionHandle\([\s\S]*?\n\}/)?.[0]||'';
assert.ok(handle.includes("marker==='END'?40:32"),'Smaller destination direction ring');
assert.doesNotMatch(handle,/lineTo\(target\.x,target\.y\)/,'No center-to-knob spoke');

(async()=>{
 const exported=JSON.stringify({format:'blockascene',version:2,project});
 const imported=await appTest.readProjectText({name:'A.blockascene',content:'\uFEFF'+exported});
 assert.equal(JSON.parse(imported.slice(1)).project.name,'On-set Import');
 await appTest.importProject({name:'A.blockascene',content:'\uFEFF'+exported});
 assert.equal(appTest.database.projects.length,2);
 assert.equal(appTest.database.projects[1].name,'On-set Import');
 assert.notEqual(appTest.database.projects[1].id,project.id,'Duplicate import receives a new ID');
 assert.equal(appTest.database.projects[1].scenes[0].name,project.scenes[0].name);
 await appTest.importProject({name:'invalid.blockascene',content:'This is not JSON'});
 assert.equal(appTest.database.projects.length,2,'Corrupt data does not replace existing projects');
 assert.match(toast.textContent,/Import failed/);
 // Native picker returns decoded content; verifies the actual app action routes it to importer.
 win.Capacitor={isNativePlatform:()=>true};
 let invoked=0;win.Block4FilmMobile={pickProject:async()=>{invoked++;return {name:'Tablet.blockascene',content:exported}}};
 await appTest.action({target:{closest(){return {dataset:{action:'import-project'}}}},preventDefault(){},stopPropagation(){}});
 assert.equal(invoked,1);assert.equal(appTest.database.projects.length,3);
 assert.equal(appTest.database.projects[2].scenes[0].beats[0].positions[actor.id].motion.kind,'turn');
 console.log('1.3.2 panel structure, ring clarity, desktop/native import, duplicate IDs and invalid backups passed');
})().catch(e=>{console.error(e);process.exitCode=1});

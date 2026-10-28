const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const M=require('../app/model.js'),P=require('../app/playback.js');
module.exports=function harness(extra={}){
 const events={},toast={textContent:'',classList:{add(){},remove(){}}};
 const app={innerHTML:'',addEventListener(name,fn){(events[name]??=[]).push(fn)},querySelector(){return null},querySelectorAll(){return []}};
 const input={value:'',addEventListener(){},click(){}};
 const document={getElementById:id=>id==='app'?app:id==='toast'?toast:input,querySelector(){return null},querySelectorAll(){return []},activeElement:null};
 const window={B4Model:M,B4Playback:P,B4Previews:null,B4Manual:[],innerWidth:1280,addEventListener(){},...extra.window};
 const sandbox={window,document,console,performance:{now:()=>0},indexedDB:{open(){throw Error('offline')}},localStorage:{getItem(){return null},setItem(){}},setTimeout(){return 1},clearTimeout(){},Date,Math,Map,Set,Blob,File,URL,devicePixelRatio:1,...extra};
 sandbox.window=window;sandbox.globalThis=sandbox;
 let source=fs.readFileSync(path.join(__dirname,'../app/app.js'),'utf8');
 source=source.replace('function render(){','function render(){return;').replace('function paint(){','function paint(){return;').replace('(async()=>{try{const layout=','(async()=>{return;try{const layout=');
 const at=source.lastIndexOf('})();');
 source=source.slice(0,at)+`globalThis.h={ui,database,edit,action,backup,download,inspector,modal,drawGhostStates,place,saveEntityDialog,openEditDialog,setCanvas(el){canvas=el},onDown,onMove,onUp,getGhosts(sc,idx){const result=[],a=drawActor,c=drawCamera,e=drawEquipment;drawActor=(g,o)=>result.push('actor:'+o.id);drawCamera=(g,o)=>result.push('camera:'+o.id);drawEquipment=()=>{};drawGhostStates({},sc,idx);drawActor=a;drawCamera=c;drawEquipment=e;return result}};\n`+source.slice(at);
 vm.runInNewContext(source,sandbox);
 const project=M.createProject('Feedback test'),scene=project.scenes[0],beat=scene.beats[0];
 Object.assign(sandbox.h.ui,{projectId:project.id,sceneId:scene.id,beatId:beat.id,page:'editor',showInspector:true});sandbox.h.database.projects=[project];
 return {...sandbox.h,project,scene,beat,app,toast,window,events,sandbox};
};

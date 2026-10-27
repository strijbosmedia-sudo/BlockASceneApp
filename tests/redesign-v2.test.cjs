const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const M=require('../app/model.js'),P=require('../app/playback.js'),PREV=require('../app/previews.js');
(async()=>{
 const p=M.createProject('Preview Test Film'),scene=p.scenes[0];
 class TestImage{
  constructor(){this.complete=false;this.naturalWidth=1100;this.naturalHeight=700}
  set src(v){this._src=v;this.complete=true;if(this.onload)this.onload()}
  get src(){return this._src}
 }
 let drawCount=0;
 const context={save(){},restore(){},translate(){},scale(){},fillRect(){drawCount++},beginPath(){},moveTo(){},lineTo(){},
  stroke(){},fill(){},arc(){},closePath(){},rotate(){},roundRect(){},strokeRect(){},drawImage(){drawCount++},fillText(){}};
 const previewCanvas={width:0,height:0,getContext(){return context},toDataURL(type){assert.equal(type,'image/jpeg');return 'data:image/jpeg;base64,YmxvY2s='}};
 const first=PREV.signature(p,scene);
 const generated=await PREV.renderScene(p,scene,{document:{createElement(){return previewCanvas}},Image:TestImage});
 assert.equal(generated,'data:image/jpeg;base64,YmxvY2s=');
 assert.ok(drawCount>1,'background and blocking markers are drawn');
 scene.beats[0].positions[scene.actors[0].id].x+=40;
 assert.notEqual(PREV.signature(p,scene),first,'Beat 1 changes trigger a new preview');
 scene.autoPreview=generated;
 assert.equal(PREV.previewForProject(p),generated);
 scene.customPreview='data:image/jpeg;base64,c2NlbmU=';
 assert.equal(PREV.previewForProject(p),scene.customPreview,'scene override drives default project preview');
 p.customPreview='data:image/jpeg;base64,cHJvamVjdA==';
 assert.equal(PREV.previewForProject(p),p.customPreview,'project override wins');
 const restored=M.migrate(p);assert.equal(restored.customPreview,p.customPreview);
 assert.equal(restored.scenes[0].customPreview,scene.customPreview);
 assert.equal(restored.schemaVersion,2,'existing project schema remains compatible');
 const handlers={};
 const app={innerHTML:'',addEventListener(k,fn){handlers[k]=fn},querySelector(){return null},querySelectorAll(){return []}};
 const file={addEventListener(){}};
 const doc={getElementById(id){return id==='app'?app:['backgroundFile','projectFile','previewFile'].includes(id)?file:null},
  querySelector(){return null},querySelectorAll(){return []}};
 const win={B4Model:M,B4Playback:P,B4Previews:PREV,B4Manual:[],addEventListener(){},innerWidth:1400};
 const sandbox={window:win,document:doc,performance:{now:()=>0},indexedDB:{open(){throw Error('test offline')}},localStorage:{getItem(){return null},setItem(){}},
  console:{log(){},warn(){},error(){}},setTimeout(){return 1},clearTimeout(){},innerWidth:1400,innerHeight:900,Date,Math};
 sandbox.globalThis=sandbox;
 let src=fs.readFileSync(path.join(__dirname,'../app/app.js'),'utf8');
 const mark=src.lastIndexOf('})();');assert.ok(mark>0);
 src=src.slice(0,mark)+'globalThis.__v2={ui,database,dashboard,projectOverview,modal,manageItem,applyConfirmedDelete,thumbnailHtml,libraryToolbar};\n'+src.slice(mark);
 vm.runInNewContext(src,sandbox);
 const u=sandbox.__v2;u.database.projects=[p];
 assert.match(u.dashboard(),/Your Workspace/);
 assert.match(u.dashboard(),/data-action="new-project"/);
 assert.match(u.dashboard(),/data-action="library-view"/);
 assert.match(u.dashboard(),/data-preview-project=/);
 u.ui.projectId=p.id;u.ui.sceneId=scene.id;u.ui.beatId=scene.beats[0].id;u.ui.page='project';
 const overview=u.projectOverview();
 assert.match(overview,/class="scene-grid/);
 assert.match(overview,/Floor Plans/);
 assert.match(overview,/data-action="edit-current-project"/);
 assert.match(overview,/data-preview-scene=/);
 u.ui.dialog={kind:'edit-project',id:p.id};
 assert.match(u.modal(),/choose-preview-image/);
 assert.match(u.modal(),/reset-preview-image/);
 assert.match(u.modal(),/Custom image/);
 u.ui.previewDraft='';
 assert.match(u.modal(),/Automatic · Beat 1/);
 assert.doesNotMatch(u.modal(),/cHJvamVjdA==/,'resetting preview temporarily removes override');
 u.ui.previewDraft=undefined;u.ui.dialog={kind:'confirm-delete',targetKind:'scene',id:scene.id,name:scene.name};
 assert.match(u.modal(),/role="alertdialog"/);
 assert.match(u.modal(),/confirm-delete/);
 assert.doesNotMatch(src,/\b(?:confirm|prompt)\(/,'native dialogs were removed');
 assert.match(fs.readFileSync(path.join(__dirname,'../app/styles.css'),'utf8'),/workspace-library .project-grid/);
 assert.match(fs.readFileSync(path.join(__dirname,'../app/styles.css'),'utf8'),/confirm-card/);
 console.log('Block4Film Stage 2 previews, overrides, project/scene libraries, dialogs, schema and visual tokens passed');
})().catch(e=>{console.error(e);process.exitCode=1});

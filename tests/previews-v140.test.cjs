const assert=require('node:assert/strict');
const M=require('../app/model.js'),PREV=require('../app/previews.js');
(async()=>{
 const project=M.createProject('Rendering compatibility'),scene=project.scenes[0],set=project.sets[0];
 set.objects=[{id:'legacy',type:'wall',x:10,y:20,w:80,h:60,rotation:30},{id:'table',type:'furniture',x:250,y:250,w:177,h:91,rotation:23}];
 const migrated=M.migrate(project),line=migrated.sets[0].objects[0];
 assert.equal(line.w,100);assert.equal(line.h,0);
 const angle=Math.atan2(60,80)+Math.PI/6;
 assert.ok(Math.abs(line.rotation*Math.PI/180-angle)<1e-9,'legacy diagonal line keeps its world direction');
 assert.deepEqual(migrated.sets[0].objects[1],set.objects[1],'existing furniture dimensions remain intact');
 assert.deepEqual(set.objects[0],{id:'legacy',type:'wall',x:10,y:20,w:80,h:60,rotation:30},'migration never mutates the original');
 assert.equal(M.migrate({...project,sets:[{...set,backgroundScale:null}]}).sets[0].backgroundScale,1);
 scene.actors=[];scene.cameras=[];scene.equipment=[];
 set.objects=[{id:'window',type:'window',x:10,y:10,w:233,h:0,rotation:20}];
 set.backgroundScale=1.75;set.opacity=.65;
 class ImageStub{
  constructor(){this.naturalWidth=900;this.naturalHeight=1800;this.complete=true}
  set src(value){this._src=value;this.onload?.()}
 }
 const calls=[],properties={};
 const g=new Proxy(properties,{get(target,key){if(key in target)return target[key];return(...args)=>calls.push({method:key,args,stroke:target.strokeStyle,width:target.lineWidth})},set(target,key,value){target[key]=value;return true}});
 const env={Image:ImageStub,document:{createElement(){return {getContext:()=>g,toDataURL:()=> 'data:image/jpeg;base64,test'}}}};
 await PREV.renderScene(project,scene,env);
 const draw=calls.find(c=>c.method==='drawImage'),fit=M.backgroundFit(900,1800,1100,700,1.75);
 assert.deepEqual(draw.args.slice(1),[fit.x,fit.y,fit.width,fit.height],'thumbnail and editor share the same background helper');
 assert.ok(calls.some(c=>c.method==='stroke'&&c.stroke==='#82B6D0'),'window uses its distinct blue stroke');
 assert.ok(calls.some(c=>c.method==='lineTo'&&c.args[0]===233&&c.args[1]===0),'window length is retained');
 assert.ok(calls.some(c=>c.method==='lineTo'&&c.args[0]===233&&c.args[1]===4),'window double-line styling is retained');
 calls.length=0;set.objects=[];scene.cameras=[{id:'cam',number:1,color:'#399BFF'}];
 scene.beats[0].cameras={cam:{x:70,y:80,rotation:0,lens:35,sensor:36,coneRange:575,visible:true}};
 const light=M.addIdentity(project,scene,'equipment',scene.beats[0],{x:300,y:350},'light');
 light.lightModifier='softbox';light.softboxSize='large';light.lightMode='color';light.lightColor='#FF0044';
 await PREV.renderScene(project,scene,env);
 assert.ok(calls.some(c=>c.method==='arc'&&c.args[2]===575),'saved camera-cone reach appears in thumbnails');
 assert.ok(calls.some(c=>c.method==='roundRect'&&c.args[2]===66),'large softbox geometry appears in thumbnails');
 assert.ok(calls.some(c=>c.method==='stroke'&&c.stroke==='#FF0044'),'light RGB color appears in thumbnails');
 project.customPreview='custom-project';scene.customPreview='custom-scene';
 const restored=M.migrate(JSON.parse(JSON.stringify(project)));
 assert.equal(PREV.previewForProject(restored),'custom-project');
 assert.equal(PREV.previewForScene(restored.scenes[0]),'custom-scene');
 assert.equal(restored.schemaVersion,2);
 assert.equal(restored.sets[0].backgroundScale,1.75);
 assert.equal(restored.scenes[0].equipment[0].softboxSize,'large');
 console.log('1.4.0 shared background fit, windows, lights, camera reach and legacy-project compatibility passed');
})().catch(error=>{console.error(error);process.exitCode=1});

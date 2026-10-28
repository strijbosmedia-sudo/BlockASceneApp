const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const M=require('../app/model.js'),P=require('../app/playback.js'),harness=require('./feedback-harness.cjs');
(async()=>{
 const kinds=['static','walk','turn','pan','push','slide','track'];
 for(const from of kinds)for(const to of kinds){
  const state={x:100,y:150,rotation:0,lens:50,sensor:36,visible:true};
  M.setMotionKind(state,from);M.setMotionKind(state,to);
  assert.equal(state.lens,50);assert.equal(state.x,100);
  if(to==='static')assert.equal(state.motion,null);
  else if(M.rotationOnly(to)){assert.equal(state.motion.endX,state.x);assert.equal(state.motion.endY,state.y)}
  else assert.ok(Math.hypot(state.motion.endX-state.x,state.motion.endY-state.y)>0,from+' -> '+to+' initializes a positional destination');
 }
 const visible={x:40,y:80,rotation:20,visible:true},hidden={x:900,y:800,rotation:240,visible:false};
 for(const [a,b] of [[visible,hidden],[hidden,visible]]){
  const result=P.mixState(a,b,.5);assert.equal(result.alpha,.5);assert.equal(result.x,visible.x);assert.equal(result.y,visible.y);assert.equal(result.rotation,visible.rotation);
 }
 assert.equal(P.mixState(hidden,hidden,.5).visible,false);
 assert.equal(P.mixState(null,hidden,.5).visible,false);
 assert.equal(P.mixState(visible,{...visible,x:200},.5).x,120);
 const h=harness(),actor=h.scene.actors[0],camera=h.scene.cameras[0];
 for(const av of [true,false])for(const bv of [true,false]){
  h.beat.positions[actor.id].visible=av;h.scene.beats[1].positions[actor.id].visible=bv;
  h.beat.cameras[camera.id].visible=av;h.scene.beats[1].cameras[camera.id].visible=bv;
  const ghosts=h.getGhosts(h.scene,0);
  assert.equal(ghosts.includes('actor:'+actor.id),av&&bv);assert.equal(ghosts.includes('camera:'+camera.id),av&&bv);
 }
 // App-level native exports wait for completion and never report success on failure.
 let resolveSave;h.window.Capacitor={isNativePlatform:()=>true};
 h.window.Block4FilmMobile={saveFile:()=>new Promise(resolve=>{resolveSave=resolve})};
 const pending=h.backup();assert.equal(h.toast.textContent,'');resolveSave({status:'shared'});await pending;assert.match(h.toast.textContent,/shared/);
 h.window.Block4FilmMobile.saveFile=async()=>{throw Error('Storage unavailable')};
 await h.backup();assert.match(h.toast.textContent,/Export failed: Storage unavailable/);
 // Exercise the actual native bridge with repeated-directory and share failures.
 const calls=[],window={},Filesystem={
  async mkdir(){throw Error('Already exists')},async stat(){return {type:'directory'}},
  async writeFile(value){calls.push(value)},async getUri({path}){return {uri:'file:///cache/'+path}}
 };
 let shareOptions;const Share={async canShare(){return {value:true}},async share(value){shareOptions=value}};
 class Reader{readAsDataURL(){this.result='data:application/json;base64,e30=';this.onload()}}
 const source=fs.readFileSync(require.resolve('../mobile/bridge.js'),'utf8').replace(/^import .*;\r?\n/gm,'');
 vm.runInNewContext(source,{window,Filesystem,Share,FilePicker:{},Directory:{Cache:'CACHE'},FileReader:Reader,Date,Math,Uint8Array,TextDecoder,atob});
 await window.Block4FilmMobile.saveFile(new Blob(['{}']),'Film.blockascene');
 await window.Block4FilmMobile.saveFile(new Blob(['{}']),'Film.blockascene');
 assert.equal(calls[0].directory,'CACHE');assert.notEqual(calls[0].path,calls[1].path);
 assert.equal(shareOptions.files.length,1);assert.match(shareOptions.files[0],/^file:\/\/\/cache\//);
 Share.share=async()=>{throw Error('Permission denied')};
 await assert.rejects(window.Block4FilmMobile.saveFile(new Blob(['{}']),'Film.blockascene'),/Permission denied/);
 Share.share=async()=>{throw Error('User cancelled')};
 assert.equal((await window.Block4FilmMobile.saveFile(new Blob(['{}']),'Film.blockascene')).status,'cancelled');
 console.log('Feedback reliability: movement switching, visibility, ghosts and native export completion passed');
})().catch(error=>{console.error(error);process.exitCode=1});

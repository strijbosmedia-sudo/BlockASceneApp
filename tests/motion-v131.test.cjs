const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const M=require('../app/model.js'),P=require('../app/playback.js');
const approx=(a,b)=>assert.ok(Math.abs(a-b)<.001, 'Expected '+a+' to equal '+b);
const proj=M.createProject('Keyframe test'),sc=proj.scenes[0],b=sc.beats[0],actor=sc.actors[0].id,cam=sc.cameras[0].id;
const a=b.positions[actor],c=b.cameras[cam];
a.motion={kind:'walk',pathType:'smooth',endX:a.x+280,endY:a.y-70,endRotation:75,
 keys:[{id:'mid',t:.5,x:a.x+120,y:a.y-180,rotation:10}]};
c.motion={kind:'pan',endX:c.x,endY:c.y,endRotation:125,
 keys:[{id:'camkey',t:.5,x:c.x,y:c.y,rotation:30}]};
const actorStart=P.animateCameraPosition(a,0),actorMid=P.animateCameraPosition(a,.5),actorEnd=P.animateCameraPosition(a,1);
approx(actorStart.x,a.x);approx(actorMid.x,a.motion.keys[0].x);approx(actorMid.y,a.motion.keys[0].y);
approx(actorEnd.x,a.motion.endX);approx(actorEnd.y,a.motion.endY);
approx(((actorMid.rotation%360)+360)%360,10);
const midQuarter=P.animateCameraPosition(a,.25);
assert.ok(Number.isFinite(midQuarter.x)&&Number.isFinite(midQuarter.y));
const linear={...M.clone(a),motion:{...M.clone(a.motion),pathType:'linear'}};
assert.notEqual(Math.round(P.animateCameraPosition(linear,.25).y),Math.round(midQuarter.y),'smooth path curves between the keys');
const cameraPan=P.animateCameraPosition(c,.5);
approx(cameraPan.x,c.x);approx(cameraPan.y,c.y);approx(((cameraPan.rotation%360)+360)%360,30);
const original=JSON.stringify(b);
const next=M.nextBeat(sc,b);
assert.equal(next.positions[actor].motion,null);assert.equal(next.cameras[cam].motion,null);
approx(next.positions[actor].x,a.motion.endX);approx(next.positions[actor].y,a.motion.endY);
approx(next.positions[actor].rotation,75);approx(next.cameras[cam].rotation,125);
assert.equal(JSON.stringify(b),original,'creating a beat does not change the previous beat');
assert.equal(M.migrate(proj).scenes[0].beats[0].positions[actor].motion.keys[0].id,'mid');

// Exercise pointer handlers through the same app script, without a browser window.
const app={innerHTML:'',addEventListener(){},querySelector(){return null},querySelectorAll(){return []}};
const fakeInput={addEventListener(){}};
const dom={getElementById(id){return id==='app'?app:fakeInput},querySelector(){return null},querySelectorAll(){return []},
 get activeElement(){return null}};
const timeouts=[];
let nextTimeoutId=0;
const sandbox={document:dom,window:{B4Model:M,B4Playback:P,B4Previews:null,B4Manual:[],innerWidth:1500,addEventListener(){}},
 performance:{now(){return 0}},localStorage:{getItem(){return null},setItem(){}},
 indexedDB:{open(){throw Error('no storage in fixture')}},
 console,setTimeout(fn,delay){const t={id:++nextTimeoutId,fn,delay,cleared:false};timeouts.push(t);return t.id},
 clearTimeout(id){const t=timeouts.find(x=>x.id===id);if(t)t.cleared=true;},
 Date,Math,Map,Set,devicePixelRatio:1};
sandbox.globalThis=sandbox;
let appSource=fs.readFileSync(path.join(__dirname,'../app/app.js'),'utf8');
appSource=appSource.replace('function render(){','function render(){return;');
appSource=appSource.replace('function paint(){','function paint(){return;');
appSource=appSource.replace('(async()=>{try{const layout=','(async()=>{return;try{const layout=');
const last=appSource.lastIndexOf('})();');assert.ok(last>0);
appSource=appSource.slice(0,last)+
 'globalThis.__h={ui,database,setCanvas(el){canvas=el},onDown,onMove,onUp,getDrag(){return drag},hitAt};\n'+appSource.slice(last);
vm.runInNewContext(appSource,sandbox);
const h=sandbox.__h;h.database.projects=[proj];h.ui.projectId=proj.id;h.ui.sceneId=sc.id;h.ui.beatId=b.id;h.ui.page='editor';
h.ui.view={scale:1,x:0,y:0};h.ui.selection=null;h.ui.tool='select';
const capture=new Set();
const canvas={getBoundingClientRect:()=>({left:0,top:0}),setPointerCapture(id){capture.add(id)},
 hasPointerCapture(id){return capture.has(id)},releasePointerCapture(id){capture.delete(id)},
 classList:{add(){},remove(){}},isConnected:true};
h.setCanvas(canvas);
const evt=(x,y,id=1)=>({clientX:x,clientY:y,pointerId:id,pointerType:'pen',button:0,preventDefault(){},type:'pointerup'});
const beforeX=a.x,beforeY=a.y,originalEndX=a.motion.endX,originalEndY=a.motion.endY;
h.onDown(evt(a.x,a.y));assert.equal(h.getDrag().mode,'pending-select');
h.onMove(evt(a.x+3,a.y+2));h.onUp(evt(a.x+3,a.y+2));
approx(a.x,beforeX);approx(a.y,beforeY);
assert.equal(h.ui.selection.id,actor,'a tap selects the actor');
assert.equal(h.ui.showInspector,true);
h.onDown(evt(beforeX,beforeY));assert.equal(h.getDrag().mode,'move');
h.onMove(evt(beforeX+25,beforeY+10));h.onUp(evt(beforeX+25,beforeY+10));
approx(a.x,beforeX+25);approx(a.y,beforeY+10);
approx(a.motion.endX,originalEndX);approx(a.motion.endY,originalEndY);
h.ui.selection={type:'actor',id:actor};
const key=a.motion.keys[0],keyX=key.x,keyY=key.y;
h.onDown(evt(keyX,keyY));assert.equal(h.getDrag().mode,'keyframe');
h.onMove(evt(keyX+30,keyY+15));h.onUp(evt(keyX+30,keyY+15));
approx(key.x,keyX+30);approx(key.y,keyY+15);
h.ui.selection={type:'camera',id:cam};
const r=Math.max(72,30/h.ui.view.scale),angle=c.motion.endRotation*Math.PI/180;
const tx=c.motion.endX+r*Math.cos(angle),ty=c.motion.endY+r*Math.sin(angle);
h.onDown(evt(tx,ty));assert.equal(h.getDrag().mode,'end-rotate');
h.onMove(evt(c.motion.endX-r,c.motion.endY));h.onUp(evt(c.motion.endX-r,c.motion.endY));
approx(((c.motion.endRotation%360)+360)%360,180);
console.log('v1.3.1 keyframe curves, pan/turn, final beat inheritance, pen selection and endpoint anchoring passed');

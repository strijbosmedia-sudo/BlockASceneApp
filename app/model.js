/* BlockaScene document model v2. No framework, portable for browser and test runner. */
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;root.B4Model=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION=2;
const PRESET=['#399BFF','#FFAB36','#AB70FF','#23DECE','#FF6464','#C1ED42','#FF4DC4','#6585FF','#FFE04C','#F27A3F','#55E997','#E35CF6','#40CBF6','#FF477B','#A4AFFF','#EBE454','#C887FF','#47DFAC','#F782B3','#A8D63F','#76D7FF'];
const clone=v=>JSON.parse(JSON.stringify(v));
const uid=()=>globalThis.crypto?.randomUUID?.()||'b4-'+Date.now().toString(36)+Math.random().toString(36).slice(2);
const validColor=v=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v);
const normalizeAngle=v=>((Number(v)||0)%360+360)%360;
const label=n=>{let s='';do{s=String.fromCharCode(65+(n-1)%26)+s;n=Math.floor((n-1)/26)}while(n>0);return s};
const colorKey=v=>String(v||'').toUpperCase();
function uniqueColor(project,preferred){const used=new Set(Object.values(project.identities||{}).map(o=>colorKey(o.color)));
 if(validColor(preferred)&&!used.has(colorKey(preferred)))return preferred;
 for(const color of PRESET)if(!used.has(colorKey(color)))return color;
 // Stable extra colors; never exactly repeat a color, though distant objects may resemble each other.
 for(let i=0;i<4000;i++){const hue=Math.round((i*137.507764+12)%360),sat=70+(i%3)*7,light=50+(i%4)*3;const c=hslToHex(hue,sat,light);if(!used.has(colorKey(c)))return c}
 return '#FFFFFF';
}
function hslToHex(h,s,l){s/=100;l/=100;const a=s*Math.min(l,1-l),f=n=>{const k=(n+h/30)%12;return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1))))};return '#'+[f(0),f(8),f(4)].map(x=>x.toString(16).padStart(2,'0')).join('').toUpperCase()}
function register(project,type,id,wanted,name,num){project.identities??={};if(project.identities[id])return project.identities[id];const number=num||1+Math.max(0,...Object.values(project.identities).filter(x=>x.type===type).map(x=>x.number||0));const data={type,number,color:uniqueColor(project,wanted),name:name||`${type==='actor'?'Actor':'Camera'} ${type==='actor'?label(number):number}`};project.identities[id]=data;return data}
function applyIdentity(project,entry,type){const info=register(project,type,entry.id,entry.color,entry.name,entry.number);entry.color=info.color;entry.name=info.name;entry.number=info.number;entry.outline=info.outline||'white';return entry}
function defaultCameraState(x=550,y=550){return{x,y,rotation:-90,lens:35,sensor:36,visible:true,motion:null}}
function defaultActorState(x=400,y=380){return{x,y,rotation:-90,visible:true}}
function defaultEquipmentState(x=500,y=400){return{x,y,rotation:0,visible:true}}
function migrate(project){if(!project||!Array.isArray(project.sets)||!Array.isArray(project.scenes)||!project.id||!project.name)throw Error('Not a BlockaScene project');
 const p=clone(project);p.identities??={};for(const set of p.sets){set.objects??=[];set.opacity??=.8;}
 // Existing colors and IDs survive the upgrade. Camera v1 setups become per-beat camera states.
 for(const s of p.scenes){if(!p.sets.some(st=>st.id===s.setId))throw Error('Scene references a missing floor plan');s.actors??=[];s.cameras??=[];s.equipment??=[];s.beats??=[];
  for(const actor of s.actors)applyIdentity(p,actor,'actor');
  if(Array.isArray(s.setups)){for(const old of s.setups){const camera=applyIdentity(p,{id:old.id,name:old.name,},'camera');s.cameras.push(camera)}}
  for(const camera of s.cameras)applyIdentity(p,camera,'camera');for(const actor of s.actors)actor.outline=(p.identities[actor.id].outline ||= actor.outline||'white');for(const camera of s.cameras)camera.outline=(p.identities[camera.id].outline ||= camera.outline||'white');
  for(const beat of s.beats){beat.positions??={};beat.cameras??={};beat.equipment??={};for(const actor of s.actors){if(beat.positions[actor.id]){beat.positions[actor.id].rotation??=-90;beat.positions[actor.id].visible??=true;beat.positions[actor.id].motion??=null}}
    if(Array.isArray(s.setups))for(const old of s.setups){if(!beat.cameras[old.id])beat.cameras[old.id]={...defaultCameraState(),x:old.x,y:old.y,rotation:old.rotation??-90,lens:old.lens||35,sensor:old.sensor||36}}
    for(const [id,state] of Object.entries(beat.cameras)){state.visible??=true;state.motion??=null;state.rotation??=-90;state.lens??=35;state.sensor??=36;if(state.motion){state.motion.kind??='track';state.motion.endRotation??=state.rotation;}}
    for(const [id,state] of Object.entries(beat.equipment)){state.rotation??=0;state.visible??=true;}
  }
  delete s.setups;
 }
 p.schemaVersion=VERSION;return p;
}
function createProject(name='Untitled Film'){
 const p={id:uid(),name,updatedAt:Date.now(),schemaVersion:VERSION,identities:{},sets:[],scenes:[]};const set={id:uid(),name:'Apartment Living Room',background:'./assets/demo-plan.svg',opacity:.7,objects:[]};p.sets.push(set);
 const a={id:uid()},b={id:uid()},c1={id:uid()},c2={id:uid()};applyIdentity(p,{...a,name:'Alex'},'actor');
 const actor1=applyIdentity(p,{id:a.id},'actor'),actor2=applyIdentity(p,{id:b.id,name:'Sam'},'actor');
 const cam1=applyIdentity(p,{id:c1.id,name:'Master'},'camera'),cam2=applyIdentity(p,{id:c2.id,name:'Close-up'},'camera');
 const makeBeat=(name,ax,ay,cx,cy)=>({id:uid(),name,positions:{[a.id]:defaultActorState(ax,ay),[b.id]:defaultActorState(750,360)},cameras:{[c1.id]:{...defaultCameraState(cx,600),rotation:-83},[c2.id]:{...defaultCameraState(850,545),rotation:-132,lens:50,visible:false}},equipment:{}});
 const scene={id:uid(),name:'01 · The Conversation',setId:set.id,actors:[actor1,actor2],cameras:[cam1,cam2],equipment:[],beats:[makeBeat('Entrance',310,535,480),makeBeat('Approach',450,430,480),makeBeat('Dialogue',550,295,650)]};scene.beats[2].cameras[c2.id].visible=true;p.scenes.push(scene);return p;
}
function nextBeat(scene,current){const idx=scene.beats.findIndex(b=>b.id===current?.id),previous=current||scene.beats[scene.beats.length-1];const beat={id:uid(),name:`Beat ${String(scene.beats.length+1).padStart(2,'0')}`,positions:clone(previous?.positions||{}),cameras:clone(previous?.cameras||{}),equipment:clone(previous?.equipment||{})};scene.beats.splice(idx<0?scene.beats.length:idx+1,0,beat);return beat}
function nextAvailableNumber(scene,type){
 const list=type==='actor'?scene.actors:type==='camera'?scene.cameras:[];
 const used=new Set(list.map(o=>Number(o.number)).filter(v=>Number.isSafeInteger(v)&&v>0));
 let next=1;while(used.has(next))next++;return next;
}
/* IDs are shared through project.identities, while number availability is scene-local.
   Check every scene containing this identity so an edit cannot create a collision in
   another scene where the same actor or camera is reused. */
function numberAvailable(project,scene,type,id,number){
 const requested=Number(number),key=type==='actor'?'actors':type==='camera'?'cameras':null;
 if(!key||!Number.isSafeInteger(requested)||requested<1||requested>9999)return false;
 if(!scene?.[key]?.some(o=>o.id===id))return false;
 for(const sc of project.scenes||[]){
  if(!sc[key]?.some(o=>o.id===id))continue;
  if(sc[key].some(o=>o.id!==id&&Number(o.number)===requested))return false;
 }
 return true;
}
function setIdentityNumber(project,scene,type,id,number){
 const requested=Number(number),identity=project.identities?.[id];
 if(identity?.type!==type||!numberAvailable(project,scene,type,id,requested))return 'That '+(type==='actor'?'letter':'number')+' is already in use or unavailable.';
 identity.number=requested;
 const key=type==='actor'?'actors':'cameras';
 for(const sc of project.scenes)for(const item of sc[key]||[])if(item.id===id)item.number=requested;
 return null;
}
function addIdentity(project,scene,type,beat,point,shape){const id=uid(),entry={id};
 if(type==='actor'||type==='camera')entry.number=nextAvailableNumber(scene,type);
 applyIdentity(project,entry,type);if(type==='actor'){scene.actors.push(entry);let active=false;for(const b of scene.beats){if(b===beat)active=true;if(active)b.positions[id]=defaultActorState(point.x,point.y)}}else if(type==='camera'){scene.cameras.push(entry);let active=false;for(const b of scene.beats){if(b===beat)active=true;if(active)b.cameras[id]=defaultCameraState(point.x,point.y)}}else{entry.name=shape==='custom'?'Custom Object':shape[0].toUpperCase()+shape.slice(1);entry.type=shape;entry.color='#C4C7CD';scene.equipment.push(entry);let active=false;for(const b of scene.beats){if(b===beat)active=true;if(active)b.equipment[id]=defaultEquipmentState(point.x,point.y)}}return entry}
function recolor(project,id,newColor){if(!validColor(newColor))return 'Invalid HEX color';const info=project.identities?.[id];if(info&&Object.entries(project.identities).some(([key,v])=>key!==id&&colorKey(v.color)===colorKey(newColor)))return 'Color already used. Pick another color.';if(info)info.color=newColor;for(const scene of project.scenes)for(const entity of [...scene.actors,...scene.cameras,...scene.equipment])if(entity.id===id)entity.color=newColor;return null}
/** Set visibility on any beat, including beats before an object was introduced.
 * A missing state is copied from the nearest beat that contains this identity.
 * This never mutates a different beat or the identity itself. */
function setBeatVisibility(scene,type,id,beatId,visible){
 const key=type==='actor'?'positions':type==='camera'?'cameras':null;
 if(!key)return false;
 const index=scene.beats.findIndex(b=>b.id===beatId);
 if(index<0)return false;
 if(!(type==='actor'?scene.actors:scene.cameras).some(v=>v.id===id))return false;
 const target=scene.beats[index];target[key]??={};
 if(!target[key][id]){
  if(!visible)return true;
  let nearest=null,distance=Infinity;
  for(let i=0;i<scene.beats.length;i++){
   const state=scene.beats[i][key]?.[id];
   if(state&&Math.abs(index-i)<distance){nearest=state;distance=Math.abs(index-i)}
  }
  target[key][id]=clone(nearest||(type==='actor'?defaultActorState():defaultCameraState()));
 }
 target[key][id].visible=!!visible;
 return true;
}
function setOutline(project,id,outline){if(!['white','black'].includes(outline))return false;const item=project.identities?.[id];if(item)item.outline=outline;for(const s of project.scenes)for(const v of [...s.actors,...s.cameras])if(v.id===id)v.outline=outline;return true}
function rename(project,id,newName){const info=project.identities?.[id];if(info)info.name=newName;for(const scene of project.scenes)for(const entity of [...scene.actors,...scene.cameras,...scene.equipment])if(entity.id===id)entity.name=newName}
return {VERSION,PRESET,clone,uid,label,normalizeAngle,register,applyIdentity,uniqueColor,migrate,createProject,nextBeat,addIdentity,nextAvailableNumber,numberAvailable,setIdentityNumber,recolor,rename,setOutline,setBeatVisibility,defaultActorState,defaultCameraState,defaultEquipmentState};
});

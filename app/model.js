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
 if(validColor(preferred))return preferred;
 for(const color of PRESET)if(!used.has(colorKey(color)))return color;
 // Stable extra colors; never exactly repeat a color, though distant objects may resemble each other.
 for(let i=0;i<4000;i++){const hue=Math.round((i*137.507764+12)%360),sat=70+(i%3)*7,light=50+(i%4)*3;const c=hslToHex(hue,sat,light);if(!used.has(colorKey(c)))return c}
 return '#FFFFFF';
}
function hslToHex(h,s,l){s/=100;l/=100;const a=s*Math.min(l,1-l),f=n=>{const k=(n+h/30)%12;return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1))))};return '#'+[f(0),f(8),f(4)].map(x=>x.toString(16).padStart(2,'0')).join('').toUpperCase()}
function register(project,type,id,wanted,name,num){project.identities??={};if(project.identities[id])return project.identities[id];const number=num||1+Math.max(0,...Object.values(project.identities).filter(x=>x.type===type).map(x=>x.number||0));const data={type,number,color:uniqueColor(project,wanted),name:name||`${type==='actor'?'Actor':'Camera'} ${type==='actor'?label(number):number}`};project.identities[id]=data;return data}
function applyIdentity(project,entry,type){const info=register(project,type,entry.id,entry.color,entry.name,entry.number);entry.color=info.color;entry.name=info.name;entry.number=info.number;entry.outline=info.outline||'white';return entry}
function kelvinToHex(kelvin){
 const k=Math.min(12000,Math.max(2000,Number(kelvin)||5600))/100;
 const r=k<=66?255:329.698727446*Math.pow(k-60,-.1332047592);
 const g=k<=66?99.4708025861*Math.log(k)-161.1195681661:288.1221695283*Math.pow(k-60,-.0755148492);
 const b=k>=66?255:k<=19?0:138.5177312231*Math.log(k-10)-305.0447927307;
 return '#'+[r,g,b].map(v=>Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,'0')).join('').toUpperCase();
}
function backgroundFit(sourceWidth,sourceHeight,sceneWidth=1100,sceneHeight=700,scale=1){
 const sw=Number(sourceWidth),sh=Number(sourceHeight),cw=Number(sceneWidth),ch=Number(sceneHeight);
 if(![sw,sh,cw,ch].every(Number.isFinite)||Math.min(sw,sh,cw,ch)<=0)return null;
 const multiplier=Number.isFinite(Number(scale))?Math.max(.25,Math.min(3,Number(scale))):1;
 // A little breathing room leaves actors, cameras and set elements accessible around the image.
 const factor=Math.min(cw*.92/sw,ch*.92/sh)*multiplier;
 const width=sw*factor,height=sh*factor;
 return{x:(cw-width)/2,y:(ch-height)/2,width,height};
}
// Format dimensions are editable reference image areas, not universal standards.
const SENSOR_FORMATS=[['full-frame','Full Frame',36,24],['super35','Super 35',23.76,17.82],['aps-c','APS-C',22.3,14.9],['mft','Micro Four Thirds',17.3,13],['custom','Custom',null,null]];
function cameraDefaults(value={}){
 const number=(v,fallback,min,max)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):fallback;
 return {sensorFormat:SENSOR_FORMATS.some(f=>f[0]===value.sensorFormat)?value.sensorFormat:'full-frame',sensorWidth:number(value.sensorWidth??value.sensor,36,3,70),sensorHeight:number(value.sensorHeight,24,3,70),lens:number(value.lens,35,8,600)};
}
function ensureProjectSettings(project){
 project.cameraDefaults=cameraDefaults(project.cameraDefaults);
 if(!project.presets||typeof project.presets!=='object'||Array.isArray(project.presets))project.presets={};
 project.presets.actors??=[];project.presets.cameras??=[];
 if(!Array.isArray(project.presets.actors)||!Array.isArray(project.presets.cameras))throw Error('Project libraries must contain lists of presets');
 return project;
}
const presetKey=type=>type==='actor'?'actors':type==='camera'?'cameras':null;
const cameraPresetFields={sensorWidth:'sensor',sensorHeight:'sensorHeight',sensorFormat:'sensorFormat',lens:'lens'};
function normalizeColor(value){
 let hex=String(value||'').trim().replace(/^#/,'');if(/^[0-9a-f]{3}$/i.test(hex))hex=hex.split('').map(c=>c+c).join('');
 return /^[0-9a-f]{6}$/i.test(hex)?'#'+hex.toUpperCase():null;
}
function validatePreset(project,type,data,exceptId=null){
 const key=presetKey(type);if(!key)return 'Choose an actor or camera preset.';
 if(!String(data.name||'').trim())return 'Enter a preset name.';
 if(!Number.isSafeInteger(Number(data.number))||Number(data.number)<1||Number(data.number)>9999)return 'Use an identifier from 1 to 9999.';
 if(project.presets[key].some(p=>p.id!==exceptId&&Number(p.number)===Number(data.number)))return 'That identifier is already used by a project preset.';
 if(!normalizeColor(data.color))return 'Enter a valid HEX color.';
 if(type==='camera'&&[['sensorWidth',3,70],['sensorHeight',3,70],['lens',8,600]].some(([field,min,max])=>!Number.isFinite(Number(data[field]))||Number(data[field])<min||Number(data[field])>max))return 'Check sensor dimensions (3–70 mm) and lens (8–600 mm).';
 return null;
}
function createPreset(project,type,data={}){
 ensureProjectSettings(project);const key=presetKey(type);if(!key)throw Error('Unsupported preset type');
 const used=new Set(project.presets[key].map(p=>p.number));let number=1;while(used.has(number))number++;
 const preset={name:data.name||`${type==='actor'?'Actor':'Camera'} ${type==='actor'?label(number):number}`,number,color:data.color||uniqueColor(project),outline:data.outline||'white',...(type==='camera'?project.cameraDefaults:{}),...clone(data),id:uid(),type};
 preset.name=String(preset.name).trim();preset.number=Number(preset.number);preset.color=normalizeColor(preset.color);
 const error=validatePreset(project,type,preset);if(error)throw Error(error);
 project.presets[key].push(preset);return preset;
}
function detachSharedIdentity(project,scene,type,entry){
 const key=presetKey(type);
 if(!project.scenes.some(s=>s!==scene&&s[key]?.some(o=>o.id===entry.id)))return;
 const old=entry.id,fresh=uid(),states=type==='actor'?'positions':'cameras';
 for(const beat of scene.beats){if(beat[states]?.[old]){beat[states][fresh]=clone(beat[states][old]);delete beat[states][old]}}
 entry.id=fresh;project.identities[fresh]=clone(project.identities[old]||{type,name:entry.name,color:entry.color,number:entry.number,outline:entry.outline||'white'});
}
function writePresetIdentity(project,entry,preset,onlyInherited=false){
 const info=project.identities[entry.id]||(project.identities[entry.id]={type:preset.type});
 for(const field of ['name','number','color','outline'])if(!onlyInherited||!entry.presetOverrides?.[field])entry[field]=info[field]=preset[field]??(field==='outline'?'white':entry[field]);
}
function applyPreset(project,scene,type,id,presetId){
 ensureProjectSettings(project);const key=presetKey(type),entry=scene[key]?.find(o=>o.id===id),preset=project.presets[key]?.find(p=>p.id===presetId);
 if(!entry||!preset)return 'Project preset not found.';
 if(scene[key].some(o=>o.id!==id&&Number(o.number)===Number(preset.number)))return 'That preset identifier is already used in this scene. Change the other object’s identifier first.';
 detachSharedIdentity(project,scene,type,entry);
 entry.presetId=preset.id;entry.presetOverrides={};entry.presetBeatOverrides={};writePresetIdentity(project,entry,preset);
 if(type==='camera')for(const beat of scene.beats){const state=beat.cameras?.[entry.id];if(state)for(const [field,stateField] of Object.entries(cameraPresetFields))state[stateField]=preset[field]}
 return null;
}
function saveInstancePreset(project,scene,type,id,beatId){
 const key=presetKey(type),entry=scene[key]?.find(o=>o.id===id);if(!entry)throw Error('Select an actor or camera.');
 const state=scene.beats.find(b=>b.id===beatId)?.cameras?.[id];
 const data={name:entry.name,number:entry.number,color:entry.color,outline:entry.outline||'white'};
 if(type==='camera')Object.assign(data,{sensorWidth:state?.sensor??project.cameraDefaults?.sensorWidth??36,sensorHeight:state?.sensorHeight??24,sensorFormat:state?.sensorFormat||'custom',lens:state?.lens??35});
 const preset=createPreset(project,type,data);
 detachSharedIdentity(project,scene,type,entry);entry.presetId=preset.id;entry.presetOverrides={};entry.presetBeatOverrides={};
 // Saving a configured camera must not erase previously authored per-beat lens overrides.
 if(type==='camera')for(const beat of scene.beats){const camera=beat.cameras?.[entry.id];if(camera){const overrides={};for(const [field,stateField] of Object.entries(cameraPresetFields))if(camera[stateField]!==preset[field])overrides[field]=true;entry.presetBeatOverrides[beat.id]=overrides}}
 return preset;
}
function markPresetOverride(entry,field,beatId=null){
 if(!entry?.presetId)return;
 if(beatId){entry.presetBeatOverrides??={};entry.presetBeatOverrides[beatId]??={};entry.presetBeatOverrides[beatId][field]=true}
 else{entry.presetOverrides??={};entry.presetOverrides[field]=true}
}
function copyPresetBeatOverrides(scene,fromId,toId){
 for(const entry of [...scene.actors,...scene.cameras])if(entry.presetBeatOverrides?.[fromId])entry.presetBeatOverrides[toId]=clone(entry.presetBeatOverrides[fromId]);
}
function remapPresetBeats(scene,ids){
 for(const entry of [...scene.actors,...scene.cameras])if(entry.presetBeatOverrides)entry.presetBeatOverrides=Object.fromEntries(Object.entries(entry.presetBeatOverrides).filter(([id])=>ids[id]).map(([id,value])=>[ids[id],value]));
}
function updatePreset(project,type,id,changes){
 ensureProjectSettings(project);const key=presetKey(type),preset=project.presets[key]?.find(p=>p.id===id);if(!preset)return 'Project preset not found.';
 const next={...preset,...clone(changes),id,type};next.name=String(next.name||'').trim();next.number=Number(next.number);next.color=normalizeColor(next.color);
 const error=validatePreset(project,type,next,id);if(error)return error;
 for(const scene of project.scenes){
  const numbers=scene[key].map(o=>o.presetId===id&&!o.presetOverrides?.number?next.number:Number(o.number));
  if(scene[key].some((o,i)=>o.presetId===id&&!o.presetOverrides?.number&&numbers.some((n,j)=>j!==i&&n===numbers[i])))return 'That identifier conflicts with an object in a linked scene.';
 }
 Object.assign(preset,next);
 for(const scene of project.scenes)for(const entry of scene[key])if(entry.presetId===id){
  writePresetIdentity(project,entry,preset,true);
  if(type==='camera')for(const beat of scene.beats){const state=beat.cameras?.[entry.id];if(state){for(const [field,stateField] of Object.entries(cameraPresetFields))if(!entry.presetBeatOverrides?.[beat.id]?.[field])state[stateField]=preset[field];if(entry.presetBeatOverrides?.[beat.id]?.sensorWidth||entry.presetBeatOverrides?.[beat.id]?.sensorHeight)state.sensorFormat='custom'}}
 }
 return null;
}
function removePreset(project,type,id){
 const key=presetKey(type);if(!key)return false;
 project.presets[key]=project.presets[key].filter(p=>p.id!==id);
 for(const scene of project.scenes)for(const entry of scene[key])if(entry.presetId===id){delete entry.presetId;delete entry.presetOverrides;delete entry.presetBeatOverrides}
 return true;
}
function resetPresetOverrides(project,scene,type,id){
 const entry=scene[presetKey(type)]?.find(o=>o.id===id);if(!entry?.presetId)return 'This instance has no project preset.';
 return applyPreset(project,scene,type,id,entry.presetId);
}

function defaultCameraState(x=550,y=550,defaults={}){const d=cameraDefaults(defaults);return{x,y,rotation:-90,lens:d.lens,sensor:d.sensorWidth,sensorHeight:d.sensorHeight,sensorFormat:d.sensorFormat,coneRange:365,visible:true,motion:null}}
function defaultActorState(x=400,y=380){return{x,y,rotation:-90,visible:true}}
function defaultEquipmentState(x=500,y=400){return{x,y,rotation:0,visible:true}}
function migrate(project){if(!project||!Array.isArray(project.sets)||!Array.isArray(project.scenes)||!project.id||!project.name)throw Error('Not a BlockaScene project');
 const p=clone(project);p.identities??={};ensureProjectSettings(p);for(const set of p.sets){set.objects??=[];set.opacity??=.8;set.backgroundScale=Number.isFinite(Number(set.backgroundScale))&&Number(set.backgroundScale)>0?Math.max(.25,Math.min(3,Number(set.backgroundScale))):1;for(const o of set.objects){if(['wall','window','door'].includes(o.type)&&Number(o.h)){const w=Number(o.w)||60,h=Number(o.h);o.w=Math.hypot(w,h);o.rotation=normalizeAngle((Number(o.rotation)||0)+Math.atan2(h,w)*180/Math.PI);o.h=0;}}}
 // Existing colors and IDs survive the upgrade. Camera v1 setups become per-beat camera states.
 for(const s of p.scenes){if(!p.sets.some(st=>st.id===s.setId))throw Error('Scene references a missing floor plan');s.actors??=[];s.cameras??=[];s.equipment??=[];s.beats??=[];
  for(const actor of s.actors)applyIdentity(p,actor,'actor');
  if(Array.isArray(s.setups)){for(const old of s.setups){const camera=applyIdentity(p,{id:old.id,name:old.name,},'camera');s.cameras.push(camera)}}
  for(const camera of s.cameras)applyIdentity(p,camera,'camera');for(const equipment of s.equipment){if(equipment.type==='light'){equipment.lightMode??='kelvin';equipment.lightKelvin??=5600;equipment.lightColor??='#FFFFFF'}}for(const actor of s.actors)actor.outline=(p.identities[actor.id].outline ||= actor.outline||'white');for(const camera of s.cameras)camera.outline=(p.identities[camera.id].outline ||= camera.outline||'white');
  for(const beat of s.beats){beat.positions??={};beat.cameras??={};beat.equipment??={};for(const actor of s.actors){if(beat.positions[actor.id]){beat.positions[actor.id].rotation??=-90;beat.positions[actor.id].visible??=true;beat.positions[actor.id].motion??=null}}
    if(Array.isArray(s.setups))for(const old of s.setups){if(!beat.cameras[old.id])beat.cameras[old.id]={...defaultCameraState(),x:old.x,y:old.y,rotation:old.rotation??-90,lens:old.lens||35,sensor:old.sensor||36}}
    for(const [id,state] of Object.entries(beat.cameras)){state.visible??=true;state.motion??=null;state.rotation??=-90;state.lens??=35;state.sensor??=36;state.sensorHeight??=24;state.sensorFormat??=state.sensor===36&&state.sensorHeight===24?'full-frame':'custom';if(state.motion){state.motion.kind??='track';state.motion.endRotation??=state.rotation;}}
    for(const [id,state] of Object.entries(beat.equipment)){state.rotation??=0;state.visible??=true;}
  }
  delete s.setups;
 }
 p.schemaVersion=VERSION;return p;
}
function createProject(name='Untitled Film'){
 const p={id:uid(),name,updatedAt:Date.now(),schemaVersion:VERSION,identities:{},sets:[],scenes:[]};ensureProjectSettings(p);const set={id:uid(),name:'Apartment Living Room',background:'./assets/demo-plan.svg',backgroundScale:1,opacity:.7,objects:[]};p.sets.push(set);
 const a={id:uid()},b={id:uid()},c1={id:uid()},c2={id:uid()};applyIdentity(p,{...a,name:'Alex'},'actor');
 const actor1=applyIdentity(p,{id:a.id},'actor'),actor2=applyIdentity(p,{id:b.id,name:'Sam'},'actor');
 const cam1=applyIdentity(p,{id:c1.id,name:'Master'},'camera'),cam2=applyIdentity(p,{id:c2.id,name:'Close-up'},'camera');
 const makeBeat=(name,ax,ay,cx,cy)=>({id:uid(),name,positions:{[a.id]:defaultActorState(ax,ay),[b.id]:defaultActorState(750,360)},cameras:{[c1.id]:{...defaultCameraState(cx,600,p.cameraDefaults),rotation:-83},[c2.id]:{...defaultCameraState(850,545,p.cameraDefaults),rotation:-132,lens:50,visible:false}},equipment:{}});
 const scene={id:uid(),name:'01 · The Conversation',setId:set.id,actors:[actor1,actor2],cameras:[cam1,cam2],equipment:[],beats:[makeBeat('Entrance',310,535,480),makeBeat('Approach',450,430,480),makeBeat('Dialogue',550,295,650)]};scene.beats[2].cameras[c2.id].visible=true;p.scenes.push(scene);return p;
}
function finalBeatState(state){
 const result=clone(state||{});
 if(result.motion){
  const m=result.motion;
  if(Number.isFinite(Number(m.endX)))result.x=Number(m.endX);
  if(Number.isFinite(Number(m.endY)))result.y=Number(m.endY);
  if(Number.isFinite(Number(m.endRotation)))result.rotation=normalizeAngle(m.endRotation);
  result.motion=null;
 }
 return result;
}
function nextBeat(scene,current){
 const idx=scene.beats.findIndex(b=>b.id===current?.id),previous=current||scene.beats[scene.beats.length-1];
 const endMap=source=>Object.fromEntries(Object.entries(source||{}).map(([id,state])=>[id,finalBeatState(state)]));
 const beat={id:uid(),name:`Beat ${String(scene.beats.length+1).padStart(2,'0')}`,
  positions:endMap(previous?.positions),cameras:endMap(previous?.cameras),equipment:clone(previous?.equipment||{})};
 copyPresetBeatOverrides(scene,previous?.id,beat.id);
 scene.beats.splice(idx<0?scene.beats.length:idx+1,0,beat);return beat;
}
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
 for(const sc of project.scenes)for(const item of sc[key]||[])if(item.id===id){item.number=requested;markPresetOverride(item,'number')}
 return null;
}
function addIdentity(project,scene,type,beat,point,shape){const id=uid(),entry={id};
 if(type==='actor'||type==='camera')entry.number=nextAvailableNumber(scene,type);
 applyIdentity(project,entry,type);if(type==='actor'){scene.actors.push(entry);let active=false;for(const b of scene.beats){if(b===beat)active=true;if(active)b.positions[id]=defaultActorState(point.x,point.y)}}else if(type==='camera'){scene.cameras.push(entry);let active=false;for(const b of scene.beats){if(b===beat)active=true;if(active)b.cameras[id]=defaultCameraState(point.x,point.y,project.cameraDefaults)}}else{entry.name=shape==='custom'?'Custom Object':shape[0].toUpperCase()+shape.slice(1);entry.type=shape;entry.color='#C4C7CD';if(shape==='light'){entry.lightMode='kelvin';entry.lightKelvin=5600;entry.lightColor='#FFFFFF'}scene.equipment.push(entry);let active=false;for(const b of scene.beats){if(b===beat)active=true;if(active)b.equipment[id]=defaultEquipmentState(point.x,point.y)}}return entry}
function recolor(project,id,newColor){newColor=normalizeColor(newColor);if(!newColor)return 'Invalid HEX color';const info=project.identities?.[id];if(info)info.color=newColor;for(const scene of project.scenes)for(const entity of [...scene.actors,...scene.cameras,...scene.equipment])if(entity.id===id){entity.color=newColor;markPresetOverride(entity,'color')}return null}
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
function setOutline(project,id,outline){if(!['white','black'].includes(outline))return false;const item=project.identities?.[id];if(item)item.outline=outline;for(const s of project.scenes)for(const v of [...s.actors,...s.cameras])if(v.id===id){v.outline=outline;markPresetOverride(v,'outline')}return true}
function rename(project,id,newName){const info=project.identities?.[id];if(info)info.name=newName;for(const scene of project.scenes)for(const entity of [...scene.actors,...scene.cameras,...scene.equipment])if(entity.id===id){entity.name=newName;markPresetOverride(entity,'name')}}
const rotationOnly=kind=>['turn','pan'].includes(kind);
const positionalMotion=motion=>!!motion&&['walk','push','slide','track'].includes(motion.kind);
const visiblePair=(a,b)=>!!a&&!!b&&a.visible!==false&&b.visible!==false;
function setMotionKind(state,kind){
 if(!state||!['static','turn','pan','walk','push','slide','track'].includes(kind))return false;
 if(kind==='static'){state.motion=null;return true}
 const old=state.motion,turn=rotationOnly(kind),oldTurn=rotationOnly(old?.kind),angle=(state.rotation||0)*Math.PI/180;
 const reusePosition=positionalMotion(old)&&!turn;
 state.motion={kind,pathType:reusePosition?old.pathType||'linear':'linear',
  keys:turn&&oldTurn?clone(old.keys||[]):reusePosition?clone(old.keys||[]):[],
  endX:turn?state.x:reusePosition?old.endX:state.x+145*Math.cos(angle),
  endY:turn?state.y:reusePosition?old.endY:state.y+145*Math.sin(angle),
  endRotation:old?.endRotation??state.rotation};
 return true;
}
function syncPreviousEndpoint(scene,type,id,beatId){
 const key=type==='actor'?'positions':type==='camera'?'cameras':null;
 if(!key)return false;
 const i=scene.beats.findIndex(b=>b.id===beatId);if(i<1)return false;
 const current=scene.beats[i][key]?.[id],previous=scene.beats[i-1][key]?.[id];
 if(!current||!positionalMotion(previous?.motion)||!Number.isFinite(current.x)||!Number.isFinite(current.y))return false;
 previous.motion.endX=current.x;previous.motion.endY=current.y;
 return true;
}
return {copyPresetBeatOverrides,remapPresetBeats,detachSharedIdentity,SENSOR_FORMATS,cameraDefaults,ensureProjectSettings,normalizeColor,createPreset,applyPreset,saveInstancePreset,markPresetOverride,updatePreset,removePreset,resetPresetOverrides,VERSION,PRESET,clone,uid,label,normalizeAngle,register,applyIdentity,uniqueColor,migrate,createProject,nextBeat,finalBeatState,addIdentity,nextAvailableNumber,numberAvailable,setIdentityNumber,recolor,rename,setOutline,setBeatVisibility,backgroundFit,kelvinToHex,defaultActorState,defaultCameraState,defaultEquipmentState,rotationOnly,positionalMotion,visiblePair,setMotionKind,syncPreviousEndpoint};
});

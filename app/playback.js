/* Block4Film playback engine v0.3, shared by editor and video export. */
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;root.B4Playback=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const DEFAULTS=Object.freeze({speed:1,holdMs:2500,transitionMs:950,mode:'move'});
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const smooth=t=>{t=clamp(t);return t*t*(3-2*t)};
const clone=v=>JSON.parse(JSON.stringify(v));
function settings(value){return {speed:[.5,.75,1,1.5,2].includes(Number(value?.speed))?Number(value.speed):1,holdMs:[2000,2500,3000,5000].includes(Number(value?.holdMs))?Number(value.holdMs):2500,transitionMs:950,mode:['move','fade','ghost'].includes(value?.mode)?value.mode:'move'}}
function duration(count,config){const p=settings(config);return count?((count*p.holdMs)+(Math.max(0,count-1)*p.transitionMs))/p.speed:0}
function mixAngle(a,b,t){const delta=((Number(b||0)-Number(a||0)+540)%360)-180;return Number(a||0)+delta*t}
function mixState(a,b,t){if(!a&&!b)return null;if(!a)return {...clone(b),alpha:t};if(!b)return {...clone(a),alpha:1-t};const r={...clone(t<.5?a:b)};for(const key of ['x','y','lens','sensor'])if(Number.isFinite(a[key])&&Number.isFinite(b[key]))r[key]=a[key]+(b[key]-a[key])*t;r.rotation=mixAngle(a.rotation,b.rotation,t);r.alpha=(a.visible===false?0:1)*(1-t)+(b.visible===false?0:1)*t;r.visible=r.alpha>0.001;return r}
function mixMap(from={},to={},t){const result={};for(const id of new Set([...Object.keys(from),...Object.keys(to)])){const v=mixState(from[id],to[id],t);if(v)result[id]=v}return result}
function animateCameraPosition(camera,progress){if(!camera?.motion||camera.visible===false)return camera;const r=clone(camera),p=smooth(progress);r.x=camera.x+(camera.motion.endX-camera.x)*p;r.y=camera.y+(camera.motion.endY-camera.y)*p;r.rotation=mixAngle(camera.rotation,camera.motion.endRotation??camera.rotation,p);return r}
function beatStates(beat,progress=0,animateCamera=false){const cameras=clone(beat.cameras||{});if(animateCamera)for(const id of Object.keys(cameras))cameras[id]=animateCameraPosition(cameras[id],progress);return {positions:clone(beat.positions||{}),cameras,equipment:clone(beat.equipment||{})}}
function interpolate(from,to,t){return {positions:mixMap(from.positions,to.positions,t),cameras:mixMap(from.cameras,to.cameras,t),equipment:mixMap(from.equipment,to.equipment,t)}}
/** elapsedMs is wall-clock time; playback speed is applied internally. Never mutates project data. */
function frameAt(beats,elapsedMs,config,startIndex=0){const p=settings(config),start=Math.max(0,Math.min(beats.length-1,startIndex|0));if(!beats.length)return {done:true,phase:'empty',index:0,states:null};let elapsed=Math.max(0,elapsedMs)*p.speed;const remaining=beats.length-start;const total=remaining*p.holdMs+Math.max(0,remaining-1)*p.transitionMs;const done=elapsed>=total;elapsed=Math.min(elapsed,total);for(let i=start;i<beats.length;i++){
 const last=i===beats.length-1;
 if(elapsed<p.holdMs||last){const progress=last&&done?1:clamp(elapsed/p.holdMs);return {done,index:i,phase:'hold',progress,states:beatStates(beats[i],progress,p.mode==='move'),fromStates:null,toStates:null};}
 elapsed-=p.holdMs;
 if(elapsed<p.transitionMs){const t=smooth(elapsed/p.transitionMs);const a=beatStates(beats[i],1,p.mode==='move'),b=beatStates(beats[i+1],0,p.mode==='move');return {done:false,index:i+1,phase:'transition',progress:t,states:p.mode==='move'?interpolate(a,b,t):null,fromStates:a,toStates:b};}
 elapsed-=p.transitionMs;
 }
 return {done:true,index:beats.length-1,phase:'hold',progress:1,states:beatStates(beats[beats.length-1],1,p.mode==='move'),fromStates:null,toStates:null};
}
return {DEFAULTS,settings,duration,frameAt,mixAngle,mixState,interpolate,beatStates,smooth};
});

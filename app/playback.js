/* Block4Film playback engine v0.3, shared by editor and video export. */
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;root.B4Playback=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const DEFAULTS=Object.freeze({speed:1,holdMs:2500,transitionMs:950,mode:'move'});
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const smooth=t=>{t=clamp(t);return t*t*(3-2*t)};
const clone=v=>JSON.parse(JSON.stringify(v));
function settings(value){return {speed:[.5,.75,1,1.5,2].includes(Number(value?.speed))?Number(value.speed):1,holdMs:[2000,2500,3000,5000].includes(Number(value?.holdMs))?Number(value.holdMs):2500,transitionMs:950,mode:['move','fade','ghost'].includes(value?.mode)?value.mode:'move'}}
function holdForBeat(beat,p){const ms=Number(beat?.holdMs);return Number.isFinite(ms)&&ms>=500&&ms<=30000?ms:p.holdMs}
function duration(beatsOrCount,config){const p=settings(config),beats=Array.isArray(beatsOrCount)?beatsOrCount:null,count=beats?beats.length:Number(beatsOrCount)||0;return count?((beats?beats.reduce((n,b)=>n+holdForBeat(b,p),0):count*p.holdMs)+Math.max(0,count-1)*p.transitionMs)/p.speed:0}
function mixAngle(a,b,t){const delta=((Number(b||0)-Number(a||0)+540)%360)-180;return Number(a||0)+delta*t}
function mixState(a,b,t){if(!a&&!b)return null;if(!a)return {...clone(b),alpha:t};if(!b)return {...clone(a),alpha:1-t};const r={...clone(t<.5?a:b)};for(const key of ['x','y','lens','sensor'])if(Number.isFinite(a[key])&&Number.isFinite(b[key]))r[key]=a[key]+(b[key]-a[key])*t;r.rotation=mixAngle(a.rotation,b.rotation,t);r.alpha=(a.visible===false?0:1)*(1-t)+(b.visible===false?0:1)*t;r.visible=r.alpha>0.001;return r}
function mixMap(from={},to={},t){const result={};for(const id of new Set([...Object.keys(from),...Object.keys(to)])){const v=mixState(from[id],to[id],t);if(v)result[id]=v}return result}
function curveCoord(a,b,c,d,t){
 // Catmull–Rom through keyframe positions, with continuity at each keyframe.
 const t2=t*t,t3=t2*t;
 return .5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3);
}
function motionPoints(state){
 const m=state?.motion;
 if(!m)return [];
 const keys=(Array.isArray(m.keys)?m.keys:[]).filter(k=>Number.isFinite(k.t)&&k.t>0&&k.t<1&&Number.isFinite(k.x)&&Number.isFinite(k.y))
  .sort((a,b)=>a.t-b.t);
 return [{t:0,x:state.x,y:state.y,rotation:state.rotation??-90},...keys,
  {t:1,x:Number.isFinite(m.endX)?m.endX:state.x,y:Number.isFinite(m.endY)?m.endY:state.y,rotation:m.endRotation??state.rotation??-90}];
}
function animateCameraPosition(camera,progress){
 if(!camera?.motion||camera.visible===false)return camera;
 const pts=motionPoints(camera),m=camera.motion,t=smooth(progress);
 let j=1;while(j<pts.length-1&&t>pts[j].t)j++;
 const a=pts[j-1],b=pts[j],span=Math.max(.00001,b.t-a.t),u=clamp((t-a.t)/span);
 const r=clone(camera);
 if(['pan','turn'].includes(m.kind)){r.x=camera.x;r.y=camera.y}
 else if(m.pathType==='smooth'&&pts.length>2){
  const prev=pts[Math.max(0,j-2)],next=pts[Math.min(pts.length-1,j+1)];
  r.x=curveCoord(prev.x,a.x,b.x,next.x,u);
  r.y=curveCoord(prev.y,a.y,b.y,next.y,u);
 }else{r.x=a.x+(b.x-a.x)*u;r.y=a.y+(b.y-a.y)*u}
 r.rotation=mixAngle(a.rotation,b.rotation,u);
 return r;
}
function beatStates(beat,progress=0,animateCamera=false){const cameras=clone(beat.cameras||{}),positions=clone(beat.positions||{});if(animateCamera){for(const id of Object.keys(cameras))cameras[id]=animateCameraPosition(cameras[id],progress);for(const id of Object.keys(positions))positions[id]=animateCameraPosition(positions[id],progress)}return {positions,cameras,equipment:clone(beat.equipment||{})}}
function interpolate(from,to,t){return {positions:mixMap(from.positions,to.positions,t),cameras:mixMap(from.cameras,to.cameras,t),equipment:mixMap(from.equipment,to.equipment,t)}}
/** elapsedMs is wall-clock time; playback speed is applied internally. Never mutates project data. */
function frameAt(beats,elapsedMs,config,startIndex=0){const p=settings(config),start=Math.max(0,Math.min(beats.length-1,startIndex|0));if(!beats.length)return {done:true,phase:'empty',index:0,states:null};let elapsed=Math.max(0,elapsedMs)*p.speed;const remaining=beats.length-start;const total=beats.slice(start).reduce((n,b)=>n+holdForBeat(b,p),0)+Math.max(0,remaining-1)*p.transitionMs;const done=elapsed>=total;elapsed=Math.min(elapsed,total);for(let i=start;i<beats.length;i++){
 const last=i===beats.length-1,beatHold=holdForBeat(beats[i],p);
 if(elapsed<beatHold||last){const progress=last&&done?1:clamp(elapsed/beatHold);return {done,index:i,phase:'hold',progress,states:beatStates(beats[i],progress,p.mode==='move'),fromStates:null,toStates:null};}
 elapsed-=beatHold;
 if(elapsed<p.transitionMs){const t=smooth(elapsed/p.transitionMs);const a=beatStates(beats[i],1,p.mode==='move'),b=beatStates(beats[i+1],0,p.mode==='move');return {done:false,index:i+1,phase:'transition',progress:t,states:p.mode==='move'?interpolate(a,b,t):null,fromStates:a,toStates:b};}
 elapsed-=p.transitionMs;
 }
 return {done:true,index:beats.length-1,phase:'hold',progress:1,states:beatStates(beats[beats.length-1],1,p.mode==='move'),fromStates:null,toStates:null};
}
return {DEFAULTS,settings,holdForBeat,duration,frameAt,mixAngle,mixState,interpolate,beatStates,smooth,motionPoints,animateCameraPosition};
});

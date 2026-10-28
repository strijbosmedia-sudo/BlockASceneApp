/* Block4Film: offline scene library thumbnail renderer.
   Renders saved Beat 1 without touching live editor selection or zoom state. */
(function(root,factory){const api=factory(typeof module!=='undefined'&&module.exports?require('./model.js'):root.B4Model);if(typeof module!=='undefined'&&module.exports)module.exports=api;root.B4Previews=api;})(typeof globalThis!=='undefined'?globalThis:this,function(M){
'use strict';
const W=1100,H=700,WIDTH=560,HEIGHT=350,rad=d=>d*Math.PI/180;
function signature(project,scene){
 const location=project?.sets?.find(s=>s.id===scene?.setId);
 const source=JSON.stringify({renderer:3,beat:scene?.beats?.[0]||null,actors:scene?.actors||[],cameras:scene?.cameras||[],equipment:scene?.equipment||[],set:location||null});
 let h=2166136261;for(let i=0;i<source.length;i++){h^=source.charCodeAt(i);h=Math.imul(h,16777619)}
 return (h>>>0).toString(36)+':'+source.length;
}
function loadImage(src,ImageType){
 if(!src||!ImageType)return Promise.resolve(null);
 return new Promise(resolve=>{const img=new ImageType();let settled=false;const done=value=>{if(!settled){settled=true;resolve(value)}};img.onload=()=>done(img);img.onerror=()=>done(null);img.src=src;if(img.complete&&img.naturalWidth>0)done(img)});
}
function text(g,label,x,y,size=18,color='#eceef1'){
 g.fillStyle=color;g.font='600 '+size+'px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(String(label),x,y);
}
function actor(g,a,s){
 if(!s||s.visible===false)return;
 const c=a.color||'#399bff',r=20,d=(s.rotation??-90)*Math.PI/180;
 g.save();g.translate(s.x,s.y);g.fillStyle=c;g.strokeStyle='#f0f1f4';g.lineWidth=3;
 g.beginPath();g.arc(0,0,r,0,Math.PI*2);g.fill();g.stroke();
 g.save();g.rotate(d);g.beginPath();g.moveTo(r+11,0);g.lineTo(r-3,-9);g.lineTo(r-3,9);g.closePath();g.fill();g.restore();
 text(g,typeof a.number==='number'?M.label(a.number):'A',0,0,17,'#111217');g.restore();
}
function camera(g,a,s){
 if(!s||s.visible===false)return;
 const c=a.color||'#ab70ff',d=(s.rotation||0)*Math.PI/180,half=Math.atan((s.sensor||36)/(2*(s.lens||35))),distance=Math.max(80,Math.min(1100,s.coneRange??365));
 g.save();g.fillStyle=c+'19';g.strokeStyle=c+'7a';g.lineWidth=2;g.beginPath();g.moveTo(s.x,s.y);g.lineTo(s.x+distance*Math.cos(d-half),s.y+distance*Math.sin(d-half));g.arc(s.x,s.y,distance,d-half,d+half);g.closePath();g.fill();g.stroke();
 g.translate(s.x,s.y);g.rotate(d);g.fillStyle=c;g.strokeStyle='#f2f2f4';g.lineWidth=3;g.beginPath();g.roundRect(-20,-15,40,30,5);g.fill();g.stroke();g.beginPath();g.moveTo(18,-10);g.lineTo(33,0);g.lineTo(18,10);g.fill();g.restore();text(g,'C'+(a.number||1),s.x,s.y-35,15,c);
}
function fillText(g,text,x,y,size=14,color='#F6F6F8',bold=true){g.font=`${bold?'700':'500'} ${size}px Inter, ui-sans-serif, sans-serif`;g.fillStyle=color;g.textAlign='center';g.textBaseline='middle';g.fillText(text,x,y)}
function isStructural(obj){return ['wall','window','door'].includes(obj?.type)}
function object(g,o){
 g.save();g.translate(o.x,o.y);g.rotate(rad(o.rotation||0));
 const line=isStructural(o),length=o.w||80;
 if(line){
  const door=o.type==='door',window=o.type==='window';
  g.strokeStyle=door?'#B79B75':window?'#82B6D0':'#868A93';
  g.lineWidth=door?5:window?7:10;g.lineCap='round';g.beginPath();g.moveTo(0,0);g.lineTo(length,0);g.stroke();
  if(window){g.strokeStyle='#C7EBF9';g.lineWidth=2;g.beginPath();g.moveTo(0,-4);g.lineTo(length,-4);g.moveTo(0,4);g.lineTo(length,4);g.stroke()}
  if(door){g.strokeStyle='#B79B7566';g.lineWidth=1.5;g.beginPath();g.arc(0,0,length,-Math.PI/2,0);g.stroke()}
 }else{
  const width=Math.max(20,o.w||110),height=Math.max(20,o.h||80);
  g.fillStyle='#45485166';g.strokeStyle='#777B85';g.lineWidth=2;
  g.beginPath();if(o.type==='column'&&o.shape!=='square')g.arc(0,0,width/2,0,Math.PI*2);else g.roundRect(-width/2,-height/2,width,height,o.type==='column'?1:7);g.fill();g.stroke();
  fillText(g,o.name||'Furniture',0,0,13,'#9FA3AD',false);
 }
 g.restore();
}
function equipment(g,e,s,ghost=false,opacity=1){if(!s||s.visible===false)return;g.save();g.translate(s.x,s.y);g.rotate(rad(s.rotation||0));g.globalAlpha=(ghost?.25:1)*(s.alpha??1)*opacity;const lightColor=e.type==='light'?(e.lightMode==='color'?e.lightColor||'#FFFFFF':M.kelvinToHex(e.lightKelvin||5600)):e.color||'#C4C7CF';g.strokeStyle=ghost?'#979AA2':lightColor;g.fillStyle='#25262B';g.lineWidth=3;const kind=e.type;g.beginPath();if(kind==='light'){const modifier=e.lightModifier||'standard';if(modifier==='softbox'){const length={small:20,medium:26,large:33,'extra-large':40}[e.softboxSize]||26;g.roundRect(-length,-length*.72,length*2,length*1.44,5);g.fill();g.stroke();g.beginPath();g.moveTo(length,0);g.lineTo(length+17,-8);g.moveTo(length,0);g.lineTo(length+17,8);g.stroke()}else if(modifier==='spot'){g.moveTo(-16,-11);g.lineTo(10,-9);g.lineTo(28,-16);g.lineTo(28,16);g.lineTo(10,9);g.lineTo(-16,11);g.closePath();g.fill();g.stroke();g.beginPath();g.moveTo(28,0);g.lineTo(44,0);g.stroke()}else{g.arc(0,0,17,0,Math.PI*2);g.fill();g.stroke();g.beginPath();g.moveTo(0,0);g.lineTo(30,0);g.stroke()}}else if(['reflector','stand'].includes(kind)){g.arc(0,0,kind==='reflector'?22:17,0,Math.PI*2);g.fill();g.stroke();if(kind==='stand'){g.beginPath();g.moveTo(-9,-9);g.lineTo(9,9);g.moveTo(-9,9);g.lineTo(9,-9);g.stroke()}}
 else if(kind==='tube'||kind==='track'||kind==='boom'){g.moveTo(-34,0);g.lineTo(34,0);g.stroke();if(kind==='track'){g.moveTo(-34,-9);g.lineTo(34,-9);g.stroke()}}else if(kind==='flag'){g.rect(-22,-17,44,34);g.stroke();g.beginPath();g.moveTo(0,-17);g.lineTo(0,17);g.stroke()}else{g.roundRect(-26,-17,52,34,kind==='panel'?3:9);g.fill();g.stroke()}g.restore();if(!ghost)fillText(g,e.name,s.x,s.y-40,12,e.color||'#DBDEE4',false)}
async function renderScene(project,scene,environment={}){
 const doc=environment.document||((typeof document!=='undefined')?document:null);
 const ImageType=environment.Image||((typeof Image!=='undefined')?Image:null);
 if(!doc?.createElement||!scene?.beats?.length)return null;
 const canvas=doc.createElement('canvas');if(!canvas?.getContext||!canvas.toDataURL)return null;
 canvas.width=WIDTH;canvas.height=HEIGHT;
 const g=canvas.getContext('2d');if(!g)return null;
 g.fillStyle='#121419';g.fillRect(0,0,WIDTH,HEIGHT);
 const scale=Math.min((WIDTH-32)/W,(HEIGHT-32)/H);
 g.save();g.translate((WIDTH-W*scale)/2,(HEIGHT-H*scale)/2);g.scale(scale,scale);
 const location=project.sets?.find(st=>st.id===scene.setId);
 const img=await loadImage(location?.background,ImageType);
 if(img){const rect=M.backgroundFit(img.naturalWidth||img.width,img.naturalHeight||img.height,W,H,location?.backgroundScale??1);if(rect){g.save();g.globalAlpha=location.opacity??.75;g.filter=location.darken===false?'none':'brightness(.52) contrast(1.2)';g.drawImage(img,rect.x,rect.y,rect.width,rect.height);g.restore()}}
 else{
  g.strokeStyle='#252932';g.lineWidth=1;
  for(let x=0;x<W;x+=55){g.beginPath();g.moveTo(x,0);g.lineTo(x,H);g.stroke()}
  for(let y=0;y<H;y+=55){g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke()}
 }
 for(const o of location?.objects||[])object(g,o);
 const b=scene.beats[0];
 for(const e of scene.equipment||[])equipment(g,e,e.lockToSet?e.fixedState:b.equipment?.[e.id]);
 for(const a of scene.cameras||[])camera(g,a,b.cameras?.[a.id]);
 for(const a of scene.actors||[])actor(g,a,b.positions?.[a.id]);
 g.restore();
 // One compressed image per scene; independent of current editor zoom and selected beat.
 return canvas.toDataURL('image/jpeg',.76);
}
function previewForScene(scene){return scene?.customPreview||scene?.autoPreview||''}
function previewForProject(project){return project?.customPreview||previewForScene(project?.scenes?.[0])||''}
return {signature,renderScene,previewForScene,previewForProject,WIDTH,HEIGHT};
});

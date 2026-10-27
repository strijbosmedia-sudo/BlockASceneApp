/* Block4Film: offline scene library thumbnail renderer.
   Renders saved Beat 1 without touching live editor selection or zoom state. */
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;root.B4Previews=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const W=1100,H=700,WIDTH=560,HEIGHT=350;
function signature(project,scene){
 const location=project?.sets?.find(s=>s.id===scene?.setId);
 const source=JSON.stringify({beat:scene?.beats?.[0]||null,actors:scene?.actors||[],cameras:scene?.cameras||[],equipment:scene?.equipment||[],set:location||null});
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
 text(g,typeof a.number==='number'?String.fromCharCode(64+a.number):'A',0,0,17,'#111217');g.restore();
}
function camera(g,a,s){
 if(!s||s.visible===false)return;
 const c=a.color||'#ab70ff',d=(s.rotation||0)*Math.PI/180,half=Math.atan((s.sensor||36)/(2*(s.lens||35)));
 g.save();g.fillStyle=c+'19';g.strokeStyle=c+'7a';g.lineWidth=2;g.beginPath();g.moveTo(s.x,s.y);g.lineTo(s.x+360*Math.cos(d-half),s.y+360*Math.sin(d-half));g.arc(s.x,s.y,360,d-half,d+half);g.closePath();g.fill();g.stroke();
 g.translate(s.x,s.y);g.rotate(d);g.fillStyle=c;g.strokeStyle='#f2f2f4';g.lineWidth=3;g.beginPath();g.roundRect(-20,-15,40,30,5);g.fill();g.stroke();g.beginPath();g.moveTo(18,-10);g.lineTo(33,0);g.lineTo(18,10);g.fill();g.restore();text(g,'C'+(a.number||1),s.x,s.y-35,15,c);
}
function object(g,o){
 if(!o)return;
 g.save();g.translate(o.x||0,o.y||0);g.rotate((o.rotation||0)*Math.PI/180);
 const isLine=o.type==='wall'||o.type==='door';
 g.strokeStyle=o.type==='door'?'#ba9b72':'#858995';g.lineWidth=isLine?(o.type==='wall'?9:5):2;
 g.beginPath();
 if(isLine){g.moveTo(0,0);g.lineTo(o.w||60,o.h||0);g.stroke()}
 else{g.fillStyle='#71768133';g.roundRect(-(o.w||80)/2,-(o.h||50)/2,o.w||80,o.h||50,5);g.fill();g.stroke()}
 g.restore();
}
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
 if(img){const iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height,scale=Math.max(.25,Math.min(3,Number(location?.backgroundScale)||1));if(iw>0&&ih>0){const factor=Math.min(W*.92/iw,H*.92/ih)*scale,w=iw*factor,h=ih*factor;g.save();g.globalAlpha=location.opacity??.75;g.filter=location.darken===false?'none':'brightness(.60) contrast(1.15)';g.drawImage(img,(W-w)/2,(H-h)/2,w,h);g.restore()}}
 else{
  g.strokeStyle='#252932';g.lineWidth=1;
  for(let x=0;x<W;x+=55){g.beginPath();g.moveTo(x,0);g.lineTo(x,H);g.stroke()}
  for(let y=0;y<H;y+=55){g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke()}
 }
 for(const o of location?.objects||[])object(g,o);
 const b=scene.beats[0];
 for(const e of scene.equipment||[]){const s=e.lockToSet?e.fixedState:b.equipment?.[e.id];if(s?.visible!==false&&s){g.strokeStyle=e.color||'#d0d3d8';g.lineWidth=3;g.strokeRect(s.x-13,s.y-13,26,26)}}
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

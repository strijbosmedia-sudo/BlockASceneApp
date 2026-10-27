/* Block4Film v0.3 editor. Offline-first, mouse / pen / touch, no network dependencies. */
(()=>{
'use strict';
const M=window.B4Model, P=window.B4Playback, MANUAL=window.B4Manual, splashStarted=performance.now(), app=document.getElementById('app'),fileInput=document.getElementById('backgroundFile'),projectInput=document.getElementById('projectFile');
const W=1100,H=700,clamp=(x,min,max)=>Math.max(min,Math.min(max,x)),rad=d=>d*Math.PI/180,deg=r=>r*180/Math.PI;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe=v=>String(v||'scene').replace(/[^a-z0-9_-]+/gi,'-').slice(0,50)||'scene';
let database={version:2,projects:[]};
let ui={page:'editor',manualTab:'start',projectId:null,sceneId:null,beatId:null,selection:null,tool:'select',showMenu:false,showInspector:false,showLayers:false,showExportPanel:false,context:null,dialog:null,manualScroll:{},manualReturn:'workspace',layout:{layersPinned:false,propertiesPinned:false,layersSide:'right',propertiesSide:'right',layersWidth:290,propertiesWidth:300,layersFloatX:null,layersFloatY:null,propertiesFloatX:null,propertiesFloatY:null,layersFloatHeight:490,propertiesFloatHeight:510,timelineCollapsed:false},previousGhostMode:'adjacent',showCones:true,showPaths:true,showCameraMoves:true,ghostMode:'adjacent',view:{scale:.8,x:0,y:0},autoFit:true};
let canvas,wrap,ctx,drag=null,pointers=new Map(),pinch=null,saveTimer,undo=[],redo=[],images=new Map();
let playback={playing:false,elapsedMs:0,startedAt:0,startIndex:0,raf:0,frame:null,exporting:false};
const playbackOptions=()=>P.settings(project()?.playback);
function stopPlayback(resetFrame=true){if(playback.raf)cancelAnimationFrame(playback.raf);playback.raf=0;playback.playing=false;if(resetFrame)playback.frame=null;updatePlaybackChrome()}
function elapsedPlayback(){return playback.elapsedMs+(playback.playing?Math.max(0,performance.now()-playback.startedAt):0)}
function updatePlaybackChrome(){const el=document.querySelector('[data-action=toggle-playback]');if(el){el.textContent=playback.playing?'Ⅱ Pause':'▶ Play';el.setAttribute('aria-label',playback.playing?'Pause playback':'Play scene beats')}const state=playback.frame;const active=state?state.index:scene()?.beats.findIndex(x=>x.id===ui.beatId);document.querySelectorAll('.beat-chip').forEach((chip,i)=>{chip.classList.toggle('active',i===active);chip.classList.toggle('playing',!!playback.frame&&i===active)});const badge=document.getElementById('playbackStatus');if(badge)badge.textContent=playback.playing?'PLAYING':playback.frame?'PAUSED':'PREVIEW'}
function tickPlayback(){if(!playback.playing)return;const beats=scene()?.beats;if(!beats?.length)return stopPlayback();playback.frame=P.frameAt(beats,elapsedPlayback(),playbackOptions(),playback.startIndex);ui.beatId=beats[playback.frame.index].id;paint();updatePlaybackChrome();if(playback.frame.done){stopPlayback(false);paint();return}playback.raf=requestAnimationFrame(tickPlayback)}
function togglePlayback(){if(playback.playing){playback.elapsedMs=elapsedPlayback();stopPlayback(false);paint();return}if(!scene()?.beats.length)return;if(playback.frame?.done){playback.frame=null;playback.elapsedMs=0}if(!playback.frame){playback.startIndex=Math.max(0,scene().beats.findIndex(x=>x.id===ui.beatId));playback.elapsedMs=0}playback.startedAt=performance.now();playback.playing=true;playback.raf=requestAnimationFrame(tickPlayback);updatePlaybackChrome()}
function setPlaybackOption(name,value){const proj=project();if(!proj)return;const old=playbackOptions(),now={...old,[name]:name==='speed'||name==='holdMs'?Number(value):value};const elapsed=elapsedPlayback();proj.playback=P.settings(now);if(playback.playing||playback.frame){playback.elapsedMs=name==='speed'?elapsed*old.speed/proj.playback.speed:elapsed;playback.startedAt=performance.now();playback.frame=P.frameAt(scene().beats,playback.elapsedMs,proj.playback,playback.startIndex);paint()}save();updatePlaybackChrome()}
const project=()=>database.projects.find(p=>p.id===ui.projectId),scene=()=>project()?.scenes.find(s=>s.id===ui.sceneId),set=()=>project()?.sets.find(o=>o.id===scene()?.setId),beat=()=>scene()?.beats.find(b=>b.id===ui.beatId);
const actorBy=id=>scene()?.actors.find(o=>o.id===id),cameraBy=id=>scene()?.cameras.find(o=>o.id===id),equipmentBy=id=>scene()?.equipment.find(o=>o.id===id);
const stateOf=(selection=ui.selection,b=beat())=>!selection||!b?null:selection.type==='actor'?b.positions[selection.id]:selection.type==='camera'?b.cameras[selection.id]:selection.type==='equipment'?(equipmentBy(selection.id)?.lockToSet?equipmentBy(selection.id).fixedState:b.equipment[selection.id]):selection.type==='setobj'?set()?.objects.find(o=>o.id===selection.id):null;
const detailsOf=sel=>sel?.type==='actor'?actorBy(sel.id):sel?.type==='camera'?cameraBy(sel.id):sel?.type==='equipment'?equipmentBy(sel.id):null;
function notice(msg){const el=document.getElementById('toast');if(!el)return;el.textContent=msg;el.classList.add('on');clearTimeout(notice.timer);notice.timer=setTimeout(()=>el.classList.remove('on'),2800)}
function openStore(){return new Promise((resolve,reject)=>{const r=indexedDB.open('BlockaScene-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('state');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function loadDB(){try{const db=await openStore();const result=await new Promise((resolve,reject)=>{const tr=db.transaction('state','readonly');const req=tr.objectStore('state').get('database');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});db.close();return result}catch(e){console.warn('Could not read IndexedDB',e);try{return JSON.parse(localStorage.getItem('blockascene-backup')||'null')}catch{return null}}}
async function writeDB(){try{const db=await openStore();await new Promise((resolve,reject)=>{const tr=db.transaction('state','readwrite');tr.objectStore('state').put(database,'database');tr.oncomplete=resolve;tr.onerror=()=>reject(tr.error)});db.close()}catch(e){try{localStorage.setItem('blockascene-backup',JSON.stringify(database))}catch{notice('Storage is full. Export your project backup now.')}}}
function defaultLayout(){return {layersPinned:false,propertiesPinned:false,layersSide:'right',propertiesSide:'right',layersWidth:290,propertiesWidth:300,layersFloatX:null,layersFloatY:null,propertiesFloatX:null,propertiesFloatY:null,layersFloatHeight:490,propertiesFloatHeight:510,timelineCollapsed:false}}
function saveLayout(){try{localStorage.setItem('Block4Film-v11-layout',JSON.stringify(ui.layout))}catch{}}
function panelMeta(name){
 const p=name==='layers'?'layers':'properties',side=ui.layout[p+'Side']==='left'?'left':'right',pinned=!!ui.layout[p+'Pinned'];
 const width=clamp(Number(ui.layout[p+'Width'])||290,220,470);
 const height=clamp(Number(ui.layout[p+'FloatHeight'])||490,230,760);
 const x=ui.layout[p+'FloatX'],y=ui.layout[p+'FloatY'],moved=Number.isFinite(x)&&Number.isFinite(y);
 return {p,side,pinned,width,height,x,y,moved};
}
function panelStyle(name){
 const m=panelMeta(name),s=['width:'+m.width+'px'];
 if(!m.pinned){s.push('height:'+m.height+'px');if(m.moved){s.push('left:'+m.x+'px','top:'+m.y+'px','right:auto','bottom:auto')}}
 return s.join(';');
}
function panelButtons(name){
 const m=panelMeta(name),next=m.side==='right'?'left':'right';
 return `<div class="panel-head-buttons">${btn('switch-panel-side',m.side==='right'?'⇤':'⇥','Move '+name+' to '+next,'icon-only','data-panel="'+name+'"')}${btn('toggle-pin',m.pinned?'▣':'♧',m.pinned?'Unpin '+name:'Pin '+name,'icon-only','data-panel="'+name+'"')}${btn(name==='layers'?'toggle-layers':'close-inspector','×','Close '+name,'icon-only')}</div>`;
}
function panelGrip(name){
 const m=panelMeta(name);
 return `<div class="panel-resizer ${m.pinned?'is-docked':'is-floating'}" data-resize-panel="${name}" data-side="${m.side}" title="Resize ${name} panel" aria-label="Resize ${name} panel"></div>`;
}
function save(){if(project())project().updatedAt=Date.now();clearTimeout(saveTimer);saveTimer=setTimeout(writeDB,350)}
function checkpoint(){if(!project())return;undo.push(M.clone(project()));if(undo.length>60)undo.shift();redo=[]}
function replaceProject(snapshot){const i=database.projects.findIndex(p=>p.id===ui.projectId);if(i>=0)database.projects[i]=snapshot;ensureActive();render();save()}
function undoAction(){if(!undo.length)return notice('No changes to undo');redo.push(M.clone(project()));replaceProject(undo.pop())}
function redoAction(){if(!redo.length)return notice('No changes to redo');undo.push(M.clone(project()));replaceProject(redo.pop())}
function ensureActive(){if(ui.projectId&&!project())ui.projectId=null;const p=project();if(!p)return;if(!p.scenes.find(s=>s.id===ui.sceneId))ui.sceneId=p.scenes[0]?.id||null;const s=scene();if(s&&!s.beats.some(b=>b.id===ui.beatId))ui.beatId=s.beats[0]?.id||null}
function openProject(id){stopPlayback();ui.page='project';ui.showMenu=false;ui.projectId=id;ui.sceneId=null;ui.beatId=null;ui.selection=null;ui.showInspector=false;ui.autoFit=true;undo=[];redo=[];ensureActive();render()}
function home(){stopPlayback();ui.context=null;ui.dialog=null;ui.page='workspace';ui.projectId=null;ui.selection=null;ui.showInspector=false;ui.showLayers=false;ui.showMenu=false;render()}
const btn=(action,icon,text='',cls='',extra='')=>`<button class="action ${cls}" data-action="${action}" aria-label="${esc(text||action)}" title="${esc(text||action)}" ${extra}><span class="glyph">${icon}</span>${text?`<span class="action-label">${esc(text)}</span>`:''}</button>`;
function topbar(){
 const editorPage=!!project()&&ui.page==='editor';
 const brand=`<div class="brand"><b>Block<span class="brand-four">4</span>Film</b></div>`;
 const menu=btn('toggle-menu',ui.showMenu?'×':'☰','','menu-toggle icon-only','aria-label="Menu" title="Menu"');
 const homeButton=project()?btn('home','⌂','All projects','home-link icon-only'):'';
 const crumb=project()?`<span class="crumb">${esc(project().name)}${editorPage?' / '+esc(scene()?.name||'Scene'):''}</span>`:'';
 return `<header class="topbar"><div class="top-left">${menu}${homeButton}${brand}${btn('open-manual','?','Manual','small header-manual')}${crumb}</div><div class="top-actions">${editorPage?`${btn('undo','↶','Undo','icon-only')}${btn('redo','↷','Redo','icon-only')}${btn('toggle-editor-ghosts',ui.ghostMode==='off'?'◌':'◉','Beat ghosts','icon-only ghost-quick')}${btn('save-project','✓','Save','small')}${btn('toggle-export-panel','⇩','Export','small top-export')}`:`${btn('import-project','↑','Import','small')}`}</div></header>`
}
function dashboard(){return `<div class="app">${topbar()}${workspaceMenu()}<main class="dashboard"><div class="dashboard-title"><div><p class="eyebrow">YOUR WORKSPACE</p><h1>Projects</h1></div></div><div class="project-grid">${database.projects.map(p=>`<article class="project-tile" tabindex="0" role="button" data-action="open-project" data-context-kind="project" data-id="${esc(p.id)}"><div class="tile-visual"><img src="./assets/demo-plan.svg" alt="Set preview"/><span>${p.scenes.length} SCENES</span></div><div class="tile-info"><strong>${esc(p.name)}</strong><button class="more" data-action="open-context" data-kind="project" data-id="${esc(p.id)}" aria-label="Project options">⋯</button><small>${p.sets.length} sets · Updated ${new Date(p.updatedAt).toLocaleDateString()}</small></div></article>`).join('')}<button class="project-tile new-tile" data-action="new-project" aria-label="Create new project"><span class="plus">+</span><strong>New project</strong></button></div><p class="dash-footnote">Projects save offline. Use Export Project to create a transferable backup.</p></main>${contextMenu()}${modal()}</div>`}
function workspaceMenu(){return `<aside class="drawer ${ui.showMenu?'open':''}"><div class="drawer-head"><b>Menu</b>${btn('toggle-menu','×','','icon-only')}</div>${btn('new-project','+','New project','drawer-btn')}${btn('import-project','↑','Import project','drawer-btn')}${btn('open-manual','?','Manual','drawer-btn')}</aside>`}
function projectOverview(){
 const p=project();return `<div class="app">${topbar()}<main class="dashboard project-overview"><div class="dashboard-title"><div><p class="eyebrow">${esc(p.name.toUpperCase())}</p><h1>Scenes</h1><p>Choose a scene to open its editor.</p></div></div><div class="project-grid">${p.scenes.map(sc=>`<article class="project-tile" tabindex="0" role="button" data-action="choose-scene" data-context-kind="scene" data-id="${esc(sc.id)}"><div class="tile-visual"><img src="./assets/demo-plan.svg" alt="Scene preview"/><span>${sc.beats.length} BEATS</span></div><div class="tile-info"><strong>${esc(sc.name)}</strong><button class="more" data-action="open-context" data-kind="scene" data-id="${esc(sc.id)}" aria-label="Scene options">⋯</button><small>${esc(p.sets.find(st=>st.id===sc.setId)?.name||'Floor plan')}</small></div></article>`).join('')}<button class="project-tile new-tile" data-action="new-scene"><span class="plus">+</span><strong>New scene</strong></button></div><h2 class="overview-subheading">Floor plans</h2><div class="set-overview-list">${p.sets.map(st=>`<div class="overview-set" data-context-kind="set" data-id="${esc(st.id)}"><span>${esc(st.name)}</span><button data-action="open-context" data-kind="set" data-id="${esc(st.id)}" aria-label="Floor plan options">⋯</button></div>`).join('')}${btn('new-set','+','New floor plan','small')}</div></main>${side()}${contextMenu()}${modal()}</div>`
}

function side(){const p=project(),s=scene();return `<aside class="drawer ${ui.showMenu?'open':''}"><div class="drawer-head"><b>Menu</b>${btn('toggle-menu','×','','icon-only')}</div><div class="block-label">NAVIGATION</div>${btn('home','⌂','All projects','drawer-btn')}${btn('all-scenes','▦','All scenes','drawer-btn')}<div class="block-label">SCENES <button data-action="new-scene" title="New scene">+</button></div>${p.scenes.map(sc=>`<div class="drawer-row" data-context-kind="scene" data-id="${esc(sc.id)}"><button class="drawer-item ${sc.id===s?.id?'active':''}" data-action="choose-scene" data-id="${esc(sc.id)}">${esc(sc.name)}</button><button class="more" data-action="open-context" data-kind="scene" data-id="${esc(sc.id)}" aria-label="Scene options">⋯</button></div>`).join('')}<div class="block-label">FLOOR PLANS <button data-action="new-set" title="New floor plan">+</button></div>${p.sets.map(st=>`<div class="drawer-row" data-context-kind="set" data-id="${esc(st.id)}"><button class="drawer-item ${st.id===s?.setId?'active':''}" data-action="choose-set" data-id="${esc(st.id)}">${esc(st.name)}</button><button class="more" data-action="open-context" data-kind="set" data-id="${esc(st.id)}" aria-label="Floor plan options">⋯</button></div>`).join('')}${s?`${btn('import-bg','▧','Import floor plan','drawer-btn')}${btn('select-bg','⚙','Floor plan settings','drawer-btn')}`:''}<div class="block-label">EXPORT</div>${s?`${btn('export-image','⇩','Current beat PNG','drawer-btn')}${btn('export-zip','⇩','All beats ZIP','drawer-btn')}${btn('export-video-dialog','▶','Export animated WebM','drawer-btn')}`:''}${btn('backup','⇩','Export project backup','drawer-btn')}<div class="block-label">HELP</div>${btn('open-manual','?','Manual & shortcuts','drawer-btn')}</aside>`}
function openContext(kind,id,x=0,y=0){ui.context={kind,id,x:Math.min(Math.max(8,x),Math.max(8,innerWidth-240)),y:Math.min(Math.max(8,y),Math.max(8,innerHeight-250))};render()}
function contextMenu(){
 const c=ui.context;if(!c)return '';const kind=c.kind;
 const items=kind==='beat'?[['edit','Edit beat'],['duplicate','Duplicate'],['delete','Delete']]:[['edit',kind==='set'?'Edit floor plan':kind==='scene'?'Edit scene':'Edit project'],['duplicate','Duplicate'],['delete','Delete']];
 return `<div class="context-mask" data-action="close-context"></div><div role="menu" class="context-menu" style="left:${c.x}px;top:${c.y}px"><div class="context-title">${esc(kind)} actions</div>${items.map(([act,label])=>`<button role="menuitem" class="${act==='delete'?'is-danger':''}" data-action="context-action" data-command="${act}">${esc(label)}</button>`).join('')}</div>`
}
function manageItem(kind,id,cmd){
 const p=project(),item=kind==='project'?database.projects.find(x=>x.id===id):kind==='scene'?p?.scenes.find(x=>x.id===id):kind==='set'?p?.sets.find(x=>x.id===id):null;
 if(!item)return;
 if(cmd==='edit'||cmd==='rename'){ui.dialog={kind:'edit-'+kind,id};ui.showMenu=false;render();return}
 if(cmd==='open'){if(kind==='project')openProject(id);else if(kind==='scene')openScene(id);return}
 
 if(cmd==='duplicate'){checkpoint();const copy=M.clone(item);copy.id=M.uid();copy.name=item.name+' copy';if(kind==='project'){copy.updatedAt=Date.now();database.projects.push(copy)}else if(kind==='scene'){copy.beats.forEach(b=>b.id=M.uid());p.scenes.push(copy)}else{copy.objects.forEach(o=>o.id=M.uid());p.sets.push(copy)}save();render();return}
 if(cmd==='delete'){if(kind==='set'&&p.sets.length<2)return notice('Keep at least one floor plan');if(kind==='scene'&&p.scenes.length<2)return notice('Keep at least one scene');if(!confirm('Delete '+item.name+'? Export a backup first.'))return;checkpoint();if(kind==='project'){database.projects=database.projects.filter(v=>v.id!==id);if(ui.projectId===id)home()}else if(kind==='scene'){p.scenes=p.scenes.filter(v=>v.id!==id);if(ui.sceneId===id){ui.sceneId=p.scenes[0]?.id;ui.beatId=null}}else{p.sets=p.sets.filter(v=>v.id!==id);p.scenes.forEach(s=>{if(s.setId===id)s.setId=p.sets[0].id})}save();render()}
}
function openScene(id){stopPlayback();ui.sceneId=id;ui.beatId=null;ui.selection=null;ui.showInspector=false;ui.page='editor';ui.showMenu=false;ui.autoFit=true;render()}

function prop(label,name,value,type='text',attr=''){return `<label class="field"><span>${esc(label)}</span><input name="${name}" type="${type}" value="${esc(value)}" ${attr}/></label>`}
function option(label,name,values,current){return `<label class="field"><span>${esc(label)}</span><select name="${name}">${values.map(([val,title])=>`<option value="${esc(val)}" ${val===current?'selected':''}>${esc(title)}</option>`).join('')}</select></label>`}
function check(name,label,checked){return `<label class="switch"><span>${esc(label)}</span><input type="checkbox" name="${name}" ${checked?'checked':''}/></label>`}
function colors(current){return `<div class="swatches">${M.PRESET.map(color=>`<button type="button" class="swatch ${color.toUpperCase()===String(current).toUpperCase()?'selected':''}" style="background:${color}" data-action="quick-color" data-color="${color}" title="${color}"></button>`).join('')}</div>`}
function beatVisibilityGrid(sel){
 const sc=scene(),field=sel.type==='actor'?'positions':'cameras';
 return `<section class="beat-visibility"><div class="beat-visibility-title">Visible in beats <small>${sc.beats.filter(b=>b[field][sel.id]?.visible!==false&&b[field][sel.id]).length} / ${sc.beats.length}</small></div><div class="beat-visibility-list">${sc.beats.map((b,i)=>`<label class="beat-visibility-row ${b.id===ui.beatId?'current':''}"><input type="checkbox" name="beatVisible:${esc(b.id)}" ${b[field][sel.id]&&b[field][sel.id].visible!==false?'checked':''}/><span class="beat-visibility-number">${String(i+1).padStart(2,'0')}</span><span class="beat-visibility-name">${esc(b.name)}</span>${b.id===ui.beatId?'<em>NOW</em>':''}</label>`).join('')}</div><p class="help">Choose exactly which beats show this ${sel.type}. New beats appear here automatically.</p></section>`;
}
function inspector(){
 if(!ui.showInspector)return '';
 if(!ui.selection){
  const m=panelMeta('properties');
  return `<aside class="inspector ${m.pinned?'docked':'panel-float'}" data-panel="properties" data-side="${m.side}" data-moved="${m.moved}" style="${panelStyle('properties')}"><div class="inspector-head panel-header" data-drag-panel="properties"><span>OBJECT PROPERTIES</span>${panelButtons('properties')}</div><div class="inspect-body"><p class="help">Select an object to edit its properties.</p></div>${panelGrip('properties')}</aside>`;
 }
 const sel=ui.selection,d=detailsOf(sel),state=stateOf(sel);let content='';
 if(d&&(sel.type==='actor'||sel.type==='camera'||sel.type==='equipment')){
  content=`<div class="inspector-title"><span class="object-mark" style="background:${d.color||'#C8CBD1'}"></span><div><small>${sel.type==='actor'?'ACTOR '+M.label(d.number):sel.type==='camera'?'CAMERA '+d.number:d.type.toUpperCase()}</small><h3>${esc(d.name)}</h3></div></div>${prop('Name','itemName',d.name)}<div class="field"><span>Object color</span>${colors(d.color)}${prop('Custom HEX','itemColor',d.color,'color')}</div>${sel.type==='actor'||sel.type==='camera'?option('Symbol outline','itemOutline',[['white','White'],['black','Black']],d.outline||'white'):''}`;
  if(state)content+=`<div class="two-fields">${prop('X','x',Math.round(state.x),'number')}${prop('Y','y',Math.round(state.y),'number')}</div>${prop('Direction (degrees)','rotation',Math.round(M.normalizeAngle(state.rotation)),'number','step="1"')}${sel.type==='equipment'?check('visible','Visible in this beat',state.visible!==false):''}`;
  if(sel.type==='actor'||sel.type==='camera')content+=beatVisibilityGrid(sel);
  if(sel.type==='actor'&&state){content+=`${option('Movement within beat','motionKind',[['static','No movement'],['walk','Move actor']],state.motion?.kind||'static')}${state.motion?`<p class="help">Drag the destination marker to set the move.</p><div class="two-fields">${prop('End X','endX',Math.round(state.motion.endX),'number')}${prop('End Y','endY',Math.round(state.motion.endY),'number')}</div>${prop('End direction','endRotation',Math.round(M.normalizeAngle(state.motion.endRotation)),'number')}`:''}`;}
   if(sel.type==='camera'&&state){content+=`<div class="divider"></div><div class="two-fields">${prop('Lens (mm)','lens',state.lens,'number','min="8" max="600"')}${prop('Sensor (mm)','sensor',state.sensor,'number','min="5" max="70"')}</div>${option('Movement within beat','motionKind',[['static','Static'],['push','Push in / Pull back'],['slide','Slide left / right'],['track','Dolly / Track']],state.motion?.kind||'static')}`;
   if(state.motion)content+=`<p class="help">Solid line from Pos 1 to Pos 2. Drag the end marker to define the camera move.</p><div class="two-fields">${prop('Pos 2 X','endX',Math.round(state.motion.endX),'number')}${prop('Pos 2 Y','endY',Math.round(state.motion.endY),'number')}</div>${prop('End direction','endRotation',Math.round(M.normalizeAngle(state.motion.endRotation)),'number')}`;
  }
  if(!state&&(sel.type==='actor'||sel.type==='camera'))content+=`<p class="help">This object has no saved position in this beat. Tick its beat checkbox to place it using its nearest saved state.</p>`;
  if(sel.type==='equipment'){content+=`${check('lockToSet','Lock position across beats',!!d.lockToSet)}<p class="help">Simple diagram symbol. Rename it to the real item on set.</p>`}
  content+=`${btn('delete-selection','⌫','Delete object','danger wide')}`;
 }else if(sel.type==='setobj'&&state){content=`<h3>Set object</h3>${prop('Name','itemName',state.name||'')}${prop('X','x',state.x,'number')}${prop('Y','y',state.y,'number')}${prop('Rotation','rotation',state.rotation||0,'number')}${btn('delete-selection','⌫','Delete object','danger wide')}`}
 else if(sel.type==='background'){content=`<h3>Floor plan</h3>${prop('Set name','setName',set().name)}${prop('Opacity (%)','opacity',Math.round((set().opacity??.8)*100),'range','min="5" max="100"')}${check('darken','Darken imported image',set().darken!==false)}${btn('import-bg','▧','Replace floor plan','wide')}${btn('clear-bg','×','Remove image','danger wide')}`}
 const m=panelMeta('properties');return `<aside class="inspector ${m.pinned?'docked':'panel-float'}" data-panel="properties" data-side="${m.side}" data-moved="${m.moved}" style="${panelStyle('properties')}"><div class="inspector-head panel-header" data-drag-panel="properties"><span>OBJECT PROPERTIES</span>${panelButtons('properties')}</div><div class="inspect-body">${content}</div>${panelGrip('properties')}</aside>`}
function layers(){if(!ui.showLayers)return '';const objects=[...scene().actors.map(o=>({...o,kind:'actor'})),...scene().cameras.map(o=>({...o,kind:'camera'})),...scene().equipment.map(o=>({...o,kind:'equipment'}))];const m=panelMeta('layers');return `<aside class="layers-pop side-pop ${m.pinned?'docked':'panel-float'}" data-panel="layers" data-side="${m.side}" data-moved="${m.moved}" style="${panelStyle('layers')}" aria-label="Canvas layers"><div class="panel-head panel-header" data-drag-panel="layers"><strong>Layers & visibility</strong>${panelButtons('layers')}</div><div class="layers-body">${check('showCones','Camera field of view',ui.showCones)}${check('showPaths','Dotted beat-to-beat paths',ui.showPaths)}${check('showCameraMoves','Solid camera moves',ui.showCameraMoves)}${option('Other beat positions','ghostMode',[['off','Off'],['adjacent','Previous + Next'],['all','All beats']],ui.ghostMode)}<div class="object-roster"><strong>SCENE OBJECTS</strong>${objects.map(o=>{const state=stateOf({type:o.kind,id:o.id});return `<button class="roster-item" data-action="select-object" data-id="${o.id}" data-kind="${o.kind}"><span class="roster-dot" style="background:${o.color}"></span>${esc(o.kind==='actor'?M.label(o.number)+' · '+o.name:o.kind==='camera'?'Cam '+o.number+' · '+o.name:o.name)}${state?.visible===false||!state?'<em>HIDDEN</em>':''}</button>`}).join('')}</div></div>${panelGrip('layers')}</aside>`}
const exportPrefs=()=>({imageGhosts:false,videoGhosts:false,cones:true,paths:false,...project()?.exportPrefs});
function exportPanel(){if(!ui.showExportPanel)return '';const e=exportPrefs();return `<aside class="export-pop side-pop" aria-label="Export options"><div class="panel-head"><strong>Export settings</strong>${btn('toggle-export-panel','×','','icon-only')}</div><p class="help">These settings apply to exports only, independently of what the editor shows.</p>${check('exportImageGhosts','Ghosts in PNG / ZIP',e.imageGhosts)}${check('exportVideoGhosts','Ghosts in video',e.videoGhosts)}${check('exportCones','Camera cones in image / video',e.cones)}${check('exportPaths','Dotted paths in exports',e.paths)}<div class="export-buttons">${btn('export-image','⇩','Current beat PNG','wide')}${btn('export-zip','⇩','All beats ZIP','wide')}${btn('export-video-dialog','▶','Animated WebM','wide')}${btn('backup','⇩','Project backup (.blockascene)','wide')}</div><p class="help">The current video format is WebM. MP4 requires an additional reliable encoding path.</p></aside>`}
const tools=[['select','↖','Select'],['pan','<svg class="tool-icon" viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 12V6.5a1.5 1.5 0 0 1 3 0V11"/><path d="M11 11V4.5a1.5 1.5 0 0 1 3 0V11"/><path d="M14 10V6a1.5 1.5 0 0 1 3 0v6"/><path d="M17 12a1.5 1.5 0 0 1 3 0v4c0 3.3-2.7 6-6 6h-3c-2.4 0-4-1.1-5.3-3.1L3.4 15a1.7 1.7 0 0 1 2.7-2l2 2"/></svg>','Pan'],['actor','●','Actor'],['camera','▣','Camera'],['wall','╱','Wall'],['door','⌞','Door'],['furniture','▭','Furniture'],['equipment','◇','Equipment']];
function timeline(){const sc=scene(),activeIndex=sc.beats.findIndex(b=>b.id===ui.beatId),config=playbackOptions();return `<div class="timeline ${ui.layout.timelineCollapsed?'collapsed':''}"><div class="timeline-head"><div class="timeline-heading"><button class="timeline-collapse" data-action="toggle-timeline" aria-label="${ui.layout.timelineCollapsed?'Expand beats':'Collapse beats'}">${ui.layout.timelineCollapsed?'▴':'▾'}</button><strong>Scene beats</strong><small id="playbackStatus">${playback.playing?'PLAYING':'PREVIEW'}</small></div><div class="playback-controls"><button class="play-toggle" data-action="toggle-playback" aria-label="${playback.playing?'Pause playback':'Play scene beats'}">${playback.playing?'Ⅱ Pause':'▶ Play'}</button><label class="playback-setting"><span>Speed</span><select name="playbackSpeed" aria-label="Playback speed">${[.5,.75,1,1.5,2].map(v=>`<option value="${v}" ${v===config.speed?'selected':''}>${v}×</option>`).join('')}</select></label><label class="playback-setting"><span>Hold</span><select name="playbackHold" aria-label="Hold per beat">${[2000,2500,3000,5000].map(v=>`<option value="${v}" ${v===config.holdMs?'selected':''}>${(v/1000).toFixed(1)}s</option>`).join('')}</select></label><label class="playback-setting playback-mode"><span>Transition</span><select name="playbackMode" aria-label="Transition style">${[['move','Smooth move'],['fade','Color fade'],['ghost','Ghost fade']].map(([v,label])=>`<option value="${v}" ${v===config.mode?'selected':''}>${label}</option>`).join('')}</select></label>${btn('export-video-dialog','⇩','Export video','small playback-export')}</div><div class="timeline-controls">${btn('previous-beat','‹','Previous','icon-only')}${btn('next-beat','›','Next','icon-only')}${btn('rename-beat','✎','Rename','icon-only')}${btn('delete-beat','⌫','Delete','icon-only')}${btn('add-beat','+','Add beat','small primary')}</div></div><div class="beats">${sc.beats.map((b,i)=>`<button class="beat-chip ${b.id===ui.beatId?'active':''}" data-context-kind="beat" data-action="choose-beat" data-id="${b.id}"><span>${String(i+1).padStart(2,'0')} <span class="beat-tag">${i<activeIndex?'PAST':i===activeIndex?'NOW':'NEXT'}</span></span><b>${esc(b.name)}</b><span class="beat-more" data-action="open-context" data-kind="beat" data-id="${b.id}" role="button" aria-label="Beat options">⋯</span></button>`).join('')}</div></div>`}

function editor(){return `<div class="app">${topbar()}<main class="editor"><div class="work-canvas" style="--b4-layers-width:${ui.layout.layersWidth}px;--b4-properties-width:${ui.layout.propertiesWidth}px"><nav class="toolrail">${tools.map(([id,ic,name])=>id==='equipment'?`<button class="tool ${(ui.tool==='equipment'||ui.tool.startsWith('equip:'))?'selected':''}" data-action="toggle-equipment" aria-label="Equipment" title="Equipment">${ic}<span>${name}</span></button>`:`<button class="tool ${(ui.tool===id||(id==='equipment'&&ui.tool.startsWith('equip:')))?'selected':''}" data-action="tool" data-tool="${id}" title="${name}" aria-label="${name}">${ic}<span>${name}</span></button>`).join('')}</nav><div class="stage" id="canvasWrap"><canvas id="stage" aria-label="Interactive top-down scene floor plan"></canvas><div class="stage-hud"><strong>${esc(set()?.name||'Set')}</strong><small>${esc(beat()?.name||'Beat')}</small></div><div class="stage-zoom" id="zoomText">100%</div>${ui.tool==='equipment'?equipmentPicker():''}</div>${side()}${inspector()}${layers()}${exportPanel()}<nav class="utility-rail" aria-label="Editor panels"><button data-action="toggle-layers" title="Layers" aria-label="Layers" class="${ui.showLayers?'active':''}">▤</button><button data-action="toggle-inspector" title="Properties" aria-label="Properties" class="${ui.showInspector||ui.layout.propertiesPinned?'active':''}">☷</button><button data-action="reset-layout" title="Reset layout" aria-label="Reset layout">⤺</button></nav></div>${timeline()}${contextMenu()}${modal()}</main><div id="storage-note" aria-live="polite">Autosaved locally</div></div>`}
function equipmentPicker(){const opts=[['light','✹','Light'],['panel','▤','Panel'],['tube','━','Tube'],['flag','⚑','Flag'],['reflector','◑','Reflector'],['stand','⊕','Stand'],['track','═','Track'],['boom','⌁','Boom'],['custom','◇','Custom']];return `<div class="equipment-menu"><div class="equipment-head">Place basic equipment ${btn('tool','×','','icon-only','data-tool="select"')}</div><div class="equipment-grid">${opts.map(([id,ic,name])=>`<button data-action="place-equipment" data-shape="${id}" title="${name}"><span>${ic}</span>${name}</button>`).join('')}</div><p>Choose an item, then tap the floor plan. Rename it in Properties.</p></div>`}
function manualPage(){
const active=MANUAL.find(t=>t.id===ui.manualTab)||MANUAL[0];
const cards=active.sections.map(s=>'<section class="manual-section"><h3>'+esc(s.title)+'</h3>'+(s.points?'<ul>'+s.points.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'')+(s.pairs?'<dl class="manual-shortcuts">'+s.pairs.map(x=>'<div><dt>'+esc(x[0])+'</dt><dd>'+esc(x[1])+'</dd></div>').join('')+'</dl>':'')+'</section>').join('');
const tabs=MANUAL.map(t=>'<button data-action="manual-tab" data-tab="'+esc(t.id)+'" class="manual-tab '+(t.id===active.id?'active':'')+'" aria-current="'+(t.id===active.id?'page':'false')+'"><span>'+t.number+'</span>'+esc(t.label)+'</button>').join('');
return '<div class="app manual-app"><header class="topbar manual-topbar"><div class="top-left">'+btn('close-manual','←','Back','manual-back')+'<div class="brand"><b>Block<span class="brand-four">4</span>Film</b></div></div><span class="manual-top-label">USER MANUAL</span></header><main class="manual-page"><div class="manual-intro"><p class="manual-eyebrow">BLOCK4FILM / GUIDE</p><h1>Know the tools.<br/><span>Block the scene.</span></h1><p>A practical reference for preparing your next shoot, from floor plans to animated blocking.</p></div><div class="manual-layout"><nav class="manual-nav" aria-label="Manual topics">'+tabs+'</nav><article class="manual-content" tabindex="0" aria-live="polite"><span class="manual-number">'+esc(active.number)+' / '+String(MANUAL.length).padStart(2,'0')+'</span><h2>'+esc(active.title)+'</h2><p class="manual-lead">'+esc(active.intro)+'</p>'+cards+'<div class="manual-footer"><span>BLOCK4FILM · VERSION 1.1</span>'+btn('close-manual','←','Back to workspace','manual-back')+'</div></article></div></main></div>';
}

function beatCommand(id,command){
 const s=scene(),i=s?.beats.findIndex(b=>b.id===id);if(i<0)return;const b=s.beats[i];
 if(command==='edit'){ui.dialog={kind:'edit-beat',id};render();return}
 
 if(command==='duplicate'){stopPlayback();checkpoint();const copy=M.clone(b);copy.id=M.uid();copy.name=b.name+' copy';s.beats.splice(i+1,0,copy);ui.beatId=copy.id;save();render();return}
 if(command==='delete'){if(s.beats.length===1)return notice('A scene needs at least one beat');if(!confirm('Delete beat "'+b.name+'"?'))return;stopPlayback();checkpoint();s.beats.splice(i,1);ui.beatId=s.beats[Math.min(i,s.beats.length-1)].id;save();render()}
}
function modal(){
 const d=ui.dialog;if(!d)return '';

 const entityKinds=['new-project','edit-project','new-scene','edit-scene','new-set','edit-set'];
 if(entityKinds.includes(d.kind)){
  const p=project(),item=d.kind==='edit-project'?database.projects.find(x=>x.id===d.id):d.kind==='edit-scene'?p?.scenes.find(x=>x.id===d.id):d.kind==='edit-set'?p?.sets.find(x=>x.id===d.id):null;
  const group=d.kind.endsWith('project')?'Project':d.kind.endsWith('scene')?'Scene':'Floor plan';
  const create=d.kind.startsWith('new-'),title=(create?'Create ':'Edit ')+group;
  const setPicker=group==='Scene'?`<label class="field"><span>Floor plan</span><select id="entityEditSet">${(p?.sets||[]).map(st=>`<option value="${esc(st.id)}" ${st.id===(item?.setId||scene()?.setId)?'selected':''}>${esc(st.name)}</option>`).join('')}</select></label>`:'';
  const floorDetails=d.kind==='edit-set'?`<label class="field"><span>Image opacity (%)</span><input type="number" min="5" max="100" step="5" id="entityEditOpacity" value="${Math.round((item?.opacity??.8)*100)}"/></label><label class="switch"><span>Darken imported image</span><input type="checkbox" id="entityEditDarken" ${item?.darken!==false?'checked':''}/></label><div class="set-dialog-actions"><button data-action="replace-set-background">Replace / import image</button><button data-action="clear-set-background">Remove image</button><small>${item?.background?'Image attached':'No image attached'}</small></div>`:'';
  return `<div class="dialog-mask"><section class="dialog-card" role="dialog" aria-modal="true" aria-label="${esc(title)}"><header><h2>${esc(title)}</h2><button data-action="close-dialog" aria-label="Close">×</button></header><label class="field"><span>${esc(group)} name</span><input id="entityEditName" value="${esc(item?.name||(group==='Project'?'Untitled Film':group==='Scene'?'New scene':'New floor plan'))}" maxlength="100"/></label>${setPicker}${floorDetails}<div class="dialog-actions"><button data-action="close-dialog">Cancel</button><button class="dialog-confirm" data-action="save-entity-dialog">${create?'Create':'Save changes'}</button></div></section></div>`
 }

 if(d.kind==='edit-beat'){const b=scene()?.beats.find(x=>x.id===d.id);if(!b)return '';
 const hold=b.holdMs??playbackOptions().holdMs;
 return `<div class="dialog-mask"><section class="dialog-card" role="dialog" aria-modal="true" aria-label="Edit beat"><header><h2>Edit beat</h2><button data-action="close-dialog" aria-label="Close">×</button></header><label class="field"><span>Name</span><input id="beatEditName" value="${esc(b.name)}" maxlength="90"/></label><label class="field"><span>Hold duration (seconds)</span><input id="beatEditHold" type="number" min="0.5" max="30" step="0.5" value="${hold/1000}"/></label><p class="help">This beat has its own hold time. Other beats use the global default unless edited.</p><div class="dialog-actions"><button data-action="reset-beat-duration">Use default</button><button data-action="close-dialog">Cancel</button><button class="dialog-confirm" data-action="save-beat-dialog">Save beat</button></div></section></div>`
 }
 if(d.kind==='video'){const c=ui.videoDraft||playbackOptions(),e=exportPrefs();
 return `<div class="dialog-mask"><section class="dialog-card" role="dialog" aria-modal="true" aria-label="Video export settings"><header><h2>Export animated WebM</h2><button data-action="close-dialog" aria-label="Close">×</button></header><p class="help">These settings will be used for this export and your next playback preview.</p>${option('Speed','videoSpeed',[[.5,'0.5×'],[.75,'0.75×'],[1,'1×'],[1.5,'1.5×'],[2,'2×']],c.speed)}${option('Default beat hold','videoHold',[[2000,'2 seconds'],[2500,'2.5 seconds'],[3000,'3 seconds'],[5000,'5 seconds']],c.holdMs)}${option('Transition','videoMode',[['move','Smooth move'],['fade','Color fade'],['ghost','Ghost fade']],c.mode)}${check('exportVideoGhosts','Include beat ghosts',e.videoGhosts)}${check('exportCones','Show camera cones',e.cones)}${check('exportPaths','Show dotted move paths',e.paths)}<p class="help">Individual beat durations override the default. Output: WebM video.</p><div class="dialog-actions"><button data-action="close-dialog">Cancel</button><button class="dialog-confirm" data-action="confirm-video-export">Export video</button></div></section></div>`
 }
 return '';
}

let lastRenderedDialogKey='';
function render(){
 ensureActive();
 const key=ui.dialog?ui.dialog.kind+':'+(ui.dialog.id||''):'';
 // A background rerender must never discard unsaved text or the user's caret position.
 const preserved=new Map(),active=document.activeElement;
 let focusKey=null,caret=null;
 if(key&&lastRenderedDialogKey===key){
  for(const field of app.querySelectorAll?.('.dialog-card input,.dialog-card select,.dialog-card textarea')||[]){
   const id=field.id||field.name;if(!id)continue;
   preserved.set(id,{value:field.value,checked:field.checked});
   if(field===active){focusKey=id;if(typeof field.selectionStart==='number')caret=[field.selectionStart,field.selectionEnd]}
  }
 }
 app.innerHTML=ui.page==='manual'?manualPage():!project()?dashboard():ui.page==='project'?projectOverview():editor();
 if(ui.page==='editor'&&scene())initCanvas();
 if(ui.page==='manual'){const pane=app.querySelector('.manual-content');if(pane)pane.scrollTop=ui.manualScroll[ui.manualTab]||0}
 if(key){
  for(const field of app.querySelectorAll?.('.dialog-card input,.dialog-card select,.dialog-card textarea')||[]){
   const saved=preserved.get(field.id||field.name);if(!saved)continue;
   if(field.type==='checkbox'||field.type==='radio')field.checked=saved.checked;else field.value=saved.value;
  }
  const fields=app.querySelectorAll?.('.dialog-card input,.dialog-card select,.dialog-card textarea')||[];
  const focused=focusKey?[...fields].find(el=>(el.id||el.name)===focusKey):null;
  const target=focused||(key!==lastRenderedDialogKey?app.querySelector?.('#entityEditName')||app.querySelector?.('#beatEditName'):null);
  if(target?.focus){
   target.focus({preventScroll:true});
   if(focused&&caret&&typeof target.setSelectionRange==='function')try{target.setSelectionRange(caret[0],caret[1])}catch{}
   else if(!focused&&target.select)target.select();
  }
 }
 lastRenderedDialogKey=key;
}
function cached(src){if(!src)return null;let record=images.get(src);if(!record){record={ready:false,img:new Image()};images.set(src,record);record.img.onload=()=>{record.ready=true;paint()};record.img.onerror=()=>console.warn('Image could not be loaded');record.img.src=src}return record.ready?record.img:null}
function initCanvas(){canvas=document.getElementById('stage');wrap=document.getElementById('canvasWrap');ctx=canvas.getContext('2d');pointers.clear();drag=null;pinch=null;if(ui.autoFit){fitView();ui.autoFit=false}canvas.addEventListener('pointerdown',onDown);canvas.addEventListener('pointermove',onMove);canvas.addEventListener('pointerup',onUp);canvas.addEventListener('pointercancel',onUp);canvas.addEventListener('wheel',wheel,{passive:false});canvas.addEventListener('auxclick',e=>{if(e.button===1)e.preventDefault()});paint()}
function fitView(){if(!wrap)return;const r=wrap.getBoundingClientRect(),scale=Math.max(.15,Math.min((r.width-65)/W,(r.height-35)/H,1.8));ui.view={scale,x:(r.width-W*scale)/2,y:(r.height-H*scale)/2}}
function canvasPoint(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
function world(p){return{x:(p.x-ui.view.x)/ui.view.scale,y:(p.y-ui.view.y)/ui.view.scale}}
function selectionCenter(sel,b){const o=stateOf(sel,b);return o?{x:o.x,y:o.y}:null}
function ringRadius(sel,scale){return Math.max(sel.type==='setobj'?55:sel.type==='camera'?45:38,34/scale)}
function fillText(g,text,x,y,size=14,color='#F6F6F8',bold=true){g.font=`${bold?'700':'500'} ${size}px Inter, ui-sans-serif, sans-serif`;g.fillStyle=color;g.textAlign='center';g.textBaseline='middle';g.fillText(text,x,y)}
function arrow(g,a,b,color,dotted=false,opacity=1,lineWidth=3){const angle=Math.atan2(b.y-a.y,b.x-a.x),length=Math.hypot(b.x-a.x,b.y-a.y);if(length<7)return;g.save();g.globalAlpha=opacity;g.strokeStyle=color;g.fillStyle=color;g.lineWidth=lineWidth;g.lineCap='round';g.setLineDash(dotted?[2,10]:[]);g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.stroke();g.setLineDash([]);const tip={x:a.x+(b.x-a.x)*.67,y:a.y+(b.y-a.y)*.67};g.translate(tip.x,tip.y);g.rotate(angle);g.beginPath();g.moveTo(8,0);g.lineTo(-8,-5.5);g.lineTo(-8,5.5);g.closePath();g.fill();g.restore()}
function drawActor(g,a,s,ghost=false,opacity=1){if(!s||s.visible===false)return;g.save();g.translate(s.x,s.y);const color=ghost?'#8A8E97':a.color;g.globalAlpha=(ghost?.38:1)*(s.alpha??1)*opacity;g.fillStyle=ghost?'#292B30':color;g.strokeStyle=ghost?'#B9BDC6':a.outline==='black'?'#09090B':'#E8EBEF';g.lineWidth=ghost?1.8:2.4;if(ghost)g.setLineDash([4,5]);g.beginPath();g.arc(0,0,20,0,Math.PI*2);g.fill();g.stroke();g.setLineDash([]);g.save();g.rotate(rad(s.rotation??-90));g.beginPath();g.moveTo(29,0);g.lineTo(14,-9);g.lineTo(14,9);g.closePath();g.fillStyle=color;g.fill();g.restore();fillText(g,M.label(a.number||1),0,1,18,ghost?'#C1C4CC':'#0A0B0E');if(!ghost)fillText(g,a.name,s.x-s.x,s.y-s.y-34,13,a.color,false);g.restore()}
function drawActorMove(g,a,s){if(!s||s.visible===false||!s.motion)return;const m=s.motion;arrow(g,{x:s.x,y:s.y},{x:m.endX,y:m.endY},a.color,false,.85,3);g.save();g.strokeStyle=a.color;g.lineWidth=2;g.setLineDash([5,5]);g.beginPath();g.arc(m.endX,m.endY,18,0,Math.PI*2);g.stroke();g.restore();fillText(g,'2',m.endX,m.endY,12,a.color)}
function drawCamera(g,c,s,ghost=false,showMotion=true,showCone=true,opacity=1){if(!s||s.visible===false)return;const color=ghost?'#92959F':c.color;g.save();g.globalAlpha=(ghost?.35:1)*(s.alpha??1)*opacity;
 if(showCone){const half=Math.atan((s.sensor||36)/(2*(s.lens||35))),angle=rad(s.rotation||0),distance=365;g.fillStyle=ghost?'#848A9510':c.color+'17';g.strokeStyle=ghost?'#9AA0AA55':c.color+'66';g.lineWidth=1.7;g.beginPath();g.moveTo(s.x,s.y);g.lineTo(s.x+distance*Math.cos(angle-half),s.y+distance*Math.sin(angle-half));g.arc(s.x,s.y,distance,angle-half,angle+half);g.closePath();g.fill();g.stroke()}
 if(showMotion&&s.motion){const target={x:s.motion.endX,y:s.motion.endY};arrow(g,s,target,color,false,ghost?.45:.94,4);g.save();g.translate(target.x,target.y);g.rotate(rad(s.motion.endRotation??s.rotation));g.strokeStyle=color;g.lineWidth=2.5;g.setLineDash([5,5]);g.strokeRect(-17,-12,34,24);g.setLineDash([]);g.restore();fillText(g,'2',target.x,target.y,15,color);if(!ghost){fillText(g,'POS 1',s.x,s.y+40,10,color,false);fillText(g,'POS 2',target.x,target.y+30,10,color,false)}}
 g.translate(s.x,s.y);g.save();g.rotate(rad(s.rotation||0));g.fillStyle=ghost?'#2C2E34':color;g.strokeStyle=ghost?'#B8BBC4':c.outline==='black'?'#09090B':'#F0F1F5';g.lineWidth=ghost?1.8:2.5;g.beginPath();g.roundRect(-21,-15,42,30,6);g.fill();g.stroke();g.beginPath();g.moveTo(20,-10);g.lineTo(33,0);g.lineTo(20,10);g.closePath();g.fill();g.restore();fillText(g,String(c.number||1),0,0,16,ghost?'#CFD0D5':'#101013');if(!ghost)fillText(g,c.name,0,-33,12,c.color,false);g.restore()}
function drawEquipment(g,e,s,ghost=false,opacity=1){if(!s||s.visible===false)return;g.save();g.translate(s.x,s.y);g.rotate(rad(s.rotation||0));g.globalAlpha=(ghost?.25:1)*(s.alpha??1)*opacity;g.strokeStyle=ghost?'#979AA2':e.color||'#C4C7CF';g.fillStyle='#25262B';g.lineWidth=3;const kind=e.type;g.beginPath();if(['light','reflector','stand'].includes(kind)){g.arc(0,0,kind==='reflector'?22:17,0,Math.PI*2);g.fill();g.stroke();if(kind==='light'){g.beginPath();g.moveTo(0,0);g.lineTo(30,0);g.stroke()}else if(kind==='stand'){g.beginPath();g.moveTo(-9,-9);g.lineTo(9,9);g.moveTo(-9,9);g.lineTo(9,-9);g.stroke()}}
 else if(kind==='tube'||kind==='track'||kind==='boom'){g.moveTo(-34,0);g.lineTo(34,0);g.stroke();if(kind==='track'){g.moveTo(-34,-9);g.lineTo(34,-9);g.stroke()}}else if(kind==='flag'){g.rect(-22,-17,44,34);g.stroke();g.beginPath();g.moveTo(0,-17);g.lineTo(0,17);g.stroke()}else{g.roundRect(-26,-17,52,34,kind==='panel'?3:9);g.fill();g.stroke()}g.restore();if(!ghost)fillText(g,e.name,s.x,s.y-40,12,e.color||'#DBDEE4',false)}
function drawSetObject(g,o){g.save();g.translate(o.x,o.y);g.rotate(rad(o.rotation||0));const line=o.type==='wall',door=o.type==='door';if(line||door){g.strokeStyle=door?'#A68D69':'#71757E';g.lineWidth=line?10:5;g.beginPath();g.moveTo(0,0);g.lineTo(o.w||60,o.h||0);g.stroke()}else{g.fillStyle='#45485166';g.strokeStyle='#777B85';g.lineWidth=2;g.beginPath();g.roundRect(-o.w/2,-o.h/2,o.w,o.h,7);g.fill();g.stroke();fillText(g,o.name||'Furniture',0,0,13,'#9FA3AD',false)}g.restore()}
function drawGhostStates(g,s,idx,mode='adjacent',moves=false){
 const indices=mode==='all'?s.beats.map((_,i)=>i).filter(i=>i!==idx):[idx-1,idx+1].filter(i=>i>=0&&i<s.beats.length);
 for(const i of indices){const other=s.beats[i];for(const a of s.actors)drawActor(g,a,other.positions[a.id],true);for(const c of s.cameras)drawCamera(g,c,other.cameras[c.id],true,moves,false);for(const e of s.equipment)if(!e.lockToSet)drawEquipment(g,e,other.equipment[e.id],true)}
}
function drawDottedBeatPaths(g,s,idx,ghost){
 const beat=s.beats[idx],prev=s.beats[idx-1],next=s.beats[idx+1];if(!beat)return;
 const pathBetween=(from,to,color,alpha)=>{if(from&&to&&from.visible!==false&&to.visible!==false)arrow(g,from,to,color,true,alpha,3)};
 for(const a of s.actors){if(prev)pathBetween(prev.positions[a.id],beat.positions[a.id],a.color,.82);if(ghost&&next)pathBetween(beat.positions[a.id],next.positions[a.id],'#888B93',.35)}
 for(const c of s.cameras){if(prev)pathBetween(prev.cameras[c.id],beat.cameras[c.id],c.color,.82);if(ghost&&next)pathBetween(beat.cameras[c.id],next.cameras[c.id],'#888B93',.35)}
}
function draw(g,width,height,opts={}){const s=scene(),location=set();if(!s||!location)return;const b=s.beats.find(o=>o.id===(opts.beatId||ui.beatId))||s.beats[0];if(!b)return;const exportMode=!!opts.export,view=exportMode?(()=>{const scale=Math.min((width-90)/W,(height-90)/H);return{scale,x:(width-W*scale)/2,y:(height-H*scale)/2}})():ui.view;
 g.clearRect(0,0,width,height);g.fillStyle='#0B0C0F';g.fillRect(0,0,width,height);
 if(!exportMode){g.save();g.strokeStyle='#202127';g.lineWidth=.8;const gap=48*view.scale,ox=((view.x%gap)+gap)%gap,oy=((view.y%gap)+gap)%gap;g.beginPath();for(let x=ox;x<width;x+=gap){g.moveTo(x,0);g.lineTo(x,height)}for(let y=oy;y<height;y+=gap){g.moveTo(0,y);g.lineTo(width,y)}g.stroke();g.restore()}
 g.save();g.translate(view.x,view.y);g.scale(view.scale,view.scale);
 const bg=cached(location.background);if(bg){g.save();g.globalAlpha=location.opacity??.75;g.filter=location.darken===false?'none':'brightness(.52) contrast(1.2)';g.drawImage(bg,0,0,W,H);g.restore()}
 for(const obj of location.objects)drawSetObject(g,obj);
 if(opts.frame){const frame=opts.frame,mode=opts.mode||'move',cones=opts.cones??(exportMode?exportPrefs().cones:ui.showCones),frameGhosts=opts.ghost??(exportMode?false:ui.ghostMode!=='off');if((opts.paths??(!exportMode&&ui.showPaths)))drawDottedBeatPaths(g,s,frame.index,frameGhosts);if(frameGhosts)drawGhostStates(g,s,frame.index,exportMode?'adjacent':ui.ghostMode,false);const drawState=(state,alpha=1,asGhost=false)=>{if(!state||alpha<=0)return;for(const e of s.equipment)drawEquipment(g,e,e.lockToSet?e.fixedState:state.equipment[e.id],asGhost,alpha);for(const c of s.cameras)drawCamera(g,c,state.cameras[c.id],asGhost,false,!asGhost&&cones,alpha);for(const a of s.actors)drawActor(g,a,state.positions[a.id],asGhost,alpha)};
  if(frame.phase==='transition'&&mode!=='move'){const p=frame.progress;drawState(frame.fromStates,1-p,mode==='ghost');drawState(frame.toStates,p,false)}else drawState(frame.states,1,false);
  g.restore();if(exportMode){const sceneBeat=s.beats[frame.index];g.fillStyle='#E6E8EE';g.font='700 26px sans-serif';g.fillText(`${s.name} / ${sceneBeat?.name||''}`,28,39)}return;
 }
 const idx=s.beats.findIndex(o=>o.id===b.id),prev=s.beats[idx-1],next=s.beats[idx+1],ghost=opts.ghost??(!exportMode&&ui.ghostMode!=='off'),paths=opts.paths??(!exportMode&&ui.showPaths);
 if(paths)drawDottedBeatPaths(g,s,idx,ghost);
 if(ghost)drawGhostStates(g,s,idx,exportMode?'adjacent':ui.ghostMode,exportMode?false:ui.showCameraMoves)
 for(const e of s.equipment)drawEquipment(g,e,e.lockToSet?e.fixedState:b.equipment[e.id]);
 for(const c of s.cameras)drawCamera(g,c,b.cameras[c.id],false,opts.moves??ui.showCameraMoves,opts.cones??ui.showCones);
 for(const a of s.actors){if(opts.moves??ui.showCameraMoves)drawActorMove(g,a,b.positions[a.id]);drawActor(g,a,b.positions[a.id])}
 if(!exportMode&&ui.selection){const origin=selectionCenter(ui.selection,b);if(origin){const r=ringRadius(ui.selection,view.scale),color=detailsOf(ui.selection)?.color||'#EDEEF1';g.strokeStyle=color;g.globalAlpha=.92;g.lineWidth=2/view.scale;g.setLineDash([7/view.scale,6/view.scale]);g.beginPath();g.arc(origin.x,origin.y,r,0,Math.PI*2);g.stroke();g.setLineDash([]);g.fillStyle=color;g.beginPath();g.arc(origin.x+r*Math.cos(rad(stateOf(ui.selection)?.rotation||0)),origin.y+r*Math.sin(rad(stateOf(ui.selection)?.rotation||0)),6/view.scale,0,Math.PI*2);g.fill();if(drag?.mode==='rotate'){fillText(g,`${Math.round(M.normalizeAngle(stateOf(ui.selection)?.rotation||0))}°`,origin.x,origin.y+r+24/view.scale,14/view.scale,color)} }}
 g.restore();if(exportMode){g.fillStyle='#E6E8EE';g.font='700 26px sans-serif';g.fillText(`${s.name}  /  ${b.name}`,28,39)}
}
function paint(){if(!canvas?.isConnected||!wrap)return;const width=Math.max(1,Math.floor(wrap.clientWidth)),height=Math.max(1,Math.floor(wrap.clientHeight)),ratio=Math.min(devicePixelRatio||1,2);if(canvas.width!==Math.round(width*ratio)||canvas.height!==Math.round(height*ratio)){canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio)}ctx.setTransform(ratio,0,0,ratio,0,0);draw(ctx,width,height,playback.frame?{frame:playback.frame,mode:playbackOptions().mode}:{});const t=document.getElementById('zoomText');if(t)t.textContent=`TOP VIEW · ${Math.round(ui.view.scale*100)}%`;canvas.dataset.viewX=String(ui.view.x);canvas.dataset.viewY=String(ui.view.y);canvas.dataset.viewScale=String(ui.view.scale)}
function hitAt(w){const sc=scene(),b=beat();if(!sc||!b)return null;
 // Selected object ring and camera path end take priority over object bodies.
 if(ui.selection){const o=stateOf(),center=selectionCenter(ui.selection,b);if(center){const r=ringRadius(ui.selection,ui.view.scale),d=Math.hypot(w.x-center.x,w.y-center.y),tol=13/ui.view.scale;if(Math.abs(d-r)<=tol)return{type:'rotate',selection:ui.selection};if(['camera','actor'].includes(ui.selection.type)&&o?.motion){const e=o.motion;if(Math.hypot(w.x-e.endX,w.y-e.endY)<=Math.max(16,16/ui.view.scale))return{type:'endpoint',selection:ui.selection}}}}
 for(let i=sc.actors.length-1;i>=0;i--){const a=sc.actors[i],v=b.positions[a.id];if(v?.visible!==false&&v&&Math.hypot(w.x-v.x,w.y-v.y)<=Math.max(24,19/ui.view.scale))return{type:'object',selection:{type:'actor',id:a.id}}}
 for(let i=sc.cameras.length-1;i>=0;i--){const c=sc.cameras[i],v=b.cameras[c.id];if(v?.visible!==false&&v&&Math.hypot(w.x-v.x,w.y-v.y)<=Math.max(30,22/ui.view.scale))return{type:'object',selection:{type:'camera',id:c.id}}}
 for(let i=sc.equipment.length-1;i>=0;i--){const e=sc.equipment[i],v=e.lockToSet?e.fixedState:b.equipment[e.id];if(v?.visible!==false&&v&&Math.hypot(w.x-v.x,w.y-v.y)<=Math.max(32,24/ui.view.scale))return{type:'object',selection:{type:'equipment',id:e.id}}}
 for(let i=set().objects.length-1;i>=0;i--){const o=set().objects[i];if(Math.hypot(w.x-o.x,w.y-o.y)<=Math.max(32,(o.w||50)/2))return{type:'object',selection:{type:'setobj',id:o.id}}}
 return null}
function place(tool,pos){checkpoint();const p=project(),s=scene(),b=beat();let entry;if(['actor','camera'].includes(tool)){entry=M.addIdentity(p,s,tool,b,pos);ui.selection={type:tool,id:entry.id}}else if(tool.startsWith('equip:')){entry=M.addIdentity(p,s,'equipment',b,pos,tool.slice(6));ui.selection={type:'equipment',id:entry.id}}else{entry={id:M.uid(),name:tool==='furniture'?'Table':'',type:tool,x:pos.x,y:pos.y,w:tool==='wall'?160:tool==='door'?80:110,h:tool==='furniture'?80:0,rotation:0};set().objects.push(entry);ui.selection={type:'setobj',id:entry.id}}ui.showInspector=true;ui.tool='select';save();render()}
function onDown(e){
 if(playback.playing||playback.frame){stopPlayback();playback.elapsedMs=0;}
 const middle=e.pointerType==='mouse'&&e.button===1;
 if(e.pointerType==='mouse'&&e.button!==0&&!middle)return;
 e.preventDefault();
 const p=canvasPoint(e),w=world(p);
 canvas.setPointerCapture(e.pointerId);
 pointers.set(e.pointerId,p);
 // Two touch contacts take precedence over selection, moving and placing objects.
 if(pointers.size>=2){
  if(drag?.changed&&['move','rotate','endpoint'].includes(drag.mode))save();
  drag=null;
  if(pointers.size===2){const [a,b]=[...pointers.values()],mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};pinch={dist:Math.max(5,Math.hypot(a.x-b.x,a.y-b.y)),scale:ui.view.scale,anchor:world(mid)}}
  return;
 }
 if(middle){drag={mode:'pan',start:p,initial:{...ui.view},changed:false};canvas.classList.add('panning');return}
 const placing= !['select','pan','equipment'].includes(ui.tool) || ui.tool.startsWith('equip:');
 if(placing){
  // Defer a finger tap until release, so adding a second finger never creates a stray object.
  if(e.pointerType==='touch'){drag={mode:'pending-place',tool:ui.tool,start:p,changed:false};return}
  pointers.delete(e.pointerId);if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);place(ui.tool,w);return;
 }
 const hit=ui.tool==='pan'?null:hitAt(w);
 if(hit&&hit.selection){ui.selection=hit.selection;ui.showInspector=true;checkpoint();const o=stateOf(),angle=deg(Math.atan2(w.y-o.y,w.x-o.x));drag={mode:hit.type==='rotate'?'rotate':hit.type==='endpoint'?'endpoint':'move',start:p,initial:{...o},startAngle:angle,changed:false}}
 else{if(ui.tool!=='pan'){ui.selection=null;ui.showInspector=false}drag={mode:'pan',start:p,initial:{...ui.view},changed:false}}
 if(drag.mode==='pan')canvas.classList.add('panning');
 paint();
}
function onMove(e){
 if(!pointers.has(e.pointerId))return;
 const p=canvasPoint(e);pointers.set(e.pointerId,p);
 if(pointers.size>=2&&pinch){
  const [a,b]=[...pointers.values()],mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
  const scale=clamp(pinch.scale*Math.hypot(a.x-b.x,a.y-b.y)/pinch.dist,.14,4);
  ui.view.scale=scale;ui.view.x=mid.x-pinch.anchor.x*scale;ui.view.y=mid.y-pinch.anchor.y*scale;
  paint();return;
 }
 if(!drag)return;
 const dx=p.x-drag.start.x,dy=p.y-drag.start.y;
 if(Math.abs(dx)+Math.abs(dy)>4)drag.changed=true;
 if(drag.mode==='pending-place')return;
 if(drag.mode==='pan'){ui.view.x=drag.initial.x+dx;ui.view.y=drag.initial.y+dy}
 else{const state=stateOf();if(!state)return;
  if(drag.mode==='move'){const mx=dx/ui.view.scale,my=dy/ui.view.scale;state.x=drag.initial.x+mx;state.y=drag.initial.y+my;if(state.motion){state.motion.endX=drag.initial.motion.endX+mx;state.motion.endY=drag.initial.motion.endY+my}}
  else if(drag.mode==='rotate'){const w=world(p);let angle=drag.initial.rotation+deg(Math.atan2(w.y-state.y,w.x-state.x))-drag.startAngle;if(e.shiftKey)angle=Math.round(angle/15)*15;state.rotation=angle}
  else if(drag.mode==='endpoint'&&state.motion){const w=world(p);state.motion.endX=w.x;state.motion.endY=w.y}
 }
 paint();
}
function onUp(e){
 if(!pointers.has(e.pointerId))return;
 const wasMulti=pinch!==null;
 pointers.delete(e.pointerId);
 if(canvas?.isConnected&&canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
 if(pointers.size<2)pinch=null;
 // Never replace the canvas until the last finger has lifted.
 if(pointers.size>0)return;
 canvas?.classList.remove('panning');
 if(drag?.mode==='pending-place'&&!drag.changed&&e.type!=='pointercancel'&&!wasMulti){const tool=drag.tool,p=world(drag.start);drag=null;place(tool,p);return}
 if(drag?.changed&&['move','rotate','endpoint'].includes(drag.mode))save();
 drag=null;render();
}
function wheel(e){e.preventDefault();const p=canvasPoint(e),old=world(p);ui.view.scale=clamp(ui.view.scale*Math.exp(-e.deltaY*.001),.14,4);ui.view.x=p.x-old.x*ui.view.scale;ui.view.y=p.y-old.y*ui.view.scale;paint()}
function chooseBeat(id){stopPlayback();playback.elapsedMs=0;ui.beatId=id;if(ui.selection&&!stateOf()&&!detailsOf(ui.selection))ui.selection=null;render()}
function addBeat(){stopPlayback();checkpoint();const b=M.nextBeat(scene(),beat());ui.beatId=b.id;save();render()}
function removeSelection(){const sel=ui.selection;if(!sel)return;checkpoint();const s=scene();if(sel.type==='actor'){s.actors=s.actors.filter(x=>x.id!==sel.id);for(const b of s.beats)delete b.positions[sel.id]}
 else if(sel.type==='camera'){s.cameras=s.cameras.filter(x=>x.id!==sel.id);for(const b of s.beats)delete b.cameras[sel.id]}
 else if(sel.type==='equipment'){s.equipment=s.equipment.filter(x=>x.id!==sel.id);for(const b of s.beats)delete b.equipment[sel.id]}
 else if(sel.type==='setobj'){set().objects=set().objects.filter(x=>x.id!==sel.id)}ui.selection=null;ui.showInspector=false;save();render()}
function edit(name,value){const sel=ui.selection,d=detailsOf(sel),o=stateOf(sel),p=project(),loc=set();
 if(name.startsWith('beatVisible:')&&d&&['actor','camera'].includes(sel.type)){
  const target=scene().beats.find(b=>b.id===name.slice('beatVisible:'.length));if(!target)return;
  checkpoint();M.setBeatVisibility(scene(),sel.type,sel.id,target.id,value);save();render();return;
 }
 const exportKeys={exportImageGhosts:'imageGhosts',exportVideoGhosts:'videoGhosts',exportCones:'cones',exportPaths:'paths'};
 if(exportKeys[name]){p.exportPrefs={...exportPrefs(),[exportKeys[name]]:value};save();render();return}

 if(['showCones','showPaths','showCameraMoves'].includes(name)){ui[name]=value;paint();return}if(name==='ghostMode'){ui.ghostMode=value;if(value!=='off')ui.previousGhostMode=value;paint();return}
 checkpoint();if(name==='itemName'){if(sel?.type==='setobj')o.name=value;else if(d)M.rename(p,d.id,value)}
 else if(name==='itemOutline'&&d&&(sel.type==='actor'||sel.type==='camera')){M.setOutline(p,d.id,value)}
 else if(name==='itemColor'&&d){const error=sel.type==='equipment'?(d.color=value,null):M.recolor(p,d.id,value);if(error){notice(error);undo.pop();render();return}}
 else if(name==='setName')loc.name=value;else if(name==='opacity')loc.opacity=Number(value)/100;else if(name==='darken')loc.darken=value;
 else if(name==='lockToSet'&&d){if(value){d.fixedState=M.clone(o||M.defaultEquipmentState());d.lockToSet=true}else{for(const b of scene().beats)b.equipment[d.id]=M.clone(d.fixedState);d.lockToSet=false}}
 else if(name==='motionKind'&&['camera','actor'].includes(sel?.type)&&o){if(value==='static')o.motion=null;else{const angle=rad(o.rotation||0),dist=145;o.motion={kind:value,endX:o.motion?.endX??o.x+dist*Math.cos(angle),endY:o.motion?.endY??o.y+dist*Math.sin(angle),endRotation:o.motion?.endRotation??o.rotation}}}
 else if(['endX','endY','endRotation'].includes(name)&&o?.motion)o.motion[name]=Number(value);
 else if(o&&['x','y','rotation','lens','sensor'].includes(name)){const before={...o};o[name]=Number(value);if(name==='x'&&o.motion)o.motion.endX+=o.x-before.x;if(name==='y'&&o.motion)o.motion.endY+=o.y-before.y}
 else if(name==='visible'&&o)o.visible=value;
 save();setTimeout(render,0)}
function projectAction(type,id){const p=database.projects.find(pr=>pr.id===id);if(!p)return;const action=prompt('Type rename, duplicate, or delete','rename');if(action==='rename'){const name=prompt('Project name',p.name);if(name){p.name=name;save()}}
 else if(action==='duplicate'){const dup=M.clone(p);dup.id=M.uid();dup.name+=' copy';database.projects.push(dup);save()}
 else if(action==='delete'&&confirm(`Delete ${p.name}? Export a backup first.`)){database.projects=database.projects.filter(q=>q.id!==id);save()}render()}

function createScene(name,setId){
 const p=project(),source=beat(),original=scene();if(!p)return;
 checkpoint();
 const sourceBeat=source||original?.beats?.[0]||{positions:{},cameras:{},equipment:{}};
 const newScene={id:M.uid(),name, setId:p.sets.some(s=>s.id===setId)?setId:original?.setId||p.sets[0].id,actors:M.clone(original?.actors||[]),cameras:M.clone(original?.cameras||[]),equipment:M.clone(original?.equipment||[]),beats:[{id:M.uid(),name:'Beat 01',positions:M.clone(sourceBeat.positions||{}),cameras:M.clone(sourceBeat.cameras||{}),equipment:M.clone(sourceBeat.equipment||{})}]};
 p.scenes.push(newScene);ui.sceneId=newScene.id;ui.beatId=newScene.beats[0].id;ui.selection=null;ui.showMenu=false;ui.dialog=null;ui.page='editor';ui.autoFit=true;save();render()
}
function createSet(name){
 const p=project();if(!p)return;checkpoint();const obj={id:M.uid(),name,background:null,opacity:.8,darken:true,objects:[]};
 p.sets.push(obj);ui.showMenu=false;ui.dialog={kind:'edit-set',id:obj.id};save();render()
}
function openEditDialog(kind,id=null){ui.context=null;ui.showMenu=false;ui.dialog={kind,id};render()}
function saveEntityDialog(){
 const d=ui.dialog;if(!d)return;const input=app.querySelector('#entityEditName'),name=input?.value.trim();
 if(!name){notice('Enter a name');input?.focus();return}
 const p=project();
 if(d.kind==='new-project'){const created=M.createProject(name);database.projects.push(created);ui.dialog=null;openProject(created.id);save();return}
 if(d.kind==='new-scene'){const setId=app.querySelector('#entityEditSet')?.value;createScene(name,setId);return}
 if(d.kind==='new-set'){ui.dialog=null;createSet(name);return}
 const item=d.kind==='edit-project'?database.projects.find(x=>x.id===d.id):d.kind==='edit-scene'?p?.scenes.find(x=>x.id===d.id):d.kind==='edit-set'?p?.sets.find(x=>x.id===d.id):null;
 if(!item){ui.dialog=null;render();return}
 checkpoint();item.name=name;
 if(d.kind==='edit-scene'){const setId=app.querySelector('#entityEditSet')?.value;if(p.sets.some(x=>x.id===setId))item.setId=setId}
 if(d.kind==='edit-set'){const opacity=Number(app.querySelector('#entityEditOpacity')?.value);if(Number.isFinite(opacity))item.opacity=clamp(opacity/100,.05,1);item.darken=!!app.querySelector('#entityEditDarken')?.checked}
 ui.dialog=null;save();render();notice('Changes saved')
}

function download(blob,name){const u=URL.createObjectURL(blob),link=document.createElement('a');link.href=u;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(u),30000)}
function exportCanvas(bid,width=1600,height=1050){const c=document.createElement('canvas');c.width=width;c.height=height;draw(c.getContext('2d'),width,height,{beatId:bid,export:true,ghost:exportPrefs().imageGhosts,paths:exportPrefs().paths,cones:exportPrefs().cones});return c}
const pngBlob=c=>new Promise(resolve=>c.toBlob(resolve,'image/png'));
async function waitBackdrop(){const src=set()?.background;if(!src||cached(src))return;await new Promise(resolve=>{const start=Date.now();const t=setInterval(()=>{if(cached(src)||Date.now()-start>3000){clearInterval(t);resolve()}},60)})}
async function savePNG(){await waitBackdrop();const blob=await pngBlob(exportCanvas(ui.beatId));if(blob)download(blob,`${safe(scene().name)}-${safe(beat().name)}.png`);notice('Beat image exported')}
function crc32(a){let c=-1;for(const x of a){c^=x;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xEDB88320:0)}return(c^-1)>>>0}
function zip(files){const encoder=new TextEncoder(),chunks=[],directory=[];let offset=0;const n16=x=>[x&255,(x>>>8)&255],n32=x=>[x&255,(x>>>8)&255,(x>>>16)&255,(x>>>24)&255];for(const f of files){const name=encoder.encode(f.name),bytes=f.data,crc=crc32(bytes),size=bytes.length;const header=new Uint8Array([...n32(0x04034b50),...n16(20),...n16(0),...n16(0),...n16(0),...n16(0),...n32(crc),...n32(size),...n32(size),...n16(name.length),...n16(0)]);chunks.push(header,name,bytes);directory.push(new Uint8Array([...n32(0x02014b50),...n16(20),...n16(20),...n16(0),...n16(0),...n16(0),...n16(0),...n32(crc),...n32(size),...n32(size),...n16(name.length),...n16(0),...n16(0),...n16(0),...n16(0),...n32(0),...n32(offset)]),name);offset+=header.length+name.length+size}const sz=directory.reduce((n,b)=>n+b.length,0),end=new Uint8Array([...n32(0x06054b50),...n16(0),...n16(0),...n16(files.length),...n16(files.length),...n32(sz),...n32(offset),...n16(0)]);return new Blob([...chunks,...directory,end],{type:'application/zip'})}
async function saveZIP(){await waitBackdrop();notice('Preparing PNGs…');const entries=[];for(let i=0;i<scene().beats.length;i++){const b=scene().beats[i],blob=await pngBlob(exportCanvas(b.id));entries.push({name:`${String(i+1).padStart(2,'0')}-${safe(b.name)}.png`,data:new Uint8Array(await blob.arrayBuffer())})}download(zip(entries),`${safe(scene().name)}-beats.zip`);notice(`${entries.length} images exported`)}
async function saveVideo(){if(playback.exporting)return;await waitBackdrop();if(!window.MediaRecorder||!HTMLCanvasElement.prototype.captureStream)return notice('Video export is unavailable on this device');const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(x=>MediaRecorder.isTypeSupported(x));if(!mime)return notice('This device cannot encode WebM video');
 stopPlayback();playback.frame=null;const config=playbackOptions(),beats=M.clone(scene().beats),title=scene().name,projectName=project().name,duration=P.duration(beats,config),c=document.createElement('canvas');c.width=1280;c.height=814;const g=c.getContext('2d'),stream=c.captureStream(30),chunks=[];let rec,failed=false;playback.exporting=true;
 try{rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:3_000_000});const done=new Promise((resolve,reject)=>{rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};rec.onstop=resolve;rec.onerror=reject});rec.start(1000);notice(`Recording ${config.speed}× · ${(duration/1000).toFixed(1)}s · ${config.mode}`);const started=performance.now();while(performance.now()-started<duration){const elapsed=performance.now()-started,frame=P.frameAt(beats,elapsed,config);draw(g,c.width,c.height,{export:true,frame,mode:config.mode,ghost:exportPrefs().videoGhosts,cones:exportPrefs().cones,paths:exportPrefs().paths});await new Promise(requestAnimationFrame)}draw(g,c.width,c.height,{export:true,frame:P.frameAt(beats,duration,config),mode:config.mode,ghost:exportPrefs().videoGhosts,cones:exportPrefs().cones,paths:exportPrefs().paths});await new Promise(resolve=>setTimeout(resolve,150));rec.stop();await done;const blob=new Blob(chunks,{type:mime});if(blob.size===0)throw Error('Encoder created an empty file');download(blob,`${safe(projectName)}-${safe(title)}-animated-${config.speed}x.webm`);notice('Animated WebM exported')}catch(err){failed=true;console.error('Video export failed',err);notice('Video export failed: '+(err.message||'Unknown error'))}finally{if(rec?.state==='recording')rec.stop();stream.getTracks().forEach(t=>t.stop());playback.exporting=false;if(!failed)paint()}}

function backup(){download(new Blob([JSON.stringify({format:'blockascene',version:2,project:project()},null,2)],{type:'application/json'}),`${safe(project().name)}.blockascene`);notice('Project backup exported')}
async function importProject(file){try{const raw=JSON.parse(await file.text()),p=M.migrate(raw.project||raw);if(database.projects.some(x=>x.id===p.id))p.id=M.uid();database.projects.push(p);openProject(p.id);save();notice('Project imported')}catch(e){notice('Import failed: '+e.message)}}
async function importBackground(file){if(!file)return;if(!['image/png','image/jpeg','image/webp'].includes(file.type))return notice('Use PNG, JPG, or WebP');if(file.size>12e6)return notice('Choose an image under 12 MB');const reader=new FileReader();reader.onload=()=>{const target=ui.dialog?.kind==='edit-set'?project()?.sets.find(x=>x.id===ui.dialog.id):set();if(!target)return;checkpoint();target.background=reader.result;target.opacity=.8;target.darken=true;images.clear();if(ui.dialog?.kind!=='edit-set'){ui.selection={type:'background'};ui.showInspector=true}save();render();notice('Floor plan imported')};reader.readAsDataURL(file)}
async function action(e){const target=e.target.closest('[data-action]');if(!target)return;e.preventDefault();e.stopPropagation();const a=target.dataset.action,id=target.dataset.id;if(a==='open-manual'){stopPlayback();ui.manualReturn=ui.page;ui.page='manual';ui.manualTab='start';ui.manualScroll={};ui.showMenu=false;ui.showLayers=false;ui.showExportPanel=false;render();return}if(a==='close-manual'){ui.page=ui.manualReturn||'workspace';render();return}if(a==='manual-tab'){const el=app.querySelector('.manual-content');if(el)ui.manualScroll[ui.manualTab]=el.scrollTop;ui.manualTab=target.dataset.tab||'start';render();return}if(a==='toggle-playback'){togglePlayback();return}if(playback.playing){playback.elapsedMs=elapsedPlayback();stopPlayback();}
 if(a==='new-project'){openEditDialog('new-project')}
 else if(a==='open-project')openProject(id);else if(a==='home')home();else if(a==='all-scenes'){stopPlayback();ui.page='project';ui.showMenu=false;render()}else if(a==='choose-scene')openScene(id);else if(a==='open-context'){const rect=target.getBoundingClientRect();openContext(target.dataset.kind,id,rect.right-210,rect.bottom+4)}else if(a==='close-context'){ui.context=null;render()}else if(a==='context-action'){const c=ui.context;ui.context=null;if(c){if(c.kind==='beat')beatCommand(c.id,target.dataset.command);else manageItem(c.kind,c.id,target.dataset.command)}}
 else if(a==='toggle-menu'){ui.showMenu=!ui.showMenu;render()}else if(a==='toggle-editor-ghosts'){if(ui.ghostMode==='off')ui.ghostMode=ui.previousGhostMode||'adjacent';else{ui.previousGhostMode=ui.ghostMode;ui.ghostMode='off'}render()}else if(a==='toggle-layers'){ui.showLayers=!ui.showLayers;ui.showExportPanel=false;if(ui.showLayers&&window.innerWidth<850)ui.showInspector=false;render()}else if(a==='toggle-inspector'){if(!ui.selection)ui.selection={type:'background'};ui.showInspector=!ui.showInspector;if(ui.showInspector&&window.innerWidth<850)ui.showLayers=false;render()}else if(a==='toggle-pin'){const key=target.dataset.panel==='layers'?'layersPinned':'propertiesPinned';ui.layout[key]=!ui.layout[key];saveLayout();render()}else if(a==='switch-panel-side'){const p=target.dataset.panel==='layers'?'layers':'properties';ui.layout[p+'Side']=ui.layout[p+'Side']==='left'?'right':'left';ui.layout[p+'FloatX']=null;ui.layout[p+'FloatY']=null;saveLayout();render()}else if(a==='reset-layout'){ui.layout=defaultLayout();saveLayout();render()}else if(a==='toggle-timeline'){ui.layout.timelineCollapsed=!ui.layout.timelineCollapsed;saveLayout();render()}else if(a==='toggle-export-panel'){ui.showExportPanel=!ui.showExportPanel;ui.showLayers=false;render()}else if(a==='close-inspector'){ui.showInspector=false;render()}else if(a==='close-dialog'){ui.dialog=null;ui.videoDraft=null;render()}else if(a==='save-entity-dialog'){saveEntityDialog()}else if(a==='replace-set-background'){fileInput.click()}else if(a==='clear-set-background'){const st=project()?.sets.find(s=>s.id===ui.dialog?.id);if(st){checkpoint();st.background=null;images.clear();save();render();notice('Floor plan image removed')}}else if(a==='reset-beat-duration'){const b=scene()?.beats.find(x=>x.id===ui.dialog?.id);if(b){checkpoint();delete b.holdMs;ui.dialog=null;save();render()}}else if(a==='save-beat-dialog'){const b=scene()?.beats.find(x=>x.id===ui.dialog?.id);if(b){const name=app.querySelector('#beatEditName').value.trim(),secs=Number(app.querySelector('#beatEditHold').value);if(!name||!Number.isFinite(secs)||secs<.5||secs>30)return notice('Enter a name and duration between 0.5 and 30 seconds');checkpoint();b.name=name;b.holdMs=Math.round(secs*1000);ui.dialog=null;save();render()}}
 else if(a==='undo')undoAction();else if(a==='redo')redoAction();else if(a==='tool'){ui.tool=target.dataset.tool||'select';render()}else if(a==='toggle-equipment'){ui.tool=ui.tool==='equipment'?'select':'equipment';render()}else if(a==='place-equipment'){ui.tool='equip:'+target.dataset.shape;render()}
 else if(a==='choose-set'){checkpoint();scene().setId=id;ui.showMenu=false;ui.selection=null;save();render()}
 else if(a==='new-scene')openEditDialog('new-scene');else if(a==='new-set')openEditDialog('new-set');else if(a==='choose-beat')chooseBeat(id);else if(a==='add-beat')addBeat();
 else if(a==='previous-beat'||a==='next-beat'){const list=scene().beats,idx=list.findIndex(b=>b.id===ui.beatId),step=a==='next-beat'?1:-1;chooseBeat(list[clamp(idx+step,0,list.length-1)].id)}
 else if(a==='select-object'){ui.selection={type:target.dataset.kind,id};ui.showLayers=false;ui.showExportPanel=false;ui.showInspector=true;render()}
 else if(a==='rename-beat'){ui.dialog={kind:'edit-beat',id:ui.beatId};render()}
 else if(a==='delete-beat'){if(scene().beats.length===1)return notice('A scene needs at least one beat');if(confirm('Delete this beat?')){checkpoint();const list=scene().beats,i=list.findIndex(b=>b.id===ui.beatId);list.splice(i,1);ui.beatId=list[Math.max(0,i-1)].id;ui.selection=null;save();render()}}
 else if(a==='quick-color'){edit('itemColor',target.dataset.color)}else if(a==='delete-selection')removeSelection();
 else if(a==='import-bg')fileInput.click();else if(a==='import-project')projectInput.click();else if(a==='select-bg'){ui.selection={type:'background'};ui.showInspector=true;ui.showMenu=false;render()}
 else if(a==='clear-bg'){checkpoint();set().background=null;images.clear();save();render()}else if(a==='export-image')await savePNG();else if(a==='export-zip')await saveZIP();else if(a==='export-video-dialog'){ui.showExportPanel=false;ui.videoDraft={...playbackOptions()};ui.dialog={kind:'video'};render()}else if(a==='confirm-video-export'){const c=ui.videoDraft||playbackOptions();project().playback=P.settings({...playbackOptions(),speed:Number(c.speed),holdMs:Number(c.holdMs),mode:c.mode});ui.videoDraft=null;ui.dialog=null;save();render();await saveVideo()}else if(a==='export-video')await saveVideo();else if(a==='save-project'){clearTimeout(saveTimer);await writeDB();notice('Project saved locally')}else if(a==='backup')backup()}
app.addEventListener('click',action);
app.addEventListener('scroll',e=>{if(ui.page==='manual'&&e.target?.classList?.contains('manual-content'))ui.manualScroll[ui.manualTab]=e.target.scrollTop},true);
let panelPointer=null;
function panelBounds(root,el){
 const stage=root.querySelector('#canvasWrap'),rootRect=root.getBoundingClientRect();
 const area=stage?.getBoundingClientRect()||rootRect;
 return {rootRect,left:area.left-rootRect.left+8,top:area.top-rootRect.top+8,right:area.right-rootRect.left-8,bottom:area.bottom-rootRect.top-8};
}
app.addEventListener('pointerdown',e=>{
 const grip=e.target.closest('[data-resize-panel]'),handle=grip?null:e.target.closest('[data-drag-panel]');
 if(!grip&&!handle)return;
 if(e.pointerType==='mouse'&&e.button!==0)return;
 if(handle&&e.target.closest('button,input,select,a,[data-action]'))return;
 const trigger=grip||handle,panel=grip?.dataset.resizePanel||handle.dataset.dragPanel,el=trigger.closest('[data-panel]');
 if(!el)return;
 const root=el.closest('.work-canvas'),rect=el.getBoundingClientRect(),bounds=panelBounds(root,el);
 const pinned=el.classList.contains('docked'),side=el.dataset.side||'right';
 if(handle&&pinned)return;
 e.preventDefault();
 if(!pinned){
  // Freeze computed position before moving or sizing so the box never jumps.
  const left=rect.left-bounds.rootRect.left,top=rect.top-bounds.rootRect.top;
  el.style.left=left+'px';el.style.top=top+'px';el.style.right='auto';el.style.bottom='auto';
  el.dataset.moved='true';
  ui.layout[panel+'FloatX']=Math.round(left);ui.layout[panel+'FloatY']=Math.round(top);
 }
 panelPointer={pointerId:e.pointerId,panel,mode:grip?'resize':'move',pinned,side,el,root,
  startX:e.clientX,startY:e.clientY,startWidth:rect.width,startHeight:rect.height,
  startLeft:rect.left-bounds.rootRect.left,startTop:rect.top-bounds.rootRect.top,
  startStageWidth:root.querySelector('#canvasWrap')?.getBoundingClientRect().width||350};
 try{trigger.setPointerCapture(e.pointerId)}catch{}
});
app.addEventListener('pointermove',e=>{
 const d=panelPointer;if(!d||d.pointerId!==e.pointerId)return;
 e.preventDefault();
 const bounds=panelBounds(d.root,d.el),dx=e.clientX-d.startX,dy=e.clientY-d.startY;
 if(d.mode==='move'){
  const width=d.el.getBoundingClientRect().width,height=d.el.getBoundingClientRect().height;
  const left=clamp(d.startLeft+dx,bounds.left,Math.max(bounds.left,bounds.right-width));
  const top=clamp(d.startTop+dy,bounds.top,Math.max(bounds.top,bounds.bottom-Math.min(height,48)));
  d.el.style.left=left+'px';d.el.style.top=top+'px';
  ui.layout[d.panel+'FloatX']=Math.round(left);ui.layout[d.panel+'FloatY']=Math.round(top);
 }else{
  const maxWidth=d.pinned?Math.min(470,Math.max(220,d.startWidth+d.startStageWidth-240)):
   Math.min(470,Math.max(220,bounds.right-d.startLeft));
  const delta=d.pinned?(d.side==='left'?dx:-dx):dx;
  const width=clamp(d.startWidth+delta,220,maxWidth);
  d.el.style.width=width+'px';ui.layout[d.panel+'Width']=Math.round(width);
  if(d.pinned){
   d.root.style.setProperty(d.panel==='layers'?'--b4-layers-width':'--b4-properties-width',Math.round(width)+'px');
   paint();
  }else{
   const height=clamp(d.startHeight+dy,230,Math.max(230,bounds.bottom-d.startTop));
   d.el.style.height=height+'px';ui.layout[d.panel+'FloatHeight']=Math.round(height);
  }
 }
});
function endPanelPointer(e){
 if(panelPointer&&e.pointerId===panelPointer.pointerId){
  panelPointer=null;saveLayout();
 }
}
app.addEventListener('pointerup',endPanelPointer);
app.addEventListener('pointercancel',endPanelPointer);
app.addEventListener('contextmenu',e=>{const t=e.target.closest('[data-context-kind]');if(!t)return;e.preventDefault();openContext(t.dataset.contextKind,t.dataset.id,e.clientX,e.clientY)});
let holdTimer=null,holdStart=null;
app.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')return;const t=e.target.closest('[data-context-kind]');if(!t)return;holdStart={x:e.clientX,y:e.clientY};clearTimeout(holdTimer);holdTimer=setTimeout(()=>{holdTimer=null;openContext(t.dataset.contextKind,t.dataset.id,e.clientX,e.clientY)},570)});
app.addEventListener('pointermove',e=>{if(holdStart&&Math.hypot(e.clientX-holdStart.x,e.clientY-holdStart.y)>12)clearTimeout(holdTimer)});
app.addEventListener('pointerup',()=>{clearTimeout(holdTimer);holdStart=null});
app.addEventListener('pointercancel',()=>{clearTimeout(holdTimer);holdStart=null});
app.addEventListener('change',e=>{if(e.target.name){const v=e.target.type==='checkbox'?e.target.checked:e.target.value;if(e.target.name==='playbackSpeed')return setPlaybackOption('speed',v);if(e.target.name==='playbackHold')return setPlaybackOption('holdMs',v);if(e.target.name==='playbackMode')return setPlaybackOption('mode',v);if(['videoSpeed','videoHold','videoMode'].includes(e.target.name)){ui.videoDraft={...(ui.videoDraft||playbackOptions()),[e.target.name==='videoSpeed'?'speed':e.target.name==='videoHold'?'holdMs':'mode']:e.target.name==='videoMode'?v:Number(v)};return}edit(e.target.name,v)}});
app.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('.project-tile[data-id]'))openProject(e.target.dataset.id);else if(e.key==='Enter'&&e.target.id==='entityEditName'){e.preventDefault();saveEntityDialog()}});
window.addEventListener('keydown',e=>{if(ui.page==='manual'){if(e.key==='Escape'){ui.page=ui.manualReturn||'workspace';render()}return}if(e.target.closest?.('input,select,textarea'))return;if(e.code==='Space'&&scene()){e.preventDefault();togglePlayback();return}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redoAction():undoAction()}else if(['Delete','Backspace'].includes(e.key)&&ui.selection&&ui.selection.type!=='background'){e.preventDefault();removeSelection()}else if(e.key==='Escape'){ui.selection=null;ui.showInspector=false;ui.tool='select';render()}else if(e.key==='ArrowRight'&&scene()){const i=scene().beats.findIndex(b=>b.id===ui.beatId);chooseBeat(scene().beats[Math.min(scene().beats.length-1,i+1)].id)}else if(e.key==='ArrowLeft'&&scene()){const i=scene().beats.findIndex(b=>b.id===ui.beatId);chooseBeat(scene().beats[Math.max(0,i-1)].id)}});
fileInput.addEventListener('change',async()=>{if(fileInput.files[0])await importBackground(fileInput.files[0]);fileInput.value=''});
projectInput.addEventListener('change',async()=>{if(projectInput.files[0])await importProject(projectInput.files[0]);projectInput.value=''});
window.addEventListener('resize',()=>{if(canvas?.isConnected){fitView();paint()}});
function finishSplash(){const splash=document.getElementById('startupSplash');if(!splash)return;setTimeout(()=>{splash.classList.add('dismissed');splash.addEventListener('transitionend',()=>splash.remove(),{once:true})},Math.max(0,1750-(performance.now()-splashStarted)))}
(async()=>{try{const layout=JSON.parse(localStorage.getItem('Block4Film-v11-layout')||'null');if(layout&&typeof layout==='object')ui.layout={...ui.layout,...layout}}catch{}const saved=await loadDB();if(saved?.projects&&Array.isArray(saved.projects)){const migrated=[];for(const p of saved.projects){try{migrated.push(M.migrate(p))}catch(e){console.error('Project migration failed; original saved copy preserved.',e)}}if(migrated.length===saved.projects.length){database={version:2,projects:migrated};await writeDB()}else{database={version:2,projects:[M.createProject('Demo Film')]};notice('Could not upgrade all projects. Export your old backups.')}}else{database.projects=[M.createProject('Demo Film')];await writeDB()}render();finishSplash()})();
})();

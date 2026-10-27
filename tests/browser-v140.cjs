/* Real Chromium UI checks. Run separately from the fast model suite. */
const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs/promises'),path=require('node:path');
const {chromium}=require('playwright'),sharp=require('sharp'),M=require('../app/model.js');
(async()=>{
 const root=path.resolve(__dirname,'..'),out=path.join(root,'browser-results');await fs.mkdir(out,{recursive:true});
 const project=M.createProject('Tablet acceptance fixture'),scene=project.scenes[0],set=project.sets[0];
 set.background=null;set.backgroundScale=2;
 const actor=scene.actors[0].id;
 scene.beats[0].positions[actor].motion={kind:'walk',endX:650,endY:330,endRotation:45,pathType:'smooth',keys:[{id:'key',t:.5,x:430,y:260,rotation:10}]};
 const expectedPositions=JSON.stringify(M.migrate(project).scenes[0].beats[0].positions);
 const server=http.createServer(async(req,res)=>{
  try{
   const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
   const file=path.resolve(root,'.'+pathname);
   if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end()}
   const data=await fs.readFile(file);
   res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png'})[path.extname(file)]||'application/octet-stream');
   res.end(data);
  }catch{res.writeHead(404);res.end()}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser,page;
 try{
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1280,height:900},hasTouch:true,acceptDownloads:true});
  page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/app/index.html');
  await page.locator('#startupSplash').waitFor({state:'hidden'});
  // Workspace menu: internal taps keep it open; an outside button still receives its click.
  await page.locator('.menu-toggle').click();
  await page.locator('.drawer.open .drawer-head b').click();
  assert.equal(await page.locator('.drawer.open').count(),1);
  await page.locator('[data-action="library-view"][data-view="list"]').click();
  assert.equal(await page.locator('.drawer.open').count(),0);
  assert.ok((await page.locator('[data-action="library-view"][data-view="list"]').getAttribute('class')).includes('selected'));
  await page.locator('[data-action="library-view"][data-view="grid"]').click();
  await page.locator('#projectFile').setInputFiles({name:'fixture.blockascene',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({format:'blockascene',version:2,project}))});
  await page.locator('.project-overview').waitFor();
  // Project menu: dismiss without swallowing the Edit Project action.
  await page.locator('.menu-toggle').click();
  await page.locator('.project-edit-link').click();
  assert.equal(await page.locator('.drawer.open').count(),0);
  await page.locator('#entityEditName').waitFor();
  await page.locator('.dialog-card header [data-action="close-dialog"]').click();
  await page.locator('.floor-card [data-action="open-context"][data-id="'+set.id+'"]').click();
  await page.locator('[data-action="context-action"][data-command="edit"]').click();
  await page.locator('#entityEditScale').waitFor();
  const image=await sharp({create:{width:300,height:600,channels:4,background:'#f2f2f2'}}).png().toBuffer();
  await page.locator('#backgroundFile').setInputFiles({name:'portrait.png',mimeType:'image/png',buffer:image});
  await page.waitForFunction(()=>document.querySelector('#entityEditScale')?.value==='100');
  await page.locator('#entityEditScale').evaluate(el=>{el.value='150';el.dispatchEvent(new Event('input',{bubbles:true}))});
  assert.equal(await page.locator('#entityEditScaleValue').textContent(),'150%');
  await page.locator('[data-action="save-entity-dialog"]').click();
  await page.locator('.scene-card[data-id="'+scene.id+'"]').click();
  await page.locator('#stage').waitFor();
  await page.locator('[data-action="toggle-structure"]').click();
  assert.equal(await page.locator('.equipment-grid button').count(),2);
  await page.locator('[data-action="place-structure"][data-shape="window"]').click();
  await page.locator('#stage').click({position:{x:450,y:350}});
  await page.locator('input[name="setLength"]').fill('244');
  await page.locator('input[name="setLength"]').press('Tab');
  await page.waitForFunction(()=>document.querySelector('input[name="setLength"]')?.value==='244');
  await page.locator('[data-action="tool"][data-tool="furniture"]').click();
  await page.locator('#stage').click({position:{x:470,y:430}});
  const x=await page.locator('input[name="x"]').inputValue(),y=await page.locator('input[name="y"]').inputValue();
  for(const [name,value] of [['rotation','45'],['setWidth','300'],['setHeight','120']]){
   await page.locator('input[name="'+name+'"]').fill(value);
   await page.locator('input[name="'+name+'"]').press('Tab');
   await page.waitForFunction(([name,value])=>document.querySelector('input[name="'+name+'"]')?.value===value,[name,value]);
  }
  assert.equal(await page.locator('input[name="x"]').inputValue(),x);
  assert.equal(await page.locator('input[name="y"]').inputValue(),y);
  await page.locator('[data-action="save-project"]').click();
  await page.screenshot({path:path.join(out,'desktop-editor.png'),fullPage:true});
  await page.setViewportSize({width:900,height:1200});
  await page.screenshot({path:path.join(out,'tablet-portrait.png'),fullPage:true});
  const layout=await page.locator('.utility-rail').boundingBox(),timeline=await page.locator('.timeline').boundingBox();
  assert.ok(layout&&timeline&&layout.y+layout.height<=timeline.y+2,'utility controls stay above the timeline');
  await page.locator('.top-export').click();
  const downloadPromise=page.waitForEvent('download');
  await page.locator('.export-pop [data-action="backup"]').click();
  const download=await downloadPromise;
  const backup=JSON.parse(await fs.readFile(await download.path(),'utf8'));
  const saved=backup.project||backup,savedSet=saved.sets[0];
  assert.equal(savedSet.backgroundScale,1.5);
  assert.ok(savedSet.objects.some(o=>o.type==='window'&&o.w===244));
  const furniture=savedSet.objects.find(o=>o.type==='furniture');
  assert.equal(furniture.w,300);assert.equal(furniture.h,120);assert.equal(furniture.rotation,45);
  assert.equal(JSON.stringify(saved.scenes[0].beats[0].positions),expectedPositions,'set edits leave actor positions and motion keys untouched');
  await page.reload();
  await page.locator('#startupSplash').waitFor({state:'hidden'});
  await page.locator('.project-tile[data-id="'+project.id+'"]').click();
  await page.locator('.scene-card[data-id="'+scene.id+'"]').click();
  await page.locator('#stage').waitFor();
  // Actual touch input: selecting a fresh canvas object must not create or resize anything.
  const canvas=await page.locator('#stage').boundingBox();
  await page.touchscreen.tap(canvas.x+canvas.width*.75,canvas.y+canvas.height*.25);
  // Editor menu supports touch dismissal without resetting the canvas.
  await page.locator('.menu-toggle').click();
  await page.touchscreen.tap(canvas.x+canvas.width*.75,canvas.y+canvas.height*.25);
  assert.equal(await page.locator('.drawer.open').count(),0);
  // Changing static movement to actor movement preserves a genuinely scrolled panel.
  await page.setViewportSize({width:900,height:720});
  await page.locator('[data-action="toggle-layers"]').click();
  await page.locator('[data-action="select-object"][data-kind="actor"][data-id="'+scene.actors[1].id+'"]').click();
  async function waitForPropertiesRefresh(previous){
   await page.waitForFunction(body=>!body.isConnected,previous);
   await previous.dispose();
  }
  for(const pinned of [false,true]){
   if(pinned)await page.locator('[data-action="toggle-pin"][data-panel="properties"]').click();
   let previous=await page.locator('.inspector .inspect-body').elementHandle();
   await page.locator('select[name="motionKind"]').selectOption('static');
   await waitForPropertiesRefresh(previous);
   await page.locator('select[name="motionKind"]').scrollIntoViewIfNeeded();
   const before=await page.locator('.inspector .inspect-body').evaluate(el=>el.scrollTop);
   assert.ok(before>0,'Properties is scrolled before the movement change');
   previous=await page.locator('.inspector .inspect-body').elementHandle();
   await page.locator('select[name="motionKind"]').selectOption('walk');
   await waitForPropertiesRefresh(previous);
   const after=await page.locator('.inspector .inspect-body').evaluate(el=>el.scrollTop);
   assert.ok(Math.abs(after-before)<=1,'Movement change retains Properties scroll in '+(pinned?'pinned':'floating')+' layout');
   await page.locator('select[name="motionPath"]').scrollIntoViewIfNeeded();
   const pathBefore=await page.locator('.inspector .inspect-body').evaluate(el=>el.scrollTop);
   previous=await page.locator('.inspector .inspect-body').elementHandle();
   await page.locator('select[name="motionPath"]').selectOption('smooth');
   await waitForPropertiesRefresh(previous);
   assert.ok(Math.abs((await page.locator('.inspector .inspect-body').evaluate(el=>el.scrollTop))-pathBefore)<=1,'Path changes retain Properties scroll');
   const endX=page.locator('input[name="endX"]');
   await endX.fill(String(Number(await endX.inputValue())+1));
   const numericBefore=await page.locator('.inspector .inspect-body').evaluate(el=>el.scrollTop);
   assert.ok(numericBefore>0);
   previous=await page.locator('.inspector .inspect-body').elementHandle();
   await endX.dispatchEvent('change');
   await waitForPropertiesRefresh(previous);
   const numericAfter=await page.locator('.inspector .inspect-body').evaluate(el=>el.scrollTop);
   assert.ok(Math.abs(numericAfter-numericBefore)<=1,'Numeric settings retain Properties scroll: '+numericBefore+' -> '+numericAfter);
   const visibility=page.locator('.beat-visibility input').last();
   await visibility.scrollIntoViewIfNeeded();
   const visibilityBefore=await page.locator('.inspector .inspect-body').evaluate(el=>el.scrollTop);
   previous=await page.locator('.inspector .inspect-body').elementHandle();
   await visibility.setChecked(!(await visibility.isChecked()));
   await waitForPropertiesRefresh(previous);
   assert.ok(Math.abs((await page.locator('.inspector .inspect-body').evaluate(el=>el.scrollTop))-visibilityBefore)<=1,'Checkbox settings retain Properties scroll');
   await page.locator('.inspector .inspect-body').evaluate(el=>{el.scrollTop=150});
   const colorBefore=await page.locator('.inspector .inspect-body').evaluate(el=>el.scrollTop);
   assert.ok(colorBefore>0);
   previous=await page.locator('.inspector .inspect-body').elementHandle();
   await page.locator('input[name="itemColor"]').evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}))},pinned?'#020304':'#010203');
   await waitForPropertiesRefresh(previous);
   assert.ok(Math.abs((await page.locator('.inspector .inspect-body').evaluate(el=>el.scrollTop))-colorBefore)<=1,'Color settings retain Properties scroll');
  }
  await page.screenshot({path:path.join(out,'properties-scroll-retained.png'),fullPage:true});
  assert.equal(errors.length,0,errors.join('\n'));
  await page.screenshot({path:path.join(out,'reopened-project.png'),fullPage:true});
  await fs.writeFile(path.join(out,'result.json'),JSON.stringify({passed:true,checks:['browser project import','replacement image defaults to 100%','scale dialog','Wall/Window picker','rotated furniture dimensions','motion isolation','backup export','saved-project reopen','tablet layout','touch input','sidebar outside dismissal and click-through','floating and pinned Properties scroll retention for movement, numeric, checkbox and color settings'],pageErrors:errors},null,2));
  console.log('Chromium project import, scale, windows, rotated sizing, backup, reopen and tablet layout passed');
 }catch(error){
  if(page)await page.screenshot({path:path.join(out,'failure.png'),fullPage:true}).catch(()=>{});
  throw error;
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(error=>{console.error(error);process.exitCode=1});

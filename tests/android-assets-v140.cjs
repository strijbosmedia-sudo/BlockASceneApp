const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
(async()=>{
 const root=path.resolve(__dirname,'..'),res=path.join(root,'android/app/src/main/res');
 for(const [density,size] of Object.entries({mdpi:48,hdpi:72,xhdpi:96,xxhdpi:144,xxxhdpi:192})){
  const folder=path.join(res,'mipmap-'+density),legacy=await sharp(path.join(folder,'ic_launcher.png')).metadata();
  assert.equal(legacy.width,size);assert.equal(legacy.height,size);
  const foreground=sharp(path.join(folder,'ic_launcher_foreground.png'));
  const meta=await foreground.metadata();
  assert.equal(meta.width,size*108/48);assert.equal(meta.height,size*108/48);
  const {data,info}=await foreground.ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const border=Math.floor((meta.width-size*66/48)/2);
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
   if(x<border||y<border||x>=info.width-border||y>=info.height-border)assert.equal(data[(y*info.width+x)*4+3],0,'adaptive foreground has transparent safe-area padding');
  }
 }
 for(const name of ['ic_launcher.xml','ic_launcher_round.xml']){
  const xml=fs.readFileSync(path.join(res,'mipmap-anydpi-v26',name),'utf8');
  assert.match(xml,/@mipmap\/ic_launcher_foreground/);assert.match(xml,/block4film_launcher_background/);
 }
 const gradle=fs.readFileSync(path.join(root,'android/app/build.gradle'),'utf8');
 const pkg=require('../package.json'),{versionCode}=require('../scripts/configure-android.cjs');
 assert.ok(gradle.includes('versionCode '+versionCode(pkg.version)));assert.ok(gradle.includes('versionName "'+pkg.version+'"'));
 console.log('Android generated launcher densities, adaptive safe-area pixels and native versions passed');
})().catch(error=>{console.error(error);process.exitCode=1});

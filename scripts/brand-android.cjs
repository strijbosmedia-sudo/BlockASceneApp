/* Replace the default Capacitor Android icons with the Block4Film mark.
   Crop inward to remove the original white outer frame, then emit both
   legacy and adaptive launcher resources for all densities. */
const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
async function main(){
 const root=path.resolve(__dirname,'..'),res=path.join(root,'android','app','src','main','res');
 if(!fs.existsSync(res))throw Error('Generate Android platform before Android icon setup');
 const raw=fs.readFileSync(path.join(root,'app','assets','Block4Film-Icon.svg'),'utf8');
 if(!raw.includes('viewBox="0 0 376 396"'))throw Error('Block4Film SVG dimensions changed');
 const cropped=Buffer.from(raw.replace('viewBox="0 0 376 396"','viewBox="47 50 282 287"'));
 const bg='#101114';
 const pixels=async(size,transparent)=>{
  const logo=await sharp(cropped,{density:288}).resize(size,size,{fit:'contain'}).png().toBuffer();
  if(transparent)return logo;
  return sharp({create:{width:size,height:size,channels:4,background:bg}})
   .composite([{input:logo,gravity:'centre'}]).png().toBuffer();
 };
 const map={mdpi:48,hdpi:72,xhdpi:96,xxhdpi:144,xxxhdpi:192};
 for(const [density,size] of Object.entries(map)){
  const folder=path.join(res,'mipmap-'+density);fs.mkdirSync(folder,{recursive:true});
  const legacy=await pixels(size,false),foreground=await pixels(size*108/48,true);
  fs.writeFileSync(path.join(folder,'ic_launcher.png'),legacy);
  fs.writeFileSync(path.join(folder,'ic_launcher_round.png'),legacy);
  fs.writeFileSync(path.join(folder,'ic_launcher_foreground.png'),foreground);
 }
 const adaptive=path.join(res,'mipmap-anydpi-v26');fs.mkdirSync(adaptive,{recursive:true});
 const xml='<?xml version="1.0" encoding="utf-8"?>\n'
  +'<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
  +'  <background android:drawable="@color/block4film_launcher_background"/>\n'
  +'  <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n'
  +'</adaptive-icon>\n';
 for(const name of ['ic_launcher.xml','ic_launcher_round.xml'])fs.writeFileSync(path.join(adaptive,name),xml);
 const values=path.join(res,'values');fs.mkdirSync(values,{recursive:true});
 fs.writeFileSync(path.join(values,'block4film_launcher_background.xml'),
  '<?xml version="1.0" encoding="utf-8"?>\n<resources><color name="block4film_launcher_background">'+bg+'</color></resources>\n');
 console.log('Created cropped Block4Film legacy/adaptive Android launcher icons');
}
main().catch(err=>{console.error(err);process.exitCode=1});

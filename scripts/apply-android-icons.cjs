/* Create Android launcher icons from the provided Block4Film SVG. */
const path=require('node:path'),fs=require('node:fs/promises'),sharp=require('sharp');
(async()=>{
 const root=path.join(__dirname,'..'),src=path.join(root,'app','assets','Block4Film-Icon.svg');
 const res=path.join(root,'android','app','src','main','res');
 for(const [density,size] of Object.entries({mdpi:48,hdpi:72,xhdpi:96,xxhdpi:144,xxxhdpi:192})){
  const out=path.join(res,'mipmap-'+density);await fs.mkdir(out,{recursive:true});
  const bytes=await sharp(src).resize(size,size,{fit:'contain',background:'#08090b'}).png().toBuffer();
  for(const name of ['ic_launcher.png','ic_launcher_round.png'])await fs.writeFile(path.join(out,name),bytes);
 }
 const dir=path.join(res,'drawable-nodpi');await fs.mkdir(dir,{recursive:true});
 await sharp(src).resize(320,320,{fit:'contain'}).extend({top:56,bottom:56,left:56,right:56,background:'#08090b'}).png().toFile(path.join(dir,'block4film_foreground.png'));
 const anydpi=path.join(res,'mipmap-anydpi-v26');await fs.mkdir(anydpi,{recursive:true});
 const xml='<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n  <background android:drawable="@android:color/black"/>\n  <foreground android:drawable="@drawable/block4film_foreground"/>\n</adaptive-icon>\n';
 for(const name of ['ic_launcher.xml','ic_launcher_round.xml'])await fs.writeFile(path.join(anydpi,name),xml);
 console.log('Android icons created');
})().catch(e=>{console.error(e);process.exitCode=1});

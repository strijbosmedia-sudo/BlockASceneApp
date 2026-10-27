/* Generate the .icns needed for macOS from our existing SVG branding. */
const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp'),cp=require('node:child_process');
async function main(){
 if(process.platform!=='darwin')throw Error('Mac icon generation requires macOS');
 const svg=path.resolve(__dirname,'../app/assets/Block4Film-Icon.svg');
 const assets=path.resolve(__dirname,'../app/assets'),iconset=path.join(assets,'Block4Film.iconset');
 fs.rmSync(iconset,{recursive:true,force:true});fs.mkdirSync(iconset,{recursive:true});
 for(const size of [16,32,128,256,512]){
  for(const scale of [1,2]){
   await sharp(svg).resize(size*scale,size*scale).png().toFile(path.join(iconset,'icon_'+size+'x'+size+(scale===2?'@2x':'')+'.png'));
  }
 }
 cp.execFileSync('iconutil',['-c','icns',iconset,'-o',path.join(assets,'Block4Film.icns')]);
 fs.rmSync(iconset,{recursive:true,force:true});
}
main().catch(e=>{console.error(e);process.exitCode=1});

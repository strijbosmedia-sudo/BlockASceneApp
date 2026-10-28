/* Reapply version and release-signing configuration to regenerated Capacitor projects. */
const fs=require('node:fs'),path=require('node:path');
function versionCode(version){
 const parts=String(version).match(/^(\d+)\.(\d+)\.(\d+)$/);
 if(!parts)throw Error('Android requires a numeric major.minor.patch version');
 const [major,minor,patch]=parts.slice(1).map(Number);
 if(minor>99||patch>99)throw Error('Android minor and patch versions must be below 100');
 const code=major*10000+minor*100+patch;
 if(!Number.isSafeInteger(code)||code<1||code>2100000000)throw Error('Android versionCode is out of range');
 return code;
}
function configure(root=path.resolve(__dirname,'..')){
 const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
 const config=JSON.parse(fs.readFileSync(path.join(root,'capacitor.config.json'),'utf8'));
 if(config.appId!=='media.strijbos.block4film')throw Error('Android application identity changed');
 const app=path.join(root,'android','app'),file=path.join(app,'build.gradle');
 let source=fs.readFileSync(file,'utf8');
 if(!/\bversionCode\s+\d+/.test(source)||!/\bversionName\s+["'][^"']+["']/.test(source))throw Error('Unexpected generated Android version configuration');
 source=source.replace(/\bversionCode\s+\d+/,'versionCode '+versionCode(pkg.version))
  .replace(/\bversionName\s+["'][^"']+["']/,'versionName "'+pkg.version+'"');
 const apply="apply from: 'block4film-release.gradle'";
 if(!source.includes(apply))source+='\n'+apply+'\n';
 fs.writeFileSync(file,source);
 fs.copyFileSync(path.join(root,'mobile','android-release.gradle'),path.join(app,'block4film-release.gradle'));
 return {versionName:pkg.version,versionCode:versionCode(pkg.version)};
}
if(require.main===module)console.log('Android version configured:',configure());
module.exports={configure,versionCode};

/* Native Android file-sharing bridge, preserving desktop downloads. */
(() => {
 async function shareOrDownload(blob,filename){
  const cap=globalThis.Capacitor;
  if(cap?.getPlatform?.()!=='android')return false;
  const fs=cap.Plugins?.Filesystem,share=cap.Plugins?.Share;
  if(!fs||!share)throw Error('Android file sharing unavailable');
  const data=await new Promise((resolve,reject)=>{
   const reader=new FileReader();
   reader.onerror=()=>reject(reader.error||Error('Unable to read export'));
   reader.onload=()=>resolve(String(reader.result).split(',')[1]);
   reader.readAsDataURL(blob);
  });
  const path='exports/'+String(filename).replace(/[^a-z0-9_.-]/gi,'_');
  const file=await fs.writeFile({path,data,directory:'CACHE',recursive:true});
  await share.share({title:'Block4Film: '+filename,files:[file.uri],dialogTitle:'Share or save Block4Film export'});
  return true;
 }
 globalThis.Block4FilmNative={shareOrDownload};
})();

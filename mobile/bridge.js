/* Capacitor-only native export bridge: save a file offline and open a share sheet. */
import {Filesystem,Directory} from '@capacitor/filesystem';
import {Share} from '@capacitor/share';
function readAsDataURL(blob){
 return new Promise((resolve,reject)=>{
  const reader=new FileReader();
  reader.onload=()=>resolve(String(reader.result||''));
  reader.onerror=()=>reject(reader.error||new Error('Cannot read export'));
  reader.readAsDataURL(blob);
 });
}
async function saveFile(blob,filename){
 const safe=String(filename||'Block4Film-export').replace(/[\\/\\?%*:|"<>]/g,'-').slice(0,150);
 const uri=await readAsDataURL(blob),i=uri.indexOf(',');
 if(i<0)throw new Error('Cannot encode export');
 await Filesystem.mkdir({directory:Directory.Documents,path:'Block4Film',recursive:true});
 await Filesystem.writeFile({directory:Directory.Documents,path:'Block4Film/'+safe,data:uri.slice(i+1)});
 const file=await Filesystem.getUri({directory:Directory.Documents,path:'Block4Film/'+safe});
 if((await Share.canShare().catch(()=>({value:false}))).value){
  await Share.share({title:safe,text:'Block4Film export',url:file.uri,dialogTitle:'Share '+safe});
 }
 return file.uri;
}
window.Block4FilmMobile={saveFile};

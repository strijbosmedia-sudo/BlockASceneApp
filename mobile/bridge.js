/* Capacitor-only native export bridge: save a file offline and open a share sheet. */
import {Filesystem,Directory} from '@capacitor/filesystem';
import {Share} from '@capacitor/share';
import {FilePicker} from '@capawesome/capacitor-file-picker';
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
/* Do not restrict MIME types: Android providers classify custom .blockascene
   files inconsistently. This picker supports arbitrary JSON project backups. */
async function pickProject(){
 let result;
 try{result=await FilePicker.pickFiles({limit:1,readData:true})}
 catch(error){
  if(/cancel|dismiss|abort/i.test(String(error?.message||error)))return null;
  throw error;
 }
 const file=result?.files?.[0];if(!file)return null;
 if(file.size>50_000_000)throw Error('Choose a project backup smaller than 50 MB.');
 if(typeof file.data!=='string'||!file.data)throw Error('The selected document could not be read.');
 const base64=file.data.replace(/^data:[^,]*,/,'').replace(/\s/g,'');
 if(base64.length>70_000_000)throw Error('Project backup is too large.');
 let binary;
 try{binary=atob(base64)}catch{throw Error('The selected document contains invalid file data.')}
 const bytes=Uint8Array.from(binary,ch=>ch.charCodeAt(0));
 return {name:file.name||'Imported.blockascene',content:new TextDecoder('utf-8').decode(bytes)};
}
window.Block4FilmMobile={saveFile,pickProject};

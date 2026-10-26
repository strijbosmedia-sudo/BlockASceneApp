const {app,BrowserWindow} = require('electron');
const path = require('node:path');
app.whenReady().then(()=>{
  const window = new BrowserWindow({
    width:1480,height:920,minWidth:860,minHeight:580,
    backgroundColor:'#101419',title:'BlockaScene',
    autoHideMenuBar:true,
    webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}
  });
  window.loadFile(path.join(__dirname,'..','app','index.html'));
});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});

const {app,BrowserWindow} = require('electron');
const path = require('node:path');
const fs = require('node:fs');
// Retain BlockaScene's original Electron data directory when upgrading to Block4Film.
const projectDataDir=path.join(app.getPath('appData'),'BlockaScene');
fs.mkdirSync(projectDataDir,{recursive:true});
app.setPath('userData',projectDataDir);
app.whenReady().then(()=>{
  const window = new BrowserWindow({
    width:1480,height:920,minWidth:860,minHeight:580,
    backgroundColor:'#000000',title:'Block4Film',
    icon:path.join(__dirname,'..','app','assets','Block4Film-Icon.png'),
    autoHideMenuBar:true,
    webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}
  });
  window.loadFile(path.join(__dirname,'..','app','index.html'));
});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});

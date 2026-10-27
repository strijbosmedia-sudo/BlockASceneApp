/* Copy Block4Film's offline UI into Capacitor's webDir without changing Electron. */
const fs=require('node:fs'),path=require('node:path'),esbuild=require('esbuild');
const root=path.resolve(__dirname,'..'),src=path.join(root,'app'),dst=path.join(root,'mobile','www');
fs.rmSync(dst,{recursive:true,force:true});fs.mkdirSync(dst,{recursive:true});
fs.cpSync(src,dst,{recursive:true,filter:f=>!f.endsWith('.ico')&&!f.endsWith('.icns')});
const index=path.join(dst,'index.html'),html=fs.readFileSync(index,'utf8');
if(!html.includes('</body>'))throw Error('Malformed index.html');
fs.writeFileSync(index,html.replace('</body>','<script src="./mobile-bridge.js" defer></script>\n</body>'));
esbuild.buildSync({entryPoints:[path.join(root,'mobile','bridge.js')],outfile:path.join(dst,'mobile-bridge.js'),
 bundle:true,format:'iife',platform:'browser',target:['safari15','chrome105'],minify:true});
console.log('Capacitor offline assets ready at mobile/www');

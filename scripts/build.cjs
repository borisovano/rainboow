// Package the game and independent drill source; never edit build/ by hand.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),output=path.join(root,'build');
const drills=require('./drill-registry.cjs')();
fs.rmSync(output,{recursive:true,force:true});
fs.cpSync(path.join(root,'dist'),output,{recursive:true});
fs.cpSync(path.join(root,'character-studio'),path.join(output,'character-studio'),{recursive:true,filter:source=>!source.endsWith('.md')});
fs.cpSync(path.join(root,'drill-modals'),path.join(output,'drills'),{recursive:true,filter:source=>{
 const relative=path.relative(path.join(root,'drill-modals'),source);
 return !relative.split(path.sep).some(p=>['tests','testing'].includes(p))&&!/\.(cjs|md)$/.test(source);
}});
// Keep existing direct drill links usable after the English-name cleanup.
for(const drill of drills)for(const alias of drill.aliases)fs.cpSync(path.join(output,'drills',drill.id),path.join(output,'drills',alias),{recursive:true});
fs.mkdirSync(path.join(output,'dialogs'),{recursive:true});
fs.writeFileSync(path.join(output,'dialogs/index.html'),'<!doctype html><meta http-equiv="refresh" content="0;url=../drills/?drill=math"><a href="../drills/?drill=math">Arithmetic runner</a>');
function walk(folder){return fs.readdirSync(folder,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(folder,entry.name)):[path.join(folder,entry.name)]);}
for(const file of walk(output).filter(file=>file.endsWith('.html'))){
 const source=fs.readFileSync(file,'utf8');
 for(const [,reference] of source.matchAll(/(?:src|href)=["']([^"']+)["']/g)){
  if(/^(?:[a-z]+:|#|\/\/)/i.test(reference))continue;
  const url=new URL(reference,'https://build.test/'+path.relative(output,file).split(path.sep).join('/'));
  const target=path.join(output,decodeURIComponent(url.pathname));
  if(!fs.existsSync(target))throw Error('Missing built asset '+reference+' from '+path.relative(output,file));
 }
}
console.log('Built game and drill modals into build/; local HTML asset links verified.');

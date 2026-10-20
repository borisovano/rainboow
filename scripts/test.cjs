const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),args=process.argv.slice(2);
require('./drill-registry.cjs')();
const catalog=JSON.parse(fs.readFileSync(path.join(root,'drill-modals/catalog.json')));
const ids=catalog.map(file=>file.split('/')[0]);
let folders=[];
if(args.length){
 if(args.length!==2||args[0]!=='--drill'||!ids.includes(args[1])){console.error('Usage: npm run test:drill -- '+ids.join(' | '));process.exit(1);}
 folders=[path.join(root,'drill-modals',args[1],'tests')];
}else folders=[path.join(root,'tests'),...ids.map(id=>path.join(root,'drill-modals',id,'tests'))];
let failed=false,count=0;
for(const folder of folders){
 const files=fs.existsSync(folder)?fs.readdirSync(folder).filter(f=>f.endsWith('.cjs')).sort():[];
 if(!files.length){console.error('No tests found in '+folder);failed=true;}
 for(const file of files){
  count++;const run=spawnSync(process.execPath,[path.join(folder,file)],{stdio:'inherit'});
  if(run.error)console.error(run.error.message);
  if(run.error||run.status!==0)failed=true;
 }
}
console.log(`${count} test files: ${failed?'FAILED':'passed'}`);process.exitCode=failed?1:0;

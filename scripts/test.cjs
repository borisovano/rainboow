const {readdirSync}=require('node:fs');
const {join}=require('node:path');
const {spawnSync}=require('node:child_process');
const directory=join(__dirname,'../tests');
let failed=false;
for(const file of readdirSync(directory).filter(f=>f.endsWith('.cjs')).sort()) {
  const run=spawnSync(process.execPath,[join(directory,file)],{stdio:'inherit'});
  if(run.error){console.error(run.error.message);failed=true;}
  if(run.status!==0)failed=true;
}
process.exitCode=failed?1:0;

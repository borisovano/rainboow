// Generate the browser registry from the manifests; JSON remains the source of truth.
const fs=require('node:fs'),path=require('node:path');
function generate(){
  const base=path.resolve(__dirname,'../drill-modals');
  const metadata=require('../drill-modals/helpers/metadata.js'),contract=require('../drill-modals/helpers/contract.js');
  const catalog=JSON.parse(fs.readFileSync(path.join(base,'catalog.json')));
  const names=new Set();
  const drills=catalog.map(file=>{
    if(!/^[a-z0-9-]+\/drill\.json$/.test(file))throw Error('Invalid catalog path');
    const manifest=metadata.validate(JSON.parse(fs.readFileSync(path.join(base,file),'utf8')));
    if(file!==manifest.id+'/drill.json')throw Error('Drill folder must match id');
    for(const id of [manifest.id,...manifest.aliases]){if(names.has(id))throw Error('Duplicate drill name: '+id);names.add(id);}
    contract.parameters(manifest);for(const example of manifest.examples||[])contract.parameters(manifest,example.params);
    return manifest;
  });
  fs.writeFileSync(path.join(base,'registry.js'),'/* Generated from drill.json files by scripts/drill-registry.cjs. Do not edit. */\n'+
    '(function(root){const drills='+JSON.stringify(drills)+';root.DrillRegistry=drills;if(typeof module==="object"&&module.exports)module.exports=drills;})(globalThis);\n');
  return drills;
}
module.exports=generate;if(require.main===module)generate();

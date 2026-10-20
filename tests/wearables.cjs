const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const THREE=require('../dist/vendor/three.r128.min.js');global.THREE=THREE;require('../dist/vendor/GLTFLoader.r128.js');
const W=require('../character-studio/3d/wearables.js'),{create}=require('../dist/features/pip-avatar.js');
const parse=id=>{const bytes=fs.readFileSync(path.join(__dirname,'../character-studio/3d/assets/'+id+'.glb'));return new Promise((resolve,reject)=>new THREE.GLTFLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'',resolve,reject));};
function fixture(loadWearables=id=>parse(id+'-wearables')){const rig=new THREE.Group(),classic=new THREE.Mesh(new THREE.SphereGeometry(1),new THREE.MeshLambertMaterial()),states=[];rig.add(classic);return {rig,states,avatar:create({THREE,rig,classicParts:[classic],load:parse,loadWearables,onWearablesStatus:state=>states.push(state)})};}
(async()=>{
  assert.equal(W.catalog.length,12);assert.equal(W.catalog.filter(i=>i.slot==='upper').length,6);assert.equal(W.catalog.filter(i=>i.slot==='lower').length,6);
  assert.deepEqual(W.sanitize({upper:'tie',lower:'wizard'}),{upper:null,lower:null});assert(!W.validDesign({character:'evil',upper:null,lower:null}));
  const data=new Map(),env={localStorage:{getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)}};
  assert(W.savePreset(env,{character:'luna',upper:'crown',lower:'necklace',other:'ignore'}));assert.deepEqual(W.readPreset(env),{character:'luna',upper:'crown',lower:'necklace'});
  assert(!W.savePreset(env,{character:'luna',upper:'unknown',lower:null}));assert(!W.savePreset({}, {character:'pip',upper:null,lower:null}));
  const f=fixture();
  for(const id of W.characters){
    await f.avatar.setEnabled(true,id,{upper:'wizard',lower:'scarf'});
    assert.equal(f.states.at(-1),'ready');const visual=f.rig.getObjectByName(id[0].toUpperCase()+id.slice(1)+'_GameVisual'),body=visual.getObjectByName('Body_Control');
    for(const item of W.catalog){const piece=visual.getObjectByName('Wearable_'+item.id);assert(piece,id+': '+item.id);assert.equal(piece.parent,body,'Wearables follow animated body control');assert.equal(piece.visible,['wizard','scarf'].includes(item.id));}
    const scale=visual.scale.x;
    for(const item of W.catalog){await f.avatar.setEnabled(true,id,{[item.slot]:item.id});const piece=visual.getObjectByName('Wearable_'+item.id);assert(piece.visible);piece.updateWorldMatrix(true,true);const bounds=new THREE.Box3().setFromObject(piece);assert(Number.isFinite(bounds.min.y)&&bounds.max.y>bounds.min.y);assert.equal(visual.scale.x,scale,'Accessory bounds must never resize the player');}
    await f.avatar.setEnabled(true,id,{upper:'beanie',lower:'medal'});
    visual.traverse(object=>{if(/^(Soft_horn_|Crown_tuft_)/.test(object.name))assert(!object.visible,'Solid hats hide conflicting details');});
    for(let n=0;n<20;n++)f.avatar.update({delta:1/60,state:'PLAYING',moving:true,speed:12});
    f.avatar.update({delta:1/60,state:'PLAYING',cloaked:true});visual.getObjectByName('Wearable_beanie').traverse(object=>{if(object.isMesh)assert.equal(object.material.opacity,.25,'Cloak applies to clothes too');});
    await f.avatar.setEnabled(true,id,{});for(const item of W.catalog)assert(!visual.getObjectByName('Wearable_'+item.id).visible);visual.traverse(object=>{if(/^(Soft_horn_|Crown_tuft_)/.test(object.name))assert(object.visible,'Removing hats restores character details');});
  }
  let resolve,loads=0;const delayed=fixture(()=>{loads++;return new Promise(done=>resolve=done);});
  await delayed.avatar.setEnabled(true,'pip');assert.equal(loads,0,'No wardrobe download without an outfit');
  const old=delayed.avatar.setEnabled(true,'pip',{upper:'crown'});await Promise.resolve();const newer=delayed.avatar.setEnabled(true,'pip',{upper:'glasses',lower:'tie'});resolve(await parse('pip-wearables'));await Promise.all([old,newer]);
  assert.equal(loads,1);assert(delayed.rig.getObjectByName('Wearable_glasses').visible);assert(!delayed.rig.getObjectByName('Wearable_crown').visible,'Newest selection wins a slow load');
  const warn=console.warn;console.warn=()=>{};let attempts=0;const retry=fixture(id=>++attempts===1?Promise.reject(Error('offline')):parse(id+'-wearables'));
  try{await retry.avatar.setEnabled(true,'pip',{upper:'glasses'});assert.equal(retry.states.at(-1),'error');assert(retry.rig.getObjectByName('Pip_GameVisual').visible);await retry.avatar.setEnabled(true,'pip',{upper:'glasses'});assert.equal(retry.states.at(-1),'ready');}finally{console.warn=warn;}
  console.log('PASS: all 48 fitted assets load in the game renderer, slot validation, saved designs, body attachment, fixed player scale, cloak, hat details, lazy load, selection race and retry.');
})().catch(error=>{console.error(error);process.exitCode=1;});

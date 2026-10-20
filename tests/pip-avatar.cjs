const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const THREE=require('../dist/vendor/three.r128.min.js');global.THREE=THREE;require('../dist/vendor/GLTFLoader.r128.js');
const {create}=require('../dist/features/pip-avatar.js');
const parse=(id='pip')=>{const bytes=fs.readFileSync(path.join(__dirname,'../character-studio/3d/assets/'+id+'.glb'));return new Promise((resolve,reject)=>new THREE.GLTFLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'',resolve,reject));};
function fixture(load=parse) {const rig=new THREE.Group(),classic=new THREE.Mesh(new THREE.SphereGeometry(1.2),new THREE.MeshLambertMaterial());classic.position.y=1.2;rig.add(classic);const statuses=[];return {rig,classic,statuses,avatar:create({THREE,rig,classicParts:[classic],load,onStatus:status=>statuses.push(status)})};}
(async()=>{
  let loads=0;const f=fixture(()=>{loads++;return parse();});
  await f.avatar.setEnabled(false);assert.equal(loads,0,'Flag off must not fetch or parse the model');assert(f.classic.visible);
  await f.avatar.setEnabled(true);assert.equal(loads,1);assert.equal(f.statuses.at(-1),'pip');assert(!f.classic.visible);
  const visual=f.rig.getObjectByName('Pip_GameVisual'),root=f.rig.getObjectByName('Pip_Root');assert(visual.visible);
  const box=new THREE.Box3().setFromObject(visual);assert(Math.abs(box.max.y-box.min.y-2.4)<.0001);assert(Math.abs(box.min.y)<.0001,'Feet remain on the physics surface');assert.equal(visual.rotation.y,Math.PI);
  const foot=f.rig.getObjectByName('Foot_R_Control'),original=foot.position.clone();
  for(let i=0;i<10;i++)f.avatar.update({delta:1/60,state:'PLAYING',moving:true,speed:12});
  assert(foot.position.distanceTo(original)>.001,'Actual Walk tracks animate the feet');
  const paused=foot.position.clone();f.avatar.update({delta:.1,state:'BREATHING',moving:true,speed:12});assert(foot.position.equals(paused),'Breathing pauses animation');
  for(let i=0;i<240;i++)f.avatar.update({delta:1/60,state:'PLAYING',jumping:true});
  assert(Math.abs(root.position.y)<.00001,'The exported hop must not add a second vertical jump');
  f.avatar.update({delta:1/60,state:'PLAYING'});assert(Math.abs(root.position.y)<.00001);
  const arm=f.rig.getObjectByName('Arm_R_Control'),beforeWave=arm.quaternion.clone();
  for(let i=0;i<45;i++)f.avatar.update({delta:1/60,state:'POWERUP'});
  assert(arm.quaternion.angleTo(beforeWave)>.1,'New-power celebration uses Wave');
  f.avatar.update({delta:1/60,state:'PLAYING',cloaked:true});
  visual.traverse(obj=>{if(obj.isMesh){assert.equal(obj.material.opacity,.25);assert.equal(obj.material.depthWrite,false);}});
  f.avatar.update({delta:1/60,state:'PLAYING',cloaked:false});visual.traverse(obj=>{if(obj.isMesh)assert.equal(obj.material.opacity,1);});
  f.rig.scale.setScalar(2);f.rig.visible=false;
  await f.avatar.setEnabled(false);assert(f.classic.visible);assert(!visual.visible);assert.equal(f.rig.visible,false);assert.equal(f.rig.scale.x,2,'Character switches do not reset gameplay growth or death');
  await f.avatar.setEnabled(true);assert.equal(loads,1,'Reuse the loaded model on repeated toggles');assert.equal(f.rig.children.length,2);
  let finish;const racing=fixture(()=>new Promise(resolve=>finish=resolve));const pending=racing.avatar.setEnabled(true);await Promise.resolve();await racing.avatar.setEnabled(false);finish(await parse());await pending;
  assert(racing.classic.visible);assert(!racing.rig.getObjectByName('Pip_GameVisual').visible,'Disabling during load must win');
  const broken=fixture(()=>Promise.reject(new Error('Simulated missing asset')));const warn=console.warn;console.warn=()=>{};try{await broken.avatar.setEnabled(true);}finally{console.warn=warn;}
  assert.equal(broken.statuses.at(-1),'fallback');assert(broken.classic.visible);
  const all=fixture();
  for(const id of ['pip','moss','sunny','luna']){
    await all.avatar.setEnabled(true,id);assert.equal(all.statuses.at(-1),id);assert(!all.classic.visible);
    const root=all.rig.getObjectByName(id[0].toUpperCase()+id.slice(1)+'_Root');assert(root);
    for(let i=0;i<90;i++)all.avatar.update({delta:1/60,state:'PLAYING',jumping:true});assert(Math.abs(root.position.y)<.00001,id+' does not double-jump');
    assert.equal(all.rig.children.filter(c=>c.visible).length,1,'Only the selected model is visible');
  }
  let finishPip,finishMoss;const race=fixture(id=>new Promise(resolve=>{if(id==='pip')finishPip=resolve;else finishMoss=resolve;}));
  const first=race.avatar.setEnabled(true,'pip');await Promise.resolve();const second=race.avatar.setEnabled(true,'moss');await Promise.resolve();
  finishMoss(await parse('moss'));await second;finishPip(await parse('pip'));await first;
  assert.equal(race.statuses.at(-1),'moss');assert(race.rig.getObjectByName('Moss_GameVisual').visible);assert(!race.rig.getObjectByName('Pip_GameVisual').visible);
  console.log('PASS: actual r128 GLB load, lazy flag, matching size/facing, walk/wave/jump tracks, pause, cloak, growth/death, reuse, loading race and classic fallback.');
})().catch(error=>{console.error(error);process.exitCode=1;});

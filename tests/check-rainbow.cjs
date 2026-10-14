const fs=require('fs'), vm=require('vm'), assert=require('assert');
const html=fs.readFileSync(require('path').join(__dirname,'../dist/index.html'),'utf8');
const src=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
new vm.Script(src);
class V {constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z});}set(x,y,z){Object.assign(this,{x,y,z});return this;}addScalar(n){this.x+=n;this.y+=n;this.z+=n;}lerp(){}}
let objectId=0;
class Obj {constructor(geometry,material){this.material=material;this.id=++objectId;this.position=new V;this.rotation=new V;this.scale=new V(1,1,1);this.children=[];this.userData={};}add(...x){this.children.push(...x);}setAttribute(){}setIndex(){}computeVertexNormals(){}lookAt(){}setSize(){}render(){}updateProjectionMatrix(){} }
const THREE=new Proxy({Vector3:V,Clock:class{getDelta(){return 1/60;}},WebGLRenderer:class extends Obj{constructor(){super();this.shadowMap={};this.domElement=document.createElement("canvas");}},Color:class{lerpColors(){return this;}},CanvasTexture:class{constructor(){this.repeat={set(){}};}}},{get:(o,k)=>o[k]||Obj});
const handlers={};
const document=require('./helpers/dom.cjs').createDocument({autocreate:true});
const ctx={THREE,Tone:{PolySynth:class{constructor(){this.volume={};}toDestination(){return this;}},Synth:{},context:{state:'suspended'}},document,window:{innerWidth:1200,innerHeight:800,addEventListener(name,fn){handlers[name]=fn;}},requestAnimationFrame(){},setTimeout(){},setInterval(){},clearInterval(){},console};
vm.createContext(ctx);for(const file of ['math-dialog.js','presets.js','examples/number-entry.js'])vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../drill-modals/arithmetic',file),'utf8'),ctx);vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../dist/maze.js'),'utf8'),ctx);vm.runInContext(src,ctx);


vm.runInContext("gameState='PLAYING'",ctx);
for(const code of ['KeyA','Minus','KeyB','Minus','KeyU','Minus','KeyB','Minus','KeyU'])handlers.keydown({code});
assert.equal(vm.runInContext('movementSpeedMultiplier',ctx),5);
for(const code of ['KeyA','KeyB','KeyU','KeyB','KeyU'])handlers.keydown({code});
assert.equal(vm.runInContext('movementSpeedMultiplier',ctx),5);
vm.runInContext(`
openMoonShortcut();predators.forEach(p=>p.active=false);
interactables.filter(o=>o.userData.realm!=='rainbow').forEach(o=>o.userData.cleared=true);
resetRealmPowers('moon');powerups.superJump=true;
const source=moonPlatforms[3];
if(rainbowWorld.startX!==source.x || rainbowWorld.height!==source.top)throw Error('Wrong source platform');
playerGroup.position.set(source.x,source.top,source.z);isJumping=false;gameState='PLAYING';keys.right=true;
let roadFrames=0;
while(playerGroup.position.x<rainbowWorld.entryX && roadFrames<500) {
 stepGame();roadFrames++;
 if(gameState!=='PLAYING'||!Number.isFinite(playerGroup.position.y))throw Error('Road blocked');
 const h=rainbowSurfaceAt(playerGroup.position.x,playerGroup.position.z);
 if(h!==null && Math.abs(playerGroup.position.y-h)>.01)throw Error('Road height mismatch');
}
keys.right=false;
if(currentRealm!=='rainbow' || Object.values(powerups).some(Boolean))throw Error('Rainbow entry reset failed');
if(npcList.filter(n=>n.realm==='rainbow').length!==8 || rainbowGates.length!==3)throw Error('Content missing');
// Traverse the full curved arena with actual movement, solving gates when encountered.
let solved=0;
for(let angle=Math.PI-.05;angle>=.14;angle-=.04) {
 const target=rainbowPoint(angle);
 for(let frame=0;frame<80 && Math.hypot(playerGroup.position.x-target.x,playerGroup.position.z-target.z)>2.1;frame++) {
  keys.left=playerGroup.position.x>target.x+1;keys.right=playerGroup.position.x<target.x-1;
  keys.up=playerGroup.position.z>target.z+1;keys.down=playerGroup.position.z<target.z-1;
  stepGame();
  if(gameState==='CHALLENGE'){
   const obs=activeObstacle; if(obs.userData.type==='rainbow_gate')solved++;
   handleSuccess(); if(gameState==='POWERUP')gameState='PLAYING';
  }
 }
 if(Math.hypot(playerGroup.position.x-target.x,playerGroup.position.z-target.z)>3)throw Error('Arena route blocked at angle '+angle);
}
if(solved!==3 || rainbowGates.some(g=>!g.userData.cleared))throw Error('Missing gate encounters');
if(!rainbowWorld.complete)throw Error('Final pot not reached');
for(let grade=1;grade<=4;grade++)for(const kind of ['missing','sequence','division'])for(let i=0;i<50;i++){
 const c=makeRainbowChallenge(kind,grade);
 if(new Set(c.options).size!==4 || !c.options.includes(c.answer))throw Error('Invalid answers');
 const nums=c.text.match(/[0-9]+/g).map(Number);
 if(kind==='sequence' && c.answer!==nums[2]+nums[1]-nums[0])throw Error('Wrong sequence');
 if(kind==='missing' && (grade===1?nums[0]+c.answer:nums[0]*c.answer)!==nums[1])throw Error('Wrong missing number');
 if(kind==='division' && (grade>1?nums[0]/nums[1]:nums[0]+nums[1])!==c.answer)throw Error('Wrong arithmetic');
}
console.log('Road frames at 5x:',roadFrames,'Gates solved:',solved);
`,ctx);
console.log('PASS: ABUBU and hyphenated spelling set 5x without stacking; fourth-platform arch traversal; third-world transition; eight friends, three mandatory gates, treasure finale, grade-aware arithmetic.');

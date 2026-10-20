const fs=require('fs'), vm=require('vm'), assert=require('assert');
const html=fs.readFileSync(require('path').join(__dirname,'../dist/index.html'),'utf8');
const src=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
new vm.Script(src);
class V {constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z});}set(x,y,z){Object.assign(this,{x,y,z});return this;}addScalar(n){this.x+=n;this.y+=n;this.z+=n;}lerp(){}}
let objectId=0;
class Obj {constructor(geometry,material){this.material=material;this.id=++objectId;this.position=new V;this.rotation=new V;this.scale=new V(1,1,1);this.children=[];this.userData={};}add(...x){this.children.push(...x);}setAttribute(){}setIndex(){}computeVertexNormals(){}lookAt(){}setSize(){}render(){}updateProjectionMatrix(){} }
const THREE=new Proxy({Vector3:V,Clock:class{getDelta(){return 1/60;}},WebGLRenderer:class extends Obj{constructor(){super();this.shadowMap={};this.domElement=document.createElement("canvas");}},Color:class{lerpColors(){return this;}},CanvasTexture:class{constructor(){this.repeat={set(){}};}}},{get:(o,k)=>o[k]||Obj});
const document=require('./helpers/dom.cjs').createDocument({autocreate:true});
const ctx={THREE,Tone:{PolySynth:class{constructor(){this.volume={};}toDestination(){return this;}},Synth:{},context:{state:'suspended'}},document,window:{innerWidth:1200,innerHeight:800,addEventListener(){}},requestAnimationFrame(){},setTimeout(){},setInterval(){},clearInterval(){},console};
vm.createContext(ctx);for(const file of ['math-dialog.js','presets.js','examples/number-entry.js'])vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../drill-modals/arithmetic',file),'utf8'),ctx);vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../dist/maze.js'),'utf8'),ctx);vm.runInContext(src,ctx);
vm.runInContext(`
openMoonShortcut();predators.forEach(p=>p.active=false);interactables.forEach(o=>o.userData.cleared=true);
function distanceFor({realm='earth',power=false,air=false,multiplier=1}) {
 resetRealmPowers(realm);powerups.superJump=power;movementSpeedMultiplier=multiplier;gameState='PLAYING';
 const z=realm==='moon'?MOON_ENTRY-30:0,y=terrainHeightAt(0,z);playerGroup.position.set(0,y+(air?3:0),z);groundHeight=y;
 Object.keys(keys).forEach(key=>keys[key]=false);keys.up=true;isJumping=air;playerVelocityY=air?.4:0;stepGame();
 return Math.abs(playerGroup.position.z-z);
}
for(const realm of ['earth','moon'])for(const multiplier of [1,5]) {
 const walking=distanceFor({realm,multiplier});
 const poweredWalking=distanceFor({realm,multiplier,power:true});
 const ordinaryJump=distanceFor({realm,multiplier,air:true});
 const leap=distanceFor({realm,multiplier,power:true,air:true});
 if(Math.abs(poweredWalking-walking)>.00001||Math.abs(ordinaryJump-walking)>.00001)throw Error('Walking or ordinary jumps changed');
 if(Math.abs(leap-walking*2)>.00001)throw Error('Powered horizontal leap must be exactly x2');
}
`,ctx);
console.log('PASS: super-jump horizontal motion doubles on Earth/Moon, stacks with x5 testing speed, and leaves walking and ordinary jumps unchanged.');

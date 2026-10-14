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
const enemy=predators[0];enemy.mesh.position.set(0,0,0);monsterRig.scale.set(1,1,1);
playerGroup.position.set(0,0,0);
if(!playerHitsPredator(enemy))throw Error('Ground contact missed');
playerGroup.position.set(0,3,0);
if(playerHitsPredator(enemy))throw Error('Caught above Earth enemy');
// An enemy directly below a jumping player must not get a NaN movement position.
predators.forEach(p=>p.active=false);enemy.active=true;
interactables.forEach(o=>o.userData.cleared=true);
gameState='PLAYING';isJumping=true;playerVelocityY=.5;stepGame();
if(gameState!=='PLAYING'||!Number.isFinite(enemy.mesh.position.x))throw Error('Overhead pass failed');
activateSpaceRealm();const asteroid=predators.find(p=>p.isAsteroid);
asteroid.mesh.position.set(0,10,-1100);
playerGroup.position.set(0,23,-1100);
if(playerHitsPredator(asteroid))throw Error('Caught above asteroid');
playerGroup.position.set(0,20,-1100);
if(!playerHitsPredator(asteroid))throw Error('Asteroid side contact missed');
playerGroup.position.set(0,0,-1100);
if(playerHitsPredator(asteroid))throw Error('Terrain elevation ignored');
monsterRig.scale.set(2,2,2);playerGroup.position.set(2,10,-1100);
if(!playerHitsPredator(asteroid))throw Error('Scaled character ignored');
`,ctx);
console.log('PASS: grounded contact, jumping clearance, overhead pursuit, asteroid height, terrain elevation, and player scaling.');

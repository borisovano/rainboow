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
openMoonShortcut();resetRealmPowers('moon');
predators.forEach(p=>p.active=false);interactables.forEach(o=>o.userData.cleared=true);
if(moonPlatforms.length!==5)throw Error('Expected five platforms');
const first=moonPlatforms[0];
gameState='PLAYING';isJumping=false;playerGroup.position.set(first.x,first.top,first.z);
jump();let maxHeight=first.top;
for(let i=0;i<100;i++){stepGame();maxHeight=Math.max(maxHeight,playerGroup.position.y);}
if(maxHeight>=moonPlatforms[1].top)throw Error('Ordinary jump reaches upper tier');
powerups.superJump=true;
for(let index=1;index<5;index++) {
 const target=moonPlatforms[index];jump();
 for(let frame=0;frame<160;frame++) {
  keys.left=playerGroup.position.x>target.x+.1;keys.right=playerGroup.position.x<target.x-.1;
  keys.up=playerGroup.position.z>target.z+.1;keys.down=playerGroup.position.z<target.z-.1;
  stepGame();
 }
 if(isJumping || Math.abs(playerGroup.position.y-target.top)>.001 || Math.hypot(playerGroup.position.x-target.x,playerGroup.position.z-target.z)>.3)throw Error('Cannot land on platform '+(index+1));
}
const lower=moonPlatforms[3];let sawFall=false;
for(let frame=0;frame<170;frame++) {
 keys.left=playerGroup.position.x>lower.x+.1;keys.right=playerGroup.position.x<lower.x-.1;
 keys.up=playerGroup.position.z>lower.z+.1;keys.down=playerGroup.position.z<lower.z-.1;
 stepGame();sawFall ||= isJumping;
}
if(!sawFall || isJumping || Math.abs(playerGroup.position.y-lower.top)>.001)throw Error('Descending landing failed');
if(score!==50)throw Error('Chest award changed or extra rewards added');
`,ctx);
console.log('PASS: five platforms, ordinary jump insufficient, four consecutive super-jump landings, safe descent to lower platform, original chest awards 50 once.');

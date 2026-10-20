const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function fixture(search){
const fs=require('fs'), vm=require('vm'), assert=require('assert');
const html=fs.readFileSync(require('path').join(__dirname,'../dist/index.html'),'utf8');
const src=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
new vm.Script(src);
class V {constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z});}set(x,y,z){Object.assign(this,{x,y,z});return this;}addScalar(n){this.x+=n;this.y+=n;this.z+=n;}lerp(){}}
let objectId=0;
class Obj {constructor(geometry,material){this.material=material;this.id=++objectId;this.position=new V;this.rotation=new V;this.scale=new V(1,1,1);this.children=[];this.userData={};}add(...x){this.children.push(...x);}setAttribute(){}setIndex(){}computeVertexNormals(){}lookAt(){}setSize(){}render(){}updateProjectionMatrix(){} }
const THREE=new Proxy({Vector3:V,Clock:class{getDelta(){return 1/60;}},WebGLRenderer:class extends Obj{constructor(){super();this.shadowMap={};this.domElement=document.createElement("canvas");}},Color:class{lerpColors(){return this;}},CanvasTexture:class{constructor(){this.repeat={set(){}};}}},{get:(o,k)=>o[k]||Obj});
const document=require('./helpers/dom.cjs').createDocument({autocreate:true});
const handlers={};
const ctx={URLSearchParams,THREE,Tone:{PolySynth:class{constructor(){this.volume={};}toDestination(){return this;}},Synth:{},context:{state:'suspended'}},document,window:{innerWidth:1200,innerHeight:800,addEventListener(name,fn){handlers[name]=fn;}},requestAnimationFrame(){},setTimeout(){},setInterval(){ctx.intervalStarts=(ctx.intervalStarts||0)+1;},clearInterval(){},console};
let opened;ctx.DrillHost={open(id,options){opened={id,...options};return Promise.resolve();}};ctx.GameFeatures=require('../dist/features/flags.js').createStore({location:{search}});vm.createContext(ctx);for(const file of ['math-dialog.js','presets.js','examples/number-entry.js'])vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../drill-modals/math',file),'utf8'),ctx);vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../dist/maze.js'),'utf8'),ctx);vm.runInContext(src,ctx);

ctx.window.location={search};ctx.Tone.start=async()=>{};return ctx;
}
(async()=>{
 for(const stage of ['earth','moon','rainbow','maze','unknown','']){
  const ctx=fixture(stage?'?stage='+stage:'');await ctx.window.startGame(3);
  const realm=['moon','rainbow','maze'].includes(stage)?stage:'earth';
  assert.equal(vm.runInContext('currentRealm',ctx),realm);assert.equal(vm.runInContext('selectedGrade',ctx),3);
  assert.equal(vm.runInContext('score',ctx),0);assert.equal(vm.runInContext('friendsRescued',ctx),0);
  assert(vm.runInContext('!Object.values(powerups).some(Boolean)&&!Object.values(rainbowPowers).some(Boolean)&&!Object.values(mazePowers).some(Boolean)',ctx));
  assert(vm.runInContext('Number.isFinite(playerGroup.position.y)',ctx));
  if(realm==='moon')assert(vm.runInContext('canWalkAt(playerGroup.position.x,playerGroup.position.z)&&playerGroup.position.y===terrainHeightAt(playerGroup.position.x,playerGroup.position.z)',ctx));
  if(realm==='rainbow')assert(vm.runInContext('inRainbowArena(playerGroup.position.x,playerGroup.position.z)&&rainbowGates.every(g=>!g.userData.cleared)&&!rainbowWorld.complete',ctx));
  if(realm==='maze'){assert.equal(vm.runInContext('mazeWorld.rescued',ctx),0);ctx.window.continueFromPowerup();}
  vm.runInContext('stepGame()',ctx);assert.equal(vm.runInContext('currentRealm',ctx),realm,'First frame changed the selected stage');
 }
 for(const stage of ['earth','moon','rainbow','maze']){
  const html=fs.readFileSync(path.join(__dirname,'../dist',stage,'index.html'),'utf8');assert(html.includes('url=../?stage='+stage));
 }
 console.log('PASS: four direct stage entries, correct terrain/spawn, no free rewards/powers, class retained, first-frame stability and unknown-stage fallback.');
})().catch(error=>{console.error(error);process.exitCode=1;});

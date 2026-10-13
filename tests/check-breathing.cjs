const fs=require('fs'), vm=require('vm'), assert=require('assert');
const html=fs.readFileSync(require('path').join(__dirname,'../dist/index.html'),'utf8');
const src=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
new vm.Script(src);
class V {constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z});}set(x,y,z){Object.assign(this,{x,y,z});return this;}addScalar(n){this.x+=n;this.y+=n;this.z+=n;}lerp(){}}
let objectId=0;
class Obj {constructor(geometry,material){this.material=material;this.id=++objectId;this.position=new V;this.rotation=new V;this.scale=new V(1,1,1);this.children=[];this.userData={};}add(...x){this.children.push(...x);}setAttribute(){}setIndex(){}computeVertexNormals(){}lookAt(){}setSize(){}render(){}updateProjectionMatrix(){} }
const THREE=new Proxy({Vector3:V,Clock:class{getDelta(){return 1/60;}},WebGLRenderer:class extends Obj{constructor(){super();this.shadowMap={};}},Color:class{lerpColors(){return this;}},CanvasTexture:class{constructor(){this.repeat={set(){}};}}},{get:(o,k)=>o[k]||Obj});
const els={};const element=()=>({style:{},classList:{values:new Set(),add(v){this.values.add(v);},remove(v){this.values.delete(v);},contains(v){return this.values.has(v);}},appendChild(){},addEventListener(){},getContext:()=>({fillRect(){},beginPath(){},arc(){},fill(){}})});
const ctx={THREE,Tone:{PolySynth:class{constructor(){this.volume={};}toDestination(){return this;}},Synth:{},context:{state:'suspended'}},document:{getElementById:id=>els[id]??=element(),createElement:element,querySelector:()=>element(),querySelectorAll:()=>[]},window:{innerWidth:1200,innerHeight:800,addEventListener(){}},requestAnimationFrame(){},setTimeout(){},setInterval(){ctx.intervalStarts=(ctx.intervalStarts||0)+1;},clearInterval(){},console};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../dist/maze.js'),'utf8'),ctx);vm.runInContext(src,ctx);
vm.runInContext(`
const enemy=predators[0];gameState='PLAYING';keys.up=true;
const initialPosition=JSON.stringify(playerGroup.position),initialEnemy=JSON.stringify(enemy.mesh.position),initialTime=simulationTime;
triggerPredatorChallenge(enemy);
if(gameState!=='BREATHING'||keys.up||globalThis.intervalStarts)throw Error('Breathing must precede timed challenge');
if(!document.getElementById('breathing-card').classList.contains('active')||!document.getElementById('ui-layer').inert)throw Error('Pause not visible or underlying controls active');
const preparedQuestion=JSON.stringify(currentChallenge);
if(!document.getElementById('challenge-modal').classList.contains('active')||!document.getElementById('challenge-content').inert)throw Error('Question must be covered in the same dialog');
checkAnswer(currentChallenge.answer, {disabled:false});
if(gameState!=='BREATHING')throw Error('Answered through breathing overlay');
triggerPredatorChallenge(predators[1]);
if(breathingPredator!==enemy)throw Error('Another predator replaced the encounter');
for(let i=0;i<60;i++)stepGame();
if(JSON.stringify(playerGroup.position)!==initialPosition||JSON.stringify(enemy.mesh.position)!==initialEnemy||simulationTime!==initialTime)throw Error('World moved during pause');
document.hidden=true;const remaining=breathingSecondsLeft;updateBreathingPause(600);
if(breathingSecondsLeft!==remaining)throw Error('Hidden tab consumed pause');
document.hidden=false;updateBreathingPause(remaining-.25);
if(gameState!=='BREATHING'||globalThis.intervalStarts)throw Error('Challenge began too early');
updateBreathingPause(.25);
if(JSON.stringify(currentChallenge)!==preparedQuestion||document.getElementById('challenge-content').inert)throw Error('Question changed or stayed blocked');
if(gameState!=='PREDATOR_CHALLENGE'||activeObstacle!==enemy||predatorTimeLeft!==30||globalThis.intervalStarts!==1)throw Error('Challenge did not begin with full time');
if(document.getElementById('breathing-card').classList.contains('active')||document.getElementById('ui-layer').inert)throw Error('Breathing UI not cleared');
updateBreathingPause(600);if(globalThis.intervalStarts!==1)throw Error('Duplicate timer');
gameState='PLAYING';powerups.godMode=true;triggerPredatorChallenge(enemy);
if(gameState!=='PREDATOR_DEATH')throw Error('Invincibility interrupted');
powerups.godMode=false;gameState='PLAYING';rainbowTimers.cloakActive=4;
activateSpaceRealm();const cloud=predators.find(p=>p.isCloud);triggerPredatorChallenge(cloud);
if(gameState!=='PLAYING')throw Error('Cloak interrupted');
rainbowTimers.cloakActive=0;
for(const realm of ['earth','moon','rainbow']) {
 gameState='PLAYING';currentRealm=realm;rainbowPowers.clock=realm==='rainbow';
 triggerPredatorChallenge(realm==='rainbow'?cloud:enemy);
 if(gameState!=='BREATHING'||breathingSecondsLeft!==5)throw Error('Missing five-second pause');
 updateBreathingPause(5);
 if(predatorTimeLeft!==(realm==='rainbow'?45:30))throw Error('Lost challenge time');
}
`,ctx);
console.log("PASS: five-second pause, frozen world, hidden-tab pause, repeated encounters, full timer, god mode, cloak, all realms.");

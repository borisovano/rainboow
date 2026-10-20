const fs=require('fs'), vm=require('vm'), assert=require('assert');
const html=fs.readFileSync(require('path').join(__dirname,'../dist/index.html'),'utf8');
const src=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
new vm.Script(src);
class V {constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z});}set(x,y,z){Object.assign(this,{x,y,z});return this;}addScalar(n){this.x+=n;this.y+=n;this.z+=n;}lerp(){}}
let objectId=0;
class Obj {constructor(geometry,material){this.material=material;this.id=++objectId;this.position=new V;this.rotation=new V;this.scale=new V(1,1,1);this.children=[];this.userData={};}add(...x){this.children.push(...x);}setAttribute(){}setIndex(){}computeVertexNormals(){}lookAt(){}setSize(){}render(){}updateProjectionMatrix(){} }
const THREE=new Proxy({Vector3:V,Clock:class{getDelta(){return 1/60;}},WebGLRenderer:class extends Obj{constructor(){super();this.shadowMap={};this.domElement=document.createElement("canvas");}},Color:class{lerpColors(){return this;}},CanvasTexture:class{constructor(){this.repeat={set(){}};}}},{get:(o,k)=>o[k]||Obj});
const document=require('./helpers/dom.cjs').createDocument({autocreate:true});
const ctx={THREE,Tone:{PolySynth:class{constructor(){this.volume={};}toDestination(){return this;}},Synth:{},context:{state:'suspended'}},document,window:{innerWidth:1200,innerHeight:800,addEventListener(){}},requestAnimationFrame(){},setTimeout(){},setInterval(fn){const id=ctx.intervalStarts=(ctx.intervalStarts||0)+1;(ctx.intervals??=new Map()).set(id,fn);return id;},clearInterval(id){ctx.intervals?.delete(id);},console};
ctx.GameFeatures=require('../dist/features/flags.js').createStore();vm.createContext(ctx);for(const file of ['math-dialog.js','presets.js','examples/number-entry.js'])vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../drill-modals/math',file),'utf8'),ctx);vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../dist/maze.js'),'utf8'),ctx);vm.runInContext(src,ctx);
vm.runInContext(`
const enemy=predators[0];gameState='PLAYING';keys.up=true;
const initialPosition=JSON.stringify(playerGroup.position),initialEnemy=JSON.stringify(enemy.mesh.position),initialTime=simulationTime;
triggerPredatorChallenge(enemy);
if(gameState!=='PREDATOR_CHALLENGE'||challengeDialog.isCovered||keys.up||globalThis.intervals.size!==1)throw Error('Question must be immediately answerable');
const preparedQuestion=JSON.stringify(currentChallenge),bonus=document.querySelector('.md-breath-button');
if(!bonus||bonus.disabled)throw Error('Optional breath button missing');
for(let i=0;i<7;i++)globalThis.intervals.get(predatorInterval)();
if(predatorTimeLeft!==23)throw Error('Countdown not running');
currentMistakes=1;bonus.click();
if(gameState!=='BREATHING'||breathingSecondsLeft!==10||globalThis.intervals.size)throw Error('Optional pause did not stop the countdown');
if(!document.getElementById('breathing-card').classList.contains('active')||!document.getElementById('ui-layer').inert)throw Error('Banner missing');
if(document.getElementById('challenge-content').inert||document.getElementById('challenge-content').classList.contains('breathing'))throw Error('Question was hidden or blocked');
if(!document.querySelector('.md-answer-body').inert||!bonus.disabled||document.querySelectorAll('.answer-btn').some(b=>!b.disabled))throw Error('Responses must be blocked during breathing');
checkAnswer(currentChallenge.answer,{disabled:false});requestBreathingBonus();triggerPredatorChallenge(predators[1]);
if(gameState!=='BREATHING'||breathingPredator!==enemy)throw Error('Breathing response or duplicate request leaked');
for(let i=0;i<60;i++)stepGame();
if(JSON.stringify(playerGroup.position)!==initialPosition||JSON.stringify(enemy.mesh.position)!==initialEnemy||simulationTime!==initialTime)throw Error('World moved during pause');
document.hidden=true;const remaining=breathingSecondsLeft;updateBreathingPause(600);
if(breathingSecondsLeft!==remaining)throw Error('Hidden tab consumed pause');
document.hidden=false;updateBreathingPause(remaining-.25);
if(gameState!=='BREATHING'||globalThis.intervals.size)throw Error('Pause ended too early');
updateBreathingPause(.25);
if(JSON.stringify(currentChallenge)!==preparedQuestion||currentMistakes!==1||document.querySelector('.md-answer-body').inert)throw Error('Question, mistakes or answer state changed');
if(gameState!=='PREDATOR_CHALLENGE'||activeObstacle!==enemy||predatorTimeLeft!==30||globalThis.intervals.size!==1||globalThis.intervalStarts!==2)throw Error('Full timer not restored exactly once');
if(document.getElementById('breathing-card').classList.contains('active')||bonus.disabled)throw Error('Breathing UI not reset');
updateBreathingPause(600);if(globalThis.intervalStarts!==2)throw Error('Duplicate timer');
// Optional bonus can be chosen again, with no overlapping timers.
bonus.click();updateBreathingPause(10);if(globalThis.intervals.size!==1)throw Error('Repeated bonus duplicated countdown');
challengeDialog.lockAnswers();requestBreathingBonus();if(gameState!=='PREDATOR_CHALLENGE')throw Error('Bonus accepted after answer lock');
challengeDialog.hide();gameState='PLAYING';powerups.godMode=true;triggerPredatorChallenge(enemy);
if(gameState!=='PREDATOR_DEATH')throw Error('Invincibility interrupted');
powerups.godMode=false;gameState='PLAYING';rainbowTimers.cloakActive=4;
activateSpaceRealm();const cloud=predators.find(p=>p.isCloud);triggerPredatorChallenge(cloud);
if(gameState!=='PLAYING')throw Error('Cloak interrupted');
rainbowTimers.cloakActive=0;
for(const realm of ['earth','moon','rainbow']) {
 gameState='PLAYING';currentRealm=realm;rainbowPowers.clock=realm==='rainbow';
 triggerPredatorChallenge(realm==='rainbow'?cloud:enemy);
 if(gameState!=='PREDATOR_CHALLENGE'||challengeDialog.isCovered)throw Error('Breathing was made mandatory');
 predatorTimeLeft=2;requestBreathingBonus();updateBreathingPause(10);
 if(predatorTimeLeft!==(realm==='rainbow'?45:30))throw Error('Full time bonus incorrect');
}
clearInterval(predatorInterval);gameState='CHALLENGE';renderGameChallenge({text:'2 + 3 = ?',answer:5,options:[4,5,6,7]},{title:'Practice'});challengeDialog.show();
const started=globalThis.intervalStarts;requestBreathingBonus();updateBreathingPause(10);
if(gameState!=='CHALLENGE'||globalThis.intervalStarts!==started)throw Error('Untimed challenge acquired a countdown');
// Flag changes update the live button without replacing the question.
GameFeatures.setOverride('math.breathing',false);
if(document.body.querySelector('.md-breath-button'))throw Error('Disabled breath button still visible');
requestBreathingBonus();if(gameState!=='CHALLENGE')throw Error('Disabled bonus still works');
GameFeatures.setDrillParams('math',{features:{breathing:{durationSeconds:12,enabled:true}}});
requestBreathingBonus();if(breathingSecondsLeft!==12)throw Error('Custom duration ignored');
GameFeatures.setOverride('math.breathing',false);updateBreathingPause(11.9);
if(gameState!=='BREATHING')throw Error('Mid-pause toggle interrupted active pause');
updateBreathingPause(.1);if(gameState!=='CHALLENGE'||document.body.querySelector('.md-breath-button'))throw Error('Pause failed to finish after flag change');
`,ctx);
console.log('PASS: optional breathing, immediately visible question, blocked answers only, ten visible seconds, full countdown reset, repeated bonus, answer lock, untimed questions, cloak and all realms.');

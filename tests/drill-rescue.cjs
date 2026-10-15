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
const ctx={THREE,Tone:{PolySynth:class{constructor(){this.volume={};}toDestination(){return this;}},Synth:{},context:{state:'suspended'}},document,window:{innerWidth:1200,innerHeight:800,addEventListener(name,fn){handlers[name]=fn;}},requestAnimationFrame(){},setTimeout(){},setInterval(){ctx.intervalStarts=(ctx.intervalStarts||0)+1;},clearInterval(){},console};
let opened;ctx.DrillHost={open(id,options){opened={id,...options};return Promise.resolve();}};vm.createContext(ctx);for(const file of ['math-dialog.js','presets.js','examples/number-entry.js'])vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../drill-modals/arithmetic',file),'utf8'),ctx);vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../dist/maze.js'),'utf8'),ctx);vm.runInContext(src,ctx);
vm.runInContext(`
const friend=interactables.find(o=>o.userData.type==='npc_gate'&&!o.userData.realm);
if(!friend)throw Error('Missing Earth friend');
gameState='PLAYING';keys.up=true;const beforeScore=score;
triggerChallenge(friend);
if(gameState!=='CHALLENGE'||currentChallenge!==null||keys.up)throw Error('Did not pause for reading');
`,ctx);
assert.equal(opened.id,'hebrew-reading');assert.equal(opened.dismissible,false);assert.equal(opened.context.gameLevel,1);assert.equal(opened.params.wordIndex,0);
opened.onCancel();
vm.runInContext(`if(gameState!=='PLAYING'||friend.userData.cleared||score!==beforeScore)throw Error('Cancellation granted reward');simulationTime+=4;triggerChallenge(friend);`,ctx);
opened.onComplete();opened.onComplete();
vm.runInContext(`if(!friend.userData.cleared||score!==beforeScore+15||friendsRescued!==1||!powerups.superJump)throw Error('Rescue reward not exactly once');`,ctx);
ctx.testOpened=()=>opened;ctx.completeReading=()=>{opened.onComplete();opened.onComplete();};
vm.runInContext(`
function ensure(value,message){if(!value)throw Error(message);}
function solveReading(obstacle,level){
 gameState='PLAYING';const before=readingChallengesCompleted;const savedScore=score;const multiplier=currentRealm==='rainbow'&&rainbowPowers.bonus?2:1;
 triggerChallenge(obstacle);
 const call=testOpened();ensure(call.id==='hebrew-reading'&&call.context.gameLevel===level&&call.context.realm===currentRealm,'Wrong drill or realm metadata');
 ensure(call.params.wordIndex===before&&currentChallenge===null,'Reading sequence reset or math opened');
 completeReading();ensure(obstacle.userData.cleared&&readingChallengesCompleted===before+1,'Completion not exactly once');
 ensure(score===savedScore+(obstacle.userData.config?.score??10)*multiplier,'Reward changed');
 if(gameState==='POWERUP')window.continueFromPowerup();
}
activateSpaceRealm();
for(const gate of bridgeCheckpoints)solveReading(gate,1);
ensure(bridgeCheckpoints.every(g=>g.userData.cleared&&g.userData.deck.visible),'Moon bridges still locked');
resetRealmPowers('moon');
for(const friend of npcList.filter(f=>f.realm==='moon'))solveReading(friend.gate,2);
ensure(friendsRescued===8&&powerups.superJump&&powerups.godMode,'Moon rewards missing');
resetRealmPowers('rainbow');
for(const friend of npcList.filter(f=>f.realm==='rainbow'))solveReading(friend.gate,3);
ensure(Object.values(rainbowPowers).every(Boolean),'Rainbow powers missing');
for(const gate of rainbowGates)solveReading(gate,3);
solveReading(interactables.find(o=>o.userData.realm==='rainbow'&&o.userData.final),3);
ensure(rainbowWorld.complete,'Maze portal still locked');
gameState='PLAYING';enterMaze();window.continueFromPowerup();
for(const friend of mazeWorld.friends)solveReading(friend.gate,4);
ensure(mazeWorld.rescued===8&&Object.values(mazePowers).every(Boolean),'Maze rescues/powers missing');
solveReading(mazeWorld.exit,4);ensure(gameState==='MAZE_COMPLETE','Maze cannot finish');
for(const realm of ['earth','moon','rainbow','maze']){
 currentRealm=realm;gameState='PLAYING';const obstacle={userData:{type:realm==='maze'?'maze_chest':'math_block',realm,name:'Ordinary challenge'}};
 triggerChallenge(obstacle);ensure(currentChallenge&&challengeDialog.isOpen,'Ordinary math changed');challengeDialog.hide();
}
`,ctx);
// Physical keys: shortcuts work with Hebrew keyboard layouts and optional hyphens.
function typeWord(word){for(const char of word)handlers.keydown({code:char==='-'?'Minus':'Key'+char.toUpperCase()});}
vm.runInContext("gameState='PLAYING';resetRealmPowers('moon')",ctx);typeWord('powers');
assert(vm.runInContext('Object.values(powerups).every(Boolean)',ctx));
vm.runInContext("resetRealmPowers('rainbow')",ctx);typeWord('p-o-w-e-r-s');
assert(vm.runInContext('Object.values(rainbowPowers).every(Boolean)&&rainbowTimers.gust===0',ctx));
vm.runInContext("rainbowGates.forEach(g=>g.userData.cleared=false);rainbowWorld.complete=false",ctx);typeWord('gates');
assert(vm.runInContext('rainbowWorld.complete&&rainbowGates.every(g=>g.userData.cleared)',ctx));
vm.runInContext("enterMaze();window.continueFromPowerup();mazeWorld.used={map:true};mazeWorld.cooldowns.echo=20",ctx);typeWord('powers');
assert(vm.runInContext('Object.values(mazePowers).every(Boolean)&&!mazeWorld.used.map&&mazeWorld.cooldowns.echo===0&&mazeWorld.timers.echo===0',ctx));
vm.runInContext("mazeWorld.rescued=0;mazeWorld.completed=false;mazeWorld.exit.userData.cleared=false",ctx);typeWord('gates');
assert(vm.runInContext('mazeWorld.exitUnlocked&&mazeWorld.rescued===0',ctx));
vm.runInContext("playerGroup.position.set(mazeWorld.exit.position.x,MAZE_Y,mazeWorld.exit.position.z);stepMaze(1/60,0);if(gameState!=='MAZE_COMPLETE')throw Error('Gate shortcut did not allow exit');",ctx);
vm.runInContext("gameState='CHALLENGE';mazePowers.map=false",ctx);typeWord('powers');assert.equal(vm.runInContext('mazePowers.map',ctx),false);
console.log('PASS: Hebrew friends and locks in all worlds, sequential words, exact-once powers/rewards, maze completion, ordinary math retained, realm-specific testing shortcuts.');

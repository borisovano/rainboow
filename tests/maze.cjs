const fs=require('fs'), vm=require('vm'), assert=require('assert');
const html=fs.readFileSync(require('path').join(__dirname,'../dist/index.html'),'utf8');
const src=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
new vm.Script(src);
class V {constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z});}set(x,y,z){Object.assign(this,{x,y,z});return this;}addScalar(n){this.x+=n;this.y+=n;this.z+=n;}lerp(){}}
let objectId=0;
class Obj {constructor(geometry,material){this.material=material;this.id=++objectId;this.position=new V;this.rotation=new V;this.scale=new V(1,1,1);this.children=[];this.userData={};}add(...x){this.children.push(...x);}setAttribute(){}setIndex(){}computeVertexNormals(){}lookAt(){}setSize(){}render(){}updateProjectionMatrix(){} }
const THREE=new Proxy({Vector3:V,Clock:class{getDelta(){return 1/60;}},WebGLRenderer:class extends Obj{constructor(){super();this.shadowMap={};this.domElement=document.createElement("canvas");}},Color:class{lerpColors(){return this;}},CanvasTexture:class{constructor(){this.repeat={set(){}};}}},{get:(o,k)=>o[k]||Obj});
const document=require('./helpers/dom.cjs').createDocument({autocreate:true});
const ctx={THREE,Tone:{PolySynth:class{constructor(){this.volume={};}toDestination(){return this;}},Synth:{},context:{state:'suspended'}},document,window:{innerWidth:1200,innerHeight:800,addEventListener(){}},requestAnimationFrame(){},setTimeout(fn){(ctx.pending??=[]).push(fn);},setInterval(){ctx.intervalStarts=(ctx.intervalStarts||0)+1;},clearInterval(){},console};
vm.createContext(ctx);for(const file of ['math-dialog.js','presets.js','examples/number-entry.js'])vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../dist/dialogs',file),'utf8'),ctx);vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../dist/maze.js'),'utf8'),ctx);vm.runInContext(src,ctx);
vm.runInContext(`
function ensure(value,message){if(!value)throw Error(message);}
for(let seed=0;seed<100;seed++){
 const graph=new MazeLayout(11,seed),route=graph.route(0,graph.exit);
 ensure(graph.distances(0).every(d=>d>=0),'Disconnected maze');
 ensure(new Set(Array.from({length:8},(_,i)=>route[Math.max(2,Math.floor((i+1)*.105*(route.length-1)))])).size===8,'Friends overlap');
 for(const c of graph.cells)for(let d=0;d<4;d++){const n=graph.adjacent(c.id).find(v=>v.dir===d);if(n)ensure(c.walls[d]===graph.cells[n.id].walls[(d+2)%4],'Asymmetric wall');else ensure(c.walls[d],'Open boundary');}
}
openMoonShortcut();powerups.superJump=true;rainbowPowers.dash=true;gameState='PLAYING';currentRealm='rainbow';playerGroup.position.set(mazePortal.x,rainbowWorld.height,mazePortal.z);
updateMazePortal(0);ensure(currentRealm==='rainbow','Portal opened before rainbow finale');
rainbowWorld.complete=true;updateMazePortal(0);
ensure(currentRealm==='maze'&&gameState==='POWERUP'&&!Object.values(powerups).some(Boolean)&&!Object.values(rainbowPowers).some(Boolean),'Realm power reset');
ensure(mazeWorld.friends.length===8&&mazeWorld.guards.length===5,'Population');
window.continueFromPowerup();
playerGroup.position.set(mazeWorld.exit.position.x,MAZE_Y,mazeWorld.exit.position.z);stepMaze(1/60,0);ensure(gameState==='PLAYING'&&!mazeWorld.exit.userData.cleared,'Exit opens without rescuing friends');
for(const w of mazeWorld.walls)ensure(!mazeCanStand(w.x,w.z),'Wall collision');
const wall=mazeWorld.walls.find(w=>!w.boundary),horizontal=wall.dir%2===0;
playerGroup.position.set(wall.x-(horizontal?0:4),MAZE_Y,wall.z-(horizontal?4:0));
const before=JSON.stringify(playerGroup.position);mazeMove(playerGroup,horizontal?0:8,horizontal?8:0);
ensure(horizontal?playerGroup.position.z<wall.z:playerGroup.position.x<wall.x,'Speed tunneled through wall');
// Rescue order grants eight distinct powers, without depending on a friend's location.
for(let i=0;i<8;i++){
 const f=mazeWorld.friends[7-i];activeObstacle=f.gate;handleSuccess();
 ensure(mazePowers[mazePowerInfo[i][0]]&&mazeWorld.rescued===i+1,'Rescue reward order');
 const saved=score;handleSuccess();ensure(score===saved&&mazeWorld.rescued===i+1,'Repeated reward');window.continueFromPowerup();
}
playerGroup.position.set(wall.x-(horizontal?0:4),MAZE_Y,wall.z-(horizontal?4:0));playerGroup.rotation.y=horizontal?Math.PI:-Math.PI/2;
useMazePower('hammer');ensure(wall.broken&&mazeWorld.used.hammer&&mazeCanStand(wall.x,wall.z),'Hammer failed');
useMazePower('hammer');ensure(mazeWorld.walls.filter(w=>w.broken).length===1,'Hammer reused');
const start=mazePoint(0);playerGroup.position.set(start.x,MAZE_Y,start.z);
useMazePower('map');ensure(mazeWorld.timers.map===30,'Map duration');
updateMazeRealtime(29.9);ensure(mazeWorld.timers.map>0&&document.getElementById('maze-map-panel').classList.contains('active'),'Map early disappearance');
updateMazeRealtime(.1);ensure(mazeWorld.timers.map<.00001,'Map not expired');updateMazeRealtime(.01);
ensure(!document.getElementById('maze-map-panel').classList.contains('active'),'Map stays visible');
useMazePower('map');ensure(mazeWorld.timers.map===0,'Map reusable');
useMazePower('freeze');const positions=JSON.stringify(mazeWorld.guards.map(g=>g.mesh.position));stepMaze(1/60,0);ensure(JSON.stringify(mazeWorld.guards.map(g=>g.mesh.position))===positions,'Frozen guard moves');
useMazePower('lantern');stepMaze(1/60,0);ensure(mazeWorld.chests.every(c=>c.visible),'Hidden chests not revealed');
useMazePower('anchor');ensure(playerGroup.position.x===start.x&&mazeWorld.used.anchor,'Anchor');
useMazePower('echo');ensure(mazeWorld.timers.echo===8,'Echo duration');
mazeWorld.timers.freeze=0;const guard=mazeWorld.guards[0];triggerPredatorChallenge(guard);
ensure(gameState==='BREATHING'&&breathingSecondsLeft===5,'Breathing missing');updateBreathingPause(5);
const button=()=>({classList:{add(){},remove(){}},disabled:false});
checkAnswer(currentChallenge.answer+100,button());checkAnswer(currentChallenge.answer+100,button());
ensure(gameState==='PREDATOR_CHALLENGE'&&mazeEncounterMistakes===2,'Two allowed mistakes');
checkAnswer(currentChallenge.answer,button());ensure(gameState==='PREDATOR_TRANSITION'&&mazeQuestionsSolved===1,'First question did not advance');
`,ctx);
while(ctx.pending?.length)ctx.pending.shift()();
vm.runInContext(`
ensure(gameState==='PREDATOR_CHALLENGE'&&predatorTimeLeft===30&&mazeEncounterMistakes===2,'Second question reset errors or time');
checkAnswer(currentChallenge.answer,{disabled:false,classList:{add(){},remove(){}}});
`,ctx);
while(ctx.pending?.length)ctx.pending.shift()();
vm.runInContext(`
ensure(gameState==='PREDATOR_DEATH','Two correct answers did not defeat guard');
gameState='PLAYING';triggerPredatorChallenge(mazeWorld.guards[1]);updateBreathingPause(5);
for(let i=0;i<3;i++)checkAnswer(currentChallenge.answer+100,{disabled:false,classList:{add(){},remove(){}}});
ensure(gameState==='PREDATOR_FAILURE','Third mistake did not fail');
`,ctx);
while(ctx.pending?.length)ctx.pending.shift()();
vm.runInContext(`
ensure(gameState==='PLAYER_DEATH','Failure did not finish');
gameState='PLAYING';triggerPredatorChallenge(mazeWorld.guards[2]);updateBreathingPause(5);
ensure(mazeGuardTimeout()&&mazeGuardTimeout()&&!mazeGuardTimeout(),'Timeout allowance');
gameState='PLAYING';activeObstacle=mazeWorld.exit;handleSuccess();ensure(gameState==='MAZE_COMPLETE'&&mazeWorld.completed,'Exit victory');
`,ctx);
console.log('PASS: 100 connected mazes, border integrity, eight unique reachable rescues, wall collision at high speed, eight rewards, one-wall limit, 30-second one-use map, freeze, lantern, anchor, echo, breathing, two-question challenge, two mistakes/timeouts, third failure, victory.');

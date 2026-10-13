const fs=require('fs'), vm=require('vm'), assert=require('assert');
const html=fs.readFileSync(require('path').join(__dirname,'../dist/index.html'),'utf8');
const src=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
new vm.Script(src);
class V {constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z});}set(x,y,z){Object.assign(this,{x,y,z});return this;}addScalar(n){this.x+=n;this.y+=n;this.z+=n;}lerp(){}}
let objectId=0;
class Obj {constructor(geometry,material){this.material=material;this.id=++objectId;this.position=new V;this.rotation=new V;this.scale=new V(1,1,1);this.children=[];this.userData={};}add(...x){this.children.push(...x);}setAttribute(){}setIndex(){}computeVertexNormals(){}lookAt(){}setSize(){}render(){}updateProjectionMatrix(){} }
const THREE=new Proxy({Vector3:V,Clock:class{getDelta(){return 1/60;}},WebGLRenderer:class extends Obj{constructor(){super();this.shadowMap={};}},Color:class{lerpColors(){return this;}},CanvasTexture:class{constructor(){this.repeat={set(){}};}}},{get:(o,k)=>o[k]||Obj});
const els={};const element=()=>({style:{},classList:{add(){},remove(){}},appendChild(){},addEventListener(){},getContext:()=>({fillRect(){},beginPath(){},arc(){},fill(){}})});
const ctx={THREE,Tone:{PolySynth:class{constructor(){this.volume={};}toDestination(){return this;}},Synth:{},context:{state:'suspended'}},document:{getElementById:id=>els[id]??=element(),createElement:element,querySelector:()=>element(),querySelectorAll:()=>[]},window:{innerWidth:1200,innerHeight:800,addEventListener(){}},requestAnimationFrame(){},setTimeout(){},setInterval(){},clearInterval(){},console};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../dist/maze.js'),'utf8'),ctx);vm.runInContext(src,ctx);
vm.runInContext(`
openMoonShortcut();resetRealmPowers('rainbow');gameState='PLAYING';
const friends=npcList.filter(n=>n.realm==='rainbow'),clouds=predators.filter(p=>p.isCloud);
if(friends.length!==8||clouds.length!==10)throw Error('Missing friends/clouds');
for(let i=0;i<8;i++) {
 activeObstacle=friends[i].gate;handleSuccess();
 if(Object.values(rainbowPowers).filter(Boolean).length!==i+1||!friends[i].isFree||Object.values(powerups).some(Boolean))throw Error('Distinct rescue reward failed');
 gameState='PLAYING';
}
const saved=score;addScore(15);if(score!==saved+30)throw Error('Double score failed');
const cloud=clouds[0],location=rainbowPoint(2.8);
playerGroup.position.set(location.x,rainbowWorld.height,location.z);
clouds.forEach(p=>p.active=false);cloud.active=true;
placeCloudWithinRainbow(cloud,location.x+12,location.z);
useRainbowPower('gust');const d=Math.hypot(cloud.mesh.position.x-location.x,cloud.mesh.position.z-location.z);
if(d<25||rainbowTimers.gust!==8)throw Error('Wind failed');
useRainbowPower('gust');if(rainbowTimers.gust!==8)throw Error('Cooldown bypass');
useRainbowPower('dash');if(rainbowTimers.dashActive!==2||rainbowTimers.dash!==6)throw Error('Dash missing');
updateRainbowPowers(2.1);if(rainbowTimers.dashActive!==0||rainbowTimers.dash<=0)throw Error('Dash duration failed');
useRainbowPower('cloak');triggerPredatorChallenge(cloud);if(gameState!=='PLAYING')throw Error('Cloaked player caught');
updateRainbowPowers(4.1);if(rainbowTimers.cloakActive!==0)throw Error('Cloak duration');
triggerPredatorChallenge(cloud);if(gameState!=='BREATHING')throw Error('Missing breathing pause');updateBreathingPause(BREATHING_PAUSE_SECONDS);if(gameState!=='PREDATOR_CHALLENGE'||predatorTimeLeft!==45)throw Error('Extra time failed');
const buttons=[{textContent:String(currentChallenge.answer),style:{}},{textContent:String(currentChallenge.answer+1),style:{}},{textContent:String(currentChallenge.answer+2),style:{}}];
document.querySelectorAll=()=>buttons;applyRainbowHint();
if(buttons[0].disabled||buttons.filter(b=>b.disabled).length!==1)throw Error('Hint removes wrong choice');
gameState='PLAYING';placeCloudWithinRainbow(cloud,location.x+10,location.z);const beforeSun=score;
useRainbowPower('sun');if(cloud.active||cloud.mesh.visible!==false||score!==beforeSun+10||rainbowTimers.sun!==10)throw Error('Sun failed');
// Pursuit stays within the curved world; invisibility suppresses pursuit.
const chase=clouds[1];chase.active=true;placeCloudWithinRainbow(chase,location.x+25,location.z);
const before=Math.hypot(chase.mesh.position.x-location.x,chase.mesh.position.z-location.z);
interactables.forEach(o=>o.userData.cleared=true);isJumping=false;stepGame();
if(Math.hypot(chase.mesh.position.x-location.x,chase.mesh.position.z-location.z)>=before||!inRainbowArena(chase.mesh.position.x,chase.mesh.position.z))throw Error('Cloud chase failed');
// Glide uses a capped descent, not the Moon super-jump.
predators.forEach(p=>p.active=false);playerGroup.position.y=rainbowWorld.height+15;isJumping=true;playerVelocityY=-1;
const oldY=playerGroup.position.y;stepGame();if(Math.abs(oldY-playerGroup.position.y-.12)>.001)throw Error('Glide failed');
resetRealmPowers('moon');if(Object.values(rainbowPowers).some(Boolean)||Object.values(rainbowTimers).some(Boolean)||bodyMat.opacity!==1)throw Error('Realm reset leaked powers');
`,ctx);
console.log('PASS: 10 chasing clouds, eight distinct rewards without old powers, double score, gust, dash, cloak, 45-second timer, hint, sun attack, glide, bounds, and realm reset.');

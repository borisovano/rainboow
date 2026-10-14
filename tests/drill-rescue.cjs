const fs=require('fs'), vm=require('vm'), assert=require('assert');
const html=fs.readFileSync(require('path').join(__dirname,'../dist/index.html'),'utf8');
const src=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
new vm.Script(src);
class V {constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z});}set(x,y,z){Object.assign(this,{x,y,z});return this;}addScalar(n){this.x+=n;this.y+=n;this.z+=n;}lerp(){}}
let objectId=0;
class Obj {constructor(geometry,material){this.material=material;this.id=++objectId;this.position=new V;this.rotation=new V;this.scale=new V(1,1,1);this.children=[];this.userData={};}add(...x){this.children.push(...x);}setAttribute(){}setIndex(){}computeVertexNormals(){}lookAt(){}setSize(){}render(){}updateProjectionMatrix(){} }
const THREE=new Proxy({Vector3:V,Clock:class{getDelta(){return 1/60;}},WebGLRenderer:class extends Obj{constructor(){super();this.shadowMap={};this.domElement=document.createElement("canvas");}},Color:class{lerpColors(){return this;}},CanvasTexture:class{constructor(){this.repeat={set(){}};}}},{get:(o,k)=>o[k]||Obj});
const document=require('./helpers/dom.cjs').createDocument({autocreate:true});
const ctx={THREE,Tone:{PolySynth:class{constructor(){this.volume={};}toDestination(){return this;}},Synth:{},context:{state:'suspended'}},document,window:{innerWidth:1200,innerHeight:800,addEventListener(){}},requestAnimationFrame(){},setTimeout(){},setInterval(){ctx.intervalStarts=(ctx.intervalStarts||0)+1;},clearInterval(){},console};
let opened;ctx.DrillHost={open(id,options){opened={id,...options};return Promise.resolve();}};vm.createContext(ctx);for(const file of ['math-dialog.js','presets.js','examples/number-entry.js'])vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../drill-modals/arithmetic',file),'utf8'),ctx);vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../dist/maze.js'),'utf8'),ctx);vm.runInContext(src,ctx);
vm.runInContext(`
const friend=interactables.find(o=>o.userData.type==='npc_gate'&&!o.userData.realm);
if(!friend)throw Error('Missing Earth friend');
gameState='PLAYING';keys.up=true;const beforeScore=score;
triggerChallenge(friend);
if(gameState!=='CHALLENGE'||currentChallenge!==null||keys.up)throw Error('Did not pause for reading');
`,ctx);
assert.equal(opened.id,'hebrew-reading');assert.equal(opened.context.gameLevel,1);assert.equal(opened.params.wordIndex,0);
opened.onCancel();
vm.runInContext(`if(gameState!=='PLAYING'||friend.userData.cleared||score!==beforeScore)throw Error('Cancellation granted reward');simulationTime+=4;triggerChallenge(friend);`,ctx);
opened.onComplete();opened.onComplete();
vm.runInContext(`if(!friend.userData.cleared||score!==beforeScore+15||friendsRescued!==1||!powerups.superJump)throw Error('Rescue reward not exactly once');
gameState='PLAYING';currentRealm='moon';const moonFriend={userData:{type:'npc_gate',realm:'moon',name:'Moon friend'}};triggerChallenge(moonFriend);if(!currentChallenge||!challengeDialog.isOpen)throw Error('Moon math changed');`,ctx);
console.log('PASS: Earth friends open reading, cancel has no reward, successful reading rescues once and grants power, Moon retains math.');

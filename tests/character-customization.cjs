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
let now=1000,nextTimer=0;const timers=new Map(),avatarCalls=[];
const ctx={Date:{now:()=>now},clearTimeout:id=>timers.delete(id),PipPlayerAvatar:{create:()=>({setEnabled:(enabled,id)=>avatarCalls.push({enabled,id}),update(){}})},THREE,Tone:{PolySynth:class{constructor(){this.volume={};}toDestination(){return this;}},Synth:{},context:{state:'suspended'}},document,window:{innerWidth:1200,innerHeight:800,addEventListener(name,fn){handlers[name]=fn;}},requestAnimationFrame(){},setTimeout(fn){const id=++nextTimer;timers.set(id,fn);return id;},setInterval(){ctx.intervalStarts=(ctx.intervalStarts||0)+1;},clearInterval(){},console};
let opened;ctx.DrillHost={open(id,options){opened={id,...options};return Promise.resolve();}};ctx.GameFeatures=require('../dist/features/flags.js').createStore();vm.createContext(ctx);for(const file of ['math-dialog.js','presets.js','examples/number-entry.js'])vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../drill-modals/math',file),'utf8'),ctx);vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../dist/maze.js'),'utf8'),ctx);vm.runInContext(src,ctx);
const read=code=>vm.runInContext(code,ctx),dialog=document.getElementById('character-customization');
dialog.showModal=()=>dialog.open=true;dialog.close=()=>dialog.open=false;
const button=document.getElementById('customize-character');
function typeWord(word,extra={}){for(const char of word)handlers.keydown({code:char==='-'?'Minus':'Key'+char.toUpperCase(),...extra});}
function flushTimers(){for(const [id,fn] of [...timers]){timers.delete(id);fn();}}
assert.equal(ctx.GameFeatures.enabled('characterCustomization'),true);
assert(button.disabled&&!button.hidden);assert.equal(ctx.window.openCharacterCustomization(),false);
read("gameState='PLAYING';addScore(199)");assert(button.disabled);assert.equal(ctx.window.openCharacterCustomization(),false);
read('addScore(1)');assert.equal(read('score'),200);assert(!button.disabled);assert.equal(read('friendsRescued'),0);
read('keys.up=true');assert.equal(ctx.window.openCharacterCustomization(),true);assert(dialog.open);assert.equal(read('gameState'),'CUSTOMIZING');assert.equal(read('keys.up'),false);
const stopped=read('simulationTime');read('stepGame();animate()');assert.equal(read('simulationTime'),stopped,'Customization freezes simulation time');
typeWord('bibi');assert.equal(read('score'),200,'Shortcuts do not fire in the picker');
read("selectCustomization('luna')");ctx.window.applyCharacterCustomization();assert.equal(read('customizedCharacter'),'luna');assert.deepEqual(avatarCalls.at(-1),{enabled:true,id:'luna'});assert.equal(read('gameState'),'PLAYING');assert(!dialog.open);assert.equal(read('score'),200,'Customization does not spend points');
ctx.window.openCharacterCustomization();read("selectCustomization('moss')");ctx.window.closeCharacterCustomization();assert.equal(read('customizedCharacter'),'luna','Cancel keeps the current character');
ctx.window.openCharacterCustomization();ctx.GameFeatures.setOverride('characterCustomization',false);assert(button.hidden);assert(!dialog.open);assert.equal(read('gameState'),'PLAYING');assert.equal(avatarCalls.at(-1).enabled,false);assert.equal(ctx.window.openCharacterCustomization(),false);
ctx.GameFeatures.setOverride('characterCustomization',true);assert(!button.hidden);assert.equal(avatarCalls.at(-1).id,'luna');
read("score=0;refreshCharacterCustomization();gameState='PLAYING';resetRealmPowers('rainbow');rainbowPowers.bonus=true");typeWord('bibi');assert.equal(read('score'),1000,'Testing points ignore the rainbow multiplier');assert(!button.disabled);assert.equal(read('movementSpeedMultiplier'),1);
typeWord('b-i-b-i');assert.equal(read('score'),2000,'Repeat code adds another 1000');typeWord('abubu');assert.equal(read('movementSpeedMultiplier'),5);assert.equal(read('score'),2000,'Speed shortcut does not also award points');
typeWord('bubu');assert.equal(read('score'),2000,'The old points code no longer awards points');
typeWord('bibi',{repeat:true});typeWord('bibi',{ctrlKey:true});assert.equal(read('score'),2000,'Held or modified keys do not award points');
typeWord('bi');now+=2100;typeWord('bi');assert.equal(read('score'),2000,'Timed-out code fragments do not match');
read("gameState='CHALLENGE'");typeWord('bibi');assert.equal(read('score'),2000);
read("gameState='PLAYING';enterMaze();window.continueFromPowerup();mazeWorld.timers.map=30");ctx.window.openCharacterCustomization();read('animate()');assert.equal(read('mazeWorld.timers.map'),30,'The maze map countdown freezes while customizing');ctx.window.closeCharacterCustomization();
let hammers=0;ctx.recordHammer=()=>hammers++;read("useMazePower=key=>{if(key==='hammer')recordHammer();}");typeWord('bibi');flushTimers();assert.equal(hammers,0,'Typing bibi cannot spend the one-wall power');
typeWord('b');flushTimers();assert.equal(hammers,1,'A lone B still uses the maze hammer after the shortcut window');
console.log('PASS: 200-point boundary, default-on flag, four choices, pause/resume, cancel, live flag changes, exact testing points, shortcut collisions, modal guards, map pause and maze hammer key.');

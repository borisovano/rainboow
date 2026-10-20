const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../dist/index.html'),'utf8');
const loop=html.slice(html.indexOf('    const clock = new THREE.Clock();'),html.indexOf('    function stepGame()'));
for(const fps of [30,60,120,144]) {
  const updates=[];
  const context={THREE:{Clock:class{getDelta(){return 1/fps;}}},window:{addEventListener(){}},document:{hidden:false},requestAnimationFrame(){},updateMazeRealtime(){},updateBreathingPause(){},renderer:{render(){}},scene:{},camera:{},playerGroup:{position:{x:0,z:0}},gameState:'PLAYING',currentRealm:'earth',rainbowTimers:{cloakActive:0},isJumping:false,pipAvatar:{update:value=>updates.push(value)},walk:true};
  vm.createContext(context);vm.runInContext(loop+'\nfunction stepGame(){simulationTime+=1/60;if(walk)playerGroup.position.z-=.2;}',context);
  vm.runInContext(`for(let i=0;i<${fps};i++)animate();`,context);
  const firstMoving=updates.findIndex(update=>update.moving);assert(firstMoving>=0);
  assert(updates.slice(firstMoving).every(update=>update.moving),fps+' Hz must not alternate Idle/Walk between physics ticks');
  assert(updates.slice(firstMoving).every(update=>Math.abs(update.speed-12)<.001));
  context.walk=false;vm.runInContext('for(let i=0;i<6;i++)animate();',context);assert.equal(updates.at(-1).moving,false,'Stopping returns to Idle');
}
console.log('PASS: actual game animation loop stays walking at 30/60/120/144 Hz and returns to idle after stopping.');

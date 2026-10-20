import * as THREE from 'three';
import { OrbitControls } from './vendor/addons/controls/OrbitControls.js';
import { GLTFLoader } from './vendor/addons/loaders/GLTFLoader.js';

const stage = document.querySelector('#stage');
const status = document.querySelector('#model-state');
const fallback = document.querySelector('#fallback');
const canvas = document.querySelector('#model');
const pauseButton = document.querySelector('#pause');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let paused = reducedMotion;
let activeName = 'Idle';
let mixer, model, renderer, controls;
const actions = new Map();
const descriptions={pip:'A round lavender explorer with a full, curved belly and back.',moss:'A mint-green rounded-square monster with soft horns.',sunny:'An apricot pear-shaped explorer with a three-piece tuft.',luna:'A sky-blue star with five rounded points.'};
const picker=document.querySelector('#character-select');
let character=Object.hasOwn(descriptions,new URLSearchParams(location.search).get('character'))?new URLSearchParams(location.search).get('character'):GameFeatures.globalParams().character;
picker.value=character;
const characterName=()=>character[0].toUpperCase()+character.slice(1);
const reportPlayback = () => {
  status.textContent = `${characterName()} · ${paused ? 'Paused' : 'Playing'} · ${activeName}`;
  pauseButton.textContent = paused ? 'Play' : 'Pause';
};
function fail(error) {
  console.error('Character preview:', error);
  stage.classList.add('failed');
  fallback.hidden = false;
  status.textContent = '3D preview unavailable. The render and downloads are still here.';
  document.querySelectorAll('[data-clip], [data-view], #pause, #speed, #wireframe, #rotate').forEach(control => control.disabled = true);
  renderer?.setAnimationLoop(null);
}

try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#e9eddf');
  scene.fog = new THREE.Fog('#e9eddf', 16, 32);
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 60);
  camera.position.set(5.3, 3.8, 9);
  controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 2.05, 0);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 6;
  controls.maxDistance = 17;
  controls.minPolarAngle = 0.25;
  controls.maxPolarAngle = Math.PI / 2.05;
  controls.autoRotateSpeed = 1.2;
  controls.update();
  scene.add(new THREE.HemisphereLight('#fff9ef', '#7f9278', 2.2));
  const key = new THREE.DirectionalLight('#fff5e8', 3.3);
  key.position.set(-4, 7, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -5, right: 5, top: 7, bottom: -4, near: 0.5, far: 24 });
  key.shadow.normalBias = 0.025;
  key.shadow.radius = 4;
  key.shadow.bias = -0.0001;
  scene.add(key);
  const fill = new THREE.DirectionalLight('#e4dfff', 1.5);
  fill.position.set(5, 3, -3);
  scene.add(fill);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: '#e9eddf', roughness: 1 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.02;
  floor.receiveShadow = true;
  scene.add(floor);

  const resize = () => {
    const { width, height } = stage.getBoundingClientRect();
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(stage);
  resize();

  let loadToken=0;
  async function loadCharacter(id){
    const token=++loadToken;character=id;picker.value=id;
    const name=characterName();status.textContent='Loading '+name+'…';
    stage.classList.remove('failed');fallback.src='./assets/'+id+'-render.png';fallback.alt=name+' rendered in 3D';fallback.hidden=false;
    document.querySelector('#model-name').textContent=name;document.querySelector('#character-name').textContent=name;
    document.querySelector('#character-description').textContent=descriptions[id];
    document.querySelector('#concept').src='../assets/'+id+'.png';document.querySelector('#concept').alt=name+' original concept';
    document.querySelector('#download-glb').href='./assets/'+id+'.glb';document.querySelector('#download-blend').href='./source/'+id+'.blend';
    document.querySelector('#use-character').textContent='Use '+name+' in game';
    document.querySelector('#triangle-count').textContent='—';document.querySelector('#model-size').textContent='—';
    document.querySelectorAll('[data-clip], [data-view], #pause, #speed, #wireframe, #rotate').forEach(control=>control.disabled=true);
    if(model){mixer.stopAllAction();mixer.uncacheRoot(model);scene.remove(model);dispose(model);model=null;mixer=null;actions.clear();}
    try{
      const gltf=await new GLTFLoader().loadAsync('./assets/'+id+'.glb');
      if(token!==loadToken){dispose(gltf.scene);return;}
      model=gltf.scene;model.traverse(object=>{if(object.isMesh){object.castShadow=true;object.receiveShadow=true;object.material.wireframe=document.querySelector('#wireframe').checked;}});
      scene.add(model);mixer=new THREE.AnimationMixer(model);mixer.timeScale=Number(document.querySelector('#speed').value);
      for(const clip of gltf.animations)actions.set(clip.name,mixer.clipAction(clip));
      for(const name of ['Idle','Walk','Jump','Wave'])if(!actions.has(name))throw Error('Missing animation: '+name);
      actions.get(activeName).reset().play();mixer.update(0);
      document.querySelectorAll('[data-clip], [data-view], #pause, #speed, #wireframe, #rotate').forEach(control=>control.disabled=false);
      fallback.hidden=true;reportPlayback();
      const report=await fetch('./assets/'+id+'-info.json').then(r=>r.json());
      if(token!==loadToken)return;
      document.querySelector('#triangle-count').textContent=(report.triangles/1000).toFixed(1)+'k';document.querySelector('#model-size').textContent=Math.round(report.glbBytes/1024)+' KB';
    }catch(error){if(token===loadToken){console.error(error);status.textContent='Could not load '+name+'. Select another character to retry.';stage.classList.add('failed');fallback.hidden=false;}}
  }
  function dispose(object){const materials=new Set();object.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}});for(const m of materials)m.dispose();}
  picker.addEventListener('change',()=>{const url=new URL(location.href);url.searchParams.set('character',picker.value);history.replaceState(null,'',url);loadCharacter(picker.value);});
  document.querySelector('#use-character').addEventListener('click',()=>{
    GameFeatures.setGlobalParams({...GameFeatures.globalParams(),character});GameFeatures.setOverride('pipCharacter',true);
    document.querySelector('#selection-status').textContent=GameFeatures.isPersistent()?characterName()+' selected. 3D characters enabled. Open game tabs update automatically.':'Selection is temporary because browser storage is unavailable.';
  });
  await loadCharacter(character);

  document.querySelectorAll('[data-clip]').forEach(button => button.addEventListener('click', () => {
    mixer.stopAllAction();
    activeName = button.dataset.clip;
    actions.get(activeName).reset().play();
    mixer.update(0);
    document.querySelectorAll('[data-clip]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    reportPlayback();
  }));
  pauseButton.addEventListener('click', () => { paused = !paused; reportPlayback(); });
  document.querySelector('#speed').addEventListener('change', event => { mixer.timeScale = Number(event.target.value); });
  document.querySelector('#wireframe').addEventListener('change', event => {
    model.traverse(object => {
      if (!object.isMesh) return;
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) material.wireframe = event.target.checked;
    });
  });
  const rotate = document.querySelector('#rotate');
  rotate.addEventListener('click', () => {
    controls.autoRotate = !controls.autoRotate;
    rotate.setAttribute('aria-pressed', String(controls.autoRotate));
  });
  const views = { front: [0, 3.25, 10.5], angle: [5.3, 3.8, 9], side: [10.5, 3.25, 0], back: [0, 3.25, -10.5] };
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {
    controls.autoRotate = false;
    rotate.setAttribute('aria-pressed', 'false');
    // Clear pending orbit damping before a precise camera preset.
    controls.enableDamping = false;
    controls.update();
    camera.position.set(...views[button.dataset.view]);
    controls.target.set(0, 2.05, 0);
    controls.update();
    controls.enableDamping = true;
  }));
  let previousTime = performance.now();
  renderer.setAnimationLoop(time => {
    const delta = Math.min(Math.max((time - previousTime) / 1000, 0), 0.05);
    previousTime = time;
    if (document.hidden) return;
    if (!paused && mixer) mixer.update(delta);
    controls.update(delta);
    renderer.render(scene, camera);
  });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    fail(new Error('Graphics context lost; reload to restore the preview.'));
  });
} catch (error) { fail(error); }

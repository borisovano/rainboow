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
const reportPlayback = () => {
  status.textContent = `${paused ? 'Paused' : 'Playing'} · ${activeName}`;
  pauseButton.textContent = paused ? 'Play' : 'Pause';
};
function fail(error) {
  console.error('Pip preview:', error);
  stage.classList.add('failed');
  fallback.hidden = false;
  status.textContent = '3D preview unavailable. Pip’s render and downloads are still here.';
  document.querySelectorAll('button, select, input').forEach(control => control.disabled = true);
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

  const gltf = await new GLTFLoader().loadAsync('./assets/pip.glb');
  model = gltf.scene;
  model.traverse(object => {
    if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; }
  });
  scene.add(model);
  mixer = new THREE.AnimationMixer(model);
  for (const clip of gltf.animations) actions.set(clip.name, mixer.clipAction(clip));
  for (const name of ['Idle', 'Walk', 'Jump', 'Wave']) {
    if (!actions.has(name)) throw new Error(`Missing ${name} animation`);
  }
  actions.get(activeName).play();
  document.querySelectorAll('button, select, input').forEach(control => control.disabled = false);
  fallback.hidden = true;
  reportPlayback();

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
    if (!paused) mixer.update(delta);
    controls.update(delta);
    renderer.render(scene, camera);
  });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    fail(new Error('Graphics context lost; reload to restore the preview.'));
  });
} catch (error) { fail(error); }

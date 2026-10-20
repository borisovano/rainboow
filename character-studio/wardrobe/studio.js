import * as THREE from 'three';
import { OrbitControls } from '../3d/vendor/addons/controls/OrbitControls.js';
import { GLTFLoader } from '../3d/vendor/addons/loaders/GLTFLoader.js';

const W=window.CharacterWearables,$=id=>document.getElementById(id),query=new URLSearchParams(location.search);
const inGame=query.get('mode')==='game'&&parent!==window,session=query.get('session');
const saved=inGame?null:W.readPreset(window),initial={...saved,...Object.fromEntries(query)};
let character=W.characters.includes(initial.character)?initial.character:'pip',outfit=W.sanitize(initial),ready=false,walking=false,loadToken=0;
const title=id=>id[0].toUpperCase()+id.slice(1),he={glasses:'משקפיים',goggles:'משקפי סיירים',crown:'כתר כוכב',beanie:'כובע צמר',headphones:'אוזניות',wizard:'כובע קסמים',bowtie:'פפיון',tie:'עניבת ברק',necklace:'שרשרת ירח',scarf:'צעיף קשת',medal:'מדליה',bandana:'בנדנה'};
const name=item=>inGame?he[item.id]:item.name;
function post(type,design){parent.postMessage({type,session,design},location.origin);}
if(inGame){
  document.documentElement.lang='he';document.documentElement.dir='rtl';
  for(const [id,text] of Object.entries({'fit-label':'אביזרים בתלת־ממד','character-title':'דמות','upper-title':'ראש ועיניים','lower-title':'צוואר וחזה','clear-upper':'הסרה','clear-lower':'הסרה',front:'מקדימה',back:'מאחור',rotate:'סיבוב',walk:'הליכה',apply:'ללבוש ולחזור למשחק',cancel:'ביטול','save-status':'המשחק ממתין בזמן העיצוב.','preview-hint':'גררו לסיבוב · גללו או צבטו להגדלה'}))$(id).textContent=text;
  $('cancel').hidden=false;$('cancel').onclick=()=>post('wardrobe:cancel');
  window.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();post('wardrobe:cancel');}});
}
for(const button of document.querySelectorAll('[data-tab]')){
  if(inGame)button.textContent=({character:'דמות',upper:'ראש ועיניים',lower:'צוואר וחזה'})[button.dataset.tab];
  button.onclick=()=>{document.querySelector('.choices').dataset.active=button.dataset.tab;for(const tab of document.querySelectorAll('[data-tab]'))tab.setAttribute('aria-pressed',String(tab===button));};
}
function paint(){
  for(const button of $('characters').children)button.setAttribute('aria-pressed',String(button.dataset.character===character));
  for(const slot of ['upper','lower'])for(const button of $(slot).children)button.setAttribute('aria-pressed',String(button.dataset.item===outfit[slot]));
  const items=W.catalog.filter(item=>item.id===outfit.upper||item.id===outfit.lower);
  $('outfit-summary').textContent=title(character)+' · '+(items.length?items.map(name).join(' + '):inGame?'ללא אביזרים':'No wearables');
  $('preview-name').textContent=title(character);
}
for(const id of W.characters){
  const button=document.createElement('button'),img=document.createElement('img'),label=document.createElement('span');
  button.dataset.character=id;img.src='../3d/assets/'+id+'-render.png';img.alt='';label.textContent=title(id);button.append(img,label);button.onclick=()=>loadCharacter(id);$('characters').append(button);
}
for(const item of W.catalog){
  const button=document.createElement('button'),img=document.createElement('img'),label=document.createElement('span');
  button.dataset.item=item.id;img.src='../assets/'+item.image+'.png';img.alt='';label.textContent=name(item);button.append(img,label);
  button.onclick=()=>{outfit[item.slot]=outfit[item.slot]===item.id?null:item.id;updateOutfit();};$(item.slot).append(button);
}
for(const slot of ['upper','lower'])$('clear-'+slot).onclick=()=>{outfit[slot]=null;updateOutfit();};
function updateOutfit(){current?.wardrobe.set(outfit);paint();$('save-status').textContent=inGame?'העיצוב מוכן כשתסיימו לבחור.':'Preview only. Save when you are happy with your design.';}
$('apply').onclick=()=>{
  if(!ready)return;
  const design={character,...outfit};
  if(inGame){post('wardrobe:apply',design);return;}
  $('save-status').textContent=W.savePreset(window,design)?'Design saved. It will be waiting in the game studio at 300 points.':'Browser storage is unavailable. This preview is temporary.';
};
let renderer,controls,current,scene,camera;
const cache=new Map(),pending=new Map();
async function loadCharacter(id){
  const token=++loadToken;character=id;ready=false;$('apply').disabled=true;paint();$('model-status').textContent=inGame?'טוען דמות ואביזרים…':'Loading character & wearables…';
  if(!renderer)return;
  try{
    if(!cache.has(id)){
      if(!pending.has(id))pending.set(id,(async()=>{
        const loader=new GLTFLoader(),[gltf,clothes]=await Promise.all([loader.loadAsync('../3d/assets/'+id+'.glb'),loader.loadAsync('../3d/assets/'+id+'-wearables.glb')]);
        const model=gltf.scene,wardrobe=W.attach(model,clothes),mixer=new THREE.AnimationMixer(model),actions=new Map();
        model.traverse(object=>{if(object.isMesh){object.castShadow=true;object.receiveShadow=false;}});
        for(const clip of gltf.animations)actions.set(clip.name,mixer.clipAction(clip));
        if(!actions.has('Idle')||!actions.has('Walk'))throw Error('Character animations missing');
        const resource={model,wardrobe,mixer,actions};cache.set(id,resource);return resource;
      })().finally(()=>pending.delete(id)));
      await pending.get(id);
    }
    if(token!==loadToken)return;
    if(current){current.mixer.stopAllAction();scene.remove(current.model);}
    current=cache.get(id);current.wardrobe.set(outfit);scene.add(current.model);setMotion();
    ready=true;$('apply').disabled=false;$('model-status').textContent=inGame?'אפשר לסובב ולבדוק מכל הצדדים':'Ready · Drag to inspect the fit';
  }catch(error){if(token!==loadToken)return;console.error('Design studio:',error);$('model-status').textContent=inGame?'הטעינה נכשלה. בחרו דמות כדי לנסות שוב.':'Could not load. Select a character to retry.';}
}
function setMotion(){if(!current)return;current.mixer.stopAllAction();current.actions.get(walking?'Walk':'Idle').reset().play();current.mixer.update(0);}
try{
  renderer=new THREE.WebGLRenderer({canvas:$('model'),antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
  scene=new THREE.Scene();scene.background=new THREE.Color('#e9eddf');
  camera=new THREE.PerspectiveCamera(36,1,.1,60);camera.position.set(4,3.3,9.5);
  controls=new OrbitControls(camera,$('model'));controls.target.set(0,2.5,0);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=6;controls.maxDistance=17;controls.maxPolarAngle=Math.PI*.54;controls.autoRotateSpeed=1.1;
  scene.add(new THREE.HemisphereLight('#fff9ef','#7f9278',2.2));
  const key=new THREE.DirectionalLight('#fff5e8',3.3);key.position.set(-4,7,6);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-5,right:5,top:7,bottom:-4,near:.5,far:24});key.shadow.normalBias=.025;scene.add(key);
  const fill=new THREE.DirectionalLight('#e4dfff',1.5);fill.position.set(5,3,-3);scene.add(fill);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(80,80),new THREE.MeshStandardMaterial({color:'#e9eddf',roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.02;floor.receiveShadow=true;scene.add(floor);
  const resize=()=>{const {width,height}=$('stage').getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();};new ResizeObserver(resize).observe($('stage'));resize();
  for(const [id,position] of [['front',[0,3.2,10.3]],['back',[0,3.2,-10.3]]])$(id).onclick=()=>{controls.autoRotate=false;$('rotate').setAttribute('aria-pressed','false');controls.enableDamping=false;controls.update();camera.position.set(...position);controls.update();controls.enableDamping=true;};
  $('rotate').onclick=()=>{controls.autoRotate=!controls.autoRotate;$('rotate').setAttribute('aria-pressed',String(controls.autoRotate));};
  $('walk').onclick=()=>{walking=!walking;$('walk').setAttribute('aria-pressed',String(walking));setMotion();};
  let last=performance.now();const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  renderer.setAnimationLoop(time=>{const delta=Math.min(Math.max((time-last)/1000,0),.05);last=time;if(document.hidden)return;if(current&&(!reducedMotion||walking))current.mixer.update(delta);controls.update(delta);renderer.render(scene,camera);});
  $('model').addEventListener('webglcontextlost',event=>{event.preventDefault();ready=false;$('apply').disabled=true;renderer.setAnimationLoop(null);$('model-status').textContent=inGame?'התצוגה נעצרה. סגרו ופתחו את הסטודיו שוב.':'Preview stopped. Reopen the studio to retry.';});
  loadCharacter(character);
}catch(error){console.error(error);paint();$('model-status').textContent=inGame?'תצוגת תלת־ממד לא זמינה בדפדפן הזה.':'3D preview is unavailable in this browser.';}

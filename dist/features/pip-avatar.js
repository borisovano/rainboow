(function(root,factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../../character-studio/3d/wearables.js'));
  else root.PipPlayerAvatar = factory(root.CharacterWearables);
})(typeof window !== 'undefined' ? window : globalThis,function(Wearables) {
  'use strict';
  const CLIPS = ['Idle','Walk','Jump','Wave'];
  let loaderPromise;
  function browserLoad(THREE,id) {
    if (!loaderPromise) {
      loaderPromise = new Promise((resolve,reject) => {
        if (THREE.GLTFLoader) { resolve(); return; }
        const script = document.createElement('script');
        const timer = setTimeout(() => { script.remove(); reject(new Error('Character loader timed out')); },12000);
        script.src = new URL('vendor/GLTFLoader.r128.js',document.baseURI).href;
        script.onload = () => { clearTimeout(timer); resolve(); };
        script.onerror = () => { clearTimeout(timer); script.remove(); reject(new Error('Character loader unavailable')); };
        document.head.appendChild(script);
      }).catch(error => { loaderPromise = null; throw error; });
    }
    return loaderPromise.then(async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(),12000);
      try {
        const response = await fetch(new URL('character-studio/3d/assets/'+id+'.glb',document.baseURI),{signal:controller.signal});
        if (!response.ok) throw new Error('Character model unavailable');
        const data = await response.arrayBuffer();
        return await new Promise((resolve,reject) => new THREE.GLTFLoader().parse(data,'',resolve,reject));
      } finally { clearTimeout(timer); }
    });
  }
  function create({THREE,rig,classicParts,onStatus=()=>{},load=id=>browserLoad(THREE,id),loadWearables=id=>browserLoad(THREE,id+'-wearables'),onWearablesStatus=()=>{}}) {
    let wanted = false, wantedId='pip', visual = null, mixer = null, active = null, activeName = null;
    let jumpTime = 0, lastState = null, outfit=Wearables.sanitize();
    let actions = new Map(), materials = [];
    const cached=new Map(),pending=new Map();
    function show(enabled) {
      for (const part of classicParts) part.visible = !enabled;
      for(const resource of cached.values())resource.visual.visible=enabled&&resource.visual===visual;
    }
    function prepare(gltf,id) {
      const materials=[],actions=new Map();
      for (const name of CLIPS) if (!gltf.animations.some(clip => clip.name === name)) throw new Error('Missing animation: '+name);
      const bounds = new THREE.Box3().setFromObject(gltf.scene);
      const height = bounds.max.y - bounds.min.y;
      if (!Number.isFinite(height) || height <= 0) throw new Error('Invalid character bounds');
      const wrapper = new THREE.Group(); wrapper.name = id[0].toUpperCase()+id.slice(1)+'_GameVisual';
      // Match the existing 2.4-unit player, with feet on the same surface and face toward -Z.
      wrapper.rotation.y = Math.PI; wrapper.scale.setScalar(2.4 / height);
      gltf.scene.position.y -= bounds.min.y;
      wrapper.add(gltf.scene);
      gltf.scene.traverse(object => {
        if (!object.isMesh) return;
        object.castShadow = true; object.receiveShadow = false;
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
          if (!materials.some(entry => entry.material === material)) materials.push({material,opacity:material.opacity,transparent:material.transparent,depthWrite:material.depthWrite});
        }
      });
      const mixer = new THREE.AnimationMixer(gltf.scene);
      for (const clip of gltf.animations) {
        const copy = clip.clone();
        // Game physics owns vertical position. Keep the jump pose, discard the studio's baked hop.
        if (copy.name === 'Jump') copy.tracks = copy.tracks.filter(track => !/_Root\.position$/.test(track.name));
        actions.set(copy.name,mixer.clipAction(copy));
      }
      rig.add(wrapper);wrapper.visible=false;return {visual:wrapper,model:gltf.scene,mixer,actions,materials,wardrobe:null,wardrobePending:null};
    }
    async function dress(resource,id) {
      if(!outfit.upper&&!outfit.lower&&!resource.wardrobe){onWearablesStatus('ready');return;}
      if(!resource.wardrobe){
        onWearablesStatus('loading');
        if(!resource.wardrobePending)resource.wardrobePending=Promise.resolve().then(()=>loadWearables(id)).then(gltf=>{
          resource.wardrobe=Wearables.attach(resource.model,gltf);resource.materials.push(...resource.wardrobe.materials);
        }).catch(error=>{if(wanted&&wantedId===id)onWearablesStatus('error');console.warn('Wearables could not load; the character remains playable.',error);}).finally(()=>resource.wardrobePending=null);
        await resource.wardrobePending;
      }
      if(!wanted||wantedId!==id||!resource.wardrobe)return;
      resource.wardrobe.set(outfit);onWearablesStatus('ready');
    }
    async function setEnabled(enabled,id='pip',selection={}) {
      outfit=Wearables.sanitize(selection);
      wanted=!!enabled;wantedId=['pip','moss','sunny','luna'].includes(id)?id:'pip';
      const requested=wantedId;
      if(!wanted){show(false);onStatus('classic');return;}
      if(!cached.has(requested)){
        show(false);onStatus('loading');
        if(!pending.has(requested))pending.set(requested,Promise.resolve().then(()=>load(requested)).then(gltf=>{
          const resource=prepare(gltf,requested);cached.set(requested,resource);return resource;
        }).catch(error=>{
          if(wanted&&wantedId===requested){show(false);onStatus('fallback');}
          console.warn('Character could not load; keeping the classic character.',error);
        }).finally(()=>pending.delete(requested)));
        await pending.get(requested);
      }
      if(!wanted||wantedId!==requested||!cached.has(requested))return;
      const resource=cached.get(requested);
      if(visual!==resource.visual){
        ({visual,mixer,actions,materials}=resource);active=null;activeName=null;lastState=null;jumpTime=0;
      }
      show(true);onStatus(requested);await dress(resource,requested);
    }
    function select(name) {
      if (activeName === name) return;
      mixer.stopAllAction();
      activeName = name; active = actions.get(name).reset();
      active.setLoop(name === 'Wave' || name === 'Jump' ? THREE.LoopOnce : THREE.LoopRepeat,Infinity);
      active.clampWhenFinished = true; active.play();
      jumpTime = 0;
    }
    function update({delta,state,moving=false,speed=0,jumping=false,cloaked=false}) {
      if (!wanted || !visual) return;
      for (const entry of materials) {
        entry.material.opacity = cloaked ? entry.opacity * .25 : entry.opacity;
        entry.material.transparent = cloaked || entry.transparent;
        entry.material.depthWrite = cloaked ? false : entry.depthWrite;
      }
      const dt = Math.min(Math.max(Number(delta)||0,0),.1);
      if (state === 'POWERUP') {
        if (lastState !== 'POWERUP' && activeName === 'Wave') activeName = null;
        select('Wave'); mixer.update(dt);
      } else if (state === 'START' || state === 'PLAYING') {
        select(jumping ? 'Jump' : moving ? 'Walk' : 'Idle');
        if (jumping) {
          // Hold the airborne pose until the actual player lands, even during lunar super-jumps.
          jumpTime = Math.min(jumpTime + dt,.9); active.time = jumpTime; mixer.update(0);
        } else {
          active.timeScale = moving ? Math.max(.65,Math.min(2.5,speed/12)) : 1;
          mixer.update(dt);
        }
      }
      lastState = state;
    }
    return {setEnabled,update};
  }
  return {create};
});

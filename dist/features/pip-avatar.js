(function(root,factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PipPlayerAvatar = factory();
})(typeof window !== 'undefined' ? window : globalThis,function() {
  'use strict';
  const CLIPS = ['Idle','Walk','Jump','Wave'];
  let loaderPromise;
  function browserLoad(THREE) {
    if (!loaderPromise) {
      loaderPromise = new Promise((resolve,reject) => {
        if (THREE.GLTFLoader) { resolve(); return; }
        const script = document.createElement('script');
        const timer = setTimeout(() => { script.remove(); reject(new Error('Pip loader timed out')); },12000);
        script.src = new URL('vendor/GLTFLoader.r128.js',document.baseURI).href;
        script.onload = () => { clearTimeout(timer); resolve(); };
        script.onerror = () => { clearTimeout(timer); script.remove(); reject(new Error('Pip loader unavailable')); };
        document.head.appendChild(script);
      }).catch(error => { loaderPromise = null; throw error; });
    }
    return loaderPromise.then(async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(),12000);
      try {
        const response = await fetch(new URL('character-studio/3d/assets/pip.glb',document.baseURI),{signal:controller.signal});
        if (!response.ok) throw new Error('Pip model unavailable');
        const data = await response.arrayBuffer();
        return await new Promise((resolve,reject) => new THREE.GLTFLoader().parse(data,'',resolve,reject));
      } finally { clearTimeout(timer); }
    });
  }
  function create({THREE,rig,classicParts,onStatus=()=>{},load=()=>browserLoad(THREE)}) {
    let wanted = false, pending = null, visual = null, mixer = null, active = null, activeName = null;
    let jumpTime = 0, lastState = null;
    const actions = new Map(), materials = [];
    function show(enabled) {
      for (const part of classicParts) part.visible = !enabled;
      if (visual) visual.visible = enabled;
    }
    function prepare(gltf) {
      for (const name of CLIPS) if (!gltf.animations.some(clip => clip.name === name)) throw new Error('Missing animation: '+name);
      const bounds = new THREE.Box3().setFromObject(gltf.scene);
      const height = bounds.max.y - bounds.min.y;
      if (!Number.isFinite(height) || height <= 0) throw new Error('Invalid Pip bounds');
      const wrapper = new THREE.Group(); wrapper.name = 'Pip_GameVisual';
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
      mixer = new THREE.AnimationMixer(gltf.scene);
      for (const clip of gltf.animations) {
        const copy = clip.clone();
        // Game physics owns vertical position. Keep the jump pose, discard the studio's baked hop.
        if (copy.name === 'Jump') copy.tracks = copy.tracks.filter(track => track.name !== 'Pip_Root.position');
        actions.set(copy.name,mixer.clipAction(copy));
      }
      visual = wrapper; rig.add(visual); visual.visible = false;
    }
    async function setEnabled(enabled) {
      wanted = !!enabled;
      if (!wanted) { show(false); onStatus('classic'); return; }
      if (visual) { show(true); onStatus('pip'); return; }
      onStatus('loading');
      if (!pending) pending = Promise.resolve().then(load).then(prepare).catch(error => {
        if (wanted) { show(false); onStatus('fallback'); }
        console.warn('Pip could not load; keeping the classic character.',error);
      }).finally(() => { pending = null; });
      await pending;
      if (wanted && visual) { show(true); onStatus('pip'); }
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

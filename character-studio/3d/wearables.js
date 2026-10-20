(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();else root.CharacterWearables=factory();
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const characters=['pip','moss','sunny','luna'];
  const catalog=[
    ['glasses','Round glasses','upper','glasses'],['goggles','Explorer goggles','upper','goggles'],
    ['crown','Star crown','upper','crown'],['beanie','Lilac beanie','upper','beanie'],
    ['headphones','Headphones','upper','headphones-v2'],['wizard','Wizard hat','upper','wizard'],
    ['bowtie','Bow tie','lower','bowtie'],['tie','Lightning tie','lower','tie'],
    ['necklace','Moon necklace','lower','necklace'],['scarf','Rainbow scarf','lower','scarf-v2'],
    ['medal','Explorer medal','lower','medal'],['bandana','Adventure bandana','lower','bandana-v2']
  ].map(([id,name,slot,image])=>Object.freeze({id,name,slot,image}));
  const PRESET_KEY='moon-rainbow.wardrobe.v1';
  function sanitize(input={}){
    return {upper:catalog.some(item=>item.slot==='upper'&&item.id===input?.upper)?input.upper:null,
      lower:catalog.some(item=>item.slot==='lower'&&item.id===input?.lower)?input.lower:null};
  }
  function validDesign(input){return !!input&&characters.includes(input.character)&&['upper','lower'].every(slot=>input[slot]===null||catalog.some(item=>item.id===input[slot]&&item.slot===slot));}
  function readPreset(env){try{const value=JSON.parse(env.localStorage.getItem(PRESET_KEY));return validDesign(value)?value:null;}catch{return null;}}
  function savePreset(env,input){if(!validDesign(input))return false;try{env.localStorage.setItem(PRESET_KEY,JSON.stringify({character:input.character,...sanitize(input)}));return true;}catch{return false;}}
  function attach(model,gltf){
    const body=model.getObjectByName('Body_Control');
    if(!body)throw Error('Character is missing its body attachment control');
    const pieces=new Map(),materials=[];
    // Validate everything before modifying the character, so a bad asset cannot leave a partial outfit.
    for(const item of catalog){const root=gltf.scene.getObjectByName('Wearable_'+item.id);if(!root)throw Error('Missing wearable: '+item.id);pieces.set(item.id,root);}
    for(const root of pieces.values()){
      root.visible=false;body.add(root);
      root.traverse(object=>{if(!object.isMesh)return;object.castShadow=true;object.receiveShadow=false;
        for(const material of Array.isArray(object.material)?object.material:[object.material])if(!materials.some(entry=>entry.material===material))materials.push({material,opacity:material.opacity,transparent:material.transparent,depthWrite:material.depthWrite});
      });
    }
    const details=[];model.traverse(object=>{if(/^(Soft_horn_|Crown_tuft_)/.test(object.name))details.push({object,visible:object.visible});});
    function set(input){const selection=sanitize(input);for(const [id,object] of pieces)object.visible=id===selection.upper||id===selection.lower;
      for(const {object,visible} of details)object.visible=visible&&!['beanie','wizard','crown'].includes(selection.upper);
      return selection;
    }
    return {set,pieces,materials};
  }
  return {characters,catalog,PRESET_KEY,sanitize,validDesign,readPreset,savePreset,attach};
});

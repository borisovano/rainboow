(function(root,factory){
  const node=typeof module==='object'&&module.exports;
  const api=factory(node?require('../../drill-modals/registry.js'):root.DrillRegistry,node?require('../../drill-modals/helpers/contract.js'):root.DrillContract);
  if(node)module.exports=api;else{root.GameFeatureFlags=api;root.GameFeatures=api.createStore(root);}
})(typeof window!=='undefined'?window:globalThis,function(drills,contract){
  'use strict';
  const STORAGE_KEY='moon-rainbow.features.v1';
  const definitions=Object.freeze([
    {id:'pipCharacter',title:'Play as Pip',category:'Characters',defaultValue:false,description:'Bring the animated Blender character into every world.'},
    ...drills.flatMap(drill=>Object.entries(drill.features).map(([id,feature])=>({id:drill.id+'.'+id,owner:drill.id,featureId:id,title:feature.title,description:feature.description,category:drill.title,defaultValue:feature.defaultEnabled})))
  ].map(Object.freeze));
  const manifest=id=>drills.find(d=>d.id===id||d.aliases.includes(id));
  function sanitize(value){const clean={};if(value&&typeof value==='object')for(const flag of definitions)if(typeof value[flag.id]==='boolean')clean[flag.id]=value[flag.id];return clean;}
  function parseSearch(search){const params=new URLSearchParams(search||''),overrides={};for(const flag of definitions){const value=params.get('ff.'+flag.id);if(value==='1'||value==='true')overrides[flag.id]=true;if(value==='0'||value==='false')overrides[flag.id]=false;}return overrides;}
  function validDrills(value){const result={};if(value&&typeof value==='object')for(const drill of drills)if(Object.hasOwn(value,drill.id))try{result[drill.id]=contract.parameters(drill,value[drill.id]);}catch{}return result;}
  function createStore(env={}){
    let overrides={},savedDrills={},persistent=true;const listeners=new Set(),url=parseSearch(env.location?.search),query=new URLSearchParams(env.location?.search||''),urlDrills={};
    for(const drill of drills){const raw=query.get('dp.'+drill.id);if(raw)try{urlDrills[drill.id]=contract.parameters(drill,JSON.parse(raw));}catch{}}
    function read(){
      let stored;try{if(!env.localStorage)throw Error();stored=env.localStorage.getItem(STORAGE_KEY);}catch{persistent=false;return {};}
      try{const data=JSON.parse(stored||'null');return data?.version===1?data:{};}catch{return {};}
    }
    function restore(){const data=read();overrides=sanitize(data.overrides);savedDrills=validDrills(data.drills);}
    restore();
    function snapshot(){return definitions.map(flag=>{
      const source=Object.hasOwn(url,flag.id)?'url':flag.owner&&urlDrills[flag.owner]?'url':Object.hasOwn(overrides,flag.id)?'browser':flag.owner&&savedDrills[flag.owner]?'browser':'default';
      const value=Object.hasOwn(url,flag.id)?url[flag.id]:flag.owner&&urlDrills[flag.owner]?urlDrills[flag.owner].features[flag.featureId].enabled:Object.hasOwn(overrides,flag.id)?overrides[flag.id]:flag.owner&&savedDrills[flag.owner]?savedDrills[flag.owner].features[flag.featureId].enabled:flag.defaultValue;
      return {...flag,value,source};
    });}
    function notify(){for(const cb of listeners)cb(snapshot());}
    function persist(){try{if(!env.localStorage)throw Error();if(Object.keys(overrides).length||Object.keys(savedDrills).length)env.localStorage.setItem(STORAGE_KEY,JSON.stringify({version:1,overrides,drills:savedDrills}));else env.localStorage.removeItem(STORAGE_KEY);persistent=true;}catch{persistent=false;}notify();return persistent;}
    const storageChanged=event=>{if(event.key===STORAGE_KEY||event.key===null){restore();notify();}};env.addEventListener?.('storage',storageChanged);
    const api={definitions,drills,snapshot,
      enabled(id){return snapshot().find(flag=>flag.id===id)?.value??false;},
      drillParams(id,input={}){
        const m=manifest(id);if(!m)throw Error('Unknown drill: '+id);
        const base=contract.mergeParams(contract.parameters(m),savedDrills[m.id],urlDrills[m.id]);
        for(const flag of snapshot().filter(f=>f.owner===m.id))base.features[flag.featureId].enabled=flag.value;
        return contract.parameters(m,contract.mergeParams(base,input));
      },
      drillSource(id){const m=manifest(id);return urlDrills[m?.id]?'url':savedDrills[m?.id]?'browser':'default';},
      setDrillParams(id,input){
        const m=manifest(id);if(!m)throw Error('Unknown drill: '+id);
        savedDrills[m.id]=contract.parameters(m,input);
        for(const featureId of Object.keys(m.features))delete overrides[m.id+'.'+featureId];
        return persist();
      },
      resetDrill(id){const m=manifest(id);if(!m)throw Error('Unknown drill: '+id);delete savedDrills[m.id];for(const key of Object.keys(m.features))delete overrides[m.id+'.'+key];return persist();},
      setOverride(id,value){if(!definitions.some(f=>f.id===id)||(typeof value!=='boolean'&&value!==null))throw new TypeError('Expected a registered flag and boolean or null');if(value===null)delete overrides[id];else overrides[id]=value;return persist();},
      reset(){overrides={};savedDrills={};return persist();},isPersistent(){return persistent;},
      subscribe(cb){listeners.add(cb);return()=>listeners.delete(cb);},dispose(){listeners.clear();env.removeEventListener?.('storage',storageChanged);},
      gameLink(base,stage='earth'){const link=new URL(base);link.search='';link.hash='';link.searchParams.set('stage',['earth','moon','rainbow','maze'].includes(stage)?stage:'earth');for(const flag of snapshot())link.searchParams.set('ff.'+flag.id,flag.value?'1':'0');for(const drill of drills)link.searchParams.set('dp.'+drill.id,JSON.stringify(api.drillParams(drill.id)));return link.href;}
    };return api;
  }
  return {STORAGE_KEY,definitions,parseSearch,createStore};
});

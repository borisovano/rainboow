/* Shared input/output contract. Independent of the UI and game. */
(function(root){
  function parameters(manifest,input={}){
    if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Parameters must be a JSON object.');
    const definitions=manifest.parameters||{},result={};
    for(const key of Object.keys(input))if(key!=='features'&&!Object.hasOwn(definitions,key))throw Error('Unknown parameter: '+key);
    for(const [key,spec] of Object.entries(definitions)){
      const value=Object.hasOwn(input,key)?input[key]:manifest.defaultParams?.[key]??spec.default;
      if(value===undefined){if(spec.required)throw Error('Missing parameter: '+key);continue;}
      const valid=spec.type==='integer'?Number.isSafeInteger(value):spec.type==='number'?typeof value==='number'&&Number.isFinite(value):spec.type==='array'?Array.isArray(value):spec.type==='object'?value!==null&&typeof value==='object'&&!Array.isArray(value):typeof value===spec.type;
      if(!valid)throw Error(key+' must be '+spec.type+'.');
      if(spec.enum&&!spec.enum.includes(value))throw Error(key+' must be one of: '+spec.enum.join(', '));
      if((spec.minimum!==undefined&&value<spec.minimum)||(spec.maximum!==undefined&&value>spec.maximum))throw Error(key+' is out of range.');
      if(typeof value==='string'&&value.length>(spec.maxLength??500))throw Error(key+' is too long.');
      result[key]=value;
    }
    if(input.features!==undefined&&(!input.features||typeof input.features!=='object'||Array.isArray(input.features)))throw Error('features must be an object.');
    for(const id of Object.keys(input.features||{}))if(!Object.hasOwn(manifest.features||{},id))throw Error('Unknown feature: '+id);
    if(Object.keys(manifest.features||{}).length){
      result.features={};
      for(const [id,feature] of Object.entries(manifest.features)){
        const supplied=input.features?.[id]??{};
        if(!supplied||typeof supplied!=='object'||Array.isArray(supplied))throw Error(id+' must be an object.');
        const {enabled=feature.defaultEnabled,...values}=supplied;
        if(typeof enabled!=='boolean')throw Error(id+'.enabled must be boolean.');
        result.features[id]={enabled,...parameters(feature,values)};
      }
    }
    const json=JSON.stringify(result);if(json.length>8192)throw Error('Parameters are too large.');
    return JSON.parse(json);
  }
  function completion(manifest,input,durationMs){
    if(!input||!['success','failure'].includes(input.outcome)||!manifest.assessment.methods.includes(input.method)||typeof input.itemId!=='string'||!input.itemId.length||input.itemId.length>100)throw Error('Invalid completion result.');
    const attempts=input.attempts??0;
    if(!Number.isSafeInteger(attempts)||attempts<0||attempts>100000)throw Error('Invalid attempt count.');
    const result={schemaVersion:1,drillId:manifest.id,outcome:input.outcome,method:input.method,itemId:input.itemId,attempts,durationMs:Math.max(0,Math.round(durationMs))};
    if(input.details!==undefined){
      if(!input.details||typeof input.details!=='object'||Array.isArray(input.details))throw Error('Details must be a JSON object.');
      const json=JSON.stringify(input.details);if(json.length>4096)throw Error('Details are too large.');result.details=JSON.parse(json);
    }
    return result;
  }
  function terminal(id,outcome,reason,durationMs){return {schemaVersion:1,drillId:id,outcome,reason,durationMs:Math.max(0,Math.round(durationMs))};}
  function mergeParams(...values){
    const result={};
    for(const value of values){
      if(!value)continue;
      const {features,...params}=value;Object.assign(result,params);
      if(features){result.features??={};for(const [id,settings] of Object.entries(features))result.features[id]={...result.features[id],...settings};}
    }
    return result;
  }
  root.DrillContract={parameters,completion,terminal,mergeParams};
  if(typeof module!=='undefined')module.exports=root.DrillContract;
})(globalThis);

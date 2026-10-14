/* Metadata is independent of the drill's HTML, CSS and JS. */
(function(root){
  function validate(m){
    const fail=message=>{throw new Error('Invalid drill metadata: '+message);};
    if(m.schemaVersion!==1)fail('schemaVersion must be 1');
    if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(m.id||''))fail('id must be a slug');
    for(const key of ['title','subject','language','direction','entry'])if(typeof m[key]!=='string'||!m[key].trim())fail(key+' is required');
    try{Intl.getCanonicalLocales(m.language);}catch{fail('language must be a BCP 47 language tag');}
    if(!['rtl','ltr'].includes(m.direction))fail('direction');
    if(!/^[a-zA-Z0-9_/-]+\.html$/.test(m.entry)||m.entry.startsWith('/')||m.entry.split('/').includes('..'))fail('entry must be a local HTML path');
    for(const key of ['skills','tags','groups','letters','capabilities'])if(!Array.isArray(m[key])||m[key].some(v=>typeof v!=='string'||!v.trim())||new Set(m[key]).size!==m[key].length)fail(key+' must contain unique strings');
    if(!m.skills.length)fail('skills cannot be empty');
    if(m.capabilities.some(c=>!['microphone','speech-synthesis'].includes(c)))fail('unsupported capability');
    if(!Number.isInteger(m.difficulty?.level)||m.difficulty.level<1||!m.difficulty.scale||!m.difficulty.description)fail('difficulty needs a level, scale and description');
    if(!m.proficiency?.scheme||!m.proficiency.value||!m.proficiency.description)fail('proficiency must identify its rubric');
    if(!Array.isArray(m.gameLevels)||!m.gameLevels.length||m.gameLevels.some(n=>!Number.isInteger(n)||n<1))fail('gameLevels');
    if(!Array.isArray(m.assessment?.methods)||!m.assessment.methods.length||!m.assessment.success)fail('assessment');
    return m;
  }
  function matches(m,query={}){
    return Object.entries(query).every(([key,value])=>{
      if(key==='level')return m.difficulty.level===value;
      if(key==='proficiency')return m.proficiency.value===value;
      if(key==='gameLevel')return m.gameLevels.includes(value);
      if(['tags','groups','letters','skills'].includes(key))return (Array.isArray(value)?value:[value]).every(v=>m[key].includes(v));
      return m[key]===value;
    });
  }
  root.DrillMetadata={validate,matches};
  if(typeof module!=='undefined')module.exports=root.DrillMetadata;
})(globalThis);

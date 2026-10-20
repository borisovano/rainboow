(() => {
  const flags=GameFeatures,$=id=>document.getElementById(id),initial=DrillRunner.fromURL(location.href);
  let selected=flags.drills.find(d=>d.id===initial.id||d.aliases.includes(initial.id))?.id||null,fields=[],active=null,running=false,saving=false;
  const node=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
  function status(text,error=false){$('status').textContent=text;$('status').classList.toggle('error',error);}
  const savedMessage=()=>flags.isPersistent()?'Saved in this browser. Game settings update across open tabs; active drill tests keep their starting settings.':'Storage is unavailable. Use a test link to carry this temporary setup.';
  function gameLink(){return flags.gameLink(new URL('../',location.href).href,$('stage').value);}
  function refreshLink(){$('play').href=gameLink();$('copy-status').textContent='';$('copy-fallback').hidden=true;}
  function navigate(id){selected=id;const url=new URL(location.href);url.searchParams.delete('params');url.searchParams.delete('run');if(id)url.searchParams.set('drill',id);else url.searchParams.delete('drill');history.replaceState(null,'',url);render();}
  function drawNavigation(){
    $('general').setAttribute('aria-pressed',String(!selected));$('drill-nav').replaceChildren();
    const filter=$('filter').value.toLowerCase().trim();
    for(const d of flags.drills){if(filter&&!`${d.title} ${d.id} ${d.labels.join(' ')}`.toLowerCase().includes(filter))continue;
      const button=node('button','nav-item',d.title);button.setAttribute('aria-pressed',String(selected===d.id));button.append(node('small',null,d.labels.slice(0,3).join(' · ')));button.onclick=()=>navigate(d.id);$('drill-nav').append(button);
    }
  }
  function switchControl(id,label,value,disabled,onChange){
    const wrap=node('label','toggle'),input=node('input'),state=node('span',null,value?'On':'Off');input.type='checkbox';input.id=id;input.checked=value;input.disabled=disabled;input.setAttribute('role','switch');input.setAttribute('aria-label',label);input.onchange=()=>{onChange();state.textContent=input.checked?'On':'Off';};wrap.append(input,state);return {wrap,input};
  }
  function field(parent,key,spec,value,path,disabled=false){
    const box=node('div','field'),id='param-'+path.join('-'),label=node('label',null,spec.title||key);label.htmlFor=id;
    const structured=['array','object'].includes(spec.type),input=node(spec.enum?'select':structured?'textarea':'input');input.id=id;input.disabled=disabled;
    if(spec.enum){for(const value of spec.enum){const option=node('option',null,String(value));option.value=String(value);input.append(option);}input.value=String(value);}
    else if(structured){input.value=JSON.stringify(value,null,2);input.rows=4;}
    else if(spec.type==='boolean'){input.type='checkbox';input.checked=value;}
    else{input.type=['integer','number'].includes(spec.type)?'number':'text';input.value=String(value);if(spec.minimum!==undefined)input.min=spec.minimum;if(spec.maximum!==undefined)input.max=spec.maximum;if(spec.type==='integer')input.step='1';if(spec.maxLength)input.maxLength=spec.maxLength;}
    input.setAttribute('aria-describedby',id+'-help');const help=node('small',null,spec.description||'');help.id=id+'-help';box.append(label,input,help);parent.append(box);fields.push({input,spec,path});input.oninput=input.onchange=saveDraft;
  }
  function readDraft(){
    const m=flags.drills.find(d=>d.id===selected),value={};
    for(const {input,spec,path} of fields){let target=value;for(const key of path.slice(0,-1))target=target[key]??={};target[path.at(-1)]=spec.type==='boolean'?input.checked:['integer','number'].includes(spec.type)?(input.value.trim()===''?NaN:Number(input.value)):['array','object'].includes(spec.type)?JSON.parse(input.value):input.value;}
    return DrillContract.parameters(m,value);
  }
  function saveDraft(){try{saving=true;flags.setDrillParams(selected,readDraft());status(savedMessage());}catch(error){status(error.message,true);}finally{saving=false;}}
  function drawDrill(m,draft){
    const editor=$('editor'),params=draft||flags.drillParams(m.id),pinned=flags.drillSource(m.id)==='url';
    editor.append(node('p','eyebrow','DRILL / '+m.id.toUpperCase()),node('h2',null,m.title),node('p','description',m.difficulty.description));
    const labels=node('div','labels');for(const label of m.labels)labels.append(node('span','tag',label));labels.append(node('span','tag code',m.language));editor.append(labels);
    if(m.compatibility)editor.append(node('p','compatibility',m.compatibility.speechRecognition));
    editor.append(node('h3','section-title','Default parameters'));const grid=node('div','fields');for(const [key,spec] of Object.entries(m.parameters))field(grid,key,spec,params[key],[key],pinned);editor.append(grid);
    if(m.id==='math')editor.append(node('p','description','Game encounters choose their own questions and time limits. The breathing feature below also applies in the game.'));
    if(m.id==='word-reading')editor.append(node('p','description','Game encounters choose words using the selected class level. Word overrides here are for standalone exploration; sound and adult confirmation settings also apply in the game.'));
    for(const [id,feature] of Object.entries(m.features)){
      const flag=flags.snapshot().find(f=>f.id===m.id+'.'+id),values=params.features[id],box=node('section','feature'),top=node('div','feature-top');
      top.append(node('h3',null,feature.title));const toggle=switchControl('feature-'+id,feature.title,values.enabled,pinned||flag.source==='url',saveDraft);fields.push({input:toggle.input,spec:{type:'boolean'},path:['features',id,'enabled']});top.append(toggle.wrap);box.append(top,node('p','description',feature.description));
      const featureFields=node('div','fields');for(const [key,spec] of Object.entries(feature.parameters))field(featureFields,key,spec,values[key],['features',id,key],pinned);box.append(featureFields,node('p','source',flag.id+' · default '+(feature.defaultEnabled?'on':'off')+' · '+Object.entries(feature.defaultParams).map(([key,value])=>key+': '+JSON.stringify(value)).join(', ')));editor.append(box);
    }
    const actions=node('div','actions'),run=node('button','primary','Run drill ↗');run.id='run-drill';run.disabled=running;run.onclick=runDrill;
    const copy=node('button','secondary','Copy drill link');copy.onclick=()=>{try{copyLink(DrillRunner.link(new URL('./',location.href),m.id,readDraft()),'Drill test link copied.');}catch(error){status(error.message,true);}};
    const reset=node('button','secondary','Reset this drill');reset.disabled=pinned;reset.onclick=()=>flags.resetDrill(m.id);actions.append(run,copy,reset);editor.append(actions);
    const examples=node('div','examples');for(const example of m.examples||[]){const button=node('button',null,example.name);button.onclick=()=>{fields=[];editor.replaceChildren();drawDrill(m,DrillContract.parameters(m,DrillContract.mergeParams(flags.drillParams(m.id),example.params)));status('Example loaded for this test. Editing a value saves it as your browser default.');};examples.append(button);}editor.append(examples);
    const details=node('details'),summary=node('summary',null,'Metadata · defaults, labels and feature contract'),pre=node('pre',null,JSON.stringify(m,null,2));details.append(summary,pre);editor.append(details);
    status(pinned?'Parameters are pinned by this URL. Open the Control Center without dp parameters to change saved defaults.':savedMessage());
  }
  function drawGeneral(){
    const editor=$('editor');editor.append(node('p','eyebrow','GAME / FEATURES'),node('h2',null,'A different adventure.'),node('p','description','Switch on a new character, then explore a world. Drill features live with the drill that owns them.'));
    for(const flag of flags.snapshot().filter(f=>!f.owner)){
      const box=node('section','feature'),top=node('div','feature-top');top.append(node('h3',null,flag.title));const toggle=switchControl('flag-'+flag.id,flag.title,flag.value,flag.source==='url',()=>flags.setOverride(flag.id,toggle.input.checked));top.append(toggle.wrap);box.append(top,node('p','description',flag.description),node('p','source',flag.id+' · '+(flag.source==='url'?'Pinned by URL':flag.source==='browser'?'Your browser setting':'Using default')));editor.append(box);
    }
    const jump=node('button','secondary','Math Challenge → Breathing bonus');jump.style.marginTop='24px';jump.onclick=()=>navigate('math');editor.append(jump);
    status(savedMessage());
  }
  function render(){const focus=document.activeElement?.id;fields=[];$('editor').replaceChildren();drawNavigation();if(selected)drawDrill(flags.drills.find(d=>d.id===selected));else drawGeneral();refreshLink();if(focus)document.getElementById(focus)?.focus();}
  async function copyLink(link,message){try{await navigator.clipboard.writeText(link);$('copy-status').textContent=message;}catch{const input=$('copy-fallback');input.value=link;input.hidden=false;input.focus();input.select();$('copy-status').textContent='Copy the selected link.';}}
  async function runDrill(){
    if(running)return;const m=flags.drills.find(d=>d.id===selected);let params;try{params=readDraft();}catch(error){status(error.message,true);return;}
    running=true;$('run-drill').disabled=true;$('output').hidden=false;$('events').replaceChildren();$('result-output').textContent='Waiting for completion…';const context={source:'control-center'};$('input-output').textContent=JSON.stringify({drillId:m.id,params,context},null,2);
    status('Running. Complete the drill or press Escape to cancel this test.');
    try{active=await DrillHost.open(m.id,{params,context,dismissible:true,onEvent(event){$('events').append(node('li',null,event.type));},onResult(result){active=null;running=false;$('result-output').textContent=JSON.stringify(result,null,2);$('events').append(node('li',null,'result: '+result.outcome));const run=$('run-drill');if(run){run.disabled=false;run.focus();}status('Result received: '+result.outcome,result.outcome==='error');}});}catch(error){running=false;if($('run-drill'))$('run-drill').disabled=false;status(error.message,true);}
  }
  flags.subscribe(()=>saving?refreshLink():render());$('general').onclick=()=>navigate(null);$('filter').oninput=drawNavigation;$('stage').onchange=refreshLink;$('copy-game').onclick=()=>copyLink(gameLink(),'Game test link copied, including features and drill settings.');$('reset-all').onclick=()=>flags.reset();window.addEventListener('pagehide',()=>active?.close());
  render();
  if(initial.id&&!selected)status('Unknown drill: '+initial.id,true);
  if(initial.text&&selected)try{const m=flags.drills.find(d=>d.id===selected),draft=DrillRunner.parse(initial.text,m);fields=[];$('editor').replaceChildren();drawDrill(m,draft);status('Parameters loaded from the test link. Your saved defaults have not changed.');}catch(error){status(error.message,true);return;}
  if(initial.run&&selected)runDrill();
})();

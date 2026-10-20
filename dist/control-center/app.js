(() => {
  const flags=GameFeatures,$=id=>document.getElementById(id),initial=DrillRunner.fromURL(location.href),query=new URL(location.href).searchParams;
  let selected=flags.drills.find(d=>d.id===initial.id||d.aliases.includes(initial.id))?.id||null;
  let section=selected?'drill':['global-parameters','global-features','drills','characters'].includes(query.get('section'))?query.get('section'):'global-parameters';
  let part=['parameters','features','images'].includes(query.get('part'))?query.get('part'):'main';
  let fields=[],formBase={},active=null,running=false,saving=false;
  const node=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
  const manifest=()=>flags.drills.find(d=>d.id===selected);
  function status(text,error=false){$('status').textContent=text;$('status').classList.toggle('error',error);}
  const savedMessage=()=>flags.isPersistent()?'Saved in this browser.':'Storage is unavailable. Copy a link to keep this setup.';
  function gameLink(){return flags.gameLink(new URL('../',location.href).href);}
  function refreshLink(){const p=flags.globalParams();$('play').href=gameLink();$('game-summary').textContent=p.stage+' · '+(flags.enabled('pipCharacter')?p.character+' 3D':'Classic character');$('copy-status').textContent='';$('copy-fallback').hidden=true;}
  function navigate(next,id=null,nextPart='main'){
    let draft;try{if(id&&selected===id)draft=readDraft();}catch(error){status(error.message,true);return;}
    selected=id;section=next;part=nextPart;const url=new URL(location.href);for(const key of ['params','run','drill','section','part'])url.searchParams.delete(key);
    if(id)url.searchParams.set('drill',id);else url.searchParams.set('section',next);if(nextPart!=='main')url.searchParams.set('part',nextPart);
    history.replaceState(null,'',url);render(draft);if(typeof matchMedia!=='undefined'&&matchMedia('(max-width:680px)').matches)$('editor').scrollIntoView({block:'start'});
  }
  function nav(parent,id,label,active,fn,cls=''){const button=node('button','nav-item '+cls,label);button.id=id;button.setAttribute('aria-pressed',String(active));button.onclick=fn;parent.append(button);return button;}
  function drawNavigation(){
    const globals=$('global-nav');globals.replaceChildren();
    for(const [key,title] of [['global-parameters','Global parameters'],['global-features','Global features']])nav(globals,'nav-'+key,title,section===key,()=>navigate(key));
    const list=$('drill-nav');list.replaceChildren();nav(list,'nav-drills','Drills',section==='drills',()=>navigate('drills'));
    const filter=$('filter').value.toLowerCase().trim();
    for(const d of flags.drills){if(filter&&!`${d.title} ${d.id} ${d.labels.join(' ')}`.toLowerCase().includes(filter))continue;
      const group=node('div','nav-group');nav(group,'nav-'+d.id,d.title,selected===d.id&&part==='main',()=>navigate('drill',d.id));
      const children=node('div','nav-children');for(const [key,title] of [['main','Main'],['parameters','Parameters'],...(Object.keys(d.features).length?[['features','Features']]:[])])nav(children,'nav-'+d.id+'-'+key,title,selected===d.id&&part===key,()=>navigate('drill',d.id,key));group.append(children);list.append(group);
    }
    const studio=$('studio-nav');studio.replaceChildren();studio.append(node('h2',null,'Characters'));
    nav(studio,'nav-models','3D models',section==='characters'&&part!=='images',()=>navigate('characters'));nav(studio,'nav-images','Images & accessories',section==='characters'&&part==='images',()=>navigate('characters',null,'images'));
  }
  function switchControl(id,label,value,disabled,onChange){const wrap=node('label','toggle'),input=node('input'),state=node('span',null,value?'On':'Off');input.type='checkbox';input.id=id;input.checked=value;input.disabled=disabled;input.setAttribute('role','switch');input.setAttribute('aria-label',label);input.onchange=()=>{onChange();state.textContent=input.checked?'On':'Off';};wrap.append(input,state);return {wrap,input};}
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
    const value=JSON.parse(JSON.stringify(formBase));
    for(const {input,spec,path} of fields){let target=value;for(const key of path.slice(0,-1))target=target[key]??={};target[path.at(-1)]=spec.type==='boolean'?input.checked:['integer','number'].includes(spec.type)?(input.value.trim()===''?NaN:Number(input.value)):['array','object'].includes(spec.type)?JSON.parse(input.value):input.value;}
    return DrillContract.parameters(section==='global-parameters'?flags.globalParameters:manifest(),value);
  }
  function saveDraft(){try{saving=true;const values=readDraft();if(section==='global-parameters')flags.setGlobalParams(values);else flags.setDrillParams(selected,values);formBase=values;status(savedMessage());}catch(error){status(error.message,true);}finally{saving=false;}}
  function title(text,description){$('editor').append(node('h2',null,text));if(description)$('editor').append(node('p','description',description));}
  function tags(m,parent){const labels=node('div','labels');for(const label of [m.language,...m.labels])labels.append(node('span','tag',label));parent.append(labels);}
  function drawDrill(m){
    const editor=$('editor'),params=formBase,pinned=flags.drillSource(m.id)==='url';
    if(part==='features'&&!Object.keys(m.features).length)part='main';
    editor.append(node('p','breadcrumb','Drills / '+m.title));title(part==='main'?m.title:part==='parameters'?'Drill parameters':'Drill features',part==='main'?m.difficulty.description:null);
    if(part==='main'){
      tags(m,editor);if(m.compatibility)editor.append(node('p','compatibility',m.compatibility.speechRecognition));
      editor.append(node('p','description',m.id==='math'?'Game encounters supply the question and time limit. Breathing settings apply in the game and in standalone tests.':'Game encounters choose words using the selected class level. Manual word overrides apply to standalone tests. Sound and adult confirmation settings also apply in the game.'));
      const links=node('div','actions');for(const key of ['parameters',...(Object.keys(m.features).length?['features']:[])]){const button=node('button','secondary',key==='parameters'?'Drill parameters':'Drill features');button.onclick=()=>navigate('drill',m.id,key);links.append(button);}editor.append(links);
    }
    if(part==='parameters'){const grid=node('div','fields');for(const [key,spec] of Object.entries(m.parameters))field(grid,key,spec,params[key],[key],pinned);editor.append(grid);}
    if(part==='features')for(const [id,feature] of Object.entries(m.features)){
      const flag=flags.snapshot().find(f=>f.id===m.id+'.'+id),values=params.features[id],box=node('section','feature'),top=node('div','feature-top');
      top.append(node('h3',null,feature.title));const toggle=switchControl('feature-'+id,feature.title,values.enabled,pinned||flag.source==='url',saveDraft);fields.push({input:toggle.input,spec:{type:'boolean'},path:['features',id,'enabled']});top.append(toggle.wrap);box.append(top,node('p','description',feature.description));
      const grid=node('div','fields');for(const [key,spec] of Object.entries(feature.parameters))field(grid,key,spec,values[key],['features',id,key],pinned);box.append(grid);editor.append(box);
    }
    const actions=node('div','actions'),run=node('button','primary','Run drill');run.id='run-drill';run.disabled=running;run.onclick=runDrill;
    const copy=node('button','secondary','Copy drill link');copy.onclick=()=>{try{copyLink(DrillRunner.link(new URL('./',location.href),m.id,readDraft()),'Drill link copied.');}catch(error){status(error.message,true);}};
    const reset=node('button','secondary','Reset this drill');reset.disabled=pinned;reset.onclick=()=>flags.resetDrill(m.id);actions.append(run,copy,reset);editor.append(actions);
    if(part==='main'){
      if(m.examples?.length){editor.append(node('h3','section-title','Examples'));const examples=node('div','examples');for(const example of m.examples){const button=node('button',null,example.name);button.onclick=()=>{render(DrillContract.parameters(m,DrillContract.mergeParams(flags.drillParams(m.id),example.params)));status('Example loaded for testing. Saved defaults are unchanged.');};examples.append(button);}editor.append(examples);}
      const details=node('details'),pre=node('pre',null,JSON.stringify(m,null,2));details.append(node('summary',null,'Metadata'),pre);editor.append(details);
      if(m.id==='math'){const demos=node('details');demos.append(node('summary',null,'Dialog design examples'));demos.ontoggle=()=>{if(demos.open&&!demos.querySelector('iframe'))demos.append(frame('../drills/math/playground.html?embedded=1','Math dialog design examples'));};editor.append(demos);}
    }
    status(pinned?'Parameters are pinned by this URL. Open the command center without dp parameters to change defaults.':savedMessage());
  }
  function drawGlobals(){
    title('Global parameters','Defaults for the game. A value specified in a game link takes priority.');
    const grid=node('div','fields');for(const [key,spec] of Object.entries(flags.globalParameters.parameters))field(grid,key,spec,formBase[key],[key],flags.globalSource(key)==='url');$('editor').append(grid);
    const button=node('button','secondary','Preview characters');button.onclick=()=>navigate('characters');const actions=node('div','actions');actions.append(button);$('editor').append(actions);status(savedMessage());
  }
  function drawFeatures(){
    title('Global features','Features that apply across the game.');
    for(const flag of flags.snapshot().filter(f=>!f.owner)){
      const box=node('section','feature'),top=node('div','feature-top');top.append(node('h3',null,flag.title));const toggle=switchControl('flag-'+flag.id,flag.title,flag.value,flag.source==='url',()=>flags.setOverride(flag.id,toggle.input.checked));top.append(toggle.wrap);box.append(top,node('p','description',flag.description),node('p','source',flag.source==='url'?'Pinned by URL':flag.source==='browser'?'Saved in this browser':'Using default'));$('editor').append(box);
    }status(savedMessage());
  }
  function drawCatalog(){
    title('Drills','Browse, configure, and test each drill.');const editor=$('editor'),filters=node('div','fields catalog-filters'),inputs={};
    for(const key of ['language','level','proficiency','letters','groups','labels']){
      const wrap=node('label',null,key==='level'?'Difficulty':key[0].toUpperCase()+key.slice(1)),select=node('select');select.id='catalog-'+key;select.setAttribute('aria-label',wrap.textContent);
      const any=node('option',null,'All');any.value='';select.append(any);
      const values=flags.drills.flatMap(m=>key==='level'?[m.difficulty.level]:key==='proficiency'?[m.proficiency.value]:Array.isArray(m[key])?m[key]:[m[key]]);
      for(const value of [...new Set(values)]){const option=node('option',null,String(value));option.value=String(value);select.append(option);}select.value='';inputs[key]=select;wrap.append(select);filters.append(wrap);
    }
    const details=node('details');details.append(node('summary',null,'Filter by metadata'),filters);editor.append(details);const results=node('div','catalog'),count=node('p','description');editor.append(count,results);
    function draw(){const query={};for(const [key,input] of Object.entries(inputs))if(input.value)query[key]=key==='level'?Number(input.value):input.value;results.replaceChildren();
      for(const m of flags.drills.filter(m=>DrillMetadata.matches(m,query))){const card=node('article','catalog-card');card.append(node('h3',null,m.title),node('p','description',m.difficulty.description));tags(m,card);const button=node('button','secondary','Open '+m.title);button.onclick=()=>navigate('drill',m.id);card.append(button);results.append(card);}count.textContent=results.children.length+' drills';
    }for(const input of Object.values(inputs))input.onchange=draw;draw();status('');
  }
  function frame(url,label){const iframe=node('iframe','studio-frame');iframe.src=url;iframe.title=label;iframe.allow='clipboard-write';return iframe;}
  function drawCharacters(){title(part==='images'?'Images & accessories':'3D characters',part==='images'?'Combine a character with accessories and export the image.':'Inspect the models and animations. Use “Use in game” to select a character and enable 3D characters.');$('editor').append(frame(part==='images'?'../character-studio/?embedded=1':'../character-studio/3d/?embedded=1&character='+flags.globalParams().character,part==='images'?'Character image editor':'3D character editor'));status('');}
  function render(draft){const focus=document.activeElement?.id;fields=[];formBase=draft||(selected?flags.drillParams(selected):flags.globalParams());$('editor').replaceChildren();drawNavigation();document.querySelector('.workspace').classList.toggle('wide-editor',section==='characters');
    if(selected)drawDrill(manifest());else if(section==='global-features')drawFeatures();else if(section==='drills')drawCatalog();else if(section==='characters')drawCharacters();else drawGlobals();refreshLink();if(focus)document.getElementById(focus)?.focus();}
  async function copyLink(link,message){try{await navigator.clipboard.writeText(link);$('copy-status').textContent=message;}catch{const input=$('copy-fallback');input.value=link;input.hidden=false;input.focus();input.select();$('copy-status').textContent='Copy the selected link.';}}
  async function runDrill(){
    if(running)return;const m=manifest();let params;try{params=readDraft();}catch(error){status(error.message,true);return;}
    running=true;$('run-drill').disabled=true;$('output').hidden=false;$('events').replaceChildren();$('result-label').textContent=m.title+' · Completion data returned to the game.';$('result-output').textContent='Waiting for completion…';const context={source:'control-center'};$('input-output').textContent=JSON.stringify({drillId:m.id,params,context},null,2);status('Running. Complete the drill or press Escape to cancel this test.');
    try{active=await DrillHost.open(m.id,{params,context,dismissible:true,onEvent(event){$('events').append(node('li',null,event.type));},onResult(result){active=null;running=false;$('result-output').textContent=JSON.stringify(result,null,2);$('events').append(node('li',null,'result: '+result.outcome));const run=$('run-drill');if(run){run.disabled=false;run.focus();}status('Result received: '+result.outcome,result.outcome==='error');}});}catch(error){running=false;if($('run-drill'))$('run-drill').disabled=false;status(error.message,true);}
  }
  flags.subscribe(()=>saving||section==='characters'?refreshLink():render());$('filter').oninput=drawNavigation;$('copy-game').onclick=()=>copyLink(gameLink(),'Game link copied.');$('reset-all').onclick=()=>{flags.reset();if(section==='characters')render();};window.addEventListener('pagehide',()=>active?.close());
  window.addEventListener('message',event=>{if(event.origin!==location.origin||event.data?.type!=='studio:size'||!Number.isFinite(event.data.height)||event.data.height<100||event.data.height>6000)return;for(const frame of document.querySelectorAll('.studio-frame'))if(frame.contentWindow===event.source)frame.style.height=(Math.ceil(event.data.height)+4)+'px';});
  render();if(initial.id&&!selected)status('Unknown drill: '+initial.id,true);
  if(initial.text&&selected)try{render(DrillRunner.parse(initial.text,manifest()));status('Test link loaded. Saved defaults are unchanged.');}catch(error){status(error.message,true);return;}
  if(initial.run&&selected)runDrill();
})();

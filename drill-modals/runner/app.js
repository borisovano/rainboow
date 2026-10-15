(async function(){
 const el=id=>document.getElementById(id),status=el('status');let entries=[],active=null;
 const initial=DrillRunner.fromURL(location.href);
 function selected(){return entries.find(e=>e.metadata.id===el('drill').value)?.metadata;}
 function message(text,error=false){status.textContent=text;status.classList.toggle('error',error);}
 function appendEvent(text){const li=document.createElement('li');li.textContent=text;el('events').appendChild(li);}
 function configure(text){
   const m=selected();el('params').value=text??JSON.stringify(DrillContract.parameters(m),null,2);
   el('metadata').textContent=`${m.language} · level ${m.difficulty.level} · ${m.proficiency.value} · ${m.groups.join(' / ')}`;
   el('examples').replaceChildren();
   for(const example of m.examples||[]){const button=document.createElement('button');button.textContent=example.name;button.onclick=()=>{el('params').value=JSON.stringify(example.params,null,2);el('permalink').hidden=true;message('Example loaded. Run the drill to try it.');};el('examples').appendChild(button);}
   const table=document.createElement('table');
   for(const [key,spec] of Object.entries(m.parameters||{})){const row=document.createElement('tr'),name=document.createElement('td'),description=document.createElement('td');name.textContent=key;description.textContent=`${spec.type} · ${spec.description||''}${spec.enum?' Options: '+spec.enum.join(', '):''}`;row.append(name,description);table.appendChild(row);}
   el('reference').replaceChildren(table);el('permalink').hidden=true;message('Ready. This runs independently of the game.');
 }
 async function run(){
   const m=selected();let params;try{params=DrillRunner.parse(el('params').value,m);}catch(error){message(error.message,true);return;}
   el('run').disabled=true;el('events').replaceChildren();el('result-output').textContent='Waiting for completion…';
   const context={source:'standalone-runner'};
   el('input-output').textContent=JSON.stringify({drillId:m.id,params,context},null,2);
   el('permalink').href=DrillRunner.link(location.href,m.id,params);el('permalink').hidden=false;
   history.replaceState(null,'',el('permalink').href.replace('&run=1',''));
   message('Drill is running. Answer to finish automatically, or press Escape to cancel this test.');
   try{
     active=await DrillHost.open(m.id,{params,context,dismissible:true,
       onEvent(event){appendEvent(event.type+(event.message?': '+event.message:''));},
       onResult(result){active=null;el('result-output').textContent=JSON.stringify(result,null,2);appendEvent('result: '+result.outcome);message('Result received: '+result.outcome,result.outcome==='error');el('run').disabled=false;el('run').focus();}
     });
   }catch(error){message(error.message,true);el('run').disabled=false;}
 }
 try{
   entries=await DrillHost.list();if(!entries.length)throw Error('No drills registered.');
   el('drill').replaceChildren();for(const {metadata:m} of entries){const option=document.createElement('option');option.value=m.id;option.textContent=`${m.title} / ${m.id}`;el('drill').appendChild(option);}
   if(initial.id&&!entries.some(e=>e.metadata.id===initial.id))throw Error('Unknown drill in URL: '+initial.id);
   if(initial.id)el('drill').value=initial.id;
   el('drill').disabled=el('defaults').disabled=el('run').disabled=false;
   el('drill').onchange=()=>configure();el('defaults').onclick=()=>configure();el('run').onclick=run;
   el('params').oninput=()=>{el('permalink').hidden=true;};
   configure(initial.text);if(initial.run)await run();
 }catch(error){message(error.message,true);}
 window.addEventListener('pagehide',()=>active?.close());
})();

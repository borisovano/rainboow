/* Reviewed local drills run in separate documents for CSS/DOM isolation.
   Browser speech needs allow-same-origin; this is not a hostile-code sandbox. */
(function(root){
  const base=new URL('../',document.currentScript.src),channel='adventure-drill-v1';
  let current=null;
  async function read(url){
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),10000);
    try{const response=await fetch(url,{signal:controller.signal});if(!response.ok)throw Error('Cannot load '+url.pathname);return await response.json();}finally{clearTimeout(timeout);}
  }
  async function list(query={}){
    const paths=await read(new URL('catalog.json',base));
    const entries=await Promise.all(paths.map(async path=>{
      if(!/^[a-z0-9-]+\/drill\.json$/.test(path))throw Error('Invalid catalog path');
      const url=new URL(path,base),metadata=DrillMetadata.validate(await read(url));return {metadata,url};
    }));
    if(new Set(entries.map(e=>e.metadata.id)).size!==entries.length)throw Error('Duplicate drill id');
    return entries.filter(e=>DrillMetadata.matches(e.metadata,query));
  }
  async function open(id,{params={},context={},dismissible=false,onResult=()=>{},onEvent=()=>{},onComplete=()=>{},onCancel=()=>{},onFailure=onCancel}={}){
    if(current)throw Error('A drill is already open');
    const handle={};current=handle;
    let done=false,started=Date.now(),cleanup=()=>{};
    function finish(result){
      if(done)return;done=true;cleanup();current=null;
      onResult(result);
      if(result.outcome==='success')onComplete(result);
      else if(result.outcome==='cancelled')onCancel(result);
      else onFailure(result);
    }
    try{
      const entry=(await list()).find(e=>e.metadata.id===id);if(!entry)throw Error('Unknown drill: '+id);
      const m=entry.metadata,validated=DrillContract.parameters(m,params);
      const dialog=document.createElement('dialog'),header=document.createElement('header'),title=document.createElement('h2'),testHint=document.createElement('small'),frame=document.createElement('iframe'),notice=document.createElement('p');
      const session=crypto.randomUUID(),origin=location.origin,previousFocus=document.activeElement;
      let ready=false;
      dialog.className='drill-modal';dialog.dir=m.direction;dialog.lang=m.language;dialog.setAttribute('aria-label',m.title);
      title.textContent=m.title;testHint.textContent='Esc · ביטול בדיקה';
      frame.title=m.title;frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-forms');
      if(m.capabilities.includes('microphone'))frame.setAttribute('allow',"microphone 'self'");
      notice.textContent='טוענים את התרגול…';notice.setAttribute('role','status');
      header.append(title);if(dismissible)header.append(testHint);dialog.append(header,notice,frame);document.body.appendChild(dialog);
      const send=type=>frame.contentWindow?.postMessage({channel,type,session,params:validated,context},origin);
      const elapsed=()=>Date.now()-started;
      const timeout=setTimeout(()=>{if(!ready)finish(DrillContract.terminal(id,'error','load-timeout',elapsed()));},10000);
      cleanup=()=>{
        clearTimeout(timeout);window.removeEventListener('message',receive);send('dispose');
        dialog.close();frame.src='about:blank';dialog.remove();
        if(previousFocus?.isConnected)previousFocus.focus();
      };
      function receive(event){
        const data=event.data;
        if(done||event.source!==frame.contentWindow||event.origin!==origin||data?.channel!==channel||data.session!==session)return;
        if(data.type==='ready'&&!ready){ready=true;notice.hidden=true;clearTimeout(timeout);onEvent({type:'ready',drillId:id});}
        if(data.type==='request-cancel'&&dismissible)finish(DrillContract.terminal(id,'cancelled','escape',elapsed()));
        if(data.type==='cancel')finish(DrillContract.terminal(id,'cancelled','drill-cancelled',elapsed()));
        if(data.type==='error')finish(DrillContract.terminal(id,'error','drill-error',elapsed()));
        if(ready&&data.type==='complete'){
          let result;try{result=DrillContract.completion(m,data.result,elapsed());}catch(error){onEvent({type:'invalid-result',message:error.message});return;}
          finish(result);
        }
      }
      window.addEventListener('message',receive);frame.onload=()=>{if(!done)send('init');};
      const cancel=reason=>finish(DrillContract.terminal(id,'cancelled',reason,elapsed()));
      dialog.addEventListener('cancel',event=>{event.preventDefault();if(dismissible)cancel('escape');});
      frame.src=new URL(m.entry,entry.url).href;dialog.showModal();frame.focus();
      onEvent({type:'opened',drillId:id,params:validated,context});
      return {close:()=>cancel('host-cancelled'),metadata:m,params:validated};
    }catch(error){
      finish(DrillContract.terminal(id,'error','open-failed',Date.now()-started));throw error;
    }
  }
  root.DrillHost={list,open};
})(globalThis);

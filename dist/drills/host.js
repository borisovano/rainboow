/* Trusted, reviewed contributions run in separate documents for CSS/DOM isolation.
   allow-same-origin enables browser speech; this is not an untrusted-code sandbox. */
(function(root){
  const base=new URL('.',document.currentScript.src),channel='adventure-drill-v1';
  let current=null;
  async function list(query={}){
    const response=await fetch(new URL('catalog.json',base));if(!response.ok)throw Error('Cannot load drill catalog');
    const paths=await response.json();
    const entries=await Promise.all(paths.map(async path=>{
      if(!/^[a-z0-9-]+\/drill\.json$/.test(path))throw Error('Invalid catalog path');
      const url=new URL(path,base),r=await fetch(url);if(!r.ok)throw Error('Cannot load drill metadata');
      const metadata=DrillMetadata.validate(await r.json());return {metadata,url};
    }));
    if(new Set(entries.map(e=>e.metadata.id)).size!==entries.length)throw Error('Duplicate drill id');
    return entries.filter(e=>DrillMetadata.matches(e.metadata,query));
  }
  async function open(id,{context={},onComplete=()=>{},onCancel=()=>{}}={}){
    if(current)throw Error('A drill is already open');
    const handle={};current=handle;
    try{
      const entry=(await list()).find(e=>e.metadata.id===id);if(!entry)throw Error('Unknown drill: '+id);
      const m=entry.metadata,dialog=document.createElement('dialog'),header=document.createElement('header'),title=document.createElement('h2'),close=document.createElement('button'),frame=document.createElement('iframe'),notice=document.createElement('p');
      const session=crypto.randomUUID(),origin=location.origin,previousFocus=document.activeElement;
      let done=false,ready=false;
      dialog.className='drill-modal';dialog.dir=m.direction;dialog.lang=m.language;dialog.setAttribute('aria-label',m.title);
      title.textContent=m.title;close.textContent='חזרה למשחק';close.type='button';close.setAttribute('aria-label','סגירת התרגול וחזרה למשחק');
      frame.title=m.title;frame.setAttribute('sandbox','allow-scripts allow-same-origin');
      if(m.capabilities.includes('microphone'))frame.setAttribute('allow',"microphone 'self'");
      notice.textContent='טוענים את התרגול…';notice.setAttribute('role','status');
      header.append(title,close);dialog.append(header,notice,frame);document.body.appendChild(dialog);
      const send=type=>frame.contentWindow?.postMessage({channel,type,session,context},origin);
      const timeout=setTimeout(()=>{if(!ready)notice.textContent='התרגול לא נטען. אפשר לחזור למשחק ולנסות שוב.';},10000);
      function finish(result){
        if(done)return;done=true;clearTimeout(timeout);window.removeEventListener('message',receive);send('dispose');
        dialog.close();frame.src='about:blank';dialog.remove();current=null;
        if(previousFocus?.isConnected)previousFocus.focus();
        if(result)onComplete(result);else onCancel();
      }
      function receive(event){
        const data=event.data;
        if(done||event.source!==frame.contentWindow||event.origin!==origin||data?.channel!==channel||data.session!==session)return;
        if(data.type==='ready'){ready=true;notice.hidden=true;clearTimeout(timeout);}
        if(data.type==='cancel')finish();
        if(ready&&data.type==='complete'&&data.result?.outcome==='success'&&m.assessment.methods.includes(data.result.method)&&typeof data.result.itemId==='string'&&data.result.itemId.length<100){
          finish({drillId:id,outcome:'success',method:data.result.method,itemId:data.result.itemId});
        }
      }
      window.addEventListener('message',receive);frame.onload=()=>{if(!done)send('init');};
      close.onclick=()=>finish();dialog.addEventListener('cancel',event=>{event.preventDefault();finish();});
      frame.src=new URL(m.entry,entry.url).href;dialog.showModal();close.focus();
      return {close:()=>finish(),metadata:m};
    }catch(error){current=null;throw error;}
  }
  root.DrillHost={list,open};
})(globalThis);

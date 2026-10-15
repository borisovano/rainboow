/* Small bridge, no layout contract. Inputs and outputs are plain JSON. */
(function(){
  let session=null,hostOrigin=null,finished=false,initHandler=()=>{};
  const cleanup=new Set();
  function dispose(){for(const fn of cleanup){try{fn();}catch{ /* Continue disposing other resources. */ }}cleanup.clear();}
  function send(type,result){if(!session||finished)return false;finished=true;dispose();parent.postMessage({channel:'adventure-drill-v1',session,type,result},hostOrigin);return true;}
  window.addEventListener('message',event=>{
    if(event.source!==parent||event.origin!==location.origin)return;
    const data=event.data;if(data?.channel!=='adventure-drill-v1')return;
    if(data.type==='init'&&!session&&typeof data.session==='string'){
      session=data.session;hostOrigin=event.origin;
      try{initHandler(data.params||{},data.context||{});parent.postMessage({channel:data.channel,type:'ready',session},hostOrigin);}catch{send('error');}
    }else if(data.type==='dispose'&&data.session===session){finished=true;dispose();}
  });
  // Keyboard events do not bubble from an iframe to its host dialog.
  window.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&!event.defaultPrevented&&session&&!finished)
      parent.postMessage({channel:'adventure-drill-v1',session,type:'request-cancel'},hostOrigin);
  });
  window.Drill={onStart(fn){initHandler=fn;},onDispose(fn){cleanup.add(fn);},complete(result){return send('complete',result);},cancel(){return send('cancel');}};
  window.addEventListener('pagehide',dispose);
})();

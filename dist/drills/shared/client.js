/* The only bridge a freestyle drill needs. No layout or component contract. */
(function(){
  let session=null,hostOrigin=null,finished=false,initHandler=()=>{};
  const cleanup=new Set();
  function dispose(){for(const fn of cleanup)fn();cleanup.clear();}
  window.addEventListener('message',event=>{
    if(event.source!==parent||event.origin!==location.origin)return;
    const data=event.data;
    if(data?.channel!=='adventure-drill-v1')return;
    if(data.type==='init'&&!session&&typeof data.session==='string'){
      session=data.session;hostOrigin=event.origin;initHandler(data.context||{});
      parent.postMessage({channel:data.channel,type:'ready',session},hostOrigin);
    }else if(data.type==='dispose'&&data.session===session){finished=true;dispose();}
  });
  function send(type,result){if(!session||finished)return false;finished=true;dispose();parent.postMessage({channel:'adventure-drill-v1',session,type,result},hostOrigin);return true;}
  window.Drill={onStart(fn){initHandler=fn;},onDispose(fn){cleanup.add(fn);},complete(result){return send('complete',result);},cancel(){return send('cancel');}};
  window.addEventListener('pagehide',dispose);
})();

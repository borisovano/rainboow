(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('../../character-studio/3d/wearables.js'));
  else root.DesignStudioHost=factory(root.CharacterWearables);
})(typeof window!=='undefined'?window:globalThis,function(W){
  'use strict';
  function create({dialog,frame,onApply,onCancel,env=window}){
    let session=null,counter=0;
    function close(){if(!session)return;session=null;dialog.close();frame.removeAttribute('src');}
    function receive(event){
      if(!session||event.origin!==env.location.origin||event.source!==frame.contentWindow||event.data?.session!==session)return;
      if(event.data.type==='wardrobe:cancel')onCancel();
      else if(event.data.type==='wardrobe:apply'&&W.validDesign(event.data.design))onApply({character:event.data.design.character,...W.sanitize(event.data.design)});
    }
    env.addEventListener('message',receive);
    dialog.addEventListener('cancel',event=>{event.preventDefault();onCancel();});
    return {open(design){
      session=env.crypto?.randomUUID?.()||Date.now()+'-'+(++counter);
      const url=new URL('character-studio/wardrobe/',env.location.href);
      url.searchParams.set('mode','game');url.searchParams.set('session',session);url.searchParams.set('character',design.character);
      const outfit=W.sanitize(design);for(const slot of ['upper','lower'])if(outfit[slot])url.searchParams.set(slot,outfit[slot]);
      frame.src=url.href;dialog.showModal();
    },close,isOpen:()=>session!==null,dispose(){close();env.removeEventListener('message',receive);}};
  }
  return {create};
});

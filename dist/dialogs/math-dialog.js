/* Standalone math-dialog UI. No game globals, framework, network or timers. */
(function(root){
  'use strict';
  let nextId=0;
  const stack=[], locks=new WeakMap();
  function merge(...definitions){
    const result={};
    for(const d of definitions.filter(Boolean)){
      Object.assign(result,d,{theme:{...result.theme,...d.theme},labels:{...result.labels,...d.labels},slots:{...result.slots,...d.slots}});
      if(d.groups)result.groups=[...d.groups];
    }
    return result;
  }
  function createRegistry(){
    const entries=new Map();
    return {
      register(id,definition,{replace=false}={}){
        if(typeof id!=='string'||!id.trim())throw Error('A dialog needs a nonempty id.');
        if(entries.has(id)&&!replace)throw Error(`Dialog already registered: ${id}`);
        entries.set(id,merge(definition));return this;
      },
      resolve(id,overrides={}){
        const seen=new Set();
        function visit(key){
          if(seen.has(key))throw Error(`Circular dialog inheritance: ${key}`);
          const value=entries.get(key);if(!value)throw Error(`Unknown dialog: ${key}`);
          seen.add(key);return merge(value.extends?visit(value.extends):null,value,{id:key});
        }
        return merge(visit(id),overrides);
      },
      list({group}={}){return [...entries.keys()].map(id=>this.resolve(id)).filter(d=>!group||(d.groups||[]).includes(group));},
      create(id,options={}){return createDialog(this.resolve(id,options));}
    };
  }
  function element(doc,tag,className,text){const n=doc.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=String(text);return n;}
  const parts={
    header(ctx){return ctx.node('h2','md-title',ctx.title,'title');},
    timer(ctx){return ctx.node('div','md-timer',ctx.timer??'','timer');},
    hint(ctx){const n=ctx.node('p','md-hint',ctx.hint||'','hint');n.setAttribute('role','status');return n;},
    problem(ctx){const box=ctx.node('div','md-problem');const text=ctx.node('div','md-expression',ctx.question.text,'problem');text.dir='ltr';box.appendChild(text);return box;},
    answers(ctx){
      const grid=ctx.node('div','md-answers',undefined,'answers');
      for(const choice of ctx.question.options||[]){
        const value=choice&&typeof choice==='object'?choice.value:choice;
        const label=choice&&typeof choice==='object'?choice.label:choice;
        const button=ctx.node('button','md-answer answer-btn',label);button.type='button';
        button.onclick=()=>ctx.submit(value,button);ctx.registerAnswer(button,value);grid.appendChild(button);
      }
      return grid;
    },
    footer(){return null;},
    cover(ctx){
      const box=ctx.node('div','md-breathing');
      if(ctx.cover.image){const img=ctx.node('img','md-breathing-image');img.src=ctx.cover.image;img.alt=ctx.cover.alt||ctx.labels.breathingTitle;box.appendChild(img);}
      box.appendChild(ctx.node('h2','md-breathing-title',ctx.cover.title||ctx.labels.breathingTitle));
      box.appendChild(ctx.node('p','md-breathing-copy',ctx.cover.text||ctx.labels.breathingText));return box;
    }
  };
  const defaults={dir:'rtl',dismissible:true,labels:{title:'אתגר חשבון',breathingTitle:'רגע לנשימה',breathingText:'נושמים בנחת, בקצב שלכם.'}};
  function createDialog(options={}){
    const doc=options.document||document,host=options.host||doc.body,prefix=options.idPrefix||`math-dialog-${++nextId}`;
    let config=merge(defaults,options), state={question:{text:'',options:[]},title:config.labels.title,hint:'',timer:null}, opened=false,disposed=false,covered=false,locked=false,previousFocus=null;
    let answers=[],cleanups=[],themeKeys=[],background=[];
    const ids=options.ids||{};
    const node=(tag,cls,text,key)=>{const n=element(doc,tag,cls,text);if(key)n.id=ids[key]||`${prefix}-${key}`;return n;};
    const overlay=node('div','md-overlay',undefined,'overlay'),card=node('div','md-card'),content=node('div','md-content',undefined,'content'),cover=node('div','md-cover',undefined,'cover');
    overlay.hidden=true;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label',config.labels.title);overlay.tabIndex=-1;
    card.appendChild(content);card.appendChild(cover);overlay.appendChild(card);host.appendChild(overlay);cover.tabIndex=-1;cover.hidden=true;
    function assertAlive(){if(disposed)throw Error('This dialog has been destroyed.');}
    function cleanup(){for(const fn of cleanups.splice(0))fn();}
    function context(){return {...state,cover:config.cover||{},labels:config.labels,document:doc,node,parts,dialog:api,
      submit(value,control){if(opened&&!covered&&!locked&&!control?.disabled)config.onAnswer?.(value,control,api);},
      registerAnswer(control,value){answers.push({control,value});},
      onCleanup(fn){cleanups.push(fn);}};}
    function render(){
      cleanup();answers=[];locked=false;content.replaceChildren();overlay.dir=config.dir;
      overlay.setAttribute('aria-label',state.title||config.labels.title);
      for(const key of themeKeys)overlay.style.removeProperty(key);
      themeKeys=Object.keys(config.theme||{}).filter(key=>key.startsWith('--md-'));
      for(const key of themeKeys)overlay.style.setProperty(key,config.theme[key]);
      card.className='md-card'+(config.className?' '+config.className:'');
      const ctx=context(),resolved={};
      for(const name of ['header','timer','hint','problem','answers','footer']){
        const renderer=config.slots[name]===undefined?parts[name]:config.slots[name];
        resolved[name]=renderer?renderer(ctx):null;
      }
      if(config.layout){const layout=config.layout(ctx,resolved);if(layout)content.appendChild(layout);}
      else for(const n of Object.values(resolved))if(n)content.appendChild(n);
      api.setTimer(state.timer);api.setHint(state.hint);
    }
    function focusable(){return [...overlay.querySelectorAll('button,input,select,textarea,a[href],[tabindex]')].filter(n=>!n.disabled&&!n.hidden&&n.tabIndex!==-1&&!n.closest('[hidden],[inert]'));}
    function keydown(event){
      if(!opened||stack.at(-1)!==api)return;
      if(event.key==='Escape'&&config.dismissible){event.preventDefault();api.hide('escape');return;}
      if(event.key==='Tab'){
        const controls=focusable(),first=controls[0],last=controls.at(-1);
        if(!first){event.preventDefault();(covered?cover:overlay).focus();}
        else if(event.shiftKey&&(doc.activeElement===first||!controls.includes(doc.activeElement))){event.preventDefault();last.focus();}
        else if(!event.shiftKey&&(doc.activeElement===last||!controls.includes(doc.activeElement))){event.preventDefault();first.focus();}
      }
    }
    const api={
      element:overlay,parts,
      configure(overrides={}){assertAlive();config=merge(defaults,options,overrides);return api;},
      render(question,{title=config.labels.title,hint='',timer=null}={}){assertAlive();api.setCover(false);state={question,title,hint,timer};render();return api;},
      show(){assertAlive();if(!opened){previousFocus=doc.activeElement;opened=true;stack.push(api);background=[...(config.background||[])];for(const n of background){const lock=locks.get(n)||{count:0,inert:n.inert};lock.count++;locks.set(n,lock);n.inert=true;}doc.addEventListener('keydown',keydown);config.onOpen?.(api);}overlay.hidden=false;overlay.classList.add('active');api.focusAnswer();return api;},
      hide(reason='close'){
        if(!opened)return api;const top=stack.at(-1)===api;opened=false;stack.splice(stack.indexOf(api),1);doc.removeEventListener('keydown',keydown);
        overlay.hidden=true;overlay.classList.remove('active');api.setCover(false);
        for(const n of background){const lock=locks.get(n);if(--lock.count===0){n.inert=lock.inert;locks.delete(n);}}background=[];
        if(top&&previousFocus?.isConnected)previousFocus.focus();config.onClose?.(reason,api);return api;
      },
      setTimer(value){state.timer=value;const n=content.querySelector('#'+(ids.timer||`${prefix}-timer`));if(n){n.hidden=value===null;n.textContent=value===null?'':String(value);}return api;},
      setHint(text){state.hint=text;const n=content.querySelector('#'+(ids.hint||`${prefix}-hint`));if(n)n.textContent=text;return api;},
      getHint(){return state.hint;},
      setCover(value){
        covered=!!value;content.inert=covered;content.classList.toggle('breathing',covered);cover.hidden=!covered;cover.classList.toggle('active',covered);
        cover.replaceChildren();if(covered){const renderer=config.slots.cover===undefined?parts.cover:config.slots.cover;const child=renderer?.(context());if(child)cover.appendChild(child);cover.focus();}return api;
      },
      focusAnswer(){if(opened)(covered?cover:focusable()[0]||overlay).focus();return api;},
      lockAnswers(value=true){locked=value;for(const {control} of answers)control.disabled=value;return api;},
      markAnswer(control,result){control?.classList.remove('correct','wrong');if(result)control?.classList.add(result);return api;},
      hideAnswer(predicate){const answer=answers.find(a=>predicate(a.value)&&!a.control.hidden);if(!answer)return false;answer.control.disabled=true;answer.control.hidden=true;return true;},
      destroy(){if(disposed)return;api.hide('destroy');cleanup();overlay.remove();disposed=true;},
      get isOpen(){return opened;},get isCovered(){return covered;}
    };
    overlay.addEventListener('click',event=>{if(event.target===overlay&&config.dismissible)api.hide('backdrop');});
    render();return api;
  }
  const exported={createDialog,createRegistry,merge,parts};
  root.MathDialogs=exported;if(typeof module!=='undefined'&&module.exports)module.exports=exported;
})(globalThis);

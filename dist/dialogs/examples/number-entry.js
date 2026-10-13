/* An optional contribution: replace just the answer section, reuse the shell. */
(function(root){
  function register(registry){
    registry.register('number-entry',{
      extends:'practice',name:'Type an answer',groups:['untimed','examples','alternative-input'],
      theme:{'--md-accent':'#7c3aed','--md-ink':'#5b21b6','--md-panel':'#f5f3ff'},
      slots:{
        answers(ctx){
          const form=ctx.node('form','md-answers');form.style.gridTemplateColumns='1fr';
          const input=ctx.node('input','md-input');input.type='number';input.step='any';input.required=true;input.dir='ltr';input.setAttribute('aria-label','התשובה שלכם');
          const submit=ctx.node('button','md-answer','בדיקת תשובה');submit.type='submit';
          ctx.registerAnswer(input,undefined);ctx.registerAnswer(submit,undefined);
          form.appendChild(input);form.appendChild(submit);
          form.onsubmit=event=>{event.preventDefault();if(input.value.trim()&&Number.isFinite(Number(input.value)))ctx.submit(Number(input.value),submit);};
          return form;
        },
        footer(ctx){return ctx.node('p','md-footer','אפשר להקליד תשובה וללחוץ Enter.');}
      }
    });
  }
  root.NumberEntryDialog={register};
})(globalThis);

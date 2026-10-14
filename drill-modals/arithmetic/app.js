(function(){
  let dialog=null,timer=null;
  Drill.onDispose(()=>{clearInterval(timer);dialog?.destroy();});
  Drill.onStart(params=>{
    const registry=MathDialogPresets.register(MathDialogs.createRegistry());NumberEntryDialog.register(registry);
    const question=Arithmetic.question(params);let attempts=0,finished=false,seconds=params.seconds??0;
    dialog=registry.create(params.answerMode==='typed'?'number-entry':'practice',{
      onAnswer(value,control){
        if(finished)return;attempts++;
        if(value!==question.answer){dialog.markAnswer(control,'wrong');dialog.setHint('עוד ניסיון — אתם יכולים!');return;}
        finished=true;clearInterval(timer);dialog.lockAnswers();dialog.markAnswer(control,'correct');dialog.setHint('נכון! כל הכבוד.');
        showFinish('success');
      },slots:{footer(ctx){const button=ctx.node('button','finish','סיום התרגול');button.id='finish';button.hidden=true;button.type='button';return button;}}
    });
    function showFinish(outcome){const button=document.getElementById('finish');button.hidden=false;button.onclick=()=>Drill.complete({outcome,method:'answer',itemId:question.itemId,attempts,details:{operation:params.operation??'add',answerMode:params.answerMode??'choice'}});button.focus();}
    dialog.render(question,{title:'אתגר חשבון',timer:seconds||null}).show();
    if(seconds)timer=setInterval(()=>{dialog.setTimer(--seconds);if(!seconds){finished=true;clearInterval(timer);dialog.lockAnswers();dialog.setHint('הזמן נגמר. אפשר לסיים ולנסות שוב.');showFinish('failure');}},1000);
  });
})();

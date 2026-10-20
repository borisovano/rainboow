(function(){
  let dialog=null,timer=null,completionTimer=null,breathTimer=null,disposed=false;
  Drill.onDispose(()=>{disposed=true;clearInterval(timer);clearTimeout(completionTimer);clearTimeout(breathTimer);dialog?.destroy();});
  Drill.onStart(params=>{
    const registry=MathDialogPresets.register(MathDialogs.createRegistry());NumberEntryDialog.register(registry);
    const question=Arithmetic.question(params),breath=params.features.breathing;let attempts=0,finished=false,seconds=params.seconds??0;
    dialog=registry.create(params.answerMode==='typed'?'number-entry':'practice',{
      cover:{image:'../../assets/breathing-child.png',text:'נשימה רגועה. מיד חוזרים לתרגיל.'},
      breathing:breath.enabled?{label:`נשימה קצרה · ${breath.durationSeconds} שניות`,onRequest(){
        if(finished||disposed||breathTimer!==null)return;
        clearInterval(timer);dialog.setBreathingDuration(breath.durationSeconds).setCover(true);
        breathTimer=setTimeout(()=>{
          breathTimer=null;if(disposed||finished)return;
          seconds=params.seconds??0;dialog.setCover(false).setTimer(seconds||null).focusAnswer();startTimer();
        },breath.durationSeconds*1000);
      }}:null,
      onAnswer(value,control){
        if(finished)return;attempts++;
        if(value!==question.answer){dialog.markAnswer(control,'wrong');dialog.setHint('עוד ניסיון — אתם יכולים!');return;}
        finished=true;clearInterval(timer);dialog.lockAnswers();dialog.markAnswer(control,'correct');dialog.setHint('נכון! כל הכבוד.');
        showFinish('success');
      }
    });
    function showFinish(outcome){completionTimer=setTimeout(()=>Drill.complete({outcome,method:'answer',itemId:question.itemId,attempts,details:{operation:params.operation??'add',answerMode:params.answerMode??'choice'}}),800);}
    dialog.render(question,{title:'אתגר חשבון',timer:seconds||null}).show();
    function startTimer(){clearInterval(timer);if(seconds)timer=setInterval(()=>{dialog.setTimer(--seconds);if(!seconds){finished=true;clearInterval(timer);dialog.lockAnswers();dialog.setHint('הזמן נגמר. ננסה שוב בפעם הבאה.');showFinish('failure');}},1000);}
    startTimer();
  });
})();

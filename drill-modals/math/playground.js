(function(){
  const registry=MathDialogPresets.register(MathDialogs.createRegistry());
  NumberEntryDialog.register(registry);
  registry.register('breathing',{extends:'timed',name:'Optional breathing bonus',groups:['timed','wellbeing'],cover:{image:'../../assets/breathing-child.png',text:'נשימה רגועה. הזמן יתחיל מחדש.'}});
  registry.register('composed',{extends:'practice',name:'A different composition',groups:['examples'],layout(ctx,sections){
    const box=ctx.node('section');
    for(const name of ['header','problem','answers','hint','timer','footer'])if(sections[name])box.appendChild(sections[name]);
    return box;
  }});
  const page=document.getElementById('playground'),list=document.getElementById('examples'),group=document.getElementById('group'),status=document.getElementById('status');
  let active=null,tick=null,pause=null;
  function clearTimers(){clearInterval(tick);clearTimeout(pause);tick=pause=null;}
  for(const tag of [...new Set(registry.list().flatMap(d=>d.groups||[]))].sort()){
    const option=document.createElement('option');option.value=tag;option.textContent=tag;group.appendChild(option);
  }
  function launch(id){
    clearTimers();active?.destroy();
    const preset=registry.resolve(id),timed=preset.groups.includes('timed'),breath=GameFeatures.drillParams('math').features.breathing;
    const footer=preset.slots.footer;
    const dialog=registry.create(id,{background:[page],dismissible:true,
      breathing:id==='breathing'&&breath.enabled?{label:`נשימה קצרה · ${breath.durationSeconds} שניות`,onRequest(){clearTimers();dialog.setBreathingDuration(breath.durationSeconds).setCover(true);pause=setTimeout(()=>{pause=null;dialog.setCover(false).setTimer(30).focusAnswer();startTimer();},breath.durationSeconds*1000);}}:undefined,
      slots:{footer(ctx){const box=ctx.node('div');const contribution=footer?.(ctx);if(contribution)box.appendChild(contribution);const close=ctx.node('button','demo-close','Close preview');close.type='button';close.onclick=()=>ctx.dialog.hide();box.appendChild(close);return box;}},
      onAnswer(value,control){clearTimers();dialog.lockAnswers();dialog.markAnswer(control,value===12?'correct':'wrong');dialog.setHint(value===12?'נכון! כל הכבוד.':'כמעט! התשובה היא 12.');status.textContent=`${preset.name}: ${value===12?'correct answer':'try again by reopening the preview'}.`;},
      onClose(){clearTimers();}
    });
    active=dialog;dialog.render({text:'7 + 5 = ?',options:[10,12,14,15]},{title:'אתגר חשבון',hint:'בחרו את התשובה הנכונה',timer:timed?30:null}).show();
    function startTimer(){let remaining=30;tick=setInterval(()=>{dialog.setTimer(--remaining);if(!remaining){clearTimers();dialog.lockAnswers();dialog.setHint('הזמן נגמר. אפשר לנסות שוב.');}},1000);}
    if(timed)startTimer();
  }
  function draw(){list.replaceChildren();for(const preset of registry.list({group:group.value})){
    const card=document.createElement('article');card.className='example';
    const title=document.createElement('h2');title.textContent=preset.name;
    const tags=document.createElement('p');tags.className='tags';tags.textContent=preset.groups.join(' · ');
    const button=document.createElement('button');button.className='launch';button.textContent='Try '+preset.name;button.onclick=()=>launch(preset.id);
    card.append(title,tags,button);list.appendChild(card);
  }}
  group.onchange=draw;draw();
})();

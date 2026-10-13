(async function(){
  const status=document.getElementById('status'),list=document.getElementById('examples');
  try{
    const entries=await DrillHost.list(),filters=['language','level','proficiency','letters','groups'];
    for(const key of filters){
      const values=entries.flatMap(({metadata:m})=>key==='level'?[m.difficulty.level]:key==='proficiency'?[m.proficiency.value]:Array.isArray(m[key])?m[key]:[m[key]]);
      for(const value of [...new Set(values)]){const option=document.createElement('option');option.value=value;option.textContent=value;document.getElementById(key).appendChild(option);}
      document.getElementById(key).onchange=draw;
    }
    function draw(){
      const query={};for(const key of filters){const value=document.getElementById(key).value;if(value)query[key]=key==='level'?Number(value):value;}
      list.replaceChildren();
      for(const {metadata:m} of entries.filter(e=>DrillMetadata.matches(e.metadata,query))){
        const card=document.createElement('article');card.className='example';
        const title=document.createElement('h2');title.textContent=m.title;title.lang=m.language;
        const description=document.createElement('p');description.textContent=m.difficulty.description;
        const tags=document.createElement('p');tags.className='tags';tags.textContent=`${m.language} · level ${m.difficulty.level} · ${m.proficiency.value} · ${m.groups.join(' / ')}`;
        const button=document.createElement('button');button.className='launch';button.textContent='Try Hebrew reading';
        button.onclick=async()=>{button.disabled=true;try{await DrillHost.open(m.id,{context:{gameLevel:1,wordIndex:0},onComplete:r=>{status.textContent=`Completed: ${r.itemId} (${r.method}). In the game, this rescues the friend.`;button.focus();},onCancel:()=>{status.textContent='Closed without completing. The friend stays available.';button.focus();}});}catch{status.textContent='Could not open the drill. Please retry.';}finally{button.disabled=false;}};
        const details=document.createElement('details'),summary=document.createElement('summary'),pre=document.createElement('pre');summary.textContent='View metadata';pre.style.whiteSpace='pre-wrap';pre.style.overflowWrap='anywhere';pre.textContent=JSON.stringify(m,null,2);details.append(summary,pre);
        card.append(title,description,tags,button,details);list.appendChild(card);
      }
      status.textContent=`${list.children.length} drill(s) match these tags.`;
    }
    draw();
  }catch(error){status.textContent='Could not load drill metadata: '+error.message;}
})();

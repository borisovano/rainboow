/* Pure learning logic, usable by browser UI and Node unit tests. */
(function(root){
  function normalize(value){return value.normalize('NFD').replace(/[\u0591-\u05C7]/g,'').replace(/[^\u05D0-\u05EA\s]/g,'').trim().replace(/\s+/g,' ');}
  function plan(words,params={}){
    const grade=params.grade??1;
    if(!Number.isInteger(grade)||grade<1||grade>4)throw Error('grade must be 1–4.');
    const requested=params.wordLength??'grade';
    const length=requested==='grade'?String(grade+1):requested;
    if(!['all','2','3','4','5'].includes(length))throw Error('Invalid wordLength.');
    const pool=words.filter(word=>length==='all'||normalize(word).length===Number(length));
    if(!pool.length)throw Error('No words match wordLength.');
    let index=(params.wordIndex??0)%pool.length;
    if(params.word){index=pool.findIndex(word=>normalize(word)===normalize(params.word));if(index<0)throw Error('The requested word is not in the selected word bank.');}
    return {pool,index};
  }
  // Speech services often return unpointed full spelling for pointed words.
  const spellingAliases={'עיפרון':'עפרון','מטרייה':'מטריה'};
  function matches(transcript,target){const heard=normalize(transcript),word=normalize(target);return !!heard&&(spellingAliases[heard]??heard)===(spellingAliases[word]??word);}
  root.HebrewReading={normalize,plan,matches};if(typeof module!=='undefined')module.exports=root.HebrewReading;
})(globalThis);

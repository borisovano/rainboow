/* Pure learning logic, usable by browser UI and Node unit tests. */
(function(root){
  function normalize(value){return value.normalize('NFD').replace(/[\u0591-\u05C7]/g,'').replace(/[^\u05D0-\u05EA\s]/g,'').trim().replace(/\s+/g,' ');}
  function plan(words,params={}){
    const length=params.wordLength??'all';
    const pool=words.filter(word=>length==='all'||normalize(word).length===Number(length));
    if(!pool.length)throw Error('No words match wordLength.');
    let index=(params.wordIndex??0)%pool.length;
    if(params.word){index=pool.findIndex(word=>normalize(word)===normalize(params.word));if(index<0)throw Error('The requested word is not in the selected word bank.');}
    return {pool,index};
  }
  function matches(transcript,target){return !!normalize(transcript)&&normalize(transcript)===normalize(target);}
  root.HebrewReading={normalize,plan,matches};if(typeof module!=='undefined')module.exports=root.HebrewReading;
})(globalThis);

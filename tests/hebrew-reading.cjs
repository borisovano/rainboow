const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const document=require('./helpers/dom.cjs').createDocument({autocreate:true});
let recognition,start,dispose,result,aborted=0;
class Recognition{constructor(){recognition=this;}start(){}abort(){aborted++;}stop(){}}
const ctx={document,window:{SpeechRecognition:Recognition,addEventListener(){}},HebrewWords:require('../dist/drills/hebrew-reading/words.js'),Drill:{onStart:fn=>start=fn,onDispose:fn=>dispose=fn,complete:r=>result=r},setTimeout:()=>1,clearTimeout(){},console};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(require.resolve('../dist/drills/hebrew-reading/app.js'),'utf8'),ctx);
start({wordIndex:0});assert.equal(document.getElementById('word').textContent,'דָּג');
document.getElementById('mic').click();assert.equal(recognition.lang,'he-IL');
recognition.onresult({resultIndex:0,results:[[{transcript:'גן'}]]});recognition.onend();
assert.equal(result,undefined);assert(document.getElementById('return-to-game').hidden);
document.getElementById('mic').click();recognition.onerror({error:'not-allowed'});recognition.onend();assert.equal(result,undefined);
document.getElementById('mic').click();recognition.onresult({resultIndex:0,results:[[{transcript:'דג'}]]});
assert(!document.getElementById('return-to-game').hidden);assert.equal(result,undefined,'Wait for learner to return');
document.getElementById('return-to-game').click();assert.equal(result.method,'speech-transcript');assert.equal(result.itemId,'דג');
recognition.onend();start({wordIndex:1});assert(document.getElementById('return-to-game').hidden);
document.getElementById('adult-confirm').checked=true;document.getElementById('adult-submit').click();document.getElementById('return-to-game').click();assert.equal(result.method,'adult-confirmed');assert.equal(result.itemId,'גן');
document.getElementById('mic').click();dispose();assert.equal(aborted,1);
console.log('PASS: Hebrew wrong answer and denied mic do not complete, normalized match and adult confirmation return distinct results, next word resets, disposal aborts recognition.');

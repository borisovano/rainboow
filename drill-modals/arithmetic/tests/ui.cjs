const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function fixture(params){
 const document=require('../../helpers/testing/dom.cjs').createDocument();let start,dispose,result,tick,finish,completions=0;
 const ctx={document,Drill:{onStart:fn=>start=fn,onDispose:fn=>dispose=fn,complete:r=>{result=r;completions++;}},setInterval:fn=>{tick=fn;return 1;},clearInterval:()=>{tick=null;},setTimeout:fn=>{finish=fn;return 2;},clearTimeout:()=>{finish=null;}};
 vm.createContext(ctx);for(const file of ['math-dialog.js','presets.js','examples/number-entry.js','logic.js','app.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx);
 start(params);return {document,dispose,get result(){return result;},get completions(){return completions;},tick:()=>tick?.(),flush:()=>{const fn=finish;finish=null;fn?.();}};
}
let f=fixture({a:6,b:8,operation:'multiply',answerMode:'typed'}),input=f.document.querySelector('input'),form=f.document.querySelector('form');
input.value='47';form.onsubmit({preventDefault(){}});f.flush();assert.equal(f.result,undefined);
input.value='48';form.onsubmit({preventDefault(){}});form.onsubmit({preventDefault(){}});assert.equal(f.result,undefined);f.flush();assert.equal(f.result.outcome,'success');assert.equal(f.result.attempts,2);assert.equal(f.completions,1);assert.equal(f.document.getElementById('finish'),null);f.dispose();assert.equal(f.document.body.children.length,0);
f=fixture({a:3,b:4,operation:'add',seconds:2});f.tick();f.flush();assert.equal(f.result,undefined);f.tick();f.flush();assert.equal(f.result.outcome,'failure');assert.equal(f.result.attempts,0);f.dispose();
f=fixture({a:3,b:4,operation:'add',seconds:1});f.tick();f.dispose();f.flush();assert.equal(f.result,undefined,'Disposed drills cannot report late results');
console.log('PASS: arithmetic retries, automatic one-time completion, timeout failure, and pending-result cleanup.');

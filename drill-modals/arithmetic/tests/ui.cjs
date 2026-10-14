const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function fixture(params){
 const document=require('../../helpers/testing/dom.cjs').createDocument();let start,dispose,result,tick;
 const ctx={document,Drill:{onStart:fn=>start=fn,onDispose:fn=>dispose=fn,complete:r=>result=r},setInterval:fn=>{tick=fn;return 1;},clearInterval:()=>{tick=null;}};
 vm.createContext(ctx);for(const file of ['math-dialog.js','presets.js','examples/number-entry.js','logic.js','app.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx);
 start(params);return {document,dispose,get result(){return result;},tick:()=>tick?.()};
}
let f=fixture({a:6,b:8,operation:'multiply',answerMode:'typed'}),input=f.document.querySelector('input'),form=f.document.querySelector('form');
input.value='47';form.onsubmit({preventDefault(){}});assert.equal(f.result,undefined);assert(f.document.getElementById('finish').hidden);
input.value='48';form.onsubmit({preventDefault(){}});f.document.getElementById('finish').click();assert.equal(f.result.outcome,'success');assert.equal(f.result.attempts,2);f.dispose();assert.equal(f.document.body.children.length,0);
f=fixture({a:3,b:4,operation:'add',seconds:2});f.tick();assert(f.document.getElementById('finish').hidden);f.tick();assert(!f.document.getElementById('finish').hidden);f.document.getElementById('finish').click();assert.equal(f.result.outcome,'failure');assert.equal(f.result.attempts,0);f.dispose();
console.log('PASS: arithmetic typed retry/success, attempt count, timer expiry/failure, and UI disposal.');

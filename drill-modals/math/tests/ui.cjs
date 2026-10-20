const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function fixture(params){
 const document=require('../../helpers/testing/dom.cjs').createDocument();let start,dispose,result,tick,completions=0,now=0,nextId=2;const timeouts=new Map();
 const ctx={document,Drill:{onStart:fn=>start=fn,onDispose:fn=>dispose=fn,complete:r=>{result=r;completions++;}},setInterval:fn=>{tick=fn;return 1;},clearInterval:()=>{tick=null;},setTimeout:(fn,delay)=>{const id=nextId++;timeouts.set(id,{fn,at:now+delay});return id;},clearTimeout:id=>timeouts.delete(id)};
 vm.createContext(ctx);for(const file of ['math-dialog.js','presets.js','examples/number-entry.js','logic.js','app.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx);
 start(require('../../helpers/contract.js').parameters(require('../drill.json'),params));return {document,dispose,get result(){return result;},get completions(){return completions;},tick:()=>tick?.(),flush:(ms=800)=>{now+=ms;for(const [id,t] of [...timeouts])if(t.at<=now){timeouts.delete(id);t.fn();}}};
}
let f=fixture({a:6,b:8,operation:'multiply',answerMode:'typed'}),input=f.document.querySelector('input'),form=f.document.querySelector('form');
input.value='47';form.onsubmit({preventDefault(){}});f.flush();assert.equal(f.result,undefined);
input.value='48';form.onsubmit({preventDefault(){}});form.onsubmit({preventDefault(){}});assert.equal(f.result,undefined);f.flush();assert.equal(f.result.outcome,'success');assert.equal(f.result.attempts,2);assert.equal(f.completions,1);assert.equal(f.document.getElementById('finish'),null);f.dispose();assert.equal(f.document.body.children.length,0);
f=fixture({a:3,b:4,operation:'add',seconds:2});f.tick();f.flush();assert.equal(f.result,undefined);f.tick();f.flush();assert.equal(f.result.outcome,'failure');assert.equal(f.result.attempts,0);f.dispose();
f=fixture({a:3,b:4,operation:'add',seconds:1});f.tick();f.dispose();f.flush();assert.equal(f.result,undefined,'Disposed drills cannot report late results');
f=fixture({a:3,b:4,operation:'add',seconds:3});f.tick();f.tick();
const question=f.document.querySelector('.md-expression').textContent,bonus=f.document.querySelector('.md-breath-button');bonus.click();
assert.equal(f.document.querySelector('.md-expression').textContent,question);assert(!f.document.querySelector('.md-content').inert);assert(f.document.querySelector('.md-answer-body').inert);assert(bonus.disabled);
f.tick();assert.equal(f.document.querySelector('.md-timer').textContent,'1');f.flush(9999);assert(bonus.disabled);f.flush(1);
assert.equal(f.document.querySelector('.md-timer').textContent,'3');assert(!bonus.disabled);assert(!f.document.querySelector('.md-answer-body').inert);assert.equal(f.result,undefined);f.dispose();
f=fixture({a:3,b:4,operation:'add',answerMode:'typed',seconds:5});f.document.querySelector('.md-breath-button').click();input=f.document.querySelector('input');form=f.document.querySelector('form');
assert(input.disabled);input.value='7';form.onsubmit({preventDefault(){}});f.flush(800);assert.equal(f.result,undefined);f.dispose();f.flush(10000);assert.equal(f.result,undefined);assert.equal(f.document.body.children.length,0);
f=fixture({features:{breathing:{enabled:false}}});assert.equal(f.document.querySelector('.md-breath-button'),null);f.dispose();
f=fixture({seconds:9,features:{breathing:{durationSeconds:2}}});f.tick();f.document.querySelector('.md-breath-button').click();f.flush(1999);assert(f.document.querySelector('.md-answer-body').inert);f.flush(1);assert(!f.document.querySelector('.md-answer-body').inert);assert.equal(f.document.querySelector('.md-timer').textContent,'9');f.dispose();
console.log('PASS: arithmetic retries, completion, timeout, optional ten-second breathing, visible exercise, typed answer blocking, full timer reset and disposal cleanup.');

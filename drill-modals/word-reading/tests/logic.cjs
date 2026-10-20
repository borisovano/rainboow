const assert=require('node:assert/strict');
const {normalize,plan,matches}=require('../logic.js'),words=require('../words.js');
const {parameters}=require('../../helpers/contract.js'),manifest=require('../drill.json');
assert.equal(normalize('דָּג!'),'דג');assert(matches('דג','דָּג'));assert(!matches('דג גדול','דָּג'));assert(!matches('','דָּג'));
const input=parameters(manifest,{word:'כלב',wordLength:'3',sound:false});
const selected=plan(words,input);assert.equal(selected.pool[selected.index],'כֶּלֶב');assert(selected.pool.every(w=>normalize(w).length===3));
assert.equal(plan(words,{wordIndex:words.length+1,wordLength:'all'}).index,1);assert.throws(()=>plan(words,{word:'כלב',wordLength:'2'}),/word bank/);
assert.throws(()=>parameters(manifest,{wordIndex:-1}));assert.throws(()=>parameters(manifest,{sound:'false'}));assert.throws(()=>parameters(manifest,{grade:0}));assert.throws(()=>parameters(manifest,{grade:5}));
for(let grade=1;grade<=4;grade++){const selected=plan(words,parameters(manifest,{grade,wordIndex:9999}));assert(selected.pool.length>=8);assert(selected.pool.every(w=>normalize(w).length===grade+1));assert(selected.pool[selected.index]);}
assert.equal(plan(words,{grade:4,wordLength:'2'}).pool.length,11);assert.equal(plan(words,{grade:4,word:'מטריה'}).pool.find(w=>normalize(w)==='מטריה'),'מִטְרִיָּה');
for(const example of manifest.examples)plan(words,parameters(manifest,example.params));
console.log('PASS: Hebrew normalization, whole-word matching, deterministic word selection, length filtering, input validation and all documented examples.');

assert(matches('עיפרון','עִפָּרוֹן'));assert(matches('מטרייה','מִטְרִיָּה'));assert(!matches('מטרייה גדולה','מִטְרִיָּה'));assert(!matches('עפרונות','עִפָּרוֹן'));

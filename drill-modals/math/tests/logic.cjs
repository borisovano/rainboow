const assert=require('node:assert/strict');
const {question}=require('../logic.js'),manifest=require('../drill.json');
const {parameters,completion}=require('../../helpers/contract.js');
assert.equal(question(parameters(manifest)).answer,12);
assert.equal(question({a:6,b:8,operation:'multiply'}).answer,48);
assert.equal(question({a:2,b:5,operation:'subtract'}).answer,-3);
for(const operation of ['add','subtract','multiply'])for(const a of [0,1,100])for(const b of [0,1,100]){
 const q=question({a,b,operation});assert(q.options.includes(q.answer));assert.equal(new Set(q.options).size,4);
}
assert.throws(()=>parameters(manifest,{seconds:-1}));assert.throws(()=>parameters(manifest,{a:1.2}));assert.throws(()=>parameters(manifest,{operation:'divide'}));
for(const example of manifest.examples)question(parameters(manifest,example.params));
assert.equal(completion(manifest,{outcome:'failure',method:'answer',itemId:'add:7:5',attempts:2},5000).outcome,'failure');
console.log('PASS: arithmetic operations, distractors, explicit parameters, bounds, examples and failure results.');

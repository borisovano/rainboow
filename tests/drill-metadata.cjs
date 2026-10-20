const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {validate,matches}=require('../drill-modals/helpers/metadata.js');
const base=path.join(__dirname,'../drill-modals');
const catalog=JSON.parse(fs.readFileSync(path.join(base,'catalog.json')));
const contract=require('../drill-modals/helpers/contract.js');
const ids=new Set();
for(const file of catalog){
 const m=validate(JSON.parse(fs.readFileSync(path.join(base,file))));assert(!ids.has(m.id));ids.add(m.id);
 contract.parameters(m);for(const example of m.examples||[])contract.parameters(m,example.params);
 assert(fs.existsSync(path.join(base,m.id,'tests')),'Each drill needs colocated tests');
 const folder=path.dirname(path.join(base,file));assert(fs.existsSync(path.join(folder,m.entry)));
 const html=fs.readFileSync(path.join(folder,m.entry),'utf8');
 assert(html.includes('helpers/client.js'));assert(html.includes('Content-Security-Policy'));
 assert(!/<script(?![^>]*\bsrc=)[^>]*>\s*\S/i.test(html),'Use local external scripts');
 assert(!/\son\w+\s*=/i.test(html),'Avoid inline event handlers');
 assert(!/<script[^>]+src=["']https?:/i.test(html),'No remote scripts in drills');
}
const m=JSON.parse(fs.readFileSync(path.join(base,'word-reading/drill.json')));
const words=require('../drill-modals/word-reading/words.js');
const bare=w=>w.normalize('NFD').replace(/[^\u05d0-\u05ea]/g,'');
assert.equal(m.content.itemCount,words.length);assert.equal(m.content.source,'words.js');
const letterNames=Object.fromEntries([..."אבגדהוזחטיךכלםמןנסעףפץצקרשת"].map((letter,index)=>[letter,['alef','bet','gimel','dalet','he','vav','zayin','het','tet','yod','final-kaf','kaf','lamed','final-mem','mem','final-nun','nun','samekh','ayin','final-pe','pe','final-tsadi','tsadi','qof','resh','shin','tav'][index]]));
assert.deepEqual(m.letters,[...new Set(words.map(bare).join(''))].sort().map(letter=>letterNames[letter]));
assert.deepEqual(m.content.wordLengths,[...new Set(words.map(w=>bare(w).length))].sort());

assert(matches(m,{language:'he-IL',level:1,gameLevel:1,proficiency:'beginning-word-reader',letters:['dalet','gimel'],groups:'reading'}));
assert(!matches(m,{language:'en'}));assert(!matches(m,{level:2}));assert(matches(m,{letters:'alef'}));assert(!matches(m,{letters:'zayin'}));for(const gameLevel of [1,2,3,4])assert(matches(m,{gameLevel}));assert(!matches(m,{gameLevel:5}));assert(matches(m,{groups:'stage-lock'}));
assert.throws(()=>validate({...m,entry:'../index.html'}));assert.throws(()=>validate({...m,language:'invalid_tag'}));assert.throws(()=>validate({...m,difficulty:{level:1}}));assert.throws(()=>validate({...m,letters:['dalet','dalet']}));
assert.throws(()=>validate({...m,title:'מילה'}),/English metadata/);
assert.throws(()=>validate({...m,defaultParams:{}}),/missing default/);
assert(matches(m,{labels:['chrome','reading']}));
for(const file of catalog){const raw=fs.readFileSync(path.join(base,file),'utf8');assert(!/[\u0590-\u05ff]/.test(raw),'Metadata must not contain Hebrew');assert.equal(require('../drill-modals/registry.js').find(d=>d.id===JSON.parse(raw).id).title,JSON.parse(raw).title);}
function filenames(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){assert(!/[\u0590-\u05ff]/.test(entry.name));if(entry.isDirectory())filenames(path.join(dir,entry.name));}}filenames(base);
console.log('PASS: drill metadata, local HTML guardrails, accurate Hebrew word/letter inventory, language/level/proficiency/group filters.');

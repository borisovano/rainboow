const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createStore,STORAGE_KEY}=require('../dist/features/flags.js');
const data=new Map([['unrelated','keep me']]);
const storage={getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)};
function environment(search='') {const handlers={};return {localStorage:storage,location:{search},addEventListener:(name,fn)=>handlers[name]=fn,removeEventListener:name=>delete handlers[name],handlers};}
const env=environment(),flags=createStore(env);
assert.equal(flags.enabled('pipCharacter'),false);assert.equal(flags.enabled('unknown'),false);
assert.equal(flags.snapshot()[0].source,'default');
let changes=0;const unsubscribe=flags.subscribe(()=>changes++);
assert.equal(flags.setOverride('pipCharacter',true),true);
assert.equal(flags.enabled('pipCharacter'),true);assert.equal(flags.snapshot()[0].source,'browser');assert.equal(changes,1);
const gameEnv=environment(),game=createStore(gameEnv);
assert.equal(game.enabled('pipCharacter'),true,'A new game reads saved browser flags');
const pinned=createStore(environment('?stage=moon&ff.pipCharacter=0'));
assert.equal(pinned.enabled('pipCharacter'),false,'Explicit URL off wins over saved on');
assert.equal(pinned.snapshot()[0].source,'url');
flags.setOverride('pipCharacter',false);gameEnv.handlers.storage({key:STORAGE_KEY});
assert.equal(game.enabled('pipCharacter'),false,'Other open game tabs receive changes');
flags.setOverride('pipCharacter',true);gameEnv.handlers.storage({key:STORAGE_KEY});assert.equal(game.enabled('pipCharacter'),true);
const testLink=new URL(flags.gameLink('https://example.test/?old=1#old','maze'));
assert.equal(testLink.searchParams.get('stage'),'maze');assert.equal(testLink.searchParams.get('ff.pipCharacter'),'1');assert.equal(testLink.hash,'');assert(!testLink.searchParams.has('old'));
flags.reset();gameEnv.handlers.storage({key:STORAGE_KEY});assert.equal(game.enabled('pipCharacter'),false);assert.equal(data.get('unrelated'),'keep me');assert.equal(data.has(STORAGE_KEY),false);
assert.throws(()=>flags.setOverride('evil',true),TypeError);assert.throws(()=>flags.setOverride('pipCharacter','true'),TypeError);
data.set(STORAGE_KEY,'{corrupt');assert.equal(createStore(environment()).enabled('pipCharacter'),false);
data.set(STORAGE_KEY,JSON.stringify({version:1,overrides:{pipCharacter:'false',unregistered:true}}));assert.equal(createStore(environment()).enabled('pipCharacter'),false);
data.set(STORAGE_KEY,JSON.stringify({version:1,overrides:{pipCharacter:true}}));
assert.equal(createStore(environment('?ff.pipCharacter=potato')).enabled('pipCharacter'),true,'Invalid query values are ignored');
assert.equal(createStore(environment('?ff.pipCharacter=false')).enabled('pipCharacter'),false);
const denied=createStore({get localStorage(){throw new Error('Denied');}});
assert.equal(denied.isPersistent(),false);assert.equal(denied.setOverride('pipCharacter',true),false);assert.equal(denied.enabled('pipCharacter'),true);assert(denied.gameLink('https://example.test/').includes('ff.pipCharacter=1'));
unsubscribe();game.dispose();assert(!gameEnv.handlers.storage);
for(const stage of ['earth','moon','rainbow','maze']) {
  let redirected;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../dist/features/stage-entry.js'),'utf8'),{URL,document:{currentScript:{dataset:{stage}}},location:{href:'https://example.test/'+stage+'/?ff.pipCharacter=1',search:'?ff.pipCharacter=1',replace:url=>redirected=url}});
  assert.equal(new URL(redirected).searchParams.get('ff.pipCharacter'),'1');assert.equal(new URL(redirected).searchParams.get('stage'),stage);
}
console.log('PASS: flag defaults, saved settings, URL priority, cross-tab updates, reset, invalid/blocked storage, test links and all direct stage redirects.');

const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../character-studio'),M=require(path.join(root,'model.js')),catalog=require(path.join(root,'assets/manifest.json'));
assert.equal(catalog.characters.length,4);assert.equal(catalog.accessories.filter(a=>a.category==='upper').length,6);assert.equal(catalog.accessories.filter(a=>a.category==='lower').length,6);
const all=[...catalog.characters,...catalog.accessories];assert.equal(new Set(all.map(a=>a.id)).size,16);
for(const a of all){const data=fs.readFileSync(path.join(root,a.src));assert.equal(data.toString('hex',0,8),'89504e470d0a1a0a',a.id+' must be PNG');assert.equal(data[25],6,a.id+' must have an alpha channel');}
const look={character:'moss',background:'transparent',layers:[{id:'glasses',x:-43,y:25,scale:122,rotation:-15},M.newLayer('crown'),M.newLayer('scarf')]};const normal=M.normalize(look,catalog);
assert.deepEqual(M.fromHash(M.toHash(normal),catalog),normal,'share link must restore all transforms, layer order, and background');
const dirty=M.normalize({character:'unknown',background:'constructor',layers:[{id:'glasses',x:Infinity,y:-999,scale:999,rotation:NaN},{id:'glasses'},{id:'evil'}]},catalog);
assert.equal(dirty.character,'pip');assert.equal(dirty.background,'cream');assert.equal(dirty.layers.length,1);assert.equal(dirty.layers[0].x,0);assert.equal(dirty.layers[0].y,-350);assert.equal(dirty.layers[0].scale,180);assert.equal(dirty.layers[0].rotation,0);assert.equal(M.fromHash('#look=%broken',catalog),null);
const p=M.placement(catalog.characters[0],catalog.accessories[0],{...M.newLayer('glasses'),rotation:90},{w:500,h:200});
const local=M.hitPoint({x:p.x,y:p.y+100},p);assert(Math.abs(local.x-(p.width/2+100))<.001);assert(Math.abs(local.y-p.height*p.pivot)<.001);
for(const c of catalog.characters)for(const a of catalog.accessories){const fit=M.placement(c,a,M.newLayer(a.id),{w:100,h:100});assert(fit.width>0&&Number.isFinite(fit.x)&&Number.isFinite(fit.y));}
console.log('Character Studio: 16 RGBA assets; validated look contract, URL round-trip, invalid inputs, and rotated hit testing.');
// Per-character fit must affect placement, including the sprite's height and pivot.
const testCharacter={faceWidth:400,head:[500,300],fits:{hat:{width:1.2,heightScale:.5,dy:40,pivot:.8}}};
const fitted=M.placement(testCharacter,{id:'hat',anchor:'head',width:1,pivot:.5},M.newLayer('hat'),{w:200,h:200});
assert.equal(fitted.width,480);assert.equal(fitted.height,240);assert.equal(fitted.y,340);assert.equal(fitted.pivot,.8);

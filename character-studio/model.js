/* Shared, DOM-free look contract. Coordinates use a 1024px artboard. */
(function(root){
'use strict';
const backgrounds={cream:'#f2eee4',mint:'#deeee4',lilac:'#eae4f4',transparent:null};
const clamp=(n,min,max,fallback)=>Number.isFinite(Number(n))?Math.max(min,Math.min(max,Number(n))):fallback;
const newLayer=id=>({id,x:0,y:0,scale:100,rotation:0});
function normalize(raw,catalog){
 raw=raw&&typeof raw==='object'?raw:{};
 const valid=new Set(catalog.accessories.map(a=>a.id)),seen=new Set();
 return {version:1,character:catalog.characters.some(c=>c.id===raw.character)?raw.character:catalog.characters[0].id,background:Object.hasOwn(backgrounds,raw.background)?raw.background:'cream',layers:(Array.isArray(raw.layers)?raw.layers:[]).slice(0,12).filter(l=>l&&valid.has(l.id)&&!seen.has(l.id)&&seen.add(l.id)).map(l=>({id:l.id,x:clamp(l.x,-350,350,0),y:clamp(l.y,-350,350,0),scale:clamp(l.scale,40,180,100),rotation:clamp(l.rotation,-90,90,0)}))};
}
function defaults(catalog){return normalize({character:'pip',layers:[newLayer('crown'),newLayer('bowtie')]},catalog);}
function placement(character,accessory,layer,bounds){
 const fit=character.fits?.[accessory.id]||{};
 const width=character.faceWidth*(fit.width??accessory.width)*layer.scale/100;
 const height=width*bounds.h/bounds.w*(fit.heightScale??1),anchor=character[accessory.anchor];
 return {x:anchor[0]+(fit.dx||0)+layer.x,y:anchor[1]+(fit.dy||0)+layer.y,width,height,rotation:layer.rotation*Math.PI/180,pivot:fit.pivot??accessory.pivot};
}
function hitPoint(p,placement){const dx=p.x-placement.x,dy=p.y-placement.y,c=Math.cos(placement.rotation),s=Math.sin(placement.rotation);return {x:dx*c+dy*s+placement.width/2,y:-dx*s+dy*c+placement.height*placement.pivot};}
function fromHash(hash,catalog){try{if(!hash.startsWith('#look='))return null;return normalize(JSON.parse(decodeURIComponent(hash.slice(6))),catalog);}catch{return null;}}
const toHash=state=>'#look='+encodeURIComponent(JSON.stringify(state));
const api={backgrounds,newLayer,normalize,defaults,placement,hitPoint,fromHash,toHash,clamp};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.StudioModel=api;
})(typeof window==='undefined'?globalThis:window);

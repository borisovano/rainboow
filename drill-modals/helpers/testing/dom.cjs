// Minimal DOM fixture for Node logic tests. Browser QA covers real layout/focus behavior.
function createDocument({autocreate=false}={}) {
  const ids=new Map(),listeners=new Map();let doc;
  class Element {
    constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.parentNode=null;this.className='';this.hidden=false;this.inert=false;this.disabled=false;this.textContent='';this.attributes={};this.width=330;this.height=330;
      this.style={setProperty(k,v){this[k]=v;},removeProperty(k){delete this[k];}};
      this.classList={contains:k=>this.className.split(' ').includes(k),add:(...keys)=>{this.className=[...new Set([...this.className.split(' ').filter(Boolean),...keys])].join(' ');},remove:(...keys)=>{this.className=this.className.split(' ').filter(k=>!keys.includes(k)).join(' ');},toggle:(k,value)=>{const on=value??!this.classList.contains(k);this.classList[on?'add':'remove'](k);return on;}};
    }
    set id(value){if(this._id)ids.delete(this._id);this._id=value;ids.set(value,this);}get id(){return this._id||'';}
    set tabIndex(value){this.attributes.tabindex=value;}get tabIndex(){return this.attributes.tabindex??(['BUTTON','INPUT','SELECT','TEXTAREA'].includes(this.tagName)?0:-1);}
    get isConnected(){return this===doc.body||!!this.parentNode?.isConnected;}
    set innerHTML(value){this.replaceChildren();this.textContent=value;}get innerHTML(){return this.textContent;}
    appendChild(child){child.remove();this.children.push(child);child.parentNode=this;return child;}
    append(...children){for(const child of children)this.appendChild(child);}
    prepend(child){child.remove();this.children.unshift(child);child.parentNode=this;}
    replaceChildren(...children){for(const c of [...this.children])c.remove();for(const c of children)this.appendChild(c);}
    remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(c=>c!==this);this.parentNode=null;}
    setAttribute(key,value){this.attributes[key]=String(value);if(key==='id')this.id=value;}
    getAttribute(key){return this.attributes[key]??null;}
    addEventListener(key,fn){(this.listeners??={})[key]=fn;}
    removeEventListener(key){delete this.listeners?.[key];}
    focus(){doc.activeElement=this;}
    click(){if(!this.disabled)this.onclick?.({target:this});}
    matches(selector){return selector.split(',').some(s=>{s=s.trim();if(s[0]==='#')return this.id===s.slice(1);if(s[0]==='.')return this.classList.contains(s.slice(1));if(s==='[hidden]')return this.hidden;if(s==='[inert]')return this.inert;if(s==='[tabindex]')return this.attributes.tabindex!==undefined;if(s==='a[href]')return this.tagName==='A'&&!!this.attributes.href;return this.tagName===s.toUpperCase();});}
    querySelectorAll(selector){return this.children.flatMap(c=>[...(c.matches(selector)?[c]:[]),...c.querySelectorAll(selector)]);}
    querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
    closest(selector){return this.matches(selector)?this:this.parentNode?.closest(selector)||null;}
    getContext(){return {fillRect(){},clearRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},arc(){},fill(){}};}
  }
  doc={hidden:false,createElement:tag=>new Element(tag),getElementById(id){if(ids.has(id))return ids.get(id);if(!autocreate)return null;const n=new Element('div');n.id=id;this.body.appendChild(n);return n;},querySelectorAll(selector){return this.body.querySelectorAll(selector);},querySelector(selector){const found=this.body.querySelector(selector);if(found||!autocreate)return found;return this.getElementById(selector);},addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(fn);},removeEventListener(type,fn){listeners.get(type)?.delete(fn);},emit(type,event){for(const fn of [...listeners.get(type)||[]])fn(event);}};
  doc.body=new Element('body');doc.activeElement=doc.body;return doc;
}
module.exports={createDocument};

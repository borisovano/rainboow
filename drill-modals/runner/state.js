(function(root){
 function fromURL(url){const q=new URL(url).searchParams;return {id:q.get('drill'),text:q.get('params'),run:q.get('run')==='1'};}
 function parse(text,manifest){let input;try{input=JSON.parse(text);}catch{throw Error('Parameters must be valid JSON.');}return root.DrillContract.parameters(manifest,input);}
 function link(url,id,params){const result=new URL(url);result.search='';result.searchParams.set('drill',id);result.searchParams.set('params',JSON.stringify(params));result.searchParams.set('run','1');return result.href;}
 root.DrillRunner={fromURL,parse,link};if(typeof module!=='undefined')module.exports=root.DrillRunner;
})(globalThis);

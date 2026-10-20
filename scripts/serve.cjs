const http=require('node:http');
const fs=require('node:fs/promises');
const path=require('node:path');
const gameRoot=path.resolve(__dirname,'../dist'),drillRoot=path.resolve(__dirname,'../drill-modals');
const studioRoot=path.resolve(__dirname,'../character-studio');
const drills=require('./drill-registry.cjs')();
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.json':'application/json','.glb':'model/gltf-binary'};
const server=http.createServer(async(req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  try {
    const url=new URL(req.url,'http://localhost');
    const pathname=decodeURIComponent(url.pathname);
    if(pathname==='/drills'||pathname==='/dialogs/'||pathname==='/dialogs'){res.writeHead(302,{Location:pathname==='/drills'?'/drills/':'/drills/?drill=math'});res.end();return;}
    if(pathname==='/character-studio'){res.writeHead(302,{Location:'/character-studio/'+url.search});res.end();return;}
    const isStudio=pathname.startsWith('/character-studio/');
    const isDrill=pathname.startsWith('/drills/'),root=isStudio?studioRoot:isDrill?drillRoot:gameRoot;
    let relative=isStudio?pathname.slice('/character-studio'.length):isDrill?pathname.slice('/drills'.length):pathname;
    if(isDrill)for(const drill of drills)for(const alias of drill.aliases)if(relative===`/${alias}`||relative.startsWith(`/${alias}/`))relative='/'+drill.id+relative.slice(alias.length+1);
    if(isDrill&&(relative.split('/').some(p=>['tests','testing'].includes(p))||/\.(cjs|md)$/.test(relative))){res.writeHead(404);res.end();return;}
    let file=path.resolve(root,'.'+relative);
    if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403);res.end();return;}
    if((await fs.stat(file)).isDirectory()){if(!url.pathname.endsWith('/')){res.writeHead(302,{Location:url.pathname+'/'+url.search});res.end();return;}file=path.join(file,'index.html');}
    // Resolve symlinks too, so the local server only serves dist/.
    file=await fs.realpath(file);
    if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
    const data=await fs.readFile(file);
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
    res.end(req.method==='HEAD'?undefined:data);
  } catch {res.writeHead(404);res.end('Not found');}
});
server.on('error',error=>{console.error(error.message);process.exitCode=1;});
server.listen(Number(process.env.PORT??8765),'127.0.0.1',()=>{
  const url=`http://127.0.0.1:${server.address().port}`;
  console.log(`Game: ${url}/\nDrill workshop: ${url}/drills/\nMaze shortcut: ${url}/?stage=maze`);
});

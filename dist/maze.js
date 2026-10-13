// A seeded, connected maze. The same graph drives walls, navigation and the temporary map.
class MazeLayout {
    constructor(size = 11, seed = Date.now()) {
        this.size = size;
        this.cells = Array.from({length:size*size}, (_,id) => ({id, x:id%size, z:Math.floor(id/size), walls:[true,true,true,true]}));
        let state=seed>>>0;
        const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
        const visited=new Set([0]), stack=[0];
        while(stack.length) {
            const id=stack[stack.length-1];
            const choices=this.adjacent(id).filter(n=>!visited.has(n.id));
            if(!choices.length){stack.pop();continue;}
            const next=choices[Math.floor(random()*choices.length)];
            this.open(id,next.dir);visited.add(next.id);stack.push(next.id);
        }
        const distances=this.distances(0);
        this.exit=distances.indexOf(Math.max(...distances));
    }
    adjacent(id) {
        const c=this.cells[id];if(!c)return [];
        return [[0,-1],[1,0],[0,1],[-1,0]].flatMap(([dx,dz],dir)=>{
            const x=c.x+dx,z=c.z+dz;return x>=0&&z>=0&&x<this.size&&z<this.size?[{id:z*this.size+x,dir}]:[];
        });
    }
    neighbors(id){return this.adjacent(id).filter(n=>!this.cells[id].walls[n.dir]);}
    open(id,dir){const next=this.adjacent(id).find(n=>n.dir===dir);if(!next)return false;this.cells[id].walls[dir]=false;this.cells[next.id].walls[(dir+2)%4]=false;return true;}
    distances(from){const d=Array(this.cells.length).fill(-1),q=[from];d[from]=0;for(let i=0;i<q.length;i++)for(const n of this.neighbors(q[i]))if(d[n.id]<0){d[n.id]=d[q[i]]+1;q.push(n.id);}return d;}
    route(from,to){if(!this.cells[from]||!this.cells[to])return [];const q=[from],prev=new Map([[from,null]]);for(let i=0;i<q.length;i++){if(q[i]===to)break;for(const n of this.neighbors(q[i]))if(!prev.has(n.id)){prev.set(n.id,q[i]);q.push(n.id);}}if(!prev.has(to))return [];const path=[];for(let id=to;id!==null;id=prev.get(id))path.unshift(id);return path;}
}

const mazePowerInfo = [
    ['hammer','שובר קיר','B','שובר קיר פנימי אחד בלבד. התקרבו לקיר, הביטו אליו ולחצו B. קירות הגבול נשארים סגורים.'],
    ['map','מפת זיכרון','M','לחצו M: המפה והחיצים ליציאה יופיעו ל־30 שניות בלבד, פעם אחת. זכרו את הפניות וספרו את המעברים!'],
    ['retry','שתי הזדמנויות','','בכל מפגש עם שומר פתרו שתי שאלות. מותר לטעות פעמיים בסך הכול; הטעות השלישית פוסלת. לכל שאלה 30 שניות.'],
    ['chalk','סימוני גיר','','סימונים כחולים נשארים ב־12 המשבצות האחרונות שבהן עברתם. הם מסמנים את העקבות שלכם, בלי לגלות את היציאה.'],
    ['echo','הד חברים','E','מצביע לכיוון החבר הקרוב שטרם חולץ למשך 8 שניות. אפשר להפעיל שוב לאחר 20 שניות.'],
    ['freeze','שעון אבן','F','מקפיא את שומרי המבוך ל־5 שניות. אפשר להפעיל שוב לאחר 25 שניות.'],
    ['anchor','חוט חזרה','T','חוזרים מיד לכניסה למבוך. שימוש אחד בלבד; החברים והניקוד נשמרים.'],
    ['lantern','פנס סודות','L','מגלה תיבות חשבון נסתרות למשך 20 שניות. כל תיבה מעניקה 25 נקודות. אפשר להדליק שוב לאחר 30 שניות.']
];
const mazePowers=Object.fromEntries(mazePowerInfo.map(([key])=>[key,false]));
let mazeWorld=null, mazePortal=null, mazeQuestionsSolved=0, mazeEncounterMistakes=0;
const MAZE_CELL=18, MAZE_X=2200, MAZE_Z=-1200, MAZE_Y=120;
function mazePoint(id){const c=mazeWorld.layout.cells[id];return {x:MAZE_X+c.x*MAZE_CELL,z:MAZE_Z+c.z*MAZE_CELL};}
function mazeCellAt(x,z){const n=mazeWorld.layout.size,c=Math.floor((x-MAZE_X)/MAZE_CELL+.5),r=Math.floor((z-MAZE_Z)/MAZE_CELL+.5);return c>=0&&r>=0&&c<n&&r<n?r*n+c:-1;}
function mazeMessage(text){document.getElementById('maze-message').textContent=text;}
function mazeBox(w,h,d,color,x,y,z,parent=mazeWorld.group){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({color}));mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
function createMazePortal(){
    if(mazePortal)return;
    const p=rainbowPoint(.04,280),g=new THREE.Group();g.position.set(p.x,rainbowWorld.height,p.z);
    mazeBox(2,12,2,0x79bdb1,-5,6,0,g);mazeBox(2,12,2,0x79bdb1,5,6,0,g);mazeBox(12,2,2,0xd9cda2,0,12,0,g);
    const door=new THREE.Mesh(new THREE.PlaneGeometry(8,10),new THREE.MeshBasicMaterial({color:0x85efd0,transparent:true,opacity:.65,side:THREE.DoubleSide}));door.position.y=5;g.add(door);scene.add(g);
    mazePortal={mesh:g,door,x:p.x,z:p.z};
}
function updateMazePortal(time){
    if(!mazePortal||currentRealm!=='rainbow')return;
    mazePortal.door.visible=rainbowWorld.complete;
    if(rainbowWorld.complete){
        mazePortal.door.material.opacity=.45+Math.sin(time*2)*.15;
        if(Math.hypot(playerGroup.position.x-mazePortal.x,playerGroup.position.z-mazePortal.z)<6 && Math.abs(playerGroup.position.y-rainbowWorld.height)<5)enterMaze();
    }
}
function createMazeWorld(){
    if(mazeWorld)return;
    const layout=new MazeLayout(11),group=new THREE.Group();scene.add(group);
    mazeWorld={layout,group,walls:[],friends:[],guards:[],chests:[],trail:[],used:{},timers:{map:0,echo:0,freeze:0,lantern:0},cooldowns:{echo:0,freeze:0,lantern:0},rescued:0,completed:false,lastCell:-1,ai:0};
    const n=layout.size;
    mazeBox(n*MAZE_CELL+5,5,n*MAZE_CELL+5,0x657f78,MAZE_X+(n-1)*9,MAZE_Y-3,MAZE_Z+(n-1)*9);
    for(const cell of layout.cells){
        const p=mazePoint(cell.id);
        mazeBox(17.5,.3,17.5,(cell.x+cell.z)%2?0xe5debd:0xd6d9b5,p.x,MAZE_Y-.15,p.z);
        for(let dir=0;dir<4;dir++){
            if(!cell.walls[dir]||(dir===0&&cell.z>0)||(dir===3&&cell.x>0))continue;
            const boundary=!layout.adjacent(cell.id).some(v=>v.dir===dir),horizontal=dir%2===0;
            const wx=p.x+(dir===1?9:dir===3?-9:0),wz=p.z+(dir===2?9:dir===0?-9:0);
            const g=new THREE.Group();group.add(g);
            const color=boundary?0x577668:[0x80a88e,0x829cbb,0xa08eb5][Math.floor(cell.z/4)%3];
            mazeBox(horizontal?20:2,7.5,horizontal?2:20,color,wx,MAZE_Y+3.75,wz,g);
            mazeBox(horizontal?20.5:2.5,.7,horizontal?2.5:20.5,0xc8d6ac,wx,MAZE_Y+7.7,wz,g);
            mazeWorld.walls.push({id:cell.id,dir,boundary,broken:false,x:wx,z:wz,w:horizontal?20:2,d:horizontal?2:20,mesh:g});
        }
    }
    const route=layout.route(0,layout.exit);
    for(let i=0;i<8;i++){
        const id=route[Math.max(2,Math.floor((i+1)*.105*(route.length-1)))],p=mazePoint(id);
        const gate=createObstacle(p.x,p.z,'maze_friend',`חבר המבוך ${i+1} — פותרים ומשחררים`,{score:15},MAZE_Y);
        gate.userData.realm='maze';gate.userData.kind=['missing','sequence','division'][i%3];
        // Stone pedestals and a little arch make each rescue station recognizable.
        const npc=createBlueNPC(true);npc.position.set(p.x,MAZE_Y,p.z);group.add(npc);
        mazeBox(1,5,1,0xb699cc,p.x-3.2,MAZE_Y+2.5,p.z);mazeBox(1,5,1,0xb699cc,p.x+3.2,MAZE_Y+2.5,p.z);
        mazeBox(7,1,1,0xe9d39b,p.x,MAZE_Y+5,p.z);
        mazeWorld.friends.push({id,gate,mesh:npc,free:false});
    }
    const occupied=new Set([0,layout.exit,...mazeWorld.friends.map(f=>f.id)]);
    const branches=layout.cells.filter(c=>!occupied.has(c.id)&&layout.neighbors(c.id).length===1);
    for(const c of branches.slice(-4)){
        const p=mazePoint(c.id),chest=createObstacle(p.x,p.z,'maze_chest','תיבת הסודות — השלימו את הסדרה',{score:25},MAZE_Y);
        Object.assign(chest.userData,{realm:'maze',kind:'sequence'});
        mazeBox(3,2,2.4,0xe8ba63,0,1,0,chest);chest.visible=false;mazeWorld.chests.push(chest);
    }
    for(let i=0;i<5;i++){
        const id=route[Math.floor((.32+i*.13)*(route.length-1))],p=mazePoint(id),g=new THREE.Group();
        const body=new THREE.Mesh(new THREE.DodecahedronGeometry(1.7),new THREE.MeshLambertMaterial({color:0x825b87}));body.position.y=1.7;g.add(body);
        for(const x of [-.6,.6])mazeBox(.55,.55,.4,0xffdd73,x,2,-1.5,g);
        g.position.set(p.x,MAZE_Y,p.z);group.add(g);
        const guard={mesh:g,active:true,isMaze:true,realm:'maze',target:id,route:[],home:id};mazeWorld.guards.push(guard);predators.push(guard);
    }
    const end=mazePoint(layout.exit),exit=createObstacle(end.x,end.z,'maze_exit','שער היציאה — חידת המבוך האחרונה',{score:100},MAZE_Y);
    Object.assign(exit.userData,{realm:'maze',kind:'missing'});mazeWorld.exit=exit;
    mazeBox(2,11,2,0xc6a464,end.x-5,MAZE_Y+5.5,end.z);mazeBox(2,11,2,0xc6a464,end.x+5,MAZE_Y+5.5,end.z);mazeBox(12,2,2,0xf2de9c,end.x,MAZE_Y+11,end.z);
    for(let i=0;i<12;i++){const mark=new THREE.Mesh(new THREE.RingGeometry(.45,.8,12),new THREE.MeshBasicMaterial({color:0x317ee5,side:THREE.DoubleSide}));mark.rotation.x=-Math.PI/2;mark.visible=false;group.add(mark);mazeWorld.trail.push(mark);}
}
function enterMaze(){
    if(gameState!=='PLAYING')return;
    createMazeWorld();resetRealmPowers('maze');
    for(const key of Object.keys(mazePowers))mazePowers[key]=false;
    const p=mazePoint(0);playerGroup.position.set(p.x,MAZE_Y,p.z);playerVelocityY=0;isJumping=false;
    Object.keys(keys).forEach(k=>keys[k]=false);questArrow.visible=false;
    scene.background=new THREE.Color(0xb8cbc8);scene.fog.color=scene.background;scene.fog.near=75;scene.fog.far=180;
    camera.position.set(p.x,MAZE_Y+55,p.z+36);camera.lookAt(p.x,MAZE_Y,p.z);
    document.getElementById('space-warning').classList.add('hidden');
    document.getElementById('maze-hud').classList.add('active');
    mazeMessage('הצילו 8 חברים, זכרו את הפניות ומצאו את שער היציאה.');refreshMazePowers();
    showPowerupModal('ברוכים הבאים לשלב המבוך!','הכוחות הקודמים התאפסו. הצילו שמונה חברים כדי לזכות בכוחות חדשים, התחמקו משומרי האבן ופתרו את חידת היציאה. חצים לתנועה, רווח לקפיצה.');
}
function mazeCanStand(x,z,radius=1.2){
    if(mazeCellAt(x,z)<0)return false;
    return !mazeWorld.walls.some(w=>!w.broken && Math.abs(x-w.x)<w.w/2+radius && Math.abs(z-w.z)<w.d/2+radius);
}
function mazeMove(mesh,dx,dz,radius=1.2){
    const parts=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.7));
    for(let i=0;i<parts;i++){
        if(mazeCanStand(mesh.position.x+dx/parts,mesh.position.z,radius))mesh.position.x+=dx/parts;
        if(mazeCanStand(mesh.position.x,mesh.position.z+dz/parts,radius))mesh.position.z+=dz/parts;
    }
}
function refreshMazePowers(){
    if(!mazeWorld)return;
    document.getElementById('maze-progress').textContent=`שלב המבוך · חברים ${mazeWorld.rescued}/8`;
    document.getElementById('maze-passive').textContent=[mazePowers.retry?'שתי שאלות · מותר לטעות פעמיים':'',mazePowers.chalk?'סימוני גיר פעילים':''].filter(Boolean).join(' · ');
    for(const [key,name,hotkey] of mazePowerInfo){if(!hotkey)continue;const b=document.getElementById('maze-'+key);b.style.display=mazePowers[key]?'':'none';const cd=mazeWorld.cooldowns[key]||0;b.disabled=gameState!=='PLAYING'||!!mazeWorld.used[key]||cd>0;b.textContent=name+' '+hotkey+(mazeWorld.used[key]?' · נוצל':cd>0?' · '+Math.ceil(cd):'');}
}
function useMazePower(key){
    if(currentRealm!=='maze'||gameState!=='PLAYING'||!mazePowers[key]||mazeWorld.used[key]||(mazeWorld.cooldowns[key]||0)>0)return;
    if(key==='hammer'){
        const dx=-Math.sin(playerGroup.rotation.y),dz=-Math.cos(playerGroup.rotation.y);
        const candidates=mazeWorld.walls.filter(w=>!w.broken&&!w.boundary&&Math.hypot(w.x-playerGroup.position.x,w.z-playerGroup.position.z)<12&&(w.x-playerGroup.position.x)*dx+(w.z-playerGroup.position.z)*dz>2).sort((a,b)=>Math.hypot(a.x-playerGroup.position.x,a.z-playerGroup.position.z)-Math.hypot(b.x-playerGroup.position.x,b.z-playerGroup.position.z));
        const wall=candidates[0];if(!wall){mazeMessage('התקרבו לקיר פנימי והביטו אליו. הכוח עדיין לא נוצל.');return;}
        wall.broken=true;wall.mesh.visible=false;mazeWorld.layout.open(wall.id,wall.dir);mazeWorld.used.hammer=true;mazeMessage('קיר אחד נשבר! נפתח מעבר חדש.');playPopSound();
    }
    if(key==='map'){mazeWorld.used.map=true;mazeWorld.timers.map=30;document.getElementById('maze-map-panel').classList.add('active');mazeMessage('המפה זמנית: זכרו כמה מעברים יש לפני כל פנייה.');drawMazeMap();}
    if(key==='echo'){mazeWorld.timers.echo=8;mazeWorld.cooldowns.echo=20;mazeMessage('ההד מצביע לעבר חבר קרוב, גם מעבר לקירות.');}
    if(key==='freeze'){mazeWorld.timers.freeze=5;mazeWorld.cooldowns.freeze=25;mazeMessage('שומרי האבן קפואים לחמש שניות!');}
    if(key==='anchor'){const p=mazePoint(0);playerGroup.position.set(p.x,MAZE_Y,p.z);playerVelocityY=0;isJumping=false;mazeWorld.used.anchor=true;mazeMessage('חזרתם לכניסה. כל החברים והנקודות נשמרו.');}
    if(key==='lantern'){mazeWorld.timers.lantern=20;mazeWorld.cooldowns.lantern=30;mazeMessage('תיבות הסודות התגלו! חפשו אותן במעברים ללא מוצא.');}
    refreshMazePowers();
}
function drawMazeMap(){
    const canvas=document.getElementById('maze-map-canvas'),ctx=canvas.getContext('2d'),n=mazeWorld.layout.size,S=canvas.width/n;
    ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#f7f3df';ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.strokeStyle='#476b68';ctx.lineWidth=2;
    for(const c of mazeWorld.layout.cells){const x=c.x*S,z=c.z*S;for(let d=0;d<4;d++)if(c.walls[d]){const points=[[x,z,x+S,z],[x+S,z,x+S,z+S],[x,z+S,x+S,z+S],[x,z,x,z+S]][d];ctx.beginPath();ctx.moveTo(points[0],points[1]);ctx.lineTo(points[2],points[3]);ctx.stroke();}}
    const id=mazeCellAt(playerGroup.position.x,playerGroup.position.z),route=mazeWorld.layout.route(id,mazeWorld.layout.exit);
    ctx.strokeStyle='#167e7b';ctx.lineWidth=2;
    for(let i=0;i<route.length-1;i++){const a=mazeWorld.layout.cells[route[i]],b=mazeWorld.layout.cells[route[i+1]],x=(a.x+.5)*S,z=(a.z+.5)*S,tx=(b.x+.5)*S,tz=(b.z+.5)*S,angle=Math.atan2(tz-z,tx-x);ctx.beginPath();ctx.moveTo(x,z);ctx.lineTo(tx,tz);ctx.moveTo(tx-6*Math.cos(angle-.5),tz-6*Math.sin(angle-.5));ctx.lineTo(tx,tz);ctx.lineTo(tx-6*Math.cos(angle+.5),tz-6*Math.sin(angle+.5));ctx.stroke();}
    for(const f of mazeWorld.friends.filter(f=>!f.free)){const c=mazeWorld.layout.cells[f.id];ctx.fillStyle='#bf759f';ctx.beginPath();ctx.arc((c.x+.5)*S,(c.z+.5)*S,3,0,Math.PI*2);ctx.fill();}
    const c=mazeWorld.layout.cells[mazeWorld.layout.exit];ctx.fillStyle='#967020';ctx.fillRect((c.x+.5)*S-5,(c.z+.5)*S-5,10,10);
    if(id>=0){const p=mazeWorld.layout.cells[id];ctx.fillStyle='#753fbd';ctx.beginPath();ctx.arc((p.x+.5)*S,(p.z+.5)*S,5,0,Math.PI*2);ctx.fill();}
    document.getElementById('maze-map-time').textContent='המפה נעלמת בעוד '+Math.ceil(mazeWorld.timers.map)+' שניות';
}
function updateMazeRealtime(delta){
    if(currentRealm!=='maze'||!mazeWorld||document.hidden)return;
    if(mazeWorld.timers.map>0){mazeWorld.timers.map=Math.max(0,mazeWorld.timers.map-delta);if(mazeWorld.timers.map===0){document.getElementById('maze-map-panel').classList.remove('active');const c=document.getElementById('maze-map-canvas');c.getContext('2d').clearRect(0,0,c.width,c.height);mazeMessage('המפה נעלמה. עכשיו זוכרים את הפניות וסופרים מעברים!');}else drawMazeMap();}
}
function handleMazeSuccess(obstacle){
    if(obstacle.userData.type==='maze_friend'){
        const f=mazeWorld.friends.find(f=>f.gate===obstacle);if(!f||f.free)return;
        f.free=true;f.mesh.visible=false;
        const [key,name,,description]=mazePowerInfo[mazeWorld.rescued++];mazePowers[key]=true;
        mazeMessage('חבר חולץ! '+mazeWorld.rescued+' מתוך 8.');refreshMazePowers();showPowerupModal('כוח חדש: '+name,description);
    }else if(obstacle.userData.type==='maze_chest'){mazeMessage('תיבת הסודות נפתחה! 25 נקודות נוספות.');}
    else if(obstacle.userData.type==='maze_exit'){
        mazeWorld.completed=true;gameState='MAZE_COMPLETE';document.getElementById('maze-win-score').textContent='הצלתם את כל שמונת החברים! הניקוד שלכם: '+score;document.getElementById('maze-win').classList.add('active');
    }
}
function mazeContinueExploring(){document.getElementById('maze-win').classList.remove('active');gameState='PLAYING';mazeMessage('המבוך הושלם! אפשר להמשיך לחפש תיבות סודות.');}
function stepMaze(delta,time){
    for(const k of ['echo','freeze','lantern']){mazeWorld.timers[k]=Math.max(0,mazeWorld.timers[k]-delta);mazeWorld.cooldowns[k]=Math.max(0,mazeWorld.cooldowns[k]-delta);}
    let dx=(keys.right?1:0)-(keys.left?1:0),dz=(keys.down?1:0)-(keys.up?1:0);const length=Math.hypot(dx,dz)||1;
    dx=dx/length*24*delta*movementSpeedMultiplier;dz=dz/length*24*delta*movementSpeedMultiplier;
    mazeMove(playerGroup,dx,dz);if(dx||dz)playerGroup.rotation.y=Math.atan2(-dx,-dz);
    if(isJumping){playerGroup.position.y+=playerVelocityY;playerVelocityY-=.04;if(playerGroup.position.y<=MAZE_Y){playerGroup.position.y=MAZE_Y;playerVelocityY=0;isJumping=false;}}
    else playerGroup.position.y=MAZE_Y;
    const cell=mazeCellAt(playerGroup.position.x,playerGroup.position.z);
    if(cell!==mazeWorld.lastCell){
        mazeWorld.lastCell=cell;
        if(mazePowers.chalk){const mark=mazeWorld.trail.shift(),p=mazePoint(cell);mark.position.set(p.x,MAZE_Y+.06,p.z);mark.visible=true;mazeWorld.trail.push(mark);}
    }
    for(const chest of mazeWorld.chests)chest.visible=mazeWorld.timers.lantern>0&&!chest.userData.cleared;
    const obstacles=[...mazeWorld.friends.filter(f=>!f.free).map(f=>f.gate),...mazeWorld.chests.filter(c=>c.visible),mazeWorld.exit];
    for(const o of obstacles)if(!o.userData.cleared&&Math.hypot(playerGroup.position.x-o.position.x,playerGroup.position.z-o.position.z)<3.6&&Math.abs(playerGroup.position.y-MAZE_Y)<4){
        if(o===mazeWorld.exit&&mazeWorld.rescued<8){mazeMessage('שער היציאה מחכה: צריך להציל עוד '+(8-mazeWorld.rescued)+' חברים.');continue;}
        triggerChallenge(o);return;
    }
    mazeWorld.ai-=delta;
    if(mazeWorld.ai<=0){mazeWorld.ai=.6;for(const g of mazeWorld.guards){const id=mazeCellAt(g.mesh.position.x,g.mesh.position.z);g.route=mazeWorld.layout.route(id,cell);}}
    for(const g of mazeWorld.guards){
        if(!g.active||mazeWorld.timers.freeze>0)continue;
        if(g.route.length>1&&g.route.length<=7){const current=mazeCellAt(g.mesh.position.x,g.mesh.position.z),center=mazePoint(current);let target=center;
            if(Math.hypot(g.mesh.position.x-center.x,g.mesh.position.z-center.z)<.4){const index=g.route.indexOf(current),next=g.route[index+1];if(next!==undefined)g.target=next;}
            if(g.target!==current)target=mazePoint(g.target);
            const gx=target.x-g.mesh.position.x,gz=target.z-g.mesh.position.z,d=Math.hypot(gx,gz)||1,step=Math.min(d,7.5*delta);mazeMove(g.mesh,gx/d*step,gz/d*step,1.7);g.mesh.rotation.y=Math.atan2(-gx,-gz);
        }
        if(playerHitsPredator(g)){triggerPredatorChallenge(g);return;}
    }
    questArrow.visible=false;
    if(mazeWorld.timers.echo>0){const friend=mazeWorld.friends.filter(f=>!f.free).sort((a,b)=>Math.hypot(a.gate.position.x-playerGroup.position.x,a.gate.position.z-playerGroup.position.z)-Math.hypot(b.gate.position.x-playerGroup.position.x,b.gate.position.z-playerGroup.position.z))[0];if(friend){questArrow.visible=true;questArrow.position.set(playerGroup.position.x,playerGroup.position.y+6,playerGroup.position.z);questArrow.rotation.y=Math.atan2(playerGroup.position.x-friend.gate.position.x,playerGroup.position.z-friend.gate.position.z);}}
    camera.position.lerp(new THREE.Vector3(playerGroup.position.x,MAZE_Y+55,playerGroup.position.z+36),.1);camera.lookAt(playerGroup.position.x,MAZE_Y,playerGroup.position.z);
    refreshMazePowers();
}
function mazeGuardHint(){
    if(currentRealm==='maze'&&mazePowers.retry)document.getElementById('challenge-hint').textContent=`שאלה ${mazeQuestionsSolved+1} מתוך 2 · נשארו ${2-mazeEncounterMistakes} טעויות מותרות`;
}
function checkMazeGuardAnswer(selected,btn){
    if(currentRealm!=='maze'||!mazePowers.retry||gameState!=='PREDATOR_CHALLENGE')return false;
    if(selected===currentChallenge.answer&&mazeQuestionsSolved===0){
        mazeQuestionsSolved=1;clearInterval(predatorInterval);gameState='PREDATOR_TRANSITION';
        btn.classList.add('correct');playSuccessSound();document.getElementById('challenge-hint').textContent='נכון! עוד שאלה אחת כדי לעבור את השומר.';
        setTimeout(()=>{preparePredatorMathChallenge(activeObstacle);beginPredatorMathChallenge();},800);return true;
    }
    if(selected!==currentChallenge.answer&&mazeEncounterMistakes<2){
        mazeEncounterMistakes++;btn.classList.add('wrong');playFailSound();mazeGuardHint();setTimeout(()=>btn.classList.remove('wrong'),500);return true;
    }
    if(selected!==currentChallenge.answer){clearInterval(predatorInterval);gameState='PREDATOR_FAILURE';playFailSound();setTimeout(()=>initiatePlayerDeath(),500);return true;}
    return false;
}
function mazeGuardTimeout(){
    if(currentRealm!=='maze'||!mazePowers.retry||mazeEncounterMistakes>=2)return false;
    mazeEncounterMistakes++;preparePredatorMathChallenge(activeObstacle);mazeGuardHint();return true;
}

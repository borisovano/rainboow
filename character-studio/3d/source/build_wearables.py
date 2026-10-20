"""Rebuild the 12 original studio accessories as fitted, editable 3D wearables.

/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --threads 4 --python build_wearables.py
Optional IDs after -- select characters; --no-render omits the six fit sheets.
Each exported scene has 12 Wearable_<id> roots with identity transforms, in
Body_Control rest coordinates. Attach a root directly to Body_Control. Meshes
are real geometry; no image planes, external textures, rig or animation.
The saved .blend includes the original character solely as a fitting reference.
"""
import bpy, math, json, sys
from pathlib import Path
from mathutils import Vector
HERE=Path(__file__).resolve().parent
OUT=HERE.parent/'assets'
QA=HERE.parents[2]/'artifacts'
QA.mkdir(exist_ok=True)
IDS=['glasses','goggles','crown','beanie','headphones','wizard','bowtie','tie','necklace','scarf','medal','bandana']
UPPER=IDS[:6]
SPECS={
 'pip':{'hat_z':3.48,'hat_x':.90,'hat_y':.87,'top':3.79,'head_x':1.42,'eye_z':2.70},
 'moss':{'hat_z':3.48,'hat_x':1.21,'hat_y':1.04,'top':3.60,'head_x':1.37,'eye_z':2.70},
 'sunny':{'hat_z':3.45,'hat_x':.75,'hat_y':.72,'top':3.74,'head_x':1.20,'eye_z':2.70},
 'luna':{'hat_z':3.51,'hat_x':.70,'hat_y':.72,'top':3.98,'head_x':1.72,'eye_z':2.48},
}
TAU=2*math.pi

def build(character,render=True):
 bpy.ops.wm.open_mainfile(filepath=str(HERE/f'{character}.blend'))
 scene=bpy.context.scene;scene.frame_set(1)
 spec=SPECS[character]
 body=bpy.data.objects['Body']
 # The character's NLA tracks remain muted, preserving the shared rest frame.
 bpy.context.view_layer.update()
 coll=bpy.data.collections.new(character.title()+' | fitted wearables')
 scene.collection.children.link(coll)
 roots={};current=None
 def adopt(obj,name):
  for c in list(obj.users_collection): c.objects.unlink(obj)
  coll.objects.link(obj);obj.name=name
  if current:obj.parent=current
  return obj
 def mat(name,c,rough=.44,metal=0):
  m=bpy.data.materials.new('Wearables_'+name);m.use_nodes=True
  p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
  return m
 coral=mat('coral',(.95,.075,.045));teal=mat('teal',(.015,.55,.51));gold=mat('gold',(.95,.57,.055),.26,.65);cream=mat('ivory',(.99,.90,.62));violet=mat('violet',(.30,.055,.67));lilac=mat('lilac',(.59,.26,.78),.72);navy=mat('navy',(.025,.075,.17));brass=mat('brass',(.53,.27,.045),.28,.7)
 rainbow=[coral,mat('orange',(1,.32,.035),.72),mat('yellow_yarn',(.98,.72,.02),.72),mat('green',(.20,.66,.12),.72),mat('blue',(.02,.44,.95),.72),violet]
 def new_root(id):
  nonlocal current
  current=bpy.data.objects.new('Wearable_'+id,None);coll.objects.link(current);roots[id]=current
  current['wearable_id']=id;current['category']='upper' if id in UPPER else 'lower';current['character_id']=character
  current['attachment']='Body_Control';current['coordinates']='Character rest coordinates; Blender -Y front; glTF +Z front.'
  return current
 def mesh(name,verts,faces,m,solid=0,bevel=0):
  d=bpy.data.meshes.new(name+'_Mesh');d.from_pydata(verts,[],faces);d.update();obj=bpy.data.objects.new(name,d);coll.objects.link(obj);obj.parent=current;d.materials.append(m)
  for p in d.polygons:p.use_smooth=True
  if solid:
   mod=obj.modifiers.new('Real fabric thickness','SOLIDIFY');mod.thickness=solid;mod.offset=0
  if bevel:
   mod=obj.modifiers.new('Soft edges','BEVEL');mod.width=bevel;mod.segments=2
  bpy.context.view_layer.objects.active=obj
  for mod in list(obj.modifiers):bpy.ops.object.modifier_apply(modifier=mod.name)
  return obj
 def uv(name,loc,scale,m,segments=24,rings=12):
  bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,location=loc);o=adopt(bpy.context.object,name);o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
  for p in o.data.polygons:p.use_smooth=True
  return o
 def tube(name,points,radius,m,closed=False,sides=8):
  # A transported frame creates consistent tubes with controlled game polycounts.
  verts=[];faces=[];n=len(points)
  for i,p in enumerate(points):
   a=Vector(points[(i-1)%n] if closed or i else points[0]);b=Vector(points[(i+1)%n] if closed or i<n-1 else points[-1]);t=(b-a).normalized();ref=Vector((0,0,1)) if abs(t.z)<.95 else Vector((0,1,0));u=t.cross(ref).normalized();v=t.cross(u).normalized()
   for j in range(sides):verts.append(tuple(Vector(p)+radius*(u*math.cos(TAU*j/sides)+v*math.sin(TAU*j/sides))))
  for i in range(n if closed else n-1):
   for j in range(sides):faces.append((i*sides+j,i*sides+(j+1)%sides,((i+1)%n)*sides+(j+1)%sides,((i+1)%n)*sides+j))
  if not closed:faces.extend([tuple(range(sides-1,-1,-1)),tuple((n-1)*sides+j for j in range(sides))])
  return mesh(name,verts,faces,m)
 def front(x,z,offset=.075):
  sample_z=max(z,1.32 if character=='luna' else .95)
  hit,p,normal,index=body.ray_cast(Vector((x,-6,sample_z)),Vector((0,1,0)))
  return p.y-offset if hit else -spec['hat_y']-offset
 def radial(a,z,offset=.05):
  d=Vector((math.sin(a),-math.cos(a),0));hit,p,n,i=body.ray_cast(Vector((0,0,z))+d*7,-d)
  if not hit:p=Vector((d.x*.7,d.y*.7,z))
  return tuple(p+d*offset)
 def collar(name,zfront,zback,radius,m):
  pts=[]
  for i in range(64):
   a=TAU*i/64;z=zfront+(zback-zfront)*(1-math.cos(a))/2;pts.append(radial(a,z,.085))
  return tube(name,pts,radius,m,True)
 def star(name,x,y,z,r,m):
  outline=[(x+math.sin(TAU*i/10)*(r if i%2==0 else r*.46),z+math.cos(TAU*i/10)*(r if i%2==0 else r*.46)) for i in range(10)]
  return plate(name,outline,m,.055,lambda x,z:y)
 def plate(name,outline,m,thickness=.055,fy=None):
  fy=fy or (lambda x,z:front(x,z,.10))
  # Triangulated fan follows the body's convex front instead of cutting through it.
  cx=sum(p[0] for p in outline)/len(outline);cz=sum(p[1] for p in outline)/len(outline)
  verts=[(cx,fy(cx,cz),cz)]+[(x,fy(x,z),z) for x,z in outline]
  faces=[(0,i+1,(i+1)%len(outline)+1) for i in range(len(outline))]
  return mesh(name,verts,faces,m,thickness,.014)
 def lathe(name,sections,m,steps=48):
  # Each section is (z, radius_x, radius_y, center_x); bottom remains open.
  verts=[];faces=[]
  for z,rx,ry,cx in sections:
   for i in range(steps):
    a=TAU*i/steps;verts.append((cx+rx*math.cos(a),ry*math.sin(a),z))
  for j in range(len(sections)-1):
   for i in range(steps):k=j*steps+i;n=j*steps+(i+1)%steps;faces.append((k,n,n+steps,k+steps))
  return mesh(name,verts,faces,m,.055)
 def ellipse(name,z,rx,ry,m,r=.07):return tube(name,[(rx*math.cos(TAU*i/64),ry*math.sin(TAU*i/64),z) for i in range(64)],r,m,True)
 def band(name,z,rx,ry,height,m):return lathe(name,[(z-height/2,rx,ry,0),(z+height/2,rx,ry,0)],m)

 # Eye accessories remain open: real rims, nose bridge and wraparound temples/strap.
 for id in ['glasses','goggles']:
  new_root(id);z=spec['eye_z'];rim=coral if id=='glasses' else brass
  y=min(front(-.54,z,0),front(.54,z,0))-.395
  for sign in [-1,1]:
   cx=sign*.54
   tube('Frame_'+str(sign),[(cx+.505*math.cos(TAU*i/48),y+.018*math.sin(TAU*i/48),z+.635*math.sin(TAU*i/48)) for i in range(48)],.052 if id=='glasses' else .078,rim,True)
   if id=='goggles':
    tube('Goggle_cushion_'+str(sign),[(cx+.53*math.cos(TAU*i/48),y+.12,z+.66*math.sin(TAU*i/48)) for i in range(48)],.065,teal,True)
   side=radial(sign*math.pi/2,z+.05,.09)
   tube('Temple_'+str(sign),[(sign*1.055,y,z+.08),(sign*1.14,y+.24,z+.10),side,(side[0],.45,z-.08)],.055,coral if id=='glasses' else teal)
  tube('Nose_bridge',[(-.05,y,z+.07),(0,y-.06,z+.15),(.05,y,z+.07)],.06,rim)
  if id=='goggles':
   pts=[radial(math.pi/2+math.pi*i/40,z,.075) for i in range(41)];tube('Rear_goggle_strap',pts,.09,navy)

 # Crown, beanie and wizard hat are hollow fitted caps with actual side/back geometry.
 hz=spec['hat_z'];hx=spec['hat_x'];hy=spec['hat_y'];top=spec['top']
 new_root('crown');ellipse('Crown_base',hz+.06,hx,hy,gold,.085)
 verts=[];faces=[];n=48
 for i in range(n):
  a=TAU*i/n;peak=.55 if i%8==0 else (.15 if i%8==4 else .27)
  verts.extend([(hx*math.sin(a),-hy*math.cos(a),hz+.04),(hx*math.sin(a),-hy*math.cos(a),hz+peak)])
 for i in range(n):faces.append((2*i,2*((i+1)%n),2*((i+1)%n)+1,2*i+1))
 mesh('Crown_points',verts,faces,gold,.075,.014)
 star('Turquoise_star',0,-hy-.06,hz+.24,.18,teal)
 for sign in [-1,1]:uv('Crown_jewel_'+str(sign),(sign*hx*.64,-hy*.78,hz+.23),(.095,.035,.105),violet,16,10)
 new_root('beanie')
 capheight=max(.64,top-hz+.30)
 cap_sections=[]
 for i in range(13):
  t=i/12;a=t*math.pi/2;r=max(.025,math.cos(a));cap_sections.append((hz+capheight*math.sin(a),hx*r,hy*r,.12*t))
 lathe('Knitted_cap',cap_sections,lilac)
 band('Folded_cuff',hz+.07,hx+.035,hy+.035,.23,lilac)
 for i in range(32):
  a=TAU*i/32;tube('Cuff_rib_'+str(i),[((hx+.065)*math.cos(a),(hy+.065)*math.sin(a),hz-.035),((hx+.065)*math.cos(a),(hy+.065)*math.sin(a),hz+.175)],.016,violet,sides=6)
 uv('Yellow_pompom',(.12,0,hz+capheight+.11),(.24,.24,.24),gold)
 new_root('wizard')
 brimpts=[]
 for i in range(80):
  a=TAU*i/80;brimpts.append(((hx+.33)*math.cos(a),(hy+.25)*math.sin(a),hz+.025+.11*math.cos(2*a)))
 # A full annular brim and its rolled edge.
 vv=[];ff=[]
 for i in range(80):
  a=TAU*i/80;vv.extend([(hx*.87*math.cos(a),hy*.87*math.sin(a),hz+.06),brimpts[i]])
 for i in range(80):ff.append((2*i,2*i+1,2*((i+1)%80)+1,2*((i+1)%80)))
 mesh('Hat_brim',vv,ff,violet,.085);tube('Rolled_brim',brimpts,.065,violet,True)
 height=max(1.42,top-hz+1.02)
 sections=[(hz,hx*.94,hy*.94,0),(hz+.32,hx*.81,hy*.81,0),(hz+.75,hx*.57,hy*.57,.05),(hz+height*.8,hx*.28,hy*.28,.14),(hz+height,hx*.10,hy*.10,.37),(hz+height-.13,.025,.025,.58)]
 lathe('Bent_wizard_hat',sections,violet)
 band('Golden_hat_band',hz+.17,hx*.88,hy*.88,.16,gold)
 for x,z,scale in [(0,hz+.20,.15),(-hx*.35,hz+.58,.13),(hx*.27,hz+.93,.11),(.12,hz+1.22,.085)]:
  factor=max(.17,1-(z-hz)/(height+.15));star('Hat_star',x,-hy*factor-.035,z,scale,gold)
 new_root('headphones')
 # Follow the real body silhouette so Luna's rays and Sunny's narrow head both fit.
 pts=[]
 for i in range(49):
  a=math.pi*i/48;x=spec['head_x']*math.cos(a);z=2.72+(max(top+.18,3.95)-2.72)*math.sin(a);pts.append((x,.10+(.62*math.sin(a) if character=='moss' else 0),z))
 tube('Teal_headband',pts,.115,teal)
 for sign in [-1,1]:
  x=sign*spec['head_x'];uv('Coral_earpad_'+str(sign),(x,.10,2.72),(.18,.40,.47),coral)
  uv('Teal_earcup_'+str(sign),(x+sign*.13,.10,2.72),(.13,.34,.40),teal)
  uv('Gold_earcup_badge_'+str(sign),(x+sign*.245,.10,2.72),(.025,.13,.15),gold,16,10)

 # Body accessories use body-surface samples. Their front tops stay below the smile.
 new_root('bowtie');collar('Bowtie_neck_strap',1.50,1.73,.055,coral)
 for sign in [-1,1]:
  wing=uv('Bow_wing_'+str(sign),(sign*.29,front(sign*.29,1.46,.17),1.46),(.34,.13,.21),coral);wing.rotation_euler.y=sign*.16
  for dx,dz in [(-.04,.07),(.11,-.05),(-.13,-.06)]:
   x=sign*(.29+dx);z=1.46+dz;uv('Ivory_dot',(x,front(x,z,.29),z),(.032,.017,.032),cream,12,8)
 uv('Bow_knot',(0,front(0,1.46,.20),1.46),(.13,.14,.16),coral)
 new_root('tie');collar('Tie_neck_strap',1.55,1.77,.045,teal)
 plate('Tie_knot',[(-.15,1.60),(.15,1.60),(.10,1.39),(-.10,1.39)],teal,.10)
 plate('Teal_tie',[(-.085,1.41),(.085,1.41),(.18,.77),(0,.59),(-.18,.77)],teal,.075)
 plate('Lightning',[(-.015,1.21),(.09,1.21),(.005,1.04),(.085,1.04),(-.075,.83),(-.025,1.02),(-.10,1.02)],gold,.025,lambda x,z:front(x,z,.15))
 new_root('necklace');chain_front=1.36 if character=='luna' else 1.18;pendant_z=chain_front-.27;collar('Gold_chain',chain_front,1.86,.035,gold)
 for i in range(36):
  a=TAU*i/36;z=chain_front+(1.86-chain_front)*(1-math.cos(a))/2;p=radial(a,z,.085);uv('Chain_link_'+str(i),p,(.045,.045,.055),gold,12,8)
 # Solid crescent with a properly cut inner edge, rather than an opaque disk.
 outer=[];inner=[]
 for i in range(25):
  a=math.radians(48)+math.radians(264)*i/24;outer.append((.20*math.cos(a),pendant_z+.20*math.sin(a)))
 for i in range(25):
  a=math.radians(65)+math.radians(230)*i/24;inner.append((.09+.165*math.cos(a),pendant_z+.03+.165*math.sin(a)))
 crescent_verts=[(x,front(x,z,.15),z) for pair in zip(outer,inner) for x,z in pair]
 crescent_faces=[(2*i,2*i+1,2*i+3,2*i+2) for i in range(24)]
 mesh('Moon_pendant',crescent_verts,crescent_faces,gold,.075,.014)
 new_root('scarf')
 # Six-colored wrap, fitted all the way around; tails follow the curved belly.
 for i in range(48):
  pts=[]
  for j in range(5):
   a=TAU*(i+j/4)/48;z=1.48+.22*(1-math.cos(a))/2;pts.append(radial(a,z,.105))
  tube('Rainbow_wrap_'+str(i),pts,.105,rainbow[(i//2)%6],False)
 for sign in [-1,1]:
  for i,m in enumerate(rainbow):
   z=1.36-i*.125;x=sign*(.51+.07*i/6)
   plate('Scarf_tail_'+str(sign)+'_'+str(i),[(x-.135,z+.065),(x+.135,z+.065),(x+.13,z-.065),(x-.13,z-.065)],m,.085,lambda x,z:front(x,z,.16))
  for j in range(4):
   x=sign*.57-.09+j*.06;tube('Scarf_fringe',[(x,front(x,.66,.16),.66),(x+.02,front(x+.02,.56,.16),.56)],.025,rainbow[j],sides=6)
 new_root('medal');collar('Medal_back_ribbon',1.58,1.82,.055,navy)
 for sign in [-1,1]:
  points=[]
  for i in range(16):
   t=i/15;x=sign*.56*(1-t);z=1.58-.50*t;points.append((x,front(x,z,.13),z))
  tube('Navy_medal_ribbon_'+str(sign),points,.075,navy)
 uv('Gold_medallion',(0,front(0,.96,.16),.96),(.23,.06,.23),gold,32,16)
 star('Medal_star',0,front(0,.96,.235),.96,.15,cream)
 new_root('bandana');collar('Bandana_neck_wrap',1.53,1.76,.075,coral)
 # A subdivided triangular cloth drapes along the belly, with full thickness.
 verts=[];faces=[];rows=12;cols=24
 for j in range(rows+1):
  t=j/rows;half=.75*(1-t)+.02;z=1.56-.88*t
  for i in range(cols+1):
   u=-1+2*i/cols;x=half*u;zz=z+.10*u*u*(1-t);verts.append((x,front(x,zz,.12)-.025*math.sin(t*math.pi*5),zz))
 for j in range(rows):
  for i in range(cols):k=j*(cols+1)+i;faces.append((k,k+1,k+cols+2,k+cols+1))
 mesh('Coral_bandana',verts,faces,coral,.055)
 for x,z,s in [(-.38,1.43,.073),(.35,1.44,.07),(0,1.27,.085),(-.19,1.10,.065),(.17,.99,.06),(0,.81,.045)]:star('Bandana_star',x,front(x,z,.18),z,s,cream)
 # The rear knot and fabric ends show that this is wrapped around a 3D body.
 p=radial(math.pi,1.76,.12);uv('Bandana_rear_knot',p,(.13,.12,.11),coral)
 for sign in [-1,1]:uv('Bandana_rear_tail_'+str(sign),(sign*.18,p[1],1.62),(.21,.06,.09),coral)

 # Batch disconnected pieces by material: the visible outfit needs only a few
 # draw calls, while each material group remains an editable Blender mesh.
 for id,root in roots.items():
  groups={}
  for obj in list(root.children):
   if obj.type=='MESH':groups.setdefault(obj.data.materials[0].name,[]).append(obj)
  for material,objects in groups.items():
   bpy.ops.object.select_all(action='DESELECT')
   for obj in objects:obj.select_set(True)
   bpy.context.view_layer.objects.active=objects[0]
   if len(objects)>1:bpy.ops.object.join()
   objects[0].name=id+'_'+material
 # Character-specific conflicts are explicit and consumed by the runtime adapter.
 hidden=[]
 if character=='sunny':hidden=['Crown_tuft_0','Crown_tuft_1','Crown_tuft_2']
 if character=='moss':hidden=['Soft_horn_-1','Soft_horn_1']
 for id in ['beanie','wizard','crown']:
  roots[id]['hide_character_meshes']=hidden
 scene['wearable_attachment']='Direct child of Body_Control; no rescaling or alignment offsets required.'
 scene['wearable_note']='Only one upper and one lower root visible at a time. Reference body is not exported.'
 bpy.ops.object.select_all(action='DESELECT')
 for o in coll.objects:o.select_set(True)
 bpy.context.view_layer.objects.active=roots['glasses']
 bpy.ops.export_scene.gltf(filepath=str(OUT/f'{character}-wearables.glb'),export_format='GLB',use_selection=True,export_animations=False,export_extras=True,export_materials='EXPORT')
 reports=[]
 for id,root in roots.items():
  triangles=0;meshes=0
  for o in root.children:
   if o.type=='MESH':o.data.calc_loop_triangles();triangles+=len(o.data.loop_triangles);meshes+=1
  reports.append({'id':id,'root':root.name,'category':'upper' if id in UPPER else 'lower','triangles':triangles,'meshes':meshes,'hideCharacterMeshes':hidden if id in ['crown','beanie','wizard'] else []})
 report={'character':character,'attachment':'Body_Control','glTFUp':'+Y','glTFFront':'+Z','rootTransforms':'identity','blender':bpy.app.version_string,'glbBytes':(OUT/f'{character}-wearables.glb').stat().st_size,'triangles':sum(x['triangles'] for x in reports),'wearables':reports,'source':f'source/{character}-wearables.blend'}
 (OUT/f'{character}-wearables-info.json').write_text(json.dumps(report,indent=2)+'\n')
 # The exported roots stay independent; the editable source attaches them to
 # the existing control so unmuting a character NLA clip also moves the outfit.
 for root in roots.values():root.parent=bpy.data.objects['Body_Control']
 # Save the fully editable source with only one sample outfit visible.
 def show(ids):
  for id,root in roots.items():
   for obj in [root,*root.children]:obj.hide_render=id not in ids;obj.hide_viewport=id not in ids
  for name in hidden:bpy.data.objects[name].hide_render=any(x in ids for x in ['beanie','wizard','crown'])
 show(['wizard','bandana'])
 bpy.context.preferences.filepaths.save_version=0
 bpy.ops.wm.save_as_mainfile(filepath=str(HERE/f'{character}-wearables.blend'))
 if render:
  scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=20;scene.cycles.use_denoising=True
  scene.render.resolution_x=560;scene.render.resolution_y=650;scene.render.resolution_percentage=100
  scene.camera.location=(4.6,-12,5.7);scene.camera.data.ortho_scale=6.0;scene.camera.rotation_euler=(Vector((0,0,2.45))-scene.camera.location).to_track_quat('-Z','Y').to_euler()
  for a,b in zip(UPPER,IDS[6:]):
   show([a,b]);scene.render.filepath=str(QA/f'wearables-{character}-{a}-{b}.png');bpy.ops.render.render(write_still=True)
 print('WEARABLE_ASSET_REPORT',json.dumps(report))

if __name__=='__main__':
 args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
 render='--no-render' not in args;selected=[x for x in args if not x.startswith('--')] or list(SPECS)
 for character in selected:
  if character not in SPECS:raise ValueError('Unknown character '+character)
  build(character,render)

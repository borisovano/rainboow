"""Build all four editable Blender characters, animated GLBs and studio renders.
Run: Blender --background --factory-startup --threads 4 --python build_characters.py
Optional selection after --: pip moss sunny luna. No UI or Accessibility access.
"""
import bpy, math, json, sys
from pathlib import Path
from mathutils import Vector
HERE=Path(__file__).resolve().parent
OUT=HERE.parent/'assets'
OUT.mkdir(exist_ok=True)
SPECS={
 'pip':{'color':(.36,.14,.70),'iris':(.12,.025,.21),'width':1.40,'depth':1.31,'height':1.63,'taper':.05},
 'moss':{'color':(.18,.62,.37),'iris':(.025,.13,.075),'width':1.34,'depth':1.12,'height':1.44,'taper':0},
 'sunny':{'color':(.98,.36,.075),'iris':(.19,.07,.025),'width':1.25,'depth':1.08,'height':1.58,'taper':.30},
 'luna':{'color':(.045,.40,.83),'iris':(.015,.12,.38),'width':1.82,'depth':1.06,'height':1.82,'taper':0},
}
def build(character):
 name=character.title();spec=SPECS[character]
 bpy.ops.object.select_all(action='SELECT')
 bpy.ops.object.delete(use_global=False)
 for block in list(bpy.data.materials): bpy.data.materials.remove(block)
 scene=bpy.context.scene
 scene.render.fps=30
 scene.frame_start=1
 scene.frame_end=90
 scene.unit_settings.system='METRIC'
 scene.world.color=(.16,.18,.20)
 
 # Linear RGB values, chosen to reproduce the lavender clay reference under studio light.
 def mat(name,color,rough=.5,metal=0):
  m=bpy.data.materials.new(name);m.use_nodes=True
  p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1)
  p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
  return m
 skin=mat('Pip · lavender clay',spec['color'],.48)
 cream=mat('Eyes · warm ivory',(.95,.90,.72),.32)
 iris=mat('Iris · plum',spec['iris'],.29)
 pupil=mat('Pupils · midnight',(.012,.006,.025),.22)
 glint=mat('Eye catchlights',(.98,.98,1),.2)
 mouthmat=mat('Mouth · warm shadow',(.055,.006,.021),.72)
 tongue=mat('Tongue · strawberry',(.62,.09,.17),.48)
 sole=mat('Foot pads · soft lavender',tuple(c*.65 for c in spec['color']),.6)
 
 char_collection=bpy.data.collections.new(name.upper()+' | exportable character')
 scene.collection.children.link(char_collection)
 def to_char(obj):
  for c in list(obj.users_collection):c.objects.unlink(obj)
  char_collection.objects.link(obj)
  return obj
 
 def empty(name,parent=None,loc=(0,0,0)):
  obj=bpy.data.objects.new(name,None);char_collection.objects.link(obj);obj.location=loc
  if parent:obj.parent=parent
  return obj
 root=empty(name+'_Root')
 root['character_id']=character;root['source_reference']='character-studio/assets/'+character+'.png'
 root['notes']='Editable multipart mascot. Front is Blender -Y; exported glTF front is +Z. Floor is at feet.'
 body_rig=empty('Body_Control',root)
 
 def mesh(name,verts,faces,material,parent=body_rig):
  data=bpy.data.meshes.new(name+'_Mesh');data.from_pydata(verts,[],faces);data.update()
  obj=bpy.data.objects.new(name,data);char_collection.objects.link(obj)
  if parent:obj.parent=parent
  obj.data.materials.append(material)
  for polygon in data.polygons:polygon.use_smooth=True
  return obj
 
 def uv(name,location,scale,material,parent=body_rig,segments=40,rings=24):
  bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,location=location)
  obj=to_char(bpy.context.object);obj.name=name;obj.scale=scale
  bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
  if parent:obj.parent=parent
  obj.data.materials.append(material)
  for face in obj.data.polygons:face.use_smooth=True
  return obj
 
 # Each mascot has a different closed, volumetric body profile.
 verts=[];faces=[];rows=48;cols=72
 for j in range(rows+1):
  theta=math.pi*j/rows;ct=math.cos(theta);st=max(0,math.sin(theta))
  for i in range(cols):
   a=2*math.pi*i/cols
   if character=='luna':
    # Five softly rounded rays in the X/Z silhouette, with a full curved front and back.
    r=1.48*(1+.23*math.cos(5*a))
    verts.append((r*st*math.sin(a),spec['depth']*ct,2.15+r*st*math.cos(a)))
   else:
    power=.48 if character=='moss' else 1.0
    radial=(st**power)*(1-spec['taper']*ct)
    cp=lambda n: math.copysign(abs(n)**(.52 if character=='moss' else 1),n)
    verts.append((spec['width']*radial*cp(math.cos(a)),spec['depth']*radial*cp(math.sin(a)),2.16+spec['height']*math.copysign(abs(ct)**power,ct)))
 for j in range(rows):
  for i in range(cols):
   k=j*cols+i;n=j*cols+(i+1)%cols;faces.append((k,n,n+cols,k+cols))
 body=mesh('Body',verts,faces,skin)
 # Recalculate outward normals before the mouth boolean.
 bpy.context.view_layer.objects.active=body;body.select_set(True)
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT');body.select_set(False)
 
 # Place facial details on the actual curved surface, including at side angles.
 bpy.context.view_layer.update()
 def front_y(x,z):
  hit,point,normal,index=body.ray_cast(Vector((x,-5,z)),Vector((0,1,0)))
  return point.y if hit else -spec['depth']*.9
 
 def stroke(name,points,radius,material):
  data=bpy.data.curves.new(name,'CURVE');data.dimensions='3D';data.bevel_depth=radius;data.bevel_resolution=3;data.resolution_u=16;data.use_fill_caps=True
  spline=data.splines.new('POLY');spline.points.add(len(points)-1)
  for i,(p,co) in enumerate(zip(spline.points,points)):
   p.co=(*co,1);p.radius=.22+.78*math.sin(math.pi*i/(len(points)-1))**.4
  obj=bpy.data.objects.new(name,data);char_collection.objects.link(obj);obj.parent=body_rig;obj.data.materials.append(material)
  bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj;bpy.ops.object.convert(target='MESH')
  for poly in obj.data.polygons:poly.use_smooth=True
  return obj
 
 if character=='pip':
  # Carve a real shallow smile cavity; the backing and tongue sit inside the opening.
  outline=[]
  for i in range(33):
   u=-1+2*i/32;outline.append((.40*u,1.95+.11*u*u))
  for i in range(32,-1,-1):
   u=-1+2*i/32;outline.append((.40*u,1.66+.40*u*u))
  count=len(outline)
  cv=[(x,y,z) for y in (-2.1,-spec['depth']+.30) for x,z in outline]
  cf=[tuple(range(count-1,-1,-1)),tuple(range(count,2*count))]+[(i,(i+1)%count,(i+1)%count+count,i+count) for i in range(count)]
  cutter=mesh('Mouth_cut_volume',cv,cf,mouthmat,None)
  bpy.context.view_layer.objects.active=cutter;cutter.select_set(True)
  bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT');cutter.select_set(False)
  bpy.context.view_layer.objects.active=body
  modifier=body.modifiers.new('Sculpted smile cavity','BOOLEAN');modifier.operation='DIFFERENCE';modifier.solver='EXACT';modifier.object=cutter
  bpy.ops.object.modifier_apply(modifier=modifier.name)
  bpy.data.objects.remove(cutter,do_unlink=True)
  back=mesh('Smile_Interior',[(x,-spec['depth']+.285,z) for x,z in outline],[tuple(range(count))],mouthmat)
  # Slightly thicken the mouth backing to ensure correct shading from side angles.
  solid=back.modifiers.new('Interior thickness','SOLIDIFY');solid.thickness=.015
  bpy.context.view_layer.objects.active=back;bpy.ops.object.modifier_apply(modifier=solid.name)
  uv('Tongue',(0,-spec['depth']+.20,1.72),(.24,.075,.075),tongue,segments=32,rings=16)
  
 else:
  pts=[]
  for i in range(33):
   u=-1+2*i/32;x=.32*u;z=1.91+.19*u*u
   pts.append((x,front_y(x,z)-.018,z))
  stroke('Smile',pts,.034,mouthmat)
 
 # Eyes are grouped so blinking compresses a whole eye around its center.
 eyes=[]
 eye_z=2.48 if character=='luna' else 2.70
 for side,x in [('L',-.54),('R',.54)]:
  eye=empty('Eye_'+side+'_Control',body_rig,(x,front_y(x,eye_z)-.025,eye_z));eyes.append(eye)
  uv('Eye_'+side+'_White',(0,0,0),(.46,.255,.60),cream,eye)
  uv('Eye_'+side+'_Iris',(.035 if side=='L' else -.035,-.239,-.04),(.245,.064,.335),iris,eye,32,20)
  uv('Eye_'+side+'_Pupil',(.035 if side=='L' else -.035,-.292,-.04),(.185,.040,.258),pupil,eye,32,20)
  uv('Eye_'+side+'_Highlight',(-.065,-.328,.10),(.070,.018,.085),glint,eye,24,16)
  uv('Eye_'+side+'_SmallHighlight',(.108,-.328,-.16),(.025,.012,.032),glint,eye,16,12)
 
 # Brow curves and the distinctive details in the image concepts.
 browmat=mat('Brow clay',tuple(c*.65 for c in spec['color']))
 for side,sign in [('L',-1),('R',1)]:
  pts=[]
  for i in range(25):
   t=i/24;x=sign*((.24+.34*t) if character=='luna' else (.33+.40*t));z=(3.00 if character=='luna' else 3.28)+.07*math.sin(math.pi*t)-.07*t
   pts.append((x,front_y(x,z)-.015,z))
  stroke('Brow_'+side,pts,.072,browmat)
 if character=='moss':
  for sign in [-1,1]:
   horn=uv('Soft_horn_'+str(sign),(sign*1.10,0,3.70),(.23,.30,.46),skin,segments=32,rings=20)
   horn.rotation_euler.y=sign*.32
 if character=='sunny':
  for i,(x,z,angle,length) in enumerate([(-.38,3.92,-.65,.45),(0,4.12,.16,.55),(.40,3.88,.8,.38)]):
   tuft=uv('Crown_tuft_'+str(i),(x,0,z),(.17,.23,length),skin,segments=32,rings=20);tuft.rotation_euler.y=angle
 
 # Curved, continuous mitten arms, each rotating from a shoulder control.
 arms=[]
 for side,sign in [('L',-1),('R',1)]:
  pivot=empty('Arm_'+side+'_Control',body_rig,(sign*(1.18 if character=='moss' else 1.10),0,2.22));arms.append(pivot)
  av=[];af=[];length=32;around=24
  for j in range(length+1):
   t=j/length;radius=.29*(math.sin(math.pi*t)**.45)
   center=Vector((sign*(.12+.48*t-.08*t*t),-.02-.14*t,-1.24*t))
   for i in range(around):
    a=2*math.pi*i/around
    av.append(tuple(center+Vector((radius*math.cos(a),radius*.8*math.sin(a),0))))
  for j in range(length):
   for i in range(around):
    k=j*around+i;n=j*around+(i+1)%around;af.append((k,n,n+around,k+around))
  arm=mesh('Arm_'+side,av,af,skin,pivot)
  if character!='pip':uv('Thumb_'+side,(sign*.32,-.15,-.99),(.17,.20,.23),skin,pivot,24,16)
  # Explicit normal orientation: ring order for these downward tubes is reversed.
  for p in arm.data.polygons:p.flip()
 
 feet=[]
 for side,x in [('L',-.57),('R',.57)]:
  foot=empty('Foot_'+side+'_Control',root,(x,0,.30));feet.append(foot)
  uv('Leg_'+side,(0,.01,.26),(.27,.35,.37),skin,foot,28,20)
  uv('Foot_'+side,(0,-.16,0),(.57,.67,.28),skin,foot)
  uv('Sole_'+side,(0,-.12,-.205),(.40,.48,.052),sole,foot,32,16)
 
 # Named NLA tracks merge matching object actions into four portable GLB clips.
 animated=[root,body_rig,*arms,*feet,*eyes]
 rest={o.name:(o.location.copy(),o.rotation_euler.copy(),o.scale.copy()) for o in animated}
 clips={'Idle':90,'Walk':30,'Jump':54,'Wave':72}
 for name,duration in clips.items():
  for obj in animated:
   obj.animation_data_create();obj.animation_data.action=None
   for frame in range(1,duration+2,3):
    frame=min(frame,duration+1);t=(frame-1)/duration;phase=2*math.pi*t
    obj.location,obj.rotation_euler,obj.scale=[v.copy() for v in rest[obj.name]]
    if name=='Idle':
     if obj==body_rig:obj.scale=(1+.012*math.sin(phase),1+.012*math.sin(phase),1+.018*math.sin(phase))
     if obj in eyes:
      blink=max(0,1-abs(t-.65)/.045);obj.scale.z=1-.94*blink
     if obj in arms:obj.rotation_euler.y=(.035 if obj==arms[0] else -.035)*math.sin(phase)
    elif name=='Walk':
     if obj==body_rig:obj.location.z=.06*abs(math.sin(phase));obj.rotation_euler.y=.04*math.sin(phase)
     if obj in arms:obj.rotation_euler.x=(.36 if obj==arms[0] else -.36)*math.sin(phase)
     if obj in feet:
      step=phase+(0 if obj==feet[0] else math.pi);obj.location.y+=.22*math.sin(step);obj.location.z+=.10*max(0,math.sin(step));obj.rotation_euler.x=.2*math.sin(step)
    elif name=='Jump':
     # Anticipation, airborne arc, landing squash, then return exactly to rest.
     if obj==root:
      if .2<t<.8:obj.location.z=1.1*math.sin(math.pi*(t-.2)/.6)
     if obj==body_rig:
      squash=.14*max(0,1-abs(t-.12)/.12)+.12*max(0,1-abs(t-.87)/.10)
      obj.scale=(1+squash/2,1+squash/2,1-squash)
     if obj in arms:obj.rotation_euler.y=(-1 if obj==arms[0] else 1)*.55*math.sin(math.pi*t)**2
    elif name=='Wave':
     envelope=math.sin(math.pi*t)**2
     if obj==arms[1]:obj.rotation_euler.y=-2.45*envelope+.23*math.sin(phase*3)*envelope
     if obj==body_rig:obj.rotation_euler.y=-.05*envelope
    for prop in ('location','rotation_euler','scale'):obj.keyframe_insert(data_path=prop,frame=frame,group=obj.name)
   action=obj.animation_data.action;action.name=name+'__'+obj.name
   slot=obj.animation_data.action_slot
   track=obj.animation_data.nla_tracks.new();track.name=name
   strip=track.strips.new(name,1,action)
   if hasattr(strip,'action_slot'):strip.action_slot=slot
   strip.extrapolation='NOTHING';track.mute=True
   obj.animation_data.action=None
   obj.location,obj.rotation_euler,obj.scale=[v.copy() for v in rest[obj.name]]
 
 # A reference image is packed into the .blend for future edits, outside the export collection.
 reference=bpy.data.images.load(str(HERE.parent.parent/'assets'/f'{character}.png'));reference.pack()
 reference['role']='Original image concept for '+character.title()
 scene.frame_set(1)
 # Export only character objects; stage, lights, and camera remain Blender-only.
 bpy.ops.object.select_all(action='DESELECT')
 for obj in char_collection.objects:obj.select_set(True)
 bpy.context.view_layer.objects.active=root
 bpy.ops.export_scene.gltf(filepath=str(OUT/f'{character}.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_merge_animation='NLA_TRACK',export_anim_slide_to_zero=True,export_force_sampling=True,export_frame_range=False,export_materials='EXPORT',export_extras=True)
 
 # Render with CPU Cycles so no graphics UI or Metal render device is needed.
 scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=40;scene.cycles.use_denoising=True
 scene.render.resolution_x=1000;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
 scene.render.image_settings.file_format='PNG'
 scene.render.film_transparent=False
 scene.world.use_nodes=True
 scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.54,.58,.65,1)
 scene.world.node_tree.nodes['Background'].inputs[1].default_value=.35
 floor_mat=mat('Studio · sage chalk',(.57,.64,.56),.85)
 bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,0));floor=bpy.context.object;floor.name='Studio floor (not exported)';floor.data.materials.append(floor_mat)
 def aim(obj,at):obj.rotation_euler=(Vector(at)-obj.location).to_track_quat('-Z','Y').to_euler()
 for name,loc,power,size in [('Key',(-4,-5,7),650,5),('Fill',(4,-3,4),350,4),('Rim',(1,4,6),800,3)]:
  data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size
  ob=bpy.data.objects.new(name,data);scene.collection.objects.link(ob);ob.location=loc;aim(ob,(0,0,2))
 bpy.ops.object.camera_add(location=(5.7,-12,6));camera=bpy.context.object;camera.name='Studio camera';camera.data.type='ORTHO';camera.data.ortho_scale=5.8;aim(camera,(0,0,1.95));scene.camera=camera
 scene.view_settings.view_transform='AgX'
 # Keep an editable source with all four muted NLA tracks. Select a track and unmute it to play.
 bpy.context.preferences.filepaths.save_version=0
 bpy.ops.wm.save_as_mainfile(filepath=str(HERE/f'{character}.blend'))
 scene.render.filepath=str(OUT/f'{character}-render.png')
 bpy.ops.render.render(write_still=True)
 triangle_count=0
 for obj in char_collection.objects:
  if obj.type=='MESH':obj.data.calc_loop_triangles();triangle_count+=len(obj.data.loop_triangles)
 report={'character':character.title(),'id':character,'bodyDepth':spec['depth']*2,'bodyWidth':spec['width']*2,'blender':bpy.app.version_string,'triangles':triangle_count,'meshes':sum(o.type=='MESH' for o in char_collection.objects),'materials':len({s.material.name for o in char_collection.objects if o.type=='MESH' for s in o.material_slots}),'clips':list(clips),'glbBytes':(OUT/f'{character}.glb').stat().st_size,'source':f'source/{character}.blend','reference':f'../assets/{character}.png'}
 (OUT/f'{character}-info.json').write_text(json.dumps(report,indent=2)+'\n')
 print('CHARACTER_ASSET_REPORT',json.dumps(report))

if __name__=='__main__':
 selected=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else list(SPECS)
 for character in selected:
  if character not in SPECS:raise ValueError('Unknown character: '+character)
  build(character)

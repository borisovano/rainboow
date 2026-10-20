// Verify the exported asset contract, including the animation data itself.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../character-studio/3d');
for(const id of ['pip','moss','sunny','luna']){
const binary = fs.readFileSync(path.join(root, `assets/${id}.glb`));
assert.equal(binary.toString('ascii', 0, 4), 'glTF');
assert.equal(binary.readUInt32LE(4), 2);
assert.equal(binary.readUInt32LE(8), binary.length);
assert(binary.length < 2 * 1024 * 1024, 'Pip should remain a small browser asset');
const jsonLength = binary.readUInt32LE(12);
assert.equal(binary.toString('ascii', 16, 20), 'JSON');
const gltf = JSON.parse(binary.subarray(20, 20 + jsonLength));
const binOffset = 20 + jsonLength;
assert.equal(binary.readUInt32LE(binOffset + 4), 0x004e4942);
const payload = binary.subarray(binOffset + 8);
assert(gltf.buffers.every(buffer => !buffer.uri), 'No external buffer fetches');
assert((gltf.images || []).every(image => !image.uri), 'No external image fetches');
assert.deepEqual(gltf.animations.map(clip => clip.name).sort(), ['Idle', 'Jump', 'Walk', 'Wave']);
const expectedDurations = { Idle: 3, Walk: 1, Jump: 1.8, Wave: 2.4 };
for (const clip of gltf.animations) {
  assert(clip.channels.length > 0);
  let duration = 0, hasMotion = false;
  for (const sampler of clip.samplers) {
    const input = gltf.accessors[sampler.input];
    assert(input.count > 1 && input.componentType === 5126 && input.type === 'SCALAR');
    duration = Math.max(duration, input.max[0]);
    const output = gltf.accessors[sampler.output];
    assert.equal(output.count, input.count);
    assert.equal(output.componentType, 5126);
    const view = gltf.bufferViews[output.bufferView];
    const components = { VEC3: 3, VEC4: 4 }[output.type];
    assert(components, 'Animation outputs should be transforms');
    const stride = view.byteStride || components * 4;
    const start = (view.byteOffset || 0) + (output.byteOffset || 0);
    for (let sample = 0; sample < output.count; sample++) {
      for (let component = 0; component < components; component++) {
        const value = payload.readFloatLE(start + sample * stride + component * 4);
        assert(Number.isFinite(value), `${clip.name}: finite animation values`);
        if (Math.abs(value - payload.readFloatLE(start + component * 4)) > 0.001) hasMotion = true;
      }
    }
  }
  assert(Math.abs(duration - expectedDurations[clip.name]) < 0.04, `${clip.name} duration`);
  assert(hasMotion, `${clip.name} must actually move`);
  for (const channel of clip.channels) {
    assert(gltf.nodes[channel.target.node]);
    assert(['translation', 'rotation', 'scale'].includes(channel.target.path));
  }
}
let triangles = 0;
for (const mesh of gltf.meshes) for (const primitive of mesh.primitives) {
  assert.equal(primitive.mode ?? 4, 4);
  const positions = gltf.accessors[primitive.attributes.POSITION];
  assert(positions.min.every(Number.isFinite) && positions.max.every(Number.isFinite));
  triangles += gltf.accessors[primitive.indices].count / 3;
}
assert(triangles > 1000 && triangles < 50000);
const report = JSON.parse(fs.readFileSync(path.join(root, `assets/${id}-info.json`)));
assert.equal(report.triangles, triangles);
assert.equal(report.glbBytes, binary.length);
assert.equal(report.meshes, gltf.meshes.length);
assert(fs.statSync(path.join(root, `source/${id}.blend`)).size > 100000);
assert.equal(fs.readFileSync(path.join(root, `assets/${id}-render.png`)).toString('hex', 0, 8), '89504e470d0a1a0a');
assert.equal(report.character,id[0].toUpperCase()+id.slice(1));
if(id==='pip'){const body=gltf.meshes.find(m=>m.name.startsWith('Body_Mesh'));const bounds=gltf.accessors[body.primitives[0].attributes.POSITION];const depth=bounds.max[2]-bounds.min[2],width=bounds.max[0]-bounds.min[0];assert(depth/width>.9,'Pip body depth should be close to its width, not flattened');}
console.log(`${id} 3D: self-contained GLB, ${triangles} triangles, four animated clips with valid transforms, Blender source and render.`);

}

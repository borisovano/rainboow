# Pip in 3D

Independent preview: `/character-studio/3d/`. This is a 3D study of the original Pip concept; game avatars and the 2D accessory system are unchanged.

## Assets and workflow

- `source/build_pip.py`: deterministic Blender Python model builder, animation authoring, GLB export and CPU render.
- `source/pip.blend`: editable Blender scene with named mesh parts, PBR materials, transform controls, four NLA animation tracks, packed concept image, lights and camera.
- `assets/pip.glb`: standalone binary glTF 2.0, with Idle (3s), Walk (1s), Jump (1.8s), and Wave (2.4s) clips. Walk is in place; all clips loop in the viewer.
- `assets/pip-render.png`: actual Blender Cycles render, also the browser fallback.
- `assets/pip-info.json`: exported model measurements.
- `vendor/`: Three.js 0.186.1 and required addons, vendored with MIT license. No viewer CDN dependency.

Built with Blender 5.2.1 LTS. From the repository root:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --threads 4 --python character-studio/3d/source/build_pip.py
npm test
npm run build
```

Other platforms can substitute their Blender executable. The script uses Blender's Python API and CPU rendering; it needs no Accessibility permission, GUI automation, add-ons, credentials, or external modeling service. On macOS Blender startup may need to run outside an execution sandbox because Blender probes Metal even in background mode.

## Editing

Pip is a multipart mesh controlled by named parent objects, not a skinned humanoid rig. Edit `Body`, the eyes, arms, feet and their materials directly, or change the builder and regenerate. Blender is Z-up with the face toward -Y; GLB is Y-up with the face toward +Z and feet at ground level.

The `.blend` opens in a neutral pose with all NLA tracks muted. To preview a clip in Blender, unmute that named track on **all** animated control objects and keep other tracks muted; set the timeline to the clip's range. The exporter merges matching track names across objects. The browser's four buttons provide a simpler clip preview.

This pass uses geometric detail and materials rather than image-projected surfaces. It is suitable for an initial browser character, but has no humanoid skeleton, lip sync, accessory sockets, or game collision body yet. The original PNG remains the concept reference; the 3D shape is an interpretation of it.

## Verification

`tests/character-3d.cjs` reads the actual GLB binary: self-contained buffers, expected durations, animated transform values, geometry counts and deliverable presence. Browser QA covers animation selection, camera presets, playback, mesh view, and responsive layout. The viewer starts paused when reduced motion is requested; WebGL failures show the rendered image and preserve download links.

Three.js documentation: [loading glTF](https://threejs.org/manual/en/load-gltf.html) and [animation system](https://threejs.org/docs/#api/en/animation/AnimationMixer).

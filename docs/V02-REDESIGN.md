# BlockaScene v0.2: Editor redesign and movement language

## Design
- Near-black UI with neutral chrome, large canvas, floating contextual properties and touch-friendly controls.
- Bright actor/camera identity colors with no exact duplicates in one project, automatically extended beyond the initial palette.
- Actor circular symbols with front-facing triangles; camera symbols contain their stable camera number.
- A selection ring rotates objects by mouse, touch or pen drag; drag the body to move it. Hold Shift while rotating for 15-degree snapping on desktop.

## Scene model
- A **set** contains the fixed floor plan image and structural set objects.
- A **scene** lists actor, camera and equipment identities.
- Each **beat** is a snapshot of actor and camera positions, rotations, visibility and camera lens data, plus movable equipment states.
- Adding a beat copies the currently selected beat; editing it never modifies previous beats.
- Project-level identities retain color, labels and names across scenes and exports. There is no fixed cap on actors or cameras.
- Equipment can be locked to a common state across all beats.

## Movement notation
- **Dotted, arrowed, identity-colored line**: repositioning between adjacent beats.
- **Solid, arrowed, identity-colored line**: Camera Pos 1 → Pos 2 *within* one beat (push, slide or dolly / track).
- Past beat repositioning into the active beat is full color. Future ghosts and their paths are muted grey.
- Ghosting can be disabled or set to adjacent/all beats. Ghost overlays cannot be dragged.
- Camera move endpoints have independent positioning and ending facing direction. Movement display has its own toggle.

## Basic set equipment only
Simple renameable 2D symbols: light, panel, tube, flag, reflector, stand, track, boom and custom object. No photorealistic lighting, AI or 3D scope.

## Migration, safety, and exports
- A v0.1 .blockascene file is accepted; legacy camera setups migrate into per-beat camera states.
- The old desktop IndexedDB storage name is intentionally retained so existing portable-app saves are found.
- Project import/export produces schema v2; v0.1 originals aren't changed by migration.
- Exports use the selected beat or one PNG per beat, including camera states and camera moves. Ghosts are excluded from exports by default.
- Slideshow is WebM on platforms supporting the MediaRecorder WebM encoder; MP4 is not yet implemented.
- Cross-device sync, direct native Android APK and advanced camera animation are out of scope for this build.

## Smoke-test checklist
1. Open an existing v0.1 project after launching v0.2. Confirm sets, actors, cameras and beats migrated.
2. Add actors and cameras, confirm distinct colors and stable labels, modify a color and confirm changes persist across beats.
3. Select an actor/camera; drag body to move; drag selection circle to rotate; test on tablet touchscreen.
4. Create new beat, move an actor and a camera, switch beats and verify positions and grey ghosts plus arrowed dotted movement lines.
5. Select camera, choose `Push` and drag Pos 2; ensure colored solid arrow from Pos 1 to Pos 2.
6. Add a simple light and stand, rename and move between beats; test `Lock position across beats`.
7. Export PNG and all beats ZIP, reopen saved project, export editable backup, then import it on a clean profile.

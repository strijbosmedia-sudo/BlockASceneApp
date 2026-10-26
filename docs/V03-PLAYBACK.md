# Block4Film 0.3.0: Beat playback and export

The same pure `app/playback.js` engine drives interactive preview and WebM export. No project state is mutated during playback.

## User interaction

- Play/Pause button in the beat strip. Space keyboard shortcut. Playback starts at the selected beat and continues through the last beat.
- Each beat holds for 2.5 seconds and each inter-beat transition lasts 950ms at 1x. The final beat has a hold, not a fade out.
- Speed: 0.5, 0.75, 1, 1.5, 2x. Hold: 2, 2.5, 3, 5 seconds. Modes: smooth movement, colored crossfade, greyscale ghost crossfade.
- Speed change rescales current clock position to avoid visual jumps.
- Moving camera setups with `motion` tracks follow Pos 1 → Pos 2 during the hold in Smooth move mode; transitions to next beat use the previous endpoint.
- Changes are scoped to a project as `project.playback`, not tied to a beat; v0.2 saved data remains readable.
- During preview, movement paths and manual selection handles are intentionally suppressed. Interactions stop playback before editing.

## Render/export

- The editor and the video renderer call `frameAt()` with the same settings; camera moves, fades, opacity, lens interpolations and angle changes use the same positions.
- `MediaRecorder` / canvas `captureStream()` writes WebM at 1280×814, 30 fps target; actual frame rate depends on device and browser. No remote render service or MP4 encoder is bundled.
- Export includes the imported floor-plan image and set objects.
- The project model is still v2; the optional `outline` attribute and `playback` settings have default values and require no breaking migration.

## Validation

Run `npm run test:model`. Playback timing, frame interpolation, camera move interpolation, final-frame behavior and outline persistence are tested in Node. Real-device video encoding should be checked on the Windows portable build before relying on exports for production.

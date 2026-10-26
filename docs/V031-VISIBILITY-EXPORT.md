# Block4Film v0.3.1: visibility & export behavior

## Actor and camera beat matrix
- Selecting an actor or camera shows one checkbox for every beat, in scene order.
- Existing per-beat `visible` state is changed independently. A missing entry is unchecked.
- When a missing entry is enabled, `B4Model.setBeatVisibility` clones the nearest available state, preserving the identity, color and global outline. It does not change neighboring beats.
- Newly created beats automatically appear after a rerender of the inspector.

## Editor visibility
- Top bar ghost shortcut switches between Off and the last selected ghost mode.
- Layers panel preserves Off / Adjacent / All mode and remains separate from the export settings.
- Layers and object properties are presented on opposite sides on desktop; mobile has one panel at a time.

## Exports
Stored per project under `exportPrefs` (missing preferences use these defaults):

| Key | Default | Behavior |
| --- | --- | --- |
| `imageGhosts` | false | Draw adjacent beat ghosts in current PNG and ZIP sequence |
| `videoGhosts` | false | Draw adjacent beat ghosts in the animated WebM |
| `cones` | true | Render field-of-view cones in PNG and animated WebM |
| `paths` | false | Draw dotted beat-to-beat paths in PNG and animated WebM |

Preview ghosting and export ghosting are separate. Playback speed and hold duration continue to be honored by WebM. Export remains WebM until an independently verified MP4 encoding path is available.

## Tests
Run `npm run test:model` to test state migration, palette uniqueness, beat-level visibility and playback interpolation. Inline-browser desktop/tablet interaction smoke tests were performed before merging.

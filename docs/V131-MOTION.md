# Block4Film 1.3.1: Tablet Movement and Keyframe Beta

This is a **beta** following stable v1.3.0. The approved cinematic UI is unchanged. Windows, macOS, Android and iOS share the new motion model, but field testing on physical touch devices is required.

## Movement
- Actor movement: **No movement, Move actor, Turn in place**
- Camera movement: **Static, Pan in place, Push/Pull, Slide, Dolly/Track**
- A selected moving actor or camera displays a draggable **final-direction handle**. This direction is interpolated while the object moves.
- A pan or turn may change direction without moving its X/Y coordinates.
- The start position is separate from the destination. Moving the start object no longer translates its destination unintentionally.

## Timed keyframes and curved movement
- Open Object Properties, choose any movement, then use **Add keyframe**.
- Multiple intermediate keyframes can be created. Each has a time (%), X, Y and direction.
- Drag keyframe diamonds on the canvas to reshape a path, and drag the selected keyframe's direction handle to rotate.
- Choose **Straight segments** or **Smooth curves** for the movement path. Smooth paths use interpolated Catmull–Rom curves between keyframes.
- Camera pan and actor turn can also use intermediate rotation keyframes while remaining in place.
- The movement path, rotations and keyframes are stored within the beat and survive project export/import.

## Creating the next beat
- The new beat begins from the **final X/Y and facing direction** of each actor and camera's preceding movement.
- Its own movement setting is **Static / No movement** by default.
- The previous beat's keyframes and movement remain unchanged.

## Tablet / pen interaction
- Tap an unselected actor/camera to select it and open Properties without moving it.
- On the **first** selection, hold for roughly 235 ms to enable dragging.
- Once an object is selected, dragging works immediately after a small motion threshold.
- Two-finger gestures continue to take precedence over object dragging.

## Acceptance checks
- Actor A: add a curved path with 2 keyframes; alter its endpoints and final facing.
- Camera 1: use Pan, rotate with the handle, then make a new beat.
- Tap a previously unselected static camera repeatedly with a stylus; its coordinates must remain unchanged.
- Move an actor's starting point while its end is fixed; the end must stay fixed.
- Close and reopen the app; motion keyframes and movement state should persist.
- Export and import a .blockascene backup to confirm compatibility.

The Windows 1.3.0 stable release is retained unchanged. This beta does not change the project file schema.

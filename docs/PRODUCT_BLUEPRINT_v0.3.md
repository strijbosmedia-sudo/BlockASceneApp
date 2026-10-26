# Block4Film
**Tagline (working):** Block a Scene. See the Whole Picture.  
**Status:** Product blueprint v0.3 | 26 October 2026

## Product promise
A quick, touch-first 2D workspace where filmmakers import an existing floor-plan image OR draw a set, block performers through beats, and plan the cameras that cover the action. Save entire projects with reusable locations, scenes, blocking beats and camera setups. Reopen, edit, back up and export the sequence as individual diagrams or a shareable slideshow video.

## Product principles
1. **Fast to start:** Import a floor-plan image and start blocking immediately, or create a room from scratch.
2. **Direct manipulation:** Place, drag, rotate, duplicate; editing works with mouse, finger and stylus.
3. **Scene-first, not diagram-first:** Actors can move through beats; cameras can cover different beats.
4. **Quiet interface:** Large canvas; contextual controls; hideable panels; minimal modal dialogs.
5. **Persistent, portable and offline-friendly:** Autosave is always on, every project reopens exactly as left, and users can back up a self-contained project file.
6. **Share the blocking, not just the diagram:** Export one readable still per beat or a simple scene-progression slideshow without requiring a video editor.

## Not building initially
3D rendering, CAD-grade architecture, photorealistic lighting simulation, script analysis, scheduling, call sheets, user accounts, multiuser realtime sync, generative AI, and native OS integrations.

## Core concept and relationships
- **Project**: saved workspace containing reusable sets, scenes, referenced image assets, metadata and export preferences; appears in a searchable project library.
- **Set**: physical environment with optional background image(s), walls, doors, windows, furniture, labels and measurement scale. Doesn't change between beats unless intentionally edited. Image underlays live at set level, not on individual beats.
- **Scene**: references one set and contains actors, beats, camera setups and shots.
- **Actor**: one persistent actor entity per scene, with pose/position/orientation at different beats.
- **Beat**: an ordered action state or keyframe. Transition between adjacent beats may show actor paths and play interpolated movement.
- **Camera setup**: a named camera configuration with position, heading, focal length, sensor size, optional path and notes; independent from scene beats.
- **Shot**: a piece of planned coverage tied to a camera setup and one beat, range of beats, or explicit scene-time interval.

**Crucial rules**
- Switching beats should never duplicate the physical set.
- Editing a camera setup must not silently alter other camera setups.
- Selecting a shot should display its camera setup and the relevant beat or interval.
- Scene objects must have stable IDs; diagrams are rendered projections of structured data, not the data itself.
- Actor motion has explicit start/end pose and path, with a clear distinction between instantaneous edits and animation.

## Primary workflow (ideal v0.1)
1. Create a project from the project library or reopen a recent project (with auto-restored last-opened scene and view).
2. Choose **Import floor plan** (PNG, JPEG, WebP) or **Blank set**.
3. If imported: position, rotate, set opacity and lock the image; optionally calibrate scale with two points and a known distance. If blank: draw walls and arrange furniture.
4. Create a scene on that set; place two actors.
5. Add and aim a camera with horizontal field-of-view cone.
6. Duplicate the initial beat; reposition actors and draw movement paths.
7. Create a second camera setup; switch setups without losing actor blocking.
8. Create shots and link them to camera setups and beats.
9. Changes autosave offline. Closing and reopening restores the full project including the current scene, selected beat, cameras and background images.
10. Export (a) current view as PNG, (b) one PNG for each blocking beat as a named ZIP, (c) a slideshow video through the supported local encoder, or (d) a complete portable project package for backup and transfer.

## Editor layout
**Desktop:** Project library screen (new/recent/search/duplicate/rename/backup), then editor: top strip (project, scene, undo/redo, export), left expandable object library, central canvas, right contextual inspector, bottom beat strip and camera/shot switcher.

**Tablet landscape:** Touch-friendly project library cards, then fullscreen canvas, compact floating tool dock, bottom beat strip, collapsible camera setup drawer, inspectors in a bottom sheet or right-hand popover. Never depend on hovering or keyboard.

**Visual language:** restrained cinematic dark mode, neutral layers, colored actor markers and camera/FOV overlays, high contrast on selections, accessible minimum 44px touch targets. Avoid heavy gradients and ornamental UI.

**Quick-start entry:** “New set” shows two equally prominent actions: **Import floor plan** and **Start blank**. Import also remains available later from the Set panel.

## Input and interaction rules
| Action | Desktop | Tablet |
|---|---|---|
| Pan | Space+drag / hand tool | Two-finger drag |
| Zoom | Trackpad / mouse wheel centered on pointer | Pinch centered between fingers |
| Select | Click | Tap |
| Multi-select | Shift-click / selection rectangle | Multi-select tool, tap objects |
| Move selected object | Drag | One-finger drag |
| Rotate | Handle / precise inspector field | Large rotation handle / inspector |
| Context actions | Right-click or inspector | Tap context button or long press |
| Add objects | Toolbar or drag from library | Floating add menu or tap from library |
| Undo / redo | Keyboard shortcuts, toolbar | Always-visible toolbar actions |
| Change beat | Click beat | Tap / swipe beat strip (not canvas) |

Input gestures must not compete: two-finger navigation wins over object dragging; selection must not jump when a second touch enters. Test on actual iPad/Android tablet early.

## Feature scope
### P0: First genuinely usable prototype
- Project library: create, name, browse, rename, duplicate, delete with confirmation, and open saved projects
- Canvas zoom/pan, snap-to-grid, select/move/rotate/delete/duplicate
- Import PNG/JPEG/WebP as a set-level background, including drag-and-drop (desktop) and file picker (all devices)
- Move, rotate, scale-to-fit, adjust opacity, show/hide and lock the image underlay
- Two-point scale calibration: mark two points on the imported plan, enter the real-world distance, and apply the calibrated scale to the set
- Walls as line segments, doors/windows as wall-aware or simple anchored objects, furniture rectangles, labels
- Actors with persistent IDs and visible heading
- Beat add, duplicate, reorder, switch, actor position per beat
- One or more camera setups with adjustable position, heading and lens
- Horizontal field-of-view visualization using configurable sensor width
- Shot records referencing camera setup and beat(s)
- Undo/redo, transactional autosave via IndexedDB with visible Saved/Saving/Error state and crash-safe recovery
- Restore current project, set, scene, beat, camera selection and document content after a complete app restart
- Portable full-project export/import as a ZIP container with versioned JSON manifest and all referenced images; active diagram PNG
- **Export each blocking beat as an individual PNG in an ordered ZIP** with consistent framing, legible beat number/title and selectable overlays
- **Export a simple slideshow video** of ordered beats with adjustable seconds per beat, a scene title overlay and cuts; detect available video format at runtime (MP4 preferred when supported, otherwise supported alternatives)
- Responsive export dialogs and progress/cancel behavior on tablet and desktop
- Responsive desktop and tablet layouts; functional multitouch

### P1: Production-friendly v0.2
- Animated actor movement and editable path handles with playback speed
- Camera moves between keyframes
- Numbered shot list, lens/frame/notes, coverage filters
- Multiple set templates, grouped objects, measurement tool, aligned walls
- PDF report export, annotations, selectable layers, camera and actor visibility filters
- Multiple background images, cropping and advanced image alignment / perspective correction

### P2: Post-MVP
- Multi-device sync/account, shared projects, comments
- Rich camera metadata and presets, lighting instruments/modifiers
- Script links, storyboard/reference images, print templates
- Native installation/pencil refinements and optional 3D view only if validated


## Imported floor plans: core workflow (MVP, not later)
**User story:** “I already have a floor plan image. I want to load it and start positioning my actors and cameras immediately.”

1. **Import:** Use a visible Import Floor Plan button, file picker on desktop/tablet, or drag-and-drop on desktop. Accept PNG, JPEG and WebP; gracefully report unsupported/corrupt files. PDF pages are a later enhancement unless a lightweight PDF-to-image path proves straightforward.
2. **Place:** Fit the image to the current viewport without stretching it. Allow move, rotate and proportional resize; preserve original aspect ratio. Provide an easy Reset/Fit command.
3. **Calibrate:** Optional but prominently available. Tap/click two points corresponding to a known real-world distance (e.g. the width of a door or a measured wall), type that length in meters or feet, and calculate image-to-world scale. If skipped, show “Uncalibrated” rather than implying precise distance or camera FOV coverage.
4. **Keep it out of the way:** The underlay sits beneath furniture, walls, actors, cameras, movement paths and annotations. Give it its own Background section with an opacity slider (e.g. 20-100%), visibility toggle and lock switch; lock by default after import. Locked backgrounds cannot be accidentally selected or dragged while blocking.
5. **Reuse:** Store the image on the **set**, so the same floor plan is present through every beat, shot and camera setup, and every scene that references that set.
6. **Work offline:** Persist the image bytes as an IndexedDB Blob/asset record, not as a fragile object URL or a base64 string inside localStorage. Persist only asset references and transforms in the set document. Revoke temporary object URLs when done.
7. **Back up correctly:** Project export must include referenced image assets (e.g. a ZIP with manifest JSON and image files); importing that package restores background images on another device. Plain JSON export without images should be clearly labeled as a data-only option, never silently drop the source image.
8. **Export cleanly:** Diagram PNG includes the visible imported floor plan unless the user has hidden its layer. A future export option can remove background images for a clean crew-facing diagram.

**Important geometry rule:** Every editor object has coordinates in real-world units; imported imagery has its own pixel dimensions plus a transform into the shared set coordinate system. Do not store actors/cameras as positions relative to the image's raw pixels. Moving or rescaling an image must not silently move existing actors.

**Touch acceptance test:** On a tablet, import a photographed floor plan from Files, fit it, calibrate a 4-meter wall with two taps, lock the background, add two actors and two cameras, switch beats, close and reopen offline, and verify everything persists.

## Project library, saving and reopening: core workflow (MVP)
**User story:** “I have several productions. I want to reopen any film, find its locations and scenes, and continue exactly where I left off.”

### Project library
- Landing page shows **Recent Projects** cards with thumbnail, project title, last modified, count of scenes and locations, and clearly visible **New Project**, **Open**, and **Import Project**.
- Searching, renaming, duplicating, and deleting projects should be simple. Deleting requires confirmation and offers a recoverable trash/recently deleted mechanism if feasible.
- Inside a project, show separate, clearly named **Locations/Sets** and **Scenes**. A set can be shared across several scenes; a scene references one set and owns its beats, actors, cameras and planned shots.
- Projects may contain several imported floor-plan images and drawings, all preserved when reopened.
- Remember the last active project, scene, selected beat, selected camera setup, and viewport when useful. The actual model must never depend on ephemeral UI state.

### Saving and reliability
- **Autosave by default:** Persist each meaningful edit as an atomic document/asset operation, coalesce high-frequency drag movements, and indicate `Saving...`, `Saved`, or `Save failed` in the UI. Flush pending changes when possible on navigation/page hide but do **not** rely solely on unload handlers.
- **Local-first storage:** IndexedDB (Dexie) keeps structured documents and source-image Blobs offline. Store schema version, IDs, modified times, and asset references; never put a whole project or images into localStorage.
- **Recovery:** Validate every document on load, handle schema migrations, avoid replacing a good save with a partially-written document, provide a visible recovery/error path.
- **Backup and device transfer:** Offer **Export Project** as a `.block4film` package (ZIP internally) containing `manifest.json`, scene/set documents, thumbnails, and original image files. **Import Project** reconstructs all IDs and references, or remaps on duplication, without broken backgrounds.
- **Don't imply sync:** Saving on a desktop does NOT automatically place a project on a tablet. Until optional cloud sync ships, use export/import of project files for transfers. Explain this in onboarding.
- **Browser storage caveat:** Browsers can evict best-effort local data. Where supported, request persistent storage at an appropriate moment, but still encourage downloadable project backups. Never label browser-only storage a guaranteed backup.

## Image-sequence and slideshow export: core workflow (MVP)
**User story:** “I blocked a scene across several beats. I want to hand my cast or crew a frame-by-frame visual guide, or quickly play it as a slideshow video.”

### Export dialog
1. **What to export:** Current beat / All beats / Selected beat range / Selected shots (shots require explicit beat-to-camera mapping).
2. **Format:** Single PNG, **PNG sequence ZIP**, or **Slideshow video**. The image sequence and slideshow are both explicit release requirements.
3. **Framing:** Consistent set bounds across exported frames, or user-defined framing; avoid camera-view jumps between beats. Resolution presets such as 1920×1080 landscape and 1080×1080 square, with customizable margin.
4. **Annotations:** Include/exclude labels, beat number/name, actors, cameras, FOV cones, arrows/movement trails, and background floor-plan imagery. Default to a clean, readable crew-facing diagram.
5. **Camera coverage:** For scene beats, use the chosen camera setup or an overview showing all relevant cameras. Do **not** arbitrarily auto-assign a camera setup to each beat; the app must let users specify coverage.
6. **Slideshow timing:** Simple cuts between holds of adjustable duration (default e.g. 2 seconds per beat), optionally show beat names and a brief opening title. No automatic animated actor movement is required for the first slideshow release.
7. **Output naming:** Example `Scene_04_The_Confrontation_Beat_01_Entrance.png` ... `Beat_04_Exit.png`; stable order, safe filenames. Provide export progress and an actionable failure message.

### Rendering and platform strategy
- Create **one deterministic offscreen scene renderer** that accepts project + set + scene + beat + camera/overlay settings + viewport and produces an image bitmap. The same renderer feeds on-screen previews, PNG exports, thumbnails, and slideshow frames.
- Wait for background image decoding and fonts before snapshotting; avoid tainted canvas sources; consider device pixel ratios and large images.
- PNG sequence is the safest cross-device baseline: render each selected beat, then ZIP the PNGs and a short index/manifest file.
- For slideshow video, draw each still into an export canvas for its specified duration, encode using capability-tested browser APIs. Check supported MIME types at runtime (e.g. `MediaRecorder.isTypeSupported`) rather than promising MP4 everywhere. Provide WebM or another viable format when available. If unsupported, explain and offer the image ZIP. Consider a more robust MP4 encoder in a later release after testing target tablets.
- Videos show step-by-step **held diagrams**, not cinematic camera-view animation or movement interpolation. Add smooth actor/path animation separately in the playback milestone.
- Exports should not alter the saved editor state. Test consistent positioning, background opacity, labels, line weights and legibility in every exported frame.

### Round-trip acceptance test
Create **Project A** with two locations and three scenes, including one imported floor plan and one hand-built set. Scene 2 has five beats and three camera setups. Close the browser, reopen offline, verify project/scene/beat selection and imported images. Export all five beats: ZIP contains five correctly named PNGs in order. Export a 10-second slideshow at 2 seconds/beat and verify the frames, labels and composition. Export `.block4film`, import on a tablet, and verify the project is fully editable.

## Camera realism
Scene coordinates are in world units (meters), not pixels. Display top-view horizontal FOV as `2 * atan(sensorWidth / (2 * focalLength))`. Default to a 36 mm horizontal sensor dimension for a full-frame preset and allow changes; camera crop, aspect ratio and lens metadata need clear labeling. FOV cone is a planning approximation, not an accurate rendered image.

## Proposed frontend architecture
- React + TypeScript + Vite
- React Konva for 2D canvas and hit testing
- Zustand for transient editor and interaction state
- Dexie / IndexedDB for local-first persisted project documents and original image Blobs
- Tailwind + shadcn/ui for surrounding UI
- Zod for document validation and schema versioning
- ZIP packaging library (e.g. fflate or JSZip) for complete-project backups and PNG sequence exports
- Dedicated offscreen rendering/export service and runtime-checked media encoding for slideshow videos
- vite-plugin-pwa for installable, offline-ready browser distribution
- Capacitor may wrap mobile/tablet versions; Tauri may wrap macOS/Windows later. These are deployment options, not first-prototype dependencies.

### Suggested source layout
```
src/
  app/                 # routes and application shell
  domain/              # project/set/scene/beat/camera/shot types and pure operations
  editor/
    canvas/            # Konva layers and visual objects
    tools/             # select, pan, wall, actor, camera, path tools
    gestures/          # pointer/touch coordination
    timeline/          # beats, shots and cameras
    inspector/         # contextual property forms
    commands/          # undoable actions
  projects/            # recent projects, thumbnails, navigation
  export/              # offscreen diagrams, PNG batch, video, zip packages
  storage/             # Dexie schema, import/export, migrations
  components/          # generic UI
  examples/            # living room example scene
```

## Minimal domain types (sketch, not final schema)
```ts
type Id = string;
type Vec2 = { x: number; y: number }; // world meters
type Pose = { position: Vec2; rotationDeg: number };

type Project = {
  id: Id; title: string; setIds: Id[]; sceneIds: Id[];
  createdAt: string; updatedAt: string; schemaVersion: number;
  thumbnailAssetId?: Id;
};
type FloorPlanUnderlay = {
  id: Id; assetId: Id; visible: boolean; locked: boolean; opacity: number;
  origin: Vec2; rotationDeg: number; metersPerPixel: number | null;
};
type SetLocation = {
  id: Id; title: string; objects: SetObject[]; underlays: FloorPlanUnderlay[];
};
// Binary assets (image files) live in IndexedDB keyed by assetId, not in JSON state.
type Scene = {
  id: Id; setId: Id; title: string;
  actors: Actor[]; beats: Beat[];
  cameraSetups: CameraSetup[]; shots: Shot[];
};
type Beat = {
  id: Id; name: string; order: number;
  actorPoses: Record<Id, Pose>;
  movementPaths?: Record<Id, Vec2[]>;
};
type CameraSetup = {
  id: Id; label: string; pose: Pose;
  focalLengthMm: number; sensorWidthMm: number;
};
type Shot = {
  id: Id; label: string; cameraSetupId: Id;
  startBeatId: Id; endBeatId?: Id; notes?: string;
};
type ExportSettings = {
  sceneId: Id;
  beatIds: Id[]; // explicit export order
  coverage: { type: 'overview' } | { type: 'setup'; cameraSetupId: Id };
  backgroundVisible: boolean;
  showActorNames: boolean; showCameraCones: boolean; showMovementArrows: boolean;
  widthPx: number; heightPx: number;
  secondsPerBeat: number;
};
```
All schemas should be versioned. Decide actor-pose inheritance carefully: when a beat is added, explicitly copy the preceding positions as the starting state. Don't mutate the previous beat.

## Development milestones (deliver complete vertical slices)
**Slice A: Touch-ready canvas + floor-plan import**  
Panning, pinch zoom, one-finger placement/drag, selection/rotation; import/fit/opacity/lock a floor-plan image; wall and furniture primitives; demo room. Test desktop and tablet.

**Slice B: Scene model**  
Actors, beats, duplicate/switch beats, per-beat positions and serialized persistence; undo/redo.

**Slice C: Camera and coverage**  
Camera configurations, FOV, setup switcher, shot-to-beat association.

**Slice D: Project library & safety**  
Create/rename/search/reopen projects, autosave and resume exact working context, preserve image assets, portable `.block4film` ZIP export/import, storage and error-state UX.

**Slice E: Export frames and slideshow**  
Offscreen beat rendering, current PNG, all-beats PNG ZIP, slideshow video with hold duration, titles and cuts. Test on desktop and a real tablet. Do not require actor animation yet.

**Slice F (next iteration): Movement playback**  
Actor paths, interpolated poses, timeline playhead, shot selection highlighting.

## Definition of done for first release
A filmmaker can import an existing living-room floor-plan image (or draw a room), calibrate and lock the background, add two actors, make four beats, block both actors through the beats, plan a master and two close-ups, attach shots to beats, switch freely between time and coverage, save/reopen offline with the image intact, and export five ordered PNG beat diagrams plus a basic slideshow video. The filmmaker can close and reopen that project, and transfer the package between desktop and tablet without broken images. All major tasks work on mouse and touch with no hover-only features and no lost data.

## Early failure risks
- Confusing beat/state edits vs set edits: use mode and contextual cues.
- Losing work: atomic autosave, explicit project backups, migration checks, recovery tests, proper failed-save feedback, storage persistence awareness.
- Touch conflict and tiny handles: multimodal gesture engine, big hit targets, real device tests.
- Trying to simulate movement before stable beat state exists: implement snapshots/keyframes first.
- Misleading geometry: label sensor and FOV assumptions, distinguish calibrated from uncalibrated image underlays.
- Imported image vanishes after reload or export: persist Blob records, package referenced assets, automated round-trip tests.
- Accidental background dragging: default lock, dedicated background controls, ignore locked image in hit-testing.
- Broken or inconsistent export frames: one deterministic offscreen renderer, stable framing, asset/font readiness, tests on different screen ratios.
- Video support surprises: check runtime format support and test tablet encoders; always retain PNG-sequence export.
- Scope creep: do not add lighting or AI until the base workflow feels excellent.

## One sample scene for all demos and tests
**The Confrontation:** A small apartment living room, sofa, table, door, window, two actors. Beats: (1) Entrance, (2) Approach, (3) Confrontation, (4) Exit. Cameras: (A) Master 35 mm, (B) Over-shoulder 50 mm, (C) Reverse 50 mm. Shots associate with the appropriate beats. Use this same fixture in automated tests and screenshots.

## First vibe-coding task
Build **Slice A only**. Focus on a responsive shell with one professional-feeling 2D floor-plan canvas. Include a working **Import Floor Plan** action for PNG/JPEG/WebP, background opacity and lock controls, cursor vs touch behavior, real object editing, and the seeded living room. No backend, accounts, AI or fake buttons. Finish with instructions to run and a short hands-on test checklist.

## Open product decisions to validate with actual prototype
1. Does an explicit Beat timeline feel better than a continuous animated timeline as the initial editing mode? Default: beats first, animation later.
2. Is the camera setup switcher best as bottom tabs or a separate horizontal strip? Try both on tablet.
3. For walls, do people prefer free lines, linked room corners, or presets? Start with line segments and room templates.
4. Should camera setups be reusable across multiple scenes on the same set? Default: scene-owned first, cloneable later.
5. Which tablet sizes and stylus types are important for hands-on testing?
6. Default slideshow export: 2-second hold per beat, hard cuts, overview of all relevant cameras, 16:9 composition. Validate after using it on a real scene.
7. Project package extension and sharing workflow: `.block4film` ZIP package in v1, cloud sync later.

**Naming note:** Block4Film and "Block a Scene" are working names; web search isn't a trademark or domain clearance.

## v0.3 changes (26 October 2026)
- Promoted **saved projects / project library / offline reopen** into explicit first-release requirements.
- Defined project hierarchy and reusable sets across multiple scenes.
- Added full-fidelity project package export/import with original floor-plan assets.
- Promoted **one image per beat** and **simple slideshow video** into explicit first-release requirements.
- Added export dialogs, consistent offscreen rendering, supported video-format detection, and acceptance tests.
- Explicitly separated local saving from future cross-device cloud syncing.
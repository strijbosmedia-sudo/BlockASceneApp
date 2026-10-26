# BlockaScene

An offline-first, touch-ready film blocking prototype. Plan a set, position actors, create scene beats, switch cameras, and export blocking diagrams.

## Try it right now (no installation)

Open `app/index.html` in Chromium or Edge, or serve the folder locally:

```bash
python -m http.server 8000
# Then open http://localhost:8000/app/
```

The first launch creates a **Demo Film** project with a sample living room, three action beats and two camera setups. All sample visual assets live in `app/assets`.

## Windows portable EXE

GitHub Actions automatically builds `BlockaScene-0.1.0-Portable.exe` from pushes to `main`. In GitHub open **Actions → Build Windows portable EXE → latest successful run → Artifacts → BlockaScene-Windows-Portable**. Download the artifact ZIP, extract it and run the EXE. Windows SmartScreen may warn because this prototype is unsigned. Use it only if you trust the source and build.

To build locally on Windows with Node.js 22+:

```powershell
npm install
npm run dist:win
# The portable executable is created in dist/
```

`npm start` opens the Electron development window after `npm install`.

## What works in v0.1

- Multiple projects and editable scenes; multiple reusable floor plans per project
- Imported PNG/JPEG/WebP floor plan image as a persistent set background (up to 12 MB)
- Add and position set objects, actors, and cameras by clicking or tapping the canvas
- Separate beats with independently editable actor positions
- Multiple selectable camera setups and physically based horizontal field-of-view cones
- Mouse wheel zoom / mouse pan, direct dragging, two-finger touch pinch-zoom and pan
- Offline autosave with IndexedDB (local to the particular app/browser)
- Editable `.blockascene` project import/export including imported background image data
- Current-beat PNG export, all-beats PNG ZIP export, basic WebM slideshow
- Undo/redo for most scene edits (limited history)

## Important limitations

This is a **working first prototype**, not yet the complete envisioned product. There is no cloud sync, no Android package, no playback interpolation, no portable MP4 encoder, no physically measured set calibration, and no advanced room-building tools. The slideshow is a WebM video with static beats and 2 seconds per beat, subject to MediaRecorder support. Autosaved data is specific to the application/browser environment: desktop builds and browser instances do **not** automatically share their databases. Always export `.blockascene` backup files for important work. Imported photos are kept locally and included in backups, not uploaded. The Windows app is unsigned.

## Files

- `app/index.html`, `styles.css`, `app.js`: editor and all interactions
- `app/assets/`: bundled original vector graphics and sample floor plan
- `desktop/main.cjs`: minimal Electron desktop shell with Node integration disabled
- `.github/workflows/windows-portable.yml`: automated Windows executable build
- `docs/PLAN.md`: prioritized build roadmap

## Roadmap

v0.2: better wall and furniture manipulation; background scale and calibration; property panel gesture refinements and tests.

v0.3: camera-to-beat shot assignments, shot list, movement drawing and undo/redo stabilization.

v0.4: tablet PWA testing and Capacitor Android packaging; optional MP4 output through platform encoders.

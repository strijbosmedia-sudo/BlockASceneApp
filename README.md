# BlockaScene v0.2

**Block a scene, see the whole picture.** A portable, offline-first floor-plan and blocking editor for Windows, desktop browsers and touch tablets.

## What is implemented

- Project library with offline autosave and editable `.blockascene` backups.
- Import PNG, JPG or WebP floor plans as locked set backgrounds.
- Add walls, doors, furniture and renameable basic lighting/rigging symbols.
- Add arbitrary numbers of actors and cameras. Each receives a stable, vivid project-wide color, name and visible letter/number.
- Save actor and camera positions, orientations, visibility and camera focal length **separately for each beat**.
- Drag objects to move, drag the selected object's circular ring to rotate, drag a camera move's endpoint to position its end.
- Faded previous/next ghost positions, dotted arrows for between-beat moves, solid arrows for push/slide/track camera moves within a beat.
- Touch-friendly UI with a minimal near-black theme, object roster, contextual property panel and scene beat strip.
- Export active beat PNG, all beats PNG ZIP, basic WebM slideshow and an editable project file.

No AI, 3D, or simulated advanced lighting. Cross-device live sync is not yet implemented.

## Windows portable download

Open the repository's **Actions** tab, choose the latest successful **Build Windows portable EXE** workflow run on `main`, and download `BlockaScene-Windows-Portable` under **Artifacts**. Extract and launch the `.exe`. GitHub sign-in may be required. The unsigned test executable may trigger a Windows security prompt.

## Source development

Node.js 22 is recommended for Electron packaging:

```bash
npm install
npm run start       # Launch Electron
npm run test:model  # Unit tests for schema and project colors
npm run dist:win    # Package portable Windows executable (on Windows)
```

For browser testing, host the repository folder with a static web server and open `/app/index.html`. The browser application does not require package installation. The Python test environment may use a minimal server such as `python -m http.server 8000`.

## Notes for existing v0.1 users

Export a project backup from v0.1 before updating. v0.2 uses the same local IndexedDB store to load existing saved projects; it migrates legacy camera setups into per-beat camera snapshots. After migration, newly exported `.blockascene` files use schema v2. Keep your original backup for rollback because v0.1 cannot read a v0.2 project file.

## Layout and editing

- **Left floating project drawer:** scenes, sets, backgrounds and exports.
- **Tool rail:** select, pan, actor, camera, wall, door, furniture and simple equipment.
- **Canvas:** direct drag/rotate interactions, camera field of view and movement paths. Wheel zoom or two-finger pan/pinch.
- **Beat strip:** select, insert, rename or delete beats. New beat inherits the current beat's states.
- **Layers button:** toggle camera cones, dotted lines, solid camera moves, ghost modes, and select hidden cameras/actors from the roster.
- **Property panel:** color, orientation, names, position, visibility, camera lens and start/end track movement.

See `docs/V02-REDESIGN.md` for behavior details and `docs/PRODUCT_BLUEPRINT_v0.3.md` for the original vision.

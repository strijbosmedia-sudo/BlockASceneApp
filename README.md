# Block4Film v0.3.2

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

### v0.3.1: Beat visibility and export appearance

- **Quick editor ghost toggle** in the top bar. The Layers panel still offers Off, Previous + Next, and All beats.
- Actor and camera inspectors now show **one checkbox per beat**. Toggling an absent object into an earlier beat restores its nearest saved state; updates do not affect other beats. New beats appear in the list automatically.
- **21-color** preset palette fills the 7-column grid. Object identities retain their project-wide colors.
- **Layers** opens on the left, away from the right-hand object properties. On small screens it switches panels instead of stacking them.
- A separate **Export settings** panel stores preferences with the project: adjacent beat ghosts in PNG/ZIP, adjacent ghosts in WebM, camera cones in both formats, and dotted paths in exports.
- Camera cones are drawn during animated playback and in rendered WebM frames, not only on static PNGs.
- Existing `.blockascene` project data remains schema v2, with no incompatible migration.

### v0.3.0: Animated scene playback

- Play/Pause in the beat timeline, also available with **Space**.
- The scene holds for **2.5 seconds per beat** by default, with smooth 0.95-second transitions.
- Playback speed options: **0.5×, 0.75×, 1×, 1.5×, 2×**. Beat hold choices: **2, 2.5, 3, 5 seconds**.
- Transition styles: **Smooth move** (actors/cameras animate and camera track moves play during each hold), **Color fade**, and **Ghost fade**.
- An **Export video** button creates an animated **WebM** with the same selected speed and transition settings. Requires a browser/Electron environment supporting `MediaRecorder` with WebM; MP4 is not yet supported.
- Actors and cameras offer an independent **Black / White symbol outline** selector, stored by identity for all beats and scene instances.

No AI, 3D, or simulated advanced lighting. Cross-device live sync is not yet implemented.

## Windows portable download

Open the repository's **Actions** tab, choose the latest successful **Build Windows portable EXE** workflow run on `main`, and download `Block4Film-Windows-Portable` under **Artifacts**. Extract and launch the `.exe`. GitHub sign-in may be required. The unsigned test executable may trigger a Windows security prompt.

## Source development

Node.js 22 is recommended for Electron packaging:

```bash
npm install
npm run start       # Launch Electron
npm run test:model  # Unit tests for schema, project colors and playback timing
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

## v0.2.1 refinement (Block4Film branding)

- Minimal black startup splash with white `Block4Film` wordmark. The editor and the application title also use this text-only branding.
- Top-left menu is a single hamburger button when closed. The opened drawer is clearly titled Menu.
- Mouse: wheel to zoom, hold **middle mouse button** and drag to pan (in any tool), or select the existing Pan tool and drag with the primary button.
- Touch: use **two fingers** to pan and pinch zoom the floor plan. One finger continues to select, rotate, and move objects. In placing tools, an object is added on finger release, preventing accidental creation during a two-finger gesture.
- Existing v0.2 project data and the old Windows Electron data folder are preserved. Back up projects before upgrading.
- Less panel chrome and simpler, flatter workspace surfaces; Select and Pan remain available in the toolbar.

The GitHub repository name intentionally remains `BlockASceneApp` for link compatibility. The app presented to users is now **Block4Film**.

## v0.3.2 visual identity and navigation

- Original designer-supplied vector icon: `app/assets/Block4Film-Icon.svg`.
- Original designer-supplied vector wordmark: `app/assets/Block4Film-Wordmark.svg`.
- Black startup screen displays both artwork files and respects reduced motion.
- `npm run icons` generates the multi-size Windows executable `.ico` and matching window `.png` from the SVG, and runs automatically before Electron and Windows packaging.
- The top-bar Home button goes directly to All Projects, leaving Menu unchanged.
- Existing project storage and the application's identity remain unchanged.

**Portable EXE:** The app runs on compatible Windows PCs without an installer, but projects remain stored locally on each machine. Use `.blockascene` export/import to transfer them.

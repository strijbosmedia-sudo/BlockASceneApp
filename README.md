# Block4Film v1.1.1 (Functional Fixes)

**Block a scene, see the whole picture.** A portable, offline-first floor-plan and blocking editor currently developed and distributed for Windows.

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

## Windows v1 polish
- Red brand accent in the '4', primary actions and active selections; actor/camera colors stay independent.
- Pan uses a monochrome SVG hand.
- Startup splash is visible for at least 1.75 seconds.
- Offline manual with seven clickable chapters appears in editor Menu and on the project dashboard.
- Windows v1 is the release checkpoint; macOS and Android APK packaging follow later.

## Windows-only development (October 2026)

We are intentionally pausing macOS and Android distribution while refining the Windows editor.

- Windows is the **only supported build and download target**. All scene-blocking features, touch support on Windows, offline autosave, and `.blockascene` project backups remain intact.
- Download the latest Windows-only EXE from [GitHub Releases](https://github.com/strijbosmedia-sudo/BlockASceneApp/releases/latest) or fresh builds from [Windows Actions](https://github.com/strijbosmedia-sudo/BlockASceneApp/actions/workflows/windows-portable.yml).
- The Mac/Android workflows and packaging integrations are removed from `main`, while Git history preserves their prior versions for future rebuilding.
- The old cross-platform beta release is retired **after** a new Windows-only release is successfully published, preventing loss of the working download.
- No editor data-model migration or Windows user-data directory changes are included in this update.

**Next:** collect Windows bugs and improvement requests, agree on a prioritized change log, then implement the next editor update.

## v1.1 Stage 1 functions

## F1 Project, scene and floor-plan workflows
- Project library with working three-dot and right-click/long-press actions.
- Three-level navigation: All Projects > Scenes > Scene Editor.
- Project, scene and floor plan actions: open, rename, duplicate, delete. Deletions confirm first.
- Floor plans used by deleted sets reassign to the project's remaining set. Last scene and last set cannot be deleted.

## F2 Editor workspace
- Collapsible beat strip and right utility rail for Layers and Properties.
- Either panel may float or pin beside the canvas. Pinned widths can be adjusted using the panel grip.
- Narrow widths switch between panels rather than stacking two dialogs.
- Layout settings saved locally; Reset layout available.
- Selected-object rotation dot follows the object's facing direction.

## F3 Beats and animation
- Beat context menus with Edit, Duplicate and Delete.
- Edit Beat contains the numeric hold duration, leaving timeline default controls uncluttered.
- Optional actor motion inside a beat with editable/dragged destination.
- Shared playback engine respects custom per-beat durations in preview and WebM export.

## F4 Saving and export
- Separate Save action forces immediate local storage write.
- One Export menu provides PNG, all-beat ZIP, project backup, animated WebM, and appearance settings.
- WebM Export opens options before encoding.
- Existing schema v2 and project storage paths remain unchanged.

## Acceptance
- Automated model, playback and manual tests run in CI.
- Confirm Windows EXE packaging and download.
- User should additionally smoke-test the scene editor and video export on a real Windows computer.


## v1.1.1 functional bugfix release

See [the detailed change list](docs/V111-FIXES.md).

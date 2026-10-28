# Block4Film changelog

Publisher: **strijbos.media**

## Current checkpoint — 1.4.1 stable

**Accepted by the user on October 27, 2026**, after checking the new functions and the sidebar/Properties fixes. Version 1.4.1 is the current accepted stable application baseline for real-project planning and the next period of stress testing.

**Development freeze:** collect bug notes during the user's project planning over the coming days. Make no further application, design, dependency, packaging or feature changes until the user returns with feedback and agrees the next fixes. This changelog update changes documentation only.

The accepted application code is commit [747c896](https://github.com/strijbosmedia-sudo/BlockASceneApp/commit/747c8967b5ceeec9b23f1cc498ce7d431006f312), in [PR #20](https://github.com/strijbosmedia-sudo/BlockASceneApp/pull/20). Stable acceptance records the tested application behavior; it does not itself merge the PR, publish a new release or change platform signing.

### Platform and compatibility status

- **Windows:** portable Electron application.
- **Android:** the tested tablet APK remains debug-signed. A persistent-key release workflow is prepared; production signing and same-key native upgrade validation remain separate outstanding distribution work.
- **macOS:** unsigned Intel/Apple Silicon test packages.
- **iOS:** Simulator build only.
- Projects remain offline-first, stored locally, with schema v2 **.blockascene** backups containing the whole project and its scenes.
- The approved dark cinematic design, project identities, custom previews and Windows storage location are retained.
- Previous release downloads remain available.

## 1.4.1 — October 27, 2026

### Fixed

- Clicking or tapping outside the sidebar menu closes it in Workspace, Project Overview and Scene Editor. The outside control still receives the intended action.
- Object Properties retains its scroll position whenever settings refresh for the same object. This applies to movement and path dropdowns, numeric fields, visibility checkboxes, colors and other settings, in floating and pinned panels.
- Replacing a floor-plan image resets both its saved scale and the dialog slider to the fitted 100% size.
- Automatic thumbnails use the same proportional background-fit helper as the editor and exports.
- Thumbnails reflect window styling, light modifiers/colors and saved camera-cone reach. Outdated automatic previews refresh; custom previews keep priority.
- Legacy diagonal wall/door geometry preserves its world endpoints when loading existing projects.

### Android and release preparation

- Added transparent safe-area padding around the cropped adaptive launcher artwork.
- Native Android project regeneration reapplies application version 1.4.1 and versionCode 10401.
- Prepared a manual release-APK workflow using a persistent user-controlled signing key and expected certificate fingerprint.
- Release builds reject missing signing credentials rather than falling back to debug signing.
- Windows publication requires a deliberate action, defaults to prerelease and refuses to replace existing published downloads.

### Validation

The full regression suite and real Chromium interaction checks passed. Coverage includes project import/export, replacement-image scale, window placement, rotated furniture dimensions, movement isolation, saved-project reopening, tablet layout, sidebar dismissal and Properties scroll retention across control types.

- [Windows build verification](https://github.com/strijbosmedia-sudo/BlockASceneApp/actions/runs/40594957514)
- [Android, macOS, iOS Simulator and browser verification](https://github.com/strijbosmedia-sudo/BlockASceneApp/actions/runs/40594957493)
- User acceptance confirmed after testing the new functions and UI fixes.

## 1.4.0 — Scene planning tools

- Proportional, centered floor-plan backgrounds with persisted 25–300% scale controls.
- Wall/Window picker and distinct window drawing.
- Wall, Window and Door length editing; Furniture width/height editing.
- Rotation-aware endpoint/corner resize handles.
- Adjustable camera-cone reach, with its viewing angle still derived from lens and sensor settings.
- Standard, Softbox and Spotlight lighting symbols; softbox sizes, Kelvin temperatures and custom colors.
- Cropped Block4Film Android launcher artwork and a recognizable tablet-test APK filename.

## 1.3.2 — Tablet import and layout hotfix

- Native Android/iOS document picker for .blockascene project backups.
- Improved UTF-8/BOM handling and import error messages; invalid files preserve saved projects and duplicate imports receive a new project ID.
- Repaired movement-keyframe Properties markup and bounded panel scrolling.
- Smaller destination rotation ring with the confusing center spoke removed.
- Project and floor-plan image imports subsequently confirmed working on the user's tablet.

## 1.3.1 — Movement and tablet interaction

- Actor turn-in-place and camera pan-in-place.
- Timed movement/rotation keyframes, straight paths and smooth curves.
- Draggable keyframes and final-position rotation controls.
- New beats inherit final positions/directions and start with static movement.
- Pen/touch tap-to-select and brief hold-to-move behavior.
- Moving a start position preserves its defined destination.

## 1.3.0 — Cross-platform foundation

- Stable Windows baseline and strijbos.media branding.
- macOS, Android and iOS Simulator packaging foundations.
- Native mobile export/sharing bridge.
- Optional Windows signing configuration.

## 1.2.1 — Functional polish

- Responsive Workspace tiles and corrected Properties button state.
- Back navigation between editor, scene library and Workspace.
- First-free actor letters/camera numbers and collision-safe label editing across shared identities.

## 1.2.0 — Approved visual redesign

- Unified charcoal surfaces, red accents, line icons, typography and controls.
- Redesigned Workspace, Project Overview, editor, dialogs, menus and Manual.
- Saved Beat 1 thumbnails with custom project/scene preview overrides.
- Search, sorting and grid/list library views.

## 1.1.2 — Panel layout and focus

- Reliable text-input focus and caret preservation in editing dialogs.
- Independent left/right docking and floating panels.
- Draggable/resizable panels, remembered layouts and layout reset.

## 1.1.1 — Workflow repairs

- Project, scene and floor-plan editing and context-menu repairs.
- Dialog, panel overlap/resizing and Manual navigation/scrolling fixes.

## 1.1.0 — Expanded editor workflows

- Project, scene and floor-plan management.
- Beat editing, duplication, deletion and custom hold durations.
- In-beat actor movement and shared playback/export timing.
- Explicit Save and consolidated export controls.

## 1.0.0 — Original Windows foundation

- Offline project library and local saving.
- Floor-plan import, set objects, actors, cameras and beat-based scene blocking.
- Canvas selection, movement, rotation and camera field-of-view display.
- Animated playback, PNG/ZIP/WebM exports and editable project backups.
- Portable Windows packaging and an offline Manual.

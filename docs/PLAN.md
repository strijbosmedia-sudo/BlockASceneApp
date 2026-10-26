# BlockaScene: build plan

## Philosophy
A filmmaker must be able to import a floor-plan image, place actors and cameras, move actors through a sequence of beats, and export that blocking sequence without becoming a CAD operator.

## Data concepts
- Project: owns locations (sets) and scenes.
- Set: persistent floor plan and set objects, reusable across scenes.
- Scene: actor roster, action beats, and camera setups linked to one set.
- Beat: snapshot of actors' positions and a human-readable name.
- Camera setup: position, angle, lens, sensor width, and name, selectable independently of beats.

## MVP milestone checklist
- [x] Local project dashboard
- [x] Save and reopen projects locally
- [x] Import background floor plan image
- [x] Actor placement and blocking beat snapshots
- [x] Camera positions and visual field of view
- [x] Mouse and basic multitouch interactions
- [x] Image, ZIP, WebM, and editable project export
- [x] Portable EXE build workflow config
- [ ] Windows runner successful executable build verification
- [ ] Real-device Windows and Android tablet UX tests
- [ ] Better wall, door, furniture creation/edit handles
- [ ] Actor paths and frame-by-frame movement playback
- [ ] Shot entries connecting beats and camera setups
- [ ] Image scale calibration
- [ ] Android APK packaging
- [ ] Automated browser interaction tests

## Suggested development sequence
1. Test every MVP editor interaction on Windows (mouse) and Android browser (touch).
2. Refine set construction / imported floor plan calibration and selection handles.
3. Implement shots and camera setup relationships per beat, including shot labels and printable reports.
4. Create smoother beat animation and editable motion paths.
5. Add a Capacitor project and Android Studio / GitHub Actions APK build when tablet UX is reliable.

## Packaging
- Windows: Electron + electron-builder portable build from GitHub Actions.
- Android: Capacitor builds share UI code and data model but need mobile native testing.
- Project backup is a self-contained JSON-based `.blockascene` file; treat it as a portable document, not a video export.

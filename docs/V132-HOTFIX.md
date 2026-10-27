# Block4Film 1.3.2 tablet hotfix

This is a **beta** for tablet users stress-testing Block4Film on actual productions, not a replacement for the stable 1.3.0 release.

## Project backup import
- Android and iOS: Import Project invokes the native document picker without limiting file types, so custom `.blockascene` backup files can be selected even when the device labels them as generic binary files.
- The native bridge decodes the selected file as UTF-8, then uses the same existing project migration/validation code as desktop.
- Windows/macOS still use the built-in file picker. The importer now accepts Unicode BOM and uses FileReader when File.text() fails.
- Invalid JSON and files without scene data show specific error messages and do not alter saved projects.
- Importing a duplicate project safely assigns a distinct project ID.
- The `.blockascene` export format remains unchanged.

## Motion path UX
- The direction ring at destination point 2 is smaller.
- The spoke from the center of that ring to the direction knob has been removed, avoiding confusion with the actual movement route.
- Dragging the direction knob to rotate the final pose continues working.

## Motion panel layout
- An extra closing HTML tag in the keyframe Properties section previously could break the app's layout tree.
- Keyframes now live inside a correctly matched dedicated container.
- Properties content scrolls inside the panel on narrow screens. Right-side utility controls and the Scene Beats toolbar remain outside the panel in the normal editor layout.

## On-tablet acceptance checks
1. Export a project backup, then reopen **Import Project** and select the `.blockascene` file. It should appear as a new project with scenes and blocking intact.
2. Add a motion path with several keyframes and select the actor or camera. The right utility rail must remain in place, and the Scene Beats controls must remain visible.
3. Rotate a destination marker using its small dotted circle, which has no confusing center-to-knob line.
4. Test narrow and wide tablet orientations, as well as a pinned Properties panel.

Android outputs are **debug APKs** intended for physical-device acceptance. Existing stable 1.3.0 and prior beta releases remain available.

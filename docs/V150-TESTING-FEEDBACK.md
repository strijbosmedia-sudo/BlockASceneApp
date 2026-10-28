# 1.5.0 testing feedback candidate

This candidate implements the 19-item testing brief. The accepted 1.4.1 application remains the rollback baseline. Schema v2 and whole-project `.blockascene` backups are retained; missing settings receive compatible defaults.

| Feedback | Implementation and validation |
| --- | --- |
| 1 | Direct movement switching initializes positional destinations and clears incompatible state; actor/camera mode-pair regression checks. |
| 2 | Visibility toggles keep the existing list mounted; browser checks retain exact inner and outer scroll across consecutive Beat 20+ toggles. |
| 3, 19 | Await native cached-file sharing; browser download/share fallback; error/cancellation reporting; Project Settings import/export. Roundtrip checks preserve scenes, beats, movement, visibility and libraries. |
| 4 | Editing or dragging a beat's starting position updates only its immediate predecessor's positional endpoint. Keys, starting pose and later beats remain intact; rotation-only modes are excluded. One undo restores the edit. |
| 5–9 | Mutually exclusive left/right choices; rotation-only controls; final outlined camera cone and actor facing triangle; larger in-place rings and smaller endpoint controls. Model tests cover angle direction and final orientation. |
| 10–11 | Visibility transitions fade at the visible pose. Ghosts require both states visible. All four visibility combinations are tested. |
| 12 | Repeat One fades the reset; Repeat All follows scene order and transitions last to first. Export duration stays finite. |
| 13–14 | Independently collapsible Properties sections. Below 1000px, open panels share a tabbed row below the canvas. Desktop docking preferences remain stored. Browser checks cover 768×1024, 820×1180 and 900×1200 with pinned panels. |
| 15 | Reusable colors and normalized 3/6-digit HEX. |
| 16 | Project camera defaults apply to new cameras only. Editable sensor reference sizes: Full Frame, Super 35, APS-C, Micro Four Thirds and Custom. Horizontal view angle uses sensor width. |
| 17 | Actor/camera libraries in Project Settings. Choose a preset in Properties, or Save as Project Preset. Update preset explicitly updates inherited fields; local edits create overrides. Use project preset values resets overrides without changing poses. Removing a preset preserves placed objects. Scene copies get independent instance IDs; camera overrides follow copied beats. |
| 18 | Third structure-picker option: Column. Round/square, editable size, selectable and resizable; included in saved previews. |

## Before stable acceptance

1. Export backups from the currently installed tablet app. Keep the files outside app storage.
2. Verify Windows use and Android pen/touch operation with a real project, including portrait pinning, long visibility lists and keyframe editing.
3. On Android, export using the share sheet to Files or a chosen storage app, then import the exported backup and compare the project. Also cancel sharing and test a failed destination.
4. Check rotations, final direction indicators, loop seams and visibility fades against the intended blocking.
5. Reuse presets in two scenes; edit local values and global defaults; verify scene movement remains independent.
6. Android test APKs remain debug-signed. CI debug keys may differ from the installed APK. Do not uninstall an app containing unexported projects. Production signing requires the persistent user-controlled key described in ANDROID_SIGNING.md and a same-key upgrade test.

CI success verifies compilation and automated behavior; it does not establish physical-device acceptance. No stable release is published automatically.

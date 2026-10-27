# Block4Film v1.1 functional milestone (F1–F4)

Windows remains the only supported build target. The design-system overhaul is deliberately deferred to Stage 2.

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

# Block4Film 1.1.1 Windows functional fixes

This is a follow-up to v1.1 (Stage 1). Stage 2, the visual redesign, remains deferred.

## Changes
- Creating a project now uses an in-app dialog and works even with an empty project library.
- Editing an existing project, scene or floor plan now uses a consistent modal. Rename is included in Edit; the separate Rename menu entry was removed.
- New Scene and New Floor Plan creation use in-app dialogs rather than unsupported native prompts.
- Edit Scene changes scene name and referenced floor plan without losing beats.
- Edit Floor Plan exposes the same underlying settings as the background inspector: name, image opacity, darken, replace/import image and remove image.
- Beat context menu contains only Edit, Duplicate and Delete.
- Floating Layers and Properties panels offset to avoid pinned panel areas; both pinned panels remain side by side.
- Manual title and chapter list remain stationary. Only chapter information scrolls, and each chapter remembers its last scroll position during tab switching.
- Windows-native confirmation dialogs remain for now; a styled confirmation dialog belongs to Stage 2.

## Compatibility and testing
No changes to project schema version 2, IndexedDB name, Windows user data directory or EXE build target.
Tests include new-project creation from an empty workspace, scene creation and renaming, floor plan editing, beat menu consistency and manual chapter scrolling.
Publish as a separate 1.1.1 Windows beta release without replacing stable Windows 1.0 or beta 1.1.0.

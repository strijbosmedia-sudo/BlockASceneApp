# Block4Film v1.1.2 functional polish

This release fixes final Windows Stage 1 issues before the planned Stage 2 visual redesign.

## Dialog input reliability
- Opening Edit Project or Edit Scene focuses and selects the name input.
- If another editor action redraws the dialog, it retains unsaved field values, focused field and text caret/selection.
- All existing project/scene editing and scene creation remain supported.

## Layers and Properties positioning
- Each panel has its own **Move left / Move right** button.
- Each panel independently pins to the left or right of the canvas using the existing pin button.
- Panels docked to the same side sit side by side. Opposite-side panels flank the canvas.
- Floating panels drag via the header. Dragged positions survive redraw and restarts.
- Floating panels resize using the bottom-right corner; both width and height persist.
- Docked panels resize from whichever edge faces the canvas.
- When first opened, floating panels are positioned to avoid covering existing docked panels.
- Reset layout clears persisted positions and restores right-side defaults.

## Compatibility
- Windows portable EXE only.
- Original IndexedDB location and v2 `.blockascene` format are preserved.
- Stable v1.0 and both existing v1.1 beta downloads remain published.
- Touch input is supported by Pointer Events but needs later physical device verification.
- Full charcoal-gray visual redesign and customized confirmation dialogs remain Stage 2.

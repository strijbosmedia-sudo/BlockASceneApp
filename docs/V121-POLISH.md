# Block4Film v1.2.1: Post-redesign polish

## Repairs
- Properties utility-rail button now mirrors actual panel visibility, even if the Properties panel is pinned but closed.
- The Workspace grid uses responsive auto-fill tracks with no fixed two-column override on narrow windows. Square tiles stay square, label text truncates safely and the existing list view is unchanged.
- The new Back button is present in the top toolbar: Editor > All Scenes, Project Overview > All Projects; disabled in the Workspace. The existing Home shortcut remains.

## Actor / camera IDs
- New actors use the lowest unused letter in their current scene. Examples: A,C > B and A,B > C. Letters extend beyond Z as AA, AB, etc.
- New cameras use the lowest unused positive number. Examples: 1,2 > 3 and 1,3 > 2.
- Selecting an actor/camera exposes Actor Letter / Camera Number in Object Properties.
- Numbers used by another actor/camera in any scene sharing that identity are disabled, and manual changes reject collisions.
- Changes are written to project-wide identities and every scene that references the same object, while its beat position and motion states remain untouched.
- Names remain independent editable strings, as before. ID changes do not rename objects.
- Original v2 project file format and Windows local project storage are unchanged.

## Validation
- Windows CI tests exercise ID gap reuse, collisions, renumbering across shared scenes and beats, Properties button state, toolbar Back control, CSS responsive grid and existing list-view styling.
- Existing v1.2.0 visual redesign remains intact; no new visual overhaul.
- Existing v1.0 / v1.1 / v1.2.0 downloads remain as fallbacks.

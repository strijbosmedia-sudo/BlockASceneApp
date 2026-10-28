# Block4Film 1.4.0 scene tools / 1.4.1 validation candidate

## What changed
- Imported floor plans now scale **proportionally** to fit inside the 1100 × 700 scene at 100%. Portrait, square and landscape images keep their original width-to-height ratio. The background is centered.
- In **Edit Floor Plan**, the **Floor plan scale** slider supports 25–300% of that fitted size. Object Properties on the background offers the same scale percentage. Both survive project export/import. Preview thumbnails use the same fit and scale.
- The Wall tool opens a compact **Wall / Window** picker. Window lines use a distinct cool-blue double stroke.
- **Wall, Window, Door** objects allow numeric **Length** or dragging the selected far endpoint; **Furniture** has numeric Width/Height or a selected corner handle. Resize controls remain independent of the object's rotation and position.
- When a **Camera** is selected, the small end handle of its field-of-view cone adjusts **Cone reach**, between 80 and 1100 scene units. The FOV **angle continues to derive only from Lens (mm) and Sensor (mm)**, and is not distorted by changing the length.
- **Light** equipment has **Standard, Softbox and Spotlight** modifiers. Softbox includes Small / Medium / Large / Extra large options; icon geometry changes accordingly. Light color mode can be Daylight/Kelvin, with numeric 2000–12000 K plus a slider, or Color with a color picker. Lighting values are saved with the project and drawn on the scene canvas.
- Android generated assets replace the blue Capacitor launcher image with a cropped, zoomed Block4Film logo in both legacy and adaptive launcher icons. The original white outer border is intentionally outside the crop.

## Testing
1. Import a portrait floor plan, change scale from 100% to 60% and 180%, and confirm the floor plan stays proportional.
2. Open Wall, choose Window, place it, drag its far end, and check its Length value. Try Wall and Door the same way.
3. Resize Furniture from its corner, then rotate it and resize again.
4. Select a camera and drag the tip of its view cone. Change lens/sensor and verify the cone's angle changes while the reach stays intact.
5. Place a Light, change Standard to Softbox 120 cm, then to Spotlight. Adjust Kelvin, switch to Color, and save/reopen.
6. Export a project backup before changing Android installations. Install the candidate using a compatible signing identity and check the launcher icon. Android launchers can cache old artwork; remove the old home-screen shortcut if needed.
7. Export a .blockascene backup and reimport; confirm floor-plan scale, furniture and wall dimensions, camera cone reach, and light settings all persist.

## Stability and signing
Windows publication is manual and defaults to a prerelease. Merging does not publish a stable build or replace existing downloads. Run device acceptance before choosing stable publication.

The Windows desktop build is version 1.4.0, with the previous stable v1.3.0 retained. Android is delivered as **Block4Film-1.4.1-Android-Tablet-Test.apk**, not `app-debug.apk`. The file is still a developer **debug-signed** APK until a persistent Android release signing key is available. Renaming the APK does not upgrade its signing status. Android users may need to uninstall older debug APKs if GitHub's build signature changes; export your project before doing so. Only call the Android package production-stable after persistent signing and real-tablet QA.

## Validation additions
- Thumbnail rendering uses the model's background-fit helper and matches window, light modifier/color and camera-reach settings.
- Existing diagonal structural objects retain their world endpoints during migration. Furniture dimensions, project IDs, schema v2, custom previews and Windows storage identity are preserved.
- Replacement background images start at 100% fitted scale.
- Chromium checks exercise actual import, dialog controls, set-object sizing, backup export, reopen and tablet layout. They supplement physical pen/tablet testing.
- Android native projects receive versionName 1.4.1 and versionCode 10401 after regeneration. Adaptive icons include transparent padding around the cropped mark.
- A manual signed-release candidate workflow is prepared; see [Android signing setup](ANDROID_SIGNING.md). Its execution and real-device upgrade testing remain required before Android is stable.

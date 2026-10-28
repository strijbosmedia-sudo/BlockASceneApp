# Android signed release candidates

The normal cross-platform workflow intentionally produces a clearly named debug-signed tablet test APK. It is not a production release.

## Persistent identity

Keep application ID media.strijbos.block4film and retain one user-controlled release keystore for future APK updates. Back up the keystore securely. Never put it, its passwords, or a base64 copy in source control.

Configure these repository Actions secrets using a keystore owned by the publisher:

- ANDROID_KEYSTORE_BASE64: base64-encoded release keystore.
- ANDROID_KEYSTORE_PASSWORD: keystore password.
- ANDROID_KEY_ALIAS: release key alias.
- ANDROID_KEY_PASSWORD: key password.
- ANDROID_CERT_SHA256: expected release certificate SHA-256 fingerprint, with or without colons.

Use the certificate fingerprint from your own keystore, for example through the interactive command keytool -list -v -keystore <your-keystore> -alias <your-alias>. Do not paste credentials into chat.

## Build

After the workflow is available on the default branch, run **Build signed Android release candidate** in Actions. It validates all credentials, runs regressions, regenerates Android with branding/version settings, invokes assembleRelease, verifies the APK signature against the expected fingerprint, checks application ID/version/debuggable status and uploads:

- Block4Film-1.4.1-Android.apk
- signature.txt, containing public certificate verification information.

The workflow does not publish a stable release. It removes the temporary keystore even after failure. Missing credentials cause a clear failure; the release variant never silently falls back to a debug signing key.

For a local release, run npm run mobile:android, supply ANDROID_KEYSTORE_PATH, ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_ALIAS and ANDROID_KEY_PASSWORD in your environment, then run the Android Gradle assembleRelease task. Do not put credentials on command lines or in committed Gradle files.

Native regeneration is repeatable: versionName comes from package.json; versionCode is major*10000 + minor*100 + patch, with minor and patch below 100. Version 1.4.1 uses 10401; later releases must increase this. Windows identity and storage paths are unchanged.

## Data-preservation acceptance

1. Export each important project as a .blockascene backup. Open a backup on another installation to verify it contains the expected scenes, background and movement keys.
2. Existing debug APKs may use different signing keys. A debug-to-release signing change usually prevents an in-place update. Do not uninstall an installation containing the only project copy.
3. Install the first signed candidate after backups are verified; import backups if changing signing identity required a clean installation.
4. Create a distinctive test project in the signed candidate, close and reopen it.
5. Build a later candidate with the same persistent key and increased versionCode. Install it as an update without uninstalling, then verify projects and file exports still work.
6. Test launcher masks, portrait/landscape layout, pen selection, resized/rotated objects, floor-plan scale, keyframes and native project import on the physical tablet.
7. Only promote Android after signature verification and device acceptance. Keep previous downloads.

Android's signing and version requirements are described in the official documentation:
- https://developer.android.com/studio/publish/app-signing
- https://developer.android.com/studio/publish/versioning
- https://developer.android.com/develop/ui/compose/system/icon_design_adaptive

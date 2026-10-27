# Block4Film 1.3.0 • strijbos.media • Cross-platform build guide

## Status and expectations
The existing Block4Film v1.2.1 Windows editor is the approved design and behavior baseline. v1.3.0 preserves the offline-first HTML/JS/CSS editor, IndexedDB data storage and schema v2 `.blockascene` backups. The branding/author is **strijbos.media**.

| Platform | Packaging method | Output | Expected trust and test status |
|---|---|---|---|
| Windows | Electron + electron-builder | Portable .exe | Public v1.3 release; Authenticode signing conditional on credentials |
| macOS Intel/Apple Silicon | Electron + electron-builder | DMG and ZIP | CI-generated **unsigned** packages for preliminary testing; Gatekeeper may block |
| Android | Capacitor 8 + Gradle | Debug APK | Developer/device test only, not a Google Play production-signing key |
| iOS | Capacitor 8 + Xcode | Simulator .app ZIP | Simulator testing **only**; not an installable iPhone/iPad IPA |

The macOS, Android and iOS packages must go through physical-device acceptance tests before being described as general-public quality. App Store and TestFlight submission are not yet done. Windows `v1.3.0` is a versioned baseline, not a promise that all platforms are equally validated.

### Windows: removing "Unknown publisher"
A code signing certificate must be issued by a trusted Certificate Authority or Microsoft Artifact Signing. The publisher Windows displays **comes from the certificate**, not `package.json.author`. The requested brand is `strijbos.media`; identity validation must confirm the certified publisher's **exact legal/certificate name**. Do not put a private key or password in Git history.

To use file-based Authenticode signing, configure these GitHub Actions repository secrets:
- `WIN_CSC_LINK`: a trusted Authenticode PFX/P12 certificate path or base64-encoded certificate.
- `WIN_CSC_KEY_PASSWORD`: the matching certificate password.

The release workflow passes these only to electron-builder and verifies the resulting Authenticode signature when a signing secret is present. When secrets are absent, it builds an **unsigned** EXE and the warning can still appear. Even newly signed executables may trigger SmartScreen until reputation accumulates; Microsoft Store distribution is the most consistent way to prevent SmartScreen download warnings. A self-signed certificate is **not** a public distribution fix.

See Microsoft: https://learn.microsoft.com/windows/apps/package-and-deploy/smartscreen-reputation

### macOS signing and Gatekeeper
The macOS build runs on GitHub-hosted macOS and produces Intel x64 and Apple Silicon arm64 DMG/ZIP preview artifacts. It currently disables automatic identity discovery and outputs unsigned test packages; those can be blocked by Gatekeeper. A public macOS installer requires an Apple Developer ID Application certificate, Apple notarization and ideally stapling. Never claim it is signed without verifying it.

See electron-builder: https://www.electron.build/v26/docs/notarization/

### Android and iOS source/build instructions
Run `npm install`, then:
- `npm run mobile:android` to regenerate `android/`; in Android Studio build a release signed APK/AAB when a release keystore has been set up.
- `npm run mobile:ios` on macOS to regenerate `ios/`; open `ios/App/App.xcworkspace` in Xcode for signing, a physical device, TestFlight or App Store distribution.
- `npm run dist:mac` on macOS to produce desktop packages.
- `npm run dist:win` on Windows to produce a portable Windows executable.

`mobile/www`, `android/` and `ios/` are generated artifacts and are deliberately ignored by Git; Capacitor native projects are regenerated in CI. The Android test key used by `assembleDebug` is temporary and unsuitable for Play Store publishing. The iOS Simulator build is not installable on a physical iPhone. No Apple team or Android release keystore credentials are included.

### Native UI and file handling
Capacitor embeds the same offline Block4Film editor in Android WebView and iOS WKWebView. The native bridge copies project backups, PNG/ZIP exports and supported videos into the app's Documents/Block4Film directory and invokes the OS share sheet. Project import uses the file input already present in the app. Each platform has its **own isolated local storage**; synchronize projects by exporting and importing `.blockascene` files, not by expecting live device synchronization.

WebM video recording requires a platform that supports the current browser `MediaRecorder` pipeline; particularly on iOS, exporting WebM may be unavailable. Native encoding and actual touch/phone-sized layout QA are follow-up tasks, not functionality claimed ready by this version.

### Windows regression safety
No project migration is introduced; original Electron app ID and Windows `BlockaScene` user-data path are preserved. Prior Windows versioned releases remain untouched.

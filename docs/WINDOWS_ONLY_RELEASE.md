# Windows-only release policy

For now, Block4Film builds and distributes **only a Windows portable EXE**.

## CI

- `.github/workflows/windows-portable.yml`: Windows EXE on editor changes.
- `.github/workflows/release.yml`: verified Windows-only release, then retirement of the old cross-platform beta release.

Mac and Android platform scaffolding and CI are intentionally absent from `main`. Prior work remains retrievable in Git history. The Windows Electron app ID and user-data path remain unchanged to preserve saved projects.

## Next phase

Collect bugs and suggestions before changing the editor. For each issue capture: steps to reproduce, expected behavior, actual behavior, priority, and completion criteria. Build and agree on a consolidated changelog first.

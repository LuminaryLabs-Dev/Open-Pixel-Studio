# Open Pixel Studio — repository and distribution

**Repository:** https://github.com/LuminaryLabs-Publish/Open-Pixel-Studio  
**Target branch:** `main`  
**Publisher:** Luminary Labs

## What is included

- Editable browser editor: `studio/`
- Self-contained HTML5 application: `release/html5/index.html`
- Windows x64 executable: restored from `release/windows/Nexus-Pixel-Studio-v0.2.0-Windows.exe.xz` or extracted from `archive/Nexus-Pixel-Studio-v0.2.0-Windows-Portable.zip`
- Replacement desktop launcher (not exact original EXE source): `desktop/`
- Editable QA sprites: `examples/`
- Source recordings, promotional videos, images and copy: `media/` (original WAV is stored as a lossless `.xz`)
- Historical release archives: `archive/`

## Publication boundaries

Publishing repository contents to `main` does not mean the Windows executable has been executed on a Windows machine, that a GitHub Release was created, or that an itch.io page was updated. The Windows binary is unsigned. The desktop launcher uses Edge/Chrome in app mode.

No GitHub Actions workflow is part of this project. Do not add or change workflows without explicit authorization.

The repository is publicly viewable but **no open-source license has been selected**. Public visibility is not a grant of reuse or redistribution rights.

## Verification

Compare the published file tree and Git blob hashes against the prepared local commit. Verify `studio/standalone.html`, `release/html5/index.html`, and both compressed assets are present. Run `python tools/restore_large_assets.py` and confirm the executable and WAV SHA-256 values. The unchanged EXE is also contained in the historical portable ZIP.

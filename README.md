# Open Pixel Studio — complete project package

**Luminary Labs · v0.2.0 · Windows and HTML5**

The current editor's in-app title is **Nexus Pixel Studio**. **Open Pixel Studio** is the public media and repository name; the application UI has not been renamed. This archive combines the editor, distribution binaries, sample projects, historical development packages, QA evidence and the launch media pack.

## Run it

- **Windows 10/11, x64:** Extract the EXE from `archive/Nexus-Pixel-Studio-v0.2.0-Windows-Portable.zip`, or run `python tools/restore_large_assets.py` to restore the exact EXE from its losslessly compressed `.xz` file, then run it. It embeds the editor and opens an Edge/Chrome app window; it is **not** a native drawing renderer. Edge/Chrome is required. The executable is unsigned.
- **Browser, offline:** Open `studio/standalone.html` locally in a modern browser.
- **HTML5 hosting / itch.io:** Upload the contents of `release/html5/` as an HTML5 project. `index.html` is self-contained.
- **Develop the editor:** Open `studio/index.html` with the adjacent `app.js`, `style.css`, and `workspace.css` files. This is the editable split-source version.

No account, backend service or internet connection is required to use the editor.

## Features in v0.2.0

Editable RGBA sprites, drawing and fill/shape tools, selection and move, layers with visibility and opacity, animation frames, palette picking, onion skin, grid/zoom, undo/redo, project save/open (`.npx`), PNG/GIF/sprite-sheet/atlas exports, and a resizable canvas-first workspace.

**Not yet supported:** Aseprite feature parity, arbitrary docking, tilemap editor, indexed color mode, linked animation cels, scripting, native OS drawing renderer.

## Repository structure

```text
studio/             Current HTML, CSS and JavaScript editor; standalone build
release/windows/    Windows v0.2.0 EXE compressed losslessly (`.xz`); runtime notes and checksums
release/html5/      Deployable self-contained HTML5 entrypoint
desktop/            New buildable Go desktop launcher reference implementation
examples/           Editable five-sprite QA projects and export examples
media/              Complete Open Pixel Studio media pack, videos and recordings
docs/qa/            Automated/browser QA scripts, results and screenshots
docs/captures/      Workspace screenshot evidence
archive/            Original earlier release and QA ZIPs, preserved unchanged
tools/              Repository artifact verification
```

## Desktop source and reproducibility

The originally shipped Windows executable was built in a previous session. **Its original Go launcher source was not present in the available handoff files.** To preserve a buildable desktop-host foundation, `desktop/` contains a **newly authored equivalent Go launcher**, embedding the previously delivered `served.html` and using a loopback-only HTTP host with Edge/Chrome app mode. It is **not** claimed to be byte-for-byte the code that produced the shipped EXE. The shipped binary remains unchanged.

Build an equivalent launcher (requires Go 1.23 or newer):

```bash
cd desktop
go test ./...
GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -ldflags="-H=windowsgui -s -w" -o Open-Pixel-Studio-from-source.exe .
```

The replacement launcher compiles for Windows x64 and passes local Go unit tests. **Neither the shipped EXE nor the replacement build was launched on Windows hardware in this environment.** Do not imply Windows runtime QA is complete.

## Evidence and distribution state

- Editor workspace QA: earlier v0.2.0 Chromium interaction pass reported 28/28 passes. See `docs/qa/v0.2.0/workspace-qa-results.json`.
- Earlier five-sprite manual-style browser interaction pass: preserved in `examples/` and `archive/`.
- Windows host: original release note and checksum in `release/windows/`.
- Media pack: authentic v0.2.0 workspace captures, full 60-second walkthrough, three short cuts, storefront images, source recording takes, creative/technical review notes in `media/`.
- Recheck any source-derived claims before publication. No GitHub Actions workflows have been added or modified.

**Licensing:** No open-source license has been selected by the rights holder. A public GitHub repo is not automatically permission to reuse or redistribute the source; obtain a license decision before claiming otherwise.

**Distribution status:** The repository contains the v0.2.0 project, including the exact Windows executable in a portable ZIP and reconstructable `.xz`, HTML5 release, examples, testing evidence, historical archives, and media pack. GitHub repository publication does **not** imply a signed Windows release, itch.io publication, or Windows-device runtime verification.

## Restore large binary files

GitHub API transport limits required two files to be stored as lossless `.xz` archives: the Windows EXE and the original promotional WAV. Run `python tools/restore_large_assets.py` from any directory to reconstruct both at their original paths. The script verifies original and compressed SHA-256 hashes and never overwrites a different existing file. All other project files retain their original paths and Git blobs.

For a Windows-only download without Python, the original EXE is also preserved inside `archive/Nexus-Pixel-Studio-v0.2.0-Windows-Portable.zip`. No installer is required.

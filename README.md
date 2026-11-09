# Open Pixel Studio — complete project package

**Luminary Labs · v0.2.0 · Windows and HTML5**

The current editor's in-app title is **Nexus Pixel Studio**. **Open Pixel Studio** is the public media and repository name; the application UI has not been renamed. This archive combines the editor, distribution binaries, sample projects, historical development packages, QA evidence and the launch media pack.

## Development status — SG-2 integration (2026-11-08)

**Current `main` source is an in-progress development snapshot, not a newly released version.** SG-2 was accepted as a finished implementation baseline; remaining parity and release qualification are tracked in [SG-3 #5](https://github.com/LuminaryLabs-Dev/Open-Pixel-Studio/issues/5). The last documented packaged release remains **v0.2.0**. Source changes for **v1.1.0 export/recovery** and **SG-2 Drawing Domain (Aseprite-parity work)** have been integrated together; integration does **not** mean either milestone passed its release-candidate gates.

- **SG-2 status: COMPLETED AS ACCEPTED BASELINE; SG-3 remains IN PROGRESS.** See [drawing task #3](https://github.com/LuminaryLabs-Dev/Open-Pixel-Studio/issues/3) and [SG-2 QA notes](docs/qa/sg-2/README.md).
- **Implemented, development level:** pixel-perfect pencil, brush shapes/size presets, pressure-sensitive sizing, checker/Bayer dithering, undoable invert/color replace; mask-accurate rectangle, ellipse, lasso, polygon, contiguous wand and global-color selection; selection combination, masked cut/copy/delete/move, flips, 90° rotation, crop and selection shortcuts.
- **Validation done:** 8/8 drawing-kernel goldens and 13/13 selection/mask tests against the integrated source; focused Chromium selection-module interaction passed four scenarios; browser bundle scripts parsed, and standalone/itch HTML5 builds matched.
- **Validation *not* done:** full editor regression (including historical 28-case suite), full-editor reload recovery and IndexedDB, engine import round-trips, sustained performance stress, Firefox/WebKit, physical stylus and Windows runtime. The available Chromium interaction harness was a smaller selection-module host, **not** a full-editor pass.
- **Open SG-2 subgoals:** saved/custom brushes, patterns, gradient/contour ink, more transforms and selection-history handling, tiled previews/snapping, HSV/outline operations and full Aseprite parity assessment. **These items are transferred to SG-3; SG-2 baseline completion does not certify Aseprite parity or release readiness.**
- **v1.1.0 status:** export wizard, asset packs and IndexedDB work are present in source as development features; full integration/release validation is still pending. See [v1.1 QA](docs/qa/v1.1.0/README.md) and [issue #1](https://github.com/LuminaryLabs-Dev/Open-Pixel-Studio/issues/1).

**No publishing, version bump, code signing, or GitHub Actions workflow change is implied by the integration.** The preexisting v0.2.0 Windows package in the repository is not replaced with an SG-2 build.

### SG-2 pass 3 — broader drawing toolchain

Source now also contains session-only captured custom brushes (original-image or tint ink), linear/radial gradients (smooth and Bayer 2×2/4×4/8×8), selection-aware HSV effects, inside/outside outlines and Reselect. See [SG-2 Aseprite parity matrix](docs/qa/sg-2/aseprite-parity-matrix.md) for implemented, partial and absent features.

**Test status:** 66/66 source-level contract/raster cases; 17/17 focused Chromium paint-module harness cases; all HTML bundles synchronized. **Not yet passed:** full editor browser regression, historical 28-case replay, real save/reload recovery, Windows runtime, stylus and external Aseprite differential parity. SG-2 remains **IN PROGRESS**, and these changes are **not** a new versioned release.

### v1.2.0 — Windows packaging preparation

The user has designated **v1.2.0** as the next Windows/itch package target. This is a *packaging/versioning decision*, not an assertion that the previous roadmap's indexed/grayscale color-mode work has shipped. The exact installed functionality is the SG-2 accepted baseline and earlier v1.1 export/recovery code.

- Windows runtime: use `desktop/main.go` and embed the latest `desktop/editor.html` in a Go 1.23+ Windows x64 executable. The desktop host requires Edge/Chrome and does not use a native drawing renderer.
- The versioned ZIP/EXE, source integrity evidence, browser recovery tests, full-editor regression, Windows x64 hardware verification and itch metadata are SG-3 release-qualification tasks; no official v1.2.0 release has been tagged or published.
- Developer guide: [SG-3 tracker](https://github.com/LuminaryLabs-Dev/Open-Pixel-Studio/issues/5). Media produced only from SG-2 test harnesses must be labeled *internal development evidence* rather than advertised as real editor footage.

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

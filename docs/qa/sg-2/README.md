# SG-2 — Drawing Domain, implementation pass 1

Status: **IN PROGRESS**. Tracking issue: https://github.com/LuminaryLabs-Dev/Open-Pixel-Studio/issues/3

Integration note (2026-11-08): SG-2 was developed on `feature/sg-2-drawing-domain`, based on `feature/v1.1.0-export-packs`. The combined source has been promoted to `main` as **unfinished development code**, not as a v1.3.0 release candidate or a new stable release.

## Implemented in this pass

- Pixel-perfect 1px pencil stroke path with deterministic orthogonal-corner suppression.
- Square and genuinely circular pixel-aligned brush stamps, sizes 1–16, with quick size presets in a Brush dock.
- Stylus pointer-pressure brush sizing, togglable; mouse/trackpad strokes retain their chosen brush size.
- Dither brush patterns: checker 50%, Bayer 25%, Bayer 50%, Bayer 75%.
- Active-cel color invert and exact secondary-to-primary color replacement. Both preserve alpha, honor the rectangular selection, and use existing undo.
- Synchronized editor code and controls in split source, standalone HTML, itch HTML5 and Windows launcher-embedded HTML.
- Reproducible source-level kernel checks in `drawing-kernel.test.cjs`.

## Validation performed

- **8/8 drawing-kernel checks passed** using an isolated JavaScript execution harness with the actual committed `studio/app.js` function bodies.
- All embedded JavaScript blocks parsed; standalone and itch HTML5 source contents matched; split source retained v1.1 add-on references.
- Code changes on SG-2 branch only. No changes to GitHub Actions or released products.

## Not yet validated

- Full Chromium browser interaction suite and before/after pixel screenshots.
- Firefox/WebKit behavior, physical stylus input, pressure range, edge cases under zoom, and physical Windows launcher.
- Performance profile of long pixel-perfect strokes (redraw-from-baseline is an initial correct-by-construction implementation, not the final optimized path).
- All previous 28 baseline interaction assertions and v1.1 export/recovery tests on the SG-2 branch.

## Remaining SG-2 scope

- OPS-1301: user-defined/saved custom brush presets and final stylus acceptance.
- OPS-1302: custom/pattern brushes, ink, gradients, shading/contour and curve tools.
- OPS-1303: lasso, ellipse, polygon, magic-wand selections and selection combination.
- OPS-1304: comprehensive selection/cel/canvas transforms.
- OPS-1305: tiled previews, custom snap/grid and expanded symmetry controls.
- OPS-1306: hue/saturation/brightness, outline and palette-aware operations.
- OPS-1307: full visual goldens, browser/stylus/parity comparisons and performance benchmarks.

## Test invocation

From repository root: `node --test docs/qa/sg-2/drawing-kernel.test.cjs`.

For a release candidate, execute browser-level regression/reload recovery, perf stress, export round-trip and Windows runtime verification first. Do not mark SG-2 complete without those gates.

## Implementation pass 2 — exact selections and transforms

**Implemented on the same working branch; not a release candidate.**

- Mask raster engine: inclusive rectangle, pixel-aligned ellipse, freehand polygon/lasso, click-vertex polygon, contiguous magic wand and noncontiguous color-range selection.
- Replace/add/subtract/intersect composition; Shift/Alt/Ctrl pointer modifiers and UI mode selector; color tolerance control; exact-pixel selection outline overlay.
- Painting and prior invert/color replacement now respect irregular masks without per-painted-pixel mask allocations.
- Mask-aware copy, cut, delete, paste, drag/move and horizontal/vertical flip. Masked CW/CCW 90-degree rotation refuses operations that would clip rotated bounds outside the document.
- Select all, invert selection, document-wide crop to selection bounding box, and shortcut/menu bindings. Polygon mode supports click vertices, double-click/Enter to finish and Escape to cancel.
- Selection state is **ephemeral**, never serialized into the v1 `.npx` document; reset on new/open/restore/resize. No changes to project file format.
- All source integrations synchronized in split editor, `studio/standalone.html`, `release/html5/index.html` and `desktop/editor.html`.

### Evidence (pass 2)

1. Committed `selection-core.test.cjs`: **13/13** tests passed against the GitHub branch's actual raster code via independent JavaScript execution. Includes 512×512 contiguous flood selection and corrupt dimension rejection.
2. Previous `drawing-kernel.test.cjs`: **8/8** still pass against the current editor source.
3. **Sandbox Chromium module-integration harness** (not the complete editor): rectangle selection, masked deletion, ellipse selection and contiguous magic wand all passed; no uncaught page errors. The harness used actual SG-2 selection modules with a minimal canvas host.
4. All inline scripts in all three bundled HTML distributions parse; every bundle embeds exact copies of the committed editor, mask core and interaction modules; standalone and HTML5 distributions match byte-for-byte.
5. Added `browser-selection-smoke.py` to run against the **complete editor** using a sandbox Chromium. This separate full-editor script **has not yet been executed** against the actual repository HTML; it is a pending acceptance gate.

Run from repo root:

```sh
node --test docs/qa/sg-2/drawing-kernel.test.cjs docs/qa/sg-2/selection-core.test.cjs
PIXEL_CHROMIUM=/usr/bin/chromium python docs/qa/sg-2/browser-selection-smoke.py
```

The first command has been validated in source-level execution. The browser command is present for next regression testing but cannot be claimed passing yet.

### Remaining risks / deferred scope

- Full live-editor and prior 28-case regression still required, including canvas resize, selection edge clipping, file recovery and v1.1 pack export.
- Browser tests outside Chromium; physical stylus and Windows runtime still unverified.
- No selection-history persistence, resize/scale transform handles, RotSprite-quality rotation, procedural/custom brushes, gradient/contour ink, advanced HSV/outline FX or tiled/snap preview yet.
- Lasso/polygon performance on very long paths, multi-layer complex selections and long editing soak remain to benchmark.
- v1.2 indexed/grayscale drawing parity is not yet available; SG-2 cannot pass its v1.3 RC gate until that domain matures.

**SG-2 stays IN PROGRESS. Development code is integrated into `main` together with the v1.1.0 prerequisite; this does not close the SG-2 milestone or satisfy any outstanding release gates.**

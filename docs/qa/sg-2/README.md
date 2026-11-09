# SG-2 — Drawing Domain, implementation pass 1

Status: **IN PROGRESS**. Tracking issue: https://github.com/LuminaryLabs-Dev/Open-Pixel-Studio/issues/3

This branch is based on `feature/v1.1.0-export-packs`, not `main`. It does not constitute a v1.3.0 RC or a stable release.

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

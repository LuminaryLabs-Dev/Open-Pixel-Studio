# SG-2 — Aseprite Drawing Parity Matrix

**Status:** In Progress — implementation pass 3. This is feature comparison and regression evidence, not an Aseprite certification or release approval.

| Domain | Open Pixel Studio source implementation | Parity judgment | Evidence / missing work |
|---|---|---|---|
| RGBA pencil | Pixel-perfect 1px stroke, square/circle brush, pointer pressure | Partial | 8 drawing tests; Aseprite stroke behavior not fully cross-compared |
| Custom brushes | Capture opaque selected art (up to 64×64), retain image RGB, tint or image ink | Partial | 28 paint core cases; persistence/pattern-origin modes still absent |
| Dither brush | Checker and 4×4 Bayer 25/50/75% | Partial | Existing drawing tests; Aseprite ink methods not exhaustive |
| Gradient tool | Linear and radial, smooth/dithered, Bayer 2×2/4×4/8×8 | Implemented subset | Pixel-buffer golden tests; opacity/complex blending parity unverified |
| HSV adjustments | Hue/saturation/brightness, selection/alpha-aware | Implemented subset | Pixel-buffer golden tests; exact Aseprite color-space rounding not proven |
| Outline effects | Inside/outside, thickness 1–3, orthogonal/diagonal | Implemented subset | Golden tests; Aseprite outline UI/algorithms differ |
| Rectangle/ellipse/lasso/polygon selection | Real binary masks, overlay and modifier modes | Implemented subset | 13 core + 9 selection-UI parity cases |
| Magic wand / color range | Contiguous/global tolerance modes | Implemented subset | Core tests; color-distance semantics may differ from Aseprite |
| Copy/move/flip/rotate | Mask-aware cut/copy/paste/move, 90° rotations, H/V flips | Partial | Transform core tests; arbitrary-angle scaling/RotSprite missing |
| Selection persistence | Deselect/Reselect, clear on document changes | Partial | Selection UI regression tests; history across Undo not tracked |
| Advanced ink/drawing | Shading, spray, blur/jumble, curve, pattern alignment | Missing/partial | Requires further SG-2 work |
| Tiling/symmetry | Basic grid and X/Y symmetry | Partial | Advanced tiled preview, snap and wrap drawing absent |
| Indexed/grayscale editing | RGBA only today | Missing | v1.2 document architecture dependency |
| Linked cels/group layers | Standard frames/layers | Missing | v1.4+ |
| Tilemap layers | Not implemented | Missing | v1.6 |
| Native Aseprite file round-trip | Not implemented | Missing | v1.7 |
| Script API parity | Not implemented | Missing | v1.8 |

## Regression evidence — SG-2 pass 3

Source-level tests against the **actual GitHub feature-branch code**:

- drawing-kernel.test.cjs: **8/8**
- selection-core.test.cjs: **13/13**
- selection-ui-parity.test.cjs: **9/9**
- paint-core.test.cjs: **28/28**
- distribution-regression.test.cjs: **8/8**
- **Total: 66/66 source-level checks.** The tests execute actual committed raster functions and check source/bundle contracts. A subset runs through a Node-compatible harness and the distribution check is read back against GitHub; this is **not** full-editor UI acceptance.

Additional sandbox evidence:
- Focused Chromium **paint-module** interaction harness: **17/17 passed**, no uncaught page errors. The harness is a minimal test host, not the full Open Pixel Studio editor.
- Separate local paint-core golden harness: **30/30 passed** (superset of the committed 28 cases). It does not count toward the 66 committed cases.
- Stress sample: 24 × 256×256 radial/Bayer gradient passes in about **202 ms** in Node on this sandbox; this is a single sample, not an FPS or real-editor memory benchmark.
- Split-source HTML and all three self-contained output variants parse correctly. Every embedded module matches the committed split-source code. Standalone/itch HTML5 outputs are identical.
- Historical v0.2.0 Chromium 28-case suite **was not rerun** against this branch. Existing full-editor test script remains to be executed against current sources.

### Still-blocking acceptance

1. Actual combined-editor Chromium user interactions and full save/reload/IndexedDB recovery.
2. Repeat the v0.2.0 28/28 suite and v1.1.0 export/ZIP import and recovery tests.
3. Firefox/WebKit and physical stylus/pen-pressure testing.
4. Windows launcher run, Windows browser host and cross-platform resource stress.
5. Aseprite reference-output differential goldens for tools that claim algorithm parity.
6. Saved presets, pattern brushes, additional drawing tools, advanced transformations and indexed color foundations.

**Policy:** Merge/source integration does not equal a versioned release or an SG-2 completion. Keep issue #3 open. Do not modify GitHub Actions.

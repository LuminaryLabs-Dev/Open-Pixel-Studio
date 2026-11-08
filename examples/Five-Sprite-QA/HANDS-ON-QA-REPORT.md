# Nexus Pixel Studio — Hands-On Five-Sprite QA Report

**Date:** November 6, 2026  
**Tested build:** Nexus Pixel Studio v0.1.1, local self-contained browser build  
**Results:** **63 passed, 0 failed, 1 blocked**  
**Source artwork:** Five distinct 32 × 32 RGBA sprites painted through the application's pixel editor.  
**Method:** Browser-based manual-style pointer/keyboard interaction in Chromium, driven by a reproducible test harness, with screenshot inspection. **This was not a test performed by an independent human operator.** Source patterns were drawn by GUI input; no premade images were imported to create the five art pieces.  

## Five completed sprites

| Sprite | Content and interface coverage | Exports |
| --- | --- | --- |
| Ember Blade | 91 original drawing strokes, eyedropper, zoom, grid | 32 × 32 PNG, editable .npx |
| Crimson Toadstool | 102 strokes, undo/redo/focus regression | 32 × 32 PNG, editable .npx |
| Azure Potion | 94 strokes, marquee selection, move, undo | 32 × 32 PNG, editable .npx |
| Iron Guardian | 136 strokes, two layers, lock, visibility, opacity, native project reopen | 32 × 32 PNG, layered .npx |
| Moss Slime | 100 initial strokes; 3 frames, duplicate, blink/sparkle edits, playback | 32 × 32 PNG, 3-frame .npx, 64 × 64 sheet, atlas, GIF |

**Total:** 523 primary painting strokes across five unique designs, plus animation and tool-test edits. Every completed PNG had **zero pixel differences** against its 32 × 32 source pattern. The 3-frame exported sprite sheet and every GIF frame were also pixel-exact after decoding (for these colors and alpha values).

## Verified functionality

- UI-created documents, brush drawing, 3 px brush, eraser, eyedropper, flood fill, line, filled rectangle and ellipse, horizontal symmetry.
- Foreground HEX selection, custom palette insertion, zoom, pan, pixel grid, canvas resize.
- One-frame and multi-frame documents, duplicated frames, animation playback, editable timeline, sprite-sheet export, animated GIF export, atlas rectangles.
- Layer visibility, lock protection, non-destructive opacity adjustment, two-layer composite rendering.
- Marquee move and undo, selection cut/paste, standard undo/redo, keyboard project-save shortcut, double flip fidelity.
- PNG export/import pixel round-trip; project `.npx` export/reopen, including all layers and three animation frames.
- JavaScript runtime exception check: **none observed** in this in-memory session.

## Real defect found and fixed — v0.1.1

**Before:** When changing HEX color, then clicking the canvas to paint, the color field retained keyboard focus. `Ctrl+Z` went to the input rather than the drawing history; subsequent undo assertions failed.

**Fix:** Make the viewport keyboard-focusable (`tabindex=0` and an accessible label) and call `viewport.focus({preventScroll:true})` when a pointer drawing interaction begins. This returns editing shortcuts to the canvas while preserving normal keyboard editing in text fields.

**Regression:** Redo, second undo, selection-move undo, and keyboard save were re-exercised on the patched build and passed.

## Remaining validation limitation

**Autosave across reload: BLOCKED**, not passed. The managed Chromium used by this environment rejects URL navigation (`URLBlocklist` policy), so the self-contained build was rendered in a memory document with an opaque `about:blank` origin. `localStorage` is denied to that origin. Actual origin-backed browser autosave and recovery **must be separately tested** in a standard browser session before a commercial release.

## Known Aseprite-parity gaps (not defects discovered by this QA)

Indexed-color documents, linked cels, tilemaps, masks, custom brushes, grouped layers, advanced transformations, `.ase`/`.aseprite` interop, IndexedDB storage, and native desktop integration are not implemented in v0.1.1.

## Files

`sprites/` contains the five original PNG files and matching `.npx` projects, a 160 × 32 five-sprite collection PNG, and the slime GIF/sheet/atlas. `evidence/` contains screenshots taken after actual GUI interactions and the tools regression evidence. `test-results.json` and `extended-results.json` contain the individual assertions. Scripts are included for reproducibility, with local sandbox file paths to adjust for another machine.

**Release state:** Locally tested and packaged; not published to itch.io, GitHub, or another external service.

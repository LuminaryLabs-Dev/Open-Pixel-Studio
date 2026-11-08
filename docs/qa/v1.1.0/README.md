# Open Pixel Studio v1.1.0 — Implementation pass 1

**Status:** In progress on `feature/v1.1.0-export-packs`. Not yet merged, released, or published.

## Implemented in this branch

- Add a complete ZIP asset-pack export dialog to the existing canvas-first editor.
- Include current and extra imported `.npx` projects, editable source, raw transparent frame PNGs, matched sprite-sheet PNG/atlas JSON pairs, optional current-project GIF, engine import guides, import-map JSON, README, and file/CRC manifest.
- Configure Unity, Godot, Unreal-compatible (no native `.uasset` claim), generic and all-target packaging.
- Configure atlas padding and frame spacing from 0–16 px, preserved in metadata.
- Provide background-friendly progress updates, cancellation checkpoints, duplicate-name handling, input validation, memory/archive limits, and safe failure messages.
- Use IndexedDB for editor recovery when supported, retaining `localStorage` as a fallback and detecting write failures.
- Reduce animation-time DOM work by updating existing timeline cursor classes instead of rebuilding thumbnails each frame; composite the current canvas only once for canvas + preview.
- Synchronize split-source, standalone HTML, HTML5 release HTML, and desktop embedded editor.

## Verified in the sandbox

`python docs/qa/v1.1.0/test_export_pack.py` — browser-driven fixture test with real Chromium, Python ZIP decoder, and Pillow image comparisons:
- Two-project, 20-file ZIP generated and passed `zipfile.testzip()`.
- PNG pixels, source project structure, atlas dimensions/coordinates, frame durations, engine import maps, and CRC manifest matched expected output.
- Padding/spacing, source-only export, and zero-output validation passed.
- No page exceptions in the fixture.
- Export addon passed JavaScript syntax checking with Node and embedded-script parsing.

The browser fixture tests the exported ZIP pipeline and wizard, **not the full existing editor UX or IndexedDB reload behavior**. A full source checkout/hosting environment was not available in the sandbox; do not upgrade these checks to end-to-end application verification.

## Remaining release gates

1. Load real combined editor in Chromium/Firefox/WebKit and exercise its drawing, layer, timeline, export, import, save and recovery flows.
2. Validate IndexedDB persisted data across a real reload and blocked-storage fallback.
3. Profile larger sprite packs, high-frame-count animations, memory use, and cancellation.
4. Confirm Unity/Godot imports and Unreal-compatible image/metadata imports in the actual engines.
5. Complete Windows runtime QA and itch.io embedded page QA.
6. Refresh version labels and publish only when the full v1.1.0 acceptance suite passes.

## Run the export tests

Install `playwright` and `Pillow` in Python and install a Chromium browser. Use `PIXEL_CHROMIUM=/path/to/chromium` to override the binary. The test uses `page.set_content` so it works in restricted browsing environments.

No GitHub Actions files are added or changed.

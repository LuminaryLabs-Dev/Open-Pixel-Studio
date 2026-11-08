# Nexus Pixel Studio — Workspace Edition v0.2.0

A standalone, offline-capable **browser pixel-art editor** built as a focused Luminary Labs creative workspace. This is a visual workspace redesign of v0.1.1, not yet a native Windows/macOS/Linux application.

## Quick launch

**Recommended:** Open `Nexus-Pixel-Studio-v0.2.0-Standalone.html` in Chrome or Edge. All CSS and JavaScript are embedded in one file; it does not need a server or external assets.

**itch.io:** Upload `Nexus-Pixel-Studio-v0.2.0-Itch-HTML5.zip` as an HTML5 project. Its root `index.html` is the complete standalone application, without asset requests.

**Source:** `Nexus-Pixel-Studio-v0.2.0-Source.zip` provides the readable HTML/CSS/JS split for development. The modular `index.html` in this archive must be kept beside `app.js`, `style.css`, and `workspace.css` when opened.

## Workspace redesign

- Compact desktop-style application menu and tab, without website-like banners.
- Luminary brand mark is red; active editing states and success are green. Neutral charcoal takes over the canvas and utility chrome.
- A canvas-first layout with a narrow left tool strip and compact brush controls.
- Right-side dock with distinct **Colors**, **Layer**, and **Navigator** tabs rather than stacked panels.
- Resizable right dock and timeline. Both can be hidden to concentrate on the canvas.
- No always-visible export tiles or jumbo preview card; export remains in the File menu and Export toolbar action.
- Consistent vector tool icons and restrained typography, borders, and window dialogs.
- Local UI configuration is retained when browser storage permits. Documents use their existing `.npx` editable project format.

## Workspace controls

| Action | How |
|---|---|
| Fit artwork | `F` (while not editing a text field), or **View → Fit artwork** |
| Hide/show right dock | Right-pane icon in top bar, **View** menu, or `Tab` while drawing canvas has focus |
| Hide/show timeline | Timeline icon in top bar, **View** menu, or `Shift+Tab` while canvas has focus |
| Resize dock | Drag the narrow vertical divider between canvas and right dock |
| Resize timeline | Drag the horizontal divider above the timeline |
| Reset panel layout | **View → Reset workspace** |
| Full screen | **View → Full-screen workspace** (browser support required) |
| Switch inspector content | **Colors**, **Layer**, **Navigator** tabs |
| Save | `Ctrl+S`, exports `.npx` editable project |
| Export | **File** menu: PNG / sprite sheet / animated GIF / atlas JSON |

Keyboard `Tab` continues to navigate buttons and fields when focus is on ordinary controls. On the drawing canvas, it toggles the dock.

## Test evidence

A browser-driven regression pass (Chromium, 1440×900 and 900×700) passed **28/28 checks**, covering UI state changes, drag-resize and reset, canvas editing, undo/redo, layer/frame creation, sprite sheet download, editable `.npx` export and reopen, and JavaScript errors. See `workspace-qa-results.json` and screenshots in the source archive.

This is automated browser interaction testing and screenshot inspection, not a claim of independent human usability research. Offline file navigation and browser autosave persistence across a real page reload could not be tested in this managed Chromium environment. When browser storage is unavailable, explicitly save `.npx` projects rather than relying on autosave.

## What is not included

Native OS executable packaging, full Aseprite feature parity, multi-document file tabs, docking to arbitrary locations, tilemap editors, indexed palette mode, linked cels, scripting, or professional brush engines. These are future milestones; none is represented as implemented.

## Publishing status

No repository, website, or itch.io page was modified or published.

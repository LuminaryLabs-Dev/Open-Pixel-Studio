NEXUS PIXEL STUDIO v0.2.0
WINDOWS PORTABLE EDITION
Luminary Labs

LAUNCH
1. Extract the ZIP archive if you downloaded the ZIP version.
2. Double-click Nexus-Pixel-Studio-v0.2.0-Windows.exe.
3. The studio opens in its own desktop-style window.

SYSTEM REQUIREMENTS
- Windows 10 or Windows 11 (64-bit).
- Microsoft Edge or Google Chrome installed (Edge ships with Windows).
- No internet connection or web hosting required.
- No administrator privileges or installer required.

WHAT IS IN THE .EXE?
The complete v0.2.0 editor (HTML, CSS, JavaScript) is embedded in the EXE.
The EXE starts a small local-only application host on 127.0.0.1 and opens
Edge or Chrome in app-window mode. It is a desktop wrapper around the
existing browser editor, NOT an entirely new native renderer. It does not
host the application publicly or upload your artwork.

FILES AND SAVES
- Use File > Save project or Ctrl+S to download an editable .npx project.
- Export PNG, sprite sheets or GIF from the File menu.
- Browser-local workspace data is stored in the dedicated app profile under:
  %LOCALAPPDATA%\Luminary Labs\Nexus Pixel Studio\BrowserProfile
- Local browser storage is not a substitute for backing up .npx projects.
- Close the app window to stop the desktop host.
- If port 38829 is occupied by an unrelated application, the host will use
  another free localhost port; local browser storage may be separate for
  that launch. Save projects as .npx for safety.

BRANDING
As previously requested, the application itself still reads Nexus Pixel
Studio. "Open Pixel Studio" has only been used for promotional material.

SECURITY AND DISTRIBUTION
This development build is UNSIGNED. Windows SmartScreen or antivirus may
show a warning because the executable has no verified publisher certificate.
Verify that you obtained it from the intended Luminary Labs delivery source.
This release has not been published to GitHub, itch.io or a download website.

VALIDATION AND LIMITATIONS
- Cross-compiled for Windows x64; Windows GUI/PE format verified.
- Embedded icon and Windows resource directory verified.
- Editor content, HTTP host, icon, access control and shutdown logic tested
  using the same server code on Linux.
- Browser automation on the desktop host was blocked by administrative
  restrictions in the sandbox; the Windows executable was not run on Windows.
- Existing v0.2.0 browser-editor QA from the prior release remains relevant,
  but does not constitute Windows desktop testing.

If the program cannot find Edge or Chrome, it tries the default browser.
This fallback may open in a normal tab rather than an app-style window.

Version: 0.2.0 desktop package (2026-11-07)

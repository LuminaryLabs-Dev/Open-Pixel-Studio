# Desktop launcher source (reference replacement)

The shipped EXE in `../release/windows` was previously compiled with a Go desktop host. Its original source code was not included with the supplied v0.2.0 archives. This folder provides a **newly written functional replacement** using the same offline architectural pattern, with a separately preserved `editor.html` from the previous desktop package.

Run tests: `go test ./...`.
Cross-compile: `GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -ldflags="-H=windowsgui -s -w" -o Open-Pixel-Studio-from-source.exe .`

It serves the embedded editor only at `127.0.0.1`, starts Edge/Chrome in application window mode using a dedicated local profile, and exits after the page stops its heartbeat. Port 38829 is preferred, with an ephemeral loopback fallback. The output is functionally similar but is not a bit-identical rebuild of the shipped EXE. It does not include the original Windows icon resources.

Windows machine execution and app-close lifecycle tests remain required before replacing the shipped executable with one built from this source.

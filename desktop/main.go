// A reproducible Windows desktop host for the existing offline pixel-art editor.
// This is a newly authored, compatible replacement launcher; it is not the
// original source of the shipped v0.2.0 release executable.
package main

import (
	"bytes"
	_ "embed"
	"errors"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"sync/atomic"
	"time"
)

//go:embed editor.html
var editor []byte

func main() {
	if err := run(); err != nil {
		log.Printf("Open Pixel Studio desktop launcher: %v", err)
		os.Exit(1)
	}
}

func run() error {
	// Binds to the loopback interface only. The editor is not served publicly.
	listener, err := net.Listen("tcp", "127.0.0.1:38829")
	if err != nil {
		listener, err = net.Listen("tcp", "127.0.0.1:0")
		if err != nil {
			return fmt.Errorf("bind localhost: %w", err)
		}
	}
	defer listener.Close()

	var lastHeartbeat atomic.Int64
	now := time.Now()
	lastHeartbeat.Store(now.Unix())
	var gotHeartbeat atomic.Bool
	srv := &http.Server{Handler: serverHandler(&lastHeartbeat, &gotHeartbeat)}
	go func() {
		if e := srv.Serve(listener); e != nil && !errors.Is(e, http.ErrServerClosed) {
			log.Printf("local server: %v", e)
		}
	}()
	url := "http://" + listener.Addr().String() + "/"
	if err := launchBrowser(url); err != nil {
		return err
	}

	// Keep the host alive while the editor page sends a heartbeat. If the
	// browser window closes, the host shuts down after a brief grace period.
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()
	for range ticker.C {
		idle := time.Since(time.Unix(lastHeartbeat.Load(), 0))
		if gotHeartbeat.Load() && idle > 35*time.Second {
			return nil
		}
		if !gotHeartbeat.Load() && idle > 90*time.Second {
			return nil
		}
	}
	return nil
}

func serverHandler(last *atomic.Int64, got *atomic.Bool) http.Handler {
	page := injectHeartbeat(editor)
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !isLocalRequest(r) {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}
		w.Header().Set("Cache-Control", "no-store")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Referrer-Policy", "no-referrer")
		if r.Method != http.MethodGet && r.Method != http.MethodHead {
			http.Error(w, "Method not allowed", 405)
			return
		}
		switch r.URL.Path {
		case "/":
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			if r.Method == http.MethodGet {
				_, _ = w.Write(page)
			}
		case "/__heartbeat":
			got.Store(true)
			last.Store(time.Now().Unix())
			w.WriteHeader(http.StatusNoContent)
		case "/favicon.ico":
			w.WriteHeader(http.StatusNoContent)
		default:
			http.NotFound(w, r)
		}
	})
}

func isLocalRequest(r *http.Request) bool {
	h, _, err := net.SplitHostPort(r.Host)
	if err != nil {
		h = r.Host
	}
	return h == "127.0.0.1" || strings.EqualFold(h, "localhost")
}

func injectHeartbeat(html []byte) []byte {
	script := []byte(`<script>(function(){function ping(){fetch('/__heartbeat',{cache:'no-store'}).catch(function(){})}ping();setInterval(ping,5000)})();</script>`)
	end := []byte("</body>")
	if bytes.Contains(html, end) {
		return bytes.Replace(html, end, append(script, end...), 1)
	}
	return append(append([]byte(nil), html...), script...)
}

func launchBrowser(url string) error {
	// Chromium app mode gives the editor a dedicated window with its own
	// local profile, independent of personal browsing sessions.
	if runtime.GOOS == "windows" {
		local := os.Getenv("LOCALAPPDATA")
		if local == "" {
			local = os.TempDir()
		}
		profile := filepath.Join(local, "Luminary Labs", "Nexus Pixel Studio", "BrowserProfile")
		if err := os.MkdirAll(profile, 0700); err != nil {
			return err
		}
		candidates := []string{
			filepath.Join(os.Getenv("PROGRAMFILES(X86)"), "Microsoft", "Edge", "Application", "msedge.exe"),
			filepath.Join(os.Getenv("PROGRAMFILES"), "Microsoft", "Edge", "Application", "msedge.exe"),
			filepath.Join(os.Getenv("PROGRAMFILES"), "Google", "Chrome", "Application", "chrome.exe"),
			filepath.Join(os.Getenv("PROGRAMFILES(X86)"), "Google", "Chrome", "Application", "chrome.exe"),
		}
		for _, path := range candidates {
			if info, err := os.Stat(path); err == nil && !info.IsDir() {
				return exec.Command(path, "--app="+url, "--user-data-dir="+profile).Start()
			}
		}
		// Fallback to the default browser if a Chromium executable isn't found.
		return exec.Command("rundll32.exe", "url.dll,FileProtocolHandler", url).Start()
	}
	// Linux/macOS path permits local smoke testing of the HTTP host.
	browser := os.Getenv("PIXEL_STUDIO_BROWSER")
	if browser == "" {
		if runtime.GOOS == "darwin" {
			browser = "open"
		} else {
			browser = "xdg-open"
		}
	}
	return exec.Command(browser, url).Start()
}

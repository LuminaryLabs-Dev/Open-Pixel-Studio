package main

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"
)

func TestLocalEditor(t *testing.T) {
	var ts atomic.Int64
	var got atomic.Bool
	h := serverHandler(&ts, &got)
	r := httptest.NewRequest(http.MethodGet, "http://127.0.0.1:38829/", nil)
	w := httptest.NewRecorder()
	h.ServeHTTP(w, r)
	if w.Code != 200 {
		t.Fatalf("GET / status: %d", w.Code)
	}
	if !strings.Contains(w.Body.String(), "/__heartbeat") {
		t.Fatal("missing heartbeat")
	}
	if !strings.Contains(strings.ToLower(w.Body.String()), "pixel") {
		t.Fatal("missing editor")
	}
}
func TestLocalHostRestriction(t *testing.T) {
	var ts atomic.Int64
	var got atomic.Bool
	h := serverHandler(&ts, &got)
	r := httptest.NewRequest(http.MethodGet, "http://example.org/", nil)
	w := httptest.NewRecorder()
	h.ServeHTTP(w, r)
	if w.Code != 403 {
		t.Fatalf("expected forbidden, got %d", w.Code)
	}
}
func TestHeartbeat(t *testing.T) {
	var ts atomic.Int64
	var got atomic.Bool
	h := serverHandler(&ts, &got)
	r := httptest.NewRequest(http.MethodGet, "http://127.0.0.1:38829/__heartbeat", nil)
	w := httptest.NewRecorder()
	h.ServeHTTP(w, r)
	if w.Code != 204 || !got.Load() || ts.Load() == 0 {
		t.Fatal("heartbeat failed")
	}
}
func TestNoWrite(t *testing.T) {
	var ts atomic.Int64
	var got atomic.Bool
	h := serverHandler(&ts, &got)
	r := httptest.NewRequest(http.MethodPost, "http://127.0.0.1:38829/", strings.NewReader("x"))
	w := httptest.NewRecorder()
	h.ServeHTTP(w, r)
	if w.Code != 405 {
		t.Fatalf("expected method not allowed, got %d", w.Code)
	}
}

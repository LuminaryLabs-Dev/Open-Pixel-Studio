/* SG-2 selection/transform raster engine. Offline, dependency-free, no DOM.
   Masks use one byte per source pixel: 0 unselected, 1 selected. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SG2Selection = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const clamp = (n, min, max) => Math.max(min, Math.min(max, Math.trunc(n)));
  function size(w, h) {
    if (!Number.isInteger(w) || !Number.isInteger(h) || w < 1 || h < 1 || w * h > 512 * 512)
      throw new RangeError('Invalid SG-2 raster dimensions');
    return w * h;
  }
  function point(w, h, x, y) { return x >= 0 && y >= 0 && x < w && y < h; }
  function rect(w, h, a, b) {
    const mask = new Uint8Array(size(w, h));
    const minX = clamp(Math.min(a.x, b.x), 0, w - 1), maxX = clamp(Math.max(a.x, b.x), 0, w - 1);
    const minY = clamp(Math.min(a.y, b.y), 0, h - 1), maxY = clamp(Math.max(a.y, b.y), 0, h - 1);
    for (let y = minY; y <= maxY; y++) mask.fill(1, y * w + minX, y * w + maxX + 1);
    return mask;
  }
  function ellipse(w, h, a, b) {
    const mask = new Uint8Array(size(w, h));
    const x0 = clamp(Math.min(a.x, b.x), 0, w - 1), x1 = clamp(Math.max(a.x, b.x), 0, w - 1);
    const y0 = clamp(Math.min(a.y, b.y), 0, h - 1), y1 = clamp(Math.max(a.y, b.y), 0, h - 1);
    const rx = (x1 - x0 + 1) / 2, ry = (y1 - y0 + 1) / 2;
    const cx = (x0 + x1 + 1) / 2, cy = (y0 + y1 + 1) / 2;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const dx = (x + .5 - cx) / rx, dy = (y + .5 - cy) / ry;
      if (dx * dx + dy * dy <= 1.0000001) mask[y * w + x] = 1;
    }
    return mask;
  }
  function line(w, h, mask, a, b) {
    let x0 = Math.trunc(a.x), y0 = Math.trunc(a.y);
    const x1 = Math.trunc(b.x), y1 = Math.trunc(b.y);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    while (true) {
      if (point(w, h, x0, y0)) mask[y0 * w + x0] = 1;
      if (x0 === x1 && y0 === y1) break;
      const e = 2 * err;
      if (e >= dy) { err += dy; x0 += sx; }
      if (e <= dx) { err += dx; y0 += sy; }
    }
  }
  function polygon(w, h, points) {
    const mask = new Uint8Array(size(w, h));
    if (!points.length) return mask;
    if (points.length < 3) { for (let i = 1; i < points.length; i++) line(w, h, mask, points[i - 1], points[i]); if (points.length === 1) line(w, h, mask, points[0], points[0]); return mask; }
    let minX = w - 1, maxX = 0, minY = h - 1, maxY = 0;
    for (const p of points) { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); }
    minX = clamp(minX, 0, w - 1); minY = clamp(minY, 0, h - 1);
    maxX = clamp(maxX, 0, w - 1); maxY = clamp(maxY, 0, h - 1);
    for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
      const cx = x + .5, cy = y + .5;
      let selected = false;
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const a = points[i], b = points[j];
        if ((a.y > cy) !== (b.y > cy) && cx < (b.x - a.x) * (cy - a.y) / (b.y - a.y) + a.x) selected = !selected;
      }
      if (selected) mask[y * w + x] = 1;
    }
    for (let i = 0; i < points.length; i++) line(w, h, mask, points[i], points[(i + 1) % points.length]);
    return mask;
  }
  function wand(pixels, w, h, x, y, tolerance = 0, contiguous = true) {
    const mask = new Uint8Array(size(w, h));
    if (pixels.length !== w * h * 4 || !point(w, h, x, y)) return mask;
    tolerance = clamp(tolerance, 0, 255);
    const origin = y * w + x, base = origin * 4;
    function matches(n) {
      const i = n * 4;
      return Math.abs(pixels[i] - pixels[base]) <= tolerance && Math.abs(pixels[i + 1] - pixels[base + 1]) <= tolerance &&
        Math.abs(pixels[i + 2] - pixels[base + 2]) <= tolerance && Math.abs(pixels[i + 3] - pixels[base + 3]) <= tolerance;
    }
    if (!contiguous) { for (let n = 0; n < w * h; n++) if (matches(n)) mask[n] = 1; return mask; }
    const queue = new Int32Array(w * h), seen = new Uint8Array(w * h);
    let head = 0, tail = 1; queue[0] = origin; seen[origin] = 1;
    while (head < tail) {
      const n = queue[head++];
      if (!matches(n)) continue;
      mask[n] = 1;
      const xx = n % w, yy = (n / w) | 0;
      if (xx > 0 && !seen[n - 1]) { seen[n - 1] = 1; queue[tail++] = n - 1; }
      if (xx < w - 1 && !seen[n + 1]) { seen[n + 1] = 1; queue[tail++] = n + 1; }
      if (yy > 0 && !seen[n - w]) { seen[n - w] = 1; queue[tail++] = n - w; }
      if (yy < h - 1 && !seen[n + w]) { seen[n + w] = 1; queue[tail++] = n + w; }
    }
    return mask;
  }
  function combine(previous, added, mode = 'replace') {
    if (!['replace', 'add', 'subtract', 'intersect'].includes(mode)) throw new RangeError('Invalid selection mode');
    if (previous && previous.length !== added.length) throw new RangeError('Mask size mismatch');
    if (mode === 'replace') return new Uint8Array(added);
    const result = new Uint8Array(added.length);
    for (let n = 0; n < added.length; n++) {
      const a = previous ? previous[n] : 0, b = added[n];
      result[n] = mode === 'add' ? a | b : mode === 'subtract' ? a & (b ^ 1) : a & b;
    }
    return result;
  }
  function bounds(mask, w, h) {
    if (mask.length !== size(w, h)) throw new RangeError('Mask size mismatch');
    let x0 = w, y0 = h, x1 = -1, y1 = -1, count = 0;
    for (let n = 0; n < mask.length; n++) if (mask[n]) {
      const x = n % w, y = (n / w) | 0;
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); count++;
    }
    return count ? {x:x0, y:y0, w:x1-x0+1, h:y1-y0+1, count} : null;
  }
  function all(w, h) { return new Uint8Array(size(w, h)).fill(1); }
  function copied(pixels, mask, w, h) {
    if (pixels.length !== size(w, h) * 4 || mask.length !== w * h) throw new RangeError('Pixel data size mismatch');
    const b = bounds(mask, w, h); if (!b) return null;
    const out = new Uint8ClampedArray(b.w * b.h * 4);
    for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
      const src = (y + b.y) * w + x + b.x;
      if (mask[src]) out.set(pixels.subarray(src * 4, src * 4 + 4), (y * b.w + x) * 4);
    }
    return {width:b.w,height:b.h,data:out};
  }
  function cleared(pixels, mask, w, h) {
    if (pixels.length !== size(w, h) * 4 || mask.length !== w * h) throw new RangeError('Pixel data size mismatch');
    const out = new Uint8ClampedArray(pixels); let changed = 0;
    for (let n = 0; n < mask.length; n++) if (mask[n] && out[n * 4 + 3]) { out.fill(0, n * 4, n * 4 + 4); changed++; }
    return {data:out, changed};
  }
  function transformed(pixels, mask, w, h, operation, dx = 0, dy = 0) {
    if (pixels.length !== size(w, h) * 4 || mask.length !== w * h) throw new RangeError('Pixel data size mismatch');
    const b = bounds(mask, w, h);
    if (!b) return {data:new Uint8ClampedArray(pixels), mask:new Uint8Array(mask), changed:false};
    const out = new Uint8ClampedArray(pixels), newMask = new Uint8Array(mask.length);
    for (let n = 0; n < mask.length; n++) if (mask[n]) out.fill(0, n * 4, n * 4 + 4);
    let changed = false;
    for (let n = 0; n < mask.length; n++) if (mask[n]) {
      const x = n % w, y = (n / w) | 0, localX = x - b.x, localY = y - b.y;
      let nx = x, ny = y;
      switch (operation) {
        case 'move': nx = x + Math.trunc(dx); ny = y + Math.trunc(dy); break;
        case 'flip-h': nx = b.x + b.w - 1 - localX; break;
        case 'flip-v': ny = b.y + b.h - 1 - localY; break;
        case 'rotate-cw': nx = b.x + Math.floor((b.w - b.h) / 2) + b.h - 1 - localY; ny = b.y + Math.floor((b.h - b.w) / 2) + localX; break;
        case 'rotate-ccw': nx = b.x + Math.floor((b.w - b.h) / 2) + localY; ny = b.y + Math.floor((b.h - b.w) / 2) + b.w - 1 - localX; break;
        default: throw new RangeError('Unknown transform');
      }
      if (!point(w, h, nx, ny)) { changed = true; continue; }
      const dst = ny * w + nx;
      out.set(pixels.subarray(n * 4, n * 4 + 4), dst * 4); newMask[dst] = 1;
      if (dst !== n) changed = true;
    }
    return {data:out, mask:newMask, changed};
  }
  return Object.freeze({rect, ellipse, polygon, wand, combine, bounds, all, copied, cleared, transformed});
});

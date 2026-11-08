/* Open Pixel Studio v1.1.0: additive export-pack workflow.
   No external dependencies. Designed for split-source and self-contained HTML builds. */
(function () {
  'use strict';
  const MAX_PROJECT_PIXEL_BYTES = 96 * 1024 * 1024;
  const MAX_PACK_PIXEL_BYTES = 128 * 1024 * 1024;
  const MAX_ZIP_BYTES = 256 * 1024 * 1024;
  const PREFS_KEY = 'open-pixel-studio-export-v110';
  const enc = new TextEncoder();
  const engines = ['generic', 'unity', 'godot', 'unreal'];
  const $ = id => document.getElementById(id);
  const pause = () => new Promise(resolve => setTimeout(resolve, 0));
  const bytes = text => enc.encode(text);
  const normalizeName = text => (String(text || 'sprite').normalize('NFKD').replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'sprite');
  const copyJson = x => JSON.stringify(x, null, 2) + '\n';
  const uint16 = (v, x, n) => v.setUint16(x, n, true);
  const uint32 = (v, x, n) => v.setUint32(x, n >>> 0, true);
  const crcTable = (() => { const t = new Uint32Array(256); for (let i = 0; i < 256; i++) { let c = i; for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[i] = c >>> 0; } return t; })();
  function crc32(data) { let c = 0xFFFFFFFF; for (const b of data) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function ensure(condition, message) { if (!condition) throw new Error(message); }
  function verifyProject(doc) {
    ensure(doc && doc.format === 'NexusPixelStudio', 'Expected an editable Open Pixel Studio .npx project');
    const { width: w, height: h, frames, layers } = doc;
    ensure(Number.isInteger(w) && w >= 1 && w <= 512 && Number.isInteger(h) && h >= 1 && h <= 512, 'Project dimensions must be 1–512 pixels');
    ensure(Array.isArray(frames) && frames.length >= 1 && frames.length <= 128 && Array.isArray(layers) && layers.length >= 1 && layers.length <= 64, 'Invalid frame or layer count');
    ensure(w * h * 4 * frames.length * layers.length <= MAX_PROJECT_PIXEL_BYTES, 'Project exceeds editor memory budget');
    for (const frame of frames) ensure(Number.isFinite(Number(frame.duration)) && Number(frame.duration) >= 20 && Number(frame.duration) <= 5000, 'Frame duration must be 20–5000 ms');
    for (const layer of layers) {
      ensure(Array.isArray(layer.cels) && layer.cels.length === frames.length, 'Each layer must contain one cel per frame');
      ensure(layer.cels.every(c => typeof c === 'string' && c.startsWith('data:image/png;base64,') && c.length <= w * h * 8 + 2048), 'Project has invalid or oversized PNG cels');
    }
    return doc;
  }
  function layout(doc, options = {}) {
    const padding = Math.max(0, Math.min(16, Math.round(Number(options.padding) || 0)));
    const spacing = Math.max(0, Math.min(16, Math.round(Number(options.spacing) || 0)));
    const columns = Math.ceil(Math.sqrt(doc.frames.length));
    const rows = Math.ceil(doc.frames.length / columns);
    const width = doc.width * columns + padding * 2 + spacing * (columns - 1);
    const height = doc.height * rows + padding * 2 + spacing * (rows - 1);
    ensure(width <= 16384 && height <= 16384 && width * height * 4 <= MAX_PACK_PIXEL_BYTES, 'Sprite sheet exceeds safe browser export size');
    return { columns, rows, width, height, padding, spacing };
  }
  function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function pngBlob(canvas) { return new Promise((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('PNG encoding failed')), 'image/png')); }
  async function decodePng(dataUrl, width, height, cache) {
    if (cache.has(dataUrl)) return cache.get(dataUrl);
    const image = new Image(); image.src = dataUrl;
    await image.decode();
    ensure(image.width === width && image.height === height, 'Cel image dimensions do not match project');
    cache.set(dataUrl, image);
    return image;
  }
  async function renderFrame(doc, index, cache) {
    const canvas = makeCanvas(doc.width, doc.height);
    const context = canvas.getContext('2d', { willReadFrequently: false });
    for (const layer of doc.layers) {
      if (layer.visible === false) continue;
      const alpha = Number(layer.opacity == null ? 1 : layer.opacity);
      ensure(Number.isFinite(alpha) && alpha >= 0 && alpha <= 1, 'Invalid layer opacity');
      context.globalAlpha = alpha;
      context.drawImage(await decodePng(layer.cels[index], doc.width, doc.height, cache), 0, 0);
    }
    context.globalAlpha = 1;
    return canvas;
  }
  function frameMetadata(doc, baseName, d) {
    return doc.frames.map((frame, i) => ({
      filename: `${baseName}-frame-${String(i + 1).padStart(4, '0')}.png`,
      frame: { x: d.padding + (i % d.columns) * (doc.width + d.spacing), y: d.padding + Math.floor(i / d.columns) * (doc.height + d.spacing), w: doc.width, h: doc.height },
      rotated: false, trimmed: false, sourceSize: { w: doc.width, h: doc.height },
      duration: Math.max(20, Math.round(Number(frame.duration) || 125))
    }));
  }
  class ZipStore {
    constructor() { this.entries = []; this.paths = new Set(); this.total = 0; }
    async add(path, content) {
      ensure(!path.startsWith('/') && !path.includes('..') && !path.includes('\\'), 'Invalid archive path');
      ensure(!this.paths.has(path), `Duplicate archive entry: ${path}`);
      const value = content instanceof Blob ? new Uint8Array(await content.arrayBuffer()) : content instanceof Uint8Array ? content : bytes(String(content));
      ensure(value.byteLength <= 0xFFFFFFFF && this.total + value.byteLength <= MAX_ZIP_BYTES, 'Export exceeds the 256 MiB archive budget');
      this.paths.add(path); this.total += value.byteLength;
      this.entries.push({ path, data: value, crc: crc32(value) });
    }
    async finish() {
      ensure(this.entries.length < 65535, 'Too many archive entries');
      const parts = [], directory = [];
      let offset = 0, dirSize = 0;
      for (const file of this.entries) {
        const name = bytes(file.path), size = file.data.byteLength;
        ensure(name.length < 65536 && offset + size + 30 + name.length < 0xFFFFFFFF, 'ZIP32 archive limit exceeded');
        const header = new Uint8Array(30 + name.length), dv = new DataView(header.buffer);
        uint32(dv, 0, 0x04034b50); uint16(dv, 4, 20); uint16(dv, 6, 0x0800);
        uint16(dv, 8, 0); uint32(dv, 14, file.crc); uint32(dv, 18, size); uint32(dv, 22, size); uint16(dv, 26, name.length);
        header.set(name, 30); parts.push(header, file.data);
        const entry = new Uint8Array(46 + name.length), ed = new DataView(entry.buffer);
        uint32(ed, 0, 0x02014b50); uint16(ed, 4, 20); uint16(ed, 6, 20); uint16(ed, 8, 0x0800);
        uint32(ed, 16, file.crc); uint32(ed, 20, size); uint32(ed, 24, size); uint16(ed, 28, name.length); uint32(ed, 42, offset);
        entry.set(name, 46); directory.push(entry); dirSize += entry.byteLength;
        offset += header.byteLength + size;
      }
      ensure(offset + dirSize + 22 < 0xFFFFFFFF, 'ZIP32 archive limit exceeded');
      const end = new Uint8Array(22), ed = new DataView(end.buffer);
      uint32(ed, 0, 0x06054b50); uint16(ed, 8, this.entries.length); uint16(ed, 10, this.entries.length);
      uint32(ed, 12, dirSize); uint32(ed, 16, offset);
      return new Blob([...parts, ...directory, end], { type: 'application/zip' });
    }
  }
  function readme(engineList, projects, options) {
    return '# Open Pixel Studio Asset Pack\n\nGenerated with Open Pixel Studio v1.1.0 export workflow.\n\n'
      + `Included projects: ${projects.map(p => p.name).join(', ')}\n\n`
      + (options.source ? 'source/ contains editable .npx projects.\n' : '')
      + (options.raw ? 'raw/ contains transparent frame PNGs.\n' : '')
      + (options.atlas ? 'atlases/ contains matching PNG and JSON sheets.\n' : '')
      + 'Import PNG files with nearest-neighbor filtering and transparency. Frame durations are in milliseconds in atlas JSON.\n'
      + `Engine guides: ${engineList.join(', ')}. These are import-ready images/metadata, not precompiled Unity or Unreal assets.\n`;
  }
  function engineGuide(name, options) {
    const files = [options.atlas && 'atlases/*.png and accompanying atlas.json', options.raw && 'individual raw/*.png frames'].filter(Boolean).join(' or ');
    const common = files ? `Use ${files}. Preserve alpha, frame order, frame sizes, and per-frame duration. Disable linear texture filtering and compression for pixel-perfect art.\n` : 'This is a source-only archive. Re-export with PNG or atlas outputs selected before importing into a game engine.\n';
    switch (name) {
      case 'unity': return '# Unity Import\n\n' + common + 'Import PNG as Sprite (2D and UI), Filter Mode Point (no filter), Compression None, and configure Slice/grid using each frame rectangle in atlas JSON. Build animations using duration values.\n';
      case 'godot': return '# Godot Import\n\n' + common + 'Import PNG as CanvasItem texture (Lossless), set CanvasItem texture filter to Nearest. Use atlas rectangles to define AtlasTexture regions, or frames to populate AnimatedSprite2D/SpriteFrames.\n';
      case 'unreal': return '# Unreal Paper2D Import\n\n' + common + 'Import PNG with nearest filtering and alpha. Use Paper2D to create sprites and flipbooks based on JSON frame rectangles/duration. Native .uasset files cannot be constructed inside this browser export.\n';
      default: return '# Generic PNG + JSON\n\n' + common + 'Metadata uses RGBA8888 frame rectangles with source pixel dimensions and frame durations.\n';
    }
  }
  function prefs() { try { const v = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}'); return v && typeof v === 'object' ? v : {}; } catch (_) { return {}; } }
  function remember(data) { try { localStorage.setItem(PREFS_KEY, JSON.stringify(data)); } catch (_) { /* Optional user preference, not project data. */ } }
  function listEngines(selected) { return selected === 'all' ? engines : [selected]; }
  function optsFromForm() {
    const e = $('pixelPackEngine').value;
    return { engine: engines.includes(e) || e === 'all' ? e : 'all', raw: $('pixelPackRaw').checked,
      atlas: $('pixelPackAtlas').checked, source: $('pixelPackSource').checked,
      gif: $('pixelPackGif').checked, padding: Math.max(0, Math.min(16, Math.round(Number($('pixelPackPadding').value) || 0))), spacing: Math.max(0, Math.min(16, Math.round(Number($('pixelPackSpacing').value) || 0))) };
  }
  function preview() {
    if (!$('pixelPackDialog')) return;
    const options = optsFromForm();
    const files = [options.source && 'Editable .npx source', options.raw && 'Individual frame PNGs', options.atlas && 'Sprite sheet PNG + JSON', options.gif && 'GIF preview (active document only)', 'Engine import guides', 'Manifest and README'].filter(Boolean);
    $('pixelPackPreview').textContent = files.join(' · ');
    const extra = $('pixelPackFiles').files.length;
    $('pixelPackCount').textContent = `${extra + 1} project${extra ? 's' : ''} in this archive`;
    remember(options);
  }
  let abort = false;
  function feedback(message, failed = false) {
    const status = $('pixelPackStatus'); if (!status) return;
    status.textContent = message; status.classList.toggle('error', !!failed);
  }
  async function generate(docs, options, progress) {
    ensure(Array.isArray(docs) && docs.length > 0 && docs.length <= 40, 'Pack supports 1–40 projects');
    ensure(options.source || options.raw || options.atlas, 'Select at least one asset output');
    const selected = listEngines(options.engine), zip = new ZipStore();
    let totalPixels = 0; const named = [], used = new Set();
    for (const raw of docs) {
      const doc = verifyProject(raw);
      totalPixels += doc.width * doc.height * doc.frames.length * 4;
      ensure(totalPixels <= MAX_PACK_PIXEL_BYTES, 'Pack exceeds the 128 MiB compositing budget');
      let slug = normalizeName(doc.name), name = slug, index = 2;
      while (used.has(name.toLowerCase())) name = `${slug}-${index++}`;
      used.add(name.toLowerCase()); named.push({ doc, name });
    }
    const manifest = { schema: 'open-pixel-pack/1', app: 'Open Pixel Studio', appVersion: '1.1.0',
      format: 'RGBA8888', engines: selected, projects: named.map(({ doc, name }) => ({ name, title: doc.name, width: doc.width, height: doc.height, frames: doc.frames.length, layers: doc.layers.length })), files: [] };
    async function add(path, data, mime) {
      await zip.add(path, data);
      const item = zip.entries[zip.entries.length - 1];
      manifest.files.push({ path, bytes: item.data.byteLength, crc32: item.crc.toString(16).padStart(8, '0'), mime });
    }
    for (let itemIndex = 0; itemIndex < named.length; itemIndex++) {
      if (abort) throw new Error('Export cancelled');
      const { doc, name } = named[itemIndex];
      progress?.(`Rendering ${itemIndex + 1}/${named.length}: ${doc.name}`);
      if (options.source) await add(`source/${name}.npx`, copyJson(doc), 'application/json');
      if (!options.raw && !options.atlas) continue;
      const sheet = options.atlas ? layout(doc, options) : null;
      const c = sheet ? makeCanvas(sheet.width, sheet.height) : null;
      const sc = sheet ? c.getContext('2d') : null, cache = new Map();
      for (let frame = 0; frame < doc.frames.length; frame++) {
        if (abort) throw new Error('Export cancelled');
        const rendered = await renderFrame(doc, frame, cache);
        if (options.raw) await add(`raw/${name}/frame-${String(frame + 1).padStart(4, '0')}.png`, await pngBlob(rendered), 'image/png');
        if (sheet) sc.drawImage(rendered, sheet.padding + (frame % sheet.columns) * (doc.width + sheet.spacing), sheet.padding + Math.floor(frame / sheet.columns) * (doc.height + sheet.spacing));
        if (frame % 4 === 3) await pause();
      }
      cache.clear();
      if (sheet) {
        const base = `atlases/${name}`;
        await add(`${base}/sheet.png`, await pngBlob(c), 'image/png');
        const atlas = { meta: { app: 'Open Pixel Studio', appVersion: '1.1.0', image: 'sheet.png', size: { w: sheet.width, h: sheet.height }, padding: sheet.padding, spacing: sheet.spacing, format: 'RGBA8888', scale: '1' }, frames: frameMetadata(doc, name, sheet) };
        await add(`${base}/atlas.json`, copyJson(atlas), 'application/json');
      }
    }
    if (options.gif && named.length) {
      if (window.NexusStudio?.toGIF) {
        progress?.('Encoding active animation preview');
        await add(`previews/${named[0].name}.gif`, window.NexusStudio.toGIF(), 'image/gif');
      } else throw new Error('Active editor GIF preview is unavailable');
    }
    for (const engine of selected) {
      await add(`engines/${engine}/IMPORT.md`, engineGuide(engine, options), 'text/markdown');
      await add(`engines/${engine}/import-map.json`, copyJson({ schema: 'open-pixel-engine-map/1', target: engine, pixelFiltering: 'nearest', compression: 'lossless', sprites: named.map(({ doc, name }) => ({ name, atlas: options.atlas ? `../../atlases/${name}/sheet.png` : null, metadata: options.atlas ? `../../atlases/${name}/atlas.json` : null, source: options.source ? `../../source/${name}.npx` : null, rawFrames: options.raw ? doc.frames.map((_, i) => `../../raw/${name}/frame-${String(i + 1).padStart(4, '0')}.png`) : [], durationsMs: doc.frames.map(f => f.duration) })) }), 'application/json');
    }
    await add('README.md', readme(selected, named.map(x => ({ name: x.name })), options), 'text/markdown');
    await zip.add('manifest.json', copyJson(manifest));
    progress?.('Assembling ZIP archive');
    const blob = await zip.finish();
    ensure(blob.size < MAX_ZIP_BYTES, 'ZIP exceeds the 256 MiB output budget');
    return { blob, manifest };
  }
  async function runExport() {
    const button = $('pixelPackCreate'), close = $('pixelPackClose');
    if (button.disabled) return;
    const options = optsFromForm();
    abort = false; button.disabled = true; close.disabled = true;
    $('pixelPackCancel').hidden = false;
    try {
      const docs = [verifyProject(window.NexusStudio.toProject())];
      const input = $('pixelPackFiles');
      for (const file of input.files) {
        ensure(file.name.toLowerCase().endsWith('.npx'), `Only .npx projects may be bundled: ${file.name}`);
        ensure(file.size <= 48 * 1024 * 1024, 'Imported project file is too large');
        docs.push(verifyProject(JSON.parse(await file.text())));
      }
      const { blob } = await generate(docs, options, feedback);
      if (abort) throw new Error('Export cancelled');
      const url = URL.createObjectURL(blob), a = document.createElement('a');
      a.download = `${normalizeName(docs[0].name)}-asset-pack.zip`;
      a.href = url; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      feedback(`ZIP ready: ${(blob.size / 1048576).toFixed(2)} MiB. Verify it in your downloads.`);
    } catch (error) { feedback(`Export failed: ${error.message}`, true); }
    finally { button.disabled = false; close.disabled = false; $('pixelPackCancel').hidden = true; }
  }
  function install() {
    if (!window.NexusStudio || !$('exportBtn') || $('pixelPackDialog')) return;
    const css = document.createElement('style'); css.textContent = `
      #pixelPackDialog { width:min(600px,calc(100vw - 28px)); max-height:min(92vh,850px); padding:0; border:1px solid #42454b; border-radius:12px; color:#e8e9ed; background:#202226; box-shadow:0 28px 90px #000b; }
      #pixelPackDialog::backdrop {background:#050609b5;}
      #pixelPackDialog .pack-form {padding:22px; display:grid; gap:16px; overflow:auto; max-height:89vh; box-sizing:border-box;}
      #pixelPackDialog h2 {margin:0;font-size:23px;font-weight:650;}
      #pixelPackDialog p {margin:4px 0 0;color:#aeb3bf;line-height:1.5;font-size:13px;}
      #pixelPackDialog .pack-grid {display:grid;gap:12px;grid-template-columns:1fr 1fr;}
      #pixelPackDialog label {display:flex;align-items:center;gap:8px;font-size:13px;color:#e4e7ed;}
      #pixelPackDialog select,#pixelPackDialog input[type=file],#pixelPackDialog input[type=number] {width:100%;box-sizing:border-box;border-radius:6px;border:1px solid #555a63;background:#151619;color:#eceef3;padding:8px;font-size:13px;}
      #pixelPackDialog label.pack-select {display:grid;gap:6px;}
      #pixelPackDialog .pack-options {display:grid;gap:10px;background:#18191c;padding:14px;border-radius:8px;}
      #pixelPackDialog .pack-options input {accent-color:#52b876;}
      #pixelPackDialog .pack-preview {background:#17181b;border:1px solid #353943;border-radius:8px;padding:12px;font-size:12px;line-height:1.6;color:#c3c8d1;}
      #pixelPackDialog .pack-preview strong {font-size:13px;color:#eef2f7;}
      #pixelPackDialog .pack-preview small {display:block;color:#969ca9;margin-top:4px;}
      #pixelPackDialog .pack-status {font-size:12px;color:#84d5a3;min-height:16px;line-height:1.4;overflow-wrap:anywhere;}
      #pixelPackDialog .pack-status.error {color:#ff9898;}
      #pixelPackDialog .pack-actions {display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;}
      #pixelPackDialog button {padding:9px 13px;border:1px solid #535762;border-radius:7px;background:#30333b;color:white;cursor:pointer;}
      #pixelPackDialog button.pack-primary {background:#2c8c58;border-color:#3fa870;color:white;font-weight:650;}
      #pixelPackDialog button:disabled {opacity:.55;cursor:wait;}
      #pixelPackDialog button:focus-visible,#pixelPackDialog input:focus-visible,#pixelPackDialog select:focus-visible {outline:2px solid #78dca5;outline-offset:2px;}
      @media(max-width:540px) {#pixelPackDialog .pack-grid{grid-template-columns:1fr}#pixelPackDialog .pack-form{padding:15px;}}
    `; document.head.appendChild(css);
    const dialog = document.createElement('dialog'); dialog.id = 'pixelPackDialog';
    dialog.setAttribute('aria-labelledby', 'pixelPackHeading');
    dialog.innerHTML = `<form class="pack-form" method="dialog" id="pixelPackForm">
      <header><h2 id="pixelPackHeading">Export Asset Pack</h2><p>Download editable sources, transparent frame PNGs, atlases and engine guides together in one ZIP.</p></header>
      <div class="pack-grid"><label class="pack-select">Engine target<select id="pixelPackEngine"><option value="all">All supported engines</option><option value="unity">Unity</option><option value="godot">Godot</option><option value="unreal">Unreal Paper2D</option><option value="generic">Generic PNG + JSON</option></select></label><label class="pack-select">Add existing .npx projects<input id="pixelPackFiles" type="file" multiple accept=".npx" aria-label="Other editable projects to include"></label></div>
      <div class="pack-grid"><label class="pack-select">Atlas padding (px)<input id="pixelPackPadding" type="number" min="0" max="16" value="0"></label><label class="pack-select">Frame spacing (px)<input id="pixelPackSpacing" type="number" min="0" max="16" value="0"></label></div>
      <div class="pack-options"><label><input id="pixelPackSource" type="checkbox" checked>Editable source projects (.npx)</label><label><input id="pixelPackRaw" type="checkbox" checked>Raw transparent frame PNGs</label><label><input id="pixelPackAtlas" type="checkbox" checked>Sprite sheets + JSON atlases</label><label><input id="pixelPackGif" type="checkbox">GIF preview (active project only)</label></div>
      <div class="pack-preview"><strong id="pixelPackCount">1 project in this archive</strong><div id="pixelPackPreview"></div><small>ZIP includes README.md, manifest.json and engine import guides. Native Unity/Unreal assets are not generated.</small></div>
      <div id="pixelPackStatus" class="pack-status" role="status" aria-live="polite"></div>
      <div class="pack-actions"><button type="button" id="pixelPackCancel" hidden>Cancel export</button><button type="button" id="pixelPackClose">Close</button><button type="button" id="pixelPackCreate" class="pack-primary">Download ZIP</button></div>
    </form>`;
    document.body.appendChild(dialog);
    const currentButton = $('exportBtn'), replacement = currentButton.cloneNode(true);
    replacement.removeAttribute('data-action'); replacement.setAttribute('title', 'Export a complete engine-ready ZIP pack');
    currentButton.replaceWith(replacement);
    replacement.addEventListener('click', () => openWizard());
    const fileMenu = $('menu-file'); if (fileMenu) {
      const b = document.createElement('button'); b.textContent = 'Export complete asset pack ZIP';
      b.addEventListener('click', () => openWizard());
      fileMenu.insertBefore(b, fileMenu.querySelector('[data-action="png"]') || null);
    }
    const prev = prefs(); if (prev.engine && [...engines, 'all'].includes(prev.engine)) $('pixelPackEngine').value = prev.engine;
    for (const key of ['padding', 'spacing']) if (Number.isInteger(prev[key]) && prev[key] >= 0 && prev[key] <= 16) $(`pixelPack${key[0].toUpperCase() + key.slice(1)}`).value = prev[key];
    for (const key of ['raw', 'source', 'atlas', 'gif']) if (typeof prev[key] === 'boolean') $(`pixelPack${key[0].toUpperCase() + key.slice(1)}`).checked = prev[key];
    for (const element of dialog.querySelectorAll('input,select')) element.addEventListener('change', preview);
    $('pixelPackCreate').addEventListener('click', runExport);
    $('pixelPackClose').addEventListener('click', () => dialog.close());
    $('pixelPackCancel').addEventListener('click', () => { abort = true; feedback('Cancelling after current frame…'); });
    dialog.addEventListener('cancel', event => { if ($('pixelPackCreate').disabled) { event.preventDefault(); abort = true; feedback('Cancelling after current frame…'); } });
    preview();
  }
  function openWizard() {
    document.querySelectorAll('.menu-group.open').forEach(x => x.classList.remove('open'));
    $('pixelPackStatus').textContent = '';
    preview(); $('pixelPackDialog').showModal();
  }
  window.OpenPixelPack = { ZipStore, verifyProject, normalizeName, layout, generate, install, openWizard };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();

'use strict';

(function () {
  const NS = (window.Patronen2026 = window.Patronen2026 || {});

  function qs(id) {
    return document.getElementById(id);
  }

  class MenuController {
    constructor(options) {
      this.toggle = qs('menuToggle');
      this.nav = qs('topnav');
      this.onRightViewSelect = options && typeof options.onRightViewSelect === 'function' ? options.onRightViewSelect : null;
      this.onAction = options && typeof options.onAction === 'function' ? options.onAction : null;
    }

    init() {
      if (!(this.toggle instanceof HTMLElement)) return;
      if (!(this.nav instanceof HTMLElement)) return;
      if (this.toggle.dataset.bound === '1') return;
      this.toggle.dataset.bound = '1';

      this.toggle.addEventListener('click', () => {
        const isOpen = document.body.classList.toggle('menu-open');
        this.toggle.setAttribute('aria-expanded', String(isOpen));
      });

      // Close collapsed menu when a link is clicked.
      this.nav.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        if (target.tagName !== 'A') return;

        const action = target.dataset ? target.dataset.appAction : '';
        if (action && this.onAction) {
          event.preventDefault();
          this.onAction(action);
        }

        const view = target.dataset ? target.dataset.rightView : '';
        if (view && this.onRightViewSelect) {
          event.preventDefault();
          this.onRightViewSelect(view);
        }

        if (window.matchMedia('(max-width: 700px)').matches) {
          document.body.classList.remove('menu-open');
          this.toggle.setAttribute('aria-expanded', 'false');
        }
      });
    }
  }

  class SavedImagesDB {
    constructor() {
      this.dbName = 'Patronen2026';
      this.storeName = 'savedImages';
      this.version = 2;
      this.dbPromise = null;
    }

    open() {
      if (this.dbPromise) return this.dbPromise;
      this.dbPromise = new Promise((resolve, reject) => {
        if (!('indexedDB' in window)) {
          reject(new Error('IndexedDB not available'));
          return;
        }

        const req = indexedDB.open(this.dbName, this.version);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName, { keyPath: 'id' });
          }

          // Ensure future stores exist as the app evolves.
          if (!db.objectStoreNames.contains('savedShapes')) {
            db.createObjectStore('savedShapes', { keyPath: 'id' });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error || new Error('Failed to open IndexedDB'));
      });
      return this.dbPromise;
    }

    put(record) {
      return this.open().then(
        (db) =>
          new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            store.put(record);
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error || new Error('IndexedDB write failed'));
          })
      );
    }

    getAll() {
      return this.open().then(
        (db) =>
          new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readonly');
            const store = tx.objectStore(this.storeName);
            const req = store.getAll();
            req.onsuccess = () => resolve(Array.isArray(req.result) ? req.result : []);
            req.onerror = () => reject(req.error || new Error('IndexedDB read failed'));
          })
      );
    }

    get(id) {
      const key = typeof id === 'string' ? id : '';
      if (!key) return Promise.resolve(null);
      return this.open().then(
        (db) =>
          new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readonly');
            const store = tx.objectStore(this.storeName);
            const req = store.get(key);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => reject(req.error || new Error('IndexedDB read failed'));
          })
      );
    }

    delete(id) {
      const key = typeof id === 'string' ? id : '';
      if (!key) return Promise.resolve(false);
      return this.open().then(
        (db) =>
          new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            store.delete(key);
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error || new Error('IndexedDB delete failed'));
          })
      );
    }
  }

  class SavedShapesDB {
    constructor() {
      this.dbName = 'Patronen2026';
      this.storeName = 'savedShapes';
      this.version = 2;
      this.dbPromise = null;
    }

    open() {
      if (this.dbPromise) return this.dbPromise;
      this.dbPromise = new Promise((resolve, reject) => {
        if (!('indexedDB' in window)) {
          reject(new Error('IndexedDB not available'));
          return;
        }

        const req = indexedDB.open(this.dbName, this.version);
        req.onupgradeneeded = () => {
          const db = req.result;

          if (!db.objectStoreNames.contains('savedImages')) {
            db.createObjectStore('savedImages', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName, { keyPath: 'id' });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error || new Error('Failed to open IndexedDB'));
      });
      return this.dbPromise;
    }

    put(record) {
      return this.open().then(
        (db) =>
          new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            store.put(record);
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error || new Error('IndexedDB write failed'));
          })
      );
    }

    getAll() {
      return this.open().then(
        (db) =>
          new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readonly');
            const store = tx.objectStore(this.storeName);
            const req = store.getAll();
            req.onsuccess = () => resolve(Array.isArray(req.result) ? req.result : []);
            req.onerror = () => reject(req.error || new Error('IndexedDB read failed'));
          })
      );
    }

    get(id) {
      const key = typeof id === 'string' ? id : '';
      if (!key) return Promise.resolve(null);
      return this.open().then(
        (db) =>
          new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readonly');
            const store = tx.objectStore(this.storeName);
            const req = store.get(key);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => reject(req.error || new Error('IndexedDB read failed'));
          })
      );
    }
  }

  class PanelsController {
    constructor() {
      this.leftEdge = qs('leftEdge');
      this.rightEdge = qs('rightEdge');
      this.leftClose = qs('leftClose');
      this.rightClose = qs('rightClose');
    }

    init() {
      if (this.leftClose && this.leftClose.dataset.bound !== '1') {
        this.leftClose.dataset.bound = '1';
        this.leftClose.addEventListener('click', () => {
          document.body.classList.add('left-collapsed');
        });
      }

      if (this.rightClose && this.rightClose.dataset.bound !== '1') {
        this.rightClose.dataset.bound = '1';
        this.rightClose.addEventListener('click', () => {
          document.body.classList.add('right-collapsed');
        });
      }

      const openLeft = () => document.body.classList.remove('left-collapsed');
      const openRight = () => document.body.classList.remove('right-collapsed');

      if (this.leftEdge && this.leftEdge.dataset.bound !== '1') {
        this.leftEdge.dataset.bound = '1';
        this.leftEdge.addEventListener('mouseenter', openLeft);
        this.leftEdge.addEventListener('click', openLeft);
      }

      if (this.rightEdge && this.rightEdge.dataset.bound !== '1') {
        this.rightEdge.dataset.bound = '1';
        this.rightEdge.addEventListener('mouseenter', openRight);
        this.rightEdge.addEventListener('click', openRight);
      }
    }
  }

  class PatternCanvasLayers {
    constructor(canvas) {
      this.canvas = canvas instanceof HTMLCanvasElement ? canvas : null;
      this.layers = [];
      this.pendingDraw = 0;
      this.imageCache = new Map();
	  this.svgTextCache = new Map();
	  this.variantCache = new Map();
	  this.savedImageCache = new Map();
      this.drawQueue = Promise.resolve();

      this.computeQueue = Promise.resolve();
      this.visibleColorsTimers = new Map();
      this.visibleColorsTokens = new Map();
      this.visibleColorsPromises = new Map();

      this.cssRgbCache = new Map();

      this.offscreenCanvas = null;
      this.offscreenCtx = null;
    }

    cancelAllVisibleColorsSchedules() {
      for (const t of this.visibleColorsTimers.values()) {
        if (t) window.clearTimeout(t);
      }
      this.visibleColorsTimers.clear();
      this.visibleColorsTokens.clear();
      this.visibleColorsPromises.clear();
    }

    clearAllLayers() {
      // Cancel scheduled work first.
      this.cancelAllVisibleColorsSchedules();

      if (this.pendingDraw) {
        window.clearTimeout(this.pendingDraw);
        this.pendingDraw = 0;
      }

      this.layers = [];
      this.drawQueue = Promise.resolve();

      const c = this.getContext();
      if (!c) return;
      this.resizeToCSSPixels();
      const rect = c.canvas.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      c.ctx.clearRect(0, 0, w, h);
    }

    removeLayerAt(layerIndex) {
      const idx = Number.isFinite(layerIndex) ? Math.trunc(layerIndex) : -1;
      if (idx < 0 || idx >= this.layers.length) return false;
      this.layers.splice(idx, 1);
      // Layer indices shift; cancel scheduled index-based work.
      this.cancelAllVisibleColorsSchedules();
      this.redrawAllLayers();
      return true;
    }

    reorderLayersByView(fromViewIndex, toViewIndex) {
      const fromV = Number.isFinite(fromViewIndex) ? Math.trunc(fromViewIndex) : -1;
      const toVRaw = Number.isFinite(toViewIndex) ? Math.trunc(toViewIndex) : -1;
      if (fromV < 0) return false;

      const view = this.layers.slice().reverse();
      if (fromV >= view.length) return false;

      let toV = toVRaw;
      if (toV < 0) toV = 0;
      if (toV > view.length) toV = view.length;
      if (toV === fromV || toV === fromV + 1) return false;

      const [moved] = view.splice(fromV, 1);
      const insertAt = toV > fromV ? Math.max(0, toV - 1) : toV;
      view.splice(insertAt, 0, moved);

      this.layers = view.reverse();
      // Layer indices shift; cancel scheduled index-based work.
      this.cancelAllVisibleColorsSchedules();
      this.redrawAllLayers();
      return true;
    }

    getOffscreenCtx(w, h) {
      const cw = Math.max(1, Math.round(w));
      const ch = Math.max(1, Math.round(h));
      if (!(this.offscreenCanvas instanceof HTMLCanvasElement)) {
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
      }

      const c = this.offscreenCanvas;
      if (!c) return null;
      if (c.width !== cw) c.width = cw;
      if (c.height !== ch) c.height = ch;
      if (!this.offscreenCtx) this.offscreenCtx = c.getContext('2d', { willReadFrequently: true });
      return this.offscreenCtx;
    }

    findLayerIndexByClipKey(clipKey) {
      if (typeof clipKey !== 'string' || !clipKey) return -1;
      for (let i = this.layers.length - 1; i >= 0; i--) {
        const layer = this.layers[i];
        if (layer && layer.clipKey === clipKey) return i;
      }
      return -1;
    }

    getCssSize() {
      if (!this.canvas) return null;
      const rect = this.canvas.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));
      return { w, h };
    }

    hexToRgb(hex) {
      const s = typeof hex === 'string' ? hex.trim() : '';
      if (!s.startsWith('#')) return null;
      const h = s.slice(1);
      if (h.length === 3) {
        const r = parseInt(h[0] + h[0], 16);
        const g = parseInt(h[1] + h[1], 16);
        const b = parseInt(h[2] + h[2], 16);
        if (![r, g, b].every(Number.isFinite)) return null;
        return [r, g, b];
      }
      if (h.length === 6) {
        const r = parseInt(h.slice(0, 2), 16);
        const g = parseInt(h.slice(2, 4), 16);
        const b = parseInt(h.slice(4, 6), 16);
        if (![r, g, b].every(Number.isFinite)) return null;
        return [r, g, b];
      }
      return null;
    }

    cssToRgb(color) {
      const s = typeof color === 'string' ? color.trim() : '';
      if (!s) return null;

      const cached = this.cssRgbCache.get(s);
      if (Array.isArray(cached) && cached.length === 3) return cached;

      const hex = this.hexToRgb(s);
      if (hex) {
        this.cssRgbCache.set(s, hex);
        return hex;
      }

      // Normalize via browser and parse rgb().
      const tmp = document.createElement('div');
      tmp.style.color = s;
      document.body.appendChild(tmp);
      const out = getComputedStyle(tmp).color;
      document.body.removeChild(tmp);
      const m = out.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
      if (!m) return null;
      const rgb = [Number(m[1]), Number(m[2]), Number(m[3])];
      if (rgb.every(Number.isFinite)) this.cssRgbCache.set(s, rgb);
      return rgb;
    }

    scheduleVisibleColorsCompute(layerIndex) {
      const idx = Number.isFinite(layerIndex) ? Math.trunc(layerIndex) : -1;
      if (idx < 0) return Promise.resolve();

      const expectedLayer = this.layers[idx];

      const prevTimer = this.visibleColorsTimers.get(idx);
      if (prevTimer) window.clearTimeout(prevTimer);

      const nextToken = (this.visibleColorsTokens.get(idx) || 0) + 1;
      this.visibleColorsTokens.set(idx, nextToken);

      let resolveDone = null;
      const done = new Promise((resolve) => {
        resolveDone = resolve;
      });
      this.visibleColorsPromises.set(idx, done);

      const run = () => {
        const token = this.visibleColorsTokens.get(idx);
        if (token !== nextToken) {
          if (resolveDone) resolveDone();
          return;
        }

        this.computeQueue = this.computeQueue
          .then(() => {
            const t = this.visibleColorsTokens.get(idx);
            if (t !== nextToken) return;
            if (this.layers[idx] !== expectedLayer) return;
            return this.computeVisibleColorsForLayerIndex(idx, expectedLayer);
          })
          .catch(() => {})
          .then(() => {
            if (resolveDone) resolveDone();
          });
      };

      const timer = window.setTimeout(() => {
        this.visibleColorsTimers.delete(idx);
        // Give drawing/UI a chance; compute in idle time when possible.
        if (typeof window.requestIdleCallback === 'function') {
          window.requestIdleCallback(() => run(), { timeout: 300 });
        } else {
          run();
        }
      }, 120);

      this.visibleColorsTimers.set(idx, timer);
      return done;
    }

    getLatestVisibleColorsPromise(layerIndex) {
      const idx = Number.isFinite(layerIndex) ? Math.trunc(layerIndex) : -1;
      if (idx < 0) return Promise.resolve();
      return this.visibleColorsPromises.get(idx) || Promise.resolve();
    }

    getClipBounds(clipPathN, w, h) {
      if (!Array.isArray(clipPathN) || clipPathN.length < 2) return null;
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const p of clipPathN) {
        if (!Array.isArray(p) || p.length < 2) continue;
        const x = p[0] * w;
        const y = p[1] * h;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
      if (![minX, minY, maxX, maxY].every(Number.isFinite)) return null;
      const x = Math.max(0, Math.floor(minX));
      const y = Math.max(0, Math.floor(minY));
      const r = Math.min(w, Math.ceil(maxX));
      const b = Math.min(h, Math.ceil(maxY));
      const bw = Math.max(0, r - x);
      const bh = Math.max(0, b - y);
      return { x, y, w: bw, h: bh };
    }

    addOptimisticVisibleColor(layer, color) {
      if (!layer) return;
      const c = typeof color === 'string' && color.trim() ? color.trim() : '';
      if (!c) return;
      if (!Array.isArray(layer.visibleColors)) layer.visibleColors = [];
      if (layer.visibleColors.includes(c)) return;
      layer.visibleColors.push(c);
    }

    drawPaintToCtx(ctx, w, h, img, repeatCount, clipPathN, tileScaleMode) {
      if (!ctx) return;
      const pattern = ctx.createPattern(img, 'repeat');
      if (!pattern) return;

      const iw = Math.max(1, img.naturalWidth || img.width || 1);
      const ih = Math.max(1, img.naturalHeight || img.height || 1);

      const count = Number.isFinite(repeatCount) ? repeatCount : 10;
      const clamped = Math.max(1, Math.min(100, Math.round(count)));

      let refW = w;
      let refH = h;
      if (clipPathN && tileScaleMode === 'shape') {
        const bw = this.getClipBoundsWidth(clipPathN, w);
        const bh = this.getClipBoundsHeight(clipPathN, h);
        if (Number.isFinite(bw) && bw > 0.5) refW = bw;
        if (Number.isFinite(bh) && bh > 0.5) refH = bh;
      }

      const ref = Math.max(0.5, Math.min(refW, refH));
      const tileSize = ref / clamped;
      const sx = Math.max(0.0001, tileSize / iw);
      const sy = Math.max(0.0001, tileSize / ih);

      ctx.save();
      ctx.globalCompositeOperation = 'source-over';

      if (clipPathN) {
        const ok = this.buildClipPath(ctx, clipPathN, w, h);
        if (ok) ctx.clip();
      }

      const prevSmoothing = ctx.imageSmoothingEnabled;
      const prevQuality = ctx.imageSmoothingQuality;
      ctx.imageSmoothingEnabled = true;
      if (typeof prevQuality === 'string') ctx.imageSmoothingQuality = 'high';

      ctx.scale(sx, sy);
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, w / sx, h / sy);

      ctx.imageSmoothingEnabled = prevSmoothing;
      if (typeof prevQuality === 'string') ctx.imageSmoothingQuality = prevQuality;

      ctx.restore();
    }

    drawSolidToCtx(ctx, w, h, color, clipPathN) {
      if (!ctx) return;
      const c = typeof color === 'string' && color.trim() ? color.trim() : '#000000';

      ctx.save();
      ctx.globalCompositeOperation = 'source-over';

      if (clipPathN) {
        const ok = this.buildClipPath(ctx, clipPathN, w, h);
        if (ok) ctx.clip();
      }

      ctx.fillStyle = c;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    computeVisibleColorsForLayerIndex(layerIndex, expectedLayer) {
      const size = this.getCssSize();
      if (!size) return Promise.resolve([]);

      const layer = this.layers && this.layers[layerIndex];
      if (!layer) return Promise.resolve([]);
      if (expectedLayer && layer !== expectedLayer) return Promise.resolve(Array.isArray(layer.visibleColors) ? layer.visibleColors : []);
      const clipPathN = layer.clipPathN;
      if (!Array.isArray(clipPathN) || clipPathN.length < 3) {
        // Non-clipped layer: just report its last paint color.
        const paints = Array.isArray(layer.paints) ? layer.paints : [];
        const last = paints[paints.length - 1];
        const c = last && typeof last.color === 'string' && last.color.trim() ? last.color.trim() : '';
        layer.visibleColors = c ? [c] : [];
        return Promise.resolve(layer.visibleColors);
      }

      const paints = Array.isArray(layer.paints) ? layer.paints.slice() : [];
      const candidates = [];
      const candidateRgb = [];
      const seen = new Set();
      for (const p of paints) {
        const c = p && typeof p.color === 'string' && p.color.trim() ? p.color.trim() : '';
        if (!c || seen.has(c)) continue;
        const rgb = this.cssToRgb(c);
        if (!rgb) continue;
        seen.add(c);
        candidates.push(c);
        candidateRgb.push(rgb);
      }
      if (candidates.length === 0) {
        layer.visibleColors = [];
        return Promise.resolve([]);
      }

      const ctx = this.getOffscreenCtx(size.w, size.h);
      if (!ctx) {
        layer.visibleColors = candidates.slice();
        return Promise.resolve(layer.visibleColors);
      }
      ctx.clearRect(0, 0, size.w, size.h);

      // Render this shape-layer only.
      let chain = Promise.resolve();
      for (const p of paints) {
        const kind = p ? p.kind : undefined;
        const color = p ? p.color : undefined;
        if (kind === 'solid' || !(p && p.file)) {
          this.drawSolidToCtx(ctx, size.w, size.h, color, clipPathN);
          continue;
        }
        const file = p.file;
        const repeatCount = p.repeatCount;
        const thickness = p.thickness;
        const tileScaleMode = p.tileScaleMode;
        chain = chain
		  .then(() => this.loadPatternVariantImage(file, color, thickness))
          .then((img) => {
            this.drawPaintToCtx(ctx, size.w, size.h, img, repeatCount, clipPathN, tileScaleMode);
          })
          .catch(() => {});
      }

      return chain.then(() => {
        const bounds = this.getClipBounds(clipPathN, size.w, size.h);
        const bx = bounds ? bounds.x : 0;
        const by = bounds ? bounds.y : 0;
        const bw = bounds ? bounds.w : size.w;
        const bh = bounds ? bounds.h : size.h;
        if (bw <= 0 || bh <= 0) {
          layer.visibleColors = [];
          return [];
        }

        const imgData = ctx.getImageData(bx, by, bw, bh);
        const data = imgData.data;
        const area = bw * bh;
        const maxSamples = 80000;
        const baseStep = Math.max(1, Math.ceil(Math.sqrt(area / maxSamples)));

        const present = new Array(candidates.length).fill(false);
        let presentCount = 0;
        const threshold = 65; // tolerate anti-aliasing/edges
        const thr2 = threshold * threshold;

        const scan = (step) => {
          for (let y = 0; y < bh; y += step) {
            for (let x = 0; x < bw; x += step) {
              const idx = (y * bw + x) * 4;
              const a = data[idx + 3];
              if (a < 4) continue;
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];

              for (let i = 0; i < candidateRgb.length; i++) {
                if (present[i]) continue;
                const cr = candidateRgb[i][0];
                const cg = candidateRgb[i][1];
                const cb = candidateRgb[i][2];
                const dr = r - cr;
                const dg = g - cg;
                const db = b - cb;
                const d2 = dr * dr + dg * dg + db * db;
                if (d2 <= thr2) {
                  present[i] = true;
                  presentCount++;
                  if (presentCount >= candidates.length) return;
                }
              }
            }
            if (presentCount >= candidates.length) return;
          }
        };

        scan(baseStep);
        if (presentCount < candidates.length && baseStep > 1) {
          const step2 = Math.max(1, Math.floor(baseStep / 2));
          if (step2 !== baseStep) scan(step2);
        }

        const out = [];
        for (let i = 0; i < candidates.length; i++) if (present[i]) out.push(candidates[i]);
        layer.visibleColors = out;
        return out;
      });
    }

    buildClipPath(ctx, clipPathN, w, h) {
      if (!ctx) return false;
      if (!Array.isArray(clipPathN) || clipPathN.length < 3) return false;

      const first = clipPathN[0];
      if (!Array.isArray(first) || first.length < 2) return false;

      const x0 = first[0] * w;
      const y0 = first[1] * h;

      ctx.beginPath();
      ctx.moveTo(x0, y0);
      for (let i = 1; i < clipPathN.length; i++) {
        const p = clipPathN[i];
        if (!Array.isArray(p) || p.length < 2) continue;
        ctx.lineTo(p[0] * w, p[1] * h);
      }
      ctx.closePath();
      return true;
    }

    getClipBoundsWidth(clipPathN, w) {
      if (!Array.isArray(clipPathN) || clipPathN.length < 2) return null;
      let minX = Infinity;
      let maxX = -Infinity;
      for (const p of clipPathN) {
        if (!Array.isArray(p) || p.length < 2) continue;
        const x = p[0] * w;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
      if (!Number.isFinite(minX) || !Number.isFinite(maxX)) return null;
      return Math.max(0, maxX - minX);
    }

    getClipBoundsHeight(clipPathN, h) {
      if (!Array.isArray(clipPathN) || clipPathN.length < 2) return null;
      let minY = Infinity;
      let maxY = -Infinity;
      for (const p of clipPathN) {
        if (!Array.isArray(p) || p.length < 2) continue;
        const y = p[1] * h;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      if (!Number.isFinite(minY) || !Number.isFinite(maxY)) return null;
      return Math.max(0, maxY - minY);
    }

    getContext() {
      if (!this.canvas) return null;
      const ctx = this.canvas.getContext('2d');
      if (!ctx) return null;
      return { canvas: this.canvas, ctx };
    }

    resizeToCSSPixels() {
      const c = this.getContext();
      if (!c) return;

      const rect = c.canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const nextW = Math.max(1, Math.round(rect.width * dpr));
      const nextH = Math.max(1, Math.round(rect.height * dpr));
      if (c.canvas.width !== nextW) c.canvas.width = nextW;
      if (c.canvas.height !== nextH) c.canvas.height = nextH;

      // Draw in CSS pixel space.
      c.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    loadPatternImage(file) {
      const cached = this.imageCache.get(file);
      if (cached && cached.img && cached.img.complete) return Promise.resolve(cached.img);
      if (cached && cached.promise) return cached.promise;

      const img = new Image();
      const promise = new Promise((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load pattern image: ${file}`));
      });

      this.imageCache.set(file, { img, promise });
      img.src = `./patronen/${file}`;
      return promise;
    }

  loadSvgText(file) {
    const cached = this.svgTextCache.get(file);
    if (typeof cached === 'string') return Promise.resolve(cached);
    if (cached && cached.promise) return cached.promise;

    const url = `./patronen/${file}`;
    const promise = fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch SVG: ${file}`);
        return res.text();
      })
      .then((text) => {
        this.svgTextCache.set(file, text);
        return text;
      });

    this.svgTextCache.set(file, { promise });
    return promise;
  }

  buildSvgVariant(svgText, color, thickness) {
    const safeColor = typeof color === 'string' && color.trim() ? color.trim() : '#000000';
    const t = Number.isFinite(thickness) ? Math.round(thickness) : 1;
    const clamped = Math.max(1, Math.min(100, t));

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, 'image/svg+xml');
    const svg = doc.documentElement;
    if (svg) svg.setAttribute('overflow', 'visible');

    const stroked = Array.from(doc.querySelectorAll('[stroke]'));
    if (stroked.length === 0 && svg) {
      svg.setAttribute('stroke', safeColor);
    } else {
      for (const el of stroked) {
        el.setAttribute('stroke', safeColor);
      }
    }

    const widths = Array.from(doc.querySelectorAll('[stroke-width]'));
    if (widths.length === 0 && svg) {
      svg.setAttribute('stroke-width', String(clamped));
    } else {
      for (const el of widths) {
        el.setAttribute('stroke-width', String(clamped));
      }
    }

    const serializer = new XMLSerializer();
    return serializer.serializeToString(doc);
  }

  loadPatternVariantImage(file, color, thickness) {
    const safeColor = typeof color === 'string' && color.trim() ? color.trim() : '#000000';
    const t = Number.isFinite(thickness) ? Math.round(thickness) : 1;
    const clamped = Math.max(1, Math.min(100, t));
    const key = `${file}|${safeColor}|${clamped}`;

    const cached = this.variantCache.get(key);
    if (cached && cached.img && cached.img.complete) return Promise.resolve(cached.img);
    if (cached && cached.promise) return cached.promise;

    const img = new Image();
    const promise = this.loadSvgText(file)
      .then((svgText) => this.buildSvgVariant(svgText, safeColor, clamped))
      .then((variantText) =>
        new Promise((resolve, reject) => {
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error(`Failed to load variant SVG image: ${file}`));
          const blob = new Blob([variantText], { type: 'image/svg+xml' });
          const blobUrl = URL.createObjectURL(blob);
          img.onload = () => {
            URL.revokeObjectURL(blobUrl);
            resolve(img);
          };
          img.onerror = () => {
            URL.revokeObjectURL(blobUrl);
            reject(new Error(`Failed to load variant SVG image: ${file}`));
          };
          img.src = blobUrl;
        })
      );

    this.variantCache.set(key, { img, promise });
    return promise;
  }

  drawLayer(img, repeatCount, clipPathN, tileScaleMode) {
      const c = this.getContext();
      if (!c) return;

      const rect = c.canvas.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);

      const pattern = c.ctx.createPattern(img, 'repeat');
      if (!pattern) return;

      const iw = Math.max(1, img.naturalWidth || img.width || 1);
      const ih = Math.max(1, img.naturalHeight || img.height || 1);

      const count = Number.isFinite(repeatCount) ? repeatCount : 10;
      const clamped = Math.max(1, Math.min(100, Math.round(count)));

      let refW = w;
      let refH = h;
      if (clipPathN && tileScaleMode === 'shape') {
        const bw = this.getClipBoundsWidth(clipPathN, w);
        const bh = this.getClipBoundsHeight(clipPathN, h);
        if (Number.isFinite(bw) && bw > 0.5) refW = bw;
        if (Number.isFinite(bh) && bh > 0.5) refH = bh;
      }

      const ref = Math.max(0.5, Math.min(refW, refH));
      const tileSize = ref / clamped;
  		const sx = Math.max(0.0001, tileSize / iw);
  		const sy = Math.max(0.0001, tileSize / ih);

      c.ctx.save();
      c.ctx.globalCompositeOperation = 'source-over';

      if (clipPathN) {
        const ok = this.buildClipPath(c.ctx, clipPathN, w, h);
        if (ok) c.ctx.clip();
      }

      // Anti-aliasing for smoother diagonal lines when the pattern is scaled.
      const prevSmoothing = c.ctx.imageSmoothingEnabled;
      const prevQuality = c.ctx.imageSmoothingQuality;
      c.ctx.imageSmoothingEnabled = true;
      if (typeof prevQuality === 'string') c.ctx.imageSmoothingQuality = 'high';

      // Scale the pattern so it repeats N times across the canvas.
      // We scale the drawing context (not the bitmap) to avoid clearing.
      c.ctx.scale(sx, sy);
      c.ctx.fillStyle = pattern;
      c.ctx.fillRect(0, 0, w / sx, h / sy);

      c.ctx.imageSmoothingEnabled = prevSmoothing;
      if (typeof prevQuality === 'string') c.ctx.imageSmoothingQuality = prevQuality;

      c.ctx.restore();
    }

    loadSavedImageFromBlob(id, blob) {
      const key = typeof id === 'string' && id ? id : `blob:${Math.random().toString(16).slice(2)}`;
      if (!(blob instanceof Blob)) return Promise.reject(new Error('Invalid image blob'));

      const cached = this.savedImageCache.get(key);
      if (cached && cached.img && cached.img.complete) return Promise.resolve(cached.img);
      if (cached && cached.promise) return cached.promise;

      const img = new Image();
      const promise = new Promise((resolve, reject) => {
        const blobUrl = URL.createObjectURL(blob);
        img.onload = () => {
          URL.revokeObjectURL(blobUrl);
          resolve(img);
        };
        img.onerror = () => {
          URL.revokeObjectURL(blobUrl);
          reject(new Error('Failed to load saved image'));
        };
        img.src = blobUrl;
      });

      this.savedImageCache.set(key, { img, promise });
      return promise;
    }

    drawPlacedImageToCtx(ctx, w, h, img, placement) {
      if (!ctx || !img || !placement) return;
      const xN = Number.isFinite(placement.xN) ? placement.xN : 0;
      const yN = Number.isFinite(placement.yN) ? placement.yN : 0;
      const wN = Number.isFinite(placement.wN) ? placement.wN : 0.25;
      const hN = Number.isFinite(placement.hN) ? placement.hN : 0.25;

      const x = xN * w;
      const y = yN * h;
      const dw = Math.max(1, wN * w);
      const dh = Math.max(1, hN * h);

      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      const prevSmoothing = ctx.imageSmoothingEnabled;
      const prevQuality = ctx.imageSmoothingQuality;
      ctx.imageSmoothingEnabled = true;
      if (typeof prevQuality === 'string') ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, x, y, dw, dh);
      ctx.imageSmoothingEnabled = prevSmoothing;
      if (typeof prevQuality === 'string') ctx.imageSmoothingQuality = prevQuality;
      ctx.restore();
    }

    drawSolidLayer(color, clipPathN) {
      const c = this.getContext();
      if (!c) return;
      const rect = c.canvas.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      this.drawSolidToCtx(c.ctx, w, h, color, clipPathN);
    }

    redrawAllLayers() {
      const c = this.getContext();
      if (!c) return;
      if (this.layers.length === 0) return;

      if (this.pendingDraw) {
        window.clearTimeout(this.pendingDraw);
        this.pendingDraw = 0;
      }

      this.resizeToCSSPixels();
      const rect = c.canvas.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      c.ctx.clearRect(0, 0, w, h);

      this.drawQueue = Promise.resolve();
      for (const layer of this.layers) {
        const clipPathN = layer && layer.clipPathN ? layer.clipPathN : null;
        const paints = layer && Array.isArray(layer.paints) && layer.paints.length
          ? layer.paints
          : [
              {
                file: layer ? layer.file : undefined,
                repeatCount: layer ? layer.repeatCount : undefined,
                color: layer ? layer.color : undefined,
                thickness: layer ? layer.thickness : undefined,
                tileScaleMode: layer ? layer.tileScaleMode : undefined,
              },
            ];

        for (const paint of paints) {
          const kind = paint ? paint.kind : undefined;
          if (kind === 'image' && paint && paint.blob instanceof Blob) {
            const imageId = paint && typeof paint.imageId === 'string' ? paint.imageId : '';
            const blob = paint.blob;
            const placement = {
              xN: paint.xN,
              yN: paint.yN,
              wN: paint.wN,
              hN: paint.hN,
            };

            this.drawQueue = this.drawQueue
              .then(() => this.loadSavedImageFromBlob(imageId, blob))
              .then((img) => {
                this.resizeToCSSPixels();
                const c2 = this.getContext();
                if (!c2) return;
                const rect2 = c2.canvas.getBoundingClientRect();
                const w2 = Math.max(1, rect2.width);
                const h2 = Math.max(1, rect2.height);
                this.drawPlacedImageToCtx(c2.ctx, w2, h2, img, placement);
              })
              .catch(() => {});
            continue;
          }
          if (kind === 'solid' || !(paint && paint.file)) {
            const color = paint ? paint.color : undefined;
            this.drawQueue = this.drawQueue
              .then(() => {
                this.resizeToCSSPixels();
                this.drawSolidLayer(color, clipPathN);
              })
              .catch(() => {});
            continue;
          }

          const file = paint ? paint.file : undefined;
          if (!file) continue;
          const repeatCount = paint ? paint.repeatCount : undefined;
          const color = paint ? paint.color : undefined;
          const thickness = paint ? paint.thickness : undefined;
          const tileScaleMode = paint ? paint.tileScaleMode : undefined;

          this.drawQueue = this.drawQueue
			.then(() => this.loadPatternVariantImage(file, color, thickness))
            .then((img) => {
              this.resizeToCSSPixels();
				this.drawLayer(img, repeatCount, clipPathN, tileScaleMode);
            })
            .catch(() => {});
        }
      }
    }

    addLayer(file, repeatCount, color, thickness) {
      this.layers.push({
        clipPathN: null,
        clipKey: null,
        paints: [{ file, repeatCount, color, thickness, tileScaleMode: 'canvas' }],
      });
      if (this.layers.length === 1) this.resizeToCSSPixels();

      if (this.pendingDraw) window.clearTimeout(this.pendingDraw);
      this.pendingDraw = window.setTimeout(() => {
        this.pendingDraw = 0;
        this.drawQueue = this.drawQueue
			.then(() => this.loadPatternVariantImage(file, color, thickness))
          .then((img) => {
            // Draw the new transparent layer over the existing canvas content.
				this.drawLayer(img, repeatCount, null, 'canvas');
          })
          .catch(() => {});
      }, 0);
    }

    addImageLayer(imageId, blob, xN, yN, wN, hN) {
      const id = typeof imageId === 'string' ? imageId : '';
      const placement = {
        xN: Number.isFinite(xN) ? xN : 0,
        yN: Number.isFinite(yN) ? yN : 0,
        wN: Number.isFinite(wN) ? wN : 0.25,
        hN: Number.isFinite(hN) ? hN : 0.25,
      };

      this.layers.push({
        clipPathN: null,
        clipKey: null,
        paints: [
          {
            kind: 'image',
            imageId: id,
            blob,
            xN: placement.xN,
            yN: placement.yN,
            wN: placement.wN,
            hN: placement.hN,
          },
        ],
      });

      const layerIndex = this.layers.length - 1;
      if (this.layers.length === 1) this.resizeToCSSPixels();

      if (this.pendingDraw) window.clearTimeout(this.pendingDraw);
      this.pendingDraw = window.setTimeout(() => {
        this.pendingDraw = 0;
        this.drawQueue = this.drawQueue
          .then(() => this.loadSavedImageFromBlob(id, blob))
          .then((img) => {
            this.resizeToCSSPixels();
            const c = this.getContext();
            if (!c) return;
            const rect = c.canvas.getBoundingClientRect();
            const w = Math.max(1, rect.width);
            const h = Math.max(1, rect.height);
            this.drawPlacedImageToCtx(c.ctx, w, h, img, placement);
          })
          .catch(() => {});
      }, 0);

      return layerIndex;
    }

    addClippedLayer(file, repeatCount, color, thickness, clipPathN, tileScaleMode, clipKey) {
      const safeClipN = Array.isArray(clipPathN) ? clipPathN.slice() : null;
      const mode = tileScaleMode === 'shape' ? 'shape' : 'canvas';
      const safeKey = typeof clipKey === 'string' && clipKey ? clipKey : null;

      let layerIndex = -1;
      if (safeKey) layerIndex = this.findLayerIndexByClipKey(safeKey);

      if (layerIndex >= 0) {
        const layer = this.layers[layerIndex];
        if (layer) {
          layer.clipPathN = safeClipN;
          layer.clipKey = safeKey;
          if (!Array.isArray(layer.paints)) layer.paints = [];
          layer.paints.push({ file, repeatCount, color, thickness, tileScaleMode: mode });

          // Make the UI reflect the latest chosen color immediately.
          this.addOptimisticVisibleColor(layer, color);
        }
      } else {
        this.layers.push({
          clipPathN: safeClipN,
          clipKey: safeKey,
          paints: [{ file, repeatCount, color, thickness, tileScaleMode: mode }],
        });
        layerIndex = this.layers.length - 1;

        const layer = this.layers[layerIndex];
        this.addOptimisticVisibleColor(layer, color);
      }

      if (this.layers.length === 1) this.resizeToCSSPixels();

      const needsFullRedraw = layerIndex >= 0 && layerIndex < this.layers.length - 1;

      if (this.pendingDraw) window.clearTimeout(this.pendingDraw);
      this.pendingDraw = window.setTimeout(() => {
        this.pendingDraw = 0;

        if (needsFullRedraw) {
          this.redrawAllLayers();
          return;
        }

        this.drawQueue = this.drawQueue
			.then(() => this.loadPatternVariantImage(file, color, thickness))
          .then((img) => {
            this.drawLayer(img, repeatCount, safeClipN, mode);
          })
          .catch(() => {});
      }, 0);

      // Recompute which colors are actually still visible for this shape-layer.
      this.scheduleVisibleColorsCompute(layerIndex);

      return layerIndex;
    }

    addClippedSolidLayer(color, clipPathN, clipKey) {
      const safeClipN = Array.isArray(clipPathN) ? clipPathN.slice() : null;
      const safeKey = typeof clipKey === 'string' && clipKey ? clipKey : null;

      let layerIndex = -1;
      if (safeKey) layerIndex = this.findLayerIndexByClipKey(safeKey);

      if (layerIndex >= 0) {
        const layer = this.layers[layerIndex];
        if (layer) {
          layer.clipPathN = safeClipN;
          layer.clipKey = safeKey;
          if (!Array.isArray(layer.paints)) layer.paints = [];
          layer.paints.push({ kind: 'solid', file: null, color });
          this.addOptimisticVisibleColor(layer, color);
        }
      } else {
        this.layers.push({
          clipPathN: safeClipN,
          clipKey: safeKey,
          paints: [{ kind: 'solid', file: null, color }],
        });
        layerIndex = this.layers.length - 1;
        const layer = this.layers[layerIndex];
        this.addOptimisticVisibleColor(layer, color);
      }

      if (this.layers.length === 1) this.resizeToCSSPixels();

      const needsFullRedraw = layerIndex >= 0 && layerIndex < this.layers.length - 1;

      if (this.pendingDraw) window.clearTimeout(this.pendingDraw);
      this.pendingDraw = window.setTimeout(() => {
        this.pendingDraw = 0;

        if (needsFullRedraw) {
          this.redrawAllLayers();
          return;
        }

        this.drawQueue = this.drawQueue
          .then(() => {
            this.drawSolidLayer(color, safeClipN);
          })
          .catch(() => {});
      }, 0);

      this.scheduleVisibleColorsCompute(layerIndex);
      return layerIndex;
    }

    addSolidLayer(color) {
      const c = typeof color === 'string' && color.trim() ? color.trim() : '#000000';
      this.layers.push({
        clipPathN: null,
        clipKey: null,
        paints: [{ kind: 'solid', file: null, color: c }],
        visibleColors: [c],
      });

      const layerIndex = this.layers.length - 1;
      if (this.layers.length === 1) this.resizeToCSSPixels();

      if (this.pendingDraw) window.clearTimeout(this.pendingDraw);
      this.pendingDraw = window.setTimeout(() => {
        this.pendingDraw = 0;
        this.drawQueue = this.drawQueue
          .then(() => {
            this.drawSolidLayer(c, null);
          })
          .catch(() => {});
      }, 0);

      return layerIndex;
    }

    addSolidPaintToLayerIndex(layerIndex, color) {
      const idx = Number.isFinite(layerIndex) ? Math.trunc(layerIndex) : -1;
      const layer = this.layers && this.layers[idx];
      if (!layer) return false;

      const c = typeof color === 'string' && color.trim() ? color.trim() : '#000000';
      if (!Array.isArray(layer.paints)) layer.paints = [];
      layer.paints.push({ kind: 'solid', file: null, color: c });

      const clipPathN = Array.isArray(layer.clipPathN) ? layer.clipPathN : null;
      if (!clipPathN) layer.visibleColors = [c];
      else this.addOptimisticVisibleColor(layer, c);

      if (this.pendingDraw) window.clearTimeout(this.pendingDraw);
      this.pendingDraw = window.setTimeout(() => {
        this.pendingDraw = 0;

        const needsFullRedraw = idx >= 0 && idx < this.layers.length - 1;
        if (needsFullRedraw) {
          this.redrawAllLayers();
          return;
        }

        this.drawQueue = this.drawQueue
          .then(() => {
            this.drawSolidLayer(c, clipPathN);
          })
          .catch(() => {});
      }, 0);

      if (clipPathN) this.scheduleVisibleColorsCompute(idx);
      return true;
    }

    addPatternPaintToLayerIndex(layerIndex, file, repeatCount, color, thickness, tileScaleMode) {
      const idx = Number.isFinite(layerIndex) ? Math.trunc(layerIndex) : -1;
      const layer = this.layers && this.layers[idx];
      if (!layer) return false;

      const f = typeof file === 'string' ? file.trim() : '';
      if (!f) return false;

      const c = typeof color === 'string' && color.trim() ? color.trim() : '#000000';
      const mode = tileScaleMode === 'shape' ? 'shape' : 'canvas';

      if (!Array.isArray(layer.paints)) layer.paints = [];
      layer.paints.push({ file: f, repeatCount, color: c, thickness, tileScaleMode: mode });

      const clipPathN = Array.isArray(layer.clipPathN) ? layer.clipPathN : null;
      if (clipPathN) this.addOptimisticVisibleColor(layer, c);

      if (this.pendingDraw) window.clearTimeout(this.pendingDraw);
      this.pendingDraw = window.setTimeout(() => {
        this.pendingDraw = 0;

        const needsFullRedraw = idx >= 0 && idx < this.layers.length - 1;
        if (needsFullRedraw) {
          this.redrawAllLayers();
          return;
        }

        this.drawQueue = this.drawQueue
          .then(() => this.loadPatternVariantImage(f, c, thickness))
          .then((img) => {
            this.drawLayer(img, repeatCount, clipPathN, mode);
          })
          .catch(() => {});
      }, 0);

      if (clipPathN) this.scheduleVisibleColorsCompute(idx);
      return true;
    }

    hasLayers() {
      return this.layers.length > 0;
    }
  }

  class PatternPickerController {
    constructor() {
      this.select = qs('patternSelect');
      this.preview = qs('patternPreview');
      this.rightViewStart = qs('rightViewStart');
      this.rightViewPatterns = qs('rightViewPatterns');
      this.rightViewColors = qs('rightViewColors');
      this.rightViewImages = qs('rightViewImages');
      this.rightViewShapes = qs('rightViewShapes');
      this.savedImagesRoot = qs('savedImages');
      this.savedShapesRoot = qs('savedShapes');
      this.saveShapeBtn = qs('saveShapeBtn');
      this.canvas = qs('mainCanvas');
      this.layersRoot = qs('layersRoot');
	  this.cropToolBtn = qs('cropToolBtn');
	  this.saveImageBtn = qs('saveImageBtn');
	  this.exportPdfBtn = qs('exportPdfBtn');
    this.clearConceptBtn = qs('clearConceptBtn');
      this.repeat = qs('patternRepeat');
      this.repeatValue = qs('patternRepeatValue');
      this.palette = qs('palette');
    this.colorBarPrimary = qs('colorBarPrimary');
    this.colorBarComplement = qs('colorBarComplement');
    this.colorBarSupportA = qs('colorBarSupportA');
    this.colorBarSupportB = qs('colorBarSupportB');
    this.colorMixCanvas = qs('colorMixCanvas');
    this.colorMixCanvasPatterns = qs('colorMixCanvasPatterns');
    this.colorMixCanvasShapes = qs('colorMixCanvasShapes');
	  this.thickness = qs('patternThickness');
	  this.thicknessValue = qs('patternThicknessValue');
      this.tileScaleToShape = qs('tileScaleToShape');

      this.conceptInput = qs('conceptInput');
      this.descriptionInput = qs('descriptionInput');

    this.modeDrawBtn = qs('modeDrawBtn');
    this.modeSelectBtn = qs('modeSelectBtn');
    this.interactionMode = 'draw'; // 'draw' | 'select'

    this.rightView = 'start';
    this.savedImagesDB = new SavedImagesDB();
  this.savedShapesDB = new SavedShapesDB();
    this.savedImagesObjectUrls = [];
	  this.layerThumbObjectUrls = [];

      this.patterns = [
        { label: 'Geen', file: '' },
        { label: '00 Vierkant', file: '00-vierkant.svg' },
        { label: '01 Vertical (tile)', file: '01-vertical.svg' },
        { label: '02 Horizontal (tile)', file: '02-horizontal.svg' },
        { label: '03 Diagonaal 45° (tile)', file: '03-diagonal-45.svg' },
        { label: '04 Diagonaal 135° (tile)', file: '04-diagonal-135.svg' },
        { label: '05 Zig (tile)', file: '05-zig.svg' },
        { label: '05 Zag (tile)', file: '05-zag.svg' },
        { label: '06 Grid (tile)', file: '06-grid.svg' },
        { label: '07 Dashed diagonaal (tile)', file: '07-dashed-diagonal.svg' },
        { label: '08 Chevron (tile)', file: '08-chevron.svg' },
        { label: '09 Radial rays (tile)', file: '09-radial-rays.svg' },
        { label: '10 Vertical midden (1 lijn)', file: '10-vertical-midden.svg' },
        { label: '11 Horizontaal midden (1 lijn)', file: '11-horizontal-midden.svg' },
        { label: '12 Diagonaal 45° (1 lijn)', file: '12-diagonaal-45.svg' },
        { label: '13 Diagonaal 135° (1 lijn)', file: '13-diagonaal-135.svg' },
        { label: '14 Diagonaal vlak (1 lijn)', file: '14-diagonaal-vlak.svg' },
        { label: '15 Diagonaal steil (1 lijn)', file: '15-diagonaal-steil.svg' },
        { label: '16 Boog (1 lijn)', file: '16-boog.svg' },
        { label: '20 Boog op kop (1 lijn)', file: '20-boog-op-kop.svg' },
        { label: '17 Cirkel (1 lijn)', file: '17-cirkel.svg' },
        { label: '21 Stip (1 punt)', file: '21-stip.svg' },
        { label: '22 Vierkantje (1 vlak)', file: '22-vierkantje.svg' },
        { label: '18 Sinus (1 lijn)', file: '18-sinus.svg' },
        { label: '19 Spiraal (1 lijn)', file: '19-spiraal.svg' },
      ];

      this.currentFile = '';
    this.currentColor = '#000000';
    this.baseColor = '#000000';
    this.currentThickness = 1;
      this.currentTileScaleMode = 'canvas';
      this.canvasLayers = new PatternCanvasLayers(this.canvas);

      this.drawOverlay = null;
      this.drawOverlayCtx = null;
      this.renderDrawOverlay = null;
      this.isDrawing = false;
      this.drawPointerId = null;
      this.drawPath = [];
      this.activeClipPathN = null;
      this.activeClipKey = null;

      this.isDraggingShape = false;
      this.dragPointerId = null;
      this.dragLayerIndex = -1;
      this.dragStartPos = null;
      this.dragStartClipPathN = null;
      this.dragRaf = 0;
      this.dragPendingPos = null;

	  this.isDraggingImage = false;
	  this.imagePointerId = null;
	  this.imageLayerIndex = -1;
	  this.imageDragMode = ''; // 'move' | 'resize'
	  this.imageStartPos = null;
	  this.imageStartPlacement = null; // {xN,yN,wN,hN}

      this.toolMode = 'draw';
      this.isCropping = false;
      this.cropPointerId = null;
      this.cropStartPos = null;
      this.cropPendingPos = null;
      this.cropRectPx = null;
      this.cropRectN = null;

      this.activeLayerIndex = -1;

      // Multi-select (Shift+click) support for layers.
      this.selectedLayerIndices = new Set();

      this.visibleColorsRenderToken = 0;

      this.draggingLayerViewIndex = -1;
      this.dragOverItem = null;

      this.previewToken = 0;

      this.pendingGroupParamRaf = 0;
      this.pendingGroupPatternParams = null;

	  this.colorBarSteps = 16;
	  this.colorBarColors = { primary: [], complement: [], supportA: [], supportB: [] };
	  this.colorBarSelectedIndex = { primary: -1, complement: -1, supportA: -1, supportB: -1 };
    }

    init() {
      if (!(this.select instanceof HTMLSelectElement)) return;
      if (!(this.preview instanceof HTMLElement)) return;

      if (this.select.dataset.bound === '1') return;
      this.select.dataset.bound = '1';

      this.populateOptions();

      this.initRepeatControl();
	  this.initPaletteControl();
	  this.initColorMixCanvasControl();
	  this.initThicknessControl();
      this.initTileScaleToggle();
      this.initImageActions();
      this.initShapeActions();

      // Persist Concept/Omschrijving across sessions.
      this.restoreConceptDescriptionFromStorage();
      if (this.conceptInput instanceof HTMLInputElement && this.conceptInput.dataset.boundStorage !== '1') {
        this.conceptInput.dataset.boundStorage = '1';
        this.conceptInput.addEventListener('input', () => this.persistConceptDescriptionToStorage());
        this.conceptInput.addEventListener('change', () => this.persistConceptDescriptionToStorage());
      }
      if (this.descriptionInput instanceof HTMLTextAreaElement && this.descriptionInput.dataset.boundStorage !== '1') {
        this.descriptionInput.dataset.boundStorage = '1';
        this.descriptionInput.addEventListener('input', () => this.persistConceptDescriptionToStorage());
        this.descriptionInput.addEventListener('change', () => this.persistConceptDescriptionToStorage());
      }

      if (this.clearConceptBtn && this.clearConceptBtn.dataset.bound !== '1') {
        this.clearConceptBtn.dataset.bound = '1';
        this.clearConceptBtn.addEventListener('click', () => {
          this.clearConceptDescriptionStorageAndFields();

          // Clearing concept also resets the working canvas.
          this.resetToStart();
        });
      }

      if (this.exportPdfBtn && this.exportPdfBtn.dataset.bound !== '1') {
        this.exportPdfBtn.dataset.bound = '1';
        this.exportPdfBtn.addEventListener('click', () => {
          const concept = this.getConceptValue();
          const description = this.getDescriptionValue();
          this.exportSavedImagesPdf({ concept, description, createdAt: Date.now() }).catch(() => false);
        });
      }

      // Left-panel mode toggle: Tekenen (default) vs Selecteren.
      if (this.modeDrawBtn instanceof HTMLButtonElement && this.modeSelectBtn instanceof HTMLButtonElement) {
        this.modeDrawBtn.addEventListener('click', () => {
          this.setInteractionMode('draw');
        });
        this.modeSelectBtn.addEventListener('click', () => {
          this.setInteractionMode('select');
        });

        // Ensure UI reflects the default mode.
        this.setInteractionMode(this.interactionMode);
      }

      // Clicking the empty area of the layers list deselects all layers.
      // (This enables the "no layer chosen" state so actions can target the background.)
      if (this.layersRoot instanceof HTMLElement && this.layersRoot.dataset.boundDeselect !== '1') {
        this.layersRoot.dataset.boundDeselect = '1';
        this.layersRoot.addEventListener('click', (evt) => {
          const target = evt.target instanceof HTMLElement ? evt.target : null;
          if (!target) return;
          if (target.closest('.layers__item')) return;
          if (target.closest('button') || target.closest('input') || target.closest('select')) return;

          this.selectedLayerIndices = new Set();
          this.setActiveLayerIndex(-1);
          this.syncActiveShapeToLayerIndex(-1);
          this.renderLayersList();
          if (typeof this.renderDrawOverlay === 'function') this.renderDrawOverlay();
        });
      }

      const initial = this.patterns && this.patterns[0] ? this.patterns[0].file : null;
      this.select.value = initial || '';
      this.applySelection(initial || '');

      this.select.addEventListener('change', () => {
        this.applySelection(this.select.value);
      });

      this.preview.addEventListener('click', () => {
        const layers = this.canvasLayers && Array.isArray(this.canvasLayers.layers) ? this.canvasLayers.layers : [];
        const selected = this.getSelectedLayerIndices();

        // If the user selected multiple layers (Shift+click), actions apply to the group.
        // This takes precedence over "active shape" behavior.
        if (selected.length > 1) {
          if (!this.currentFile) {
            this.applySolidToSelectedLayerOrCanvas();
            return;
          }

          for (const idx of selected) {
            this.canvasLayers.addPatternPaintToLayerIndex(
              idx,
              this.currentFile,
              this.getRepeatCount(),
              this.currentColor,
              this.getThickness(),
              this.currentTileScaleMode
            );
          }

          this.renderLayersList();

          const token = ++this.visibleColorsRenderToken;
          Promise.all(selected.map((i) => this.canvasLayers.getLatestVisibleColorsPromise(i).catch(() => {})))
            .then(() => {
              if (token !== this.visibleColorsRenderToken) return;
              this.renderLayersList();
            })
            .catch(() => {});

          return;
        }

        const hasActive = Array.isArray(this.activeClipPathN) && this.activeClipPathN.length >= 3;
        if (hasActive) {
          this.applyToActiveShape();
          return;
        }

        if (!this.currentFile) {
          this.applySolidToSelectedLayerOrCanvas();
          return;
        }

        if (selected.length > 0) {
          for (const idx of selected) {
            this.canvasLayers.addPatternPaintToLayerIndex(
              idx,
              this.currentFile,
              this.getRepeatCount(),
              this.currentColor,
              this.getThickness(),
              this.currentTileScaleMode
            );
          }

          this.renderLayersList();

          // Re-render once async visible-colors computations finish.
          const token = ++this.visibleColorsRenderToken;
          Promise.all(selected.map((i) => this.canvasLayers.getLatestVisibleColorsPromise(i).catch(() => {})))
            .then(() => {
              if (token !== this.visibleColorsRenderToken) return;
              this.renderLayersList();
            })
            .catch(() => {});

          return;
        }

        if (this.activeLayerIndex >= 0 && this.activeLayerIndex < layers.length) {
          this.canvasLayers.addPatternPaintToLayerIndex(
            this.activeLayerIndex,
            this.currentFile,
            this.getRepeatCount(),
            this.currentColor,
            this.getThickness(),
            this.currentTileScaleMode
          );
          this.renderLayersList();
          return;
        }

			this.applyPatternToBackground();
			this.renderLayersList();
      });

      this.initDrawShapeToMask();
	  this.initLayerReorderDragDrop();

      this.renderLayersList();

      this.setRightView(this.rightView);

      window.addEventListener('resize', () => {
        this.resizeDrawOverlay();
        if (!this.canvasLayers.hasLayers()) return;
        this.canvasLayers.redrawAllLayers();
      });
    }

    setInteractionMode(nextMode) {
      const mode = nextMode === 'select' ? 'select' : 'draw';
      this.interactionMode = mode;

      if (!(this.modeDrawBtn instanceof HTMLButtonElement)) return;
      if (!(this.modeSelectBtn instanceof HTMLButtonElement)) return;

      const isDraw = mode !== 'select';
      this.modeDrawBtn.classList.toggle('is-active', isDraw);
      this.modeSelectBtn.classList.toggle('is-active', !isDraw);
      this.modeDrawBtn.setAttribute('aria-pressed', isDraw ? 'true' : 'false');
      this.modeSelectBtn.setAttribute('aria-pressed', !isDraw ? 'true' : 'false');
    }

    resetToStart() {
      // Clear canvas + layers.
      if (this.canvasLayers && typeof this.canvasLayers.clearAllLayers === 'function') {
        this.canvasLayers.clearAllLayers();
      }

      // Reset interaction state.
      this.setInteractionMode('draw');
      this.isDrawing = false;
      this.drawPointerId = null;
      this.drawPath = [];
      this.activeClipPathN = null;
      this.activeClipKey = null;

      this.isDraggingShape = false;
      this.dragPointerId = null;
      this.dragLayerIndex = -1;
      this.dragStartPos = null;
      this.dragStartClipPathN = null;
      this.dragPendingPos = null;
      if (this.dragRaf) {
        window.cancelAnimationFrame(this.dragRaf);
        this.dragRaf = 0;
      }

      this.isDraggingImage = false;
      this.imagePointerId = null;
      this.imageLayerIndex = -1;
      this.imageDragMode = '';
      this.imageStartPos = null;
      this.imageStartPlacement = null;

      this.toolMode = 'draw';
      this.isCropping = false;
      this.cropPointerId = null;
      this.cropStartPos = null;
      this.cropPendingPos = null;
      this.cropRectPx = null;
      this.cropRectN = null;

      this.activeLayerIndex = -1;
      this.selectedLayerIndices = new Set();

      // Reset controls to defaults.
      this.setBaseColor('#000000');

      if (this.repeat instanceof HTMLInputElement) {
        this.repeat.value = '10';
      }
      if (this.repeatValue instanceof HTMLElement) {
        this.repeatValue.textContent = '10';
      }

      if (this.thickness instanceof HTMLInputElement) {
        this.thickness.value = '1';
      }
      if (this.thicknessValue instanceof HTMLElement) {
        this.thicknessValue.textContent = '1';
      }
      this.currentThickness = 1;

      if (this.tileScaleToShape instanceof HTMLInputElement) {
        this.tileScaleToShape.checked = true;
      }
      this.currentTileScaleMode = 'shape';

      const initial = this.patterns && this.patterns[0] ? this.patterns[0].file : '';
      if (this.select instanceof HTMLSelectElement) {
        this.select.value = initial || '';
      }
      this.applySelection(initial || '');

      // Reset view.
	  this.setRightView('start');

      // Clear layers list UI.
      this.renderLayersList();

      if (this.drawOverlay instanceof HTMLCanvasElement) {
        this.drawOverlay.style.cursor = 'crosshair';
      }
      if (typeof this.renderDrawOverlay === 'function') this.renderDrawOverlay();
    }

    setRightView(view) {
      const next = view === 'start'
        ? 'start'
        : view === 'images'
          ? 'images'
          : view === 'shapes'
            ? 'shapes'
            : view === 'colors'
              ? 'colors'
              : 'patterns';
      this.rightView = next;

      if (this.rightViewStart instanceof HTMLElement) {
        this.rightViewStart.hidden = next !== 'start';
      }
      if (this.rightViewPatterns instanceof HTMLElement) {
        this.rightViewPatterns.hidden = next !== 'patterns';
      }
      if (this.rightViewColors instanceof HTMLElement) {
        this.rightViewColors.hidden = next !== 'colors';
      }
      if (this.rightViewImages instanceof HTMLElement) {
        this.rightViewImages.hidden = next !== 'images';
      }

      if (this.rightViewShapes instanceof HTMLElement) {
        this.rightViewShapes.hidden = next !== 'shapes';
      }

      // Ensure the right panel is visible.
      document.body.classList.remove('right-collapsed');

      if (next === 'images') this.renderSavedImages();
      if (next === 'shapes') this.renderSavedShapes();
	  this.renderColorMixCanvas();
    }

    getConceptValue() {
      if (!(this.conceptInput instanceof HTMLInputElement)) return '';
      return typeof this.conceptInput.value === 'string' ? this.conceptInput.value.trim() : '';
    }

    getDescriptionValue() {
      if (!(this.descriptionInput instanceof HTMLTextAreaElement)) return '';
      return typeof this.descriptionInput.value === 'string' ? this.descriptionInput.value.trim() : '';
    }

    getConceptStorage() {
      try {
        if (!('localStorage' in window)) return null;
        return window.localStorage;
      } catch (_) {
        return null;
      }
    }

    getConceptStorageKeys() {
      return {
        concept: 'Patronen2026.concept',
        description: 'Patronen2026.description',
      };
    }

    restoreConceptDescriptionFromStorage() {
      const store = this.getConceptStorage();
      if (!store) return;

      const keys = this.getConceptStorageKeys();
      const concept = store.getItem(keys.concept) || '';
      const description = store.getItem(keys.description) || '';

      if (this.conceptInput instanceof HTMLInputElement && !this.conceptInput.value) {
        this.conceptInput.value = concept;
      }
      if (this.descriptionInput instanceof HTMLTextAreaElement && !this.descriptionInput.value) {
        this.descriptionInput.value = description;
      }
    }

    persistConceptDescriptionToStorage() {
      const store = this.getConceptStorage();
      if (!store) return;

      const keys = this.getConceptStorageKeys();
      const concept = this.conceptInput instanceof HTMLInputElement ? this.conceptInput.value : '';
      const description = this.descriptionInput instanceof HTMLTextAreaElement ? this.descriptionInput.value : '';

      try {
        store.setItem(keys.concept, concept || '');
        store.setItem(keys.description, description || '');
      } catch (_) {}
    }

    clearConceptDescriptionStorageAndFields() {
      const store = this.getConceptStorage();

      if (this.conceptInput instanceof HTMLInputElement) this.conceptInput.value = '';
      if (this.descriptionInput instanceof HTMLTextAreaElement) this.descriptionInput.value = '';

      if (!store) return;
      const keys = this.getConceptStorageKeys();
      try {
        store.removeItem(keys.concept);
        store.removeItem(keys.description);
      } catch (_) {}
    }

    sanitizeFileStem(name) {
      const raw = typeof name === 'string' ? name : '';
      const cleaned = raw
        .replace(/[\u0000-\u001F\u007F]/g, '')
        .replace(/[\\/?:%*|"<>]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      return cleaned.slice(0, 80);
    }

    getJsPDF() {
      // Loaded via UMD bundle: window.jspdf.jsPDF
      const jspdf = window.jspdf;
      const jsPDF = jspdf && jspdf.jsPDF;
      return typeof jsPDF === 'function' ? jsPDF : null;
    }

    formatDateTimeNl(ts) {
      const t = Number(ts);
      const d = new Date(Number.isFinite(t) ? t : Date.now());
      try {
        return d.toLocaleString('nl-NL', {
          year: 'numeric',
          month: 'long',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch (_) {
        return d.toISOString();
      }
    }

    formatDateStamp(ts) {
      const t = Number(ts);
      const d = new Date(Number.isFinite(t) ? t : Date.now());
      const pad = (n) => String(n).padStart(2, '0');
      const yyyy = d.getFullYear();
      const mm = pad(d.getMonth() + 1);
      const dd = pad(d.getDate());
      const hh = pad(d.getHours());
      const mi = pad(d.getMinutes());
      const ss = pad(d.getSeconds());
      return `${yyyy}${mm}${dd}-${hh}${mi}${ss}`;
    }

    blobToDataUrl(blob) {
      return new Promise((resolve, reject) => {
        if (!(blob instanceof Blob)) {
          reject(new Error('Not a blob'));
          return;
        }
        const r = new FileReader();
        r.onerror = () => reject(r.error || new Error('FileReader failed'));
        r.onload = () => resolve(typeof r.result === 'string' ? r.result : '');
        r.readAsDataURL(blob);
      });
    }

    exportSavedImagesPdf(opts) {
      const jsPDF = this.getJsPDF();
      if (!jsPDF) return Promise.resolve(false);

      const concept = opts && typeof opts.concept === 'string' ? opts.concept : '';
      const description = opts && typeof opts.description === 'string' ? opts.description : '';
      const createdAt = opts && Number.isFinite(opts.createdAt) ? Number(opts.createdAt) : Date.now();
      const title = concept.trim() || 'Patronen 2026';
      const dateLine = this.formatDateTimeNl(createdAt);

      return this.savedImagesDB
        .getAll()
        .catch(() => [])
        .then(async (items) => {
          const sorted = (Array.isArray(items) ? items : [])
            .filter((it) => it && typeof it.id === 'string' && it.blob instanceof Blob)
            .sort((a, b) => (Number(a.createdAt) || 0) - (Number(b.createdAt) || 0));

          const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
          const pageW = doc.internal.pageSize.getWidth();
          const pageH = doc.internal.pageSize.getHeight();
          const margin = 40;
          const maxW = pageW - margin * 2;

          let y = margin;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(18);
          doc.text(title, margin, y);
          y += 22;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(11);
          doc.text(dateLine, margin, y);
          y += 18;

          const desc = description.trim();
          if (desc) {
            const lines = doc.splitTextToSize(desc, maxW);
            const blockH = Math.max(14, lines.length * 14);
            if (y + blockH > pageH - margin) {
              doc.addPage();
              y = margin;
            }
            doc.text(lines, margin, y);
            y += blockH + 14;
          }

          if (sorted.length === 0) {
            doc.setFontSize(12);
            doc.text('Nog geen opgeslagen afbeeldingen.', margin, y + 10);
          } else {
            // Prepare data URLs once (used for thumbnails + full pages).
            const prepared = [];
            for (const it of sorted) {
              const dataUrl = await this.blobToDataUrl(it.blob).catch(() => '');
              if (!dataUrl) continue;
              const iw = Math.max(1, Number(it.w) || 1);
              const ih = Math.max(1, Number(it.h) || 1);
              prepared.push({ it, dataUrl, iw, ih });
            }

            // 1) First page: thumbnail overview.
            const cols = 3;
            const gutter = 10;
            const cellW = (maxW - gutter * (cols - 1)) / cols;
            const cellH = cellW; // square cells for consistent thumbnails

            let tx = margin;
            let ty = y;
            let col = 0;

            const ensureThumbSpace = () => {
              if (ty + cellH > pageH - margin) {
                doc.addPage();
                tx = margin;
                ty = margin;
                col = 0;
              }
            };

            for (const p of prepared) {
              ensureThumbSpace();

              const fitW = cellW;
              const fitH = cellH;
              let drawW = fitW;
              let drawH = (drawW * p.ih) / p.iw;
              if (drawH > fitH) {
                drawH = fitH;
                drawW = (drawH * p.iw) / p.ih;
              }

              const ox = tx + (fitW - drawW) / 2;
              const oy = ty + (fitH - drawH) / 2;
              doc.addImage(p.dataUrl, 'PNG', ox, oy, drawW, drawH);

              col += 1;
              if (col >= cols) {
                col = 0;
                tx = margin;
                ty += cellH + gutter;
              } else {
                tx += cellW + gutter;
              }
            }

            // 2) Following pages: full-size images.
            doc.addPage();
            y = margin;

            for (const p of prepared) {
              let drawW = maxW;
              let drawH = (drawW * p.ih) / p.iw;

              const availableH = pageH - margin - y;
              if (drawH > availableH) {
                if (y > margin + 20) {
                  doc.addPage();
                  y = margin;
                }
              }

              const availableH2 = pageH - margin - y;
              if (drawH > availableH2) {
                drawH = Math.max(1, availableH2);
                drawW = (drawH * p.iw) / p.ih;
              }

              doc.addImage(p.dataUrl, 'PNG', margin, y, drawW, drawH);
              y += drawH + 16;
            }
          }

          const stem = this.sanitizeFileStem(title) || 'patronen2026';
          const stamp = this.formatDateStamp(createdAt);
          // Note: browsers do not guarantee saving into folders; this name is still helpful.
          const fileName = `pdf/${stem}-${stamp}.pdf`;
          doc.save(fileName);
          return true;
        });
    }

    clearSavedImagesObjectUrls() {
      for (const u of this.savedImagesObjectUrls) {
        try {
          URL.revokeObjectURL(u);
        } catch (_) {}
      }
      this.savedImagesObjectUrls = [];
    }

    clearLayerThumbObjectUrls() {
      for (const u of this.layerThumbObjectUrls) {
        try {
          URL.revokeObjectURL(u);
        } catch (_) {}
      }
      this.layerThumbObjectUrls = [];
    }

    renderSavedImages() {
      if (!(this.savedImagesRoot instanceof HTMLElement)) return;

      this.clearSavedImagesObjectUrls();
      this.savedImagesRoot.innerHTML = '';

      this.savedImagesDB
        .getAll()
        .then((items) => {
          const sorted = items
            .filter((it) => it && typeof it.id === 'string' && it.blob instanceof Blob)
            .sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));

          if (sorted.length === 0) {
            this.savedImagesRoot.textContent = 'Nog geen opgeslagen afbeeldingen.';
            return;
          }

          for (const it of sorted) {
            const url = URL.createObjectURL(it.blob);
            this.savedImagesObjectUrls.push(url);

            const cell = document.createElement('div');
            cell.className = 'saved-images__cell';

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'saved-images__item';
            btn.style.backgroundImage = `url("${url}")`;
            btn.setAttribute('aria-label', 'Opgeslagen afbeelding');
			btn.draggable = true;
			btn.dataset.imageId = it.id;
			btn.addEventListener('dragstart', (evt) => {
				if (!evt.dataTransfer) return;
				evt.dataTransfer.effectAllowed = 'copy';
				evt.dataTransfer.setData('application/x-patronen2026-image', String(it.id));
				evt.dataTransfer.setData('text/plain', String(it.id));
			});
            btn.addEventListener('click', () => {
              const a = document.createElement('a');
              a.href = url;
              a.download = it.fileName || 'patronen2026.png';
              document.body.appendChild(a);
              a.click();
              a.remove();
            });

            const del = document.createElement('button');
            del.type = 'button';
            del.className = 'saved-images__delete';
            del.textContent = '×';
            del.title = 'Verwijder afbeelding';
            del.setAttribute('aria-label', 'Verwijder afbeelding');
            del.draggable = false;
            del.addEventListener('click', (evt) => {
              evt.preventDefault();
              evt.stopPropagation();
              if (typeof evt.stopImmediatePropagation === 'function') evt.stopImmediatePropagation();
              this.savedImagesDB
                .delete(String(it.id))
                .then(() => {
                  this.renderSavedImages();
                })
                .catch(() => {});
            });

            cell.appendChild(btn);
            cell.appendChild(del);
            this.savedImagesRoot.appendChild(cell);
          }
        })
        .catch(() => {
          this.savedImagesRoot.textContent = 'Kan opgeslagen afbeeldingen niet laden.';
        });
    }

    initShapeActions() {
      if (this.saveShapeBtn && this.saveShapeBtn.dataset.bound !== '1') {
        this.saveShapeBtn.dataset.bound = '1';
        this.saveShapeBtn.addEventListener('click', () => {
          const hasActive = Array.isArray(this.activeClipPathN) && this.activeClipPathN.length >= 3;
          if (!hasActive) return;
          const clipKey = this.activeClipKey || this.makeClipKey(this.activeClipPathN);
          if (!clipKey) return;

          const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
          const record = {
            id,
            createdAt: Date.now(),
            clipPathN: this.activeClipPathN.map((p) => [Number(p[0]), Number(p[1])]),
            clipKey,
          };

          this.savedShapesDB.put(record).catch(() => {});
          if (this.rightView === 'shapes') this.renderSavedShapes();
        });
      }
    }

    placeClipPathNAt(clipPathN, targetCxN, targetCyN) {
      if (!Array.isArray(clipPathN) || clipPathN.length < 3) return null;
      const clamp01 = (n) => Math.max(0, Math.min(1, n));

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const p of clipPathN) {
        if (!Array.isArray(p) || p.length < 2) continue;
        const x = clamp01(Number(p[0]));
        const y = clamp01(Number(p[1]));
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
      if (![minX, minY, maxX, maxY].every(Number.isFinite)) return null;

      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;

      let dx = clamp01(Number(targetCxN)) - cx;
      let dy = clamp01(Number(targetCyN)) - cy;

      // Clamp translation to keep shape fully inside 0..1.
      const minDx = -minX;
      const maxDx = 1 - maxX;
      const minDy = -minY;
      const maxDy = 1 - maxY;
      dx = Math.max(minDx, Math.min(maxDx, dx));
      dy = Math.max(minDy, Math.min(maxDy, dy));

      const next = clipPathN
        .map((p) => [clamp01(Number(p[0]) + dx), clamp01(Number(p[1]) + dy)])
        .filter((p) => Array.isArray(p) && p.length === 2);
      return next.length >= 3 ? next : null;
    }

    clipPathNToPreviewDataUrl(clipPathN) {
      if (!Array.isArray(clipPathN) || clipPathN.length < 3) return '';
      const clamp01 = (n) => Math.max(0, Math.min(1, n));
      const pts = clipPathN
        .map((p) => {
          const x = Math.round(clamp01(Number(p[0])) * 1000) / 10;
          const y = Math.round(clamp01(Number(p[1])) * 1000) / 10;
          return `${x},${y}`;
        })
        .join(' ');

      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="none"/><polygon points="${pts}" fill="none" stroke="#000" stroke-width="2"/></svg>`;
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    }

    renderSavedShapes() {
      if (!(this.savedShapesRoot instanceof HTMLElement)) return;
      this.savedShapesRoot.innerHTML = '';

      this.savedShapesDB
        .getAll()
        .then((items) => {
          const sorted = items
            .filter((it) => it && typeof it.id === 'string' && Array.isArray(it.clipPathN) && it.clipPathN.length >= 3)
            .sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));

          if (sorted.length === 0) {
            this.savedShapesRoot.textContent = 'Nog geen opgeslagen vormen.';
            return;
          }

          for (const it of sorted) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'saved-shapes__item';
            btn.setAttribute('aria-label', 'Opgeslagen vorm');
            btn.style.backgroundImage = `url("${this.clipPathNToPreviewDataUrl(it.clipPathN)}")`;
            btn.draggable = true;
            btn.dataset.shapeId = it.id;
            btn.addEventListener('dragstart', (evt) => {
              if (!evt.dataTransfer) return;
              evt.dataTransfer.effectAllowed = 'copy';
              evt.dataTransfer.setData('application/x-patronen2026-shape', String(it.id));
              evt.dataTransfer.setData('text/plain', String(it.id));
            });
            btn.addEventListener('click', () => {
              const next = this.placeClipPathNAt(it.clipPathN, 0.5, 0.5) || it.clipPathN;
              this.activeClipPathN = next;
              this.activeClipKey = typeof it.clipKey === 'string' && it.clipKey ? it.clipKey : this.makeClipKey(next);
              this.setActiveLayerIndex(-1);
              this.toolMode = 'draw';
              if (this.drawOverlay) this.drawOverlay.style.cursor = 'crosshair';
              if (typeof this.renderDrawOverlay === 'function') this.renderDrawOverlay();
              this.renderLayersList();
            });
            this.savedShapesRoot.appendChild(btn);
          }
        })
        .catch(() => {
          this.savedShapesRoot.textContent = 'Kan opgeslagen vormen niet laden.';
        });
    }

    initImageActions() {
      if (this.cropToolBtn && this.cropToolBtn.dataset.bound !== '1') {
        this.cropToolBtn.dataset.bound = '1';
        this.cropToolBtn.addEventListener('click', () => {
          // Crop implies interaction/selection mode.
          this.setInteractionMode('select');
          this.toolMode = 'crop';

          // Crop selection should override any active shape/image selection.
          this.isDrawing = false;
          this.drawPointerId = null;
          this.drawPath = [];
          this.activeClipPathN = null;
          this.activeClipKey = null;
          this.setActiveLayerIndex(-1);

          this.isDraggingShape = false;
          this.dragPointerId = null;
          this.dragLayerIndex = -1;
          this.dragStartPos = null;
          this.dragStartClipPathN = null;
          this.dragPendingPos = null;
          if (this.dragRaf) {
            window.cancelAnimationFrame(this.dragRaf);
            this.dragRaf = 0;
          }

          this.isDraggingImage = false;
          this.imagePointerId = null;
          this.imageLayerIndex = -1;
          this.imageDragMode = '';
          this.imageStartPos = null;
          this.imageStartPlacement = null;

          // Start a new crop selection; the last crop is still shown until replaced.
          this.isCropping = false;
          this.cropPointerId = null;
          this.cropStartPos = null;
          this.cropPendingPos = null;
          this.cropRectPx = null;
          if (this.drawOverlay) this.drawOverlay.style.cursor = 'crosshair';

          this.renderLayersList();
          if (typeof this.renderDrawOverlay === 'function') this.renderDrawOverlay();
        });
      }

      if (this.saveImageBtn && this.saveImageBtn.dataset.bound !== '1') {
        this.saveImageBtn.dataset.bound = '1';
        this.saveImageBtn.addEventListener('click', () => {
          this.saveCurrentImage();
        });
      }
    }

    initLayerReorderDragDrop() {
      if (!(this.layersRoot instanceof HTMLElement)) return;
      if (this.layersRoot.dataset.dndBound === '1') return;
      this.layersRoot.dataset.dndBound = '1';

      const cleanupOver = () => {
        if (this.dragOverItem) {
          this.dragOverItem.classList.remove('is-drop-target');
          this.dragOverItem = null;
        }
      };

      this.layersRoot.addEventListener('dragstart', (evt) => {
        const target = evt.target instanceof HTMLElement ? evt.target : null;
        const item = target && typeof target.closest === 'function' ? target.closest('.layers__item') : null;
        if (!(item instanceof HTMLElement)) return;

        // Avoid starting a drag when interacting with buttons/inputs.
        if (target && (target.closest('button') || target.closest('input') || target.closest('select'))) {
          evt.preventDefault();
          return;
        }

        const v = Number(item.dataset.viewIndex);
        if (!Number.isFinite(v) || v < 0) {
          evt.preventDefault();
          return;
        }

        this.draggingLayerViewIndex = Math.trunc(v);
        item.classList.add('is-dragging');
        cleanupOver();

        if (evt.dataTransfer) {
          evt.dataTransfer.effectAllowed = 'move';
          evt.dataTransfer.setData('text/plain', String(this.draggingLayerViewIndex));
        }
      });

      this.layersRoot.addEventListener('dragover', (evt) => {
        if (this.draggingLayerViewIndex < 0) return;
        const target = evt.target instanceof HTMLElement ? evt.target : null;
        const item = target && typeof target.closest === 'function' ? target.closest('.layers__item') : null;
        if (!(item instanceof HTMLElement)) return;

        evt.preventDefault();
        if (evt.dataTransfer) evt.dataTransfer.dropEffect = 'move';

        if (this.dragOverItem && this.dragOverItem !== item) {
          this.dragOverItem.classList.remove('is-drop-target');
        }
        this.dragOverItem = item;
        item.classList.add('is-drop-target');
      });

      this.layersRoot.addEventListener('drop', (evt) => {
        if (this.draggingLayerViewIndex < 0) return;
        const target = evt.target instanceof HTMLElement ? evt.target : null;
        const item = target && typeof target.closest === 'function' ? target.closest('.layers__item') : null;
        if (!(item instanceof HTMLElement)) return;

        evt.preventDefault();

        const fromV = this.draggingLayerViewIndex;
        const toVBase = Number(item.dataset.viewIndex);
        if (!Number.isFinite(toVBase) || toVBase < 0) return;

        const rect = item.getBoundingClientRect();
        const after = evt.clientY > rect.top + rect.height / 2;
        const toV = Math.trunc(toVBase) + (after ? 1 : 0);

        const layers = this.canvasLayers && Array.isArray(this.canvasLayers.layers) ? this.canvasLayers.layers : [];
        const activeRef = this.activeLayerIndex >= 0 ? layers[this.activeLayerIndex] : null;

        const changed = this.canvasLayers.reorderLayersByView(fromV, toV);
        if (changed) {
          const nextLayers = this.canvasLayers && Array.isArray(this.canvasLayers.layers) ? this.canvasLayers.layers : [];
          if (activeRef) {
            const nextIdx = nextLayers.indexOf(activeRef);
            this.activeLayerIndex = Number.isFinite(nextIdx) && nextIdx >= 0 ? nextIdx : -1;
          }
          this.syncActiveShapeToLayerIndex(this.activeLayerIndex);
          this.renderLayersList();
        }

        cleanupOver();
        this.draggingLayerViewIndex = -1;
      });

      this.layersRoot.addEventListener('dragend', (evt) => {
        const target = evt.target instanceof HTMLElement ? evt.target : null;
        const item = target && typeof target.closest === 'function' ? target.closest('.layers__item') : null;
        if (item instanceof HTMLElement) item.classList.remove('is-dragging');
        cleanupOver();
        this.draggingLayerViewIndex = -1;
      });
    }

    saveCurrentImage() {
      if (!(this.canvas instanceof HTMLCanvasElement)) return;
      const src = this.canvas;
      const sw = Math.max(1, src.width);
      const sh = Math.max(1, src.height);

      const hasActiveClip = Array.isArray(this.activeClipPathN) && this.activeClipPathN.length >= 3;

      const clearCropSelection = () => {
        this.cropRectN = null;
        this.cropRectPx = null;
        if (typeof this.renderDrawOverlay === 'function') this.renderDrawOverlay();
      };

      const out = document.createElement('canvas');
      const ctx = out.getContext('2d');
      if (!ctx) return;

      let usedCropRect = false;

      if (hasActiveClip) {
        // Export only the selected (clipped) part.
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        for (const p of this.activeClipPathN) {
          if (!Array.isArray(p) || p.length < 2) continue;
          const xN = Math.max(0, Math.min(1, Number(p[0])));
          const yN = Math.max(0, Math.min(1, Number(p[1])));
          const x = xN * sw;
          const y = yN * sh;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }

        if (![minX, minY, maxX, maxY].every(Number.isFinite)) return;

        const bx = Math.max(0, Math.min(sw - 1, Math.floor(minX)));
        const by = Math.max(0, Math.min(sh - 1, Math.floor(minY)));
        const ex = Math.max(bx + 1, Math.min(sw, Math.ceil(maxX)));
        const ey = Math.max(by + 1, Math.min(sh, Math.ceil(maxY)));
        const bw = Math.max(1, ex - bx);
        const bh = Math.max(1, ey - by);

        out.width = bw;
        out.height = bh;

        ctx.save();
        ctx.translate(-bx, -by);
        ctx.beginPath();
        const pts = this.activeClipPathN;
        ctx.moveTo(Math.max(0, Math.min(1, pts[0][0])) * sw, Math.max(0, Math.min(1, pts[0][1])) * sh);
        for (let i = 1; i < pts.length; i++) {
          const q = pts[i];
          if (!Array.isArray(q) || q.length < 2) continue;
          const x = Math.max(0, Math.min(1, Number(q[0]))) * sw;
          const y = Math.max(0, Math.min(1, Number(q[1]))) * sh;
          ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(src, 0, 0);
        ctx.restore();
      } else {
        // Default export: crop-rect if present, otherwise full canvas.
        let sx = 0;
        let sy = 0;
        let sWidth = sw;
        let sHeight = sh;

        const cr = this.cropRectN;
        if (cr && Number.isFinite(cr.x) && Number.isFinite(cr.y) && Number.isFinite(cr.w) && Number.isFinite(cr.h)) {
          usedCropRect = true;
          sx = Math.max(0, Math.min(sw - 1, Math.round(cr.x * sw)));
          sy = Math.max(0, Math.min(sh - 1, Math.round(cr.y * sh)));
          sWidth = Math.max(1, Math.min(sw - sx, Math.round(cr.w * sw)));
          sHeight = Math.max(1, Math.min(sh - sy, Math.round(cr.h * sh)));
        }

        out.width = sWidth;
        out.height = sHeight;
        ctx.drawImage(src, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);
      }

      const concept = this.getConceptValue();
      const description = this.getDescriptionValue();
      const stem = this.sanitizeFileStem(concept) || 'patronen2026';
      const fileName = `${stem}.png`;

      const saveBlob = (blob) => {
        if (!(blob instanceof Blob)) return;
        const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const record = {
          id,
          createdAt: Date.now(),
          w: out.width,
          h: out.height,
          fileName,
          concept,
          description,
          blob,
        };

        // Persist, refresh UI, then auto-export a PDF with all saved images.
        this.savedImagesDB
          .put(record)
          .catch(() => {})
          .then(() => {
            if (this.rightView === 'images') this.renderSavedImages();
            return this.exportSavedImagesPdf({ concept, description, createdAt: record.createdAt }).catch(() => false);
          })
          .catch(() => {});

        // After saving a cropped export, remove the crop grid.
        if (usedCropRect) clearCropSelection();
      };

      if (typeof out.toBlob === 'function') {
        out.toBlob((blob) => {
          if (!(blob instanceof Blob)) return;
          saveBlob(blob);
        }, 'image/png');
        return;
      }

      // Fallback for older browsers.
      const dataUrl = out.toDataURL('image/png');

      // Convert data URL to Blob so we can still store it without triggering a download.
      fetch(dataUrl)
        .then((res) => res.blob())
        .then((blob) => {
          saveBlob(blob);
        })
        .catch(() => {
          if (usedCropRect) clearCropSelection();
        });
    }

    makeClipKey(pathN) {
      if (!Array.isArray(pathN) || pathN.length < 3) return null;
      const round = (n) => Math.round(n * 1000) / 1000;
      const cleaned = pathN
        .map((p) => (Array.isArray(p) && p.length >= 2 ? [round(Number(p[0])), round(Number(p[1]))] : null))
        .filter(Boolean);
      if (cleaned.length < 3) return null;
      return JSON.stringify(cleaned);
    }

    applyToActiveShape() {
      const hasActive = Array.isArray(this.activeClipPathN) && this.activeClipPathN.length >= 3;
      if (!hasActive) return;

      const clipKey = this.activeClipKey || this.makeClipKey(this.activeClipPathN);
      if (!clipKey) return;

      let idx = -1;
      if (this.currentFile) {
        idx = this.canvasLayers.addClippedLayer(
          this.currentFile,
          this.getRepeatCount(),
          this.currentColor,
          this.getThickness(),
          this.activeClipPathN,
          this.currentTileScaleMode,
          clipKey
        );
      } else {
        idx = this.canvasLayers.addClippedSolidLayer(
          this.currentColor,
          this.activeClipPathN,
          clipKey
        );
      }

      this.setLayerSelectionSingle(idx);
      this.renderLayersList();

      // Re-render once the async pixel-based visible-colors computation finishes.
      const token = ++this.visibleColorsRenderToken;
      this.canvasLayers.getLatestVisibleColorsPromise(idx)
        .then(() => {
          if (token !== this.visibleColorsRenderToken) return;
          this.renderLayersList();
        })
        .catch(() => {});
    }

    syncActiveShapeToLayerIndex(layerIndex) {
      const layers = this.canvasLayers && Array.isArray(this.canvasLayers.layers) ? this.canvasLayers.layers : [];
      const layer = layers[layerIndex];

      if (layer && Array.isArray(layer.clipPathN) && layer.clipPathN.length >= 3) {
        this.activeClipPathN = layer.clipPathN.slice();
        this.activeClipKey = typeof layer.clipKey === 'string' && layer.clipKey ? layer.clipKey : this.makeClipKey(this.activeClipPathN);
      } else {
        this.activeClipPathN = null;
        this.activeClipKey = null;
      }

      if (typeof this.renderDrawOverlay === 'function') this.renderDrawOverlay();
    }

    setLayerSelectionSingle(layerIndex) {
      const idx = Number.isFinite(layerIndex) ? Math.trunc(layerIndex) : -1;
      if (idx < 0) {
        this.selectedLayerIndices = new Set();
        this.setActiveLayerIndex(-1);
        this.syncActiveShapeToLayerIndex(-1);
        return;
      }

      this.selectedLayerIndices = new Set([idx]);
      this.setActiveLayerIndex(idx);
      this.syncActiveShapeToLayerIndex(idx);
    }

    toggleLayerSelection(layerIndex) {
      const layers = this.canvasLayers && Array.isArray(this.canvasLayers.layers) ? this.canvasLayers.layers : [];
      const n = layers.length;
      const idx = Number.isFinite(layerIndex) ? Math.trunc(layerIndex) : -1;
      if (idx < 0 || idx >= n) return;

      const next = new Set(this.selectedLayerIndices);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);

      // Never allow ending up with no selected layers via toggling.
      // (Prevents deselect by clicking the checkbox off.)
      if (next.size === 0) {
        next.add(idx);
      }

      this.selectedLayerIndices = next;

      // Make the toggled layer the primary active layer.
      this.setActiveLayerIndex(idx);
      this.syncActiveShapeToLayerIndex(idx);
    }

    getSelectedLayerIndices() {
      const layers = this.canvasLayers && Array.isArray(this.canvasLayers.layers) ? this.canvasLayers.layers : [];
      const n = layers.length;
      const set = this.selectedLayerIndices instanceof Set ? this.selectedLayerIndices : new Set();
      return Array.from(set)
        .map((i) => (Number.isFinite(i) ? Math.trunc(i) : -1))
        .filter((i) => i >= 0 && i < n);
    }

    scheduleUpdateSelectedLayersPatternParams(nextParams) {
      const params = nextParams && typeof nextParams === 'object' ? nextParams : null;
      if (!params) return;

      if (!this.pendingGroupPatternParams) this.pendingGroupPatternParams = {};
      if (Number.isFinite(params.repeatCount)) this.pendingGroupPatternParams.repeatCount = Math.trunc(params.repeatCount);
      if (Number.isFinite(params.thickness)) this.pendingGroupPatternParams.thickness = Math.trunc(params.thickness);

      if (this.pendingGroupParamRaf) return;
      this.pendingGroupParamRaf = window.requestAnimationFrame(() => {
        this.pendingGroupParamRaf = 0;
        const p = this.pendingGroupPatternParams;
        this.pendingGroupPatternParams = null;
        if (!p) return;
        this.updateSelectedLayersPatternParams(p);
      });
    }

    updateSelectedLayersPatternParams(params) {
      const layers = this.canvasLayers && Array.isArray(this.canvasLayers.layers) ? this.canvasLayers.layers : [];
      const indices = this.getSelectedLayerIndices();
      if (indices.length === 0) return;

      const hasRepeat = Number.isFinite(params.repeatCount);
      const hasThickness = Number.isFinite(params.thickness);

      let touchedAny = false;
      for (const idx of indices) {
        const layer = layers[idx];
        if (!layer) continue;
        const paints = Array.isArray(layer.paints) ? layer.paints : [];
        let touched = false;
        for (const paint of paints) {
          if (!paint) continue;
          if (paint.kind === 'image') continue;
          if (paint.kind === 'solid') continue;
          if (!(typeof paint.file === 'string' && paint.file.trim())) continue;

          if (hasRepeat) paint.repeatCount = params.repeatCount;
          if (hasThickness) paint.thickness = params.thickness;
          touched = true;
        }

        if (touched && typeof this.canvasLayers.scheduleVisibleColorsCompute === 'function') {
          const clipPathN = Array.isArray(layer.clipPathN) ? layer.clipPathN : null;
          if (clipPathN && clipPathN.length >= 3) this.canvasLayers.scheduleVisibleColorsCompute(idx);
        }

        touchedAny = touchedAny || touched;
      }

      if (!touchedAny) return;

      this.canvasLayers.redrawAllLayers();
      this.renderLayersList();

      // Refresh once async visible-colors computations finish.
      const token = ++this.visibleColorsRenderToken;
      Promise.all(indices.map((i) => this.canvasLayers.getLatestVisibleColorsPromise(i).catch(() => {})))
        .then(() => {
          if (token !== this.visibleColorsRenderToken) return;
          this.renderLayersList();
        })
        .catch(() => {});
    }

    setActiveLayerIndex(nextIndex) {
      const n = this.canvasLayers && Array.isArray(this.canvasLayers.layers) ? this.canvasLayers.layers.length : 0;
      if (!Number.isFinite(nextIndex)) return;
      const raw = Math.trunc(nextIndex);
      if (raw < 0 || n <= 0) {
        this.activeLayerIndex = -1;

        // Keep multi-select state consistent.
        this.selectedLayerIndices = new Set();
        return;
      }
      const idx = Math.max(0, Math.min(n - 1, raw));
      this.activeLayerIndex = idx;
    }

    removeLayerIndex(layerIndex) {
      const idx = Number.isFinite(layerIndex) ? Math.trunc(layerIndex) : -1;
      const n = this.canvasLayers && Array.isArray(this.canvasLayers.layers) ? this.canvasLayers.layers.length : 0;
      if (idx < 0 || idx >= n) return;

      const removed = this.canvasLayers.removeLayerAt(idx);
      if (!removed) return;

      const nextN = this.canvasLayers && Array.isArray(this.canvasLayers.layers) ? this.canvasLayers.layers.length : 0;
      if (nextN <= 0) {
        this.activeLayerIndex = -1;
        this.activeClipPathN = null;
        this.activeClipKey = null;
        if (typeof this.renderDrawOverlay === 'function') this.renderDrawOverlay();
        this.renderLayersList();
        return;
      }

      let nextActive = this.activeLayerIndex;
      if (idx < nextActive) nextActive -= 1;
      else if (idx === nextActive) nextActive = Math.min(idx, nextN - 1);
      this.activeLayerIndex = Math.max(0, Math.min(nextN - 1, nextActive));
      this.syncActiveShapeToLayerIndex(this.activeLayerIndex);

      // Keep selection consistent.
      this.selectedLayerIndices = new Set([this.activeLayerIndex]);
      this.renderLayersList();
    }

    removeColorFromLayerIndex(layerIndex, color) {
      const idx = Number.isFinite(layerIndex) ? Math.trunc(layerIndex) : -1;
      const c = typeof color === 'string' && color.trim() ? color.trim() : '';
      if (idx < 0 || !c) return;

      const layers = this.canvasLayers && Array.isArray(this.canvasLayers.layers) ? this.canvasLayers.layers : [];
      const layer = layers[idx];
      if (!layer) return;

      const paints = Array.isArray(layer.paints) ? layer.paints : [];
      const nextPaints = paints.filter((p) => {
        const pc = p && typeof p.color === 'string' && p.color.trim() ? p.color.trim() : '';
        return pc !== c;
      });

      if (nextPaints.length === 0) {
        this.removeLayerIndex(idx);
        return;
      }

      layer.paints = nextPaints;

      if (Array.isArray(layer.visibleColors)) {
        layer.visibleColors = layer.visibleColors.filter((x) => (typeof x === 'string' ? x.trim() : '') !== c);
      }

      this.canvasLayers.redrawAllLayers();

      const hasClip = Array.isArray(layer.clipPathN) && layer.clipPathN.length >= 3;
      if (hasClip) {
        this.canvasLayers.scheduleVisibleColorsCompute(idx)
          .then(() => this.renderLayersList())
          .catch(() => {});
      }

      this.renderLayersList();
    }

    applySolidToSelectedLayerOrCanvas() {
      const layers = this.canvasLayers && Array.isArray(this.canvasLayers.layers) ? this.canvasLayers.layers : [];

      const selected = this.getSelectedLayerIndices();
      if (selected.length > 0) {
        const c = typeof this.currentColor === 'string' && this.currentColor.trim() ? this.currentColor.trim() : '#000000';
        const clippedTouched = [];

        for (const idx of selected) {
          const layer = layers[idx];
          if (!layer) continue;
          if (!Array.isArray(layer.paints)) layer.paints = [];

          const hasClip = Array.isArray(layer.clipPathN) && layer.clipPathN.length >= 3;
          layer.paints.push({ kind: 'solid', file: null, color: c });

          if (hasClip) {
            if (typeof this.canvasLayers.addOptimisticVisibleColor === 'function') {
              this.canvasLayers.addOptimisticVisibleColor(layer, c);
            }
            clippedTouched.push(idx);
          } else {
            layer.visibleColors = [c];
          }
        }

        // Group-apply touches multiple layers; force a full redraw.
        this.canvasLayers.redrawAllLayers();
        this.renderLayersList();

        const token = ++this.visibleColorsRenderToken;
        for (const idx of clippedTouched) {
          if (typeof this.canvasLayers.scheduleVisibleColorsCompute === 'function') {
            this.canvasLayers.scheduleVisibleColorsCompute(idx).catch(() => {});
          }
        }
        Promise.all(selected.map((i) => this.canvasLayers.getLatestVisibleColorsPromise(i).catch(() => {})))
          .then(() => {
            if (token !== this.visibleColorsRenderToken) return;
            this.renderLayersList();
          })
          .catch(() => {});
        return;
      }

      if (this.activeLayerIndex >= 0 && this.activeLayerIndex < layers.length) {
        const layer = layers[this.activeLayerIndex];
        const hasClip = layer && Array.isArray(layer.clipPathN) && layer.clipPathN.length >= 3;

        if (hasClip) {
          const clipPathN = layer.clipPathN;
          const clipKey = typeof layer.clipKey === 'string' && layer.clipKey
            ? layer.clipKey
            : this.makeClipKey(clipPathN);

          const idx = this.canvasLayers.addClippedSolidLayer(this.currentColor, clipPathN, clipKey);
          this.setActiveLayerIndex(idx);
          this.syncActiveShapeToLayerIndex(idx);
          this.renderLayersList();

          const token = ++this.visibleColorsRenderToken;
          this.canvasLayers.getLatestVisibleColorsPromise(idx)
            .then(() => {
              if (token !== this.visibleColorsRenderToken) return;
              this.renderLayersList();
            })
            .catch(() => {});
          return;
        }

        this.canvasLayers.addSolidPaintToLayerIndex(this.activeLayerIndex, this.currentColor);
        this.renderLayersList();
        return;
      }

      // No selection: apply to background.
      this.applySolidToBackground();
      this.renderLayersList();
    }

  getBackgroundLayerIndex() {
    const layers = this.canvasLayers && Array.isArray(this.canvasLayers.layers) ? this.canvasLayers.layers : [];
    if (layers.length === 0) return -1;

    const layer = layers[0];
    const hasClip = layer && Array.isArray(layer.clipPathN) && layer.clipPathN.length >= 3;
    return hasClip ? -1 : 0;
  }

  ensureBackgroundLayerExistsAsSolid(color) {
    const c = typeof color === 'string' && color.trim() ? color.trim() : '#000000';
    if (!this.canvasLayers || !Array.isArray(this.canvasLayers.layers)) return;

    this.canvasLayers.layers.unshift({
      clipPathN: null,
      clipKey: null,
      paints: [{ kind: 'solid', file: null, color: c }],
      visibleColors: [c],
    });

    if (typeof this.canvasLayers.cancelAllVisibleColorsSchedules === 'function') {
      this.canvasLayers.cancelAllVisibleColorsSchedules();
    }
    this.canvasLayers.redrawAllLayers();
  }

  ensureBackgroundLayerExistsAsPattern(file, repeatCount, color, thickness) {
    const f = typeof file === 'string' ? file.trim() : '';
    if (!f) return;
    const c = typeof color === 'string' && color.trim() ? color.trim() : '#000000';
    if (!this.canvasLayers || !Array.isArray(this.canvasLayers.layers)) return;

    this.canvasLayers.layers.unshift({
      clipPathN: null,
      clipKey: null,
      paints: [{ file: f, repeatCount, color: c, thickness, tileScaleMode: 'canvas' }],
    });

    if (typeof this.canvasLayers.cancelAllVisibleColorsSchedules === 'function') {
      this.canvasLayers.cancelAllVisibleColorsSchedules();
    }
    this.canvasLayers.redrawAllLayers();
  }

  applySolidToBackground() {
    const layers = this.canvasLayers && Array.isArray(this.canvasLayers.layers) ? this.canvasLayers.layers : [];
    const bgIdx = this.getBackgroundLayerIndex();
    if (bgIdx >= 0) {
      this.canvasLayers.addSolidPaintToLayerIndex(bgIdx, this.currentColor);
      return;
    }
    this.ensureBackgroundLayerExistsAsSolid(this.currentColor);
  }

  applyPatternToBackground() {
    const f = typeof this.currentFile === 'string' ? this.currentFile.trim() : '';
    if (!f) {
      this.applySolidToBackground();
      return;
    }

    const layers = this.canvasLayers && Array.isArray(this.canvasLayers.layers) ? this.canvasLayers.layers : [];
    const bgIdx = this.getBackgroundLayerIndex();
    if (bgIdx >= 0) {
      this.canvasLayers.addPatternPaintToLayerIndex(
        bgIdx,
        f,
        this.getRepeatCount(),
        this.currentColor,
        this.getThickness(),
        'canvas'
      );
      return;
    }

    this.ensureBackgroundLayerExistsAsPattern(
      f,
      this.getRepeatCount(),
      this.currentColor,
      this.getThickness()
    );
  }

    renderLayersList() {
      if (!(this.layersRoot instanceof HTMLElement)) return;
      const layers = this.canvasLayers && Array.isArray(this.canvasLayers.layers) ? this.canvasLayers.layers : [];
	  this.clearLayerThumbObjectUrls();

      this.layersRoot.innerHTML = '';
      const selectedSet = this.selectedLayerIndices instanceof Set ? this.selectedLayerIndices : new Set();

      // Newest layer first (top of list).
      for (let viewIndex = 0; viewIndex < layers.length; viewIndex++) {
        const i = layers.length - 1 - viewIndex; // model index
        const layer = layers[i] || {};

        const item = document.createElement('div');
        const isPrimary = i === this.activeLayerIndex;
        const isSelected = selectedSet.has(i) || isPrimary;
        item.className = 'layers__item' + (isSelected ? ' is-selected' : '') + (isPrimary ? ' is-primary' : '');
        item.draggable = true;
        item.dataset.viewIndex = String(viewIndex);

        const left = document.createElement('span');
        left.className = 'layers__left';

        const radio = document.createElement('input');
        radio.type = 'checkbox';
        radio.value = String(i);
        radio.checked = isSelected;
        radio.draggable = false;
        radio.addEventListener('click', (evt) => {
          evt.preventDefault();
          evt.stopPropagation();
          this.setInteractionMode('select');
          if (evt.shiftKey) this.toggleLayerSelection(i);
          else this.setLayerSelectionSingle(i);
          this.renderLayersList();
        });

        const num = document.createElement('span');
        num.className = 'layers__num';
        num.textContent = String(viewIndex + 1);

        left.appendChild(radio);
        left.appendChild(num);

        // Click on the row selects; Shift+click multi-selects.
        item.addEventListener('click', (evt) => {
          const target = evt.target instanceof HTMLElement ? evt.target : null;
          if (target && (target.closest('button') || target.closest('input') || target.closest('select'))) return;
          this.setInteractionMode('select');
          if (evt.shiftKey) this.toggleLayerSelection(i);
          else this.setLayerSelectionSingle(i);
          this.renderLayersList();
        });

        const swatches = document.createElement('span');
        swatches.className = 'layers__swatches';

        const paintsForType = Array.isArray(layer.paints) && layer.paints.length ? layer.paints : [];
        const imagePaint = paintsForType.find((p) => p && p.kind === 'image' && p.blob instanceof Blob);
        if (imagePaint) {
          const blob = imagePaint.blob;
          const url = URL.createObjectURL(blob);
          this.layerThumbObjectUrls.push(url);
          const thumb = document.createElement('span');
          thumb.className = 'layers__thumb';
          thumb.style.backgroundImage = `url(\"${url}\")`;
          swatches.appendChild(thumb);
        } else {

        const colors = [];
        const seen = new Set();

        if (Array.isArray(layer.visibleColors) && layer.visibleColors.length) {
          for (const c of layer.visibleColors) {
            const s = typeof c === 'string' && c.trim() ? c.trim() : '';
            if (!s) continue;
            if (seen.has(s)) continue;
            seen.add(s);
            colors.push(s);
          }
        } else {
          const paints = Array.isArray(layer.paints) && layer.paints.length ? layer.paints : [{ color: layer.color }];
          for (const p of paints) {
            const c = p && typeof p.color === 'string' && p.color.trim() ? p.color.trim() : '';
            if (!c) continue;
            if (seen.has(c)) continue;
            seen.add(c);
            colors.push(c);
          }
        }

          for (const c of colors) {
            const s = document.createElement('button');
            s.type = 'button';
            s.className = 'layers__swatch';
            s.style.backgroundColor = c;
            s.title = 'Verwijder kleur uit layer';
            s.setAttribute('aria-label', `Verwijder kleur ${c} uit layer`);
            s.draggable = false;
            s.addEventListener('click', (evt) => {
              evt.preventDefault();
              evt.stopPropagation();
              if (typeof evt.stopImmediatePropagation === 'function') evt.stopImmediatePropagation();

              const layers2 = this.canvasLayers && Array.isArray(this.canvasLayers.layers) ? this.canvasLayers.layers : [];
			  const sel = this.getSelectedLayerIndices();
			  const applyGroup = sel.length > 1 && sel.includes(i);
              if (applyGroup) {
                for (const li of sel) this.removeColorFromLayerIndex(li, c);
                return;
              }

              this.removeColorFromLayerIndex(i, c);
            });
            swatches.appendChild(s);
          }
        }

        const right = document.createElement('span');
        right.className = 'layers__right';

        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'layers__delete';
        del.textContent = '×';
        del.title = 'Verwijder layer';
        del.setAttribute('aria-label', 'Verwijder layer');
        del.draggable = false;
        del.addEventListener('click', (evt) => {
          evt.preventDefault();
          evt.stopPropagation();
          if (typeof evt.stopImmediatePropagation === 'function') evt.stopImmediatePropagation();

          const layers2 = this.canvasLayers && Array.isArray(this.canvasLayers.layers) ? this.canvasLayers.layers : [];
		  const sel = this.getSelectedLayerIndices();
		  const applyGroup = sel.length > 1 && sel.includes(i);
          if (applyGroup) {
            // Remove from highest index to lowest to avoid index shifts.
            sel.sort((a, b) => b - a);
            for (const li of sel) {
              this.canvasLayers.removeLayerAt(li);
            }

            const nextN = this.canvasLayers && Array.isArray(this.canvasLayers.layers) ? this.canvasLayers.layers.length : 0;
            if (nextN <= 0) {
              this.activeLayerIndex = -1;
              this.activeClipPathN = null;
              this.activeClipKey = null;
              this.selectedLayerIndices = new Set();
              if (typeof this.renderDrawOverlay === 'function') this.renderDrawOverlay();
              this.renderLayersList();
              return;
            }

            this.setLayerSelectionSingle(Math.min(this.activeLayerIndex, nextN - 1));
            this.renderLayersList();
            return;
          }

          this.removeLayerIndex(i);
        });

        right.appendChild(swatches);
        right.appendChild(del);

        item.appendChild(left);
        item.appendChild(right);
        this.layersRoot.appendChild(item);
      }
    }

  initTileScaleToggle() {
    if (!(this.tileScaleToShape instanceof HTMLInputElement)) return;
    if (this.tileScaleToShape.dataset.bound === '1') return;
    this.tileScaleToShape.dataset.bound = '1';

    const update = () => {
      this.currentTileScaleMode = this.tileScaleToShape.checked ? 'shape' : 'canvas';
    };

    update();
    this.tileScaleToShape.addEventListener('change', update);
  }

  initDrawShapeToMask() {
    if (!(this.canvas instanceof HTMLCanvasElement)) return;
    if (!this.canvas.parentElement) return;

    if (this.drawOverlay instanceof HTMLCanvasElement) return;

    const parent = this.canvas.parentElement;
    const parentStyle = getComputedStyle(parent);
    if (parentStyle.position === 'static') parent.style.position = 'relative';

    const overlay = document.createElement('canvas');
    overlay.id = 'drawOverlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.style.position = 'absolute';
    overlay.style.pointerEvents = 'auto';
    overlay.style.touchAction = 'none';
    overlay.style.cursor = 'crosshair';
    overlay.style.background = 'transparent';

    parent.appendChild(overlay);
    this.drawOverlay = overlay;
    this.drawOverlayCtx = overlay.getContext('2d');

    // Allow dropping saved images onto the canvas.
    overlay.addEventListener('dragover', (evt) => {
      evt.preventDefault();
      if (evt.dataTransfer) evt.dataTransfer.dropEffect = 'copy';
    });

    overlay.addEventListener('drop', (evt) => {
      evt.preventDefault();
      const dt = evt.dataTransfer;
      if (!dt) return;

      // Shapes
      const shapeId = dt.getData('application/x-patronen2026-shape');
      const shapeKey = typeof shapeId === 'string' ? shapeId.trim() : '';
      if (shapeKey) {
        const rect = overlay.getBoundingClientRect();
        const w = Math.max(1, rect.width);
        const h = Math.max(1, rect.height);
        const x = evt.clientX - rect.left;
        const y = evt.clientY - rect.top;
        const cxN = Math.max(0, Math.min(1, x / w));
        const cyN = Math.max(0, Math.min(1, y / h));

        this.savedShapesDB
          .get(shapeKey)
          .then((rec) => {
            if (!rec || !Array.isArray(rec.clipPathN) || rec.clipPathN.length < 3) return;
            const next = this.placeClipPathNAt(rec.clipPathN, cxN, cyN) || rec.clipPathN;
            this.activeClipPathN = next;
            this.activeClipKey = typeof rec.clipKey === 'string' && rec.clipKey ? rec.clipKey : this.makeClipKey(next);
            this.setActiveLayerIndex(-1);
            this.toolMode = 'draw';
            if (typeof this.renderDrawOverlay === 'function') this.renderDrawOverlay();
            this.renderLayersList();
          })
          .catch(() => {});
        return;
      }

      const imageId = dt.getData('application/x-patronen2026-image') || dt.getData('text/plain');
      const id = typeof imageId === 'string' ? imageId.trim() : '';
      if (!id) return;

      const rect = overlay.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      const x = evt.clientX - rect.left;
      const y = evt.clientY - rect.top;
      const clamp01 = (n) => Math.max(0, Math.min(1, n));

      this.savedImagesDB
        .get(id)
        .then((rec) => {
          if (!rec || !(rec.blob instanceof Blob)) return;

          // Place centered around the drop point, but keep the image aspect ratio.
          const base = 0.28;
          const iw = Number(rec.w) || 0;
          const ih = Number(rec.h) || 0;
          const ratio = iw > 0 && ih > 0 ? ih / iw : 1;

          let wN = base;
          let hN = base;
          if (ratio > 0.0001) {
            if (ratio >= 1) {
              // Tall image: cap height.
              hN = base;
              wN = Math.max(0.03, base / ratio);
            } else {
              // Wide image: cap width.
              wN = base;
              hN = Math.max(0.03, base * ratio);
            }
          }

          let xN = clamp01(x / w - wN / 2);
          let yN = clamp01(y / h - hN / 2);

          // Keep fully on-canvas.
          xN = Math.max(0, Math.min(1 - wN, xN));
          yN = Math.max(0, Math.min(1 - hN, yN));

          const idx = this.canvasLayers.addImageLayer(id, rec.blob, xN, yN, wN, hN);
          this.setLayerSelectionSingle(idx);
          this.renderLayersList();
        })
        .catch(() => {});
    });

    // Wheel scaling for selected image layers and selected shapes.
    overlay.addEventListener('wheel', (evt) => {
      const idx = this.activeLayerIndex;

      // 1) Image scaling (existing behavior)
      if (Number.isFinite(idx) && idx >= 0) {
        const paint = getImagePaintForLayerIndex(idx);
        if (paint) {
          evt.preventDefault();

          const xN = Number.isFinite(paint.xN) ? paint.xN : 0;
          const yN = Number.isFinite(paint.yN) ? paint.yN : 0;
          const wN = Number.isFinite(paint.wN) ? paint.wN : 0.25;
          const hN = Number.isFinite(paint.hN) ? paint.hN : 0.25;
          const minN = 0.03;

          const cx = xN + wN / 2;
          const cy = yN + hN / 2;
          const aspect = hN > 0.0001 ? wN / hN : 1;

          const dir = evt.deltaY > 0 ? -1 : 1;
          const factor = dir > 0 ? 1.08 : 1 / 1.08;
          let nextW = wN * factor;
          nextW = Math.max(minN, Math.min(1, nextW));
          let nextH = aspect > 0.0001 ? nextW / aspect : nextW;
          nextH = Math.max(minN, Math.min(1, nextH));

          let nextX = cx - nextW / 2;
          let nextY = cy - nextH / 2;
          nextX = Math.max(0, Math.min(1 - nextW, nextX));
          nextY = Math.max(0, Math.min(1 - nextH, nextY));

          paint.xN = clamp01(nextX);
          paint.yN = clamp01(nextY);
          paint.wN = clamp01(nextW);
          paint.hN = clamp01(nextH);

          this.canvasLayers.redrawAllLayers();
          drawOverlayPath();
          return;
        }
      }

      // 2) Shape scaling (active clip path)
      if (!Array.isArray(this.activeClipPathN) || this.activeClipPathN.length < 3) return;

      evt.preventDefault();

      const base = this.activeClipPathN
        .map((p) => (Array.isArray(p) && p.length >= 2 ? [Number(p[0]), Number(p[1])] : null))
        .filter((p) => p && Number.isFinite(p[0]) && Number.isFinite(p[1]));
      if (base.length < 3) return;

      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      for (const p of base) {
        if (p[0] < minX) minX = p[0];
        if (p[0] > maxX) maxX = p[0];
        if (p[1] < minY) minY = p[1];
        if (p[1] > maxY) maxY = p[1];
      }
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      const curW = Math.max(0.000001, maxX - minX);
      const curH = Math.max(0.000001, maxY - minY);

      const dir = evt.deltaY > 0 ? -1 : 1;
      let factor = dir > 0 ? 1.08 : 1 / 1.08;

      // Clamp minimum size.
      const minDim = 0.03;
      const minFactor = Math.max(minDim / curW, minDim / curH);
      factor = Math.max(factor, Math.min(1, minFactor));

      // Clamp maximum scale so the shape stays inside 0..1.
      if (factor > 1) {
        let maxFactor = Infinity;
        for (const p of base) {
          const dx = p[0] - cx;
          const dy = p[1] - cy;
          if (dx > 0) maxFactor = Math.min(maxFactor, (1 - cx) / dx);
          else if (dx < 0) maxFactor = Math.min(maxFactor, (0 - cx) / dx);
          if (dy > 0) maxFactor = Math.min(maxFactor, (1 - cy) / dy);
          else if (dy < 0) maxFactor = Math.min(maxFactor, (0 - cy) / dy);
        }
        if (Number.isFinite(maxFactor) && maxFactor > 0) factor = Math.min(factor, maxFactor);
      }

      if (!(Number.isFinite(factor) && factor > 0)) return;

      const next = base
        .map((p) => [clamp01(cx + (p[0] - cx) * factor), clamp01(cy + (p[1] - cy) * factor)])
        .filter((p) => Array.isArray(p) && p.length === 2);
      if (next.length < 3) return;

      this.activeClipPathN = next;
      this.activeClipKey = this.makeClipKey(next);

      // If the active clip is tied to an actual layer, keep it in sync and redraw.
      const layers = this.canvasLayers && Array.isArray(this.canvasLayers.layers) ? this.canvasLayers.layers : [];
      if (Number.isFinite(idx) && idx >= 0 && idx < layers.length) {
        const layer = layers[idx];
        if (layer && Array.isArray(layer.clipPathN) && layer.clipPathN.length >= 3) {
          layer.clipPathN = next.slice();
          layer.clipKey = this.activeClipKey;
          this.canvasLayers.redrawAllLayers();
          if (typeof this.canvasLayers.scheduleVisibleColorsCompute === 'function') {
            this.canvasLayers.scheduleVisibleColorsCompute(idx).catch(() => {});
          }
          this.renderLayersList();
        }
      }

      drawOverlayPath();
    }, { passive: false });

    const getPos = (evt) => {
      const rect = overlay.getBoundingClientRect();
      return [evt.clientX - rect.left, evt.clientY - rect.top];
    };

    const getOverlaySize = () => {
      const rect = overlay.getBoundingClientRect();
      return {
        w: Math.max(1, rect.width),
        h: Math.max(1, rect.height),
      };
    };

    const clamp01 = (n) => Math.max(0, Math.min(1, n));

  const getImagePaintForLayerIndex = (layerIndex) => {
    const layers = this.canvasLayers && Array.isArray(this.canvasLayers.layers) ? this.canvasLayers.layers : [];
    const layer = layers[layerIndex];
    if (!layer) return null;
    const paints = Array.isArray(layer.paints) ? layer.paints : [];
    return paints.find((p) => p && p.kind === 'image' && p.blob instanceof Blob) || null;
  };

  const getImageRectPxForLayerIndex = (layerIndex) => {
    const paint = getImagePaintForLayerIndex(layerIndex);
    if (!paint) return null;
    const { w, h } = getOverlaySize();
    const xN = Number.isFinite(paint.xN) ? paint.xN : 0;
    const yN = Number.isFinite(paint.yN) ? paint.yN : 0;
    const wN = Number.isFinite(paint.wN) ? paint.wN : 0.25;
    const hN = Number.isFinite(paint.hN) ? paint.hN : 0.25;
    return {
      x: xN * w,
      y: yN * h,
      w: wN * w,
      h: hN * h,
      xN,
      yN,
      wN,
      hN,
    };
  };

  const hitTestTopmostImageLayer = (px, py) => {
    const layers = this.canvasLayers && Array.isArray(this.canvasLayers.layers) ? this.canvasLayers.layers : [];
    const { w, h } = getOverlaySize();
    if (w <= 0 || h <= 0) return -1;

    for (let i = layers.length - 1; i >= 0; i--) {
      const rect = getImageRectPxForLayerIndex(i);
      if (!rect) continue;
      const inside = px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
      const onHandle = !!getImageHandleAtPoint(rect, px, py);
      if (inside || onHandle) return i;
    }
    return -1;
  };

  const getClipPolyPxForLayerIndex = (layerIndex) => {
    const layers = this.canvasLayers && Array.isArray(this.canvasLayers.layers) ? this.canvasLayers.layers : [];
    const layer = layers[layerIndex];
    const clipN = layer && Array.isArray(layer.clipPathN) ? layer.clipPathN : null;
    if (!clipN || clipN.length < 3) return null;
    const { w, h } = getOverlaySize();
    return clipN.map((q) => [q[0] * w, q[1] * h]);
  };

  const hitTestTopmostClipLayer = (px, py) => {
    const layers = this.canvasLayers && Array.isArray(this.canvasLayers.layers) ? this.canvasLayers.layers : [];
    for (let i = layers.length - 1; i >= 0; i--) {
      const polyPx = getClipPolyPxForLayerIndex(i);
      if (!polyPx) continue;
      if (pointInPolygon(px, py, polyPx)) return i;
    }
    return -1;
  };

  const getImageHandleAtPoint = (rect, px, py) => {
    if (!rect) return '';
    const hx = rect.x + rect.w;
    const hy = rect.y + rect.h;
    const r = 18;
    const dx = px - hx;
    const dy = py - hy;
    return Math.hypot(dx, dy) <= r ? 'se' : '';
  };

    const pointInPolygon = (x, y, poly) => {
      if (!Array.isArray(poly) || poly.length < 3) return false;
      let inside = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i][0];
        const yi = poly[i][1];
        const xj = poly[j][0];
        const yj = poly[j][1];

        const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 0.0000001) + xi;
        if (intersect) inside = !inside;
      }
      return inside;
    };

    const clearOverlay = () => {
      const ctx = this.drawOverlayCtx;
      if (!ctx) return;
      const rect = overlay.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      ctx.clearRect(0, 0, w, h);
    };

    const drawOverlayPath = () => {
      const ctx = this.drawOverlayCtx;
      if (!ctx) return;
      clearOverlay();

      let points = null;
      let shouldClose = false;

      if (this.isDrawing && Array.isArray(this.drawPath) && this.drawPath.length >= 2) {
        points = this.drawPath;
        shouldClose = false;
      } else if (Array.isArray(this.activeClipPathN) && this.activeClipPathN.length >= 2) {
        const rect = overlay.getBoundingClientRect();
        const w = Math.max(1, rect.width);
        const h = Math.max(1, rect.height);
        points = this.activeClipPathN.map((p) => [p[0] * w, p[1] * h]);
        shouldClose = true;
      }

      if (points && points.length >= 2) {
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = '#000000';
        ctx.globalAlpha = 0.8;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);
        for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
        if (shouldClose) ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }

    // Image selection outline (if active layer is an image-layer)
    if (this.activeLayerIndex >= 0) {
      const rect = getImageRectPxForLayerIndex(this.activeLayerIndex);
      if (rect && rect.w > 2 && rect.h > 2) {
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = '#000000';
        ctx.globalAlpha = 0.85;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
        // bottom-right handle
        ctx.setLineDash([]);
        ctx.globalAlpha = 0.75;
        ctx.fillStyle = '#000000';
        ctx.fillRect(rect.x + rect.w - 6, rect.y + rect.h - 6, 12, 12);
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(rect.x + rect.w - 6, rect.y + rect.h - 6, 12, 12);
        ctx.restore();
      }
    }

      // Crop rectangle preview (if any)
      const rectPx = this.cropRectPx;
      const rectN = this.cropRectN;
      let rx = null;
      let ry = null;
      let rw = null;
      let rh = null;
      if (rectPx && Number.isFinite(rectPx.x) && Number.isFinite(rectPx.y) && Number.isFinite(rectPx.w) && Number.isFinite(rectPx.h)) {
        rx = rectPx.x;
        ry = rectPx.y;
        rw = rectPx.w;
        rh = rectPx.h;
      } else if (rectN && Number.isFinite(rectN.x) && Number.isFinite(rectN.y) && Number.isFinite(rectN.w) && Number.isFinite(rectN.h)) {
        const { w, h } = getOverlaySize();
        rx = rectN.x * w;
        ry = rectN.y * h;
        rw = rectN.w * w;
        rh = rectN.h * h;
      }

      if (rw && rh && rw > 1 && rh > 1) {
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = '#000000';
        ctx.globalAlpha = 0.9;
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 3]);
        ctx.strokeRect(rx, ry, rw, rh);
        ctx.restore();
      }
    };

    this.renderDrawOverlay = drawOverlayPath;

    const minDist = 2;

    overlay.addEventListener('pointerdown', (evt) => {
      if (evt.button !== 0) return;

      const p = getPos(evt);

      const interactionMode = this.interactionMode === 'select' ? 'select' : 'draw';

    // Click-to-select image layer (topmost hit), and start move/resize.
    if (interactionMode === 'select' && this.toolMode !== 'crop') {
    const hitIdx = hitTestTopmostImageLayer(p[0], p[1]);
    if (hitIdx >= 0) {
      this.setLayerSelectionSingle(hitIdx);
      this.renderLayersList();
      drawOverlayPath();

      const rect = getImageRectPxForLayerIndex(hitIdx);
      const handle = getImageHandleAtPoint(rect, p[0], p[1]);
      this.isDraggingImage = true;
      this.imagePointerId = evt.pointerId;
      this.imageLayerIndex = hitIdx;
      this.imageDragMode = handle ? 'resize' : 'move';
      this.imageStartPos = p;
      this.imageStartPlacement = rect
        ? { xN: rect.xN, yN: rect.yN, wN: rect.wN, hN: rect.hN }
        : { xN: 0, yN: 0, wN: 0.25, hN: 0.25 };

      overlay.setPointerCapture(evt.pointerId);
      overlay.style.cursor = this.imageDragMode === 'resize' ? 'nwse-resize' : 'grabbing';
      evt.preventDefault();
      return;
    }
    }

      // Click-to-select clip (shape) layers on the canvas.
      // Shift+click toggles multi-selection.
      if (interactionMode === 'select' && this.toolMode !== 'crop') {
        const clipIdx = hitTestTopmostClipLayer(p[0], p[1]);
        if (clipIdx >= 0) {
          if (evt.shiftKey) {
            this.toggleLayerSelection(clipIdx);
            this.renderLayersList();
            drawOverlayPath();
            evt.preventDefault();
            return;
          }

          this.setLayerSelectionSingle(clipIdx);
          this.renderLayersList();
          drawOverlayPath();

          // Start dragging the selected shape.
          const polyPx = getClipPolyPxForLayerIndex(clipIdx);
          if (polyPx && pointInPolygon(p[0], p[1], polyPx)) {
            this.isDraggingShape = true;
            this.dragPointerId = evt.pointerId;
            this.dragLayerIndex = clipIdx;
            this.dragStartPos = p;
            this.dragStartClipPathN = Array.isArray(this.activeClipPathN)
              ? this.activeClipPathN.map((q) => [q[0], q[1]])
              : null;
            this.dragPendingPos = p;
            overlay.setPointerCapture(evt.pointerId);
            overlay.style.cursor = 'grabbing';
            evt.preventDefault();
            return;
          }
        }
      }

      if (this.toolMode === 'crop') {
        this.isCropping = true;
        this.cropPointerId = evt.pointerId;
        this.cropStartPos = p;
        this.cropPendingPos = p;
        this.cropRectPx = { x: p[0], y: p[1], w: 0, h: 0 };
        overlay.setPointerCapture(evt.pointerId);
        overlay.style.cursor = 'crosshair';
        drawOverlayPath();
        evt.preventDefault();
        return;
      }

      // If a clipped layer is selected and the user clicks inside its shape,
      // we drag the shape instead of starting a new drawing.
      const hasActiveClip = Array.isArray(this.activeClipPathN) && this.activeClipPathN.length >= 3;
      const canDragSelection = interactionMode === 'select' && hasActiveClip;
      if (canDragSelection) {
        const { w, h } = getOverlaySize();
        const polyPx = this.activeClipPathN.map((q) => [q[0] * w, q[1] * h]);
        if (pointInPolygon(p[0], p[1], polyPx)) {
          this.isDraggingShape = true;
          this.dragPointerId = evt.pointerId;
          this.dragLayerIndex = this.activeLayerIndex;
          this.dragStartPos = p;
          this.dragStartClipPathN = this.activeClipPathN.map((q) => [q[0], q[1]]);
          this.dragPendingPos = p;
          overlay.setPointerCapture(evt.pointerId);
          overlay.style.cursor = 'grabbing';
          evt.preventDefault();
          return;
        }
      }

      // Background click always clears selection.
      this.setLayerSelectionSingle(-1);
      this.renderLayersList();
      drawOverlayPath();

      // In Selecteren mode, background click should not start drawing.
      if (interactionMode === 'select') {
        evt.preventDefault();
        return;
      }

      this.isDrawing = true;
      this.drawPointerId = evt.pointerId;
      overlay.setPointerCapture(evt.pointerId);

      this.drawPath = [p];
      drawOverlayPath();
    });

    overlay.addEventListener('pointermove', (evt) => {
      const p = getPos(evt);

      if (this.toolMode === 'crop' && !this.isCropping) {
        overlay.style.cursor = 'crosshair';
        return;
      }

      if (this.isCropping) {
        if (this.cropPointerId !== evt.pointerId) return;
        if (!Array.isArray(this.cropStartPos) || this.cropStartPos.length < 2) return;
        this.cropPendingPos = p;
        const x0 = this.cropStartPos[0];
        const y0 = this.cropStartPos[1];
        const x1 = p[0];
        const y1 = p[1];
        const rx = Math.min(x0, x1);
        const ry = Math.min(y0, y1);
        const rw = Math.abs(x1 - x0);
        const rh = Math.abs(y1 - y0);
        this.cropRectPx = { x: rx, y: ry, w: rw, h: rh };
        drawOverlayPath();
        evt.preventDefault();
        return;
      }

      if (this.isDraggingShape) {
        if (this.dragPointerId !== evt.pointerId) return;
        this.dragPendingPos = p;

        if (!this.dragRaf) {
          this.dragRaf = window.requestAnimationFrame(() => {
            this.dragRaf = 0;
            if (!this.isDraggingShape) return;
            if (!Array.isArray(this.dragStartClipPathN) || this.dragStartClipPathN.length < 3) return;
            if (!Array.isArray(this.dragStartPos) || this.dragStartPos.length < 2) return;
            if (!Array.isArray(this.dragPendingPos) || this.dragPendingPos.length < 2) return;

            const { w, h } = getOverlaySize();
            const dx = this.dragPendingPos[0] - this.dragStartPos[0];
            const dy = this.dragPendingPos[1] - this.dragStartPos[1];
            let dxN = dx / w;
            let dyN = dy / h;

            // Clamp translation as a whole to avoid distorting the polygon.
            let minX = Infinity;
            let minY = Infinity;
            let maxX = -Infinity;
            let maxY = -Infinity;
            for (const q of this.dragStartClipPathN) {
              if (!Array.isArray(q) || q.length < 2) continue;
              if (q[0] < minX) minX = q[0];
              if (q[1] < minY) minY = q[1];
              if (q[0] > maxX) maxX = q[0];
              if (q[1] > maxY) maxY = q[1];
            }
            if ([minX, minY, maxX, maxY].every(Number.isFinite)) {
              const minDx = -minX;
              const maxDx = 1 - maxX;
              const minDy = -minY;
              const maxDy = 1 - maxY;
              dxN = Math.max(minDx, Math.min(maxDx, dxN));
              dyN = Math.max(minDy, Math.min(maxDy, dyN));
            }

            const nextClipN = this.dragStartClipPathN
              .map((q) => [q[0] + dxN, q[1] + dyN])
              .filter((q) => Array.isArray(q) && q.length === 2);

            if (nextClipN.length < 3) return;

            const nextKey = this.makeClipKey(nextClipN);

            if (this.dragLayerIndex >= 0) {
              const layers = this.canvasLayers && Array.isArray(this.canvasLayers.layers) ? this.canvasLayers.layers : [];
              const layer = layers[this.dragLayerIndex];
              if (!layer) return;

              layer.clipPathN = nextClipN;
              layer.clipKey = nextKey;
              this.activeClipPathN = nextClipN.slice();
              this.activeClipKey = nextKey;
              this.canvasLayers.redrawAllLayers();
              drawOverlayPath();
              return;
            }

            // Free selection (no layer): move only the active selection.
            this.activeClipPathN = nextClipN.slice();
            this.activeClipKey = nextKey;
            drawOverlayPath();
          });
        }

        evt.preventDefault();
        return;
      }

    if (this.isDraggingImage) {
    if (this.imagePointerId !== evt.pointerId) return;
    if (!Array.isArray(this.imageStartPos) || this.imageStartPos.length < 2) return;
    if (!this.imageStartPlacement) return;
    const idx = this.imageLayerIndex;
    if (idx < 0) return;

    const paint = getImagePaintForLayerIndex(idx);
    if (!paint) return;

    const { w, h } = getOverlaySize();
    const dx = p[0] - this.imageStartPos[0];
    const dy = p[1] - this.imageStartPos[1];
    let xN = this.imageStartPlacement.xN;
    let yN = this.imageStartPlacement.yN;
    let wN = this.imageStartPlacement.wN;
    let hN = this.imageStartPlacement.hN;

    if (this.imageDragMode === 'move') {
      xN = xN + dx / w;
      yN = yN + dy / h;
      xN = Math.max(0, Math.min(1 - wN, xN));
      yN = Math.max(0, Math.min(1 - hN, yN));
    } else if (this.imageDragMode === 'resize') {
      const minN = 0.03;
      const aspect = hN > 0.0001 ? wN / hN : 1;
      const delta = Math.abs(dx / w) > Math.abs(dy / h) ? dx / w : dy / h;
      let nextW = wN + delta;
      nextW = Math.max(minN, Math.min(1, nextW));
      let nextH = aspect > 0.0001 ? nextW / aspect : nextW;
      nextH = Math.max(minN, Math.min(1, nextH));
      // keep top-left fixed; clamp within canvas
      if (xN + nextW > 1) nextW = Math.max(minN, 1 - xN);
      if (aspect > 0.0001) nextH = Math.max(minN, nextW / aspect);
      if (yN + nextH > 1) nextH = Math.max(minN, 1 - yN);
      wN = nextW;
      hN = nextH;
    }

    paint.xN = clamp01(xN);
    paint.yN = clamp01(yN);
    paint.wN = clamp01(wN);
    paint.hN = clamp01(hN);

    this.canvasLayers.redrawAllLayers();
    drawOverlayPath();
    evt.preventDefault();
    return;
    }

      if (this.isDrawing) {
        if (this.drawPointerId !== evt.pointerId) return;

        const last = this.drawPath[this.drawPath.length - 1];
        const dx = p[0] - last[0];
        const dy = p[1] - last[1];
        if (Math.hypot(dx, dy) < minDist) return;

        this.drawPath.push(p);
        drawOverlayPath();
        return;
      }

      // Hover cursor hint when a shape is selected.
      const hasActiveClip = Array.isArray(this.activeClipPathN) && this.activeClipPathN.length >= 3;
      if (this.activeLayerIndex >= 0) {
		const imgRect = getImageRectPxForLayerIndex(this.activeLayerIndex);
		if (imgRect) {
			const handle = getImageHandleAtPoint(imgRect, p[0], p[1]);
			const inside = p[0] >= imgRect.x && p[0] <= imgRect.x + imgRect.w && p[1] >= imgRect.y && p[1] <= imgRect.y + imgRect.h;
			overlay.style.cursor = handle ? 'nwse-resize' : inside ? 'move' : 'crosshair';
			return;
		}
	  }

      if (this.activeLayerIndex >= 0 && hasActiveClip) {
        const { w, h } = getOverlaySize();
        const polyPx = this.activeClipPathN.map((q) => [q[0] * w, q[1] * h]);
        overlay.style.cursor = pointInPolygon(p[0], p[1], polyPx) ? 'move' : 'crosshair';
      } else {
        overlay.style.cursor = 'crosshair';
      }
    });

    const finish = (evt) => {
      if (this.isCropping) {
        if (this.cropPointerId !== evt.pointerId) return;
        this.isCropping = false;
        this.cropPointerId = null;

        const start = this.cropStartPos;
        const end = this.cropPendingPos;
        this.cropStartPos = null;
        this.cropPendingPos = null;

        const { w, h } = getOverlaySize();

        if (Array.isArray(start) && Array.isArray(end)) {
          const x0 = Math.min(start[0], end[0]);
          const y0 = Math.min(start[1], end[1]);
          const x1 = Math.max(start[0], end[0]);
          const y1 = Math.max(start[1], end[1]);
          const rw = x1 - x0;
          const rh = y1 - y0;
          const minPx = 6;

          if (rw >= minPx && rh >= minPx) {
            this.cropRectN = {
              x: clamp01(x0 / w),
              y: clamp01(y0 / h),
              w: clamp01(rw / w),
              h: clamp01(rh / h),
            };
          }
        }

        this.cropRectPx = null;
        this.toolMode = 'draw';
        overlay.style.cursor = 'crosshair';
        drawOverlayPath();
        evt.preventDefault();
        return;
      }

      if (this.isDraggingShape) {
        if (this.dragPointerId !== evt.pointerId) return;
        this.isDraggingShape = false;
        this.dragPointerId = null;
        this.dragLayerIndex = -1;
        this.dragStartPos = null;
        this.dragStartClipPathN = null;
        this.dragPendingPos = null;
        if (this.dragRaf) {
          window.cancelAnimationFrame(this.dragRaf);
          this.dragRaf = 0;
        }
        overlay.style.cursor = 'crosshair';
        evt.preventDefault();
        return;
      }

    if (this.isDraggingImage) {
    if (this.imagePointerId !== evt.pointerId) return;
    this.isDraggingImage = false;
    this.imagePointerId = null;
    this.imageLayerIndex = -1;
    this.imageDragMode = '';
    this.imageStartPos = null;
    this.imageStartPlacement = null;
    overlay.style.cursor = 'crosshair';
    evt.preventDefault();
    return;
    }

      if (!this.isDrawing) return;
      if (this.drawPointerId !== evt.pointerId) return;

      this.isDrawing = false;
      this.drawPointerId = null;

      const path = Array.isArray(this.drawPath) ? this.drawPath.slice() : [];
      this.drawPath = [];
      if (path.length < 3) return;

      const rect = overlay.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      const pathN = path
        .map((p) => [Math.max(0, Math.min(1, p[0] / w)), Math.max(0, Math.min(1, p[1] / h))])
        .filter((p) => Array.isArray(p) && p.length === 2);

      const nextKey = this.makeClipKey(pathN);

      this.activeClipPathN = pathN;
      this.activeClipKey = nextKey;

      // A new layer item is created only when the drawn shape changes.
      // When the shape stays the same, we append paints into the existing shape-layer.
      this.applyToActiveShape();

      drawOverlayPath();
    };

    overlay.addEventListener('pointerup', finish);
    overlay.addEventListener('pointercancel', finish);

    this.resizeDrawOverlay();
  }

  resizeDrawOverlay() {
    if (!(this.canvas instanceof HTMLCanvasElement)) return;
    if (!(this.drawOverlay instanceof HTMLCanvasElement)) return;
    const overlay = this.drawOverlay;

    const canvasRect = this.canvas.getBoundingClientRect();
    const parent = this.canvas.parentElement;
    const parentRect = parent ? parent.getBoundingClientRect() : null;
    if (!parentRect) return;

    const left = canvasRect.left - parentRect.left;
    const top = canvasRect.top - parentRect.top;
    overlay.style.left = `${left}px`;
    overlay.style.top = `${top}px`;
    overlay.style.width = `${canvasRect.width}px`;
    overlay.style.height = `${canvasRect.height}px`;

    const dpr = window.devicePixelRatio || 1;
    overlay.width = Math.max(1, Math.round(canvasRect.width * dpr));
    overlay.height = Math.max(1, Math.round(canvasRect.height * dpr));
    const ctx = overlay.getContext('2d');
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (typeof this.renderDrawOverlay === 'function') this.renderDrawOverlay();
  }

  initThicknessControl() {
    if (!(this.thickness instanceof HTMLInputElement)) return;
    if (!(this.thicknessValue instanceof HTMLElement)) return;
    if (this.thickness.dataset.bound === '1') return;
    this.thickness.dataset.bound = '1';

    const update = () => {
      this.thicknessValue.textContent = String(this.thickness.value);
      const raw = Number(this.thickness.value);
      this.currentThickness = Number.isFinite(raw) ? Math.max(1, Math.min(100, Math.round(raw))) : 1;

      // Keep preview in sync with thickness.
      if (this.preview instanceof HTMLElement) this.applySelection(this.currentFile);

      // Apply to group selection.
      this.scheduleUpdateSelectedLayersPatternParams({ thickness: this.currentThickness });
    };

    update();
    this.thickness.addEventListener('input', update);
  }

  initPaletteControl() {
    if (!(this.palette instanceof HTMLElement)) return;
    if (this.palette.dataset.bound === '1') return;
    this.palette.dataset.bound = '1';

    const colors = [
      '#ff0000',
      '#ff7f00',
      '#ffff00',
      '#00ff00',
      '#00ffff',
      '#0000ff',
      '#7f00ff',
      '#ff00ff',
      '#7f8c8d',
      '#8e5a2a',
      '#000000',
      '#ffffff',
    ];

    this.palette.innerHTML = '';
    for (const c of colors) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'palette__swatch';
      btn.style.backgroundColor = c;
      btn.setAttribute('aria-label', `Kleur ${c}`);
      btn.addEventListener('click', () => {
        this.setBaseColor(c);
      });
      this.palette.appendChild(btn);
    }

    this.setBaseColor(this.baseColor);
  }

  setBaseColor(color) {
    this.baseColor = typeof color === 'string' && color.trim() ? color.trim() : '#000000';

    // Picking a base color also resets the working color.
    this.currentColor = this.baseColor;

    if (this.palette instanceof HTMLElement) {
      for (const el of Array.from(this.palette.children)) {
        if (!(el instanceof HTMLElement)) continue;
        const bg = el.style.backgroundColor;
        el.classList.toggle(
          'is-active',
          bg === this.baseColor || this.normalizeCssColor(bg) === this.normalizeCssColor(this.baseColor)
        );
      }
    }

    if (this.preview instanceof HTMLElement) this.applySelection(this.currentFile);
    this.updateColorBars();
  }

  setCurrentColor(color) {
    this.currentColor = typeof color === 'string' && color.trim() ? color.trim() : '#000000';

    // Working color should update preview, but should not move the palette or rebuild bars.
    if (this.preview instanceof HTMLElement) this.applySelection(this.currentFile);
  }

  initColorMixCanvasControl() {
    const canvases = [this.colorMixCanvas, this.colorMixCanvasPatterns, this.colorMixCanvasShapes].filter(
      (c) => c instanceof HTMLCanvasElement
    );
    for (const canvas of canvases) {
      if (!(canvas instanceof HTMLCanvasElement)) continue;
      if (canvas.dataset.boundMix === '1') continue;
      canvas.dataset.boundMix = '1';
      canvas.style.cursor = 'pointer';
      canvas.addEventListener('click', (evt) => {
        const rect = canvas.getBoundingClientRect();
        const x = evt.clientX - rect.left;
        const y = evt.clientY - rect.top;
        const w = rect.width;
        if (!w) return;

        // Top strip (30px): quick-pick white/black.
        if (y >= 0 && y < 30) {
          const picked = x < w / 2 ? '#ffffff' : '#000000';
          this.setCurrentColor(picked);
          return;
        }

        const t = Math.max(0, Math.min(0.999999, x / w));
        let key = 'primary';
        if (t >= 0.8 && t < 0.9) key = 'complement';
        else if (t >= 0.9 && t < 0.95) key = 'supportA';
        else if (t >= 0.95) key = 'supportB';

        const colors = this.colorBarColors && Array.isArray(this.colorBarColors[key]) ? this.colorBarColors[key] : [];
        const idx = this.colorBarSelectedIndex && Number.isFinite(this.colorBarSelectedIndex[key]) ? this.colorBarSelectedIndex[key] : -1;
        const picked = idx >= 0 && idx < colors.length ? colors[idx] : '';
        if (picked) this.setCurrentColor(picked);
      });
    }
  }

  parseCssRgb(color) {
    const s = typeof color === 'string' ? color.trim() : '';
    if (!s) return null;
    const m = s.match(/rgba?\(([^)]+)\)/i);
    if (!m) return null;
    const parts = m[1].split(',').map((p) => p.trim());
    if (parts.length < 3) return null;
    const r = Number(parts[0]);
    const g = Number(parts[1]);
    const b = Number(parts[2]);
    if (![r, g, b].every((v) => Number.isFinite(v))) return null;
    return {
      r: Math.max(0, Math.min(255, Math.round(r))),
      g: Math.max(0, Math.min(255, Math.round(g))),
      b: Math.max(0, Math.min(255, Math.round(b))),
    };
  }

  rgbToHsl(rgb) {
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    const d = max - min;
    if (d !== 0) {
      s = d / (1 - Math.abs(2 * l - 1));
      s = Number.isFinite(s) ? s : 0;
      s = Math.max(0, Math.min(1, s));
      s *= 100;
      s = Math.max(0, Math.min(100, s));
      s = Number.isFinite(s) ? s : 0;
      s = Math.round(s);

      switch (max) {
        case r:
          h = ((g - b) / d) % 6;
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        default:
          h = (r - g) / d + 4;
          break;
      }
      h = Math.round(h * 60);
      if (h < 0) h += 360;
    }
    let ll = Math.round(l * 100);
    ll = Math.max(0, Math.min(100, ll));
    return { h, s, l: ll };
  }

  hslToRgb(hsl) {
    const h = ((hsl.h % 360) + 360) % 360;
    const s = Math.max(0, Math.min(100, hsl.s)) / 100;
    const l = Math.max(0, Math.min(100, hsl.l)) / 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let rp = 0;
    let gp = 0;
    let bp = 0;
    if (h < 60) {
      rp = c;
      gp = x;
      bp = 0;
    } else if (h < 120) {
      rp = x;
      gp = c;
      bp = 0;
    } else if (h < 180) {
      rp = 0;
      gp = c;
      bp = x;
    } else if (h < 240) {
      rp = 0;
      gp = x;
      bp = c;
    } else if (h < 300) {
      rp = x;
      gp = 0;
      bp = c;
    } else {
      rp = c;
      gp = 0;
      bp = x;
    }
    return {
      r: Math.max(0, Math.min(255, Math.round((rp + m) * 255))),
      g: Math.max(0, Math.min(255, Math.round((gp + m) * 255))),
      b: Math.max(0, Math.min(255, Math.round((bp + m) * 255))),
    };
  }

  rgbaCss(rgb, alpha) {
    const a = Number.isFinite(alpha) ? Math.max(0, Math.min(1, alpha)) : 1;
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
  }

  renderColorBar(el, baseHsl, alpha) {
    if (!(el instanceof HTMLElement)) return;
    el.innerHTML = '';
    const steps = Number.isFinite(this.colorBarSteps) ? Math.max(2, Math.min(64, Math.round(this.colorBarSteps))) : 16;
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const l = Math.round(92 + (18 - 92) * t);
      const rgb = this.hslToRgb({ h: baseHsl.h, s: baseHsl.s, l });
      const sw = document.createElement('button');
      sw.type = 'button';
      sw.className = 'colorbar__swatch';
      sw.style.backgroundColor = this.rgbaCss(rgb, alpha);
      el.appendChild(sw);
    }
  }

  setColorBarSelection(key, index) {
    const k = key === 'primary' || key === 'complement' || key === 'supportA' || key === 'supportB' ? key : 'primary';
    const colors = this.colorBarColors && Array.isArray(this.colorBarColors[k]) ? this.colorBarColors[k] : [];
    if (!colors.length) return;
    const idx = Number.isFinite(index) ? Math.max(0, Math.min(colors.length - 1, Math.round(index))) : 0;
    this.colorBarSelectedIndex[k] = idx;
    this.applyColorBarActiveStates();
    this.renderColorMixCanvas();
  }

  applyColorBarActiveStates() {
    const mapping = [
      { key: 'primary', el: this.colorBarPrimary },
      { key: 'complement', el: this.colorBarComplement },
      { key: 'supportA', el: this.colorBarSupportA },
      { key: 'supportB', el: this.colorBarSupportB },
    ];
    for (const m of mapping) {
      if (!(m.el instanceof HTMLElement)) continue;
      const idx = this.colorBarSelectedIndex[m.key];
      const children = Array.from(m.el.children);
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (!(child instanceof HTMLElement)) continue;
        child.classList.toggle('is-active', i === idx);
      }
    }
  }

  ensureDefaultSelections() {
    const keys = ['primary', 'complement', 'supportA', 'supportB'];
    for (const k of keys) {
      const colors = this.colorBarColors && Array.isArray(this.colorBarColors[k]) ? this.colorBarColors[k] : [];
      if (!colors.length) continue;
      const cur = this.colorBarSelectedIndex[k];
      if (Number.isFinite(cur) && cur >= 0 && cur < colors.length) continue;
      this.colorBarSelectedIndex[k] = Math.floor((colors.length - 1) / 2);
    }
  }

  resizeColorMixCanvas() {
    // Backwards-compatible wrapper (kept for call sites).
    if (this.colorMixCanvas instanceof HTMLCanvasElement) this.resizeColorMixCanvasEl(this.colorMixCanvas);
    if (this.colorMixCanvasPatterns instanceof HTMLCanvasElement) this.resizeColorMixCanvasEl(this.colorMixCanvasPatterns);
    if (this.colorMixCanvasShapes instanceof HTMLCanvasElement) this.resizeColorMixCanvasEl(this.colorMixCanvasShapes);
  }

  resizeColorMixCanvasEl(canvas) {
    if (!(canvas instanceof HTMLCanvasElement)) return;
    const rect = canvas.getBoundingClientRect();
    const cssW = Math.max(1, rect.width);
    const cssH = Math.max(1, rect.height);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(cssW * dpr));
    canvas.height = Math.max(1, Math.round(cssH * dpr));
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  renderColorMixCanvas() {
    const canvases = [this.colorMixCanvas, this.colorMixCanvasPatterns, this.colorMixCanvasShapes].filter(
      (c) => c instanceof HTMLCanvasElement
    );
    if (!canvases.length) return;

    const topStripH = 30;

    const getColor = (k) => {
      const colors = this.colorBarColors && Array.isArray(this.colorBarColors[k]) ? this.colorBarColors[k] : [];
      const idx = this.colorBarSelectedIndex && Number.isFinite(this.colorBarSelectedIndex[k]) ? this.colorBarSelectedIndex[k] : -1;
      return idx >= 0 && idx < colors.length ? colors[idx] : null;
    };

    const c1 = getColor('primary') || this.currentColor || '#000000';
    const c2 = getColor('complement') || c1;
    const c3 = getColor('supportA') || c2;
    const c4 = getColor('supportB') || c2;

    for (const canvas of canvases) {
      if (!(canvas instanceof HTMLCanvasElement)) continue;
      // When hidden, dimensions might be 0; skip until visible.
      const w = canvas.getBoundingClientRect().width;
      const h = canvas.getBoundingClientRect().height;
      if (!w || !h) continue;
      this.resizeColorMixCanvasEl(canvas);
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      ctx.clearRect(0, 0, w, h);

      // Top strip: white + black blocks.
      const stripH = Math.max(0, Math.min(topStripH, h));
      if (stripH > 0) {
        const halfW = w / 2;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, halfW, stripH);
        ctx.fillStyle = '#000000';
        ctx.fillRect(halfW, 0, w - halfW, stripH);
      }

      const mixY = stripH;
      const mixH = Math.max(0, h - stripH);
      if (mixH <= 0) continue;

      let x = 0;
      const widths = [0.8, 0.1, 0.05, 0.05].map((p) => Math.round(w * p));
      widths[3] = Math.max(0, w - (widths[0] + widths[1] + widths[2]));
      const colors = [c1, c2, c3, c4];
      for (let i = 0; i < widths.length; i++) {
        const ww = widths[i];
        ctx.fillStyle = colors[i];
        ctx.fillRect(x, mixY, ww, mixH);
        x += ww;
      }
    }
  }

  updateColorBars() {
    const els = [this.colorBarPrimary, this.colorBarComplement, this.colorBarSupportA, this.colorBarSupportB];
    if (!els.some((el) => el instanceof HTMLElement)) return;

    const normalized = this.normalizeCssColor(this.baseColor);
    const rgb = this.parseCssRgb(normalized);
    if (!rgb) return;

    const hsl = this.rgbToHsl(rgb);
    const complement = { h: (hsl.h + 180) % 360, s: hsl.s, l: hsl.l };
    const supportA = { h: (complement.h + 30) % 360, s: complement.s, l: complement.l };
    const supportB = { h: (complement.h + 360 - 30) % 360, s: complement.s, l: complement.l };

    const alpha = 1;

    // Render bars as clickable tint swatches.
    this.colorBarColors.primary = [];
    this.colorBarColors.complement = [];
    this.colorBarColors.supportA = [];
    this.colorBarColors.supportB = [];

    const render = (el, key, base) => {
      if (!(el instanceof HTMLElement)) return;
      el.innerHTML = '';
      const steps = Number.isFinite(this.colorBarSteps) ? Math.max(2, Math.min(64, Math.round(this.colorBarSteps))) : 16;
      for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1);
        const l = Math.round(92 + (18 - 92) * t);
        const rgbStep = this.hslToRgb({ h: base.h, s: base.s, l });
        const css = this.rgbaCss(rgbStep, alpha);
        this.colorBarColors[key].push(css);
        const sw = document.createElement('button');
        sw.type = 'button';
        sw.className = 'colorbar__swatch';
        sw.style.backgroundColor = css;
        sw.setAttribute('aria-label', `Tint ${i + 1}`);
        sw.addEventListener('click', () => this.setColorBarSelection(key, i));
        el.appendChild(sw);
      }
    };

    render(this.colorBarPrimary, 'primary', hsl);
    render(this.colorBarComplement, 'complement', complement);
    render(this.colorBarSupportA, 'supportA', supportA);
    render(this.colorBarSupportB, 'supportB', supportB);

    this.ensureDefaultSelections();
    this.applyColorBarActiveStates();
    this.renderColorMixCanvas();
  }

  normalizeCssColor(color) {
    const tmp = document.createElement('div');
    tmp.style.color = color;
    document.body.appendChild(tmp);
    const out = getComputedStyle(tmp).color;
    document.body.removeChild(tmp);
    return out;
  }

    initRepeatControl() {
      if (!(this.repeat instanceof HTMLInputElement)) return;
      if (!(this.repeatValue instanceof HTMLElement)) return;

      const update = () => {
        this.repeatValue.textContent = String(this.repeat.value);

        const nextRepeat = this.getRepeatCount();
        this.scheduleUpdateSelectedLayersPatternParams({ repeatCount: nextRepeat });
      };
      update();
      this.repeat.addEventListener('input', update);
    }

    getRepeatCount() {
      if (!(this.repeat instanceof HTMLInputElement)) return 10;
      const raw = Number(this.repeat.value);
      if (!Number.isFinite(raw)) return 10;
      return Math.max(1, Math.min(100, Math.round(raw)));
    }

	getThickness() {
		if (!(this.thickness instanceof HTMLInputElement)) return 1;
		const raw = Number(this.thickness.value);
		if (!Number.isFinite(raw)) return 1;
    return Math.max(1, Math.min(100, Math.round(raw)));
	}

    populateOptions() {
      this.select.innerHTML = '';
      for (const p of this.patterns) {
        const opt = document.createElement('option');
        opt.value = p.file;
        opt.textContent = p.label;
        this.select.appendChild(opt);
      }
    }

    applySelection(file) {
      const f = typeof file === 'string' ? file : '';
      this.currentFile = f;

      const token = ++this.previewToken;

      if (!f) {
        this.preview.style.backgroundImage = 'none';
        this.preview.style.backgroundColor = this.currentColor;
        this.preview.setAttribute('aria-label', 'Patroon preview: geen');
        return;
      }

      this.preview.style.backgroundColor = '';
      this.preview.setAttribute('aria-label', `Patroon preview: ${f}`);

      const thickness = this.getThickness();
      const effectiveThickness = thickness;

      this.canvasLayers.loadSvgText(f)
        .then((svgText) => this.canvasLayers.buildSvgVariant(svgText, this.currentColor, effectiveThickness))
        .then((variantText) => {
          if (token !== this.previewToken) return;
          const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(variantText)}`;
          this.preview.style.backgroundImage = `url(\"${dataUrl}\")`;
        })
        .catch(() => {
          // Fallback to raw asset if something goes wrong.
          if (token !== this.previewToken) return;
          const url = `./patronen/${f}`;
          this.preview.style.backgroundImage = `url(\"${url}\")`;
        });
    }
  }

  NS.initLayout = function initLayout() {
    const picker = new PatternPickerController();
    picker.init();
    new MenuController({
      onRightViewSelect: (view) => picker.setRightView(view),
      onAction: (action) => {
        if (action === 'reset') picker.resetToStart();
      },
    }).init();
    new PanelsController().init();
  };
})();

'use strict';

(function () {
  const NS = (window.Patronen2026 = window.Patronen2026 || {});

  function qs(id) {
    return document.getElementById(id);
  }

  class MenuController {
    constructor() {
      this.toggle = qs('menuToggle');
      this.nav = qs('topnav');
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

        if (window.matchMedia('(max-width: 700px)').matches) {
          document.body.classList.remove('menu-open');
          this.toggle.setAttribute('aria-expanded', 'false');
        }
      });
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

      const layer = this.layers?.[layerIndex];
      if (!layer) return Promise.resolve([]);
      if (expectedLayer && layer !== expectedLayer) return Promise.resolve(Array.isArray(layer.visibleColors) ? layer.visibleColors : []);
      const clipPathN = layer.clipPathN;
      if (!Array.isArray(clipPathN) || clipPathN.length < 3) {
        // Non-clipped layer: just report its last paint color.
        const paints = Array.isArray(layer.paints) ? layer.paints : [];
        const last = paints[paints.length - 1];
        const c = typeof last?.color === 'string' && last.color.trim() ? last.color.trim() : '';
        layer.visibleColors = c ? [c] : [];
        return Promise.resolve(layer.visibleColors);
      }

      const paints = Array.isArray(layer.paints) ? layer.paints.slice() : [];
      const candidates = [];
      const candidateRgb = [];
      const seen = new Set();
      for (const p of paints) {
        const c = typeof p?.color === 'string' && p.color.trim() ? p.color.trim() : '';
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
        const kind = p?.kind;
        const color = p?.color;
        if (kind === 'solid' || !p?.file) {
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
      if (cached?.img?.complete) return Promise.resolve(cached.img);
      if (cached?.promise) return cached.promise;

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
    if (cached?.promise) return cached.promise;

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
    const clamped = Math.max(1, Math.min(200, t));

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
    const effective = file === '21-stip.svg' ? Math.min(200, clamped * 2) : clamped;
    const key = `${file}|${safeColor}|${effective}`;

    const cached = this.variantCache.get(key);
    if (cached?.img?.complete) return Promise.resolve(cached.img);
    if (cached?.promise) return cached.promise;

    const img = new Image();
    const promise = this.loadSvgText(file)
      .then((svgText) => this.buildSvgVariant(svgText, safeColor, effective))
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
        const clipPathN = layer?.clipPathN || null;
        const paints = Array.isArray(layer?.paints) && layer.paints.length
          ? layer.paints
          : [
              {
                file: layer?.file,
                repeatCount: layer?.repeatCount,
                color: layer?.color,
                thickness: layer?.thickness,
                tileScaleMode: layer?.tileScaleMode,
              },
            ];

        for (const paint of paints) {
          const kind = paint?.kind;
          if (kind === 'solid' || !paint?.file) {
            const color = paint?.color;
            this.drawQueue = this.drawQueue
              .then(() => {
                this.resizeToCSSPixels();
                this.drawSolidLayer(color, clipPathN);
              })
              .catch(() => {});
            continue;
          }

          const file = paint?.file;
          if (!file) continue;
          const repeatCount = paint?.repeatCount;
          const color = paint?.color;
          const thickness = paint?.thickness;
          const tileScaleMode = paint?.tileScaleMode;

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
      const layer = this.layers?.[idx];
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

    hasLayers() {
      return this.layers.length > 0;
    }
  }

  class PatternPickerController {
    constructor() {
      this.select = qs('patternSelect');
      this.preview = qs('patternPreview');
      this.canvas = qs('mainCanvas');
      this.layersRoot = qs('layersRoot');
	  this.cropToolBtn = qs('cropToolBtn');
	  this.saveImageBtn = qs('saveImageBtn');
      this.repeat = qs('patternRepeat');
      this.repeatValue = qs('patternRepeatValue');
      this.palette = qs('palette');
	  this.thickness = qs('patternThickness');
	  this.thicknessValue = qs('patternThicknessValue');
      this.tileScaleToShape = qs('tileScaleToShape');

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
        { label: '18 Sinus (1 lijn)', file: '18-sinus.svg' },
        { label: '19 Spiraal (1 lijn)', file: '19-spiraal.svg' },
      ];

      this.currentFile = '';
    this.currentColor = '#000000';
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

      this.toolMode = 'draw';
      this.isCropping = false;
      this.cropPointerId = null;
      this.cropStartPos = null;
      this.cropPendingPos = null;
      this.cropRectPx = null;
      this.cropRectN = null;

      this.activeLayerIndex = -1;

      this.visibleColorsRenderToken = 0;

      this.draggingLayerViewIndex = -1;
      this.dragOverItem = null;
    }

    init() {
      if (!(this.select instanceof HTMLSelectElement)) return;
      if (!(this.preview instanceof HTMLElement)) return;

      if (this.select.dataset.bound === '1') return;
      this.select.dataset.bound = '1';

      this.populateOptions();

      this.initRepeatControl();
	  this.initPaletteControl();
    this.initThicknessControl();
      this.initTileScaleToggle();
      this.initImageActions();

      const initial = this.patterns[0]?.file;
      this.select.value = initial || '';
      this.applySelection(initial || '');

      this.select.addEventListener('change', () => {
        this.applySelection(this.select.value);
      });

      this.preview.addEventListener('click', () => {
        const hasActive = Array.isArray(this.activeClipPathN) && this.activeClipPathN.length >= 3;
        if (hasActive) {
          this.applyToActiveShape();
          return;
        }

        if (!this.currentFile) {
          this.applySolidToSelectedLayerOrCanvas();
          return;
        }

		this.canvasLayers.addLayer(this.currentFile, this.getRepeatCount(), this.currentColor, this.getThickness());
		this.setActiveLayerIndex(this.canvasLayers.layers.length - 1);
		this.renderLayersList();
      });

      this.initDrawShapeToMask();
	  this.initLayerReorderDragDrop();

      this.renderLayersList();

      window.addEventListener('resize', () => {
        this.resizeDrawOverlay();
        if (!this.canvasLayers.hasLayers()) return;
        this.canvasLayers.redrawAllLayers();
      });
    }

    initImageActions() {
      if (this.cropToolBtn && this.cropToolBtn.dataset.bound !== '1') {
        this.cropToolBtn.dataset.bound = '1';
        this.cropToolBtn.addEventListener('click', () => {
          this.toolMode = 'crop';
          // Start a new crop selection; the last crop is still shown until replaced.
          this.isCropping = false;
          this.cropPointerId = null;
          this.cropStartPos = null;
          this.cropPendingPos = null;
          this.cropRectPx = null;
          if (this.drawOverlay) this.drawOverlay.style.cursor = 'crosshair';
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
        const item = target?.closest?.('.layers__item');
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
        const item = target?.closest?.('.layers__item');
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
        const item = target?.closest?.('.layers__item');
        if (!(item instanceof HTMLElement)) return;

        evt.preventDefault();

        const fromV = this.draggingLayerViewIndex;
        const toVBase = Number(item.dataset.viewIndex);
        if (!Number.isFinite(toVBase) || toVBase < 0) return;

        const rect = item.getBoundingClientRect();
        const after = evt.clientY > rect.top + rect.height / 2;
        const toV = Math.trunc(toVBase) + (after ? 1 : 0);

        const layers = Array.isArray(this.canvasLayers?.layers) ? this.canvasLayers.layers : [];
        const activeRef = this.activeLayerIndex >= 0 ? layers[this.activeLayerIndex] : null;

        const changed = this.canvasLayers.reorderLayersByView(fromV, toV);
        if (changed) {
          const nextLayers = Array.isArray(this.canvasLayers?.layers) ? this.canvasLayers.layers : [];
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
        const item = target?.closest?.('.layers__item');
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

      let sx = 0;
      let sy = 0;
      let sWidth = sw;
      let sHeight = sh;

      const cr = this.cropRectN;
      if (cr && Number.isFinite(cr.x) && Number.isFinite(cr.y) && Number.isFinite(cr.w) && Number.isFinite(cr.h)) {
        sx = Math.max(0, Math.min(sw - 1, Math.round(cr.x * sw)));
        sy = Math.max(0, Math.min(sh - 1, Math.round(cr.y * sh)));
        sWidth = Math.max(1, Math.min(sw - sx, Math.round(cr.w * sw)));
        sHeight = Math.max(1, Math.min(sh - sy, Math.round(cr.h * sh)));
      }

      const out = document.createElement('canvas');
      out.width = sWidth;
      out.height = sHeight;
      const ctx = out.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(src, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);

      const url = out.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = 'patronen2026.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
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

      this.setActiveLayerIndex(idx);
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
      const layers = Array.isArray(this.canvasLayers?.layers) ? this.canvasLayers.layers : [];
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

    setActiveLayerIndex(nextIndex) {
      const n = this.canvasLayers?.layers?.length || 0;
      if (!Number.isFinite(nextIndex)) return;
      const idx = Math.max(0, Math.min(n - 1, Math.trunc(nextIndex)));
      this.activeLayerIndex = n > 0 ? idx : -1;
    }

    removeLayerIndex(layerIndex) {
      const idx = Number.isFinite(layerIndex) ? Math.trunc(layerIndex) : -1;
      const n = this.canvasLayers?.layers?.length || 0;
      if (idx < 0 || idx >= n) return;

      const removed = this.canvasLayers.removeLayerAt(idx);
      if (!removed) return;

      const nextN = this.canvasLayers?.layers?.length || 0;
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
      this.renderLayersList();
    }

    removeColorFromLayerIndex(layerIndex, color) {
      const idx = Number.isFinite(layerIndex) ? Math.trunc(layerIndex) : -1;
      const c = typeof color === 'string' && color.trim() ? color.trim() : '';
      if (idx < 0 || !c) return;

      const layers = Array.isArray(this.canvasLayers?.layers) ? this.canvasLayers.layers : [];
      const layer = layers[idx];
      if (!layer) return;

      const paints = Array.isArray(layer.paints) ? layer.paints : [];
      const nextPaints = paints.filter((p) => {
        const pc = typeof p?.color === 'string' && p.color.trim() ? p.color.trim() : '';
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
      const layers = Array.isArray(this.canvasLayers?.layers) ? this.canvasLayers.layers : [];

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

      const idx = this.canvasLayers.addSolidLayer(this.currentColor);
      this.setActiveLayerIndex(idx);
      this.renderLayersList();
    }

    renderLayersList() {
      if (!(this.layersRoot instanceof HTMLElement)) return;
      const layers = Array.isArray(this.canvasLayers?.layers) ? this.canvasLayers.layers : [];

      this.layersRoot.innerHTML = '';
      const groupName = 'activeLayer';

      // Newest layer first (top of list).
      for (let viewIndex = 0; viewIndex < layers.length; viewIndex++) {
        const i = layers.length - 1 - viewIndex; // model index
        const layer = layers[i] || {};

        const item = document.createElement('label');
        item.className = 'layers__item';
        item.draggable = true;
        item.dataset.viewIndex = String(viewIndex);

        const left = document.createElement('span');
        left.className = 'layers__left';

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = groupName;
        radio.value = String(i);
        radio.checked = i === this.activeLayerIndex;
        radio.draggable = false;
        radio.addEventListener('change', () => {
          this.activeLayerIndex = i;
          this.syncActiveShapeToLayerIndex(i);
          this.renderLayersList();
        });

        const num = document.createElement('span');
        num.className = 'layers__num';
        num.textContent = String(viewIndex + 1);

        left.appendChild(radio);
        left.appendChild(num);

        const swatches = document.createElement('span');
        swatches.className = 'layers__swatches';

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
            const c = typeof p?.color === 'string' && p.color.trim() ? p.color.trim() : '';
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
            this.removeColorFromLayerIndex(i, c);
          });
          swatches.appendChild(s);
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
      const canDrag = this.activeLayerIndex >= 0 && hasActiveClip;
      if (canDrag) {
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

            const layers = Array.isArray(this.canvasLayers?.layers) ? this.canvasLayers.layers : [];
            const layer = layers[this.dragLayerIndex];
            if (!layer) return;

            const nextKey = this.makeClipKey(nextClipN);
            layer.clipPathN = nextClipN;
            layer.clipKey = nextKey;

            this.activeClipPathN = nextClipN.slice();
            this.activeClipKey = nextKey;

            this.canvasLayers.redrawAllLayers();
            drawOverlayPath();
          });
        }

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
    const parentRect = this.canvas.parentElement?.getBoundingClientRect();
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
    };

    update();
    this.thickness.addEventListener('input', update);
  }

  initPaletteControl() {
    if (!(this.palette instanceof HTMLElement)) return;
    if (this.palette.dataset.bound === '1') return;
    this.palette.dataset.bound = '1';

    const colors = [
      '#e74c3c',
      '#e67e22',
      '#f1c40f',
      '#2ecc71',
      '#1abc9c',
      '#3498db',
      '#9b59b6',
      '#e056fd',
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
        this.setCurrentColor(c);
      });
      this.palette.appendChild(btn);
    }

    this.setCurrentColor(this.currentColor);
  }

  setCurrentColor(color) {
    this.currentColor = typeof color === 'string' && color.trim() ? color.trim() : '#000000';
    if (!(this.palette instanceof HTMLElement)) return;
    for (const el of Array.from(this.palette.children)) {
      if (!(el instanceof HTMLElement)) continue;
      const bg = el.style.backgroundColor;
      el.classList.toggle('is-active', bg === this.currentColor || this.normalizeCssColor(bg) === this.normalizeCssColor(this.currentColor));
    }

    if (!this.currentFile && this.preview instanceof HTMLElement) {
      this.preview.style.backgroundImage = 'none';
      this.preview.style.backgroundColor = this.currentColor;
      this.preview.setAttribute('aria-label', 'Patroon preview: geen');
    }
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

      if (!f) {
        this.preview.style.backgroundImage = 'none';
        this.preview.style.backgroundColor = this.currentColor;
        this.preview.setAttribute('aria-label', 'Patroon preview: geen');
        return;
      }

      const url = `./patronen/${f}`;
      this.preview.style.backgroundColor = '';
      this.preview.style.backgroundImage = `url(\"${url}\")`;
      this.preview.setAttribute('aria-label', `Patroon preview: ${f}`);
    }
  }

  NS.initLayout = function initLayout() {
    new MenuController().init();
    new PanelsController().init();
    new PatternPickerController().init();
  };
})();

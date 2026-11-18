// Scroll-scrubbed playback of the intro video, drawn frame by frame on a canvas.
//
// Why not <video>.currentTime: every seek goes through the browser's media pipeline and
// costs 45-60 ms whatever the encoding, so scrubbing tops out near 16-20 updates a second.
// Here each frame of the same footage is a WebP file, decoded off the main thread with
// createImageBitmap and kept in a small window around the playhead, so drawing a frame
// costs about a millisecond and the picture keeps up with the scroll in both directions.

const FETCH_CONCURRENCY = 6;
const DECODE_CONCURRENCY = 3;
const MIN_SWAP_MS = 30;

// Coarse-to-fine load order: a sparse pass first so the whole timeline is scrubbable early.
function loadOrder(count) {
  const order = [0, count - 1];
  const seen = new Set(order);
  for (const stride of [32, 16, 8, 4, 2, 1]) {
    for (let i = 0; i < count; i += stride) {
      if (!seen.has(i)) {
        seen.add(i);
        order.push(i);
      }
    }
  }
  return order;
}

export class FramePlayer {
  constructor(canvas, manifest, setName, { onProgress, onScrubbable, onDraw } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    this.count = manifest.count;
    this.fps = manifest.fps;
    this.set = manifest.sets[setName];
    this.setName = setName;
    this.blobs = new Array(this.count);
    this.bitmaps = new Map();
    this.decoding = new Set();
    this.loaded = 0;
    this.center = 0;
    this.dir = 1;
    this.dirty = true;
    this.destroyed = false;
    this.abort = new AbortController();
    this.onProgress = onProgress || (() => {});
    this.onScrubbable = onScrubbable || (() => {});
    this.onDraw = onDraw || (() => {});
    this.scrubbableAt = Math.ceil(this.count / 8) + 2; // after the stride-8 pass
    const small = Math.min(screen.width, screen.height) < 900;
    this.keepBack = small ? 8 : 10;
    this.keepAhead = small ? 14 : 22;
    this.last = { f: -1, key: '' };
    this.lastA = -1;
    this.lastSwap = 0;
    this.load();
  }

  async load() {
    const order = loadOrder(this.count);
    let next = 0;
    const worker = async () => {
      while (!this.destroyed && next < order.length) {
        const i = order[next++];
        try {
          const res = await fetch(`${this.set.path}${String(i).padStart(4, '0')}.webp`, { signal: this.abort.signal });
          this.blobs[i] = await res.blob();
        } catch {
          if (this.destroyed) return;
          continue;
        }
        this.loaded += 1;
        this.onProgress(this.loaded / this.count);
        if (this.loaded === this.scrubbableAt) this.onScrubbable();
        this.pump();
      }
    };
    await Promise.all(Array.from({ length: FETCH_CONCURRENCY }, worker));
  }

  // Decode the frames nearest the playhead first, leaning toward the scroll direction.
  pump() {
    if (this.destroyed) return;
    const lo = Math.max(0, this.center - (this.dir > 0 ? this.keepBack : this.keepAhead));
    const hi = Math.min(this.count - 1, this.center + (this.dir > 0 ? this.keepAhead : this.keepBack));
    while (this.decoding.size < DECODE_CONCURRENCY) {
      let pick = -1;
      let best = Infinity;
      for (let i = lo; i <= hi; i += 1) {
        if (!this.blobs[i] || this.bitmaps.has(i) || this.decoding.has(i)) continue;
        const d = i - this.center;
        const cost = d * this.dir >= 0 ? Math.abs(d) : Math.abs(d) * 1.6;
        if (cost < best) {
          best = cost;
          pick = i;
        }
      }
      if (pick < 0) {
        // Keep the first and last frames ready for the poster and the background.
        for (const i of [0, this.count - 1]) {
          if (this.blobs[i] && !this.bitmaps.has(i) && !this.decoding.has(i)) pick = i;
        }
      }
      if (pick < 0) break;
      this.decoding.add(pick);
      createImageBitmap(this.blobs[pick])
        .then((bm) => {
          this.decoding.delete(pick);
          if (this.destroyed) return bm.close();
          this.bitmaps.set(pick, bm);
          this.dirty = true;
          this.evict();
          this.pump();
          return undefined;
        })
        .catch(() => this.decoding.delete(pick));
    }
  }

  evict() {
    const lo = this.center - this.keepAhead - 4;
    const hi = this.center + this.keepAhead + 4;
    for (const [i, bm] of this.bitmaps) {
      if ((i < lo || i > hi) && i !== 0 && i !== this.count - 1) {
        bm.close();
        this.bitmaps.delete(i);
      }
    }
  }

  nearest(i) {
    if (this.bitmaps.has(i)) return i;
    for (let d = 1; d < this.count; d += 1) {
      const a = i - d * this.dir;
      const b = i + d * this.dir;
      if (a >= 0 && a < this.count && this.bitmaps.has(a)) return a;
      if (b >= 0 && b < this.count && this.bitmaps.has(b)) return b;
    }
    return -1;
  }

  resize(vw, vh) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(vw * dpr);
    this.canvas.height = Math.round(vh * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.imageSmoothingQuality = 'high';
    this.dirty = true;
  }

  // f: fractional frame index. view: where the full 16:9 frame sits on screen, in CSS px.
  draw(f, view) {
    const fi = Math.max(0, Math.min(this.count - 1, f));
    const i = Math.floor(fi);
    const center = Math.round(fi);
    if (center !== this.center) {
      this.dir = center > this.center ? 1 : -1;
      this.center = center;
      this.pump();
    }
    const key = `${view.x.toFixed(1)},${view.y.toFixed(1)},${view.w.toFixed(1)}`;
    if (!this.dirty && fi === this.last.f && key === this.last.key) return;
    const a = this.nearest(i);
    if (a < 0) return;
    // Each new frame is a full-size texture upload, which is what costs time on the GPU.
    // The footage is 24 fps, so during a fast scrub, swapping the picture more than
    // ~30 times a second only burns frame budget. Hold the current frame for a moment instead.
    const now = performance.now();
    const speed = Math.abs(fi - this.last.f); // video frames per display frame
    if (a !== this.lastA && this.lastA >= 0 && now - this.lastSwap < MIN_SWAP_MS && key === this.last.key) {
      this.dirty = true;
      return;
    }
    if (a !== this.lastA) {
      this.lastA = a;
      this.lastSwap = now;
    }
    const [x0, y0, x1, y1] = this.set.crop;
    const dx = view.x + x0 * view.w;
    const dy = view.y + y0 * view.h;
    const dw = (x1 - x0) * view.w;
    const dh = (y1 - y0) * view.h;
    const ctx = this.ctx;
    ctx.globalAlpha = 1;
    ctx.drawImage(this.bitmaps.get(a), dx, dy, dw, dh);
    // Cross-fade into the next frame for positions between two frames. Only when moving
    // slowly: at speed it is invisible and costs a second texture upload.
    const frac = fi - i;
    if (a === i && speed < 0.6 && frac > 0.02 && this.bitmaps.has(i + 1)) {
      ctx.globalAlpha = frac;
      ctx.drawImage(this.bitmaps.get(i + 1), dx, dy, dw, dh);
      ctx.globalAlpha = 1;
    }
    this.dirty = a !== i; // keep trying until the exact frame is decoded
    this.last = { f: fi, key };
    this.onDraw(a);
  }

  destroy() {
    this.destroyed = true;
    this.abort.abort();
    for (const bm of this.bitmaps.values()) bm.close();
    this.bitmaps.clear();
    this.blobs = [];
  }
}

// Scroll-scrubbed playback of the intro video, drawn frame by frame on a canvas.
//
// Why not <video>.currentTime: every seek goes through the browser's media pipeline and
// costs 45-60 ms whatever the encoding, so scrubbing tops out near 16-20 updates a second.
// Here each frame of the same footage is a WebP file, decoded off the main thread with
// createImageBitmap and kept in a small window around the playhead, so drawing a frame
// costs about a millisecond and the picture keeps up with the scroll in both directions.

const FETCH_CONCURRENCY = 6;
const MIN_SWAP_MS = 30;
// When the exact frame isn't decoded yet, show a decoded frame that lies on the way from the
// picture already on screen to the target, or one at most this many frames from the target.
// Never a far-off frame (like the poster at frame 0 or the smoke at the end): that flashes.
const MAX_GAP = 8;
// Fast scrolls: decode where the playhead will be, not where it is. How far ahead we plan
// (in time), and the most frames we look ahead.
const LOOKAHEAD_MS = 320;
const MAX_AHEAD = 120;

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
    // Low-latency ('desynchronized') canvas on mouse-driven computers, where it keeps the picture
    // locked to the scroll; a normal compositor-synced canvas on touch devices, where that mode
    // can tear and flicker on phone GPUs.
    const desktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches && navigator.maxTouchPoints === 0;
    this.ctx = canvas.getContext('2d', { alpha: false, desynchronized: desktop });
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
    // Most decoded frames held at once (memory cap; spaced out along the path when scrolling fast).
    this.maxDecoded = small ? 30 : 48;
    this.decodeConcurrency = (navigator.hardwareConcurrency || 4) >= 8 && !small ? 4 : 3;
    // Scroll speed in frames per millisecond (signed), and how long a decode takes (measured).
    this.vel = 0;
    this.velF = 0;
    this.velT = 0;
    this.decodeMs = 30;
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

  // Current scroll speed and the plan it implies: how far ahead decodes should land, how far
  // apart the frames worth decoding are, and how far ahead to look.
  plan() {
    const v = performance.now() - this.velT < 120 ? this.vel : 0;
    const speed = Math.abs(v); // frames per ms
    const dir = v > 0.0005 ? 1 : v < -0.0005 ? -1 : this.dir;
    // Between two picture changes (MIN_SWAP_MS) the playhead moves speed * MIN_SWAP_MS frames,
    // so at speed only every stride-th frame can ever be shown: decode just those.
    const stride = Math.max(1, Math.round(speed * MIN_SWAP_MS));
    // A decode started now finishes this many frames further on.
    const lead = Math.round(speed * (this.decodeMs + 16));
    const ahead = Math.min(MAX_AHEAD, this.keepAhead + Math.round(speed * LOOKAHEAD_MS));
    return { dir, stride, lead, ahead };
  }

  // Frames worth decoding next, best first.
  wanted() {
    const { dir, stride, lead, ahead } = this.plan();
    const out = [];
    const ok = (i) => i >= 0 && i < this.count && this.blobs[i] && !this.bitmaps.has(i) && !this.decoding.has(i);
    if (stride === 1) {
      // Slow: every frame around the playhead, nearest first, leaning toward the scroll direction.
      const lo = Math.max(0, this.center - (dir > 0 ? this.keepBack : ahead));
      const hi = Math.min(this.count - 1, this.center + (dir > 0 ? ahead : this.keepBack));
      const list = [];
      for (let i = lo; i <= hi; i += 1) {
        if (!ok(i)) continue;
        const d = i - this.center;
        list.push([d * dir >= 0 ? Math.abs(d) : Math.abs(d) * 1.6, i]);
      }
      list.sort((a, b) => a[0] - b[0]);
      for (const [, i] of list) out.push(i);
    } else {
      // Fast: frames spaced stride apart along the path, starting where the playhead will be
      // when the decode is done.
      for (let k = 0; ; k += 1) {
        const i = this.center + dir * (lead + k * stride);
        if (i < 0 || i >= this.count || Math.abs(i - this.center) > ahead) break;
        if (ok(i)) out.push(i);
      }
    }
    return out;
  }

  // Decode the frames the plan wants, a few at a time, off the main thread.
  pump() {
    if (this.destroyed) return;
    const queue = this.wanted();
    while (this.decoding.size < this.decodeConcurrency) {
      let pick = queue.length ? queue.shift() : -1;
      if (pick < 0) {
        // Keep the first and last frames ready for the poster and the background.
        for (const i of [0, this.count - 1]) {
          if (this.blobs[i] && !this.bitmaps.has(i) && !this.decoding.has(i)) pick = i;
        }
      }
      if (pick < 0) break;
      this.decoding.add(pick);
      const started = performance.now();
      createImageBitmap(this.blobs[pick])
        .then((bm) => {
          this.decoding.delete(pick);
          this.decodeMs = this.decodeMs * 0.8 + (performance.now() - started) * 0.2;
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
    const { dir, ahead } = this.plan();
    const lo = this.center - (dir > 0 ? this.keepBack : ahead) - 4;
    const hi = this.center + (dir > 0 ? ahead : this.keepBack) + 4;
    const keep = (i) => i === 0 || i === this.count - 1 || i === this.lastA;
    for (const [i, bm] of this.bitmaps) {
      if ((i < lo || i > hi) && !keep(i)) {
        bm.close();
        this.bitmaps.delete(i);
      }
    }
    // Memory cap: drop the frames furthest from the playhead first.
    if (this.bitmaps.size > this.maxDecoded) {
      const far = [...this.bitmaps.keys()]
        .filter((i) => !keep(i))
        .sort((a, b) => Math.abs(b - this.center) - Math.abs(a - this.center));
      for (const i of far.slice(0, this.bitmaps.size - this.maxDecoded)) {
        this.bitmaps.get(i).close();
        this.bitmaps.delete(i);
      }
    }
  }

  // The decoded frame to show for target i: the closest one that is either on the way from the
  // picture already on screen to the target (so the picture only moves along with the scroll),
  // or within MAX_GAP of the target. A far-off frame is never shown: that flashes.
  nearest(i) {
    if (this.bitmaps.has(i)) return i;
    const from = this.lastA >= 0 ? this.lastA : i;
    const lo = Math.min(from, i);
    const hi = Math.max(from, i);
    let best = -1;
    let bestD = Infinity;
    for (const x of this.bitmaps.keys()) {
      const d = Math.abs(x - i);
      if (!(d <= MAX_GAP || (x >= lo && x <= hi))) continue;
      if (d < bestD) {
        bestD = d;
        best = x;
      }
    }
    return best;
  }

  resize(vw, vh) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(vw * dpr);
    const h = Math.round(vh * dpr);
    // Setting a canvas's size wipes it. Phones fire resize events all the time while scrolling
    // (the address bar sliding in and out), so only resize on a real change...
    if (w === this.canvas.width && h === this.canvas.height) return;
    this.canvas.width = w;
    this.canvas.height = h;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.imageSmoothingQuality = 'high';
    this.dirty = true;
    // ...and repaint the current frame straight away, so no blank frame is ever shown.
    if (this.lastView && this.last.f >= 0) {
      const f = this.last.f;
      this.last = { f: -1, key: '' };
      this.lastSwap = 0;
      this.draw(f, this.lastView);
    }
  }

  // f: fractional frame index. view: where the full 16:9 frame sits on screen, in CSS px.
  draw(f, view) {
    const fi = Math.max(0, Math.min(this.count - 1, f));
    const i = Math.floor(fi);
    const center = Math.round(fi);
    // Track scroll speed (frames per ms), smoothed, to plan decodes ahead of fast scrolls.
    const tNow = performance.now();
    const dt = tNow - this.velT;
    if (dt > 0 && dt < 200) this.vel = this.vel * 0.6 + ((fi - this.velF) / dt) * 0.4;
    else this.vel = 0;
    this.velF = fi;
    this.velT = tNow;
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
    this.lastView = view;
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

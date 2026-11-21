import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { T, SRC, NAME_LINES, ROLE, focusAt, ramp, ease, easeOut, clamp01 } from './timeline.js';
import { FramePlayer } from './FramePlayer.js';
import { isSmoothScroll } from '../smoothScroll.js';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

const SPARKS = Array.from({ length: 12 }, (_, i) => ({
  angle: (i / 12) * Math.PI * 2 + (i % 2 ? 0.18 : -0.12),
  reach: 0.55 + ((i * 37) % 10) / 22,
  size: 2 + (i % 3),
}));

// Write a style only when its value changed: most frames touch nothing.
const put = (el, prop, value) => {
  if (!el) return;
  const c = el.__s || (el.__s = {});
  if (c[prop] === value) return;
  c[prop] = value;
  el.style[prop] = value;
};

// Share of the 16:9 frame's width a viewport shows when the frame covers it.
const visibleShare = (vw, vh) => Math.min(1, vw / vh / (SRC.w / SRC.h));

// The phone set is a crop of the band a portrait screen ever pans across (x 12%-76%).
function chooseSet(manifest, vw, vh) {
  const m = manifest.sets.m;
  const share = visibleShare(vw, vh);
  return m && share <= (m.crop[2] - m.crop[0]) - 0.04 && Math.min(screen.width, screen.height) < 900 ? 'm' : 'd';
}

export default function Intro({ reducedMotion, onDoneChange }) {
  const spacer = useRef(null);
  const stage = useRef(null);
  const canvas = useRef(null);
  const nameBlock = useRef(null);
  const chars = useRef([]);
  const roleBlock = useRef(null);
  const roleText = useRef(null);
  const scan = useRef(null);
  const hint = useRef(null);
  const fx = useRef({ sparks: [] });
  const [loadPct, setLoadPct] = useState(0);
  const [ready, setReady] = useState(false);
  const [painted, setPainted] = useState(false);

  useEffect(() => {
    if (reducedMotion) return undefined;
    const st = stage.current;
    let manifest = null;
    let player = null;
    let duration = T.duration;
    let target = 0;
    let smooth = 0;
    let doneState = null;
    let cancelled = false;
    let last = performance.now();
    let size = { vw: 0, vh: 0, s: 1, w: 0, h: 0 };
    let lastT = -1;
    let crop = [0, 0, 1, 1];
    let roleW = 0;

    const makePlayer = () => {
      const setName = chooseSet(manifest, size.vw, size.vh);
      if (player && player.setName === setName) return;
      player?.destroy();
      crop = manifest.sets[setName].crop;
      let firstDraw = true;
      player = new FramePlayer(canvas.current, manifest, setName, {
        onProgress: (p) => !cancelled && setLoadPct(Math.round(p * 100)),
        onScrubbable: () => !cancelled && setReady(true),
        onDraw: () => {
          if (firstDraw && !cancelled) {
            firstDraw = false;
            setPainted(true);
          }
        },
      });
      player.resize(size.vw, size.vh);
      lastT = -1;
      // Development only (stripped from production builds): lets a test read what the player shows.
      if (import.meta.env.DEV) window.__introPlayer = player;
    };

    const measure = () => {
      const vw = st.clientWidth;
      const vh = st.clientHeight;
      const s = Math.max(vw / SRC.w, vh / SRC.h);
      size = { vw, vh, s, w: SRC.w * s, h: SRC.h * s };
      st.style.setProperty('--vs', s.toFixed(4));
      roleW = roleText.current.offsetWidth;
      if (manifest) makePlayer();
      player?.resize(vw, vh);
      lastT = -1;
    };

    const toStage = (x, y, tx, ty) => [tx + x * size.w, ty + y * size.h];

    const render = (t) => {
      const { vw, vh, w, h } = size;
      // Pan: ~0 on wide screens; on portrait screens it follows the action, inside the frame set's crop.
      let tx = vw / 2 - focusAt(t) * w;
      tx = Math.min(-crop[0] * w, Math.max(vw - crop[2] * w, tx));
      const ty = (vh - h) / 2;
      player?.draw(t * (manifest?.fps || 24), { x: tx, y: ty, w, h });

      const nIn = ramp(t, T.nameIn[0], T.nameIn[1]);
      const nOut = ease(ramp(t, T.nameOut[0], T.nameOut[1]));
      const n = chars.current.length;
      chars.current.forEach((el, i) => {
        const k = easeOut(clamp01((nIn - (i / Math.max(1, n - 1)) * 0.55) / 0.45));
        put(el, 'opacity', k.toFixed(3));
        put(el, 'transform', `translate3d(0, ${((1 - k) * 0.35).toFixed(3)}em, 0)`);
      });
      const nb = nameBlock.current;
      put(nb, 'visibility', nIn > 0 && nOut < 1 ? 'visible' : 'hidden');
      put(nb, 'opacity', (1 - nOut).toFixed(3));
      put(nb, 'transform', `translate3d(0, ${(-nOut * 28).toFixed(1)}px, 0)`);

      const rIn = ease(ramp(t, T.roleIn[0], T.roleIn[1]));
      const rOut = ease(ramp(t, T.roleOut[0], T.roleOut[1]));
      const rb = roleBlock.current;
      put(rb, 'visibility', rIn > 0 && rOut < 1 ? 'visible' : 'hidden');
      put(rb, 'opacity', (1 - rOut).toFixed(3));
      put(rb, 'transform', `translate3d(0, ${(-rOut * 28).toFixed(1)}px, 0)`);
      put(roleText.current, 'clipPath', `inset(-20% ${((1 - rIn) * 100).toFixed(2)}% -20% 0)`);
      put(roleText.current, 'transform', `translate3d(${((1 - rIn) * -18).toFixed(1)}px, 0, 0)`);
      put(scan.current, 'transform', `translate3d(${(rIn * roleW).toFixed(1)}px, 0, 0)`);
      put(scan.current, 'opacity', Math.sin(rIn * Math.PI).toFixed(3));

      // Touch: a function of the frame on screen, so it also plays backwards.
      const { start, peak, end, x, y } = T.touch;
      const f = fx.current;
      const live = t > start - 0.05 && t < end + 0.3;
      put(f.root, 'visibility', live ? 'visible' : 'hidden');
      put(f.holo, 'visibility', live ? 'visible' : 'hidden');
      if (live) {
        const [px, py] = toStage(x, y, tx, ty);
        const g = t < start || t > end ? 0 : t < peak ? ease(ramp(t, start, peak)) : 1 - ease(ramp(t, peak, end));
        put(f.root, 'transform', `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0)`);
        put(f.glow, 'opacity', (g * 0.95).toFixed(3));
        put(f.glow, 'transform', `translate(-50%, -50%) scale(${(0.6 + 0.4 * g).toFixed(3)})`);
        [[f.ring1, T.ring1], [f.ring2, T.ring2]].forEach(([el, [a, b]]) => {
          const k = ramp(t, a, b);
          put(el, 'opacity', k > 0 && k < 1 ? ((1 - k) * 0.9).toFixed(3) : '0');
          put(el, 'transform', `translate(-50%, -50%) scale(${(0.18 + easeOut(k) * 2.1).toFixed(3)})`);
        });
        const sk = ramp(t, T.sparks[0], T.sparks[1]);
        f.sparks.forEach((el, i) => {
          const sp = SPARKS[i];
          const d = easeOut(sk) * sp.reach * 230 * size.s;
          put(el, 'opacity', sk > 0 && sk < 1 ? (Math.sin(sk * Math.PI) * 0.85).toFixed(3) : '0');
          put(el, 'transform', `translate(${(Math.cos(sp.angle) * d).toFixed(1)}px, ${(Math.sin(sp.angle) * d).toFixed(1)}px)`);
        });
        const [hx, hy] = toStage(T.holo.x, T.holo.y, tx, ty);
        put(f.holo, 'opacity', (g * 0.5).toFixed(3));
        put(f.holo, 'transform', `translate3d(${hx.toFixed(1)}px, ${hy.toFixed(1)}px, 0) translate(-50%, -50%)`);
      }
      put(hint.current, 'opacity', (1 - ramp(t, 0.05, 0.6)).toFixed(3));
    };

    const tick = () => {
      const now = performance.now();
      const dt = Math.min(64, now - last);
      last = now;
      // Lenis already eases the scroll, so only a light extra glide is needed on top of it.
      const rate = isSmoothScroll() ? 30 : 12;
      smooth += (target - smooth) * (1 - Math.exp((-dt * rate) / 1000));
      if (Math.abs(target - smooth) < 0.001) smooth = target;
      // Redraw while moving, or while the player still owes a sharper frame.
      if (smooth !== lastT || player?.dirty) {
        render(smooth);
        lastT = smooth;
      }
    };

    const trigger = ScrollTrigger.create({
      trigger: spacer.current,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        target = self.progress * duration;
        const done = self.progress > 0.985;
        if (done !== doneState) {
          doneState = done;
          onDoneChange(done);
        }
      },
      onRefresh: (self) => {
        target = self.progress * duration;
      },
    });

    measure();
    smooth = target;
    render(target);
    window.addEventListener('resize', measure);
    document.fonts?.ready.then(() => !cancelled && measure());
    gsap.ticker.add(tick);

    fetch('/frames/manifest.json')
      .then((r) => r.json())
      .then((m) => {
        if (cancelled) return;
        manifest = m;
        duration = (m.count - 1) / m.fps;
        makePlayer();
        trigger.refresh();
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      gsap.ticker.remove(tick);
      trigger.kill();
      window.removeEventListener('resize', measure);
      player?.destroy();
    };
  }, [reducedMotion, onDoneChange]);

  // Reduced motion: one still frame with both lines, no scrubbing.
  useEffect(() => {
    if (!reducedMotion) return undefined;
    onDoneChange(false);
    const trig = ScrollTrigger.create({
      trigger: spacer.current,
      start: 'top top',
      end: 'bottom top',
      onLeave: () => {
        stage.current.classList.add('is-past');
        onDoneChange(true);
      },
      onEnterBack: () => {
        stage.current.classList.remove('is-past');
        onDoneChange(false);
      },
    });
    return () => trig.kill();
  }, [reducedMotion, onDoneChange]);

  let ci = 0;
  return (
    <>
      <div className="stage" ref={stage} data-painted={painted || undefined} aria-hidden="true">
        <img className="stage__final" src="/video/final.jpg" alt="" />
        <img className="stage__still" src="/video/poster.jpg" alt="" />
        {!reducedMotion && <canvas ref={canvas} className="stage__canvas" />}
        <div className="stage__shade" />

        <div className="fx" ref={(el) => (fx.current.root = el)}>
          <span className="fx__glow" ref={(el) => (fx.current.glow = el)} />
          <span className="fx__ring" ref={(el) => (fx.current.ring1 = el)} />
          <span className="fx__ring fx__ring--thin" ref={(el) => (fx.current.ring2 = el)} />
          {SPARKS.map((sp, i) => (
            <span
              key={i}
              className="fx__spark"
              style={{ width: sp.size, height: sp.size }}
              ref={(el) => (fx.current.sparks[i] = el)}
            />
          ))}
        </div>
        <span className="fx__holo" ref={(el) => (fx.current.holo = el)} />

        <div className="ident">
          <div className="ident__name" ref={nameBlock}>
            {NAME_LINES.map((line) => (
              <span className="ident__line" key={line}>
                {[...line].map((ch) => {
                  const idx = ci++;
                  return (
                    <span className="ident__char" key={idx} ref={(el) => (chars.current[idx] = el)}>
                      {ch}
                    </span>
                  );
                })}
              </span>
            ))}
          </div>
          <div className="ident__role" ref={roleBlock}>
            <span className="ident__role-text" ref={roleText}>
              {ROLE}
            </span>
            <span className="ident__scan" ref={scan} />
          </div>
        </div>

        <div className="hint" ref={hint}>
          {ready || reducedMotion ? (
            <>
              <span className="hint__line" />
              <span>Scroll</span>
            </>
          ) : (
            <span>Loading intro {loadPct}%</span>
          )}
        </div>
      </div>

      {/* Copy for screen readers and search; the stage above is decorative. */}
      <header className="intro-spacer" ref={spacer} id="top">
        <h1 className="sr-only">
          {NAME_LINES.join(' ')}, {ROLE}
        </h1>
      </header>
    </>
  );
}

import { useEffect, useRef } from 'react';

// Slow green motes over the smoke frame, only once the intro is over.
// Cheap by design: one pre-rendered glow sprite stamped with drawImage (no per-dot shadowBlur),
// 30 fps (the motes drift a few pixels a second), paused while hidden or during the intro,
// and drawn once and left still under reduced motion.
function makeSprite() {
  const s = document.createElement('canvas');
  s.width = s.height = 32;
  const g = s.getContext('2d');
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, 'rgba(210, 255, 236, 1)');
  grad.addColorStop(0.18, 'rgba(57, 230, 160, 0.9)');
  grad.addColorStop(0.5, 'rgba(57, 230, 160, 0.18)');
  grad.addColorStop(1, 'rgba(57, 230, 160, 0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 32, 32);
  return s;
}

export default function Ambient({ reducedMotion, active }) {
  const canvas = useRef(null);

  useEffect(() => {
    const c = canvas.current;
    const ctx = c.getContext('2d');
    const sprite = makeSprite();
    let w = 0;
    let h = 0;
    let raf = 0;
    let motes = [];
    let prev = 0;

    const seed = () => {
      const count = w < 700 ? 20 : 36;
      motes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        size: 5 + Math.random() * 7,
        vy: -(4 + Math.random() * 10),
        vx: (Math.random() - 0.5) * 4,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 0.8,
      }));
    };

    const resize = () => {
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      w = window.innerWidth;
      h = window.innerHeight;
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const draw = (time, dt) => {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (const m of motes) {
        m.x += (m.vx * dt) / 1000;
        m.y += (m.vy * dt) / 1000;
        if (m.y < -12) {
          m.y = h + 12;
          m.x = Math.random() * w;
        }
        ctx.globalAlpha = 0.25 + 0.4 * (0.5 + 0.5 * Math.sin((time / 1000) * m.speed + m.phase));
        ctx.drawImage(sprite, m.x - m.size / 2, m.y - m.size / 2, m.size, m.size);
      }
      ctx.globalAlpha = 1;
    };

    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      if (now - prev < 32) return; // ~30 fps
      draw(now, Math.min(100, now - prev));
      prev = now;
    };
    const start = () => {
      cancelAnimationFrame(raf);
      if (active && !reducedMotion && !document.hidden) {
        prev = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };

    resize();
    draw(0, 0);
    start();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', start);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', start);
    };
  }, [reducedMotion, active]);

  return (
    <div className="ambient" aria-hidden="true">
      <div className="ambient__scrim" />
      <div className="ambient__haze" />
      <canvas className="ambient__motes" ref={canvas} />
    </div>
  );
}

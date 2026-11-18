import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// A sheet of big type bent over two folds.
// The same sheet is drawn three times (top fold, flat middle, bottom fold), each copy offset
// by one fold height, so together they read as one surface. Scrolling slides the sheet up
// through the folds and runs each row sideways, alternating direction row by row.
// Only transforms change while scrolling; nothing is laid out again.
//
// rows: [{ label, items: [string], lower?: boolean }]

const FOLDS = ['top', 'mid', 'bottom'];
const REPEAT = 4; // copies of each row's items, so the track is always wider than the screen

function Sheet({ rows }) {
  return (
    <div className="fold__sheet">
      {rows.map((row, r) => (
        <div className={`fold-row ${row.lower ? 'is-lower' : ''}`} key={r}>
          <div className="fold-row__track" data-row={r}>
            {Array.from({ length: REPEAT }, (_, k) => (
              <span className="fold-row__set" key={k}>
                {row.label && <span className="fold-row__label">{row.label}</span>}
                {row.items.map((item, i) => (
                  <span className={`fold-row__item ${(i + r + k) % 2 ? 'is-outline' : ''}`} key={i}>
                    {item}
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FoldMarquee({ rows, href, className = '' }) {
  const stage = useRef(null);

  useLayoutEffect(() => {
    const root = stage.current;
    const ctx = gsap.context(() => {
      const sheets = gsap.utils.toArray('.fold__sheet', root);
      const mid = root.querySelector('.fold--mid');
      const st = { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true, refreshPriority: 1 };
      const fold = () => mid.clientHeight;
      const travel = () => Math.max(0, sheets[0].scrollHeight - fold() * 1.6);
      sheets.forEach((sheet, k) => {
        // k = 0 top, 1 middle, 2 bottom: each copy shows the band one fold above or below.
        const shift = () => (1 - k) * fold();
        gsap.fromTo(
          sheet,
          { y: () => shift() + fold() * 0.6 },
          { y: () => shift() - travel(), ease: 'none', scrollTrigger: st },
        );
      });
      rows.forEach((_, r) => {
        const tracks = root.querySelectorAll(`.fold-row__track[data-row="${r}"]`);
        const [from, to] = r % 2 ? [-30, -8] : [-8, -30];
        gsap.fromTo(tracks, { xPercent: from }, { xPercent: to, ease: 'none', scrollTrigger: st });
      });
    }, root);
    return () => ctx.revert();
  }, [rows]);

  const folds = FOLDS.map((f) => (
    <div className={`fold fold--${f}`} key={f}>
      <Sheet rows={rows} />
    </div>
  ));

  // Decorative: the same words are in the page as real text and links nearby.
  return href ? (
    <a className={`folds ${className}`} ref={stage} href={href} aria-hidden="true" tabIndex={-1}>
      {folds}
    </a>
  ) : (
    <div className={`folds ${className}`} ref={stage} aria-hidden="true">
      {folds}
    </div>
  );
}

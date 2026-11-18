import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { strengths } from './content.js';

gsap.registerPlugin(ScrollTrigger);

// "I can ..." : the words "I can" hold still in the middle of the screen while a list of
// endings scrolls past beside them. The line level with "I can" lights up; the rest stay dim,
// so the sentence reads one line at a time. Each line's green steps a little brighter down
// the list, and a soft glow behind the heading rises while the list is in view.
// Plain sticky positioning plus scrubbed opacity; under reduced motion every line stays lit.

const DIM = 0.18;

export default function Strengths({ reducedMotion }) {
  const root = useRef(null);

  useLayoutEffect(() => {
    if (reducedMotion) return undefined;
    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray('.can__item', root.current);
      gsap.set(items, { opacity: DIM });
      // "I can" sticks with its line box centred on the screen; a line is "level" with it when
      // the line's top sits there too (on a phone a long line wraps, and its first line counts).
      const level = () => {
        const fs = parseFloat(getComputedStyle(items[0]).fontSize);
        return window.innerHeight / 2 - fs * 0.56;
      };
      const band = () => window.innerHeight * 0.1;
      items.forEach((li, i) => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: li,
            start: () => `top ${level() + band()}px`,
            end: () => `top ${level() - band()}px`,
            scrub: 0.2,
            invalidateOnRefresh: true,
          },
        });
        // Brighten as the line reaches the middle of the screen, dim again as it leaves...
        tl.to(li, { opacity: 1, ease: 'none', duration: 1 });
        // ...except the last line, which stays lit and hands over to Contact.
        if (i < items.length - 1) tl.to(li, { opacity: DIM, ease: 'none', duration: 1 });
      });

      gsap.fromTo(
        '.can__glow',
        { opacity: 0 },
        {
          opacity: 1,
          ease: 'none',
          scrollTrigger: { trigger: '.can__list', start: 'top 70%', end: 'top 40%', scrub: true },
        },
      );
    }, root);
    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section className="section can" id="strengths" aria-labelledby="can-h" ref={root}>
      <div className="wrap">
        <p className="eyebrow">What I bring</p>
        <div className="can__stage">
          <div className="can__sticky">
            <span className="can__glow" aria-hidden="true" />
            <h2 className="can__h" id="can-h">
              I can
            </h2>
          </div>
          <ul className="can__list" style={{ '--n': strengths.length }}>
            {strengths.map((s, i) => (
              <li className="can__item" key={s} style={{ '--i': i }}>
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

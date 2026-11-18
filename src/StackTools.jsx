import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionConfig } from 'motion/react';
import { stack } from './content.js';
import { HoverEffect } from '@/components/ui/card-hover-effect';

gsap.registerPlugin(ScrollTrigger);

// "Tools I build with": six category cards over a faint grid.
// - heading words blur into focus once (the BlurText idea, done with GSAP)
// - cards rise in one after another the first time they reach the screen
// - a green beam on the left fills as you scroll through the section
// - the cards are Aceternity's Card Hover Effect: one highlight glides to whichever card is
//   under the pointer (Motion's shared layout animation)
// Under reduced motion the reveal, beam dot and particles rest, and Motion skips the glide.

// One card per category: its name, then its tools.
const ITEMS = stack.map((g) => ({ title: g.group, description: g.items.join(' · ') }));

const TITLE = 'Tools I build with';

// Fourteen faint particles, placed by a fixed formula so every visit looks the same.
const DOTS = Array.from({ length: 14 }, (_, k) => ({
  left: `${(k * 37 + 11) % 100}%`,
  top: `${(k * 53 + 17) % 100}%`,
  '--size': `${2 + (k % 3)}px`,
  '--dur': `${10 + ((k * 7) % 8)}s`,
  '--delay': `${-((k * 13) % 10)}s`,
}));

export default function StackTools({ reducedMotion }) {
  const section = useRef(null);
  const [inView, setInView] = useState(false);

  // Pause the drifting particles while the section is off screen.
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: '100px' });
    io.observe(section.current);
    return () => io.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (reducedMotion) return undefined;
    const root = section.current;
    const ctx = gsap.context(() => {
      // Heading: each word comes into focus, once.
      gsap.from('.tools-title__word', {
        opacity: 0,
        filter: 'blur(12px)',
        y: 14,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.09,
        clearProps: 'filter',
        scrollTrigger: { trigger: '.tools-title', start: 'top 85%', once: true },
      });

      // Cards: rise in one after another the first time they reach the screen.
      const cards = gsap.utils.toArray('.tools-hover > *', root);
      gsap.set(cards, { opacity: 0, y: 28 });
      ScrollTrigger.batch(cards, {
        start: 'top 88%',
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.09, clearProps: 'transform,opacity' }),
      });

      // Tracing beam: fills from the heading down to the last card as you scroll.
      gsap.fromTo(
        '.tools-beam__fill',
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: { trigger: '.tools-body', start: 'top 70%', end: 'bottom 60%', scrub: true },
        },
      );
      const beam = root.querySelector('.tools-beam');
      gsap.fromTo(
        '.tools-beam__head',
        { y: 0 },
        {
          y: () => beam.offsetHeight,
          ease: 'none',
          scrollTrigger: {
            trigger: '.tools-body',
            start: 'top 70%',
            end: 'bottom 60%',
            scrub: true,
            invalidateOnRefresh: true,
          },
        },
      );
    }, root);
    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section
      className={`section tools ${inView ? 'is-live' : ''} ${reducedMotion ? 'is-still' : ''}`}
      id="stack"
      aria-labelledby="stack-h"
      ref={section}
    >
      <div className="tools__bg" aria-hidden="true">
        <div className="tools__grid" />
        {DOTS.map((d, k) => (
          <span className="tools__dot" key={k} style={d} />
        ))}
      </div>

      <div className="wrap tools-body">
        <div className="tools-beam" aria-hidden="true">
          <span className="tools-beam__fill" />
          <span className="tools-beam__head" />
        </div>

        <div className="head">
          <p className="eyebrow">Stack</p>
          <h2 id="stack-h" className="tools-title">
            {TITLE.split(' ').map((w, k) => (
              <span className="tools-title__word" key={k}>
                {w}
                {k < TITLE.split(' ').length - 1 ? ' ' : ''}
              </span>
            ))}
          </h2>
        </div>

        <MotionConfig reducedMotion="user">
          <HoverEffect items={ITEMS} className="tools-hover" />
        </MotionConfig>
      </div>
    </section>
  );
}

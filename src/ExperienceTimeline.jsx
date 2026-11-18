import { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { experience } from './content.js';
import { Head } from './ui.jsx';

gsap.registerPlugin(ScrollTrigger);

// Work and education as a timeline whose line draws itself as you scroll.
// A thin green line runs down between the dates and the details; a glowing pen tip rides its
// end, and as it reaches each role a milestone circle pops in beside the date.
// The draw is the DrawSVG idea done with plain stroke-dashoffset, so no extra plugin.
// Under reduced motion the line is drawn and every milestone is shown from the start.

export default function ExperienceTimeline({ reducedMotion }) {
  const wrap = useRef(null);
  const list = useRef(null);
  const path = useRef(null);
  const pen = useRef(null);
  const [geo, setGeo] = useState(null);

  // Measure where the line and milestones go; again whenever the list changes size.
  useLayoutEffect(() => {
    const ol = list.current;
    const measure = () => {
      const box = ol.getBoundingClientRect();
      const items = [...ol.children];
      const first = items[0];
      const single = getComputedStyle(first).gridTemplateColumns.trim().split(/\s+/).length < 2;
      const body = first.querySelector('.timeline__body').getBoundingClientRect();
      const gap = parseFloat(getComputedStyle(first).columnGap) || 32;
      const x = single ? 7 : body.left - box.left - gap / 2;
      const nodes = items.map((it) => {
        const p = it.querySelector('.timeline__period').getBoundingClientRect();
        return Math.round(p.top - box.top + 10);
      });
      const next = { w: Math.round(box.width), h: Math.round(box.height), x: Math.round(x) + 0.5, nodes };
      setGeo((g) => (g && JSON.stringify(g) === JSON.stringify(next) ? g : next));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(ol);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (!geo || reducedMotion) return undefined;
    const ctx = gsap.context(() => {
      const len = path.current.getTotalLength();
      gsap.set(path.current, { strokeDasharray: len, strokeDashoffset: len });
      gsap.set('.tl-node', { scale: 0, autoAlpha: 0, transformOrigin: '50% 50%' });

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: list.current, start: 'top 62%', end: 'bottom 62%', scrub: 0.3 },
      });
      tl.to(path.current, { strokeDashoffset: 0, duration: 1 }, 0);
      tl.fromTo(pen.current, { y: 0 }, { y: geo.h, duration: 1 }, 0);
      // Each milestone pops in the moment the line reaches its date.
      gsap.utils.toArray('.tl-node').forEach((node, i) => {
        tl.to(node, { scale: 1, autoAlpha: 1, duration: 0.07, ease: 'back.out(3)' }, Math.max(0, geo.nodes[i] / geo.h - 0.02));
      });
      tl.to(pen.current, { autoAlpha: 0, duration: 0.04 }, 0.96);
    }, wrap);
    return () => ctx.revert();
  }, [geo, reducedMotion]);

  return (
    <section className="section" id="experience" aria-labelledby="experience-h">
      <div className="wrap">
        <Head label="Experience" title="Work and education" id="experience-h" />
        <div className="timeline-wrap" ref={wrap}>
          {geo && (
            <svg
              className="tl-draw"
              width={geo.w}
              height={geo.h}
              viewBox={`0 0 ${geo.w} ${geo.h}`}
              aria-hidden="true"
              focusable="false"
            >
              <defs>
                <radialGradient id="tl-pen-glow">
                  <stop offset="0" stopColor="#39e6a0" stopOpacity="0.55" />
                  <stop offset="1" stopColor="#39e6a0" stopOpacity="0" />
                </radialGradient>
              </defs>
              <line className="tl-track" x1={geo.x} y1="0" x2={geo.x} y2={geo.h} />
              <path className="tl-line" ref={path} d={`M ${geo.x} 0 V ${geo.h}`} />
              {geo.nodes.map((y, i) => (
                <g className="tl-node" key={i}>
                  <circle className="tl-node__ring" cx={geo.x} cy={y} r="9" />
                  <circle className="tl-node__dot" cx={geo.x} cy={y} r="3.5" />
                </g>
              ))}
              {!reducedMotion && (
                <g className="tl-pen" ref={pen}>
                  <circle cx={geo.x} cy="0" r="14" fill="url(#tl-pen-glow)" />
                  <circle className="tl-pen__tip" cx={geo.x} cy="0" r="3" />
                </g>
              )}
            </svg>
          )}
          <ol className="timeline timeline--drawn" ref={list}>
            {experience.map((e) => (
              <li className="timeline__item" key={e.org}>
                <p className="timeline__period">{e.period}</p>
                <div className="timeline__body">
                  <h3>{e.role}</h3>
                  <p className="timeline__org">{e.org}</p>
                  <ul className="ticks">
                    {e.points.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

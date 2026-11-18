import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { person, projects } from './content.js';
import { Ext, Head } from './ui.jsx';
import ProjectShot from './ProjectShot.jsx';

gsap.registerPlugin(ScrollTrigger);

// Projects as two horizontal rows that pin in turn and travel in opposite directions.
// Row 1 (RokdaDaav to Deceiver): scrolling down slides the panels in from the right.
// Then the page scrolls on to row 2 (Legal AI, Swasthya, the GitHub card), which pins and slides
// the other way: its panels come in from the left. The scroll distance of each row equals its
// overflow, so one screen of scrolling moves a row by one screen. Each screenshot drifts a little
// inside its frame for depth. Only transforms change while scrolling.

const pad = (n) => String(n).padStart(2, '0');

function Panel({ p, i }) {
  return (
    <article className="hp" aria-labelledby={`hp-${p.id}`}>
      {/* Left: the whole screenshot, with the stack and links under it. Right: the story. */}
      <div className="hp__media">
        <ProjectShot p={p} className="hp__shot" />
        {(p.stack.length > 0 || p.github || p.live) && (
          <div className="hp__meta">
            {p.stack.length > 0 && (
              <ul className="chips" aria-label="Built with">
                {p.stack.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            )}
            {(p.github || p.live) && (
              <div className="project__links">
                {p.live && <Ext href={p.live}>Open live demo</Ext>}
                {p.github && <Ext href={p.github}>See the code</Ext>}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="hp__body">
        <p className="hp__index">
          <span>{pad(i + 1)}</span> / {pad(projects.length)}
        </p>
        <p className="project__kind">{p.kind}</p>
        <h3 className="hp__name" id={`hp-${p.id}`}>
          {p.name}
        </h3>
        <p className="project__summary">{p.summary}</p>
        {p.points && (
          <ul className="ticks">
            {p.points.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

// Where the rows split: row 1 runs up to and including Deceiver.
const SPLIT = projects.findIndex((p) => p.id === 'deceiver') + 1 || 3;
const ROWS = [
  { items: projects.slice(0, SPLIT), first: 0, reverse: false },
  { items: projects.slice(SPLIT), first: SPLIT, reverse: true },
];

function Row({ row, index }) {
  const pinWrap = useRef(null);
  const track = useRef(null);
  const bar = useRef(null);
  const count = useRef(null);
  const { items, first, reverse } = row;
  const isFirst = index === 0;

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const distance = () => Math.max(0, track.current.scrollWidth - window.innerWidth);
      // Row 1 starts at its left end and moves left; row 2 starts at its right end and moves right.
      const from = () => (reverse ? -distance() : 0);
      const to = () => (reverse ? 0 : -distance());
      let shown = -1;
      const slide = gsap.fromTo(
        track.current,
        { x: from },
        {
          x: to,
          ease: 'none',
          scrollTrigger: {
            trigger: pinWrap.current,
            start: 'top top',
            end: () => `+=${distance()}`,
            pin: true,
            scrub: true, // Lenis already smooths the scroll
            invalidateOnRefresh: true,
            refreshPriority: 5 - index, // measure top to bottom, before the pins further down
            onUpdate: (self) => {
              bar.current.style.transform = `scaleX(${self.progress})`;
              const n = first + Math.min(items.length, Math.round(self.progress * (items.length - 1)) + 1);
              if (n !== shown) {
                shown = n;
                count.current.textContent = pad(n);
              }
            },
          },
        },
      );

      // Each screenshot window drifts a little against the slide while its panel crosses the screen.
      gsap.utils.toArray('.hp__shot .shot__frame', track.current).forEach((frame) => {
        gsap.fromTo(
          frame,
          { xPercent: reverse ? 3 : -3 },
          {
            xPercent: reverse ? -3 : 3,
            ease: 'none',
            scrollTrigger: {
              trigger: frame.parentElement,
              containerAnimation: slide,
              start: reverse ? 'right left' : 'left right',
              end: reverse ? 'left right' : 'right left',
              scrub: true,
            },
          },
        );
      });
    }, pinWrap);
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [first, items.length, reverse, index]);

  return (
    <div className={`hp-pin ${reverse ? 'hp-pin--reverse' : ''}`} ref={pinWrap}>
      <div className="wrap hp-head">
        {isFirst ? (
          <Head label="Projects" title="Selected projects" id="projects-h" />
        ) : (
          <div className="head">
            <p className="eyebrow">Projects</p>
            <p className="hp-head__title">More projects</p>
          </div>
        )}
        <div className="hp-meter" aria-hidden="true">
          <span className="hp-meter__count">
            <span ref={count}>{pad(first + 1)}</span> / {pad(projects.length)}
          </span>
          <span className="hp-meter__bar">
            <span ref={bar} />
          </span>
        </div>
      </div>
      {/* Row 2 lays its panels out right to left (row-reverse), so reading order stays
          Legal AI, Swasthya, GitHub while the first one you see sits at the right. */}
      <div className={`hp-track ${reverse ? 'hp-track--reverse' : ''}`} ref={track}>
        {items.map((p, i) => (
          <Panel p={p} i={first + i} key={p.id} />
        ))}
        {!isFirst && (
          <div className="hp hp--end">
            <p className="project__kind">More</p>
            <p className="hp__name">Every repository</p>
            <p className="project__summary">The code for these projects and the rest of my public work.</p>
            <Ext href={person.github}>See every repository on GitHub</Ext>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProjectsTrack() {
  return (
    <section className="section section--hp" id="projects" aria-labelledby="projects-h">
      {ROWS.map((row, index) => (
        <Row row={row} index={index} key={index} />
      ))}
    </section>
  );
}

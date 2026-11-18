import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Intro from './intro/Intro.jsx';
import Ambient from './Ambient.jsx';
import { startSmoothScroll, stopSmoothScroll } from './smoothScroll.js';
import Nav from './Nav.jsx';
import { About, Projects, Experience, Stack, Achievements, Contact, Footer } from './Sections.jsx';
import Strengths from './Strengths.jsx';
import Friday from './Friday.jsx';

gsap.registerPlugin(ScrollTrigger);

const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function App() {
  const [reducedMotion, setReducedMotion] = useState(prefersReduced);
  const [introDone, setIntroDone] = useState(false);
  const main = useRef(null);
  const onDoneChange = useCallback((d) => setIntroDone(d), []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.intro = introDone ? 'done' : 'running';
  }, [introDone]);

  // Lenis smooth scrolling for the whole page, off when the visitor asks for less motion.
  useEffect(() => {
    if (reducedMotion) return undefined;
    startSmoothScroll();
    ScrollTrigger.refresh();
    return () => stopSmoothScroll();
  }, [reducedMotion]);

  // As the first section rises over the last frame, darken the smoke behind it
  // and bring in the ambient motes. Same frame, same light: no new background.
  // Only the ambient layer's opacity changes, so the rest of the page is never restyled.
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.ambient',
        { opacity: 0 },
        {
          opacity: 1,
          ease: 'none',
          scrollTrigger: { trigger: main.current, start: 'top bottom', end: 'top 25%', scrub: true },
        },
      );
    });
    return () => ctx.revert();
  }, [reducedMotion]);

  // Scroll animations measure the page once. If anything above them changes height later
  // (fonts swapping in, images decoding), re-measure, or the book would start turning early.
  useEffect(() => {
    let timer = 0;
    let lastH = document.body.scrollHeight;
    const ro = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const h = document.body.scrollHeight;
        if (Math.abs(h - lastH) < 2) return;
        lastH = h;
        ScrollTrigger.refresh();
        lastH = document.body.scrollHeight;
      }, 150);
    });
    ro.observe(main.current);
    return () => {
      clearTimeout(timer);
      ro.disconnect();
    };
  }, []);

  return (
    <>
      <a className="skip-link" href="#about">
        Skip to content
      </a>
      <Nav introDone={introDone} />
      <Intro reducedMotion={reducedMotion} onDoneChange={onDoneChange} />
      <Ambient reducedMotion={reducedMotion} active={introDone} />
      <main ref={main} className="content">
        <About />
        <Projects reducedMotion={reducedMotion} />
        <Experience reducedMotion={reducedMotion} />
        <Stack reducedMotion={reducedMotion} />
        <Achievements reducedMotion={reducedMotion} />
        <Strengths reducedMotion={reducedMotion} />
        <Contact reducedMotion={reducedMotion} />
      </main>
      <Footer />
      <Friday visible={introDone || reducedMotion} />
    </>
  );
}

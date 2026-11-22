import { useEffect, useRef } from 'react';
import { HeroParallax } from '@/components/ui/hero-parallax';
import { projects } from './content.js';

// Opens the Projects section: Aceternity's Hero Parallax with the real project screenshots.
// The wall needs three rows of five; there are five projects, so each row shows all five in a
// different order. Each card opens the live demo, else the code, else the details below.

const order = [
  [0, 1, 2, 3, 4],
  [2, 3, 4, 0, 1],
  [4, 0, 1, 2, 3],
];

const card = (p) => ({
  title: p.name,
  link: p.live || p.github || '#projects-details',
  thumbnail: p.image,
});

const WALL = order.flatMap((row) => row.map((i) => card(projects[i]))).filter(Boolean);

// The five screenshots, fetched and decoded in the background once the section is about a
// screen and a half away. The wall and the detail rows both use them; decoding them on first
// sight, mid-slide, was the one repeatable stutter in a full top-to-bottom scroll test.
// Kept in this list so the decoded images stay alive.
const warmed = [];
function warmScreenshots() {
  if (warmed.length) return;
  for (const src of new Set(projects.map((p) => p.image))) {
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
    img.decode?.().catch(() => {});
    warmed.push(img);
  }
}

export default function ProjectsWall() {
  const section = useRef(null);
  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        warmScreenshots();
      },
      { rootMargin: '150% 0px' },
    );
    io.observe(section.current);
    return () => io.disconnect();
  }, []);

  return (
    <section className="projects-wall" id="projects" aria-labelledby="projects-h" ref={section}>
      <HeroParallax
        products={WALL}
        header={{
          as: 'h2',
          id: 'projects-h',
          title: 'Selected projects',
          description:
            'A chargeback risk manager, a contract analyser, a multi-agent detective game, an EU AI rules chatbot and an emotion analytics app. Scroll on for how each one works.',
        }}
      />
    </section>
  );
}

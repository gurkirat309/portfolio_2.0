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

export default function ProjectsWall() {
  return (
    <section className="projects-wall" id="projects" aria-labelledby="projects-h">
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

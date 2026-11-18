import { person, about, projects, experience, stack, hackathons, certifications } from './content.js';
import { Ext, Head, useMedia } from './ui.jsx';
import ProjectsTrack from './ProjectsTrack.jsx';
import StackTools from './StackTools.jsx';
import ExperienceTimeline from './ExperienceTimeline.jsx';
import ProjectShot from './ProjectShot.jsx';
import ShutterGlyphFooter from '@/components/ui/shutter-glyph-footer';
import AchievementsBook from './AchievementsBook.jsx';
import FoldMarquee from './FoldMarquee.jsx';

export function About() {
  return (
    <section className="section" id="about" tabIndex={-1} aria-labelledby="about-h">
      <div className="wrap about">
        <div className="about__text">
          <Head label="About" title={about.heading} id="about-h" />
          {about.body.map((p) => (
            <p className="lede" key={p}>
              {p}
            </p>
          ))}
          <div className="actions">
            <a className="btn btn--solid" href={person.resume} download>
              Download résumé
            </a>
            <a className="btn btn--line" href={`mailto:${person.email}`}>
              Email me
            </a>
          </div>
        </div>
        <figure className="about__photo">
          <img src="/img/me.webp" alt="Gurkirat Singh" width="900" height="1200" loading="lazy" decoding="async" />
        </figure>
        <dl className="facts">
          {about.facts.map((f) => (
            <div className="facts__item" key={f.value}>
              <dt>{f.value}</dt>
              <dd>{f.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function ProjectCard({ p, feature }) {
  return (
    <article className={`card project ${feature ? 'project--feature' : ''}`}>
      <ProjectShot p={p} className="project__shot" />
      <div className="project__body">
        <p className="project__kind">{p.kind}</p>
        <h3>{p.name}</h3>
        <p className="project__summary">{p.summary}</p>
        {p.points && (
          <ul className="ticks">
            {p.points.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        )}
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
    </article>
  );
}

// Wide, tall-enough screens get the pinned horizontal gallery; phones, portrait screens and
// reduced motion keep the stacked cards, where long project notes stay easy to read.
const WIDE_Q = '(min-width: 861px) and (min-aspect-ratio: 1/1) and (min-height: 560px)';

export function Projects({ reducedMotion }) {
  const wide = useMedia(WIDE_Q);
  if (wide && !reducedMotion) return <ProjectsTrack />;
  const [lead, ...rest] = projects;
  return (
    <section className="section" id="projects" aria-labelledby="projects-h">
      <div className="wrap">
        <Head label="Projects" title="Selected projects" id="projects-h" />
        <ProjectCard p={lead} feature />
        <div className="grid grid--2">
          {rest.map((p) => (
            <ProjectCard p={p} key={p.id} />
          ))}
        </div>
        <p className="more">
          <Ext href={person.github}>See every repository on GitHub</Ext>
        </p>
      </div>
    </section>
  );
}

export function Experience({ reducedMotion }) {
  return <ExperienceTimeline reducedMotion={reducedMotion} />;
}

export function Stack({ reducedMotion }) {
  return <StackTools reducedMotion={reducedMotion} />;
}

export function Achievements({ reducedMotion }) {
  // The page-turning book is the default; reduced motion gets the plain list below.
  if (!reducedMotion) return <AchievementsBook />;
  return (
    <section className="section" id="achievements" aria-labelledby="achievements-h">
      <div className="wrap">
        <Head label="Achievements" title="Hackathons and certifications" id="achievements-h" />
        <div className="grid grid--4">
          {hackathons.map((h) => (
            <article className="card win" key={h.event}>
              <div className="win__shot">
                <img src={h.image} alt={`${h.event} prize`} loading="lazy" decoding="async" />
              </div>
              <div className="win__body">
                <p className={`win__place ${h.place === 'Winner' ? 'is-first' : ''}`}>{h.place}</p>
                <h3>
                  {h.event}
                  {h.host && <span className="muted"> · {h.host}</span>}
                </h3>
                <p className="win__prize">{h.prize}</p>
              </div>
            </article>
          ))}
        </div>
        <ul className="certs">
          {certifications.map((c) => (
            <li key={c.name}>
              <Ext href={c.href} className="certs__link">
                <span className="certs__name">{c.name}</span>
                <span className="certs__meta">
                  {c.issuer}
                  {c.date && ` · ${c.date}`}
                </span>
              </Ext>
            </li>
          ))}
        </ul>
        <p className="more">
          <Ext href={person.certificates}>See all certificates</Ext>
        </p>
      </div>
    </section>
  );
}

// The sign-off band that leads into Contact: only words already on the page, bent over two folds.
const CONTACT_ROWS = [
  { label: 'Contact', items: ['Get in touch'] },
  { label: 'Email', items: [person.email], lower: true },
  { label: 'Elsewhere', items: ['LinkedIn', 'GitHub', 'gurkirat.live'] },
  { label: 'Contact', items: ['Say hello'] },
  { label: 'Email', items: [person.email], lower: true },
  { label: 'Contact', items: ['Get in touch'] },
];

export function Contact({ reducedMotion }) {
  return (
    <section className="section section--contact" id="contact" aria-labelledby="contact-h">
      {!reducedMotion && <FoldMarquee rows={CONTACT_ROWS} href={`mailto:${person.email}`} className="folds--contact" />}
      <div className="wrap">
        <Head label="Contact" title="Email is the fastest way to reach me" id="contact-h" />
        <a className="contact__mail" href={`mailto:${person.email}`}>
          {person.email}
        </a>
        <ul className="contact__links">
          <li>
            <Ext href={person.linkedin}>LinkedIn</Ext>
          </li>
          <li>
            <Ext href={person.github}>GitHub</Ext>
          </li>
          <li>
            <Ext href={person.site}>gurkirat.live</Ext>
          </li>
          <li>
            <a className="link" href={person.resume} download>
              Résumé (PDF)
            </a>
          </li>
        </ul>
      </div>
    </section>
  );
}

// The closing footer: "GURKIRAT" set across the full width in a geometric display alphabet,
// with the R swapped for a three-blade shutter that turns toward the pointer.
// The component's newsletter form is replaced with a plain way to get in touch (there is no
// newsletter), and every link points somewhere real.
const FOOTER_SOCIALS = [
  { label: 'LinkedIn', href: person.linkedin },
  { label: 'GitHub', href: person.github },
  { label: 'Email', href: `mailto:${person.email}` },
];
const FOOTER_MORE = [
  { label: 'Résumé', href: `${person.site}${person.resume}` },
  { label: 'Certificates', href: person.certificates },
  { label: 'Back to top', href: '#top' },
];

export function Footer() {
  return (
    <ShutterGlyphFooter
      brand="Gurkirat"
      wordmark="Gurkirat"
      shutterAt={2}
      company={`${person.name} · ${person.city}`}
      since={0}
      background="#39e6a0"
      ink="#080d0b"
      fontMono="var(--f-mono)"
      className="site-footer"
      socials={FOOTER_SOCIALS}
      legal={FOOTER_MORE}
      lead={
        <>
          <p className="sgf-lede">Get in touch</p>
          <a className="sgf-link footer-mail" href={`mailto:${person.email}`}>
            <span>{person.email}</span>
            <svg viewBox="0 0 12 12" aria-hidden="true">
              <path d="M1 6h9.2M6.4 2.2 10.2 6l-3.8 3.8" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="square" />
            </svg>
          </a>
        </>
      }
    />
  );
}

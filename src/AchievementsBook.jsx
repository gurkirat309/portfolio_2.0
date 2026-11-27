import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { person, hackathons, certifications } from './content.js';
import { Ext, Head } from './ui.jsx';

gsap.registerPlugin(ScrollTrigger);

// Achievements as a book whose pages turn with the scroll.
// Wide screens: an open spread, photo on the left page, details on the right.
// Phones and portrait screens: one page at a time, each page carries photo and details.

const SINGLE_Q = '(max-width: 760px), (max-aspect-ratio: 4/5)';
const PER_FLIP = 0.42; // screen heights of scroll per page turn

const pad = (n) => String(n).padStart(2, '0');
const prizeTotal = hackathons.reduce((sum, h) => sum + Number(h.prize.replace(/\D/g, '')), 0);
const isImage = (href) => /\.(webp|png|jpe?g)$/i.test(href);

function useSingle() {
  const [single, setSingle] = useState(() => window.matchMedia(SINGLE_Q).matches);
  useEffect(() => {
    const mq = window.matchMedia(SINGLE_Q);
    const on = () => setSingle(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return single;
}

/* ---------- pages ---------- */

function Cover() {
  return (
    <div className="page page--cover">
      <p className="page__mark">GS.</p>
      <div className="cover__main">
        <p className="page__eyebrow">Achievements</p>
        <p className="cover__title">
          Wins &amp;
          <br />
          certificates
        </p>
      </div>
      <dl className="cover__facts">
        <div>
          <dt>Hackathon prizes</dt>
          <dd>{hackathons.length}</dd>
        </div>
        <div>
          <dt>Prize money</dt>
          <dd>Rs. {prizeTotal.toLocaleString('en-IN')}</dd>
        </div>
        <div>
          <dt>Certifications</dt>
          <dd>{certifications.length}</dd>
        </div>
      </dl>
      <p className="page__hint">Scroll to turn the pages</p>
    </div>
  );
}

function Photo({ h }) {
  return (
    <figure className="page__photo">
      <img src={h.image} alt={`${h.event} prize`} loading="lazy" decoding="async" />
    </figure>
  );
}

function HackPhoto({ h, n, num }) {
  return (
    <div className="page">
      <p className="page__eyebrow">Hackathon {pad(n)}</p>
      <Photo h={h} />
      <p className="page__caption">
        {h.event}
        {h.host && ` · ${h.host}`}
      </p>
      <p className="page__num">{pad(num)}</p>
    </div>
  );
}

function HackText({ h, n, num, withPhoto }) {
  return (
    <div className="page">
      {withPhoto ? (
        <>
          <p className="page__eyebrow">Hackathon {pad(n)}</p>
          <Photo h={h} />
        </>
      ) : (
        <p className="page__eyebrow">
          Hackathon {pad(n)} of {pad(hackathons.length)}
        </p>
      )}
      <div className="page__body">
        <p className={`tag ${h.place === 'Winner' ? 'is-first' : ''}`}>{h.place}</p>
        <h3 className="page__title">{h.event}</h3>
        {h.host && <p className="page__sub">Hosted at {h.host}</p>}
        <div className="page__prize">
          <span>Prize</span>
          {h.prize}
        </div>
      </div>
      <p className="page__num">{pad(num)}</p>
    </div>
  );
}

function Cert({ c, n, num }) {
  // The certificate picture: its own image (the Claude ones are rendered from their PDFs),
  // or the link itself when the link is an image.
  const image = c.image || (isImage(c.href) ? c.href : null);
  return (
    <div className="page">
      <p className="page__eyebrow">Certification {pad(n)}</p>
      {image ? (
        <figure className="page__cert">
          <img src={image} alt={`${c.name} certificate`} loading="lazy" decoding="async" />
        </figure>
      ) : (
        <div className="page__credential" aria-hidden="true">
          <span>{c.issuer} credential</span>
          <span>{c.name.split(' – ')[0].split(' ').pop()}</span>
        </div>
      )}
      <div className="page__body">
        <h3 className="page__title page__title--sm">{c.name}</h3>
        <p className="page__sub">
          {c.issuer}
          {c.date && ` · ${c.date}`}
        </p>
        <Ext href={c.href} className="link page__link">
          {isImage(c.href) ? 'View certificate' : 'View credential'}
        </Ext>
      </div>
      <p className="page__num">{pad(num)}</p>
    </div>
  );
}

function Closing({ num }) {
  return (
    <div className="page page--closing">
      <p className="page__eyebrow">More</p>
      <div className="page__body">
        <h3 className="page__title">The full certificate folder</h3>
        <p className="page__sub">Every certificate, including the ones not shown here.</p>
        <Ext href={person.certificates} className="link page__link">
          See all certificates
        </Ext>
      </div>
      {num && <p className="page__num">{pad(num)}</p>}
    </div>
  );
}

function BackCover() {
  return (
    <div className="page page--back">
      <p className="page__mark">GS.</p>
    </div>
  );
}

const Blank = () => <div className="page page--blank" />;

/* ---------- layouts ---------- */

// A leaf is one sheet: [front, back]. The base sits under the stack and shows at the end.
function buildLeaves(single) {
  if (single) {
    const fronts = [
      <Cover key="cover" />,
      ...hackathons.map((h, i) => <HackText key={h.event} h={h} n={i + 1} num={i + 1} withPhoto />),
      ...certifications.map((c, i) => <Cert key={c.name} c={c} n={i + 1} num={hackathons.length + i + 1} />),
    ];
    return { leaves: fronts.map((f, i) => [f, <Blank key={`b${i}`} />]), base: <Closing /> };
  }
  let num = 0;
  const pages = [<Cover key="cover" />];
  hackathons.forEach((h, i) => {
    pages.push(<HackPhoto key={`p${i}`} h={h} n={i + 1} num={(num += 1)} />);
    pages.push(<HackText key={`t${i}`} h={h} n={i + 1} num={(num += 1)} />);
  });
  certifications.forEach((c, i) => pages.push(<Cert key={c.name} c={c} n={i + 1} num={(num += 1)} />));
  // Pages come in pairs (each sheet has a front and a back). With an even count so far, the
  // closing page becomes the right-hand page under the stack, so the book never ends on a blank
  // page; with an odd count it goes on the last sheet's back, facing the back cover.
  if (pages.length % 2 === 0) {
    const leaves = [];
    for (let i = 0; i < pages.length; i += 2) leaves.push([pages[i], pages[i + 1]]);
    return { leaves, base: <Closing num={(num += 1)} /> };
  }
  pages.push(<Closing key="closing" num={(num += 1)} />);
  const leaves = [];
  for (let i = 0; i < pages.length; i += 2) leaves.push([pages[i], pages[i + 1]]);
  return { leaves, base: <BackCover /> };
}

export default function AchievementsBook() {
  const single = useSingle();
  const stage = useRef(null);
  const book = useRef(null);
  const bar = useRef(null);
  const { leaves, base } = buildLeaves(single);

  useLayoutEffect(() => {
    const els = gsap.utils.toArray('.leaf', book.current);
    const n = els.length;
    const ctx = gsap.context(() => {
      // Unturned sheets stack with the first on top; turned ones stack with the last on top.
      els.forEach((el, i) => gsap.set(el, { z: n - i, rotateY: 0 }));

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: stage.current,
          pin: true,
          start: 'top top',
          end: () => `+=${window.innerHeight * PER_FLIP * (n + 1)}`,
          scrub: 0.35, // light: Lenis already smooths the scroll itself
          refreshPriority: 2, // after the projects pin above, before the contact band below
          invalidateOnRefresh: true,
        },
      });

      tl.fromTo(book.current, { scale: 0.9, xPercent: single ? 0 : -25 }, { scale: 1, duration: 0.5, ease: 'power1.out' }, 0);
      tl.fromTo(bar.current, { scaleX: 0 }, { scaleX: 1, duration: n + 0.5 }, 0);

      els.forEach((el, i) => {
        const at = 0.5 + i;
        const shades = el.querySelectorAll('.face__shade');
        tl.set(el, { z: n + 2 }, at); // the turning sheet rides above both stacks
        tl.to(el, { rotateY: -180, duration: 1, ease: 'power1.inOut' }, at);
        tl.to(shades, { opacity: 0.6, duration: 0.5, ease: 'power1.in' }, at);
        tl.to(shades, { opacity: 0, duration: 0.5, ease: 'power1.out' }, at + 0.5);
        tl.set(el, { z: i + 1 }, at + 1);
        // The closed book sits centred on its cover; it slides over as it opens.
        if (i === 0 && !single) tl.to(book.current, { xPercent: 0, duration: 1, ease: 'power1.inOut' }, at);
      });
      tl.to({}, { duration: 0.5 }); // a short hold on the last spread
    }, stage);
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [single]);

  return (
    <section className="section section--book" id="achievements" aria-labelledby="achievements-h">
      <div className="book-stage" ref={stage}>
        <div className="wrap book-stage__head">
          <Head label="Achievements" title="Hackathons and certifications" id="achievements-h" />
        </div>
        <div className={`book-view ${single ? 'book--single' : ''}`}>
          <div className="book" ref={book}>
            <div className="book__base">
              <div className="face face--front">{base}</div>
            </div>
            {leaves.map(([front, back], i) => (
              <div className="leaf" key={`${single ? 's' : 'd'}${i}`}>
                <div className={`face face--front ${i === 0 ? 'face--cover' : ''}`}>
                  {front}
                  <span className="face__shade" />
                </div>
                <div className="face face--back">
                  {back}
                  <span className="face__shade" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="book-progress" aria-hidden="true">
          <span ref={bar} />
        </div>
      </div>
    </section>
  );
}

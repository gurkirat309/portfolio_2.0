import { useEffect, useState } from 'react';
import { lockScroll, scrollToTarget } from './smoothScroll.js';

const LINKS = [
  ['about', 'About'],
  ['projects', 'Projects'],
  ['experience', 'Experience'],
  ['stack', 'Stack'],
  ['achievements', 'Achievements'],
  ['contact', 'Contact'],
];

export default function Nav({ introDone }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    lockScroll(open);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Jump straight past the intro; the video seeks to its last frame on its own.
  const skip = () => {
    const about = document.getElementById('about');
    scrollToTarget(about.getBoundingClientRect().top + window.scrollY, { immediate: true });
    about.focus({ preventScroll: true });
  };

  return (
    <nav className={`nav ${introDone ? 'is-on' : ''} ${open ? 'is-open' : ''}`} aria-label="Main">
      <div className="nav__bar wrap">
        <a className="nav__mark" href="#top" aria-label="Gurkirat Singh, back to top">
          GS<span>.</span>
        </a>
        <ul className="nav__links">
          {LINKS.map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`}>{label}</a>
            </li>
          ))}
        </ul>
        {!introDone && (
          <button type="button" className="nav__skip" onClick={skip}>
            Skip intro
          </button>
        )}
        <button
          type="button"
          className="nav__toggle"
          aria-expanded={open}
          aria-controls="nav-sheet"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? 'Close' : 'Menu'}
        </button>
      </div>
      <div className="nav__sheet" id="nav-sheet" hidden={!open}>
        <ul>
          {LINKS.map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`} onClick={() => setOpen(false)}>
                {label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

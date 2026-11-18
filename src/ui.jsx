import { useEffect, useState } from 'react';

export const Ext = ({ href, children, className = 'link' }) => (
  <a className={className} href={href} target="_blank" rel="noreferrer">
    {children}
    <span className="link__arrow" aria-hidden="true">↗</span>
  </a>
);

export const Head = ({ label, title, id }) => (
  <div className="head">
    <p className="eyebrow">{label}</p>
    <h2 id={id}>{title}</h2>
  </div>
);

// True while the media query matches; follows resizes and rotation.
export function useMedia(query) {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return match;
}

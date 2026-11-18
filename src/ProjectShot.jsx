// A project screenshot shown whole, at its own shape, inside a slim browser window.
// The window sits centred on a soft green ground, so a tall or wide column never crops it.
// Used by both the horizontal gallery and the stacked cards.

const hostOf = (url) => {
  try {
    const u = new URL(url);
    return u.host + (u.host === 'github.com' ? u.pathname : '');
  } catch {
    return '';
  }
};

export default function ProjectShot({ p, className = '' }) {
  const href = p.live || p.github;
  const address = href ? hostOf(href) : '';
  return (
    <a
      className={`shot ${className}`}
      href={href || undefined}
      target="_blank"
      rel="noreferrer"
      tabIndex={-1}
      aria-hidden="true"
      style={href ? undefined : { pointerEvents: 'none' }}
    >
      <span className="shot__frame">
        <span className="shot__bar">
          <i />
          <i />
          <i />
          {address && <span className="shot__url">{address}</span>}
        </span>
        <img src={p.image} alt="" width="1400" height={p.imageH || 720} loading="lazy" decoding="async" />
      </span>
    </a>
  );
}

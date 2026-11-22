// The layer between the intro's last frame (the smoke) and the content: one solid dim over the
// film, faded in by a scroll tween in App.jsx as the first section rises. Nothing moves in it.
// (It used to also hold drifting green particles and two colour washes; both were decoration.)
export default function Ambient() {
  return (
    <div className="ambient" aria-hidden="true">
      <div className="ambient__scrim" />
    </div>
  );
}

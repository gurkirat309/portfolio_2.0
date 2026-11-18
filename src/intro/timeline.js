// Timings are in seconds of the source video, read off its frames:
//   0.0–2.0  robot looks down, smoke drifts
//   2.5–6.0  eyes light up, robot faces the camera
//   6.0–7.5  hologram assembles on the right
//  10.0–12.4 the hand rises toward the panel
//  12.5      fingertip meets the panel at (65.5%, 53%) of the frame; ring peaks at 12.9
//  13.1–13.9 the robot dissolves into particles
//  14.0–14.9 only smoke is left: this frame becomes the portfolio's background
export const SRC = { w: 1920, h: 1080 };

export const T = {
  duration: 14.917,
  nameIn: [0.35, 2.3],
  nameOut: [5.5, 6.3],
  roleIn: [6.6, 7.8],
  roleOut: [10.0, 10.8],
  touch: { start: 12.45, peak: 12.9, end: 13.5, x: 0.655, y: 0.53 },
  ring1: [12.52, 13.4],
  ring2: [12.7, 13.6],
  sparks: [12.6, 13.5],
  holo: { x: 0.8, y: 0.5 },
};

export const NAME_LINES = ['GURKIRAT', 'SINGH'];
export const ROLE = 'AI ENGINEER';

// Horizontal focus (0..1 of the frame) kept centred when the screen is narrower than 16:9.
// Early on it holds the robot's face; near the touch it slides right to keep finger and panel in view.
const FOCUS = [
  [0, 0.3],
  [6.0, 0.3],
  [7.6, 0.38],
  [10.0, 0.42],
  [11.6, 0.55],
  [12.9, 0.585],
  [14.9, 0.5],
];

export const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const ramp = (t, a, b) => clamp01((t - a) / (b - a));
export const ease = (x) => x * x * (3 - 2 * x);
export const easeOut = (x) => 1 - (1 - x) ** 3;

export function focusAt(t) {
  if (t <= FOCUS[0][0]) return FOCUS[0][1];
  for (let i = 1; i < FOCUS.length; i += 1) {
    const [t1, f1] = FOCUS[i];
    const [t0, f0] = FOCUS[i - 1];
    if (t <= t1) return f0 + (f1 - f0) * ease((t - t0) / (t1 - t0));
  }
  return FOCUS[FOCUS.length - 1][1];
}

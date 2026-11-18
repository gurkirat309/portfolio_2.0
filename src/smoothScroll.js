import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// One Lenis instance for the whole page, driven by GSAP's ticker so Lenis, ScrollTrigger,
// the intro and the book all move on the same frame. Lenis still scrolls the real window,
// so pinning, anchors and the browser's own scrollbar keep working.
// Touch screens keep native scrolling (syncTouch off): phones already scroll smoothly
// and their own momentum feels right there.

// Sections carry at least 96px of top padding, so landing on their exact top clears the
// fixed nav, and the pinned book starts exactly on its cover.
const NAV_OFFSET = 0;
let lenis = null;

export function startSmoothScroll() {
  if (lenis) return lenis;
  lenis = new Lenis({
    lerp: 0.1,
    wheelMultiplier: 1,
    smoothWheel: true,
    syncTouch: false,
  });
  lenis.on('scroll', ScrollTrigger.update);
  const raf = (time) => lenis?.raf(time * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);

  // In-page links (#about, #contact...) glide with Lenis instead of jumping.
  const onClick = (e) => {
    const a = e.target.closest?.('a[href^="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    const id = a.getAttribute('href');
    const target = id === '#' || id === '#top' ? 0 : document.querySelector(id);
    if (target === null) return;
    e.preventDefault();
    scrollToTarget(target);
    history.replaceState(null, '', id === '#' ? location.pathname : id);
    if (target instanceof HTMLElement && target.tabIndex >= 0) target.focus({ preventScroll: true });
  };
  document.addEventListener('click', onClick);

  lenis.cleanup = () => {
    document.removeEventListener('click', onClick);
    gsap.ticker.remove(raf);
  };
  return lenis;
}

export function stopSmoothScroll() {
  if (!lenis) return;
  lenis.cleanup();
  lenis.destroy();
  lenis = null;
}

export const isSmoothScroll = () => lenis !== null;

// Scroll to an element or a pixel offset; falls back to the native scroll without Lenis.
export function scrollToTarget(target, { immediate = false } = {}) {
  const top =
    typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY + NAV_OFFSET;
  if (lenis) lenis.scrollTo(Math.max(0, top), { immediate, force: true });
  else window.scrollTo({ top: Math.max(0, top), behavior: immediate ? 'auto' : 'smooth' });
}

// Freeze page scrolling (e.g. while the mobile menu sheet is open).
export function lockScroll(locked) {
  if (!lenis) return;
  if (locked) lenis.stop();
  else lenis.start();
}

/* experiment home-variations, v07 "One at a time".
   The sheets snap by themselves (the stylesheet: mandatory, on the section only). This script
   1. keeps the next photographs loaded before the flick that shows them;
   2. docks the section when the page comes to rest just short of it, moving toward it, so a
      flick inside it never starts half in view (never when leaving it, never under reduce motion);
   3. moves a keyboard user one sheet at a time: Page Down, Page Up, the arrows, space, Home
      and End, with focus on that sheet's photograph. Past the first or the last sheet the
      same keys move the page on. Keys count when focus is in a sheet, or nowhere in
      particular while the section fills the screen. */
(() => {
  const feed = document.querySelector('.feed');
  if (!feed) return;
  const sheets = [...feed.querySelectorAll('.sheet')];
  const still = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const how = () => (still() ? 'auto' : 'smooth');
  const now = () => Math.round(feed.scrollTop / Math.max(1, feed.clientHeight));

  // 1. the next photographs are fetched before they are needed
  const ready = i => sheets.slice(i, i + 3).forEach(s => {
    const img = s.querySelector('img');
    if (img && img.loading === 'lazy') img.loading = 'eager';
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e], io) => {
      if (e.isIntersecting) { ready(0); io.disconnect(); }
    }, { rootMargin: '100% 0px' }).observe(feed);
  } else {
    ready(0);
  }
  let last = -1;
  feed.addEventListener('scroll', () => {
    const i = now();
    if (i !== last) { last = i; ready(i); }
  }, { passive: true });

  // 2. docking: only when the page stops close to the section and was moving toward it
  let y = window.scrollY, dir = 0, rest = 0;
  const dock = () => {
    if (still()) return;
    const top = feed.getBoundingClientRect().top, near = window.innerHeight * 0.28;
    if ((dir > 0 && top > 1 && top < near) || (dir < 0 && top < -1 && top > -near)) {
      window.scrollBy({ top, behavior: 'smooth' });
    }
  };
  window.addEventListener('scroll', () => {
    const ny = window.scrollY;
    if (ny !== y) dir = Math.sign(ny - y);
    y = ny;
    clearTimeout(rest);
    rest = setTimeout(dock, 160);
  }, { passive: true });

  // 3. the keyboard
  const go = i => {
    sheets[i].scrollIntoView({ block: 'start', behavior: how() });
    sheets[i].querySelector('a')?.focus({ preventScroll: true });
  };
  const keys = { PageDown: 1, ArrowDown: 1, PageUp: -1, ArrowUp: -1 };
  document.addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.defaultPrevented) return;
    const a = document.activeElement;
    const docked = (!a || a === document.body || a.id === 'main') && Math.abs(feed.getBoundingClientRect().top) < 4;
    if (!feed.contains(a) && !docked) return;
    const i = sheets.findIndex(s => s.contains(a));
    const from = i < 0 ? now() : i;
    let by = 0, to;
    if (e.key in keys) by = keys[e.key];
    else if (e.key === ' ' && !(a && a.matches('button'))) by = e.shiftKey ? -1 : 1;
    if (by) to = from + by;
    else if (e.key === 'Home') to = 0;
    else if (e.key === 'End') to = sheets.length - 1;
    else return;
    e.preventDefault();
    if (to >= 0 && to < sheets.length) go(to);
    else if (by) window.scrollBy({ top: by * window.innerHeight * 0.85, behavior: how() });   // past either end: the page moves on
  });
})();

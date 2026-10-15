/* Variation 01, Facing pages: the one moment.
   When the first spread comes into view, its facing page is laid open from the gutter.
   Nothing is hidden unless motion is welcome and the spread is still below the window,
   so without this script (or with "reduce motion") every page is simply in place. */
(() => {
  const spread = document.querySelector('.v01-spread');
  if (!spread || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (spread.getBoundingClientRect().top < window.innerHeight * 0.9) return;
  spread.classList.add('is-shut');
  const io = new IntersectionObserver(entries => {
    if (!entries.some(en => en.isIntersecting)) return;
    io.disconnect();
    spread.classList.remove('is-shut');
    spread.classList.add('is-open');
  }, { threshold: 0.3 });
  io.observe(spread);
})();

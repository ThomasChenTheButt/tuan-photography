/* experiment home-variations, variation 10: in each pair, the second photograph arrives a beat
   after the first, the first time the pair comes into view. Nothing is hidden unless this script
   runs and motion is welcome; once a pair has arrived it is left as plain photographs.
   On a phone the photographs stand one above the other, so each arrives as it comes into view. */
(() => {
  if (!('IntersectionObserver' in window)) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // side by side, the pair waits as one; on a phone, one above the other, each photograph waits for its turn
  const narrow = matchMedia('(max-width: 40rem)').matches;
  const pairs = [...document.querySelectorAll(narrow ? '[data-v10-pair] > .v10-shot' : '[data-v10-pair]')]
    .filter(p => p.getBoundingClientRect().top > innerHeight * 0.9);   // already in view: leave it standing
  const seen = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const p = e.target;
      seen.unobserve(p);
      p.classList.add('v10-in');
      setTimeout(() => p.classList.remove('v10-wait', 'v10-in'), 2600);
    });
  }, { rootMargin: '0px 0px -22% 0px' });
  pairs.forEach(p => { p.classList.add('v10-wait'); seen.observe(p); });
})();

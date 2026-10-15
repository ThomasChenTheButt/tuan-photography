/* experiment home-variations, v02 "Two roads": the one moment.
   Each fork under a photograph draws itself as it comes into view: the stem, then the bar
   outward, then the two legs (the stylesheet holds the timing). Without this script, or
   under "reduce motion", every fork is simply drawn. */
(() => {
  const forks = document.querySelectorAll('.fork');
  if (!forks.length || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const seen = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-drawn');
      seen.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  forks.forEach(f => {
    // a fork already on screen when the page opens is drawn at once
    const r = f.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.92 && r.bottom > 0) f.classList.add('is-drawn');
    else seen.observe(f);
  });
  document.documentElement.classList.add('forks-armed');
})();

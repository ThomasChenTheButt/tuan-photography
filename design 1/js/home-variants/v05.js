/* experiment home-variations, variation 05: the account arrives in order (where, when, how,
   then where next) the first time it comes into view. Nothing is hidden unless this script
   runs and motion is welcome; the account is visible by default. */
(() => {
  const sheet = document.querySelector('[data-v05-sheet]');
  if (!sheet || !('IntersectionObserver' in window)) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (sheet.getBoundingClientRect().top < innerHeight * 0.85) return;   // already in view: leave it standing
  sheet.classList.add('v05-wait');
  const seen = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    sheet.classList.add('v05-in');
    seen.disconnect();
  }, { rootMargin: '0px 0px -18% 0px' });
  seen.observe(sheet);
})();

/* Variation 06, Exposure: the one moment.
   As each photograph comes into view, its numbers resolve from soft to sharp.
   Only pairs still below the window are softened, and only when motion is welcome,
   so without this script (or with "reduce motion") the numbers are simply sharp. */
(() => {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const pairs = [...document.querySelectorAll('.x6-pair')]
    .filter(p => p.getBoundingClientRect().top > window.innerHeight * 0.9);
  if (!pairs.length) return;
  pairs.forEach(p => p.classList.add('is-soft'));
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.closest('.x6-pair').classList.remove('is-soft');
      io.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -25% 0px' });
  pairs.forEach(p => io.observe(p.querySelector('.x6-words')));
})();

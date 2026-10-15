/* Variation 03, "The caption grows".
   The captions unfold with the scroll itself where the browser can tie an animation to it
   (animation-timeline: view(), in v03.css). Where it cannot, this opens each caption while it
   is in the middle part of the screen and folds it again when it leaves. Under "reduce motion"
   nothing is hidden and this does nothing. */
(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.CSS && CSS.supports('animation-timeline: view()')) return;
  if (!('IntersectionObserver' in window)) return;
  const caps = document.querySelectorAll('.v3-cap');
  if (!caps.length) return;
  document.documentElement.classList.add('v3-io');
  const io = new IntersectionObserver(entries => {
    for (const entry of entries) entry.target.classList.toggle('is-open', entry.isIntersecting);
  }, { rootMargin: '-6% 0px -22% 0px' });
  caps.forEach(cap => io.observe(cap));
})();

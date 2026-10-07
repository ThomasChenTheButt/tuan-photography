/* Slices. The photograph in tall slices that rise one after another out of the paper, each
   a breath behind the last, and close into one frame. From the web: the split-panel and
   clip reveals on award sites. */
window.Openings.slices = function (o) {
  'use strict';
  const stage = o.stage('paper');
  o.style(`
    .op-sl .s { position: absolute; top: 0; height: 100%; overflow: hidden; clip-path: inset(100% 0 0 0); will-change: clip-path, transform; }
    .op-sl .s img { position: absolute; top: 0; height: 100%; max-width: none; object-fit: cover; display: block; will-change: transform; }
  `);
  stage.classList.add('op-sl');
  const W = innerWidth, H = innerHeight;
  const N = W > 900 ? 14 : W > 600 ? 9 : 6;
  const sw = W / N;
  const src = o.src(o.lead);
  const slices = [];
  for (let i = 0; i < N; i++) {
    const s = document.createElement('div'); s.className = 's';
    s.style.left = (i * sw - 0.5) + 'px'; s.style.width = (sw + 1) + 'px';
    const im = new Image(); im.src = src; im.alt = '';
    im.style.left = (-i * sw) + 'px'; im.style.width = W + 'px'; im.style.transformOrigin = (W / 2) + 'px 50%';   // every slice scales about the window's centre, so the seams hold
    s.appendChild(im); stage.appendChild(s); slices.push({ s, im });
  }
  const ease = 'cubic-bezier(0.16, 1, 0.3, 1)';
  o.load(src).then(() => {
    const order = slices.map((_, i) => i).sort((a, b) => Math.abs(a - (N - 1) / 2) - Math.abs(b - (N - 1) / 2));   // from the middle outward
    order.forEach((i, k) => {
      const d = 300 + k * 70;
      slices[i].s.animate([{ clipPath: 'inset(100% 0 0 0)', transform: 'translateY(6vh)' }, { clipPath: 'inset(0 0 0 0)', transform: 'translateY(0)' }], { duration: 1400, delay: d, easing: ease, fill: 'both' });
      slices[i].im.animate([{ transform: 'scale(1.18)' }, { transform: 'scale(1)' }], { duration: 2200, delay: d, easing: ease, fill: 'both' });
    });
    o.done(stage, 300 + (N / 2) * 70 + 2300);
  });
};

/* Stack. Photographs pop up at the centre one after another, each scaling in while its own
   picture eases out, landing on the last, until the final one spreads to the edges. From
   the web: the image-stack and zoom-image preloaders common on award sites. */
window.Openings.stack = function (o) {
  'use strict';
  const stage = o.stage('paper');
  o.style(`
    .op-st .card { position: absolute; left: 50%; top: 50%; overflow: hidden; background: var(--band); transform: translate(-50%, -50%) scale(0); will-change: transform; }
    .op-st .card img { width: 100%; height: 100%; object-fit: cover; display: block; will-change: transform; }
    .op-st .big { position: absolute; object-fit: cover; display: block; }
  `);
  stage.classList.add('op-st');
  const W = innerWidth, H = innerHeight;
  const seq = o.pick(7).concat([o.lead]);
  const cw = Math.min(W * 0.36, H * 0.5), ch = cw * 0.72;
  const offs = [[-14, -9], [12, 8], [-8, 10], [15, -7], [-15, 2], [6, -12], [10, 11], [0, 0]];   // vw, vh, where each lands
  const cards = seq.map((p, i) => {
    const c = document.createElement('div'); c.className = 'card';
    c.style.width = cw + 'px'; c.style.height = ch + 'px';
    const im = new Image(); im.src = o.src(p, 1280); im.alt = ''; c.appendChild(im); stage.appendChild(c);
    return { c, im, dx: offs[i][0], dy: offs[i][1] };
  });
  const big = new Image(); big.className = 'big'; big.src = o.src(o.lead); big.alt = '';
  const ease = 'cubic-bezier(0.16, 1, 0.3, 1)', GAP = 300, IN = 900;
  Promise.race([Promise.all(cards.map((k) => o.load(k.im.src)).concat([o.load(big.src)])), new Promise((r) => setTimeout(r, 3000))]).then(() => {
    cards.forEach((k, i) => {
      setTimeout(() => {
        k.c.animate([{ transform: `translate(-50%, -50%) translate(${k.dx * 0.3}vw, ${k.dy * 0.3}vh) scale(0)` },
                     { transform: `translate(-50%, -50%) translate(${k.dx}vw, ${k.dy}vh) scale(1)` }], { duration: IN, easing: ease, fill: 'both' });
        k.im.animate([{ transform: 'scale(1.7)' }, { transform: 'scale(1)' }], { duration: IN * 1.4, easing: ease, fill: 'both' });
      }, 200 + i * GAP);
    });
    setTimeout(() => {
      // the deal gathers under the last, and the last spreads to the edges
      const last = cards[cards.length - 1];
      cards.slice(0, -1).forEach((k) => k.c.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, easing: ease, fill: 'both' }));
      const r = last.c.getBoundingClientRect();
      const from = { x: r.left, y: r.top, w: r.width, h: r.height };
      last.c.style.visibility = 'hidden';
      stage.appendChild(big);
      const T = 1200, t0 = performance.now();
      function frame(now) {
        const g = o.easeInOut(o.clamp((now - t0) / T));
        big.style.left = (from.x * (1 - g)).toFixed(1) + 'px';
        big.style.top = (from.y * (1 - g)).toFixed(1) + 'px';
        big.style.width = (from.w + (W - from.w) * g).toFixed(1) + 'px';
        big.style.height = (from.h + (H - from.h) * g).toFixed(1) + 'px';
        if (g < 1) requestAnimationFrame(frame); else o.done(stage, 120);
      }
      requestAnimationFrame(frame);
    }, 200 + cards.length * GAP + 700);
  });
};

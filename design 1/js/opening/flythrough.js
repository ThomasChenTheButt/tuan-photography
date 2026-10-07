/* Fly through. A camera flies through one photograph into the next, each nested small
   inside the last, at a steady speed, and arrives at the opening one. From the web: the
   zoom-through preloaders that feel like a camera moving through the work. */
window.Openings.flythrough = function (o) {
  'use strict';
  const stage = o.stage();
  o.style(`
    .op-ft .layer { position: absolute; left: 50%; top: 50%; width: var(--W); height: var(--H); margin: calc(var(--H) / -2) 0 0 calc(var(--W) / -2); overflow: hidden; background: oklch(12% 0.01 60); will-change: transform; }
    .op-ft .layer img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .op-ft .layer::after { content: ""; position: absolute; inset: 0; box-shadow: inset 0 0 0 2px oklch(97.5% 0.008 85 / 0.9); }
  `);
  stage.classList.add('op-ft');
  const W = innerWidth, H = innerHeight;
  const K = 0.3, N = 6;                                   // each next photograph is this fraction of the last
  const seq = o.pick(N - 1).concat([o.lead]);
  const spots = [[0, 0], [0.12, -0.08], [-0.1, 0.06], [0.08, 0.1], [-0.06, -0.1], [0, 0]];   // where each sits inside the last
  const layers = seq.map((p, i) => {
    const l = document.createElement('div'); l.className = 'layer';
    l.style.setProperty('--W', W + 'px'); l.style.setProperty('--H', H + 'px');
    l.style.zIndex = i + 1;
    const im = new Image(); im.src = o.src(p, i === N - 1 ? '' : 1280); im.alt = ''; l.appendChild(im);
    stage.appendChild(l);
    // its place: the centre offsets of every layer outside it, summed
    let cx = 0, cy = 0, s = 1;
    for (let k = 1; k <= i; k++) { s *= K; cx += spots[k][0] * W * (s / K); cy += spots[k][1] * H * (s / K); }
    return { l, im, s, cx, cy };
  });
  const T = 6000, Z = Math.pow(1 / K, N - 1);
  Promise.race([Promise.all(layers.map((l) => o.load(l.im.src))), new Promise((r) => setTimeout(r, 3000))]).then(() => {
    const t0 = performance.now();
    function frame(now) {
      const u = o.clamp((now - t0) / T);
      const e = u < 0.1 ? 0 : o.easeInOut(o.clamp((u - 0.1) / 0.88));
      const z = Math.pow(Z, e);                               // steady: the same stretch each second
      // the camera keeps the layer it is flying into at the centre
      const target = layers[N - 1];
      const px = target.cx * z - target.cx * (1 - e), py = target.cy * z - target.cy * (1 - e);   // centred on the first at the start, on the last at the end
      layers.forEach((l) => {
        const sc = l.s * z;
        if (sc > 4) { l.l.style.visibility = 'hidden'; return; }
        l.l.style.visibility = '';
        l.l.style.transform = `translate(${(l.cx * z - px).toFixed(1)}px, ${(l.cy * z - py).toFixed(1)}px) scale(${sc.toFixed(4)})`;
      });
      if (u < 1) requestAnimationFrame(frame); else o.done(stage, 100);
    }
    requestAnimationFrame(frame);
  });
};

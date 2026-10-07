/* Exposure. White, blown out: too much light. The exposure comes down stop by stop, and
   warm light leaks drift across the frame until the photograph is right. The photographer's
   first problem, light, solved in front of you. */
window.Openings.exposure = function (o) {
  'use strict';
  const stage = o.stage();
  o.style(`
    .op-ex { background: #fff !important; }
    .op-ex img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; will-change: filter; }
    .op-ex .leak { position: absolute; width: 140vmax; height: 140vmax; left: 50%; top: 50%; margin: -70vmax 0 0 -70vmax; mix-blend-mode: screen; pointer-events: none; will-change: transform, opacity; }
    .op-ex .leak.a { background: radial-gradient(closest-side, oklch(80% 0.17 60 / 0.95), oklch(72% 0.17 40 / 0.5) 40%, transparent 70%); }
    .op-ex .leak.b { background: radial-gradient(closest-side, oklch(78% 0.15 20 / 0.8), oklch(70% 0.12 350 / 0.35) 45%, transparent 72%); }
    .op-ex .white { position: absolute; inset: 0; background: #fff; }
  `);
  stage.classList.add('op-ex');
  const img = new Image(); img.src = o.src(o.lead); img.alt = '';
  const a = document.createElement('div'); a.className = 'leak a';
  const b = document.createElement('div'); b.className = 'leak b';
  const white = document.createElement('div'); white.className = 'white';
  stage.append(img, a, b, white);
  const T = 5200;
  o.load(img.src).then(() => {
    const t0 = performance.now();
    function frame(now) {
      const u = o.clamp((now - t0) / T);
      white.style.opacity = (1 - o.easeOut(o.clamp(u / 0.18))).toFixed(3);
      // the exposure comes down: bright and flat, then right
      const e = o.easeInOut(o.clamp((u - 0.08) / 0.72));
      const steps = 5, stop = Math.round(e * steps) / steps;                // stop by stop, with a little drift inside each
      const k = stop * 0.85 + e * 0.15;
      img.style.filter = `brightness(${(1 + 2.6 * (1 - k)).toFixed(3)}) contrast(${(0.45 + 0.55 * k).toFixed(3)}) saturate(${(0.5 + 0.5 * k).toFixed(3)})`;
      // the leaks cross the frame and burn out as the exposure settles
      const l = 1 - o.easeInOut(o.clamp((u - 0.55) / 0.4));
      a.style.opacity = (0.9 * l).toFixed(3);
      b.style.opacity = (0.7 * l).toFixed(3);
      a.style.transform = `translate(${(-60 + 110 * u).toFixed(1)}vw, ${(20 - 40 * u).toFixed(1)}vh)`;
      b.style.transform = `translate(${(55 - 95 * u).toFixed(1)}vw, ${(-30 + 50 * u).toFixed(1)}vh)`;
      if (u < 1) requestAnimationFrame(frame); else o.done(stage, 150);
    }
    requestAnimationFrame(frame);
  });
};

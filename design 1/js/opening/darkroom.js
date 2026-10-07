/* Darkroom. Black. Under a red safelight the print comes up in the tray: grain first,
   then the shapes, then, as the light goes to white, the colour. */
window.Openings.darkroom = function (o) {
  'use strict';
  const stage = o.stage();
  o.style(`
    .op-dk { position: absolute; inset: 0; }
    .op-dk img { width: 100%; height: 100%; object-fit: cover; display: block; will-change: filter, transform; }
    .op-dk .safe { position: absolute; inset: 0; background: oklch(42% 0.19 28); mix-blend-mode: multiply; }
    .op-dk .grain { position: absolute; inset: -10%; mix-blend-mode: overlay; opacity: 0.7;
      background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 1 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
      background-size: 220px 220px; }
    .op-dk .tray { position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 55%, transparent 55%, oklch(8% 0.01 60 / 0.75)); }
  `);
  const box = document.createElement('div'); box.className = 'op-dk';
  const img = new Image(); img.src = o.src(o.lead); img.alt = '';
  const safe = document.createElement('div'); safe.className = 'safe';
  const grain = document.createElement('div'); grain.className = 'grain';
  const tray = document.createElement('div'); tray.className = 'tray';
  box.append(img, grain, safe, tray);
  stage.appendChild(box);

  const T = 5600;
  o.load(img.src).then(() => {
    const t0 = performance.now();
    function frame(now) {
      const u = o.clamp((now - t0) / T);
      const e1 = o.easeInOut(o.clamp(u / 0.62));            // the image comes up
      const e2 = o.easeInOut(o.clamp((u - 0.5) / 0.4));     // the light goes to white, the colour comes
      const blur = 22 * (1 - e1);
      const bright = 0.04 + 0.96 * e1;
      const contrast = 0.35 + 0.65 * e1;
      const grey = 1 - e2;
      img.style.filter = `blur(${blur.toFixed(1)}px) brightness(${bright.toFixed(3)}) contrast(${contrast.toFixed(3)}) grayscale(${grey.toFixed(3)})`;
      img.style.transform = `scale(${(1.05 - 0.05 * e1).toFixed(4)})`;
      safe.style.opacity = (1 - e2).toFixed(3);
      grain.style.opacity = (0.75 * (1 - e1) + 0.12 * (1 - e2)).toFixed(3);
      grain.style.transform = `translate(${(Math.random() * 12 - 6).toFixed(1)}px, ${(Math.random() * 12 - 6).toFixed(1)}px)`;
      tray.style.opacity = (1 - o.easeInOut(o.clamp((u - 0.7) / 0.3))).toFixed(3);
      if (u < 1) requestAnimationFrame(frame); else o.done(stage, 200);
    }
    requestAnimationFrame(frame);
  });
};

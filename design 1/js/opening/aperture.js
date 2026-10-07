/* Aperture. A shutter blink, then the iris blades turn open from the centre while the
   focus pulls sharp. */
window.Openings.aperture = function (o) {
  'use strict';
  const stage = o.stage();
  o.style(`
    .op-ap img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; will-change: filter, transform; }
    .op-ap canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
    .op-ap .blink { position: absolute; inset: 0; background: #fff; }
  `);
  stage.classList.add('op-ap');
  const img = new Image(); img.src = o.src(o.lead); img.alt = '';
  const cv = document.createElement('canvas');
  const blink = document.createElement('div'); blink.className = 'blink';
  stage.append(img, cv, blink);

  const BLADES = 9, T = 3600;
  o.load(img.src).then(() => {
    const dpr = Math.min(2, devicePixelRatio || 1);
    const W = innerWidth, H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    const ctx = cv.getContext('2d');
    ctx.scale(dpr, dpr);
    const Rmax = Math.hypot(W, H) / 2 / Math.cos(Math.PI / BLADES) + 8;
    const t0 = performance.now();
    function frame(now) {
      const u = o.clamp((now - t0) / T);
      // the blink: white for an instant, then gone
      blink.style.opacity = u < 0.03 ? 1 : (1 - o.easeOut(o.clamp((u - 0.03) / 0.12))).toFixed(3);
      const e = o.easeInOut(o.clamp((u - 0.12) / 0.78));
      const r = Rmax * Math.pow(e, 1.6) + 1.5;
      const rot = -0.9 * (1 - e);
      // focus: soft, then sharp as the blades open
      const f = o.easeOut(o.clamp((u - 0.2) / 0.6));
      img.style.filter = `blur(${(18 * (1 - f)).toFixed(1)}px) brightness(${(0.8 + 0.2 * f).toFixed(3)})`;
      img.style.transform = `scale(${(1.04 - 0.04 * f).toFixed(4)})`;
      // the iris: the dark outside a turning polygon
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = 'oklch(10% 0.01 60)';
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      for (let i = 0; i < BLADES; i++) {
        const a = rot + (i / BLADES) * Math.PI * 2 - Math.PI / 2;
        const x = W / 2 + Math.cos(a) * r, y = H / 2 + Math.sin(a) * r;
        if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
      ctx.closePath(); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      // the edge of each blade, a hair of grey
      if (e < 0.999) {
        ctx.strokeStyle = 'oklch(40% 0.01 60 / 0.6)'; ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let i = 0; i < BLADES; i++) {
          const a = rot + (i / BLADES) * Math.PI * 2 - Math.PI / 2;
          const b = a + Math.PI / BLADES * 1.35;
          ctx.moveTo(W / 2 + Math.cos(a) * r, H / 2 + Math.sin(a) * r);
          ctx.lineTo(W / 2 + Math.cos(b) * (r + Rmax), H / 2 + Math.sin(b) * (r + Rmax));
        }
        ctx.stroke();
      }
      if (u < 1) requestAnimationFrame(frame); else o.done(stage, 100);
    }
    requestAnimationFrame(frame);
  });
};

/* Aperture. The iris blades turn open while the focus pulls sharp.
   1  a shutter blink, then nine dark blades open from the centre
   2  stop by stop: the iris opens in seven clicks, each a snap and a hold, like turning the ring
   3  on the summit: six blades open from the mountain itself, not the middle of the window
   4  paper blades: the iris is cut from the page's own paper, and opens on it */
window.Openings.aperture = function (o) {
  'use strict';
  const v = o.v;
  const stage = o.stage(v === 4 ? 'paper' : '');
  o.style(`
    .op-ap img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; will-change: filter, transform; }
    .op-ap canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
    .op-ap .blink { position: absolute; inset: 0; background: oklch(98.8% 0.005 85); opacity: 0; }
  `);
  stage.classList.add('op-ap');
  const img = new Image(); img.src = o.src(o.lead); img.alt = '';
  const cv = document.createElement('canvas');
  const blink = document.createElement('div'); blink.className = 'blink';
  stage.append(img, cv, blink);

  const cfg = {
    1: { blades: 9, T: 3600, blink: true, steps: 0, turn: 0.9, fill: 'oklch(10% 0.01 60)', edge: 'oklch(40% 0.01 60 / 0.6)' },
    2: { blades: 8, T: 4200, blink: false, steps: 7, turn: 1.1, fill: 'oklch(10% 0.01 60)', edge: 'oklch(40% 0.01 60 / 0.6)' },
    3: { blades: 6, T: 3800, blink: true, steps: 0, turn: 1.4, fill: 'oklch(10% 0.01 60)', edge: 'oklch(40% 0.01 60 / 0.6)', summit: true },
    4: { blades: 7, T: 4200, blink: false, steps: 0, turn: 1.2, fill: 'oklch(96.6% 0.011 82)', edge: 'oklch(84.5% 0.015 78)', shade: true },
  }[v] || null;
  const c = cfg || { blades: 9, T: 3600, blink: true, steps: 0, turn: 0.9, fill: 'oklch(10% 0.01 60)', edge: 'oklch(40% 0.01 60 / 0.6)' };

  o.load(img.src).then(() => {
    const dpr = Math.min(2, devicePixelRatio || 1);
    const W = innerWidth, H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    const ctx = cv.getContext('2d');
    ctx.scale(dpr, dpr);
    // the iris's centre: the middle of the window, or the summit as the cover crops it
    let cx = W / 2, cy = H / 2;
    if (c.summit) { const f = o.fit(o.lead, W, H); cx = f.x + f.w * 0.42; cy = f.y + f.h * 0.33; }
    const far = Math.max(Math.hypot(cx, cy), Math.hypot(W - cx, cy), Math.hypot(cx, H - cy), Math.hypot(W - cx, H - cy));
    const Rmax = far / Math.cos(Math.PI / c.blades) + 8;
    const t0 = performance.now();
    function open(u) {
      const k = o.clamp((u - 0.12) / 0.78);
      if (!c.steps) return o.easeInOut(k);
      // stop by stop: each click snaps in a fifth of its share, then holds
      const n = c.steps, i = Math.min(n - 1, Math.floor(k * n)), part = k * n - i;
      return (i + o.easeOut(o.clamp(part / 0.22))) / n;
    }
    function frame(now) {
      const u = o.clamp((now - t0) / c.T);
      if (c.blink) blink.style.opacity = u < 0.03 ? 1 : (1 - o.easeOut(o.clamp((u - 0.03) / 0.12))).toFixed(3);
      const e = open(u);
      const r = Rmax * Math.pow(e, 1.6) + 1.5;
      const rot = -c.turn * (1 - e);
      const f = c.steps ? e : o.easeOut(o.clamp((u - 0.2) / 0.6));
      img.style.filter = `blur(${(18 * (1 - f)).toFixed(1)}px) brightness(${(0.8 + 0.2 * f).toFixed(3)})`;
      img.style.transform = `scale(${(1.04 - 0.04 * f).toFixed(4)})`;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = c.fill;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      for (let i = 0; i < c.blades; i++) {
        const a = rot + (i / c.blades) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
        if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
      ctx.closePath(); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      if (e < 0.999) {
        // the edge of each blade, and on paper a soft shade along it so the blades read as layers
        ctx.strokeStyle = c.edge; ctx.lineWidth = c.shade ? 1 : 1.2;
        ctx.beginPath();
        for (let i = 0; i < c.blades; i++) {
          const a = rot + (i / c.blades) * Math.PI * 2 - Math.PI / 2;
          const b = a + Math.PI / c.blades * 1.35;
          ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
          ctx.lineTo(cx + Math.cos(b) * (r + Rmax), cy + Math.sin(b) * (r + Rmax));
        }
        ctx.stroke();
        if (c.shade) {
          ctx.strokeStyle = 'oklch(25% 0.012 60 / 0.10)'; ctx.lineWidth = 6;
          ctx.stroke();
        }
      }
      if (u < 1) requestAnimationFrame(frame); else o.done(stage, 100);
    }
    requestAnimationFrame(frame);
  });
};

/* Pane. The photograph was taken through a car window, so the first thing seen is the window:
   fogged glass, a fine grain of mist, drops standing on it, a slant of glare, a breath clouding
   it a little more. Then one hand wipes it in two strokes, an arc out and an arc back, pivoting
   from the elbow below the glass. The strokes leave beads along their edges and thin streaks
   inside, the drops go with the hand, and what is left of the mist lifts off at once. Behind the
   glass the photograph was there all along, and it is simply the page's cover.
   No words, nothing drawn on the photograph; no refraction, nothing bends. About 3.7 seconds. */
window.Openings.pane = function (o) {
  'use strict';
  const stage = o.stage('paper');
  o.style(`
    .op-pa .glass { position: absolute; inset: 0; opacity: 0; will-change: opacity; }
    .op-pa img { position: absolute; inset: 0; width: 100%; height: 100%; max-width: none; object-fit: cover; }
    .op-pa canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
    .op-pa .breath { position: absolute; left: 50%; top: 58%; width: 130vmax; height: 130vmax; margin: -65vmax 0 0 -65vmax;
      background: radial-gradient(closest-side, oklch(97.5% 0.008 85 / 0.8), oklch(97.5% 0.008 85 / 0.38) 46%, oklch(97.5% 0.008 85 / 0) 100%);
      opacity: 0; will-change: opacity, transform; pointer-events: none; }
  `);
  stage.classList.add('op-pa');

  const W = innerWidth, H = innerHeight;
  const dpr = Math.min(2, devicePixelRatio || 1);
  const glass = document.createElement('div'); glass.className = 'glass';
  const img = new Image(); img.alt = ''; img.src = o.src(o.lead);
  const cv = document.createElement('canvas');
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  const breath = document.createElement('div'); breath.className = 'breath';
  glass.append(img, cv, breath);
  stage.appendChild(glass);
  const ctx = cv.getContext('2d');

  // a fixed shuffle, so the glass is the same glass every time
  let seed = 11;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const MIST = (a) => `rgba(243,239,231,${a})`;
  const TAU = Math.PI * 2;

  // the timeline, in milliseconds
  const IN = 600;                          // the fogged glass arrives on the paper
  const B0 = 500, B1 = 1800;               // a breath clouds it, then settles
  const EV0 = 3080, EV1 = 3600;            // what mist is left lifts off
  const END = EV1;

  // a drop on clear glass: a faint body, a darker lower rim, a point of light
  function sprite(r) {
    const m = r + 2, S = Math.ceil(m * 2 * dpr);
    const c = document.createElement('canvas'); c.width = c.height = S;
    const g = c.getContext('2d'); g.scale(dpr, dpr);
    g.fillStyle = 'rgba(255,255,255,0.12)';
    g.beginPath(); g.ellipse(m, m, r, r * 0.92, 0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(38,34,30,0.34)'; g.lineWidth = Math.max(0.7, r * 0.3);
    g.beginPath(); g.ellipse(m, m, r * 0.88, r * 0.82, 0, 0.12 * Math.PI, 0.88 * Math.PI); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.82)';
    g.beginPath(); g.arc(m - r * 0.32, m - r * 0.36, Math.max(0.5, r * 0.22), 0, TAU); g.fill();
    return { c, m };
  }
  const sprites = [1.4, 2, 2.8, 3.8].map(sprite);
  const pickSprite = () => sprites[Math.min(3, Math.floor(Math.pow(rnd(), 2.2) * 4))];

  // the mist on the glass, made once: the photograph soft as through wet glass, a pale warm
  // wash, a slant of glare, a fine grain of condensation and drops standing in it
  function makeFog(photo) {
    const fog = document.createElement('canvas'); fog.width = cv.width; fog.height = cv.height;
    const g = fog.getContext('2d'); g.scale(dpr, dpr);
    const f = o.fit(o.lead, W, H);
    if (typeof g.filter === 'string') {
      const k = 1.08;   // drawn a little larger, so the blur never pulls in the empty edge
      g.filter = `blur(${Math.round(Math.min(W, H) / 38)}px) saturate(0.82)`;
      g.drawImage(photo, f.x - f.w * (k - 1) / 2, f.y - f.h * (k - 1) / 2, f.w * k, f.h * k);
      g.filter = 'none';
    } else {
      // no canvas filter: the photograph drawn tiny and brought back up in two steps
      const a = document.createElement('canvas'); a.width = Math.max(8, Math.round(W / 24)); a.height = Math.max(8, Math.round(H / 24));
      const ag = a.getContext('2d'); ag.imageSmoothingQuality = 'high';
      ag.drawImage(photo, f.x / 24, f.y / 24, f.w / 24, f.h / 24);
      const b = document.createElement('canvas'); b.width = Math.max(16, Math.round(W / 6)); b.height = Math.max(16, Math.round(H / 6));
      const bg = b.getContext('2d'); bg.imageSmoothingQuality = 'high';
      bg.drawImage(a, 0, 0, b.width, b.height);
      g.imageSmoothingQuality = 'high';
      g.drawImage(b, 0, 0, W, H);
    }
    let gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, MIST(0.42)); gr.addColorStop(1, MIST(0.58));
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    gr = g.createLinearGradient(W * 0.1, 0, W * 0.7, H);
    gr.addColorStop(0, 'rgba(255,253,248,0)'); gr.addColorStop(0.36, 'rgba(255,253,248,0)');
    gr.addColorStop(0.46, 'rgba(255,253,248,0.2)'); gr.addColorStop(0.5, 'rgba(255,253,248,0.08)');
    gr.addColorStop(0.55, 'rgba(255,253,248,0.14)'); gr.addColorStop(0.64, 'rgba(255,253,248,0)');
    gr.addColorStop(1, 'rgba(255,253,248,0)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // grain: two batches, light and dark
    const grains = Math.round(W * H / 85);
    const light = new Path2D(), dark = new Path2D();
    for (let i = 0; i < grains; i++) {
      const s = 0.5 + rnd() * 1.1;
      (rnd() < 0.62 ? light : dark).rect(rnd() * W, rnd() * H, s, s);
    }
    g.fillStyle = 'rgba(255,255,255,0.2)'; g.fill(light);
    g.fillStyle = 'rgba(58,52,46,0.07)'; g.fill(dark);
    // drops: clear water, so the mist is gone inside each; most small, a few heavy
    const drops = Math.round(W * H / 4600);
    for (let i = 0; i < drops; i++) {
      const x = rnd() * W, y = rnd() * H, r = 1.1 + Math.pow(rnd(), 3) * 9, ry = r * (0.86 + rnd() * 0.18);
      g.globalCompositeOperation = 'destination-out';
      g.fillStyle = `rgba(0,0,0,${(0.55 + rnd() * 0.3).toFixed(2)})`;
      g.beginPath(); g.ellipse(x, y, r, ry, 0, 0, TAU); g.fill();
      g.globalCompositeOperation = 'source-over';
      g.strokeStyle = 'rgba(38,34,30,0.26)'; g.lineWidth = Math.max(0.6, r * 0.24);
      g.beginPath(); g.ellipse(x, y, r * 0.9, ry * 0.88, 0, 0.12 * Math.PI, 0.88 * Math.PI); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.74)';
      g.beginPath(); g.arc(x - r * 0.32, y - ry * 0.38, Math.max(0.45, r * 0.2), 0, TAU); g.fill();
    }
    return fog;
  }

  // the hand: two arcs pivoting from an elbow below the window, out across the upper glass and
  // back across the lower. Angles are measured from straight up around the pivot.
  const cx = W * 0.5, cy = H * 1.5;
  const P = (a, r) => [cx + r * Math.sin(a), cy - r * Math.cos(a)];
  const wave = () => {
    const p = [rnd() * TAU, rnd() * TAU, rnd() * TAU];
    return (s) => 4.2 * Math.sin(s / 41 + p[0]) + 2.6 * Math.sin(s / 17 + p[1]) + 1.4 * Math.sin(s / 7 + p[2]);
  };
  const bands = [
    { r0: cy - H * 0.30, w: H * 0.5, dir: 1, t0: 1950, T: 650, bow: H * 0.035 },
    { r0: cy - H * 0.72, w: H * 0.5, dir: -1, t0: 2640, T: 600, bow: H * 0.02 },
  ].map((b) => {
    const rin = b.r0 - b.w / 2, hw = W / 2 + 40;
    b.A = rin > hw ? Math.asin(hw / rin) : 1.3;
    const ext = b.A + (b.w * 0.3) / Math.max(rin, 1);
    b.a0 = -b.dir * ext; b.a1 = b.dir * ext;
    b.no = wave(); b.ni = wave();
    b.rc = (a) => b.r0 + b.bow * Math.cos(o.clamp(Math.abs(a) / ext) * Math.PI / 2);
    b.rx = b.w / 2; b.ry = b.w * 0.22;    // the rounded front of the hand
    // streaks the hand leaves behind it
    b.streaks = [];
    const ns = 12 + Math.floor(rnd() * 6);
    for (let i = 0; i < ns; i++) b.streaks.push({
      off: (rnd() - 0.5) * 0.9, lw: 0.7 + Math.pow(rnd(), 2) * 2.8, al: 0.1 + rnd() * 0.3,
      s0: rnd() * 0.45, s1: 0.55 + rnd() * 0.45, ph: rnd() * TAU,
    });
    // beads gathered along both edges of the stroke, where they fall on the window
    b.beads = [];
    [1, -1].forEach((side) => {
      for (let a = -ext; a <= ext;) {
        const edge = b.rc(a) + side * (b.w / 2 + (side > 0 ? b.no(a * b.r0) : b.ni(a * b.r0)));
        const r = edge + side * (1 + rnd() * 5);
        const [x, y] = P(a, r);
        if (x > -12 && x < W + 12 && y > -12 && y < H + 12) b.beads.push({ a, x, y, s: pickSprite() });
        a += (6 + rnd() * 9) / Math.max(edge, 40);
      }
    });
    // beads pushed along in front of the hand, which leave with it
    b.front = [];
    for (let i = 0; i < 22; i++) b.front.push({ d: -b.w / 2 + b.w * (i + rnd()) / 22, j: rnd() * 5, s: pickSprite() });
    return b;
  });

  function sweepPath(b, a1, grow) {
    const n = Math.max(2, Math.ceil(Math.abs(a1 - b.a0) * b.r0 / 12));
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = b.a0 + (a1 - b.a0) * i / n;
      const p = P(a, b.rc(a) + b.w / 2 + b.no(a * b.r0) + grow);
      if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]);
    }
    for (let i = n; i >= 0; i--) {
      const a = b.a0 + (a1 - b.a0) * i / n;
      const p = P(a, b.rc(a) - b.w / 2 - b.ni(a * b.r0) - grow);
      ctx.lineTo(p[0], p[1]);
    }
    ctx.closePath();
  }
  function capPath(b, a1, grow) {
    const p = P(a1, b.rc(a1));
    ctx.beginPath(); ctx.ellipse(p[0], p[1], b.rx + grow, b.ry + grow, a1 - Math.PI / 2, 0, TAU);
  }

  function wipe(b, k) {
    const a1 = b.a0 + (b.a1 - b.a0) * k;
    // the cleared glass: a soft outer edge first, then the stroke itself
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    sweepPath(b, a1, 12); ctx.fill();
    if (k < 1) { capPath(b, a1, 12); ctx.fill(); }
    ctx.fillStyle = 'rgba(0,0,0,1)';
    sweepPath(b, a1, 0); ctx.fill();
    if (k < 1) { capPath(b, a1, 0); ctx.fill(); }
    ctx.globalCompositeOperation = 'source-over';
    // streaks left in the stroke's wake
    ctx.lineCap = 'round';
    b.streaks.forEach((s) => {
      const e = Math.min(s.s1, k);
      if (e <= s.s0) return;
      const sa = b.a0 + (b.a1 - b.a0) * s.s0, ea = b.a0 + (b.a1 - b.a0) * e;
      const n = Math.max(2, Math.ceil(Math.abs(ea - sa) * b.r0 / 16));
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const a = sa + (ea - sa) * i / n;
        const p = P(a, b.rc(a) + s.off * b.w + 1.6 * Math.sin(a * b.r0 / 90 + s.ph));
        if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]);
      }
      ctx.strokeStyle = MIST(s.al); ctx.lineWidth = s.lw; ctx.stroke();
    });
    // beads along the edges, as far as the hand has gone
    b.beads.forEach((d) => {
      if (b.dir > 0 ? d.a > a1 : d.a < a1) return;
      ctx.drawImage(d.s.c, d.x - d.s.m, d.y - d.s.m, d.s.m * 2, d.s.m * 2);
    });
    // and the beads riding in front of it
    if (k < 1) {
      const ca = Math.cos(a1), sa = Math.sin(a1);
      b.front.forEach((d) => {
        const base = P(a1, b.rc(a1) + d.d);
        const t = b.dir * (b.ry * Math.sqrt(Math.max(0, 1 - (d.d / b.rx) * (d.d / b.rx))) + 2 + d.j);
        const x = base[0] + ca * t, y = base[1] + sa * t;
        ctx.drawImage(d.s.c, x - d.s.m, y - d.s.m, d.s.m * 2, d.s.m * 2);
      });
    }
  }

  Promise.all([o.load(img.src), o.ready]).then(([photo]) => {
    if (!photo || !photo.naturalWidth) { o.done(stage, 0); return; }
    const fog = makeFog(photo);
    const go = () => {
      const t0 = performance.now();
      function frame(now) {
        const t = now - t0;
        glass.style.opacity = o.easeOut(o.clamp(t / IN)).toFixed(3);
        // the breath
        const p = o.clamp((t - B0) / (B1 - B0));
        const up = o.easeOut(o.clamp(p / 0.4)), down = 1 - o.easeInOut(o.clamp((p - 0.4) / 0.6));
        breath.style.opacity = (0.55 * up * down).toFixed(3);
        breath.style.transform = `scale(${(0.72 + 0.42 * o.easeOut(p)).toFixed(4)})`;
        // the glass, and the hand on it
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, cv.width, cv.height);
        ctx.drawImage(fog, 0, 0);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        bands.forEach((b) => {
          const k = o.clamp((t - b.t0) / b.T);
          if (k > 0) wipe(b, o.easeInOut(k));
        });
        cv.style.opacity = (1 - o.easeOut(o.clamp((t - EV0) / (EV1 - EV0)))).toFixed(3);
        if (t < END) requestAnimationFrame(frame);
        else {
          // only the photograph is left, exactly as the cover shows it
          cv.style.opacity = '0'; breath.style.opacity = '0'; glass.style.opacity = '1';
          o.done(stage, 120);
        }
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(go);   // let the made glass reach the screen before the clock starts
  });
};

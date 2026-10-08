/* Register. The photograph comes off the press a hair out of register. It is split once into its
   three single-ink plates (cyan, magenta, yellow): each keeps one channel of the photograph and
   leaves the other two at white, so the three multiplied over a white sheet give back the
   photograph exactly. The proof is laid down with the plates a few pixels apart, so every edge
   carries a thin colour fringe while the picture already reads as his photograph; then the plates
   slide home one after another, each landing on its own beat, until the picture is sharp and true
   and is the page's cover itself.
   Everything is drawn in ONE canvas: a white fill, then the three plates with the 'multiply'
   operation, every frame. The plates are cut on the GPU (the photograph, then 'lighten' with a
   colour that is 0 in the kept channel and 255 in the others), not by a pixel loop, and are a
   little larger than the window (edges extended) so no white sheet shows at the borders.
   Motion is position only (translate and a hair of rotation), one ease, never a filter. */
window.Openings.register = function (o) {
  'use strict';
  const stage = o.stage('paper');
  stage.classList.add('op-rg');
  o.style(`
    .op-rg canvas, .op-rg img { position: absolute; left: 0; top: 0; width: 100%; height: 100%; max-width: none; }
    .op-rg img { object-fit: cover; visibility: hidden; }
    .op-rg img.on { visibility: visible; }
  `);

  const W = innerWidth, H = innerHeight;
  const dpr = Math.min(2, devicePixelRatio || 1);
  const cw = Math.round(W * dpr), ch = Math.round(H * dpr);
  const src = o.src(o.lead);
  const t00 = performance.now();          // when the opening began, for the hand-over time

  // How far out of register each plate starts: a hair, 3 to 6 px on a desktop, 2 to 4 on a phone.
  const k = Math.max(2.5, Math.min(5.4, Math.min(W, H) * 0.0068));
  // yellow, magenta, cyan: the order the plates land (yellow fringes show least, cyan most)
  const inks = [
    { keep: 2, x: 1.10 * k, y: -0.60 * k, r: 0.05 },
    { keep: 1, x: -1.00 * k, y: 0.55 * k, r: -0.07 },
    { keep: 0, x: 0.50 * k, y: 1.15 * k, r: 0.06 },
  ];
  // the margin each plate carries beyond the window, in device pixels: more than the largest
  // offset plus what the rotation swings at the corners
  const M = Math.ceil((1.3 * k + 0.0013 * Math.hypot(W, H) / 2 + 2) * dpr) + 2;
  const keepColour = ['rgb(0,255,255)', 'rgb(255,0,255)', 'rgb(255,255,0)'];

  const canvas = document.createElement('canvas');
  canvas.width = cw; canvas.height = ch;
  const ctx = canvas.getContext('2d');
  const truth = new Image(); truth.alt = ''; truth.decoding = 'sync'; truth.src = src;
  stage.append(canvas, truth);

  // The photograph at the page's own crop, on a sheet M device pixels larger on every side; the
  // edge rows and columns are stretched into the margin so a shifted plate never shows white.
  function cutBase(im, w, h, m, scale) {
    const f = o.fit(o.lead, w / scale, h / scale);
    const b = document.createElement('canvas'); b.width = w + 2 * m; b.height = h + 2 * m;
    const bx = b.getContext('2d');
    bx.imageSmoothingEnabled = true; bx.imageSmoothingQuality = 'high';
    bx.drawImage(im, m + f.x * scale, m + f.y * scale, f.w * scale, f.h * scale);
    if (m > 0) {
      bx.drawImage(b, m, m, 1, h, 0, m, m, h);                 // left
      bx.drawImage(b, m + w - 1, m, 1, h, m + w, m, m, h);     // right
      bx.drawImage(b, 0, m, w + 2 * m, 1, 0, 0, w + 2 * m, m); // top, corners included
      bx.drawImage(b, 0, m + h - 1, w + 2 * m, 1, 0, m + h, w + 2 * m, m); // bottom
    }
    return b;
  }

  // One plate: the base, then 'lighten' with white in the two channels it does not keep.
  function cutPlateGPU(base, keep) {
    const p = document.createElement('canvas'); p.width = base.width; p.height = base.height;
    const px = p.getContext('2d');
    px.drawImage(base, 0, 0);
    px.globalCompositeOperation = 'lighten';
    px.fillStyle = keepColour[keep];
    px.fillRect(0, 0, p.width, p.height);
    return p;
  }

  // The same plate by a pixel loop: exact by construction, used only if the GPU cut fails the check.
  function cutPlateLoop(base, keep) {
    const p = document.createElement('canvas'); p.width = base.width; p.height = base.height;
    const px = p.getContext('2d');
    const d = base.getContext('2d').getImageData(0, 0, p.width, p.height);
    const a = d.data;
    for (let i = 0; i < a.length; i += 4) {
      if (keep !== 0) a[i] = 255;
      if (keep !== 1) a[i + 1] = 255;
      if (keep !== 2) a[i + 2] = 255;
      a[i + 3] = 255;
    }
    px.putImageData(d, 0, 0);
    return p;
  }

  // Lay the plates on a white sheet, multiplied, at the given offsets (null = in register).
  function compose(c, w, h, plates, m, at) {
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = 'source-over';
    c.fillStyle = '#fff';
    c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = 'multiply';
    plates.forEach((p, i) => {
      const s = at && at[i];
      if (!s || (s.x === 0 && s.y === 0 && s.r === 0)) { c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(p, -m, -m); return; }
      const rad = s.r * Math.PI / 180, cs = Math.cos(rad), sn = Math.sin(rad);
      const cx = w / 2 + s.x * dpr, cy = h / 2 + s.y * dpr;
      c.setTransform(cs, sn, -sn, cs, cx, cy);
      c.drawImage(p, -w / 2 - m, -h / 2 - m);
    });
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = 'source-over';
  }

  // Check, on a small copy, that the three plates in register multiply back to the photograph
  // pixel for pixel; returns the cutter that passes.
  function chooseCutter(im) {
    const w = 64, h = Math.max(8, Math.round(64 * H / W));
    const base = cutBase(im, w, h, 0, w / W);
    const want = base.getContext('2d').getImageData(0, 0, w, h).data;
    const test = (cut) => {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const cx = c.getContext('2d');
      compose(cx, w, h, inks.map((ink) => cut(base, ink.keep)), 0, null);
      const got = cx.getImageData(0, 0, w, h).data;
      let worst = 0;
      for (let i = 0; i < got.length; i += 4) {
        worst = Math.max(worst, Math.abs(got[i] - want[i]), Math.abs(got[i + 1] - want[i + 1]), Math.abs(got[i + 2] - want[i + 2]));
      }
      return worst;
    };
    try {
      if (test(cutPlateGPU) <= 1) return cutPlateGPU;
      if (test(cutPlateLoop) <= 1) return cutPlateLoop;
    } catch (e) { /* unreadable photograph: no plates */ }
    return null;
  }

  Promise.all([o.load(src), o.ready]).then(([im]) => {
    const cut = ctx && chooseCutter(im);
    const ready = truth.decode ? truth.decode().catch(() => {}) : Promise.resolve();
    if (!cut) { ready.then(() => { truth.classList.add('on'); o.done(stage, 600); }); return; }
    const base = cutBase(im, cw, ch, M, dpr);
    const plates = inks.map((ink) => cut(base, ink.keep));
    ready.then(() => run(base, plates));
  });

  function run(base, plates) {
    // The run of the press, in ms from the proof coming down: each plate lands on its own beat,
    // the first while the proof is still the first impression. One ease for every move.
    const LAND = [250, 820, 1420], MOVE = 380;
    const END = LAND[2] + MOVE;            // in register at 1.8 s
    const HANDOVER = 3000;                 // the page's top bar comes in, 3 s after the opening began
    const at = inks.map((ink) => ({ x: ink.x, y: ink.y, r: ink.r }));

    const t0 = performance.now();
    function frame(now) {
      const t = now - t0;
      inks.forEach((ink, i) => {
        const q = 1 - o.easeOut(o.clamp((t - LAND[i]) / MOVE));
        at[i].x = ink.x * q; at[i].y = ink.y * q; at[i].r = ink.r * q;
        if (q === 0) { at[i].x = 0; at[i].y = 0; at[i].r = 0; }
      });
      if (t < END) { compose(ctx, cw, ch, plates, M, at); requestAnimationFrame(frame); return; }
      // In register: the plates multiply back to the photograph (checked pixel for pixel before
      // the run), so the true print takes their place without a visible change.
      compose(ctx, cw, ch, plates, M, null);
      truth.classList.add('on');
      o.done(stage, Math.max(300, HANDOVER - (performance.now() - t00)));
    }
    compose(ctx, cw, ch, plates, M, at);   // the proof, out of register, at once
    requestAnimationFrame(frame);
  }
};

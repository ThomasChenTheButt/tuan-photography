/* Pixels. The picture is read off the sensor. The window is the dark of a camera before the
   exposure; on the beat of a motor drive the photograph arrives as its own photosites: square
   cells fourteen across, each the true average of the pixels it stands for, each under the faint
   red, green or blue of the sensor's colour filter (the Bayer pattern), with the fine dark grid
   between them. On every following beat, at the same even cadence, the cells halve and the
   filter's tint and the grid thin, until the last beat is the demosaiced photograph itself.
   Every change is a hard cut on an equal beat: no blur, no crossfade, no eased scale.
   One canvas with image smoothing off draws a tiny copy of the cover's own crop at full size;
   the last beat hides the canvas and shows the photograph itself, in the cover's box. */
window.Openings.pixels = function (o) {
  'use strict';
  const stage = o.stage('');            // the dark of the camera, before the exposure
  o.style(`
    .op-px canvas, .op-px img { position: absolute; display: block; }
    .op-px img { object-fit: cover; max-width: none; visibility: hidden; }
    .op-px canvas { image-rendering: pixelated; visibility: hidden; }
    .op-px .on { visibility: visible; }
  `);
  stage.classList.add('op-px');
  const cv = document.createElement('canvas');
  const pic = new Image(); pic.alt = ''; pic.decoding = 'sync';
  stage.append(cv, pic);

  // the cover's own box, so the end is the page's cover exactly
  const r = o.cover.getBoundingClientRect();
  const W = Math.max(1, Math.round(r.width)), H = Math.max(1, Math.round(r.height));
  [cv, pic].forEach((el) => {
    el.style.left = r.left + 'px'; el.style.top = r.top + 'px';
    el.style.width = W + 'px'; el.style.height = H + 'px';
  });

  // one even cadence for everything: a motor drive at about three and a half frames a second
  const BEAT = 280;
  const DARK = 2;                       // two beats of the dark sensor, then the readout
  // the photosites: columns, each step twice the last; rows keep the cells square
  const COLS = [14, 28, 56, 112, 224];
  const rows0 = Math.max(2, Math.round(COLS[0] * H / W));
  // the colour filter's strength and the grid's darkness on each step, thinning to nothing
  const TINT = [0.30, 0.21, 0.13, 0.07, 0.03];
  const GRID = [0.55, 0.40, 0.26, 0.12, 0.0];

  const box = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  // shrink by halving so every cell is the average of the pixels it stands for
  function shrink(src, w, h) {
    let cur = src, cw = src.width, ch = src.height;
    while (cw / 2 >= w && ch / 2 >= h) {
      const nw = Math.max(w, Math.round(cw / 2)), nh = Math.max(h, Math.round(ch / 2));
      const c = box(nw, nh), x = c.getContext('2d');
      x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
      x.drawImage(cur, 0, 0, nw, nh);
      cur = c; cw = nw; ch = nh;
    }
    const c = box(w, h), x = c.getContext('2d');
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    x.drawImage(cur, 0, 0, w, h);
    return c;
  }
  // put each cell under its filter: R G / G B, repeating, as on the sensor
  function bayer(c, a) {
    const x = c.getContext('2d');
    let d;
    try { d = x.getImageData(0, 0, c.width, c.height); } catch (e) { return c; }
    const p = d.data, lift = 1 / (1 - a * 0.5);
    for (let y = 0; y < c.height; y++) {
      for (let i = 0; i < c.width; i++) {
        const k = (y * c.width + i) * 4;
        const f = (y & 1) ? ((i & 1) ? 2 : 1) : ((i & 1) ? 1 : 0);   // 0 red, 1 green, 2 blue
        for (let ch = 0; ch < 3; ch++) {
          const v = p[k + ch] * (ch === f ? 1 : 1 - a) * lift;
          p[k + ch] = v > 255 ? 255 : v;
        }
      }
    }
    x.putImageData(d, 0, 0);
    return c;
  }

  const src = (o.img.currentSrc || o.img.src) || o.src(o.lead);
  pic.src = src;
  const decoded = o.load(src).then((im) => (pic.decode ? pic.decode().catch(() => {}) : null).then(() => im));
  Promise.all([o.ready, decoded]).then(([, im]) => {
    if (!im.naturalWidth) { pic.classList.add('on'); o.done(stage, 300); return; }
    // the window's crop of the photograph, as object-fit cover shows it
    const f = o.fit({ w: im.naturalWidth, h: im.naturalHeight }, W, H);
    const sx = -f.x / f.s, sy = -f.y / f.s, sw = W / f.s, sh = H / f.s;
    const top = COLS.length - 1, mul = (i) => COLS[i] / COLS[0];
    const bw = COLS[top] * 4, bh = rows0 * mul(top) * 4;
    const crop = box(bw, bh);
    const cx = crop.getContext('2d');
    cx.imageSmoothingEnabled = true; cx.imageSmoothingQuality = 'high';
    cx.drawImage(im, sx, sy, sw, sh, 0, 0, bw, bh);
    // the pyramid, finest first, so each coarser level averages the one above it;
    // the filter goes on a copy, so the averages stay true
    const levels = [];
    let from = crop;
    for (let i = top; i >= 0; i--) {
      from = shrink(from, COLS[i], rows0 * mul(i));
      const t = box(from.width, from.height);
      t.getContext('2d').drawImage(from, 0, 0);
      levels[i] = bayer(t, TINT[i]);
    }

    const dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const ctx = cv.getContext('2d');
    const draw = (i) => {
      const L = levels[i];
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(L, 0, 0, cv.width, cv.height);
      if (!GRID[i]) return;
      // the fine dark grid between photosites
      const cw = cv.width / L.width, chh = cv.height / L.height;
      const g = Math.max(1, Math.round(Math.min(cw, chh) * 0.05));
      ctx.fillStyle = 'rgba(8, 6, 4, ' + GRID[i] + ')';
      for (let k = 1; k < L.width; k++) ctx.fillRect(Math.round(k * cw) - (g >> 1), 0, g, cv.height);
      for (let k = 1; k < L.height; k++) ctx.fillRect(0, Math.round(k * chh) - (g >> 1), cv.width, g);
    };

    // every change lands on the same beat, counted from one start, so the cadence never drifts
    const t0 = performance.now();
    const at = (n, fn) => setTimeout(fn, Math.max(0, t0 + n * BEAT - performance.now()));
    COLS.forEach((_, i) => at(DARK + i, () => { draw(i); cv.classList.add('on'); }));
    at(DARK + COLS.length, () => {
      // the last beat: the photograph itself, sharp, in the cover's box
      pic.classList.add('on');
      cv.classList.remove('on');
      o.done(stage, 1600);
    });
  });
};

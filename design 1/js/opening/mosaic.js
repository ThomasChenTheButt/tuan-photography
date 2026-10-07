/* Mosaic. One photograph fills the window. It pulls back and is one tile among all the
   photographs he has made, which together form the opening one; then the mosaic becomes the
   photograph itself. Thesis: the body of work is in every picture. */
window.Openings.mosaic = function (o) {
  'use strict';
  const stage = o.stage();
  const cv = document.createElement('canvas');
  cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
  stage.appendChild(cv);
  const W = innerWidth, H = innerHeight;
  const dpr = Math.min(2, devicePixelRatio || 1);
  cv.width = W * dpr; cv.height = H * dpr;
  const ctx = cv.getContext('2d');

  const cols = W > 900 ? 44 : W > 600 ? 30 : 18;
  const cell = W / cols, rows = Math.ceil(H / cell);
  const S0 = Math.max(W, H) / cell * 1.02;          // the first tile fills the window
  const T = 6400, Z0 = 0.06, Z1 = 0.74;              // when the pull-back runs, as fractions of the whole

  const cover = (im, x, y, w, h) => {                // drawImage with an object-fit: cover crop
    const s = Math.max(w / im.naturalWidth, h / im.naturalHeight);
    const sw = w / s, sh = h / s;
    ctx.drawImage(im, (im.naturalWidth - sw) / 2, (im.naturalHeight - sh) / 2, sw, sh, x, y, w, h);
  };
  const avg = (im) => {                              // a photograph's average colour
    const c = document.createElement('canvas'); c.width = c.height = 1;
    const x = c.getContext('2d'); x.drawImage(im, 0, 0, 1, 1);
    return x.getImageData(0, 0, 1, 1).data;
  };

  Promise.all([o.load(o.src(o.lead))].concat(o.others.map((p) => o.load(o.src(p, 640))))).then((ims) => {
    const lead = ims[0], tiles = ims.slice(1).filter((im) => im.naturalWidth);
    const cols3 = tiles.map(avg);
    // the opening photograph, as the window will show it, reduced to the grid: one colour a cell
    const small = document.createElement('canvas'); small.width = cols; small.height = rows;
    const sx = small.getContext('2d');
    const f = o.fit({ w: lead.naturalWidth, h: lead.naturalHeight }, cols, rows);
    sx.drawImage(lead, f.x, f.y, f.w, f.h);
    const want = sx.getImageData(0, 0, cols, rows).data;
    // each cell takes one of the four photographs nearest its colour, so neighbours differ
    const pick = new Array(cols * rows);
    for (let i = 0; i < cols * rows; i++) {
      const r = want[i * 4], g = want[i * 4 + 1], b = want[i * 4 + 2];
      const near = cols3.map((c, k) => [(c[0] - r) ** 2 + (c[1] - g) ** 2 + (c[2] - b) ** 2, k]).sort((a, c) => a[0] - c[0]);
      pick[i] = near[(i * 7 + Math.floor(i / cols) * 3) % 4][1];
    }
    // the whole mosaic once, tinted toward the photograph it forms
    const M = document.createElement('canvas'); M.width = Math.round(cols * cell * dpr); M.height = Math.round(rows * cell * dpr);
    const mx = M.getContext('2d'); mx.scale(dpr, dpr);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const i = y * cols + x, im = tiles[pick[i]];
      const s = Math.max(cell / im.naturalWidth, cell / im.naturalHeight);
      mx.drawImage(im, (im.naturalWidth - cell / s) / 2, (im.naturalHeight - cell / s) / 2, cell / s, cell / s, x * cell, y * cell, cell + 0.5, cell + 0.5);
      mx.fillStyle = `rgba(${want[i * 4]},${want[i * 4 + 1]},${want[i * 4 + 2]},0.46)`;
      mx.fillRect(x * cell, y * cell, cell + 0.5, cell + 0.5);
    }
    const tx = Math.floor(cols * 0.5), ty = Math.floor(rows * 0.46);   // the tile we start inside
    const fx = (tx + 0.5) * cell, fy = (ty + 0.5) * cell;

    const t0 = performance.now();
    function frame(now) {
      const u = o.clamp((now - t0) / T);
      const e = o.easeInOut(o.clamp((u - Z0) / (Z1 - Z0)));
      const s = Math.pow(S0, 1 - e);
      const ox = (W / 2 - s * fx) * (1 - e), oy = (H / 2 - s * fy) * (1 - e);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * ox, dpr * oy);
      ctx.drawImage(M, 0, 0, cols * cell, rows * cell);
      // the tiles still large on screen are drawn from their own photographs, sharp
      if (s * cell > 110) {
        const x0 = Math.max(0, Math.floor(-ox / s / cell)), x1 = Math.min(cols - 1, Math.ceil((W - ox) / s / cell));
        const y0 = Math.max(0, Math.floor(-oy / s / cell)), y1 = Math.min(rows - 1, Math.ceil((H - oy) / s / cell));
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
          const i = y * cols + x;
          cover(tiles[pick[i]], x * cell, y * cell, cell + 0.5, cell + 0.5);
          ctx.fillStyle = `rgba(${want[i * 4]},${want[i * 4 + 1]},${want[i * 4 + 2]},${(0.46 * Math.min(1, (S0 / s - 1) / 6)).toFixed(3)})`;
          ctx.fillRect(x * cell, y * cell, cell + 0.5, cell + 0.5);
        }
      }
      // then the mosaic becomes the photograph
      const k = o.easeInOut(o.clamp((u - Z1) / (1 - Z1)));
      if (k > 0) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.globalAlpha = k;
        const g = o.fit({ w: lead.naturalWidth, h: lead.naturalHeight }, W, H);
        ctx.drawImage(lead, g.x, g.y, g.w, g.h);
        ctx.globalAlpha = 1;
      }
      if (u < 1) requestAnimationFrame(frame); else o.done(stage, 100);
    }
    requestAnimationFrame(frame);
  });
};

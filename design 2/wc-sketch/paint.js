/* tuan photography 陳亮元 · design 2 · "Pen and wash": the painter.
   A travel sketchbook map, made the urban sketcher's way: the drawing comes first in fine-liner
   (coasts, borders, and the mountains hatched where the relief falls away from the light), then
   loose, light washes go over it, each laid by a quick hand a few pixels off its line: a pale
   cerulean along the coasts that dries out to bare paper offshore, yellow ochre let into sap
   green on the land, and one warm vermilion over the sixteen countries travelled. White paper
   sparkles through wherever the brush skipped. Painted into offscreen canvases, one per zoom
   band and region, so the map only has to place a finished painting while it pans. */
(() => {
  'use strict';
  const WC = (window.WC = window.WC || {});

  /* ------------------------------------------------------------ noise */

  function rng(seed) {
    let a = seed | 0;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // tileable value-noise fbm on an N by N grid, normalised to 0..1
  function fbm(N, cells, octaves, seed, gain = 0.5) {
    const out = new Float32Array(N * N);
    const r = rng(seed);
    let amp = 1;
    for (let o = 0; o < octaves && cells <= N; o++, cells *= 2, amp *= gain) {
      const g = new Float32Array(cells * cells);
      for (let i = 0; i < g.length; i++) g[i] = r();
      const step = N / cells;
      for (let y = 0; y < N; y++) {
        const fy = y / step, y0 = fy | 0, ty = fy - y0, sy = ty * ty * (3 - 2 * ty), y1 = (y0 + 1) % cells;
        const r0 = y0 * cells, r1 = y1 * cells;
        for (let x = 0; x < N; x++) {
          const fx = x / step, x0 = fx | 0, tx = fx - x0, sx = tx * tx * (3 - 2 * tx), x1 = (x0 + 1) % cells;
          const a = g[r0 + x0], b = g[r0 + x1], c = g[r1 + x0], d = g[r1 + x1];
          const top = a + (b - a) * sx, bot = c + (d - c) * sx;
          out[y * N + x] += amp * (top + (bot - top) * sy);
        }
      }
    }
    let mn = Infinity, mx = -Infinity;
    for (let i = 0; i < out.length; i++) { const v = out[i]; if (v < mn) mn = v; if (v > mx) mx = v; }
    const k = 1 / (mx - mn || 1);
    for (let i = 0; i < out.length; i++) out[i] = (out[i] - mn) * k;
    return out;
  }

  const N = 512;
  let NL = null, NM = null, NH = null;
  function ensureNoise() {
    if (NL) return;
    NL = fbm(N, 4, 4, 11, 0.55);   // blotches: the wash lying heavier here, lighter there
    NM = fbm(N, 16, 3, 23, 0.5);   // the wandering of wash edges
    const a = fbm(N, 128, 2, 37, 0.6), b = rng(41);
    NH = new Float32Array(N * N);  // granulation: pigment settling into the grain, in clumps
    for (let i = 0; i < NH.length; i++) NH[i] = a[i] * 0.7 + b() * 0.3;
  }
  WC.noise = () => { ensureNoise(); return { NL, NM, NH, N }; };

  /* ------------------------------------------------------------ the paper's cold-press tooth */

  // a tile of embossed grain, grey around the middle: laid over the map in soft light
  WC.toothTile = (px = 384) => {
    const h = new Float32Array(px * px);
    const a = fbm(px, 48, 3, 5, 0.55), b = fbm(px, 128, 2, 9, 0.5);
    for (let i = 0; i < h.length; i++) h[i] = a[i] * 0.65 + b[i] * 0.35;
    const c = document.createElement('canvas');
    c.width = c.height = px;
    const g = c.getContext('2d');
    const id = g.createImageData(px, px);
    const at = (x, y) => h[((y + px) % px) * px + ((x + px) % px)];
    const r = rng(77);
    for (let y = 0; y < px; y++) {
      for (let x = 0; x < px; x++) {
        // light from the upper left
        const e = (at(x - 1, y - 1) - at(x + 1, y + 1)) * 6.5 + (at(x, y) - 0.5) * 0.35 + (r() - 0.5) * 0.06;
        const v = Math.max(0, Math.min(255, 128 + e * 128));
        const i = (y * px + x) * 4;
        id.data[i] = v; id.data[i + 1] = v; id.data[i + 2] = v; id.data[i + 3] = 255;
      }
    }
    g.putImageData(id, 0, 0);
    return c;
  };

  /* ------------------------------------------------------------ the palette, as transmittance of paper */

  // pale washes over a fine-liner drawing: a cerulean that hugs the coasts, yellow ochre and sap
  // green on the land, and one warm colour for the sixteen countries travelled
  const PAPER = [251, 250, 245];
  const SEA = [0.6, 0.81, 0.93];      // cerulean, let down
  const OCHRE = [0.97, 0.88, 0.66];   // yellow ochre
  const GREEN = [0.8, 0.89, 0.66];    // sap green
  const POLAR = [0.9, 0.93, 0.96];    // a grey-blue breath for the ice
  const WARM = [0.98, 0.66, 0.57];    // vermilion, toward rose, let down
  const INK = [38, 34, 33];           // the fine-liner
  WC.PAPER = PAPER;
  WC.INK = INK;
  WC.colours = { SEA, OCHRE, GREEN, WARM };
  const ink = (a) => `rgba(${INK[0]}, ${INK[1]}, ${INK[2]}, ${a})`;
  WC.ink = ink;

  /* ------------------------------------------------------------ a wash tile, for the globe's flat fills */

  // a tile of one wash (or two let into each other), blotched, with white paper sparkle left in it
  WC.washTile = (a, b, strength = 0.55, seed = 3, px = 512) => {
    ensureNoise();
    const c = document.createElement('canvas');
    c.width = c.height = px;
    const g = c.getContext('2d');
    const id = g.createImageData(px, px);
    for (let y = 0; y < px; y++) {
      for (let x = 0; x < px; x++) {
        const k = ((y + seed * 37) & 511) * 512 + ((x + seed * 53) & 511);
        const lo = NL[(((y + seed * 11) & 511) << 9) | ((x + seed * 7) & 511)];
        const m = NM[k], hi = NH[k];
        const mix = Math.min(1, Math.max(0, (lo - 0.32) / 0.36));
        const T = b ? [a[0] + (b[0] - a[0]) * mix, a[1] + (b[1] - a[1]) * mix, a[2] + (b[2] - a[2]) * mix] : a;
        let d = strength * (0.72 + 0.56 * lo) * (1 + (hi - 0.5) * 0.3);
        // sparkle: the brush skipped across the tooth here and there
        const sp = Math.min(1, Math.max(0, (hi - 0.66) / 0.06)) * Math.min(1, Math.max(0, (m - 0.56) / 0.16));
        d *= 1 - sp;
        const i = (y * px + x) * 4;
        // as a colour over paper: alpha carries the strength, the colour is the wash at full
        id.data[i] = Math.round(PAPER[0] * T[0]);
        id.data[i + 1] = Math.round(PAPER[1] * T[1]);
        id.data[i + 2] = Math.round(PAPER[2] * T[2]);
        id.data[i + 3] = Math.round(Math.max(0, Math.min(1, d * 1.6)) * 255);
      }
    }
    g.putImageData(id, 0, 0);
    return c;
  };

  /* ------------------------------------------------------------ lettering, in a steady hand */

  // a name lettered in small capitals: capitals full height, the rest as small capitals, every
  // letter a hair off its neighbour's baseline, as a hand letters; a paper halo keeps it clear of
  // the wash. Rendered once, then placed every frame.
  const meas = document.createElement('canvas').getContext('2d');
  WC.letter = (text, o) => {
    const dpr = o.dpr || 1;
    const zh = !!o.zh;
    const size = o.size;
    const fam = zh ? '"Noto Sans TC", "Alegreya Sans", sans-serif' : '"Alegreya Sans", "Noto Sans TC", sans-serif';
    const r = rng(o.seed || 7);
    const track = zh ? size * 0.2 : size * (o.track == null ? 0.1 : o.track);
    const glyphs = [];
    let x = 0;
    for (const ch of Array.from(text)) {
      let g = ch, s = size;
      if (!zh && o.caps !== false && ch.toUpperCase() !== ch) { g = ch.toUpperCase(); s = size * 0.79; }
      const font = `${o.italic ? 'italic ' : ''}${o.weight || 400} ${s.toFixed(2)}px ${fam}`;
      meas.font = font;
      const w = meas.measureText(g).width;
      glyphs.push({ g, font, x, dy: (r() - 0.5) * size * 0.07, rot: (r() - 0.5) * 0.06 });
      x += w + (ch === ' ' ? size * 0.14 : track);
    }
    const width = Math.max(1, x - track);
    const pad = Math.ceil((o.halo || 3) + 2);
    const W = width + pad * 2, H = size * 1.35 + pad * 2;
    const c = document.createElement('canvas');
    c.width = Math.ceil(W * dpr); c.height = Math.ceil(H * dpr);
    const g = c.getContext('2d');
    g.scale(dpr, dpr);
    const base = pad + size * 0.98;
    g.lineJoin = 'round';
    for (const pass of [0, 1]) {
      for (const q of glyphs) {
        g.save();
        g.translate(pad + q.x, base + q.dy);
        g.rotate(q.rot);
        g.font = q.font;
        if (pass === 0) {
          if (o.halo) { g.strokeStyle = o.haloColour || `rgba(${PAPER[0]}, ${PAPER[1]}, ${PAPER[2]}, 0.92)`; g.lineWidth = o.halo; g.strokeText(q.g, 0, 0); }
        } else { g.fillStyle = o.colour; g.fillText(q.g, 0, 0); }
        g.restore();
      }
    }
    return { c, w: W, h: H, bx: pad, by: base, inkW: width, size };
  };

  /* ------------------------------------------------------------ the pen's pressure along a line */

  // splits a MultiLineString into a few classes of nib pressure that wander slowly along each
  // line, so one stroke of the pen swells and thins as it goes
  WC.pressure = (mesh, n = 5) => {
    const parts = Array.from({ length: n }, () => []);
    let li = 0;
    for (const line of mesh.coordinates) {
      li += 1;
      const ph1 = (li * 2.399) % 6.283, ph2 = (li * 1.13) % 6.283;
      let d = 0, run = null, cls = -1;
      for (let i = 0; i < line.length; i++) {
        if (i > 0) {
          const a = line[i - 1], b = line[i];
          let dl = b[0] - a[0];
          if (dl > 180) dl -= 360; else if (dl < -180) dl += 360;
          d += Math.hypot(dl * Math.cos((b[1] * Math.PI) / 180), b[1] - a[1]);
        }
        const v = 0.5 + 0.3 * Math.sin(d * 0.85 + ph1) + 0.17 * Math.sin(d * 3.3 + ph2);
        const c = Math.max(0, Math.min(n - 1, Math.floor(v * n)));
        if (c !== cls) {
          if (run) { run.push(line[i]); if (run.length > 1) parts[cls].push(run); }
          run = [line[i]]; cls = c;
        } else run.push(line[i]);
      }
      if (run && run.length > 1) parts[cls].push(run);
    }
    return parts.map((coordinates) => ({ type: 'MultiLineString', coordinates }));
  };

  /* ------------------------------------------------------------ painting one texture */


  /*
    job: { r: texture px per degree, u0, v0: world origin of the texture in degrees (u east of the
           map's centre meridian, v = -latitude), w, h: size in px }
    env: { LON0, LAT_N, LAT_S, land(r) -> GeoJSON, travel() -> [GeoJSON], relief(r) -> image|null }
    Resolves to a canvas; rejects with 'cancelled' when job.cancelled turns true.
  */
  const later = () => new Promise((res) => setTimeout(res, 0));
  const ss = (e0, e1, x) => { const t = (x - e0) / (e1 - e0); return t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t); };

  /*
    job: { r: texture px per degree, u0, v0: world origin of the texture in degrees (u east of the
           map's centre meridian, v = -latitude), w, h: size in px }
    env: { LON0, LAT_N, LAT_S, land() -> GeoJSON, travel() -> [GeoJSON], seams() -> mesh, relief(r) -> image|null }
    Resolves to a canvas; rejects with 'cancelled' when job.cancelled turns true.
    The washes are laid first, each a few pixels off the line it belongs to; the pen's hatching
    for the mountains is drawn over them. The coastlines, borders and names are drawn live.
  */
  WC.paint = async (job, env) => {
    ensureNoise();
    const { r, u0, v0, w, h } = job;
    const pad = 40;
    const PW = w + pad * 2, PH = h + pad * 2;
    const t0 = performance.now();

    const proj = d3.geoEquirectangular().rotate([-env.LON0, 0]).precision(0.5)
      .scale((r * 180) / Math.PI)
      .translate([-u0 * r + pad, -v0 * r + pad])
      .clipExtent([[-60, -60], [PW + 60, PH + 60]]);
    const landPath = new Path2D();
    d3.geoPath(proj, landPath)(env.land(r));
    const travelPath = new Path2D();
    const gp = d3.geoPath(proj, travelPath);
    for (const f of env.travel()) gp(f);
    const seamPath = new Path2D();
    if (env.seams) d3.geoPath(proj, seamPath)(env.seams());

    // masks, one to a channel: red the land, barely softened; green the land blurred (the wash's
    // room to wander, and nearness to a coast); blue the countries travelled, softened
    const P = document.createElement('canvas');
    P.width = PW; P.height = PH;
    const pc = P.getContext('2d', { willReadFrequently: true });
    pc.fillStyle = '#000'; pc.fillRect(0, 0, PW, PH);
    pc.globalCompositeOperation = 'lighter';
    pc.filter = 'blur(1.1px)'; pc.fillStyle = '#f00'; pc.fill(landPath);
    pc.filter = 'blur(7px)'; pc.fillStyle = '#0f0'; pc.fill(landPath);
    const T = document.createElement('canvas');
    T.width = PW; T.height = PH;
    const tc = T.getContext('2d');
    tc.fillStyle = '#000'; tc.fillRect(0, 0, PW, PH);
    tc.fillStyle = '#00f'; tc.fill(travelPath);
    tc.strokeStyle = '#000'; tc.lineWidth = 4; tc.lineJoin = 'round'; tc.stroke(seamPath);
    pc.filter = 'blur(2.6px)'; pc.drawImage(T, 0, 0);
    pc.filter = 'none';
    // how far offshore the sea wash reaches: the land blurred wide, at a quarter of the size
    const QW = Math.ceil(PW / 4), QH = Math.ceil(PH / 4);
    const Wc = document.createElement('canvas');
    Wc.width = QW; Wc.height = QH;
    const wcx = Wc.getContext('2d', { willReadFrequently: true });
    wcx.fillStyle = '#000'; wcx.fillRect(0, 0, QW, QH);
    wcx.filter = 'blur(5px)';
    wcx.setTransform(0.25, 0, 0, 0.25, 0, 0);
    wcx.fillStyle = '#fff'; wcx.fill(landPath);
    if (job.cancelled) throw new Error('cancelled');
    await later();

    // relief, laid onto the same frame (neutral grey 206 where the image has nothing to say)
    const Q = document.createElement('canvas');
    Q.width = w; Q.height = h;
    const qc = Q.getContext('2d', { willReadFrequently: true });
    qc.fillStyle = 'rgb(206,206,206)'; qc.fillRect(0, 0, w, h);
    const img = env.relief(r);
    if (img) {
      const iw = img.width, ri = iw / 360;
      qc.imageSmoothingQuality = 'high';
      for (const shift of [-360, 0, 360]) {
        const uL = -180 - env.LON0 + shift;
        const a = Math.max(u0, uL), b = Math.min(u0 + w / r, uL + 360);
        if (b <= a) continue;
        const vT = Math.max(v0, -90), vB = Math.min(v0 + h / r, 90);
        if (vB <= vT) continue;
        qc.drawImage(img, (a - uL) * ri, (vT + 90) * ri, (b - a) * ri, (vB - vT) * ri, (a - u0) * r, (vT - v0) * r, (b - a) * r, (vB - vT) * r);
      }
    }
    const pd = pc.getImageData(0, 0, PW, PH).data;
    const qd = qc.getImageData(0, 0, w, h).data;
    const wd = wcx.getImageData(0, 0, QW, QH).data;
    if (job.cancelled) throw new Error('cancelled');
    await later();

    const out = document.createElement('canvas');
    out.width = w; out.height = h;
    const oc = out.getContext('2d');
    const od = oc.createImageData(w, h);
    const o = od.data;

    // noise is anchored to the world, so neighbouring textures of one band agree
    const OFF = 1 << 22;
    const ox = Math.round(u0 * r) + OFF, oy = Math.round(v0 * r) + OFF;
    const fadeDeg = 1.2;
    const uEdge = new Float32Array(w);
    for (let i = 0; i < w; i++) uEdge[i] = Math.min(1, Math.max(0, (180 - Math.abs(u0 + i / r)) / fadeDeg));
    const [PR, PG, PB] = PAPER;
    const sr = 1 - SEA[0], sg = 1 - SEA[1], sb = 1 - SEA[2];
    const zr = 1 - WARM[0], zg = 1 - WARM[1], zb = 1 - WARM[2];

    let j = 0;
    while (j < h) {
      const tStart = performance.now();
      for (; j < h && performance.now() - tStart < 10; j++) {
        const lat = -(v0 + j / r);
        const alat = Math.abs(lat);
        const polar = ss(58, 70, alat);                 // the land wash cools toward the ice
        const iceFade = 1 - ss(72, 84, alat);           // and fades out before the poles
        const desert = Math.max(ss(10, 19, lat) * (1 - ss(36, 45, lat)), ss(-13, -21, lat) * (1 - ss(-31, -38, lat)));
        const gy = j + oy;
        const rowL = (((gy >> 2) & 511) << 9), rowL2 = ((((gy >> 3) + 211) & 511) << 9), rowM = (((gy >> 1) & 511) << 9), rowM2 = ((((gy >> 1) + 173) & 511) << 9), rowH = ((gy & 511) << 9);
        const pRow = (j + pad) * PW + pad;
        const wRow = ((j + pad) >> 2) * QW;
        for (let i = 0; i < w; i++) {
          const gx = i + ox;
          const lo = NL[rowL | ((gx >> 2) & 511)];
          const lo2 = NL[rowL2 | (((gx >> 3) + 97) & 511)];
          const m1 = NM[rowM | ((gx >> 1) & 511)];
          const m2 = NM[rowM2 | (((gx >> 1) + 91) & 511)];
          const hi = NH[rowH | (gx & 511)];
          const edge = uEdge[i];
          const pp = pRow + i;

          // each wash was laid by a quick hand: its own drift off the pen line, and a wander
          const sdx = (2 + (m1 - 0.5) * 8) | 0, sdy = (1 + (m2 - 0.5) * 8) | 0;
          const ldx = (1 + (m2 - 0.5) * 7) | 0, ldy = (1.5 + (m1 - 0.5) * 6) | 0;
          const tdx = (-1.5 + (m1 - 0.5) * 6) | 0, tdy = (2 + (m2 - 0.5) * 5) | 0;
          const qs = (pp + sdy * PW + sdx) << 2, ql = (pp + ldy * PW + ldx) << 2, qt = (pp + tdy * PW + tdx) << 2;
          const aS = pd[qs] / 255, nS = pd[qs + 1] / 255;
          const aL = pd[ql] / 255, nL = pd[ql + 1] / 255;
          const fT = pd[qt + 2] / 255;
          const wide = wd[(wRow + ((i + pad) >> 2)) << 2] / 255;

          // the brush skipped over the paper's tooth here and there: white sparkle, in clumps
          const spark = ss(0.64, 0.7, hi) * ss(0.5, 0.68, m2);
          const gran = 1 + (hi - 0.5) * 0.3;
          const blot = 0.78 + 0.44 * lo;

          // sea: a pale band laid along the coast, reaching out a little way and drying with a soft edge
          const inner = 1 - ss(0.36, 0.6, aS + (m1 - 0.5) * 0.55);
          const v = wide * 0.95 + nS * 0.45 + ((lo - 0.5) * 0.3 + (hi - 0.5) * 0.05) * ss(0, 0.07, wide + nS);
          const reach = ss(0.1, 0.175, v);
          const near = ss(0.04, 0.8, nS * 0.75 + wide * 0.45);
          const rimS = Math.exp(-Math.pow((v - 0.14) / 0.028, 2)) * 0.2;
          const dS = inner * (reach * (0.14 + 0.52 * near) * blot * gran * (1 - 0.85 * spark) + rimS * (1 - spark)) * edge;

          // land: yellow ochre let into sap green, stopping short of the line or running past it
          const fL = aL * 0.5 + nL * 0.5;
          const thrL = 0.5 + (lo2 - 0.5) * 0.38;
          const lc = ss(thrL - 0.05, thrL + 0.05, fL);
          const rimL = Math.exp(-Math.pow((fL - thrL - 0.06) / 0.045, 2)) * 0.2 * lc;
          let dev = (206 - qd[(j * w + i) << 2]) / 64;
          dev = dev < 0 ? 0 : dev > 1.4 ? 1.4 : dev;
          // the travelled countries: one warmer wash, laid on its own and just as loose
          const thrT = 0.5 + (m2 - 0.5) * 0.4;
          const tcv = ss(thrT - 0.06, thrT + 0.06, fT);
          const rimT = Math.exp(-Math.pow((fT - thrT - 0.07) / 0.05, 2)) * 0.28 * tcv;
          const dT = (tcv * (0.36 + 0.3 * lo) * gran * (1 - spark) + rimT) * edge;

          let dL = (lc * (0.34 + 0.26 * lo + 0.2 * dev) * gran * (1 - spark) + rimL) * iceFade * edge * (1 - 0.82 * tcv);
          if (dL < 0) dL = 0;
          let gf = ss(0.34, 0.7, lo + (m1 - 0.5) * 0.35) * (1 - 0.85 * desert) - dev * 0.35;
          gf = gf < 0 ? 0 : gf > 1 ? 1 : gf;
          let Tr = OCHRE[0] + (GREEN[0] - OCHRE[0]) * gf, Tg = OCHRE[1] + (GREEN[1] - OCHRE[1]) * gf, Tb = OCHRE[2] + (GREEN[2] - OCHRE[2]) * gf;
          Tr += (POLAR[0] - Tr) * polar; Tg += (POLAR[1] - Tg) * polar; Tb += (POLAR[2] - Tb) * polar;

          const k = (j * w + i) << 2;
          o[k] = PR * (1 - dS * sr) * (1 - dL * (1 - Tr)) * (1 - dT * zr);
          o[k + 1] = PG * (1 - dS * sg) * (1 - dL * (1 - Tg)) * (1 - dT * zg);
          o[k + 2] = PB * (1 - dS * sb) * (1 - dL * (1 - Tb)) * (1 - dT * zb);
          o[k + 3] = 255;
        }
      }
      if (job.cancelled) throw new Error('cancelled');
      if (j < h) await later();
    }
    oc.putImageData(od, 0, 0);

    // the mountains, in the pen: parallel hatching on the slopes turned from the light, as a
    // sketcher shades them. Strokes lie on evenly spaced parallel lines; a light slope gets every
    // fourth line, a steeper one every second, the steepest all of them. Each run is broken into
    // short strokes with small gaps, every stroke a hair off true.
    const rnd = rng((Math.round(u0 * 7) * 31 + Math.round(v0 * 13) * 17 + r * 101) | 0);
    const coarse = r <= 8 ? 1 : r <= 12 ? 0.5 : 0;
    const sp = 3.1 + coarse * 0.7;
    const ang = -1.0;
    const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
    const diag = Math.hypot(w, h);
    const cx0 = w / 2, cy0 = h / 2;
    const segs = [];
    const levels = [0.17, 0.62, 0.36, 0.62];
    // the world's lines, so neighbouring paintings of one band hatch alike
    const kOff = Math.round((ox * nx + oy * ny) / sp);
    for (let kk = -Math.ceil(diag / 2 / sp); kk <= Math.ceil(diag / 2 / sp); kk++) {
      const k = kk + kOff;
      const thr = levels[((k % 4) + 4) % 4];
      const offN = kk * sp;
      let run = -1;
      for (let tt = -diag / 2; tt <= diag / 2 + 1; tt += 1) {
        const x = cx0 + nx * offN + dx * tt, y = cy0 + ny * offN + dy * tt;
        let on = false;
        if (x >= 0 && y >= 0 && x < w && y < h) {
          const ix = x | 0, iy = y | 0;
          const lat = -(v0 + iy / r);
          if (Math.abs(lat) < 70) {
            const dev = (206 - qd[(iy * w + ix) << 2]) / 64;
            on = dev > thr && pd[((iy + pad) * PW + ix + pad) << 2] > 200;
          }
        }
        if (on && run < 0) run = tt;
        if ((!on || tt > diag / 2) && run >= 0) {
          // the run, as short strokes
          let a0 = run;
          const end = tt - 1;
          while (a0 < end - 1.2) {
            const L = (5 + rnd() * 6) * (1 + 0.2 * coarse);
            const a1 = Math.min(end, a0 + L);
            const j0 = (rnd() - 0.5) * 0.7, j1 = (rnd() - 0.5) * 0.7;
            segs.push(cx0 + nx * (offN + j0) + dx * a0, cy0 + ny * (offN + j0) + dy * a0, cx0 + nx * (offN + j1) + dx * a1, cy0 + ny * (offN + j1) + dy * a1);
            a0 = a1 + 1.1 + rnd() * 1.4;
          }
          run = -1;
        }
      }
    }
    oc.lineCap = 'round';
    oc.lineWidth = 0.8 + 0.5 * coarse;
    oc.strokeStyle = ink(0.58 + 0.08 * coarse);
    oc.beginPath();
    for (let q = 0; q < segs.length; q += 4) { oc.moveTo(segs[q], segs[q + 1]); oc.lineTo(segs[q + 2], segs[q + 3]); }
    oc.stroke();
    job.ms = Math.round(performance.now() - t0);
    return out;
  };
})();

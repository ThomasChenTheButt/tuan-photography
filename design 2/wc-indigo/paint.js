/* tuan photography 陳亮元 · design 2 · "Two pigments": the painter.
   Paints the world with two pigments only, on washi: indigo in many dilutions for everything,
   persimmon for the sixteen countries travelled. Each texture is painted once per zoom band and
   region into an offscreen canvas, so the map only has to place a finished painting as it pans.
   The sea is laid as graded indigo washes, palest at the coast and over the shelves, deepening
   offshore (from Natural Earth's ocean-bottom relief), each wash drying with a darker edge; the
   land is a very pale indigo-grey whose density follows the shaded relief; persimmon is glazed
   over the countries travelled. */
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
  WC.rng = rng;
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
    NH = new Float32Array(N * N);  // the fine grain of the paper taking the pigment
    for (let i = 0; i < NH.length; i++) NH[i] = a[i] * 0.7 + b() * 0.3;
  }
  WC.noise = () => { ensureNoise(); return { NL, NM, NH, N }; };

  /* ------------------------------------------------------------ washi: long fibres in a cool sheet */

  // a tileable sheet of kozo fibres: long, fine, wandering strands, a few lighter than the sheet
  // (where the fibre resisted the pigment) and a few a shade darker; laid over the map and the pages
  WC.washiTile = (px = 512, seed = 7) => {
    const c = document.createElement('canvas');
    c.width = c.height = px;
    const g = c.getContext('2d');
    const r = rng(seed);
    g.lineCap = 'round';
    const strand = (light) => {
      const x = r() * px, y = r() * px;
      const len = 40 + Math.pow(r(), 1.6) * 220;
      let th = r() * Math.PI * 2;
      const bend = (r() - 0.5) * 0.05;
      const pts = [[x, y]];
      let cx = x, cy = y;
      const n = Math.max(4, Math.round(len / 9));
      for (let i = 0; i < n; i++) {
        th += bend + (r() - 0.5) * 0.12;
        cx += Math.cos(th) * (len / n); cy += Math.sin(th) * (len / n);
        pts.push([cx, cy]);
      }
      const w = light ? 0.4 + r() * 0.8 : 0.3 + r() * 0.4;
      const a = light ? 0.16 + r() * 0.3 : 0.03 + r() * 0.05;
      g.strokeStyle = light ? `rgba(255, 255, 255, ${a})` : `rgba(52, 66, 104, ${a})`;
      g.lineWidth = w;
      // drawn nine times over, so the strand carries on across the tile's edges
      for (const ox of [-px, 0, px]) for (const oy of [-px, 0, px]) {
        g.beginPath();
        g.moveTo(pts[0][0] + ox, pts[0][1] + oy);
        for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0] + ox, pts[i][1] + oy);
        g.stroke();
      }
    };
    for (let i = 0; i < 150; i++) strand(true);
    for (let i = 0; i < 60; i++) strand(false);
    return c;
  };

  /* ------------------------------------------------------------ the two pigments, as transmittance of the paper */

  const PAPER = [243, 245, 246];        // washi, cool, not cream
  const INDIGO = [0.27, 0.38, 0.66];     // indigo at full strength
  const GREYINDIGO = [0.55, 0.6, 0.71]; // indigo let down with its own grey, for the land
  const PERSIMMON = [0.97, 0.56, 0.3];  // persimmon, a soft warm orange
  WC.PAPER = PAPER;
  WC.colours = { INDIGO, GREYINDIGO, PERSIMMON };
  // the deepest wash, flat, for any sea beyond the painted sheet
  WC.deepSea = () => {
    const d = 0.34;
    return PAPER.map((p, i) => Math.round(p * (1 - d * (1 - INDIGO[i]))));
  };

  /* ------------------------------------------------------------ painting one texture */

  // yield to the page between slices of work (a message, not a timer: timers are slowed in background tabs)
  const chan = new MessageChannel();
  const waiting = [];
  chan.port1.onmessage = () => { const f = waiting.shift(); if (f) f(); };
  const later = () => new Promise((res) => { waiting.push(res); chan.port2.postMessage(0); });
  const smooth = (x, e, w) => { const t = (x - e) / w + 0.5; return t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t); };

  /*
    job: { r: texture px per degree, u0, v0: world origin of the texture in degrees (u east of the
           map's centre meridian, v = -latitude), w, h: size in px }
    env: { LON0, land() -> GeoJSON, travel() -> [GeoJSON], seams() -> GeoJSON, relief(r) -> image|null,
           depth() -> { d: Float32Array (1 shallow .. 0 deep), w, h } | null }
    Resolves to a canvas; rejects with 'cancelled' when job.cancelled turns true.
  */
  WC.paint = async (job, env) => {
    ensureNoise();
    const { r, u0, v0, w, h } = job;
    const pad = 28;
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

    // masks, one to a channel: red the land softened a little, green the land blurred (the strip of
    // pale water along every coast), blue the countries travelled
    const P = document.createElement('canvas');
    P.width = PW; P.height = PH;
    const pc = P.getContext('2d', { willReadFrequently: true });
    pc.fillStyle = '#000'; pc.fillRect(0, 0, PW, PH);
    pc.globalCompositeOperation = 'lighter';
    pc.filter = 'blur(1.2px)'; pc.fillStyle = '#f00'; pc.fill(landPath);
    pc.filter = 'blur(7px)'; pc.fillStyle = '#0f0'; pc.fill(landPath);
    const T = document.createElement('canvas');
    T.width = PW; T.height = PH;
    const tc = T.getContext('2d');
    tc.fillStyle = '#000'; tc.fillRect(0, 0, PW, PH);
    tc.fillStyle = '#00f'; tc.fill(travelPath);
    tc.strokeStyle = '#000'; tc.lineWidth = 2.2; tc.lineJoin = 'round'; tc.stroke(seamPath);
    pc.filter = 'blur(1.2px)'; pc.drawImage(T, 0, 0);
    pc.filter = 'none';
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
    if (job.cancelled) throw new Error('cancelled');
    await later();

    // the depth of the sea, sampled from its small field
    const dep = env.depth ? env.depth() : null;
    const fxs = new Float32Array(w), fys = new Float32Array(h);
    if (dep) {
      const kx = dep.w / 360, ky = dep.h / 180;
      for (let i = 0; i < w; i++) {
        let lon = u0 + i / r + env.LON0;
        lon = ((lon + 180) % 360 + 360) % 360;
        fxs[i] = lon * kx - 0.5;
      }
      for (let j = 0; j < h; j++) fys[j] = Math.min(dep.h - 1.001, Math.max(0, (v0 + j / r + 90) * ky - 0.5));
    }
    const depthAt = (i, j) => {
      if (!dep) return 0.5;
      const fx = fxs[i], fy = fys[j];
      let x0 = Math.floor(fx);
      const tx = fx - x0, y0 = fy | 0, ty = fy - y0;
      const xa = (x0 + dep.w) % dep.w, xb = (x0 + 1) % dep.w;
      const ra = y0 * dep.w, rb = (y0 + 1) * dep.w, D = dep.d;
      const top = D[ra + xa] + (D[ra + xb] - D[ra + xa]) * tx;
      const bot = D[rb + xa] + (D[rb + xb] - D[rb + xa]) * tx;
      return top + (bot - top) * ty;
    };

    const out = document.createElement('canvas');
    out.width = w; out.height = h;
    const oc = out.getContext('2d');
    const od = oc.createImageData(w, h);
    const o = od.data;

    // noise is anchored to the world, so neighbouring textures of one band agree
    const OFF = 1 << 22;
    const ox = Math.round(u0 * r) + OFF, oy = Math.round(v0 * r) + OFF;
    const [PR, PG, PB] = PAPER;
    const glazeK = r <= 16 ? 1 : Math.max(0.6, 1 - (Math.log2(r / 16) / Math.log2(96 / 16)) * 0.4);
    const ir = 1 - INDIGO[0], ig = 1 - INDIGO[1], ib = 1 - INDIGO[2];
    const lr = 1 - GREYINDIGO[0], lg = 1 - GREYINDIGO[1], lb = 1 - GREYINDIGO[2];
    const zr = 1 - PERSIMMON[0], zg = 1 - PERSIMMON[1], zb = 1 - PERSIMMON[2];
    // the three washes laid over the open sea, each a little further out, each with its dried edge
    const BANDS = [0.16, 0.44, 0.72];

    let j = 0;
    while (j < h) {
      const tStart = performance.now();
      for (; j < h && performance.now() - tStart < 10; j++) {
        const gy = j + oy;
        const rowL = (((gy >> 2) & 511) << 9), rowM = (((gy >> 1) & 511) << 9), rowM2 = ((((gy >> 1) + 173) & 511) << 9), rowH = ((gy & 511) << 9);
        const pRow = (j + pad) * PW + pad;
        for (let i = 0; i < w; i++) {
          const gx = i + ox;
          const lo = NL[rowL | ((gx >> 2) & 511)];
          const m1 = NM[rowM | ((gx >> 1) & 511)];
          const m2 = NM[rowM2 | (((gx >> 1) + 91) & 511)];
          const hi = NH[rowH | (gx & 511)];

          // each wash wanders its own few pixels away from the true coast
          const dx1 = ((m1 - 0.5) * 7) | 0, dy1 = ((m2 - 0.5) * 7) | 0;
          const pp = pRow + i;
          const a1 = pd[(pp + dy1 * PW + dx1) << 2] / 255;              // under the sea wash
          const a2 = pd[(pp - dx1 * PW + dy1) << 2] / 255;              // under the land wash
          const near = pd[(pp << 2) + 1] / 255;                         // nearness to a coast
          const g1 = pd[((pp - dy1 * PW - dx1) << 2) + 2] / 255;        // the glaze

          // indigo does not granulate: only the paper's fine grain and the lie of the wash
          const grain = 1 + (hi - 0.5) * 0.22;
          const blot = 0.84 + 0.32 * lo;

          // sea: graded washes deepening offshore, palest over the shelves and along the coast
          let x = (a1 + (hi - 0.5) * 0.18 - 0.34) / 0.32;
          const sc = x <= 0 ? 1 : x >= 1 ? 0 : 1 - x * x * (3 - 2 * x);
          let dS = 0;
          if (sc > 0) {
            const shallow = Math.max(depthAt(i, j), Math.min(1, near * 1.5));
            const dp = 1 - shallow + (m1 - 0.5) * 0.12 + (lo - 0.5) * 0.08;
            let layers = 0, rims = 0;
            for (let b = 0; b < 3; b++) {
              const e = BANDS[b];
              layers += smooth(dp, e, 0.035);
              const q = dp - e - 0.02;
              rims += q > -0.02 ? Math.exp(-(q * q) / 0.00028) : 0;
            }
            // the dried edge where the sea wash meets the land: the coastline itself
            const coastRim = a1 * (1 - a1) * 4 * (0.75 + 0.5 * m1);
            dS = sc * ((0.075 + 0.085 * layers + 0.05 * rims) * blot + 0.42 * coastRim) * grain;
          }

          // land: very pale indigo-grey, its density following the relief
          x = (a2 - 0.62 + (hi - 0.5) * 0.16) / 0.24;
          const lc = x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
          let dev = (206 - qd[(j * w + i) << 2]) / 64;
          dev = dev < -1 ? -1 : dev > 1.6 ? 1.6 : dev;
          const shade = dev > 0 ? dev : 0, lit = dev < 0 ? -dev : 0;
          const landEdge = Math.exp(-Math.pow((a2 - 0.64) / 0.08, 2)) * 0.16;

          // persimmon over the countries travelled: translucent, pooled a little at its own edge
          x = (g1 - 0.5 + (hi - 0.5) * 0.14) / 0.24;
          const gc = x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
          const gEdge = Math.exp(-Math.pow((g1 - 0.56) / 0.1, 2));
          const dG = gc * (0.4 + 0.36 * gEdge) * (0.82 + 0.36 * lo) * grain * glazeK;

          let dL = (lc * (0.075 + 0.9 * shade - 0.05 * lit) + landEdge) * (0.74 + 0.52 * lo) * grain;
          if (dL < 0) dL = 0;
          dL *= 1 - 0.55 * gc; // under the glaze, the grey is let down so the persimmon stays clean

          o[(j * w + i) << 2] = PR * (1 - dS * ir) * (1 - dL * lr) * (1 - dG * zr);
          o[((j * w + i) << 2) + 1] = PG * (1 - dS * ig) * (1 - dL * lg) * (1 - dG * zg);
          o[((j * w + i) << 2) + 2] = PB * (1 - dS * ib) * (1 - dL * lb) * (1 - dG * zb);
          o[((j * w + i) << 2) + 3] = 255;
        }
      }
      if (job.cancelled) throw new Error('cancelled');
      if (j < h) await later();
    }
    oc.putImageData(od, 0, 0);
    job.ms = Math.round(performance.now() - t0);
    return out;
  };
})();

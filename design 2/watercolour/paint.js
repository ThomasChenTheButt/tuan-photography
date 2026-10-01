/* tuan photography 陳亮元 · design 2 · "Field watercolour": the painter.
   Paints the world as a watercolour on cold-press paper, into offscreen canvases (one per zoom
   band and region), so the map itself only has to place a finished painting while it pans.
   Washes are computed per pixel: a pale cerulean sea that pools along every coast and dries with
   a darker bloom line, land left mostly as paper under a warm-grey and sap-green wash that
   follows the relief, a translucent rose madder glaze over the sixteen countries travelled,
   pigment granulation, and edges that wander a few pixels off the coastline. */
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

  /* ------------------------------------------------------------ a bloom: the shape a wet wash spreads to */

  // one shape serves twice: painted on the map as the wash spreads, then as the mask the photograph soaks in through
  function bloomEdge(seed) {
    const r = rng(seed);
    const waves = Array.from({ length: 7 }, (_, i) => ({ f: i + 2, a: (0.09 / (i + 1.4)) * (0.6 + r()), p: r() * Math.PI * 2 }));
    return (th) => {
      let v = 1;
      for (const w of waves) v += w.a * Math.sin(w.f * th + w.p);
      return v;
    };
  }
  // the mask: opaque core, a feather wider than a third of the radius, an irregular wet edge
  WC.bloomMask = (px = 512, seed = 3) => {
    const edge = bloomEdge(seed);
    const c = document.createElement('canvas');
    c.width = c.height = px;
    const g = c.getContext('2d');
    const id = g.createImageData(px, px);
    const h = px / 2;
    const gr = rng(seed + 1);
    for (let y = 0; y < px; y++) {
      for (let x = 0; x < px; x++) {
        const dx = (x + 0.5 - h) / h, dy = (y + 0.5 - h) / h;
        const rr = Math.hypot(dx, dy);
        const R = 0.86 * edge(Math.atan2(dy, dx));
        const inner = R * 0.36;
        let t = (rr - inner) / (R - inner);
        t = t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
        let a = 1 - t;
        // the edge of the feather breaks up a little, as pigment does at a drying edge
        if (a > 0 && a < 1) a = Math.max(0, Math.min(1, a + (gr() - 0.5) * 0.08 * a * (1 - a) * 4));
        const i = (y * px + x) * 4;
        id.data[i] = 255; id.data[i + 1] = 255; id.data[i + 2] = 255; id.data[i + 3] = Math.round(a * 255);
      }
    }
    g.putImageData(id, 0, 0);
    return c;
  };
  // the wash itself, to multiply onto the map: light in the middle, pooled dark at its drying edge
  WC.bloomWash = (px = 512, seed = 3, rgb = [96, 152, 190]) => {
    const edge = bloomEdge(seed);
    const { NH: gH, NL: gL } = WC.noise();
    const c = document.createElement('canvas');
    c.width = c.height = px;
    const g = c.getContext('2d');
    const id = g.createImageData(px, px);
    const h = px / 2;
    for (let y = 0; y < px; y++) {
      for (let x = 0; x < px; x++) {
        const dx = (x + 0.5 - h) / h, dy = (y + 0.5 - h) / h;
        const rr = Math.hypot(dx, dy);
        const R = 0.86 * edge(Math.atan2(dy, dx));
        const q = rr / R;
        let d = 0;
        if (q < 1.04) {
          const body = 0.22 + 0.1 * q;
          const rim = Math.exp(-Math.pow((q - 0.94) / 0.07, 2)) * (0.22 + 0.3 * gL[((y >> 2) & 511) * 512 + ((x >> 2) & 511)]);
          const fall = q > 0.97 ? Math.max(0, 1 - (q - 0.97) / 0.07) : 1;
          const gran = 0.8 + 0.4 * gH[(y & 511) * 512 + (x & 511)];
          const blot = 0.75 + 0.5 * gL[((y >> 1) & 511) * 512 + ((x >> 1) & 511)];
          d = (body * blot + rim) * gran * fall;
        }
        const i = (y * px + x) * 4;
        id.data[i] = rgb[0]; id.data[i + 1] = rgb[1]; id.data[i + 2] = rgb[2];
        id.data[i + 3] = Math.round(Math.max(0, Math.min(1, d)) * 255);
      }
    }
    g.putImageData(id, 0, 0);
    return c;
  };

  /* ------------------------------------------------------------ the palette, as transmittance of paper */

  const PAPER = [251, 250, 246];
  const SEA = [0.48, 0.75, 0.9];     // cerulean
  const GREY = [0.79, 0.77, 0.73];   // a warm neutral grey
  const GREEN = [0.69, 0.8, 0.55];   // sap green, let down
  const GLAZE = [0.96, 0.6, 0.66];   // rose madder
  WC.PAPER = PAPER;
  WC.colours = { SEA, GREY, GREEN, GLAZE };

  /* ------------------------------------------------------------ painting one texture */

  const later = () => new Promise((res) => setTimeout(res, 0));

  /*
    job: { r: texture px per degree, u0, v0: world origin of the texture in degrees (u east of the
           map's centre meridian, v = -latitude), w, h: size in px }
    env: { LON0, LAT_N, LAT_S, land(r) -> GeoJSON, travel() -> [GeoJSON], relief(r) -> image|null }
    Resolves to a canvas; rejects with 'cancelled' when job.cancelled turns true.
  */
  WC.paint = async (job, env) => {
    ensureNoise();
    const { r, u0, v0, w, h } = job;
    const pad = 28;
    const PW = w + pad * 2, PH = h + pad * 2;
    const t0 = performance.now();

    // the projection of this texture: equirectangular, so the relief image lies straight on it
    const proj = d3.geoEquirectangular().rotate([-env.LON0, 0]).precision(0.5)
      .scale((r * 180) / Math.PI)
      .translate([-u0 * r + pad, -v0 * r + pad])
      .clipExtent([[-60, -60], [PW + 60, PH + 60]]);
    const landPath = new Path2D();
    d3.geoPath(proj, landPath)(env.land(r));
    const travelPath = new Path2D();
    const gp = d3.geoPath(proj, travelPath);
    for (const f of env.travel()) gp(f);
    // where two travelled countries meet, each glaze keeps its own edge
    const seamPath = new Path2D();
    if (env.seams) d3.geoPath(proj, seamPath)(env.seams());

    // masks, one to a channel: red the land softened a little, green the land blurred far (for the
    // pooling along coasts), blue the countries travelled
    const P = document.createElement('canvas');
    P.width = PW; P.height = PH;
    const pc = P.getContext('2d', { willReadFrequently: true });
    pc.fillStyle = '#000'; pc.fillRect(0, 0, PW, PH);
    pc.globalCompositeOperation = 'lighter';
    pc.filter = 'blur(1.3px)'; pc.fillStyle = '#f00'; pc.fill(landPath);
    pc.filter = 'blur(9px)'; pc.fillStyle = '#0f0'; pc.fill(landPath);
    const T = document.createElement('canvas');
    T.width = PW; T.height = PH;
    const tc = T.getContext('2d');
    tc.fillStyle = '#000'; tc.fillRect(0, 0, PW, PH);
    tc.fillStyle = '#00f'; tc.fill(travelPath);
    tc.strokeStyle = '#000'; tc.lineWidth = 2.4; tc.lineJoin = 'round'; tc.stroke(seamPath);
    pc.filter = 'blur(1.3px)'; pc.drawImage(T, 0, 0);
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
      const iw = img.width, ih = img.height, ri = iw / 360;
      qc.imageSmoothingQuality = 'high';
      // the image runs from 180°W; in this map's frame that is u = -180 - LON0, and it repeats every 360°
      for (const shift of [-360, 0, 360]) {
        const uL = -180 - env.LON0 + shift; // u of the image's left edge
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

    const out = document.createElement('canvas');
    out.width = w; out.height = h;
    const oc = out.getContext('2d');
    const od = oc.createImageData(w, h);
    const o = od.data;

    // noise is anchored to the world, so neighbouring textures of one band agree
    const OFF = 1 << 22;
    const ox = Math.round(u0 * r) + OFF, oy = Math.round(v0 * r) + OFF;
    const fadeDeg = 3.5;
    const uEdge = new Float32Array(w);
    for (let i = 0; i < w; i++) {
      const u = u0 + i / r;
      uEdge[i] = Math.min(1, Math.max(0, (180 - Math.abs(u)) / fadeDeg));
    }
    const [PR, PG, PB] = PAPER;
    const glazeK = r <= 16 ? 1 : Math.max(0.5, 1 - (Math.log2(r / 16) / Math.log2(96 / 16)) * 0.5);
    const sr = 1 - SEA[0], sg = 1 - SEA[1], sb = 1 - SEA[2];
    const zr = 1 - GLAZE[0], zg = 1 - GLAZE[1], zb = 1 - GLAZE[2];

    let j = 0;
    while (j < h) {
      const tStart = performance.now();
      for (; j < h && performance.now() - tStart < 10; j++) {
        const lat = -(v0 + j / r);
        const polar = Math.min(1, Math.max(0, (Math.abs(lat) - 58) / 14)); // the far north and south go grey
        const vEdge = Math.min(1, Math.max(0, Math.min(env.LAT_N - lat, lat - env.LAT_S) / fadeDeg));
        const gy = j + oy;
        const rowL = (((gy >> 2) & 511) << 9), rowM = (((gy >> 1) & 511) << 9), rowM2 = ((((gy >> 1) + 173) & 511) << 9), rowH = ((gy & 511) << 9);
        const pRow = (j + pad) * PW + pad;
        for (let i = 0; i < w; i++) {
          const gx = i + ox;
          const lo = NL[rowL | ((gx >> 2) & 511)];
          const m1 = NM[rowM | ((gx >> 1) & 511)];
          const m2 = NM[rowM2 | (((gx >> 1) + 91) & 511)];
          const hi = NH[rowH | (gx & 511)];
          const edgeFade = vEdge * uEdge[i];
          // the sheet's own edges: the washes stop short in a ragged line, as a painted sheet does
          const sheet = edgeFade >= 1 ? 1 : Math.max(0, Math.min(1, edgeFade * 1.6 - 0.3 + (hi - 0.5) * 0.5 + (m1 - 0.5) * 0.6));

          // each wash wanders its own few pixels away from the true coast
          const dx1 = ((m1 - 0.5) * 9) | 0, dy1 = ((m2 - 0.5) * 9) | 0;
          const pp = pRow + i;
          const a1 = pd[(pp + dy1 * PW + dx1) << 2] / 255;              // under the sea wash
          const a2 = pd[(pp - dx1 * PW + dy1) << 2] / 255;              // under the land wash
          const far = pd[(pp << 2) + 1] / 255;                          // nearness to a coast
          const g1 = pd[((pp - dy1 * PW - dx1) << 2) + 2] / 255;        // the glaze

          // granulation: settles in clumps, heavier where the mid noise gathers it
          const gran = 1 + (hi - 0.5) * (0.55 + 0.9 * m2);
          const blot = 0.74 + 0.52 * lo;

          // sea: pale, pooling toward the shore, a dried bloom line at the wash's edge, a faint tide line further out
          let x = (a1 + (hi - 0.5) * 0.22 - 0.34) / 0.32;
          const sc = x <= 0 ? 1 : x >= 1 ? 0 : 1 - x * x * (3 - 2 * x);
          const bloomLine = a1 * (1 - a1) * 4 * (0.5 + 0.9 * m1);
          let pool = far * 2.3; pool = pool > 1 ? 1 : pool; pool = pool * pool * (3 - 2 * pool);
          const tide = Math.exp(-Math.pow((far - 0.2 - (m2 - 0.5) * 0.12) / 0.028, 2)) * 0.22 * (1 - a1);
          let dS = sc * (0.24 + 0.34 * pool + 0.62 * bloomLine + tide) * blot * gran * sheet;

          // land: mostly paper; a wash that follows the relief, held back a pixel or two from the coast
          x = (a2 - 0.64 + (hi - 0.5) * 0.2) / 0.24;
          let lc = x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
          let dev = (206 - qd[(j * w + i) << 2]) / 64;
          dev = dev < -1 ? -1 : dev > 1.6 ? 1.6 : dev;
          const shade = dev > 0 ? dev : 0, lit = dev < 0 ? -dev : 0;
          const landEdge = Math.exp(-Math.pow((a2 - 0.66) / 0.09, 2)) * 0.22;
          let dL = (lc * (0.21 + 0.8 * shade - 0.12 * lit) + landEdge) * (0.62 + 0.7 * lo) * gran * sheet;
          if (dL < 0) dL = 0;
          let gf = 0.92 - 1.4 * shade + (lo - 0.5) * 1.1 - polar;
          gf = gf < 0 ? 0 : gf > 1 ? 1 : gf;
          const lr = 1 - (GREY[0] + (GREEN[0] - GREY[0]) * gf), lg = 1 - (GREY[1] + (GREEN[1] - GREY[1]) * gf), lb = 1 - (GREY[2] + (GREEN[2] - GREY[2]) * gf);

          // the glaze over the countries travelled: translucent, pooled a little at its own edge
          x = (g1 - 0.5 + (hi - 0.5) * 0.16) / 0.26;
          const gc = x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
          const gEdge = Math.exp(-Math.pow((g1 - 0.56) / 0.11, 2));
          const dG = gc * (0.36 + 0.42 * gEdge) * (0.72 + 0.5 * lo) * gran * sheet * glazeK;

          let fr = PR * (1 - dS * sr) * (1 - dL * lr) * (1 - dG * zr);
          let fg = PG * (1 - dS * sg) * (1 - dL * lg) * (1 - dG * zg);
          let fb = PB * (1 - dS * sb) * (1 - dL * lb) * (1 - dG * zb);
          const k = (j * w + i) << 2;
          o[k] = fr; o[k + 1] = fg; o[k + 2] = fb; o[k + 3] = 255;
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

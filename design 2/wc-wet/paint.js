/* tuan photography 陳亮元 · design 2 · "Wet in wet": the painter.
   Paints the world loosely, as if the colour were dropped into wet paper and left to drift.
   Each zoom band is painted once into offscreen canvases, so the map only places a finished
   painting while it pans.
   - the sea is one graded wash: pale cerulean along the shores, deepening to ultramarine over
     the deep ocean (the depth is read from Natural Earth's ocean-floor relief), with soft
     cauliflower backruns where wetter paint crept back into drying paint
   - the land is a drifting mix of burnt sienna, sap green and a warm grey, following the relief
     loosely and bleeding a little past the shore in places
   - the sixteen countries travelled carry a glaze of quinacridone rose that bleeds at its edges
   - no pen: the coast is the darker edge where the sea wash dried */
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
  let NL = null, NM = null, NH = null, NB = null, NC = null;
  function ensureNoise() {
    if (NL) return;
    NL = fbm(N, 4, 4, 11, 0.55);   // blotches: the wash lying heavier here, lighter there
    NM = fbm(N, 16, 3, 23, 0.5);   // the wandering of wash edges
    const a = fbm(N, 128, 2, 37, 0.6), b = rng(41);
    NH = new Float32Array(N * N);  // granulation: pigment settling into the grain, in clumps
    for (let i = 0; i < NH.length; i++) NH[i] = a[i] * 0.7 + b() * 0.3;
    NB = fbm(N, 6, 5, 53, 0.58);   // the backruns: where wetter paint crept into drying paint
    NC = fbm(N, 3, 4, 61, 0.5);    // the drift of colour through the wet paper
  }
  WC.noise = () => { ensureNoise(); return { NL, NM, NH, NB, NC, N }; };

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

  const PAPER = [251, 250, 245];
  const CERULEAN = [0.6, 0.85, 0.94];
  const TURQUOISE = [0.52, 0.86, 0.84];
  const ULTRA = [0.42, 0.56, 0.87];   // French ultramarine
  const SIENNA = [0.93, 0.79, 0.56];  // raw sienna, warm
  const GREEN = [0.68, 0.79, 0.5];    // sap green
  const GREY = [0.79, 0.78, 0.77];    // a warm neutral grey
  const GLAZE = [0.95, 0.52, 0.66];   // quinacridone rose
  WC.PAPER = PAPER;
  WC.colours = { CERULEAN, ULTRA, SIENNA, GREEN, GREY, GLAZE };

  /* ------------------------------------------------------------ painting one texture */

  const later = () => new Promise((res) => setTimeout(res, 0));
  const ss = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

  // lay an equirectangular image onto a texture frame (it runs from 180°W and repeats every 360°)
  function layImage(g, img, env, u0, v0, w, h, r) {
    const iw = img.width, ri = iw / 360;
    g.imageSmoothingQuality = 'high';
    for (const shift of [-360, 0, 360]) {
      const uL = -180 - env.LON0 + shift;
      const a = Math.max(u0, uL), b = Math.min(u0 + w / r, uL + 360);
      if (b <= a) continue;
      const vT = Math.max(v0, -90), vB = Math.min(v0 + h / r, 90);
      if (vB <= vT) continue;
      g.drawImage(img, (a - uL) * ri, (vT + 90) * ri, (b - a) * ri, (vB - vT) * ri, (a - u0) * r, (vT - v0) * r, (b - a) * r, (vB - vT) * r);
    }
  }

  /* the sea's depth, once for the whole world at 4 px a degree, so every zoom band grades alike:
     red the land blurred about four degrees (distance from any shore), green about one degree
     (the shallows by the shore), blue the ocean floor softened (shelves light, the abyss dark) */
  const FR = 4;
  let field = null;
  WC.field = (env) => {
    if (field) return field;
    const w = 360 * FR, h = 180 * FR;
    const proj = d3.geoEquirectangular().rotate([-env.LON0, 0]).precision(0.5).scale((FR * 180) / Math.PI).translate([w / 2, h / 2]);
    const landPath = new Path2D();
    d3.geoPath(proj, landPath)(env.land());
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'lighter';
    g.filter = `blur(${FR * 4.2}px)`; g.fillStyle = '#f00'; g.fill(landPath);
    g.filter = `blur(${FR * 1.1}px)`; g.fillStyle = '#0f0'; g.fill(landPath);
    const fc = document.createElement('canvas');
    fc.width = w; fc.height = h;
    const f = fc.getContext('2d');
    f.fillStyle = 'rgb(88,88,88)'; f.fillRect(0, 0, w, h);
    f.filter = `blur(${FR * 1.6}px)`;
    if (env.floor()) layImage(f, env.floor(), env, -180, -90, w, h, FR);
    f.filter = 'none';
    // the floor goes into blue only
    g.filter = 'none';
    const tmp = document.createElement('canvas');
    tmp.width = w; tmp.height = h;
    const tg = tmp.getContext('2d');
    tg.drawImage(fc, 0, 0);
    tg.globalCompositeOperation = 'multiply';
    tg.fillStyle = '#00f'; tg.fillRect(0, 0, w, h);
    g.drawImage(tmp, 0, 0);
    const d = g.getImageData(0, 0, w, h).data;
    const far = new Float32Array(w * h), near = new Float32Array(w * h), floor = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) { far[i] = d[i * 4] / 255; near[i] = d[i * 4 + 1] / 255; floor[i] = d[i * 4 + 2]; }
    field = { w, h, far, near, floor };
    return field;
  };
  // bilinear sample of a field channel at world (u, v) in degrees
  function sample(a, u, v) {
    const { w, h } = field;
    let x = (u + 180) * FR - 0.5, y = (v + 90) * FR - 0.5;
    x = x < 0 ? 0 : x > w - 1.001 ? w - 1.001 : x;
    y = y < 0 ? 0 : y > h - 1.001 ? h - 1.001 : y;
    const x0 = x | 0, y0 = y | 0, tx = x - x0, ty = y - y0, i = y0 * w + x0;
    const top = a[i] + (a[i + 1] - a[i]) * tx, bot = a[i + w] + (a[i + w + 1] - a[i + w]) * tx;
    return top + (bot - top) * ty;
  }

  /*
    job: { r: texture px per degree, u0, v0: world origin of the texture in degrees (u east of the
           map's centre meridian, v = -latitude), w, h: size in px }
    env: { LON0, land() -> GeoJSON, travel() -> [GeoJSON], seams() -> GeoJSON,
           relief(r) -> image|null (land hillshade), floor() -> image|null (ocean floor) }
    Resolves to a canvas; rejects with 'cancelled' when job.cancelled turns true.
  */
  WC.paint = async (job, env) => {
    ensureNoise();
    const { r, u0, v0, w, h } = job;
    const pad = 28;
    const PW = w + pad * 2, PH = h + pad * 2;
    const t0 = performance.now();

    // the projection of this texture: equirectangular, so the relief images lie straight on it
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

    // masks, one to a channel. First sheet: red the land softened a little (the shore), green the
    // land blurred far (nearness to a shore), blue the countries travelled, softened to bleed
    const P = document.createElement('canvas');
    P.width = PW; P.height = PH;
    const pc = P.getContext('2d');
    pc.fillStyle = '#000'; pc.fillRect(0, 0, PW, PH);
    pc.globalCompositeOperation = 'lighter';
    pc.filter = 'blur(1.2px)'; pc.fillStyle = '#f00'; pc.fill(landPath);
    pc.filter = 'blur(11px)'; pc.fillStyle = '#0f0'; pc.fill(landPath);
    const T = document.createElement('canvas');
    T.width = PW; T.height = PH;
    const tc = T.getContext('2d');
    tc.fillStyle = '#000'; tc.fillRect(0, 0, PW, PH);
    tc.fillStyle = '#00f'; tc.fill(travelPath);
    tc.strokeStyle = '#000'; tc.lineWidth = 2; tc.lineJoin = 'round'; tc.stroke(seamPath);
    pc.filter = 'blur(2.6px)'; pc.drawImage(T, 0, 0);
    pc.filter = 'none';
    // second sheet: red the land blurred wider, which is where the land wash may bleed
    const P2 = document.createElement('canvas');
    P2.width = PW; P2.height = PH;
    const p2 = P2.getContext('2d');
    p2.fillStyle = '#000'; p2.fillRect(0, 0, PW, PH);
    p2.filter = 'blur(4.5px)'; p2.fillStyle = '#f00'; p2.fill(landPath);
    p2.filter = 'none';
    if (job.cancelled) throw new Error('cancelled');
    await later();

    // the land's relief (neutral 206 where the image has nothing to say), and the ocean floor,
    // softened by about a degree, so depth reads as a slow gradation rather than as detail
    const Q = document.createElement('canvas');
    Q.width = w; Q.height = h;
    const qc = Q.getContext('2d');
    qc.fillStyle = 'rgb(206,206,206)'; qc.fillRect(0, 0, w, h);
    const img = env.relief(r);
    if (img) layImage(qc, img, env, u0, v0, w, h, r);
    const F = WC.field(env);
    const pd = pc.getImageData(0, 0, PW, PH).data;
    const pd2 = p2.getImageData(0, 0, PW, PH).data;
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
    const [PR, PG, PB] = PAPER;
    // close in, the glaze thins a little so the land under it still reads
    const glazeK = r <= 16 ? 1 : Math.max(0.6, 1 - (Math.log2(r / 16) / Math.log2(96 / 16)) * 0.4);
    // the backruns are a world-zoom gesture; close in they are fewer and fainter
    const bloomK = r <= 12 ? 1 : Math.max(0.35, 1 - Math.log2(r / 12) * 0.22);
    const zr = 1 - GLAZE[0], zg = 1 - GLAZE[1], zb = 1 - GLAZE[2];

    const { far: FF, near: FN, floor: FL } = F;
    let j = 0;
    while (j < h) {
      const tStart = performance.now();
      for (; j < h && performance.now() - tStart < 10; j++) {
        const v = v0 + j / r;
        const lat = -v;
        const polar = ss((Math.abs(lat) - 58) / 16); // the far north and south go pale and grey
        const gy = j + oy;
        const rowL = (((gy >> 2) & 511) << 9), rowM = (((gy >> 1) & 511) << 9), rowM2 = ((((gy >> 1) + 173) & 511) << 9), rowH = ((gy & 511) << 9);
        const rowB = ((((gy >> 2) + 97) & 511) << 9), rowB2 = ((((gy >> 1) + 311) & 511) << 9), rowC = ((((gy >> 2) + 41) & 511) << 9), rowN = ((((gy >> 1) + 401) & 511) << 9);
        const pRow = (j + pad) * PW + pad;
        for (let i = 0; i < w; i++) {
          const gx = i + ox;
          const lo = NL[rowL | ((gx >> 2) & 511)];
          const m1 = NM[rowM | ((gx >> 1) & 511)];
          const m2 = NM[rowM2 | (((gx >> 1) + 91) & 511)];
          const hi = NH[rowH | (gx & 511)];
          const bb = NB[rowB | (((gx >> 2) + 211) & 511)] * 0.55 + NB[rowB2 | (((gx >> 1) + 389) & 511)] * 0.45;
          const bs = NB[rowB2 | (((gx >> 1) + 57) & 511)];
          const drift = NC[rowC | (((gx >> 2) + 129) & 511)];
          const mixA = NL[rowN | (((gx >> 1) + 300) & 511)];

          // each wash wanders its own few pixels away from the true coast
          const dx1 = ((m1 - 0.5) * 4) | 0, dy1 = ((m2 - 0.5) * 4) | 0;
          const dx2 = ((m2 - 0.5) * 12) | 0, dy2 = ((m1 - 0.5) * 12) | 0;
          const pp = pRow + i;
          const a1 = pd[(pp + dy1 * PW + dx1) << 2] / 255;             // the shore, under the sea wash
          const near = pd[(pp << 2) + 1] / 255;                         // nearness to a shore, close by
          const g1 = pd[((pp - dy1 * PW - dx1) << 2) + 2] / 255;       // the glaze
          const a2 = pd2[(pp + dy2 * PW - dx2) << 2] / 255;            // the land, where its wash may bleed

          // granulation settles in clumps; the wet blotches lie heavier here, lighter there
          const gran = 1 + (hi - 0.5) * (0.5 + 0.8 * m2);
          const blot = 0.7 + 0.6 * lo;
          const wet = 0.72 + 0.56 * drift;

          /* the sea: one graded wash */
          let x = (a1 + (hi - 0.5) * 0.1 - 0.42) / 0.18;
          const sc = 1 - ss(x);                                          // where the sea wash lies
          const edge = a1 > 0.03 && a1 < 0.97 ? a1 * (1 - a1) * 4 : 0;   // its dried edge, along the shore
          const u = u0 + i / r;
          const fFar = sample(FF, u, v), fNear = sample(FN, u, v), fl = sample(FL, u, v);
          // deep water: far from any shore and off the shelves; always pale in the shallows
          const shelf = ss((fl - 92.5) / 7);
          let open = 1 - fFar * 2.1; open = open < 0 ? 0 : open;
          let deep = open * 0.62 + (1 - shelf) * 0.5 - fNear * 1.1 - near * 0.4 + (drift - 0.5) * 0.34 + (lo - 0.5) * 0.18;
          deep = ss(deep) * (1 - 0.6 * polar);
          // backruns: soft cauliflowers, the paint pushed out of their middle to a dark frilled rim
          const bv = bb + (m1 - 0.5) * 0.15 + (hi - 0.5) * 0.05;
          const inB = ss((bv - 0.712) / 0.03) * bloomK;
          const rimB = Math.exp(-Math.pow((bv - 0.72) / 0.011, 2)) * bloomK;
          const sv = bs + (m2 - 0.5) * 0.12 + (hi - 0.5) * 0.06;
          const inS = ss((sv - 0.775) / 0.02) * bloomK;
          const rimS = Math.exp(-Math.pow((sv - 0.778) / 0.01, 2)) * bloomK;
          let dS = (0.22 + 0.44 * deep) * blot * wet;
          dS *= 1 - 0.34 * inB - 0.3 * inS;
          dS += (0.42 * rimB + 0.36 * rimS) * (0.55 + 0.45 * deep);
          dS = (dS + edge * (0.34 + 0.4 * m1) * (1 - 0.4 * polar)) * sc * gran;
          // the colour drifts: cerulean by the shore, ultramarine over the deep, turquoise wandering in
          const tq = (1 - deep) * ss((drift - 0.5) / 0.3) * 0.75;
          const sea0 = CERULEAN[0] + (TURQUOISE[0] - CERULEAN[0]) * tq, sea1 = CERULEAN[1] + (TURQUOISE[1] - CERULEAN[1]) * tq, sea2 = CERULEAN[2] + (TURQUOISE[2] - CERULEAN[2]) * tq;
          let ud = deep * 1.1 + edge * 0.3; ud = ud > 1 ? 1 : ud;
          const sr = 1 - (sea0 + (ULTRA[0] - sea0) * ud), sg = 1 - (sea1 + (ULTRA[1] - sea1) * ud), sb = 1 - (sea2 + (ULTRA[2] - sea2) * ud);

          /* the land: three colours left to run into one another */
          x = (a2 - 0.42 - (lo - 0.5) * 0.55 - (m2 - 0.5) * 0.3) / 0.22;
          const lc = ss(x);
          let dev = (206 - qd[(j * w + i) << 2]) / 64;
          dev = dev < -1 ? -1 : dev > 1.6 ? 1.6 : dev;
          const shade = dev > 0 ? dev : 0, lit = dev < 0 ? -dev : 0;
          const underGlaze = ss((g1 - 0.4) / 0.3);
          let dL = lc * (0.36 + 0.7 * shade - 0.12 * lit) * (0.62 + 0.76 * lo) * gran * (1 - 0.5 * underGlaze) * (1 - 0.5 * polar);
          if (dL < 0) dL = 0;
          const gw = ss(0.56 + (mixA - 0.5) * 4.2 - shade * 0.6 - polar * 1.2);
          const sw = ss(0.24 + (drift - 0.5) * 3.6 + (lo - 0.5) * 1.1 + shade * 0.25) * 0.85 * (1 - polar);
          let l0 = GREY[0] + (GREEN[0] - GREY[0]) * gw, l1 = GREY[1] + (GREEN[1] - GREY[1]) * gw, l2 = GREY[2] + (GREEN[2] - GREY[2]) * gw;
          l0 += (SIENNA[0] - l0) * sw; l1 += (SIENNA[1] - l1) * sw; l2 += (SIENNA[2] - l2) * sw;
          const lr = 1 - l0, lg = 1 - l1, lb = 1 - l2;
          // where the land wash ran out into the wet sea, it pools a little at its edge
          dL += Math.exp(-Math.pow((x - 0.2) / 0.25, 2)) * 0.12 * lc;

          /* the glaze over the countries travelled: translucent, bleeding a little, pooled at its own edge */
          x = (g1 - 0.4 + (hi - 0.5) * 0.14 + (m1 - 0.5) * 0.34) / 0.26;
          const gc = ss(x);
          const gEdge = Math.exp(-Math.pow((x - 0.2) / 0.24, 2));
          const dG = gc * (0.42 + 0.55 * gEdge) * (0.74 + 0.5 * lo) * gran * glazeK;

          const k = (j * w + i) << 2;
          o[k] = PR * (1 - dS * sr) * (1 - dL * lr) * (1 - dG * zr);
          o[k + 1] = PG * (1 - dS * sg) * (1 - dL * lg) * (1 - dG * zg);
          o[k + 2] = PB * (1 - dS * sb) * (1 - dL * lb) * (1 - dG * zb);
          o[k + 3] = 255;
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

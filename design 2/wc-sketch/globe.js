/* tuan photography 陳亮元 · design 2 · "Pen and wash": the globe of flights.
   Drawn the way the map is: paper, a cerulean band laid along the coasts, ochre and green washes
   a little off the pen line, the sixteen countries in the warm wash, a fine-liner outline, and
   the side away from the light shaded with hatching. Flights are pen lines with a vermilion head
   and a fading tail. Three uses: the small globe in the corner of the map, the opening (a globe
   that unrolls into the flat map) and the large globe of the Flights view, which turns by hand
   and frames one journey at a time. */
(() => {
  'use strict';
  const WC = (window.WC = window.WC || {});

  const ink = (a) => WC.ink(a);
  const PAPER = 'rgb(251, 250, 245)';
  const HEAD = 'rgb(212, 82, 60)';
  const SPHERE = { type: 'Sphere' };
  const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const easeOut = (x) => 1 - Math.pow(1 - x, 3);
  const graticule = d3.geoGraticule().step([15, 15])();
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  let tiles = null;
  function washTiles() {
    if (tiles) return tiles;
    const { OCHRE, GREEN, WARM } = WC.colours;
    tiles = { land: WC.washTile(OCHRE, GREEN, 0.48, 3), warm: WC.washTile(WARM, null, 0.4, 9) };
    return tiles;
  }

  /* ------------------------------------------------------------ the flights */

  // routes: [{ from: [lng, lat], to: [lng, lat], mode }]; ground legs keep their place but draw no flight
  WC.routes = (list) => {
    let s = 19;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    return list.map((q, i) => {
      const len = d3.geoDistance(q.from, q.to);
      return { ...q, i, interp: d3.geoInterpolate(q.from, q.to), len, dur: 1100 + len * 520, jitter: r() * 140, mode: q.mode || 'flight' };
    });
  };
  const STAGGER = 230;
  const TAIL = 0.42;
  WC.flightCycle = (flights) => Math.max(1, ...flights.map((f, i) => i * STAGGER + f.jitter + f.dur * (1 + TAIL))) + 2600;

  /* ------------------------------------------------------------ the globe, in pen and wash */

  // hatching across the side of the sphere away from the light (upper left): one layer, and a
  // closer second layer along the limb
  function hatchShade(ctx, cx, cy, R, a, lw) {
    const layers = [
      { ox: -0.3, oy: -0.34, rr: 1.05, ang: -1.02, sp: Math.max(2.6, R * 0.034), al: 0.42 },
      { ox: -0.42, oy: -0.48, rr: 1.45, ang: -0.42, sp: Math.max(2.4, R * 0.03), al: 0.36 },
    ];
    for (const L of layers) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(cx - R * 2, cy - R * 2, R * 4, R * 4);
      ctx.arc(cx + L.ox * R, cy + L.oy * R, L.rr * R, 0, Math.PI * 2, true);
      ctx.clip('evenodd');
      const dx = Math.cos(L.ang), dy = Math.sin(L.ang);
      const nx = -dy, ny = dx;
      ctx.beginPath();
      for (let s = -R * 1.2, n = 0; s <= R * 1.2; s += L.sp, n++) {
        const j = ((n * 7919) % 13) / 13 - 0.5;
        const x0 = cx + nx * s, y0 = cy + ny * s;
        const half = Math.sqrt(Math.max(0, R * R * 1.1 - s * s));
        ctx.moveTo(x0 - dx * half + dx * j * 3, y0 - dy * half + dy * j * 3);
        ctx.lineTo(x0 + dx * half - dx * j * 4, y0 + dy * half - dy * j * 4);
      }
      ctx.strokeStyle = ink(L.al * a);
      ctx.lineWidth = 0.7 * lw;
      ctx.stroke();
      ctx.restore();
    }
  }

  /*
    o: { land, travel, borders, round (1 a sphere .. 0 the flat map), grat, lw, R (a length for
         the wash widths; defaults to the projection's scale), grain (pattern scale), dim,
         r0 (the outline's radius, where the projection's scale is not the globe's), clipR (clip to
         a circle of this radius instead of the sphere's outline, for the unrolling sheet), edgeA }
  */
  WC.paintGlobe = (ctx, proj, o) => {
    const path = d3.geoPath(proj, ctx);
    const round = o.round == null ? 1 : o.round;
    const lw = o.lw || 1;
    const R = o.R || proj.scale();
    const t = washTiles();
    const g = o.grain || 1;
    const [cx, cy] = proj.translate();
    // closer in, the globe is seen through a round frame, like a magnifier laid on the page
    const lens = o.frame != null && o.frame < proj.scale() - 0.5;
    const r0 = lens ? o.frame : o.r0 || proj.scale();
    ctx.save();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath();
    if (lens) ctx.arc(cx, cy, r0, 0, Math.PI * 2); else if (o.clipR) ctx.arc(cx, cy, o.clipR, 0, Math.PI * 2); else path(SPHERE);
    // the paper of the sphere (or sheet); o.paperA lets it thin out so what lies beneath shows
    // through the sea (the opening's backdrop photograph as the globe unrolls)
    if (o.paperA !== 0) {
      ctx.save();
      if (o.paperA != null) ctx.globalAlpha *= o.paperA;
      ctx.fillStyle = PAPER; ctx.fill();
      ctx.restore();
    }
    ctx.clip();
    let lp = null;
    if (o.land) {
      // the land is traced once and laid down several times
      lp = new Path2D();
      d3.geoPath(proj, lp)(o.land);
      // the sea: a pale band along every coast, drying out to bare paper offshore
      const ws = [0.08, 0.046, 0.02], as = [0.09, 0.12, 0.15];
      for (let i = 0; i < 3; i++) { ctx.lineWidth = Math.max(1.6, ws[i] * R); ctx.strokeStyle = `rgba(132, 186, 218, ${as[i]})`; ctx.stroke(lp); }
      ctx.fillStyle = PAPER; ctx.fill(lp);
      // the land's wash, laid a little off the line, with a dried edge
      ctx.save();
      ctx.translate(1.3 * lw, 1.0 * lw);
      const pl = ctx.createPattern(t.land, 'repeat');
      pl.setTransform(new DOMMatrix().scaleSelf(0.5 * g, 0.5 * g));
      ctx.fillStyle = pl; ctx.fill(lp);
      ctx.strokeStyle = 'rgba(170, 150, 84, 0.2)'; ctx.lineWidth = 1.1 * lw; ctx.stroke(lp);
      ctx.restore();
      if (o.travel) {
        ctx.save();
        ctx.translate(-1.1 * lw, 1.5 * lw);
        ctx.beginPath();
        if (Array.isArray(o.travel)) { for (const f of o.travel) path(f); } else path(o.travel);
        const pw = ctx.createPattern(t.warm, 'repeat');
        pw.setTransform(new DOMMatrix().scaleSelf(0.5 * g, 0.5 * g));
        ctx.fillStyle = pw; ctx.fill();
        ctx.strokeStyle = 'rgba(206, 100, 84, 0.3)'; ctx.lineWidth = 1.1 * lw; ctx.stroke();
        ctx.restore();
      }
    }
    // the lakes: bare paper with the sea's pale cerulean laid along their shores, from inside
    let kp = null;
    if (o.lakes) {
      kp = new Path2D();
      d3.geoPath(proj, kp)(o.lakes);
      ctx.save();
      ctx.clip(kp);
      ctx.fillStyle = PAPER; ctx.fill(kp);
      ctx.fillStyle = 'rgba(132, 186, 218, 0.12)'; ctx.fill(kp);
      const ws = [0.05, 0.028, 0.012], as = [0.1, 0.13, 0.16];
      for (let i = 0; i < 3; i++) { ctx.lineWidth = Math.max(1.4, ws[i] * R); ctx.strokeStyle = `rgba(132, 186, 218, ${as[i]})`; ctx.stroke(kp); }
      ctx.restore();
    }
    // the mountains' hatching, drawn by the caller over the washes and under the pen
    if (o.under) o.under(ctx);
    const hatch = round * (o.hatch == null ? 1 : o.hatch);
    if (hatch > 0.02 && o.shade !== false) hatchShade(ctx, cx, cy, o.r0 || proj.scale(), hatch, lw);
    // a faint pencil graticule
    if (o.grat !== 0) {
      ctx.beginPath(); path(graticule);
      ctx.strokeStyle = `rgba(92, 88, 82, ${0.16 * (o.grat == null ? 1 : o.grat)})`; ctx.lineWidth = 0.5 * lw; ctx.stroke();
    }
    if (o.borders && o.borderA !== 0) {
      ctx.beginPath(); path(o.borders);
      ctx.setLineDash([1.6 * lw, 2.4 * lw]);
      ctx.strokeStyle = ink(0.34 * (o.borderA == null ? 1 : o.borderA)); ctx.lineWidth = 0.55 * lw; ctx.stroke();
      ctx.setLineDash([]);
    }
    if (lp) { ctx.strokeStyle = ink(0.86); ctx.lineWidth = 0.75 * lw; ctx.stroke(lp); }
    if (kp) { ctx.strokeStyle = ink(0.8); ctx.lineWidth = 0.6 * lw; ctx.stroke(kp); }
    ctx.restore();
    // the outline: one confident circle of the pen, and a second just off it where the nib lifted
    const edgeA = o.edgeA == null ? round : o.edgeA;
    if (edgeA > 0.003) {
      ctx.save();
      ctx.globalAlpha *= edgeA;
      ctx.beginPath(); ctx.arc(cx, cy, r0, 0, Math.PI * 2);
      ctx.strokeStyle = ink(0.88); ctx.lineWidth = 1.1 * lw; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx + 0.8 * lw, cy + 0.5 * lw, r0 + 0.6 * lw, -0.3, 1.9);
      ctx.strokeStyle = ink(0.4); ctx.lineWidth = 0.7 * lw; ctx.stroke();
      ctx.restore();
    }
  };

  // a hand-drawn ring, as points around 0,0 at radius 1
  function ringPts(seed) {
    let s = seed * 9301 + 49297;
    const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    const start = r() * Math.PI * 2, turns = 1.12 + r() * 0.1, n = 26;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const th = start + (turns * Math.PI * 2 * i) / n;
      const rr = 1 + 0.06 * Math.sin(3 * th + seed) + 0.07 * (i / n);
      pts.push([Math.cos(th) * rr * 1.08, Math.sin(th) * rr]);
    }
    return pts;
  }
  WC.ringPts = ringPts;

  // the flights at time t (ms into the cycle)
  //   o.focus: a Set of flight indices drawn out in order from o.focusT; the rest are dimmed traces
  WC.paintFlights = (ctx, proj, flights, t, o = {}) => {
    const path = d3.geoPath(proj, ctx);
    const alpha = o.alpha == null ? 1 : o.alpha;
    const lw = o.lw || 1;
    const centre = o.ortho && proj.invert ? proj.invert(proj.translate()) : null;
    const stagger = o.stagger || STAGGER;
    ctx.save();
    ctx.lineCap = 'round';
    flights.forEach((f, i) => {
      const focused = !o.focus || o.focus.has(i);
      const a = alpha * (focused ? 1 : o.dimA == null ? 0.16 : o.dimA);
      const arc = () => path({ type: 'LineString', coordinates: d3.range(0, 1.0001, 1 / 32).map(f.interp) });
      let g;
      if (o.still) g = 1.5;
      else if (o.focus) g = focused ? (o.focusT - ((o.seqOf && o.seqOf.get(i)) || 0) * 420 - 80) / (f.dur * 0.8) : 9;
      else g = (t - i * stagger - f.jitter) / f.dur;
      if (f.mode !== 'flight') {
        // a leg over land: a faint dotted line, no flight
        if (o.ground === false || g <= 0) return;
        ctx.beginPath(); arc();
        ctx.setLineDash([0.2, 3.2 * lw]);
        ctx.strokeStyle = ink((o.focus && focused ? 0.7 : 0.4) * a * Math.min(1, o.focus ? g * 2 : 1)); ctx.lineWidth = 1.5 * lw; ctx.stroke();
        ctx.setLineDash([]);
        return;
      }
      if (g <= 0) return;
      // the route flown stays as a trace once the flight has passed
      if (g >= 1) {
        ctx.beginPath(); arc();
        const held = o.focus && focused;
        ctx.strokeStyle = ink((held ? 0.62 : 0.22) * a * Math.min(1, (g - 1) * 3 + (o.focus ? 1 : 0)));
        ctx.lineWidth = (held ? 0.95 : 0.55) * lw; ctx.stroke();
        if (o.focus || o.still) return;
      }
      const head = Math.min(1, easeOut(Math.min(1, g)));
      const tail = o.focus ? 0 : Math.max(0, g - TAIL);
      const tailE = Math.min(head, easeOut(Math.min(1, tail)));
      if (head - tailE < 0.002) return;
      const n = 18;
      for (let k = 0; k < n; k++) {
        const a0 = tailE + ((head - tailE) * k) / n, a1 = tailE + ((head - tailE) * (k + 1)) / n;
        ctx.beginPath(); path({ type: 'LineString', coordinates: [f.interp(a0), f.interp((a0 + a1) / 2), f.interp(a1)] });
        ctx.strokeStyle = ink((o.focus ? 0.3 + 0.6 * ((k + 1) / n) : ((k + 1) / n) * 0.92) * a);
        ctx.lineWidth = (0.5 + (0.65 * (k + 1)) / n) * lw;
        ctx.stroke();
      }
      if (g < 1.05) {
        const p = f.interp(head);
        const vis = !centre || d3.geoDistance(p, centre) < Math.PI / 2 - 0.02;
        const xy = proj(p);
        if (vis && xy) {
          ctx.beginPath(); ctx.arc(xy[0], xy[1], 2.7 * lw, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(251, 250, 245, ${0.9 * a})`; ctx.fill();
          ctx.beginPath(); ctx.arc(xy[0], xy[1], 1.7 * lw, 0, Math.PI * 2);
          ctx.globalAlpha = a; ctx.fillStyle = HEAD; ctx.fill(); ctx.globalAlpha = 1;
        }
      }
    });
    ctx.restore();
  };

  // a soft cast shadow on the paper, a grey wash with a few strokes of hatching through it
  function castShadow(ctx, cx, cy, R, lw) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, 0.17);
    const sh = ctx.createRadialGradient(0, 0, 1, 0, 0, R);
    sh.addColorStop(0, 'rgba(96, 88, 80, 0.2)');
    sh.addColorStop(1, 'rgba(96, 88, 80, 0)');
    ctx.fillStyle = sh;
    ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.beginPath(); ctx.ellipse(cx + R * 0.06, cy, R * 0.72, R * 0.1, 0, 0, Math.PI * 2); ctx.clip();
    ctx.beginPath();
    const sp = Math.max(3, R * 0.07);
    for (let x = cx - R; x < cx + R; x += sp) { ctx.moveTo(x, cy + R * 0.12); ctx.lineTo(x + R * 0.12, cy - R * 0.12); }
    ctx.strokeStyle = ink(0.3); ctx.lineWidth = 0.6 * lw; ctx.stroke();
    ctx.restore();
  }

  /* ------------------------------------------------------------ the small globe in the corner */

  WC.Globe = class {
    constructor(canvas, o) {
      this.c = canvas;
      this.ctx = canvas.getContext('2d');
      this.o = o; // { land, travel, flights, reduce: () => bool }
      this.lon = -100;
      this.t0 = performance.now();
      this.raf = 0;
      this.running = false;
      this.size = 0;
      this.proj = d3.geoOrthographic().clipAngle(90).precision(0.6);
    }
    resize(css) {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      this.dpr = dpr;
      this.size = css;
      this.c.width = Math.round(css * dpr);
      this.c.height = Math.round(css * dpr);
      this.draw(performance.now());
    }
    draw(now) {
      const { ctx, size: s, dpr } = this;
      if (!s) return;
      const still = this.o.reduce();
      const R = s * 0.43;
      const lw = s < 130 ? 0.75 : 1;
      this.proj.scale(R).translate([s / 2, s * 0.46]).rotate([this.lon, -18]);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, s, s);
      castShadow(ctx, s * 0.53, s * 0.93, R * 0.9, lw);
      WC.paintGlobe(ctx, this.proj, { land: this.o.land, travel: this.o.travel, lw, grain: 0.6, R: R * 1.2 });
      const t = still ? 0 : (now - this.t0) % WC.flightCycle(this.o.flights);
      WC.paintFlights(ctx, this.proj, this.o.flights, t, { still, ortho: true, lw: s < 130 ? 0.75 : 0.95, ground: false });
    }
    loop(now) {
      if (!this.running) return;
      const dt = Math.min(64, now - (this.last || now));
      this.last = now;
      this.lon += dt * 0.006;
      this.draw(now);
      this.raf = requestAnimationFrame((n) => this.loop(n));
    }
    start() {
      if (this.running || this.o.reduce()) { this.draw(performance.now()); return; }
      this.running = true;
      this.last = 0;
      this.raf = requestAnimationFrame((n) => this.loop(n));
    }
    stop() { this.running = false; cancelAnimationFrame(this.raf); }
    replay() { this.t0 = performance.now(); if (this.o.reduce()) this.draw(this.t0); }
  };

  /* ------------------------------------------------------------ the large globe of the Flights view */

  /*
    At rest, flights leave Taipei for every other place he has been, a few at a time. Following a
    journey, the camera travels it again leg by leg: it turns and closes in on each leg, the leg is
    drawn from where it set out to where it arrived (a flight as a lifted arc, a train as the
    railway's ticked line, a bus or a car as a dashed pen line), and each place is ringed and
    lettered as it is reached. At the end the camera draws back to show the whole journey.

    o: { land, travel, borders (110m), hi: { land, travel, borders } (50m, once loaded), home: [lng, lat],
         places: [[lng, lat]], reduce(), letter(text) -> sprite, onLeg(i),
         lakes (Natural Earth 50m, once loaded), moreLakes() -> Promise<GeoJSON|null> (the 10m supplement), relief() -> { coarse, fine } images (for the hatching) }
    focus({ key, legs: [{ from, to, mode, fromName, toName, fromHome, toHome }] } | null)
  */
  const RAD = Math.PI / 180;
  const BASE = 0.4;      // the globe's radius at k = 1, as a share of the canvas
  const FRAME = 0.47;    // past this radius the globe is seen through a round frame
  const HI_K = 3;        // closer than this, the 50m drawing of the region in view
  const K_MIN = 0.92, K_MAX = 40;
  const CAP = 7000;      // the longest replay, start to end (his call: never more than 7 s)
  const MAXP = 512;
  const expoInOut = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2);
  const outBack = (x) => { const c = 2.1; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  const vec = (ll) => { const l = ll[0] * RAD, p = ll[1] * RAD, c = Math.cos(p); return [c * Math.cos(l), c * Math.sin(l), Math.sin(p)]; };
  const viewRad = (k) => Math.asin(Math.min(1, FRAME / (BASE * k)));
  const WASH = (a) => `rgba(226, 122, 98, ${a})`;
  const rings = new Map();
  const ringOf = (seed) => { let r = rings.get(seed); if (!r) { r = ringPts(seed); rings.set(seed, r); } return r; };

  // the camera that frames a set of places: the centre of the smallest cap round them (near
  // enough), and how close it comes
  function fit(pts, f) {
    let c = pts[0], span = 0;
    if (pts.length > 1) {
      let a = pts[0], b = pts[0];
      for (const p of pts) if (d3.geoDistance(pts[0], p) > d3.geoDistance(pts[0], a)) a = p;
      for (const p of pts) if (d3.geoDistance(a, p) > d3.geoDistance(a, b)) b = p;
      span = d3.geoDistance(a, b) / 2;
      c = d3.geoInterpolate(a, b)(0.5);
      for (const p of pts) {
        const d = d3.geoDistance(c, p);
        if (d > span) { const r = (span + d) / 2; c = d3.geoInterpolate(c, p)((d - r) / d); span = r; }
      }
    }
    const k = span < 1e-5 ? K_MAX : (f * FRAME) / (BASE * Math.sin(Math.min(span, Math.PI / 2)));
    return { c, k: clamp(k, K_MIN, K_MAX) };
  }
  // the camera's way between two views: van Wijk and Nuij's smooth zoom, drawing back as far as
  // the distance asks and closing in again, with the view's width in radians
  const WIDE = (2 * FRAME) / BASE;
  const zoomPath = (a, b) => d3.interpolateZoom([0, 0, WIDE / a.k], [d3.geoDistance(a.c, b.c), 0, WIDE / b.k]);
  const camDur = (a, b) => clamp(zoomPath(a, b).duration * 0.62, 700, 1500);

  // a piece of the world: whatever of `obj` lies within r (radians) of centre, as GeoJSON
  function capClip(obj, centre, r) {
    const proj = d3.geoEquirectangular().scale(180 / Math.PI).translate([0, 0]).rotate([-centre[0], -centre[1]]).clipAngle(r / RAD).precision(0);
    const inv = d3.geoRotation([-centre[0], -centre[1]]).invert;
    const polys = [], lines = [];
    let ring = null, set = null;
    const sink = {
      point(x, y) { ring.push(inv([x, -y])); },
      lineStart() { ring = []; },
      lineEnd() {
        if (set) { if (ring.length > 2) { ring.push(ring[0]); set.push(ring); } } else if (ring.length > 1) lines.push(ring);
        ring = null;
      },
      polygonStart() { set = []; },
      polygonEnd() {
        // outer rings and holes: a hole, read on its own, covers more than half the sphere
        const outer = [], holes = [];
        for (const rg of set) (d3.geoArea({ type: 'Polygon', coordinates: [rg] }) > 2 * Math.PI ? holes : outer).push([rg]);
        for (const h of holes) {
          const o = outer.find((p) => d3.geoContains({ type: 'Polygon', coordinates: p }, h[0][0]));
          if (o) o.push(h[0]);
        }
        polys.push(...outer);
        set = null;
      },
      sphere() {},
    };
    d3.geoStream(obj, proj.stream(sink));
    return polys.length ? { type: 'MultiPolygon', coordinates: polys } : lines.length ? { type: 'MultiLineString', coordinates: lines } : null;
  }

  function makeRoute(a, b, mode, seed) {
    const A = vec(a), B = vec(b);
    const d = Math.acos(clamp(A[0] * B[0] + A[1] * B[1] + A[2] * B[2], -1, 1));
    let s = seed * 7919 + 17;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    // a flight across the Pacific is bowed partway toward a steady eastward (or westward) course,
    // so it leaves Asia low across the page, about 20 to 30 degrees, rather than climbing toward
    // the Arctic as the true shortest way does (his call, 2026-10-02)
    let dl = b[0] - a[0];
    if (dl > 180) dl -= 360; else if (dl < -180) dl += 360;
    const pacific = mode === 'flight' && Math.abs(dl) > 90 && ((a[0] > 60 && b[0] < -30) || (a[0] < -30 && b[0] > 60));
    return {
      bend: pacific ? 0.6 : 0, lon0: a[0], dl, my0: Math.log(Math.tan(Math.PI / 4 + (a[1] * RAD) / 2)), my1: Math.log(Math.tan(Math.PI / 4 + (b[1] * RAD) / 2)),
      A, B, d, sinD: Math.sin(d), mode, from: a, to: b, Bv: B,
      H: mode === 'flight' ? 0.03 + 0.15 * Math.sin(d / 2) : 0,
      f1: Math.PI * 2 * (1.3 + r()), p1: r() * 6.283, f2: Math.PI * 2 * (3.6 + r() * 2), p2: r() * 6.283,
    };
  }

  // a point u (0..1) along a route, on the unit sphere: the great circle, or for a flight across
  // the Pacific the great circle bowed toward the steady course (a rhumb line). Shared by the
  // Flights globe and the opening's flat map, so the two agree. Written into CXYZ.
  const CXYZ = [0, 0, 0];
  function course(r, u) {
    const A = r.A, B = r.B;
    let x, y, z;
    if (r.sinD < 1e-7) { x = A[0]; y = A[1]; z = A[2]; } else {
      const a = Math.sin((1 - u) * r.d) / r.sinD, b = Math.sin(u * r.d) / r.sinD;
      x = a * A[0] + b * B[0]; y = a * A[1] + b * B[1]; z = a * A[2] + b * B[2];
      if (r.bend) {
        const lo = (r.lon0 + r.dl * u) * RAD, la = 2 * Math.atan(Math.exp(r.my0 + (r.my1 - r.my0) * u)) - Math.PI / 2;
        const k = r.bend, cl = Math.cos(la);
        x = (1 - k) * x + k * cl * Math.cos(lo); y = (1 - k) * y + k * cl * Math.sin(lo); z = (1 - k) * z + k * Math.sin(la);
        const m = Math.hypot(x, y, z) || 1; x /= m; y /= m; z /= m;
      }
    }
    CXYZ[0] = x; CXYZ[1] = y; CXYZ[2] = z;
    return CXYZ;
  }

  // a flight's travelling mark: a small airliner drawn in ink, seen from above, nose along
  // the way it flies (ang), on a paper halo so it reads over any wash
  function drawPlane(ctx, x, y, ang, s, a) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
    // nose at +x: fuselage, swept wings, tailplane
    ctx.beginPath();
    ctx.moveTo(5.2, 0);
    ctx.quadraticCurveTo(4.6, -0.7, 3.4, -0.75);
    ctx.lineTo(0.9, -0.75); ctx.lineTo(-1.4, -5.4); ctx.lineTo(-2.5, -5.4); ctx.lineTo(-1.0, -0.75);
    ctx.lineTo(-3.6, -0.6); ctx.lineTo(-4.7, -2.3); ctx.lineTo(-5.4, -2.3); ctx.lineTo(-4.9, -0.45);
    ctx.lineTo(-5.4, 0);
    ctx.lineTo(-4.9, 0.45); ctx.lineTo(-5.4, 2.3); ctx.lineTo(-4.7, 2.3); ctx.lineTo(-3.6, 0.6);
    ctx.lineTo(-1.0, 0.75); ctx.lineTo(-2.5, 5.4); ctx.lineTo(-1.4, 5.4); ctx.lineTo(0.9, 0.75);
    ctx.lineTo(3.4, 0.75);
    ctx.quadraticCurveTo(4.6, 0.7, 5.2, 0);
    ctx.closePath();
    ctx.lineJoin = 'round';
    ctx.strokeStyle = `rgba(251, 250, 245, ${0.95 * a})`; ctx.lineWidth = 2.4; ctx.stroke();
    ctx.fillStyle = ink(0.9 * a); ctx.fill();
    ctx.restore();
  }

  /* ------------------------------------------------------------ the traffic: a few flights always in the air */

  /*
    On the home map a handful of his flights are always under way (his request, 2026-10-03: the
    page was otherwise too still): never all at once, up to six at a time, each on its own route
    at its own pace, a new one leaving a moment after one lands, out and home by turns, no route
    twice in a row. Drawn on its own canvas over the pen and under the books, in the opening's
    hand: the fine ink line flown so far with a thread of wash beside it, warming to vermilion
    behind the small airliner, and a ring of the pen where it lands; then the line fades. The
    routes are the same bowed courses the globe and the opening fly.
    o: { canvas, flights, LON0, SY, view() -> { k (px per degree), tx, ty, W, H, dpr }, reduce() }
  */
  WC.traffic = (o) => {
    const c = o.canvas, ctx = c.getContext('2d');
    const SY = o.SY || 1;
    const AT_ONCE = 6, GAP = [500, 1600], LINGER = 1500;   // more in the air, leaving sooner (his call)
    const legs = [];
    const seen = new Set();
    for (const f of o.flights) {
      if (f.mode !== 'flight') continue;
      const key = [f.from, f.to].map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).sort().join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      for (const [a, b] of [[f.from, f.to], [f.to, f.from]]) {
        const r = makeRoute(a, b, 'flight', legs.length + 41);
        const n = 72, U = new Float32Array(n), V = new Float32Array(n);
        let prev = 0;
        for (let i = 0; i < n; i++) {
          const q = course(r, i / (n - 1));
          const lon = Math.atan2(q[1], q[0]) / RAD, lat = Math.asin(clamp(q[2], -1, 1)) / RAD;
          let u = ((((lon - o.LON0) % 360) + 540) % 360) - 180;
          if (i) { while (u - prev > 180) u -= 360; while (u - prev < -180) u += 360; }
          U[i] = u; V[i] = lat * SY; prev = u;
        }
        const len = d3.geoDistance(a, b);
        // about 4.5s for a short hop, 11s across the Pacific
        legs.push({ U, V, n, key, to: b, dur: 4000 + Math.min(1, len / 2.1) * 7000, seed: legs.length + 3 });
      }
    }
    const active = [];
    let recent = [];
    let raf = 0, running = false, nextAt = 0, pausedAt = 0;
    const PX = new Float32Array(80), PY = new Float32Array(80);
    // along the way at an even pace, easing out of the gate and into the landing
    const pace = (x) => x - (Math.sin(2 * Math.PI * x) / (2 * Math.PI)) * 0.35;
    function launch(now) {
      const free = legs.filter((L) => !active.some((f) => f.L === L) && !recent.includes(L.key));
      const pool = free.length ? free : legs.filter((L) => !active.some((f) => f.L === L));
      if (!pool.length) return;
      const L = pool[Math.floor(Math.random() * pool.length)];
      active.push({ L, t0: now });
      recent.push(L.key);
      if (recent.length > Math.max(1, Math.floor(legs.length / 2) - AT_ONCE)) recent.shift();
    }
    function frame(now) {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      const v = o.view();
      const cw = Math.round(v.W * v.dpr), ch = Math.round(v.H * v.dpr);
      if (c.width !== cw || c.height !== ch) { c.width = cw; c.height = ch; }
      ctx.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
      ctx.clearRect(0, 0, v.W, v.H);
      if (active.length < AT_ONCE && now >= nextAt) { launch(now); nextAt = now + GAP[0] + Math.random() * (GAP[1] - GAP[0]); }
      const k = v.k;
      const lw = v.W < 700 ? 0.95 : 1.15;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.save();
      // the world's own width: nothing is drawn past its edges
      ctx.beginPath(); ctx.rect(v.tx - 180 * k, v.ty - 90 * SY * k, 360 * k, 180 * SY * k); ctx.clip();
      for (let fi = active.length - 1; fi >= 0; fi--) {
        const f = active[fi];
        const g = (now - f.t0) / f.L.dur;
        const a = g <= 1 ? 1 : 1 - (now - f.t0 - f.L.dur) / LINGER;
        if (a <= 0) { active.splice(fi, 1); continue; }
        const head = pace(Math.min(1, g));
        const L = f.L;
        const lo = Math.min(L.U[0], L.U[L.n - 1]), hi = Math.max(L.U[0], L.U[L.n - 1]);
        for (const shift of [-360, 0, 360]) {
          if (hi + shift < -182 || lo + shift > 182) continue;
          // the flown part, sampled to the head
          const m = Math.max(2, Math.ceil(head * (L.n - 1)) + 1);
          for (let i = 0; i < m; i++) {
            let j = i;
            if (i === m - 1) j = head * (L.n - 1);
            const j0 = Math.min(L.n - 2, Math.floor(j)), fr = j - j0;
            const U = L.U[j0] + (L.U[j0 + 1] - L.U[j0]) * fr, V = L.V[j0] + (L.V[j0 + 1] - L.V[j0]) * fr;
            PX[i] = v.tx + (U + shift) * k; PY[i] = v.ty - V * k;
          }
          const stroke = () => { ctx.beginPath(); ctx.moveTo(PX[0], PY[0]); for (let i = 1; i < m; i++) ctx.lineTo(PX[i], PY[i]); };
          ctx.save(); ctx.translate(1.1 * lw, 1.3 * lw);
          stroke(); ctx.strokeStyle = WASH(0.2 * a); ctx.lineWidth = 3.2 * lw; ctx.stroke();
          ctx.restore();
          stroke(); ctx.strokeStyle = ink(0.62 * a); ctx.lineWidth = 0.95 * lw; ctx.stroke();
          if (g < 1) {
            // the last stretch warms to vermilion toward the plane
            const tl = Math.max(1, Math.round(m * 0.3));
            for (let i = Math.max(1, m - tl); i < m; i++) {
              const q = 1 - (m - i) / tl;
              ctx.beginPath(); ctx.moveTo(PX[i - 1], PY[i - 1]); ctx.lineTo(PX[i], PY[i]);
              ctx.strokeStyle = `rgba(212, 82, 60, ${0.9 * q * a})`; ctx.lineWidth = (0.95 + 0.6 * q) * lw; ctx.stroke();
            }
            let j = m - 1, back = 0;
            while (j > 0 && back < 5 * lw) { back += Math.hypot(PX[j] - PX[j - 1], PY[j] - PY[j - 1]); j--; }
            const ang = Math.atan2(PY[m - 1] - PY[j], PX[m - 1] - PX[j]);
            drawPlane(ctx, PX[m - 1], PY[m - 1], ang, 1.3 * lw, a);
          } else {
            // landed: a ring of the pen pops in where it came down, and fades with the line
            const x = Math.min(1, (now - f.t0 - L.dur) / 460);
            const sc = outBack(x);
            const pts = ringOf(L.seed);
            const r = 5 * lw * sc;
            ctx.save();
            ctx.translate(PX[m - 1], PY[m - 1]);
            ctx.beginPath();
            for (let i = 0; i < pts.length; i++) { const p = pts[i]; if (i) ctx.lineTo(p[0] * r, p[1] * r); else ctx.moveTo(p[0] * r, p[1] * r); }
            ctx.strokeStyle = ink(0.84 * a); ctx.lineWidth = 1.1 * lw; ctx.stroke();
            ctx.beginPath(); ctx.arc(0, 0, 1.6 * lw, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(212, 82, 60, ${0.85 * a})`; ctx.fill();
            ctx.restore();
          }
        }
      }
      ctx.restore();
    }
    return {
      start() {
        if (running || o.reduce() || !legs.length) return;
        running = true;
        const now = performance.now();
        // flights in the air when the page was left carry on from where they were
        if (pausedAt) { const dt = now - pausedAt; for (const f of active) f.t0 += dt; nextAt += dt; pausedAt = 0; }
        raf = requestAnimationFrame(frame);
      },
      stop() {
        if (!running) return;
        running = false;
        cancelAnimationFrame(raf);
        pausedAt = performance.now();
      },
      clear() { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, c.width, c.height); },
    };
  };

  /* ------------------------------------------------------------ the mountains, hatched in pen, close in */

  /*
    Close in, the Flights globe hatches the mountains from the same shaded relief, in the same short
    strokes of the pen, as the flat map (paint.js): parallel lines at one angle, a light slope
    every fourth line, a steeper one every second, the steepest all of them, each run broken into
    short strokes a hair off true, kept off the sea and the lakes. The strokes are worked out once
    per tile of a Web Mercator grid (conformal, so the lines keep their angle and spacing on the
    screen), at the zoom level whose tile pixel is about a screen pixel, and kept as points on the
    sphere; each frame only turns them with the camera and draws them.
  */
  const HT = 256;                                  // samples across a tile
  const HSP = 3.1;                                 // samples between the lines (as paint.js)
  const HANG = -1.0;                               // the lines' angle (as paint.js)
  const HLEVELS = [0.17, 0.62, 0.36, 0.62];
  const mercY = (lat) => Math.log(Math.tan(Math.PI / 4 + (clamp(lat, -85, 85) * RAD) / 2)) / RAD;
  const latOfY = (y) => (2 * Math.atan(Math.exp(y * RAD)) - Math.PI / 2) / RAD;
  const HYMAX = mercY(70);                         // no hatching nearer the poles than 70°, as the map
  const polyIndex = new WeakMap();
  // the polygons of a GeoJSON object, each with its box, so a tile draws only those it touches
  function polysOf(obj) {
    if (!obj) return [];
    let list = polyIndex.get(obj);
    if (list) return list;
    list = [];
    const add = (g) => {
      if (!g) return;
      if (g.type === 'FeatureCollection') g.features.forEach((f) => add(f.geometry));
      else if (g.type === 'Feature') add(g.geometry);
      else if (g.type === 'GeometryCollection') g.geometries.forEach(add);
      else if (g.type === 'Polygon' || g.type === 'MultiPolygon') {
        for (const poly of g.type === 'Polygon' ? [g.coordinates] : g.coordinates) {
          let w = 180, e = -180, s = 90, n = -90;
          for (const [x, y] of poly[0]) { if (x < w) w = x; if (x > e) e = x; if (y < s) s = y; if (y > n) n = y; }
          list.push({ poly, w, e, s, n });
        }
      }
    };
    add(obj);
    polyIndex.set(obj, list);
    return list;
  }
  // the relief image as a tile reads it; the first read of a large image decodes it (a fifth of
  // a second for the finer one), so the view does that once, idle, before any journey is followed
  const reliefSrc = (img) => ({ img, w: img.width });
  function warmImage(img) {
    const c = scratch().a;
    c.drawImage(img, 0, 0, 2, 2, 0, 0, 2, 2);
    c.getImageData(0, 0, 1, 1);
  }
  let hScratch = null;
  function scratch() {
    if (!hScratch) {
      const a = document.createElement('canvas'); a.width = a.height = HT;
      const b = document.createElement('canvas'); b.width = b.height = HT;
      // (the relief is sampled on an ordinary canvas: drawing the large image into a CPU-backed
      // one is slower still; the land is traced on a CPU-backed one)
      hScratch = { a: a.getContext('2d'), b: b.getContext('2d', { willReadFrequently: true }) };
    }
    return hScratch;
  }
  function hatchTile(z, tx, ty, cut, land, lakes, seed) {
    const T = 360 / (1 << z), lon0 = -180 + tx * T, y0 = 180 - ty * T, px = T / HT;
    const lonE = lon0 + T, latN = latOfY(y0), latS = latOfY(y0 - T);
    const { a: rc, b: mc } = scratch();
    // the relief under the tile, laid in strips so the Mercator rows find their latitudes
    rc.setTransform(1, 0, 0, 1, 0, 0);
    rc.fillStyle = 'rgb(206,206,206)'; rc.fillRect(0, 0, HT, HT);
    rc.imageSmoothingEnabled = true; rc.imageSmoothingQuality = 'high';
    const ri = cut.w / 360;
    const STRIP = 16;
    for (let r0 = 0; r0 < HT; r0 += STRIP) {
      const la = latOfY(y0 - r0 * px), lb = latOfY(y0 - (r0 + STRIP) * px);
      rc.drawImage(cut.img, (lon0 + 180) * ri, (90 - la) * ri, T * ri, Math.max(0.01, (la - lb) * ri), 0, r0, HT, STRIP);
    }
    const rd = rc.getImageData(0, 0, HT, HT).data;
    // the land, less its lakes
    mc.setTransform(1, 0, 0, 1, 0, 0);
    mc.fillStyle = '#000'; mc.fillRect(0, 0, HT, HT);
    const trace = (list, colour) => {
      mc.beginPath();
      let any = false;
      for (const p of list) {
        if (p.e < lon0 || p.w > lonE || p.n < latS || p.s > latN) continue;
        any = true;
        for (const ring of p.poly) {
          for (let i = 0; i < ring.length; i++) {
            const x = (ring[i][0] - lon0) / px, y = (y0 - mercY(ring[i][1])) / px;
            if (i) mc.lineTo(x, y); else mc.moveTo(x, y);
          }
          mc.closePath();
        }
      }
      if (any) { mc.fillStyle = colour; mc.fill('evenodd'); }
    };
    trace(polysOf(land), '#fff');
    trace(polysOf(lakes), '#000');
    const md = mc.getImageData(0, 0, HT, HT).data;
    // the lines, anchored to the world so neighbouring tiles agree
    let s = (seed ^ (z * 73856093) ^ (tx * 19349663) ^ (ty * 83492791)) | 0;
    const rnd = () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const dx = Math.cos(HANG), dy = Math.sin(HANG), nx = -dy, ny = dx;
    const gx0 = tx * HT, gy0 = ty * HT;
    const cs = [[gx0, gy0], [gx0 + HT, gy0], [gx0, gy0 + HT], [gx0 + HT, gy0 + HT]];
    const ns = cs.map(([x, y]) => x * nx + y * ny), ts = cs.map(([x, y]) => x * dx + y * dy);
    const k0 = Math.floor(Math.min(...ns) / HSP), k1 = Math.ceil(Math.max(...ns) / HSP);
    const t0 = Math.floor(Math.min(...ts)), t1 = Math.ceil(Math.max(...ts));
    const flat = [];
    const at = (u, v) => { flat.push(u, v); };
    for (let k = k0; k <= k1; k++) {
      const thr = HLEVELS[((k % 4) + 4) % 4];
      const ox = nx * k * HSP - gx0, oy = ny * k * HSP - gy0;
      let run = -Infinity;
      for (let t = t0; t <= t1 + 1; t++) {
        const x = ox + dx * t, y = oy + dy * t;
        let on = false;
        if (t <= t1 && x >= 0 && y >= 0 && x < HT && y < HT) {
          const q = ((y | 0) * HT + (x | 0)) << 2;
          if (md[q] > 200) on = (206 - rd[q]) / 64 > thr;
        }
        if (on && run === -Infinity) run = t;
        if (!on && run !== -Infinity) {
          let a0 = run;
          const end = t - 1;
          while (a0 < end - 1.2) {
            const L = 5 + rnd() * 6;
            const a1 = Math.min(end, a0 + L);
            const j0 = (rnd() - 0.5) * 0.7, j1 = (rnd() - 0.5) * 0.7;
            at(ox + nx * j0 + dx * a0, oy + ny * j0 + dy * a0);
            at(ox + nx * j1 + dx * a1, oy + ny * j1 + dy * a1);
            a0 = a1 + 1.1 + rnd() * 1.4;
          }
          run = -Infinity;
        }
      }
    }
    // as points on the unit sphere
    const P = new Float32Array((flat.length / 2) * 3);
    for (let i = 0, j = 0; i < flat.length; i += 2, j += 3) {
      const lon = (lon0 + flat[i] * px) * RAD, lat = latOfY(y0 - flat[i + 1] * px) * RAD, c = Math.cos(lat);
      P[j] = c * Math.cos(lon); P[j + 1] = c * Math.sin(lon); P[j + 2] = Math.sin(lat);
    }
    return { P, n: flat.length / 4, c: [lon0 + T / 2, latOfY(y0 - T / 2)], r: T * 0.75 * RAD };
  }

  WC.BigGlobe = class {
    constructor(canvas, o) {
      this.c = canvas;
      this.ctx = canvas.getContext('2d');
      this.o = o;
      this.rot = [-100, -18];
      this.k = 1;
      this.vel = [0, 0];
      this.size = 0;
      this.running = false;
      this.touched = 0;
      this.dragging = false;
      this.proj = d3.geoOrthographic().clipAngle(90).precision(0.5);
      this.tw = null;          // the camera's move under way
      this.rp = null;          // the journey being travelled
      this.ghost = null;       // the one just left, fading
      this.idleT0 = performance.now();
      this.regions = new Map();
      this.legNow = -2;
      this.cam = { cx: 0, cy: 0, R: 1, rf: 1, cl: 1, sl: 0, cp: 1, sp: 0, lw: 1, lens: false };
      this.BX = new Float32Array(MAXP); this.BY = new Float32Array(MAXP);
      this.PX = new Float32Array(MAXP); this.PY = new Float32Array(MAXP);
      this.PV = new Uint8Array(MAXP); this.PU = new Float32Array(MAXP);
      this.boxes = [];
      this.htiles = new Map();   // the mountains' hatching, by tile
      this.hq = new Map();       // tiles waiting to be made
      this.hTimer = 0;
      this.frameNo = 0;
      this.bind();
      this.setPlaces();
    }

    /* -------------------------------- setting up */

    setPlaces() {
      const home = this.o.home;
      const pl = (this.o.places || []).map((ll) => ({ ll, d: d3.geoDistance(home, ll), b: Math.atan2(ll[0] - home[0], ll[1] - home[1]) }));
      // launched in turn round the compass, so that one flight never follows its neighbour
      pl.sort((a, b) => a.b - b.b);
      // each launch about half the compass from the one before it
      const n = pl.length;
      let inv = 1;
      const half = Math.floor(n / 2);
      for (let q = 1; q < n; q++) if ((half * q) % n === 1) { inv = q; break; }
      this.GAP = 880;
      this.idle = pl.map((p, i) => ({
        ...this.route(home, p.ll, 'flight', i + 11),
        slot: (i * inv) % Math.max(1, n),
        D: 1500 + 900 * Math.min(1, p.d / 1.9),
      }));
      // all fifteen leave Taipei together; the near ones land first. Then a pause, and again.
      this.PERIOD = Math.max(...this.idle.map((f) => f.D), 0) + 2400 + 1400;
      this.homeV = vec(home);
    }
    route(a, b, mode, seed) { return makeRoute(a, b, mode, seed); }
    resize(css) {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      this.dpr = dpr;
      this.size = css;
      this.c.width = Math.round(css * dpr);
      this.c.height = Math.round(css * dpr);
      this.draw(performance.now());
    }
    bind() {
      const c = this.c;
      let last = null;
      c.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        last = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId, moved: false };
        this.vel = [0, 0];
      });
      c.addEventListener('pointermove', (e) => {
        if (!last || e.pointerId !== last.id) return;
        const dx = e.clientX - last.x, dy = e.clientY - last.y;
        if (!last.moved) {
          // on touch, a mostly vertical move is the page scrolling, not the globe turning
          if (e.pointerType !== 'mouse' && Math.abs(dy) > Math.abs(dx)) { last = null; return; }
          if (Math.hypot(dx, dy) < 3) return;
          last.moved = true;
          this.dragging = true;
          this.tw = null;
          try { c.setPointerCapture(e.pointerId); } catch (err) { /* fine */ }
          c.classList.add('is-turning');
        }
        const now = performance.now();
        const R = this.cam.R || 200;
        const dl = (dx / R) * 57, dp = (-dy / R) * 57;
        this.rot = [this.rot[0] + dl, clamp(this.rot[1] + dp, -75, 75)];
        const dt = Math.max(8, now - last.t);
        this.vel = this.o.reduce() ? [0, 0] : [dl / dt, dp / dt];
        last.x = e.clientX; last.y = e.clientY; last.t = now;
        this.touched = now;
        this.kick();
      });
      const end = (e) => {
        if (!last || (e && e.pointerId !== last.id)) return;
        if (performance.now() - last.t > 80) this.vel = [0, 0];
        last = null;
        this.dragging = false;
        c.classList.remove('is-turning');
        this.touched = performance.now();
        this.kick();
      };
      c.addEventListener('pointerup', end);
      c.addEventListener('pointercancel', end);
      c.addEventListener('wheel', (e) => {
        e.preventDefault();
        this.tw = null;
        this.k = this.rp ? clamp(this.k * Math.exp(-e.deltaY * 0.0016), K_MIN, K_MAX) : clamp(this.k * Math.exp(-e.deltaY * 0.0012), 0.82, 1.18);
        this.touched = performance.now();
        this.kick();
      }, { passive: false });
    }

    /* -------------------------------- the camera */

    get centre() { return [-this.rot[0], -this.rot[1]]; }
    toward(to, dur, now = performance.now()) {
      const from = { c: this.centre, k: this.k };
      if (dur <= 1 || this.o.reduce()) { this.tw = null; this.setCam(to.c, to.k); this.kick(); return; }
      const dist = d3.geoDistance(from.c, to.c);
      this.tw = { from, to, t0: now, dur, dist, z: zoomPath(from, to), at: d3.geoInterpolate(from.c, to.c) };
      this.vel = [0, 0];
      this.kick();
    }
    setCam(c, k) {
      this.rot = [-c[0], -clamp(c[1], -80, 80)];
      this.k = k;
    }
    stepCamera(now, dt) {
      if (this.tw) {
        const w = this.tw;
        const x = Math.min(1, (now - w.t0) / w.dur);
        const e = expoInOut(x);
        const v = w.z(e);
        const c = w.dist > 1e-9 ? w.at(clamp(v[0] / w.dist, 0, 1)) : w.to.c;
        // keep the longitude continuous with where it was turned from
        const lon = -this.rot[0];
        const dl = ((c[0] - lon) % 360 + 540) % 360 - 180;
        this.rot = [-(lon + dl), -c[1]];
        this.k = clamp(WIDE / v[2], 0.5, K_MAX);
        if (x >= 1) { this.tw = null; this.k = w.to.k; }
        return;
      }
      if (this.dragging) return;
      if (Math.abs(this.vel[0]) + Math.abs(this.vel[1]) > 0.0005) {
        this.rot = [this.rot[0] + this.vel[0] * dt, clamp(this.rot[1] + this.vel[1] * dt, -75, 75)];
        const f = Math.pow(0.94, dt / 16);
        this.vel = [this.vel[0] * f, this.vel[1] * f];
        this.touched = now;
        return;
      }
      // at rest, a few seconds after a hand has turned it, the globe goes back to Taipei
      if (!this.rp && !this.o.reduce() && now - this.touched > 3200) {
        const off = d3.geoDistance(this.centre, this.o.home) > 0.004 || Math.abs(this.k - 1) > 0.004;
        if (off) this.toward({ c: this.o.home, k: 1 }, clamp(900 + 700 * d3.geoDistance(this.centre, this.o.home), 1000, 2000), now);
      }
    }

    /* -------------------------------- following a journey */

    focus(j) {
      const now = performance.now();
      if (j && this.rp && this.rp.key === j.key) {
        // the same journey, named again (the language changed): keep its place
        j.legs.forEach((q, i) => { const L = this.rp.legs[i]; if (L) { L.fromName = q.fromName; L.toName = q.toName; } });
        for (const st of this.rp.stops) { const q = j.legs[st.leg]; if (q) st.name = st.end ? q.toName : q.fromName; }
        return;
      }
      if (this.rp) this.ghost = { rp: this.rp, rt: now - this.rp.t0, t0: now };
      this.rp = null;
      this.legNow = -2;
      if (!j) {
        this.idleT0 = now;
        this.touched = 0;
        this.toward({ c: this.o.home, k: 1 }, clamp(900 + 600 * d3.geoDistance(this.centre, this.o.home), 1000, 1900), now);
        this.leg(-1);
        return;
      }
      this.rp = this.build(j, now);
      this.prepare(this.rp);
      this.hPrepare(this.rp);
      if (this.o.reduce()) {
        // all at once, framed, without the camera's flight
        this.rp.t0 = now - this.rp.total - 1;
        this.setCam(this.rp.overview.c, this.rp.overview.k);
        this.rp.next = this.rp.keys.length;
      }
      this.kick();
    }
    // which country a place lies in (looking a little around it, for airports on the shore)
    countryAt(ll) {
      const fs = this.o.countries || [];
      if (!fs.length) return null;
      this._cAt = this._cAt || new Map();
      const k = ll[0].toFixed(3) + ',' + ll[1].toFixed(3);
      if (this._cAt.has(k)) return this._cAt.get(k);
      let hit = null;
      const tries = [[0, 0], [0.25, 0], [-0.25, 0], [0, 0.25], [0, -0.25], [0.6, 0], [-0.6, 0], [0, 0.6], [0, -0.6]];
      for (const [dx, dy] of tries) { hit = fs.find((f) => d3.geoContains(f, [ll[0] + dx, ll[1] + dy])); if (hit) break; }
      const id = hit ? String(hit.id || hit.properties.name) : null;
      if (hit) { this._cFeat = this._cFeat || new Map(); this._cFeat.set(id, hit); }
      this._cAt.set(k, id);
      return id;
    }
    // the corners of a country's land near a place: its far-flung parts (overseas islands,
    // Alaska, Hawaii) are left out so the frame stays on the country he travelled in
    countryPts(id, near) {
      const f = this._cFeat && this._cFeat.get(id);
      if (!f) return [];
      const g = f.geometry;
      const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
      const pts = [];
      for (const poly of polys) {
        const part = { type: 'Polygon', coordinates: poly };
        if (d3.geoDistance(d3.geoCentroid(part), near) > 0.36) continue;
        const [[w, s], [e, n]] = d3.geoBounds(part);
        if (e < w) continue;
        pts.push([w, s], [e, s], [w, n], [e, n]);
      }
      return pts;
    }
    build(j, now) {
      // the visitor's speed: 'slow' is the first, unhurried pace (each leg given its full time,
      // up to 16 s a journey); the numbers shorten the usual 7 s timetable alike
      const spd = (this.o.speed && this.o.speed()) || 1;
      const slow = spd === 'slow';
      const cap = slow ? 16000 : CAP;
      // the stops, each once, in the order they are reached; an airport and its city, named
      // alike, are one stop, and the legs are joined there
      const stops = [];
      const stopAt = (ll, name, home, leg, end) => {
        let st = stops.find((x) => d3.geoDistance(x.ll, ll) < 0.0008 || (name && x.name === name && d3.geoDistance(x.ll, ll) < 0.03));
        if (!st) { st = { ll, v: vec(ll), name, home, leg, end, pop: Infinity, seed: stops.length + 5 }; stops.push(st); }
        return st;
      };
      const ends = j.legs.map((q, i) => [stopAt(q.from, q.fromName, q.fromHome, i, false), stopAt(q.to, q.toName, q.toHome, i, true)]);
      const legs = j.legs.map((q, i) => {
        q = { ...q, from: ends[i][0].ll, to: ends[i][1].ll };
        const L = this.route(q.from, q.to, q.mode || 'flight', i + 3);
        // a flight back along the way it came is lifted higher, so the two arcs stand apart
        if (L.mode === 'flight' && ends.slice(0, i).some((e, m) => j.legs[m].mode === 'flight' && e[0] === ends[i][1] && e[1] === ends[i][0])) L.H *= 1.7;
        L.i = i;
        L.fromName = q.fromName; L.toName = q.toName;
        L.frame = fit([q.from, q.to], 0.62);
        L.cc = [...new Set([this.countryAt(q.from), this.countryAt(q.to)].filter(Boolean))].sort();
        // ground legs within a country go quickly; long flights take their time
        L.dur = L.mode === 'flight' ? 1200 + 1000 * Math.min(1, L.d / 1.4) : slow ? 1000 + 600 * Math.min(1, L.d / 0.05) : 520 + 380 * Math.min(1, L.d / 0.05);
        return L;
      });
      const overview = fit(stops.map((st) => st.ll), 0.74);
      legs.forEach((L, i) => { L.a = ends[i][0]; L.b = ends[i][1]; });
      // the big picture stays in sight: every leg is framed with the whole of the country (or
      // countries) it touches, and legs in a row within the same countries share one view, so
      // the camera holds still while a train hops from town to town
      for (let i = 0; i < legs.length;) {
        const key = legs[i].cc.join('|');
        let e = i;
        while (e + 1 < legs.length && legs[e + 1].cc.join('|') === key && legs[e + 1].mode !== 'flight' && legs[i].mode !== 'flight') e++;
        const pts = [];
        for (let m = i; m <= e; m++) pts.push(legs[m].a.ll, legs[m].b.ll);
        for (const cid of legs[i].cc) pts.push(...this.countryPts(cid, legs[i].a.ll));
        const frame = fit(pts, 0.68);
        for (let m = i; m <= e; m++) legs[m].frame = frame;
        i = e + 1;
      }
      // the timetable
      const cur = { c: this.centre, k: this.k };
      const lay = (beat, f, hold) => {
        let t = 0;
        const keys = [];
        const intro = slow ? clamp(camDur(cur, overview), 700, 1300) : clamp(camDur(cur, overview), 450, 800);
        keys.push({ at: 0, dur: intro, to: overview, leg: 0 });
        t = intro + hold;
        let prev = overview;
        for (const L of legs) {
          const natural = L.frame === prev ? 0 : camDur(prev, L.frame);
          L.lead = Math.min(natural * 0.36, 420) * f;
          L.d0 = L.dur * f;
          const at = t;
          keys.push({ at, dur: L.frame === prev ? 1 : Math.max(320, Math.min(natural, L.lead + L.d0)), to: L.frame, leg: L.i });
          L.at = at + L.lead;
          t = L.at + L.d0 + beat;
          prev = L.frame;
        }
        const out = slow ? clamp(camDur(prev, overview) + 200, 1100, 1700) : clamp(camDur(prev, overview), 600, 900);
        keys.push({ at: t, dur: out, to: overview, leg: legs.length });
        return { keys, total: t + out };
      };
      let plan = slow ? lay(420, 1, 450) : lay(260, 1, 200);
      if (plan.total > cap) plan = slow ? lay(140, 1, 260) : lay(60, 1, 80);
      for (let n = 0; n < 6 && plan.total > cap; n++) {
        const fixed = plan.total - legs.reduce((s, L) => s + L.lead + L.d0, 0);
        const f = Math.max(slow ? 0.35 : 0.12, (cap - fixed) / Math.max(1, plan.total - fixed));
        plan = slow ? lay(140, f * (n ? 0.97 : 1), 260) : lay(60, f * (n ? 0.97 : 1), 80);
      }
      for (const L of legs) {
        if (!L.a.home) L.a.pop = Math.min(L.a.pop, L.at - 40);
        if (!L.b.home) L.b.pop = Math.min(L.b.pop, L.at + L.d0);
      }
      // the visitor's speed (1x, 1.5x, 2x) shortens the whole timetable alike
      const sp = slow ? 1 : spd;
      if (sp !== 1) {
        for (const k of plan.keys) { k.at /= sp; k.dur = Math.max(1, k.dur / sp); }
        for (const L of legs) { L.at /= sp; L.d0 /= sp; L.lead /= sp; }
        for (const st of stops) if (isFinite(st.pop)) st.pop /= sp;
        plan.total /= sp;
      }
      return { key: j.key, legs, stops, overview, keys: plan.keys, total: plan.total, t0: now, next: 0, home: stops.some((s) => s.home) };
    }
    leg(i) {
      if (i === this.legNow) return;
      this.legNow = i;
      if (this.o.onLeg) this.o.onLeg(i);
    }

    // the close drawing of the places the camera will come near, cut out ahead of time
    prepare(rp) {
      const hi = this.o.hi;
      if (!hi || !hi.land) return;
      const close = rp.keys.filter((kf) => kf.to.k >= HI_K);
      // a journey that comes close in sends for the smaller lakes, so they are there when it arrives
      if (close.length) this.fineLakes();
      const groups = [];
      for (const kf of close) {
        let g = groups.find((x) => d3.geoDistance(x.items[0].c, kf.to.c) < 0.3);
        if (!g) groups.push((g = { items: [] }));
        g.items.push(kf.to);
      }
      rp.regions = groups.map((g) => {
        const c = d3.geoCentroid({ type: 'MultiPoint', coordinates: g.items.map((x) => x.c) });
        const r = Math.max(...g.items.map((x) => d3.geoDistance(c, x.c))) + viewRad(HI_K) + 0.05;
        const key = `${c[0].toFixed(1)},${c[1].toFixed(1)},${r.toFixed(2)}`;
        let reg = this.regions.get(key);
        if (!reg) {
          reg = { c, r, ready: false };
          this.regions.set(key, reg);
          // one piece at a time, between frames
          const steps = [['land', hi.land], ['travel', hi.travel], ['borders', hi.borders], ['lakes', this.o.lakes]];
          const geo = {};
          const next = () => {
            const st = steps.shift();
            if (!st) { reg.geo = geo; reg.ready = true; this.lakesInto(reg); return; }
            geo[st[0]] = st[1] ? capClip(st[1], c, r) : null;
            setTimeout(next, 16);
          };
          setTimeout(next, 30);
        }
        return reg;
      });
    }
    // the smaller lakes (Natural Earth 10m, those the 50m drawing lacks), sent for only once the
    // globe is to come close in; when they arrive they join each close drawing, and the hatching
    // made where they lie is made again so it keeps off them
    fineLakes() {
      if (this.lxAsked || !this.o.moreLakes) return;
      this.lxAsked = true;
      this.o.moreLakes().then((fc) => {
        if (!fc) { this.lxAsked = false; return; }
        this.lakesX = fc;
        this.lakesAll = { type: 'FeatureCollection', features: [...(this.o.lakes ? this.o.lakes.features : []), ...fc.features] };
        for (const reg of this.regions.values()) if (reg.ready) this.lakesInto(reg);
        const ps = polysOf(fc);
        for (const [key, t] of this.htiles) {
          const [z, x, y] = key.split('/').map(Number);
          const T = 360 / (1 << z), w = -180 + x * T, e = w + T, n = latOfY(180 - y * T), so = latOfY(180 - (y + 1) * T);
          if (ps.some((p) => !(p.e < w || p.w > e || p.n < so || p.s > n))) this.htiles.delete(key);
        }
        this.kick();
      });
    }
    lakesInto(reg) {
      if (!this.lakesX || reg.lx) return;
      reg.lx = true;
      // the lakes within the region's reach (small enough to need no cutting at its edge)
      const near = polysOf(this.lakesX).filter((p) => d3.geoDistance(reg.c, [(p.w + p.e) / 2, (p.s + p.n) / 2]) < reg.r + 0.02);
      if (!near.length) return;
      const own = reg.geo.lakes && reg.geo.lakes.type === 'MultiPolygon' ? reg.geo.lakes.coordinates : [];
      reg.geo = { ...reg.geo, lakes: { type: 'MultiPolygon', coordinates: [...own, ...near.map((p) => p.poly)] } };
    }

    /* -------------------------------- the mountains' hatching, close in */

    // the relief to hatch from: the finer image, once it has arrived, for the tiles that need it
    reliefFor(z) {
      const r = this.o.relief ? this.o.relief() : null;
      if (!r) return null;
      if (z >= 5 && r.fine) {
        if (this.warmed && this.warmed.has(r.fine)) return { cut: reliefSrc(r.fine), id: 'f' };
      }
      return r.coarse ? { cut: reliefSrc(r.coarse), id: 'c' } : null;
    }
    // ready the relief's pieces and the outlines' index a moment after the view opens, so the
    // first journey followed finds them waiting
    warm() {
      clearTimeout(this.warmT);
      this.warmed = this.warmed || new Set();
      const idle = window.requestIdleCallback || ((f) => setTimeout(f, 1));
      // one piece of work per idle moment
      const jobs = [
        () => { const r = this.o.relief && this.o.relief(); if (r && r.coarse && !this.warmed.has(r.coarse)) { warmImage(r.coarse); this.warmed.add(r.coarse); } },
        () => polysOf((this.o.hi && this.o.hi.land) || this.o.land),
        () => polysOf(this.o.lakes),
        // (never while a journey is being followed: it waits for the globe to rest)
        () => { const r = this.o.relief && this.o.relief(); if (this.rp) return false; if (r && r.fine && !this.warmed.has(r.fine)) { warmImage(r.fine); this.warmed.add(r.fine); } return true; },
      ];
      const next = () => {
        const f = jobs[0];
        if (!f) { this.warmT = 0; return; }
        const done = f() !== false;
        if (done) jobs.shift();
        this.warmT = setTimeout(() => idle(next, { timeout: 2000 }), done ? 60 : 1500);
      };
      this.warmT = setTimeout(() => idle(next, { timeout: 2000 }), 1200);
    }
    // the tile level whose sample is about a screen pixel here (as the map's paintings are made)
    hLevel(R, lat) {
      const f = Math.min(1.5, this.dpr || 1) * 0.85 * 1.15;
      return Math.log2((f * R * RAD * Math.cos(clamp(lat, -70, 70) * RAD) * 360) / HT);
    }
    // the tiles a camera sees, at level z
    hTiles(c, k, z) {
      const s = this.size;
      const R = s * BASE * k;
      const rho = R > s * FRAME + 0.5 ? viewRad(k) : Math.PI / 2;
      const rd = Math.min(89, rho / RAD + 0.5);
      const la0 = Math.max(-70, c[1] - rd), la1 = Math.min(70, c[1] + rd);
      if (la1 <= la0) return [];
      const n = 1 << z, T = 360 / n;
      const lon = ((((c[0] + 180) % 360) + 360) % 360) - 180;
      const span = rd < 90 - Math.abs(c[1]) - 0.5 ? Math.asin(Math.min(1, Math.sin(rd * RAD) / Math.cos(c[1] * RAD))) / RAD + 0.5 : 180;
      const ty0 = clamp(Math.floor((180 - mercY(la1)) / T), 0, n - 1), ty1 = clamp(Math.floor((180 - mercY(la0)) / T), 0, n - 1);
      const xs = new Set();
      if (span >= 180) for (let x = 0; x < n; x++) xs.add(x);
      else for (let x = Math.floor((lon - span + 180) / T); x <= Math.floor((lon + span + 180) / T); x++) xs.add(((x % n) + n) % n);
      const out = [];
      for (let y = ty0; y <= ty1; y++) for (const x of xs) out.push([z, x, y]);
      return out;
    }
    hPeek(z, x, y) {
      for (const id of ['f', 'c']) { const t = this.htiles.get(`${z}/${x}/${y}/${id}`); if (t) { t.used = this.frameNo; return t; } }
      return null;
    }
    // a tile's strokes: made now if the frame has time, else queued (and a coarser one stands in)
    hGet(z, x, y, until) {
      const src = this.reliefFor(z);
      if (!src) return null;
      const key = `${z}/${x}/${y}/${src.id}`;
      let t = this.htiles.get(key);
      if (t) { t.used = this.frameNo; return t; }
      if (performance.now() <= until) {
        const hi = this.o.hi;
        t = hatchTile(z, x, y, src.cut, (hi && hi.land) || this.o.land, this.lakesAll || this.o.lakes, 0x51ed);
        t.used = this.frameNo;
        this.htiles.set(key, t);
        if (this.htiles.size > 420) {
          const old = [...this.htiles.entries()].sort((a, b) => a[1].used - b[1].used).slice(0, 120);
          for (const [kk] of old) this.htiles.delete(kk);
        }
        return t;
      }
      this.hEnqueue(z, x, y);
      return this.hPeek(z, x, y);
    }
    hEnqueue(z, x, y) {
      const k = `${z}/${x}/${y}`;
      if (!this.hq.has(k)) this.hq.set(k, [z, x, y]);
      if (this.hTimer) return;
      this.hTimer = setTimeout(() => {
        this.hTimer = 0;
        const until = performance.now() + 10;
        for (const [kk, [z1, x1, y1]] of this.hq) {
          this.hq.delete(kk);
          this.hGet(z1, x1, y1, Infinity);
          if (performance.now() > until) break;
        }
        if (this.hq.size) this.hEnqueue(...this.hq.values().next().value);
        else this.kick();
      }, 16);
    }
    // the hatching of the views a journey will close in on, made ahead of the camera
    hPrepare(rp) {
      if (!this.size) return;
      for (const kf of rp.keys) {
        if (kf.to.k < 1.7) continue;
        const z = clamp(Math.round(this.hLevel(this.size * BASE * kf.to.k, kf.to.c[1])), 2, 12);
        for (const [z1, x, y] of this.hTiles(kf.to.c, kf.to.k, z)) this.hEnqueue(z1, x, y);
      }
    }
    drawRelief(ctx) {
      const a = clamp((this.k - 1.7) / 0.9, 0, 1);
      if (a <= 0 || !this.o.relief) return;
      const cam = this.cam, c = this.centre, s = this.size;
      this.frameNo += 1;
      const zf = this.hLevel(cam.R, c[1]);
      // between two levels, a short fade from one to the other, so the hatching never jumps
      const f0 = Math.floor(zf), fr = zf - f0;
      const levels = fr > 0.38 && fr < 0.62 ? [[f0, 1 - (fr - 0.38) / 0.24], [f0 + 1, (fr - 0.38) / 0.24]] : [[Math.round(zf), 1]];
      const until = performance.now() + 7;
      const { cl, sl, cp, sp, R, cx, cy } = cam;
      ctx.save();
      ctx.lineCap = 'round';
      for (const [zz, wa] of levels) {
        const z = clamp(zz, 2, 12);
        const tiles = this.hTiles(c, this.k, z);
        if (!tiles.length || tiles.length > 80) continue;
        const seen = new Set();
        ctx.beginPath();
        for (const [z1, x, y] of tiles) {
          const t = this.hGet(z1, x, y, until) || this.hPeek(z1 - 1, x >> 1, y >> 1);
          if (!t || seen.has(t)) continue;
          seen.add(t);
          const P = t.P;
          for (let i = 0; i < P.length; i += 6) {
            let x1 = P[i] * cl - P[i + 1] * sl;
            if (x1 * cp - P[i + 2] * sp <= 0) continue;
            const ax = cx + R * (P[i] * sl + P[i + 1] * cl), ay = cy - R * (P[i + 2] * cp + x1 * sp);
            x1 = P[i + 3] * cl - P[i + 4] * sl;
            const bx = cx + R * (P[i + 3] * sl + P[i + 4] * cl), by = cy - R * (P[i + 5] * cp + x1 * sp);
            if ((ax < -4 && bx < -4) || (ay < -4 && by < -4) || (ax > s + 4 && bx > s + 4) || (ay > s + 4 && by > s + 4)) continue;
            ctx.moveTo(ax, ay); ctx.lineTo(bx, by);
          }
        }
        // the nib's width as the map's: 0.8 of a sample
        const perPx = (Math.pow(2, z) * HT) / 360 / Math.max(1e-6, R * RAD * Math.cos(clamp(c[1], -70, 70) * RAD));
        ctx.lineWidth = clamp(0.8 / perPx, 0.4, 1.3);
        ctx.strokeStyle = ink(0.5 * a * wa);
        ctx.stroke();
      }
      ctx.restore();
    }
    // the lakes to draw: the region's close in, all of them at middle distance, the great ones far out
    lakesFor(geo) {
      const L = this.o.lakes;
      if (!L) return null;
      if (geo !== this.o && geo.lakes) return geo.lakes;
      if (this.k >= 2) return L;
      if (this._bigOf !== L) {
        this._bigOf = L;
        this._big = { type: 'FeatureCollection', features: L.features.filter((f) => d3.geoArea(f) > 3e-4) };
      }
      return this._big;
    }

    geoFor() {
      const lo = this.o;
      const rp = this.rp;
      if (this.k >= HI_K && rp && rp.regions) {
        const c = this.centre, vr = viewRad(this.k);
        for (const reg of rp.regions) if (reg.ready && d3.geoDistance(c, reg.c) + vr < reg.r) return reg.geo;
      }
      return lo;
    }

    /* -------------------------------- drawing the routes */

    // the screen points of a route from u0 to u1 of its length: lifted if it flies, and with the
    // hand's slight waver in it. Returns how many.
    trace(r, u0, u1, wob = 0.8) {
      const { cam, BX, BY, PX, PY, PV, PU } = this;
      const est = cam.R * Math.max(r.d, 1e-4) * (1 + r.H) * Math.max(0, u1 - u0);
      const n = Math.max(2, Math.min(MAXP, Math.ceil(est / 4) + 2));
      for (let i = 0; i < n; i++) {
        const u = u0 + ((u1 - u0) * i) / (n - 1);
        const q = course(r, u);
        const x = q[0], y = q[1], z = q[2];
        const x1 = x * cam.cl - y * cam.sl, y1 = x * cam.sl + y * cam.cl;
        const X = x1 * cam.cp - z * cam.sp, Z = z * cam.cp + x1 * cam.sp;
        const h = 1 + r.H * Math.sin(Math.PI * u);
        BX[i] = cam.cx + cam.R * h * y1;
        BY[i] = cam.cy - cam.R * h * Z;
        PV[i] = X > 0 ? 1 : 0;
        PU[i] = u;
      }
      const amp = wob * cam.lw;
      for (let i = 0; i < n; i++) {
        const i0 = i > 0 ? i - 1 : i, i1 = i < n - 1 ? i + 1 : i;
        const nx = BY[i0] - BY[i1], ny = BX[i1] - BX[i0];
        const l = Math.hypot(nx, ny) || 1;
        const u = PU[i];
        const env = Math.min(1, u * 7, (1 - u) * 7);
        const w = (Math.sin(u * r.f1 + r.p1) * 0.62 + Math.sin(u * r.f2 + r.p2) * 0.38) * env * amp;
        PX[i] = BX[i] + (nx / l) * w;
        PY[i] = BY[i] + (ny / l) * w;
      }
      return n;
    }
    // the points traced, as one path broken where they pass behind the globe
    line(n, i0 = 0, dx = 0, dy = 0) {
      const { ctx, PX, PY, PV } = this;
      ctx.beginPath();
      let on = false;
      for (let i = i0; i < n; i++) {
        if (!PV[i]) { on = false; continue; }
        if (on) ctx.lineTo(PX[i] + dx, PY[i] + dy); else { ctx.moveTo(PX[i] + dx, PY[i] + dy); on = true; }
      }
    }
    // the part of the points traced that runs behind the globe, seen through it as if it were
    // glass: a fine dotted line, fainter than the near side. Not when the globe is seen close,
    // through its round frame, where the far side would only confuse the view.
    far(n, a) {
      const { ctx, PX, PY, PV, cam } = this;
      if (cam.lens || a <= 0.01) return;
      ctx.beginPath();
      let on = false, any = false;
      for (let i = 1; i < n; i++) {
        if (PV[i] && PV[i - 1]) { on = false; continue; }
        if (!on) { ctx.moveTo(PX[i - 1], PY[i - 1]); on = true; }
        ctx.lineTo(PX[i], PY[i]);
        any = true;
      }
      if (!any) return;
      ctx.save();
      ctx.setLineDash([0.01, 3.2 * cam.lw]);
      ctx.lineCap = 'round';
      ctx.strokeStyle = ink(0.42 * a); ctx.lineWidth = 1.2 * cam.lw; ctx.stroke();
      ctx.restore();
    }
    // the railway: a fine line crossed by short sleepers, evenly spaced along the screen
    sleepers(n, a) {
      const { ctx, PX, PY, PV, cam } = this;
      const sp = 6.5 * cam.lw, hl = 2.5 * cam.lw;
      let acc = sp * 0.5;
      ctx.beginPath();
      for (let i = 1; i < n; i++) {
        const dx = PX[i] - PX[i - 1], dy = PY[i] - PY[i - 1];
        const l = Math.hypot(dx, dy);
        if (!l) continue;
        if (!PV[i] || !PV[i - 1]) { acc -= l; while (acc < 0) acc += sp; continue; }
        const ux = dx / l, uy = dy / l;
        let s = acc;
        while (s <= l) {
          const x = PX[i - 1] + ux * s, y = PY[i - 1] + uy * s;
          ctx.moveTo(x - uy * hl, y + ux * hl);
          ctx.lineTo(x + uy * hl, y - ux * hl);
          s += sp;
        }
        acc = s - l;
      }
      ctx.strokeStyle = ink(0.78 * a); ctx.lineWidth = 0.75 * cam.lw; ctx.stroke();
    }
    // one leg, drawn from its start to `head` (0..1)
    drawLeg(L, head, a, live) {
      const { ctx, cam } = this;
      if (head <= 0.0005) return;
      const n = this.trace(L, 0, head, L.mode === 'flight' ? 0.7 : 0.9);
      const lw = cam.lw;
      // the wash first, laid a little off the pen line
      this.line(n, 0, 1.2 * lw, 1.4 * lw);
      ctx.strokeStyle = WASH(0.2 * a); ctx.lineWidth = (L.mode === 'flight' ? 3.4 : 4.2) * lw; ctx.stroke();
      // then the pen
      this.line(n);
      if (L.mode === 'flight') {
        ctx.strokeStyle = ink(0.8 * a); ctx.lineWidth = 1.05 * lw; ctx.stroke();
      } else if (L.mode === 'train') {
        ctx.strokeStyle = ink(0.86 * a); ctx.lineWidth = 0.95 * lw; ctx.stroke();
        this.sleepers(n, a);
      } else {
        const car = L.mode === 'car';
        ctx.setLineDash(car ? [2.6 * lw, 2.2 * lw] : [4.4 * lw, 3.4 * lw]);
        ctx.strokeStyle = ink(0.84 * a); ctx.lineWidth = (car ? 1.05 : 1.15) * lw; ctx.stroke();
        ctx.setLineDash([]);
      }
      this.far(n, a);
      if (!live) return;
      // behind the globe the plane (or the mark over land) is still seen, faintly, through it
      if (!this.PV[n - 1]) {
        if (cam.lens) return;
        if (L.mode === 'flight') this.plane(n, 0.4 * a); else this.runner(n, 0.4 * a);
        return;
      }
      // where the pen is now
      const x = this.PX[n - 1], y = this.PY[n - 1];
      if (L.mode === 'flight') { this.plane(n, a); return; }
      this.runner(n, a);
    }
    // a flight's travelling mark: a small airliner drawn in ink, seen from above, nose along
    // the way it flies, on a paper halo so it reads over any wash
    plane(n, a) {
      const { ctx, PX, PY, cam } = this;
      const lw = cam.lw, x = PX[n - 1], y = PY[n - 1];
      let j = n - 1, back = 0;
      while (j > 0 && back < 5 * lw) { back += Math.hypot(PX[j] - PX[j - 1], PY[j] - PY[j - 1]); j--; }
      const ang = j === n - 1 ? 0 : Math.atan2(y - PY[j], x - PX[j]);
      drawPlane(ctx, x, y, ang, 1.55 * lw, a);
    }
    // the travelling mark of a leg over land: a small ink capsule, a smudge of wash behind it
    runner(n, a) {
      const { ctx, PX, PY, cam } = this;
      const lw = cam.lw;
      const x = PX[n - 1], y = PY[n - 1];
      // the smudge: the last stretch of the line, washed over, fading back
      let i = n - 1, run = 0;
      const want = 26 * lw;
      ctx.lineCap = 'round';
      for (let seg = 0; seg < 6 && i > 0 && run < want; seg++) {
        const stop = run + want / 6;
        ctx.beginPath(); ctx.moveTo(PX[i], PY[i]);
        while (i > 0 && run < stop) { run += Math.hypot(PX[i] - PX[i - 1], PY[i] - PY[i - 1]); i--; ctx.lineTo(PX[i], PY[i]); }
        ctx.strokeStyle = `rgba(70, 60, 54, ${0.17 * (1 - seg / 6) * a})`; ctx.lineWidth = (5.6 - seg * 0.5) * lw; ctx.stroke();
      }
      // its heading
      let j = n - 1, back = 0;
      while (j > 0 && back < 4 * lw) { back += Math.hypot(PX[j] - PX[j - 1], PY[j] - PY[j - 1]); j--; }
      const ang = Math.atan2(y - PY[j], x - PX[j]);
      ctx.save();
      ctx.translate(x, y); ctx.rotate(ang);
      ctx.beginPath(); ctx.moveTo(-4.4 * lw, 0); ctx.lineTo(1.8 * lw, 0);
      ctx.strokeStyle = `rgba(251, 250, 245, ${0.95 * a})`; ctx.lineWidth = 4.8 * lw; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-3.6 * lw, 0); ctx.lineTo(1.2 * lw, 0);
      ctx.strokeStyle = ink(0.92 * a); ctx.lineWidth = 2.7 * lw; ctx.stroke();
      ctx.restore();
    }
    // a flight leaving Taipei at rest: head, a tail that fades behind it, then gone
    drawIdle(F, t, a) {
      const { ctx, cam } = this;
      const g = t / F.D;
      const head = easeInOut(Math.min(1, g));
      const tail = easeInOut(clamp((g - 0.5) / 1.05, 0, 1));
      const lw = cam.lw;
      // the faint trace of the way it went, kept a while
      const keep = g < 1 ? 0 : Math.min(1, (g - 1) * 2.5) * clamp(1 - (t - F.D - 1500) / 900, 0, 1);
      if (head - tail > 0.002) {
        const n = this.trace(F, tail, head, 0.6);
        const parts = 14;
        for (let p = 0; p < parts; p++) {
          const i0 = Math.floor((p * (n - 1)) / parts), i1 = Math.floor(((p + 1) * (n - 1)) / parts);
          if (i1 <= i0) continue;
          ctx.beginPath();
          let on = false;
          for (let i = i0; i <= i1; i++) {
            if (!this.PV[i]) { on = false; continue; }
            if (on) ctx.lineTo(this.PX[i], this.PY[i]); else { ctx.moveTo(this.PX[i], this.PY[i]); on = true; }
          }
          const q = (p + 1) / parts;
          ctx.strokeStyle = ink(q * 0.9 * a); ctx.lineWidth = (0.55 + 0.7 * q) * lw; ctx.stroke();
        }
        this.far(n, a);
        // the head, and behind the globe the same head seen faintly through it
        const seen = this.PV[n - 1], ha = seen ? a : cam.lens ? 0 : 0.4 * a;
        if (g < 1 && ha > 0) {
          const x = this.PX[n - 1], y = this.PY[n - 1];
          ctx.beginPath(); ctx.arc(x, y, 2.7 * lw, 0, Math.PI * 2); ctx.fillStyle = `rgba(251, 250, 245, ${0.9 * ha})`; ctx.fill();
          ctx.beginPath(); ctx.arc(x, y, 1.7 * lw, 0, Math.PI * 2); ctx.globalAlpha = ha; ctx.fillStyle = HEAD; ctx.fill(); ctx.globalAlpha = 1;
        }
      }
      if (keep > 0 && tail > 0.05) {
        const n = this.trace(F, 0, tail, 0.6);
        this.line(n);
        ctx.strokeStyle = ink(0.16 * keep * a); ctx.lineWidth = 0.6 * lw; ctx.stroke();
        this.far(n, 0.45 * keep * a);
      }
      // the landing: a small ring of the pen
      if (g >= 1) {
        const x = (t - F.D) / 460;
        const fade = clamp(1 - (t - F.D - 1500) / 900, 0, 1);
        if (fade > 0) this.ring(F.Bv, Math.min(1, x), fade * a, 5.4, F.slot + 2, false, true);
      }
    }
    // a place's ring, popping in as x goes 0 to 1
    ring(v, x, a, size, seed, dot, glass) {
      const { ctx, cam } = this;
      let p = this.screen(v);
      // (a landing behind the globe, when asked, is ringed faintly through it)
      if (!p && glass && !cam.lens) { p = this.behind(v); a *= 0.4; }
      if (!p) return null;
      const sc = outBack(clamp(x, 0, 1));
      const pts = ringOf(seed);
      const r = size * cam.lw * sc;
      ctx.save();
      ctx.translate(p[0], p[1]);
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) { const q = pts[i]; if (i) ctx.lineTo(q[0] * r, q[1] * r); else ctx.moveTo(q[0] * r, q[1] * r); }
      ctx.strokeStyle = ink(0.86 * a * Math.min(1, x * 3)); ctx.lineWidth = 1.15 * cam.lw; ctx.lineJoin = 'round'; ctx.stroke();
      if (dot) { ctx.beginPath(); ctx.arc(0, 0, 2.1 * cam.lw, 0, Math.PI * 2); ctx.fillStyle = HEAD; ctx.globalAlpha = a * Math.min(1, x * 2); ctx.fill(); }
      ctx.restore();
      return p;
    }
    // a point on the sphere, on the screen, or null where it is out of sight
    screen(v) {
      const { cam } = this;
      const x1 = v[0] * cam.cl - v[1] * cam.sl, y1 = v[0] * cam.sl + v[1] * cam.cl;
      const X = x1 * cam.cp - v[2] * cam.sp, Z = v[2] * cam.cp + x1 * cam.sp;
      if (X <= 0.02) return null;
      const sx = cam.cx + cam.R * y1, sy = cam.cy - cam.R * Z;
      if (cam.lens && Math.hypot(sx - cam.cx, sy - cam.cy) > cam.rf - 3) return null;
      this.sxy[0] = sx; this.sxy[1] = sy;
      return this.sxy;
    }
    // a point on the far side of the sphere, where it would show through the globe
    behind(v) {
      const { cam } = this;
      const x1 = v[0] * cam.cl - v[1] * cam.sl, y1 = v[0] * cam.sl + v[1] * cam.cl;
      const X = x1 * cam.cp - v[2] * cam.sp, Z = v[2] * cam.cp + x1 * cam.sp;
      if (X > 0.02) return null;
      this.sxy[0] = cam.cx + cam.R * y1; this.sxy[1] = cam.cy - cam.R * Z;
      return this.sxy;
    }
    homeDot(a) {
      const p = this.screen(this.homeV);
      if (!p) return;
      const { ctx, cam } = this;
      ctx.beginPath(); ctx.arc(p[0], p[1], 1.7 * cam.lw, 0, Math.PI * 2);
      ctx.fillStyle = ink(0.85 * a); ctx.fill();
    }
    // a journey at rt ms into its replay
    drawJourney(rp, rt, a) {
      const { ctx, cam } = this;
      for (const L of rp.legs) {
        if (rt <= L.at) continue;
        const g = Math.min(1, (rt - L.at) / L.d0);
        this.drawLeg(L, easeInOut(g), a, g < 1);
      }
      // the finale: once the whole journey is drawn, a warm light runs along it from the first
      // leg to the last, the line swells under it, and the route stays a little stronger after
      const fin = rt >= rp.total && !this.o.reduce() ? clamp((rt - rp.total) / 1500, 0, 1) : (rt >= rp.total ? 1 : 0);
      if (fin > 0) {
        const nL = rp.legs.length, u = easeInOut(fin) * (nL + 0.8);
        rp.legs.forEach((L, i) => {
          const sweep = this.o.reduce() ? 0 : Math.max(0, 1 - Math.abs(u - (i + 0.5)) / 1.1);
          const w = Math.max(sweep, 0.35 * fin);
          if (w < 0.02) return;
          const nn = this.trace(L, 0, 1, L.mode === 'flight' ? 0.7 : 0.9);
          this.line(nn, 0, 1.2 * cam.lw, 1.4 * cam.lw);
          ctx.strokeStyle = WASH(0.42 * w * a); ctx.lineWidth = (3.6 + 6 * w) * cam.lw; ctx.lineCap = 'round'; ctx.stroke();
          this.line(nn);
          ctx.strokeStyle = ink(0.92 * a); ctx.lineWidth = (1 + 0.85 * w) * cam.lw;
          if (L.mode !== 'flight' && L.mode !== 'train') ctx.setLineDash(L.mode === 'car' ? [2.6 * cam.lw, 2.2 * cam.lw] : [4.4 * cam.lw, 3.4 * cam.lw]);
          ctx.stroke(); ctx.setLineDash([]);
        });
      }
      if (rp.home) this.homeDot(a);
      const shown = this.shown || (this.shown = []);
      shown.length = 0;
      for (const st of rp.stops) {
        if (st.home || rt < st.pop) continue;
        const p = this.screen(st.v);
        if (p) shown.push({ st, x: p[0], y: p[1], age: (rt - st.pop) / 460, r: 7.2 });
      }
      // where places crowd together their rings draw in, so they never run into one blot
      for (const p of shown) {
        let near = Infinity;
        for (const q of shown) if (q !== p) near = Math.min(near, Math.hypot(p.x - q.x, p.y - q.y));
        p.r = clamp((near / cam.lw) * 0.4, 2.4, 7.2);
      }
      // in the finale each place's ring swells once, in the order they were reached
      if (fin > 0 && fin < 1) {
        const nL = rp.legs.length;
        for (const p of shown) { const q = clamp(fin * 1.5 - (p.st.leg / Math.max(1, nL)) * 0.5, 0, 1); p.r *= 1 + 0.45 * Math.sin(Math.PI * q); }
      }
      for (const p of shown) this.ring(p.st.v, p.age, a, p.r, p.st.seed, p.r > 4);
      // the names: the newest first while travelling, in the order reached once it is all drawn;
      // names still being written go ahead of the rest, the one begun first ahead of the others,
      // so none is pushed out half-written
      const done = rt >= rp.total;
      const writing = (p) => (p.age > 0.2 && p.age < 1.1 && p.st.spot != null ? 1 : 0);
      if (!done) shown.sort((p, q) => writing(q) - writing(p) || (writing(p) ? p.st.pop - q.st.pop : q.st.pop - p.st.pop));
      const boxes = this.boxes;
      boxes.length = 0;
      for (const sh of shown) { const e = (sh.r + 1.8) * cam.lw; boxes.push([sh.x - e, sh.y - e, sh.x + e, sh.y + e]); }
      const s = this.size;
      for (const { st, x, y, age, r } of shown) {
        const sp = this.o.letter(st.name);
        if (!sp) continue;
        const lw = cam.lw;
        const g = (r + 3.6) * lw;
        const spots = [[g, 0], [-g - sp.inkW, 0], [-sp.inkW / 2, -g - 5 * lw], [-sp.inkW / 2, g + 7 * lw], [g * 0.8, -g - 2 * lw], [-g * 0.8 - sp.inkW, -g - 2 * lw], [g * 0.8, g + 4 * lw], [-g * 0.8 - sp.inkW, g + 4 * lw]];
        let box = null, px = 0, py = 0;
        // the side it was given before is tried first, so a name does not hop about; then the
        // others in turn. A name is never cut by the globe's edge or laid over another name or
        // ring: where no side has room it is left out
        const edge = (cam.lens ? cam.rf : Math.min(cam.R, s * 0.5)) - 4;
        const order = st.spot != null ? [st.spot, ...spots.keys()].filter((v, i, a) => a.indexOf(v) === i) : [...spots.keys()];
        for (const si of order) {
          const [ox, oy] = spots[si];
          const bx = [x + ox - 2, y + oy - sp.size * 0.72, x + ox + sp.inkW + 2, y + oy + sp.size * 0.42];
          const inside = [[bx[0], bx[1]], [bx[2], bx[1]], [bx[0], bx[3]], [bx[2], bx[3]]].every((q) => Math.hypot(q[0] - cam.cx, q[1] - cam.cy) < edge)
            && bx[0] > 2 && bx[2] < s - 2 && bx[1] > 2 && bx[3] < s - 2;
          if (inside && !boxes.some((o) => bx[0] < o[2] && bx[2] > o[0] && bx[1] < o[3] && bx[3] > o[1])) { box = bx; px = x + ox - sp.bx; py = y + oy - sp.by + sp.size * 0.35; st.spot = si; break; }
        }
        if (!box) continue;
        boxes.push(box);
        // lettered left to right, as a hand writes it
        const w = clamp((age - 0.2) / 0.9, 0, 1);
        if (w <= 0) continue;
        ctx.save();
        if (w < 1) { ctx.beginPath(); ctx.rect(px, py, sp.bx + sp.inkW * easeOut(w) + 2, sp.h); ctx.clip(); }
        ctx.globalAlpha = a * Math.min(1, w * 2.5);
        ctx.drawImage(sp.c, px, py, sp.w, sp.h);
        ctx.restore();
      }
    }

    /* -------------------------------- each frame */

    draw(now) {
      const { ctx, size: s, dpr } = this;
      if (!s) return;
      const still = this.o.reduce();
      const dt = Math.min(64, now - (this.last || now));
      this.last = now;
      const rp = this.rp;
      const rt = rp ? now - rp.t0 : 0;
      // the camera keeps to the journey's timetable, each move starting from wherever it is
      if (rp && !still) {
        while (rp.next < rp.keys.length && rt >= rp.keys[rp.next].at) {
          const kf = rp.keys[rp.next++];
          if (rp.next === rp.keys.length || rt < rp.keys[rp.next].at) this.toward(kf.to, kf.dur, rp.t0 + kf.at);
        }
      }
      this.stepCamera(now, dt);
      if (rp) {
        let li = 0;
        for (const kf of rp.keys) if (rt >= kf.at) li = kf.leg;
        this.leg(rt >= rp.total - rp.keys[rp.keys.length - 1].dur ? rp.legs.length : li);
      }

      const R = s * BASE * this.k;
      const rf = Math.min(R, s * FRAME);
      const lw = Math.max(1, s / 520);
      const cx = s / 2, cy = s * 0.47;
      this.proj.scale(R).translate([cx, cy]).rotate(this.rot);
      const cam = this.cam;
      const l = this.rot[0] * RAD, p = this.rot[1] * RAD;
      cam.cx = cx; cam.cy = cy; cam.R = R; cam.rf = rf; cam.lw = lw * 1.2; cam.lens = R > rf + 0.5;
      cam.cl = Math.cos(l); cam.sl = Math.sin(l); cam.cp = Math.cos(p); cam.sp = Math.sin(p);
      if (!this.sxy) this.sxy = [0, 0];

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, s, s);
      castShadow(ctx, s * 0.53, Math.min(cy + rf * 1.12, s * 0.955), rf * 0.86, lw);
      if (this.k >= HI_K) this.fineLakes();
      const geo = this.geoFor();
      WC.paintGlobe(ctx, this.proj, {
        land: geo.land, travel: geo.travel, borders: geo.borders, lw, grain: 1,
        R: Math.min(R * 0.8, s * 0.34), frame: rf,
        hatch: clamp((1.55 - this.k) / 0.45, 0, 1), grat: clamp((5 - this.k) / 3, 0.25, 1),
        lakes: this.lakesFor(geo), under: (c) => this.drawRelief(c),
      });

      ctx.save();
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      // the routes stay on the near side of the globe, inside its outline
      ctx.beginPath(); ctx.arc(cx, cy, cam.lens ? rf - 0.6 : R + 0.5, 0, Math.PI * 2); ctx.clip();
      // at rest: flights leaving Taipei for every other place, all at once (those behind the
      // globe seen faintly through it)
      const ia = rp ? 0 : still ? 1 : clamp((now - this.idleT0 - 150) / 500, 0, 1);
      if (ia > 0) {
        if (still) {
          for (const F of this.idle) {
            const n = this.trace(F, 0, 1, 0.6);
            this.line(n);
            ctx.strokeStyle = ink(0.42); ctx.lineWidth = 0.75 * cam.lw; ctx.stroke();
            this.far(n, 0.6);
            this.ring(F.Bv, 1, 0.9, 5.4, F.slot + 2, false, true);
          }
        } else {
          const t = now - this.idleT0 - 300;
          for (const F of this.idle) {
            if (t < 0) continue;
            const local = t % this.PERIOD;
            if (local < F.D + 2400) this.drawIdle(F, local, ia);
          }
        }
        this.homeDot(ia);
      }
      // the journey just left fades away; the one followed is drawn as far as it has got
      if (this.ghost) {
        const ga = 1 - (now - this.ghost.t0) / 280;
        if (ga <= 0) this.ghost = null; else this.drawJourney(this.ghost.rp, this.ghost.rt, ga);
      }
      if (rp) this.drawJourney(rp, still ? rp.total + 1 : rt, 1);
      ctx.restore();
    }
    kick() { if (!this.running) this.draw(performance.now()); }
    loop(now) {
      if (!this.running) return;
      this.draw(now);
      this.raf = requestAnimationFrame((n) => this.loop(n));
    }
    start() {
      if (this.running) return;
      this.warm();
      if (this.o.reduce()) { this.draw(performance.now()); return; }
      this.running = true;
      this.last = 0;
      this.raf = requestAnimationFrame((n) => this.loop(n));
    }
    stop() { this.running = false; cancelAnimationFrame(this.raf); }
  };

  /* ------------------------------------------------------------ the opening: a globe that unrolls into the map */

  /*
    One continuous piece of motion, about seven seconds:
      the globe fades in and turns; the site's name settles above it, a moment later
      the globe unrolls into the flat map, onto the exact place the map lies, and the name glides
        down to the middle of the window on the same timing
      as the map settles, every flight draws itself across it at once (the near ones land first),
        each with a small plane at its head and a ring of the pen where it lands; the opening's own
        drawing of the map dissolves into the real one underneath
      the name holds while they land, then the name and the flights fade together, leaving the
        map as it always rests
    Skipped (a click, a key, a scroll), everything resolves to the clean map in under half a second.

    o: { canvas, title (the element holding the name), land, travel, flights (WC.routes), home [lng, lat],
         LON0, target(): { scale, translate } of the flat map (d3 equirectangular), onDone() }
    returns { skip(), done, elapsed }
  */
  const GLOBE = 2500, UNROLL = 1600, DISSOLVE = 900, CLEAR = 1200, SKIP = 450;
  // the corridor trial (?opening=corridor): how long it runs in front, and how much of the globe's
  // turning hold it takes back
  const CORRIDOR = 3300, CORRIDOR_TRIM = 700;
  WC.OPENING = { GLOBE, UNROLL, FLY_AT: GLOBE + UNROLL * 0.78, CLEAR, CORRIDOR };

  /* ------------------------------------------------------------ the corridor (a trial, ?opening=corridor) */

  /*
    Before the globe: a corridor of his prints, pinned down four planes of paper (two walls, the
    floor and the ceiling) drawn in CSS perspective, each print on a thin mat with a soft shadow and
    plenty of paper between them. The camera glides forward along it (an exponential ease-out), the
    nearest prints drifting past the edges, and at the end the last prints fall away to the sides,
    leaving the globe that was turning at the far end all along. Only transforms and opacity move,
    and every number reaches the stylesheet as a custom property.
    o: { root (the container), slides (SITE.slides), narrow (phone), src(slide) → the 640px copy }
    returns { ready (the prints decoded, or a moment and a half), far(el), frame(el), hide(), gone(), clear() }
  */
  WC.corridor = (o) => {
    const root = o.root;
    const W = window.innerWidth, H = window.innerHeight;
    const phone = !!o.narrow;
    // the eye's distance from the page, the corridor's length, where the camera starts (already
    // some way in, so the far end is never a pinhole) and how far its far end still is when the
    // glide ends (so the last prints frame the globe before they fall away)
    const P = phone ? 640 : 900, L = phone ? 3000 : 4800, ZF = phone ? 420 : 700, CZ0 = phone ? 800 : 1000;
    const D = L - ZF;
    const hw = W * 0.62, hh = H * (phone ? 0.5 : 0.62);
    const GLIDE = 3000, FALL_AT = 2800, FALL = CORRIDOR - FALL_AT;
    const A = 3.2;
    const glide = (el) => { const u = clamp(el / GLIDE, 0, 1); return (1 - Math.exp(-A * u)) / (1 - Math.exp(-A)); };
    const cz = (el) => CZ0 + (D - CZ0) * glide(el);
    // how large the far end looks now, against how it looks when the glide ends
    const far = (el) => (P + ZF) / (P + L - cz(el));

    // every photograph, in a fixed shuffle, taken round and round (so each repeats only once the
    // whole set has hung). The floor and ceiling take landscapes only: seen at a grazing angle, a
    // print's depth is squashed, and a landscape keeps its short side that way
    const all = Object.values(o.slides).filter((s) => s.w && s.h);
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
    const lands = all.filter((s) => s.w >= s.h);
    let ia = 0, il = 0;
    const nextAny = () => all[ia++ % all.length];
    const nextLand = () => lands[il++ % lands.length];

    root.innerHTML = '';
    const farEl = document.createElement('div'); farEl.className = 'corridor__far';
    const scene = document.createElement('div'); scene.className = 'corridor__scene';
    const planes = ['left', 'right', 'floor', 'ceiling'].map((n) => { const d = document.createElement('div'); d.className = `corridor__plane corridor__plane--${n}`; scene.appendChild(d); return d; });
    root.append(farEl, scene);
    const rs = root.style;
    rs.setProperty('--cp', P); rs.setProperty('--cl', L); rs.setProperty('--cw', (2 * hw).toFixed(1)); rs.setProperty('--ch', (2 * hh).toFixed(1));
    rs.setProperty('--cz', CZ0); rs.setProperty('--ca', 0); rs.setProperty('--dp', 0); rs.setProperty('--vg', 1);

    // the hang, like a pinned wall: down each wall, columns of prints sharing one width and stacked
    // to fill the height; across the floor and ceiling, rows of prints sharing one height and laid
    // to fill the width. Thin gutters between, a hair of jitter so no two columns line up
    const MAT = phone ? 4 : 6, GUT = phone ? 14 : 22, EDGE = phone ? 24 : 36, SMAX = phone ? 1.25 : 1.18;
    const dNear = CZ0 + 180, dFar = L - 70;
    const items = [];
    const wallR = phone ? 3 : 4, wallW = phone ? 280 : 340;
    for (const p of [0, 1]) {
      let d = dNear + (p ? 170 : 0);
      for (;;) {
        // at most two portraits in a column, or it would shrink to nothing
        const col = []; let ports = 0;
        for (let r = 0; r < wallR; r++) { let s = nextAny(); if (s.h > s.w) { if (ports >= 2) s = nextLand(); else ports++; } col.push(s); }
        const avail = 2 * hh - 2 * EDGE - (wallR - 1) * GUT;
        const sumR = col.reduce((a, s) => a + s.h / s.w, 0);
        const w = Math.min(wallW * SMAX, 2 * MAT + (avail - wallR * 2 * MAT) / sumR);
        if (d + w / 2 > dFar) break;
        const hs = col.map((s) => ((w - 2 * MAT) * s.h) / s.w + 2 * MAT);
        const gap = GUT + (avail - hs.reduce((a, b) => a + b, 0)) / (wallR - 1);
        let y = EDGE + (rnd() - 0.5) * 16;
        col.forEach((s, r) => { items.push({ p, d, c: y + hs[r] / 2, w, h: hs[r], s }); y += hs[r] + gap; });
        d += w + GUT;
      }
    }
    const fcN = phone ? 1 : 3, fcH = phone ? 280 : 300;
    for (const p of [2, 3]) {
      let d = dNear + (p === 3 ? 150 : 60);
      for (;;) {
        const row = []; for (let r = 0; r < fcN; r++) row.push(nextLand());
        const avail = 2 * hw - 2 * EDGE - (fcN - 1) * GUT;
        const sumQ = row.reduce((a, s) => a + s.w / s.h, 0);
        const h = Math.min(fcH * SMAX, 2 * MAT + (avail - fcN * 2 * MAT) / sumQ);
        if (d + h / 2 > dFar) break;
        const ws = row.map((s) => ((h - 2 * MAT) * s.w) / s.h + 2 * MAT);
        const used = ws.reduce((a, b) => a + b, 0);
        const gap = fcN > 1 ? GUT + (avail - used) / (fcN - 1) : 0;
        let x = EDGE + (fcN > 1 ? 0 : (avail - used) / 2) + (rnd() - 0.5) * 16;
        row.forEach((s, r) => { items.push({ p, d, c: x + ws[r] / 2, w: ws[r], h, s }); x += ws[r] + gap; });
        d += h + GUT;
      }
    }

    const imgs = [];
    items.forEach((it, i) => {
      const { p, d, c, w, h, s } = it;
      // a wall's local x runs along the corridor and its local y is the height; the floor's and
      // ceiling's local x runs across and local y along the corridor
      const px = p === 0 ? d - w / 2 : p === 1 ? L - d - w / 2 : c - w / 2;
      const py = p < 2 ? c - h / 2 : p === 2 ? L - d - h / 2 : d - h / 2;
      const fx = p < 2 ? 0 : c < hw ? -70 : 70, fy = p < 2 ? 70 : 0;
      const el = document.createElement('div');
      el.className = 'corridor__print';
      const st = el.style;
      st.setProperty('--px', px.toFixed(1)); st.setProperty('--py', py.toFixed(1));
      st.setProperty('--pw', w.toFixed(1)); st.setProperty('--ph', h.toFixed(1));
      st.setProperty('--pr', ((((i * 53) % 7) - 3) * 0.4).toFixed(2)); st.setProperty('--fx', fx); st.setProperty('--fy', fy);
      const im = new Image();
      im.decoding = 'async'; im.alt = ''; im.width = s.w; im.height = s.h; im.src = o.src(s);
      el.appendChild(im);
      planes[p].appendChild(el);
      imgs.push(im);
    });
    root.hidden = false;
    // the prints are decoded before the opening starts, but it never waits past a moment and a half;
    // a print still on its way shows its mat
    const loads = imgs.map((im) => (im.decode ? im.decode() : new Promise((r) => { im.onload = r; im.onerror = r; })).catch(() => {}).then(() => im.parentNode.classList.add('is-loaded')));
    const ready = Promise.race([Promise.all(loads), new Promise((r) => setTimeout(r, 1500))]);

    let over = false;
    const hide = () => { over = true; root.hidden = true; };
    const clear = () => { hide(); root.classList.remove('is-gone'); root.innerHTML = ''; };
    return {
      ready, far, length: CORRIDOR, trim: CORRIDOR_TRIM,
      // on a phone the far end is narrower than the name would be: the name is held a fifth
      // smaller down the corridor and grows to its size as the last prints fall away
      titleK: (el) => (phone ? 0.8 + 0.2 * easeInOut(clamp((el - 2600) / 700, 0, 1)) : 1),
      frame(el) {
        if (over) return;
        rs.setProperty('--cz', cz(el).toFixed(2));
        rs.setProperty('--vg', (1 - glide(el)).toFixed(3));
        rs.setProperty('--ca', clamp(el / 350, 0, 1).toFixed(3));
        rs.setProperty('--dp', easeInOut(clamp((el - FALL_AT) / FALL, 0, 1)).toFixed(4));
        if (el >= CORRIDOR) hide();
      },
      hide, clear,
      gone() { if (over) return; root.classList.add('is-gone'); setTimeout(hide, SKIP); },
    };
  };

  WC.opening = (o) => {
    const c = o.canvas;
    const ctx = c.getContext('2d');
    const title = o.title;
    const corr = o.corridor || null;
    // with the corridor in front, the globe's turning hold gives back a second of its time
    const PRE = corr ? corr.length : 0;
    const GLOBE_END = PRE + (corr ? GLOBE - corr.trim : GLOBE);
    const FLY_AT = GLOBE_END + UNROLL * 0.78;
    const TSHIFT = corr ? 500 : 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let W = 0, H = 0, titleH = 0;
    const size = () => {
      W = window.innerWidth; H = window.innerHeight;
      c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
      if (title) titleH = title.offsetHeight;
    };
    size();
    window.addEventListener('resize', size);
    const lon0 = -84, lat0 = -20, SPEED = 0.008;
    // the map's plate it unrolls into, stretched upright as the map is
    const SY = o.SY || 1;
    const plateRaw = WC.plateRaw(SY);
    const mutate = d3.geoProjectionMutator((t) => (l, p) => {
      const a = d3.geoOrthographicRaw(l, p), b = plateRaw(l, p);
      return [(1 - t) * a[0] * mutate.k + t * b[0], (1 - t) * a[1] * mutate.k + t * b[1]];
    });
    mutate.k = 1;
    const globeAt = () => {
      const R = Math.min(W, H) * (W < 700 ? 0.36 : 0.28);
      return { R, cx: W / 2, cy: H * 0.58 };
    };

    /* the routes on the flat map: each sampled once along its course (the same bowed course the
       Flights globe flies), its longitude unwrapped so a flight over the Pacific runs on past the
       map's edge and comes back in at the other, rather than crossing the whole world */
    const home = o.home;
    const near = (a, b) => d3.geoDistance(a, b) < 0.012;
    const seen = new Set();
    const legs = [];
    for (const f of o.flights) {
      // a flight out and its flight home draw the same line: drawn once
      const k = [f.from, f.to].map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).sort().join('|') + (f.mode === 'flight' ? 'f' : 'g');
      if (seen.has(k)) continue;
      seen.add(k);
      const r = makeRoute(f.from, f.to, f.mode, legs.length + 5);
      const fly = f.mode === 'flight';
      const n = fly ? 72 : 16;
      const U = new Float32Array(n), V = new Float32Array(n);
      let prev = 0;
      for (let i = 0; i < n; i++) {
        const q = course(r, i / (n - 1));
        const lon = Math.atan2(q[1], q[0]) / RAD, lat = Math.asin(clamp(q[2], -1, 1)) / RAD;
        let u = ((((lon - o.LON0) % 360) + 540) % 360) - 180;
        if (i) { while (u - prev > 180) u -= 360; while (u - prev < -180) u += 360; }
        U[i] = u; V[i] = lat * SY; prev = u;   // V in the plate's stretched degrees
      }
      const len = d3.geoDistance(f.from, f.to);
      legs.push({
        r, fly, n, U, V, len,
        dur: fly ? 650 + 1100 * Math.min(1, len / 1.75) : 600 + 900 * Math.min(1, len / 0.25),
        at: FLY_AT + (fly ? 0 : 200),
        to: f.to, home: near(f.to, home),
        lift: fly ? 0.05 + 0.05 * Math.min(1, len / 1.5) : 0,
      });
    }
    // each place landed at is ringed once, by the first flight to reach it; where he sets out
    // from is never marked
    const rings = [];
    legs.filter((L) => L.fly && !L.home).sort((a, b) => a.dur - b.dur).forEach((L) => {
      if (rings.some((q) => near(q.to, L.to))) return;
      rings.push({ to: L.to, t: L.at + L.dur, seed: rings.length + 3 });
    });
    const LAND = Math.max(...legs.map((L) => L.at + L.dur), FLY_AT) + 380;
    const CLEAR_AT = LAND + 120;
    const END = CLEAR_AT + CLEAR;
    const PX = new Float32Array(80), PY = new Float32Array(80);

    // a leg's points on the screen, offset by `shift` world-widths, up to `head` (0..1);
    // lifted a little off the map in the middle, as a flight is
    function place(L, head, shift, S, tx, ty, lw) {
      const k = S * RAD;
      const m = Math.max(2, Math.ceil(head * (L.n - 1)) + 1);
      const x0 = tx + (L.U[0] + shift) * k, y0 = ty - L.V[0] * k;
      const x1 = tx + (L.U[L.n - 1] + shift) * k, y1 = ty - L.V[L.n - 1] * k;
      const ch = Math.hypot(x1 - x0, y1 - y0) || 1;
      // the lift bows upward on the page
      let nx = (y1 - y0) / ch, ny = -(x1 - x0) / ch;
      if (ny > 0 || (ny === 0 && nx < 0)) { nx = -nx; ny = -ny; }
      const amp = 0.55 * lw;
      for (let i = 0; i < m; i++) {
        let u = i / (L.n - 1);
        let j = i;
        if (i === m - 1) { u = head; j = head * (L.n - 1); }
        const j0 = Math.min(L.n - 2, Math.floor(j)), fr = j - j0;
        const U = L.U[j0] + (L.U[j0 + 1] - L.U[j0]) * fr, V = L.V[j0] + (L.V[j0 + 1] - L.V[j0]) * fr;
        const h = L.lift * ch * Math.sin(Math.PI * u);
        const env = Math.min(1, u * 7, (1 - u) * 7);
        const w = (Math.sin(u * L.r.f1 + L.r.p1) * 0.62 + Math.sin(u * L.r.f2 + L.r.p2) * 0.38) * env * amp;
        PX[i] = tx + (U + shift) * k + nx * (h + w);
        PY[i] = ty - V * k + ny * (h + w);
      }
      return m;
    }
    function stroke(m, from = 0) {
      ctx.beginPath();
      ctx.moveTo(PX[from], PY[from]);
      for (let i = from + 1; i < m; i++) ctx.lineTo(PX[i], PY[i]);
    }

    function drawFlights(el, S, tx, ty, a) {
      const lw = W < 700 ? 0.95 : 1.15;
      const k = S * RAD;
      ctx.save();
      // the world's own width: nothing is drawn past its edges
      ctx.beginPath(); ctx.rect(tx - 180 * k, ty - 90 * SY * k, 360 * k, 180 * SY * k); ctx.clip();
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const L of legs) {
        const g = (el - L.at) / L.dur;
        if (g <= 0) continue;
        const head = easeInOut(Math.min(1, g));
        const lo = Math.min(L.U[0], L.U[L.n - 1]), hi = Math.max(L.U[0], L.U[L.n - 1]);
        for (const shift of [-360, 0, 360]) {
          if (hi + shift < -182 || lo + shift > 182) continue;
          const m = place(L, head, shift, S, tx, ty, lw);
          if (!L.fly) {
            // a leg over land: a faint dotted pen line
            stroke(m);
            ctx.setLineDash([0.2, 3 * lw]);
            ctx.strokeStyle = ink(0.42 * a); ctx.lineWidth = 1.4 * lw; ctx.stroke();
            ctx.setLineDash([]);
            continue;
          }
          // the wash first, a little off the pen line; then the pen
          ctx.save(); ctx.translate(1.1 * lw, 1.3 * lw);
          stroke(m); ctx.strokeStyle = WASH(0.22 * a); ctx.lineWidth = 3.2 * lw; ctx.stroke();
          ctx.restore();
          stroke(m); ctx.strokeStyle = ink(0.74 * a); ctx.lineWidth = 0.95 * lw; ctx.stroke();
          // in flight: the last stretch warms to vermilion toward the plane
          const live = clamp(1 - (g - 1) / 0.35, 0, 1);
          if (live <= 0) continue;
          const tl = Math.max(1, Math.round(m * 0.3));
          for (let i = Math.max(1, m - tl); i < m; i++) {
            const q = 1 - (m - i) / tl;
            ctx.beginPath(); ctx.moveTo(PX[i - 1], PY[i - 1]); ctx.lineTo(PX[i], PY[i]);
            ctx.strokeStyle = `rgba(212, 82, 60, ${0.9 * q * live * a})`; ctx.lineWidth = (0.95 + 0.6 * q) * lw; ctx.stroke();
          }
          let j = m - 1, back = 0;
          while (j > 0 && back < 5 * lw) { back += Math.hypot(PX[j] - PX[j - 1], PY[j] - PY[j - 1]); j--; }
          const ang = Math.atan2(PY[m - 1] - PY[j], PX[m - 1] - PX[j]);
          drawPlane(ctx, PX[m - 1], PY[m - 1], ang, 1.3 * lw, live * a);
        }
      }
      // the landings: a ring of the pen pops in where each place is reached
      for (const q of rings) {
        const x = (el - q.t) / 460;
        if (x <= 0) continue;
        const sc = outBack(clamp(x, 0, 1));
        const pts = ringOf(q.seed);
        const r = 5 * lw * sc;
        let u = ((((q.to[0] - o.LON0) % 360) + 540) % 360) - 180;
        ctx.save();
        ctx.translate(tx + u * k, ty - q.to[1] * SY * k);
        ctx.beginPath();
        for (let i = 0; i < pts.length; i++) { const p = pts[i]; if (i) ctx.lineTo(p[0] * r, p[1] * r); else ctx.moveTo(p[0] * r, p[1] * r); }
        ctx.strokeStyle = ink(0.84 * a * Math.min(1, x * 3)); ctx.lineWidth = 1.1 * lw; ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, 1.6 * lw, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 82, 60, ${0.85 * a * Math.min(1, x * 2)})`; ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }

    // the name: above the globe, then gliding down to the middle as the globe unrolls
    function setTitle(el) {
      if (!title) return;
      const g = globeAt();
      const top = g.cy - g.R;
      const h = titleH || 100;
      // just above the globe, clear of the margins' lettering (lowered at his word, 2026-10-03)
      const yc = clamp(top - 30 - h / 2, 64 + h / 2, top - 18 - h / 2);
      const yTop = (Number.isFinite(yc) ? yc : top * 0.5) - H / 2;
      const inA = easeOut(clamp((el - 260 - TSHIFT) / 1100, 0, 1));
      const inB = easeOut(clamp((el - 520 - TSHIFT) / 1000, 0, 1));
      const gl = easeInOut(clamp((el - GLOBE_END) / UNROLL, 0, 1));
      const out = easeInOut(clamp((el - CLEAR_AT) / CLEAR, 0, 1));
      // down the corridor the name stands at the far end with the globe, both scaled about the
      // middle of the window, and grows as the camera nears
      const far = corr && el < PRE ? corr.far(el) * corr.titleK(el) : 1;
      const st = title.style;
      st.setProperty('--oy', `${(yTop * far * (1 - gl) + 14 * (1 - inA)).toFixed(2)}px`);
      st.setProperty('--os', (far * (1 + 0.14 * gl)).toFixed(4));
      st.setProperty('--oa', (inA * (1 - out)).toFixed(3));
      st.setProperty('--ot', (0.09 * (1 - inA)).toFixed(4));
      st.setProperty('--ob', (inB * (1 - out)).toFixed(3));
      st.setProperty('--oby', `${(8 * (1 - inB)).toFixed(2)}px`);
    }

    const start = performance.now();
    let raf = 0, done = false, el = 0, painting = false, held = 0, real = 0;
    function frame(now) {
      if (done) return;
      // the globe keeps turning until the map beneath is painted and its photograph is in, so the
      // unroll never lands on a half-made page (his note, 2026-10-03: things popping in). `real`
      // keeps the globe turning smoothly through the hold; `el` is the opening's own clock
      real = now - start;
      el = real - held;
      if (el >= GLOBE_END && o.ready && !o.ready() && held < 8000) { held += el - GLOBE_END; el = GLOBE_END; }
      if (!painting) { painting = true; c.classList.add('is-painting'); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const { R, cx, cy } = globeAt();
      const target = o.target();
      const S = target.scale;
      setTitle(el);
      if (corr) corr.frame(el);
      if (el < GLOBE_END) {
        // the globe, turning: down the corridor it is seen small at the far end, and grows as the
        // camera nears; once the corridor has gone it turns where it always has
        const far = corr && el < PRE ? corr.far(el) : 1;
        const fadeIn = corr ? clamp((el - 650) / 600, 0, 1) : Math.min(1, el / 420);
        const Rf = R * far, cyf = H / 2 + (cy - H / 2) * far;
        ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
        // the backdrop photograph comes up from nothing behind the corridor and the globe, from
        // the first frame to the moment the globe unrolls (his call, 2026-10-03)
        if (o.backdrop) o.backdrop(ctx, el, GLOBE_END);
        if (fadeIn > 0) {
          const proj = d3.geoOrthographic().clipAngle(90).precision(0.5).scale(Rf * (0.94 + 0.06 * easeOut(fadeIn))).translate([cx, cyf]).rotate([lon0 - real * SPEED, lat0]);
          ctx.globalAlpha = fadeIn;
          castShadow(ctx, cx + Rf * 0.08, cyf + Rf * 1.12, Rf * 0.86, 1.3);
          // a solid paper globe, as the small one bottom-left is (his call, 2026-10-03)
          WC.paintGlobe(ctx, proj, { land: o.land, travel: o.travel, lw: 1.3, grain: 1, R: Rf * 0.8 });
          ctx.globalAlpha = 1;
        }
      } else {
        // it unrolls: orthographic into the map's own equirectangular plate, onto the exact place
        // it will lie; then that drawing dissolves into the real map underneath
        const x = Math.min(1, (el - GLOBE_END) / UNROLL);
        const t = easeInOut(x);
        const mapA = 1 - easeInOut(clamp((el - GLOBE_END - UNROLL) / DISSOLVE, 0, 1));
        if (mapA > 0.002) {
          mutate.k = R / S;
          const rot = [lon0 - (GLOBE_END + held) * SPEED, lat0];   // where the turning globe got to
          const dl = ((-o.LON0 - rot[0]) % 360 + 540) % 360 - 180;
          const proj = mutate(t).scale(S)
            .translate([cx + (target.translate[0] - cx) * t, cy + (target.translate[1] - cy) * t])
            .rotate([rot[0] + dl * t, rot[1] * (1 - t)])
            .precision(0.5);
          // clipped to a circle round the centre that widens to the whole sphere, and also cut
          // along the far meridian, where the flat half of the drawing would otherwise jump a
          // whole world's width
          if (t < 0.001) proj.clipAngle(90);
          else {
            const circle = d3.geoClipCircle((90 + 89.9 * Math.min(1, t * 1.15)) * RAD);
            proj.preclip((stream) => d3.geoClipAntimeridian(circle(stream)));
          }
          ctx.save();
          ctx.globalAlpha = mapA;
          ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
          // the backdrop stays under the sheet, whose paper thins as it unrolls, so the sea of the
          // drawn map shows the photograph just as the real map will
          if (o.backdrop) o.backdrop(ctx, el, 0);
          if (t < 1) {
            // the shadow lifts away as the globe opens
            ctx.globalAlpha = mapA * (1 - t);
            castShadow(ctx, cx + R * 0.08, cy + R * 1.12, R * 0.86, 1.3);
            ctx.globalAlpha = mapA;
          }
          // (the sheet is clipped to a circle that opens out fast, not to the sphere's outline,
          // which folds over itself once the far side starts to show)
          WC.paintGlobe(ctx, proj, {
            land: o.land, travel: o.travel, round: Math.pow(1 - t, 3), grat: 1 - t, edgeA: Math.pow(1 - t, 4),
            lw: 1.3 - 0.4 * t, grain: 1, R: R * 0.8 * (1 - t) + 60 * t, r0: R, clipR: R * (1 + 24 * t),
            // the disc's paper is gone within the first eighth of the unroll, before the sheet
            // has grown much, so no white circle spreads over the photograph
            paperA: o.backdrop ? Math.pow(1 - Math.min(1, t * 8), 2) : 1,
          });
          ctx.restore();
        }
        if (el >= FLY_AT) {
          const fa = 1 - easeInOut(clamp((el - CLEAR_AT) / CLEAR, 0, 1));
          if (fa > 0) drawFlights(el, S, target.translate[0], target.translate[1], fa);
        }
        if (o.onClear && !cleared && el >= CLEAR_AT + 300) { cleared = true; o.onClear(); }
        if (el >= END) { finish(false); return; }
      }
      raf = requestAnimationFrame(frame);
    }
    let cleared = false;
    function finish(skipped) {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', size);
      if (!cleared && o.onClear) { cleared = true; o.onClear(); }
      const rest = () => { c.hidden = true; c.width = c.height = 1; if (corr) corr.clear(); if (o.onDone) o.onDone(); };
      if (skipped) {
        // resolve quickly: the drawing, the corridor and the name fade together onto the map
        c.classList.add('is-gone');
        if (title) title.classList.add('is-gone');
        if (corr) corr.gone();
        setTimeout(rest, SKIP);
      } else rest();
    }
    raf = requestAnimationFrame(frame);
    return { skip: () => finish(true), get done() { return done; }, get elapsed() { return el; }, get end() { return END; } };
  };
})();

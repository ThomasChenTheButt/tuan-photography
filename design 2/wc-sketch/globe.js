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
         the wash widths; defaults to the projection's scale), grain (pattern scale), dim }
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
    const r0 = lens ? o.frame : proj.scale();
    ctx.save();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath();
    if (lens) ctx.arc(cx, cy, r0, 0, Math.PI * 2); else path(SPHERE);
    ctx.fillStyle = PAPER; ctx.fill();
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
    const hatch = round * (o.hatch == null ? 1 : o.hatch);
    if (hatch > 0.02 && o.shade !== false) hatchShade(ctx, cx, cy, proj.scale(), hatch, lw);
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
    ctx.restore();
    // the outline: one confident circle of the pen, and a second just off it where the nib lifted
    if (round > 0) {
      ctx.save();
      ctx.globalAlpha = round;
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
         places: [[lng, lat]], reduce(), letter(text) -> sprite, onLeg(i) }
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
    route(a, b, mode, seed) {
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
          const steps = [['land', hi.land], ['travel', hi.travel], ['borders', hi.borders]];
          const geo = {};
          const next = () => {
            const st = steps.shift();
            if (!st) { reg.geo = geo; reg.ready = true; return; }
            geo[st[0]] = st[1] ? capClip(st[1], c, r) : null;
            setTimeout(next, 16);
          };
          setTimeout(next, 30);
        }
        return reg;
      });
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
      const A = r.A, B = r.B;
      for (let i = 0; i < n; i++) {
        const u = u0 + ((u1 - u0) * i) / (n - 1);
        let x, y, z;
        if (r.sinD < 1e-7) { x = A[0]; y = A[1]; z = A[2]; } else {
          const a = Math.sin((1 - u) * r.d) / r.sinD, b = Math.sin(u * r.d) / r.sinD;
          x = a * A[0] + b * B[0]; y = a * A[1] + b * B[1]; z = a * A[2] + b * B[2];
          if (r.bend) {
            // the steady course at u (a rhumb line), blended in and set back on the sphere
            const lo = (r.lon0 + r.dl * u) * RAD, la = 2 * Math.atan(Math.exp(r.my0 + (r.my1 - r.my0) * u)) - Math.PI / 2;
            const k = r.bend, cl = Math.cos(la);
            x = (1 - k) * x + k * cl * Math.cos(lo); y = (1 - k) * y + k * cl * Math.sin(lo); z = (1 - k) * z + k * Math.sin(la);
            const m = Math.hypot(x, y, z) || 1; x /= m; y /= m; z /= m;
          }
        }
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
      const s = 1.55 * lw;
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
      // the names: the newest first while travelling, in the order reached once it is all drawn
      const done = rt >= rp.total;
      if (!done) shown.sort((p, q) => q.st.pop - p.st.pop);
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
        for (const [ox, oy] of spots) {
          const bx = [x + ox - 2, y + oy - sp.size * 0.72, x + ox + sp.inkW + 2, y + oy + sp.size * 0.42];
          const inside = cam.lens
            ? [[bx[0], bx[1]], [bx[2], bx[1]], [bx[0], bx[3]], [bx[2], bx[3]]].every((q) => Math.hypot(q[0] - cam.cx, q[1] - cam.cy) < cam.rf - 4)
            : bx[0] > 2 && bx[2] < s - 2 && bx[1] > 2 && bx[3] < s - 2;
          if (inside && !boxes.some((o) => bx[0] < o[2] && bx[2] > o[0] && bx[1] < o[3] && bx[3] > o[1])) { box = bx; px = x + ox - sp.bx; py = y + oy - sp.by + sp.size * 0.35; break; }
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
      const geo = this.geoFor();
      WC.paintGlobe(ctx, this.proj, {
        land: geo.land, travel: geo.travel, borders: geo.borders, lw, grain: 1,
        R: Math.min(R * 0.8, s * 0.34), frame: rf,
        hatch: clamp((1.55 - this.k) / 0.45, 0, 1), grat: clamp((5 - this.k) / 3, 0.25, 1),
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
      if (this.o.reduce()) { this.draw(performance.now()); return; }
      this.running = true;
      this.last = 0;
      this.raf = requestAnimationFrame((n) => this.loop(n));
    }
    stop() { this.running = false; cancelAnimationFrame(this.raf); }
  };

  /* ------------------------------------------------------------ the opening: a globe that unrolls into the map */

  /*
    o: { canvas, land, travel, flights, LON0, LAT_N, LAT_S, target(): { scale, translate } of the flat
         map (d3 equirectangular), onUnroll(), onDone() }
    returns { skip() }
  */
  WC.opening = (o) => {
    const c = o.canvas;
    const ctx = c.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let W = 0, H = 0;
    const size = () => {
      W = window.innerWidth; H = window.innerHeight;
      c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
    };
    size();
    const SPIN = 300, SCATTER = 3000, UNROLL = 1500, FADE = 700;
    const start = performance.now();
    let raf = 0, done = false, unrolled = false;
    const lon0 = -96, lat0 = -20;
    const mutate = d3.geoProjectionMutator((t) => (l, p) => {
      const a = d3.geoOrthographicRaw(l, p), b = d3.geoEquirectangularRaw(l, p);
      return [(1 - t) * a[0] * mutate.k + t * b[0], (1 - t) * a[1] * mutate.k + t * b[1]];
    });
    mutate.k = 1;

    function frame(now) {
      if (done) return;
      const el = now - start;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const R = Math.min(W, H) * (W < 700 ? 0.36 : 0.3);
      const target = o.target();
      const spin = Math.min(el, SPIN + SCATTER) * 0.007;
      if (el < SPIN + SCATTER) {
        const fadeIn = Math.min(1, el / 350);
        const proj = d3.geoOrthographic().clipAngle(90).precision(0.5).scale(R * (0.94 + 0.06 * easeOut(fadeIn))).translate([W / 2, H / 2]).rotate([lon0 - spin, lat0]);
        ctx.globalAlpha = fadeIn;
        castShadow(ctx, W / 2 + R * 0.08, H / 2 + R * 1.12, R * 0.86, 1.3);
        WC.paintGlobe(ctx, proj, { land: o.land, travel: o.travel, lw: 1.3, grain: 1, R: R * 0.8 });
        WC.paintFlights(ctx, proj, o.flights, Math.max(0, el - 150), { ortho: true, lw: 1.5, alpha: fadeIn, stagger: 110, ground: false });
        ctx.globalAlpha = 1;
      } else {
        // it unrolls: orthographic into the map's own equirectangular plate, onto the exact place it will lie
        if (!unrolled) { unrolled = true; if (o.onUnroll) o.onUnroll(); }
        const x = Math.min(1, (el - SPIN - SCATTER) / UNROLL);
        const t = easeInOut(x);
        const S = target.scale;
        mutate.k = R / S;
        const rot = [lon0 - (SPIN + SCATTER) * 0.007, lat0];
        const dl = ((-o.LON0 - rot[0]) % 360 + 540) % 360 - 180;
        const proj = mutate(t).scale(S)
          .translate([W / 2 + (target.translate[0] - W / 2) * t, H / 2 + (target.translate[1] - H / 2) * t])
          .rotate([rot[0] + dl * t, rot[1] * (1 - t)])
          .precision(0.5);
        if (t < 0.985) proj.clipAngle(90 + 89.9 * Math.min(1, t * 1.15)); else proj.clipAngle(null);
        ctx.save();
        ctx.globalAlpha = 1 - t * 0.25;
        WC.paintGlobe(ctx, proj, { land: o.land, travel: o.travel, round: 1 - t, grat: 1 - t, lw: 1.3 - 0.4 * t, grain: 1, R: R * 0.8 * (1 - t) + 60 * t });
        WC.paintFlights(ctx, proj, o.flights, 1e9, { alpha: 1 - Math.min(1, x * 2.5), lw: 1.3, still: true, ground: false });
        ctx.restore();
        if (x >= 1) { finish(); return; }
      }
      raf = requestAnimationFrame(frame);
    }
    function finish() {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      if (!unrolled && o.onUnroll) o.onUnroll();
      c.classList.add('is-gone');
      setTimeout(() => { c.hidden = true; c.width = c.height = 1; }, FADE);
      if (o.onDone) o.onDone();
    }
    raf = requestAnimationFrame(frame);
    return { skip: finish, get done() { return done; } };
  };
})();

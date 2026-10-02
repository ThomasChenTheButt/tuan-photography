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
    ctx.save();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath(); path(SPHERE);
    ctx.fillStyle = PAPER; ctx.fill();
    ctx.clip();
    if (o.land) {
      // the sea: a pale band along every coast, drying out to bare paper offshore
      ctx.beginPath(); path(o.land);
      const ws = [0.08, 0.046, 0.02], as = [0.09, 0.12, 0.15];
      for (let i = 0; i < 3; i++) { ctx.lineWidth = Math.max(1.6, ws[i] * R); ctx.strokeStyle = `rgba(132, 186, 218, ${as[i]})`; ctx.stroke(); }
      ctx.fillStyle = PAPER; ctx.fill();
      // the land's wash, laid a little off the line, with a dried edge
      ctx.save();
      ctx.translate(1.3 * lw, 1.0 * lw);
      ctx.beginPath(); path(o.land);
      const pl = ctx.createPattern(t.land, 'repeat');
      pl.setTransform(new DOMMatrix().scaleSelf(0.5 * g, 0.5 * g));
      ctx.fillStyle = pl; ctx.fill();
      ctx.strokeStyle = 'rgba(170, 150, 84, 0.2)'; ctx.lineWidth = 1.1 * lw; ctx.stroke();
      ctx.restore();
      if (o.travel) {
        ctx.save();
        ctx.translate(-1.1 * lw, 1.5 * lw);
        ctx.beginPath();
        for (const f of o.travel) path(f);
        const pw = ctx.createPattern(t.warm, 'repeat');
        pw.setTransform(new DOMMatrix().scaleSelf(0.5 * g, 0.5 * g));
        ctx.fillStyle = pw; ctx.fill();
        ctx.strokeStyle = 'rgba(206, 100, 84, 0.3)'; ctx.lineWidth = 1.1 * lw; ctx.stroke();
        ctx.restore();
      }
    }
    if (round > 0.02 && o.shade !== false) {
      const [cx, cy] = proj.translate();
      hatchShade(ctx, cx, cy, proj.scale(), round, lw);
    }
    // a faint pencil graticule
    ctx.beginPath(); path(graticule);
    ctx.strokeStyle = `rgba(92, 88, 82, ${0.16 * (o.grat == null ? 1 : o.grat)})`; ctx.lineWidth = 0.5 * lw; ctx.stroke();
    if (o.borders && o.borderA !== 0) {
      ctx.beginPath(); path(o.borders);
      ctx.setLineDash([1.6 * lw, 2.4 * lw]);
      ctx.strokeStyle = ink(0.34 * (o.borderA == null ? 1 : o.borderA)); ctx.lineWidth = 0.55 * lw; ctx.stroke();
      ctx.setLineDash([]);
    }
    if (o.land) {
      ctx.beginPath(); path(o.land);
      ctx.strokeStyle = ink(0.86); ctx.lineWidth = 0.75 * lw; ctx.stroke();
    }
    ctx.restore();
    // the outline: one confident circle of the pen, and a second just off it where the nib lifted
    if (round > 0) {
      const [cx, cy] = proj.translate();
      const r0 = proj.scale();
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
    o: { land, travel, borders, flights (all), reduce(), letter(text) -> sprite from WC.letter }
    focus({ flights: [routes], dests: [{ ll: [lng, lat], name }] } | null)
  */
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
      this.t0 = performance.now();
      this.touched = 0;
      this.proj = d3.geoOrthographic().clipAngle(90).precision(0.5);
      this.focusSet = null;
      this.anim = null;
      this.bind();
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
        this.anim = null;
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
          try { c.setPointerCapture(e.pointerId); } catch (err) { /* fine */ }
          c.classList.add('is-turning');
        }
        const now = performance.now();
        const R = this.R || 200;
        const dl = (dx / R) * 57, dp = (-dy / R) * 57;
        this.rot = [this.rot[0] + dl, clamp(this.rot[1] + dp, -70, 70)];
        const dt = Math.max(8, now - last.t);
        this.vel = [dl / dt, dp / dt];
        last.x = e.clientX; last.y = e.clientY; last.t = now;
        this.touched = now;
        this.kick();
      });
      const end = (e) => {
        if (!last || (e && e.pointerId !== last.id)) return;
        if (performance.now() - last.t > 80) this.vel = [0, 0];
        last = null;
        c.classList.remove('is-turning');
        this.touched = performance.now();
        this.kick();
      };
      c.addEventListener('pointerup', end);
      c.addEventListener('pointercancel', end);
      c.addEventListener('wheel', (e) => {
        e.preventDefault();
        this.k = clamp(this.k * Math.exp(-e.deltaY * 0.0012), 0.82, 1.18);
        this.touched = performance.now();
        this.kick();
      }, { passive: false });
    }
    focus(j) {
      const now = performance.now();
      this.focusSet = j ? new Set(j.flights) : null;
      this.seqOf = j ? new Map(j.flights.map((ix, n) => [ix, n])) : null;
      const all = this.o.flights;
      this.dests = j ? j.dests.map((d) => ({ ...d, at: d.via != null && all[d.via] ? this.seqOf.get(d.via) * 420 + 80 + (d.dep ? 0 : all[d.via].dur * 0.8) : 200 })) : [];
      this.focusT0 = now;
      if (!j) { this.anim = null; this.kick(); return; }
      const pts = j.dests.map((d) => d.ll).concat(j.ends || []);
      const cen = d3.geoCentroid({ type: 'MultiPoint', coordinates: pts });
      const span = Math.max(0.2, ...pts.map((p) => d3.geoDistance(p, cen)));
      const to = [-cen[0], clamp(-cen[1], -55, 55)];
      let dl = ((to[0] - this.rot[0]) % 360 + 540) % 360 - 180;
      const from = this.rot.slice(), k0 = this.k;
      const k1 = span < 0.5 ? 1.16 : span < 0.9 ? 1.06 : 0.94;
      this.vel = [0, 0];
      this.anim = { t0: now, dur: this.o.reduce() ? 1 : 1000, from, to: [from[0] + dl, to[1]], k0, k1 };
      this.kick();
    }
    draw(now) {
      const { ctx, size: s, dpr } = this;
      if (!s) return;
      const still = this.o.reduce();
      if (this.anim) {
        const x = Math.min(1, (now - this.anim.t0) / this.anim.dur);
        const e = easeInOut(x);
        this.rot = [this.anim.from[0] + (this.anim.to[0] - this.anim.from[0]) * e, this.anim.from[1] + (this.anim.to[1] - this.anim.from[1]) * e];
        this.k = this.anim.k0 + (this.anim.k1 - this.anim.k0) * e;
        if (x >= 1) this.anim = null;
      }
      const R = (this.R = s * 0.4 * this.k);
      const lw = Math.max(1, s / 520);
      this.proj.scale(R).translate([s / 2, s * 0.47]).rotate(this.rot);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, s, s);
      castShadow(ctx, s * 0.53, Math.min(s * 0.47 + R * 1.12, s * 0.955), R * 0.86, lw);
      WC.paintGlobe(ctx, this.proj, { land: this.o.land, travel: this.o.travel, borders: this.o.borders, lw, grain: 1, R: R * 0.8 });
      const all = this.o.flights;
      const t = still ? 0 : (now - this.t0) % WC.flightCycle(all);
      const ft = still ? 1e9 : now - this.focusT0;
      WC.paintFlights(ctx, this.proj, all, t, { still: still && !this.focusSet, ortho: true, lw: lw * 1.25, focus: this.focusSet, seqOf: this.seqOf, focusT: ft });
      // the destinations of the journey in view: a ring of the pen and the name lettered beside it
      if (this.focusSet && this.dests) {
        const centre = this.proj.invert(this.proj.translate());
        const shown = [];
        // first every ring, then the names, each clear of the rings and of each other
        this.dests.forEach((d, n) => {
          if (d3.geoDistance(d.ll, centre) > Math.PI / 2 - 0.05) return;
          const xy = this.proj(d.ll);
          if (!xy) return;
          const at = still ? 1 : clamp((ft - (d.at || 0)) / 420, 0, 1);
          if (at <= 0) return;
          shown.push({ d, xy, at });
          const sc = easeOut(at);
          const pts = WC.ringPts(n + 3);
          ctx.save();
          ctx.translate(xy[0], xy[1]);
          ctx.beginPath();
          pts.forEach((p, i) => (i ? ctx.lineTo(p[0] * 8 * lw * sc, p[1] * 8 * lw * sc) : ctx.moveTo(p[0] * 8 * lw * sc, p[1] * 8 * lw * sc)));
          ctx.strokeStyle = ink(0.85 * at); ctx.lineWidth = 1.2 * lw; ctx.lineJoin = 'round'; ctx.stroke();
          ctx.beginPath(); ctx.arc(0, 0, 2.2 * lw, 0, Math.PI * 2); ctx.fillStyle = HEAD; ctx.globalAlpha = at; ctx.fill();
          ctx.restore();
        });
        const boxes = [];
        for (const { d, xy, at } of shown) {
          const sp = this.o.letter(d.name);
          if (!sp) continue;
          // beside the ring, right or left, else above or below; never on another name
          const spots = [[10 * lw, 0], [-10 * lw - sp.inkW, 0], [-sp.inkW / 2, -13 * lw], [-sp.inkW / 2, 15 * lw]];
          let x = 0, y = 0, box = null;
          for (const [ox, oy] of spots) {
            const bx = [xy[0] + ox - 2, xy[1] + oy - sp.size * 0.7, xy[0] + ox + sp.inkW + 2, xy[1] + oy + sp.size * 0.45];
            if (bx[0] > 2 && bx[2] < s - 2 && bx[1] > 2 && bx[3] < s - 2 && !boxes.some((o) => bx[0] < o[2] && bx[2] > o[0] && bx[1] < o[3] && bx[3] > o[1])) {
              box = bx; x = xy[0] + ox - sp.bx; y = xy[1] + oy - sp.by + sp.size * 0.35; break;
            }
          }
          if (!box) continue;
          boxes.push(box);
          ctx.globalAlpha = at;
          ctx.drawImage(sp.c, x, y, sp.w, sp.h);
          ctx.globalAlpha = 1;
        }
      }
    }
    kick() { if (!this.running) this.draw(performance.now()); }
    loop(now) {
      if (!this.running) return;
      const dt = Math.min(64, now - (this.last || now));
      this.last = now;
      if (!this.anim) {
        if (Math.abs(this.vel[0]) + Math.abs(this.vel[1]) > 0.0005) {
          this.rot = [this.rot[0] + this.vel[0] * dt, clamp(this.rot[1] + this.vel[1] * dt, -70, 70)];
          const f = Math.pow(0.94, dt / 16);
          this.vel = [this.vel[0] * f, this.vel[1] * f];
        } else if (!this.focusSet && now - this.touched > 1800 && !this.o.reduce()) {
          this.rot[0] += dt * 0.008;
        }
      }
      this.draw(now);
      this.raf = requestAnimationFrame((n) => this.loop(n));
    }
    start() {
      if (this.running) return;
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

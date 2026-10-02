// a stop's name in the page's language: city names in the data carry en and zh
const txt = (l) => (!l || typeof l === 'string') ? (l || '') : ((document.documentElement.lang.startsWith('zh') && l.zh) || l.en || '');
/* tuan photography 陳亮元 · design 2 · "Two pigments": the globe of flights.
   Painted in the map's two pigments: an indigo sea pooled darker toward the rim where the wash
   dried, the land left as washi under the palest indigo-grey, the countries travelled glazed in
   persimmon, the flights drawn in persimmon with a bright head and a fading tail.
   A small globe turns in the corner of the map; pressed, it opens into the Flights view, where a
   larger one can be turned by hand and each journey draws its own flights. */
(() => {
  'use strict';
  const WC = (window.WC = window.WC || {});

  const INK = (a) => `rgba(34, 50, 96, ${a})`;
  const PERS = (a) => `rgba(214, 112, 52, ${a})`;
  const PERS_DEEP = (a) => `rgba(170, 72, 22, ${a})`;
  const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const easeOut = (x) => 1 - Math.pow(1 - x, 3);
  const graticule = d3.geoGraticule().step([15, 15])();

  let fibre = null;
  const fibreTile = () => (fibre || (fibre = WC.washiTile(384, 13)));

  /* ------------------------------------------------------------ the routes */

  /*
    Every flight he has flown, journey by journey. A journey with legs draws its own legs, in order
    (flights only; ground legs are kept to draw faintly). A journey without legs falls back to one
    arc from where he flies from to each of its places.
    S: window.SITE; placeLL(cid) -> [lat, lng]; name(cid) -> label
    returns { journeys: Map(id -> { flights, ground, stops }), all: [flight] }
  */
  WC.routes = (S, placeLL, name) => {
    const fromLL = S.flightsFrom || [25.03, 121.56];
    const from = [fromLL[1], fromLL[0]];
    const r = (() => { let s = 19; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
    const isFrom = (p) => Math.abs(p[0] - from[0]) < 0.8 && Math.abs(p[1] - from[1]) < 0.8;
    const same = (a, b) => Math.abs(a[0] - b[0]) < 0.05 && Math.abs(a[1] - b[1]) < 0.05;
    const make = (a, b) => {
      const len = d3.geoDistance(a, b);
      return { from: a, to: b, interp: d3.geoInterpolate(a, b), len, dur: 1000 + len * 520, jitter: r() * 140 };
    };
    const journeys = new Map();
    const seen = new Map();
    const all = [];
    for (const j of S.journeys || []) {
      // seq: every leg in the order travelled; stops: the places it reaches, each with the leg that brings it in
      const seq = [], stops = [];
      const stop = (p, label, leg, end) => {
        if (!p || isFrom(p)) return; // where he flies from is never marked
        if (stops.some((s) => same(s.p, p) || (label && txt(s.label) === txt(label) && d3.geoDistance(s.p, p) < 0.04))) return;
        stops.push({ p, label, leg, end });
      };
      const legs = Array.isArray(j.legs) ? j.legs.filter((l) => l && l.from && l.to && isFinite(l.from.lat) && isFinite(l.to.lat)) : [];
      if (legs.length) {
        legs.forEach((l) => {
          const a = [+l.from.lng, +l.from.lat], b = [+l.to.lng, +l.to.lat];
          const ground = (l.mode || 'flight') !== 'flight';
          seq.push({ f: make(a, b), ground });
          stop(a, { en: l.from.city || l.from.code || '', zh: l.from.zh }, seq.length - 1, false);
          stop(b, { en: l.to.city || l.to.code || '', zh: l.to.zh }, seq.length - 1, true);
        });
      } else {
        for (const cid of j.countries || []) {
          const ll = placeLL(cid);
          if (!ll) continue;
          const b = [ll[1], ll[0]];
          if (isFrom(b)) continue;
          seq.push({ f: make(from, b), ground: false });
          stop(b, name(cid), seq.length - 1, true);
        }
      }
      journeys.set(j.id, { id: j.id, seq, stops, flights: seq.filter((x) => !x.ground).map((x) => x.f), ground: seq.filter((x) => x.ground).map((x) => x.f) });
      for (const x of seq) {
        if (x.ground) continue;
        const k = [x.f.from, x.f.to].map((p) => p.map((v) => v.toFixed(1)).join(',')).join('>');
        if (seen.has(k)) continue;
        seen.set(k, x.f);
        all.push(x.f);
      }
    }
    if (!all.length) {
      for (const c of S.countries) {
        const ll = placeLL(c.id);
        if (ll && !isFrom([ll[1], ll[0]])) all.push(make(from, [ll[1], ll[0]]));
      }
    }
    return { journeys, all };
  };

  const STAGGER = 230;
  const TAIL = 0.42;
  WC.flightCycle = (flights) => Math.max(1, ...flights.map((f, i) => i * STAGGER + f.jitter + f.dur * (1 + TAIL))) + 2600;

  /* ------------------------------------------------------------ painting the globe */

  WC.paintGlobe = (ctx, proj, o) => {
    const path = d3.geoPath(proj, ctx);
    const lw = o.lw || 1;
    const dim = o.dim == null ? 0 : o.dim;
    const [cx, cy] = proj.translate();
    const R = proj.scale();
    ctx.save();
    // the sea: an indigo wash, pale toward the light and pooled deeper at the rim where it dried
    ctx.beginPath(); path({ type: 'Sphere' });
    const grad = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.34, R * 0.04, cx, cy, R * 1.01);
    grad.addColorStop(0, 'rgb(233, 237, 242)');
    grad.addColorStop(0.55, 'rgb(212, 221, 233)');
    grad.addColorStop(0.88, 'rgb(180, 195, 217)');
    grad.addColorStop(1, 'rgb(150, 168, 199)');
    ctx.fillStyle = grad; ctx.fill();
    if (o.land) {
      ctx.save();
      ctx.translate(0.9 * lw, 0.7 * lw);
      ctx.beginPath(); path(o.land);
      ctx.fillStyle = 'rgb(244, 245, 242)'; ctx.fill();
      ctx.fillStyle = 'rgba(120, 134, 168, 0.12)'; ctx.fill();
      ctx.restore();
      if (o.travel) {
        ctx.save();
        ctx.translate(-0.6 * lw, 0.8 * lw);
        ctx.beginPath();
        for (const f of o.travel) path(f);
        ctx.fillStyle = PERS(0.34 * (1 - dim * 0.5)); ctx.fill();
        ctx.strokeStyle = PERS(0.36 * (1 - dim * 0.5)); ctx.lineWidth = 1.1 * lw; ctx.stroke();
        ctx.restore();
      }
    }
    // the sheet's fibres show through the wash
    ctx.save();
    ctx.beginPath(); path({ type: 'Sphere' });
    ctx.clip();
    const pat = ctx.createPattern(fibreTile(), 'repeat');
    pat.setTransform(new DOMMatrix().scaleSelf(0.5 * (o.grain || 1), 0.5 * (o.grain || 1)));
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = pat;
    ctx.fillRect(cx - R - 2, cy - R - 2, 2 * R + 4, 2 * R + 4);
    ctx.restore();
    // the faintest graticule
    ctx.beginPath(); path(graticule);
    ctx.strokeStyle = INK(0.1); ctx.lineWidth = 0.5 * lw; ctx.stroke();
    if (o.land) {
      ctx.beginPath(); path(o.land);
      ctx.strokeStyle = INK(0.62); ctx.lineWidth = 0.55 * lw; ctx.lineJoin = 'round'; ctx.stroke();
    }
    // the rim, dried dark where the wash stopped
    ctx.beginPath(); path({ type: 'Sphere' });
    ctx.strokeStyle = 'rgba(70, 92, 140, 0.3)'; ctx.lineWidth = 3 * lw; ctx.stroke();
    ctx.strokeStyle = INK(0.7); ctx.lineWidth = 0.75 * lw; ctx.stroke();
    ctx.restore();
  };

  const visible = (proj, p) => {
    const r = proj.rotate();
    return d3.geoDistance(p, [-r[0], -r[1]]) < Math.PI / 2 - 0.02;
  };
  // one flight at progress g (0 nothing, 1 the head arrives, 1 + TAIL the tail arrives too)
  function flightAt(ctx, proj, path, f, g, alpha, lw, keep) {
    if (g <= 0) return;
    if (keep && g >= 0.02) {
      const upto = Math.min(1, easeOut(Math.min(1, g)));
      ctx.beginPath(); path({ type: 'LineString', coordinates: d3.range(0, upto + 0.0001, upto / 24).map(f.interp) });
      ctx.strokeStyle = PERS(0.5 * alpha); ctx.lineWidth = 0.9 * lw; ctx.stroke();
    } else if (g >= 1) {
      ctx.beginPath(); path({ type: 'LineString', coordinates: d3.range(0, 1.0001, 1 / 24).map(f.interp) });
      ctx.strokeStyle = PERS(0.3 * alpha * Math.min(1, (g - 1) * 3)); ctx.lineWidth = 0.6 * lw; ctx.stroke();
    }
    const head = Math.min(1, easeOut(Math.min(1, g)));
    const tailE = Math.min(head, easeOut(Math.min(1, Math.max(0, g - TAIL))));
    if (head - tailE > 0.002) {
      const n = 18;
      for (let k = 0; k < n; k++) {
        const a0 = tailE + ((head - tailE) * k) / n, a1 = tailE + ((head - tailE) * (k + 1)) / n;
        ctx.beginPath(); path({ type: 'LineString', coordinates: [f.interp(a0), f.interp((a0 + a1) / 2), f.interp(a1)] });
        ctx.strokeStyle = PERS_DEEP(((k + 1) / n) * 0.95 * alpha);
        ctx.lineWidth = (0.5 + (0.75 * (k + 1)) / n) * lw;
        ctx.stroke();
      }
    }
    // the bright head, until it lands (a kept flight leaves no dot behind where it arrives)
    if (g > 0 && g < (keep ? 0.999 : 1.05)) {
      const p = f.interp(head);
      const xy = proj(p);
      if (xy && visible(proj, p)) {
        ctx.beginPath(); ctx.arc(xy[0], xy[1], 2.7 * lw, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(243, 245, 246, ${0.9 * alpha})`; ctx.fill();
        ctx.beginPath(); ctx.arc(xy[0], xy[1], 1.7 * lw, 0, Math.PI * 2);
        ctx.fillStyle = PERS(alpha); ctx.fill();
      }
    }
  }

  // all the flights scattering at time t (ms into the cycle)
  WC.paintFlights = (ctx, proj, flights, t, o = {}) => {
    const path = d3.geoPath(proj, ctx);
    const alpha = o.alpha == null ? 1 : o.alpha;
    const lw = o.lw || 1;
    ctx.save();
    ctx.lineCap = 'round';
    flights.forEach((f, i) => {
      const g = o.still ? 1.5 : (t - i * (o.stagger || STAGGER) - f.jitter) / f.dur;
      flightAt(ctx, proj, path, f, g, alpha, lw, false);
    });
    ctx.restore();
  };

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
      const R = s * 0.44;
      this.proj.scale(R).translate([s / 2, s * 0.46]).rotate([this.lon, -18]);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, s, s);
      const sh = ctx.createRadialGradient(s * 0.54, s * 0.95, 1, s * 0.54, s * 0.95, R * 0.95);
      sh.addColorStop(0, 'rgba(34, 50, 96, 0.16)');
      sh.addColorStop(1, 'rgba(34, 50, 96, 0)');
      ctx.save(); ctx.translate(0, s * 0.95); ctx.scale(1, 0.16); ctx.translate(0, -s * 0.95);
      ctx.fillStyle = sh; ctx.fillRect(0, 0, s, s * 2); ctx.restore();
      WC.paintGlobe(ctx, this.proj, { W: s, H: s, land: this.o.land, travel: this.o.travel, lw: s < 130 ? 0.8 : 1, grain: 0.7 });
      const t = still ? 0 : (now - this.t0) % WC.flightCycle(this.o.flights);
      WC.paintFlights(ctx, this.proj, this.o.flights, t, { still, lw: s < 130 ? 0.75 : 0.95 });
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
  };

  /* ------------------------------------------------------------ the large globe in the Flights view */

  /*
    o: { land, travel, routes: WC.routes(...), reduce: () => bool, font: () => css font string }
    A globe to turn by hand (drag, with inertia; wheel to come a little closer; arrow keys), turning
    slowly by itself when left alone. focus(journeyId) frames one journey and draws its flights out
    in order, its stops ringed and named; focus(null) returns to all the flights scattering.
  */
  WC.FlightsGlobe = class {
    constructor(canvas, o) {
      this.c = canvas;
      this.ctx = canvas.getContext('2d');
      this.o = o;
      this.rot = [-60, -22];
      this.zoom = 1;
      this.vel = [0, 0];
      this.t0 = performance.now();
      this.focusId = null; this.focusT0 = 0; this.turn = null;
      this.lastTouch = -1e9;
      this.running = false; this.raf = 0;
      this.proj = d3.geoOrthographic().clipAngle(90).precision(0.5);
      this.W = 0; this.H = 0;
      this.bind();
    }
    resize(w, h) {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      this.dpr = dpr; this.W = w; this.H = h;
      this.c.width = Math.round(w * dpr); this.c.height = Math.round(h * dpr);
      this.draw(performance.now());
    }
    bind() {
      const c = this.c;
      let drag = null;
      c.addEventListener('pointerdown', (e) => {
        drag = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId };
        c.setPointerCapture(e.pointerId);
        this.vel = [0, 0]; this.turn = null; this.lastTouch = performance.now();
        c.classList.add('is-dragging');
      });
      c.addEventListener('pointermove', (e) => {
        if (!drag || e.pointerId !== drag.id) return;
        const now = performance.now();
        const k = 0.28 / this.zoom;
        const dx = (e.clientX - drag.x) * k, dy = (e.clientY - drag.y) * k;
        this.rot = [this.rot[0] + dx, Math.max(-70, Math.min(70, this.rot[1] - dy))];
        const dt = Math.max(8, now - drag.t);
        this.vel = [dx / dt * 16, -dy / dt * 16];
        drag.x = e.clientX; drag.y = e.clientY; drag.t = now;
        this.lastTouch = now;
        this.kick();
      });
      const end = (e) => {
        if (!drag || (e && e.pointerId !== drag.id)) return;
        drag = null; c.classList.remove('is-dragging');
        this.lastTouch = performance.now();
        if (this.o.reduce()) this.vel = [0, 0];
        this.kick();
      };
      c.addEventListener('pointerup', end);
      c.addEventListener('pointercancel', end);
      c.addEventListener('wheel', (e) => {
        e.preventDefault();
        this.zoom = Math.max(0.85, Math.min(1.7, this.zoom * Math.exp(-e.deltaY * 0.0015)));
        this.lastTouch = performance.now();
        this.kick();
      }, { passive: false });
      c.addEventListener('keydown', (e) => {
        const step = 12;
        const m = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
        if (m) {
          e.preventDefault();
          this.turnTo([this.rot[0] + m[0], Math.max(-70, Math.min(70, this.rot[1] + m[1]))], 360);
        } else if (e.key === '+' || e.key === '=') { e.preventDefault(); this.zoom = Math.min(1.7, this.zoom * 1.15); this.kick(); }
        else if (e.key === '-' || e.key === '_') { e.preventDefault(); this.zoom = Math.max(0.85, this.zoom / 1.15); this.kick(); }
        else return;
        this.lastTouch = performance.now();
      });
    }
    turnTo(rot, dur = 1000) {
      let d = rot[0] - this.rot[0];
      d = ((d % 360) + 540) % 360 - 180;
      const from = this.rot.slice(), to = [this.rot[0] + d, rot[1]];
      if (this.o.reduce()) { this.rot = to; this.turn = null; this.kick(); return; }
      this.turn = { from, to, t0: performance.now(), dur };
      this.vel = [0, 0];
      this.kick();
    }
    focus(id) {
      if (id === this.focusId) return;
      this.focusId = id;
      this.focusT0 = performance.now();
      const j = id && this.o.routes.journeys.get(id);
      if (j) {
        const pts = [];
        for (const x of j.seq) pts.push(x.f.from, x.f.to);
        if (pts.length) {
          const c = d3.geoCentroid({ type: 'MultiPoint', coordinates: pts });
          let spread = 0;
          for (const p of pts) spread = Math.max(spread, d3.geoDistance(p, c));
          this.turnTo([-c[0], Math.max(-45, Math.min(45, -c[1] * 0.85))], 1100);
          this.fitZoom = spread > 1.15 ? 0.9 : spread > 0.6 ? 1 : 1.25;
        }
      } else {
        this.fitZoom = null;
      }
      this.kick();
    }
    kick() { if (!this.running) this.draw(performance.now()); }
    draw(now) {
      const { ctx, W, H, dpr } = this;
      if (!W) return;
      const still = this.o.reduce();
      if (this.turn) {
        const x = Math.min(1, (now - this.turn.t0) / this.turn.dur);
        const e = easeInOut(x);
        this.rot = [this.turn.from[0] + (this.turn.to[0] - this.turn.from[0]) * e, this.turn.from[1] + (this.turn.to[1] - this.turn.from[1]) * e];
        if (x >= 1) this.turn = null;
      }
      const zTarget = this.fitZoom || 1;
      const z = this.zoom * (this.zEase == null ? 1 : this.zEase);
      this.zEase = (this.zEase == null ? 1 : this.zEase) + (zTarget - (this.zEase == null ? 1 : this.zEase)) * 0.08;
      const R = Math.min(W, H) * 0.42 * z;
      this.proj.scale(R).translate([W / 2, H / 2]).rotate([this.rot[0], this.rot[1]]);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      // its shadow on the sheet
      const sy = H / 2 + R * 1.06;
      const sh = ctx.createRadialGradient(W / 2 + R * 0.08, sy, 1, W / 2 + R * 0.08, sy, R * 0.95);
      sh.addColorStop(0, 'rgba(34, 50, 96, 0.18)');
      sh.addColorStop(1, 'rgba(34, 50, 96, 0)');
      ctx.save(); ctx.translate(0, sy); ctx.scale(1, 0.12); ctx.translate(0, -sy);
      ctx.fillStyle = sh; ctx.fillRect(0, sy - R * 2, W, R * 4); ctx.restore();

      const focusJ = this.focusId ? this.o.routes.journeys.get(this.focusId) : null;
      WC.paintGlobe(ctx, this.proj, { W, H, land: this.o.land, travel: this.o.travel, lw: 1.25, grain: 1, dim: focusJ ? 1 : 0 });
      const path = d3.geoPath(this.proj, ctx);
      ctx.lineCap = 'round';
      if (!focusJ) {
        const all = this.o.routes.all;
        const t = still ? 0 : (now - this.t0) % WC.flightCycle(all);
        WC.paintFlights(ctx, this.proj, all, t, { still, lw: 1.35 });
      } else {
        // everything else steps back to a faint trace
        for (const f of this.o.routes.all) {
          ctx.beginPath(); path({ type: 'LineString', coordinates: d3.range(0, 1.0001, 1 / 24).map(f.interp) });
          ctx.strokeStyle = INK(0.1); ctx.lineWidth = 0.6; ctx.stroke();
        }
        const el = still ? 1e9 : now - this.focusT0 - 250;
        // the journey's legs draw out one after another, in the order travelled: flights as
        // persimmon arcs, ground legs as a faint dotted indigo line
        let tc = 0;
        const times = focusJ.seq.map((x) => {
          const d = x.ground ? 420 : x.f.dur * 0.62;
          const st = tc;
          tc += x.ground ? d : d * 0.74;
          return { st, d };
        });
        focusJ.seq.forEach((x, i) => {
          const { st, d } = times[i];
          const g = (el - st) / d;
          if (g <= 0) return;
          if (x.ground) {
            const upto = Math.min(1, g);
            ctx.setLineDash([1.2, 3.6]);
            ctx.beginPath(); path({ type: 'LineString', coordinates: d3.range(0, upto + 0.0001, upto / 10).map(x.f.interp) });
            ctx.strokeStyle = INK(0.62); ctx.lineWidth = 1.2; ctx.stroke();
            ctx.setLineDash([]);
          } else flightAt(ctx, this.proj, path, x.f, Math.min(g, 1), 1, 1.6, true);
        });
        // the places pop up as the legs reach them
        const font = this.o.font ? this.o.font() : '500 13px sans-serif';
        ctx.font = font;
        ctx.textBaseline = 'middle';
        const placed = [];
        const free = (bx) => {
          if (bx[0] < 6 || bx[2] > W - 6 || bx[1] < 6 || bx[3] > H - 6) return false;
          for (const q of placed) if (bx[0] < q[2] && bx[2] > q[0] && bx[1] < q[3] && bx[3] > q[1]) return false;
          return true;
        };
        const pops = focusJ.stops.map((s) => {
          const tm = times[s.leg] || { st: 0, d: 0 };
          const at = s.end ? tm.st + tm.d : tm.st;
          const e = Math.max(0, Math.min(1, (el - at + 120) / 420));
          if (e <= 0 || !visible(this.proj, s.p)) return null;
          const xy = this.proj(s.p);
          return xy ? { s, xy, pop: easeOut(e) } : null;
        }).filter(Boolean);
        for (const { xy } of pops) placed.push([xy[0] - 5, xy[1] - 5, xy[0] + 5, xy[1] + 5]);
        for (const { s, xy, pop } of pops) {
          ctx.beginPath(); ctx.arc(xy[0], xy[1], 2.5 + 4 * pop, 0, Math.PI * 2);
          ctx.strokeStyle = INK(0.85 * pop); ctx.lineWidth = 1.1; ctx.stroke();
          ctx.beginPath(); ctx.arc(xy[0], xy[1], 2.1, 0, Math.PI * 2);
          ctx.fillStyle = PERS_DEEP(pop); ctx.fill();
          const lab = txt(s.label);
          if (!lab) continue;
          const tw = ctx.measureText(lab).width;
          const cands = [[xy[0] + 11, xy[1]], [xy[0] - 11 - tw, xy[1]], [xy[0] - tw / 2, xy[1] - 15], [xy[0] - tw / 2, xy[1] + 15]];
          const spot = cands.find(([lx, ly]) => free([lx - 2, ly - 8, lx + tw + 2, ly + 8]));
          if (!spot) continue;
          const [lx, ly] = spot;
          placed.push([lx - 2, ly - 8, lx + tw + 2, ly + 8]);
          ctx.globalAlpha = pop;
          ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(243, 245, 246, 0.92)'; ctx.lineJoin = 'round';
          ctx.strokeText(lab, lx, ly + (1 - pop) * 4);
          ctx.fillStyle = INK(1); ctx.fillText(lab, lx, ly + (1 - pop) * 4);
          ctx.globalAlpha = 1;
        }
      }
    }
    loop(now) {
      if (!this.running) return;
      const dt = Math.min(64, now - (this.last || now));
      this.last = now;
      if (!this.turn) {
        if (Math.abs(this.vel[0]) + Math.abs(this.vel[1]) > 0.01) {
          // inertia after a throw
          this.rot = [this.rot[0] + this.vel[0] * (dt / 16), Math.max(-70, Math.min(70, this.rot[1] + this.vel[1] * (dt / 16)))];
          const k = Math.pow(0.94, dt / 16);
          this.vel = [this.vel[0] * k, this.vel[1] * k];
        } else if (!this.focusId && now - this.lastTouch > 2500) {
          this.rot = [this.rot[0] + dt * 0.006, this.rot[1]];
        }
      }
      this.draw(now);
      this.raf = requestAnimationFrame((n) => this.loop(n));
    }
    start() {
      if (this.running) return;
      if (this.o.reduce()) { this.draw(performance.now()); this.running = false; return; }
      this.running = true;
      this.last = 0;
      this.raf = requestAnimationFrame((n) => this.loop(n));
    }
    stop() { this.running = false; cancelAnimationFrame(this.raf); }
  };
})();

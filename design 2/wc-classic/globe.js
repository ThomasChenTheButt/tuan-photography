/* tuan photography 陳亮元 · design 2 · "Field watercolour": the painted globe of flights.
   A small globe, painted like the map (a cerulean wash pooling at its rim, land left as paper,
   the countries travelled glazed in rose, a fine sepia pen line), turning slowly while the
   flights he has flown scatter across it: thin pen arcs with a bright head and a fading tail,
   one after another. On the first visit of a session it opens large in the middle of the page
   and unrolls into the flat map. Decoration and record only: it does not navigate. */
(() => {
  'use strict';
  const WC = (window.WC = window.WC || {});

  const SEPIA = (a) => `rgba(88, 62, 42, ${a})`;
  const HEAD = 'rgb(206, 92, 108)';
  const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const easeOut = (x) => 1 - Math.pow(1 - x, 3);
  const graticule = d3.geoGraticule().step([15, 15])();

  // a granulated cerulean tile, multiplied over the globe's sea
  let granCanvas = null;
  function granTile() {
    if (granCanvas) return granCanvas;
    const { NH, NL } = WC.noise();
    // the whole noise field, which tiles seamlessly, so no square ever shows on the globe
    const n = 512;
    const c = document.createElement('canvas');
    c.width = c.height = n;
    const g = c.getContext('2d');
    const id = g.createImageData(n, n);
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const v = NH[(y << 9) | x] * 0.75 + NL[(y << 9) | x] * 0.25;
        const i = (y * n + x) * 4;
        id.data[i] = 70; id.data[i + 1] = 130; id.data[i + 2] = 170;
        id.data[i + 3] = Math.max(0, (v - 0.42)) * 120;
      }
    }
    g.putImageData(id, 0, 0);
    granCanvas = c;
    return c;
  }

  // the flights: routes [{ from: [lng, lat], to: [lng, lat], mode }], each a great circle with its own pace
  WC.flights = (routes) => {
    const r = (() => { let s = 19; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
    return routes.map((rt) => {
      const len = d3.geoDistance(rt.from, rt.to);
      return { ...rt, interp: d3.geoInterpolate(rt.from, rt.to), len, dur: 1100 + len * 520, jitter: r() * 140 };
    });
  };
  const STAGGER = 230;
  const TAIL = 0.42;
  WC.flightCycle = (flights) => Math.max(...flights.map((f, i) => i * STAGGER + f.jitter + f.dur * (1 + TAIL))) + 2600;

  // paint the globe (or the globe on its way to becoming the flat map: round runs 1 to 0)
  WC.paintGlobe = (ctx, proj, o) => {
    const path = d3.geoPath(proj, ctx);
    const round = o.round == null ? 1 : o.round;
    const lw = o.lw || 1;
    ctx.save();
    // the sea: a wash, pale in the middle and pooled darker toward the rim where it dried
    ctx.beginPath(); path({ type: 'Sphere' });
    if (round > 0) {
      const [cx, cy] = proj.translate();
      const R = proj.scale();
      const grad = ctx.createRadialGradient(cx - R * 0.28, cy - R * 0.32, R * 0.05, cx, cy, R * 1.02);
      grad.addColorStop(0, 'rgb(232, 242, 246)');
      grad.addColorStop(0.62, 'rgb(208, 230, 240)');
      grad.addColorStop(0.92, 'rgb(170, 208, 228)');
      grad.addColorStop(1, 'rgb(140, 188, 216)');
      ctx.globalAlpha = round;
      ctx.fillStyle = grad; ctx.fill();
    }
    if (round < 1) {
      ctx.globalAlpha = 1 - round;
      ctx.fillStyle = 'rgb(214, 233, 242)'; ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (o.land) {
      // land: paper under a thin sap-green wash, then the rose glaze; each wash lies a little off the pen line
      ctx.save();
      ctx.translate(1.1 * lw, 0.8 * lw);
      ctx.beginPath(); path(o.land);
      ctx.fillStyle = 'rgb(247, 246, 238)'; ctx.fill();
      ctx.fillStyle = 'rgba(150, 174, 116, 0.22)'; ctx.fill();
      ctx.strokeStyle = 'rgba(132, 160, 104, 0.32)'; ctx.lineWidth = 1.4 * lw; ctx.stroke();
      ctx.restore();
      if (o.travel) {
        ctx.save();
        ctx.translate(-0.7 * lw, 1 * lw);
        ctx.beginPath();
        for (const f of o.travel) path(f);
        ctx.fillStyle = 'rgba(224, 132, 148, 0.4)'; ctx.fill();
        ctx.strokeStyle = 'rgba(204, 102, 122, 0.35)'; ctx.lineWidth = 1.2 * lw; ctx.stroke();
        ctx.restore();
      }
    }
    // granulation over everything the wash touched
    ctx.save();
    ctx.beginPath(); path({ type: 'Sphere' });
    ctx.clip();
    ctx.globalCompositeOperation = 'multiply';
    const pat = ctx.createPattern(granTile(), 'repeat');
    pat.setTransform(new DOMMatrix().scaleSelf(0.5 * (o.grain || 1), 0.5 * (o.grain || 1)));
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, o.W, o.H);
    ctx.restore();
    // a faint pencil graticule
    ctx.beginPath(); path(graticule);
    ctx.strokeStyle = SEPIA(0.13 * (o.grat == null ? 1 : o.grat)); ctx.lineWidth = 0.5 * lw; ctx.stroke();
    if (o.land) {
      ctx.beginPath(); path(o.land);
      ctx.strokeStyle = SEPIA(0.78); ctx.lineWidth = 0.6 * lw; ctx.lineJoin = 'round'; ctx.stroke();
    }
    // the rim, dried dark where the wash stopped, and the pen line round it
    if (round > 0) {
      ctx.beginPath(); path({ type: 'Sphere' });
      ctx.globalAlpha = round;
      ctx.strokeStyle = 'rgba(86, 146, 186, 0.32)'; ctx.lineWidth = 3.2 * lw; ctx.stroke();
      ctx.strokeStyle = SEPIA(0.75); ctx.lineWidth = 0.8 * lw; ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  };

  // the flights at time t (ms into the cycle); alpha fades them all
  WC.paintFlights = (ctx, proj, flights, t, o = {}) => {
    const path = d3.geoPath(proj, ctx);
    const alpha = o.alpha == null ? 1 : o.alpha;
    const lw = o.lw || 1;
    const centre = o.ortho && proj.invert ? proj.invert(proj.translate()) : null;
    ctx.save();
    ctx.lineCap = 'round';
    flights.forEach((f, i) => {
      const g = o.still ? 1.5 : (t - i * (o.stagger || STAGGER) - f.jitter) / f.dur;
      if (g <= 0) return;
      // the route flown stays as a faint trace once the flight has passed
      if (g >= 1) {
        ctx.beginPath(); path({ type: 'LineString', coordinates: d3.range(0, 1.0001, 1 / 24).map(f.interp) });
        ctx.strokeStyle = SEPIA(0.2 * alpha * Math.min(1, (g - 1) * 3)); ctx.lineWidth = 0.55 * lw; ctx.stroke();
      }
      if (o.still) return;
      const head = Math.min(1, easeOut(Math.min(1, g)));
      const tail = Math.max(0, g - TAIL) / 1;
      const tailE = Math.min(head, easeOut(Math.min(1, tail)));
      if (head - tailE < 0.002) return;
      const n = 18;
      for (let k = 0; k < n; k++) {
        const a0 = tailE + ((head - tailE) * k) / n, a1 = tailE + ((head - tailE) * (k + 1)) / n;
        ctx.beginPath(); path({ type: 'LineString', coordinates: [f.interp(a0), f.interp((a0 + a1) / 2), f.interp(a1)] });
        ctx.strokeStyle = SEPIA(((k + 1) / n) * 0.92 * alpha);
        ctx.lineWidth = (0.5 + (0.6 * (k + 1)) / n) * lw;
        ctx.stroke();
      }
      if (g < 1.05) {
        const p = f.interp(head);
        const vis = !centre || !o.ortho || d3.geoDistance(p, centre) < Math.PI / 2 - 0.02;
        const xy = proj(p);
        if (vis && xy) {
          ctx.beginPath(); ctx.arc(xy[0], xy[1], 2.6 * lw, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(251, 250, 246, ${0.85 * alpha})`; ctx.fill();
          ctx.beginPath(); ctx.arc(xy[0], xy[1], 1.6 * lw, 0, Math.PI * 2);
          ctx.globalAlpha = alpha; ctx.fillStyle = HEAD; ctx.fill(); ctx.globalAlpha = 1;
        }
      }
    });
    ctx.restore();
  };

  /* ------------------------------------------------------------ the small globe in the corner */

  WC.Globe = class {
    constructor(canvas, o) {
      this.c = canvas;
      this.ctx = canvas.getContext('2d');
      this.o = o; // { land, travel, flights, reduce: () => bool }
      this.lon = -100; // the meridian facing us
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
      // a soft cast shadow on the paper, below and a little to the right
      const sh = ctx.createRadialGradient(s * 0.54, s * 0.95, 1, s * 0.54, s * 0.95, R * 0.95);
      sh.addColorStop(0, 'rgba(88, 62, 42, 0.16)');
      sh.addColorStop(1, 'rgba(88, 62, 42, 0)');
      ctx.save(); ctx.translate(0, s * 0.95); ctx.scale(1, 0.16); ctx.translate(0, -s * 0.95);
      ctx.fillStyle = sh; ctx.fillRect(0, 0, s, s * 2); ctx.restore();
      WC.paintGlobe(ctx, this.proj, { W: s, H: s, land: this.o.land, travel: this.o.travel, lw: s < 130 ? 0.8 : 1, grain: 0.7 });
      const t = still ? 0 : (now - this.t0) % WC.flightCycle(this.o.flights);
      WC.paintFlights(ctx, this.proj, this.o.flights, t, { still, ortho: true, lw: s < 130 ? 0.75 : 0.95 });
    }
    loop(now) {
      if (!this.running) return;
      const dt = Math.min(64, now - (this.last || now));
      this.last = now;
      this.lon += dt * 0.006; // a slow turn
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

  /* ------------------------------------------------------------ the Flights view: the globe, large and in hand */

  /*
    o: { land, travel, flights (every route, for the idle scatter), reduce(), font(), onFrame? }
    The globe sits in its canvas at a centre and radius the page reads back (for the expanding move).
    focus({ flights, points: [{ ll:[lng,lat], label }] }) turns it to frame one journey and draws
    that journey out; focus(null) lets every flight scatter again.
  */
  const expOut = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
  const vec = ([l, p]) => { const a = (l * Math.PI) / 180, b = (p * Math.PI) / 180; return [Math.cos(b) * Math.cos(a), Math.cos(b) * Math.sin(a), Math.sin(b)]; };
  WC.BigGlobe = class {
    constructor(canvas, o) {
      this.c = canvas;
      this.ctx = canvas.getContext('2d');
      this.o = o;
      this.rot = [-100, -18];
      this.zoom = 1;
      this.vel = [0, 0];
      this.drag = null;
      this.t0 = performance.now();
      this.raf = 0;
      this.running = false;
      this.focusing = null;  // { flights, points, t0 }
      this.tw = null;        // a turn in progress
      this.W = this.H = 0;
      this.proj = d3.geoOrthographic().clipAngle(90).precision(0.5);
      this.bind();
    }
    // centre and radius of the globe in the canvas (CSS px), at zoom 1
    frame() {
      const { W, H } = this;
      const R = Math.max(40, Math.min(W * 0.4, H * 0.4));
      return { cx: W / 2, cy: H * 0.5, R };
    }
    resize() {
      const r = this.c.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      this.dpr = dpr;
      this.W = Math.max(1, r.width); this.H = Math.max(1, r.height);
      this.c.width = Math.round(this.W * dpr); this.c.height = Math.round(this.H * dpr);
      this.draw(performance.now());
    }
    bind() {
      const c = this.c;
      c.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        c.setPointerCapture(e.pointerId);
        this.drag = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId };
        this.vel = [0, 0];
        this.tw = null;
        c.classList.add('is-turning');
      });
      c.addEventListener('pointermove', (e) => {
        const d = this.drag;
        if (!d || d.id !== e.pointerId) return;
        const now = performance.now();
        const k = 0.32 / this.zoom;
        const dx = (e.clientX - d.x) * k, dy = (e.clientY - d.y) * k;
        this.rot = [this.rot[0] + dx, Math.max(-75, Math.min(75, this.rot[1] - dy))];
        const dt = Math.max(8, now - d.t);
        this.vel = [(dx / dt) * 16, (-dy / dt) * 16];
        d.x = e.clientX; d.y = e.clientY; d.t = now;
      });
      const up = (e) => {
        if (!this.drag || this.drag.id !== e.pointerId) return;
        if (performance.now() - this.drag.t > 90) this.vel = [0, 0];
        this.drag = null;
        c.classList.remove('is-turning');
      };
      c.addEventListener('pointerup', up);
      c.addEventListener('pointercancel', up);
      c.addEventListener('wheel', (e) => {
        e.preventDefault();
        const d = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
        this.zoom = Math.max(0.85, Math.min(1.6, this.zoom * Math.exp(-d * 0.0015)));
        this.tw = this.tw && { ...this.tw, z1: this.zoom, z0: this.zoom };
      }, { passive: false });
    }
    // turn to look at a set of places, sized to hold them
    look(lls, dur = 900) {
      if (!lls.length) return;
      const v = [0, 0, 0];
      for (const ll of lls) { const q = vec(ll); v[0] += q[0]; v[1] += q[1]; v[2] += q[2]; }
      const n = Math.hypot(...v) || 1;
      const lon = (Math.atan2(v[1], v[0]) * 180) / Math.PI, lat = (Math.asin(v[2] / n) * 180) / Math.PI;
      const centre = [lon, lat];
      let spread = 0;
      for (const ll of lls) spread = Math.max(spread, d3.geoDistance(ll, centre));
      const z = Math.max(1, Math.min(1.55, 0.86 / Math.sin(Math.max(0.42, Math.min(Math.PI / 2, spread + 0.12)))));
      const r0 = this.rot.slice();
      let dl = ((-lon - r0[0]) % 360 + 540) % 360 - 180;
      const target = [r0[0] + dl, Math.max(-60, Math.min(60, -lat))];
      this.vel = [0, 0];
      if (this.o.reduce() || dur === 0) { this.rot = target; this.zoom = z; this.tw = null; return; }
      this.tw = { r0, r1: target, z0: this.zoom, z1: z, t0: performance.now(), dur };
    }
    focus(f) {
      if (!f) {
        this.focusing = null;
        this.t0 = performance.now();
        if (!this.o.reduce()) this.tw = { r0: this.rot.slice(), r1: this.rot.slice(), z0: this.zoom, z1: 1, t0: performance.now(), dur: 900 };
        else this.zoom = 1;
        return;
      }
      this.focusing = { ...f, t0: performance.now() };
      const lls = [];
      for (const fl of f.flights) for (let a = 0; a <= 1.0001; a += 0.25) lls.push(fl.interp(a));
      for (const p of f.points) lls.push(p.ll);
      this.look(lls);
    }
    draw(now) {
      const { ctx, W, H, dpr } = this;
      if (!W) return;
      const still = this.o.reduce();
      const { cx, cy, R } = this.frame();
      const RR = R * this.zoom;
      this.proj.scale(RR).translate([cx, cy]).rotate(this.rot);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      // a soft cast shadow on the paper
      const sy = cy + RR * 1.04;
      const sh = ctx.createRadialGradient(cx + RR * 0.08, sy, 1, cx + RR * 0.08, sy, RR * 0.9);
      sh.addColorStop(0, 'rgba(88, 62, 42, 0.14)');
      sh.addColorStop(1, 'rgba(88, 62, 42, 0)');
      ctx.save(); ctx.translate(0, sy); ctx.scale(1, 0.14); ctx.translate(0, -sy);
      ctx.fillStyle = sh; ctx.fillRect(0, sy - RR * 2, W, RR * 4); ctx.restore();
      WC.paintGlobe(ctx, this.proj, { W, H, land: this.o.land, travel: this.o.travel, lw: 1.15, grain: 1 });
      const f = this.focusing;
      if (!f) {
        const t = still ? 0 : (now - this.t0) % WC.flightCycle(this.o.flights);
        WC.paintFlights(ctx, this.proj, this.o.flights, t, { still, ortho: true, lw: 1.25 });
        return;
      }
      // everything else stays as a faint trace; this journey draws out, leg by leg, in order
      WC.paintFlights(ctx, this.proj, this.o.flights, 0, { still: true, ortho: true, lw: 1, alpha: 0.45 });
      const el = still ? 1e9 : now - f.t0;
      const path = d3.geoPath(this.proj, ctx);
      const centre = this.proj.invert([cx, cy]);
      ctx.save();
      ctx.lineCap = 'round';
      const gap = Math.min(380, 2600 / Math.max(1, f.flights.length));
      f.flights.forEach((fl, i) => {
        const g = (el - 250 - i * gap) / (fl.dur * 0.8);
        if (g <= 0) return;
        const ground = fl.mode && fl.mode !== 'flight';
        if (ground) {
          ctx.setLineDash([1.2, 4]);
          ctx.beginPath(); path({ type: 'LineString', coordinates: d3.range(0, 1.0001, 1 / 12).map(fl.interp) });
          ctx.strokeStyle = SEPIA(0.5 * Math.min(1, g * 2)); ctx.lineWidth = 1.2; ctx.stroke();
          ctx.setLineDash([]);
          return;
        }
        const head = Math.min(1, easeOut(Math.min(1, g)));
        // once it has landed, the route stays as a firm pen line
        ctx.beginPath(); path({ type: 'LineString', coordinates: d3.range(0, head + 0.0001, 1 / 32).concat([head]).map(fl.interp) });
        ctx.strokeStyle = SEPIA(0.85); ctx.lineWidth = 1.5; ctx.stroke();
        if (g < 1.05) {
          const p = fl.interp(head);
          const xy = this.proj(p);
          if (xy && d3.geoDistance(p, centre) < Math.PI / 2 - 0.02) {
            ctx.beginPath(); ctx.arc(xy[0], xy[1], 3.6, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(251, 250, 246, 0.9)'; ctx.fill();
            ctx.beginPath(); ctx.arc(xy[0], xy[1], 2.2, 0, Math.PI * 2);
            ctx.fillStyle = HEAD; ctx.fill();
          }
        }
      });
      // the places of the journey come up: a pen ring and the name
      ctx.font = this.o.font();
      try { ctx.letterSpacing = this.o.ls ? this.o.ls() : '0px'; } catch (e) { /* older engines */ }
      ctx.textBaseline = 'middle';
      const taken = [];
      f.points.forEach((p, i) => {
        const a = still ? 1 : expOut(Math.max(0, Math.min(1, (el - 500 - i * Math.min(220, 2000 / Math.max(1, f.points.length))) / 600)));
        if (a <= 0) return;
        if (d3.geoDistance(p.ll, centre) > Math.PI / 2 - 0.05) return;
        const xy = this.proj(p.ll);
        if (!xy) return;
        ctx.globalAlpha = a;
        ctx.beginPath(); ctx.arc(xy[0], xy[1], 4 + 5 * a, 0, Math.PI * 2);
        ctx.strokeStyle = SEPIA(0.9); ctx.lineWidth = 1.2; ctx.stroke();
        ctx.beginPath(); ctx.arc(xy[0], xy[1], 2, 0, Math.PI * 2);
        ctx.fillStyle = HEAD; ctx.fill();
        if (p.label) {
          // names that would sit on another wait; the ring still marks the place
          const w = ctx.measureText(p.label).width;
          let right = xy[0] < cx + RR * 0.55;
          let box = right ? [xy[0] + 12, xy[1] - 9, xy[0] + 16 + w, xy[1] + 8] : [xy[0] - 16 - w, xy[1] - 9, xy[0] - 12, xy[1] + 8];
          const clash = (bx) => taken.some((o) => bx[0] < o[2] && bx[2] > o[0] && bx[1] < o[3] && bx[3] > o[1]);
          if (clash(box)) {
            right = !right;
            box = right ? [xy[0] + 12, xy[1] - 9, xy[0] + 16 + w, xy[1] + 8] : [xy[0] - 16 - w, xy[1] - 9, xy[0] - 12, xy[1] + 8];
          }
          if (clash(box)) { ctx.globalAlpha = 1; return; }
          taken.push(box);
          ctx.textAlign = right ? 'left' : 'right';
          const tx = xy[0] + (right ? 14 : -14), ty = xy[1] - 1;
          ctx.lineJoin = 'round';
          ctx.strokeStyle = 'rgba(251, 250, 246, 0.92)'; ctx.lineWidth = 4; ctx.strokeText(p.label, tx, ty);
          ctx.fillStyle = 'rgb(58, 40, 28)'; ctx.fillText(p.label, tx, ty);
        }
        ctx.globalAlpha = 1;
      });
      ctx.restore();
    }
    loop(now) {
      if (!this.running) return;
      const dt = Math.min(64, now - (this.last || now));
      this.last = now;
      if (this.tw) {
        const x = Math.min(1, (now - this.tw.t0) / this.tw.dur);
        const e = expOut(x);
        this.rot = [this.tw.r0[0] + (this.tw.r1[0] - this.tw.r0[0]) * e, this.tw.r0[1] + (this.tw.r1[1] - this.tw.r0[1]) * e];
        this.zoom = this.tw.z0 + (this.tw.z1 - this.tw.z0) * e;
        if (x >= 1) this.tw = null;
      } else if (!this.drag) {
        if (Math.abs(this.vel[0]) + Math.abs(this.vel[1]) > 0.01) {
          // inertia after a throw
          this.rot = [this.rot[0] + this.vel[0] * (dt / 16), Math.max(-75, Math.min(75, this.rot[1] + this.vel[1] * (dt / 16)))];
          const k = Math.pow(0.94, dt / 16);
          this.vel = [this.vel[0] * k, this.vel[1] * k];
        } else if (!this.focusing && !this.o.reduce()) {
          this.rot = [this.rot[0] + dt * 0.006, this.rot[1]]; // the slow idle turn
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
    o: { canvas, land, travel, flights, LON0, target(): { scale, translate } of the flat map (d3 equirectangular),
         onUnroll(), onDone() }
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
        // the globe turns while the flights go out from it
        const fadeIn = Math.min(1, el / 350);
        const proj = d3.geoOrthographic().clipAngle(90).precision(0.5).scale(R * (0.94 + 0.06 * easeOut(fadeIn))).translate([W / 2, H / 2]).rotate([lon0 - spin, lat0]);
        ctx.globalAlpha = fadeIn;
        WC.paintGlobe(ctx, proj, { W, H, land: o.land, travel: o.travel, lw: 1.3, grain: 1 });
        WC.paintFlights(ctx, proj, o.flights, Math.max(0, el - 150), { ortho: true, lw: 1.5, alpha: fadeIn, stagger: 130 });
        ctx.globalAlpha = 1;
      } else {
        // then it unrolls: orthographic into the map's own equirectangular plate, onto the exact place it will lie
        if (!unrolled) { unrolled = true; if (o.onUnroll) o.onUnroll(); }
        const x = Math.min(1, (el - SPIN - SCATTER) / UNROLL);
        const t = easeInOut(x);
        const S = target.scale;
        mutate.k = R / S;
        const rot = [lon0 - (SPIN + SCATTER) * 0.007, lat0];
        // the shortest turn to the map's centre meridian
        let dl = ((-o.LON0 - rot[0]) % 360 + 540) % 360 - 180;
        const proj = mutate(t).scale(S)
          .translate([W / 2 + (target.translate[0] - W / 2) * t, H / 2 + (target.translate[1] - H / 2) * t])
          .rotate([rot[0] + dl * t, rot[1] * (1 - t)])
          .precision(0.5);
        if (t < 0.985) proj.clipAngle(90 + 89.9 * Math.min(1, t * 1.15)); else proj.clipAngle(null);
        // the sheet it unrolls into has its own top and bottom edges: the poles fold away past them
        const yN = target.translate[1] - (S * o.LAT_N * Math.PI) / 180, yS = target.translate[1] - (S * o.LAT_S * Math.PI) / 180;
        ctx.save();
        ctx.beginPath(); d3.geoPath(proj, ctx)({ type: 'Sphere' });
        ctx.clip();
        ctx.beginPath(); ctx.rect(0, yN * t - 40 * (1 - t), W, (yS - yN) * t + (H + 80) * (1 - t));
        ctx.clip();
        WC.paintGlobe(ctx, proj, { W, H, land: o.land, travel: o.travel, round: 1 - t, grat: 1 - t, lw: 1.3 - 0.4 * t, grain: 1 });
        WC.paintFlights(ctx, proj, o.flights, 1e9, { alpha: 1 - Math.min(1, x * 2.5), lw: 1.3, still: true });
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

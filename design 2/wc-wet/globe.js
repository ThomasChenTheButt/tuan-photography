/* tuan photography 陳亮元 · design 2 · "Wet in wet": the painted globe of flights.
   A small globe painted like the map (a sea that deepens from cerulean to ultramarine toward
   its rim, land in drifting sienna and sap green, the countries travelled glazed in rose), turning
   slowly while the flights scatter across it: thin arcs with a bright head and a fading tail.
   On the first visit of a session it opens large in the middle and unrolls into the flat map.
   Pressed, it grows into the Flights view: a large globe to turn by hand, beside his journeys. */
(() => {
  'use strict';
  const WC = (window.WC = window.WC || {});

  const INK = (a) => `rgba(40, 40, 64, ${a})`;
  const HEAD = 'rgb(196, 60, 108)';
  const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const easeOut = (x) => 1 - Math.pow(1 - x, 3);
  const graticule = d3.geoGraticule().step([15, 15])();

  // granulation and a few soft backruns, multiplied over the globe's washes
  let granCanvas = null;
  function granTile() {
    if (granCanvas) return granCanvas;
    const { NH, NL, NB } = WC.noise();
    const n = 256;
    const c = document.createElement('canvas');
    c.width = c.height = n;
    const g = c.getContext('2d');
    const id = g.createImageData(n, n);
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const v = NH[(y << 9) | x] * 0.75 + NL[((y >> 1) << 9) | (x >> 1)] * 0.25;
        const b = NB[((y * 2) & 511) * 512 + ((x * 2) & 511)];
        const rim = Math.exp(-Math.pow((b - 0.68) / 0.012, 2));
        const i = (y * n + x) * 4;
        id.data[i] = 54; id.data[i + 1] = 84; id.data[i + 2] = 160;
        id.data[i + 3] = Math.max(0, v - 0.42) * 120 + rim * 70;
      }
    }
    g.putImageData(id, 0, 0);
    granCanvas = c;
    return c;
  }

  // flights: [{from:[lng,lat], to:[lng,lat]}] -> drawable arcs
  WC.flights = (pairs, seed = 19) => {
    const r = (() => { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
    return pairs.map((p) => {
      const len = d3.geoDistance(p.from, p.to);
      return { ...p, interp: d3.geoInterpolate(p.from, p.to), len, dur: 1100 + len * 520, jitter: r() * 140 };
    });
  };
  const STAGGER = 230;
  const TAIL = 0.42;
  WC.flightCycle = (flights) => Math.max(0, ...flights.map((f, i) => i * STAGGER + f.jitter + f.dur * (1 + TAIL))) + 2600;

  // paint the globe (or the globe on its way to becoming the flat map: round runs 1 to 0)
  WC.paintGlobe = (ctx, proj, o) => {
    const path = d3.geoPath(proj, ctx);
    const round = o.round == null ? 1 : o.round;
    const lw = o.lw || 1;
    const dim = o.dim == null ? 1 : o.dim;
    ctx.save();
    // the sea: a wash pale toward the light, deepening to ultramarine where it pooled at the rim
    ctx.beginPath(); path({ type: 'Sphere' });
    if (round > 0) {
      const [cx, cy] = proj.translate();
      const R = proj.scale();
      const grad = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.34, R * 0.04, cx, cy, R * 1.02);
      grad.addColorStop(0, 'rgb(226, 240, 246)');
      grad.addColorStop(0.5, 'rgb(190, 222, 238)');
      grad.addColorStop(0.84, 'rgb(130, 166, 220)');
      grad.addColorStop(1, 'rgb(96, 122, 200)');
      ctx.globalAlpha = round;
      ctx.fillStyle = grad; ctx.fill();
    }
    if (round < 1) {
      ctx.globalAlpha = 1 - round;
      ctx.fillStyle = 'rgb(198, 222, 240)'; ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (o.land) {
      // land: a drifting sienna and sap-green wash, bled a little off the shore, then the rose glaze
      ctx.save();
      ctx.translate(1.2 * lw, 0.9 * lw);
      ctx.beginPath(); path(o.land);
      ctx.fillStyle = 'rgb(246, 242, 230)'; ctx.fill();
      ctx.fillStyle = 'rgba(170, 176, 112, 0.26)'; ctx.fill();
      ctx.strokeStyle = 'rgba(176, 132, 96, 0.22)'; ctx.lineWidth = 2.6 * lw; ctx.stroke();
      ctx.restore();
      if (o.travel) {
        ctx.save();
        ctx.translate(-0.8 * lw, 1 * lw);
        ctx.beginPath();
        for (const f of o.travel) path(f);
        ctx.fillStyle = `rgba(222, 104, 150, ${0.42 * dim})`; ctx.fill();
        ctx.strokeStyle = `rgba(200, 80, 128, ${0.32 * dim})`; ctx.lineWidth = 1.8 * lw; ctx.stroke();
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
    // a whisper of pencil graticule
    ctx.beginPath(); path(graticule);
    ctx.strokeStyle = `rgba(92, 88, 82, ${0.12 * (o.grat == null ? 1 : o.grat)})`; ctx.lineWidth = 0.5 * lw; ctx.stroke();
    // the shore: the darker edge where the sea wash dried, not a pen line
    if (o.land) {
      ctx.beginPath(); path(o.land);
      ctx.strokeStyle = 'rgba(52, 82, 150, 0.42)'; ctx.lineWidth = 0.8 * lw; ctx.lineJoin = 'round'; ctx.stroke();
    }
    // the rim, dried dark where the wash stopped
    if (round > 0) {
      ctx.beginPath(); path({ type: 'Sphere' });
      ctx.globalAlpha = round;
      ctx.strokeStyle = 'rgba(70, 92, 180, 0.4)'; ctx.lineWidth = 3 * lw; ctx.stroke();
      ctx.strokeStyle = 'rgba(40, 52, 120, 0.5)'; ctx.lineWidth = 0.8 * lw; ctx.stroke();
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
    const stagger = o.stagger || STAGGER;
    ctx.save();
    ctx.lineCap = 'round';
    flights.forEach((f, i) => {
      const g = o.still ? 1.5 : (t - (f.at != null ? f.at : i * stagger + f.jitter)) / f.dur;
      if (g <= 0) return;
      // a journey made over the ground: a faint dotted trace, no head
      if (f.ground) {
        const e = Math.min(1, g);
        ctx.setLineDash([1.2 * lw, 3.2 * lw]);
        ctx.beginPath(); path({ type: 'LineString', coordinates: d3.range(0, e + 0.0001, 1 / 16).map(f.interp) });
        ctx.strokeStyle = INK(0.5 * alpha); ctx.lineWidth = 0.9 * lw; ctx.stroke();
        ctx.setLineDash([]);
        return;
      }
      // the route flown stays as a faint trace once the flight has passed
      if (g >= 1) {
        ctx.beginPath(); path({ type: 'LineString', coordinates: d3.range(0, 1.0001, 1 / 24).map(f.interp) });
        ctx.strokeStyle = INK((o.keep || 0.2) * alpha * Math.min(1, (g - 1) * 3)); ctx.lineWidth = (o.keepW || 0.55) * lw; ctx.stroke();
      }
      if (o.still) return;
      const head = Math.min(1, easeOut(Math.min(1, g)));
      const tail = Math.max(0, g - TAIL);
      const tailE = Math.min(head, easeOut(Math.min(1, tail)));
      if (head - tailE < 0.002) return;
      const n = 18;
      for (let k = 0; k < n; k++) {
        const a0 = tailE + ((head - tailE) * k) / n, a1 = tailE + ((head - tailE) * (k + 1)) / n;
        ctx.beginPath(); path({ type: 'LineString', coordinates: [f.interp(a0), f.interp((a0 + a1) / 2), f.interp(a1)] });
        ctx.strokeStyle = INK(((k + 1) / n) * 0.92 * alpha);
        ctx.lineWidth = (0.5 + (0.7 * (k + 1)) / n) * lw;
        ctx.stroke();
      }
      if (g < 1.05) {
        const p = f.interp(head);
        const vis = !centre || !o.ortho || d3.geoDistance(p, centre) < Math.PI / 2 - 0.02;
        const xy = proj(p);
        if (vis && xy) {
          ctx.beginPath(); ctx.arc(xy[0], xy[1], 2.7 * lw, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(251, 250, 245, ${0.85 * alpha})`; ctx.fill();
          ctx.beginPath(); ctx.arc(xy[0], xy[1], 1.7 * lw, 0, Math.PI * 2);
          ctx.globalAlpha = alpha; ctx.fillStyle = HEAD; ctx.fill(); ctx.globalAlpha = 1;
        }
      }
    });
    ctx.restore();
  };

  // a soft cast shadow on the paper below a globe
  function castShadow(ctx, cx, cy, R) {
    const y = cy + R * 1.08;
    const sh = ctx.createRadialGradient(cx + R * 0.08, y, 1, cx + R * 0.08, y, R * 0.95);
    sh.addColorStop(0, 'rgba(40, 40, 64, 0.16)');
    sh.addColorStop(1, 'rgba(40, 40, 64, 0)');
    ctx.save(); ctx.translate(0, y); ctx.scale(1, 0.15); ctx.translate(0, -y);
    ctx.fillStyle = sh; ctx.fillRect(cx - R * 1.2, y - R, R * 2.4, R * 2); ctx.restore();
  }

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
      castShadow(ctx, s / 2, s * 0.46, R * 0.98);
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

  /* ------------------------------------------------------------ the large globe of the Flights view */

  /*
    o: { land, travel, all: flights (scattering when no journey is chosen), reduce(), label(text) font }
    set(journey|null): journey = { flights, pops: [{ ll:[lng,lat], name }], frame: [lng,lat] }
  */
  WC.BigGlobe = class {
    constructor(canvas, o) {
      this.c = canvas;
      this.ctx = canvas.getContext('2d');
      this.o = o;
      this.rot = [-100, -16];
      this.goal = null;
      this.k = 1;
      this.vel = [0, 0];
      this.drag = null;
      this.j = null;
      this.jt = 0;
      this.t0 = performance.now();
      this.running = false;
      this.proj = d3.geoOrthographic().clipAngle(90).precision(0.5);
      this.bind();
    }
    resize() {
      const r = this.c.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      this.dpr = dpr;
      this.W = Math.max(1, r.width); this.H = Math.max(1, r.height);
      this.c.width = Math.round(this.W * dpr); this.c.height = Math.round(this.H * dpr);
      this.draw(performance.now());
    }
    radius() { return Math.min(this.W, this.H) * 0.4 * this.k; }
    bind() {
      const c = this.c;
      c.addEventListener('pointerdown', (e) => {
        c.setPointerCapture(e.pointerId);
        this.drag = { x: e.clientX, y: e.clientY, t: performance.now() };
        this.vel = [0, 0];
        this.goal = null;
        c.classList.add('is-dragging');
      });
      c.addEventListener('pointermove', (e) => {
        if (!this.drag) return;
        const now = performance.now();
        const s = 70 / this.radius();
        const dx = (e.clientX - this.drag.x) * s, dy = (e.clientY - this.drag.y) * s;
        this.rot = [this.rot[0] + dx, Math.max(-70, Math.min(70, this.rot[1] - dy))];
        const dt = Math.max(8, now - this.drag.t);
        this.vel = [dx / dt, -dy / dt];
        this.drag = { x: e.clientX, y: e.clientY, t: now };
        this.kick();
      });
      const up = () => { this.drag = null; c.classList.remove('is-dragging'); this.kick(); };
      c.addEventListener('pointerup', up);
      c.addEventListener('pointercancel', up);
      c.addEventListener('wheel', (e) => {
        e.preventDefault();
        this.k = Math.max(0.85, Math.min(1.6, this.k * Math.exp(-e.deltaY * 0.0012)));
        this.kick();
      }, { passive: false });
      c.addEventListener('keydown', (e) => {
        const d = { ArrowLeft: [-12, 0], ArrowRight: [12, 0], ArrowUp: [0, 10], ArrowDown: [0, -10] }[e.key];
        if (d) { e.preventDefault(); this.goal = [this.rot[0] + d[0], Math.max(-70, Math.min(70, this.rot[1] + d[1]))]; this.kick(); }
        else if (e.key === '+' || e.key === '=') { e.preventDefault(); this.k = Math.min(1.6, this.k * 1.15); this.kick(); }
        else if (e.key === '-' || e.key === '_') { e.preventDefault(); this.k = Math.max(0.85, this.k / 1.15); this.kick(); }
      });
    }
    set(j) {
      if (j === this.j) return;
      this.j = j;
      this.jt = performance.now();
      if (j && j.frame) this.goal = [-j.frame[0], Math.max(-55, Math.min(55, -j.frame[1]))];
      this.kick();
    }
    kick() { if (!this.running) this.draw(performance.now()); }
    draw(now) {
      const { ctx, W, H, dpr } = this;
      if (!W) return;
      const still = this.o.reduce();
      const R = this.radius();
      const cx = W / 2, cy = H * 0.47;
      this.proj.scale(R).translate([cx, cy]).rotate(this.rot);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      castShadow(ctx, cx, cy, R);
      WC.paintGlobe(ctx, this.proj, { W, H, land: this.o.land, travel: this.o.travel, lw: 1.35, grain: 1.2, dim: this.j ? 0.55 : 1 });
      const j = this.j;
      if (!j) {
        const t = still ? 0 : (now - this.t0) % WC.flightCycle(this.o.all);
        WC.paintFlights(ctx, this.proj, this.o.all, t, { still, ortho: true, lw: 1.5, keep: 0.32, keepW: 0.7 });
        return;
      }
      // the other journeys stay as faint traces; this one draws out, leg after leg
      WC.paintFlights(ctx, this.proj, this.o.all, 0, { still: true, ortho: true, lw: 1.2, alpha: 0.5, keep: 0.16 });
      const t = still ? 1e9 : now - this.jt - 250;
      WC.paintFlights(ctx, this.proj, j.flights, t, { ortho: true, lw: 2, keep: 0.75, keepW: 0.9 });
      // the places pop up as their flight arrives
      const centre = this.proj.invert([cx, cy]);
      ctx.save();
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.font = this.o.font();
      // names never sit on one another: a place whose name would collide keeps only its ring
      const boxes = [];
      for (const p of j.pops) {
        const g = still ? 1 : Math.max(0, Math.min(1, (t - p.at) / 420));
        if (g <= 0) continue;
        if (d3.geoDistance(p.ll, centre) > Math.PI / 2 - 0.03) continue;
        const xy = this.proj(p.ll);
        if (!xy) continue;
        const e = easeOut(g);
        ctx.globalAlpha = e;
        ctx.beginPath(); ctx.arc(xy[0], xy[1], 4 + 6 * e, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(150, 36, 84, 0.9)'; ctx.lineWidth = 1.4; ctx.stroke();
        ctx.beginPath(); ctx.arc(xy[0], xy[1], 2.2, 0, Math.PI * 2);
        ctx.fillStyle = HEAD; ctx.fill();
        if (p.w == null || p.wl !== ctx.font) { p.w = ctx.measureText(p.name).width; p.wl = ctx.font; }
        // the name sits to the right of its ring, or to the left near the globe's right edge
        const left = xy[0] + 15 + p.w > W - 8;
        const tx = left ? xy[0] - 15 - p.w : xy[0] + 15, ty = xy[1] - 1 - 4 * (1 - e);
        const box = [tx - 3, ty - 11, tx + p.w + 3, ty + 11];
        if (boxes.some((b) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1])) continue;
        boxes.push(box);
        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(251, 250, 245, 0.92)'; ctx.lineWidth = 4;
        ctx.strokeText(p.name, tx, ty);
        ctx.fillStyle = 'rgb(36, 32, 44)';
        ctx.fillText(p.name, tx, ty);
      }
      ctx.restore();
    }
    loop(now) {
      if (!this.running) return;
      const dt = Math.min(64, now - (this.last || now));
      this.last = now;
      if (!this.drag) {
        if (this.goal) {
          // turn toward the journey, the shortest way round
          const dl = ((this.goal[0] - this.rot[0]) % 360 + 540) % 360 - 180;
          const dp = this.goal[1] - this.rot[1];
          const f = 1 - Math.exp(-dt / 260);
          this.rot = [this.rot[0] + dl * f, this.rot[1] + dp * f];
          if (Math.abs(dl) < 0.05 && Math.abs(dp) < 0.05) this.goal = null;
        } else if (Math.abs(this.vel[0]) + Math.abs(this.vel[1]) > 0.002) {
          // let go: it keeps turning, slowing
          this.rot = [this.rot[0] + this.vel[0] * dt, Math.max(-70, Math.min(70, this.rot[1] + this.vel[1] * dt))];
          const f = Math.exp(-dt / 420);
          this.vel = [this.vel[0] * f, this.vel[1] * f];
        } else if (!this.j && !this.o.reduce()) {
          this.rot = [this.rot[0] + dt * 0.005, this.rot[1]];
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
    o: { canvas, land, travel, flights, LON0, LAT_N, LAT_S, target(): { scale, translate } of the flat map
         (d3 equirectangular), onUnroll(), onDone() }
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
        castShadow(ctx, W / 2, H / 2, R);
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
        const dl = ((-o.LON0 - rot[0]) % 360 + 540) % 360 - 180;
        const proj = mutate(t).scale(S)
          .translate([W / 2 + (target.translate[0] - W / 2) * t, H / 2 + (target.translate[1] - H / 2) * t])
          .rotate([rot[0] + dl * t, rot[1] * (1 - t)])
          .precision(0.5);
        if (t < 0.985) proj.clipAngle(90 + 89.9 * Math.min(1, t * 1.15)); else proj.clipAngle(null);
        ctx.save();
        ctx.beginPath(); d3.geoPath(proj, ctx)({ type: 'Sphere' });
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

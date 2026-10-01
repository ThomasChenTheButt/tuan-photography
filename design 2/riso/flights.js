/* tuan photography 陳亮元 · design 2 · "Two-ink riso print": the flights.
   A small two-ink globe that only keeps a record: thin great-circle arcs, printed in coral,
   launch one after another from where he flies out and scatter like confetti trails, a bright
   head and a fading tail, flecks of both inks falling away behind. Nothing on it is a control
   except "play them again". The opening is the same globe, large, unrolling into the flat map. */
(() => {
  'use strict';

  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const inOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

  // one dot screen per canvas, in device pixels, for land printed by drum one
  function screenPattern(ctx, dpr, pitch, r, colour) {
    const c = document.createElement('canvas');
    const n = Math.max(2, Math.round(pitch * dpr));
    c.width = n; c.height = n;
    const g = c.getContext('2d');
    g.fillStyle = colour;
    g.beginPath(); g.arc(n / 2, n / 2, r * dpr, 0, TAU); g.fill();
    const pat = ctx.createPattern(c, 'repeat');
    // patterns are laid in device pixels; the context is scaled by dpr, so shrink them back
    pat.setTransform(new DOMMatrix().scaleSelf(1 / dpr, 1 / dpr));
    return pat;
  }

  // the earth in two inks: land in a teal screen, his countries a coral flat slightly off register
  function printEarth(ctx, path, o) {
    const { land, been, ink, mis, alpha, pat, sphere, grid } = o;
    ctx.save();
    ctx.globalAlpha = alpha;
    if (sphere) {
      ctx.beginPath(); path({ type: 'Sphere' });
      ctx.fillStyle = ink.paper; ctx.fill();
    }
    if (grid) {
      ctx.beginPath(); path(grid);
      ctx.lineWidth = 0.5; ctx.strokeStyle = ink.tealA(0.22); ctx.stroke();
    }
    ctx.globalCompositeOperation = 'multiply';
    ctx.beginPath(); path(land);
    ctx.fillStyle = pat; ctx.fill();
    ctx.fillStyle = ink.tealA(0.1); ctx.fill();
    ctx.save();
    ctx.translate(mis[0], mis[1]);
    ctx.beginPath(); path(been);
    ctx.fillStyle = ink.coralA(0.86); ctx.fill();
    ctx.restore();
    ctx.beginPath(); path(land);
    ctx.lineWidth = o.coast || 0.7; ctx.strokeStyle = ink.tealA(0.9); ctx.stroke();
    if (sphere) {
      ctx.beginPath(); path({ type: 'Sphere' });
      ctx.lineWidth = o.rim || 1; ctx.strokeStyle = ink.tealA(0.85); ctx.stroke();
    }
    ctx.restore();
  }

  /* the scatter: arcs that launch in turn, each with a bright head, a fading tail and confetti */
  function Scatter(from, tos, opt) {
    const arcs = tos.map((to) => {
      const dist = d3.geoDistance(from, to);
      return { interp: d3.geoInterpolate(from, to), dist };
    });
    let t0 = 0;
    let parts = [];
    let lastEmit = 0;
    const stagger = opt.stagger, dur = opt.dur, tail = 0.42;
    const lengthOf = (a) => dur * (0.55 + 0.45 * a.dist / Math.PI);
    const span = arcs.reduce((m, a, i) => Math.max(m, i * stagger + lengthOf(a) * (1 + tail)), 0);
    let seed = 11;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

    return {
      span,
      restart(now) { t0 = now; parts = []; },
      done(now) { return now - t0 > span + 1600; },
      draw(ctx, path, proj, now, o) {
        const el = now - t0;
        const sf = o.sf || 1;
        const visible = (pt) => !o.centre || d3.geoDistance(pt, o.centre) < Math.PI / 2 - 0.02;
        ctx.save();
        ctx.lineCap = 'round';
        ctx.globalCompositeOperation = 'multiply';
        const emit = now - lastEmit > 55;
        if (emit) lastEmit = now;
        arcs.forEach((a, i) => {
          const local = (el - i * stagger) / lengthOf(a);
          if (local <= 0) return;
          const head = Math.min(1, local);
          const tl = Math.max(0, local - tail);
          if (tl >= 1) return;
          const N = 16;
          for (let j = 0; j < N; j++) {
            const u0 = tl + ((head - tl) * j) / N;
            const u1 = tl + ((head - tl) * (j + 1)) / N;
            const w = (j + 1) / N;
            ctx.globalAlpha = o.alpha * (0.08 + 0.92 * Math.pow(w, 1.7));
            ctx.lineWidth = (0.6 + 0.9 * w) * sf;
            ctx.strokeStyle = o.ink.coral;
            ctx.beginPath();
            path({ type: 'LineString', coordinates: [a.interp(u0), a.interp((u0 + u1) / 2), a.interp(u1)] });
            ctx.stroke();
          }
          if (local < 1) {
            const pt = a.interp(head);
            if (visible(pt)) {
              const p = proj(pt);
              if (p) {
                ctx.globalAlpha = o.alpha;
                ctx.fillStyle = o.ink.coral;
                ctx.beginPath(); ctx.arc(p[0], p[1], 1.9 * sf, 0, TAU); ctx.fill();
                if (emit && !o.still) {
                  const ang = rnd() * TAU;
                  const sp = (8 + rnd() * 16) * sf;
                  parts.push({ x: p[0], y: p[1], vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 4 * sf, born: now, life: 900 + rnd() * 900, teal: rnd() < 0.32, r: rnd() * TAU, s: (1 + rnd() * 1.1) * sf });
                }
              }
            }
          }
        });
        // confetti: tiny flecks of both inks drifting off the trails and settling
        const keep = [];
        for (const q of parts) {
          const age = (now - q.born) / q.life;
          if (age >= 1) continue;
          keep.push(q);
          const tt = (now - q.born) / 1000;
          const x = q.x + q.vx * tt;
          const y = q.y + q.vy * tt + 9 * sf * tt * tt;
          ctx.globalAlpha = o.alpha * (1 - age) * 0.95;
          ctx.fillStyle = q.teal ? o.ink.teal : o.ink.coral;
          ctx.save();
          ctx.translate(x, y); ctx.rotate(q.r + tt * 3);
          ctx.fillRect(-q.s, -q.s * 0.45, q.s * 2, q.s * 0.9);
          ctx.restore();
        }
        parts = keep;
        ctx.restore();
      },
      // reduced motion: every route drawn whole, still
      drawStill(ctx, path, o) {
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = o.alpha;
        ctx.strokeStyle = o.ink.coral;
        ctx.lineWidth = 1 * (o.sf || 1);
        for (const a of arcs) {
          const pts = d3.range(0, 1.0001, 1 / 24).map((u) => a.interp(u));
          ctx.beginPath(); path({ type: 'LineString', coordinates: pts }); ctx.stroke();
        }
        ctx.restore();
      },
    };
  }

  /* the small globe in its corner */
  function Globe({ canvas, land, been, from, tos, ink, reduce }) {
    const ctx = canvas.getContext('2d');
    let W = 0, dpr = 1, pat = null;
    const grid = d3.geoGraticule10();
    const proj = d3.geoOrthographic().clipAngle(90).precision(0.5);
    const path = d3.geoPath(proj, ctx);
    const scatter = Scatter(from, tos, { stagger: 430, dur: 1900 });
    let raf = 0, running = false, t0 = performance.now(), cycle = 0, fade = 1, fadeFrom = 0;

    function size() {
      const r = canvas.getBoundingClientRect();
      W = Math.max(40, r.width);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(W * dpr);
      pat = screenPattern(ctx, dpr, 2.6, 0.62, ink.teal);
    }
    function frame(now) {
      raf = 0;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, W);
      const R = W * 0.4;
      const still = reduce.matches;
      // a slow turn that keeps the routes in view: swaying across Asia, Europe and the Pacific
      const lon = still ? 96 : 92 + 58 * Math.sin(((now - t0) / 1000) * (TAU / 70));
      proj.rotate([-lon, -18]).scale(R).translate([W / 2, W / 2]);
      const a = fadeFrom ? clamp((now - fadeFrom) / 700, 0, 1) : 1;
      printEarth(ctx, path, { land, been, ink, mis: [0.9, -0.6], alpha: a, pat, sphere: true, grid, coast: 0.45, rim: 0.9 });
      if (still) {
        scatter.drawStill(ctx, path, { ink, alpha: a, sf: 0.8 });
      } else {
        if (scatter.done(now)) { scatter.restart(now); cycle += 1; }
        scatter.draw(ctx, path, proj, now, { ink, alpha: a, sf: 0.8, centre: [lon, 18] });
      }
      if (running && !still) raf = requestAnimationFrame(frame);
    }
    return {
      start(fadeIn) {
        size();
        if (fadeIn) fadeFrom = performance.now();
        if (running) return;
        running = true;
        scatter.restart(performance.now());
        raf = requestAnimationFrame(frame);
      },
      stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; },
      replay() { scatter.restart(performance.now()); if (running && !raf) raf = requestAnimationFrame(frame); },
      resize() { size(); if (!raf) raf = requestAnimationFrame(frame); },
      get running() { return running; },
    };
  }

  /* the opening: the globe in the middle of the sheet, the flights scattering, then the globe
     unrolls into the flat map (orthographic to plate carrée) and the map takes over */
  function Opening({ canvas, land, been, from, tos, ink, finalView, onFlat, onDone }) {
    const ctx = canvas.getContext('2d');
    const W = window.innerWidth, H = window.innerHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    const pat = screenPattern(ctx, dpr, 4.4, 0.95, ink.teal);
    const ortho = d3.geoOrthographicRaw, flat = d3.geoEquirectangularRaw;
    const mutate = d3.geoProjectionMutator((t) => (x, y) => {
      const a = ortho(x, y), b = flat(x, y);
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    });
    const proj = mutate(0).precision(0.6);
    const path = d3.geoPath(proj, ctx);
    const grid = d3.geoGraticule10();
    const R = Math.min(W, H) * 0.34;
    const scatter = Scatter(from, tos, { stagger: 95, dur: 1050 });
    const T = { arcs: 250, unroll: 2500, unrollDur: 1600, end: 4100 };
    const t0 = performance.now();
    let raf = 0, flatFired = false, ended = false;
    scatter.restart(t0 + T.arcs);

    function frame(now) {
      const el = now - t0;
      const u = inOut(clamp((el - T.unroll) / T.unrollDur, 0, 1));
      const fv = finalView();
      const lon = -(96 - 4 * clamp(el / T.unroll, 0, 1)) * (1 - u) + fv.rotate[0] * u;
      const lat = -18 * (1 - u);
      mutate(u);
      proj.rotate([lon, lat])
        .scale(R + (fv.scale - R) * u)
        .translate([W / 2 + (fv.translate[0] - W / 2) * u, H / 2 + (fv.translate[1] - H / 2) * u]);
      proj.clipAngle(u >= 0.999 ? null : 90 + 89.9 * u);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const inA = clamp(el / 500, 0, 1);
      printEarth(ctx, path, { land, been, ink, mis: [1.4, -0.9], alpha: inA, pat, sphere: true, grid: u < 0.6 ? grid : null, coast: 0.8, rim: 1.2 * (1 - u) + 0.01 });
      if (u < 0.5) {
        scatter.draw(ctx, path, proj, now, { ink, alpha: inA * (1 - u * 2), sf: 1.5, centre: u === 0 ? [-lon, -lat] : null, still: u > 0 });
      }
      if (u >= 1 && !flatFired) { flatFired = true; onFlat(); }
      if (el >= T.end) { finish(); return; }
      raf = requestAnimationFrame(frame);
    }
    function finish() {
      if (ended) return;
      ended = true;
      cancelAnimationFrame(raf);
      if (!flatFired) { flatFired = true; onFlat(); }
      canvas.classList.add('is-gone');
      setTimeout(() => { canvas.hidden = true; onDone(); }, 520);
    }
    canvas.hidden = false;
    raf = requestAnimationFrame(frame);
    return { skip: finish };
  }

  window.Flights = { Globe, Opening };
})();

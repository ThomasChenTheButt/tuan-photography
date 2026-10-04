/* tuan photography 陳亮元 · design 2 · the opening, candidate: the globe.
   A painted globe turns under the name, in one of four looks (?globe=1|2|3|4; look 4 is the photo
   ball, opening/photoball.js), unrolls into the map's own plate, every flight draws across, and
   the drawing dissolves into the real map beneath. Loads after map/flights.js, whose brushes it
   borrows through WC.pen; app.js plays it (WC.opening) on a first visit. */
(() => {
  'use strict';
  const WC = (window.WC = window.WC || {});
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const easeOut = (x) => 1 - Math.pow(1 - x, 3);
  const ink = (a) => WC.ink(a);
  const PAPER = 'rgb(251, 250, 245)';
  const RAD = Math.PI / 180;
  const { castShadow, makeRoute, course, drawPlane, ringOf, outBack, WASH } = WC.pen;

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
  WC.OPENING = { GLOBE, UNROLL, FLY_AT: GLOBE + UNROLL * 0.78, CLEAR };
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
    // every place he has flown to or from: the night side's city lights (look 2)
    const lights = [];
    for (const f of o.flights) for (const p of [f.from, f.to]) if (!lights.some((q) => near(q, p))) lights.push(p);
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
          const Rg = Rf * (0.94 + 0.06 * easeOut(fadeIn));
          ctx.globalAlpha = fadeIn;
          castShadow(ctx, cx + Rf * 0.08, cyf + Rf * 1.12, Rf * 0.86, 1.3);
          const B = o.ball ? o.ball() : null;
          if (B) {
            // look 4: the ball of his photographs, turning as the globe would (his idea, 2026-10-03)
            const img = B.render(Rg * dpr, -(lon0 - real * SPEED), -lat0);
            ctx.drawImage(img, cx - Rg * 1.15, cyf - Rg * 1.15, Rg * 2.3, Rg * 2.3);
          } else {
            const proj = d3.geoOrthographic().clipAngle(90).precision(0.5).scale(Rg).translate([cx, cyf]).rotate([lon0 - real * SPEED, lat0]);
            // a solid paper globe, as the small one bottom-left is (his call, 2026-10-03)
            WC.paintGlobe(ctx, proj, { land: o.land, travel: o.travel, lw: 1.3, grain: 1, R: Rf * 0.8, solid: 1, style: o.style, lights });
          }
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
            solid: Math.pow(1 - t, 2), style: o.style,   // the roundness flattens out with the sheet
          });
          ctx.restore();
          // the ball of photographs (look 4) gives way to the sheet over the first quarter of the unroll
          const B = o.ball ? o.ball() : null;
          if (B && t < 0.25) {
            ctx.save();
            ctx.globalAlpha = mapA * (1 - t / 0.25);
            const img = B.render(R * dpr, -(lon0 - (GLOBE_END + held) * SPEED), -lat0);
            ctx.drawImage(img, cx - R * 1.15, cy - R * 1.15, R * 2.3, R * 2.3);
            ctx.restore();
          }
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

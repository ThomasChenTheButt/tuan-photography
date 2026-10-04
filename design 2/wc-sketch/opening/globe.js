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
  const { castShadow } = WC.pen;

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

    const near = (a, b) => d3.geoDistance(a, b) < 0.012;
    // every place he has flown to or from: the night side's city lights (look 2)
    const lights = [];
    for (const f of o.flights) for (const p of [f.from, f.to]) if (!lights.some((q) => near(q, p))) lights.push(p);
    // the flights across the flat map, drawn once the sheet lies flat (map/flights.js)
    const flat = WC.flatFlights({ flights: o.flights, home: o.home, LON0: o.LON0, SY, flyAt: FLY_AT });
    const CLEAR_AT = flat.land + 120;
    const END = CLEAR_AT + CLEAR;

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
          if (fa > 0) flat.draw(ctx, el, S, target.translate[0], target.translate[1], fa, W);
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

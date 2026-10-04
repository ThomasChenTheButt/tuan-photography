/* tuan photography 陳亮元 · design 2 · the opening, candidate: the shelf (?opening=shelf).
   His idea (2026-10-03), built as experiment `scroll` after noomoagency.com (his find) and brought
   in here on 2026-10-04. The sea's photograph comes up over the paper with the site's name, and the
   guide books stand in rows on drawn shelves under the name. His first scroll (the wheel, a finger,
   space, an arrow, a click) sets the map developing out of the photograph and the books flying to
   their places on it, playing by itself; his second scroll, once they have landed, sets every
   flight flying; then the name and the flights fade, leaving the map as it always rests. Until it
   is over the map takes no input of its own. The flights are drawn by WC.flatFlights
   (map/flights.js). Loads after map/flights.js; app.js plays it (WC.openingShelf).

   o: { canvas, title (the element holding the name), hint (the one word at the foot), app (the
        .app element), flights (WC.routes), home [lng, lat], LON0, SY, backdrop(ctx, el, until),
        ready(), target(): { scale, translate } of the flat map, narrow(), reduce(), size(): { W, H },
        books: { n(), place(fn | null) (fn(i, x, y, s) → { x, y, s, la }: where book i stands now,
        given its place on the map and the map's book scale), redraw() }, onClear(), onDone() }
   returns { skip(), done, elapsed, end, sliding } */
(() => {
  'use strict';
  const WC = (window.WC = window.WC || {});
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const easeOut = (x) => 1 - Math.pow(1 - x, 3);
  const PAPER = 'rgb(251, 250, 245)';
  // the photograph's arrival, the map's developing (and the books' flight, STAGE, on its own
  // clock), the final fade and the skip fade
  const ARRIVE = 1500, REVEAL = 1400, STAGE = 2800, CLEAR = 1200, SKIP = 450;

  WC.openingShelf = (o) => {
    const c = o.canvas;
    const ctx = c.getContext('2d');
    const title = o.title, hint = o.hint, app = o.app;
    const books = o.books;
    const ARRIVE_END = ARRIVE;
    // the flights leave once the map is all there, not halfway through its developing
    const FLY_AT = ARRIVE_END + REVEAL;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let W = 0, H = 0;
    const size = () => {
      W = window.innerWidth; H = window.innerHeight;
      c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
    };
    size();
    window.addEventListener('resize', size);
    const SY = o.SY || 1;
    const flat = WC.flatFlights({ flights: o.flights, home: o.home, LON0: o.LON0, SY, flyAt: FLY_AT });
    const CLEAR_AT = flat.land + 120;
    const END = CLEAR_AT + CLEAR;

    /* the shelves: rows of book slots under the name, as many rows as the window's width asks,
       each row centred, and the plank each row stands on. They stand clear below the name (lowered
       at his word, 2026-10-03: the books covered the words); bigger at his word the same day. The
       rows were his choice out of four shelves tried (rows, one long shelf, a pile, design 1's row) */
    const shelf = { p: 0, titleY: 0, titleH: 0, cache: null };
    const measure = () => { shelf.titleY = H * (o.narrow() ? 0.2 : 0.24); shelf.titleH = title ? title.offsetHeight : 100; };
    measure();
    function slots() {
      const small = o.narrow();
      const n = books.n();
      const key = `${W}|${H}|${small}|${n}|${shelf.titleY.toFixed(0)}|${shelf.titleH}`;
      if (shelf.cache && shelf.cache.key === key) return shelf.cache;
      const scale = small ? 0.34 : 0.5;
      const bw = 192 * scale, bh = 272 * scale;
      const gap = small ? 8 : 14, margin = small ? 16 : 60;
      const perRow = Math.max(1, Math.floor((W - 2 * margin + gap) / (bw + gap)));
      const rows = Math.ceil(n / perRow);
      const per = Math.ceil(n / rows);
      const top = shelf.titleY + shelf.titleH / 2 + (small ? 30 : 48);
      const pitch = bh + (small ? 26 : 38);
      const list = [], planks = [];
      for (let r = 0; r < rows; r++) {
        const count = Math.min(per, n - r * per);
        const rowW = count * bw + (count - 1) * gap;
        const x0 = (W - rowW) / 2;
        const y = top + r * pitch + bh;
        for (let i = 0; i < count; i++) list.push({ x: x0 + bw / 2 + i * (bw + gap), y, order: r * per + i });
        planks.push({ x0: x0 - 14, x1: x0 + rowW + 14, y: y + 1 });
      }
      shelf.cache = { key, slots: list, planks, scale, stagger: 0.35, lift: small ? 28 : 56 };
      return shelf.cache;
    }
    // where book i stands now: from its slot on the shelf to its place on the map, in the shelf's
    // order, each on a lifted arc; its name letters in as it lands (--la)
    function place(i, x, y, s) {
      const sh = slots();
      const q = sh.slots[i];
      if (!q) return { x, y, s, la: 1 };
      const e = easeInOut(clamp((shelf.p - (sh.stagger * q.order) / Math.max(1, books.n() - 1)) / (1 - sh.stagger), 0, 1));
      return {
        x: q.x + (x - q.x) * e,
        y: q.y + (y - q.y) * e - Math.sin(Math.PI * e) * sh.lift,
        s: sh.scale + (s - sh.scale) * e,
        la: clamp((e - 0.8) / 0.2, 0, 1),
      };
    }
    // the planks, drawn on the opening's canvas in the pen and a wash: a line of ink the books
    // stand on, the wood's shade beneath it, fading as the books leave
    function drawShelf(g, p) {
      if (!books.n()) return;
      const a = clamp(1 - p * 2.2, 0, 1);
      if (a <= 0) return;
      const sh = slots();
      g.save();
      for (const k of sh.planks) {
        g.fillStyle = `rgba(128, 102, 66, ${(0.16 * a).toFixed(3)})`;
        g.fillRect(k.x0, k.y, k.x1 - k.x0, 7);
        g.fillStyle = `rgba(128, 102, 66, ${(0.07 * a).toFixed(3)})`;
        g.fillRect(k.x0 + 4, k.y + 7, k.x1 - k.x0 - 8, 5);
        g.strokeStyle = `rgba(44, 40, 34, ${(0.8 * a).toFixed(3)})`;
        g.lineWidth = 1.25; g.lineCap = 'round';
        g.beginPath(); g.moveTo(k.x0, k.y); g.lineTo(k.x1, k.y); g.stroke();
        g.strokeStyle = `rgba(44, 40, 34, ${(0.35 * a).toFixed(3)})`;
        g.lineWidth = 0.8;
        g.beginPath(); g.moveTo(k.x0 + 2, k.y + 7); g.lineTo(k.x1 - 2, k.y + 7); g.stroke();
      }
      g.restore();
    }

    /* his two scrolls, each setting off a piece that then plays by itself: the first (the wheel,
       a finger, space, an arrow, a click) the map developing and the books flying (STAGE); the
       second, once they have landed, the flights. Until the opening is over the wheel is swallowed
       (a trackpad's scroll runs on for a moment, and those events would skip it) */
    const slide = { live: false, p: 0, at: 0, go: false, over: false, touchY: null };
    const nudge = () => {
      if (!slide.live) return;
      if (!slide.at) slide.at = performance.now();
      else if (slide.p >= 1) slide.go = true;
    };
    const stop = (e) => { e.preventDefault(); e.stopPropagation(); };
    const onWheel = (e) => { stop(e); if (!slide.over && e.deltaY > 0) nudge(); };
    const onTouchStart = (e) => { slide.touchY = e.touches[0].clientY; };
    const onTouchMove = (e) => { if (slide.touchY == null) return; stop(e); if (!slide.over && slide.touchY - e.touches[0].clientY > 24) { nudge(); slide.touchY = null; } };
    const onTouchEnd = () => { slide.touchY = null; };
    const onKey = (e) => { if (!slide.over && [' ', 'ArrowDown', 'PageDown', 'Enter', 'End'].includes(e.key)) { stop(e); nudge(); } };
    const onDown = (e) => { if (!slide.over && e.pointerType === 'mouse') nudge(); };
    const opts = { capture: true, passive: false };
    window.addEventListener('wheel', onWheel, opts);
    window.addEventListener('touchstart', onTouchStart, { capture: true, passive: true });
    window.addEventListener('touchmove', onTouchMove, opts);
    window.addEventListener('touchend', onTouchEnd, { capture: true, passive: true });
    window.addEventListener('keydown', onKey, opts);
    window.addEventListener('pointerdown', onDown, { capture: true, passive: true });
    let listening = true;
    const off = () => {
      if (!listening) return;
      listening = false;
      window.removeEventListener('wheel', onWheel, opts);
      window.removeEventListener('touchstart', onTouchStart, { capture: true });
      window.removeEventListener('touchmove', onTouchMove, opts);
      window.removeEventListener('touchend', onTouchEnd, { capture: true });
      window.removeEventListener('keydown', onKey, opts);
      window.removeEventListener('pointerdown', onDown, { capture: true });
    };
    // every frame: how far the first piece has played (0 to 1), and the word at the foot (before
    // the first scroll, and again once the books have landed)
    const slideFrame = (live) => {
      slide.live = !!live;
      measure();
      if (slide.at) slide.p = o.reduce() ? 1 : easeInOut(clamp((performance.now() - slide.at) / STAGE, 0, 1));
      if (hint) hint.classList.toggle('is-on', slide.live && (!slide.at || (slide.p >= 1 && !slide.go)));
      if (shelf.p !== slide.p) { shelf.p = slide.p; books.redraw(); }
      return slide.p;
    };
    const slideGo = () => {
      if (!slide.go) return false;
      slide.over = true;
      if (hint) hint.classList.remove('is-on');
      return true;
    };

    // the books stand on their shelves from the first frame (the map's layer lets them lie over
    // the opening's canvas while .is-shelf is on)
    app.classList.add('is-shelf');
    books.place(place);
    books.redraw();
    const unshelve = () => { app.classList.remove('is-shelf'); books.place(null); if (hint) hint.classList.remove('is-on'); };

    // the name: over the shelves it stands higher, and glides to the middle as the books leave
    function setTitle(el) {
      if (!title) return;
      const inA = easeOut(clamp((el - 260) / 1100, 0, 1));
      const inB = easeOut(clamp((el - 520) / 1000, 0, 1));
      const out = easeInOut(clamp((el - CLEAR_AT) / CLEAR, 0, 1));
      const ty = (shelf.titleY - H / 2) * (1 - easeInOut(pulled));
      const st = title.style;
      st.setProperty('--oy', `${(ty + 14 * (1 - inA)).toFixed(2)}px`);
      st.setProperty('--os', '1');
      st.setProperty('--oa', (inA * (1 - out)).toFixed(3));
      st.setProperty('--ot', (0.09 * (1 - inA)).toFixed(4));
      st.setProperty('--ob', (inB * (1 - out)).toFixed(3));
      st.setProperty('--oby', `${(8 * (1 - inB)).toFixed(2)}px`);
    }

    const start = performance.now();
    let raf = 0, done = false, el = 0, painting = false, held = 0, pulled = 0, released = false, cleared = false;
    function frame(now) {
      if (done) return;
      // the photograph stands until the map beneath is painted and its own copy is in, so the
      // reveal never lands on a half-made page. `held` is the wait; `el` is the opening's own
      // clock, which once the photograph is up is how far his scrolls have taken it
      el = now - start - held;
      const wait = o.ready && !o.ready() && held < 8000;
      if (el >= ARRIVE_END && wait) { held += el - ARRIVE_END; el = ARRIVE_END; }
      if (!released) {
        const live = el >= ARRIVE_END;
        pulled = slideFrame(live);
        if (live) el = ARRIVE_END + pulled * REVEAL;
        // the books landed and his second scroll come: the clock runs on from this moment
        if (live && pulled >= 1 && slideGo()) { released = true; held = now - start - el; }
      }
      if (!painting) { painting = true; c.classList.add('is-painting'); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const target = o.target();
      const S = target.scale;
      setTitle(el);
      if (el < ARRIVE_END) {
        // the photograph comes up from nothing over the paper
        ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
        if (o.backdrop) o.backdrop(ctx, el, ARRIVE_END);
        drawShelf(ctx, pulled);
      } else {
        // the paper and the whole photograph thin away, and the map develops beneath: the real
        // one, its sea already holding the photograph at full strength
        const mapA = 1 - easeInOut(clamp((el - ARRIVE_END) / REVEAL, 0, 1));
        if (mapA > 0.002) {
          ctx.save();
          ctx.globalAlpha = mapA;
          ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
          if (o.backdrop) o.backdrop(ctx, el, 0);
          ctx.restore();
        }
        drawShelf(ctx, pulled);
        if (el >= FLY_AT) {
          const fa = 1 - easeInOut(clamp((el - CLEAR_AT) / CLEAR, 0, 1));
          if (fa > 0) flat.draw(ctx, el, S, target.translate[0], target.translate[1], fa, W);
        }
        if (!cleared && el >= CLEAR_AT + 300) { cleared = true; unshelve(); if (o.onClear) o.onClear(); }
        if (el >= END) { finish(false); return; }
      }
      raf = requestAnimationFrame(frame);
    }
    function finish(skipped) {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', size);
      off();
      if (!cleared) { cleared = true; unshelve(); if (o.onClear) o.onClear(); }
      const rest = () => { c.hidden = true; c.width = c.height = 1; if (o.onDone) o.onDone(); };
      if (skipped) {
        c.classList.add('is-gone');
        if (title) title.classList.add('is-gone');
        setTimeout(rest, SKIP);
      } else rest();
    }
    raf = requestAnimationFrame(frame);
    return { skip: () => finish(true), get done() { return done; }, get elapsed() { return el; }, get end() { return END; }, get sliding() { return pulled < 1; } };
  };
})();

/* Gallery wall — the behaviour.
   Every photograph on the site is a small print on one screen. The cursor
   pushes the prints apart as it moves; the print nearest it rises toward
   the cursor and grows; a click holds that print in the middle of the
   screen, large, with its name beneath. A second click, Esc, or a click on
   the paper lets it go. On a touch screen a tap holds, a tap lets go. */
(function () {
  'use strict';

  const SITE = window.SITE;
  const wall = document.getElementById('wall');
  const caption = document.getElementById('caption');
  const capPlace = document.getElementById('cap-place');
  const capWhere = document.getElementById('cap-where');
  const langBtn = document.getElementById('lang');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const i18n = {
    en: { title: 'Gallery', hint: 'Move across the wall. Click a photograph to hold it; click again to let go.', other: '中文', speed: 'Speed' },
    zh: { title: '作品集', hint: '滑過這面牆。點一張照片把它留住；再點一下放開。', other: 'EN', speed: '速度' },
  };

  /* ---- the speed bar: a multiplier on every row's drift, 0 holds the wall still ---- */
  const speedIn = document.getElementById('speed');
  const speedOut = document.getElementById('speed-out');
  let speedK = 1;
  function readSpeed() {
    speedK = parseFloat(speedIn.value);
    speedOut.value = '×' + speedK.toFixed(1);
  }
  speedIn.addEventListener('input', readSpeed);
  readSpeed();
  let lang = location.search.includes('zh') ? 'zh' : 'en';

  /* ---- the prints, in a fixed shuffle so countries mix but the wall is the same each visit ---- */
  const ids = Object.keys(SITE.slides);
  let seed = 7;
  const rand = () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647; };
  for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }

  function makeEl(s) {
    const el = document.createElement('figure');
    el.className = 'tile';
    const img = document.createElement('img');
    img.src = '../images/web/640/' + s.file;
    img.alt = s.alt ? s.alt.en : '';
    img.loading = 'eager';
    img.decoding = 'async';
    el.appendChild(img);
    return el;
  }
  const tiles = ids.map((id) => {
    const s = SITE.slides[id];
    const el = makeEl(s);
    wall.appendChild(el);
    const img = el.firstChild;
    return { id, s, el, img, ar: s.w / s.h, big: false,
             bx: 0, by: 0, bw: 0, bh: 0, rot: 0,          // base: where the print lives on the wall
             x: 0, y: 0, w: 0, h: 0, r: 0,                // current, eased each frame
             tx: 0, ty: 0, tw: 0, th: 0, tr: 0 };         // target this frame
  });

  /* ---- layout: rows of prints, close together, each row a loop longer than the screen
     so it can drift sideways without end. Odd rows drift left, even rows right. ---- */
  let W = 0, H = 0, cell = 0;
  const rows = [];            // { y, len, shift, speed, tiles }
  const GAP = 10;
  function layout() {
    W = innerWidth; H = innerHeight;
    const n = tiles.length;
    // the wall keeps off the top edge and leaves the bottom-left corner to the title
    const padTop = Math.max(40, H * 0.07), padBottom = Math.max(130, H * 0.2);
    const ah = H - padTop - padBottom;
    // each row should be about 1.4 screens long: enough to loop with no gap showing
    const count = Math.max(3, Math.round(Math.sqrt(n * ah * 0.76 / W)));
    const pitch = ah / count;
    cell = pitch;
    rows.length = 0;
    const per = Math.ceil(n / count);
    for (let r = 0; r < count; r++) {
      const own = tiles.slice(r * per, (r + 1) * per);
      const h = pitch - GAP;
      let len = own.reduce((a, t) => a + h * t.ar + GAP, 0);
      // a short row borrows prints from the next row until it is long enough to loop
      const list = own.slice();
      let k = 0;
      while (len < W * 1.35 && n > 0) {
        const t = tiles[((r + 1) * per + k++) % n];
        list.push(Object.assign({}, t, { ghost: true, el: null }));
        len += h * t.ar + GAP;
      }
      const row = { y: padTop + r * pitch + pitch / 2, len, shift: 0,
                    speed: (r % 2 ? 1 : -1) * (9 + (r * 7) % 5), tiles: list };
      let x = 0;
      for (const t of list) {
        const w = h * t.ar;
        if (t.ghost) {                       // a borrowed print gets its own element
          t.el = t.el || makeEl(t.s);
          t.img = t.el.firstChild;
          t.x = t.y = t.w = t.h = t.r = 0;
        }
        t.row = row; t.x0 = x + w / 2;
        t.bw = w; t.bh = h; t.rot = 0; t.by = row.y;
        x += w + GAP;
      }
      rows.push(row);
    }
    allTiles = rows.flatMap((r) => r.tiles);
    // drop ghost elements left over from a previous layout
    wall.querySelectorAll('.tile').forEach((el) => { if (!allTiles.some((t) => t.el === el)) el.remove(); });
    allTiles.forEach((t) => { if (t.ghost && !t.el.parentNode) wall.appendChild(t.el); });
    advance(0);
  }
  let allTiles = tiles;

  // where each print stands on its row right now, the row having drifted `shift`
  function advance(dt) {
    for (const row of rows) {
      if (!reduce) row.shift += row.speed * speedK * dt / 1000;
      for (const t of row.tiles) {
        const m = ((t.x0 + row.shift) % row.len + row.len) % row.len;
        t.bx = m - row.len * 0.2;
        if (!t.x && !t.y) { t.x = t.bx; t.y = t.by; t.w = t.bw; t.h = t.bh; }
      }
    }
  }

  /* ---- the cursor, the lifted print, the held print ---- */
  let mx = -1e4, my = -1e4, hasPointer = false;
  let lifted = null, held = null;

  function nearest() {
    let best = null, bd = Infinity;
    for (const t of allTiles) {
      const dx = t.bx - mx, dy = t.by - my, d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = t; }
    }
    return Math.sqrt(bd) < cell * 1.4 ? best : null;
  }

  function sizeFor(t, longEdge) {
    const w = t.ar >= 1 ? longEdge : longEdge * t.ar;
    const h = t.ar >= 1 ? longEdge / t.ar : longEdge;
    return [w, h];
  }

  function wantBig(t) {
    if (t.big) return;
    t.big = true;
    t.img.src = '../images/web/1280/' + t.s.file;
  }

  function setCaption(t) {
    if (!t) { caption.classList.remove('show'); return; }
    capPlace.textContent = t.s.place ? t.s.place[lang] : '';
    capWhere.textContent = t.s.where ? t.s.where[lang] : '';
    caption.classList.add('show');
  }

  /* ---- one frame ---- */
  // eased by the clock, not by the frame, so a slow screen settles in the same time
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(250, now - last); last = now;
    const ease = reduce ? 1 : 1 - Math.exp(-dt / 95);
    advance(dt);
    const short = Math.min(W, H);
    // the held print sits in the middle, as large as the screen allows with its name beneath
    const holdEdge = Math.min(W * 0.78, H * 0.66);
    // the lifted print rises to the cursor, a third of the screen across
    const liftEdge = short * 0.42;
    // the wall parts around whichever print is up, wide enough to clear its name beneath;
    // with nothing up, a small part follows the cursor
    const focus = held || lifted;
    const hx = W / 2, hy = H / 2 - short * 0.04;
    // inside `radius` nothing may stay; everything out to `outer` slides outward to make room
    let fx = mx, fy = my, radius = short * 0.12, outer = short * 0.3;
    if (focus) {
      fx = focus.x; fy = focus.y + 22;
      radius = Math.hypot(focus.w, focus.h) / 2 + 30;
      outer = radius * (held ? 1.3 : 1.5);
    }

    for (const t of allTiles) {
      let x = t.bx, y = t.by, w = t.bw, h = t.bh, r = t.rot;
      // a print that has looped from one end of its row to the other jumps, off screen, not slides
      if (Math.abs(t.bx - t.x) > W * 0.5 && t !== held) t.x = t.bx;
      if (t === held) {
        [w, h] = sizeFor(t, holdEdge); x = hx; y = hy; r = 0;
      } else if (t === lifted) {
        [w, h] = sizeFor(t, liftEdge);
        x = t.bx + (mx - t.bx) * 0.6; y = t.by + (my - t.by) * 0.6; r = 0;
        // stays whole on the screen, its name included
        x = Math.min(Math.max(x, w / 2 + 12), W - w / 2 - 12);
        y = Math.min(Math.max(y, h / 2 + 12), H - h / 2 - 64);
      } else if (!reduce) {
        const dx = t.bx - fx, dy = t.by - fy, d = Math.hypot(dx, dy) || 1;
        if (d < outer) {
          const nd = radius + (d / outer) * (outer - radius);   // [0, outer] slides to [radius, outer]
          x += dx / d * (nd - d); y += dy / d * (nd - d);
        }
      }
      t.tx = x; t.ty = y; t.tw = w; t.th = h; t.tr = r;
      t.x += (t.tx - t.x) * ease; t.y += (t.ty - t.y) * ease;
      t.w += (t.tw - t.w) * ease; t.h += (t.th - t.h) * ease;
      t.r += (t.tr - t.r) * ease;
      const st = t.el.style;
      st.setProperty('--x', (t.x - t.w / 2).toFixed(1) + 'px');
      st.setProperty('--y', (t.y - t.h / 2).toFixed(1) + 'px');
      st.setProperty('--w', t.w.toFixed(1) + 'px');
      st.setProperty('--h', t.h.toFixed(1) + 'px');
      st.setProperty('--r', t.r.toFixed(2) + 'deg');
    }
    if (focus) {
      caption.style.setProperty('--cx', focus.x.toFixed(1) + 'px');
      caption.style.setProperty('--cy', (focus.y + focus.h / 2 + 14).toFixed(1) + 'px');
    }
    requestAnimationFrame(frame);
  }

  /* ---- pointer ---- */
  function lift(t) {
    if (t === lifted) return;
    if (lifted) lifted.el.classList.remove('lift');
    lifted = t;
    if (t) { t.el.classList.add('lift'); wantBig(t); }
    if (!held) setCaption(t);
  }
  function hold(t) {
    if (held) held.el.classList.remove('hold');
    held = t;
    if (t) { t.el.classList.add('hold'); wantBig(t); lift(null); }
    setCaption(t || lifted);
    document.body.classList.toggle('holding', !!t);
  }

  wall.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    hasPointer = true; mx = e.clientX; my = e.clientY;
    if (!held) lift(nearest());
  });
  wall.addEventListener('pointerleave', () => { mx = -1e4; my = -1e4; if (!held) lift(null); });

  wall.addEventListener('click', (e) => {
    const el = e.target.closest('.tile');
    const t = el ? allTiles.find((t) => t.el === el) : null;
    if (held) { hold(null); if (hasPointer) lift(nearest()); return; }
    if (t) hold(t);
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && held) hold(null); });

  /* ---- language ---- */
  function applyLang() {
    document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en';
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = i18n[lang][el.dataset.i18n]; });
    langBtn.textContent = i18n[lang].other;
    allTiles.forEach((t) => { t.img.alt = t.s.alt ? t.s.alt[lang] : ''; });
    if (held || lifted) setCaption(held || lifted);
  }
  langBtn.addEventListener('click', () => { lang = lang === 'zh' ? 'en' : 'zh'; applyLang(); });

  addEventListener('resize', layout);
  layout();
  applyLang();
  requestAnimationFrame(frame);
})();

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
    en: { title: 'Gallery', hint: 'Move across the wall. Click a photograph to open it.', other: '中文', speed: 'Speed', tilt: 'Tilt', size: 'Size', gap: 'Gap', kicker: 'A photography wall', dark: 'Dark', light: 'Light',
          vMaking: 'How it was made', vCamera: 'Camera', vLens: 'Lens', vFocal: 'Focal length', vAperture: 'Aperture', vShutter: 'Shutter', vIso: 'ISO', vBest: 'Best time', vGuide: 'Read the guide', vNoGuide: 'The guide for this place is not written yet.', vMap: 'Open the map pin', vClose: 'Close', vPrev: 'Previous', vNext: 'Next' },
    zh: { title: '作品集', hint: '滑過這面牆。點一張照片打開它。', other: 'EN', speed: '速度', tilt: '歪斜', size: '大小', gap: '間距', kicker: '一面照片牆', dark: '深色', light: '淺色',
          vMaking: '這張怎麼拍', vCamera: '相機', vLens: '鏡頭', vFocal: '焦距', vAperture: '光圈', vShutter: '快門', vIso: 'ISO', vBest: '最佳時間', vGuide: '閱讀攻略', vNoGuide: '這個地方的攻略還沒寫。', vMap: '打開地圖座標', vClose: '關閉', vPrev: '上一張', vNext: '下一張' },
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

  /* ---- the tilt bar: how far a print may lean, in degrees either way ---- */
  const tiltIn = document.getElementById('tilt');
  const tiltOut = document.getElementById('tilt-out');
  let tiltK = 1.5;
  function readTilt() {
    tiltK = parseFloat(tiltIn.value);
    tiltOut.value = tiltK.toFixed(1) + '°';
  }
  tiltIn.addEventListener('input', readTilt);
  readTilt();

  /* ---- the size bar: how tall the prints are. The wall re-lays itself in fewer or more rows ---- */
  const sizeIn = document.getElementById('size');
  const sizeOut = document.getElementById('size-out');
  let sizeK = 1;
  function readSize() {
    sizeK = parseFloat(sizeIn.value);
    sizeOut.value = '×' + sizeK.toFixed(1);
    if (rows.length) layout();
  }
  sizeIn.addEventListener('input', readSize);

  /* ---- the gap bar: the space between prints, in pixels ---- */
  const gapIn = document.getElementById('gap');
  const gapOut = document.getElementById('gap-out');
  function readGap() {
    GAP = parseFloat(gapIn.value);
    gapOut.value = GAP.toFixed(0) + 'px';
    if (rows.length) layout();
  }
  gapIn.addEventListener('input', readGap);
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
             x: 0, y: 0, w: 0, h: 0, r: 0, op: 1,         // current, eased each frame
             tx: 0, ty: 0, tw: 0, th: 0, tr: 0 };         // target this frame
  });

  /* ---- layout: rows of prints, close together, each row a loop longer than the screen
     so it can drift sideways without end. Odd rows drift left, even rows right. ---- */
  let W = 0, H = 0, cell = 0;
  const rows = [];            // { y, len, shift, speed, tiles }
  let GAP = 10;               // the space between prints, set by the gap bar
  function layout() {
    W = innerWidth; H = innerHeight;
    const n = tiles.length;
    // the wall runs past every edge: the first and last rows are cut by the window,
    // and each row is about 1.4 screens long so it can loop with no gap showing
    // the size bar scales the row height; bigger prints mean fewer rows, never an overlap
    // the print height comes from the size bar alone; the gap is added on top of it,
    // so widening the gap makes fewer rows, not smaller prints
    const ph = H / Math.max(3, Math.sqrt(n * H * 0.76 / W)) * sizeK - 10;
    const pitch = ph + GAP;
    const top = -pitch * 0.45;                // the top row begins above the window
    const total = Math.ceil((H - top) / pitch) + 1;   // enough rows to run off the bottom too
    cell = pitch;
    const shifts = rows.map((r) => r.shift);  // keep each row where it had drifted to
    rows.length = 0;
    const per = Math.ceil(n / total);
    seed = 11;                                // the same slight tilts on every visit
    for (let r = 0; r < total; r++) {
      const own = tiles.slice(r * per, (r + 1) * per);
      const h = ph;
      let len = own.reduce((a, t) => a + h * t.ar + GAP, 0);
      // a short row borrows prints from the next row until it is long enough to loop
      const list = own.slice();
      let k = 0;
      while (len < W * 1.35 && n > 0) {
        const t = tiles[((r + 1) * per + k++) % n];
        list.push(Object.assign({}, t, { ghost: true, el: null }));
        len += h * t.ar + GAP;
      }
      const row = { y: top + r * pitch + pitch / 2, len, shift: shifts[r] || 0,
                    speed: (r % 2 ? 1 : -1) * (9 + (r * 7) % 5), tiles: list };
      let x = 0;
      for (const t of list) {
        const w = h * t.ar;
        if (t.ghost) {                       // a borrowed print gets its own element
          t.el = t.el || makeEl(t.s);
          t.img = t.el.firstChild;
          t.x = t.y = t.w = t.h = t.r = 0; t.op = 1;
        }
        t.row = row; t.x0 = x + w / 2;
        t.bw = w; t.bh = h; t.by = row.y;
        t.tilt = (rand() - 0.5) * 2;          // -1..1, scaled by the tilt bar into degrees each frame
        x += w + GAP;
      }
      rows.push(row);
    }
    allTiles = rows.flatMap((r) => r.tiles);
    // drop ghost elements left over from a previous layout
    wall.querySelectorAll('.tile').forEach((el) => { if (!allTiles.some((t) => t.el === el)) el.remove(); });
    allTiles.forEach((t) => { if (t.ghost && !t.el.parentNode) wall.appendChild(t.el); });
    // a borrowed print that was up and is gone from the new wall is let go
    if (held && !allTiles.includes(held)) hold(null);
    if (lifted && !allTiles.includes(lifted)) lift(null);
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

  /* ---- the places where words sit over the wall ---- */
  const quietZones = [document.querySelector('.head'), document.querySelector('.tools'), document.querySelector('.bars')];

  /* ---- light or dark paper ---- */
  const themeBtn = document.getElementById('theme');
  let theme = 'light';
  try { theme = localStorage.getItem('wall-theme') || theme; } catch (e) {}
  function applyTheme() {
    document.documentElement.dataset.theme = theme;
    themeBtn.textContent = i18n[lang][theme === 'dark' ? 'light' : 'dark'];
    try { localStorage.setItem('wall-theme', theme); } catch (e) {}
  }
  themeBtn.addEventListener('click', () => { theme = theme === 'dark' ? 'light' : 'dark'; applyTheme(); });

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
    // the words float over the wall; the prints beneath them go faint so the words read
    const quiet = quietZones.map((el) => el.getBoundingClientRect());
    const faint = 0.22;
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
      let x = t.bx, y = t.by, w = t.bw, h = t.bh, r = t.tilt * tiltK;
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
      let op = 1;
      if (t !== held && t !== lifted) {
        for (const q of quiet) {
          if (t.x + t.w / 2 > q.left - 16 && t.x - t.w / 2 < q.right + 16 &&
              t.y + t.h / 2 > q.top - 16 && t.y - t.h / 2 < q.bottom + 16) { op = faint; break; }
        }
      }
      t.op += (op - t.op) * ease;
      const st = t.el.style;
      st.setProperty('--op', t.op.toFixed(3));
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

  wall.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    hasPointer = true; mx = e.clientX; my = e.clientY;
    if (!held) lift(nearest());
  });
  wall.addEventListener('pointerleave', () => { mx = -1e4; my = -1e4; if (!held) lift(null); });

  wall.addEventListener('click', (e) => {
    const el = e.target.closest('.tile');
    const t = el ? allTiles.find((t) => t.el === el) : null;
    if (t) openViewer(t.id);
  });

  /* ---- language ---- */
  function applyLang() {
    document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en';
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = i18n[lang][el.dataset.i18n]; });
    langBtn.textContent = i18n[lang].other;
    applyTheme();
    allTiles.forEach((t) => { t.img.alt = t.s.alt ? t.s.alt[lang] : ''; });
    if (held || lifted) setCaption(held || lifted);
    if (viewer.open) renderViewer();
  }
  langBtn.addEventListener('click', () => { lang = lang === 'zh' ? 'en' : 'zh'; applyLang(); });


  /* ---- the viewer: the photograph large on the left, how it was made on the right.
     Design 1's viewer, on this wall's paper, so it follows Dark and Light. ---- */
  const viewer = document.createElement('dialog');
  viewer.className = 'viewer';
  viewer.setAttribute('aria-labelledby', 'viewer-place');
  viewer.tabIndex = -1;
  viewer.innerHTML = `
    <div class="viewer__bar">
      <div>
        <button id="viewer-prev" type="button"></button>
        <button id="viewer-next" type="button"></button>
        <span class="viewer__count" id="viewer-count"></span>
      </div>
      <button id="viewer-close" type="button" class="viewer__close"></button>
    </div>
    <div class="viewer__photo"><img id="viewer-img" alt=""></div>
    <div class="viewer__side">
      <div>
        <h2 id="viewer-place" aria-live="polite"></h2>
        <p class="viewer__where" id="viewer-where"></p>
      </div>
      <div>
        <h3 id="viewer-making"></h3>
        <dl id="viewer-data"></dl>
      </div>
      <p class="viewer__note" id="viewer-note"></p>
      <div class="viewer__acts" id="viewer-acts"></div>
    </div>`;
  document.body.append(viewer);
  const $v = (id) => viewer.querySelector('#' + id);
  const t = (k) => i18n[lang][k];
  const row = (label, value) => value ? `<div><dt>${label}</dt><dd>${value}</dd></div>` : '';
  let current = null;
  // the guides live on the real site; this test folder links across to it
  const SITE_ROOT = 'http://localhost:8642/';

  function renderViewer() {
    const s = SITE.slides[current];
    if (!s) return;
    const img = $v('viewer-img');
    if (!img.src.endsWith('/' + s.file)) {
      img.setAttribute('aria-busy', 'true');
      img.onload = () => img.removeAttribute('aria-busy');
      img.sizes = '(max-width: 56rem) 100vw, calc(100vw - 20rem)';
      img.srcset = `../images/web/640/${s.file} 640w, ../images/web/1280/${s.file} 1280w, ../images/web/${s.file} ${s.w}w`;
      img.src = '../images/web/' + s.file;
    }
    img.width = s.w; img.height = s.h;
    img.alt = s.alt ? s.alt[lang] : '';
    $v('viewer-place').textContent = s.place ? s.place[lang] : '';
    $v('viewer-where').textContent = s.where ? s.where[lang] : '';
    $v('viewer-making').textContent = t('vMaking');
    $v('viewer-data').innerHTML =
      row(t('vBest'), s.best && s.best[lang]) + row(t('vFocal'), s.focal) + row(t('vAperture'), s.aperture) +
      row(t('vShutter'), s.shutter) + row(t('vIso'), s.iso) + row(t('vLens'), s.lens) + row(t('vCamera'), s.camera);
    const note = $v('viewer-note');
    note.textContent = (s.note && s.note[lang]) || (s.guide ? '' : t('vNoGuide'));
    note.hidden = !note.textContent;
    const acts = [];
    if (s.guide) acts.push(`<a class="btn" href="${SITE_ROOT}${s.guide}#s-${current}">${t('vGuide')}</a>`);
    if (s.map) acts.push(`<a href="${s.map}" target="_blank" rel="noopener">${t('vMap')}</a>`);
    $v('viewer-acts').innerHTML = acts.join('');
    $v('viewer-close').textContent = t('vClose');
    $v('viewer-prev').textContent = t('vPrev');
    $v('viewer-next').textContent = t('vNext');
    $v('viewer-count').textContent = `${ids.indexOf(current) + 1} / ${ids.length}`;
  }
  function openViewer(id) {
    current = id;
    lift(null);
    renderViewer();
    if (!viewer.open) { viewer.showModal(); $v('viewer-close').focus({ preventScroll: true }); }
  }
  function step(d) {
    current = ids[(ids.indexOf(current) + d + ids.length) % ids.length];
    renderViewer();
  }
  $v('viewer-close').addEventListener('click', () => viewer.close());
  $v('viewer-prev').addEventListener('click', () => step(-1));
  $v('viewer-next').addEventListener('click', () => step(1));
  viewer.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });
  viewer.addEventListener('close', () => { mx = -1e4; my = -1e4; });

  addEventListener('resize', layout);
  sizeK = parseFloat(sizeIn.value); sizeOut.value = '×' + sizeK.toFixed(1);
  GAP = parseFloat(gapIn.value); gapOut.value = GAP.toFixed(0) + 'px';
  layout();
  applyLang();
  requestAnimationFrame(frame);
})();

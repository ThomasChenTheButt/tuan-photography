/* Departures: the board, the map through the glass, the books, the opened page. */
(() => {
  'use strict';

  const S = window.SITE;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const phone = matchMedia('(max-width: 47.99rem)');
  const compact = matchMedia('(max-width: 63.99rem)');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ------------------------------------------------------------ words */
  const W = {
    en: {
      departures: 'Departures',
      boardLine: 'Sixteen places travelled, from home base Taiwan. Choose one to open its book.',
      colWhen: 'Travelled', colWhere: 'Destination', colRemark: 'Remarks',
      remGuide: 'Guide', remPhotos: 'Photographs', remNone: 'No photographs yet',
      hint: 'Tap again to open', showAll: 'Show all', showLess: 'Show map',
      zoomIn: 'Zoom in', zoomOut: 'Zoom out', world: 'Whole map', controls: 'Map controls',
      mapLabel: 'Map of the places travelled. Arrow keys move the map, plus and minus zoom.',
      skip: 'Skip to the departures board',
      now: n => `Now showing ${n}`, opened: n => `Opened ${n}`, closed: 'Back to the map',
      whole: 'Showing the whole map',
      prev: 'Previous', next: 'Next', travelled: 'Travelled',
      count: n => (n === 1 ? '1 photograph' : `${n} photographs`),
      row: (t, d, r) => `${t}, travelled ${d}. ${r}.`,
      homeBase: 'Home base', centre: 'Centre',
      camera: 'Camera', lens: 'Lens', focal: 'Focal length', aperture: 'Aperture', shutter: 'Shutter', iso: 'ISO',
      lat: v => `${Math.abs(v).toFixed(2)}° ${v >= 0 ? 'N' : 'S'}`,
      lng: v => `${Math.abs(v).toFixed(2)}° ${v >= 0 ? 'E' : 'W'}`,
    },
    zh: {
      departures: '出發',
      boardLine: '從大本營台灣出發，十六個去過的地方。選一個，打開它的書。',
      colWhen: '時間', colWhere: '目的地', colRemark: '備註',
      remGuide: '攻略', remPhotos: '作品', remNone: '還沒有照片',
      hint: '再點一次打開', showAll: '看全部', showLess: '看地圖',
      zoomIn: '放大', zoomOut: '縮小', world: '全圖', controls: '地圖控制',
      mapLabel: '去過的地方的地圖。方向鍵移動地圖，加號和減號縮放。',
      skip: '跳到出發看板',
      now: n => `正在顯示：${n}`, opened: n => `已打開：${n}`, closed: '回到地圖',
      whole: '正在顯示全圖',
      prev: '上一張', next: '下一張', travelled: '旅行時間',
      count: n => `${n} 張照片`,
      row: (t, d, r) => `${t}，${d}。${r}。`,
      homeBase: '大本營', centre: '中心',
      camera: '相機', lens: '鏡頭', focal: '焦距', aperture: '光圈', shutter: '快門', iso: 'ISO',
      lat: v => `${v >= 0 ? '北緯' : '南緯'} ${Math.abs(v).toFixed(2)}°`,
      lng: v => `${v >= 0 ? '東經' : '西經'} ${Math.abs(v).toFixed(2)}°`,
    },
  };
  let lang = 'en';
  try { const s = localStorage.getItem('tlap-lang'); if (s === 'en' || s === 'zh') lang = s; } catch (e) { /* storage blocked */ }
  try { const q = new URLSearchParams(location.search).get('lang'); if (q === 'en' || q === 'zh') lang = q; } catch (e) { /* no query */ }
  const T = () => Object.assign({}, S.i18n[lang], W[lang]);

  /* ------------------------------------------------------------ places, in the owner's order */
  const ISO = { spain: '724', uk: '826', france: '250', germany: '276', switzerland: '756', taiwan: '158', japan: '392', 'south-korea': '410', 'hong-kong': '344', china: '156', singapore: '702', vietnam: '704', dubai: '784', australia: '036', 'new-zealand': '554', usa: '840' };
  const countries = Object.fromEntries(S.countries.map(c => [c.id, c]));
  const places = S.books.map((b, i) => {
    const c = countries[b.country];
    const g = b.guide ? S.guides[b.guide] : null;
    return {
      i, id: b.country, book: b, country: c, guide: g, ll: g ? g.ll : c.ll,
      kind: g ? 'guide' : (c.photos.length ? 'photos' : 'none'),
      hash: g ? `#guide-${b.guide}` : `#place-${b.country}`,
    };
  });
  const home = places.find(p => p.id === S.home) || places[0];
  const byHash = h => places.find(p => p.hash === h) || null;
  const title = p => p.book.title[lang];
  const remark = p => T()[{ guide: 'remGuide', photos: 'remPhotos', none: 'remNone' }[p.kind]];

  /* ------------------------------------------------------------ elements */
  const root = document.documentElement;
  const hall = $('#hall'), top = $('.top'), mapEl = $('#map'), canvas = $('#canvas'), booksEl = $('#books');
  const board = $('#board'), rowsEl = $('#rows'), readout = $('#readout'), live = $('#live');
  const page = $('#page'), pageBody = $('#page-body'), pageScroll = $('#page-scroll'), pageWhere = $('#page-where');
  const viewer = $('#viewer'), sheetBtn = $('#sheet-toggle');
  const ctx = canvas.getContext('2d');
  const say = msg => { live.textContent = ''; requestAnimationFrame(() => { live.textContent = msg; }); };

  /* ------------------------------------------------------------ split flaps */
  const POOL_LATIN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let POOL_CJK = '';
  const isCJK = ch => /[　-鿿＀-￯]/.test(ch);
  function cell() {
    const c = document.createElement('span');
    c.className = 'flap';
    c.innerHTML = '<span class="t"><i></i></span><span class="b"><i></i></span><span class="ft"><i></i></span><span class="fb"><i></i></span>';
    const [t, b, ft, fb] = c.children;
    Object.assign(c, { _t: t.firstChild, _b: b.firstChild, _ft: ft, _fb: fb, _fti: ft.firstChild, _fbi: fb.firstChild, _ch: ' ', _tok: 0 });
    return c;
  }
  const put = (i, ch) => { i.textContent = ch; i.className = isCJK(ch) ? 'cjk' : ''; };
  function setNow(c, ch) { c._tok++; put(c._t, ch); put(c._b, ch); c._ch = ch; }
  function flipOnce(c, ch, d) {
    put(c._t, ch); put(c._fti, c._ch); put(c._fbi, ch);
    c._ft.animate([{ transform: 'rotateX(0deg)', opacity: 1 }, { transform: 'rotateX(-90deg)', opacity: 1 }], { duration: d, easing: 'cubic-bezier(.55,0,1,.45)' });
    c._fb.animate([{ transform: 'rotateX(90deg)', opacity: 1 }, { transform: 'rotateX(0deg)', opacity: 1 }], { duration: d, delay: d, easing: 'cubic-bezier(0,.55,.45,1)' });
    return new Promise(r => setTimeout(() => { put(c._b, ch); c._ch = ch; r(); }, d * 2));
  }
  async function flipTo(c, ch, delay, steps) {
    const tok = ++c._tok;
    if (c._ch === ch) return;
    const pool = isCJK(ch) ? POOL_CJK : POOL_LATIN;
    const seq = [];
    if (ch === ' ' || c.classList.contains('flap--word')) { seq.push(' '); } else {
      for (let k = 0; k < steps; k++) seq.push(pool[(Math.random() * pool.length) | 0]);
    }
    seq.push(ch);
    await new Promise(r => setTimeout(r, delay));
    for (const s of seq) {
      if (c._tok !== tok) return;
      await flipOnce(c, s, 46);
    }
  }
  class Board {
    constructor(el, n, word) {
      this.el = el; this.word = word;
      this.cells = Array.from({ length: n }, () => { const c = cell(); if (word) c.classList.add('flap--word'); el.appendChild(c); return c; });
    }
    set(text, animate, delay0 = 0, stagger = 26) {
      const chars = this.word ? [text] : Array.from(text.toUpperCase());
      this.cells.forEach((c, i) => {
        const ch = chars[i] || ' ';
        if (!animate) setNow(c, ch);
        else flipTo(c, ch, delay0 + i * stagger, 2 + ((Math.random() * 4) | 0));
      });
    }
  }

  /* ------------------------------------------------------------ the board's rows */
  rowsEl.innerHTML = places.map(p => `<li><button type="button" class="row row--${p.kind}" data-id="${p.id}">`
    + '<span class="row__date"><span class="flaps flaps--date" aria-hidden="true"></span></span>'
    + '<span class="row__dest"><span class="flaps flaps--dest" aria-hidden="true"></span></span>'
    + '<span class="row__rem"><span class="flaps flaps--rem" aria-hidden="true"></span><span class="row__hint" aria-hidden="true"></span></span>'
    + '</button></li>').join('');
  places.forEach(p => {
    p.row = rowsEl.querySelector(`[data-id="${p.id}"]`);
    p.fDate = new Board(p.row.querySelector('.flaps--date'), 11);
    p.fDest = new Board(p.row.querySelector('.flaps--dest'), 13);
    p.fRem = new Board(p.row.querySelector('.flaps--rem'), 1, true);
  });
  const titleFlaps = new Board($('#title-flaps'), 10);
  POOL_CJK = Array.from(new Set(Array.from(places.map(p => p.book.title.zh + p.country.date.zh).join('') + W.zh.departures).filter(isCJK))).join('');

  /* ------------------------------------------------------------ the books (design 1's markup) */
  function bookHTML(p) {
    const b = p.book, t = esc(b.title.en), s = b.photo && S.slides[b.photo];
    const face = s
      ? `<span class="book__face"><img src="../images/web/640/${esc(s.file)}" width="${s.w}" height="${s.h}" alt="" decoding="async">`
      : `<span class="book__face book__face--blank"><b data-k="title">${t}</b>`;
    return `<a class="book book--${b.tone}" href="${p.hash}" tabindex="-1" aria-hidden="true"><span class="book__box"><span class="book__leaf"></span>`
      + `<span class="book__spine"><b data-k="title">${t}</b><i>tuan photography</i></span>`
      + `${face}<span class="book__band"><b data-k="title">${t}</b><span data-k="band">${esc(S.i18n.en[b.band])}</span></span></span>`
      + '<span class="book__back"><i>tuan photography</i></span><span class="book__edge"></span>'
      + '<span class="book__top"></span><span class="book__shadow"></span><span class="book__veil"></span></span></a>';
  }
  booksEl.innerHTML = places.map(p => `<div class="pin" data-id="${p.id}"><div class="pin__scale">${bookHTML(p)}</div><span class="pin__label"><b></b><i></i></span></div>`).join('');
  places.forEach(p => {
    p.pin = booksEl.querySelector(`.pin[data-id="${p.id}"]`);
    p.bookEl = p.pin.querySelector('.book');
  });

  /* ------------------------------------------------------------ language */
  function applyLang(animate) {
    const t = T();
    root.lang = lang === 'zh' ? 'zh-Hant' : 'en';
    try { localStorage.setItem('tlap-lang', lang); } catch (e) { /* storage blocked */ }
    $$('[data-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    $$('[data-t]').forEach(el => { const v = t[el.dataset.t]; if (typeof v === 'string') el.textContent = v; });
    $$('[data-t-aria]').forEach(el => { const v = t[el.dataset.tAria]; if (typeof v === 'string') el.setAttribute('aria-label', v); });
    sheetBtn.textContent = board.classList.contains('is-open') ? t.showLess : t.showAll;
    $('#ig').setAttribute('aria-label', `${t.follow}: tuan_1127`);
    titleFlaps.set(t.departures, animate, 0, 40);
    places.forEach((p, i) => {
      const d0 = 260 + i * 42;
      p.fDate.set(p.country.date[lang], animate, d0, 22);
      p.fDest.set(title(p), animate, d0 + 120, 28);
      p.fRem.set(remark(p), animate, d0 + 520, 0);
      p.row.setAttribute('aria-label', t.row(title(p), p.country.date[lang], remark(p)));
      p.row.querySelector('.row__hint').textContent = t.hint;
      $$('[data-k="title"]', p.pin).forEach(el => { el.textContent = title(p); });
      $$('[data-k="band"]', p.pin).forEach(el => { el.textContent = S.i18n[lang][p.book.band]; });
      p.pin.querySelector('.pin__label b').textContent = title(p);
      p.pin.querySelector('.pin__label i').textContent = remark(p);
    });
    if (openP) { fillPage(openP); }
    if (!viewer.hidden) fillViewer();
    updateReadout();
    draw();
  }
  $$('[data-lang]').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.lang === lang) return;
    lang = b.dataset.lang;
    applyLang(!reduce.matches);
  }));

  /* ------------------------------------------------------------ the map */
  const BW = 1000, BH = 500;
  const proj = d3.geoEquirectangular().scale(BW / (2 * Math.PI)).translate([BW / 2, BH / 2]).precision(0.2);
  const toBase = ll => proj([ll[1], ll[0]]);
  const fromBase = (x, y) => { const v = proj.invert([x, y]); return [v[1], v[0]]; };
  places.forEach(p => { p.base = toBase(p.ll); });
  const slideMarks = Object.values(S.slides).filter(s => s.ll).map(s => toBase(s.ll));

  let Wd = innerWidth, Hd = innerHeight, dpr = Math.min(devicePixelRatio || 1, 2);
  let tr = d3.zoomIdentity, kMin = 0.5;
  let shapes = null, shapesFine = null;
  const css = n => getComputedStyle(root).getPropertyValue(n).trim();
  let C = {};
  const readColours = () => { C = { sea: css('--sea'), land: css('--land'), been: css('--been'), coast: css('--coast'), rule: css('--rule'), ink: css('--ink'), ink2: css('--ink-2'), ink3: css('--ink-3'), signal: css('--signal'), panel: css('--panel') }; };
  readColours();

  function buildShapes(topo) {
    const path = d3.geoPath(proj);
    const all = topojson.feature(topo, topo.objects.countries).features;
    const beenIds = new Set(Object.values(ISO));
    return {
      land: new Path2D(path(topojson.feature(topo, topo.objects.land))),
      been: new Path2D(path({ type: 'FeatureCollection', features: all.filter(f => beenIds.has(f.id) && f.id !== ISO[S.home]) })),
      home: new Path2D(path({ type: 'FeatureCollection', features: all.filter(f => f.id === ISO[S.home]) })),
      borders: new Path2D(path(topojson.mesh(topo, topo.objects.countries, (a, b) => a !== b))),
      coast: new Path2D(path(topojson.mesh(topo, topo.objects.countries, (a, b) => a === b))),
    };
  }
  let hatch = null;
  function makeHatch() {
    const n = Math.round(7 * dpr), c = document.createElement('canvas');
    c.width = c.height = n;
    const g = c.getContext('2d');
    g.strokeStyle = C.ink; g.globalAlpha = 0.16; g.lineWidth = Math.max(1, dpr * 0.8);
    g.beginPath(); g.moveTo(0, n); g.lineTo(n, 0); g.moveTo(-1, 1); g.lineTo(1, -1); g.moveTo(n - 1, n + 1); g.lineTo(n + 1, n - 1); g.stroke();
    hatch = ctx.createPattern(c, 'repeat');
  }

  /* the part of the window the map shows clear of the board and the dock */
  const rects = { board: null, dock: null };
  function measure() { rects.board = board.getBoundingClientRect(); rects.dock = $('.dock').getBoundingClientRect(); }
  function freeArea() {
    if (compact.matches) {
      const sheet = Hd * (Hd < 640 ? 0.56 : 0.48);
      return { x: 12, y: 64, w: Wd - 24, h: Math.max(120, Hd - sheet - 64 - 70) };
    }
    if (!rects.board) measure();
    const b = rects.board;
    const x = Math.min(b.right + 32, Wd * 0.6);
    return { x, y: 80, w: Math.max(200, Wd - x - 40), h: Hd - 80 - 90 };
  }
  function fit(bounds, maxK, padTop = 110) {
    const a = freeArea();
    const [[x0, y0], [x1, y1]] = bounds;
    const pad = 40, side = compact.matches ? 48 : 90;
    const dx = Math.max(x1 - x0, 1e-3), dy = Math.max(y1 - y0, 1e-3);
    let k = Math.min((a.w - 2 * side) / dx, (a.h - pad - padTop) / dy, maxK);
    k = Math.max(k, kMin);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const sx = a.x + a.w / 2, sy = a.y + padTop + (a.h - padTop - pad) / 2;
    return d3.zoomIdentity.translate(sx - cx * k, sy - cy * k).scale(k);
  }
  const boundsOf = pts => [[d3.min(pts, d => d[0]), d3.min(pts, d => d[1])], [d3.max(pts, d => d[0]), d3.max(pts, d => d[1])]];
  const worldView = () => fit(boundsOf(places.map(p => p.base)), 3, phone.matches ? 70 : 90);

  const zoom = d3.zoom()
    .scaleExtent([0.5, 180])
    .on('start', ev => { if (ev.sourceEvent) { flying = false; userMoved = true; } })
    .on('zoom', ev => { tr = ev.transform; if (flying) pushTrail(); frame(); });
  const mapSel = d3.select(mapEl).call(zoom).on('dblclick.zoom', null);
  mapSel.on('dblclick.departures', ev => {
    if (ev.target.closest('.book')) return;
    const [x, y] = d3.pointer(ev, mapEl);
    zoom.scaleBy(reduce.matches ? mapSel : mapSel.transition().duration(450).ease(d3.easeExpOut), ev.shiftKey ? 0.5 : 2, [x, y]);
  });

  function sizeCanvas() {
    Wd = innerWidth; Hd = innerHeight; dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(Wd * dpr); canvas.height = Math.round(Hd * dpr);
    kMin = Math.min(Wd / BW, Hd / BH) * 0.5;
    zoom.scaleExtent([kMin, 180]).translateExtent([[-BW * 0.25, -BH * 0.2], [BW * 1.25, BH * 1.2]]);
    makeHatch();
  }

  /* flying: the camera's path leaves a trail that fades in a few seconds */
  let flying = false, userMoved = false;
  const trail = [];
  const TRAIL_MS = 3800;
  function pushTrail() {
    const a = freeArea();
    trail.push({ x: (a.x + a.w / 2 - tr.x) / tr.k, y: (a.y + a.h / 2 - tr.y) / tr.k, t: performance.now() });
  }
  function flyTo(t, done) {
    mapSel.interrupt('fly');
    if (reduce.matches) { mapSel.call(zoom.transform, t); if (done) done(); return; }
    const a = freeArea();
    const c0 = [(a.x + a.w / 2 - tr.x) / tr.k, (a.y + a.h / 2 - tr.y) / tr.k, a.w / tr.k];
    const c1 = [(a.x + a.w / 2 - t.x) / t.k, (a.y + a.h / 2 - t.y) / t.k, a.w / t.k];
    const ms = Math.max(650, Math.min(1500, d3.interpolateZoom(c0, c1).duration * 0.75));
    flying = true;
    mapSel.transition('fly').duration(ms).ease(d3.easeExpOut).call(zoom.transform, t)
      .on('end', () => { flying = false; if (done) done(); })
      .on('interrupt', () => { flying = false; });
  }

  /* ------------------------------------------------------------ choosing a place */
  let active = null, routeAt = 0, hoverTimer = 0;
  function select(p, { fly = true, announce = true } = {}) {
    if (active === p) { if (fly) flyTo(viewFor(p)); return; }
    active = p;
    places.forEach(q => { q.row.classList.toggle('is-active', q === p); q.pin.classList.toggle('is-active', q === p); });
    routeAt = performance.now();
    if (fly) flyTo(viewFor(p));
    if (announce) say(T().now(title(p)));
    updateReadout();
    frame();
  }
  function clearSelection() {
    if (!active) return;
    active = null;
    places.forEach(q => { q.row.classList.remove('is-active'); q.pin.classList.remove('is-active'); });
    flyTo(worldView());
    say(T().whole);
    updateReadout();
  }
  function viewFor(p) {
    if (p === home) return fit(boundsOf([p.base, p.base]), 7);
    return fit(boundsOf([home.base, p.base]), 6);
  }

  places.forEach(p => {
    let touchy = false;
    p.row.addEventListener('pointerdown', ev => { touchy = ev.pointerType !== 'mouse'; });
    p.row.addEventListener('pointerenter', ev => {
      if (ev.pointerType !== 'mouse') return;
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => select(p), 110);
    });
    p.row.addEventListener('pointerleave', () => clearTimeout(hoverTimer));
    p.row.addEventListener('focus', () => { if (!touchy) select(p); });
    p.row.addEventListener('click', () => {
      clearTimeout(hoverTimer);
      if (touchy && active !== p) {
        touchy = false;
        if (board.classList.contains('is-open')) toggleSheet(false);
        select(p);
        p.row.scrollIntoView({ block: 'nearest' });
        return;
      }
      touchy = false;
      open(p);
    });
  });

  /* books wake when the pointer comes near; a click opens */
  let awake = null;
  function wake(p) {
    if (awake === p) return;
    if (awake) awake.pin.classList.remove('is-awake');
    awake = p;
    if (p) p.pin.classList.add('is-awake');
  }
  mapEl.addEventListener('pointermove', ev => {
    if (ev.pointerType !== 'mouse' || ev.buttons) return;
    const r = mapEl.getBoundingClientRect();
    const x = ev.clientX - r.left, y = ev.clientY - r.top;
    let best = null, bestD = 26;
    places.forEach(p => {
      const s = p.sc * (p === active ? 1.7 : 1), w = 192 * s, h = 272 * s;
      const dx = Math.max(p.bx - w / 2 - x, 0, x - (p.bx + w / 2));
      const dy = Math.max(p.by - h - y, 0, y - p.by);
      const d = Math.hypot(dx, dy);
      if (d < bestD) { bestD = d; best = p; }
    });
    wake(best);
  });
  mapEl.addEventListener('pointerleave', () => wake(null));
  places.forEach(p => {
    p.bookEl.addEventListener('click', ev => {
      ev.preventDefault();
      if (ev.detail === 0) { open(p); return; }
      if (lastPointer !== 'mouse' && active !== p) { select(p); return; }
      open(p);
    });
  });
  let lastPointer = 'mouse';
  addEventListener('pointerdown', ev => { lastPointer = ev.pointerType; }, true);

  /* ------------------------------------------------------------ drawing */
  let raf = 0;
  function frame() { if (!raf) raf = requestAnimationFrame(() => { raf = 0; draw(); }); }

  function bookScale(k) {
    const base = phone.matches ? 0.17 : 0.25;
    return Math.max(base, Math.min(base * 1.8, base * Math.pow(k, 0.3)));
  }
  function layoutBooks() {
    const s = bookScale(tr.k);
    const w = 192 * s, h = 272 * s, m = 6;
    places.forEach(p => {
      p.ax = tr.applyX(p.base[0]); p.ay = tr.applyY(p.base[1]);
      p.bx = p.ax; p.by = p.ay - 7; p.sc = s;
    });
    // books stand aside for each other; the chosen one stays put and the rest make room for it
    places.forEach(p => { const f = p === active ? 1.7 : 1; p.hw = (w * f + m) / 2; p.hh = (h * f + m) / 2; });
    for (let it = 0; it < 30; it++) {
      let moved = false;
      for (let i = 0; i < places.length; i++) {
        for (let j = i + 1; j < places.length; j++) {
          const a = places[i], b = places[j];
          const dx = b.bx - a.bx, dy = (b.by - b.hh) - (a.by - a.hh);
          const ox = a.hw + b.hw - Math.abs(dx), oy = a.hh + b.hh - Math.abs(dy);
          if (ox <= 0 || oy <= 0) continue;
          moved = true;
          const fa = a === active ? 0 : (b === active ? 1 : 0.5), fb = 1 - fa;
          if (ox < oy * 1.4) {
            const dir = dx > 0 || (dx === 0 && a.i < b.i) ? 1 : -1;
            a.bx -= dir * (ox + 0.5) * fa; b.bx += dir * (ox + 0.5) * fb;
          } else {
            const dir = dy >= 0 ? 1 : -1;
            a.by -= dir * (oy + 0.5) * fa; b.by += dir * (oy + 0.5) * fb;
          }
        }
      }
      if (!moved) break;
    }
    places.forEach(p => {
      const st = p.pin.style;
      st.setProperty('--x', p.bx.toFixed(1));
      st.setProperty('--y', p.by.toFixed(1));
      st.setProperty('--s', s.toFixed(3));
      st.setProperty('--z', String(Math.round(p.by)));
    });
  }

  function graticule() {
    const pxDeg = tr.k * BW / 360;
    const steps = [30, 15, 10, 5, 2, 1, 0.5, 0.25, 0.1, 0.05, 0.02];
    let step = steps[0];
    for (const s of steps) { if (s * pxDeg >= 80) step = s; }
    const lon0 = (0 - tr.x) / tr.k / BW * 360 - 180, lon1 = (Wd - tr.x) / tr.k / BW * 360 - 180;
    const lat0 = 90 - (0 - tr.y) / tr.k / BH * 180, lat1 = 90 - (Hd - tr.y) / tr.k / BH * 180;
    const X = lon => Math.round(tr.applyX((lon + 180) / 360 * BW)) + 0.5;
    const Y = lat => Math.round(tr.applyY((90 - lat) / 180 * BH)) + 0.5;
    const major = v => Math.abs(v) < 1e-9 || Math.abs(Math.round(v / (step * 3)) * step * 3 - v) < 1e-9;
    const dec = step < 0.1 ? 2 : step < 1 ? (step < 0.5 ? 2 : 1) : 0;
    const lons = [], lats = [];
    for (let v = Math.ceil(Math.max(-180, lon0) / step) * step; v <= Math.min(180, lon1); v += step) lons.push(+v.toFixed(4));
    for (let v = Math.ceil(Math.max(-90, lat1) / step) * step; v <= Math.min(90, lat0); v += step) lats.push(+v.toFixed(4));
    ctx.lineWidth = 1;
    ctx.strokeStyle = C.ink;
    lons.forEach(v => { ctx.globalAlpha = major(v) ? 0.16 : 0.08; ctx.beginPath(); ctx.moveTo(X(v), 0); ctx.lineTo(X(v), Hd); ctx.stroke(); });
    lats.forEach(v => { ctx.globalAlpha = major(v) ? 0.16 : 0.08; ctx.beginPath(); ctx.moveTo(0, Y(v)); ctx.lineTo(Wd, Y(v)); ctx.stroke(); });
    ctx.globalAlpha = 1;
    return { lons, lats, X, Y, dec };
  }
  const fmtLon = (v, dec) => (Math.abs(v) < 1e-9 ? '0°' : `${Math.abs(v).toFixed(dec)}°${v > 0 ? 'E' : 'W'}`);
  const fmtLat = (v, dec) => (Math.abs(v) < 1e-9 ? '0°' : `${Math.abs(v).toFixed(dec)}°${v > 0 ? 'N' : 'S'}`);

  function edgeLabels(g) {
    const keep = [];
    if (!rects.board) measure();
    const b = rects.board, d = rects.dock, tp = compact.matches ? 56 : 0;
    const clear = (x, y, w, h) => ![b, d].some(r => x < r.right + 4 && x + w > r.left - 4 && y < r.bottom + 4 && y + h > r.top - 4);
    ctx.font = '500 10px "Fira Sans", system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    const yBottom = compact.matches ? tp + 8 : Hd - 10;
    const ax = active ? active.ax : -1e9, ay = active ? active.ay : -1e9;
    let lastRight = -1e9;
    g.lons.forEach(v => {
      const x = g.X(v), s = fmtLon(v, g.dec), w = ctx.measureText(s).width + 8;
      if (x < 8 || x > Wd - 40 || x - w / 2 < lastRight + 8 || Math.abs(x - ax) < w + 30 || !clear(x - w / 2, yBottom - 8, w, 16)) return;
      lastRight = x + w / 2;
      keep.push(['lon', x, yBottom, s, w]);
    });
    g.lats.forEach(v => {
      const y = g.Y(v), s = fmtLat(v, g.dec), w = ctx.measureText(s).width + 8;
      if (y < 60 || y > Hd - 24 || Math.abs(y - ay) < 20 || !clear(Wd - w - 6, y - 8, w + 6, 16)) return;
      keep.push(['lat', Wd - 6, y, s, w]);
    });
    keep.forEach(([kind, x, y, s, w]) => {
      ctx.fillStyle = C.sea; ctx.globalAlpha = 0.9;
      if (kind === 'lon') ctx.fillRect(x - w / 2, y - 7, w, 14); else ctx.fillRect(x - w, y - 7, w, 14);
      ctx.globalAlpha = 1; ctx.fillStyle = C.ink3;
      ctx.textAlign = kind === 'lon' ? 'center' : 'right';
      ctx.fillText(s, kind === 'lon' ? x : x - 4, y);
      ctx.strokeStyle = C.ink; ctx.globalAlpha = 0.45; ctx.beginPath();
      if (kind === 'lon') { const ty = compact.matches ? y - 8 : y + 7; ctx.moveTo(x, ty); ctx.lineTo(x, compact.matches ? ty - 5 : ty + 5); } else { ctx.moveTo(Wd, y); ctx.lineTo(Wd - 5, y); }
      ctx.stroke(); ctx.globalAlpha = 1;
    });
  }

  function route(now) {
    if (!active || active === home) return false;
    const interp = d3.geoInterpolate([home.ll[1], home.ll[0]], [active.ll[1], active.ll[0]]);
    const total = reduce.matches ? 1 : Math.min(1, (now - routeAt) / 900);
    const e = 1 - Math.pow(2, -10 * total);
    const n = 96, upto = Math.max(1, Math.round(n * e));
    const segs = [[]];
    let prev = null;
    for (let i = 0; i <= upto; i++) {
      const pt = proj(interp(i / n));
      const sx = tr.applyX(pt[0]), sy = tr.applyY(pt[1]);
      if (prev && Math.abs(sx - prev[0]) > (BW * tr.k) / 2) segs.push([]);
      segs[segs.length - 1].push([sx, sy]);
      prev = [sx, sy];
    }
    const stroke = (wdt, col, a) => {
      ctx.lineWidth = wdt; ctx.strokeStyle = col; ctx.globalAlpha = a; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      segs.forEach(sg => { if (sg.length < 2) return; ctx.beginPath(); sg.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); });
    };
    stroke(5, C.ink, 0.85);
    stroke(3, C.signal, 1);
    ctx.globalAlpha = 1; ctx.lineCap = 'butt';
    return total < 1;
  }

  function drawTrail(now) {
    while (trail.length && now - trail[0].t > TRAIL_MS) trail.shift();
    if (trail.length < 2) return trail.length > 0;
    ctx.lineWidth = 1.5; ctx.strokeStyle = C.ink; ctx.lineCap = 'round';
    for (let i = 1; i < trail.length; i++) {
      const a = trail[i - 1], b = trail[i];
      const age = (now - b.t) / TRAIL_MS;
      ctx.globalAlpha = 0.32 * (1 - age);
      ctx.setLineDash([2, 4]);
      ctx.beginPath(); ctx.moveTo(tr.applyX(a.x), tr.applyY(a.y)); ctx.lineTo(tr.applyX(b.x), tr.applyY(b.y)); ctx.stroke();
    }
    ctx.setLineDash([]); ctx.globalAlpha = 1; ctx.lineCap = 'butt';
    return true;
  }

  function marks() {
    // photograph locations, once the map is close enough to tell them apart
    if (tr.k > 9) {
      ctx.strokeStyle = C.ink; ctx.globalAlpha = Math.min(0.6, (tr.k - 9) / 8); ctx.lineWidth = 1;
      slideMarks.forEach(([bx, by]) => {
        const x = Math.round(tr.applyX(bx)) + 0.5, y = Math.round(tr.applyY(by)) + 0.5;
        if (x < -5 || y < -5 || x > Wd + 5 || y > Hd + 5) return;
        ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y); ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4); ctx.stroke();
      });
      ctx.globalAlpha = 1;
    }
    // leader lines from a place to its book when the book had to stand aside
    ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.globalAlpha = 0.5;
    places.forEach(p => {
      if (Math.hypot(p.bx - p.ax, p.by + 7 - p.ay) < 3) return;
      ctx.beginPath(); ctx.moveTo(p.ax, p.ay); ctx.lineTo(p.bx, p.by); ctx.stroke();
    });
    ctx.globalAlpha = 1;
    // the places
    places.forEach(p => {
      const x = Math.round(p.ax), y = Math.round(p.ay);
      if (p === active) return;
      ctx.fillStyle = C.ink; ctx.fillRect(x - 3, y - 3, 6, 6);
    });
    // home base
    const hx = Math.round(home.ax), hy = Math.round(home.ay);
    ctx.strokeStyle = C.ink; ctx.lineWidth = 1.25;
    ctx.strokeRect(hx - 7.5, hy - 7.5, 15, 15);
    ctx.font = '600 11px "Fira Sans", system-ui, sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const word = T().homeBase;
    const label = `TPE  ${word}`;
    ctx.font = '600 11px "Fira Sans", "Noto Sans TC", system-ui, sans-serif';
    const lw = ctx.measureText(label).width + 10;
    const lx = hx + 12, ly = hy + 14;
    ctx.fillStyle = C.ink; ctx.fillRect(lx, ly - 8, lw, 16);
    ctx.fillStyle = C.panel; ctx.fillText(label, lx + 5, ly + 0.5);
    // the chosen place, measured against the graticule
    if (active) {
      const x = Math.round(active.ax) + 0.5, y = Math.round(active.ay) + 0.5;
      ctx.strokeStyle = C.ink; ctx.globalAlpha = 0.45; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(Wd, y); ctx.moveTo(x, y); ctx.lineTo(x, compact.matches ? 56 : Hd); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 1;
      ctx.fillStyle = C.signal; ctx.fillRect(x - 6.5, y - 6.5, 13, 13);
      ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5; ctx.strokeRect(x - 6.5, y - 6.5, 13, 13);
      // the edge readings
      ctx.font = '600 10px "Fira Sans", system-ui, sans-serif'; ctx.textBaseline = 'middle';
      const sLat = fmtLat(active.ll[0], 2), sLon = fmtLon(active.ll[1], 2);
      const wLat = ctx.measureText(sLat).width + 10, wLon = ctx.measureText(sLon).width + 10;
      const ey = compact.matches ? 64 : Hd - 10;
      ctx.fillStyle = C.signal; ctx.fillRect(Wd - wLat - 6, y - 8, wLat, 16); ctx.fillRect(x - wLon / 2, ey - 8, wLon, 16);
      ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.strokeRect(Wd - wLat - 6 + 0.5, y - 7.5, wLat - 1, 15); ctx.strokeRect(x - wLon / 2 + 0.5, ey - 7.5, wLon - 1, 15);
      ctx.fillStyle = C.ink; ctx.textAlign = 'right'; ctx.fillText(sLat, Wd - 11, y + 0.5);
      ctx.textAlign = 'center'; ctx.fillText(sLon, x, ey + 0.5);
    }
  }

  function draw() {
    if (!shapes) return;
    const now = performance.now();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = C.sea; ctx.fillRect(0, 0, Wd, Hd);
    const P = tr.k > 3.2 && shapesFine ? shapesFine : shapes;
    ctx.setTransform(dpr * tr.k, 0, 0, dpr * tr.k, dpr * tr.x, dpr * tr.y);
    ctx.fillStyle = C.land; ctx.fill(P.land);
    ctx.fillStyle = C.been; ctx.fill(P.been); ctx.fill(P.home);
    if (hatch) { hatch.setTransform(new DOMMatrix().scale(1 / (dpr * tr.k))); ctx.fillStyle = hatch; ctx.fill(P.been); }
    ctx.lineWidth = 0.75 / tr.k; ctx.strokeStyle = C.coast; ctx.globalAlpha = 0.55; ctx.stroke(P.borders);
    ctx.globalAlpha = 1; ctx.lineWidth = 1 / tr.k; ctx.stroke(P.coast);
    ctx.strokeStyle = C.ink; ctx.globalAlpha = 0.55; ctx.lineWidth = 1 / tr.k; ctx.stroke(P.been); ctx.stroke(P.home);
    ctx.globalAlpha = 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = graticule();
    layoutBooks();
    const moreTrail = drawTrail(now);
    const moreRoute = route(now);
    marks();
    edgeLabels(g);
    if (!phone.matches || !active) updateReadout();
    if (moreTrail || moreRoute) frame();
  }

  function updateReadout() {
    const t = T();
    if (active) {
      readout.classList.add('is-active');
      readout.innerHTML = `<b>${esc(title(active))}</b>&nbsp; ${esc(t.lat(active.ll[0]))}&nbsp; ${esc(t.lng(active.ll[1]))}`;
    } else {
      readout.classList.remove('is-active');
      const a = freeArea();
      const [lat, lng] = fromBase((a.x + a.w / 2 - tr.x) / tr.k, (a.y + a.h / 2 - tr.y) / tr.k);
      readout.textContent = `${t.centre}  ${t.lat(Math.max(-90, Math.min(90, lat)))}  ${t.lng(((lng + 540) % 360) - 180)}`;
    }
  }

  /* ------------------------------------------------------------ controls */
  const centre = () => { const a = freeArea(); return [a.x + a.w / 2, a.y + a.h / 2]; };
  const ease = sel => (reduce.matches ? sel : sel.transition().duration(420).ease(d3.easeExpOut));
  $('#zoom-in').addEventListener('click', () => zoom.scaleBy(ease(mapSel), 1.8, centre()));
  $('#zoom-out').addEventListener('click', () => zoom.scaleBy(ease(mapSel), 1 / 1.8, centre()));
  $('#zoom-world').addEventListener('click', () => { if (active) clearSelection(); else { flyTo(worldView()); say(T().whole); } });
  mapEl.addEventListener('keydown', ev => {
    const step = 90;
    const moves = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (moves[ev.key]) { ev.preventDefault(); zoom.translateBy(ease(mapSel), moves[ev.key][0] / tr.k, moves[ev.key][1] / tr.k); }
    else if (ev.key === '+' || ev.key === '=') { ev.preventDefault(); zoom.scaleBy(ease(mapSel), 1.8, centre()); }
    else if (ev.key === '-' || ev.key === '_') { ev.preventDefault(); zoom.scaleBy(ease(mapSel), 1 / 1.8, centre()); }
    else if (ev.key === '0') { ev.preventDefault(); flyTo(worldView()); }
  });

  function toggleSheet(force) {
    const on = typeof force === 'boolean' ? force : !board.classList.contains('is-open');
    board.classList.toggle('is-open', on);
    sheetBtn.setAttribute('aria-expanded', String(on));
    sheetBtn.textContent = on ? T().showLess : T().showAll;
    setTimeout(() => { measure(); frame(); }, 460);
  }
  sheetBtn.addEventListener('click', () => toggleSheet());

  /* ------------------------------------------------------------ the opened page */
  let openP = null, pushed = false, busy = false, viewerList = [], viewerIdx = 0;
  const slideImg = (s, sizes, lazy = true) => `<img src="../images/web/1280/${esc(s.file)}" srcset="../images/web/640/${esc(s.file)} 640w, ../images/web/1280/${esc(s.file)} 1280w, ../images/web/${esc(s.file)} ${s.w}w" sizes="${sizes}" width="${s.w}" height="${s.h}" alt="" data-alt="${esc(s.id)}"${lazy ? ' loading="lazy"' : ''} decoding="async">`;

  function renderPage(p) {
    page.classList.toggle('is-guide', !!p.guide);
    if (p.guide) {
      pageBody.innerHTML = `<div class="guide">${p.guide.html}</div>`;
      const meta = $('.meta', pageBody);
      if (meta) meta.insertAdjacentHTML('afterend', '<p class="facts" data-gf></p>');
      const h1 = $('h1', pageBody); if (h1) h1.id = 'page-title';
      viewerList = Array.from(new Set($$('[data-slide]', pageBody).map(a => a.dataset.slide))).filter(id => S.slides[id]);
    } else {
      const c = p.country;
      const ids = c.photos.filter(id => S.slides[id]);
      viewerList = ids;
      const rows = [];
      let rowNow = [], sum = 0;
      ids.forEach(id => {
        const s = S.slides[id], ar = s.w / s.h;
        if (rowNow.length && (sum + ar > 3.3 || rowNow.length === 3)) { rows.push(rowNow); rowNow = []; sum = 0; }
        rowNow.push(id); sum += ar;
      });
      if (rowNow.length) rows.push(rowNow);
      const fig = id => {
        const s = S.slides[id];
        return `<figure class="piece" data-ar="${(s.w / s.h).toFixed(4)}"><a href="#" data-slide="${esc(id)}">${slideImg({ ...s, id }, '(max-width: 47.99rem) 92vw, 40rem')}</a>`
          + `<figcaption><b data-sp="${esc(id)}"></b><span class="where" data-sw="${esc(id)}"></span></figcaption></figure>`;
      };
      pageBody.innerHTML = '<article class="place"><h1 id="page-title" data-pt="name"></h1><p class="place__line" data-pt="note"></p>'
        + '<ul class="place__facts"><li><span data-pt="travelled"></span> <b data-pt="date"></b></li><li data-pt="count"></li><li data-pt="guideNot"></li></ul>'
        + (ids.length ? rows.map(r => `<div class="shots">${r.map(fig).join('')}</div>`).join('') : '<p class="place__empty" data-pt="none"></p>')
        + '</article>';
      $$('[data-ar]', pageBody).forEach(f => f.style.setProperty('--ar', f.dataset.ar));
    }
    fillPage(p);
  }
  function fillPage(p) {
    const t = T();
    pageWhere.textContent = `${title(p)}  ${p.country.date[lang]}`;
    if (p.guide) {
      const g = p.guide, d = g.i18n[lang] || g.i18n.en;
      $$('[data-i18n]', pageBody).forEach(el => { const v = d[el.dataset.i18n]; if (v != null) el.textContent = v; });
      $$('[data-i18n-html]', pageBody).forEach(el => { const v = d[el.dataset.i18nHtml]; if (v != null) el.innerHTML = v; });
      $$('[data-i18n-alt]', pageBody).forEach(el => { const v = d[el.dataset.i18nAlt]; if (v != null) el.alt = v; });
      $$('[data-i18n-aria]', pageBody).forEach(el => { const v = d[el.dataset.i18nAria]; if (v != null) el.setAttribute('aria-label', v); });
      const f = $('[data-gf]', pageBody); if (f) f.textContent = g.facts[lang];
    } else {
      const c = p.country;
      const set = (k, v) => { const el = $(`[data-pt="${k}"]`, pageBody); if (el) el.textContent = v; };
      set('name', c.name[lang]); set('note', c.note[lang]); set('travelled', t.travelled); set('date', c.date[lang]);
      set('count', t.count(c.photos.length)); set('guideNot', S.i18n[lang].bookNot); set('none', S.i18n[lang].bandNone);
      $$('[data-sp]', pageBody).forEach(el => { el.textContent = S.slides[el.dataset.sp].place[lang]; });
      $$('[data-sw]', pageBody).forEach(el => { el.textContent = S.slides[el.dataset.sw].where[lang]; });
      $$('img[data-alt]', pageBody).forEach(el => { el.alt = S.slides[el.dataset.alt].alt[lang]; });
      $$('a[data-slide]', pageBody).forEach(a => { const s = S.slides[a.dataset.slide]; a.setAttribute('aria-label', lang === 'zh' ? `${s.place.zh}：放大看` : `${s.place.en}: see it larger`); });
    }
  }

  const setClip = (r) => {
    const st = page.style;
    st.setProperty('--ct', `${Math.max(0, r.top)}px`); st.setProperty('--cl', `${Math.max(0, r.left)}px`);
    st.setProperty('--cr', `${Math.max(0, Wd - r.right)}px`); st.setProperty('--cb', `${Math.max(0, Hd - r.bottom)}px`);
  };
  const clipFull = () => setClip({ top: 0, left: 0, right: Wd, bottom: Hd });
  const visibleRect = r => r.width > 4 && r.right > 0 && r.bottom > 0 && r.left < Wd && r.top < Hd;
  const leafRect = p => p.pin.querySelector('.book__leaf').getBoundingClientRect();
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const setInert = on => { [hall, top].forEach(el => { el.inert = on; }); };

  async function open(p, { push = true, animate = true } = {}) {
    if (openP || busy) return;
    busy = true; openP = p;
    if (push) { history.pushState({ place: p.id }, '', p.hash); pushed = true; }
    if (active !== p) select(p, { fly: false, announce: false });
    renderPage(p);
    pageScroll.scrollTop = 0;
    const r0 = leafRect(p);
    const motion = animate && !reduce.matches && visibleRect(r0);
    if (motion) {
      await wait(p.pin.classList.contains('is-active') ? 60 : 280);
      const r = leafRect(p);
      p.pin.classList.add('is-opening');
      await wait(170);
      page.classList.add('is-small');
      setClip(r);
      page.hidden = false;
      void page.offsetWidth;
      page.classList.add('is-growing');
      page.classList.remove('is-small');
      clipFull();
      await wait(740);
      page.classList.remove('is-growing');
    } else {
      clipFull();
      page.classList.add('is-fading', 'is-faded');
      page.hidden = false;
      void page.offsetWidth;
      page.classList.remove('is-faded');
      await wait(260);
      page.classList.remove('is-fading');
      p.pin.classList.add('is-opening');
    }
    setInert(true);
    document.body.classList.add('is-reading');
    const h = $('#page-title'); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
    say(T().opened(title(p)));
    busy = false;
    if (pendingClose) { pendingClose = false; close({ fromPop: true }); }
  }

  let pendingClose = false;
  async function close({ fromPop = false } = {}) {
    if (!openP) return;
    if (busy) { if (fromPop) pendingClose = true; return; }
    if (!viewer.hidden) closeViewer();
    if (!fromPop && pushed) { history.back(); return; }
    if (!fromPop) { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* ignore */ } }
    busy = true;
    const p = openP;
    pushed = false;
    setInert(false);
    const r = leafRect(p);
    if (!reduce.matches && visibleRect(r)) {
      page.classList.add('is-small');
      page.classList.add('is-growing');
      setClip(r);
      await wait(700);
      page.hidden = true;
      page.classList.remove('is-growing', 'is-small');
      p.pin.classList.remove('is-opening');
    } else {
      page.classList.add('is-fading');
      page.classList.add('is-faded');
      await wait(240);
      page.hidden = true;
      page.classList.remove('is-fading', 'is-faded');
      p.pin.classList.remove('is-opening');
    }
    openP = null;
    document.body.classList.remove('is-reading');
    pageBody.innerHTML = '';
    p.row.focus({ preventScroll: false });
    say(T().closed);
    busy = false;
  }
  $('#page-back').addEventListener('click', () => close());
  page.addEventListener('click', ev => {
    if (ev.target.closest('[data-close]')) { close(); return; }
    const a = ev.target.closest('a');
    if (!a) return;
    if (a.dataset.slide) { ev.preventDefault(); openViewer(a.dataset.slide); return; }
    const href = a.getAttribute('href') || '';
    if (href.startsWith('#')) {
      ev.preventDefault();
      const target = href.length > 1 && pageBody.querySelector(`[id="${CSS.escape(href.slice(1))}"]`);
      if (target) { target.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' }); target.tabIndex = -1; target.focus({ preventScroll: true }); }
    }
  });

  addEventListener('popstate', () => {
    const p = byHash(location.hash);
    if (p && !openP) { pushed = false; open(p, { push: false }); }
    else if (!p && openP) close({ fromPop: true });
  });

  /* ------------------------------------------------------------ the photograph, larger */
  function fillViewer() {
    const id = viewerList[viewerIdx], s = S.slides[id];
    if (!s) return;
    const t = T();
    const box = $('#viewer-img');
    let img = box.querySelector('img');
    if (!img) { img = document.createElement('img'); img.decoding = 'async'; box.appendChild(img); }
    img.src = `../images/web/1280/${s.file}`;
    img.srcset = `../images/web/1280/${s.file} 1280w, ../images/web/${s.file} ${s.w}w`;
    img.sizes = phone.matches ? '100vw' : 'calc(100vw - 22rem)';
    img.width = s.w; img.height = s.h;
    img.alt = s.alt[lang];
    $('#viewer-name').textContent = s.place[lang];
    $('#viewer-where').textContent = s.where[lang];
    const rows = [['camera', s.camera], ['lens', s.lens], ['focal', s.focal], ['aperture', s.aperture], ['shutter', s.shutter], ['iso', s.iso]].filter(r => r[1]);
    if (s.best) rows.push(['best', s.best[lang]]);
    $('#viewer-data').innerHTML = rows.map(([k, v]) => `<dt>${esc(t[k])}</dt><dd>${esc(v)}</dd>`).join('');
    $('#viewer-prev').hidden = $('#viewer-next').hidden = viewerList.length < 2;
  }
  let viewerReturn = null;
  function openViewer(id) {
    viewerIdx = Math.max(0, viewerList.indexOf(id));
    if (viewerList.indexOf(id) < 0) { viewerList = [id]; viewerIdx = 0; }
    viewerReturn = document.activeElement;
    fillViewer();
    viewer.hidden = false;
    page.inert = true;
    $('#viewer-close').focus();
  }
  function closeViewer() {
    viewer.hidden = true;
    page.inert = false;
    if (viewerReturn) viewerReturn.focus({ preventScroll: true });
  }
  const step = d => { viewerIdx = (viewerIdx + d + viewerList.length) % viewerList.length; fillViewer(); };
  $('#viewer-close').addEventListener('click', closeViewer);
  $('#viewer-prev').addEventListener('click', () => step(-1));
  $('#viewer-next').addEventListener('click', () => step(1));

  addEventListener('keydown', ev => {
    if (ev.key === 'Escape') {
      if (!viewer.hidden) { closeViewer(); return; }
      if (openP) { close(); return; }
      if (board.classList.contains('is-open')) { toggleSheet(false); return; }
      if (active) clearSelection();
    } else if (!viewer.hidden && (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight')) {
      step(ev.key === 'ArrowLeft' ? -1 : 1);
    }
  });

  /* ------------------------------------------------------------ start */
  function resize() {
    sizeCanvas();
    measure();
    if (!started) return;
    const t = active ? viewFor(active) : worldView();
    mapSel.call(zoom.transform, t);
    draw();
  }
  let started = false;
  addEventListener('resize', () => { clearTimeout(resize.t); resize.t = setTimeout(resize, 120); });

  sizeCanvas();
  applyLang(false);
  // the board starts blank, then the flaps turn to the departures
  if (!reduce.matches) {
    titleFlaps.set('', false); places.forEach(p => { p.fDate.set('', false); p.fDest.set('', false); p.fRem.set('', false); });
  }

  if (!reduce.matches) requestAnimationFrame(() => applyLang(true));
  const p0 = byHash(location.hash);
  if (p0) select(p0, { fly: false, announce: false });
  fetch('../vendor/countries-110m.json').then(r => r.json()).then(topo => {
    shapes = buildShapes(topo);
    started = true;
    mapSel.call(zoom.transform, p0 ? viewFor(p0) : worldView());
    draw();
    if (p0) open(p0, { push: false, animate: false });
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { measure(); if (!userMoved && !active) mapSel.call(zoom.transform, worldView()); draw(); });
    const later = window.requestIdleCallback || (f => setTimeout(f, 600));
    later(() => fetch('../vendor/countries-50m.json').then(r => r.json()).then(t50 => { shapesFine = buildShapes(t50); frame(); }));
  }).catch(err => { console.error('map', err); if (p0) open(p0, { push: false, animate: false }); });
})();

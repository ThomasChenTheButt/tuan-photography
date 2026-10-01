/* tuan photography 陳亮元, design 2 "Saved places".
   The home page is a map. His sixteen countries carry his books, standing like pins; his
   photographs are saved places that appear as you zoom in. A book opens into a full page.
   Everything here is local: the map is Natural Earth drawn on a canvas, moved by d3-zoom. */
(() => {
  'use strict';

  const S = window.SITE;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const PHONE = matchMedia('(max-width: 47.99rem)');
  const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // data keeps a few typographic dashes (a date range, a price range); the page shows none
  const clean = s => String(s).replace(/(\d)\s*[–—]\s*(\d)/g, '$1-$2').replace(/\s+[–—]\s+/g, ', ').replace(/[–—]/g, '-');

  /* ------------------------------------------------------------ words, both languages */

  const WORDS = {
    where: { en: 'Where to?', zh: '想去哪裡？' },
    searchLabel: { en: 'Search his places', zh: '搜尋他去過的地方' },
    list: { en: 'List', zh: '列表' },
    mapLabel: { en: 'Map of the places he has photographed', zh: '他拍過的地方地圖' },
    mapHint: { en: 'Drag or use the arrow keys to move the map. Scroll, or press plus and minus, to zoom.', zh: '拖曳或用方向鍵移動地圖；捲動，或按加號、減號縮放。' },
    zoomGroup: { en: 'Zoom', zh: '縮放' },
    zoomIn: { en: 'Zoom in', zh: '放大' },
    zoomOut: { en: 'Zoom out', zh: '縮小' },
    world: { en: 'Whole map', zh: '整張地圖' },
    credit: { en: 'Map data: Natural Earth', zh: '地圖資料：Natural Earth' },
    siteLabel: { en: 'Site', zh: '網站' },
    langLabel: { en: 'Language', zh: '語言' },
    saved: { en: 'Saved places', zh: '收藏的地方' },
    savedSub: { en: n => `${n} countries he has travelled and photographed`, zh: n => `他去過、拍過的 ${n} 個國家` },
    results: { en: 'Places and photographs', zh: '地方與照片' },
    noMatch: { en: q => `Nothing saved matches “${q}”. Try a country or a city.`, zh: q => `沒有符合「${q}」的地方，試試國家或城市名。` },
    nPhotos: { en: n => (n === 1 ? '1 photograph' : `${n} photographs`), zh: n => `${n} 張照片` },
    openBook: { en: 'Open the book', zh: '翻開這本書' },
    seeLarger: { en: 'See it larger', zh: '看大圖' },
    camera: { en: 'Camera', zh: '相機' },
    lens: { en: 'Lens', zh: '鏡頭' },
    settings: { en: 'Settings', zh: '參數' },
    openMaps: { en: 'Open in Google Maps', zh: '在 Google 地圖開啟' },
    photosHere: { en: n => `${n} photographs here`, zh: n => `這裡有 ${n} 張照片` },
    pickOne: { en: 'Choose one to see where and how it was made.', zh: '選一張，看它在哪裡、怎麼拍的。' },
    prev: { en: 'Previous', zh: '上一張' },
    next: { en: 'Next', zh: '下一張' },
    countOf: { en: (i, n) => `${i} of ${n}`, zh: (i, n) => `第 ${i} 張，共 ${n} 張` },
    km: { en: 'km', zh: '公里' },
    m: { en: 'm', zh: '公尺' },
    photoOf: { en: 'Photograph', zh: '照片' },
    countryKind: { en: 'Country', zh: '國家' },
    endLine: { en: 'Every photograph here is his own, made on the trip.', zh: '這裡每張照片都是他自己在旅途中拍的。' },
    made: { en: p => `${p}: how this was made`, zh: p => `${p}：這張怎麼拍` },
    bookAria: { en: (t, s) => `${t}: ${s}`, zh: (t, s) => `${t}：${s}` },
  };
  const MAPWORDS = [
    // oceans and seas (public names), shown in a zoom band; continents when far out
    { ll: [28, -42], en: 'Atlantic Ocean', zh: '大西洋', kind: 'ocean', min: 0, max: 9 },
    { ll: [12, -150], en: 'Pacific Ocean', zh: '太平洋', kind: 'ocean', min: 0, max: 9 },
    { ll: [8, 165], en: 'Pacific Ocean', zh: '太平洋', kind: 'ocean', min: 0, max: 9 },
    { ll: [-22, 78], en: 'Indian Ocean', zh: '印度洋', kind: 'ocean', min: 0, max: 9 },
    { ll: [35.2, 18.5], en: 'Mediterranean Sea', zh: '地中海', kind: 'sea', min: 2.4, max: 40 },
    { ll: [13, 114], en: 'South China Sea', zh: '南海', kind: 'sea', min: 2.4, max: 40 },
    { ll: [28.6, 126], en: 'East China Sea', zh: '東海', kind: 'sea', min: 4.5, max: 60 },
    { ll: [19, 133], en: 'Philippine Sea', zh: '菲律賓海', kind: 'sea', min: 2.4, max: 40 },
    { ll: [14.5, 64], en: 'Arabian Sea', zh: '阿拉伯海', kind: 'sea', min: 2.4, max: 40 },
    { ll: [14.5, 88.5], en: 'Bay of Bengal', zh: '孟加拉灣', kind: 'sea', min: 2.4, max: 40 },
    { ll: [-39, 160], en: 'Tasman Sea', zh: '塔斯曼海', kind: 'sea', min: 2.4, max: 40 },
    { ll: [-16, 155], en: 'Coral Sea', zh: '珊瑚海', kind: 'sea', min: 2.4, max: 40 },
    { ll: [43.4, 34.2], en: 'Black Sea', zh: '黑海', kind: 'sea', min: 3.5, max: 60 },
    { ll: [56.5, 3.2], en: 'North Sea', zh: '北海', kind: 'sea', min: 5, max: 60 },
    { ll: [58.2, 19.6], en: 'Baltic Sea', zh: '波羅的海', kind: 'sea', min: 4.5, max: 60 },
    { ll: [20.5, 38.4], en: 'Red Sea', zh: '紅海', kind: 'sea', min: 5, max: 60 },
    { ll: [26.6, 51.6], en: 'Persian Gulf', zh: '波斯灣', kind: 'sea', min: 8, max: 80 },
    { ll: [35.6, 123.4], en: 'Yellow Sea', zh: '黃海', kind: 'sea', min: 5, max: 60 },
    { ll: [14.8, -75], en: 'Caribbean Sea', zh: '加勒比海', kind: 'sea', min: 2.4, max: 40 },
    { ll: [25, -90], en: 'Gulf of Mexico', zh: '墨西哥灣', kind: 'sea', min: 2.4, max: 40 },
    { ll: [24.1, 119.4], en: 'Taiwan Strait', zh: '台灣海峽', kind: 'sea', min: 12, max: 120 },
    { ll: [55.5, 30], en: 'Europe', zh: '歐洲', kind: 'land', min: 0, max: 4.2 },
    { ll: [47, 92], en: 'Asia', zh: '亞洲', kind: 'land', min: 0, max: 4.2 },
    { ll: [8, 20], en: 'Africa', zh: '非洲', kind: 'land', min: 0, max: 4.2 },
    { ll: [48, -100], en: 'North America', zh: '北美洲', kind: 'land', min: 0, max: 4.2 },
    { ll: [-12, -60], en: 'South America', zh: '南美洲', kind: 'land', min: 0, max: 4.2 },
    { ll: [-24, 134], en: 'Australia', zh: '澳洲', kind: 'land', min: 0, max: 0 },
  ];

  let lang = 'en';
  try { const v = localStorage.getItem('tlap-lang'); if (v === 'en' || v === 'zh') lang = v; } catch (e) { /* storage blocked */ }
  const qp = new URLSearchParams(location.search).get('lang');
  if (qp === 'en' || qp === 'zh') lang = qp;

  const t = (key, ...args) => {
    const w = WORDS[key];
    if (w) { const v = w[lang]; return typeof v === 'function' ? v(...args) : v; }
    const s = S.i18n[lang][key];
    return s == null ? key : s;
  };
  const L = pair => clean(pair ? (pair[lang] != null ? pair[lang] : pair.en) : '');

  /* ------------------------------------------------------------ the places */

  const ISO = { spain: '724', uk: '826', france: '250', germany: '276', switzerland: '756', taiwan: '158', japan: '392', 'south-korea': '410', 'hong-kong': '344', china: '156', singapore: '702', vietnam: '704', dubai: '784', australia: '036', 'new-zealand': '554', usa: '840' };
  const COUNTRY = Object.fromEntries(S.countries.map(c => [c.id, c]));
  const BOOK_OF = Object.fromEntries(S.books.map(b => [b.country, b]));
  const SLIDES = S.slides;
  const SLIDE_IDS = Object.keys(SLIDES).filter(id => SLIDES[id].ll);
  const BEEN = new Map(Object.entries(ISO).map(([cid, iso]) => [iso, cid]));
  const HOME = S.home;

  const img = (file, size) => `../images/web/${size ? size + '/' : ''}${file}`;
  const bookHash = b => (b.guide ? `guide-${b.guide}` : `place-${b.country}`);
  const bookFromHash = h => {
    const m = /^#(guide|place)-(.+)$/.exec(h || '');
    if (!m) return null;
    const id = decodeURIComponent(m[2]);
    if (m[1] === 'guide') return S.books.find(b => b.guide === id) || null;
    return BOOK_OF[id] || S.books.find(b => b.id === id) || null;
  };
  const bookLL = b => (b.guide && S.guides[b.guide] ? S.guides[b.guide].ll : COUNTRY[b.country].ll);
  const statusOf = b => t(b.status);

  /* ------------------------------------------------------------ the map: projection and shapes */

  const W0 = 1024;
  const proj = d3.geoMercator().scale(W0 / (2 * Math.PI)).translate([W0 / 2, W0 / 2]);
  const Y_TOP = proj([0, 84])[1];
  const Y_BOT = proj([0, -60])[1];
  const K_MAX = 900;
  const K_STICK0 = 9;     // stickers start to appear
  const K_STICK1 = 16;    // fully there
  const COL = {
    water: '#d0e6ee', shore: '#c0dbe6', coast: '#a4bcc6', land: '#faf9f5', been: '#fae8d3', beenHi: '#fbddc1',
    sel: '#fcd3b6', home: '#ffd6bd', homeHi: '#ffccb0', border: '#cac3ba', borderBeen: '#bca695',
    sea: '#3e667a', cont: '#71675d', halo: 'rgba(250,249,245,0.9)', haloWater: 'rgba(208,230,238,0.85)',
  };

  const mapEl = $('#map');
  const canvas = $('#land');
  const ctx = canvas.getContext('2d');
  const hitCtx = document.createElement('canvas').getContext('2d');
  let vw = 0, vh = 0, dpr = 1, kMin = 1;
  let T = d3.zoomIdentity;
  let G110 = null, G50 = null;
  let hoverIso = null, selIso = null;

  function shapes(topo) {
    const obj = topo.objects.countries;
    const feats = topojson.feature(topo, obj).features.filter(f => f.id !== '010');
    const bounds = d3.geoPath(proj);
    const toPath = geo => { const p = new Path2D(); d3.geoPath(proj, p)(geo); return p; };
    return {
      feats: feats.map(f => ({ iso: f.id, cid: BEEN.get(f.id) || null, p: toPath(f), b: bounds.bounds(f) })),
      borders: toPath(topojson.mesh(topo, obj, (a, b) => a !== b)),
      coast: toPath(topojson.mesh(topo, obj, (a, b) => a === b && a.id !== '010')),
    };
  }

  function draw() {
    const k = T.k;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = COL.water;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const G = (G50 && k >= 2.2) ? G50 : (G110 || G50);
    if (!G) return;
    ctx.setTransform(dpr * k, 0, 0, dpr * k, dpr * T.x, dpr * T.y);
    const x0 = -T.x / k, y0 = -T.y / k, x1 = (vw - T.x) / k, y1 = (vh - T.y) / k;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = COL.shore;
    ctx.lineWidth = 5 / k;
    ctx.stroke(G.coast);
    for (const f of G.feats) {
      if (f.b[1][0] < x0 || f.b[0][0] > x1 || f.b[1][1] < y0 || f.b[0][1] > y1) continue;
      let c = COL.land;
      if (f.cid === HOME) c = (f.iso === hoverIso || f.iso === selIso) ? COL.homeHi : COL.home;
      else if (f.cid) c = f.iso === selIso ? COL.sel : f.iso === hoverIso ? COL.beenHi : COL.been;
      ctx.fillStyle = c;
      ctx.fill(f.p);
    }
    ctx.strokeStyle = COL.border;
    ctx.lineWidth = 0.75 / k;
    ctx.stroke(G.borders);
    ctx.strokeStyle = COL.coast;
    ctx.lineWidth = 0.7 / k;
    ctx.stroke(G.coast);
    // the travelled countries get a slightly warmer outline
    ctx.strokeStyle = COL.borderBeen;
    ctx.lineWidth = 0.9 / k;
    for (const f of G.feats) {
      if (!f.cid) continue;
      if (f.b[1][0] < x0 || f.b[0][0] > x1 || f.b[1][1] < y0 || f.b[0][1] > y1) continue;
      ctx.stroke(f.p);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawWords(k);
  }

  function drawWords(k) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const zh = lang === 'zh';
    for (const w of MAPWORDS) {
      if (k < w.min || k > w.max) continue;
      const p = proj([w.ll[1], w.ll[0]]);
      const x = p[0] * k + T.x, y = p[1] * k + T.y;
      if (x < -200 || x > vw + 200 || y < -40 || y > vh + 40) continue;
      const text = zh ? w.zh : w.en.toUpperCase();
      if (w.kind === 'ocean') {
        ctx.font = `500 ${zh ? 15 : 13}px Onest, "Noto Sans TC", sans-serif`;
        ctx.letterSpacing = zh ? '0.5em' : '0.32em';
        ctx.fillStyle = COL.sea;
      } else if (w.kind === 'sea') {
        ctx.font = `500 ${zh ? 13 : 11}px Onest, "Noto Sans TC", sans-serif`;
        ctx.letterSpacing = zh ? '0.3em' : '0.18em';
        ctx.fillStyle = COL.sea;
      } else {
        ctx.font = `600 ${zh ? 14 : 12}px Onest, "Noto Sans TC", sans-serif`;
        ctx.letterSpacing = zh ? '0.6em' : '0.36em';
        ctx.fillStyle = COL.cont;
        ctx.strokeStyle = COL.halo;
        ctx.lineWidth = 3;
        ctx.strokeText(text, x, y);
      }
      ctx.fillText(text, x, y);
    }
    ctx.letterSpacing = '0px';
  }

  function hitCountry(px, py) {
    const G = (G50 && T.k >= 2.2) ? G50 : (G110 || G50);
    if (!G) return null;
    const wx = (px - T.x) / T.k, wy = (py - T.y) / T.k;
    hitCtx.setTransform(1, 0, 0, 1, 0, 0);
    for (const f of G.feats) {
      if (!f.cid) continue;
      if (wx < f.b[0][0] || wx > f.b[1][0] || wy < f.b[0][1] || wy > f.b[1][1]) continue;
      if (hitCtx.isPointInPath(f.p, wx, wy)) return f;
    }
    return null;
  }

  /* ------------------------------------------------------------ zoom */

  const zoom = d3.zoom()
    .scaleExtent([1, K_MAX])
    .on('zoom', e => { T = e.transform; schedule(); });
  const sel = d3.select(mapEl);

  function sizeMap() {
    vw = mapEl.clientWidth; vh = mapEl.clientHeight;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
    kMin = Math.max(vw / W0, vh / (Y_BOT - Y_TOP));
    zoom.scaleExtent([kMin, K_MAX]).translateExtent([[0, Y_TOP], [W0, Y_BOT]]).extent([[0, 0], [vw, vh]]);
  }

  function cardInset() {
    const card = $('#card');
    if (card.hidden) return { l: 0, b: 0 };
    if (PHONE.matches) return { l: 0, b: card.offsetHeight };
    return { l: card.offsetLeft + card.offsetWidth, b: 0 };
  }

  function fitLL(lonlats, opts = {}) {
    const pts = lonlats.map(ll => proj([ll[1], ll[0]]));
    let x0 = d3.min(pts, p => p[0]), x1 = d3.max(pts, p => p[0]);
    let y0 = d3.min(pts, p => p[1]), y1 = d3.max(pts, p => p[1]);
    const inset = opts.inset || cardInset();
    const top = opts.top != null ? opts.top : (PHONE.matches ? 150 : 110) + 80;
    const pad = { l: inset.l + 56, r: 72, t: top, b: inset.b + 92 };
    const aw = Math.max(80, vw - pad.l - pad.r), ah = Math.max(80, vh - pad.t - pad.b);
    let k = Math.min(aw / Math.max(1e-6, x1 - x0), ah / Math.max(1e-6, y1 - y0));
    k = clamp(k, kMin, opts.kMax || 120);
    if (opts.kMin) k = Math.max(k, opts.kMin);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    return d3.zoomIdentity.translate(pad.l + aw / 2 - cx * k, pad.t + ah / 2 - cy * k).scale(k);
  }

  function fly(transform, ms) {
    sel.interrupt();
    if (RM.matches || !ms) sel.call(zoom.transform, transform);
    else sel.transition().duration(ms).ease(d3.easeCubicInOut).call(zoom.transform, transform);
  }

  function homeView() {
    if (PHONE.matches) return fitLL([[46, 97], [-2, 146]], { inset: { l: 0, b: 0 }, top: 150, kMax: 40 });
    return fitLL([[58, -12], [-3, 146]], { inset: { l: 0, b: 0 }, top: 96, kMax: 40 });
  }

  let raf = 0;
  function schedule() { if (!raf) raf = requestAnimationFrame(frame); }
  function frame() {
    raf = 0;
    draw();
    placeStickers();
    placePins();
    scaleBar();
    $('#zoom-in').disabled = T.k >= K_MAX * 0.999;
    $('#zoom-out').disabled = T.k <= kMin * 1.001;
  }

  /* ------------------------------------------------------------ the books, standing on the map */

  const pinsEl = $('#pins');
  const leadersEl = $('#leaders');
  const SVGNS = 'http://www.w3.org/2000/svg';
  const PINS = [];

  function bookMarkup(b) {
    const title = L(b.title);
    const face = b.photo
      ? `<span class="book__face"><img src="${img(SLIDES[b.photo].file, 640)}" alt="" decoding="async" draggable="false">`
      : `<span class="book__face book__face--blank"><b class="js-title">${esc(title)}</b>`;
    return `<span class="book__box">`
      + `<span class="book__spine"><b class="js-title">${esc(title)}</b><i class="js-series">${esc(t('series'))}</i></span>`
      + `${face}<span class="book__band"><b class="js-title">${esc(title)}</b><span class="js-band">${esc(t(b.band))}</span></span></span>`
      + `<span class="book__back"><i class="js-series">${esc(t('series'))}</i></span><span class="book__edge"></span>`
      + `<span class="book__top"></span><span class="book__shadow"></span><span class="book__veil"></span><span class="pin__leaf"></span></span>`;
  }

  function buildPins() {
    S.books.forEach((b, i) => {
      const el = document.createElement('div');
      el.className = 'pin' + (b.country === HOME ? ' pin--home' : '');
      el.dataset.book = b.id;
      el.innerHTML = `<div class="pin__frame"><a class="book book--${b.tone}" href="#${bookHash(b)}" draggable="false">${bookMarkup(b)}</a></div>`
        + `<div class="pin__label" aria-hidden="true"><b class="js-name"></b>${b.country === HOME ? '<span class="pin__home js-home"></span>' : ''}<span class="pin__status js-status"></span></div>`;
      pinsEl.appendChild(el);
      const a = $('a', el);
      const line = document.createElementNS(SVGNS, 'line');
      const dot = document.createElementNS(SVGNS, 'circle');
      dot.setAttribute('r', b.country === HOME ? 5 : 4.5);
      dot.setAttribute('class', b.country === HOME ? 'dot dot--home' : 'dot');
      leadersEl.append(line, dot);
      const ll = bookLL(b);
      const pin = { b, el, a, line, dot, w: proj([ll[1], ll[0]]), i, x: 0, y: 0, ax: 0, ay: 0, labelW: 60 };
      PINS.push(pin);
      a.addEventListener('click', e => { e.preventDefault(); openBook(b.id, { trigger: a }); });
      a.addEventListener('focus', () => { el.classList.add('is-awake'); if (!mapPointerDown) ensureVisible(pin); });
      a.addEventListener('blur', () => el.classList.remove('is-awake'));
      a.addEventListener('mouseenter', () => wake(pin));
      a.addEventListener('mouseleave', () => wake(null));
    });
    paintPins();
  }

  function paintPins() {
    const meas = document.createElement('canvas').getContext('2d');
    meas.font = '600 13px Onest, "Noto Sans TC", sans-serif';
    for (const p of PINS) {
      const b = p.b, title = L(b.title);
      $$('.js-title', p.el).forEach(n => { n.textContent = title; });
      $$('.js-series', p.el).forEach(n => { n.textContent = t('series'); });
      const band = $('.js-band', p.el); if (band) band.textContent = t(b.band);
      const name = L(COUNTRY[b.country].name);
      $('.js-name', p.el).textContent = name;
      const home = $('.js-home', p.el); if (home) home.textContent = t('home');
      $('.js-status', p.el).textContent = statusOf(b);
      p.a.setAttribute('aria-label', t('bookAria', name === title ? title : `${title}, ${name}`, statusOf(b)));
      p.labelW = Math.min(192, meas.measureText(name).width * (lang === 'zh' ? 1.12 : 1)) + 10;
    }
  }

  let awake = null;
  function wake(pin) {
    if (awake === pin) return;
    if (awake && document.activeElement !== awake.a) awake.el.classList.remove('is-awake');
    awake = pin;
    if (pin) pin.el.classList.add('is-awake');
  }

  const bookScale = k => {
    const base = PHONE.matches ? 0.24 : 0.285;
    return clamp(base + 0.05 * Math.log2(Math.max(1, k / 2.5)), base, 0.46);
  };
  const leanOf = k => clamp(26 - 9 * Math.log2(Math.max(1, k / 2.5)), 0, 26);

  let obstacles = [];
  function placePins() {
    const k = T.k, s = bookScale(k), lean = leanOf(k);
    const bw = 192 * s * 1.08, bh = 272 * s * Math.cos(lean * Math.PI / 180) + 4;
    const LIFT = 7;
    for (const p of PINS) {
      p.ax = p.w[0] * k + T.x; p.ay = p.w[1] * k + T.y;
      p.x = p.ax; p.y = p.ay - LIFT;
    }
    // keep books apart (and off the photo stickers): the same start every frame, so no jitter
    const box = p => [p.x - bw / 2, p.y - bh, p.x + bw / 2, p.y + 4];
    const near = PINS.filter(p => p.ax > -300 && p.ax < vw + 300 && p.ay > -300 && p.ay < vh + 400);
    for (let it = 0; it < 28; it++) {
      let moved = false;
      for (let i = 0; i < near.length; i++) {
        const A = near[i];
        for (let j = i + 1; j < near.length; j++) {
          const B = near[j];
          const a = box(A), b = box(B);
          const ox = Math.min(a[2], b[2]) - Math.max(a[0], b[0]);
          const oy = Math.min(a[3], b[3]) - Math.max(a[1], b[1]);
          if (ox <= 0 || oy <= 0) continue;
          moved = true;
          if (ox < oy * 1.6) {
            const d = (A.ax === B.ax ? (A.i < B.i ? -1 : 1) : Math.sign(A.ax - B.ax)) * (ox / 2 + 1);
            A.x += d; B.x -= d;
          } else {
            const d = (A.ay === B.ay ? (A.i < B.i ? -1 : 1) : Math.sign(A.ay - B.ay)) * (oy / 2 + 1);
            A.y += d; B.y -= d;
          }
        }
        for (const o of obstacles) {
          const a = box(A);
          const ox = Math.min(a[2], o[2]) - Math.max(a[0], o[0]);
          const oy = Math.min(a[3], o[3]) - Math.max(a[1], o[1]);
          if (ox <= 0 || oy <= 0) continue;
          moved = true;
          if (oy <= ox) A.y -= oy + 1; else A.x += (A.x >= (o[0] + o[2]) / 2 ? 1 : -1) * (ox + 1);
        }
      }
      if (!moved) break;
    }
    // labels: shown unless they would sit on another book or label (map-label manners)
    const taken = near.map(p => box(p));
    const labels = [];
    for (const p of PINS) {
      const off = Math.hypot(p.x - p.ax, p.y - (p.ay - LIFT)) > 3;
      p.el.style.setProperty('--x', p.x.toFixed(1));
      p.el.style.setProperty('--y', p.y.toFixed(1));
      p.el.style.setProperty('--s', s.toFixed(4));
      p.el.style.setProperty('--lean', lean.toFixed(2) + 'deg');
      p.el.style.setProperty('--z', String(Math.round(p.y) + 2000));
      p.dot.setAttribute('cx', p.ax.toFixed(1));
      p.dot.setAttribute('cy', p.ay.toFixed(1));
      if (off) {
        p.line.setAttribute('x1', p.ax.toFixed(1)); p.line.setAttribute('y1', p.ay.toFixed(1));
        p.line.setAttribute('x2', p.x.toFixed(1)); p.line.setAttribute('y2', (p.y + 2).toFixed(1));
        p.line.removeAttribute('visibility');
      } else p.line.setAttribute('visibility', 'hidden');
      const lw = p.labelW, lh = p.b.country === HOME ? 34 : 18;
      const lb = [p.x - lw / 2, p.y + 9, p.x + lw / 2, p.y + 9 + lh];
      const hit = r => !(r[2] < lb[0] || r[0] > lb[2] || r[3] < lb[1] || r[1] > lb[3]);
      const clash = taken.some(hit) || labels.some(hit) || obstacles.some(hit);
      p.el.classList.toggle('is-quiet', clash);
      if (!clash) labels.push(lb);
    }
  }

  function ensureVisible(pin) {
    const m = 70;
    const x = pin.w[0] * T.k + T.x, y = pin.w[1] * T.k + T.y;
    const inset = cardInset();
    if (x > inset.l + m && x < vw - m && y > 160 && y < vh - inset.b - m) return;
    const tr = d3.zoomIdentity.translate((inset.l + vw) / 2 - pin.w[0] * T.k, (vh - inset.b) / 2 + 60 - pin.w[1] * T.k).scale(T.k);
    fly(tr, 450);
  }

  /* ------------------------------------------------------------ photographs as stickers */

  const stickersEl = $('#stickers');
  const STICK = new Map();
  function buildStickers() {
    for (const id of SLIDE_IDS) {
      const s = SLIDES[id];
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'sticker';
      el.hidden = true;
      el.dataset.id = id;
      el.innerHTML = '<span class="sticker__count" hidden></span><span class="sticker__tip"></span>';
      stickersEl.appendChild(el);
      const st = { id, el, w: proj([s.ll[1], s.ll[0]]), members: [id], loaded: false };
      STICK.set(id, st);
      el.addEventListener('click', () => onSticker(st));
    }
    paintStickers();
  }
  function paintStickers(force) {
    for (const st of STICK.values()) {
      if (!force && st.painted === st.members.length + lang) continue;
      st.painted = st.members.length + lang;
      const name = L(SLIDES[st.id].place);
      $('.sticker__tip', st.el).textContent = st.members.length > 1 ? `${name} +${st.members.length - 1}` : name;
      st.el.setAttribute('aria-label', st.members.length > 1 ? `${name}, ${t('photosHere', st.members.length)}` : `${name}, ${t('photoOf')}`);
    }
  }

  let selSlide = null;
  function placeStickers() {
    const k = T.k;
    const fade = clamp((k - K_STICK0) / (K_STICK1 - K_STICK0), 0, 1);
    obstacles = [];
    if (fade <= 0.02) {
      for (const st of STICK.values()) if (!st.el.hidden) st.el.hidden = true;
      return;
    }
    const R = PHONE.matches ? 44 : 48;
    const pts = SLIDE_IDS.map(id => { const st = STICK.get(id); return { st, x: st.w[0] * k + T.x, y: st.w[1] * k + T.y, used: false }; });
    for (const p of pts) {
      if (p.used) continue;
      p.used = true;
      const members = [p.st.id];
      for (const q of pts) {
        if (q.used) continue;
        if (Math.abs(q.x - p.x) < R && Math.abs(q.y - p.y) < R) { q.used = true; members.push(q.st.id); q.st.lead = false; q.st.el.hidden = true; }
      }
      const st = p.st;
      const onScreen = p.x > -40 && p.x < vw + 40 && p.y > -40 && p.y < vh + 40;
      st.members = members;
      st.lead = true;
      if (!onScreen) { st.el.hidden = true; continue; }
      if (!st.loaded) {
        const im = new Image();
        im.alt = ''; im.decoding = 'async'; im.draggable = false;
        im.src = img(SLIDES[st.id].file, 640);
        st.el.prepend(im);
        st.loaded = true;
      }
      st.el.hidden = false;
      st.el.style.setProperty('--x', p.x.toFixed(1));
      st.el.style.setProperty('--y', p.y.toFixed(1));
      st.el.style.setProperty('--fade', fade.toFixed(2));
      const cnt = $('.sticker__count', st.el);
      cnt.hidden = members.length < 2;
      cnt.textContent = members.length;
      st.el.classList.toggle('is-selected', !!selSlide && members.includes(selSlide));
      obstacles.push([p.x - 26, p.y - 26, p.x + 26, p.y + 26]);
    }
    paintStickers(false);
  }

  function onSticker(st) {
    const ids = st.members.slice();
    if (ids.length === 1) { showPhoto(ids[0], { fly: false }); return; }
    if (T.k < K_MAX / 2) {
      const lls = ids.map(id => SLIDES[id].ll);
      const tr = fitLL(lls, { kMax: K_MAX, kMin: Math.min(K_MAX, T.k * 2) });
      fly(tr, 900);
    } else showCluster(ids);
  }

  /* ------------------------------------------------------------ scale bar */

  function scaleBar() {
    const lat = proj.invert([(vw / 2 - T.x) / T.k, (vh / 2 - T.y) / T.k])[1];
    const mpp = (2 * Math.PI * 6378137 * Math.cos(lat * Math.PI / 180)) / (W0 * T.k);
    const max = (PHONE.matches ? 72 : 96) * mpp;
    const pow = Math.pow(10, Math.floor(Math.log10(max)));
    const nice = [5, 2, 1].map(n => n * pow).find(n => n <= max) || pow;
    const label = nice >= 1000 ? `${(nice / 1000).toLocaleString('en')} ${t('km')}` : `${nice} ${t('m')}`;
    $('#scale-label').textContent = label;
    $('#scale-bar').style.setProperty('--sw', (nice / mpp).toFixed(1));
  }

  /* ------------------------------------------------------------ the place card (side card / bottom sheet) */

  const appEl = $('#app');
  const card = $('#card');
  const cardBody = $('#card-body');
  let cardState = null;

  function openCard(state, html, focus) {
    cardState = state;
    cardBody.innerHTML = html;
    $$('[data-ar]', cardBody).forEach(n => n.style.setProperty('--ar', n.dataset.ar));
    const wasHidden = card.hidden;
    card.hidden = false;
    appEl.classList.add('has-card');
    card.classList.toggle('is-tall', state.type === 'list');
    if (!wasHidden && !RM.matches) card.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: 220, easing: EASE });
    cardBody.scrollTop = 0;
    const listOpen = state.type === 'list';
    $('#list-btn').setAttribute('aria-expanded', String(listOpen));
    wireCard();
    if (focus) { const h = $('#card-title'); if (h) h.focus({ preventScroll: true }); }
  }

  function closeCard() {
    if (card.hidden) return;
    card.hidden = true;
    cardState = null;
    appEl.classList.remove('has-card');
    $('#list-btn').setAttribute('aria-expanded', 'false');
    selIso = null; selSlide = null;
    PINS.forEach(p => p.el.classList.remove('is-selected'));
    schedule();
  }

  function rerenderCard() {
    if (!cardState) return;
    const s = cardState;
    if (s.type === 'country') showCountry(s.id, { fly: false, keep: true });
    else if (s.type === 'photo') showPhoto(s.id, { fly: false, keep: true });
    else if (s.type === 'cluster') showCluster(s.ids, true);
    else if (s.type === 'list') showList(true);
  }

  const photosOf = cid => COUNTRY[cid].photos.filter(id => SLIDES[id]);

  function countryLLs(cid) {
    const c = COUNTRY[cid];
    const lls = [c.ll, ...photosOf(cid).map(id => SLIDES[id].ll).filter(Boolean)];
    const b = BOOK_OF[cid];
    if (b) lls.push(bookLL(b));
    return lls;
  }

  function showCountry(cid, opts = {}) {
    const c = COUNTRY[cid], b = BOOK_OF[cid], ids = photosOf(cid);
    selIso = ISO[cid]; selSlide = null;
    PINS.forEach(p => p.el.classList.toggle('is-selected', p.b.country === cid));
    const strip = ids.length
      ? `<div class="strip" role="list">${ids.map((id, i) => `<button class="strip__item" type="button" role="listitem" data-view="${i}" aria-label="${esc(L(SLIDES[id].place))}: ${esc(t('seeLarger'))}"><img src="${img(SLIDES[id].file, 640)}" alt="" width="${SLIDES[id].w}" height="${SLIDES[id].h}" loading="lazy" decoding="async"></button>`).join('')}</div>`
      : `<div class="strip strip--none">${esc(t('bandNone'))}</div>`;
    const home = cid === HOME ? `<span class="card__home">${esc(t('home'))}</span>` : '';
    const open = b && b.status === 'bookOpen';
    const html = `${strip}<div class="card__main card__main--country">
      <h2 class="card__title" id="card-title" tabindex="-1">${esc(L(c.name))}</h2>
      <p class="card__meta"><span>${esc(L(c.date))}</span><span>${esc(ids.length ? t('nPhotos', ids.length) : t('bandNone'))}</span>${home}</p>
      <p class="card__note">${esc(L(c.note))}</p>
      <p class="card__status${open ? ' card__status--open' : ''}">${esc(open ? L(S.guides[b.guide].facts) : t('bookNot'))}</p>
      <div class="card__actions">${b ? `<a class="btn btn--primary" href="#${bookHash(b)}" data-open="${b.id}">${esc(open ? t('bookOpen') : t('openBook'))}</a>` : ''}</div>
    </div>`;
    openCard({ type: 'country', id: cid, ids }, html, opts.focus);
    if (opts.fly) {
      const lls = countryLLs(cid);
      fly(lls.length > 1 ? fitLL(lls, { kMax: 60 }) : fitLL(lls, { kMax: 8, kMin: 8 }), 1300);
    }
    schedule();
  }

  function slideFacts(s) {
    const set = [s.focal, s.aperture, s.shutter, s.iso && `ISO ${s.iso}`].filter(Boolean);
    let h = '';
    if (s.camera) h += `<dt>${esc(t('camera'))}</dt><dd>${esc(s.camera)}</dd>`;
    if (s.lens) h += `<dt>${esc(t('lens'))}</dt><dd>${esc(s.lens)}</dd>`;
    if (set.length) h += `<dt>${esc(t('settings'))}</dt><dd class="facts__set">${set.map(v => `<span>${esc(v)}</span>`).join('')}</dd>`;
    if (s.best) h += `<dt>${esc(t('best'))}</dt><dd>${esc(L(s.best))}</dd>`;
    return h ? `<dl class="facts">${h}</dl>` : '';
  }

  function showPhoto(id, opts = {}) {
    const s = SLIDES[id], c = COUNTRY[s.country], b = BOOK_OF[s.country];
    selSlide = id; selIso = ISO[s.country];
    PINS.forEach(p => p.el.classList.remove('is-selected'));
    const guide = b && b.status === 'bookOpen';
    const html = `<button class="card__photo" type="button" data-view-one="${id}" aria-label="${esc(L(s.place))}: ${esc(t('seeLarger'))}"><img src="${img(s.file, 1280)}" alt="${esc(L(s.alt))}" width="${s.w}" height="${s.h}" decoding="async"></button>
      <div class="card__main card__main--photo">
        <h2 class="card__title" id="card-title" tabindex="-1">${esc(L(s.place))}</h2>
        <p class="card__meta"><span>${esc(L(s.where))}</span></p>
        ${s.note ? `<p class="card__note">${esc(L(s.note))}</p>` : ''}
        ${slideFacts(s)}
        <div class="card__actions">
          ${b ? `<a class="btn btn--primary" href="#${bookHash(b)}" data-open="${b.id}">${esc(guide ? t('bookOpen') : t('openBook'))}</a>` : ''}
          <button class="btn" type="button" data-country="${s.country}">${esc(L(c.name))}</button>
          ${s.map ? `<a class="btn" href="${esc(s.map)}" target="_blank" rel="noopener">${esc(t('openMaps'))}</a>` : ''}
        </div>
      </div>`;
    openCard({ type: 'photo', id }, html, opts.focus);
    if (opts.fly) fly(fitLL([s.ll], { kMax: Math.max(T.k, 260), kMin: Math.max(T.k, 120) }), 1500);
    schedule();
  }

  function showCluster(ids, keep) {
    selSlide = null;
    const html = `<div class="card__main card__main--list">
      <h2 class="card__title" id="card-title" tabindex="-1">${esc(t('photosHere', ids.length))}</h2>
      <p class="card__meta"><span>${esc(t('pickOne'))}</span></p>
      <ul class="thumbs">${ids.map(id => `<li><button type="button" data-photo="${id}"><img src="${img(SLIDES[id].file, 640)}" alt="" loading="lazy" decoding="async"><span>${esc(L(SLIDES[id].place))}</span></button></li>`).join('')}</ul>
    </div>`;
    openCard({ type: 'cluster', ids }, html, !keep);
  }

  function showList(keep) {
    const rows = S.books.map(b => {
      const c = COUNTRY[b.country];
      const cover = b.photo
        ? `<span class="place-row__cover"><img src="${img(SLIDES[b.photo].file, 640)}" alt="" loading="lazy" decoding="async"></span>`
        : `<span class="place-row__cover place-row__cover--blank" data-tone="${b.tone}"></span>`;
      const tag = b.status === 'bookOpen' ? t('bandGuide') : (b.country === HOME ? t('home') : '');
      return `<li><button class="place-row" type="button" data-country="${b.country}">${cover}<span class="place-row__text"><span class="place-row__name">${esc(L(c.name))}</span><span class="place-row__sub">${esc(L(c.date))}${photosOf(b.country).length ? '' : ', ' + esc(t('bandNone'))}</span></span><span class="place-row__tag">${esc(tag)}</span></button></li>`;
    }).join('');
    const html = `<div class="card__main card__main--list">
      <h2 class="card__title" id="card-title" tabindex="-1">${esc(t('saved'))}</h2>
      <p class="card__meta"><span>${esc(t('savedSub', S.countries.length))}</span></p>
      <ul class="places">${rows}</ul>
    </div>`;
    openCard({ type: 'list' }, html, !keep);
  }

  function wireCard() {
    $$('[data-view]', cardBody).forEach(n => n.addEventListener('click', () => openViewer(cardState.ids, +n.dataset.view, n)));
    $$('[data-view-one]', cardBody).forEach(n => n.addEventListener('click', () => {
      const id = n.dataset.viewOne, ids = photosOf(SLIDES[id].country);
      openViewer(ids, Math.max(0, ids.indexOf(id)), n);
    }));
    $$('[data-open]', cardBody).forEach(n => n.addEventListener('click', e => { e.preventDefault(); openBook(n.dataset.open, { trigger: n }); }));
    $$('[data-country]', cardBody).forEach(n => n.addEventListener('click', () => showCountry(n.dataset.country, { fly: true, focus: true })));
    $$('[data-photo]', cardBody).forEach(n => n.addEventListener('click', () => showPhoto(n.dataset.photo, { fly: true, focus: true })));
    const TONE = { clay: 'oklch(53% 0.088 47)', olive: 'oklch(49% 0.052 95)', slate: 'oklch(41% 0.03 195)' };
    $$('[data-tone]', cardBody).forEach(n => n.style.setProperty('--tone', TONE[n.dataset.tone] || TONE.clay));
  }

  $('#card-close').addEventListener('click', closeCard);
  $('.card__grip').addEventListener('click', () => card.classList.toggle('is-tall'));

  /* ------------------------------------------------------------ search: only his real places */

  const q = $('#q');
  const box = $('#suggest-box');
  const listbox = $('#suggest');
  let options = [], active = -1;
  const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  function entries() {
    const out = [];
    for (const b of S.books) {
      const c = COUNTRY[b.country];
      out.push({ type: 'country', id: b.country, names: [c.name.en, c.name.zh, b.title.en, b.title.zh, c.note.en, c.note.zh], name: L(c.name), sub: `${L(c.date)}, ${statusOf(b)}`, thumb: b.photo ? img(SLIDES[b.photo].file, 640) : null, round: false });
    }
    for (const id of SLIDE_IDS) {
      const s = SLIDES[id];
      out.push({ type: 'photo', id, names: [s.place.en, s.place.zh, s.where.en, s.where.zh], name: L(s.place), sub: L(s.where), thumb: img(s.file, 640), round: true });
    }
    return out;
  }

  function search(text) {
    const n = norm(text.trim());
    const all = entries();
    if (!n) return all.filter(e => e.type === 'country');
    const scored = [];
    for (const e of all) {
      let best = -1;
      e.names.forEach((nm, i) => {
        const v = norm(nm);
        const at = v.indexOf(n);
        if (at < 0) return;
        const sc = (at === 0 ? 3 : (/[\s,(]/.test(v[at - 1] || '') ? 2 : 1)) - (i >= 4 && e.type === 'country' ? 1.5 : 0) + (e.type === 'country' ? 0.5 : 0);
        best = Math.max(best, sc);
      });
      if (best >= 0) scored.push([best, e]);
    }
    scored.sort((a, b) => b[0] - a[0]);
    return scored.slice(0, 9).map(x => x[1]);
  }

  function renderSuggest() {
    const text = q.value;
    options = search(text);
    active = -1;
    $('#suggest-head').textContent = text.trim() ? t('results') : t('saved');
    if (!options.length) {
      listbox.innerHTML = '';
      const p = document.createElement('li');
      p.className = 'suggest__empty';
      p.setAttribute('role', 'presentation');
      p.textContent = t('noMatch', text.trim());
      listbox.appendChild(p);
    } else {
      listbox.innerHTML = options.map((o, i) => `<li class="opt" role="option" id="opt-${i}" aria-selected="false" data-i="${i}">`
        + `<span class="opt__thumb${o.round ? ' opt__thumb--round' : ''}${o.thumb ? '' : ' opt__thumb--none'}">${o.thumb ? `<img src="${o.thumb}" alt="" loading="lazy" decoding="async">` : ''}</span>`
        + `<span class="opt__text"><span class="opt__name">${esc(o.name)}</span><span class="opt__sub">${esc(o.sub)}</span></span></li>`).join('');
    }
    box.hidden = false;
    q.setAttribute('aria-expanded', 'true');
    q.removeAttribute('aria-activedescendant');
  }

  function closeSuggest() {
    box.hidden = true;
    q.setAttribute('aria-expanded', 'false');
    q.removeAttribute('aria-activedescendant');
    active = -1;
  }

  function setActive(i) {
    const items = $$('.opt', listbox);
    if (!items.length) return;
    active = (i + items.length) % items.length;
    items.forEach((n, j) => n.setAttribute('aria-selected', String(j === active)));
    q.setAttribute('aria-activedescendant', items[active].id);
    items[active].scrollIntoView({ block: 'nearest' });
  }

  function choose(o) {
    closeSuggest();
    q.value = o.name;
    if (o.type === 'country') showCountry(o.id, { fly: true, focus: false });
    else showPhoto(o.id, { fly: true, focus: false });
  }

  q.addEventListener('focus', renderSuggest);
  q.addEventListener('input', renderSuggest);
  q.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (box.hidden) renderSuggest(); setActive(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); const o = options[active >= 0 ? active : 0]; if (o) choose(o); }
    else if (e.key === 'Escape') { if (!box.hidden) { e.stopPropagation(); closeSuggest(); } else if (q.value) { q.value = ''; } }
  });
  q.addEventListener('blur', () => setTimeout(() => { if (document.activeElement !== q) closeSuggest(); }, 120));
  listbox.addEventListener('mousedown', e => e.preventDefault());
  listbox.addEventListener('click', e => { const li = e.target.closest('.opt'); if (li) choose(options[+li.dataset.i]); });

  $('#list-btn').addEventListener('click', () => {
    if (cardState && cardState.type === 'list') closeCard(); else { closeSuggest(); showList(); }
  });

  /* ------------------------------------------------------------ the book opens into a page */

  const reader = $('#reader');
  const readerScroll = $('#reader-scroll');
  const readerContent = $('#reader-content');
  let reading = null;

  function fillGuide(root, dict) {
    const place = id => (SLIDES[id] ? L(SLIDES[id].place) : '');
    $$('[data-i18n]', root).forEach(n => {
      const k = n.dataset.i18n;
      let v = dict[k];
      if (v == null && k.startsWith('sp_')) v = place(k.slice(3));
      if (v != null) n.textContent = v;
    });
    $$('[data-i18n-html]', root).forEach(n => { const v = dict[n.dataset.i18nHtml]; if (v != null) n.innerHTML = v; });
    $$('[data-i18n-alt]', root).forEach(n => {
      const id = n.dataset.i18nAlt.replace(/^sa_/, '');
      n.alt = SLIDES[id] ? L(SLIDES[id].alt) : (dict[n.dataset.i18nAlt] || n.alt);
    });
    $$('[data-i18n-aria]', root).forEach(n => {
      const k = n.dataset.i18nAria;
      if (k.startsWith('sl_')) n.setAttribute('aria-label', t('made', place(k.slice(3))));
      else if (dict[k]) n.setAttribute('aria-label', dict[k]);
    });
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) if (/[–—]/.test(n.nodeValue)) n.nodeValue = clean(n.nodeValue);
  }

  function pageEnd() {
    return `<footer class="page-end"><button class="btn" type="button" data-back>${esc(t('back'))}</button><span>${esc(t('endLine'))}</span></footer>`;
  }

  function renderGuide(b) {
    const g = S.guides[b.guide];
    readerContent.innerHTML = `<article class="guide">${g.html}</article>`;
    fillGuide(readerContent, g.i18n[lang] || g.i18n.en);
    const h1 = $('h1', readerContent);
    h1.id = 'reader-title';
    h1.tabIndex = -1;
    const meta = $('.guide-top .meta', readerContent);
    if (meta) meta.insertAdjacentHTML('afterend', `<p class="guide-facts">${esc(L(g.facts))}</p>`);
    $$('img', readerContent).forEach((im, i) => { if (i === 0) { im.loading = 'eager'; im.fetchPriority = 'high'; } });
    $('.wrap', readerContent).insertAdjacentHTML('beforeend', pageEnd());
    $$('a[data-slide]', readerContent).forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        const ids = $$('a[data-slide]', readerContent).map(x => x.dataset.slide).filter((v, i, arr) => arr.indexOf(v) === i);
        openViewer(ids, ids.indexOf(a.dataset.slide), a);
      });
    });
    tocWatch();
  }

  function rowsOf(ids) {
    const target = PHONE.matches ? 1 : 2.7;
    const rows = [];
    let row = [], sum = 0;
    for (const id of ids) {
      const ar = SLIDES[id].w / SLIDES[id].h;
      row.push([id, ar]); sum += ar;
      if (sum >= target * 0.88) { rows.push({ row, sum }); row = []; sum = 0; }
    }
    if (row.length) rows.push({ row, sum, last: true });
    return rows;
  }

  function renderPlace(b) {
    const c = COUNTRY[b.country], ids = photosOf(b.country);
    let body;
    if (ids.length) {
      body = `<div class="rows">${rowsOf(ids).map(r => `<div class="row">${r.row.map(([id, ar]) => {
        const s = SLIDES[id];
        return `<figure class="piece" data-ar="${ar.toFixed(4)}"><button type="button" data-view="${ids.indexOf(id)}" aria-label="${esc(t('made', L(s.place)))}"><img src="${img(s.file, 1280)}" srcset="${img(s.file, 640)} 640w, ${img(s.file, 1280)} 1280w, ${img(s.file)} 2400w" sizes="(max-width: 48rem) 94vw, 40vw" width="${s.w}" height="${s.h}" alt="${esc(L(s.alt))}" loading="lazy" decoding="async" data-ar="${ar.toFixed(4)}"></button><figcaption><b>${esc(L(s.place))}</b><span>${esc(L(s.where))}</span></figcaption></figure>`;
      }).join('')}${r.last && r.sum < 2.2 && !PHONE.matches ? `<span class="piece" aria-hidden="true" data-ar="${(2.7 - r.sum).toFixed(4)}"></span>` : ''}</div>`).join('')}</div>`;
    } else {
      body = `<div class="empty-page"><b>${esc(t('bandNone'))}</b><span>${esc(L(c.note))}</span></div>`;
    }
    readerContent.innerHTML = `<div class="wrap">
      <header class="place-top">
        <h1 class="page-title" id="reader-title" tabindex="-1">${esc(L(c.name))}</h1>
        <p class="meta">${esc(L(c.date))}${c.id === HOME ? `, ${esc(t('home'))}` : ''}</p>
        ${ids.length ? `<p class="page-lede">${esc(L(c.note))}</p>` : ''}
        <p class="quiet-line">${esc(t('bookNot'))}</p>
      </header>${body}${pageEnd()}</div>`;
    $$('[data-ar]', readerContent).forEach(n => n.style.setProperty('--ar', n.dataset.ar));
    $$('[data-view]', readerContent).forEach(n => n.addEventListener('click', () => openViewer(ids, +n.dataset.view, n)));
  }

  function renderReader(b) {
    if (b.guide && S.guides[b.guide]) renderGuide(b); else renderPlace(b);
    $$('[data-back]', readerContent).forEach(n => n.addEventListener('click', () => closeBook()));
  }

  let tocIO = null;
  function tocWatch() {
    if (tocIO) tocIO.disconnect();
    const links = $$('.toc a', readerContent);
    if (!links.length || !('IntersectionObserver' in window)) return;
    const byId = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
    tocIO = new IntersectionObserver(es => {
      for (const e of es) {
        if (!e.isIntersecting) continue;
        links.forEach(a => a.removeAttribute('aria-current'));
        const a = byId.get(e.target.id); if (a) a.setAttribute('aria-current', 'true');
      }
    }, { root: readerScroll, rootMargin: '0px 0px -70% 0px' });
    byId.forEach((a, id) => { const h = document.getElementById(id); if (h) tocIO.observe(h); });
  }

  readerContent.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.dataset.slide) return;
    const id = a.getAttribute('href').slice(1);
    const target = id && document.getElementById(id);
    e.preventDefault();
    if (target) { target.scrollIntoView({ behavior: RM.matches ? 'auto' : 'smooth', block: 'start' }); target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
  });
  readerScroll.addEventListener('scroll', () => reader.classList.toggle('is-scrolled', readerScroll.scrollTop > 8), { passive: true });

  const pinOf = id => PINS.find(p => p.b.id === id);
  function bookRect(pin) {
    if (!pin) return null;
    const face = $('.book__face', pin.el);
    const r = face.getBoundingClientRect();
    const inset = cardInset();
    if (r.width < 4 || r.right < inset.l || r.left > vw || r.bottom < 0 || r.top > vh - inset.b) return null;
    return r;
  }
  const insetOf = r => `inset(${r.top.toFixed(1)}px ${(innerWidth - r.right).toFixed(1)}px ${(innerHeight - r.bottom).toFixed(1)}px ${r.left.toFixed(1)}px round 2px)`;

  function openBook(id, opts = {}) {
    const b = S.books.find(x => x.id === id);
    if (!b) return;
    if (reading && reading.b === b) return;
    if (reading) finishClose(true);
    closeSuggest();
    const pin = pinOf(id);
    const push = opts.push !== false;
    if (push) history.pushState({ book: id }, '', '#' + bookHash(b));
    reading = { b, pushed: push, trigger: opts.trigger || (pin && pin.a), anims: [] };
    renderReader(b);
    reader.hidden = false;
    readerScroll.scrollTop = 0;
    reader.classList.remove('is-scrolled');
    document.body.classList.add('is-reading');
    appEl.inert = true;
    const rect = opts.animate === false ? null : bookRect(pin);
    if (rect && !RM.matches) {
      pin.el.classList.add('is-open');
      const a1 = reader.animate([{ clipPath: insetOf(rect) }, { clipPath: 'inset(0px 0px 0px 0px round 0px)' }], { duration: 760, delay: 160, easing: EASE, fill: 'both' });
      const a2 = readerContent.animate([{ opacity: 0, transform: 'translateY(22px)' }, { opacity: 1, transform: 'none' }], { duration: 560, delay: 420, easing: EASE, fill: 'both' });
      reading.anims = [a1, a2];
      a1.onfinish = () => { if (reading && reading.anims[0] === a1) { a1.cancel(); a2.cancel(); reading.anims = []; } };
    } else {
      const a = reader.animate([{ opacity: 0 }, { opacity: 1 }], { duration: RM.matches || opts.animate === false ? 160 : 240, easing: 'ease-out' });
      reading.anims = [];
      a.onfinish = () => {};
    }
    if (opts.animate === false) $('#reader-title').focus({ preventScroll: true }); else $('#reader-back').focus({ preventScroll: true });
    document.title = `${L(b.title)}, tuan photography 陳亮元`;
  }

  function closeBook(opts = {}) {
    if (!reading) return;
    if (!opts.fromPop && reading.pushed) { history.back(); return; }
    if (!opts.fromPop && !reading.pushed) history.replaceState(null, '', location.pathname + location.search);
    const r = reading;
    const pin = pinOf(r.b.id);
    // a page still opening runs back into its book
    if (r.anims.length && r.anims[0].playState === 'running') {
      r.anims.forEach(a => a.reverse());
      r.anims[0].onfinish = () => finishClose();
      r.closing = true;
      return;
    }
    const rect = bookRect(pin);
    if (rect && !RM.matches) {
      if (pin) pin.el.classList.add('is-open');
      readerContent.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: 'ease-in', fill: 'both' });
      const a = reader.animate([{ clipPath: 'inset(0px 0px 0px 0px round 0px)' }, { clipPath: insetOf(rect) }], { duration: 560, delay: 60, easing: 'cubic-bezier(0.7, 0, 0.2, 1)', fill: 'both' });
      r.anims = [a];
      r.closing = true;
      a.onfinish = () => finishClose();
    } else {
      const a = reader.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: 'ease-in', fill: 'both' });
      r.closing = true;
      a.onfinish = () => finishClose();
    }
  }

  function finishClose(silent) {
    if (!reading) return;
    const r = reading;
    reading = null;
    reader.getAnimations().forEach(a => a.cancel());
    readerContent.getAnimations().forEach(a => a.cancel());
    reader.hidden = true;
    readerContent.innerHTML = '';
    if (tocIO) { tocIO.disconnect(); tocIO = null; }
    document.body.classList.remove('is-reading');
    appEl.inert = false;
    PINS.forEach(p => p.el.classList.remove('is-open'));
    document.title = 'tuan photography 陳亮元';
    if (!silent && r.trigger && document.contains(r.trigger)) r.trigger.focus({ preventScroll: true });
  }

  $('#reader-back').addEventListener('click', () => closeBook());

  function syncHash(first) {
    const b = bookFromHash(location.hash);
    if (b) {
      if (!reading || reading.b !== b) {
        if (first) {
          // arriving straight at a page: the map waits behind it, set on that place
          const lls = countryLLs(b.country);
          fly(lls.length > 1 ? fitLL(lls, { kMax: 40, inset: { l: 0, b: 0 } }) : fitLL(lls, { kMax: 8, kMin: 8, inset: { l: 0, b: 0 } }), 0);
        }
        openBook(b.id, { push: false, animate: !first });
      }
    } else if (reading) closeBook({ fromPop: true });
  }
  addEventListener('popstate', () => syncHash(false));

  /* ------------------------------------------------------------ a photograph, larger */

  const viewer = $('#viewer');
  let view = null;
  function openViewer(ids, i, opener) {
    view = { ids, i: clamp(i, 0, ids.length - 1), opener };
    viewer.hidden = false;
    if (reading) reader.inert = true; else appEl.inert = true;
    $('#chrome').inert = true;
    paintViewer();
    $('#viewer-close').focus({ preventScroll: true });
  }
  function paintViewer() {
    if (!view) return;
    const id = view.ids[view.i], s = SLIDES[id];
    const im = new Image();
    im.id = 'viewer-img';
    im.srcset = `${img(s.file, 1280)} 1280w, ${img(s.file)} 2400w`;
    im.sizes = '(max-width: 48rem) 100vw, 75vw';
    im.src = img(s.file, 1280);
    im.alt = L(s.alt);
    im.width = s.w; im.height = s.h;
    $('.viewer__frame').replaceChildren(im);
    $('#viewer-cap').innerHTML = `<h2 id="viewer-title">${esc(L(s.place))}</h2><p class="meta">${esc(L(s.where))}</p>${s.note ? `<p class="card__note">${esc(L(s.note))}</p>` : ''}${slideFacts(s)}`;
    $('#viewer-count').textContent = view.ids.length > 1 ? t('countOf', view.i + 1, view.ids.length) : '';
    $('#viewer-prev').disabled = view.i <= 0;
    $('#viewer-next').disabled = view.i >= view.ids.length - 1;
    $('#viewer-prev').hidden = $('#viewer-next').hidden = view.ids.length < 2;
  }
  function closeViewer() {
    if (!view) return;
    const o = view.opener;
    view = null;
    viewer.hidden = true;
    $('#chrome').inert = false;
    if (reading) reader.inert = false; else appEl.inert = false;
    if (o && document.contains(o)) o.focus({ preventScroll: true });
  }
  const step = d => { if (!view) return; const n = clamp(view.i + d, 0, view.ids.length - 1); if (n !== view.i) { view.i = n; paintViewer(); } };
  $('#viewer-prev').addEventListener('click', () => step(-1));
  $('#viewer-next').addEventListener('click', () => step(1));
  $('#viewer-close').addEventListener('click', closeViewer);
  let sx = null;
  viewer.addEventListener('pointerdown', e => { sx = e.clientX; });
  viewer.addEventListener('pointerup', e => { if (sx != null && Math.abs(e.clientX - sx) > 60) step(e.clientX < sx ? 1 : -1); sx = null; });

  /* ------------------------------------------------------------ keys */

  document.addEventListener('keydown', e => {
    if (view) {
      if (e.key === 'Escape') { e.preventDefault(); closeViewer(); }
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'Tab') trap(e, viewer);
      return;
    }
    if (reading) {
      if (e.key === 'Escape') { e.preventDefault(); closeBook(); }
      return;
    }
    if (e.key === 'Escape' && !card.hidden && document.activeElement !== q) { closeCard(); }
  });
  function trap(e, root) {
    const f = $$('button:not([disabled]):not([hidden]), a[href]', root);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  mapEl.addEventListener('keydown', e => {
    if (e.target !== mapEl) return;
    const d = 140 / T.k;
    const go = (x, y) => { e.preventDefault(); if (RM.matches) zoom.translateBy(sel, x, y); else zoom.translateBy(sel.transition().duration(200), x, y); };
    if (e.key === 'ArrowLeft') go(d, 0);
    else if (e.key === 'ArrowRight') go(-d, 0);
    else if (e.key === 'ArrowUp') go(0, d);
    else if (e.key === 'ArrowDown') go(0, -d);
    else if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomBy(2); }
    else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomBy(0.5); }
    else if (e.key === '0') { e.preventDefault(); fly(homeView(), 900); }
  });

  function zoomBy(f) {
    if (RM.matches) zoom.scaleBy(sel, f); else zoom.scaleBy(sel.transition().duration(320).ease(d3.easeCubicOut), f);
  }
  $('#zoom-in').addEventListener('click', () => zoomBy(2));
  $('#zoom-out').addEventListener('click', () => zoomBy(0.5));
  $('#zoom-world').addEventListener('click', () => fly(homeView(), 1100));

  /* ------------------------------------------------------------ pointer on the map */

  let mapPointerDown = false, downAt = null;
  mapEl.addEventListener('pointerdown', e => { mapPointerDown = true; downAt = [e.clientX, e.clientY]; }, true);
  addEventListener('pointerup', () => { setTimeout(() => { mapPointerDown = false; }, 0); });

  let hoverRaf = 0, lastMove = null;
  mapEl.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || e.buttons) return;
    lastMove = e;
    if (!hoverRaf) hoverRaf = requestAnimationFrame(() => {
      hoverRaf = 0;
      const ev = lastMove, r = mapEl.getBoundingClientRect();
      const x = ev.clientX - r.left, y = ev.clientY - r.top;
      // a book wakes when the pointer comes near it
      let best = null, bd = 64;
      const s = bookScale(T.k);
      for (const p of PINS) {
        const d = Math.hypot(x - p.x, y - (p.y - 136 * s));
        if (d < bd) { bd = d; best = p; }
      }
      if (!ev.target.closest('.book')) wake(best);
      const onThing = ev.target.closest('.book, .sticker');
      const f = onThing ? null : hitCountry(x, y);
      const iso = f ? f.iso : null;
      mapEl.classList.toggle('is-over-place', !!f);
      if (iso !== hoverIso) { hoverIso = iso; schedule(); }
    });
  });
  mapEl.addEventListener('pointerleave', () => { wake(null); if (hoverIso) { hoverIso = null; schedule(); } });

  mapEl.addEventListener('click', e => {
    if (e.target.closest('.book, .sticker')) return;
    if (downAt && Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6) return;
    const r = mapEl.getBoundingClientRect();
    const f = hitCountry(e.clientX - r.left, e.clientY - r.top);
    if (f) showCountry(f.cid, { fly: false });
    else if (!card.hidden && cardState && cardState.type !== 'list') closeCard();
  });

  /* ------------------------------------------------------------ language */

  function applyLang(first) {
    document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en';
    $$('[data-t]').forEach(n => { n.textContent = t(n.dataset.t); });
    $$('[data-t-aria]').forEach(n => n.setAttribute('aria-label', t(n.dataset.tAria)));
    $$('[data-t-ph]').forEach(n => { n.placeholder = t(n.dataset.tPh); });
    $$('.lang__btn').forEach(n => n.setAttribute('aria-pressed', String(n.dataset.lang === lang)));
    $('.ig').setAttribute('aria-label', `${t('follow')}, @${S.instagram.handle}`);
    if (first) return;
    paintPins();
    paintStickers(true);
    rerenderCard();
    if (!box.hidden) renderSuggest();
    if (reading) {
      const top = readerScroll.scrollTop;
      renderReader(reading.b);
      readerScroll.scrollTop = top;
      document.title = `${L(reading.b.title)}, tuan photography 陳亮元`;
    }
    if (view) paintViewer();
    if (lang === 'zh' && document.fonts) document.fonts.load('500 13px "Noto Sans TC"', MAPWORDS.map(w => w.zh).join('')).then(schedule, schedule);
    schedule();
  }
  $$('.lang__btn').forEach(n => n.addEventListener('click', () => {
    if (n.dataset.lang === lang) return;
    lang = n.dataset.lang;
    try { localStorage.setItem('tlap-lang', lang); } catch (e) { /* storage blocked */ }
    applyLang(false);
  }));

  /* ------------------------------------------------------------ start */

  async function start() {
    applyLang(true);
    sizeMap();
    sel.call(zoom).on('dblclick.zoom', null);
    // double-click zooms in smoothly (and never on a book or a sticker)
    sel.on('dblclick.map', e => {
      if (e.target.closest('.book, .sticker')) return;
      const p = d3.pointer(e, mapEl);
      if (RM.matches) zoom.scaleBy(sel, e.shiftKey ? 0.5 : 2, p);
      else zoom.scaleBy(sel.transition().duration(380).ease(d3.easeCubicOut), e.shiftKey ? 0.5 : 2, p);
    });
    buildPins();
    buildStickers();
    sel.call(zoom.transform, homeView());
    schedule();
    try {
      const topo = await fetch('../vendor/countries-110m.json').then(r => r.json());
      G110 = shapes(topo);
      schedule();
    } catch (e) { /* the map still works as pins on water */ }
    syncHash(true);
    if (document.fonts) document.fonts.ready.then(schedule);
    if (lang === 'zh' && document.fonts) document.fonts.load('500 13px "Noto Sans TC"', MAPWORDS.map(w => w.zh).join('')).then(schedule, schedule);
    const idle = window.requestIdleCallback || (f => setTimeout(f, 300));
    idle(async () => {
      try {
        const topo = await fetch('../vendor/countries-50m.json').then(r => r.json());
        G50 = shapes(topo);
        schedule();
      } catch (e) { /* 110m stays */ }
    });
  }

  let rz = 0;
  addEventListener('resize', () => {
    cancelAnimationFrame(rz);
    rz = requestAnimationFrame(() => {
      const c = [(vw / 2 - T.x) / T.k, (vh / 2 - T.y) / T.k];
      sizeMap();
      sel.call(zoom.transform, d3.zoomIdentity.translate(vw / 2 - c[0] * T.k, vh / 2 - c[1] * T.k).scale(Math.max(T.k, kMin)));
      schedule();
    });
  });

  start();
})();

/* tuan photography 陳亮元, design 2 "Marked spots".
   A light paper map. Each of his sixteen places is ringed by hand with a thin leader to a
   quiet caption: his note, the name in spaced capitals, the coordinates. Pick one and the
   map dives into the country, the photograph grows out of the ring, and the page begins.
   Everything is local: Natural Earth shapes on a canvas, moved by d3-zoom. */
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
  // the data keeps a few typographic dashes (a date range, a price range); the page shows none
  const clean = s => String(s).replace(/(\d)\s*[–—]\s*(\d)/g, '$1-$2').replace(/\s+[–—]\s+/g, ', ').replace(/[–—]/g, '-');

  /* ------------------------------------------------------------ words, both languages */

  const WORDS = {
    ig: { en: 'Instagram', zh: 'Instagram' },
    mapLabel: { en: 'Map of the places he has photographed', zh: '他拍過的地方地圖' },
    mapHint: { en: 'Drag or use the arrow keys to move the map. Scroll, or press plus and minus, to zoom. Tab moves between the places.', zh: '拖曳或用方向鍵移動地圖；捲動，或按加號、減號縮放。Tab 鍵在地點之間移動。' },
    zoomGroup: { en: 'Zoom', zh: '縮放' },
    zoomIn: { en: 'Zoom in', zh: '放大' },
    zoomOut: { en: 'Zoom out', zh: '縮小' },
    world: { en: 'Whole map', zh: '整張地圖' },
    credit: { en: 'Map: Natural Earth', zh: '地圖：Natural Earth' },
    siteLabel: { en: 'Site', zh: '網站' },
    langLabel: { en: 'Language', zh: '語言' },
    indexTitle: { en: 'Photographs', zh: '作品' },
    count: { en: (n, m) => `${n} photographs in ${m} places`, zh: (n, m) => `${m} 個地方，${n} 張照片` },
    showIndex: { en: 'Show the photographs', zh: '顯示照片' },
    hideIndex: { en: 'Hide the photographs', zh: '收起照片' },
    dive: { en: p => `${p}: zoom in to the photographs`, zh: p => `${p}：進入照片` },
    coverOf: { en: p => `Open with ${p}`, zh: p => `以「${p}」開場` },
    made: { en: p => `${p}: how this was made`, zh: p => `${p}：這張怎麼拍` },
    camera: { en: 'Camera', zh: '相機' },
    lens: { en: 'Lens', zh: '鏡頭' },
    settings: { en: 'Settings', zh: '參數' },
    prev: { en: 'Previous', zh: '上一張' },
    next: { en: 'Next', zh: '下一張' },
    countOf: { en: (i, n) => `${i} of ${n}`, zh: (i, n) => `第 ${i} 張，共 ${n} 張` },
    nPhotos: { en: n => (n === 1 ? '1 photograph' : `${n} photographs`), zh: n => `${n} 張照片` },
    endLine: { en: 'Every photograph here is his own, made on the trip.', zh: '這裡每張照片都是他自己在旅途中拍的。' },
  };

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

  /* ------------------------------------------------------------ his places */

  const ISO = { spain: '724', uk: '826', france: '250', germany: '276', switzerland: '756', taiwan: '158', japan: '392', 'south-korea': '410', 'hong-kong': '344', china: '156', singapore: '702', vietnam: '704', dubai: '784', australia: '036', 'new-zealand': '554', usa: '840' };
  const COUNTRY = Object.fromEntries(S.countries.map(c => [c.id, c]));
  const BOOK_OF = Object.fromEntries(S.books.map(b => [b.country, b]));
  const SLIDES = S.slides;
  const img = (file, size) => `../images/web/${size ? size + '/' : ''}${file}`;
  const photosOf = cid => COUNTRY[cid].photos.filter(id => SLIDES[id]);
  const placeLL = cid => { const b = BOOK_OF[cid]; return b && b.guide && S.guides[b.guide] ? S.guides[b.guide].ll : COUNTRY[cid].ll; };
  const hashOf = cid => { const b = BOOK_OF[cid]; return b && b.guide ? `guide-${b.guide}` : `place-${cid}`; };
  const fromHash = h => {
    const m = /^#(guide|place)-(.+)$/.exec(h || '');
    if (!m) return null;
    const id = decodeURIComponent(m[2]);
    if (m[1] === 'guide') { const b = S.books.find(x => x.guide === id); return b ? b.country : null; }
    return COUNTRY[id] ? id : null;
  };
  const coords = ll => {
    const [lat, lng] = ll;
    return `${Math.abs(lat).toFixed(3)}°${lat >= 0 ? 'N' : 'S'} · ${Math.abs(lng).toFixed(3)}°${lng >= 0 ? 'E' : 'W'}`;
  };
  const nameParts = cid => {
    const b = BOOK_OF[cid], c = COUNTRY[cid];
    const place = b ? L(b.title) : L(c.name), country = L(c.name);
    return place === country ? [place] : [place, country];
  };
  const nameHTML = cid => nameParts(cid).map(esc).join(`<i>${lang === 'zh' ? '｜' : '|'}</i>`);
  const nameText = cid => nameParts(cid).join(lang === 'zh' ? '｜' : ' | ');

  /* ------------------------------------------------------------ the map: projection and shapes */

  const W0 = 1024;
  const proj = d3.geoMercator().scale(W0 / (2 * Math.PI)).translate([W0 / 2, W0 / 2]);
  const Y_TOP = proj([0, 84])[1];
  const Y_BOT = proj([0, -60])[1];
  const K_MAX = 600;
  const K_FULL = 3.2;   // from here the captions show all three parts

  const mapEl = $('#map');
  const canvas = $('#land');
  const ctx = canvas.getContext('2d');
  const indexEl = $('#index');
  let vw = 0, vh = 0, dpr = 1, kMin = 1;
  let T = d3.zoomIdentity;
  let G110 = null, G50 = null;
  const COL = {};
  function readColours() {
    const cs = getComputedStyle(document.documentElement);
    for (const k of ['sea', 'sea-line', 'land', 'relief', 'coast', 'ink']) COL[k] = cs.getPropertyValue('--' + k).trim();
  }

  const toPath = geo => { const p = new Path2D(); d3.geoPath(proj, p)(geo); return p; };
  const graticule = toPath(d3.geoGraticule().step([10, 10])());
  function shapesFromCountries(topo) {
    const obj = topo.objects.countries;
    const geoms = obj.geometries.filter(g => g.id !== '010');
    const been = [];
    for (const g of geoms) {
      const cid = Object.keys(ISO).find(k => ISO[k] === g.id);
      if (cid) been.push({ cid, p: toPath(topojson.feature(topo, g)), b: d3.geoPath(proj).bounds(topojson.feature(topo, g)) });
    }
    return { land: toPath(topojson.merge(topo, geoms)), been };
  }

  // paper grain, drawn in screen space and clipped to the land
  const grain = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 180;
    const g = c.getContext('2d');
    const id = g.createImageData(180, 180);
    let s = 7;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < id.data.length; i += 4) {
      const v = 60 + rnd() * 60;
      id.data[i] = v; id.data[i + 1] = v - 6; id.data[i + 2] = v - 14;
      id.data[i + 3] = rnd() < 0.55 ? 0 : 6 + rnd() * 12;
    }
    g.putImageData(id, 0, 0);
    return c;
  })();
  let grainPattern = null;

  function draw() {
    const k = T.k;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = COL.sea;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const G = (G50 && k >= 2.6) ? G50 : (G110 || G50);
    ctx.setTransform(dpr * k, 0, 0, dpr * k, dpr * T.x, dpr * T.y);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    // a hairline graticule on the sea
    ctx.strokeStyle = COL['sea-line'];
    ctx.lineWidth = 0.7 / k;
    ctx.stroke(graticule);
    if (!G) return;
    const x0 = -T.x / k, y0 = -T.y / k, x1 = (vw - T.x) / k, y1 = (vh - T.y) / k;
    // relief: the land shape laid twice, the lower sheet a shade darker and a touch offset
    ctx.save();
    ctx.translate(2.4 / k, 2.8 / k);
    ctx.fillStyle = COL.relief;
    ctx.fill(G.land);
    ctx.restore();
    ctx.fillStyle = COL.land;
    ctx.fill(G.land);
    // grain and an inner shadow along the coast, both kept inside the land
    ctx.save();
    ctx.clip(G.land);
    if (!grainPattern) grainPattern = ctx.createPattern(grain, 'repeat');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = grainPattern;
    ctx.fillRect(0, 0, vw, vh);
    ctx.setTransform(dpr * k, 0, 0, dpr * k, dpr * T.x, dpr * T.y);
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = COL.relief;
    ctx.lineWidth = 7 / k;
    ctx.stroke(G.land);
    ctx.globalAlpha = 1;
    ctx.restore();
    ctx.strokeStyle = COL.coast;
    ctx.lineWidth = 0.75 / k;
    ctx.stroke(G.land);
    // the sixteen countries: a hairline each, nothing more
    ctx.strokeStyle = COL.ink;
    ctx.globalAlpha = 0.42;
    ctx.lineWidth = 0.6 / k;
    for (const f of G.been) {
      if (f.b[1][0] < x0 || f.b[0][0] > x1 || f.b[1][1] < y0 || f.b[0][1] > y1) continue;
      ctx.stroke(f.p);
    }
    ctx.globalAlpha = 1;
  }

  /* ------------------------------------------------------------ zoom */

  const zoom = d3.zoom().scaleExtent([1, K_MAX]).on('zoom', e => { T = e.transform; schedule(); });
  const sel = d3.select(mapEl);

  function mapRect() {
    if (PHONE.matches) return { x0: 0, y0: 0, x1: vw, y1: vh - 56 };
    return { x0: 0, y0: 0, x1: Math.max(200, indexEl.offsetLeft), y1: vh };
  }

  function sizeMap() {
    vw = mapEl.clientWidth; vh = mapEl.clientHeight;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
    grainPattern = null;
    kMin = Math.max(vw / W0, vh / (Y_BOT - Y_TOP));
    zoom.scaleExtent([kMin, K_MAX]).translateExtent([[0, Y_TOP], [W0, Y_BOT]]).extent([[0, 0], [vw, vh]]);
  }

  function fitLL(lonlats, opts = {}) {
    const pts = lonlats.map(ll => proj([ll[1], ll[0]]));
    const x0 = d3.min(pts, p => p[0]), x1 = d3.max(pts, p => p[0]);
    const y0 = d3.min(pts, p => p[1]), y1 = d3.max(pts, p => p[1]);
    const r = opts.rect || mapRect();
    const pad = Object.assign({ l: 70, r: 70, t: 110, b: 90 }, opts.pad || {});
    const aw = Math.max(80, r.x1 - r.x0 - pad.l - pad.r), ah = Math.max(80, r.y1 - r.y0 - pad.t - pad.b);
    let k = Math.min(aw / Math.max(1e-6, x1 - x0), ah / Math.max(1e-6, y1 - y0));
    k = clamp(k, opts.kMin || kMin, opts.kMax || 120);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    return d3.zoomIdentity.translate(r.x0 + pad.l + aw / 2 - cx * k, r.y0 + pad.t + ah / 2 - cy * k).scale(k);
  }

  // a straight dive: the scale grows exponentially, the centre glides, no zoom-out dip
  let flying = null;
  function stopFly() { if (flying) { cancelAnimationFrame(flying.raf); flying = null; } }
  function fly(target, ms, done) {
    stopFly();
    sel.interrupt();
    if (RM.matches || !ms) { sel.call(zoom.transform, target); if (done) done(); return; }
    const a = T, b = target;
    const r = mapRect();
    const cx = (r.x0 + r.x1) / 2, cy = (r.y0 + r.y1) / 2;
    const a0 = [(cx - a.x) / a.k, (cy - a.y) / a.k], b0 = [(cx - b.x) / b.k, (cy - b.y) / b.k];
    const lk0 = Math.log(a.k), lk1 = Math.log(b.k);
    const t0 = performance.now();
    const tick = () => {
      const u = clamp((performance.now() - t0) / ms, 0, 1);
      const e = u >= 1 ? 1 : 1 - Math.pow(2, -10 * u);
      const k = Math.exp(lk0 + (lk1 - lk0) * e);
      const wx = a0[0] + (b0[0] - a0[0]) * e, wy = a0[1] + (b0[1] - a0[1]) * e;
      zoom.transform(sel, d3.zoomIdentity.translate(cx - wx * k, cy - wy * k).scale(k));
      if (u < 1) flying.raf = requestAnimationFrame(tick);
      else { flying = null; if (done) done(); }
    };
    flying = { raf: 0 };
    tick();
  }
  zoom.on('start.fly', e => { if (e.sourceEvent) stopFly(); });
  zoom.interpolate(d3.interpolate);

  const ALL_LL = S.countries.map(c => placeLL(c.id));
  function homeView() {
    if (PHONE.matches) return fitLL([[50, 60], [-47, 178]], { pad: { l: 24, r: 24, t: 90, b: 80 }, kMax: 40 });
    return fitLL(ALL_LL, { pad: { l: 90, r: 90, t: 120, b: 100 }, kMax: 40 });
  }
  function diveView(cid) {
    const lls = [placeLL(cid), ...photosOf(cid).map(id => SLIDES[id].ll).filter(Boolean)];
    const kLow = Math.max(T.k * 2.2, 6);
    return fitLL(lls, { pad: { l: 120, r: 120, t: 150, b: 150 }, kMin: Math.min(kLow, 40), kMax: 40 });
  }

  let raf = 0;
  function schedule() { if (!raf) raf = requestAnimationFrame(frame); }
  function frame() {
    raf = 0;
    draw();
    placeMarks();
    placeSpot();
    $('#zoom-in').disabled = T.k >= K_MAX * 0.999;
    $('#zoom-out').disabled = T.k <= kMin * 1.001;
  }

  /* ------------------------------------------------------------ the marks: ring, leader, caption */

  const marksEl = $('#marks');
  const capsEl = $('#caps');
  const SVGNS = 'http://www.w3.org/2000/svg';
  const MARKS = [];
  const R_RING = 11, R_TIGHT = 6.5;

  // a ring drawn by hand: a loop that wobbles a little and overlaps its start
  function ringD(seed, r) {
    let s = seed * 2654435761 % 2147483647 || 1;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const n = 40, a0 = -Math.PI * 0.6 + (rnd() - 0.5) * 0.6, span = Math.PI * 2 * (1.07 + rnd() * 0.05);
    const ph = rnd() * 6.28, amp = 0.04 + rnd() * 0.035, ph2 = rnd() * 6.28;
    let d = '';
    for (let i = 0; i <= n; i++) {
      const a = a0 + span * i / n;
      const drift = i > n - 6 ? 0.012 * (i - n + 6) : 0;
      const rr = r * (1 + amp * Math.sin(a * 2 + ph) + 0.022 * Math.sin(a * 5 + ph2) + drift);
      d += (i ? 'L' : 'M') + (Math.cos(a) * rr).toFixed(2) + ' ' + (Math.sin(a) * rr).toFixed(2);
    }
    return d;
  }

  function buildMarks() {
    S.countries.forEach((c, i) => {
      const g = document.createElementNS(SVGNS, 'g');
      g.setAttribute('class', 'mark');
      const lead = document.createElementNS(SVGNS, 'path');
      lead.setAttribute('class', 'mark__lead');
      const ring = document.createElementNS(SVGNS, 'path');
      ring.setAttribute('class', 'mark__ring');
      ring.setAttribute('pathLength', '1');
      const hit = document.createElementNS(SVGNS, 'circle');
      hit.setAttribute('class', 'mark__hit');
      hit.setAttribute('r', '22');
      g.append(lead, ring, hit);
      marksEl.appendChild(g);
      const cap = document.createElement('button');
      cap.type = 'button';
      cap.className = 'cap cap--name';
      cap.dataset.c = c.id;
      capsEl.appendChild(cap);
      const ll = placeLL(c.id);
      const m = { cid: c.id, i, g, lead, ring, hit, cap, w: proj([ll[1], ll[0]]), x: 0, y: 0, r: R_RING, rDrawn: 0, side: 0, full: { w: 0, h: 0 }, name: { w: 0, h: 0 }, bx: 0, by: 0, ax: 0, ay: 0, held: false, inView: false, inAt: 0 };
      MARKS.push(m);
      hit.addEventListener('click', () => dive(c.id));
      cap.addEventListener('click', () => dive(c.id));
      cap.addEventListener('focus', () => { wake(m); if (!pointerDown) ensureVisible(m); });
      cap.addEventListener('blur', () => { if (awake === m) wake(null); });
    });
    paintMarks();
  }

  function paintMarks() {
    for (const m of MARKS) {
      const c = COUNTRY[m.cid];
      m.cap.innerHTML = `<p class="cap__note">${esc(L(c.note))}</p><p class="cap__name">${nameHTML(m.cid)}</p><p class="cap__ll">${esc(coords(placeLL(m.cid)))}</p>`;
      m.cap.setAttribute('aria-label', t('dive', nameText(m.cid)));
    }
    measureCaps();
  }

  function measureCaps() {
    for (const m of MARKS) {
      const was = m.cap.classList.contains('cap--name');
      m.cap.classList.remove('cap--name');
      m.full = { w: m.cap.offsetWidth, h: m.cap.offsetHeight };
      m.cap.classList.add('cap--name');
      m.name = { w: m.cap.offsetWidth, h: m.cap.offsetHeight };
      m.cap.classList.toggle('cap--name', was);
    }
  }

  const preloaded = new Set();
  function preload(id) {
    if (!id || !SLIDES[id] || preloaded.has(id)) return;
    preloaded.add(id);
    const im = new Image();
    im.src = img(SLIDES[id].file, 1280);
  }

  let awake = null;
  function wake(m) {
    if (awake === m) return;
    if (awake) { awake.g.classList.remove('is-awake'); awake.cap.classList.remove('is-awake'); groupAwake(awake.cid, false); }
    awake = m;
    if (m) { m.g.classList.add('is-awake'); m.cap.classList.add('is-awake'); groupAwake(m.cid, true); preload((BOOK_OF[m.cid] || {}).photo); }
    schedule();
  }

  const SIDES = [
    // dx, dy of the block corner from the ring; which corner is the anchor
    { id: 0, sx: 1, sy: -1 }, { id: 1, sx: -1, sy: -1 }, { id: 2, sx: 1, sy: 1 }, { id: 3, sx: -1, sy: 1 },
  ];
  const overlap = (a, b, pad) => !(a[2] + pad < b[0] || a[0] - pad > b[2] || a[3] + pad < b[1] || a[1] - pad > b[3]);

  function placeMarks() {
    const k = T.k;
    const rect = mapRect();
    const fullZoom = k >= K_FULL;
    // what the captions must keep clear of: the words at the edges
    const reserved = [[rect.x0, rect.y0, rect.x0 + 250, rect.y0 + 64], [rect.x1 - 280, rect.y0, rect.x1, rect.y0 + 64], [rect.x0, rect.y1 - 56, rect.x0 + 360, rect.y1]];
    const taken = [];
    for (const m of MARKS) {
      m.x = m.w[0] * k + T.x; m.y = m.w[1] * k + T.y;
      m.g.setAttribute('transform', `translate(${m.x.toFixed(1)} ${m.y.toFixed(1)})`);
      if (m.r !== m.rDrawn) { m.ring.setAttribute('d', ringD(m.i + 3, m.r)); m.rDrawn = m.r; }
      const on = m.x > rect.x0 - 40 && m.x < rect.x1 + 40 && m.y > rect.y0 - 40 && m.y < rect.y1 + 40;
      if (on && !m.inView) { m.inView = true; setTimeout(() => m.g.classList.add('is-in'), 90 * (m.i % 6)); }
      else if (!on && m.inView && (m.x < rect.x0 - 240 || m.x > rect.x1 + 240 || m.y < rect.y0 - 240 || m.y > rect.y1 + 240)) { m.inView = false; m.g.classList.remove('is-in'); }
      taken.push([m.x - m.r, m.y - m.r, m.x + m.r, m.y + m.r]);
    }
    const order = MARKS.slice().sort((a, b) => (rank(b) - rank(a)) || (a.i - b.i));
    const blocks = [];
    for (const m of order) {
      const live = m === awake || m.cap === document.activeElement || m.g.classList.contains('is-live');
      if (m.held) { blocks.push([m.bx, m.by, m.bx + m.full.w, m.by + m.full.h]); leader(m); continue; }
      const full = fullZoom || live;
      const size = full ? m.full : m.name;
      const gap = 18;
      const onScreen = m.x > rect.x0 - 20 && m.x < rect.x1 + 20 && m.y > rect.y0 - 20 && m.y < rect.y1 + 20;
      let placed = null;
      if (onScreen) {
        const tries = [SIDES[m.side], ...SIDES.filter(s => s.id !== m.side)];
        for (const s of tries) {
          const bx = s.sx > 0 ? m.x + gap : m.x - gap - size.w;
          const by = s.sy > 0 ? m.y + gap : m.y - gap - size.h;
          const box = [bx, by, bx + size.w, by + size.h];
          if (box[0] < rect.x0 + 8 || box[2] > rect.x1 - 8 || box[1] < rect.y0 + 8 || box[3] > rect.y1 - 8) continue;
          if (!live && reserved.some(r => overlap(box, r, 0))) continue;
          if (!live && blocks.some(b => overlap(box, b, 10))) continue;
          if (!live && taken.some((b, j) => MARKS[j] !== m && overlap(box, b, 6))) continue;
          placed = { s, bx, by, box };
          break;
        }
        if (!placed && live) {
          const s = SIDES[m.side];
          const bx = clamp(s.sx > 0 ? m.x + gap : m.x - gap - size.w, rect.x0 + 8, rect.x1 - 8 - size.w);
          const by = clamp(s.sy > 0 ? m.y + gap : m.y - gap - size.h, rect.y0 + 8, rect.y1 - 8 - size.h);
          placed = { s, bx, by, box: [bx, by, bx + size.w, by + size.h] };
        }
      }
      const el = m.cap;
      el.classList.toggle('cap--name', !full);
      if (placed) {
        m.side = placed.s.id;
        m.bx = placed.bx; m.by = placed.by;
        m.ax = placed.s.sx > 0 ? placed.bx : placed.bx + size.w;
        m.ay = placed.s.sy > 0 ? placed.by : placed.by + size.h;
        blocks.push(placed.box);
        el.style.setProperty('--x', m.bx.toFixed(1));
        el.style.setProperty('--y', m.by.toFixed(1));
        el.classList.toggle('cap--w', placed.s.sx < 0);
        el.classList.remove('is-quiet');
        m.g.classList.remove('is-quiet');
        leader(m);
      } else {
        el.classList.add('is-quiet');
        m.g.classList.add('is-quiet');
      }
    }
  }
  const rank = m => (m.g.classList.contains('is-live') ? 3 : m === awake ? 2 : m.cap === document.activeElement ? 2 : 0);

  // the leader: leaves the ring on the side of the caption, arrives at the caption's corner
  function leader(m) {
    const dx = m.ax - m.x, dy = m.ay - m.y;
    const ang = Math.atan2(dy, dx);
    const sx = m.x + Math.cos(ang) * (m.r + 2.5), sy = m.y + Math.sin(ang) * (m.r + 2.5);
    const c1x = sx + (m.ax - sx) * 0.12, c1y = sy + (m.ay - sy) * 0.62;
    const c2x = m.ax - (m.ax - sx) * 0.38, c2y = m.ay;
    m.lead.setAttribute('d', `M${(sx - m.x).toFixed(1)} ${(sy - m.y).toFixed(1)}C${(c1x - m.x).toFixed(1)} ${(c1y - m.y).toFixed(1)} ${(c2x - m.x).toFixed(1)} ${(c2y - m.y).toFixed(1)} ${(m.ax - m.x).toFixed(1)} ${(m.ay - m.y).toFixed(1)}`);
  }

  function ensureVisible(m, ms = 600) {
    const r = mapRect();
    const pad = 110;
    const x = m.w[0] * T.k + T.x, y = m.w[1] * T.k + T.y;
    if (x > r.x0 + pad && x < r.x1 - pad && y > r.y0 + pad && y < r.y1 - pad) return;
    const tx = clamp(x, r.x0 + pad, r.x1 - pad), ty = clamp(y, r.y0 + pad, r.y1 - pad);
    sel.interrupt();
    if (RM.matches) zoom.translateBy(sel, (tx - x) / T.k, (ty - y) / T.k);
    else zoom.translateBy(sel.transition().duration(ms).ease(d3.easeCubicOut), (tx - x) / T.k, (ty - y) / T.k);
  }

  // a photograph's own spot, ringed while its thumbnail is under the pointer
  const spot = document.createElementNS(SVGNS, 'path');
  spot.setAttribute('class', 'spot');
  spot.setAttribute('pathLength', '1');
  spot.setAttribute('d', ringD(41, 8));
  marksEl.appendChild(spot);
  let spotW = null;
  function showSpot(id) {
    const s = id && SLIDES[id];
    if (!s || !s.ll) { spotW = null; spot.classList.remove('is-in'); return; }
    spotW = proj([s.ll[1], s.ll[0]]);
    placeSpot();
    spot.classList.add('is-in');
    const x = spotW[0] * T.k + T.x, y = spotW[1] * T.k + T.y;
    const r = mapRect(), pad = 90;
    if (x < r.x0 + pad || x > r.x1 - pad || y < r.y0 + pad || y > r.y1 - pad) {
      const tx = clamp(x, r.x0 + pad, r.x1 - pad), ty = clamp(y, r.y0 + pad, r.y1 - pad);
      sel.interrupt();
      if (RM.matches) zoom.translateBy(sel, (tx - x) / T.k, (ty - y) / T.k);
      else zoom.translateBy(sel.transition().duration(700).ease(d3.easeCubicOut), (tx - x) / T.k, (ty - y) / T.k);
    }
  }
  function placeSpot() {
    if (!spotW) return;
    spot.setAttribute('transform', `translate(${(spotW[0] * T.k + T.x).toFixed(1)} ${(spotW[1] * T.k + T.y).toFixed(1)})`);
  }

  /* ------------------------------------------------------------ the index of photographs */

  const indexBody = $('#index-body');
  const indexScroll = $('#index-scroll');
  const indexHead = $('#index-head');

  function renderIndex() {
    const n = Object.keys(SLIDES).length;
    $('#index-count').textContent = t('count', n, S.countries.length);
    indexBody.innerHTML = S.countries.map(c => {
      const ids = photosOf(c.id);
      const thumbs = ids.map(id => {
        const s = SLIDES[id];
        return `<li><button type="button" class="thumb" data-slide="${id}" data-c="${c.id}" aria-label="${esc(t('coverOf', L(s.place)))}"><img src="${img(s.file, 640)}" alt="" width="${s.w}" height="${s.h}" loading="lazy" decoding="async"><span class="thumb__name">${esc(L(s.place))}</span></button></li>`;
      }).join('');
      return `<section class="group" data-c="${c.id}" aria-labelledby="g-${c.id}">
        <h3><button type="button" class="group__name" id="g-${c.id}" data-c="${c.id}" aria-label="${esc(t('dive', nameText(c.id)))}">${nameHTML(c.id)}</button><span class="group__meta">${esc(L(c.date))}${ids.length ? ' · ' + ids.length : ''}</span></h3>
        ${ids.length ? `<ul class="thumbs">${thumbs}</ul>` : `<p class="group__none">${esc(t('bandNone'))}</p>`}
      </section>`;
    }).join('');
  }
  function groupAwake(cid, on) {
    const g = indexBody.querySelector(`.group[data-c="${cid}"]`);
    if (g) g.classList.toggle('is-awake', on);
  }
  const markOf = cid => MARKS.find(m => m.cid === cid);

  let thumbAwake = null;
  function thumbOver(el) {
    if (thumbAwake === el) return;
    if (thumbAwake) thumbAwake.classList.remove('is-awake');
    thumbAwake = el;
    if (el) { el.classList.add('is-awake'); showSpot(el.dataset.slide); wake(markOf(el.dataset.c)); preload(el.dataset.slide); }
    else { showSpot(null); }
  }
  indexBody.addEventListener('pointerover', e => {
    if (e.pointerType !== 'mouse') return;
    const th = e.target.closest('.thumb'), gn = e.target.closest('.group__name');
    if (th) thumbOver(th);
    else if (gn) { thumbOver(null); const m = markOf(gn.dataset.c); wake(m); ensureVisible(m); }
  });
  indexBody.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { thumbOver(null); wake(null); } });
  indexBody.addEventListener('focusin', e => {
    const th = e.target.closest('.thumb'), gn = e.target.closest('.group__name');
    if (th) thumbOver(th);
    else if (gn) { thumbOver(null); const m = markOf(gn.dataset.c); wake(m); ensureVisible(m); }
  });
  indexBody.addEventListener('focusout', e => { if (!indexBody.contains(e.relatedTarget)) { thumbOver(null); wake(null); } });
  indexBody.addEventListener('click', e => {
    const th = e.target.closest('.thumb'), gn = e.target.closest('.group__name');
    if (th) dive(th.dataset.c, th.dataset.slide);
    else if (gn) dive(gn.dataset.c);
  });

  function indexDrawer() {
    if (PHONE.matches) {
      indexHead.removeAttribute('tabindex');
      indexHead.setAttribute('aria-expanded', String(indexEl.classList.contains('is-open')));
      indexHead.setAttribute('aria-label', indexEl.classList.contains('is-open') ? t('hideIndex') : t('showIndex'));
    } else {
      indexEl.classList.remove('is-open');
      indexHead.setAttribute('tabindex', '-1');
      indexHead.removeAttribute('aria-expanded');
      indexHead.removeAttribute('aria-label');
    }
  }
  indexHead.addEventListener('click', () => {
    if (!PHONE.matches) return;
    indexEl.classList.toggle('is-open');
    indexDrawer();
  });

  /* ------------------------------------------------------------ the dive: from the ring into the photograph */

  const reader = $('#reader');
  const readerScroll = $('#reader-scroll');
  const readerContent = $('#reader-content');
  const flipEl = $('#flip');
  const appEl = $('#app');
  let open = null;

  function coverHTML(cid, coverId) {
    const c = COUNTRY[cid];
    const cap = `<div class="cover__cap" id="cover-cap"><p class="cover__note">${esc(L(c.note))}</p><p class="cover__name">${nameHTML(cid)}</p><p class="cover__ll">${esc(coords(placeLL(cid)))}</p></div>`;
    if (!coverId) return `<section class="cover cover--none">${cap}</section>`;
    const s = SLIDES[coverId];
    return `<section class="cover"><img class="cover__img" id="cover-img" src="${img(s.file, 1280)}" srcset="${img(s.file, 1280)} 1280w, ${img(s.file)} 2400w" sizes="100vw" width="${s.w}" height="${s.h}" alt="${esc(L(s.alt))}" decoding="async" fetchpriority="high"><div class="cover__shade"></div>${cap}</section>`;
  }

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

  const pageEnd = () => `<footer class="page-end"><button class="word" type="button" data-back>${esc(t('back'))}</button><span>${esc(t('endLine'))}</span></footer>`;

  function renderGuide(cid, coverId) {
    const b = BOOK_OF[cid], g = S.guides[b.guide];
    readerContent.innerHTML = coverHTML(cid, coverId) + `<article class="guide">${g.html}</article>`;
    fillGuide(readerContent, g.i18n[lang] || g.i18n.en);
    const h1 = $('h1', readerContent);
    h1.id = 'reader-title';
    h1.tabIndex = -1;
    const meta = $('.guide-top .meta', readerContent);
    if (meta) meta.insertAdjacentHTML('afterend', `<p class="guide-facts">${esc(L(g.facts))}</p>`);
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

  function renderPlace(cid, coverId) {
    const c = COUNTRY[cid], ids = photosOf(cid);
    let body;
    if (ids.length) {
      body = `<div class="rows">${rowsOf(ids).map(r => `<div class="row">${r.row.map(([id, ar]) => {
        const s = SLIDES[id];
        return `<figure class="piece" data-ar="${ar.toFixed(4)}"><button type="button" data-view="${ids.indexOf(id)}" aria-label="${esc(t('made', L(s.place)))}"><img src="${img(s.file, 1280)}" srcset="${img(s.file, 640)} 640w, ${img(s.file, 1280)} 1280w, ${img(s.file)} 2400w" sizes="(max-width: 48rem) 94vw, 40vw" width="${s.w}" height="${s.h}" alt="${esc(L(s.alt))}" loading="lazy" decoding="async" data-ar="${ar.toFixed(4)}"></button><figcaption><b>${esc(L(s.place))}</b><span>${esc(L(s.where))}</span></figcaption></figure>`;
      }).join('')}${r.last && r.sum < 2.2 && !PHONE.matches ? `<span class="piece" aria-hidden="true" data-ar="${(2.7 - r.sum).toFixed(4)}"></span>` : ''}</div>`).join('')}</div>`;
    } else {
      body = `<div class="no-photos"><b>${esc(t('bandNone'))}</b></div>`;
    }
    readerContent.innerHTML = coverHTML(cid, coverId) + `<div class="wrap">
      <header class="place-top">
        <h1 class="page-title" id="reader-title" tabindex="-1">${esc(L(c.name))}</h1>
        <p class="meta">${esc(L(c.date))}${ids.length ? ' · ' + esc(t('nPhotos', ids.length)) : ''}</p>
        ${ids.length ? `<p class="page-lede">${esc(L(c.note))}</p>` : ''}
        <p class="quiet-line">${esc(t('bookNot'))}</p>
      </header>${body}${pageEnd()}</div>`;
    $$('[data-ar]', readerContent).forEach(n => n.style.setProperty('--ar', n.dataset.ar));
    $$('[data-view]', readerContent).forEach(n => n.addEventListener('click', () => openViewer(ids, +n.dataset.view, n)));
  }

  function renderReader(cid, coverId) {
    const b = BOOK_OF[cid];
    if (b && b.guide && S.guides[b.guide]) renderGuide(cid, coverId); else renderPlace(cid, coverId);
    $$('[data-back]', readerContent).forEach(n => n.addEventListener('click', () => closeDive()));
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

  const circleAt = (r, x, y) => `circle(${r.toFixed(1)}px at ${x.toFixed(1)}px ${y.toFixed(1)}px)`;
  const farCorner = (x, y) => Math.max(Math.hypot(x, y), Math.hypot(innerWidth - x, y), Math.hypot(x, innerHeight - y), Math.hypot(innerWidth - x, innerHeight - y)) + 8;

  // the caption travels: a copy of the map caption glides to the cover's caption and takes its colour
  function flipCap(m, toCover, ms) {
    const real = $('#cover-cap');
    if (!real) return null;
    const clone = m.cap.cloneNode(true);
    clone.className = 'cap' + (toCover ? '' : ' is-light');
    clone.removeAttribute('aria-label');
    clone.tabIndex = -1;
    flipEl.replaceChildren(clone);
    const mapRectCap = { left: m.bx, top: m.by, width: m.full.w, height: m.full.h };
    const coverRect = real.getBoundingClientRect();
    const from = toCover ? mapRectCap : coverRect, to = toCover ? coverRect : mapRectCap;
    clone.style.setProperty('--x', to.left.toFixed(1));
    clone.style.setProperty('--y', to.top.toFixed(1));
    clone.classList.toggle('cap--w', m.side === 1 || m.side === 3);
    real.classList.add('is-hidden');
    m.cap.classList.add('is-lifting');
    const a = clone.animate([
      { transform: `translate(${from.left.toFixed(1)}px, ${from.top.toFixed(1)}px)` },
      { transform: `translate(${to.left.toFixed(1)}px, ${to.top.toFixed(1)}px)` },
    ], { duration: ms, easing: EASE, fill: 'both' });
    const colour = clone.animate([{ color: toCover ? 'oklch(23% 0.012 60)' : 'oklch(98.6% 0.005 85)' }, { color: toCover ? 'oklch(98.6% 0.005 85)' : 'oklch(23% 0.012 60)' }], { duration: ms * 0.6, delay: ms * 0.25, easing: 'ease-in-out', fill: 'both' });
    $$('.cap__note, .cap__name, .cap__ll, .cap__name i', clone).forEach(n => n.style.setProperty('color', 'inherit'));
    a.onfinish = () => {
      if (toCover) { real.classList.remove('is-hidden'); } else { m.cap.classList.remove('is-lifting'); }
      colour.cancel();
      flipEl.replaceChildren();
    };
    return a;
  }

  function dive(cid, coverId, opts = {}) {
    if (!COUNTRY[cid] || view) return;
    if (open && open.cid === cid && !open.closing) return;
    if (open) finishClose(true);
    const b = BOOK_OF[cid];
    const cover = (coverId && SLIDES[coverId] && SLIDES[coverId].country === cid) ? coverId : (b && b.photo) || photosOf(cid)[0] || null;
    const m = markOf(cid);
    const push = opts.push !== false;
    if (push) history.pushState({ place: cid }, '', '#' + hashOf(cid));
    open = { cid, cover, m, prevT: opts.prevT || T, pushed: push, phase: 'in', anims: [], timer: 0, trigger: opts.trigger || m.cap };
    thumbOver(null);
    wake(null);
    indexEl.classList.remove('is-open');
    indexDrawer();
    renderReader(cid, cover);
    reader.hidden = false;
    readerScroll.scrollTop = 0;
    document.body.classList.add('is-diving');
    m.g.classList.add('is-live');
    m.cap.classList.remove('is-quiet');
    document.title = `${nameText(cid)}, tuan photography 陳亮元`;
    const target = diveView(cid);
    const rx = m.w[0] * target.k + target.x, ry = m.w[1] * target.k + target.y;
    const instant = RM.matches || opts.animate === false;
    if (instant) {
      sel.call(zoom.transform, target);
      m.r = R_TIGHT;
      reader.style.removeProperty('--clip');
      const a = reader.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: 'ease-out' });
      open.anims = [a];
      a.onfinish = () => landed();
      return;
    }
    // the caption holds where it is while the map dives; the leader follows the ring
    placeMarks();
    m.held = true;
    reader.style.setProperty('--clip', circleAt(0, rx, ry));
    fly(target, 2000);
    tighten(m, R_TIGHT, 2000);
    open.timer = setTimeout(() => {
      if (!open || open.phase !== 'in') return;
      const R = farCorner(rx, ry);
      const a1 = reader.animate([{ clipPath: circleAt(m.r + 1, rx, ry) }, { clipPath: circleAt(R, rx, ry) }], { duration: 1150, easing: EASE, fill: 'both' });
      const im = $('#cover-img');
      let a2 = null;
      if (im) {
        im.style.setProperty('--ox', (rx / innerWidth * 100).toFixed(1) + '%');
        im.style.setProperty('--oy', (ry / innerHeight * 100).toFixed(1) + '%');
        a2 = im.animate([{ transform: 'scale(1.16)' }, { transform: 'scale(1)' }], { duration: 1500, easing: EASE, fill: 'both' });
      }
      const a3 = flipCap(m, true, 1100);
      open.anims = [a1, a2, a3].filter(Boolean);
      a1.onfinish = () => { if (open && open.anims[0] === a1) landed(); };
    }, 1150);
  }

  function tighten(m, r, ms) {
    const r0 = m.r, t0 = performance.now();
    if (m.tick) cancelAnimationFrame(m.tick);
    const step = () => {
      const u = clamp((performance.now() - t0) / ms, 0, 1);
      const e = 1 - Math.pow(2, -10 * u);
      m.r = r0 + (r - r0) * (u >= 1 ? 1 : e);
      schedule();
      if (u < 1) m.tick = requestAnimationFrame(step); else m.tick = 0;
    };
    step();
  }

  function landed() {
    if (!open) return;
    open.phase = 'open';
    open.anims = [];
    reader.getAnimations().forEach(a => a.cancel());
    reader.style.removeProperty('--clip');
    const im = $('#cover-img'); if (im) im.getAnimations().forEach(a => a.cancel());
    document.body.classList.remove('is-diving');
    document.body.classList.add('is-reading');
    appEl.inert = true;
    $('#reader-back').focus({ preventScroll: true });
  }

  function closeDive(opts = {}) {
    if (!open || open.closing) return;
    if (!opts.fromPop && open.pushed) { history.back(); return; }
    if (!opts.fromPop && !open.pushed) history.replaceState(null, '', location.pathname + location.search);
    const o = open, m = o.m;
    o.closing = true;
    clearTimeout(o.timer);
    appEl.inert = false;
    document.body.classList.remove('is-reading');
    document.body.classList.add('is-diving');
    document.title = 'tuan photography 陳亮元';
    if (RM.matches || opts.animate === false) {
      const a = reader.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: 'ease-in', fill: 'both' });
      sel.call(zoom.transform, o.prevT);
      a.onfinish = () => finishClose();
      return;
    }
    if (o.phase === 'in') {
      // still diving: run the whole thing backwards
      o.anims.forEach(a => a.reverse());
      flipEl.replaceChildren();
      m.cap.classList.remove('is-lifting');
      const real = $('#cover-cap'); if (real) real.classList.remove('is-hidden');
      fly(o.prevT, 1300, () => finishClose());
      tighten(m, R_RING, 1300);
      if (o.anims.length) { o.anims[0].onfinish = () => { reader.hidden = true; }; }
      else reader.hidden = true;
      return;
    }
    readerScroll.scrollTo({ top: 0, behavior: 'instant' });
    const rx = m.w[0] * T.k + T.x, ry = m.w[1] * T.k + T.y;
    const R = farCorner(rx, ry);
    const a1 = reader.animate([{ clipPath: circleAt(R, rx, ry) }, { clipPath: circleAt(R_TIGHT + 1, rx, ry) }], { duration: 950, easing: 'cubic-bezier(0.7, 0, 0.3, 1)', fill: 'both' });
    const im = $('#cover-img');
    if (im) im.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }], { duration: 950, easing: 'cubic-bezier(0.7, 0, 0.3, 1)', fill: 'both' });
    flipCap(m, false, 900);
    o.anims = [a1];
    setTimeout(() => {
      if (open !== o) return;
      fly(o.prevT, 1500, () => finishClose());
      tighten(m, R_RING, 1500);
    }, 520);
    a1.onfinish = () => { reader.hidden = true; m.held = false; schedule(); };
  }

  function finishClose(silent) {
    if (!open) return;
    const o = open, m = o.m;
    open = null;
    clearTimeout(o.timer);
    reader.getAnimations().forEach(a => a.cancel());
    reader.hidden = true;
    reader.style.removeProperty('--clip');
    readerContent.innerHTML = '';
    flipEl.replaceChildren();
    if (tocIO) { tocIO.disconnect(); tocIO = null; }
    document.body.classList.remove('is-diving', 'is-reading');
    appEl.inert = false;
    m.held = false;
    m.g.classList.remove('is-live');
    m.cap.classList.remove('is-lifting');
    if (m.tick) { cancelAnimationFrame(m.tick); m.tick = 0; }
    m.r = R_RING;
    schedule();
    if (!silent && o.trigger && document.contains(o.trigger)) o.trigger.focus({ preventScroll: true });
  }

  $('#reader-back').addEventListener('click', () => closeDive());

  function syncHash(first) {
    const cid = fromHash(location.hash);
    if (cid) {
      if (!open || open.cid !== cid || open.closing) {
        if (first) sel.call(zoom.transform, homeView());
        dive(cid, null, { push: false, animate: !first, prevT: first ? homeView() : undefined });
      }
    } else if (open) closeDive({ fromPop: true });
  }
  addEventListener('popstate', () => syncHash(false));

  /* ------------------------------------------------------------ a photograph, larger */

  const viewer = $('#viewer');
  let view = null;
  function slideFacts(s) {
    const set = [s.focal, s.aperture, s.shutter, s.iso && `ISO ${s.iso}`].filter(Boolean);
    let h = '';
    if (s.camera) h += `<dt>${esc(t('camera'))}</dt><dd>${esc(s.camera)}</dd>`;
    if (s.lens) h += `<dt>${esc(t('lens'))}</dt><dd>${esc(s.lens)}</dd>`;
    if (set.length) h += `<dt>${esc(t('settings'))}</dt><dd class="facts__set">${set.map(v => `<span>${esc(v)}</span>`).join('')}</dd>`;
    if (s.best) h += `<dt>${esc(t('best'))}</dt><dd>${esc(L(s.best))}</dd>`;
    return h ? `<dl class="facts">${h}</dl>` : '';
  }
  function openViewer(ids, i, opener) {
    view = { ids, i: clamp(i, 0, ids.length - 1), opener };
    viewer.hidden = false;
    reader.inert = true;
    $('#chrome').inert = true;
    paintViewer();
    $('#viewer-close').focus({ preventScroll: true });
  }
  function paintViewer() {
    if (!view) return;
    const id = view.ids[view.i], s = SLIDES[id];
    const im = new Image();
    im.srcset = `${img(s.file, 1280)} 1280w, ${img(s.file)} 2400w`;
    im.sizes = '(max-width: 48rem) 100vw, 75vw';
    im.src = img(s.file, 1280);
    im.alt = L(s.alt);
    im.width = s.w; im.height = s.h;
    $('.viewer__frame').replaceChildren(im);
    $('#viewer-cap').innerHTML = `<h2 id="viewer-title">${esc(L(s.place))}</h2><p class="meta">${esc(L(s.where))}</p>${s.note ? `<p class="viewer__note">${esc(L(s.note))}</p>` : ''}${slideFacts(s)}`;
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
    reader.inert = false;
    if (o && document.contains(o)) o.focus({ preventScroll: true });
  }
  const step = d => { if (!view) return; const n = clamp(view.i + d, 0, view.ids.length - 1); if (n !== view.i) { view.i = n; paintViewer(); } };
  $('#viewer-prev').addEventListener('click', () => step(-1));
  $('#viewer-next').addEventListener('click', () => step(1));
  $('#viewer-close').addEventListener('click', closeViewer);
  let sx = null;
  viewer.addEventListener('pointerdown', e => { sx = e.clientX; });
  viewer.addEventListener('pointerup', e => { if (sx != null && Math.abs(e.clientX - sx) > 60) step(e.clientX < sx ? 1 : -1); sx = null; });

  /* ------------------------------------------------------------ keys and pointer */

  document.addEventListener('keydown', e => {
    if (view) {
      if (e.key === 'Escape') { e.preventDefault(); closeViewer(); }
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'Tab') trap(e, viewer);
      return;
    }
    if (open) { if (e.key === 'Escape') { e.preventDefault(); closeDive(); } return; }
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
    else if (e.key === '0') { e.preventDefault(); fly(homeView(), 1100); }
  });
  function zoomBy(f) {
    sel.interrupt();
    if (RM.matches) zoom.scaleBy(sel, f); else zoom.scaleBy(sel.transition().duration(340).ease(d3.easeCubicOut), f);
  }
  $('#zoom-in').addEventListener('click', () => zoomBy(2));
  $('#zoom-out').addEventListener('click', () => zoomBy(0.5));
  $('#zoom-world').addEventListener('click', () => fly(homeView(), 1200));

  let pointerDown = false;
  mapEl.addEventListener('pointerdown', () => { pointerDown = true; }, true);
  addEventListener('pointerup', () => { setTimeout(() => { pointerDown = false; }, 0); });

  // a place wakes when the pointer comes near its ring or onto its caption, and stays awake
  // while the pointer is anywhere around them, so the caption can grow without losing it
  let hoverRaf = 0, lastMove = null;
  const nearMark = (m, x, y, pad) => {
    if (Math.hypot(x - m.x, y - m.y) < m.r + pad) return true;
    if (m.cap.classList.contains('is-quiet')) return false;
    const w = m.cap.offsetWidth, h = m.cap.offsetHeight;
    return x > m.bx - pad && x < m.bx + w + pad && y > m.by - pad && y < m.by + h + pad;
  };
  mapEl.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || e.buttons) return;
    lastMove = e;
    if (!hoverRaf) hoverRaf = requestAnimationFrame(() => {
      hoverRaf = 0;
      const ev = lastMove, r = mapEl.getBoundingClientRect();
      const x = ev.clientX - r.left, y = ev.clientY - r.top;
      if (awake && awake.cap !== document.activeElement && nearMark(awake, x, y, 26)) return;
      let best = null, bd = 30;
      for (const m of MARKS) { const d = Math.hypot(x - m.x, y - m.y) - m.r; if (d < bd) { bd = d; best = m; } }
      if (!best) best = MARKS.find(m => nearMark(m, x, y, 6)) || null;
      if (best !== awake && (best || (awake && awake.cap !== document.activeElement))) wake(best);
    });
  });
  mapEl.addEventListener('pointerleave', () => { if (awake && awake.cap !== document.activeElement) wake(null); });

  /* ------------------------------------------------------------ language */

  function applyLang(first) {
    document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en';
    $$('[data-t]').forEach(n => { n.textContent = t(n.dataset.t); });
    $$('[data-t-aria]').forEach(n => n.setAttribute('aria-label', t(n.dataset.tAria)));
    $$('.lang__btn').forEach(n => n.setAttribute('aria-pressed', String(n.dataset.lang === lang)));
    $('.ig').setAttribute('aria-label', `${t('follow')}, @${S.instagram.handle}`);
    renderIndex();
    indexDrawer();
    if (first) return;
    paintMarks();
    if (open) {
      const top = readerScroll.scrollTop;
      renderReader(open.cid, open.cover);
      readerScroll.scrollTop = top;
      document.title = `${nameText(open.cid)}, tuan photography 陳亮元`;
    }
    if (view) paintViewer();
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
    readColours();
    applyLang(true);
    sizeMap();
    sel.call(zoom).on('dblclick.zoom', null);
    sel.on('dblclick.map', e => {
      if (e.target.closest('.cap, .mark__hit')) return;
      const p = d3.pointer(e, mapEl);
      sel.interrupt();
      if (RM.matches) zoom.scaleBy(sel, e.shiftKey ? 0.5 : 2, p);
      else zoom.scaleBy(sel.transition().duration(420).ease(d3.easeCubicOut), e.shiftKey ? 0.5 : 2, p);
    });
    buildMarks();
    sel.call(zoom.transform, homeView());
    schedule();
    try {
      const topo = await fetch('../vendor/countries-110m.json').then(r => r.json());
      G110 = shapesFromCountries(topo);
      schedule();
    } catch (e) { /* the marks still stand on the sea */ }
    syncHash(true);
    if (document.fonts) document.fonts.ready.then(() => { measureCaps(); schedule(); });
    const idle = window.requestIdleCallback || (f => setTimeout(f, 300));
    idle(async () => {
      try {
        const [land, countries] = await Promise.all([
          fetch('../vendor/land-50m.json').then(r => r.json()),
          fetch('../vendor/countries-50m.json').then(r => r.json()),
        ]);
        const fine = shapesFromCountries(countries);
        G50 = { land: toPath(topojson.feature(land, land.objects.land)), been: fine.been };
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
      indexDrawer();
      sel.call(zoom.transform, d3.zoomIdentity.translate(vw / 2 - c[0] * T.k, vh / 2 - c[1] * T.k).scale(Math.max(T.k, kMin)));
      measureCaps();
      schedule();
    });
  });

  start();
})();

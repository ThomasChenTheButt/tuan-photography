/* tuan photography 陳亮元 · design 2 · "Circled atlas"
   The map plate is drawn on a canvas (one ink, redrawn on every move), the books stand on it as
   HTML, and a red biro draws circles and lines on an SVG layer above both. The index of
   photographs is a scrolling column of stamps beside the plate. */
(() => {
  'use strict';

  const S = window.SITE;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = matchMedia('(max-width: 47.99rem)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ------------------------------------------------------------ words */

  const T = {
    en: {
      ig: 'Instagram',
      plateTitle: 'Places travelled',
      plateLine: 'Open a book for its photographs and its guide.',
      mapAria: 'Map of the places travelled. Drag or use the arrow keys to move it, plus and minus to zoom. Tab moves through the books.',
      keyBeen: 'Travelled', keyHome: 'Home base', keyRoute: 'Route, in trip order', keyPhoto: 'Where a photograph was made',
      zoomGroup: 'Map controls', zoomIn: 'Zoom in', zoomOut: 'Zoom out', zoomAll: 'Whole route',
      indexTitle: 'Index of photographs',
      count: (n, p) => `${n} photographs, ${p} places`,
      photosN: (n) => (n === 1 ? '1 photograph' : `${n} photographs`),
      seePhotos: 'See the photographs',
      prev: 'Previous', next: 'Next',
      camera: 'Camera', lens: 'Lens', focal: 'Focal length', aperture: 'Aperture', shutter: 'Shutter', iso: 'ISO',
      ofN: (i, n) => `${i} of ${n}`,
      made: (p) => `${p}: how this was made`,
      lang: 'Language',
      seas: { pacific: 'Pacific Ocean', indian: 'Indian Ocean', atlantic: 'Atlantic Ocean' },
      opening: (p) => `${p} is open.`,
    },
    zh: {
      ig: 'Instagram',
      plateTitle: '走過的地方',
      plateLine: '打開一本書，看它的照片與攻略。',
      mapAria: '走過的地方地圖。拖曳或用方向鍵移動，加號與減號縮放，Tab 鍵逐一走過每本書。',
      keyBeen: '去過', keyHome: '大本營', keyRoute: '路線，依旅行先後', keyPhoto: '照片拍攝地點',
      zoomGroup: '地圖控制', zoomIn: '放大', zoomOut: '縮小', zoomAll: '整條路線',
      indexTitle: '照片索引',
      count: (n, p) => `${n} 張照片，${p} 個地方`,
      photosN: (n) => `${n} 張照片`,
      seePhotos: '看照片',
      prev: '上一張', next: '下一張',
      camera: '相機', lens: '鏡頭', focal: '焦距', aperture: '光圈', shutter: '快門', iso: 'ISO',
      ofN: (i, n) => `第 ${i} 張，共 ${n} 張`,
      made: (p) => `${p}：這張怎麼拍`,
      lang: '語言',
      seas: { pacific: '太平洋', indian: '印度洋', atlantic: '大西洋' },
      opening: (p) => `已打開 ${p}。`,
    },
  };

  let lang = 'en';
  try {
    const q = new URLSearchParams(location.search).get('lang');
    const saved = localStorage.getItem('tlap-lang');
    if (q === 'zh' || q === 'en') lang = q;
    else if (saved === 'zh' || saved === 'en') lang = saved;
  } catch (e) { /* storage blocked: stay in English */ }

  const t = (k) => (T[lang][k] !== undefined ? T[lang][k] : (S.i18n[lang][k] !== undefined ? S.i18n[lang][k] : k));
  const L = (o) => (o ? (o[lang] !== undefined ? o[lang] : o.en) : '');

  /* ------------------------------------------------------------ data */

  const countries = Object.fromEntries(S.countries.map((c) => [c.id, c]));
  const books = S.books.map((b) => ({ ...b, view: b.guide ? `guide-${b.guide}` : `place-${b.country}` }));
  const bookByCountry = Object.fromEntries(books.map((b) => [b.country, b]));
  const guide = S.guides.barcelona;

  // trip order, read from the dates in the data; Taiwan, the home base, starts the route
  const when = (c) => {
    if (c.id === S.home) return -1;
    const d = c.date.en;
    const m = d.match(/(\d{4})(?:\.(\d{1,2}))?/);
    if (!m) return 99999;
    const mo = m[2] ? +m[2] : (/summer/i.test(d) ? 7 : 6);
    return +m[1] * 12 + mo;
  };
  const trip = S.countries.map((c, i) => ({ c, i })).sort((a, b) => when(a.c) - when(b.c) || a.i - b.i).map((x) => x.c);
  const placeLL = (cid) => (cid === guide.country ? guide.ll : countries[cid].ll);
  const indexOrder = trip.flatMap((c) => c.photos);

  // the plate runs from 135°W to 225°E (centred on 45°E) in twelve columns of 30°, A to L,
  // and from 80°N to 80°S in eight rows of 20°, 1 to 8
  const LON0 = -135;
  const COLS = 'ABCDEFGHIJKL';
  const gridRef = ([lat, lon]) => {
    const col = Math.floor((((lon - LON0) % 360) + 360) % 360 / 30);
    const row = Math.min(7, Math.max(0, Math.floor((80 - lat) / 20)));
    return COLS[col] + (row + 1);
  };
  const dms = (v, pos, neg) => {
    const a = Math.abs(v);
    let d = Math.floor(a);
    let m = Math.round((a - d) * 60);
    if (m === 60) { d += 1; m = 0; }
    return `${d}°${String(m).padStart(2, '0')}′${v >= 0 ? pos : neg}`;
  };
  const coords = ([lat, lon]) => `${dms(lat, 'N', 'S')} ${dms(lon, 'E', 'W')}`;
  const refHTML = (ll) => `<span class="code">${gridRef(ll)}</span> <span>${coords(ll)}</span>`;

  const imgSrc = (s, size) => `../images/web/${size ? size + '/' : ''}${s.file}`;
  const srcset = (s) => `${imgSrc(s, 640)} 640w, ${imgSrc(s, 1280)} 1280w, ${imgSrc(s)} ${s.w}w`;

  /* ------------------------------------------------------------ elements */

  const html = document.documentElement;
  const spread = $('#spread');
  const plate = $('#plate');
  const canvas = $('#map-canvas');
  const ctx = canvas.getContext('2d');
  const mapEl = $('#map');
  const pinsEl = $('#pins');
  const penMap = $('#pen-map');
  const indexBody = $('#index-body');
  const indexScroll = $('#index-scroll');
  const leaf = $('#leaf');
  const leafScroll = $('#leaf-scroll');
  const leafContent = $('#leaf-content');
  const viewer = $('#viewer');
  const fly = $('#fly');
  const live = $('#live');
  const SVGNS = 'http://www.w3.org/2000/svg';

  /* ------------------------------------------------------------ the pen */

  // a hand-drawn ring: a little more than one turn, wobbling, never closing exactly
  function ringD(r, rx = 1) {
    const n = 30;
    const start = Math.random() * Math.PI * 2;
    const turns = 1.1 + Math.random() * 0.12;
    const stretch = 1 + (Math.random() - 0.5) * 0.16;
    const rot = Math.random() * Math.PI;
    const ph = Math.random() * 6;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const th = start + (turns * Math.PI * 2 * i) / n;
      const rr = r * (1 + 0.05 * Math.sin(3 * th + ph) + (Math.random() - 0.5) * 0.03) * (1 + 0.07 * (i / n));
      const x = Math.cos(th) * rr * stretch * rx;
      const y = Math.sin(th) * rr;
      pts.push([x * Math.cos(rot) - y * Math.sin(rot), x * Math.sin(rot) + y * Math.cos(rot)]);
    }
    return d3.line().curve(d3.curveCatmullRom.alpha(0.5))(pts);
  }
  // a pen line between two points, bowed a little and not quite straight
  function lineD(a, b, bow = 0.12) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const k = len * bow;
    const p1 = [a[0] + dx * 0.33 + nx * k, a[1] + dy * 0.33 + ny * k];
    const p2 = [a[0] + dx * 0.7 + nx * k * 0.8, a[1] + dy * 0.7 + ny * k * 0.8];
    return `M${a[0].toFixed(1)},${a[1].toFixed(1)} C${p1[0].toFixed(1)},${p1[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)} ${b[0].toFixed(1)},${b[1].toFixed(1)}`;
  }
  function drawStroke(path, delay = 0, dur = 420) {
    if (reduce.matches) return null;
    const len = path.getTotalLength();
    path.style.strokeDasharray = `${len} ${len + 4}`;
    path.style.strokeDashoffset = len;
    const a = path.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: dur, delay, easing: 'cubic-bezier(0.45, 0.05, 0.25, 1)', fill: 'forwards' });
    a.onfinish = () => { path.style.strokeDasharray = ''; path.style.strokeDashoffset = ''; a.cancel(); };
    return a;
  }
  function erase(nodes) {
    nodes.forEach((n) => {
      n.classList.add('fading');
      setTimeout(() => n.remove(), 300);
    });
  }

  /* ------------------------------------------------------------ the map */

  const state = {
    W: 0, H: 0, rule: 22, dpr: 1, S0: 1,
    z: d3.zoomIdentity,
    world110: null, world50: null, land110: null, land50: null,
    feats110: {}, feats50: {}, mesh110: null, mesh50: null,
    hatch: null, screen: null,
    drawQueued: false, settle: 0,
  };
  const proj0 = d3.geoMercator().rotate([-45, 0]).precision(0.6);
  const proj = d3.geoMercator().rotate([-45, 0]).precision(0.6);
  const path = d3.geoPath(proj, ctx);
  const Y80 = Math.log(Math.tan(Math.PI / 4 + (80 * Math.PI) / 360)); // mercator y of 80°

  function sizeMap() {
    const box = plate.getBoundingClientRect();
    const rule = parseFloat(getComputedStyle(mapEl).left) || 22;
    state.rule = rule;
    state.FW = box.width; state.FH = box.height;
    state.W = Math.max(1, box.width - rule * 2);
    state.H = Math.max(1, box.height - rule * 2);
    state.dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(box.width * state.dpr);
    canvas.height = Math.round(box.height * state.dpr);
    state.S0 = state.W / (2 * Math.PI);
    proj0.scale(state.S0).translate([state.W / 2, state.H / 2]);
    makePatterns();
    zoom.extent([[0, 0], [state.W, state.H]])
      .translateExtent([[0, state.H / 2 - state.S0 * Y80], [state.W, state.H / 2 + state.S0 * Y80]]);
    penMap.setAttribute('viewBox', `0 0 ${state.W} ${state.H}`);
  }

  function makePatterns() {
    const d = state.dpr;
    // the sea: fine ruled lines, as engraved water
    const h = document.createElement('canvas');
    h.width = Math.round(4 * d); h.height = Math.round(4 * d);
    const hc = h.getContext('2d');
    hc.strokeStyle = 'rgba(31, 52, 92, 0.32)';
    hc.lineWidth = 0.7 * d;
    hc.beginPath(); hc.moveTo(0, 2 * d); hc.lineTo(4 * d, 2 * d); hc.stroke();
    state.hatch = ctx.createPattern(h, 'repeat');
    // travelled land: a printer's dot screen of the same ink
    const s = document.createElement('canvas');
    s.width = Math.round(3.2 * d); s.height = Math.round(3.2 * d);
    const sc = s.getContext('2d');
    sc.fillStyle = 'rgba(31, 52, 92, 0.85)';
    sc.beginPath(); sc.arc(1.6 * d, 1.6 * d, 0.62 * d, 0, Math.PI * 2); sc.fill();
    state.screen = ctx.createPattern(s, 'repeat');
  }

  const INK = 'rgb(31, 52, 92)';
  const INKA = (a) => `rgba(31, 52, 92, ${a})`;
  const PEN = 'rgb(196, 44, 40)';
  const PENA = (a) => `rgba(196, 44, 40, ${a})`;
  const PAPER = 'rgb(237, 239, 242)';
  const PAPERHI = 'rgb(249, 250, 251)';

  // screen position (inside the map) of a [lat, lon]
  const P = (ll) => {
    const p = proj0([ll[1], ll[0]]);
    return [state.z.applyX(p[0]), state.z.applyY(p[1])];
  };

  const SEAS = [
    { id: 'pacific', ll: [12, 156] },
    { id: 'indian', ll: [-22, 76] },
    { id: 'atlantic', ll: [22, -42] },
  ];

  function draw() {
    state.drawQueued = false;
    const { W, H, rule, dpr, z } = state;
    const k = z.k;
    const scale = state.S0 * k;
    proj.scale(scale).translate([z.x + k * state.W / 2, z.y + k * state.H / 2]).clipExtent([[-20, -20], [W + 20, H + 20]]);
    const fine = scale > 520 && state.world50;
    const land = fine ? state.land50 : state.land110;
    const feats = fine ? state.feats50 : state.feats110;
    const mesh = fine ? state.mesh50 : state.mesh110;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, state.FW, state.FH);

    ctx.save();
    ctx.translate(rule, rule);
    ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();

    // sea
    const m = new DOMMatrix().translateSelf(((z.x % 4) + 4) % 4, ((z.y % 4) + 4) % 4).scaleSelf(1 / dpr, 1 / dpr);
    state.hatch.setTransform(m);
    ctx.fillStyle = state.hatch;
    ctx.fillRect(0, 0, W, H);

    if (land) {
      // land
      ctx.beginPath(); path(land);
      ctx.fillStyle = PAPER; ctx.fill();
      // travelled countries in the dot screen; home in solid ink
      state.screen.setTransform(new DOMMatrix().translateSelf(((z.x % 3.2) + 3.2) % 3.2, ((z.y % 3.2) + 3.2) % 3.2).scaleSelf(1 / dpr, 1 / dpr));
      for (const c of S.countries) {
        const f = feats[c.id];
        if (!f) continue;
        ctx.beginPath(); path(f);
        ctx.fillStyle = c.id === S.home ? INK : state.screen;
        ctx.fill();
      }
      if (activeCountry() && feats[activeCountry()] && activeCountry() !== S.home) {
        ctx.beginPath(); path(feats[activeCountry()]);
        ctx.fillStyle = PENA(0.08); ctx.fill();
      }
      // borders, dotted as in an atlas
      ctx.setLineDash([1.5, 2]);
      ctx.lineWidth = 0.6;
      ctx.strokeStyle = INKA(0.55);
      ctx.beginPath(); path(mesh); ctx.stroke();
      ctx.setLineDash([]);
      // coastline
      ctx.lineWidth = Math.min(1.2, 0.7 + k * 0.03);
      ctx.strokeStyle = INK;
      ctx.beginPath(); path(land); ctx.stroke();
      // travelled countries' outlines a touch heavier
      ctx.lineWidth = 1;
      for (const c of S.countries) {
        const f = feats[c.id];
        if (!f) continue;
        ctx.beginPath(); path(f); ctx.stroke();
      }
    }

    // the reference grid: 30° by 20°, finer as you come closer
    const lonX = (lon) => z.applyX(state.W / 2 + state.S0 * ((lon - 45) * Math.PI) / 180);
    const latY = (lat) => proj([45, lat])[1];
    if (scale > 900) {
      ctx.strokeStyle = INKA(0.16); ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let lon = LON0; lon <= LON0 + 360; lon += 5) { const x = lonX(lon); if (x > -1 && x < W + 1) { ctx.moveTo(x, 0); ctx.lineTo(x, H); } }
      for (let lat = -80; lat <= 80; lat += 5) { const y = latY(lat); if (y > -1 && y < H + 1) { ctx.moveTo(0, y); ctx.lineTo(W, y); } }
      ctx.stroke();
    }
    ctx.strokeStyle = INKA(0.5); ctx.lineWidth = 0.75;
    ctx.beginPath();
    for (let i = 0; i <= 12; i++) { const x = lonX(LON0 + i * 30); ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let j = 0; j <= 8; j++) { const y = latY(80 - j * 20); ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();

    // oceans, named in italic as the atlas does
    if (k < 7) {
      ctx.save();
      ctx.fillStyle = INKA(0.62);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = lang === 'zh' ? '500 13px "Noto Sans TC", sans-serif' : 'italic 500 12px Archivo, sans-serif';
      try { ctx.letterSpacing = lang === 'zh' ? '8px' : '5px'; } catch (e) { /* older engines */ }
      for (const s of SEAS) {
        const p = proj([s.ll[1], s.ll[0]]);
        const label = T[lang].seas[s.id];
        const w = ctx.measureText(label).width + 16;
        ctx.save();
        ctx.fillStyle = PAPER;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(p[0] - w / 2, p[1] - 9, w, 18);
        ctx.restore();
        ctx.fillText(lang === 'zh' ? label : label.toUpperCase(), p[0], p[1]);
      }
      ctx.restore();
    }

    // the planned route, in pen, faint
    const pts = trip.map((c) => P(placeLL(c.id)));
    ctx.save();
    ctx.strokeStyle = PENA(0.5);
    ctx.lineWidth = 1.3;
    ctx.setLineDash([5, 4]);
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const len = Math.hypot(dx, dy);
      const bow = Math.min(0.22, 18 / Math.max(len, 1) + 0.08) * (i % 2 ? 1 : -1);
      const cx = (a[0] + b[0]) / 2 - dy * bow, cy = (a[1] + b[1]) / 2 + dx * bow;
      ctx.moveTo(a[0], a[1]);
      ctx.quadraticCurveTo(cx, cy, b[0], b[1]);
    }
    ctx.stroke();
    ctx.restore();

    // where each photograph was made, once close enough to tell them apart
    const close = scale > 700;
    plate.classList.toggle('is-close', close);
    state.photoPts = [];
    if (close) {
      for (const id of indexOrder) {
        const s = S.slides[id];
        const p = P(s.ll);
        if (p[0] < -10 || p[1] < -10 || p[0] > W + 10 || p[1] > H + 10) continue;
        state.photoPts.push({ id, p });
        ctx.beginPath(); ctx.arc(p[0], p[1], 3.2, 0, Math.PI * 2);
        ctx.fillStyle = PAPERHI; ctx.fill();
        ctx.lineWidth = 1; ctx.strokeStyle = INK; ctx.stroke();
        ctx.beginPath(); ctx.arc(p[0], p[1], 1.4, 0, Math.PI * 2);
        ctx.fillStyle = INK; ctx.fill();
      }
    }

    // books: leaders from where a book stands to its place, then the place symbol
    layoutPins();
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = INKA(0.75);
    for (const b of pinList) {
      const dx = b.x - b.ax, dy = b.y - b.ay;
      if (Math.hypot(dx, dy) > 6) {
        ctx.beginPath(); ctx.moveTo(b.ax, b.ay); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
    for (const b of pinList) {
      ctx.beginPath();
      if (b.country === S.home) {
        ctx.rect(b.ax - 3.5, b.ay - 3.5, 7, 7);
        ctx.fillStyle = INK; ctx.fill();
        ctx.lineWidth = 1.2; ctx.strokeStyle = PAPERHI; ctx.stroke();
      } else {
        ctx.arc(b.ax, b.ay, 3.6, 0, Math.PI * 2);
        ctx.fillStyle = PAPERHI; ctx.fill();
        ctx.lineWidth = 1.3; ctx.strokeStyle = INK; ctx.stroke();
        ctx.beginPath(); ctx.arc(b.ax, b.ay, 1.3, 0, Math.PI * 2); ctx.fillStyle = INK; ctx.fill();
      }
    }
    ctx.restore();

    drawRuler(lonX, latY);
    placePen();
    if (state.settle > 0) { state.settle -= 1; queueDraw(); }
  }

  function drawRuler(lonX, latY) {
    const { rule, W, H, FW, FH } = state;
    const inner = rule;
    // neat lines
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0.75, 0.75, FW - 1.5, FH - 1.5);
    ctx.lineWidth = 1;
    ctx.strokeRect(inner - 0.5, inner - 0.5, W + 1, H + 1);
    // the degree border: alternate 10° bands in ink and paper, as atlas plates are edged
    const band = 4;
    ctx.save();
    ctx.beginPath(); ctx.rect(inner, 0, W, FH); ctx.clip();
    for (let lon = LON0; lon < LON0 + 360; lon += 10) {
      const x0 = inner + lonX(lon), x1 = inner + lonX(lon + 10);
      if (x1 < inner || x0 > inner + W) continue;
      if ((((lon - LON0) / 10) % 2 + 2) % 2 === 0) {
        ctx.fillStyle = INK;
        ctx.fillRect(x0, inner - band - 1, x1 - x0, band);
        ctx.fillRect(x0, inner + H + 1, x1 - x0, band);
      }
    }
    ctx.restore();
    ctx.save();
    ctx.beginPath(); ctx.rect(0, inner, FW, H); ctx.clip();
    for (let lat = -80; lat < 80; lat += 10) {
      const y0 = inner + latY(lat + 10), y1 = inner + latY(lat);
      if (((lat + 80) / 10) % 2 === 0) {
        ctx.fillStyle = INK;
        ctx.fillRect(inner - band - 1, y0, band, y1 - y0);
        ctx.fillRect(inner + W + 1, y0, band, y1 - y0);
      }
    }
    ctx.restore();
    ctx.strokeStyle = INK; ctx.lineWidth = 0.75;
    ctx.strokeRect(inner - band - 1.5, inner - band - 1.5, W + band * 2 + 3, H + band * 2 + 3);

    // letters across, numbers down, each in the middle of its visible stretch
    const tw = Math.max(0, inner - band - 2);
    ctx.fillStyle = INK;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '700 10px Archivo, sans-serif';
    try { ctx.fontStretch = 'condensed'; ctx.letterSpacing = '0px'; } catch (e) { /* fine */ }
    for (let i = 0; i < 12; i++) {
      let a = lonX(LON0 + i * 30), b = lonX(LON0 + (i + 1) * 30);
      a = Math.max(a, 0); b = Math.min(b, W);
      if (b - a < 14) continue;
      const x = inner + (a + b) / 2;
      ctx.fillText(COLS[i], x, tw / 2 + 0.5);
      ctx.fillText(COLS[i], x, FH - tw / 2 - 0.5);
    }
    for (let j = 0; j < 8; j++) {
      let a = latY(80 - j * 20), b = latY(80 - (j + 1) * 20);
      a = Math.max(a, 0); b = Math.min(b, H);
      if (b - a < 14) continue;
      const y = inner + (a + b) / 2;
      ctx.fillText(String(j + 1), tw / 2 + 0.5, y);
      ctx.fillText(String(j + 1), FW - tw / 2 - 0.5, y);
    }
  }

  function queueDraw() {
    if (state.drawQueued) return;
    state.drawQueued = true;
    requestAnimationFrame(draw);
  }

  /* ------------------------------------------------------------ zoom and pan */

  const zoom = d3.zoom()
    .scaleExtent([1, 90])
    .on('start', (e) => { if (e.sourceEvent && e.sourceEvent.type !== 'wheel') mapEl.classList.add('is-dragging'); })
    .on('zoom', (e) => { state.z = e.transform; state.settle = 24; queueDraw(); updateZoomButtons(); })
    .on('end', () => mapEl.classList.remove('is-dragging'));
  const sel = d3.select(mapEl);
  sel.call(zoom).on('dblclick.zoom', null);
  // double-click zooms in on the point, except on a book (that opens it)
  mapEl.addEventListener('dblclick', (e) => {
    if (e.target.closest('.book')) return;
    const r = mapEl.getBoundingClientRect();
    sel.transition().duration(reduce.matches ? 0 : 450).ease(d3.easeExpOut).call(zoom.scaleBy, e.shiftKey ? 0.5 : 2, [e.clientX - r.left, e.clientY - r.top]);
  });

  function moveTo(target, dur = 900) {
    // zoom.transform does not keep to the plate's edges by itself; clamp it as a drag would
    const transform = zoom.constrain()(target, [[0, 0], [state.W, state.H]], zoom.translateExtent());
    const d = reduce.matches ? 0 : dur;
    if (d === 0) sel.interrupt().call(zoom.transform, transform);
    else sel.interrupt().transition().duration(d).ease(d3.easeExpOut).call(zoom.transform, transform);
  }
  function fitTransform(lls, pad) {
    const pts = lls.map((ll) => proj0([ll[1], ll[0]]));
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const { W, H } = state;
    const k = Math.max(1, Math.min(90, Math.min((W - pad.l - pad.r) / Math.max(1, x1 - x0), (H - pad.t - pad.b) / Math.max(1, y1 - y0))));
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const sx = pad.l + (W - pad.l - pad.r) / 2, sy = pad.t + (H - pad.t - pad.b) / 2;
    return d3.zoomIdentity.translate(sx - cx * k, sy - cy * k).scale(k);
  }
  function homeTransform() {
    const small = narrow.matches;
    const pad = small ? { l: 40, r: 44, t: 80, b: 92 } : { l: 46, r: 56, t: 150, b: 70 };
    // a phone opens on home: Taiwan and the places around it; the route leads off to the rest
    const near = small ? trip.filter((c) => (c.continent === 'asia' && c.id !== 'dubai') || c.continent === 'oceania') : trip;
    return fitTransform(near.map((c) => placeLL(c.id)), pad);
  }
  function centerOn(ll, k, dur) {
    const p = proj0([ll[1], ll[0]]);
    const kk = k || state.z.k;
    moveTo(d3.zoomIdentity.translate(state.W / 2 - p[0] * kk, state.H / 2 + 30 - p[1] * kk).scale(kk), dur);
  }
  function inView(ll, margin = 0.15) {
    const p = P(ll);
    return p[0] > state.W * margin && p[0] < state.W * (1 - margin) && p[1] > state.H * margin && p[1] < state.H * (1 - margin);
  }

  const zIn = $('#zoom-in'), zOut = $('#zoom-out'), zAll = $('#zoom-all');
  const zoomBy = (f) => sel.interrupt().transition().duration(reduce.matches ? 0 : 420).ease(d3.easeExpOut).call(zoom.scaleBy, f);
  zIn.addEventListener('click', () => zoomBy(2));
  zOut.addEventListener('click', () => zoomBy(0.5));
  zAll.addEventListener('click', () => moveTo(homeTransform()));
  function updateZoomButtons() {
    zIn.disabled = state.z.k >= 89.9;
    zOut.disabled = state.z.k <= 1.001;
  }

  mapEl.addEventListener('keydown', (e) => {
    if (e.target !== mapEl) return;
    const step = 90;
    const pan = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }[e.key];
    if (pan) {
      e.preventDefault();
      sel.interrupt().transition().duration(reduce.matches ? 0 : 260).ease(d3.easeExpOut).call(zoom.translateBy, pan[0] / state.z.k, pan[1] / state.z.k);
    } else if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomBy(2); }
    else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomBy(0.5); }
    else if (e.key === '0') { e.preventDefault(); moveTo(homeTransform()); }
  });

  /* ------------------------------------------------------------ books standing on the map */

  let pinList = [];
  function bookStatus(b) {
    if (b.band === 'bandNone') return t('bandNone');
    return t(b.status);
  }
  function renderPins() {
    const keep = new Map(pinList.map((p) => [p.id, p]));
    pinsEl.textContent = '';
    pinList = trip.map((c) => {
      const b = bookByCountry[c.id];
      const title = esc(L(b.title));
      const s = b.photo ? S.slides[b.photo] : null;
      const face = s
        ? `<span class="book__face"><img src="${imgSrc(s, 640)}" alt="" width="${s.w}" height="${s.h}" decoding="async">`
        : `<span class="book__face book__face--blank"><b>${title}</b>`;
      const el = document.createElement('div');
      el.className = 'pin' + (c.id === S.home ? ' is-home' : '');
      el.dataset.country = c.id;
      el.innerHTML =
        `<div class="pin__stage"><a class="book book--${b.tone}" href="#${b.view}" aria-label="${esc(`${L(b.title)}: ${bookStatus(b)}`)}" data-view="${b.view}"><span class="book__box">` +
        `<span class="book__spine"><b>${title}</b><i>${esc(t('series'))}</i></span>` +
        `${face}<span class="book__band"><b>${title}</b><span>${esc(t(b.band))}</span></span></span>` +
        `<span class="book__back"><i>${esc(t('series'))}</i></span><span class="book__edge"></span>` +
        `<span class="book__top"></span><span class="book__shadow"></span></span></a></div>` +
        `<div class="pin__label" aria-hidden="true"><b>${title}</b><span>${esc(c.id === S.home ? `${t('keyHome')}${lang === 'zh' ? '，' : ', '}${bookStatus(b)}` : bookStatus(b))}</span></div>`;
      pinsEl.appendChild(el);
      const prev = keep.get(b.id);
      return {
        id: b.id, country: c.id, book: b, el,
        ll: placeLL(c.id),
        x: prev ? prev.x : NaN, y: prev ? prev.y : NaN, ax: 0, ay: 0,
        lw: 0,
      };
    });
    for (const p of pinList) p.lw = p.el.querySelector('.pin__label').offsetWidth;
    bindPins();
  }

  function bookScale() {
    const k = state.z.k;
    const small = narrow.matches;
    const base = small ? 0.15 : 0.24;
    const max = small ? 0.3 : 0.46;
    return Math.min(max, base * Math.pow(k / (small ? 1.6 : 1.4), 0.32));
  }

  function layoutPins() {
    const s = bookScale();
    const small = narrow.matches;
    const bw = 192 * s, bh = 272 * s;
    const below = small ? 4 : 20;
    for (const p of pinList) {
      const a = P(p.ll);
      p.ax = a[0]; p.ay = a[1];
      if (Number.isNaN(p.x)) { p.x = p.ax; p.y = p.ay; }
      // on a phone the books may stand closer than their names; names then give way
      p.hw = small ? bw / 2 + 2 : Math.max(bw / 2 + 3, p.lw / 2 + 2);
    }
    // pulled toward its place, pushed apart from its neighbours: books never cover each other
    const pull = 0.3;
    for (const p of pinList) { p.x += (p.ax - p.x) * pull; p.y += (p.ay - p.y) * pull; }
    for (let it = 0; it < 10; it++) {
      for (let i = 0; i < pinList.length; i++) {
        const a = pinList[i];
        for (let j = i + 1; j < pinList.length; j++) {
          const b = pinList[j];
          const ox = a.hw + b.hw - Math.abs(a.x - b.x);
          if (ox <= 0) continue;
          // vertical extent: book above the foot, label below it
          const aTop = a.y - bh - 4, aBot = a.y + below, bTop = b.y - bh - 4, bBot = b.y + below;
          const oy = Math.min(aBot, bBot) - Math.max(aTop, bTop);
          if (oy <= 0) continue;
          if (ox < oy * (small ? 2.4 : 1.1)) {
            const dir = a.x < b.x || (a.x === b.x && i < j) ? -1 : 1;
            a.x += (dir * ox) / 2; b.x -= (dir * ox) / 2;
          } else {
            const dir = a.y < b.y ? -1 : 1;
            a.y += (dir * oy) / 2; b.y -= (dir * oy) / 2;
          }
        }
      }
    }
    // names that would sit on another book or name stay hidden until their book wakes
    const taken = [];
    for (const p of pinList) {
      const r = [p.x - p.lw / 2, p.y + 4, p.x + p.lw / 2, p.y + 20];
      let free = true;
      if (small) {
        for (const q of pinList) {
          if (q === p) continue;
          if (r[0] < q.x + bw / 2 && r[2] > q.x - bw / 2 && r[1] < q.y && r[3] > q.y - bh) { free = false; break; }
        }
        if (free) for (const t2 of taken) if (r[0] < t2[2] && r[2] > t2[0] && r[1] < t2[3] && r[3] > t2[1]) { free = false; break; }
        if (p.country === S.home) free = true; // home base keeps its name
        if (free) taken.push(r);
      }
      p.el.classList.toggle('is-quiet', !free);
    }
    for (const p of pinList) {
      p.el.style.setProperty('--x', `${p.x.toFixed(1)}px`);
      p.el.style.setProperty('--y', `${p.y.toFixed(1)}px`);
      p.el.style.setProperty('--s', s.toFixed(3));
    }
  }

  function bindPins() {
    for (const p of pinList) {
      const a = p.el.querySelector('.book');
      a.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') setActive({ country: p.country, from: 'map' }); });
      a.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') clearActiveSoon(); });
      a.addEventListener('focus', () => {
        setActive({ country: p.country, from: 'map' });
        if (!inView(p.ll, 0.08)) centerOn(p.ll, Math.max(state.z.k, homeTransform().k), 600);
      });
      a.addEventListener('blur', () => clearActiveSoon());
      a.addEventListener('click', (e) => {
        e.preventDefault();
        go(p.book.view, { from: p });
      });
    }
  }

  /* ------------------------------------------------------------ what is circled */

  let active = null; // { country } or { slide }
  let marks = []; // svg nodes on the map
  let stampMarks = [];
  let clearTimer = 0;
  let easeTimer = 0;
  const activeCountry = () => (active ? active.country || (active.slide && S.slides[active.slide].country) : null);

  function sameActive(a, b) {
    return a && b && a.country === b.country && a.slide === b.slide;
  }
  function setActive(next) {
    clearTimeout(clearTimer);
    if (sameActive(active, next)) return;
    const prevCountry = activeCountry();
    erase(marks); marks = [];
    erase(stampMarks); stampMarks = [];
    active = next;
    const cid = activeCountry();
    pinList.forEach((p) => p.el.classList.toggle('awake', p.country === cid));
    if (prevCountry !== cid) queueDraw();

    // on the map: the pen circles the place, then draws a line to its book
    const pin = pinList.find((p) => p.country === cid);
    if (next.slide) {
      const s = S.slides[next.slide];
      const ring = penPath('ring', ringD(13));
      ring.dataset.ll = JSON.stringify(s.ll);
      marks.push(ring);
      if (pin) {
        const line = penPath('line', '');
        line.dataset.from = JSON.stringify(s.ll);
        line.dataset.pin = pin.id;
        marks.push(line);
      }
    } else if (pin) {
      const ring = penPath('ring', ringD(19, 1.15));
      ring.dataset.ll = JSON.stringify(pin.ll);
      marks.push(ring);
    }
    placePen();
    marks.forEach((m, i) => drawStroke(m, i * 340, i ? 380 : 440));

    // in the index: the pen circles the stamps
    const ids = next.slide ? [next.slide] : (countries[cid] ? countries[cid].photos : []);
    ids.forEach((id, i) => {
      const st = stampEls.get(id);
      if (!st) return;
      const svg = st.querySelector('svg.pen');
      const p = document.createElementNS(SVGNS, 'path');
      p.setAttribute('class', 'ring');
      p.setAttribute('d', ringD(46, 1));
      p.setAttribute('transform', 'translate(50 50)');
      p.setAttribute('vector-effect', 'non-scaling-stroke');
      svg.appendChild(p);
      stampMarks.push(p);
      drawStroke(p, Math.min(i, 8) * 60, 420);
      st.classList.add('is-ringed');
    });
    $$('.stamp.is-ringed').forEach((st) => { if (!ids.includes(st.dataset.slide)) st.classList.remove('is-ringed'); });

    // a place picked on the map brings its stamps into view in the index
    if (next.from === 'map' && cid) {
      clearTimeout(easeTimer);
      easeTimer = setTimeout(() => revealGroup(cid), 260);
    }
    // a stamp picked in the index brings its place into view on the map
    if (next.from === 'index' && next.slide) {
      clearTimeout(easeTimer);
      easeTimer = setTimeout(() => {
        const ll = S.slides[next.slide].ll;
        if (!inView(ll, 0.12)) centerOn(ll, state.z.k, 900);
      }, 380);
    }
  }
  function clearActive() {
    erase(marks); marks = [];
    erase(stampMarks); stampMarks = [];
    $$('.stamp.is-ringed').forEach((st) => st.classList.remove('is-ringed'));
    pinList.forEach((p) => p.el.classList.remove('awake'));
    const had = activeCountry();
    active = null;
    clearTimeout(easeTimer);
    if (had) queueDraw();
  }
  function clearActiveSoon() {
    clearTimeout(clearTimer);
    clearTimer = setTimeout(clearActive, 160);
  }
  function penPath(cls, d) {
    const p = document.createElementNS(SVGNS, 'path');
    p.setAttribute('class', cls);
    p.setAttribute('d', d);
    penMap.appendChild(p);
    return p;
  }
  // keep the pen marks on their places as the map moves
  function placePen() {
    for (const m of marks) {
      if (m.dataset.ll) {
        const p = P(JSON.parse(m.dataset.ll));
        m.setAttribute('transform', `translate(${p[0].toFixed(1)} ${p[1].toFixed(1)})`);
      } else if (m.dataset.from) {
        const a = P(JSON.parse(m.dataset.from));
        const pin = pinList.find((x) => x.id === m.dataset.pin);
        if (!pin) continue;
        const s = bookScale();
        const b = [pin.x, pin.y - 272 * s * 0.5];
        const dx = b[0] - a[0], dy = b[1] - a[1];
        const len = Math.hypot(dx, dy);
        if (len < 34) { m.setAttribute('d', ''); continue; }
        const start = [a[0] + (dx / len) * 15, a[1] + (dy / len) * 15];
        const end = [b[0] - (dx / len) * (192 * s * 0.5 + 6), b[1] - (dy / len) * (192 * s * 0.5 + 6)];
        const d = lineD(start, end, 0.1);
        if (m.getAttribute('d') !== d) m.setAttribute('d', d);
      }
    }
  }

  /* hovering the map itself: a photograph's dot, a place, or a travelled country */
  let hoverQueued = false, lastMove = null;
  function hitTest(x, y) {
    if (state.photoPts) {
      let best = null, bd = 11;
      for (const q of state.photoPts) {
        const d = Math.hypot(q.p[0] - x, q.p[1] - y);
        if (d < bd) { bd = d; best = q.id; }
      }
      if (best) return { slide: best };
    }
    for (const p of pinList) if (Math.hypot(p.ax - x, p.ay - y) < 14) return { country: p.country };
    const ll = proj.invert([x, y]);
    if (!ll) return null;
    const feats = state.z.k * state.S0 > 520 && state.world50 ? state.feats50 : state.feats110;
    for (const c of S.countries) {
      const f = feats[c.id];
      if (f && d3.geoContains(f, ll)) return { country: c.id };
    }
    return null;
  }
  mapEl.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || e.buttons) return;
    lastMove = e;
    if (hoverQueued) return;
    hoverQueued = true;
    requestAnimationFrame(() => {
      hoverQueued = false;
      const ev = lastMove;
      if (ev.target.closest && ev.target.closest('.book')) return;
      const r = mapEl.getBoundingClientRect();
      const hit = hitTest(ev.clientX - r.left, ev.clientY - r.top);
      mapEl.style.cursor = hit ? 'pointer' : '';
      if (hit) setActive({ ...hit, from: 'map' });
      else if (active) clearActiveSoon();
    });
  });
  mapEl.addEventListener('pointerleave', () => { mapEl.style.cursor = ''; clearActiveSoon(); });
  mapEl.addEventListener('click', (e) => {
    if (e.target.closest('.book') || e.defaultPrevented) return;
    const r = mapEl.getBoundingClientRect();
    const hit = hitTest(e.clientX - r.left, e.clientY - r.top);
    if (!hit) return;
    if (hit.slide) openViewer(hit.slide, indexOrder, { from: 'map' });
    else {
      const p = pinList.find((x) => x.country === hit.country);
      if (p) go(p.book.view, { from: p });
    }
  });

  /* ------------------------------------------------------------ the index of stamps */

  const stampEls = new Map();
  function renderIndex() {
    stampEls.clear();
    $('#index-count').textContent = T[lang].count(indexOrder.length, S.countries.length);
    indexBody.innerHTML = trip.map((c) => {
      const b = bookByCountry[c.id];
      const go = b.guide ? t('bookOpen') : (c.photos.length ? T[lang].seePhotos : t('bandNone'));
      const meta = [c.id === S.home ? t('keyHome') : '', L(c.date)].filter(Boolean).join(lang === 'zh' ? '，' : ', ');
      const stamps = c.photos.map((id) => {
        const s = S.slides[id];
        return `<li><button type="button" class="stamp" data-slide="${id}" aria-label="${esc(T[lang].made(L(s.place)))}">` +
          `<span class="stamp__img"><img src="${imgSrc(s, 640)}" alt="" loading="lazy" decoding="async" width="${s.w}" height="${s.h}"></span>` +
          `<span class="stamp__name">${esc(L(s.place))}</span>` +
          `<span class="stamp__ref">${refHTML(s.ll)}</span>` +
          `<svg class="pen" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"></svg></button></li>`;
      }).join('');
      return `<section class="group" data-country="${c.id}" aria-labelledby="g-${c.id}">` +
        `<div class="group__head"><h3><button type="button" class="group__name" id="g-${c.id}" data-view="${b.view}">` +
        `<span class="group__title">${esc(L(c.name))}</span><span class="code">${gridRef(placeLL(c.id))}</span><span class="group__go">${esc(go)}</span></button></h3>` +
        `<span class="group__meta">${esc(meta)}</span></div>` +
        (stamps ? `<ul class="stamps">${stamps}</ul>` : `<p class="group__none">${esc(t('bandNone'))}</p>`) +
        `</section>`;
    }).join('');
    $$('.stamp', indexBody).forEach((st) => stampEls.set(st.dataset.slide, st));
  }
  indexBody.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    const st = e.target.closest('.stamp');
    const gn = e.target.closest('.group__name');
    if (st) setActive({ slide: st.dataset.slide, from: 'index' });
    else if (gn) setActive({ country: gn.closest('.group').dataset.country, from: 'index' });
  });
  indexBody.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') clearActiveSoon(); });
  indexBody.addEventListener('focusin', (e) => {
    const st = e.target.closest('.stamp');
    const gn = e.target.closest('.group__name');
    if (st) setActive({ slide: st.dataset.slide, from: 'index' });
    else if (gn) setActive({ country: gn.closest('.group').dataset.country, from: 'index' });
  });
  indexBody.addEventListener('click', (e) => {
    const st = e.target.closest('.stamp');
    const gn = e.target.closest('.group__name');
    if (st) openViewer(st.dataset.slide, indexOrder, { from: 'index' });
    else if (gn) {
      const p = pinList.find((x) => x.country === gn.closest('.group').dataset.country);
      go(gn.dataset.view, { from: p });
    }
  });
  function revealGroup(cid) {
    const g = indexBody.querySelector(`.group[data-country="${cid}"]`);
    if (!g) return;
    const top = g.offsetTop - indexBody.offsetTop;
    const view = indexScroll.scrollTop, vh = indexScroll.clientHeight;
    const seen = top >= view - 8 && top + Math.min(g.offsetHeight, vh * 0.6) <= view + vh;
    if (!seen) indexScroll.scrollTo({ top: top - 4, behavior: reduce.matches ? 'auto' : 'smooth' });
  }

  /* ------------------------------------------------------------ the leaf: pages */

  let page = null; // 'guide-barcelona' | 'place-<id>'
  let pageAnims = [];
  let tocObserver = null;

  function viewCountry(view) {
    if (view.startsWith('guide-')) return S.guides[view.slice(6)] ? S.guides[view.slice(6)].country : null;
    return view.slice(6);
  }
  function validView(view) {
    if (!view) return false;
    if (view.startsWith('guide-')) return !!S.guides[view.slice(6)];
    if (view.startsWith('place-')) return !!countries[view.slice(6)];
    return false;
  }

  function renderLeaf(view) {
    const cid = viewCountry(view);
    const c = countries[cid];
    const ll = view.startsWith('guide-') ? guide.ll : placeLL(cid);
    $('#leaf-ref').innerHTML = `${refHTML(ll)}`;
    if (tocObserver) { tocObserver.disconnect(); tocObserver = null; }
    if (view === 'guide-barcelona' || (cid === guide.country && view.startsWith('place-'))) {
      renderGuide();
    } else {
      renderPlace(c);
    }
  }

  function renderPlace(c) {
    const b = bookByCountry[c.id];
    const title = L(b.title);
    const name = L(c.name);
    const meta = [];
    if (name !== title) meta.push(`<span>${esc(name)}</span>`);
    if (c.id === S.home) meta.push(`<span>${esc(t('keyHome'))}</span>`);
    meta.push(`<span>${esc(L(c.date))}</span>`);
    if (c.photos.length) meta.push(`<span>${esc(T[lang].photosN(c.photos.length))}</span>`);
    meta.push(`<span>${refHTML(placeLL(c.id))}</span>`);
    let body;
    if (c.photos.length) {
      const wide = window.innerWidth > 900;
      const target = wide ? 3.3 : 2.2;
      const rows = [];
      let row = [], sum = 0;
      for (const id of c.photos) {
        const s = S.slides[id];
        const ar = s.w / s.h;
        row.push(id); sum += ar;
        if (sum >= target || row.length === 3) { rows.push(row); row = []; sum = 0; }
      }
      if (row.length) rows.push(row);
      body = `<div class="rows">${rows.map((r) => `<div class="row">${r.map((id) => {
        const s = S.slides[id];
        return `<figure class="piece" data-ar="${(s.w / s.h).toFixed(4)}"><button type="button" data-slide="${id}" aria-label="${esc(T[lang].made(L(s.place)))}">` +
          `<img src="${imgSrc(s, 1280)}" srcset="${srcset(s)}" sizes="(max-width: 48rem) 92vw, 40vw" width="${s.w}" height="${s.h}" alt="${esc(L(s.alt))}" loading="lazy" decoding="async"></button>` +
          `<figcaption><b>${esc(L(s.place))}</b><span>${esc(L(s.where))}</span></figcaption></figure>`;
      }).join('')}</div>`).join('')}</div>`;
    } else {
      body = `<div class="empty"><p>${esc(t('bandNone'))}</p><span>${esc(L(c.note))}</span></div>`;
    }
    leafContent.className = 'leaf__content place';
    leafContent.innerHTML =
      `<header class="page-head"><h1 class="page-title" id="leaf-title">${esc(title)}</h1>` +
      `<p class="page-line">${esc(L(c.note))}</p><p class="page-meta">${meta.join('')}</p></header>` +
      body +
      `<p class="page-note"><b>${esc(t('bookNot'))}</b></p>`;
    $$('.piece[data-ar]', leafContent).forEach((f) => f.style.setProperty('--ar', f.dataset.ar));
  }

  function renderGuide() {
    const dict = guide.i18n[lang] || guide.i18n.en;
    const slideText = (key) => {
      const m = key.match(/^(sp|sa|sl)_(.+)$/);
      if (!m || !S.slides[m[2]]) return null;
      const s = S.slides[m[2]];
      if (m[1] === 'sp') return L(s.place);
      if (m[1] === 'sa') return L(s.alt);
      return T[lang].made(L(s.place));
    };
    const get = (k) => (dict[k] !== undefined ? dict[k] : (slideText(k) !== null ? slideText(k) : (guide.i18n.en[k] !== undefined ? guide.i18n.en[k] : null)));
    leafContent.className = 'leaf__content guide';
    leafContent.innerHTML = guide.html;
    $$('[data-i18n]', leafContent).forEach((el) => { const v = get(el.dataset.i18n); if (v !== null) el.textContent = v; });
    $$('[data-i18n-html]', leafContent).forEach((el) => { const v = get(el.dataset.i18nHtml); if (v !== null) el.innerHTML = v; });
    $$('[data-i18n-alt]', leafContent).forEach((el) => { const v = get(el.dataset.i18nAlt); if (v !== null) el.alt = v; });
    $$('[data-i18n-aria]', leafContent).forEach((el) => { const v = get(el.dataset.i18nAria); if (v !== null) el.setAttribute('aria-label', v); });
    const h1 = $('h1', leafContent);
    if (h1) h1.id = 'leaf-title';
    const meta = $('.guide-top .meta', leafContent);
    if (meta) {
      const facts = document.createElement('p');
      facts.className = 'guide-facts';
      facts.textContent = L(guide.facts);
      meta.after(facts);
    }
    // the lead photograph is the first thing seen: fetch it now
    const lead = $('.guide-top img', leafContent);
    if (lead) { lead.loading = 'eager'; lead.fetchPriority = 'high'; }
    // the contents: the section being read is circled in pen
    const links = $$('.toc a', leafContent);
    const heads = links.map((a) => leafContent.querySelector(a.getAttribute('href'))).filter(Boolean);
    if ('IntersectionObserver' in window && heads.length) {
      tocObserver = new IntersectionObserver((entries) => {
        let topmost = null;
        for (const h of heads) {
          const r = h.getBoundingClientRect();
          if (r.top < window.innerHeight * 0.4) topmost = h;
        }
        links.forEach((a) => a.classList.toggle('is-here', !!topmost && a.getAttribute('href') === `#${topmost.id}`));
      }, { root: leafScroll, threshold: [0, 1], rootMargin: '0px 0px -55% 0px' });
      heads.forEach((h) => tocObserver.observe(h));
    }
  }

  leafContent.addEventListener('click', (e) => {
    const a = e.target.closest('a, button');
    if (!a) return;
    if (a.dataset.slide) {
      e.preventDefault();
      const list = $$('[data-slide]', leafContent).map((x) => x.dataset.slide).filter((v, i, arr) => arr.indexOf(v) === i);
      openViewer(a.dataset.slide, list, { from: 'page' });
      return;
    }
    const href = a.getAttribute('href') || '';
    if (href.startsWith('#')) {
      e.preventDefault();
      const target = leafContent.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' });
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    }
  });

  // an interrupted transition is dropped, not played out: whatever comes next starts from a clean page
  function finishAnims(list) {
    list.forEach((a) => a.cancel());
    [leaf, leafContent].forEach((el) => el.getAnimations().forEach((a) => a.cancel()));
  }

  function faceRect(pin) {
    if (!pin) return null;
    const face = pin.el.querySelector('.book__face');
    const r = face.getBoundingClientRect();
    const m = mapEl.getBoundingClientRect();
    if (r.width < 4 || r.right < m.left || r.left > m.right || r.bottom < m.top || r.top > m.bottom) return null;
    return r;
  }
  const insetOf = (r) => `inset(${r.top.toFixed(1)}px ${(window.innerWidth - r.right).toFixed(1)}px ${(window.innerHeight - r.bottom).toFixed(1)}px ${r.left.toFixed(1)}px)`;

  function makeCover(pin, r) {
    const face = pin.el.querySelector('.book__face');
    const wrap = document.createElement('div');
    wrap.className = 'fly__cover';
    const sx = r.width / 192, sy = r.height / 272;
    wrap.style.setProperty('width', '192px');
    wrap.style.setProperty('height', '272px');
    const front = document.createElement('div');
    front.className = 'fly__front';
    const img = face.querySelector('img');
    front.innerHTML = img ? `<img src="${img.src}" alt="">` : '<span></span>';
    const name = document.createElement('b');
    name.textContent = L(pin.book.title);
    front.appendChild(name);
    const inside = document.createElement('div');
    inside.className = 'fly__inside';
    wrap.append(front, inside);
    fly.style.perspectiveOrigin = `${r.left + r.width / 2}px ${r.top + r.height / 2}px`;
    fly.appendChild(wrap);
    const base = `translate(${r.left}px, ${r.top}px) scale(${sx}, ${sy})`;
    return { wrap, base };
  }

  let pageGen = 0;
  function openPage(view, opts = {}) {
    pageGen += 1;
    finishAnims(pageAnims); pageAnims = [];
    fly.textContent = '';
    pinList.forEach((p) => p.el.classList.remove('is-open'));
    const cid = viewCountry(view);
    const pin = opts.from || pinList.find((p) => p.country === cid);
    page = view;
    renderLeaf(view);
    leaf.hidden = false;
    leafScroll.scrollTop = 0;
    spread.inert = true;
    clearActive();
    live.textContent = T[lang].opening(L(bookByCountry[cid].title));
    const r = opts.animate ? faceRect(pin) : null;
    if (r && !reduce.matches) {
      if (pin) pin.el.classList.add('is-open');
      // the cover swings open first, showing the page inside; then the page grows out of the book
      const clip = leaf.animate([{ clipPath: insetOf(r) }, { clipPath: 'inset(0px 0px 0px 0px)' }], { duration: 780, delay: 200, easing: 'cubic-bezier(0.7, 0, 0.16, 1)', fill: 'backwards' });
      const inner = leafContent.animate([{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'none' }], { duration: 520, delay: 640, easing: OUT, fill: 'backwards' });
      const { wrap, base } = makeCover(pin, r);
      const swing = wrap.animate([
        { transform: `${base} rotateY(0deg)`, opacity: 1 },
        { transform: `${base} rotateY(-115deg)`, opacity: 1, offset: 0.45 },
        { transform: `${base} rotateY(-172deg)`, opacity: 0 },
      ], { duration: 760, easing: 'cubic-bezier(0.3, 0.6, 0.25, 1)', fill: 'forwards' });
      swing.onfinish = () => wrap.remove();
      pageAnims = [clip, inner, swing];
    } else if (opts.animate) {
      pageAnims = [leaf.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' })];
      if (pin) pin.el.classList.add('is-open');
    } else if (pin) {
      pin.el.classList.add('is-open');
    }
    requestAnimationFrame(() => $('#leaf-back').focus({ preventScroll: true }));
  }

  function closePage(opts = {}) {
    if (!page) return;
    pageGen += 1;
    const gen = pageGen;
    finishAnims(pageAnims); pageAnims = [];
    fly.textContent = '';
    const cid = viewCountry(page);
    const pin = pinList.find((p) => p.country === cid);
    page = null;
    if (tocObserver) { tocObserver.disconnect(); tocObserver = null; }
    const done = () => {
      if (gen !== pageGen) return; // another page opened meanwhile
      leaf.hidden = true;
      leafContent.textContent = '';
      spread.inert = false;
      if (pin) pin.el.classList.remove('is-open');
      if (pin && opts.focus !== false) pin.el.querySelector('.book').focus({ preventScroll: true });
    };
    const r = faceRect(pin);
    if (opts.animate && r && !reduce.matches) {
      const clip = leaf.animate([{ clipPath: 'inset(0px 0px 0px 0px)' }, { clipPath: insetOf(r) }], { duration: 560, easing: 'cubic-bezier(0.5, 0, 0.15, 1)', fill: 'forwards' });
      const fade = leafContent.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: 'ease-out', fill: 'forwards' });
      const { wrap, base } = makeCover(pin, r);
      const swing = wrap.animate([
        { transform: `${base} rotateY(-172deg)`, opacity: 0 },
        { transform: `${base} rotateY(-120deg)`, opacity: 1, offset: 0.4 },
        { transform: `${base} rotateY(0deg)`, opacity: 1 },
      ], { duration: 620, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' });
      pageAnims = [clip, fade, swing];
      swing.onfinish = () => { wrap.remove(); if (gen !== pageGen) return; done(); clip.cancel(); fade.cancel(); };
    } else if (opts.animate) {
      const fade = leaf.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'ease-out', fill: 'forwards' });
      pageAnims = [fade];
      fade.onfinish = () => { if (gen !== pageGen) return; done(); fade.cancel(); };
    } else done();
  }

  /* ------------------------------------------------------------ the viewer */

  let photo = null;
  let photoList = indexOrder;
  let photoFrom = 'index';
  const vImg = document.createElement('img');
  vImg.id = 'viewer-img';
  $('#viewer-photo').appendChild(vImg);

  function renderViewer() {
    const s = S.slides[photo];
    vImg.classList.add('is-loading');
    vImg.onload = () => vImg.classList.remove('is-loading');
    vImg.width = s.w; vImg.height = s.h;
    vImg.sizes = '(max-width: 48rem) 100vw, 72vw';
    vImg.srcset = srcset(s);
    vImg.src = imgSrc(s, 1280);
    vImg.alt = L(s.alt);
    if (vImg.complete) vImg.classList.remove('is-loading');
    const rows = [['camera', s.camera], ['lens', s.lens], ['focal', s.focal], ['aperture', s.aperture], ['shutter', s.shutter], ['iso', s.iso]]
      .filter((r) => r[1]).map((r) => `<dt>${esc(t(r[0]))}</dt><dd>${esc(r[1])}</dd>`).join('');
    const i = photoList.indexOf(photo);
    const b = bookByCountry[s.country];
    const toGuide = s.guide && page !== 'guide-barcelona' && b && b.guide ? `<button type="button" class="viewer__go" data-view="${b.view}">${esc(t('bookOpen'))}</button>` : '';
    $('#viewer-text').innerHTML =
      `<h2 id="viewer-title">${esc(L(s.place))}</h2>` +
      `<p class="viewer__where">${esc(L(s.where))}</p>` +
      `<p class="viewer__ref">${refHTML(s.ll)}</p>` +
      `<dl class="spec" aria-label="${esc(t('made'))}">${rows}</dl>` +
      (s.best ? `<p class="viewer__note"><b>${esc(t('best'))}</b>${esc(L(s.best))}</p>` : '') +
      (s.note ? `<p class="viewer__note">${esc(L(s.note))}</p>` : '') +
      toGuide +
      `<p class="viewer__count">${esc(T[lang].ofN(i + 1, photoList.length))}</p>`;
    $('#viewer-prev').disabled = photoList.length < 2;
    $('#viewer-next').disabled = photoList.length < 2;
  }
  function showViewer(id, list, from) {
    photo = id;
    photoList = list && list.includes(id) ? list : indexOrder;
    photoFrom = from || 'index';
    renderViewer();
    const wasHidden = viewer.hidden;
    viewer.hidden = false;
    spread.inert = true;
    leaf.inert = true;
    if (wasHidden) requestAnimationFrame(() => $('#viewer-close').focus({ preventScroll: true }));
  }
  function hideViewer() {
    if (!photo) return;
    const id = photo;
    photo = null;
    viewer.hidden = true;
    leaf.inert = false;
    spread.inert = !!page;
    if (page) {
      const back = leafContent.querySelector(`[data-slide="${id}"]`);
      (back || $('#leaf-back')).focus({ preventScroll: false });
    } else {
      const st = stampEls.get(id);
      if (photoFrom === 'index' && st) st.focus({ preventScroll: true });
      // back on the map, the pen shows where it was made
      setActive({ slide: id, from: 'viewer' });
      const ll = S.slides[id].ll;
      if (!inView(ll, 0.12) || state.z.k * state.S0 < 700) centerOn(ll, Math.max(state.z.k, 760 / state.S0), 1000);
    }
  }
  function step(d) {
    const i = photoList.indexOf(photo);
    const n = photoList.length;
    photo = photoList[(i + d + n) % n];
    renderViewer();
    try { history.replaceState({ ...(history.state || {}), atlas: true, photo, page }, '', `#photo-${photo}`); } catch (e) { /* fine */ }
  }
  $('#viewer-prev').addEventListener('click', () => step(-1));
  $('#viewer-next').addEventListener('click', () => step(1));
  $('#viewer-close').addEventListener('click', () => back());
  $('#viewer-text').addEventListener('click', (e) => {
    const g = e.target.closest('.viewer__go');
    if (!g) return;
    hideViewer();
    const view = g.dataset.view;
    try { history.replaceState({ atlas: true, page: view }, '', `#${view}`); } catch (err) { /* fine */ }
    openPage(view, { animate: true });
  });
  // a swipe moves between photographs on touch
  let swipe = null;
  viewer.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') swipe = { x: e.clientX, y: e.clientY }; });
  viewer.addEventListener('pointerup', (e) => {
    if (!swipe) return;
    const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
    swipe = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) step(dx < 0 ? 1 : -1);
  });

  /* ------------------------------------------------------------ history: every page and photo has an address */

  function parse(hash) {
    const h = decodeURIComponent((hash || '').replace(/^#/, ''));
    if (h.startsWith('photo-') && S.slides[h.slice(6)]) {
      const st = history.state;
      return { page: st && validView(st.page) ? st.page : null, photo: h.slice(6) };
    }
    if (validView(h)) return { page: h, photo: null };
    return { page: null, photo: null };
  }
  function apply(want, animate) {
    if (want.photo !== photo && photo) hideViewer();
    if (want.page !== page) {
      if (page) closePage({ animate, focus: !want.page });
      if (want.page) openPage(want.page, { animate });
    }
    if (want.photo && want.photo !== photo) showViewer(want.photo, photoList, photoFrom);
  }
  function go(view, opts = {}) {
    if (page === view) return;
    try { history.pushState({ atlas: true, page: view }, '', `#${view}`); } catch (e) { /* fine */ }
    if (page) closePage({ animate: false, focus: false });
    openPage(view, { animate: true, from: opts.from });
  }
  function openViewer(id, list, opts = {}) {
    try { history.pushState({ atlas: true, page, photo: id }, '', `#photo-${id}`); } catch (e) { /* fine */ }
    showViewer(id, list, opts.from);
  }
  function back() {
    if (history.state && history.state.atlas) history.back();
    else {
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* fine */ }
      apply({ page: null, photo: null }, true);
    }
  }
  window.addEventListener('popstate', () => apply(parse(location.hash), true));
  $('#leaf-back').addEventListener('click', () => back());
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (photo || page) { e.preventDefault(); back(); }
  });
  viewer.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  });

  /* ------------------------------------------------------------ language */

  function applyWords() {
    html.lang = lang === 'zh' ? 'zh-Hant' : 'en';
    $$('[data-t]').forEach((el) => { const v = t(el.dataset.t); if (typeof v === 'string') el.textContent = v; });
    $$('[data-t-aria]').forEach((el) => { const v = t(el.dataset.tAria); if (typeof v === 'string') el.setAttribute('aria-label', v); });
    $$('.lang').forEach((g) => g.setAttribute('aria-label', T[lang].lang));
    $$('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    $('#ig').setAttribute('aria-label', `${t('follow')}: tuan_1127`);
  }
  function setLang(next) {
    if (next === lang) return;
    lang = next;
    try { localStorage.setItem('tlap-lang', lang); } catch (e) { /* fine */ }
    applyWords();
    const wasActive = active;
    clearActive();
    renderPins();
    renderIndex();
    if (page) {
      const top = leafScroll.scrollTop;
      renderLeaf(page);
      leafScroll.scrollTop = top;
    }
    if (photo) renderViewer();
    state.settle = 30;
    queueDraw();
    if (wasActive && wasActive.from !== 'viewer') { /* the pen lifts on a language change */ }
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.lang button');
    if (b) setLang(b.dataset.lang);
  });

  /* ------------------------------------------------------------ start */

  async function loadWorld() {
    const w110 = await fetch('../vendor/countries-110m.json').then((r) => r.json());
    state.world110 = w110;
    state.land110 = topojson.feature(w110, w110.objects.land);
    state.mesh110 = topojson.mesh(w110, w110.objects.countries, (a, b) => a !== b);
    state.feats110 = featsFor(w110);
    queueDraw();
    // the finer coastline arrives a moment later, for when you come close
    const w50 = await fetch('../vendor/countries-50m.json').then((r) => r.json());
    state.world50 = w50;
    state.land50 = topojson.feature(w50, w50.objects.land);
    state.mesh50 = topojson.mesh(w50, w50.objects.countries, (a, b) => a !== b);
    state.feats50 = featsFor(w50);
    queueDraw();
  }
  const ISO = { spain: '724', uk: '826', france: '250', germany: '276', switzerland: '756', taiwan: '158', japan: '392', 'south-korea': '410', 'hong-kong': '344', china: '156', singapore: '702', vietnam: '704', dubai: '784', australia: '036', 'new-zealand': '554', usa: '840' };
  function featsFor(w) {
    const geoms = w.objects.countries.geometries;
    const out = {};
    for (const [cid, iso] of Object.entries(ISO)) {
      const g = geoms.find((x) => String(x.id).padStart(3, '0') === iso);
      if (g) out[cid] = topojson.feature(w, g);
    }
    return out;
  }

  function start() {
    applyWords();
    renderIndex();
    sizeMap();
    renderPins();
    moveTo(homeTransform(), 0);
    state.settle = 40;
    queueDraw();
    loadWorld().catch(() => { /* the map still shows its grid, places and books */ });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { for (const p of pinList) p.lw = p.el.querySelector('.pin__label').offsetWidth; state.settle = 20; queueDraw(); });
    // a page or photograph named in the address opens directly
    const want = parse(location.hash);
    if (want.page || want.photo) {
      try { history.replaceState({ atlas: false, page: want.page, photo: want.photo }, '', location.href); } catch (e) { /* fine */ }
      apply(want, false);
    }
    let rz = 0;
    window.addEventListener('resize', () => {
      cancelAnimationFrame(rz);
      rz = requestAnimationFrame(() => {
        const c = proj0.invert([state.z.invertX(state.W / 2), state.z.invertY(state.H / 2)]);
        const k = state.z.k;
        sizeMap();
        const p = proj0(c);
        state.z = d3.zoomIdentity.translate(state.W / 2 - p[0] * k, state.H / 2 - p[1] * k).scale(k);
        sel.call(zoom.transform, state.z);
        state.settle = 20;
        queueDraw();
      });
    });
    updateZoomButtons();
  }
  start();
})();

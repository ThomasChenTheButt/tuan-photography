/* tuan photography 陳亮元, design 2 "Flyover".
   The map lies on the ground below, seen at an angle as from a window seat. It is drawn on a
   viewport-sized canvas through a true perspective (ground plane tilted by --tilt), so it stays
   crisp and has a real horizon. His sixteen books stand upright at their places. Choosing a
   place is a descent: the camera dives toward the country, the tilt eases toward straight-down,
   and the cover photograph grows out of the book to fill the window. Everything is local. */
(() => {
  'use strict';

  const S = window.SITE;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const PHONE = matchMedia('(max-width: 47.99rem)');
  const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
  const expOut = d3.easeExpOut;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // the data keeps a few typographic dashes (ranges); the page shows none
  const clean = s => String(s).replace(/(\d)\s*[–—]\s*(\d)/g, '$1-$2').replace(/\s+[–—]\s+/g, ', ').replace(/[–—]/g, '-');

  /* ------------------------------------------------------------ words, both languages */

  const WORDS = {
    mapLabel: { en: 'Map of the places he has photographed, seen from above', zh: '他拍過的地方，從空中往下看的地圖' },
    mapHint: { en: 'Drag to move along the ground, scroll to zoom, arrow keys to move, double-click to go closer. Choose a book, a photograph in the index, or a place in the list to fly there.', zh: '拖曳沿著地面移動，捲動縮放，方向鍵移動，連點兩下靠近。選一本書、索引裡的一張照片，或列表裡的地方，就飛過去。' },
    places: { en: 'Places', zh: '地方' },
    placesTitle: { en: 'Sixteen places', zh: '十六個地方' },
    placesLine: { en: 'Choose one and the camera flies there.', zh: '選一個，鏡頭就飛過去。' },
    indexTitle: { en: 'Index of photographs', zh: '照片索引' },
    indexHint: { en: 'Scroll sideways. Hovering a photograph marks its place on the map; choosing it flies there.', zh: '橫向捲動。指到一張照片會在地圖上標出它的位置；選它就飛過去。' },
    zoomGroup: { en: 'Zoom', zh: '縮放' },
    zoomIn: { en: 'Closer', zh: '靠近' },
    zoomOut: { en: 'Further', zh: '拉遠' },
    world: { en: 'Whole map', zh: '整張地圖' },
    credit: { en: 'Map data: Natural Earth', zh: '地圖資料：Natural Earth' },
    langLabel: { en: 'Language', zh: '語言' },
    ig: { en: 'Instagram', zh: 'Instagram' },
    nPhotos: { en: n => (n === 1 ? '1 photograph' : `${n} photographs`), zh: n => `${n} 張照片` },
    flyTo: { en: n => `Fly to ${n}`, zh: n => `飛往${n}` },
    frameAria: { en: (p, c) => `${p}, ${c}: fly there with this photograph as the cover`, zh: (p, c) => `${p}，${c}：以這張照片為封面飛過去` },
    bookAria: { en: (t, s) => `${t}: ${s}. Fly there.`, zh: (t, s) => `${t}：${s}。飛過去。` },
    landed: { en: n => `${n}: the page is open.`, zh: n => `${n}：頁面已打開。` },
    camera: { en: 'Camera', zh: '相機' },
    lens: { en: 'Lens', zh: '鏡頭' },
    settings: { en: 'Settings', zh: '參數' },
    openMaps: { en: 'Open in Google Maps', zh: '在 Google 地圖開啟' },
    prev: { en: 'Previous', zh: '上一張' },
    next: { en: 'Next', zh: '下一張' },
    countOf: { en: (i, n) => `${i} of ${n}`, zh: (i, n) => `第 ${i} 張，共 ${n} 張` },
    seeLarger: { en: 'See it larger', zh: '看大圖' },
    endLine: { en: 'Every photograph here is his own, made on the trip.', zh: '這裡每張照片都是他自己在旅途中拍的。' },
    made: { en: p => `${p}: how this was made`, zh: p => `${p}：這張怎麼拍` },
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
  const fmtLL = ll => `${Math.abs(ll[0]).toFixed(3)}°${ll[0] >= 0 ? 'N' : 'S'} · ${Math.abs(ll[1]).toFixed(3)}°${ll[1] >= 0 ? 'E' : 'W'}`;

  /* ------------------------------------------------------------ the places */

  const ISO = { spain: '724', uk: '826', france: '250', germany: '276', switzerland: '756', taiwan: '158', japan: '392', 'south-korea': '410', 'hong-kong': '344', china: '156', singapore: '702', vietnam: '704', dubai: '784', australia: '036', 'new-zealand': '554', usa: '840' };
  const BEEN = new Map(Object.entries(ISO).map(([cid, iso]) => [iso, cid]));
  const COUNTRY = Object.fromEntries(S.countries.map(c => [c.id, c]));
  const BOOK_OF = Object.fromEntries(S.books.map(b => [b.country, b]));
  const SLIDES = S.slides;
  const photosOf = cid => COUNTRY[cid].photos.filter(id => SLIDES[id]);
  const ORDER = S.books.map(b => b.country);
  const INDEX = ORDER.flatMap(cid => photosOf(cid));
  const img = (file, size) => `../images/web/${size ? size + '/' : ''}${file}`;
  const hashOf = cid => (BOOK_OF[cid] && BOOK_OF[cid].guide ? `guide-${BOOK_OF[cid].guide}` : `place-${cid}`);
  const fromHash = h => {
    const m = /^#(guide|place)-(.+)$/.exec(h || '');
    if (!m) return null;
    const id = decodeURIComponent(m[2]);
    if (m[1] === 'guide') { const b = S.books.find(x => x.guide === id); return b ? b.country : null; }
    return COUNTRY[id] ? id : null;
  };
  const bookLL = b => (b.guide && S.guides[b.guide] ? S.guides[b.guide].ll : COUNTRY[b.country].ll);
  const statusOf = b => t(b.status);
  const live = msg => { $('#live').textContent = msg; };

  /* ------------------------------------------------------------ projection and the camera */

  const W0 = 1024;
  const proj = d3.geoMercator().scale(W0 / (2 * Math.PI)).translate([W0 / 2, W0 / 2]);
  const toM = ll => proj([ll[1], ll[0]]);
  const Y_TOP = proj([0, 84])[1], Y_BOT = proj([0, -62])[1];
  const K_MIN = 0.36, K_MAX = 900;
  const rad = d => d * Math.PI / 180;

  // ground = map * k + (x, y), in ground pixels; the ground plane is tilted by `tilt` degrees
  // about the horizontal axis through the screen point (gx, gy), seen with perspective P.
  const cam = { k: 2, x: 0, y: 0, tilt: 50, rot: 0 };
  let vw = 0, vh = 0, dpr = 1, gx = 0, gy = 0, P = 600, TILT0 = 50, ROT0 = 72, ROLL_H = 112, TOP_H = 64;

  const camState = () => ({ c: [-cam.x / cam.k, -cam.y / cam.k], k: cam.k, tilt: cam.tilt, rot: cam.rot });
  function setCam(s) {
    const k = clamp(s.k, K_MIN, K_MAX);
    const c = [clamp(s.c[0], 0, W0), clamp(s.c[1], Y_TOP, Y_BOT)];
    cam.k = k; cam.x = -c[0] * k; cam.y = -c[1] * k;
    if (s.tilt != null) cam.tilt = clamp(s.tilt, 0, 80);
    if (s.rot != null) cam.rot = s.rot;
  }
  const horizonY = () => { const th = rad(cam.tilt); return th < 1e-4 ? -Infinity : gy - P / Math.tan(th); };
  function fwd(u0, v0) {
    const r = rad(cam.rot), cr = Math.cos(r), sr = Math.sin(r);
    const u = u0 * cr - v0 * sr, v = u0 * sr + v0 * cr;
    const th = rad(cam.tilt), s = Math.sin(th), c = Math.cos(th);
    const w = P / (P - v * s);
    return [gx + u * w, gy + v * c * w, w];
  }
  function inv(sx, sy) {
    const th = rad(cam.tilt), s = Math.sin(th), c = Math.cos(th);
    const b = sy - gy, den = P * c + b * s;
    if (den <= 1e-6) return null;
    const v = P * b / den, w = P / (P - v * s), u = (sx - gx) / w;
    const r = rad(cam.rot), cr = Math.cos(r), sr = Math.sin(r);
    return [u * cr + v * sr, -u * sr + v * cr, w];
  }
  const mToG = m => [m[0] * cam.k + cam.x, m[1] * cam.k + cam.y];
  const gToM = g => [(g[0] - cam.x) / cam.k, (g[1] - cam.y) / cam.k];
  const mToS = m => { const g = mToG(m); return fwd(g[0], g[1]); };
  const sToM = (sx, sy) => { const g = inv(sx, sy); return g && gToM(g); };
  // the ground point under a screen point, never above the horizon
  function groundAt(sx, sy) {
    const hy = horizonY();
    return inv(sx, Math.max(sy, hy + 24));
  }

  function layout() {
    vw = innerWidth; vh = innerHeight;
    dpr = Math.min(2, devicePixelRatio || 1);
    ROLL_H = PHONE.matches ? 104 : 126;
    TOP_H = PHONE.matches ? 56 : 64;
    gx = vw / 2;
    let hy;
    if (PHONE.matches) { gy = vh * 0.5; TILT0 = 30; hy = -vh * 0.9; }
    else { gy = vh * 0.6; TILT0 = 54; hy = vh * 0.15; }
    P = (gy - hy) * Math.tan(rad(TILT0));
    canvas.width = Math.round(vw * dpr); canvas.height = Math.round(vh * dpr);
  }

  /* ------------------------------------------------------------ the shapes, pre-projected once */

  // collects a projection stream into planar rings (Mercator units), so every frame only
  // applies the camera and the perspective: no spherical maths while panning
  function collector() {
    const polys = [], lines = [];
    let poly = null, ring = null;
    return {
      sink: {
        polygonStart() { poly = []; }, polygonEnd() { polys.push(poly); poly = null; },
        lineStart() { ring = []; }, lineEnd() { (poly ? poly : lines).push(ring); ring = null; },
        point(x, y) { ring.push([x, y]); }, sphere() {},
      },
      polys, lines,
    };
  }
  function planar(geo) {
    const c = collector();
    d3.geoStream(geo, proj.stream(c.sink));
    if (c.polys.length) return { type: 'MultiPolygon', coordinates: c.polys.filter(p => p.length) };
    return { type: 'MultiLineString', coordinates: c.lines };
  }
  function boundsOf(geo) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    const walk = a => { if (typeof a[0] === 'number') { if (a[0] < x0) x0 = a[0]; if (a[0] > x1) x1 = a[0]; if (a[1] < y0) y0 = a[1]; if (a[1] > y1) y1 = a[1]; } else a.forEach(walk); };
    walk(geo.coordinates);
    return [x0, y0, x1, y1];
  }
  function labelPoint(geo) {
    let best = null, ba = 0;
    for (const poly of geo.coordinates) { const a = Math.abs(d3.polygonArea(poly[0])); if (a > ba) { ba = a; best = poly[0]; } }
    return best ? d3.polygonCentroid(best) : null;
  }
  const hitPath = geo => { const p = new Path2D(); d3.geoPath(null, p)(geo); return p; };
  // a line set split into pieces with bounds, so only the pieces in view are streamed
  const pieces = geo => geo.coordinates.map(line => { const g = { type: 'LineString', coordinates: line }; return { geo: g, b: boundsOf(g) }; });

  function shapes(topo) {
    const obj = topo.objects.countries;
    const feats = topojson.feature(topo, obj).features.filter(f => f.id !== '010');
    const out = feats.map(f => {
      const geo = planar(f);
      const cid = BEEN.get(f.id) || null;
      return { iso: f.id, cid, geo, b: boundsOf(geo), hit: cid ? hitPath(geo) : null, label: cid ? labelPoint(geo) : null };
    });
    const mine = new Set(Object.values(ISO));
    return {
      feats: out,
      been: out.filter(f => f.cid),
      coast: pieces(planar(topojson.mesh(topo, obj, (a, b) => a === b && a.id !== '010'))),
      borders: pieces(planar(topojson.mesh(topo, obj, (a, b) => a !== b && (mine.has(a.id) || mine.has(b.id)) && a.id !== '010' && b.id !== '010'))),
    };
  }
  const GRAT = pieces(planar(d3.geoGraticule10()));

  /* ------------------------------------------------------------ drawing */

  const viewEl = $('#view');
  const canvas = $('#ground');
  const ctx = canvas.getContext('2d');
  const hitCtx = document.createElement('canvas').getContext('2d');
  let G110 = null, G50 = null;
  let hoverIso = null;
  let ringId = null;   // a photograph's spot, ringed from the index
  const COL = {};
  function readColours() {
    const cs = getComputedStyle(document.documentElement);
    for (const k of ['sky', 'haze', 'sea', 'sea-deep', 'land', 'land-hi', 'land-shade', 'been', 'been-hi', 'coast', 'grat', 'border', 'ink', 'ink-2', 'accent', 'paper']) COL[k] = cs.getPropertyValue('--' + k).trim();
  }

  // the perspective, as a geo transform: map units in, screen pixels out
  let K = 1, X = 0, Y = 0, SIN = 0, COS = 1, CR = 1, SR = 0;
  const xform = d3.geoTransform({
    point(x, y) {
      const u0 = x * K + X, v0 = y * K + Y;
      const u = u0 * CR - v0 * SR, v = u0 * SR + v0 * CR;
      const w = P / (P - v * SIN);
      this.stream.point(gx + u * w, gy + v * COS * w);
    },
  });
  // the ground row (v) seen at a screen row, for the given magnification w
  
  function bandRect(wa, wb) {
    // the rectangle of map units covering the screen rows where the magnification is in [wa, wb]
    const hy = horizonY();
    let rowA = -20, rowB = vh + 20;
    if (hy !== -Infinity) {
      rowB = Math.min(vh + 20, hy + wb * (gy - hy));
      rowA = Math.max(-20, hy + wa * (gy - hy));
      if (rowA >= rowB) return null;
    }
    const cs = [inv(-40, rowA), inv(vw + 40, rowA), inv(-40, rowB), inv(vw + 40, rowB)];
    if (cs.some(q => !q)) return null;
    const ms = cs.map(gToM);
    return [d3.min(ms, m => m[0]), d3.min(ms, m => m[1]), d3.max(ms, m => m[0]), d3.max(ms, m => m[1])];
  }

  function pass(G, rect, shade) {
    const clip = d3.geoClipRectangle(rect[0], rect[1], rect[2], rect[3]);
    const path = d3.geoPath({ stream: s => clip(xform.stream(s)) }, ctx);
    const inView = f => !(f.b[2] < rect[0] || f.b[0] > rect[2] || f.b[3] < rect[1] || f.b[1] > rect[3]);
    const vis = G.feats.filter(inView);
    const lines = set => { ctx.beginPath(); for (const l of set) if (inView(l)) path(l.geo); };
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // sea depth banding along the coasts
    lines(G.coast);
    ctx.lineWidth = 14; ctx.strokeStyle = COL['sea-deep']; ctx.stroke();
    // paper relief: a shade below, a light above, the land on top
    const land = () => { ctx.beginPath(); for (const f of vis) path(f.geo); };
    if (shade) {
      ctx.save(); ctx.translate(0, 2); land(); ctx.fillStyle = COL['land-shade']; ctx.fill(); ctx.restore();
      ctx.save(); ctx.translate(0, -1); land(); ctx.fillStyle = COL['land-hi']; ctx.fill(); ctx.restore();
    }
    land(); ctx.fillStyle = COL.land; ctx.fill();
    // the sixteen, a notch warmer
    ctx.beginPath(); for (const f of vis) if (f.cid && f.iso !== hoverIso) path(f.geo);
    ctx.fillStyle = COL.been; ctx.fill();
    if (hoverIso) { ctx.beginPath(); for (const f of vis) if (f.iso === hoverIso) path(f.geo); ctx.fillStyle = COL['been-hi']; ctx.fill(); }
    // graticule, coasts, and borders only around his countries
    lines(GRAT); ctx.lineWidth = 0.6; ctx.strokeStyle = COL.grat; ctx.stroke();
    lines(G.coast); ctx.lineWidth = 0.6; ctx.strokeStyle = COL.coast; ctx.stroke();
    lines(G.borders); ctx.lineWidth = 0.7; ctx.strokeStyle = COL.border; ctx.stroke();
  }

  let lastHorizon = null;
  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    K = cam.k; X = cam.x; Y = cam.y; SIN = Math.sin(rad(cam.tilt)); COS = Math.cos(rad(cam.tilt)); CR = Math.cos(rad(cam.rot)); SR = Math.sin(rad(cam.rot));
    const hy = horizonY();
    const hz = Math.max(-2 * vh, hy).toFixed(0) + 'px';
    if (hz !== lastHorizon) { lastHorizon = hz; document.documentElement.style.setProperty('--horizon', hz); }
    ctx.fillStyle = COL.sky; ctx.fillRect(0, 0, vw, vh);
    const top = Math.max(0, hy);
    ctx.fillStyle = COL.sea; ctx.fillRect(0, top, vw, vh - top);
    const near = G50 && cam.k >= 3.5 ? G50 : G110;
    if (!near) return;
    const W_FAR = 0.09;
    if (near === G50) {
      const far = bandRect(W_FAR, 0.4); if (far) pass(G110, far, false);
      const r = bandRect(0.4, Infinity); if (r) pass(G50, r, true);
    } else {
      const r = bandRect(W_FAR, Infinity); if (r) pass(G110, r, true);
    }
    drawNames(near);
    drawSpots();
  }

  function drawNames(G) {
    const a = clamp((cam.k - 4) / 2, 0, 1);
    if (a <= 0) return;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const zh = lang === 'zh';
    ctx.lineJoin = 'round';
    for (const f of G.been) {
      if (!f.label) continue;
      const s = mToS(f.label);
      if (s[2] <= 0.12 || s[0] < -80 || s[0] > vw + 80 || s[1] < horizonY() + 10 || s[1] > vh) continue;
      const size = clamp(11.5 * Math.pow(s[2], 0.35), 9, 14);
      ctx.font = `${zh ? 500 : 600} ${size}px "Schibsted Grotesk", "Noto Sans TC", sans-serif`;
      ctx.letterSpacing = zh ? '0.3em' : '0.16em';
      const text = zh ? L(COUNTRY[f.cid].name) : L(COUNTRY[f.cid].name).toUpperCase();
      ctx.globalAlpha = a;
      ctx.lineWidth = 3; ctx.strokeStyle = COL.land; ctx.strokeText(text, s[0], s[1]);
      ctx.fillStyle = COL['ink-2']; ctx.fillText(text, s[0], s[1]);
      ctx.globalAlpha = 1;
    }
    ctx.letterSpacing = '0px';
  }

  // where each photograph was made: small marks on the ground, from country zoom in;
  // the one chosen in the index wears a thin ring
  const SPOT_M = Object.fromEntries(INDEX.map(id => [id, toM(SLIDES[id].ll)]));
  function drawSpots() {
    const a = clamp((cam.k - 9) / 7, 0, 1);
    const cosT = Math.cos(rad(cam.tilt));
    const hy = horizonY();
    for (const id of INDEX) {
      const s = mToS(SPOT_M[id]);
      const ringed = id === ringId;
      if (!ringed && a <= 0) continue;
      if (s[2] <= 0.1 || s[0] < -20 || s[0] > vw + 20 || s[1] < hy + 6 || s[1] > vh) continue;
      const r = 3.2 * clamp(Math.sqrt(s[2]), 0.6, 1.5);
      const ry = r * Math.max(0.35, cosT * clamp(s[2], 0.5, 1.2));
      if (a > 0) {
        ctx.globalAlpha = a;
        ctx.beginPath(); ctx.ellipse(s[0], s[1], r + 1.5, ry + 1.5, 0, 0, Math.PI * 2); ctx.fillStyle = COL.paper; ctx.fill();
        ctx.beginPath(); ctx.ellipse(s[0], s[1], r, ry, 0, 0, Math.PI * 2); ctx.fillStyle = ringed ? COL.accent : COL['ink-2']; ctx.fill();
        ctx.globalAlpha = 1;
      }
      if (ringed) {
        const R = 13 * clamp(Math.sqrt(s[2]), 0.7, 1.4);
        ctx.beginPath(); ctx.ellipse(s[0], s[1], R, R * Math.max(0.4, cosT * clamp(s[2], 0.5, 1.2)), 0, 0, Math.PI * 2);
        ctx.lineWidth = 1.25; ctx.strokeStyle = COL.accent; ctx.stroke();
        if (a <= 0) { ctx.beginPath(); ctx.ellipse(s[0], s[1], 2.2, 2.2 * Math.max(0.4, cosT), 0, 0, Math.PI * 2); ctx.fillStyle = COL.accent; ctx.fill(); }
      }
    }
  }

  function hitCountry(sx, sy) {
    const G = G50 && cam.k >= 3.5 ? G50 : G110;
    if (!G) return null;
    const m = sToM(sx, sy);
    if (!m) return null;
    hitCtx.setTransform(1, 0, 0, 1, 0, 0);
    for (const f of G.been) {
      if (m[0] < f.b[0] || m[0] > f.b[2] || m[1] < f.b[1] || m[1] > f.b[3]) continue;
      if (hitCtx.isPointInPath(f.hit, m[0], m[1])) return f;
    }
    return null;
  }

  let raf = 0;
  function schedule() { if (!raf) raf = requestAnimationFrame(frame); }
  function frame() {
    raf = 0;
    draw();
    placeBooks();
    $('#zoom-in').disabled = cam.k >= K_MAX * 0.999;
    $('#zoom-out').disabled = cam.k <= K_MIN * 1.001;
  }

  /* ------------------------------------------------------------ camera moves */

  let flight = null;
  function cancelFlight() { if (flight) { cancelAnimationFrame(flight.raf); flight = null; } }
  function flyTo(to, dur, onDone) {
    cancelFlight();
    if (RM.matches || !dur) { setCam(to); schedule(); if (onDone) onDone(); return; }
    const from = camState(), t0 = performance.now();
    const f = { raf: 0 };
    flight = f;
    // position and scale follow one smooth zoom path, so the target never drifts at high zoom;
    // the tilt and heading level out late, as the ground comes close
    const span = vw * 0.7;
    const path = d3.interpolateZoom([from.c[0], from.c[1], span / from.k], [to.c[0], to.c[1], span / to.k]);
    const level = d3.easeCubicInOut;
    const step = now => {
      if (flight !== f) return;
      const tt = Math.min(1, (now - t0) / dur), e = expOut(tt), e2 = level(Math.min(1, tt * 1.15));
      const z = tt >= 1 ? [to.c[0], to.c[1], span / to.k] : path(e);
      setCam({ c: [z[0], z[1]], k: span / z[2], tilt: to.tilt == null ? from.tilt : lerp(from.tilt, to.tilt, e2), rot: to.rot == null ? from.rot : lerp(from.rot, to.rot, e2) });
      schedule();
      if (tt < 1) f.raf = requestAnimationFrame(step); else { flight = null; if (onDone) onDone(); }
    };
    f.raf = requestAnimationFrame(step);
  }

  // the opening view: every book in the window, Asia near, Europe toward the horizon
  function homeView() {
    const pts = S.books.filter(b => COUNTRY[b.country].ll[1] > 0).map(b => toM(bookLL(b)));
    const hy = Math.max(0, horizonYFor(TILT0));
    const top = hy + (PHONE.matches ? TOP_H + 40 : 0.075 * vh), bottom = vh - ROLL_H - (PHONE.matches ? 40 : 34);
    const side = PHONE.matches ? 40 : 120;
    const save = { ...cam };
    cam.tilt = TILT0; cam.rot = ROT0;
    let c = [d3.mean(pts, p => p[0]), d3.mean(pts, p => p[1]) + (PHONE.matches ? 0 : 6)];
    let k = 3;
    const fits = () => {
      if (!pts.every(p => { const s = mToS(p); return s[2] > 0 && s[0] > side && s[0] < vw - side && s[1] > top && s[1] < bottom; })) return false;
      // the books as they finally stand, after spreading apart, must be inside the window too
      if (!PINS.length) return true;
      placeBooks();
      return PINS.filter(q => q.shown && COUNTRY[q.cid].ll[1] > 0).every(q => q.x - q.bw / 2 > 10 && q.x + q.bw / 2 < vw - 10 && q.y - q.bh > top - 30);
    };
    for (let i = 0; i < 60 && k > K_MIN; i++) {
      setCam({ c, k });
      // balance: move the centre so the extremes sit evenly
      const ss = pts.map(p => mToS(p));
      const l = d3.min(ss, s => s[0]), r = d3.max(ss, s => s[0]);
      const tp = d3.min(ss, s => s[1]), bt = d3.max(ss, s => s[1]);
      const dx = ((l + r) / 2 - vw / 2), dy = ((tp + bt) / 2 - (top + bottom) / 2);
      const gm = inv(gx + dx, gy + dy);
      if (gm) c = gToM(gm);
      setCam({ c, k });
      if (fits()) break;
      k *= 0.93;
    }
    const out = { c, k, tilt: TILT0, rot: ROT0 };
    Object.assign(cam, save);
    return out;
  }
  const horizonYFor = tilt => { const th = rad(tilt); return th < 1e-4 ? -Infinity : gy - P / Math.tan(th); };

  // where the camera lands when a country is chosen: close, nearly straight down
  function landing(cid) {
    const b = BOOK_OF[cid];
    const lls = [bookLL(b), ...photosOf(cid).map(id => SLIDES[id].ll)];
    const pts = lls.map(toM);
    const x0 = d3.min(pts, p => p[0]), x1 = d3.max(pts, p => p[0]), y0 = d3.min(pts, p => p[1]), y1 = d3.max(pts, p => p[1]);
    const span = Math.max(x1 - x0, y1 - y0, 0.001);
    const room = 0.5 * Math.min(vw, vh - ROLL_H);
    const k = clamp(room / span, 7, 48);
    return { c: pts[0], k, tilt: 3, rot: 0 };
  }

  /* ------------------------------------------------------------ the books, standing on the ground */

  const booksEl = $('#books');
  const marksEl = $('#marks');
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
      + `<span class="book__top"></span><span class="book__shadow"></span></span>`;
  }

  function buildBooks() {
    S.books.forEach((b, i) => {
      const el = document.createElement('div');
      el.className = 'pin';
      el.dataset.country = b.country;
      el.innerHTML = `<div class="pin__frame"><a class="book book--${b.tone}" href="#${hashOf(b.country)}" draggable="false">${bookMarkup(b)}</a></div>`
        + `<div class="pin__label" aria-hidden="true"><b class="js-name"></b><span class="pin__status js-status"></span></div>`;
      booksEl.appendChild(el);
      const a = $('a', el);
      const line = document.createElementNS(SVGNS, 'line');
      const dot = document.createElementNS(SVGNS, 'ellipse');
      dot.setAttribute('class', 'foot');
      marksEl.append(line, dot);
      const pin = { b, cid: b.country, el, a, line, dot, m: toM(bookLL(b)), i, x: 0, y: 0, ax: 0, ay: 0, w: 1, s: 0.25, labelW: 60, shown: true };
      PINS.push(pin);
      a.addEventListener('click', e => { e.preventDefault(); dive(b.country, { trigger: a }); });
      a.addEventListener('focus', () => { el.classList.add('is-awake'); if (!pointerDown && !quietFocus) ensureVisible(pin); });
      a.addEventListener('blur', () => el.classList.remove('is-awake'));
      a.addEventListener('mouseenter', () => wake(pin));
      a.addEventListener('mouseleave', () => wake(null));
    });
    paintBooks();
  }

  function paintBooks() {
    const meas = document.createElement('canvas').getContext('2d');
    meas.font = '500 12px "Schibsted Grotesk", "Noto Sans TC", sans-serif';
    for (const p of PINS) {
      const b = p.b, title = L(b.title);
      $$('.js-title', p.el).forEach(n => { n.textContent = title; });
      $$('.js-series', p.el).forEach(n => { n.textContent = t('series'); });
      const band = $('.js-band', p.el); if (band) band.textContent = t(b.band);
      const name = L(COUNTRY[b.country].name);
      $('.js-name', p.el).textContent = name;
      $('.js-status', p.el).textContent = statusOf(b);
      p.a.setAttribute('aria-label', t('bookAria', name === title ? title : `${title}, ${name}`, statusOf(b)));
      p.labelW = Math.min(192, meas.measureText(name).width * (lang === 'zh' ? 1.15 : 1)) + 10;
    }
  }

  let awake = null, quietFocus = false;
  function wake(pin) {
    if (awake === pin) return;
    if (awake && document.activeElement !== awake.a) awake.el.classList.remove('is-awake');
    awake = pin;
    if (pin) pin.el.classList.add('is-awake');
  }
  const pinOf = cid => PINS.find(p => p.cid === cid);

  const bookBase = k => {
    const base = PHONE.matches ? 0.17 : 0.25;
    return clamp(base + 0.045 * Math.log2(Math.max(1, k / 2.5)), base, 0.48);
  };

  function placeBooks() {
    const hy = horizonY();
    const base = bookBase(cam.k);
    const cosT = Math.cos(rad(cam.tilt));
    for (const p of PINS) {
      const g = mToG(p.m);
      const s = fwd(g[0], g[1]);
      p.w = s[2];
      p.shown = s[2] > 0.08 && s[1] > hy + 4 && s[0] > -200 && s[0] < vw + 200 && s[1] > -200 && s[1] < vh + 300;
      p.el.hidden = !p.shown;
      p.ax = s[0]; p.ay = s[1];
      p.s = base * clamp(Math.pow(s[2], 0.5), 0.6, 1.7);
      p.x = p.ax; p.y = p.ay - 4;
      p.bw = 192 * p.s * 1.08; p.bh = 272 * p.s + 4;
    }
    // keep books apart; the same start every frame, so no jitter
    const near = PINS.filter(p => p.shown);
    near.sort((a, b) => a.i - b.i);
    const box = p => [p.x - p.bw / 2, p.y - p.bh, p.x + p.bw / 2, p.y + 4];
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
      }
      if (!moved) break;
    }
    const taken = near.map(p => box(p));
    const labels = [];
    for (const p of near) {
      const off = Math.hypot(p.x - p.ax, p.y - (p.ay - 4)) > 3;
      p.el.style.setProperty('--x', p.x.toFixed(1));
      p.el.style.setProperty('--y', p.y.toFixed(1));
      p.el.style.setProperty('--s', p.s.toFixed(4));
      p.el.style.setProperty('--z', String(Math.round(p.y) + 2000));
      const r = 3.6 * clamp(Math.sqrt(p.w), 0.6, 1.5);
      p.dot.setAttribute('cx', p.ax.toFixed(1)); p.dot.setAttribute('cy', p.ay.toFixed(1));
      p.dot.setAttribute('rx', r.toFixed(2)); p.dot.setAttribute('ry', (r * Math.max(0.35, cosT * clamp(p.w, 0.5, 1.2))).toFixed(2));
      p.dot.removeAttribute('visibility');
      if (off) {
        p.line.setAttribute('x1', p.ax.toFixed(1)); p.line.setAttribute('y1', p.ay.toFixed(1));
        p.line.setAttribute('x2', p.x.toFixed(1)); p.line.setAttribute('y2', (p.y + 2).toFixed(1));
        p.line.removeAttribute('visibility');
      } else p.line.setAttribute('visibility', 'hidden');
      const lw = p.labelW, lh = 16;
      const lb = [p.x - lw / 2, p.y + 8, p.x + lw / 2, p.y + 8 + lh];
      const hit = q => !(q[2] < lb[0] || q[0] > lb[2] || q[3] < lb[1] || q[1] > lb[3]);
      const clash = taken.some(hit) || labels.some(hit) || p.w < 0.3;
      p.el.classList.toggle('is-quiet', clash);
      if (!clash) labels.push(lb);
    }
    for (const p of PINS) if (!p.shown) { p.line.setAttribute('visibility', 'hidden'); p.dot.setAttribute('visibility', 'hidden'); }
  }

  function ensureVisible(pin) {
    const s = mToS(pin.m);
    const hy = horizonY();
    if (s[2] > 0.3 && s[0] > 80 && s[0] < vw - 80 && s[1] > Math.max(hy + 0.12 * vh, TOP_H + 60) && s[1] < vh - ROLL_H - 40) return;
    flyTo({ c: pin.m, k: Math.max(cam.k, 2.5) }, 600);
  }

  function faceRect(pin) {
    if (!pin || pin.el.hidden) return null;
    const r = $('.book__face', pin.el).getBoundingClientRect();
    if (r.width < 4) return null;
    return r;
  }

  /* ------------------------------------------------------------ the index: a roll of every photograph */

  const rollEl = $('#roll');
  const rollScroll = $('#roll-scroll');
  function buildRoll() {
    rollEl.innerHTML = ORDER.filter(cid => photosOf(cid).length).map(cid => {
      const c = COUNTRY[cid];
      const frames = photosOf(cid).map(id => {
        const s = SLIDES[id];
        const h = PHONE.matches ? 44 : 58, w = Math.round(h * s.w / s.h);
        return `<button class="frame" type="button" data-slide="${id}" data-country="${cid}"><img src="${img(s.file, 640)}" alt="" width="${w}" height="${h}" loading="lazy" decoding="async" draggable="false"><span class="frame__name js-fname"></span></button>`;
      }).join('');
      return `<div class="reel" data-country="${cid}"><p class="reel__name js-rname"></p><div class="reel__frames">${frames}</div></div>`;
    }).join('');
    paintRoll();
  }
  function paintRoll() {
    $$('.reel', rollEl).forEach(r => { $('.js-rname', r).textContent = L(COUNTRY[r.dataset.country].name); });
    $$('.frame', rollEl).forEach(f => {
      const s = SLIDES[f.dataset.slide];
      $('.js-fname', f).textContent = L(s.place);
      f.setAttribute('aria-label', t('frameAria', L(s.place), L(COUNTRY[f.dataset.country].name)));
    });
  }
  let ringTimer = 0;
  function markSpot(id) {
    clearTimeout(ringTimer);
    if (ringId === id) return;
    ringId = id;
    schedule();
    if (!id) return;
    const pin = pinOf(SLIDES[id].country);
    wake(pin);
    // the view leans toward the place; all the way if it is out of sight
    const m = SPOT_M[id], s = mToS(m), hy = horizonY();
    const seen = s[2] > 0.25 && s[0] > 60 && s[0] < vw - 60 && s[1] > Math.max(hy + 0.1 * vh, TOP_H + 40) && s[1] < vh - ROLL_H - 30;
    const c = camState().c;
    const f = seen ? 0.22 : 1;
    flyTo({ c: [lerp(c[0], m[0], f), lerp(c[1], m[1], f)], k: cam.k }, seen ? 700 : 1100);
  }
  function unmarkSpot() { ringTimer = setTimeout(() => { ringId = null; wake(null); schedule(); }, 140); }
  rollEl.addEventListener('pointerover', e => { if (e.pointerType !== 'mouse') return; const f = e.target.closest('.frame'); if (f) markSpot(f.dataset.slide); });
  rollEl.addEventListener('pointerout', e => { if (e.pointerType !== 'mouse') return; const f = e.target.closest('.frame'); if (f && !f.contains(e.relatedTarget)) unmarkSpot(); });
  rollEl.addEventListener('focusin', e => { const f = e.target.closest('.frame'); if (f) markSpot(f.dataset.slide); });
  rollEl.addEventListener('focusout', e => { const f = e.target.closest('.frame'); if (f && !rollEl.contains(e.relatedTarget)) unmarkSpot(); });
  rollEl.addEventListener('click', e => {
    const f = e.target.closest('.frame');
    if (!f) return;
    dive(f.dataset.country, { coverId: f.dataset.slide, trigger: f });
  });
  rollEl.addEventListener('keydown', e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const fs = $$('.frame', rollEl), i = fs.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    const n = fs[clamp(i + (e.key === 'ArrowRight' ? 1 : -1), 0, fs.length - 1)];
    n.focus();
    n.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: RM.matches ? 'auto' : 'smooth' });
  });
  // a vertical wheel over the roll scrolls it sideways; the map behind keeps still
  rollScroll.addEventListener('wheel', e => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault();
    rollScroll.scrollLeft += e.deltaY;
  }, { passive: false });

  /* ------------------------------------------------------------ the list of places */

  const placesEl = $('#places');
  const placesBtn = $('#places-btn');
  function buildPlaces() {
    $('#places-list').innerHTML = S.books.map(b => {
      const c = COUNTRY[b.country], n = photosOf(b.country).length;
      return `<li><button type="button" class="place" data-dive="${b.country}"><span class="place__name js-pname"></span><span class="place__sub js-pdate"></span><span class="place__sub js-pline"></span></button></li>`;
    }).join('');
    paintPlaces();
    $$('[data-dive]', placesEl).forEach(n => n.addEventListener('click', () => { const cid = n.dataset.dive; closePlaces(); dive(cid, { trigger: placesBtn }); }));
  }
  function paintPlaces() {
    $$('.place', placesEl).forEach(n => {
      const cid = n.dataset.dive, c = COUNTRY[cid], b = BOOK_OF[cid], k = photosOf(cid).length;
      $('.js-pname', n).textContent = L(c.name);
      $('.js-pdate', n).textContent = L(c.date);
      $('.js-pline', n).textContent = k ? `${t('nPhotos', k)}, ${statusOf(b)}` : t('bandNone');
      n.setAttribute('aria-label', t('flyTo', L(c.name)));
    });
  }
  function openPlaces() {
    placesEl.hidden = false;
    placesBtn.setAttribute('aria-expanded', 'true');
    $('#places-title').focus({ preventScroll: true });
  }
  function closePlaces(refocus) {
    if (placesEl.hidden) return;
    placesEl.hidden = true;
    placesBtn.setAttribute('aria-expanded', 'false');
    if (refocus) placesBtn.focus({ preventScroll: true });
  }
  placesBtn.addEventListener('click', () => (placesEl.hidden ? openPlaces() : closePlaces(true)));
  $('#places-close').addEventListener('click', () => closePlaces(true));

  /* ------------------------------------------------------------ the descent: a place becomes its photograph */

  const windowEl = $('#window');
  const coverEl = $('#cover');
  const leaf = $('#leaf');
  const leafScroll = $('#leaf-scroll');
  const leafCover = $('#leaf-cover');
  const leafContent = $('#leaf-content');
  let open = null;

  function coverMarkup(o) {
    const c = COUNTRY[o.cid];
    if (o.coverId && SLIDES[o.coverId]) {
      const s = SLIDES[o.coverId];
      return `<img src="${img(s.file, 1280)}" srcset="${img(s.file, 1280)} 1280w, ${img(s.file)} 2400w" sizes="100vw" alt="${esc(L(s.alt))}" width="${s.w}" height="${s.h}" decoding="async" fetchpriority="high">`
        + `<p class="cover__cap"><span class="cover__place">${esc(L(s.place))}</span><span class="cover__where">${esc(L(s.where))}</span><span class="cover__ll">${esc(fmtLL(s.ll))}</span></p>`;
    }
    return `<div class="cover__blank"><span class="cover__place">${esc(L(c.name))}</span><span class="cover__where">${esc(t('bandNone'))}</span><span class="cover__ll">${esc(fmtLL(c.ll))}</span></div>`;
  }
  function paintCover(el, o) {
    el.innerHTML = coverMarkup(o);
    el.classList.toggle('cover--blank', !(o.coverId && SLIDES[o.coverId]));
  }
  const fullRect = () => ({ top: '0px', left: '0px', width: vw + 'px', height: vh + 'px' });
  const rectOf = r => ({ top: r.top + 'px', left: r.left + 'px', width: r.width + 'px', height: r.height + 'px' });
  const centerRect = () => ({ top: gy - 80, left: gx - 50, width: 100, height: 140 });

  function dive(cid, opts = {}) {
    const b = BOOK_OF[cid];
    if (!b) return;
    if (open) { if (open.cid === cid) return; finishClose(true); }
    closePlaces();
    const coverId = opts.coverId || b.photo || null;
    const push = opts.push !== false;
    if (push) history.pushState({ cid }, '', '#' + hashOf(cid));
    open = { cid, b, coverId, trigger: opts.trigger, before: opts.before || camState(), pushed: push, phase: 'fly', anim: null, timer: 0 };
    renderLeaf(open);
    windowEl.classList.add('is-diving');
    ringId = null;
    const to = landing(cid);
    if (RM.matches || opts.instant) { setCam(to); schedule(); showLeaf(true); return; }
    flyTo(to, 2000, null);
    open.timer = setTimeout(() => { if (open && open.phase === 'fly') growCover(); }, 1250);
  }

  function growCover() {
    const o = open;
    if (!o.coverId) { showLeaf(true); return; }
    o.phase = 'cover';
    const r = faceRect(pinOf(o.cid)) || centerRect();
    paintCover(coverEl, o);
    coverEl.classList.remove('is-captioned');
    coverEl.hidden = false;
    const a = coverEl.animate([rectOf(r), fullRect()], { duration: 950, easing: EASE, fill: 'forwards' });
    o.anim = a;
    o.timer = setTimeout(() => { if (open === o) coverEl.classList.add('is-captioned'); }, 600);
    a.onfinish = () => { if (open === o && o.anim === a && o.phase === 'cover') showLeaf(false); };
  }

  function showLeaf(faded) {
    const o = open;
    o.phase = 'page';
    windowEl.classList.remove('is-diving');
    leaf.hidden = false;
    leafScroll.scrollTop = 0;
    leaf.classList.remove('is-scrolled');
    windowEl.inert = true;
    document.body.classList.add('is-reading');
    if (faded) leaf.animate([{ opacity: 0 }, { opacity: 1 }], { duration: o.coverId ? 200 : 420, easing: 'ease-out' });
    // the animated cover leaves once the page's own cover has painted beneath it
    requestAnimationFrame(() => requestAnimationFrame(() => { if (open === o) { coverEl.hidden = true; coverEl.getAnimations().forEach(x => x.cancel()); } }));
    $('#leaf-back').focus({ preventScroll: true });
    const name = L(COUNTRY[o.cid].name);
    document.title = `${name}, tuan photography 陳亮元`;
    live(t('landed', name));
  }

  function closeDive(opts = {}) {
    if (!open) return;
    if (!opts.fromPop && open.pushed) { history.back(); return; }
    if (!opts.fromPop && !open.pushed) history.replaceState(null, '', location.pathname + location.search);
    const o = open;
    if (o.phase === 'closing') return;
    clearTimeout(o.timer);
    const climb = () => { coverEl.hidden = true; coverEl.getAnimations().forEach(x => x.cancel()); quietFocus = true; finishClose(false); quietFocus = false; flyTo(o.before, RM.matches ? 0 : 1500, null); };
    if (RM.matches) { quietFocus = true; finishClose(false); quietFocus = false; setCam(o.before); schedule(); return; }
    if (o.phase === 'fly') { o.phase = 'closing'; climb(); return; }
    if (o.phase === 'cover') {
      o.phase = 'closing';
      o.anim.reverse();
      coverEl.classList.remove('is-captioned');
      o.anim.onfinish = () => climb();
      return;
    }
    o.phase = 'closing';
    if (!o.coverId) {
      // no photograph: the page lifts away from the map, then the camera climbs out
      const a = leaf.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: 'ease-in', fill: 'forwards' });
      a.onfinish = () => { a.cancel(); climb(); };
      return;
    }
    // the photograph shrinks back to its book, then the camera climbs out
    const r = faceRect(pinOf(o.cid)) || centerRect();
    paintCover(coverEl, o);
    coverEl.classList.add('is-captioned');
    coverEl.hidden = false;
    leaf.hidden = true;
    windowEl.inert = false;
    document.body.classList.remove('is-reading');
    const a = coverEl.animate([fullRect(), rectOf(r)], { duration: 720, easing: 'cubic-bezier(0.7, 0, 0.2, 1)', fill: 'forwards' });
    o.anim = a;
    setTimeout(() => coverEl.classList.remove('is-captioned'), 80);
    a.onfinish = () => climb();
  }

  function finishClose(silent) {
    if (!open) return;
    const o = open;
    open = null;
    clearTimeout(o.timer);
    leaf.hidden = true;
    leafContent.innerHTML = '';
    leafCover.innerHTML = '';
    if (tocIO) { tocIO.disconnect(); tocIO = null; }
    windowEl.inert = false;
    windowEl.classList.remove('is-diving');
    document.body.classList.remove('is-reading');
    document.title = 'tuan photography 陳亮元';
    if (!silent && o.trigger && document.contains(o.trigger)) o.trigger.focus({ preventScroll: true });
  }

  $('#leaf-back').addEventListener('click', () => closeDive());

  function syncHash(first) {
    const cid = fromHash(location.hash);
    if (cid) {
      if (!open || open.cid !== cid) {
        if (open) finishClose(true);
        dive(cid, { push: false, instant: first, before: first ? homeView() : undefined });
      }
    } else if (open) closeDive({ fromPop: true });
  }
  addEventListener('popstate', () => syncHash(false));

  /* ------------------------------------------------------------ the pages beneath the cover */

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

  const pageEnd = (photos = true) => `<footer class="page-end"><button class="word word--rule" type="button" data-back>${esc(t('back'))}</button>${photos ? `<span>${esc(t('endLine'))}</span>` : ''}</footer>`;

  function renderGuide(o) {
    const g = S.guides[o.b.guide];
    leafContent.innerHTML = `<article class="guide">${g.html}</article>`;
    // design 1's entrance order props are not this page's
    $$('[style]', leafContent).forEach(n => n.removeAttribute('style'));
    $$('.rise, .arrive', leafContent).forEach(n => n.classList.remove('rise', 'arrive'));
    fillGuide(leafContent, g.i18n[lang] || g.i18n.en);
    const h1 = $('h1', leafContent);
    h1.id = 'leaf-title';
    h1.tabIndex = -1;
    const meta = $('.guide-top .meta', leafContent);
    if (meta) meta.insertAdjacentHTML('afterend', `<p class="guide-facts">${esc(L(g.facts))}</p>`);
    $('.wrap', leafContent).insertAdjacentHTML('beforeend', pageEnd());
    $$('a[data-slide]', leafContent).forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        const ids = $$('a[data-slide]', leafContent).map(x => x.dataset.slide).filter((v, i, arr) => arr.indexOf(v) === i);
        openViewer(ids, ids.indexOf(a.dataset.slide), a);
      });
    });
    tocWatch();
  }

  function rowsOf(ids) {
    const target = PHONE.matches ? 1 : 2.6;
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

  function renderPlace(o) {
    const c = COUNTRY[o.cid], ids = photosOf(o.cid);
    let body;
    if (ids.length) {
      body = `<div class="rows">${rowsOf(ids).map(r => `<div class="row">${r.row.map(([id, ar]) => {
        const s = SLIDES[id];
        return `<figure class="piece" data-ar="${ar.toFixed(4)}"><button type="button" data-view="${ids.indexOf(id)}" aria-label="${esc(t('made', L(s.place)))}"><img src="${img(s.file, 1280)}" srcset="${img(s.file, 640)} 640w, ${img(s.file, 1280)} 1280w, ${img(s.file)} 2400w" sizes="(max-width: 48rem) 94vw, 40vw" width="${s.w}" height="${s.h}" alt="${esc(L(s.alt))}" loading="lazy" decoding="async"></button><figcaption><b>${esc(L(s.place))}</b><span>${esc(L(s.where))}</span></figcaption></figure>`;
      }).join('')}${r.last && r.sum < 2.1 && !PHONE.matches ? `<span class="piece" aria-hidden="true" data-ar="${(2.6 - r.sum).toFixed(4)}"></span>` : ''}</div>`).join('')}</div>`;
    } else {
      body = `<div class="empty-page"><b>${esc(t('bandNone'))}</b><span>${esc(L(c.note))}</span></div>`;
    }
    leafContent.innerHTML = `<div class="wrap">
      <header class="place-top">
        <h1 class="page-title" id="leaf-title" tabindex="-1">${esc(L(c.name))}</h1>
        <p class="meta">${esc(L(c.date))}</p>
        ${ids.length ? `<p class="page-lede">${esc(L(c.note))}</p>` : ''}
        <p class="quiet-line">${esc(t('bookNot'))}</p>
      </header>${body}${pageEnd(ids.length > 0)}</div>`;
    $$('[data-ar]', leafContent).forEach(n => n.style.setProperty('--ar', n.dataset.ar));
    $$('[data-view]', leafContent).forEach(n => n.addEventListener('click', () => openViewer(ids, +n.dataset.view, n)));
  }

  function renderLeaf(o) {
    leaf.classList.toggle('is-blank', !o.coverId);
    paintCover(leafCover, o);
    leafCover.classList.add('is-captioned');
    if (o.b.guide && S.guides[o.b.guide]) renderGuide(o); else renderPlace(o);
    $$('[data-back]', leafContent).forEach(n => n.addEventListener('click', () => closeDive()));
    $('#leaf-ref').textContent = L(o.b.title);
  }

  let tocIO = null;
  function tocWatch() {
    if (tocIO) tocIO.disconnect();
    const links = $$('.toc a', leafContent);
    if (!links.length || !('IntersectionObserver' in window)) return;
    const byId = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
    tocIO = new IntersectionObserver(es => {
      for (const e of es) {
        if (!e.isIntersecting) continue;
        links.forEach(a => a.removeAttribute('aria-current'));
        const a = byId.get(e.target.id); if (a) a.setAttribute('aria-current', 'true');
      }
    }, { root: leafScroll, rootMargin: '0px 0px -70% 0px' });
    byId.forEach((a, id) => { const h = document.getElementById(id); if (h) tocIO.observe(h); });
  }
  leafContent.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.dataset.slide) return;
    const id = a.getAttribute('href').slice(1);
    const target = id && document.getElementById(id);
    e.preventDefault();
    if (target) { target.scrollIntoView({ behavior: RM.matches ? 'auto' : 'smooth', block: 'start' }); target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
  });
  leafScroll.addEventListener('scroll', () => leaf.classList.toggle('is-scrolled', leafScroll.scrollTop > vh * 0.6), { passive: true });

  /* ------------------------------------------------------------ a photograph, larger, with how it was made */

  function slideFacts(s) {
    const set = [s.focal, s.aperture, s.shutter, s.iso && `ISO ${s.iso}`].filter(Boolean);
    let h = '';
    if (s.camera) h += `<dt>${esc(t('camera'))}</dt><dd>${esc(s.camera)}</dd>`;
    if (s.lens) h += `<dt>${esc(t('lens'))}</dt><dd>${esc(s.lens)}</dd>`;
    if (set.length) h += `<dt>${esc(t('settings'))}</dt><dd class="facts__set">${set.map(v => `<span>${esc(v)}</span>`).join('')}</dd>`;
    if (s.best) h += `<dt>${esc(t('best'))}</dt><dd>${esc(L(s.best))}</dd>`;
    return h ? `<dl class="facts">${h}</dl>` : '';
  }

  const viewer = $('#viewer');
  let view = null;
  function openViewer(ids, i, opener) {
    view = { ids, i: clamp(i, 0, ids.length - 1), opener };
    viewer.hidden = false;
    leaf.inert = true;
    paintViewer();
    $('#viewer-close').focus({ preventScroll: true });
  }
  function paintViewer() {
    if (!view) return;
    const id = view.ids[view.i], s = SLIDES[id];
    const im = new Image();
    im.srcset = `${img(s.file, 1280)} 1280w, ${img(s.file)} 2400w`;
    im.sizes = '(max-width: 48rem) 100vw, 72vw';
    im.src = img(s.file, 1280);
    im.alt = L(s.alt);
    im.width = s.w; im.height = s.h;
    $('.viewer__frame').replaceChildren(im);
    $('#viewer-cap').innerHTML = `<h2 id="viewer-title">${esc(L(s.place))}</h2><p class="meta">${esc(L(s.where))}</p><p class="meta">${esc(fmtLL(s.ll))}</p>${s.note ? `<p class="viewer__note">${esc(L(s.note))}</p>` : ''}${slideFacts(s)}${s.map ? `<p class="viewer__maps"><a href="${esc(s.map)}" target="_blank" rel="noopener">${esc(t('openMaps'))}</a></p>` : ''}`;
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
    leaf.inert = false;
    if (o && document.contains(o)) o.focus({ preventScroll: true });
  }
  const step = d => { if (!view) return; const n = clamp(view.i + d, 0, view.ids.length - 1); if (n !== view.i) { view.i = n; paintViewer(); } };
  $('#viewer-prev').addEventListener('click', () => step(-1));
  $('#viewer-next').addEventListener('click', () => step(1));
  $('#viewer-close').addEventListener('click', closeViewer);
  let sx0 = null;
  viewer.addEventListener('pointerdown', e => { sx0 = e.clientX; });
  viewer.addEventListener('pointerup', e => { if (sx0 != null && Math.abs(e.clientX - sx0) > 60) step(e.clientX < sx0 ? 1 : -1); sx0 = null; });

  /* ------------------------------------------------------------ keys */

  function trap(e, root) {
    const f = $$('button:not([disabled]):not([hidden]), a[href], [tabindex="-1"]:focus', root);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  document.addEventListener('keydown', e => {
    if (view) {
      if (e.key === 'Escape') { e.preventDefault(); closeViewer(); }
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'Tab') trap(e, viewer);
      return;
    }
    if (open) {
      if (e.key === 'Escape') { e.preventDefault(); closeDive(); }
      return;
    }
    if (e.key === 'Escape' && !placesEl.hidden) { e.preventDefault(); closePlaces(true); }
  });
  const busy = () => !!open;
  viewEl.addEventListener('keydown', e => {
    if (e.target !== viewEl || busy()) return;
    const d = 150;
    const go = (dx, dy) => {
      e.preventDefault();
      const m = sToM(gx + dx, gy + dy); if (!m) return;
      flyTo({ c: m, k: cam.k }, RM.matches ? 0 : 220);
    };
    if (e.key === 'ArrowLeft') go(-d, 0);
    else if (e.key === 'ArrowRight') go(d, 0);
    else if (e.key === 'ArrowUp') go(0, -d);
    else if (e.key === 'ArrowDown') go(0, d);
    else if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomBy(2); }
    else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomBy(0.5); }
    else if (e.key === '0') { e.preventDefault(); flyTo(homeView(), 1000); }
  });

  function zoomBy(f, at) {
    const p = at || [gx, gy];
    const g0 = groundAt(p[0], p[1]); if (!g0) return;
    const m0 = gToM(g0);
    const k1 = clamp(cam.k * f, K_MIN, K_MAX);
    // keep the map point under the pointer where it is
    const c = [-(g0[0] - m0[0] * k1) / k1, -(g0[1] - m0[1] * k1) / k1];
    flyTo({ c, k: k1 }, RM.matches ? 0 : 380);
  }
  $('#zoom-in').addEventListener('click', () => zoomBy(2));
  $('#zoom-out').addEventListener('click', () => zoomBy(0.5));
  $('#zoom-world').addEventListener('click', () => flyTo(homeView(), 1100));

  /* ------------------------------------------------------------ pointer on the ground */

  let pointerDown = false;
  const touches = new Map();   // pointerId -> { sx, sy, m }
  let dragged = false, downAt = null;

  viewEl.addEventListener('pointerdown', e => {
    if (busy() || e.button > 0) return;
    if (e.target.closest('.book')) return;
    cancelFlight();
    pointerDown = true; dragged = false; downAt = [e.clientX, e.clientY];
    const g = groundAt(e.clientX, e.clientY);
    if (!g) return;
    touches.set(e.pointerId, { sx: e.clientX, sy: e.clientY, m: gToM(g) });
    viewEl.setPointerCapture(e.pointerId);
    viewEl.classList.add('is-dragging');
  });
  viewEl.addEventListener('pointermove', e => {
    const tch = touches.get(e.pointerId);
    if (tch) {
      if (Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) dragged = true;
      tch.sx = e.clientX; tch.sy = e.clientY;
      const all = [...touches.values()];
      if (all.length >= 2) {
        // pinch: the two map points under the fingers stay under the fingers
        const a = all[0], b = all[1];
        const ga = groundAt(a.sx, a.sy), gb = groundAt(b.sx, b.sy);
        if (!ga || !gb) return;
        const dg = Math.hypot(ga[0] - gb[0], ga[1] - gb[1]);
        const dm = Math.hypot(a.m[0] - b.m[0], a.m[1] - b.m[1]) || 1e-6;
        const k1 = clamp(dg / dm, K_MIN, K_MAX);
        const mg = [(ga[0] + gb[0]) / 2, (ga[1] + gb[1]) / 2], mm = [(a.m[0] + b.m[0]) / 2, (a.m[1] + b.m[1]) / 2];
        setCam({ c: [-(mg[0] - mm[0] * k1) / k1, -(mg[1] - mm[1] * k1) / k1], k: k1 });
      } else {
        const g = groundAt(e.clientX, e.clientY);
        if (!g) return;
        setCam({ c: [-(g[0] - tch.m[0] * cam.k) / cam.k, -(g[1] - tch.m[1] * cam.k) / cam.k], k: cam.k });
      }
      schedule();
      return;
    }
    if (e.pointerType !== 'mouse' || busy()) return;
    hover(e);
  });
  const endTouch = e => {
    if (touches.has(e.pointerId)) {
      touches.delete(e.pointerId);
      // after a pinch, the remaining finger starts a fresh drag
      for (const [id, tt] of touches) { const g = groundAt(tt.sx, tt.sy); if (g) tt.m = gToM(g); void id; }
    }
    if (!touches.size) { viewEl.classList.remove('is-dragging'); setTimeout(() => { pointerDown = false; }, 0); }
  };
  viewEl.addEventListener('pointerup', endTouch);
  viewEl.addEventListener('pointercancel', endTouch);
  viewEl.addEventListener('lostpointercapture', endTouch);

  viewEl.addEventListener('wheel', e => {
    if (busy()) return;
    e.preventDefault();
    cancelFlight();
    const d = -e.deltaY * (e.deltaMode === 1 ? 0.05 : e.deltaMode ? 1 : 0.002) * (e.ctrlKey ? 10 : 1);
    const g0 = groundAt(e.clientX, e.clientY); if (!g0) return;
    const m0 = gToM(g0);
    const k1 = clamp(cam.k * Math.pow(2, d), K_MIN, K_MAX);
    setCam({ c: [-(g0[0] - m0[0] * k1) / k1, -(g0[1] - m0[1] * k1) / k1], k: k1 });
    schedule();
  }, { passive: false });

  viewEl.addEventListener('dblclick', e => {
    if (busy() || e.target.closest('.book')) return;
    zoomBy(e.shiftKey ? 0.5 : 2, [e.clientX, e.clientY]);
  });

  let hoverRaf = 0, lastMove = null;
  function hover(e) {
    lastMove = e;
    if (hoverRaf) return;
    hoverRaf = requestAnimationFrame(() => {
      hoverRaf = 0;
      const ev = lastMove;
      // a book wakes when the pointer comes near it
      let best = null, bd = 56;
      for (const p of PINS) {
        if (!p.shown) continue;
        const d = Math.hypot(ev.clientX - p.x, ev.clientY - (p.y - 136 * p.s));
        if (d < bd) { bd = d; best = p; }
      }
      if (!ev.target.closest('.book')) wake(best);
      const f = ev.target.closest('.book') ? null : hitCountry(ev.clientX, ev.clientY);
      const iso = f ? f.iso : null;
      viewEl.classList.toggle('is-over-place', !!f);
      if (iso !== hoverIso) { hoverIso = iso; schedule(); }
    });
  }
  viewEl.addEventListener('pointerleave', () => { wake(null); if (hoverIso) { hoverIso = null; schedule(); } });

  // a tap on one of his countries flies there; a tap elsewhere is just the ground
  viewEl.addEventListener('click', e => {
    if (busy() || e.target.closest('.book') || dragged) return;
    const f = hitCountry(e.clientX, e.clientY);
    if (f) dive(f.cid, { trigger: pinOf(f.cid) && pinOf(f.cid).a });
  });

  /* ------------------------------------------------------------ language */

  function applyLang(first) {
    document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en';
    $$('[data-t]').forEach(n => { n.textContent = t(n.dataset.t); });
    $$('[data-t-aria]').forEach(n => n.setAttribute('aria-label', t(n.dataset.tAria)));
    $$('[data-lang]').forEach(n => n.setAttribute('aria-pressed', String(n.dataset.lang === lang)));
    if (first) return;
    paintBooks();
    paintRoll();
    paintPlaces();
    if (open) {
      const top = leafScroll.scrollTop;
      renderLeaf(open);
      leafScroll.scrollTop = top;
      document.title = `${L(COUNTRY[open.cid].name)}, tuan photography 陳亮元`;
    }
    if (view) paintViewer();
    if (lang === 'zh' && document.fonts) document.fonts.load('500 13px "Noto Sans TC"', S.countries.map(c => c.name.zh).join('')).then(schedule, schedule);
    schedule();
  }
  $$('[data-lang]').forEach(n => n.addEventListener('click', () => {
    if (n.dataset.lang === lang) return;
    lang = n.dataset.lang;
    try { localStorage.setItem('tlap-lang', lang); } catch (e) { /* storage blocked */ }
    applyLang(false);
  }));

  /* ------------------------------------------------------------ start */

  async function start() {
    readColours();
    applyLang(true);
    layout();
    buildBooks();
    buildRoll();
    buildPlaces();
    setCam(homeView());
    schedule();
    try {
      const topo = await fetch('../vendor/countries-110m.json').then(r => r.json());
      G110 = shapes(topo);
      schedule();
    } catch (e) { /* the books still stand on the sea */ }
    syncHash(true);
    if (document.fonts) document.fonts.ready.then(schedule);
    const idle = window.requestIdleCallback || (f => setTimeout(f, 300));
    idle(async () => {
      try {
        const topo = await fetch('../vendor/countries-50m.json').then(r => r.json());
        G50 = shapes(topo);
        schedule();
      } catch (e) { /* 110m stays */ }
    });
  }

  let rz = 0, wasPhone = PHONE.matches;
  addEventListener('resize', () => {
    cancelAnimationFrame(rz);
    rz = requestAnimationFrame(() => {
      const s = camState();
      layout();
      if (open) setCam(landing(open.cid));
      else { if (wasPhone !== PHONE.matches) s.tilt = TILT0; setCam(s); }
      if (wasPhone !== PHONE.matches) { wasPhone = PHONE.matches; buildRoll(); }
      schedule();
    });
  });

  start();
})();

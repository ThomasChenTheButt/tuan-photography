/* tuan photography 陳亮元 · design 2 · "The dive"
   One globe. Turn it, put a finger on a place, and fall into it: the globe grows until the
   country fills the window, the cover photograph takes over, and the page begins beneath. */
(() => {
  'use strict';

  const S = window.SITE;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (v) => String(v ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const wait = (ms) => new Promise((res) => setTimeout(res, ms));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const still = () => reduce.matches;

  /* ---------------------------------------------------------------- words */

  const STR = {
    en: {
      globe: 'Globe',
      globeHelp: 'A globe of the places Thomas Chen has photographed. Arrow keys turn it, plus and minus zoom, Enter dives into the place nearest the middle. The list of places and the index of photographs lead to the same pages.',
      places: 'Places', hidePlaces: 'Hide', index: 'Index of photographs',
      zoomIn: 'Zoom in', zoomOut: 'Zoom out',
      ig: 'Instagram', prev: 'Previous', next: 'Next',
      facing: (n) => `${n} is in the middle. Press Enter to dive in.`,
      opening: (n) => `Opening ${n}.`,
      photosN: (n) => (n === 1 ? '1 photograph' : `${n} photographs`),
      guideTag: 'guide', iso: 'ISO',
    },
    zh: {
      globe: '地球儀',
      globeHelp: '陳亮元拍過的地方，做成一顆地球儀。方向鍵轉動，加號與減號縮放，Enter 進入最靠近中央的地方。地點清單與照片索引通往同樣的頁面。',
      places: '地點', hidePlaces: '收起', index: '照片索引',
      zoomIn: '放大', zoomOut: '縮小',
      ig: 'Instagram', prev: '上一張', next: '下一張',
      facing: (n) => `${n}在中央。按 Enter 進入。`,
      opening: (n) => `正在打開${n}。`,
      photosN: (n) => `${n} 張照片`,
      guideTag: '攻略', iso: 'ISO',
    },
  };

  let lang = 'en';
  try { const v = localStorage.getItem('tlap-lang'); if (v === 'en' || v === 'zh') lang = v; } catch (e) { /* storage blocked */ }
  const qlang = new URLSearchParams(location.search).get('lang');
  if (qlang === 'en' || qlang === 'zh') lang = qlang;
  const t = (k) => (k in STR[lang] ? STR[lang][k] : (S.i18n[lang][k] ?? k));

  function coord(ll) {
    const [la, lo] = ll;
    const f = (v) => `${Math.abs(v).toFixed(2)}°`;
    if (lang === 'zh') return `${la >= 0 ? '北緯' : '南緯'} ${f(la)} · ${lo >= 0 ? '東經' : '西經'} ${f(lo)}`;
    return `${f(la)}${la >= 0 ? 'N' : 'S'} · ${f(lo)}${lo >= 0 ? 'E' : 'W'}`;
  }

  /* ---------------------------------------------------------------- places */

  const ISO = {
    spain: '724', uk: '826', france: '250', germany: '276', switzerland: '756', taiwan: '158',
    japan: '392', 'south-korea': '410', 'hong-kong': '344', china: '156', singapore: '702',
    vietnam: '704', dubai: '784', australia: '036', 'new-zealand': '554', usa: '840',
  };
  const BY_ISO = Object.fromEntries(Object.entries(ISO).map(([c, i]) => [i, c]));
  const COUNTRY = Object.fromEntries(S.countries.map((c) => [c.id, c]));
  const BOOKS = S.books.map((b) => {
    const c = COUNTRY[b.country];
    const ll = b.guide ? S.guides[b.guide].ll : c.ll;
    return { ...b, c, ll, lonlat: [ll[1], ll[0]], hash: b.guide ? `guide-${b.guide}` : `place-${b.country}` };
  });
  const byHash = Object.fromEntries(BOOKS.map((b) => [b.hash, b]));
  const bookOfCountry = (id) => BOOKS.find((b) => b.country === id);
  const slideLonlat = (id) => { const s = S.slides[id]; return [s.ll[1], s.ll[0]]; };

  /* ---------------------------------------------------------------- versor maths */

  const RAD = Math.PI / 180, DEG = 180 / Math.PI;
  function versor([l, p, g]) {
    l *= RAD / 2; p *= RAD / 2; g *= RAD / 2;
    const sl = Math.sin(l), cl = Math.cos(l), sp = Math.sin(p), cp = Math.cos(p), sg = Math.sin(g), cg = Math.cos(g);
    return [cl * cp * cg + sl * sp * sg, sl * cp * cg - cl * sp * sg, cl * sp * cg + sl * cp * sg, cl * cp * sg - sl * sp * cg];
  }
  versor.cartesian = ([l, p]) => { l *= RAD; p *= RAD; return [Math.cos(p) * Math.cos(l), Math.cos(p) * Math.sin(l), Math.sin(p)]; };
  versor.rotation = ([a, b, c, d]) => [
    Math.atan2(2 * (a * b + c * d), 1 - 2 * (b * b + c * c)) * DEG,
    Math.asin(clamp(2 * (a * c - d * b), -1, 1)) * DEG,
    Math.atan2(2 * (a * d + b * c), 1 - 2 * (c * c + d * d)) * DEG,
  ];
  versor.delta = (v0, v1) => {
    const w = [v0[1] * v1[2] - v0[2] * v1[1], v0[2] * v1[0] - v0[0] * v1[2], v0[0] * v1[1] - v0[1] * v1[0]];
    const l = Math.hypot(w[0], w[1], w[2]);
    if (!l) return [1, 0, 0, 0];
    const th = Math.acos(clamp(v0[0] * v1[0] + v0[1] * v1[1] + v0[2] * v1[2], -1, 1)) / 2, s = Math.sin(th);
    return [Math.cos(th), (w[2] / l) * s, (-w[1] / l) * s, (w[0] / l) * s];
  };
  versor.multiply = ([a1, b1, c1, d1], [a2, b2, c2, d2]) => [
    a1 * a2 - b1 * b2 - c1 * c2 - d1 * d2,
    a1 * b2 + b1 * a2 + c1 * d2 - d1 * c2,
    a1 * c2 - b1 * d2 + c1 * a2 + d1 * b2,
    a1 * d2 + b1 * c2 - c1 * b2 + d1 * a2,
  ];
  const conj = ([a, b, c, d]) => [a, -b, -c, -d];
  function slerp(a, b, e) {
    let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
    if (d < 0) { b = b.map((x) => -x); d = -d; }
    if (d > 0.9995) { const r = a.map((x, i) => x + (b[i] - x) * e); const n = Math.hypot(...r); return r.map((x) => x / n); }
    const th = Math.acos(d), s = Math.sin(th), wa = Math.sin((1 - e) * th) / s, wb = Math.sin(e * th) / s;
    return a.map((x, i) => wa * x + wb * b[i]);
  }
  const qAngle = (a, b) => 2 * Math.acos(clamp(Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]), 0, 1));
  const easeExpo = (e) => (e >= 1 ? 1 : 1 - Math.pow(2, -10 * e));
  const easeInOut = (e) => (e < 0.5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2);

  /* ---------------------------------------------------------------- the globe */

  const home = $('#home'), stage = $('#stage'), canvas = $('#globe'), ctx = canvas.getContext('2d');
  const marksEl = $('#marks'), leads = $('#leads'), live = $('#live');
  const page = $('#page'), pageBody = $('#page-body'), cover = $('#cover'), viewer = $('#viewer');
  const proj = d3.geoOrthographic().clipAngle(90).precision(0.4);
  const path = d3.geoPath(proj, ctx);
  const graticule = d3.geoGraticule().step([15, 15])();
  const sphere = { type: 'Sphere' };
  const KMIN = 0.75, KMAX = 14, KDIVE = 70;

  let W = 0, H = 0, SH = 0, dpr = 1, cx = 0, cy = 0, R0 = 300;
  let k = 1;
  let r = [-116, -14, 0];
  const HOME_VIEW = { r: r.slice(), k: 1 };
  let dirty = true;
  let auto = !still();
  let inertia = null;
  let anims = [];
  const world = { lo: null, hi: null, loading: false };
  const col = {};

  function readColours() {
    const cs = getComputedStyle(document.documentElement);
    for (const n of ['ocean-0', 'ocean-1', 'ocean-2', 'ocean-3', 'land-0', 'land-1', 'land-2', 'land-3', 'been', 'been-line', 'border', 'grat', 'limb', 'glint', 'atmo', 'limb-line', 'shadow', 'dot', 'blue', 'paper'])
      col[n] = cs.getPropertyValue(`--${n}`).trim();
  }

  function build(topo) {
    const all = topojson.feature(topo, topo.objects.countries).features;
    const been = all.filter((f) => BY_ISO[String(f.id)]);
    const polys = {};
    for (const f of been) {
      const id = BY_ISO[String(f.id)];
      const g = f.geometry;
      const list = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
      polys[id] = list.map((coords) => ({ type: 'Polygon', coordinates: coords }));
    }
    return {
      land: topojson.feature(topo, topo.objects.land),
      been: { type: 'FeatureCollection', features: been },
      beenList: been,
      polys,
      borders: topojson.mesh(topo, topo.objects.countries, (a, b) => a !== b),
    };
  }
  async function load(file) {
    const res = await fetch(`../vendor/${file}`);
    if (!res.ok) throw new Error(file);
    return build(await res.json());
  }
  function ensureHi() {
    if (world.hi || world.loading) return;
    world.loading = true;
    load('countries-50m.json').then((w) => { world.hi = w; dirty = true; }).catch(() => {}).finally(() => { world.loading = false; });
  }

  function layout() {
    const rc = stage.getBoundingClientRect();
    W = Math.round(rc.width); H = Math.round(rc.height); SH = rc.top;
    dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    const wide = W > 992;
    if (wide) {
      R0 = Math.max(160, Math.min(H * 0.46, (W - 300) * 0.36, 460));
      cx = Math.round(W * 0.42); cy = Math.round(H * 0.5);
    } else {
      R0 = Math.max(100, Math.min(W / 2 - 18, H * 0.46));
      cx = Math.round(W / 2); cy = Math.round(H * 0.5);
    }
    readColours();
    for (const m of MARKS) m.fresh = true;
    dirty = true;
  }

  /* ----- drawing */

  function drawShadow(a, R) {
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(cx + R * 0.1, cy + R * 1.04);
    ctx.scale(1, 0.16);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 1.05);
    g.addColorStop(0, col.shadow);
    g.addColorStop(0.55, 'oklch(25% 0.03 60 / 0.1)');
    g.addColorStop(1, 'oklch(25% 0.03 60 / 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, R * 1.05, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  function drawAtmosphere(a, R) {
    ctx.save();
    ctx.globalAlpha = a;
    const g = ctx.createRadialGradient(cx, cy, R * 0.98, cx, cy, R * 1.09);
    g.addColorStop(0, col.atmo);
    g.addColorStop(0.35, 'oklch(76% 0.07 225 / 0.18)');
    g.addColorStop(1, 'oklch(76% 0.07 225 / 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, R * 1.09, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function draw() {
    const R = R0 * k;
    const pad = 60 * Math.pow(k, 0.45);
    proj.scale(R).translate([cx, cy]).rotate(r).clipExtent([[-pad, -pad], [W + pad, H + pad]]);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const roomA = clamp((2.6 - k) / 1.2, 0, 1);
    if (roomA > 0) { drawShadow(roomA, R); drawAtmosphere(roomA, R); }

    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = col['ocean-0']; ctx.fillRect(0, 0, W, H);

    const w = k >= 1.8 && world.hi ? world.hi : world.lo;
    if (w) {
      const u = Math.pow(k, 0.42);
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      // water: three depths hugging the coast
      ctx.beginPath(); path(w.land);
      ctx.lineWidth = 30 * u; ctx.strokeStyle = col['ocean-1']; ctx.stroke();
      ctx.lineWidth = 16 * u; ctx.strokeStyle = col['ocean-2']; ctx.stroke();
      ctx.lineWidth = 6 * u; ctx.strokeStyle = col['ocean-3']; ctx.stroke();
      // land: four papers, each inset from the coast
      ctx.save();
      ctx.clip();
      ctx.fillStyle = col['land-3']; ctx.fillRect(0, 0, W, H);
      ctx.lineWidth = 52 * u; ctx.strokeStyle = col['land-2']; ctx.stroke();
      ctx.lineWidth = 26 * u; ctx.strokeStyle = col['land-1']; ctx.stroke();
      ctx.lineWidth = 9 * u; ctx.strokeStyle = col['land-0']; ctx.stroke();
      ctx.restore();
      // his sixteen countries, a warmer paper
      ctx.globalCompositeOperation = 'multiply';
      ctx.beginPath(); path(w.been); ctx.fillStyle = col.been; ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.beginPath(); path(w.borders); ctx.lineWidth = 0.5; ctx.strokeStyle = col.border; ctx.stroke();
      ctx.beginPath(); path(w.been); ctx.lineWidth = 0.7; ctx.strokeStyle = col['been-line']; ctx.stroke();
    }

    ctx.beginPath(); path(graticule); ctx.lineWidth = 0.5; ctx.strokeStyle = col.grat; ctx.stroke();

    // where the photographs were made, once you are close
    if (k >= 3) {
      const a = clamp((k - 3) / 1.5, 0, 1);
      const centre = proj.invert([cx, cy]);
      ctx.save(); ctx.globalAlpha = a;
      ctx.strokeStyle = col.dot; ctx.lineWidth = 1;
      for (const s of Object.values(S.slides)) {
        const ll = [s.ll[1], s.ll[0]];
        if (d3.geoDistance(ll, centre) > Math.PI / 2 - 0.02) continue;
        const p = proj(ll);
        if (!p || p[0] < -20 || p[0] > W + 20 || p[1] < -20 || p[1] > H + 20) continue;
        ctx.beginPath(); ctx.arc(p[0], p[1], 2.6, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
    }

    // daylight: a glint upper left, the limb falling away
    if (roomA > 0) {
      ctx.save(); ctx.globalAlpha = roomA;
      const g = ctx.createRadialGradient(cx - R * 0.4, cy - R * 0.45, R * 0.02, cx - R * 0.1, cy - R * 0.1, R * 1.15);
      g.addColorStop(0, col.glint);
      g.addColorStop(0.4, 'oklch(100% 0 0 / 0)');
      g.addColorStop(0.82, 'oklch(30% 0.05 240 / 0)');
      g.addColorStop(1, col.limb);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    ctx.restore();

    if (roomA > 0) {
      ctx.save(); ctx.globalAlpha = roomA;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.lineWidth = 1; ctx.strokeStyle = col['limb-line']; ctx.stroke();
      ctx.restore();
    }

    // the ring on a hovered photograph's spot
    if (hoverSpot && facing(hoverSpot)) {
      const p = proj(hoverSpot);
      if (p) {
        ctx.save(); ctx.strokeStyle = col.blue; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(p[0], p[1], 5.5, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
    }
    // the ring that tightens on the spot you are diving into
    if (diveRing && facing(diveRing.lonlat)) {
      const p = proj(diveRing.lonlat);
      if (p) {
        ctx.save(); ctx.globalAlpha = diveRing.a; ctx.strokeStyle = col.blue; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
        drawPen(p[0], p[1], diveRing.s, diveRing.seed);
        ctx.restore();
      }
    }
  }

  const facing = (lonlat) => d3.geoDistance(lonlat, proj.invert([cx, cy])) < Math.PI / 2 - 0.02;

  /* ----- a ring drawn by hand: the same wobble every time for one place */

  function penPoints(seed, rad) {
    let s = seed * 7919 + 13;
    const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const n = 30, pts = [];
    const a0 = rnd() * Math.PI * 2, sx = 1 + (rnd() - 0.5) * 0.14, sy = 1 + (rnd() - 0.5) * 0.14, drift = (rnd() - 0.4) * 0.12;
    for (let i = 0; i <= n + 3; i++) {
      const e = i / n;
      const a = a0 + e * Math.PI * 2;
      const rr = rad * (1 + Math.sin(a * 3 + seed) * 0.035 + (rnd() - 0.5) * 0.05 + e * drift);
      pts.push([Math.cos(a) * rr * sx, Math.sin(a) * rr * sy]);
    }
    return pts;
  }
  function penPath(seed, rad = 9.5) {
    const p = penPoints(seed, rad);
    let d = `M${p[0][0].toFixed(2)} ${p[0][1].toFixed(2)}`;
    for (let i = 0; i < p.length - 1; i++) {
      const p0 = p[Math.max(0, i - 1)], p1 = p[i], p2 = p[i + 1], p3 = p[Math.min(p.length - 1, i + 2)];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += `C${c1[0].toFixed(2)} ${c1[1].toFixed(2)} ${c2[0].toFixed(2)} ${c2[1].toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
    }
    return d;
  }
  function drawPen(x, y, sc, seed) {
    const p = penPoints(seed, 9.5 * sc);
    ctx.beginPath();
    ctx.moveTo(x + p[0][0], y + p[0][1]);
    for (let i = 0; i < p.length - 1; i++) {
      const p0 = p[Math.max(0, i - 1)], p1 = p[i], p2 = p[i + 1], p3 = p[Math.min(p.length - 1, i + 2)];
      ctx.bezierCurveTo(x + p1[0] + (p2[0] - p0[0]) / 6, y + p1[1] + (p2[1] - p0[1]) / 6, x + p2[0] - (p3[0] - p1[0]) / 6, y + p2[1] - (p3[1] - p1[1]) / 6, x + p2[0], y + p2[1]);
    }
    ctx.stroke();
  }

  /* ----- the marks: a ring at every place, its name beside it, placed every frame */

  const MARKS = [];
  let lit = null, hoverSpot = null, diveRing = null, diveTarget = null;

  function makeMarks() {
    marksEl.innerHTML = '';
    leads.innerHTML = '';
    BOOKS.forEach((b, i) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'mark';
      el.dataset.id = b.id;
      el.dataset.side = 'r';
      el.innerHTML = `<svg class="mark__ring" viewBox="-24 -24 48 48" aria-hidden="true"><path d="${penPath(i + 1)}"/></svg><span class="mark__spot" aria-hidden="true"></span><span class="mark__label"><b></b><i></i></span>`;
      marksEl.append(el);
      const lead = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      leads.append(lead);
      const m = { b, el, lead, label: el.querySelector('.mark__label'), seed: i + 1, x: 0, y: 0, cos: 1, away: true, lw: 80, lh: 28, side: 'r', shown: true, fresh: true, cache: {} };
      el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') light(m); });
      el.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && lit === m) light(null); });
      el.addEventListener('focus', () => light(m));
      el.addEventListener('blur', () => { if (lit === m) light(null); });
      el.addEventListener('click', (e) => { e.preventDefault(); if (suppressClick) return; dive(b, null, { from: el }); });
      MARKS.push(m);
    });
  }
  const markOf = (b) => MARKS.find((m) => m.b === b);
  function wordMarks() {
    for (const m of MARKS) {
      m.label.querySelector('b').textContent = m.b.title[lang];
      m.label.querySelector('i').textContent = coord(m.b.ll);
      m.el.setAttribute('aria-label', `${m.b.title[lang]}, ${m.b.c.date[lang]}`);
    }
    requestAnimationFrame(() => {
      for (const m of MARKS) { m.lw = m.label.offsetWidth || 80; m.lh = m.label.offsetHeight || 28; }
      dirty = true;
    });
  }

  function placeMarks() {
    const centre = proj.invert([cx, cy]);
    const order = [];
    for (const m of MARKS) {
      const d = d3.geoDistance(m.b.lonlat, centre);
      m.cos = Math.cos(d);
      m.away = d > Math.PI / 2 - 0.04;
      if (!m.away) {
        const p = proj(m.b.lonlat);
        if (!p) { m.away = true; } else {
          m.x = p[0]; m.y = p[1];
          m.o = clamp((m.cos - 0.08) / 0.22, 0, 1);
          if (m.o <= 0.01 || m.x < -40 || m.x > W + 40 || m.y < -40 || m.y > H + 40) m.away = true;
        }
      }
      if (m.away) { m.shown = false; continue; }
      if (diveTarget && m !== diveTarget) { m.shown = false; continue; }
      order.push(m);
    }
    order.sort((a, b) => (b === lit) - (a === lit) || (b === diveTarget) - (a === diveTarget) || b.cos - a.cos);
    const boxes = order.map((m) => [m.x - 12, m.y - 12, m.x + 12, m.y + 12]);
    const free = (bx) => {
      if (bx[0] < 6 || bx[2] > W - 6 || bx[1] < 4 || bx[3] > H - 4) return false;
      for (const q of boxes) if (bx[0] < q[2] && bx[2] > q[0] && bx[1] < q[3] && bx[3] > q[1]) return false;
      return true;
    };
    const gap = 40, lead = 6;
    for (const m of order) {
      const w = m.lw, h = m.lh;
      const cands = [
        ['r', [m.x + gap - lead, m.y - h / 2, m.x + gap + w, m.y + h / 2]],
        ['l', [m.x - gap - w, m.y - h / 2, m.x - gap + lead, m.y + h / 2]],
        ['b', [m.x - w / 2, m.y + gap - lead, m.x + w / 2, m.y + gap + h]],
        ['t', [m.x - w / 2, m.y - gap - h, m.x + w / 2, m.y - gap + lead]],
      ];
      const pref = cands.findIndex((c) => c[0] === m.side);
      if (pref > 0) cands.unshift(cands.splice(pref, 1)[0]);
      m.shown = false;
      for (const [side, bx] of cands) {
        if (free(bx)) { m.side = side; m.shown = true; boxes.push(bx); break; }
      }
      if (!m.shown && m.o > 0.5) {
        // crowded: keep the name only when a wider search finds room
        const bx = cands[0][1];
        if (bx[0] > 6 && bx[2] < W - 6 && bx[1] > 4 && bx[3] < H - 4 && m === lit) { m.shown = true; m.side = 'r'; boxes.push(bx); }
      }
    }
  }

  function setVar(m, name, v) { if (m.cache[name] !== v) { m.cache[name] = v; m.el.style.setProperty(name, v); } }
  function writeMarks() {
    for (const m of MARKS) {
      if (m.away) { if (!m.cache.away) { m.cache.away = true; m.el.classList.add('is-away'); m.lead.setAttribute('d', ''); m.cache.d = ''; } continue; }
      if (m.cache.away !== false) { m.cache.away = false; m.el.classList.remove('is-away'); }
      setVar(m, '--x', m.x.toFixed(1));
      setVar(m, '--y', m.y.toFixed(1));
      setVar(m, '--o', m.o.toFixed(2));
      if (m.cache.side !== m.side) { m.cache.side = m.side; m.el.dataset.side = m.side; }
      const quiet = !m.shown;
      if (m.cache.quiet !== quiet) { m.cache.quiet = quiet; m.el.classList.toggle('is-quiet', quiet); }
      let d = '';
      if (m.shown) {
        const x = m.x, y = m.y, rr = 12.5;
        if (m.side === 'r') d = `M${(x + rr).toFixed(1)} ${y.toFixed(1)} Q${(x + 26).toFixed(1)} ${(y + 2.5).toFixed(1)} ${(x + 36).toFixed(1)} ${y.toFixed(1)}`;
        else if (m.side === 'l') d = `M${(x - rr).toFixed(1)} ${y.toFixed(1)} Q${(x - 26).toFixed(1)} ${(y - 2.5).toFixed(1)} ${(x - 36).toFixed(1)} ${y.toFixed(1)}`;
        else if (m.side === 'b') d = `M${x.toFixed(1)} ${(y + rr).toFixed(1)} Q${(x - 2).toFixed(1)} ${(y + 26).toFixed(1)} ${x.toFixed(1)} ${(y + 36).toFixed(1)}`;
        else d = `M${x.toFixed(1)} ${(y - rr).toFixed(1)} Q${(x + 2).toFixed(1)} ${(y - 26).toFixed(1)} ${x.toFixed(1)} ${(y - 36).toFixed(1)}`;
      }
      if (m.cache.d !== d) { m.cache.d = d; m.lead.setAttribute('d', d); }
    }
    stage.style.setProperty('--cx', String(cx));
    stage.style.setProperty('--cy', String(cy));
    stage.style.setProperty('--r', (R0 * k).toFixed(1));
  }

  function renderNow() {
    proj.scale(R0 * k).translate([cx, cy]).rotate(r);
    placeMarks();
    draw();
    writeMarks();
  }

  function light(m) {
    if (lit === m) return;
    if (lit) { lit.el.classList.remove('is-lit'); lit.lead.classList.remove('is-lit'); }
    lit = m;
    if (m) { m.el.classList.add('is-lit'); m.lead.classList.add('is-lit'); }
    $$('#places-list a').forEach((a) => a.classList.toggle('is-on', !!m && a.dataset.id === m.b.id));
    dirty = true;
  }

  /* ----- motion */

  function animate(dur, ease, apply) {
    return new Promise((res) => { anims.push({ t0: performance.now(), dur, ease, apply, res }); });
  }
  function cancelAnims() { const a = anims; anims = []; a.forEach((x) => x.res(false)); }
  function interact() { auto = false; inertia = null; cancelAnims(); }

  function flyTo(lonlat, opt = {}) {
    const target = [-lonlat[0], -lonlat[1], 0];
    const q0 = versor(r), q1 = versor(target);
    const ang = qAngle(q0, q1);
    if (still() || opt.instant || ang < 0.003) { r = target; dirty = true; return Promise.resolve(true); }
    const dur = opt.dur || Math.min(1300, 500 + ang * 480);
    return animate(dur, easeExpo, (e) => { r = versor.rotation(slerp(q0, q1, e)); dirty = true; });
  }
  function zoomTo(k1, dur = 420) {
    k1 = clamp(k1, KMIN, KMAX);
    if (k1 > 1.6) ensureHi();
    if (still()) { k = k1; dirty = true; return Promise.resolve(true); }
    const k0 = k;
    return animate(dur, easeExpo, (e) => { k = k0 * Math.pow(k1 / k0, e); dirty = true; });
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(64, now - last);
    last = now;
    if (!pageOpen || busy) {
      let moving = false;
      if (anims.length) {
        moving = true;
        for (const a of anims.slice()) {
          const e = clamp((now - a.t0) / a.dur, 0, 1);
          a.apply(a.ease(e));
          if (e >= 1) { anims.splice(anims.indexOf(a), 1); a.res(true); }
        }
      } else if (inertia) {
        moving = true;
        const ang = inertia.w * dt;
        const s = Math.sin(ang / 2);
        inertia.q = versor.multiply(inertia.q, [Math.cos(ang / 2), inertia.axis[0] * s, inertia.axis[1] * s, inertia.axis[2] * s]);
        r = versor.rotation(inertia.q);
        inertia.w *= Math.exp(-dt / 480);
        if (inertia.w < 0.00003) inertia = null;
      } else if (auto) {
        moving = true;
        r = [r[0] + dt * 0.0011, r[1], r[2]];
      }
      if (moving || dirty) { dirty = false; renderNow(); }
    }
    requestAnimationFrame(frame);
  }

  /* ----- dragging (versor), pinching, the wheel, double click, keys */

  const pointers = new Map();
  let drag = null, pinch = null, downAt = null, downMark = null, suppressClick = false;

  function onDisk(x, y) {
    const R = R0 * k * 0.996, dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy);
    return d > R ? [cx + (dx / d) * R, cy + (dy / d) * R] : [x, y];
  }
  function startDrag(x, y) {
    proj.scale(R0 * k).translate([cx, cy]).rotate(r);
    const ll = proj.invert(onDisk(x, y));
    drag = { v0: versor.cartesian(ll), q0: versor(r), r0: r.slice(), x0: x, y0: y, moved: false, samples: [{ t: performance.now(), q: versor(r) }] };
  }
  function moveDrag(x, y) {
    if (!drag) return;
    if (!drag.moved && Math.hypot(x - drag.x0, y - drag.y0) < 5) return;
    if (!drag.moved) { drag.moved = true; stage.classList.add('is-dragging'); }
    proj.scale(R0 * k).translate([cx, cy]).rotate(drag.r0);
    const v1 = versor.cartesian(proj.invert(onDisk(x, y)));
    const q1 = versor.multiply(drag.q0, versor.delta(drag.v0, v1));
    r = versor.rotation(q1);
    const now = performance.now();
    drag.samples.push({ t: now, q: q1 });
    while (drag.samples.length > 2 && now - drag.samples[0].t > 120) drag.samples.shift();
    dirty = true;
  }
  function endDrag() {
    if (!drag) return;
    stage.classList.remove('is-dragging');
    const sm = drag.samples, now = performance.now();
    if (drag.moved && !still() && sm.length > 1 && now - sm[sm.length - 1].t < 70) {
      const a = sm[0], b = sm[sm.length - 1], dt = Math.max(16, b.t - a.t);
      let dq = versor.multiply(conj(a.q), b.q);
      if (dq[0] < 0) dq = dq.map((x) => -x);
      const ang = 2 * Math.acos(clamp(dq[0], -1, 1));
      const s = Math.sin(ang / 2);
      if (ang > 0.0005 && s > 1e-6) inertia = { q: b.q, axis: [dq[1] / s, dq[2] / s, dq[3] / s], w: Math.min(ang / dt, 0.012) };
    }
    if (drag.moved) { suppressClick = true; setTimeout(() => { suppressClick = false; }, 0); }
    drag = null;
  }
  const local = (e) => [e.clientX, e.clientY - SH];

  stage.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (pageOpen || busy) return;
    interact();
    try { stage.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    const [x, y] = local(e);
    pointers.set(e.pointerId, [x, y]);
    if (pointers.size === 1) {
      downMark = e.target.closest ? e.target.closest('.mark') : null;
      downAt = { x, y, t: performance.now() };
      startDrag(x, y);
    } else if (pointers.size === 2) {
      drag = null; downAt = null; downMark = null;
      const [a, b] = [...pointers.values()];
      pinch = { d0: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, k0: k };
    }
  });
  stage.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    const [x, y] = local(e);
    pointers.set(e.pointerId, [x, y]);
    if (pinch && pointers.size >= 2) {
      const [a, b] = [...pointers.values()];
      k = clamp(pinch.k0 * (Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch.d0), KMIN, KMAX);
      if (k > 1.6) ensureHi();
      dirty = true;
    } else moveDrag(x, y);
  });
  function pointerEnd(e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    if (pinch) { if (pointers.size < 2) pinch = null; return; }
    const tapped = drag && !drag.moved && downAt && performance.now() - downAt.t < 600;
    endDrag();
    if (tapped && e.type === 'pointerup') {
      if (downMark) { const m = MARKS.find((q) => q.el === downMark); if (m) dive(m.b, null, { from: downMark }); }
      else pickAt(...local(e));
    }
    downAt = null; downMark = null;
  }
  stage.addEventListener('pointerup', pointerEnd);
  stage.addEventListener('pointercancel', pointerEnd);

  stage.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (pageOpen || busy) return;
    interact();
    const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    k = clamp(k * Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.0017)), KMIN, KMAX);
    if (k > 1.6) ensureHi();
    dirty = true;
  }, { passive: false });

  stage.addEventListener('dblclick', (e) => {
    if (pageOpen || busy) return;
    interact();
    const [x, y] = local(e);
    proj.scale(R0 * k).translate([cx, cy]).rotate(r);
    if (Math.hypot(x - cx, y - cy) < R0 * k) flyTo(proj.invert([x, y]), { dur: 600 });
    zoomTo(k * 1.8, 600);
  });

  function pickAt(x, y) {
    proj.scale(R0 * k).translate([cx, cy]).rotate(r);
    if (Math.hypot(x - cx, y - cy) > R0 * k) return;
    const ll = proj.invert([x, y]);
    const w = world.hi || world.lo;
    if (!w) return;
    const f = w.beenList.find((g) => d3.geoContains(g, ll));
    if (f) { const b = bookOfCountry(BY_ISO[String(f.id)]); if (b) dive(b, null, { from: stage }); }
  }

  function nearest() {
    let best = null;
    for (const m of MARKS) if (!m.away && (!best || m.cos > best.cos)) best = m;
    return best;
  }
  let facingTimer = 0;
  function faceNearest() {
    clearTimeout(facingTimer);
    facingTimer = setTimeout(() => {
      const m = nearest();
      if (m) { light(m); live.textContent = STR[lang].facing(m.b.title[lang]); }
    }, 320);
  }
  stage.addEventListener('keydown', (e) => {
    if (pageOpen || busy) return;
    const step = 14 / Math.sqrt(k);
    let handled = true;
    const turn = (dl, dp) => {
      interact();
      const r0 = r.slice();
      const r1 = [r0[0] + dl, clamp(r0[1] + dp, -85, 85), r0[2]];
      if (still()) { r = r1; dirty = true; } else animate(260, easeExpo, (x) => { r = [r0[0] + (r1[0] - r0[0]) * x, r0[1] + (r1[1] - r0[1]) * x, r0[2]]; dirty = true; });
      faceNearest();
    };
    switch (e.key) {
      case 'ArrowLeft': turn(step, 0); break;
      case 'ArrowRight': turn(-step, 0); break;
      case 'ArrowUp': turn(0, -step); break;
      case 'ArrowDown': turn(0, step); break;
      case '+': case '=': interact(); zoomTo(k * 1.5); break;
      case '-': case '_': interact(); zoomTo(k / 1.5); break;
      case 'Enter': case ' ': { if (e.target !== stage) { handled = false; break; } const m = lit && !lit.away ? lit : nearest(); if (m) dive(m.b, null, { from: stage }); break; }
      default: handled = false;
    }
    if (handled) e.preventDefault();
  });
  stage.addEventListener('focus', () => { auto = false; });
  $('#zoom-in').addEventListener('click', () => { interact(); zoomTo(k * 1.6); });
  $('#zoom-out').addEventListener('click', () => { interact(); zoomTo(k / 1.6); });

  /* ---------------------------------------------------------------- the list of places */

  const list = $('#places-list'), places = $('#places'), placesOpen = $('#places-open');
  let listTimer = 0;
  function renderList() {
    list.innerHTML = BOOKS.map((b) => {
      const empty = !b.c.photos.length;
      const flag = b.guide ? `<i>${esc(t('guideTag'))}</i>` : '';
      return `<li><a href="#${b.hash}" data-id="${esc(b.id)}"${empty ? ' class="is-empty"' : ''}>`
        + `<span class="nm">${esc(b.title[lang])}${flag}</span><span class="dt">${esc(b.c.date[lang])}</span></a></li>`;
    }).join('');
    if (lit) $$('a', list).forEach((a) => a.classList.toggle('is-on', a.dataset.id === lit.b.id));
  }
  const bookOfLink = (a) => BOOKS.find((b) => b.id === a.dataset.id);
  function previewBook(b) {
    clearTimeout(listTimer);
    listTimer = setTimeout(() => {
      if (pageOpen || busy) return;
      interact();
      light(markOf(b));
      flyTo(b.lonlat);
    }, 140);
  }
  list.addEventListener('pointerover', (e) => { const a = e.target.closest('a'); if (a && e.pointerType === 'mouse') { const b = bookOfLink(a); if (b) previewBook(b); } });
  list.addEventListener('pointerleave', () => { clearTimeout(listTimer); light(null); });
  list.addEventListener('focusin', (e) => { const a = e.target.closest('a'); if (a) { const b = bookOfLink(a); if (b) previewBook(b); } });
  list.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    e.preventDefault();
    clearTimeout(listTimer);
    const b = bookOfLink(a);
    if (b) dive(b, null, { from: a });
  });
  function setDrawer(open) {
    places.classList.toggle('is-open', open);
    placesOpen.setAttribute('aria-expanded', String(open));
    if (open) setTimeout(() => $('#places-close').focus({ preventScroll: true }), 60);
  }
  placesOpen.addEventListener('click', () => setDrawer(!places.classList.contains('is-open')));
  $('#places-close').addEventListener('click', () => { setDrawer(false); placesOpen.focus(); });

  /* ---------------------------------------------------------------- the index strip */

  const strip = $('#strip-scroll'), stripRow = $('#strip-row');
  let stripTimer = 0, stripOn = null;
  function renderStrip() {
    stripRow.innerHTML = BOOKS.filter((b) => b.c.photos.length).map((b) => {
      const thumbs = b.c.photos.map((id) => {
        const s = S.slides[id];
        return `<button type="button" class="thumb" data-slide="${esc(id)}" data-country="${esc(b.country)}" data-ar="${(s.w / s.h).toFixed(4)}">`
          + `<span class="thumb__pic"><img src="../images/web/640/${esc(s.file)}" width="${s.w}" height="${s.h}" alt="${esc(s.alt[lang])}" loading="lazy" decoding="async"></span>`
          + `<b>${esc(s.place[lang])}</b></button>`;
      }).join('');
      return `<div class="group"><p class="group__name">${esc(b.title[lang])}<span>${esc(b.c.date[lang])}</span>${b.guide ? `<em>${esc(t('guideTag'))}</em>` : ''}</p><div class="group__row">${thumbs}</div></div>`;
    }).join('');
    $$('[data-ar]', stripRow).forEach((el) => el.style.setProperty('--ar', el.dataset.ar));
  }
  function previewSlide(id) {
    clearTimeout(stripTimer);
    stripTimer = setTimeout(() => {
      if (pageOpen || busy) return;
      interact();
      const s = S.slides[id];
      hoverSpot = slideLonlat(id);
      light(markOf(bookOfCountry(s.country)));
      flyTo(hoverSpot);
    }, 160);
  }
  function stripOff() { clearTimeout(stripTimer); hoverSpot = null; if (stripOn) { stripOn.classList.remove('is-on'); stripOn = null; } light(null); dirty = true; }
  stripRow.addEventListener('pointerover', (e) => {
    const b = e.target.closest('.thumb');
    if (!b || e.pointerType !== 'mouse' || b === stripOn) return;
    if (stripOn) stripOn.classList.remove('is-on');
    stripOn = b; b.classList.add('is-on');
    previewSlide(b.dataset.slide);
  });
  stripRow.addEventListener('pointerleave', stripOff);
  stripRow.addEventListener('focusin', (e) => { const b = e.target.closest('.thumb'); if (b) previewSlide(b.dataset.slide); });
  stripRow.addEventListener('focusout', (e) => { if (!stripRow.contains(e.relatedTarget)) stripOff(); });
  stripRow.addEventListener('click', (e) => {
    const el = e.target.closest('.thumb');
    if (!el) return;
    clearTimeout(stripTimer);
    const id = el.dataset.slide;
    dive(bookOfCountry(S.slides[id].country), id, { from: el });
  });
  strip.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { e.preventDefault(); strip.scrollLeft += e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY; }
  }, { passive: false });

  /* ---------------------------------------------------------------- the dive */

  let pageOpen = null, busy = false, pushed = false, returnFocus = null, savedView = null;
  let viewList = [], viewIdx = 0;

  function angularRadius(country, lonlat) {
    const w = world.hi || world.lo;
    if (!w || !w.polys[country]) return 6 * RAD;
    const polys = w.polys[country];
    let poly = polys.find((p) => d3.geoContains(p, lonlat));
    if (!poly) {
      let best = Infinity;
      for (const p of polys) { const c = d3.geoCentroid(p); const d = d3.geoDistance(c, lonlat); if (d < best) { best = d; poly = p; } }
    }
    const [[x0, y0], [x1, y1]] = d3.geoBounds(poly);
    let th = 0;
    for (const c of [[x0, y0], [x1, y0], [x0, y1], [x1, y1]]) th = Math.max(th, d3.geoDistance(c, lonlat));
    return clamp(th * 0.8, 1.1 * RAD, 20 * RAD);
  }

  function coverHTML(b, slideId) {
    if (!slideId) return '';
    const s = S.slides[slideId];
    return `<img src="../images/web/1280/${esc(s.file)}" srcset="../images/web/1280/${esc(s.file)} 1280w, ../images/web/${esc(s.file)} ${s.w}w" sizes="100vw" width="${s.w}" height="${s.h}" alt="${esc(s.alt[lang])}" decoding="async" fetchpriority="high">`
      + `<div class="cover__cap"><p class="cover__name"><b>${esc(s.place[lang])}</b><span>${esc(b.title[lang])}${b.title[lang] !== b.c.name[lang] ? ` · ${esc(b.c.name[lang])}` : ''}</span><i class="num">${esc(coord(s.ll))}</i></p>`
      + `</div>`;
  }

  async function dive(b, slideId, opt = {}) {
    if (pageOpen || busy) return;
    busy = true;
    interact();
    setDrawer(false);
    hoverSpot = null;
    const cover0 = slideId || b.photo || null;
    const lonlat = slideId ? slideLonlat(slideId) : b.lonlat;
    if (!savedView) savedView = opt.fromHistory && !booted ? { r: HOME_VIEW.r.slice(), k: HOME_VIEW.k } : { r: r.slice(), k: k };
    ensureHi();
    const m = markOf(b);
    diveTarget = m;
    light(m);
    marksEl.classList.add('is-diving'); leads.classList.add('is-diving');
    m.el.classList.add('is-target');
    live.textContent = STR[lang].opening(b.title[lang]);
    const th = angularRadius(b.country, lonlat);
    const R1 = clamp((0.42 * Math.min(W, H)) / Math.sin(th), R0 * 2.5, R0 * KDIVE);
    const k1 = R1 / R0;
    const target = [-lonlat[0], -lonlat[1], 0];
    const cut = still() || opt.instant;
    if (cut) {
      r = target; k = k1; diveRing = { lonlat, s: 0.6, a: 1, seed: m.seed };
      dirty = true; renderNow();
    } else {
      const q0 = versor(r), q1 = versor(target), k0 = k;
      diveRing = { lonlat, s: 1.4, a: 0, seed: m.seed };
      const flight = animate(2000, easeExpo, (e) => {
        r = versor.rotation(slerp(q0, q1, e));
        k = k0 * Math.pow(k1 / k0, e);
        diveRing.s = 1.4 - 0.8 * e;
        diveRing.a = clamp(e * 4, 0, 1);
        dirty = true;
      });
      await wait(1500);
      void flight;
    }
    if (!opt.fromHistory) { history.pushState({ book: b.id }, '', `#${b.hash}`); pushed = true; }
    returnFocus = opt.from || null;
    renderPage(b, cover0);
    page.scrollTop = 0;
    document.title = `${b.title[lang]} · tuan photography 陳亮元`;
    const spot = proj(lonlat) || [cx, cy];
    page.style.setProperty('--cx', spot[0].toFixed(1));
    page.style.setProperty('--cy', (spot[1] + SH).toFixed(1));
    page.style.setProperty('--cr', '0px');
    page.classList.remove('is-open', 'is-closing');
    if (cut) {
      page.classList.add('is-still', 'is-veiled');
      page.style.setProperty('--cr', `${Math.hypot(innerWidth, innerHeight).toFixed(0)}px`);
      page.hidden = false;
      void page.offsetWidth;
      page.classList.remove('is-veiled');
    } else {
      page.hidden = false;
      void page.offsetWidth;
      page.classList.add('is-growing', 'is-open');
      marksEl.classList.add('is-covered');
      page.style.setProperty('--cr', `${Math.hypot(innerWidth, innerHeight).toFixed(0)}px`);
      await wait(1000);
      page.classList.remove('is-growing');
    }
    pageOpen = b;
    home.inert = true;
    settle();
    const h = $('#page-h');
    if (h) h.focus({ preventScroll: true });
  }

  async function closePage() {
    if (!pageOpen || busy) return;
    busy = true;
    const b = pageOpen;
    if (viewer.open) viewer.close();
    home.inert = false;
    page.scrollTop = 0;
    page.classList.remove('is-open');
    if (!still()) {
      const spot = proj(diveRing ? diveRing.lonlat : b.lonlat) || [cx, cy];
      page.style.setProperty('--cx', spot[0].toFixed(1));
      page.style.setProperty('--cy', (spot[1] + SH).toFixed(1));
      page.classList.add('is-closing');
      void page.offsetWidth;
      page.style.setProperty('--cr', '0px');
      await wait(580);
    }
    page.hidden = true;
    page.classList.remove('is-closing', 'is-still');
    pageBody.innerHTML = ''; cover.innerHTML = ''; cover.hidden = true;
    pageOpen = null;
    document.title = 'tuan photography 陳亮元';
    marksEl.classList.remove('is-covered');
    const back = savedView || { r: HOME_VIEW.r.slice(), k: HOME_VIEW.k };
    savedView = null;
    const m = markOf(b);
    if (still()) {
      r = back.r; k = back.k; diveRing = null; diveTarget = null;
      marksEl.classList.remove('is-diving'); leads.classList.remove('is-diving'); m.el.classList.remove('is-target');
      dirty = true;
    } else {
      const q0 = versor(r), q1 = versor(back.r), k0 = k, k1 = back.k;
      const ring = diveRing;
      await animate(1400, easeExpo, (e) => {
        r = versor.rotation(slerp(q0, q1, e));
        k = k0 * Math.pow(k1 / k0, e);
        if (ring) { ring.s = 0.6 + 0.8 * e; ring.a = 1 - e; }
        if (e > 0.3 && diveTarget) { diveTarget = null; marksEl.classList.remove('is-diving'); leads.classList.remove('is-diving'); m.el.classList.remove('is-target'); }
        dirty = true;
      });
      diveRing = null; diveTarget = null;
      marksEl.classList.remove('is-diving'); leads.classList.remove('is-diving'); m.el.classList.remove('is-target');
    }
    light(null);
    settle();
    const backEl = returnFocus && document.contains(returnFocus) ? returnFocus : list.querySelector(`a[data-id="${CSS.escape(b.id)}"]`);
    if (backEl && backEl.offsetParent !== null) backEl.focus({ preventScroll: true }); else stage.focus({ preventScroll: true });
    dirty = true;
  }

  function requestClose() {
    if (!pageOpen || busy) return;
    if (pushed) { pushed = false; history.back(); } else {
      history.replaceState(null, '', location.pathname + location.search);
      closePage();
    }
  }
  $('#back').addEventListener('click', requestClose);
  $('#back-2').addEventListener('click', requestClose);

  let routeLater = false;
  function settle() { busy = false; if (routeLater) { routeLater = false; route(); } }
  function route() {
    if (busy) { routeLater = true; return; }
    const h = decodeURIComponent(location.hash.slice(1));
    const b = byHash[h];
    if (b && !pageOpen) dive(b, null, { fromHistory: true, instant: !booted });
    else if (!b && pageOpen) { pushed = false; closePage(); }
    else if (b && pageOpen && b !== pageOpen) { pushed = false; closePage().then(route); }
  }
  addEventListener('popstate', route);

  /* ---------------------------------------------------------------- the pages */

  function srcset(s) {
    return `../images/web/640/${s.file} 640w, ../images/web/1280/${s.file} 1280w, ../images/web/${s.file} ${s.w}w`;
  }
  function rowsOf(ids, target) {
    const rows = []; let cur = [], sum = 0;
    for (const id of ids) {
      const s = S.slides[id];
      cur.push(id); sum += s.w / s.h;
      if (sum >= target) { rows.push(cur); cur = []; sum = 0; }
    }
    if (cur.length) rows.push(cur);
    return rows;
  }
  function placeHTML(b) {
    const c = b.c;
    const head = `<header class="leaf__head"><h1 id="page-h" tabindex="-1">${esc(b.title[lang])}</h1>`
      + `<p class="leaf__line num">${c.name[lang] !== b.title[lang] ? `<span>${esc(c.name[lang])}</span>` : ''}<span>${esc(c.date[lang])}</span><span>${esc(coord(c.ll))}</span></p>`
      + `<p class="leaf__note">${esc(c.note[lang])}</p>`
      + `<p class="leaf__not">${esc(t('bookNot'))}</p></header>`;
    if (!c.photos.length) return `<article class="leaf">${head}<p class="leaf__empty">${esc(t('bandNone'))}</p></article>`;
    const rows = rowsOf(c.photos, 2.7).map((row) => {
      const sum = row.reduce((a, id) => a + S.slides[id].w / S.slides[id].h, 0);
      return `<div class="row">${row.map((id) => {
        const s = S.slides[id];
        const ar = s.w / s.h;
        const vw = Math.round((ar / sum) * 92);
        return `<figure class="shot" data-ar="${ar.toFixed(4)}"><button type="button" data-slide="${esc(id)}">`
          + `<img src="../images/web/1280/${esc(s.file)}" srcset="${esc(srcset(s))}" sizes="(max-width: 40rem) 92vw, ${vw}vw" width="${s.w}" height="${s.h}" alt="${esc(s.alt[lang])}" loading="lazy" decoding="async"></button>`
          + `<figcaption><b>${esc(s.place[lang])}</b><span>${esc(s.where[lang])}</span></figcaption></figure>`;
      }).join('')}</div>`;
    }).join('');
    return `<article class="leaf">${head}<div class="rows">${rows}</div></article>`;
  }

  function guideI18n(root, id) {
    const g = S.guides[id];
    const d = g.i18n[lang] || {};
    const slideWord = (key) => {
      const mm = /^(sp|sa|sl)_(.+)$/.exec(key);
      if (!mm || !S.slides[mm[2]]) return null;
      const s = S.slides[mm[2]];
      if (mm[1] === 'sp') return s.place[lang];
      if (mm[1] === 'sa') return s.alt[lang];
      return lang === 'zh' ? `${s.place.zh}：這張怎麼拍` : `${s.place.en}: how this was made`;
    };
    const word = (kk) => (kk in d ? d[kk] : slideWord(kk));
    $$('[data-i18n]', root).forEach((el) => { const v = word(el.dataset.i18n); if (v != null) el.textContent = v; });
    $$('[data-i18n-html]', root).forEach((el) => { const v = word(el.dataset.i18nHtml); if (v != null) el.innerHTML = v; });
    $$('[data-i18n-alt]', root).forEach((el) => { const v = word(el.dataset.i18nAlt); if (v != null) el.alt = v; });
    $$('[data-i18n-aria]', root).forEach((el) => { const v = word(el.dataset.i18nAria); if (v != null) el.setAttribute('aria-label', v); });
  }

  let pageCover = null;
  function renderPage(b, coverId) {
    pageCover = coverId;
    cover.innerHTML = coverHTML(b, coverId);
    cover.hidden = !coverId;
    if (b.guide) {
      const g = S.guides[b.guide];
      pageBody.innerHTML = g.html;
      guideI18n(pageBody, b.guide);
      const h1 = $('.guide-top h1', pageBody);
      if (h1) { h1.id = 'page-h'; h1.tabIndex = -1; }
      const meta = $('.guide-top .meta', pageBody);
      if (meta) {
        const facts = document.createElement('p');
        facts.className = 'facts';
        facts.textContent = g.facts[lang];
        meta.after(facts);
      }
      $$('a[href*="gallery.html"]', pageBody).forEach((a) => a.setAttribute('href', `#${b.hash}`));
      viewList = $$('[data-slide]', pageBody).map((a) => a.dataset.slide);
      $$('table.sheet', pageBody).forEach((tb) => {
        const heads = $$('thead th', tb).map((th) => th.textContent.trim());
        if (!heads.length) return;
        $$('tbody tr', tb).forEach((tr) => Array.from(tr.cells).forEach((td, i) => { if (i > 0 && heads[i]) td.dataset.label = heads[i]; }));
      });
    } else {
      pageBody.innerHTML = placeHTML(b);
      $$('[data-ar]', pageBody).forEach((f) => f.style.setProperty('--ar', f.dataset.ar));
      viewList = b.c.photos.slice();
    }
    spy();
  }

  page.addEventListener('click', (e) => {
    const sl = e.target.closest('[data-slide]');
    if (sl) { e.preventDefault(); openViewer(sl.dataset.slide); return; }
    const a = e.target.closest('a[href^="#"]');
    if (a) {
      e.preventDefault();
      const id = a.getAttribute('href').slice(1);
      const el = id && pageBody.querySelector(`#${CSS.escape(id)}`);
      if (el) {
        el.scrollIntoView({ behavior: still() ? 'auto' : 'smooth', block: 'start' });
        el.setAttribute('tabindex', '-1');
        el.focus({ preventScroll: true });
      }
    }
  });

  let spyQueued = false;
  function spy() {
    spyQueued = false;
    const toc = $('.toc', pageBody);
    if (!toc) return;
    const heads = $$('.body h2[id]', pageBody);
    let current = null;
    for (const h of heads) if (h.getBoundingClientRect().top < 140) current = h.id;
    $$('a', toc).forEach((a) => { if (a.getAttribute('href') === `#${current}`) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  }
  page.addEventListener('scroll', () => { if (!spyQueued) { spyQueued = true; requestAnimationFrame(spy); } }, { passive: true });

  /* ----- the photograph viewer */

  function openViewer(id) {
    if (!viewList.includes(id)) viewList = [id];
    viewIdx = viewList.indexOf(id);
    showSlide();
    if (!viewer.open) viewer.showModal();
  }
  function showSlide() {
    const s = S.slides[viewList[viewIdx]];
    if (!s) return;
    const img = document.createElement('img');
    img.decoding = 'async';
    img.width = s.w; img.height = s.h;
    img.sizes = '(max-width: 62rem) 100vw, calc(100vw - 24rem)';
    img.srcset = srcset(s);
    img.src = `../images/web/1280/${s.file}`;
    img.alt = s.alt[lang];
    $('#viewer-pic').replaceChildren(img);
    $('#viewer-h').textContent = s.place[lang];
    $('#viewer-where').textContent = s.where[lang];
    $('#viewer-coord').textContent = coord(s.ll);
    const data = [s.camera, s.lens, s.focal, s.aperture, s.shutter, s.iso ? `${STR[lang].iso} ${s.iso}` : ''].filter(Boolean);
    $('#viewer-data').innerHTML = data.map((x) => `<span>${esc(x)}</span>`).join('');
    $('#viewer-extra').textContent = s.best ? `${t('best')}${lang === 'zh' ? '：' : ': '}${s.best[lang]}` : '';
    $('#viewer-prev').disabled = viewIdx <= 0;
    $('#viewer-next').disabled = viewIdx >= viewList.length - 1;
  }
  $('#viewer-prev').addEventListener('click', () => { if (viewIdx > 0) { viewIdx--; showSlide(); } });
  $('#viewer-next').addEventListener('click', () => { if (viewIdx < viewList.length - 1) { viewIdx++; showSlide(); } });
  $('#viewer-close').addEventListener('click', () => viewer.close());
  viewer.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') $('#viewer-prev').click();
    else if (e.key === 'ArrowRight') $('#viewer-next').click();
  });
  viewer.addEventListener('click', (e) => { if (e.target === viewer) viewer.close(); });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (viewer.open) return;
    if (pageOpen) { e.preventDefault(); requestClose(); return; }
    if (places.classList.contains('is-open')) { setDrawer(false); placesOpen.focus(); return; }
    light(null);
  });

  /* ---------------------------------------------------------------- language */

  function setLang(l, first) {
    lang = l;
    if (!first) { try { localStorage.setItem('tlap-lang', l); } catch (e) { /* storage blocked */ } }
    document.documentElement.lang = l === 'zh' ? 'zh-Hant' : 'en';
    $$('.lang button').forEach((btn) => btn.setAttribute('aria-pressed', String(btn.dataset.lang === l)));
    $$('[data-t]').forEach((el) => { el.textContent = t(el.dataset.t); });
    stage.setAttribute('aria-label', t('globe'));
    places.setAttribute('aria-label', t('places'));
    renderList();
    renderStrip();
    wordMarks();
    if (pageOpen) {
      const top = page.scrollTop;
      renderPage(pageOpen, pageCover);
      page.scrollTop = top;
      document.title = `${pageOpen.title[lang]} · tuan photography 陳亮元`;
    }
    if (viewer.open) showSlide();
  }
  $$('.lang button').forEach((btn) => btn.addEventListener('click', () => setLang(btn.dataset.lang)));

  /* ---------------------------------------------------------------- start */

  let booted = false;
  makeMarks();
  setLang(lang, true);
  layout();
  let resizeQueued = false;
  addEventListener('resize', () => {
    if (resizeQueued) return;
    resizeQueued = true;
    requestAnimationFrame(() => { resizeQueued = false; layout(); });
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(wordMarks);
  reduce.addEventListener('change', () => { if (still()) { auto = false; inertia = null; } });

  load('countries-110m.json').then((w) => {
    world.lo = w;
    dirty = true;
  }).catch(() => { /* the globe still turns as water; every place stays reachable from the list */ }).finally(() => {
    requestAnimationFrame((now) => { last = now; frame(now); });
    route();
    booted = true;
    setTimeout(ensureHi, 1200);
  });
})();

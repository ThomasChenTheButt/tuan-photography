/* tuan photography 陳亮元 · design 2 · "Desk globe"
   The home page is a globe on a desk. Drag to turn it (versor dragging, with inertia),
   wheel or pinch to lean in, put a finger on a book to open it. */
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
      line: 'Travel like a photographer.',
      say: (n, g) => `Photographs from ${n} countries, and a guide to ${g}. Turn the globe, then open a book.`,
      spin: 'Spin', zoomIn: 'Zoom in', zoomOut: 'Zoom out',
      places: 'Places', hidePlaces: 'Hide places',
      globe: 'Globe',
      globeHelp: 'A globe of the places Thomas Chen has photographed. Arrow keys turn it, plus and minus zoom, Enter opens the book nearest the middle. The list of places opens the same books.',
      landed: (n) => `The globe stopped on ${n}.`,
      facing: (n) => `${n} is in the middle. Press Enter to open its book.`,
      photosN: (n) => (n === 1 ? '1 photograph' : `${n} photographs`),
      guideTag: 'guide', homeTag: 'home',
      prev: 'Previous', next: 'Next',
      iso: 'ISO',
    },
    zh: {
      line: '像攝影師一樣旅行。',
      say: (n, g) => `${n} 個國家的照片，和一本${g}攻略。轉動地球，打開一本書。`,
      spin: '轉一下', zoomIn: '放大', zoomOut: '縮小',
      places: '地點', hidePlaces: '收起地點',
      globe: '地球儀',
      globeHelp: '陳亮元拍過的地方，做成一顆地球儀。方向鍵轉動，加號與減號縮放，Enter 打開最靠近中央的那本書。地點清單也能打開同樣的書。',
      landed: (n) => `地球停在${n}。`,
      facing: (n) => `${n}在中央。按 Enter 打開這本書。`,
      photosN: (n) => `${n} 張照片`,
      guideTag: '攻略', homeTag: '家',
      prev: '上一張', next: '下一張',
      iso: 'ISO',
    },
  };

  let lang = 'en';
  try { const v = localStorage.getItem('tlap-lang'); if (v === 'en' || v === 'zh') lang = v; } catch (e) { /* storage blocked */ }
  const qlang = new URLSearchParams(location.search).get('lang');
  if (qlang === 'en' || qlang === 'zh') lang = qlang;

  const t = (k) => (k in STR[lang] ? STR[lang][k] : (S.i18n[lang][k] ?? k));

  /* ---------------------------------------------------------------- places */

  const ISO = {
    spain: '724', uk: '826', france: '250', germany: '276', switzerland: '756', taiwan: '158',
    japan: '392', 'south-korea': '410', 'hong-kong': '344', china: '156', singapore: '702',
    vietnam: '704', dubai: '784', australia: '036', 'new-zealand': '554', usa: '840',
  };
  const COUNTRY = Object.fromEntries(S.countries.map((c) => [c.id, c]));
  const BOOKS = S.books.map((b) => {
    const c = COUNTRY[b.country];
    const ll = b.guide ? S.guides[b.guide].ll : c.ll;
    return { ...b, c, ll, lonlat: [ll[1], ll[0]], hash: b.guide ? `guide-${b.guide}` : `place-${b.country}` };
  });
  const byHash = Object.fromEntries(BOOKS.map((b) => [b.hash, b]));
  const statusOf = (b) => (b.guide ? t('bookOpen') : b.c.photos.length ? STR[lang].photosN(b.c.photos.length) : t('bandNone'));

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
  const easeSpin = (e) => 1 - Math.pow(1 - e, 3);

  /* ---------------------------------------------------------------- the globe */

  const map = $('#map'), stage = $('#stage'), canvas = $('#globe'), ctx = canvas.getContext('2d');
  const pinsEl = $('#pins'), tag = $('#tag'), live = $('#live');
  const page = $('#page'), pageBody = $('#page-body'), viewer = $('#viewer');
  const proj = d3.geoOrthographic().clipAngle(90).precision(0.5);
  const path = d3.geoPath(proj, ctx);
  const graticule = d3.geoGraticule10();
  const sphere = { type: 'Sphere' };
  const KMIN = 0.8, KMAX = 9;

  let W = 0, H = 0, dpr = 1, cx = 0, cy = 0, R0 = 300, baseS = 0.34, BW = 136, BH = 192;
  let k = 1;
  let r = [-127, -25, 0];
  let dirty = true, settling = false;
  let auto = !still();
  let inertia = null;
  let anims = [];
  const world = { lo: null, hi: null, loading: false };
  const col = {};

  function readColours() {
    const cs = getComputedStyle(document.documentElement);
    for (const n of ['ocean', 'ocean-line', 'land', 'land-line', 'been', 'been-line', 'been-ink', 'glint', 'limb', 'limb-soft', 'steel', 'steel-2', 'shadow', 'stem', 'sheet', 'ink'])
      col[n] = cs.getPropertyValue(`--${n}`).trim();
    const rem = parseFloat(cs.fontSize) || 16;
    BW = 8.5 * rem; BH = 12 * rem;
  }

  function build(topo) {
    const all = topojson.feature(topo, topo.objects.countries).features;
    const ids = new Set(Object.values(ISO));
    const been = all.filter((f) => ids.has(String(f.id)));
    return {
      land: topojson.feature(topo, topo.objects.land),
      been: { type: 'FeatureCollection', features: been },
      beenList: been,
      borders: topojson.mesh(topo, topo.objects.countries, (a, b) => a !== b),
    };
  }
  async function load(file) {
    const res = await fetch(`../vendor/${file}`);
    if (!res.ok) throw new Error(file);
    return build(await res.json());
  }
  function ensureHi() {
    if (world.hi || world.loading || k < 1.5) return;
    world.loading = true;
    load('countries-50m.json').then((w) => { world.hi = w; dirty = true; }).catch(() => {}).finally(() => { world.loading = false; });
  }

  function layout() {
    W = innerWidth; H = innerHeight;
    dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    const wide = W > 992;
    if (wide) {
      R0 = Math.max(160, Math.min(H * 0.385, (W - 2 * 320) / 2 - 8, 420));
      cx = W / 2; cy = H * 0.47;
      baseS = 0.42;
    } else {
      R0 = Math.max(110, Math.min(W / 2 - 14, H * 0.3));
      cx = W / 2; cy = Math.max(64 + R0 + 22, H * 0.41);
      baseS = 0.3;
    }
    document.body.style.setProperty('--desk-y', `${Math.round(cy + R0 * 1.25)}px`);
    readColours();
    dirty = true;
  }

  /* ----- drawing: the desk shadow, the stand, the globe, the ring, the pins' stems */

  function drawStand(a, R) {
    const gap = Math.max(5, R * 0.03);
    const ringR = R + gap;
    const deskY = cy + R0 * 1.25;
    ctx.save();
    ctx.globalAlpha = a;
    // the soft shadow the globe throws on the desk, light from the upper left
    ctx.save();
    ctx.translate(cx + R * 0.16, deskY + R * 0.012);
    ctx.scale(1, 0.12);
    const sh = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.95);
    sh.addColorStop(0, col.shadow);
    sh.addColorStop(1, 'oklch(32% 0.03 70 / 0)');
    ctx.fillStyle = sh;
    ctx.beginPath(); ctx.arc(0, 0, R * 0.95, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // neck and foot
    const neckTop = cy + ringR, footY = deskY - R * 0.02;
    ctx.fillStyle = col.steel;
    ctx.fillRect(cx - R * 0.018, neckTop, R * 0.036, footY - neckTop);
    ctx.beginPath(); ctx.ellipse(cx, footY, R * 0.3, R * 0.045, 0, 0, Math.PI * 2);
    const ft = ctx.createLinearGradient(cx - R * 0.3, 0, cx + R * 0.3, 0);
    ft.addColorStop(0, col['steel-2']); ft.addColorStop(0.5, col.steel); ft.addColorStop(1, col.ink);
    ctx.fillStyle = ft; ctx.fill();
    ctx.restore();
  }

  function drawRing(a, R) {
    const gap = Math.max(5, R * 0.03), ringR = R + gap, lw = Math.max(2, R * 0.011);
    const tilt = 23.4 * RAD;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.lineWidth = lw;
    ctx.strokeStyle = col.steel;
    ctx.beginPath(); ctx.arc(cx, cy, ringR, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = Math.max(0.75, lw * 0.35);
    ctx.strokeStyle = col['steel-2'];
    ctx.beginPath(); ctx.arc(cx, cy, ringR - lw * 0.2, Math.PI * 1.05, Math.PI * 1.55); ctx.stroke();
    // the two pivots where the axis meets the ring, tilted as on a real desk globe
    ctx.fillStyle = col.steel;
    for (const s of [-1, 1]) {
      const x = cx + Math.sin(tilt) * ringR * s, y = cy - Math.cos(tilt) * ringR * s;
      ctx.beginPath(); ctx.arc(x, y, lw * 1.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function draw() {
    const R = R0 * k;
    proj.scale(R).translate([cx, cy]).rotate(r);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const standA = clamp((1.3 - k) / 0.3, 0, 1);
    if (standA > 0) drawStand(standA, R);

    ctx.beginPath(); path(sphere); ctx.fillStyle = col.ocean; ctx.fill();
    ctx.beginPath(); path(graticule); ctx.strokeStyle = col['ocean-line']; ctx.lineWidth = 0.6; ctx.stroke();

    const w = k >= 1.5 && world.hi ? world.hi : world.lo;
    if (w) {
      ctx.beginPath(); path(w.land); ctx.fillStyle = col.land; ctx.fill();
      ctx.strokeStyle = col['ocean-line']; ctx.lineWidth = 0.7; ctx.stroke();
      ctx.beginPath(); path(w.been); ctx.fillStyle = col.been; ctx.fill();
      ctx.beginPath(); path(w.borders); ctx.strokeStyle = col['land-line']; ctx.lineWidth = 0.6; ctx.stroke();
      ctx.beginPath(); path(w.been); ctx.strokeStyle = col['been-line']; ctx.lineWidth = 0.6; ctx.stroke();
    }

    // where the photographs were made, once you lean in close
    if (k >= 2.4) {
      const a = clamp((k - 2.4) / 0.8, 0, 1);
      const centre = proj.invert([cx, cy]);
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = col['been-ink'];
      for (const s of Object.values(S.slides)) {
        if (!s.ll) continue;
        const ll = [s.ll[1], s.ll[0]];
        if (d3.geoDistance(ll, centre) > Math.PI / 2 - 0.02) continue;
        const [x, y] = proj(ll);
        ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }

    // daylight on the ball: a glint at the upper left, the limb going into shade
    const g = ctx.createRadialGradient(cx - R * 0.42, cy - R * 0.46, R * 0.02, cx - R * 0.12, cy - R * 0.12, R * 1.2);
    g.addColorStop(0, col.glint);
    g.addColorStop(0.38, 'oklch(100% 0 0 / 0)');
    g.addColorStop(0.78, col['limb-soft']);
    g.addColorStop(1, col.limb);
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = col.limb; ctx.stroke();

    if (standA > 0) drawRing(standA, R);

    // each book stands on a fine stem rising from its place
    ctx.lineWidth = 1; ctx.strokeStyle = col.stem;
    ctx.beginPath();
    for (const p of PINS) if (!p.away) { ctx.moveTo(p.ax, p.ay); ctx.lineTo(p.x, p.y - 1); }
    ctx.stroke();
    for (const p of PINS) {
      if (p.away) continue;
      ctx.globalAlpha = p.o;
      ctx.beginPath(); ctx.arc(p.ax, p.ay, 3.4, 0, Math.PI * 2);
      ctx.fillStyle = col['been-ink']; ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = col.sheet; ctx.stroke();
      if (p.b.country === S.home) {
        ctx.beginPath(); ctx.arc(p.ax, p.ay, 7.5, 0, Math.PI * 2);
        ctx.lineWidth = 1.2; ctx.strokeStyle = col['been-ink']; ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }

  /* ----- the books: placed every frame, kept apart where places crowd together */

  const SLOTS = [[0, 0], [-1, 0], [1, 0], [0, 1], [-1, 1], [1, 1], [-2, 0], [2, 0], [-2, 1], [2, 1], [0, 2], [-1, 2], [1, 2], [-3, 0], [3, 0], [-3, 1], [3, 1], [0, 3]];
  const PINS = [];
  let awake = null;

  function bookInner(b) {
    const title = esc(b.title[lang]);
    const s = b.photo ? S.slides[b.photo] : null;
    const face = s
      ? `<span class="book__face"><img src="../images/web/640/${esc(s.file)}" width="${s.w}" height="${s.h}" alt="" decoding="async">`
      : `<span class="book__face book__face--blank"><b>${title}</b>`;
    return `<span class="book book--${b.tone}"><span class="book__box">`
      + `<span class="book__spine"><b>${title}</b><i>${esc(t('series'))}</i></span>`
      + `<span class="book__leaf"></span>`
      + `${face}<span class="book__band"><b>${title}</b><span>${esc(t(b.band))}</span></span></span>`
      + `<span class="book__back"><i>${esc(t('series'))}</i></span><span class="book__edge"></span>`
      + `<span class="book__top"></span><span class="book__shadow"></span><span class="book__veil"></span></span></span>`;
  }

  function makePins() {
    pinsEl.innerHTML = '';
    for (const b of BOOKS) {
      const el = document.createElement('div');
      el.className = 'pin';
      el.dataset.id = b.id;
      el.setAttribute('aria-hidden', 'true');
      el.innerHTML = bookInner(b);
      pinsEl.append(el);
      const p = { b, el, ax: 0, ay: 0, x: 0, y: 0, ox: 0, oy: 0, tox: 0, toy: 0, sc: 0.3, o: 1, cos: 1, away: true, slot: 0, fresh: true, cache: {} };
      el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && !drag) wake(p); });
      el.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && awake === p && !listHover) sleepSoon(); });
      PINS.push(p);
    }
  }
  const pinOf = (b) => PINS.find((p) => p.b === b);

  function placePins(dt) {
    const R = R0 * k;
    const centre = proj.invert([cx, cy]);
    const size = baseS * clamp(0.85 + 0.4 * Math.log2(Math.max(k, 0.5)), 0.75, 2.2);
    const order = [];
    for (const p of PINS) {
      const d = d3.geoDistance(p.b.lonlat, centre);
      const was = p.away;
      p.cos = Math.cos(d);
      p.away = d > Math.PI / 2 - 0.05;
      if (p.away) { p.fresh = true; continue; }
      if (was) p.fresh = true;
      const [ax, ay] = proj(p.b.lonlat);
      p.ax = ax; p.ay = ay;
      p.s = size * (0.6 + 0.4 * p.cos);
      p.o = clamp((p.cos - 0.12) / 0.2, 0, 1);
      if (p.o <= 0.01) { p.away = true; p.fresh = true; continue; }
      p.turn = 14 + clamp((ax - cx) / R, -1, 1) * 18;
      order.push(p);
    }
    order.sort((a, b) => (b === awake) - (a === awake) || b.cos - a.cos);
    const boxes = [];
    const free = (x0, y0, x1, y1) => {
      if (x0 < 4 || x1 > W - 4 || y0 < 60) return false;
      for (const q of boxes) if (x0 < q[2] && x1 > q[0] && y0 < q[3] && y1 > q[1]) return false;
      return true;
    };
    for (const p of order) {
      const w = BW * p.s, h = BH * p.s, L = 8 + 26 * p.s;
      const ux = w * 1.06, uy = h * 0.94 + 4;
      const tries = p.o < 0.7 ? [0] : [p.slot, ...SLOTS.keys()];
      let chosen = 0, box = null;
      for (const i of tries) {
        const [sx, sy] = SLOTS[i];
        const x = p.ax + sx * ux, y = p.ay - L - sy * uy;
        const bx = [x - w / 2 + 1, y - h + 1, x + w / 2 - 1, y - 1];
        if (free(...bx)) { chosen = i; box = bx; break; }
      }
      if (!box) { chosen = 0; const x = p.ax, y = p.ay - L; box = [x - w / 2, y - h, x + w / 2, y]; }
      boxes.push(box);
      p.slot = chosen;
      p.tox = SLOTS[chosen][0] * ux;
      p.toy = -L - SLOTS[chosen][1] * uy;
      if (p.fresh || still()) { p.ox = p.tox; p.oy = p.toy; p.fresh = false; }
      else {
        const a = 1 - Math.exp(-dt / 90);
        p.ox += (p.tox - p.ox) * a; p.oy += (p.toy - p.oy) * a;
        if (Math.abs(p.tox - p.ox) > 0.3 || Math.abs(p.toy - p.oy) > 0.3) settling = true;
      }
      p.x = p.ax + p.ox; p.y = p.ay + p.oy;
      const lift = p === awake ? 1.45 : 1;
      p.sc = p.s * lift;
      p.zi = p === awake ? 200 : 10 + Math.round(p.cos * 60) + (p.slot === 0 ? 4 : 0);
    }
  }

  function setVar(p, name, v) { if (p.cache[name] !== v) { p.cache[name] = v; p.el.style.setProperty(name, v); } }
  function writePins() {
    for (const p of PINS) {
      if (p.away) { if (!p.cache.away) { p.cache.away = true; p.el.classList.add('is-away'); } continue; }
      if (p.cache.away !== false) { p.cache.away = false; p.el.classList.remove('is-away'); }
      setVar(p, '--x', p.x.toFixed(1));
      setVar(p, '--y', p.y.toFixed(1));
      setVar(p, '--s', p.sc.toFixed(3));
      setVar(p, '--o', p.o.toFixed(2));
      setVar(p, '--zi', String(p.zi));
      setVar(p, '--turn', `${p.turn.toFixed(1)}deg`);
    }
    if (awake && !awake.away) {
      tag.hidden = false;
      tag.style.setProperty('--x', awake.ax.toFixed(1));
      tag.style.setProperty('--y', awake.ay.toFixed(1));
    } else tag.hidden = true;
    stage.style.setProperty('--cx', cx.toFixed(1));
    stage.style.setProperty('--cy', cy.toFixed(1));
    stage.style.setProperty('--r', (R0 * k).toFixed(1));
  }

  function renderNow(dt = 0) {
    proj.scale(R0 * k).translate([cx, cy]).rotate(r);
    placePins(dt);
    draw();
    writePins();
  }

  /* ----- waking a book */

  let sleepTimer = 0;
  function wake(p) {
    clearTimeout(sleepTimer);
    if (awake === p) return;
    if (awake) awake.el.classList.remove('is-awake');
    awake = p;
    if (p) {
      p.el.classList.add('is-awake');
      tag.querySelector('b').textContent = p.b.title[lang];
      tag.querySelector('span').textContent = statusOf(p.b);
    }
    $$('#places-list a').forEach((a) => a.classList.toggle('is-on', !!p && a.dataset.id === p.b.id));
    dirty = true;
  }
  function sleepSoon() { clearTimeout(sleepTimer); sleepTimer = setTimeout(() => { if (!opening && !pageOpen) wake(null); }, 260); }

  /* ----- motion: animations, inertia, the slow turn before anyone touches it */

  function animate(dur, ease, apply) {
    return new Promise((res) => { anims.push({ t0: performance.now(), dur, ease, apply, res }); });
  }
  function cancelAnims() { const a = anims; anims = []; a.forEach((x) => x.res(false)); }
  function interact() { auto = false; inertia = null; cancelAnims(); }

  function flyTo(b, opt = {}) {
    const target = [-b.lonlat[0], -b.lonlat[1], 0];
    const q0 = versor(r), q1 = versor(target);
    const ang = qAngle(q0, q1);
    if (still() || opt.instant || ang < 0.003) { r = target; dirty = true; return Promise.resolve(true); }
    const dur = opt.dur || Math.min(1250, 450 + ang * 520);
    return animate(dur, easeExpo, (e) => { r = versor.rotation(slerp(q0, q1, e)); dirty = true; });
  }
  function zoomTo(k1, dur = 380) {
    k1 = clamp(k1, KMIN, KMAX);
    if (still()) { k = k1; dirty = true; ensureHi(); return Promise.resolve(true); }
    const k0 = k;
    return animate(dur, easeExpo, (e) => { k = k0 * Math.pow(k1 / k0, e); dirty = true; ensureHi(); });
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(64, now - last);
    last = now;
    if (!pageOpen || opening || closing) {
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
        inertia.w *= Math.exp(-dt / 420);
        if (inertia.w < 0.00003) inertia = null;
      } else if (auto) {
        moving = true;
        r = [r[0] + dt * 0.0016, r[1], r[2]];
      }
      if (moving || dirty || settling) {
        settling = false;
        dirty = false;
        renderNow(dt);
      }
    }
    requestAnimationFrame(frame);
  }

  /* ----- dragging (versor), pinching, the wheel, double click, keys */

  const pointers = new Map();
  let drag = null, pinch = null, downPin = null, downAt = null;

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
    drag = null;
  }

  stage.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (pageOpen || opening) return;
    interact();
    try { stage.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    pointers.set(e.pointerId, [e.clientX, e.clientY]);
    if (pointers.size === 1) {
      downPin = e.target.closest ? e.target.closest('.pin') : null;
      downAt = { x: e.clientX, y: e.clientY, t: performance.now(), type: e.pointerType };
      startDrag(e.clientX, e.clientY);
    } else if (pointers.size === 2) {
      drag = null; downPin = null; downAt = null;
      const [a, b] = [...pointers.values()];
      pinch = { d0: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, k0: k };
    }
  });
  stage.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, [e.clientX, e.clientY]);
    if (pinch && pointers.size >= 2) {
      const [a, b] = [...pointers.values()];
      k = clamp(pinch.k0 * (Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch.d0), KMIN, KMAX);
      ensureHi();
      dirty = true;
    } else moveDrag(e.clientX, e.clientY);
  });
  function pointerEnd(e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    if (pinch) { if (pointers.size < 2) pinch = null; return; }
    const tapped = drag && !drag.moved && downAt && performance.now() - downAt.t < 600;
    endDrag();
    if (tapped && e.type === 'pointerup') {
      if (downPin) {
        const p = PINS.find((q) => q.el === downPin);
        if (p) openBook(p.b, { from: stage });
      } else pickAt(e.clientX, e.clientY);
    }
    downPin = null; downAt = null;
  }
  stage.addEventListener('pointerup', pointerEnd);
  stage.addEventListener('pointercancel', pointerEnd);

  stage.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (pageOpen) return;
    interact();
    const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    k = clamp(k * Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.0017)), KMIN, KMAX);
    ensureHi();
    dirty = true;
  }, { passive: false });

  stage.addEventListener('dblclick', (e) => {
    if (pageOpen) return;
    interact();
    proj.scale(R0 * k).translate([cx, cy]).rotate(r);
    const inside = Math.hypot(e.clientX - cx, e.clientY - cy) < R0 * k;
    if (inside) {
      const ll = proj.invert([e.clientX, e.clientY]);
      flyTo({ lonlat: ll }, { dur: 600 });
    }
    zoomTo(k * 1.8, 600);
  });

  function pickAt(x, y) {
    proj.scale(R0 * k).translate([cx, cy]).rotate(r);
    if (Math.hypot(x - cx, y - cy) > R0 * k) { wake(null); return; }
    const ll = proj.invert([x, y]);
    let hit = null;
    let best = 26;
    for (const p of PINS) {
      if (p.away) continue;
      const d = Math.hypot(p.ax - x, p.ay - y);
      if (d < best) { best = d; hit = p; }
    }
    if (!hit && world.lo) {
      const w = world.hi || world.lo;
      const f = w.beenList.find((g) => d3.geoContains(g, ll));
      if (f) {
        const country = Object.keys(ISO).find((c) => ISO[c] === String(f.id));
        hit = PINS.find((p) => p.b.country === country) || null;
      }
    }
    if (hit) { wake(hit); flyTo(hit.b); } else wake(null);
  }

  function nearest() {
    let best = null;
    for (const p of PINS) if (!p.away && (!best || p.cos > best.cos)) best = p;
    return best;
  }
  let facingTimer = 0;
  function faceNearest() {
    clearTimeout(facingTimer);
    facingTimer = setTimeout(() => {
      const p = nearest();
      if (p) { wake(p); live.textContent = STR[lang].facing(p.b.title[lang]); }
    }, 320);
  }
  stage.addEventListener('keydown', (e) => {
    if (pageOpen) return;
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
      case 'Enter': case ' ': { const p = awake && !awake.away ? awake : nearest(); if (p) openBook(p.b, { from: stage }); break; }
      default: handled = false;
    }
    if (handled) e.preventDefault();
  });
  stage.addEventListener('focus', () => { auto = false; });

  /* ----- spin: let the globe decide */

  const spinBtn = $('#spin');
  let lastLanded = null;
  function spin() {
    if (pageOpen || opening) return;
    interact();
    wake(null);
    const pool = BOOKS.filter((b) => b !== lastLanded);
    const b = pool[Math.floor(Math.random() * pool.length)];
    lastLanded = b;
    const target = [-b.lonlat[0], -b.lonlat[1], 0];
    const done = () => { const p = pinOf(b); wake(p); live.textContent = STR[lang].landed(b.title[lang]); spinBtn.removeAttribute('aria-busy'); };
    if (still()) { r = target; if (k > 1.6) k = 1.3; dirty = true; requestAnimationFrame(done); return; }
    spinBtn.setAttribute('aria-busy', 'true');
    const r0 = r.slice();
    let dl = (((target[0] - r0[0]) % 360) + 360) % 360;
    dl += 360;
    const g0 = ((((r0[2] + 180) % 360) + 360) % 360) - 180;
    const k0 = k, k1 = k > 1.6 ? 1.3 : k;
    animate(2300 + dl * 2.2, easeSpin, (e) => {
      r = [r0[0] + dl * e, r0[1] + (target[1] - r0[1]) * e, g0 * (1 - e)];
      k = k0 + (k1 - k0) * e;
      dirty = true;
    }).then((ok) => { if (ok) done(); else spinBtn.removeAttribute('aria-busy'); });
  }
  spinBtn.addEventListener('click', spin);
  $('#zoom-in').addEventListener('click', () => { interact(); zoomTo(k * 1.6); });
  $('#zoom-out').addEventListener('click', () => { interact(); zoomTo(k / 1.6); });

  /* ---------------------------------------------------------------- the list of places */

  const list = $('#places-list'), places = $('#places'), placesOpen = $('#places-open');
  let listHover = false, listTimer = 0;
  function renderList() {
    list.innerHTML = BOOKS.map((b) => {
      const empty = !b.photo && !b.guide;
      const flag = (b.guide ? `<i>${esc(t('guideTag'))}</i>` : '') + (b.country === S.home ? `<i>${esc(t('homeTag'))}</i>` : '');
      return `<li><a href="#${b.hash}" data-id="${esc(b.id)}"${empty ? ' class="is-empty"' : ''}>`
        + `<span class="nm">${esc(b.title[lang])}${flag}</span><span class="dt">${esc(b.c.date[lang])}</span></a></li>`;
    }).join('');
    if (awake) $$('#places-list a').forEach((a) => a.classList.toggle('is-on', a.dataset.id === awake.b.id));
  }
  const bookOfLink = (a) => BOOKS.find((b) => b.id === a.dataset.id);
  function previewFrom(a) {
    const b = bookOfLink(a);
    if (!b) return;
    clearTimeout(listTimer);
    listTimer = setTimeout(() => {
      if (pageOpen || opening) return;
      interact();
      wake(pinOf(b));
      flyTo(b);
    }, 140);
  }
  list.addEventListener('pointerover', (e) => {
    const a = e.target.closest('a');
    if (!a || e.pointerType !== 'mouse') return;
    listHover = true;
    previewFrom(a);
  });
  list.addEventListener('pointerleave', () => { listHover = false; clearTimeout(listTimer); });
  list.addEventListener('focusin', (e) => { const a = e.target.closest('a'); if (a) previewFrom(a); });
  list.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    e.preventDefault();
    clearTimeout(listTimer);
    const b = bookOfLink(a);
    if (b) openBook(b, { from: a });
  });

  function setDrawer(open) {
    places.classList.toggle('is-open', open);
    placesOpen.setAttribute('aria-expanded', String(open));
    if (open) setTimeout(() => $('#places-close').focus({ preventScroll: true }), 60);
  }
  placesOpen.addEventListener('click', () => setDrawer(!places.classList.contains('is-open')));
  $('#places-close').addEventListener('click', () => { setDrawer(false); placesOpen.focus(); });

  /* ---------------------------------------------------------------- the page a book opens into */

  let pageOpen = null, opening = false, closing = false, pushed = false, returnFocus = null;
  let viewList = [], viewIdx = 0;

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
      + `<p class="leaf__note">${esc(c.note[lang])}</p>`
      + `<p class="leaf__date">${esc(c.date[lang])}</p>`
      + (c.id === S.home ? `<p class="leaf__date">${esc(t('home'))}</p>` : '')
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
      const m = /^(sp|sa|sl)_(.+)$/.exec(key);
      if (!m || !S.slides[m[2]]) return null;
      const s = S.slides[m[2]];
      if (m[1] === 'sp') return s.place[lang];
      if (m[1] === 'sa') return s.alt[lang];
      return lang === 'zh' ? `${s.place.zh}：這張怎麼拍` : `${s.place.en}: how this was made`;
    };
    const word = (k) => (k in d ? d[k] : slideWord(k));
    $$('[data-i18n]', root).forEach((el) => { const v = word(el.dataset.i18n); if (v != null) el.textContent = v; });
    $$('[data-i18n-html]', root).forEach((el) => { const v = word(el.dataset.i18nHtml); if (v != null) el.innerHTML = v; });
    $$('[data-i18n-alt]', root).forEach((el) => { const v = word(el.dataset.i18nAlt); if (v != null) el.alt = v; });
    $$('[data-i18n-aria]', root).forEach((el) => { const v = word(el.dataset.i18nAria); if (v != null) el.setAttribute('aria-label', v); });
  }

  function renderPage(b) {
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
        meta.before(facts);
      }
      $$('a[href*="gallery.html"]', pageBody).forEach((a) => a.setAttribute('href', `#${b.hash}`));
      viewList = $$('[data-slide]', pageBody).map((a) => a.dataset.slide);
      // on a phone the tables fold into rows; each cell carries its column's name
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

  pageBody.addEventListener('click', (e) => {
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

  // contents: mark the section being read
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

  function setClip(rc) {
    const st = page.style;
    if (!rc) { ['--ct', '--cr', '--cb', '--cl'].forEach((n) => st.setProperty(n, '0px')); return; }
    st.setProperty('--ct', `${Math.max(0, rc.top).toFixed(1)}px`);
    st.setProperty('--cr', `${Math.max(0, W - rc.right).toFixed(1)}px`);
    st.setProperty('--cb', `${Math.max(0, H - rc.bottom).toFixed(1)}px`);
    st.setProperty('--cl', `${Math.max(0, rc.left).toFixed(1)}px`);
  }
  const leafRect = (p) => {
    const el = p && !p.away ? p.el.querySelector('.book__leaf') : null;
    const rc = el ? el.getBoundingClientRect() : null;
    if (rc && rc.width > 2) return rc;
    return { top: cy - 30, bottom: cy + 30, left: cx - 22, right: cx + 22 };
  };

  async function openBook(b, opt = {}) {
    if (pageOpen || opening || closing) return;
    opening = true;
    interact();
    setDrawer(false);
    const p = pinOf(b);
    wake(p);
    const ok = await flyTo(b, { instant: !!opt.instant });
    if (!ok) { opening = false; return; }
    p.fresh = true;
    renderNow(0);
    if (!opt.fromHistory) { history.pushState({ book: b.id }, '', `#${b.hash}`); pushed = true; }
    returnFocus = opt.from || null;
    renderPage(b);
    page.scrollTop = 0;
    document.title = `${b.title[lang]} · tuan photography 陳亮元`;
    if (still() || opt.instant) {
      setClip(null);
      if (!opt.first) page.classList.add('is-veiled');
      page.hidden = false;
      void page.offsetWidth;
      page.classList.remove('is-veiled');
    } else {
      p.el.classList.add('is-open');
      await wait(300);
      setClip(leafRect(p));
      page.classList.add('is-veiled');
      page.hidden = false;
      void page.offsetWidth;
      page.classList.add('is-growing');
      setClip(null);
      await wait(380);
      page.classList.remove('is-veiled');
      await wait(400);
      page.classList.remove('is-growing');
    }
    pageOpen = b;
    opening = false;
    map.inert = true;
    const h = $('#page-h');
    if (h) h.focus({ preventScroll: true });
  }

  async function closeBook() {
    if (!pageOpen || closing) return;
    closing = true;
    const b = pageOpen;
    const p = pinOf(b);
    if (viewer.open) viewer.close();
    map.inert = false;
    p.fresh = true;
    renderNow(0);
    page.classList.add('is-veiled');
    if (!still()) {
      await wait(180);
      page.classList.add('is-shrinking');
      setClip(leafRect(p));
      await wait(560);
    }
    page.hidden = true;
    page.classList.remove('is-shrinking', 'is-veiled');
    setClip(null);
    pageBody.innerHTML = '';
    pageOpen = null;
    p.el.classList.remove('is-open');
    document.title = 'tuan photography 陳亮元';
    if (!still()) await wait(520);
    closing = false;
    const back = returnFocus && document.contains(returnFocus) ? returnFocus : list.querySelector(`a[data-id="${CSS.escape(b.id)}"]`);
    if (back && back.offsetParent !== null) back.focus({ preventScroll: true }); else stage.focus({ preventScroll: true });
    dirty = true;
  }

  function requestClose() {
    if (!pageOpen) return;
    if (pushed) { pushed = false; history.back(); } else {
      history.replaceState(null, '', location.pathname + location.search);
      closeBook();
    }
  }
  $('#back').addEventListener('click', requestClose);
  $('#back-2').addEventListener('click', requestClose);

  function route() {
    const h = decodeURIComponent(location.hash.slice(1));
    const b = byHash[h];
    if (b && !pageOpen) openBook(b, { fromHistory: true, instant: !booted, first: !booted });
    else if (!b && pageOpen) { pushed = false; closeBook(); }
  }
  addEventListener('popstate', route);

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
    img.sizes = '(max-width: 62rem) 100vw, calc(100vw - 26rem)';
    img.srcset = srcset(s);
    img.src = `../images/web/1280/${s.file}`;
    img.alt = s.alt[lang];
    $('#viewer-pic').replaceChildren(img);
    $('#viewer-h').textContent = s.place[lang];
    $('#viewer-where').textContent = s.where[lang];
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
    wake(null);
  });

  /* ---------------------------------------------------------------- language */

  function sayLine() {
    const guides = Object.values(S.guides).map((g) => g.title[lang]);
    const joined = lang === 'zh' ? guides.join('、') : guides.join(', ');
    return STR[lang].say(S.countries.length, joined);
  }
  function setLang(l, first) {
    lang = l;
    if (!first) { try { localStorage.setItem('tlap-lang', l); } catch (e) { /* storage blocked */ } }
    document.documentElement.lang = l === 'zh' ? 'zh-Hant' : 'en';
    $$('.lang button').forEach((btn) => btn.setAttribute('aria-pressed', String(btn.dataset.lang === l)));
    $$('[data-t]').forEach((el) => { el.textContent = t(el.dataset.t); });
    $('#say').textContent = sayLine();
    stage.setAttribute('aria-label', t('globe'));
    $('#places').setAttribute('aria-label', t('places'));
    renderList();
    for (const p of PINS) p.el.innerHTML = bookInner(p.b);
    if (awake) { tag.querySelector('b').textContent = awake.b.title[lang]; tag.querySelector('span').textContent = statusOf(awake.b); }
    if (pageOpen) {
      const top = page.scrollTop;
      renderPage(pageOpen);
      page.scrollTop = top;
      document.title = `${pageOpen.title[lang]} · tuan photography 陳亮元`;
    }
    if (viewer.open) showSlide();
  }
  $$('.lang button').forEach((btn) => btn.addEventListener('click', () => setLang(btn.dataset.lang)));

  /* ---------------------------------------------------------------- start */

  let booted = false;
  makePins();
  setLang(lang, true);
  layout();
  let resizeQueued = false;
  addEventListener('resize', () => {
    if (resizeQueued) return;
    resizeQueued = true;
    requestAnimationFrame(() => { resizeQueued = false; layout(); PINS.forEach((p) => { p.fresh = true; }); });
  });
  reduce.addEventListener('change', () => { if (still()) { auto = false; inertia = null; } });

  load('countries-110m.json').then((w) => {
    world.lo = w;
    dirty = true;
  }).catch(() => { /* the globe still turns as water; books stay reachable from the list */ }).finally(() => {
    requestAnimationFrame((now) => { last = now; frame(now); });
    route();
    booted = true;
  });
})();

/* tuan photography 陳亮元 · design 2 · "Globe and index" (orbit)
   A paper-relief globe on a desk, his books standing at their places, his photographs
   laid around it as prints. Pick a book or a print: the globe carries you into the
   country, the photograph takes over, the guide begins. Closing reverses the dive. */
(() => {
  'use strict';

  const S = window.SITE;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (v) => String(v ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, e) => a + (b - a) * e;
  const wait = (ms) => new Promise((res) => setTimeout(res, ms));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const still = () => reduce.matches;

  /* ---------------------------------------------------------------- words */

  const STR = {
    en: {
      say: (n, g) => `Photographs from ${n} countries, and a guide to ${g}. Turn the globe, then pick a print or a book.`,
      turn: 'Turn', closer: 'Closer', farther: 'Farther',
      places: 'Sixteen places', indexTitle: 'Index of photographs',
      count: (n, c) => `${n} photographs, ${c} places`,
      globeHelp: 'A globe of the places Thomas Chen has photographed. Arrow keys turn it, plus and minus lean in and out, Enter opens the place in the middle. Tab moves through the books; the list of places and the index of photographs open the same pages.',
      facing: (n) => `${n} is in the middle. Press Enter to open it.`,
      photosN: (n) => (n === 1 ? '1 photograph' : `${n} photographs`),
      prev: 'Previous', next: 'Next', iso: 'ISO', back: 'Back to the globe',
      bookAria: (n, s) => `${n}: ${s}`,
      printAria: (p, c) => `${p}: open ${c} with this photograph`,
    },
    zh: {
      say: (n, g) => `${n} 個國家的照片，和一本${g}攻略。轉動地球，挑一張照片或一本書。`,
      turn: '轉動', closer: '靠近', farther: '退後',
      places: '十六個地方', indexTitle: '照片索引',
      count: (n, c) => `${n} 張照片，${c} 個地方`,
      globeHelp: '陳亮元拍過的地方，做成一顆地球儀。方向鍵轉動，加號與減號靠近或退後，Enter 打開正中央的地方。Tab 依序走過每本書；地點清單與照片索引打開同樣的頁面。',
      facing: (n) => `${n}在中央。按 Enter 打開。`,
      photosN: (n) => `${n} 張照片`,
      prev: '上一張', next: '下一張', iso: 'ISO', back: '回到地球儀',
      bookAria: (n, s) => `${n}：${s}`,
      printAria: (p, c) => `${p}：以這張照片打開${c}`,
    },
  };

  let lang = 'en';
  try { const v = localStorage.getItem('tlap-lang'); if (v === 'en' || v === 'zh') lang = v; } catch (e) { /* storage blocked */ }
  const qlang = new URLSearchParams(location.search).get('lang');
  if (qlang === 'en' || qlang === 'zh') lang = qlang;
  const t = (k) => (k in STR[lang] ? STR[lang][k] : (S.i18n[lang][k] ?? k));
  const L = (o) => (o ? o[lang] : '');

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
  const bookOfCountry = Object.fromEntries(BOOKS.map((b) => [b.country, b]));
  const ORDER = BOOKS.flatMap((b) => b.c.photos);
  const statusOf = (b) => (b.guide ? t('bookOpen') : b.c.photos.length ? STR[lang].photosN(b.c.photos.length) : t('bandNone'));
  const coverOf = (b) => (b.guide ? S.guides[b.guide].lead : b.photo);
  const coords = ([la, lo]) => `${Math.abs(la).toFixed(2)}°${la >= 0 ? 'N' : 'S'} · ${Math.abs(lo).toFixed(2)}°${lo >= 0 ? 'E' : 'W'}`;

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

  /* ---------------------------------------------------------------- the globe */

  const map = $('#map'), stage = $('#stage'), canvas = $('#globe'), ctx = canvas.getContext('2d');
  const pinsEl = $('#pins'), tag = $('#tag'), live = $('#live');
  const page = $('#page'), pageIn = $('#page-in'), viewer = $('#viewer');
  const indexEl = $('#index'), indexBody = $('#index-body'), indexScroll = $('#index-scroll');
  const proj = d3.geoOrthographic().clipAngle(90).precision(0.5);
  const path = d3.geoPath(proj, ctx);
  const graticule = d3.geoGraticule10();
  const sphere = { type: 'Sphere' };
  const KMIN = 0.8, KMAX = 9;

  let W = 0, H = 0, dpr = 1, R0 = 300, baseS = 0.3, BW = 136, BH = 192, narrow = false;
  const rest = { cx: 0, cy: 0 };
  const view = { cx: 0, cy: 0 };
  let k = 1;
  let r = [-118, -22, 0];
  let dirty = true, settling = false;
  let auto = !still();
  let inertia = null;
  let anims = [];
  let ring = null;
  const world = { lo: null, hi: null, loading: false };
  const col = {};

  function readColours() {
    const cs = getComputedStyle(document.documentElement);
    for (const n of ['ocean', 'ocean-1', 'ocean-2', 'ocean-3', 'grat', 'land', 'land-1', 'land-2', 'been', 'been-1', 'been-2', 'been-on', 'been-on-1', 'spot', 'relief', 'border', 'limb', 'limb-soft', 'glint', 'atmo', 'shadow', 'brass', 'brass-2', 'brass-3', 'stem', 'ring', 'paper'])
      col[n] = cs.getPropertyValue(`--${n}`).trim();
    const rem = parseFloat(cs.fontSize) || 16;
    BW = (narrow ? 7.5 : 8.5) * rem; BH = (narrow ? 10.6 : 12) * rem;
  }

  function build(topo) {
    const all = topojson.feature(topo, topo.objects.countries).features;
    const ids = new Set(Object.values(ISO));
    const been = all.filter((f) => ids.has(String(f.id)));
    return {
      land: topojson.feature(topo, topo.objects.land),
      been: { type: 'FeatureCollection', features: been },
      byId: Object.fromEntries(been.map((f) => [String(f.id), f])),
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
  const current = () => (k >= 1.5 && world.hi ? world.hi : world.lo);

  function layout() {
    W = innerWidth; H = innerHeight;
    dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    narrow = W <= 992;
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    if (!narrow) {
      // the globe stands in the space between the gazetteer and the index of prints
      const left = $('#desk').getBoundingClientRect().right, right = indexEl.getBoundingClientRect().left;
      const free = right - left, top = 4.25 * rem;
      R0 = Math.max(150, Math.min((H - top - 2 * rem) / 2.3, free / 2 - 1.5 * rem, 430));
      rest.cx = left + free / 2; rest.cy = top + R0 + 0.9 * rem + Math.max(0, (H - top - 2.3 * R0 - 2 * rem) * 0.35);
      baseS = 0.36;
    } else {
      // on a phone the globe fills the width above the strip of prints; no stand
      const top = 3.75 * rem, strip = indexEl.getBoundingClientRect().top;
      R0 = Math.max(100, Math.min(W / 2 - 18, (strip - top) / 2 - 16));
      rest.cx = W / 2; rest.cy = top + (strip - top) / 2;
      baseS = 0.26;
    }
    if (!pageOpen && !opening && !closing) { view.cx = rest.cx; view.cy = rest.cy; }
    readColours();
    dirty = true;
  }

  /* ----- drawing: desk shadow, brass stand, the globe in paper relief, the ring, the stems */

  const strokePath = (colour, width) => { ctx.strokeStyle = colour; ctx.lineWidth = width; ctx.stroke(); };

  function drawDesk(a, R) {
    const deskY = view.cy + R * 1.22;
    ctx.save();
    ctx.globalAlpha = a;
    // the shadow the globe throws on the desk, light from the upper left
    ctx.save();
    ctx.translate(view.cx + R * 0.2, deskY + R * 0.01);
    ctx.scale(1, 0.22);
    const sh = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 1.05);
    sh.addColorStop(0, col.shadow);
    sh.addColorStop(0.55, 'oklch(34% 0.03 70 / 0.12)');
    sh.addColorStop(1, 'oklch(34% 0.03 70 / 0)');
    ctx.fillStyle = sh;
    ctx.beginPath(); ctx.arc(0, 0, R * 1.05, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // neck and foot, in brass
    const gap = Math.max(5, R * 0.03), ringR = R + gap;
    const neckTop = view.cy + ringR, footY = deskY - R * 0.015;
    const nk = ctx.createLinearGradient(view.cx - R * 0.02, 0, view.cx + R * 0.02, 0);
    nk.addColorStop(0, col['brass-2']); nk.addColorStop(0.5, col.brass); nk.addColorStop(1, col['brass-3']);
    ctx.fillStyle = nk;
    ctx.fillRect(view.cx - R * 0.02, neckTop, R * 0.04, footY - neckTop);
    ctx.beginPath(); ctx.ellipse(view.cx, footY, R * 0.3, R * 0.05, 0, 0, Math.PI * 2);
    const ft = ctx.createLinearGradient(view.cx - R * 0.3, 0, view.cx + R * 0.3, 0);
    ft.addColorStop(0, col['brass-2']); ft.addColorStop(0.5, col.brass); ft.addColorStop(1, col['brass-3']);
    ctx.fillStyle = ft; ctx.fill();
    ctx.restore();
  }

  function drawRing(a, R) {
    const gap = Math.max(5, R * 0.03), ringR = R + gap, lw = Math.max(2, R * 0.012);
    const tilt = 23.4 * RAD;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.lineWidth = lw; ctx.strokeStyle = col.brass;
    ctx.beginPath(); ctx.arc(view.cx, view.cy, ringR, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = Math.max(0.75, lw * 0.4); ctx.strokeStyle = col['brass-2'];
    ctx.beginPath(); ctx.arc(view.cx, view.cy, ringR - lw * 0.22, Math.PI * 1.08, Math.PI * 1.6); ctx.stroke();
    ctx.strokeStyle = col['brass-3'];
    ctx.beginPath(); ctx.arc(view.cx, view.cy, ringR + lw * 0.3, Math.PI * 0.1, Math.PI * 0.6); ctx.stroke();
    ctx.fillStyle = col.brass;
    for (const s of [-1, 1]) {
      const x = view.cx + Math.sin(tilt) * ringR * s, y = view.cy - Math.cos(tilt) * ringR * s;
      ctx.beginPath(); ctx.arc(x, y, lw * 1.6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function draw() {
    const R = R0 * k, cx = view.cx, cy = view.cy;
    proj.scale(R).translate([cx, cy]).rotate(r);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const standA = narrow ? 0 : clamp((1.35 - k) / 0.35, 0, 1);
    if (standA > 0) drawDesk(standA, R);

    // a soft atmosphere just outside the limb
    const at = ctx.createRadialGradient(cx, cy, R * 0.985, cx, cy, R * 1.075);
    at.addColorStop(0, col.atmo); at.addColorStop(0.45, 'oklch(82% 0.06 228 / 0.14)'); at.addColorStop(1, 'oklch(82% 0.06 228 / 0)');
    ctx.beginPath(); ctx.arc(cx, cy, R * 1.08, 0, Math.PI * 2); ctx.fillStyle = at; ctx.fill();

    // the water
    ctx.beginPath(); path(sphere); ctx.fillStyle = col.ocean; ctx.fill();

    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
    const w = current();
    const u = clamp(Math.sqrt(k), 0.9, 2.6) * clamp(R0 / 340, 0.6, 1.2);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (w) {
      // shallows banding towards every coast
      ctx.beginPath(); path(w.land);
      strokePath(col['ocean-1'], 19 * u);
      strokePath(col['ocean-2'], 10.5 * u);
      strokePath(col['ocean-3'], 4.5 * u);
      // the land as cut paper: its shadow, then its layers rising inland
      ctx.save(); ctx.translate(1.3 * u, 1.7 * u);
      ctx.beginPath(); path(w.land); ctx.fillStyle = col.relief; ctx.fill();
      ctx.restore();
      ctx.beginPath(); path(w.land); ctx.fillStyle = col['land-2']; ctx.fill();
      ctx.save(); ctx.clip();
      strokePath(col['land-1'], 12 * u);
      strokePath(col.land, 5 * u);
      ctx.restore();
      // his sixteen countries, one more sheet of warmer paper
      ctx.save(); ctx.translate(0.8 * u, 1.1 * u);
      ctx.beginPath(); path(w.been); ctx.fillStyle = col.relief; ctx.fill();
      ctx.restore();
      ctx.beginPath(); path(w.been); ctx.fillStyle = col['been-2']; ctx.fill();
      ctx.save(); ctx.clip();
      strokePath(col['been-1'], 9 * u);
      strokePath(col.been, 3.5 * u);
      ctx.restore();
      // the country a hand is on
      const on = awake && !awake.away ? w.byId[ISO[awake.b.country]] : null;
      if (on) {
        ctx.beginPath(); path(on); ctx.fillStyle = col['been-on-1']; ctx.fill();
        ctx.save(); ctx.clip(); strokePath(col['been-on'], 4 * u); ctx.restore();
      }
      ctx.beginPath(); path(w.borders); strokePath(col.border, 0.6);
    }
    ctx.beginPath(); path(graticule); strokePath(col.grat, 0.55);

    // where the photographs were made, once you lean in close
    if (k >= 2.4) {
      const a = clamp((k - 2.4) / 0.8, 0, 1);
      const centre = proj.invert([cx, cy]);
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = col.spot;
      for (const s of Object.values(S.slides)) {
        if (!s.ll) continue;
        const ll = [s.ll[1], s.ll[0]];
        if (d3.geoDistance(ll, centre) > Math.PI / 2 - 0.02) continue;
        const [x, y] = proj(ll);
        ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
    // a thin ring marks the print a hand is on
    if (ring) {
      const centre = proj.invert([cx, cy]);
      if (d3.geoDistance(ring, centre) < Math.PI / 2 - 0.02) {
        const [x, y] = proj(ring);
        ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); strokePath(col.ring, 1.2);
        ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fillStyle = col.ring; ctx.fill();
      }
    }

    // daylight on the ball: a glint at the upper left, the limb going into shade
    const g = ctx.createRadialGradient(cx - R * 0.42, cy - R * 0.46, R * 0.02, cx - R * 0.12, cy - R * 0.12, R * 1.2);
    g.addColorStop(0, col.glint);
    g.addColorStop(0.4, 'oklch(100% 0 0 / 0)');
    g.addColorStop(0.8, col['limb-soft']);
    g.addColorStop(1, col.limb);
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
    ctx.restore();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); strokePath(col.limb, 1);

    if (standA > 0) drawRing(standA, R);

    // each book stands on a fine stem rising from its place
    ctx.lineWidth = 1; ctx.strokeStyle = col.stem;
    ctx.beginPath();
    for (const p of PINS) if (!p.away) { ctx.moveTo(p.ax, p.ay); ctx.lineTo(p.x, p.y - 1); }
    ctx.stroke();
    for (const p of PINS) {
      if (p.away) continue;
      ctx.globalAlpha = p.o;
      ctx.beginPath(); ctx.arc(p.ax, p.ay, 3, 0, Math.PI * 2);
      ctx.fillStyle = col.spot; ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = col.paper; ctx.stroke();
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
      + `${face}<span class="book__band"><b>${title}</b><span>${esc(t(b.band))}</span></span></span>`
      + `<span class="book__back"><i>${esc(t('series'))}</i></span><span class="book__edge"></span>`
      + `<span class="book__top"></span><span class="book__shadow"></span></span></span>`;
  }

  function makePins() {
    pinsEl.innerHTML = '';
    for (const b of BOOKS) {
      const el = document.createElement('div');
      el.className = 'pin';
      el.dataset.id = b.id;
      el.tabIndex = 0;
      el.setAttribute('role', 'button');
      el.innerHTML = bookInner(b);
      pinsEl.append(el);
      const p = { b, el, ax: 0, ay: 0, x: 0, y: 0, ox: 0, oy: 0, tox: 0, toy: 0, sc: 0.3, o: 1, cos: 1, away: true, slot: 0, fresh: true, cache: {} };
      el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && !drag && !closing && !opening) wake(p); });
      el.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && awake === p && !hoverHold) sleepSoon(); });
      el.addEventListener('focus', () => { if (pageOpen || opening || closing) return; interact(); wake(p); flyTo(b); });
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dive(b, { from: el }); } });
      PINS.push(p);
    }
  }
  const pinOf = (b) => PINS.find((p) => p.b === b);
  function labelPins() { for (const p of PINS) p.el.setAttribute('aria-label', STR[lang].bookAria(p.b.title[lang], statusOf(p.b))); }

  function placePins(dt) {
    const R = R0 * k;
    const centre = proj.invert([view.cx, view.cy]);
    const size = baseS * clamp(0.85 + 0.35 * Math.log2(Math.max(k, 0.5)), 0.7, 1.5);
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
      p.turn = 14 + clamp((ax - view.cx) / R, -1, 1) * 18;
      order.push(p);
    }
    order.sort((a, b) => (b === awake) - (a === awake) || b.cos - a.cos);
    const boxes = [];
    const free = (x0, y0, x1, y1) => {
      if (x0 < 4 || x1 > W - 4 || y0 < 56) return false;
      for (const q of boxes) if (x0 < q[2] && x1 > q[0] && y0 < q[3] && y1 > q[1]) return false;
      return true;
    };
    for (const p of order) {
      const w = BW * p.s, h = BH * p.s, Lh = 8 + 22 * p.s;
      const ux = w * 1.06, uy = h * 0.94 + 4;
      const tries = p.o < 0.7 ? [0] : [p.slot, ...SLOTS.keys()];
      let chosen = 0, box = null;
      for (const i of tries) {
        const [sx, sy] = SLOTS[i];
        const x = p.ax + sx * ux, y = p.ay - Lh - sy * uy;
        const bx = [x - w / 2 + 1, y - h + 1, x + w / 2 - 1, y - 1];
        if (free(...bx)) { chosen = i; box = bx; break; }
      }
      if (!box) { chosen = 0; const x = p.ax, y = p.ay - Lh; box = [x - w / 2, y - h, x + w / 2, y]; }
      boxes.push(box);
      p.slot = chosen;
      p.tox = SLOTS[chosen][0] * ux;
      p.toy = -Lh - SLOTS[chosen][1] * uy;
      if (p.fresh || still()) { p.ox = p.tox; p.oy = p.toy; p.fresh = false; }
      else {
        const a = 1 - Math.exp(-dt / 90);
        p.ox += (p.tox - p.ox) * a; p.oy += (p.toy - p.oy) * a;
        if (Math.abs(p.tox - p.ox) > 0.3 || Math.abs(p.toy - p.oy) > 0.3) settling = true;
      }
      p.x = p.ax + p.ox; p.y = p.ay + p.oy;
      p.sc = p.s * (p === awake ? 1.3 : 1);
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
    stage.style.setProperty('--cx', view.cx.toFixed(1));
    stage.style.setProperty('--cy', view.cy.toFixed(1));
    stage.style.setProperty('--r', (R0 * k).toFixed(1));
  }

  function renderNow(dt = 0) {
    proj.scale(R0 * k).translate([view.cx, view.cy]).rotate(r);
    placePins(dt);
    draw();
    writePins();
  }

  /* ----- waking a book: it lifts, its name shows, its country warms, the index answers */

  let sleepTimer = 0, hoverHold = false;
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
    $$('.place').forEach((a) => a.classList.toggle('is-on', !!p && a.dataset.id === p.b.id));
    $$('.group', indexBody).forEach((g) => g.classList.toggle('is-on', !!p && g.dataset.id === p.b.id));
    dirty = true;
  }
  function sleepSoon() { clearTimeout(sleepTimer); sleepTimer = setTimeout(() => { if (!opening && !pageOpen) { wake(null); setRing(null); } }, 260); }
  function setRing(lonlat) { ring = lonlat; dirty = true; }

  /* ----- motion: animations, inertia, the slow turn before anyone touches it */

  function animate(dur, ease, apply) {
    return new Promise((res) => { anims.push({ t0: performance.now(), dur, ease, apply, res }); });
  }
  function cancelAnims() { const a = anims; anims = []; a.forEach((x) => x.res(false)); }
  const turnBtn = $('#turn');
  function setAuto(v) { auto = v && !still(); turnBtn.setAttribute('aria-pressed', String(auto)); }
  function interact() { setAuto(false); inertia = null; cancelAnims(); }

  function flyTo(b, opt = {}) {
    const target = [-b.lonlat[0], -b.lonlat[1], 0];
    const q0 = versor(r), q1 = versor(target);
    const ang = qAngle(q0, q1);
    if (still() || opt.instant || ang < 0.003) { r = target; dirty = true; return Promise.resolve(true); }
    const dur = opt.dur || Math.min(1250, 450 + ang * 520);
    return animate(dur, easeExpo, (e) => { r = versor.rotation(slerp(q0, q1, e)); dirty = true; });
  }
  function zoomTo(k1, dur = 420) {
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
        r = [r[0] + dt * 0.0011, r[1], r[2]];
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
    const R = R0 * k * 0.996, dx = x - view.cx, dy = y - view.cy, d = Math.hypot(dx, dy);
    return d > R ? [view.cx + (dx / d) * R, view.cy + (dy / d) * R] : [x, y];
  }
  function startDrag(x, y) {
    proj.scale(R0 * k).translate([view.cx, view.cy]).rotate(r);
    const ll = proj.invert(onDisk(x, y));
    drag = { v0: versor.cartesian(ll), q0: versor(r), r0: r.slice(), x0: x, y0: y, moved: false, samples: [{ t: performance.now(), q: versor(r) }] };
  }
  function moveDrag(x, y) {
    if (!drag) return;
    if (!drag.moved && Math.hypot(x - drag.x0, y - drag.y0) < 5) return;
    if (!drag.moved) { drag.moved = true; stage.classList.add('is-dragging'); }
    proj.scale(R0 * k).translate([view.cx, view.cy]).rotate(drag.r0);
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
        if (p) dive(p.b, { from: p.el });
      } else pickAt(e.clientX, e.clientY);
    }
    downPin = null; downAt = null;
  }
  stage.addEventListener('pointerup', pointerEnd);
  stage.addEventListener('pointercancel', pointerEnd);

  stage.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (pageOpen || opening) return;
    interact();
    const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    k = clamp(k * Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.0017)), KMIN, KMAX);
    ensureHi();
    dirty = true;
  }, { passive: false });

  stage.addEventListener('dblclick', (e) => {
    if (pageOpen || opening) return;
    interact();
    proj.scale(R0 * k).translate([view.cx, view.cy]).rotate(r);
    if (Math.hypot(e.clientX - view.cx, e.clientY - view.cy) < R0 * k) flyTo({ lonlat: proj.invert([e.clientX, e.clientY]) }, { dur: 600 });
    zoomTo(k * 1.8, 600);
  });

  function pickAt(x, y) {
    proj.scale(R0 * k).translate([view.cx, view.cy]).rotate(r);
    if (Math.hypot(x - view.cx, y - view.cy) > R0 * k) { wake(null); return; }
    const ll = proj.invert([x, y]);
    let hit = null, best = 26;
    for (const p of PINS) {
      if (p.away) continue;
      const d = Math.hypot(p.ax - x, p.ay - y);
      if (d < best) { best = d; hit = p; }
    }
    if (!hit && world.lo) {
      const w = current();
      const f = w.been.features.find((g) => d3.geoContains(g, ll));
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
    if (pageOpen || opening || e.target !== stage) return;
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
      case 'Enter': case ' ': { const p = awake && !awake.away ? awake : nearest(); if (p) dive(p.b, { from: stage }); break; }
      default: handled = false;
    }
    if (handled) e.preventDefault();
  });
  stage.addEventListener('focus', () => { setAuto(false); });

  turnBtn.addEventListener('click', () => { const v = !auto; inertia = null; cancelAnims(); setAuto(v); });
  $('#zoom-in').addEventListener('click', () => { interact(); zoomTo(k * 1.6); });
  $('#zoom-out').addEventListener('click', () => { interact(); zoomTo(k / 1.6); });

  /* ---------------------------------------------------------------- the sixteen places */

  const list = $('#places-list'), places = $('#places'), placesOpen = $('#places-open');
  let peekTimer = 0;
  function renderList() {
    list.innerHTML = BOOKS.map((b) => {
      const empty = !b.photo && !b.guide;
      return `<li><button type="button" class="place${empty ? ' is-empty' : ''}" data-id="${esc(b.id)}">`
        + `<span class="nm">${esc(b.title[lang])}</span><span class="dt">${esc(b.c.date[lang])}</span></button></li>`;
    }).join('');
    if (awake) $$('.place', list).forEach((a) => a.classList.toggle('is-on', a.dataset.id === awake.b.id));
  }
  const bookOfId = (id) => BOOKS.find((b) => b.id === id);
  function peek(b, lonlat) {
    if (!b) return;
    clearTimeout(peekTimer);
    hoverHold = true;
    peekTimer = setTimeout(() => {
      if (pageOpen || opening || closing) return;
      interact();
      wake(pinOf(b));
      setRing(lonlat || null);
      flyTo(lonlat ? { lonlat } : b, { dur: 700 });
    }, 120);
  }
  function unpeek() { hoverHold = false; clearTimeout(peekTimer); sleepSoon(); }
  list.addEventListener('pointerover', (e) => { const a = e.target.closest('.place'); if (a && e.pointerType === 'mouse') peek(bookOfId(a.dataset.id)); });
  list.addEventListener('pointerleave', unpeek);
  list.addEventListener('focusin', (e) => { const a = e.target.closest('.place'); if (a) peek(bookOfId(a.dataset.id)); });
  list.addEventListener('focusout', (e) => { if (!list.contains(e.relatedTarget)) unpeek(); });
  list.addEventListener('click', (e) => {
    const a = e.target.closest('.place');
    if (!a) return;
    clearTimeout(peekTimer);
    const b = bookOfId(a.dataset.id);
    if (b) dive(b, { from: a });
  });

  function setDrawer(open) {
    places.classList.toggle('is-open', open);
    placesOpen.setAttribute('aria-expanded', String(open));
    if (open) setTimeout(() => $('#places-close').focus({ preventScroll: true }), 60);
  }
  placesOpen.addEventListener('click', () => setDrawer(!places.classList.contains('is-open')));
  $('#places-close').addEventListener('click', () => { setDrawer(false); placesOpen.focus(); });

  /* ---------------------------------------------------------------- the index of prints */

  const imgSrc = (s, size) => `../images/web/${size ? size + '/' : ''}${s.file}`;
  const srcset = (s) => `../images/web/640/${s.file} 640w, ../images/web/1280/${s.file} 1280w, ../images/web/${s.file} ${s.w}w`;

  function renderIndex() {
    $('#index-count').textContent = STR[lang].count(ORDER.length, S.countries.length);
    indexBody.innerHTML = BOOKS.map((b) => {
      const c = b.c;
      const go = b.guide ? t('bookOpen') : (c.photos.length ? '' : t('bandNone'));
      const prints = c.photos.map((id) => {
        const s = S.slides[id];
        return `<li><button type="button" class="print" data-slide="${esc(id)}" aria-label="${esc(STR[lang].printAria(L(s.place), b.title[lang]))}">`
          + `<span class="print__img"><img src="${imgSrc(s, 640)}" alt="" loading="lazy" decoding="async" width="${s.w}" height="${s.h}"></span>`
          + `<span class="print__name">${esc(L(s.place))}</span></button></li>`;
      }).join('');
      return `<section class="group" data-id="${esc(b.id)}" aria-labelledby="g-${esc(b.id)}">`
        + `<div class="group__head"><h3><button type="button" class="group__name" id="g-${esc(b.id)}" data-id="${esc(b.id)}">`
        + `<span>${esc(b.title[lang])}</span>${go ? `<span class="group__go">${esc(go)}</span>` : ''}</button></h3>`
        + `<span class="group__meta num">${esc(c.date[lang])}</span></div>`
        + (prints ? `<ul class="prints">${prints}</ul>` : `<p class="group__none">${esc(t('bandNone'))}</p>`)
        + `</section>`;
    }).join('');
    if (awake) $$('.group', indexBody).forEach((g) => g.classList.toggle('is-on', g.dataset.id === awake.b.id));
  }
  function peekFrom(target) {
    const pr = target.closest('.print'), gn = target.closest('.group__name');
    if (pr) { const s = S.slides[pr.dataset.slide]; peek(bookOfCountry[s.country], [s.ll[1], s.ll[0]]); }
    else if (gn) peek(bookOfId(gn.dataset.id));
  }
  indexBody.addEventListener('pointerover', (e) => { if (e.pointerType === 'mouse') peekFrom(e.target); });
  indexBody.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') unpeek(); });
  indexBody.addEventListener('focusin', (e) => peekFrom(e.target));
  indexBody.addEventListener('focusout', (e) => { if (!indexBody.contains(e.relatedTarget)) unpeek(); });
  indexBody.addEventListener('click', (e) => {
    const pr = e.target.closest('.print'), gn = e.target.closest('.group__name');
    clearTimeout(peekTimer);
    if (pr) { const s = S.slides[pr.dataset.slide]; dive(bookOfCountry[s.country], { from: pr, slide: pr.dataset.slide }); }
    else if (gn) dive(bookOfId(gn.dataset.id), { from: gn });
  });
  function revealGroup(id) {
    const g = indexBody.querySelector(`.group[data-id="${CSS.escape(id)}"]`);
    if (!g) return;
    if (narrow) { g.scrollIntoView({ behavior: still() ? 'auto' : 'smooth', inline: 'start', block: 'nearest' }); return; }
    const top = g.offsetTop - indexBody.offsetTop;
    const seen = top >= indexScroll.scrollTop - 8 && top + Math.min(g.offsetHeight, indexScroll.clientHeight * 0.6) <= indexScroll.scrollTop + indexScroll.clientHeight;
    if (!seen) indexScroll.scrollTo({ top: top - 4, behavior: still() ? 'auto' : 'smooth' });
  }

  /* ---------------------------------------------------------------- the dive: into the country, into the photograph, into the page */

  let pageOpen = null, opening = false, closing = false, pushed = false, returnFocus = null;
  let viewList = [], viewIdx = 0, pageSlide = null, saved = null;

  function polygonAt(f, lonlat) {
    const g = f.geometry;
    if (g.type !== 'MultiPolygon') return f;
    let best = null, bestArea = 0;
    for (const coords of g.coordinates) {
      const pf = { type: 'Feature', geometry: { type: 'Polygon', coordinates: coords } };
      if (d3.geoContains(pf, lonlat)) return pf;
      const a = d3.geoArea(pf);
      if (a > bestArea) { bestArea = a; best = pf; }
    }
    return best || f;
  }
  function diveScale(b) {
    const w = world.hi || world.lo;
    const f = w && w.byId[ISO[b.country]];
    if (!f) return 16;
    const poly = polygonAt(f, b.lonlat);
    const tp = d3.geoOrthographic().rotate([-b.lonlat[0], -b.lonlat[1], 0]).scale(R0).translate([0, 0]).clipAngle(90).precision(0.5);
    const [[x0, y0], [x1, y1]] = d3.geoPath(tp).bounds(poly);
    const span = Math.max(x1 - x0, y1 - y0, 1);
    return clamp((0.68 * Math.min(W, H)) / span, 2.4, 26);
  }

  function setClip(rc) {
    const st = page.style;
    if (!rc) { ['--ct', '--cr', '--cb', '--cl'].forEach((n) => st.setProperty(n, '0px')); st.setProperty('--cs', '1'); return; }
    st.setProperty('--ct', `${Math.max(0, rc.top).toFixed(1)}px`);
    st.setProperty('--cr', `${Math.max(0, W - rc.right).toFixed(1)}px`);
    st.setProperty('--cb', `${Math.max(0, H - rc.bottom).toFixed(1)}px`);
    st.setProperty('--cl', `${Math.max(0, rc.left).toFixed(1)}px`);
    st.setProperty('--cs', Math.max(rc.width / W, rc.height / H, 0.05).toFixed(4));
    st.setProperty('--ox', `${((rc.left + rc.right) / 2).toFixed(1)}px`);
    st.setProperty('--oy', `${((rc.top + rc.bottom) / 2).toFixed(1)}px`);
  }
  const faceRect = (p) => {
    const el = p && !p.away ? p.el.querySelector('.book__face') : null;
    const rc = el ? el.getBoundingClientRect() : null;
    if (rc && rc.width > 2) return rc;
    return { top: view.cy - 40, bottom: view.cy + 40, left: view.cx - 28, right: view.cx + 28, width: 56, height: 80 };
  };

  async function dive(b, opt = {}) {
    if (pageOpen || opening || closing) return;
    opening = true;
    interact();
    setDrawer(false);
    setRing(null);
    const p = pinOf(b);
    wake(p);
    const slide = opt.slide && S.slides[opt.slide] && S.slides[opt.slide].country === b.country ? opt.slide : coverOf(b);
    pageSlide = slide;
    if (!opt.fromHistory) {
      history.pushState({ book: b.id, slide }, '', `#${b.hash}${slide && slide !== coverOf(b) ? '/' + slide : ''}`);
      pushed = true;
    }
    returnFocus = opt.from || null;
    saved = { k, cx: rest.cx, cy: rest.cy };
    renderPage(b, slide);
    page.scrollTop = 0;
    document.title = `${b.title[lang]} · tuan photography 陳亮元`;
    map.classList.add('is-diving');
    ensureHi();
    if (still() || opt.instant) {
      r = [-b.lonlat[0], -b.lonlat[1], 0];
      k = Math.max(k, 1);
      dirty = true;
      setClip(null);
      page.hidden = false;
      if (!opt.first) page.classList.add('is-cut');
    } else {
      const k0 = k, k1 = diveScale(b);
      const q0 = versor(r), q1 = versor([-b.lonlat[0], -b.lonlat[1], 0]);
      const c0 = { cx: view.cx, cy: view.cy };
      const ok = await animate(2000, easeExpo, (e) => {
        r = versor.rotation(slerp(q0, q1, Math.min(1, e * 1.25)));
        k = k0 * Math.pow(k1 / k0, e);
        view.cx = lerp(c0.cx, W / 2, e); view.cy = lerp(c0.cy, H / 2, e);
        dirty = true; ensureHi();
      });
      if (!ok) { opening = false; map.classList.remove('is-diving'); return; }
      p.fresh = true;
      renderNow(0);
      setClip(faceRect(p));
      page.classList.add('is-veiled');
      page.hidden = false;
      void page.offsetWidth;
      page.classList.add('is-growing');
      setClip(null);
      await wait(760);
      page.classList.remove('is-veiled');
      await wait(300);
      page.classList.remove('is-growing');
    }
    pageOpen = b;
    opening = false;
    map.inert = true;
    const h = $('#page-h');
    if (h) h.focus({ preventScroll: true });
  }

  async function closeDive() {
    if (!pageOpen || closing) return;
    closing = true;
    const b = pageOpen;
    const p = pinOf(b);
    if (viewer.open) viewer.close();
    map.inert = false;
    if (!still()) {
      page.classList.add('is-veiled');
      await wait(220);
      p.fresh = true;
      renderNow(0);
      page.classList.add('is-shrinking');
      setClip(faceRect(p));
      await wait(640);
    }
    page.hidden = true;
    page.classList.remove('is-shrinking', 'is-veiled', 'is-growing', 'is-cut');
    setClip(null);
    pageIn.innerHTML = '';
    pageOpen = null;
    document.title = 'tuan photography 陳亮元';
    map.classList.remove('is-diving');
    if (!still() && saved) {
      const kA = k, c0 = { cx: view.cx, cy: view.cy };
      await animate(1500, easeExpo, (e) => {
        k = kA * Math.pow(saved.k / kA, e);
        view.cx = lerp(c0.cx, rest.cx, e); view.cy = lerp(c0.cy, rest.cy, e);
        dirty = true;
      });
    } else { view.cx = rest.cx; view.cy = rest.cy; if (saved) k = saved.k; }
    closing = false;
    dirty = true;
    const back = returnFocus && document.contains(returnFocus) ? returnFocus : list.querySelector(`.place[data-id="${CSS.escape(b.id)}"]`);
    if (back && back.offsetParent !== null) back.focus({ preventScroll: true }); else stage.focus({ preventScroll: true });
  }

  function requestClose() {
    if (!pageOpen || closing) return;
    if (pushed) { pushed = false; history.back(); } else {
      history.replaceState(null, '', location.pathname + location.search);
      closeDive();
    }
  }
  $('#back').addEventListener('click', requestClose);
  $('#back-2').addEventListener('click', requestClose);

  function route() {
    const raw = decodeURIComponent(location.hash.slice(1));
    const [h, sl] = raw.split('/');
    const b = byHash[h];
    if (b && !pageOpen && !opening) dive(b, { fromHistory: true, instant: !booted, first: !booted, slide: sl });
    else if (b && pageOpen && !opening && !closing && (b !== pageOpen || (sl || coverOf(b)) !== pageSlide)) {
      // one place's page straight to another's: swap the page, keep the dive landed
      const slide = sl && S.slides[sl] && S.slides[sl].country === b.country ? sl : coverOf(b);
      pageSlide = slide;
      pageOpen = b;
      wake(pinOf(b));
      r = [-b.lonlat[0], -b.lonlat[1], 0];
      renderPage(b, slide);
      page.scrollTop = 0;
      document.title = `${b.title[lang]} · tuan photography 陳亮元`;
      const h = $('#page-h');
      if (h) h.focus({ preventScroll: true });
    } else if (!b && pageOpen) { pushed = false; closeDive(); }
  }
  addEventListener('popstate', route);

  /* ---------------------------------------------------------------- the pages */

  function rowsOf(ids, target) {
    const rows = []; let cur = [], sum = 0;
    for (const id of ids) {
      cur.push(id); sum += S.slides[id].w / S.slides[id].h;
      if (sum >= target) { rows.push(cur); cur = []; sum = 0; }
    }
    if (cur.length) rows.push(cur);
    return rows;
  }
  function coverHTML(b, slide) {
    const s = slide ? S.slides[slide] : null;
    const title = esc(b.title[lang]);
    if (!s) {
      return `<div class="cover cover--none"><div class="cover__text"><h1 id="page-h" tabindex="-1">${title}</h1>`
        + `<p class="cover__sub">${esc(L(b.c.note))}</p><p class="cover__coords">${esc(coords(b.ll))}</p></div></div>`;
    }
    return `<div class="cover"><img src="${imgSrc(s, 1280)}" srcset="${esc(srcset(s))}" sizes="100vw" width="${s.w}" height="${s.h}" alt="${esc(L(s.alt))}" decoding="async" fetchpriority="high">`
      + `<div class="cover__veil"></div><div class="cover__text"><h1 id="page-h" tabindex="-1">${title}</h1>`
      + `<p class="cover__sub">${esc(L(s.place))}</p><p class="cover__coords">${esc(coords(s.ll || b.ll))}</p></div></div>`;
  }
  function placeHTML(b) {
    const c = b.c;
    const head = `<header class="head">${c.photos.length ? `<p class="head__note">${esc(L(c.note))}</p>` : ''}<p class="head__date num">${esc(L(c.date))}</p>`
      + `<p class="head__not">${esc(t('bookNot'))}</p>`
      + (c.photos.length ? '' : `<p class="head__empty">${esc(t('bandNone'))}</p>`) + `</header>`;
    if (!c.photos.length) return head;
    const rows = rowsOf(c.photos, 2.7).map((row) => {
      const sum = row.reduce((a, id) => a + S.slides[id].w / S.slides[id].h, 0);
      return `<div class="row">${row.map((id) => {
        const s = S.slides[id];
        const ar = s.w / s.h;
        const vw = Math.round((ar / sum) * 92);
        return `<figure class="shot" data-ar="${ar.toFixed(4)}"><button type="button" data-slide="${esc(id)}" aria-label="${esc(lang === 'zh' ? `${s.place.zh}：這張怎麼拍` : `${s.place.en}: how this was made`)}">`
          + `<img src="${imgSrc(s, 1280)}" srcset="${esc(srcset(s))}" sizes="(max-width: 40rem) 92vw, ${vw}vw" width="${s.w}" height="${s.h}" alt="${esc(L(s.alt))}" loading="lazy" decoding="async"></button>`
          + `<figcaption><b>${esc(L(s.place))}</b><span>${esc(L(s.where))}</span></figcaption></figure>`;
      }).join('')}</div>`;
    }).join('');
    return `${head}<div class="rows">${rows}</div>`;
  }

  function guideI18n(root, id) {
    const d = S.guides[id].i18n[lang] || {};
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

  function renderPage(b, slide) {
    if (b.guide) {
      const g = S.guides[b.guide];
      pageIn.innerHTML = coverHTML(b, slide) + `<div class="guide">${g.html}</div>`;
      const guide = $('.guide', pageIn);
      guideI18n(guide, b.guide);
      const top = $('.guide-top', guide);
      const h1 = $('h1', top);
      if (h1) h1.remove();
      const lead = $('.guide-top > .piece', guide);
      if (lead) lead.remove();
      const meta = $('.guide-top .meta', guide);
      if (meta) {
        const facts = document.createElement('p');
        facts.className = 'facts';
        facts.textContent = g.facts[lang];
        meta.before(facts);
      }
      $$('a[href*="gallery.html"]', guide).forEach((a) => a.setAttribute('href', `#${b.hash}`));
      $$('[style]', guide).forEach((el) => { const i = el.style.getPropertyValue('--i'); el.removeAttribute('style'); if (i) el.style.setProperty('--i', i); });
      viewList = [slide, ...$$('[data-slide]', guide).map((a) => a.dataset.slide)].filter((v, i, arr) => v && arr.indexOf(v) === i);
      $$('table.sheet', guide).forEach((tb) => {
        const heads = $$('thead th', tb).map((th) => th.textContent.trim());
        if (!heads.length) return;
        $$('tbody tr', tb).forEach((tr) => Array.from(tr.cells).forEach((td, i) => { if (i > 0 && heads[i]) td.dataset.label = heads[i]; }));
      });
    } else {
      pageIn.innerHTML = coverHTML(b, slide) + placeHTML(b);
      $$('[data-ar]', pageIn).forEach((f) => f.style.setProperty('--ar', f.dataset.ar));
      viewList = b.c.photos.slice();
    }
    spy();
  }

  pageIn.addEventListener('click', (e) => {
    const sl = e.target.closest('[data-slide]');
    if (sl) { e.preventDefault(); openViewer(sl.dataset.slide); return; }
    const a = e.target.closest('a[href^="#"]');
    if (a) {
      e.preventDefault();
      const id = a.getAttribute('href').slice(1);
      const el = id && pageIn.querySelector(`#${CSS.escape(id)}`);
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
    const toc = $('.toc', pageIn);
    if (!toc) return;
    const heads = $$('.body h2[id]', pageIn);
    let cur = null;
    for (const h of heads) if (h.getBoundingClientRect().top < 140) cur = h.id;
    $$('a', toc).forEach((a) => { if (a.getAttribute('href') === `#${cur}`) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
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
    img.sizes = '(max-width: 62rem) 100vw, calc(100vw - 26rem)';
    img.srcset = srcset(s);
    img.src = imgSrc(s, 1280);
    img.alt = L(s.alt);
    $('#viewer-pic').replaceChildren(img);
    $('#viewer-h').textContent = L(s.place);
    $('#viewer-where').textContent = L(s.where);
    $('#viewer-coords').textContent = s.ll ? coords(s.ll) : '';
    const data = [s.camera, s.lens, s.focal, s.aperture, s.shutter, s.iso ? `${STR[lang].iso} ${s.iso}` : ''].filter(Boolean);
    $('#viewer-data').innerHTML = data.map((x) => `<span>${esc(x)}</span>`).join('');
    $('#viewer-extra').textContent = s.best ? `${t('best')}${lang === 'zh' ? '：' : ': '}${L(s.best)}` : '';
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
    wake(null); setRing(null);
  });

  /* ---------------------------------------------------------------- language */

  function sayLine() {
    const guides = Object.values(S.guides).map((g) => g.title[lang]);
    return STR[lang].say(S.countries.length, lang === 'zh' ? guides.join('、') : guides.join(', '));
  }
  function setLang(l, first) {
    lang = l;
    if (!first) { try { localStorage.setItem('tlap-lang', l); } catch (e) { /* storage blocked */ } }
    document.documentElement.lang = l === 'zh' ? 'zh-Hant' : 'en';
    $$('.lang button').forEach((btn) => btn.setAttribute('aria-pressed', String(btn.dataset.lang === l)));
    $$('[data-t]').forEach((el) => { el.textContent = t(el.dataset.t); });
    $('#say').textContent = sayLine();
    stage.setAttribute('aria-label', lang === 'zh' ? '地球儀' : 'Globe');
    pinsEl.setAttribute('aria-label', lang === 'zh' ? '地球上的攻略書' : 'Guide books on the globe');
    renderList();
    renderIndex();
    for (const p of PINS) p.el.innerHTML = bookInner(p.b);
    labelPins();
    if (awake) { tag.querySelector('b').textContent = awake.b.title[lang]; tag.querySelector('span').textContent = statusOf(awake.b); }
    if (pageOpen) {
      const top = page.scrollTop;
      renderPage(pageOpen, pageSlide);
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
  reduce.addEventListener('change', () => { if (still()) { setAuto(false); inertia = null; } });
  $('#turn').setAttribute('aria-pressed', String(auto));

  load('countries-110m.json').then((w) => {
    world.lo = w;
    dirty = true;
  }).catch(() => { /* the globe still turns as water; every place stays reachable from the list and the index */ }).finally(() => {
    requestAnimationFrame((now) => { last = now; frame(now); });
    route();
    booted = true;
  });
})();

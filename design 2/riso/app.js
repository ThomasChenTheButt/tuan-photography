/* tuan photography 陳亮元 · design 2 · "Two-ink riso print"
   The home page is a map printed on a risograph: cool uncoated paper, a teal drum and a
   fluorescent coral drum that overprint. The press (press.js) prints the inks; a second canvas
   carries the coastlines, the place marks and the leaders in teal, and the books stand on top as
   HTML. Choosing a place dives as the atlas plate did: the map magnifies into the country while
   a fine coral ring tightens on the spot; the halftone screen grows as it magnifies, prints the
   cover photograph as its own two-ink duotone, resolves, and the full-colour photograph dissolves
   in through a wide feathered opening. The page runs beneath the cover. */
(() => {
  'use strict';

  const S = window.SITE;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = matchMedia('(max-width: 47.99rem)');
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // the data keeps a few typographic dashes (a date range, a price range); the page shows none
  const clean = (s) => String(s ?? '').replace(/(\d)\s*[–—]\s*(\d)/g, '$1-$2').replace(/\s+[–—]\s+/g, ', ').replace(/[–—]/g, '-');
  const expOut = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
  const inOut = (x) => { x = clamp(x, 0, 1); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const sine = (x) => { x = clamp(x, 0, 1); return -(Math.cos(Math.PI * x) - 1) / 2; };

  /* ------------------------------------------------------------ the two inks */

  const INK = {
    paper: '#f1f3f3',
    teal: 'rgb(0, 120, 128)',
    coral: 'rgb(255, 111, 97)',
    tealA: (a) => `rgba(0, 120, 128, ${a})`,
    coralA: (a) => `rgba(255, 111, 97, ${a})`,
  };
  const GL_INK = { paper: [0.945, 0.953, 0.953], ink1: [0.0, 0.47, 0.502], ink2: [1.0, 0.435, 0.38] };
  const MIS = [1.4, -0.9]; // the coral drum sits a little right of and above the teal one

  /* ------------------------------------------------------------ words */

  const WORDS = {
    ig: { en: 'Instagram', zh: 'Instagram' },
    mastLine: { en: 'Sixteen places travelled. Choose one and the map goes in.', zh: '走過的十六個地方。選一個，地圖就帶你進去。' },
    mapLabel: { en: 'Map of the places travelled', zh: '走過的地方地圖' },
    mapHint: { en: 'Drag or use the arrow keys to move the map. Scroll, or press plus and minus, to zoom. Tab moves through the books.', zh: '拖曳或用方向鍵移動地圖；捲動，或按加號、減號縮放。Tab 鍵逐一走過每本書。' },
    siteLabel: { en: 'Site', zh: '網站' },
    langLabel: { en: 'Language', zh: '語言' },
    zoomGroup: { en: 'Zoom', zh: '縮放' },
    zoomIn: { en: 'Zoom in', zh: '放大' },
    zoomOut: { en: 'Zoom out', zh: '縮小' },
    zoomAll: { en: 'Whole map', zh: '整張地圖' },
    credit: { en: 'Map: Natural Earth', zh: '地圖：Natural Earth' },
    indexTitle: { en: 'Photographs', zh: '照片' },
    count: { en: (n, m) => `${n} photographs in ${m} places`, zh: (n, m) => `${m} 個地方，${n} 張照片` },
    flights: { en: 'Flights', zh: '飛過的航線' },
    flightsAria: { en: 'Flights flown. Play them again.', zh: '飛過的航線。再播一次。' },
    seePhotos: { en: 'See the photographs', zh: '看照片' },
    made: { en: (p) => `${p}: how this was made`, zh: (p) => `${p}：這張怎麼拍` },
    diveTo: { en: (p) => `${p}: go in with this photograph`, zh: (p) => `${p}：從這張照片進去` },
    camera: { en: 'Camera', zh: '相機' },
    lens: { en: 'Lens', zh: '鏡頭' },
    settings: { en: 'Settings', zh: '參數' },
    prev: { en: 'Previous', zh: '上一張' },
    next: { en: 'Next', zh: '下一張' },
    countOf: { en: (i, n) => `${i} of ${n}`, zh: (i, n) => `第 ${i} 張，共 ${n} 張` },
    nPhotos: { en: (n) => (n === 1 ? '1 photograph' : `${n} photographs`), zh: (n) => `${n} 張照片` },
    opening: { en: (p) => `${p} is open.`, zh: (p) => `已打開${p}。` },
    seas: { en: { pacific: 'Pacific Ocean', indian: 'Indian Ocean', atlantic: 'Atlantic Ocean' }, zh: { pacific: '太平洋', indian: '印度洋', atlantic: '大西洋' } },
  };

  let lang = 'en';
  try {
    const saved = localStorage.getItem('tlap-lang');
    if (saved === 'en' || saved === 'zh') lang = saved;
  } catch (e) { /* storage blocked: stay in English */ }
  const qp = new URLSearchParams(location.search).get('lang');
  if (qp === 'en' || qp === 'zh') lang = qp;

  const t = (key, ...args) => {
    const w = WORDS[key];
    if (w) { const v = w[lang]; return typeof v === 'function' ? v(...args) : v; }
    const s = S.i18n[lang][key];
    return s == null ? key : s;
  };
  const L = (pair) => clean(pair ? (pair[lang] != null ? pair[lang] : pair.en) : '');

  /* ------------------------------------------------------------ his places */

  const ISO = { spain: '724', uk: '826', france: '250', germany: '276', switzerland: '756', taiwan: '158', japan: '392', 'south-korea': '410', 'hong-kong': '344', china: '156', singapore: '702', vietnam: '704', dubai: '784', australia: '036', 'new-zealand': '554', usa: '840' };
  const COUNTRY = Object.fromEntries(S.countries.map((c) => [c.id, c]));
  const books = S.books.map((b) => ({ ...b, view: b.guide ? `guide-${b.guide}` : `place-${b.country}` }));
  const BOOK = Object.fromEntries(books.map((b) => [b.country, b]));
  const SL = S.slides;
  const order = books.map((b) => COUNTRY[b.country]).filter(Boolean);
  const placeLL = (cid) => { const b = BOOK[cid]; return b && b.guide && S.guides[b.guide] ? S.guides[b.guide].ll : COUNTRY[cid].ll; };
  const photosOf = (cid) => COUNTRY[cid].photos.filter((id) => SL[id]);
  const indexOrder = order.flatMap((c) => photosOf(c.id));
  const coverIdOf = (cid) => { const b = BOOK[cid]; return (b && b.photo && SL[b.photo]) ? b.photo : (photosOf(cid)[0] || null); };
  const img = (file, size) => `../images/web/${size ? size + '/' : ''}${file}`;
  const srcset = (s) => `${img(s.file, 640)} 640w, ${img(s.file, 1280)} 1280w, ${img(s.file)} ${s.w}w`;
  const coords = ([lat, lng]) => `${Math.abs(lat).toFixed(3)}°${lat >= 0 ? 'N' : 'S'} · ${Math.abs(lng).toFixed(3)}°${lng >= 0 ? 'E' : 'W'}`;
  const nameParts = (cid) => {
    const b = BOOK[cid], c = COUNTRY[cid];
    const place = b ? L(b.title) : L(c.name), country = L(c.name);
    return place === country ? [place] : [place, country];
  };
  const nameHTML = (cid) => nameParts(cid).map(esc).join(`<i>${lang === 'zh' ? '｜' : '|'}</i>`);
  const bookStatus = (b) => (b.band === 'bandNone' ? t('bandNone') : t(b.status));

  /* ------------------------------------------------------------ elements */

  const html = document.documentElement;
  const app = $('#app');
  const mapEl = $('#map');
  const inkCanvas = $('#ink');
  const lineCanvas = $('#line');
  const lctx = lineCanvas.getContext('2d');
  const pinsEl = $('#pins');
  const indexEl = $('#index');
  const indexBody = $('#index-body');
  const indexScroll = $('#index-scroll');
  const leaf = $('#leaf');
  const leafScroll = $('#leaf-scroll');
  const leafContent = $('#leaf-content');
  const coverEl = $('#cover');
  const coverImg = document.createElement('img');
  coverImg.className = 'cover__img';
  coverImg.alt = '';
  coverImg.decoding = 'async';
  const viewer = $('#viewer');
  const live = $('#live');

  /* ------------------------------------------------------------ the map: geometry */

  const state = {
    W: 1, H: 1, dpr: 1, S0: 1,
    z: d3.zoomIdentity,
    land110: null, land50: null, mesh110: null, mesh50: null,
    feats: {}, beenPath: null, landP110: null, landP50: null, meshP110: null, meshP50: null, beenP: {},
    dirty: true,
    cell: 5.2, cellMul: 1,
    reveal: null, // [cx, cy, r, feather] for the duotone photograph
    ring: null,   // { ll, s, a } the dive's ring
    hoverLL: null,
  };
  const LON0 = 45; // the sheet is centred on 45°E so that New York and Auckland both sit on it
  const proj0 = d3.geoEquirectangular().rotate([-LON0, 0]).precision(0.4);
  const BASE = 1000;
  const base = d3.geoEquirectangular().rotate([-LON0, 0]).scale(BASE).translate([0, 0]).precision(0.25);
  const toPath = (geo) => { const p = new Path2D(); d3.geoPath(base, p)(geo); return p; };
  const RAD = Math.PI / 180;
  const TOP = 84 * RAD, BOTTOM = -62 * RAD;

  function view() {
    const { z, W, H, S0 } = state;
    const s = S0 * z.k;
    return { s, f: s / BASE, tx: z.x + z.k * W / 2, ty: z.y + z.k * H / 2 };
  }
  // screen position of a [lat, lon]
  const P = (ll) => { const p = proj0([ll[1], ll[0]]); return [state.z.applyX(p[0]), state.z.applyY(p[1])]; };
  const invert = (x, y) => { const v = view(); return [(x - v.tx) / v.s / RAD + LON0, (v.ty - y) / v.s / RAD]; };

  /* ------------------------------------------------------------ the press, and the plate it prints from */

  const maskCanvas = document.createElement('canvas');
  const mctx = maskCanvas.getContext('2d', { willReadFrequently: false });
  const press = window.RisoPress ? window.RisoPress(inkCanvas) : null;
  const fctx = press ? null : inkCanvas.getContext('2d'); // no WebGL: a plainer print in 2D
  app.classList.toggle('no-press', !press);

  function sizeMap() {
    const W = Math.max(1, window.innerWidth), H = Math.max(1, window.innerHeight);
    state.W = W; state.H = H;
    state.dpr = Math.min(2, window.devicePixelRatio || 1);
    state.S0 = W / (2 * Math.PI);
    state.cell = narrow.matches ? 4.3 : 5.2;
    proj0.scale(state.S0).translate([W / 2, H / 2]);
    maskCanvas.width = W; maskCanvas.height = H;
    if (press) press.resize(W, H, state.dpr);
    else { inkCanvas.width = Math.round(W * state.dpr); inkCanvas.height = Math.round(H * state.dpr); }
    lineCanvas.width = Math.round(W * state.dpr); lineCanvas.height = Math.round(H * state.dpr);
    zoom.extent([[0, 0], [W, H]])
      .translateExtent([[0, H / 2 - state.S0 * TOP], [W, H / 2 - state.S0 * BOTTOM]])
      .scaleExtent([1, kMax()]);
    state.dirty = true;
  }
  // deep enough to fill the window with Singapore, on any screen
  const kMax = () => Math.max(40, 290 / (state.W / 360));
  const fine = () => view().s > 950 && state.landP50;

  function printMask() {
    const v = view();
    mctx.setTransform(1, 0, 0, 1, 0, 0);
    mctx.globalCompositeOperation = 'source-over';
    mctx.fillStyle = '#000';
    mctx.fillRect(0, 0, state.W, state.H);
    mctx.setTransform(v.f, 0, 0, v.f, v.tx, v.ty);
    const land = fine() ? state.landP50 : state.landP110;
    if (land) { mctx.fillStyle = '#f00'; mctx.fill(land); }
    mctx.globalCompositeOperation = 'lighter';
    if (state.beenPath) { mctx.fillStyle = '#0f0'; mctx.fill(state.beenPath); }
    const ac = activeCountry();
    if (ac && state.beenP[ac]) { mctx.fillStyle = '#00f'; mctx.fill(state.beenP[ac]); }
    mctx.globalCompositeOperation = 'source-over';
  }

  function photoFit() {
    const s = dive.coverSlide;
    if (!s) return [0, 0, 1, 1];
    const { W, H } = state;
    const a = s.w / s.h;
    let w = W, h = W / a;
    if (h < H) { h = H; w = H * a; }
    w *= 1.05; h *= 1.05;
    return [(W - w) / 2, (H - h) / 2, w, h];
  }

  function printInk() {
    const v = view();
    if (press) {
      press.mask(maskCanvas);
      press.draw({
        w: state.W, h: state.H, dpr: state.dpr,
        tx: v.tx, ty: v.ty, s: v.s, lon0: LON0 * RAD,
        ox: state.z.x, oy: state.z.y,
        cell: state.cell * state.cellMul, seaCell: narrow.matches ? 8 : 9.5,
        mis: MIS, paper: GL_INK.paper, ink1: GL_INK.ink1, ink2: GL_INK.ink2,
        fit: photoFit(), reveal: state.reveal,
      });
      return;
    }
    // the plainer print: a fixed dot screen for the land, coral flats, multiplied
    const c = fctx;
    c.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    c.globalCompositeOperation = 'source-over';
    c.fillStyle = INK.paper; c.fillRect(0, 0, state.W, state.H);
    if (!fallbackPat) {
      const tile = document.createElement('canvas');
      const n = Math.round(4.6 * state.dpr);
      tile.width = n; tile.height = n;
      const g = tile.getContext('2d');
      g.fillStyle = INK.teal; g.beginPath(); g.arc(n / 2, n / 2, 1.05 * state.dpr, 0, Math.PI * 2); g.fill();
      fallbackPat = c.createPattern(tile, 'repeat');
      fallbackPat.setTransform(new DOMMatrix().scaleSelf(1 / state.dpr, 1 / state.dpr));
    }
    c.save();
    c.setTransform(state.dpr * v.f, 0, 0, state.dpr * v.f, state.dpr * v.tx, state.dpr * v.ty);
    const land = fine() ? state.landP50 : state.landP110;
    if (land) {
      c.fillStyle = INK.tealA(0.08); c.fill(land);
      c.save(); c.setTransform(state.dpr, 0, 0, state.dpr, 0, 0); c.clip(transformed(land, v)); c.fillStyle = fallbackPat; c.fillRect(0, 0, state.W, state.H); c.restore();
    }
    c.restore();
    if (state.beenPath) {
      c.save();
      c.globalCompositeOperation = 'multiply';
      c.setTransform(state.dpr * v.f, 0, 0, state.dpr * v.f, state.dpr * (v.tx + MIS[0]), state.dpr * (v.ty + MIS[1]));
      c.fillStyle = INK.coralA(0.85); c.fill(state.beenPath);
      c.restore();
    }
  }
  let fallbackPat = null;
  function transformed(p, v) { const out = new Path2D(); out.addPath(p, new DOMMatrix([v.f, 0, 0, v.f, v.tx, v.ty])); return out; }

  /* the line plate: coastlines, borders, oceans, leaders, place marks and the pen-fine rings, in teal
     (the dive ring and the active outline in coral). It multiplies over the press like a third pass. */
  const SEAS = [{ id: 'pacific', ll: [6, 172] }, { id: 'indian', ll: [-22, 80] }, { id: 'atlantic', ll: [22, -42] }];
  function printLines() {
    const { W, H, dpr } = state;
    const v = view();
    const c = lctx;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, W, H);
    const land = fine() ? state.landP50 : state.landP110;
    const mesh = fine() ? state.meshP50 : state.meshP110;
    c.save();
    c.setTransform(dpr * v.f, 0, 0, dpr * v.f, dpr * v.tx, dpr * v.ty);
    c.lineJoin = 'round';
    if (mesh) {
      c.setLineDash([1.3 / v.f, 2.4 / v.f]);
      c.lineWidth = 0.6 / v.f; c.strokeStyle = INK.tealA(0.55); c.stroke(mesh);
      c.setLineDash([]);
    }
    if (land) {
      // the polar edge of Antarctica is where the sheet stops, not a coast: no rule is drawn along it
      c.save(); c.beginPath(); c.rect(-1e5, -1e5, 2e5, 1e5 + BASE * 84 * RAD); c.clip();
      c.lineWidth = Math.min(1.1, 0.62 + v.s / 4000) / v.f; c.strokeStyle = INK.tealA(0.95); c.stroke(land);
      c.restore();
    }
    const ac = activeCountry();
    if (ac && state.beenP[ac]) {
      c.translate(MIS[0] / v.f, MIS[1] / v.f);
      c.lineWidth = 1.4 / v.f; c.strokeStyle = INK.coral; c.stroke(state.beenP[ac]);
    }
    c.restore();

    // oceans, set in italic, quiet, fading as the map comes close
    const seaA = clamp((5 - state.z.k) / 2.5, 0, 1);
    if (seaA > 0 && !dive.on) {
      c.save();
      c.textAlign = 'center'; c.textBaseline = 'middle';
      const zh = lang === 'zh';
      const fs = narrow.matches ? 12 : 14;
      c.font = zh ? `400 ${fs - 1}px "Noto Sans TC", sans-serif` : `italic 400 ${fs}px "Alegreya Sans", sans-serif`;
      try { c.letterSpacing = zh ? '6px' : '1.5px'; } catch (e) { /* older engines */ }
      c.fillStyle = INK.tealA(0.82 * seaA);
      for (const s of SEAS) {
        const p = P(s.ll);
        if (p[0] < -100 || p[0] > W + 100) continue;
        c.fillText(WORDS.seas[lang][s.id], p[0], p[1]);
      }
      c.restore();
    }

    // where each photograph was made, once close enough to tell them apart
    state.photoPts = [];
    if (v.s > 1500 && !dive.on) {
      for (const id of indexOrder) {
        const p = P(SL[id].ll);
        if (p[0] < -10 || p[1] < -10 || p[0] > W + 10 || p[1] > H + 10) continue;
        state.photoPts.push({ id, p });
        c.beginPath(); c.arc(p[0], p[1], 3, 0, Math.PI * 2);
        c.lineWidth = 1; c.strokeStyle = INK.teal; c.stroke();
        c.beginPath(); c.arc(p[0] + MIS[0] * 0.6, p[1] + MIS[1] * 0.6, 1.5, 0, Math.PI * 2);
        c.fillStyle = INK.coral; c.fill();
      }
    }

    // leaders from where a book stands to its place, then the place itself: teal ring, coral dot
    layoutPins();
    if (!dive.on) {
      c.lineWidth = 0.8; c.strokeStyle = INK.tealA(0.8);
      for (const b of pinList) {
        if (Math.hypot(b.x - b.ax, b.y - b.ay) > 6) { c.beginPath(); c.moveTo(b.ax, b.ay); c.lineTo(b.x, b.y); c.stroke(); }
      }
    }
    for (const b of pinList) {
      if (dive.on && b.country !== dive.cid) continue;
      c.beginPath(); c.arc(b.ax, b.ay, 3.6, 0, Math.PI * 2);
      c.lineWidth = 1.3; c.strokeStyle = INK.teal; c.stroke();
      c.beginPath(); c.arc(b.ax + MIS[0], b.ay + MIS[1], 2, 0, Math.PI * 2);
      c.fillStyle = INK.coral; c.fill();
    }

    // the fine coral ring: hover from the index, or the dive tightening on its spot
    const ring = (ll, r, a, w) => {
      const p = P(ll);
      c.save(); c.globalAlpha = a;
      c.beginPath(); c.arc(p[0] + MIS[0], p[1] + MIS[1], r, 0, Math.PI * 2);
      c.lineWidth = w; c.strokeStyle = INK.coral; c.stroke();
      c.restore();
    };
    if (state.hoverLL && !dive.on) ring(state.hoverLL, 12, 1, 1.4);
    if (state.ring && state.ring.a > 0) ring(state.ring.ll, 15 * state.ring.s, state.ring.a, 1.3);
  }

  function render() {
    state.dirty = false;
    printMask();
    printInk();
    printLines();
  }

  /* ------------------------------------------------------------ one clock for everything that moves */

  const tasks = new Set();
  let raf = 0;
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }
  function frame(now) {
    raf = 0;
    for (const task of Array.from(tasks)) { if (task(now) === false) tasks.delete(task); }
    if (state.dirty && !leafCovers) render();
    if (tasks.size) kick();
  }
  const markDirty = () => { state.dirty = true; kick(); };
  // a timed task: fn(progress 0..1, elapsed) every frame for dur ms, then done()
  function tween(dur, fn, done) {
    const t0 = performance.now();
    let dead = false;
    const task = (now) => {
      if (dead) return false;
      const x = clamp((now - t0) / dur, 0, 1);
      fn(x, now - t0);
      state.dirty = true;
      if (x >= 1) { dead = true; if (done) done(); return false; }
      return true;
    };
    tasks.add(task); kick();
    return { cancel() { dead = true; tasks.delete(task); } };
  }
  let leafCovers = false; // while a page fully covers the map, the press rests

  /* ------------------------------------------------------------ zoom and pan */

  const zoom = d3.zoom()
    .filter((e) => !dive.on && (!e.ctrlKey || e.type === 'wheel') && !e.button)
    .on('start', (e) => { if (e.sourceEvent && e.sourceEvent.type !== 'wheel') mapEl.classList.add('is-dragging'); })
    .on('zoom', (e) => { state.z = e.transform; markDirty(); updateZoomButtons(); })
    .on('end', () => mapEl.classList.remove('is-dragging'));
  const sel = d3.select(mapEl);
  sel.call(zoom).on('dblclick.zoom', null);
  mapEl.addEventListener('dblclick', (e) => {
    if (e.target.closest('.book') || dive.on) return;
    sel.transition().duration(reduce.matches ? 0 : 450).ease(d3.easeExpOut).call(zoom.scaleBy, e.shiftKey ? 0.5 : 2, [e.clientX, e.clientY]);
  });
  const constrain = (target) => zoom.constrain()(target, [[0, 0], [state.W, state.H]], zoom.translateExtent());
  function moveTo(target, dur = 900) {
    const tr = constrain(target);
    const d = reduce.matches ? 0 : dur;
    if (d === 0) sel.interrupt().call(zoom.transform, tr);
    else sel.interrupt().transition().duration(d).ease(d3.easeExpOut).call(zoom.transform, tr);
    return tr;
  }
  function fitTransform(lls, pad) {
    const pts = lls.map((ll) => proj0([ll[1], ll[0]]));
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const { W, H } = state;
    const k = clamp(Math.min((W - pad.l - pad.r) / Math.max(1, x1 - x0), (H - pad.t - pad.b) / Math.max(1, y1 - y0)), 1, kMax());
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const sx = pad.l + (W - pad.l - pad.r) / 2, sy = pad.t + (H - pad.t - pad.b) / 2;
    return d3.zoomIdentity.translate(sx - cx * k, sy - cy * k).scale(k);
  }
  function homeTransform() {
    // a phone opens on the crowded half of the sheet, Dubai to New Zealand, where eleven of the places are
    const small = narrow.matches;
    const pad = small ? { l: 30, r: 30, t: 170, b: 190 } : { l: 70, r: 70, t: 170, b: 120 };
    const near = small ? order.filter((c) => c.continent === 'asia' || c.continent === 'oceania') : order;
    return fitTransform(near.map((c) => placeLL(c.id)), pad);
  }
  function inView(ll, margin = 0.12) {
    const p = P(ll);
    const right = indexOpen && !narrow.matches ? state.W - indexEl.offsetWidth : state.W;
    return p[0] > state.W * margin && p[0] < right - state.W * margin && p[1] > state.H * margin && p[1] < state.H * (1 - margin);
  }
  function centerOn(ll, k, dur) {
    const p = proj0([ll[1], ll[0]]);
    const kk = k || state.z.k;
    const cx = indexOpen && !narrow.matches ? (state.W - indexEl.offsetWidth) / 2 : state.W / 2;
    moveTo(d3.zoomIdentity.translate(cx - p[0] * kk, state.H / 2 - p[1] * kk).scale(kk), dur);
  }
  // the dive's landing: the part of the country around the place filling the window, the place at the centre
  function diveTransform(cid) {
    const ll = placeLL(cid);
    const f = state.feats[cid];
    let k = kMax() * 0.5;
    if (f) {
      let geom = f;
      if (f.geometry && f.geometry.type === 'MultiPolygon') {
        // only the landmass the place stands on (France without its overseas parts, Japan's Honshu)
        const polys = f.geometry.coordinates.map((c) => ({ type: 'Polygon', coordinates: c }));
        const pt = [ll[1], ll[0]];
        geom = polys.find((g) => d3.geoContains(g, pt)) ||
          polys.reduce((best, g) => (d3.geoDistance(d3.geoCentroid(g), pt) < d3.geoDistance(d3.geoCentroid(best), pt) ? g : best));
      }
      const b = d3.geoBounds(geom);
      const span = Math.min(b[1][0] - b[0][0], 50);
      const lls = [[b[0][1], ll[1] - span / 2], [b[1][1], ll[1] + span / 2]];
      k = fitTransform(lls, { l: 60, r: 60, t: 80, b: 80 }).k;
    }
    k = clamp(k * 0.92, 4, kMax());
    const p = proj0([ll[1], ll[0]]);
    return constrain(d3.zoomIdentity.translate(state.W / 2 - p[0] * k, state.H / 2 - p[1] * k).scale(k));
  }

  const zIn = $('#zoom-in'), zOut = $('#zoom-out'), zAll = $('#zoom-all');
  const zoomBy = (f) => sel.interrupt().transition().duration(reduce.matches ? 0 : 420).ease(d3.easeExpOut).call(zoom.scaleBy, f);
  zIn.addEventListener('click', () => zoomBy(2));
  zOut.addEventListener('click', () => zoomBy(0.5));
  zAll.addEventListener('click', () => moveTo(homeTransform()));
  function updateZoomButtons() {
    zIn.disabled = state.z.k >= kMax() - 0.01;
    zOut.disabled = state.z.k <= 1.001;
  }
  mapEl.addEventListener('keydown', (e) => {
    if (e.target !== mapEl || dive.on) return;
    const step = 90;
    const pan = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }[e.key];
    if (pan) {
      e.preventDefault();
      sel.interrupt().transition().duration(reduce.matches ? 0 : 260).ease(d3.easeExpOut).call(zoom.translateBy, pan[0] / state.z.k, pan[1] / state.z.k);
    } else if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomBy(2); }
    else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomBy(0.5); }
    else if (e.key === '0') { e.preventDefault(); moveTo(homeTransform()); }
  });

  /* ------------------------------------------------------------ the books, standing on the map */

  let pinList = [];
  function renderPins() {
    const keep = new Map(pinList.map((p) => [p.id, p]));
    pinsEl.textContent = '';
    pinList = order.map((c, i) => {
      const b = BOOK[c.id];
      const title = esc(L(b.title));
      const s = b.photo ? SL[b.photo] : null;
      const face = s
        ? `<span class="book__face"><img src="${img(s.file, 640)}" alt="" width="${s.w}" height="${s.h}" decoding="async">`
        : `<span class="book__face book__face--blank"><b>${title}</b>`;
      const el = document.createElement('div');
      el.className = 'pin';
      el.dataset.country = c.id;
      el.style.setProperty('--i', String(i));
      el.innerHTML =
        `<div class="pin__stage"><a class="book book--${b.tone}" href="#${b.view}" aria-label="${esc(`${L(b.title)}: ${bookStatus(b)}`)}"><span class="book__box">` +
        `<span class="book__spine"><b>${title}</b><i>${esc(t('series'))}</i></span>` +
        `${face}<span class="book__band"><b>${title}</b><span>${esc(t(b.band))}</span></span></span>` +
        `<span class="book__back"><i>${esc(t('series'))}</i></span><span class="book__edge"></span>` +
        `<span class="book__top"></span><span class="book__shadow"></span></span></a></div>` +
        `<div class="pin__label" aria-hidden="true"><b>${title}</b><span>${esc(bookStatus(b))}</span></div>`;
      pinsEl.appendChild(el);
      const prev = keep.get(b.id);
      return { id: b.id, country: c.id, book: b, el, ll: placeLL(c.id), x: prev ? prev.x : NaN, y: prev ? prev.y : NaN, ax: 0, ay: 0, lw: 0 };
    });
    measurePins();
    bindPins();
  }
  function measurePins() { for (const p of pinList) p.lw = p.el.querySelector('.pin__label').offsetWidth; }

  function bookScale() {
    const k = state.z.k;
    const small = narrow.matches;
    const base0 = small ? 0.13 : 0.23;
    const max = small ? 0.3 : 0.46;
    return Math.min(max, base0 * Math.pow(k / (small ? 1.3 : 1.35), 0.32));
  }
  function layoutPins() {
    const s = bookScale();
    const small = narrow.matches;
    const bw = 192 * s, bh = 272 * s;
    const below = small ? 4 : 22;
    for (const p of pinList) {
      const a = P(p.ll);
      p.ax = a[0]; p.ay = a[1];
      if (Number.isNaN(p.x)) { p.x = p.ax; p.y = p.ay; }
      p.hw = small ? bw / 2 + 2 : Math.max(bw / 2 + 3, p.lw / 2 + 3);
    }
    // every frame starts from the places themselves and pushes neighbours apart, so the
    // arrangement depends only on where the map stands, never on where it has been
    for (const p of pinList) { p.x = p.ax; p.y = p.ay; }
    for (let it = 0; it < 28; it++) {
      for (let i = 0; i < pinList.length; i++) {
        const a = pinList[i];
        for (let j = i + 1; j < pinList.length; j++) {
          const b = pinList[j];
          const ox = a.hw + b.hw - Math.abs(a.x - b.x);
          if (ox <= 0) continue;
          const oy = Math.min(a.y + below, b.y + below) - Math.max(a.y - bh - 4, b.y - bh - 4);
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
      const r = [p.x - p.lw / 2, p.y + 4, p.x + p.lw / 2, p.y + 22];
      let free = true;
      if (small) {
        for (const q of pinList) {
          if (q === p) continue;
          if (r[0] < q.x + bw / 2 && r[2] > q.x - bw / 2 && r[1] < q.y && r[3] > q.y - bh) { free = false; break; }
        }
        if (free) for (const t2 of taken) if (r[0] < t2[2] && r[2] > t2[0] && r[1] < t2[3] && r[3] > t2[1]) { free = false; break; }
        if (free) taken.push(r);
      }
      p.el.classList.toggle('is-quiet', !free);
      p.el.style.setProperty('--x', `${p.x.toFixed(1)}px`);
      p.el.style.setProperty('--y', `${p.y.toFixed(1)}px`);
      p.el.style.setProperty('--s', s.toFixed(3));
    }
  }
  function bindPins() {
    for (const p of pinList) {
      const a = p.el.querySelector('.book');
      a.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') setActive({ country: p.country }); });
      a.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') clearActiveSoon(); });
      a.addEventListener('focus', () => {
        if (dive.on) return;
        setActive({ country: p.country });
        if (!inView(p.ll, 0.08)) centerOn(p.ll, Math.max(state.z.k, homeTransform().k), 600);
      });
      a.addEventListener('blur', () => clearActiveSoon());
      a.addEventListener('click', (e) => { e.preventDefault(); go(p.book.view); });
    }
  }

  /* ------------------------------------------------------------ what is awake */

  let active = null; // { country } or { slide }
  let clearTimer = 0;
  const activeCountry = () => (active ? active.country || (active.slide && SL[active.slide].country) : null);
  function setActive(next) {
    if (dive.on) return;
    clearTimeout(clearTimer);
    if (active && next && active.country === next.country && active.slide === next.slide) return;
    active = next;
    const cid = activeCountry();
    pinList.forEach((p) => p.el.classList.toggle('awake', p.country === cid));
    state.hoverLL = next && next.slide ? SL[next.slide].ll : null;
    $$('.group.is-awake', indexBody).forEach((g) => { if (g.dataset.country !== cid) g.classList.remove('is-awake'); });
    const g = cid && indexBody.querySelector(`.group[data-country="${cid}"]`);
    if (g) g.classList.add('is-awake');
    markDirty();
  }
  function clearActive() {
    active = null;
    state.hoverLL = null;
    pinList.forEach((p) => p.el.classList.remove('awake'));
    $$('.group.is-awake', indexBody).forEach((g) => g.classList.remove('is-awake'));
    markDirty();
  }
  function clearActiveSoon() { clearTimeout(clearTimer); clearTimer = setTimeout(clearActive, 160); }

  // pointing at the map itself: a photograph's spot, a place, or one of his countries
  function hitTest(x, y) {
    if (state.photoPts) {
      let best = null, bd = 10;
      for (const q of state.photoPts) { const d = Math.hypot(q.p[0] - x, q.p[1] - y); if (d < bd) { bd = d; best = q.id; } }
      if (best) return { slide: best };
    }
    for (const p of pinList) if (Math.hypot(p.ax - x, p.ay - y) < 14) return { country: p.country };
    const ll = invert(x, y);
    for (const c of S.countries) { const f = state.feats[c.id]; if (f && d3.geoContains(f, ll)) return { country: c.id }; }
    return null;
  }
  let hoverQueued = false, lastMove = null;
  mapEl.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || e.buttons || dive.on) return;
    lastMove = e;
    if (hoverQueued) return;
    hoverQueued = true;
    requestAnimationFrame(() => {
      hoverQueued = false;
      const ev = lastMove;
      if (ev.target.closest && ev.target.closest('.book')) return;
      const hit = hitTest(ev.clientX, ev.clientY);
      mapEl.classList.toggle('is-pointing', !!hit);
      if (hit) setActive(hit);
      else if (active) clearActiveSoon();
    });
  });
  mapEl.addEventListener('pointerleave', () => { mapEl.classList.remove('is-pointing'); clearActiveSoon(); });
  mapEl.addEventListener('click', (e) => {
    if (e.target.closest('.book') || e.defaultPrevented || dive.on) return;
    const hit = hitTest(e.clientX, e.clientY);
    if (!hit) return;
    if (hit.slide) { const s = SL[hit.slide]; go(BOOK[s.country].view, { cover: hit.slide }); }
    else go(BOOK[hit.country].view);
  });

  /* ------------------------------------------------------------ the index of photographs, a drawer */

  let indexOpen = false;
  const indexToggle = $('#index-toggle');
  function renderIndex() {
    $('#index-count').textContent = t('count', indexOrder.length, S.countries.length);
    $('#index-n').textContent = String(indexOrder.length);
    indexBody.innerHTML = order.map((c) => {
      const b = BOOK[c.id];
      const ids = photosOf(c.id);
      const thumbs = ids.map((id) => {
        const s = SL[id];
        return `<li><button type="button" class="thumb" data-slide="${id}" aria-label="${esc(t('diveTo', L(s.place)))}">` +
          `<img src="${img(s.file, 640)}" alt="" loading="lazy" decoding="async" width="${s.w}" height="${s.h}">` +
          `<span class="thumb__name">${esc(L(s.place))}</span></button></li>`;
      }).join('');
      return `<section class="group" data-country="${c.id}" aria-labelledby="g-${c.id}">` +
        `<h3><button type="button" class="group__name" id="g-${c.id}" data-view="${b.view}">${nameHTML(c.id)}</button>` +
        `<span class="group__meta">${esc(L(c.date))}</span></h3>` +
        (thumbs ? `<ul class="thumbs">${thumbs}</ul>` : `<p class="group__none">${esc(t('bandNone'))}</p>`) +
        `</section>`;
    }).join('');
  }
  function setIndex(open, focus) {
    indexOpen = open;
    indexToggle.setAttribute('aria-expanded', String(open));
    app.classList.toggle('has-index', open);
    if (open) {
      indexEl.hidden = false;
      requestAnimationFrame(() => indexEl.classList.add('is-open'));
      if (focus) setTimeout(() => $('#index-close').focus({ preventScroll: true }), 30);
    } else {
      indexEl.classList.remove('is-open');
      setTimeout(() => { if (!indexOpen) indexEl.hidden = true; }, reduce.matches ? 0 : 420);
      if (focus) indexToggle.focus({ preventScroll: true });
    }
  }
  indexToggle.addEventListener('click', () => setIndex(!indexOpen, true));
  $('#index-close').addEventListener('click', () => setIndex(false, true));
  let easeTimer = 0;
  function markFromIndex(id) {
    setActive({ slide: id });
    clearTimeout(easeTimer);
    easeTimer = setTimeout(() => {
      const ll = SL[id].ll;
      if (!inView(ll, 0.12)) centerOn(ll, Math.max(state.z.k, homeTransform().k), 900);
    }, 380);
  }
  indexBody.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    const th = e.target.closest('.thumb');
    const gn = e.target.closest('.group__name');
    if (th) markFromIndex(th.dataset.slide);
    else if (gn) setActive({ country: gn.closest('.group').dataset.country });
  });
  indexBody.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') clearActiveSoon(); });
  indexBody.addEventListener('focusin', (e) => {
    const th = e.target.closest('.thumb');
    const gn = e.target.closest('.group__name');
    if (th) markFromIndex(th.dataset.slide);
    else if (gn) setActive({ country: gn.closest('.group').dataset.country });
  });
  indexBody.addEventListener('click', (e) => {
    if (dive.on) return;
    const th = e.target.closest('.thumb');
    const gn = e.target.closest('.group__name');
    if (th) { const s = SL[th.dataset.slide]; if (narrow.matches) setIndex(false); go(BOOK[s.country].view, { cover: th.dataset.slide }); }
    else if (gn) { if (narrow.matches) setIndex(false); go(gn.dataset.view); }
  });

  /* ------------------------------------------------------------ the leaf: the page under the cover */

  let page = null;
  let tocIO = null;
  const viewCountry = (v) => (v.startsWith('guide-') ? (S.guides[v.slice(6)] ? S.guides[v.slice(6)].country : null) : v.slice(6));
  const validView = (v) => !!v && ((v.startsWith('guide-') && !!S.guides[v.slice(6)]) || (v.startsWith('place-') && !!COUNTRY[v.slice(6)]));

  function renderLeaf(view, coverId) {
    const cid = viewCountry(view);
    const c = COUNTRY[cid];
    const s = coverId ? SL[coverId] : null;
    coverEl.classList.toggle('cover--none', !s);
    if (s) {
      if (!coverImg.isConnected) $('#cover-pic').appendChild(coverImg);
      if (coverImg.dataset.id !== coverId) {
        coverImg.removeAttribute('src');
        coverImg.width = s.w; coverImg.height = s.h;
        coverImg.sizes = '100vw';
        coverImg.srcset = srcset(s);
        coverImg.src = img(s.file, 1280);
        coverImg.dataset.id = coverId;
      }
      coverImg.alt = L(s.alt);
    } else if (coverImg.isConnected) {
      coverImg.remove(); coverImg.dataset.id = '';
    }
    $('#cover-note').textContent = L(c.note);
    $('#cover-name').innerHTML = nameHTML(cid);
    $('#cover-ll').textContent = coords(placeLL(cid));
    $('#cover-on').textContent = view.startsWith('guide-') ? t('bookOpen') : (photosOf(cid).length ? t('seePhotos') : '');
    $('#cover-on').hidden = !s;
    if (tocIO) { tocIO.disconnect(); tocIO = null; }
    if (view.startsWith('guide-')) renderGuide(cid); else renderPlace(cid);
  }
  $('#cover-on').addEventListener('click', () => {
    leafContent.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' });
    const h = $('#leaf-title');
    if (h) h.focus({ preventScroll: true });
  });

  const pageEnd = () => `<footer class="page-end"><button class="word page-end__back" type="button" data-back>${esc(t('back'))}</button>` +
    `<a class="page-end__ig" href="${esc(S.instagram.url)}" target="_blank" rel="noopener">${esc(t('follow'))} <b>${esc(S.instagram.handle)}</b></a></footer>`;

  function rowsOf(ids) {
    const target = narrow.matches ? 1 : 2.7;
    const rows = [];
    let row = [], sum = 0;
    for (const id of ids) {
      const ar = SL[id].w / SL[id].h;
      row.push([id, ar]); sum += ar;
      if (sum >= target * 0.88) { rows.push({ row, sum }); row = []; sum = 0; }
    }
    if (row.length) rows.push({ row, sum, last: true });
    return rows;
  }
  function renderPlace(cid) {
    const c = COUNTRY[cid];
    const ids = photosOf(cid);
    let body;
    if (ids.length) {
      body = `<div class="rows">${rowsOf(ids).map((r) => `<div class="row">${r.row.map(([id, ar]) => {
        const s = SL[id];
        return `<figure class="piece" data-ar="${ar.toFixed(4)}"><button type="button" data-slide="${id}" aria-label="${esc(t('made', L(s.place)))}">` +
          `<img src="${img(s.file, 1280)}" srcset="${srcset(s)}" sizes="(max-width: 48rem) 94vw, 40vw" width="${s.w}" height="${s.h}" alt="${esc(L(s.alt))}" loading="lazy" decoding="async"></button>` +
          `<figcaption><b>${esc(L(s.place))}</b><span>${esc(L(s.where))}</span></figcaption></figure>`;
      }).join('')}${r.last && r.sum < 2.2 && !narrow.matches ? `<span class="piece piece--rest" aria-hidden="true" data-ar="${(2.7 - r.sum).toFixed(4)}"></span>` : ''}</div>`).join('')}</div>`;
    } else {
      body = `<div class="no-photos"><b>${esc(t('bandNone'))}</b></div>`;
    }
    leafContent.className = 'leaf__content place';
    leafContent.innerHTML = `<div class="wrap"><header class="place-top">` +
      `<h1 class="page-title" id="leaf-title" tabindex="-1">${esc(L(BOOK[cid].title))}</h1>` +
      `<p class="meta">${esc(L(c.date))}${ids.length ? ' · ' + esc(t('nPhotos', ids.length)) : ''}</p>` +
      `<p class="page-lede">${esc(L(c.note))}</p>` +
      `<p class="quiet-line">${esc(t('bookNot'))}</p></header>${body}${pageEnd()}</div>`;
    $$('[data-ar]', leafContent).forEach((n) => n.style.setProperty('--ar', n.dataset.ar));
  }

  function renderGuide(cid) {
    const g = S.guides[BOOK[cid].guide];
    const dict = g.i18n[lang] || g.i18n.en;
    const slideText = (key) => {
      const m = key.match(/^(sp|sa|sl)_(.+)$/);
      if (!m || !SL[m[2]]) return null;
      const s = SL[m[2]];
      if (m[1] === 'sp') return L(s.place);
      if (m[1] === 'sa') return L(s.alt);
      return t('made', L(s.place));
    };
    const get = (k) => (dict[k] != null ? dict[k] : (slideText(k) != null ? slideText(k) : (g.i18n.en[k] != null ? g.i18n.en[k] : null)));
    leafContent.className = 'leaf__content guide';
    leafContent.innerHTML = g.html;
    $$('[data-i18n]', leafContent).forEach((n) => { const v = get(n.dataset.i18n); if (v != null) n.textContent = v; });
    $$('[data-i18n-html]', leafContent).forEach((n) => { const v = get(n.dataset.i18nHtml); if (v != null) n.innerHTML = v; });
    $$('[data-i18n-alt]', leafContent).forEach((n) => { const v = get(n.dataset.i18nAlt); if (v != null) n.alt = v; });
    $$('[data-i18n-aria]', leafContent).forEach((n) => { const v = get(n.dataset.i18nAria); if (v != null) n.setAttribute('aria-label', v); });
    const walker = document.createTreeWalker(leafContent, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) if (/[–—]/.test(n.nodeValue)) n.nodeValue = clean(n.nodeValue);
    const h1 = $('h1', leafContent);
    if (h1) { h1.id = 'leaf-title'; h1.tabIndex = -1; }
    const meta = $('.guide-top .meta', leafContent);
    if (meta) meta.insertAdjacentHTML('afterend', `<p class="guide-facts">${esc(L(g.facts))}</p>`);
    const wrap = $('.wrap', leafContent);
    if (wrap) wrap.insertAdjacentHTML('beforeend', pageEnd());
    // the contents: the section being read is marked with a coral flat
    const links = $$('.toc a', leafContent);
    const heads = links.map((a) => leafContent.querySelector(a.getAttribute('href'))).filter(Boolean);
    if ('IntersectionObserver' in window && heads.length) {
      tocIO = new IntersectionObserver(() => {
        let top = null;
        for (const h of heads) if (h.getBoundingClientRect().top < window.innerHeight * 0.4) top = h;
        links.forEach((a) => a.setAttribute('aria-current', String(!!top && a.getAttribute('href') === `#${top.id}`)));
      }, { root: leafScroll, threshold: [0, 1], rootMargin: '0px 0px -55% 0px' });
      heads.forEach((h) => tocIO.observe(h));
    }
  }

  leafContent.addEventListener('click', (e) => {
    const a = e.target.closest('a, button');
    if (!a) return;
    if (a.dataset.back !== undefined) { back(); return; }
    if (a.dataset.slide) {
      e.preventDefault();
      const list = $$('[data-slide]', leafContent).map((x) => x.dataset.slide).filter((v, i, arr) => arr.indexOf(v) === i);
      openViewer(list, list.indexOf(a.dataset.slide), a);
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

  /* ------------------------------------------------------------ the dive */

  const dive = { on: false, cid: null, coverId: null, coverSlide: null, texFor: null, gen: 0, before: null, timers: [], anims: [] };
  const photoCache = new Map();
  function photoTexture(id) {
    if (!press || !id) return Promise.resolve(false);
    let p = photoCache.get(id);
    if (!p) {
      p = new Promise((res) => {
        const im = new Image();
        im.decoding = 'async';
        im.onload = () => res(im);
        im.onerror = () => res(null);
        im.src = img(SL[id].file, 1280);
      });
      photoCache.set(id, p);
    }
    return p.then((im) => { if (im && dive.coverId === id) { press.photo(im); dive.texFor = id; return true; } return false; });
  }
  const reach = (x, y) => Math.hypot(Math.max(x, state.W - x), Math.max(y, state.H - y));
  const feather = (r) => Math.max(r * 0.5, 150);
  function leafMask(x, y, r) {
    const f = feather(r);
    leaf.style.setProperty('--mx', `${x.toFixed(1)}px`);
    leaf.style.setProperty('--my', `${y.toFixed(1)}px`);
    leaf.style.setProperty('--r0', `${Math.max(0, r - f).toFixed(1)}px`);
    leaf.style.setProperty('--r1', `${Math.max(0.1, r).toFixed(1)}px`);
  }
  function cancelDive() {
    dive.anims.forEach((a) => a.cancel()); dive.anims = [];
    dive.timers.forEach(clearTimeout); dive.timers = [];
  }
  const later = (fn, ms) => { dive.timers.push(setTimeout(fn, ms)); };

  function openPage(view, opts = {}) {
    dive.gen += 1;
    const gen = dive.gen;
    cancelDive();
    const cid = viewCountry(view);
    const coverId = opts.cover && SL[opts.cover] && SL[opts.cover].country === cid ? opts.cover : coverIdOf(cid);
    const ll = placeLL(cid);
    page = view;
    dive.cid = cid;
    dive.coverId = coverId;
    dive.coverSlide = coverId ? SL[coverId] : null;
    renderLeaf(view, coverId);
    leafScroll.scrollTop = 0;
    app.inert = true;
    clearActive();
    if (indexOpen && narrow.matches) setIndex(false);
    live.textContent = t('opening', L(BOOK[cid].title));
    if (!dive.on) dive.before = state.z;
    dive.on = true;
    app.classList.add('is-diving');
    pinList.forEach((p) => p.el.classList.toggle('is-chosen', p.country === cid));
    if (flightsGlobe) flightsGlobe.stop();
    const landing = diveTransform(cid);
    const texReady = photoTexture(coverId);

    if (!opts.animate || reduce.matches) {
      // no flight: the map stands at the landing, the page simply fades in
      moveTo(landing, 0);
      leaf.hidden = false;
      leaf.classList.add('is-fading');
      leaf.classList.remove('is-masked', 'is-arriving');
      leafCovers = true;
      later(() => leaf.classList.remove('is-fading'), 400);
      requestAnimationFrame(() => $('#leaf-back').focus({ preventScroll: true }));
      return;
    }

    // 1. the map magnifies into the country; the coral ring tightens on the spot; the screen grows
    moveTo(landing, 2000);
    state.ring = { ll, s: 6, a: 0 };
    const [sx, sy] = (() => { const p = proj0([ll[1], ll[0]]); return [landing.applyX(p[0]), landing.applyY(p[1])]; })();
    const R = reach(sx, sy);
    const big = 2.5, small = 0.55;
    let photoAt = null;
    texReady.then((ok) => { if (gen === dive.gen && ok) photoAt = performance.now(); });
    const t0 = performance.now();
    leaf.hidden = false;
    leaf.classList.add('is-masked', 'is-arriving');
    leafMask(sx, sy, 0);
    coverEl.style.setProperty('--blur', '12px');
    coverEl.style.setProperty('--sc', '1.05');
    let domStart = null;
    const hasCover = !!dive.coverSlide;
    const task = (now) => {
      if (gen !== dive.gen) return false;
      const el = now - t0;
      const zp = expOut(clamp(el / 2000, 0, 1));
      state.ring.s = 6 - 5 * zp;
      state.ring.a = clamp(el / 250, 0, 1) * (1 - clamp((el - 2300) / 500, 0, 1));
      // the halftone screen enlarges as the map magnifies ...
      let cellMul = 1 + (big - 1) * zp;
      // ... prints the photograph in two inks through a feathered opening, then resolves
      const p0 = photoAt ? Math.max(950, photoAt - t0) : null;
      if (p0 != null && el >= p0) {
        const u = sine((el - p0) / 1300);
        const r = u * (R + feather(R) + 40) * 1.02;
        state.reveal = [sx, sy, r, feather(r)];
        cellMul = lerp(cellMul, small, inOut((el - p0 - 450) / 1100));
      } else {
        state.reveal = null;
      }
      state.cellMul = cellMul;
      // the full-colour photograph dissolves in over its duotone, from a soft blur
      const ds = hasCover ? (p0 != null ? p0 + 750 : (el > 2600 ? 1700 : null)) : 1250;
      if (ds != null && el >= ds) {
        if (domStart == null) domStart = el;
        const u = sine((el - ds) / (hasCover ? 1500 : 1100));
        const r = u * (R + feather(R) + 60);
        leafMask(sx, sy, r);
        coverEl.style.setProperty('--blur', `${(12 * (1 - u)).toFixed(2)}px`);
        coverEl.style.setProperty('--sc', (1.05 - 0.05 * u).toFixed(4));
        if (u >= 1) { arrived(gen); return false; }
      }
      state.dirty = true;
      return true;
    };
    tasks.add(task); kick();
    dive.anims.push({ cancel() { tasks.delete(task); } });
    // the other books step back at once, the chosen one as the photograph comes
    later(() => app.classList.add('is-deep'), 900);
  }
  function arrived(gen) {
    if (gen !== dive.gen) return;
    leaf.classList.remove('is-masked', 'is-arriving');
    coverEl.style.setProperty('--blur', '0px');
    coverEl.style.setProperty('--sc', '1');
    leafCovers = true;
    state.ring = null;
    $('#leaf-back').focus({ preventScroll: true });
  }

  function closePage(opts = {}) {
    if (!page) return;
    dive.gen += 1;
    const gen = dive.gen;
    cancelDive();
    const cid = dive.cid;
    const ll = placeLL(cid);
    page = null;
    if (tocIO) { tocIO.disconnect(); tocIO = null; }
    const backTo = dive.before || homeTransform();
    const pin = pinList.find((p) => p.country === cid);
    const surface = (animate) => {
      dive.on = false;
      dive.before = null;
      state.reveal = null; state.cellMul = 1;
      moveTo(backTo, animate ? 1600 : 0);
      app.classList.remove('is-deep');
      const done = () => { app.classList.remove('is-diving'); pinList.forEach((p) => p.el.classList.remove('is-chosen')); };
      if (animate) later(done, 350); else done();
      if (flightsGlobe && !app.classList.contains('is-opening')) flightsGlobe.start(true);
      if (pin && opts.focus !== false) pin.el.querySelector('.book').focus({ preventScroll: true });
      markDirty();
    };
    const hide = () => {
      leaf.hidden = true;
      leaf.classList.remove('is-masked', 'is-arriving', 'is-leaving', 'is-fading');
      leafContent.textContent = '';
      app.inert = false;
    };
    leafCovers = false;
    if (!opts.animate || reduce.matches) {
      hide(); surface(false); state.ring = null;
      return;
    }
    // the photograph withdraws into the spot, through its duotone, back into the printed map
    const [sx, sy] = P(ll);
    const R = reach(sx, sy);
    const hasTex = !!(press && dive.coverId && dive.texFor === dive.coverId);
    leaf.classList.add('is-masked', 'is-leaving');
    leafMask(sx, sy, R + feather(R) + 60);
    state.cellMul = 0.55;
    state.reveal = hasTex ? [sx, sy, R * 2 + 400, feather(R * 2 + 400)] : null;
    state.ring = { ll, s: 1, a: 0 };
    markDirty();
    const t0 = performance.now();
    let surfaced = false;
    const task = (now) => {
      if (gen !== dive.gen) return false;
      const el = now - t0;
      const u = sine(el / 950);
      leafMask(sx, sy, (1 - u) * (R + feather(R) + 60));
      coverEl.style.setProperty('--blur', `${(10 * u).toFixed(2)}px`);
      coverEl.style.setProperty('--sc', (1 + 0.05 * u).toFixed(4));
      if (u >= 1 && !leaf.hidden) hide();
      if (hasTex) {
        const v = sine((el - 350) / 1000);
        const r = (1 - v) * (R + feather(R) + 40);
        state.reveal = v >= 1 ? null : [sx, sy, r, feather(r)];
        state.cellMul = lerp(0.55, 2.5, inOut((el - 200) / 800));
      }
      if (el > 1050 && !surfaced) {
        surfaced = true;
        surface(true);
        state.cellMul = 2.5;
      }
      if (surfaced) {
        const w = clamp((el - 1050) / 1600, 0, 1);
        state.cellMul = lerp(2.5, 1, expOut(w));
        state.ring.s = 1 + 5 * expOut(w);
        state.ring.a = clamp((el - 1050) / 200, 0, 1) * (1 - w);
        if (w >= 1) { state.ring = null; state.cellMul = 1; state.dirty = true; return false; }
      }
      state.dirty = true;
      return true;
    };
    tasks.add(task); kick();
    dive.anims.push({ cancel() { tasks.delete(task); state.ring = null; state.cellMul = 1; state.reveal = null; } });
  }

  /* ------------------------------------------------------------ a photograph, larger, with how it was made */

  let vw = null;
  function slideFacts(s) {
    const set = [s.focal, s.aperture, s.shutter, s.iso && `ISO ${s.iso}`].filter(Boolean);
    let h = '';
    if (s.camera) h += `<dt>${esc(t('camera'))}</dt><dd>${esc(s.camera)}</dd>`;
    if (s.lens) h += `<dt>${esc(t('lens'))}</dt><dd>${esc(s.lens)}</dd>`;
    if (set.length) h += `<dt>${esc(t('settings'))}</dt><dd class="facts__set">${set.map((v) => `<span>${esc(v)}</span>`).join('')}</dd>`;
    if (s.best) h += `<dt>${esc(t('best'))}</dt><dd>${esc(L(s.best))}</dd>`;
    return h ? `<dl class="facts">${h}</dl>` : '';
  }
  function openViewer(ids, i, opener) {
    vw = { ids, i: clamp(i, 0, ids.length - 1), opener };
    viewer.hidden = false;
    leaf.inert = true;
    paintViewer();
    $('#viewer-close').focus({ preventScroll: true });
  }
  function paintViewer() {
    if (!vw) return;
    const s = SL[vw.ids[vw.i]];
    const im = new Image();
    im.width = s.w; im.height = s.h;
    im.sizes = '(max-width: 48rem) 100vw, 72vw';
    im.srcset = srcset(s);
    im.src = img(s.file, 1280);
    im.alt = L(s.alt);
    $('#viewer-frame').replaceChildren(im);
    $('#viewer-cap').innerHTML = `<h2 id="viewer-title">${esc(L(s.place))}</h2><p class="meta">${esc(L(s.where))}</p>` +
      `<p class="viewer__ll">${esc(coords(s.ll))}</p>${s.note ? `<p class="viewer__note">${esc(L(s.note))}</p>` : ''}${slideFacts(s)}`;
    $('#viewer-count').textContent = vw.ids.length > 1 ? t('countOf', vw.i + 1, vw.ids.length) : '';
    $('#viewer-prev').disabled = vw.i <= 0;
    $('#viewer-next').disabled = vw.i >= vw.ids.length - 1;
    $('#viewer-prev').hidden = $('#viewer-next').hidden = vw.ids.length < 2;
  }
  function closeViewer() {
    if (!vw) return;
    const o = vw.opener;
    vw = null;
    viewer.hidden = true;
    leaf.inert = false;
    if (o && o.isConnected) o.focus({ preventScroll: true });
  }
  const stepViewer = (d) => { if (!vw) return; const n = clamp(vw.i + d, 0, vw.ids.length - 1); if (n !== vw.i) { vw.i = n; paintViewer(); } };
  $('#viewer-prev').addEventListener('click', () => stepViewer(-1));
  $('#viewer-next').addEventListener('click', () => stepViewer(1));
  $('#viewer-close').addEventListener('click', closeViewer);
  viewer.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); stepViewer(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); stepViewer(-1); }
    if (e.key === 'Tab') trap(e, viewer);
  });
  leaf.addEventListener('keydown', (e) => { if (e.key === 'Tab' && !vw) trap(e, leaf); });
  function trap(e, root) {
    const f = $$('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])', root).filter((n) => !n.hidden && n.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  let swipe = null;
  viewer.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') swipe = { x: e.clientX, y: e.clientY }; });
  viewer.addEventListener('pointerup', (e) => {
    if (!swipe) return;
    const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
    swipe = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) stepViewer(dx < 0 ? 1 : -1);
  });

  /* ------------------------------------------------------------ history: every page has an address */

  function parse(hash) {
    const h = decodeURIComponent((hash || '').replace(/^#/, ''));
    return validView(h) ? h : null;
  }
  function apply(want, animate, cover) {
    if (vw) closeViewer();
    if (want === page) return;
    if (page) closePage({ animate: animate && !want, focus: !want });
    if (want) openPage(want, { animate, cover });
  }
  function go(view, opts = {}) {
    if (page === view || dive.on) return;
    if (app.classList.contains('is-opening')) skipOpening();
    try { history.pushState({ riso: true, page: view, cover: opts.cover || null }, '', `#${view}`); } catch (e) { /* fine */ }
    apply(view, true, opts.cover);
  }
  function back() {
    if (history.state && history.state.riso) history.back();
    else {
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* fine */ }
      apply(null, true);
    }
  }
  window.addEventListener('popstate', () => {
    const st = history.state;
    apply(parse(location.hash), true, st && st.cover);
  });
  $('#leaf-back').addEventListener('click', () => back());
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (vw) { e.preventDefault(); closeViewer(); return; }
    if (page) { e.preventDefault(); back(); return; }
    if (indexOpen) { e.preventDefault(); setIndex(false, true); }
  });

  /* ------------------------------------------------------------ language */

  function applyWords() {
    html.lang = lang === 'zh' ? 'zh-Hant' : 'en';
    $$('[data-t]').forEach((el) => { const v = t(el.dataset.t); if (typeof v === 'string') el.textContent = v; });
    $$('[data-t-aria]').forEach((el) => { const v = t(el.dataset.tAria); if (typeof v === 'string') el.setAttribute('aria-label', v); });
    $$('.lang__btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    $('#ig').setAttribute('aria-label', `${t('follow')}: tuan_1127`);
  }
  function setLang(next) {
    if (next === lang) return;
    lang = next;
    try { localStorage.setItem('tlap-lang', lang); } catch (e) { /* fine */ }
    applyWords();
    clearActive();
    renderPins();
    renderIndex();
    if (page) {
      const top = leafScroll.scrollTop;
      renderLeaf(page, dive.coverId);
      leafScroll.scrollTop = top;
    }
    if (vw) paintViewer();
    if (document.fonts) document.fonts.ready.then(() => { measurePins(); markDirty(); });
    markDirty();
  }
  document.addEventListener('click', (e) => { const b = e.target.closest('.lang__btn'); if (b) setLang(b.dataset.lang); });

  /* ------------------------------------------------------------ the flights, and the opening */

  let flightsGlobe = null;
  let opening = null;
  function skipOpening() { if (opening) opening.skip(); }
  const TAIPEI = [121.56, 25.03]; // where he flies out from; never marked or named on the page
  function flightsData() {
    const tos = order.filter((c) => c.id !== 'taiwan').map((c) => { const ll = placeLL(c.id); return [ll[1], ll[0]]; });
    const been = { type: 'FeatureCollection', features: Object.values(state.feats50 || state.feats) };
    return { land: state.land110, been, from: TAIPEI, tos, ink: INK };
  }
  $('#flights').addEventListener('click', () => { if (flightsGlobe) flightsGlobe.replay(); });

  /* ------------------------------------------------------------ start */

  // the shared files are fetched with a couple of retries, so a busy moment never leaves the map blank
  async function getJSON(url, tries = 4) {
    for (let i = 0; ; i++) {
      try {
        const r = await fetch(url);
        if (!r.ok) throw new Error(r.status);
        return await r.json();
      } catch (e) {
        if (i >= tries - 1) throw e;
        await new Promise((res) => setTimeout(res, 300 * (i + 1)));
      }
    }
  }
  async function loadWorld() {
    const w110 = await getJSON('../vendor/countries-110m.json');
    state.land110 = topojson.feature(w110, w110.objects.land);
    state.landP110 = toPath(state.land110);
    state.meshP110 = toPath(topojson.mesh(w110, w110.objects.countries, (a, b) => a !== b));
    state.feats = featsFor(w110);
    setBeen(state.feats);
    markDirty();
    // the finer coastline, and every one of his countries (Hong Kong and Singapore too), a moment later
    getJSON('../vendor/countries-50m.json').then((w50) => {
      state.landP50 = toPath(topojson.feature(w50, w50.objects.land));
      state.meshP50 = toPath(topojson.mesh(w50, w50.objects.countries, (a, b) => a !== b));
      state.feats50 = featsFor(w50);
      state.feats = { ...state.feats, ...state.feats50 };
      setBeen(state.feats50);
      markDirty();
    }).catch(() => { /* the coarser map stays */ });
  }
  function featsFor(w) {
    const geoms = w.objects.countries.geometries;
    const out = {};
    for (const [cid, iso] of Object.entries(ISO)) {
      const g = geoms.find((x) => String(x.id).padStart(3, '0') === iso);
      if (g) out[cid] = topojson.feature(w, g);
    }
    return out;
  }
  function setBeen(feats) {
    const all = new Path2D();
    for (const [cid, f] of Object.entries(feats)) { const p = toPath(f); state.beenP[cid] = p; all.addPath(p); }
    state.beenPath = all;
  }
  function loadRelief() {
    if (!press) return;
    const im = new Image();
    im.decoding = 'async';
    im.onload = () => { press.relief(im); markDirty(); };
    im.src = '../vendor/relief/SR_50M-4096.jpg';
  }

  async function start() {
    applyWords();
    renderIndex();
    sizeMap();
    renderPins();
    moveTo(homeTransform(), 0);
    updateZoomButtons();
    const want = parse(location.hash);
    let seen = false;
    try { seen = sessionStorage.getItem('riso-opened') === '1'; } catch (e) { /* fine */ }
    const playOpening = !want && !seen && !reduce.matches;
    if (playOpening) app.classList.add('is-opening');
    try { await loadWorld(); } catch (e) { /* the map still shows its places and books */ }
    loadRelief();
    app.classList.remove('is-loading');
    render();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measurePins(); markDirty(); });

    const fd = flightsData();
    flightsGlobe = state.land110 ? window.Flights.Globe({ canvas: $('#globe'), ...fd, reduce }) : null;
    if (playOpening && state.land110) {
      try { sessionStorage.setItem('riso-opened', '1'); } catch (e) { /* fine */ }
      const finalView = () => { const v = view(); return { scale: v.s, translate: [v.tx, v.ty], rotate: [-LON0, 0] }; };
      opening = window.Flights.Opening({
        canvas: $('#opening'), ...fd, finalView,
        onFlat: () => { app.classList.remove('is-opening'); app.classList.add('is-arriving'); if (flightsGlobe) flightsGlobe.start(true); markDirty(); },
        onDone: () => { opening = null; app.classList.remove('is-arriving'); },
      });
      const skip = () => { skipOpening(); off(); };
      const off = () => ['pointerdown', 'keydown', 'wheel'].forEach((ev) => window.removeEventListener(ev, skip, true));
      ['pointerdown', 'keydown', 'wheel'].forEach((ev) => window.addEventListener(ev, skip, { capture: true, passive: true }));
    } else {
      app.classList.remove('is-opening');
      if (flightsGlobe && !want) flightsGlobe.start(false);
    }
    if (want) {
      try { history.replaceState({ riso: false, page: want }, '', location.href); } catch (e) { /* fine */ }
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
        sel.call(zoom.transform, constrain(d3.zoomIdentity.translate(state.W / 2 - p[0] * k, state.H / 2 - p[1] * k).scale(k)));
        measurePins();
        if (flightsGlobe) flightsGlobe.resize();
        markDirty();
      });
    });
    document.addEventListener('visibilitychange', () => {
      if (!flightsGlobe) return;
      if (document.hidden) flightsGlobe.stop();
      else if (!page && !app.classList.contains('is-opening')) flightsGlobe.start(false);
    });
  }
  start();
})();

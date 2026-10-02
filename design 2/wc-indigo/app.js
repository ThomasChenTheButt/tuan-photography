/* tuan photography 陳亮元 · design 2 · "Two pigments"
   A map painted with two pigments on washi: indigo, in many dilutions, for the sea, the land, the
   coasts, the borders and every name; persimmon only for the sixteen countries travelled. The
   painting is made once per zoom band (paint.js) and laid on a canvas that d3-zoom moves; coasts,
   borders and lettering are drawn over it live, and the sheet's fibres lie over all.
   Design 1's books stand at the sixteen places. Choosing one magnifies the map into the country,
   and in the last third of the zoom the cover photograph dissolves in over the whole window. The
   cover is a full-screen gallery of that country's photographs (swipe sideways); scrolling down
   brings the guide or the photographs page up over it. The small globe in the corner opens into
   the Flights view: the globe on the left, his journeys on the right. */
(() => {
  'use strict';

  const S = window.SITE;
  const WC = window.WC;
  const NAMES = window.COUNTRY_NAMES || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = matchMedia('(max-width: 47.99rem)');
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // the data keeps a few typographic dashes (a date range, a price range); the page shows none
  const clean = (s) => String(s ?? '').replace(/(\d)\s*[–—]\s*(\d)/g, '$1-$2').replace(/\s+[–—]\s+/g, ', ').replace(/[–—]/g, '-');
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const expOut = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
  const SOFT = 'cubic-bezier(0.45, 0, 0.55, 1)';

  /* ------------------------------------------------------------ words */

  const T = {
    en: {
      ig: 'Instagram',
      mapLabel: 'Map of the places travelled',
      mapHint: 'Drag, or use the arrow keys, to move the map. Scroll, or press plus and minus, to zoom. Tab moves through the books.',
      zoomGroup: 'Zoom', zoomIn: 'Zoom in', zoomOut: 'Zoom out', world: 'Whole map', credit: 'Map: Natural Earth',
      flights: 'Flights', globeLabel: 'Flights: open the globe of journeys',
      flightsTitle: 'Flights', flightsHelp: 'Drag to turn the globe',
      flightsGlobeLabel: 'A globe of the flights flown. Drag, or use the arrow keys, to turn it.',
      journeysCount: (j, p) => `${j} journeys to ${p} places`,
      journeyAria: (d) => `Journey of ${d}`,
      keyLabel: 'Key', keyBeen: 'Travelled', keyNot: 'Not yet',
      indexTitle: 'Photographs', indexClose: 'Close',
      count: (n, p) => `${n} photographs from ${p} places`,
      seePhotos: 'See the photographs',
      prev: 'Previous', next: 'Next',
      camera: 'Camera', lens: 'Lens', settings: 'Settings',
      ofN: (i, n) => `${i} of ${n}`,
      gallery: (p) => `Photographs of ${p}`,
      madeOf: (p) => `${p}: how this was made`,
      lang: 'Language', site: 'Site',
      nPhotos: (n) => (n === 1 ? '1 photograph' : `${n} photographs`),
      seas: { pacific: 'Pacific Ocean', indian: 'Indian Ocean', atlantic: 'Atlantic Ocean', southern: 'Southern Ocean', arctic: 'Arctic Ocean' },
      opening: (p) => `${p} is open.`,
      endLine: 'Every photograph here is his own, made on the trip.',
      bookAria: (p, s) => `${p}: ${s}`,
      hintGuide: 'Scroll for the guide', hintPhotos: 'Scroll for the photographs',
    },
    zh: {
      ig: 'Instagram',
      mapLabel: '走過的地方地圖',
      mapHint: '拖曳或用方向鍵移動地圖；捲動，或按加號、減號縮放。Tab 鍵逐一走過每本書。',
      zoomGroup: '縮放', zoomIn: '放大', zoomOut: '縮小', world: '整張地圖', credit: '地圖：Natural Earth',
      flights: '飛過的航線', globeLabel: '飛過的航線：打開旅程地球',
      flightsTitle: '飛過的航線', flightsHelp: '拖曳轉動地球',
      flightsGlobeLabel: '飛過的航線地球。拖曳或用方向鍵轉動它。',
      journeysCount: (j, p) => `${j} 趟旅程，${p} 個地方`,
      journeyAria: (d) => `${d} 的旅程`,
      keyLabel: '圖例', keyBeen: '去過', keyNot: '還沒去',
      indexTitle: '照片', indexClose: '關閉',
      count: (n, p) => `${p} 個地方，${n} 張照片`,
      seePhotos: '看照片',
      prev: '上一張', next: '下一張',
      camera: '相機', lens: '鏡頭', settings: '參數',
      ofN: (i, n) => `第 ${i} 張，共 ${n} 張`,
      gallery: (p) => `${p}的照片`,
      madeOf: (p) => `${p}：這張怎麼拍`,
      lang: '語言', site: '網站',
      nPhotos: (n) => `${n} 張照片`,
      seas: { pacific: '太平洋', indian: '印度洋', atlantic: '大西洋', southern: '南冰洋', arctic: '北冰洋' },
      opening: (p) => `已打開${p}。`,
      endLine: '這裡每張照片都是他自己在旅途中拍的。',
      bookAria: (p, s) => `${p}：${s}`,
      hintGuide: '往下看攻略', hintPhotos: '往下看照片',
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
  const L = (o) => clean(o ? (o[lang] !== undefined ? o[lang] : o.en) : '');

  /* ------------------------------------------------------------ data */

  const countries = Object.fromEntries(S.countries.map((c) => [c.id, c]));
  const books = S.books.map((b) => ({ ...b, view: b.guide ? `guide-${b.guide}` : `place-${b.country}` }));
  const bookByCountry = Object.fromEntries(books.map((b) => [b.country, b]));
  const guide = S.guides.barcelona;
  const order = books.map((b) => countries[b.country]).filter(Boolean);
  const placeLL = (cid) => (cid === guide.country ? guide.ll : countries[cid] ? countries[cid].ll : null);
  const indexOrder = order.flatMap((c) => c.photos.filter((id) => S.slides[id]));
  const photosOf = (cid) => (countries[cid] ? countries[cid].photos.filter((id) => S.slides[id]) : []);
  const coverFor = (cid, want) => {
    if (want && S.slides[want] && S.slides[want].country === cid) return want;
    const b = bookByCountry[cid];
    return b.photo || photosOf(cid)[0] || null;
  };
  const coords = ([lat, lng]) => `${Math.abs(lat).toFixed(3)}°${lat >= 0 ? 'N' : 'S'} · ${Math.abs(lng).toFixed(3)}°${lng >= 0 ? 'E' : 'W'}`;
  const nameParts = (cid) => {
    const b = bookByCountry[cid], c = countries[cid];
    const place = L(b.title), country = L(c.name);
    return place === country ? [place] : [place, country];
  };
  const nameHTML = (cid) => nameParts(cid).map(esc).join(`<i>${lang === 'zh' ? '｜' : '|'}</i>`);
  const imgSrc = (s, size) => `../images/web/${size ? size + '/' : ''}${s.file}`;
  const srcset = (s) => `${imgSrc(s, 640)} 640w, ${imgSrc(s, 1280)} 1280w, ${imgSrc(s)} ${s.w}w`;
  const ISO = { spain: '724', uk: '826', france: '250', germany: '276', switzerland: '756', taiwan: '158', japan: '392', 'south-korea': '410', 'hong-kong': '344', china: '156', singapore: '702', vietnam: '704', dubai: '784', australia: '036', 'new-zealand': '554', usa: '840' };
  const isoToCid = Object.fromEntries(Object.entries(ISO).map(([c, i]) => [i, c]));

  /* ------------------------------------------------------------ elements */

  const html = document.documentElement;
  const app = $('#app');
  const mapEl = $('#map');
  const canvas = $('#paint');
  const ctx = canvas.getContext('2d');
  const pinsEl = $('#pins');
  const penEl = $('#pen');
  const washiEl = $('.map__washi');
  const leaf = $('#leaf');
  const leafScroll = $('#leaf-scroll');
  const leafContent = $('#leaf-content');
  const cover = $('#cover');
  const coverLens = $('#cover-lens');
  const coverTrack = $('#cover-track');
  const viewer = $('#viewer');
  const live = $('#live');
  const indexEl = $('#index');
  const indexBody = $('#index-body');
  const flightsEl = $('#flights');
  const SVGNS = 'http://www.w3.org/2000/svg';

  /* ------------------------------------------------------------ the map's frame */

  // an equirectangular plate centred on 10°E, so the relief lies straight on it and the Pacific
  // seam falls where nothing he visited is; the painted sheet runs pole to pole, and the deepest
  // indigo wash carries on past it, so the map always fills the window
  const LON0 = 10, LAT_N = 90, LAT_S = -90;
  const R0 = 8; // texture px per degree of the whole-world painting
  const state = {
    W: 1, H: 1, dpr: 1, S0: 1,
    z: d3.zoomIdentity,
    land50: null, travel: [], seams: null,
    coast110: null, coast50: null, borders110: null, borders50: null, landFill110: null,
    feats: {},
    relief: null, reliefFine: null, depth: null,
    base: null, regions: [], job: null,
    drawQueued: false, settle: 0,
    before: null,
  };
  const wrapU = (lon) => ((((lon - LON0) % 360) + 540) % 360) - 180;
  const baseXY = (ll) => [state.W / 2 + wrapU(ll[1]) * state.S0, state.H / 2 - ll[0] * state.S0];
  const P = (ll, z = state.z) => { const b = baseXY(ll); return [z.applyX(b[0]), z.applyY(b[1])]; };
  const invertLL = (x, y) => {
    const u = (state.z.invertX(x) - state.W / 2) / state.S0;
    const lat = -(state.z.invertY(y) - state.H / 2) / state.S0;
    return [((u + LON0 + 540) % 360) - 180, lat];
  };
  const pxPerDeg = (z = state.z) => z.k * state.S0;
  const projDeg = d3.geoEquirectangular().rotate([-LON0, 0]).scale(180 / Math.PI).translate([0, 0]).precision(0);
  const pathDeg = (geo) => { const p = new Path2D(); d3.geoPath(projDeg, p)(geo); return p; };

  function sizeMap() {
    state.W = Math.max(1, mapEl.clientWidth);
    state.H = Math.max(1, mapEl.clientHeight);
    state.dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(state.W * state.dpr);
    canvas.height = Math.round(state.H * state.dpr);
    state.S0 = state.W / 360;
    zoom.extent([[0, 0], [state.W, state.H]])
      .translateExtent([[0, state.H / 2 - 84 * state.S0], [state.W, state.H / 2 + 70 * state.S0]]);
    penEl.setAttribute('viewBox', `0 0 ${state.W} ${state.H}`);
  }

  /* ------------------------------------------------------------ the painting, by zoom band */

  const bandOf = (p) => {
    const need = p * Math.min(1.5, state.dpr) * 0.85;
    return need <= R0 ? 0 : Math.ceil(2 * Math.log2(need / R0));
  };
  const resOf = (b) => R0 * Math.pow(2, b / 2);
  function viewRect(z) {
    const p = pxPerDeg(z);
    const u0 = (z.invertX(0) - state.W / 2) / state.S0, v0 = (z.invertY(0) - state.H / 2) / state.S0;
    return { u0, v0, u1: u0 + state.W / p, v1: v0 + state.H / p };
  }
  const covers = (t, v) => t.u0 <= Math.max(-180, v.u0) + 0.0001 && t.v0 <= Math.max(-LAT_N, v.v0) + 0.0001 && t.u0 + t.w / t.r >= Math.min(180, v.u1) - 0.0001 && t.v0 + t.h / t.r >= Math.min(-LAT_S, v.v1) - 0.0001;
  const paintEnv = {
    LON0,
    land: () => state.land50,
    travel: () => state.travel,
    seams: () => state.seams,
    relief: (r) => (r >= 22 && state.reliefFine ? state.reliefFine : state.relief),
    depth: () => state.depth,
  };

  async function paintBase() {
    if (state.base || !state.land50 || !state.relief) return;
    const job = { r: R0, u0: -180, v0: -LAT_N, w: 360 * R0, h: (LAT_N - LAT_S) * R0 };
    try {
      const c = await WC.paint(job, paintEnv);
      state.base = { canvas: c, ...job, b: 0, ready: performance.now() };
      app.classList.add('is-painted');
      queueDraw();
      ensureTextures(state.z);
      if (!narrow.matches) setTimeout(loadFineRelief, 1200);
    } catch (e) { /* the first flat wash stays */ }
  }

  let settleTimer = 0;
  function ensureTextures(z) {
    if (!state.base) return;
    const p = pxPerDeg(z);
    const b = bandOf(p);
    if (b === 0) return;
    const r = resOf(b);
    const v = viewRect(z);
    const fit = state.regions.find((t2) => t2.b === b && covers(t2, v));
    if (fit) { fit.used = performance.now(); return; }
    if (state.job && state.job.b === b && covers(state.job, v)) return;
    if (state.job) state.job.cancelled = true;
    const vw = v.u1 - v.u0, vh = v.v1 - v.v0;
    let m = 0.16;
    let u0, v0, u1, v1;
    for (let i = 0; i < 4; i++) {
      u0 = Math.max(-180, v.u0 - vw * m); u1 = Math.min(180, v.u1 + vw * m);
      v0 = Math.max(-LAT_N, v.v0 - vh * m); v1 = Math.min(-LAT_S, v.v1 + vh * m);
      if ((u1 - u0) * (v1 - v0) * r * r < 4.2e6) break;
      m *= 0.5;
    }
    const job = { b, r, u0, v0, w: Math.max(2, Math.ceil((u1 - u0) * r)), h: Math.max(2, Math.ceil((v1 - v0) * r)), cancelled: false };
    if (job.w * job.h > 6e6) return;
    state.job = job;
    if (r >= 22 && !state.reliefFine && !narrow.matches) loadFineRelief();
    WC.paint(job, paintEnv).then((c) => {
      if (state.job === job) state.job = null;
      featherEdges(c);
      state.regions.push({ canvas: c, b, r, u0: job.u0, v0: job.v0, w: job.w, h: job.h, ready: performance.now(), used: performance.now() });
      if (state.regions.length > 4) {
        state.regions.sort((a, b2) => b2.used - a.used);
        state.regions.length = 4;
      }
      queueDraw();
    }).catch(() => { if (state.job === job) state.job = null; });
  }
  // a regional painting fades out at its own edges, so it never shows a seam against the coarser one
  function featherEdges(c) {
    const g = c.getContext('2d');
    const f = 36;
    g.save();
    g.globalCompositeOperation = 'destination-out';
    const sides = [
      [0, 0, c.width, f, 0, 0, 0, f], [0, c.height - f, c.width, f, 0, c.height, 0, c.height - f],
      [0, 0, f, c.height, 0, 0, f, 0], [c.width - f, 0, f, c.height, c.width, 0, c.width - f, 0],
    ];
    for (const [x, y, w, h, x0, y0, x1, y1] of sides) {
      const gr = g.createLinearGradient(x0, y0, x1, y1);
      gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(x, y, w, h);
    }
    g.restore();
  }
  // an image, ready to draw (load, not decode: decode waits while a tab is hidden)
  const loadImg = (src) => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; });
  function loadFineRelief() {
    if (state.reliefFineLoading) return;
    state.reliefFineLoading = true;
    loadImg('../vendor/relief/SR_50M-10800.jpg').then((im) => { state.reliefFine = im; }).catch(() => {});
  }
  // how deep the sea is: a small field made once from Natural Earth's ocean-bottom relief
  function loadDepth() {
    return new Promise((res) => {
      loadImg('map/depth.jpg').then((im) => {
        const c = document.createElement('canvas');
        c.width = im.width; c.height = im.height;
        const g = c.getContext('2d', { willReadFrequently: true });
        g.drawImage(im, 0, 0);
        const px = g.getImageData(0, 0, c.width, c.height).data;
        const d = new Float32Array(c.width * c.height);
        for (let i = 0; i < d.length; i++) d[i] = px[i * 4] / 255;
        state.depth = { d, w: c.width, h: c.height };
        res();
      }).catch(() => res());
    });
  }

  /* ------------------------------------------------------------ drawing a frame */

  const DEEP = `rgb(${WC.deepSea().join(',')})`;
  const INK = (a) => `rgba(30, 46, 92, ${a})`;      // indigo, deep
  const PALE = (a) => `rgba(74, 92, 140, ${a})`;    // indigo, let down
  const PERS = 'rgb(206, 102, 44)';                 // persimmon
  const HALO = (a) => `rgba(243, 245, 246, ${a})`;
  const SEAS = [
    { id: 'pacific', ll: [8, 168] },
    { id: 'indian', ll: [-22, 78] },
    { id: 'atlantic', ll: [26, -44] },
    { id: 'southern', ll: [-58, 40] },
    { id: 'arctic', ll: [80, 10] },
  ];

  function draw() {
    state.drawQueued = false;
    const now = performance.now();
    const { W, H, dpr, z } = state;
    const p = pxPerDeg();
    const X0 = z.x + (z.k * W) / 2, Y0 = z.y + (z.k * H) / 2;
    let again = false;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    // the deepest wash, everywhere the painted sheet does not reach
    ctx.fillStyle = DEEP;
    ctx.fillRect(0, 0, W, H);

    // before the painting is ready (and while it fades in): a flat first wash
    const baseA = state.base ? Math.min(1, (now - state.base.ready) / 600) : 0;
    if (baseA < 1 && state.landFill110) {
      ctx.setTransform(dpr * p, 0, 0, dpr * p, dpr * X0, dpr * Y0);
      ctx.fillStyle = 'rgb(214, 221, 232)';
      ctx.fillRect(-180, -LAT_N, 360, LAT_N - LAT_S);
      ctx.fillStyle = 'rgb(239, 240, 238)';
      ctx.fill(state.landFill110);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    if (state.base) {
      const c = 2 * Math.log2(Math.max(1e-6, (p * Math.min(1.5, dpr) * 0.85) / R0));
      const list = [state.base, ...state.regions.slice().sort((a, b) => a.r - b.r)];
      for (const tx of list) {
        let a = Math.min(1, (now - tx.ready) / 600);
        if (now - tx.ready < 620) again = true;
        if (tx.b > 0) a *= c >= tx.b - 1.2 ? 1 : clamp(1 + (c - tx.b + 1.2) / 1.6, 0, 1);
        if (a <= 0.01) continue;
        const dx = X0 + tx.u0 * p, dy = Y0 + tx.v0 * p, sc = p / tx.r;
        const sx0 = Math.max(0, -dx / sc), sy0 = Math.max(0, -dy / sc);
        const sx1 = Math.min(tx.w, (W - dx) / sc), sy1 = Math.min(tx.h, (H - dy) / sc);
        if (sx1 <= sx0 || sy1 <= sy0) continue;
        ctx.globalAlpha = a;
        ctx.imageSmoothingQuality = sc < 1 ? 'high' : 'medium';
        ctx.drawImage(tx.canvas, sx0, sy0, sx1 - sx0, sy1 - sy0, dx + sx0 * sc, dy + sy0 * sc, (sx1 - sx0) * sc, (sy1 - sy0) * sc);
      }
      ctx.globalAlpha = 1;
    }

    // the coast: the darker dried edge of the sea wash, a fine line in the pooled pigment;
    // the borders: the faintest indigo lines
    const coast = p > 10 && state.coast50 ? state.coast50 : state.coast110;
    if (coast) {
      const w = Math.min(1.1, 0.62 + p * 0.004);
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.setTransform(dpr * p, 0, 0, dpr * p, dpr * X0, dpr * Y0);
      const borders = p > 10 && state.borders50 ? state.borders50 : state.borders110;
      if (borders) { ctx.strokeStyle = PALE(0.26); ctx.lineWidth = 0.55 / p; ctx.stroke(borders); }
      ctx.strokeStyle = INK(0.1); ctx.lineWidth = (w * 2.6) / p; ctx.stroke(coast);
      ctx.strokeStyle = INK(0.52); ctx.lineWidth = w / p; ctx.stroke(coast);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // the oceans, lettered in italic, fading as you come close
    const seaA = clamp((22 - p) / 10, 0, 1);
    const zh = lang === 'zh';
    if (seaA > 0 && fontsReady) {
      ctx.save();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = zh ? '400 13px "Noto Sans TC", sans-serif' : 'italic 400 15px "Alegreya Sans", sans-serif';
      try { ctx.letterSpacing = zh ? '7px' : '4px'; } catch (e) { /* older engines */ }
      ctx.fillStyle = `rgba(36, 56, 108, ${0.86 * seaA})`;
      for (const s of SEAS) {
        const [x, y] = P(s.ll);
        const label = T[lang].seas[s.id];
        const half = ctx.measureText(label).width / 2;
        if (x - half < 8 || x + half > W - 8 || y < 70 || y > H - 40) continue;
        ctx.fillText(label, x + (zh ? 3.5 : 2), y);
      }
      ctx.restore();
    }

    // where each photograph was made, once close enough to tell them apart
    const close = p > 36;
    state.photoPts = [];
    if (close) {
      for (const id of indexOrder) {
        const [x, y] = P(S.slides[id].ll);
        if (x < -10 || y < -10 || x > W + 10 || y > H + 10) continue;
        state.photoPts.push({ id, p: [x, y] });
        ctx.beginPath(); ctx.arc(x, y, 3.6, 0, Math.PI * 2);
        ctx.fillStyle = HALO(0.92); ctx.fill();
        ctx.lineWidth = 1; ctx.strokeStyle = INK(0.9); ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y, 1.4, 0, Math.PI * 2);
        ctx.fillStyle = PERS; ctx.fill();
      }
    }

    // the books: a fine indigo leader from each place to where its book stands
    layoutPins();
    if (!diving) {
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = INK(0.55);
      for (const b of pinList) {
        if (Math.hypot(b.x - b.ax, b.y - b.ay) > 6) { ctx.beginPath(); ctx.moveTo(b.ax, b.ay); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      }
      for (const b of pinList) {
        ctx.beginPath(); ctx.arc(b.ax, b.ay, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = HALO(1); ctx.fill();
        ctx.lineWidth = 1.1; ctx.strokeStyle = INK(0.95); ctx.stroke();
        ctx.beginPath(); ctx.arc(b.ax, b.ay, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = PERS; ctx.fill();
      }
    }

    // every country's name, by importance and zoom, never over a book, its name or another name
    if (fontsReady) letterCountries(p);

    placePen();
    // the sheet's fibres travel with the painting
    washiEl.style.setProperty('--wx', `${(((X0 % 256) + 256) % 256).toFixed(1)}px`);
    washiEl.style.setProperty('--wy', `${(((Y0 % 256) + 256) % 256).toFixed(1)}px`);
    if (again) state.settle = Math.max(state.settle, 1);
    if (state.settle > 0) { state.settle -= 1; queueDraw(); }
  }

  /* ------------------------------------------------------------ every country, lettered */

  const hisIso = new Set(Object.values(ISO));
  const nameList = Object.entries(NAMES)
    .filter(([id]) => id !== '010')
    .map(([id, n]) => ({ id, n, his: hisIso.has(id), cid: isoToCid[id] || null }))
    .sort((a, b) => (b.his - a.his) || (a.n.rank - b.n.rank) || (a.n.min - b.n.min));
  const measured = new Map();
  function letterCountries(p) {
    const { W, H } = state;
    const zl = Math.log2((p * 360) / 256); // the web-map zoom this scale corresponds to
    const zh = lang === 'zh';
    const taken = [];
    // the books and their names are taken first
    if (!diving) {
      const s = bookScale();
      const bw = 192 * s, bh = 272 * s;
      for (const q of pinList) {
        taken.push([q.x - bw / 2 - 4, q.y - bh - 6, q.x + bw / 2 + 4, q.y + 4]);
        if (!q.el.classList.contains('is-quiet')) taken.push([q.x - q.lw / 2 - 2, q.y + 4, q.x + q.lw / 2 + 2, q.y + 24]);
        taken.push([q.ax - 6, q.ay - 6, q.ax + 6, q.ay + 6]);
      }
    }
    // and the words at the edges of the window
    taken.push([0, 0, W, 58], [0, H - 52, W, H], [0, H - 250, 230, H], [W - 54, H * 0.3, W, H * 0.7]);
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    for (const it of nameList) {
      const n = it.n;
      if (it.his) {
        // his sixteen keep their own names from the data, in deeper indigo; where the book already
        // carries the country's name, the book's own label is its lettering
        const b = bookByCountry[it.cid];
        if (!b || L(b.title) === L(countries[it.cid].name)) continue;
      }
      const show = n.min - 0.35;
      if (zl < show) continue;
      const a = clamp((zl - show) / 0.45, 0, 1) * (diving ? 0 : 1);
      if (a <= 0.02) continue;
      const [x, y] = P([n.at[1], n.at[0]]);
      if (x < -60 || x > W + 60 || y < -20 || y > H + 20) continue;
      const size = it.his ? 11.5 : n.rank <= 2 ? 11 : n.rank <= 3 ? 10.25 : 9.5;
      const font = zh ? `500 ${size + 0.5}px "Noto Sans TC", sans-serif` : `500 ${size}px "Alegreya Sans", sans-serif`;
      const label = it.his ? L(countries[it.cid].name) : (zh ? n.zh : n.en.toUpperCase());
      const spacing = zh ? 0.3 * size : 0.16 * size;
      const key = `${lang}|${it.id}|${font}`;
      let tw = measured.get(key);
      ctx.font = font;
      try { ctx.letterSpacing = `${spacing.toFixed(2)}px`; } catch (e) { /* older engines */ }
      if (tw == null) { tw = ctx.measureText(it.his && !zh ? label.toUpperCase() : label).width; measured.set(key, tw); }
      const box = [x - tw / 2 - 3, y - size * 0.75, x + tw / 2 + 3, y + size * 0.75];
      if (box[0] < 4 || box[2] > W - 4 || box[1] < 4 || box[3] > H - 4) continue;
      let free = true;
      for (const r of taken) if (box[0] < r[2] && box[2] > r[0] && box[1] < r[3] && box[3] > r[1]) { free = false; break; }
      if (!free) continue;
      taken.push(box);
      const text = it.his && !zh ? label.toUpperCase() : label;
      ctx.globalAlpha = a;
      ctx.lineWidth = 3; ctx.strokeStyle = HALO(0.72);
      ctx.strokeText(text, x + spacing / 2, y);
      ctx.fillStyle = it.his ? INK(1) : PALE(1);
      ctx.fillText(text, x + spacing / 2, y);
    }
    ctx.restore();
  }

  function queueDraw() {
    if (state.drawQueued) return;
    state.drawQueued = true;
    requestAnimationFrame(draw);
  }

  /* ------------------------------------------------------------ zoom and pan */

  const zoom = d3.zoom()
    .scaleExtent([1, 160])
    .on('start', (e) => { if (e.sourceEvent && e.sourceEvent.type !== 'wheel') mapEl.classList.add('is-dragging'); })
    .on('zoom', (e) => {
      state.z = e.transform;
      state.settle = 2;
      queueDraw();
      updateZoomButtons();
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => ensureTextures(state.z), 140);
    })
    .on('end', () => mapEl.classList.remove('is-dragging'));
  const sel = d3.select(mapEl);
  sel.call(zoom).on('dblclick.zoom', null);
  mapEl.addEventListener('dblclick', (e) => {
    if (e.target.closest('.book')) return;
    const r = mapEl.getBoundingClientRect();
    sel.interrupt().transition().duration(reduce.matches ? 0 : 450).ease(d3.easeExpOut).call(zoom.scaleBy, e.shiftKey ? 0.5 : 2, [e.clientX - r.left, e.clientY - r.top]);
  });

  const constrain = (tr) => zoom.constrain()(tr, [[0, 0], [state.W, state.H]], zoom.translateExtent());
  function moveTo(target, dur = 900) {
    const tr = constrain(target);
    const d = reduce.matches ? 0 : dur;
    if (d === 0) sel.interrupt().call(zoom.transform, tr);
    else sel.interrupt().transition().duration(d).ease(d3.easeExpOut).call(zoom.transform, tr);
    return tr;
  }
  function fitTransform(lls, pad) {
    const pts = lls.map(baseXY);
    const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const { W, H } = state;
    const k = clamp(Math.min((W - pad.l - pad.r) / Math.max(1, x1 - x0), (H - pad.t - pad.b) / Math.max(1, y1 - y0)), 1, 160);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const sx = pad.l + (W - pad.l - pad.r) / 2, sy = pad.t + (H - pad.t - pad.b) / 2;
    return d3.zoomIdentity.translate(sx - cx * k, sy - cy * k).scale(k);
  }
  function homeTransform() {
    const small = narrow.matches;
    const pad = small ? { l: 60, r: 60, t: 150, b: 190 } : { l: 70, r: 96, t: 150, b: 96 };
    // a phone opens on the crowded half, Asia and Oceania, where ten of the places are
    const near = small ? order.filter((c) => (c.continent === 'asia' && c.id !== 'dubai') || c.continent === 'oceania') : order;
    return fitTransform(near.map((c) => placeLL(c.id)), pad);
  }
  function centerOn(ll, k, dur) {
    const b = baseXY(ll);
    const kk = k || state.z.k;
    moveTo(d3.zoomIdentity.translate(state.W / 2 - b[0] * kk, state.H / 2 + 30 - b[1] * kk).scale(kk), dur);
  }
  function inView(ll, margin = 0.15) {
    const q = P(ll);
    return q[0] > state.W * margin && q[0] < state.W * (1 - margin) && q[1] > state.H * margin && q[1] < state.H * (1 - margin);
  }
  // the dive's landing: the country filling the view, the place itself at the centre
  function diveTransform(cid) {
    const ll = placeLL(cid);
    const f = state.feats[cid];
    let k = 30;
    if (f) {
      const b = d3.geoBounds(f);
      let w = b[1][0] - b[0][0];
      if (w < 0) w += 360;
      const span = Math.min(w, 60), hspan = Math.min(b[1][1] - b[0][1], 40);
      const kx = (state.W - 80) / (span * state.S0), ky = (state.H - 120) / (hspan * state.S0);
      k = Math.min(kx, ky);
    }
    k = clamp(k * 0.9, 12, 150);
    const q = baseXY(ll);
    return constrain(d3.zoomIdentity.translate(state.W / 2 - q[0] * k, state.H / 2 - q[1] * k).scale(k));
  }

  const zIn = $('#zoom-in'), zOut = $('#zoom-out'), zAll = $('#zoom-world');
  const zoomBy = (f) => sel.interrupt().transition().duration(reduce.matches ? 0 : 420).ease(d3.easeExpOut).call(zoom.scaleBy, f);
  zIn.addEventListener('click', () => zoomBy(2));
  zOut.addEventListener('click', () => zoomBy(0.5));
  zAll.addEventListener('click', () => moveTo(homeTransform()));
  function updateZoomButtons() {
    zIn.disabled = state.z.k >= 159.9;
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
  const bookStatus = (b) => (b.band === 'bandNone' ? t('bandNone') : t(b.status));
  function renderPins() {
    const keep = new Map(pinList.map((q) => [q.id, q]));
    pinsEl.textContent = '';
    pinList = order.map((c) => {
      const b = bookByCountry[c.id];
      const title = esc(L(b.title));
      const s = b.photo ? S.slides[b.photo] : null;
      const face = s
        ? `<span class="book__face"><img src="${imgSrc(s, 640)}" alt="" width="${s.w}" height="${s.h}" decoding="async">`
        : `<span class="book__face book__face--blank"><b>${title}</b>`;
      const el = document.createElement('div');
      el.className = 'pin';
      el.dataset.country = c.id;
      el.innerHTML =
        `<div class="pin__stage"><a class="book book--${b.tone}" href="#${b.view}" aria-label="${esc(T[lang].bookAria(L(b.title), bookStatus(b)))}" data-view="${b.view}"><span class="book__box">` +
        `<span class="book__spine"><b>${title}</b><i>${esc(t('series'))}</i></span>` +
        `${face}<span class="book__band"><b>${title}</b><span>${esc(t(b.band))}</span></span></span>` +
        `<span class="book__back"><i>${esc(t('series'))}</i></span><span class="book__edge"></span>` +
        `<span class="book__top"></span><span class="book__shadow"></span></span></a></div>` +
        `<div class="pin__label" aria-hidden="true"><b>${title}</b><i>${esc(L(c.note))}</i></div>`;
      pinsEl.appendChild(el);
      const prev = keep.get(b.id);
      return { id: b.id, country: c.id, book: b, el, ll: placeLL(c.id), x: prev ? prev.x : NaN, y: prev ? prev.y : NaN, ax: 0, ay: 0, lw: 0 };
    });
    measurePins();
    bindPins();
  }
  function measurePins() { for (const q of pinList) q.lw = q.el.querySelector('.pin__label b').offsetWidth + 6; }

  function bookScale() {
    const p = pxPerDeg();
    const small = narrow.matches;
    const base = small ? 0.17 : 0.25;
    const max = small ? 0.32 : 0.46;
    return Math.min(max, base * Math.pow(Math.max(0.5, p / 5.4), 0.3));
  }

  function layoutPins() {
    const s = bookScale();
    const small = narrow.matches;
    const bw = 192 * s, bh = 272 * s;
    const below = small ? 4 : 20;
    for (const q of pinList) {
      const a = P(q.ll);
      q.ax = a[0]; q.ay = a[1];
      if (Number.isNaN(q.x)) { q.x = q.ax; q.y = q.ay; }
      q.hw = small ? bw / 2 + 2 : Math.max(bw / 2 + 3, q.lw / 2 + 2);
    }
    // pulled toward its place, pushed apart from its neighbours: books never cover each other
    const pull = 0.3;
    for (const q of pinList) { q.x += (q.ax - q.x) * pull; q.y += (q.ay - q.y) * pull; }
    for (let it = 0; it < 10; it++) {
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
    // on a phone, names that would sit on another book or name wait until their book wakes
    const taken = [];
    for (const q of pinList) {
      let free = true;
      if (small) {
        const r = [q.x - q.lw / 2, q.y + 4, q.x + q.lw / 2, q.y + 20];
        for (const o of pinList) {
          if (o === q) continue;
          if (r[0] < o.x + bw / 2 && r[2] > o.x - bw / 2 && r[1] < o.y && r[3] > o.y - bh) { free = false; break; }
        }
        if (free) for (const t2 of taken) if (r[0] < t2[2] && r[2] > t2[0] && r[1] < t2[3] && r[3] > t2[1]) { free = false; break; }
        if (free) taken.push(r);
      }
      q.el.classList.toggle('is-quiet', !free);
    }
    for (const q of pinList) {
      q.el.style.setProperty('--x', `${q.x.toFixed(1)}px`);
      q.el.style.setProperty('--y', `${q.y.toFixed(1)}px`);
      q.el.style.setProperty('--s', s.toFixed(3));
    }
  }

  function bindPins() {
    for (const q of pinList) {
      const a = q.el.querySelector('.book');
      a.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') setActive({ country: q.country, from: 'map' }); });
      a.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') clearActiveSoon(); });
      a.addEventListener('focus', () => {
        if (diving) return;
        setActive({ country: q.country, from: 'map' });
        if (!inView(q.ll, 0.08)) centerOn(q.ll, Math.max(state.z.k, homeTransform().k), 600);
      });
      a.addEventListener('blur', () => clearActiveSoon());
      a.addEventListener('click', (e) => { e.preventDefault(); go(q.book.view); });
    }
  }

  /* ------------------------------------------------------------ a fine ring marks a place on the map, never the index */

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
      const x = Math.cos(th) * rr * stretch * rx, y = Math.sin(th) * rr;
      pts.push([x * Math.cos(rot) - y * Math.sin(rot), x * Math.sin(rot) + y * Math.cos(rot)]);
    }
    return d3.line().curve(d3.curveCatmullRom.alpha(0.5))(pts);
  }
  function drawStroke(path, delay = 0, dur = 420) {
    if (reduce.matches) return;
    const len = path.getTotalLength();
    path.style.strokeDasharray = `${len} ${len + 4}`;
    path.style.strokeDashoffset = len;
    const a = path.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: dur, delay, easing: 'cubic-bezier(0.45, 0.05, 0.25, 1)', fill: 'forwards' });
    a.onfinish = () => { path.style.strokeDasharray = ''; path.style.strokeDashoffset = ''; a.cancel(); };
  }
  function erase(nodes) { nodes.forEach((n) => { n.classList.add('fading'); setTimeout(() => n.remove(), 300); }); }
  function tween(dur, fn, done, ease = expOut) {
    const t0 = performance.now();
    let id = 0, stopped = false;
    const tick = (now) => {
      if (stopped) return;
      const x = Math.min(1, (now - t0) / dur);
      fn(ease(x), x);
      if (x < 1) id = requestAnimationFrame(tick);
      else if (done) done();
    };
    id = requestAnimationFrame(tick);
    return { cancel: () => { stopped = true; cancelAnimationFrame(id); } };
  }

  let active = null, marks = [], clearTimer = 0, easeTimer = 0;
  const activeCountry = () => (active ? active.country || (active.slide && S.slides[active.slide].country) : null);
  function setActive(next) {
    if (diving) return;
    clearTimeout(clearTimer);
    if (active && next && active.country === next.country && active.slide === next.slide) return;
    erase(marks.filter((m) => m !== diveRing)); marks = diveRing ? [diveRing] : [];
    active = next;
    const cid = activeCountry();
    pinList.forEach((q) => q.el.classList.toggle('awake', q.country === cid));
    const pin = pinList.find((q) => q.country === cid);
    if (next.slide) marks.push(penRing(ringD(13), S.slides[next.slide].ll));
    else if (pin) marks.push(penRing(ringD(19, 1.15), pin.ll));
    placePen();
    marks.forEach((m) => drawStroke(m.firstChild, 0, 440));
    $$('.group.is-awake', indexBody).forEach((g) => { if (g.dataset.country !== cid) g.classList.remove('is-awake'); });
    const g = cid && indexBody.querySelector(`.group[data-country="${cid}"]`);
    if (g) g.classList.add('is-awake');
    if (next.from === 'index' && next.slide) {
      clearTimeout(easeTimer);
      easeTimer = setTimeout(() => { const ll = S.slides[next.slide].ll; if (!inView(ll, 0.14)) centerOn(ll, state.z.k, 900); }, 380);
    }
  }
  function clearActive() {
    erase(marks.filter((m) => m !== diveRing)); marks = diveRing ? [diveRing] : [];
    $$('.group.is-awake', indexBody).forEach((g) => g.classList.remove('is-awake'));
    pinList.forEach((q) => q.el.classList.remove('awake'));
    active = null;
    clearTimeout(easeTimer);
  }
  function clearActiveSoon() { clearTimeout(clearTimer); clearTimer = setTimeout(clearActive, 160); }
  function penRing(d, ll) {
    const g = document.createElementNS(SVGNS, 'g');
    g.dataset.ll = JSON.stringify(ll);
    g.dataset.s = '1';
    const p = document.createElementNS(SVGNS, 'path');
    p.setAttribute('class', 'ring');
    p.setAttribute('d', d);
    g.appendChild(p);
    penEl.appendChild(g);
    return g;
  }
  function placePen() {
    for (const m of marks) {
      if (!m.dataset.ll) continue;
      const q = P(JSON.parse(m.dataset.ll));
      const s = m.dataset.s || '1';
      m.setAttribute('transform', `translate(${q[0].toFixed(1)} ${q[1].toFixed(1)})${s === '1' ? '' : ` scale(${s})`}`);
    }
  }

  // hovering the map itself: a photograph's spot, a place, a travelled country
  let hoverQueued = false, lastMove = null;
  function hitTest(x, y) {
    if (state.photoPts) {
      let best = null, bd = 11;
      for (const q of state.photoPts) { const d = Math.hypot(q.p[0] - x, q.p[1] - y); if (d < bd) { bd = d; best = q.id; } }
      if (best) return { slide: best };
    }
    for (const q of pinList) if (Math.hypot(q.ax - x, q.ay - y) < 14) return { country: q.country };
    const ll = invertLL(x, y);
    for (const c of S.countries) { const f = state.feats[c.id]; if (f && d3.geoContains(f, ll)) return { country: c.id }; }
    return null;
  }
  mapEl.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || e.buttons || diving) return;
    lastMove = e;
    if (hoverQueued) return;
    hoverQueued = true;
    requestAnimationFrame(() => {
      hoverQueued = false;
      const ev = lastMove;
      if (ev.target.closest && ev.target.closest('.book')) return;
      const r = mapEl.getBoundingClientRect();
      const hit = hitTest(ev.clientX - r.left, ev.clientY - r.top);
      mapEl.classList.toggle('is-pointing', !!hit);
      if (hit) setActive({ ...hit, from: 'map' });
      else if (active) clearActiveSoon();
    });
  });
  mapEl.addEventListener('pointerleave', () => { mapEl.classList.remove('is-pointing'); clearActiveSoon(); });
  mapEl.addEventListener('click', (e) => {
    if (e.target.closest('.book') || e.defaultPrevented || diving) return;
    const r = mapEl.getBoundingClientRect();
    const hit = hitTest(e.clientX - r.left, e.clientY - r.top);
    if (!hit) return;
    if (hit.slide) openViewer(hit.slide, indexOrder, { from: 'map' });
    else { const q = pinList.find((x) => x.country === hit.country); if (q) go(q.book.view); }
  });

  /* ------------------------------------------------------------ the index of photographs, a drawer */

  const indexTab = $('#index-tab');
  const indexPanel = $('#index-panel');
  function setIndex(open, focus = true) {
    indexEl.classList.toggle('is-open', open);
    app.classList.toggle('is-indexed', open);
    indexTab.setAttribute('aria-expanded', String(open));
    indexPanel.inert = !open;
    if (open && focus) requestAnimationFrame(() => $('#index-close').focus({ preventScroll: true }));
    if (!open && focus) indexTab.focus({ preventScroll: true });
    if (!open) clearActiveSoon();
  }
  indexTab.addEventListener('click', () => setIndex(!indexEl.classList.contains('is-open')));
  $('#index-close').addEventListener('click', () => setIndex(false));

  function renderIndex() {
    $('#index-count').textContent = T[lang].count(indexOrder.length, S.countries.length);
    $('#index-n').textContent = String(indexOrder.length);
    indexBody.innerHTML = order.map((c) => {
      const b = bookByCountry[c.id];
      const ids = photosOf(c.id);
      const thumbs = ids.map((id) => {
        const s = S.slides[id];
        return `<li><button type="button" class="thumb" data-slide="${id}" aria-label="${esc(L(s.place))}">` +
          `<img src="${imgSrc(s, 640)}" alt="" loading="lazy" decoding="async" width="${s.w}" height="${s.h}">` +
          `<span class="thumb__name">${esc(L(s.place))}</span></button></li>`;
      }).join('');
      return `<section class="group" data-country="${c.id}" aria-labelledby="g-${c.id}">` +
        `<h3><button type="button" class="group__name" id="g-${c.id}" data-view="${b.view}">${nameHTML(c.id)}</button>` +
        `<span class="group__meta">${esc(L(c.date))}</span></h3>` +
        (thumbs ? `<ul class="thumbs">${thumbs}</ul>` : `<p class="group__none">${esc(t('bandNone'))}</p>`) +
        `</section>`;
    }).join('');
  }
  indexBody.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    const th = e.target.closest('.thumb'), gn = e.target.closest('.group__name');
    if (th) setActive({ slide: th.dataset.slide, from: 'index' });
    else if (gn) setActive({ country: gn.closest('.group').dataset.country, from: 'index' });
  });
  indexBody.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') clearActiveSoon(); });
  indexBody.addEventListener('focusin', (e) => {
    const th = e.target.closest('.thumb'), gn = e.target.closest('.group__name');
    if (th) setActive({ slide: th.dataset.slide, from: 'index' });
    else if (gn) setActive({ country: gn.closest('.group').dataset.country, from: 'index' });
  });
  indexBody.addEventListener('click', (e) => {
    if (diving) return;
    const th = e.target.closest('.thumb'), gn = e.target.closest('.group__name');
    // a photograph in the index dives into its place, the gallery opening on that photograph
    if (th) { const s = S.slides[th.dataset.slide]; setIndex(false, false); go(bookByCountry[s.country].view, th.dataset.slide); }
    else if (gn) { setIndex(false, false); go(gn.dataset.view); }
  });

  /* ------------------------------------------------------------ the leaf: the page the dive lands on */

  let page = null, pageCover = null;
  let tocObserver = null;
  let diving = false;

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
  const isGuide = (view) => view.startsWith('guide-') || (view.startsWith('place-') && view.slice(6) === guide.country);

  function renderLeaf(view, coverId) {
    const cid = viewCountry(view);
    $('#leaf-where').innerHTML = `<b>${nameHTML(cid)}</b><span>${esc(coords(placeLL(cid)))}</span>`;
    if (tocObserver) { tocObserver.disconnect(); tocObserver = null; }
    renderCover(cid, view, coverId);
    if (isGuide(view)) renderGuide(); else renderPlace(countries[cid]);
    watchScroll();
  }

  /* ------------------------------------------------------------ the cover: a full-screen gallery of the country */

  const gal = { cid: null, ids: [], i: 0, drag: 0 };
  function renderCover(cid, view, startId) {
    const ids = photosOf(cid);
    leaf.classList.toggle('is-plain', !ids.length);
    gal.cid = cid; gal.ids = ids;
    if (!ids.length) { cover.hidden = true; coverTrack.textContent = ''; return; }
    cover.hidden = false;
    const keepI = startId && ids.includes(startId) ? ids.indexOf(startId) : 0;
    gal.i = keepI;
    cover.setAttribute('aria-label', T[lang].gallery(L(bookByCountry[cid].title)));
    coverTrack.innerHTML = ids.map((id, i) => {
      const s = S.slides[id];
      return `<figure class="cover__slide" role="group" aria-roledescription="slide" aria-label="${esc(T[lang].ofN(i + 1, ids.length))}" data-i="${i}">` +
        `</figure>`;
    }).join('');
    $('#cover-hint').textContent = isGuide(view) ? t('hintGuide') : t('hintPhotos');
    showSlide(keepI, false);
  }
  function loadAround(i) {
    for (const k of [i, i + 1, i - 1]) {
      if (k < 0 || k >= gal.ids.length) continue;
      // a photograph is only put into its slide when it is about to be seen
      const fig = coverTrack.children[k];
      if (!fig || fig.firstChild) continue;
      const s = S.slides[gal.ids[k]];
      const im = new Image(s.w, s.h);
      im.alt = L(s.alt);
      im.decoding = 'async';
      im.draggable = false;
      im.sizes = '100vw';
      if (k === i) im.fetchPriority = 'high';
      im.srcset = srcset(s);
      im.src = imgSrc(s, 1280);
      fig.appendChild(im);
    }
  }
  const coverW = () => cover.clientWidth || window.innerWidth;
  function placeTrack(animate) {
    coverTrack.classList.toggle('is-settling', !!animate && !reduce.matches);
    coverTrack.style.setProperty('--tx', `${(-gal.i * coverW() + gal.drag).toFixed(1)}px`);
  }
  function showSlide(i, animate = true) {
    const n = gal.ids.length;
    if (!n) return;
    gal.i = clamp(i, 0, n - 1);
    gal.drag = 0;
    loadAround(gal.i);
    placeTrack(animate);
    $$('.cover__slide', coverTrack).forEach((f, k) => { f.inert = k !== gal.i; f.setAttribute('aria-hidden', String(k !== gal.i)); });
    const s = S.slides[gal.ids[gal.i]];
    $('#cover-name').textContent = L(s.place);
    $('#cover-country').textContent = L(countries[gal.cid].name);
    $('#cover-count').textContent = n > 1 ? `${gal.i + 1} / ${n}` : '';
    $('#cover-count').setAttribute('aria-label', T[lang].ofN(gal.i + 1, n));
    const prev = $('#cover-prev'), next = $('#cover-next');
    prev.hidden = next.hidden = n < 2;
    prev.disabled = gal.i === 0;
    next.disabled = gal.i === n - 1;
    pageCover = gal.ids[gal.i];
    if (animate) live.textContent = `${L(s.place)}, ${T[lang].ofN(gal.i + 1, n)}`;
    try { if (history.state && history.state.wc && page) history.replaceState({ ...history.state, cover: pageCover }, '', location.href); } catch (e) { /* fine */ }
  }
  function stepSlide(d) {
    wake();
    const n = gal.ids.length;
    const to = gal.i + d;
    if (to < 0 || to >= n) { gal.drag = 0; placeTrack(true); return; }
    showSlide(to, true);
  }
  $('#cover-prev').addEventListener('click', () => stepSlide(-1));
  $('#cover-next').addEventListener('click', () => stepSlide(1));
  $('#cover-hint').addEventListener('click', () => {
    leafContent.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' });
    const first = $('#leaf-title', leafContent);
    if (first) { first.setAttribute('tabindex', '-1'); first.focus({ preventScroll: true }); }
  });

  // sideways: a finger or a mouse drags the photograph, a trackpad scrolls it, the arrow keys step
  let gesture = null, dragged = false;
  cover.addEventListener('pointerdown', (e) => {
    if (e.button > 0 || e.target.closest('button') || gal.ids.length < 2 || !leaf.classList.contains('is-open')) return;
    gesture = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId, axis: null, lx: e.clientX, lt: performance.now(), v: 0 };
    dragged = false;
  });
  cover.addEventListener('pointermove', (e) => {
    wake();
    if (!gesture || e.pointerId !== gesture.id) return;
    const dx = e.clientX - gesture.x, dy = e.clientY - gesture.y;
    if (!gesture.axis) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      gesture.axis = Math.abs(dx) > Math.abs(dy) * 1.1 ? 'x' : 'y';
      if (gesture.axis === 'x') { try { cover.setPointerCapture(e.pointerId); } catch (err) { /* fine */ } cover.classList.add('is-dragging'); }
    }
    if (gesture.axis !== 'x') return;
    e.preventDefault();
    dragged = true;
    const now = performance.now();
    gesture.v = (e.clientX - gesture.lx) / Math.max(8, now - gesture.lt);
    gesture.lx = e.clientX; gesture.lt = now;
    const atEnd = (dx > 0 && gal.i === 0) || (dx < 0 && gal.i === gal.ids.length - 1);
    gal.drag = atEnd ? dx * 0.3 : dx;
    placeTrack(false);
  });
  const endGesture = (e) => {
    if (!gesture || (e && e.pointerId !== gesture.id)) return;
    const g = gesture;
    gesture = null;
    cover.classList.remove('is-dragging');
    if (g.axis !== 'x') return;
    const dx = gal.drag;
    if (Math.abs(dx) > coverW() * 0.16 || Math.abs(g.v) > 0.45) stepSlide(dx < 0 || g.v < -0.45 ? 1 : -1);
    else { gal.drag = 0; placeTrack(true); }
  };
  cover.addEventListener('pointerup', endGesture);
  cover.addEventListener('pointercancel', (e) => { if (gesture && e.pointerId === gesture.id) { gesture = null; cover.classList.remove('is-dragging'); gal.drag = 0; placeTrack(true); } });
  cover.addEventListener('click', (e) => { if (dragged) { e.preventDefault(); e.stopPropagation(); dragged = false; } }, true);
  let wheelAcc = 0, wheelLock = 0, wheelIdle = 0;
  cover.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || gal.ids.length < 2) return;
    e.preventDefault();
    wake();
    clearTimeout(wheelIdle);
    if (wheelLock) {
      clearTimeout(wheelLock);
      wheelLock = setTimeout(() => { wheelLock = 0; }, 180);
      return;
    }
    wheelAcc += e.deltaX;
    const atEnd = (wheelAcc < 0 && gal.i === 0) || (wheelAcc > 0 && gal.i === gal.ids.length - 1);
    gal.drag = clamp(-wheelAcc * (atEnd ? 0.3 : 1), -coverW() * 0.4, coverW() * 0.4);
    placeTrack(false);
    if (Math.abs(wheelAcc) > 90 && !atEnd) {
      const d = wheelAcc > 0 ? 1 : -1;
      wheelAcc = 0;
      stepSlide(d);
      wheelLock = setTimeout(() => { wheelLock = 0; }, 180);
    } else {
      wheelIdle = setTimeout(() => { wheelAcc = 0; gal.drag = 0; placeTrack(true); }, 160);
    }
  }, { passive: false });

  // the words on the cover fade almost away when nothing moves, and come back on any movement
  let stillTimer = 0;
  function wake() {
    leaf.classList.remove('is-still');
    clearTimeout(stillTimer);
    if (!page) return;
    stillTimer = setTimeout(() => { if (page && !reduce.matches) leaf.classList.add('is-still'); }, 2500);
  }
  leaf.addEventListener('pointermove', wake);
  leaf.addEventListener('keydown', wake);
  leaf.addEventListener('focusin', wake);

  // down: the page comes up over the cover; the bar at the top arrives once the cover has gone by
  let scrollQueued = false;
  function watchScroll() {
    leaf.classList.toggle('is-past', leaf.classList.contains('is-plain'));
    leaf.classList.remove('has-scrolled');
  }
  leafScroll.addEventListener('scroll', () => {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => {
      scrollQueued = false;
      const y = leafScroll.scrollTop;
      if (y > 24) leaf.classList.add('has-scrolled');
      if (!leaf.classList.contains('is-plain')) leaf.classList.toggle('is-past', y > leafScroll.clientHeight * 0.82);
    });
  }, { passive: true });

  function rowsOf(ids) {
    const target = narrow.matches ? 1 : 2.8;
    const rows = [];
    let row = [], sum = 0;
    for (const id of ids) {
      const ar = S.slides[id].w / S.slides[id].h;
      row.push([id, ar]); sum += ar;
      if (sum >= target * 0.88 || row.length === 3) { rows.push({ row, sum }); row = []; sum = 0; }
    }
    if (row.length) rows.push({ row, sum, last: true });
    return rows;
  }
  const pageEnd = (photos = true) => `<footer class="page-end"><button class="word" type="button" data-back>${esc(t('back'))}</button>${photos ? `<span>${esc(t('endLine'))}</span>` : ''}</footer>`;

  function renderPlace(c) {
    const ids = photosOf(c.id);
    let body;
    if (ids.length) {
      body = `<div class="rows">${rowsOf(ids).map((r) => `<div class="row">${r.row.map(([id, ar]) => {
        const s = S.slides[id];
        return `<figure class="piece" data-ar="${ar.toFixed(4)}"><button type="button" data-slide="${id}" aria-label="${esc(T[lang].madeOf(L(s.place)))}">` +
          `<img src="${imgSrc(s, 1280)}" srcset="${srcset(s)}" sizes="(max-width: 48rem) 94vw, 40vw" width="${s.w}" height="${s.h}" alt="${esc(L(s.alt))}" loading="lazy" decoding="async"></button>` +
          `<figcaption><b>${esc(L(s.place))}</b><span>${esc(L(s.where))}</span></figcaption></figure>`;
      }).join('')}${r.last && r.sum < 2.2 && !narrow.matches ? `<span class="piece piece--rest" aria-hidden="true" data-ar="${(2.8 - r.sum).toFixed(4)}"></span>` : ''}</div>`).join('')}</div>`;
    } else {
      body = `<div class="no-photos"><b>${esc(t('bandNone'))}</b></div>`;
    }
    const b = bookByCountry[c.id];
    const title = L(b.title), name = L(c.name);
    leafContent.className = 'leaf__content place';
    leafContent.innerHTML = `<div class="wrap">
      <header class="place-top">
        <h1 class="page-title" id="leaf-title">${esc(title)}</h1>
        <p class="meta">${name !== title ? `<span>${esc(name)}</span>` : ''}<span>${esc(L(c.date))}</span>${ids.length ? `<span>${esc(T[lang].nPhotos(ids.length))}</span>` : ''}</p>
        <p class="page-lede">${esc(L(c.note))}</p>
        <p class="quiet-line">${esc(t('bookNot'))}</p>
      </header>${body}${pageEnd(ids.length > 0)}</div>`;
    $$('[data-ar]', leafContent).forEach((n) => n.style.setProperty('--ar', n.dataset.ar));
  }

  function renderGuide() {
    const dict = guide.i18n[lang] || guide.i18n.en;
    const slideText = (key) => {
      const m = key.match(/^(sp|sa|sl)_(.+)$/);
      if (!m || !S.slides[m[2]]) return null;
      const s = S.slides[m[2]];
      if (m[1] === 'sp') return L(s.place);
      if (m[1] === 'sa') return L(s.alt);
      return T[lang].madeOf(L(s.place));
    };
    const get = (k) => (dict[k] !== undefined ? dict[k] : (slideText(k) !== null ? slideText(k) : (guide.i18n.en[k] !== undefined ? guide.i18n.en[k] : null)));
    leafContent.className = 'leaf__content guide';
    leafContent.innerHTML = guide.html;
    $$('[data-i18n]', leafContent).forEach((el) => { const v = get(el.dataset.i18n); if (v !== null) el.textContent = v; });
    $$('[data-i18n-html]', leafContent).forEach((el) => { const v = get(el.dataset.i18nHtml); if (v !== null) el.innerHTML = v; });
    $$('[data-i18n-alt]', leafContent).forEach((el) => { const v = get(el.dataset.i18nAlt); if (v !== null) el.alt = v; });
    $$('[data-i18n-aria]', leafContent).forEach((el) => { const v = get(el.dataset.i18nAria); if (v !== null) el.setAttribute('aria-label', v); });
    const walker = document.createTreeWalker(leafContent, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) if (/[–—]/.test(n.nodeValue)) n.nodeValue = clean(n.nodeValue);
    const h1 = $('h1', leafContent);
    if (h1) h1.id = 'leaf-title';
    const meta = $('.guide-top .meta', leafContent);
    if (meta) {
      const facts = document.createElement('p');
      facts.className = 'guide-facts';
      facts.textContent = L(guide.facts);
      meta.after(facts);
    }
    const wrap = $('.wrap', leafContent) || leafContent;
    wrap.insertAdjacentHTML('beforeend', pageEnd());
    $$('[data-ar]', leafContent).forEach((n) => n.style.setProperty('--ar', n.dataset.ar));
    const links = $$('.toc a', leafContent);
    const heads = links.map((a) => leafContent.querySelector(a.getAttribute('href'))).filter(Boolean);
    if ('IntersectionObserver' in window && heads.length) {
      tocObserver = new IntersectionObserver(() => {
        let top = null;
        for (const h of heads) if (h.getBoundingClientRect().top < window.innerHeight * 0.4) top = h;
        links.forEach((a) => (top && a.getAttribute('href') === `#${top.id}` ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
      }, { root: leafScroll, threshold: [0, 1], rootMargin: '0px 0px -55% 0px' });
      heads.forEach((h) => tocObserver.observe(h));
    }
  }

  leafContent.addEventListener('click', (e) => {
    const a = e.target.closest('a, button');
    if (!a) return;
    if (a.hasAttribute('data-back')) { e.preventDefault(); back(); return; }
    if (a.dataset.slide) {
      e.preventDefault();
      const list = $$('[data-slide]', leafContent).map((x) => x.dataset.slide).filter((v, i, arr) => arr.indexOf(v) === i);
      openViewer(a.dataset.slide, list, { from: 'page' });
      return;
    }
    const href = a.getAttribute('href') || '';
    if (href.startsWith('#') && href.length > 1) {
      e.preventDefault();
      const target = leafContent.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' });
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    }
  });

  /* ------------------------------------------------------------ the dive: zoom, then a full-frame dissolve */

  let pageGen = 0, diveTimers = [], diveRing = null, diveTween = null;
  const later = (fn, ms) => { const id = setTimeout(fn, ms); diveTimers.push(id); return id; };
  const ZOOM = 2000, DISSOLVE = 1800;
  function clearDive() {
    diveTimers.forEach(clearTimeout); diveTimers = [];
    if (diveRing) { erase([diveRing]); marks = marks.filter((m) => m !== diveRing); diveRing = null; }
    if (diveTween) { diveTween.cancel(); diveTween = null; }
    [leaf, cover, coverLens].forEach((el) => el.getAnimations().forEach((a) => a.cancel()));
    leaf.classList.remove('is-dissolving');
  }
  // the photograph arrives over the whole window at once: from transparent, softly out of focus
  // and a touch large, to clear, sharp and still
  function dissolve(into, dur) {
    const k = into ? [0, 1] : [1, 0];
    const blur = into ? ['blur(8px)', 'blur(0px)'] : ['blur(0px)', 'blur(8px)'];
    const sc = into ? ['scale(1.04)', 'scale(1)'] : ['scale(1)', 'scale(1.04)'];
    const opts = { duration: dur, easing: SOFT, fill: 'both' };
    const a = cover.animate([{ opacity: k[0] }, { opacity: k[1] }], opts);
    coverLens.animate([{ filter: blur[0], transform: sc[0] }, { filter: blur[1], transform: sc[1] }], opts);
    return a;
  }
  function settleOpen(gen) {
    if (gen !== pageGen) return;
    leaf.classList.remove('is-dissolving');
    leaf.classList.add('is-open');
    [cover, coverLens].forEach((el) => el.getAnimations().forEach((a) => a.cancel()));
    later(() => { if (gen === pageGen) leaf.classList.add('is-captioned'); }, reduce.matches ? 0 : 60);
    if (diveRing) { erase([diveRing]); marks = marks.filter((m) => m !== diveRing); diveRing = null; }
    const target = leaf.classList.contains('is-plain') ? $('#leaf-back') : $('#cover-back');
    target.focus({ preventScroll: true });
    wake();
  }

  function openPage(view, opts = {}) {
    pageGen += 1;
    const gen = pageGen;
    clearDive();
    hideFlights(false);
    const cid = viewCountry(view);
    const ll = placeLL(cid);
    page = view;
    renderLeaf(view, coverFor(cid, opts.cover));
    leafScroll.scrollTop = 0;
    app.inert = true;
    setIndex(false, false);
    clearActive();
    globe.stop();
    live.textContent = T[lang].opening(L(bookByCountry[cid].title));
    const landing = diveTransform(cid);
    ensureTextures(landing);
    if (!diving) state.before = state.z;
    diving = true;
    app.classList.add('is-diving');
    leaf.classList.remove('is-open', 'is-captioned', 'is-dissolving', 'is-still');
    const hasCover = !leaf.classList.contains('is-plain');
    if (opts.animate && !reduce.matches) {
      // 1. the map magnifies slowly into the country while a fine ring tightens on the spot
      moveTo(landing, ZOOM);
      diveRing = penRing(ringD(14), ll);
      marks.push(diveRing);
      drawStroke(diveRing.firstChild, 0, 500);
      diveTween = tween(ZOOM, (e) => { if (diveRing) { diveRing.dataset.s = (6 - 5 * e).toFixed(3); placePen(); } });
      // 2. in the last third of the zoom, the photograph dissolves in over the whole window while
      //    the camera is still moving; the map softens beneath it
      later(() => {
        if (gen !== pageGen) return;
        leaf.hidden = false;
        app.classList.add('is-soft');
        if (!hasCover) {
          leaf.classList.add('is-open');
          leaf.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 800, easing: SOFT }).onfinish = () => settleOpen(gen);
          return;
        }
        // the photograph should be there to dissolve in: wait a moment for it if it is still arriving
        const im = coverTrack.children[gal.i] && coverTrack.children[gal.i].firstChild;
        let started = false;
        const go2 = () => {
          if (gen !== pageGen || started) return;
          started = true;
          leaf.classList.add('is-dissolving');
          dissolve(true, DISSOLVE).onfinish = () => settleOpen(gen);
        };
        if (!im || im.complete) go2();
        else { im.addEventListener('load', go2, { once: true }); im.addEventListener('error', go2, { once: true }); later(go2, 1400); }
      }, hasCover ? Math.round(ZOOM * 0.64) : ZOOM - 300);
    } else {
      moveTo(landing, 0);
      leaf.hidden = false;
      app.classList.add('is-soft');
      if (opts.animate) {
        // reduced motion: a plain fade
        leaf.classList.add('is-open');
        leaf.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: 'ease-out' }).onfinish = () => settleOpen(gen);
      } else {
        settleOpen(gen);
      }
    }
  }

  function closePage(opts = {}) {
    if (!page) return;
    pageGen += 1;
    const gen = pageGen;
    clearDive();
    const cid = viewCountry(page);
    const pin = pinList.find((q) => q.country === cid);
    page = null;
    clearTimeout(stillTimer);
    if (tocObserver) { tocObserver.disconnect(); tocObserver = null; }
    const back0 = state.before || homeTransform();
    let surfaced = false;
    const surface = () => {
      if (surfaced) return;
      surfaced = true;
      diving = false;
      state.before = null;
      app.inert = false;
      app.classList.remove('is-soft');
      moveTo(back0, opts.animate ? 1700 : 0);
      if (opts.animate && !reduce.matches) later(() => app.classList.remove('is-diving'), 500);
      else app.classList.remove('is-diving');
      queueDraw();
      globe.start();
      if (pin && opts.focus !== false) pin.el.querySelector('.book').focus({ preventScroll: true });
    };
    const done = () => {
      if (gen !== pageGen) return;
      leaf.hidden = true;
      leaf.classList.remove('is-open', 'is-captioned', 'is-dissolving', 'is-past', 'is-still', 'has-scrolled');
      [leaf, cover, coverLens].forEach((el) => el.getAnimations().forEach((a) => a.cancel()));
      leafContent.textContent = '';
      coverTrack.textContent = '';
    };
    const atCover = !leaf.classList.contains('is-plain') && leafScroll.scrollTop < 80;
    if (opts.animate && !reduce.matches && atCover) {
      // the same dissolve, reversed and a little quicker, then the map draws back out
      leaf.classList.remove('is-captioned', 'is-open');
      leaf.classList.add('is-dissolving');
      app.classList.remove('is-soft');
      const d = 1300;
      dissolve(false, d).onfinish = () => { done(); surface(); };
      later(() => { if (gen === pageGen) surface(); }, Math.round(d * 0.62));
    } else if (opts.animate) {
      leaf.animate([{ opacity: 1 }, { opacity: 0 }], { duration: reduce.matches ? 200 : 420, easing: 'ease-in-out', fill: 'forwards' }).onfinish = () => { done(); surface(); };
    } else {
      done();
      surface();
    }
  }

  /* ------------------------------------------------------------ a photograph, larger, with how it was made */

  let photo = null, photoList = indexOrder, photoFrom = 'index';
  const vImg = document.createElement('img');
  $('.viewer__frame').appendChild(vImg);
  function slideFacts(s) {
    const set = [s.focal, s.aperture, s.shutter, s.iso && `ISO ${s.iso}`].filter(Boolean);
    let h = '';
    if (s.camera) h += `<dt>${esc(t('camera'))}</dt><dd>${esc(s.camera)}</dd>`;
    if (s.lens) h += `<dt>${esc(t('lens'))}</dt><dd>${esc(s.lens)}</dd>`;
    if (set.length) h += `<dt>${esc(t('settings'))}</dt><dd class="facts__set">${set.map((v) => `<span>${esc(v)}</span>`).join('')}</dd>`;
    if (s.best) h += `<dt>${esc(t('best'))}</dt><dd>${esc(L(s.best))}</dd>`;
    return h ? `<dl class="facts" aria-label="${esc(t('made'))}">${h}</dl>` : '';
  }
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
    const i = photoList.indexOf(photo);
    const b = bookByCountry[s.country];
    const seeAll = b && page !== b.view ? `<button type="button" class="word viewer__go" data-view="${b.view}" data-cover="${photo}">${esc(L(b.title))}: ${esc(t('seePhotos'))}</button>` : '';
    $('#viewer-cap').innerHTML =
      `<h2 id="viewer-title">${esc(L(s.place))}</h2>` +
      `<p class="meta">${esc(L(s.where))}</p>` +
      `<p class="viewer__ll">${esc(coords(s.ll))}</p>` +
      (s.note ? `<p class="viewer__note">${esc(L(s.note))}</p>` : '') +
      slideFacts(s) + seeAll;
    $('#viewer-count').textContent = photoList.length > 1 ? T[lang].ofN(i + 1, photoList.length) : '';
    $('#viewer-prev').hidden = $('#viewer-next').hidden = photoList.length < 2;
  }
  function showViewer(id, list, from) {
    photo = id;
    photoList = list && list.includes(id) ? list : indexOrder;
    photoFrom = from || 'index';
    renderViewer();
    const wasHidden = viewer.hidden;
    viewer.hidden = false;
    app.inert = true;
    leaf.inert = true;
    if (wasHidden) requestAnimationFrame(() => $('#viewer-close').focus({ preventScroll: true }));
  }
  function hideViewer() {
    if (!photo) return;
    const id = photo;
    photo = null;
    viewer.hidden = true;
    leaf.inert = false;
    app.inert = !!page;
    if (page) {
      const b = leafContent.querySelector(`[data-slide="${id}"]`);
      (b || $('#leaf-back')).focus({ preventScroll: false });
    } else {
      setActive({ slide: id, from: 'viewer' });
      const ll = S.slides[id].ll;
      if (!inView(ll, 0.12) || pxPerDeg() < 36) centerOn(ll, Math.max(state.z.k, 40 / state.S0), 1000);
      mapEl.focus({ preventScroll: true });
    }
  }
  function step(d) {
    const i = photoList.indexOf(photo);
    const n = photoList.length;
    photo = photoList[(i + d + n) % n];
    renderViewer();
    try { history.replaceState({ ...(history.state || {}), wc: true, photo, page }, '', `#photo-${photo}`); } catch (e) { /* fine */ }
  }
  $('#viewer-prev').addEventListener('click', () => step(-1));
  $('#viewer-next').addEventListener('click', () => step(1));
  $('#viewer-close').addEventListener('click', () => back());
  $('#viewer-cap').addEventListener('click', (e) => {
    const g = e.target.closest('.viewer__go');
    if (!g) return;
    const view = g.dataset.view, cov = g.dataset.cover;
    hideViewer();
    clearActive();
    try { history.replaceState({ wc: true, page: view, cover: cov }, '', `#${view}`); } catch (err) { /* fine */ }
    if (page) closePage({ animate: false, focus: false });
    openPage(view, { animate: true, cover: cov });
  });
  let swipe = null;
  viewer.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') swipe = { x: e.clientX, y: e.clientY }; });
  viewer.addEventListener('pointerup', (e) => {
    if (!swipe) return;
    const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
    swipe = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) step(dx < 0 ? 1 : -1);
  });

  /* ------------------------------------------------------------ the Flights view: the globe on the left, his journeys on the right */

  const flCanvas = $('#flights-canvas');
  const flStage = $('#flights-stage');
  const journeysEl = $('#journeys');
  let routes = null, bigGlobe = null, flightsOpen = false;
  const placeName = (cid) => (bookByCountry[cid] ? L(bookByCountry[cid].title) : (countries[cid] ? L(countries[cid].name) : cid));
  function buildRoutes() {
    routes = WC.routes(S, placeLL, placeName);
    if (bigGlobe) bigGlobe.o.routes = routes;
  }
  function renderJourneys() {
    const js = S.journeys || [];
    const places = new Set(js.flatMap((j) => j.countries || []));
    $('#flights-count').textContent = T[lang].journeysCount(js.length, places.size);
    journeysEl.innerHTML = js.map((j) => {
      const stops = (j.countries || []).filter((cid) => countries[cid]).map((cid) => {
        const b = bookByCountry[cid];
        const s = b && b.photo ? S.slides[b.photo] : null;
        const title = L(b.title), name = L(countries[cid].name);
        return `<li><button type="button" class="stop" data-view="${b.view}" data-country="${cid}">` +
          (s ? `<img src="${imgSrc(s, 640)}" alt="" loading="lazy" decoding="async" width="${s.w}" height="${s.h}">` : '') +
          `<span class="stop__name">${esc(title)}${name !== title ? `<small>${esc(name)}</small>` : ''}</span></button></li>`;
      }).join('');
      return `<li class="journey" data-j="${esc(j.id)}" aria-label="${esc(T[lang].journeyAria(L(j.date)))}"><p class="journey__date">${esc(L(j.date))}</p><ul class="journey__stops">${stops}</ul></li>`;
    }).join('');
  }
  let unfocusTimer = 0;
  const focusJourney = (id) => { clearTimeout(unfocusTimer); $$('.journey', journeysEl).forEach((li) => li.classList.toggle('is-on', li.dataset.j === id)); flightsEl.classList.toggle('has-focus', !!id); if (bigGlobe) bigGlobe.focus(id); };
  const unfocusSoon = () => { clearTimeout(unfocusTimer); unfocusTimer = setTimeout(() => focusJourney(null), 260); };
  journeysEl.addEventListener('pointerover', (e) => { const li = e.target.closest('.journey'); if (li) focusJourney(li.dataset.j); });
  journeysEl.addEventListener('pointerleave', unfocusSoon);
  journeysEl.addEventListener('focusin', (e) => { const li = e.target.closest('.journey'); if (li) focusJourney(li.dataset.j); });
  journeysEl.addEventListener('focusout', (e) => { if (!journeysEl.contains(e.relatedTarget)) unfocusSoon(); });
  journeysEl.addEventListener('click', (e) => {
    const b = e.target.closest('.stop');
    if (!b) return;
    // a place in a journey: the Flights view closes and the map dives straight into it
    const view = b.dataset.view;
    try { history.replaceState({ wc: true, page: view, cover: null }, '', `#${view}`); } catch (err) { /* fine */ }
    hideFlights(false);
    openPage(view, { animate: true });
  });

  function sizeBigGlobe() {
    const r = flStage.getBoundingClientRect();
    bigGlobe.resize(Math.max(1, r.width), Math.max(1, r.height));
  }
  function showFlights(animate) {
    if (flightsOpen) return;
    flightsOpen = true;
    if (!bigGlobe) {
      bigGlobe = new WC.FlightsGlobe(flCanvas, {
        land: globe.o.land, travel: globe.o.travel, routes, reduce: () => reduce.matches,
        font: () => (lang === 'zh' ? '500 14px "Noto Sans TC", sans-serif' : '500 14px "Alegreya Sans", sans-serif'),
      });
    }
    bigGlobe.o.land = globe.o.land; bigGlobe.o.travel = globe.o.travel;
    // the globe turns to face the way the small one did
    bigGlobe.rot = [globe.lon, -18];
    bigGlobe.focus(null);
    flightsEl.hidden = false;
    app.inert = true;
    sizeBigGlobe();
    globe.stop();
    bigGlobe.start();
    const small = $('#globe-canvas');
    if (animate && !reduce.matches) {
      // the small globe moves and grows out of its corner into the large one
      const a = small.getBoundingClientRect();
      const b = flCanvas.getBoundingClientRect();
      const R = Math.min(b.width, b.height) * 0.42;
      const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
      const r = a.width * 0.44, sx = a.left + a.width / 2, sy = a.top + a.height * 0.46;
      flCanvas.style.setProperty('--ox', `${(b.width / 2).toFixed(1)}px`);
      flCanvas.style.setProperty('--oy', `${(b.height / 2).toFixed(1)}px`);
      small.classList.add('is-away');
      flCanvas.animate([{ transform: `translate(${(sx - cx).toFixed(1)}px, ${(sy - cy).toFixed(1)}px) scale(${(r / R).toFixed(4)})` }, { transform: 'none' }], { duration: 950, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
      $('.flights__sheet').animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: 'ease-out' });
      $$('.flights__side, .flights__back, .flights__help').forEach((el, i) => el.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 650, delay: 380 + i * 60, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'backwards' }));
    }
    requestAnimationFrame(() => $('#flights-back').focus({ preventScroll: true }));
  }
  function hideFlights(animate) {
    if (!flightsOpen) return;
    flightsOpen = false;
    clearTimeout(unfocusTimer);
    const small = $('#globe-canvas');
    const finish = () => {
      if (flightsOpen) return;
      flightsEl.hidden = true;
      [flCanvas, $('.flights__sheet'), ...$$('.flights__side, .flights__back, .flights__help')].forEach((el) => el.getAnimations().forEach((a) => a.cancel()));
      small.classList.remove('is-away');
      if (bigGlobe) { bigGlobe.stop(); bigGlobe.focus(null); }
      $$('.journey.is-on', journeysEl).forEach((li) => li.classList.remove('is-on'));
      flightsEl.classList.remove('has-focus');
    };
    if (!page) { app.inert = false; globe.lon = bigGlobe ? bigGlobe.rot[0] : globe.lon; globe.start(); }
    if (animate && !reduce.matches && !page) {
      const a = small.getBoundingClientRect();
      const b = flCanvas.getBoundingClientRect();
      const R = Math.min(b.width, b.height) * 0.42 * (bigGlobe ? bigGlobe.zoom : 1);
      const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
      const r = a.width * 0.44, sx = a.left + a.width / 2, sy = a.top + a.height * 0.46;
      $$('.flights__side, .flights__back, .flights__help').forEach((el) => el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, easing: 'ease-in', fill: 'forwards' }));
      $('.flights__sheet').animate([{ opacity: 1 }, { opacity: 0 }], { duration: 520, delay: 200, easing: 'ease-in-out', fill: 'forwards' });
      flCanvas.animate([{ transform: 'none' }, { transform: `translate(${(sx - cx).toFixed(1)}px, ${(sy - cy).toFixed(1)}px) scale(${(r / R).toFixed(4)})` }], { duration: 720, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'forwards' }).onfinish = () => { finish(); $('#globe').focus({ preventScroll: true }); };
    } else if (animate) {
      flightsEl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' }).onfinish = () => { flightsEl.getAnimations().forEach((x) => x.cancel()); finish(); if (!page) $('#globe').focus({ preventScroll: true }); };
    } else finish();
  }
  $('#globe').addEventListener('click', () => {
    if (flightsOpen) return;
    try { history.pushState({ wc: true, flights: true }, '', '#flights'); } catch (e) { /* fine */ }
    showFlights(true);
  });
  $('#flights-back').addEventListener('click', () => back());

  /* ------------------------------------------------------------ history: every page and photograph has an address */

  function parse(hash) {
    const h = decodeURIComponent((hash || '').replace(/^#/, ''));
    const st = history.state || {};
    if (h === 'flights') return { page: null, photo: null, flights: true };
    if (h.startsWith('photo-') && S.slides[h.slice(6)]) return { page: validView(st.page) ? st.page : null, photo: h.slice(6), cover: st.cover };
    if (validView(h)) return { page: h, photo: null, cover: st.cover };
    return { page: null, photo: null };
  }
  function apply(want, animate) {
    if (want.photo !== photo && photo) hideViewer();
    if (!want.flights && flightsOpen) hideFlights(animate && !want.page);
    if (want.page !== page) {
      if (page) closePage({ animate: animate && !want.page, focus: !want.page && !want.flights });
      if (want.page) openPage(want.page, { animate, cover: want.cover });
    }
    if (want.flights && !flightsOpen) showFlights(animate);
    if (want.photo && want.photo !== photo) showViewer(want.photo, photoList, photoFrom);
  }
  function go(view, coverId) {
    if (page === view || diving) return;
    try { history.pushState({ wc: true, page: view, cover: coverId || null }, '', `#${view}`); } catch (e) { /* fine */ }
    if (page) closePage({ animate: false, focus: false });
    openPage(view, { animate: true, cover: coverId });
  }
  function openViewer(id, list, opts = {}) {
    try { history.pushState({ wc: true, page, cover: pageCover, photo: id }, '', `#photo-${id}`); } catch (e) { /* fine */ }
    showViewer(id, list, opts.from);
  }
  function back() {
    if (history.state && history.state.wc) history.back();
    else {
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* fine */ }
      apply({ page: null, photo: null }, true);
    }
  }
  window.addEventListener('popstate', () => apply(parse(location.hash), true));
  $('#leaf-back').addEventListener('click', () => back());
  $('#cover-back').addEventListener('click', () => back());
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (photo || page || flightsOpen) { e.preventDefault(); back(); }
      else if (indexEl.classList.contains('is-open')) { e.preventDefault(); setIndex(false); }
      return;
    }
    // the gallery's arrow keys, while the cover is in view
    if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && page && !photo && !cover.hidden && leaf.classList.contains('is-open') && leafScroll.scrollTop < leafScroll.clientHeight * 0.5) {
      if (e.target.closest && e.target.closest('input, textarea')) return;
      e.preventDefault();
      wake();
      stepSlide(e.key === 'ArrowRight' ? 1 : -1);
    }
  });
  viewer.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); step(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); step(-1); }
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
    clearActive();
    renderPins();
    renderIndex();
    renderJourneys();
    buildRoutes();
    if (page) {
      const top = leafScroll.scrollTop;
      renderLeaf(page, pageCover);
      leafScroll.scrollTop = top;
    }
    if (photo) renderViewer();
    state.settle = 4;
    queueDraw();
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.lang button');
    if (b) setLang(b.dataset.lang);
  });

  /* ------------------------------------------------------------ the sheet's fibres, and the swatches */

  let fontsReady = false;
  function makeMaterials() {
    const set = (name, c) => c.toBlob((b) => { if (b) html.style.setProperty(name, `url(${URL.createObjectURL(b)})`); });
    set('--washi', WC.washiTile(512, 7));
    // brush swatches for the key and the guide's rules, painted with the map's own two pigments
    const dab = (rgb, w, h, seed, body = 0.42) => {
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const g = c.getContext('2d');
      const { NH, NL, NM } = WC.noise();
      const id = g.createImageData(w, h);
      for (let x = 0; x < w; x++) {
        const nx = x / (w - 1);
        const taper = Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, nx * 1.04 - 0.02))), 0.45);
        const wob = NM[((seed * 7) & 511) * 512 + ((x >> 1) & 511)] - 0.5;
        const th = 0.5 * (0.22 + 0.78 * taper) * (0.92 + 0.3 * (NL[((seed * 3) & 511) * 512 + ((x >> 1) & 511)] - 0.5));
        const cy = 0.5 + wob * 0.18;
        for (let y = 0; y < h; y++) {
          const d = Math.abs(y / (h - 1) - cy) / Math.max(0.02, th);
          const edgeN = (NM[((y + seed) & 511) * 512 + ((x >> 1) & 511)] - 0.5) * 0.16 + (NH[((y + seed) & 511) * 512 + (x & 511)] - 0.5) * 0.025;
          let a = 0;
          if (d < 1 + edgeN) {
            const rim = Math.exp(-Math.pow((d - 0.9) / 0.1, 2)) * 0.32;
            const streak = 0.78 + 0.22 * NL[(((y * 6) + seed * 11) & 511) * 512 + ((x >> 3) & 511)];
            const blot = 0.84 + 0.32 * NL[(((y + seed) >> 1) & 511) * 512 + ((x >> 1) & 511)];
            a = (body * blot * streak + rim) * (0.9 + 0.2 * NH[((y * 2 + seed) & 511) * 512 + ((x * 2) & 511)]);
            const soft = 1 + edgeN - d;
            if (soft < 0.06) a *= soft / 0.06;
          }
          const i = (y * w + x) * 4;
          id.data[i] = rgb[0]; id.data[i + 1] = rgb[1]; id.data[i + 2] = rgb[2]; id.data[i + 3] = Math.max(0, Math.min(255, a * 255));
        }
      }
      g.putImageData(id, 0, 0);
      return c;
    };
    set('--dab-glaze', dab([226, 132, 70], 120, 36, 3, 0.55));
    set('--dab-sea', dab([92, 112, 160], 720, 150, 9, 0.24));
    set('--stroke', dab([70, 92, 148], 520, 22, 21, 0.5));
  }

  /* ------------------------------------------------------------ the small globe */

  const globe = new WC.Globe($('#globe-canvas'), { land: null, travel: null, flights: [], reduce: () => reduce.matches });
  function sizeGlobe() { globe.resize(narrow.matches ? 92 : 176); }

  /* ------------------------------------------------------------ start */

  function featsFor(w) {
    const geoms = w.objects.countries.geometries;
    const out = {};
    for (const [cid, iso] of Object.entries(ISO)) {
      const g = geoms.find((x) => String(x.id).padStart(3, '0') === iso);
      if (!g) continue;
      let f = topojson.feature(w, g);
      // France is marked where he went: mainland and Corsica, not the overseas departments
      if (cid === 'france' && f.geometry.type === 'MultiPolygon') {
        f = { ...f, geometry: { type: 'MultiPolygon', coordinates: f.geometry.coordinates.filter((poly) => { const [lon, lat] = d3.geoCentroid({ type: 'Polygon', coordinates: poly }); return lon > -6 && lon < 11 && lat > 40 && lat < 52; }) } };
      }
      out[cid] = f;
    }
    return out;
  }
  // the land without Antarctica: the sheet's south is open sea, deepening to the edge
  const notSouth = (g) => String(g.id).padStart(3, '0') !== '010';
  const landOf = (w) => topojson.merge(w, w.objects.countries.geometries.filter(notSouth));
  const coastOf = (w) => topojson.mesh(w, w.objects.countries, (a, b) => a === b && notSouth(a));
  const bordersOf = (w) => topojson.mesh(w, w.objects.countries, (a, b) => a !== b);

  async function loadWorld() {
    const w110 = await fetch('../vendor/countries-110m.json').then((r) => r.json());
    const land110 = landOf(w110);
    state.coast110 = pathDeg(coastOf(w110));
    state.borders110 = pathDeg(bordersOf(w110));
    state.landFill110 = pathDeg(land110);
    const f110 = featsFor(w110);
    globe.o.land = land110;
    globe.o.travel = Object.values(f110);
    sizeGlobe();
    queueDraw();
    const reliefReady = loadImg('../vendor/relief/SR_50M-4096.jpg').then((im) => { state.relief = im; }).catch(() => {});
    const depthReady = loadDepth();
    const w50 = await fetch('../vendor/countries-50m.json').then((r) => r.json());
    state.land50 = landOf(w50);
    state.coast50 = pathDeg(coastOf(w50));
    state.borders50 = pathDeg(bordersOf(w50));
    state.feats = featsFor(w50);
    state.travel = Object.values(state.feats);
    const isos = new Set(Object.values(ISO));
    const id3 = (g) => String(g.id).padStart(3, '0');
    state.seams = topojson.mesh(w50, w50.objects.countries, (a, b) => a !== b && isos.has(id3(a)) && isos.has(id3(b)));
    queueDraw();
    await Promise.all([reliefReady, depthReady]);
    paintBase();
  }

  function start() {
    applyWords();
    renderIndex();
    renderJourneys();
    buildRoutes();
    globe.o.flights = routes.all;
    setIndex(false, false);
    sizeMap();
    renderPins();
    makeMaterials();
    moveTo(homeTransform(), 0);
    state.settle = 6;
    queueDraw();
    if (document.fonts && document.fonts.load) {
      Promise.all([document.fonts.load('italic 400 15px "Alegreya Sans"'), document.fonts.load('500 12px "Alegreya Sans"'), document.fonts.load('400 20px "Alegreya"')]).then(() => { fontsReady = true; measured.clear(); measurePins(); state.settle = 4; queueDraw(); }).catch(() => { fontsReady = true; });
    } else fontsReady = true;

    const want = parse(location.hash);
    loadWorld().then(() => {
      if (!page && !flightsOpen) globe.start();
      if (flightsOpen && bigGlobe) { bigGlobe.o.land = globe.o.land; bigGlobe.o.travel = globe.o.travel; bigGlobe.kick(); }
    }).catch(() => {});

    // a page, a photograph or the Flights view named in the address opens directly
    if (want.page || want.photo || want.flights) {
      try { history.replaceState({ wc: false, page: want.page, photo: want.photo }, '', location.href); } catch (e) { /* fine */ }
      apply(want, false);
    }
    let rz = 0;
    window.addEventListener('resize', () => {
      cancelAnimationFrame(rz);
      rz = requestAnimationFrame(() => {
        const c = invertLL(state.W / 2, state.H / 2);
        const k = state.z.k;
        sizeMap();
        sizeGlobe();
        const b = baseXY([c[1], c[0]]);
        state.z = d3.zoomIdentity.translate(state.W / 2 - b[0] * k, state.H / 2 - b[1] * k).scale(k);
        sel.call(zoom.transform, state.z);
        state.settle = 4;
        queueDraw();
        if (page && gal.ids.length) { gal.drag = 0; placeTrack(false); }
        if (flightsOpen && bigGlobe) sizeBigGlobe();
      });
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { globe.stop(); if (bigGlobe) bigGlobe.stop(); }
      else if (flightsOpen && bigGlobe) bigGlobe.start();
      else if (!page) globe.start();
    });
    updateZoomButtons();
  }
  WC.state = state; // for inspection in the console
  start();
})();

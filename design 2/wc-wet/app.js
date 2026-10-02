/* tuan photography 陳亮元 · design 2 · "Wet in wet"
   The home page is a world map painted loosely, wet in wet (paint.js): a sea that deepens from
   cerulean to ultramarine, land in drifting sienna and sap green, the sixteen countries travelled
   glazed in quinacridone rose. The painting is made once per zoom band and laid on a canvas that
   d3-zoom moves; a whisper of pencil and the lettering are drawn over it live.
   Design 1's books stand at the sixteen places. Choosing one dives: the map magnifies into the
   country and, in the last third of the zoom, the photographs dissolve in over the whole frame,
   a full-bleed gallery of that country; down is its guide or its photographs page. The small
   globe in the corner grows into the Flights view, his journeys beside a globe to turn. */
(() => {
  'use strict';

  const S = window.SITE;
  const WC = window.WC;
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

  /* ------------------------------------------------------------ words */

  const T = {
    en: {
      ig: 'Instagram',
      mapLabel: 'Map of the places travelled',
      mapHint: 'Drag, or use the arrow keys, to move the map. Scroll, or press plus and minus, to zoom. Tab moves through the books.',
      hintGuide: 'Scroll for the guide', hintPhotos: 'Scroll for the photographs',
      journeys: 'Flights', journeysLine: (j, p) => `${j} journeys, ${p} places`, diveTo: (p) => `${p}: go to it on the map`,
      flightsOpen: 'Flights are open.', globeDrag: 'A globe of the flights. Drag, or use the arrow keys, to turn it.',
      zoomGroup: 'Zoom', zoomIn: 'Zoom in', zoomOut: 'Zoom out', world: 'Whole map', credit: 'Map: Natural Earth',
      flights: 'Flights', globeLabel: 'Flights: open the globe of his journeys',
      keyLabel: 'Key', keyBeen: 'Travelled', keyNot: 'Not yet',
      indexTitle: 'Photographs', indexOpen: 'Show the photographs', indexClose: 'Close',
      count: (n, p) => `${n} photographs from ${p} places`,
      seePhotos: 'See the photographs',
      prev: 'Previous', next: 'Next',
      camera: 'Camera', lens: 'Lens', settings: 'Settings',
      ofN: (i, n) => `${i} of ${n}`,
      madeOf: (p) => `${p}: how this was made`,
      lang: 'Language', site: 'Site',
      nPhotos: (n) => (n === 1 ? '1 photograph' : `${n} photographs`),
      seas: { pacific: 'Pacific Ocean', indian: 'Indian Ocean', atlantic: 'Atlantic Ocean', southern: 'Southern Ocean' },
      opening: (p) => `${p} is open.`,
      endLine: 'Every photograph here is his own, made on the trip.',
      bookAria: (p, s) => `${p}: ${s}`,
    },
    zh: {
      ig: 'Instagram',
      mapLabel: '走過的地方地圖',
      mapHint: '拖曳或用方向鍵移動地圖；捲動，或按加號、減號縮放。Tab 鍵逐一走過每本書。',
      hintGuide: '往下看攻略', hintPhotos: '往下看照片',
      journeys: '飛過的航線', journeysLine: (j, p) => `${j} 段旅程，${p} 個地方`, diveTo: (p) => `${p}：在地圖上前往`,
      flightsOpen: '已打開飛過的航線。', globeDrag: '飛過的航線，畫在地球上。拖曳或用方向鍵轉動它。',
      zoomGroup: '縮放', zoomIn: '放大', zoomOut: '縮小', world: '整張地圖', credit: '地圖：Natural Earth',
      flights: '飛過的航線', globeLabel: '飛過的航線：打開旅程地球',
      keyLabel: '圖例', keyBeen: '去過', keyNot: '還沒去',
      indexTitle: '照片', indexOpen: '顯示照片', indexClose: '關閉',
      count: (n, p) => `${p} 個地方，${n} 張照片`,
      seePhotos: '看照片',
      prev: '上一張', next: '下一張',
      camera: '相機', lens: '鏡頭', settings: '參數',
      ofN: (i, n) => `第 ${i} 張，共 ${n} 張`,
      madeOf: (p) => `${p}：這張怎麼拍`,
      lang: '語言', site: '網站',
      nPhotos: (n) => `${n} 張照片`,
      seas: { pacific: '太平洋', indian: '印度洋', atlantic: '大西洋', southern: '南冰洋' },
      opening: (p) => `已打開${p}。`,
      endLine: '這裡每張照片都是他自己在旅途中拍的。',
      bookAria: (p, s) => `${p}：${s}`,
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
  const placeLL = (cid) => (cid === guide.country ? guide.ll : countries[cid].ll);
  const indexOrder = order.flatMap((c) => c.photos.filter((id) => S.slides[id]));
  const coverFor = (cid, want) => {
    if (want && S.slides[want] && S.slides[want].country === cid) return want;
    const b = bookByCountry[cid];
    return b.photo || countries[cid].photos[0] || null;
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

  /* ------------------------------------------------------------ elements */

  const html = document.documentElement;
  const app = $('#app');
  const mapEl = $('#map');
  const canvas = $('#paint');
  const ctx = canvas.getContext('2d');
  const pinsEl = $('#pins');
  const penEl = $('#pen');
  const leaf = $('#leaf');
  const leafScroll = $('#leaf-scroll');
  const leafContent = $('#leaf-content');
  const cover = $('#cover');
  const viewer = $('#viewer');
  const live = $('#live');
  const indexEl = $('#index');
  const indexBody = $('#index-body');
  const indexScroll = $('#index-scroll');
  const SVGNS = 'http://www.w3.org/2000/svg';

  /* ------------------------------------------------------------ the map's frame */

  // an equirectangular plate centred on 10°E, so the relief image lies straight on it and the
  // Pacific seam falls where nothing he visited is
  const LON0 = 10, LAT_N = 90, LAT_S = -90;
  const R0 = 8; // texture px per degree of the whole-world painting
  const state = {
    W: 1, H: 1, dpr: 1, S0: 1,
    z: d3.zoomIdentity,
    w110: null, w50: null,
    land110: null, land50: null, travel: [], seams: null,
    coast110: null, coast50: null, borders50: null, landFill110: null,
    feats: {},
    relief: null, reliefFine: null,
    base: null, regions: [], job: null,
    drawQueued: false, settle: 0,
    before: null,
    floor: null,
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
    // the painting always fills the window, edge to edge: never zoomed out past the sheet
    state.kMin = Math.max(1, state.H / ((LAT_N - LAT_S) * state.S0));
    zoom.scaleExtent([state.kMin, 160]).extent([[0, 0], [state.W, state.H]])
      .translateExtent([[0, state.H / 2 - LAT_N * state.S0], [state.W, state.H / 2 - LAT_S * state.S0]]);
    penEl.setAttribute('viewBox', `0 0 ${state.W} ${state.H}`);
  }

  /* ------------------------------------------------------------ the painting, by zoom band */

  const bandOf = (p) => {
    const need = p * Math.min(1.5, state.dpr) * 0.85;
    return need <= R0 ? 0 : Math.ceil(2 * Math.log2(need / R0));
  };
  const resOf = (b) => R0 * Math.pow(2, b / 2);
  // the view in world degrees (u east of 10°E, v = -latitude)
  function viewRect(z) {
    const p = pxPerDeg(z);
    const u0 = (z.invertX(0) - state.W / 2) / state.S0, v0 = (z.invertY(0) - state.H / 2) / state.S0;
    return { u0, v0, u1: u0 + state.W / p, v1: v0 + state.H / p };
  }
  const covers = (t, v) => t.u0 <= v.u0 + 0.0001 && t.v0 <= v.v0 + 0.0001 && t.u0 + t.w / t.r >= v.u1 - 0.0001 && t.v0 + t.h / t.r >= v.v1 - 0.0001;
  const paintEnv = {
    LON0, LAT_N, LAT_S,
    land: () => state.land50,
    travel: () => state.travel,
    seams: () => state.seams,
    relief: (r) => (r >= 22 && state.reliefFine ? state.reliefFine : state.relief),
    floor: () => state.floor,
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
      // the finer relief, for close dives, arrives quietly once the first painting is up (not on phones)
      if (!narrow.matches) setTimeout(loadFineRelief, 1200);
    } catch (e) { /* the placeholder wash stays */ }
  }

  let settleTimer = 0, holdPaint = false;
  function ensureTextures(z) {
    if (!state.base) return;
    const p = pxPerDeg(z);
    const b = bandOf(p);
    if (b === 0) return;
    const r = resOf(b);
    const v = viewRect(z);
    const fit = state.regions.find((t) => t.b === b && covers(t, v));
    if (fit) { fit.used = performance.now(); return; }
    if (state.job && state.job.b === b && covers(state.job, v)) return;
    if (state.job) state.job.cancelled = true;
    // the view and a margin around it, clamped to the sheet, within a pixel budget
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
    if (job.w * job.h > 6e6) return; // a sliver of world at extreme zoom: the coarser painting serves
    state.job = job;
    if (r >= 22 && !state.reliefFine && !narrow.matches) loadFineRelief();
    WC.paint(job, paintEnv).then((c) => {
      if (state.job === job) state.job = null;
      featherEdges(c);
      state.regions.push({ canvas: c, b, r, u0: job.u0, v0: job.v0, w: job.w, h: job.h, ready: performance.now(), used: performance.now() });
      // keep a few; drop the least recently used
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
  function loadFineRelief() {
    if (state.reliefFineLoading) return;
    state.reliefFineLoading = true;
    const im = new Image();
    im.src = '../vendor/relief/SR_50M-10800.jpg';
    im.decode().then(() => { state.reliefFine = im; }).catch(() => {});
  }

  /* ------------------------------------------------------------ drawing a frame */

  const PAPER = 'rgb(251, 250, 245)';
  const INK = (a) => `rgba(52, 44, 40, ${a})`;
  const PENCIL = (a) => `rgba(92, 88, 82, ${a})`;
  const SEAS = [
    { id: 'pacific', ll: [12, 168] },
    { id: 'indian', ll: [-26, 78] },
    { id: 'atlantic', ll: [22, -44] },
    { id: 'southern', ll: [-58, 40] },
  ];

  /* every other country, lettered quietly in italic, by importance and zoom */
  let names = [];
  const nameWidth = new Map();
  function prepareNames() {
    const CN = window.COUNTRY_NAMES || {};
    const his = new Set(Object.values(ISO));
    names = Object.entries(CN)
      .filter(([id, n]) => !his.has(id) && n.at && n.en)
      .map(([id, n]) => ({ id, en: n.en, zh: n.zh || n.en, at: [n.at[1], n.at[0]], rank: n.rank || 6, min: n.min || 6 }))
      .sort((a, b) => a.rank - b.rank || a.min - b.min);
  }
  // Natural Earth's label zoom (web-map levels) as this map's pixels per degree
  const minPx = (m) => (256 * Math.pow(2, m)) / 360 * 0.46;
  function nameFont(n, zh) {
    const big = n.rank <= 2 ? 1 : n.rank <= 4 ? 0 : -1;
    return zh
      ? { font: `400 ${big > 0 ? 12.5 : big === 0 ? 11.5 : 11}px "Noto Sans TC", sans-serif`, ls: big > 0 ? 3 : 2 }
      : { font: `italic 400 ${big > 0 ? 14 : big === 0 ? 12.5 : 11.5}px "Alegreya Sans", sans-serif`, ls: big > 0 ? 1.2 : 0.5 };
  }
  const hits = (a, list) => { for (const b of list) if (a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1]) return true; return false; };

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
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, W, H);

    // before the painting is ready (and while it fades in): a flat first wash, laid in
    const baseA = state.base ? Math.min(1, (now - state.base.ready) / 700) : 0;
    if (baseA < 1 && state.landFill110) {
      ctx.setTransform(dpr * p, 0, 0, dpr * p, dpr * X0, dpr * Y0);
      ctx.fillStyle = 'rgb(206, 226, 240)';
      ctx.fillRect(-180, -LAT_N, 360, LAT_N - LAT_S);
      ctx.fillStyle = 'rgb(242, 238, 226)';
      ctx.fill(state.landFill110);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    // the painting: the whole sheet, then any finer regional paintings over it
    if (state.base) {
      const c = 2 * Math.log2(Math.max(1e-6, (p * Math.min(1.5, dpr) * 0.85) / R0));
      const list = [state.base, ...state.regions.slice().sort((a, b) => a.r - b.r)];
      for (const tx of list) {
        let a = Math.min(1, (now - tx.ready) / 700);
        if (now - tx.ready < 720) again = true;
        // a finer painting than the zoom needs is fine; one far finer (zoomed well back out) fades away
        if (tx.b > 0) a *= c >= tx.b - 1.2 ? 1 : clamp(1 + (c - tx.b + 1.2) / 1.6, 0, 1);
        if (a <= 0.01) continue;
        // the world goes round: while a long move swings past the Pacific seam, the sheet repeats
        for (const wrap of [0, -360, 360]) {
          const dx = X0 + (tx.u0 + wrap) * p, dy = Y0 + tx.v0 * p, sc = p / tx.r;
          const sx0 = Math.max(0, -dx / sc), sy0 = Math.max(0, -dy / sc);
          const sx1 = Math.min(tx.w, (W - dx) / sc), sy1 = Math.min(tx.h, (H - dy) / sc);
          if (sx1 <= sx0 || sy1 <= sy0) continue;
          ctx.globalAlpha = a;
          ctx.imageSmoothingQuality = sc < 1 ? 'high' : 'medium';
          ctx.drawImage(tx.canvas, sx0, sy0, sx1 - sx0, sy1 - sy0, dx + sx0 * sc, dy + sy0 * sc, (sx1 - sx0) * sc, (sy1 - sy0) * sc);
        }
      }
      ctx.globalAlpha = 1;
    }

    // a whisper of pencil: the graticule, ruled faintly over the painting
    const vr = viewRect(z);
    const step = p > 40 ? 5 : p > 14 ? 10 : 30;
    ctx.strokeStyle = PENCIL(p > 14 ? 0.16 : 0.13);
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    for (let lon = -180; lon < 180; lon += step) {
      const u = wrapU(lon);
      if (u < vr.u0 - 1 || u > vr.u1 + 1) continue;
      const x = Math.round(X0 + u * p) + 0.5;
      ctx.moveTo(x, Math.max(0, Y0 - LAT_N * p)); ctx.lineTo(x, Math.min(H, Y0 - LAT_S * p));
    }
    for (let lat = -90 + step; lat < 90; lat += step) {
      if (-lat < vr.v0 - 1 || -lat > vr.v1 + 1) continue;
      const y = Math.round(Y0 - lat * p) + 0.5;
      ctx.moveTo(Math.max(0, X0 - 180 * p), y); ctx.lineTo(Math.min(W, X0 + 180 * p), y);
    }
    ctx.stroke();
    // close in, the borders between countries, in the same soft pencil
    if (p > 9 && state.borders50) {
      ctx.save();
      ctx.lineJoin = 'round';
      ctx.setTransform(dpr * p, 0, 0, dpr * p, dpr * X0, dpr * Y0);
      ctx.strokeStyle = PENCIL(clamp((p - 9) / 10, 0, 1) * 0.3); ctx.lineWidth = 0.7 / p; ctx.stroke(state.borders50);
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
        ctx.fillStyle = 'rgba(251, 250, 245, 0.92)'; ctx.fill();
        ctx.lineWidth = 1; ctx.strokeStyle = INK(0.85); ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y, 1.4, 0, Math.PI * 2);
        ctx.fillStyle = INK(0.9); ctx.fill();
      }
    }

    // the books: a hairline leader from each place to where its book stands, and the place itself
    layoutPins();
    const taken = [];
    if (!diving) {
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = INK(0.55);
      for (const b of pinList) {
        if (Math.hypot(b.x - b.ax, b.y - b.ay) > 6) { ctx.beginPath(); ctx.moveTo(b.ax, b.ay); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      }
      for (const b of pinList) {
        ctx.beginPath(); ctx.arc(b.ax, b.ay, 3.4, 0, Math.PI * 2);
        ctx.fillStyle = PAPER; ctx.fill();
        ctx.lineWidth = 1.1; ctx.strokeStyle = INK(0.9); ctx.stroke();
        ctx.beginPath(); ctx.arc(b.ax, b.ay, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgb(176, 52, 98)'; ctx.fill();
        const hw = Math.max(b.bw / 2, b.lw / 2) + 4;
        taken.push([b.x - hw, b.y - b.bh - 4, b.x + hw, b.y + 26]);
      }
    }
    // the small globe and the words at the foot keep their corners clear
    for (const r of state.chromeRects || []) taken.push(r);

    if (fontsReady && !diving) {
      const zh = lang === 'zh';
      ctx.save();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      // the oceans, in a wide-spaced italic, fading as you come close
      const seaA = clamp((22 - p) / 10, 0, 1);
      if (seaA > 0) {
        ctx.font = zh ? '400 13px "Noto Sans TC", sans-serif' : 'italic 400 16px "Alegreya Sans", sans-serif';
        try { ctx.letterSpacing = zh ? '8px' : '5px'; } catch (e) { /* older engines */ }
        ctx.fillStyle = `rgba(28, 46, 96, ${0.85 * seaA})`;
        for (const s of SEAS) {
          const [x, y] = P(s.ll);
          const label = T[lang].seas[s.id];
          const half = ctx.measureText(label).width / 2;
          const box = [x - half - 4, y - 11, x + half + 4, y + 11];
          // an ocean's name is lettered whole or not at all
          if (box[0] < 8 || box[2] > W - 8 || box[1] < 8 || box[3] > H - 8 || hits(box, taken)) continue;
          ctx.fillText(label, x + (zh ? 4 : 2.5), y);
          taken.push(box);
        }
      }
      // every other country: the big ones first, the small ones as you come close
      let font = '';
      for (const n of names) {
        if (p < minPx(n.min)) continue;
        const [x, y] = P(n.at);
        if (x < -60 || x > W + 60 || y < -20 || y > H + 20) continue;
        const f = nameFont(n, zh);
        const text = zh ? n.zh : n.en;
        const key = `${lang}|${n.id}|${f.font}`;
        if (f.font !== font) { ctx.font = f.font; try { ctx.letterSpacing = `${f.ls}px`; } catch (e) { /* fine */ } font = f.font; }
        let wdt = nameWidth.get(key);
        if (wdt === undefined) { wdt = ctx.measureText(text).width; nameWidth.set(key, wdt); }
        const box = [x - wdt / 2 - 3, y - 8, x + wdt / 2 + 3, y + 8];
        if (box[0] < 6 || box[2] > W - 6 || box[1] < 6 || box[3] > H - 6 || hits(box, taken)) continue;
        taken.push(box);
        ctx.strokeStyle = 'rgba(251, 250, 245, 0.5)'; ctx.lineWidth = 3;
        ctx.strokeText(text, x + f.ls / 2, y);
        ctx.fillStyle = INK(n.rank <= 2 ? 0.8 : 0.74);
        ctx.fillText(text, x + f.ls / 2, y);
      }
      ctx.restore();
    }

    placePen();
    if (again) state.settle = Math.max(state.settle, 1);
    if (state.settle > 0) { state.settle -= 1; queueDraw(); }
  }

  function queueDraw() {
    if (state.drawQueued) return;
    state.drawQueued = true;
    requestAnimationFrame(draw);
  }

  /* ------------------------------------------------------------ zoom and pan */

  const zoom = d3.zoom()
    .scaleExtent([0.9, 160])
    .on('start', (e) => { if (e.sourceEvent && e.sourceEvent.type !== 'wheel') mapEl.classList.add('is-dragging'); })
    .on('zoom', (e) => {
      state.z = e.transform;
      state.settle = 2;
      queueDraw();
      updateZoomButtons();
      clearTimeout(settleTimer);
      // while a dive runs, the finer painting waits: it is made once the photograph covers the map
      settleTimer = setTimeout(() => { if (!holdPaint) ensureTextures(state.z); }, 140);
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
    const k = clamp(Math.min((W - pad.l - pad.r) / Math.max(1, x1 - x0), (H - pad.t - pad.b) / Math.max(1, y1 - y0)), state.kMin || 1, 160);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const sx = pad.l + (W - pad.l - pad.r) / 2, sy = pad.t + (H - pad.t - pad.b) / 2;
    return d3.zoomIdentity.translate(sx - cx * k, sy - cy * k).scale(k);
  }
  function homeTransform() {
    const small = narrow.matches;
    const pad = small ? { l: 60, r: 60, t: 150, b: 190 } : { l: 70, r: 96, t: 120, b: 150 };
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
  function spotAt(ll, z) {
    const q = P(ll, z);
    const r = mapEl.getBoundingClientRect();
    return [r.left + q[0], r.top + q[1]];
  }

  const zIn = $('#zoom-in'), zOut = $('#zoom-out'), zAll = $('#zoom-world');
  const zoomBy = (f) => sel.interrupt().transition().duration(reduce.matches ? 0 : 420).ease(d3.easeExpOut).call(zoom.scaleBy, f);
  zIn.addEventListener('click', () => zoomBy(2));
  zOut.addEventListener('click', () => zoomBy(0.5));
  zAll.addEventListener('click', () => moveTo(homeTransform()));
  function updateZoomButtons() {
    zIn.disabled = state.z.k >= 159.9;
    zOut.disabled = state.z.k <= (state.kMin || 1) * 1.001;
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
      q.bw = bw; q.bh = bh;
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
    // a book near the window's edge steps inside it, its name whole; a hairline still finds its place
    for (const q of pinList) {
      if (q.ax < -40 || q.ax > state.W + 40 || q.ay < -40 || q.ay > state.H + 40) continue;
      const m = Math.max(q.hw, q.lw / 2 + 4);
      q.x = clamp(q.x, m, state.W - m);
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

  /* ------------------------------------------------------------ the pen marks a place on the map, never the index */

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
    // a photograph picked in the index brings its place into view on the map
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
      const ids = c.photos.filter((id) => S.slides[id]);
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
    // a photograph in the index dives into its place, with that photograph as the cover
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
    const ll = placeLL(cid);
    $('#leaf-where').innerHTML = `<b>${nameHTML(cid)}</b><span>${esc(coords(ll))}</span>`;
    if (tocObserver) { tocObserver.disconnect(); tocObserver = null; }
    renderCover(cid, view, coverId);
    if (isGuide(view)) renderGuide(); else renderPlace(countries[cid]);
    onLeafScroll();
  }

  /* the cover: every photograph of the country, full bleed, one at a time; down is the page */
  const track = $('#cover-track');
  const gal = { ids: [], at: 0, cid: null };
  function renderCover(cid, view, coverId) {
    const ids = countries[cid].photos.filter((id) => S.slides[id]);
    if (!coverId || !S.slides[coverId]) {
      leaf.classList.add('is-plain');
      cover.hidden = true;
      track.textContent = '';
      gal.ids = []; gal.at = 0; gal.cid = cid;
      return;
    }
    leaf.classList.remove('is-plain');
    cover.hidden = false;
    if (!ids.includes(coverId)) ids.unshift(coverId);
    const keep = gal.cid === cid && gal.ids.join() === ids.join();
    gal.cid = cid;
    if (!keep) {
      gal.ids = ids;
      track.innerHTML = ids.map((id, i) => `<figure class="cover__slide" data-i="${i}"></figure>`).join('');
      $$('.cover__slide', track).forEach((f, i) => f.style.setProperty('--i', String(i)));
    }
    cover.setAttribute('aria-label', L(countries[cid].name));
    $('#cover-hint').textContent = isGuide(view) ? t('hintGuide') : t('hintPhotos');
    showSlide(keep ? gal.at : ids.indexOf(coverId), false);
  }
  function loadSlide(i) {
    const f = track.children[i];
    if (!f) return;
    const s = S.slides[gal.ids[i]];
    let img = f.firstElementChild;
    if (img) { img.alt = L(s.alt); return; }
    // a photograph is only fetched once it is on screen or next to it
    img = document.createElement('img');
    img.decoding = 'async';
    img.alt = L(s.alt);
    img.width = s.w; img.height = s.h;
    img.sizes = '100vw';
    img.srcset = srcset(s);
    img.src = imgSrc(s, 1280);
    f.appendChild(img);
  }
  function showSlide(i, animate = true) {
    const n = gal.ids.length;
    if (!n) return;
    gal.at = clamp(i, 0, n - 1);
    track.classList.toggle('is-instant', !animate || reduce.matches);
    track.style.setProperty('--at', String(gal.at));
    track.style.setProperty('--drag', '0px');
    for (const k of [gal.at, gal.at + 1, gal.at - 1, gal.at + 2]) loadSlide(k);
    $$('.cover__slide', track).forEach((f, k) => {
      const on = k === gal.at;
      f.toggleAttribute('aria-hidden', !on);
      f.classList.toggle('is-on', on);
    });
    const s = S.slides[gal.ids[gal.at]];
    $('#cover-cap').innerHTML =
      `<b class="cover__name">${esc(L(s.place))}</b><span class="cover__country">${esc(L(countries[s.country].name))}</span>` +
      (n > 1 ? `<span class="cover__count" aria-label="${esc(T[lang].ofN(gal.at + 1, n))}">${gal.at + 1} / ${n}</span>` : '');
    $('#cover-prev').disabled = gal.at === 0;
    $('#cover-next').disabled = gal.at === n - 1;
    $('#cover-prev').hidden = $('#cover-next').hidden = n < 2;
    pageCover = gal.ids[gal.at];
  }
  function stepSlide(d) {
    const n = gal.ids.length;
    const to = gal.at + d;
    if (to < 0 || to >= n) {
      // at either end the photograph gives a little, and settles back
      if (!reduce.matches) {
        track.classList.remove('is-instant');
        track.style.setProperty('--drag', `${-d * 36}px`);
        setTimeout(() => track.style.setProperty('--drag', '0px'), 160);
      }
      return;
    }
    showSlide(to, true);
    wake();
  }
  $('#cover-prev').addEventListener('click', () => stepSlide(-1));
  $('#cover-next').addEventListener('click', () => stepSlide(1));
  $('#cover-hint').addEventListener('click', () => {
    leafScroll.scrollTo({ top: cover.offsetHeight, behavior: reduce.matches ? 'auto' : 'smooth' });
    const first = $('#leaf-title', leafContent);
    if (first) { first.setAttribute('tabindex', '-1'); first.focus({ preventScroll: true }); }
  });

  // the photograph moves with a finger or a held mouse, and settles where it is let go
  let pull = null;
  cover.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target.closest('button') || gal.ids.length < 2 || !leaf.classList.contains('is-open')) return;
    pull = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), dx: 0, on: false };
  });
  cover.addEventListener('pointermove', (e) => {
    if (!pull || e.pointerId !== pull.id) return;
    const dx = e.clientX - pull.x, dy = e.clientY - pull.y;
    if (!pull.on) {
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy) * 1.2) { if (Math.abs(dy) > 12) pull = null; return; }
      pull.on = true;
      try { cover.setPointerCapture(e.pointerId); } catch (err) { /* fine */ }
      track.classList.add('is-pulling');
    }
    const edge = (gal.at === 0 && dx > 0) || (gal.at === gal.ids.length - 1 && dx < 0);
    pull.dx = edge ? dx * 0.3 : dx;
    track.style.setProperty('--drag', `${pull.dx.toFixed(1)}px`);
  });
  const letGo = (e) => {
    if (!pull || e.pointerId !== pull.id) return;
    const p = pull;
    pull = null;
    track.classList.remove('is-pulling');
    if (!p.on) return;
    const v = p.dx / Math.max(1, performance.now() - p.t);
    const far = Math.abs(p.dx) > cover.offsetWidth * 0.18 || Math.abs(v) > 0.5;
    const d = far ? (p.dx < 0 ? 1 : -1) : 0;
    const to = clamp(gal.at + d, 0, gal.ids.length - 1);
    showSlide(to, true);
    wake();
  };
  cover.addEventListener('pointerup', letGo);
  cover.addEventListener('pointercancel', letGo);
  cover.addEventListener('dragstart', (e) => e.preventDefault());
  // a sideways trackpad swipe turns one photograph, however long its momentum runs
  let wheelX = 0, wheelLock = false, wheelIdle = 0;
  cover.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || gal.ids.length < 2) return;
    e.preventDefault();
    clearTimeout(wheelIdle);
    wheelIdle = setTimeout(() => { wheelLock = false; wheelX = 0; }, 220);
    if (wheelLock) return;
    wheelX += e.deltaX;
    if (Math.abs(wheelX) > 40) { stepSlide(wheelX > 0 ? 1 : -1); wheelLock = true; wheelX = 0; }
  }, { passive: false });

  // the words on the cover fade to almost nothing when nothing moves, and come back on any move
  let stillTimer = 0;
  function wake() {
    leaf.classList.remove('is-still');
    clearTimeout(stillTimer);
    stillTimer = setTimeout(() => { if (page) leaf.classList.add('is-still'); }, 2500);
  }
  ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'].forEach((ev) => leaf.addEventListener(ev, wake, { passive: true }));

  // the bar at the top comes in once the page has been drawn up over the cover
  function onLeafScroll() {
    const y = leafScroll.scrollTop;
    const plain = leaf.classList.contains('is-plain');
    leaf.classList.toggle('is-past', plain || y > innerHeight * 0.85);
    if (y > 24) leaf.classList.add('has-scrolled');
  }
  leafScroll.addEventListener('scroll', onLeafScroll, { passive: true });
  leaf.addEventListener('keydown', (e) => {
    if (photo || !page || gal.ids.length < 2 || leafScroll.scrollTop > innerHeight * 0.5) return;
    if (e.target.closest && e.target.closest('.leaf__content')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); stepSlide(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); stepSlide(-1); }
  });

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
    const ids = c.photos.filter((id) => S.slides[id]);
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
    // the contents: the section being read is marked
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

  /* ------------------------------------------------------------ the dive */

  let pageGen = 0, diveTimers = [], diveRing = null, diveTween = null;
  const later = (fn, ms) => { const id = setTimeout(fn, ms); diveTimers.push(id); return id; };
  const SOFT = 'cubic-bezier(0.45, 0, 0.55, 1)';
  function clearDive() {
    diveTimers.forEach(clearTimeout); diveTimers = [];
    if (diveRing) { erase([diveRing]); marks = marks.filter((m) => m !== diveRing); diveRing = null; }
    if (diveTween) { diveTween.cancel(); diveTween = null; }
    [leaf, cover, track].forEach((el) => el.getAnimations().forEach((a) => a.cancel()));
  }
  // the photograph dissolves in over the whole frame at once: from nothing, a little soft and a
  // little large, to itself. A film dissolve, no shape, no edge
  function dissolve(dir, dur) {
    const a = cover.animate([{ opacity: 0 }, { opacity: 1 }], { duration: dur, easing: SOFT, direction: dir, fill: 'both' });
    track.animate([{ filter: 'blur(8px)', transform: 'scale(1.04)' }, { filter: 'blur(0px)', transform: 'scale(1)' }], { duration: dur, easing: SOFT, direction: dir, fill: 'both' });
    return a;
  }
  function settleOpen(gen) {
    if (gen !== pageGen) return;
    holdPaint = false;
    later(() => ensureTextures(state.z), 400);
    leaf.classList.add('is-open');
    [cover, track, leaf].forEach((el) => el.getAnimations().forEach((a) => a.cancel()));
    later(() => { if (gen === pageGen) leaf.classList.add('is-captioned'); }, reduce.matches ? 0 : 60);
    if (diveRing) { erase([diveRing]); marks = marks.filter((m) => m !== diveRing); diveRing = null; }
    wake();
    const target = leaf.classList.contains('is-plain') ? $('#leaf-back') : $('#cover-back');
    target.focus({ preventScroll: true });
  }

  function openPage(view, opts = {}) {
    pageGen += 1;
    const gen = pageGen;
    clearDive();
    const cid = viewCountry(view);
    const ll = placeLL(cid);
    page = view;
    pageCover = coverFor(cid, opts.cover);
    renderLeaf(view, pageCover);
    leafScroll.scrollTop = 0;
    leaf.classList.remove('has-scrolled', 'is-still');
    onLeafScroll();
    app.inert = true;
    setIndex(false, false);
    clearActive();
    globe.stop();
    live.textContent = T[lang].opening(L(bookByCountry[cid].title));
    const landing = diveTransform(cid);
    holdPaint = !!opts.animate && !reduce.matches;
    if (!holdPaint) ensureTextures(landing);
    if (!diving) state.before = state.z;
    diving = true;
    app.classList.add('is-diving');
    leaf.classList.remove('is-open', 'is-captioned', 'is-leaving');
    const hasCover = !leaf.classList.contains('is-plain');
    if (opts.animate && !reduce.matches) {
      // 1. the map magnifies slowly into the country while a fine ring tightens on the spot
      const ZOOM = 2000;
      moveTo(landing, ZOOM);
      diveRing = penRing(ringD(14), ll);
      marks.push(diveRing);
      drawStroke(diveRing.firstChild, 0, 500);
      diveTween = tween(ZOOM, (e) => { if (diveRing) { diveRing.dataset.s = (6 - 5 * e).toFixed(3); placePen(); } });
      // 2. in the last third of the zoom, while the camera still moves, the photograph dissolves in
      //    over the whole frame and the painting softens away beneath it
      later(() => {
        if (gen !== pageGen) return;
        leaf.hidden = false;
        leafScroll.scrollTop = 0;
        app.classList.add('is-soft');
        if (!hasCover) {
          leaf.classList.add('is-open');
          leaf.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 800, easing: SOFT }).onfinish = () => settleOpen(gen);
          return;
        }
        dissolve('normal', 1800).onfinish = () => settleOpen(gen);
      }, hasCover ? Math.round(ZOOM * 0.64) : 1500);
    } else {
      moveTo(landing, 0);
      leaf.hidden = false;
      leafScroll.scrollTop = 0;
      app.classList.add('is-soft');
      if (opts.animate) {
        // reduced motion: a plain fade
        leaf.classList.add('is-open');
        leaf.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' }).onfinish = () => settleOpen(gen);
      } else {
        settleOpen(gen);
      }
    }
  }

  function closePage(opts = {}) {
    if (!page) return;
    holdPaint = false;
    pageGen += 1;
    const gen = pageGen;
    clearDive();
    const cid = viewCountry(page);
    const pin = pinList.find((q) => q.country === cid);
    const ll = placeLL(cid);
    page = null;
    clearTimeout(stillTimer);
    if (tocObserver) { tocObserver.disconnect(); tocObserver = null; }
    const back0 = state.before || homeTransform();
    const surface = () => {
      diving = false;
      state.before = null;
      app.inert = false;
      app.classList.remove('is-soft');
      moveTo(back0, opts.animate ? 1600 : 0);
      if (opts.animate && !reduce.matches) later(() => app.classList.remove('is-diving'), 450);
      else app.classList.remove('is-diving');
      if (opts.animate && !reduce.matches) {
        // the ring loosens and lets go
        const ring = penRing(ringD(14), ll);
        marks.push(ring);
        placePen();
        diveTween = tween(1400, (e) => { if (ring.isConnected) { ring.dataset.s = (1 + 5 * e).toFixed(3); ring.style.setProperty('--o', (1 - e).toFixed(3)); placePen(); } }, () => { ring.remove(); marks = marks.filter((m) => m !== ring); });
      }
      queueDraw();
      globe.start();
      if (pin && opts.focus !== false) pin.el.querySelector('.book').focus({ preventScroll: true });
    };
    const done = () => {
      if (gen !== pageGen) return;
      leafScroll.scrollTop = 0;
      leaf.hidden = true;
      [cover, track, leaf].forEach((el) => el.getAnimations().forEach((a) => a.cancel()));
      leaf.classList.remove('is-open', 'is-captioned', 'is-leaving', 'is-past', 'is-still', 'has-scrolled');
      leafContent.textContent = '';
    };
    const atCover = !leaf.classList.contains('is-plain') && leafScroll.scrollTop < 80;
    if (opts.animate && !reduce.matches && atCover) {
      // the same dissolve, reversed and a little quicker, then the map draws back out
      leaf.classList.remove('is-captioned');
      leaf.classList.add('is-leaving');
      later(() => {
        if (gen !== pageGen) return;
        leaf.classList.remove('is-open');
        app.classList.remove('is-soft');
        dissolve('reverse', 1300).onfinish = () => { done(); surface(); };
      }, 140);
    } else if (opts.animate) {
      leaf.classList.add('is-leaving');
      app.classList.remove('is-soft');
      leaf.animate([{ opacity: 1 }, { opacity: 0 }], { duration: reduce.matches ? 200 : 420, easing: SOFT, fill: 'forwards' }).onfinish = () => { done(); surface(); };
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
    if (!!want.flights !== flOpen) {
      if (flOpen) closeFlights({ animate, focus: !want.page });
      else openFlights(animate);
    }
    if (want.page !== page) {
      if (page) closePage({ animate: animate && !want.page, focus: !want.page });
      if (want.page) openPage(want.page, { animate, cover: want.cover });
    }
    if (want.photo && want.photo !== photo) showViewer(want.photo, photoList, photoFrom);
  }
  function go(view, coverId) {
    if (page === view || diving) return;
    if (opening && !opening.done) opening.skip();
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
  $('#flights-back').addEventListener('click', () => back());
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (photo || page || flOpen) { e.preventDefault(); back(); }
    else if (indexEl.classList.contains('is-open')) { e.preventDefault(); setIndex(false); }
  });
  viewer.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  });

  /* ------------------------------------------------------------ the flights: his journeys, on a globe to turn by hand */

  // where he flies from, unmarked and never named: [lng, lat]
  const FROM = Array.isArray(S.flightsFrom) ? [S.flightsFrom[1], S.flightsFrom[0]] : [121.56, 25.03];
  const atFrom = (ll) => d3.geoDistance(ll, FROM) < 0.008;
  const lngLat = (c) => [placeLL(c)[1], placeLL(c)[0]];
  // a leg's town, in the language of the page (the data carries both)
  const town = (q) => clean(lang === 'zh' && q.zh ? q.zh : (q.city && typeof q.city === 'object' ? L(q.city) : q.city || ''));
  const okPt = (q) => q && Number.isFinite(+q.lat) && Number.isFinite(+q.lng);
  // a journey: its own legs in order when the data has them, otherwise one flight out to each place
  function journeyOf(j) {
    const places = (j.countries || []).filter((c) => countries[c]);
    const legs = Array.isArray(j.legs) ? j.legs.filter((l) => l && okPt(l.from) && okPt(l.to)) : [];
    let pairs;
    if (legs.length) {
      pairs = legs.map((l) => ({
        from: [+l.from.lng, +l.from.lat], to: [+l.to.lng, +l.to.lat],
        ground: !!l.mode && l.mode !== 'flight',
        fromName: town(l.from), toName: town(l.to),
      }));
    } else {
      pairs = places.map((c) => ({ from: FROM, to: lngLat(c), toName: L(bookByCountry[c].title) }));
    }
    const fl = WC.flights(pairs, 7);
    // drawn in order, each leg leaving as the one before lands; the place pops up as it arrives
    let t = 0;
    const pops = [];
    const seen = new Set();
    const pop = (ll, name, at) => {
      if (!name || atFrom(ll)) return;
      const key = name.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      pops.push({ ll, name, at });
    };
    fl.forEach((f) => { f.dur = f.ground ? 480 : 700 + f.len * 420; });
    // a long journey is told a little faster, so it draws out in about four seconds
    const total = legs.length ? fl.reduce((a, f) => a + f.dur * 0.9, 0) : 0;
    const k = total > 4200 ? 4200 / total : 1;
    fl.forEach((f, i) => {
      f.dur *= k;
      f.at = legs.length ? t : i * 320;
      if (i === 0 && legs.length) pop(f.from, f.fromName, 0);
      pop(f.to, f.toName, f.at + f.dur * 0.82);
      if (legs.length) t += f.dur * 0.9;
    });
    const pts = { type: 'MultiPoint', coordinates: fl.flatMap((f) => [f.from, f.to]) };
    return { j, places, flights: fl, pops, frame: pts.coordinates.length ? d3.geoCentroid(pts) : FROM };
  }
  let journeys = [];
  function buildJourneys() { journeys = (S.journeys || []).map(journeyOf); }
  buildJourneys();
  // every flight at once, for the scatter: one of each route
  function allFlights() {
    const out = [], seen = new Set();
    for (const jn of journeys) for (const f of jn.flights) {
      if (f.ground) continue;
      const k = [f.from, f.to].map((q) => q.map((v) => v.toFixed(1)).join()).join('>');
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({ from: f.from, to: f.to });
    }
    if (!out.length) for (const c of order) if (c.id !== 'taiwan') out.push({ from: FROM, to: lngLat(c.id) });
    return WC.flights(out);
  }
  const flights = allFlights();

  const globeBtn = $('#globe');
  const globe = new WC.Globe($('#globe-canvas'), { land: null, travel: null, flights, reduce: () => reduce.matches });
  function sizeGlobe() { globe.resize(narrow.matches ? 92 : 184); }
  let opening = null;

  const flightsEl = $('#flights');
  const bigCanvas = $('#flights-globe');
  const journeysEl = $('#journeys');
  const big = new WC.BigGlobe(bigCanvas, {
    land: null, travel: null, all: flights, reduce: () => reduce.matches,
    font: () => (lang === 'zh' ? '500 15px "Noto Sans TC", sans-serif' : 'italic 400 17px "Alegreya Sans", sans-serif'),
  });
  let flOpen = false, jTimer = 0, jOn = -1;

  function renderJourneys() {
    const placesAll = new Set(journeys.flatMap((jn) => jn.places));
    $('#flights-line').textContent = T[lang].journeysLine(journeys.length, placesAll.size);
    journeysEl.innerHTML = journeys.map((jn, i) => {
      const items = jn.places.map((c) => {
        const b = bookByCountry[c];
        const s = b.photo ? S.slides[b.photo] : null;
        const pic = s ? `<img src="${imgSrc(s, 640)}" alt="" width="${s.w}" height="${s.h}" loading="lazy" decoding="async">` : '';
        return `<li><button type="button" class="jplace${s ? '' : ' jplace--none'}" data-country="${c}" aria-label="${esc(T[lang].diveTo(L(b.title)))}">` +
          `<span class="jplace__pic" aria-hidden="true">${pic}</span><span class="jplace__name">${esc(L(b.title))}</span></button></li>`;
      }).join('');
      return `<li class="journey" data-j="${i}"><button type="button" class="journey__date" aria-pressed="false">${esc(L(jn.j.date))}</button><ul class="journey__places">${items}</ul></li>`;
    }).join('');
  }
  function setJourney(i) {
    clearTimeout(jTimer);
    if (i === jOn) return;
    jOn = i;
    $$('.journey', journeysEl).forEach((li, k) => {
      li.classList.toggle('is-on', k === i);
      li.querySelector('.journey__date').setAttribute('aria-pressed', String(k === i));
    });
    flightsEl.classList.toggle('has-journey', i >= 0);
    big.set(i >= 0 ? journeys[i] : null);
  }
  const setJourneySoon = () => { clearTimeout(jTimer); jTimer = setTimeout(() => setJourney(-1), 260); };
  journeysEl.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    const li = e.target.closest('.journey');
    if (li) setJourney(+li.dataset.j);
  });
  journeysEl.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') setJourneySoon(); });
  journeysEl.addEventListener('focusin', (e) => { const li = e.target.closest('.journey'); if (li) setJourney(+li.dataset.j); });
  journeysEl.addEventListener('focusout', (e) => { if (!journeysEl.contains(e.relatedTarget)) setJourneySoon(); });
  journeysEl.addEventListener('click', (e) => {
    const d = e.target.closest('.journey__date');
    if (d) { const i = +d.closest('.journey').dataset.j; setJourney(jOn === i ? -1 : i); return; }
    const pl = e.target.closest('.jplace');
    if (!pl) return;
    // a place in a journey: the Flights view gives way, and the map dives into it
    const view = bookByCountry[pl.dataset.country].view;
    try { history.replaceState({ wc: true, page: view, cover: null }, '', `#${view}`); } catch (err) { /* fine */ }
    closeFlights({ fade: true, focus: false });
    openPage(view, { animate: true });
  });

  // the small globe's place on the screen, as a transform of the large one
  function globeFlip() {
    const a = $('#globe-canvas').getBoundingClientRect(), b = bigCanvas.getBoundingClientRect();
    const sR = a.width * 0.44, bR = Math.min(b.width, b.height) * 0.4 * big.k;
    const dx = a.left + a.width / 2 - (b.left + b.width / 2), dy = a.top + a.height * 0.46 - (b.top + b.height * 0.47);
    return `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${(sR / bR).toFixed(4)})`;
  }
  function openFlights(animate) {
    if (flOpen) return;
    flOpen = true;
    if (opening && !opening.done) opening.skip();
    setIndex(false, false);
    clearActive();
    renderJourneys();
    jOn = -2; setJourney(-1);
    flightsEl.hidden = false;
    flightsEl.getAnimations().forEach((a) => a.cancel());
    app.inert = true;
    big.k = 1;
    big.rot = [globe.lon, -18];
    big.vel = [0, 0]; big.goal = null;
    big.resize();
    globe.stop();
    app.classList.add('is-flying');
    if (animate && !reduce.matches) {
      // the small globe grows out of its corner into the view
      bigCanvas.animate([{ transform: globeFlip() }, { transform: 'none' }], { duration: 1000, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
      requestAnimationFrame(() => flightsEl.classList.add('is-in'));
    } else flightsEl.classList.add('is-in');
    big.start();
    live.textContent = T[lang].flightsOpen;
    requestAnimationFrame(() => $('#flights-back').focus({ preventScroll: true }));
  }
  function closeFlights(opts = {}) {
    if (!flOpen) return;
    flOpen = false;
    clearTimeout(jTimer);
    const finish = () => {
      flightsEl.hidden = true;
      flightsEl.classList.remove('is-in', 'has-journey');
      [flightsEl, bigCanvas].forEach((el) => el.getAnimations().forEach((a) => a.cancel()));
      big.stop();
      big.set(null);
      jOn = -1;
      app.inert = !!page;
      app.classList.remove('is-flying');
      globe.lon = big.rot[0];
      if (!page) globe.start();
    };
    if (opts.animate && !reduce.matches) {
      flightsEl.classList.remove('is-in');
      bigCanvas.animate([{ transform: 'none' }, { transform: globeFlip() }], { duration: 760, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'forwards' }).onfinish = finish;
    } else if (opts.fade && !reduce.matches) {
      flightsEl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 480, easing: 'ease-in-out', fill: 'forwards' }).onfinish = finish;
    } else finish();
    if (opts.focus !== false) globeBtn.focus({ preventScroll: true });
  }
  globeBtn.addEventListener('click', () => {
    if (flOpen || diving) return;
    try { history.pushState({ wc: true, flights: true }, '', '#flights'); } catch (e) { /* fine */ }
    openFlights(true);
  });

  /* ------------------------------------------------------------ language */

  function applyWords() {
    html.lang = lang === 'zh' ? 'zh-Hant' : 'en';
    $$('[data-t]').forEach((el) => { const v = t(el.dataset.t); if (typeof v === 'string') el.textContent = v; });
    $$('[data-t-aria]').forEach((el) => { const v = t(el.dataset.tAria); if (typeof v === 'string') el.setAttribute('aria-label', v); });
    $$('.lang').forEach((g) => g.setAttribute('aria-label', T[lang].lang));
    $$('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    $('#ig').setAttribute('aria-label', `${t('follow')}: tuan_1127`);
    $('#globe').setAttribute('aria-label', T[lang].globeLabel);
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
      renderLeaf(page, pageCover);
      leafScroll.scrollTop = top;
    }
    if (photo) renderViewer();
    buildJourneys();
    if (flOpen) { const was = jOn; renderJourneys(); jOn = -2; setJourney(was); big.kick(); }
    state.settle = 4;
    queueDraw();
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.lang button');
    if (b) setLang(b.dataset.lang);
  });

  /* ------------------------------------------------------------ the paper and the swatches */

  let fontsReady = false;
  function makeMaterials() {
    const tooth = WC.toothTile(384);
    tooth.toBlob((b) => { if (b) html.style.setProperty('--tooth', `url(${URL.createObjectURL(b)})`); });
    // brush dabs for the key and the guide's rules, painted with the map's own colours
    const dab = (rgb, w, h, seed, body = 0.42) => {
      // a single brush stroke: tapered at both ends, its middle wandering, pooled darker at its edge, dry-brush streaks along it
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const g = c.getContext('2d');
      const { NH, NL, NM } = WC.noise();
      const id = g.createImageData(w, h);
      for (let x = 0; x < w; x++) {
        const nx = x / (w - 1);
        const taper = Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, nx * 1.04 - 0.02))), 0.45);
        const wob = NM[((seed * 7) & 511) * 512 + ((x * 3) & 511)] - 0.5;
        const th = 0.5 * (0.22 + 0.78 * taper) * (0.92 + 0.3 * (NL[((seed * 3) & 511) * 512 + ((x >> 1) & 511)] - 0.5));
        const cy = 0.5 + wob * 0.18;
        for (let y = 0; y < h; y++) {
          const d = Math.abs(y / (h - 1) - cy) / Math.max(0.02, th);
          const edgeN = (NM[(((y >> 1) + seed) & 511) * 512 + ((x >> 1) & 511)] - 0.5) * 0.22 + (NH[((y + seed) & 511) * 512 + (x & 511)] - 0.5) * 0.03;
          let a = 0;
          if (d < 1 + edgeN) {
            const rim = Math.exp(-Math.pow((d - 0.9) / 0.1, 2)) * 0.32;
            const streak = 0.72 + 0.28 * NL[(((y * 6) + seed * 11) & 511) * 512 + ((x >> 3) & 511)];
            const blot = 0.8 + 0.4 * NL[(((y + seed) >> 1) & 511) * 512 + ((x >> 1) & 511)];
            const gran = 0.82 + 0.36 * NH[((y * 2 + seed) & 511) * 512 + ((x * 2) & 511)];
            a = (body * blot * streak + rim) * gran;
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
    const set = (name, c) => c.toBlob((b) => { if (b) html.style.setProperty(name, `url(${URL.createObjectURL(b)})`); });
    set('--dab-glaze', dab([206, 84, 136], 120, 36, 3, 0.5));
    set('--dab-sea', dab([110, 150, 214], 720, 150, 9, 0.34));
    set('--stroke', dab([92, 124, 206], 520, 22, 21, 0.5));
  }


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

  async function loadWorld() {
    // a busy local server can drop a request now and then: each file is asked for again before giving up
    const getJSON = async (url, tries = 3) => {
      for (let i = 0; ; i++) {
        try { const r = await fetch(url); if (!r.ok) throw new Error(String(r.status)); return await r.json(); }
        catch (e) { if (i >= tries - 1) throw e; await new Promise((res) => setTimeout(res, 400 * (i + 1))); }
      }
    };
    const w110 = await getJSON('../vendor/countries-110m.json');
    state.w110 = w110;
    state.land110 = topojson.feature(w110, w110.objects.land);
    state.coast110 = pathDeg(topojson.mesh(w110, w110.objects.land));
    state.landFill110 = pathDeg(state.land110);
    const f110 = featsFor(w110);
    globe.o.land = big.o.land = state.land110;
    globe.o.travel = big.o.travel = Object.values(f110);
    big.kick();
    sizeGlobe();
    queueDraw();
    const relief = new Image();
    relief.src = '../vendor/relief/SR_50M-4096.jpg';
    const floor = new Image();
    floor.src = '../vendor/relief/GRAY_50M_SR_OB-4096.jpg';
    const reliefReady = Promise.all([
      relief.decode().then(() => { state.relief = relief; }).catch(() => {}),
      floor.decode().then(() => { state.floor = floor; }).catch(() => {}),
    ]);
    const w50 = await getJSON('../vendor/countries-50m.json');
    state.w50 = w50;
    state.land50 = topojson.feature(w50, w50.objects.land);
    state.coast50 = pathDeg(topojson.mesh(w50, w50.objects.land));
    state.borders50 = pathDeg(topojson.mesh(w50, w50.objects.countries, (a, b) => a !== b));
    state.feats = featsFor(w50);
    state.travel = Object.values(state.feats);
    const isos = new Set(Object.values(ISO));
    const id3 = (g) => String(g.id).padStart(3, '0');
    state.seams = topojson.mesh(w50, w50.objects.countries, (a, b) => a !== b && isos.has(id3(a)) && isos.has(id3(b)));
    queueDraw();
    await reliefReady;
    paintBase();
  }
  // the corners the globe and the words at the foot keep clear of lettering
  function measureChrome() {
    const m = mapEl.getBoundingClientRect();
    state.chromeRects = ['#globe', '.tools', '.key', '.chrome'].map((s) => $(s)).filter((el) => el && el.offsetParent !== null).map((el) => {
      const r = el.getBoundingClientRect();
      return [r.left - m.left - 6, r.top - m.top - 6, r.right - m.left + 6, r.bottom - m.top + 6];
    });
  }

  function start() {
    applyWords();
    renderIndex();
    setIndex(false, false);
    sizeMap();
    renderPins();
    prepareNames();
    measureChrome();
    makeMaterials();
    moveTo(homeTransform(), 0);
    state.settle = 6;
    queueDraw();
    if (document.fonts && document.fonts.load) {
      Promise.all([document.fonts.load('italic 400 15px "Alegreya Sans"'), document.fonts.load('500 12px "Alegreya Sans"')]).then(() => { fontsReady = true; measurePins(); state.settle = 4; queueDraw(); }).catch(() => { fontsReady = true; });
    } else fontsReady = true;

    const want = parse(location.hash);
    let first = false;
    try { first = !sessionStorage.getItem('wc-opened'); sessionStorage.setItem('wc-opened', '1'); } catch (e) { first = false; }
    const playOpening = first && !reduce.matches && !want.page && !want.photo && !want.flights;
    if (playOpening) app.classList.add('is-opening');

    loadWorld().then(() => {
      if (playOpening) {
        const oc = $('#opening');
        oc.hidden = false;
        opening = WC.opening({
          canvas: oc, land: state.land110, travel: globe.o.travel, flights, LON0, LAT_N, LAT_S,
          target: () => {
            const z = state.z;
            return { scale: (z.k * state.S0 * 180) / Math.PI, translate: [z.x + (z.k * state.W) / 2, z.y + (z.k * state.H) / 2] };
          },
          onUnroll: () => {},
          onDone: () => { app.classList.remove('is-opening'); app.classList.add('is-arrived'); globe.start(); },
        });
        const skip = () => { if (opening && !opening.done) opening.skip(); };
        ['pointerdown', 'wheel', 'keydown'].forEach((ev) => window.addEventListener(ev, skip, { once: true, passive: true }));
      } else {
        globe.start();
      }
    }).catch(() => { app.classList.remove('is-opening'); });

    // a page or photograph named in the address opens directly
    if (want.page || want.photo || want.flights) {
      try { history.replaceState({ wc: false, page: want.page, photo: want.photo, flights: !!want.flights }, '', location.href); } catch (e) { /* fine */ }
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
        measureChrome();
        if (flOpen) big.resize();
        const b = baseXY([c[1], c[0]]);
        state.z = d3.zoomIdentity.translate(state.W / 2 - b[0] * k, state.H / 2 - b[1] * k).scale(k);
        sel.call(zoom.transform, state.z);
        state.settle = 4;
        queueDraw();
      });
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) globe.stop(); else if (!page) globe.start(); });
    updateZoomButtons();
  }
  WC.state = state; // for inspection in the console
  WC.big = big;
  start();
})();

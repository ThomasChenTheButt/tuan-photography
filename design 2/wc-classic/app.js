/* tuan photography 陳亮元 · design 2 · "Field watercolour, refined"
   A traveller's field map, painted in watercolour on cold-press paper and filling the window to
   every edge. The painting is made once per zoom band (paint.js) and laid on a canvas that d3-zoom
   moves; the sepia pen line, the pencil marks and the lettering of every country are drawn over it
   live, and the paper's tooth lies over all. Design 1's books stand at the sixteen places.
   Choosing one dives: the map magnifies into the country, and as the camera settles the cover
   photograph dissolves in over the whole window, a gallery of that country's photographs to swipe
   through, with the guide or the photographs page waiting below. The small painted globe in the
   corner opens into the Flights view: the globe in hand on the left, his journeys on the right. */
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
      note: 'Sixteen places travelled, each glazed in rose. Choose one and the map opens into its photographs.',
      zoomGroup: 'Zoom', zoomIn: 'Zoom in', zoomOut: 'Zoom out', world: 'Whole map', credit: 'Map: Natural Earth',
      flights: 'Flights', globeLabel: 'Flights: open the globe of journeys',
      flightsTitle: 'Flights', flightsHint: 'Point to a journey to trace it on the globe. Drag the globe to turn it.',
      journeysLabel: 'Journeys', globeAria: 'A globe of the flights flown. Drag to turn it, scroll to come closer.',
      hintGuide: 'Scroll for the guide', hintPhotos: 'Scroll for the photographs',
      coverLabel: (p) => `Photographs of ${p}`, slideOf: (i, n) => `${i} / ${n}`,
      goPlace: (p) => `${p}: go to the map and open it`,
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
      note: '走過的十六個地方，各上一層玫瑰色。選一個，地圖便展開成它的照片。',
      zoomGroup: '縮放', zoomIn: '放大', zoomOut: '縮小', world: '整張地圖', credit: '地圖：Natural Earth',
      flights: '飛過的航線', globeLabel: '飛過的航線：打開旅程地球',
      flightsTitle: '飛過的航線', flightsHint: '指向一段旅程，地球上就畫出它的航線。拖曳地球可以轉動。',
      journeysLabel: '旅程', globeAria: '飛過航線的地球。拖曳轉動，捲動靠近。',
      hintGuide: '往下看攻略', hintPhotos: '往下看照片',
      coverLabel: (p) => `${p}的照片`, slideOf: (i, n) => `${i} / ${n}`,
      goPlace: (p) => `${p}：回到地圖並打開`,
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
  // Pacific seam falls where nothing he visited is. The sheet is painted pole to pole and the
  // zoom never lets the window see past it: paint reaches every edge, always.
  const LON0 = 10, LAT_N = 90, LAT_S = -90;
  const R0 = 8; // texture px per degree of the whole-world painting
  const state = {
    W: 1, H: 1, dpr: 1, S0: 1, kMin: 1,
    z: d3.zoomIdentity,
    w110: null, w50: null,
    land110: null, land50: null, travel: [], seams: null,
    coast110: null, coast50: null, borders50: null, landFill110: null,
    feats: {},
    relief: null, reliefFine: null,
    base: null, regions: [], job: null,
    drawQueued: false, settle: 0,
    before: null,
    bloom: null,
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
    // the least zoom at which the sheet still covers the whole window, both ways
    state.kMin = Math.max(1, (360 * state.H) / (state.W * (LAT_N - LAT_S)));
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

  let settleTimer = 0;
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

  const PAPER = 'rgb(251, 250, 246)';
  const SEPIA = (a) => `rgba(88, 62, 42, ${a})`;
  const PENCIL = (a) => `rgba(92, 88, 82, ${a})`;
  const SEAS = [
    { id: 'pacific', ll: [16, 162] },
    { id: 'indian', ll: [-24, 80] },
    { id: 'atlantic', ll: [24, -42] },
    { id: 'southern', ll: [-56, 40] },
  ];

  /* ------------------------------------------------------------ every country, lettered in the map's hand */

  // his sixteen keep their own names, on their books; every other country is lettered small and
  // light, by importance and zoom, never over another name, a book or a word at the edge
  const NAMES = window.COUNTRY_NAMES || {};
  const OWN = new Set(Object.values(ISO));
  const nameList = Object.entries(NAMES)
    .filter(([id, n]) => !OWN.has(id) && n && Array.isArray(n.at))
    .map(([id, n]) => ({ id, n, ll: [n.at[1], n.at[0]], shown: false }))
    .sort((x, y) => x.n.rank - y.n.rank || x.n.min - y.n.min);
  const measured = new Map();
  function labelStyle(rank, zw) {
    const zh = lang === 'zh';
    // the lettering grows a little as you come close, never past his own places' names
    const grow = Math.round(clamp((zw - 3.2) * 0.8, 0, 2) * 2) / 2;
    const size = (rank <= 2 ? 11.5 : rank <= 4 ? 10.75 : 10) + grow;
    return zh
      ? { font: `500 ${size}px "Noto Serif TC", serif`, ls: rank <= 2 ? 2.4 : 1.4, lh: size + 4, size }
      : { font: `italic 400 ${size + 0.5}px "Alegreya Sans", sans-serif`, ls: rank <= 2 ? 1.1 : rank <= 4 ? 0.5 : 0.3, lh: size + 2, size };
  }
  function linesOf(label) {
    if (lang === 'zh' || label.length <= 15 || !label.includes(' ')) return [label];
    // a long name goes onto two lines, broken at the space nearest its middle
    const mid = label.length / 2;
    let best = -1;
    for (let i = 0; i < label.length; i++) if (label[i] === ' ' && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
    return [label.slice(0, best), label.slice(best + 1)];
  }
  function measureLabel(item, st) {
    const key = `${lang}|${item.id}|${st.font}`;
    let m = measured.get(key);
    if (!m) {
      const lines = linesOf(L(item.n));
      ctx.font = st.font;
      try { ctx.letterSpacing = `${st.ls}px`; } catch (e) { /* older engines */ }
      const w = Math.max(...lines.map((l) => ctx.measureText(l).width));
      m = { lines, w, h: lines.length * st.lh };
      measured.set(key, m);
    }
    return m;
  }
  const hits = (r, list) => { for (const o of list) if (r[0] < o[2] && r[2] > o[0] && r[1] < o[3] && r[3] > o[1]) return true; return false; };
  function measureUI() {
    state.ui = $$('.mast, .chrome, .corner, .tools, .index__tab').map((el) => {
      const r = el.getBoundingClientRect();
      return r.width ? [r.left - 6, r.top - 4, r.right + 6, r.bottom + 4] : null;
    }).filter(Boolean);
  }
  function drawNames(p, taken) {
    const { W, H } = state;
    const zw = Math.log2((p * 360) / 256);
    const zh = lang === 'zh';
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    const order2 = nameList.slice().sort((x, y) => (x.n.rank - (x.shown ? 0.6 : 0)) - (y.n.rank - (y.shown ? 0.6 : 0)));
    for (const it of order2) {
      it.shown = false;
      const a = clamp((zw + 0.55 - it.n.min) / 0.35, 0, 1);
      if (a <= 0) continue;
      const [x, y] = P(it.ll);
      if (x < -80 || x > W + 80 || y < -40 || y > H + 40) continue;
      const st = labelStyle(it.n.rank, zw);
      const m = measureLabel(it, st);
      const r = [x - m.w / 2 - 3, y - m.h / 2 - 2, x + m.w / 2 + 3, y + m.h / 2 + 2];
      if (r[0] < 6 || r[2] > W - 6 || r[1] < 6 || r[3] > H - 6) continue;
      if (hits(r, taken)) continue;
      taken.push(r);
      it.shown = true;
      ctx.font = st.font;
      try { ctx.letterSpacing = `${st.ls}px`; } catch (e) { /* fine */ }
      m.lines.forEach((line, i) => {
        const ly = y - m.h / 2 + st.lh * (i + 0.5) + (zh ? 0.5 : 0);
        const lx = x + st.ls / 2;
        ctx.strokeStyle = `rgba(251, 250, 246, ${0.72 * a})`; ctx.lineWidth = 2.6; ctx.strokeText(line, lx, ly);
        ctx.fillStyle = `rgba(92, 74, 58, ${(it.n.rank <= 2 ? 0.9 : 0.82) * a})`; ctx.fillText(line, lx, ly);
      });
    }
    ctx.restore();
  }
  function loadZhFaces() {
    if (lang !== 'zh' || !document.fonts || !document.fonts.load) return;
    const legs = (S.journeys || []).flatMap((j) => j.legs || []).flatMap((l) => [l.from && l.from.zh, l.to && l.to.zh]).filter(Boolean).join('');
    const txt = Object.values(NAMES).map((n) => n.zh || '').join('') + Object.values(T.zh.seas).join('') + legs + books.map((b) => b.title.zh).join('');
    Promise.all([document.fonts.load('500 12px "Noto Serif TC"', txt), document.fonts.load('500 12px "Noto Sans TC"', txt)])
      .then(() => { measured.clear(); state.settle = 3; queueDraw(); }).catch(() => {});
  }

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
    const baseA = state.base ? Math.min(1, (now - state.base.ready) / 500) : 0;
    if (baseA < 1 && state.landFill110) {
      ctx.setTransform(dpr * p, 0, 0, dpr * p, dpr * X0, dpr * Y0);
      ctx.fillStyle = 'rgb(222, 237, 244)';
      ctx.fillRect(-181, -LAT_N - 1, 362, LAT_N - LAT_S + 2);
      ctx.fillStyle = 'rgb(247, 246, 239)';
      ctx.fill(state.landFill110);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    // the painting: the whole sheet, then any finer regional paintings over it
    if (state.base) {
      const c = 2 * Math.log2(Math.max(1e-6, (p * Math.min(1.5, dpr) * 0.85) / R0));
      const list = [state.base, ...state.regions.slice().sort((a, b) => a.r - b.r)];
      for (const tx of list) {
        let a = Math.min(1, (now - tx.ready) / 500);
        if (now - tx.ready < 520) again = true;
        // a finer painting than the zoom needs is fine; one far finer (zoomed well back out) fades away
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

    // pencil: small crosses where the graticule meets, finer as you come close
    const step = p > 40 ? 5 : p > 14 ? 10 : 30;
    const arm = 3.5;
    ctx.strokeStyle = PENCIL(0.26);
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    const vr = viewRect(z);
    for (let lon = -180; lon < 180; lon += step) {
      const u = wrapU(lon);
      if (u < vr.u0 - 1 || u > vr.u1 + 1) continue;
      for (let lat = -60; lat <= 75; lat += step) {
        if (-lat < vr.v0 - 1 || -lat > vr.v1 + 1) continue;
        const x = X0 + u * p, y = Y0 - lat * p;
        ctx.moveTo(x - arm, y); ctx.lineTo(x + arm, y);
        ctx.moveTo(x, y - arm); ctx.lineTo(x, y + arm);
      }
    }
    ctx.stroke();

    // the pen: coastlines in one fine, sure sepia line, with the faintest second pass for ink
    const coast = p > 12 && state.coast50 ? state.coast50 : state.coast110;
    if (coast) {
      const w = Math.min(1.05, 0.62 + p * 0.0035);
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.setTransform(dpr * p, 0, 0, dpr * p, dpr * (X0 + 0.3), dpr * (Y0 + 0.25));
      ctx.strokeStyle = SEPIA(0.12); ctx.lineWidth = (w * 0.9) / p; ctx.stroke(coast);
      ctx.setTransform(dpr * p, 0, 0, dpr * p, dpr * X0, dpr * Y0);
      ctx.strokeStyle = SEPIA(0.86); ctx.lineWidth = w / p; ctx.stroke(coast);
      if (p > 14 && state.borders50) {
        ctx.setLineDash([2 / p, 2.6 / p]);
        ctx.strokeStyle = PENCIL(0.4); ctx.lineWidth = 0.55 / p; ctx.stroke(state.borders50);
        ctx.setLineDash([]);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // the books stand where they stand; everything lettered keeps clear of them
    layoutPins();
    const taken = (state.ui || []).slice();
    if (!diving) {
      const s = bookScale(), bw = 192 * s, bh = 272 * s;
      for (const q of pinList) {
        taken.push([q.x - bw / 2 - 2, q.y - bh - 2, q.x + bw / 2 + 2, q.y + 3]);
        if (!q.el.classList.contains('is-quiet')) taken.push([q.x - q.lw / 2 - 2, q.y + 4, q.x + q.lw / 2 + 2, q.y + 22]);
        taken.push([q.ax - 5, q.ay - 5, q.ax + 5, q.ay + 5]);
      }
    }

    // the oceans, lettered in italic, fading as you come close
    const seaA = clamp((24 - p) / 10, 0, 1);
    if (seaA > 0 && fontsReady) {
      const zh = lang === 'zh';
      ctx.save();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = zh ? '500 13px "Noto Serif TC", serif' : 'italic 400 15px "Alegreya Sans", sans-serif';
      const ls = zh ? 7 : 4;
      try { ctx.letterSpacing = `${ls}px`; } catch (e) { /* older engines */ }
      ctx.fillStyle = `rgba(40, 86, 118, ${0.8 * seaA})`;
      for (const sea of SEAS) {
        const [x, y] = P(sea.ll);
        const label = T[lang].seas[sea.id];
        const half = ctx.measureText(label).width / 2;
        const r = [x - half - 4, y - 10, x + half + 4, y + 10];
        // an ocean's name is lettered whole or not at all
        if (r[0] < 8 || r[2] > W - 8 || r[1] < 8 || r[3] > H - 8 || hits(r, taken)) continue;
        taken.push(r);
        ctx.fillText(label, x + ls / 2, y);
      }
      ctx.restore();
    }
    if (fontsReady) drawNames(p, taken);

    // where each photograph was made, once close enough to tell them apart
    const close = p > 36;
    state.photoPts = [];
    if (close) {
      for (const id of indexOrder) {
        const [x, y] = P(S.slides[id].ll);
        if (x < -10 || y < -10 || x > W + 10 || y > H + 10) continue;
        state.photoPts.push({ id, p: [x, y] });
        ctx.beginPath(); ctx.arc(x, y, 3.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(251, 250, 246, 0.92)'; ctx.fill();
        ctx.lineWidth = 0.9; ctx.strokeStyle = SEPIA(0.9); ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = SEPIA(0.9); ctx.fill();
      }
    }

    // a pen leader from each place to where its book stands, and the place itself
    if (!diving) {
      ctx.lineWidth = 0.7;
      ctx.strokeStyle = SEPIA(0.6);
      for (const b of pinList) {
        if (Math.hypot(b.x - b.ax, b.y - b.ay) > 6) { ctx.beginPath(); ctx.moveTo(b.ax, b.ay); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      }
      for (const b of pinList) {
        ctx.beginPath(); ctx.arc(b.ax, b.ay, 3.2, 0, Math.PI * 2);
        ctx.fillStyle = PAPER; ctx.fill();
        ctx.lineWidth = 1; ctx.strokeStyle = SEPIA(0.95); ctx.stroke();
        ctx.beginPath(); ctx.arc(b.ax, b.ay, 1.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgb(196, 84, 100)'; ctx.fill();
      }
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
    const k = clamp(Math.min((W - pad.l - pad.r) / Math.max(1, x1 - x0), (H - pad.t - pad.b) / Math.max(1, y1 - y0)), state.kMin, 160);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const sx = pad.l + (W - pad.l - pad.r) / 2, sy = pad.t + (H - pad.t - pad.b) / 2;
    return d3.zoomIdentity.translate(sx - cx * k, sy - cy * k).scale(k);
  }
  function homeTransform() {
    const small = narrow.matches;
    const pad = small ? { l: 60, r: 60, t: 150, b: 170 } : { l: 90, r: 110, t: 130, b: 110 };
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
    zOut.disabled = state.z.k <= state.kMin * 1.001;
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
    // every frame starts from the places themselves, so a given view always lays out the same way
    for (const q of pinList) {
      const a = P(q.ll);
      q.ax = a[0]; q.ay = a[1];
      q.x = q.ax; q.y = q.ay;
      q.hw = small ? bw / 2 + 2 : Math.max(bw / 2 + 3, q.lw / 2 + 2);
    }
    // pushed apart from their neighbours: books never cover each other
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
    // a book whose place is in view keeps itself and its name whole inside the window, on a longer leader
    const { W } = state;
    for (const q of pinList) {
      if (q.ax < 0 || q.ax > W) continue;
      const half = Math.max(bw / 2, (q.lw || 0) / 2) + 6;
      q.x = clamp(q.x, half, W - half - (small ? 0 : 30));
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
    syncScroll();
  }

  /* ------------------------------------------------------------ the cover: a full-window gallery of the country */

  const coverTrack = $('#cover-track');
  const gal = { ids: [], i: 0, drag: 0, cid: null };
  function renderCover(cid, view, coverId) {
    const all = countries[cid].photos.filter((id) => S.slides[id]);
    leaf.classList.toggle('is-plain', !all.length);
    gal.cid = cid;
    if (!all.length) { gal.ids = []; cover.hidden = true; coverTrack.textContent = ''; return; }
    // the chosen photograph first, then the rest of the country in order, coming round
    const at = Math.max(0, all.indexOf(coverId));
    gal.ids = all.slice(at).concat(all.slice(0, at));
    cover.hidden = false;
    cover.setAttribute('aria-label', T[lang].coverLabel(L(bookByCountry[cid].title)));
    // one figure per photograph; each gets its picture when it is shown or about to be (loadSlide)
    coverTrack.textContent = '';
    gal.ids.forEach((id, i) => {
      const sl = S.slides[id];
      const fig = document.createElement('figure');
      fig.className = 'slide';
      fig.dataset.i = String(i);
      const img = document.createElement('img');
      img.alt = '';
      img.draggable = false;
      img.decoding = 'async';
      img.width = sl.w; img.height = sl.h;
      fig.appendChild(img);
      coverTrack.appendChild(fig);
    });
    $('#cover-hint').textContent = isGuide(view) ? t('hintGuide') : t('hintPhotos');
    cover.classList.toggle('is-single', gal.ids.length < 2);
    showSlide(0, false);
  }
  function loadSlide(i) {
    const fig = coverTrack.children[i];
    if (!fig) return;
    const img = fig.firstElementChild;
    const sl = S.slides[gal.ids[i]];
    img.alt = L(sl.alt);
    if (img.dataset.ok) return;
    img.sizes = '100vw';
    img.srcset = srcset(sl);
    img.src = imgSrc(sl, 1280);
    if (i === gal.i) img.fetchPriority = 'high';
    img.dataset.ok = '1';
  }
  function showSlide(i, animate = true) {
    const n = gal.ids.length;
    if (!n) return;
    gal.i = clamp(i, 0, n - 1);
    gal.drag = 0;
    cover.classList.toggle('is-sliding', animate && !reduce.matches);
    cover.style.setProperty('--drag', '0px');
    Array.from(coverTrack.children).forEach((fig, k) => {
      fig.style.setProperty('--d', String(k - gal.i));
      fig.classList.toggle('is-current', k === gal.i);
      fig.setAttribute('aria-hidden', String(k !== gal.i));
    });
    // the photograph shown and its neighbours, so a swipe never waits
    [gal.i, gal.i + 1, gal.i - 1, gal.i + 2].forEach((k) => { if (k >= 0 && k < n) loadSlide(k); });
    const sl = S.slides[gal.ids[gal.i]];
    $('#cover-cap').innerHTML = `<b>${esc(L(sl.place))}</b><span>${esc(L(countries[gal.cid].name))}</span>`;
    $('#cover-count').textContent = n > 1 ? T[lang].slideOf(gal.i + 1, n) : '';
    $('#cover-prev').disabled = gal.i === 0;
    $('#cover-next').disabled = gal.i === n - 1;
    pageCover = gal.ids[gal.i];
  }
  const stepSlide = (d) => { if (gal.ids.length > 1) { showSlide(gal.i + d, true); wake(); } };
  $('#cover-prev').addEventListener('click', () => stepSlide(-1));
  $('#cover-next').addEventListener('click', () => stepSlide(1));

  // the photograph follows the finger (or the mouse) sideways; the page scrolls up and down as ever
  let gdrag = null;
  const edgeDrag = (d) => ((gal.i === 0 && d > 0) || (gal.i === gal.ids.length - 1 && d < 0) ? d * 0.28 : d);
  cover.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target.closest('button') || gal.ids.length < 2 || diving && !leaf.classList.contains('is-open')) return;
    gdrag = { id: e.pointerId, x: e.clientX, y: e.clientY, lx: e.clientX, lt: performance.now(), v: 0, on: false };
  });
  cover.addEventListener('pointermove', (e) => {
    if (!gdrag || gdrag.id !== e.pointerId) return;
    const dx = e.clientX - gdrag.x, dy = e.clientY - gdrag.y;
    if (!gdrag.on) {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        gdrag.on = true;
        try { cover.setPointerCapture(e.pointerId); } catch (err) { /* fine */ }
        cover.classList.remove('is-sliding');
        cover.classList.add('is-dragging');
      } else if (Math.abs(dy) > 12) { gdrag = null; return; } else return;
    }
    const now = performance.now();
    gdrag.v = (e.clientX - gdrag.lx) / Math.max(1, now - gdrag.lt);
    gdrag.lx = e.clientX; gdrag.lt = now;
    gal.drag = edgeDrag(dx);
    cover.style.setProperty('--drag', `${gal.drag.toFixed(1)}px`);
  });
  const endDrag = (e) => {
    if (!gdrag || gdrag.id !== e.pointerId) return;
    const was = gdrag;
    gdrag = null;
    cover.classList.remove('is-dragging');
    if (!was.on) return;
    const w = cover.clientWidth, d = gal.drag;
    const fast = Math.abs(was.v) > 0.45 && performance.now() - was.lt < 120;
    let to = gal.i;
    if (d < -w * 0.16 || (fast && was.v < 0 && d < -16)) to += 1;
    else if (d > w * 0.16 || (fast && was.v > 0 && d > 16)) to -= 1;
    showSlide(to, true);
    wake();
  };
  cover.addEventListener('pointerup', endDrag);
  cover.addEventListener('pointercancel', endDrag);
  // a sideways swipe on a trackpad does the same
  let wheelAcc = 0, wheelTimer = 0, wheelLock = false;
  cover.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || gal.ids.length < 2) return;
    e.preventDefault();
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => {
      if (!wheelLock) {
        const w = cover.clientWidth;
        showSlide(gal.drag < -w * 0.1 ? gal.i + 1 : gal.drag > w * 0.1 ? gal.i - 1 : gal.i, true);
      }
      wheelLock = false; wheelAcc = 0;
    }, 170);
    if (wheelLock) return;
    wheelAcc -= e.deltaMode === 1 ? e.deltaX * 16 : e.deltaX;
    cover.classList.remove('is-sliding');
    gal.drag = edgeDrag(wheelAcc);
    cover.style.setProperty('--drag', `${gal.drag.toFixed(1)}px`);
    if (Math.abs(wheelAcc) > cover.clientWidth * 0.22) { wheelLock = true; showSlide(gal.i + (wheelAcc < 0 ? 1 : -1), true); }
    wake();
  }, { passive: false });

  // the words on the cover step back after a moment of stillness, and return at any move
  let stillTimer = 0;
  function wake() {
    leaf.classList.remove('is-still');
    clearTimeout(stillTimer);
    if (page && !leaf.hidden) stillTimer = setTimeout(() => leaf.classList.add('is-still'), 2500);
  }
  ['pointermove', 'pointerdown', 'keydown', 'touchstart'].forEach((ev) => leaf.addEventListener(ev, wake, { passive: true }));

  // down is the page: it rises over the cover, and the cover darkens a little under it
  let scrollQueued = false;
  function syncScroll() {
    scrollQueued = false;
    const y = leafScroll.scrollTop, h = cover.hidden ? 1 : cover.clientHeight || 1;
    cover.style.setProperty('--up', clamp(y / h, 0, 1).toFixed(3));
    leaf.classList.toggle('is-past', leaf.classList.contains('is-plain') || y > h * 0.82);
    if (y > 24) leaf.classList.add('is-scrolled');
  }
  leafScroll.addEventListener('scroll', () => { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(syncScroll); } }, { passive: true });

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
  const FROM_MAP = [{ opacity: 0, filter: 'blur(8px)', transform: 'scale(1.04)' }, { opacity: 1, filter: 'blur(0px)', transform: 'scale(1)' }];
  function clearDive() {
    diveTimers.forEach(clearTimeout); diveTimers = [];
    if (diveRing) { erase([diveRing]); marks = marks.filter((m) => m !== diveRing); diveRing = null; }
    if (diveTween) { diveTween.cancel(); diveTween = null; }
    leaf.getAnimations({ subtree: true }).forEach((a) => a.cancel());
  }
  function settleOpen(gen) {
    if (gen !== pageGen) return;
    leaf.classList.add('is-open');
    later(() => { if (gen === pageGen) leaf.classList.add('is-captioned'); }, reduce.matches ? 0 : 120);
    if (diveRing) { erase([diveRing]); marks = marks.filter((m) => m !== diveRing); diveRing = null; }
    const target = leaf.classList.contains('is-plain') ? $('#leaf-back') : $('#cover-back');
    target.focus({ preventScroll: true });
    wake();
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
    leaf.classList.remove('is-open', 'is-captioned', 'is-leaving', 'is-scrolled', 'is-still');
    syncScroll();
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
    const hasCover = !leaf.classList.contains('is-plain');
    if (opts.animate && !reduce.matches) {
      // 1. the map magnifies into the country while the pen tightens a ring on the spot
      moveTo(landing, 2000);
      diveRing = penRing(ringD(14), ll);
      marks.push(diveRing);
      drawStroke(diveRing.firstChild, 0, 500);
      diveTween = tween(2000, (e) => { if (diveRing) { diveRing.dataset.s = (6 - 5 * e).toFixed(3); placePen(); } });
      // 2. in the last third of the zoom, while the camera is still moving, the photograph
      //    dissolves in over the whole window, from a soft blur, and the map softens beneath
      later(() => {
        if (gen !== pageGen) return;
        leaf.hidden = false;
        app.classList.add('is-soft');
        if (!hasCover) {
          leaf.classList.add('is-open');
          leaf.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 800, easing: SOFT }).onfinish = () => settleOpen(gen);
          return;
        }
        const a = coverTrack.animate(FROM_MAP, { duration: 1800, easing: SOFT, fill: 'both' });
        a.onfinish = () => { settleOpen(gen); a.cancel(); };
      }, hasCover ? 1300 : 1700);
    } else {
      moveTo(landing, 0);
      leaf.hidden = false;
      app.classList.add('is-soft');
      if (opts.animate) {
        // reduced motion: a plain fade
        leaf.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' }).onfinish = () => settleOpen(gen);
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
    clearTimeout(stillTimer);
    const cid = viewCountry(page);
    const pin = pinList.find((q) => q.country === cid);
    const ll = placeLL(cid);
    page = null;
    if (tocObserver) { tocObserver.disconnect(); tocObserver = null; }
    const back0 = state.before || homeTransform();
    const surface = () => {
      diving = false;
      state.before = null;
      app.inert = flightsOpen;
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
      if (!flightsOpen) globe.start();
      if (pin && opts.focus !== false && !flightsOpen) pin.el.querySelector('.book').focus({ preventScroll: true });
    };
    const done = () => {
      if (gen !== pageGen) return;
      leaf.hidden = true;
      leaf.getAnimations({ subtree: true }).forEach((a) => a.cancel());
      leaf.classList.remove('is-open', 'is-captioned', 'is-leaving', 'is-past', 'is-scrolled', 'is-still');
      leafContent.textContent = '';
      coverTrack.textContent = '';
      gal.ids = [];
    };
    const atCover = !leaf.classList.contains('is-plain') && leafScroll.scrollTop < 80;
    if (opts.animate && !reduce.matches && atCover) {
      // the same dissolve, reversed and a little quicker; then the camera draws back out
      leaf.classList.remove('is-captioned');
      later(() => {
        if (gen !== pageGen) return;
        leaf.classList.remove('is-open');
        app.classList.remove('is-soft');
        const a = coverTrack.animate(FROM_MAP.slice().reverse(), { duration: 1300, easing: SOFT, fill: 'forwards' });
        a.onfinish = () => { done(); surface(); };
      }, 220);
    } else if (opts.animate) {
      leaf.classList.add('is-leaving');
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
    if (want.page !== page && page) closePage({ animate: animate && !want.page && !want.flights, focus: !want.page && !want.flights });
    if (!!want.flights !== flightsOpen) {
      if (flightsOpen) closeFlights({ animate: animate && !want.page, focus: !want.page });
      else openFlights({ animate });
    }
    if (want.page && want.page !== page) openPage(want.page, { animate, cover: want.cover });
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
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (photo || page || flightsOpen) { e.preventDefault(); back(); }
      else if (indexEl.classList.contains('is-open')) { e.preventDefault(); setIndex(false); }
      return;
    }
    // on the cover, left and right move through the country's photographs
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && page && !photo && !flightsOpen && gal.ids.length > 1 &&
        leaf.classList.contains('is-open') && leafScroll.scrollTop < innerHeight * 0.5 && !e.target.closest('input, textarea, select, .sheet-wrap')) {
      e.preventDefault();
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
      const top = leafScroll.scrollTop, keep = gal.i;
      renderLeaf(page, gal.ids[0]);
      if (gal.ids.length) showSlide(keep, false);
      leafScroll.scrollTop = top;
      syncScroll();
    }
    measureUI();
    measured.clear();
    loadZhFaces();
    if (photo) renderViewer();
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
          const edgeN = (NH[((y + seed) & 511) * 512 + (x & 511)] - 0.5) * 0.12;
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
    set('--dab-glaze', dab([214, 120, 136], 120, 36, 3, 0.5));
    set('--dab-sea', dab([128, 180, 212], 720, 150, 9, 0.34));
    set('--stroke', dab([118, 172, 206], 520, 22, 21, 0.5));
  }

  /* ------------------------------------------------------------ the flights, from his journeys */

  // a journey with its own legs draws those, in order; otherwise one flight from where he flies
  // from to each of its places. Where he flies from is never named or marked.
  const FROM = Array.isArray(S.flightsFrom) ? [+S.flightsFrom[1], +S.flightsFrom[0]] : [121.56, 25.03];
  const nearFrom = (ll) => d3.geoDistance(ll, FROM) < 0.012;
  const cityName = (c) => (c == null ? '' : typeof c === 'object' ? L(c) : clean(String(c)));
  const okEnd = (e) => e && Number.isFinite(+e.lat) && Number.isFinite(+e.lng);
  const journeys = (Array.isArray(S.journeys) ? S.journeys : []).map((j) => {
    const cs = (j.countries || []).filter((c) => countries[c] && bookByCountry[c]);
    const legs = Array.isArray(j.legs) ? j.legs.filter((l) => l && okEnd(l.from) && okEnd(l.to)) : [];
    let routes, points;
    if (legs.length) {
      routes = legs.map((l) => ({ from: [+l.from.lng, +l.from.lat], to: [+l.to.lng, +l.to.lat], mode: l.mode || 'flight' }));
      const seen = new Map();
      for (const l of legs) {
        for (const e of [l.from, l.to]) {
          const ll = [+e.lng, +e.lat];
          if (nearFrom(ll) || /^(TPE|TSA)$/i.test(String(e.code || ''))) continue;
          const key = e.city ? cityName(e.city).toLowerCase() : e.code ? String(e.code) : `${ll[0].toFixed(1)},${ll[1].toFixed(1)}`;
          if (!seen.has(key)) seen.set(key, { ll, label: () => (lang === 'zh' && e.zh ? cityName(e.zh) : cityName(e.city)) || String(e.code || '') });
        }
      }
      points = [...seen.values()];
    } else {
      const places = cs.filter((c) => c !== 'taiwan');
      routes = places.map((c) => ({ from: FROM, to: [placeLL(c)[1], placeLL(c)[0]], mode: 'flight' }));
      points = places.map((c) => ({ ll: [placeLL(c)[1], placeLL(c)[0]], label: () => L(bookByCountry[c].title) }));
    }
    return { id: j.id, date: j.date, countries: cs, routes, points, flights: WC.flights(routes) };
  });
  const allRoutes = (() => {
    const seen = new Set(), out = [];
    for (const j of journeys) {
      for (const r of j.routes) {
        if (r.mode !== 'flight') continue;
        const k = [r.from, r.to].map((q) => q.map((v) => v.toFixed(1)).join(',')).join('>');
        if (seen.has(k)) continue;
        seen.add(k);
        out.push(r);
      }
    }
    if (!out.length) for (const c of order) if (c.id !== 'taiwan') out.push({ from: FROM, to: [placeLL(c.id)[1], placeLL(c.id)[0]], mode: 'flight' });
    return out;
  })();
  const flights = WC.flights(allRoutes);
  const globeBtn = $('#globe');
  const globe = new WC.Globe($('#globe-canvas'), { land: null, travel: null, flights, reduce: () => reduce.matches });
  function sizeGlobe() { globe.resize(narrow.matches ? 92 : 168); }
  let opening = null;

  /* ------------------------------------------------------------ the Flights view: the globe in hand, the journeys beside it */

  const flightsEl = $('#flights');
  const fCanvas = $('#flights-globe');
  const fSide = $('#flights-side');
  const journeysEl = $('#journeys');
  let flightsOpen = false, flightsGen = 0;
  const big = new WC.BigGlobe(fCanvas, {
    land: null, travel: null, flights, reduce: () => reduce.matches,
    font: () => (lang === 'zh' ? '500 13px "Noto Sans TC", sans-serif' : '500 11.5px "Alegreya Sans", sans-serif'),
    ls: () => (lang === 'zh' ? '2px' : '2.2px'),
  });
  function renderJourneys() {
    journeysEl.innerHTML = journeys.map((j, i) => {
      const places = j.countries.map((c) => {
        const b = bookByCountry[c];
        const sl = b.photo ? S.slides[b.photo] : null;
        const thumb = sl
          ? `<img src="${imgSrc(sl, 640)}" alt="" width="${sl.w}" height="${sl.h}" loading="lazy" decoding="async">`
          : '<span class="jplace__none" aria-hidden="true"></span>';
        return `<li><button type="button" class="jplace" data-view="${b.view}" aria-label="${esc(T[lang].goPlace(L(b.title)))}">${thumb}<span>${esc(L(b.title))}</span></button></li>`;
      }).join('');
      return `<li class="journey" data-j="${i}"><p class="journey__date">${esc(L(j.date))}</p><ul class="journey__places">${places}</ul></li>`;
    }).join('');
    jActive = -1;
  }
  let jActive = -1, jLeave = 0;
  function focusJourney(i) {
    clearTimeout(jLeave);
    if (i === jActive) return;
    jActive = i;
    $$('.journey', journeysEl).forEach((el) => el.classList.toggle('is-on', Number(el.dataset.j) === i));
    journeysEl.classList.toggle('has-on', i >= 0);
    if (i < 0) { big.focus(null); return; }
    const j = journeys[i];
    big.focus({ flights: j.flights, points: j.points.map((p) => ({ ll: p.ll, label: lang === 'zh' ? p.label() : p.label().toUpperCase() })) });
  }
  journeysEl.addEventListener('pointerover', (e) => { const li = e.target.closest('.journey'); if (li) focusJourney(Number(li.dataset.j)); });
  journeysEl.addEventListener('pointerleave', () => { clearTimeout(jLeave); jLeave = setTimeout(() => focusJourney(-1), 260); });
  journeysEl.addEventListener('focusin', (e) => { const li = e.target.closest('.journey'); if (li) focusJourney(Number(li.dataset.j)); });
  journeysEl.addEventListener('focusout', (e) => { if (!journeysEl.contains(e.relatedTarget)) { clearTimeout(jLeave); jLeave = setTimeout(() => focusJourney(-1), 260); } });
  journeysEl.addEventListener('click', (e) => {
    const b = e.target.closest('.jplace');
    if (!b) return;
    const view = b.dataset.view;
    // straight from the flights into that country on the map
    closeFlights({ animate: false, focus: false });
    try { history.replaceState({ wc: true, page: view, cover: null }, '', `#${view}`); } catch (err) { /* fine */ }
    openPage(view, { animate: true });
  });
  // where the small globe sits on the page and where the large one will: centre and radius
  function smallCircle() {
    const r = $('#globe-canvas').getBoundingClientRect();
    return { cx: r.left + r.width / 2, cy: r.top + r.height * 0.46, r: r.width * 0.44 };
  }
  function bigCircle() {
    const r = fCanvas.getBoundingClientRect();
    const f = big.frame();
    return { cx: r.left + f.cx, cy: r.top + f.cy, r: f.R, ox: f.cx, oy: f.cy };
  }
  const flip = (a, b) => `translate(${(a.cx - b.cx).toFixed(1)}px, ${(a.cy - b.cy).toFixed(1)}px) scale(${(a.r / b.r).toFixed(4)})`;
  const GROW = 'cubic-bezier(0.16, 1, 0.3, 1)';
  function openFlights(opts = {}) {
    if (flightsOpen) return;
    flightsOpen = true;
    flightsGen += 1;
    if (opening && !opening.done) opening.skip();
    setIndex(false, false);
    clearActive();
    renderJourneys();
    flightsEl.hidden = false;
    flightsEl.scrollTop = 0;
    app.inert = true;
    big.o.land = globe.o.land; big.o.travel = globe.o.travel;
    big.focusing = null; big.tw = null; big.vel = [0, 0];
    big.rot = [globe.lon, -18]; big.zoom = 1; big.t0 = globe.t0;
    big.resize();
    big.start();
    globe.stop();
    globeBtn.classList.add('is-away');
    live.textContent = t('flightsTitle');
    if (opts.animate && !reduce.matches) {
      // the small globe grows out of its corner into the large one, and the journeys come in beside it
      const a = smallCircle(), b = bigCircle();
      fCanvas.style.setProperty('--ox', `${b.ox.toFixed(1)}px`);
      fCanvas.style.setProperty('--oy', `${b.oy.toFixed(1)}px`);
      fCanvas.animate([{ transform: flip(a, b) }, { transform: 'none' }], { duration: 1000, easing: GROW });
      $('.flights__paper', flightsEl).animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600, easing: SOFT });
      fSide.animate([{ opacity: 0, transform: 'translateX(1.5rem)' }, { opacity: 1, transform: 'none' }], { duration: 800, delay: 320, easing: GROW, fill: 'backwards' });
    } else if (opts.animate) {
      flightsEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out' });
    }
    requestAnimationFrame(() => $('#flights-back').focus({ preventScroll: true }));
  }
  function closeFlights(opts = {}) {
    if (!flightsOpen) return;
    flightsOpen = false;
    flightsGen += 1;
    const gen = flightsGen;
    clearTimeout(jLeave);
    jActive = -1;
    app.inert = !!page;
    const done = () => {
      if (gen !== flightsGen) return;
      flightsEl.getAnimations({ subtree: true }).forEach((x) => x.cancel());
      flightsEl.hidden = true;
      big.stop();
      globe.lon = big.rot[0];
      globe.t0 = big.t0;
      globeBtn.classList.remove('is-away');
      if (!page) globe.start();
      if (opts.focus !== false && !page) globeBtn.focus({ preventScroll: true });
    };
    if (opts.animate && !reduce.matches) {
      // back into its corner: the globe settles to the small one's tilt as it shrinks
      big.focusing = null;
      big.vel = [0, 0];
      big.tw = { r0: big.rot.slice(), r1: [big.rot[0], -18], z0: big.zoom, z1: 1, t0: performance.now(), dur: 700 };
      const a = smallCircle(), b = bigCircle();
      fCanvas.style.setProperty('--ox', `${b.ox.toFixed(1)}px`);
      fCanvas.style.setProperty('--oy', `${b.oy.toFixed(1)}px`);
      fSide.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: 'ease-out', fill: 'forwards' });
      $('.flights__paper', flightsEl).animate([{ opacity: 1 }, { opacity: 0 }], { duration: 700, delay: 200, easing: SOFT, fill: 'forwards' });
      fCanvas.animate([{ transform: 'none' }, { transform: flip(a, b) }], { duration: 850, easing: 'cubic-bezier(0.7, 0, 0.3, 1)', fill: 'forwards' }).onfinish = done;
    } else if (opts.animate) {
      flightsEl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'ease-out', fill: 'forwards' }).onfinish = done;
    } else done();
  }
  globeBtn.addEventListener('click', () => {
    if (flightsOpen || diving) return;
    try { history.pushState({ wc: true, flights: true }, '', '#flights'); } catch (e) { /* fine */ }
    openFlights({ animate: true });
  });
  $('#flights-back').addEventListener('click', () => back());

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
    const w110 = await fetch('../vendor/countries-110m.json').then((r) => r.json());
    state.w110 = w110;
    state.land110 = topojson.feature(w110, w110.objects.land);
    state.coast110 = pathDeg(topojson.mesh(w110, w110.objects.land));
    state.landFill110 = pathDeg(state.land110);
    const f110 = featsFor(w110);
    globe.o.land = state.land110;
    globe.o.travel = Object.values(f110);
    big.o.land = globe.o.land; big.o.travel = globe.o.travel;
    sizeGlobe();
    queueDraw();
    const relief = new Image();
    relief.src = '../vendor/relief/SR_50M-4096.jpg';
    const reliefReady = relief.decode().then(() => { state.relief = relief; }).catch(() => {});
    const w50 = await fetch('../vendor/countries-50m.json').then((r) => r.json());
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

  function start() {
    applyWords();
    renderIndex();
    setIndex(false, false);
    sizeMap();
    renderPins();
    makeMaterials();
    moveTo(homeTransform(), 0);
    state.settle = 6;
    queueDraw();
    if (document.fonts && document.fonts.load) {
      Promise.all([document.fonts.load('italic 400 15px "Alegreya Sans"'), document.fonts.load('500 12px "Alegreya Sans"'), document.fonts.load('400 20px "Alegreya"')]).then(() => { fontsReady = true; measured.clear(); measurePins(); measureUI(); state.settle = 4; queueDraw(); }).catch(() => { fontsReady = true; });
    } else fontsReady = true;

    const want = parse(location.hash);
    let first = false;
    try { first = !sessionStorage.getItem('wc-opened'); sessionStorage.setItem('wc-opened', '1'); } catch (e) { first = false; }
    const playOpening = first && !reduce.matches && !want.page && !want.photo && !want.flights;
    measureUI();
    loadZhFaces();
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
          onDone: () => { app.classList.remove('is-opening'); app.classList.add('is-arrived'); if (!flightsOpen && !page) globe.start(); },
        });
        const skip = (e) => { if (e && e.type === 'keydown' && e.key === 'Tab') return; if (opening && !opening.done) opening.skip(); };
        ['pointerdown', 'wheel', 'keydown'].forEach((ev) => window.addEventListener(ev, skip, { once: true, passive: true }));
      } else {
        if (!flightsOpen && !page) globe.start();
      }
    }).catch(() => { app.classList.remove('is-opening'); });

    // a page, a photograph or the flights named in the address opens directly
    if (want.page || want.photo || want.flights) {
      try { history.replaceState({ wc: false, page: want.page, photo: want.photo, flights: !!want.flights }, '', location.href); } catch (e) { /* fine */ }
      apply(want, false);
    }
    let rz = 0;
    window.addEventListener('resize', () => {
      cancelAnimationFrame(rz);
      rz = requestAnimationFrame(() => {
        const c = invertLL(state.W / 2, state.H / 2);
        sizeMap();
        const k = Math.max(state.z.k, state.kMin);
        sizeGlobe();
        measureUI();
        if (flightsOpen) big.resize();
        if (page) syncScroll();
        const b = baseXY([c[1], c[0]]);
        state.z = d3.zoomIdentity.translate(state.W / 2 - b[0] * k, state.H / 2 - b[1] * k).scale(k);
        sel.call(zoom.transform, state.z);
        state.settle = 4;
        queueDraw();
      });
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { globe.stop(); big.stop(); } else if (flightsOpen) big.start(); else if (!page) globe.start();
    });
    updateZoomButtons();
  }
  WC.state = state; WC.big = big; // for inspection in the console
  start();
})();

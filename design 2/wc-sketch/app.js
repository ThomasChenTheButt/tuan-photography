/* tuan photography 陳亮元 · design 2 · "Pen and wash"
   A travel sketchbook map. The pen goes down first: coastlines in fine-liner with the nib's
   pressure swelling and thinning along them, borders in a lighter broken line, the mountains
   hatched, and every country lettered in small capitals. Then light washes go over it, a little
   off the lines (paint.js). The painting is made once per zoom band and laid on a canvas that
   d3-zoom moves; the pen and the lettering are drawn over it live.
   Design 1's books stand at their places, one per book (a country, or a city such as New York).
   Choosing one magnifies the map into the country (or the city),
   and as the camera settles the cover photograph dissolves in across the whole window: a gallery
   of that country's photographs (swipe for the next), with the guide or the photographs page
   below it. The small globe in the corner opens into the Flights view, a sketchbook spread with
   the globe on the left page and his journeys on the right. */
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
      zoomGroup: 'Zoom', world: 'Whole map', oceanDial: 'Photo',
      flights: 'Flights', globeLabel: 'Flights: open the globe of journeys',
      scrollHint: 'Scroll',
      flightsTitle: 'Flights', flightsHow: 'Drag to turn the globe', speed: 'Speed', speedSlow: 'Slow',
      flightsLede: (n) => `${n} journeys. Choose one to follow its flights on the globe.`,
      journeyAria: (d) => `Follow the journey of ${d}`,
      modes: { flight: 'flight', train: 'train', bus: 'bus', car: 'car', ground: 'overland' },
      legTail: (b, m) => `${b} · ${m}`,
      wholeJourney: 'The whole journey',
      keyLabel: 'Key', keyBeen: 'Travelled',
      indexTitle: 'Photographs', indexOpen: 'Show the photographs', indexClose: 'Close',
      count: (n, p) => `${n} photographs from ${p} places`,
      tally: (n, all, pct) => `${n} / ${all} countries · ${pct}% of the world`,
      seePhotos: 'See the photographs',
      hintGuide: 'Scroll for the guide', hintPhotos: 'Scroll for the photographs',
      coverLabel: (p) => `Photographs of ${p}`,
      prev: 'Previous', next: 'Next',
      camera: 'Camera', lens: 'Lens', settings: 'Settings',
      ofN: (i, n) => `${i} of ${n}`,
      madeOf: (p) => `${p}: how this was made`,
      lang: 'Language', site: 'Site',
      nPhotos: (n) => (n === 1 ? '1 photograph' : `${n} photographs`),
      seas: { pacific: 'Pacific Ocean', indian: 'Indian Ocean', atlantic: 'Atlantic Ocean', southern: 'Southern Ocean', arctic: 'Arctic Ocean' },
      opening: (p) => `${p} is open.`,
      // the name the opening sets over the globe; ?name=1 to 5 in the address chooses one
      names: ["Tuan's Photography Journey", 'Tuan, Through the Lens', 'Where Tuan Has Been', 'A Journey in Photographs', "Tuan's Travels, in Photographs"],
      endLine: 'Every photograph here is his own, made on the trip.',
      bookAria: (p, s) => `${p}: ${s}`,
    },
    zh: {
      ig: 'Instagram',
      mapLabel: '走過的地方地圖',
      mapHint: '拖曳或用方向鍵移動地圖；捲動，或按加號、減號縮放。Tab 鍵逐一走過每本書。',
      zoomGroup: '縮放', world: '整張地圖', oceanDial: '照片',
      flights: '飛過的航線', globeLabel: '飛過的航線：打開旅程地球',
      scrollHint: '往下捲',
      flightsTitle: '飛過的航線', flightsHow: '拖曳轉動地球', speed: '速度', speedSlow: '慢慢看',
      flightsLede: (n) => `${n} 段旅程。選一段，在地球上看它的航線。`,
      journeyAria: (d) => `看 ${d} 的旅程`,
      modes: { flight: '飛機', train: '火車', bus: '巴士', car: '開車', ground: '陸路' },
      legTail: (b, m) => `${b}・${m}`,
      wholeJourney: '整趟旅程',
      keyLabel: '圖例', keyBeen: '去過',
      indexTitle: '照片', indexOpen: '顯示照片', indexClose: '關閉',
      count: (n, p) => `${p} 個地方，${n} 張照片`,
      tally: (n, all, pct) => `${n} / ${all} 個國家，走過世界 ${pct}%`,
      seePhotos: '看照片',
      hintGuide: '往下看攻略', hintPhotos: '往下看照片',
      coverLabel: (p) => `${p}的照片`,
      prev: '上一張', next: '下一張',
      camera: '相機', lens: '鏡頭', settings: '參數',
      ofN: (i, n) => `第 ${i} 張，共 ${n} 張`,
      madeOf: (p) => `${p}：這張怎麼拍`,
      lang: '語言', site: '網站',
      nPhotos: (n) => `${n} 張照片`,
      seas: { pacific: '太平洋', indian: '印度洋', atlantic: '大西洋', southern: '南冰洋', arctic: '北冰洋' },
      opening: (p) => `已打開${p}。`,
      names: ['Tuan 的攝影旅程', 'Tuan 的鏡頭之旅', 'Tuan 去過的地方', '用照片走過的路', 'Tuan 的旅行照片'],
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

  const ask = new URLSearchParams(location.search);
  // his choice (2026-10-02): "Tuan, Through the Lens" / Tuan 的鏡頭之旅; ?name=1 to 5 still shows the others
  const nameN = clamp(parseInt(ask.get('name'), 10) || 2, 1, 5) - 1;
  // which opening a first visit plays: 'classic' (the photograph, then the map developing out of
  // it) or 'corridor' (a corridor of his prints first). Classic: his call, 2026-10-03, after a
  // friend found the corridor odd (it was the default for a day). The turning globe that used to
  // open the classic went the same day at his word. In the address, ?opening plays the classic
  // and ?opening=corridor the corridor, every time.
  // The scroll trial (this experiment, after noomoagency.com, his find, 2026-10-03): 'scroll', the
  // same opening, but once the photograph is up it plays as far as he scrolls (forward or back),
  // the way that site's pages come with the scroll. ?opening plays it; ?opening=classic the timed one
  const OPENING_DEFAULT = 'scroll';
  // photographs on the home map (his note: the map alone "doesn't scream photography"). Two
  // trials behind one switch so they can be compared: ?photos=sea lays one large print in the
  // empty ocean and cycles through every photograph; ?photos=land turns each travelled country's
  // wash into its cover photograph; ?photos=ocean (his clarification) lays one photograph under
  // the whole window and lets it show only through the sea; ?photos=both is ocean and land
  // together; ?photos=none neither. ?o=0.35 sets the ocean's strength (0.05 to 1) for a look.
  // MAP_PHOTOS_DEFAULT is what the page does with no switch in the address: the photograph
  // through the sea, his call, 2026-10-03
  const MAP_PHOTOS_DEFAULT = 'ocean';
  const mapPhotos = ['sea', 'land', 'ocean', 'both', 'none'].includes(ask.get('photos')) ? ask.get('photos') : MAP_PHOTOS_DEFAULT;
  const SEA_PRINT = mapPhotos === 'sea';
  const OCEAN_PHOTO = mapPhotos === 'ocean' || mapPhotos === 'both';
  const LAND_PHOTOS = mapPhotos === 'land' || mapPhotos === 'both';
  const t = (k) => (T[lang][k] !== undefined ? T[lang][k] : (S.i18n[lang][k] !== undefined ? S.i18n[lang][k] : k));
  const L = (o) => clean(o ? (typeof o === 'string' ? o : o[lang] !== undefined ? o[lang] : o.en) : '');
  const cityName = (c) => (typeof c === 'object' && c ? L(c) : clean(c || ''));

  /* ------------------------------------------------------------ data */

  // A BOOK is the unit a visitor sees and chooses: one per shelf entry, usually a country, but a
  // country may have several (the United States: New York, Boston, San Francisco, Los Angeles).
  // Each has a key (its city, else its guide or country), its own place on the map and address.
  const countries = Object.fromEntries(S.countries.map((c) => [c.id, c]));
  const WORLD_COUNTRIES = 195; // the world's countries, as he counts them (2026-10-03)
  const guide = S.guides.barcelona;
  const books = S.books
    .filter((b) => countries[b.country])
    .map((b) => {
      const key = b.key || b.place || b.guide || b.country;
      return { ...b, key, view: b.guide ? `guide-${b.guide}` : `place-${key}` };
    });
  const bookByKey = Object.fromEntries(books.map((b) => [b.key, b]));
  // a country's first book stands for the country (an old #place-usa opens New York)
  const bookByCountry = {};
  for (const b of books) if (!bookByCountry[b.country]) bookByCountry[b.country] = b;
  const booksOf = (cid) => books.filter((b) => b.country === cid);
  const bookLL = (b) => b.ll || (b.guide && S.guides[b.guide] && S.guides[b.guide].ll) || countries[b.country].ll;
  // a country's place on the map: its first book's, or its own where it has no book
  const placeLL = (cid) => (bookByCountry[cid] ? bookLL(bookByCountry[cid]) : countries[cid].ll);
  // a city's book holds the photographs marked with that city; a country's, the country's
  const photosOf = (b) => countries[b.country].photos.filter((id) => S.slides[id] && (!b.place || S.slides[id].city === b.place));
  const bookOfSlide = (id) => {
    const s = S.slides[id];
    return (s.city && bookByKey[s.city]) || booksOf(s.country).find((b) => !b.place) || bookByCountry[s.country] || null;
  };
  const indexOrder = [...new Set(books.flatMap(photosOf))];
  const coverFor = (b, want) => {
    const mine = photosOf(b);
    if (want && mine.includes(want)) return want;
    // the arrival opens on the wide photograph; the book wears the upright one
    return b.cover || b.photo || mine[0] || null;
  };
  // when a book's place was travelled: a city's, the journeys that name it, oldest first
  // (New York: 2015, Summer 2025); a country's, the country's own dates
  const bookDate = (b) => {
    const js = b.place ? (S.journeys || []).filter((j) => Array.isArray(j.places) && j.places.includes(b.place)).reverse() : [];
    return js.length ? js.map((j) => L(j.date)).join(lang === 'zh' ? '、' : ', ') : L(countries[b.country].date);
  };
  const coords = ([lat, lng]) => `${Math.abs(lat).toFixed(3)}°${lat >= 0 ? 'N' : 'S'} · ${Math.abs(lng).toFixed(3)}°${lng >= 0 ? 'E' : 'W'}`;
  const nameParts = (b) => {
    const place = L(b.title), country = L(countries[b.country].name);
    return place === country ? [place] : [place, country];
  };
  const nameHTML = (b) => nameParts(b).map(esc).join(`<i>${lang === 'zh' ? '｜' : '|'}</i>`);
  const imgSrc = (s, size) => `../images/web/${size ? size + '/' : ''}${s.file}`;
  const srcset = (s) => `${imgSrc(s, 640)} 640w, ${imgSrc(s, 1280)} 1280w, ${imgSrc(s)} ${s.w}w`;
  const ISO = { spain: '724', uk: '826', france: '250', germany: '276', switzerland: '756', taiwan: '158', japan: '392', 'south-korea': '410', 'hong-kong': '344', china: '156', singapore: '702', vietnam: '704', dubai: '784', australia: '036', 'new-zealand': '554', usa: '840', thailand: '764', myanmar: '104', netherlands: '528', malaysia: '458', andorra: '020' };


  // the flights, from his journeys' own legs in order; where a journey has none, a line from where
  // he sets out to each of its places. Where he sets out from is never named or marked.
  const FROM = S.flightsFrom ? [S.flightsFrom[1], S.flightsFrom[0]] : [121.56, 25.03];
  const atFrom = (ll, code) => code === 'TPE' || code === 'TSA' || d3.geoDistance(ll, FROM) < 0.012;
  const routeList = [];
  const routeKey = (q) => `${q.mode}|${q.from[0].toFixed(2)},${q.from[1].toFixed(2)}|${q.to[0].toFixed(2)},${q.to[1].toFixed(2)}`;
  const journeys = (S.journeys || []).map((j) => {
    let legs;
    if (Array.isArray(j.legs) && j.legs.length) {
      legs = j.legs.filter((l) => l && l.from && l.to).map((l) => ({ from: [l.from.lng, l.from.lat], to: [l.to.lng, l.to.lat], mode: l.mode || 'flight', a: l.from, b: l.to }));
    } else {
      legs = (j.countries || []).filter((cid) => countries[cid]).map((cid) => { const ll = placeLL(cid); return { from: FROM, to: [ll[1], ll[0]], mode: 'flight', a: null, b: { cid } }; });
    }
    legs = legs.filter((q) => d3.geoDistance(q.from, q.to) > 0.0005);
    const idx = legs.map((q) => {
      const k = routeKey(q);
      let i = routeList.findIndex((x) => x.key === k);
      if (i < 0) { routeList.push({ from: q.from, to: q.to, mode: q.mode, key: k }); i = routeList.length - 1; }
      return i;
    });
    // the stops along the way, in order, once each
    const stops = [];
    legs.forEach((q, n) => {
      [[q.a, q.from, true], [q.b, q.to, false]].forEach(([end, ll, dep]) => {
        if (!end || atFrom(ll, end.code)) return;
        const key = end.cid || end.city;
        if (!key || stops.some((s) => s.key === key)) return;
        stops.push({ key, ll, city: end.zh ? { en: end.city, zh: end.zh } : end.city, cid: end.cid, via: idx[n], dep });
      });
    });
    return { ...j, legs, idx, stops };
  });
  const flights = WC.routes(routeList);
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
  const track = $('#cover-track');
  const flightsEl = $('#flights');
  const viewer = $('#viewer');
  const live = $('#live');
  const indexEl = $('#index');
  const indexBody = $('#index-body');
  const indexScroll = $('#index-scroll');
  const SVGNS = 'http://www.w3.org/2000/svg';

  /* ------------------------------------------------------------ the map's frame */

  // an equirectangular plate centred on 10°E, so the relief image lies straight on it and the
  // Pacific seam falls where nothing he visited is. The whole sphere is drawn, pole to pole: the
  // sea is bare paper away from the coasts, so the drawing simply runs on to the window's edges
  const LON0 = 10, LAT_N = 90, LAT_S = -90;
  // the plate is stretched upright: a degree of latitude is SY degrees of longitude tall, so the
  // whole map stands as tall as a desktop window is to its width and Greenland reaches the top
  // (his call, 2026-10-03). World units are stretched degrees: v = -lat * SY, everywhere.
  const SY = 1.25;
  const R0 = 8; // texture px per degree of the whole-world painting
  // the shelf opening (this experiment, his idea, 2026-10-03): the books stand on shelves under
  // the name, and fly to their places as the map comes with the scroll. p: how far they have gone
  // The shelf is design 1's row of books (his choice, 2026-10-03, out of four tried: rows of
  // shelves, one long shelf, a pile, and this): the middle book in front and the rest stepping
  // back into the distance on either side, veiled in paper, leaving from the front outward
  const shelf = { on: false, p: 0, titleY: 0, titleH: 0, cache: null };
  const state = {
    W: 1, H: 1, dpr: 1, S0: 1,
    z: d3.zoomIdentity,
    w110: null, w50: null,
    land110: null, land50: null, travel: [], seams: null,
    coast110: null, coast50: null, borders110: null, borders50: null, landFill110: null,
    lakes: null, lakesPath: null, lakesBigPath: null, lakesX: null, lakesAll: null, lakesXPath: null,
    labels: new Map(), photoPts: [],
    feats: {},
    relief: null, reliefFine: null,
    base: null, regions: [], job: null,
    drawQueued: false, settle: 0,
    before: null,
  };
  const wrapU = (lon) => ((((lon - LON0) % 360) + 540) % 360) - 180;
  const baseXY = (ll) => [state.W / 2 + wrapU(ll[1]) * state.S0, state.H / 2 - ll[0] * SY * state.S0];
  const P = (ll, z = state.z) => { const b = baseXY(ll); return [z.applyX(b[0]), z.applyY(b[1])]; };
  const invertLL = (x, y) => {
    const u = (state.z.invertX(x) - state.W / 2) / state.S0;
    const lat = -(state.z.invertY(y) - state.H / 2) / state.S0 / SY;
    return [((u + LON0 + 540) % 360) - 180, lat];
  };
  const pxPerDeg = (z = state.z) => z.k * state.S0;
  const projDeg = WC.plate(SY).rotate([-LON0, 0]).scale(180 / Math.PI).translate([0, 0]).precision(0);
  const pathDeg = (geo) => { const p = new Path2D(); d3.geoPath(projDeg, p)(geo); return p; };

  function sizeMap() {
    state.W = Math.max(1, mapEl.clientWidth);
    state.H = Math.max(1, mapEl.clientHeight);
    state.dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(state.W * state.dpr);
    canvas.height = Math.round(state.H * state.dpr);
    state.S0 = state.W / 360;
    zoom.extent([[0, 0], [state.W, state.H]])
      .translateExtent([[0, state.H / 2 - LAT_N * SY * state.S0], [state.W, state.H / 2 - LAT_S * SY * state.S0]]);
    penEl.setAttribute('viewBox', `0 0 ${state.W} ${state.H}`);
  }

  /* ------------------------------------------------------------ the painting, by zoom band */

  const bandOf = (p) => {
    const need = p * Math.min(1.5, state.dpr) * 0.85;
    return need <= R0 ? 0 : Math.ceil(2 * Math.log2(need / R0));
  };
  const resOf = (b) => R0 * Math.pow(2, b / 2);
  // close enough for the smaller lakes (about where the photographs' own points appear)
  const LAKES_R = 45;
  // the view in world degrees (u east of 10°E, v = -latitude)
  function viewRect(z) {
    const p = pxPerDeg(z);
    const u0 = (z.invertX(0) - state.W / 2) / state.S0, v0 = (z.invertY(0) - state.H / 2) / state.S0;
    return { u0, v0, u1: u0 + state.W / p, v1: v0 + state.H / p };
  }
  const covers = (t, v) => t.u0 <= v.u0 + 0.0001 && t.v0 <= v.v0 + 0.0001 && t.u0 + t.w / t.r >= v.u1 - 0.0001 && t.v0 + t.h / t.r >= v.v1 - 0.0001;
  const paintEnv = {
    LON0, LAT_N, LAT_S, SY,
    land: () => state.land50,
    travel: () => state.travel,
    seams: () => state.seams,
    lakes: (r) => (r >= LAKES_R && state.lakesAll ? state.lakesAll : state.lakes),
    relief: (r) => (r >= 22 && state.reliefFine ? state.reliefFine : state.relief),
  };

  async function paintBase() {
    if (state.base || !state.land50 || !state.relief) return;
    const job = { r: R0, u0: -180, v0: -LAT_N * SY, w: 360 * R0, h: Math.ceil((LAT_N - LAT_S) * SY * R0) };
    try {
      const c = await WC.paint(job, paintEnv);
      landPhotos(c, job);
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
      v0 = Math.max(-LAT_N * SY, v.v0 - vh * m); v1 = Math.min(-LAT_S * SY, v.v1 + vh * m);
      if ((u1 - u0) * (v1 - v0) * r * r < 4.2e6) break;
      m *= 0.5;
    }
    const job = { b, r, u0, v0, w: Math.max(2, Math.ceil((u1 - u0) * r)), h: Math.max(2, Math.ceil((v1 - v0) * r)), cancelled: false };
    if (job.w * job.h > 6e6) return; // a sliver of world at extreme zoom: the coarser painting serves
    state.job = job;
    if (r >= 22 && !state.reliefFine && !narrow.matches) loadFineRelief();
    if (r >= LAKES_R && !state.lakesX) moreLakes();
    WC.paint(job, paintEnv).then((c) => {
      if (state.job === job) state.job = null;
      landPhotos(c, job);
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
  // the Flights globe reads the relief from a bitmap decoded off the main thread, so its first
  // close look never stalls a frame (falls back to nothing: the globe then hatches from the image)
  const bitmapOf = (src) => (window.createImageBitmap
    ? fetch(src).then((r) => r.blob()).then((b) => createImageBitmap(b)).catch(() => null)
    : Promise.resolve(null));
  // the smaller lakes the 50m drawing lacks (Zurich, Lucerne, Thun, Brienz and their like), from
  // Natural Earth 10m: fetched only when someone comes close, on the map or the Flights globe.
  // The file keeps whole thousandths of a degree: each ring's first point, then the steps between
  let lakesXP = null;
  function moreLakes() {
    if (!lakesXP) {
      const dec = (r) => {
        const o = [];
        let x = 0, y = 0;
        for (let i = 0; i < r.length; i += 2) { x += r[i]; y += r[i + 1]; o.push([x / 1000, y / 1000]); }
        o.push(o[0]);
        return o;
      };
      lakesXP = fetch('map/lakes-10m-extra.json').then((r) => r.json()).then((d) => {
        const fc = {
          type: 'FeatureCollection',
          features: d.lakes.map(([name, polys]) => ({ type: 'Feature', properties: { name }, geometry: { type: 'MultiPolygon', coordinates: polys.map((p) => p.map(dec)) } })),
        };
        state.lakesX = fc;
        state.lakesAll = { type: 'FeatureCollection', features: [...(state.lakes ? state.lakes.features : []), ...fc.features] };
        state.lakesXPath = pathDeg(fc);
        // the close paintings made without them are made again
        if (state.job && state.job.r >= LAKES_R) { state.job.cancelled = true; state.job = null; }
        state.regions = state.regions.filter((t) => t.r < LAKES_R);
        ensureTextures(state.z);
        queueDraw();
        return fc;
      }).catch(() => { lakesXP = null; return null; });
    }
    return lakesXP;
  }
  function loadFineRelief() {
    if (state.reliefFineLoading) return;
    state.reliefFineLoading = true;
    const im = new Image();
    im.src = '../vendor/relief/SR_50M-10800.jpg';
    im.decode().then(() => { state.reliefFine = im; }).catch(() => {});
    bitmapOf(im.src).then((bm) => { state.reliefFineBM = bm; if (flightsOpen) big.warm(); });
  }

  /* ------------------------------------------------------------ drawing a frame */

  const PAPER = 'rgb(251, 250, 245)';
  const INK = (a) => WC.ink(a);
  const PENCIL = (a) => `rgba(98, 92, 86, ${a})`;
  const WARM = 'rgb(212, 82, 60)';
  const SEAS = [
    { id: 'pacific', ll: [12, 168] },
    { id: 'indian', ll: [-24, 80] },
    { id: 'atlantic', ll: [26, -42] },
    { id: 'southern', ll: [-58, 40] },
    { id: 'arctic', ll: [82, 20] },
  ];
  // every other country, lettered quietly: by importance, then by how close the view has come
  const NAMES = window.COUNTRY_NAMES || {};
  // (a country whose books are all cities, the United States, keeps its own quiet name too)
  const MINE = new Set(Object.entries(ISO).filter(([cid]) => booksOf(cid).some((b) => !b.place)).map(([, iso]) => iso));
  const others = Object.entries(NAMES)
    .filter(([id, n]) => !MINE.has(String(id).padStart(3, '0')) && n && n.at && n.en)
    .map(([id, n]) => ({ id, en: n.en, zh: n.zh || n.en, ll: [n.at[1], n.at[0]], rank: n.rank || 6, min: n.min || 5 }))
    .sort((a, b) => a.rank - b.rank || a.min - b.min);
  const hashOf = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
  const sprites = new Map();
  function sprite(key, text, o) {
    const k = `${key}|${lang}|${o.size}|${state.dpr}`;
    let s = sprites.get(k);
    if (!s) {
      const h = hashOf(key);
      s = WC.letter(text, { ...o, zh: lang === 'zh', dpr: state.dpr, seed: (h % 9973) + 1 });
      s.tilt = (((h >> 8) % 100) / 100 - 0.5) * 0.035;
      sprites.set(k, s);
    }
    return s;
  }
  const nameSize = (rank) => (lang === 'zh' ? [12, 12, 12, 11.5, 11, 10.5, 10.5, 10.5][rank] || 10.5 : [13, 13, 13, 12, 11.2, 10.6, 10.2, 10][rank] || 10);
  const overlaps = (a, list) => { for (const b of list) if (a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1]) return true; return false; };

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

    // before the painting is ready (and while it fades in): a first flat wash on the land
    const baseA = state.base ? Math.min(1, (now - state.base.ready) / 600) : 0;
    if (baseA < 1 && state.landFill110) {
      ctx.setTransform(dpr * p, 0, 0, dpr * p, dpr * X0, dpr * Y0);
      ctx.fillStyle = 'rgb(244, 240, 222)';
      ctx.fill(state.landFill110);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    // the painting: the whole sheet, then any finer regional paintings over it
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
    if (ocean) ocean.draw(now);

    ctx.save();
    ctx.beginPath(); ctx.rect(X0 - 180 * p, Y0 - 89.4 * SY * p, 360 * p, 178.8 * SY * p); ctx.clip();
    // pencil: small crosses where the 30° lines meet, finer as you come close
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
        if (-lat * SY < vr.v0 - 1 || -lat * SY > vr.v1 + 1) continue;
        const x = X0 + u * p, y = Y0 - lat * SY * p;
        ctx.moveTo(x - arm, y); ctx.lineTo(x + arm, y);
        ctx.moveTo(x, y - arm); ctx.lineTo(x, y + arm);
      }
    }
    ctx.stroke();

    // the borders: a lighter, broken line, as a pen does when it hardly touches
    const fine = p > 12 && state.coast50;
    const borders = fine ? state.borders50 : state.borders110;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (borders) {
      ctx.setTransform(dpr * p, 0, 0, dpr * p, dpr * X0, dpr * Y0);
      ctx.setLineDash([2.2 / p, 2.8 / p]);
      ctx.strokeStyle = INK(p > 14 ? 0.46 : 0.38); ctx.lineWidth = (p > 14 ? 0.7 : 0.6) / p; ctx.stroke(borders);
      ctx.setLineDash([]);
    }
    // the coasts: one confident line of the fine-liner, its weight swelling and thinning as it goes
    const coast = fine ? state.coast50 : state.coast110;
    if (coast) {
      const w = Math.min(1.35, 0.78 + p * 0.005);
      ctx.strokeStyle = INK(0.9);
      coast.forEach((path, i) => { ctx.lineWidth = (w * [0.55, 0.78, 1, 1.26, 1.6][i]) / p; ctx.stroke(path); });
      // the lakes' shores, a little lighter: the great lakes from afar, all of them closer in
      const lakes = fine ? state.lakesPath : state.lakesBigPath;
      if (lakes && state.base) {
        ctx.strokeStyle = INK(0.82); ctx.lineWidth = (w * 0.82) / p; ctx.stroke(lakes);
        if (state.lakesXPath && resOf(bandOf(p)) >= LAKES_R) ctx.stroke(state.lakesXPath);
      }
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.restore();

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
        ctx.lineWidth = 1; ctx.strokeStyle = INK(0.9); ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y, 1.4, 0, Math.PI * 2);
        ctx.fillStyle = WARM; ctx.fill();
      }
    }

    // the books: a pen leader from each place to where its book stands, and the place itself
    layoutPins();
    const taken = [];
    // (held back while the opening plays, then drawn in with the books)
    const leadA = app.classList.contains('is-opening') ? 0 : state.leadIn ? clamp((now - state.leadIn - 200) / 900, 0, 1) : 1;
    if (leadA < 1 && state.leadIn) again = true;
    if (!diving && leadA > 0) {
      ctx.save();
      ctx.globalAlpha = leadA;
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = INK(0.6);
      for (const b of pinList) {
        if (Math.hypot(b.x - b.ax, b.y - b.ay) > 6) { ctx.beginPath(); ctx.moveTo(b.ax, b.ay); ctx.lineTo(b.x, b.ly); ctx.stroke(); }
      }
      for (const b of pinList) {
        ctx.beginPath(); ctx.arc(b.ax, b.ay, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = PAPER; ctx.fill();
        ctx.lineWidth = 1.1; ctx.strokeStyle = INK(0.95); ctx.stroke();
        ctx.beginPath(); ctx.arc(b.ax, b.ay, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = WARM; ctx.fill();
      }
      ctx.restore();
    }
    if (!diving) for (const b of pinList) taken.push(...b.boxes);
    if (seaPrint) seaPrint.taken(taken);

    // lettering: the oceans in italic, then every other country by importance, never on each
    // other and never on his books or their names
    if (fontsReady) {
      const placed = new Set();
      const seaA = clamp((26 - p) / 10, 0, 1);
      if (seaA > 0) {
        for (const s of SEAS) {
          const sp = sprite(`sea-${s.id}`, T[lang].seas[s.id], { size: lang === 'zh' ? 13 : 15, italic: lang !== 'zh', caps: false, track: 0.22, colour: 'rgb(48, 96, 128)', halo: 0 });
          const [x, y] = P(s.ll);
          const box = [x - sp.inkW / 2 - 4, y - 10, x + sp.inkW / 2 + 4, y + 10];
          if (box[0] < 8 || box[2] > W - 8 || box[1] < 8 || box[3] > H - 8 || overlaps(box, taken)) continue;
          taken.push(box);
          ctx.globalAlpha = 0.9 * seaA;
          ctx.drawImage(sp.c, x - sp.inkW / 2 - sp.bx, y - sp.by + sp.size * 0.34, sp.w, sp.h);
        }
        ctx.globalAlpha = 1;
      }
      const zw = Math.log2((360 * p) / 256);
      // (held back while the opening's title stands over the map, then lettered in with the books)
      for (const n of leadA > 0 ? others : []) {
        if (n.min > zw + 1.0) continue;
        const [x, y] = P(n.ll);
        if (x < -60 || y < -20 || x > W + 60 || y > H + 20) continue;
        const sp = sprite(n.id, lang === 'zh' ? n.zh : n.en, { size: nameSize(n.rank), weight: 500, colour: 'rgb(104, 96, 88)', halo: 3.2 });
        const hw = sp.inkW / 2 + 3, hh = sp.size * 0.62;
        const box = [x - hw, y - hh, x + hw, y + hh];
        if (box[0] < 6 || box[2] > W - 6 || box[1] < 6 || box[3] > H - 6 || overlaps(box, taken)) continue;
        taken.push(box);
        placed.add(n.id);
        let a = state.labels.get(n.id) || 0;
        a = Math.min(1, a + 0.2);
        state.labels.set(n.id, a);
        if (a < 1) again = true;
        ctx.save();
        ctx.globalAlpha = a * leadA;
        ctx.translate(x, y);
        ctx.rotate(sp.tilt);
        ctx.drawImage(sp.c, -sp.inkW / 2 - sp.bx, -sp.by + sp.size * 0.34, sp.w, sp.h);
        ctx.restore();
      }
      for (const id of state.labels.keys()) if (!placed.has(id)) state.labels.delete(id);
    }

    if (seaPrint) seaPrint.frame();
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
    // d3's own constraint, except that a map shorter than the window sits on the window's
    // bottom edge, not in the middle: Antarctica always covers the foot of the window and
    // whatever room is left lies above (his call, 2026-10-03)
    .constrain((t, extent, te) => {
      const dx0 = t.invertX(extent[0][0]) - te[0][0], dx1 = t.invertX(extent[1][0]) - te[1][0];
      const dy0 = t.invertY(extent[0][1]) - te[0][1], dy1 = t.invertY(extent[1][1]) - te[1][1];
      return t.translate(
        dx1 > dx0 ? (dx0 + dx1) / 2 : Math.min(0, dx0) || Math.max(0, dx1),
        dy1 > dy0 ? dy1 : Math.min(0, dy0) || Math.max(0, dy1),
      );
    })
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
    // on a desktop the books sit lower in the window: Europe's cluster was crowding the top edge
    // while the Southern Ocean lay empty below (his note, 2026-10-03)
    const pad = small ? { l: 60, r: 60, t: 130, b: 190 } : { l: 70, r: 110, t: 175, b: 70 };
    // a phone opens on the crowded half, Asia and Oceania, where ten of the places are
    const near = small ? books.filter((b) => { const c = countries[b.country]; return (c.continent === 'asia' && c.id !== 'dubai') || c.continent === 'oceania'; }) : books;
    return fitTransform(near.map(bookLL), pad);
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
  // the dive's landing: the country filling the view, the place itself at the centre; a city's
  // book lands on the city and the country round it (about 7° by 4.5°), not the whole country
  function diveTransform(b) {
    const ll = bookLL(b);
    const f = state.feats[b.country];
    let k = 30;
    if (b.place) {
      k = Math.min((state.W - 80) / (7 * state.S0), (state.H - 120) / (4.5 * SY * state.S0));
    } else if (f) {
      const bb = d3.geoBounds(f);
      let w = bb[1][0] - bb[0][0];
      if (w < 0) w += 360;
      const span = Math.min(w, 60), hspan = Math.min(bb[1][1] - bb[0][1], 40);
      const kx = (state.W - 80) / (span * state.S0), ky = (state.H - 120) / (hspan * SY * state.S0);
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

  // the only zoom word is Whole map (Zoom in / Zoom out and the map credit went on 2026-10-03,
  // his call); the wheel, a double click, pinch and the + and - keys zoom
  const zAll = $('#zoom-world');
  const zoomBy = (f) => sel.interrupt().transition().duration(reduce.matches ? 0 : 420).ease(d3.easeExpOut).call(zoom.scaleBy, f);
  zAll.addEventListener('click', () => moveTo(homeTransform()));
  function updateZoomButtons() { /* nothing left to disable */ }
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
    const keep = new Map(pinList.map((q) => [q.key, q]));
    pinsEl.textContent = '';
    pinList = books.map((b) => {
      const c = countries[b.country];
      const title = esc(L(b.title));
      const s = b.photo ? S.slides[b.photo] : null;
      const face = s
        ? `<span class="book__face"><img src="${imgSrc(s, 640)}" alt="" width="${s.w}" height="${s.h}" decoding="async">`
        : `<span class="book__face book__face--blank"><b>${title}</b>`;
      const el = document.createElement('div');
      el.className = 'pin';
      el.dataset.country = c.id;
      el.dataset.key = b.key;
      el.innerHTML =
        `<div class="pin__stage"><a class="book book--${b.tone}" href="#${b.view}" aria-label="${esc(T[lang].bookAria(L(b.title), bookStatus(b)))}" data-view="${b.view}"><span class="book__box">` +
        `<span class="book__spine"><b>${title}</b><i>${esc(t('series'))}</i></span>` +
        `${face}<span class="book__band"><b>${title}</b><span>${esc(t(b.band))}</span></span><span class="book__veil"></span></span>` +
        `<span class="book__back"><i>${esc(t('series'))}</i></span><span class="book__edge"></span>` +
        `<span class="book__top"></span><span class="book__shadow"></span></span></a></div>` +
        `<div class="pin__label" aria-hidden="true"><b>${title}</b><i>${esc(b.place ? L(c.name) : L(c.note))}</i></div>`;
      pinsEl.appendChild(el);
      const prev = keep.get(b.key);
      return { id: b.id, key: b.key, country: c.id, book: b, el, ll: bookLL(b), x: prev ? prev.x : NaN, y: prev ? prev.y : NaN, ax: 0, ay: 0, lw: 0 };
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
    // the room between two books, or a book and another's name, or two names
    const gap = small ? 5 : 9;
    const lh = small ? 15 : 18;
    for (const q of pinList) {
      const a = P(q.ll);
      q.ax = a[0]; q.ay = a[1];
      if (Number.isNaN(q.x)) { q.x = q.ax; q.y = q.ay; }
    }
    // what a book takes up: the book standing above its foot, and its name lettered under it
    const shapes = (q) => [
      [q.x - bw / 2, q.y - bh, q.x + bw / 2, q.y],
      [q.x - q.lw / 2, q.y + 5, q.x + q.lw / 2, q.y + 7 + lh],
    ];
    // pulled toward its place, pushed apart from its neighbours until nothing touches: books,
    // names and the places' own marks all count, so each book and its name stand clear and a
    // short pen leader runs back to the true spot
    const pull = 0.3;
    for (const q of pinList) { q.x += (q.ax - q.x) * pull; q.y += (q.ay - q.y) * pull; }
    const n = pinList.length;
    for (let it = 0; it < 60; it++) {
      let moved = false;
      for (let i = 0; i < n; i++) {
        const a = pinList[i];
        for (let j = i + 1; j < n; j++) {
          const b = pinList[j];
          if (Math.abs(a.x - b.x) > bw + Math.max(a.lw, b.lw) + gap || Math.abs(a.y - b.y) > bh + lh + 20) continue;
          for (const A of shapes(a)) {
            for (const B of shapes(b)) {
              const ox = Math.min(A[2], B[2]) - Math.max(A[0], B[0]) + gap;
              const oy = Math.min(A[3], B[3]) - Math.max(A[1], B[1]) + gap;
              if (ox <= 0 || oy <= 0) continue;
              moved = true;
              // the shorter way apart (sideways is preferred a little, so the leaders stay short),
              // each toward its own side as the places themselves lie, so no two leaders cross
              if (ox < oy * 1.25) {
                const d = a.ax - b.ax || a.x - b.x || i - j;
                const dir = d < 0 ? -1 : 1;
                a.x += (dir * ox) / 2; b.x -= (dir * ox) / 2;
              } else {
                const d = a.ay - b.ay || a.y - b.y || i - j;
                const dir = d < 0 ? -1 : 1;
                a.y += (dir * oy) / 2; b.y -= (dir * oy) / 2;
              }
            }
          }
        }
        // nor over any place's own mark, its own included (a book pushed down past its spot)
        for (let j = 0; j < n; j++) {
          const o = pinList[j];
          const D = [o.ax - 5, o.ay - 5, o.ax + 5, o.ay + 5];
          const sh = shapes(a);
          if (j === i) sh[0][3] -= 7;
          // (on a phone only the books keep off the marks: a name there may cross one, small)
          if (small) sh.length = 1;
          for (const A of sh) {
            const ox = Math.min(A[2], D[2]) - Math.max(A[0], D[0]);
            const oy = Math.min(A[3], D[3]) - Math.max(A[1], D[1]);
            if (ox <= 0 || oy <= 0) continue;
            moved = true;
            if (ox < oy) a.x += (A[0] + A[2] < D[0] + D[2] ? -1 : 1) * ox;
            else a.y += (A[1] + A[3] < D[1] + D[3] ? -1 : 1) * oy;
          }
        }
        // and, while its place is in view, never past the window's edge
        if (a.ax > 0 && a.ax < state.W) {
          const half = Math.max(bw, a.lw) / 2 + 6;
          if (a.x < half) { a.x = half; moved = true; } else if (a.x > state.W - half) { a.x = state.W - half; moved = true; }
        }
      }
      if (!moved) break;
    }
    // on a phone, a name that still would sit on another book or name waits until its book wakes
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
      // the room it takes, kept clear of the lettering of other countries by a little paper
      const m = small ? 4 : 7;
      q.boxes = [[q.x - bw / 2 - m, q.y - bh - m, q.x + bw / 2 + m, q.y + m]];
      if (free) q.boxes.push([q.x - q.lw / 2 - m, q.y + 4, q.x + q.lw / 2 + m, q.y + 7 + lh + m]);
    }
    const sh = shelf.on ? shelfSlots() : null;
    pinList.forEach((q, i) => {
      // the leader meets the book at its foot, or under its name when the place lies below both
      q.ly = q.ay > q.y + 7 + lh && !q.el.classList.contains('is-quiet') ? q.y + 7 + lh + 1 : q.y;
      let x = q.x, y = q.y, sc = s;
      if (sh) {
        // from its slot on the shelf to its place on the map, in the shelf's order, each on a
        // lifted arc; its name letters in as it lands
        const o = sh.slots[i];
        const e = easeInOut(clamp((shelf.p - (sh.stagger * o.order) / Math.max(1, pinList.length - 1)) / (1 - sh.stagger), 0, 1));
        x = o.x + (q.x - o.x) * e;
        y = o.y + (q.y - o.y) * e - Math.sin(Math.PI * e) * sh.lift;
        sc = sh.scale * o.f + (s - sh.scale * o.f) * e;
        const st = q.el.style;
        st.setProperty('--la', clamp((e - 0.8) / 0.2, 0, 1).toFixed(3));
        // the books further back are veiled in paper and stand behind; the veil lifts as each flies
        st.setProperty('--o', (1 - (1 - o.o) * (1 - e)).toFixed(3));
        st.setProperty('--zi', String(o.zi));
      }
      q.el.style.setProperty('--x', `${x.toFixed(1)}px`);
      q.el.style.setProperty('--y', `${y.toFixed(1)}px`);
      q.el.style.setProperty('--s', sc.toFixed(3));
    });
  }

  // the shelf: design 1's row of books under the name, all turned the same way, the middle one
  // in front, the rest stepped back 5rem a book into the distance (perspective 70rem, its origin
  // at 45% of the book's height), so they shrink and draw in toward it, veiled in the paper the
  // further back; and the plank the row stands on. It stands clear below the name (lowered at
  // his word, 2026-10-03: the books covered the words)
  function shelfSlots() {
    const { W, H } = state;
    const small = narrow.matches;
    const n = pinList.length;
    const key = `${W}|${H}|${small}|${n}|${shelf.titleY.toFixed(0)}|${shelf.titleH}`;
    if (shelf.cache && shelf.cache.key === key) return shelf.cache;
    const margin = small ? 16 : 60;
    const scale = small ? 0.42 : 0.62;
    const bw = 192 * scale, bh = 272 * scale;
    const mid = (n - 1) / 2;
    const step = Math.min(bw * 1.04, (W - 2 * margin - bw) / Math.max(1, n - 1));
    const top = shelf.titleY + shelf.titleH / 2 + (small ? 36 : 56);
    const base = top + bh, origin = base - bh * 0.55;
    const slots = [];
    let xa = Infinity, xb = -Infinity;
    for (let i = 0; i < n; i++) {
      const d = i - mid, far = Math.abs(d);
      const f = 70 / (70 + 5 * far);
      const x = W / 2 + d * step * f;
      slots.push({ x, y: origin + (base - origin) * f, f, o: Math.max(0.3, 1 - far * 0.22), zi: 40 - Math.round(far * 2), order: Math.round(far * 2) + (d < 0 ? 1 : 0) });
      xa = Math.min(xa, x - (bw * f) / 2); xb = Math.max(xb, x + (bw * f) / 2);
    }
    shelf.cache = { key, slots, planks: [{ x0: xa - 14, x1: xb + 14, y: base + 1 }], scale, stagger: 0.35, lift: small ? 28 : 56 };
    return shelf.cache;
  }
  // the planks, drawn on the opening's canvas in the pen and a wash: a line of ink the books
  // stand on, the wood's shade beneath it, fading as the books leave
  function drawShelf(g, p) {
    if (!shelf.on || !pinList.length) return;
    const a = clamp(1 - p * 2.2, 0, 1);
    if (a <= 0) return;
    const sh = shelfSlots();
    g.save();
    for (const k of sh.planks) {
      g.fillStyle = `rgba(128, 102, 66, ${(0.16 * a).toFixed(3)})`;
      g.fillRect(k.x0, k.y, k.x1 - k.x0, 7);
      g.fillStyle = `rgba(128, 102, 66, ${(0.07 * a).toFixed(3)})`;
      g.fillRect(k.x0 + 4, k.y + 7, k.x1 - k.x0 - 8, 5);
      g.strokeStyle = `rgba(44, 40, 34, ${(0.8 * a).toFixed(3)})`;
      g.lineWidth = 1.25; g.lineCap = 'round';
      g.beginPath(); g.moveTo(k.x0, k.y); g.lineTo(k.x1, k.y); g.stroke();
      g.strokeStyle = `rgba(44, 40, 34, ${(0.35 * a).toFixed(3)})`;
      g.lineWidth = 0.8;
      g.beginPath(); g.moveTo(k.x0 + 2, k.y + 7); g.lineTo(k.x1 - 2, k.y + 7); g.stroke();
    }
    g.restore();
  }

  function bindPins() {
    for (const q of pinList) {
      const a = q.el.querySelector('.book');
      a.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') setActive({ key: q.key, from: 'map' }); });
      a.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') clearActiveSoon(); });
      a.addEventListener('focus', () => {
        if (diving) return;
        setActive({ key: q.key, from: 'map' });
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
  // the book being pointed at: named by its key, or by one of its photographs
  const activeKey = () => (active ? active.key || (active.slide && bookOfSlide(active.slide).key) : null);
  function setActive(next) {
    if (diving) return;
    clearTimeout(clearTimer);
    if (active && next && active.key === next.key && active.slide === next.slide) return;
    erase(marks.filter((m) => m !== diveRing)); marks = diveRing ? [diveRing] : [];
    active = next;
    const key = activeKey();
    pinList.forEach((q) => q.el.classList.toggle('awake', q.key === key));
    const pin = pinList.find((q) => q.key === key);
    if (next.slide) marks.push(penRing(ringD(13), S.slides[next.slide].ll));
    else if (pin) marks.push(penRing(ringD(19, 1.15), pin.ll));
    placePen();
    marks.forEach((m) => drawStroke(m.firstChild, 0, 440));
    $$('.group.is-awake', indexBody).forEach((g) => { if (g.dataset.key !== key) g.classList.remove('is-awake'); });
    const g = key && indexBody.querySelector(`.group[data-key="${key}"]`);
    if (g) g.classList.add('is-awake');
    mapPhotoHover(next.slide || (pin && coverFor(pin.book)));
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
    mapPhotoHover(null);
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
    for (const q of pinList) if (Math.hypot(q.ax - x, q.ay - y) < 14) return { key: q.key };
    const ll = invertLL(x, y);
    for (const c of S.countries) {
      const f = state.feats[c.id];
      if (!f || !d3.geoContains(f, ll)) continue;
      // a country of several books: the one whose place is nearest the pointer
      let best = null, bd = Infinity;
      for (const q of pinList) { if (q.country !== c.id) continue; const d = Math.hypot(q.ax - x, q.ay - y); if (d < bd) { bd = d; best = q; } }
      return best ? { key: best.key } : null;
    }
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
    // a photograph's spot dives into its place, with that photograph first
    if (hit.slide) { if (bookOfSlide(hit.slide)) go(bookOfSlide(hit.slide).view, hit.slide); }
    else if (bookByKey[hit.key]) go(bookByKey[hit.key].view);
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
    indexBody.innerHTML = books.map((b) => {
      const c = countries[b.country];
      const ids = photosOf(b);
      const thumbs = ids.map((id) => {
        const s = S.slides[id];
        return `<li><button type="button" class="thumb" data-slide="${id}" aria-label="${esc(L(s.place))}">` +
          `<img src="${imgSrc(s, 640)}" alt="" loading="lazy" decoding="async" width="${s.w}" height="${s.h}">` +
          `<span class="thumb__name">${esc(L(s.place))}</span></button></li>`;
      }).join('');
      return `<section class="group" data-country="${c.id}" data-key="${b.key}" aria-labelledby="g-${b.key}">` +
        `<h3><button type="button" class="group__name" id="g-${b.key}" data-view="${b.view}">${nameHTML(b)}</button>` +
        `<span class="group__meta">${esc(bookDate(b))}</span></h3>` +
        (thumbs ? `<ul class="thumbs">${thumbs}</ul>` : `<p class="group__none">${esc(t('bandNone'))}</p>`) +
        `</section>`;
    }).join('');
  }
  indexBody.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    const th = e.target.closest('.thumb'), gn = e.target.closest('.group__name');
    if (th) setActive({ slide: th.dataset.slide, from: 'index' });
    else if (gn) setActive({ key: gn.closest('.group').dataset.key, from: 'index' });
  });
  indexBody.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') clearActiveSoon(); });
  indexBody.addEventListener('focusin', (e) => {
    const th = e.target.closest('.thumb'), gn = e.target.closest('.group__name');
    if (th) setActive({ slide: th.dataset.slide, from: 'index' });
    else if (gn) setActive({ key: gn.closest('.group').dataset.key, from: 'index' });
  });
  indexBody.addEventListener('click', (e) => {
    if (diving) return;
    const th = e.target.closest('.thumb'), gn = e.target.closest('.group__name');
    // a photograph in the index dives into its place, with that photograph as the cover
    if (th && bookOfSlide(th.dataset.slide)) { setIndex(false, false); go(bookOfSlide(th.dataset.slide).view, th.dataset.slide); }
    else if (gn) { setIndex(false, false); go(gn.dataset.view); }
  });

  /* ------------------------------------------------------------ the leaf: the page the dive lands on */

  let page = null, pageCover = null;
  let tocObserver = null;
  let diving = false;

  // the book an address names: #guide-<guide>, #place-<book key>, or an older #place-<country>,
  // which opens that country's first book (#place-usa opens New York)
  function viewBook(view) {
    if (!view) return null;
    if (view.startsWith('guide-')) return books.find((b) => b.guide === view.slice(6)) || null;
    if (view.startsWith('place-')) return bookByKey[view.slice(6)] || bookByCountry[view.slice(6)] || null;
    return null;
  }
  const validView = (view) => !!viewBook(view);
  const isGuide = (view) => { const b = viewBook(view); return !!(b && b.guide); };

  function renderLeaf(view) {
    const b = viewBook(view);
    $('#leaf-where').innerHTML = `<b>${nameHTML(b)}</b><span>${esc(coords(bookLL(b)))}</span>`;
    if (tocObserver) { tocObserver.disconnect(); tocObserver = null; }
    renderCover(b, view);
    if (isGuide(view)) renderGuide(); else renderPlace(b);
    watchCover();
  }

  /* the cover: a full-window gallery of the country's photographs. Nothing across the middle;
     the place and the country in the bottom-left corner, small words at the edges */
  const gal = { book: null, list: [], i: 0, dx: 0, slots: [], anim: null, wheel: 0, lock: 0 };
  const wrapI = (i) => { const n = gal.list.length; return ((i % n) + n) % n; };
  function renderCover(b, view) {
    gal.book = b;
    const has = gal.list.length > 0;
    leaf.classList.toggle('is-plain', !has);
    leaf.classList.toggle('is-single', gal.list.length < 2);
    leaf.classList.remove('is-scrolled');
    if (!has) { cover.hidden = true; track.textContent = ''; gal.slots = []; return; }
    cover.hidden = false;
    cover.setAttribute('aria-label', T[lang].coverLabel(L(b.title)));
    $('#cover-hint').textContent = isGuide(view) ? t('hintGuide') : t('hintPhotos');
    if (!gal.slots.length) {
      gal.slots = [-1, 0, 1].map((pos) => {
        const el = document.createElement('figure');
        el.className = 'slide';
        const img = document.createElement('img');
        img.decoding = 'async';
        img.draggable = false;
        img.alt = '';
        el.appendChild(img);
        track.appendChild(el);
        return { el, img, pos, id: null };
      });
    }
    fillSlides();
  }
  function fillSlides() {
    const n = gal.list.length;
    for (const s of gal.slots) {
      const id = gal.list[wrapI(gal.i + s.pos)];
      s.el.style.setProperty('--pos', String(s.pos));
      s.el.classList.toggle('is-current', s.pos === 0);
      s.el.hidden = n < 2 && s.pos !== 0;
      if (s.pos !== 0) s.el.setAttribute('aria-hidden', 'true'); else s.el.removeAttribute('aria-hidden');
      const sl = S.slides[id];
      if (s.id !== id || s.lang !== lang) {
        if (s.id !== id) {
          s.img.width = sl.w; s.img.height = sl.h;
          s.img.sizes = '100vw';
          s.img.srcset = srcset(sl);
          s.img.src = imgSrc(sl, 1280);
          if (s.pos === 0) s.img.fetchPriority = 'high';
        }
        s.img.alt = L(sl.alt);
        s.id = id; s.lang = lang;
      }
    }
    const cur = S.slides[gal.list[gal.i]];
    $('#cover-place').textContent = L(cur.place);
    $('#cover-country').textContent = L(countries[gal.book.country].name);
    $('#cover-count').textContent = n > 1 ? `${gal.i + 1} / ${n}` : '';
    pageCover = gal.list[gal.i];
    // the next ones along, fetched before they are asked for
    if (n > 3) [2, -2].forEach((d) => { const im = new Image(); im.sizes = '100vw'; im.srcset = srcset(S.slides[gal.list[wrapI(gal.i + d)]]); });
  }
  function setDx(px) { gal.dx = px; track.style.setProperty('--dx', `${px.toFixed(1)}px`); }
  function galStep(d, from = gal.dx) {
    if (gal.list.length < 2 || !leaf.classList.contains('is-open')) return;
    if (gal.anim) { gal.anim.cancel(); gal.anim = null; }
    const Wd = cover.clientWidth || innerWidth;
    const commit = () => {
      gal.i = wrapI(gal.i + d);
      for (const s of gal.slots) { s.pos -= d; if (s.pos < -1) s.pos = 1; else if (s.pos > 1) s.pos = -1; }
      setDx(0);
      fillSlides();
      wake();
    };
    if (reduce.matches) { commit(); return; }
    const to = -d * Wd;
    gal.anim = tween(Math.max(260, 520 * Math.min(1, Math.abs(to - from) / Wd)), (e) => setDx(from + (to - from) * e), () => { gal.anim = null; commit(); }, expOut);
  }
  function springBack() {
    if (gal.anim) gal.anim.cancel();
    const from = gal.dx;
    if (reduce.matches || Math.abs(from) < 1) { setDx(0); return; }
    gal.anim = tween(360, (e) => setDx(from * (1 - e)), () => { gal.anim = null; }, expOut);
  }
  $('#cover-prev').addEventListener('click', () => galStep(-1));
  $('#cover-next').addEventListener('click', () => galStep(1));
  $('#cover-hint').addEventListener('click', () => {
    leafContent.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' });
    const first = $('#leaf-title', leafContent);
    if (first) { first.setAttribute('tabindex', '-1'); first.focus({ preventScroll: true }); }
  });
  // a finger or the mouse moves the photograph with it, and lets it settle on the nearest one
  let drag = null;
  cover.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button') || !leaf.classList.contains('is-open') || (e.pointerType === 'mouse' && e.button !== 0)) return;
    drag = { x: e.clientX, y: e.clientY, id: e.pointerId, horiz: null, t: performance.now(), vx: 0, lx: e.clientX };
  });
  cover.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (drag.horiz === null) {
      if (Math.hypot(dx, dy) < 7) return;
      drag.horiz = Math.abs(dx) > Math.abs(dy);
      if (!drag.horiz) { drag = null; return; }
      try { cover.setPointerCapture(e.pointerId); } catch (err) { /* fine */ }
      if (gal.anim) { gal.anim.cancel(); gal.anim = null; }
      cover.classList.add('is-dragging');
    }
    const now = performance.now();
    drag.vx = (e.clientX - drag.lx) / Math.max(8, now - drag.t);
    drag.lx = e.clientX; drag.t = now;
    setDx(gal.list.length < 2 ? dx * 0.25 : dx);
  });
  const dragEnd = (e) => {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    const was = drag;
    drag = null;
    cover.classList.remove('is-dragging');
    if (!was.horiz) return;
    const Wd = cover.clientWidth || innerWidth;
    if (gal.list.length > 1 && (gal.dx < -Wd * 0.18 || was.vx < -0.45)) galStep(1);
    else if (gal.list.length > 1 && (gal.dx > Wd * 0.18 || was.vx > 0.45)) galStep(-1);
    else springBack();
  };
  cover.addEventListener('pointerup', dragEnd);
  cover.addEventListener('pointercancel', dragEnd);
  // a sideways sweep on the trackpad: one photograph per sweep
  cover.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) * 1.2) return;
    e.preventDefault();
    const now = performance.now();
    if (now < gal.lock) { gal.lock = now + 220; return; }
    gal.wheel += e.deltaX;
    clearTimeout(gal.wheelT);
    gal.wheelT = setTimeout(() => { gal.wheel = 0; }, 180);
    if (Math.abs(gal.wheel) > 46) { galStep(gal.wheel > 0 ? 1 : -1); gal.wheel = 0; gal.lock = now + 520; }
  }, { passive: false });
  // the words on the cover step back after a still moment, and return with any movement
  let stillTimer = 0;
  function wake() {
    // (back from stillness the words return at once, not at the caption's slow first reveal)
    if (leaf.classList.contains('is-still')) leaf.classList.add('is-woken');
    leaf.classList.remove('is-still');
    clearTimeout(stillTimer);
    stillTimer = setTimeout(() => { if (page) { leaf.classList.remove('is-woken'); leaf.classList.add('is-still'); } }, 2500);
  }
  // any touch, pointer, wheel or key brings the cover's words back at once
  ['pointermove', 'pointerdown', 'touchstart', 'wheel', 'keydown', 'focusin'].forEach((ev) => window.addEventListener(ev, () => { if (page) wake(); }, { passive: true, capture: true }));
  leafScroll.addEventListener('scroll', () => { if (leafScroll.scrollTop > 40) leaf.classList.add('is-scrolled'); }, { passive: true });
  const coverInView = () => !cover.hidden && leafScroll.scrollTop < cover.offsetHeight * 0.5;
  leaf.addEventListener('keydown', (e) => {
    if ((e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') || !coverInView()) return;
    if (e.target.closest && e.target.closest('.leaf__content')) return;
    e.preventDefault();
    galStep(e.key === 'ArrowRight' ? 1 : -1);
  });
  // the bar at the top comes in once the page has risen over the cover
  function watchCover() {
    leaf.classList.toggle('is-past', leaf.classList.contains('is-plain'));
  }
  leafScroll.addEventListener('scroll', () => {
    if (!cover.hidden) leaf.classList.toggle('is-past', leafScroll.scrollTop > cover.offsetHeight * 0.85);
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

  function renderPlace(b) {
    const c = countries[b.country];
    const ids = photosOf(b);
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
    const title = L(b.title), name = L(c.name);
    leafContent.className = 'leaf__content place';
    leafContent.innerHTML = `<div class="wrap">
      <header class="place-top">
        <h1 class="page-title" id="leaf-title">${esc(title)}</h1>
        <p class="meta place-status"><span class="quiet-line">${esc(t('bookNot'))}</span>${name !== title ? `<span>${esc(name)}</span>` : ''}${bookDate(b) ? `<span>${esc(bookDate(b))}</span>` : ''}${ids.length ? `<span>${esc(T[lang].nPhotos(ids.length))}</span>` : ''}</p>
        ${b.place ? '' : `<p class="page-lede">${esc(L(c.note))}</p>`}
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

  let pageGen = 0, diveTimers = [], diveRing = null, diveTween = null, revealTween = null;
  // the place's name, shown large as the map arrives at it
  const arrival = $('#arrival');
  let arrivalAnim = null;
  function showArrival(b) {
    const title = L(b.title), country = L(countries[b.country].name);
    $('#arrival-name').textContent = title;
    $('#arrival-where').textContent = (country !== title ? country + '   ' : '') + coords(bookLL(b)).replace(' · ', '  ');
    arrival.classList.add('is-on');
    if (arrivalAnim) arrivalAnim.cancel();
    arrivalAnim = arrival.animate([
      { opacity: 0, filter: 'blur(6px)', transform: 'translateY(0.6rem) scale(0.985)' },
      { opacity: 1, filter: 'blur(0px)', transform: 'none' },
    ], { duration: 900, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' });
  }
  function hideArrival(ms = 700) {
    if (!arrival.classList.contains('is-on')) return;
    if (arrivalAnim) arrivalAnim.cancel();
    arrivalAnim = arrival.animate([{ opacity: 1, filter: 'blur(0px)' }, { opacity: 0, filter: 'blur(4px)' }], { duration: ms, easing: 'cubic-bezier(0.45, 0, 0.55, 1)', fill: 'forwards' });
    arrivalAnim.onfinish = () => { arrival.classList.remove('is-on'); };
  }
  function dropArrival() { if (arrivalAnim) arrivalAnim.cancel(); arrivalAnim = null; arrival.classList.remove('is-on'); }
  const later = (fn, ms) => { const id = setTimeout(fn, ms); diveTimers.push(id); return id; };
  function clearDive() {
    diveTimers.forEach(clearTimeout); diveTimers = [];
    if (diveRing) { erase([diveRing]); marks = marks.filter((m) => m !== diveRing); diveRing = null; }
    if (diveTween) { diveTween.cancel(); diveTween = null; }
    if (revealTween) { revealTween.cancel(); revealTween = null; }
    leaf.getAnimations().forEach((a) => a.cancel());
    dropArrival();
  }
  // the photograph dissolves in over the whole window at once: m runs 0 (not there) to 1 (all there)
  function setDissolve(m) {
    cover.style.setProperty('--fade', m.toFixed(4));
    cover.style.setProperty('--blur', `${(8 * (1 - m)).toFixed(2)}px`);
    cover.style.setProperty('--sc', (1.04 - 0.04 * m).toFixed(4));
  }
  function clearDissolve() { ['--fade', '--blur', '--sc'].forEach((k) => cover.style.removeProperty(k)); }
  function settleOpen(gen) {
    if (gen !== pageGen) return;
    leaf.classList.remove('is-dissolving');
    leaf.classList.add('is-open');
    clearDissolve();
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
    const book = viewBook(view);
    const ll = bookLL(book);
    page = view;
    // the cover's gallery counts from the photograph it opens on (1 / N), then walks on through the
    // rest of the place's photographs in their usual order; the page below keeps that order
    const all = photosOf(book), first = coverFor(book, opts.cover);
    gal.list = all.includes(first) ? [first, ...all.filter((id) => id !== first)] : all;
    // the photograph through the sea becomes this place's cover, and stays so back on the map
    // (his call, 2026-10-03: on a click, not on a hover)
    if (ocean && first) ocean.show(first);
    gal.i = 0;
    if (gal.anim) { gal.anim.cancel(); gal.anim = null; }
    setDx(0);
    renderLeaf(view);
    leafScroll.scrollTop = 0;
    app.inert = true;
    setIndex(false, false);
    clearActive();
    globe.stop();
    live.textContent = T[lang].opening(L(book.title));
    const landing = diveTransform(book);
    ensureTextures(landing);
    if (!diving) state.before = state.z;
    diving = true;
    app.classList.add('is-diving');
    leaf.classList.remove('is-open', 'is-captioned', 'is-dissolving', 'is-leaving', 'is-still', 'is-woken');
    const hasCover = !leaf.classList.contains('is-plain');
    if (opts.animate && !reduce.matches) {
      // 1. the map magnifies into the country while the pen tightens a ring on the spot
      moveTo(landing, 2000);
      diveRing = penRing(ringD(14), ll);
      marks.push(diveRing);
      drawStroke(diveRing.firstChild, 0, 500);
      diveTween = tween(2000, (e) => { if (diveRing) { diveRing.dataset.s = (6 - 5 * e).toFixed(3); placePen(); } });
      // 1b. as the map arrives, the place's name rises large in the middle: you are entering it
      later(() => { if (gen === pageGen) showArrival(book); }, 900);
      // 2. in the last third of the zoom, while the camera still moves, the photograph dissolves
      //    in across the whole window, from soft to sharp; the drawing softens away beneath it
      later(() => {
        if (gen !== pageGen) return;
        leaf.hidden = false;
        app.classList.add('is-soft');
        if (!hasCover) {
          hideArrival(700);
          leaf.classList.add('is-open');
          leaf.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 900, easing: 'cubic-bezier(0.45, 0, 0.55, 1)' }).onfinish = () => settleOpen(gen);
          return;
        }
        hideArrival(1100);
        leaf.classList.add('is-dissolving');
        setDissolve(0);
        revealTween = tween(1800, (e) => setDissolve(e), () => settleOpen(gen), easeInOut);
      }, hasCover ? 2250 : 2500);
    } else {
      moveTo(landing, 0);
      leaf.hidden = false;
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
    pageGen += 1;
    const gen = pageGen;
    clearDive();
    const book = viewBook(page);
    const pin = pinList.find((q) => q.key === book.key);
    const ll = bookLL(book);
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
      if (!flightsOpen) globe.start();
      if (pin && opts.focus !== false) pin.el.querySelector('.book').focus({ preventScroll: true });
    };
    const done = () => {
      if (gen !== pageGen) return;
      leaf.hidden = true;
      leaf.classList.remove('is-open', 'is-captioned', 'is-dissolving', 'is-leaving', 'is-past', 'is-still', 'is-woken', 'is-scrolled');
      leafContent.textContent = '';
      clearDissolve();
    };
    const atCover = !leaf.classList.contains('is-plain') && leafScroll.scrollTop < 80;
    if (opts.animate && !reduce.matches && atCover) {
      // the same dissolve, reversed and a little quicker, then the camera draws back out
      leaf.classList.remove('is-captioned');
      later(() => {
        if (gen !== pageGen) return;
        leaf.classList.remove('is-open');
        leaf.classList.add('is-dissolving');
        app.classList.remove('is-soft');
        revealTween = tween(1250, (e) => setDissolve(1 - e), () => { done(); surface(); }, easeInOut);
      }, 140);
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
    const b = bookOfSlide(photo);
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
    if (h.startsWith('photo-') && S.slides[h.slice(6)]) return { page: validView(st.page) ? viewBook(st.page).view : null, photo: h.slice(6), cover: st.cover };
    if (validView(h)) return { page: viewBook(h).view, photo: null, cover: st.cover };
    return { page: null, photo: null };
  }
  function apply(want, animate) {
    if (want.photo !== photo && photo) hideViewer();
    if (!want.flights && flightsOpen) closeFlights({ animate: animate && !want.page });
    if (want.page !== page) {
      if (page) closePage({ animate: animate && !want.page && !want.flights, focus: !want.page && !want.flights });
      if (want.page) openPage(want.page, { animate, cover: want.cover });
    }
    if (want.flights && !flightsOpen) openFlights({ animate });
    if (want.photo && want.photo !== photo) showViewer(want.photo, photoList, photoFrom);
  }
  function go(view, coverId) {
    if (page === view || diving) return;
    if (opening && !opening.done) opening.skip();
    try { history.pushState({ wc: true, page: view, cover: coverId || null }, '', `#${view}`); } catch (e) { /* fine */ }
    if (page) closePage({ animate: false, focus: false });
    openPage(view, { animate: true, cover: coverId });
  }
  function goFlights() {
    if (flightsOpen || diving) return;
    if (opening && !opening.done) opening.skip();
    try { history.pushState({ wc: true, flights: true }, '', '#flights'); } catch (e) { /* fine */ }
    openFlights({ animate: true });
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
    if (e.key !== 'Escape') return;
    if (photo || page || flightsOpen) { e.preventDefault(); back(); }
    else if (indexEl.classList.contains('is-open')) { e.preventDefault(); setIndex(false); }
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
    $('#globe').setAttribute('aria-label', T[lang].globeLabel);
    $('#opener-name').textContent = T[lang].names[nameN];
    // the tally by the zoom words: his countries out of the world's 195 (his figure), and the share
    $('#tally').textContent = T[lang].tally(S.countries.length, WORLD_COUNTRIES, Math.round((100 * S.countries.length) / WORLD_COUNTRIES));
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
      renderLeaf(page);
      leafScroll.scrollTop = top;
    }
    if (flightsOpen) { const n = jOn; renderJourneys(); if (n >= 0) { focusJourney(n, true); showLeg(big.legNow); } }
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
    set('--dab-warm', dab([234, 136, 112], 120, 36, 3, 0.55));
    set('--dab-sea', dab([150, 196, 222], 720, 150, 9, 0.34));
    set('--stroke', dab([140, 190, 220], 520, 22, 21, 0.5));
    set('--dab-ochre', dab([226, 196, 128], 360, 40, 33, 0.42));
  }

  /* ------------------------------------------------------------ the globe in the corner, and the Flights view it opens */

  const globeBtn = $('#globe');
  const globeCanvas = $('#globe-canvas');
  const globe = new WC.Globe(globeCanvas, { land: null, travel: null, flights, reduce: () => reduce.matches });
  // the traffic over the map (a few flights always in the air) runs and rests with the small globe
  const traffic = WC.traffic({
    canvas: $('#sky'), flights, LON0, SY, reduce: () => reduce.matches,
    view: () => { const z = state.z; return { k: z.k * state.S0, tx: z.x + (z.k * state.W) / 2, ty: z.y + (z.k * state.H) / 2, W: state.W, H: state.H, dpr: state.dpr }; },
  });
  {
    const gStart = globe.start.bind(globe), gStop = globe.stop.bind(globe);
    globe.start = () => { gStart(); traffic.start(); };
    globe.stop = () => { gStop(); traffic.stop(); };
  }
  globeBtn.addEventListener('click', () => goFlights());
  function sizeGlobe() { globe.resize(narrow.matches ? 92 : 184); }
  let opening = null;

  const fCanvas = $('#flights-canvas');
  const journeysEl = $('#journeys');
  const legWhen = $('#flights-when');
  const legWay = $('#flights-way');
  // at rest the globe sends flights from Taipei to each of the other books' places
  // (and to any country travelled that has no book)
  const otherPlaces = [...books.filter((b) => b.country !== S.home).map(bookLL),
    ...S.countries.filter((c) => c.id !== S.home && !bookByCountry[c.id]).map((c) => c.ll)].map((ll) => [ll[1], ll[0]]);
  const big = new WC.BigGlobe(fCanvas, {
    land: null, travel: null, borders: null, hi: null, home: FROM, places: otherPlaces, reduce: () => reduce.matches,
    letter: (text) => sprite(`city-${text}`, text, { size: 12.5, weight: 500, colour: 'rgb(38, 34, 33)', halo: 3.4 }),
    onLeg: (i) => showLeg(i),
    speed: () => replaySpeed,
    relief: () => (state.relief ? { coarse: state.reliefBM || state.relief, fine: state.reliefFineBM || null } : null),
  });
  let flightsOpen = false, jOn = -1, jLeave = 0, lastPointer = '';
  // the replay's speed, remembered on this browser
  let replaySpeed = 1;
  const speedOf = (s) => (s === 'slow' ? 'slow' : parseFloat(s));
  try { const v = speedOf(localStorage.getItem('tlap-speed')); if (['slow', 0.5, 1, 1.5, 2].includes(v)) replaySpeed = v; } catch (e) { /* storage blocked */ }
  const speedBtns = $$('.speed__btn');
  const markSpeed = () => speedBtns.forEach((b) => b.setAttribute('aria-pressed', String(speedOf(b.dataset.speed) === replaySpeed)));
  markSpeed();
  speedBtns.forEach((b) => b.addEventListener('click', () => {
    replaySpeed = speedOf(b.dataset.speed);
    try { localStorage.setItem('tlap-speed', String(replaySpeed)); } catch (e) { /* storage blocked */ }
    markSpeed();
    // a journey being followed starts again at the new speed
    if (jOn >= 0) { big.rp = null; focusJourney(jOn, true); }
  }));
  // a leg's end, named in the language in use
  // (a journey without legs flies to its country; where the country's books are cities, the
  // country is named, since which city is not known)
  const endName = (e) => {
    if (!e) return '';
    if (!e.cid) return clean(lang === 'zh' ? e.zh || e.city : e.city);
    const b = bookByCountry[e.cid];
    return L(!b || b.place ? countries[e.cid].name : b.title);
  };
  const replayOf = (n) => {
    const j = journeys[n];
    return {
      key: j.id || `j${n}`,
      legs: j.legs.map((q) => ({
        from: q.from, to: q.to, mode: q.mode,
        fromName: q.a ? endName(q.a) : '', toName: endName(q.b),
        fromHome: !q.a || atFrom(q.from, q.a.code), toHome: atFrom(q.to, q.b && q.b.code),
      })),
    };
  };
  // the line under the globe: the journey's date, and the leg being travelled
  function showLeg(i) {
    if (i < 0 || jOn < 0) return;
    const j = journeys[jOn];
    const q = j.legs[i];
    legWhen.textContent = L(j.date);
    if (q) {
      // the arrow is a character of the running text, set a little lighter than the names
      const arrow = document.createElement('span');
      arrow.className = 'flights__arrow';
      arrow.textContent = '→';
      legWay.replaceChildren(q.a ? endName(q.a) : L({ en: 'Taipei', zh: '台北' }), arrow, T[lang].legTail(endName(q.b), T[lang].modes[q.mode] || T[lang].modes.ground));
    } else legWay.textContent = T[lang].wholeJourney;
    if (!reduce.matches) legWay.animate([{ opacity: 0.15, transform: 'translateY(3px)' }, { opacity: 1, transform: 'none' }], { duration: 460, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
  }
  const routeLine = (j) => {
    const names = [];
    for (const s of j.stops) { if (!s.city) continue; const nm = cityName(s.city); if (!names.includes(nm)) names.push(nm); }
    return names.join(lang === 'zh' ? '、' : ', ');
  };
  function renderJourneys() {
    $('#flights-lede').textContent = T[lang].flightsLede(journeys.length);
    journeysEl.innerHTML = journeys.map((j, n) => {
      // the journey's books: its own places where it names them (the US cities), else its countries'
      // a country without a book is named, on a hatched blank, and opens nothing
      const list = Array.isArray(j.places) && j.places.length ? j.places.map((k) => bookByKey[k])
        : (j.countries || []).filter((cid) => countries[cid]).map((cid) => bookByCountry[cid] || { country: cid, title: countries[cid].name, still: true });
      const places = list.filter(Boolean).map((b) => {
        if (b.still) return `<li><span class="jplace jplace--still"><span class="jplace__blank" aria-hidden="true"></span><span class="jplace__name">${esc(L(b.title))}</span></span></li>`;
        const s = b.photo ? S.slides[b.photo] : null;
        const thumb = s
          ? `<img src="${imgSrc(s, 640)}" alt="" loading="lazy" decoding="async" width="${s.w}" height="${s.h}">`
          : '<span class="jplace__blank" aria-hidden="true"></span>';
        return `<li><button type="button" class="jplace" data-view="${b.view}">${thumb}<span class="jplace__name">${esc(L(b.title))}</span></button></li>`;
      }).join('');
      const route = routeLine(j);
      return `<li class="journey" data-j="${n}">` +
        `<h3 class="journey__head"><button type="button" class="journey__date" data-j="${n}" aria-pressed="${n === jOn}" aria-label="${esc(T[lang].journeyAria(L(j.date)))}">${esc(L(j.date))}</button></h3>` +
        (route ? `<p class="journey__route">${esc(route)}</p>` : '') +
        `<ul class="journey__places">${places}</ul></li>`;
    }).join('');
  }
  // the photograph behind the Flights spread: a journey's first place with a cover while the hand
  // is on it, otherwise whatever the sea shows (his request, 2026-10-03)
  const fImgs = $$('.flights__photo-img');
  let fOn = 0, fSrc = '';
  const seaPhotoId = () => (ocean && ocean.current()) || 'aoraki';
  const journeyPhotoId = (n) => {
    const j = journeys[n];
    if (!j) return null;
    const keys = Array.isArray(j.places) && j.places.length ? j.places.map((k) => bookByKey[k]).filter(Boolean) : (j.countries || []).flatMap((cid) => booksOf(cid));
    const b = keys.find((q) => q && (q.cover || q.photo));
    return b ? b.cover || b.photo : null;
  };
  function flightsPhoto(id) {
    const s = id && S.slides[id];
    if (!s) return;
    const src = (ocean && ocean.srcOf(id)) || imgSrc(s, state.W * state.dpr > 1280 ? null : 1280);
    if (src === fSrc) return;
    fSrc = src;
    const next = fImgs[1 - fOn], cur = fImgs[fOn];
    const show = () => { if (fSrc !== src) return; cur.classList.remove('is-on'); next.classList.add('is-on'); fOn = 1 - fOn; };
    next.onload = show;
    next.src = src;
    if (next.complete && next.naturalWidth) show();
    flightsEl.classList.add('has-photo');
  }
  function focusJourney(n, force) {
    clearTimeout(jLeave);
    if (n === jOn && !force) return;
    jOn = n;
    flightsPhoto(n >= 0 ? journeyPhotoId(n) || seaPhotoId() : seaPhotoId());
    $$('.journey', journeysEl).forEach((el) => {
      const on = +el.dataset.j === n;
      el.classList.toggle('is-on', on);
      const d = $('.journey__date', el);
      if (d) d.setAttribute('aria-pressed', String(on));
    });
    flightsEl.classList.toggle('is-following', n >= 0);
    big.focus(n < 0 ? null : replayOf(n));
  }
  // what pressed last: a touch plays a journey first and dives on the next tap
  journeysEl.addEventListener('pointerdown', (e) => { lastPointer = e.pointerType; }, true);
  journeysEl.addEventListener('keydown', () => { lastPointer = 'key'; }, true);
  journeysEl.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    const li = e.target.closest('.journey');
    if (li) focusJourney(+li.dataset.j);
  });
  journeysEl.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') jLeave = setTimeout(() => focusJourney(-1), 260); });
  journeysEl.addEventListener('focusin', (e) => {
    if (lastPointer === 'touch' || lastPointer === 'pen') return;
    const li = e.target.closest('.journey');
    if (li) focusJourney(+li.dataset.j);
  });
  journeysEl.addEventListener('focusout', (e) => {
    if (lastPointer === 'touch' || lastPointer === 'pen') return;
    if (!journeysEl.contains(e.relatedTarget)) jLeave = setTimeout(() => focusJourney(-1), 260);
  });
  journeysEl.addEventListener('click', (e) => {
    const li = e.target.closest('.journey');
    const n = li ? +li.dataset.j : -1;
    const touch = lastPointer === 'touch' || lastPointer === 'pen';
    const pl = e.target.closest('button.jplace');
    if (pl && !(touch && n !== jOn)) {
      // a place in a journey: straight into it on the map
      const view = pl.dataset.view;
      closeFlights({ animate: false, focus: false });
      try { history.replaceState({ wc: true, page: view, cover: null }, '', `#${view}`); } catch (err) { /* fine */ }
      openPage(view, { animate: true });
      return;
    }
    if (n < 0) return;
    // a tap on the journey being travelled puts the globe back at rest
    if (touch && n === jOn && !pl) { focusJourney(-1); return; }
    focusJourney(n);
  });
  $('#flights-back').addEventListener('click', () => back());

  function sizeBig() {
    const small = narrow.matches;
    const s = small ? Math.min(innerWidth - 28, innerHeight * 0.42) : Math.min(innerWidth * 0.5 - 56, innerHeight - 150);
    const px = Math.max(220, Math.round(s));
    flightsEl.style.setProperty('--gs', `${px}px`);
    big.resize(px);
  }
  // the small globe's sphere and the large one's, on the screen: centre and radius
  const sphereOf = (el, cy, rf) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height * cy, r: r.width * rf }; };
  const flyFrom = (a, b) => `translate(${(a.x - b.x).toFixed(1)}px, ${(a.y - b.y).toFixed(1)}px) scale(${(a.r / b.r).toFixed(4)})`;

  function openFlights(opts = {}) {
    flightsOpen = true;
    renderJourneys();
    jOn = -1;
    if (ocean) flightsEl.style.setProperty('--sea', ocean.strength);
    flightsPhoto(seaPhotoId());
    flightsEl.classList.remove('is-following', 'is-closing');
    flightsEl.hidden = false;
    flightsEl.scrollTop = 0;
    app.inert = true;
    setIndex(false, false);
    clearActive();
    globe.stop();
    big.o.land = state.land110;
    big.o.travel = globe.o.travel;
    big.o.borders = state.bordersGeo110;
    big.rot = [globe.lon, -18]; big.k = 1; big.vel = [0, 0]; big.tw = null; big.focus(null);
    sizeBig();
    big.start();
    if (opts.animate && !reduce.matches) {
      // the globe lifts out of its corner and grows onto the left-hand page
      const a = sphereOf(globeCanvas, 0.46, 0.43), b = sphereOf(fCanvas, 0.47, 0.4);
      app.classList.add('is-flying');
      flightsEl.classList.add('is-arriving');
      fCanvas.animate([{ transform: flyFrom(a, b) }, { transform: 'none' }], { duration: 950, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
      flightsEl.getBoundingClientRect();
      requestAnimationFrame(() => requestAnimationFrame(() => flightsEl.classList.remove('is-arriving')));
    } else {
      app.classList.add('is-flying');
      if (opts.animate) flightsEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out' });
    }
    live.textContent = t('flightsTitle');
    requestAnimationFrame(() => $('#flights-back').focus({ preventScroll: true }));
  }
  function closeFlights(opts = {}) {
    if (!flightsOpen) return;
    flightsOpen = false;
    clearTimeout(jLeave);
    jOn = -1;
    big.focus(null);
    globe.lon = big.rot[0];
    const finish = () => {
      flightsEl.hidden = true;
      flightsEl.classList.remove('is-closing', 'is-following');
      fCanvas.getAnimations().forEach((x) => x.cancel());
      big.stop();
      app.classList.remove('is-flying');
      if (!page) { app.inert = false; globe.start(); }
    };
    if (opts.animate && !reduce.matches && flightsEl.scrollTop < 40) {
      // and settles back into its corner
      const a = sphereOf(globeCanvas, 0.46, 0.43);
      const b = sphereOf(fCanvas, 0.47, 0.4);
      big.toward({ c: [-big.rot[0], 18], k: 1 }, 700);
      flightsEl.classList.add('is-closing');
      const an = fCanvas.animate([{ transform: 'none' }, { transform: flyFrom(a, b) }], { duration: 760, easing: 'cubic-bezier(0.7, 0, 0.84, 0)', fill: 'forwards' });
      an.onfinish = finish;
    } else if (opts.animate) {
      flightsEl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: 'ease-in', fill: 'forwards' }).onfinish = () => { flightsEl.getAnimations().forEach((x) => x.cancel()); finish(); };
    } else finish();
    if (!page) app.inert = false;
    if (!page && opts.focus !== false) globeBtn.focus({ preventScroll: true });
  }

  /* ------------------------------------------------------------ photographs on the map: two trials */

  // trial 2 (?photos=land): each travelled country wears its cover photograph inside its outline,
  // painted into the offscreen textures (paint.js), so panning costs nothing more. The United
  // States wears New York's, its first book's; a country with no cover keeps the plain wash
  const landPhotoList = () => {
    const out = [];
    for (const c of S.countries) {
      const f = state.feats[c.id];
      const b = f && booksOf(c.id).find((q) => q.cover || q.photo);
      const s = b && S.slides[b.cover || b.photo];
      if (!s) continue;
      out.push({ feature: f, src: (px) => imgSrc(s, px * 1.1 <= 640 ? 640 : px * 1.1 <= 1280 ? 1280 : undefined) });
    }
    return out;
  };
  function landPhotos(c, job) {
    if (!LAND_PHOTOS || !state.feats) return;
    // faint at the world view (0.24), rising to 0.4 by the country frame; lifted toward the paper so
    // a night photograph tints its country rather than sinking it
    const alpha = 0.24 + 0.16 * clamp((job.r - 11) / 21, 0, 1);
    WC.paintPhotos(c, job, paintEnv, landPhotoList(), { alpha, inset: job.b ? 36 : 0, filter: 'brightness(1.3) contrast(0.85) saturate(1.15)', onEach: queueDraw });
  }

  // trial 1 (?photos=sea): one large print laid on the page in the empty ocean, cycling slowly
  // through every photograph. Hovering a book shows that place's cover there instead; clicking
  // the print dives into its place with it as the cover. It is pinned to the paper, so it pans
  // and zooms with the map, and it steps aside (fades out) past a modest zoom. Its spot is
  // measured, not fixed: the emptiest stretch of the South Pacific or the South Atlantic (on a
  // phone, the Pacific below Asia) at this window, clear of land, books, names and the margins'
  // words. Reduced motion: one photograph, chosen once, and no crossfade.
  // the order the photographs cycle in: shuffled once a visit and dealt round the places, so one
  // place never runs on
  function dealPhotos() {
    const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const byPlace = new Map();
    for (const id of indexOrder) {
      const b = bookOfSlide(id);
      const k = b ? b.key : S.slides[id].country;
      if (!byPlace.has(k)) byPlace.set(k, []);
      byPlace.get(k).push(id);
    }
    const queues = shuffle([...byPlace.values()].map(shuffle));
    const order = [];
    while (queues.some((q) => q.length)) for (const q of queues) if (q.length) order.push(q.shift());
    return order;
  }

  // trial 3 (?photos=ocean): one photograph under the whole window, fixed to the screen, seen
  // only through the sea: the land stays opaque paper over it, the lakes count as water, and the
  // map's own sea wash and coast pooling lie on it. It is multiplied into the sheet, faint and a
  // little desaturated, so it reads as printed into the paper under the water. Every frame the
  // photograph is laid on an offscreen canvas and the land punched out of it with the drawing's
  // own land path at the current transform (even-odd, with the lakes added so they stay open);
  // photographs are decoded off the main thread and fitted once each, never per frame. Cycles
  // through every photograph (12s, 2.5s crossfade) only with ?ocean=all; a hand on a book does
  // not change it (his call); reduced motion: one photograph. ?o=0.35 sets the strength.
  function makeOcean() {
    const HOLD = 12000, FADE = 2500, HOVER_FADE = 900, RISE = 6000;
    let strength = clamp(parseFloat(ask.get('o')) || 0.9, 0.05, 1);   // 0.9: his call, 2026-10-03
    // for now one photograph only, Aoraki (his call, 2026-10-03); ?ocean=all brings back the cycle
    const order = ask.get('ocean') === 'all' ? dealPhotos() : ['aoraki'];
    const oc = { cur: null, next: null, fadeAt: 0, fadeDur: 0, started: false, i: 0, hover: null, timer: 0, begun: false, riseAt: 0, preps: new Map(), masks: new Map(), land50: null };
    const P = document.createElement('canvas');
    const pg = P.getContext('2d');
    // a photograph with its own copy for the sea: Aoraki is seen through a car window, so the sea
    // gets the view inside the frame, cut from his original at full size (`-sea.jpg`, made by hand,
    // with a 1280 copy; his call: the mountain fills the window, no dark corner). Any photograph
    // not listed is used whole.
    const SEA_FILE = { aoraki: 'new-zealand-aoraki-sea.jpg' };
    const SEA_ANCHOR = { aoraki: 0.28 };
    // the photograph covers the window, so it needs the full-size copy on any large or Retina
    // screen; the 1280 copy only on small phones
    const src = (id) => imgSrc(SEA_FILE[id] ? { file: SEA_FILE[id] } : S.slides[id], state.W * state.dpr > 1280 ? null : 1280);
    // a photograph fitted to the window once, let down in colour, kept for as long as it is in play
    const prep = (id) => {
      let c = oc.preps.get(id);
      if (c) return c;
      const e = WC.photoBitmap(src(id));
      if (!e.bm) { if (!e.waited) { e.waited = true; e.p.then(() => queueDraw()); } return null; }
      c = document.createElement('canvas');
      c.width = P.width; c.height = P.height;
      const g = c.getContext('2d');
      // fitted to cover the window, centred sideways; up and down it sits where SEA_ANCHOR says
      // (0 keeps the top of the photograph, 1 the foot, 0.5 the middle): Aoraki a little lower,
      // so the summit is not pressed against the top edge of a wide window (his call, 2026-10-03)
      const k = Math.max(c.width / e.bm.width, c.height / e.bm.height);
      const ay = SEA_ANCHOR[id] == null ? 0.5 : SEA_ANCHOR[id];
      g.imageSmoothingQuality = 'high';
      g.drawImage(e.bm, (c.width - e.bm.width * k) / 2, (c.height - e.bm.height * k) * ay, e.bm.width * k, e.bm.height * k);
      for (const key of oc.preps.keys()) if (key !== oc.cur && key !== oc.next && oc.preps.size > 2) oc.preps.delete(key);
      oc.preps.set(id, c);
      return c;
    };
    // the land to punch out: the fine drawing once close enough, as the coasts are; lakes open
    const maskPath = (p) => {
      const fine = p > 12 && state.land50;
      const xl = state.lakesXPath && resOf(bandOf(p)) >= LAKES_R;
      const key = `${fine ? 50 : 110}|${xl ? 'x' : ''}|${state.lakesPath ? 'l' : ''}`;
      let path = oc.masks.get(key);
      if (!path) {
        if (fine && !oc.land50) oc.land50 = pathDeg(state.land50);
        path = new Path2D();
        path.addPath(fine ? oc.land50 : state.landFill110);
        const lakes = fine ? state.lakesPath : state.lakesBigPath;
        if (lakes) path.addPath(lakes);
        if (xl) path.addPath(state.lakesXPath);
        oc.masks.set(key, path);
      }
      return path;
    };
    function toward(id, dur) {
      if (!id || !S.slides[id]) return;
      if (oc.next) { oc.cur = oc.next; oc.next = null; }
      if (id === oc.cur) { queueDraw(); return; }
      oc.next = id; oc.fadeDur = reduce.matches ? 0 : dur; oc.started = false;
      WC.photoBitmap(src(id));
      queueDraw();
    }
    function schedule() {
      clearTimeout(oc.timer);
      if (reduce.matches || order.length < 2) return;
      oc.timer = setTimeout(() => {
        if (oc.hover || document.hidden || page || flightsOpen) { schedule(); return; }
        oc.i = (oc.i + 1) % order.length;
        toward(order[oc.i], FADE);
        schedule();
      }, HOLD);
    }
    document.addEventListener('visibilitychange', () => { if (!document.hidden && oc.begun) schedule(); });
    return {
      oc, strength,
      // from draw(), after the painting and before the pen: the photograph through the sea
      draw(now) {
        if (!state.landFill110) return;
        const { W, H, dpr, z } = state;
        if (P.width !== canvas.width || P.height !== canvas.height) { P.width = canvas.width; P.height = canvas.height; oc.preps.clear(); }
        if (!oc.begun) { oc.begun = true; if (order.length) { toward(order[0], 0); schedule(); } }
        let a = 0, nc = null;
        if (oc.next) {
          nc = prep(oc.next);
          if (nc) {
            if (!oc.started) { oc.started = true; oc.fadeAt = now; }
            a = oc.fadeDur ? clamp((now - oc.fadeAt) / oc.fadeDur, 0, 1) : 1;
            if (a >= 1) {
              oc.cur = oc.next; oc.next = null; nc = null; a = 0;
              if (!reduce.matches && order.length > 1) WC.photoBitmap(src(order[(oc.i + 1) % order.length]));
            }
          }
        }
        const cc = oc.cur ? prep(oc.cur) : null;
        if (!cc && !nc) return;
        const p = pxPerDeg();
        const X0 = z.x + (z.k * W) / 2, Y0 = z.y + (z.k * H) / 2;
        pg.setTransform(1, 0, 0, 1, 0, 0);
        pg.globalCompositeOperation = 'source-over';
        pg.globalAlpha = 1;
        pg.clearRect(0, 0, P.width, P.height);
        // the whole window, plate or not: where the map's sheet ends, the photograph goes on
        // (his call, 2026-10-03: no paper above or below the map, the mountain fills it)
        if (cc) pg.drawImage(cc, 0, 0);
        if (nc && a > 0) { pg.globalAlpha = a; pg.drawImage(nc, 0, 0); pg.globalAlpha = 1; }
        pg.globalCompositeOperation = 'destination-out';
        pg.setTransform(dpr * p, 0, 0, dpr * p, dpr * X0, dpr * Y0);
        pg.fillStyle = '#000';
        pg.fill(maskPath(p), 'evenodd');
        pg.setTransform(1, 0, 0, 1, 0, 0);
        pg.globalCompositeOperation = 'source-over';
        // the real photograph, laid over the sea as it is (no blend into the paper), at the strength.
        // It is not there while the opening plays, and once the map is in view it comes up slowly
        // from nothing over RISE (his call, 2026-10-03); reduced motion: at once
        // (when the opening plays, it brings the photograph up itself as its backdrop, and the map
        // beneath holds it at full strength for the reveal: no second rise)
        if (app.classList.contains('is-opening')) oc.opened = true;
        if (!oc.riseAt) oc.riseAt = oc.opened ? now - RISE : now;
        const rise = reduce.matches ? 1 : easeInOut(clamp((now - oc.riseAt) / RISE, 0, 1));
        if (rise <= 0) { queueDraw(); return; }
        ctx.save();
        ctx.globalAlpha = strength * rise;
        ctx.drawImage(P, 0, 0, W, H);
        ctx.restore();
        if (oc.next || rise < 1) queueDraw();
      },
      hover(id) {
        if (!id || !S.slides[id] || !oc.begun) return;
        oc.hover = id;
        toward(id, HOVER_FADE);
      },
      // a chosen photograph: the sea takes it (crossfade) and keeps it
      show(id) {
        if (!id || !S.slides[id]) return;
        oc.hover = null;
        const at = order.indexOf(id);
        if (at >= 0) oc.i = at;
        toward(id, oc.begun ? FADE : 0);
      },
      // the same photograph, whole, laid into another window-sized canvas (the opening's) at a
      // share of the strength: the opening's backdrop (the corridor's prints stand in front of it)
      // el: the opening's clock; until: when it should be fully there (0: at once). It rises from
      // nothing from the moment the photograph is decoded, so a late arrival never pops in
      backdrop(g, el, until) {
        if (P.width !== canvas.width || P.height !== canvas.height) { P.width = canvas.width; P.height = canvas.height; oc.preps.clear(); }
        oc.opened = true;
        const id = oc.cur || order[0];
        const cc = id ? prep(id) : null;
        if (!cc) return;
        let a = 1;
        if (until) {
          if (!oc.bdFrom) oc.bdFrom = el;
          a = easeInOut(clamp((el - oc.bdFrom) / Math.max(400, until - oc.bdFrom), 0, 1));
        }
        if (a <= 0) return;
        g.save();
        g.globalAlpha *= strength * a;
        g.drawImage(cc, 0, 0, state.W, state.H);
        g.restore();
      },
      // decoded and fitted, ready to be seen
      ready() { const id = oc.cur || order[0]; return !id || !!WC.photoBitmap(src(id)).bm; },
      // which photograph the sea shows (or is turning to), and the file it uses for one
      current() { return oc.next || oc.cur || order[0] || null; },
      srcOf(id) { return S.slides[id] ? src(id) : null; },
      get strength() { return strength; },
      set strength(v) { strength = clamp(v, 0.05, 1); queueDraw(); },
      unhover() {
        if (!oc.hover) return;
        oc.hover = null;
        toward(order[oc.i], HOVER_FADE);
      },
    };
  }
  const ocean = OCEAN_PHOTO ? makeOcean() : null;
  if (ocean) app.classList.add('has-ocean');
  // the dial, bottom right: slides the strength live and remembers it on this browser (he keeps it)
  if (ocean) {
    const dial = $('#ocean-dial'), range = $('#ocean-range'), out = $('#ocean-out');
    try { const v = parseFloat(localStorage.getItem('tlap-ocean')); if (v >= 0.05 && v <= 1 && !ask.has('o')) ocean.strength = v; } catch (e) { /* storage blocked */ }
    range.value = String(Math.round(ocean.strength * 100));
    out.value = ocean.strength.toFixed(2);
    range.addEventListener('input', () => {
      ocean.strength = range.value / 100;
      out.value = ocean.strength.toFixed(2);
      flightsEl.style.setProperty('--sea', ocean.strength);
      try { localStorage.setItem('tlap-ocean', String(ocean.strength)); } catch (e) { /* storage blocked */ }
    });
    dial.hidden = false;
  }
  WC.ocean = ocean; // for inspection in the console
  // a hand on a book (or one of its photographs), or none: told to whichever trials are on
  function mapPhotoHover(id) {
    if (seaPrint) { if (id) seaPrint.hover(id); else seaPrint.unhover(); }
    // (the photograph through the sea does not follow the hand: he will choose what it shows,
    // 2026-10-03)
  }

  function makeSeaPrint() {
    const HOLD = 9000, FADE = 1600, HOVER_FADE = 700;
    const el = document.createElement('div');
    el.className = 'print';
    el.hidden = true;
    el.innerHTML = '<a class="print__frame" href="#"><img class="print__img" alt="" decoding="async"><img class="print__img" alt="" decoding="async"><span class="print__cap"><b></b><i></i></span></a>';
    mapEl.insertBefore(el, mapEl.querySelector('.map__tooth'));
    const frame = el.firstElementChild;
    const imgs = Array.from(frame.querySelectorAll('img'));
    const capB = frame.querySelector('b'), capI = frame.querySelector('i');
    const order = dealPhotos();
    const pr = { on: 0, i: 0, cur: null, want: null, hover: null, timer: 0, anchor: null, box: null, homeK: 1, placedFor: '', begun: false, capLang: '' };

    // where it lies: measured in screen space at the whole-map view, on a quarter-size mask of
    // everything in the way (the land, the books and their names with room to be pushed, the
    // ocean names, the margins' words), with a summed-area table so every spot is one lookup
    function place() {
      const z = homeTransform();
      const p = pxPerDeg(z);
      const { W, H } = state;
      const X0 = z.x + (z.k * W) / 2, Y0 = z.y + (z.k * H) / 2;
      const Q = 4, w = Math.ceil(W / Q), h = Math.ceil(H / Q);
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const g = c.getContext('2d', { willReadFrequently: true });
      g.fillStyle = '#000';
      g.setTransform(p / Q, 0, 0, p / Q, X0 / Q, Y0 / Q);
      g.fill(state.landFill110);
      g.setTransform(1, 0, 0, 1, 0, 0);
      const rect = (x0, y0, x1, y1) => g.fillRect(x0 / Q, y0 / Q, (x1 - x0) / Q, (y1 - y0) / Q);
      const small = narrow.matches;
      const s = Math.min(small ? 0.32 : 0.46, (small ? 0.17 : 0.25) * Math.pow(Math.max(0.5, p / 5.4), 0.3));
      const bw = 192 * s, bh = 272 * s, lh = small ? 15 : 18, room = small ? 14 : 22;
      for (const q of pinList) {
        const [ax, ay] = P(q.ll, z);
        const hw = Math.max(bw, q.lw) / 2 + room;
        rect(ax - hw, ay - bh - room, ax + hw, ay + 8 + lh + room);
      }
      // (the ocean names are not in the way: they yield to the print as they yield to a book)
      const e = small ? 14 : 22;
      rect(0, 0, 260, e + 40); rect(W - 340, 0, W, e + 44);
      if (small) { rect(0, H - 150, 130, H); rect(W - 120, H - 130, W, H); rect(0, H - 48, W, H); }
      else { rect(0, H - 240, 208, H); rect(208, H - 56, 330, H); rect(W - 440, H - 64, W, H); rect(W - 56, 0, W, H); }
      const d = g.getImageData(0, 0, w, h).data;
      const sat = new Int32Array((w + 1) * (h + 1));
      for (let y = 1; y <= h; y++) {
        let row = 0;
        for (let x = 1; x <= w; x++) { row += d[((y - 1) * w + x - 1) * 4 + 3] > 0 ? 1 : 0; sat[y * (w + 1) + x] = sat[(y - 1) * (w + 1) + x] + row; }
      }
      const sum = (x0, y0, x1, y1) => {
        x0 = clamp(Math.floor(x0 / Q), 0, w); y0 = clamp(Math.floor(y0 / Q), 0, h); x1 = clamp(Math.ceil(x1 / Q), 0, w); y1 = clamp(Math.ceil(y1 / Q), 0, h);
        if (x1 <= x0 || y1 <= y0) return 1;
        return sat[y1 * (w + 1) + x1] - sat[y0 * (w + 1) + x1] - sat[y1 * (w + 1) + x0] + sat[y0 * (w + 1) + x0];
      };
      // the sea to try: the Pacific between Hawaii and the Americas south of the equator, and the
      // South Atlantic (a phone: the Pacific east of the Philippines, then beyond New Zealand)
      const regions = small
        ? [{ lat: [30, -24], lon: [118, 180] }, { lat: [-16, -54], lon: [-180, -108] }]
        : [{ lat: [-3, -52], lon: [-172, -76] }, { lat: [-3, -50], lon: [-44, 12] }];
      // the envelope every photograph is fitted into: as wide as asked (24 to 30% of the window),
      // or narrower where the sea is, and lying, square or upright as the clear water allows; the
      // largest that sits clear wins, a bigger print before a wider margin
      const fracs = small ? [0.55, 0.48, 0.42, 0.36] : [0.3, 0.27, 0.24, 0.21, 0.18, 0.15];
      const shapes = [];
      for (const fr of fracs) for (const ratio of [0.68, 1, 1.3]) shapes.push({ pw: W * fr, ph: W * fr * ratio });
      shapes.sort((a, b) => b.pw * b.ph - a.pw * a.ph);
      const MARGINS = [80, 56, 40, 28, 16, 8, 6];
      let best = null;
      for (const { pw, ph } of shapes) {
        for (const rg of regions) {
          let top = -1;
          const found = [];
          for (let lat = rg.lat[0]; lat >= rg.lat[1]; lat -= 1) {
            for (let lon = rg.lon[0]; lon <= rg.lon[1]; lon += 1) {
              const [x, y] = P([lat, lon], z);
              const x0 = x - pw / 2, y0 = y - ph / 2, x1 = x + pw / 2, y1 = y + ph / 2 + 24;
              if (x0 < e + 6 || y0 < e + 6 || x1 > W - e - 6 || y1 > H - e - 6) continue;
              let m = -1;
              for (const mm of MARGINS) if (sum(x0 - mm, y0 - mm, x1 + mm, y1 + mm) === 0) { m = mm; break; }
              if (m < 0) continue;
              if (m > top) { top = m; found.length = 0; }
              if (m === top) found.push([lat, lon, x, y]);
            }
          }
          if (top < 0) continue;
          // of the clearest spots, the one in the middle of them: the print sits in the middle of the empty sea
          const cx = found.reduce((a, q) => a + q[2], 0) / found.length, cy = found.reduce((a, q) => a + q[3], 0) / found.length;
          found.sort((a, b) => Math.hypot(a[2] - cx, a[3] - cy) - Math.hypot(b[2] - cx, b[3] - cy));
          if (!best || top > best.m) best = { m: top, ll: [found[0][0], found[0][1]], pw, ph };
        }
        if (best) break;
      }
      pr.best = best; pr.mask = c;
      if (!best) { pr.anchor = null; return; }
      pr.anchor = best.ll;
      pr.box = [best.pw / p, best.ph / p];
      pr.homeK = z.k;
    }

    const sizeFor = () => ((pr.box ? pr.box[0] * pxPerDeg() : 400) * state.dpr > 700 ? 1280 : 640);
    const fit = (s) => { const ar = s.w / s.h, br = pr.box[0] / pr.box[1]; return ar >= br ? [1, br / ar] : [ar / br, 1]; };
    function caption(id) {
      const s = S.slides[id], b = bookOfSlide(id);
      capB.textContent = L(s.place);
      capI.textContent = b ? L(countries[b.country].name) : '';
      pr.capLang = lang;
    }
    function preload() {
      if (reduce.matches || order.length < 2) return;
      const im = new Image();
      im.src = imgSrc(S.slides[order[(pr.i + 1) % order.length]], sizeFor());
    }
    function show(id, fade) {
      const s = S.slides[id];
      if (!s || !pr.box) return;
      pr.want = id;
      const nxt = imgs[1 - pr.on];
      const src = imgSrc(s, sizeFor());
      if (nxt.dataset.src !== src) { nxt.dataset.src = src; nxt.src = src; }
      const done = () => {
        if (pr.want !== id) return;
        pr.on = 1 - pr.on; pr.cur = id;
        frame.style.setProperty('--fade', `${reduce.matches ? 0 : fade}ms`);
        const [fw, fh] = fit(s);
        frame.style.setProperty('--fw', fw.toFixed(4));
        frame.style.setProperty('--fh', fh.toFixed(4));
        imgs[pr.on].classList.add('is-on');
        imgs[1 - pr.on].classList.remove('is-on');
        const b = bookOfSlide(id);
        frame.setAttribute('href', b ? `#${b.view}` : '#');
        if (fade > 0) setTimeout(() => { if (pr.cur === id) caption(id); }, fade / 2); else caption(id);
        preload();
      };
      (nxt.decode ? nxt.decode() : Promise.resolve()).then(done, done);
    }
    function schedule() {
      clearTimeout(pr.timer);
      if (reduce.matches || order.length < 2) return;
      pr.timer = setTimeout(() => {
        // it waits while a hand is on a book, while it is out of sight, and while a page is open
        if (pr.hover || el.hidden || document.hidden || page || flightsOpen) { schedule(); return; }
        pr.i = (pr.i + 1) % order.length;
        show(order[pr.i], FADE);
        schedule();
      }, HOLD);
    }
    function begin() {
      pr.begun = true;
      if (!order.length) return;
      show(order[0], 0);
      schedule();
    }
    frame.addEventListener('click', (e) => {
      e.preventDefault();
      const b = pr.cur && bookOfSlide(pr.cur);
      if (b) go(b.view, pr.cur);
    });
    document.addEventListener('visibilitychange', () => { if (!document.hidden && pr.begun) schedule(); });

    return {
      pr,
      // the room it takes on screen, kept clear of lettering (the ocean names step aside)
      taken(list) {
        if (el.hidden || !pr.anchor) return;
        const p = pxPerDeg();
        const [x, y] = P(pr.anchor);
        const w = pr.box[0] * p, h = pr.box[1] * p;
        list.push([x - w / 2 - 8, y - h / 2 - 8, x + w / 2 + 8, y + h / 2 + 30]);
      },
      // once a frame, from draw(): placed when the window or the language changes, moved with the
      // map, and hidden past a modest zoom or when it has left the window
      frame() {
        const key = `${state.W}x${state.H}|${lang}|${narrow.matches}`;
        if (pr.placedFor !== key && state.landFill110 && pinList.length) { pr.placedFor = key; place(); }
        if (!pr.anchor) { el.hidden = true; return; }
        const p = pxPerDeg();
        const [x, y] = P(pr.anchor);
        const w = pr.box[0] * p, h = pr.box[1] * p;
        const zoomA = 1 - clamp((state.z.k / pr.homeK - 1.9) / 0.7, 0, 1);
        if (zoomA <= 0 || x + w < -20 || x - w > state.W + 20 || y + h < -20 || y - h > state.H + 20) { el.hidden = true; return; }
        if (el.hidden) { el.hidden = false; if (!pr.begun) begin(); }
        if (pr.cur && pr.capLang !== lang) caption(pr.cur);
        el.style.setProperty('--x', `${x.toFixed(1)}px`);
        el.style.setProperty('--y', `${y.toFixed(1)}px`);
        el.style.setProperty('--w', `${w.toFixed(1)}px`);
        el.style.setProperty('--h', `${h.toFixed(1)}px`);
        el.style.setProperty('--o', zoomA.toFixed(3));
      },
      // a hand on a book (or one of its photographs): that photograph takes the frame
      hover(id) {
        if (!id || !S.slides[id] || el.hidden || !pr.begun) return;
        pr.hover = id;
        if (pr.cur !== id) show(id, HOVER_FADE);
      },
      unhover() {
        if (!pr.hover) return;
        pr.hover = null;
        if (pr.cur !== order[pr.i]) show(order[pr.i], HOVER_FADE);
      },
    };
  }
  const seaPrint = SEA_PRINT ? makeSeaPrint() : null;
  WC.seaPrint = seaPrint; // for inspection in the console

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
    state.coast110 = WC.pressure(topojson.mesh(w110, w110.objects.land)).map(pathDeg);
    state.bordersGeo110 = topojson.mesh(w110, w110.objects.countries, (a, b) => a !== b);
    state.borders110 = pathDeg(state.bordersGeo110);
    state.landFill110 = pathDeg(state.land110);
    const f110 = featsFor(w110);
    globe.o.land = state.land110;
    globe.o.travel = Object.values(f110);
    worldReady();
    big.o.land = state.land110; big.o.travel = globe.o.travel; big.o.borders = state.bordersGeo110;
    big.o.countries = topojson.feature(w110, w110.objects.countries).features;
    sizeGlobe();
    if (flightsOpen) big.kick();
    queueDraw();
    const relief = new Image();
    relief.src = '../vendor/relief/SR_50M-4096.jpg';
    const reliefReady = relief.decode().then(() => { state.relief = relief; }).catch(() => {});
    bitmapOf(relief.src).then((bm) => { state.reliefBM = bm; });
    // the lakes (Natural Earth 50m), washed and outlined as the coasts are
    const lakesReady = fetch('map/lakes-50m.json').then((r) => r.json()).then((lk) => {
      state.lakes = lk;
      state.lakesPath = pathDeg(lk);
      state.lakesBigPath = pathDeg({ type: 'FeatureCollection', features: lk.features.filter((f) => d3.geoArea(f) > 1.2e-4) });
      big.o.lakes = lk;
      if (flightsOpen) big.kick();
    }).catch(() => {});
    big.o.moreLakes = moreLakes;
    const w50 = await fetch('../vendor/countries-50m.json').then((r) => r.json());
    state.w50 = w50;
    state.land50 = topojson.feature(w50, w50.objects.land);
    state.coast50 = WC.pressure(topojson.mesh(w50, w50.objects.land)).map(pathDeg);
    state.borders50 = pathDeg(topojson.mesh(w50, w50.objects.countries, (a, b) => a !== b));
    state.feats = featsFor(w50);
    state.travel = Object.values(state.feats);
    // the Flights globe draws the places it closes in on from the finer drawing
    big.o.hi = { land: state.land50, travel: { type: 'FeatureCollection', features: state.travel }, borders: topojson.mesh(w50, w50.objects.countries, (a, b) => a !== b) };
    const isos = new Set(Object.values(ISO));
    const id3 = (g) => String(g.id).padStart(3, '0');
    state.seams = topojson.mesh(w50, w50.objects.countries, (a, b) => a !== b && isos.has(id3(a)) && isos.has(id3(b)));
    queueDraw();
    await reliefReady;
    await lakesReady;
    paintBase();
  }

  let worldReady = () => {};
  const world110 = new Promise((r) => { worldReady = r; });

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
      Promise.all([document.fonts.load('italic 400 15px "Alegreya Sans"'), document.fonts.load('500 12px "Alegreya Sans"'), document.fonts.load('700 12px "Alegreya Sans"'), document.fonts.load('500 12px "Noto Sans TC"', '台灣')])
        .then(() => { fontsReady = true; sprites.clear(); measurePins(); state.settle = 4; queueDraw(); })
        .catch(() => { fontsReady = true; queueDraw(); });
    } else fontsReady = true;

    const want = parse(location.hash);
    let first = false;
    try { first = !sessionStorage.getItem('wc-opened'); sessionStorage.setItem('wc-opened', '1'); } catch (e) { first = false; }
    // ?opening in the address plays it every time, for review; ?opening=corridor plays the corridor trial
    if (ask.has('opening')) first = true;
    const openingKind = ask.has('opening') ? (['corridor', 'classic', 'scroll'].includes(ask.get('opening')) ? ask.get('opening') : 'scroll') : OPENING_DEFAULT;
    const playOpening = first && !reduce.matches && !want.page && !want.photo && !want.flights;
    const opener = $('#opener');
    const oc = $('#opening');
    if (playOpening) {
      app.classList.add('is-opening');
      // the paper covers the map at once, so the map is never seen before the photograph
      oc.hidden = false;
      opener.className = 'opener';
    }
    let corridor = null;
    const hint = $('#scrollhint');
    const restOpening = () => { shelf.on = false; app.classList.remove('is-opening', 'is-shelf'); oc.hidden = true; opener.className = 'sr'; hint.classList.remove('is-on'); if (corridor) corridor.clear(); queueDraw(); };
    /* the scroll trial: once the photograph is up, the opening plays as far as the wheel, a finger,
       or the keys (space, the arrows, page down) have scrolled, forward or back, about five windows'
       height for the whole of it (slowed at his word, 2026-10-03: the map came too fast), the way noomoagency.com's pages come with the scroll. Until it
       has played out the map takes no input of its own. A click or Enter plays the rest */
    /* the scroll trial, as he wants it (2026-10-03): two scrolls, each setting off a piece of the
       opening that then plays by itself. The first (the wheel, a finger, space, an arrow, a click)
       starts the map developing out of the photograph and the books flying to their places
       (STAGE, on time); the second, once they have landed, sets the flights flying. Until then the
       map takes no input of its own */
    const STAGE = 2800;
    const slide = { on: false, live: false, p: 0, at: 0, go: false, touchY: null };
    const startSlide = () => {
      slide.on = true;
      // the books stand on their shelf under the name from the start
      shelf.on = true; shelf.p = 0;
      shelf.titleY = state.H * (narrow.matches ? 0.2 : 0.24); shelf.titleH = opener.offsetHeight;
      app.classList.add('is-shelf');
      queueDraw();
      // a scroll (down) or a press: the first starts the books, the second the flights
      const nudge = () => {
        if (!slide.live) return;
        if (!slide.at) slide.at = performance.now();
        else if (slide.p >= 1) slide.go = true;
      };
      const stop = (e) => { e.preventDefault(); e.stopPropagation(); };
      const onWheel = (e) => { if (!slide.on) return; stop(e); if (e.deltaY > 0) nudge(); };
      const onTouchStart = (e) => { if (!slide.on) return; slide.touchY = e.touches[0].clientY; };
      const onTouchMove = (e) => { if (!slide.on || slide.touchY == null) return; stop(e); if (slide.touchY - e.touches[0].clientY > 24) { nudge(); slide.touchY = null; } };
      const onTouchEnd = () => { slide.touchY = null; };
      const onKey = (e) => {
        if (!slide.on) return;
        if ([' ', 'ArrowDown', 'PageDown', 'Enter', 'End'].includes(e.key)) { stop(e); nudge(); }
      };
      const onDown = (e) => { if (!slide.on || e.pointerType !== 'mouse') return; nudge(); };
      const opts = { capture: true, passive: false };
      window.addEventListener('wheel', onWheel, opts);
      window.addEventListener('touchstart', onTouchStart, { capture: true, passive: true });
      window.addEventListener('touchmove', onTouchMove, opts);
      window.addEventListener('touchend', onTouchEnd, { capture: true, passive: true });
      window.addEventListener('keydown', onKey, opts);
      window.addEventListener('pointerdown', onDown, { capture: true, passive: true });
      slide.off = () => {
        window.removeEventListener('wheel', onWheel, opts);
        window.removeEventListener('touchstart', onTouchStart, { capture: true });
        window.removeEventListener('touchmove', onTouchMove, opts);
        window.removeEventListener('touchend', onTouchEnd, { capture: true });
        window.removeEventListener('keydown', onKey, opts);
        window.removeEventListener('pointerdown', onDown, { capture: true });
      };
    };
    // every frame of the opening: how far the first piece has played (0 to 1)
    const slideFrame = (live) => {
      if (!slide.on) return 1;
      slide.live = !!live;
      shelf.titleY = state.H * (narrow.matches ? 0.2 : 0.24); shelf.titleH = opener.offsetHeight;
      if (slide.at) slide.p = reduce.matches ? 1 : easeInOut(clamp((performance.now() - slide.at) / STAGE, 0, 1));
      // the word at the foot: before the first scroll, and again once the books have landed
      hint.classList.toggle('is-on', slide.live && (!slide.at || (slide.p >= 1 && !slide.go)));
      if (shelf.on && shelf.p !== slide.p) { shelf.p = slide.p; queueDraw(); }
      return slide.p;
    };
    // the second scroll has come: the flights may fly, and the map takes its own input
    const slideGo = () => {
      if (!slide.go) return false;
      slide.on = false; slide.off();
      hint.classList.remove('is-on');
      return true;
    };
    const loading = loadWorld();
    if (playOpening) {
      // the name waits for its typeface (never more than a moment), so it never changes face mid-motion
      const faces = document.fonts && document.fonts.load
        ? Promise.race([Promise.all([document.fonts.load('400 48px "Alegreya"', T.en.names[nameN]), document.fonts.load('500 48px "Noto Serif TC"', T.zh.names[nameN] + '陳亮元'), document.fonts.load('500 12px "Alegreya Sans"')]), new Promise((r) => setTimeout(r, 1500))]).catch(() => {})
        : Promise.resolve();
      // the corridor trial: its prints are fetched and decoded while the world loads
      if (openingKind === 'corridor') corridor = WC.corridor({ root: $('#corridor'), slides: S.slides, narrow: narrow.matches, src: (s) => imgSrc(s, 640) });
      Promise.all([world110, faces, corridor && corridor.ready]).then(() => {
        if (page || flightsOpen) { restOpening(); globe.start(); return; }
        if (openingKind === 'scroll') startSlide();
        opening = WC.opening({
          canvas: oc, title: opener, flights, home: FROM, LON0, SY, corridor,
          slide: openingKind === 'scroll' ? slideFrame : null,
          go: openingKind === 'scroll' ? slideGo : null,
          shelf: openingKind === 'scroll' ? { draw: drawShelf, titleY: () => shelf.titleY } : null,
          backdrop: ocean ? (g, el, until) => ocean.backdrop(g, el, until) : null,
          // the photograph stands until the painting beneath and its own copy are in
          ready: () => !!state.base && (!ocean || ocean.ready()),
          target: () => {
            const z = state.z;
            return { scale: (z.k * state.S0 * 180) / Math.PI, translate: [z.x + (z.k * state.W) / 2, z.y + (z.k * state.H) / 2] };
          },
          // as the name and the flights fade, the books and the margins come back
          onClear: () => { shelf.on = false; app.classList.remove('is-opening', 'is-shelf'); state.leadIn = performance.now(); queueDraw(); app.classList.add('is-arrived'); setTimeout(() => app.classList.remove('is-arrived'), 1300); if (!page && !flightsOpen) globe.start(); },
          onDone: () => { opener.className = 'sr'; },
        });
        WC.op = opening; // for inspection in the console
        // skipped by any hand: the timed opening at once; the scroll trial only once the sheet is up
        const skip = (e) => {
          if (!opening || opening.done) return;
          if (opening.sliding) { window.addEventListener(e.type, skip, { once: true, passive: true }); return; }
          opening.skip();
        };
        ['pointerdown', 'wheel', 'keydown', 'touchmove'].forEach((ev) => window.addEventListener(ev, skip, { once: true, passive: true }));
      });
      loading.catch(() => restOpening());
    } else {
      loading.then(() => { if (!page && !flightsOpen) globe.start(); }).catch(() => {});
    }

    // a page or photograph named in the address opens directly
    if (want.page || want.photo || want.flights) {
      // an older address (#place-usa) is rewritten as its book's own (#place-new-york)
      const href = want.page && !want.photo ? `${location.pathname}${location.search}#${want.page}` : location.href;
      try { history.replaceState({ wc: false, page: want.page, photo: want.photo, flights: !!want.flights }, '', href); } catch (e) { /* fine */ }
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
        if (flightsOpen) sizeBig();
        const b = baseXY([c[1], c[0]]);
        state.z = d3.zoomIdentity.translate(state.W / 2 - b[0] * k, state.H / 2 - b[1] * k).scale(k);
        sel.call(zoom.transform, state.z);
        state.settle = 4;
        queueDraw();
      });
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) { globe.stop(); big.stop(); } else if (flightsOpen) big.start(); else if (!page) globe.start(); });
    updateZoomButtons();
  }
  WC.state = state; // for inspection in the console
  WC.big = big;
  start();
})();

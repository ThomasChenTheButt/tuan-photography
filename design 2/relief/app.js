/* tuan photography 陳亮元 · design 2 · "Swiss relief"
   The world's real terrain, shaded by hand in the Swiss manner, in daylight. The relief is
   coloured once in a worker (relief-worker.js) into an offscreen plate and only moved after
   that; when the map comes close, squares of the 10800px hillshade are coloured the same way
   and laid over it, so the mountains sharpen as you descend. Design 1's books stand at the
   sixteen places. Choosing one descends into the spot, a fine ring tightens on it, and the
   cover photograph rises out of the terrain through a wide feathered opening. A small relief
   globe in the corner keeps the flights; on a first visit it opens large, scatters them, and
   unrolls into the map. */
(() => {
  'use strict';

  const S = window.SITE;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = matchMedia('(max-width: 47.99rem)');
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // the data keeps a few typographic dashes (a date range, a price range); the page shows none
  const clean = (s) => String(s ?? '').replace(/(\d)\s*[–—]\s*(\d)/g, '$1-$2').replace(/\s+[–—]\s+/g, ', ').replace(/[–—]/g, '-');
  const RAD = Math.PI / 180;
  const SOFT = 'cubic-bezier(0.45, 0, 0.25, 1)';
  const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const expOut = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));

  /* ------------------------------------------------------------ words */

  const T = {
    en: {
      ig: 'Instagram',
      plateTitle: 'Places travelled',
      plateLine: 'Choose a place: the map descends into its photographs.',
      mapLabel: 'Relief map of the places travelled',
      mapHint: 'Drag or use the arrow keys to move the map. Scroll, or press plus and minus, to zoom. Tab moves through the books.',
      siteLabel: 'Site', langLabel: 'Language',
      zoomGroup: 'Map controls', zoomIn: 'Zoom in', zoomOut: 'Zoom out', zoomAll: 'Whole map',
      credit: 'Relief: Natural Earth',
      flights: 'Flights', replay: 'Flights: play them again',
      skip: 'Skip',
      indexTab: 'Photographs', indexTitle: 'Index of photographs',
      count: (n, p) => `${n} photographs from ${p} places`,
      nPhotos: (n) => (n === 1 ? '1 photograph' : `${n} photographs`),
      openIndex: 'Open the index of photographs', closeIndex: 'Close the index',
      seePhotos: 'See the photographs',
      coverOf: (p) => `${p}: descend to this photograph`,
      dive: (p) => `${p}: descend into the map`,
      prev: 'Previous', next: 'Next',
      camera: 'Camera', lens: 'Lens', focal: 'Focal length', aperture: 'Aperture', shutter: 'Shutter', iso: 'ISO',
      ofN: (i, n) => `${i} of ${n}`,
      made: (p) => `${p}: how this was made`,
      opening: (p) => `${p} is open.`,
      endLine: 'Every photograph here is his own, made on the trip.',
      seas: { pacific: 'Pacific Ocean', indian: 'Indian Ocean', atlantic: 'Atlantic Ocean' },
    },
    zh: {
      ig: 'Instagram',
      plateTitle: '走過的地方',
      plateLine: '選一個地方，地圖會一路降落到它的照片裡。',
      mapLabel: '走過的地方，地形地圖',
      mapHint: '拖曳或用方向鍵移動地圖；捲動，或按加號、減號縮放。Tab 鍵逐一走過每本書。',
      siteLabel: '網站', langLabel: '語言',
      zoomGroup: '地圖控制', zoomIn: '放大', zoomOut: '縮小', zoomAll: '整張地圖',
      credit: '地形：Natural Earth',
      flights: '飛過的航線', replay: '飛過的航線：再播一次',
      skip: '略過',
      indexTab: '作品', indexTitle: '照片索引',
      count: (n, p) => `${p} 個地方，${n} 張照片`,
      nPhotos: (n) => `${n} 張照片`,
      openIndex: '打開照片索引', closeIndex: '收起照片索引',
      seePhotos: '看照片',
      coverOf: (p) => `${p}：降落到這張照片`,
      dive: (p) => `${p}：降落到地圖裡`,
      prev: '上一張', next: '下一張',
      camera: '相機', lens: '鏡頭', focal: '焦距', aperture: '光圈', shutter: '快門', iso: 'ISO',
      ofN: (i, n) => `第 ${i} 張，共 ${n} 張`,
      made: (p) => `${p}：這張怎麼拍`,
      opening: (p) => `已打開 ${p}。`,
      endLine: '這裡每張照片都是他自己在旅途中拍的。',
      seas: { pacific: '太平洋', indian: '印度洋', atlantic: '大西洋' },
    },
  };

  let lang = 'en';
  try {
    const q = new URLSearchParams(location.search).get('lang');
    const saved = localStorage.getItem('tlap-lang');
    if (q === 'zh' || q === 'en') lang = q;
    else if (saved === 'zh' || saved === 'en') lang = saved;
  } catch (e) { /* storage blocked: stay in English */ }

  const t = (k, ...a) => {
    const v = T[lang][k] !== undefined ? T[lang][k] : (S.i18n[lang][k] !== undefined ? S.i18n[lang][k] : k);
    return typeof v === 'function' ? v(...a) : v;
  };
  const L = (o) => clean(o ? (o[lang] !== undefined ? o[lang] : o.en) : '');

  /* ------------------------------------------------------------ data */

  const countries = Object.fromEntries(S.countries.map((c) => [c.id, c]));
  const books = S.books.map((b) => ({ ...b, view: b.guide ? `guide-${b.guide}` : `place-${b.country}` }));
  const bookByCountry = Object.fromEntries(books.map((b) => [b.country, b]));
  const guide = S.guides.barcelona;
  const order = books.map((b) => countries[b.country]).filter(Boolean);
  const placeLL = (cid) => (cid === guide.country ? guide.ll : countries[cid].ll);
  const photosOf = (cid) => countries[cid].photos.filter((id) => S.slides[id]);
  const indexOrder = order.flatMap((c) => photosOf(c.id));
  const coverOf = (cid, pick) => {
    if (pick && S.slides[pick]) return pick;
    const b = bookByCountry[cid];
    return b.photo || photosOf(cid)[0] || null;
  };
  const coords = ([lat, lng]) => `${Math.abs(lat).toFixed(3)}°${lat >= 0 ? 'N' : 'S'} · ${Math.abs(lng).toFixed(3)}°${lng >= 0 ? 'E' : 'W'}`;
  const nameParts = (cid) => {
    const title = L(bookByCountry[cid].title), name = L(countries[cid].name);
    if (title === name || name.includes(title)) return [name];
    return [title, name];
  };
  const nameHTML = (cid) => nameParts(cid).map(esc).join(`<i>${lang === 'zh' ? '｜' : '|'}</i>`);
  const imgSrc = (s, size) => `../images/web/${size ? size + '/' : ''}${s.file}`;
  const srcset = (s) => `${imgSrc(s, 640)} 640w, ${imgSrc(s, 1280)} 1280w, ${imgSrc(s)} ${s.w}w`;
  const ISO = { spain: '724', uk: '826', france: '250', germany: '276', switzerland: '756', taiwan: '158', japan: '392', 'south-korea': '410', 'hong-kong': '344', china: '156', singapore: '702', vietnam: '704', dubai: '784', australia: '036', 'new-zealand': '554', usa: '840' };

  /* ------------------------------------------------------------ elements */

  const html = document.documentElement;
  const body = document.body;
  const atlas = $('#atlas');
  const mapEl = $('#map');
  const canvas = $('#plate');
  const ctx = canvas.getContext('2d');
  const ringsEl = $('#rings');
  const pinsEl = $('#pins');
  const indexEl = $('#index');
  const indexTab = $('#index-tab');
  const indexBody = $('#index-body');
  const indexScroll = $('#index-scroll');
  const leaf = $('#leaf');
  const leafScroll = $('#leaf-scroll');
  const leafContent = $('#leaf-content');
  const cover = $('#cover');
  const coverCap = $('#cover-cap');
  const coverImg = document.createElement('img');
  coverImg.alt = ''; coverImg.decoding = 'async';
  const viewer = $('#viewer');
  const live = $('#live');
  const SVGNS = 'http://www.w3.org/2000/svg';

  /* ------------------------------------------------------------ the plate: projection */

  const CENTER = 48; // the plate's central meridian, so every place from New York to Queenstown sits on one sheet
  const state = {
    W: 1, H: 1, dpr: 1, S0: 1, z: d3.zoomIdentity, kHome: 1,
    base: null, base2: null, baseFailed: false,
    feats110: {}, feats50: {}, land110: null, labels: {},
    drawQueued: false, settle: 0,
    before: null, photoPts: [],
  };
  const proj0 = d3.geoEquirectangular().rotate([-CENTER, 0]).precision(0.4);
  const proj = d3.geoEquirectangular().rotate([-CENTER, 0]).precision(0.4);
  const path = d3.geoPath(proj, ctx);

  // unwrapped plate coordinates: a longitude may run past 180 to draw the raster's second copy
  const X = (lon) => state.z.applyX(state.W / 2 + state.S0 * (lon - CENTER) * RAD);
  const Y = (lat) => state.z.applyY(state.H / 2 - state.S0 * lat * RAD);
  // a place on the screen (inside the map)
  const P = (ll) => { const p = proj0([ll[1], ll[0]]); return [state.z.applyX(p[0]), state.z.applyY(p[1])]; };

  const zoom = d3.zoom()
    .scaleExtent([1, 22])
    .on('start', (e) => { if (e.sourceEvent && e.sourceEvent.type !== 'wheel') mapEl.classList.add('is-dragging'); })
    .on('zoom', (e) => { state.z = e.transform; state.settle = 6; queueDraw(); updateZoomButtons(); })
    .on('end', () => mapEl.classList.remove('is-dragging'));
  const sel = d3.select(mapEl);

  function sizeMap() {
    const r = mapEl.getBoundingClientRect();
    state.W = Math.max(1, r.width); state.H = Math.max(1, r.height);
    state.dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(state.W * state.dpr);
    canvas.height = Math.round(state.H * state.dpr);
    state.S0 = state.W / (2 * Math.PI);
    proj0.scale(state.S0).translate([state.W / 2, state.H / 2]);
    const { W, H, S0 } = state;
    zoom.extent([[0, 0], [W, H]]).translateExtent([[W / 2 - S0 * Math.PI, H / 2 - S0 * Math.PI / 2], [W / 2 + S0 * Math.PI, H / 2 + S0 * Math.PI / 2]]);
    ringsEl.setAttribute('viewBox', `0 0 ${W} ${H}`);
    state.kHome = homeTransform().k;
  }

  /* ------------------------------------------------------------ the plate: drawing */

  const INK = (a) => `rgba(58, 50, 44, ${a})`;
  const BORDER = 'rgba(122, 48, 62, 0.78)';
  const BAND = 'rgba(176, 72, 84, 0.13)';
  const GRAT = 'rgba(66, 98, 116, 0.13)';
  const SEA_INK = 'rgb(66, 101, 118)';
  const HALO = 'rgba(249, 247, 241, 0.78)';
  const PAPER = 'rgb(244, 241, 234)';
  const SEA = 'rgb(214, 229, 233)';
  const FACE = '"Alegreya Sans", "Noto Sans TC", sans-serif';
  const FACE_ZH = '"Noto Serif TC", "Noto Sans TC", serif';

  const SEAS = [
    { id: 'pacific', ll: [12, -150] }, { id: 'pacific', ll: [12, 152] },
    { id: 'indian', ll: [-24, 80] },
    { id: 'atlantic', ll: [22, -42] },
  ];

  const devPerDeg = () => state.S0 * state.z.k * RAD * state.dpr;

  function draw() {
    state.drawQueued = false;
    const { W, H, dpr, z, S0 } = state;
    const k = z.k;
    proj.scale(S0 * k).translate([z.x + k * W / 2, z.y + k * H / 2]).clipExtent([[-40, -40], [W + 40, H + 40]]);
    const fine = k > 5 && state.feats50.usa;
    const feats = fine ? state.feats50 : state.feats110;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, W, H);

    // the sheet: the world's rectangle on the paper
    const wx0 = X(CENTER - 180), wx1 = X(CENTER + 180), wy0 = Y(90), wy1 = Y(-90);
    ctx.save();
    ctx.beginPath(); ctx.rect(wx0, wy0, wx1 - wx0, wy1 - wy0); ctx.clip();
    ctx.fillStyle = SEA; ctx.fillRect(wx0, wy0, wx1 - wx0, wy1 - wy0);

    // the coloured relief: drawn, never re-coloured. Twice, so the sheet wraps at its edges
    const dpd = devPerDeg();
    const src = state.base && (dpd < 7.5 && state.base2 ? state.base2 : state.base);
    if (src) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      const w = X(180) - X(-180), h = Y(-90) - Y(90);
      for (const off of [0, 360]) {
        const x = X(-180 + off);
        if (x > W || x + w < 0) continue;
        ctx.drawImage(src, x, Y(90), w, h);
      }
      if (dpd > 13 && state.base) drawTiles(dpd);
    } else if (state.land110) {
      // the relief has not arrived (or could not): plain land, so the map still works
      ctx.beginPath(); path(state.land110);
      ctx.fillStyle = 'rgb(214, 216, 196)'; ctx.fill();
    }

    // a fine graticule: every 10° at the scale of the whole world, every 5° and then every degree closer in
    const step = k < 3.2 ? 10 : (k < 14 ? 5 : 1);
    ctx.strokeStyle = GRAT; ctx.lineWidth = 0.55;
    ctx.beginPath();
    for (let lon = -180; lon < 540; lon += step) {
      const x = X(lon);
      if (x < -1 || x > W + 1) continue;
      ctx.moveTo(x, Math.max(0, wy0)); ctx.lineTo(x, Math.min(H, wy1));
    }
    for (let lat = -90 + step; lat < 90; lat += step) {
      const y = Y(lat);
      if (y < -1 || y > H + 1) continue;
      ctx.moveTo(Math.max(0, wx0), y); ctx.lineTo(Math.min(W, wx1), y);
    }
    ctx.stroke();
    if (k < 3.2) {
      // the equator and the tropics a touch firmer
      ctx.strokeStyle = 'rgba(66, 98, 116, 0.26)'; ctx.beginPath();
      const y = Y(0); ctx.moveTo(Math.max(0, wx0), y); ctx.lineTo(Math.min(W, wx1), y); ctx.stroke();
    }

    // the sixteen countries travelled: a soft madder band inside a hairline border, as Swiss atlases edge a state
    const band = clamp(2.2 + k * 0.3, 2.5, 4.5);
    for (const c of S.countries) {
      const f = feats[c.id];
      if (!f) continue;
      ctx.save();
      ctx.beginPath(); path(f);
      ctx.clip();
      ctx.lineJoin = 'round';
      ctx.lineWidth = band * 2;
      ctx.strokeStyle = activeCountry() === c.id ? 'rgba(176, 72, 84, 0.3)' : BAND;
      ctx.stroke();
      ctx.restore();
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = BORDER;
      ctx.stroke();
    }
    ctx.restore();

    // the neat line round the sheet, where the paper shows
    ctx.strokeStyle = INK(0.55); ctx.lineWidth = 0.8;
    if (wy0 > 0 || wy1 < H || wx0 > 0 || wx1 < W) ctx.strokeRect(wx0 - 4.5, wy0 - 4.5, wx1 - wx0 + 9, wy1 - wy0 + 9);

    // oceans, in spaced italic capitals, fading as you come close
    const seaAlpha = clamp((state.kHome * 3 - k) / (state.kHome * 1.4), 0, 1);
    if (seaAlpha > 0) {
      const zh = lang === 'zh';
      ctx.font = zh ? `500 13px ${FACE_ZH}` : `italic 400 13px ${FACE}`;
      for (const s of SEAS) {
        const p = P(s.ll);
        if (p[0] < -200 || p[0] > W + 200 || p[1] < -40 || p[1] > H + 40) continue;
        const label = zh ? T.zh.seas[s.id] : T.en.seas[s.id].toUpperCase();
        spaced(label, p[0], p[1], zh ? 7 : 4.2, `rgba(66, 101, 118, ${0.95 * seaAlpha})`, `rgba(226, 237, 239, ${0.7 * seaAlpha})`);
      }
    }

    // books first (their places on the sheet), then the country names around them
    layoutPins();
    drawNames(feats);

    // where each photograph was made, once close enough to tell them apart
    const close = S0 * k * RAD > 26;
    state.photoPts = [];
    if (close) {
      for (const id of indexOrder) {
        const s = S.slides[id];
        const p = P(s.ll);
        if (p[0] < -10 || p[1] < -10 || p[0] > W + 10 || p[1] > H + 10) continue;
        state.photoPts.push({ id, p });
        ctx.beginPath(); ctx.arc(p[0], p[1], 3.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 253, 248, 0.95)'; ctx.fill();
        ctx.lineWidth = 1; ctx.strokeStyle = INK(0.85); ctx.stroke();
      }
    }

    // leaders from a book that had to step aside, then each place's sign, as an atlas marks a town
    if (!diving) {
      ctx.lineWidth = 0.75; ctx.strokeStyle = INK(0.6);
      for (const b of pinList) {
        if (Math.hypot(b.x - b.ax, b.y - b.ay) > 6) { ctx.beginPath(); ctx.moveTo(b.ax, b.ay); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      }
    }
    for (const b of pinList) {
      ctx.beginPath(); ctx.arc(b.ax, b.ay, 3.8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgb(255, 253, 248)'; ctx.fill();
      ctx.lineWidth = 1.3; ctx.strokeStyle = INK(0.9); ctx.stroke();
      ctx.beginPath(); ctx.arc(b.ax, b.ay, 1.35, 0, Math.PI * 2); ctx.fillStyle = INK(0.9); ctx.fill();
    }

    placeRings();
    if (state.settle > 0) { state.settle -= 1; queueDraw(); }
  }

  // a word set letter by letter with even spacing, centred on x, with a paper halo
  function spaced(text, x, y, gap, fill, halo) {
    const chars = Array.from(text);
    const ws = chars.map((c) => ctx.measureText(c).width);
    const total = ws.reduce((a, b) => a + b, 0) + gap * (chars.length - 1);
    let cx = x - total / 2;
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.lineJoin = 'round';
    if (halo) {
      ctx.lineWidth = 3; ctx.strokeStyle = halo;
      let hx = cx;
      chars.forEach((c, i) => { if (c !== ' ') ctx.strokeText(c, hx, y); hx += ws[i] + gap; });
    }
    ctx.fillStyle = fill;
    chars.forEach((c, i) => { if (c !== ' ') ctx.fillText(c, cx, y); cx += ws[i] + gap; });
    return total;
  }

  // the countries' names, letter-spaced across the land where they fit; the books' rects are kept clear
  function drawNames(feats) {
    const zh = lang === 'zh';
    const taken = pinList.map((p) => [p.x - p.bw / 2 - 2, p.y - p.bh - 4, p.x + p.bw / 2 + 2, p.y + 4]);
    // the labels of the books, beneath them
    for (const p of pinList) if (!p.el.classList.contains('is-quiet')) taken.push([p.x - p.lw / 2, p.y + 4, p.x + p.lw / 2, p.y + 20]);
    const list = S.countries.map((c) => ({ c, g: state.labels[c.id] })).filter((o) => o.g).sort((a, b) => b.g.area - a.g.area);
    for (const { c, g } of list) {
      const a = P([g.ll[0], g.ll[1]]);
      const w = g.span * state.S0 * state.z.k * RAD; // the land's width on screen
      if (a[0] < -w || a[0] > state.W + w || a[1] < -40 || a[1] > state.H + 40) continue;
      const nm = L(c.name).split('·')[0].trim();
      const label = zh ? nm : nm.toUpperCase();
      const size = clamp(9.5 + w / 70, 10.5, zh ? 17 : 16);
      ctx.font = zh ? `500 ${size}px ${FACE_ZH}` : `500 ${size}px ${FACE}`;
      const n = Array.from(label).length;
      const natural = ctx.measureText(label).width;
      const minGap = size * (zh ? 0.3 : 0.16);
      if (natural + minGap * (n - 1) > w * 0.92) continue; // it does not fit the land yet
      const gap = clamp((w * 0.6 - natural) / Math.max(1, n - 1), minGap, size * (zh ? 1.4 : 1.1));
      const total = natural + gap * (n - 1);
      const r = [a[0] - total / 2 - 2, a[1] - size / 2 - 2, a[0] + total / 2 + 2, a[1] + size / 2 + 2];
      if (r[0] < 8 || r[2] > state.W - 8 || r[1] < 8 || r[3] > state.H - 8) continue;
      if (taken.some((q) => r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1])) continue;
      taken.push(r);
      const alpha = clamp((w * 0.92 - natural) / 40, 0, 1);
      spaced(label, a[0], a[1], gap, `rgba(74, 58, 54, ${0.92 * alpha})`, `rgba(250, 248, 242, ${0.62 * alpha})`);
    }
  }

  function queueDraw() {
    if (state.drawQueued) return;
    state.drawQueued = true;
    requestAnimationFrame(draw);
  }

  /* ------------------------------------------------------------ the relief: coloured once, off the main thread */

  let worker = null;
  async function loadRelief() {
    const pull = (src) => new Promise((res, rej) => {
      const im = new Image();
      im.decoding = 'async';
      im.onload = () => res(im);
      im.onerror = rej;
      im.src = src;
    });
    const [g, s] = await Promise.all([pull('../vendor/relief/GRAY_50M_SR_OB-4096.jpg'), pull('../vendor/relief/SR_50M-4096.jpg')]);
    const w = 4096, h = 2048;
    const read = (im) => {
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const cx = c.getContext('2d', { willReadFrequently: true });
      cx.drawImage(im, 0, 0, w, h);
      return cx.getImageData(0, 0, w, h).data;
    };
    const gray = read(g), shade = read(s);
    worker = new Worker('relief-worker.js');
    const rgba = await new Promise((res, rej) => {
      worker.onmessage = (e) => { if (e.data.type === 'base') res(e.data.rgba); };
      worker.onerror = rej;
      worker.postMessage({ type: 'base', gray: gray.buffer, shade: shade.buffer }, [gray.buffer, shade.buffer]);
    });
    worker.onmessage = onTile;
    const plate = document.createElement('canvas');
    plate.width = w; plate.height = h;
    plate.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(rgba), w, h), 0, 0);
    // a half-size copy for the whole-world view, so the far view stays smooth rather than shimmering
    const half = document.createElement('canvas');
    half.width = w / 2; half.height = h / 2;
    const hc = half.getContext('2d');
    hc.imageSmoothingQuality = 'high';
    hc.drawImage(plate, 0, 0, w / 2, h / 2);
    state.base = plate; state.base2 = half;
    try {
      state.base = await createImageBitmap(plate);
      state.base2 = await createImageBitmap(half);
    } catch (e) { /* canvases draw as well */ }
    state.plateCanvas = plate;
  }

  /* the 10800 hillshade in 1350px squares, coloured on demand and kept for a while */
  const TILE = 1350, COLS = 8, ROWS = 4;
  const tiles = new Map();
  let tileQueue = [], tileBusy = 0;
  function tileVisible(c, r, off) {
    const x0 = X(-180 + c * 45 + off), x1 = X(-180 + (c + 1) * 45 + off);
    const y0 = Y(90 - r * 45), y1 = Y(90 - (r + 1) * 45);
    return x1 > 0 && x0 < state.W && y1 > 0 && y0 < state.H ? [x0, y0, x1 - x0, y1 - y0] : null;
  }
  function drawTiles() {
    const now = performance.now();
    let fading = false;
    const want = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) for (const off of [0, 360]) {
      const box = tileVisible(c, r, off);
      if (!box) continue;
      const id = `${c}-${r}`;
      const tl = tiles.get(id);
      if (tl && tl.bmp) {
        const a = Math.min(1, (now - tl.t0) / 500);
        if (a < 1) fading = true;
        tl.used = now;
        ctx.globalAlpha = a;
        ctx.drawImage(tl.bmp, box[0], box[1], box[2] + 0.6, box[3] + 0.6);
        ctx.globalAlpha = 1;
      } else if (!tl) want.push(id);
    }
    want.forEach(requestTile);
    if (fading) { state.settle = Math.max(state.settle, 2); }
  }
  function requestTile(id) {
    if (tiles.has(id) || !worker) return;
    tiles.set(id, { state: 'queued', bmp: null, t0: 0, used: performance.now() });
    tileQueue.push(id);
    pumpTiles();
  }
  function pumpTiles() {
    while (tileBusy < 2 && tileQueue.length) {
      const id = tileQueue.shift();
      tileBusy += 1;
      const im = new Image();
      im.decoding = 'async';
      im.onload = () => {
        const c = document.createElement('canvas');
        c.width = TILE; c.height = TILE;
        const cx = c.getContext('2d', { willReadFrequently: true });
        cx.drawImage(im, 0, 0);
        const px = cx.getImageData(0, 0, TILE, TILE).data;
        const [col, row] = id.split('-').map(Number);
        worker.postMessage({ type: 'tile', id, px: px.buffer, x0: col * TILE, y0: row * TILE, size: TILE }, [px.buffer]);
      };
      im.onerror = () => { tileBusy -= 1; tiles.delete(id); pumpTiles(); };
      im.src = `tiles/sr-${id}.jpg`;
    }
  }
  async function onTile(e) {
    const m = e.data;
    if (m.type !== 'tile') return;
    tileBusy -= 1;
    const tl = tiles.get(m.id);
    if (tl) {
      const c = document.createElement('canvas');
      c.width = TILE; c.height = TILE;
      c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(m.rgba), TILE, TILE), 0, 0);
      let bmp = c;
      try { bmp = await createImageBitmap(c); } catch (err) { /* the canvas will do */ }
      tl.bmp = bmp; tl.t0 = performance.now(); tl.state = 'ready';
      // keep at most a dozen squares; the oldest unused one goes
      const ready = [...tiles.entries()].filter(([, v]) => v.bmp);
      if (ready.length > 12) {
        ready.sort((a, b) => a[1].used - b[1].used);
        const [oid, old] = ready[0];
        if (old.bmp && old.bmp.close) old.bmp.close();
        tiles.delete(oid);
      }
      state.settle = Math.max(state.settle, 32);
      queueDraw();
    }
    pumpTiles();
  }
  // the squares a view will need, asked for before the map gets there
  function prefetchTiles(z) {
    if (!worker) return;
    const k = z.k;
    if (state.S0 * k * RAD * state.dpr <= 13) return;
    const inv = (sx, sy) => {
      const px = (sx - z.x) / k, py = (sy - z.y) / k;
      return [CENTER + (px - state.W / 2) / state.S0 / RAD, (state.H / 2 - py) / state.S0 / RAD];
    };
    const a = inv(0, 0), b = inv(state.W, state.H);
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const lon0 = -180 + c * 45, lat0 = 90 - r * 45;
      for (const off of [0, 360]) {
        if (lon0 + off < b[0] && lon0 + 45 + off > a[0] && lat0 > b[1] && lat0 - 45 < a[1]) requestTile(`${c}-${r}`);
      }
    }
  }

  /* ------------------------------------------------------------ zoom and pan */

  sel.call(zoom).on('dblclick.zoom', null);
  mapEl.addEventListener('dblclick', (e) => {
    if (e.target.closest('.book')) return;
    const r = mapEl.getBoundingClientRect();
    sel.transition().duration(reduce.matches ? 0 : 450).ease(d3.easeExpOut).call(zoom.scaleBy, e.shiftKey ? 0.5 : 2, [e.clientX - r.left, e.clientY - r.top]);
  });
  const constrain = (target) => zoom.constrain()(target, [[0, 0], [state.W, state.H]], zoom.translateExtent());
  function moveTo(target, dur = 900, ease = d3.easeExpOut) {
    const transform = constrain(target);
    const d = reduce.matches ? 0 : dur;
    if (d === 0) sel.interrupt().call(zoom.transform, transform);
    else sel.interrupt().transition().duration(d).ease(ease).call(zoom.transform, transform);
    return transform;
  }
  function fitTransform(lls, pad, kMax = 48) {
    const pts = lls.map((ll) => proj0([ll[1], ll[0]]));
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const { W, H } = state;
    const k = clamp(Math.min((W - pad.l - pad.r) / Math.max(1, x1 - x0), (H - pad.t - pad.b) / Math.max(1, y1 - y0)), 1, kMax);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const sx = pad.l + (W - pad.l - pad.r) / 2, sy = pad.t + (H - pad.t - pad.b) / 2;
    return d3.zoomIdentity.translate(sx - cx * k, sy - cy * k).scale(k);
  }
  function homeTransform() {
    const small = narrow.matches;
    const pad = small ? { l: 34, r: 34, t: 150, b: 170 } : { l: 76, r: 96, t: 190, b: 112 };
    // a phone opens on the crowded half of the sheet, Asia and Oceania, where ten of the places are
    const near = small ? order.filter((c) => (c.continent === 'asia' && c.id !== 'dubai') || c.continent === 'oceania') : order;
    return fitTransform(near.map((c) => placeLL(c.id)), pad);
  }
  function centerOn(ll, k, dur) {
    const p = proj0([ll[1], ll[0]]);
    const kk = k || state.z.k;
    moveTo(d3.zoomIdentity.translate(state.W / 2 - p[0] * kk, state.H / 2 - p[1] * kk).scale(kk), dur);
  }
  function inView(ll, margin = 0.15) {
    const p = P(ll);
    const right = indexEl.hidden || narrow.matches ? state.W : state.W - indexEl.offsetWidth;
    return p[0] > right * margin && p[0] < right * (1 - margin) && p[1] > state.H * margin && p[1] < state.H * (1 - margin);
  }
  // the descent's landing: the country filling most of the window, the place itself at the centre
  function diveTransform(cid, ll) {
    const f = state.feats110[cid] || state.feats50[cid];
    let k = 30;
    if (f) {
      const b = d3.geoBounds(f);
      let w = b[1][0] - b[0][0];
      if (w < 0) w += 360;
      const span = Math.min(w, 50);
      const lls = [[b[0][1], ll[1] - span / 2], [b[1][1], ll[1] + span / 2]];
      k = fitTransform(lls, { l: 60, r: 60, t: 80, b: 80 }, 60).k;
    }
    // never past about three times the finest relief, so the terrain stays crisp under the photograph
    k = clamp(k * 0.85, Math.max(3, state.kHome * 2.4), 13);
    const p = proj0([ll[1], ll[0]]);
    return constrain(d3.zoomIdentity.translate(state.W / 2 - p[0] * k, state.H / 2 - p[1] * k).scale(k));
  }
  const spotAt = (ll, z) => { const p = proj0([ll[1], ll[0]]); return [z.applyX(p[0]), z.applyY(p[1])]; };

  const zIn = $('#zoom-in'), zOut = $('#zoom-out'), zAll = $('#zoom-all');
  const zoomBy = (f) => sel.interrupt().transition().duration(reduce.matches ? 0 : 420).ease(d3.easeExpOut).call(zoom.scaleBy, f);
  zIn.addEventListener('click', () => zoomBy(2));
  zOut.addEventListener('click', () => zoomBy(0.5));
  zAll.addEventListener('click', () => moveTo(homeTransform()));
  function updateZoomButtons() {
    zIn.disabled = state.z.k >= 21.9;
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

  /* ------------------------------------------------------------ the books, standing at their places */

  let pinList = [];
  const bookStatus = (b) => {
    if (b.guide) return t('bookOpen');
    const n = photosOf(b.country).length;
    return n ? t('nPhotos', n) : t('bandNone');
  };
  function renderPins() {
    const keep = new Map(pinList.map((p) => [p.id, p]));
    pinsEl.textContent = '';
    pinList = order.map((c, i) => {
      const b = bookByCountry[c.id];
      const title = esc(L(b.title));
      const s = b.photo ? S.slides[b.photo] : null;
      const face = s
        ? `<span class="book__face"><img src="${imgSrc(s, 640)}" alt="" width="${s.w}" height="${s.h}" decoding="async">`
        : `<span class="book__face book__face--blank"><b>${title}</b>`;
      const el = document.createElement('div');
      el.className = 'pin';
      el.dataset.country = c.id;
      el.style.setProperty('--i', i);
      el.innerHTML =
        `<div class="pin__stage"><a class="book book--${b.tone}" href="#${b.view}" aria-label="${esc(`${L(b.title)}: ${bookStatus(b)}`)}" data-view="${b.view}"><span class="book__box">` +
        `<span class="book__spine"><b>${title}</b><i>${esc(t('series'))}</i></span>` +
        `${face}<span class="book__band"><b>${title}</b><span>${esc(t(b.band))}</span></span></span>` +
        `<span class="book__back"><i>${esc(t('series'))}</i></span><span class="book__edge"></span>` +
        `<span class="book__top"></span><span class="book__shadow"></span></span></a></div>` +
        `<div class="pin__label" aria-hidden="true"><b>${title}</b><span>${esc(bookStatus(b))}</span></div>`;
      pinsEl.appendChild(el);
      const prev = keep.get(b.id);
      return { id: b.id, country: c.id, book: b, el, ll: placeLL(c.id), x: prev ? prev.x : NaN, y: prev ? prev.y : NaN, ax: 0, ay: 0, lw: 0, bw: 0, bh: 0 };
    });
    measureLabels();
    bindPins();
  }
  function measureLabels() { for (const p of pinList) p.lw = p.el.querySelector('.pin__label b').offsetWidth + 6; }

  function bookScale() {
    const k = state.z.k / state.kHome;
    const small = narrow.matches;
    const base = small ? 0.15 : 0.235;
    const max = small ? 0.28 : 0.42;
    return clamp(base * Math.pow(k, 0.3), base * 0.8, max);
  }

  function layoutPins() {
    const s = bookScale();
    const small = narrow.matches;
    const bw = 192 * s, bh = 272 * s;
    const below = 20;
    for (const p of pinList) {
      const a = P(p.ll);
      p.ax = a[0]; p.ay = a[1];
      if (Number.isNaN(p.x)) { p.x = p.ax; p.y = p.ay; }
      p.bw = bw; p.bh = bh;
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
    // every book and its name stay inside the window; a leader runs back to the place
    for (const p of pinList) {
      if (p.ax < 0 || p.ax > state.W) continue; // a place off the window keeps its book off it too
      const half = Math.max(bw / 2, p.lw / 2) + 6;
      p.x = clamp(p.x, half, Math.max(half, state.W - half));
    }
    // names that would sit on another book or name stay hidden until their book wakes
    const taken = [];
    for (const p of pinList) {
      const r = [p.x - p.lw / 2, p.y + 5, p.x + p.lw / 2, p.y + 19];
      let free = true;
      for (const q of pinList) {
        if (q === p) continue;
        if (r[0] < q.x + bw / 2 && r[2] > q.x - bw / 2 && r[1] < q.y && r[3] > q.y - bh) { free = false; break; }
      }
      if (free) for (const t2 of taken) if (r[0] < t2[2] && r[2] > t2[0] && r[1] < t2[3] && r[3] > t2[1]) { free = false; break; }
      if (free) taken.push(r);
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
      a.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') setActive({ country: p.country }); });
      a.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') clearActiveSoon(); });
      a.addEventListener('focus', () => {
        if (diving) return;
        setActive({ country: p.country });
        if (!inView(p.ll, 0.08)) centerOn(p.ll, Math.max(state.z.k, state.kHome), 600);
      });
      a.addEventListener('blur', () => clearActiveSoon());
      a.addEventListener('click', (e) => { e.preventDefault(); go(p.book.view); });
    }
  }

  /* ------------------------------------------------------------ the fine ring on the map (never in the index) */

  let active = null; // { country } or { slide }
  let clearTimer = 0;
  const activeCountry = () => (active ? active.country || (active.slide && S.slides[active.slide].country) : null);
  const hoverRing = document.createElementNS(SVGNS, 'circle');
  hoverRing.setAttribute('class', 'ring--hover');
  hoverRing.setAttribute('r', '15');
  ringsEl.appendChild(hoverRing);
  let diveRing = null;

  function setActive(next) {
    if (diving) return;
    clearTimeout(clearTimer);
    if (active && next && active.country === next.country && active.slide === next.slide) return;
    const before = activeCountry();
    active = next;
    const cid = activeCountry();
    pinList.forEach((p) => p.el.classList.toggle('awake', p.country === cid));
    $$('.group.is-awake', indexBody).forEach((g) => g.classList.toggle('is-awake', g.dataset.country === cid));
    const g = cid && indexBody.querySelector(`.group[data-country="${cid}"]`);
    if (g) g.classList.add('is-awake');
    hoverRing.setAttribute('r', next.slide ? '11' : '17');
    hoverRing.classList.add('is-in');
    placeRings();
    if (before !== cid) queueDraw();
  }
  function clearActive() {
    clearTimeout(clearTimer);
    const had = activeCountry();
    active = null;
    hoverRing.classList.remove('is-in');
    pinList.forEach((p) => p.el.classList.remove('awake'));
    $$('.group.is-awake', indexBody).forEach((g) => g.classList.remove('is-awake'));
    $$('.thumb.is-awake', indexBody).forEach((x) => x.classList.remove('is-awake'));
    if (had) queueDraw();
  }
  function clearActiveSoon() { clearTimeout(clearTimer); clearTimer = setTimeout(clearActive, 160); }
  function placeRings() {
    if (active) {
      const ll = active.slide ? S.slides[active.slide].ll : placeLL(active.country);
      const p = P(ll);
      hoverRing.setAttribute('cx', p[0].toFixed(1)); hoverRing.setAttribute('cy', p[1].toFixed(1));
    }
    if (diveRing && diveRing.dataset.ll) {
      const p = P(JSON.parse(diveRing.dataset.ll));
      diveRing.setAttribute('cx', p[0].toFixed(1)); diveRing.setAttribute('cy', p[1].toFixed(1));
    }
  }

  /* hovering the map itself: a photograph's dot, a place, or a travelled country */
  let hoverQueued = false, lastMove = null;
  function hitTest(x, y) {
    let best = null, bd = 11;
    for (const q of state.photoPts) { const d = Math.hypot(q.p[0] - x, q.p[1] - y); if (d < bd) { bd = d; best = q.id; } }
    if (best) return { slide: best };
    for (const p of pinList) if (Math.hypot(p.ax - x, p.ay - y) < 14) return { country: p.country };
    const ll = proj.invert([x, y]);
    if (!ll) return null;
    const feats = state.z.k > 5 && state.feats50.usa ? state.feats50 : state.feats110;
    for (const c of S.countries) { const f = feats[c.id]; if (f && d3.geoContains(f, ll)) return { country: c.id }; }
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
      if (hit) setActive(hit);
      else if (active) clearActiveSoon();
    });
  });
  mapEl.addEventListener('pointerleave', () => { mapEl.classList.remove('is-pointing'); clearActiveSoon(); });
  mapEl.addEventListener('click', (e) => {
    if (e.target.closest('.book') || e.defaultPrevented || diving) return;
    const r = mapEl.getBoundingClientRect();
    const hit = hitTest(e.clientX - r.left, e.clientY - r.top);
    if (!hit) return;
    if (hit.slide) { const s = S.slides[hit.slide]; go(bookByCountry[s.country].view, hit.slide); }
    else go(bookByCountry[hit.country].view);
  });

  /* ------------------------------------------------------------ the index: a slim strip, a drawer on request */

  function renderIndex() {
    $('#index-n').textContent = String(indexOrder.length);
    $('#index-count').textContent = t('count', indexOrder.length, S.countries.length);
    indexBody.innerHTML = order.map((c) => {
      const ids = photosOf(c.id);
      const b = bookByCountry[c.id];
      const thumbs = ids.map((id) => {
        const s = S.slides[id];
        return `<li><button type="button" class="thumb" data-slide="${id}" data-country="${c.id}" aria-label="${esc(t('coverOf', L(s.place)))}"><img src="${imgSrc(s, 640)}" alt="" width="${s.w}" height="${s.h}" loading="lazy" decoding="async"><span class="thumb__name">${esc(L(s.place))}</span></button></li>`;
      }).join('');
      return `<section class="group" data-country="${c.id}" aria-labelledby="g-${c.id}">` +
        `<h3><button type="button" class="group__name" id="g-${c.id}" data-view="${b.view}" aria-label="${esc(t('dive', nameParts(c.id).join(' ')))}">${esc(L(b.title))}</button>` +
        `<span class="group__meta">${esc(L(c.date))}</span></h3>` +
        (ids.length ? `<ul class="thumbs">${thumbs}</ul>` : `<p class="group__none">${esc(t('bandNone'))}</p>`) +
        `</section>`;
    }).join('');
    indexTab.setAttribute('aria-label', `${t('openIndex')}, ${indexOrder.length}`);
  }
  let easeTimer = 0;
  function overIndex(target) {
    const th = target.closest('.thumb'), gn = target.closest('.group__name');
    $$('.thumb.is-awake', indexBody).forEach((x) => { if (x !== th) x.classList.remove('is-awake'); });
    if (th) {
      th.classList.add('is-awake');
      setActive({ slide: th.dataset.slide });
      clearTimeout(easeTimer);
      easeTimer = setTimeout(() => { const ll = S.slides[th.dataset.slide].ll; if (!inView(ll, 0.12)) centerOn(ll, state.z.k, 900); }, 380);
    } else if (gn) {
      const cid = gn.closest('.group').dataset.country;
      setActive({ country: cid });
      clearTimeout(easeTimer);
      easeTimer = setTimeout(() => { const ll = placeLL(cid); if (!inView(ll, 0.12)) centerOn(ll, state.z.k, 900); }, 380);
    }
  }
  indexBody.addEventListener('pointerover', (e) => { if (e.pointerType === 'mouse') overIndex(e.target); });
  indexBody.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { clearTimeout(easeTimer); clearActiveSoon(); } });
  indexBody.addEventListener('focusin', (e) => overIndex(e.target));
  indexBody.addEventListener('click', (e) => {
    if (diving) return;
    const th = e.target.closest('.thumb'), gn = e.target.closest('.group__name');
    if (th) go(bookByCountry[th.dataset.country].view, th.dataset.slide);
    else if (gn) go(gn.dataset.view);
  });
  function openIndex() {
    indexEl.hidden = false;
    indexTab.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => $('#index-close').focus({ preventScroll: true }));
  }
  function closeIndex(focus = true) {
    if (indexEl.hidden) return;
    indexEl.hidden = true;
    indexTab.setAttribute('aria-expanded', 'false');
    clearActive();
    if (focus) indexTab.focus({ preventScroll: true });
  }
  indexTab.addEventListener('click', () => (indexEl.hidden ? openIndex() : closeIndex()));
  $('#index-close').addEventListener('click', () => closeIndex());

  /* ------------------------------------------------------------ the leaf: pages */

  let page = null;       // 'guide-barcelona' | 'place-<id>'
  let pageCover = null;  // the photograph chosen to open the page, when one was
  let tocObserver = null;
  let diving = false;

  const viewCountry = (view) => (view.startsWith('guide-') ? (S.guides[view.slice(6)] || {}).country : view.slice(6));
  const validView = (view) => !!view && ((view.startsWith('guide-') && !!S.guides[view.slice(6)]) || (view.startsWith('place-') && !!countries[view.slice(6)]));

  function renderLeaf(view, pick) {
    const cid = viewCountry(view);
    const ll = placeLL(cid);
    $('#leaf-ref').textContent = coords(ll);
    if (tocObserver) { tocObserver.disconnect(); tocObserver = null; }
    renderCover(cid, view, pick);
    if (bookByCountry[cid].guide) renderGuide(cid); else renderPlace(cid);
    $$('[data-back]', leafContent).forEach((n) => n.addEventListener('click', () => back()));
  }

  function renderCover(cid, view, pick) {
    const id = coverOf(cid, pick);
    const c = countries[cid];
    leaf.classList.toggle('is-plain', !id);
    if (!id) { cover.hidden = true; coverImg.removeAttribute('src'); coverImg.removeAttribute('srcset'); return; }
    const s = S.slides[id];
    cover.hidden = false;
    if (!coverImg.isConnected) $('#cover-pic').appendChild(coverImg);
    coverImg.width = s.w; coverImg.height = s.h;
    coverImg.sizes = '100vw';
    coverImg.srcset = srcset(s);
    coverImg.src = imgSrc(s, 1280);
    coverImg.alt = L(s.alt);
    $('#cover-note').textContent = L(c.note);
    const chosen = pick && S.slides[pick];
    $('#cover-name').innerHTML = chosen
      ? [L(s.place), nameParts(cid)[nameParts(cid).length - 1]].map(esc).join(`<i>${lang === 'zh' ? '｜' : '|'}</i>`)
      : nameHTML(cid);
    $('#cover-ll').textContent = coords(chosen ? s.ll : placeLL(cid));
    $('#cover-on').textContent = view.startsWith('guide-') ? t('bookOpen') : t('seePhotos');
  }
  $('#cover-on').addEventListener('click', () => {
    const first = $('#leaf-title', leafContent);
    (first || leafContent).scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' });
    if (first) first.focus({ preventScroll: true });
  });

  const pageEnd = () => `<footer class="page-end"><button class="word" type="button" data-back>${esc(t('back'))}</button><span>${esc(t('endLine'))}</span></footer>`;

  function rowsOf(ids) {
    const target = window.innerWidth > 900 ? 2.8 : 1.6;
    const rows = [];
    let row = [], sum = 0;
    for (const id of ids) {
      const s = S.slides[id];
      const ar = s.w / s.h;
      row.push([id, ar]); sum += ar;
      if (sum >= target * 0.88 || row.length === 3) { rows.push({ row, sum }); row = []; sum = 0; }
    }
    if (row.length) rows.push({ row, sum, last: true });
    return rows;
  }

  function renderPlace(cid) {
    const c = countries[cid], ids = photosOf(cid);
    const b = bookByCountry[cid];
    let content;
    if (ids.length) {
      content = `<div class="rows">${rowsOf(ids).map((r) => `<div class="row">${r.row.map(([id, ar]) => {
        const s = S.slides[id];
        return `<figure class="piece" data-ar="${ar.toFixed(4)}"><button type="button" data-slide="${id}" aria-label="${esc(t('made', L(s.place)))}">` +
          `<img src="${imgSrc(s, 1280)}" srcset="${srcset(s)}" sizes="(max-width: 48rem) 94vw, 40vw" width="${s.w}" height="${s.h}" alt="${esc(L(s.alt))}" loading="lazy" decoding="async"></button>` +
          `<figcaption><b>${esc(L(s.place))}</b><span>${esc(L(s.where))}</span></figcaption></figure>`;
      }).join('')}${r.last && r.sum < 1.6 && window.innerWidth > 900 ? `<span class="piece" aria-hidden="true" data-ar="${(2.8 - r.sum).toFixed(4)}"></span>` : ''}</div>`).join('')}</div>`;
    } else {
      content = `<div class="no-photos"><b>${esc(t('bandNone'))}</b><span>${esc(L(c.note))}</span></div>`;
    }
    const meta = [L(c.date)];
    if (ids.length) meta.push(t('nPhotos', ids.length));
    leafContent.innerHTML = `<div class="wrap"><header class="place-top">` +
      `<h1 class="page-title" id="leaf-title" tabindex="-1">${esc(L(b.title))}</h1>` +
      `<p class="meta">${meta.map(esc).join(lang === 'zh' ? '，' : ', ')}</p>` +
      (ids.length ? `<p class="page-lede">${esc(L(c.note))}</p>` : '') +
      `<p class="quiet-line">${esc(t('bookNot'))}</p></header>${content}${pageEnd()}</div>`;
    $$('[data-ar]', leafContent).forEach((n) => n.style.setProperty('--ar', n.dataset.ar));
  }

  function renderGuide(cid) {
    const dict = guide.i18n[lang] || guide.i18n.en;
    const slideText = (key) => {
      const m = key.match(/^(sp|sa|sl)_(.+)$/);
      if (!m || !S.slides[m[2]]) return null;
      const s = S.slides[m[2]];
      if (m[1] === 'sp') return L(s.place);
      if (m[1] === 'sa') return L(s.alt);
      return t('made', L(s.place));
    };
    const get = (k) => (dict[k] !== undefined ? dict[k] : (slideText(k) !== null ? slideText(k) : (guide.i18n.en[k] !== undefined ? guide.i18n.en[k] : null)));
    leafContent.innerHTML = `<article class="guide">${guide.html}</article>`;
    $$('[data-i18n]', leafContent).forEach((el) => { const v = get(el.dataset.i18n); if (v !== null) el.textContent = v; });
    $$('[data-i18n-html]', leafContent).forEach((el) => { const v = get(el.dataset.i18nHtml); if (v !== null) el.innerHTML = v; });
    $$('[data-i18n-alt]', leafContent).forEach((el) => { const v = get(el.dataset.i18nAlt); if (v !== null) el.alt = v; });
    $$('[data-i18n-aria]', leafContent).forEach((el) => { const v = get(el.dataset.i18nAria); if (v !== null) el.setAttribute('aria-label', v); });
    // the page's own dashes go, as everywhere on the site
    const walker = document.createTreeWalker(leafContent, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) if (/[–—]/.test(n.nodeValue)) n.nodeValue = clean(n.nodeValue);
    const h1 = $('h1', leafContent);
    if (h1) { h1.id = 'leaf-title'; h1.tabIndex = -1; }
    const meta = $('.guide-top .meta', leafContent);
    if (meta) meta.insertAdjacentHTML('afterend', `<p class="guide-facts">${esc(L(guide.facts))}</p>`);
    const wrap = $('.wrap', leafContent);
    if (wrap) wrap.insertAdjacentHTML('beforeend', pageEnd());
    const links = $$('.toc a', leafContent);
    if ('IntersectionObserver' in window && links.length) {
      const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
      tocObserver = new IntersectionObserver((es) => {
        for (const en of es) {
          if (!en.isIntersecting) continue;
          links.forEach((a) => a.removeAttribute('aria-current'));
          const a = byId.get(en.target.id);
          if (a) a.setAttribute('aria-current', 'true');
        }
      }, { root: leafScroll, rootMargin: '0px 0px -70% 0px' });
      byId.forEach((a, id) => { const h = leafContent.querySelector(`#${CSS.escape(id)}`); if (h) tocObserver.observe(h); });
    }
  }

  leafContent.addEventListener('click', (e) => {
    const a = e.target.closest('a, button');
    if (!a) return;
    if (a.dataset.slide) {
      e.preventDefault();
      const list = $$('[data-slide]', leafContent).map((x) => x.dataset.slide).filter((v, i, arr) => arr.indexOf(v) === i);
      openViewer(a.dataset.slide, list);
      return;
    }
    const href = a.getAttribute('href') || '';
    if (href.startsWith('#') && href.length > 1) {
      e.preventDefault();
      const target = leafContent.querySelector(`#${CSS.escape(href.slice(1))}`);
      if (target) {
        target.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' });
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    }
  });

  /* ------------------------------------------------------------ the descent and the rising photograph */

  let pageGen = 0;
  let diveTimers = [];
  let anims = [];
  let maskTween = null, ringTween = null;
  const later = (fn, ms) => { const id = setTimeout(fn, ms); diveTimers.push(id); return id; };
  function tween(dur, ease, fn, done) {
    const t0 = performance.now();
    let id = 0;
    const tick = (now) => {
      const x = Math.min(1, (now - t0) / dur);
      fn(ease(x), x);
      if (x < 1) id = requestAnimationFrame(tick);
      else if (done) done();
    };
    id = requestAnimationFrame(tick);
    return { cancel: () => cancelAnimationFrame(id) };
  }
  function stopAll() {
    diveTimers.forEach(clearTimeout); diveTimers = [];
    anims.forEach((a) => a.cancel()); anims = [];
    if (maskTween) { maskTween.cancel(); maskTween = null; }
    if (ringTween) { ringTween.cancel(); ringTween = null; }
    if (diveRing) { diveRing.remove(); diveRing = null; }
    leaf.classList.remove('is-masked', 'is-waiting');
  }
  const reach = (x, y) => Math.max(Math.hypot(x, y), Math.hypot(innerWidth - x, y), Math.hypot(x, innerHeight - y), Math.hypot(innerWidth - x, innerHeight - y)) + 12;
  const FEATHER = 0.55; // the solid part of the opening, as a share of its radius: the feather is the other 45%

  function openPage(view, opts = {}) {
    pageGen += 1;
    const gen = pageGen;
    stopAll();
    const cid = viewCountry(view);
    const pin = pinList.find((p) => p.country === cid);
    const pick = opts.cover || null;
    const ll = pick ? S.slides[pick].ll : placeLL(cid);
    page = view; pageCover = pick;
    renderLeaf(view, pick);
    leafScroll.scrollTop = 0;
    atlas.inert = true;
    clearActive();
    if (narrow.matches) closeIndex(false);
    live.textContent = t('opening', L(bookByCountry[cid].title));
    if (!diving) state.before = state.z;
    diving = true;
    body.classList.add('is-diving');
    pinList.forEach((p) => p.el.classList.toggle('is-chosen', p.country === cid));
    const landing = diveTransform(cid, ll);
    prefetchTiles(landing);
    const hasCover = !leaf.classList.contains('is-plain');

    if (opts.animate && !reduce.matches) {
      // 1. the map descends into the country; the ring tightens on the spot
      moveTo(landing, 2100, d3.easeExpOut);
      diveRing = document.createElementNS(SVGNS, 'circle');
      diveRing.setAttribute('class', 'ring--dive');
      diveRing.dataset.ll = JSON.stringify(ll);
      ringsEl.appendChild(diveRing);
      placeRings();
      const circ = 2 * Math.PI * 90;
      diveRing.setAttribute('stroke-dasharray', `${circ}`);
      ringTween = tween(1900, expOut, (e, x) => {
        diveRing.setAttribute('r', (90 - 74 * e).toFixed(2));
        diveRing.setAttribute('stroke-dashoffset', String(circ * Math.max(0, 1 - x * 3)));
        placeRings();
      });
      // 2. as it settles, the photograph rises out of the terrain through a wide soft opening
      const [sx, sy] = spotAt(ll, landing);
      const R = reach(sx, sy) / FEATHER;
      leaf.style.setProperty('--mx', `${sx.toFixed(1)}px`);
      leaf.style.setProperty('--my', `${(sy).toFixed(1)}px`);
      leaf.style.setProperty('--f', String(FEATHER));
      leaf.style.setProperty('--r', '0px');
      leaf.classList.add('is-masked');
      coverCap.classList.add('is-hidden');
      leaf.hidden = false;
      leaf.classList.add('is-waiting');
      const START = 1050, DUR = hasCover ? 1800 : 1300;
      later(() => {
        if (gen !== pageGen) return;
        body.classList.add('is-revealing');
        leaf.classList.remove('is-waiting');
        anims.push(leaf.animate([{ opacity: 0 }, { opacity: 1, offset: 0.45 }, { opacity: 1 }], { duration: DUR, easing: 'linear' }));
        if (hasCover) anims.push(coverImg.animate([{ filter: 'blur(12px)', transform: 'scale(1.05)' }, { filter: 'blur(0px)', transform: 'scale(1)' }], { duration: DUR + 200, easing: SOFT }));
        else anims.push(leafContent.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: DUR, easing: SOFT }));
        maskTween = tween(DUR, easeInOut, (e) => {
          leaf.style.setProperty('--r', `${(24 + (R - 24) * e).toFixed(1)}px`);
          if (diveRing) diveRing.setAttribute('opacity', String(1 - Math.min(1, e * 2.5)));
        }, () => {
          if (gen !== pageGen) return;
          leaf.classList.remove('is-masked');
          if (diveRing) { diveRing.remove(); diveRing = null; }
          // 3. last, the name and coordinates settle at the bottom edge
          coverCap.classList.remove('is-hidden');
          $('#leaf-back').focus({ preventScroll: true });
        });
      }, START);
    } else {
      // no motion: the map stands at the landing; the page is there, by a plain crossfade
      moveTo(landing, 0);
      body.classList.add('is-revealing');
      leaf.hidden = false;
      coverCap.classList.remove('is-hidden');
      if (opts.animate) anims.push(leaf.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: 'ease-out' }));
      requestAnimationFrame(() => $('#leaf-back').focus({ preventScroll: true }));
    }
  }

  function closePage(opts = {}) {
    if (!page) return;
    pageGen += 1;
    const gen = pageGen;
    stopAll();
    const cid = viewCountry(page);
    const pin = pinList.find((p) => p.country === cid);
    const ll = pageCover ? S.slides[pageCover].ll : placeLL(cid);
    page = null; pageCover = null;
    if (tocObserver) { tocObserver.disconnect(); tocObserver = null; }
    const back = state.before || homeTransform();
    const surface = (dur) => {
      diving = false;
      state.before = null;
      body.classList.remove('is-revealing');
      moveTo(back, dur, d3.easeCubicInOut);
      later(() => body.classList.remove('is-diving'), dur ? Math.min(700, dur * 0.4) : 0);
      if (!dur) body.classList.remove('is-diving');
      pinList.forEach((p) => p.el.classList.remove('is-chosen'));
      if (pin && opts.focus !== false) pin.el.querySelector('.book').focus({ preventScroll: true });
      kickCorner();
    };
    const done = () => {
      if (gen !== pageGen) return;
      leaf.hidden = true;
      leaf.classList.remove('is-masked');
      leafContent.textContent = '';
      atlas.inert = false;
    };
    if (opts.animate && !reduce.matches) {
      // the same, reversed and a little quicker: the name goes first, the photograph sinks into the spot
      const [sx, sy] = spotAt(ll, state.z);
      const atTop = leafScroll.scrollTop < 40;
      const R = reach(sx, sy) / FEATHER;
      coverCap.classList.add('is-hidden');
      leaf.style.setProperty('--mx', `${sx.toFixed(1)}px`);
      leaf.style.setProperty('--my', `${sy.toFixed(1)}px`);
      leaf.style.setProperty('--r', `${R.toFixed(1)}px`);
      leaf.classList.add('is-masked');
      const DUR = 1150;
      body.classList.remove('is-revealing');
      if (atTop && !leaf.classList.contains('is-plain')) anims.push(coverImg.animate([{ filter: 'blur(0px)', transform: 'scale(1)' }, { filter: 'blur(10px)', transform: 'scale(1.04)' }], { duration: DUR, easing: SOFT, fill: 'forwards' }));
      anims.push(leaf.animate([{ opacity: 1 }, { opacity: 1, offset: 0.5 }, { opacity: 0 }], { duration: DUR, easing: 'linear', fill: 'forwards' }));
      maskTween = tween(DUR, easeInOut, (e) => {
        leaf.style.setProperty('--r', `${(R - (R - 16) * e).toFixed(1)}px`);
      }, () => {
        if (gen !== pageGen) return;
        anims.forEach((a) => a.cancel()); anims = [];
        done();
        surface(1500);
      });
    } else {
      done();
      surface(0);
    }
  }

  /* ------------------------------------------------------------ the viewer: a photograph larger, with how it was made */

  let photo = null;
  let photoList = indexOrder;
  const vImg = document.createElement('img');
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
    $('#viewer-text').innerHTML =
      `<h2 id="viewer-title">${esc(L(s.place))}</h2>` +
      `<p class="viewer__where">${esc(L(s.where))}</p>` +
      `<p class="viewer__ll">${esc(coords(s.ll))}</p>` +
      (rows ? `<dl class="spec" aria-label="${esc(t('made', L(s.place)))}">${rows}</dl>` : '') +
      (s.best ? `<p class="viewer__note"><b>${esc(t('best'))}</b>${esc(L(s.best))}</p>` : '') +
      (s.note ? `<p class="viewer__note">${esc(L(s.note))}</p>` : '') +
      `<p class="viewer__count">${esc(t('ofN', i + 1, photoList.length))}</p>`;
    $('#viewer-prev').disabled = photoList.length < 2;
    $('#viewer-next').disabled = photoList.length < 2;
  }
  function showViewer(id, list) {
    photo = id;
    photoList = list && list.includes(id) ? list : indexOrder;
    renderViewer();
    const wasHidden = viewer.hidden;
    viewer.hidden = false;
    atlas.inert = true; leaf.inert = true;
    if (wasHidden) requestAnimationFrame(() => $('#viewer-close').focus({ preventScroll: true }));
  }
  function hideViewer() {
    if (!photo) return;
    const id = photo;
    photo = null;
    viewer.hidden = true;
    leaf.inert = false;
    atlas.inert = !!page;
    const back = leafContent.querySelector(`[data-slide="${id}"]`);
    (back || $('#leaf-back')).focus({ preventScroll: false });
  }
  function step(d) {
    const i = photoList.indexOf(photo);
    const n = photoList.length;
    photo = photoList[(i + d + n) % n];
    renderViewer();
    try { history.replaceState({ ...(history.state || {}), relief: true, photo }, '', `#photo-${photo}`); } catch (e) { /* fine */ }
  }
  $('#viewer-prev').addEventListener('click', () => step(-1));
  $('#viewer-next').addEventListener('click', () => step(1));
  $('#viewer-close').addEventListener('click', () => back());
  let swipe = null;
  viewer.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') swipe = { x: e.clientX, y: e.clientY }; });
  viewer.addEventListener('pointerup', (e) => {
    if (!swipe) return;
    const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
    swipe = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) step(dx < 0 ? 1 : -1);
  });
  viewer.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  });

  /* ------------------------------------------------------------ history: every page and photograph has an address */

  function parse(hash) {
    const h = decodeURIComponent((hash || '').replace(/^#/, ''));
    const st = history.state || {};
    if (h.startsWith('photo-') && S.slides[h.slice(6)] && validView(st.page)) return { page: st.page, cover: st.cover || null, photo: h.slice(6) };
    if (validView(h)) return { page: h, cover: st.page === h ? st.cover || null : null, photo: null };
    return { page: null, cover: null, photo: null };
  }
  function apply(want, animate) {
    if (want.photo !== photo && photo) hideViewer();
    if (want.page !== page) {
      if (page) closePage({ animate: animate && !want.page, focus: !want.page });
      if (want.page) openPage(want.page, { animate, cover: want.cover });
    }
    if (want.photo && want.photo !== photo) showViewer(want.photo, photoList);
  }
  function go(view, coverId) {
    if (page === view || diving) return;
    if (opening.running) finishOpening();
    try { history.pushState({ relief: true, page: view, cover: coverId || null }, '', `#${view}`); } catch (e) { /* fine */ }
    openPage(view, { animate: true, cover: coverId || null });
  }
  function openViewer(id, list) {
    try { history.pushState({ relief: true, page, cover: pageCover, photo: id }, '', `#photo-${id}`); } catch (e) { /* fine */ }
    showViewer(id, list);
  }
  function back() {
    if (history.state && history.state.relief) history.back();
    else {
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* fine */ }
      apply({ page: null, cover: null, photo: null }, true);
    }
  }
  window.addEventListener('popstate', () => apply(parse(location.hash), true));
  $('#leaf-back').addEventListener('click', () => back());
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (opening.running) { e.preventDefault(); finishOpening(); return; }
    if (photo || page) { e.preventDefault(); back(); return; }
    if (!indexEl.hidden) { e.preventDefault(); closeIndex(); }
  });

  /* ------------------------------------------------------------ the globe of flights */

  // there is no flight log: one arc from Taipei to each of the other places, because that is where he flies from
  const FROM = [121.56, 25.03];
  const FLIGHTS = order.filter((c) => c.id !== 'taiwan').map((c) => { const ll = placeLL(c.id); return [ll[1], ll[0]]; });

  const globe = {
    wrap: null, gl: null, fx: null, fxc: null, prog: null, tex: null, n: 0,
    ok: false, mode: 'off', size: 0, dpr: 1, raf: 0,
    launches: [], loopStart: 0, nextLaunch: 0, cursor: 0,
  };

  const VS = `
attribute vec2 a;
uniform float u_t, u_lam, u_phi, u_R, u_K;
uniform vec2 u_cO, u_cE, u_res;
varying vec2 v_uv; varying vec3 v_n;
const float PI = 3.141592653589793;
void main() {
  float l = a.x, p = a.y;
  float cp = cos(p), sp = sin(p), cl = cos(l), sl = sin(l);
  float s0 = sin(u_phi), c0 = cos(u_phi);
  float xo = cp * sl;
  float yo = c0 * sp - s0 * cp * cl;
  float zo = s0 * sp + c0 * cp * cl;
  vec2 po = u_cO + u_R * vec2(xo, -yo);
  vec2 pe = u_cE + u_K * vec2(l, -p);
  vec2 pos = mix(po, pe, u_t);
  float depth = mix(zo, 1.0, u_t);
  vec2 clip = pos / u_res * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, -depth * 0.5, 1.0);
  v_uv = vec2((l + u_lam) / (2.0 * PI) + 0.5, 0.5 - p / PI);
  v_n = vec3(xo, yo, zo);
}`;
  const FS = `
precision mediump float;
uniform sampler2D u_tex;
uniform float u_mix;
varying vec2 v_uv; varying vec3 v_n;
void main() {
  if (u_mix < 0.002 && v_n.z < 0.0) discard;
  vec3 c = texture2D(u_tex, v_uv).rgb;
  vec3 n = normalize(v_n);
  float lam = clamp(dot(n, normalize(vec3(-0.5, 0.58, 0.64))), 0.0, 1.0);
  vec3 lit = c * (0.88 + 0.16 * lam);
  lit = mix(lit, lit * vec3(0.92, 0.92, 1.0), (1.0 - lam) * 0.22);
  float limb = pow(1.0 - clamp(n.z, 0.0, 1.0), 2.6);
  lit = mix(lit, vec3(0.88, 0.93, 0.96), limb * 0.32);
  gl_FragColor = vec4(mix(lit, c, u_mix), 1.0);
}`;

  function makeGlobe() {
    const wrap = document.createElement('div');
    wrap.className = 'globe-wrap';
    const gc = document.createElement('canvas');
    const fx = document.createElement('canvas');
    gc.setAttribute('aria-hidden', 'true'); fx.setAttribute('aria-hidden', 'true');
    wrap.append(gc, fx);
    globe.wrap = wrap; globe.fx = fx; globe.fxc = fx.getContext('2d');
    let gl = null;
    try { gl = gc.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: true }); } catch (e) { gl = null; }
    if (!gl || !state.plateCanvas) { globe.ok = false; gc.remove(); return; }
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    try {
      const prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link');
      gl.useProgram(prog);
      // a mesh of the sphere in 2.5° cells, longitude measured from the centre so its seam stays at the back
      const STEP = 2.5, nx = 360 / STEP + 1, ny = 180 / STEP + 1;
      const verts = new Float32Array(nx * ny * 2);
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        verts[(j * nx + i) * 2] = (-180 + i * STEP) * RAD;
        verts[(j * nx + i) * 2 + 1] = (90 - j * STEP) * RAD;
      }
      const idx = new Uint16Array((nx - 1) * (ny - 1) * 6);
      let o = 0;
      for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
        const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
        idx[o++] = a; idx[o++] = c; idx[o++] = b; idx[o++] = b; idx[o++] = c; idx[o++] = d;
      }
      const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
      const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'a');
      gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, state.plateCanvas);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LESS);
      globe.u = {};
      for (const u of ['u_t', 'u_mix', 'u_lam', 'u_phi', 'u_R', 'u_K', 'u_cO', 'u_cE', 'u_res', 'u_tex']) globe.u[u] = gl.getUniformLocation(prog, u);
      globe.gl = gl; globe.gc = gc; globe.n = idx.length; globe.ok = true;
    } catch (e) {
      globe.ok = false; gc.remove();
    }
  }

  function sizeGlobe(w, h) {
    const d = Math.min(2, window.devicePixelRatio || 1);
    globe.dpr = d; globe.w = w; globe.h = h;
    if (globe.gc) { globe.gc.width = Math.round(w * d); globe.gc.height = Math.round(h * d); }
    globe.fx.width = Math.round(w * d); globe.fx.height = Math.round(h * d);
  }

  // one frame of the globe (and, during the opening, of its unrolling): sizes in CSS pixels
  function renderGlobe(v) {
    const d = globe.dpr;
    if (globe.ok) {
      const gl = globe.gl, u = globe.u;
      gl.viewport(0, 0, globe.gc.width, globe.gc.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniform1f(u.u_t, v.t);
      gl.uniform1f(u.u_mix, v.t);
      gl.uniform1f(u.u_lam, v.lam * RAD);
      gl.uniform1f(u.u_phi, v.phi * RAD);
      gl.uniform1f(u.u_R, v.R * d);
      gl.uniform1f(u.u_K, (v.K || 1) * d);
      gl.uniform2f(u.u_cO, v.cx * d, v.cy * d);
      gl.uniform2f(u.u_cE, (v.ex || 0) * d, (v.ey || 0) * d);
      gl.uniform2f(u.u_res, globe.gc.width, globe.gc.height);
      gl.uniform1i(u.u_tex, 0);
      gl.drawElements(gl.TRIANGLES, globe.n, gl.UNSIGNED_SHORT, 0);
    }
    // the drawn layer: atmosphere, graticule and the flights
    const c = globe.fxc;
    c.setTransform(d, 0, 0, d, 0, 0);
    c.clearRect(0, 0, globe.w, globe.h);
    const a = v.fx === undefined ? 1 : v.fx;
    if (a <= 0) return;
    c.globalAlpha = a;
    const pr = d3.geoOrthographic().rotate([-v.lam, -v.phi]).scale(v.R).translate([v.cx, v.cy]).clipAngle(90).precision(0.5);
    const gp = d3.geoPath(pr, c);
    if (!globe.ok) {
      // no WebGL: a plain globe in the same inks
      c.beginPath(); gp({ type: 'Sphere' }); c.fillStyle = 'rgb(214, 229, 233)'; c.fill();
      if (state.land110) { c.beginPath(); gp(state.land110); c.fillStyle = 'rgb(214, 214, 194)'; c.fill(); }
    }
    // a soft atmosphere just outside the disc
    const glow = c.createRadialGradient(v.cx, v.cy, v.R * 0.97, v.cx, v.cy, v.R * 1.11);
    glow.addColorStop(0, 'rgba(236, 245, 248, 0.0)');
    glow.addColorStop(0.18, 'rgba(232, 243, 247, 0.85)');
    glow.addColorStop(1, 'rgba(232, 243, 247, 0)');
    c.fillStyle = glow;
    c.beginPath(); c.arc(v.cx, v.cy, v.R * 1.11, 0, Math.PI * 2); c.fill();
    // fine white graticule
    c.lineWidth = v.R > 140 ? 0.7 : 0.5;
    c.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    c.beginPath(); gp(d3.geoGraticule().step([15, 15])()); c.stroke();
    // the limb, one hairline
    c.lineWidth = 0.75; c.strokeStyle = 'rgba(70, 96, 112, 0.32)';
    c.beginPath(); c.arc(v.cx, v.cy, v.R, 0, Math.PI * 2); c.stroke();
    drawFlights(c, gp, v);
    c.globalAlpha = 1;
  }

  // a flight: a bright head running along the great circle, a fading tail behind it, then a faint trace that goes
  function drawFlights(c, gp, v) {
    const now = v.now;
    const big = v.R > 140;
    const TAIL = 0.34, SEG = 14;
    for (const f of globe.launches) {
      const x = (now - f.t0) / f.dur;
      if (x < 0) continue;
      const linger = (now - f.t0 - f.dur) / f.fade;
      if (linger > 1) continue;
      const p = Math.min(1, expOutSoft(Math.min(1, x)));
      const ip = f.ip;
      // the whole route, once flown: a white line with a faint shadow under it, so it reads on the pale land
      const whole = (alpha, w) => {
        const g = { type: 'LineString', coordinates: d3.range(0, 1.001, 0.04).map(ip) };
        c.lineWidth = w + 1.6; c.strokeStyle = `rgba(58, 54, 78, ${0.16 * alpha})`;
        c.beginPath(); gp(g); c.stroke();
        c.lineWidth = w; c.strokeStyle = `rgba(255, 255, 255, ${0.9 * alpha})`;
        c.beginPath(); gp(g); c.stroke();
      };
      if (reduce.matches) { whole(0.85, big ? 1.2 : 0.9); continue; }
      if (x >= 1) { whole(0.7 * (1 - linger), big ? 1.1 : 0.8); continue; }
      const from = Math.max(0, p - TAIL);
      for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i < SEG; i++) {
          const a0 = from + ((p - from) * i) / SEG, a1 = from + ((p - from) * (i + 1)) / SEG;
          const al = (i + 1) / SEG;
          const w = (big ? 2.2 : 1.5) * (0.45 + 0.55 * al);
          c.lineWidth = pass ? w : w + 1.8;
          c.strokeStyle = pass ? `rgba(255, 255, 255, ${al})` : `rgba(58, 54, 78, ${0.2 * al})`;
          c.beginPath(); gp({ type: 'LineString', coordinates: [ip(a0), ip((a0 + a1) / 2), ip(a1)] }); c.stroke();
        }
      }
      const head = ip(p);
      const hp = gp.projection()(head);
      const vis = d3.geoDistance(head, [v.lam, v.phi]) < Math.PI / 2 - 0.02;
      if (hp && vis) {
        c.save();
        c.shadowColor = 'rgba(255, 255, 255, 0.95)'; c.shadowBlur = big ? 10 : 6;
        c.fillStyle = '#fff';
        c.beginPath(); c.arc(hp[0], hp[1], big ? 2.4 : 1.6, 0, Math.PI * 2); c.fill();
        c.restore();
      }
    }
  }
  const expOutSoft = (x) => 1 - Math.pow(1 - x, 2.4);

  function launchAll(at, gap, dur) {
    globe.launches = FLIGHTS.map((to, i) => ({ ip: d3.geoInterpolate(FROM, to), t0: at + i * gap, dur, fade: 1800 }));
    globe.cursor = 0;
    globe.nextLaunch = at + FLIGHTS.length * gap + 2600;
  }

  // the corner: the globe turns slowly back and forth over the routes, and a flight leaves now and then
  function cornerFrame(now) {
    globe.raf = 0;
    if (globe.mode !== 'corner') return;
    if (!reduce.matches && now - (globe.last || 0) < 31) { globe.raf = requestAnimationFrame(cornerFrame); return; }
    globe.last = now;
    const g = globe.size;
    if (!reduce.matches && now >= globe.nextLaunch) {
      const i = globe.cursor % FLIGHTS.length;
      globe.launches = globe.launches.filter((f) => now - f.t0 < f.dur + f.fade);
      globe.launches.push({ ip: d3.geoInterpolate(FROM, FLIGHTS[i]), t0: now, dur: 2200, fade: 2400 });
      globe.cursor += 1;
      globe.nextLaunch = now + 900;
    }
    const lam = reduce.matches ? 100 : 98 + 52 * Math.sin((now / 52000) * Math.PI * 2);
    renderGlobe({ t: 0, lam, phi: 16, R: g / 2 - g * 0.09, cx: g / 2, cy: g / 2, now, fx: 1 });
    if (!reduce.matches && !page && document.visibilityState === 'visible') globe.raf = requestAnimationFrame(cornerFrame);
  }
  function startCorner() {
    const stage = $('#flights-stage');
    const g = stage.getBoundingClientRect().width || 184;
    globe.size = g;
    stage.appendChild(globe.wrap);
    sizeGlobe(g, g);
    globe.mode = 'corner';
    if (reduce.matches) {
      globe.launches = FLIGHTS.map((to) => ({ ip: d3.geoInterpolate(FROM, to), t0: -1e9, dur: 1, fade: 1e12 }));
      cornerFrame(performance.now());
      return;
    }
    if (!globe.launches.length) launchAll(performance.now() + 300, 160, 1900);
    kickCorner();
  }
  function kickCorner() { if (globe.mode === 'corner' && !globe.raf && !page) globe.raf = requestAnimationFrame(cornerFrame); }
  document.addEventListener('visibilitychange', kickCorner);
  $('#flights-btn').addEventListener('click', () => {
    if (globe.mode !== 'corner') return;
    if (reduce.matches) return;
    launchAll(performance.now(), 110, 1700);
    kickCorner();
  });

  /* ------------------------------------------------------------ the opening: the globe of flights, unrolled into the map */

  const openingEl = $('#opening');
  const opening = { running: false, raf: 0, timer: 0 };
  function wantsOpening() {
    if (reduce.matches || location.hash) return false;
    try { if (sessionStorage.getItem('relief-opened')) return false; } catch (e) { /* storage blocked: show it */ }
    return globe.ok;
  }
  function playOpening() {
    try { sessionStorage.setItem('relief-opened', '1'); } catch (e) { /* fine */ }
    opening.running = true;
    body.classList.add('is-opening');
    openingEl.hidden = false;
    $('#opening-stage').appendChild(globe.wrap);
    const W = window.innerWidth, H = window.innerHeight;
    sizeGlobe(W, H);
    globe.mode = 'opening';
    const R = narrow.matches ? W * 0.38 : Math.min(W, H) * 0.31;
    const cx = W / 2, cy = H / 2 + (narrow.matches ? 0 : 10);
    const home = state.z; // the map already stands at its home view underneath
    const rect = mapEl.getBoundingClientRect();
    const ex = rect.left + home.x + home.k * state.W / 2, ey = rect.top + home.y + home.k * state.H / 2;
    const K = state.S0 * home.k;
    const t0 = performance.now();
    launchAll(t0 + 380, 95, 1150);
    const SPIN = 2350, UNROLL = 1550;
    globe.wrap.animate([{ opacity: 0, transform: 'scale(0.96)' }, { opacity: 1, transform: 'none' }], { duration: 700, easing: SOFT, fill: 'backwards' });
    const frame = (now) => {
      if (!opening.running) return;
      const e = now - t0;
      if (e < SPIN) {
        const x = e / SPIN;
        renderGlobe({ t: 0, lam: lerp(146, 121, easeInOut(x)), phi: 20, R, cx, cy, now, fx: 1 });
      } else {
        const x = Math.min(1, (e - SPIN) / UNROLL);
        const u = easeInOut(x);
        openingEl.classList.add('is-unrolling');
        renderGlobe({ t: u, lam: lerp(121, CENTER, u), phi: lerp(20, 0, u), R, cx, cy, K, ex, ey, now, fx: 1 - Math.min(1, x / 0.3) });
        if (x >= 1) { finishOpening(); return; }
      }
      opening.raf = requestAnimationFrame(frame);
    };
    opening.raf = requestAnimationFrame(frame);
  }
  function finishOpening() {
    if (!opening.running) return;
    opening.running = false;
    cancelAnimationFrame(opening.raf);
    body.classList.remove('is-opening');
    openingEl.classList.add('is-done');
    pinsEl.classList.add('is-arriving');
    setTimeout(() => {
      openingEl.hidden = true;
      openingEl.classList.remove('is-done', 'is-unrolling');
      pinsEl.classList.remove('is-arriving');
    }, 900);
    globe.launches = [];
    startCorner();
    $('#flights').classList.add('is-arriving');
    setTimeout(() => $('#flights').classList.remove('is-arriving'), 1200);
  }
  $('#opening-skip').addEventListener('click', finishOpening);
  openingEl.addEventListener('pointerdown', (e) => { if (!e.target.closest('.opening__skip')) finishOpening(); });

  /* ------------------------------------------------------------ language */

  function applyWords() {
    html.lang = lang === 'zh' ? 'zh-Hant' : 'en';
    $$('[data-t]').forEach((el) => { const v = t(el.dataset.t); if (typeof v === 'string') el.textContent = v; });
    $$('[data-t-aria]').forEach((el) => { const v = t(el.dataset.tAria); if (typeof v === 'string') el.setAttribute('aria-label', v); });
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
    if (page) {
      const top = leafScroll.scrollTop;
      renderLeaf(page, pageCover);
      coverCap.classList.remove('is-hidden');
      leafScroll.scrollTop = top;
    }
    if (photo) renderViewer();
    const fontsIn = document.fonts && document.fonts.load ? document.fonts.load(lang === 'zh' ? `500 14px ${FACE_ZH}` : `500 14px ${FACE}`, lang === 'zh' ? '日本' : 'A') : Promise.resolve();
    fontsIn.then(() => { measureLabels(); state.settle = 8; queueDraw(); });
    state.settle = 8;
    queueDraw();
  }
  document.addEventListener('click', (e) => { const b = e.target.closest('.lang button'); if (b) setLang(b.dataset.lang); });

  /* ------------------------------------------------------------ the shapes */

  function featsFor(w) {
    const geoms = w.objects.countries.geometries;
    const out = {};
    for (const [cid, iso] of Object.entries(ISO)) {
      const g = geoms.find((x) => String(x.id).padStart(3, '0') === iso);
      if (g) out[cid] = topojson.feature(w, g);
    }
    return out;
  }
  // where each country's name sits: the middle of its largest piece of land, and how wide that piece is
  function labelGeometry(feats) {
    const out = {};
    for (const [cid, f] of Object.entries(feats)) {
      const polys = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates.map((c) => ({ type: 'Polygon', coordinates: c })) : [f.geometry];
      let best = null, ba = -1;
      for (const p of polys) { const a = d3.geoArea(p); if (a > ba) { ba = a; best = p; } }
      const b = d3.geoBounds(best);
      let span = b[1][0] - b[0][0];
      if (span < 0) span += 360;
      const c = d3.geoCentroid(best);
      out[cid] = { ll: [c[1], c[0]], span, area: d3.geoArea(f) };
    }
    // a few names sit better where an atlas would put them
    if (out.usa) { out.usa.ll = [39.2, -98.5]; out.usa.span = 50; }
    if (out.china) { out.china.ll = [33.5, 104]; out.china.span = 46; }
    if (out.australia) out.australia.ll = [-25.5, 134];
    if (out.japan) { out.japan.ll = [37.4, 139.2]; }
    if (out.vietnam) { out.vietnam.ll = [14.6, 108.2]; out.vietnam.span = 4; }
    if (out['new-zealand']) { out['new-zealand'].ll = [-42.6, 171.5]; }
    return out;
  }
  async function loadShapes() {
    const w110 = await fetch('../vendor/countries-110m.json').then((r) => r.json());
    state.land110 = topojson.feature(w110, w110.objects.land);
    state.feats110 = featsFor(w110);
    state.labels = labelGeometry(state.feats110);
    queueDraw();
    const w50 = await fetch('../vendor/countries-50m.json').then((r) => r.json());
    state.feats50 = featsFor(w50);
    // the small places only the finer shapes carry
    for (const id of ['singapore', 'hong-kong']) if (!state.labels[id] && state.feats50[id]) Object.assign(state.labels, labelGeometry({ [id]: state.feats50[id] }));
    queueDraw();
  }

  /* ------------------------------------------------------------ start */

  async function start() {
    applyWords();
    renderIndex();
    sizeMap();
    renderPins();
    moveTo(homeTransform(), 0);
    updateZoomButtons();
    state.settle = 20;
    queueDraw();
    loadShapes().catch(() => { /* the map still shows its relief, places and books */ });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measureLabels(); state.settle = 10; queueDraw(); });

    // a page or photograph named in the address opens directly
    const want = parse(location.hash);
    if (want.page || want.photo) {
      try { history.replaceState({ relief: false, page: want.page, cover: null, photo: want.photo }, '', location.href); } catch (e) { /* fine */ }
      apply(want, false);
    }

    let reliefOk = true;
    try { await loadRelief(); } catch (e) { reliefOk = false; state.baseFailed = true; }
    try { await Promise.race([document.fonts ? document.fonts.load(`500 14px ${FACE}`) : null, new Promise((r) => setTimeout(r, 800))]); } catch (e) { /* fine */ }
    body.classList.remove('is-loading');
    state.settle = 20;
    queueDraw();
    if (reliefOk) makeGlobe();
    if (!globe.wrap) { globe.wrap = document.createElement('div'); globe.wrap.className = 'globe-wrap'; const fx = document.createElement('canvas'); globe.wrap.append(fx); globe.fx = fx; globe.fxc = fx.getContext('2d'); }
    if (!page && wantsOpening()) playOpening();
    else startCorner();

    let rz = 0;
    window.addEventListener('resize', () => {
      cancelAnimationFrame(rz);
      rz = requestAnimationFrame(() => {
        const c = proj0.invert([state.z.invertX(state.W / 2), state.z.invertY(state.H / 2)]);
        const kRel = state.z.k;
        sizeMap();
        const p = proj0(c);
        state.z = d3.zoomIdentity.translate(state.W / 2 - p[0] * kRel, state.H / 2 - p[1] * kRel).scale(kRel);
        sel.call(zoom.transform, constrain(state.z));
        if (globe.mode === 'corner') {
          const g = $('#flights-stage').getBoundingClientRect().width || globe.size;
          globe.size = g; sizeGlobe(g, g);
          if (reduce.matches) cornerFrame(performance.now());
        }
        state.settle = 10;
        queueDraw();
      });
    });
  }
  start();
})();

/* tuan photography 陳亮元 · design 2 · "Blind emboss"
   A map made of paper and light. The sheet is drawn on one canvas: the land raised from it, the
   world's shaded relief (Natural Earth SR_50M) pressed into the land and lit from the upper left,
   his sixteen countries pressed a touch deeper and warmer. The light responds to the zoom: as the
   map magnifies, the sun drops, shadows lengthen and the relief deepens. The books stand on the
   sheet as HTML. Choosing one draws the map in (the atlas plate's dive) and the cover photograph
   dissolves in through a wide feathered opening. A small paper globe in the corner keeps the
   flights. */
(() => {
  'use strict';

  const S = window.SITE;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = matchMedia('(max-width: 47.99rem)');
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // the data keeps a few typographic dashes (a date range, a name); the page shows none
  const clean = (s) => String(s ?? '').replace(/(\d)\s*[–—]\s*(\d)/g, '$1-$2').replace(/\s+[–—]\s+/g, ', ').replace(/[–—]/g, '-');

  /* ------------------------------------------------------------ words, both languages */

  const T = {
    en: {
      ig: 'Instagram',
      lineMap: 'Sixteen places travelled. Choose one to go in.',
      mapLabel: 'Map of the places travelled',
      mapHint: 'Drag or use the arrow keys to move the map. Scroll, or press plus and minus, to zoom. Tab moves between the books.',
      siteLabel: 'Site', langLabel: 'Language',
      zoomGroup: 'Zoom', zoomIn: 'Zoom in', zoomOut: 'Zoom out', world: 'Whole map',
      credit: 'Relief and coastlines: Natural Earth',
      indexOpen: 'Photographs', indexTitle: 'Photographs',
      count: (n, p) => `${n} photographs from ${p} places`,
      flights: 'Flights', flightsAria: 'Flights: play the routes again',
      skip: 'Skip',
      seePhotos: 'See the photographs',
      photosN: (n) => (n === 1 ? '1 photograph' : `${n} photographs`),
      coverOf: (p) => `Open with ${p}`,
      made: (p) => `${p}: how this was made`,
      camera: 'Camera', lens: 'Lens', focal: 'Focal length', aperture: 'Aperture', shutter: 'Shutter', iso: 'ISO',
      prev: 'Previous', next: 'Next',
      ofN: (i, n) => `${i} of ${n}`,
      seeAll: (p) => `Go to ${p}`,
      opening: (p) => `${p} is open.`,
      seas: { pacific: 'Pacific Ocean', atlantic: 'Atlantic Ocean', indian: 'Indian Ocean', southern: 'Southern Ocean' },
    },
    zh: {
      ig: 'Instagram',
      lineMap: '走過的十六個地方。選一個，走進去。',
      mapLabel: '走過的地方地圖',
      mapHint: '拖曳或用方向鍵移動地圖；捲動，或按加號、減號縮放。Tab 鍵在書之間移動。',
      siteLabel: '網站', langLabel: '語言',
      zoomGroup: '縮放', zoomIn: '放大', zoomOut: '縮小', world: '整張地圖',
      credit: '地形與海岸線：Natural Earth',
      indexOpen: '作品', indexTitle: '作品',
      count: (n, p) => `${p} 個地方，${n} 張照片`,
      flights: '飛過的航線', flightsAria: '飛過的航線：重播',
      skip: '略過',
      seePhotos: '看照片',
      photosN: (n) => `${n} 張照片`,
      coverOf: (p) => `以「${p}」開場`,
      made: (p) => `${p}：這張怎麼拍`,
      camera: '相機', lens: '鏡頭', focal: '焦距', aperture: '光圈', shutter: '快門', iso: 'ISO',
      prev: '上一張', next: '下一張',
      ofN: (i, n) => `第 ${i} 張，共 ${n} 張`,
      seeAll: (p) => `前往${p}`,
      opening: (p) => `已打開${p}。`,
      seas: { pacific: '太平洋', atlantic: '大西洋', indian: '印度洋', southern: '南冰洋' },
    },
  };

  let lang = 'en';
  try {
    const saved = localStorage.getItem('tlap-lang');
    if (saved === 'zh' || saved === 'en') lang = saved;
  } catch (e) { /* storage blocked: stay in English */ }
  const query = new URLSearchParams(location.search);
  if (query.get('lang') === 'zh' || query.get('lang') === 'en') lang = query.get('lang');

  const t = (k, ...args) => {
    const v = T[lang][k] !== undefined ? T[lang][k] : S.i18n[lang][k];
    if (typeof v === 'function') return v(...args);
    return v === undefined ? k : v;
  };
  const L = (o) => clean(o ? (o[lang] != null ? o[lang] : o.en) : '');

  /* ------------------------------------------------------------ his places */

  const countries = Object.fromEntries(S.countries.map((c) => [c.id, c]));
  const books = S.books.map((b) => ({ ...b, view: b.guide ? `guide-${b.guide}` : `place-${b.country}` }));
  const bookByCountry = Object.fromEntries(books.map((b) => [b.country, b]));
  const guide = S.guides.barcelona;
  const order = books.map((b) => countries[b.country]).filter(Boolean);
  const placeLL = (cid) => { const b = bookByCountry[cid]; return b && b.guide && S.guides[b.guide] ? S.guides[b.guide].ll : countries[cid].ll; };
  const photosOf = (cid) => countries[cid].photos.filter((id) => S.slides[id]);
  const indexOrder = order.flatMap((c) => photosOf(c.id));
  const coverIdOf = (cid, want) => {
    if (want && S.slides[want] && S.slides[want].country === cid) return want;
    const b = bookByCountry[cid];
    return (b && b.photo) || photosOf(cid)[0] || null;
  };
  const coords = ([lat, lng]) => `${Math.abs(lat).toFixed(3)}°${lat >= 0 ? 'N' : 'S'} · ${Math.abs(lng).toFixed(3)}°${lng >= 0 ? 'E' : 'W'}`;
  const nameParts = (cid) => {
    const b = bookByCountry[cid], c = countries[cid];
    const place = b ? L(b.title) : L(c.name), country = L(c.name);
    return place === country ? [place] : [place, country];
  };
  const nameHTML = (cid) => nameParts(cid).map(esc).join(`<i>${lang === 'zh' ? '｜' : '|'}</i>`);
  const imgSrc = (s, size) => `../images/web/${size ? size + '/' : ''}${s.file}`;
  const srcset = (s) => `${imgSrc(s, 640)} 640w, ${imgSrc(s, 1280)} 1280w, ${imgSrc(s)} ${s.w}w`;

  /* ------------------------------------------------------------ elements */

  const html = document.documentElement;
  const app = $('#app');
  const mapEl = $('#map');
  const canvas = $('#sheet');
  const ctx = canvas.getContext('2d');
  const pinsEl = $('#pins');
  const tip = $('#tip');
  const indexEl = $('#index');
  const indexBody = $('#index-body');
  const indexScroll = $('#index-scroll');
  const indexBtn = $('#index-open');
  const leaf = $('#leaf');
  const leafScroll = $('#leaf-scroll');
  const leafContent = $('#leaf-content');
  const viewer = $('#viewer');
  const live = $('#live');

  /* ------------------------------------------------------------ colours of paper and light */

  const SHEET = 'rgb(238, 240, 243)';
  const LAND = 'rgb(245, 247, 248)';
  const WARM = 'rgba(243, 235, 223, 0.7)';
  const INK = 'rgb(36, 41, 49)';
  const INK2 = 'rgb(75, 80, 88)';
  const SH = (a) => `rgba(27, 34, 43, ${a})`;
  const LIFT = (a) => `rgba(255, 255, 255, ${a})`;
  const FLIGHT = (a) => `rgba(211, 62, 33, ${a})`;

  /* ------------------------------------------------------------ small clocks */

  const expOut = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
  const inOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  function tween(dur, fn, done, ease = expOut) {
    const t0 = performance.now();
    let id = 0, live2 = true;
    const tick = (now) => {
      if (!live2) return;
      const x = Math.min(1, (now - t0) / dur);
      fn(ease(x), x);
      if (x < 1) id = requestAnimationFrame(tick);
      else if (done) done();
    };
    id = requestAnimationFrame(tick);
    return { cancel: () => { live2 = false; cancelAnimationFrame(id); } };
  }

  /* ------------------------------------------------------------ the map: projection and state */

  const state = {
    W: 1, H: 1, dpr: 1, S0: 1, kHome: 1,
    z: d3.zoomIdentity,
    land110: null, land50: null, mesh110: null, mesh50: null, feats110: {}, feats50: {},
    laid: null, drawQueued: false, settle: 0, before: null,
    photoPts: [], rings: [],
  };
  const proj0 = d3.geoEquirectangular();
  const proj = d3.geoEquirectangular().precision(0.35);

  const zoom = d3.zoom()
    .scaleExtent([1, 40])
    .on('start', (e) => { if (e.sourceEvent && e.sourceEvent.type !== 'wheel') mapEl.classList.add('is-dragging'); })
    .on('zoom', (e) => { state.z = e.transform; state.settle = 8; queueDraw(); updateZoomButtons(); })
    .on('end', () => mapEl.classList.remove('is-dragging'));
  const sel = d3.select(mapEl);
  sel.call(zoom).on('dblclick.zoom', null);

  function sizeMap() {
    state.W = Math.max(1, mapEl.clientWidth);
    state.H = Math.max(1, mapEl.clientHeight);
    state.dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(state.W * state.dpr);
    canvas.height = Math.round(state.H * state.dpr);
    state.S0 = state.W / (2 * Math.PI);
    proj0.scale(state.S0).translate([state.W / 2, state.H / 2]);
    zoom.extent([[0, 0], [state.W, state.H]])
      .translateExtent([[0, state.H / 2 - state.W / 4], [state.W, state.H / 2 + state.W / 4]]);
    state.laid = makeLaid();
    state.kHome = homeTransform().k;
  }

  // screen position of a [lat, lon]
  const P = (ll, z = state.z) => {
    const p = proj0([ll[1], ll[0]]);
    return [z.applyX(p[0]), z.applyY(p[1])];
  };

  /* the paper: fine laid lines, a chain line now and then, a little grain; it moves with the
     sheet but does not grow with the zoom, because it is the paper and not the print */
  const LAID = 240;
  function makeLaid() {
    const d = state.dpr;
    const c = document.createElement('canvas');
    c.width = Math.round(LAID * d); c.height = Math.round(LAID * d);
    const g = c.getContext('2d');
    g.scale(d, d);
    let s = 11;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let y = 0.5; y < LAID; y += 2.5) { g.fillStyle = SH(0.006 + rnd() * 0.01); g.fillRect(0, y, LAID, 0.5); }
    for (const x of [44, 164]) {
      const gr = g.createLinearGradient(x - 1.5, 0, x + 1.5, 0);
      gr.addColorStop(0, SH(0)); gr.addColorStop(0.5, SH(0.012)); gr.addColorStop(1, SH(0));
      g.fillStyle = gr; g.fillRect(x - 1.5, 0, 3, LAID);
    }
    for (let i = 0; i < 2600; i++) { g.fillStyle = rnd() < 0.5 ? SH(rnd() * 0.03) : LIFT(rnd() * 0.35); g.fillRect(rnd() * LAID, rnd() * LAID, 0.7, 0.7); }
    return ctx.createPattern(c, 'repeat');
  }

  /* ------------------------------------------------------------ the relief: light pressed into paper */

  // SR_50M is a grey hillshade lit from the north-west; its flat ground is grey 206. Above that is
  // light (kept as white with alpha), below it is shade (kept as graphite with alpha).
  const FLAT = 206;
  const relief = { base: null, big: null, bigState: 0, tiles: new Map(), queue: [], working: false };
  function bake(data, w, h) {
    const hi = new ImageData(w, h), lo = new ImageData(w, h);
    const src = data.data, H1 = hi.data, L1 = lo.data;
    for (let i = 0; i < src.length; i += 4) {
      const d = src[i] - FLAT;
      H1[i] = 255; H1[i + 1] = 255; H1[i + 2] = 255;
      L1[i] = 27; L1[i + 1] = 34; L1[i + 2] = 43;
      if (d > 2) H1[i + 3] = Math.min(255, Math.pow((d - 2) / 46, 0.85) * 240);
      else if (d < -2) L1[i + 3] = Math.min(255, Math.pow((-d - 2) / 125, 0.8) * 225);
    }
    const mk = (id) => { const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').putImageData(id, 0, 0); return c; };
    return { hi: mk(hi), lo: mk(lo) };
  }
  async function loadRelief() {
    const img = new Image();
    img.src = '../vendor/relief/SR_50M-4096.jpg';
    await img.decode();
    // a phone has no use for the full width; half of it keeps memory light
    const w = narrow.matches ? 2048 : 4096, h = w / 2;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, 0, 0, w, h);
    const baked = bake(g.getImageData(0, 0, w, h), w, h);
    relief.base = { ...baked, w, h };
    state.settle = 4;
    queueDraw();
  }
  // close in, the 10800 px original is cut into 15° tiles as they are needed
  const TDEG = 15, TPX = 450;
  function loadBig() {
    if (relief.bigState || narrow.matches) return;
    relief.bigState = 1;
    const img = new Image();
    img.src = '../vendor/relief/SR_50M-10800.jpg';
    img.decode().then(() => { relief.big = img; relief.bigState = 2; queueDraw(); }).catch(() => { relief.bigState = 3; });
  }
  function bakeTile(i, j) {
    const c = document.createElement('canvas');
    c.width = TPX + 2; c.height = TPX + 2;
    const g = c.getContext('2d', { willReadFrequently: true });
    // one pixel of the neighbours around each tile, so no seam shows between them
    const sx = i * TPX - 1, sy = j * TPX - 1;
    const x0 = Math.max(0, sx), y0 = Math.max(0, sy);
    const x1 = Math.min(10800, sx + TPX + 2), y1 = Math.min(5400, sy + TPX + 2);
    g.drawImage(relief.big, x0, y0, x1 - x0, y1 - y0, x0 - sx, y0 - sy, x1 - x0, y1 - y0);
    return bake(g.getImageData(0, 0, TPX + 2, TPX + 2), TPX + 2, TPX + 2);
  }
  function work() {
    if (relief.working) return;
    relief.working = true;
    setTimeout(() => {
      let n = 0;
      while (relief.queue.length && n < 3) {
        const key = relief.queue.shift();
        if (relief.tiles.has(key)) continue;
        const [i, j] = key.split(',').map(Number);
        relief.tiles.set(key, bakeTile(i, j));
        n += 1;
      }
      // keep the most recent tiles; drop the oldest when there are many
      while (relief.tiles.size > 90) relief.tiles.delete(relief.tiles.keys().next().value);
      relief.working = false;
      if (relief.queue.length) work();
      queueDraw();
    }, 16);
  }

  // ready the fine relief for where a dive will land, before it gets there
  function primeTiles(z) {
    if (narrow.matches) return;
    loadBig();
    const { W, H } = state;
    const x0 = z.x, y0 = z.y + z.k * (H / 2 - W / 4), tw = (z.k * W) / 24, th = (z.k * W) / 24;
    const go2 = () => {
      if (relief.bigState !== 2) { if (relief.bigState === 1) setTimeout(go2, 120); return; }
      for (let i = clamp(Math.floor(-x0 / tw), 0, 23); i <= clamp(Math.floor((W - x0) / tw), 0, 23); i++)
        for (let j = clamp(Math.floor(-y0 / th), 0, 11); j <= clamp(Math.floor((H - y0) / th), 0, 11); j++) {
          const key = `${i},${j}`;
          if (!relief.tiles.has(key) && !relief.queue.includes(key)) relief.queue.unshift(key);
        }
      work();
    };
    go2();
  }

  function drawRelief(tt, dx, dy) {
    const { W, H, z, dpr } = state;
    const k = z.k;
    const x0 = z.x, y0 = z.y + k * (H / 2 - W / 4), ww = k * W, wh = ww / 2;
    const loA = 0.4 + 0.42 * tt, hiA = 0.78 + 0.22 * tt;
    const castL = 0.4 + 7 * tt, castA = 0.08 + 0.24 * tt;
    const pad = castL + 4;
    let parts = null;
    if (relief.bigState === 2 && relief.base && (ww * dpr) / relief.base.w > 1.6) {
      const tw = ww / 24, th = wh / 12;
      const i0 = clamp(Math.floor((-pad - x0) / tw), 0, 23), i1 = clamp(Math.floor((W + pad - x0) / tw), 0, 23);
      const j0 = clamp(Math.floor((-pad - y0) / th), 0, 11), j1 = clamp(Math.floor((H + pad - y0) / th), 0, 11);
      const list = [];
      let missing = false;
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
        const key = `${i},${j}`;
        const tile = relief.tiles.get(key);
        if (tile) { relief.tiles.delete(key); relief.tiles.set(key, tile); list.push({ tex: tile, sx: 1, sy: 1, sw: TPX, sh: TPX, x: x0 + i * tw, y: y0 + j * th, w: tw, h: th }); }
        else { missing = true; if (!relief.queue.includes(key)) relief.queue.push(key); }
      }
      if (missing) work();
      else parts = list;
    }
    if (!parts) {
      const b = relief.base;
      if (!b) return;
      // only the part of the texture that is on screen
      const sx0 = clamp(((-pad - x0) / ww) * b.w - 2, 0, b.w), sx1 = clamp(((W + pad - x0) / ww) * b.w + 2, 0, b.w);
      const sy0 = clamp(((-pad - y0) / wh) * b.h - 2, 0, b.h), sy1 = clamp(((H + pad - y0) / wh) * b.h + 2, 0, b.h);
      if (sx1 <= sx0 || sy1 <= sy0) return;
      parts = [{ tex: b, sx: sx0, sy: sy0, sw: sx1 - sx0, sh: sy1 - sy0, x: x0 + (sx0 / b.w) * ww, y: y0 + (sy0 / b.h) * wh, w: ((sx1 - sx0) / b.w) * ww, h: ((sy1 - sy0) / b.h) * wh }];
    }
    const blit = (key, ox, oy) => { for (const p of parts) ctx.drawImage(p.tex[key], p.sx, p.sy, p.sw, p.sh, p.x + ox, p.y + oy, p.w, p.h); };
    ctx.globalAlpha = loA; blit('lo', 0, 0);
    // the long shadow: the shade cast again along the light, longer as the sun drops
    ctx.globalAlpha = castA; blit('lo', dx * castL, dy * castL);
    ctx.globalAlpha = hiA; blit('hi', 0, 0);
    ctx.globalAlpha = 1;
  }

  /* ------------------------------------------------------------ drawing the sheet */

  const SEAS = [
    { id: 'pacific', ll: [6, 158] },
    { id: 'atlantic', ll: [27, -42] },
    { id: 'indian', ll: [-24, 76] },
    { id: 'southern', ll: [-60, 62] },
  ];

  // how deep the light is: 0 at the whole map, 1 when the map is drawn right in
  const depth = () => {
    const x = clamp(Math.log(state.z.k / state.kHome) / Math.log(16), 0, 1);
    return x * x * (3 - 2 * x);
  };

  function draw() {
    state.drawQueued = false;
    const { W, H, dpr, z } = state;
    const k = z.k;
    proj.scale(state.S0 * k).translate([z.x + (k * W) / 2, z.y + (k * H) / 2]).clipExtent([[-30, -30], [W + 30, H + 30]]);
    const fine = k * W > 6400 && state.land50;
    const land = fine ? state.land50 : state.land110;
    const feats = fine ? state.feats50 : state.feats110;
    const mesh = fine ? state.mesh50 : state.mesh110;
    const tt = depth();
    // the light comes from the upper left; it lowers as the map draws in, so shadows lengthen
    const th = ((45 - 16 * tt) * Math.PI) / 180;
    const dx = Math.cos(th), dy = Math.sin(th);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.imageSmoothingQuality = 'high';
    ctx.fillStyle = SHEET;
    ctx.fillRect(0, 0, W, H);

    if (land) {
      const gp = (geo) => { const p = new Path2D(); d3.geoPath(proj, p)(geo); return p; };
      const landP = gp(land);
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';

      // the land stands up from the sheet: a soft shadow falls from its lower-right edge
      const Ls = 1.1 + 3.6 * tt;
      ctx.save();
      ctx.translate(dx * Ls, dy * Ls);
      ctx.strokeStyle = SH(0.03); ctx.lineWidth = 5 + 5 * tt; ctx.stroke(landP);
      ctx.strokeStyle = SH(0.05); ctx.lineWidth = 2.4 + 1.5 * tt; ctx.stroke(landP);
      ctx.fillStyle = SH(0.06); ctx.fill(landP);
      ctx.restore();
      ctx.fillStyle = LAND; ctx.fill(landP);

      // his sixteen: one warm tint, under the relief so the mountains still read through it
      const been = [];
      for (const c of S.countries) {
        const f = feats[c.id] || state.feats110[c.id];
        if (!f) continue;
        const p = gp(f);
        been.push({ id: c.id, p });
        ctx.fillStyle = WARM; ctx.fill(p);
      }

      ctx.save();
      ctx.clip(landP);
      drawRelief(tt, dx, dy);

      // pressed deeper: shade on the upper-left inner wall, light on the lower-right
      const bw = 0.9 + 1.1 * tt;
      for (const b of been) {
        ctx.save();
        ctx.clip(b.p);
        ctx.translate(dx * bw, dy * bw);
        ctx.strokeStyle = SH(0.07 + 0.05 * tt); ctx.lineWidth = bw * 4; ctx.stroke(b.p);
        ctx.strokeStyle = SH(0.13 + 0.08 * tt); ctx.lineWidth = bw * 2; ctx.stroke(b.p);
        ctx.translate(-2 * dx * bw, -2 * dy * bw);
        ctx.strokeStyle = LIFT(0.75); ctx.lineWidth = bw * 2; ctx.stroke(b.p);
        ctx.restore();
      }
      // the raised land's own bevel: light on the upper-left edge, a faint shade on the lower-right
      const lw = 0.7 + 0.8 * tt;
      ctx.translate(dx * lw, dy * lw);
      ctx.strokeStyle = LIFT(1); ctx.lineWidth = lw * 2; ctx.stroke(landP);
      ctx.translate(-2 * dx * lw, -2 * dy * lw);
      ctx.strokeStyle = SH(0.09 + 0.05 * tt); ctx.lineWidth = lw * 2; ctx.stroke(landP);
      ctx.restore();

      // borders: blind lines, a dark hairline with its light edge just below
      if (mesh) {
        const m = gp(mesh);
        const a = fine ? 1 : 0.65;
        ctx.save();
        ctx.translate(0.5, 0.7);
        ctx.strokeStyle = LIFT(0.85 * a); ctx.lineWidth = 0.8; ctx.stroke(m);
        ctx.restore();
        ctx.strokeStyle = SH(0.085 * a); ctx.lineWidth = 0.6; ctx.stroke(m);
      }
      // the coast: one crisp edge
      ctx.strokeStyle = SH(0.2 + 0.06 * tt); ctx.lineWidth = 0.55; ctx.stroke(landP);
    }

    // the paper itself, over everything printed on it
    if (state.laid) {
      const o = (v) => ((v % LAID) + LAID) % LAID;
      state.laid.setTransform(new DOMMatrix().translateSelf(o(z.x), o(z.y)).scaleSelf(1 / dpr, 1 / dpr));
      ctx.fillStyle = state.laid;
      ctx.fillRect(0, 0, W, H);
    }

    // oceans, in pressed spaced capitals, fading as the map draws in
    const seaA = clamp((5 - k / state.kHome) / 2.5, 0, 1);
    if (seaA > 0 && !narrow.matches && !app.classList.contains('is-diving')) {
      ctx.save();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const zh = lang === 'zh';
      ctx.font = zh ? '500 12.5px "Noto Sans TC", sans-serif' : 'italic 400 13px "Alegreya Sans", sans-serif';
      try { ctx.letterSpacing = zh ? '7px' : '4px'; } catch (e) { /* older engines */ }
      for (const s of SEAS) {
        const p = P(s.ll);
        if (p[0] < -200 || p[0] > W + 200 || p[1] < -30 || p[1] > H + 30) continue;
        const label = zh ? T.zh.seas[s.id] : T.en.seas[s.id].toUpperCase();
        const x = p[0] + (zh ? 3.5 : 2);
        const half = ctx.measureText(label).width / 2;
        if (x - half < 8 || x + half > W - 8) continue;
        ctx.fillStyle = LIFT(0.95 * seaA); ctx.fillText(label, x, p[1] + 1);
        ctx.fillStyle = `rgba(75, 80, 88, ${seaA})`; ctx.fillText(label, x, p[1]);
      }
      ctx.restore();
    }

    // where each photograph was made, small pressed dimples once close enough to tell apart
    state.photoPts = [];
    if (k / state.kHome > 7 && !app.classList.contains('is-diving')) {
      for (const id of indexOrder) {
        const p = P(S.slides[id].ll);
        if (p[0] < -10 || p[1] < -10 || p[0] > W + 10 || p[1] > H + 10) continue;
        state.photoPts.push({ id, p });
        dimple(p[0], p[1], 3, 0.42);
      }
    }

    // the books: hairline leaders from where a book stands to its place, then the place's seal
    layoutPins();
    if (!app.classList.contains('is-diving')) {
      ctx.lineWidth = 0.7;
      ctx.strokeStyle = SH(0.42);
      for (const b of pinList) {
        if (Math.hypot(b.x - b.ax, b.y - b.ay) > 6) { ctx.beginPath(); ctx.moveTo(b.ax, b.ay); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      }
      for (const b of pinList) dimple(b.ax, b.ay, 3.4, 0.7);
    }

    // rings pressed around a place: hover, the dive tightening on its spot
    for (const r of state.rings) {
      if (r.a <= 0.01) continue;
      const p = P(r.ll);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(p[0] + 0.7, p[1] + 0.9, r.r, 0, Math.PI * 2); ctx.strokeStyle = LIFT(r.a); ctx.stroke();
      ctx.beginPath(); ctx.arc(p[0], p[1], r.r, 0, Math.PI * 2); ctx.strokeStyle = SH(0.55 * r.a); ctx.stroke();
    }

    if (state.settle > 0) { state.settle -= 1; queueDraw(); }
  }

  // a small pressed pit: light on its lower-right lip, shade inside its upper-left wall
  function dimple(x, y, r, dark) {
    ctx.beginPath(); ctx.arc(x + 0.6, y + 0.8, r + 0.4, 0, Math.PI * 2); ctx.fillStyle = LIFT(1); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = SH(dark * 0.5); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 0.55, y + 0.7, r * 0.72, 0, Math.PI * 2); ctx.fillStyle = SH(dark); ctx.fill();
  }

  function queueDraw() {
    if (state.drawQueued) return;
    state.drawQueued = true;
    requestAnimationFrame(draw);
  }

  /* ------------------------------------------------------------ moving the map */

  mapEl.addEventListener('dblclick', (e) => {
    if (e.target.closest('.book')) return;
    const r = mapEl.getBoundingClientRect();
    sel.transition().duration(reduce.matches ? 0 : 450).ease(d3.easeExpOut).call(zoom.scaleBy, e.shiftKey ? 0.5 : 2, [e.clientX - r.left, e.clientY - r.top]);
  });
  const constrain = (target) => zoom.constrain()(target, [[0, 0], [state.W, state.H]], zoom.translateExtent());
  function moveTo(target, dur = 900) {
    const transform = constrain(target);
    const d = reduce.matches ? 0 : dur;
    if (d === 0) sel.interrupt().call(zoom.transform, transform);
    else sel.interrupt().transition().duration(d).ease(d3.easeExpOut).call(zoom.transform, transform);
    return transform;
  }
  function fitTransform(lls, pad, kMax = 40) {
    const pts = lls.map((ll) => proj0([ll[1], ll[0]]));
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const { W, H } = state;
    const k = clamp(Math.min((W - pad.l - pad.r) / Math.max(1, x1 - x0), (H - pad.t - pad.b) / Math.max(1, y1 - y0)), 1, kMax);
    const sx = pad.l + (W - pad.l - pad.r) / 2, sy = pad.t + (H - pad.t - pad.b) / 2;
    return d3.zoomIdentity.translate(sx - ((x0 + x1) / 2) * k, sy - ((y0 + y1) / 2) * k).scale(k);
  }
  // every one of the sixteen in one glance
  // on a phone the sixteen cannot all be read at once; it opens on Asia and Oceania, where eleven
  // of them are, and the rest are a drag or a tap on Whole map away
  function homeTransform() {
    if (narrow.matches) {
      const near = order.filter((c) => c.continent === 'asia' || c.continent === 'oceania');
      return fitTransform(near.map((c) => placeLL(c.id)), { l: 34, r: 40, t: 150, b: 150 });
    }
    return fitTransform(order.map((c) => placeLL(c.id)), { l: 90, r: 90, t: 175, b: 120 });
  }
  function wholeTransform() {
    const pad = narrow.matches ? { l: 26, r: 26, t: 150, b: 150 } : { l: 90, r: 90, t: 175, b: 120 };
    return fitTransform(order.map((c) => placeLL(c.id)), pad);
  }
  function centerOn(ll, k, dur, area) {
    const p = proj0([ll[1], ll[0]]);
    const kk = k || state.z.k;
    const w = area ? area.w : state.W;
    moveTo(d3.zoomIdentity.translate(w / 2 - p[0] * kk, state.H / 2 + 20 - p[1] * kk).scale(kk), dur);
  }
  function inView(ll, margin = 0.12, w = state.W) {
    const p = P(ll);
    return p[0] > w * margin && p[0] < w * (1 - margin) && p[1] > state.H * margin && p[1] < state.H * (1 - margin);
  }
  // the dive lands with the country filling the window and its place at the centre
  function polygonAround(f, ll) {
    const g = f.geometry;
    if (!g) return f;
    if (g.type === 'Polygon') return f;
    const pt = [ll[1], ll[0]];
    let best = null, bestD = Infinity;
    for (const coordsP of g.coordinates) {
      const poly = { type: 'Polygon', coordinates: coordsP };
      if (d3.geoContains(poly, pt)) return poly;
      const d = d3.geoDistance(d3.geoCentroid(poly), pt);
      if (d < bestD) { bestD = d; best = poly; }
    }
    return best || f;
  }
  function diveTransform(cid) {
    const ll = placeLL(cid);
    const f = state.feats50[cid] || state.feats110[cid];
    let k = 24;
    if (f) {
      const b = d3.geoBounds(polygonAround(f, ll));
      const spanX = Math.min(Math.abs(b[1][0] - b[0][0]), 50), spanY = Math.min(Math.abs(b[1][1] - b[0][1]), 30);
      const lls = [[ll[0] - spanY / 2, ll[1] - spanX / 2], [ll[0] + spanY / 2, ll[1] + spanX / 2]];
      k = fitTransform(lls, { l: 60, r: 60, t: 80, b: 80 }).k * 0.92;
    }
    k = clamp(k, narrow.matches ? 5 : 7, 34);
    const p = proj0([ll[1], ll[0]]);
    return constrain(d3.zoomIdentity.translate(state.W / 2 - p[0] * k, state.H / 2 - p[1] * k).scale(k));
  }

  const zIn = $('#zoom-in'), zOut = $('#zoom-out'), zAll = $('#zoom-all');
  const zoomBy = (f) => sel.interrupt().transition().duration(reduce.matches ? 0 : 420).ease(d3.easeExpOut).call(zoom.scaleBy, f);
  zIn.addEventListener('click', () => zoomBy(2));
  zOut.addEventListener('click', () => zoomBy(0.5));
  zAll.addEventListener('click', () => moveTo(wholeTransform()));
  function updateZoomButtons() {
    zIn.disabled = state.z.k >= 39.9;
    zOut.disabled = state.z.k <= 1.001;
  }
  mapEl.addEventListener('keydown', (e) => {
    if (e.target !== mapEl) return;
    const step = 90;
    const pan = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }[e.key];
    if (pan) { e.preventDefault(); sel.interrupt().transition().duration(reduce.matches ? 0 : 260).ease(d3.easeExpOut).call(zoom.translateBy, pan[0] / state.z.k, pan[1] / state.z.k); }
    else if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomBy(2); }
    else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomBy(0.5); }
    else if (e.key === '0') { e.preventDefault(); moveTo(homeTransform()); }
  });

  /* ------------------------------------------------------------ books standing on the sheet */

  let pinList = [];
  const pinNote = (b) => {
    if (b.guide) return t('bookOpen');
    const n = photosOf(b.country).length;
    return n ? T[lang].photosN(n) : t('bandNone');
  };
  function renderPins() {
    const keep = new Map(pinList.map((p) => [p.id, p]));
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
        `<div class="pin__stage"><a class="book book--${b.tone}" href="#${b.view}" aria-label="${esc(`${L(b.title)}: ${pinNote(b)}`)}"><span class="book__box">` +
        `<span class="book__spine"><b>${title}</b><i>${esc(t('series'))}</i></span>` +
        `${face}<span class="book__band"><b>${title}</b><span>${esc(t(b.band))}</span></span></span>` +
        `<span class="book__back"><i>${esc(t('series'))}</i></span><span class="book__edge"></span>` +
        `<span class="book__top"></span><span class="book__shadow"></span></span></a></div>` +
        `<div class="pin__label" aria-hidden="true"><b>${title}</b><span>${esc(pinNote(b))}</span></div>`;
      pinsEl.appendChild(el);
      const prev = keep.get(b.id);
      return { id: b.id, country: c.id, book: b, el, ll: placeLL(c.id), x: prev ? prev.x : NaN, y: prev ? prev.y : NaN, ax: 0, ay: 0, lw: 0 };
    });
    measurePins();
    bindPins();
  }
  function measurePins() { for (const p of pinList) p.lw = p.el.querySelector('.pin__label').offsetWidth; }

  function bookScale() {
    const small = narrow.matches;
    const r = state.z.k / state.kHome;
    return Math.min(small ? 0.28 : 0.44, (small ? 0.15 : 0.245) * Math.pow(r, 0.3));
  }
  function layoutPins() {
    const s = bookScale();
    const small = narrow.matches;
    const bw = 192 * s, bh = 272 * s;
    const below = small ? 6 : 22;
    for (const p of pinList) {
      const a = P(p.ll);
      p.ax = a[0]; p.ay = a[1];
      if (Number.isNaN(p.x)) { p.x = p.ax; p.y = p.ay; }
      p.hw = small ? bw / 2 + 2 : Math.max(bw / 2 + 3, p.lw / 2 + 2);
    }
    // pulled toward its place, pushed apart from its neighbours: books never cover each other
    const pull = 0.3;
    for (const p of pinList) { p.x += (p.ax - p.x) * pull; p.y += (p.ay - p.y) * pull; }
    for (let it = 0; it < 12; it++) {
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
    // a book whose place is on screen stays on screen
    for (const p of pinList) {
      if (p.ax < 0 || p.ax > state.W || p.ay < 0 || p.ay > state.H) continue;
      const half = Math.max(bw / 2, p.lw / 2) + 6;
      p.x = clamp(p.x, half, state.W - half);
      p.y = clamp(p.y, bh + 70, state.H - 30);
    }
    // names that would sit on another book or name stay hidden until their book wakes
    const taken = [];
    for (const p of pinList) {
      const r = [p.x - p.lw / 2, p.y + 4, p.x + p.lw / 2, p.y + 20];
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

  /* ------------------------------------------------------------ what is in hand: a pressed ring */

  let active = null;
  let clearTimer = 0;
  let hoverRing = null;
  let hoverTween = null;
  const activeCountry = () => (active ? active.country || (active.slide && S.slides[active.slide].country) : null);
  function setActive(next) {
    if (diving) return;
    clearTimeout(clearTimer);
    if (active && next && active.country === next.country && active.slide === next.slide) return;
    active = next;
    const cid = activeCountry();
    pinList.forEach((p) => p.el.classList.toggle('awake', p.country === cid));
    $$('.group', indexBody).forEach((g) => g.classList.toggle('is-awake', g.dataset.country === cid));
    const ll = next.slide ? S.slides[next.slide].ll : placeLL(cid);
    if (hoverRing) state.rings = state.rings.filter((r) => r !== hoverRing);
    hoverRing = { ll, r: next.slide ? 10 : 15, a: 0 };
    state.rings.push(hoverRing);
    if (hoverTween) hoverTween.cancel();
    const ring = hoverRing, r1 = ring.r;
    hoverTween = tween(reduce.matches ? 1 : 420, (e) => { ring.a = e; ring.r = r1 * (1.6 - 0.6 * e); queueDraw(); });
    if (next.slide && narrow.matches === false) {
      const p = P(ll);
      tip.textContent = L(S.slides[next.slide].place);
      tip.style.setProperty('--x', `${p[0].toFixed(1)}px`);
      tip.style.setProperty('--y', `${(p[1] - 6).toFixed(1)}px`);
      tip.classList.add('is-on');
    } else tip.classList.remove('is-on');
  }
  function clearActive() {
    active = null;
    pinList.forEach((p) => p.el.classList.remove('awake'));
    $$('.group.is-awake', indexBody).forEach((g) => g.classList.remove('is-awake'));
    tip.classList.remove('is-on');
    if (hoverRing) {
      const ring = hoverRing;
      hoverRing = null;
      if (hoverTween) hoverTween.cancel();
      const a0 = ring.a;
      hoverTween = tween(reduce.matches ? 1 : 240, (e) => { ring.a = a0 * (1 - e); queueDraw(); }, () => { state.rings = state.rings.filter((r) => r !== ring); queueDraw(); });
    }
  }
  function clearActiveSoon() {
    clearTimeout(clearTimer);
    clearTimer = setTimeout(clearActive, 160);
  }

  // hovering the sheet itself: a photograph's dimple, a place's seal, or one of the sixteen
  function hitTest(x, y) {
    let best = null, bd = 10;
    for (const q of state.photoPts) { const d = Math.hypot(q.p[0] - x, q.p[1] - y); if (d < bd) { bd = d; best = q.id; } }
    if (best) return { slide: best };
    for (const p of pinList) if (Math.hypot(p.ax - x, p.ay - y) < 12) return { country: p.country };
    const ll = proj.invert([x, y]);
    if (!ll) return null;
    const fine = state.z.k * state.W > 6400 && state.land50;
    const feats = fine ? state.feats50 : state.feats110;
    for (const c of S.countries) { const f = feats[c.id]; if (f && d3.geoContains(f, ll)) return { country: c.id }; }
    return null;
  }
  let hoverQueued = false, lastMove = null;
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
      mapEl.style.cursor = hit ? 'pointer' : '';
      if (hit) setActive(hit);
      else if (active) clearActiveSoon();
    });
  });
  mapEl.addEventListener('pointerleave', () => { mapEl.style.cursor = ''; clearActiveSoon(); });
  mapEl.addEventListener('click', (e) => {
    if (e.target.closest('.book') || e.defaultPrevented || diving) return;
    const r = mapEl.getBoundingClientRect();
    const hit = hitTest(e.clientX - r.left, e.clientY - r.top);
    if (!hit) return;
    if (hit.slide) go(bookByCountry[S.slides[hit.slide].country].view, { cover: hit.slide });
    else go(bookByCountry[hit.country].view);
  });

  /* ------------------------------------------------------------ the index of photographs: a drawer */

  function renderIndex() {
    $('#index-count').textContent = T[lang].count(indexOrder.length, order.length);
    $('#index-n').textContent = String(indexOrder.length);
    indexBody.innerHTML = order.map((c) => {
      const b = bookByCountry[c.id];
      const ids = photosOf(c.id);
      const thumbs = ids.map((id) => {
        const s = S.slides[id];
        return `<li><button type="button" class="thumb" data-slide="${id}" aria-label="${esc(T[lang].coverOf(L(s.place)))}">` +
          `<img src="${imgSrc(s, 640)}" alt="" width="${s.w}" height="${s.h}" loading="lazy" decoding="async">` +
          `<span class="thumb__name">${esc(L(s.place))}</span></button></li>`;
      }).join('');
      return `<section class="group" data-country="${c.id}" aria-labelledby="g-${c.id}">` +
        `<div class="group__head"><h3><button type="button" class="group__name" id="g-${c.id}" data-view="${b.view}">${nameHTML(c.id)}</button></h3>` +
        `<span class="group__meta">${esc(L(c.date))}</span></div>` +
        (thumbs ? `<ul class="thumbs">${thumbs}</ul>` : `<p class="group__none">${esc(t('bandNone'))}</p>`) +
        `</section>`;
    }).join('');
  }
  let indexOpen = false;
  function openIndex(byKey) {
    if (indexOpen) return;
    indexOpen = true;
    indexEl.inert = false;
    indexEl.classList.add('is-open');
    indexBtn.setAttribute('aria-expanded', 'true');
    if (byKey) requestAnimationFrame(() => $('#index-close').focus({ preventScroll: true }));
  }
  function closeIndex(focusBack = true) {
    if (!indexOpen) return;
    indexOpen = false;
    indexEl.classList.remove('is-open');
    indexEl.inert = true;
    indexBtn.setAttribute('aria-expanded', 'false');
    clearActive();
    if (focusBack) indexBtn.focus({ preventScroll: true });
  }
  indexBtn.addEventListener('click', (e) => (indexOpen ? closeIndex() : openIndex(e.detail === 0)));
  $('#index-close').addEventListener('click', () => closeIndex());
  const drawerArea = () => (indexOpen && !narrow.matches ? { w: state.W - indexEl.offsetWidth } : null);
  function indexHover(el) {
    const th = el.closest('.thumb'), gn = el.closest('.group__name');
    if (th) {
      setActive({ slide: th.dataset.slide });
      const ll = S.slides[th.dataset.slide].ll, area = drawerArea();
      if (area && !inView(ll, 0.1, area.w)) centerOn(ll, state.z.k, 900, area);
    } else if (gn) {
      const cid = gn.closest('.group').dataset.country;
      setActive({ country: cid });
      const area = drawerArea();
      if (area && !inView(placeLL(cid), 0.1, area.w)) centerOn(placeLL(cid), state.z.k, 900, area);
    }
  }
  indexBody.addEventListener('pointerover', (e) => { if (e.pointerType === 'mouse') indexHover(e.target); });
  indexBody.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') clearActiveSoon(); });
  indexBody.addEventListener('focusin', (e) => indexHover(e.target));
  indexBody.addEventListener('click', (e) => {
    if (diving) return;
    const th = e.target.closest('.thumb'), gn = e.target.closest('.group__name');
    if (th) { const s = S.slides[th.dataset.slide]; closeIndex(false); go(bookByCountry[s.country].view, { cover: th.dataset.slide }); }
    else if (gn) { closeIndex(false); go(gn.dataset.view); }
  });

  /* ------------------------------------------------------------ the pages */

  let page = null;       // 'guide-barcelona' | 'place-<id>'
  let pageCover = null;  // a photograph chosen from the index, opening the page instead of the usual cover
  let diving = false;
  let tocIO = null;

  const viewCountry = (view) => (view.startsWith('guide-') ? (S.guides[view.slice(6)] ? S.guides[view.slice(6)].country : null) : view.slice(6));
  const validView = (view) => !!view && ((view.startsWith('guide-') && !!S.guides[view.slice(6)]) || (view.startsWith('place-') && !!countries[view.slice(6)]));

  function coverHTML(cid, view, coverId) {
    const c = countries[cid];
    const on = coverId ? `<button type="button" class="word cover__on" data-on>${esc(view.startsWith('guide-') ? t('bookOpen') : T[lang].seePhotos)}</button>` : '';
    const cap = `<div class="cover__cap"><p class="cover__note">${esc(L(c.note))}</p><p class="cover__name">${nameHTML(cid)}</p><p class="cover__ll">${esc(coords(placeLL(cid)))}</p>${on}</div>`;
    if (!coverId) return `<section class="cover cover--none">${cap}</section>`;
    const s = S.slides[coverId];
    return `<section class="cover"><img class="cover__img" id="cover-img" src="${imgSrc(s, 1280)}" srcset="${srcset(s)}" sizes="100vw" width="${s.w}" height="${s.h}" alt="${esc(L(s.alt))}" decoding="async" fetchpriority="high"><div class="cover__shade"></div>${cap}</section>`;
  }
  const pageEnd = () => `<footer class="page-end"><button type="button" class="word" data-back>${esc(t('back'))}</button>` +
    `<a class="ig" href="${esc(S.instagram.url)}" target="_blank" rel="noopener"><span>${esc(t('follow'))}</span> <b>${esc(S.instagram.handle)}</b></a></footer>`;

  function fillGuide(root, dict) {
    const place = (id) => (S.slides[id] ? L(S.slides[id].place) : '');
    $$('[data-i18n]', root).forEach((n) => {
      const k = n.dataset.i18n;
      let v = dict[k];
      if (v == null && k.startsWith('sp_')) v = place(k.slice(3));
      if (v == null) v = guide.i18n.en[k];
      if (v != null) n.textContent = v;
    });
    $$('[data-i18n-html]', root).forEach((n) => { const v = dict[n.dataset.i18nHtml]; if (v != null) n.innerHTML = v; });
    $$('[data-i18n-alt]', root).forEach((n) => {
      const id = n.dataset.i18nAlt.replace(/^sa_/, '');
      n.alt = S.slides[id] ? L(S.slides[id].alt) : (dict[n.dataset.i18nAlt] || n.alt);
    });
    $$('[data-i18n-aria]', root).forEach((n) => {
      const k = n.dataset.i18nAria;
      if (k.startsWith('sl_')) n.setAttribute('aria-label', T[lang].made(place(k.slice(3))));
      else if (dict[k]) n.setAttribute('aria-label', dict[k]);
    });
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) if (/[–—]/.test(n.nodeValue)) n.nodeValue = clean(n.nodeValue);
  }

  function renderGuide(cid, view, coverId) {
    leafContent.innerHTML = coverHTML(cid, view, coverId) + `<article class="guide">${guide.html}</article>`;
    fillGuide(leafContent, guide.i18n[lang] || guide.i18n.en);
    const h1 = $('h1', leafContent);
    h1.id = 'leaf-title';
    h1.tabIndex = -1;
    const meta = $('.guide-top .meta', leafContent);
    if (meta) meta.insertAdjacentHTML('afterend', `<p class="guide-facts">${esc(L(guide.facts))}</p>`);
    $('.wrap', leafContent).insertAdjacentHTML('beforeend', pageEnd());
    tocWatch();
  }

  function rowsOf(ids) {
    const target = narrow.matches ? 1 : 2.7;
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
  function renderPlace(cid, view, coverId) {
    const c = countries[cid], ids = photosOf(cid);
    const b = bookByCountry[cid];
    let body;
    if (ids.length) {
      body = `<div class="rows">${rowsOf(ids).map((r) => `<div class="row">${r.row.map(([id, ar]) => {
        const s = S.slides[id];
        return `<figure class="piece" data-ar="${ar.toFixed(4)}"><button type="button" data-slide="${id}" aria-label="${esc(T[lang].made(L(s.place)))}">` +
          `<img src="${imgSrc(s, 1280)}" srcset="${srcset(s)}" sizes="(max-width: 48rem) 94vw, 40vw" width="${s.w}" height="${s.h}" alt="${esc(L(s.alt))}" loading="lazy" decoding="async" data-ar="${ar.toFixed(4)}"></button>` +
          `<figcaption><b>${esc(L(s.place))}</b><span>${esc(L(s.where))}</span></figcaption></figure>`;
      }).join('')}${r.last && r.sum < 2.2 && !narrow.matches ? `<span class="piece" aria-hidden="true" data-ar="${(2.7 - r.sum).toFixed(4)}"></span>` : ''}</div>`).join('')}</div>`;
    } else {
      body = `<div class="no-photos"><b>${esc(t('bandNone'))}</b></div>`;
    }
    const title = L(b.title);
    leafContent.innerHTML = coverHTML(cid, view, coverId) + `<div class="wrap">` +
      `<header class="place-top"><h1 class="page-title" id="leaf-title" tabindex="-1">${esc(title)}</h1>` +
      `<p class="meta">${esc(title !== L(c.name) ? `${L(c.name)}, ` : '')}${esc(L(c.date))}${ids.length ? `, ${esc(T[lang].photosN(ids.length))}` : ''}</p>` +
      (ids.length ? `<p class="page-lede">${esc(L(c.note))}</p>` : '') +
      `<p class="quiet-line">${esc(t('bookNot'))}</p></header>${body}${pageEnd()}</div>`;
    $$('[data-ar]', leafContent).forEach((n) => n.style.setProperty('--ar', n.dataset.ar));
  }

  function renderLeaf(view) {
    const cid = viewCountry(view);
    const coverId = coverIdOf(cid, pageCover);
    if (tocIO) { tocIO.disconnect(); tocIO = null; }
    if (view.startsWith('guide-')) renderGuide(cid, view, coverId);
    else renderPlace(cid, view, coverId);
    return coverId;
  }

  function tocWatch() {
    const links = $$('.toc a', leafContent);
    if (!links.length || !('IntersectionObserver' in window)) return;
    const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    tocIO = new IntersectionObserver((es) => {
      for (const e of es) {
        if (!e.isIntersecting) continue;
        links.forEach((a) => a.removeAttribute('aria-current'));
        const a = byId.get(e.target.id);
        if (a) a.setAttribute('aria-current', 'true');
      }
    }, { root: leafScroll, rootMargin: '0px 0px -70% 0px' });
    byId.forEach((a, id) => { const h = leafContent.querySelector(`#${CSS.escape(id)}`); if (h) tocIO.observe(h); });
  }

  leafContent.addEventListener('click', (e) => {
    const el = e.target.closest('a, button');
    if (!el) return;
    if (el.dataset.slide) {
      e.preventDefault();
      const list = $$('[data-slide]', leafContent).map((x) => x.dataset.slide).filter((v, i, arr) => arr.indexOf(v) === i);
      openViewer(el.dataset.slide, list);
      return;
    }
    if (el.hasAttribute('data-back')) { back(); return; }
    if (el.hasAttribute('data-on')) {
      const target = $('.wrap', leafContent);
      if (target) target.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' });
      const h1 = $('#leaf-title');
      if (h1) h1.focus({ preventScroll: true });
      return;
    }
    const href = el.getAttribute('href') || '';
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

  /* ------------------------------------------------------------ the dive: draw in, deepen, dissolve */

  let pageGen = 0;
  let timers = [];
  let anims = [];
  let tweens = [];
  let diveRing = null;
  const later = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); return id; };
  function stopAll() {
    timers.forEach(clearTimeout); timers = [];
    anims.forEach((a) => a.cancel()); anims = [];
    tweens.forEach((x) => x.cancel()); tweens = [];
    if (diveRing) { state.rings = state.rings.filter((r) => r !== diveRing); diveRing = null; }
    leaf.classList.remove('is-masked');
  }
  const farCorner = (x, y) => Math.max(Math.hypot(x, y), Math.hypot(innerWidth - x, y), Math.hypot(x, innerHeight - y), Math.hypot(innerWidth - x, innerHeight - y));
  const setMask = (x, y, r) => {
    leaf.style.setProperty('--mx', `${x.toFixed(1)}px`);
    leaf.style.setProperty('--my', `${y.toFixed(1)}px`);
    leaf.style.setProperty('--mr', `${r.toFixed(1)}px`);
  };

  function openPage(view, opts = {}) {
    pageGen += 1;
    const gen = pageGen;
    stopAll();
    const cid = viewCountry(view);
    const ll = placeLL(cid);
    page = view;
    pageCover = opts.cover || null;
    const coverId = renderLeaf(view);
    leafScroll.scrollTop = 0;
    app.inert = true;
    closeIndex(false);
    clearActive();
    live.textContent = T[lang].opening(L(bookByCountry[cid].title));
    if (!diving) state.before = state.z;
    diving = true;
    app.classList.add('is-diving');
    const landing = diveTransform(cid);
    primeTiles(landing);
    const img = $('#cover-img', leafContent);

    if (opts.animate && !reduce.matches) {
      // 1. the map draws in; a ring pressed into the paper tightens on the spot
      moveTo(landing, 2000);
      diveRing = { ll, r: 96, a: 0 };
      state.rings.push(diveRing);
      const ring = diveRing;
      tweens.push(tween(2000, (e) => { ring.r = 16 + 80 * (1 - e); ring.a = Math.min(1, e * 4); queueDraw(); }));
      // 2. as it settles, the photograph dissolves in through a wide soft opening on the spot
      later(() => {
        if (gen !== pageGen) return;
        const [sx, sy] = P(ll, landing);
        const R = farCorner(sx, sy) / 0.55 + 24;
        setMask(sx, sy, 0);
        leaf.classList.add('is-masked', 'is-arriving');
        leaf.hidden = false;
        app.classList.add('is-soft');
        if (img) {
          img.style.setProperty('--ox', `${((sx / innerWidth) * 100).toFixed(1)}%`);
          img.style.setProperty('--oy', `${((sy / innerHeight) * 100).toFixed(1)}%`);
          anims.push(img.animate([{ filter: 'blur(12px)', transform: 'scale(1.05)' }, { filter: 'blur(0px)', transform: 'scale(1)' }], { duration: 1600, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'both' }));
        } else {
          anims.push(leafContent.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1400, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'both' }));
        }
        tweens.push(tween(1600, (e) => { setMask(sx, sy, R * e); ring.a = 1 - e; queueDraw(); }, () => {
          if (gen !== pageGen) return;
          leaf.classList.remove('is-masked');
          // 3. last, the name and the place fade in at the bottom edge
          leaf.classList.remove('is-arriving');
          anims.forEach((a) => a.cancel()); anims = [];
          state.rings = state.rings.filter((r) => r !== ring); diveRing = null;
          $('#leaf-back').focus({ preventScroll: true });
        }, inOut));
      }, 1250);
    } else {
      moveTo(landing, 0);
      app.classList.add('is-soft');
      leaf.hidden = false;
      leaf.classList.remove('is-arriving', 'is-masked');
      if (opts.animate) anims.push(leaf.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, easing: 'ease-out' }));
      requestAnimationFrame(() => $('#leaf-back').focus({ preventScroll: true }));
    }
  }

  function closePage(opts = {}) {
    if (!page) return;
    pageGen += 1;
    const gen = pageGen;
    stopAll();
    const cid = viewCountry(page);
    const ll = placeLL(cid);
    const pin = pinList.find((p) => p.country === cid);
    page = null;
    pageCover = null;
    if (tocIO) { tocIO.disconnect(); tocIO = null; }
    const backTo = state.before || homeTransform();
    const done = () => {
      leaf.hidden = true;
      leaf.classList.remove('is-masked', 'is-arriving');
      leafContent.textContent = '';
      app.inert = false;
    };
    const surface = (animate) => {
      diving = false;
      state.before = null;
      app.classList.remove('is-soft', 'is-quick');
      moveTo(backTo, animate ? 1500 : 0);
      if (animate) later(() => { app.classList.remove('is-diving'); queueDraw(); }, 380);
      else app.classList.remove('is-diving');
      if (pin && opts.focus !== false) pin.el.querySelector('.book').focus({ preventScroll: true });
    };
    if (opts.animate && !reduce.matches) {
      // the same, reversed and a little quicker: the words go first, then the photograph
      // dissolves back into its spot, then the map lets go
      leaf.classList.add('is-arriving');
      later(() => {
        if (gen !== pageGen) return;
        const [sx, sy] = P(ll);
        const R = farCorner(sx, sy) / 0.55 + 24;
        setMask(sx, sy, R);
        leaf.classList.add('is-masked');
        app.classList.add('is-quick');
        app.classList.remove('is-soft');
        const img = $('#cover-img', leafContent);
        if (img && leafScroll.scrollTop < innerHeight) anims.push(img.animate([{ filter: 'blur(0px)', transform: 'scale(1)' }, { filter: 'blur(12px)', transform: 'scale(1.05)' }], { duration: 1150, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'both' }));
        const ring = { ll, r: 16, a: 0 };
        state.rings.push(ring);
        tweens.push(tween(1150, (e) => { setMask(sx, sy, R * (1 - e)); ring.a = e; queueDraw(); }, () => {
          if (gen !== pageGen) return;
          anims.forEach((a) => a.cancel()); anims = [];
          done();
          surface(true);
          tweens.push(tween(1300, (e) => { ring.r = 16 + 70 * e; ring.a = 1 - e; queueDraw(); }, () => { state.rings = state.rings.filter((r) => r !== ring); queueDraw(); }));
        }, inOut));
      }, 260);
    } else {
      done();
      surface(false);
    }
  }

  /* ------------------------------------------------------------ the viewer */

  let photo = null;
  let photoList = indexOrder;
  const vImg = document.createElement('img');
  vImg.id = 'viewer-img';
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
    const b = bookByCountry[s.country];
    const seeAll = b && page !== b.view ? `<button type="button" class="word viewer__go" data-view="${b.view}">${esc(T[lang].seeAll(L(b.title)))}</button>` : '';
    $('#viewer-text').innerHTML =
      `<h2 id="viewer-title">${esc(L(s.place))}</h2>` +
      `<p class="viewer__where">${esc(L(s.where))}</p>` +
      `<p class="viewer__ll">${esc(coords(s.ll))}</p>` +
      (rows ? `<dl class="spec" aria-label="${esc(t('made'))}">${rows}</dl>` : '') +
      (s.best ? `<p class="viewer__note"><b>${esc(t('best'))}</b>${esc(L(s.best))}</p>` : '') +
      (s.note ? `<p class="viewer__note">${esc(L(s.note))}</p>` : '') +
      seeAll +
      `<p class="viewer__count">${esc(T[lang].ofN(i + 1, photoList.length))}</p>`;
    $('#viewer-prev').disabled = photoList.length < 2;
    $('#viewer-next').disabled = photoList.length < 2;
  }
  function showViewer(id, list) {
    photo = id;
    photoList = list && list.includes(id) ? list : indexOrder;
    renderViewer();
    const was = viewer.hidden;
    viewer.hidden = false;
    app.inert = true;
    leaf.inert = true;
    if (was) requestAnimationFrame(() => $('#viewer-close').focus({ preventScroll: true }));
  }
  function hideViewer() {
    if (!photo) return;
    const id = photo;
    photo = null;
    viewer.hidden = true;
    leaf.inert = false;
    app.inert = !!page;
    if (page) { const el = leafContent.querySelector(`[data-slide="${id}"]`); (el || $('#leaf-back')).focus({ preventScroll: false }); }
  }
  function step(d) {
    const i = photoList.indexOf(photo), n = photoList.length;
    photo = photoList[(i + d + n) % n];
    renderViewer();
    try { history.replaceState({ ...(history.state || {}), emboss: true, photo, page }, '', `#photo-${photo}`); } catch (e) { /* fine */ }
  }
  $('#viewer-prev').addEventListener('click', () => step(-1));
  $('#viewer-next').addEventListener('click', () => step(1));
  $('#viewer-close').addEventListener('click', () => back());
  $('#viewer-text').addEventListener('click', (e) => {
    const g = e.target.closest('.viewer__go');
    if (!g) return;
    const view = g.dataset.view;
    hideViewer();
    try { history.replaceState({ emboss: true, page: view }, '', `#${view}`); } catch (err) { /* fine */ }
    if (page) closePage({ animate: false, focus: false });
    openPage(view, { animate: true });
  });
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

  /* ------------------------------------------------------------ every page has an address */

  function parse(hash) {
    const h = decodeURIComponent((hash || '').replace(/^#/, ''));
    const st = history.state || {};
    if (h.startsWith('photo-') && S.slides[h.slice(6)]) return { page: validView(st.page) ? st.page : null, cover: st.cover || null, photo: h.slice(6) };
    if (validView(h)) return { page: h, cover: st.cover || null, photo: null };
    return { page: null, cover: null, photo: null };
  }
  function apply(want, animate) {
    if (photo && want.photo !== photo) hideViewer();
    if (want.page !== page) {
      if (page) closePage({ animate: animate && !want.page, focus: !want.page });
      if (want.page) openPage(want.page, { animate, cover: want.cover });
    }
    if (want.photo && want.photo !== photo) showViewer(want.photo, photoList);
  }
  function go(view, opts = {}) {
    if (page === view || diving || opening) return;
    try { history.pushState({ emboss: true, page: view, cover: opts.cover || null }, '', `#${view}`); } catch (e) { /* fine */ }
    openPage(view, { animate: true, cover: opts.cover });
  }
  function openViewer(id, list) {
    try { history.pushState({ emboss: true, page, cover: pageCover, photo: id }, '', `#photo-${id}`); } catch (e) { /* fine */ }
    showViewer(id, list);
  }
  function back() {
    if (history.state && history.state.emboss) history.back();
    else {
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* fine */ }
      apply({ page: null, photo: null }, true);
    }
  }
  window.addEventListener('popstate', () => apply(parse(location.hash), true));
  $('#leaf-back').addEventListener('click', () => back());
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (opening) { finishOpening(); return; }
    if (photo || page) { e.preventDefault(); back(); }
    else if (indexOpen) { e.preventDefault(); closeIndex(); }
  });

  /* ------------------------------------------------------------ the flights: a small paper globe */

  const FROM = [121.56, 25.03];
  const routes = order.filter((c) => c.id !== 'taiwan').map((c, i) => {
    const ll = placeLL(c.id);
    const to = [ll[1], ll[0]];
    const dist = d3.geoDistance(FROM, to);
    return { to, dist, interp: d3.geoInterpolate(FROM, to), i, h: 0.05 + (0.15 * dist) / Math.PI };
  });
  const TAIL = 0.42;

  // a paper ball lit from the upper left, the land raised on it, flights in vermilion
  function drawGlobe(g, o) {
    const { cx, cy, R, rot, time, stagger, durBase, alpha = 1, landGeo } = o;
    const fa = o.flightAlpha != null ? o.flightAlpha : 1;
    const FL = (a) => FLIGHT(a * fa);
    const u = R / 98; // line weights grow with the ball
    g.save();
    g.globalAlpha = alpha;
    // the ball's cast shadow on the sheet
    const sh = g.createRadialGradient(cx + R * 0.14, cy + R * 0.2, R * 0.6, cx + R * 0.14, cy + R * 0.2, R * 1.12);
    sh.addColorStop(0, SH(0.16)); sh.addColorStop(1, SH(0));
    g.fillStyle = sh; g.beginPath(); g.arc(cx + R * 0.14, cy + R * 0.2, R * 1.12, 0, Math.PI * 2); g.fill();
    // the ball
    const ball = g.createRadialGradient(cx - R * 0.38, cy - R * 0.42, R * 0.05, cx - R * 0.1, cy - R * 0.1, R * 1.08);
    ball.addColorStop(0, 'rgb(253, 253, 254)'); ball.addColorStop(0.55, 'rgb(240, 242, 245)'); ball.addColorStop(1, 'rgb(214, 218, 224)');
    g.fillStyle = ball; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
    const pr = d3.geoOrthographic().scale(R).translate([cx, cy]).rotate([-rot[0], -rot[1]]).clipAngle(90).precision(0.6);
    const gp = d3.geoPath(pr, g);
    g.save();
    g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.clip();
    // graticule, blind
    g.beginPath(); gp(d3.geoGraticule().step([30, 30])()); g.strokeStyle = SH(0.06); g.lineWidth = 0.6 * u; g.stroke();
    if (landGeo) {
      g.save(); g.translate(0.9 * u, 1.1 * u);
      g.beginPath(); gp(landGeo); g.fillStyle = SH(0.1); g.fill();
      g.restore();
      g.beginPath(); gp(landGeo);
      g.fillStyle = LIFT(0.62); g.fill();
      g.strokeStyle = SH(0.16); g.lineWidth = 0.5 * u; g.stroke();
    }
    g.restore();
    // the rim: shade below, light above
    g.beginPath(); g.arc(cx, cy, R - 0.5, 0, Math.PI * 2); g.strokeStyle = SH(0.16); g.lineWidth = 0.8 * u; g.stroke();
    g.beginPath(); g.arc(cx, cy, R - 1.6 * u, Math.PI * 1.05, Math.PI * 1.7); g.strokeStyle = LIFT(0.9); g.lineWidth = 1.2 * u; g.stroke();

    // the flights
    if (time != null) {
      const rr = d3.geoRotation([-rot[0], -rot[1]]);
      const toScreen = (lonlat, m) => {
        const q = rr(lonlat);
        const la = (q[1] * Math.PI) / 180, lo = (q[0] * Math.PI) / 180;
        const x = Math.cos(la) * Math.sin(lo), y = Math.sin(la), zz = Math.cos(la) * Math.cos(lo);
        const vis = zz > 0 || m * Math.hypot(x, y) > 1;
        return [cx + R * m * x, cy - R * m * y, vis];
      };
      for (const r of routes) {
        const dur = durBase * (0.65 + (0.7 * r.dist) / Math.PI);
        const q = (time - r.i * stagger) / dur;
        if (q <= 0) continue;
        const head = Math.min(1, q), tail = clamp(q - TAIL, 0, 1);
        const fade = o.trace != null ? o.trace : 1;
        // the trace it leaves: a hairline of the whole way flown so far
        if (fade > 0) {
          g.beginPath();
          let on = false;
          const n = 48;
          for (let i = 0; i <= n * head; i++) {
            const s = i / n;
            const [x, y, vis] = toScreen(r.interp(s), 1 + r.h * Math.sin(Math.PI * s));
            if (!vis) { on = false; continue; }
            if (on) g.lineTo(x, y); else { g.moveTo(x, y); on = true; }
          }
          g.strokeStyle = FL(0.26 * fade); g.lineWidth = 0.7 * u; g.stroke();
        }
        // the bright head and its fading tail
        if (tail < 1) {
          const n = 26;
          let prev = null;
          for (let i = 0; i <= n; i++) {
            const s = tail + ((head - tail) * i) / n;
            const pt = toScreen(r.interp(s), 1 + r.h * Math.sin(Math.PI * s));
            if (prev && pt[2] && prev[2]) {
              const a = i / n;
              g.beginPath(); g.moveTo(prev[0], prev[1]); g.lineTo(pt[0], pt[1]);
              g.strokeStyle = FL(0.95 * a * a); g.lineWidth = (0.6 + 1.1 * a) * u; g.stroke();
            }
            prev = pt;
          }
          if (head < 1 && prev && prev[2]) {
            g.beginPath(); g.arc(prev[0], prev[1], 1.7 * u, 0, Math.PI * 2);
            g.shadowColor = FL(0.8); g.shadowBlur = 6 * u; g.fillStyle = 'rgb(255, 214, 196)'; g.fill(); g.shadowBlur = 0;
          }
        }
        // a small ripple where it lands
        if (q >= 1) {
          const land = (q - 1) * dur;
          const end = toScreen(r.to, 1);
          if (end[2]) {
            if (land < 900) { const e = land / 900; g.beginPath(); g.arc(end[0], end[1], (1.5 + 6 * e) * u, 0, Math.PI * 2); g.strokeStyle = FL(0.7 * (1 - e)); g.lineWidth = 0.8 * u; g.stroke(); }
            g.beginPath(); g.arc(end[0], end[1], 1.25 * u, 0, Math.PI * 2); g.fillStyle = FL(0.85 * fade); g.fill();
          }
        }
      }
    }
    g.restore();
  }

  const flights = (() => {
    const cv = $('#globe');
    const g = cv.getContext('2d');
    const STAG = 420, DUR = 1700;
    const lastStart = (routes.length - 1) * STAG + DUR * 1.4 + 900;
    const HOLD = 4200, FADE = 1200;
    const CYCLE = lastStart + HOLD + FADE;
    let t0 = performance.now(), raf = 0, size = 0, dpr = 1, lon0 = 96;
    function resize() {
      size = cv.clientWidth || 196;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(size * dpr); cv.height = Math.round(size * dpr);
    }
    function frame(now) {
      raf = 0;
      if (!size) resize();
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, size, size);
      const still = reduce.matches;
      const el = now - t0;
      const time = still ? 1e9 : el % CYCLE;
      const trace = time > lastStart + HOLD ? 1 - (time - lastStart - HOLD) / FADE : 1;
      const rot = [still ? lon0 : lon0 + el * 0.0045, 22];
      drawGlobe(g, { cx: size / 2, cy: size / 2 - size * 0.02, R: size * 0.4, rot, time: still ? 1e9 : time, stagger: STAG, durBase: DUR, trace: still ? 0.9 : trace, landGeo: state.land110 });
      if (!still && !paused()) raf = requestAnimationFrame(frame);
    }
    const paused = () => document.hidden || !!page || opening;
    return {
      start() { if (!raf) raf = requestAnimationFrame(frame); },
      replay() { t0 = performance.now(); this.start(); },
      resize() { resize(); this.start(); },
    };
  })();
  $('#flights-btn').addEventListener('click', () => flights.replay());
  document.addEventListener('visibilitychange', () => { if (!document.hidden) flights.start(); });

  /* ------------------------------------------------------------ the opening: a globe, then the sheet unrolls */

  let opening = false;
  let openTween = null;
  const openingEl = $('#opening');
  function finishOpening() {
    if (!opening) return;
    opening = false;
    if (openTween) openTween.cancel();
    try { sessionStorage.setItem('emboss-opened', '1'); } catch (e) { /* fine */ }
    openingEl.classList.add('is-gone');
    app.classList.remove('is-opening');
    const fl = $('#flights');
    requestAnimationFrame(() => fl.classList.remove('is-arriving'));
    setTimeout(() => { openingEl.hidden = true; }, 700);
    flights.replay();
    queueDraw();
    setTimeout(loadBig, 1500);
  }
  function runOpening() {
    opening = true;
    app.classList.add('is-opening');
    openingEl.hidden = false;
    const cv = $('#opening-canvas');
    const g = cv.getContext('2d');
    const { W, H } = state;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const R = Math.min(W, H) * (narrow.matches ? 0.38 : 0.31);
    const cx = W / 2, cy = H / 2 + (narrow.matches ? 0 : 14);
    const rot0 = [104, 20];
    const home = homeTransform();
    const k = home.k;
    // the small globe will arrive from the middle
    const fl = $('#flights');
    const fr = fl.getBoundingClientRect();
    fl.style.setProperty('--fx', `${(cx - (fr.left + fr.width / 2)).toFixed(0)}px`);
    fl.style.setProperty('--fy', `${(cy - (fr.top + fr.height / 2)).toFixed(0)}px`);
    fl.classList.add('is-arriving');
    const GLOBE = 2900, UNROLL = 1600;
    const raw = (a) => (x, y) => { const p = d3.geoOrthographicRaw(x, y), q = d3.geoEquirectangularRaw(x, y); return [p[0] + a * (q[0] - p[0]), p[1] + a * (q[1] - p[1])]; };
    let t0 = null;
    let unrollLand = null;
    const tick = () => {
      if (!opening) return;
      // the clock starts once the coastlines are in
      if (!state.land110) { requestAnimationFrame(tick); return; }
      // the ice at the pole tears along the edge of a turning projection; it stays out of the unroll
      if (!unrollLand) {
        const geos = state.land110.features ? state.land110.features.map((f) => f.geometry) : [state.land110.geometry || state.land110];
        const polys = geos.flatMap((g2) => (g2.type === 'MultiPolygon' ? g2.coordinates : g2.type === 'Polygon' ? [g2.coordinates] : []));
        unrollLand = { type: 'MultiPolygon', coordinates: polys.filter((poly) => d3.max(poly[0], (c) => c[1]) > -60) };
      }
      if (t0 === null) t0 = performance.now();
      const el = performance.now() - t0;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      if (state.laid) { g.fillStyle = state.laid; state.laid.setTransform(new DOMMatrix().scaleSelf(1 / dpr, 1 / dpr)); g.fillRect(0, 0, W, H); }
      if (el < GLOBE) {
        drawGlobe(g, { cx, cy, R, rot: [rot0[0] + el * 0.006, rot0[1]], time: el + 150, stagger: 105, durBase: 1000, landGeo: state.land110, flightAlpha: clamp((GLOBE - el) / 450, 0, 1) });
      } else {
        // first the ball turns upright, then it unrolls: the projection itself moves from the
        // orthographic to the flat sheet while the ball turns to face the map's middle
        const u = Math.min(1, (el - GLOBE) / UNROLL);
        const up = inOut(Math.min(1, u / 0.28));
        const a = inOut(clamp((u - 0.18) / 0.82, 0, 1));
        const lon = (rot0[0] + GLOBE * 0.006) * (1 - a);
        const rot = [lon, rot0[1] * (1 - up)];
        const pr = d3.geoProjection(raw(a))
          .scale(R + a * (state.S0 * k - R))
          .translate([cx + a * (home.x + (k * W) / 2 - cx), cy + a * (home.y + (k * H) / 2 - cy)])
          .rotate([-rot[0], -rot[1]])
          .precision(0.8);
        // the far side comes round as the clip opens; past halfway the morph no longer folds back
        // on itself, so the cut can be the plain meridian behind
        if (a < 0.5) pr.clipAngle(90 + 89.5 * (a / 0.5));
        const gp = d3.geoPath(pr, g);
        // the ball flattens: its shading and its shadow go as the sheet comes
        const fadeBall = clamp(1 - a * 2.2, 0, 1);
        if (fadeBall > 0) {
          g.globalAlpha = fadeBall;
          const sh = g.createRadialGradient(cx + R * 0.14, cy + R * 0.2, R * 0.6, cx + R * 0.14, cy + R * 0.2, R * 1.12);
          sh.addColorStop(0, SH(0.16)); sh.addColorStop(1, SH(0));
          g.fillStyle = sh; g.beginPath(); g.arc(cx + R * 0.14, cy + R * 0.2, R * 1.12, 0, Math.PI * 2); g.fill();
          const ball = g.createRadialGradient(cx - R * 0.38, cy - R * 0.42, R * 0.05, cx - R * 0.1, cy - R * 0.1, R * 1.08);
          ball.addColorStop(0, 'rgb(253, 253, 254)'); ball.addColorStop(0.55, 'rgb(240, 242, 245)'); ball.addColorStop(1, 'rgb(214, 218, 224)');
          g.fillStyle = ball; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
          g.globalAlpha = 1;
        }
        if (unrollLand) {
          g.save(); g.translate(1.1, 1.3);
          g.beginPath(); gp(unrollLand); g.fillStyle = SH(0.08); g.fill();
          g.restore();
          g.beginPath(); gp(unrollLand);
          g.fillStyle = `rgba(245, 247, 248, ${0.62 + 0.38 * a})`; g.fill();
          g.strokeStyle = SH(0.16 + 0.04 * a); g.lineWidth = 0.55; g.stroke();
        }
        if (u >= 1) { finishOpening(); return; }
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    $('#opening-skip').addEventListener('click', finishOpening, { once: true });
    openingEl.addEventListener('pointerdown', (e) => { if (!e.target.closest('.opening__skip')) finishOpening(); });
    openingEl.addEventListener('wheel', finishOpening, { once: true, passive: true });
  }

  /* ------------------------------------------------------------ language */

  function applyWords() {
    html.lang = lang === 'zh' ? 'zh-Hant' : 'en';
    $$('[data-t]').forEach((el) => { const v = t(el.dataset.t); if (typeof v === 'string') el.textContent = v; });
    $$('[data-t-aria]').forEach((el) => { const v = t(el.dataset.tAria); if (typeof v === 'string') el.setAttribute('aria-label', v); });
    $$('.lang__btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    $('#ig').setAttribute('aria-label', `${t('follow')}: ${S.instagram.handle}`);
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
      leaf.classList.remove('is-arriving');
      leafScroll.scrollTop = top;
    }
    if (photo) renderViewer();
    state.settle = 6;
    queueDraw();
    if (document.fonts) document.fonts.ready.then(() => { measurePins(); queueDraw(); });
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.lang__btn');
    if (b) setLang(b.dataset.lang);
  });

  /* ------------------------------------------------------------ start */

  const ISO = { spain: '724', uk: '826', france: '250', germany: '276', switzerland: '756', taiwan: '158', japan: '392', 'south-korea': '410', 'hong-kong': '344', china: '156', singapore: '702', vietnam: '704', dubai: '784', australia: '036', 'new-zealand': '554', usa: '840' };
  function featsFor(w) {
    const geoms = w.objects.countries.geometries;
    const out = {};
    for (const [cid, iso] of Object.entries(ISO)) {
      const g = geoms.find((x) => String(x.id).padStart(3, '0') === iso);
      if (g) out[cid] = topojson.feature(w, g);
    }
    return out;
  }
  async function loadWorld() {
    const w110 = await fetch('../vendor/countries-110m.json').then((r) => r.json());
    state.land110 = topojson.feature(w110, w110.objects.land);
    state.mesh110 = topojson.mesh(w110, w110.objects.countries, (a, b) => a !== b);
    state.feats110 = featsFor(w110);
    queueDraw();
    flights.start();
    const w50 = await fetch('../vendor/countries-50m.json').then((r) => r.json());
    state.land50 = topojson.feature(w50, w50.objects.land);
    state.mesh50 = topojson.mesh(w50, w50.objects.countries, (a, b) => a !== b);
    state.feats50 = featsFor(w50);
    queueDraw();
  }

  async function start() {
    applyWords();
    renderIndex();
    sizeMap();
    renderPins();
    moveTo(homeTransform(), 0);
    updateZoomButtons();
    const want = parse(location.hash);
    const goTo = query.get('go');
    let seen = false;
    try { seen = sessionStorage.getItem('emboss-opened') === '1'; } catch (e) { /* fine */ }
    const world = loadWorld().catch(() => { /* the sheet still shows its books */ });
    loadRelief().catch(() => { /* the land stays plain paper */ });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measurePins(); state.settle = 6; queueDraw(); });
    if (want.page || want.photo) {
      try { history.replaceState({ emboss: false, page: want.page, cover: null, photo: want.photo }, '', location.href); } catch (e) { /* fine */ }
      apply(want, false);
      flights.start();
      setTimeout(loadBig, 2500);
    } else if (!seen && !reduce.matches && !goTo && !query.has('still')) {
      runOpening();
    } else {
      flights.start();
      setTimeout(loadBig, 2500);
    }
    // a link may ask to fly straight in: ?go=<place>
    if (goTo) {
      const b = bookByCountry[goTo] || books.find((x) => x.guide === goTo);
      if (b) setTimeout(() => go(b.view), 700);
    }
    let rz = 0;
    window.addEventListener('resize', () => {
      cancelAnimationFrame(rz);
      rz = requestAnimationFrame(() => {
        const c = proj0.invert([state.z.invertX(state.W / 2), state.z.invertY(state.H / 2)]);
        const kr = state.z.k / state.kHome;
        sizeMap();
        const k = kr * state.kHome;
        const p = proj0(c);
        state.z = d3.zoomIdentity.translate(state.W / 2 - p[0] * k, state.H / 2 - p[1] * k).scale(k);
        sel.call(zoom.transform, constrain(state.z));
        flights.resize();
        state.settle = 6;
        queueDraw();
      });
    });
  }
  start();
})();

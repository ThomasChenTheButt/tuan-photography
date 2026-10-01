/* tuan photography 陳亮元 · design 2 · "Ink and silk" (水墨)
   The world is an ink-wash painting on xuan paper (a texture painted once from Natural Earth
   relief, drawn onto a canvas with the zoom), his sixteen countries washed in pale mineral green,
   each place a book standing on a vermilion seal. Choosing a place draws the map near while the
   ink deepens and bleeds, then the photograph lifts out of the paper through a soft bloom.
   A small ink globe in the corner keeps the record of his flights, which scatter across it. */
(() => {
  'use strict';

  const S = window.SITE;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = matchMedia('(max-width: 47.99rem)');
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const expOut = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
  const inOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const cubicOut = (x) => 1 - Math.pow(1 - x, 3);

  /* ------------------------------------------------------------ words */

  const T = {
    en: {
      ig: 'Instagram',
      hint: 'Choose a place: the map draws near and its photographs begin.',
      mapLabel: 'Map of the places he has photographed',
      mapHint: 'Drag or use the arrow keys to move the map. Scroll, or press plus and minus, to zoom. Tab moves between the places.',
      siteLabel: 'Site', langLabel: 'Language',
      zoomGroup: 'Zoom', zoomIn: 'Zoom in', zoomOut: 'Zoom out', zoomAll: 'Whole map',
      indexTitle: 'Photographs',
      flights: 'Flights', replay: 'Play the flights again', skip: 'Skip',
      photosN: (n) => (n === 1 ? '1 photograph' : `${n} photographs`),
      seePhotos: 'See the photographs',
      seeAll: (p) => `See all of ${p}`,
      prev: 'Previous', next: 'Next',
      camera: 'Camera', lens: 'Lens', focal: 'Focal length', aperture: 'Aperture', shutter: 'Shutter', iso: 'ISO',
      ofN: (i, n) => `${i} of ${n}`,
      madeOf: (p) => `${p}: how this was made`,
      opening: (p) => `${p} is open.`,
      seas: { pacific: 'Pacific Ocean', indian: 'Indian Ocean', atlantic: 'Atlantic Ocean' },
    },
    zh: {
      ig: 'Instagram',
      hint: '選一個地方：地圖慢慢拉近，照片隨之展開。',
      mapLabel: '他拍過的地方的地圖',
      mapHint: '拖曳或用方向鍵移動地圖；捲動，或按加號、減號縮放。Tab 鍵在地點之間移動。',
      siteLabel: '網站', langLabel: '語言',
      zoomGroup: '縮放', zoomIn: '放大', zoomOut: '縮小', zoomAll: '整張地圖',
      indexTitle: '作品',
      flights: '飛過的航線', replay: '重播航線', skip: '略過',
      photosN: (n) => `${n} 張照片`,
      seePhotos: '看照片',
      seeAll: (p) => `看${p}的所有照片`,
      prev: '上一張', next: '下一張',
      camera: '相機', lens: '鏡頭', focal: '焦距', aperture: '光圈', shutter: '快門', iso: 'ISO',
      ofN: (i, n) => `第 ${i} 張，共 ${n} 張`,
      madeOf: (p) => `${p}：這張怎麼拍`,
      opening: (p) => `已打開${p}。`,
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

  const t = (k) => (T[lang][k] !== undefined ? T[lang][k] : (S.i18n[lang][k] !== undefined ? S.i18n[lang][k] : k));
  const L = (o) => (o ? (o[lang] !== undefined ? o[lang] : o.en) : '');

  /* ------------------------------------------------------------ data */

  const countries = Object.fromEntries(S.countries.map((c) => [c.id, c]));
  const books = S.books.map((b) => ({ ...b, view: b.guide ? `guide-${b.guide}` : `place-${b.country}` }));
  const bookByCountry = Object.fromEntries(books.map((b) => [b.country, b]));
  const guide = S.guides.barcelona;
  const order = books.map((b) => countries[b.country]).filter(Boolean);
  const placeLL = (cid) => (cid === guide.country ? guide.ll : countries[cid].ll);
  const indexOrder = order.flatMap((c) => c.photos);
  const coverOf = (cid, pick) => {
    if (pick && S.slides[pick] && S.slides[pick].country === cid) return S.slides[pick];
    const b = bookByCountry[cid];
    const id = b.photo || (countries[cid].photos[0] || null);
    return id ? S.slides[id] : null;
  };
  const fmtLL = ([lat, lon]) => `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'} · ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`;
  const imgSrc = (s, size) => `../images/web/${size ? size + '/' : ''}${s.file}`;
  const srcset = (s) => `${imgSrc(s, 640)} 640w, ${imgSrc(s, 1280)} 1280w, ${imgSrc(s)} ${s.w}w`;

  /* ------------------------------------------------------------ seals */

  // a small deterministic random, so each place keeps the same chop
  function seeded(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return () => { h += 0x6D2B79F5; let x = Math.imul(h ^ (h >>> 15), 1 | h); x ^= x + Math.imul(x ^ (x >>> 7), 61 | x); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  }
  const sealPaths = {};
  function sealPath(id) {
    if (sealPaths[id]) return sealPaths[id];
    const r = seeded(id);
    const j = (a) => (r() - 0.5) * a;
    const pts = [];
    const side = (x0, y0, x1, y1) => { for (let i = 0; i < 4; i++) { const f = i / 4; pts.push([x0 + (x1 - x0) * f + j(0.7), y0 + (y1 - y0) * f + j(0.7)]); } };
    side(1.2, 1.2, 18.8, 1.2); side(18.8, 1.2, 18.8, 18.8); side(18.8, 18.8, 1.2, 18.8); side(1.2, 18.8, 1.2, 1.2);
    const d = `M${pts.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join('L')}Z`;
    sealPaths[id] = { d, rot: (r() - 0.5) * 5 };
    return sealPaths[id];
  }
  function sealGlyph(b) {
    const name = L(b.title);
    return lang === 'zh' ? Array.from(name)[0] : name.replace(/^the\s+/i, '').charAt(0).toUpperCase();
  }
  function sealSVG(b, cls = '') {
    const p = sealPath(b.id);
    return `<svg class="seal ${cls}" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><g mask="url(#seal-wear)">` +
      `<path class="seal__ground" d="${p.d}"/><rect class="seal__rim" x="3" y="3" width="14" height="14"/>` +
      `<text class="seal__glyph" x="10" y="10.7" text-anchor="middle" dominant-baseline="central">${esc(sealGlyph(b))}</text></g></svg>`;
  }
  // the worn specks a chop leaves where the paste missed
  (function wear() {
    const g = $('#seal-wear-specks');
    const r = seeded('tuan_1127');
    let out = '';
    for (let i = 0; i < 34; i++) {
      const edge = r() < 0.6;
      let x = r(), y = r();
      if (edge) { if (r() < 0.5) x = r() < 0.5 ? r() * 0.12 : 1 - r() * 0.12; else y = r() < 0.5 ? r() * 0.12 : 1 - r() * 0.12; }
      out += `<circle cx="${x.toFixed(3)}" cy="${y.toFixed(3)}" r="${(0.008 + r() * 0.022).toFixed(3)}"/>`;
    }
    g.innerHTML = out;
  })();

  /* ------------------------------------------------------------ elements */

  const html = document.documentElement;
  const appEl = $('#app');
  const mapEl = $('#map');
  const canvas = $('#ink');
  const ctx = canvas.getContext('2d');
  const marksEl = $('#marks');
  const pinsEl = $('#pins');
  const indexEl = $('#index');
  const indexBody = $('#index-body');
  const indexScroll = $('#index-scroll');
  const leaf = $('#leaf');
  const leafScroll = $('#leaf-scroll');
  const leafContent = $('#leaf-content');
  const cover = $('#cover');
  const coverImg = document.createElement('img');
  coverImg.alt = '';
  coverImg.decoding = 'async';
  coverImg.fetchPriority = 'high';
  const viewer = $('#viewer');
  const live = $('#live');
  const SVGNS = 'http://www.w3.org/2000/svg';

  /* ------------------------------------------------------------ the brush: rings on the map */

  function ringD(r, rx = 1) {
    const n = 30;
    const start = Math.random() * Math.PI * 2;
    const turns = 1.08 + Math.random() * 0.1;
    const stretch = 1 + (Math.random() - 0.5) * 0.14;
    const rot = Math.random() * Math.PI;
    const ph = Math.random() * 6;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const th = start + (turns * Math.PI * 2 * i) / n;
      const rr = r * (1 + 0.045 * Math.sin(3 * th + ph) + (Math.random() - 0.5) * 0.025) * (1 + 0.06 * (i / n));
      const x = Math.cos(th) * rr * stretch * rx;
      const y = Math.sin(th) * rr;
      pts.push([x * Math.cos(rot) - y * Math.sin(rot), x * Math.sin(rot) + y * Math.cos(rot)]);
    }
    return d3.line().curve(d3.curveCatmullRom.alpha(0.5))(pts);
  }
  function drawStroke(path, delay = 0, dur = 420) {
    if (reduce.matches) return null;
    const len = path.getTotalLength();
    path.style.strokeDasharray = `${len} ${len + 4}`;
    path.style.strokeDashoffset = len;
    const a = path.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: dur, delay, easing: 'cubic-bezier(0.45, 0.05, 0.25, 1)', fill: 'forwards' });
    a.onfinish = () => { path.style.strokeDasharray = ''; path.style.strokeDashoffset = ''; a.cancel(); };
    return a;
  }
  function erase(nodes) {
    nodes.forEach((n) => { n.classList.add('fading'); setTimeout(() => n.remove(), 300); });
  }
  function tween(dur, fn, done, ease = expOut) {
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
  // a ring pinned to a place: the map moves the group, the dive may scale it
  function brushRing(d, ll) {
    const g = document.createElementNS(SVGNS, 'g');
    g.dataset.ll = JSON.stringify(ll);
    g.dataset.s = '1';
    for (const cls of ['ring ring--under', 'ring']) {
      const p = document.createElementNS(SVGNS, 'path');
      p.setAttribute('class', cls);
      p.setAttribute('d', d);
      g.appendChild(p);
    }
    marksEl.appendChild(g);
    return g;
  }
  function strokeRing(g, delay = 0, dur = 460) { $$('path', g).forEach((p) => drawStroke(p, delay, dur)); }

  /* ------------------------------------------------------------ the map */

  const state = {
    W: 1, H: 1, dpr: 1, S0: 1,
    z: d3.zoomIdentity,
    land110: null, land50: null, feats110: {}, feats50: {},
    drawQueued: false, settle: 0, bleed: 0,
    before: null, photoPts: [],
  };
  // centred on 45°E, so the cut falls in the open Pacific and New York and Auckland both breathe
  const LON0 = 45;
  const proj0 = d3.geoEquirectangular().rotate([-LON0, 0]).precision(0.5);
  const proj = d3.geoEquirectangular().rotate([-LON0, 0]).precision(0.5);
  const path = d3.geoPath(proj, ctx);

  // the painting: an ink layer (white where the paper is bare), a finer one for close in,
  // the same ink diffused for the dive, and the paper's fibres
  const tex = { base: null, fine: null, bleed: null, fibre: null, fineWanted: false };
  function loadImg(src) {
    return new Promise((res, rej) => { const i = new Image(); i.decoding = 'async'; i.onload = () => res(i); i.onerror = rej; i.src = src; });
  }

  const PAPER = 'rgb(244, 239, 228)';
  const INKA = (a) => `rgba(28, 30, 36, ${a})`;
  const GREENA = (a) => `rgba(98, 152, 128, ${a})`;
  const SEAL = 'rgb(192, 66, 46)';

  function sizeMap() {
    const r = mapEl.getBoundingClientRect();
    state.W = Math.max(1, r.width);
    state.H = Math.max(1, r.height);
    state.dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(state.W * state.dpr);
    canvas.height = Math.round(state.H * state.dpr);
    state.S0 = state.W / (2 * Math.PI);
    proj0.scale(state.S0).translate([state.W / 2, state.H / 2]);
    zoom.extent([[0, 0], [state.W, state.H]])
      .translateExtent([[0, state.H / 2 - state.S0 * Math.PI / 2], [state.W, state.H / 2 + state.S0 * Math.PI / 2]]);
    marksEl.setAttribute('viewBox', `0 0 ${state.W} ${state.H}`);
  }

  const P = (ll) => {
    const p = proj0([ll[1], ll[0]]);
    return [state.z.applyX(p[0]), state.z.applyY(p[1])];
  };

  // the painting is plate carrée from 180°W; with the map centred on 45°E it wraps once
  function drawWrapped(img, wx, wy, ww, wh) {
    const x0 = wx - (ww * LON0) / 360; // where 180°W falls
    ctx.save();
    ctx.beginPath(); ctx.rect(wx, wy, ww, wh); ctx.clip();
    drawWorld(img, x0, wy, ww, wh);
    drawWorld(img, x0 + ww, wy, ww, wh);
    ctx.restore();
  }
  function drawWorld(img, x, y, w, h) {
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const { W, H } = state;
    const sx0 = Math.max(0, (-x / w) * iw), sx1 = Math.min(iw, ((W - x) / w) * iw);
    const sy0 = Math.max(0, (-y / h) * ih), sy1 = Math.min(ih, ((H - y) / h) * ih);
    if (sx1 <= sx0 || sy1 <= sy0) return;
    ctx.drawImage(img, sx0, sy0, sx1 - sx0, sy1 - sy0, x + (sx0 / iw) * w, y + (sy0 / ih) * h, ((sx1 - sx0) / iw) * w, ((sy1 - sy0) / ih) * h);
  }

  const SEAS = [
    { id: 'pacific', ll: [14, 163] },
    { id: 'atlantic', ll: [27, -42] },
    { id: 'indian', ll: [-18, 80] },
  ];

  function draw() {
    state.drawQueued = false;
    const { W, H, dpr, z, S0 } = state;
    const k = z.k;
    const scale = S0 * k;
    proj.scale(scale).translate([z.x + k * W / 2, z.y + k * H / 2]).clipExtent([[-20, -20], [W + 20, H + 20]]);
    const fine = scale > 520 && state.land50;
    const land = fine ? state.land50 : state.land110;
    const feats = fine ? state.feats50 : state.feats110;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, W, H);

    // the painting itself, laid on the paper
    const wx = z.applyX(W / 2 - S0 * Math.PI), wy = z.applyY(H / 2 - S0 * Math.PI / 2), ww = k * W, wh = (k * W) / 2;
    const want = (k * W * dpr) / 4096 > 1.15 && !narrow.matches;
    if (want && !tex.fineWanted) {
      tex.fineWanted = true;
      loadImg('ink/ink-8192.jpg').then((i) => { tex.fine = i; queueDraw(); }).catch(() => {});
    }
    const img = want && tex.fine ? tex.fine : tex.base;
    ctx.globalCompositeOperation = 'multiply';
    if (img) drawWrapped(img, wx, wy, ww, wh);
    // as the map draws near for a dive, the washes deepen and bleed outward
    if (state.bleed > 0.002 && tex.bleed) {
      ctx.globalAlpha = state.bleed * 0.55;
      drawWrapped(tex.bleed, wx, wy, ww, wh);
      ctx.globalAlpha = 1;
    }
    // the place in hand: its green wash goes a shade deeper
    const ac = activeCountry();
    if (ac && feats[ac]) {
      ctx.beginPath(); path(feats[ac]);
      ctx.fillStyle = GREENA(0.3); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';

    if (!img && land) {
      // while the painting loads: a plain wash of the land
      ctx.beginPath(); path(land);
      ctx.fillStyle = INKA(0.07); ctx.fill();
      ctx.lineWidth = 0.7; ctx.strokeStyle = INKA(0.4); ctx.stroke();
    }
    // close in, a fine shoreline keeps the magnified washes from going soft
    if (land && scale > 1500) {
      ctx.beginPath(); path(land);
      ctx.lineWidth = 0.6; ctx.strokeStyle = INKA(Math.min(0.3, (scale - 1500) / 5000)); ctx.stroke();
    }
    // the paper's fibres, at the paper's own scale
    if (tex.fibre) {
      ctx.fillStyle = tex.fibre;
      ctx.fillRect(0, 0, W, H);
    }

    // the oceans, inscribed faintly; columns in 中文
    const seaAlpha = clamp((4.2 - k) / 1.6);
    if (seaAlpha > 0) {
      ctx.save();
      const zh = lang === 'zh';
      ctx.fillStyle = INKA(0.42 * seaAlpha);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const s of SEAS) {
        const p = P(s.ll);
        if (p[0] < -200 || p[0] > W + 200 || p[1] < -60 || p[1] > H + 60) continue;
        const label = T[lang].seas[s.id];
        if (zh) {
          ctx.font = '500 14px "Noto Serif TC", serif';
          const chars = Array.from(label);
          chars.forEach((ch, i) => ctx.fillText(ch, p[0], p[1] + (i - (chars.length - 1) / 2) * 22));
        } else {
          ctx.font = 'italic 400 14px "Alegreya Sans", serif';
          try { ctx.letterSpacing = '5px'; } catch (e) { /* older engines */ }
          ctx.fillText(label.toUpperCase(), p[0] + 2.5, p[1]);
        }
      }
      ctx.restore();
    }

    // where each photograph was made: a dab of ink, once close enough to tell them apart
    state.photoPts = [];
    if (scale > 700) {
      const a = clamp((scale - 700) / 300);
      for (const id of indexOrder) {
        const s = S.slides[id];
        const p = P(s.ll);
        if (p[0] < -10 || p[1] < -10 || p[0] > W + 10 || p[1] > H + 10) continue;
        state.photoPts.push({ id, p });
        ctx.beginPath(); ctx.arc(p[0], p[1], 5.5, 0, Math.PI * 2);
        ctx.fillStyle = INKA(0.1 * a); ctx.fill();
        ctx.beginPath(); ctx.arc(p[0], p[1], 2.6, 0, Math.PI * 2);
        ctx.fillStyle = INKA(0.82 * a); ctx.fill();
      }
    }

    // books: a hairline from the true place to the seal its book stands on, when pushed aside
    layoutPins();
    if (!diving) {
      for (const b of pinList) {
        const dx = b.x - b.ax, dy = b.y - b.ay;
        if (Math.hypot(dx, dy) > 7) {
          ctx.beginPath(); ctx.moveTo(b.ax, b.ay); ctx.lineTo(b.x, b.y);
          ctx.lineWidth = 0.75; ctx.strokeStyle = INKA(0.6); ctx.stroke();
          ctx.beginPath(); ctx.arc(b.ax, b.ay, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = SEAL; ctx.fill();
        }
      }
    }
    placeMarks();
    if (state.settle > 0) { state.settle -= 1; queueDraw(); }
  }

  function queueDraw() {
    if (state.drawQueued) return;
    state.drawQueued = true;
    requestAnimationFrame(draw);
  }

  /* ------------------------------------------------------------ zoom and pan */

  const zoom = d3.zoom()
    .scaleExtent([1, 48])
    .on('start', (e) => { if (e.sourceEvent && e.sourceEvent.type !== 'wheel') mapEl.classList.add('is-dragging'); })
    .on('zoom', (e) => { state.z = e.transform; state.settle = 24; queueDraw(); updateZoomButtons(); })
    .on('end', () => mapEl.classList.remove('is-dragging'));
  const sel = d3.select(mapEl);
  sel.call(zoom).on('dblclick.zoom', null);
  mapEl.addEventListener('dblclick', (e) => {
    if (e.target.closest('.book, .pin__seal')) return;
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
  function fitTransform(lls, pad) {
    const pts = lls.map((ll) => proj0([ll[1], ll[0]]));
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const { W, H } = state;
    const k = Math.max(1, Math.min(48, Math.min((W - pad.l - pad.r) / Math.max(1, x1 - x0), (H - pad.t - pad.b) / Math.max(1, y1 - y0))));
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const sx = pad.l + (W - pad.l - pad.r) / 2, sy = pad.t + (H - pad.t - pad.b) / 2;
    return d3.zoomIdentity.translate(sx - cx * k, sy - cy * k).scale(k);
  }
  // every place at one glance: New York at the left, New Zealand at the right
  function homeTransform() {
    const pad = narrow.matches ? { l: 34, r: 30, t: 150, b: 150 } : { l: 120, r: 120, t: 170, b: 130 };
    return fitTransform(order.map((c) => placeLL(c.id)), pad);
  }
  function centerOn(ll, k, dur) {
    const p = proj0([ll[1], ll[0]]);
    const kk = k || state.z.k;
    const off = indexEl.classList.contains('is-open') && !narrow.matches ? $('#index-panel').offsetWidth / 2 : 0;
    moveTo(d3.zoomIdentity.translate(state.W / 2 - off - p[0] * kk, state.H / 2 + 20 - p[1] * kk).scale(kk), dur);
  }
  function inView(ll, margin = 0.15) {
    const p = P(ll);
    const right = indexEl.classList.contains('is-open') && !narrow.matches ? state.W - $('#index-panel').offsetWidth : state.W;
    return p[0] > state.W * margin && p[0] < right - state.W * margin && p[1] > state.H * margin && p[1] < state.H * (1 - margin);
  }
  // the dive's landing: the country filling the window, the place itself at the centre
  function diveTransform(cid) {
    const ll = placeLL(cid);
    const f = state.feats110[cid];
    let k = 22;
    if (f) {
      const b = d3.geoBounds(f);
      const span = Math.min(b[1][0] - b[0][0], 60);
      const lls = [[b[0][1], ll[1] - span / 2], [b[1][1], ll[1] + span / 2]];
      k = fitTransform(lls, { l: 60, r: 60, t: 80, b: 80 }).k;
    }
    k = Math.max(9, Math.min(30, k * 0.9));
    const p = proj0([ll[1], ll[0]]);
    return constrain(d3.zoomIdentity.translate(state.W / 2 - p[0] * k, state.H / 2 - p[1] * k).scale(k));
  }
  function spotAt(ll, z) {
    const p = proj0([ll[1], ll[0]]);
    const r = mapEl.getBoundingClientRect();
    return [r.left + z.applyX(p[0]), r.top + z.applyY(p[1])];
  }

  const zIn = $('#zoom-in'), zOut = $('#zoom-out'), zAll = $('#zoom-all');
  const zoomBy = (f) => sel.interrupt().transition().duration(reduce.matches ? 0 : 420).ease(d3.easeExpOut).call(zoom.scaleBy, f);
  zIn.addEventListener('click', () => zoomBy(2));
  zOut.addEventListener('click', () => zoomBy(0.5));
  zAll.addEventListener('click', () => moveTo(homeTransform()));
  function updateZoomButtons() {
    zIn.disabled = state.z.k >= 47.9;
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

  /* ------------------------------------------------------------ books standing on their seals */

  let pinList = [];
  function bookStatus(b) { return b.band === 'bandNone' ? t('bandNone') : t(b.status); }
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
      el.style.setProperty('--i', String(i));
      el.style.setProperty('--rot', `${sealPath(b.id).rot.toFixed(2)}deg`);
      el.innerHTML =
        `<div class="pin__stage"><a class="book book--${b.tone}" href="#${b.view}" aria-label="${esc(`${L(b.title)}: ${bookStatus(b)}`)}" data-view="${b.view}"><span class="book__box">` +
        `<span class="book__spine"><b>${title}</b><i>${esc(t('series'))}</i></span>` +
        `${face}<span class="book__band"><b>${title}</b><span>${esc(t(b.band))}</span></span></span>` +
        `<span class="book__back"><i>${esc(t('series'))}</i></span><span class="book__edge"></span>` +
        `<span class="book__top"></span><span class="book__shadow"></span></span></a></div>` +
        sealSVG(b, 'pin__seal') +
        `<div class="pin__label" aria-hidden="true">${title}</div>`;
      pinsEl.appendChild(el);
      const prev = keep.get(b.id);
      return { id: b.id, country: c.id, book: b, el, ll: placeLL(c.id), x: prev ? prev.x : NaN, y: prev ? prev.y : NaN, ax: 0, ay: 0, lw: 0, lh: 0 };
    });
    measureLabels();
    bindPins();
  }
  function measureLabels() {
    for (const p of pinList) { const l = p.el.querySelector('.pin__label'); p.lw = l.offsetWidth; p.lh = l.offsetHeight; }
  }
  function bookScale() {
    const k = state.z.k;
    const small = narrow.matches;
    const base = small ? 0.13 : 0.235;
    const max = small ? 0.3 : 0.46;
    return Math.min(max, base * Math.pow(k / (small ? 0.55 : 1.25), 0.32));
  }
  function layoutPins() {
    const s = bookScale();
    const zh = lang === 'zh';
    // on a phone the whole world is a narrow band: the places start as seals, and their books
    // stand up as you come closer
    const sealOnly = narrow.matches && state.z.k < 2.4;
    pinsEl.classList.toggle('is-seals', sealOnly);
    const bw = sealOnly ? 16 : 192 * s, bh = sealOnly ? 0 : 272 * s;
    for (const p of pinList) {
      const a = P(p.ll);
      p.ax = a[0]; p.ay = a[1];
      if (Number.isNaN(p.x)) { p.x = p.ax; p.y = p.ay; }
      p.hw = zh ? bw / 2 + 6 + p.lw / 2 : Math.max(bw / 2 + 3, p.lw / 2 + 2);
      p.top = zh ? -10 - Math.max(bh, p.lh + 2) : (sealOnly ? -9 : -10 - bh);
      p.bot = zh ? 9 : 26;
    }
    const pull = 0.3;
    for (const p of pinList) { p.x += (p.ax - p.x) * pull; p.y += (p.ay - p.y) * pull; }
    for (let it = 0; it < 10; it++) {
      for (let i = 0; i < pinList.length; i++) {
        const a = pinList[i];
        for (let j = i + 1; j < pinList.length; j++) {
          const b = pinList[j];
          const ox = a.hw + b.hw - Math.abs(a.x - b.x);
          if (ox <= 0) continue;
          const oy = Math.min(a.y + a.bot, b.y + b.bot) - Math.max(a.y + a.top, b.y + b.top);
          if (oy <= 0) continue;
          if (ox < oy * 1.1) {
            const dir = a.x < b.x || (a.x === b.x && i < j) ? -1 : 1;
            a.x += (dir * ox) / 2; b.x -= (dir * ox) / 2;
          } else {
            const dir = a.y < b.y ? -1 : 1;
            a.y += (dir * oy) / 2; b.y -= (dir * oy) / 2;
          }
        }
      }
    }
    // a name that would sit on another book or name waits until its book wakes
    const taken = [];
    for (const p of pinList) {
      const r = zh
        ? [p.x + bw / 2 + 5, p.y - 12 - p.lh, p.x + bw / 2 + 5 + p.lw, p.y - 12]
        : [p.x - p.lw / 2, p.y + 10, p.x + p.lw / 2, p.y + 25];
      // a name near the edge slides inward rather than running off the paper
      p.lx = r[0] < 6 ? 6 - r[0] : (r[2] > state.W - 6 ? state.W - 6 - r[2] : 0);
      r[0] += p.lx; r[2] += p.lx;
      let free = true;
      for (const q of pinList) {
        if (q === p) continue;
        if (r[0] < q.x + bw / 2 && r[2] > q.x - bw / 2 && r[1] < q.y + 8 && r[3] > q.y - 10 - bh) { free = false; break; }
      }
      if (free) for (const t2 of taken) if (r[0] < t2[2] && r[2] > t2[0] && r[1] < t2[3] && r[3] > t2[1]) { free = false; break; }
      if (free) taken.push(r);
      p.el.classList.toggle('is-quiet', !free);
    }
    for (const p of pinList) {
      p.el.style.setProperty('--x', `${p.x.toFixed(1)}px`);
      p.el.style.setProperty('--y', `${p.y.toFixed(1)}px`);
      p.el.style.setProperty('--s', s.toFixed(3));
      p.el.style.setProperty('--bw', `${bw.toFixed(1)}px`);
      p.el.style.setProperty('--lx', `${(p.lx || 0).toFixed(1)}px`);
    }
  }
  function bindPins() {
    for (const p of pinList) {
      const a = p.el.querySelector('.book');
      const seal = p.el.querySelector('.pin__seal');
      for (const el of [a, seal]) {
        el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') setActive({ country: p.country, from: 'map' }); });
        el.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') clearActiveSoon(); });
      }
      a.addEventListener('focus', () => {
        if (diving) return;
        setActive({ country: p.country, from: 'map' });
        if (!inView(p.ll, 0.08)) centerOn(p.ll, Math.max(state.z.k, homeTransform().k), 600);
      });
      a.addEventListener('blur', () => clearActiveSoon());
      a.addEventListener('click', (e) => { e.preventDefault(); go(p.book.view); });
      seal.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); go(p.book.view); });
    }
  }

  /* ------------------------------------------------------------ what the brush rings, on the map only */

  let active = null;
  let marks = [];
  let clearTimer = 0, easeTimer = 0;
  let diveRing = null;
  const activeCountry = () => (active ? active.country || (active.slide && S.slides[active.slide].country) : null);
  const sameActive = (a, b) => a && b && a.country === b.country && a.slide === b.slide;

  function setActive(next) {
    if (diving) return;
    clearTimeout(clearTimer);
    if (sameActive(active, next)) return;
    const prevCountry = activeCountry();
    erase(marks.filter((m) => m !== diveRing)); marks = diveRing ? [diveRing] : [];
    active = next;
    const cid = activeCountry();
    pinList.forEach((p) => p.el.classList.toggle('awake', p.country === cid));
    if (prevCountry !== cid) queueDraw();
    const pin = pinList.find((p) => p.country === cid);
    if (next.slide) marks.push(brushRing(ringD(12), S.slides[next.slide].ll));
    else if (pin) marks.push(brushRing(ringD(17, 1.12), pin.ll));
    placeMarks();
    marks.filter((m) => m !== diveRing).forEach((m) => strokeRing(m, 0, 460));
    $$('.group.is-awake', indexBody).forEach((g) => { if (g.dataset.country !== cid) g.classList.remove('is-awake'); });
    const g = cid && indexBody.querySelector(`.group[data-country="${cid}"]`);
    if (g) g.classList.add('is-awake');
    if (next.from === 'index' && next.slide) {
      clearTimeout(easeTimer);
      easeTimer = setTimeout(() => {
        const ll = S.slides[next.slide].ll;
        if (!inView(ll, 0.12)) centerOn(ll, state.z.k, 900);
      }, 380);
    }
  }
  function clearActive() {
    erase(marks.filter((m) => m !== diveRing)); marks = diveRing ? [diveRing] : [];
    $$('.group.is-awake', indexBody).forEach((g) => g.classList.remove('is-awake'));
    pinList.forEach((p) => p.el.classList.remove('awake'));
    const had = activeCountry();
    active = null;
    clearTimeout(easeTimer);
    if (had) queueDraw();
  }
  function clearActiveSoon() { clearTimeout(clearTimer); clearTimer = setTimeout(clearActive, 160); }
  function placeMarks() {
    for (const m of marks) {
      if (!m.dataset.ll) continue;
      const p = P(JSON.parse(m.dataset.ll));
      const s = m.dataset.s || '1';
      m.setAttribute('transform', `translate(${p[0].toFixed(1)} ${p[1].toFixed(1)})${s === '1' ? '' : ` scale(${s})`}`);
    }
  }

  let hoverQueued = false, lastMove = null;
  function hitTest(x, y) {
    let best = null, bd = 11;
    for (const q of state.photoPts) {
      const d = Math.hypot(q.p[0] - x, q.p[1] - y);
      if (d < bd) { bd = d; best = q.id; }
    }
    if (best) return { slide: best };
    for (const p of pinList) if (Math.hypot(p.ax - x, p.ay - y) < 12) return { country: p.country };
    const ll = proj.invert([x, y]);
    if (!ll) return null;
    const feats = state.z.k * state.S0 > 520 && state.land50 ? state.feats50 : state.feats110;
    for (const c of S.countries) {
      const f = feats[c.id];
      if (f && d3.geoContains(f, ll)) return { country: c.id };
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
      if (ev.target.closest && ev.target.closest('.book, .pin__seal')) return;
      const r = mapEl.getBoundingClientRect();
      const hit = hitTest(ev.clientX - r.left, ev.clientY - r.top);
      mapEl.style.cursor = hit ? 'pointer' : '';
      if (hit) setActive({ ...hit, from: 'map' });
      else if (active) clearActiveSoon();
    });
  });
  mapEl.addEventListener('pointerleave', () => { mapEl.style.cursor = ''; clearActiveSoon(); });
  mapEl.addEventListener('click', (e) => {
    if (e.target.closest('.book, .pin__seal') || e.defaultPrevented || diving) return;
    const r = mapEl.getBoundingClientRect();
    const hit = hitTest(e.clientX - r.left, e.clientY - r.top);
    if (!hit) return;
    if (hit.slide) { const s = S.slides[hit.slide]; go(bookByCountry[s.country].view, { cover: hit.slide }); }
    else { const p = pinList.find((x) => x.country === hit.country); if (p) go(p.book.view); }
  });

  /* ------------------------------------------------------------ the index, on request */

  function renderIndex() {
    $('#index-count').textContent = String(indexOrder.length);
    indexBody.innerHTML = order.map((c) => {
      const b = bookByCountry[c.id];
      const thumbs = c.photos.map((id) => {
        const s = S.slides[id];
        return `<li><button type="button" class="thumb" data-slide="${id}" aria-label="${esc(L(s.place))}">` +
          `<img src="${imgSrc(s, 640)}" alt="" loading="lazy" decoding="async" width="${s.w}" height="${s.h}">` +
          `<span class="thumb__name">${esc(L(s.place))}</span></button></li>`;
      }).join('');
      return `<section class="group" data-country="${c.id}" aria-labelledby="g-${c.id}">` +
        `<h3><button type="button" class="group__name" id="g-${c.id}" data-view="${b.view}">${esc(L(b.title))}</button>` +
        `<span class="group__meta">${esc(L(c.date))}</span></h3>` +
        (thumbs ? `<ul class="thumbs">${thumbs}</ul>` : `<p class="group__none">${esc(t('bandNone'))}</p>`) +
        `</section>`;
    }).join('');
  }
  function openIndex() {
    indexEl.classList.add('is-open');
    $('#index-tab').setAttribute('aria-expanded', 'true');
    setTimeout(() => $('#index-close').focus({ preventScroll: true }), 60);
  }
  function closeIndex(focusTab = true) {
    if (!indexEl.classList.contains('is-open')) return;
    indexEl.classList.remove('is-open');
    $('#index-tab').setAttribute('aria-expanded', 'false');
    if (focusTab) $('#index-tab').focus({ preventScroll: true });
  }
  $('#index-tab').addEventListener('click', openIndex);
  $('#index-close').addEventListener('click', () => closeIndex());
  indexBody.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    const th = e.target.closest('.thumb');
    const gn = e.target.closest('.group__name');
    if (th) setActive({ slide: th.dataset.slide, from: 'index' });
    else if (gn) setActive({ country: gn.closest('.group').dataset.country, from: 'index' });
  });
  indexBody.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') clearActiveSoon(); });
  indexBody.addEventListener('focusin', (e) => {
    const th = e.target.closest('.thumb');
    const gn = e.target.closest('.group__name');
    if (th) setActive({ slide: th.dataset.slide, from: 'index' });
    else if (gn) setActive({ country: gn.closest('.group').dataset.country, from: 'index' });
  });
  indexBody.addEventListener('click', (e) => {
    if (diving) return;
    const th = e.target.closest('.thumb');
    const gn = e.target.closest('.group__name');
    // a photograph in the index dives into its place, with that photograph as the cover
    if (th) { const s = S.slides[th.dataset.slide]; go(bookByCountry[s.country].view, { cover: th.dataset.slide }); }
    else if (gn) go(gn.dataset.view);
  });

  /* ------------------------------------------------------------ the leaf: pages */

  let page = null;
  let pageCover = null;
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
  function renderLeaf(view, pick) {
    const cid = viewCountry(view);
    const c = countries[cid];
    const ll = view.startsWith('guide-') ? guide.ll : placeLL(cid);
    if (tocObserver) { tocObserver.disconnect(); tocObserver = null; }
    renderCover(cid, ll, view, pick);
    if (view === 'guide-barcelona') renderGuide();
    else renderPlace(c);
  }
  function renderCover(cid, ll, view, pick) {
    const s = coverOf(cid, pick);
    const c = countries[cid];
    const b = bookByCountry[cid];
    leaf.classList.toggle('is-plain', !s);
    if (!s) { cover.hidden = true; coverImg.removeAttribute('src'); coverImg.removeAttribute('srcset'); return; }
    cover.hidden = false;
    if (!coverImg.isConnected) $('#cover-pic').appendChild(coverImg);
    coverImg.sizes = '100vw';
    coverImg.srcset = srcset(s);
    coverImg.src = imgSrc(s, 1280);
    coverImg.alt = L(s.alt);
    const title = L(b.title), name = L(c.name);
    $('#cover-note').textContent = L(c.note);
    $('#cover-name').textContent = title;
    $('#cover-country').textContent = name !== title ? name : '';
    $('#cover-ll').textContent = fmtLL(ll);
    $('#cover-on').textContent = view.startsWith('guide-') ? t('bookOpen') : T[lang].seePhotos;
  }
  $('#cover-on').addEventListener('click', () => {
    leafContent.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' });
    const first = $('#leaf-title', leafContent);
    if (first) { if (!first.hasAttribute('tabindex')) first.setAttribute('tabindex', '-1'); first.focus({ preventScroll: true }); }
  });

  function renderPlace(c) {
    const b = bookByCountry[c.id];
    const title = L(b.title), name = L(c.name);
    const meta = [];
    if (name !== title) meta.push(`<span>${esc(name)}</span>`);
    meta.push(`<span>${esc(L(c.date))}</span>`);
    if (c.photos.length) meta.push(`<span>${esc(T[lang].photosN(c.photos.length))}</span>`);
    meta.push(`<span>${esc(fmtLL(placeLL(c.id)))}</span>`);
    let body;
    if (c.photos.length) {
      const wide = window.innerWidth > 900;
      const target = wide ? 3.3 : 2.2;
      const rows = [];
      let row = [], sum = 0;
      for (const id of c.photos) {
        const s = S.slides[id];
        row.push(id); sum += s.w / s.h;
        if (sum >= target || row.length === 3) { rows.push(row); row = []; sum = 0; }
      }
      if (row.length) rows.push(row);
      body = `<div class="rows">${rows.map((r) => `<div class="row">${r.map((id) => {
        const s = S.slides[id];
        return `<figure class="piece" data-ar="${(s.w / s.h).toFixed(4)}"><button type="button" data-slide="${id}" aria-label="${esc(T[lang].madeOf(L(s.place)))}">` +
          `<img src="${imgSrc(s, 1280)}" srcset="${srcset(s)}" sizes="(max-width: 48rem) 92vw, 40vw" width="${s.w}" height="${s.h}" alt="${esc(L(s.alt))}" loading="lazy" decoding="async"></button>` +
          `<figcaption><b>${esc(L(s.place))}</b><span>${esc(L(s.where))}</span></figcaption></figure>`;
      }).join('')}</div>`).join('')}</div>` +
        `<p class="quiet-line">${esc(t('bookNot'))}</p>`;
    } else {
      body = `<div class="no-photos"><b>${esc(t('bandNone'))}</b><span>${esc(t('bookNot'))}</span></div>`;
    }
    leafContent.className = 'leaf__content';
    leafContent.innerHTML =
      `<div class="wrap"><header class="place-top"><h1 class="page-title" id="leaf-title">${sealSVG(b)}<span>${esc(title)}</span></h1>` +
      `<p class="page-lede">${esc(L(c.note))}</p><p class="page-meta">${meta.join('')}</p></header>` +
      body + `</div>`;
    $$('.piece[data-ar]', leafContent).forEach((f) => f.style.setProperty('--ar', f.dataset.ar));
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
    const h1 = $('h1', leafContent);
    if (h1) {
      h1.id = 'leaf-title';
      const words = h1.textContent;
      h1.innerHTML = `${sealSVG(bookByCountry[guide.country])}<span>${esc(words)}</span>`;
    }
    const meta = $('.guide-top .meta', leafContent);
    if (meta) {
      const facts = document.createElement('p');
      facts.className = 'guide-facts';
      facts.textContent = L(guide.facts);
      meta.after(facts);
    }
    const links = $$('.toc a', leafContent);
    const heads = links.map((a) => leafContent.querySelector(a.getAttribute('href'))).filter(Boolean);
    if ('IntersectionObserver' in window && heads.length) {
      tocObserver = new IntersectionObserver(() => {
        let topmost = null;
        for (const h of heads) if (h.getBoundingClientRect().top < window.innerHeight * 0.4) topmost = h;
        links.forEach((a) => a.classList.toggle('is-here', !!topmost && a.getAttribute('href') === `#${topmost.id}`));
      }, { root: leafScroll, threshold: [0, 1], rootMargin: '0px 0px -55% 0px' });
      heads.forEach((h) => tocObserver.observe(h));
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
    if (href.startsWith('#')) {
      e.preventDefault();
      const target = leafContent.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' });
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    } else if (href && !/^https?:/.test(href)) {
      // links into design 1's other pages lead nowhere here
      e.preventDefault();
    }
  });

  /* ------------------------------------------------------------ the dive, and the photograph lifting out of the paper */

  let timers = [];
  const later = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); return id; };
  let anims = [];
  function stopDive() {
    timers.forEach(clearTimeout); timers = [];
    anims.forEach((a) => a.cancel()); anims = [];
    if (diveRing) { erase([diveRing]); marks = marks.filter((m) => m !== diveRing); diveRing = null; }
  }
  // five soft washes spreading from the spot; their union is the opening in the paper
  let blobs = [];
  function seedBlobs() {
    const a0 = Math.random() * Math.PI * 2;
    blobs = [
      { a: 0, o: 0, f: 1, d: 0 },
      { a: a0, o: 0.5, f: 0.8, d: 0.05 },
      { a: a0 + 2.2, o: 0.46, f: 0.72, d: 0.11 },
      { a: a0 + 3.7, o: 0.55, f: 0.66, d: 0.03 },
      { a: a0 + 5.0, o: 0.4, f: 0.76, d: 0.15 },
    ];
  }
  function setReveal(p, sx, sy) {
    const R = Math.hypot(Math.max(sx, window.innerWidth - sx), Math.max(sy, window.innerHeight - sy)) + 12;
    blobs.forEach((b, i) => {
      const q = clamp((p - b.d) / (1 - b.d));
      const r = Math.max(0.01, q * b.f * 2.1 * R);
      const off = b.o * r * 0.5;
      leaf.style.setProperty(`--x${i + 1}`, `${(sx + Math.cos(b.a) * off).toFixed(1)}px`);
      leaf.style.setProperty(`--y${i + 1}`, `${(sy + Math.sin(b.a) * off).toFixed(1)}px`);
      leaf.style.setProperty(`--r${i + 1}`, `${r.toFixed(1)}px`);
    });
    const u = 1 - p;
    coverImg.style.setProperty('--blur', (12 * Math.pow(u, 1.2)).toFixed(2));
    coverImg.style.setProperty('--gray', Math.pow(u, 1.4).toFixed(3));
    coverImg.style.setProperty('--sc', (1 + 0.05 * u).toFixed(4));
    coverImg.style.setProperty('--bright', (1 + 0.07 * u).toFixed(3));
  }
  function clearReveal() {
    leaf.classList.remove('is-masked');
    for (let i = 1; i <= 5; i++) ['x', 'y', 'r'].forEach((v) => leaf.style.removeProperty(`--${v}${i}`));
    ['--blur', '--gray', '--sc', '--bright'].forEach((v) => coverImg.style.removeProperty(v));
  }

  let pageGen = 0;
  function openPage(view, opts = {}) {
    pageGen += 1;
    const gen = pageGen;
    stopDive();
    clearReveal();
    leaf.classList.remove('is-fading', 'is-fading-out');
    const cid = viewCountry(view);
    const ll = view.startsWith('guide-') ? guide.ll : placeLL(cid);
    page = view;
    pageCover = opts.cover || null;
    renderLeaf(view, pageCover);
    leafScroll.scrollTop = 0;
    appEl.inert = true;
    clearActive();
    closeIndex(false);
    live.textContent = T[lang].opening(L(bookByCountry[cid].title));
    const landing = diveTransform(cid);
    if (!diving) state.before = state.z;
    diving = true;
    appEl.classList.add('is-diving');
    const hasCover = !leaf.classList.contains('is-plain');
    if (opts.animate && !reduce.matches) {
      // 1. the map draws near; a brushed ring tightens on the spot; the ink deepens and bleeds
      moveTo(landing, 2000);
      diveRing = brushRing(ringD(15), ll);
      marks.push(diveRing);
      strokeRing(diveRing, 0, 520);
      const b0 = state.bleed;
      const tw = tween(2000, (e) => {
        if (diveRing) { diveRing.dataset.s = (6 - 5 * e).toFixed(3); placeMarks(); }
        state.bleed = lerp(b0, 1, e); queueDraw();
      });
      anims.push(tw);
      // 2. as it settles, the photograph lifts out of the paper through a soft bloom
      const [sx, sy] = spotAt(ll, landing);
      seedBlobs();
      cover.classList.add('is-quiet');
      leaf.classList.add('is-masked');
      setReveal(0, sx, sy);
      leaf.hidden = false;
      later(() => {
        appEl.classList.add('is-lifting');
        const rv = tween(hasCover ? 1800 : 1250, (e) => setReveal(e, sx, sy), () => {
          if (gen !== pageGen) return;
          clearReveal();
          if (diveRing) { erase([diveRing]); marks = marks.filter((m) => m !== diveRing); diveRing = null; }
          // 3. last, the note, the name and the coordinates settle at the bottom edge
          later(() => cover.classList.remove('is-quiet'), 120);
          $('#leaf-back').focus({ preventScroll: true });
        }, inOut);
        anims.push(rv);
      }, 1250);
    } else {
      moveTo(landing, 0);
      state.bleed = 1; queueDraw();
      appEl.classList.add('is-lifting');
      cover.classList.remove('is-quiet');
      leaf.hidden = false;
      if (opts.animate) leaf.classList.add('is-fading');
      requestAnimationFrame(() => $('#leaf-back').focus({ preventScroll: true }));
    }
  }

  function closePage(opts = {}) {
    if (!page) return;
    pageGen += 1;
    const gen = pageGen;
    stopDive();
    const cid = viewCountry(page);
    const pin = pinList.find((p) => p.country === cid);
    const ll = page.startsWith('guide-') ? guide.ll : placeLL(cid);
    page = null; pageCover = null;
    if (tocObserver) { tocObserver.disconnect(); tocObserver = null; }
    const back = state.before || homeTransform();
    const done = () => {
      if (gen !== pageGen) return;
      leaf.hidden = true;
      clearReveal();
      leaf.classList.remove('is-fading', 'is-fading-out');
      leafContent.textContent = '';
      appEl.inert = false;
    };
    const surface = (animate) => {
      diving = false;
      state.before = null;
      appEl.classList.remove('is-lifting');
      moveTo(back, animate ? 1600 : 0);
      const b0 = state.bleed;
      if (animate) anims.push(tween(1500, (e) => { state.bleed = lerp(b0, 0, e); queueDraw(); }));
      else { state.bleed = 0; queueDraw(); }
      if (animate) later(() => appEl.classList.remove('is-diving'), 500);
      else appEl.classList.remove('is-diving');
      if (pin && opts.focus !== false) pin.el.querySelector('.book').focus({ preventScroll: true });
      scheduleFlights();
    };
    if (opts.animate && !reduce.matches) {
      // the same, reversed and a little quicker: the photograph sinks back into the paper
      const [sx, sy] = spotAt(ll, state.z);
      seedBlobs();
      cover.classList.add('is-quiet');
      leaf.classList.add('is-masked');
      appEl.classList.remove('is-lifting');
      setReveal(1, sx, sy);
      diveRing = brushRing(ringD(15), ll);
      marks.push(diveRing);
      placeMarks();
      const rv = tween(1100, (e) => setReveal(1 - e, sx, sy), () => {
        if (gen !== pageGen) return;
        done();
        surface(true);
        const ring = diveRing;
        diveRing = null;
        if (ring) anims.push(tween(1300, (e) => { if (ring.isConnected) { ring.dataset.s = (1 + 5 * e).toFixed(3); ring.style.setProperty('--o', (1 - e).toFixed(3)); placeMarks(); } }, () => { ring.remove(); marks = marks.filter((m) => m !== ring); }));
      }, inOut);
      anims.push(rv);
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
    const seeAll = b && page !== b.view ? `<button type="button" class="viewer__go" data-view="${b.view}">${esc(T[lang].seeAll(L(b.title)))}</button>` : '';
    $('#viewer-text').innerHTML =
      `<h2 id="viewer-title">${esc(L(s.place))}</h2>` +
      `<p class="viewer__where">${esc(L(s.where))}</p>` +
      `<p class="viewer__ll">${esc(fmtLL(s.ll))}</p>` +
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
    const wasHidden = viewer.hidden;
    viewer.hidden = false;
    appEl.inert = true;
    leaf.inert = true;
    if (wasHidden) requestAnimationFrame(() => $('#viewer-close').focus({ preventScroll: true }));
  }
  function hideViewer() {
    if (!photo) return;
    const id = photo;
    photo = null;
    viewer.hidden = true;
    leaf.inert = false;
    appEl.inert = !!page;
    if (page) {
      const backEl = leafContent.querySelector(`[data-slide="${id}"]`);
      (backEl || $('#leaf-back')).focus({ preventScroll: false });
    }
  }
  function step(d) {
    const i = photoList.indexOf(photo);
    const n = photoList.length;
    photo = photoList[(i + d + n) % n];
    renderViewer();
    try { history.replaceState({ ...(history.state || {}), inkwash: true, photo, page }, '', `#photo-${photo}`); } catch (e) { /* fine */ }
  }
  $('#viewer-prev').addEventListener('click', () => step(-1));
  $('#viewer-next').addEventListener('click', () => step(1));
  $('#viewer-close').addEventListener('click', () => back());
  $('#viewer-text').addEventListener('click', (e) => {
    const g = e.target.closest('.viewer__go');
    if (!g) return;
    const view = g.dataset.view;
    hideViewer();
    try { history.replaceState({ inkwash: true, page: view }, '', `#${view}`); } catch (err) { /* fine */ }
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

  /* ------------------------------------------------------------ history: every page and photograph has an address */

  function parse(hash) {
    const h = decodeURIComponent((hash || '').replace(/^#/, ''));
    const st = history.state;
    if (h.startsWith('photo-') && S.slides[h.slice(6)]) {
      return { page: st && validView(st.page) ? st.page : null, photo: h.slice(6), cover: st && st.cover };
    }
    if (validView(h)) return { page: h, photo: null, cover: st && st.page === h ? st.cover : null };
    return { page: null, photo: null };
  }
  function apply(want, animate) {
    if (want.photo !== photo && photo) hideViewer();
    if (want.page !== page) {
      if (page) closePage({ animate: animate && !want.page, focus: !want.page });
      if (want.page) openPage(want.page, { animate, cover: want.cover });
    }
    if (want.photo && want.photo !== photo) showViewer(want.photo, photoList);
  }
  function go(view, opts = {}) {
    if (page === view || diving) return;
    try { history.pushState({ inkwash: true, page: view, cover: opts.cover || null }, '', `#${view}`); } catch (e) { /* fine */ }
    if (page) closePage({ animate: false, focus: false });
    openPage(view, { animate: true, cover: opts.cover });
  }
  function openViewer(id, list) {
    try { history.pushState({ inkwash: true, page, cover: pageCover, photo: id }, '', `#photo-${id}`); } catch (e) { /* fine */ }
    showViewer(id, list);
  }
  function back() {
    if (history.state && history.state.inkwash) history.back();
    else {
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* fine */ }
      apply({ page: null, photo: null }, true);
    }
  }
  window.addEventListener('popstate', () => apply(parse(location.hash), true));
  $('#leaf-back').addEventListener('click', () => back());
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (opening.running) { e.preventDefault(); finishOpening(); return; }
    if (photo || page) { e.preventDefault(); back(); }
    else if (indexEl.classList.contains('is-open')) { e.preventDefault(); closeIndex(); }
  });
  viewer.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  });

  /* ------------------------------------------------------------ flights: a small ink globe, arcs flicked across it */

  const TPE = [121.56, 25.03];
  const routes = order.filter((c) => c.id !== 'taiwan').map((c, i) => {
    const ll = placeLL(c.id);
    const to = [ll[1], ll[0]];
    const dist = d3.geoDistance(TPE, to);
    return { to, interp: d3.geoInterpolate(TPE, to), dist, t0: i * 0.42, dur: 1.5 + (dist / Math.PI) * 1.6 };
  });
  const CYCLE = Math.max(...routes.map((r) => r.t0 + r.dur * 1.5)) + 3.2;

  // draws the flights at time tt (seconds into the scatter) on a globe projection
  function drawFlights(c, pr, tt, lw, alpha, centre) {
    const N = 22;
    // the end of each scatter: the traces left behind fade together before the next one
    const fade = clamp((CYCLE - tt) / 1.4);
    for (const r of routes) {
      const u = (tt - r.t0) / r.dur;
      if (u <= 0) continue;
      if (u > 0.6) {
        // a faint trace of the whole route stays behind the flight, like a dry brush hair
        c.beginPath();
        let on = false;
        const upto = Math.min(1, cubicOut(clamp(u)));
        for (let j = 0; j <= 36; j++) {
          const g = r.interp((j / 36) * upto);
          if (d3.geoDistance(g, centre) >= Math.PI / 2 - 0.02) { on = false; continue; }
          const p = pr(g);
          if (on) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]);
          on = true;
        }
        c.lineWidth = lw * 0.55;
        c.strokeStyle = INKA(alpha * 0.2 * clamp((u - 0.6) / 0.6) * fade);
        c.stroke();
      }
      if (u > 1.5) continue;
      const head = cubicOut(clamp(u));
      const tail = cubicOut(clamp((u - 0.28) / 1.22));
      if (head - tail > 0.001) {
        let prev = null;
        for (let j = 0; j <= N; j++) {
          const f = lerp(tail, head, j / N);
          const g = r.interp(f);
          const vis = d3.geoDistance(g, centre) < Math.PI / 2 - 0.02;
          const p = vis ? pr(g) : null;
          if (prev && p) {
            const w = j / N;
            c.beginPath(); c.moveTo(prev[0], prev[1]); c.lineTo(p[0], p[1]);
            c.lineWidth = lw * (0.35 + 0.9 * w);
            c.strokeStyle = INKA(alpha * (0.12 + 0.88 * w * w));
            c.stroke();
          }
          prev = p;
        }
      }
      if (u < 1) {
        const g = r.interp(head);
        if (d3.geoDistance(g, centre) < Math.PI / 2 - 0.02) {
          const p = pr(g);
          c.beginPath(); c.arc(p[0], p[1], lw * 1.25, 0, Math.PI * 2);
          c.fillStyle = `rgba(192, 66, 46, ${alpha * 0.95})`; c.fill();
        }
      } else if (d3.geoDistance(r.to, centre) < Math.PI / 2 - 0.02) {
        // arrival: a small dab of ink spreads where the line lands, and fades
        const a = clamp((u - 1) / 0.5);
        const p = pr(r.to);
        c.beginPath(); c.arc(p[0], p[1], lw * (1.2 + 4 * a), 0, Math.PI * 2);
        c.fillStyle = INKA(alpha * 0.22 * (1 - a)); c.fill();
      }
    }
  }
  function drawStaticFlights(c, pr, lw, centre) {
    for (const r of routes) {
      c.beginPath();
      let on = false;
      for (let j = 0; j <= 40; j++) {
        const g = r.interp(j / 40);
        if (d3.geoDistance(g, centre) >= Math.PI / 2 - 0.02) { on = false; continue; }
        const p = pr(g);
        if (on) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]);
        on = true;
      }
      c.lineWidth = lw * 0.7; c.strokeStyle = INKA(0.45); c.stroke();
    }
  }
  // the globe itself: a sphere brushed in ink on the paper, land in a pale wash
  function drawGlobe(c, pr, R, cx, cy, lw) {
    const gp = d3.geoPath(pr, c);
    // the sphere: paper lit from the upper left, a wash of shade on the far side
    const g1 = c.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
    g1.addColorStop(0, 'rgba(252, 249, 242, 1)');
    g1.addColorStop(1, 'rgba(238, 232, 219, 1)');
    c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.fillStyle = g1; c.fill();
    const g2 = c.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.55, cx - R * 0.1, cy - R * 0.1, R * 1.15);
    g2.addColorStop(0, 'rgba(28, 30, 36, 0)');
    g2.addColorStop(1, 'rgba(28, 30, 36, 0.16)');
    c.fillStyle = g2; c.fill();
    c.beginPath(); gp(d3.geoGraticule10()); c.lineWidth = 0.5 * lw; c.strokeStyle = INKA(0.09); c.stroke();
    if (state.land110) {
      c.beginPath(); gp(state.land110); c.fillStyle = INKA(0.12); c.fill();
      c.lineWidth = 0.6 * lw; c.strokeStyle = INKA(0.42); c.stroke();
      c.beginPath();
      for (const cid of Object.keys(state.feats110)) gp(state.feats110[cid]);
      c.fillStyle = GREENA(0.45); c.fill();
    }
    // the rim: one sure stroke and a softer second, as a brush laid twice
    c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.lineWidth = 1.1 * lw; c.strokeStyle = INKA(0.8); c.stroke();
    c.beginPath(); c.arc(cx + 0.6 * lw, cy + 0.8 * lw, R + 0.4 * lw, Math.PI * 0.05, Math.PI * 0.95); c.lineWidth = 2.4 * lw; c.strokeStyle = INKA(0.14); c.stroke();
  }

  const fCanvas = $('#flights-canvas');
  const fctx = fCanvas.getContext('2d');
  const fProj = d3.geoOrthographic().clipAngle(90).precision(0.6);
  const flights = { size: 0, dpr: 1, start: performance.now(), raf: 0, lam: -95 };
  function sizeFlights() {
    const r = fCanvas.getBoundingClientRect();
    flights.size = Math.max(40, r.width);
    flights.dpr = Math.min(2, window.devicePixelRatio || 1);
    fCanvas.width = Math.round(flights.size * flights.dpr);
    fCanvas.height = Math.round(flights.size * flights.dpr);
  }
  function drawFlightsGlobe(now) {
    flights.raf = 0;
    const { size, dpr } = flights;
    const R = size / 2 - 4;
    const still = reduce.matches;
    const secs = (now - flights.start) / 1000;
    const lam = still ? -100 : flights.lam - secs * 4;
    fProj.scale(R).translate([size / 2, size / 2]).rotate([lam, -24]);
    fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fctx.clearRect(0, 0, size, size);
    const lw = size < 120 ? 0.75 : 1;
    drawGlobe(fctx, fProj, R, size / 2, size / 2, lw);
    const centre = [-lam, 24];
    if (still) drawStaticFlights(fctx, fProj, lw, centre);
    else drawFlights(fctx, fProj, secs % CYCLE, lw * 1.35, 1, centre);
    if (!still) scheduleFlights();
  }
  function scheduleFlights() {
    if (flights.raf || document.hidden || page || opening.running) return;
    flights.raf = requestAnimationFrame(drawFlightsGlobe);
  }
  $('#flights-globe').addEventListener('click', () => {
    // play the scatter again from its first arc
    flights.lam = flights.lam - ((performance.now() - flights.start) / 1000) * 4;
    flights.start = performance.now();
    scheduleFlights();
  });
  document.addEventListener('visibilitychange', () => scheduleFlights());

  /* ------------------------------------------------------------ the opening: the globe of flights unrolls into the map */

  const opening = { running: false, raf: 0, t0: 0 };
  const openEl = $('#opening');
  const oCanvas = $('#opening-canvas');
  const octx = oCanvas.getContext('2d');
  const unroll = d3.geoProjectionMutator((tt) => (x, y) => {
    const a = d3.geoOrthographicRaw(x, y), b = d3.geoEquirectangularRaw(x, y);
    return [a[0] + tt * (b[0] - a[0]), a[1] + tt * (b[1] - a[1])];
  });
  function shouldOpen() {
    if (reduce.matches || location.hash) return false;
    try { if (sessionStorage.getItem('inkwash-opened')) return false; sessionStorage.setItem('inkwash-opened', '1'); } catch (e) { /* fine */ }
    return true;
  }
  function startOpening() {
    opening.running = true;
    appEl.classList.add('is-opening');
    openEl.hidden = false;
    const r = oCanvas.getBoundingClientRect();
    opening.W = r.width; opening.H = r.height;
    opening.dpr = Math.min(2, window.devicePixelRatio || 1);
    oCanvas.width = Math.round(r.width * opening.dpr);
    oCanvas.height = Math.round(r.height * opening.dpr);
    opening.t0 = performance.now();
    opening.raf = requestAnimationFrame(frameOpening);
  }
  const OP = { appear: 700, flights: 300, unrollAt: 3000, unroll: 1700 };
  function frameOpening(now) {
    if (!opening.running) return;
    const ms = now - opening.t0;
    const { W, H, dpr } = opening;
    const c = octx;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.globalAlpha = 1;
    c.fillStyle = PAPER; c.fillRect(0, 0, W, H);
    const R0 = Math.min(W, H) * (narrow.matches ? 0.36 : 0.3);
    const lam0 = -112 - ms / 1000 * 3;
    const tu = clamp((ms - OP.unrollAt) / OP.unroll);
    const e = inOut(tu);
    const home = state.z;
    const k = home.k, sEnd = state.S0 * k;
    const tEnd = [home.x + k * state.W / 2, home.y + k * state.H / 2];
    const pr = unroll(e);
    const appear = cubicOut(clamp(ms / OP.appear));
    pr.scale(lerp(R0 * (0.94 + 0.06 * appear), sEnd, e))
      .translate([lerp(W / 2, tEnd[0], e), lerp(H / 2, tEnd[1], e)])
      .rotate([lerp(lam0, -LON0, e), lerp(-24, 0, e)])
      .precision(0.8);
    const clip = e < 0.5 ? Math.min(179.9, (Math.acos(clamp(-e / (1 - e), -1, 1)) * 180) / Math.PI) : null;
    pr.clipAngle(clip);
    c.globalAlpha = appear;
    if (e === 0) {
      drawGlobe(c, pr, R0 * (0.94 + 0.06 * appear), W / 2, H / 2, 1.6);
    } else {
      const gp = d3.geoPath(pr, c);
      c.beginPath(); gp({ type: 'Sphere' });
      c.fillStyle = `rgba(250, 247, 239, ${1 - e})`; c.fill();
      c.save(); c.globalAlpha = appear * (1 - e);
      const sh = c.createRadialGradient(W / 2 - R0 * 0.3, H / 2 - R0 * 0.35, R0 * 0.55, W / 2 - R0 * 0.1, H / 2 - R0 * 0.1, R0 * 1.15);
      sh.addColorStop(0, 'rgba(28, 30, 36, 0)'); sh.addColorStop(1, 'rgba(28, 30, 36, 0.16)');
      c.fillStyle = sh; c.fill();
      c.beginPath(); gp(d3.geoGraticule10()); c.lineWidth = 0.8; c.strokeStyle = INKA(0.09); c.stroke();
      c.restore();
      c.beginPath(); gp({ type: 'Sphere' });
      c.lineWidth = 1.6 * (1 - e); c.strokeStyle = INKA(0.7 * (1 - e)); if (e < 0.98) c.stroke();
      if (state.land110) {
        c.beginPath(); gp(state.land110);
        c.fillStyle = INKA(0.12 + 0.04 * e); c.fill();
        c.lineWidth = 0.9; c.strokeStyle = INKA(0.45); c.stroke();
        c.beginPath();
        for (const cid of Object.keys(state.feats110)) gp(state.feats110[cid]);
        c.fillStyle = GREENA(0.45); c.fill();
      }
    }
    // the flights scatter across the large globe, then thin away as it unrolls
    const fa = appear * (1 - clamp(tu / 0.4));
    if (fa > 0) {
      const centre = [-lerp(lam0, -LON0, e), lerp(24, 0, e)];
      const tt = Math.max(0, (ms - OP.flights) / 1000) * 2.3;
      if (e === 0) drawFlights(c, pr, tt, 2.1, fa, centre);
    }
    if (tex.fibre) { c.globalAlpha = 1; c.fillStyle = tex.fibre; c.fillRect(0, 0, W, H); }
    if (tu >= 1) { finishOpening(); return; }
    opening.raf = requestAnimationFrame(frameOpening);
  }
  function finishOpening() {
    if (!opening.running) return;
    opening.running = false;
    cancelAnimationFrame(opening.raf);
    openEl.classList.add('is-gone');
    appEl.classList.remove('is-opening');
    appEl.classList.add('is-arriving');
    setTimeout(() => { openEl.hidden = true; }, 850);
    setTimeout(() => appEl.classList.remove('is-arriving'), 2200);
    flights.start = performance.now();
    scheduleFlights();
  }
  $('#opening-skip').addEventListener('click', finishOpening);
  openEl.addEventListener('pointerdown', (e) => { if (!e.target.closest('.opening__skip')) finishOpening(); });

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
      renderLeaf(page, pageCover);
      leafScroll.scrollTop = top;
    }
    if (photo) renderViewer();
    state.settle = 30;
    queueDraw();
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
    state.feats110 = featsFor(w110);
    queueDraw();
    scheduleFlights();
    const w50 = await fetch('../vendor/countries-50m.json').then((r) => r.json());
    state.land50 = topojson.feature(w50, w50.objects.land);
    state.feats50 = featsFor(w50);
    queueDraw();
  }
  function loadPainting() {
    loadImg('ink/ink-4096.jpg').then((i) => { tex.base = i; state.settle = 4; queueDraw(); }).catch(() => {});
    loadImg('ink/fibre.png').then((i) => { tex.fibre = ctx.createPattern(i, 'repeat'); queueDraw(); }).catch(() => {});
    loadImg('ink/bleed-2048.jpg').then((i) => { tex.bleed = i; }).catch(() => {});
  }

  function start() {
    applyWords();
    renderIndex();
    sizeMap();
    sizeFlights();
    renderPins();
    moveTo(homeTransform(), 0);
    state.settle = 40;
    queueDraw();
    loadPainting();
    const worldReady = loadWorld().catch(() => { /* the map still shows its seals and books */ });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measureLabels(); state.settle = 20; queueDraw(); });
    const want = parse(location.hash);
    if (want.page || want.photo) {
      try { history.replaceState({ inkwash: false, page: want.page, photo: want.photo }, '', location.href); } catch (e) { /* fine */ }
      apply(want, false);
    } else if (shouldOpen()) {
      appEl.classList.add('is-opening');
      worldReady.then(() => startOpening());
    }
    scheduleFlights();
    let rz = 0;
    window.addEventListener('resize', () => {
      cancelAnimationFrame(rz);
      rz = requestAnimationFrame(() => {
        const c = proj0.invert([state.z.invertX(state.W / 2), state.z.invertY(state.H / 2)]);
        const k = state.z.k;
        sizeMap();
        sizeFlights();
        const p = proj0(c);
        state.z = d3.zoomIdentity.translate(state.W / 2 - p[0] * k, state.H / 2 - p[1] * k).scale(k);
        sel.call(zoom.transform, state.z);
        state.settle = 20;
        queueDraw();
        scheduleFlights();
      });
    });
    updateZoomButtons();
  }
  start();
})();

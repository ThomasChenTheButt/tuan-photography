/* tuan photography 陳亮元 · design 2 · "Flight lines"
   A route map from home. Every line leaves Taipei on the great circle to a place he has
   photographed; a book stands at the end of each line and opens into its page.

   The map is one canvas (stippled land, the routes, the travelling point) moved by d3-zoom;
   the books are design 1's books, as HTML, placed over it. Data: window.SITE (../data.js). */
(() => {
  'use strict';

  const S = window.SITE;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const still = () => motionQuery.matches;
  const phoneQuery = matchMedia('(max-width: 47.99rem)');
  const EARTH_KM = 6371.0088;

  /* ------------------------------------------------------------------ words */
  const T = {
    en: {
      mapLabel: 'Route map from Taipei. Drag, or use the arrow keys, to move it. Plus and minus zoom.',
      toolsLabel: 'Language and Instagram',
      langLabel: 'Language',
      indexTitle: 'Routes from Taipei',
      sum: '{n} routes, {km} km in all',
      showRoutes: 'Show routes',
      hideRoutes: 'Hide routes',
      lgRoute: 'A route from Taipei, on the great circle',
      lgSeen: 'Blue land: countries I have photographed',
      lgBook: 'A book at the end of each line: open it',
      lgHome: 'Taipei, home base',
      zoomLabel: 'Zoom',
      zoomIn: 'Zoom in',
      zoomOut: 'Zoom out',
      zoomAll: 'Whole map',
      km: '{km} km',
      to: 'Taipei to {place}',
      homeLine: 'Taipei, home base',
      count: '{n} photographs',
      countOne: '1 photograph',
      row: '{place}, {km} km from Taipei, {date}. {status}',
      rowHome: '{place}, home base, {date}. {status}',
      prev: 'Previous',
      next: 'Next',
      photosLabel: 'Photographs',
      seeLarger: '{place}: see it larger, with how it was made',
      taipei: 'Taipei',
      guideMark: 'Guide',
      homeShort: 'Home base',
      pacific: 'Pacific Ocean',
      indian: 'Indian Ocean',
      of: '{i} of {n}',
    },
    zh: {
      mapLabel: '從台北出發的航線地圖。拖曳或用方向鍵移動，加號與減號縮放。',
      toolsLabel: '語言與 Instagram',
      langLabel: '語言',
      indexTitle: '從台北出發的航線',
      sum: '{n} 條航線，共 {km} 公里',
      showRoutes: '顯示航線',
      hideRoutes: '收起航線',
      lgRoute: '從台北出發的航線，沿大圓航線',
      lgSeen: '藍色的陸地：我拍過的國家',
      lgBook: '每條線的終點有一本書：打開它',
      lgHome: '台北，大本營',
      zoomLabel: '縮放',
      zoomIn: '放大',
      zoomOut: '縮小',
      zoomAll: '整張地圖',
      km: '{km} 公里',
      to: '台北到{place}',
      homeLine: '台北，大本營',
      count: '{n} 張作品',
      countOne: '1 張作品',
      row: '{place}，距台北 {km} 公里，{date}。{status}',
      rowHome: '{place}，大本營，{date}。{status}',
      prev: '上一張',
      next: '下一張',
      photosLabel: '作品',
      seeLarger: '{place}：看大圖與拍攝資料',
      taipei: '台北',
      guideMark: '攻略',
      homeShort: '大本營',
      pacific: '太平洋',
      indian: '印度洋',
      of: '第 {i} 張，共 {n} 張',
    },
  };

  let lang = 'en';
  try {
    const q = new URLSearchParams(location.search).get('lang');
    const saved = localStorage.getItem('tlap-lang');
    lang = q === 'zh' || q === 'en' ? q : saved === 'zh' ? 'zh' : 'en';
  } catch (e) { /* storage blocked: English */ }

  const t = (k, vars) => {
    let s = (T[lang] && T[lang][k]) ?? (S.i18n[lang] && S.i18n[lang][k]) ?? T.en[k] ?? k;
    if (vars) for (const [a, b] of Object.entries(vars)) s = s.split(`{${a}}`).join(b);
    return s;
  };
  const L = (o) => (o ? (o[lang] ?? o.en ?? '') : '');
  const fmt = (n) => Math.round(n).toLocaleString('en-US');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ------------------------------------------------------------------ places */
  const ISO = {
    spain: '724', uk: '826', france: '250', germany: '276', switzerland: '756', taiwan: '158',
    japan: '392', 'south-korea': '410', 'hong-kong': '344', china: '156', singapore: '702',
    vietnam: '704', dubai: '784', australia: '036', 'new-zealand': '554', usa: '840',
  };
  const homeC = S.countries.find((c) => c.id === S.home);
  const HOME = [homeC.ll[1], homeC.ll[0]];

  const places = S.countries.map((c) => {
    const book = S.books.find((b) => b.country === c.id);
    const lonlat = book && book.guide && S.guides[book.guide] ? [S.guides[book.guide].ll[1], S.guides[book.guide].ll[0]] : [c.ll[1], c.ll[0]];
    const km = c.id === S.home ? 0 : Math.round((d3.geoDistance(HOME, lonlat) * EARTH_KM) / 10) * 10;
    return {
      id: c.id, c, book, lonlat, km,
      home: c.id === S.home,
      hash: book.guide ? `guide-${book.guide}` : `place-${c.id}`,
    };
  });
  const byId = new Map(places.map((p) => [p.id, p]));
  const byHash = new Map(places.map((p) => [p.hash, p]));
  const routes = places.filter((p) => !p.home).sort((a, b) => a.km - b.km);
  const home = places.find((p) => p.home);
  const totalKm = routes.reduce((s, p) => s + p.km, 0);

  /* ------------------------------------------------------------------ the projection
     Pacific-centred Natural Earth, the in-flight map from Taiwan: Europe on the left,
     the Americas on the right, every route from Taipei drawn whole. "Map space" is this
     projection at a fixed width; d3-zoom maps it to the screen. */
  const MW = 3072;
  const proj = d3.geoNaturalEarth1().rotate([-140, 0]).fitWidth(MW, { type: 'Sphere' });
  const MH = Math.ceil(d3.geoPath(proj).bounds({ type: 'Sphere' })[1][1]);

  for (const p of places) {
    p.m = proj(p.lonlat);
    if (p.home) continue;
    const step = d3.geoInterpolate(HOME, p.lonlat);
    const N = 128;
    const pts = [];
    for (let i = 0; i <= N; i++) pts.push(proj(step(i / N)));
    const len = [0];
    for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    p.path = pts;
    p.len = len;
    p.scr = new Float32Array(pts.length * 2);
  }
  const homeM = home.m;
  const spots = Object.values(S.slides).filter((s) => s.ll).map((s) => proj([s.ll[1], s.ll[0]]));
  const oceans = [
    { k: 'pacific', m: proj([-168, 8]) },
    { k: 'indian', m: proj([78, -22]) },
  ];

  /* ------------------------------------------------------------------ colours for the canvas
     (the same values as the tokens in style.css) */
  const C = { sky: '#f9fbfd', land: '#a9b0bd', seen: '#5f7fd6', route: '#223fca', ink: '#151c2d', ink2: '#505869' };

  /* ------------------------------------------------------------------ elements */
  const app = $('#app');
  const mapEl = $('#map');
  const canvas = $('#canvas');
  const ctx = canvas.getContext('2d');
  const pinsEl = $('#pins');
  const tagsEl = $('#tags');
  const indexEl = $('#index');
  const listEl = $('#index-list');
  const toggleEl = $('#index-toggle');
  const page = $('#page');
  const pageBody = $('#page-body');
  const viewer = $('#viewer');

  let W = 0, H = 0, dpr = 1;
  let kFit = 1, fitT = d3.zoomIdentity, zt = d3.zoomIdentity;
  let mask = null;

  /* ------------------------------------------------------------------ the land mask
     Land is drawn once into a bitmap in map space: 1 land, 2 a country he has
     photographed, 3 home. The stipple samples it at a spacing that suits the zoom. */
  function buildMask(topo) {
    const c = document.createElement('canvas');
    c.width = MW; c.height = MH;
    const g = c.getContext('2d', { willReadFrequently: true });
    const path = d3.geoPath(proj, g);
    const all = topojson.feature(topo, topo.objects.countries).features;
    g.fillStyle = 'rgb(255,0,0)';
    g.beginPath(); path({ type: 'FeatureCollection', features: all }); g.fill();
    const seen = new Set(Object.values(ISO));
    for (const f of all) {
      if (!seen.has(f.id)) continue;
      g.fillStyle = f.id === ISO[S.home] ? 'rgb(255,250,0)' : 'rgb(255,120,0)';
      g.beginPath(); path(f); g.fill();
    }
    const px = g.getImageData(0, 0, MW, MH).data;
    const m = new Uint8Array(MW * MH);
    for (let i = 0, j = 0; i < m.length; i++, j += 4) {
      if (px[j] < 128) continue;
      const gg = px[j + 1];
      m[i] = gg > 185 ? 3 : gg > 60 ? 2 : 1;
    }
    return m;
  }

  /* ------------------------------------------------------------------ the books */
  function bookHTML(p) {
    const b = p.book;
    const title = esc(L(b.title));
    const band = esc(t(b.band));
    let face;
    if (b.photo && S.slides[b.photo]) {
      const s = S.slides[b.photo];
      face = `<span class="book__face"><img src="../images/web/640/${s.file}" width="${s.w}" height="${s.h}" alt="" decoding="async">`;
    } else {
      face = `<span class="book__face book__face--blank"><b>${title}</b>`;
    }
    return `<a class="book book--${b.tone}" href="#${p.hash}" tabindex="-1" aria-hidden="true"><span class="book__box">` +
      `<span class="book__spine"><b>${title}</b><i>${esc(t('series'))}</i></span>` +
      `${face}<span class="book__band"><b>${title}</b><span>${band}</span></span></span>` +
      `<span class="book__back"><i>${esc(t('series'))}</i></span><span class="book__edge"></span>` +
      `<span class="book__top"></span><span class="book__shadow"></span></span></a>`;
  }

  function buildPins() {
    pinsEl.textContent = '';
    tagsEl.textContent = '';
    for (const p of places) {
      const pin = document.createElement('div');
      pin.className = 'pin';
      pin.dataset.id = p.id;
      pin.innerHTML = `<div class="pin__lift">${bookHTML(p)}</div>`;
      pinsEl.append(pin);
      p.pin = pin;
      const tag = document.createElement('div');
      tag.className = 'tag';
      const line = p.home ? `<span>${esc(t('homeLine'))}</span>` : `<span class="num">${esc(t('km', { km: fmt(p.km) }))}</span>`;
      tag.innerHTML = `<b class="tag__name wide">${esc(L(p.book.title))}</b><span class="tag__line">${line}<span class="num">${esc(L(p.c.date))}</span></span>`;
      tagsEl.append(tag);
      p.tag = tag;
      p.bx = p.by = p.ps = NaN;
    }
  }

  /* ------------------------------------------------------------------ the route index */
  function statusLine(p) {
    const n = p.c.photos.length;
    if (p.book.guide) return { text: t('bandGuide'), guide: true };
    if (!n) return { text: t('bandNone') };
    return { text: n === 1 ? t('countOne') : t('count', { n }) };
  }
  function buildIndex() {
    $('#index-sum').textContent = t('sum', { n: routes.length, km: fmt(totalKm) });
    listEl.textContent = '';
    for (const p of [home, ...routes]) {
      const st = statusLine(p);
      const status = p.book.guide ? t('bookOpen') : st.text;
      const label = p.home
        ? t('rowHome', { place: L(p.book.title), date: L(p.c.date), status })
        : t('row', { place: L(p.book.title), km: fmt(p.km), date: L(p.c.date), status });
      const li = document.createElement('li');
      li.innerHTML = `<a class="route${p.home ? ' route--home' : ''}" href="#${p.hash}" data-id="${p.id}" aria-label="${esc(label)}">` +
        `<span class="route__name"><b>${esc(L(p.book.title))}</b>${st.guide ? `<small>${esc(t('guideMark'))}</small>` : ''}</span>` +
        `<span class="km">${p.home ? esc(t('homeShort')) : esc(t('km', { km: fmt(p.km) }))}</span>` +
        `<span class="when">${esc(L(p.c.date))}</span></a>`;
      listEl.append(li);
      p.row = li.firstChild;
    }
  }

  /* ------------------------------------------------------------------ language */
  function applyLang() {
    document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en';
    $$('[data-t]').forEach((el) => { el.textContent = t(el.dataset.t); });
    $$('[data-t-aria]').forEach((el) => el.setAttribute('aria-label', t(el.dataset.tAria)));
    $$('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    syncToggle();
    buildIndex();
    buildPins();
    if (active) setActive(active, {});
    if (openP) {
      const top = page.scrollTop;
      renderPage(openP);
      page.scrollTop = top;
      const pin = openP.pin; pin.classList.add('is-hidden', 'is-on');
    }
    request();
  }
  function setLang(next) {
    if (next === lang) return;
    lang = next;
    try { localStorage.setItem('tlap-lang', lang); } catch (e) { /* not remembered */ }
    applyLang();
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.lang button');
    if (b) setLang(b.dataset.lang);
  });

  /* ------------------------------------------------------------------ drawing */
  let needDraw = false;
  let loadT0 = 0;
  const DRAW_MS = 1150, STAGGER = 120, LEAD = 250;
  function request() {
    if (needDraw) return;
    needDraw = true;
    requestAnimationFrame(frame);
  }
  function frame() {
    const now = performance.now();
    needDraw = false;
    const more = draw(now);
    layoutPins();
    if (more) request();
  }

  const toS = (m) => [zt.x + zt.k * m[0], zt.y + zt.k * m[1]];

  function drawDots() {
    if (!mask || !(zt.k > 0)) return;
    const k = zt.k;
    const gap = phoneQuery.matches ? 4.2 : 4.6;
    const s = gap / k;
    let fine, coarse, fade;
    if (s <= 1) { fine = 1; coarse = 1; fade = 1; }
    else {
      const lv = Math.log2(s);
      const lo = Math.floor(lv);
      fine = 2 ** lo; coarse = fine * 2; fade = 1 - (lv - lo);
    }
    const x0 = Math.max(0, Math.floor(-zt.x / k)), x1 = Math.min(MW - 1, Math.ceil((W - zt.x) / k));
    const y0 = Math.max(0, Math.floor(-zt.y / k)), y1 = Math.min(MH - 1, Math.ceil((H - zt.y) / k));
    const d = Math.min(2.8, Math.max(1.5, 1.5 * Math.pow(k / kFit, 0.22)));
    const h = d / 2;
    const buckets = [[], [], [], [], [], []]; // [cat-1] coarse, [cat+2] fine
    const sx = Math.ceil(x0 / fine) * fine, sy = Math.ceil(y0 / fine) * fine;
    for (let my = sy; my <= y1; my += fine) {
      const rowC = my % coarse === 0;
      const base = my * MW;
      const py = zt.y + k * my - h;
      for (let mx = sx; mx <= x1; mx += fine) {
        const v = mask[base + mx];
        if (!v) continue;
        const onC = rowC && mx % coarse === 0;
        const arr = buckets[(v - 1) + (onC ? 0 : 3)];
        arr.push(zt.x + k * mx - h, py);
      }
    }
    const cols = [C.land, C.seen, C.route];
    for (let b = 0; b < 6; b++) {
      const arr = buckets[b];
      if (!arr.length) continue;
      ctx.globalAlpha = b < 3 ? 1 : fade;
      if (ctx.globalAlpha < 0.04) continue;
      ctx.fillStyle = cols[b % 3];
      for (let i = 0; i < arr.length; i += 2) ctx.fillRect(arr[i], arr[i + 1], d, d);
    }
    ctx.globalAlpha = 1;
  }

  function strokeRoute(p, frac) {
    const n = p.path.length - 1;
    const end = frac * p.len[n];
    const sc = p.scr;
    ctx.beginPath();
    ctx.moveTo(sc[0], sc[1]);
    let i = 1;
    for (; i <= n && p.len[i] <= end; i++) ctx.lineTo(sc[i * 2], sc[i * 2 + 1]);
    if (i <= n && frac < 1) {
      const a = (end - p.len[i - 1]) / (p.len[i] - p.len[i - 1] || 1);
      ctx.lineTo(sc[(i - 1) * 2] + (sc[i * 2] - sc[(i - 1) * 2]) * a, sc[(i - 1) * 2 + 1] + (sc[i * 2 + 1] - sc[(i - 1) * 2 + 1]) * a);
    }
    ctx.stroke();
  }
  function pointAt(p, frac) {
    const n = p.path.length - 1;
    const end = frac * p.len[n];
    let i = 1;
    while (i < n && p.len[i] < end) i++;
    const a = (end - p.len[i - 1]) / (p.len[i] - p.len[i - 1] || 1);
    const sc = p.scr;
    return [sc[(i - 1) * 2] + (sc[i * 2] - sc[(i - 1) * 2]) * a, sc[(i - 1) * 2 + 1] + (sc[i * 2 + 1] - sc[(i - 1) * 2 + 1]) * a];
  }

  let travel = null;
  function draw(now) {
    let more = false;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = C.sky;
    ctx.fillRect(0, 0, W, H);
    drawDots();

    const z = zt.k / kFit;
    // ocean names, quiet, in spaced capitals
    ctx.font = `500 ${phoneQuery.matches ? 9 : 10.5}px Archivo, "Noto Sans TC", sans-serif`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = lang === 'zh' ? '0.5em' : '0.42em';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = C.ink2;
    ctx.globalAlpha = 0.55;
    for (const o of oceans) {
      const [x, y] = toS(o.m);
      ctx.fillText(t(o.k).toUpperCase(), x, y);
    }
    ctx.globalAlpha = 1;
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';

    // where the photographs were taken, once you are close enough
    if (z > 2.2) {
      ctx.globalAlpha = Math.min(1, (z - 2.2) / 1.2) * 0.85;
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 1;
      ctx.fillStyle = C.sky;
      for (const m of spots) {
        const [x, y] = toS(m);
        if (x < -10 || y < -10 || x > W + 10 || y > H + 10) continue;
        ctx.beginPath(); ctx.arc(x, y, 2.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // the routes
    const sinceLoad = now - loadT0;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    routes.forEach((p, i) => {
      const sc = p.scr;
      for (let j = 0; j < p.path.length; j++) {
        sc[j * 2] = zt.x + zt.k * p.path[j][0];
        sc[j * 2 + 1] = zt.y + zt.k * p.path[j][1];
      }
      let frac = 1;
      if (!still()) {
        const local = (sinceLoad - LEAD - i * STAGGER) / DRAW_MS;
        frac = Math.max(0, Math.min(1, local));
        frac = frac >= 1 ? 1 : 1 - Math.pow(1 - frac, 3);
        if (local < 1) more = true;
      }
      p.frac = frac;
      if (frac <= 0) return;
      const on = active === p.id;
      const dim = active && !on;
      ctx.strokeStyle = C.route;
      ctx.globalAlpha = dim ? 0.16 : on ? 1 : 0.85;
      ctx.lineWidth = on ? 2.75 : 1.25;
      strokeRoute(p, frac);
      if (frac >= 1) {
        const [x, y] = [sc[sc.length - 2], sc[sc.length - 1]];
        ctx.beginPath(); ctx.arc(x, y, on ? 3.6 : 2.6, 0, Math.PI * 2);
        ctx.fillStyle = C.route; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = C.sky; ctx.stroke();
      }
    });
    ctx.globalAlpha = 1;

    // leader lines from each place to its book, where the book has been moved aside
    ctx.strokeStyle = C.ink2;
    ctx.lineWidth = 1;
    for (const p of places) {
      if (!(p.lead > 6)) continue;
      const [ax, ay] = toS(p.m);
      ctx.globalAlpha = active && active !== p.id ? 0.2 : 0.75;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(p.bx, p.by); ctx.stroke();
      if (p.home) continue;
    }
    ctx.globalAlpha = 1;

    // home: a hub ring at Taipei
    const [hx, hy] = toS(homeM);
    ctx.beginPath(); ctx.arc(hx, hy, 7, 0, Math.PI * 2);
    ctx.fillStyle = C.sky; ctx.fill();
    ctx.lineWidth = 1.6; ctx.strokeStyle = C.route; ctx.stroke();
    ctx.beginPath(); ctx.arc(hx, hy, 2.8, 0, Math.PI * 2); ctx.fillStyle = C.route; ctx.fill();

    // the travelling point, from Taipei along the chosen line
    if (travel && !still()) {
      const p = byId.get(travel.id);
      if (p && !p.home && p.frac >= 1) {
        const dur = 700 + (p.km / 12500) * 1100;
        const raw = (now - travel.t0) / dur;
        if (raw < 1.35) {
          const q = d3.easeCubicInOut(Math.min(1, raw));
          const [x, y] = pointAt(p, q);
          const fade = raw > 1 ? 1 - (raw - 1) / 0.35 : 1;
          ctx.globalAlpha = fade;
          ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(34,63,202,0.14)'; ctx.fill();
          ctx.beginPath(); ctx.arc(x, y, 4.2, 0, Math.PI * 2);
          ctx.fillStyle = C.route; ctx.fill();
          ctx.lineWidth = 1.6; ctx.strokeStyle = C.sky; ctx.stroke();
          ctx.globalAlpha = 1;
          more = true;
        } else travel = null;
      } else if (p && p.frac < 1) more = true;
    }
    return more;
  }

  /* ------------------------------------------------------------------ placing the books
     Each book stands on its place. Where places are close (Europe, the coast of China),
     the books are nudged apart in screen space and a hairline leads back to the place.
     The map's own panels are obstacles too, so no book hides under them. */
  const BW = 192, BH = 272;
  function scaleFor(k) {
    const base = phoneQuery.matches ? 0.19 : 0.25;
    return Math.min(0.62, base * Math.pow(k / kFit, 0.5));
  }
  const bookScale = () => scaleFor(zt.k);
  // a woken book grows, but never past about 150px wide
  const liftFor = (s) => Math.min(1.75, Math.max(1.1, 150 / (BW * s)));
  function obstacles() {
    const out = [];
    const add = (el) => {
      if (!el || !el.offsetParent && getComputedStyle(el).position !== 'fixed') return;
      const r = el.getBoundingClientRect();
      if (r.width && r.height) out.push({ l: r.left, t: r.top, r: r.right, b: r.bottom });
    };
    add(indexEl); add($('.legend')); add($('.mast')); add($('.tools'));
    if (phoneQuery.matches) add($('.zoom-phone'));
    return out;
  }
  let obs = [];
  function layoutPins() {
    const s = bookScale();
    const w = BW * s, h = BH * s;
    const m = Math.max(3, 6 * s);
    const n = places.length;
    for (const p of places) {
      const [ax, ay] = toS(p.m);
      p.ax = ax; p.ay = ay;
      p.nx = ax; p.ny = ay - 4;
    }
    for (let it = 0; it < 40; it++) {
      let moved = false;
      for (let i = 0; i < n; i++) {
        const a = places[i];
        for (let j = i + 1; j < n; j++) {
          const b = places[j];
          const ox = (w + m) - Math.abs(a.nx - b.nx);
          const oy = (h + m) - Math.abs(a.ny - b.ny);
          if (ox <= 0 || oy <= 0) continue;
          moved = true;
          if (ox < oy * 1.25) {
            const dir = (a.ax - b.ax) || (i - j);
            const d = (ox / 2) * Math.sign(dir);
            a.nx += d; b.nx -= d;
          } else {
            const dir = (a.ay - b.ay) || (i - j);
            const d = (oy / 2) * Math.sign(dir);
            a.ny += d; b.ny -= d;
          }
        }
        if (a.ax >= 0 && a.ax <= W && a.ay >= 0 && a.ay <= H) {
          const lo = w / 2 + 6, hi = W - w / 2 - 6;
          if (a.nx < lo) { a.nx = lo; moved = true; } else if (a.nx > hi) { a.nx = hi; moved = true; }
          if (a.ny - h < 6) { a.ny = h + 6; moved = true; }
        }
        for (const o of obs) {
          const l = a.nx - w / 2, r = a.nx + w / 2, tp = a.ny - h, bt = a.ny;
          if (r <= o.l || l >= o.r || bt <= o.t || tp >= o.b) continue;
          moved = true;
          const pushL = r - o.l + 2, pushR = o.r - l + 2, pushU = bt - o.t + 2, pushD = o.b - tp + 2;
          const min = Math.min(pushL, pushR, pushU, pushD);
          if (min === pushL) a.nx -= pushL; else if (min === pushR) a.nx += pushR;
          else if (min === pushU) a.ny -= pushU; else a.ny += pushD;
        }
      }
      if (!moved) break;
    }
    for (const p of places) {
      if (p.ax >= 0 && p.ax <= W && p.ay >= 0 && p.ay <= H) p.nx = Math.min(W - w / 2 - 6, Math.max(w / 2 + 6, p.nx));
      p.lead = Math.hypot(p.nx - p.ax, p.ny - p.ay);
      if (p.nx !== p.bx || p.ny !== p.by || s !== p.ps) {
        p.bx = p.nx; p.by = p.ny; p.ps = s;
        p.pin.style.setProperty('--x', `${p.bx.toFixed(1)}px`);
        p.pin.style.setProperty('--y', `${p.by.toFixed(1)}px`);
        p.pin.style.setProperty('--s', s.toFixed(4));
        const lift = liftFor(s);
        p.pin.style.setProperty('--lift', lift.toFixed(3));
        p.tag.style.setProperty('--x', `${p.bx.toFixed(1)}px`);
        p.tag.style.setProperty('--y', `${(p.by - (BH + 24) * s * lift - 10).toFixed(1)}px`);
      }
    }
  }

  /* ------------------------------------------------------------------ the camera */
  const zoom = d3.zoom()
    .on('start', (e) => { if (e.sourceEvent && e.sourceEvent.type !== 'wheel') mapEl.classList.add('is-dragging'); })
    .on('zoom', (e) => { zt = e.transform; request(); })
    .on('end', () => mapEl.classList.remove('is-dragging'));
  const mapSel = d3.select(mapEl);

  function freeArea() {
    // the part of the window not covered by the route index
    let r = W, b = H, top = 70, l = 0;
    if (phoneQuery.matches) { b = H - 70; top = 60; }
    return { l, top, r, b };
  }
  function fit() {
    const phone = phoneQuery.matches;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    const take = (pt) => { x0 = Math.min(x0, pt[0]); y0 = Math.min(y0, pt[1]); x1 = Math.max(x1, pt[0]); y1 = Math.max(y1, pt[1]); };
    for (const p of places) {
      if (phone && (p.id === 'usa' || p.c.continent === 'europe')) continue;
      take(p.m);
      if (p.path && !phone) p.path.forEach(take);
    }
    const pad = phone ? { l: 40, r: 40, t: 190, b: 150 } : { l: Math.max(150, W * 0.1), r: Math.max(80, W * 0.06), t: 120, b: 44 };
    const k = Math.min((W - pad.l - pad.r) / (x1 - x0), (H - pad.t - pad.b) / (y1 - y0));
    const x = pad.l + (W - pad.l - pad.r - (x1 - x0) * k) / 2 - x0 * k;
    const y = pad.t + (H - pad.t - pad.b - (y1 - y0) * k) / 2 - y0 * k;
    kFit = k;
    fitT = d3.zoomIdentity.translate(x, y).scale(k);
    zoom.scaleExtent([k * 0.8, k * 18]).translateExtent([[-MW * 0.15, -MH * 0.15], [MW * 1.15, MH * 1.15]]);
  }
  function camera(T, dur = 900) {
    mapSel.interrupt('cam');
    if (still() || dur === 0) mapSel.call(zoom.transform, T);
    else mapSel.transition('cam').duration(dur).ease(d3.easeExpOut).call(zoom.transform, T);
  }
  function routeView(p) {
    const a = freeArea();
    const pts = p.home ? [homeM, byId.get('japan').m, byId.get('vietnam').m, byId.get('hong-kong').m] : p.path;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const q of pts) { x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]); }
    let r = a.r;
    if (!phoneQuery.matches) {
      const ir = indexEl.getBoundingClientRect();
      if (ir.width) r = Math.max(W * 0.55, ir.left - 20);
    }
    const room = (k) => { const s = scaleFor(k); const L = liftFor(s); return BH * s * L + 24 * s * L + 90; };
    const aw = r - a.l - 200;
    let k = Math.min(aw / Math.max(1, x1 - x0), (a.b - a.top - room(kFit * 2)) / Math.max(1, y1 - y0));
    k = Math.max(kFit, Math.min(kFit * 3.2, k));
    const bookRoom = room(k);
    k = Math.max(kFit, Math.min(k, (a.b - a.top - bookRoom) / Math.max(1, y1 - y0)));
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const tx = a.l + (r - a.l) / 2 - cx * k;
    const ty = a.top + bookRoom + (a.b - a.top - bookRoom) / 2 - cy * k;
    return d3.zoomIdentity.translate(tx, ty).scale(k);
  }

  function resize() {
    W = mapEl.clientWidth || innerWidth; H = mapEl.clientHeight || innerHeight;
    if (W < 40 || H < 40) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    fit();
    zt = fitT;
    mapSel.call(zoom.transform, fitT);
    obs = obstacles();
    request();
  }

  /* ------------------------------------------------------------------ choosing a route */
  let active = null;
  function setActive(id, { cam = false } = {}) {
    const was = active;
    active = id;
    for (const p of places) {
      const on = p.id === id;
      p.pin.classList.toggle('is-on', on);
      p.pin.classList.toggle('is-faded', !!id && !on);
      p.tag.classList.toggle('is-on', on);
      if (p.row) p.row.classList.toggle('is-on', on);
    }
    if (id && id !== was) travel = { id, t0: performance.now() };
    if (cam && id) camera(routeView(byId.get(id)));
    request();
  }

  // pointer on the map: near a book it stirs; on a line, the line is chosen
  let hoverRoute = null, nearPin = null, overPin = null;
  function hitRoute(x, y) {
    let best = null, bd = 9;
    for (const p of routes) {
      if (p.frac < 1) continue;
      const sc = p.scr;
      for (let i = 2; i < sc.length; i += 2) {
        const x1 = sc[i - 2], y1 = sc[i - 1], x2 = sc[i], y2 = sc[i + 1];
        const dx = x2 - x1, dy = y2 - y1;
        const l2 = dx * dx + dy * dy || 1;
        const u = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / l2));
        const d = Math.hypot(x - (x1 + u * dx), y - (y1 + u * dy));
        if (d < bd) { bd = d; best = p; }
      }
    }
    return best;
  }
  mapEl.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch' || mapEl.classList.contains('is-dragging')) return;
    const r = mapEl.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    // the nearest book stirs
    const s = bookScale();
    let near = null, nd = Math.max(70, BW * s * 1.4);
    for (const p of places) {
      const d = Math.hypot(x - p.bx, y - (p.by - BH * s / 2));
      if (d < nd) { nd = d; near = p; }
    }
    if (near !== nearPin) {
      if (nearPin) nearPin.pin.classList.remove('is-near');
      nearPin = near;
      if (near) near.pin.classList.add('is-near');
    }
    if (overPin) return;
    const hit = e.target.closest('.pin') ? null : hitRoute(x, y);
    if (hit !== hoverRoute) {
      hoverRoute = hit;
      mapEl.classList.toggle('is-route', !!hit);
      if (hit) setActive(hit.id);
      else if (!listFocus) setActive(null);
    }
  });
  mapEl.addEventListener('pointerleave', () => {
    if (nearPin) nearPin.pin.classList.remove('is-near');
    nearPin = null;
    if (hoverRoute && !listFocus) setActive(null);
    hoverRoute = null;
    mapEl.classList.remove('is-route');
  });
  mapEl.addEventListener('click', (e) => {
    const pin = e.target.closest('.pin');
    if (pin) {
      e.preventDefault();
      openPage(byId.get(pin.dataset.id), { from: 'map' });
      return;
    }
    if (e.defaultPrevented) return;
    const r = mapEl.getBoundingClientRect();
    const hit = hitRoute(e.clientX - r.left, e.clientY - r.top);
    if (hit) openPage(hit, { from: 'map' });
  });
  pinsEl.addEventListener('pointerover', (e) => {
    const pin = e.target.closest('.pin');
    if (!pin || e.pointerType === 'touch') return;
    const p = byId.get(pin.dataset.id);
    if (overPin === p) return;
    if (overPin) overPin.pin.classList.remove('is-awake');
    overPin = p;
    pin.classList.add('is-awake');
    hoverRoute = null;
    setActive(p.id);
  });
  pinsEl.addEventListener('pointerout', (e) => {
    const pin = e.target.closest('.pin');
    if (!pin || (e.relatedTarget && pin.contains(e.relatedTarget))) return;
    if (openP && openP.pin === pin) return;
    pin.classList.remove('is-awake');
    if (overPin && overPin.pin === pin) overPin = null;
    if (!listFocus) setActive(null);
  });

  // the route index: hover or focus chooses a route and eases the map toward it
  let listFocus = false, camTimer = 0;
  listEl.addEventListener('pointerover', (e) => {
    const a = e.target.closest('.route');
    if (!a || e.pointerType === 'touch') return;
    listFocus = true;
    const p = byId.get(a.dataset.id);
    setActive(p.id);
    clearTimeout(camTimer);
    camTimer = setTimeout(() => camera(routeView(p)), 160);
  });
  listEl.addEventListener('pointerleave', () => {
    clearTimeout(camTimer);
    listFocus = listEl.contains(document.activeElement);
    if (!listFocus) setActive(null);
  });
  listEl.addEventListener('focusin', (e) => {
    const a = e.target.closest('.route');
    if (!a) return;
    listFocus = true;
    if (phoneQuery.matches) openDrawer(true);
    setActive(a.dataset.id, { cam: true });
  });
  listEl.addEventListener('focusout', (e) => {
    if (listEl.contains(e.relatedTarget)) return;
    listFocus = false;
    setActive(null);
  });
  listEl.addEventListener('click', (e) => {
    const a = e.target.closest('.route');
    if (!a) return;
    e.preventDefault();
    clearTimeout(camTimer);
    openPage(byId.get(a.dataset.id), { from: 'list' });
  });

  // phone: the route index is a drawer
  function syncToggle() {
    const open = indexEl.classList.contains('is-open');
    toggleEl.setAttribute('aria-expanded', String(open));
    toggleEl.firstElementChild.textContent = t(open ? 'hideRoutes' : 'showRoutes');
  }
  function openDrawer(open) {
    indexEl.classList.toggle('is-open', open);
    syncToggle();
  }
  toggleEl.addEventListener('click', () => openDrawer(!indexEl.classList.contains('is-open')));

  // zoom words and keys
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-zoom]');
    if (!b) return;
    const how = b.dataset.zoom;
    if (how === 'all') camera(fitT, 800);
    else mapSel.transition('cam').duration(still() ? 0 : 420).ease(d3.easeExpOut).call(zoom.scaleBy, how === 'in' ? 1.8 : 1 / 1.8);
  });
  mapEl.addEventListener('keydown', (e) => {
    const step = 90;
    const pan = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }[e.key];
    if (pan) {
      e.preventDefault();
      mapSel.transition('cam').duration(still() ? 0 : 260).ease(d3.easeCubicOut).call(zoom.translateBy, pan[0] / zt.k, pan[1] / zt.k);
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      mapSel.transition('cam').duration(still() ? 0 : 380).ease(d3.easeExpOut).call(zoom.scaleBy, 1.6);
    } else if (e.key === '-' || e.key === '_') {
      e.preventDefault();
      mapSel.transition('cam').duration(still() ? 0 : 380).ease(d3.easeExpOut).call(zoom.scaleBy, 1 / 1.6);
    } else if (e.key === '0') {
      camera(fitT, 700);
    }
  });

  /* ------------------------------------------------------------------ the pages */
  let openP = null, pushed = false, running = [];
  const finishAll = () => { running.forEach((a) => { try { a.finish(); } catch (e) { /* gone */ } }); running = []; };

  function routeLine(p) {
    if (p.home) return `<b>${esc(t('homeLine'))}</b><span class="cap num">${esc(L(p.c.date))}</span>`;
    return `<b>${esc(t('to', { place: L(p.book.title) }))}</b><span class="cap num">${esc(t('km', { km: fmt(p.km) }))}</span><span class="cap num">${esc(L(p.c.date))}</span>`;
  }

  function renderGuide(p) {
    const g = S.guides[p.book.guide];
    const dict = g.i18n[lang] || g.i18n.en;
    pageBody.innerHTML = `<div class="guide">${g.html}</div>`;
    const root = pageBody.firstElementChild;
    const h1 = $('h1', root);
    if (h1) { h1.classList.add('wide'); h1.id = 'page-title'; }
    const say = $('.guide-top__say', root);
    if (say) say.insertAdjacentHTML('beforeend', `<p class="guide-facts">${esc(L(g.facts))}</p><p class="guide-route">${routeLine(p)}</p>`);
    $$('[data-i18n]', root).forEach((el) => { const v = dict[el.dataset.i18n]; if (v != null) el.textContent = v; });
    $$('[data-i18n-html]', root).forEach((el) => { const v = dict[el.dataset.i18nHtml]; if (v != null) el.innerHTML = v; });
    $$('[data-i18n-alt]', root).forEach((el) => {
      const k = el.dataset.i18nAlt; const id = k.replace(/^sa_/, '');
      const v = dict[k] ?? (S.slides[id] && L(S.slides[id].alt));
      if (v != null) el.alt = v;
    });
    $$('[data-i18n-aria]', root).forEach((el) => {
      const k = el.dataset.i18nAria; const id = k.replace(/^sl_/, '');
      const v = dict[k] ?? (S.slides[id] && `${L(S.slides[id].place)}${lang === 'zh' ? '：' : ': '}${t('made')}`);
      if (v != null) el.setAttribute('aria-label', v);
    });
    // the guide's photographs open in the viewer, in the order they appear
    const ids = $$('a[data-slide]', root).map((a) => a.dataset.slide).filter((v, i, a) => S.slides[v] && a.indexOf(v) === i);
    root.dataset.slides = ids.join(' ');
  }

  function renderPlace(p) {
    const ids = p.c.photos.filter((id) => S.slides[id]);
    const name = L(p.book.title);
    let html = `<header class="head"><h1 class="wide" id="page-title">${esc(name)}</h1>` +
      `<p class="head__route">${routeLine(p)}</p>` +
      `<p class="head__note">${esc(L(p.c.note))}</p>` +
      `<p class="head__quiet cap">${esc(t('bookNot'))}</p></header>`;
    if (!ids.length) {
      html += `<p class="empty">${esc(t('bandNone'))}</p>`;
    } else {
      html += `<div class="shots" data-slides="${ids.join(' ')}">` + ids.map((id) => {
        const s = S.slides[id];
        return `<figure class="shot" data-ar="${(s.w / s.h).toFixed(4)}"><button type="button" data-slide="${id}" aria-label="${esc(t('seeLarger', { place: L(s.place) }))}">` +
          `<img src="../images/web/1280/${s.file}" srcset="../images/web/640/${s.file} 640w, ../images/web/1280/${s.file} 1280w" sizes="(max-width: 48rem) 92vw, 46vw" width="${s.w}" height="${s.h}" alt="${esc(L(s.alt))}" loading="lazy" decoding="async"></button>` +
          `<figcaption><b>${esc(L(s.place))}</b><span>${esc(L(s.where))}</span></figcaption></figure>`;
      }).join('') + '</div>';
    }
    pageBody.innerHTML = html;
    $$('.shot', pageBody).forEach((f) => f.style.setProperty('--ar', f.dataset.ar));
  }

  function renderPage(p) {
    if (p.book.guide && S.guides[p.book.guide]) renderGuide(p);
    else renderPlace(p);
    document.title = `${L(p.book.title)} · tuan photography 陳亮元`;
  }

  const insetOf = (r) => `inset(${Math.max(0, r.top)}px ${Math.max(0, innerWidth - r.right)}px ${Math.max(0, innerHeight - r.bottom)}px ${Math.max(0, r.left)}px)`;
  const visible = (r) => r.width > 4 && r.right > 0 && r.bottom > 0 && r.left < innerWidth && r.top < innerHeight;

  function makeCover(p, r) {
    const face = p.pin.querySelector('.book__face');
    const o = document.createElement('div');
    o.className = 'opening bookworld';
    o.innerHTML = '<div class="opening__cover"><div class="opening__scale"></div><div class="opening__inside"></div></div>';
    const cover = o.firstElementChild;
    cover.style.setProperty('--l', `${r.left}px`);
    cover.style.setProperty('--t', `${r.top}px`);
    cover.style.setProperty('--w', `${r.width}px`);
    cover.style.setProperty('--h', `${r.height}px`);
    const sc = cover.firstElementChild;
    sc.style.setProperty('--k', String(r.width / BW));
    sc.append(face.cloneNode(true));
    document.body.append(o);
    return o;
  }

  let returnFocus = null;
  function openPage(p, { from = 'map', push = true, instant = false } = {}) {
    if (!p) return;
    finishAll();
    if (openP === p) return;
    if (openP) closePage({ instant: true, keepHash: true });
    returnFocus = from === 'list' ? p.row : from === 'map' ? mapEl : document.activeElement;
    if (push) {
      history.pushState({ hash: p.hash }, '', `#${p.hash}`);
      pushed = true;
    }
    openP = p;
    p.pin.classList.add('is-on');
    setActive(p.id);
    const go = () => {
      renderPage(p);
      page.hidden = false;
      page.scrollTop = 0;
      app.inert = true;
      const r = p.pin.querySelector('.book__face').getBoundingClientRect();
      if (instant || still() || !visible(r)) {
        p.pin.classList.add('is-hidden');
        const a = page.animate([{ opacity: 0 }, { opacity: 1 }], { duration: still() || instant ? 1 : 260, easing: 'ease-out' });
        running.push(a);
        a.finished.then(done, () => {});
        return;
      }
      const o = makeCover(p, r);
      p.pin.classList.add('is-hidden');
      const cover = $('.opening__cover', o);
      const swing = cover.animate([
        { transform: 'rotateY(0deg)', opacity: 1 },
        { transform: 'rotateY(-110deg)', opacity: 1, offset: 0.55 },
        { transform: 'rotateY(-172deg)', opacity: 0 },
      ], { duration: 820, easing: 'cubic-bezier(0.22, 0.8, 0.3, 1)', fill: 'forwards' });
      const grow = page.animate([
        { clipPath: insetOf(r) },
        { clipPath: 'inset(0px 0px 0px 0px)' },
      ], { duration: 760, delay: 140, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'backwards' });
      running.push(swing, grow);
      Promise.all([swing.finished, grow.finished]).then(() => { o.remove(); done(); }, () => o.remove());
    };
    const done = () => {
      running = [];
      const h = $('#page-title', page);
      page.focus({ preventScroll: true });
      if (h) h.setAttribute('tabindex', '-1');
    };
    if (from === 'list' && !still() && !instant) {
      if (phoneQuery.matches) openDrawer(false);
      const T = routeView(p);
      camera(T, 650);
      setTimeout(go, 560);
    } else go();
  }

  function closePage({ instant = false, keepHash = false } = {}) {
    const p = openP;
    if (!p) return;
    finishAll();
    openP = null;
    document.title = 'tuan photography 陳亮元';
    closeViewer(true);
    const finish = () => {
      page.hidden = true;
      pageBody.textContent = '';
      app.inert = false;
      p.pin.classList.remove('is-hidden', 'is-awake');
      overPin = null;
      if (!listFocus) setActive(null);
      if (returnFocus && document.contains(returnFocus)) returnFocus.focus({ preventScroll: true });
      running = [];
    };
    app.inert = false;
    const r = p.pin.querySelector('.book__face').getBoundingClientRect();
    if (instant || still() || !visible(r)) {
      if (instant) { finish(); return; }
      const a = page.animate([{ opacity: 1 }, { opacity: 0 }], { duration: still() ? 1 : 220, easing: 'ease-out', fill: 'forwards' });
      running.push(a);
      a.finished.then(() => { a.cancel(); finish(); }, () => {});
      return;
    }
    const o = makeCover(p, r);
    const cover = $('.opening__cover', o);
    const shrink = page.animate([
      { clipPath: 'inset(0px 0px 0px 0px)' },
      { clipPath: insetOf(r) },
    ], { duration: 560, easing: 'cubic-bezier(0.5, 0, 0.2, 1)', fill: 'forwards' });
    const swing = cover.animate([
      { transform: 'rotateY(-172deg)', opacity: 0 },
      { transform: 'rotateY(-110deg)', opacity: 1, offset: 0.45 },
      { transform: 'rotateY(0deg)', opacity: 1 },
    ], { duration: 640, delay: 300, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'backwards' });
    running.push(shrink, swing);
    shrink.finished.then(() => { page.hidden = true; shrink.cancel(); }, () => {});
    swing.finished.then(() => { o.remove(); finish(); }, () => { o.remove(); finish(); });
  }

  function userClose() {
    if (!openP) return;
    if (pushed) history.back();
    else {
      history.replaceState(null, '', location.pathname + location.search);
      closePage();
    }
  }
  $('#back').addEventListener('click', userClose);

  function syncHash({ first = false } = {}) {
    const h = decodeURIComponent(location.hash.slice(1));
    const p = byHash.get(h);
    if (p) { if (openP !== p) openPage(p, { push: false, instant: first, from: 'hash' }); }
    else if (openP) closePage();
  }
  addEventListener('popstate', () => syncHash());

  // inside a page: anchors scroll the page, photographs open the viewer
  pageBody.addEventListener('click', (e) => {
    const shot = e.target.closest('[data-slide]');
    if (shot) {
      e.preventDefault();
      const holder = e.target.closest('[data-slides]');
      const ids = holder ? holder.dataset.slides.split(' ') : [shot.dataset.slide];
      openViewer(ids, Math.max(0, ids.indexOf(shot.dataset.slide)), shot);
      return;
    }
    const a = e.target.closest('a[href^="#"]');
    if (a) {
      e.preventDefault();
      const target = pageBody.querySelector(`[id="${CSS.escape(a.getAttribute('href').slice(1))}"]`);
      if (target) target.scrollIntoView({ behavior: still() ? 'auto' : 'smooth', block: 'start' });
    }
  });

  /* ------------------------------------------------------------------ the viewer */
  let vIds = [], vAt = 0, vFrom = null;
  function showSlide() {
    const s = S.slides[vIds[vAt]];
    let img = $('#viewer-img');
    if (!img) {
      img = document.createElement('img');
      img.id = 'viewer-img';
      img.decoding = 'async';
      $('#viewer-stage').append(img);
    }
    img.src = `../images/web/1280/${s.file}`;
    img.srcset = `../images/web/1280/${s.file} 1280w, ../images/web/${s.file} ${s.w}w`;
    img.sizes = '100vw';
    img.width = s.w; img.height = s.h;
    img.alt = L(s.alt);
    $('#viewer-name').textContent = L(s.place);
    $('#viewer-where').textContent = L(s.where);
    const data = [s.camera, s.lens, s.focal, s.aperture, s.shutter, s.iso ? `ISO ${s.iso}` : ''].filter(Boolean);
    $('#viewer-data').innerHTML = data.map((d) => `<span>${esc(d)}</span>`).join('');
    $('#viewer-count').textContent = t('of', { i: vAt + 1, n: vIds.length });
    $('#viewer-prev').hidden = $('#viewer-next').hidden = vIds.length < 2;
  }
  function openViewer(ids, at, from) {
    vIds = ids; vAt = at; vFrom = from;
    showSlide();
    viewer.hidden = false;
    page.inert = true;
    if (!still()) viewer.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
    $('#viewer-close').focus();
  }
  function closeViewer(quiet) {
    if (viewer.hidden) return;
    viewer.hidden = true;
    page.inert = false;
    if (!quiet && vFrom && document.contains(vFrom)) vFrom.focus({ preventScroll: true });
  }
  $('#viewer-close').addEventListener('click', () => closeViewer());
  $('#viewer-prev').addEventListener('click', () => { vAt = (vAt - 1 + vIds.length) % vIds.length; showSlide(); });
  $('#viewer-next').addEventListener('click', () => { vAt = (vAt + 1) % vIds.length; showSlide(); });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!viewer.hidden) { closeViewer(); return; }
      if (openP) { userClose(); return; }
      if (phoneQuery.matches && indexEl.classList.contains('is-open')) openDrawer(false);
    }
    if (!viewer.hidden && vIds.length > 1) {
      if (e.key === 'ArrowLeft') $('#viewer-prev').click();
      if (e.key === 'ArrowRight') $('#viewer-next').click();
    }
  });

  /* ------------------------------------------------------------------ start */
  applyLang();
  mapSel.call(zoom).on('dblclick.zoom', null);
  mapSel.on('dblclick.routes', (e) => {
    if (e.target.closest('.pin')) return;
    const r = mapEl.getBoundingClientRect();
    mapSel.transition('cam').duration(still() ? 0 : 450).ease(d3.easeExpOut).call(zoom.scaleBy, 2, [e.clientX - r.left, e.clientY - r.top]);
  });
  resize();
  loadT0 = performance.now();
  request();
  let rT = 0, lastW = W, lastH = H;
  new ResizeObserver(() => {
    if (mapEl.clientWidth === lastW && mapEl.clientHeight === lastH) return;
    lastW = mapEl.clientWidth; lastH = mapEl.clientHeight;
    clearTimeout(rT); rT = setTimeout(resize, 120);
  }).observe(mapEl);
  if (document.fonts) document.fonts.ready.then(() => { obs = obstacles(); request(); });

  fetch('../vendor/countries-110m.json').then((r) => r.json()).then((topo) => {
    mask = buildMask(topo);
    request();
    const later = window.requestIdleCallback || ((f) => setTimeout(f, 400));
    later(() => fetch('../vendor/countries-50m.json').then((r) => r.json()).then((t50) => { mask = buildMask(t50); request(); }).catch(() => {}));
  }).catch(() => { /* the routes and books still work without the land */ });

  syncHash({ first: true });
})();

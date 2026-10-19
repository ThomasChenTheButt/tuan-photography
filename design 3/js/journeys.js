/* design 3, Journeys: every trip, newest first, beside a globe that can be turned by hand.
   Choosing a trip turns the globe to it and draws its legs in order: flights as raised arcs, trains,
   buses and drives as dashed lines on the ground. The legs come from his own trip documents. */
(() => {
  'use strict';
  const { S, photo, t, L, esc, onLang, reduce, country } = D3;

  window.PAGE = {
    title: { en: 'Journeys · tuan photography 陳亮元', zh: '旅程 · tuan photography 陳亮元' },
    en: {
      cap: 'From my own planning documents', title: 'Journeys',
      sub: (n, c, legs, y) => `${n} trips since ${y}, ${c} countries. Every leg of every route, as I planned and travelled it.`,
      hint: 'Drag to turn the globe. Click a country.', globeLabel: 'A globe of the countries visited and the routes between them',
      noRoute: 'No route recorded for this trip.', noPhotos: 'No photographs from this trip on the site yet.',
      unsure: 'not certain', to: (a, b) => `${a} to ${b}`, legsN: (n) => (n === 1 ? '1 leg' : `${n} legs`), photosN: (n) => (n === 1 ? '1 photograph' : `${n} photographs`),
      seeAll: 'See them all', home: 'Taipei',
    },
    zh: {
      cap: '來自我自己的旅行規劃文件', title: '旅程',
      sub: (n, c, legs, y) => `從 ${y} 年至今，${n} 趟旅行，${c} 個國家。每一趟的每一段路，照我規劃、走過的樣子畫出來。`,
      hint: '拖動來轉動地球，點一個國家。', globeLabel: '去過的國家與它們之間的路線',
      noRoute: '這一趟沒有記下路線。', noPhotos: '網站上還沒有這一趟的照片。',
      unsure: '不確定', to: (a, b) => `${a} 到 ${b}`, legsN: (n) => `${n} 段`, photosN: (n) => `${n} 張照片`,
      seeAll: '看全部', home: '台北',
    },
  };
  const MODE = { flight: 'mFlight', train: 'mTrain', bus: 'mBus', car: 'mCar', ground: 'mGround', boat: 'mBoat' };
  const NAME = { spain: 'Spain', uk: 'United Kingdom', france: 'France', germany: 'Germany', switzerland: 'Switzerland', taiwan: 'Taiwan',
    japan: 'Japan', 'south-korea': 'South Korea', 'hong-kong': 'Hong Kong', china: 'China', singapore: 'Singapore', vietnam: 'Vietnam',
    dubai: 'United Arab Emirates', australia: 'Australia', 'new-zealand': 'New Zealand', usa: 'United States of America', thailand: 'Thailand',
    myanmar: 'Myanmar', netherlands: 'Netherlands', malaysia: 'Malaysia', andorra: 'Andorra' };
  const trips = S.trips;
  const year = (tr) => (tr.months[0] || tr.id).slice(0, 4);
  const city = (pt) => L({ en: pt.city || pt.code, zh: pt.zh || pt.city || pt.code });
  const $ = (s) => document.querySelector(s);

  /* ------------------------------------------------ the list */
  let openId = null;
  function list() {
    const years = [...new Set(trips.map(year))];
    $('#list').innerHTML = years.map((y) => `<section class="year"><h2 class="year__n">${y}</h2><ul>${trips.filter((tr) => year(tr) === y).map((tr) => {
      const names = tr.countries.map((c) => L(country[c])).join(lang() === 'zh' ? '、' : ', ');
      const legs = tr.legs.length ? `<ol class="legs">${tr.legs.map((l) => `<li><span class="mono">${esc(l.month ? l.month.replace('-', '.') : '')}</span>
          <span>${esc(t('to', city(l.from), city(l.to)))}</span><span class="mode">${esc(t(MODE[l.mode] || 'mGround'))}${l.confirmed === false ? `, ${esc(t('unsure'))}` : ''}</span></li>`).join('')}</ol>`
        : `<p class="empty-note">${esc(t('noRoute'))}</p>`;
      const strip = tr.photos.length ? `<div class="strip" data-set></div><p class="trip__go"><a class="link" href="photos.html#trip=${tr.id}">${esc(t('seeAll'))}</a></p>` : `<p class="empty-note">${esc(t('noPhotos'))}</p>`;
      return `<li class="trip${tr.id === openId ? ' is-open' : ''}" data-id="${tr.id}">
        <button type="button" class="trip__btn" aria-expanded="${tr.id === openId}" aria-controls="tm-${tr.id}">
          <span class="trip__name">${esc(names)}</span><span class="trip__meta mono">${esc(L(tr.label))}</span>
          <span class="trip__meta mono">${esc([tr.legs.length ? t('legsN', tr.legs.length) : '', tr.photos.length ? t('photosN', tr.photos.length) : ''].filter(Boolean).join('  '))}</span></button>
        <div class="trip__more" id="tm-${tr.id}"><div>${legs}${strip}</div></div></li>`;
    }).join('')}</ul></section>`).join('');
    document.querySelectorAll('.trip').forEach((li) => {
      const tr = trips.find((x) => x.id === li.dataset.id);
      const s = li.querySelector('.strip');
      if (s) tr.photos.forEach((id) => s.append(photo(D3.byId[id], { sizes: '12rem' })));
    });
  }
  const lang = () => D3.lang;
  function open(id, { turn = true, push = true } = {}) {
    openId = openId === id ? null : id;
    document.querySelectorAll('.trip').forEach((li) => {
      const on = li.dataset.id === openId;
      li.classList.toggle('is-open', on);
      li.querySelector('.trip__btn').setAttribute('aria-expanded', String(on));
    });
    if (push) history.replaceState(null, '', openId ? `#t=${openId}` : location.pathname);
    select(openId, turn);
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.trip__btn');
    if (b) open(b.closest('.trip').dataset.id);
  });
  let hoverT = 0;
  document.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    const li = e.target.closest('.trip');
    clearTimeout(hoverT);
    hoverT = setTimeout(() => { const h = li ? li.dataset.id : null; if (h !== hover) { hover = h; wake(); } }, 60);
  });

  /* ------------------------------------------------ the globe */
  const cv = $('#globe');
  const out = cv.getContext('2d');
  // the globe is drawn into a kept copy, and only when it changes; the home pulse plays over that copy
  // (kept in the page, hidden, so its labels are drawn with the same font smoothing as the visible canvas)
  const sc = document.createElement('canvas');
  sc.hidden = true;
  cv.after(sc);
  const cx2 = sc.getContext('2d');
  let W = 0, H = 0, dpr = 1, R = 0;
  const proj = d3.geoOrthographic().clipAngle(90).precision(0.4);
  const path = d3.geoPath(proj, cx2);
  const grat = d3.geoGraticule10();
  let land = null, visited = [];
  const state = { rot: [-98, -18], k: 1 };   // start west of Taiwan, so the routes from home curve
  let sel = null, hover = null, drawP = 1, auto = !reduce, lastTouch = 0, dragging = false;
  const visitedIds = new Set(S.countries.map((c) => c.id));
  const css = (n) => getComputedStyle(document.body).getPropertyValue(n).trim();
  let C = {};
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };

  function size() {
    const r = cv.getBoundingClientRect();
    dpr = Math.min(2, devicePixelRatio || 1);
    W = r.width; H = r.height;
    cv.width = sc.width = Math.round(W * dpr); cv.height = sc.height = Math.round(H * dpr);
    R = Math.min(W, H) * 0.42;
    C = { ink: css('--ink'), accent: css('--accent'), g: css('--g') };
  }
  const legPts = (l) => [[l.from.lng, l.from.lat], [l.to.lng, l.to.lat]];
  function tripFocus(tr) {
    const pts = tr.legs.flatMap(legPts);
    if (!pts.length) tr.countries.forEach((c) => pts.push([country[c].ll[1], country[c].ll[0]]));
    const c = d3.geoCentroid({ type: 'MultiPoint', coordinates: pts });
    const far = Math.max(0.05, ...pts.map((p) => d3.geoDistance(p, c)));
    return { rot: [-c[0], -c[1]], k: Math.max(1, Math.min(2.6, 0.95 / (far * 1.25))) };
  }
  let tween = null;
  function select(id, turn) {
    sel = id ? trips.find((x) => x.id === id) : null;
    drawP = sel && !reduce ? 0 : 1;
    if (sel && turn) {
      const f = tripFocus(sel);
      const r0 = [...state.rot], k0 = state.k;
      let d = f.rot[0] - r0[0]; d = ((d + 540) % 360) - 180;
      const r1 = [r0[0] + d, f.rot[1]];
      const t0 = performance.now(), dur = reduce ? 1 : 1300;
      tween = (now) => {
        const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        state.rot = [r0[0] + (r1[0] - r0[0]) * e, r0[1] + (r1[1] - r0[1]) * e];
        state.k = k0 + (f.k - k0) * e;
        if (p >= 1) tween = null;
      };
    }
    if (!sel) { const k0 = state.k, t0 = performance.now(); tween = (now) => { const p = Math.min(1, (now - t0) / 900); state.k = k0 + (1 - k0) * (1 - Math.pow(1 - p, 3)); if (p >= 1) tween = null; }; }
    wake();
  }
  const centre = () => [-state.rot[0], -state.rot[1]];
  function line(pts, lift) {
    const c = centre();
    cx2.beginPath();
    let pen = false;
    pts.forEach(([p, h]) => {
      if (d3.geoDistance(p, c) > Math.PI / 2 - 0.01) { pen = false; return; }
      const [x, y] = proj(p);
      const X = W / 2 + (x - W / 2) * (1 + h * lift), Y = H / 2 + (y - H / 2) * (1 + h * lift);
      pen ? cx2.lineTo(X, Y) : cx2.moveTo(X, Y);
      pen = true;
    });
    cx2.stroke();
  }
  // each leg's points along its great circle, worked out once: they do not depend on the view
  const GEO = new Map();
  trips.forEach((tr) => tr.legs.forEach((l) => {
    const [a, b] = legPts(l);
    const gi = d3.geoInterpolate(a, b), dist = d3.geoDistance(a, b);
    const n = Math.max(8, Math.ceil(dist * 60)), pts = [];
    for (let i = 0; i <= n; i++) { const s = i / n; pts.push([gi(s), Math.sin(Math.PI * s)]); }
    GEO.set(l, { gi, n, pts, lift: l.mode === 'flight' ? Math.min(0.08, 0.02 + dist * 0.035) : 0 });
  }));
  function legPath(l, upto = 1) {
    const g = GEO.get(l);
    if (upto >= 1) return { pts: g.pts, lift: g.lift, head: null };
    return { pts: g.pts.slice(0, Math.floor(g.n * upto) + 1), lift: g.lift, head: g.gi(upto) };
  }

  /* drawing only when something changes, and never while the globe cannot be seen */
  let raf = 0, dirty = true, onScreen = true, autoT = 0, homeXY = null;
  const live = () => onScreen && !document.hidden;
  const turning = (now) => auto && !sel && !dragging && now - lastTouch > 3500;
  function wake() {
    dirty = true;
    if (!raf && live()) raf = requestAnimationFrame(frame);
  }
  function pause() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
  function frame(now) {
    raf = 0;
    if (!live()) return;
    let moved = dirty;
    dirty = false;
    if (tween) { tween(now); moved = true; }
    else if (turning(now)) { state.rot[0] += 0.045; moved = true; }
    else if (auto && !sel && !dragging) { clearTimeout(autoT); autoT = setTimeout(wake, lastTouch + 3500 - now + 16); }
    if (sel && drawP < 1) { drawP = Math.min(1, drawP + 1 / (60 * Math.min(4.5, 0.55 * Math.max(1, sel.legs.length)))); moved = true; }
    if (moved) scene();
    out.setTransform(1, 0, 0, 1, 0, 0);
    out.clearRect(0, 0, cv.width, cv.height);
    out.drawImage(sc, 0, 0);
    // home, pulsing while it can be seen
    const pulsing = !reduce && homeXY !== null;
    if (homeXY) {
      const [x, y] = homeXY, pulse = pulsing ? (now / 1600) % 1 : 0;
      out.setTransform(dpr, 0, 0, dpr, 0, 0);
      out.beginPath(); out.arc(x, y, 3 + pulse * 10, 0, Math.PI * 2); out.strokeStyle = rgba('#ff9447', 0.7 * (1 - pulse)); out.lineWidth = 1; out.stroke();
      out.beginPath(); out.arc(x, y, 3, 0, Math.PI * 2); out.fillStyle = '#ff9447'; out.fill();
    }
    if (pulsing || tween || (sel && drawP < 1) || turning(now)) raf = requestAnimationFrame(frame);
  }
  function scene() {
    proj.translate([W / 2, H / 2]).scale(R * state.k).rotate(state.rot);
    cx2.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx2.clearRect(0, 0, W, H);
    // the sphere, a little lighter than the night
    cx2.beginPath(); path({ type: 'Sphere' }); cx2.fillStyle = rgba(C.ink.startsWith('#') ? C.ink : '#ede6da', 0.035); cx2.fill();
    cx2.lineWidth = 1; cx2.strokeStyle = rgba('#ede6da', 0.14); cx2.stroke();
    cx2.beginPath(); path(grat); cx2.strokeStyle = rgba('#ede6da', 0.05); cx2.lineWidth = 0.6; cx2.stroke();
    if (land) { cx2.beginPath(); path(land); cx2.fillStyle = rgba('#ede6da', 0.11); cx2.fill(); }
    const hot = new Set((sel ? sel.countries : []).concat(hover ? trips.find((x) => x.id === hover)?.countries || [] : []));
    visited.forEach((f) => {
      cx2.beginPath(); path(f.geo);
      cx2.fillStyle = rgba('#ff9447', hot.has(f.id) ? 0.62 : 0.24); cx2.fill();
      cx2.strokeStyle = rgba('#ff9447', hot.has(f.id) ? 0.9 : 0.38); cx2.lineWidth = 0.6; cx2.stroke();
    });
    // every route, quietly, kept inside the globe
    cx2.save();
    cx2.beginPath(); cx2.arc(W / 2, H / 2, R * state.k, 0, Math.PI * 2); cx2.clip();
    cx2.lineWidth = 0.8;
    trips.forEach((tr) => {
      if (tr === sel) return;
      const lit = tr.id === hover;
      cx2.strokeStyle = rgba('#ede6da', lit ? 0.6 : 0.13);
      tr.legs.forEach((l) => { const g = legPath(l); cx2.setLineDash(l.mode === 'flight' ? [] : [2, 3]); line(g.pts, g.lift); });
    });
    cx2.restore();
    cx2.setLineDash([]);
    // the chosen trip, drawn leg by leg
    if (sel) {
      const n = sel.legs.length;
      cx2.lineWidth = 1.6; cx2.strokeStyle = '#ff9447';
      const stops = new Map();
      sel.legs.forEach((l, i) => {
        const p = Math.max(0, Math.min(1, drawP * n - i));
        if (p <= 0) return;
        const g = legPath(l, p);
        cx2.setLineDash(l.mode === 'flight' ? [] : [3, 3]);
        line(g.pts, g.lift);
        stops.set(l.from.city || l.from.code, l.from);
        if (p >= 1) stops.set(l.to.city || l.to.code, l.to);
        else {
          const c = centre();
          if (d3.geoDistance(g.head, c) < Math.PI / 2) {
            const [x, y] = proj(g.head), h = Math.sin(Math.PI * p);
            cx2.beginPath(); cx2.arc(W / 2 + (x - W / 2) * (1 + h * g.lift), H / 2 + (y - H / 2) * (1 + h * g.lift), 3, 0, Math.PI * 2); cx2.fillStyle = '#ffd2ad'; cx2.fill();
          }
        }
      });
      cx2.setLineDash([]);
      const c = centre();
      cx2.font = '11px "Geist Mono", ui-monospace, monospace';
      cx2.textBaseline = 'middle';
      const placed = [];
      stops.forEach((pt) => {
        const p = [pt.lng, pt.lat];
        if (d3.geoDistance(p, c) > Math.PI / 2 - 0.02) return;
        const [x, y] = proj(p);
        cx2.beginPath(); cx2.arc(x, y, 2.6, 0, Math.PI * 2); cx2.fillStyle = '#ede6da'; cx2.fill();
        if (placed.some(([a, b]) => Math.abs(a - x) < 56 && Math.abs(b - y) < 13)) return;
        placed.push([x, y]);
        const label = city(pt);
        cx2.fillStyle = 'rgba(10,14,24,0.75)';
        const w = cx2.measureText(label).width;
        cx2.fillRect(x + 6, y - 8, w + 8, 16);
        cx2.fillStyle = '#ede6da'; cx2.fillText(label, x + 10, y);
      });
    }
    // home, placed here and drawn over the kept copy by frame()
    const home = [S.home[1], S.home[0]];
    homeXY = d3.geoDistance(home, centre()) < Math.PI / 2 ? proj(home) : null;
  }

  /* turning it by hand, and choosing a country on it */
  function hands() {
    let x0 = 0, y0 = 0, r0 = null, moved = false;
    cv.addEventListener('pointerdown', (e) => {
      dragging = true; moved = false; x0 = e.clientX; y0 = e.clientY; r0 = [...state.rot]; tween = null;
      cv.setPointerCapture(e.pointerId);
    });
    cv.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - x0, dy = e.clientY - y0;
      if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
      const s = 0.28 / state.k;
      state.rot = [r0[0] + dx * s, Math.max(-80, Math.min(80, r0[1] - dy * s))];
      wake();
    });
    const up = (e) => {
      if (!dragging) return;
      dragging = false; lastTouch = performance.now();
      wake();
      if (moved) return;
      const r = cv.getBoundingClientRect();
      const ll = proj.invert([e.clientX - r.left, e.clientY - r.top]);
      if (!ll || d3.geoDistance(ll, centre()) > Math.PI / 2) return;
      const hit = visited.find((f) => d3.geoContains(f.geo, ll)) ||
        visited.map((f) => ({ f, d: d3.geoDistance(ll, [country[f.id].ll[1], country[f.id].ll[0]]) })).sort((a, b) => a.d - b.d).find((x) => x.d < 0.03)?.f;
      if (!hit) return;
      const tr = trips.find((x) => x.countries.includes(hit.id));
      if (tr) { open(tr.id); document.querySelector(`.trip[data-id="${tr.id}"]`)?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' }); }
    };
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', () => { dragging = false; wake(); });
  }

  async function load() {
    // the land from the lighter 110m file; the visited countries from 50m, where small places such as Hong Kong exist
    const [lo, topo] = await Promise.all(['vendor/countries-110m.json', 'vendor/countries-50m.json'].map((u) => fetch(u).then((r) => r.json())));
    land = topojson.feature(lo, lo.objects.land);
    const all = topojson.feature(topo, topo.objects.countries).features;
    visited = [...visitedIds].map((id) => ({ id, geo: all.find((f) => f.properties.name === NAME[id]) })).filter((x) => x.geo);
  }

  function words() {
    const y0 = Math.min(...trips.map((x) => +year(x)));
    $('#sub').textContent = t('sub', trips.length, S.countries.length, trips.reduce((a, x) => a + x.legs.length, 0), y0);
    list();
  }

  D3.apply();
  words();
  onLang(() => { words(); wake(); });   // the place names on the globe change language too
  size();
  addEventListener('resize', () => { size(); wake(); });
  let dprQ = null;
  const onDpr = () => { size(); wake(); watchDpr(); };
  function watchDpr() {
    if (dprQ) dprQ.removeEventListener('change', onDpr);
    dprQ = matchMedia(`(resolution: ${devicePixelRatio}dppx)`);
    dprQ.addEventListener('change', onDpr);
  }
  watchDpr();
  if (window.IntersectionObserver) new IntersectionObserver((es) => { onScreen = es[es.length - 1].isIntersecting; live() ? wake() : pause(); }).observe(cv);
  document.addEventListener('visibilitychange', () => (live() ? wake() : pause()));
  if (document.fonts) { document.fonts.ready.then(wake); document.fonts.addEventListener('loadingdone', () => wake()); }
  hands();
  wake();
  load().then(() => {
    wake();
    const m = location.hash.match(/t=([\w-]+)/);
    if (m && trips.some((x) => x.id === m[1])) open(m[1], { push: false });
  });
})();

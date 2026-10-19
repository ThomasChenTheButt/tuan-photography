/* design 3, the still home (still.html): the photograph first.
   Built 2026-10-19 beside the one-camera home after he found that one too much ("the viewers might
   get overwhelmed by so much effect") and its count "AI slop". Three motions in the whole page, each
   with a job: the opening photograph settles into place; a photograph fades in as you reach it; the
   globe turns only while you scroll past it. Everything else holds still. Nothing is written across
   a photograph; names sit beneath. No viewfinder, no count, no coordinates, no marquee. Type at
   normal width; orange only on links and on the globe's visited dots. No GSAP, no Lenis. */
(() => {
  'use strict';
  const { S, photo, t, L, esc, onLang, reduce, country, byId } = D3;
  const $ = (s, r = document) => r.querySelector(s);
  const fine = matchMedia('(hover: hover) and (pointer: fine)');

  window.PAGE = {
    title: { en: 'tuan photography 陳亮元', zh: 'tuan photography 陳亮元' },
    en: {
      heroTitle: 'tuan photography, landscape photographs by Thomas Chen', heroBy: 'Thomas Chen, landscape photographer', inShort: 'In short',
      say: (n, k, trips, flights, y) => `${n} countries. ${k} continents. ${trips} trips and ${flights} flights since ${y}. Every photograph here is my own.`,
      globeH: 'Where the trips went', globeLabel: 'A globe of the countries visited, with the flights out of Taipei; it turns as you scroll past',
      countriesN: (n) => (n === 1 ? '1 country' : `${n} countries`), photosN: (n) => (n === 1 ? '1 photograph' : `${n} photographs`),
      noPhotos: 'No photographs yet', home: 'Home',
      indexH: 'Every country', closeT: 'Where next?', closeP: 'South America is in research. Africa and Antarctica are empty pages.',
      trips: 'Follow the journeys', all: 'Every photograph', about: 'About me', follow: 'Follow on Instagram',
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    },
    zh: {
      heroTitle: 'tuan photography，陳亮元的風景攝影', heroBy: '陳亮元，風景攝影', inShort: '簡單說',
      say: (n, k, trips, flights, y) => `${n} 個國家，${k} 個大洲。${y} 年至今，${trips} 趟旅行、${flights} 趟航班。這裡的每一張照片都是我拍的。`,
      globeH: '旅程去了哪裡', globeLabel: '去過的國家所在的地球，加上從台北出發的航線；往下捲，它就跟著轉',
      countriesN: (n) => `${n} 個國家`, photosN: (n) => `${n} 張照片`,
      noPhotos: '還沒有照片', home: '家',
      indexH: '所有國家', closeT: '下一站？', closeP: '南美洲正在研究中。非洲和南極洲還是空白頁。',
      trips: '跟著旅程走', all: '所有照片', about: '關於我', follow: '在 Instagram 追蹤',
      months: null,
    },
  };

  /* ------------------------------------------------ choices */
  const HERO = 'aoraki';
  const CLOSE = 'matterhorn-lake';
  const LEAD = { asia: 'tokyo-night', europe: 'calanque', oceania: 'aurora', 'north-america': 'lower-manhattan-reflection' };
  const used = new Set([HERO, CLOSE, ...Object.values(LEAD)]);
  const photosOf = (cid) => S.photos.filter((p) => p.country === cid);
  const leadOf = (cid) => photosOf(cid).find((p) => !used.has(p.id)) || photosOf(cid)[0];
  const conts = S.continents.map((k) => ({ ...k, list: S.countries.filter((c) => c.continent === k.id) }))
    .filter((k) => k.list.length).sort((a, b) => b.list.length - a.list.length);
  const HOME = [S.home[1], S.home[0]];   // [lng, lat]
  const lng = (c) => c.ll[1], lat = (c) => c.ll[0];
  function when(v) {
    if (!v) return '';
    const [y, m] = v.when.split('-');
    if (!m) return y;
    return D3.lang === 'zh' ? `${y}.${m}` : `${t('months')[+m - 1]} ${y}`;
  }
  const entry = (c) => {
    const v = c.visits[c.visits.length - 1];
    if (!v) return { code: 'TPE', note: t('home') };
    const code = v.via ? (v.via.code || L({ en: v.via.city, zh: v.via.zh || v.via.city })) : '';
    return { code, note: when(v) };
  };

  /* ------------------------------------------------ 1. the photograph settles into place */
  function buildHero() {
    const p = byId[HERO];
    const b = photo(p, { sizes: '100vw', eager: true });
    $('#hero-photo').append(b);
    const img = b.querySelector('img');
    let done = false;
    const ready = () => { if (done) return; done = true; requestAnimationFrame(() => document.body.classList.add('is-ready')); };
    if (img.complete) ready(); else img.addEventListener('load', ready, { once: true });
    setTimeout(ready, 1800);   // a slow connection still gets the page
  }

  /* ------------------------------------------------ 2. the record */
  function say() {
    const y0 = Math.min(...S.trips.map((x) => +(x.months[0] || x.id).slice(0, 4)));
    const flights = S.trips.flatMap((x) => x.legs).filter((l) => l.mode === 'flight').length;
    $('#say').textContent = t('say', S.countries.length, conts.length, S.trips.length, flights, y0);
  }

  /* ------------------------------------------------ 3. the globe: drawn when you scroll, still otherwise */
  const dots = [];
  let dotsReady = false;
  async function loadDots() {
    const [small, big] = await Promise.all([fetch('vendor/countries-110m.json').then((r) => r.json()), fetch('vendor/countries-50m.json').then((r) => r.json())]);
    const land = topojson.feature(small, small.objects.land);
    const NAME = { spain: 'Spain', uk: 'United Kingdom', france: 'France', germany: 'Germany', switzerland: 'Switzerland', taiwan: 'Taiwan', japan: 'Japan',
      'south-korea': 'South Korea', 'hong-kong': 'Hong Kong', china: 'China', singapore: 'Singapore', vietnam: 'Vietnam', dubai: 'United Arab Emirates',
      australia: 'Australia', 'new-zealand': 'New Zealand', usa: 'United States of America', thailand: 'Thailand', myanmar: 'Myanmar', netherlands: 'Netherlands',
      malaysia: 'Malaysia', andorra: 'Andorra' };
    const feats = topojson.feature(big, big.objects.countries).features;
    const W = 1440, H = 720;
    const off = document.createElement('canvas'); off.width = W; off.height = H;
    const o = off.getContext('2d', { willReadFrequently: true });
    const eq = d3.geoEquirectangular().scale(W / (2 * Math.PI)).translate([W / 2, H / 2]);
    const gp = d3.geoPath(eq, o);
    o.fillStyle = 'rgb(0,0,255)'; o.beginPath(); gp(land); o.fill();
    const visited = S.countries.map((c) => feats.find((f) => f.properties.name === NAME[c.id])).filter(Boolean);
    o.fillStyle = 'rgb(255,0,255)'; visited.forEach((f) => { o.beginPath(); gp(f); o.fill(); });
    const px = o.getImageData(0, 0, W, H).data;
    const step = 1.45;
    for (let la = -58; la <= 80; la += step) {
      const st = step / Math.max(0.25, Math.cos((la * Math.PI) / 180));
      for (let lo = -180; lo < 180; lo += st) {
        const [x, y] = eq([lo, la]);
        const k = (Math.round(y) * W + Math.round(x)) * 4;
        if (px[k + 2] < 128) continue;
        dots.push({ la: (la * Math.PI) / 180, lo: (lo * Math.PI) / 180, v: px[k] > 128 });
      }
    }
    S.countries.forEach((c) => dots.push({ la: (lat(c) * Math.PI) / 180, lo: (lng(c) * Math.PI) / 180, v: true, big: true }));
    for (const d of dots) { d.sl = Math.sin(d.la); d.cl = Math.cos(d.la); }
    dotsReady = true;
  }
  const G = { cv: null, cx: null, W: 0, H: 0, dpr: 1, R: 0, x: 0, y: 0, rot: [HOME[0], 20] };
  function sizeGlobe() {
    const r = G.cv.getBoundingClientRect();
    G.dpr = Math.min(2, devicePixelRatio || 1);
    G.W = r.width; G.H = r.height;
    G.cv.width = Math.round(G.W * G.dpr); G.cv.height = Math.round(G.H * G.dpr);
    G.x = G.W / 2; G.y = G.H / 2; G.R = Math.min(G.W, G.H) * 0.4;
  }
  function drawGlobe() {
    if (!dotsReady || !G.cx) return;
    const c = G.cx, R = G.R, cx = G.x, cy = G.y;
    c.setTransform(G.dpr, 0, 0, G.dpr, 0, 0);
    c.clearRect(0, 0, G.W, G.H);
    const lo0 = (G.rot[0] * Math.PI) / 180, la0 = (G.rot[1] * Math.PI) / 180;
    const s0 = Math.sin(la0), c0 = Math.cos(la0);
    const grad = c.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R);
    grad.addColorStop(0, 'rgba(242,237,228,0.07)'); grad.addColorStop(1, 'rgba(242,237,228,0.015)');
    c.fillStyle = grad; c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(242,237,228,0.12)'; c.lineWidth = 1; c.stroke();
    for (let i = 0; i < dots.length; i++) {
      const d = dots[i];
      const dl = d.lo - lo0, cd = Math.cos(dl);
      const z = s0 * d.sl + c0 * d.cl * cd;
      if (z <= 0) continue;
      const x = cx + R * d.cl * Math.sin(dl), y = cy - R * (c0 * d.sl - s0 * d.cl * cd);
      if (d.v) { c.fillStyle = `rgba(255,138,61,${(0.35 + 0.65 * z).toFixed(3)})`; const s = d.big ? 3.2 : 1.9; c.fillRect(x - s / 2, y - s / 2, s, s); }
      else { c.fillStyle = `rgba(242,237,228,${(0.12 + 0.46 * z).toFixed(3)})`; c.fillRect(x - 0.9, y - 0.9, 1.8, 1.8); }
    }
    const project = (lo, la, lift) => {
      const l1 = (lo * Math.PI) / 180, a1 = (la * Math.PI) / 180;
      const dl = l1 - lo0, cd = Math.cos(dl);
      const z = s0 * Math.sin(a1) + c0 * Math.cos(a1) * cd;
      const r = R * (1 + lift);
      return { x: cx + r * Math.cos(a1) * Math.sin(dl), y: cy - r * (c0 * Math.sin(a1) - s0 * Math.cos(a1) * cd), z };
    };
    c.lineWidth = 1.2;
    c.strokeStyle = 'rgba(255,138,61,0.7)';
    S.countries.forEach((ct) => {
      if (ct.id === 'taiwan') return;
      const to = [lng(ct), lat(ct)];
      const gi = d3.geoInterpolate(HOME, to);
      const lift = Math.min(0.2, 0.04 + d3.geoDistance(HOME, to) * 0.06);
      c.beginPath();
      let pen = false;
      const n = 48;
      for (let i = 0; i <= n; i++) {
        const s = i / n, [plo, pla] = gi(s), h = Math.sin(Math.PI * s) * lift;
        const q = project(plo, pla, h), q0 = project(plo, pla, 0);
        if (q0.z < 0) { pen = false; continue; }
        pen ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y);
        pen = true;
      }
      c.stroke();
    });
    const h = project(HOME[0], HOME[1], 0);
    if (h.z > 0) { c.beginPath(); c.arc(h.x, h.y, 3.5, 0, Math.PI * 2); c.fillStyle = 'rgba(255,215,184,1)'; c.fill(); }
  }
  // the view turns west from Taipei as you scroll past: Asia, Europe, North America, then round to Oceania
  const KEYS = [[121, 20], [10, 45], [-80, 35], [-210, -30]];
  function globeAt(p) {
    const k = Math.min(KEYS.length - 2, Math.floor(p * (KEYS.length - 1)));
    const f = p * (KEYS.length - 1) - k;
    const a = KEYS[k], b = KEYS[k + 1];
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
  }
  function buildGlobe() {
    G.cv = $('#globe'); G.cx = G.cv.getContext('2d');
    const sec = $('.still-globe');
    let want = false;
    const tick = () => { want = false; drawGlobe(); };
    const onScroll = () => {
      const r = sec.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      if (!reduce) {
        const p = Math.max(0, Math.min(1, -r.top / (r.height - innerHeight)));
        G.rot = globeAt(p);
      }
      if (!want) { want = true; requestAnimationFrame(tick); }
    };
    sizeGlobe();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', () => { sizeGlobe(); onScroll(); drawGlobe(); });
    loadDots().then(() => { onScroll(); drawGlobe(); }).catch(() => { /* the globe stays empty; the page still reads */ });
  }

  /* ------------------------------------------------ 4. the continents */
  function buildConts() {
    const host = $('#conts');
    conts.forEach((k) => {
      const p = byId[LEAD[k.id]] || byId[k.photo] || leadOf(k.list[0].id);
      const sec = document.createElement('section');
      sec.className = 'still-cont';
      sec.setAttribute('aria-labelledby', `cont-${k.id}`);
      sec.innerHTML = `<div class="still-cont__ph" data-in></div>
        <div class="wrap still-cont__say" data-in>
          <div><h2 class="still-h" id="cont-${k.id}" data-w="cont:${k.id}"></h2><p class="still-cont__n" data-w="countn:${k.id}"></p></div>
          <p class="still-cont__list" data-w="list:${k.id}"></p>
          <p class="still-cont__cap" data-w="cap:${p.id}"></p>
        </div>`;
      if (p) sec.querySelector('.still-cont__ph').append(photo(p, { sizes: '100vw' }));
      host.append(sec);
    });
  }

  /* ------------------------------------------------ 5. every country, with a print on hover */
  function buildIndex() {
    const ol = $('#index');
    conts.forEach((k) => {
      const head = document.createElement('li');
      head.className = 'ix-cont';
      head.dataset.w = `cont:${k.id}`;
      ol.append(head);
      k.list.slice().sort((a, b) => a.en.localeCompare(b.en)).forEach((c) => {
        const li = document.createElement('li');
        li.className = 'ix';
        const lead = leadOf(c.id);
        if (lead) li.dataset.peek = D3.src(lead, 640);
        const n = photosOf(c.id).length;
        li.innerHTML = `<a class="ix__a"${n ? ` href="photos.html#place=${c.id}"` : ''}>
          ${lead ? `<img class="ix__thumb" src="${D3.src(lead, 640)}" alt="" loading="lazy" decoding="async">` : '<span class="ix__thumb ix__thumb--none"></span>'}
          <span class="ix__name" data-w="name:${c.id}"></span><span class="ix__meta"><span data-w="years:${c.id}"></span></span>
          <span class="ix__n" data-w="nph:${c.id}"></span></a>`;
        ol.append(li);
      });
    });
  }
  function peek() {
    const box = $('#peek'), img = box.querySelector('img');
    if (!fine.matches || reduce) return;
    const list = $('#index');
    list.addEventListener('pointermove', (e) => { box.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`; });
    list.addEventListener('pointerover', (e) => {
      const li = e.target.closest('.ix');
      if (!li || !li.dataset.peek) { box.classList.remove('is-on'); list.classList.remove('is-peek'); return; }
      if (img.src !== new URL(li.dataset.peek, location.href).href) img.src = li.dataset.peek;
      box.classList.add('is-on');
      list.classList.add('is-peek');
      const hot = list.querySelector('.ix.is-hot');
      if (hot) hot.classList.remove('is-hot');
      li.classList.add('is-hot');
    });
    list.addEventListener('pointerleave', () => { box.classList.remove('is-on'); list.classList.remove('is-peek'); const hot = list.querySelector('.ix.is-hot'); if (hot) hot.classList.remove('is-hot'); });
  }

  /* ------------------------------------------------ 6. the close */
  function buildClose() {
    $('#close-photo').append(photo(byId[CLOSE], { sizes: '100vw' }));
    $('#close-ig').href = S.instagram.url;
  }

  /* ------------------------------------------------ words, in the language chosen */
  function words() {
    const sep = D3.lang === 'zh' ? '、' : ', ';
    document.querySelectorAll('[data-w]').forEach((el) => {
      const [k, a] = el.dataset.w.split(':');
      const c = country[a];
      const cont = S.continents.find((x) => x.id === a);
      const p = byId[a];
      if (k === 'list') {
        el.innerHTML = cont ? S.countries.filter((x) => x.continent === a).sort((x, y) => x.en.localeCompare(y.en))
          .map((x) => (photosOf(x.id).length ? `<a class="link" href="photos.html#place=${x.id}">${esc(L(x))}</a>` : `<span>${esc(L(x))}</span>`)).join(sep) : '';
        return;
      }
      const v = {
        cont: () => L(cont), countn: () => t('countriesN', S.countries.filter((x) => x.continent === a).length),
        name: () => L(c), years: () => [...new Set(c.visits.map((x) => x.when.slice(0, 4)))].join('  ') || t('home'),
        nph: () => (photosOf(a).length ? t('photosN', photosOf(a).length) : t('noPhotos')),
        place: () => L(p.place), where: () => L(p.where), cap: () => `${L(p.place)}, ${L(p.where)}`,
      }[k];
      if (v) el.textContent = v();
    });
    say();
    $('#close-ig').textContent = `@${S.instagram.handle}`;
    $('#close-ig').setAttribute('aria-label', t('follow'));
  }

  buildHero();
  buildGlobe();
  buildConts();
  buildIndex();
  buildClose();
  peek();
  words();
  onLang(words);
  D3.apply();
  D3.entrances();
})();

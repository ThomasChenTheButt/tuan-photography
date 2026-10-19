/* design 3, the home page: cinematic, by place.
   An opening count of the countries; six places one after another; the record read word by
   word; a dotted globe that turns from continent to continent with the flights out of Taipei;
   one stage per continent, its name cut out of a photograph that opens as you scroll and the
   countries rising as cards; every country as an index with a photograph that follows the
   pointer; the close. Motion follows Emil Kowalski's rules: strong ease-out for things that
   arrive, ease-in-out for things that move, exits faster than entrances, hover only on real
   pointers, and "reduce motion" keeps the words and drops the movement. */
(() => {
  'use strict';
  const { S, photo, t, L, esc, onLang, reduce, country, byId } = D3;
  const $ = (s, r = document) => r.querySelector(s);
  const fine = matchMedia('(hover: hover) and (pointer: fine)');

  window.PAGE = {
    title: { en: 'tuan photography 陳亮元', zh: 'tuan photography 陳亮元' },
    en: {
      heroTitle: 'tuan photography, landscape photographs by Thomas Chen', heroBy: 'Thomas Chen, landscape photographer', slides: 'Photographs',
      show: (n) => `Show photograph ${n}`, inShort: 'In short',
      say: (n, k, trips, flights, y) => `${n} countries. ${k} continents. ${trips} trips and ${flights} flights since ${y}. Every photograph here is my own.`,
      globeH: 'Where the trips went', globeLabel: 'A globe of the countries visited, turning from continent to continent, with the flights out of Taipei',
      countriesN: (n) => (n === 1 ? '1 country' : `${n} countries`), photosN: (n) => (n === 1 ? '1 photograph' : `${n} photographs`),
      noPhotos: 'No photographs yet', home: 'Home', overland: 'overland',
      indexH: 'Every country', closeT: 'Where next?', closeP: 'South America is in research. Africa and Antarctica are empty pages.',
      trips: 'Follow the journeys', all: 'Every photograph', about: 'About me',
      go: "See where I've been", pause: 'Pause', play: 'Play', alsoStamped: 'Stamped, not yet photographed:',
      months: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
    },
    zh: {
      heroTitle: 'tuan photography，陳亮元的風景攝影', heroBy: '陳亮元，風景攝影', slides: '照片',
      show: (n) => `顯示第 ${n} 張照片`, inShort: '簡單說',
      say: (n, k, trips, flights, y) => `${n} 個國家，${k} 個大洲。${y} 年至今，${trips} 趟旅行、${flights} 趟航班。這裡的每一張照片都是我拍的。`,
      globeH: '旅程去了哪裡', globeLabel: '去過的國家所在的地球，一洲一洲轉過去，加上從台北出發的航線',
      countriesN: (n) => `${n} 個國家`, photosN: (n) => `${n} 張照片`,
      noPhotos: '還沒有照片', home: '家', overland: '陸路',
      indexH: '所有國家', closeT: '下一站？', closeP: '南美洲正在研究中。非洲和南極洲還是空白頁。',
      trips: '跟著旅程走', all: '所有照片', about: '關於我',
      go: '看我去過哪裡', pause: '暫停', play: '播放', alsoStamped: '蓋了章，還沒放上照片：',
      months: null,
    },
  };

  /* ------------------------------------------------ choices */
  const HERO = ['aoraki', 'fuji-lake', 'matterhorn-lake', 'peak-night', 'golden-gate-fog', 'calanque'];
  // one device per continent, never the same twice: a name cut out of a photograph, a stack of
  // full-screen countries, a sequence that advances with the scroll, a zoom through a cluster
  const DEVICE = ['mask', 'stack', 'sequence', 'zoom'];
  const STAGE = { mask: 'tokyo-night', zoom: 'lower-manhattan-reflection' };
  const used = new Set([...HERO, ...Object.values(STAGE)]);
  const SUB = { oceania: { en: 'Ridgelines, lakes and the southern stars after dark.', zh: '稜線、湖泊，以及入夜後的南半球星空。' } };
  const photosOf = (cid) => S.photos.filter((p) => p.country === cid);
  const leadOf = (cid) => photosOf(cid).find((p) => !used.has(p.id)) || photosOf(cid)[0];
  const conts = S.continents.map((k) => ({ ...k, list: S.countries.filter((c) => c.continent === k.id) }))
    .filter((k) => k.list.length).sort((a, b) => b.list.length - a.list.length);
  const HOME = [S.home[1], S.home[0]];   // [lng, lat]
  const lng = (c) => c.ll[1], lat = (c) => c.ll[0];
  const split = (el, text, cls = 'ch') => {
    el.textContent = '';
    [...text].forEach((ch) => { const s = document.createElement('span'); s.className = cls; s.textContent = ch === ' ' ? ' ' : ch; el.append(s); });
    el.setAttribute('aria-label', text);
  };
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
  const coord = (p) => {
    const [a, b] = p.ll;
    return `${Math.abs(a).toFixed(2)}° ${a >= 0 ? 'N' : 'S'}   ${Math.abs(b).toFixed(2)}° ${b >= 0 ? 'E' : 'W'}`;
  };

  /* ------------------------------------------------ 0. the opening count (once per visit) */
  function intro() {
    const el = $('#intro');
    let seen = false;
    try { seen = sessionStorage.getItem('d3-intro') === '1'; sessionStorage.setItem('d3-intro', '1'); } catch (e) { /* storage blocked */ }
    if (seen || reduce || !window.gsap) { el.remove(); return Promise.resolve(); }
    if (D3.lenis) D3.lenis.stop();
    const names = S.countries.map((c) => L(c));
    const n = $('#intro-n'), pl = $('#intro-place');
    return new Promise((done) => {
      const o = { v: 0 };
      const tl = gsap.timeline({ onComplete: () => { el.remove(); if (D3.lenis) D3.lenis.start(); done(); } });
      tl.to(o, { v: names.length, duration: 1.5, ease: 'power2.inOut', onUpdate: () => {
        const i = Math.max(1, Math.round(o.v));
        n.textContent = String(i).padStart(2, '0');
        pl.textContent = names[i - 1];
      } })
        .to('.cine-intro__count', { opacity: 0, y: -12, duration: 0.25, ease: 'power2.out' }, '+=0.2')
        .to('.cine-intro__half--top', { yPercent: -100, duration: 0.9, ease: 'power4.inOut' }, '<0.1')
        .to('.cine-intro__half--bottom', { yPercent: 100, duration: 0.9, ease: 'power4.inOut' }, '<');
      el.addEventListener('click', () => tl.progress(1), { once: true });
      addEventListener('keydown', () => tl.progress(1), { once: true });
    });
  }

  /* ------------------------------------------------ 1. the hero */
  const slides = HERO.map((id) => byId[id]).filter(Boolean);
  let at = -1, timer = 0, paused = false, heroOn = true, userPaused = false;
  function buildHero() {
    slides.forEach((p, i) => {
      const s = document.createElement('div');
      s.className = 'cine-slide';
      const img = new Image(p.w, p.h);
      img.alt = L(p.alt);
      img.sizes = '100vw';
      img.srcset = D3.srcset(p);
      img.src = D3.src(p);
      img.decoding = 'async';
      if (i === 0) img.fetchPriority = 'high'; else img.loading = 'lazy';
      s.append(img);
      $('#slides').append(s);
      const d = document.createElement('button');
      d.type = 'button';
      d.className = 'cine-dot';
      d.innerHTML = '<i></i>';
      d.addEventListener('click', () => { go(i, true); });
      $('#hero-dots').append(d);
    });
  }
  function heroWords(p, animate) {
    const c = country[p.country];
    const name = $('#hero-name');
    const text = D3.lang === 'zh' ? L(c) : L(c).toUpperCase();
    split(name, text);
    name.style.setProperty('--len', String(Math.max(5, [...text].length)));
    $('#hero-where').textContent = L(p.place);
    $('#hero-coord').textContent = coord(p);
    if (animate && !reduce) {
      gsap.fromTo(name.children, { yPercent: 108 }, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.028 });
      gsap.fromTo(['#hero-where', '#hero-coord'], { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.06, delay: 0.15 });
    }
  }
  const DUR = 6;
  function go(i, byHand) {
    if (i === at) return;
    const els = [...document.querySelectorAll('.cine-slide')];
    const prev = els[at], next = els[i];
    at = i;
    for (let k = 0; k < els.length; k++) { const e = els[k]; e.style.zIndex = k === i ? 2 : (e === prev ? 1 : 0); e.classList.toggle('is-live', e === next || e === prev); }
    if (reduce || !window.gsap) {
      for (const e of els) { e.style.opacity = e === next ? '1' : '0'; e.classList.toggle('is-live', e === next); }
    } else {
      gsap.set(next, { opacity: 1 });
      // the next place wipes across the last, sideways, as a frame advancing
      gsap.fromTo(next, { clipPath: 'inset(0% 0% 0% 100%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: prev ? 1.25 : 0, ease: 'power3.inOut',
        onComplete: () => { for (const e of els) if (e !== next) { gsap.set(e, { opacity: 0 }); e.classList.remove('is-live'); } } });
      gsap.fromTo(next.querySelector('img'), { scale: 1.14, xPercent: prev ? 3 : 0 }, { scale: 1, xPercent: 0, duration: DUR + 1.4, ease: 'power1.out' });
    }
    heroWords(slides[i], true);
    document.querySelectorAll('.cine-dot').forEach((d, k) => {
      d.setAttribute('aria-pressed', String(k === i));
      d.setAttribute('aria-label', t('show', k + 1));
      const bar = d.querySelector('i');
      gsap.killTweensOf(bar);
      gsap.set(bar, { scaleX: k < i ? 1 : 0 });
    });
    schedule(byHand);
  }
  function schedule() {
    clearTimeout(timer);
    const bar = document.querySelectorAll('.cine-dot i')[at];
    if (reduce || paused || !heroOn) { if (bar) gsap.set(bar, { scaleX: reduce ? 1 : gsap.getProperty(bar, 'scaleX') }); return; }
    if (bar) gsap.to(bar, { scaleX: 1, duration: DUR * (1 - gsap.getProperty(bar, 'scaleX')), ease: 'none' });
    timer = setTimeout(() => go((at + 1) % slides.length), DUR * 1000 * (1 - (bar ? gsap.getProperty(bar, 'scaleX') : 0)));
  }
  function pause(on) {
    paused = on;
    if (on) { clearTimeout(timer); gsap.killTweensOf(document.querySelectorAll('.cine-dot i')); } else schedule();
  }

  /* ------------------------------------------------ 2. the record */
  function sayWords() {
    const y0 = Math.min(...S.trips.map((x) => +(x.months[0] || x.id).slice(0, 4)));
    const flights = S.trips.flatMap((x) => x.legs).filter((l) => l.mode === 'flight').length;
    const text = t('say', S.countries.length, conts.length, S.trips.length, flights, y0);
    const el = $('#say');
    el.textContent = '';
    const parts = D3.lang === 'zh' ? text.match(/[^，。、]+[，。、]?/g) : text.split(' ');
    parts.forEach((w) => { const s = document.createElement('span'); s.className = 'w'; s.textContent = w + (D3.lang === 'zh' ? '' : ' '); el.append(s); });
  }

  /* ------------------------------------------------ 3. the globe */
  const G = { dots: [], cv: null, cx: null, W: 0, H: 0, dpr: 1, R: 0, rot: [lng({ ll: S.home }), lat({ ll: S.home })], seg: 0, local: 0, ready: false };
  async function loadGlobe() {
    const [small, big] = await Promise.all([fetch('vendor/countries-110m.json').then((r) => r.json()), fetch('vendor/countries-50m.json').then((r) => r.json())]);
    const land = topojson.feature(small, small.objects.land);
    const NAME = { spain: 'Spain', uk: 'United Kingdom', france: 'France', germany: 'Germany', switzerland: 'Switzerland', taiwan: 'Taiwan', japan: 'Japan',
      'south-korea': 'South Korea', 'hong-kong': 'Hong Kong', china: 'China', singapore: 'Singapore', vietnam: 'Vietnam', dubai: 'United Arab Emirates',
      australia: 'Australia', 'new-zealand': 'New Zealand', usa: 'United States of America', thailand: 'Thailand', myanmar: 'Myanmar', netherlands: 'Netherlands',
      malaysia: 'Malaysia', andorra: 'Andorra' };
    const feats = topojson.feature(big, big.objects.countries).features;
    // paint land and the visited countries flat, then read the dots off the picture
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
      const r = Math.cos((la * Math.PI) / 180);
      const st = step / Math.max(0.25, r);
      for (let lo = -180; lo < 180; lo += st) {
        const [x, y] = eq([lo, la]);
        const k = (Math.round(y) * W + Math.round(x)) * 4;
        if (px[k + 2] < 128) continue;
        G.dots.push({ la: (la * Math.PI) / 180, lo: (lo * Math.PI) / 180, v: px[k] > 128 });
      }
    }
    // small places the picture cannot hold get a dot of their own
    S.countries.forEach((c) => G.dots.push({ la: (lat(c) * Math.PI) / 180, lo: (lng(c) * Math.PI) / 180, v: true, big: true }));
    G.dots.forEach((d) => { d.sl = Math.sin(d.la); d.cl = Math.cos(d.la); });
    G.ready = true;
  }
  function sizeGlobe() {
    const cv = G.cv, r = cv.getBoundingClientRect();
    G.dpr = Math.min(2, devicePixelRatio || 1);
    G.W = r.width; G.H = r.height;
    cv.width = Math.round(G.W * G.dpr); cv.height = Math.round(G.H * G.dpr);
    const phone = innerWidth < 832;
    G.R = phone ? Math.min(G.W * 0.46, G.H * 0.46) : Math.min(G.W * 0.34, G.H * 0.42);
    G.cxp = phone ? G.W / 2 : G.W * 0.36;
    G.cyp = phone ? G.H * 0.3 : G.H / 2;
  }
  const centres = conts.map((k) => {
    const c = d3.geoCentroid({ type: 'MultiPoint', coordinates: k.list.map((x) => [lng(x), lat(x)]) });
    return c;
  });
  const easeIO = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  function globeView(p) {
    // keys: home, then each continent; each segment turns in its first 40% and holds the rest
    const keys = [HOME, ...centres];
    const n = conts.length;
    const f = Math.min(n - 0.0001, Math.max(0, p * n));
    const i = Math.floor(f), local = f - i;
    const a = keys[i], b = keys[i + 1];
    const k = easeIO(Math.min(1, local / 0.4));
    let dl = b[0] - a[0]; dl = ((dl + 540) % 360) - 180;
    return { lo: a[0] + dl * k, la: a[1] + (b[1] - a[1]) * k, seg: i, local };
  }
  function drawGlobe(now) {
    if (!G.ready) return;
    const c = G.cx, dpr = G.dpr, R = G.R, cx = G.cxp, cy = G.cyp;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, G.W, G.H);
    const drift = reduce ? 0 : Math.sin(now / 4000) * 2;
    const lo0 = ((G.rot[0] + drift) * Math.PI) / 180, la0 = (G.rot[1] * Math.PI) / 180;
    const s0 = Math.sin(la0), c0 = Math.cos(la0);
    // the sphere: a faint body and a rim
    const g = c.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R);
    g.addColorStop(0, 'rgba(242,237,228,0.07)'); g.addColorStop(1, 'rgba(242,237,228,0.015)');
    c.fillStyle = g; c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(242,237,228,0.12)'; c.lineWidth = 1; c.stroke();
    const cur = conts[G.seg];
    const hot = new Set(cur ? cur.list.map((x) => x.id) : []);
    for (const d of G.dots) {
      const dl = d.lo - lo0, cd = Math.cos(dl);
      const z = s0 * d.sl + c0 * d.cl * cd;
      if (z <= 0) continue;
      const x = cx + R * d.cl * Math.sin(dl), y = cy - R * (c0 * d.sl - s0 * d.cl * cd);
      if (d.v) {
        c.fillStyle = `rgba(255,138,61,${(0.35 + 0.65 * z).toFixed(3)})`;
        const s = d.big ? 3.2 : 1.9;
        c.fillRect(x - s / 2, y - s / 2, s, s);
      } else {
        c.fillStyle = `rgba(242,237,228,${(0.12 + 0.46 * z).toFixed(3)})`;
        c.fillRect(x - 0.9, y - 0.9, 1.8, 1.8);
      }
    }
    // the flights out of Taipei to this continent's countries, drawn as the globe arrives
    const project = (lo, la, lift) => {
      const l1 = (lo * Math.PI) / 180, a1 = (la * Math.PI) / 180;
      const dl = l1 - lo0, cd = Math.cos(dl);
      const z = s0 * Math.sin(a1) + c0 * Math.cos(a1) * cd;
      const r = R * (1 + lift);
      return { x: cx + r * Math.cos(a1) * Math.sin(dl), y: cy - r * (c0 * Math.sin(a1) - s0 * Math.cos(a1) * cd), z };
    };
    if (cur) {
      const drawn = Math.min(1, Math.max(0, (G.local - 0.25) / 0.45));
      c.lineWidth = 1.4;
      cur.list.forEach((ct, j) => {
        if (ct.id === 'taiwan') return;
        const gi = d3.geoInterpolate(HOME, [lng(ct), lat(ct)]);
        const dist = d3.geoDistance(HOME, [lng(ct), lat(ct)]);
        const lift = Math.min(0.22, 0.04 + dist * 0.07);
        const upto = Math.max(0, Math.min(1, drawn * 1.3 - j * 0.04));
        if (upto <= 0) return;
        c.beginPath();
        let pen = false;
        const n = 48;
        for (let i = 0; i <= n * upto; i++) {
          const s = i / n, [plo, pla] = gi(s), h = Math.sin(Math.PI * s) * lift;
          const q = project(plo, pla, h);
          if (q.z < -0.15) { pen = false; continue; }
          pen ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y);
          pen = true;
        }
        c.strokeStyle = 'rgba(255,138,61,0.85)';
        c.stroke();
      });
    }
    // home
    const h = project(HOME[0], HOME[1], 0);
    if (h.z > 0) {
      const pulse = reduce ? 0 : (now / 1700) % 1;
      c.beginPath(); c.arc(h.x, h.y, 3 + pulse * 14, 0, Math.PI * 2); c.strokeStyle = `rgba(255,138,61,${0.7 * (1 - pulse)})`; c.stroke();
      c.beginPath(); c.arc(h.x, h.y, 3.5, 0, Math.PI * 2); c.fillStyle = '#ffd7b8'; c.fill();
    }
  }
  function buildGlobe() {
    G.cv = $('#globe');
    G.cx = G.cv.getContext('2d');
    sizeGlobe();
    addEventListener('resize', sizeGlobe);
    // one panel per continent
    conts.forEach((k, i) => {
      const p = document.createElement('div');
      p.className = 'cine-panel';
      p.dataset.i = String(i);
      const ps = k.list.map((c) => leadOf(c.id)).filter(Boolean).filter((x) => !used.has(x.id)).slice(0, 3);
      p.innerHTML = `<p class="cine-panel__count mono" data-w="count:${k.id}"></p><h3 class="cine-panel__name" data-w="cont:${k.id}"></h3>
        <p class="cine-panel__list" data-w="list:${k.id}"></p><div class="cine-panel__prints" data-set></div>`;
      ps.forEach((x, j) => { const b = photo(x, { sizes: '(max-width: 52rem) 40vw, 16vw' }); b.classList.add('cine-print'); b.style.setProperty('--j', j); p.querySelector('.cine-panel__prints').append(b); });
      $('#globe-panels').append(p);
      const st = document.createElement('button');
      st.type = 'button';
      st.dataset.i = String(i);
      st.dataset.w = `cont:${k.id}`;
      $('#globe-steps').append(st);
    });
  }
  let panelOn = -1;
  function showPanel(i) {
    if (i === panelOn) return;
    const ps = [...document.querySelectorAll('.cine-panel')];
    const old = ps[panelOn], next = ps[i];
    panelOn = i;
    document.querySelectorAll('#globe-steps button').forEach((b, k) => b.setAttribute('aria-current', String(k === i)));
    if (!window.gsap || reduce) { ps.forEach((p) => { p.style.opacity = p === next ? '1' : '0'; p.style.visibility = p === next ? 'visible' : 'hidden'; }); return; }
    if (old) gsap.to(old, { opacity: 0, y: -24, duration: 0.24, ease: 'power2.out', onComplete: () => gsap.set(old, { visibility: 'hidden' }) });   // the exit is quicker than the entrance
    gsap.set(next, { visibility: 'visible' });
    gsap.fromTo(next, { opacity: 0, y: 36 }, { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out', delay: old ? 0.12 : 0 });
    gsap.fromTo(next.querySelectorAll('.cine-print'), { opacity: 0, x: -80, rotate: (j) => -14 + j * 4, scale: 0.92 },
      { opacity: 1, x: 0, rotate: (j) => -5 + j * 5, scale: 1, duration: 1, ease: 'expo.out', stagger: 0.07, delay: old ? 0.2 : 0.08 });
  }

  /* ------------------------------------------------ 4. the continents, each its own device */
  const withPhotos = (k) => k.list.filter((c) => photosOf(c.id).length).sort((a, c) => photosOf(c.id).length - photosOf(a.id).length);
  const head = (k, cls = '') => `<header class="sx-head ${cls}"><h2 class="sx-name" id="st-${k.id}" data-w="cont:${k.id}"></h2><p class="sx-sub" data-w="countsub:${k.id}"></p></header>`;
  const fill = (p, sizes, lazy = true) => {
    const img = new Image(p.w, p.h);
    img.alt = L(p.alt);
    img.dataset.alt = p.id;
    img.sizes = sizes;
    img.srcset = D3.srcset(p);
    img.src = D3.src(p);
    img.decoding = 'async';
    if (lazy) img.loading = 'lazy';
    return img;
  };
  function stageMask(k, sec) {
    const ph = byId[STAGE.mask] || leadOf(k.list[0].id);
    sec.className = 'stage';
    sec.innerHTML = `<div class="stage__stick">
      <div class="stage__photo" data-set></div>
      <div class="stage__mask" aria-hidden="true"><span class="stage__word" data-w="contU:${k.id}"></span></div>
      <div class="stage__shade" aria-hidden="true"></div>
      ${head(k, 'stage__head')}
      <div class="stage__cards"><ul class="stage__track"></ul></div></div>`;
    const b = photo(ph, { sizes: '100vw' });
    b.tabIndex = -1;
    sec.querySelector('.stage__photo').append(b);
    const track = sec.querySelector('.stage__track');
    k.list.slice().sort((a, c) => photosOf(c.id).length - photosOf(a.id).length).forEach((c) => {
      const li = document.createElement('li');
      li.className = 'card';
      const lead = leadOf(c.id);
      const n = photosOf(c.id).length;
      li.innerHTML = `<a class="card__a"${n ? ` href="photos.html#place=${c.id}"` : ''}>
        <span class="card__img">${lead ? '' : '<b class="card__code" data-w="code:' + c.id + '"></b>'}</span>
        <span class="card__name" data-w="name:${c.id}"></span>
        <span class="card__meta mono"><span data-w="code:${c.id}"></span><span data-w="when:${c.id}"></span><span data-w="nph:${c.id}"></span></span></a>`;
      if (lead) { const img = fill(lead, '(max-width: 52rem) 46vw, 16vw'); img.alt = ''; li.querySelector('.card__img').append(img); }
      track.append(li);
    });
  }
  function stageStack(k, sec) {
    sec.className = 'sx sx--stack';
    sec.innerHTML = `<div class="wrap">${head(k)}</div><div class="sx-stack"></div><p class="sx-also wrap" data-w="also:${k.id}"></p>`;
    const stack = sec.querySelector('.sx-stack');
    withPhotos(k).forEach((c) => {
      const lead = leadOf(c.id);
      const art = document.createElement('article');
      art.className = 'sx-panel';
      art.innerHTML = `<div class="sx-panel__ph"></div><div class="sx-panel__shade" aria-hidden="true"></div>
        <div class="sx-panel__say wrap"><p class="sx-panel__meta mono"><span data-w="code:${c.id}"></span><span data-w="when:${c.id}"></span></p>
        <h3 class="sx-panel__name" data-w="name:${c.id}"></h3><p class="sx-panel__note" data-w="note:${c.id}"></p>
        <a class="link sx-panel__go" href="photos.html#place=${c.id}" data-w="nph:${c.id}"></a></div>`;
      art.querySelector('.sx-panel__ph').append(fill(lead, '100vw'));
      stack.append(art);
    });
    if (!k.list.some((c) => !photosOf(c.id).length)) sec.querySelector('.sx-also').remove();
  }
  function stageSequence(k, sec) {
    const frames = k.list.flatMap((c) => photosOf(c.id)).filter((p) => !used.has(p.id) || p.id === 'aurora').slice(0, 7);
    sec.className = 'sx sx--seq';
    sec.style.setProperty('--n', String(frames.length));
    sec.innerHTML = `<div class="sx-seq__stick"><div class="sx-seq__frames" data-set></div><div class="sx-seq__shade" aria-hidden="true"></div>
      <div class="wrap sx-seq__top">${head(k)}</div>
      <div class="wrap sx-seq__cap"><p class="sx-seq__country"></p><p class="sx-seq__place mono"></p></div>
      <div class="sx-seq__ticks" aria-hidden="true">${frames.map(() => '<i></i>').join('')}</div></div>`;
    frames.forEach((p, i) => {
      const f = document.createElement('div');
      f.className = 'sx-seq__f';
      f.dataset.id = p.id;
      const b = photo(p, { sizes: '100vw' });
      b.tabIndex = -1;
      f.append(b);
      if (i === 0) f.classList.add('is-on');
      sec.querySelector('.sx-seq__frames').append(f);
    });
    sec.dataset.frames = frames.map((p) => p.id).join(',');
  }
  function stageZoom(k, sec) {
    const centre = byId[STAGE.zoom];
    const pool = k.list.flatMap((c) => photosOf(c.id)).filter((p) => p !== centre && !used.has(p.id));
    const imgs = [centre, ...pool.slice(0, 6)].filter(Boolean);
    sec.className = 'sx sx--zoom';
    sec.innerHTML = `<div class="sx-zoom__stick">${imgs.map((p, i) => `<div class="sx-zoom__layer" data-i="${i}"><div class="sx-zoom__img sx-zoom__img--${i}"></div></div>`).join('')}
      <div class="sx-zoom__shade" aria-hidden="true"></div>
      <div class="sx-zoom__say wrap">${head(k)}<ul class="sx-zoom__list">${withPhotos(k).map((c) => `<li><a class="link" href="photos.html#place=${c.id}"><span data-w="name:${c.id}"></span>, <span data-w="nph:${c.id}"></span></a> <span class="mono" data-w="note:${c.id}"></span></li>`).join('')}</ul></div></div>`;
    imgs.forEach((p, i) => { const img = fill(p, i === 0 ? '100vw' : '40vw'); if (i) img.alt = ''; sec.querySelector(`.sx-zoom__img--${i}`).append(img); });
  }
  function buildStages() {
    const make = { mask: stageMask, stack: stageStack, sequence: stageSequence, zoom: stageZoom };
    conts.forEach((k, i) => {
      const sec = document.createElement('section');
      sec.id = `stage-${k.id}`;
      sec.setAttribute('aria-labelledby', `st-${k.id}`);
      make[DEVICE[i % DEVICE.length]](k, sec);
      $('#stages').append(sec);
    });
  }

  function seqWords(sec, i, animate) {
    const id = (sec.dataset.frames || '').split(',')[i];
    const p = byId[id];
    if (!p) return;
    const c = sec.querySelector('.sx-seq__country'), pl = sec.querySelector('.sx-seq__place');
    c.textContent = L(country[p.country]);
    pl.textContent = `${L(p.place)}   ${coord(p)}`;
    if (animate) gsap.fromTo([c, pl], { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out', stagger: 0.05, overwrite: true });
  }

  /* ------------------------------------------------ 5. the index */
  function buildIndex() {
    const ol = $('#index');
    conts.forEach((k) => {
      const head = document.createElement('li');
      head.className = 'ix-cont mono';
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
          <span class="ix__name" data-w="name:${c.id}"></span><span class="ix__meta mono"><span data-w="code:${c.id}"></span><span data-w="years:${c.id}"></span></span>
          <span class="ix__n mono" data-w="nph:${c.id}"></span></a>`;
        ol.append(li);
      });
    });
    const empty = S.continents.filter((k) => !S.countries.some((c) => c.continent === k.id));
    $('#next-track').innerHTML = [0, 1].map(() => `<span>${empty.map((k) => `<b data-w="contU:${k.id}"></b>`).join('')}</span>`).join('');
  }
  function peek() {
    const box = $('#peek'), img = box.querySelector('img');
    if (!fine.matches || reduce) return;
    const qx = gsap.quickTo(box, 'x', { duration: 0.55, ease: 'power3' });
    const qy = gsap.quickTo(box, 'y', { duration: 0.55, ease: 'power3' });
    const list = $('#index');
    list.addEventListener('pointermove', (e) => { qx(e.clientX); qy(e.clientY); });
    list.addEventListener('pointerover', (e) => {
      const li = e.target.closest('.ix');
      if (!li || !li.dataset.peek) { box.classList.remove('is-on'); list.classList.remove('is-peek'); return; }
      if (img.src !== new URL(li.dataset.peek, location.href).href) img.src = li.dataset.peek;
      box.classList.add('is-on');
      list.classList.add('is-peek');
      list.querySelectorAll('.ix.is-hot').forEach((x) => x.classList.remove('is-hot'));
      li.classList.add('is-hot');
    });
    list.addEventListener('pointerleave', () => { box.classList.remove('is-on'); list.classList.remove('is-peek'); list.querySelectorAll('.ix.is-hot').forEach((x) => x.classList.remove('is-hot')); });
  }

  /* ------------------------------------------------ words */
  function words() {
    document.querySelectorAll('[data-w]').forEach((el) => {
      const [k, a] = el.dataset.w.split(':');
      const c = country[a];
      const cont = S.continents.find((x) => x.id === a);
      const v = {
        count: () => t('countriesN', S.countries.filter((x) => x.continent === a).length),
        countsub: () => `${t('countriesN', S.countries.filter((x) => x.continent === a).length)}${D3.lang === 'zh' ? '。' : '. '}${L(SUB[a] || (cont && cont.sub))}`,
        note: () => L(c && c.note) || '',
        also: () => `${t('alsoStamped')} ${S.countries.filter((x) => x.continent === a && !photosOf(x.id).length).map((x) => `${L(x)} ${entry(x).note}`).join(D3.lang === 'zh' ? '、' : ', ')}`,
        cont: () => L(cont), contU: () => (D3.lang === 'zh' ? L(cont) : L(cont).toUpperCase()), sub: () => L(SUB[a] || (cont && cont.sub)),
        list: () => S.countries.filter((x) => x.continent === a).map((x) => L(x)).join(D3.lang === 'zh' ? '、' : ', '),
        name: () => L(c), code: () => entry(c).code, when: () => entry(c).note,
        nph: () => (photosOf(a).length ? t('photosN', photosOf(a).length) : t('noPhotos')),
        years: () => [...new Set(c.visits.map((v) => v.when.slice(0, 4)))].join('  ') || t('home'),
      }[k];
      if (v) el.textContent = v();
    });
    document.querySelectorAll('[data-alt]').forEach((img) => { if (img.alt) img.alt = L(byId[img.dataset.alt].alt); });
    document.querySelectorAll('.sx--seq').forEach((sec) => seqWords(sec, +(sec.dataset.at || 0)));
    $('#hero-pause').textContent = t(userPaused ? 'play' : 'pause');
    const lens = [...document.querySelectorAll('.sx-panel__name, .stage__word')].map((w) => [w, Math.max(w.classList.contains('stage__word') ? 4 : 6, [...w.textContent].length)]);   // read first
    lens.forEach(([w, n]) => w.style.setProperty('--len', String(n)));   // then write
    sayWords();
    if (at >= 0) heroWords(slides[at], false);
    document.querySelectorAll('.cine-dot').forEach((d, k) => d.setAttribute('aria-label', t('show', k + 1)));
    const ig = $('#close-ig');
    ig.href = S.instagram.url;
    ig.textContent = `@${S.instagram.handle}`;
  }

  /* ------------------------------------------------ motion */
  function motion() {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();

    // the hero keeps going only while it is on screen and the tab is in view
    ScrollTrigger.create({ trigger: '#hero', start: 'top bottom', end: 'bottom top', onToggle: (s) => { heroOn = s.isActive; heroOn ? schedule() : pause(paused); if (!heroOn) clearTimeout(timer); } });
    document.addEventListener('visibilitychange', () => { if (document.hidden) { clearTimeout(timer); } else schedule(); });
    // the visitor can stop it: the Pause word, or resting the pointer or the keyboard on the controls
    const pb = $('#hero-pause');
    pb.addEventListener('click', () => { userPaused = !userPaused; pb.setAttribute('aria-pressed', String(userPaused)); pb.textContent = t(userPaused ? 'play' : 'pause'); pause(userPaused); });
    const ctl = $('.cine-hero__ctl');
    ctl.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') pause(true); });
    ctl.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && !userPaused) pause(false); });
    ctl.addEventListener('focusin', () => pause(true));
    ctl.addEventListener('focusout', () => { if (!userPaused) pause(false); });
    if (!reduce) {
      // leaving the hero: the frame sinks back as the page comes over it
      gsap.to('#hero-frame', { scale: 0.9, opacity: 0.55, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true,
        onLeave: () => { $('#hero-frame').style.visibility = 'hidden'; }, onEnterBack: () => { $('#hero-frame').style.visibility = ''; } } });
      // the record lights up word by word
      gsap.fromTo('#say .w', { opacity: 0.14 }, { opacity: 1, ease: 'none', stagger: 0.12, scrollTrigger: { trigger: '.cine-say', start: 'top 72%', end: 'bottom 55%', scrub: true } });
    }

    // the globe follows the scroll through its section
    const gsec = $('#globe-sec');
    ScrollTrigger.create({ trigger: gsec, start: 'top top', end: 'bottom bottom', onUpdate: (s) => {
      const v = globeView(s.progress);
      G.rot = [v.lo, v.la]; G.seg = v.seg; G.local = v.local;
      showPanel(v.seg);
    } });
    showPanel(0);
    document.querySelector('#globe-steps').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      const s = ScrollTrigger.getAll().find((x) => x.trigger === gsec);
      const n = conts.length;
      D3.scrollTo(s.start + ((+b.dataset.i + 0.55) / n) * (s.end - s.start), { duration: 1.6 });
    });
    // the globe draws only while it is on screen
    let running = false, looping = false;
    const loop = (now) => { if (!running) { looping = false; return; } drawGlobe(now); requestAnimationFrame(loop); };
    const io = new IntersectionObserver(([en]) => { running = en.isIntersecting; if (running && !looping) { looping = true; requestAnimationFrame(loop); } });
    io.observe(G.cv);

    // Asia: its name cut out of a photograph, opening into it; then the countries rise as cards
    document.querySelectorAll('.stage').forEach((sec) => {
      const word = sec.querySelector('.stage__word'), mask = sec.querySelector('.stage__mask');
      const img = sec.querySelector('.stage__photo img');
      const cards = sec.querySelectorAll('.card');
      if (reduce) { gsap.set(mask, { opacity: 0 }); gsap.set(sec.querySelector('.stage__shade'), { opacity: 0.6 }); return; }
      const tl = gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom bottom', scrub: 0.6 } });
      tl.fromTo(img, { scale: 1.28 }, { scale: 1.04, duration: 0.55, ease: 'none' }, 0)
        .fromTo(word, { scale: 1 }, { scale: 1.45, duration: 0.42, ease: 'power2.in' }, 0.02)   // the camera pushes through the letters
        .to(mask, { opacity: 0, duration: 0.18, ease: 'none' }, 0.26)
        .fromTo(sec.querySelector('.stage__shade'), { opacity: 0 }, { opacity: 0.72, duration: 0.2, ease: 'none' }, 0.4)
        .fromTo(sec.querySelector('.stage__head'), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.16, ease: 'power3.out' }, 0.44)
        .fromTo(cards, { opacity: 0, y: 140, rotate: 2 }, { opacity: 1, y: 0, rotate: 0, duration: 0.2, ease: 'power3.out', stagger: 0.025 }, 0.52);
      mm.add('(min-width: 52.01rem)', () => {
        const track = sec.querySelector('.stage__track');
        const extra = () => Math.max(0, track.scrollWidth - track.clientWidth);
        tl.fromTo(track, { x: 0 }, { x: () => -extra(), duration: 0.3, ease: 'none' }, 0.7);
      });
    });

    // Europe: each country a full screen that the next one slides over; the one underneath sinks back
    document.querySelectorAll('.sx--stack').forEach((sec) => {
      const ps = [...sec.querySelectorAll('.sx-panel')];
      if (reduce) return;
      ps.forEach((p) => ScrollTrigger.create({ trigger: p, start: 'top bottom', end: 'bottom top', onToggle: (st) => p.classList.toggle('is-live', st.isActive) }));
      ps.forEach((p, i) => {
        gsap.fromTo(p.querySelector('.sx-panel__say'), { opacity: 0, y: 50 }, { opacity: 1, y: 0, ease: 'power3.out', scrollTrigger: { trigger: p, start: 'top 75%', end: 'top 20%', scrub: 0.5 } });
        gsap.fromTo(p.querySelector('img'), { scale: 1.18 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: p, start: 'top bottom', end: 'top top', scrub: true } });
        const next = ps[i + 1];
        if (next) gsap.to(p.querySelector('.sx-panel__ph'), { scale: 0.9, opacity: 0.35, ease: 'none', scrollTrigger: { trigger: next, start: 'top bottom', end: 'top top', scrub: true } });
      });
    });

    // Oceania: the photographs follow one another as the scroll moves, each named as it arrives
    document.querySelectorAll('.sx--seq').forEach((sec) => {
      const fs = [...sec.querySelectorAll('.sx-seq__f')];
      const ticks = [...sec.querySelectorAll('.sx-seq__ticks i')];
      const n = fs.length;
      const show = (pr) => {
        const f = pr * (n - 1);
        // each photograph rises over the last from the bottom edge, a clean wipe rather than a double exposure
        const rev = fs.map((el, k) => (k === 0 ? 1 : Math.max(0, Math.min(1, (f - (k - 0.55)) / 0.55))));
        fs.forEach((el, k) => {
          const p = reduce ? (Math.round(f) >= k ? 1 : 0) : rev[k];
          const covered = k < n - 1 && (reduce ? Math.round(f) > k : rev[k + 1] >= 1);
          const live = p > 0 && !covered;
          el.style.zIndex = String(k);
          el.style.opacity = '1';
          el.style.visibility = live ? 'visible' : 'hidden';
          el.classList.toggle('is-live', live);
          el.style.clipPath = `inset(${((1 - p) * 100).toFixed(2)}% 0 0 0)`;
          if (!reduce) el.querySelector('img').style.transform = `scale(${(1 + (1 - p) * 0.12).toFixed(4)})`;
        });
        const i = Math.round(f);
        ticks.forEach((tk, k) => tk.classList.toggle('is-on', k <= i));
        if (+sec.dataset.at !== i) { sec.dataset.at = String(i); seqWords(sec, i, !reduce); }
      };
      ScrollTrigger.create({ trigger: sec, start: 'top top', end: 'bottom bottom', onUpdate: (st) => show(st.progress) });
      show(0);
    });

    // North America: a cluster of photographs that the scroll zooms through until one fills the screen
    document.querySelectorAll('.sx--zoom').forEach((sec) => {
      const layers = [...sec.querySelectorAll('.sx-zoom__layer')];
      const scales = [4, 5, 6, 5, 6, 8, 9];
      if (reduce) {
        layers.forEach((l, i) => gsap.set(l, { scale: scales[i], opacity: i ? 0 : 1 }));
        gsap.set(sec.querySelector('.sx-zoom__shade'), { opacity: 0.7 });
        gsap.set(sec.querySelector('.sx-zoom__say'), { opacity: 1 });
        return;
      }
      ScrollTrigger.create({ trigger: sec, start: 'top bottom', end: 'bottom top', onToggle: (st) => layers.forEach((l) => l.classList.toggle('is-live', st.isActive)) });
      const tl = gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom bottom', scrub: 0.6 } });
      layers.forEach((l, i) => tl.fromTo(l, { scale: 1 }, { scale: scales[i], duration: 0.7, ease: 'power1.in' }, 0));
      tl.fromTo(sec.querySelector('.sx-zoom__shade'), { opacity: 0 }, { opacity: 0.7, duration: 0.15, ease: 'none' }, 0.62)
        .fromTo(sec.querySelector('.sx-zoom__say'), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.15, ease: 'power3.out' }, 0.72);
    });

    // the index rises as it arrives
    ScrollTrigger.batch('.ix, .ix-cont', { start: 'top 92%', once: true,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out', stagger: 0.04 }) });
    // the empty continents run past, slowly, only while on screen
    if (!reduce) {
      const run = gsap.to('#next-track', { xPercent: -50, duration: 38, ease: 'none', repeat: -1, paused: true });
      ScrollTrigger.create({ trigger: '.cine-close', start: 'top bottom', end: 'bottom top', onToggle: (s) => (s.isActive ? run.play() : run.pause()) });
    }
    document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
    addEventListener('load', () => ScrollTrigger.refresh());
  }

  /* ------------------------------------------------ start */
  buildHero();
  buildGlobe();
  buildStages();
  buildIndex();
  D3.apply();
  words();
  onLang(words);
  if (window.gsap) motion();
  peek();
  go(0);
  const opening = intro();
  opening.then(() => { if (!reduce && window.gsap) gsap.from('.cine-hero__bar, .bar', { opacity: 0, y: -8, duration: 0.8, ease: 'power3.out' }); });
  if (reduce) { const pb = $('#hero-pause'); if (pb) pb.hidden = true; }
  loadGlobe().then(() => { sizeGlobe(); drawGlobe(performance.now()); }).catch(() => { /* the globe stays empty; the panels still read */ });
})();

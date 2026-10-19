/* design 3, the home page: one camera.
   Aoraki held as the opening frame while the coordinates travel from Taipei to the place and a faint
   globe turns behind it. Then the globe proper: for every continent the camera turns to it, the
   flights draw out of Taipei, and the camera pushes through the continent's name into its lead
   photograph, holds, then pulls back to the globe for the next. Oceania's descent ends on the aurora
   and holds longest. Then every country, and the close on a photograph. One grammar, held long.
   Motion follows Emil Kowalski's rules: exponential ease-out for arrivals, exits quicker than
   entrances, hover only on real pointers, and reduced motion keeps the words and drops movement. */
(() => {
  'use strict';
  const { S, photo, t, L, esc, onLang, reduce, country, byId } = D3;
  const $ = (s, r = document) => r.querySelector(s);
  const fine = matchMedia('(hover: hover) and (pointer: fine)');

  window.PAGE = {
    title: { en: 'tuan photography 陳亮元', zh: 'tuan photography 陳亮元' },
    en: {
      heroTitle: 'tuan photography, landscape photographs by Thomas Chen', heroBy: 'Thomas Chen, landscape photographer',
      go: "See where I've been", inShort: 'In short',
      say: (n, k, trips, flights, y) => `${n} countries. ${k} continents. ${trips} trips and ${flights} flights since ${y}. Every photograph here is my own.`,
      globeH: 'Where the trips went', globeLabel: 'A globe of the countries visited, turning from continent to continent, with the flights out of Taipei', continents: 'Continents',
      countriesN: (n) => (n === 1 ? '1 country' : `${n} countries`), photosN: (n) => (n === 1 ? '1 photograph' : `${n} photographs`),
      noPhotos: 'No photographs yet', home: 'Home', alsoStamped: 'Stamped, not yet photographed:',
      indexH: 'Every country', closeT: 'Where next?', closeP: 'South America is in research. Africa and Antarctica are empty pages.',
      trips: 'Follow the journeys', all: 'Every photograph', about: 'About me', follow: 'Follow on Instagram',
      introKm: 'kilometres flown', introCities: 'cities', night: 'Night', blue: 'Blue hour', golden: 'Golden hour', day: 'Daylight',
      months: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
    },
    zh: {
      heroTitle: 'tuan photography，陳亮元的風景攝影', heroBy: '陳亮元，風景攝影',
      go: '看我去過哪裡', inShort: '簡單說',
      say: (n, k, trips, flights, y) => `${n} 個國家，${k} 個大洲。${y} 年至今，${trips} 趟旅行、${flights} 趟航班。這裡的每一張照片都是我拍的。`,
      globeH: '旅程去了哪裡', globeLabel: '去過的國家所在的地球，一洲一洲轉過去，加上從台北出發的航線', continents: '大洲',
      countriesN: (n) => `${n} 個國家`, photosN: (n) => `${n} 張照片`,
      noPhotos: '還沒有照片', home: '家', alsoStamped: '蓋了章，還沒放上照片：',
      indexH: '所有國家', closeT: '下一站？', closeP: '南美洲正在研究中。非洲和南極洲還是空白頁。',
      trips: '跟著旅程走', all: '所有照片', about: '關於我', follow: '在 Instagram 追蹤',
      introKm: '公里的飛行', introCities: '個城市', night: '夜晚', blue: '藍調時刻', golden: '黃金時刻', day: '白天',
      months: null,
    },
  };

  /* ------------------------------------------------ choices */
  const HERO = 'aoraki';
  const CLOSE = 'matterhorn-lake';
  // each continent's lead photograph, the one the camera lands in; Oceania ends on the aurora
  const LEAD = { asia: 'tokyo-night', europe: 'calanque', oceania: 'aurora', 'north-america': 'lower-manhattan-reflection' };
  const SUB = { oceania: { en: 'Ridgelines, lakes and the southern stars after dark.', zh: '稜線、湖泊，以及入夜後的南半球星空。' } };
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
  const fmtCoord = (la, lo) => `${Math.abs(la).toFixed(2)}° ${la >= 0 ? 'N' : 'S'}   ${Math.abs(lo).toFixed(2)}° ${lo >= 0 ? 'E' : 'W'}`;
  const COVER = '(orientation: portrait) 240vw, 100vw';   // a full-bleed photograph on a portrait phone needs the larger copy

  /* ------------------------------------------------ 0. the opening count (once per visit) */
  function intro() {
    const el = $('#intro');
    let seen = false;
    try { seen = sessionStorage.getItem('d3-intro') === '1'; sessionStorage.setItem('d3-intro', '1'); } catch (e) { /* storage blocked */ }
    // a link from the review list (?intro= or ?hero=) always plays, so each version can be watched again
    const asked = /[?&](intro|hero)=/.test(location.search);
    if ((seen && !asked) || reduce || !window.gsap) { el.remove(); return Promise.resolve(); }
    if (D3.lenis) D3.lenis.stop();
    const IV = window.INTRO_VARIANTS;
    if (IV && IV.name !== 'countries') {
      return IV.run({ S, byId, L, country, gsap, $, reduce, src: D3.src, t, heroGlobe, makeGlobe, whenDots: () => dotsLoad }).then(() => { if (D3.lenis) D3.lenis.start(); });
    }
    // the count runs through the countries in the order he reached them, and lands on home
    const order = S.countries.filter((c) => c.visits.length).sort((a, b) => a.visits[0].when.localeCompare(b.visits[0].when));
    const names = [...order.map((c) => L(c)), L(country.taiwan)];
    const n = $('#intro-n'), pl = $('#intro-place');
    return new Promise((done) => {
      const o = { v: 0 };
      const tl = gsap.timeline({ onComplete: () => { el.remove(); if (D3.lenis) D3.lenis.start(); done(); } });
      tl.to(o, { v: names.length, duration: 2.1, ease: 'power2.inOut', onUpdate: () => {
        const i = Math.max(1, Math.round(o.v));
        n.textContent = String(i).padStart(2, '0');
        pl.textContent = names[i - 1];
      } })
        .to('.cine-intro__count', { opacity: 0, y: -12, duration: 0.25, ease: 'power2.out' }, '+=0.35')
        .to('.cine-intro__half--top', { yPercent: -100, duration: 0.9, ease: 'power4.inOut' }, '<0.1')
        .to('.cine-intro__half--bottom', { yPercent: 100, duration: 0.9, ease: 'power4.inOut' }, '<');
      el.addEventListener('click', () => tl.progress(1), { once: true });
      addEventListener('keydown', () => tl.progress(1), { once: true });
    });
  }

  /* ------------------------------------------------ the globe engine (two canvases: the hero's faint one, the film's) */
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
  const centres = conts.map((k) => d3.geoCentroid({ type: 'MultiPoint', coordinates: k.list.map((x) => [lng(x), lat(x)]) }));

  /** one globe: a canvas, its size, where it sits, how it is lit */
  function makeGlobe(cv, opts) {
    const g = { cv, cx: cv.getContext('2d'), W: 0, H: 0, dpr: 1, R: 0, x: 0, y: 0, rot: [HOME[0], HOME[1]], hot: null, arcs: 0, alpha: 1, ...opts };
    g.size = () => {
      const r = cv.getBoundingClientRect();
      g.dpr = Math.min(2, devicePixelRatio || 1);
      g.W = r.width; g.H = r.height;
      cv.width = Math.round(g.W * g.dpr); cv.height = Math.round(g.H * g.dpr);
      const [rx, ry, rr] = g.place(g.W, g.H);
      g.x = rx; g.y = ry; g.R = rr;
    };
    g.draw = (now) => {
      if (!dotsReady) return;
      const c = g.cx, R = g.R, cx = g.x, cy = g.y, A = g.alpha;
      c.setTransform(g.dpr, 0, 0, g.dpr, 0, 0);
      c.clearRect(0, 0, g.W, g.H);
      if (A <= 0.001) return;
      const drift = reduce ? 0 : Math.sin(now / 4000) * 2;
      const lo0 = ((g.rot[0] + drift) * Math.PI) / 180, la0 = (g.rot[1] * Math.PI) / 180;
      const s0 = Math.sin(la0), c0 = Math.cos(la0);
      const grad = c.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R);
      grad.addColorStop(0, `rgba(242,237,228,${0.07 * A})`); grad.addColorStop(1, `rgba(242,237,228,${0.015 * A})`);
      c.fillStyle = grad; c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.fill();
      c.strokeStyle = `rgba(242,237,228,${0.12 * A})`; c.lineWidth = 1; c.stroke();
      const hot = g.hot;
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        const dl = d.lo - lo0, cd = Math.cos(dl);
        const z = s0 * d.sl + c0 * d.cl * cd;
        if (z <= 0) continue;
        const x = cx + R * d.cl * Math.sin(dl), y = cy - R * (c0 * d.sl - s0 * d.cl * cd);
        if (d.v) {
          c.fillStyle = `rgba(255,138,61,${((0.35 + 0.65 * z) * A).toFixed(3)})`;
          const s = d.big ? 3.2 : 1.9;
          c.fillRect(x - s / 2, y - s / 2, s, s);
        } else {
          c.fillStyle = `rgba(242,237,228,${((0.12 + 0.46 * z) * A).toFixed(3)})`;
          c.fillRect(x - 0.9, y - 0.9, 1.8, 1.8);
        }
      }
      const project = (lo, la, lift) => {
        const l1 = (lo * Math.PI) / 180, a1 = (la * Math.PI) / 180;
        const dl = l1 - lo0, cd = Math.cos(dl);
        const z = s0 * Math.sin(a1) + c0 * Math.cos(a1) * cd;
        const r = R * (1 + lift);
        return { x: cx + r * Math.cos(a1) * Math.sin(dl), y: cy - r * (c0 * Math.sin(a1) - s0 * Math.cos(a1) * cd), z };
      };
      if (hot && g.arcs > 0) {
        c.lineWidth = 1.4;
        hot.list.forEach((ct, j) => {
          if (ct.id === 'taiwan') return;
          const to = [lng(ct), lat(ct)];
          const gi = d3.geoInterpolate(HOME, to);
          const dist = d3.geoDistance(HOME, to);
          const lift = Math.min(0.2, 0.04 + dist * 0.06);
          const upto = Math.max(0, Math.min(1, g.arcs * 1.3 - j * 0.04));
          if (upto <= 0) return;
          c.beginPath();
          let pen = false;
          const n = 48;
          for (let i = 0; i <= n * upto; i++) {
            const s = i / n, [plo, pla] = gi(s), h = Math.sin(Math.PI * s) * lift;
            const q = project(plo, pla, h);
            const q0 = project(plo, pla, 0);
            if (q0.z < 0) { pen = false; continue; }   // only the part of the arc over the visible half
            pen ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y);
            pen = true;
          }
          c.strokeStyle = `rgba(255,138,61,${0.85 * A})`;
          c.stroke();
        });
      }
      const h = project(HOME[0], HOME[1], 0);
      if (h.z > 0) {
        const pulse = reduce ? 0 : (now / 1700) % 1;
        c.beginPath(); c.arc(h.x, h.y, 3 + pulse * 14, 0, Math.PI * 2); c.strokeStyle = `rgba(255,138,61,${0.7 * (1 - pulse) * A})`; c.stroke();
        c.beginPath(); c.arc(h.x, h.y, 3.5, 0, Math.PI * 2); c.fillStyle = `rgba(255,215,184,${A})`; c.fill();
      }
    };
    return g;
  }

  /* ------------------------------------------------ the viewfinder: the page is seen through his camera */
  const VF = { el: null, box: null, line: null, p: null, armed: false };
  const exposure = (p) => (p && p.focal ? [p.focal, p.aperture, p.shutter, `ISO ${p.iso}`] : null);
  function buildViewfinder() {
    const vf = document.createElement('div');
    vf.className = 'vf';
    vf.setAttribute('aria-hidden', 'true');
    vf.innerHTML = `<i class="vf__c vf__c--tl"></i><i class="vf__c vf__c--tr"></i><i class="vf__c vf__c--bl"></i><i class="vf__c vf__c--br"></i>
      <div class="vf__focus"><i></i><i></i><i></i><i></i></div>
      <p class="vf__line mono"><span class="vf__exp"></span><span class="vf__rec"><i></i>REC</span></p>`;
    document.body.append(vf);
    VF.el = vf; VF.box = vf.querySelector('.vf__focus'); VF.line = vf.querySelector('.vf__exp');
    if (fine.matches && !reduce) {
      const qx = gsap.quickTo(VF.box, 'x', { duration: 0.7, ease: 'power3' });
      const qy = gsap.quickTo(VF.box, 'y', { duration: 0.7, ease: 'power3' });
      let settle = 0;
      addEventListener('pointermove', (e) => {
        if (!VF.armed) return;
        VF.el.classList.add('is-aimed');
        qx(e.clientX); qy(e.clientY);
        // the square breathes larger while the pointer moves, and locks (shrinks, turns orange) when it rests: focus acquired
        VF.box.classList.remove('is-locked');
        clearTimeout(settle);
        settle = setTimeout(() => VF.box.classList.add('is-locked'), 380);
      }, { passive: true });
    }
  }
  /** show the exposure of the photograph on screen; null hides the line */
  function viewfinder(p, on) {
    if (!VF.el) return;
    VF.armed = !!on;
    VF.el.classList.toggle('is-on', !!on);
    if (p === VF.p) return;
    VF.p = p;
    const ex = exposure(p);
    VF.line.textContent = ex ? ex.join('   ') : '';
    VF.el.classList.toggle('is-blind', !ex);
  }

  /* ------------------------------------------------ 1. the hero */
  let hero = byId[HERO];
  let heroGlobe = null;
  const HV = window.HERO_VARIANTS;
  function buildHero() {
    if (HV && HV.name !== 'film') hero = HV.build({ S, byId, photo, L, country, COVER, reduce, $, src: D3.src, srcset: D3.srcset }) || hero;
    else { const b = photo(hero, { sizes: COVER, eager: true }); b.classList.add('film-hero__ph'); $('#hero-photo').append(b); }
    heroGlobe = makeGlobe($('#hero-globe'), { alpha: 0.32, place: (W, H) => [W * 0.78, H * 0.42, Math.min(W * 0.36, H * 0.48)] });
    heroGlobe.rot = [lng(hero), lat(hero)];
  }
  function heroWords() {
    const c = country[hero.country];
    const name = D3.lang === 'zh' ? L(c) : L(c).toUpperCase();
    $('#hero-name-in').textContent = name;
    $('#hero-name').style.setProperty('--len', String(Math.max(5, [...name].length)));
    $('#hero-where').textContent = L(hero.place);
    if (!heroPlayed) $('#hero-coord').textContent = fmtCoord(lat(hero), lng(hero));
  }
  let heroPlayed = false;
  function heroArrive() {
    heroPlayed = true;
    const coord = $('#hero-coord');
    if (HV && HV.name !== 'film') { HV.arrive({ gsap, reduce, hero, viewfinder, $, fmtCoord, HOME, lat, lng, heroGlobe }); return; }
    if (reduce) { coord.textContent = fmtCoord(lat(hero), lng(hero)); return; }
    const o = { la: HOME[1], lo: HOME[0] };
    gsap.from('#hero-name-in', { yPercent: 108, duration: 1.3, ease: 'expo.out', delay: 0.1 });
    gsap.from(['#hero-where', '.film-hero__bar > *'], { opacity: 0, y: 12, duration: 0.9, ease: 'power3.out', stagger: 0.08, delay: 0.5 });
    // the coordinates travel from Taipei to the place while the faint globe turns the same way
    gsap.to(o, { la: lat(hero), lo: lng(hero), duration: 2.6, ease: 'power3.inOut', delay: 0.4,
      onUpdate: () => { coord.textContent = fmtCoord(o.la, o.lo); if (heroGlobe) heroGlobe.rot = [o.lo, o.la]; } });
    if (heroGlobe) heroGlobe.rot = [HOME[0], HOME[1]];
    // focus pulls: the photograph arrives soft and resolves, as a lens finding its subject
    gsap.fromTo('.film-hero__ph img', { scale: 1.12, filter: 'blur(14px)' }, { scale: 1, filter: 'blur(0px)', duration: 2.2, ease: 'power2.out', clearProps: 'filter' });
    gsap.fromTo('.film-hero__ph img', { scale: 1.12 }, { scale: 1, duration: 9, ease: 'power1.out', delay: 2.2, immediateRender: false });
    setTimeout(() => viewfinder(hero, true), 1700);
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

  /* ------------------------------------------------ 3. the film: globe and descents */
  let filmGlobe = null;
  function buildFilm() {
    filmGlobe = makeGlobe($('#globe'), { place: (W, H) => (W < 832 ? [W / 2, H * 0.38, Math.min(W * 0.46, H * 0.4)] : [W * 0.5, H * 0.5, Math.min(W * 0.3, H * 0.42)]) });
    conts.forEach((k, i) => {
      const lead = byId[LEAD[k.id]] || leadOf(k.list[0].id);
      const sc = document.createElement('div');
      sc.className = 'scene';
      sc.dataset.i = String(i);
      sc.id = `scene-${k.id}`;
      const withPh = k.list.filter((c) => photosOf(c.id).length).sort((a, c) => photosOf(c.id).length - photosOf(a.id).length);
      const without = k.list.filter((c) => !photosOf(c.id).length);
      sc.innerHTML = `
        <div class="scene__photo" data-set></div>
        <div class="scene__mask" aria-hidden="true"><span class="scene__word" data-w="contU:${k.id}"></span></div>
        <div class="scene__shade" aria-hidden="true"></div>
        <div class="scene__blink" aria-hidden="true"></div>
        <div class="scene__say">
          <h3 class="scene__name" data-w="cont:${k.id}"></h3>
          <p class="scene__sub" data-w="countsub:${k.id}"></p>
          <ul class="scene__list">${withPh.map((c) => `<li><a class="scene__c" href="photos.html#place=${c.id}"><span class="scene__cname" data-w="name:${c.id}"></span><span class="mono"><span data-w="code:${c.id}"></span><span data-w="when:${c.id}"></span><span data-w="nph:${c.id}"></span></span></a></li>`).join('')}</ul>
          ${without.length ? `<p class="scene__also mono" data-w="also:${k.id}"></p>` : ''}
        </div>
        <p class="scene__cap mono" data-w="cap:${lead.id}"></p>`;
      const b = photo(lead, { sizes: COVER });
      b.tabIndex = -1;
      sc.querySelector('.scene__photo').append(b);
      $('#scenes').append(sc);
      const st = document.createElement('button');
      st.type = 'button';
      st.dataset.i = String(i);
      st.dataset.w = `cont:${k.id}`;
      $('#globe-steps').append(st);
    });
  }

  /* the film's timeline, in units of one continent = 1.0:
       0.00 to 0.22  the globe turns to the continent, the flights draw
       0.22 to 0.42  the name comes up over the globe, the photograph lives inside the letters
       0.42 to 0.62  the camera pushes through the letters into the photograph
       0.62 to 0.88  hold: the photograph drifts, the countries read
       0.88 to 1.00  pull back out to the globe
     Oceania's hold is longer (its weight in the scroll is 1.35 of a continent). */
  const WEIGHT = conts.map((k) => (k.id === 'oceania' ? 1.35 : 1));
  const total = WEIGHT.reduce((a, b) => a + b, 0);
  const easeIO = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const easeIn = (x) => x * x * x;
  const seg = (x, a, b) => Math.max(0, Math.min(1, (x - a) / (b - a)));
  let sceneOn = -1;
  function filmShow(p) {
    let acc = 0, i = 0, local = 0;
    for (i = 0; i < conts.length; i++) {
      const w = WEIGHT[i] / total;
      if (p < acc + w || i === conts.length - 1) { local = Math.min(1, (p - acc) / w); break; }
      acc += w;
    }
    const k = conts[i];
    const scenes = $('#scenes').children;
    // the globe: turn in the first fifth, arcs draw just after
    const from = i === 0 ? HOME : centres[i - 1], to = centres[i];
    const tk = easeIO(seg(local, 0, 0.22));
    let dl = to[0] - from[0]; dl = ((dl + 540) % 360) - 180;
    filmGlobe.rot = [from[0] + dl * tk, from[1] + (to[1] - from[1]) * tk];
    filmGlobe.hot = k;
    filmGlobe.arcs = seg(local, 0.12, 0.42);
    // the descent and the return
    const up = seg(local, 0.22, 0.42);        // the name rises, photograph inside the letters
    const push = seg(local, 0.42, 0.62);      // through the letters
    const hold = seg(local, 0.62, 0.88);
    const back = seg(local, 0.88, 1);
    const inPlace = push >= 1 && back <= 0;
    filmGlobe.alpha = 1 - easeIO(push) * (1 - easeIO(back));
    $('#globe-steps').style.opacity = String(filmGlobe.alpha);
    for (let s = 0; s < scenes.length; s++) {
      const sc = scenes[s];
      const live = s === i && local > 0.24 && local < 0.995;
      sc.classList.toggle('is-live', live);
      if (!live) { sc.style.visibility = 'hidden'; continue; }
      sc.style.visibility = 'visible';
      const word = sc.querySelector('.scene__word'), mask = sc.querySelector('.scene__mask');
      const ph = sc.querySelector('.scene__photo'), img = sc.querySelector('.scene__photo img');
      const shade = sc.querySelector('.scene__shade'), say = sc.querySelector('.scene__say'), cap = sc.querySelector('.scene__cap');
      const zoom = 1 + easeIn(push) * 7;        // the letters grow until they pass the frame
      const leave = easeIO(back);
      word.style.transform = `translateY(${((1 - easeIO(up)) * 24).toFixed(2)}vh) scale(${zoom.toFixed(3)})`;
      // the photograph exists only inside the letters until the push-through: the mask is at full strength from the first frame
      mask.style.opacity = String((1 - seg(push, 0.75, 1)) * (1 - leave));
      ph.style.opacity = String(Math.min(1, up * 1.5) * (1 - leave));
      ph.style.clipPath = leave > 0 ? `inset(${(leave * 50).toFixed(2)}% ${(leave * 50).toFixed(2)}% round ${(leave * 50).toFixed(1)}vmax)` : 'inset(0 0)';
      img.style.transform = `scale(${(1.25 - easeIO(push) * 0.17 - hold * 0.04).toFixed(4)})`;
      // the shutter: a blink as the camera lands in the place, the frame goes black then opens on the photograph
      const blink = push > 0.84 && push < 1 ? Math.max(0, 1 - Math.abs((push - 0.92) / 0.08)) : 0;
      sc.style.setProperty('--blink', blink.toFixed(3));
      const words = seg(push, 0.6, 1) * (1 - leave);
      shade.style.opacity = String(0.55 * words);
      say.style.opacity = String(words);
      say.style.transform = `translateY(${((1 - words) * 30).toFixed(2)}px)`;
      cap.style.opacity = String(words);
      sc.classList.toggle('is-held', inPlace);
      if (live && push >= 1 && back < 0.2) viewfinder(byId[LEAD[k.id]] || leadOf(k.list[0].id), true);
      else if (live) viewfinder(null, false);
    }
    if (i !== sceneOn) {
      sceneOn = i;
      document.querySelectorAll('#globe-steps button').forEach((b, j) => b.setAttribute('aria-current', String(j === i)));
    }
  }

  /* ------------------------------------------------ 4. the index */
  function buildIndex() {
    const ol = $('#index');
    // the contact sheet above the list: every country's lead print, dealt as a tilted sheet that tips flat
    const sheet = document.createElement('div');
    sheet.className = 'sheet';
    sheet.setAttribute('aria-hidden', 'true');
    const prints = S.countries.map((c) => leadOf(c.id)).filter(Boolean);
    prints.forEach((p, i) => {
      const f = document.createElement('div');
      f.className = 'sheet__f';
      f.style.setProperty('--i', String(i));
      const img = new Image(p.w, p.h);
      img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
      img.src = D3.src(p, 640);
      f.append(img);
      sheet.append(f);
    });
    $('.cine-index').insertBefore(sheet, $('#index-h'));
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
      const hot = list.querySelector('.ix.is-hot');
      if (hot) hot.classList.remove('is-hot');
      li.classList.add('is-hot');
    });
    list.addEventListener('pointerleave', () => { box.classList.remove('is-on'); list.classList.remove('is-peek'); const hot = list.querySelector('.ix.is-hot'); if (hot) hot.classList.remove('is-hot'); });
  }

  /* ------------------------------------------------ 5. the close */
  function buildClose() {
    const p = byId[CLOSE];
    const b = photo(p, { sizes: COVER });
    b.tabIndex = -1;
    $('#close-photo').append(b);
    const empty = S.continents.filter((k) => !S.countries.some((c) => c.continent === k.id));
    $('#next-track').innerHTML = [0, 1].map(() => `<span>${empty.map((k) => `<b data-w="contU:${k.id}"></b>`).join('')}</span>`).join('');
    const ig = $('#close-ig');
    ig.href = S.instagram.url;
  }

  /* ------------------------------------------------ words */
  function words() {
    document.querySelectorAll('[data-w]').forEach((el) => {
      const [k, a] = el.dataset.w.split(':');
      const c = country[a];
      const cont = S.continents.find((x) => x.id === a);
      const sep = D3.lang === 'zh' ? '、' : ', ';
      const v = {
        cont: () => L(cont), contU: () => (D3.lang === 'zh' ? L(cont) : L(cont).toUpperCase()),
        countsub: () => `${t('countriesN', S.countries.filter((x) => x.continent === a).length)}${D3.lang === 'zh' ? '。' : '. '}${L(SUB[a] || (cont && cont.sub))}`,
        also: () => `${t('alsoStamped')} ${S.countries.filter((x) => x.continent === a && !photosOf(x.id).length).map((x) => `${L(x)} ${entry(x).note}`.trim()).join(sep)}`,
        name: () => L(c), code: () => entry(c).code, when: () => entry(c).note,
        nph: () => (photosOf(a).length ? t('photosN', photosOf(a).length) : t('noPhotos')),
        years: () => [...new Set(c.visits.map((v) => v.when.slice(0, 4)))].join('  ') || t('home'),
        cap: () => { const p = byId[a]; return `${L(p.place)}   ${L(p.where)}`; },
      }[k];
      if (v) el.textContent = v();
    });
    document.querySelectorAll('.scene__word').forEach((w) => { w.style.setProperty('--len', String(Math.max(3, [...w.textContent].length))); });
    sayWords();
    heroWords();
    $('#close-ig').textContent = `@${S.instagram.handle}`;
    $('#close-ig').setAttribute('aria-label', t('follow'));
  }

  /* ------------------------------------------------ motion */
  function motion() {
    gsap.registerPlugin(ScrollTrigger);
    // the hero: its frame sinks as the record comes over it; the top bar hides during the film
    if (!reduce) {
      gsap.to('#hero-frame', { scale: 0.92, opacity: 0.5, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true,
        onLeave: () => { $('#hero-frame').style.visibility = 'hidden'; }, onEnterBack: () => { $('#hero-frame').style.visibility = ''; } } });
      gsap.fromTo('#say .w', { opacity: 0.14 }, { opacity: 1, ease: 'none', stagger: 0.12, scrollTrigger: { trigger: '.cine-say', start: 'top 72%', end: 'bottom 55%', scrub: true } });
    }
    const film = $('#globe-sec');
    const filmST = ScrollTrigger.create({ trigger: film, start: 'top top', end: 'bottom bottom', onUpdate: (s) => filmShow(s.progress),
      onToggle: (s) => { document.body.classList.toggle('is-film', s.isActive); if (!s.isActive) { filmGlobe.alpha = 1; viewfinder(null, false); } } });
    ScrollTrigger.create({ trigger: '#hero', start: 'top top', end: 'bottom 40%', onToggle: (s) => { if (heroPlayed) viewfinder(s.isActive ? hero : null, s.isActive); } });
    ScrollTrigger.create({ trigger: '.film-close', start: 'top 25%', end: 'bottom top', onToggle: (s) => viewfinder(s.isActive ? byId[CLOSE] : null, s.isActive) });
    ScrollTrigger.create({ trigger: '.cine-index', start: 'top 60%', end: 'bottom 25%', onToggle: (s) => { if (s.isActive) viewfinder(null, false); } });
    filmShow(0);
    $('#globe-steps').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      let acc = 0;
      for (let j = 0; j < +b.dataset.i; j++) acc += WEIGHT[j] / total;
      D3.scrollTo(filmST.start + (acc + (0.7 * WEIGHT[+b.dataset.i]) / total) * (filmST.end - filmST.start), { duration: 1.8 });
    });
    // the globes draw only while on screen
    [heroGlobe, filmGlobe].forEach((g) => {
      let running = false, looping = false;
      const loop = (now) => { if (!running) { looping = false; return; } g.draw(now); requestAnimationFrame(loop); };
      new IntersectionObserver(([en]) => { running = en.isIntersecting; if (running && !looping) { looping = true; requestAnimationFrame(loop); } }).observe(g.cv);
    });
    // the close: the photograph settles as it arrives, the marquee runs only on screen
    if (!reduce) {
      gsap.fromTo('#close-photo img', { scale: 1.15, yPercent: -6 }, { scale: 1, yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.film-close', start: 'top bottom', end: 'top top', scrub: true } });
      const run = gsap.to('#next-track', { xPercent: -50, duration: 40, ease: 'none', repeat: -1, paused: true });
      ScrollTrigger.create({ trigger: '.film-close', start: 'top bottom', end: 'bottom top', onToggle: (s) => (s.isActive ? run.play() : run.pause()) });
      gsap.from('.film-close__say > *', { opacity: 0, y: 24, duration: 0.9, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: '.film-close__say', start: 'top 85%', once: true } });
    }
    // the contact sheet tips flat and its rows slide apart as it arrives (rotateX 15°, rotateZ 12°, then rows ±)
    if (!reduce) {
      const sheet = $('.sheet');
      gsap.fromTo(sheet, { rotateX: 16, rotateZ: 11, y: 260, opacity: 0.25 }, { rotateX: 0, rotateZ: 0, y: 0, opacity: 1, ease: 'none',
        scrollTrigger: { trigger: sheet, start: 'top 95%', end: 'top 25%', scrub: 0.4 } });
      [...sheet.children].forEach((f, i) => {
        const row = Math.floor(i / 7), dir = row === 1 ? -1 : 1;
        gsap.fromTo(f, { x: dir * 220 }, { x: 0, ease: 'none', scrollTrigger: { trigger: sheet, start: 'top 95%', end: 'top 20%', scrub: 0.4 } });
      });
    }
    ScrollTrigger.batch('.ix, .ix-cont', { start: 'top 92%', once: true,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out', stagger: 0.04 }) });
    addEventListener('resize', () => { heroGlobe.size(); filmGlobe.size(); });
    document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
    addEventListener('load', () => ScrollTrigger.refresh());
  }

  /* ------------------------------------------------ start */
  buildViewfinder();
  buildHero();
  buildFilm();
  buildIndex();
  buildClose();
  D3.apply();
  words();
  onLang(words);
  heroGlobe.size();
  filmGlobe.size();
  if (window.gsap) motion();
  peek();
  const dotsLoad = loadDots();
  const opening = intro();
  opening.then(() => { heroArrive(); if (!reduce && window.gsap) gsap.from('.bar', { opacity: 0, y: -8, duration: 0.8, ease: 'power3.out' }); });
  dotsLoad.then(() => { heroGlobe.draw(performance.now()); filmGlobe.draw(performance.now()); }).catch(() => { /* the globes stay empty; the scenes still play */ });
})();

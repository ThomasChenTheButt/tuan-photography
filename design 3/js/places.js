/* design 3, the home page: the passport.
   Continents are chapters; every country is a passport stamp (when he went, and how he came in:
   the airport code, or the city when he came overland) beside its photographs. Continents
   without a trip are empty pages. The numbers are worked out from his routes. */
(() => {
  'use strict';
  const { S, photo, t, L, esc, onLang, reduce, country, byId } = D3;
  const $ = (s) => document.querySelector(s);

  window.PAGE = {
    title: { en: 'Places · tuan photography 陳亮元', zh: '地方 · tuan photography 陳亮元' },
    en: {
      heroBy: 'Thomas Chen, landscape photographer', heroA: 'Where', heroB: "I've been",
      heroLede: (n, k) => `Photographs from ${n} countries on ${k} continents, country by country, the way the stamps sit in a passport.`,
      open: 'Open the passport', trips: 'Follow the journeys', all: 'Every photograph', guide: 'The Barcelona guide', numbers: 'In numbers',
      nCountries: 'countries', nContinents: 'continents', nTrips: (y) => `trips since ${y}`, nFlights: 'flights', nKm: 'kilometres flown, roughly',
      countriesN: (n) => (n === 1 ? '1 country' : `${n} countries`),
      seeAll: (n) => (n === 1 ? 'See the photograph' : `See all ${n} photographs`), readGuide: 'Read the Barcelona guide',
      noPhotos: 'No photographs from here on the site yet.', stampedOnly: 'Stamped, not photographed yet',
      byAir: 'by air', byRail: 'by rail', byRoad: 'by road', overland: 'overland', home: 'home', entry: 'entry',
      prev: 'Previous', next: 'Next', blankT: 'Empty pages', blankSay: 'Continents without a stamp yet.', notYet: 'Not yet', closeT: 'Where next?',
      months: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
    },
    zh: {
      heroBy: '陳亮元，風景攝影', heroA: '我去過的', heroB: '地方',
      heroLede: (n, k) => `${n} 個國家、${k} 個大洲的照片，一個國家一頁，像護照裡的印章那樣排著。`,
      open: '翻開護照', trips: '跟著旅程走', all: '所有照片', guide: '巴賽隆納攻略', numbers: '數字',
      nCountries: '個國家', nContinents: '個大洲', nTrips: (y) => `趟旅行，${y} 年至今`, nFlights: '趟航班', nKm: '公里的飛行，約略',
      countriesN: (n) => `${n} 個國家`,
      seeAll: (n) => `看全部 ${n} 張照片`, readGuide: '閱讀巴賽隆納攻略',
      noPhotos: '網站上還沒有這裡的照片。', stampedOnly: '蓋了章，還沒放上照片',
      byAir: '航空', byRail: '鐵路', byRoad: '公路', overland: '陸路', home: '家', entry: '入境',
      prev: '上一個', next: '下一個', blankT: '空白頁', blankSay: '還沒蓋上印章的大洲。', notYet: '還沒去', closeT: '下一站？',
      months: null,
    },
  };

  /* ------------------------------------------------ choices */
  const INK = { asia: '#a8291f', europe: '#2347a8', oceania: '#2f6b3a', 'north-america': '#5b3a8c' };
  const OPEN = { asia: 'peak-night', europe: 'calanque', oceania: 'aoraki', 'north-america': 'lower-manhattan-reflection' };
  const PILE = ['matterhorn-lake', 'golden-gate-fog', 'aurora', 'bunkers', 'fuji-lake'];
  const LAYOUT = ['grid', 'rail', 'pair', 'one'];   // one family per chapter, in chapter order
  const used = new Set([...PILE, ...Object.values(OPEN)]);
  const photosOf = (cid) => S.photos.filter((p) => p.country === cid);
  const fresh = (cid) => { const all = photosOf(cid); const f = all.filter((p) => !used.has(p.id)); return f.length ? f : all; };
  const hash = (s) => [...s].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const lived = S.continents.map((k) => ({ ...k, list: S.countries.filter((c) => c.continent === k.id) }));
  const chapters = lived.filter((k) => k.list.length).sort((a, b) => b.list.length - a.list.length);
  const empty = lived.filter((k) => !k.list.length);

  /* ------------------------------------------------ stamps */
  const MODE = { flight: 'byAir', train: 'byRail', bus: 'byRoad', car: 'byRoad', ground: 'overland', boat: 'overland' };
  function when(v) {
    const [y, m] = v.when.split('-');
    if (!m) return y;
    return D3.lang === 'zh' ? `${y}.${m}` : `${t('months')[+m - 1]} ${y}`;
  }
  /** one stamp; its words are filled by words(), so a change of language keeps the motion */
  function stamp(c, v, i, ink) {
    const h = hash(c.id + i);
    const shape = ['rect', 'circle', 'oval'][h % 3];
    const el = document.createElement('div');
    el.className = `stamp stamp--${shape}`;
    el.style.setProperty('--ink', ink);
    el.style.setProperty('--r', `${(h % 17) - 8}deg`);
    el.dataset.stamp = '';
    el.dataset.cid = c.id;
    el.dataset.v = String(i);
    el.innerHTML = '<span class="stamp__top"></span><span class="stamp__code"></span><span class="stamp__mode"></span><span class="stamp__date"></span>';
    return el;
  }
  function stampWords(el) {
    const c = country[el.dataset.cid];
    const v = c.visits[+el.dataset.v];
    const name = L(c);
    el.querySelector('.stamp__top').textContent = D3.lang === 'zh' ? name : name.toUpperCase();
    const code = el.querySelector('.stamp__code');
    if (!v) {   // home
      code.textContent = 'TPE';
      el.querySelector('.stamp__mode').textContent = t('home');
      el.querySelector('.stamp__date').textContent = '';
      el.setAttribute('aria-label', `${name}, ${t('home')}`);
      return;
    }
    const via = v.via;
    const word = via ? (via.code || L({ en: via.city, zh: via.zh || via.city })) : when(v);
    code.textContent = D3.lang === 'zh' || (via && via.code) ? word : String(word).toUpperCase();
    code.classList.toggle('stamp__code--word', !!via && !via.code);
    code.classList.toggle('stamp__code--year', !via);
    el.querySelector('.stamp__mode').textContent = via ? `${t('entry')} ${t(MODE[via.mode] || 'overland')}` : '';
    el.querySelector('.stamp__date').textContent = via ? when(v) : '';
    el.setAttribute('aria-label', [name, via ? (via.code || via.city) : '', via ? t(MODE[via.mode] || 'overland') : '', when(v)].filter(Boolean).join(', '));
    el.setAttribute('role', 'img');
  }
  function stamps(c, ink) {
    const box = document.createElement('div');
    box.className = 'spread__stamps';
    if (!c.visits.length) box.append(stamp(c, null, 0, ink));
    c.visits.forEach((v, i) => box.append(stamp(c, v, i, ink)));
    return box;
  }

  /* ------------------------------------------------ a country's spread */
  function spread(c, ink, { lead = 1, thumbs = 3, sizes = '(max-width: 52rem) 92vw, 40vw' } = {}) {
    const art = document.createElement('article');
    art.className = 'spread';
    art.id = `c-${c.id}`;
    art.dataset.set = '';
    art.append(stamps(c, ink));
    const head = document.createElement('header');
    head.className = 'spread__head';
    head.innerHTML = `<h3 class="spread__name" data-w="name:${c.id}"></h3><p class="spread__note" data-w="note:${c.id}"></p>`;
    art.append(head);
    const ps = fresh(c.id);
    if (ps.length) {
      const box = document.createElement('div');
      box.className = 'spread__photos';
      ps.slice(0, lead).forEach((p) => { const b = photo(p, { sizes }); b.classList.add('spread__lead'); box.append(b); });
      const row = document.createElement('div');
      row.className = 'spread__thumbs';
      ps.slice(lead, lead + thumbs).forEach((p) => row.append(photo(p, { sizes: '(max-width: 52rem) 30vw, 14vw' })));
      if (row.children.length) box.append(row);
      art.append(box);
    }
    const more = document.createElement('p');
    more.className = 'spread__more';
    const n = photosOf(c.id).length;
    more.innerHTML = (n ? `<a class="link" href="photos.html#place=${c.id}" data-w="see:${c.id}"></a>` : `<span data-w="none"></span>`) +
      (S.guide.country === c.id ? ` <a class="link" href="guides/barcelona.html" data-w="guideLink"></a>` : '');
    art.append(more);
    return art;
  }

  /* ------------------------------------------------ the page */
  function build() {
    // the pile of prints in the hero
    PILE.forEach((id, i) => {
      const p = byId[id];
      if (!p) return;
      const d = document.createElement('div');
      d.className = `pp-print pp-print--${i}`;
      const b = photo(p, { sizes: '(max-width: 52rem) 60vw, 24vw', eager: true });
      b.tabIndex = -1;
      d.append(b);
      $('#pile').append(d);
    });
    const home = document.createElement('div');
    home.className = 'pp-pile__stamp';
    home.append(stamp(country.taiwan, null, 0, '#a8291f'));
    $('#pile').append(home);

    // the numbers, all from the data
    const flights = S.trips.flatMap((x) => x.legs).filter((l) => l.mode === 'flight');
    const R = 6371, rad = Math.PI / 180;
    const km = flights.reduce((a, l) => {
      const [la1, lo1, la2, lo2] = [l.from.lat * rad, l.from.lng * rad, l.to.lat * rad, l.to.lng * rad];
      const h = Math.sin((la2 - la1) / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin((lo2 - lo1) / 2) ** 2;
      return a + 2 * R * Math.asin(Math.sqrt(h));
    }, 0);
    const y0 = Math.min(...S.trips.map((x) => +(x.months[0] || x.id).slice(0, 4)));
    const nums = [[S.countries.length, 'nCountries'], [chapters.length, 'nContinents'], [S.trips.length, 'nTrips', y0], [flights.length, 'nFlights'], [Math.round(km / 1000) * 1000, 'nKm']];
    $('#count').innerHTML = nums.map(([v, k, a]) => `<div><dt class="pp-count__n" data-to="${v}">${v.toLocaleString('en-US')}</dt><dd data-w="num:${k}:${a ?? ''}"></dd></div>`).join('');

    // the chapters
    chapters.forEach((k, ci) => {
      const ink = INK[k.id] || '#2347a8';
      const layout = LAYOUT[ci] || 'grid';
      const sec = document.createElement('section');
      sec.className = `ch ch--${layout}`;
      sec.id = k.id;
      sec.style.setProperty('--stamp-ink', ink);
      sec.setAttribute('aria-labelledby', `h-${k.id}`);
      sec.innerHTML = `<header class="ch__head wrap"><p class="ch__count mono" data-w="count:${k.id}"></p>
        <h2 class="display ch__name" id="h-${k.id}" data-w="cont:${k.id}"></h2><p class="ch__sub" data-w="sub:${k.id}"></p></header>`;
      const op = byId[OPEN[k.id]] || photosOf(k.list[0].id)[0];
      if (op) {
        const f = document.createElement('figure');
        f.className = 'ch__open';
        f.dataset.set = '';
        f.append(photo(op, { sizes: '100vw' }));
        const cap = document.createElement('figcaption');
        cap.className = 'wrap mono';
        cap.dataset.w = `cap:${op.id}`;
        f.append(cap);
        sec.append(f);
      }
      const body = document.createElement('div');
      body.className = 'ch__body wrap';
      const withPh = k.list.filter((c) => photosOf(c.id).length).sort((a, b) => photosOf(b.id).length - photosOf(a.id).length);
      const without = k.list.filter((c) => !photosOf(c.id).length);
      if (layout === 'rail') {
        const rail = document.createElement('div');
        rail.className = 'ch__rail';
        rail.tabIndex = 0;
        withPh.forEach((c) => rail.append(spread(c, ink, { thumbs: 2, sizes: '(max-width: 52rem) 82vw, 34rem' })));
        body.append(rail);
        const ctl = document.createElement('div');
        ctl.className = 'ch__ctl';
        ctl.innerHTML = '<button type="button" class="link" data-rail="-1" data-w="prev"></button><button type="button" class="link" data-rail="1" data-w="next"></button>';
        body.append(ctl);
      } else if (layout === 'one') {
        withPh.forEach((c) => body.append(spread(c, ink, { lead: 1, thumbs: 8, sizes: '(max-width: 52rem) 92vw, 60vw' })));
      } else if (layout === 'pair') {
        withPh.forEach((c) => body.append(spread(c, ink, { thumbs: 3, sizes: '(max-width: 52rem) 92vw, 46vw' })));
      } else {
        withPh.forEach((c) => body.append(spread(c, ink)));
      }
      if (without.length) {
        const s = document.createElement('div');
        s.className = 'ch__stamped';
        s.innerHTML = `<p class="ch__stamped-t" data-w="stamped"></p>`;
        const row = document.createElement('div');
        row.className = 'ch__stamped-row';
        without.forEach((c) => { const w = document.createElement('div'); w.className = 'ch__stamped-one'; w.append(stamps(c, ink)); const n = document.createElement('p'); n.dataset.w = `name:${c.id}`; w.append(n); row.append(w); });
        s.append(row);
        body.append(s);
      }
      sec.append(body);
      $('#chapters').append(sec);
    });

    // empty pages
    $('#blank').innerHTML = empty.map((k) => `<li class="pp-blank__one"><span class="stamp stamp--blank" style="--r:${(hash(k.id) % 9) - 4}deg"><span class="stamp__top" data-w="cont:${k.id}"></span><span class="stamp__code" data-w="notyet"></span></span><p class="mono" data-w="sub:${k.id}"></p></li>`).join('');

    const ig = $('#close-ig');
    ig.href = S.instagram.url;
    ig.textContent = `@${S.instagram.handle}`;
  }

  function words() {
    $('#hero-lede').textContent = t('heroLede', S.countries.length, chapters.length);
    document.querySelectorAll('[data-w]').forEach((el) => {
      const [k, a, b] = el.dataset.w.split(':');
      const c = country[a];
      const v = {
        name: () => L(c), note: () => L(c && c.note) || '', see: () => t('seeAll', photosOf(a).length), none: () => t('noPhotos'), guideLink: () => t('readGuide'),
        num: () => t(a, b ? +b : undefined), count: () => t('countriesN', S.countries.filter((x) => x.continent === a).length),
        cont: () => L(S.continents.find((x) => x.id === a)), sub: () => L(S.continents.find((x) => x.id === a).sub),
        cap: () => `${L(byId[a].place)}  ${L(byId[a].where)}`, stamped: () => t('stampedOnly'), notyet: () => t('notYet'), prev: () => t('prev'), next: () => t('next'),
      }[k];
      if (v) el.textContent = v();
    });
    document.querySelectorAll('[data-stamp]').forEach(stampWords);
  }

  /* ------------------------------------------------ motion */
  function motion() {
    if (!window.gsap) return;
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    if (!reduce) {
      gsap.from('.pp-hero h1 .line-mask > span', { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.09, delay: 0.15 });
      gsap.from(['.pp-hero .cap', '#hero-lede', '.pp-hero__ways'], { opacity: 0, y: 14, duration: 1, ease: 'power3.out', stagger: 0.08, delay: 0.45 });
      // the prints are dealt onto the table, then the home stamp comes down on them
      gsap.from('.pp-print', { opacity: 0, y: -60, rotate: '+=10', scale: 1.06, duration: 0.9, ease: 'power3.out', stagger: 0.11, delay: 0.3 });
      gsap.fromTo('.pp-pile__stamp .stamp', { opacity: 0, scale: 1.8, rotate: 18 }, { opacity: 0.9, scale: 1, rotate: -9, duration: 0.42, ease: 'back.out(2.4)', delay: 1.15, clearProps: 'transform' });
      // a light hand on the pile: the prints part a little toward the pointer
      mm.add('(hover: hover) and (pointer: fine)', () => {
        const pile = $('#pile');
        const prints = [...pile.querySelectorAll('.pp-print')];
        const setters = prints.map((el) => ({ x: gsap.quickTo(el, 'x', { duration: 0.8, ease: 'power3' }), y: gsap.quickTo(el, 'y', { duration: 0.8, ease: 'power3' }) }));
        const move = (e) => {
          const r = pile.getBoundingClientRect();
          const dx = (e.clientX - r.left) / r.width - 0.5, dy = (e.clientY - r.top) / r.height - 0.5;
          setters.forEach((s, i) => { const k = (i - 2) * 9; s.x(dx * k * 1.6); s.y(dy * k); });
        };
        const leave = () => setters.forEach((s) => { s.x(0); s.y(0); });
        pile.addEventListener('pointermove', move);
        pile.addEventListener('pointerleave', leave);
        return () => { pile.removeEventListener('pointermove', move); pile.removeEventListener('pointerleave', leave); };
      });
      // the numbers count up once
      document.querySelectorAll('.pp-count__n').forEach((el) => {
        const to = +el.dataset.to, o = { v: 0 };
        ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true,
          onEnter: () => gsap.to(o, { v: to, duration: 1.4, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(o.v).toLocaleString('en-US'); } }) });
      });
      // each chapter's photograph opens as it arrives, and sits back a little
      document.querySelectorAll('.ch__open .ph').forEach((ph) => {
        gsap.fromTo(ph, { clipPath: 'inset(14% 10% 14% 10%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: ph, start: 'top 95%', end: 'top 25%', scrub: true } });
        gsap.fromTo(ph.querySelector('img'), { scale: 1.2, yPercent: -4 }, { scale: 1, yPercent: 4, ease: 'none', scrollTrigger: { trigger: ph, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
      // stamps come down on the page as they arrive
      ScrollTrigger.batch('.ch [data-stamp], .pp-blank .stamp', {
        start: 'top 88%', once: true,
        onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 1.7, rotate: '+=14' }, { opacity: 0.9, scale: 1, rotate: '-=14', duration: 0.42, ease: 'back.out(2.2)', stagger: 0.09, clearProps: 'transform,opacity' }),
      });
    }
    // the European rail moves by one country at a time from its words
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-rail]');
      if (!b) return;
      const rail = b.closest('.ch__body').querySelector('.ch__rail');
      const one = rail.querySelector('.spread');
      rail.scrollBy({ left: (+b.dataset.rail) * (one ? one.offsetWidth + 24 : rail.clientWidth * 0.8), behavior: reduce ? 'auto' : 'smooth' });
    });
    document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
    addEventListener('load', () => ScrollTrigger.refresh());
  }

  build();
  // spreads and stamps rise in as they arrive (core's entrances)
  document.querySelectorAll('.spread__head, .spread__photos, .spread__more, .ch__head, .pp-count__list > div, .ch__stamped').forEach((el, i) => { el.dataset.in = ''; el.style.setProperty('--d', `${(i % 3) * 70}ms`); });
  D3.apply();
  words();
  onLang(words);
  motion();
  D3.entrances();
})();

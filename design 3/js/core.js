/* design 3: what every page shares. Language, the top bar, smooth scroll, the shutter between
   pages, the photograph viewer, entrances. Pages add their own script after this one. */
(() => {
  'use strict';
  const S = window.SITE;
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const BASE = root.dataset.root || '';

  /* ------------------------------------------------ words, in both languages */
  const W = {
    en: {
      navPlaces: 'Places', navDay: 'One day', navJourneys: 'Journeys', navPhotos: 'Photographs', navGuide: 'Guide', navAbout: 'About', menu: 'Menu', close: 'Close',
      skip: 'Skip to the content',
      night: 'Night', 'blue-am': 'Blue hour', 'blue-pm': 'Blue hour', 'golden-am': 'Golden hour', 'golden-pm': 'Golden hour', day: 'Daylight', undated: 'Time not recorded',
      sunAbove: (d) => `Sun ${d}° above the horizon`, sunBelow: (d) => `Sun ${d}° below the horizon`,
      vTime: 'Local time', vDate: 'Date', vLight: 'Light', vSun: 'Sun', vCamera: 'Camera', vLens: 'Lens', vSettings: 'Settings', vTrip: 'Trip',
      vPrev: 'Previous', vNext: 'Next', vClose: 'Close', vMap: 'Map', vOf: (a, b) => `${a} of ${b}`, vGuide: 'Read the guide',
      mFlight: 'flight', mTrain: 'train', mBus: 'bus', mCar: 'drive', mGround: 'overland', mBoat: 'boat',
      footLine: 'All photographs are my own. Taken between 2024 and 2026.',
      ig: 'Instagram', mail: 'Email',
    },
    zh: {
      navPlaces: '地方', navDay: '一天', navJourneys: '旅程', navPhotos: '作品', navGuide: '攻略', navAbout: '關於', menu: '選單', close: '關閉',
      skip: '跳到內容',
      night: '夜晚', 'blue-am': '藍調時刻', 'blue-pm': '藍調時刻', 'golden-am': '黃金時刻', 'golden-pm': '黃金時刻', day: '白天', undated: '沒有拍攝時間',
      sunAbove: (d) => `太陽在地平線上 ${d}°`, sunBelow: (d) => `太陽在地平線下 ${d}°`,
      vTime: '當地時間', vDate: '日期', vLight: '光線', vSun: '太陽', vCamera: '相機', vLens: '鏡頭', vSettings: '參數', vTrip: '旅程',
      vPrev: '上一張', vNext: '下一張', vClose: '關閉', vMap: '地圖', vOf: (a, b) => `${a} / ${b}`, vGuide: '閱讀攻略',
      mFlight: '飛機', mTrain: '火車', mBus: '巴士', mCar: '開車', mGround: '陸路', mBoat: '船',
      footLine: '網站上每張照片都是我拍的，拍攝於 2024 至 2026 年。',
      ig: 'Instagram', mail: '電子郵件',
    },
  };
  let lang = 'en';
  try { lang = localStorage.getItem('d3-lang') === 'zh' ? 'zh' : 'en'; } catch (e) { /* storage blocked */ }
  const P = () => window.PAGE || { en: {}, zh: {} };
  const t = (k, ...a) => {
    const page = P();
    const v = (page[lang] && page[lang][k]) ?? W[lang][k] ?? W.en[k] ?? (page.en && page.en[k]) ?? '';
    return typeof v === 'function' ? v(...a) : v;
  };
  const L = (pair) => (pair ? (pair[lang] || pair.en) : '');
  const listeners = [];
  function applyLang() {
    root.lang = lang === 'zh' ? 'zh-Hant' : 'en';
    document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = t(el.dataset.t); });
    document.querySelectorAll('[data-t-aria]').forEach((el) => el.setAttribute('aria-label', t(el.dataset.tAria)));
    document.querySelectorAll('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    if (P().title) document.title = L(P().title);
    listeners.forEach((f) => f(lang));
  }
  function setLang(l) {
    lang = l;
    try { localStorage.setItem('d3-lang', l); } catch (e) { /* storage blocked */ }
    applyLang();
  }

  /* ------------------------------------------------ data helpers */
  const byId = Object.fromEntries(S.photos.map((p) => [p.id, p]));
  const country = Object.fromEntries(S.countries.map((c) => [c.id, c]));
  const trip = Object.fromEntries(S.trips.map((x) => [x.id, x]));
  const kind = (p) => (p.light ? p.light.replace(/-(am|pm)$/, '') : 'undated');
  const src = (p, w = 1280) => `${BASE}images/web/${w}/${p.file}`;
  const srcset = (p) => `${BASE}images/web/640/${p.file} 640w, ${BASE}images/web/1280/${p.file} 1280w, ${BASE}images/web/${p.file} ${p.w}w`;
  function sun(p) {
    if (p.sun == null) return '';
    const d = Math.abs(p.sun).toFixed(1);
    return p.sun >= 0 ? t('sunAbove', d) : t('sunBelow', d);
  }
  const settings = (p) => [p.focal, p.aperture, p.shutter, p.iso && `ISO ${p.iso}`].filter(Boolean).join('  ');
  function fmtDate(p) {
    if (!p.date) return '';
    const [y, m, d] = p.date.split('-').map(Number);
    if (lang === 'zh') return `${y} 年 ${m} 月 ${d} 日`;
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  }
  /** a photograph as a button that opens the viewer */
  function photo(p, { sizes = '(max-width: 52rem) 94vw, 50vw', eager = false, cls = '' } = {}) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `ph ${cls}`.trim();
    b.dataset.open = p.id;
    b.style.setProperty('--ar', (p.w / p.h).toFixed(4));
    b.setAttribute('aria-label', L(p.place));
    const img = new Image(p.w, p.h);
    img.alt = L(p.alt);
    img.sizes = sizes;
    img.srcset = srcset(p);
    img.src = src(p);
    img.decoding = 'async';
    if (!eager) { img.loading = 'lazy'; img.dataset.loading = ''; img.addEventListener('load', () => delete img.dataset.loading, { once: true }); }
    b.append(img);
    return b;
  }
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ------------------------------------------------ the top bar */
  /** the five menu items: page id (body data-page), word, address */
  const NAV = [['places', 'navPlaces', 'index.html'], ['journeys', 'navJourneys', 'journeys.html'], ['photos', 'navPhotos', 'photos.html'],
    ['guide', 'navGuide', 'guides/barcelona.html'], ['about', 'navAbout', 'about.html']];
  function bar() {
    const cur = document.body.dataset.page;
    const items = NAV;
    const el = document.createElement('header');
    el.className = 'bar';
    el.innerHTML = `<a class="mark" href="${BASE}index.html">tuan <span>陳亮元</span></a>
      <button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav" data-t="menu">Menu</button>
      <nav class="nav" id="nav" aria-label="Site"><ul>${items.map(([id, k, href]) =>
        `<li><a href="${BASE}${href}" data-t="${k}"${id === cur ? ' aria-current="page"' : ''}></a></li>`).join('')}</ul>
        <div class="lang" role="group" aria-label="Language"><button type="button" data-lang="en" lang="en">EN</button><i></i><button type="button" data-lang="zh" lang="zh-Hant">中文</button></div>
      </nav>`;
    document.body.prepend(el);
    const onScroll = () => el.classList.toggle('is-scrolled', scrollY > 40);
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    const skip = document.createElement('a');
    skip.href = '#main'; skip.className = 'skip'; skip.dataset.t = 'skip';
    document.body.prepend(skip);
    el.querySelectorAll('.lang button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
    const mb = el.querySelector('.menu-btn');
    const nav = el.querySelector('.nav');
    const phone = matchMedia('(max-width: 52rem)');
    const isOpen = () => el.classList.contains('is-open');
    // on a phone the closed menu is out of sight, so its links leave the Tab order too
    const syncInert = () => { nav.inert = phone.matches && !isOpen(); };
    function setMenu(open, { focusBtn = false } = {}) {
      el.classList.toggle('is-open', open);
      mb.setAttribute('aria-expanded', String(open));
      mb.dataset.t = open ? 'close' : 'menu';
      mb.textContent = t(mb.dataset.t);
      if (lenis) open ? lenis.stop() : lenis.start();
      root.classList.toggle('menu-lock', open);
      syncInert();
      if (open) { const first = nav.querySelector('a[href]'); if (first) first.focus({ preventScroll: true }); }
      else if (focusBtn) mb.focus({ preventScroll: true });
    }
    mb.addEventListener('click', () => setMenu(!isOpen()));
    nav.addEventListener('click', (e) => { if (e.target.closest('a[href]') && isOpen()) setMenu(false); });
    el.addEventListener('keydown', (e) => {
      if (!isOpen()) return;
      if (e.key === 'Escape') { e.preventDefault(); setMenu(false, { focusBtn: true }); return; }
      if (e.key === 'Tab') {
        const f = [...el.querySelectorAll('a[href], button')].filter((x) => x.offsetParent !== null || x === mb);
        const i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
    // focus that wanders out of the open menu (a click elsewhere) is brought back
    document.addEventListener('focusin', (e) => { if (isOpen() && !el.contains(e.target) && !viewer.contains(e.target)) mb.focus({ preventScroll: true }); });
    phone.addEventListener('change', () => { if (!phone.matches && isOpen()) setMenu(false); syncInert(); });
    syncInert();
  }

  function footer() {
    const host = document.querySelector('[data-foot]');
    if (!host) return;
    host.className = 'foot wrap';
    host.innerHTML = `<a class="foot__big" href="${S.instagram.url}" target="_blank" rel="noopener">@${S.instagram.handle}</a>
      <div class="foot__small"><p data-t="footLine"></p><ul>
        ${NAV.map(([, k, href]) => `<li><a href="${BASE}${href}" data-t="${k}"></a></li>`).join('')}</ul></div>`;
  }

  /* ------------------------------------------------ smooth scroll */
  let lenis = null;
  function scroll() {
    if (window.gsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    if (reduce || !window.Lenis) return;
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.9, touchMultiplier: 1.2 });
    if (window.ScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || a.getAttribute('href').length < 2) return;
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -80 });
      history.replaceState(null, '', a.getAttribute('href'));
    });
  }
  const scrollTo = (y, opts = {}) => (lenis ? lenis.scrollTo(y, opts) : window.scrollTo({ top: typeof y === 'number' ? y : y.getBoundingClientRect().top + scrollY + (opts.offset || 0), behavior: reduce ? 'auto' : 'smooth' }));

  /* ------------------------------------------------ the shutter between pages */
  /** the name shown on the shutter: by the destination's file name, and by the page's own data-page */
  const PAGE_BY_FILE = { 'index.html': 'navPlaces', 'journeys.html': 'navJourneys', 'photos.html': 'navPhotos', 'barcelona.html': 'navGuide', 'about.html': 'navAbout', 'day.html': 'navDay' };
  const PAGE_BY_ID = { places: 'navPlaces', journeys: 'navJourneys', photos: 'navPhotos', guide: 'navGuide', about: 'navAbout', day: 'navDay' };
  const word = (k) => (k ? (W[lang][k] ?? W.en[k] ?? '') : '');
  function shutter() {
    const v = document.createElement('div');
    v.className = 'veil';
    v.innerHTML = '<span class="veil__t"></span>';
    document.body.append(v);
    let arriving = false;
    try { arriving = sessionStorage.getItem('d3-shutter') === '1'; sessionStorage.removeItem('d3-shutter'); } catch (e) { /* storage blocked */ }
    if (arriving && !reduce) {
      v.style.transition = 'none';
      v.classList.add('is-cover');
      v.querySelector('.veil__t').textContent = word(PAGE_BY_ID[document.body.dataset.page]);
      requestAnimationFrame(() => requestAnimationFrame(() => { v.style.transition = ''; v.classList.remove('is-cover'); v.classList.add('is-leave'); }));
      setTimeout(() => v.classList.remove('is-leave'), 900);
    }
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a || reduce || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || !/\.html$|\/$/.test(url.pathname) || (url.pathname === location.pathname && url.hash)) return;
      e.preventDefault();
      const name = url.pathname.split('/').pop() || 'index.html';
      v.querySelector('.veil__t').textContent = word(PAGE_BY_FILE[name]);
      v.classList.remove('is-leave');
      v.classList.add('is-cover');
      try { sessionStorage.setItem('d3-shutter', '1'); } catch (err) { /* storage blocked */ }
      setTimeout(() => { location.href = url.href; }, 560);
    });
    addEventListener('pageshow', (e) => { if (e.persisted) v.classList.remove('is-cover', 'is-leave'); });
  }

  /* ------------------------------------------------ the viewer */
  let set = [], at = 0, opener = null, shown = 0, inerted = [];
  const viewer = document.createElement('div');
  const full = (p) => `${BASE}images/web/${p.file}`;
  const kept = new Map();   // preloaded neighbours, held so the browser keeps them
  function preload(p) {
    const u = full(p);
    if (kept.has(u)) return;
    const im = new Image(); im.decoding = 'async'; im.src = u;
    kept.set(u, im);
    if (kept.size > 12) kept.delete(kept.keys().next().value);
  }
  /** one candidate in srcset with its true width, and sizes at the full width: the 1280 copy and the
      full file then share the same natural size, so swapping one for the other cannot move anything */
  const sizeAs = (img, p, url, w) => { img.sizes = `${p.w}px`; img.srcset = `${url} ${w}w`; img.src = url; };
  function buildViewer() {
    viewer.className = 'viewer';
    viewer.setAttribute('role', 'dialog');
    viewer.setAttribute('aria-modal', 'true');
    viewer.setAttribute('aria-labelledby', 'v-name');
    viewer.innerHTML = `<div class="viewer__img"><img alt=""></div>
      <div class="viewer__side"><div><h2 id="v-name"></h2><p class="viewer__where"></p></div>
      <dl class="viewer__facts"></dl><p class="viewer__note"></p><p class="viewer__more"></p>
      <div class="viewer__ctl"><button type="button" data-v="prev"></button><button type="button" data-v="next"></button>
      <button type="button" data-v="close"></button><span class="viewer__n mono"></span></div></div>`;
    document.body.append(viewer);
    viewer.addEventListener('click', (e) => {
      const b = e.target.closest('[data-v]');
      if (b) { ({ prev: () => go(-1), next: () => go(1), close: closeViewer })[b.dataset.v](); return; }
      if (e.target === viewer.querySelector('.viewer__img')) closeViewer();
    });
    let x0 = null;
    viewer.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    viewer.addEventListener('touchend', (e) => {
      if (x0 == null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      x0 = null;
    });
    document.addEventListener('keydown', (e) => {
      if (!viewer.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeViewer();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'Tab') {
        const f = [...viewer.querySelectorAll('button, a[href]')];
        const i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-open]');
      if (!b || viewer.contains(b)) return;
      const scope = b.closest('[data-set]') || document;
      const ids = [...scope.querySelectorAll('[data-open]')].filter((x) => !x.closest('[hidden]')).map((x) => x.dataset.open);
      openViewer([...new Set(ids)], b.dataset.open, b);
    });
  }
  function fill() {
    const p = byId[set[at]];
    const img = viewer.querySelector('.viewer__img img');
    const token = ++shown;
    const was = img.dataset.id;
    img.dataset.id = p.id;
    if (was !== p.id) {
      img.classList.add('is-swap');
      const mid = new Image();
      const midUrl = src(p, 1280), midW = Math.min(1280, p.w);
      mid.sizes = `${p.w}px`; mid.srcset = `${midUrl} ${midW}w`; mid.src = midUrl;
      const big = new Image();
      big.src = full(p);
      const showMid = () => {
        if (token !== shown) return;
        sizeAs(img, p, midUrl, midW); img.alt = L(p.alt); img.classList.remove('is-swap');
        const swap = () => { if (token === shown) sizeAs(img, p, big.src, p.w); };
        big.decode ? big.decode().then(swap, () => {}) : (big.onload = swap);
      };
      mid.decode ? mid.decode().then(showMid, showMid) : (mid.onload = showMid);
      if (set.length > 1) { preload(byId[set[(at + 1) % set.length]]); preload(byId[set[(at - 1 + set.length) % set.length]]); }
    } else img.alt = L(p.alt);
    viewer.querySelector('#v-name').textContent = L(p.place);
    viewer.querySelector('.viewer__where').textContent = L(p.where);
    const rows = [
      [t('vTime'), p.time || t('undated')], [t('vDate'), fmtDate(p)],
      [t('vLight'), p.light ? t(p.light) : ''], [t('vSun'), sun(p)],
      [t('vCamera'), p.camera], [t('vLens'), p.lens], [t('vSettings'), settings(p)],
      [t('vTrip'), p.trip ? L(trip[p.trip].label) : ''],
    ].filter(([, v]) => v);
    viewer.querySelector('.viewer__facts').innerHTML = rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('');
    viewer.querySelector('.viewer__note').textContent = L(p.note);
    const more = [];
    if (p.guide) more.push(`<a class="link" href="${BASE}guides/barcelona.html">${esc(t('vGuide'))}</a>`);
    if (p.map) more.push(`<a class="link" href="${esc(p.map)}" target="_blank" rel="noopener">${esc(t('vMap'))}</a>`);
    viewer.querySelector('.viewer__more').innerHTML = more.join('&nbsp;&nbsp;&nbsp;');
    viewer.querySelector('[data-v="prev"]').textContent = t('vPrev');
    viewer.querySelector('[data-v="next"]').textContent = t('vNext');
    viewer.querySelector('[data-v="close"]').textContent = t('vClose');
    viewer.querySelector('.viewer__n').textContent = t('vOf', at + 1, set.length);
    viewer.querySelector('[data-v="prev"]').hidden = viewer.querySelector('[data-v="next"]').hidden = set.length < 2;
  }
  function openViewer(ids, id, from) {
    set = ids; at = Math.max(0, ids.indexOf(id)); opener = from || document.activeElement;
    fill();
    viewer.classList.add('is-open');
    if (lenis) lenis.stop();
    document.body.style.overflow = 'hidden';
    inerted = [...document.body.children].filter((c) => c !== viewer && !c.inert);
    inerted.forEach((c) => { c.inert = true; });
    viewer.querySelector('[data-v="close"]').focus({ preventScroll: true });
  }
  function closeViewer() {
    viewer.classList.remove('is-open');
    inerted.forEach((c) => { c.inert = false; });
    inerted = [];
    if (lenis && !document.querySelector('.bar.is-open')) lenis.start();
    document.body.style.overflow = '';
    if (opener) opener.focus({ preventScroll: true });
  }
  function go(d) { at = (at + d + set.length) % set.length; fill(); }

  /* ------------------------------------------------ entrances */
  function entrances() {
    const els = document.querySelectorAll('[data-in]:not(.is-in)');
    if (reduce) { els.forEach((el) => el.classList.add('is-in')); return; }
    if (window.ScrollTrigger) {   // a jump past an element still counts as passing it
      els.forEach((el) => ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => el.classList.add('is-in') }));
      return;
    }
    if (!('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('is-in')); return; }
    const io = new IntersectionObserver((list) => list.forEach((en) => {
      if (en.isIntersecting || en.boundingClientRect.top < 0) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach((el) => io.observe(el));
  }

  window.D3 = { S, byId, country, trip, kind, src, srcset, photo, sun, settings, fmtDate, esc, L, t, entrances, reduce,
    get lang() { return lang; }, onLang: (f) => listeners.push(f), apply: () => applyLang(), scrollTo, get lenis() { return lenis; }, open: openViewer };

  bar();
  footer();
  buildViewer();
  scroll();
  shutter();
  applyLang();
  if (!document.body.dataset.ownEntrances) entrances();
})();

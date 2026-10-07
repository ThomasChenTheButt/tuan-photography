/* Journey — the behaviour.
   His twenty books stand on one line that recedes up and to the right,
   oldest journey farthest away, the newest at the front. Scrolling or
   dragging pulls the line toward you: the front book slides off past the
   camera, bottom-left, and the next one takes its place. The line loops:
   past Taiwan, the newest book comes round again, so it never ends. The label at the
   bottom left names whichever book is at the front, or the one under the
   cursor. A click on a book farther back brings it to the front; a click
   on the front book opens it. Only the books move; nothing is written on
   a cover. */
(function () {
  'use strict';

  const SITE = window.SITE;
  const stage = document.getElementById('stage');
  const line = document.getElementById('line');
  const label = document.getElementById('label');
  const labDate = document.getElementById('lab-date');
  const labPlace = document.getElementById('lab-place');
  const labNote = document.getElementById('lab-note');
  const labCount = document.getElementById('lab-count');
  const labPos = document.getElementById('lab-pos');
  const labOpen = document.getElementById('lab-open');
  const langBtn = document.getElementById('lang');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SITE1 = 'http://localhost:8642/';          // design 1, where the pages are

  const i18n = {
    en: { title: 'Journey', other: '中文',
          lead: 'Every place I have been, as a book on one long line. The newest is nearest; the line runs back into the years.',
          hint: 'Scroll or drag to travel. Click a book to open it.',
          home: 'Home', guide: 'Open the guide', photos: 'See the photographs', soon: 'Photographs to come',
          photo: (n) => n === 1 ? '1 photograph' : n + ' photographs',
          pos: (i, n) => i + ' of ' + n },
    zh: { title: '旅程', other: 'EN',
          lead: '去過的每個地方都是一本書，排成一條長長的線。最新的一本離你最近，往後就是一年一年的從前。',
          hint: '捲動或拖曳就能前進。點一本書把它打開。',
          home: '家', guide: '打開攻略', photos: '看照片', soon: '照片待補',
          photo: (n) => n + ' 張照片',
          pos: (i, n) => '第 ' + i + ' 本，共 ' + n + ' 本' },
  };
  let lang = location.search.includes('zh') ? 'zh' : 'en';

  /* ---- the order: each book at the journey that took him there, oldest first; Taiwan is home and starts the line ---- */
  const journeys = SITE.journeys.slice().sort((a, b) => a.id < b.id ? -1 : 1);   // ids begin with the year
  const books = SITE.books.map((b) => {
    const trips = journeys.filter((j) => j.countries.includes(b.country));
    const trip = trips[trips.length - 1] || null;                                  // the latest visit
    const date = trip ? trip.date : (b.country === 'taiwan' ? { en: i18n.en.home, zh: i18n.zh.home } : { en: '', zh: '' });
    const country = SITE.countries.find((c) => c.id === b.country) || null;
    const own = Object.keys(SITE.slides).filter((id) => {
      const s = SITE.slides[id];
      return s.country === b.country && (b.place ? s.city === b.place : true);
    });
    const coverId = b.cover || b.photo || own[0] || null;
    const cover = coverId ? SITE.slides[coverId] : null;
    // the key puts the book at its journey, and within a journey in the order the route visited the countries
    const leg = trip ? String(trip.countries.indexOf(b.country)).padStart(2, '0') : '00';
    return { b, trip, date, country, own, cover,
             key: (trip ? trip.id : (b.country === 'taiwan' ? '0000' : '9999')) + '-' + leg };
  });
  books.sort((x, y) => x.key < y.key ? -1 : x.key > y.key ? 1 : 0);
  const n = books.length;

  /* ---- the books on the stage ---- */
  books.forEach((bk, i) => {
    const el = document.createElement('figure');
    el.className = 'book';
    el.style.setProperty('--tone', 'var(--' + (bk.b.tone || 'clay') + ')');
    el.dataset.i = i;
    if (bk.cover) {
      const img = document.createElement('img');
      img.src = '../images/web/' + (innerWidth > 700 ? '1280/' : '640/') + bk.cover.file;
      img.alt = bk.cover.alt ? bk.cover.alt.en : '';
      img.decoding = 'async';
      el.appendChild(img);
      bk.ar = bk.cover.w / bk.cover.h;
    } else {
      el.classList.add('blank');
      const s = document.createElement('span');
      s.textContent = bk.b.title.en;
      el.appendChild(s);
      bk.ar = 3 / 2;
    }
    el.setAttribute('aria-label', bk.b.title.en);
    bk.el = el;
    line.appendChild(el);
  });

  /* ---- the camera: where the line runs, and how far apart the books stand ---- */
  let W = 0, H = 0, sx = 0, sy = 0, sz = 0, baseH = 0;
  function layout() {
    W = innerWidth; H = innerHeight;
    baseH = W > 700 ? Math.min(H * 0.46, W * 0.36) : W * 0.5;   // the front book's height; on a phone the width decides
    sx = W * 0.15;                                  // each step back: right,
    sy = H * 0.125;                                 // up,
    sz = Math.max(120, Math.min(220, W * 0.12));    // and away
    books.forEach((bk) => {
      const h = bk.ar >= 1 ? baseH : baseH * 0.92;
      const w = Math.min(h * bk.ar, W * 0.56);
      bk.w = w; bk.h = bk.ar >= 1 ? h : w / bk.ar;
      bk.el.style.setProperty('--w', bk.w + 'px');
      bk.el.style.setProperty('--h', bk.h + 'px');
    });
  }

  /* ---- the position on the line, eased; the cursor's small push on the whole line ---- */
  let pos = n - 1, target = n - 1;                   // index of the book at the front
  let px = 0, py = 0, tpx = 0, tpy = 0;              // parallax
  let hovered = null, shown = -1, shownLang = '';
  let armed = false, lastX = -1, lastY = -1;         // hover counts only once the cursor has moved after a move of the line

  function clampTarget() { /* the line loops, so nothing to clamp */ }
  const wrap = (i) => ((i % n) + n) % n;         // a book's index on the loop

  function place() {
    for (let i = 0; i < n; i++) {
      const bk = books[i];
      let k = wrap(pos - i);                         // 0 at the front, growing with distance, round the loop
      if (k > n - 1.6) k -= n;                       // the book just passed sits in front of the camera
      if (k < -1.1 || k > 13) { bk.el.classList.add('hidden'); continue; }
      bk.el.classList.remove('hidden');
      const x = k * sx, y = -k * sy, z = -k * sz;
      let o = 1;
      if (k < 0) o = Math.max(0, 1 + k / 0.85);      // sliding past the camera
      if (k > 9) o = Math.max(0, 1 - (k - 9) / 4);   // fading into the distance
      bk.el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,' + z.toFixed(1) + 'px) rotateY(-22deg) rotateZ(2.5deg)';
      bk.el.style.opacity = o.toFixed(3);
      bk.el.classList.toggle('front', wrap(Math.round(pos)) === i);
    }
    line.style.transform = 'rotateY(' + (px * 3).toFixed(2) + 'deg) rotateX(' + (-py * 2).toFixed(2) + 'deg)';
  }

  /* ---- the label ---- */
  function describe(i) {
    const bk = books[i], t = i18n[lang];
    labDate.textContent = bk.date[lang] || '';
    labPlace.textContent = bk.b.title[lang];
    labNote.textContent = (!bk.b.place && bk.country && bk.country.note) ? bk.country.note[lang] : '';
    labCount.textContent = bk.own.length ? t.photo(bk.own.length) : t.soon;
    labPos.textContent = t.pos(n - i, n);
    if (bk.b.guide) { labOpen.textContent = t.guide; labOpen.href = SITE1 + 'posts/' + bk.b.guide + '.html'; }
    else if (bk.own.length) { labOpen.textContent = t.photos; labOpen.href = SITE1 + 'countries/' + bk.b.country + '.html'; }
    else { labOpen.textContent = ''; labOpen.removeAttribute('href'); }
  }
  function updateLabel() {
    const i = hovered !== null ? hovered : wrap(Math.round(pos));
    if (i === shown && lang === shownLang) return;
    shown = i; shownLang = lang;
    if (reduce) { describe(i); return; }
    label.classList.add('swap');
    setTimeout(() => { describe(i); label.classList.remove('swap'); }, 130);
  }
  function linkFor(i) { const bk = books[i]; return bk.b.guide ? SITE1 + 'posts/' + bk.b.guide + '.html' : bk.own.length ? SITE1 + 'countries/' + bk.b.country + '.html' : null; }

  /* ---- scroll, drag, keys ---- */
  let settle = 0;
  stage.addEventListener('wheel', (e) => {
    e.preventDefault();
    const d = e.deltaMode === 1 ? e.deltaY * 18 : e.deltaMode === 2 ? e.deltaY * H : e.deltaY;
    target -= d / 240;
    hovered = null; armed = false;
    clampTarget();
    clearTimeout(settle);
    settle = setTimeout(() => { target = Math.round(target); clampTarget(); }, 160);   // settle on a book
  }, { passive: false });

  let drag = null;
  stage.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const book = e.target.closest ? e.target.closest('.book') : null;
    drag = { x: e.clientX, y: e.clientY, moved: 0, start: target, book: book ? +book.dataset.i : null };
    hovered = null; armed = false;                   // the label follows the front until the cursor moves again
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse') { tpx = e.clientX / W * 2 - 1; tpy = e.clientY / H * 2 - 1; }
    if (Math.abs(e.clientX - lastX) + Math.abs(e.clientY - lastY) > 4) { lastX = e.clientX; lastY = e.clientY; if (!drag) armed = true; }
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.moved = Math.max(drag.moved, Math.abs(dx) + Math.abs(dy));
    if (drag.moved > 6) stage.classList.add('dragging');
    target = drag.start - (dy - dx) / (W * 0.32);   // pull down-left along the line: the past comes to you
    clampTarget();
  });
  function endDrag(e) {
    if (!drag) return;
    const was = drag; drag = null;
    stage.classList.remove('dragging');
    if (was.moved > 6) { target = Math.round(target); clampTarget(); return; }   // settle on a book
    if (was.book === null) return;
    const i = was.book;
    if (wrap(Math.round(target)) === i && Math.abs(pos - target) < 0.2) {
      const href = linkFor(i);
      if (href) location.href = href;
    } else {
      // bring it forward along the shorter way round
      const fwd = wrap(target - i);                  // how far back it stands
      target = fwd <= n / 2 ? target - fwd : target + (n - fwd);
    }
  }
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', () => { drag = null; stage.classList.remove('dragging'); });
  stage.addEventListener('pointerleave', () => { tpx = 0; tpy = 0; });

  stage.addEventListener('pointerover', (e) => {
    if (drag || !armed) return;
    const book = e.target.closest ? e.target.closest('.book') : null;
    hovered = book ? +book.dataset.i : null;
  });
  stage.addEventListener('pointerout', (e) => {
    const book = e.target.closest ? e.target.closest('.book') : null;
    if (book && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.book'))) hovered = null;
  });

  addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'PageDown') { target = Math.round(target) - 1; }
    else if (e.key === 'ArrowUp' || e.key === 'ArrowRight' || e.key === 'PageUp') { target = Math.round(target) + 1; }
    else if (e.key === 'Home') target = Math.round(target) - wrap(Math.round(target) - (n - 1));
    else if (e.key === 'End') target = Math.round(target) - wrap(Math.round(target));
    else if (e.key === 'Enter') { const href = linkFor(wrap(Math.round(pos))); if (href) location.href = href; return; }
    else return;
    e.preventDefault(); hovered = null; armed = false; clampTarget();
  });

  /* ---- language ---- */
  function applyLang() {
    document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en';
    document.documentElement.setAttribute('lang', lang === 'zh' ? 'zh' : 'en');
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = i18n[lang][el.dataset.i18n]; });
    langBtn.textContent = i18n[lang].other;
    document.title = (lang === 'zh' ? '旅程' : 'Journey') + ' · a test';
    history.replaceState(null, '', lang === 'zh' ? '?zh' : location.pathname);
    updateLabel();
  }
  langBtn.addEventListener('click', () => { lang = lang === 'zh' ? 'en' : 'zh'; applyLang(); });

  /* ---- the frame ---- */
  const ease = reduce ? 1 : 0.09;
  function frame() {
    pos += (target - pos) * ease;
    if (Math.abs(target - pos) < 0.0005) pos = target;
    px += (tpx - px) * (reduce ? 1 : 0.06);
    py += (tpy - py) * (reduce ? 1 : 0.06);
    place();
    updateLabel();
    requestAnimationFrame(frame);
  }

  addEventListener('resize', () => { layout(); place(); });
  layout();
  applyLang();
  place();
  requestAnimationFrame(frame);
})();

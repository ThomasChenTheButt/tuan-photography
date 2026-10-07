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

  /* ---- one book per country, at the journey that took him there, oldest first; Taiwan is home and starts the line ---- */
  const journeys = SITE.journeys.slice().sort((a, b) => a.id < b.id ? -1 : 1);   // ids begin with the year
  const tones = ['clay', 'olive', 'slate'];
  const books = SITE.countries.map((c, idx) => {
    const trips = journeys.filter((j) => j.countries.includes(c.id));
    const trip = trips[trips.length - 1] || null;                                  // the latest visit
    const home = c.id === 'taiwan';
    const date = trip ? trip.date : (home ? { en: i18n.en.home, zh: i18n.zh.home } : { en: '', zh: '' });
    const shelf = SITE.books.filter((b) => b.country === c.id);
    const book = shelf.find((b) => !b.place) || shelf[0] || null;                  // the country's own book, else its first city
    const guide = (shelf.find((b) => b.guide) || {}).guide || null;
    const own = c.photos || [];
    const coverId = (book && (book.cover || book.photo)) || own[0] || null;
    const cover = coverId ? SITE.slides[coverId] : null;
    // the key puts the book at its journey, and within a journey in the order the route visited the countries
    const leg = trip ? String(trip.countries.indexOf(c.id)).padStart(2, '0') : '00';
    return { c, trip, date, own, cover, guide, title: c.name,
             tone: (book && book.tone) || tones[idx % 3],
             visits: trips.length,
             key: (trip ? trip.id : (home ? '0000' : '9999')) + '-' + leg };
  });
  books.sort((x, y) => x.key < y.key ? -1 : x.key > y.key ? 1 : 0);
  const n = books.length;

  /* ---- the books on the stage: a cover, a tag with the time of the journey, and the four edges ---- */
  books.forEach((bk, i) => {
    const el = document.createElement('figure');
    el.className = 'book';
    el.style.setProperty('--tone', 'var(--' + bk.tone + ')');
    el.dataset.i = i;
    if (bk.cover) {
      const img = document.createElement('img');
      img.src = '../images/web/' + (innerWidth > 700 ? '1280/' : '640/') + bk.cover.file;
      img.alt = bk.cover.alt ? bk.cover.alt.en : '';
      img.decoding = 'async';
      el.appendChild(img);
    } else {
      el.classList.add('blank');
      const paper = document.createElement('div'); paper.className = 'cover'; el.appendChild(paper);
      const s = document.createElement('span');
      s.className = 'name';
      s.textContent = bk.title.en;
      s.dataset.i18nTitle = i;
      el.appendChild(s);
    }
    const tag = document.createElement('span');
    tag.className = 'tag';
    bk.tag = tag;
    el.appendChild(tag);
    ['spine', 'pages-t', 'pages-b', 'pages-r'].forEach((f) => { const d = document.createElement('div'); d.className = 'face ' + f; el.appendChild(d); });
    el.setAttribute('aria-label', bk.title.en);
    bk.el = el;
    line.appendChild(el);
  });

  /* ---- the camera: where the line runs, and how close the books stand ---- */
  let W = 0, H = 0, sx = 0, sy = 0, sz = 0;
  const AR = 3 / 4;                                 // a guidebook's cover
  function layout() {
    W = innerWidth; H = innerHeight;
    const h = W > 700 ? Math.min(H * 0.6, W * 0.42) : Math.min(H * 0.5, W * 0.78 / AR);   // the front book's height; on a phone the width decides
    const w = h * AR;
    sx = w * 0.3;                                   // each step back: right,
    sy = H * 0.04;                                  // up,
    sz = Math.max(70, Math.min(120, W * 0.07));     // and away, close enough to read as a stack
    books.forEach((bk) => {
      bk.w = w; bk.h = h;
      bk.el.style.setProperty('--w', w + 'px');
      bk.el.style.setProperty('--h', h + 'px');
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
      if (k < -0.9 || k > 13) { bk.el.classList.add('hidden'); continue; }
      bk.el.classList.remove('hidden');
      const x = k * sx, y = -k * sy, z = -k * sz;
      let o = 1;
      if (k < 0) o = Math.max(0, 1 + k / 0.85);      // sliding past the camera
      if (k > 9) o = Math.max(0, 1 - (k - 9) / 4);   // fading into the distance
      bk.el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,' + z.toFixed(1) + 'px) rotateY(-26deg) rotateZ(2.5deg)';
      bk.el.style.setProperty('--o', o.toFixed(3));
      bk.el.style.pointerEvents = k < -0.05 || o <= 0 ? 'none' : '';   // a book passing the camera takes no clicks
      bk.el.classList.toggle('front', wrap(Math.round(pos)) === i);
    }
    line.style.transform = 'rotateY(' + (px * 3).toFixed(2) + 'deg) rotateX(' + (-12 - py * 2).toFixed(2) + 'deg)';   // seen a little from above, so the top edge shows
  }

  /* ---- the label ---- */
  function describe(i) {
    const bk = books[i], t = i18n[lang];
    labDate.textContent = bk.visits > 1 ? (bk.c.date ? bk.c.date[lang] : bk.date[lang]) : (bk.date[lang] || '');
    labPlace.textContent = bk.title[lang];
    labNote.textContent = bk.c.note ? bk.c.note[lang] : '';
    labCount.textContent = bk.own.length ? t.photo(bk.own.length) : t.soon;
    labPos.textContent = t.pos(n - i, n);
    if (bk.guide) { labOpen.textContent = t.guide; labOpen.href = SITE1 + 'posts/' + bk.guide + '.html'; }
    else if (bk.own.length) { labOpen.textContent = t.photos; labOpen.href = SITE1 + 'countries/' + bk.c.id + '.html'; }
    else { labOpen.textContent = ''; labOpen.removeAttribute('href'); }
  }
  const hasHover = matchMedia('(hover: hover)').matches;
  let lx = 0, ly = 0;                                // where the label is, eased toward the cursor
  function updateLabel() {
    // with a cursor the label names the book under it and hides over bare paper;
    // without one it names the book at the front
    const i = hasHover ? hovered : wrap(Math.round(pos));
    label.classList.toggle('on', i !== null);
    if (i === null || (i === shown && lang === shownLang)) return;
    shown = i; shownLang = lang;
    describe(i);
  }
  function moveLabel() {
    if (!hasHover) return;
    lx += (lastX + 18 - lx) * (reduce ? 1 : 0.22);
    ly += (lastY + 20 - ly) * (reduce ? 1 : 0.22);
    // keep it on the screen
    const r = label.getBoundingClientRect();
    const x = Math.min(lx, W - r.width - 8), y = Math.min(ly, H - r.height - 8);
    label.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
  }
  function linkFor(i) { const bk = books[i]; return bk.guide ? SITE1 + 'posts/' + bk.guide + '.html' : bk.own.length ? SITE1 + 'countries/' + bk.c.id + '.html' : null; }

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
    if (!drag) {
      if (!armed) return;
      const book = e.target.closest ? e.target.closest('.book') : null;
      hovered = book ? +book.dataset.i : null;
      return;
    }
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
  stage.addEventListener('pointerleave', () => { tpx = 0; tpy = 0; hovered = null; });


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
    books.forEach((bk) => { bk.tag.textContent = bk.date[lang]; });
    document.querySelectorAll('[data-i18n-title]').forEach((el) => { el.textContent = books[+el.dataset.i18nTitle].title[lang]; });
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
    moveLabel();
    requestAnimationFrame(frame);
  }

  addEventListener('resize', () => { layout(); place(); });
  layout();
  applyLang();
  place();
  requestAnimationFrame(frame);
})();

/* Journey — the behaviour.
   One book per country stands on a line that climbs from the bottom left of
   the page to the top right, the newest large at the front, every older one a
   step up, right and back, all turned a little away. Scrolling or dragging pulls
   the line toward you: the front book slides off past the camera and the next
   takes its place; past Taiwan the newest comes round again. The book under
   the cursor turns to face you, and the words under the title name it: when,
   where, what it holds. A click opens it. Nothing is written on a cover. */
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
          bandGuide: "A photographer's guide", bandPhotos: 'Photographs', bandNone: 'No photographs yet', veil: 'Background',
          photo: (n) => n === 1 ? '1 photograph' : n + ' photographs',
          pos: (i, n) => i + ' of ' + n },
    zh: { title: '旅程', other: 'EN',
          lead: '去過的每個地方都是一本書，排成一條長長的線。最新的一本離你最近，往後就是一年一年的從前。',
          hint: '捲動或拖曳就能前進。點一本書把它打開。',
          home: '家', guide: '打開攻略', photos: '看照片', soon: '照片待補',
          bandGuide: '攝影師的攻略', bandPhotos: '作品', bandNone: '還沒有照片', veil: '背景',
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

  /* ---- the books on the stage: design 1's guidebook, with a torn tag carrying the time of the journey ---- */
  const series = 'tuan photography';
  books.forEach((bk, i) => {
    const el = document.createElement('figure');
    el.className = 'book';
    el.style.setProperty('--tone', 'var(--' + bk.tone + ')');
    el.dataset.i = i;
    const box = document.createElement('span'); box.className = 'book__box';
    const spine = document.createElement('span'); spine.className = 'book__spine';
    spine.innerHTML = '<b></b><i></i>';
    spine.lastChild.textContent = series;
    bk.spineName = spine.firstChild;
    const face = document.createElement('span'); face.className = 'book__face';
    if (bk.cover) {
      const img = document.createElement('img');
      img.src = '../images/web/' + (innerWidth > 700 ? '1280/' : '640/') + bk.cover.file;
      img.alt = bk.cover.alt ? bk.cover.alt.en : '';
      img.decoding = 'async';
      face.appendChild(img);
    } else {
      face.classList.add('book__face--blank');
    }
    const band = document.createElement('span'); band.className = 'book__band';
    band.innerHTML = '<b></b><span></span>';
    bk.bandName = band.firstChild; bk.bandWhat = band.lastChild;
    ['book__edge', 'book__top', 'book__bottom'].forEach((c) => { const d = document.createElement('span'); d.className = c; box.appendChild(d); });
    box.append(spine, face, band);
    face.appendChild(band);
    el.appendChild(box);
    el.setAttribute('aria-label', bk.title.en);
    bk.el = el; bk.lift = 0;
    line.appendChild(el);
  });

  /* ---- the camera: where the line runs, how large the front book stands ---- */
  let W = 0, H = 0, sx = 0, sy = 0, sz = 0, lift = 0;
  const AR = 4 / 3;                                 // a landscape album, the shape of the photographs
  const TURN = -30, TILT = 10;                      // every book turned away to the left and seen from below, as in Morph
  function layout() {
    W = innerWidth; H = innerHeight;
    const w = W > 700 ? Math.min(W * 0.5, H * 0.8 * AR) : W * 0.86;   // the book at the middle: half the page wide
    const h = w / AR;
    sx = W > 700 ? W * 0.14 : W * 0.22;             // each step back: right,
    sy = H * 0.12;                                  // up,
    sz = Math.max(50, Math.min(90, W * 0.055));     // and away
    lift = sz * 1.2;                                // how far the book in hand comes toward you
    books.forEach((bk) => {
      bk.w = w; bk.h = h;
      bk.el.style.setProperty('--w', w + 'px');
      bk.el.style.setProperty('--h', h + 'px');
    });
  }

  /* ---- the position on the line, eased; the cursor's small push on the whole line ---- */
  let pos = n - 3, target = n - 3;                   // index of the book at the middle; the two newest stand nearer, bottom left
  let px = 0, py = 0, tpx = 0, tpy = 0;              // parallax
  let hovered = null, shown = -1, shownLang = '';
  let armed = false, lastX = -1, lastY = -1;         // hover counts only once the cursor has moved after a move of the line

  function clampTarget() { /* the line loops, so nothing to clamp */ }
  const wrap = (i) => ((i % n) + n) % n;         // a book's index on the loop

  function place() {
    for (let i = 0; i < n; i++) {
      const bk = books[i];
      let k = wrap(pos - i);                         // 0 at the front, growing with distance, round the loop
      if (k > n - 3) k -= n;                         // the two books just passed stand nearer than the middle
      const up = hovered === i ? 1 : 0;
      bk.lift += (up - bk.lift) * (reduce ? 1 : 0.14);
      if (k < -2.6 || k > FAR) { bk.el.classList.add('hidden'); bk.lift = 0; continue; }   // two books nearer than the middle still show, sliding off bottom-left
      bk.el.classList.remove('hidden');
      const a = arrival(i, k);                       // the opening: each book still on its way down the line
      const kk = k + a * ARRIVE;
      const x = kk * sx, y = -kk * sy, z = -kk * sz + bk.lift * (k * sz + lift);   // in hand it comes nearer than every other book
      const ry = TURN * (1 - bk.lift), rx = TILT * (1 - bk.lift);   // in hand it turns to face you
      bk.el.style.opacity = a > 0 ? (1 - a).toFixed(3) : '';
      bk.el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,' + z.toFixed(1) + 'px) rotateY(' + ry.toFixed(2) + 'deg) rotateX(' + rx.toFixed(2) + 'deg)';
      bk.el.style.zIndex = up ? 1000 : Math.round((n - k) * 10);          // painted nearest last; the book in hand over everything
    }
    line.style.transform = 'rotateY(' + (px * 2).toFixed(2) + 'deg) rotateX(' + (-py * 1.5).toFixed(2) + 'deg)';
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
  function updateLabel() {
    // the book under the cursor, else the one at the front
    const i = hovered !== null ? hovered : wrap(Math.round(pos));
    label.classList.add('on');
    if (i === shown && lang === shownLang) return;
    shown = i; shownLang = lang;
    describe(i);
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
      const i = book ? +book.dataset.i : null;
      if (i !== null && i !== hovered) {              // the book under the cursor glides to the middle, the shorter way round
        const r = Math.round(target);
        let k = wrap(r - i); if (k > n / 2) k -= n;
        target = r - k;
      }
      hovered = i;
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
    const href = linkFor(i);
    if (href) { location.href = href; return; }
    const r = Math.round(target); let k = wrap(r - i); if (k > n / 2) k -= n;
    target = r - k;                                  // nothing to open: bring it to the middle instead
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
    books.forEach((bk) => {
      bk.spineName.textContent = bk.title[lang];
      bk.bandName.textContent = bk.title[lang];
      bk.bandWhat.textContent = i18n[lang][bk.guide ? 'bandGuide' : bk.own.length ? 'bandPhotos' : 'bandNone'];
    });
    document.title = (lang === 'zh' ? '旅程' : 'Journey') + ' · a test';
    history.replaceState(null, '', lang === 'zh' ? '?zh' : location.pathname);
    updateLabel();
  }
  langBtn.addEventListener('click', () => { lang = lang === 'zh' ? 'en' : 'zh'; applyLang(); });

  /* ---- the backdrop: the front book's photograph, crossfading as the front changes; the bar sets its strength ---- */
  const backs = document.querySelectorAll('#backdrop img');
  const veilIn = document.getElementById('veil'), veilOut = document.getElementById('veil-out');
  let backOn = 0, backShown = -1;
  function updateBackdrop() {
    const i = hovered !== null ? hovered : wrap(Math.round(pos));   // the book in hand, else the one at the middle
    if (i === backShown) return;
    const bk = books[i];
    if (!bk.cover) return;                           // a book without a photograph keeps the last one behind it
    backShown = i;
    backOn = 1 - backOn;
    const img = backs[backOn];
    img.src = '../images/web/' + (innerWidth > 700 ? '1280/' : '640/') + bk.cover.file;
    backs[backOn].classList.add('on');
    backs[1 - backOn].classList.remove('on');
  }
  function setVeil() {
    const v = +veilIn.value;
    document.documentElement.style.setProperty('--veil', (v / 100).toFixed(2));
    veilOut.textContent = v + '%';
    try { localStorage.setItem('journey-veil', v); } catch (e) {}
  }
  try { const v = localStorage.getItem('journey-veil'); if (v !== null) veilIn.value = v; } catch (e) {}
  veilIn.addEventListener('input', setVeil);
  setVeil();

  /* ---- the opening: the books come down the line out of the distance, the oldest first, the newest
     landing last at the front; then the words. `?opening` replays it. ---- */
  const ARRIVE = 7;                                  // how many steps further back a book starts
  const STEP = 140, LAST = 1500, HOLD = 120;         // ms between arrivals, each book's travel, the pause before the first
  const FAR = 8;                                     // the farthest book in view; it arrives first
  let t0 = 0, opening = !reduce;
  const easeOut = (u) => 1 - Math.pow(1 - u, 4);
  function arrival(i, k) {
    if (!opening) return 0;
    const order = Math.max(0, FAR - k);                // 0 = the farthest book in view, FAR = the front
    const u = (performance.now() - t0 - HOLD - order * STEP) / LAST;
    if (u >= 1) return 0;
    if (u <= 0) return 1;
    return 1 - easeOut(u);
  }
  function startOpening() {
    t0 = performance.now();                          // the page opens with the class already on, so the words never flash
    setTimeout(() => { opening = false; document.body.classList.remove('opening'); }, HOLD + FAR * STEP + LAST);
  }

  /* ---- the frame ---- */
  const ease = reduce ? 1 : 0.09;
  function frame() {
    pos += (target - pos) * ease;
    if (Math.abs(target - pos) < 0.0005) pos = target;
    px += (tpx - px) * (reduce ? 1 : 0.06);
    py += (tpy - py) * (reduce ? 1 : 0.06);
    place();
    updateLabel();
    updateBackdrop();
    requestAnimationFrame(frame);
  }

  addEventListener('resize', () => { layout(); place(); });
  layout();
  applyLang();
  if (opening) startOpening(); else document.body.classList.remove('opening');
  place();
  requestAnimationFrame(frame);
})();

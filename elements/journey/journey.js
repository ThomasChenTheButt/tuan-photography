/* Journey — the behaviour.
   One book per country stands upright on a shelf that runs across the page,
   oldest at the left, the newest at the right, each a little in front of the
   one before it, all turned the same way so the page edges show. Scrolling or
   dragging slides the shelf along; it loops, so past the newest book the
   oldest comes round again. The book under the cursor comes off the shelf
   toward you and the label names it; a click opens it. On a phone the label
   names the book at the middle. Nothing is written on a cover. */
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
          lead: 'Every place I have been, as a book on one long shelf. The oldest stands at the left, the newest at the right.',
          hint: 'Scroll or drag along the shelf. Click a book to open it.',
          home: 'Home', guide: 'Open the guide', photos: 'See the photographs', soon: 'Photographs to come',
          bandGuide: "A photographer's guide", bandPhotos: 'Photographs', bandNone: 'No photographs yet', veil: 'Background',
          photo: (n) => n === 1 ? '1 photograph' : n + ' photographs',
          pos: (i, n) => i + ' of ' + n },
    zh: { title: '旅程', other: 'EN',
          lead: '去過的每個地方都是一本書，排在一條長長的書架上。最早的在左邊，最新的在右邊。',
          hint: '捲動或拖曳就能沿著書架走。點一本書把它打開。',
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
    const tag = document.createElement('span'); tag.className = 'tag'; bk.tag = tag;
    ['book__edge', 'book__top'].forEach((c) => { const d = document.createElement('span'); d.className = c; box.appendChild(d); });
    box.append(spine, face, band, tag);
    face.appendChild(band);
    el.appendChild(box);
    el.setAttribute('aria-label', bk.title.en);
    bk.el = el; bk.lift = 0;
    line.appendChild(el);
  });

  /* ---- the shelf: how tall the books stand, how close together ---- */
  let W = 0, H = 0, step = 0, lift = 0, reach = 0;
  const AR = 12 / 17;                               // design 1's guidebook
  const TURN = 34;                                  // degrees every book is turned, left edge toward you
  function layout() {
    W = innerWidth; H = innerHeight;
    const h = W > 700 ? Math.min(H * 0.56, W * 0.3) : Math.min(H * 0.42, W * 0.62 / AR);   // a book's height; on a phone the width decides
    const w = h * AR;
    step = w * 0.55;                                // the next book stands half a width or so to the right, in front
    lift = Math.max(60, Math.min(130, w * 0.3));    // how far a book comes off the shelf under the cursor
    reach = W / step / 2 + 2;                       // how many books either side of the middle are drawn
    books.forEach((bk) => {
      bk.w = w; bk.h = h;
      bk.el.style.setProperty('--w', w + 'px');
      bk.el.style.setProperty('--h', h + 'px');
    });
  }

  /* ---- the position along the shelf, eased; the cursor's small push on the whole shelf ---- */
  let pos = n - 1, target = n - 1;                   // index of the book at the middle
  let px = 0, py = 0, tpx = 0, tpy = 0;              // parallax
  let hovered = null, shown = -1, shownLang = '';
  let armed = false, lastX = -1, lastY = -1;         // hover counts only once the cursor has moved after a move of the line

  function clampTarget() { /* the line loops, so nothing to clamp */ }
  const wrap = (i) => ((i % n) + n) % n;         // a book's index on the loop

  const half = n / 2;
  function place() {
    for (let i = 0; i < n; i++) {
      const bk = books[i];
      const k = wrap(i - pos + half) - half;         // 0 at the middle, left negative, right positive, round the loop
      const up = hovered === i ? 1 : 0;
      bk.lift += (up - bk.lift) * (reduce ? 1 : 0.16);
      if (Math.abs(k) > reach) { bk.el.classList.add('hidden'); bk.lift = 0; continue; }
      bk.el.classList.remove('hidden');
      const x = k * step, y = -bk.lift * bk.h * 0.04, z = bk.lift * lift;
      bk.el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,' + z.toFixed(1) + 'px) rotateY(' + TURN + 'deg)';
      bk.el.style.zIndex = up ? 2 : 1;
    }
    line.style.transform = 'rotateX(' + (-5 - py * 1.5).toFixed(2) + 'deg) rotateY(' + (px * 2).toFixed(2) + 'deg)';   // seen a little from above, so the top edges show
  }

  /* ---- the label ---- */
  function describe(i) {
    const bk = books[i], t = i18n[lang];
    labDate.textContent = bk.visits > 1 ? (bk.c.date ? bk.c.date[lang] : bk.date[lang]) : (bk.date[lang] || '');
    labPlace.textContent = bk.title[lang];
    labNote.textContent = bk.c.note ? bk.c.note[lang] : '';
    labCount.textContent = bk.own.length ? t.photo(bk.own.length) : t.soon;
    labPos.textContent = t.pos(i + 1, n);
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
    const raw = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;   // a trackpad's sideways swipe, or the wheel
    const d = e.deltaMode === 1 ? raw * 18 : e.deltaMode === 2 ? raw * H : raw;
    target += d / (step * 1.4);
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
    target = drag.start - dx / step;                // pull the shelf along
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
    target = Math.round(target) + (wrap(i - pos + half) - half);   // nothing to open: bring it to the middle instead
  }
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', () => { drag = null; stage.classList.remove('dragging'); });
  stage.addEventListener('pointerleave', () => { tpx = 0; tpy = 0; hovered = null; });


  addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') { target = Math.round(target) - 1; }
    else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') { target = Math.round(target) + 1; }
    else if (e.key === 'Home') target = Math.round(target) - wrap(Math.round(target));
    else if (e.key === 'End') target = Math.round(target) + wrap(n - 1 - Math.round(target));
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
      bk.tag.textContent = bk.date[lang];
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
    moveLabel();
    requestAnimationFrame(frame);
  }

  addEventListener('resize', () => { layout(); place(); });
  layout();
  pos = target = n - 1 - Math.max(0, Math.floor(W / step / 2) - 1);   // open with the newest book near the right edge, the years running back to the left
  applyLang();
  place();
  requestAnimationFrame(frame);
})();

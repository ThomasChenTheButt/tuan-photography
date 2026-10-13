/* ==========================================================
   tuan photography 陳亮元: site behavior
   1. EN / 中文 switcher   2. Menu   3. Looking at one photograph
   4. Guide contents marker
   ========================================================== */

/* ---------- 1. Language switcher ----------
   Every translated element has data-i18n="key".
   data-i18n-html is the same but keeps bold text.
   data-i18n-alt / data-i18n-aria translate an image's alt text
   and a control's spoken label.
   Add new text in BOTH dictionaries below. */

const i18n = {
  en: {
    navGallery: 'Gallery',
    navDestinations: 'Destinations',
    navBlog: 'Blog',
    navSkills: 'Skills',
    navAbout: 'About',
    navJourney: 'Journey',
    navMenu: 'Menu',
    skip: 'Skip to the content',
    footNote: '© 2026 tuan photography 陳亮元. All photographs are my own.',
    followCta: 'Follow on Instagram',
    vMaking: 'How it was made',
    vCamera: 'Camera',
    vLens: 'Lens',
    vFocal: 'Focal length',
    vAperture: 'Aperture',
    vShutter: 'Shutter',
    vIso: 'ISO',
    vBest: 'Best time',
    vGuide: 'Read the guide',
    vNoGuide: 'The guide for this place is not written yet.',
    vMap: 'Open the map pin',
    vClose: 'Close',
    vPrev: 'Previous',
    vNext: 'Next'
  },
  zh: {
    navGallery: '作品集',
    navDestinations: '目的地',
    navBlog: '網誌',
    navSkills: '攝影技巧',
    navAbout: '關於我',
    navJourney: '旅程',
    navMenu: '選單',
    skip: '跳到內容',
    footNote: '© 2026 tuan photography 陳亮元。所有照片皆為本人拍攝。',
    followCta: '追蹤 Instagram',
    vMaking: '這張怎麼拍',
    vCamera: '相機',
    vLens: '鏡頭',
    vFocal: '焦距',
    vAperture: '光圈',
    vShutter: '快門',
    vIso: 'ISO',
    vBest: '最佳時間',
    vGuide: '閱讀攻略',
    vNoGuide: '這個地方的攻略還沒寫。',
    vMap: '打開地圖座標',
    vClose: '關閉',
    vPrev: '上一張',
    vNext: '下一張'
  }
};

/* Pages can define their own extra translations in a
   window.pageI18n = { en: {...}, zh: {...} } block before this file loads. */
if (window.pageI18n) {
  Object.assign(i18n.en, window.pageI18n.en || {});
  Object.assign(i18n.zh, window.pageI18n.zh || {});
}

let lang = 'en';
const t = key => i18n[lang][key] ?? i18n.en[key] ?? '';

function setLang(next) {
  lang = next === 'zh' ? 'zh' : 'en';
  const dict = i18n[lang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const v = dict[el.dataset.i18n];
    if (v !== undefined) el.textContent = v;
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const v = dict[el.dataset.i18nHtml];
    if (v !== undefined) el.innerHTML = v;
  });
  document.querySelectorAll('[data-i18n-alt]').forEach(el => {
    const v = dict[el.dataset.i18nAlt];
    if (v !== undefined) el.alt = v;
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    const v = dict[el.dataset.i18nAria];
    if (v !== undefined) el.setAttribute('aria-label', v);
  });
  if (dict.docTitle) document.title = dict.docTitle;
  document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en';
  document.getElementById('lang-en')?.setAttribute('aria-pressed', String(lang === 'en'));
  document.getElementById('lang-zh')?.setAttribute('aria-pressed', String(lang === 'zh'));
  try { localStorage.setItem('tlap-lang', lang); } catch (e) { /* private mode */ }
  if (viewer?.open) renderViewer();
  document.dispatchEvent(new Event('langchange'));   // for a page's own script (wall.js)
}

document.getElementById('lang-en')?.addEventListener('click', () => setLang('en'));
document.getElementById('lang-zh')?.addEventListener('click', () => setLang('zh'));

/* ---------- 2. Menu (small screens) ---------- */
const menuBtn = document.querySelector('.menu-btn');
const menu = document.querySelector('.menu');
menuBtn?.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', String(open));
});

/* The opening photograph stays in place under the page. When the keyboard reaches it
   from further down, go back up so what has focus can be seen. */
const coverLink = document.querySelector('.cover a');
coverLink?.addEventListener('focus', () => {
  if (coverLink.matches(':focus-visible')) window.scrollTo(0, 0);
});

/* A window part way down the page: its photograph is fixed to the screen, and drifts
   slowly as the window passes, at a fraction of the page's speed. The number goes to the
   stylesheet as --drift; nothing moves under "reduce motion". */
const panes = [...document.querySelectorAll('.window')];
if (panes.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  let waiting = false;
  const drift = () => {
    waiting = false;
    const vh = window.innerHeight;
    panes.forEach(pane => {
      const r = pane.getBoundingClientRect();
      const passage = (r.top + r.height) / (vh + r.height);   // 1 as it enters at the foot, 0 as it leaves at the top
      pane.style.setProperty('--drift', `${((passage - 0.5) * 0.24 * vh).toFixed(1)}px`);
    });
  };
  window.addEventListener('scroll', () => { if (!waiting) { waiting = true; requestAnimationFrame(drift); } }, { passive: true });
  window.addEventListener('resize', drift);
  drift();
}

/* ---------- 3. Looking at one photograph ----------
   The photographs on this page are listed in a JSON block (#slides-data).
   Opening one shows it large, with how it was made beside it.
   Every photograph has its own address: page.html#view-<id> */

const root = document.documentElement.dataset.root || '';
const dataEl = document.getElementById('slides-data');
const slides = dataEl ? JSON.parse(dataEl.textContent) : [];
const order = [...new Set([...document.querySelectorAll('[data-slide]')].map(el => el.dataset.slide))]
  .filter(id => slides.some(s => s.id === id));

let viewer = null;
let current = null;

function buildViewer() {
  viewer = document.createElement('dialog');
  viewer.className = 'viewer';
  viewer.setAttribute('aria-labelledby', 'viewer-place');
  viewer.tabIndex = -1;
  viewer.innerHTML = `
    <div class="viewer__bar">
      <div>
        <button id="viewer-prev" type="button"></button>
        <button id="viewer-next" type="button"></button>
        <span class="viewer__count num" id="viewer-count"></span>
      </div>
      <button id="viewer-close" type="button"></button>
    </div>
    <div class="viewer__photo"><img id="viewer-img" alt=""></div>
    <div class="viewer__side">
      <div>
        <h2 id="viewer-place" aria-live="polite"></h2>
        <p class="viewer__where" id="viewer-where"></p>
      </div>
      <div>
        <h3 id="viewer-making"></h3>
        <dl id="viewer-data"></dl>
      </div>
      <p class="viewer__note" id="viewer-note"></p>
      <div class="viewer__acts" id="viewer-acts"></div>
    </div>`;
  document.body.append(viewer);
  const tidy = () => {
    if (history.state?.viewer) history.back();
    else if (location.hash.startsWith('#view-')) history.replaceState(null, '', location.pathname + location.search);
    document.querySelector(`[data-slide="${current}"]`)?.focus({ preventScroll: true });
  };
  /* the phone's Back closes the photograph instead of leaving the site */
  window.addEventListener('popstate', () => {
    if (viewer.open && !location.hash.startsWith('#view-')) viewer.close();
  });
  /* a sideways swipe on the photograph steps to the next one */
  let touchX = null, touchY = null;
  const photo = viewer.querySelector('.viewer__photo');
  photo.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; touchY = e.touches[0].clientY; }, { passive: true });
  photo.addEventListener('touchend', e => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX, dy = e.changedTouches[0].clientY - touchY;
    touchX = touchY = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
  }, { passive: true });
  viewer.querySelector('#viewer-close').addEventListener('click', () => { viewer.close(); tidy(); });
  viewer.querySelector('#viewer-prev').addEventListener('click', () => step(-1));
  viewer.querySelector('#viewer-next').addEventListener('click', () => step(1));
  viewer.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });   /* Escape closes the dialog itself, and 'close' below tidies up once */
  viewer.addEventListener('close', tidy);
}

function row(label, value) {
  return value ? `<div><dt>${label}</dt><dd>${value}</dd></div>` : '';
}

function renderViewer() {
  const s = slides.find(x => x.id === current);
  if (!s) return;
  const img = viewer.querySelector('#viewer-img');
  if (!img.src.endsWith('/' + s.file)) {
    img.setAttribute('aria-busy', 'true');
    img.onload = () => img.removeAttribute('aria-busy');
    img.sizes = '(max-width: 56rem) 100vw, calc(100vw - 20rem)';
    img.srcset = s.srcset;
    img.src = root + 'images/web/' + s.file;
  }
  img.width = s.w;
  img.height = s.h;
  img.alt = s.alt[lang];
  viewer.querySelector('#viewer-place').textContent = s.place[lang];
  viewer.querySelector('#viewer-where').textContent = s.where[lang];
  viewer.querySelector('#viewer-making').textContent = t('vMaking');
  viewer.querySelector('#viewer-data').innerHTML =
    row(t('vBest'), s.best?.[lang]) +
    row(t('vFocal'), s.focal) +
    row(t('vAperture'), s.aperture) +
    row(t('vShutter'), s.shutter) +
    row(t('vIso'), s.iso) +
    row(t('vLens'), s.lens) +
    row(t('vCamera'), s.camera);
  const note = viewer.querySelector('#viewer-note');
  note.textContent = s.note?.[lang] ?? (s.guide ? '' : t('vNoGuide'));
  note.hidden = !note.textContent;
  const acts = [];
  if (s.guide) acts.push(`<a class="btn" href="${root}${s.guide}#s-${s.id}">${t('vGuide')}</a>`);
  if (s.map) acts.push(`<a href="${s.map}" target="_blank" rel="noopener">${t('vMap')}</a>`);
  viewer.querySelector('#viewer-acts').innerHTML = acts.join('');
  viewer.querySelector('#viewer-close').textContent = t('vClose');
  viewer.querySelector('#viewer-prev').textContent = t('vPrev');
  viewer.querySelector('#viewer-next').textContent = t('vNext');
  const many = order.length > 1;
  viewer.querySelector('#viewer-prev').hidden = !many;
  viewer.querySelector('#viewer-next').hidden = !many;
  const count = viewer.querySelector('#viewer-count');
  count.hidden = !many;
  count.textContent = `${order.indexOf(current) + 1} / ${order.length}`;
}

function pick(id, from) {
  if (!slides.some(s => s.id === id)) return;
  if (!viewer) buildViewer();
  current = id;
  const show = () => {
    renderViewer();
    if (!viewer.open) { viewer.showModal(); viewer.querySelector('#viewer-close').focus({ preventScroll: true }); }
  };
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const thumb = from?.querySelector('img');
  if (document.startViewTransition && thumb && !still && !viewer.open) {
    const big = viewer.querySelector('#viewer-img');
    thumb.style.viewTransitionName = 'picked';
    const vt = document.startViewTransition(() => {
      thumb.style.viewTransitionName = '';
      big.style.viewTransitionName = 'picked';
      show();
    });
    vt.ready.catch(() => {});
    vt.finished.catch(() => {}).finally(() => { big.style.viewTransitionName = ''; });
  } else {
    show();
  }
  if (history.state?.viewer) history.replaceState({ viewer: true }, '', '#view-' + id);
  else history.pushState({ viewer: true }, '', '#view-' + id);
}

function step(d) {
  if (order.length < 2) return;
  const i = order.indexOf(current);
  current = order[(i + d + order.length) % order.length];
  renderViewer();
  history.replaceState({ viewer: true }, '', '#view-' + current);
}

document.querySelectorAll('a[data-slide]').forEach(el => {
  el.addEventListener('click', e => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    pick(el.dataset.slide, el);
  });
});

/* ---------- 4. Books in a row ----------
   The books stand in a row, the one in front at the middle and the rest stepped back
   on either side. The wheel, the arrow keys, a swipe, or the page's own scrolling move
   the row; a click on a book further along brings it to the front; the book in front
   opens. Each book's distance from the front goes to the stylesheet as --d. */
const stackEl = document.querySelector('.stack');
if (stackEl) {
  const stage = stackEl.parentElement;
  const books = [...stackEl.children];
  const n = books.length;
  let cur = 0, settle = null, lastY = window.scrollY, shown = false, front = -1;
  const place = () => {
    books.forEach((book, i) => {
      const d = i - cur, far = Math.abs(d);
      book.style.setProperty('--d', d.toFixed(3));
      book.style.setProperty('--z', (-far * 5).toFixed(2) + 'rem');
      book.style.setProperty('--o', Math.max(0.3, 1 - far * 0.22).toFixed(2));
      book.hidden = far > 5;
      book.classList.toggle('front', Math.round(cur) === i);
    });
    if (Math.round(cur) !== front) { front = Math.round(cur); stage.dispatchEvent(new CustomEvent('front', { detail: front, bubbles: true })); }
  };
  const go = (to, snap = true) => {
    cur = Math.min(n - 1, Math.max(0, to));
    place();
    clearTimeout(settle);
    if (!snap) settle = setTimeout(() => go(Math.round(cur)), 160);
  };
  place();
  new IntersectionObserver(([e]) => { shown = e.isIntersecting; }).observe(stage);
  books.forEach((book, i) => {
    book.addEventListener('click', e => {
      if (i === Math.round(cur)) return;            // the book in front opens
      e.preventDefault();
      go(i);
    });
    book.addEventListener('focus', () => go(i));   // the keyboard walks the row
  });
  stage.addEventListener('advance', () => go(Math.round(cur) + 1 < n ? Math.round(cur) + 1 : 0));
  stage.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(Math.round(cur) + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(Math.round(cur) - 1); }
  });
  stage.addEventListener('wheel', e => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { e.preventDefault(); go(cur + e.deltaX / 90, false); }
  }, { passive: false });
  let touchX = null;
  stage.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchmove', e => {
    if (touchX === null) return;
    go(cur - (e.touches[0].clientX - touchX) / 70, false); touchX = e.touches[0].clientX;
  }, { passive: true });
  stage.addEventListener('touchend', () => { touchX = null; go(Math.round(cur)); });
  /* the page's own scrolling walks the row while it is in view */
  window.addEventListener('scroll', () => {
    const dy = window.scrollY - lastY; lastY = window.scrollY;
    if (shown && !stage.matches(':hover')) go(cur + dy / 260, false);
  }, { passive: true });
}

/* ---------- 4b. The stage behind the books (experiment timed-cards) ----------
   The book in front opens into a photograph behind the shelf: another photograph of the same
   place (never the one on the cover) grows out of the cover until it fills the stage. A few
   seconds later a second one does the same, then the row moves on to the next book by itself
   (his call, 2026-10-13). Any wheel, swipe, key, click or page scroll on the row stops this;
   after a few quiet seconds it carries on. While the book stays in front, every few seconds
   the next photograph from the same book grows out of the cover in the same way. It waits while
   the stage is out of view, the tab is hidden or the pointer is on a book. Under "reduce motion"
   the photograph simply changes with the book, and nothing changes on its own. */
const stageEl = document.querySelector('.stage');
if (stageEl) {
  const sets = JSON.parse(document.getElementById('stage-data').textContent);
  const bg = stageEl.querySelector('.stage__bg');
  const line = stageEl.querySelector('.stage__place');
  const shelfEl = stageEl.querySelector('.shelf');
  const root = document.documentElement.dataset.root || '';
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EVERY = 5000, GROW = 1300, QUIET = 6000, PER_BOOK = 2;
  let book = [...shelfEl.querySelectorAll('.book')].findIndex(b => b.classList.contains('front'));
  let k = 0, timer = null, wait = null, inView = false, held = false, opened = false;
  let seen = 0, lastHand = 0;
  const last = {};   // where each book's photographs had got to, so a later visit shows others
  const zh = () => document.documentElement.lang === 'zh-Hant';
  const say = () => {
    const x = sets[book] && sets[book][k];
    if (!x) { line.classList.add('out'); return; }
    line.querySelector('b').textContent = x.p[zh() ? 'zh' : 'en'];
    line.querySelector('span').textContent = x.wh[zh() ? 'zh' : 'en'];
    line.classList.remove('out');
  };
  const show = (grow) => {
    const x = sets[book] && sets[book][k];
    if (!x) { bg.replaceChildren(); say(); return; }   // a book with no other photograph: the plain stage
    const img = new Image();
    img.alt = '';
    img.decoding = 'async';
    img.sizes = '100vw';
    img.srcset = `${root}images/web/1280/${x.f} 1280w, ${root}images/web/${x.f} ${x.w}w`;
    img.src = `${root}images/web/1280/${x.f}`;
    // each photograph is a card: a bare rectangle that the photograph fills, whatever its shape
    const card = document.createElement('div');
    card.append(img);
    const put = () => {
      const old = [...bg.children];
      bg.append(card);
      line.classList.add('out');
      const done = () => { old.forEach(o => o.remove()); say(); };
      const face = shelfEl.querySelector('.book.front .book__face');
      if (!grow || still || !face) { done(); return; }
      // as in the reference: the card lifts out of the front book, up and a little to the left, clear of the row,
      // then grows until it is the whole stage, while the photograph before it sinks into shadow
      const s = stageEl.getBoundingClientRect(), c = face.getBoundingClientRect();
      const at = (l, t, w, h) => ({ left: l + 'px', top: t + 'px', width: w + 'px', height: h + 'px' });
      const x0 = c.left - s.left, y0 = c.top - s.top;
      card.animate([
        { ...at(x0, y0, c.width, c.height), offset: 0 },
        { ...at(x0 - c.width * 0.3, y0 - c.height * 0.95, c.width * 1.08, c.height * 1.08), offset: 0.35 },
        { ...at(0, 0, s.width, s.height), offset: 1 }
      ], { duration: GROW, easing: 'cubic-bezier(0.55, 0, 0.25, 1)' }).finished.then(done, done);
      old.forEach(o => o.animate([{ opacity: 1 }, { opacity: 0.3 }], { duration: GROW, easing: 'ease-in', fill: 'forwards' }));
    };
    img.decode().then(put, put);
  };
  const tick = () => {
    clearTimeout(timer);
    if (still || !inView || document.hidden) return;
    timer = setTimeout(() => {
      const n = (sets[book] || []).length;
      if (!held && Date.now() - lastHand > QUIET) {
        if (n > 1 && seen < PER_BOOK) { k = (k + 1) % n; last[book] = k; seen++; show(true); }
        else shelfEl.dispatchEvent(new CustomEvent('advance'));
      }
      tick();
    }, EVERY);
  };
  stageEl.addEventListener('front', e => {
    book = e.detail;
    const n = (sets[book] || []).length;
    k = n && book in last ? (last[book] + 1) % n : 0; last[book] = k; seen = n ? 1 : 0;
    // wait until the row has stopped moving, so the cover is where it will stay
    clearTimeout(timer); clearTimeout(wait);
    wait = setTimeout(() => { opened = opened || inView; show(inView); tick(); }, 480);
  });
  new IntersectionObserver(([e]) => {
    inView = e.isIntersecting;
    if (inView && !opened) { opened = true; last[book] = k; seen = (sets[book] || []).length ? 1 : 0; show(true); }   // the first time the stage comes into view, the cover opens
    tick();
  }, { threshold: 0.4 }).observe(stageEl);
  document.addEventListener('visibilitychange', tick);
  // the visitor's own hand on the row: wait until it has been quiet for a while
  const hand = () => { lastHand = Date.now(); };
  ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(t => shelfEl.addEventListener(t, hand, { passive: true }));
  window.addEventListener('scroll', () => { if (inView) hand(); }, { passive: true });
  shelfEl.addEventListener('pointerover', e => { held = !!e.target.closest('.book'); });
  shelfEl.addEventListener('pointerleave', () => { held = false; });
  new MutationObserver(say).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
}

/* ---------- 5. Guide contents: mark the section being read ---------- */
const tocLinks = [...document.querySelectorAll('.toc a[href^="#"]')];
if (tocLinks.length && 'IntersectionObserver' in window) {
  const byId = new Map(tocLinks.map(a => [a.getAttribute('href').slice(1), a]));
  const seen = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      tocLinks.forEach(a => a.removeAttribute('aria-current'));
      byId.get(e.target.id)?.setAttribute('aria-current', 'true');
    });
  }, { rootMargin: '-10% 0px -75% 0px' });
  byId.forEach((a, id) => { const h = document.getElementById(id); if (h) seen.observe(h); });
}

/* ---------- start ---------- */
let saved = null;
try { saved = localStorage.getItem('tlap-lang'); } catch (e) { /* private mode */ }
const first = saved || ((navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en');
if (first === 'zh') setLang('zh');

const fromAddress = () => { if (location.hash.startsWith('#view-')) pick(location.hash.slice(6)); };
window.addEventListener('hashchange', fromAddress);
fromAddress();

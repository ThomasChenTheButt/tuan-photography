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
    navMenu: 'Menu',
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
    navMenu: '選單',
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
  viewer.innerHTML = `
    <div class="viewer__bar">
      <div>
        <button id="viewer-prev" type="button"></button>
        <button id="viewer-next" type="button"></button>
      </div>
      <button id="viewer-close" type="button"></button>
    </div>
    <div class="viewer__photo"><img id="viewer-img" alt=""></div>
    <div class="viewer__side">
      <div>
        <h2 id="viewer-place"></h2>
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
  viewer.querySelector('#viewer-close').addEventListener('click', () => viewer.close());
  viewer.querySelector('#viewer-prev').addEventListener('click', () => step(-1));
  viewer.querySelector('#viewer-next').addEventListener('click', () => step(1));
  viewer.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });
  viewer.addEventListener('close', () => {
    if (location.hash.startsWith('#view-')) history.replaceState(null, '', location.pathname + location.search);
    document.querySelector(`[data-slide="${current}"]`)?.focus({ preventScroll: true });
  });
}

function row(label, value) {
  return value ? `<div><dt>${label}</dt><dd>${value}</dd></div>` : '';
}

function renderViewer() {
  const s = slides.find(x => x.id === current);
  if (!s) return;
  const img = viewer.querySelector('#viewer-img');
  img.src = root + 'images/web/' + s.file;
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
}

function pick(id, from) {
  if (!slides.some(s => s.id === id)) return;
  if (!viewer) buildViewer();
  current = id;
  const show = () => {
    renderViewer();
    if (!viewer.open) viewer.showModal();
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
  history.replaceState(null, '', '#view-' + id);
}

function step(d) {
  if (order.length < 2) return;
  const i = order.indexOf(current);
  current = order[(i + d + order.length) % order.length];
  renderViewer();
  history.replaceState(null, '', '#view-' + current);
}

document.querySelectorAll('a[data-slide]').forEach(el => {
  el.addEventListener('click', e => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    pick(el.dataset.slide, el);
  });
});

/* ---------- 4. Guide contents: mark the section being read ---------- */
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

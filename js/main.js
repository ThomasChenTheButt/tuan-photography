/* ==========================================================
   TRAVEL LIKE A PHOTOGRAPHER — site behavior
   1. Mobile menu   2. EN/中文 switcher   3. Scroll reveals
   ========================================================== */

/* ---------- 1. Mobile menu ---------- */
const toggle = document.querySelector('.nav-toggle');
const links = document.querySelector('.nav-links');
if (toggle && links) {
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });
}

/* ---------- 2. Language switcher ----------
   Every translated element has a data-i18n="key" attribute.
   Add new text in BOTH dictionaries below. */

const i18n = {
  en: {
    siteName: 'tuan photography',
    navDestinations: 'Destinations',
    navGallery: 'Gallery',
    navBlog: 'Blog',
    navSkills: 'Skills',
    navAbout: 'About',
    heroTitle: 'See the world through the viewfinder.',
    heroSub: "Real itineraries, exact photo spots, and everything I researched before pressing the shutter — so you can travel and shoot like you've been there before.",
    heroCta: 'Browse the guides',
    heroExifNote: 'Aoraki / Mount Cook · New Zealand',

    guidesTitle: 'Latest field guides',
    guidesLabel: 'Vol. 01 — Guides',
    g1cat: 'Greece · Full Guide',
    g1title: 'Santorini for Photographers: 3 Days, 9 Shots, Zero Crowds',
    g1desc: 'Where to stand at sunrise in Oia before the tour buses arrive, which rooftops you can actually access, and the one village most photographers skip.',
    g2cat: 'Japan · Full Guide',
    g2title: 'Kyoto in Autumn: A Shot List for Temple Season',
    g2desc: 'Timing the maple color, the temples that allow tripods, and where to eat between golden hours.',
    g3cat: 'Coming soon',
    g3title: 'Your next trip goes here',
    g3desc: "This card is a placeholder — we'll fill it with a real trip from your planning notes.",

    methodTitle: 'How every guide is made',
    methodLabel: 'The method',
    m1no: 'Step 01 — Research',
    m1title: 'Weeks of homework',
    m1desc: 'Every trip starts long before the flight: scouting locations, light direction, seasons, opening hours, and the food worth traveling for.',
    m2no: 'Step 02 — Shoot',
    m2title: 'Boots on the ground',
    m2desc: 'I walk the plan, shoot the shot list, and note what actually worked — and what the blogs got wrong.',
    m3no: 'Step 03 — Share',
    m3title: "The guide you're reading",
    m3desc: 'The research, the route, and the exact spots — published so your trip starts where mine ended.',

    aboutTitle: 'The person behind the lens',
    aboutLede: "I'm a photographer who plans trips the way other people plan weddings — spreadsheets, maps, shot lists, and food research included.",
    aboutBody: "This site is everything I wish existed when I started: honest guides that tell you where the photo was taken, when to be there, and what to do with the rest of your day. (We'll replace this with your real story.)",
    aboutCta: 'My story',
    portraitCaption: 'self-portrait · somewhere far away',

    newsTitle: 'New guides, straight from the field',
    newsSub: "One email when a new guide is published. No spam — a photographer's word.",
    newsCta: 'Subscribe',

    footInstagram: 'Instagram',
    footNote: '© 2026 tuan photography 陳亮元 — All photographs are my own.'
  },

  zh: {
    siteName: 'tuan photography',
    navDestinations: '目的地',
    navGallery: '作品集',
    navBlog: '網誌',
    navSkills: '攝影技巧',
    navAbout: '關於我',
    heroTitle: '透過觀景窗看世界。',
    heroSub: '真實的行程、精確的攝影點,以及每次按下快門前做的所有功課——讓你的旅行,像已經來過一樣。',
    heroCta: '瀏覽指南',
    heroExifNote: '庫克山 · 紐西蘭',

    guidesTitle: '最新旅拍指南',
    guidesLabel: 'Vol. 01 — 指南',
    g1cat: '希臘 · 完整指南',
    g1title: '攝影師的聖托里尼:3 天、9 個機位、避開人潮',
    g1desc: '日出時該站在 Oia 的哪個位置、哪些屋頂真的能上去,以及大多數攝影師錯過的那座村莊。',
    g2cat: '日本 · 完整指南',
    g2title: '秋天的京都:寺廟紅葉季拍攝清單',
    g2desc: '楓葉變色的時間點、允許腳架的寺廟,以及兩個黃金時刻之間該吃什麼。',
    g3cat: '即將推出',
    g3title: '你的下一趟旅程',
    g3desc: '這是佔位卡片——我們會用你規劃筆記中的真實行程填滿它。',

    methodTitle: '每份指南的誕生過程',
    methodLabel: '製作方法',
    m1no: '步驟 01 — 研究',
    m1title: '出發前的數週功課',
    m1desc: '每趟旅程早在班機起飛前就開始:勘景、光線方向、季節、開放時間,還有值得專程前往的美食。',
    m2no: '步驟 02 — 拍攝',
    m2title: '親自走一遍',
    m2desc: '我照著計畫走、拍完清單上的每一張,並記下真正有用的資訊——以及部落格寫錯的地方。',
    m3no: '步驟 03 — 分享',
    m3title: '你正在讀的這份指南',
    m3desc: '研究、路線、精確機位——全部公開,讓你的旅程從我的終點開始。',

    aboutTitle: '鏡頭後面的人',
    aboutLede: '我是個攝影師,規劃旅行像別人籌備婚禮一樣認真——試算表、地圖、拍攝清單、美食研究,一樣都不少。',
    aboutBody: '這個網站是我剛起步時最希望存在的東西:誠實的指南,告訴你照片在哪裡拍、什麼時候去,以及一天剩下的時間該做什麼。(之後會換成你的真實故事。)',
    aboutCta: '我的故事',
    portraitCaption: '自拍 · 在遙遠的某處',

    newsTitle: '新指南,直送你的信箱',
    newsSub: '新指南發佈時寄一封信給你。不濫發——攝影師的承諾。',
    newsCta: '訂閱',

    footInstagram: 'Instagram',
    footNote: '© 2026 tuan photography 陳亮元——所有照片皆為本人拍攝。'
  }
};

/* Pages can define their own extra translations in a
   window.pageI18n = { en: {...}, zh: {...} } block before this file loads. */
if (window.pageI18n) {
  Object.assign(i18n.en, window.pageI18n.en || {});
  Object.assign(i18n.zh, window.pageI18n.zh || {});
}

function setLang(lang) {
  const dict = i18n[lang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) el.textContent = dict[key];
  });
  document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en';
  document.getElementById('lang-en').classList.toggle('on', lang === 'en');
  document.getElementById('lang-zh').classList.toggle('on', lang === 'zh');
  localStorage.setItem('tlap-lang', lang);
}

document.getElementById('lang-en')?.addEventListener('click', () => setLang('en'));
document.getElementById('lang-zh')?.addEventListener('click', () => setLang('zh'));

/* remember the visitor's choice */
const saved = localStorage.getItem('tlap-lang');
if (saved === 'zh') setLang('zh');

/* ---------- Hero parallax drift (homepage) ----------
   The pinned cover photo slowly rises (~1/3 of scroll speed)
   while the page content scrolls up over it at full speed. */
const heroEl = document.querySelector('.hero');
if (heroEl && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      heroEl.style.transform = 'translateY(' + (-window.scrollY * 0.32) + 'px)';
      ticking = false;
    });
  }, { passive: true });
}

/* ---------- 3. Reveal on scroll ---------- */
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

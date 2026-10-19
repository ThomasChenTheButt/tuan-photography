/* design 3, the guide: Barcelona, from his own guide text (content/barcelona.*). The text and its
   two languages come from window.GUIDE; the page adds the head, the lead photograph moving a little
   slower than the page, and a contents list that follows the reading. */
(() => {
  'use strict';
  const { S, photo, t, L, onLang, reduce } = D3;
  const G = window.GUIDE;
  const $ = (s) => document.querySelector(s);
  window.PAGE = {
    title: { en: 'Barcelona · tuan photography 陳亮元', zh: '巴賽隆納 · tuan photography 陳亮元' },
    en: { cap: 'A guide, from four days in July 2026', mapLink: 'Map', ate: 'eaten' },
    zh: { cap: '攻略，來自 2026 年 7 月的四天', mapLink: '地圖', ate: '吃過' },
  };
  $('#g-body').innerHTML = G.html;
  const lead = D3.byId[S.guide.lead];
  const b = photo(lead, { sizes: '100vw', eager: true });
  $('#g-plate').append(b);

  function words() {
    const d = G[D3.lang] || G.en;
    const get = (k) => d[k] ?? G.en[k] ?? window.PAGE[D3.lang][k] ?? '';
    document.querySelectorAll('#g-body [data-i18n]').forEach((el) => { const v = get(el.dataset.i18n); if (v) el.textContent = v; });
    document.querySelectorAll('#g-body [data-i18n-html]').forEach((el) => { const v = get(el.dataset.i18nHtml); if (v) el.innerHTML = v; });
    document.querySelectorAll('#g-body [data-i18n-alt]').forEach((el) => { const v = get(el.dataset.i18nAlt); if (v) el.alt = v; });
    document.querySelectorAll('#g-body [data-i18n-aria]').forEach((el) => { const v = get(el.dataset.i18nAria); if (v) el.setAttribute('aria-label', v); });
    $('#g-cap').textContent = t('cap');
    $('#g-title').textContent = L(S.guide.title);
    $('#g-facts').textContent = L(S.guide.facts);
    $('#g-meta').textContent = get('aMeta');
    b.setAttribute('aria-label', L(lead.place));
    b.querySelector('img').alt = L(lead.alt);
  }
  D3.apply();
  words();
  onLang(words);

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    if (!reduce) {
      gsap.fromTo('#g-plate img', { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '#g-plate', start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.from('#g-title', { yPercent: 30, opacity: 0, duration: 1.2, ease: 'expo.out', delay: 0.1 });
    }
    const links = [...document.querySelectorAll('.toc a')];
    links.forEach((a) => {
      const sec = document.querySelector(a.getAttribute('href'));
      if (!sec) return;
      ScrollTrigger.create({ trigger: sec, start: 'top 40%', endTrigger: links[links.indexOf(a) + 1] ? document.querySelector(links[links.indexOf(a) + 1].getAttribute('href')) : '#g-body', end: links[links.indexOf(a) + 1] ? 'top 40%' : 'bottom 40%',
        onToggle: (self) => a.classList.toggle('is-on', self.isActive) });
    });
  }
})();

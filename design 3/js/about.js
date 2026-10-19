/* design 3, About: his own words (approved 2026-10-16), the facts the data knows, and a contact
   sheet: one photograph from each country. */
(() => {
  'use strict';
  const { S, photo, t, L, esc, onLang } = D3;
  const $ = (s) => document.querySelector(s);
  const A = S.about;
  window.PAGE = {
    title: { en: 'About · tuan photography 陳亮元', zh: '關於 · tuan photography 陳亮元' },
    en: { line: 'Landscape photographer, Taiwan', name: 'Thomas Chen', reach: 'Questions about a place or a photograph: write to me.', follow: 'Follow on Instagram',
      fHome: 'Home base', fHomeV: 'Taiwan', fCountries: 'Countries', fTrips: 'Trips', fTripsV: (n, y) => `${n} since ${y}`, fPhotos: 'Photographs here', fCamera: 'Camera', fLens: 'Lenses' },
    zh: { line: '風景攝影，台灣', name: '陳亮元', reach: '想問某個地方或某張照片，歡迎來信。', follow: '在 Instagram 追蹤',
      fHome: '大本營', fHomeV: '台灣', fCountries: '國家數', fTrips: '旅行', fTripsV: (n, y) => `${y} 年至今 ${n} 趟`, fPhotos: '網站上的照片', fCamera: '相機', fLens: '鏡頭' },
  };
  const ig = $('#ab-ig');
  ig.href = S.instagram.url;
  const mail = $('#ab-mail');
  mail.innerHTML = A.mail;
  mail.href = `mailto:${mail.textContent}`;
  // one photograph from each country, the first of its kind on the site
  const seen = new Set();
  S.photos.forEach((p) => { if (!seen.has(p.country)) { seen.add(p.country); $('#ab-sheet').append(photo(p, { sizes: '(max-width: 52rem) 32vw, 15vw' })); } });
  function words() {
    $('#ab-who').textContent = L(A.who);
    $('#ab-look').textContent = L(A.look);
    $('#ab-trust').textContent = L(A.trust);
    const y = Math.min(...S.trips.map((x) => +(x.months[0] || x.id).slice(0, 4)));
    const rows = [[t('fHome'), t('fHomeV')], [t('fCountries'), String(S.countries.length)], [t('fTrips'), t('fTripsV', S.trips.length, y)],
      [t('fPhotos'), String(S.photos.length)], [t('fCamera'), A.cameras.join(', ')], [t('fLens'), A.lenses.join('\n')]];
    $('#ab-facts').innerHTML = rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v).replace(/\n/g, '<br>')}</dd></div>`).join('');
  }
  D3.apply();
  words();
  onLang(words);
})();

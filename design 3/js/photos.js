/* design 3, Photographs: every photograph, untrimmed, in rows that fill the width. Filter by the
   light it was taken in, by place (#place=<country>), or by trip (#trip=<id>, from the Journeys page);
   order by place (the default), by hour or by date. When the choice changes, the photographs travel to their new places (GSAP Flip). */
(() => {
  'use strict';
  const { S, photo, t, L, esc, onLang, reduce, country, trip, kind } = D3;
  const $ = (s) => document.querySelector(s);

  window.PAGE = {
    title: { en: 'Photographs · tuan photography 陳亮元', zh: '作品 · tuan photography 陳亮元' },
    en: {
      cap: 'Every photograph', title: 'Photographs', byLight: 'Light', byPlace: 'Place', sortBy: 'Order',
      sub: (n, c, k) => `${n} photographs from ${c} countries. ${k} of them carry the moment they were taken, so they can be sorted by the light.`,
      all: 'All', golden: 'Golden hour', blue: 'Blue hour', byHour: 'By hour', newest: 'Newest', place: 'By place',
      count: (n) => (n === 1 ? '1 photograph' : `${n} photographs`), tripOnly: (x) => `Trip: ${x}`, clear: 'Show all',
    },
    zh: {
      cap: '所有照片', title: '作品', byLight: '光線', byPlace: '地方', sortBy: '排序',
      sub: (n, c, k) => `${n} 張照片，來自 ${c} 個國家。其中 ${k} 張記得被拍下的時刻，所以可以照光線排。`,
      all: '全部', golden: '黃金時刻', blue: '藍調時刻', byHour: '依時刻', newest: '最新', place: '依地方',
      count: (n) => `${n} 張`, tripOnly: (x) => `旅程：${x}`, clear: '顯示全部',
    },
  };

  const photos = S.photos;
  const f = { light: 'all', place: 'all', sort: 'place', trip: null };
  const m = location.hash.match(/trip=([\w-]+)/);
  if (m && trip[m[1]]) f.trip = m[1];
  const mp = location.hash.match(/place=([\w-]+)/);
  if (mp && country[mp[1]] && photos.some((p) => p.country === mp[1])) f.place = mp[1];
  /** the address keeps the chosen trip and place, so the choice can be shared and survives a reload */
  function syncHash() {
    const parts = [f.trip && `trip=${f.trip}`, f.place !== 'all' && `place=${f.place}`].filter(Boolean);
    history.replaceState(null, '', location.pathname + location.search + (parts.length ? `#${parts.join('&')}` : ''));
  }

  /* the photographs, built once */
  const items = new Map();
  photos.forEach((p) => {
    const fig = document.createElement('figure');
    fig.className = 'wall__item';
    fig.dataset.flipId = p.id;
    fig.append(photo(p, { sizes: '(max-width: 40rem) 50vw, 28vw' }));
    const c = document.createElement('figcaption');
    fig.append(c);
    items.set(p.id, fig);
    $('#wall').append(fig);
  });

  const LIGHTS = ['all', 'day', 'golden', 'blue', 'night', 'undated'];
  const lightName = (k) => ({ all: t('all'), day: t('day'), golden: t('golden'), blue: t('blue'), night: t('night'), undated: t('undated') }[k]);
  /* By place: continents in this order (then any other), countries by their name in the current language */
  const CONTINENTS = ['asia', 'europe', 'oceania', 'north-america'];
  const contRank = (c) => { const i = CONTINENTS.indexOf(country[c].continent); return i < 0 ? CONTINENTS.length : i; };
  const byPlace = (a, b) => contRank(a) - contRank(b) || (contRank(a) === CONTINENTS.length && String(country[a].continent).localeCompare(String(country[b].continent))) ||
    L(country[a]).localeCompare(L(country[b]), D3.lang === 'zh' ? 'zh-Hant' : 'en');
  const places = () => [...new Set(photos.map((p) => p.country))].sort(byPlace);

  function chosen() {
    let list = photos.filter((p) => (f.light === 'all' || kind(p) === f.light) && (f.place === 'all' || p.country === f.place) && (!f.trip || p.trip === f.trip));
    if (f.sort === 'hour') list = list.sort((a, b) => (a.min ?? 9999) - (b.min ?? 9999));
    if (f.sort === 'newest') list = list.sort((a, b) => (b.date || '0').localeCompare(a.date || '0'));
    if (f.sort === 'place') list = list.sort((a, b) => (a.country === b.country ? 0 : byPlace(a.country, b.country)) || (a.min ?? 9999) - (b.min ?? 9999));
    return list;
  }
  function chip(group, value, label, n) {
    const on = f[group] === value;
    return `<button type="button" class="chip" data-g="${group}" data-v="${value}" aria-pressed="${on}">${esc(label)}${n != null ? `<span class="n">${n}</span>` : ''}</button>`;
  }
  function tools() {
    const base = photos.filter((p) => (f.place === 'all' || p.country === f.place) && (!f.trip || p.trip === f.trip));
    $('#f-light').innerHTML = LIGHTS.map((k) => {
      const n = k === 'all' ? base.length : base.filter((p) => kind(p) === k).length;
      return n || k === 'all' ? chip('light', k, lightName(k), n) : '';
    }).join('');
    const base2 = photos.filter((p) => (f.light === 'all' || kind(p) === f.light) && (!f.trip || p.trip === f.trip));
    $('#f-place').innerHTML = (f.trip ? `<button type="button" class="chip" data-g="trip" data-v="" aria-pressed="true">${esc(t('tripOnly', L(trip[f.trip].label)))}</button>` : '') +
      chip('place', 'all', t('all'), base2.length) +
      places().map((c) => { const n = base2.filter((p) => p.country === c).length; return n ? chip('place', c, L(country[c]), n) : ''; }).join('');
    $('#f-sort').innerHTML = [['place', t('place')], ['hour', t('byHour')], ['newest', t('newest')]].map(([v, l]) => chip('sort', v, l)).join('');
  }

  /* rows that fill the width and keep every photograph whole */
  function layout(list) {
    const W = $('#wall').clientWidth;
    const gap = W < 640 ? 6 : 10;
    const target = W < 640 ? 150 : W < 1100 ? 230 : 300;
    const pos = new Map();
    let y = 0, row = [], sum = 0;
    const flush = (last) => {
      if (!row.length) return;
      let h = (W - gap * (row.length - 1)) / sum;
      if (last && h > target * 1.25) h = target;
      let x = 0;
      row.forEach((p) => { const w = h * (p.w / p.h); pos.set(p.id, { x, y, w, h }); x += w + gap; });
      y += h + gap; row = []; sum = 0;
    };
    list.forEach((p) => {
      row.push(p); sum += p.w / p.h;
      if ((W - gap * (row.length - 1)) / sum <= target) flush(false);
    });
    flush(true);
    return { pos, height: y };
  }
  let first = true;
  function render() {
    const list = chosen();
    const { pos, height } = layout(list);
    const state = !first && !reduce && window.Flip ? Flip.getState([...items.values()]) : null;
    items.forEach((fig, id) => {
      const p = pos.get(id);
      if (!p) { fig.hidden = true; return; }
      fig.hidden = false;
      Object.assign(fig.style, { left: `${p.x}px`, top: `${p.y}px`, width: `${p.w}px`, height: `${p.h}px` });
    });
    $('#wall').style.height = `${height}px`;
    // the order in the document follows the order on screen, for the keyboard and the viewer
    list.forEach((p) => $('#wall').append(items.get(p.id)));
    $('#count').textContent = t('count', list.length);
    if (state) {
      Flip.from(state, { duration: 0.75, ease: 'power3.inOut', stagger: 0.006, absolute: false,
        onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' }),
        onLeave: (els) => gsap.to(els, { opacity: 0, duration: 0.25 }) });
    }
    first = false;
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }
  function captions() {
    items.forEach((fig, id) => {
      const p = D3.byId[id];
      fig.querySelector('figcaption').innerHTML = `<span>${esc(L(p.place))}</span><span class="mono">${p.time || ''}</span>`;
    });
  }

  document.addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    const g = b.dataset.g;
    if (g === 'trip') { f.trip = null; syncHash(); }
    else { f[g] = b.dataset.v; if (g === 'place') syncHash(); }
    tools();
    render();
  });
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { first = true; render(); }, 120); });

  function words() {
    const timed = photos.filter((p) => p.min != null).length;
    $('#sub').textContent = t('sub', photos.length, new Set(photos.map((p) => p.country)).size, timed);
    tools();
    captions();
    $('#count').textContent = t('count', chosen().length);
  }
  D3.apply();
  words();
  onLang(words);
  render();
})();

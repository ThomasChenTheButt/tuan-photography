/* The review page of experiment `journey`: one line for each version, each with Good / Not for
   me and a note. What he marks is saved by the site's own server into ideas/reviews/journey.json
   (on his Mac only), which Claude reads straight from the file; the browser keeps a copy too. */
(() => {
  'use strict';
  const K = window.Kit;
  const { esc, $ } = K;
  const WORDS = {
    en: {
      title: 'Journey, every version',
      intro: 'The same trips, the same facts, six ways of showing them. The first link opens the page; the others open one trip.',
      list: 'All trips', trip: 'One trip: Vietnam', trip2: 'One trip: Australia and New Zealand',
      good: 'Good', bad: 'Not for me', note: 'A note for Claude: what you like, what to change', general: 'Anything else', generalHint: 'Anything about Journey in general',
      saved: 'Saved. Claude can read it.', local: 'Saved in this browser only', how: 'Mark each one and write a note. It saves as you go, and Claude reads it straight away.',
      items: [
        ['A', 'Logbook, now', 'Your pick. One plane leaves Taiwan for each country you have been to, once; then the trips year by year with a strip of photographs. A trip opens on the page "The trip, along its route".', 'logbook.html'],
        ['A1', 'Logbook, first draft', 'The first Logbook: each trip with a small drawing of the shape its route made, and the map with every route at once.', 'logbook-v1.html'],
        ['A2', 'Logbook, second draft', 'Planes always in the air over the map, large year figures, and a trip page of its own where the plane flies each leg as you scroll.', 'logbook-v2.html'],
        ['B', 'Chapters', 'Each trip opens like a chapter of a photo book: one large photograph, its name beneath. A trip reads as a photo essay, stop by stop; the route is drawn once, at the end.', 'chapters.html'],
        ['C', 'Atlas', 'One clean line map held still beside the list of trips. Reading down the list, the map turns to each trip and shows its route.', 'atlas.html'],
        ['', 'The Journey as it is now', 'The pen-and-wash sketchbook map, kept as it was (also safe at the tag journey-pen-and-wash-2026-10-15).', '../wc-sketch/'],
      ],
    },
    zh: {
      title: '旅程：所有版本',
      intro: '同樣的旅行、同樣的資料，六種呈現方式。第一個連結打開整頁，其他直接打開一趟旅行。',
      list: '所有旅程', trip: '一趟：越南', trip2: '一趟：澳洲與紐西蘭',
      good: '喜歡', bad: '不要', note: '給 Claude 的筆記：喜歡什麼、要改什麼', general: '其他想法', generalHint: '對整個旅程頁的想法',
      saved: '已存，Claude 讀得到。', local: '只存在這個瀏覽器', how: '每一版按喜歡或不要，寫一句筆記。打字就會存，Claude 直接讀得到。',
      items: [
        ['A', '旅行日誌，現在', '你選的這版。一架飛機從台灣飛到你去過的每個國家，只飛一次；接著按年份排的旅程和一排照片。點一趟會打開「沿著路線看這趟」。', 'logbook.html'],
        ['A1', '旅行日誌，第一版', '最早的旅行日誌：每趟旁邊有一個路線畫出的小形狀，地圖上一次畫出所有路線。', 'logbook-v1.html'],
        ['A2', '旅行日誌，第二版', '飛機一直在地圖上飛，年份大字，點進去是另做的旅程頁，往下捲時飛機沿著每一段飛。', 'logbook-v2.html'],
        ['B', '章節', '每趟旅行像攝影集的一章：一張大照片，名字在下面。打開一趟，像讀一篇照片散文，一站一站；路線只在最後畫一次。', 'chapters.html'],
        ['C', '地圖集', '一張乾淨的線條地圖，固定在旅行列表旁邊。往下讀，地圖就轉到每一趟、畫出它的路線。', 'atlas.html'],
        ['', '現在的旅程頁', '水彩手繪地圖，原封不動保留（也存在標籤 journey-pen-and-wash-2026-10-15）。', '../wc-sketch/'],
      ],
    },
  };
  // what he marked: { items: { <version>: { verdict, note, seen } }, general, names }
  const NAME = 'journey';
  const KEY = 'journey-review';
  let mine = { items: {} };
  try { mine = JSON.parse(localStorage.getItem(KEY)) || mine; } catch (e) { /* storage blocked */ }
  mine.items = mine.items || {};
  const idOf = (href) => (href.startsWith('..') ? 'current' : href.replace('.html', ''));
  const of = (id) => (mine.items[id] = mine.items[id] || {});

  let timer = 0;
  function save() {
    const w = WORDS[K.lang];
    mine.names = Object.fromEntries(WORDS.en.items.map(([, name, , href]) => [idOf(href), name]));
    try { localStorage.setItem(KEY, JSON.stringify(mine)); } catch (e) { /* storage blocked */ }
    clearTimeout(timer);
    timer = setTimeout(() => {
      fetch(`/__reviews/${NAME}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(mine) })
        .then((r) => { $('#cz-state').textContent = r.ok ? w.saved : w.local; })
        .catch(() => { $('#cz-state').textContent = w.local; });
    }, 500);
  }

  function render() {
    const w = WORDS[K.lang];
    $('#top').innerHTML = K.topbar('journey');
    document.title = `${w.title} · tuan photography 陳亮元`;
    $('#main').innerHTML = `<div class="cz">
      <h1 class="cz__title">${esc(w.title)}</h1>
      <p class="cz__intro">${esc(w.intro)}</p>
      <p class="cz__how">${esc(w.how)}</p>
      <ol class="cz__list">${w.items.map(([m, name, say, href]) => {
        const id = idOf(href), my = mine.items[id] || {};
        return `
        <li class="cz__item" data-id="${id}">
          <span class="cz__mark" aria-hidden="true">${m}</span>
          <h2 class="cz__name">${esc(name)}</h2>
          <p class="cz__say">${esc(say)}</p>
          <p class="cz__go"><a href="${href}">${esc(w.list)}</a>${m ? `<a href="${m === 'A' ? '../wc-sketch/trip/' : href}?trip=2026-08${m === 'A' ? '&from=logbook' : ''}">${esc(w.trip)}</a><a href="${m === 'A' ? '../wc-sketch/trip/' : href}?trip=2026-01${m === 'A' ? '&from=logbook' : ''}">${esc(w.trip2)}</a>` : ''}</p>
          <div class="cz__mine">
            <div class="cz__verdict" role="group" aria-label="${esc(name)}">
              <button type="button" class="cz__v" data-v="good" aria-pressed="${my.verdict === 'good'}">${esc(w.good)}</button>
              <button type="button" class="cz__v" data-v="bad" aria-pressed="${my.verdict === 'bad'}">${esc(w.bad)}</button>
            </div>
            <textarea class="cz__note" rows="2" aria-label="${esc(w.note)}" placeholder="${esc(w.note)}">${esc(my.note || '')}</textarea>
          </div>
        </li>`;
      }).join('')}
      </ol>
      <label class="cz__general"><span class="cz__general-head">${esc(w.general)}</span>
        <textarea class="cz__note" id="cz-general" rows="3" placeholder="${esc(w.generalHint)}">${esc(mine.general || '')}</textarea></label>
      <p class="cz__state" id="cz-state" role="status" aria-live="polite"></p>
    </div>`;
  }

  document.addEventListener('click', (e) => {
    const b = e.target.closest('.cz__v');
    if (b) {
      const it = of(b.closest('.cz__item').dataset.id);
      it.verdict = it.verdict === b.dataset.v ? '' : b.dataset.v;
      b.closest('.cz__verdict').querySelectorAll('.cz__v').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.v === it.verdict)));
      save();
      return;
    }
    const a = e.target.closest('.cz__go a');
    if (a) { of(a.closest('.cz__item').dataset.id).seen = true; save(); }
  });
  document.addEventListener('input', (e) => {
    const t = e.target.closest('.cz__note');
    if (!t) return;
    if (t.id === 'cz-general') mine.general = t.value;
    else of(t.closest('.cz__item').dataset.id).note = t.value;
    save();
  });

  // what the file on his Mac holds wins over this browser's copy (it may come from another browser)
  fetch(`/__reviews/${NAME}`).then((r) => r.json()).then((d) => {
    if (d && d.items) { mine = d; mine.items = mine.items || {}; render(); }
  }).catch(() => { /* no server notes yet */ });
  K.onLang(render);
  render();
})();

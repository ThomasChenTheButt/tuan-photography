/* The review page of experiment `journey`: one line for each direction, and the current one. */
(() => {
  'use strict';
  const K = window.Kit;
  const { esc, $ } = K;
  const WORDS = {
    en: {
      title: 'Journey, every version',
      intro: 'The same trips, the same facts, six ways of showing them. The first link opens the page; the others open one trip.',
      list: 'All trips', trip: 'One trip: Vietnam', trip2: 'One trip: Australia and New Zealand',
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
  function render() {
    const w = WORDS[K.lang];
    $('#top').innerHTML = K.topbar('journey');
    document.title = `${w.title} · tuan photography 陳亮元`;
    $('#main').innerHTML = `<div class="cz">
      <h1 class="cz__title">${esc(w.title)}</h1>
      <p class="cz__intro">${esc(w.intro)}</p>
      <ol class="cz__list">${w.items.map(([m, name, say, href]) => `
        <li class="cz__item">
          <span class="cz__mark" aria-hidden="true">${m}</span>
          <h2 class="cz__name">${esc(name)}</h2>
          <p class="cz__say">${esc(say)}</p>
          <p class="cz__go"><a href="${href}">${esc(w.list)}</a>${m ? `<a href="${m === 'A' ? '../wc-sketch/trip/' : href}?trip=2026-08${m === 'A' ? '&from=logbook' : ''}">${esc(w.trip)}</a><a href="${m === 'A' ? '../wc-sketch/trip/' : href}?trip=2026-01${m === 'A' ? '&from=logbook' : ''}">${esc(w.trip2)}</a>` : ''}</p>
        </li>`).join('')}
      </ol>
    </div>`;
  }
  K.onLang(render);
  render();
})();

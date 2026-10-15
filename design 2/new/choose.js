/* The review page of experiment `journey`: one line for each direction, and the current one. */
(() => {
  'use strict';
  const K = window.Kit;
  const { esc, $ } = K;
  const WORDS = {
    en: {
      title: 'Journey, three new directions',
      intro: 'The same trips, the same facts, three ways of showing them. Each opens on its list of trips; the second link opens one trip.',
      list: 'All trips', trip: 'One trip: Vietnam', trip2: 'One trip: Australia and New Zealand',
      items: [
        ['A', 'Logbook', 'Your trips as a printed log, year by year. Each trip on one ruled line: when, the shape its route drew, where, and a strip of its photographs. A trip reads as a log entry: the route as a line of stops, then each stop with its contact sheet.', 'logbook.html'],
        ['B', 'Chapters', 'Each trip opens like a chapter of a photo book: one large photograph, its name beneath. A trip reads as a photo essay, stop by stop, the photographs large and one at a time; the route is drawn once, at the end.', 'chapters.html'],
        ['C', 'Atlas', 'One clean line map held still beside the list of trips. Reading down the list, the map turns to each trip and shows its route. A trip draws its route stop by stop as you read.', 'atlas.html'],
        ['', 'The Journey as it is now', 'The pen-and-wash sketchbook map, kept as it was (also safe at the tag journey-pen-and-wash-2026-10-15).', '../wc-sketch/'],
      ],
    },
    zh: {
      title: '旅程：三個新方向',
      intro: '同樣的旅行、同樣的資料，三種呈現方式。每個都先打開旅行列表；第二個連結直接打開一趟旅行。',
      list: '所有旅程', trip: '一趟：越南', trip2: '一趟：澳洲與紐西蘭',
      items: [
        ['A', '旅行日誌', '把旅行排成一本印刷的日誌，一年一年往下。每趟一行：時間、路線畫出的形狀、去了哪裡、一排照片。打開一趟，像讀一頁日誌：先是一條站點連成的路線，再是每一站和它的照片小樣。', 'logbook.html'],
        ['B', '章節', '每趟旅行像攝影集的一章：一張大照片，名字在下面。打開一趟，像讀一篇照片散文，一站一站，照片大而一張一張；路線只在最後畫一次。', 'chapters.html'],
        ['C', '地圖集', '一張乾淨的線條地圖，固定在旅行列表旁邊。往下讀，地圖就轉到每一趟、畫出它的路線。打開一趟，邊讀邊一站一站畫出路線。', 'atlas.html'],
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
          <p class="cz__go"><a href="${href}">${esc(w.list)}</a>${m ? `<a href="${href}?trip=2026-08">${esc(w.trip)}</a><a href="${href}?trip=2026-01">${esc(w.trip2)}</a>` : ''}</p>
        </li>`).join('')}
      </ol>
    </div>`;
  }
  K.onLang(render);
  render();
})();

/* Ridgeline. On empty paper, ink lines draw the photograph's own edges: the frame of the car
   window, the far shore of the lake, the ridge of Aoraki. Then the paper splits along the ridge
   that was just drawn: the sky half lifts away, the land half drops away, and the photograph the
   lines were traced from is there beneath. The drawn line becomes the cut, so no line ever lies
   on the photograph: each half carries its own half of the ink out of the window.
   The lines are traced from the lead photograph itself (new-zealand-aoraki-window.jpg, 2600 x
   1818): the ridge snapped to the photograph's strongest sky edge, the shore to the lake's edge,
   the window frame to the dark of the car. They are placed with the page's own cover crop. */
window.Openings.ridgeline = function (o) {
  'use strict';
  // the photograph's skeleton, in the full-size photograph's pixels (x, y, x, y, ...);
  // at: when each line starts and ends drawing, in ms
  const FRAME_TOP = [0,91,114,87,265,100,543,132,734,158,850,177,963,198,1156,241,1349,293,1502,342,1542,352,1646,389,1799,449,1882,486,2080,583,2292,699,2338,732,2383,758,2600,897];
  const FRAME_LEFT = [0,470,25,559,52,633,132,873,208,1210,279,1441,317,1589,333,1658,350,1752,363,1780,380,1792,401,1802,464,1818];
  const RIDGE = [95,771,119,773,127,772,139,767,155,755,167,752,175,752,191,759,203,760,211,756,227,742,239,737,255,742,267,743,275,742,287,723,303,704,315,695,323,690,359,675,367,674,391,676,399,680,415,694,427,708,431,709,443,706,451,706,467,717,495,743,527,747,539,752,555,755,595,754,623,757,643,751,675,751,711,756,747,771,751,772,763,767,767,767,779,772,787,774,811,765,831,744,875,714,895,693,923,681,931,669,947,650,971,632,983,630,987,628,1031,595,1043,588,1059,570,1063,569,1079,571,1091,569,1111,560,1131,557,1139,558,1155,570,1179,576,1199,585,1203,588,1215,611,1219,615,1235,617,1239,619,1243,625,1255,654,1259,658,1279,662,1303,680,1311,680,1315,677,1323,666,1331,660,1363,652,1379,643,1387,642,1411,651,1435,653,1447,658,1459,666,1475,674,1495,694,1511,705,1531,707,1551,699,1559,698,1567,700,1607,717,1627,731,1635,740,1639,741,1647,740,1659,729,1679,715,1687,716,1699,720,1719,733,1723,734,1727,734,1751,724,1767,714,1783,708,1811,686,1819,683,1839,680,1859,666,1891,661,1919,652,1943,648,1955,649,1979,669,2023,679,2043,689,2071,693,2095,704,2115,718,2135,724,2147,726,2163,726,2187,718,2211,708,2235,710,2247,703,2255,702,2275,707,2287,713,2307,720,2327,733,2339,736];
  const LINES = [
    { k: 'frame', at: [0, 1200], pts: FRAME_TOP },
    { k: 'frame', at: [100, 1300], pts: FRAME_LEFT },
    { k: 'frame', at: [200, 1350], pts: [2430,1253,2370,1269,2342,1283,2324,1298,2306,1322,2289,1355,2263,1431,2240,1528,2230,1594,2227,1646,2229,1681,2240,1734,2267,1818] },
    { k: 'horizon', at: [250, 1450], pts: [200,1159,392,1159,576,1168,880,1169,976,1166,1080,1168,1176,1164,1280,1171,1696,1172,1784,1176,1936,1179,2056,1186,2552,1192] },
    { k: 'ridge', at: [400, 2000], pts: RIDGE },
  ];
  // the cut runs edge to edge along drawn lines only: down the window's left frame to where the
  // ridge meets it, along the whole ridge, then down the top frame from where the ridge meets it
  const CUT = [0,470,25,559,52,633].concat(RIDGE, [2383,758,2600,897]);
  const SPLIT = 2500, PART = 900;   // drawn by 2 s; half a beat; the paper parts in 0.9 s, ending near 3.4 s

  const stage = o.stage('paper op-rl');
  o.style(`
    .op-rl img { position: absolute; inset: 0; width: 100%; height: 100%; max-width: none; object-fit: cover; }
    .op-rl .sheet { position: absolute; inset: 0; background: var(--bg); will-change: transform; }
    .op-rl svg { position: absolute; inset: 0; display: block; overflow: hidden; }
    .op-rl path { fill: none; stroke: var(--text); stroke-linecap: round; stroke-linejoin: round; }
  `);
  const img = new Image(); img.alt = ''; img.decoding = 'async';
  const sheet = document.createElement('div'); sheet.className = 'sheet';
  stage.append(img, sheet);

  const W = innerWidth, H = innerHeight;
  const phone = W < 720;
  const portrait = H > W;
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('width', W); svg.setAttribute('height', H);
  sheet.appendChild(svg);

  // place each line exactly where the cover crop puts that edge of the photograph, and measure
  // only the part of it the window shows, so the drawing never spends its time off screen
  const f = o.fit(o.lead, W, H);
  const map = (pts) => { const P = []; for (let i = 0; i < pts.length; i += 2) P.push([f.x + pts[i] * f.s, f.y + pts[i + 1] * f.s]); return P; };
  const thin = phone ? 1.5 : 1.25, bold = phone ? 2 : 1.5;
  const inside = (x, y) => x >= -2 && y >= -2 && x <= W + 2 && y <= H + 2;
  const lines = [];
  LINES.forEach((L) => {
    if (L.k === 'frame' && portrait) return;   // on a tall window the frame is only fragments
    const P = map(L.pts);
    const cum = [0];
    for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    let a = -1, b = -1;
    for (let i = 1; i < P.length; i++) {
      let seen = false;
      for (let k = 0; k <= 8 && !seen; k++) {
        const t = k / 8;
        seen = inside(P[i - 1][0] + (P[i][0] - P[i - 1][0]) * t, P[i - 1][1] + (P[i][1] - P[i - 1][1]) * t);
      }
      if (seen) { if (a < 0) a = cum[i - 1]; b = cum[i]; }
    }
    if (a < 0) return;   // this edge is cropped out at this window's shape
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', 'M' + P.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L'));
    path.setAttribute('stroke-width', L.k === 'ridge' ? bold : thin);
    const total = cum[cum.length - 1];
    path.style.strokeDasharray = total.toFixed(1) + ' ' + (total + 4).toFixed(1);
    path.style.strokeDashoffset = (total - a + 2).toFixed(1);
    svg.appendChild(path);
    lines.push({ path, at: L.at, a, b, total });
  });

  // the two halves of the paper, cut along the drawn line and carried just clear of the window
  const C = map(CUT);
  C.unshift([-60, C[0][1]]); C.push([W + 60, C[C.length - 1][1]]);
  const poly = (extra) => 'polygon(' + C.concat(extra).map((p) => p[0].toFixed(1) + 'px ' + p[1].toFixed(1) + 'px').join(',') + ')';
  let low = 0, high = H;
  C.forEach((p) => { if (p[0] >= -2 && p[0] <= W + 2) { low = Math.max(low, p[1]); high = Math.min(high, p[1]); } });
  const up = Math.min(H, Math.max(0, low)) + 8, down = H - Math.max(0, Math.min(H, high)) + 8;
  let halves = null;
  function part() {
    const sky = sheet, land = sheet.cloneNode(true);
    sky.style.clipPath = poly([[W + 60, -60], [-60, -60]]);
    land.style.clipPath = poly([[W + 60, H + 60], [-60, H + 60]]);
    stage.appendChild(land);
    halves = [sky, land];
  }

  // the drawing needs no photograph, so it starts at once; the paper only parts once the
  // photograph beneath it is decoded, holding a little longer on a slow connection
  const src = o.src(o.lead);
  img.src = src;
  let ready = 0;
  o.load(src).then(() => (img.decode ? img.decode().catch(() => {}) : null)).then(() => { ready = performance.now(); });
  const t0 = performance.now();
  function frame(now) {
    const t = now - t0;
    if (!halves) lines.forEach((l) => {
      const e = o.easeInOut(o.clamp((t - l.at[0]) / (l.at[1] - l.at[0])));
      l.path.style.strokeDashoffset = (e > 0 ? l.total - (l.a + (l.b - l.a) * e) : l.total - l.a + 2).toFixed(1);
    });
    const start = ready ? Math.max(SPLIT, ready - t0 + 150) : Infinity;
    if (t >= start) {
      if (!halves) part();
      const e = o.easeInOut(o.clamp((t - start) / PART));
      halves[0].style.transform = 'translate3d(0,' + (-up * e).toFixed(1) + 'px,0)';
      halves[1].style.transform = 'translate3d(0,' + (down * e).toFixed(1) + 'px,0)';
    }
    if (t < start + PART) requestAnimationFrame(frame);
    else { halves.forEach((h) => h.remove()); o.done(stage, 40); }
  }
  requestAnimationFrame(frame);
};

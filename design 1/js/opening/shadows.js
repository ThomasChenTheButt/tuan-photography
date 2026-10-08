/* Shadows. On the paper, a dozen torn scraps stand on one line, a jumble. A light walks across
   from the left and their shadows swing with it, long and leaning, sliding over each other. At
   one angle the shadows meet and are, for an instant, the ridge of Aoraki and the dark edge of
   the car window. In that instant the shadow is the photograph's own dark, the lit paper warms
   into its sky, the scraps are gone, and the picture is there.
   The silhouette is the photograph's own land mass, between the ridge traced for `ridgeline`
   and the lake's horizon, placed with the page's cover crop. It is cut into vertical pieces;
   each piece is one scrap's shadow, leaning by its own amount as the light moves, so they only
   coincide at the true angle. */
window.Openings.shadows = function (o) {
  'use strict';
  const RIDGE = [0,470,25,559,52,633,95,771,119,773,127,772,139,767,155,755,167,752,175,752,191,759,203,760,211,756,227,742,239,737,255,742,267,743,275,742,287,723,303,704,315,695,323,690,359,675,367,674,391,676,399,680,415,694,427,708,431,709,443,706,451,706,467,717,495,743,527,747,539,752,555,755,595,754,623,757,643,751,675,751,711,756,747,771,751,772,763,767,767,767,779,772,787,774,811,765,831,744,875,714,895,693,923,681,931,669,947,650,971,632,983,630,987,628,1031,595,1043,588,1059,570,1063,569,1079,571,1091,569,1111,560,1131,557,1139,558,1155,570,1179,576,1199,585,1203,588,1215,611,1219,615,1235,617,1239,619,1243,625,1255,654,1259,658,1279,662,1303,680,1311,680,1315,677,1323,666,1331,660,1363,652,1379,643,1387,642,1411,651,1435,653,1447,658,1459,666,1475,674,1495,694,1511,705,1531,707,1551,699,1559,698,1567,700,1607,717,1627,731,1635,740,1639,741,1647,740,1659,729,1679,715,1687,716,1699,720,1719,733,1723,734,1727,734,1751,724,1767,714,1783,708,1811,686,1819,683,1839,680,1859,666,1891,661,1919,652,1943,648,1955,649,1979,669,2023,679,2043,689,2071,693,2095,704,2115,718,2135,724,2147,726,2163,726,2187,718,2211,708,2235,710,2247,703,2255,702,2275,707,2287,713,2307,720,2327,733,2339,736,2383,758,2600,897];
  const HORIZON = [0,1159,392,1159,576,1168,880,1169,976,1166,1080,1168,1176,1164,1280,1171,1696,1172,1784,1176,1936,1179,2056,1186,2600,1192];
  const N = 12;                                        // scraps
  const T_IN = 500, T_SWEEP = 3000, T_HOLD = 260, T_FADE = 450;

  const stage = o.stage('paper op-sh');
  o.style(`
    .op-sh svg { position: absolute; inset: 0; display: block; }
    .op-sh .light { position: absolute; inset: 0; background: radial-gradient(ellipse 90% 55% at var(--lx, 0%) 118%, oklch(99.4% 0.005 85 / 0.7), transparent 72%); }
    .op-sh .shadow { fill: var(--text); opacity: 0.86; }
    .op-sh .scrap { fill: var(--card); stroke: var(--line); stroke-width: 0.8; }
    .op-sh .scrap.in { transition: opacity 400ms var(--out); }
    .op-sh .fade { opacity: 0 !important; transition: opacity ${T_FADE}ms var(--out); }
  `);
  const light = document.createElement('div'); light.className = 'light';
  const W = innerWidth, H = innerHeight;
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('width', W); svg.setAttribute('height', H);
  stage.append(light, svg);

  // the silhouette in window pixels, as the cover crops the photograph
  const f = o.fit(o.lead, W, H);
  const map = (pts) => { const P = []; for (let i = 0; i < pts.length; i += 2) P.push([f.x + pts[i] * f.s, f.y + pts[i + 1] * f.s]); return P; };
  const ridge = map(RIDGE), horizon = map(HORIZON);
  const silhouette = 'M' + ridge.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'L' + horizon.slice().reverse().map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'Z';
  const baseY = (horizon[0][1] + horizon[horizon.length - 1][1]) / 2;   // the line the scraps stand on

  const defs = document.createElementNS(NS, 'defs');
  svg.appendChild(defs);
  const shadows = document.createElementNS(NS, 'g');
  const scraps = document.createElementNS(NS, 'g');
  svg.append(shadows, scraps);

  // a fixed scatter, the same every visit
  let seed = 11;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const x0 = Math.max(0, ridge[0][0]), x1 = Math.min(W, ridge[ridge.length - 1][0]);
  const pieces = [];
  for (let i = 0; i < N; i++) {
    const a = x0 + (x1 - x0) * i / N, b = x0 + (x1 - x0) * (i + 1) / N, cx = (a + b) / 2;
    const clip = document.createElementNS(NS, 'clipPath'); clip.id = 'op-sh-' + i;
    const r = document.createElementNS(NS, 'rect');
    r.setAttribute('x', a - 1.5); r.setAttribute('y', 0); r.setAttribute('width', b - a + 3); r.setAttribute('height', H);   // a hair of overlap, so no seam shows when they meet
    clip.appendChild(r); defs.appendChild(clip);
    const sh = document.createElementNS(NS, 'path');
    sh.setAttribute('class', 'shadow'); sh.setAttribute('d', silhouette); sh.setAttribute('clip-path', `url(#op-sh-${i})`);
    shadows.appendChild(sh);
    // the scrap: a small torn rectangle standing on the line, nothing like its shadow
    // seen from above, a scrap standing on the line is a short shape below it, toward you; its shadow falls away, up the paper
    const w = (b - a) * (0.4 + rnd() * 0.3), h = (0.035 + rnd() * 0.045) * H, sx = cx + (rnd() - 0.5) * (b - a) * 0.3;
    const tear = [];
    for (let k = 0; k <= 6; k++) tear.push([sx - w / 2 + w * k / 6, baseY + h + (rnd() - 0.5) * h * 0.3]);
    const sc = document.createElementNS(NS, 'path');
    sc.setAttribute('class', 'scrap');
    sc.setAttribute('d', `M${sx - w / 2} ${baseY + 1}L` + tear.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + `L${sx + w / 2} ${baseY + 1}Z`);
    sc.style.opacity = '0';
    scraps.appendChild(sc);
    // how far this scrap's shadow leans away from the truth per degree of light, its own amount
    const lean = (0.35 + rnd() * 0.65) * (rnd() < 0.5 ? -1 : 1);
    pieces.push({ sh, sc, cx, lean });
  }

  o.ready.then(() => {
    const t0 = performance.now();
    pieces.forEach((p, i) => setTimeout(() => { p.sc.classList.add('in'); p.sc.style.opacity = '1'; }, 60 + i * 30));
    let done = false;
    function frame(now) {
      const t = now - t0 - T_IN;
      const u = o.clamp(t / T_SWEEP);
      const e = 1 - Math.pow(1 - u, 2.2);                 // the light walks, slowing as it arrives
      const d = -36 * (1 - e);                            // degrees from the true angle; 0 at the end
      light.style.setProperty('--lx', (10 + 80 * e).toFixed(1) + '%');
      const stretch = 1 + 0.35 * Math.min(1, Math.abs(d) / 36);   // low light, long shadows
      pieces.forEach((p) => {
        const a = d * p.lean;
        p.sh.setAttribute('transform', `translate(${p.cx} ${baseY}) skewX(${a.toFixed(3)}) scale(1 ${stretch.toFixed(4)}) translate(${-p.cx} ${-baseY})`);
      });
      if (u < 1) { requestAnimationFrame(frame); return; }
      if (done) return; done = true;
      // the shadows are the ridge: the paper warms into the photograph, the scraps go
      setTimeout(() => { scraps.classList.add('fade'); light.classList.add('fade'); o.done(stage, 0); }, T_HOLD);
    }
    requestAnimationFrame(frame);
  });
};

/* The Outline. The photograph arrives whole except for the mountains: where the range stands
   there is only the page's own paper, cut exactly to their shape, and the eye reads the land
   and the hole at once. The camera barely moves. Then, in one beat, Aoraki and its range fill
   their own outline and the frame is the cover.
   Borrowed from the main title of The Leftovers, season 2 (Elastic, 2015): a photograph that is
   whole except for one shape. Only that quality; nothing of its montage, skies or subject.
   The shape is held as a region, never drawn as a line. No words. */
window.Openings.outline = function (o) {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  // the range against the sky, then the land line beneath it, in percent of the photograph;
  // traced from the opening photograph itself (the ridge a hair high, so no rock shows above it)
  const HOLE = [
    0, 42.85, 2, 42.45, 4, 42.21, 4.5, 42.35, 5, 42.75, 5.5, 42.05, 6, 41.15, 6.4, 41.35,
    6.7, 41.15, 7, 41.2, 7.5, 41.75, 8, 41.55, 8.3, 40.95, 8.8, 40.45, 9.2, 40.25, 9.6, 40.45,
    10, 40.55, 10.2, 40.35, 10.4, 40.55, 10.6, 40.85, 11.3, 39.71, 11.8, 38.68, 12.5, 37.75,
    13.5, 37.05, 14, 36.59, 14.4, 36.78, 15, 36.95, 15.8, 37.88, 16.6, 40.45, 17, 40.65,
    17.5, 41.15, 18, 41.25, 18.5, 40.92, 19, 40.92, 20, 41.05, 20.5, 41.2, 21, 41.15, 22, 41.35,
    24, 41.49, 25, 41.35, 25.5, 41.05, 26, 41.02, 26.5, 41.2, 27.5, 41.85, 28, 42.05, 28.8, 42.55,
    29.6, 42.75, 31, 42.15, 32, 40.75, 33, 39.15, 33.5, 38.25, 34, 37.65, 35, 37.15, 35.4, 36.85,
    35.9, 36.05, 36.2, 35.25, 36.7, 34.85, 37.2, 34.25, 37.9, 33.05, 38.5, 32.75, 39.5, 32.05,
    40, 31.6, 40.75, 31.05, 41.3, 31.3, 41.8, 31.15, 42.2, 30.75, 42.6, 30.45, 43.3, 30.5,
    43.78, 30.15, 43.95, 30.4, 44.4, 31.3, 45, 32.15, 46.5, 34.55, 47, 35.15, 47.4, 35.75,
    48.7, 36.2, 49.3, 36.35, 50, 37.2, 50.2, 37.3, 51, 36.45, 51.5, 36.25, 52, 35.85, 53.25, 34.7,
    54, 35.55, 54.5, 35.85, 55, 35.82, 55.5, 35.95, 56, 36.45, 56.5, 36.75, 58, 38.55, 58.5, 38.75,
    58.9, 38.85, 59.2, 38.55, 59.6, 38.25, 60, 38.15, 60.5, 38.25, 61, 38.45, 62, 39.45,
    62.5, 39.85, 62.9, 39.92, 63.7, 39.55, 64, 39.35, 64.3, 38.95, 64.7, 38.75, 65.6, 39.55,
    66, 39.75, 66.4, 39.6, 66.8, 39.85, 67, 39.75, 68, 38.95, 68.5, 38.75, 68.8, 38.45, 69, 37.95,
    69.5, 37.55, 70.3, 37.25, 70.8, 37.15, 71.1, 36.55, 71.5, 36.35, 72, 36.35, 72.5, 36.25,
    73, 35.95, 73.5, 35.75, 74, 35.65, 74.5, 35.45, 75, 35.45, 75.5, 35.75, 76.5, 36.75, 77, 37.1,
    77.4, 36.95, 77.9, 37.1, 78.3, 37.55, 80.1, 38.15, 80.7, 38.6, 81, 38.95, 82.1, 39.6,
    82.5, 39.75, 83, 39.85, 84.2, 39.25, 84.75, 38.85, 85.2, 38.65, 85.6, 38.95, 85.9, 39.05,
    86.3, 38.6, 86.7, 38.45, 87.2, 38.6, 87.55, 38.85, 88, 38.85, 90, 39.85, 93, 41.85, 96, 44.85,
    100, 46.85, 100, 51.5, 96, 51.78, 95.85, 51.89, 94.85, 51.84, 94.75, 51.95, 93.1, 51.95,
    92.95, 51.84, 92.6, 51.84, 92.05, 51.95, 91.8, 51.78, 91.6, 51.78, 91.2, 52.06, 90.15, 51.95,
    89.8, 52.11, 89.3, 52.11, 89, 52.28, 88.5, 52.22, 87.2, 52.5, 86.2, 52.33, 85.8, 52.44,
    85.65, 52.66, 85.1, 52.88, 84.05, 52.83, 83.5, 53.1, 82.05, 53.16, 82, 53.38, 81.2, 53.32,
    79.8, 53.6, 78.7, 53.49, 78.65, 53.21, 78.45, 53.16, 78.25, 53.27, 78.15, 53.54, 77.9, 53.6,
    77.5, 53.98, 76.85, 54.04, 76.65, 53.87, 76.3, 53.87, 76.1, 54.2, 75.25, 54.37, 74.2, 54.31,
    73.85, 54.48, 73.1, 54.42, 72.8, 54.59, 71.6, 54.59, 71.35, 54.42, 71.25, 53.76, 71.15, 53.6,
    70.95, 53.54, 70.9, 53.27, 70.7, 53.27, 70.3, 53.93, 70.1, 53.98, 70, 54.15, 69.75, 54.15,
    69.5, 53.76, 69.15, 53.76, 69, 52.99, 68.6, 52.99, 68.35, 53.27, 68.25, 53.27, 68.1, 53.54,
    68.05, 54.09, 67.9, 54.15, 67.75, 54.53, 67.6, 54.64, 65.75, 54.59, 65.3, 54.53, 65.15, 54.42,
    63.1, 54.37, 62.75, 54.26, 62.6, 54.09, 62.4, 54.09, 62.25, 54.26, 61, 54.31, 60.9, 54.15,
    60.7, 54.15, 60.3, 54.31, 58.8, 54.37, 58.4, 54.31, 58.3, 53.76, 58.05, 53.76, 57.9, 54.26,
    57.15, 54.42, 56.75, 54.7, 55.75, 54.75, 55.2, 54.59, 55.15, 54.04, 54.7, 54.04, 54.65, 53.93,
    54.25, 53.87, 54.15, 53.76, 54.1, 52.44, 53.85, 52.39, 53.7, 52.66, 53.2, 52.72, 53.15, 53.43,
    52.7, 53.38, 52.55, 53.16, 51.85, 53.16, 51.7, 53.27, 51.5, 53.6, 51.45, 54.2, 51.25, 54.31,
    51, 54.7, 49.9, 54.59, 49.75, 54.53, 49.5, 54.2, 49.1, 54.2, 48.95, 54.59, 48.6, 54.59,
    48.35, 54.26, 48.15, 53.49, 47.85, 53.49, 47.6, 53.32, 47.4, 53.32, 46.85, 53.82, 46.25, 53.82,
    46.05, 54.04, 45.8, 54.59, 44.65, 54.64, 44.6, 53.76, 44.5, 53.65, 44.2, 53.54, 43.9, 53.05,
    43.3, 53.1, 43.15, 52.88, 42.95, 52.88, 42.8, 53.05, 42.5, 53.1, 42.45, 53.71, 42.2, 53.76,
    41.9, 54.59, 41.6, 54.64, 41.35, 54.42, 41.1, 54.48, 41.05, 55.03, 40.75, 55.08, 40.5, 54.97,
    40.2, 55.19, 38.75, 55.3, 36.45, 55.3, 35.5, 55.41, 34, 55.36, 33.8, 55.47, 30.95, 55.69,
    30.15, 55.69, 29.9, 55.52, 29.65, 55.52, 29.4, 55.19, 28.95, 55.03, 28.8, 54.7, 28.5, 54.37,
    28.45, 54.15, 28.2, 54.04, 27.95, 54.04, 27.8, 54.26, 27.4, 54.26, 27.3, 54.15, 27.1, 54.15,
    26.25, 54.86, 25.85, 54.92, 25.75, 54.37, 25.2, 54.31, 25.15, 53.98, 25, 53.87, 24.95, 52.94,
    24.8, 52.94, 24.7, 52.72, 24.4, 52.72, 24.2, 52.83, 24.15, 53.43, 24, 53.54, 23.75, 54.31,
    23.7, 55.03, 23.5, 55.03, 23.45, 54.86, 23.35, 54.86, 23.3, 54.59, 23.05, 54.42, 22.7, 54.42,
    22.5, 54.48, 22.45, 54.59, 21.9, 54.59, 21.55, 55.8, 21.45, 56.68, 20.85, 57.01, 20.1, 57.23,
    19.35, 57.23, 19.05, 56.95, 18.65, 56.95, 18.5, 56.9, 18.35, 56.68, 18, 56.62, 17.95, 56.4,
    17.85, 56.35, 17.8, 55.8, 17.5, 55.85, 17.3, 56.46, 17.05, 56.46, 16.85, 56.02, 16.25, 56.02,
    16.1, 56.29, 15.85, 56.29, 15.8, 53.76, 15.2, 53.76, 15, 53.32, 14.35, 53.43, 14.15, 52.61,
    13.9, 52.5, 13.35, 52.5, 13.15, 52.22, 12.6, 52.17, 12.35, 51.95, 12.3, 51.78, 11.65, 51.78,
    11.55, 51.67, 11.05, 51.73, 10.9, 51.62, 10.55, 51.62, 10.3, 51.73, 9.4, 51.73, 8.9, 51.67,
    8.45, 51.4, 8.1, 51.4, 7.65, 51.73, 7.5, 51.73, 7.35, 51.56, 7.05, 51.56, 6.75, 51.78,
    6.2, 51.78, 6.1, 51.67, 5.95, 51.73, 5.7, 51.62, 5.45, 51.78, 5.15, 51.78, 4.9, 51.56,
    4.5, 51.4, 0, 52,
  ];
  // the car window's opening: the paper goes behind the soft dark frame, as the mountains do
  const WINDOW = [
    0, 20, 0.2, 26, 0.9, 30, 1.4, 34, 2.1, 36, 2.4, 38, 2.8, 40, 3.2, 42, 4.2, 44, 4.5, 46, 4.9, 48,
    5.2, 50, 6.6, 52, 7.4, 54, 7.4, 62, 110, 62, 110, 52, 99.9, 50, 97.9, 48, 95.7, 46, 93.5, 44,
    91.3, 42, 88.8, 40, 87.1, 38, 84.6, 36, 82, 34, 79.4, 32, 76.6, 30, 73.7, 28, 70.7, 26, 61.7, 20,
  ];
  const SUMMIT = [43.78, 30.3];

  const p = o.lead, pw = p.w, ph = p.h;
  const pts = (list) => {
    let s = '';
    for (let i = 0; i < list.length; i += 2) s += (i ? 'L' : 'M') + (list[i] * pw / 100).toFixed(1) + ' ' + (list[i + 1] * ph / 100).toFixed(1);
    return s + 'Z';
  };

  const stage = o.stage('paper');
  stage.classList.add('op-ol');
  o.style(`
    .op-ol svg { position: absolute; display: block; max-width: none; opacity: 0; will-change: transform, opacity; }
    .op-ol .hole { fill: var(--bg); }
  `);

  // the box the page's cover fills (the window, unless the cover's own limits say otherwise)
  const r = o.cover.getBoundingClientRect();
  const W = r.width || innerWidth, H = r.height || innerHeight;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${pw} ${ph}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');   // object-fit: cover, centred
  svg.setAttribute('width', W); svg.setAttribute('height', H);
  svg.style.left = r.left + 'px'; svg.style.top = r.top + 'px';
  svg.style.width = W + 'px'; svg.style.height = H + 'px';
  svg.innerHTML =
    `<defs>
      <filter id="op-ol-soft" filterUnits="userSpaceOnUse" x="-300" y="-300" width="${pw + 600}" height="${ph + 600}"><feGaussianBlur stdDeviation="${(pw * 0.0075).toFixed(1)}"/></filter>
      <mask id="op-ol-win" maskUnits="userSpaceOnUse" x="0" y="0" width="${pw}" height="${ph}"><path d="${pts(WINDOW)}" fill="#fff" filter="url(#op-ol-soft)"/></mask>
    </defs>
    <image width="${pw}" height="${ph}" preserveAspectRatio="none"/>
    <path class="hole" d="${pts(HOLE)}" mask="url(#op-ol-win)"/>`;
  const image = svg.querySelector('image'), hole = svg.querySelector('.hole');
  stage.appendChild(svg);

  // the very file the cover shows, so the hand-over is the same pixels
  o.ready.then(() => {
    const href = o.img.currentSrc || o.src(p);
    return o.load(href).then((im) => { image.setAttribute('href', href); return im.decode ? im.decode().catch(() => {}) : null; });
  }).then(() => {
    // the camera settles on the summit: where it sits on screen once the photograph is cover-fitted
    const f = o.fit(p, W, H);
    svg.style.transformOrigin = `${(f.x + f.w * SUMMIT[0] / 100).toFixed(1)}px ${(f.y + f.h * SUMMIT[1] / 100).toFixed(1)}px`;
    const START = 1.05;
    const IN0 = 150, IN1 = 850;     // the photograph comes up out of the paper; the outline stays paper
    const BEAT = 2300;              // the mountains fill their outline, in one frame
    const END = 3100;               // held as the cover, then handed to the page
    const t0 = performance.now();
    let filled = false;
    function frame(now) {
      const t = now - t0;
      svg.style.opacity = o.easeOut(o.clamp((t - IN0) / (IN1 - IN0))).toFixed(3);
      if (t < BEAT) {
        const s = START - (START - 1) * o.easeOut(o.clamp(t / BEAT));
        svg.style.transform = `scale(${s.toFixed(5)})`;
      } else if (!filled) {
        filled = true;
        hole.remove();
        svg.style.transform = 'none';
        svg.style.willChange = 'auto';
      }
      if (t < END) requestAnimationFrame(frame);
      else { svg.style.opacity = '1'; o.done(stage, 0); }
    }
    requestAnimationFrame(frame);
  });
};

/* Book. The printed travel journal, closed, on the paper. The cover swings open; the first
   plate is the photograph, and the camera moves into it until it is the window. From his
   list: the guidebooks on the shelf, Foliom's bookshelf. */
window.Openings.book = function (o) {
  'use strict';
  const stage = o.stage('paper');
  o.style(`
    .op-bk .scene { position: absolute; inset: 0; perspective: 1600px; perspective-origin: 50% 50%; }
    .op-bk .book { position: absolute; left: 50%; top: 50%; width: var(--w); height: var(--h); margin: calc(var(--h) / -2) 0 0 calc(var(--w) / -2); transform-style: preserve-3d; }
    .op-bk .page { position: absolute; inset: 0; background: var(--card); overflow: hidden; box-shadow: 0 18px 40px -18px oklch(20% 0.02 60 / 0.5); }
    .op-bk .page img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .op-bk .cover { position: absolute; inset: 0; transform-origin: left center; transform-style: preserve-3d; transform: translateZ(1px); }
    .op-bk .cover .front, .op-bk .cover .back { position: absolute; inset: 0; }
    .op-bk .cover.turned .front { visibility: hidden; }
    .op-bk .cover:not(.turned) .back { visibility: hidden; }
    .op-bk .cover .front { background: var(--slate); box-shadow: inset 0 0 0 1px oklch(20% 0.02 60 / 0.3), inset 10px 0 14px -12px oklch(20% 0.02 60 / 0.6); }
    .op-bk .cover .front i { position: absolute; left: 10%; right: 10%; top: 12%; height: 56%; display: block; overflow: hidden; }
    .op-bk .cover .front i img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .op-bk .cover .front b { position: absolute; left: 10%; right: 10%; top: 73%; display: block; font-family: var(--serif); font-weight: 400; color: var(--paper); font-size: calc(var(--w) * 0.075); line-height: 1.15; }
    .op-bk .cover .front s { position: absolute; left: 10%; top: 86%; text-decoration: none; font-size: calc(var(--w) * 0.03); letter-spacing: 0.2em; text-transform: uppercase; color: var(--paper); opacity: 0.8; }
    .op-bk .cover .back { background: var(--paper); transform: rotateY(180deg); }
    .op-bk .spine { position: absolute; left: 0; top: 0; width: calc(var(--w) * 0.06); height: 100%; background: oklch(from var(--slate) calc(l - 0.08) c h); transform-origin: left center; transform: rotateY(-90deg); }
    .op-bk .big { position: absolute; object-fit: cover; display: block; }
  `);
  stage.classList.add('op-bk');
  const W = innerWidth, H = innerHeight;
  const h = Math.min(H * 0.62, W * 0.5 * 17 / 12), w = h * 12 / 17;
  const scene = document.createElement('div'); scene.className = 'scene';
  const book = document.createElement('div'); book.className = 'book';
  book.style.setProperty('--w', w + 'px'); book.style.setProperty('--h', h + 'px');
  const page = document.createElement('div'); page.className = 'page';
  const plate = new Image(); plate.src = o.src(o.lead); plate.alt = ''; page.appendChild(plate);
  const cover = document.createElement('div'); cover.className = 'cover';
  const front = document.createElement('div'); front.className = 'front';
  const win = document.createElement('i'); const ci = new Image(); ci.src = o.src(o.lead, 1280); ci.alt = ''; win.appendChild(ci);
  const title = document.createElement('b'); title.textContent = /^zh/.test(document.documentElement.lang) ? '紐西蘭' : 'New Zealand';
  const series = document.createElement('s'); series.textContent = 'tuan photography';
  front.append(win, title, series);
  const back = document.createElement('div'); back.className = 'back';
  cover.append(front, back);
  const spine = document.createElement('div'); spine.className = 'spine';
  book.append(page, cover, spine);
  scene.appendChild(book); stage.appendChild(scene);
  const big = new Image(); big.className = 'big'; big.src = plate.src; big.alt = '';
  const ease = 'cubic-bezier(0.16, 1, 0.3, 1)';
  o.load(plate.src).then(() => {
    // the book arrives, lying a little toward you
    book.animate([{ opacity: 0, transform: 'rotateX(12deg) rotateY(-18deg) translateZ(-120px)' }, { opacity: 1, transform: 'rotateX(8deg) rotateY(-14deg) translateZ(0)' }], { duration: 1100, easing: ease, fill: 'both' });
    setTimeout(() => {
      // the cover opens
      cover.animate([{ transform: 'translateZ(1px) rotateY(0deg)' }, { transform: 'translateZ(1px) rotateY(-165deg)' }], { duration: 1500, easing: ease, fill: 'both' });
      setTimeout(() => cover.classList.add('turned'), 420);   // past edge-on, the inside of the cover shows
      book.animate([{ transform: 'rotateX(8deg) rotateY(-14deg)' }, { transform: 'rotateX(0deg) rotateY(0deg)' }], { duration: 1500, easing: ease, fill: 'both' });
    }, 1300);
    setTimeout(() => {
      // into the plate
      const r = page.getBoundingClientRect();
      const from = { x: r.left, y: r.top, w: r.width, h: r.height };
      stage.appendChild(big);
      const T = 1300, t0 = performance.now();
      function frame(now) {
        const g = o.easeInOut(o.clamp((now - t0) / T));
        big.style.left = (from.x * (1 - g)).toFixed(1) + 'px';
        big.style.top = (from.y * (1 - g)).toFixed(1) + 'px';
        big.style.width = (from.w + (W - from.w) * g).toFixed(1) + 'px';
        big.style.height = (from.h + (H - from.h) * g).toFixed(1) + 'px';
        scene.style.opacity = (1 - g).toFixed(3);
        if (g < 1) requestAnimationFrame(frame); else o.done(stage, 120);
      }
      requestAnimationFrame(frame);
    }, 3300);
  });
};

/* Scroll to open. Nothing plays by itself. A small print lies on the paper; the visitor's
   own scroll opens it until it is the window, and the page begins. From his list: Igloo's
   one object slowly revealed, and his word on Noomo: the page should move when he scrolls. */
window.Openings.grow = function (o) {
  'use strict';
  const stage = o.stage('paper');
  o.style(`
    .op-gr img { position: absolute; object-fit: cover; display: block; }
    .op-gr .word { position: absolute; left: 50%; transform: translateX(-50%); font-size: 0.72rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--text-2); white-space: nowrap; transition: opacity 400ms var(--out); }
    html[lang|="zh"] .op-gr .word { letter-spacing: 0.14em; }
  `);
  stage.classList.add('op-gr');
  const W = innerWidth, H = innerHeight;
  const zh = /^zh/.test(document.documentElement.lang);
  const w0 = Math.min(W * 0.42, H * 0.42 * o.lead.w / o.lead.h), h0 = w0 * o.lead.h / o.lead.w;
  const from = { x: (W - w0) / 2, y: (H - h0) / 2 - H * 0.03, w: w0, h: h0 };
  const img = new Image(); img.src = o.src(o.lead); img.alt = '';
  const word = document.createElement('span'); word.className = 'word';
  word.textContent = zh ? '往下捲' : 'Scroll';
  word.style.top = (from.y + from.h + 28) + 'px';
  stage.append(img, word);
  let p = 0, shown = 0, finished = false;
  const place = (g) => {
    const e = o.easeInOut(g);
    img.style.left = (from.x * (1 - e)).toFixed(1) + 'px';
    img.style.top = (from.y * (1 - e)).toFixed(1) + 'px';
    img.style.width = (from.w + (W - from.w) * e).toFixed(1) + 'px';
    img.style.height = (from.h + (H - from.h) * e).toFixed(1) + 'px';
    word.style.opacity = g > 0.05 ? 0 : 1;
  };
  place(0);
  const push = (d) => { p = o.clamp(p + d); };
  stage.addEventListener('wheel', (e) => { e.preventDefault(); push(e.deltaY / (H * 1.4)); }, { passive: false });
  let ty = null;
  stage.addEventListener('touchstart', (e) => { ty = e.touches[0].clientY; }, { passive: true });
  stage.addEventListener('touchmove', (e) => { if (ty !== null) { push((ty - e.touches[0].clientY) / (H * 0.9)); ty = e.touches[0].clientY; } }, { passive: true });
  addEventListener('keydown', (e) => { if (e.key === 'ArrowDown' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); push(0.2); } });
  function frame() {
    shown += (p - shown) * 0.12;
    place(shown);
    if (shown > 0.995) { if (!finished) { finished = true; place(1); o.done(stage, 0); } return; }
    requestAnimationFrame(frame);
  }
  o.load(img.src).then(() => requestAnimationFrame(frame));
};

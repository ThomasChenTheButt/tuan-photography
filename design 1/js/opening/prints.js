/* Prints. The printed travel journal, literally: prints are dealt onto the paper one after
   another, each a little askew, the way they land on a desk. The last lands straight and
   grows until it is the window. */
window.Openings.prints = function (o) {
  'use strict';
  const stage = o.stage('paper');
  o.style(`
    .op-pr .print { position: absolute; left: 50%; top: 50%; box-sizing: border-box; background: var(--card);
      box-shadow: 0 14px 34px -14px oklch(20% 0.02 60 / 0.45), 0 2px 6px -2px oklch(20% 0.02 60 / 0.25);
      opacity: 0; transform: translate(-50%, -50%) translateY(-7vh) scale(1.08) rotate(var(--r)); will-change: transform, opacity; }
    .op-pr .print.in { opacity: 1; transform: translate(-50%, -50%) translate(var(--dx), var(--dy)) rotate(var(--r)); transition: transform 680ms var(--out), opacity 420ms var(--out); }
    .op-pr .print img { display: block; width: 100%; height: 100%; object-fit: cover; }
    .op-pr .print.lead { z-index: 2; }
    .op-pr .print.grow { transition: none; }
    .op-pr .print.fade { opacity: 0; transition: opacity 500ms var(--out); }
  `);
  stage.classList.add('op-pr');
  const W = innerWidth, H = innerHeight;
  const seq = o.pick(4).concat([o.lead]);
  const spots = [[-9, -6, -5.5], [8, 5, 4], [-5, 7, 3], [7, -7, -3.5], [0, 0, 0]];   // dx vw, dy vh, degrees
  const prints = seq.map((p, i) => {
    const el = document.createElement('div'); el.className = 'print' + (p === o.lead ? ' lead' : '');
    const h = Math.min(H * 0.44, W * 0.7 / (p.w / p.h)), w = h * p.w / p.h, pad = Math.max(8, h * 0.035);
    el.style.width = (w + 2 * pad) + 'px'; el.style.height = (h + 2 * pad) + 'px'; el.style.padding = pad + 'px';
    el.style.setProperty('--dx', spots[i][0] + 'vw'); el.style.setProperty('--dy', spots[i][1] + 'vh'); el.style.setProperty('--r', spots[i][2] + 'deg');
    const im = new Image(); im.src = o.src(p, p === o.lead ? '' : 1280); im.alt = '';
    el.appendChild(im); stage.appendChild(el);
    return { el, w: w + 2 * pad, h: h + 2 * pad, pad };
  });
  const GAP = 520, T_GROW = 1300;
  Promise.race([Promise.all(prints.map((p) => o.load(p.el.firstChild.src))), new Promise((r) => setTimeout(r, 2500))]).then(() => {
    prints.forEach((p, i) => setTimeout(() => p.el.classList.add('in'), 200 + i * GAP));
    const last = prints[prints.length - 1];
    setTimeout(() => {
      prints.slice(0, -1).forEach((p) => p.el.classList.add('fade'));
      // the lead print leaves the deal and becomes the window: its white margin closes, its edges reach the window's
      const from = { x: (W - last.w) / 2, y: (H - last.h) / 2, w: last.w, h: last.h, pad: last.pad };
      const el = last.el;
      el.classList.add('grow');
      el.style.transform = 'none'; el.style.left = from.x + 'px'; el.style.top = from.y + 'px';
      const t0 = performance.now();
      function frame(now) {
        const g = o.easeInOut(o.clamp((now - t0) / T_GROW));
        el.style.left = (from.x * (1 - g)).toFixed(1) + 'px';
        el.style.top = (from.y * (1 - g)).toFixed(1) + 'px';
        el.style.width = (from.w + (W - from.w) * g).toFixed(1) + 'px';
        el.style.height = (from.h + (H - from.h) * g).toFixed(1) + 'px';
        el.style.padding = (from.pad * (1 - g)).toFixed(1) + 'px';
        el.style.boxShadow = g > 0.9 ? 'none' : '';
        if (g < 1) requestAnimationFrame(frame); else o.done(stage, 150);
      }
      requestAnimationFrame(frame);
    }, 200 + (prints.length - 1) * GAP + 1100);
  });
};

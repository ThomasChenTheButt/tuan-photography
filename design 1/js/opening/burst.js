/* Burst. Cuts between photographs, faster and faster, like a burst of frames, until it holds
   on the one.
   1  hard cuts between full-window photographs
   2  punch-in: each frame lands tight on a detail and eases out, so the cuts hit harder
   3  on the camera's screen: the burst plays small in the middle of the paper, then the last
      frame grows to the window
   4  strobe: a white flash between frames, like a flash firing at each one */
window.Openings.burst = function (o) {
  'use strict';
  const v = o.v;
  const stage = o.stage(v === 3 ? 'paper' : '');
  o.style(`
    .op-bu .box { position: absolute; inset: 0; overflow: hidden; }
    .op-bu img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: none; will-change: transform; }
    .op-bu img.on { display: block; }
    .op-bu .flash { position: absolute; inset: 0; background: oklch(98.8% 0.005 85); opacity: 0; pointer-events: none; }
    .op-bu.screen .box { inset: auto; left: 50%; top: 50%; background: oklch(12% 0.01 60); box-shadow: 0 0 0 10px oklch(16% 0.01 60); }
  `);
  stage.classList.add('op-bu');
  const W = innerWidth, H = innerHeight;
  const box = document.createElement('div'); box.className = 'box';
  stage.appendChild(box);
  const flash = document.createElement('div'); flash.className = 'flash';
  if (v === 4) stage.appendChild(flash);
  let sw = W, shh = H;
  if (v === 3) {
    stage.classList.add('screen');
    sw = Math.min(W * 0.46, H * 0.46 * 1.5); shh = sw / 1.5;
    box.style.width = sw + 'px'; box.style.height = shh + 'px';
    box.style.marginLeft = (-sw / 2) + 'px'; box.style.marginTop = (-shh / 2) + 'px';
  }
  const seq = o.pick(22).concat([o.lead]);
  const imgs = seq.map((p) => { const im = new Image(); im.src = o.src(p, v === 3 ? 640 : 1280); im.alt = ''; box.appendChild(im); return im; });
  imgs[imgs.length - 1].src = o.src(o.lead);
  const gaps = []; let g = v === 4 ? 560 : 640;
  for (let i = 0; i < seq.length - 1; i++) { gaps.push(g); g = Math.max(70, g * 0.86); }
  const punch = (im) => {
    // land tight on a point of the frame, then ease back out while it holds
    const x = 30 + Math.random() * 40, y = 30 + Math.random() * 40;
    im.style.transformOrigin = x + '% ' + y + '%';
    im.animate([{ transform: 'scale(1.35)' }, { transform: 'scale(1.06)' }], { duration: 700, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'both' });
  };
  const show = (i) => {
    imgs[i].classList.add('on');
    if (v === 2 && i < imgs.length - 1) punch(imgs[i]);
    if (v === 4) flash.animate([{ opacity: 0.95 }, { opacity: 0 }], { duration: Math.min(220, gaps[Math.min(i, gaps.length - 1)] * 0.8), easing: 'ease-out' });
  };
  const finish = () => {
    const last = imgs[imgs.length - 1];
    if (v === 2) last.animate([{ transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 1100, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'both' });
    if (v !== 3) { o.done(stage, 900); return; }
    // the screen's last frame grows to the window
    setTimeout(() => {
      const from = box.getBoundingClientRect();
      box.style.boxShadow = 'none';
      const T = 1200, t0 = performance.now();
      function frame(now) {
        const k = o.easeInOut(o.clamp((now - t0) / T));
        const w = from.width + (W - from.width) * k, h = from.height + (H - from.height) * k;
        box.style.width = w + 'px'; box.style.height = h + 'px';
        box.style.marginLeft = (-w / 2) + 'px'; box.style.marginTop = (-h / 2) + 'px';
        if (k < 1) requestAnimationFrame(frame); else o.done(stage, 120);
      }
      requestAnimationFrame(frame);
    }, 500);
  };
  const start = () => {
    let i = 0;
    show(0);
    const next = () => {
      if (i >= gaps.length) { finish(); return; }
      setTimeout(() => { imgs[i].classList.remove('on'); i++; show(i); next(); }, gaps[i]);
    };
    next();
  };
  const loads = imgs.map((im) => o.load(im.src));
  Promise.race([Promise.all(loads), new Promise((r) => setTimeout(r, 2500))]).then(() => setTimeout(start, 350));
};

/* Burst. Hard cuts between full-window photographs, faster and faster, like a burst of
   frames, until it holds on the one. */
window.Openings.burst = function (o) {
  'use strict';
  const stage = o.stage();
  o.style(`
    .op-bu img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: none; }
    .op-bu img.on { display: block; }
  `);
  stage.classList.add('op-bu');
  const seq = o.pick(22).concat([o.lead]);
  const imgs = seq.map((p) => { const im = new Image(); im.src = o.src(p, 1280); im.alt = ''; stage.appendChild(im); return im; });
  imgs[imgs.length - 1].src = o.src(o.lead);
  // the gaps between cuts: long at first, shrinking to a flutter
  const gaps = []; let g = 640;
  for (let i = 0; i < seq.length - 1; i++) { gaps.push(g); g = Math.max(70, g * 0.86); }
  const start = () => {
    let i = 0;
    imgs[0].classList.add('on');
    const next = () => {
      if (i >= gaps.length) { o.done(stage, 900); return; }
      setTimeout(() => { imgs[i].classList.remove('on'); i++; imgs[i].classList.add('on'); next(); }, gaps[i]);
    };
    next();
  };
  // wait for the pictures, but not for ever
  const loads = imgs.map((im) => o.load(im.src));
  Promise.race([Promise.all(loads), new Promise((r) => setTimeout(r, 2500))]).then(() => setTimeout(start, 350));
};

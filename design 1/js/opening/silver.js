/* Silver plate. The quality of the daguerreotype (1839): the picture lies on polished silver,
   so what you see depends on the angle. Turned away it reads as a cool negative; turned to
   the right angle it is suddenly the picture, positive, with nothing laid over it.
   From the first frame a silver plate stands on the paper, turned 24 degrees about its
   vertical axis in real perspective, carrying the opening photograph as a cool silver
   negative. It turns towards the visitor in one movement; as it passes twelve degrees the
   negative flips to the positive within a few frames, and the plate keeps turning until it
   lies flat and fills the cover's own frame. One rotation, one ease, a step tied to the angle.
   Nothing is written anywhere. */
window.Openings.silver = function (o) {
  'use strict';
  const stage = o.stage('paper');
  stage.classList.add('op-si');
  o.style(`
    .op-si .plate { position: absolute; left: 0; top: 0; transform-origin: 50% 50%; will-change: transform; backface-visibility: hidden; visibility: hidden; }
    .op-si .plate img { position: absolute; inset: 0; width: 100%; height: 100%; max-width: none; object-fit: cover; }
    .op-si .neg { filter: grayscale(1) invert(1) sepia(0.3) hue-rotate(175deg) saturate(0.55) contrast(0.82) brightness(1.04); }
    .op-si .wash { position: absolute; inset: 0; background: oklch(96% 0.005 230); opacity: 0; box-shadow: inset 0 0 0 1px oklch(55% 0.01 230 / 0.5); }
    .op-si .pos { opacity: 0; }
  `);

  const plate = document.createElement('div'); plate.className = 'plate';
  const src = o.src(o.lead);
  const neg = new Image(); neg.alt = ''; neg.className = 'neg'; neg.src = src;
  const wash = document.createElement('div'); wash.className = 'wash';
  const pos = new Image(); pos.alt = ''; pos.className = 'pos'; pos.decoding = 'sync'; pos.src = src;
  plate.append(neg, wash, pos);
  stage.appendChild(plate);

  // the cover's own frame: the page's photograph is the full width and the cover's height
  const W = innerWidth, H = innerHeight;
  const r = o.cover.getBoundingClientRect();
  const PW = Math.round(r.width) || W, PH = Math.round(r.height) || H, PT = Math.round(r.top) || 0;
  plate.style.width = PW + 'px'; plate.style.height = PH + 'px'; plate.style.top = PT + 'px';
  // strong enough perspective that the turn reads as a plate in space, at desktop and phone width
  stage.style.perspective = Math.round(Math.min(Math.max(W, H), W * 1.6)) + 'px';
  stage.style.perspectiveOrigin = '50% ' + Math.round(PT + PH / 2) + 'px';

  const S0 = W < 700 ? 0.8 : 0.82;     // the plate stands a little inside the window, on the paper
  const A = 24;                        // the turn it starts from, in degrees about the vertical axis
  const AT = 12, AW = 1.8;             // the picture's angle: negative flips to positive across 1.8 degrees
  const HOLD = 150;                    // one breath on the negative so it is seen as a picture
  const TURN = 2600;                   // the turn from 24 degrees to flat
  const GROW0 = 1000, GROW = 1800;     // the plate grows to the cover's frame as the turn finishes
  const T = HOLD + Math.max(TURN, GROW0 + GROW);

  let flipped = 0;                     // once positive, it stays positive: it is the cover now
  function pose(angle, scale) {
    plate.style.transform = `scale(${scale.toFixed(4)}) rotateY(${angle.toFixed(3)}deg)`;
    // the silver catches more of the room the further it is turned away
    wash.style.opacity = (0.06 + 0.2 * (angle / A)).toFixed(3);
    const k = o.clamp((AT + AW / 2 - angle) / AW);
    flipped = Math.max(flipped, k);
    pos.style.opacity = flipped >= 0.999 ? '1' : flipped.toFixed(3);
  }

  pose(A, S0);
  Promise.race([Promise.all([o.load(src), o.ready]), new Promise((res) => setTimeout(res, 3000))]).then(() => {
    const dec = (im) => (im.decode ? im.decode().catch(() => {}) : Promise.resolve());
    Promise.all([dec(neg), dec(pos)]).then(() => {
      plate.style.visibility = 'visible';
      const t0 = performance.now();
      function frame(now) {
        const t = now - t0 - HOLD;
        if (t >= T - HOLD) {
          // exactly the cover: flat, full frame, the photograph positive at full strength
          plate.style.transform = 'none';
          wash.style.opacity = '0';
          pos.style.opacity = '1';
          o.done(stage, 160);
          return;
        }
        const angle = t <= 0 ? A : A * (1 - o.easeInOut(o.clamp(t / TURN)));
        const scale = S0 + (1 - S0) * o.easeInOut(o.clamp((t - GROW0) / GROW));
        pose(angle, scale);
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
  });
};

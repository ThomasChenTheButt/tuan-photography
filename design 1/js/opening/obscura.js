/* Camera obscura. The photograph lies on the paper upside down and dim, the way a landscape
   first appears on a view camera's ground glass under the dark cloth. It is held there long
   enough to be noticed, then one heavy turn rights it while it comes up to full light, and it
   is the cover. One rotate, one brightness ramp; the picture is otherwise untouched.
   No words: nothing is written anywhere, so there is nothing to translate. */
window.Openings.obscura = function (o) {
  'use strict';
  const stage = o.stage('paper op-ob');
  o.style(`
    .op-ob img { position: absolute; inset: 0; width: 100%; height: 100%; max-width: none;
      object-fit: cover; display: block; opacity: 0; transform: rotate(180deg) scale(0.8);
      transform-origin: 50% 50%; backface-visibility: hidden; will-change: transform, filter, opacity; }
  `);

  // one ease language for every part: a weighted start, a decisive middle, a long settle
  const ease = 'cubic-bezier(0.65, 0, 0.15, 1)';
  const DIM = 'brightness(0.5)', FULL = 'brightness(1)';
  const FADE = 900, HOLD = 800, TURN = 1800, RAMP = 1500;   // ms
  const turnAt = FADE + HOLD;                               // 1700: the turn begins
  const rampAt = turnAt + TURN * 0.22;                      // the light comes up inside the turn
  const lightT = rampAt + RAMP;                             // length of the light's own timeline

  o.load(o.src(o.lead)).then((img) => {
    img.alt = '';
    stage.appendChild(img);
    const go = () => {
      // the light: in from nothing to a dim projection, held, then up to full as it rights
      const light = img.animate([
        { offset: 0, opacity: 0, filter: DIM, easing: ease },
        { offset: FADE / lightT, opacity: 0.8, filter: DIM, easing: 'linear' },
        { offset: rampAt / lightT, opacity: 0.8, filter: DIM, easing: ease },
        { offset: 1, opacity: 1, filter: FULL },
      ], { duration: lightT, fill: 'both' });
      // the turn: upside down and lying small on the paper, to upright and the full window
      const turn = img.animate([
        { transform: 'rotate(180deg) scale(0.8)' },
        { transform: 'rotate(0deg) scale(1)' },
      ], { duration: TURN, delay: turnAt, easing: ease, fill: 'both' });
      Promise.all([light.finished, turn.finished])
        .then(() => o.done(stage, 300))
        .catch(() => o.done(stage, 0));
    };
    if (img.decode) img.decode().then(go, go); else go();
  });
};

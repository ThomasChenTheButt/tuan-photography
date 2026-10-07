/* Pull back. The page arrives on a detail of the opening photograph and pulls back until the
   whole of it is there. Version 1 is done in the stylesheet; these are the others.
   2  from the lake shore: it begins on the trees at the water's edge, not the summit
   3  three framings: three hard cuts, tight, then closer to the whole, then the whole, each
      held a moment and drifting, the way a photographer tries a scene three ways
   4  with a turn: it begins tight and a little rotated, and straightens as it pulls back */
window.Openings.pullback = function (o) {
  'use strict';
  const v = o.v;
  const stage = o.stage();
  const img = new Image(); img.src = o.src(o.lead); img.alt = '';
  img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;will-change:transform';
  stage.appendChild(img);
  const slow = 'cubic-bezier(0.5, 0.02, 0.18, 1)';
  o.load(img.src).then(() => {
    if (v === 2) {
      img.style.transformOrigin = '28% 66%';
      img.animate([{ transform: 'scale(3)' }, { transform: 'scale(1)' }], { duration: 4200, easing: slow, fill: 'both' });
      o.done(stage, 4300);
    } else if (v === 3) {
      const shots = [['42% 36%', 3.2, 3.0], ['46% 48%', 1.7, 1.6], ['50% 50%', 1.06, 1]];   // where, from, to
      let i = 0;
      const next = () => {
        const [at, a, b] = shots[i];
        img.style.transformOrigin = at;
        img.animate([{ transform: `scale(${a})` }, { transform: `scale(${b})` }], { duration: i === 2 ? 1100 : 1000, easing: i === 2 ? 'cubic-bezier(0.16, 1, 0.3, 1)' : 'linear', fill: 'both' });
        i++;
        if (i < shots.length) setTimeout(next, 1000); else o.done(stage, 1200);
      };
      next();
    } else {
      img.style.transformOrigin = '42% 40%';
      img.animate([{ transform: 'scale(2.6) rotate(-7deg)' }, { transform: 'scale(1) rotate(0deg)' }], { duration: 4400, easing: slow, fill: 'both' });
      o.done(stage, 4500);
    }
  });
};

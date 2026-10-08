/* Fold. The photograph arrives folded on its own centre line: the left half of the cover, as the
   window crops it, lies mirrored over the right, so the mountain and the car window close into
   a perfect symmetry. After a held breath the mirrored half lifts on the seam like a sheet of
   film, swings over and comes to rest on the left half, where (mirrored twice) it is the real
   picture again; the true right half is revealed beneath it. One move, then the cover.
   Nothing is written. The flap is one copy of the lead image, scaleX(-1), clipped to the right
   half and turned by one rotateY on a perspective stage. */
window.Openings.fold = function (o) {
  'use strict';
  const stage = o.stage('op-fo');
  o.style(`
    .op-fo .wrap { position: absolute; inset: 0; opacity: 0; }
    .op-fo .base, .op-fo .flap img { position: absolute; top: 0; height: 100%; object-fit: cover; max-width: none; }
    .op-fo .base { left: 0; width: 100%; }
    .op-fo .flap { position: absolute; top: 0; left: 50%; width: 50%; height: 100%; overflow: hidden;
      transform-origin: 0 50%; will-change: transform; backface-visibility: visible; }
    .op-fo .flap img { left: -100%; width: 200%; transform: scaleX(-1); }
    .op-fo .tone, .op-fo .shade { position: absolute; inset: 0; pointer-events: none; opacity: 0; }
    .op-fo .tone { background: oklch(14% 0.01 60); }
    .op-fo .shade { background: linear-gradient(to right, oklch(14% 0.01 60 / 0) 25%, oklch(14% 0.01 60 / 0.55) 50%, oklch(14% 0.01 60 / 0) 75%); }
  `);
  const src = o.src(o.lead);
  const base = new Image(); base.className = 'base'; base.alt = ''; base.src = src;
  const flap = document.createElement('div'); flap.className = 'flap';
  const mirror = new Image(); mirror.alt = ''; mirror.src = src;
  const tone = document.createElement('div'); tone.className = 'tone';
  const shade = document.createElement('div'); shade.className = 'shade';
  flap.append(mirror, tone);
  const wrap = document.createElement('div'); wrap.className = 'wrap';
  wrap.append(base, shade, flap);
  stage.append(wrap);

  const ARRIVE = 600, HOLD = 1300, UNFOLD = 3400;   // about 5.3 s, then the stage fades on the cover
  const decode = (im) => (im.decode ? im.decode().catch(() => {}) : null);

  o.load(src).then(() => Promise.all([decode(base), decode(mirror)])).then(() => {
    const W = innerWidth, H = innerHeight;
    // the vanishing point sits on the seam, far enough back that the lifted sheet stays a sheet
    wrap.style.perspective = Math.round(Math.max(W, H * 1.2) * 1.4) + 'px';
    wrap.style.perspectiveOrigin = '50% 50%';
    const t0 = performance.now();
    function frame(now) {
      const t = now - t0;
      // the folded picture comes up out of the dark
      wrap.style.opacity = o.easeOut(o.clamp(t / ARRIVE)).toFixed(3);
      // then the seam gives way: the mirrored half turns 180 degrees about the centre line,
      // toward the viewer, and lands on the left half as the real picture
      const k = o.easeInOut(o.clamp((t - ARRIVE - HOLD) / UNFOLD));
      const a = 180 * k;
      flap.style.transform = k > 0 ? `rotateY(${(-a).toFixed(3)}deg)` : '';
      const lift = Math.sin(a * Math.PI / 180);
      tone.style.opacity = (0.32 * lift).toFixed(3);    // the sheet darkens as it turns from the light
      shade.style.opacity = (0.7 * lift).toFixed(3);    // and lays a soft shadow along the seam
      if (t < ARRIVE + HOLD + UNFOLD) { requestAnimationFrame(frame); return; }
      flap.style.transform = 'rotateY(-180deg)';
      tone.style.opacity = shade.style.opacity = '0';
      flap.remove();                                    // mirrored twice it was the cover; now only the cover remains
      o.done(stage, 150);
    }
    requestAnimationFrame(frame);
  });
};

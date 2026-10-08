/* Projector. A carousel slide show in a darkened room, told without drawing a projector: the
   room is the page's paper with the lights off, and each slide arrives as a square of projected
   light on it, a little brighter and warmer at the centre than at the edges, a hair of keystone
   (wider at the top, as from a lamp below the screen), its light spilling softly onto the paper.
   The authored moment is the slide seating in the gate: it drops in, lands about 12 px low and
   soft, with a sliver of bare lamp light showing above it, then rises onto its stop and pulls
   sharp, a touch soft again as the film bows in the heat, and sharp. The beats are equal and
   never accelerate. His slide is the second; once it has seated, the lens is opened out and the
   projected square fills the window, flattening into the page's own cover. No words, no
   projector, no mount: only light and the photographs.
   0      the dark room                                         600 ms
   600    a wide landscape from another country, seated          600 ms
   1200   the shutter closes for the change                      600 ms
   1800   his photograph, seated in the same square              600 ms
   2400   the square opens out to the window                     800 ms
   3200   held on the cover, then the page                       400 ms */
window.Openings.projector = function (o) {
  'use strict';
  const stage = o.stage('op-pj');
  o.style(`
    .op-pj { background: oklch(19% 0.012 65); }
    .op-pj .gate { position: absolute; left: 0; width: 100%; }
    .op-pj .frame { position: absolute; inset: 0; overflow: hidden; visibility: hidden; transform-origin: 50% 50%;
      background: oklch(94% 0.03 82); will-change: transform; }
    .op-pj .frame.on { visibility: visible; }
    .op-pj .slide { position: absolute; inset: 0; width: 100%; height: 100%; max-width: none; object-fit: cover; display: none; will-change: transform, filter; }
    .op-pj .slide.on { display: block; }
    .op-pj .slide.prior { object-position: 32% 50%; }
    .op-pj .lamp, .op-pj .falloff { position: absolute; inset: 0; pointer-events: none; }
    .op-pj .lamp { mix-blend-mode: screen;
      background: radial-gradient(ellipse 62% 58% at 50% 46%, oklch(96% 0.035 80 / 0.20), oklch(96% 0.035 80 / 0) 72%); }
    .op-pj .falloff {
      background: radial-gradient(ellipse 78% 74% at 50% 46%, oklch(16% 0.02 60 / 0) 48%, oklch(16% 0.02 60 / 0.42) 100%); }
  `);

  // the gate is the cover itself, so when the square has opened out it is exactly what the page shows
  window.scrollTo(0, 0);
  const r = o.cover.getBoundingClientRect();
  const gH = r.height, W = r.width || innerWidth;
  const gate = document.createElement('div'); gate.className = 'gate';
  gate.style.top = r.top + 'px'; gate.style.height = gH + 'px';
  const frame = document.createElement('div'); frame.className = 'frame';
  const lamp = document.createElement('div'); lamp.className = 'lamp';
  const falloff = document.createElement('div'); falloff.className = 'falloff';
  gate.appendChild(frame);
  stage.appendChild(gate);

  const slide = (src, cls) => {
    const im = new Image(); im.alt = ''; im.className = 'slide' + (cls ? ' ' + cls : ''); im.src = src;
    frame.appendChild(im);
    return im;
  };
  // the slide before his: a wide landscape from another country, loaded at the size the screen needs
  const wide = o.others.filter((p) => p.country !== o.lead.country && p.w > p.h * 1.3);
  const prefer = ['matterhorn-lake', 'fuji-lake', 'calanque', 'sapa-valley', 'matterhorn-flag'];
  const prior = prefer.map((id) => wide.find((p) => p.id === id)).find(Boolean) || wide[0] || o.others[0];
  const big = W * Math.min(2, devicePixelRatio || 1) > 1280;
  const first = prior ? slide(o.src(prior, big ? 0 : 1280), 'prior') : null;
  const last = slide(o.src(o.lead));
  frame.append(lamp, falloff);

  const BEAT = 600, SEAT = 300, OPEN = 800, HOLD = 400;
  const EASE = 'cubic-bezier(0.3, 0, 0.2, 1)';                      // the one ease, for every motion
  const S = innerWidth < 700 ? 0.7 : 0.62;                            // the projected square, as a share of the window
  const K = 3;                                                        // keystone, degrees
  const PROJ = 'perspective(1400px) scale(' + S + ') rotateX(-' + K + 'deg)';
  const FLAT = 'perspective(1400px) scale(1) rotateX(0deg)';
  const SPILL = '0 0 90px 24px oklch(82% 0.05 78 / 0.13)';           // lamp light spilling onto the paper, not a shadow
  const NOSPILL = '0 0 0px 0px oklch(82% 0.05 78 / 0)';
  frame.style.transform = PROJ;
  frame.style.boxShadow = SPILL;
  // the seat, in screen pixels: lands 10 to 14 px low; the frame is scaled, so divide by S
  const L = Math.round(Math.max(10, Math.min(14, gH * 0.016))) / S;

  // the shutter opens on a slide that is still falling: it lands low and soft, rises onto its stop, pulls sharp
  function seat(im) {
    im.classList.add('on');
    frame.classList.add('on');
    im.animate([
      { transform: 'translate3d(0, ' + (-2.5 * L).toFixed(1) + 'px, 0)', filter: 'blur(4px)', offset: 0, easing: EASE },
      { transform: 'translate3d(0, ' + L.toFixed(1) + 'px, 0)', filter: 'blur(3.5px)', offset: 0.24, easing: EASE },      // landed low, soft
      { transform: 'translate3d(0, ' + (0.85 * L).toFixed(1) + 'px, 0)', filter: 'blur(3.5px)', offset: 0.38, easing: EASE },
      { transform: 'translate3d(0, ' + (-0.12 * L).toFixed(1) + 'px, 0)', filter: 'blur(0px)', offset: 0.6, easing: EASE },   // on its stop, sharp
      { transform: 'translate3d(0, 0, 0)', filter: 'blur(1.2px)', offset: 0.8, easing: EASE },                              // the film bows: a touch soft
      { transform: 'translate3d(0, 0, 0)', filter: 'blur(0px)', offset: 1 },
    ], { duration: SEAT, fill: 'none' });
  }
  // the shutter closes for the change: the square of light goes out
  const shut = (im) => { frame.classList.remove('on'); im.remove(); };
  // the lens opens out: the square fills the window and flattens into the cover
  function open() {
    const opt = { duration: OPEN, easing: EASE, fill: 'forwards' };
    frame.animate([{ transform: PROJ, boxShadow: SPILL }, { transform: FLAT, boxShadow: NOSPILL }], opt);
    lamp.animate([{ opacity: 1 }, { opacity: 0 }], opt);
    falloff.animate([{ opacity: 1 }, { opacity: 0 }], opt);
  }

  const decoded = (im) => o.load(im.src).then(() => (im.decode ? im.decode().catch(() => {}) : null)).then(() => true);
  const timeout = (ms) => new Promise((res) => setTimeout(() => res(false), ms));
  const shown = performance.now();

  Promise.all([
    Promise.race([decoded(last), timeout(2500)]),
    first ? Promise.race([decoded(first), timeout(2500)]) : Promise.resolve(false),
  ]).then(([, firstOk]) => {
    const at = Math.max(0, BEAT - (performance.now() - shown));   // the dark beat is never shorter than BEAT
    // the beats stay where they are even without the first slide: its place is simply left dark
    if (first && firstOk) {
      setTimeout(() => seat(first), at);
      setTimeout(() => shut(first), at + BEAT);
    } else if (first) first.remove();
    setTimeout(() => seat(last), at + 2 * BEAT);
    setTimeout(open, at + 3 * BEAT);
    setTimeout(() => o.done(stage, HOLD), at + 3 * BEAT + OPEN);
  });
};

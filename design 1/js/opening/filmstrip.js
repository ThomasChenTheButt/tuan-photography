/* Film strip. Film with its sprocket holes races past, slows, and stops on the one frame,
   which grows to the window.
   1  one strip across the window, right to left
   2  vertical: the strip runs down the window, as film runs through a projector gate
   3  three strips at once, the outer two running the other way and never stopping, the middle
      one landing on the frame
   4  on paper: one strip lying on a slant on the page, slower, and the frame straightens as it grows */
window.Openings.filmstrip = function (o) {
  'use strict';
  const v = o.v;
  const stage = o.stage(v === 4 ? 'paper' : '');
  o.style(`
    .op-fs .strip { position: absolute; display: flex; background: oklch(14% 0.015 60); will-change: transform, filter; }
    .op-fs .strip.h { left: 0; top: 0; flex-direction: row; }
    .op-fs .strip.v { left: 0; top: 0; flex-direction: column; }
    .op-fs .cell { position: relative; flex: none; display: grid; }
    .op-fs .h .cell { grid-template-rows: var(--sp) 1fr var(--sp); height: var(--sh); width: var(--fw); }
    .op-fs .v .cell { grid-template-columns: var(--sp) 1fr var(--sp); width: var(--sh); height: var(--fw); }
    .op-fs .holes { display: flex; justify-content: space-around; align-items: center; }
    .op-fs .h .holes { padding: 0 2%; }
    .op-fs .v .holes { flex-direction: column; padding: 2% 0; }
    .op-fs .holes i { background: oklch(10% 0.01 60); border-radius: 2px; box-shadow: inset 0 0 0 1px oklch(30% 0.01 60 / 0.5); }
    .op-fs .h .holes i { width: calc(var(--sp) * 0.62); height: calc(var(--sp) * 0.46); }
    .op-fs .v .holes i { height: calc(var(--sp) * 0.62); width: calc(var(--sp) * 0.46); }
    .op-fs.paper .holes i { background: var(--bg); box-shadow: none; }
    .op-fs .pic { background: oklch(20% 0.01 60); overflow: hidden; }
    .op-fs .h .pic { margin: 0 3%; }
    .op-fs .v .pic { margin: 3% 0; }
    .op-fs .pic img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .op-fs .big { position: absolute; object-fit: cover; display: block; transform-origin: 50% 50%; }
    .op-fs.paper .strip { box-shadow: 0 18px 40px -20px oklch(20% 0.02 60 / 0.5); }
  `);
  stage.classList.add('op-fs');
  const W = innerWidth, H = innerHeight;
  const vertical = v === 2;
  // the strip's width across the film, the sprocket rows, a frame's length along the film (3:2 inside its margins)
  const sh = vertical ? Math.min(W * 0.62, H * 0.5) : v === 3 ? Math.min(H * 0.3, W * 0.26) : Math.min(H * (v === 4 ? 0.5 : 0.64), W * 0.5);
  const sp = Math.round(sh * 0.11);
  const fw = vertical ? Math.round((sh - 2 * sp) / 1.5 / 0.94) : Math.round((sh - 2 * sp) * 1.5 / 0.94);

  function makeStrip(seq, cls) {
    const strip = document.createElement('div'); strip.className = 'strip ' + cls;
    strip.style.setProperty('--sh', sh + 'px'); strip.style.setProperty('--sp', sp + 'px'); strip.style.setProperty('--fw', fw + 'px');
    const cells = seq.map((p) => {
      const c = document.createElement('div'); c.className = 'cell';
      const holes = () => { const h = document.createElement('div'); h.className = 'holes'; for (let i = 0; i < 6; i++) h.appendChild(document.createElement('i')); return h; };
      const pic = document.createElement('div'); pic.className = 'pic';
      const im = new Image(); im.src = o.src(p, 640); im.alt = ''; im.decoding = 'async'; pic.appendChild(im);
      c.append(holes(), pic, holes()); strip.appendChild(c); return c;
    });
    stage.appendChild(strip);
    return { strip, cells };
  }

  const before = o.pick(22), after = o.pick(30).slice(22, 26);
  const main = makeStrip(before.concat([o.lead], after), vertical ? 'v' : 'h');
  const leadIndex = before.length;
  const along = vertical ? H : W, across = vertical ? W : H;
  const x1 = along / 2 - (leadIndex + 0.5) * fw;               // where the strip stops: the frame centred
  const x0 = vertical ? x1 - before.length * fw - along : x1 + before.length * fw + along;   // vertical runs downward
  const off = across / 2 - sh / 2;
  const tilt = v === 4 ? -7 : 0;
  // three strips: two more, above and below, running the other way at their own speeds
  const extra = v === 3 ? [makeStrip(o.pick(30).slice(4, 30), 'h'), makeStrip(o.pick(30).slice(0, 26).reverse(), 'h')] : [];
  const gapY = sh * 1.18;

  const big = new Image(); big.className = 'big'; big.src = o.src(o.lead); big.alt = '';
  const T_RUN = v === 4 ? 4300 : 3400, T_HOLD = 500, T_GROW = 1150;
  let lastX = x0, lastT = 0, from = null, growing = false;
  const place = (s, a, b) => {
    s.style.transform = vertical
      ? `translate(${b.toFixed(1)}px, ${a.toFixed(1)}px)`
      : `translate(${a.toFixed(1)}px, ${b.toFixed(1)}px)` + (tilt ? ` translate(${-a.toFixed(1)}px, 0) rotate(${tilt}deg) translate(${a.toFixed(1)}px, 0)` : '');
  };
  o.load(big.src).then(() => {
    const t0 = performance.now();
    function frame(now) {
      const t = now - t0;
      const u = o.clamp(t / T_RUN);
      const e = 1 - Math.pow(1 - u, 4);                       // fast, then slowing to a stop
      const x = x0 + (x1 - x0) * e;
      const speed = lastT ? Math.abs(x - lastX) / Math.max(1, t - lastT) : 0;
      lastX = x; lastT = t;
      if (tilt) {
        // on a slant: the strip turns about the window's centre
        main.strip.style.transformOrigin = `${(W / 2 - x).toFixed(1)}px ${sh / 2}px`;
        main.strip.style.transform = `translate(${x.toFixed(1)}px, ${off.toFixed(1)}px) rotate(${tilt}deg)`;
      } else place(main.strip, x, off);
      main.strip.style.filter = `blur(${Math.min(9, speed * 1.6).toFixed(2)}px)`;
      extra.forEach((s, k) => {
        const dir = k ? 1 : -1, sp2 = 0.55 + 0.25 * k;      // the outer strips keep moving, the other way
        const xe = -fw * 6 + ((t * sp2 * 0.6) % (fw * 4)) * -dir - (dir > 0 ? 0 : fw * 2);
        s.strip.style.transform = `translate(${xe.toFixed(1)}px, ${(off + (k ? gapY : -gapY)).toFixed(1)}px)`;
        s.strip.style.filter = 'blur(1.2px)';
      });
      if (!growing && t > T_RUN + T_HOLD) {
        growing = true;
        main.strip.style.filter = '';
        const r = main.cells[leadIndex].querySelector('.pic').getBoundingClientRect();
        const pw = vertical ? sh - 2 * sp : fw * 0.94, ph = vertical ? fw * 0.94 : sh - 2 * sp;
        from = { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: pw, h: ph };
        stage.appendChild(big);
      }
      if (growing) {
        const g = o.easeInOut(o.clamp((t - T_RUN - T_HOLD) / T_GROW));
        const w = from.w + (W - from.w) * g, h = from.h + (H - from.h) * g;
        const cx = from.cx + (W / 2 - from.cx) * g, cy = from.cy + (H / 2 - from.cy) * g;
        big.style.left = (cx - w / 2).toFixed(1) + 'px';
        big.style.top = (cy - h / 2).toFixed(1) + 'px';
        big.style.width = w.toFixed(1) + 'px';
        big.style.height = h.toFixed(1) + 'px';
        big.style.transform = tilt ? `rotate(${(tilt * (1 - g)).toFixed(2)}deg)` : '';
        main.strip.style.opacity = (1 - g).toFixed(3);
        extra.forEach((s) => { s.strip.style.opacity = (1 - g).toFixed(3); });
      }
      if (t < T_RUN + T_HOLD + T_GROW) requestAnimationFrame(frame); else o.done(stage, 150);
    }
    requestAnimationFrame(frame);
  });
};

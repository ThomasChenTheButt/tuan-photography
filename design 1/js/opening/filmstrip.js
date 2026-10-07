/* Film strip. A strip of film races past with its sprocket holes, slows, and stops on the
   one frame, which then grows to the window. */
window.Openings.filmstrip = function (o) {
  'use strict';
  const stage = o.stage();
  o.style(`
    .op-fs .strip { position: absolute; top: 50%; left: 0; display: flex; align-items: center; transform: translateY(-50%); background: oklch(14% 0.015 60); will-change: transform, filter; }
    .op-fs .cell { position: relative; flex: none; display: grid; grid-template-rows: var(--sp) 1fr var(--sp); height: var(--sh); width: var(--fw); }
    .op-fs .holes { display: flex; justify-content: space-around; align-items: center; padding: 0 2%; }
    .op-fs .holes i { width: calc(var(--sp) * 0.62); height: calc(var(--sp) * 0.46); background: oklch(10% 0.01 60); border-radius: 2px; box-shadow: inset 0 0 0 1px oklch(30% 0.01 60 / 0.5); }
    .op-fs .pic { margin: 0 3%; background: oklch(20% 0.01 60); overflow: hidden; }
    .op-fs .pic img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .op-fs .big { position: absolute; object-fit: cover; display: block; }
  `);
  stage.classList.add('op-fs');
  const W = innerWidth, H = innerHeight;
  const sh = Math.min(H * 0.64, W * 0.5), sp = Math.round(sh * 0.11);   // the strip's height, the sprocket rows
  const fw = Math.round((sh - 2 * sp) * 1.5 / 0.94);                     // a frame's cell, 3:2 inside its margins
  const before = o.pick(22), after = o.pick(30).slice(22, 26);
  const seq = before.concat([o.lead], after);
  const strip = document.createElement('div'); strip.className = 'strip';
  strip.style.setProperty('--sh', sh + 'px'); strip.style.setProperty('--sp', sp + 'px'); strip.style.setProperty('--fw', fw + 'px');
  const cells = seq.map((p) => {
    const c = document.createElement('div'); c.className = 'cell';
    const holes = () => { const h = document.createElement('div'); h.className = 'holes'; for (let i = 0; i < 6; i++) h.appendChild(document.createElement('i')); return h; };
    const pic = document.createElement('div'); pic.className = 'pic';
    const im = new Image(); im.src = o.src(p, 640); im.alt = ''; im.decoding = 'async'; pic.appendChild(im);
    c.append(holes(), pic, holes()); strip.appendChild(c); return c;
  });
  stage.appendChild(strip);
  const leadIndex = before.length;
  const x1 = W / 2 - (leadIndex + 0.5) * fw;      // where the strip stops: the lead frame centred
  const x0 = x1 + before.length * fw + W;         // where it starts: that many frames to the right
  const big = new Image(); big.className = 'big'; big.src = o.src(o.lead); big.alt = '';
  const T_RUN = 3400, T_HOLD = 500, T_GROW = 1100;
  let lastX = x0, lastT = 0, from = null, growing = false;
  o.load(big.src).then(() => {
    const t0 = performance.now();
    function frame(now) {
      const t = now - t0;
      const u = o.clamp(t / T_RUN);
      const e = 1 - Math.pow(1 - u, 4);              // fast, then slowing to a stop
      const x = x0 + (x1 - x0) * e;
      const speed = lastT ? Math.abs(x - lastX) / Math.max(1, t - lastT) : 0;   // px per ms
      lastX = x; lastT = t;
      strip.style.transform = `translate(${x.toFixed(1)}px, -50%)`;
      strip.style.filter = `blur(${Math.min(9, speed * 1.6).toFixed(2)}px)`;
      if (!growing && t > T_RUN + T_HOLD) {
        growing = true;
        strip.style.filter = '';
        const r = cells[leadIndex].querySelector('.pic').getBoundingClientRect();
        from = { x: r.left, y: r.top, w: r.width, h: r.height };
        stage.appendChild(big);
      }
      if (growing) {
        const g = o.easeInOut(o.clamp((t - T_RUN - T_HOLD) / T_GROW));
        big.style.left = (from.x * (1 - g)).toFixed(1) + 'px';
        big.style.top = (from.y * (1 - g)).toFixed(1) + 'px';
        big.style.width = (from.w + (W - from.w) * g).toFixed(1) + 'px';
        big.style.height = (from.h + (H - from.h) * g).toFixed(1) + 'px';
        strip.style.opacity = (1 - g).toFixed(3);
      }
      if (t < T_RUN + T_HOLD + T_GROW) requestAnimationFrame(frame); else o.done(stage, 150);
    }
    requestAnimationFrame(frame);
  });
};

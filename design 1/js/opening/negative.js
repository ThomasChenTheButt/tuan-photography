/* Negative. The frame as a colour negative in its film rebate, orange-masked, the sky dark
   and the snow black. A flash, and it turns positive; the rebate falls away and the frame
   fills the window. */
window.Openings.negative = function (o) {
  'use strict';
  const stage = o.stage();
  o.style(`
    .op-ng .film { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); display: grid; grid-template-rows: var(--sp) 1fr var(--sp); background: oklch(15% 0.02 60); will-change: transform; }
    .op-ng .holes { display: flex; justify-content: space-around; align-items: center; padding: 0 2%; }
    .op-ng .holes i { width: calc(var(--sp) * 0.62); height: calc(var(--sp) * 0.46); background: oklch(9% 0.01 60); border-radius: 2px; box-shadow: inset 0 0 0 1px oklch(28% 0.01 60 / 0.5); }
    .op-ng .pic { position: relative; margin: 0 3%; overflow: hidden; }
    .op-ng .pic img { width: 100%; height: 100%; object-fit: cover; display: block; filter: invert(1) hue-rotate(180deg) contrast(0.85) brightness(1.08); }
    .op-ng .mask { position: absolute; inset: 0; background: oklch(55% 0.13 50); mix-blend-mode: multiply; opacity: 0.7; }
    .op-ng .flash { position: absolute; inset: 0; background: #fff; opacity: 0; }
    .op-ng .big { position: absolute; object-fit: cover; display: block; }
  `);
  stage.classList.add('op-ng');
  const W = innerWidth, H = innerHeight;
  const fh = Math.min(H * 0.7, W * 0.6), sp = Math.round(fh * 0.1);
  const fw = Math.round((fh - 2 * sp) * 1.5 / 0.94);
  const film = document.createElement('div'); film.className = 'film';
  film.style.setProperty('--sp', sp + 'px'); film.style.width = fw + 'px'; film.style.height = fh + 'px';
  const holes = () => { const h = document.createElement('div'); h.className = 'holes'; for (let i = 0; i < 7; i++) h.appendChild(document.createElement('i')); return h; };
  const pic = document.createElement('div'); pic.className = 'pic';
  const img = new Image(); img.src = o.src(o.lead); img.alt = '';
  const mask = document.createElement('div'); mask.className = 'mask';
  pic.append(img, mask);
  film.append(holes(), pic, holes());
  const flash = document.createElement('div'); flash.className = 'flash';
  const big = new Image(); big.className = 'big'; big.src = img.src; big.alt = '';
  stage.append(film, flash);

  const T_HOLD = 1900, T_FLASH = 90, T_AFTER = 700, T_GROW = 1200;
  o.load(img.src).then(() => {
    film.animate([{ opacity: 0, transform: 'translate(-50%, -50%) scale(1.03)' }, { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' }], { duration: 900, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'both' });
    setTimeout(() => {
      flash.style.transition = `opacity ${T_FLASH}ms linear`; flash.style.opacity = '1';
      setTimeout(() => {
        img.style.filter = 'none'; mask.style.display = 'none';   // positive
        flash.style.transition = 'opacity 520ms cubic-bezier(0.16, 1, 0.3, 1)'; flash.style.opacity = '0';
      }, T_FLASH);
      setTimeout(() => {
        const r = pic.getBoundingClientRect();
        const from = { x: r.left, y: r.top, w: r.width, h: r.height };
        stage.appendChild(big);
        const t0 = performance.now();
        function frame(now) {
          const g = o.easeInOut(o.clamp((now - t0) / T_GROW));
          big.style.left = (from.x * (1 - g)).toFixed(1) + 'px';
          big.style.top = (from.y * (1 - g)).toFixed(1) + 'px';
          big.style.width = (from.w + (W - from.w) * g).toFixed(1) + 'px';
          big.style.height = (from.h + (H - from.h) * g).toFixed(1) + 'px';
          film.style.opacity = (1 - g).toFixed(3);
          if (g < 1) requestAnimationFrame(frame); else o.done(stage, 150);
        }
        requestAnimationFrame(frame);
      }, T_FLASH + T_AFTER);
    }, T_HOLD);
  });
};

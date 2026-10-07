/* Contact sheet. Every photograph on the site laid out as one sheet on black. The frames
   come up one by one; the sheet dims around one, and that frame grows to fill the window. */
window.Openings.contact = function (o) {
  'use strict';
  const stage = o.stage();
  o.style(`
    .op-ct .sheet { position: absolute; left: 50%; top: 50%; display: grid; gap: 6px; transform: translate(-50%, -50%); will-change: transform; }
    .op-ct .f { position: relative; background: oklch(20% 0.01 60); overflow: hidden; opacity: 0; transition: opacity 500ms var(--out), filter 700ms var(--out); }
    .op-ct .f img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .op-ct .f.in { opacity: 1; }
    .op-ct.dim .f:not(.lead) { opacity: 0.38; }
    .op-ct .big { position: absolute; object-fit: cover; display: block; }
  `);
  stage.classList.add('op-ct');
  const W = innerWidth, H = innerHeight;
  const cols = W > 900 ? 10 : W > 600 ? 7 : 4;
  const cw = Math.floor((W - (cols + 1) * 6) / cols), ch = Math.round(cw * 2 / 3);
  const photos = o.others.slice();
  const rows = Math.ceil((photos.length + 1) / cols);
  const leadAt = Math.floor(rows / 2) * cols + Math.floor(cols / 2) - 1;   // near the middle
  photos.splice(leadAt, 0, o.lead);

  const sheet = document.createElement('div'); sheet.className = 'sheet';
  sheet.style.gridTemplateColumns = `repeat(${cols}, ${cw}px)`;
  sheet.style.gridAutoRows = `${ch}px`;
  const frames = photos.map((p) => {
    const f = document.createElement('div'); f.className = 'f' + (p === o.lead ? ' lead' : '');
    const im = new Image(); im.src = o.src(p, 640); im.alt = ''; im.decoding = 'async';
    f.appendChild(im); sheet.appendChild(f); return f;
  });
  stage.appendChild(sheet);
  const sheetH = rows * (ch + 6);
  const drift = Math.max(0, (sheetH - H) / 2);        // a tall sheet drifts slowly downward through the window

  const big = new Image(); big.className = 'big'; big.src = o.src(o.lead); big.alt = '';
  const order = frames.map((f, i) => i).sort(() => Math.random() - 0.5);
  const T_IN = 1900, T_HOLD = 3300, T_GROW = 1400;
  o.load(big.src).then(() => {
    const t0 = performance.now();
    let shown = 0, dimmed = false, growing = false, from = null;
    function frame(now) {
      const t = now - t0;
      // the frames come up in a shuffled order
      const want = Math.min(frames.length, Math.floor(frames.length * o.clamp(t / T_IN)));
      while (shown < want) frames[order[shown++]].classList.add('in');
      // the sheet drifts
      const d = o.easeInOut(o.clamp(t / (T_HOLD + T_GROW)));
      sheet.style.transform = `translate(-50%, calc(-50% + ${(drift * (1 - 2 * d)).toFixed(1)}px))`;
      if (!dimmed && t > T_IN + 700) { dimmed = true; stage.classList.add('dim'); }
      if (!growing && t > T_HOLD) {
        growing = true;
        const r = frames[leadAt].getBoundingClientRect();
        from = { x: r.left, y: r.top, w: r.width, h: r.height };
        frames[leadAt].style.visibility = 'hidden';
        stage.appendChild(big);
      }
      if (growing) {
        const g = o.easeInOut(o.clamp((t - T_HOLD) / T_GROW));
        big.style.left = (from.x * (1 - g)).toFixed(1) + 'px';
        big.style.top = (from.y * (1 - g)).toFixed(1) + 'px';
        big.style.width = (from.w + (W - from.w) * g).toFixed(1) + 'px';
        big.style.height = (from.h + (H - from.h) * g).toFixed(1) + 'px';
        sheet.style.opacity = (1 - g).toFixed(3);
      }
      if (t < T_HOLD + T_GROW) requestAnimationFrame(frame); else o.done(stage, 150);
    }
    requestAnimationFrame(frame);
  });
};

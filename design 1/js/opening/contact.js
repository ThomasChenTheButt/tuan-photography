/* Contact sheet. Every photograph on the site laid out as one sheet; one frame is chosen and
   becomes the window.
   1  on black: the frames come up one by one, the sheet dims around one, that frame grows
   2  on paper: a printed contact sheet, each frame in its black film border
   3  the dive: the whole sheet comes up, then the camera moves into the chosen frame
   4  strip by strip: the film is laid down row by row, a clay grease-pencil ring marks the
      chosen frame, and it grows */
window.Openings.contact = function (o) {
  'use strict';
  const v = o.v;
  const stage = o.stage(v === 2 ? 'paper' : '');
  o.style(`
    .op-ct .sheet { position: absolute; left: 50%; top: 50%; display: grid; gap: 6px; transform: translate(-50%, -50%); transform-origin: 0 0; will-change: transform; }
    .op-ct .f { position: relative; background: oklch(20% 0.01 60); overflow: hidden; opacity: 0; transition: opacity 500ms var(--out); }
    .op-ct .f img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .op-ct .f.in { opacity: 1; }
    .op-ct.dim .f:not(.lead) { opacity: 0.38; }
    .op-ct .big { position: absolute; object-fit: cover; display: block; }
    .op-ct.paper .sheet { gap: 10px; }
    .op-ct.paper .f { background: oklch(16% 0.01 60); padding: 4px 4px; }
    .op-ct.paper.dim .f:not(.lead) { opacity: 0.5; }
    .op-ct .row { display: contents; }
    .op-ct.strips .f { transition: opacity 300ms var(--out), transform 700ms var(--out); transform: translateX(var(--from)); }
    .op-ct.strips .f.in { transform: none; }
    .op-ct svg.ring { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
    .op-ct svg.ring path { fill: none; stroke: oklch(53% 0.088 47); stroke-width: 3; stroke-linecap: round; }
  `);
  stage.classList.add('op-ct');
  if (v === 4) stage.classList.add('strips');
  const W = innerWidth, H = innerHeight;
  const cols = W > 900 ? 10 : W > 600 ? 7 : 4;
  const gap = v === 2 ? 10 : 6;
  const cw = Math.floor((W - (cols + 1) * gap) / cols), ch = Math.round(cw * 2 / 3);
  const photos = o.others.slice();
  const rows = Math.ceil((photos.length + 1) / cols);
  const leadAt = Math.floor(rows / 2) * cols + Math.floor(cols / 2) - 1;   // near the middle
  photos.splice(leadAt, 0, o.lead);

  const sheet = document.createElement('div'); sheet.className = 'sheet';
  sheet.style.gridTemplateColumns = `repeat(${cols}, ${cw}px)`;
  sheet.style.gridAutoRows = `${ch}px`;
  const frames = photos.map((p, i) => {
    const f = document.createElement('div'); f.className = 'f' + (p === o.lead ? ' lead' : '');
    if (v === 4) f.style.setProperty('--from', (Math.floor(i / cols) % 2 ? '' : '-') + '60vw');
    const im = new Image(); im.src = o.src(p, 640); im.alt = ''; im.decoding = 'async';
    f.appendChild(im); sheet.appendChild(f); return f;
  });
  stage.appendChild(sheet);
  const sheetH = rows * (ch + gap);
  const drift = v === 3 ? 0 : Math.max(0, (sheetH - H) / 2);   // a tall sheet drifts slowly through the window

  const big = new Image(); big.className = 'big'; big.src = o.src(o.lead); big.alt = '';
  // the order the frames come up: shuffled, or row by row for the strips
  const order = v === 4 ? frames.map((f, i) => i) : frames.map((f, i) => i).sort(() => Math.random() - 0.5);
  const T_IN = v === 4 ? 2400 : 1900, T_HOLD = v === 4 ? 4300 : 3300, T_GROW = v === 3 ? 1900 : 1400;
  let ring = null;
  // wait for the small photographs (most of them), so the sheet never comes up empty
  const smalls = frames.map((f) => o.load(f.firstChild.src));
  Promise.race([Promise.all(smalls.concat([o.load(big.src)])), new Promise((r) => setTimeout(r, 3500))]).then(() => {
    const t0 = performance.now();
    let shown = 0, dimmed = false, growing = false, ringed = false, from = null, base = null;
    function frame(now) {
      const t = now - t0;
      const want = v === 4
        ? Math.min(frames.length, cols * Math.ceil(rows * o.clamp(t / T_IN)))   // a whole strip at a time
        : Math.min(frames.length, Math.floor(frames.length * o.clamp(t / T_IN)));
      while (shown < want) frames[order[shown++]].classList.add('in');
      if (!growing) {
        const d = o.easeInOut(o.clamp(t / (T_HOLD + T_GROW)));
        sheet.style.transform = `translate(-50%, calc(-50% + ${(drift * (1 - 2 * d)).toFixed(1)}px))`;
      }
      if (!dimmed && v !== 3 && t > T_IN + 700) { dimmed = true; stage.classList.add('dim'); }
      // the grease-pencil ring, drawn round the chosen frame in one stroke
      if (v === 4 && !ringed && t > T_IN + 500) {
        ringed = true;
        const r = frames[leadAt].getBoundingClientRect();
        const NS = 'http://www.w3.org/2000/svg';
        ring = document.createElementNS(NS, 'svg'); ring.setAttribute('class', 'ring');
        ring.setAttribute('viewBox', `0 0 ${W} ${H}`);
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2, rx = r.width * 0.68, ry = r.height * 0.78;
        const pts = [];
        for (let k = 0; k <= 1.08; k += 0.02) {                // a little past the start, as a hand closes a loop
          const a = -Math.PI * 0.6 + k * Math.PI * 2, wob = 1 + 0.04 * Math.sin(k * 9);
          pts.push((cx + Math.cos(a) * rx * wob).toFixed(1) + ' ' + (cy + Math.sin(a) * ry * wob).toFixed(1));
        }
        const p = document.createElementNS(NS, 'path'); p.setAttribute('d', 'M' + pts.join(' L'));
        ring.appendChild(p); stage.appendChild(ring);
        const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L;
        p.animate([{ strokeDashoffset: L }, { strokeDashoffset: 0 }], { duration: 900, easing: 'cubic-bezier(0.5, 0, 0.2, 1)', fill: 'both' });
      }
      if (!growing && t > T_HOLD) {
        growing = true;
        const r = frames[leadAt].getBoundingClientRect();
        from = { x: r.left, y: r.top, w: r.width, h: r.height };
        base = sheet.style.transform;
        if (v !== 3) { frames[leadAt].style.visibility = 'hidden'; stage.appendChild(big); }
        if (ring) ring.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'both' });
      }
      if (growing) {
        const g = o.easeInOut(o.clamp((t - T_HOLD) / T_GROW));
        if (v === 3) {
          // the camera moves into the frame: the whole sheet scales about the frame until it covers the window
          const s = Math.pow(Math.max(W / from.w, H / from.h), g);
          // transform space is measured from the sheet's anchor, the window's centre
          const fx = from.x + from.w / 2 - W / 2, fy = from.y + from.h / 2 - H / 2;
          sheet.style.transform = `translate(${(-fx * g).toFixed(1)}px, ${(-fy * g).toFixed(1)}px) translate(${fx}px, ${fy}px) scale(${s.toFixed(4)}) translate(${-fx}px, ${-fy}px) ${base}`;
          sheet.style.transformOrigin = '0 0';
          if (g > 0.75 && !big.isConnected) { big.style.cssText = 'left:0;top:0;width:100%;height:100%;opacity:0'; stage.appendChild(big); }
          if (big.isConnected) big.style.opacity = o.clamp((g - 0.75) / 0.25).toFixed(3);
        } else {
          big.style.left = (from.x * (1 - g)).toFixed(1) + 'px';
          big.style.top = (from.y * (1 - g)).toFixed(1) + 'px';
          big.style.width = (from.w + (W - from.w) * g).toFixed(1) + 'px';
          big.style.height = (from.h + (H - from.h) * g).toFixed(1) + 'px';
          sheet.style.opacity = (1 - g).toFixed(3);
        }
      }
      if (t < T_HOLD + T_GROW) requestAnimationFrame(frame); else o.done(stage, 150);
    }
    requestAnimationFrame(frame);
  });
};

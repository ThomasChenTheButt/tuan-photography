/* ---------- The photo wall (gallery.html) ----------
   Every photograph on the site as a small print on one screen, and nothing else (his call,
   2026-10-15: no words, no controls). The prints stand in close rows that drift sideways
   without end, one row left, the next right; the cursor parts the wall as it moves and the
   print nearest it rises; a click opens it in the viewer (main.js, pick()), the print growing
   from the wall into place. Size, gap, tilt, speed and pace are fixed below, at the values
   the five bars started at. Tried first as elements/gallery/ and merged on 2026-10-07.
   The numbers go to the stylesheet as --x --y --w --h --r; nothing drifts under
   "reduce motion". Loads after main.js and uses its pick(). */
(function () {
  'use strict';

  const wall = document.querySelector('.pwall');
  if (!wall) return;
  const field = wall.querySelector('.pwall__tiles');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- the wall's measures, once five bars: print size, gap (px), tilt (degrees at most),
     drift speed, and how far the rows' paces differ ---- */
  const sizeK = 1.2, GAP = 12, tiltK = 1.5, speedK = 0.8, varyK = 1;

  /* ---- the prints, in a fixed shuffle so countries mix but the wall is the same each visit ---- */
  const own = [...field.querySelectorAll('.print')].map((el) => {
    const img = el.querySelector('img');
    return { id: el.querySelector('[data-slide]').dataset.slide, el, img,
             ar: (parseInt(img.getAttribute('width'), 10) || 3) / (parseInt(img.getAttribute('height'), 10) || 2),
             bx: 0, by: 0, bw: 0, bh: 0, tilt: 0,
             x: 0, y: 0, w: 0, h: 0, r: 0 };
  });
  let seed = 7;
  const rand = () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647; };
  for (let i = own.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [own[i], own[j]] = [own[j], own[i]]; }
  const n = own.length;
  let all = own;

  /* ---- layout: rows of prints, each a loop longer than the screen ---- */
  let W = 0, H = 0, cell = 0;
  const rows = [];
  function layout() {
    W = innerWidth; H = innerHeight;
    const ph = H / Math.max(3, Math.sqrt(n * H * 0.76 / W)) * sizeK - 10;
    const pitch = ph + GAP;
    const top = -pitch * 0.45;                           // the first row begins above the window
    const total = Math.ceil((H - top) / pitch) + 1;      // and the last runs off the bottom
    cell = pitch;
    const shifts = rows.map((r) => r.shift);             // each row keeps where it had drifted to
    rows.length = 0;
    const per = Math.ceil(n / total);
    seed = 11;
    for (let r = 0; r < total; r++) {
      const list = own.slice(r * per, (r + 1) * per);
      const h = ph;
      let len = list.reduce((a, p) => a + h * p.ar + GAP, 0);
      // a short row borrows prints from the next until it is long enough to loop
      let k = 0;
      while (len < W * 1.35) {
        const src = own[((r + 1) * per + k++) % n];
        const el = src.el.cloneNode(true);
        const a = el.querySelector('[data-slide]');
        a.addEventListener('click', (e) => { if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); pick(src.id, a); });
        list.push({ id: src.id, el, img: el.querySelector('img'), ar: src.ar, ghost: true,
                    bx: 0, by: 0, bw: 0, bh: 0, tilt: 0, x: 0, y: 0, w: 0, h: 0, r: 0 });
        len += h * src.ar + GAP;
      }
      const row = { y: top + r * pitch + pitch / 2, len, shift: shifts[r] || 0,
                    vary: (r * 7) % 5 - 2, tiles: list };          // -2..2, each row's own pace
      let x = 0;
      for (const p of list) {
        const w = h * p.ar;
        p.row = row; p.x0 = x + w / 2;
        p.bw = w; p.bh = h; p.by = row.y;
        p.tilt = (rand() - 0.5) * 2;                     // -1..1, tiltK makes it degrees
        x += w + GAP;
      }
      rows.push(row);
    }
    all = rows.flatMap((r) => r.tiles);
    field.querySelectorAll('.print').forEach((el) => { if (!all.some((p) => p.el === el)) el.remove(); });
    all.forEach((p) => { if (!p.el.parentNode) field.appendChild(p.el); });
    if (lifted && !all.includes(lifted)) lift(null);
    advance(0);
  }

  function advance(dt) {
    for (const row of rows) {
      // 11px a second, odd rows left and even rows right; varyK spreads the rows' paces
      const speed = (rows.indexOf(row) % 2 ? 1 : -1) * (11 + row.vary * varyK);
      if (!reduce) row.shift += speed * speedK * dt / 1000;
      for (const p of row.tiles) {
        const m = ((p.x0 + row.shift) % row.len + row.len) % row.len;
        p.bx = m - row.len * 0.2;
        if (!p.x && !p.y) { p.x = p.bx; p.y = p.by; p.w = p.bw; p.h = p.bh; }
      }
    }
  }

  /* ---- the cursor and the lifted print ---- */
  let mx = -1e4, my = -1e4, lifted = null;
  function nearest() {
    let best = null, bd = Infinity;
    for (const p of all) {
      const dx = p.bx - mx, dy = p.by - my, d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = p; }
    }
    return Math.sqrt(bd) < cell * 1.4 ? best : null;
  }
  function lift(p) {
    if (p === lifted) return;
    if (lifted) lifted.el.classList.remove('lift');
    lifted = p;
    if (p) p.el.classList.add('lift');
  }
  field.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    mx = e.clientX; my = e.clientY;
    lift(nearest());
  });
  field.addEventListener('pointerleave', () => { mx = -1e4; my = -1e4; lift(null); });

  /* ---- one frame, eased by the clock so a slow screen settles in the same time ---- */
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(250, now - last); last = now;
    const ease = reduce ? 1 : 1 - Math.exp(-dt / 95);
    advance(dt);
    const short = Math.min(W, H);
    const liftEdge = short * 0.42;
    // the wall parts around the lifted print; with nothing up, a small part follows the cursor
    let fx = mx, fy = my, radius = short * 0.12, outer = short * 0.3;
    if (lifted) {
      fx = lifted.x; fy = lifted.y;
      radius = Math.hypot(lifted.w, lifted.h) / 2 + 20;
      outer = radius * 1.5;
    }
    for (const p of all) {
      let x = p.bx, y = p.by, w = p.bw, h = p.bh, r = p.tilt * tiltK;
      // a print that has looped from one end of its row to the other jumps, off screen, not slides
      if (Math.abs(p.bx - p.x) > W * 0.5) p.x = p.bx;
      if (p === lifted) {
        w = p.ar >= 1 ? liftEdge : liftEdge * p.ar;
        h = p.ar >= 1 ? liftEdge / p.ar : liftEdge;
        x = p.bx + (mx - p.bx) * 0.6; y = p.by + (my - p.by) * 0.6; r = 0;
        x = Math.min(Math.max(x, w / 2 + 12), W - w / 2 - 12);
        y = Math.min(Math.max(y, h / 2 + 12), H - h / 2 - 12);
      } else if (!reduce) {
        const dx = p.bx - fx, dy = p.by - fy, d = Math.hypot(dx, dy) || 1;
        if (d < outer) {
          const nd = radius + (d / outer) * (outer - radius);   // [0, outer] slides to [radius, outer]
          x += dx / d * (nd - d); y += dy / d * (nd - d);
        }
      }
      p.x += (x - p.x) * ease; p.y += (y - p.y) * ease;
      p.w += (w - p.w) * ease; p.h += (h - p.h) * ease; p.r += (r - p.r) * ease;
      const st = p.el.style;
      st.setProperty('--x', (p.x - p.w / 2).toFixed(1) + 'px');
      st.setProperty('--y', (p.y - p.h / 2).toFixed(1) + 'px');
      st.setProperty('--w', p.w.toFixed(1) + 'px');
      st.setProperty('--h', p.h.toFixed(1) + 'px');
      st.setProperty('--r', p.r.toFixed(2) + 'deg');
    }
    requestAnimationFrame(frame);
  }

  addEventListener('resize', layout);
  layout();
  requestAnimationFrame(frame);
})();

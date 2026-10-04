/* tuan photography 陳亮元 · design 2 · the opening, trial: the corridor (?opening=corridor).
   Before the globe, his prints pinned down a receding corridor of paper. Plays in front of the
   globe opening (opening/globe.js), which trims its own turning hold to make room. Loads after
   map/flights.js; app.js chooses it from the address. */
(() => {
  'use strict';
  const WC = (window.WC = window.WC || {});
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  // how long it runs in front, how much of the globe's turning hold it takes back, and the skip fade
  const CORRIDOR = 3300, CORRIDOR_TRIM = 700, SKIP = 450;

  /* ------------------------------------------------------------ the corridor (a trial, ?opening=corridor) */

  /*
    Before the globe: a corridor of his prints, pinned down four planes of paper (two walls, the
    floor and the ceiling) drawn in CSS perspective, each print on a thin mat with a soft shadow and
    plenty of paper between them. The camera glides forward along it (an exponential ease-out), the
    nearest prints drifting past the edges, and at the end the last prints fall away to the sides,
    leaving the globe that was turning at the far end all along. Only transforms and opacity move,
    and every number reaches the stylesheet as a custom property.
    o: { root (the container), slides (SITE.slides), narrow (phone), src(slide) → the 640px copy }
    returns { ready (the prints decoded, or a moment and a half), far(el), frame(el), hide(), gone(), clear() }
  */
  WC.corridor = (o) => {
    const root = o.root;
    const W = window.innerWidth, H = window.innerHeight;
    const phone = !!o.narrow;
    // the eye's distance from the page, the corridor's length, where the camera starts (already
    // some way in, so the far end is never a pinhole) and how far its far end still is when the
    // glide ends (so the last prints frame the globe before they fall away)
    const P = phone ? 640 : 900, L = phone ? 3000 : 4800, ZF = phone ? 420 : 700, CZ0 = phone ? 800 : 1000;
    const D = L - ZF;
    const hw = W * 0.62, hh = H * (phone ? 0.5 : 0.62);
    const GLIDE = 3000, FALL_AT = 2800, FALL = CORRIDOR - FALL_AT;
    const A = 3.2;
    const glide = (el) => { const u = clamp(el / GLIDE, 0, 1); return (1 - Math.exp(-A * u)) / (1 - Math.exp(-A)); };
    const cz = (el) => CZ0 + (D - CZ0) * glide(el);
    // how large the far end looks now, against how it looks when the glide ends
    const far = (el) => (P + ZF) / (P + L - cz(el));

    // every photograph, in a fixed shuffle, taken round and round (so each repeats only once the
    // whole set has hung). The floor and ceiling take landscapes only: seen at a grazing angle, a
    // print's depth is squashed, and a landscape keeps its short side that way
    const all = Object.values(o.slides).filter((s) => s.w && s.h);
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
    const lands = all.filter((s) => s.w >= s.h);
    let ia = 0, il = 0;
    const nextAny = () => all[ia++ % all.length];
    const nextLand = () => lands[il++ % lands.length];

    root.innerHTML = '';
    const farEl = document.createElement('div'); farEl.className = 'corridor__far';
    const scene = document.createElement('div'); scene.className = 'corridor__scene';
    const planes = ['left', 'right', 'floor', 'ceiling'].map((n) => { const d = document.createElement('div'); d.className = `corridor__plane corridor__plane--${n}`; scene.appendChild(d); return d; });
    root.append(farEl, scene);
    const rs = root.style;
    rs.setProperty('--cp', P); rs.setProperty('--cl', L); rs.setProperty('--cw', (2 * hw).toFixed(1)); rs.setProperty('--ch', (2 * hh).toFixed(1));
    rs.setProperty('--cz', CZ0); rs.setProperty('--ca', 0); rs.setProperty('--dp', 0); rs.setProperty('--vg', 1);

    // the hang, like a pinned wall: down each wall, columns of prints sharing one width and stacked
    // to fill the height; across the floor and ceiling, rows of prints sharing one height and laid
    // to fill the width. Thin gutters between, a hair of jitter so no two columns line up
    const MAT = phone ? 4 : 6, GUT = phone ? 14 : 22, EDGE = phone ? 24 : 36, SMAX = phone ? 1.25 : 1.18;
    const dNear = CZ0 + 180, dFar = L - 70;
    const items = [];
    const wallR = phone ? 3 : 4, wallW = phone ? 280 : 340;
    for (const p of [0, 1]) {
      let d = dNear + (p ? 170 : 0);
      for (;;) {
        // at most two portraits in a column, or it would shrink to nothing
        const col = []; let ports = 0;
        for (let r = 0; r < wallR; r++) { let s = nextAny(); if (s.h > s.w) { if (ports >= 2) s = nextLand(); else ports++; } col.push(s); }
        const avail = 2 * hh - 2 * EDGE - (wallR - 1) * GUT;
        const sumR = col.reduce((a, s) => a + s.h / s.w, 0);
        const w = Math.min(wallW * SMAX, 2 * MAT + (avail - wallR * 2 * MAT) / sumR);
        if (d + w / 2 > dFar) break;
        const hs = col.map((s) => ((w - 2 * MAT) * s.h) / s.w + 2 * MAT);
        const gap = GUT + (avail - hs.reduce((a, b) => a + b, 0)) / (wallR - 1);
        let y = EDGE + (rnd() - 0.5) * 16;
        col.forEach((s, r) => { items.push({ p, d, c: y + hs[r] / 2, w, h: hs[r], s }); y += hs[r] + gap; });
        d += w + GUT;
      }
    }
    const fcN = phone ? 1 : 3, fcH = phone ? 280 : 300;
    for (const p of [2, 3]) {
      let d = dNear + (p === 3 ? 150 : 60);
      for (;;) {
        const row = []; for (let r = 0; r < fcN; r++) row.push(nextLand());
        const avail = 2 * hw - 2 * EDGE - (fcN - 1) * GUT;
        const sumQ = row.reduce((a, s) => a + s.w / s.h, 0);
        const h = Math.min(fcH * SMAX, 2 * MAT + (avail - fcN * 2 * MAT) / sumQ);
        if (d + h / 2 > dFar) break;
        const ws = row.map((s) => ((h - 2 * MAT) * s.w) / s.h + 2 * MAT);
        const used = ws.reduce((a, b) => a + b, 0);
        const gap = fcN > 1 ? GUT + (avail - used) / (fcN - 1) : 0;
        let x = EDGE + (fcN > 1 ? 0 : (avail - used) / 2) + (rnd() - 0.5) * 16;
        row.forEach((s, r) => { items.push({ p, d, c: x + ws[r] / 2, w: ws[r], h, s }); x += ws[r] + gap; });
        d += h + GUT;
      }
    }

    const imgs = [];
    items.forEach((it, i) => {
      const { p, d, c, w, h, s } = it;
      // a wall's local x runs along the corridor and its local y is the height; the floor's and
      // ceiling's local x runs across and local y along the corridor
      const px = p === 0 ? d - w / 2 : p === 1 ? L - d - w / 2 : c - w / 2;
      const py = p < 2 ? c - h / 2 : p === 2 ? L - d - h / 2 : d - h / 2;
      const fx = p < 2 ? 0 : c < hw ? -70 : 70, fy = p < 2 ? 70 : 0;
      const el = document.createElement('div');
      el.className = 'corridor__print';
      const st = el.style;
      st.setProperty('--px', px.toFixed(1)); st.setProperty('--py', py.toFixed(1));
      st.setProperty('--pw', w.toFixed(1)); st.setProperty('--ph', h.toFixed(1));
      st.setProperty('--pr', ((((i * 53) % 7) - 3) * 0.4).toFixed(2)); st.setProperty('--fx', fx); st.setProperty('--fy', fy);
      const im = new Image();
      im.decoding = 'async'; im.alt = ''; im.width = s.w; im.height = s.h; im.src = o.src(s);
      el.appendChild(im);
      planes[p].appendChild(el);
      imgs.push(im);
    });
    root.hidden = false;
    // the prints are decoded before the opening starts, but it never waits past a moment and a half;
    // a print still on its way shows its mat
    const loads = imgs.map((im) => (im.decode ? im.decode() : new Promise((r) => { im.onload = r; im.onerror = r; })).catch(() => {}).then(() => im.parentNode.classList.add('is-loaded')));
    const ready = Promise.race([Promise.all(loads), new Promise((r) => setTimeout(r, 1500))]);

    let over = false;
    const hide = () => { over = true; root.hidden = true; };
    const clear = () => { hide(); root.classList.remove('is-gone'); root.innerHTML = ''; };
    return {
      ready, far, length: CORRIDOR, trim: CORRIDOR_TRIM,
      // on a phone the far end is narrower than the name would be: the name is held a fifth
      // smaller down the corridor and grows to its size as the last prints fall away
      titleK: (el) => (phone ? 0.8 + 0.2 * easeInOut(clamp((el - 2600) / 700, 0, 1)) : 1),
      frame(el) {
        if (over) return;
        rs.setProperty('--cz', cz(el).toFixed(2));
        rs.setProperty('--vg', (1 - glide(el)).toFixed(3));
        rs.setProperty('--ca', clamp(el / 350, 0, 1).toFixed(3));
        rs.setProperty('--dp', easeInOut(clamp((el - FALL_AT) / FALL, 0, 1)).toFixed(4));
        if (el >= CORRIDOR) hide();
      },
      hide, clear,
      gone() { if (over) return; root.classList.add('is-gone'); setTimeout(hide, SKIP); },
    };
  };
})();

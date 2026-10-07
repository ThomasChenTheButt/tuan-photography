/* Letters. His name on paper, and the photograph shows only through the letters: the name is
   not written across the photograph, it is the window onto it. The letters grow until one
   stroke is the whole window.
   1  "tuan photography 陳亮元", all at once
   2  陳亮元 alone, large, and the camera goes into one stroke
   3  each letter shows a different photograph of his; one by one they all turn to the summit
   4  the letters arrive one by one, each rising into place, then the name grows */
window.Openings.letters = function (o) {
  'use strict';
  const v = o.v;
  const stage = o.stage('paper');
  const W = innerWidth, H = innerHeight;
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('width', W); svg.setAttribute('height', H);
  svg.style.cssText = 'position:absolute;inset:0;display:block';
  const defs = document.createElementNS(NS, 'defs');
  const clip = document.createElementNS(NS, 'clipPath'); clip.id = 'op-letters';
  const text = document.createElementNS(NS, 'text');
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('font-family', v === 2 ? 'Noto Serif TC, serif' : 'Playfair Display, serif');
  text.setAttribute('font-weight', v === 2 ? '500' : '400');
  const narrow = W < 720;
  const line1 = document.createElementNS(NS, 'tspan');
  const line2 = document.createElementNS(NS, 'tspan');
  const zh = document.createElementNS(NS, 'tspan');
  if (v === 2) { line1.textContent = '陳亮元'; }
  else {
    line1.textContent = narrow ? 'tuan' : 'tuan photography';
    line2.textContent = narrow ? 'photography' : '';
    zh.textContent = '陳亮元';
    zh.setAttribute('font-family', 'Noto Serif TC, serif'); zh.setAttribute('font-weight', '500');
  }
  text.append(line1, line2, zh);
  clip.appendChild(text); defs.appendChild(clip);
  const image = (href, clipId) => {
    const im = document.createElementNS(NS, 'image');
    im.setAttribute('href', href);
    im.setAttribute('width', W); im.setAttribute('height', H);
    im.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    if (clipId) im.setAttribute('clip-path', `url(#${clipId})`);
    return im;
  };
  const pic = image(o.src(o.lead), 'op-letters');
  pic.style.opacity = '0';
  const full = image(o.src(o.lead)); full.style.opacity = '0';   // the photograph itself, for the last breath
  svg.append(defs, pic);
  const perLetter = document.createElementNS(NS, 'g');          // versions 3 and 4: one layer a letter
  svg.append(perLetter, full);
  stage.appendChild(svg);

  // the thickest point of the name inside a region of the window: the line is drawn on a canvas
  // exactly where the page draws it (same face, size, centre and baseline), and the inked pixel
  // farthest from any edge wins, so the camera lands inside a stroke and never in a gap
  function thickest(str, font, baseline, region) {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d'); x.font = font; x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.fillStyle = '#000';
    x.fillText(str, W / 2, baseline);
    const d = x.getImageData(0, 0, W, H).data, ink = (i, j) => { i = Math.round(i); j = Math.round(j); return i >= 0 && j >= 0 && i < W && j < H && d[(j * W + i) * 4 + 3] > 128; };
    let best = [region.x + region.width / 2, region.y + region.height / 2], br = -1;
    for (let j = Math.floor(region.y); j < region.y + region.height; j += 2) for (let i = Math.floor(region.x); i < region.x + region.width; i += 2) {
      if (!ink(i, j)) continue;
      let r = 1;
      const round = (rr) => { for (let a = 0; a < 16; a++) { const q = a * Math.PI / 8; if (!ink(i + Math.cos(q) * rr, j + Math.sin(q) * rr)) return false; } return true; };
      while (r < 200 && round(r)) r++;   // the largest circle that fits inside the stroke
      if (r > br) { br = r; best = [i, j]; }
    }
    return best;
  }

  const fonts = document.fonts ? Promise.all([document.fonts.load('400 100px "Playfair Display"'), document.fonts.load('500 100px "Noto Serif TC"')]).catch(() => {}) : Promise.resolve();
  Promise.all([fonts, o.load(o.src(o.lead))]).then(() => {
    // size the name to the window
    let fs = 100;
    line1.setAttribute('font-size', fs);
    line2.setAttribute('font-size', fs);
    const wide = Math.max(line1.getComputedTextLength(), line2.getComputedTextLength() || 0);
    fs = v === 2 ? Math.min(fs * (W * 0.78) / wide, H * 0.5) : Math.min(fs * (W * 0.86) / wide, H * (narrow ? 0.22 : 0.3));
    const zfs = fs * 0.3;
    line1.setAttribute('font-size', fs); line1.setAttribute('x', W / 2);
    line2.setAttribute('font-size', fs); line2.setAttribute('x', W / 2);
    zh.setAttribute('font-size', zfs); zh.setAttribute('x', W / 2);
    const lines = v === 2 ? 1 : narrow ? 2 : 1;
    const block = v === 2 ? fs * 0.86 : fs * 0.78 * lines + fs * 0.26 * (lines - 1) + zfs * 1.9;
    let y = H / 2 - block / 2 + fs * (v === 2 ? 0.86 : 0.78);
    line1.setAttribute('y', y);
    if (narrow && v !== 2) { y += fs * 1.04; line2.setAttribute('y', y); }
    zh.setAttribute('y', y + zfs * 1.9);
    // the point we go through: the stem of the h in "photography", or the left stroke of 陳
    let fx, fy;
    if (v === 2) { [fx, fy] = thickest('陳亮元', '500 ' + fs + 'px "Noto Serif TC"', +line1.getAttribute('y'), text.getExtentOfChar(0)); }
    else {
      const idx = (narrow ? 'photography' : 'tuan photography').indexOf('h') + (narrow ? 4 : 0);
      const ex = text.getExtentOfChar(idx); fx = ex.x + ex.width * 0.17; fy = ex.y + ex.height * 0.52;
    }
    // browsers stop drawing text past about thirty thousand pixels, so the zoom stops short of that
    const Smax = Math.min(Math.hypot(W, H) / (fs * (v === 2 ? 0.035 : 0.045)), 24000 / fs);

    // versions 3 and 4: each letter its own clip and its own layer
    const layers = [];
    if (v === 3 || v === 4) {
      const n = text.getNumberOfChars(), others = o.pick(n);
      const spans = [line1, line2, zh];
      let k = 0;
      spans.forEach((sp) => {
        const str = sp.textContent;
        for (let i = 0; i < str.length; i++, k++) {
          if (str[i] === ' ') continue;
          const ex = text.getExtentOfChar(k);
          const c = document.createElementNS(NS, 'clipPath'); c.id = 'op-l' + k;
          const t = document.createElementNS(NS, 'text');
          t.textContent = str[i];
          ['font-family', 'font-weight', 'font-size'].forEach((a) => t.setAttribute(a, sp.getAttribute(a) || text.getAttribute(a)));
          t.setAttribute('x', ex.x); t.setAttribute('y', sp.getAttribute('y'));
          c.appendChild(t); defs.appendChild(c);
          const g = document.createElementNS(NS, 'g');
          g.setAttribute('clip-path', `url(#op-l${k})`);
          const im = image(v === 3 ? o.src(others[layers.length % others.length], 1280) : o.src(o.lead));
          g.appendChild(im); perLetter.appendChild(g);
          g.style.opacity = '0';
          layers.push({ g, im, t });
        }
      });
    }
    const n = layers.length;
    // timing: the letters come in, (3: turn to the summit), the name grows, the last breath
    const T = v === 3 ? 7000 : v === 4 ? 6800 : 5600;
    const A = v === 3 ? 0.44 : v === 4 ? 0.38 : 0.2, B = v === 3 ? 0.92 : 0.9;
    const t0 = performance.now();
    let swapped = false;
    function frame(now) {
      const u = o.clamp((now - t0) / T);
      if (v === 1 || v === 2) pic.style.opacity = o.easeOut(o.clamp(u / A)).toFixed(3);
      if (v === 3) {
        // every letter shows its own photograph, then one by one they turn to the summit
        layers.forEach((l, i) => {
          l.g.style.opacity = o.easeOut(o.clamp(u / 0.08)).toFixed(3);
          const turn = o.clamp((u - 0.16 - (i / n) * 0.2) / 0.06);
          if (turn > 0 && !l.turned) { l.turned = true; l.im.setAttribute('href', o.src(o.lead)); }
        });
        if (!swapped && u > A) { swapped = true; pic.style.opacity = '1'; perLetter.style.display = 'none'; }
      }
      if (v === 4) {
        // one letter at a time, each rising a little into its place
        layers.forEach((l, i) => {
          const a = o.easeOut(o.clamp((u - (i / n) * 0.3) / 0.07));
          l.g.style.opacity = a.toFixed(3);
          l.t.setAttribute('transform', `translate(0 ${((1 - a) * fs * 0.18).toFixed(1)})`);
        });
        if (!swapped && u > A) { swapped = true; pic.style.opacity = '1'; perLetter.style.display = 'none'; }
      }
      const e = o.easeInOut(o.clamp((u - A) / (B - A)));
      const s = Math.pow(Smax, e);
      text.setAttribute('transform', `translate(${fx} ${fy}) scale(${s}) translate(${-fx} ${-fy})`);
      // the photograph itself comes in while the stroke is already filling the window, before the
      // browser's text grows past what it will draw
      full.style.opacity = Math.max(o.easeInOut(o.clamp((e - 0.62) / 0.22)), o.easeOut(o.clamp((u - B) / (1 - B)))).toFixed(3);
      if (u < 1) requestAnimationFrame(frame); else o.done(stage, 100);
    }
    requestAnimationFrame(frame);
  });
};

/* Letters. His name on paper, and the photograph shows only through the letters: the name
   is not written across the photograph, it is the window onto it. The letters grow until one
   stroke is the whole window. */
window.Openings.letters = function (o) {
  'use strict';
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
  text.setAttribute('font-family', 'Playfair Display, serif');
  text.setAttribute('font-weight', '400');
  const narrow = W < 720;
  const line1 = document.createElementNS(NS, 'tspan'); line1.textContent = narrow ? 'tuan' : 'tuan photography';
  const line2 = document.createElementNS(NS, 'tspan'); line2.textContent = narrow ? 'photography' : '';
  const zh = document.createElementNS(NS, 'tspan'); zh.textContent = '陳亮元';
  zh.setAttribute('font-family', 'Noto Serif TC, serif'); zh.setAttribute('font-weight', '500');
  text.append(line1, line2, zh);
  clip.appendChild(text); defs.appendChild(clip);
  const pic = document.createElementNS(NS, 'image');
  pic.setAttribute('href', o.src(o.lead));
  pic.setAttribute('width', W); pic.setAttribute('height', H);
  pic.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  pic.setAttribute('clip-path', 'url(#op-letters)');
  pic.style.opacity = '0';
  const full = pic.cloneNode(); full.removeAttribute('clip-path');   // the photograph itself, for the last breath
  svg.append(defs, pic, full);
  stage.appendChild(svg);

  const fonts = document.fonts ? Promise.all([document.fonts.load('400 100px "Playfair Display"'), document.fonts.load('500 100px "Noto Serif TC"')]).catch(() => {}) : Promise.resolve();
  Promise.all([fonts, o.load(o.src(o.lead))]).then(() => {
    // size the name to the window
    let fs = 100;
    line1.setAttribute('font-size', fs);
    line2.setAttribute('font-size', fs);
    const wide = Math.max(line1.getComputedTextLength(), line2.getComputedTextLength() || 0);
    fs = Math.min(fs * (W * 0.86) / wide, H * (narrow ? 0.22 : 0.3));
    const zfs = fs * 0.3;
    line1.setAttribute('font-size', fs); line1.setAttribute('x', W / 2);
    line2.setAttribute('font-size', fs); line2.setAttribute('x', W / 2);
    zh.setAttribute('font-size', zfs); zh.setAttribute('x', W / 2);
    const lines = narrow ? 2 : 1;
    const block = fs * 0.78 * lines + fs * 0.26 * (lines - 1) + zfs * 1.9;
    let y = H / 2 - block / 2 + fs * 0.78;
    line1.setAttribute('y', y);
    if (narrow) { y += fs * 1.04; line2.setAttribute('y', y); }
    zh.setAttribute('y', y + zfs * 1.9);
    // the point we go through: the stem of the h in "photography", a thick stroke
    const idx = (narrow ? 'photography' : 'tuan photography').indexOf('h') + (narrow ? 4 : 0);
    const ex = text.getExtentOfChar(idx);
    const fx = ex.x + ex.width * 0.17, fy = ex.y + ex.height * 0.52;
    const Smax = Math.hypot(W, H) / (fs * 0.045);
    const T = 5600, A = 0.2, B = 0.9;                  // the letters come in, then grow, then the last breath
    const t0 = performance.now();
    function frame(now) {
      const u = o.clamp((now - t0) / T);
      pic.style.opacity = o.easeOut(o.clamp(u / A)).toFixed(3);
      const e = o.easeInOut(o.clamp((u - A) / (B - A)));
      const s = Math.pow(Smax, e);
      text.setAttribute('transform', `translate(${fx} ${fy}) scale(${s}) translate(${-fx} ${-fy})`);
      full.style.opacity = o.easeOut(o.clamp((u - B) / (1 - B))).toFixed(3);
      if (u < 1) requestAnimationFrame(frame); else o.done(stage, 100);
    }
    requestAnimationFrame(frame);
  });
};

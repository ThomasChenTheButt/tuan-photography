/* The opening (experiment `opening`). The home page can begin with one of the openings in
   js/opening/, chosen from the address: index.html?opening=<name>. Without the name nothing
   happens and the page is itself. Each opening is one file that draws on a stage laid over the
   page, and calls done() when the photograph beneath is exactly what it shows; the stage then
   fades and the top bar and the place line come in (the stylesheet's html.op-done).
   Under "reduce motion" no opening runs. */
(function () {
  'use strict';
  const asked = new URLSearchParams(location.search).get('opening');
  const m = asked && asked.match(/^([a-z]+)(?:-([2-9]))?$/);   // aperture, aperture-2, aperture-3 ...
  if (!m) return;
  const name = m[1], version = m[2] ? +m[2] : 1;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cover = document.querySelector('.cover');
  const img = cover && cover.querySelector('img');
  if (!img || !window.ALL_PHOTOS) return;

  const html = document.documentElement;
  const root = html.dataset.root || '';
  html.classList.add('op', 'op-' + name, 'op-' + name + '-' + version);
  window.scrollTo(0, 0);

  const all = window.ALL_PHOTOS;
  const lead = all.find((p) => p.id === window.LEAD_PHOTO) || all[0];
  const others = all.filter((p) => p !== lead);

  const o = {
    name, v: version, root, cover, img, lead, all, others,
    src: (p, size) => root + 'images/web/' + (size ? size + '/' : '') + p.file,
    style(css) { const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st); return st; },
    stage(cls) {
      const el = document.createElement('div');
      el.className = 'op-stage' + (cls ? ' ' + cls : '');
      el.setAttribute('aria-hidden', 'true');
      document.body.appendChild(el);
      return el;
    },
    load(src) {
      return new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(im); im.src = src; });
    },
    // the opening photograph, decoded, as the page shows it
    ready: (img.complete ? Promise.resolve() : new Promise((r) => { img.onload = r; img.onerror = r; })).then(() => img.decode ? img.decode().catch(() => {}) : null),
    // the window's crop of a photograph as the page shows it: object-fit cover, centred
    fit(p, W, H) {
      const s = Math.max(W / p.w, H / p.h);
      const w = p.w * s, h = p.h * s;
      return { s, w, h, x: (W - w) / 2, y: (H - h) / 2 };
    },
    // n photographs from the whole collection, one country after another, in a fixed shuffle
    pick(n) {
      const byCountry = new Map();
      others.forEach((p) => { if (!byCountry.has(p.country)) byCountry.set(p.country, []); byCountry.get(p.country).push(p); });
      const lists = [...byCountry.values()];
      let seed = 7;
      const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      lists.forEach((l) => l.sort(() => rnd() - 0.5));
      const out = [];
      for (let i = 0; out.length < n && i < 40; i++) lists.forEach((l) => { if (l[i] && out.length < n) out.push(l[i]); });
      return out;
    },
    easeOut: (u) => 1 - Math.pow(1 - u, 3),
    easeInOut: (u) => u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2,
    clamp: (u) => Math.max(0, Math.min(1, u)),
    done(stage, wait) {
      setTimeout(() => {
        html.classList.add('op-done');
        if (stage) { stage.classList.add('out'); setTimeout(() => stage.remove(), 1200); }
        history.replaceState(null, '', location.pathname);   // a reload is the page itself again
      }, wait || 0);
    },
  };
  window.OPENING = o;
  window.Openings = window.Openings || {};

  if (name === 'pullback' && version === 1) { o.done(null, 3000); return; }   // the first is done in the stylesheet

  const s = document.createElement('script');
  s.src = root + 'js/opening/' + name + '.js';
  s.onload = () => { const fn = window.Openings[name]; if (fn) fn(o); else o.done(null, 0); };
  s.onerror = () => { html.classList.remove('op', 'op-' + name); };
  document.body.appendChild(s);
})();

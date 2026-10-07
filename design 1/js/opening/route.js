/* Route. A paper map. A pen line draws every journey he has made, in order, from Taipei
   out and back; at each place a small print lands. Then the map dives into the last place
   and its print is the photograph. From his list: Codrops' Storytelling Map. */
window.Openings.route = function (o) {
  'use strict';
  const stage = o.stage('paper');
  o.style(`
    .op-rt svg { position: absolute; inset: 0; display: block; }
    .op-rt .land { fill: oklch(91.8% 0.013 80); stroke: oklch(84.5% 0.015 78); stroke-width: 0.6; }
    .op-rt .ink { fill: none; stroke: oklch(46% 0.092 47); stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
    .op-rt .print { opacity: 0; transition: opacity 400ms var(--out); }
    .op-rt .print.in { opacity: 1; }
    .op-rt img.end { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; }
  `);
  stage.classList.add('op-rt');
  const W = innerWidth, H = innerHeight;
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('width', W); svg.setAttribute('height', H);
  const g = document.createElementNS(NS, 'g');
  svg.appendChild(g); stage.appendChild(svg);
  const end = new Image(); end.className = 'end'; end.src = o.src(o.lead); end.alt = ''; stage.appendChild(end);
  const load = (src) => new Promise((r) => { const s = document.createElement('script'); s.src = src; s.onload = r; s.onerror = r; document.head.appendChild(s); });
  Promise.all([load(o.root + 'vendor/d3.min.js').then(() => load(o.root + 'vendor/topojson-client.min.js')),
               fetch(o.root + 'vendor/countries-110m.json').then((r) => r.json()), o.load(end.src)]).then(([, world]) => {
    const d3 = window.d3, land = window.topojson.feature(world, world.objects.land || world.objects.countries);
    // the map is fitted to his world: from Western Europe to New Zealand, centred on the Pacific side
    const proj = d3.geoNaturalEarth1().rotate([-150, 0]);
    proj.fitExtent([[W * 0.04, H * 0.08], [W * 0.96, H * 0.92]], { type: 'Sphere' });
    const path = d3.geoPath(proj);
    const landEl = document.createElementNS(NS, 'path'); landEl.setAttribute('class', 'land'); landEl.setAttribute('d', path(land)); g.appendChild(landEl);
    // the line: every leg in order, as great circles
    const legs = window.JOURNEY_LEGS || [];
    const line = { type: 'MultiLineString', coordinates: legs.map((l) => [[l[1], l[0]], [l[3], l[2]]]) };
    const ink = document.createElementNS(NS, 'path'); ink.setAttribute('class', 'ink'); ink.setAttribute('d', path(line)); g.appendChild(ink);
    const L = ink.getTotalLength();
    ink.style.strokeDasharray = L; ink.style.strokeDashoffset = L;
    // a small print at each country, in the order the line reaches it
    const seen = new Set(), stops = [];
    legs.forEach((l, i) => { const c = l[4]; if (!seen.has(c) && window.COUNTRY_LL[c]) { seen.add(c); stops.push({ c, at: (i + 1) / legs.length }); } });
    const size = Math.max(34, Math.min(56, W * 0.04));
    const prints = stops.map((s) => {
      const ll = window.COUNTRY_LL[s.c], pt = proj([ll[1], ll[0]]);
      const p = (window.ALL_PHOTOS.find((x) => x.country === s.c && x.id !== o.lead.id) || window.ALL_PHOTOS.find((x) => x.country === s.c));
      if (!p || !pt) return null;
      const im = document.createElementNS(NS, 'image');
      im.setAttribute('href', o.src(p, 640)); im.setAttribute('class', 'print');
      im.setAttribute('x', pt[0] - size / 2); im.setAttribute('y', pt[1] - size * 0.72 - size / 2);
      im.setAttribute('width', size); im.setAttribute('height', size * 0.72); im.setAttribute('preserveAspectRatio', 'xMidYMid slice');
      g.appendChild(im);
      return { im, at: s.at };
    }).filter(Boolean);
    const target = proj([o.lead.ll[1], o.lead.ll[0]]);
    const T_DRAW = 4200, T_DIVE = 1900, T = T_DRAW + 500 + T_DIVE;
    const t0 = performance.now();
    function frame(now) {
      const t = now - t0;
      const d = o.easeInOut(o.clamp(t / T_DRAW));
      ink.style.strokeDashoffset = (L * (1 - d)).toFixed(1);
      prints.forEach((p) => { if (d >= p.at - 0.01) p.im.classList.add('in'); });
      const v = o.easeInOut(o.clamp((t - T_DRAW - 500) / T_DIVE));
      if (v > 0) {
        const s = Math.pow(40, v);
        g.setAttribute('transform', `translate(${W / 2} ${H / 2}) scale(${s}) translate(${-target[0]} ${-(target[1] - size * 0.36)})`);
        end.style.opacity = o.easeInOut(o.clamp((v - 0.55) / 0.45)).toFixed(3);
      }
      if (t < T) requestAnimationFrame(frame); else o.done(stage, 100);
    }
    requestAnimationFrame(frame);
  });
};

/* The two mixes of his two picks (2026-10-18): Logbook and Atlas.

   The Atlas frame (a line map held still beside the list) with the Logbook's contents (his
   flights leaving Taiwan once, all together; the trips by year, each with a strip of its
   photographs). Reading down the list, the map turns to the trip in hand and draws its route.
   One script, two looks: logbook-atlas.html wears the Logbook (body.logbook), atlas-logbook.html
   the Atlas (body.atlas). A trip opens on "The trip, along its route" (wc-sketch/trip). */
(() => {
  'use strict';

  const K = window.Kit;
  const { esc, $ } = K;
  const main = $('#main');
  const top = $('#top');
  const S = K.S;
  const ll = (p) => [p[1], p[0]];
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const ease = d3.easeCubicInOut;
  // a small airliner seen from above, nose along +x
  const PLANE = 'M9,0C9,-0.8 8,-1.1 6.5,-1.1L2,-1.1L-2.5,-7.5L-4.3,-7.5L-1.8,-1.1L-6,-1.1L-7.8,-3.6L-9,-3.6L-8,0L-9,3.6L-7.8,3.6L-6,1.1L-1.8,1.1L-4.3,7.5L-2.5,7.5L2,1.1L6.5,1.1C8,1.1 9,0.8 9,0Z';
  const page = location.pathname.split('/').pop().replace('.html', '');
  const tripHref = (t) => `../wc-sketch/trip/?trip=${encodeURIComponent(t.id)}&from=${page}`;

  // the month without the year, inside a year's group ("August"; "8 月")
  const month = (t) => {
    const d = K.when(t);
    return K.lang === 'zh' ? d.replace(/^\d{4}\s*(年\s*)?/, '').replace(/^\d{4}$/, '') : d.replace(/\s*\d{4}$/, '').replace(/^\d{4}$/, '');
  };

  /* ------------------------------------------------------------ the map beside the list */

  async function makeMap(svgEl) {
    const box = svgEl.getBoundingClientRect();
    const W = Math.max(320, box.width), H = Math.max(240, box.height);
    const svg = d3.select(svgEl).attr('viewBox', `0 0 ${W} ${H}`);
    svg.selectAll('*').remove();
    // the world between 78°N and 58°S, centred on the Pacific so no flight from Taiwan breaks
    const proj = d3.geoNaturalEarth1().rotate([-150, 0]);
    const band = [];
    for (let lon = -180; lon <= 180; lon += 5) band.push([lon, 78], [lon, -58]);
    proj.fitExtent([[12, 12], [W - 12, H - 12]], { type: 'MultiPoint', coordinates: band });
    const zoom = svg.append('g').attr('class', 'mx-zoom');
    const { path } = await K.drawWorld(zoom, proj);
    const sky = zoom.append('g').attr('class', 'sky');
    const legsG = zoom.append('g');
    const dotsG = zoom.append('g');
    const labels = svg.append('g');
    const home = proj(ll(S.flightsFrom));
    const homeDot = zoom.append('circle').attr('class', 'home').attr('cx', home[0]).attr('cy', home[1]).attr('r', 2.4);

    let view = { k: 1, x: 0, y: 0 };
    const apply = (v) => {
      zoom.attr('transform', `translate(${v.x},${v.y}) scale(${v.k})`);
      dotsG.selectAll('circle').attr('r', 2.8 / v.k);
      sky.selectAll('circle.end').attr('r', 2.2 / v.k);
      homeDot.attr('r', 2.6 / v.k);
      labels.selectAll('text').attr('x', (s) => proj(ll(s.at.ll))[0] * v.k + v.x).attr('y', (s) => proj(ll(s.at.ll))[1] * v.k + v.y - 9);
    };
    const fit = (geom) => {
      if (!geom) return { k: 1, x: 0, y: 0 };
      const [[x0, y0], [x1, y1]] = path.bounds(geom);
      const k = Math.min(9, 0.62 / Math.max((x1 - x0) / W, (y1 - y0) / H, 0.02));
      return { k, x: W / 2 - k * (x0 + x1) / 2, y: H / 2 - k * (y0 + y1) / 2 };
    };
    const go = (to) => {
      const from = { ...view };
      view = to;
      if (K.reduced) { apply(to); return; }
      svg.transition('view').duration(1100).ease(ease).tween('view', () => {
        const i = d3.interpolate(from, to);
        return (t) => { view = i(t); apply(view); if (t === 1) view = to; };
      });
    };

    // the trip in hand: its legs in the route colour, its countries warmer, its stops named
    const all = K.trips.flatMap((t) => t.legs.map((l) => ({ l, t })));
    legsG.selectAll('path').data(all).join('path')
      .attr('class', (d) => `leg${d.l.mode === 'flight' ? '' : ' leg--ground'}`).attr('d', (d) => path(K.legGeo(d.l)));
    function show(t) {
      svg.classed('is-trip', !!t);
      legsG.selectAll('path').classed('is-on', (d) => d.t === t);
      zoom.selectAll('path.visited').classed('is-on', (f) => !!t && t.countries.some((c) => K.ISO[c.id] === f.id));
      const stops = t ? t.stops : [];
      dotsG.selectAll('circle').data(stops).join('circle').attr('class', 'dot')
        .attr('cx', (s) => proj(ll(s.at.ll))[0]).attr('cy', (s) => proj(ll(s.at.ll))[1]);
      const geom = !t ? null : { type: 'GeometryCollection', geometries: t.legs.length ? t.legs.map(K.legGeo) : t.stops.map((s) => ({ type: 'Point', coordinates: ll(s.at.ll) })) };
      const v = fit(geom);
      if (geom && !t.legs.length) v.k = Math.min(v.k, 4);
      const placed = [];
      const named = stops.filter((s) => {
        const p = proj(ll(s.at.ll)).map((c) => c * v.k);
        const wd = K.nameOf(s.at).length * 7.5;
        if (p[0] + v.x < 0 || p[0] + v.x > W || p[1] + v.y < 0 || p[1] + v.y > H) return false;
        if (placed.some((q) => Math.abs(q[0] - p[0]) < (q[2] + wd) / 2 + 8 && Math.abs(q[1] - p[1]) < 16)) return false;
        placed.push([p[0], p[1], wd]);
        return true;
      });
      labels.selectAll('text').data(named, (s) => s.at.city).join('text').attr('class', 'mx-label').text((s) => K.nameOf(s.at));
      go(v);
    }

    // his flights, once, all from Taiwan: one to each country he has been to, the nearer first
    function flyOut() {
      const dests = new Map();
      for (const t of K.trips) {
        for (const l of t.legs) {
          if (l.mode === 'flight' && K.km(l.from.ll, S.flightsFrom) < 80 && K.km(l.to.ll, S.flightsFrom) > 80) dests.set(l.to.city, l.to.ll);
        }
        if (!t.legs.length) t.countries.forEach((c) => dests.set(c.name.en, c.ll));
      }
      const others = S.countries.filter((c) => K.km(c.ll, S.flightsFrom) > 80);
      const nearest = (p) => others.reduce((b, c) => (K.km(c.ll, p) < K.km(b.ll, p) ? c : b), others[0]);
      const covered = new Set([...dests.values()].map((p) => nearest(p)));
      others.filter((c) => !covered.has(c)).forEach((c) => dests.set(c.name.en, c.ll));
      const from = ll(S.flightsFrom);
      const flights = [...dests.values()].map((p) => ({ to: ll(p), go: d3.geoInterpolate(from, ll(p)), dur: 1600 + Math.min(1, K.km(S.flightsFrom, p) / 13000) * 3600 }));
      const lines = sky.selectAll('path.fly').data(flights).join('path').attr('class', 'fly');
      const ends = sky.selectAll('circle.end').data(flights).join('circle').attr('class', 'end')
        .attr('cx', (f) => proj(f.to)[0]).attr('cy', (f) => proj(f.to)[1]).attr('r', 2.2 / view.k);
      if (K.reduced) {
        lines.attr('d', (f) => path({ type: 'LineString', coordinates: [from, f.to] }));
        ends.classed('is-in', true);
        return;
      }
      const planes = sky.selectAll('path.plane').data(flights).join('path').attr('class', 'plane').attr('d', PLANE).attr('opacity', 0);
      const rings = sky.selectAll('circle.ring').data(flights).join('circle').attr('class', 'ring')
        .attr('cx', (f) => proj(f.to)[0]).attr('cy', (f) => proj(f.to)[1]).attr('opacity', 0);
      const t0 = performance.now();
      const frame = (now) => {
        const el = now - t0;
        let flying = false;
        lines.attr('d', (f) => {
          const t = clamp(el / f.dur, 0, 1);
          return t > 0 ? path({ type: 'LineString', coordinates: [from, f.go(ease(t))] }) : null;
        });
        planes.each(function (f) {
          const t = el / f.dur;
          if (t >= 1) { this.setAttribute('opacity', 0); return; }
          flying = true;
          const e = ease(t);
          const p = proj(f.go(e)), q = proj(f.go(Math.min(1, e + 0.004)));
          const ang = (Math.atan2(q[1] - p[1], q[0] - p[0]) * 180) / Math.PI;
          this.setAttribute('opacity', 1);
          this.setAttribute('transform', `translate(${p[0].toFixed(1)},${p[1].toFixed(1)}) rotate(${ang.toFixed(1)}) scale(${(0.95 / view.k).toFixed(3)})`);
        });
        rings.each(function (f) {
          const k = (el - f.dur) / 1200;
          if (k < 0 || k > 1) { this.setAttribute('opacity', 0); return; }
          flying = true;
          this.setAttribute('opacity', (1 - k).toFixed(3));
          this.setAttribute('r', ((2 + k * 9) / view.k).toFixed(2));
        });
        ends.classed('is-in', (f) => el >= f.dur);
        if (flying) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    }
    return { show, flyOut };
  }

  // the item nearest the reading line is the one in hand
  let onScroll = null;
  function follow(items, onPick) {
    let current = null;
    const pick = () => {
      // on a phone the map is pinned across the top: measure from its lower edge
      const m = document.querySelector('.mx-map');
      const r = m ? m.getBoundingClientRect() : null;
      const edge = r && r.top <= 1 && r.width >= innerWidth - 2 ? r.bottom : 0;
      const mid = edge + (innerHeight - edge) * 0.4;
      let best = null, bd = Infinity;
      for (const el of items) {
        const b = el.getBoundingClientRect();
        const d = b.top > mid ? b.top - mid : b.bottom < mid ? mid - b.bottom : 0;
        if (d < bd) { bd = d; best = el; }
      }
      // at the top of the page the whole world stays in hand, so the flights from Taiwan are seen
      if (scrollY < 80) best = items[0];
      if (best !== current) { current = best; onPick(best); }
    };
    let raf = 0;
    if (onScroll) removeEventListener('scroll', onScroll);
    onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(pick); };
    addEventListener('scroll', onScroll, { passive: true });
    pick();
    return pick;
  }

  /* ------------------------------------------------------------ the page */

  async function front() {
    const w = K.W();
    const tl = K.tally();
    document.title = `${w.journey} · tuan photography 陳亮元`;
    const years = [];
    for (const t of K.trips) {
      let y = years.find((g) => g.year === t.year);
      if (!y) years.push((y = { year: t.year, trips: [] }));
      y.trips.push(t);
    }
    main.innerHTML = `
      <div class="mx-frame">
        <figure class="mx-map map" aria-hidden="true"><svg id="map"></svg></figure>
        <div class="mx-side">
          <header class="mx-head">
            <h1 class="mx-head__title">${esc(w.journey)}</h1>
            <p class="mx-head__intro">${esc(w.intro)}</p>
            <p class="mx-head__tally"><span>${esc(w.trips(tl.trips))}</span><span>${esc(w.countries(tl.countries))}</span><span>${esc(w.since(tl.since))}</span></p>
          </header>
          ${years.map((g) => `
          <section class="mx-year">
            <h2 class="mx-year__n">${g.year}</h2>
            <ol>${g.trips.map((t) => `
              <li class="mx-trip" data-trip="${t.id}">
                <${t.legs.length ? `a class="mx-trip__link" href="${tripHref(t)}"` : 'div class="mx-trip__link"'}>
                  <span class="mx-trip__when caps">${esc(month(t))}</span>
                  <span class="mx-trip__title">${esc(K.title(t))}</span>
                  <span class="mx-trip__route">${t.legs.length ? esc(K.route(t).join(w.list)) : esc(w.noRoute)}</span>
                </${t.legs.length ? 'a' : 'div'}>
                ${t.photos.length ? `<div class="mx-trip__strip" data-set="${t.photos.join(',')}">${t.photos.slice(0, 4).map((id) => K.img(id, '8rem', 'mx-trip__thumb')).join('')}${t.photos.length > 4 ? `<span class="mx-trip__more">+${t.photos.length - 4}</span>` : ''}</div>` : ''}
              </li>`).join('')}
            </ol>
          </section>`).join('')}
        </div>
      </div>`;
    const map = await makeMap($('#map'));
    const lis = [$('.mx-head'), ...main.querySelectorAll('.mx-trip')];
    let hovering = null;
    const pick = (el) => {
      main.querySelectorAll('.mx-trip').forEach((x) => x.classList.toggle('is-on', x === el));
      if (hovering) return;
      map.show(el && el.dataset.trip ? K.byId(el.dataset.trip) : null);
    };
    const repick = follow(lis, pick);
    main.querySelectorAll('.mx-trip').forEach((li) => {
      li.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'mouse') return; hovering = li; map.show(K.byId(li.dataset.trip)); });
      li.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'mouse') return; hovering = null; repick(); });
    });
    setTimeout(map.flyOut, 400);
  }

  let resizeT = 0, width = innerWidth;
  addEventListener('resize', () => {
    if (Math.abs(innerWidth - width) < 40) return;
    width = innerWidth;
    clearTimeout(resizeT);
    resizeT = setTimeout(front, 400);
  });
  function render() { top.innerHTML = K.topbar('journey'); front(); }
  K.onLang(render);
  render();
})();

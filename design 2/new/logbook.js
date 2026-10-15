/* Direction A, "Logbook": the trips as a printed travel log, year by year, under a world across
   which his flights leave Taiwan once, all together, the nearer ones landing first. A trip opens
   on the Journey page's own trip story, "The trip, along its route" (wc-sketch/trip). */
(() => {
  'use strict';

  const K = window.Kit;
  const { esc, $ } = K;
  const main = $('#main');
  const top = $('#top');
  const S = K.S;
  const lonlat = (p) => [p[1], p[0]];
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const ease = d3.easeCubicInOut;
  // a small airliner seen from above, nose along +x
  const PLANE = 'M9,0C9,-0.8 8,-1.1 6.5,-1.1L2,-1.1L-2.5,-7.5L-4.3,-7.5L-1.8,-1.1L-6,-1.1L-7.8,-3.6L-9,-3.6L-8,0L-9,3.6L-7.8,3.6L-6,1.1L-1.8,1.1L-4.3,7.5L-2.5,7.5L2,1.1L6.5,1.1C8,1.1 9,0.8 9,0Z';

  const tripHref = (t) => `../wc-sketch/trip/?trip=${encodeURIComponent(t.id)}&from=logbook`;

  // the month without the year, inside a year's group ("August"; "8 月")
  const month = (t) => {
    const d = K.when(t);
    return K.lang === 'zh' ? d.replace(/^\d{4}\s*年\s*/, '').replace(/^\d{4}$/, '') : d.replace(/\s*\d{4}$/, '').replace(/^\d{4}$/, '');
  };

  // things are ruled in as they are reached
  let io = null;
  function arrive() {
    if (io) io.disconnect();
    const els = main.querySelectorAll('.lb-in');
    if (K.reduced || !('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('is-in')); return; }
    io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach((e) => io.observe(e));
  }

  /* ------------------------------------------------------------ the log */

  function front() {
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
      <header class="lb-head">
        <h1 class="lb-head__title">${esc(w.journey)}</h1>
        <p class="lb-head__intro">${esc(w.intro)}</p>
        <p class="lb-head__tally"><span>${esc(w.trips(tl.trips))}</span><span>${esc(w.countries(tl.countries))}</span><span>${esc(w.since(tl.since))}</span></p>
      </header>
      <figure class="lb-world map" aria-hidden="true"><svg id="world"></svg></figure>
      <div class="lb-log">${years.map((g) => `
        <section class="lb-year lb-in">
          <h2 class="lb-year__n">${g.year}</h2>
          <ol class="lb-year__trips">${g.trips.map((t) => `
            <li class="lb-row lb-in">
              <${t.legs.length ? `a class="lb-row__link" href="${tripHref(t)}"` : 'div class="lb-row__link"'}>
                <span class="lb-row__when caps">${esc(month(t))}</span>
                <span class="lb-row__what">
                  <span class="lb-row__title">${esc(K.title(t))}</span>
                  <span class="lb-row__route">${t.legs.length ? esc(K.route(t).join(w.list)) : esc(w.noRoute)}</span>
                </span>
              </${t.legs.length ? 'a' : 'div'}>
              <div class="lb-row__strip" data-set="${t.photos.join(',')}">${t.photos.slice(0, 5).map((id) => K.img(id, '9rem', 'lb-row__thumb')).join('')}${t.photos.length > 5 ? `<span class="lb-row__more">+${t.photos.length - 5}</span>` : ''}</div>
            </li>`).join('')}
          </ol>
        </section>`).join('')}
      </div>`;
    drawWorldStrip();
    arrive();
  }

  async function drawWorldStrip() {
    const svgEl = $('#world');
    const svg = d3.select(svgEl);
    const W = 1200;
    const proj = d3.geoNaturalEarth1().rotate([-150, 0]).fitWidth(W, { type: 'Sphere' });
    const y0 = proj([150, 80])[1], y1 = proj([150, -48])[1];
    svg.attr('viewBox', `0 ${y0.toFixed(0)} ${W} ${(y1 - y0).toFixed(0)}`).attr('class', 'lb-world__svg');
    const { g, path } = await K.drawWorld(svg, proj);
    const sky = g.append('g').attr('class', 'sky');
    const [hx, hy] = proj(lonlat(S.flightsFrom));
    g.append('circle').attr('class', 'home').attr('cx', hx).attr('cy', hy).attr('r', 2.6);
    flyOut(svgEl, sky, path, proj);
  }

  /* ------------------------------------------------------------ the flights: once, all from Taiwan */

  function flyOut(svgEl, sky, path, proj) {
    // every place he flew to from home, and the countries of trips with no route recorded
    const home = lonlat(S.flightsFrom);
    const dests = new Map();
    for (const t of K.trips) {
      for (const l of t.legs) {
        if (l.mode === 'flight' && K.km(l.from.ll, S.flightsFrom) < 80 && K.km(l.to.ll, S.flightsFrom) > 80) dests.set(l.to.city, l.to.ll);
      }
      if (!t.legs.length) t.countries.forEach((c) => dests.set(c.name.en, c.ll));
    }
    // and every other country he has been to, so none is left without its flight
    const others = S.countries.filter((c) => K.km(c.ll, S.flightsFrom) > 80);
    const nearest = (ll) => others.reduce((b, c) => (K.km(c.ll, ll) < K.km(b.ll, ll) ? c : b), others[0]);
    const covered = new Set([...dests.values()].map((ll) => nearest(ll)));
    others.filter((c) => !covered.has(c)).forEach((c) => dests.set(c.name.en, c.ll));
    const flights = [...dests.values()].map((ll) => {
      const km = K.km(S.flightsFrom, ll);
      return { to: lonlat(ll), go: d3.geoInterpolate(home, lonlat(ll)), dur: 1600 + Math.min(1, km / 13000) * 3600 };
    });
    const lines = sky.selectAll('path.fly').data(flights).join('path').attr('class', 'fly');
    const ends = sky.selectAll('circle.end').data(flights).join('circle').attr('class', 'end')
      .attr('cx', (f) => proj(f.to)[0]).attr('cy', (f) => proj(f.to)[1]).attr('r', 2.2);
    if (K.reduced) {
      lines.attr('d', (f) => path({ type: 'LineString', coordinates: [home, f.to] }));
      ends.classed('is-in', true);
      return;
    }
    const planes = sky.selectAll('path.plane').data(flights).join('path').attr('class', 'plane').attr('d', PLANE).attr('opacity', 0);
    const rings = sky.selectAll('circle.ring').data(flights).join('circle').attr('class', 'ring')
      .attr('cx', (f) => proj(f.to)[0]).attr('cy', (f) => proj(f.to)[1]).attr('opacity', 0);

    // they leave when the map comes into view, once
    let started = false;
    const watch = new IntersectionObserver((es) => {
      if (started || !es[0].isIntersecting) return;
      started = true;
      watch.disconnect();
      setTimeout(() => {
        const t0 = performance.now();
        const frame = (now) => {
          const el = now - t0;
          let flying = false;
          lines.attr('d', (f) => {
            const t = clamp(el / f.dur, 0, 1);
            return t > 0 ? path({ type: 'LineString', coordinates: [home, f.go(ease(t))] }) : null;
          });
          planes.each(function (f) {
            const t = el / f.dur;
            if (t >= 1) { this.setAttribute('opacity', 0); return; }
            flying = true;
            const e = ease(t);
            const p = proj(f.go(e)), q = proj(f.go(Math.min(1, e + 0.004)));
            const ang = (Math.atan2(q[1] - p[1], q[0] - p[0]) * 180) / Math.PI;
            this.setAttribute('opacity', 1);
            this.setAttribute('transform', `translate(${p[0].toFixed(1)},${p[1].toFixed(1)}) rotate(${ang.toFixed(1)}) scale(0.95)`);
          });
          // each lands with a ring of the pen, then a small mark stays
          rings.each(function (f) {
            const k = (el - f.dur) / 1200;
            if (k < 0 || k > 1) { this.setAttribute('opacity', 0); if (k > 1) return; return; }
            flying = true;
            this.setAttribute('opacity', (1 - k).toFixed(3));
            this.setAttribute('r', (2 + k * 9).toFixed(2));
          });
          ends.classed('is-in', (f) => el >= f.dur);
          if (flying) requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      }, 400);
    }, { threshold: 0.35 });
    watch.observe(svgEl);
  }

  function render() {
    top.innerHTML = K.topbar('journey');
    // an old address for one trip goes to that trip's story
    const t = K.ask.get('trip') && K.byId(K.ask.get('trip'));
    if (t && t.legs.length) { location.replace(tripHref(t)); return; }
    front();
  }
  K.onLang(render);
  render();
})();

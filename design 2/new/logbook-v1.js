/* Direction A, "Logbook": the trips as a printed travel log, year by year. Each trip is one
   ruled line: when, the shape its route drew, where, and a strip of its photographs. A trip
   opens as a log entry: the route as a line of stops, then each stop with its contact sheet. */
(() => {
  'use strict';

  const K = window.Kit;
  const { esc, $ } = K;
  const main = $('#main');
  const top = $('#top');

  // the month without the year, inside a year's group ("August"; "8 月")
  const month = (t) => {
    const d = K.when(t);
    return K.lang === 'zh' ? d.replace(/^\d{4}\s*年\s*/, '').replace(/^\d{4}$/, '') : d.replace(/\s*\d{4}$/, '').replace(/^\d{4}$/, '');
  };
  const n = (x) => x.toLocaleString('en');

  // the shape a trip's route drew, as a small signature of ink (no land, no names)
  function glyph(t, w, h, cls) {
    const pts = t.legs.length ? t.legs.flatMap((l) => [l.from.ll, l.to.ll]) : t.stops.map((s) => s.at.ll);
    const mp = t.legs.length
      ? { type: 'GeometryCollection', geometries: t.legs.map(K.legGeo) }
      : { type: 'MultiPoint', coordinates: pts.map((p) => [p[1], p[0]]) };
    const pad = 5;
    const proj = d3.geoMercator().fitExtent([[pad, pad], [w - pad, h - pad]], mp);
    if (pts.length < 2 || !t.legs.length) proj.scale(Math.min(proj.scale(), 400)).center([pts[0][1], pts[0][0]]).translate([w / 2, h / 2]);
    const path = d3.geoPath(proj);
    const legs = t.legs.map((l) => `<path class="g-leg${l.mode === 'flight' ? '' : ' g-leg--ground'}" d="${path(K.legGeo(l))}"/>`).join('');
    const dots = t.stops.map((s) => { const [x, y] = proj([s.at.ll[1], s.at.ll[0]]); return `<circle class="g-stop" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.6"/>`; }).join('');
    const home = t.legs.length ? (() => { const [x, y] = proj([t.legs[0].from.ll[1], t.legs[0].from.ll[0]]); return `<circle class="g-home" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2"/>`; })() : '';
    return `<svg class="${cls}" viewBox="0 0 ${w} ${h}" aria-hidden="true">${legs}${dots}${home}</svg>`;
  }

  /* ------------------------------------------------------------ the log */

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
      <header class="lb-head">
        <h1 class="lb-head__title">${esc(w.journey)}</h1>
        <p class="lb-head__intro">${esc(w.intro)}</p>
        <p class="lb-head__tally"><span>${esc(w.trips(tl.trips))}</span><span>${esc(w.countries(tl.countries))}</span><span>${esc(w.since(tl.since))}</span></p>
      </header>
      <figure class="lb-world map" aria-hidden="true"><svg id="world"></svg></figure>
      <div class="lb-log">${years.map((g) => `
        <section class="lb-year">
          <h2 class="lb-year__n">${g.year}</h2>
          <ol class="lb-year__trips">${g.trips.map((t) => `
            <li class="lb-row">
              <a class="lb-row__link" href="${K.tripHref(t)}">
                <span class="lb-row__when caps">${esc(month(t))}</span>
                ${glyph(t, 84, 56, 'lb-row__glyph')}
                <span class="lb-row__what">
                  <span class="lb-row__title">${esc(K.title(t))}</span>
                  <span class="lb-row__route">${t.legs.length ? esc(K.route(t).join(w.list)) : esc(w.noRoute)}</span>
                </span>
              </a>
              <div class="lb-row__strip" data-set="${t.photos.join(',')}">${t.photos.slice(0, 5).map((id) => K.img(id, '7rem', 'lb-row__thumb')).join('')}${t.photos.length > 5 ? `<span class="lb-row__more">+${t.photos.length - 5}</span>` : ''}</div>
            </li>`).join('')}
          </ol>
        </section>`).join('')}
      </div>`;
    drawWorldStrip();
  }

  async function drawWorldStrip() {
    const svg = d3.select('#world');
    const W = 1200;
    const proj = d3.geoNaturalEarth1().rotate([-150, 0]).fitWidth(W, { type: 'Sphere' });
    const y0 = proj([150, 80])[1], y1 = proj([150, -48])[1];
    svg.attr('viewBox', `0 ${y0.toFixed(0)} ${W} ${(y1 - y0).toFixed(0)}`).attr('class', 'lb-world__svg');
    const { g, path } = await K.drawWorld(svg, proj);
    const legs = K.trips.flatMap((t) => t.legs);
    g.append('g').selectAll('path').data(legs).join('path')
      .attr('class', (l) => `leg${l.mode === 'flight' ? '' : ' leg--ground'}`).attr('d', (l) => path(K.legGeo(l)));
    const [hx, hy] = proj([K.S.flightsFrom[1], K.S.flightsFrom[0]]);
    g.append('circle').attr('class', 'home').attr('cx', hx).attr('cy', hy).attr('r', 2.6);
  }

  /* ------------------------------------------------------------ one entry */

  async function entry(t) {
    const w = K.W();
    const i = K.trips.indexOf(t);
    const newer = K.trips[i - 1], older = K.trips[i + 1];
    document.title = `${K.title(t)} · tuan photography 陳亮元`;
    const facts = [w.stops(t.stops.length)];
    if (t.km) facts.push(w.km(t.km));
    facts.push(w.photos(t.photos.length));

    // the route as a line of stops, home at both ends
    let line = '';
    if (t.legs.length) {
      const start = t.legs[0].from;
      line = `<ol class="lb-line">
        <li class="lb-line__stop lb-line__stop--home"><span class="lb-line__name">${esc(K.nameOf(start))}</span></li>
        ${t.chapters.map((c) => `
        <li class="lb-line__leg${c.legs.every((l) => l.mode === 'flight') ? '' : ' lb-line__leg--ground'}"><span class="lb-line__how">${esc([...new Set(c.legs.map((l) => w.mode[l.mode] || l.mode))].join(w.list))}</span><span class="lb-line__km">${esc(w.km(c.legs.reduce((s, l) => s + l.km, 0)))}</span></li>
        <li class="lb-line__stop${c.home ? ' lb-line__stop--home' : ''}"><span class="lb-line__name">${esc(K.nameOf(c.at))}</span></li>`).join('')}
      </ol>`;
    }

    const stops = t.stops.map((c) => `
      <section class="lb-stop">
        <header class="lb-stop__head">
          ${c.legs.length ? `<p class="lb-stop__how caps">${esc(K.legLine(c))}</p>` : ''}
          <h2 class="lb-stop__name">${esc(K.nameOf(c.at))}</h2>
          ${c.country && c.country.name.en !== c.at.city ? `<p class="lb-stop__where">${esc(c.country.name[K.lang])}</p>` : ''}
        </header>
        ${c.photos.length
          ? `<div class="lb-sheet" data-set="${t.photos.join(',')}">${c.photos.map((id) => K.shot(id, '(max-width: 47.99rem) 92vw, 33vw')).join('')}</div>`
          : `<p class="lb-blank">${esc(w.blank)}</p>`}
      </section>`).join('');

    main.innerHTML = `
      <nav class="lb-trail" aria-label="${esc(w.all)}">
        <a class="word" href="logbook-v1.html">${esc(w.all)}</a>
        <span class="lb-trail__step">
          ${newer ? `<a class="word" href="${K.tripHref(newer)}">${esc(w.newer)}</a>` : ''}
          ${older ? `<a class="word" href="${K.tripHref(older)}">${esc(w.older)}</a>` : ''}
        </span>
      </nav>
      <header class="lb-entry">
        <div class="lb-entry__say">
          <p class="lb-entry__when caps">${esc(K.when(t))}</p>
          <h1 class="lb-entry__title">${esc(K.title(t))}</h1>
          <p class="lb-entry__facts">${facts.map((f) => `<span>${esc(f)}</span>`).join('')}</p>
        </div>
        <figure class="lb-entry__map map" aria-hidden="true"><svg id="tripmap"></svg></figure>
      </header>
      ${line}
      <div class="lb-stops">${stops}</div>
      <footer class="lb-guides">
        <h2 class="lb-guides__head caps">${esc(w.passed)}</h2>
        <ul>${t.countries.map((c) => `<li><a href="${K.guideHref(c)}">${esc(w.guides(c.name[K.lang]))}</a></li>`).join('')}</ul>
      </footer>`;
    drawTripMap(t);
    scrollTo(0, 0);
  }

  async function drawTripMap(t) {
    const svg = d3.select('#tripmap');
    const W = 520, H = 360;
    svg.attr('viewBox', `0 0 ${W} ${H}`);
    const pts = t.legs.length ? t.legs.flatMap((l) => [l.from.ll, l.to.ll]) : t.stops.map((s) => s.at.ll);
    const mp = t.legs.length
      ? { type: 'GeometryCollection', geometries: t.legs.map(K.legGeo) }
      : { type: 'MultiPoint', coordinates: pts.map((p) => [p[1], p[0]]) };
    const proj = d3.geoMercator().fitExtent([[28, 28], [W - 28, H - 28]], mp);
    if (pts.length < 2) proj.scale(1400).center([pts[0][1], pts[0][0]]).translate([W / 2, H / 2]);
    const { g, path } = await K.drawWorld(svg, proj);
    g.append('g').selectAll('path').data(t.legs).join('path')
      .attr('class', (l) => `leg leg--trip${l.mode === 'flight' ? '' : ' leg--ground'}`).attr('d', (l) => path(K.legGeo(l)));
    g.append('g').selectAll('circle').data(t.stops).join('circle')
      .attr('class', 'dot').attr('r', 2.8).attr('cx', (s) => proj([s.at.ll[1], s.at.ll[0]])[0]).attr('cy', (s) => proj([s.at.ll[1], s.at.ll[0]])[1]);
  }

  function render() {
    top.innerHTML = K.topbar('journey');
    const t = K.ask.get('trip') && K.byId(K.ask.get('trip'));
    if (t) entry(t); else front();
  }
  K.onLang(render);
  render();
})();

/* Direction B, "Chapters": each trip opens like a chapter of a photo book, with one large
   photograph and its name beneath. A trip is then read as a photo essay, stop by stop, the
   photographs large and one at a time, the route drawn once at the end. */
(() => {
  'use strict';

  const K = window.Kit;
  const { esc, $ } = K;
  const main = $('#main');
  const top = $('#top');
  const S = K.S;
  const wide = (id) => S.slides[id].w >= S.slides[id].h;

  // chapters arrive as they are reached
  let io = null;
  function arrive() {
    if (io) io.disconnect();
    const els = main.querySelectorAll('.ch-arrive');
    if (K.reduced || !('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('is-in')); return; }
    io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px' });
    els.forEach((e) => io.observe(e));
  }

  /* ------------------------------------------------------------ the book of trips */

  function front() {
    const w = K.W();
    const tl = K.tally();
    document.title = `${w.journey} · tuan photography 陳亮元`;
    let year = null;
    const items = K.trips.map((t) => {
      const mark = t.year !== year ? `<p class="ch-year">${t.year}</p>` : '';
      year = t.year;
      const say = `
        <p class="ch__when caps">${esc(K.when(t))}</p>
        <h2 class="ch__title"><a href="${K.tripHref(t)}">${esc(K.title(t))}</a></h2>
        <p class="ch__route">${t.legs.length ? esc(K.route(t).join(w.list)) : esc(w.noRoute)}</p>`;
      if (!t.lead) return `${mark}<article class="ch ch--quiet ch-arrive">${say}</article>`;
      return `${mark}<article class="ch ch-arrive">
        <a class="ch__photo" href="${K.tripHref(t)}" tabindex="-1">${K.img(t.lead, '(max-width: 47.99rem) 100vw, 76rem', 'ch__img' + (wide(t.lead) ? '' : ' ch__img--tall'))}</a>
        <div class="ch__say">${say}
          <p class="ch__go"><span>${esc(w.photos(t.photos.length))}</span><a class="word" href="${K.tripHref(t)}">${esc(w.open)}</a></p>
        </div>
      </article>`;
    }).join('');
    main.innerHTML = `
      <header class="ch-head">
        <h1 class="ch-head__title">${esc(w.journey)}</h1>
        <p class="ch-head__intro">${esc(w.intro)}</p>
        <p class="ch-head__tally caps"><span>${esc(w.trips(tl.trips))}</span><span>${esc(w.countries(tl.countries))}</span></p>
      </header>
      <div class="ch-book">${items}</div>`;
    arrive();
  }

  /* ------------------------------------------------------------ one trip, as a photo essay */

  // photographs one at a time; two upright ones side by side
  function frames(ids) {
    const out = [];
    for (let i = 0; i < ids.length; i++) {
      if (!wide(ids[i]) && ids[i + 1] && !wide(ids[i + 1])) { out.push([ids[i], ids[i + 1]]); i++; } else out.push([ids[i]]);
    }
    return out.map((g) => g.length === 2
      ? `<div class="ch-pair ch-arrive">${g.map((id) => K.shot(id, '(max-width: 47.99rem) 100vw, 38rem')).join('')}</div>`
      : `<div class="ch-one ch-arrive${wide(g[0]) ? '' : ' ch-one--tall'}">${K.shot(g[0], '(max-width: 47.99rem) 100vw, 76rem')}</div>`).join('');
  }

  function essay(t) {
    const w = K.W();
    const i = K.trips.indexOf(t);
    const newer = K.trips[i - 1], older = K.trips[i + 1];
    document.title = `${K.title(t)} · tuan photography 陳亮元`;
    const facts = [w.stops(t.stops.length)];
    if (t.km) facts.push(w.km(t.km));
    if (t.photos.length) facts.push(w.photos(t.photos.length));

    const stops = t.stops.map((c) => {
      const ids = c.photos.filter((id) => id !== t.lead);
      return `<section class="ch-stop${c.photos.length ? '' : ' ch-stop--bare'}">
        <header class="ch-stop__head ch-arrive">
          ${c.legs.length ? `<p class="ch-stop__how caps">${esc(K.legLine(c))}</p>` : ''}
          <h2 class="ch-stop__name">${esc(K.nameOf(c.at))}</h2>
          ${c.country && c.country.name.en !== c.at.city ? `<p class="ch-stop__where">${esc(c.country.name[K.lang])}</p>` : ''}
        </header>
        ${ids.length ? `<div class="ch-stop__photos" data-set="${t.photos.join(',')}">${frames(ids)}</div>` : ''}
      </section>`;
    }).join('');

    main.innerHTML = `
      <nav class="ch-trail" aria-label="${esc(w.all)}">
        <a class="word" href="chapters.html">${esc(w.all)}</a>
      </nav>
      <header class="ch-open">
        ${t.lead ? `<figure class="ch-open__photo" data-set="${t.photos.join(',')}">${K.img(t.lead, '100vw', 'ch-open__img').replace('loading="lazy"', 'loading="eager" fetchpriority="high"')}</figure>` : ''}
        <p class="ch__when caps">${esc(K.when(t))}</p>
        <h1 class="ch-open__title">${esc(K.title(t))}</h1>
        <p class="ch-open__route">${t.legs.length ? esc(K.route(t).join(w.list)) : esc(w.noRoute)}</p>
        <p class="ch-open__facts">${facts.map((f) => `<span>${esc(f)}</span>`).join('')}</p>
        ${t.photos.length ? '' : `<p class="ch-open__none">${esc(w.none)}</p>`}
      </header>
      <div class="ch-stops">${stops}</div>
      <footer class="ch-end">
        ${t.legs.length ? '<figure class="ch-end__map map" aria-hidden="true"><svg id="tripmap"></svg></figure>' : ''}
        <h2 class="ch-end__head caps">${esc(w.passed)}</h2>
        <ul class="ch-end__guides">${t.countries.map((c) => `<li><a href="${K.guideHref(c)}">${esc(w.guides(c.name[K.lang]))}</a></li>`).join('')}</ul>
        <p class="ch-end__step">
          ${newer ? `<a class="word" href="${K.tripHref(newer)}">${esc(w.newer)}</a>` : '<span></span>'}
          ${older ? `<a class="word" href="${K.tripHref(older)}">${esc(w.older)}</a>` : '<span></span>'}
        </p>
      </footer>`;
    if (t.legs.length) drawTripMap(t);
    arrive();
    scrollTo(0, 0);
  }

  async function drawTripMap(t) {
    const svg = d3.select('#tripmap');
    const W = 760, H = 420;
    svg.attr('viewBox', `0 0 ${W} ${H}`);
    const proj = d3.geoMercator().fitExtent([[40, 40], [W - 40, H - 40]], { type: 'GeometryCollection', geometries: t.legs.map(K.legGeo) });
    const { g, path } = await K.drawWorld(svg, proj);
    g.append('g').selectAll('path').data(t.legs).join('path')
      .attr('class', (l) => `leg leg--trip${l.mode === 'flight' ? '' : ' leg--ground'}`).attr('d', (l) => path(K.legGeo(l)));
    const pts = g.append('g').selectAll('g').data(t.stops).join('g')
      .attr('transform', (s) => `translate(${proj([s.at.ll[1], s.at.ll[0]]).join(',')})`);
    pts.append('circle').attr('class', 'dot').attr('r', 2.6);
    const placed = [];
    pts.filter((s) => {
      const [x, y] = proj([s.at.ll[1], s.at.ll[0]]);
      const wd = K.nameOf(s.at).length * 6;
      if (placed.some((p) => Math.abs(p[0] - x) < (p[2] + wd) / 2 + 6 && Math.abs(p[1] - y) < 15)) return false;
      placed.push([x, y, wd]);
      return true;
    }).append('text').attr('class', 'ch-end__label').attr('y', -7).attr('text-anchor', 'middle').text((s) => K.nameOf(s.at));
  }

  function render() {
    top.innerHTML = K.topbar('journey');
    const t = K.ask.get('trip') && K.byId(K.ask.get('trip'));
    if (t) essay(t); else front();
  }
  K.onLang(render);
  render();
})();

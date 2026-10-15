/* Direction C, "Atlas": one clean line map of everywhere, held still beside the list of trips.
   Reading down the list, the map follows: it turns to each trip in turn and shows its route.
   A trip opens in the same frame, its route drawn stop by stop as the story is read. */
(() => {
  'use strict';

  const K = window.Kit;
  const { esc, $ } = K;
  const main = $('#main');
  const top = $('#top');
  const S = K.S;
  const ll = (p) => [p[1], p[0]];

  /* ------------------------------------------------------------ the map beside the words */

  async function makeMap(svgEl) {
    const box = svgEl.getBoundingClientRect();
    const W = Math.max(320, box.width), H = Math.max(240, box.height);
    const svg = d3.select(svgEl).attr('viewBox', `0 0 ${W} ${H}`);
    svg.selectAll('*').remove();
    const proj = d3.geoNaturalEarth1().rotate([-150, 0]);
    // the world between 78°N and 58°S, fitted to the frame
    const band = [];
    for (let lon = -180; lon <= 180; lon += 5) band.push([lon, 78], [lon, -58]);
    proj.fitExtent([[12, 12], [W - 12, H - 12]], { type: 'MultiPoint', coordinates: band });
    const zoom = svg.append('g').attr('class', 'at-zoom');
    const { path } = await K.drawWorld(zoom, proj);
    const legsG = zoom.append('g');
    const dotsG = zoom.append('g');
    const labels = svg.append('g').attr('class', 'at-labels');
    const home = proj(ll(S.flightsFrom));
    const homeDot = zoom.append('circle').attr('class', 'home').attr('cx', home[0]).attr('cy', home[1]).attr('r', 2.4);

    let view = { k: 1, x: 0, y: 0 };
    let shown = [];
    const apply = (v) => {
      zoom.attr('transform', `translate(${v.x},${v.y}) scale(${v.k})`);
      dotsG.selectAll('circle').attr('r', 2.6 / v.k);
      homeDot.attr('r', 2.4 / v.k);
      labels.selectAll('text').attr('x', (s) => proj(ll(s.at.ll))[0] * v.k + v.x).attr('y', (s) => proj(ll(s.at.ll))[1] * v.k + v.y - 8);
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
      svg.transition('view').duration(1100).ease(d3.easeCubicInOut).tween('view', () => {
        const i = d3.interpolate(from, to);
        return (t) => apply(i(t));
      });
    };

    // every trip's legs, quiet; the trip in hand drawn in the route colour
    const all = K.trips.flatMap((t) => t.legs.map((l) => ({ l, t })));
    legsG.selectAll('path').data(all).join('path')
      .attr('class', (d) => `leg${d.l.mode === 'flight' ? '' : ' leg--ground'}`).attr('d', (d) => path(K.legGeo(d.l)));

    function show(t, upto = Infinity, focus = null) {
      svg.classed('is-trip', !!t);
      legsG.selectAll('path')
        .classed('is-on', (d) => d.t === t && t.legs.indexOf(d.l) < upto)
        .classed('is-later', (d) => d.t === t && t.legs.indexOf(d.l) >= upto);
      zoom.selectAll('path.visited').classed('is-on', (f) => !!t && t.countries.some((c) => K.ISO[c.id] === f.id));
      shown = t ? t.stops.filter((s, i) => upto === Infinity || i < Math.max(1, upto)) : [];
      dotsG.selectAll('circle').data(shown).join('circle').attr('class', 'dot')
        .attr('cx', (s) => proj(ll(s.at.ll))[0]).attr('cy', (s) => proj(ll(s.at.ll))[1]);
      const geom = !t ? null : focus
        ? { type: 'GeometryCollection', geometries: (focus.legs.length ? focus.legs.map(K.legGeo) : [{ type: 'Point', coordinates: ll(focus.at.ll) }]) }
        : { type: 'GeometryCollection', geometries: t.legs.length ? t.legs.map(K.legGeo) : t.stops.map((s) => ({ type: 'Point', coordinates: ll(s.at.ll) })) };
      const v = fit(geom);
      if (geom && !t.legs.length) v.k = Math.min(v.k, 4);
      // names where they will not sit on each other at the new scale; the stop in hand first
      const placed = [];
      const named = (focus ? [focus, ...shown.filter((s) => s !== focus)] : shown).filter((s) => {
        const p = proj(ll(s.at.ll)).map((c) => c * v.k);
        const wd = K.nameOf(s.at).length * 7.5;
        if (p[0] + v.x < 0 || p[0] + v.x > W || p[1] + v.y < 0 || p[1] + v.y > H) return false;
        if (placed.some((q) => Math.abs(q[0] - p[0]) < (q[2] + wd) / 2 + 8 && Math.abs(q[1] - p[1]) < 16)) return false;
        placed.push([p[0], p[1], wd]);
        return true;
      });
      labels.selectAll('text').data(named, (s) => s.at.city).join('text').attr('class', (s) => `at-label${s === focus ? ' is-here' : ''}`).text((s) => K.nameOf(s.at));
      go(v);
    }
    return { show };
  }

  // the item nearest the middle of the window is the one in hand
  let onScroll = null;
  function follow(items, onPick) {
    let current = null;
    const pick = () => {
      // on a phone the map is pinned across the top: measure from its lower edge
      const m = document.querySelector('.at-map');
      const r = m ? m.getBoundingClientRect() : null;
      const edge = r && r.top <= 1 && r.width >= innerWidth - 2 ? r.bottom : 0;
      const mid = edge + (innerHeight - edge) * 0.4;
      let best = null, bd = Infinity;
      for (const el of items) {
        const r = el.getBoundingClientRect();
        const d = r.top > mid ? r.top - mid : r.bottom < mid ? mid - r.bottom : 0;
        if (d < bd) { bd = d; best = el; }
      }
      if (best !== current) { current = best; onPick(best); }
    };
    let raf = 0;
    if (onScroll) removeEventListener('scroll', onScroll);
    onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(pick); };
    addEventListener('scroll', onScroll, { passive: true });
    pick();
    return pick;
  }

  /* ------------------------------------------------------------ the index of trips */

  async function front() {
    const w = K.W();
    const tl = K.tally();
    document.title = `${w.journey} · tuan photography 陳亮元`;
    let year = null;
    const items = K.trips.map((t) => {
      const mark = t.year !== year ? `<li class="at-year" aria-hidden="true">${t.year}</li>` : '';
      year = t.year;
      return `${mark}<li class="at-trip" data-trip="${t.id}">
        <a class="at-trip__link" href="${K.tripHref(t)}">
          <span class="at-trip__when caps">${esc(K.when(t))}</span>
          <span class="at-trip__title">${esc(K.title(t))}</span>
          <span class="at-trip__route">${t.legs.length ? esc(K.route(t).join(w.list)) : esc(w.noRoute)}</span>
          ${t.photos.length ? `<span class="at-trip__count">${esc(w.photos(t.photos.length))}</span>` : ''}
        </a>
      </li>`;
    }).join('');
    main.innerHTML = `
      <div class="at-frame">
        <figure class="at-map map" aria-hidden="true"><svg id="map"></svg></figure>
        <div class="at-side">
          <header class="at-head">
            <h1 class="at-head__title">${esc(w.journey)}</h1>
            <p class="at-head__intro">${esc(w.intro)}</p>
            <p class="at-head__tally caps"><span>${esc(w.trips(tl.trips))}</span><span>${esc(w.countries(tl.countries))}</span></p>
          </header>
          <ol class="at-list">${items}</ol>
        </div>
      </div>`;
    const map = await makeMap($('#map'));
    const head = $('.at-head');
    const lis = [head, ...main.querySelectorAll('.at-trip')];
    let hovering = null;
    const pick = (el) => {
      main.querySelectorAll('.at-trip').forEach((x) => x.classList.toggle('is-on', x === el));
      if (hovering) return;
      map.show(el && el.dataset.trip ? K.byId(el.dataset.trip) : null);
    };
    const repick = follow(lis, pick);
    main.querySelectorAll('.at-trip').forEach((li) => {
      li.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'mouse') return; hovering = li; map.show(K.byId(li.dataset.trip)); });
      li.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'mouse') return; hovering = null; repick(); });
    });
  }

  /* ------------------------------------------------------------ one trip, along its route */

  async function story(t) {
    const w = K.W();
    const i = K.trips.indexOf(t);
    const newer = K.trips[i - 1], older = K.trips[i + 1];
    document.title = `${K.title(t)} · tuan photography 陳亮元`;
    const facts = [w.stops(t.stops.length)];
    if (t.km) facts.push(w.km(t.km));
    if (t.photos.length) facts.push(w.photos(t.photos.length));
    const stops = t.stops.map((c, n) => `
      <section class="at-stop" data-n="${n}">
        ${c.legs.length ? `<p class="at-stop__how caps">${esc(K.legLine(c))}</p>` : ''}
        <h2 class="at-stop__name">${esc(K.nameOf(c.at))}</h2>
        ${c.country && c.country.name.en !== c.at.city ? `<p class="at-stop__where">${esc(c.country.name[K.lang])}</p>` : ''}
        ${c.photos.length
          ? `<div class="at-stop__photos" data-set="${t.photos.join(',')}">${c.photos.map((id) => K.shot(id, '(max-width: 63.99rem) 92vw, 22vw')).join('')}</div>`
          : `<p class="at-stop__none">${esc(w.blank)}</p>`}
      </section>`).join('');
    main.innerHTML = `
      <div class="at-frame">
        <figure class="at-map map" aria-hidden="true"><svg id="map"></svg></figure>
        <div class="at-side">
          <nav class="at-trail"><a class="word" href="atlas.html">${esc(w.all)}</a></nav>
          <header class="at-head at-head--trip">
            <p class="caps at-trip__when">${esc(K.when(t))}</p>
            <h1 class="at-head__title">${esc(K.title(t))}</h1>
            <p class="at-head__facts">${facts.map((f) => `<span>${esc(f)}</span>`).join('')}</p>
          </header>
          ${stops}
          <footer class="at-end">
            <h2 class="caps at-end__head">${esc(w.passed)}</h2>
            <ul class="at-end__guides">${t.countries.map((c) => `<li><a href="${K.guideHref(c)}">${esc(w.guides(c.name[K.lang]))}</a></li>`).join('')}</ul>
            <p class="at-end__step">
              ${newer ? `<a class="word" href="${K.tripHref(newer)}">${esc(w.newer)}</a>` : '<span></span>'}
              ${older ? `<a class="word" href="${K.tripHref(older)}">${esc(w.older)}</a>` : '<span></span>'}
            </p>
          </footer>
        </div>
      </div>`;
    scrollTo(0, 0);
    const map = await makeMap($('#map'));
    const secs = [$('.at-head'), ...main.querySelectorAll('.at-stop'), $('.at-end')];
    follow(secs, (el) => {
      if (!el || !el.dataset.n) { map.show(t); return; }
      const n = +el.dataset.n;
      const c = t.stops[n];
      // legs travelled so far: up to and including those that reached this stop
      const upto = c.legs.length ? t.legs.indexOf(c.legs[c.legs.length - 1]) + 1 : Infinity;
      map.show(t, upto, c);
    });
  }

  let resizeT = 0;
  function render() {
    top.innerHTML = K.topbar('journey');
    const t = K.ask.get('trip') && K.byId(K.ask.get('trip'));
    if (t) story(t); else front();
  }
  addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(render, 400); });
  K.onLang(render);
  render();
})();

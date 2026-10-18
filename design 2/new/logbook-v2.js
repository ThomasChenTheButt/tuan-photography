/* Direction A, "Logbook": the trips as a printed travel log, year by year, under a world on
   which his flights are always in the air. A trip opens along its route: the story on one side,
   the map on the other, and as the story is read the plane flies each leg and the map follows. */
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

  // something that runs every frame only while it can be seen
  function whileSeen(el, frame) {
    let raf = 0, seen = false, last = 0;
    const loop = (now) => { frame(now, last ? now - last : 0); last = now; raf = requestAnimationFrame(loop); };
    const set = () => {
      const run = seen && !document.hidden;
      if (run && !raf) { last = 0; raf = requestAnimationFrame(loop); }
      if (!run && raf) { cancelAnimationFrame(raf); raf = 0; }
    };
    new IntersectionObserver((es) => { seen = es[0].isIntersecting; set(); }).observe(el);
    document.addEventListener('visibilitychange', set);
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
              <a class="lb-row__link" href="${K.tripHref(t)}">
                <span class="lb-row__when caps">${esc(month(t))}</span>
                <span class="lb-row__what">
                  <span class="lb-row__title">${esc(K.title(t))}</span>
                  <span class="lb-row__route">${t.legs.length ? esc(K.route(t).join(w.list)) : esc(w.noRoute)}</span>
                </span>
              </a>
              <div class="lb-row__strip" data-set="${t.photos.join(',')}">${t.photos.slice(0, 5).map((id) => K.img(id, '9rem', 'lb-row__thumb')).join('')}${t.photos.length > 5 ? `<a class="lb-row__more" href="${K.tripHref(t)}">+${t.photos.length - 5}</a>` : ''}</div>
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
    const legs = K.trips.flatMap((t) => t.legs);
    g.append('g').selectAll('path').data(legs).join('path')
      .attr('class', (l) => `leg${l.mode === 'flight' ? '' : ' leg--ground'}`).attr('d', (l) => path(K.legGeo(l)));
    const [hx, hy] = proj(lonlat(S.flightsFrom));
    g.append('circle').attr('class', 'home').attr('cx', hx).attr('cy', hy).attr('r', 2.6);
    if (!K.reduced) traffic(svgEl, g.append('g').attr('class', 'sky'), path, proj);
  }

  /* ------------------------------------------------------------ the traffic: his flights, always in the air */

  function traffic(svgEl, sky, path, proj) {
    // every route he has flown, once each way
    const seen = new Set();
    const routes = [];
    for (const l of K.trips.flatMap((t) => t.legs)) {
      if (l.mode !== 'flight') continue;
      const key = [l.from.city, l.to.city].sort().join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      routes.push(l);
    }
    if (!routes.length) return;
    const live = [];
    let last = null, wait = 300, outbound = true;
    function launch(now) {
      let l = routes[Math.floor(Math.random() * routes.length)];
      for (let n = 0; n < 8 && (l === last || live.some((f) => f.l === l)); n++) l = routes[Math.floor(Math.random() * routes.length)];
      last = l;
      outbound = !outbound;
      const a = outbound ? l.from : l.to, b = outbound ? l.to : l.from;
      const km = K.km(a.ll, b.ll);
      live.push({
        l, from: lonlat(a.ll), to: lonlat(b.ll), go: d3.geoInterpolate(lonlat(a.ll), lonlat(b.ll)),
        start: now, dur: 4500 + Math.min(1, km / 11000) * 6500,
        line: sky.append('path').attr('class', 'fly'),
        plane: sky.append('path').attr('class', 'plane').attr('d', PLANE),
      });
    }
    let clock = 0;
    whileSeen(svgEl, (_, dt) => {
      clock += Math.min(dt, 100);
      const now = clock;
      for (let i = live.length - 1; i >= 0; i--) {
        const f = live[i];
        const t = (now - f.start) / f.dur;
        if (t < 1) {
          const e = ease(t);
          f.line.attr('d', path({ type: 'LineString', coordinates: [f.from, f.go(e)] }));
          const p = proj(f.go(e)), q = proj(f.go(Math.min(1, e + 0.004)));
          const ang = (Math.atan2(q[1] - p[1], q[0] - p[0]) * 180) / Math.PI;
          f.plane.attr('transform', `translate(${p[0].toFixed(1)},${p[1].toFixed(1)}) rotate(${ang.toFixed(1)}) scale(0.95)`);
        } else if (!f.landed) {
          f.landed = now;
          f.plane.remove();
          f.line.attr('d', path({ type: 'LineString', coordinates: [f.from, f.to] }));
          const [x, y] = proj(f.to);
          f.ring = sky.append('circle').attr('class', 'ring').attr('cx', x).attr('cy', y);
        } else {
          const k = (now - f.landed) / 1500;
          if (k >= 1) { f.line.remove(); f.ring.remove(); live.splice(i, 1); continue; }
          f.line.attr('opacity', 1 - k);
          f.ring.attr('r', 2 + k * 7).attr('opacity', 1 - k);
        }
      }
      wait -= Math.min(dt, 100);
      if (wait <= 0 && live.filter((f) => !f.landed).length < 6) { launch(now); wait = 500 + Math.random() * 1100; }
    });
  }

  /* ------------------------------------------------------------ one trip, along its route */

  async function entry(t) {
    const w = K.W();
    const i = K.trips.indexOf(t);
    const newer = K.trips[i - 1], older = K.trips[i + 1];
    document.title = `${K.title(t)} · tuan photography 陳亮元`;
    const facts = [w.stops(t.stops.length)];
    if (t.km) facts.push(w.km(t.km));
    facts.push(w.photos(t.photos.length));
    const modes = (c) => [...new Set(c.legs.map((l) => w.mode[l.mode] || l.mode))].join(w.list);
    const kmOf = (c) => c.legs.reduce((s, l) => s + l.km, 0);

    // the route as a line of stops, home at both ends
    let line = '';
    if (t.legs.length) {
      line = `<ol class="lb-line">
        <li class="lb-line__stop lb-line__stop--home"><span class="lb-line__name">${esc(K.nameOf(t.legs[0].from))}</span></li>
        ${t.chapters.map((c) => `
        <li class="lb-line__leg${c.legs.every((l) => l.mode === 'flight') ? '' : ' lb-line__leg--ground'}"><span class="lb-line__how">${esc(modes(c))}</span><span class="lb-line__km">${esc(w.km(kmOf(c)))}</span></li>
        <li class="lb-line__stop${c.home ? ' lb-line__stop--home' : ''}"><span class="lb-line__name">${esc(K.nameOf(c.at))}</span></li>`).join('')}
      </ol>`;
    }

    const chapters = t.chapters.map((c, n) => c.home ? `
      <section class="lb-stop lb-stop--home" data-n="${n}">
        <header class="lb-stop__head">
          <p class="lb-stop__how caps">${esc(K.legLine(c))}</p>
          <h2 class="lb-stop__name">${esc(w.home)}, ${esc(K.nameOf(c.at))}</h2>
        </header>
      </section>` : `
      <section class="lb-stop" data-n="${n}">
        <header class="lb-stop__head">
          ${c.legs.length ? `<p class="lb-stop__how caps">${esc(K.legLine(c))}</p>` : ''}
          <h2 class="lb-stop__name">${esc(K.nameOf(c.at))}</h2>
          ${c.country && c.country.name.en !== c.at.city ? `<p class="lb-stop__where">${esc(c.country.name[K.lang])}</p>` : ''}
        </header>
        ${c.photos.length
          ? `<div class="lb-sheet" data-set="${t.photos.join(',')}">${c.photos.map((id) => K.shot(id, '(max-width: 63.99rem) 92vw, 26vw')).join('')}</div>`
          : `<p class="lb-blank">${esc(w.blank)}</p>`}
      </section>`).join('');

    main.innerHTML = `
      <div class="lb-trip">
        <div class="lb-trip__story">
          <nav class="lb-trail" aria-label="${esc(w.all)}">
            <a class="word" href="logbook-v2.html">${esc(w.all)}</a>
            <span class="lb-trail__step">
              ${newer ? `<a class="word" href="${K.tripHref(newer)}">${esc(w.newer)}</a>` : ''}
              ${older ? `<a class="word" href="${K.tripHref(older)}">${esc(w.older)}</a>` : ''}
            </span>
          </nav>
          <header class="lb-entry">
            <p class="lb-entry__when caps">${esc(K.when(t))}</p>
            <h1 class="lb-entry__title">${esc(K.title(t))}</h1>
            <p class="lb-entry__facts">${facts.map((f) => `<span>${esc(f)}</span>`).join('')}</p>
          </header>
          ${line}
          <div class="lb-stops">${chapters}</div>
          <footer class="lb-guides">
            <h2 class="lb-guides__head caps">${esc(w.passed)}</h2>
            <ul>${t.countries.map((c) => `<li><a href="${K.guideHref(c)}">${esc(w.guides(c.name[K.lang]))}</a></li>`).join('')}</ul>
          </footer>
        </div>
        <figure class="lb-trip__map map" aria-hidden="true"><svg id="tripmap"></svg><figcaption class="lb-trip__now" id="now"></figcaption></figure>
      </div>`;
    scrollTo(0, 0);
    const map = await routeMap(t);
    follow(t, map);
  }

  // the map beside the story: the whole route waiting in pencil, the part travelled in ink
  async function routeMap(t) {
    const svgEl = $('#tripmap');
    const box = svgEl.getBoundingClientRect();
    const W = Math.max(300, box.width), H = Math.max(240, box.height);
    const svg = d3.select(svgEl).attr('viewBox', `0 0 ${W} ${H}`);
    const pts = t.legs.length ? t.legs.flatMap((l) => [l.from.ll, l.to.ll]) : t.stops.map((s) => s.at.ll);
    const whole = t.legs.length
      ? { type: 'GeometryCollection', geometries: t.legs.map(K.legGeo) }
      : pts.length > 1 ? { type: 'MultiPoint', coordinates: pts.map(lonlat) } : d3.geoCircle().center(lonlat(pts[0])).radius(5)();
    const cLon = d3.geoCentroid(whole)[0];
    const proj = d3.geoMercator().rotate([-cLon, 0]).fitExtent([[W * 0.12, H * 0.14], [W * 0.88, H * 0.86]], whole);
    const zoom = svg.append('g').attr('class', 'lb-zoom');
    const { path } = await K.drawWorld(zoom, proj);
    const ghost = zoom.append('g');
    const inked = zoom.append('g');
    const dots = zoom.append('g');
    const over = svg.append('g');
    const labels = over.append('g');
    const plane = over.append('path').attr('class', 'plane').attr('d', PLANE).attr('opacity', 0);
    const car = over.append('circle').attr('class', 'head').attr('r', 3.2).attr('opacity', 0);

    // the legs, each knowing which chapter it belongs to and its share of that chapter
    const legs = [];
    t.chapters.forEach((c, n) => {
      const total = c.legs.reduce((s, l) => s + Math.max(l.km, 150), 0) || 1;
      let acc = 0;
      c.legs.forEach((l) => {
        const share = Math.max(l.km, 150) / total;
        legs.push({ l, n, a: acc, b: acc + share, from: lonlat(l.from.ll), to: lonlat(l.to.ll), go: d3.geoInterpolate(lonlat(l.from.ll), lonlat(l.to.ll)) });
        acc += share;
      });
    });
    ghost.selectAll('path').data(legs).join('path').attr('class', 'leg leg--ghost').attr('d', (d) => path(K.legGeo(d.l)));
    const ink = inked.selectAll('path').data(legs).join('path').attr('class', (d) => `leg leg--trip${d.l.mode === 'flight' ? '' : ' leg--ground'}`);
    const homeXY = t.legs.length ? proj(lonlat(t.legs[0].from.ll)) : null;
    if (homeXY) dots.append('circle').attr('class', 'home').attr('cx', homeXY[0]).attr('cy', homeXY[1]);
    const stopDots = dots.selectAll('circle.dot').data(t.stops).join('circle').attr('class', 'dot')
      .attr('cx', (s) => proj(lonlat(s.at.ll))[0]).attr('cy', (s) => proj(lonlat(s.at.ll))[1]);

    // where the camera stands for each chapter: framing the legs that reach it
    const frameOf = (geom) => {
      const [[x0, y0], [x1, y1]] = path.bounds(geom);
      const size = Math.max((x1 - x0) * 1.5, (y1 - y0) * 1.5 * (W / H), W / 9);
      return [(x0 + x1) / 2, (y0 + y1) / 2, size];
    };
    const wholeView = [W / 2, H / 2, W];
    const views = t.chapters.map((c) => (c.home || !c.legs.length ? wholeView : frameOf({ type: 'GeometryCollection', geometries: c.legs.map(K.legGeo) })));

    let view = wholeView;
    const toScreen = (xy) => { const k = W / view[2]; return [(xy[0] - view[0]) * k + W / 2, (xy[1] - view[1]) * k + H / 2]; };

    // n: the chapter on its way; p: how far (0 to 1). Chapters before n are complete.
    function set(n, p) {
      const from = n <= 0 ? wholeView : views[n - 1];
      const to = n >= views.length ? wholeView : views[n];
      view = n >= views.length ? views[views.length - 1] : d3.interpolateZoom(from, to)(ease(clamp(p, 0, 1)));
      const k = W / view[2];
      zoom.attr('transform', `translate(${W / 2 - view[0] * k},${H / 2 - view[1] * k}) scale(${k})`);
      dots.selectAll('circle').attr('r', 3 / k);

      let head = null;
      ink.attr('d', (d) => {
        if (d.n < n) return path(K.legGeo(d.l));
        if (d.n > n) return null;
        const q = clamp((p - d.a) / (d.b - d.a), 0, 1);
        if (q <= 0) return null;
        if (q < 1) head = { d, q };
        return path({ type: 'LineString', coordinates: [d.from, d.go(q)] });
      });
      if (head) {
        const pt = toScreen(proj(head.d.go(head.q))), ah = toScreen(proj(head.d.go(Math.min(1, head.q + 0.01))));
        const ang = (Math.atan2(ah[1] - pt[1], ah[0] - pt[0]) * 180) / Math.PI;
        const fly = head.d.l.mode === 'flight';
        plane.attr('opacity', fly ? 1 : 0).attr('transform', `translate(${pt[0].toFixed(1)},${pt[1].toFixed(1)}) rotate(${ang.toFixed(1)}) scale(0.9)`);
        car.attr('opacity', fly ? 0 : 1).attr('cx', pt[0]).attr('cy', pt[1]);
      } else { plane.attr('opacity', 0); car.attr('opacity', 0); }

      // the stops reached, named where they do not crowd each other; the latest first
      const reached = t.chapters.filter((c, i) => !c.home && (i < n || (i === n && p >= 1)));
      const here = head ? null : reached[reached.length - 1];
      stopDots.classed('is-reached', (s) => reached.includes(s)).classed('is-here', (s) => s === here);
      const placed = [];
      const named = [...reached].reverse().filter((s) => {
        const [x, y] = toScreen(proj(lonlat(s.at.ll)));
        const wd = K.nameOf(s.at).length * 7.2;
        if (x < 0 || x > W || y < 0 || y > H) return false;
        if (placed.some((q) => Math.abs(q[0] - x) < (q[2] + wd) / 2 + 8 && Math.abs(q[1] - y) < 17)) return false;
        placed.push([x, y, wd]);
        return true;
      });
      labels.selectAll('text').data(named, (s) => s.at.city).join('text')
        .attr('class', (s) => `lb-trip__label${s === here ? ' is-here' : ''}`)
        .attr('x', (s) => toScreen(proj(lonlat(s.at.ll)))[0]).attr('y', (s) => toScreen(proj(lonlat(s.at.ll)))[1] - 9)
        .text((s) => K.nameOf(s.at));

      // a line under the map: the leg being travelled, or where we are
      const ww = K.W();
      const now = $('#now');
      if (head) now.textContent = `${ww.leg(ww.mode[head.d.l.mode] || head.d.l.mode, K.nameOf(head.d.l.from))}, ${ww.km(head.d.l.km)}`;
      else if (n >= t.chapters.length && t.chapters[t.chapters.length - 1].home) now.textContent = `${ww.home}, ${K.nameOf(t.chapters[t.chapters.length - 1].at)}`;
      else now.textContent = here ? K.nameOf(here.at) : K.title(t);
    }
    return { set, count: t.chapters.length };
  }

  // the story drives the map: a leg is flown over the screen of scrolling before its stop
  let onScroll = null;
  function follow(t, map) {
    const secs = [...main.querySelectorAll('.lb-stop')];
    const update = () => {
      const trig = innerHeight * 0.42;
      const span = innerHeight * 0.6;
      let n = secs.length, p = 1;
      for (let i = 0; i < secs.length; i++) {
        const top0 = secs[i].getBoundingClientRect().top;
        const q = (trig - (top0 - span)) / span;
        if (q < 1) { n = i; p = Math.max(0, q); break; }
      }
      if (!t.legs.length) { n = secs.length; p = 1; }
      map.set(n, p);
    };
    let raf = 0;
    if (onScroll) removeEventListener('scroll', onScroll);
    onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); };
    addEventListener('scroll', onScroll, { passive: true });
    update();
  }

  let resizeT = 0, width = innerWidth;
  function render() {
    top.innerHTML = K.topbar('journey');
    const t = K.ask.get('trip') && K.byId(K.ask.get('trip'));
    if (t) entry(t); else front();
  }
  addEventListener('resize', () => {
    if (Math.abs(innerWidth - width) < 40) return;
    width = innerWidth;
    clearTimeout(resizeT);
    resizeT = setTimeout(() => { if (K.ask.get('trip')) render(); }, 400);
  });
  K.onLang(render);
  render();
})();

/* Journey, built with the scroll-craft skill (2026-10-18). Grammar "rewinding atlas", brief in
   experiments/journey/scrollcraft/builds/journey/BRIEF.md.

   One map stays with the visitor the whole way. It opens on the whole of his travels: every plane
   leaves Taiwan at once and lands across the world while the totals settle (the peak). Then the
   trips are read by year, newest first, and the map rewinds with them: a large year counts back,
   countries he had not yet seen go pale, later routes lift off. At 2010 the map is almost empty;
   past it, the map plays forward to the present and holds.

   Once the map has docked it gives up the lower half of its column to one photograph, the trip
   being read, which changes as the reading moves on; the right column is words only. On the phone
   the photograph sits in the entry instead. (His pick, 2026-10-18, from three "prints lead"
   variations after the Impeccable critique; the others are at tag journey-five-versions-2026-10-18.)

   The scroll-craft engine (scrollcraft.js, unedited) drives the entries and the year wipes; the
   map, the planes, the totals, the rewind and the print are this page's own code. */
(() => {
  'use strict';

  const K = window.Kit;
  const { esc, $ } = K;
  const S = K.S;
  const main = $('#main');
  const top = $('#top');
  const ll = (p) => [p[1], p[0]];
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const ease = d3.easeCubicInOut;
  const PLANE = 'M9,0C9,-0.8 8,-1.1 6.5,-1.1L2,-1.1L-2.5,-7.5L-4.3,-7.5L-1.8,-1.1L-6,-1.1L-7.8,-3.6L-9,-3.6L-8,0L-9,3.6L-7.8,3.6L-6,1.1L-1.8,1.1L-4.3,7.5L-2.5,7.5L2,1.1L6.5,1.1C8,1.1 9,0.8 9,0Z';
  // this page's own name, so the trip page's back word returns here, to the entry it was opened from
  const PAGE = location.pathname.split('/').pop().replace('.html', '') || 'journey';
  const tripHref = (t) => `../wc-sketch/trip/?trip=${encodeURIComponent(t.id)}&from=${PAGE}`;

  const WORDS = {
    en: {
      intro: 'Every trip I have taken with a camera, newest first. Read down and the map goes back in time with you.',
      trips: 'trips', countries: 'countries', photos: 'photographs',
      byThen: (n) => `${n} countries by then`,
      year: (n) => (n === 1 ? '1 trip' : `${n} trips`),
      began: 'Where it began',
      first: (place, y) => `${place}, ${y}.`,
      since: (t, c, y) => `${t} trips and ${c} countries later, the map is back in ${y}.`,
      guides: 'The places themselves are in Guides.',
      insta: 'More as it happens on Instagram, tuan_1127.',
      sep: ' ',
    },
    zh: {
      intro: '每一趟帶著相機的旅行，從最近的開始。往下讀，地圖會陪你回到過去。',
      trips: '趟旅行', countries: '個國家', photos: '張照片',
      byThen: (n) => `那時去過 ${n} 個國家`,
      year: (n) => `${n} 趟`,
      began: '從這裡開始',
      first: (place, y) => `${y} 年，${place}。`,
      since: (t, c, y) => `${t} 趟旅行、${c} 個國家之後，地圖回到 ${y} 年。`,
      guides: '那些地方本身，寫在攻略裡。',
      insta: '最新的在 Instagram，tuan_1127。',
      sep: '',
    },
  };
  const W = () => WORDS[K.lang];

  // the month without the year, inside a year's chapter ("August"; "8 月")
  const month = (t) => {
    const d = K.when(t);
    return K.lang === 'zh' ? d.replace(/^\d{4}\s*(年\s*)?/, '').replace(/^\d{4}$/, '') : d.replace(/\s*\d{4}$/, '').replace(/^\d{4}$/, '');
  };

  /* ------------------------------------------------------------ the facts the map needs */

  const HOME_ID = S.countries.find((c) => K.km(c.ll, S.flightsFrom) < 80)?.id || 'taiwan';
  const years = [...new Set(K.trips.map((t) => +t.year))].sort((a, b) => b - a);
  const firstYear = {};                       // country id -> the year he first went
  for (const t of K.trips) for (const c of t.countries) firstYear[c.id] = Math.min(firstYear[c.id] || 9999, +t.year);
  firstYear[HOME_ID] = 0;
  const isoFirst = {};                        // map id -> first year
  for (const [id, y] of Object.entries(firstYear)) if (K.ISO[id]) isoFirst[K.ISO[id]] = y;
  const countriesBy = (y) => Object.values(firstYear).filter((f) => f <= y).length;
  const totalPhotos = Object.keys(S.slides).length;
  const firstTrip = K.trips[K.trips.length - 1];

  /* ------------------------------------------------------------ photographs, as the entries show them */

  // a photograph that opens the viewer, from the pointer or the keyboard
  const shot = (id, sizes, cls = '') => `<button type="button" class="jr-shot ${cls}" data-shot="${id}">${K.img(id, sizes, 'jr-shot__img')}</button>`;
  // the same with its name beneath; --ar lets a row share out its width
  const print = (id, sizes, cls = '') => {
    const s = S.slides[id];
    return `<figure class="jr-print ${cls}" style="--ar: ${(s.w / s.h).toFixed(4)}">${shot(id, sizes)}<figcaption class="jr-print__cap">${esc(s.place[K.lang])}</figcaption></figure>`;
  };
  // on the phone, where the map has no column to lend, the trip's lead print sits in its entry
  const shots = (t) => (t.photos.length ? `<div class="jr-lead" data-set="${t.photos.join(',')}">${print(t.lead || t.photos[0], '92vw')}</div>` : '');
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.jr-shot');
    if (!b || e.target.closest('img')) return;      // an image click is the kit's (it opens the same viewer)
    const set = b.closest('[data-set]');
    K.openViewer(set ? set.dataset.set.split(',') : [b.dataset.shot], b.dataset.shot);
  });

  /* ------------------------------------------------------------ the map */

  async function makeMap(svgEl) {
    // the whole world, always: drawn once into its own fixed frame, which the page then scales
    // to fit (never cropped), whether it fills the screen or sits beside the reading
    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();
    const proj = d3.geoNaturalEarth1().rotate([-150, 0]);
    const band = [];
    for (let lon = -180; lon <= 180; lon += 4) band.push([lon, 80], [lon, 0], [lon, -56]);
    const outline = { type: 'MultiPoint', coordinates: band };
    proj.fitWidth(1600, outline);
    const [[x0, y0], [x1, y1]] = d3.geoPath(proj).bounds(outline);
    const pad = 16;
    svg.attr('viewBox', `${(x0 - pad).toFixed(0)} ${(y0 - pad).toFixed(0)} ${(x1 - x0 + 2 * pad).toFixed(0)} ${(y1 - y0 + 2 * pad).toFixed(0)}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');
    const { g, path } = await K.drawWorld(svg, proj);
    // each of his countries knows the year he first went, and its order in time (for the replay)
    const order = [...new Set(Object.values(isoFirst))].sort((a, b) => a - b);
    g.selectAll('path.visited')
      .attr('data-first', (f) => isoFirst[f.id])
      .attr('style', (f) => `--i: ${order.indexOf(isoFirst[f.id])}`);

    const legsG = g.append('g');
    const allLegs = K.trips.flatMap((t) => t.legs.map((l) => ({ l, t })));
    const legs = legsG.selectAll('path').data(allLegs).join('path')
      .attr('class', (d) => `leg${d.l.mode === 'flight' ? '' : ' leg--ground'}`).attr('d', (d) => path(K.legGeo(d.l)));

    // one flight from Taiwan to each country he has been to
    const home = ll(S.flightsFrom);
    const flights = S.countries.filter((c) => c.id !== HOME_ID).map((c) => {
      const km = K.km(S.flightsFrom, c.ll);
      return { c, to: ll(c.ll), go: d3.geoInterpolate(home, ll(c.ll)), first: firstYear[c.id], dur: 1700 + Math.min(1, km / 13000) * 3600 };
    });
    const longest = Math.max(...flights.map((f) => f.dur));
    const sky = g.append('g').attr('class', 'sky');
    const lines = sky.selectAll('path.fly').data(flights).join('path').attr('class', 'fly')
      .attr('style', (f) => `--i: ${order.indexOf(f.first)}`);
    const ends = sky.selectAll('circle.end').data(flights).join('circle').attr('class', 'end')
      .attr('cx', (f) => proj(f.to)[0]).attr('cy', (f) => proj(f.to)[1]).attr('r', 3.4)
      .attr('style', (f) => `--i: ${order.indexOf(f.first)}`);
    const [hx, hy] = proj(home);
    g.append('circle').attr('class', 'home').attr('cx', hx).attr('cy', hy).attr('r', 4);

    // every plane already landed: the lines whole, the ends in (reduced motion, or coming back)
    const whole = (f) => path({ type: 'LineString', coordinates: [home, f.to] });
    function settled(onLand) { lines.attr('d', whole); ends.classed('is-in', true); onLand(flights.length, true, 1); }

    // the peak: every plane leaves home at once, once; the countries settle as they land.
    // onLand(n landed, done, p): p is how far the longest flight has come, for the totals
    function flyOut(onLand) {
      if (K.reduced) { settled(onLand); return; }
      const planes = sky.selectAll('path.plane').data(flights).join('path').attr('class', 'plane').attr('d', PLANE).attr('opacity', 0);
      const rings = sky.selectAll('circle.ring').data(flights).join('circle').attr('class', 'ring')
        .attr('cx', (f) => proj(f.to)[0]).attr('cy', (f) => proj(f.to)[1]).attr('opacity', 0);
      const t0 = performance.now();
      let landed = -1;
      const frame = (now) => {
        const el = now - t0;
        let busy = false, n = 0;
        lines.attr('d', (f) => {
          const t = clamp(el / f.dur, 0, 1);
          return t > 0 ? path({ type: 'LineString', coordinates: [home, f.go(ease(t))] }) : null;
        });
        planes.each(function (f) {
          const t = el / f.dur;
          if (t >= 1) { this.setAttribute('opacity', 0); n++; return; }
          busy = true;
          const e = ease(t);
          const p = proj(f.go(e)), q = proj(f.go(Math.min(1, e + 0.004)));
          this.setAttribute('opacity', 1);
          this.setAttribute('transform', `translate(${p[0].toFixed(1)},${p[1].toFixed(1)}) rotate(${((Math.atan2(q[1] - p[1], q[0] - p[0]) * 180) / Math.PI).toFixed(1)}) scale(1.15)`);
        });
        rings.each(function (f) {
          const k = (el - f.dur) / 1200;
          if (k < 0 || k > 1) { this.setAttribute('opacity', 0); return; }
          busy = true;
          this.setAttribute('opacity', (1 - k).toFixed(3));
          this.setAttribute('r', (3.4 + k * 14).toFixed(2));
        });
        ends.classed('is-in', (f) => el >= f.dur);
        const p = clamp(el / longest, 0, 1);
        if (n !== landed || p < 1) { landed = n; onLand(n, false, p); }
        if (busy) requestAnimationFrame(frame); else onLand(flights.length, true, 1);
      };
      requestAnimationFrame(frame);
    }

    // the rewind: the map as it was at the end of year y (Infinity = now)
    function at(y, hereYear) {
      svg.classed('is-rewound', y !== Infinity);
      g.selectAll('path.visited').classed('is-later', function () { return +this.dataset.first > y; });
      lines.classed('is-later', (f) => f.first > y);
      ends.classed('is-later', (f) => f.first > y);
      legs.classed('is-later', (d) => +d.t.year > y).classed('is-here', (d) => +d.t.year === hereYear);
    }
    // the return: everything comes back in the order he first went
    function forward() {
      svg.classed('is-forward', true);
      at(Infinity, null);
      setTimeout(() => svg.classed('is-forward', false), 2600);
    }
    return { flyOut, settled, at, forward };
  }

  /* ------------------------------------------------------------ the page */

  let engine = null, map = null, state = null, folioYear = null, folioTimer = 0;

  function render() {
    const w = W(), ww = K.W();
    document.title = `${ww.journey} · tuan photography 陳亮元`;
    top.innerHTML = K.topbar('journey');
    const byYear = years.map((y) => ({ y, trips: K.trips.filter((t) => +t.year === y) }));
    main.innerHTML = `
      <div class="jr">
        <figure class="jr-map map" aria-hidden="true">
          <svg id="jr-svg"></svg>
          <p class="jr-folio"><span class="jr-folio__year" id="jr-year"></span><span class="jr-folio__by" id="jr-by"></span></p>
          <div class="jr-beside">
            <div class="jr-beside__frame"><img class="jr-beside__img" alt=""><img class="jr-beside__img" alt=""></div>
            <p class="jr-beside__cap"><span class="jr-beside__name"></span><span class="jr-beside__where"></span></p>
          </div>
        </figure>
        <div class="jr-text">
          <header class="jr-hero">
            <div class="jr-hero__words">
              <h1 class="jr-hero__title">${esc(ww.journey)}</h1>
              <p class="jr-hero__intro">${esc(w.intro)}</p>
            </div>
            <dl class="jr-totals">
              <div><dt>${esc(w.trips)}</dt><dd class="sc-nums" id="jr-trips">0</dd></div>
              <div><dt>${esc(w.countries)}</dt><dd class="sc-nums" id="jr-countries">1</dd></div>
              <div><dt>${esc(w.photos)}</dt><dd class="sc-nums" id="jr-photos">0</dd></div>
            </dl>
          </header>
          <div class="jr-years">${byYear.map(({ y, trips }) => `
          <section class="jr-year" data-year="${y}">
            <header class="jr-year__head">
              <h2 class="jr-year__n" data-sc-reveal="up">${y}</h2>
              <p class="jr-year__count">${esc(w.year(trips.length))}</p>
            </header>
            <ol class="jr-trips">${trips.map((t) => `
              <li class="jr-trip sc-stack" id="t-${esc(t.id)}" data-trip="${esc(t.id)}" data-sc-in data-sc-stagger="60">
                <${t.legs.length ? `a class="jr-trip__link" href="${tripHref(t)}"` : 'div class="jr-trip__link"'}>
                  ${month(t) ? `<span class="jr-trip__when caps">${esc(month(t))}</span>` : ''}
                  <h3 class="jr-trip__title">${esc(K.title(t))}</h3>
                  <span class="jr-trip__route">${t.legs.length ? esc(K.route(t).join(ww.list)) : esc(ww.noRoute)}</span>
                </${t.legs.length ? 'a' : 'div'}>
                ${shots(t)}
              </li>`).join('')}
            </ol>
          </section>`).join('')}</div>
          <footer class="jr-close">
            <div class="jr-close__words sc-stack" data-sc-in data-sc-stagger="80">
              <p class="jr-close__kicker caps">${esc(w.began)}</p>
              <p class="jr-close__first">${esc(w.first(firstTrip.stops.map((s) => K.nameOf(s.at)).join(ww.list) || K.title(firstTrip), firstTrip.year))}</p>
              <p class="jr-close__since">${esc(w.since(K.trips.length, S.countries.length, years[0]))}</p>
              <p class="jr-close__go"><a href="../../guides.html">${esc(w.guides)}</a>${w.sep}<a href="${esc(S.instagram.url)}" rel="noopener">${esc(w.insta)}</a></p>
            </div>
          </footer>
        </div>
      </div>`;
  }

  // the three totals settle as the planes land; the last one stops with the last plane
  function totals(n, p) {
    const others = S.countries.length - 1;
    $('#jr-countries').textContent = String(1 + Math.min(n, others));
    $('#jr-trips').textContent = String(Math.round(p * K.trips.length));
    $('#jr-photos').textContent = String(Math.round(p * totalPhotos));
  }

  // the year folio counts through every year between, so going back reads as going back
  function folio(y) {
    const yEl = $('#jr-year'), byEl = $('#jr-by');
    const fig = $('.jr-map');
    clearInterval(folioTimer);
    fig.classList.toggle('has-year', y !== null);
    if (y === null) { folioYear = null; return; }
    const show = (v) => { yEl.textContent = v; byEl.textContent = W().byThen(countriesBy(v)); };
    if (folioYear === null || K.reduced) { folioYear = y; show(y); return; }
    const dir = y < folioYear ? -1 : 1;
    folioTimer = setInterval(() => {
      if (folioYear === y) { clearInterval(folioTimer); return; }
      folioYear += dir;
      show(folioYear);
    }, 55);
  }

  // how far the map has glided aside, 0 (the whole screen) to 1 (beside the years); published as
  // a number for the stylesheet, as the engine publishes --sc-p
  function dock() {
    const frame = $('.jr');
    const hero = $('.jr-hero');
    const d = clamp((scrollY - hero.offsetHeight * 0.15) / (hero.offsetHeight * 0.7), 0, 1);
    frame.style.setProperty('--dock', d3.easeCubicInOut(d).toFixed(4));
  }

  // the print under the map: the trip at the reading line is the one whose photograph shows
  let shown = null, turn = 0;
  function beside(line) {
    if (!matchMedia('(min-width: 64rem)').matches) return;
    let cur = null;
    for (const el of main.querySelectorAll('.jr-trip')) if (el.getBoundingClientRect().top < line + 40) cur = el;
    const t = cur && K.byId(cur.dataset.trip);
    const photo = t && (t.lead || t.photos[0]);
    if (photo === shown) return;
    shown = photo;
    const box = $('.jr-beside');
    box.classList.toggle('has-print', !!photo);
    if (!photo) return;
    const s = S.slides[photo];
    const imgs = box.querySelectorAll('.jr-beside__img');
    turn ^= 1;
    const im = imgs[turn], old = imgs[turn ^ 1];
    im.srcset = `${K.src(s.file, 640)} 640w, ${K.src(s.file, 1280)} 1280w, ${K.src(s.file)} 2400w`;
    im.sizes = '48vw';
    im.src = K.src(s.file, 1280);
    const show = () => { im.classList.add('is-on'); old.classList.remove('is-on'); };
    if (im.complete) show(); else im.onload = show;
    $('.jr-beside__name', box).textContent = s.place[K.lang];
    $('.jr-beside__where', box).textContent = s.where[K.lang];
  }

  function follow() {
    dock();
    // on a phone the map is pinned across the top: read from its lower edge
    const m = $('.jr-map').getBoundingClientRect();
    const edge = m.top <= 1 && m.width >= innerWidth - 2 ? m.bottom : 0;
    const line = edge + (innerHeight - edge) * 0.35;
    beside(line);
    let next = 'now';
    // the return plays when the closing words reach the reading line, not when the close's
    // empty top does: the first trip keeps its near-empty map for a whole screen before it
    if ($('.jr-close__words').getBoundingClientRect().top < edge + (innerHeight - edge) * 0.6) next = 'forward';
    else {
      for (const sec of main.querySelectorAll('.jr-year')) if (sec.getBoundingClientRect().top < line) next = +sec.dataset.year;
    }
    if (next === state) return;
    const was = state;
    state = next;
    if (next === 'now') { map.at(Infinity, null); folio(null); return; }
    if (next === 'forward') { folio(null); if (was !== 'now') map.forward(); return; }
    // inside a year: the map as it stood at the end of that year, that year's routes in hand
    map.at(next, next);
    folio(next);
  }

  // back from a trip (#t=<id>): no replay; the map whole, the totals settled, the entry in view
  function returnTo() {
    const id = (location.hash.match(/^#t=(.+)$/) || [])[1];
    const el = id && document.getElementById(`t-${decodeURIComponent(id)}`);
    if (!el) return false;
    history.replaceState(null, '', location.pathname + location.search);
    const html = document.documentElement;
    html.style.scrollBehavior = 'auto';
    const edge = innerWidth < 1024 ? $('.jr-map').offsetHeight : 0;
    scrollTo(0, el.getBoundingClientRect().top + scrollY - edge - innerHeight * 0.2);
    requestAnimationFrame(() => { html.style.scrollBehavior = ''; });
    return true;
  }

  let onScroll = null;
  async function mount() {
    if (engine && engine.destroy) engine.destroy();
    render();
    engine = window.ScrollCraft.mount(document.body);
    map = await makeMap($('#jr-svg'));
    state = null; folioYear = null; shown = null;
    if (returnTo()) map.settled(totals); else map.flyOut(totals);
    let raf = 0;
    if (onScroll) removeEventListener('scroll', onScroll);
    onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(follow); };
    addEventListener('scroll', onScroll, { passive: true });
    follow();
  }

  K.onLang(mount);
  mount();
})();

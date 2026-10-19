/* design 3, the counting openings, chosen from the address: index.html?intro=<name>.
   He liked the count of countries as the landing. These are ten ways to count, each landing on
   the same held hero afterwards. Every number is worked out from his data; nothing is invented.
     countries   the countries in the order he reached them, landing on home (the current one)
     flights     41 flights counted leg by leg: each line is a route, TPE to KIX, flashing past
     km          the kilometres flown climb to 169,000 while the globe behind turns with them
     photos      every photograph as a flash of the picture itself, 93 of them, the number counting
     cities      60 cities; the names fill the screen as a wall of type that the number cuts through
     years       2010 to 2026 as a year clock; each year's countries appear beneath it
     light       the photographs sorted by the light: night, blue hour, golden hour, day, the ground tinting with each
     shutter     71 shutter speeds read off the files, counted as a shutter clicks faster and faster
     home        it counts down: 21 countries back to 1, Taiwan, the one he always flies from
     dial        the count on a rotary dial: the number spins up through every digit before locking */
window.INTRO_VARIANTS = (() => {
  'use strict';
  const q = new URLSearchParams(location.search);
  const NAMES = ['countries', 'flights', 'km', 'photos', 'cities', 'years', 'light', 'shutter', 'home', 'dial'];
  const name = NAMES.includes(q.get('intro')) ? q.get('intro') : 'countries';
  return { name, run };

  function run(ctx) {
    const { S, byId, L, country, gsap, $, reduce, src } = ctx;
    const el = $('#intro');
    const n = $('#intro-n'), pl = $('#intro-place');
    const count = $('.cine-intro__count');
    document.body.classList.add(`intro-${name}`);
    const order = S.countries.filter((c) => c.visits.length).sort((a, b) => a.visits[0].when.localeCompare(b.visits[0].when));
    const flights = S.trips.slice().reverse().flatMap((t) => t.legs.filter((l) => l.mode === 'flight'));
    const R = 6371, rad = Math.PI / 180;
    const km = (a, b) => { const [la1, lo1, la2, lo2] = [a.lat * rad, a.lng * rad, b.lat * rad, b.lng * rad]; const h = Math.sin((la2 - la1) / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin((lo2 - lo1) / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
    const pad = (v) => String(v).padStart(2, '0');
    const fmt = (v) => Math.round(v).toLocaleString('en-US');
    const half = () => gsap.timeline().to('.cine-intro__half--top', { yPercent: -100, duration: 0.9, ease: 'power4.inOut' }, 0).to('.cine-intro__half--bottom', { yPercent: 100, duration: 0.9, ease: 'power4.inOut' }, 0);
    const o = { v: 0 };

    return new Promise((done) => {
      const tl = gsap.timeline({ onComplete: () => { el.remove(); done(); } });
      const finish = (hold = 0.35) => tl.to(count, { opacity: 0, y: -12, duration: 0.25, ease: 'power2.out' }, `+=${hold}`).add(half(), '<0.1');
      el.addEventListener('click', () => tl.progress(1), { once: true });
      addEventListener('keydown', () => tl.progress(1), { once: true });

      if (name === 'countries') {
        const names = [...order.map((c) => L(c)), L(country.taiwan)];
        tl.to(o, { v: names.length, duration: 2.1, ease: 'power2.inOut', onUpdate: () => { const i = Math.max(1, Math.round(o.v)); n.textContent = pad(i); pl.textContent = names[i - 1]; } });
        finish();
      }

      if (name === 'flights') {
        // each flight flashes past as a route; the number climbs to 41
        pl.classList.add('is-route');
        tl.to(o, { v: flights.length, duration: 2.6, ease: 'power2.inOut', onUpdate: () => { const i = Math.max(1, Math.round(o.v)); const f = flights[i - 1]; n.textContent = pad(i); pl.textContent = `${f.from.code || f.from.city}  ${f.to.code || f.to.city}`; } });
        finish();
      }

      if (name === 'km') {
        // the kilometres climb; the hero's faint globe is drawn behind, turning as the distance grows
        const total = flights.reduce((a, l) => a + km(l.from, l.to), 0);
        pl.textContent = ctx.t('introKm');
        n.classList.add('is-wide');
        const cv = document.createElement('canvas');
        cv.className = 'cine-intro__globe';
        el.insertBefore(cv, count);
        const g = ctx.makeGlobe(cv, { alpha: 0.6, place: (W, H) => [W / 2, H / 2, Math.min(W, H) * 0.36] });
        g.size();
        let on = true;
        const loop = (now) => { if (!on) return; g.draw(now); requestAnimationFrame(loop); };
        ctx.whenDots().then(() => requestAnimationFrame(loop));
        tl.to(o, { v: total, duration: 3, ease: 'power3.out', onUpdate: () => { n.textContent = fmt(o.v); g.rot = [121.5 + (o.v / total) * 540, 23.5 - (o.v / total) * 60]; } });
        finish(0.5);
        tl.add(() => { on = false; });
      }

      if (name === 'photos') {
        // every photograph, one frame each, the number counting to 93; the picture is the background
        const ps = S.photos;
        const img = document.createElement('img');
        img.className = 'cine-intro__flash';
        img.alt = '';
        el.insertBefore(img, el.firstChild);
        el.classList.add('is-flash');
        let last = -1;
        tl.to(o, { v: ps.length, duration: 3.4, ease: 'power1.inOut', onUpdate: () => { const i = Math.max(1, Math.round(o.v)); if (i !== last) { last = i; img.src = src(ps[i - 1], 640); n.textContent = pad(i); pl.textContent = L(ps[i - 1].place); } } });
        finish(0.5);
      }

      if (name === 'cities') {
        // the city names fill the screen as a wall; the number cuts through them
        const cities = []; const seen = new Set();
        S.trips.slice().reverse().forEach((t) => t.legs.forEach((l) => { const c = L({ en: l.to.city, zh: l.to.zh || l.to.city }); if (!seen.has(c)) { seen.add(c); cities.push(c); } }));
        const wall = document.createElement('div');
        wall.className = 'cine-intro__wall';
        cities.forEach((c) => { const s = document.createElement('span'); s.textContent = c; wall.append(s); });
        el.insertBefore(wall, count);
        pl.textContent = ctx.t('introCities');
        const spans = [...wall.children];
        gsap.set(spans, { opacity: 0 });
        tl.to(o, { v: cities.length, duration: 2.8, ease: 'power2.inOut', onUpdate: () => { const i = Math.max(1, Math.round(o.v)); n.textContent = pad(i); spans.forEach((s, k) => { s.style.opacity = k < i ? '0.55' : '0'; }); } });
        finish(0.45);
        tl.to(wall, { opacity: 0, duration: 0.3 }, '<');
      }

      if (name === 'years') {
        // a year clock from 2010 to 2026; the countries of each year appear beneath
        const byYear = {};
        order.forEach((c) => { const y = c.visits[0].when.slice(0, 4); (byYear[y] = byYear[y] || []).push(L(c)); });
        const y0 = 2010, y1 = 2026;
        n.classList.add('is-year');
        tl.to(o, { v: y1 - y0, duration: 2.8, ease: 'power2.inOut', onUpdate: () => { const y = y0 + Math.round(o.v); n.textContent = String(y); pl.textContent = (byYear[String(y)] || []).join('   ') || ''; } });
        finish(0.6);
      }

      if (name === 'light') {
        // the photographs by the light they were taken in; the ground tints with each kind
        const kinds = [['night', '#070a16'], ['blue', '#0b1230'], ['golden', '#3a1d08'], ['day', '#2a2d33']];
        const groups = kinds.map(([k, g]) => [k, g, S.photos.filter((p) => (p.light || '').replace(/-(am|pm)$/, '') === k)]);
        const all = groups.flatMap(([k, g, ps]) => ps.map((p) => [k, g, p]));
        const halves = document.querySelectorAll('.cine-intro__half');
        let last = -1;
        tl.to(o, { v: all.length, duration: 3.2, ease: 'power1.inOut', onUpdate: () => { const i = Math.max(1, Math.round(o.v)); if (i === last) return; last = i; const [k, g, p] = all[i - 1]; n.textContent = pad(i); pl.textContent = `${ctx.t(k)}   ${p.time || ''}`; halves.forEach((h) => { h.style.background = g; }); } });
        finish(0.5);
      }

      if (name === 'shutter') {
        // 71 shutter speeds, read off the files, clicking faster and faster
        const speeds = S.photos.filter((p) => p.shutter).map((p) => p.shutter);
        const click = document.createElement('div');
        click.className = 'cine-intro__click';
        el.insertBefore(click, count);
        // the flash fires at most three times a second (the photosensitivity limit); the number still ticks every click
        let last = -1, lastFlash = 0;
        tl.to(o, { v: speeds.length, duration: 3, ease: 'power3.in', onUpdate: () => { const i = Math.max(1, Math.round(o.v)); if (i === last) return; last = i; n.textContent = pad(i); pl.textContent = speeds[i - 1]; const now = performance.now(); if (now - lastFlash < 340) return; lastFlash = now; click.style.transition = 'none'; click.style.opacity = '0.8'; requestAnimationFrame(() => { click.style.transition = 'opacity 220ms ease-out'; click.style.opacity = '0'; }); } });
        finish(0.4);
      }

      if (name === 'home') {
        // it counts down through the countries to the one he always flies from
        const names = [...order.map((c) => L(c))].reverse();
        tl.to(o, { v: names.length, duration: 2.4, ease: 'power2.inOut', onUpdate: () => { const i = Math.max(1, Math.round(o.v)); n.textContent = pad(names.length - i + 1); pl.textContent = names[i - 1]; } })
          .add(() => { n.textContent = pad(1); pl.textContent = `${L(country.taiwan)}   ${ctx.t('home')}`; })
          .to(n, { color: '#ff8a3d', duration: 0.3 });
        finish(0.8);
      }

      if (name === 'dial') {
        // the number spins up through every digit before locking, as a rotary counter
        n.classList.add('is-dial');
        n.innerHTML = '<span class="d"><i></i></span><span class="d"><i></i></span>';
        const cols = [...n.querySelectorAll('.d i')];
        const target = S.countries.length;
        const tens = Math.floor(target / 10), ones = target % 10;
        pl.textContent = ctx.t('countriesN', target).replace(/^\d+\s?/, '');
        // each strip holds 0 to 9 four times over so the digit can spin several turns before locking
        cols.forEach((c) => { c.innerHTML = Array.from({ length: 40 }, (_, k) => `<b>${k % 10}</b>`).join(''); });
        const step = () => cols[0].querySelector('b').getBoundingClientRect().height;
        tl.fromTo(cols[1], { y: 0 }, { y: () => -step() * (30 + ones), duration: 2.6, ease: 'power3.out' }, 0)
          .fromTo(cols[0], { y: 0 }, { y: () => -step() * (20 + tens), duration: 2.2, ease: 'power3.out' }, 0.2);
        finish(0.5);
      }
    });
  }
})();

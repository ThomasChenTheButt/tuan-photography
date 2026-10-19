/* design 3, the counting openings, chosen from the address: index.html?intro=<name>.
   He liked the count of cities with the names behind it (2026-10-19) and asked for cities and countries
   counting together. Every number is worked out from his data; nothing is invented. The eight other
   counts tried that day (flights, kilometres, photographs, years, light, shutter, home, dial) and the
   plain countries count are at the tag counting-openings-ten-2026-10-19.
     cities   60 cities, the names filling the screen as a wall of type that the number cuts through
     pair     cities and countries side by side, counting together: the wall holds both, each country
              name in wide orange type the moment the count reaches it
     stack    the same two counts one above the other, countries first */
window.INTRO_VARIANTS = (() => {
  'use strict';
  const q = new URLSearchParams(location.search);
  const NAMES = ['cities', 'pair', 'stack'];
  const name = NAMES.includes(q.get('intro')) ? q.get('intro') : 'cities';
  return { name, run };

  function run(ctx) {
    const { S, country: K, L, gsap, $ } = ctx;
    const el = $('#intro');
    const count = $('.cine-intro__count');
    document.body.classList.add(`intro-${name}`);
    const pad = (v) => String(v).padStart(2, '0');
    const half = () => gsap.timeline().to('.cine-intro__half--top', { yPercent: -100, duration: 0.9, ease: 'power4.inOut' }, 0).to('.cine-intro__half--bottom', { yPercent: 100, duration: 0.9, ease: 'power4.inOut' }, 0);
    const o = { v: 0 };

    // the places in the order he reached them: every trip oldest first, every flight's destination once.
    // A city belongs to the nearest of its trip's countries (Taipei to Taiwan); a country no flight lands
    // in (Myanmar, the Netherlands: trips without an itinerary) still takes its place in the order.
    const rad = Math.PI / 180;
    const dist = (a, b) => { const h = Math.sin((b[0] - a.lat) * rad / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b[0] * rad) * Math.sin((b[1] - a.lng) * rad / 2) ** 2; return Math.asin(Math.sqrt(h)); };
    const items = []; const seenCity = new Set(); const seenCountry = new Set();
    const country = (c) => { if (seenCountry.has(c.id)) return; seenCountry.add(c.id); items.push({ kind: 'country', name: L(c) }); };
    S.trips.slice().reverse().forEach((t) => {
      const pool = [...new Set([...t.countries, 'taiwan'])].map((id) => K[id]).filter(Boolean);
      t.legs.forEach((l) => {
        const cityName = L({ en: l.to.city, zh: l.to.zh || l.to.city });
        if (seenCity.has(l.to.city)) return;
        seenCity.add(l.to.city);
        let best = K.taiwan, bd = Infinity;
        if (l.to.code !== 'TPE') pool.forEach((c) => { const d = dist(l.to, c.ll); if (d < bd) { bd = d; best = c; } });
        if (best) country(best);
        items.push({ kind: 'city', name: cityName });
      });
      t.countries.forEach((id) => { if (K[id]) country(K[id]); });
    });
    const cities = items.filter((it) => it.kind === 'city');

    return new Promise((done) => {
      const tl = gsap.timeline({ onComplete: () => { el.remove(); done(); } });
      const finish = (hold = 0.35) => tl.to(count, { opacity: 0, y: -12, duration: 0.25, ease: 'power2.out' }, `+=${hold}`).add(half(), '<0.1');
      el.addEventListener('click', () => tl.progress(1), { once: true });
      addEventListener('keydown', () => tl.progress(1), { once: true });

      // the wall of names behind the count
      const wall = document.createElement('div');
      wall.className = 'cine-intro__wall';
      const list = name === 'cities' ? cities : items;
      list.forEach((it) => { const s = document.createElement('span'); s.textContent = it.name; if (it.kind === 'country') s.className = 'c'; wall.append(s); });
      el.insertBefore(wall, count);
      const spans = [...wall.children];
      gsap.set(spans, { opacity: 0 });

      if (name === 'cities') {
        const n = $('#intro-n'), pl = $('#intro-place');
        pl.textContent = ctx.t('introCities');
        tl.to(o, { v: cities.length, duration: 2.8, ease: 'power2.inOut', onUpdate: () => { const i = Math.max(1, Math.round(o.v)); n.textContent = pad(i); spans.forEach((s, k) => { s.style.opacity = k < i ? '0.55' : '0'; }); } });
      }

      if (name === 'pair' || name === 'stack') {
        // two numbers from one count: a country ticks the moment its first city is reached
        count.classList.add('is-two');
        if (name === 'stack') count.classList.add('is-stack');
        count.innerHTML = `<span class="cine-intro__g"><span class="cine-intro__n" id="intro-n">00</span><span class="cine-intro__place" id="intro-place"></span></span>
          <span class="cine-intro__g"><span class="cine-intro__n" id="intro-n2">00</span><span class="cine-intro__place" id="intro-place2"></span></span>`;
        const nC = $('#intro-n'), nK = $('#intro-n2');
        $('#intro-place').textContent = ctx.t('introCountries');
        $('#intro-place2').textContent = ctx.t('introCities');
        tl.to(o, { v: items.length, duration: 3.2, ease: 'power2.inOut', onUpdate: () => {
          const i = Math.max(1, Math.round(o.v));
          let c = 0, k = 0;
          items.forEach((it, j) => { const on = j < i; spans[j].style.opacity = on ? (it.kind === 'country' ? '0.9' : '0.5') : '0'; if (on) { if (it.kind === 'country') c += 1; else k += 1; } });
          nC.textContent = pad(c); nK.textContent = pad(k);
        } });
      }

      finish(0.5);
      tl.to(wall, { opacity: 0, duration: 0.3 }, '<');
    });
  }
})();

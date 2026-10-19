/* design 3, the hero variations, chosen from the address: index.html?hero=<name>.
   Each is one opening; the rest of the page is the same film. Loaded before film.js, which
   hands the hero over to the variation when one is named. Every variation is dark, keeps the
   words off the photograph until it has arrived, and respects reduce-motion.
     film      the held Aoraki with the travelling coordinates (the current one)
     strip     a film strip: the whole hero is a row of frames sliding past, the scroll takes it to the first
     unfold    one photograph in six vertical blades that open from the centre like a curtain
     shutter   the aurora, arriving as a shutter: the frame irises open from black, with a 20-second exposure counting
     contact   every photograph as a contact sheet that rushes past the camera, then one stays
     letters   the name "TUAN" cut out of Fuji at dawn; the camera pushes through the letters as you scroll */
window.HERO_VARIANTS = (() => {
  'use strict';
  const q = new URLSearchParams(location.search);
  const name = ['strip', 'unfold', 'shutter', 'contact', 'letters'].includes(q.get('hero')) ? q.get('hero') : 'film';

  return { name, build, arrive };

  function build(ctx) {
    const { S, byId, photo, L, country, COVER, reduce, $ } = ctx;
    const frame = $('#hero-frame');
    const words = $('.film-hero__words');
    document.body.classList.add(`hero-${name}`);
    if (name === 'film') return byId.aoraki;

    if (name === 'strip') {
      // ten frames in a row; the sixth, Aoraki, is the one the strip stops on
      const ids = ['tokyo-night', 'calanque', 'matterhorn-lake', 'peak-night', 'golden-gate-fog', 'aoraki', 'fuji-lake', 'aurora', 'bunkers', 'sapa-valley'];
      const strip = document.createElement('div');
      strip.className = 'hs-strip';
      ids.forEach((id) => { const p = byId[id]; if (!p) return; const f = document.createElement('div'); f.className = 'hs-strip__f'; f.dataset.id = id; f.append(photo(p, { sizes: '70vw', eager: true })); strip.append(f); });
      frame.insertBefore(strip, words);
      $('#hero-photo').remove();
      return byId.aoraki;
    }
    if (name === 'unfold') {
      const p = byId['matterhorn-lake'];
      const box = document.createElement('div');
      box.className = 'hs-blades';
      for (let i = 0; i < 6; i++) { const b = document.createElement('div'); b.className = 'hs-blade'; b.style.setProperty('--i', String(i)); const im = new Image(p.w, p.h); im.alt = ''; im.sizes = COVER; im.srcset = ctx.srcset(p); im.src = ctx.src(p); b.append(im); box.append(b); }
      frame.insertBefore(box, words);
      const b = photo(p, { sizes: COVER, eager: true });
      b.classList.add('film-hero__ph', 'hs-under');
      $('#hero-photo').append(b);
      return p;
    }
    if (name === 'shutter') {
      const p = byId.aurora;
      const b = photo(p, { sizes: COVER, eager: true });
      b.classList.add('film-hero__ph');
      $('#hero-photo').append(b);
      const iris = document.createElement('div');
      iris.className = 'hs-iris';
      iris.innerHTML = '<p class="hs-iris__t mono"><span id="hs-exp">0.0</span>s</p>';
      frame.insertBefore(iris, words);
      return p;
    }
    if (name === 'contact') {
      const p = byId.aoraki;
      const sheet = document.createElement('div');
      sheet.className = 'hs-sheet';
      const pool = S.photos.filter((x) => x.id !== 'aoraki').slice(0, 48);
      pool.forEach((x, i) => { const f = document.createElement('div'); f.className = 'hs-sheet__f'; f.style.setProperty('--i', String(i)); const im = new Image(x.w, x.h); im.alt = ''; im.src = ctx.src(x, 640); im.decoding = 'async'; f.append(im); sheet.append(f); });
      frame.insertBefore(sheet, words);
      const b = photo(p, { sizes: COVER, eager: true });
      b.classList.add('film-hero__ph', 'hs-under');
      $('#hero-photo').append(b);
      return p;
    }
    if (name === 'letters') {
      const p = byId['fuji-lake'];
      const b = photo(p, { sizes: COVER, eager: true });
      b.classList.add('film-hero__ph');
      $('#hero-photo').append(b);
      const mask = document.createElement('div');
      mask.className = 'hs-mask';
      mask.innerHTML = '<span class="hs-mask__w">TUAN</span>';
      frame.insertBefore(mask, words);
      return p;
    }
    return byId.aoraki;
  }

  function arrive(ctx) {
    const { gsap, reduce, hero, viewfinder, $, fmtCoord, HOME, lat, lng, heroGlobe } = ctx;
    const coord = $('#hero-coord');
    const wordsIn = (delay = 0.1) => {
      gsap.from('#hero-name-in', { yPercent: 108, duration: 1.3, ease: 'expo.out', delay });
      gsap.from(['#hero-where', '.film-hero__bar > *'], { opacity: 0, y: 12, duration: 0.9, ease: 'power3.out', stagger: 0.08, delay: delay + 0.4 });
    };
    const travel = (delay = 0.4) => {
      const o = { la: HOME[1], lo: HOME[0] };
      if (heroGlobe) heroGlobe.rot = [HOME[0], HOME[1]];
      gsap.to(o, { la: lat(hero), lo: lng(hero), duration: 2.6, ease: 'power3.inOut', delay,
        onUpdate: () => { coord.textContent = fmtCoord(o.la, o.lo); if (heroGlobe) heroGlobe.rot = [o.lo, o.la]; } });
    };
    if (reduce) { coord.textContent = fmtCoord(lat(hero), lng(hero)); document.body.classList.add('hero-done'); viewfinder(hero, true); return; }

    if (name === 'strip') {
      // the strip rushes past, slowing to a stop on Aoraki; the frames grow to fill the screen
      const strip = $('.hs-strip'), fs = [...strip.children];
      const k = fs.findIndex((f) => f.dataset.id === 'aoraki');
      const stop = () => -(fs[k].offsetLeft + fs[k].offsetWidth / 2 - innerWidth / 2);
      gsap.set(strip, { x: () => stop() + fs[k].offsetWidth * 4.5 });
      const tl = gsap.timeline({ onComplete: () => { document.body.classList.add('hero-done'); viewfinder(hero, true); } });
      tl.to(strip, { x: () => stop(), duration: 3.2, ease: 'power4.out' })
        .add(() => {
          // the Aoraki frame grows from where it stopped to the whole screen: a copy is lifted out of the strip
          const r = fs[k].getBoundingClientRect();
          const big = fs[k].cloneNode(true);
          big.className = 'hs-strip__big';
          Object.assign(big.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
          $('#hero-frame').append(big);
          const sc = Math.max(innerWidth / r.width, innerHeight / r.height);
          gsap.to(big, { x: innerWidth / 2 - (r.left + r.width / 2), y: innerHeight / 2 - (r.top + r.height / 2), scale: sc, duration: 1.5, ease: 'power3.inOut' });
          gsap.set(fs[k], { opacity: 0 });
        }, '-=0.6')
        .to(fs.filter((f, i) => i !== k), { opacity: 0, duration: 0.5, ease: 'power2.out' }, '<');
      wordsIn(3.4); travel(3.1);
      return;
    }
    if (name === 'unfold') {
      const blades = [...document.querySelectorAll('.hs-blade')];
      const order = [2, 3, 1, 4, 0, 5];   // from the centre outward
      gsap.set(blades, { scaleX: 0 });
      gsap.set('.hs-under', { opacity: 0 });
      gsap.to(blades, { scaleX: 1, duration: 1.5, ease: 'expo.out', stagger: { each: 0.12, from: 'center' }, delay: 0.4,
        onComplete: () => { gsap.set('.hs-under', { opacity: 1 }); gsap.to('.hs-blades', { opacity: 0, duration: 0.3 }); document.body.classList.add('hero-done'); viewfinder(hero, true); } });
      gsap.fromTo('.hs-blade img', { scale: 1.18 }, { scale: 1, duration: 2.6, ease: 'power2.out', delay: 0.4 });
      wordsIn(1.6); travel(1.3);
      return;
    }
    if (name === 'shutter') {
      // the iris opens from the centre; the exposure counts the aurora's real 20 seconds, fast
      const o = { r: 0, s: 0 };
      const iris = $('.hs-iris'), t = $('#hs-exp');
      const ph = $('#hero-photo');
      gsap.to(o, { r: 85, duration: 2.6, ease: 'power3.inOut', delay: 0.3, onUpdate: () => { ph.style.clipPath = `circle(${o.r.toFixed(2)}vmax at 50% 50%)`; }, onComplete: () => { ph.style.clipPath = 'none'; iris.style.display = 'none'; } });
      gsap.to(o, { s: 20, duration: 2.6, ease: 'power1.inOut', delay: 0.3, onUpdate: () => { t.textContent = o.s.toFixed(1); },
        onComplete: () => { gsap.to('.hs-iris__t', { opacity: 0, duration: 0.5 }); document.body.classList.add('hero-done'); viewfinder(hero, true); } });
      gsap.fromTo('.film-hero__ph img', { scale: 1.2, filter: 'brightness(0.3)' }, { scale: 1, filter: 'brightness(1)', duration: 3.4, ease: 'power2.out', delay: 0.3, clearProps: 'filter' });
      wordsIn(2.2); travel(1.9);
      return;
    }
    if (name === 'contact') {
      // the sheet rushes toward the camera and past it; Aoraki is what remains
      const fs = [...document.querySelectorAll('.hs-sheet__f')];
      gsap.set('.hs-sheet', { perspective: 900 });
      gsap.fromTo(fs, { z: -2600, opacity: 0 }, { z: 900, opacity: 1, duration: 3, ease: 'power2.in', stagger: { each: 0.018, from: 'random' },
        onComplete: () => { gsap.set('.hs-sheet', { display: 'none' }); document.body.classList.add('hero-done'); viewfinder(hero, true); } });
      gsap.to(fs, { opacity: 0, duration: 0.35, ease: 'power2.out', delay: 2.5, stagger: { each: 0.018, from: 'random' } });
      gsap.fromTo('.hs-under img', { scale: 1.3, filter: 'blur(10px)' }, { scale: 1, filter: 'blur(0px)', duration: 2.8, ease: 'power2.out', delay: 1.4, clearProps: 'filter' });
      wordsIn(3); travel(2.8);
      return;
    }
    if (name === 'letters') {
      // TUAN holds Fuji at dawn inside its letters; the scroll pushes through them into the photograph
      const w = $('.hs-mask__w'), mask = $('.hs-mask');
      gsap.from(w, { yPercent: 30, opacity: 0, duration: 1.4, ease: 'expo.out', delay: 0.2 });
      gsap.fromTo('.film-hero__ph img', { scale: 1.25 }, { scale: 1.12, duration: 3, ease: 'power2.out' });
      gsap.timeline({ scrollTrigger: { trigger: '#hero', start: 'top top', end: '+=120%', pin: true, scrub: 0.6,
        onLeave: () => { document.body.classList.add('hero-done'); viewfinder(hero, true); } } })
        .to(w, { scale: 9, duration: 0.6, ease: 'power2.in' }, 0)
        .to(mask, { opacity: 0, duration: 0.2, ease: 'none' }, 0.42)
        .to('.film-hero__ph img', { scale: 1, duration: 0.6, ease: 'none' }, 0)
        .fromTo(['.film-hero__words', '.film-hero__bar'], { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.25, ease: 'power3.out' }, 0.6);
      gsap.set(['.film-hero__words', '.film-hero__bar'], { opacity: 0 });
      coord.textContent = fmtCoord(lat(hero), lng(hero));
      return;
    }
    // film: the held Aoraki with the focus pull
    wordsIn(0.1); travel(0.4);
    gsap.fromTo('.film-hero__ph img', { scale: 1.12, filter: 'blur(14px)' }, { scale: 1, filter: 'blur(0px)', duration: 2.2, ease: 'power2.out', clearProps: 'filter' });
    gsap.fromTo('.film-hero__ph img', { scale: 1.12 }, { scale: 1, duration: 9, ease: 'power1.out', delay: 2.2, immediateRender: false });
    setTimeout(() => { document.body.classList.add('hero-done'); viewfinder(hero, true); }, 1700);
  }
})();

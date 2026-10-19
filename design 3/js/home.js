/* design 3, the home page: one day of light.
   Every photograph whose file records the moment it was taken is placed at that local hour. The
   page is a day: first light, morning, midday, afternoon, the golden and blue hour (pinned, in order
   of the sun's height), night, after midnight. The ground follows the sky. The dial in the corner is
   a 24 hour clock of every photograph: it shows the hour on screen, and it can be dragged to go to
   any hour. */
(() => {
  'use strict';
  const { S, photo, t, L, esc, sun, onLang, reduce } = D3;
  const root = document.documentElement;
  const $ = (s) => document.querySelector(s);
  const pad = (n) => String(n).padStart(2, '0');
  const hm = (m) => `${pad(Math.floor(m / 60) % 24)}:${pad(Math.round(m) % 60)}`;
  const deg = (v) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(1)}°`;

  window.PAGE = {
    title: { en: 'One day of light · tuan photography 陳亮元', zh: '光的一天 · tuan photography 陳亮元' },
    en: {
      heroBy: 'Thomas Chen, landscape photographer', heroA: 'One day', heroB: 'of light',
      heroLede: (n, c) => `${n} photographs from ${c} countries, each placed at the local hour it was taken, from first light to after midnight.`,
      firstT: 'First light', morningT: 'Morning', middayT: 'Midday', afternoonT: 'Afternoon',
      peakT: 'Golden hour, then blue', nightT: 'Night', lateT: 'After midnight',
      range: (a, b, n) => `${a} to ${b}  ${n} photographs`, one: (a) => `${a}  1 photograph`,
      morningSay: (lo, hi, c) => `${c} countries. The sun between ${lo}° and ${hi}° above the horizon.`,
      middaySay: (hi, c) => `${c} countries, in the hardest light of the day: the sun as high as ${hi}°.`,
      afternoonSay: (lo, c) => `${c} countries. The sun lowers, as far as ${lo}° above the horizon.`,
      peakSay: (n, c, hi, lo) => `${n} photographs from ${c} countries, in order of the sun's height: from ${hi}° above the horizon to ${lo}° below.`,
      nightSay: (c) => `After dark, in ${c} countries.`,
      lateSay: (lo) => `The darkest hours. The sun as far as ${lo}° below the horizon.`,
      firstSay: (place, where, s) => `${place}, ${where}. ${s}.`,
      dialStart: 'Before dawn', dialHint: 'Drag the hand to any hour.',
      closeCap: 'Back to 05:00', closeT: 'Then it is morning somewhere else.',
      closeTrips: 'Follow the journeys', closePhotos: 'Every photograph', closeGuide: 'The Barcelona guide',
      dialLabel: 'The hour of the photograph on screen. Arrow keys move to the next or previous photograph.',
    },
    zh: {
      heroBy: '陳亮元，風景攝影', heroA: '光的', heroB: '一天',
      heroLede: (n, c) => `${n} 張照片，來自 ${c} 個國家，每一張都放在它在當地被拍下的那個時刻，從第一道光到午夜之後。`,
      firstT: '第一道光', morningT: '早晨', middayT: '正午', afternoonT: '午後',
      peakT: '黃金時刻，然後藍調', nightT: '夜晚', lateT: '午夜之後',
      range: (a, b, n) => `${a} 至 ${b}  ${n} 張`, one: (a) => `${a}  1 張`,
      morningSay: (lo, hi, c) => `${c} 個國家。太陽在地平線上 ${lo}° 到 ${hi}° 之間。`,
      middaySay: (hi, c) => `${c} 個國家，一天裡最硬的光：太陽最高到 ${hi}°。`,
      afternoonSay: (lo, c) => `${c} 個國家。太陽慢慢低下來，最低到地平線上 ${lo}°。`,
      peakSay: (n, c, hi, lo) => `${n} 張照片，來自 ${c} 個國家，依太陽的高度排列：從地平線上 ${hi}° 到地平線下 ${lo}°。`,
      nightSay: (c) => `天黑之後，${c} 個國家。`,
      lateSay: (lo) => `最暗的幾個小時。太陽最低到地平線下 ${lo}°。`,
      firstSay: (place, where, s) => `${place}，${where}。${s}。`,
      dialStart: '天亮之前', dialHint: '拖動指針，到一天裡的任何時刻。',
      closeCap: '回到 05:00', closeT: '然後，別的地方天亮了。',
      closeTrips: '跟著旅程走', closePhotos: '所有照片', closeGuide: '巴賽隆納攻略',
      dialLabel: '畫面上這張照片的拍攝時刻。方向鍵移到下一張或上一張。',
    },
  };

  /* ------------------------------------------------ the day, from the files */
  const timed = S.photos.filter((p) => p.min != null).sort((a, b) => a.min - b.min);
  const G = {
    first: timed.filter((p) => /-am$/.test(p.light)),
    morning: timed.filter((p) => p.light === 'day' && p.min < 720),
    midday: timed.filter((p) => p.light === 'day' && p.min >= 720 && p.min < 900),
    afternoon: timed.filter((p) => p.light === 'day' && p.min >= 900),
    peak: timed.filter((p) => /-pm$/.test(p.light)).sort((a, b) => b.sun - a.sun),
    night: timed.filter((p) => p.light === 'night' && p.min >= 720),
    late: timed.filter((p) => p.light === 'night' && p.min < 720),
  };
  const order = [...G.first, ...G.morning, ...G.midday, ...G.afternoon, ...G.peak, ...G.night, ...G.late];
  const nCountries = (list) => new Set(list.map((p) => p.country)).size;
  const sunMin = (list) => Math.min(...list.map((p) => p.sun));
  const sunMax = (list) => Math.max(...list.map((p) => p.sun));

  /* ------------------------------------------------ building the page */
  const figs = new Map();   // photo id -> its figure
  function caption(p) {
    const k = p.light.replace(/-(am|pm)$/, '');
    return `<b>${esc(L(p.place))}</b><span class="mono"><span class="dot dot--${k}"></span>${p.time}  ${esc(L(p.where))}</span>`;
  }
  function fig(p, sizes) {
    const f = document.createElement('figure');
    f.dataset.id = p.id;
    f.style.setProperty('--ar', (p.w / p.h).toFixed(4));
    f.append(photo(p, { sizes }));
    const c = document.createElement('figcaption');
    c.className = 'cap-line';
    f.append(c);
    figs.set(p.id, f);
    return f;
  }
  function rowsOf(list, per) {
    const rows = []; let row = [], sum = 0;
    list.forEach((p, i) => {
      row.push(p); sum += p.w / p.h;
      const left = list.length - i - 1;
      if ((sum >= per && left !== 1) || left === 0) { rows.push(row); row = []; sum = 0; }
    });
    return rows;
  }
  function build() {
    const fp = G.first[0];
    if (fp) {
      const f = fig(fp, '(max-width: 52rem) 94vw, 72vw');
      f.querySelector('img').loading = 'eager';
      $('#first-ph').append(f);
    } else {
      $('[data-act="first"]').hidden = true;
    }
    G.morning.forEach((p) => $('#morning').append(fig(p, '(max-width: 52rem) 80vw, 45vw')));
    G.midday.forEach((p) => $('#midday').append(fig(p, '(max-width: 52rem) 80vw, 50vw')));
    rowsOf(G.afternoon, 3.3).forEach((r) => {
      const row = document.createElement('div');
      row.className = 'rows__row';
      r.forEach((p, i) => { const f = fig(p, '(max-width: 40rem) 94vw, 40vw'); f.dataset.in = ''; f.style.setProperty('--d', `${i * 70}ms`); row.append(f); });
      $('#afternoon').append(row);
    });
    G.peak.forEach((p) => {
      const d = document.createElement('div');
      d.className = 'peak__ph';
      d.dataset.id = p.id;
      d.style.setProperty('--ar', (p.w / p.h).toFixed(4));
      d.append(photo(p, { sizes: '(max-width: 52rem) 94vw, 80vw' }));
      $('#peak').append(d);
    });
    G.night.forEach((p) => $('#night').append(fig(p, '(max-width: 52rem) 94vw, 52rem')));
    G.late.forEach((p) => { const f = fig(p, '(max-width: 40rem) 94vw, 50vw'); f.dataset.in = ''; $('#late').append(f); });
    const ig = $('#close-ig');
    ig.href = S.instagram.url;
    ig.textContent = `@${S.instagram.handle}`;
  }

  function words() {
    figs.forEach((f, id) => { f.querySelector('figcaption').innerHTML = caption(D3.byId[id]); });
    $('#hero-lede').textContent = t('heroLede', timed.length, nCountries(timed));
    const fp = G.first[0];
    if (fp) {
      $('#first-time').textContent = fp.time;
      $('#first-say').textContent = t('firstSay', L(fp.place), L(fp.where), sun(fp));
    }
    const range = (list) => (list.length === 1 ? t('one', list[0].time) : t('range', list[0].time, list[list.length - 1].time, list.length));
    const r1 = (v) => Math.round(v);
    if (G.morning.length) { $('#morning-range').textContent = range(G.morning); $('#morning-say').textContent = t('morningSay', r1(sunMin(G.morning)), r1(sunMax(G.morning)), nCountries(G.morning)); }
    if (G.midday.length) { $('#midday-range').textContent = range(G.midday); $('#midday-say').textContent = t('middaySay', r1(sunMax(G.midday)), nCountries(G.midday)); }
    if (G.afternoon.length) { $('#afternoon-range').textContent = range(G.afternoon); $('#afternoon-say').textContent = t('afternoonSay', r1(sunMin(G.afternoon)), nCountries(G.afternoon)); }
    if (G.peak.length) {
      const byTime = [...G.peak].sort((a, b) => a.min - b.min);
      $('#peak-range').textContent = range(byTime);
      peakSay.textContent = t('peakSay', G.peak.length, nCountries(G.peak), Math.abs(sunMax(G.peak)).toFixed(1), Math.abs(sunMin(G.peak)).toFixed(1));
    }
    if (G.night.length) { $('#night-range').textContent = range(G.night); $('#night-say').textContent = t('nightSay', nCountries(G.night)); }
    if (G.late.length) { $('#late-range').textContent = range(G.late); $('#late-say').textContent = t('lateSay', Math.abs(Math.round(sunMin(G.late)))); }
    $('#close-cap').textContent = t('closeCap');
    dial.setAttribute('aria-label', t('dialLabel'));
    paintFace();
    if (G.peak.length) { const p = G.peak[Math.max(0, peakIndex)]; peakWhere(p); if (peakIndex < 0) $('#peak-sun').textContent = deg(p.sun); }
  }
  const peakSay = document.createElement('p');
  peakSay.className = 'peak__say';

  /* ------------------------------------------------ the sky */
  const DARK = { ink: '#efe8dc', ink2: '#aaa69e', line: 'rgba(239,232,220,0.16)', accent: '#ff9447', ln: '#8fa3c7', lb: '#7397ff', lg: '#ffa24c', ld: '#e9e2d2' };
  const LIGHT = { ink: '#17150f', ink2: '#463f35', line: 'rgba(23,21,15,0.16)', accent: '#9c3d08', ln: '#34405a', lb: '#3554c8', lg: '#a8480a', ld: '#8a8273' };
  const SKY = {
    hero: ['#0d1424', DARK], first: ['#d8b39a', LIGHT], morning: ['#e3e9ea', LIGHT], midday: ['#f1f0ea', LIGHT],
    afternoon: ['#ebdfc9', LIGHT], peak: ['#e6a35e', LIGHT], night: ['#0b0f1a', DARK], late: ['#05070d', DARK], close: ['#0d1424', DARK],
  };
  const PEAK_GROUND = ['#e6a35e', '#d8834a', '#b0634a', '#5d4f78', '#2a3460', '#1a2242'];
  const meta = document.querySelector('meta[name="theme-color"]');
  let inkNow = null;
  function ink(set, dur) {
    if (inkNow === set) return;
    inkNow = set;
    gsap.to(root, { '--ink': set.ink, '--ink-2': set.ink2, '--line': set.line, '--accent': set.accent,
      '--l-night': set.ln, '--l-blue': set.lb, '--l-golden': set.lg, '--l-day': set.ld, duration: reduce ? 0 : dur, ease: 'power2.out', overwrite: 'auto' });
  }
  function sky(name, dur = 0.9) {
    if (peakST && peakST.isActive) return;   // the peak paints its own sky
    const [g, set] = SKY[name];
    gsap.to(root, { '--g': g, duration: reduce ? 0 : dur, ease: 'power2.out', overwrite: 'auto', onUpdate: () => { meta.content = getComputedStyle(root).getPropertyValue('--g').trim(); } });
    ink(set, dur * 0.6);
  }

  /* ------------------------------------------------ the dial */
  const dial = $('#dial');
  const hand = $('#dial-hand');
  const R = 44;
  const xy = (m, r) => { const a = (m / 1440) * Math.PI * 2 + Math.PI / 2; return [r * Math.cos(a), r * Math.sin(a)]; };
  function buildDial() {
    const ns = 'http://www.w3.org/2000/svg';
    const ticks = $('#dial-ticks');
    for (let h = 0; h < 24; h++) {
      const major = h % 6 === 0;
      const [x1, y1] = xy(h * 60, major ? 39.5 : 41.5);
      const [x2, y2] = xy(h * 60, R - 0.5);
      const l = document.createElementNS(ns, 'line');
      l.setAttribute('class', `dial__tick${major ? ' dial__tick--major' : ''}`);
      Object.entries({ x1, y1, x2, y2 }).forEach(([k, v]) => l.setAttribute(k, v.toFixed(2)));
      ticks.append(l);
      if (major) {
        const [x, y] = xy(h * 60, 33.5);
        const tx = document.createElementNS(ns, 'text');
        tx.setAttribute('class', 'dial__num');
        tx.setAttribute('x', x.toFixed(2)); tx.setAttribute('y', y.toFixed(2));
        tx.textContent = pad(h);
        ticks.append(tx);
      }
    }
    const shots = $('#dial-shots');
    order.forEach((p) => {
      const [x, y] = xy(p.min, R);
      const c = document.createElementNS(ns, 'circle');
      c.setAttribute('class', `dial__shot dial__shot--${p.light}`);
      c.setAttribute('cx', x.toFixed(2)); c.setAttribute('cy', y.toFixed(2)); c.setAttribute('r', '1.5');
      c.dataset.id = p.id;
      shots.append(c);
    });
  }
  let active = null;          // the photograph on screen
  let target = 300, cur = 300; // minutes; the hand eases toward its target
  let spinning = false;
  function spin() {
    let d = ((target - cur + 2160) % 1440) - 720;   // the short way round
    if (Math.abs(d) < 0.05) { cur = target; spinning = false; draw(); return; }
    cur = (cur + d * (reduce ? 1 : 0.14) + 1440) % 1440;
    draw();
    requestAnimationFrame(spin);
  }
  const draw = () => hand.setAttribute('transform', `rotate(${(cur / 1440) * 360})`);
  function aim(m) { target = m; if (!spinning) { spinning = true; requestAnimationFrame(spin); } }
  function paintFace(p = active) {
    $('#dial-time').textContent = p ? p.time : '05:00';
    $('#dial-light').textContent = p ? t(p.light) : t('dialStart');
    $('#dial-place').textContent = '';
    if (p) { dial.setAttribute('aria-valuenow', String(p.min)); dial.setAttribute('aria-valuetext', `${p.time}, ${L(p.place)}`); }
    else { dial.setAttribute('aria-valuenow', '300'); dial.setAttribute('aria-valuetext', `05:00, ${t('dialStart')}`); }
  }
  function setActive(p) {
    if (p === active) return;
    active = p;
    dial.querySelectorAll('.dial__shot.is-on').forEach((c) => { c.classList.remove('is-on'); c.setAttribute('r', '1.5'); });
    if (p) { const c = dial.querySelector(`.dial__shot[data-id="${p.id}"]`); if (c) { c.classList.add('is-on'); c.setAttribute('r', '2.8'); } }
    aim(p ? p.min : 300);
    paintFace(p);
  }

  /* the lens: while the dial is large, the photograph at the hand's hour shows inside the ring */
  const lens = dial.querySelector('.dial__lens');
  const lensImgs = lens ? [...lens.querySelectorAll('img')] : [];
  let lensFront = 0, lensId = null, lensToken = 0, lensClear = 0;
  const small = (p) => D3.src(p, 640);
  function lensShow(p) {
    if (!lens) return;
    const tok = ++lensToken;
    clearTimeout(lensClear);
    if (!p) {
      lens.classList.remove('is-on');
      lensId = null;
      lensClear = setTimeout(() => { if (tok === lensToken) lensImgs.forEach((im) => im.classList.remove('is-on')); }, 460);
      return;
    }
    lens.classList.add('is-on');
    if (p.id === lensId) return;
    lensId = p.id;
    const back = lensImgs[lensFront ^ 1], front = lensImgs[lensFront];
    const swap = () => {
      if (tok !== lensToken) return;
      back.classList.add('is-on'); front.classList.remove('is-on');
      lensFront ^= 1;
    };
    back.src = small(p);
    if (back.decode) back.decode().then(swap, swap); else back.onload = swap;
  }
  /* a preview of one photograph on the large dial: hand, dot, face, lens; nothing else changes */
  function peek(p, withPlace) {
    aim(p.min);
    dial.querySelectorAll('.dial__shot.is-peek').forEach((c) => { if (c.dataset.id !== p.id) c.classList.remove('is-peek'); });
    const c = dial.querySelector(`.dial__shot[data-id="${p.id}"]`);
    if (c) c.classList.add('is-peek');
    $('#dial-time').textContent = p.time;
    $('#dial-light').textContent = t(p.light);
    $('#dial-place').textContent = withPlace ? L(p.place) : '';
    lensShow(p);
  }
  /* back to the photograph on screen (or 05:00 in the hero) */
  function unpeek() {
    dial.querySelectorAll('.dial__shot.is-peek').forEach((c) => c.classList.remove('is-peek'));
    $('#dial-place').textContent = '';
    lensShow(null);
    aim(active ? active.min : 300);
    paintFace(active);
  }

  /* the arrival: once, the hand sweeps through the day and stops at about ten photographs */
  let sweep = null;
  function stopSweep() {
    if (!sweep) return;
    sweep.timers.forEach(clearTimeout);
    sweep.off();
    sweep = null;
    unpeek();
  }
  function arrival() {
    if (reduce || !lens) return;
    const picks = [];
    [7, 9, 11, 13, 15, 17, 19, 21, 23, 1].forEach((h) => { const p = nearest(h * 60); if (p && !picks.includes(p)) picks.push(p); });
    if (!picks.length) return;
    const t0 = performance.now();
    let dead = false;
    const kill = () => { dead = true; };
    const early = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
    early.forEach((ev) => addEventListener(ev, kill, { passive: true, once: true }));
    const ready = Promise.all(picks.map((p) => { const im = new Image(); im.src = small(p); return im.decode ? im.decode() : new Promise((r, j) => { im.onload = r; im.onerror = j; }); }));
    const late = new Promise((r, j) => setTimeout(() => j(new Error('slow')), 2500));
    Promise.race([ready, late]).then(() => {
      early.forEach((ev) => removeEventListener(ev, kill));
      const wait = Math.max(0, 1100 - (performance.now() - t0));
      setTimeout(() => {
        if (dead || dial.dataset.big !== '1' || scrollY > 4 || active) return;
        const y0 = scrollY;
        const stop = () => stopSweep();
        const onScroll = () => { if (Math.abs(scrollY - y0) > 2) stopSweep(); };
        const evs = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
        evs.forEach((ev) => addEventListener(ev, stop, { passive: true }));
        addEventListener('scroll', onScroll, { passive: true });
        dial.addEventListener('pointerenter', stop);
        sweep = { timers: [], off: () => { evs.forEach((ev) => removeEventListener(ev, stop)); removeEventListener('scroll', onScroll); dial.removeEventListener('pointerenter', stop); } };
        picks.forEach((p, k) => sweep.timers.push(setTimeout(() => peek(p, false), k * 380)));
        sweep.timers.push(setTimeout(stopSweep, picks.length * 380));
      }, wait);
    }, () => { early.forEach((ev) => removeEventListener(ev, kill)); });
  }

  /* going to a photograph, from the dial */
  let peakST = null, railTween = null, railST = null;
  function goTo(p) {
    const pi = G.peak.indexOf(p);
    if (pi >= 0 && peakST) {
      const y = peakST.start + (G.peak.length > 1 ? pi / (G.peak.length - 1) : 0) * (peakST.end - peakST.start);
      D3.scrollTo(Math.round(y) + 2, { duration: 1.4 });
      return;
    }
    const f = figs.get(p.id);
    if (!f) return;
    if (G.midday.includes(p) && railST && railTween) {
      const track = $('#midday');
      const max = track.scrollWidth - innerWidth;
      const x = Math.min(max, Math.max(0, f.offsetLeft - (innerWidth - f.offsetWidth) / 2));
      D3.scrollTo(Math.round(railST.start + (max > 0 ? x / max : 0) * (railST.end - railST.start)) + 2, { duration: 1.4 });
      return;
    }
    if (G.midday.includes(p)) {   // the phone's rail scrolls sideways by itself
      const rail = $('#midday-rail');
      D3.scrollTo(rail, { offset: -innerHeight * 0.2, duration: 1.2 });
      rail.scrollTo({ left: f.offsetLeft - (rail.clientWidth - f.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
      return;
    }
    D3.scrollTo(f, { offset: -Math.max(80, (innerHeight - f.offsetHeight) / 2), duration: 1.4 });
  }
  function nearest(m) {
    let best = null, bd = 1e9;
    order.forEach((p) => { const d = Math.abs(((p.min - m + 2160) % 1440) - 720); if (d < bd) { bd = d; best = p; } });
    return best;
  }
  function dialEvents() {
    const tip = $('#dial-tip');
    let dragging = false, moved = false, pick = null;
    const minuteAt = (e) => {
      const r = dial.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
      const a = Math.atan2(y, x) - Math.PI / 2;
      return (((a / (Math.PI * 2)) * 1440) % 1440 + 1440) % 1440;
    };
    const fine = matchMedia('(hover: hover) and (pointer: fine)');
    const isBig = () => dial.dataset.big === '1';
    const preview = (p) => {
      pick = p;
      if (isBig()) { peek(p, true); return; }   // the large dial previews in its own face and lens
      tip.textContent = `${p.time}  ${L(p.place)}`;
      tip.classList.add('is-on');
      aim(p.min);
      dial.querySelectorAll('.dial__shot').forEach((c) => c.setAttribute('r', c.dataset.id === p.id ? '3' : (c.classList.contains('is-on') ? '2.8' : '1.5')));
    };
    dial.addEventListener('pointerdown', (e) => {
      stopSweep();
      dragging = true; moved = false;
      dial.setPointerCapture(e.pointerId);
      preview(nearest(minuteAt(e)));
      if (D3.lenis) D3.lenis.stop();
    });
    dial.addEventListener('pointermove', (e) => {
      if (dragging) { moved = true; preview(nearest(minuteAt(e))); return; }
      if (e.pointerType !== 'mouse') return;
      if (isBig()) {   // hovering the large dial previews the photograph nearest the pointer's angle
        if (!fine.matches) return;
        stopSweep();
        peek(nearest(minuteAt(e)), true);
        return;
      }
      const c = e.target.closest('.dial__shot');
      if (c) { const p = D3.byId[c.dataset.id]; tip.textContent = `${p.time}  ${L(p.place)}`; tip.classList.add('is-on'); }
      else tip.classList.remove('is-on');
    });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      tip.classList.remove('is-on');
      if (D3.lenis) D3.lenis.start();
      // a frame later: on touch, the touchend that follows pointerup makes Lenis drop a scroll started now
      if (pick) { const p = pick; pick = null; requestAnimationFrame(() => goTo(p)); }
    };
    dial.addEventListener('pointerup', end);
    // the browser took the gesture over (a swipe to scroll the page): drop the preview, go nowhere
    dial.addEventListener('pointercancel', () => {
      if (!dragging) return;
      dragging = false; pick = null;
      tip.classList.remove('is-on');
      if (D3.lenis) D3.lenis.start();
      dial.querySelectorAll('.dial__shot').forEach((c) => c.setAttribute('r', c.classList.contains('is-on') ? '2.8' : '1.5'));
      unpeek();
    });
    dial.addEventListener('pointerleave', () => {
      if (dragging) return;
      tip.classList.remove('is-on');
      if (isBig()) unpeek();
    });
    dial.addEventListener('keydown', (e) => {
      stopSweep();
      const i = active ? order.indexOf(active) : -1;
      let n = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') n = order[Math.min(order.length - 1, i + 1)];
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') n = order[Math.max(0, i - 1)];
      if (e.key === 'Home') n = order[0];
      if (e.key === 'End') n = order[order.length - 1];
      if (n) { e.preventDefault(); setActive(n); goTo(n); }
    });
  }

  /* ------------------------------------------------ scroll */
  let peakIndex = -1;
  function peakWhere(p) {
    $('#peak-where').innerHTML = `${esc(L(p.place))}<span class="mono">${p.time}  ${esc(L(p.where))}</span>`;
  }
  function motion() {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();

    /* the ground follows the sky, act by act */
    document.querySelectorAll('[data-act]').forEach((sec) => {
      const name = sec.dataset.act;
      if (name === 'peak') return;
      ScrollTrigger.create({ trigger: sec, start: 'top 55%', end: 'bottom 55%', onEnter: () => sky(name), onEnterBack: () => sky(name) });
    });
    ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: 'bottom 40%', onEnterBack: () => setActive(null) });

    /* the dial leaves the hero and docks in the corner */
    const slot = $('.hero__slot');
    const rest = () => ({ x: dial.offsetLeft, y: dial.offsetTop, w: dial.offsetWidth, h: dial.offsetHeight });
    const big = () => {
      const r = rest(), s = slot.getBoundingClientRect();
      const top = s.top + scrollY;
      return { x: s.left + s.width - (r.x + r.w), y: top + s.height - (r.y + r.h), scale: s.width / r.w };
    };
    gsap.fromTo(dial, { x: () => big().x, y: () => big().y, scale: () => big().scale },
      { x: 0, y: 0, scale: 1, ease: 'power1.inOut', immediateRender: true,
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 62%', scrub: reduce ? true : 0.6, invalidateOnRefresh: true,
          onUpdate: (self) => {
            const v = self.progress < 0.7 ? '1' : '0';
            if (dial.dataset.big === v) return;
            dial.dataset.big = v;
            if (v === '0') { stopSweep(); unpeek(); }   // the lens and the place line belong to the large dial only
          } } });
    dial.dataset.big = '1';

    /* every ordinary photograph sets the dial while it holds the middle of the screen,
       except inside the pinned peak, which sets the dial itself: a jump can toggle a figure (or a midday rail figure, a
       tick later) after the peak's update. The pin's own state counts (it can enter early, by anticipatePin), and so
       does the scroll position, in case a figure is updated before the pin in the same tick */
    const inPeak = () => { if (!peakST) return false; if (peakST.isActive) return true; const s = peakST.scroll(); return s > peakST.start && s < peakST.end; };
    const figST = [];
    figs.forEach((f, id) => {
      if (G.midday.some((p) => p.id === id)) return;
      figST.push(ScrollTrigger.create({ trigger: f, start: 'top 62%', end: 'bottom 38%', onToggle: (self) => { if (self.isActive && !inPeak()) setActive(D3.byId[id]); } }));
    });
    /* leaving the peak, the figure that holds the middle of the screen takes the dial back (scrolling up, the figures
       above can be updated before the pin lets go, so they were ignored); checked once every trigger has updated */
    const handBack = () => requestAnimationFrame(() => {
      if (inPeak()) return;
      const mid = innerHeight / 2;
      let best = null, bd = 1e9;
      figST.forEach((s) => { if (!s.isActive) return; const r = s.trigger.getBoundingClientRect(); const d = Math.abs(r.top + r.height / 2 - mid); if (d < bd) { bd = d; best = s.trigger; } });
      if (best) setActive(D3.byId[best.dataset.id]);
    });

    /* first light: the frame opens */
    const fph = $('#first-ph .ph');
    if (fph) {
      gsap.fromTo(fph, { clipPath: 'inset(22% 18% 22% 18%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none',
        scrollTrigger: { trigger: fph, start: 'top 95%', end: 'center 50%', scrub: true } });
      gsap.fromTo(fph.querySelector('img'), { scale: 1.28 }, { scale: 1, ease: 'none',
        scrollTrigger: { trigger: fph, start: 'top 95%', end: 'bottom 40%', scrub: true } });
      gsap.fromTo('#first-time', { xPercent: -18, opacity: 0 }, { xPercent: 0, opacity: 1, ease: 'none',
        scrollTrigger: { trigger: fph, start: 'top 70%', end: 'center 50%', scrub: true } });
    }

    mm.add('(min-width: 52.01rem)', () => {
      /* morning: the collage moves at different speeds */
      [...$('#morning').children].forEach((f, i) => {
        const v = [70, -50, 30, -80, 50, -30][i % 6];
        gsap.fromTo(f, { y: v }, { y: -v, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
      /* midday: the rail travels sideways while the page holds */
      const track = $('#midday');
      const dist = () => Math.max(0, track.scrollWidth - innerWidth);
      railTween = gsap.to(track, { x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: '#midday-rail', start: 'center center', end: () => `+=${dist()}`, pin: '#midday-rail', scrub: reduce ? true : 0.5, invalidateOnRefresh: true, anticipatePin: 1, refreshPriority: 3 } });
      railST = railTween.scrollTrigger;
      [...track.children].forEach((f) => {
        ScrollTrigger.create({ trigger: f, containerAnimation: railTween, start: 'left 60%', end: 'right 40%',
          onToggle: (self) => { if (self.isActive && !inPeak()) setActive(D3.byId[f.dataset.id]); } });
      });
      return () => { railTween = null; railST = null; };
    });
    mm.add('(max-width: 52rem)', () => {
      const rail = $('#midday-rail');
      let st = null;
      const pickCentre = () => {
        if (!st || !st.isActive || inPeak()) return;
        const mid = rail.scrollLeft + rail.clientWidth / 2;
        let best = null, bd = 1e9;
        [...$('#midday').children].forEach((f) => { const d = Math.abs(f.offsetLeft + f.offsetWidth / 2 - mid); if (d < bd) { bd = d; best = f; } });
        if (best) setActive(D3.byId[best.dataset.id]);
      };
      rail.addEventListener('scroll', pickCentre, { passive: true });
      st = ScrollTrigger.create({ trigger: rail, start: 'top 62%', end: 'bottom 38%', onToggle: (self) => { if (self.isActive) pickCentre(); } });
      return () => { rail.removeEventListener('scroll', pickCentre); st.kill(); };
    });

    /* golden hour, then blue: the peak holds while the sun goes down through ten places */
    const n = G.peak.length;
    if (n) {
      const phs = [...document.querySelectorAll('.peak__ph')];
      const sec = $('[data-act="peak"]');
      const lerpColor = gsap.utils.interpolate(PEAK_GROUND);
      /* the peak always puts its own photograph on the dial, whatever a passing figure set in the same tick */
      const assert = () => { const p = G.peak[Math.max(0, peakIndex)]; peakWhere(p); setActive(p); };
      const show = (pr) => {
        const f = pr * (n - 1);
        // each place wipes in over the last, from the side the sun sets on
        const rev = phs.map((el, k) => (k === 0 ? 1 : Math.max(0, Math.min(1, (f - (k - 0.42)) / 0.42))));
        phs.forEach((el, k) => {
          const p = rev[k];
          const covered = k < n - 1 && rev[k + 1] >= 1;
          el.style.visibility = p > 0 && !covered ? 'visible' : 'hidden';
          el.style.opacity = '1';
          el.style.clipPath = `inset(0 0 0 ${((1 - p) * 100).toFixed(2)}%)`;
          el.querySelector('img').style.transform = `scale(${(1 + (1 - p) * 0.08).toFixed(4)})`;
        });
        const a = Math.floor(f), b = Math.min(n - 1, a + 1), w = f - a;
        const s = G.peak[a].sun + (G.peak[b].sun - G.peak[a].sun) * w;
        $('#peak-sun').textContent = deg(s);
        $('#peak-bar').style.transform = `scaleX(${pr.toFixed(4)})`;
        let i = 0;
        rev.forEach((v, k) => { if (v >= 0.5) i = k; });
        // leaving the pin (progress 0 or 1), the figures outside it set the dial, not the peak
        if (i !== peakIndex) { peakIndex = i; peakWhere(G.peak[i]); if (peakST && peakST.isActive) setActive(G.peak[i]); }
        const g = lerpColor(pr);
        gsap.killTweensOf(root, '--g');
        root.style.setProperty('--g', g);
        meta.content = g;
        ink(pr > 0.56 ? DARK : LIGHT, 0.4);
      };
      peakST = ScrollTrigger.create({ trigger: sec, start: 'top top', end: () => `+=${Math.round(innerHeight * 0.85 * n)}`, pin: true, scrub: true, anticipatePin: 1, refreshPriority: 2,
        onUpdate: (self) => show(self.progress),
        onEnter: (self) => { gsap.killTweensOf(root, '--g'); show(self.progress); assert(); },
        onEnterBack: (self) => { gsap.killTweensOf(root, '--g'); show(self.progress); assert(); },
        onLeave: handBack, onLeaveBack: handBack });
      sec.querySelector('.peak__head').append(peakSay);
    }

    /* night: each exposure develops as it comes up the screen */
    document.querySelectorAll('#night .ph').forEach((ph) => {
      gsap.fromTo(ph, { '--dark': 0.9 }, { '--dark': 0, ease: 'none', scrollTrigger: { trigger: ph, start: 'top 98%', end: 'center 52%', scrub: true } });
    });

    /* the opening: the title rises, the dial fills with every photograph */
    if (!reduce) {
      gsap.from('.hero h1 .line-mask > span', { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.09, delay: 0.15 });
      gsap.from(['.hero .cap', '#hero-lede', '.hero__hint'], { opacity: 0, y: 14, duration: 1, ease: 'power3.out', stagger: 0.08, delay: 0.5 });
      // fromTo, not from: the dots' CSS opacity transition made a staggered from() read 0 as the end value, so they never appeared
      gsap.fromTo('#dial-shots circle', { opacity: 0, attr: { r: 0 } }, { opacity: 0.85, attr: { r: 1.5 }, clearProps: 'opacity', duration: 0.5, ease: 'power2.out', stagger: 0.012, delay: 0.4,
        onComplete: () => { const c = dial.querySelector('.dial__shot.is-on'); if (c) c.setAttribute('r', '2.8'); } });
      gsap.from('#dial-ticks > *', { opacity: 0, duration: 0.8, stagger: 0.015, delay: 0.2 });
      cur = 0; draw(); aim(300);
      arrival();
    }
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
    addEventListener('load', () => ScrollTrigger.refresh());
  }

  build();
  buildDial();
  draw();   // the hand starts at 05:00 even when nothing animates it
  dialEvents();
  D3.apply();
  words();
  onLang(words);
  sky('hero', 0);
  motion();
  D3.entrances();
})();

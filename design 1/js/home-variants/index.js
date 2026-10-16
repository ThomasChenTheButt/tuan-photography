/* Experiment home-variations: his stars and notes for each variation, kept in this browser.
   Stars are 1 to 5 and each variation is rated on its own (two can both have five); Clear takes
   them away. A variation he has opened is marked Seen. "Most stars first" puts the starred ones
   first; "Copy everything" puts the stars and notes on the clipboard as plain text, ready to
   paste into the chat. */
(() => {
  const KEY = 'home-variants-notes';
  const list = document.querySelector('.vx');
  if (!list) return;
  const rows = [...list.querySelectorAll('.vx__row')];
  const word = k => (window.pageI18n?.[document.documentElement.lang === 'zh-Hant' ? 'zh' : 'en'] || {})[k] || k;
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  let mine = read();
  const state = document.getElementById('vx-state');
  let quiet;
  const say = k => { state.textContent = word(k); clearTimeout(quiet); quiet = setTimeout(() => { state.textContent = ''; }, 1800); };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(mine)); say('ixSaved'); } catch (e) { /* private window */ } };
  const of = n => (mine[n] ||= {});

  const draw = () => {
    rows.forEach(li => {
      const n = li.dataset.n, m = mine[n] || {}, s = +m.stars || 0;
      li.querySelectorAll('input[type="radio"]').forEach(r => { r.checked = +r.value === s; });
      li.querySelector('.vx__stars').dataset.stars = s;
      li.querySelector('.vx__clear').hidden = !s;
      const ta = li.querySelector('textarea');
      if (document.activeElement !== ta) ta.value = m.note || '';
      ta.placeholder = word('ixNoteHint');
      li.querySelector('.vx__seen').hidden = !m.seen;
    });
  };

  list.addEventListener('change', e => {
    const r = e.target.closest('input[type="radio"]');
    if (!r) return;
    of(r.dataset.n).stars = +r.value;
    save(); draw(); if (sorted) order();
  });
  list.addEventListener('input', e => {
    const ta = e.target.closest('textarea');
    if (!ta) return;
    of(ta.dataset.n).note = ta.value;
    save();
  });
  list.addEventListener('click', e => {
    const c = e.target.closest('.vx__clear');
    if (c) { of(c.dataset.n).stars = 0; save(); draw(); if (sorted) order(); c.closest('.vx__rate').querySelector('input').focus(); return; }
    const a = e.target.closest('.vx__name');
    if (a) { of(a.closest('.vx__row').dataset.n).seen = true; save(); }
  });

  // most stars first; equal stars, and the unstarred, keep their own order
  let sorted = false;
  const sortBtn = document.getElementById('vx-sort');
  const key = li => (sorted ? -(+mine[li.dataset.n]?.stars || 0) * 100 : 0) + +li.dataset.n;
  const order = () => [...rows].sort((a, b) => key(a) - key(b)).forEach(li => list.append(li));
  const sortWord = () => { sortBtn.dataset.i18n = sorted ? 'ixUnsort' : 'ixSort'; sortBtn.textContent = word(sortBtn.dataset.i18n); sortBtn.setAttribute('aria-pressed', sorted); };
  sortBtn.addEventListener('click', () => { sorted = !sorted; order(); sortWord(); });

  // copy: one line per variation, most stars first, with the note under it
  document.getElementById('vx-copy').addEventListener('click', async () => {
    const lines = [...rows]
      .map(li => ({ n: +li.dataset.n, name: li.querySelector('.vx__name b').textContent, m: mine[li.dataset.n] || {} }))
      .sort((a, b) => ((+b.m.stars || 0) - (+a.m.stars || 0)) || a.n - b.n)
      .map(x => `v${String(x.n).padStart(2, '0')} ${x.name}: ${x.m.stars ? x.m.stars + '/5' : '-'}${x.m.note ? '\n    ' + x.m.note.replace(/\n/g, '\n    ') : ''}`);
    try { await navigator.clipboard.writeText(lines.join('\n')); say('ixCopied'); } catch (e) { /* no clipboard */ }
  });

  // coming back to the list from a variation (or another tab) shows the latest
  window.addEventListener('pageshow', () => { mine = read(); draw(); });
  window.addEventListener('storage', e => { if (e.key === KEY) { mine = read(); draw(); } });
  document.addEventListener('langchange', () => { draw(); sortWord(); });
  draw();
})();

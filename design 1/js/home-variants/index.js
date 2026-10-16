/* Experiment home-variations: his rank and notes for each variation, kept in this browser.
   One rank per variation and each rank used once: giving a rank another variation holds takes
   it from that one. A variation he has opened is marked Seen. "Sort by my ranking" puts the
   ranked ones first, best first; "Copy everything" puts the ranking and notes on the clipboard
   as plain text, ready to paste into the chat. */
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
      const n = li.dataset.n, m = mine[n] || {};
      li.querySelector('select').value = m.rank || '';
      const ta = li.querySelector('textarea');
      if (document.activeElement !== ta) ta.value = m.note || '';
      ta.placeholder = word('ixNoteHint');
      li.querySelector('.vx__seen').hidden = !m.seen;
      li.classList.toggle('is-ranked', !!m.rank);
    });
  };

  list.addEventListener('change', e => {
    const sel = e.target.closest('select');
    if (!sel) return;
    const n = sel.dataset.n, r = sel.value;
    if (r) Object.keys(mine).forEach(k => { if (k !== n && mine[k].rank === r) mine[k].rank = ''; });
    of(n).rank = r;
    save(); draw(); if (sorted) order();
  });
  list.addEventListener('input', e => {
    const ta = e.target.closest('textarea');
    if (!ta) return;
    of(ta.dataset.n).note = ta.value;
    save();
  });
  list.addEventListener('click', e => {
    const a = e.target.closest('.vx__name');
    if (a) { of(a.closest('.vx__row').dataset.n).seen = true; save(); }
  });

  // sort: ranked first, best first, then the rest in their own order
  let sorted = false;
  const sortBtn = document.getElementById('vx-sort');
  const order = () => {
    const by = li => { const r = +(mine[li.dataset.n]?.rank || 0); return sorted && r ? r : 100 + +li.dataset.n; };
    [...rows].sort((a, b) => by(a) - by(b)).forEach(li => list.append(li));
  };
  const sortWord = () => { sortBtn.dataset.i18n = sorted ? 'ixUnsort' : 'ixSort'; sortBtn.textContent = word(sortBtn.dataset.i18n); sortBtn.setAttribute('aria-pressed', sorted); };
  sortBtn.addEventListener('click', () => { sorted = !sorted; order(); sortWord(); });

  // copy: one line per variation, ranked first, with the note under it
  document.getElementById('vx-copy').addEventListener('click', async () => {
    const lines = [...rows]
      .map(li => ({ n: +li.dataset.n, name: li.querySelector('.vx__name b').textContent, m: mine[li.dataset.n] || {} }))
      .sort((a, b) => (+a.m.rank || 100 + a.n) - (+b.m.rank || 100 + b.n))
      .map(x => `${x.m.rank ? '#' + x.m.rank : '-'}  v${String(x.n).padStart(2, '0')} ${x.name}${x.m.note ? '\n    ' + x.m.note.replace(/\n/g, '\n    ') : ''}`);
    try { await navigator.clipboard.writeText(lines.join('\n')); say('ixCopied'); } catch (e) { /* no clipboard */ }
  });

  // coming back to the list from a variation (or another tab) shows the latest
  window.addEventListener('pageshow', () => { mine = read(); draw(); });
  window.addEventListener('storage', e => { if (e.key === KEY) { mine = read(); draw(); } });
  document.addEventListener('langchange', () => { draw(); sortWord(); });
  draw();
})();

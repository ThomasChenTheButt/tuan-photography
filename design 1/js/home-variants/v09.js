/* Variation 09, "The fold": the word beneath a sheet unfolds its lower half and folds it back.
   While folded, the lower half cannot be reached by the keyboard (it is inert). The word reads
   "Unfold" or "Fold" in the page's language; the language switch rewrites it from data-i18n. */
(() => {
  const say = key => {
    const lang = document.documentElement.lang === 'zh-Hant' ? 'zh' : 'en';
    return (window.pageI18n?.[lang] || {})[key];
  };

  document.querySelectorAll('.fold__btn').forEach(btn => {
    const sheet = btn.closest('.fold');
    const panel = document.getElementById(btn.getAttribute('aria-controls'));
    if (!sheet || !panel) return;
    panel.inert = true;

    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      sheet.classList.toggle('is-open', open);
      panel.inert = !open;
      btn.dataset.i18n = open ? 'v9Fold' : 'v9Unfold';
      const word = say(btn.dataset.i18n);
      if (word) btn.textContent = word;
    });
  });
})();

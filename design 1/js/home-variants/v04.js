/* Variation 04, "The back of the print": the word beneath a print turns it over and back.
   Only the face that can be seen can be reached: the other is made inert, so the keyboard
   never lands on a link that is facing the table. */
(() => {
  let returnTo = null;

  document.querySelectorAll('.print__turn').forEach(btn => {
    const print = document.getElementById(btn.getAttribute('aria-controls'));
    if (!print) return;
    const front = print.querySelector('.print__front');
    const back = print.querySelector('.print__back');
    back.inert = true;

    btn.addEventListener('click', () => {
      const turned = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', String(turned));
      print.classList.toggle('is-turned', turned);
      front.inert = turned;
      back.inert = !turned;
    });

    /* "How this was made" on the back opens the viewer; on closing, the site's viewer returns
       focus to the photograph, which faces the table while the print is turned, so it is
       returned here instead */
    back.querySelector('a[data-slide]')?.addEventListener('click', e => { returnTo = e.currentTarget; });
  });

  document.addEventListener('close', e => {
    if (!returnTo || !(e.target instanceof HTMLDialogElement)) return;
    const link = returnTo;
    returnTo = null;
    requestAnimationFrame(() => link.focus({ preventScroll: true }));
  }, true);
})();

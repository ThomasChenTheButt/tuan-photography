/* Variation S1 of the scroll-craft Journey (Impeccable round, 2026-10-18): one print per trip.
   Each trip shows one photograph at the width of the reading column, its name beneath, and one
   word for the rest; the strip of stamps goes. Everything else is journey.js. */
window.JourneyVariant = {
  words: {
    en: { more: (n) => (n === 1 ? 'and 1 more photograph' : `and ${n} more photographs`) },
    zh: { more: (n) => `還有 ${n} 張照片` },
  },
  shots(t, { print }) {
    if (!t.photos.length) return '';
    const lang = window.Kit.lang;
    const lead = t.lead || t.photos[0];
    const next = t.photos.find((id) => id !== lead);
    const rest = t.photos.length - 1;
    return `<div class="jr-lead" data-set="${t.photos.join(',')}">
      ${print(lead, '(max-width: 63.99rem) 92vw, 36vw')}
      ${rest ? `<button type="button" class="jr-shot jr-lead__more word" data-shot="${next}">${this.words[lang].more(rest)}</button>` : ''}
    </div>`;
  },
};

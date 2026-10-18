/* Variation S2 of the scroll-craft Journey (Impeccable round, 2026-10-18): every photograph.
   Each trip lays out all of its photographs in rows at their own shapes, names beneath, like a
   contact sheet; the reading goes at the pace of the pictures. Everything else is journey.js. */
window.JourneyVariant = {
  shots(t, { print }) {
    if (!t.photos.length) return '';
    return `<div class="jr-sheet" data-set="${t.photos.join(',')}">${t.photos.map((id) => print(id, '(max-width: 63.99rem) 46vw, 18vw')).join('')}</div>`;
  },
};

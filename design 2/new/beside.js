/* Variation S3 of the scroll-craft Journey (Impeccable round, 2026-10-18): the print beside the
   map. Once the map has docked it gives up the lower half of its column to one photograph, the
   trip being read, which changes as the reading moves on; the right column is words only. On the
   phone the photograph sits in the entry instead. Everything else is journey.js. */
window.JourneyVariant = {
  shots(t, { print }) {
    if (!t.photos.length) return '';
    return `<div class="jr-lead jr-lead--phone" data-set="${t.photos.join(',')}">${print(t.lead || t.photos[0], '92vw')}</div>`;
  },
  map() {
    return `<div class="jr-beside">
      <div class="jr-beside__frame"><img class="jr-beside__img" alt=""><img class="jr-beside__img" alt=""></div>
      <p class="jr-beside__cap"><span class="jr-beside__name"></span><span class="jr-beside__where"></span></p>
    </div>`;
  },
  // the trip at the reading line is the one whose print shows
  follow(line) {
    if (!matchMedia('(min-width: 64rem)').matches) return;
    const K = window.Kit;
    let cur = null;
    for (const el of document.querySelectorAll('.jr-trip')) if (el.getBoundingClientRect().top < line + 40) cur = el;
    const id = cur && cur.dataset.trip;
    const t = id && K.byId(id);
    const photo = t && (t.lead || t.photos[0]);
    if (photo === this.shown) return;
    this.shown = photo;
    const box = document.querySelector('.jr-beside');
    box.classList.toggle('has-print', !!photo);
    if (!photo) return;
    const s = K.S.slides[photo];
    const imgs = box.querySelectorAll('.jr-beside__img');
    this.turn = (this.turn || 0) ^ 1;
    const im = imgs[this.turn], old = imgs[this.turn ^ 1];
    im.srcset = `${K.src(s.file, 640)} 640w, ${K.src(s.file, 1280)} 1280w, ${K.src(s.file)} 2400w`;
    im.sizes = '48vw';
    im.src = K.src(s.file, 1280);
    const show = () => { im.classList.add('is-on'); old.classList.remove('is-on'); };
    if (im.complete) show(); else im.onload = show;
    box.querySelector('.jr-beside__name').textContent = s.place[K.lang];
    box.querySelector('.jr-beside__where').textContent = s.where[K.lang];
  },
};

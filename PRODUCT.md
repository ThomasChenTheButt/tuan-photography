# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

People who respond to landscape photographs and, often, carry a camera themselves. English
readers and 繁體中文 readers are **equally important** (owner, 2026-09-27); neither language is a
translation afterthought.

Two situations, in this order:

1. **Meeting the work.** Someone arrives and sees the photographs. They do not know the author
   yet. This is where the site has to earn attention.
2. **Planning to shoot it.** A photograph made them want to stand in the same place. They open
   its guide at home before the trip, on a laptop or tablet, reading slowly and building a day
   plan and a shot list.

## Product Purpose

tuan photography 陳亮元 is Thomas Chen's **personal brand as a landscape photographer**. It is
not a business and does not seek commissions.

The work comes first. A visitor sees a photograph, remembers who made it, and wants to make
one like it; **only then** do they look for the guide. The guides publish his trip research:
photo spots (exact pin or general area, decided per spot), timing, day-by-day routes, gear and
practical notes.

Success means two actions, both wanted: the visitor **follows him on Instagram**, and the
visitor **opens the guide** behind a photograph they want to shoot.

## Positioning

A landscape photographer of **places travelled**: natural landscapes and cities both count, as
long as the frame is about the place, its scale and its light.

What a neighbouring photographer's site could not claim: every photograph leads to the exact
account of how it was made. Every spot in a guide was walked and photographed by the author,
every photograph on the site is his own, and a guide states where the photo was taken and when
to stand there.

## Operating Context

- The author researches each trip in Google Drive documents before travelling: itinerary
  tables, spot tables with map links, food tables, gear lists, sunset times. Guides are written
  from those documents after the trip.
- 16 countries travelled so far; Taiwan is home base.
- Site sections: Destinations 目的地 · Gallery 作品集 · Blog 網誌 · Skills 攝影技巧 · About 關於我.
  Destinations drills down: 7 continents → country pages → guides.

## Capabilities and Constraints

- Plain static HTML, CSS and JavaScript. No framework. The pages are written out by
  `tools/build.py` from `data/site.json` and `content/`; nothing runs on a server.
- Bilingual switch on every page. Shared strings live in `js/main.js` (`i18n.en` / `i18n.zh`),
  per-page strings in a `window.pageI18n` block. Every user-facing string exists in both
  languages.
- Titles are plain place names ("Barcelona"). Descriptive detail goes in the small meta line.
- One finished guide exists: Barcelona (`posts/barcelona.html`), with 11 photo spots and a
  day-by-day route.
- 15 of the 16 country pages have no content yet and **stay empty shells** (owner, 2026-09-27).
- The photo library will grow. The owner adds photographs later by dropping files into the
  images folder; layouts must accept more work without being rebuilt.
- The site is not public; GitHub Pages is off by the owner's choice.
- The owner is not a developer. He reviews in the browser and decides; all technical work is
  done for him.
- Instagram account: `tuan_1127` (https://www.instagram.com/tuan_1127/), given by the owner
  2026-09-27.
- The continent → country → guide hierarchy is fixed. Everything else, including the main
  menu, may be redesigned (owner, 2026-09-27).
- Undecided: which country gets the next guide; whether the newsletter sign-up is wanted; the
  About page's real story (current text is placeholder).

## Brand Commitments

- Name: **tuan photography 陳亮元**. Line: "Travel like a photographer".
- Identity: landscape photographer. Not a travel blogger, not a studio for hire.
- Voice: first person, plain, factual. What he did and saw.
- The visual direction is **pinned by the owner** (2026-09-28). He supplied 13 reference sites
  and chose **Along Dusty Roads** and **The Common Wanderer** as the template, on a **warm
  light ground**, for the **whole site**. Their craft level is the bar. Earlier, on 2026-09-27,
  he had given full freedom on the look; two builds made under that freedom (Light Table, then
  a dark exhibition hang) were set aside and are kept at git tags `light-table-v1` and
  `exhibition-hang-v2`.
- Nothing is written across the opening photograph. On his original site he asked for the
  words over the hero to be reduced because they blocked the image.

## Evidence on Hand

- 8 photographs by the author, web-sized, in `images/web/`: 7 from Barcelona (city and
  architecture), 1 from New Zealand (Aoraki / Mount Cook through a car window). The owner chose
  to start with these 8 and add more later.
- Real camera data embedded in each photo file: body (Canon EOS R6 Mark II), lens, focal
  length, aperture, shutter speed, ISO. These may be shown. The capture clock time is **not**
  reliable (the camera clock's time zone is unknown) and is not shown.
- The Barcelona guide's full text, spot list, route, comparison tables and practical notes, in
  both languages.
- Not available, and not to be fabricated: a portrait of the author, his real biography,
  reader testimonials, follower counts, guides for any place other than Barcelona. The old site's placeholder guide cards and
  placeholder images were removed from this build.

## Product Principles

1. The photograph is the entrance; the guide is what it leads to.
2. Every photograph can answer "how was this made?"
3. Only what he walked, shot and verified. No borrowed photos, no invented facts.
4. Both languages are first-class. Nothing ships in one language only.
5. Names stay plain. A place is called by its name.

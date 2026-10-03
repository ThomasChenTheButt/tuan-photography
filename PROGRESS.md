# tuan photography 陳亮元 — Project Memo 專案備忘錄

*Last updated: 2026-10-03 — handoff note. Read this first, then check the files to confirm.*

## 現在狀態 Where things stand

- **Two sites, one set of facts.** `design 1/` is the current site ("The Printed Travel Journal",
  localhost:8642). `design 2/` is the redesign, **Pen and wash** (`design 2/wc-sketch/`,
  localhost:8645 opens it directly). Both are built from `data/site.json`, `content/` and the same
  photographs. `start.command` starts both. The 18 other design-2 versions were removed on
  2026-10-03; they are at the tag `design2-all-versions-2026-10-03`.
- **Design 2 is a full-screen sketchbook map:** all 20 books (his places; the USA as New York,
  Boston, Washington D.C., San Francisco, Los Angeles), the plate's slow zoom into a place, the
  place name rising large, a full-frame photo dissolve, a cover gallery (swipe sideways, scroll
  down for the guide), and a Flights view (small globe bottom-left) that replays his real journeys
  leg by leg with a plane, railway sleepers and dashed roads, speeds Slow / 0.5× / 1× / 1.5× / 2×.
  Its own design system is `design 2/wc-sketch/DESIGN.md`. It passed the Impeccable finish review
  (ship) on 2026-10-02 after two fix rounds.
- **93 photographs, 21 countries.** 25 US photographs were added on 2026-10-03 (New York 8,
  San Francisco 7, Los Angeles 4, Washington 6), each tagged with its city. 22 of them have no
  camera data (exported from Photoshop); the site shows them without it, nothing invented.
- **Journeys** (`journeys` in `data/site.json`) come from his Drive trip documents plus his own
  corrections: 16 journeys, newest first, every leg's mode and places; Chinese city names.
- **Opening (default since 2026-10-03):** a 3 s glide through a corridor of 150 prints of his
  photographs into the globe, which turns under "Tuan, Through the Lens" / Tuan 的鏡頭之旅 (his
  choice), unrolls into the map while the title glides to the centre, every flight draws across
  the map, then all fades. Once a session. `?opening=corridor` replays it; `?opening` plays the
  globe-only version.
- **The map stands taller (his call, 2026-10-03):** the plate is stretched upright 1.25× (`SY`
  in `app.js`) so at Whole map Greenland touches the top and Antarctica the foot on a desktop
  window. Every latitude-to-pixel step in `app.js`, `paint.js` and `globe.js` carries the factor.
- **Bottom right is now only:** the tally, Whole map, and the Photo dial. Zoom in / Zoom out and
  the "Map: Natural Earth" credit went at his word (wheel, double click, pinch and +/- keys zoom).
- **Traffic:** a few of his flights are always in the air over the home map (up to four, out and
  home by turns), on their own canvas. Clicking a book turns the sea photograph into that
  place's cover, and it stays; hovering never changes it.
- **A tally by the zoom words:** "21 / 195 countries · 11% of the world", counted from the data
  (`WORLD_COUNTRIES = 195`, his figure, in `app.js`).
- **The photograph through the sea (default since 2026-10-03):** Aoraki lies under the whole
  window and shows wherever there is water, at strength 0.9 (coming up from nothing behind the corridor and the globe from the opening's first frame, full by the unroll; on a repeat visit without the opening, rising over 6 s), the
  real photo with no paper texture, as its own copy cut from his original to the view inside the car window
  (`design 1/images/web/new-zealand-aoraki-sea.jpg`, plus a 1280 copy; made by hand, not by the
  build). It fills above and below the map too, and the map sits on the window's bottom edge so
  Antarctica always covers the foot. `?ocean=all`
  cycles all 93 photographs, `?o=0.5` tries a strength, `?photos=none` turns it off. The dial
  bottom right stays on the page (his call), remembered per browser. Switches: `OPENING_DEFAULT`, `MAP_PHOTOS_DEFAULT` in `design 2/wc-sketch/app.js`.

## 上次做到哪 Where we left off

2026-10-03, a long day on design 2.

- He chose Pen and wash over four rounds of variants. Then: the flights globe replays his real
  journeys (data read from his Drive, confirmed by him), the plane, the speeds, the finale, the
  far side seen through the globe, the flatter trans-Pacific arcs; the opening with the title and
  the flights over the map; the USA split into city books; 21 countries with the five extra
  places kept as journeys only; upright photos on the books, wide ones on arrival; the Impeccable
  review and its fixes; the design system written.
- Then 25 US photographs went in with a Washington D.C. book; the corridor opening and the three
  map-photo trials were built; he liked the photograph through the sea at strength 0.9 and asked
  for it clean (no sketch texture) with Aoraki only for now.
- After compacting: the sea photograph now fills the whole window (no paper above or below the
  map), Aoraki is cropped inside the car window, Antarctica sits on the bottom edge, and he made
  the corridor opening and the sea photograph the defaults; the trial dial came off. He asked to
  keep only localhost:8645 running.

## 接下來 Next up

**Choose the sea's photographs.** Open `localhost:8645/?ocean=all` to see all 93 cycle through;
he names the ones to keep, and they go in `order` in `makeOcean` (`design 2/wc-sketch/app.js`),
each with a `CROP` if it has edges to hide. Check: `python3 tools/check_site.py`.

## 等你決定 Waiting on you

- **Sea photograph:** which photographs besides Aoraki, if any?
- **Camera data for the 22 US photographs:** re-export from Lightroom with metadata, or drop the
  raw files in, and I'll add it.
- **Boston** has a book but no photographs yet.
- **Reviewer's optional ideas, not done:** sketchbook touches on the guide and photo pages, bolder
  idle flights from Taipei, drawn covers for the books without photos.
- **Older items:** the second guide (Vietnam and Japan have the most photos); Barcelona's SIM row;
  newsletter sign-up; the old three Barcelona layouts; 紐西蘭暫緩.
- `tools/build_artifact2.py` and a change to `data/sizes.json` appeared from another session
  (an Artifact packer for design 2); left as they are, uncommitted.

## 如何接續 How to resume

Say **"continue the travel website"**. Double-click **`start.command`** to open both sites
(8642 design 1, 8645 design 2), or run `python3 tools/serve.py 8645 "design 2"` from the project
folder. He now works on 8645 only; design 1 is still there and still builds.

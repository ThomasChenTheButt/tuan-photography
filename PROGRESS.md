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
- **Opening:** the globe turns under "Tuan, Through the Lens" / Tuan 的鏡頭之旅 (his choice),
  unrolls into the map while the title glides to the centre, every flight draws across the map,
  then all fades. `?opening` replays it; `?opening=corridor` plays the trial below.
- **Three trials are built, all behind switches, none on by default yet** (`OPENING_DEFAULT`
  and `MAP_PHOTOS_DEFAULT` in `design 2/wc-sketch/app.js`):
  - `?opening=corridor`: the opening begins with a 3 s glide through a corridor of 150 prints of
    his photographs (all 93, repeated), dense like his reference, into the globe.
  - `?photos=ocean`: one full-window photograph seen only through the sea (his idea). Real photo,
    no paper texture over it, **strength 0.8 (his call)**, Aoraki only for now (`&ocean=all`
    cycles through all 93). A trial dial bottom right ("Photo", 5 to 100) sets the strength live
    and is remembered on the browser; it comes off once he settles. Loads the full-size copy on
    Retina screens.
  - `?photos=sea` (a print laid in the South Atlantic) and `?photos=land` (covers inside each
    country) were the first two tries; he preferred the ocean idea.

## 上次做到哪 Where we left off

2026-10-03, a long day on design 2.

- He chose Pen and wash over four rounds of variants. Then: the flights globe replays his real
  journeys (data read from his Drive, confirmed by him), the plane, the speeds, the finale, the
  far side seen through the globe, the flatter trans-Pacific arcs; the opening with the title and
  the flights over the map; the USA split into city books; 21 countries with the five extra
  places kept as journeys only; upright photos on the books, wide ones on arrival; the Impeccable
  review and its fixes; the design system written.
- Then 25 US photographs went in with a Washington D.C. book; the corridor opening and the three
  map-photo trials were built; he liked the photograph through the sea at strength 0.8 and asked
  for it clean (no sketch texture) with Aoraki only for now.
- He stopped to compact the chat and update the app.

## 接下來 Next up

**Decide the defaults, then tidy.** Open `localhost:8645/?photos=ocean` and
`localhost:8645/?opening=corridor`, judge them, then in `design 2/wc-sketch/app.js` set
`MAP_PHOTOS_DEFAULT` ('ocean' or 'none') and `OPENING_DEFAULT` ('corridor' or 'classic'); remove
the trial dial from `index.html` / `style.css` / `app.js` once the strength is settled; then pick
which photographs the sea should cycle through (`order` in `makeOcean`, `?ocean=all` to preview).
Rebuild: `python3 tools/build2.py`; check: `python3 tools/check_site.py`.

## 等你決定 Waiting on you

- **Sea photograph:** keep it on for every visitor? Which photographs besides Aoraki? Aoraki's
  car-window edges show a dark corner; a photo without that framing would sit cleaner.
- **Corridor opening:** make it the default, or keep the current opening?
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
folder.

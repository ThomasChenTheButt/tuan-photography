# tuan photography 陳亮元 — Project Memo 專案備忘錄

*Last updated: 2026-10-13 — handoff note. Read this first, then check the files to confirm.*

## 現在狀態 Where things stand

- **One site, one server (since 2026-10-13).** `design 1/` is the site ("The Printed Travel Journal",
  localhost:8642). `design 2/`, **Pen and wash** (`design 2/wc-sketch/`), is its Journey page:
  `design 1/journey` is a link to the design 2 folder, so `localhost:8642/journey/` opens it and
  the menu's Journey item points there. Port 8645 is gone. Both are built from `data/site.json`,
  `content/` and the same photographs. `start.command` starts the one server. The 18 other design-2 versions were removed on
  2026-10-03; they are at the tag `design2-all-versions-2026-10-03`.
- **Design 2 is a full-screen sketchbook map:** all 20 books (his places; the USA as New York,
  Boston, Washington D.C., San Francisco, Los Angeles), the plate's slow zoom into a place, the
  place name rising large, a full-frame photo dissolve, a cover gallery, and a Flights view (small
  globe bottom-left) that replays his real journeys leg by leg. Its own design system is
  `design 2/wc-sketch/DESIGN.md`. It passed the Impeccable finish review (ship) on 2026-10-02.
- **93 photographs, 21 countries.** 22 US photographs have no camera data (exported from
  Photoshop); the site shows them without it, nothing invented.
- **The map (the Journey page):** the plate stretched upright 1.25× (`SY`), Antarctica always on the bottom
  edge; the photograph through the sea (Aoraki, strength 0.9, the dial bottom right); a tally
  "21 / 195 countries · 11% of the world"; up to six of his flights always in the air; a photograph
  behind the Flights view. Clicking a book turns the sea photograph into that place's cover.
- **The Taste skill's five fixes are in design 2** (kept 2026-10-07): the phone's bottom-right row
  no longer wraps over the books, no word on the cover photograph, the place page no longer opens
  with "Guide not written yet", dates spoken as months, the Speed label in faded ink.
- **The opening of the Journey page:** the globe (`design 2/wc-sketch/opening/globe.js`, four looks via
  `?globe=1|2|3|4`, look 4 the photo ball in `photoball.js`). The corridor of prints and the shelf
  of books were dropped on 2026-10-04 at his word; they are at the tag
  `before-drop-openings-2026-10-04`. `?opening` replays the opening.

## 上次做到哪 Where we left off

2026-10-08: the home-page opening, three rounds of candidates, almost all cut.

- **Experiment `opening` (8648):** from 24 versions he kept three: aperture, contact sheet version 2,
  letters version 4. Film strip, burst, pull-back and every other version removed.
- **Experiment `opening-graph` (8649):** his agent graph (source finder, four scouts, variety check,
  scorecard router, builders, automatic test, manager, his approval). Run one built nine; he kept only
  the concept of `ridgeline` (lines draw the ridge, horizon and window frame on paper, then the paper
  becomes the photograph). Run two, with his review added before building, approved 26 ideas; he had
  one (shadows) built as a trial, cut it, then declined all 26 ("全部都不要"). Everything is recorded
  in `experiments/opening-graph/.graph/` (scorecard, excluded list now 60+ designs, taste file,
  ideas.md with the 26, sources.md, workflow.js).
- The pattern in `.graph/taste.md`: he cuts nearly every device applied to the photograph; what
  survives is the camera (aperture), his own work (contact sheet), his name (letters), the
  photograph's own lines (ridgeline).

## 接下來 Next up

**Ask him for his verdict on trial `destinations-map` (port 8651):** the map on Destinations, a
book's dive ending on the country page, Journey as the Flights list. On keep, merge
`exp/destinations-map`, remove the worktree and branch. Files: `experiments/destinations-map/`
(`tools/build.py` `build_destinations`/`cover_of`, `design 2/wc-sketch/app.js` `handOver`).
The two opening trials were dropped on 2026-10-15 at his word (tags `exp-opening-dropped-2026-10-15`,
`exp-opening-graph-dropped-2026-10-15`).

## 等你決定 Waiting on you

- **Trial `destinations-map` (port 8651, started 2026-10-15):** the map now sits on Destinations above the continent squares; clicking a book zooms in, the name rises, the photo fades in, and the country page opens on that same photo; the menu's Journey item now opens the Flights list of trips. Blog stays, empty. Keep or drop? (Trip stories you write later will hang off each trip in Journey.)

- **Sea photograph:** which photographs besides Aoraki, if any? (`?ocean=all` cycles all 93.)
- **Camera data for the 22 US photographs:** re-export from Lightroom with metadata, or drop the
  raw files in, and I'll add it.
- **Boston** has a book but no photographs yet.
- **Reviewer's optional ideas, not done:** sketchbook touches on the guide and photo pages, drawn
  covers for the books without photos.
- **Older items:** the second guide (Vietnam and Japan have the most photos); Barcelona's SIM row;
  newsletter sign-up; the old three Barcelona layouts; 紐西蘭暫緩.
- **Two uncommitted things:** 25 added lines in `data/sizes.json` (an Artifact packer for design 2
  wrote them) and `cutout.swift` at the top level, a small script that cuts the subject out of a
  photo with macOS Vision. Both left as they are. Keep, move or remove?

## 如何接續 How to resume

Say **"continue the travel website"**. Double-click **`start.command`** to open the site on 8642
(the Journey page is `localhost:8642/journey/`), or run `python3 tools/serve.py` from the project
folder.

# tuan photography 陳亮元 — Project Memo 專案備忘錄

*Last updated: 2026-10-08 — handoff note. Read this first, then check the files to confirm.*

## 現在狀態 Where things stand

- **Two sites, one set of facts.** `design 1/` is the current site ("The Printed Travel Journal",
  localhost:8642). `design 2/` is the redesign, **Pen and wash** (`design 2/wc-sketch/`,
  localhost:8645 opens it directly). Both are built from `data/site.json`, `content/` and the same
  photographs. `start.command` starts both. The 18 other design-2 versions were removed on
  2026-10-03; they are at the tag `design2-all-versions-2026-10-03`.
- **Design 2 is a full-screen sketchbook map:** all 20 books (his places; the USA as New York,
  Boston, Washington D.C., San Francisco, Los Angeles), the plate's slow zoom into a place, the
  place name rising large, a full-frame photo dissolve, a cover gallery, and a Flights view (small
  globe bottom-left) that replays his real journeys leg by leg. Its own design system is
  `design 2/wc-sketch/DESIGN.md`. It passed the Impeccable finish review (ship) on 2026-10-02.
- **93 photographs, 21 countries.** 22 US photographs have no camera data (exported from
  Photoshop); the site shows them without it, nothing invented.
- **The map (8645):** the plate stretched upright 1.25× (`SY`), Antarctica always on the bottom
  edge; the photograph through the sea (Aoraki, strength 0.9, the dial bottom right); a tally
  "21 / 195 countries · 11% of the world"; up to six of his flights always in the air; a photograph
  behind the Flights view. Clicking a book turns the sea photograph into that place's cover.
- **The Taste skill's five fixes are in design 2** (kept 2026-10-07): the phone's bottom-right row
  no longer wraps over the books, no word on the cover photograph, the place page no longer opens
  with "Guide not written yet", dates spoken as months, the Speed label in faded ink.
- **The opening on 8645:** the globe (`design 2/wc-sketch/opening/globe.js`, four looks via
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

**Ask him, before building anything:** of the four left (aperture, contact-2, letters-4 on 8648;
ridgeline on 8649), which one to develop, and in which direction. If he wants another round of
candidates, start from those four rather than from outside references (see the taste file), and
show him written concepts first. Files: `experiments/opening/design 1/js/opening/`,
`experiments/opening-graph/design 1/js/opening/ridgeline.js`, `experiments/opening-graph/.graph/taste.md`.

## 等你決定 Waiting on you

- **The opening:** four candidates left. Pick one to develop, or say the whole opening idea is
  parked. Also: should the 3 remaining versions and ridgeline be merged into one experiment, and the
  other closed?
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

Say **"continue the travel website"**. Double-click **`start.command`** to open both sites
(8642 design 1, 8645 design 2), or run `python3 tools/serve.py 8645 "design 2"` from the project
folder. He works on 8645; design 1 is still there and still builds. No experiment is open.

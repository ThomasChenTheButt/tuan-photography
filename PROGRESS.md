# tuan photography 陳亮元 — Project Memo 專案備忘錄

*Last updated: 2026-10-04 (early hours, end of the 2026-10-03 session) — handoff note. Read this first, then check the files to confirm.*

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
- **The opening on 8645 (no globe since 2026-10-03, his word):** the sea's photograph rises over
  the paper with the name in the middle, the map develops out of it, every flight draws across,
  then all fades. About 6s, once a session; `?opening` replays it; `?opening=corridor` is the
  corridor trial. The turning globe (and its three looks, and three globe experiments: earth,
  scope, cssglobe) all went the same day.
- **Experiment `scroll` (localhost:8646, worktree `experiments/scroll`, branch `exp/scroll`, 11
  commits):** the new opening he is building up. The guide books stand in rows on drawn shelves
  under the name, over the photograph (his pick of four shelves tried); the first scroll (wheel,
  finger, space, arrow, click) sets the map developing and the books flying to their places, by
  itself (2.8s); the second scroll sets the flights flying; a trackpad's run-on scroll no longer
  skips them. Also there, at his word: the desktop map's home view is where two fingers pushing up
  and to the right leave it (the plate as tall as the window, pushed to its right-hand limit).
  Not yet merged into 8645.

## 上次做到哪 Where we left off

2026-10-03, a very long day on design 2, ending past midnight.

- Morning and afternoon: the sea photograph filling the window, Antarctica on the foot, the map
  stretched taller, the tally, zoom words and credit removed, the title lowered, the photograph
  rising from nothing in the opening, no white disc, hover never changes the photo but a click
  does, ambient flights (up to six, faster), the Flights view photograph, a review of shaking and
  flashing (opening hold, backdrop from decode), three globe looks, three globe experiments
  (earth, scope, cssglobe) built and dropped, the Aoraki photograph a little lower.
- Evening: the turning globe removed from the opening altogether. Then he brought
  noomoagency.com ("the later page comes out as I scroll") and his own idea: the guide books on
  a shelf under the name, scattering to their places as the map comes. Built as experiment
  `scroll`: four shelves to choose from (rows, one long shelf, a pile, design 1's row), he chose
  the rows, books made bigger and set below the name; the scroll turned from a scrubber into two
  triggers (books, then flights); the desktop home view set to the up-and-right limit, because
  that is where every visitor's two-finger scrolling ends up (he had read the photograph as
  moving; it never moves, the land covers the mountain).
- Notes kept up: `design 2/wc-sketch/DESIGN.md` (the opening without the globe), TODO.md,
  IDEAS.md (Noomo), the experiment's CLAUDE.md note.

## 接下來 Next up

**His verdict on `scroll`.** Open `localhost:8646/?opening` (start it with the `exp-scroll`
preview, or `python3 tools/serve.py 8646 "experiments/scroll/design 2"`). If he says keep: merge
`exp/scroll` into `main` (it touches `design 2/wc-sketch/app.js`, `globe.js`, `style.css`,
`index.html`), then write the shelf opening and the new home view into
`design 2/wc-sketch/DESIGN.md` (the opening section still describes the timed one), check on
8645, remove the worktree and branch, run `python3 tools/check_site.py`. If he wants changes
first, they go on the experiment's branch.

## 等你決定 Waiting on you

- **Experiment `taste2` (localhost:8646):** the Taste skill's five fixes on design 2: keep or drop?
- **Sea photograph:** which photographs besides Aoraki, if any? (`?ocean=all` cycles all 93.)
- **Camera data for the 22 US photographs:** re-export from Lightroom with metadata, or drop the
  raw files in, and I'll add it.
- **Boston** has a book but no photographs yet.
- **Reviewer's optional ideas, not done:** sketchbook touches on the guide and photo pages, drawn
  covers for the books without photos.
- **Older items:** the second guide (Vietnam and Japan have the most photos); Barcelona's SIM row;
  newsletter sign-up; the old three Barcelona layouts; 紐西蘭暫緩.
- `tools/build_artifact2.py` and a change to `data/sizes.json` appeared from another session
  (an Artifact packer for design 2); left as they are, uncommitted.

## 如何接續 How to resume

Say **"continue the travel website"**. Double-click **`start.command`** to open both sites
(8642 design 1, 8645 design 2), or run `python3 tools/serve.py 8645 "design 2"` from the project
folder. The experiment is on 8646 (see Next up). He now works on 8645 and 8646; design 1 is still
there and still builds.

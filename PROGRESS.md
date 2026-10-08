# tuan photography 陳亮元 — Project Memo 專案備忘錄

*Last updated: 2026-10-07 — handoff note. Read this first, then check the files to confirm.*

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

2026-10-07: he kept experiment `taste2`. It is merged into `main` (design 2 on 8645 now has the
five fixes); the worktree, branch, server 8646 and the `exp-taste2` launch entry are gone. No
experiment is open.

Before that, 2026-10-05 and 2026-10-06, short sessions, no change to either site.

- The ideas list kept up: Impeccable updated to 4.5.0 on the Mac and in the account, Motion and
  Awwwards added, image-blaster marked dropped.
- 2026-10-06: a prompt audit of `CLAUDE.md` and this note. `CLAUDE.md` lost its generic
  "frontend aesthetics" block (replaced by a short list of defaults this site must not drift
  toward) and its ten paragraphs of experiment history (now one table); a stale line about the
  opening's files was corrected. This note was rewritten: it had still described experiment
  `scroll`, dropped on 2026-10-04, as the open one.

## 接下來 Next up

**The uncommitted pair.** Decide what `cutout.swift` (top level) and the 25 added lines in
`data/sizes.json` are for: keep (commit, and `cutout.swift` moves to `tools/`), or remove. Then
rerun `python3 tools/finder_view.py` so the top level stays tidy.

## 等你決定 Waiting on you

- **Experiment `opening-graph` (localhost:8649):** his agent graph's first run made nine openings; he
  cut eight and kept only the concept of `ridgeline` (lines draw the ridge, horizon and window frame on
  paper, then the paper becomes the photograph). Verdict recorded in `.graph/excluded.md` and
  `.graph/taste.md`. Next: decide whether to develop ridgeline or run the graph again with a stricter
  manager.
- **Experiment `opening` (localhost:8648):** down to three at his word on 2026-10-08: aperture,
  contact sheet version 2, letters version 4. Every other version and the film strip, burst and pull-back
  openings were removed (git history keeps them). Next: pick one of the three, or combine with ridgeline.
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

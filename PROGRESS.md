# tuan photography 陳亮元 — Project Memo 專案備忘錄

*Last updated: 2026-10-16, handoff note. Read this first, then check the files to confirm.*

## 現在狀態 Where things stand

- **Four tabs since 2026-10-15:** Gallery · Journey · Guides · About, each with one job in
  `PRODUCT.md` → "Tabs 定位". Sessions redesign them one tab each, side by side.
- **One site, one server:** `design 1/` on localhost:8642. The Journey tab is still `design 2/`
  ("Pen and wash", `design 2/wc-sketch/`): the sketchbook map, Flights, and each trip "along its
  route" (`wc-sketch/trip/?trip=<id>`).
- **About was rewritten and kept** (2026-10-16, experiment `about`, merged). **Gallery stays as it
  was** (experiment `gallery` dropped, tag `exp-gallery-dropped-2026-10-16`).
- **93 photographs, 21 countries.** 22 US photographs have no camera data; shown without it.

## 上次做到哪 Where we left off

2026-10-16, Journey redesign, experiment `journey` (localhost:8644, `experiments/journey/`):

- He found the current Journey messy. Three new directions were built side by side in
  `design 2/new/` (`localhost:8644/journey/new/` lists them): Logbook, Chapters, Atlas. **He chose
  Logbook** (`design 2/new/logbook.html`).
- Logbook now: "Journey", one sentence, "16 trips, 21 countries, since 2010"; a world map where one
  plane leaves Taiwan for each of his 21 countries, once, all together, the nearer ones landing
  first, and the red routes stay; then the log by year (large year figures, each trip with month,
  countries, route and a strip of its photographs; a photo opens the viewer).
- **Clicking a trip opens the existing "along its route" page** (his call: it should look like
  that one), `wc-sketch/trip/?trip=<id>&from=logbook`; its back word then says "All trips" and
  returns to the Logbook. Myanmar 2022 and Netherlands 2012 have no route, so no link.
- Taste skill audit done and fixed: the 2014 and 2015 USA trips had shown three 2025 photographs
  (a trip with no months now keeps only its own year's photos; fixed on the trip page too),
  the head in one column, a shorter intro, only the year keeps a ruled line.
- **Old versions are safe** (his rule, now in CLAUDE.md "Learned rules"): tags pushed to GitHub,
  `journey-pen-and-wash-2026-10-15` (Journey as it is now), `journey-logbook-v1-2026-10-16`
  (route squiggles), `journey-logbook-v2-2026-10-16` (constant traffic, Claude's own trip page).

## 接下來 Next up

**Open `localhost:8644/journey/new/logbook.html` with him** (start the `exp-journey` preview;
`.claude/launch.json` has it) and ask: keep and merge, or more changes. To merge: make the Logbook
the Journey page (`design 2/index.html` forwards to it instead of `wc-sketch/`), keep
`wc-sketch/trip/` as the trip page, decide whether the old map and Flights stay reachable, then
merge `exp/journey` into `main` and check on 8642. Files: `design 2/new/logbook.*`, `kit.*`,
`design 2/wc-sketch/trip/trip.js`.

## 等你決定 Waiting on you

- **Journey:** merge the Logbook, or change more? If kept: drop Chapters and Atlas (their code
  stays in git), and do the old map and Flights view stay anywhere?
- **Sea photograph** on the old Journey map: which photographs besides Aoraki, if any?
- **Camera data for the 22 US photographs:** re-export from Lightroom with metadata, or drop the
  raw files in, and I'll add it.
- **Boston** has a book but no photographs yet.
- **Older items:** the second guide (Vietnam and Japan have the most photos); Barcelona's SIM row;
  newsletter sign-up; the old three Barcelona layouts; 紐西蘭暫緩.
- **Two uncommitted things:** 25 added lines in `data/sizes.json` and `cutout.swift` at the top
  level (cuts the subject out of a photo with macOS Vision). Keep, move or remove?

## 如何接續 How to resume

Say **"continue the travel website"** (for Journey: "continue the Journey logbook"). Double-click
**`start.command`** for the site on 8642; the Journey trial runs on 8644.

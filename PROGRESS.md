# tuan photography 陳亮元 — Project Memo 專案備忘錄

*Last updated: 2026-10-19 night, handoff note. Read this first, then check the files to confirm.*

## 現在狀態 Where things stand

- **Design 3 exists, on localhost:8650** (`design 3/`, started 2026-10-19 at his word: ignore
  everything built before and every rule, redesign the whole site from his Drive travel folder).
  Dark ground, Archivo and Geist Mono, GSAP. Pages: Places (`index.html`), Journeys, Photographs,
  the Barcelona guide, About, 404. Earlier homes kept beside it: `passport.html`, `day.html`.
  `start.command` now starts 8642 and 8650 and opens 8650. CLAUDE.md's first section is design 3.
- **Its home page is "one camera"** (`index.html`, `js/film.js`): an opening count of cities and
  countries side by side with a wall of names behind it (`js/intros.js`), Aoraki held with the
  viewfinder, the film by continent, every country, the Matterhorn close. He finds it **too much**
  ("the viewers might get overwhelmed", the count "AI slop") but said **keep it for now**.
- **A calm home stands beside it**, `still.html` (`js/still.js`): the photograph first, three
  motions in all, nothing written on a photograph. Reachable only by its address.
- **Design 1 on 8642 is unchanged.** The Journey trial (Logbook, `experiments/journey/`, 8644)
  still waits for his merge verdict.
- **93 photographs, 21 countries.** 22 US photographs have no camera data.

## 上次做到哪 Where we left off

2026-10-19, one long day on design 3, in his words:

- "Redesign my entire website": design 3 built; he disliked a page by date, wanted "an impression of
  a traveller" by continent and country, so the Passport home was built and committed (97fdd23).
- "A complete redesign of the homepage, more epic": the one-camera home, audited with the taste
  skill, UI UX Pro Max, redesign-existing-projects, the Motion kit (B, 70) and Impeccable (20/32,
  its five issues fixed). "Lacks creativity": the viewfinder.
- "Give me some variations": six openings after the count, on the review list `heroes.html`.
- "I like the counting of the countries, at least 10 versions": ten counts; he liked the cities
  wall; "city and country both counting": pair and stack; he kept pair as the landing. Tags
  `counting-openings-ten-2026-10-19`, `counting-openings-three-2026-10-19`.
- "The landing page gives me AI slop, the homepage effect is too much": `still.html` built beside
  the busy home (tag `home-film-2026-10-19`); "keep http://localhost:8650/ for now".
- His new rule, twice: every time he is asked to choose, the links sit beside the question.
- The Emil Kowalski design-engineering skill installed in both places.
- `cutout.swift` moved from the top level into `tools/` (it cuts a subject out of a photo with
  macOS Vision; it was a loose end since 2026-10-16).

## 接下來 Next up

**Design 3, the opening after the count:** read `ideas/reviews/openings.json` (his marks from
`heroes.html`, if he made any), then open http://localhost:8650/heroes.html with him and settle
which of the six openings follows the count. Files: `design 3/js/heroes.js`, `js/film.js`.
If he turns to the calm direction instead, build on `design 3/still.html` and `js/still.js`.

## 等你決定 Waiting on you

- **Design 3:** which opening follows the count (`heroes.html`). Busy or calm home (busy for now).
  Does design 3 become the site?
- **Journey:** merge the Logbook on 8644, or change more? If kept: drop Chapters and Atlas, and
  do the old map and Flights stay anywhere?
- **Sea photograph** on the old Journey map: which photographs besides Aoraki, if any?
- **Camera data for the 22 US photographs:** re-export from Lightroom with metadata, or drop the
  raw files in.
- **Boston** has a book but no photographs yet.
- **Older items:** the second guide (Vietnam and Japan have the most photos); Barcelona's SIM row;
  newsletter sign-up; the old three Barcelona layouts; 紐西蘭暫緩.

## 如何接續 How to resume

Say **"continue the travel website"** (or "continue design 3"). Double-click **`start.command`**:
design 1 on 8642, design 3 on 8650. The Journey trial runs on 8644.

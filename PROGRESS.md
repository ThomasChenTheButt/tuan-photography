# tuan photography 陳亮元 — Project Memo 專案備忘錄

*Last updated: 2026-10-04, just after midnight — handoff note. Read this first, then check the files to confirm.*

## 現在狀態 Where things stand

- **Two sites, one set of facts.** `design 1/` is the current site ("The Printed Travel Journal",
  localhost:8642). `design 2/` is the redesign, **Pen and wash** (`design 2/wc-sketch/`,
  localhost:8645 opens it directly). Both are built from `data/site.json`, `content/` and the same
  photographs. `start.command` starts both. He now works on 8645 only.
- **Two sessions worked on 2026-10-03 evening (his arrangement):** one owns design 2 itself
  (8645, `main`); the other owns the `scroll` experiment (8646, branch `exp/scroll`). Neither
  edits the other's files. If only one session is open next time, it owns both.
- **Design 2 is a full-screen sketchbook map:** 20 books (his places; the USA as New York, Boston,
  Washington D.C., San Francisco, Los Angeles), the plate's slow zoom into a place, the place name
  rising large, a full-frame photo dissolve, a cover gallery (swipe sideways, scroll down for the
  guide), and a Flights view (small globe bottom-left) that replays his real journeys leg by leg.
  Its own design system is `design 2/wc-sketch/DESIGN.md`. It passed the Impeccable finish review
  (ship) on 2026-10-02.
- **93 photographs, 21 countries, 16 journeys.** 22 US photographs have no camera data (exported
  from Photoshop); the site shows them without it.
- **The home map:** the plate is stretched upright 1.25× (`SY` in `app.js`) so Greenland meets the
  top and Antarctica the foot; when the plate is shorter than the window it sits on the bottom
  edge. At Whole map on a desktop the books are fitted with more room above (175px) than below
  (70px), his note. Bottom right: the tally "21 / 195 countries · 11% of the world", Whole map, the
  Photo dial. A few of his flights are always in the air (up to six), on their own canvas.
- **The photograph through the sea (default):** Aoraki under the whole window, seen wherever there
  is water, strength 0.9, its own copy cut from his original (`design 1/images/web/new-zealand-aoraki-sea.jpg`
  + 1280 copy, made by hand), anchored a little low (`SEA_ANCHOR` 0.28). Clicking a book turns it
  into that place's cover and it stays; hovering never changes it. `?ocean=all` cycles all 93,
  `?o=0.5` tries a strength, `?photos=none` turns it off. The dial stays (his call).
- **Flights view:** a photograph behind the spread (the sea's; a journey's first cover while the
  hand is on it), the journeys on a translucent leaf of paper.
- **Opening:** the globe turns under "Tuan, Through the Lens" / Tuan 的鏡頭之旅 while the sea's
  photograph rises behind it, unrolls into the map as the title glides to the centre, every flight
  draws across the map, then all fades. Once a session; `?opening` replays it. The globe holds
  its turn until the painting and the photograph are in, so nothing pops at the hand-over. Four
  looks for the globe, his choice pending (`?globe=1|2|3|4`, `GLOBE_STYLE_DEFAULT` in `app.js`):
  wash, lit (day/night line, his cities as night lights, blue atmosphere), desk globe (brass
  meridian ring), photo ball (the sphere covered in his photographs, `photoball.js`, WebGL). The
  corridor of prints (`?opening=corridor`) stays off; the other session's "map developing out of
  the photograph" opening is in history at `78714c6`.
- **Dropped experiments today** (code in history only): `earth` (a self-built lit Earth), `scope`
  (the map seen through a telescope), `cssglobe` (a React component he brought, rebuilt in CSS).

## 上次做到哪 Where we left off

2026-10-03, a long day on design 2; this is the second session's half.

- Sea photograph over the whole window with Antarctica on the bottom edge; corridor and sea photo
  made the defaults, then the corridor taken off again (a friend found it odd); the map stretched
  taller; Zoom in/out and the credit removed; the tally; the dial kept; the slow rise of the
  photograph from the opening's first frame; the name above the globe; planes always in the air;
  the Flights view's background; the frame-drop review (none: it was files arriving late, now
  held for); three globe looks, then a fourth, the photo ball; three globe experiments built and
  dropped; the books moved lower in the window; Aoraki moved down.
- The other session removed the globe from the opening; he asked for it back; restored.

## 接下來 Next up

**He picks the opening globe's look.** Open `localhost:8645/?opening&globe=1`, `2`, `3`, `4`; set
`GLOBE_STYLE_DEFAULT` in `design 2/wc-sketch/app.js` to his number. Then settle the `scroll`
experiment (below) with the other session's work. Check: `python3 tools/check_site.py`.

## 等你決定 Waiting on you

- **The opening globe's look:** 1 wash, 2 lit, 3 desk globe, 4 photo ball.
- **Experiment `scroll` (localhost:8646, the other session's):** the shelf opening, his idea: the
  guide books in design 1's row under the name over the photograph; one scroll sets the map
  developing and the books flying to their places, a second sets the flights flying. Also there:
  the desktop home view pushed up and right. Keep or drop? Keep means it replaces the timed
  opening on 8645 (and the globe question above becomes moot).
- **Sea photograph:** which photographs besides Aoraki, if any?
- **Camera data for the 22 US photographs:** re-export from Lightroom with metadata, or drop the
  raw files in.
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
folder. The `scroll` experiment: `python3 tools/serve.py 8646 "experiments/scroll/design 2"`.

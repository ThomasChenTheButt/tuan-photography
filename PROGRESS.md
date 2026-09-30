# tuan photography 陳亮元 — Project Memo 專案備忘錄

*Last updated: 2026-10-01 — handoff note. Read this first, then check the files to confirm.*

## 現在狀態 Where things stand

- **The site is "The Printed Travel Journal"** on warm paper, 30 pages, all passing
  `python3 tools/check_site.py`. Not public (GitHub Pages off, his call); a private Claude
  Artifact copy exists (see `tools/build_artifact.py`).
- **69 photographs from 14 countries** are on the site, each with real camera data read from
  the file. Only South Korea and the United States have none.
- **Home page:** opening photo (Aoraki) → intro → Victoria Harbour at night → the Guides row of
  sixteen 3D books (one per country; Barcelona opens the guide, the rest open country pages) →
  the aurora → a wall of a dozen photos, one per country → Westminster Bridge → footer. The
  three mid-page photos fill the window and drift slowly as the page passes over them.
- **Gallery:** a dozen in a tight grid, then one wall per country (14), then the two names
  without photos. **Destinations:** four continent squares plus "Not travelled yet".
- **Design records:** `DESIGN.md` (components, incl. the row of books and the windows) and
  `PRODUCT.md`. The stylesheet wins where they disagree.
- **No email on the site.** Instagram `tuan_1127` is the contact.

## 上次做到哪 Where we left off

2026-10-01 — a long day of shaping the home page and adding photographs.

- Impeccable's full critique (dual-agent, 23/32) and the three fixes he chose were kept:
  Destinations rebuilt, the phone viewer, keyboard and screen-reader access.
- He dropped the three colour doors, put the Guides above the Photographs, and asked for the
  Hello Emilie feel: full-window photos between sections, drifting with the scroll.
- The Guides went through four looks in one day: five books on a shelf → a spinning ring (he
  called it cringe, reverted) → a coverflow ring → the **fanned row of sixteen 3D books** he
  chose from the mcli CodePen, refined for direction, thickness, spacing and the London cover.
  Kept at sign-off on his assumption that everything was on 8642. Restore point:
  tag `before-coverflow-2026-10-01`.
- **59 photos added** in two batches from his originals (Dubai, Germany, Switzerland, Taiwan,
  UK, Hong Kong, Japan, Australia, China, France, New Zealand, Singapore, Vietnam).
- Gallery divided by country; home wall one photo per country; home windows set to his picks.
- The ideas list got Hello Emilie's scroll effect (what he likes: the slow-moving photos).

## 接下來 Next up

**Confirm the photo names he hasn't checked yet**, then move on to the second guide. The names
to confirm are in `data/site.json` under `"slides"`: `matterhorn-lake` (which lake), `taipei-101-framed`
(the twisting tower), `westminster-abbey`, `mong-kok`, `sheung-wan-tram`, `temple-street`,
`gold-coast`, `hoi-an-gate`, `aurora` (where), `fuji-lake` (which lake). Fix any he corrects,
rebuild with `python3 tools/build.py`, commit, push.

## 等你決定 Waiting on you

- **Photo names above:** right or wrong?
- **Which country gets the second guide?** Vietnam (2026.8) and Japan now have the most photos.
- **Barcelona "SIM / data" fact** still has no value, so the row is left out of the page.
- **Newsletter sign-up:** wanted or not?
- **The old plan of three Barcelona layouts** (2026-08-08): still wanted, or replaced by the new look?
- **紐西蘭暫緩** — parked 2026-08-08; New Zealand now has 7 photos, so it could come off hold.
- Impeccable's own bookkeeping is stale (its design sidecar and a surface brief pointing at the old
  `index.html` path). Harmless; its `document` command refreshes it when wanted.

## 如何接續 How to resume

Say **"continue the travel website"**. The site runs at `localhost:8642`: I start it, or he
double-clicks **`start.command`**, or in Terminal `python3 tools/serve.py` from the project folder.

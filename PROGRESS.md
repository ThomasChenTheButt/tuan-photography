# tuan photography 陳亮元 — Project Memo 專案備忘錄

*Last updated: 2026-09-28 — handoff note. Read this first, then check the files to confirm.*

## 現在狀態 Where things stand

- **The site has its new look: "The Printed Travel Journal".** Warm paper, serif place names,
  one full-window opening photograph with nothing written on it. He chose it on 2026-09-28
  after comparing it side by side with the earlier site.
- **30 pages, all working.** Home, Gallery, Destinations, 7 continents, 16 countries, Blog,
  Skills, About, and the Barcelona guide. No broken links, no console errors.
- **Pages are built, not hand-written.** Edit `data/site.json` or `content/`, then run
  `python3 tools/build.py`. The design is recorded in `DESIGN.md` and `PRODUCT.md`.
- **8 real photos live** — 7 from Barcelona, 1 from New Zealand (Aoraki, the opening photo).
- **Typefaces are stored with the site** in `site/fonts/`. No page contacts Google.
- **No email on the site.** Instagram `tuan_1127` is the contact.
- **Not public.** GitHub Pages stays off — his call, 2026-08-08.

## 上次做到哪 Where we left off

2026-09-28 — the experiment became the site.

- Set up `experiments/`: every trial now lives inside the project folder, and he says keep or
  drop. The routine is in `CLAUDE.md`.
- He said **keep** to the redesign. It was merged into the real site, with the PT icon, the
  ideas inbox and the local server carried over from the earlier site.
- Fonts moved from Google to the site's own `site/fonts/` folder.
- Email removed from the site's data. About biography stays as written.
- **Photo folders split by owner:** his originals are in `originals/`, the site's copies in
  `site/images/`. A private photo list (double-click `photo-list.command`) shows which photo is
  for what.
- **The whole website now lives in `site/`.** The top level went from 33 items to 14, and
  only `site/` would ever be published. `tools/check_site.py` is the health check.
- Earlier the same day: the PT site icon, the ideas inbox (`IDEAS.md`), the weekly report.

## 接下來 Next up

**Pick the country for the second guide**, then drop its originals into `originals/<country>/`.
The first move in the files is a new entry under `"guides"` and `"slides"` in
`data/site.json`, plus `content/<name>.body.html` and `content/<name>.i18n.json`, modelled on
the Barcelona pair.

## 等你決定 Waiting on you

- **Which country after Barcelona?** 15 of 16 country pages have no guide yet.
- **Barcelona "SIM / data" fact** has no value, so the row is left out of the page.
- **Newsletter sign-up:** wanted or not?
- **The old plan of three Barcelona layouts** (2026-08-08) was written for the earlier design.
  Still wanted, or replaced by the new look?
- **紐西蘭暫緩** — parked on his call 2026-08-08. Only one NZ photo exists today.
- **Vietnam (2026.8)** — nothing written yet.

## 如何接續 How to resume

Say **"continue the travel website"**. Preview runs at `localhost:8642` (I start it
automatically). To open the site yourself without Claude, double-click **`start.command`**
in the project folder — same address. A normal reload now shows the latest changes.

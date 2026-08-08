# tuan photography 陳亮元 — Project Memo 專案備忘錄

*Last updated: 2026-08-08 — handoff note. Read this first, then check the files to confirm.*

## 現在狀態 Where things stand

- **31 pages, all working.** Homepage, Destinations, 7 continents, 16 country pages, Gallery,
  Blog, Skills, About, plus the Barcelona guide. No broken links, no console errors.
- **8 real photos live** — 7 from Spain, 1 from New Zealand (Aoraki through the car window,
  used as the homepage hero). All in `images/web/`, ~6 MB total.
- **One finished guide: Barcelona** (`posts/barcelona.html`) — 8 sections, 6 real photos,
  11 photo spots with map pins, 我的路線, last-updated date. This is the reference build.
- **Design is settled** and lives in `css/style.css` — see the component vocabulary table in
  `CLAUDE.md`. There is no template file and none is wanted.
- **Not public.** GitHub Pages stays off — his call, 2026-08-08.
- Everything committed and pushed to `ThomasChenTheButt/tuan-photography`.

## 上次做到哪 Where we left off

2026-08-08 — housekeeping and planning, plus one real bug fixed.

- **Fixed:** the Barcelona guide still told readers "the images on this page are placeholders"
  while displaying six real photographs. The Gallery's identical note was removed weeks ago;
  this copy was missed. Gone in both languages now.
- Full health check on all 31 pages — clean.
- Built the end-of-day handoff system (this file + the rule in `CLAUDE.md`).
- Wrote the **component vocabulary** into `CLAUDE.md` so the design language survives session
  resets and can be read by teammate agents before they build anything.
- Corrected two stale instructions in `CLAUDE.md`: the heading font (was still Fraunces) and
  `gen_pages.py`, which a full-disk search confirmed no longer exists anywhere.
- Enabled **agent teams** in `.claude/settings.local.json` (gitignored — this Mac only).
  Takes effect in a **new** session, not the one where it was switched on.

## 接下來 Next up

**明天:三個巴賽隆納版本,他挑一個。** Needs a fresh session for agent teams to work.

Why Barcelona and not New Zealand: the material is already here — six photos, eleven spots,
a full four-day route. Nothing is blocked.

The prompt shape:

- Three teammates, three genuinely different directions — **photo-led / field-journal-led /
  deliberately breaks the current structure**.
- Each owns its own file so they can't overwrite each other:
  `posts/bcn-a.html`, `posts/bcn-b.html`, `posts/bcn-c.html`.
- **They must build from the component vocabulary in `CLAUDE.md`.** No inline `style="…"`.
  Anything genuinely new goes into `css/style.css` as a reusable class.
- They critique each other on **one question only**: does this respect the restraint rule?
- **Do not merge. Do not converge on a consensus version.** Three intact options reach his desk.
- He reviews at `localhost:8642/posts/bcn-a.html` etc., picks one, tunes it. Winner replaces
  `posts/barcelona.html`; the other two get deleted.

After he picks, the chosen layout becomes how every future country is built — not by copying
the file, but because the design lives in the shared CSS.

## 等你決定 Waiting on you

- **紐西蘭暫緩** — parked on his call 2026-08-08. When it restarts, the first move is dropping
  his NZ originals into `images/new-zealand/`; only one NZ photo exists today.
- **Which country after Barcelona?** 15 of 16 country pages are still empty shells.
- **Vietnam (2026.8)** — placeholder for the upcoming trip, nothing to write until he goes.

## 如何接續 How to resume

Say **"continue the travel website"**. Preview runs at `localhost:8642` (I start it
automatically). If the browser looks stale, hit **Cmd+Shift+R**.

# tuan photography 陳亮元 — Project Memo 專案備忘錄

*Last updated: 2026-08-07 — handoff note. Read this first, then check the files to confirm.*

## 現在狀態 Where things stand

- **31 pages, all working.** Homepage, Destinations, 7 continents, 16 country pages, Gallery,
  Blog, Skills, About, plus the Barcelona guide. No broken links, no console errors.
- **8 real photos live** — 7 from Spain, 1 from New Zealand (Aoraki through the car window,
  used as the homepage hero). All in `images/web/`, ~6 MB total.
- **One finished guide: Barcelona** (`posts/barcelona.html`) — 8 sections, real photos,
  comparison tables, 我的路線, last-updated date. This is the template every other guide copies.
- **Design is settled**: Instrument Serif headings, warm paper background, Kodak red accents.
- Everything committed and pushed to `ThomasChenTheButt/tuan-photography`.

## 上次做到哪 Where we left off

2026-08-07 — no new website content; this was a housekeeping day.

- Full health check on all 31 pages. Everything came back clean.
- Fixed a stale line in `CLAUDE.md` — it still said the heading font was Fraunces, three commits
  after the switch to Instrument Serif.
- Set up this file as a proper end-of-day handoff, so clearing the conversation costs nothing.
- Enabled **agent teams** (`.claude/settings.local.json`, gitignored, so it's on this Mac only).
  Takes effect in a *new* session, not the one where it was switched on.
- Decided how to use them: **three divergent versions, he picks** — not a design committee.

## 接下來 Next up

**Get the New Zealand photos in.** Everything else is blocked behind this.

He drops his New Zealand originals into `images/new-zealand/` (gitignored, stays on his Mac) and
says roughly which trip they're from. Then make web-sized copies into `images/web/` as
`new-zealand-<subject>.jpg` — `sips -Z 2400 in.jpeg --setProperty formatOptions 62 --out …`.

Only one NZ photo exists today, and it's already the homepage hero. Three layouts built around
one image aren't three real choices — the material has to come first.

**Then: the New Zealand guide as three competing versions.** The ready-to-paste prompt is in the
2026-08-07 conversation; the shape is:

- Three teammates, three directions — photo-led / field-journal-led / breaks-the-template.
- Each owns exactly one file — `posts/nz-a.html`, `nz-b.html`, `nz-c.html` — so they can't
  overwrite each other. He reviews all three at `localhost:8642/posts/nz-a.html` etc.
- They critique each other on **one question only**: does this respect the restraint rule in
  `CLAUDE.md`?
- **Do not merge, do not converge.** Design debates average out to the generic middle — the exact
  thing the aesthetics block warns about. The taste call is his.
- He picks one → rename to `posts/new-zealand.html`, link it from `countries/new-zealand.html`,
  delete the other two.

## 等你決定 Waiting on you

1. **The site still isn't public.** GitHub Pages is off — the repo exists but nothing is served.
   One switch in the repo's Settings → Pages. Say the word and I'll walk you through it.
2. **15 of 16 country pages are empty shells.** Which country after New Zealand?
3. **Vietnam (2026.8)** is a placeholder for the upcoming trip — nothing to write until you go.

## 如何接續 How to resume

Say **"continue the travel website"**. Preview runs at `localhost:8642` (I start it
automatically). If the browser looks stale, hit **Cmd+Shift+R**.

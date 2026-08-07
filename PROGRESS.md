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

2026-08-07 — no new content this session; it was a health check on the whole site.
Everything came back clean. Found and fixed one stale note in `CLAUDE.md` (it still said the
heading font was Fraunces, but you switched to Instrument Serif). Set up this file as a proper
end-of-day handoff so clearing the conversation stops costing us anything.

## 接下來 Next up

**Start the New Zealand guide.** It's the natural second country — the Aoraki photo is already
on the homepage, so there's real material to build around.

First move: copy `posts/barcelona.html` to `posts/new-zealand.html` and strip it back to the
8-section skeleton, then link it from `countries/new-zealand.html`. After that, the work is
photos + your notes from the trip.

## 等你決定 Waiting on you

1. **The site isn't public yet.** GitHub Pages is off — the repo exists but nothing is served.
   It's one switch in the repo's Settings → Pages. Say the word and I'll walk you through it.
2. **15 of 16 country pages are empty shells.** Japan, Taiwan, USA, Switzerland and the rest
   have pages built and waiting, but no guide behind them. Which country after New Zealand?
3. **Vietnam (2026.8)** is a placeholder for the upcoming trip — nothing to write until you go.

## 如何接續 How to resume

Say **"continue the travel website"**. Preview runs at `localhost:8642` (I start it
automatically). If the browser looks stale, hit **Cmd+Shift+R**.

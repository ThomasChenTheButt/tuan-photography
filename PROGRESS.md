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

**Start the New Zealand guide — as three competing versions, not one.**

He wants to see genuinely different takes and pick/tune the one he likes, rather than be handed
a single merged answer. Agent teams are enabled for this
(`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in `.claude/settings.local.json`).

**The rule that makes this work: do NOT let them converge.** Design debates average out to the
generic middle — the exact "AI slop" the brief warns against. They critique each other for
*brief compliance* (especially the restraint rule), then all three survive to his desk intact.

Mechanics, so they don't overwrite each other — each teammate owns its own file:
`posts/nz-a.html`, `posts/nz-b.html`, `posts/nz-c.html`. He reviews all three side by side at
`localhost:8642/posts/nz-a.html` etc., picks one, and it gets renamed to `posts/new-zealand.html`.
Delete the other two after he decides.

**Blocked on:** his New Zealand photos + trip notes. Only one NZ photo exists so far
(`new-zealand-aoraki-window.jpg`, currently the homepage hero). Three layouts built around one
photo isn't a real choice — get the material in first.

## 等你決定 Waiting on you

1. **The site isn't public yet.** GitHub Pages is off — the repo exists but nothing is served.
   It's one switch in the repo's Settings → Pages. Say the word and I'll walk you through it.
2. **15 of 16 country pages are empty shells.** Japan, Taiwan, USA, Switzerland and the rest
   have pages built and waiting, but no guide behind them. Which country after New Zealand?
3. **Vietnam (2026.8)** is a placeholder for the upcoming trip — nothing to write until you go.

## 如何接續 How to resume

Say **"continue the travel website"**. Preview runs at `localhost:8642` (I start it
automatically). If the browser looks stale, hit **Cmd+Shift+R**.

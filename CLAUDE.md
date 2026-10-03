> **Experiment `scroll` (2026-10-03).** The opening after noomoagency.com (his find): the same
> opening as on 8645, but once the photograph is up it plays only as far as he scrolls (wheel,
> finger, keys; forward or back, about two windows' height for the whole), the way that site's
> pages come with the scroll. His words: "as I scroll it should turn out just like my anime".
> Default here (`OPENING_DEFAULT = 'scroll'`; `?opening=classic` plays the timed one). Served on
> 8646. No skill. Every rule of this file holds.

# tuan photography 陳亮元 — project instructions

Personal travel-photography site for Thomas Chen (陳亮元). Plain HTML/CSS/JS, no framework.
Bilingual EN / 繁體中文. Owner is not a developer — explain in plain English, handle all tech.

## The brief (owner-decided — these win over any generic guidance)

- **Who he is:** a landscape photographer (旅途中的風景 — nature and cities). Not a travel
  blogger, not a studio for hire. The photograph is the entrance; the guide is what it leads to.
- **Look:** "The Printed Travel Journal" — a travel journal set like a printed magazine, on
  warm paper. He chose this on 2026-09-28 after comparing it with the earlier site, naming
  Along Dusty Roads and The Common Wanderer as the bar for craft.
- **Restraint:** clean, minimal, generous white space. Photos talk; text stays quiet.
  When in doubt, remove an element rather than add one. His biggest fear is the design
  upstaging the photographs.
- **Nothing is written across the opening photograph.** No headline, sentence or button on it.
- **Titles:** plain place names ("Barcelona", not "Barcelona for Photographers: Four Days of…").
  Descriptive detail belongs in the small line under it.
- **References are sources of qualities, never templates.** He rejected an earlier look for
  copying wilhelmchang.com. The site keeps its own identity.
- **No email on the site** (his call, 2026-09-28). The way to reach him is Instagram,
  `tuan_1127`. The About biography stays as written (his call, same day).

## Design system — `DESIGN.md` and `PRODUCT.md`

The design is recorded in two files at the root. **Read them before any visual change.**

| File | What it holds |
|---|---|
| `DESIGN.md` | colours, type, layout, motion, every component, the do's and don'ts |
| `PRODUCT.md` | who the site is for, what it promises, what evidence exists |

Where `DESIGN.md` and `design 1/css/style.css` disagree, the stylesheet is right and `DESIGN.md` needs
updating in the same commit. The short version:

| Thing | Rule |
|---|---|
| Ground | warm paper and a stone band alternate by section. **Light only**, no dark theme |
| Colour | eleven tokens in `design 1/css/style.css` `:root`. Never hard-code a colour |
| Earth colours | clay, olive, slate: whole flat blocks only (the three doors, the footer) |
| Links | deep clay is the only colour that means "this can be followed" |
| Names and headings | Playfair Display, weight 400, centred (中文: Noto Serif TC, 500) |
| Reading text | Geist (中文: Noto Sans TC) |
| Labels, menu, buttons | Geist in small spaced capitals. No mono face |
| Corners | square, everywhere |
| Controls | words, never icons or arrows |
| Photographs | bare, untrimmed in rows, names beneath and never on top. The gallery's portfolio grid and the continent squares are trimmed to even openings (his call, 2026-09-30) |
| Punctuation | no long dashes; at most one middle dot in a line; 中文 uses full-width marks |

### Rules

- **Build from the components in `DESIGN.md`.** A new page should introduce almost no new CSS.
- **Never use inline `style="…"` to style anything.** Inline styling is how a page silently
  drifts away from the stylesheet and stops responding to design changes. The build writes two
  values this way and only these: `--ar` (a photograph's shape, for the rows) and `--i` (the
  order things arrive in). They carry a number to the stylesheet; they are not styling.
- If something genuinely new is needed, add it to `design 1/css/style.css` as a **reusable class**, and
  record it in `DESIGN.md` in the same commit.

## Folder layout — his things, the website, what it is built from

Arranged on 2026-09-28 at his request, so the top level reads at a glance. Keep it this way:
**nothing new at the top level without a reason he would recognise.**

| At the top level | Whose | What it is |
|---|---|---|
| `start.command`, `photo-list.command`, `建置進度.command` | his | double-click launchers |
| `originals/`, `ideas/`, `IDEAS.md`, `TODO.md`, `我的筆記.txt`, `experiments/` | his | his photos, his ideas, his to-do list, his own notes, trials |
| `design 1/` | visitors' | **the current website (was `site/`) and nothing else.** Served on 8642 |
| `design 2/` | visitors' | **the complete redesign**, built beside it. Served on 8645 |
| `data/`, `content/`, `tools/` | Claude's | what the pages are built from, and the scripts |
| `CLAUDE.md`, `DESIGN.md`, `PRODUCT.md`, `PROGRESS.md` | Claude's | notes. They stay at the top: tools look for them there |

- **Two designs, one set of facts** (his call, 2026-10-01). `site/` was renamed `design 1/`
  and a complete redesign is built in `design 2/`, kept beside it rather than as an experiment, so
  he can compare the two for as long as he likes and later choose which one is "the" site. Both
  are built from the same `data/`, `content/` and photographs: a new photo or a corrected name
  reaches both on the next build. If design 2 needs a new fact, add it to the shared files without
  breaking design 1. Design 2 keeps four rules of the brief, his choice: nothing written across the
  opening photograph, light only, Instagram as the only contact, English plus 中文. Everything
  else about its look starts fresh; `DESIGN.md` describes design 1 only. Both folders are hidden
  in Finder (Cmd+Shift+. shows them).
- **How design 2 is made** (set up 2026-10-01). `python3 tools/build2.py` reads the shared facts
  and writes `design 2/data.js` (`window.SITE`: countries, photographs, books, journeys, the guide as
  ready HTML, words in both languages) and `design 2/fonts.css`. Rerun it whenever `data/` or
  `content/` changes, as with `tools/build.py`. `design 2/images` and `design 2/fonts` are links
  to design 1's folders, so photographs and typefaces are never copied. Map shapes and libraries
  live in `design 2/vendor/` (d3, topojson-client, Natural Earth via world-atlas, country names,
  shaded relief; licences beside them); pages never contact a map or font server. Every country
  and photograph in `data/site.json` carries `ll` [lat, lng]: the place's public location,
  approximate, for the map. It is not the camera's GPS (the files carry none).
- **Design 2 is "Pen and wash"**, `design 2/wc-sketch/` (his choice, 2026-10-02, after four rounds
  of variants). Its own design system is `design 2/wc-sketch/DESIGN.md` (the root `DESIGN.md` is
  design 1). It passed the Impeccable finish review (ship). `localhost:8645` opens it directly
  (`design 2/index.html` forwards there). The other 18 versions were removed on 2026-10-03 at his
  word; they are at the tag `design2-all-versions-2026-10-03`. `?opening` replays the opening.
  `start.command` starts both servers, 8642 and 8645.
- **In Finder he sees only what he opens himself** (his request, 2026-09-29: the full list
  felt cluttered). Six things: `originals/`, `ideas/`, the three launchers, `我的筆記.txt`.
  Everything else is flagged hidden for Finder by `python3 tools/finder_view.py`. Nothing is
  moved or renamed, so every path in this file still holds. **Rerun it after adding or
  replacing anything at the top level, and at sign-off:** a file written afresh loses the
  flag. The launchers rerun it too. A new working file goes in its `HIDE` list. `--show` brings
  everything back. `experiments/` comes into view by itself while a trial is open.
- Anything a visitor's browser needs goes in `design 1/`. Anything else stays out of it: no
  notes, no originals, no scripts, no README.
- After any change to the layout, run `python3 tools/check_site.py`. It follows every link,
  photo, font and icon on every page and reports what leads nowhere. Before a risky change use
  `--save <file>`, after it `--compare <file>`, with the file in the scratchpad, not in the
  project.

## Structure — the pages are built, not hand-written

Nav: Gallery 作品集 · Destinations 目的地 · Blog 網誌 · Skills 攝影技巧 · About 關於我.
Destinations drills down: 7 continents → country pages → guides (`design 1/posts/`).

**Every `.html` page in `design 1/` is written out by `python3 tools/build.py`. Never hand-edit the
HTML** —
the next build overwrites it. Change the source, then rebuild:

| To change | Edit |
|---|---|
| photographs, countries, continents, guides, shared wording | `data/site.json` |
| a guide's text | `content/<name>.body.html` and `content/<name>.i18n.json` |
| page layout, the `<head>`, top bar, footer | `tools/build.py` |
| how anything looks | `design 1/css/style.css` |
| behaviour (language switch, photo viewer) | `design 1/js/main.js` |

**Typefaces live with the site**, in `design 1/fonts/` (his permission, 2026-09-28). Pages never contact
Google Fonts. `design 1/css/fonts.css` is written by `tools/fonts.py`; don't edit it by hand. To change
a typeface or weight, edit `FAMILIES` in that script, delete `design 1/fonts/`, and rerun it. Each
folder keeps its `OFL.txt`, which the font licence requires.

**Site icon — "PT"** (photography tuan), settled 2026-09-28 after three rounds. It sits in his
bookmarks bar beside FinTuan's FT and BodyTuan's BT, so it shares their format — rounded
square, two geometric sans letters — and adds a strip of landscape: a dark ridgeline traced
from the Aoraki photo, a red sun, warm paper sky. Both halves are his call: plain
dark-and-gold letters read as "too techy", and a full illustrated scene with serif letters
didn't look like a sibling of the other two. The icon keeps its own colours, set in
`tools/icons.py`; they are not the site's tokens. Files live in `design 1/icons/`, plus
`design 1/favicon.ico` and `design 1/site.webmanifest`. Don't edit the images by hand: change
`tools/icons.py` and rerun it. The `<head>` tags that point at the icon are written by `tools/build.py`.

## Bilingual rule

**Every user-facing string goes in BOTH languages** — never ship English-only copy. Strings
live in `data/site.json` and `content/*.i18n.json` as `en` / `zh` pairs; wording shared by
every page (menu, footer, viewer) is in `design 1/js/main.js` (`i18n.en` / `i18n.zh`). The build writes
each page's strings into a `window.pageI18n` block and fixes 中文 punctuation on the way.

## Photos — `originals/` is his, `design 1/images/` is the site's

Split by owner on 2026-09-28, at his request, so he can tell at a glance which photo is for
what.

| Folder | Whose | What it holds |
|---|---|---|
| `originals/<country>/` | **his** | full-res files he drops in. **Gitignored** — they stay on his Mac |
| `originals/portfolio/` | **his** | shots he most wants in the Gallery |
| `design 1/images/web/` | the site's | web-sized copies, made by Claude. He never needs to open it |

- **Keep every country folder, empty or not.** He asked for this: the empty ones are where he
  will drop photos later. Don't tidy them away. A new country gets a new folder.
- Web copies are named `<country>-<subject>.jpg`, long edge 2400px, JPEG quality ~62 (aim under
  ~1 MB). `sips -Z 2400 in.jpeg --setProperty formatOptions 62 --out "design 1/images/web/name.jpg"`
- To publish one: make the web copy, add an entry under `"slides"` in `data/site.json`,
  rebuild. The build makes the smaller copies in `design 1/images/web/640/` and `design 1/images/web/1280/`.
- **The photo list** — `originals/photo-list.html`, written by `tools/photo_list.py`. For each
  photo on the site it shows the original it came from and the pages that use it, then the
  originals not yet used, then a count per folder. It is private (it can show unpublished
  photos) and is refreshed by every build. He opens it by double-clicking
  `photo-list.command`. **Rerun it whenever he adds originals.** Originals are matched to web
  copies by the capture time both files carry, so never strip that from a web copy.
- A photograph belongs to a city's book (the US is four: `new-york`, `boston`, `san-francisco`, `los-angeles`, each a `shelf` entry with a `place`) through an optional `"city": "<place>"` on its slide; without it, it belongs to its country's book.
- Camera data shown on the site is read from the photograph's own file. Never invent it.
- Only publish photos he confirms are his own — some "sample pic" links in his planning docs
  are other people's reference shots.

<frontend_aesthetics>
You tend to converge toward generic, "on distribution" outputs. In frontend design, this creates
what users call the "AI slop" aesthetic. Avoid this: make creative, distinctive frontends that
surprise and delight. Focus on:

Typography: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like
Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics.

Color & Theme: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors
with sharp accents outperform timid, evenly-distributed palettes. Draw from IDE themes and
cultural aesthetics for inspiration.

Motion: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML.
Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated
page load with staggered reveals (animation-delay) creates more delight than scattered
micro-interactions.

Backgrounds: Create atmosphere and depth rather than defaulting to solid colors. Layer CSS
gradients, use geometric patterns, or add contextual effects that match the overall aesthetic.

Avoid generic AI-generated aesthetics:
- Overused font families (Inter, Roboto, Arial, system fonts)
- Clichéd color schemes (particularly purple gradients on white backgrounds)
- Predictable layouts and component patterns
- Cookie-cutter design that lacks context-specific character

Use extremes in type: 100/200 weight against 800/900, not 400 against 600. Size jumps of 3x+,
not 1.5x.

Interpret creatively and make unexpected choices that feel genuinely designed for the context.
Vary between light and dark themes, different fonts, different aesthetics. You still tend to
converge on common choices (Space Grotesk, for example) across generations. Avoid this: it is
critical that you think outside the box!
</frontend_aesthetics>

Note: the aesthetics block above is general guidance. Where it conflicts with **the brief**
at the top of this file or with `DESIGN.md`, those win — the owner has already made those calls
deliberately.

## Session log — PROGRESS.md (READ FIRST, WRITE LAST)

- **At the start of every session: read `PROGRESS.md` before doing anything else.** It is the
  handoff note from the last day of work — where we stopped, and what's queued next.
  Treat it as a claim to verify, not gospel: skim the actual files / `git log` to confirm it's
  still true, and correct it if it drifted.
- **When he calls it a day** — "that's it for today", "收工", "done for now", "let's stop here",
  or any similar sign-off — update `PROGRESS.md` *before* the final commit, without being asked.
  Rewrite these sections so they describe today, not history:
  - **現在狀態 / Where things stand** — what actually exists and works right now.
  - **上次做到哪 / Where we left off** — what shipped this session, in his words not commit-speak.
  - **接下來 / Next up** — the concrete first action for next time. One clear starting move,
    not a wish list. Include the file(s) involved so the next session opens fast.
  - **等你決定 / Waiting on you** — anything blocked on his call, so it isn't silently dropped.
  - Stamp the date at the top and keep the file short. Prune anything already done; this is a
    handoff note, not a changelog — `git log` is the changelog.
- Then commit and push it along with the day's work.

## Ideas inbox — IDEAS.md

`IDEAS.md` is where his loose ideas and links to sites he likes are collected (started
2026-09-28). When he drops a URL or an idea, add it there in 繁體中文 with the date and **what
he likes about it** in his own words — ask if he didn't say. Collecting is not a request to
build: don't change the site because of an entry until he asks. A liked site is a source of
qualities, never a template to copy.

Two kinds of entry: (1) ideas about this site, (2) collected links / images / videos.
Image and video files go in `ideas/`, which is **gitignored** — the GitHub repo is public and
saved references are usually other people's work, so they stay on his Mac. Only the notes in
`IDEAS.md` are pushed. Videos can't be watched by Claude: record the link and ask him which
moment he liked.

He reads the list as a Word file, `ideas/靈感整理.docx`. It is generated:
**after every change to `IDEAS.md`, rerun `python3 tools/ideas_doc.py`** and never edit the
Word file by hand. Each entry is a `###` heading followed by `- 欄位: 內容` lines; `類型` sets
the group and `圖片` names a file in `ideas/`.

He asked (2026-09-28) for the Word file to be **readable at a glance**: one table per 類型,
one row per entry, showing only 名稱, 重點, 狀態 and a link. He also wants it **dense**
(about 20 rows a page: single line spacing, small type), tables with a **full drawn frame**,
and the contents table at the top **linked** to each type's table. So every entry needs a `重點`
line, written as **one short phrase** (about 15 characters), and `狀態` is one or two words
(已安裝, 已存檔, 已移除, 未註冊, 收集中). Longer explanation goes in other fields, which stay
in `IDEAS.md` and are not shown in Word. Don't add the same thing twice: check the list first
and merge into the existing entry.

## Build list 建置進度 — TODO.md

`TODO.md` is his list of what the site still needs and how far each thing has got (started
2026-09-29, at his request). The three lists have different jobs: `IDEAS.md` is what he has
seen and liked, `TODO.md` is what he has decided to do, `PROGRESS.md` is where the last session
stopped. When he says he wants to do something, add it here in 繁體中文 with the date. An idea
moves from `IDEAS.md` to here only on his word.

Same format as `IDEAS.md`, same generator. He reads it as `ideas/建置進度.docx`:
**after every change to `TODO.md`, rerun
`python3 tools/ideas_doc.py TODO.md ideas/建置進度.docx --progress`.** He opens it by
double-clicking `建置進度.command`, which rebuilds it first. `--progress` draws the bar at the
top: entries with `狀態` 完成 out of all entries. It counts entries, not effort, so don't
present it as more exact than that. `類型` is the area of work (攻略內容,
網站文字, 功能, 上線). `狀態` is one of 待做, 進行中, 等你決定, 暫緩, 完成. When something is
finished, set `狀態` to 完成 and `類型` to 已完成 and move it to the Done section, in the same
commit as the work. At sign-off, check the list against what the day actually did.

## His own notes 我的筆記 — `我的筆記.txt`

A plain text file at the top level where he writes for himself (started 2026-09-29, at his
request). It opens in TextEdit on a double-click. **It is his: never edit, tidy, reformat or
overwrite it**, not even to mark something as handled. It is **gitignored**: the repo is
public and his notes are private unless he says otherwise.

- **Read it at the start of every session**, right after `PROGRESS.md`, and tell him in a
  line or two what is new since last time.
- What he writes there is a note to himself, not an order. Nothing moves into `TODO.md` or
  `IDEAS.md`, and nothing on the site changes, until he says so in the chat.
- The generated Word files are overwritten on every run, so they are never the place for his
  own writing. If he wants a note attached to one item of the build list, add it to that entry
  in `TODO.md` as a `筆記` field.

## Experiments 試作 — `experiments/`

He is the manager: he discovers a skill or an idea, has it tried on a **copy** of the site,
reviews it, then says keep or drop (set up 2026-09-28). The real site is never the test bed.

- **Start** — when he says "try X as an experiment", or when a change is big and he isn't sure
  he'll keep it, don't edit the real site. From this folder run
  `git worktree add experiments/<name> -b exp/<name>`. One folder and one branch per experiment.
- **Preview** — each experiment gets its own port, counting up from 8643, as an entry in
  `.claude/launch.json`: `"runtimeArgs": ["tools/serve.py", "<port>", "experiments/<name>/design 1"]`.
  The real site stays on 8642 so he can compare side by side.
- **Inside an experiment** — put a short note at the top of its `CLAUDE.md`: what is being
  tried, which skill, and which rules of this file are suspended there. Commit on its branch.
  Branches stay **local** unless he asks for a backup — the GitHub repo is public.
- **Keep** — only on his word. Merge `exp/<name>` into `main`, check the real site in the
  preview, then remove the folder and the branch.
- **Drop** — `git worktree remove experiments/<name>` and `git branch -D exp/<name>`.
  Never drag the folder to the Trash; that leaves a broken link behind.
- `experiments/` is gitignored on `main`, and anything that scans the site for pages must skip
  it (`tools/build.py` only writes the pages it names).
- Ask for a verdict while an experiment is fresh: the longer it sits while `main` moves on, the
  harder it is to merge. List the open ones under 等你決定 in `PROGRESS.md`.

Open now: none.

Dropped on 2026-10-03: `cssglobe`, the opening's globe after a React/Tailwind component he brought
(the Earth map scrolling behind a round window, inset shadows), rebuilt in plain CSS/JS. He dropped
it the same day.

Dropped on 2026-10-03: `earth` and `scope`. `earth` was the opening's globe as a lit Earth built on
the graphics card from the site's own maps (nothing downloaded), after his phone's Earth; `scope`
was the opening as the map seen from far off through a telescope's eyepiece, coming nearer, the
glass opening into the map. He dropped both the same day. The code is in the reflog only.

Dropped on 2026-10-01: `marked-photo`, a friend's idea from a Douyin photo post: a circled spot on the
home windows (Big Ben's clock, the Matterhorn summit), a drawn line to a print of it up close, a few
lines of words and coordinates. He dropped it the same day.

Kept on 2026-10-01: `coverflow`, the guides as a fanned row of all sixteen countries' 3D books
(replacing the five-book still shelf kept earlier the same day). The site just before it is at the
tag `before-coverflow-2026-10-01`.

Kept on 2026-10-01: `bookshelf`, the home page's guides as five books on a 3D shelf (Japan,
Hong Kong, Barcelona, Dubai, London), covers made like printed guides. The site just before
that merge is at the tag `before-bookshelf-2026-10-01`.

Dropped on 2026-10-01: `taste-review`, the Taste skill's audit-first pass on the home page and
the gallery opening. It removed the three doors and the intro's two buttons and the Gallery's
"Portfolio" heading. He preferred the site as it was: the doors and the intro buttons stay.

Kept on 2026-10-01: `impeccable-full`, the full Impeccable procedure (dual-agent critique, 23/32,
its record in `.impeccable/critique/`), then the three P1 fixes he chose plus polish:
Destinations as the continents travelled with true wording, the phone viewer (bar at the bottom,
sized copies, swipe, Back closes it), keyboard and screen-reader access. The site just before that
merge is at the tag `before-impeccable-full-2026-10-01`. A shortened single-context attempt on
2026-09-30 (`skills-review`) was dropped at his request.

Kept on 2026-09-30: `merge-old-layouts`, three things he liked on the site as it was before the
redesign, rebuilt in the current look: the gallery's tight portfolio grid, destinations as seven
continent squares, and the opening photograph staying in place while the page is drawn up over
it. The site just before that merge is at the tag `before-merge-old-layouts-2026-09-30`.

The first experiment, `impeccable` (a full rebuild made with the Impeccable
and taste skills), was **kept** on 2026-09-28 and is now the site. Its three earlier looks are
in the history at the tags `light-table-v1` and `exhibition-hang-v2`.

**Weekly report 週報** (set up 2026-09-28). A scheduled task, `weekly-web-design-report`, runs
every Monday about 9:00 and searches the web for the week's new AI web-design tools, skills,
plugins and news. It writes `ideas/weekly/<date>.md` and builds `ideas/weekly/<date>.docx` with
the same generator (`python3 tools/ideas_doc.py <list.md> <out.docx>`), then hands him the Word
file in the chat. **The report is a menu, not the inbox:** nothing from it goes into `IDEAS.md`
until he says he is interested in an item. Nothing it finds gets installed without his say.

## Working habits

- Commit and push after every meaningful change (owner treats GitHub as autosave).
- After changing `data/`, `content/` or `tools/build.py`, run `python3 tools/build.py` before
  looking at the result.
- Verify visually in the preview before saying something is done.
- **Local server:** `tools/serve.py` on port 8642 — `http.server` plus a no-cache header, so a
  plain reload shows the latest CSS/JS. It serves `design 1/` only, so notes and originals are out
  of its reach, and it is bound to 127.0.0.1 on purpose (site isn't public). He starts it
  himself by double-clicking `start.command`.
- Preview: `.claude/launch.json` → "travel-site" runs the same `tools/serve.py`. If port 8642 is
  already serving (he launched it himself), open the preview by URL instead of by name.

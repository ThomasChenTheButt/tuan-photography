# tuan photography 陳亮元 — project instructions

Personal travel-photography site for Thomas Chen (陳亮元). Plain HTML/CSS/JS, no framework.
Bilingual EN / 繁體中文. Owner is not a developer — explain in plain English, handle all tech.

## The brief (owner-decided — these win over any generic guidance)

- **Mood:** warm editorial magazine × photographer's field journal.
- **Restraint:** clean, minimal, generous white space. Photos talk; text stays quiet.
  When in doubt, remove an element rather than add one.
- **Titles:** plain place names ("Barcelona", not "Barcelona for Photographers: Four Days of…").
  Descriptive detail belongs in the small meta line.
- **References the owner likes:** wilhelmchang.com (presentation, pinned hero, by-country tiles),
  ourtravel.tw (practical guide content: comparison tables, gear lists, timing intel).

## Design system (css/style.css `:root`)

| Token | Value | Use |
|---|---|---|
| `--paper` | `#f6efe3` | page background |
| `--ink` | `#241d15` | body text |
| `--kodak-red` | `#c22c1e` | primary accent, section rules, links |
| `--frame-gold` | `#d9a441` | accent on dark sections |
| `--darkroom` | `#191410` | dark pages (Gallery), footer |
| `--display` | Fraunces | headings |
| `--body` | Noto Serif TC | body (also carries 中文) |
| `--mono` | JetBrains Mono | EXIF-style labels, meta, nav |

Never hard-code colors in components — use the variables.

## Structure

Nav: Destinations 目的地 · Gallery 作品集 · Blog 網誌 · Skills 攝影技巧 · About 關於我.
Destinations drills down: 7 continents → country pages → guides (`posts/`).
Continent/country pages are **generated** by `gen_pages.py` (scratchpad) — edit the data there
and rerun rather than hand-editing, EXCEPT `countries/spain.html`, which is hand-edited.

## Bilingual rule

Shared strings live in `js/main.js` (`i18n.en` / `i18n.zh`); per-page strings in a
`window.pageI18n` block before the script tag. **Every new user-facing string goes in BOTH
languages** — never ship English-only copy.

## Photos

- Owner drops full-res originals into `images/<country>/`. Those are **gitignored** — they stay
  on his Mac.
- The site uses web-sized copies in `images/web/`, named `<country>-<subject>.jpg`,
  long edge 2400px, JPEG quality ~62 (aim under ~1 MB).
  `sips -Z 2400 in.jpeg --setProperty formatOptions 62 --out images/web/name.jpg`
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
Focus on high-impact moments: one well-orchestrated page load with staggered reveals
(animation-delay) creates more delight than scattered micro-interactions.

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
</frontend_aesthetics>

Note: the aesthetics block above is general guidance. Where it conflicts with **the brief**
at the top of this file, the brief wins — the owner has already made those calls deliberately.

## Working habits

- Commit and push after every meaningful change (owner treats GitHub as autosave).
- Verify visually in the preview before saying something is done. The browser caches hard —
  `fetch(url, {cache:'reload'})` then reload, or tell him Cmd+Shift+R.
- Preview: `.claude/launch.json` → "travel-site" on port 8642.

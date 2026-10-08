# Review: pane (車窗)

Verdict: **PASS** (with changes recommended before he sees it)

Reviewed 2026-10-08. Watched at 1280x800 and 375x812 on a stepped clock. File read: `design 1/js/opening/pane.js`. The Codrops RainEffect demo returned 403 to my fetch; I know it: WebGL rain on glass, refracting drops that slide and merge, leaving clear trails through fog.

## What I saw
- 0 to 0.6 s: fogged glass rises on the paper: the photograph soft behind a pale wash, a slant of glare, grain, drops standing on it.
- 0.5 to 1.8 s: a breath clouds it a little (barely visible).
- 1.95 to 2.6 s: a hand wipes an arc across the upper glass: Aoraki is suddenly sharp inside the stroke, beads along its edges, thin streaks inside. 2.64 to 3.24 s: a second arc back across the lower glass. 3.08 to 3.6 s: the rest of the mist lifts.
- Done at 3.77 s, seamless at both widths. Paint cost tiny. No console errors.

## Scorecard
| # | Item | Result |
|---|---|---|
| 1 | Nothing written on the photograph | PASS: streaks and beads are part of the glass and leave with it |
| 2 | Light only | PASS |
| 3 | Ends exactly on the cover | PASS |
| 4 | Not an excluded design | PASS: not ripple (no distortion), not exposure (no stops) |
| 5 | Plain HTML/CSS/JS | PASS: canvas, no WebGL |
| 6 | Borrows, does not copy | PASS: the glass as a second surface, not the demo's refraction or rain |
| 7 | Eye-catching | 4: the wipe is a real gesture and the sharp summit inside the smear is a moment |
| 8 | A photographer's opening | 4: the photograph was taken through a car window; the opening tells its own story |
| 9 | Craft | 3: timing and hand-over are good, but the glass itself is not yet convincing |

## The two questions
- **Does it fit his look?** Yes. Paper, then glass, then his picture, nothing written.
- **As well made as the source?** Not yet. The Codrops glass is wet and physical; here the drops are flat dots.

## What to change (for the builder)
1. The drops: many read as dark specks or dust (the dark lower rim at 0.26 to 0.34 alpha on small radii). Drop the dark rim on radii under 2 px, and give larger drops a lighter, blurred photo inside (a drop shows a tiny inverted, sharper view), so they read as water.
2. The wiped edge carries a grey halo (the 0.4 alpha outer pass). Make the outer pass a feathered gradient, not a second hard path, so the edge looks wet, not outlined.
3. The streaks: white arcs across the sky and summit stay visible until 3.6 s. Make them thinner and fainter (alpha 0.05 to 0.15) and let them evaporate first, so the summit is clean the moment the hand passes.
4. Shorten the fogged hold from 1.95 s to ~1.2 s; the breath is not readable at 0.55 opacity, cut it or make it clearly visible.

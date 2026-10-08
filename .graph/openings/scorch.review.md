# Review: scorch (燒穿), round 2

Verdict: **FAIL**

Reviewed 2026-10-08 (second look, after the builder's rework) by the manager. Watched at 1280x800 and 375x812 on a stepped clock. File read: `design 1/js/opening/scorch.js`. Source: Shadertoy ltV3RG returned 403 to a fetch and a Cloudflare bot check in the browser, which I did not try to get past; judged from the sidecar and the burn-shader genre.

## What I saw
- 0 to 0.06 s: the page's own paper.
- 0.3 s: the first scorch at the bottom left corner (the fix for the dead start works).
- 1.0 s: a ragged hole over the lake, tan heat band, thin char, bright rim, a burning island near the shore. The rim is crisp now (canvas at the window's CSS size).
- 2.0 s: the burn has crossed past the summit; small paper islands and ember specks float over the mountains a moment.
- 2.9 s: only a scrap at the top right remains. 3.2 s: paper gone, done at about 3.4 s, seamless.
- Setup: 59 ms of noise maths on the main thread at 1280x800 before the first frame (expect 200 to 300 ms on a mid phone). Per-frame JS under 2 ms. No console errors.

## Scorecard
| # | Item | Result |
|---|---|---|
| 1 | Nothing written on the photograph | PASS: only the paper burns |
| 2 | Light only | PASS |
| 3 | Ends exactly on the cover | PASS |
| 4 | Not an excluded design | PASS |
| 5 | Plain HTML/CSS/JS | PASS |
| 6 | Borrows, does not copy | PASS |
| 7 | Eye-catching | 4: it is now a real authored moment; the fire front with its islands is striking |
| 8 | A photographer's opening | 2: burning paper has nothing to do with making a landscape photograph. It is the treasure-map / old-letter trope, it destroys the very paper that is his site's identity, and for three seconds the visitor watches the fire, not the mountain |
| 9 | Craft | 4: crisp rim, catches at once, one ease, efficient band repaint, clean end |

## The two questions
- **Does it fit his look?** No. The quiet paper site sets itself on fire. Of the fifteen openings he cut, the slow ones that reveal gradually went first; this is a three-second gradual reveal with a louder effect than any of them.
- **As well made as the source?** Now roughly, yes, on craft. The problem is not how it is made but what it says.

## What to change (for the builder)
The craft is no longer the issue; the subject is. I do not recommend another round of polishing the fire. If the builder wants to keep the quality that works here (a noise-shaped front that catches and runs, so the photograph is uncovered unevenly, as if by a material), change the material to one that belongs to photography and to paper without destroying it:
1. Replace the fire with something a photographer does to paper: for example the front as a developer or fixer line washing across a print, or light leaking across unexposed paper. Keep the noise-shaped front, the fast catch and the run; drop the char, the ember and the browning band.
2. Whatever the material, halve the crossing: 1.4 to 1.8 s, not 3 s. His kept openings are all quick and decisive.
3. Precompute the noise at quarter resolution and interpolate (or do it in chunks across the first frames) so a phone does not freeze 200 to 300 ms before the first frame.

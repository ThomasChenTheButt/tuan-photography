# Review: outline (山的輪廓)

Verdict: **PASS**

Reviewed 2026-10-08. Watched at 1280x800 and 375x812 on a stepped clock. File read: `design 1/js/opening/outline.js`.

## The source
Art of the Title, The Leftovers season 2 (Elastic, 2015): everyday photographs in which the departed are silhouettes filled with clouds, stars, sunsets. The quality: a photograph that is whole except for one shape, so the eye goes straight to the hole.

## What I saw
- 0.15 to 0.85 s: the photograph comes up out of the paper, already whole except the range: Aoraki and its mountains are a single paper-coloured shape, cut exactly to the ridge and the land line, tucked softly behind the car's frame. A very slow settle (scale 1.05 to 1) toward the summit.
- 2.3 s: in one frame the mountains fill their own outline. The photograph is complete.
- Done at 3.13 s, seamless (same file as the cover, same crop). Phone crop is correct: the hole follows the peaks in portrait too. No console errors.

## Scorecard
| # | Item | Result |
|---|---|---|
| 1 | Nothing written on the photograph | PASS: the hole is bare paper, no word, line or mark |
| 2 | Light only | PASS: paper stage |
| 3 | Ends exactly on the cover | PASS |
| 4 | Not an excluded design | PASS: not letters (his name as a window) and not the circled spot |
| 5 | Plain HTML/CSS/JS | PASS: one SVG with a traced path and a soft mask |
| 6 | Borrows, does not copy | PASS: takes only "whole except one shape"; nothing of the montage or skies |
| 7 | Eye-catching | 4: a mountain-shaped absence in a real photograph stops you; the fill is a decisive one-frame event |
| 8 | A photographer's opening | 4: it withholds his subject and then gives it; by the end only the photograph is there |
| 9 | Craft | 4: accurate trace, soft hand-off at the car frame, one ease, 3.1 s, exact hand-over |

## The two questions
- **Does it fit his look?** Yes. Paper and photograph only, quiet, and the mountain is the hero.
- **As well made as the source?** Close. The Leftovers silhouettes are filled with something; here the hole stays plain paper, which suits this site and is cleaner.

## What to change (for the builder) before he sees it
1. The bare paper is very bright against the sky and reads for a moment like blown-out snow. Try the hole a few points darker than the page (the stone token) so it reads as paper, not as an overexposed mountain.
2. The 1.05 to 1 settle is almost invisible; either drop it (stillness makes the fill stronger) or make it a clear 1.08 so it means something.
3. Consider a slightly shorter hold (fill at ~1.8 s instead of 2.3 s); the hole is understood quickly.

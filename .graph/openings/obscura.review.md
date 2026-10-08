# Review: obscura (暗箱)

Verdict: **PASS** (narrowly; changes recommended before he sees it)

Reviewed 2026-10-08. Watched at 1280x800 and 375x812 (Web Animations stepped by hand). File read: `design 1/js/opening/obscura.js`. Source read: abelardomorell.net, Camera Obscura.

## The source
Morell blacks out a room and lets a pinhole (later a lens) throw the landscape upside down across walls and furniture; later a prism rights it so room and view are "more equal partners". The quality: the world arriving inverted in the dark, and then righted.

## What I saw
- 0 to 0.9 s: the photograph appears upside down, at 80% size, centred on the paper, at 0.8 opacity and half brightness.
- 0.9 to 1.7 s: held. Over warm paper the dim picture reads milky and washed, not dark like a ground glass under a cloth.
- 1.7 to 3.5 s: one 180 degree turn while it grows to the full window; the light comes up inside the turn. Mid-turn the picture is a tilted card on paper with its corners showing.
- Done at 3.9 s, seamless. No console errors.

## Scorecard
| # | Item | Result |
|---|---|---|
| 1 | Nothing written on the photograph | PASS |
| 2 | Light only | PASS |
| 3 | Ends exactly on the cover | PASS |
| 4 | Not an excluded design | PASS: not a globe, not orbit; a turn of the picture itself |
| 5 | Plain HTML/CSS/JS | PASS: two Web Animations |
| 6 | Borrows, does not copy | PASS |
| 7 | Eye-catching | 3: an upside-down landscape makes you look; the turn is one clear event |
| 8 | A photographer's opening | 4: every large-format photographer composes on an inverted ground glass; this is his craft |
| 9 | Craft | 3: one ease, right length, clean end; but the dim state looks washed out and the spin with exposed corners is close to a slide-show transition |

## The two questions
- **Does it fit his look?** Yes: paper, his photograph, nothing written, and it ends plainly on the cover.
- **As well made as the source?** No. Morell's images are about darkness filled with an inverted world; here there is no dark and no glass, just a faded print spinning.

## What to change (for the builder)
1. Make the inverted state look like a ground glass, not a faded print: put it on a dark stage (allowed during the opening), at full size, low brightness, with a faint fresnel/grain texture and slightly soft focus. Keep it upside down AND mirrored left-right (rotate 180 already does both, keep that).
2. Replace the spin. A 180 degree rotation plus scale reads as a presentation transition. Truer to the source and more decisive: the image flips in one cut (the prism, or the photographer pulling his head out from under the cloth), with the focus snapping sharp and the light coming up at the same instant, then a 300 ms settle. If a turn is kept, keep it full-window so no paper corners ever show.
3. Shorten the hold from 800 ms to ~500 ms; total about 2.5 to 3 s.

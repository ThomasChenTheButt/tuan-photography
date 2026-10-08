# Review: fold (對摺)

Verdict: **PASS** (with changes recommended before he sees it)

Reviewed 2026-10-08. Watched at 1280x800 and 375x812 on a stepped clock. File read: `design 1/js/opening/fold.js`.

## The source
Art of the Title, Dark (2017) main title: a slow, disquieting kaleidoscope where real footage is mirrored on its own axis, doorways folding into themselves. The quality: a real picture made strangely symmetrical.

## What I saw
- 0 to 0.6 s: the folded picture rises out of the dark stage. The left half of his photograph mirrored onto the right: two Aoraki summits meet in an M, the car frame becomes a symmetrical windscreen. On the phone it is even stronger: a twin peak with a heart-shaped valley. Uncanny and immediately arresting.
- 0.6 to 1.9 s: held.
- 1.9 to 5.3 s: the mirrored half lifts on the seam and swings 180 degrees over onto the left half in perspective, revealing the true right half (the wing mirror, the far hills). Mid-turn it reads as a page turning; a soft shadow lies along the seam.
- 5.45 s: the flap is removed, the base is the cover, stage fades. Hand-over seamless at both widths. No console errors; per-frame script cost under 0.5 ms.

## Scorecard
| # | Item | Result |
|---|---|---|
| 1 | Nothing written on the photograph | PASS |
| 2 | Light only | PASS: a dark stage only for the first 0.6 s |
| 3 | Ends exactly on the cover | PASS: base image is the cover crop; flap removed before the fade |
| 4 | Not an excluded design | PASS: no mirror or fold among the 21 |
| 5 | Plain HTML/CSS/JS | PASS: one rotateY on a perspective wrapper |
| 6 | Borrows, does not copy | PASS: only the self-mirror, made from his own photograph |
| 7 | Eye-catching | 4: the symmetrical double mountain is a genuine "wait, what?" moment |
| 8 | A photographer's opening | 3: built only from his picture and the picture wins at the end, but the fold is a graphic trick, not a camera act |
| 9 | Craft | 3: clean geometry and a seamless end, but the unfold is a slow 3.4 s ease-in-out, soft where his kept openings are quick |

## The two questions
- **Does it fit his look?** Yes. Only his photograph is on screen, nothing written, and the end is the plain cover.
- **As well made as the source?** The still mirror is as strong as Dark's; the motion is not. Dark's folds are deliberate and graphic; this one is a long page turn.

## What to change (for the builder)
1. Cut UNFOLD from 3400 ms to about 1500 to 1800 ms, with an ease that commits (fast lift, slow landing, e.g. cubic-bezier(0.7, 0, 0.2, 1)). He keeps the quick, decisive openings.
2. Keep the hold, 1.2 to 1.5 s: the mirror needs to be read. Total should land around 3.5 to 4 s.
3. Start on the folded picture at full strength instead of fading up from black: the dark 0.6 s fade is the generic part. A cut from the dark stage to the mirror is more decisive.
4. Check the shade band: at 90 degrees the seam shadow is the darkest moment; keep it under ~0.35 so it does not read as a black bar on the phone.

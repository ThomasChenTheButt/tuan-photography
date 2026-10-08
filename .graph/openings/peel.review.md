# Review: peel (撕開即顯)

Verdict: **FAIL** (item 7 graded 2)

Reviewed 2026-10-08 by the manager. Watched at 1280x800 and 375x812 on a stepped clock (the browser pane was hidden, so `img.decode()` stalls in real time; I resolved it and drove `performance.now`, `setTimeout` and `requestAnimationFrame` by hand). File read: `design 1/js/opening/peel.js`. Source read: Wikipedia, Instant film (the peel-apart process: the film is pulled through rollers, the reagent pod bursts, about a minute of waiting, then the negative is peeled off the positive).

## The source
Not a crafted website but a physical act: peel-apart pack film (Polaroid 665, Fuji FP-100C). Its qualities are a sealed wait in which nothing can be seen, the resistance of the seal, the black reagent-wet negative coming away, and a finished print that was there all along. The sidecar borrows the wait, one decisive diagonal pull, and the sheet going dark as it leaves.

## What I saw
- 0 to 1.5 s: a blank sheet of the page's own paper with a faint fibre grain. Nothing happens.
- 1.5 to 2.3 s: the lower right corner lifts. Because the ease is `u^2.2`, the line has travelled only about 47 px (desktop) at 2.0 s and about 215 px at 2.5 s. For the first second of the pull it is a small dog-ear in the corner.
- 2.6 s: a dark brown triangle folds back over the paper; the wing mirror and the lake show beneath.
- 3.1 s: the flap is a large flat dark-brown slab, about a third of the window on desktop and close to 40% on the phone. Only a narrow light band at the bend breaks it up. The mountain is still hidden.
- 3.5 s: the summit appears; on desktop the slab briefly lines up with the car's pillar, which is handsome but accidental.
- 4.0 s: the sheet leaves past the top left at full speed; canvas cleared; `done` at 4.15 s; stage fades. The stage image and the cover image have the same file, the same rect (0,0,1280,800 and 0,0,375,812), object-fit cover, 50% 50%. Seamless at both widths.
- Phone: the pull runs at 58 degrees, so the line is nearly horizontal and sweeps upward; for most of the run the visitor sees lake, the mountain arrives only in the last half second.
- Script cost per frame under 0.6 ms. No console errors.

## Scorecard
| # | Item | Result |
|---|---|---|
| 1 | Nothing written on the photograph | PASS: nothing is written anywhere |
| 2 | Light only | PASS: the stage is the page's own paper |
| 3 | Ends exactly on the cover | PASS: same file, same rect, same fit; canvas cleared before the fade |
| 4 | Not an excluded design | PASS, narrowly: a reveal from paper, but not counter's wipe-from-below or book's page turn; keep it away from both |
| 5 | Plain HTML/CSS/JS | PASS: one 2D canvas over one img |
| 6 | Borrows, does not copy | PASS: takes a physical process, copies no page |
| 7 | Eye-catching | **2**: what a stranger sees is a page curl, PowerPoint's "Peel Off" / the old web page-peel corner. It is a familiar transition, not an authored moment, and roughly 2.3 s of the 4.15 s show only blank paper or a small dog-ear |
| 8 | A photographer's opening | 3: peel-apart film is a true photographer's act, in the camera-and-film family he kept, and the photograph wins at the end. But nothing on screen says film: the sheet is the page's paper and the underside is a flat brown card, so the idea only lands if you already know pack film |
| 9 | Craft | 3: correct fold geometry, cheap frames, a seamless hand-over, about 4 s. Against that: a dead first half, then a dark slab that outweighs the photograph mid-pull, and a flap with no material (no curvature shading across its width, no sheen, no reagent) |

## The two questions
- **Does it fit his look?** Partly. Warm paper, nothing written, the plain cover at the end: yes. But at 3.1 s the largest thing on screen is a flat dark-brown polygon, not the photograph. His biggest fear is the effect upstaging the picture, and here it does for a full second.
- **As well made as the source?** No. Pack film's strength is touch: the tug against the seal, the glossy wet black negative, a print that feels just made. This is a geometric corner fold with a flat colour on its back. It shows the idea, not the material.

## What to change (for the builder)
1. **Kill the dead start.** Cut `HOLD` from 1500 ms to about 700 ms. Replace `ease = u^2.2`: it spends the first 40% of `PULL` covering 13% of the distance. Use two beats instead. First a tug of about 250 ms: the corner lifts about 4% of `S_END`, holds for 120 ms as if the seal resisted, then gives. Then one sweep of about 1000 to 1200 ms with an ease that commits early and keeps speed to the exit, e.g. cubic-bezier(0.55, 0, 0.35, 1). Aim for a total of 2.6 to 3.2 s. His kept openings are quick and decisive; this one is currently slow, then quick.
2. **Make it film, not a page curl.** The flap must look like the negative coming off: near-black (start at SPENT, not FRESH brown), with a low-contrast wet sheen. Do that with a soft specular band running parallel to the bend and moving with it, plus a faint mottled reagent texture (a second grain pattern, cool and glossy, opacity under 0.12). Do **not** put an inverted image of the photograph on it: that drifts into the excluded `negative`.
3. **Shrink the slab.** Lift the flap off the picture instead of laying it nearly flat. Use theta of about 115 to 135 degrees, not 140 to 166. The visible flap shortens by about a quarter, the cast shadow grows (raise `lift` to about 0.35), and the curl reads in three dimensions. Shade it across its width too, darker toward the far edge, so it is a curved sheet and not a flat polygon.
4. **Give the bend real width.** R is 14 to 40 px but only the first `R` px of the gradient carry light. Draw the curl as a short cylinder: a highlight at about 0.3R, falling to dark at R, so the turn of the sheet is what the eye follows.
5. **Reveal the mountain sooner on the phone.** At 375x812 the 58 degree clamp makes the line sweep up from the lake and the summit comes last. Either pull from the top right corner downward on portrait windows, or widen the clamp toward 65 to 70 degrees so the diagonal crosses the summit by mid-pull.
6. **First frame check.** `peel.js` is loaded as a dynamic script after the page has parsed. Make sure the cover photograph never paints for a frame before the paper sheet covers it (the runtime could give `html.op` a paper-coloured cover until the stage exists). A flash of the picture before the "sealed" sheet ruins the suspense this opening depends on.
7. **Background tabs.** `img.decode()` does not resolve while the tab is hidden, so the sheet waits until the tab is shown and then pulls after 0.5 s. That behaviour is right; keep it, but make sure the 0.5 s minimum stays after the tug change.

When 1 to 4 are done, the peel should read as a quick, tactile pull of a wet black negative off a print that was already there. Then send it back for a second look.

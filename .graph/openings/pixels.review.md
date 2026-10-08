# Review: pixels (畫素), round 2

Verdict: **PASS** (narrowly)

Reviewed 2026-10-08 (second look, after the builder's rework) by the manager. Watched at 1280x800 and 375x812 on a stepped clock. File read: `design 1/js/opening/pixels.js`. Source opened: felicityingram.com. Its home page opens on big flat colour blocks (about 8 by 5, no grid, no tint) that cut to the full photograph; the blocks are confident and graphic.

## What I saw
- 0 to 0.56 s: the dark of the camera (two beats).
- 0.56 s: 14 columns of photosites under a red/green/blue tint with a dark grid. On both widths this first frame reads as a blue-green checkerboard; the landscape is not yet recognisable.
- 0.84, 1.12, 1.40, 1.68 s: hard cuts to 28, 56, 112, 224 columns, the tint and grid thinning. From 56 the car window, the mountains and the lake read clearly.
- 1.96 s: the sharp photograph, in the cover's own box. Holds on the dark stage until 3.56 s, then the hand-over, seamless. No console errors.
- Every cut is on one even beat of 280 ms: no acceleration, so it no longer borrows burst's rhythm.

## Scorecard
| # | Item | Result |
|---|---|---|
| 1 | Nothing written on the photograph | PASS |
| 2 | Light only | PASS: dark stage during the opening only |
| 3 | Ends exactly on the cover | PASS: the last beat is the photograph itself at the cover's box and crop |
| 4 | Not an excluded design | PASS: hard cuts of one photograph gaining resolution, on an even beat, is not burst (many photographs, accelerating) |
| 5 | Plain HTML/CSS/JS | PASS |
| 6 | Borrows, does not copy | PASS: takes the stepped, uneased reveal; the sensor framing is its own |
| 7 | Eye-catching | 3: the even, mechanical beat is a real moment; the look itself (a depixelate) is still familiar from the web |
| 8 | A photographer's opening | 3: a sensor readout is a camera idea, and the photograph clearly wins at the end; but the first two frames are a teal checker, not his landscape |
| 9 | Craft | 4: true averages, equal beats from one clock, exact end, no shimmer, no errors |

## The two questions
- **Does it fit his look?** Partly. The camera reason now makes it intentional rather than "still loading", but the tinted grid is screen language on a printed-journal site.
- **As well made as the source?** Not quite. The source's blocks are flat and calm, and read as the picture from the first frame. The added Bayer tint and dark grid make the first frames busier than the source and less like his photograph.

## What to change
1. Halve the Bayer tint (TINT[0] about 0.15, then 0.10, 0.06, 0.03, 0) so the first frame reads as his sky, lake and car frame, with the filter only a whisper.
2. Lighten the grid (GRID[0] about 0.3, and 1 device pixel wide, not 5% of the cell) so it reads as a sensor and not as bathroom tiles.
3. Consider starting at 28 columns on the phone: at 14 across a 375 px screen the cells are 27 px and the picture is lost.
4. Cut the end hold from 1600 ms to about 900 ms; the sharp photograph on the dark stage has already "snapped into place" and the page can arrive.

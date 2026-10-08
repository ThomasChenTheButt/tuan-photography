# Review: register (套印), round 2

Verdict: **PASS**

Reviewed 2026-10-08 (second look, after the builder's rework) by the manager. Watched at 1280x800 and 375x812 on a stepped clock (rAF and timers driven by hand, so the timings are the file's own), plus one real-time run. File read: `design 1/js/opening/register.js`. Source opened: typohypergraphicobject.page (James Langdon's book; the cover is overprinted onto sheets of another printed book, so registration and overprint are the material).

## What I saw
- 0 s: the proof is down at once, in true colour. Every edge carries a thin fringe (about 5 px at desktop, about 2.5 px on the phone); the picture already reads as his photograph. No white strips at the window edges, no false-colour poster.
- 0.25 to 0.63 s: the yellow plate slides home (least visible, as intended).
- 0.82 to 1.2 s: magenta lands; red and cyan fringes remain on the snow ridges.
- 1.42 to 1.8 s: cyan lands; the picture is sharp and true.
- 1.8 s: swap to the true print. I compared the in-register canvas with the photograph drawn at the same crop, pixel by pixel over the whole 2560x1600 canvas: worst difference 0, mean 0. The swap is invisible.
- 3.0 s: hand-over; the stage fades onto the page's own cover with no change. No console errors at either width.

## Scorecard
| # | Item | Result |
|---|---|---|
| 1 | Nothing written on the photograph | PASS: no word, number or mark at any moment |
| 2 | Light only | PASS: paper stage, then the page |
| 3 | Ends exactly on the cover | PASS: the composite equals the photograph to the pixel, then the true image at object-fit cover |
| 4 | Not an excluded design | PASS: nothing excluded works by colour plates coming into register |
| 5 | Plain HTML/CSS/JS | PASS: one 2D canvas, multiply compositing, no library |
| 6 | Borrows, does not copy | PASS: takes the press proof's misregistration, not the book's look |
| 7 | Eye-catching | 3: it is a quiet moment; a stranger will notice the fringes and the three small settles, but it does not stop you the way the aperture or the burst do |
| 8 | A photographer's opening | 4: his landscape is on screen, in its own colours, from the first frame; the effect is a hair on its edges and belongs to the "printed journal" idea of the whole site |
| 9 | Craft | 4: exact composite, one ease, three equal beats, clean hand-over, GPU-cut plates with a checked fallback |

## The two questions
- **Does it fit his look?** Yes. It is the most "printed journal" opening in this round: paper, ink, a proof, and the photograph never stops being the photograph.
- **As well made as the source?** Close. The book's misregistration is ink on paper; here it is light on a screen, but the colours are right (true CMY multiply) and the offsets are a believable hair, not a glitch stripe.

## What to change (refinements, not blockers)
1. Load from what the page already has: `o.src(o.lead)` asks for the 2600 px file, while the cover may have loaded a smaller `currentSrc`. On a first visit over a real connection that is blank paper until the big file arrives. Cut the plates from `o.img.currentSrc` (as `pixels.js` does) and keep the 2600 px only if it is already cached.
2. Give it a little more presence so it reads as authored, not as a display fault: let each plate land with a crisp stop (a 2 to 3 frame settle, a hair past and back) rather than a soft ease-out, so the visitor feels three distinct "clicks" of the press.
3. The 1.2 s hold after register (1.8 to 3.0 s) is a touch long; 0.8 s is enough.

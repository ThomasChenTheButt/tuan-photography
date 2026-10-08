# Review: ridgeline (稜線), round 2

Verdict: **PASS**

Reviewed 2026-10-08 by the manager, after the builder's rework. Watched at 1280x800 and 375x812 (dpr 2). The browser pane was hidden, which pauses requestAnimationFrame, so the run was driven on a stepped clock (performance.now and rAF replaced, the opening re-run, a screenshot at each step). Real-time smoothness was therefore read from the code, not felt. File read: `design 1/js/opening/ridgeline.js`. Source read: Art of the Title, North by Northwest (Saul Bass): a grid on flat green that turns out to be the glass facade of a real building, "cold abstraction to perceived reality".

## What I saw
- 0 to 1.35 s: ink lines (the site's text colour) draw the car window frame and the far shore of the lake on empty paper.
- 0.4 to 2.0 s: the ridge of Aoraki and the range draws, accurately traced: the summit, the dip, the right-hand range running into the top frame.
- 2.0 to 2.5 s: held.
- 2.5 to 3.4 s: the paper splits along the ridge that was just drawn. First a thin blue crack the exact shape of the range (the best frame of the piece), then the sky half lifts and the land half drops, and the snow peaks are there in the gap, then the whole photograph. The cut also runs down the left window frame and the top frame, so the dark of the car opens with it.
- 3.44 s: halves removed, the stage under them is the cover image (same file, object-fit cover, 50% 50%, full window), done() fades the stage. No visible change at the hand-over. No console errors.
- Phone portrait: the frame lines are dropped as asked; the visible part of the ridge (the summit) and the horizon draw at 2 px, then the same split. On the phone the half-stroke of the ridge rides on both paper edges as a dark outline, which reads well. Lines on desktop are 1.25 to 1.5 px and the ridge is hard to tell from the frame lines.

## Scorecard
| # | Item | Result |
|---|---|---|
| 1 | Nothing written on the photograph | PASS: the ink is inside the paper halves (clipped with them), so no line ever lies on the photograph; no words at all |
| 2 | Light only | PASS: warm paper throughout |
| 3 | Ends exactly on the cover | PASS: checked, stage image and cover are the same file, crop and box (0, 0, 1280, 800) |
| 4 | Not an excluded design | PASS: paper splitting along a traced line is unlike letters (paper with a window cut in it), slices or any other on the list |
| 5 | Plain HTML/CSS/JS | PASS: SVG stroke-dashoffset, clip-path polygons, translate3d |
| 6 | Borrows, does not copy | PASS: Bass's quality (the graphic turns out to be the real thing), none of his grid, colour or type |
| 7 | Eye-catching | 4: the crack along the ridge and the paper parting are an authored, memorable moment; the first two seconds of self-drawing hairlines are still the common part |
| 8 | A photographer's opening | 4: it draws his composition (frame, shore, ridge) and the line becomes the cut; the photograph clearly wins at the end |
| 9 | Craft | 4: one ease (cubic in-out) for drawing and parting, 3.4 s total, accurate tracing, frame dropped on portrait, seamless end; desktop strokes still thin |

## The two questions
- **Does it fit his look?** Yes. Ink on warm paper is the printed journal, nothing sits on the photograph, and the paper literally gets out of the photograph's way. It is quick enough at the end to sit with the decisive openings he kept, though the drawing beat is on the slow side.
- **As well made as the source?** Close. Bass's turn from graphic to real is a designed event, and this now has one: the drawn ridge becomes the cut. Bass's lines are bold; these are still timid on desktop.

## What to change (for the builder): polish, not blockers
1. Draw faster: all lines within about 1.4 s (ridge from 0.2 to 1.4 s), hold 0.3 s, split at about 1.7 s, so the total lands near 2.6 s. The split is the moment; get to it sooner.
2. Make the ridge clearly the heaviest line on desktop: 2 px ridge, 1 px frame and shore. The eye should know which line is going to open.
3. On desktop the half-stroke on each paper edge is invisible after the cut; at 2 px it will show as it does on the phone, which is good. Check it stays crisp there.
4. Leave the parting exactly as it is (0.9 s, both halves, edge to edge).

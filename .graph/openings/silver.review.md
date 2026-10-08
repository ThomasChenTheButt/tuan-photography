# Review: silver (銀版), round 2

Verdict: **PASS**

Reviewed 2026-10-08 (second look, after the builder's rework) by the manager. Watched at 1280x800 and 375x812 on a stepped clock. File read: `design 1/js/opening/silver.js`. Source read: Wikipedia, Daguerreotype ("will appear either positive or negative, depending on the angle at which it is viewed").

## What I saw
- 0 s: on the paper stands a silver plate turned 24 degrees in real perspective, carrying the photograph as a cool silver negative: the car frame pale, the sky dark, the snow grey. It reads at once as a picture on metal, not as a loading box.
- 0.15 to 1.4 s: the plate turns towards the visitor.
- About 1.45 s (12 degrees): the negative flips to the positive in about four frames. The middle frame is a grey half-and-half blend; at speed it reads as a flip.
- 1.4 to 2.95 s: the plate goes flat and grows from 0.82 to the full cover frame; the last 0.7 s is a slow creep from 0.94 to 1.0.
- Done at about 3.1 s, seamless onto the cover. No console errors.
- Phone: the tall plate stands well inside the screen; the turn and the flip read beautifully. Desktop: at the start the plate's near edge runs off the window (its projected box is 38 to 1038 px wide and -12 to 812 px tall on a 1280x800 window), so the plate is clipped top and bottom and sits off-centre to the left.

## Scorecard
| # | Item | Result |
|---|---|---|
| 1 | Nothing written on the photograph | PASS |
| 2 | Light only | PASS: paper stage |
| 3 | Ends exactly on the cover | PASS: flat, full frame, positive at full strength, then the page |
| 4 | Not an excluded design | PASS: the plate does grow to the window at the end, but the idea and the moment are the angle-dependent negative/positive flip, which nothing excluded has |
| 5 | Plain HTML/CSS/JS | PASS: CSS 3D transform and filters |
| 6 | Borrows, does not copy | PASS: takes the daguerreotype's angle-dependent image |
| 7 | Eye-catching | 4: a silver negative turning in space and flipping to colour at one angle is a genuine, single authored moment |
| 8 | A photographer's opening | 4: the first photograph process, negative and positive, made with his own picture; the photograph wins and fills the page |
| 9 | Craft | 3: one rotation, one ease, the flip tied to the angle; but the desktop start is clipped and off-centre, and the end creeps |

## The two questions
- **Does it fit his look?** Yes. Quiet paper, one object, no words, and the event is the photograph itself appearing.
- **As well made as the source?** Nearly. It captures the essential daguerreotype experience (mirror-negative turning to positive with the angle); the remaining gap is polish at desktop size.

## What to change (for the builder)
1. Fix the desktop start: compute the plate's projected box at 24 degrees and fit it inside the window with a margin (about 6% each side), centred. In practice S0 about 0.72 at 1280x800, or a longer perspective on landscape windows. The plate must stand whole on the paper at the start, as it does on the phone.
2. Shorten the tail: end the grow with the turn (GROW0 about 600, GROW 1900, both finishing at 2.5 s) or use an ease-out for the last part, so the plate does not creep for 0.7 s.
3. Make the flip read as metal, not a cross-fade: during the 1.8 degree window, let the wash (the silver catching the room) peak briefly at about 0.35 opacity, so the middle frame is a bright silver glint rather than a muddy grey blend.
4. The thin grey edge line on the plate is good while it stands; make sure it is gone by the time it fills the frame (it is, at the end; keep it so).

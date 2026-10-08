# Review: projector (幻燈機), round 3

Verdict: **PASS** (narrowly; fixes below are expected before it is shown to him)

Reviewed 2026-10-08 by the manager, after the builder's second rework. Watched at 1280x800 and 375x812 (dpr 2). The browser pane was hidden (rAF and image decode stall there), so setTimeout, performance.now and every Web Animation were driven on a stepped clock and img.decode was resolved at once; screenshots at each beat and the seat sampled at 0, 36, 72, 110, 150, 180, 240 and 300 ms. File read: `design 1/js/opening/projector.js`. Source read: Wikipedia, Carousel slide projector (the shutter closes during a change, the next slide drops by gravity into the gate, the audience sees a short blackout).

## What I saw
- 0 to 0.6 s: a warm dark room (oklch 19%).
- 0.6 s: a square of projected light appears at 62% of the window (70% on phone), a hair of keystone, a warm centre and darker edges, a soft spill of light on the dark. The first slide is the Matterhorn reflection (Switzerland). The seat: it arrives 32 px high, lands 13 px low at 72 ms with bare lamp light showing above it and blur 3.5 px, rises to sharp by 180 ms, softens to 1.2 px at 240 ms, sharp at 300 ms. At 300 ms this is now readable as a slide landing.
- 1.2 to 1.8 s: the square goes out.
- 1.8 s: Aoraki seats in the same square, same gesture.
- 2.4 to 3.2 s: the square opens out to the full window, the keystone, lamp and spill fade, and it flattens into the cover; held 0.4 s, done at 3.6 s. Checked: frame, gate and cover are all (0, 0, 1280, 800), lamp opacity 0, transform identity. No console errors.
- Phone: the "slide" is the window's shape, a tall narrow door, not a slide. The first slide is loaded from the 1280 file and is visibly soft (about 1.5x upscaled in the square on a 2x phone).

## Scorecard
| # | Item | Result |
|---|---|---|
| 1 | Nothing written on the photograph | PASS: light gradients only, no words or marks |
| 2 | Light only | PASS: a dark stage during the opening only, the page is paper |
| 3 | Ends exactly on the cover | PASS: verified box, crop and flat transform |
| 4 | Not an excluded design | PASS, narrowly: the projected square and the seat make it its own, but the even beats of black between photographs echo burst, and the ending (a framed picture grows to the window) is the same ending as contact, filmstrip, prints and grow |
| 5 | Plain HTML/CSS/JS | PASS: Web Animations, CSS gradients |
| 6 | Borrows, does not copy | PASS: the carousel's rhythm and drop, no projector drawn |
| 7 | Eye-catching | 3: it now reads as a slide show in a dark room, and the landing is visible; but the big move is a scale-up to the window, which strangers have seen many times |
| 8 | A photographer's opening | 4: slides are his medium, both images are landscapes, and his photograph wins |
| 9 | Craft | 3: one ease, even beats, 3.6 s, seamless; but a soft first slide on phone, a window-shaped slide on phone, an almost invisible keystone, and an animated 90 px box-shadow on a near-full-window element (paint-heavy on phones) |

## The two questions
- **Does it fit his look?** Yes, with care: the dark room is a stage, not a theme, and the photograph is the only thing on it. It sits beside the camera and film openings he kept.
- **As well made as the source?** Now mostly. The beat of dark, the square of warm light and the drop-and-rise are there. What is still missing is the slide itself: a carousel throws a landscape 3:2 rectangle, and on the phone this throws a tall door.

## What to change (for the builder)
1. Give the projected square a slide's shape, not the window's: 3:2 landscape (or the photograph's own ratio) on every screen, centred; then in the open, animate it to the cover box (the crop change can ride the same 800 ms, object-fit stays cover so the last frame is exact). This matters most on the phone.
2. Load the first slide at the size it is shown: decide from both dimensions and the device pixel ratio (shown height x dpr vs the file's height, not width only). On a 2x phone use the full 2400 file.
3. Do not animate box-shadow. Put the spill on its own pseudo-element (a blurred warm rectangle behind the frame, drawn once) and fade its opacity instead.
4. Make the keystone visible or drop it: at 3 degrees in 1400 px perspective it is invisible. Try 5 to 6 degrees, or remove the rotate and keep the lamp falloff, which already says "projected".
5. Keep the seat exactly as it is now (300 ms, lands 13 px low, soft, rises sharp, focus blip). Keep the even 600 ms beats.
6. Optional, to lift item 7: during the 600 ms change, let the old slide lift out upward by a few pixels in the instant before the shutter closes, as the carousel lifts it back into the tray; it makes the mechanism legible in one more gesture without drawing anything.

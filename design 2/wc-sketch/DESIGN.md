---
name: tuan photography 陳亮元 · design 2 "Pen and wash"
description: A traveller's sketchbook map in fine-liner and light washes; choose a place and the map dives into its photographs.
colors:
  paper: "oklch(98.4% 0.0075 95)"
  paper-2: "oklch(95.4% 0.011 88)"
  ink: "oklch(24.5% 0.008 45)"
  ink-2: "oklch(41% 0.012 60)"
  ink-3: "oklch(62% 0.014 65)"
  hair: "oklch(88% 0.012 80)"
  shade: "oklch(20% 0.012 50)"
  sea: "oklch(82% 0.05 228)"
  sea-deep: "oklch(42% 0.085 240)"
  warm: "oklch(64% 0.15 36)"
  warm-deep: "oklch(49% 0.15 34)"
  warm-wash: "oklch(91.5% 0.04 40)"
  ochre-wash: "oklch(93% 0.04 85)"
  canvas-paper: "#fbfaf5"
  fineliner: "#262221"
  vermilion-head: "#d4523c"
  route-wash: "#e27a62"
  pencil: "#625c56"
  country-lettering: "#686058"
  ocean-lettering: "#306080"
typography:
  display:
    fontFamily: "Alegreya, Noto Serif TC, Georgia, serif"
    fontSize: "clamp(3.2rem, 1.6rem + 6.4vw, 8.6rem)"
    fontWeight: 400
    lineHeight: 0.98
    letterSpacing: "0.01em"
  opening-title:
    fontFamily: "Alegreya, Noto Serif TC, Georgia, serif"
    fontSize: "clamp(2.1rem, 1.2rem + 3.4vw, 4.4rem)"
    fontWeight: 400
    lineHeight: 1.04
    letterSpacing: "0.005em"
  headline:
    fontFamily: "Alegreya, Noto Serif TC, Georgia, serif"
    fontSize: "clamp(2.75rem, 1.5rem + 5vw, 5.25rem)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Alegreya Sans, Noto Sans TC, system-ui, sans-serif"
    fontSize: "clamp(1.8rem, 1.4rem + 1.2vw, 2.35rem)"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  caption:
    fontFamily: "Alegreya, Noto Serif TC, Georgia, serif"
    fontSize: "clamp(1.3rem, 1rem + 0.9vw, 1.7rem)"
    fontWeight: 400
    lineHeight: 1.2
  body:
    fontFamily: "Alegreya Sans, Noto Sans TC, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.5
  reading:
    fontFamily: "Alegreya Sans, Noto Sans TC, system-ui, sans-serif"
    fontSize: "1.0938rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Alegreya Sans, Noto Sans TC, system-ui, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.2em"
  place-name:
    fontFamily: "Alegreya Sans, Noto Sans TC, system-ui, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.07em"
    fontFeature: "small-caps"
rounded:
  none: "0px"
spacing:
  edge: "22px"
  edge-phone: "14px"
  index-width: "23rem"
  touch: "2.75rem"
components:
  word-control:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    height: "2.75rem"
  word-control-hover:
    textColor: "{colors.warm-deep}"
  lang-button:
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    width: "2.75rem"
    height: "2.75rem"
  lang-button-active:
    textColor: "{colors.ink}"
  speed-button:
    textColor: "{colors.ink-2}"
    height: "2.75rem"
    width: "2.75rem"
  speed-button-active:
    textColor: "{colors.ink}"
  cover-caption:
    textColor: "{colors.paper}"
    typography: "{typography.caption}"
  index-panel:
    backgroundColor: "{colors.paper}"
    width: "{spacing.index-width}"
    rounded: "{rounded.none}"
  journey-date-active:
    backgroundColor: "{colors.ochre-wash}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
  note-card:
    backgroundColor: "oklch(96.4% 0.016 228)"
    padding: "1.25rem 1.5rem"
    rounded: "{rounded.none}"
---

# Design System: tuan photography 陳亮元 · design 2 "Pen and wash"

This file describes the build in `design 2/wc-sketch/` only. The root `DESIGN.md` describes design 1, the live site, and is separate. The other folders in `design 2/` (atlas, departures, dive, emboss, flyover, globe, inkwash, marked, orbit, pinned, plate, relief, riso, routes, watercolour, wc-classic, wc-indigo, wc-wet) are earlier alternatives. Nobody maintains them and they are not part of this system. Shared inputs: `design 2/data.js` is written by `tools/build2.py` from `data/site.json` and must never be edited by hand. Fonts and images are links to design 1's folders.

## Overview

### Files (arranged 2026-10-04, his call: the opening and the map kept apart)

| File | What it is |
|---|---|
| `index.html`, `style.css` | the one page and its stylesheet |
| `paint.js` | the shared brushes: paper, washes, pen, lettering, the plate projection |
| `app.js` | the page: the map, the books, the pages, the Flights view, the words in both languages, and the glue that plays an opening then hands over to the map |
| `map/flights.js` | the map's globes: the small one in the corner with its ambient flights, the large one of the Flights view; lends a few brushes to the opening as `WC.pen` |
| `map/*.json` | the lakes |
| `opening/` | one file per opening candidate, each loaded by the page and chosen from the address: `globe.js` (the globe that unrolls into the map, looks 1 to 4), `corridor.js` (the corridor of prints, `?opening=corridor`), `photoball.js` (look 4's ball of photographs). A new candidate is a new file here, speaking the same words to `app.js`: play, skip, hand over |


**Creative North Star: "The Traveller's Sketchbook Map"**

The whole site is one sheet of cold-press sketchbook paper with the world drawn on it the urban sketcher's way: fine-liner first (coasts whose weight swells and thins with the nib, borders as a lighter broken line, mountains hatched from real relief), then light washes laid a few pixels off the lines. The map is the home page. Visitors travel across it instead of scrolling. A place is chosen by its book, and the map dives into that place until the photograph takes the whole window. Under the photograph the place's page or guide rises like a page turned up over a cover.

It is light and quiet. The paper does most of the work, the ink carries the structure, and colour is a wash, never a fill. Controls are words lettered in the margins, with no bars, panels or icons over the map. The photographs are the only full-strength colour anywhere, and nothing competes with them: when one is on screen, the drawing behind it softens and fades.

**Key Characteristics:**
- One sheet of paper, edge to edge, with its tooth laid over the whole map. Light only.
- Pen first, wash second. Washes sit slightly off their lines and leave white paper showing through.
- Every country lettered by hand in Alegreya Sans small capitals. Names of his places in Alegreya serif.
- Vermilion is the travelling colour: the heads of flights, the dots inside place marks, and the warm wash on countries travelled.
- Square corners on every box. Round shapes appear only as pen marks: rings, dots and the globe.
- Every control is a word, and every string comes in English and 繁體中文.

## Colors

Paper, a near-black fine-liner, and four let-down watercolour washes (cerulean, yellow ochre, sap green, vermilion toward rose). Everything else is a step of ink.

### Primary
- **Travelling Vermilion** (`warm`, `vermilion-head` on canvas): the pigment of movement and of where he has been. On canvas it is the head of every flight, the centre dot of each place mark and photograph spot, and (as `route-wash`) the wash laid under a route and swelled in the finale. In CSS it is the current-section dot in a guide's contents and the "best time" dot in tables.
- **Deep Vermilion** (`warm-deep`): the answer to a hand. Hover colour for words and links, the focus ring (2px outline, 3px offset), the caret, and the "ate here" mark in guide tables.
- **Vermilion Wash** (`warm-wash`): text selection, and the hover tint of paper-coloured controls on the cover.

### Secondary
- **Cerulean Sea** (`sea`): the sea wash's hue in CSS. On the map, the sea is bare paper with a pale cerulean band hugging each coast and drying out offshore.
- **Deep Cerulean** (`sea-deep`): the link colour in running text, and the light-condition line on a guide's days.
- **Ocean Lettering** (`ocean-lettering`): the five ocean names, in italic, which fade out as the map zooms in past about 16px per degree.

### Tertiary
- **Ochre Wash** (`ochre-wash`): the fallback of the ochre brush dab that marks the journey being followed in the Flights list.

### Neutral
- **Sketchbook Paper** (`paper`, and `canvas-paper` on canvas): the ground of everything: the page, the map, panels, the Flights spread, and the halo behind any lettering laid over paint.
- **Second Paper** (`paper-2`): what an image shows while it loads, and empty photo frames.
- **Fine-liner** (`ink`, `fineliner` on canvas): text, coasts (90% opacity), lake shores (82%), borders (38 to 46%, dashed), hatching (58 to 66%), routes and rings.
- **Faded Ink** (`ink-2`): secondary text, the margins' lettering, meta lines, idle controls.
- **Pencil-pale Ink** (`ink-3`): disabled zoom words, separators inside names, the Speed label.
- **Pencil** (`pencil`): the small graticule crosses at 26% opacity, every 30° (10° and 5° closer in).
- **Country Lettering** (`country-lettering`): every country that is not his, lettered quietly on canvas.
- **Hairline** (`hair`): rules between list rows, panel heads and scrollbars.
- **Shade** (`shade`): the backing behind a cover photograph, and the base of shadows.

### The washes (canvas transmittances, `paint.js`)
Applied as multipliers over the paper (251, 250, 245), not as fills: sea cerulean (0.6, 0.81, 0.93), yellow ochre (0.97, 0.88, 0.66) let into sap green (0.8, 0.89, 0.66) on land, a grey-blue breath for ice (0.9, 0.93, 0.96) above about 58° that fades out before the poles, and vermilion toward rose (0.98, 0.66, 0.57) on every travelled country. Deserts (latitudes about 10 to 45° N and 13 to 38° S) lean to ochre. The book covers keep design 1's own tokens (clay, olive, slate on their spines), scoped to the books only.

### Named Rules
**The Wash, Never Fill Rule.** Colour reaches the map only as a transparent wash multiplied over paper: blotched, granulated, its edge wandering, and laid a few pixels off its pen line, with white sparkle wherever the brush skipped. A flat opaque colour on the map is wrong.

**The Travelling Vermilion Rule.** Vermilion marks travel: places he has been, routes, and the things moving along them. It is never a background, a button fill or decoration. Hover and focus use the deep step only.

**The No Hard-coded Ink Rule.** CSS colours come from the `:root` tokens. Canvas colours come from `WC.PAPER`, `WC.ink()` and the constants named here. A new colour gets a token first.

## Typography

**Display Font:** Alegreya (with Noto Serif TC, Georgia)
**Body and Lettering Font:** Alegreya Sans (with Noto Sans TC, system-ui)
**中文:** Noto Serif TC 500 for names and titles, Noto Sans TC for text and map lettering

**Character:** a calligraphic book serif for names you arrive at, and its humanist sans sibling for everything lettered by hand. They are one family, which keeps the sketchbook in one hand. Small capitals and spaced capitals stand in for the steady lettering a sketcher uses for labels.

### Hierarchy
- **Display** (Alegreya 400, `clamp(3.2rem, 1.6rem + 6.4vw, 8.6rem)`, 0.98): the arrival name card only. 中文: Noto Serif TC 500, tracking 0.16em, `clamp(2.8rem, 1.4rem + 5.4vw, 7.2rem)`.
- **Opening title** (Alegreya 400, `clamp(2.1rem, 1.2rem + 3.4vw, 4.4rem)`, 1.04): "Tuan, Through the Lens" / Tuan 的鏡頭之旅, with "tuan photography 陳亮元" under it in 0.78rem spaced capitals (0.34em). 中文 tracking 0.14em.
- **Headline** (`clamp(2.75rem, 1.5rem + 5vw, 5.25rem)`, 400, 1): a place page's title, in Alegreya. The Barcelona guide's title uses the same size in Alegreya Sans 400. 中文 for both: Noto Serif TC 500, 0.06em, line-height 1.15.
- **Title** (Alegreya Sans 400, `clamp(1.8rem, 1.4rem + 1.2vw, 2.35rem)`, 1.1): guide section headings, each underlined by a cerulean brush stroke. The Flights title is `clamp(2.4rem, 1.6rem + 2.4vw, 3.6rem)`.
- **Caption** (Alegreya 400, `clamp(1.3rem, 1rem + 0.9vw, 1.7rem)`, 1.2): the place name on the cover, followed by the country (0.95rem) and the count (0.85rem, tabular).
- **Body** (Alegreya Sans 400, 1.0625rem, 1.5; 1rem on phones; 中文 line-height 1.7): interface text. **Reading** (1.0938rem, 1.65; 中文 1.9, 0.02em; 65ch): guide prose.
- **Ledes** (1.35rem italic on place pages; 1.05rem italic in Flights): in 中文 the italic is dropped.
- **Label** (Alegreya Sans 500, 0.72rem, 0.2em, uppercase; 中文 0.8rem, 0.26em, no case change): every word-control, menu word, index head, journey date and table head.
- **Map lettering** (canvas, Alegreya Sans 500 in small capitals, each glyph a hair off the baseline and slightly turned, on a 3.2px paper halo): countries by rank at 13, 13, 13, 12, 11.2, 10.6, 10.2, 10px (中文 Noto Sans TC 12 to 10.5px). Lower-ranked names appear only once the zoom passes their minimum. Names never overlap each other, his books or his book labels.
- **Place names on the map** (Alegreya Sans 700, 0.9rem, small-caps, 0.07em; 中文 0.86rem 600, 0.14em): under each book, with a paper text-stroke halo (3.5px). The dates in italic 0.86rem appear when the book wakes.

### Named Rules
**The Lettered-by-Hand Rule.** Anything written onto the painting carries a paper halo (`-webkit-text-stroke: 3.5px` paper in CSS, a 3.2px stroke on canvas) so it reads over any wash. It is removed in forced-colours mode.

**The Two Hands Rule.** Alegreya serif is for names you arrive at: the opening title, the arrival card, the cover caption and a place's title. Everything else is lettered in Alegreya Sans. In 中文, italic is never used. It becomes upright with added tracking.

## Layout

The map is the page. `.app` is fixed to the window. The map fills it edge to edge in an equirectangular plate centred on 10°E, so the Pacific seam falls where he has not been, stretched upright by 1.25 (`SY` in `app.js`: a degree of latitude is 1.25 degrees of longitude tall) so the whole map stands as tall as a desktop window is to its width, Greenland at the top and Antarctica at the foot (his call, 2026-10-03; countries read a little taller than on a plain plate carrée), and it pans and zooms (1x to 160x). At Whole map on a desktop the books are fitted with more room above (175px) than below (70px), so Europe's cluster stands clear of the top edge and the Southern Ocean is not left empty (his note, 2026-10-03). When the plate is shorter than the window it sits on the window's bottom edge, so Antarctica always covers the foot and the spare room lies above (his call, 2026-10-03); when it is taller, the window stays inside it. There is no header. Margins are set by `--edge` (22px; 14px on phones):
- top-left: the tiny site name, "tuan photography 陳亮元" (0.8rem, ink-2);
- top-right: EN / 中文 and "Instagram tuan_1127";
- bottom-left: the Flights globe (184px; 92px on phones) and the key "Travelled";
- bottom-right: the tally "21 / 195 countries · 11% of the world" (his countries out of the world's 195, his figure; `WORLD_COUNTRIES` in `app.js`), Whole map, and the Photo dial; the row wraps before it reaches the Flights corner. Zoom in, Zoom out and the map credit were removed at his word (2026-10-03): the wheel, a double click, pinch and the + and - keys zoom; Natural Earth is public domain and its licence sits in `vendor/`;
- right edge: a vertical "Photographs 68" tab that opens a 23rem index drawer. The top-right words slide left with it. On phones the tab sits along the bottom and the drawer rises to 72dvh.

**The photograph through the sea** (`MAP_PHOTOS_DEFAULT = 'ocean'` in `app.js`; his call, 2026-10-03). One photograph lies under the whole window, fixed to the screen, and shows only where there is water: the land is punched out of it every frame with the drawing's own land path at the current zoom (the lakes left open), so the paper, wash and pen of the land lie untouched over it, and the paper's tooth is lifted off the whole map so the photograph reads as the real thing, not a print in the paper. During the opening it is the backdrop: from the first frame of the corridor it comes up from nothing behind the prints and the globe (ease-in-out, reaching the set strength as the globe starts to unroll), the turning globe stays a solid paper disc (as the small one bottom-left is), whose paper is gone within the first eighth of the unroll so no white circle spreads over the photograph, and the real map beneath holds it at full strength for the dissolve. Without an opening (a repeat visit in the session) it rises from nothing over 6s once the map is in view; at once under reduced motion. It is drawn at strength 0.9 with no blend, in the full-size copy on large and Retina screens. For now it is one photograph, Aoraki, as its own sea copy cut from the original at the framing he chose, inside the car window (`images/web/new-zealand-aoraki-sea.jpg` with a 1280 copy; `SEA_FILE` in `makeOcean`); `?ocean=all` cycles through every photograph (12s hold, 2.5s crossfade); a hand on a book never changes it, but opening a book crossfades the sea to that place's cover and it stays so back on the map (his calls, 2026-10-03), a dial bottom right ("Photo", 5 to 100) sets the strength live and is remembered on the browser (he keeps it on the page), `?o=0.5` sets it in the address, `?photos=none` turns it off. Where the plate ends above or below, the photograph goes on to the window's edge.

Pages (the leaf) use `.wrap`: `min(76rem, 100% - 2 × clamp(1.25rem, 4vw, 3rem))`, top padding `clamp(2.5rem, 6vw, 4.5rem)`. The guide reads in two columns (a 13rem sticky contents list and the text, gap `clamp(2rem, 5vw, 5rem)`) and goes to one column below 64rem. Photographs on a place page sit in justified rows whose items flex by their aspect ratio (`--ar`), gap 0.85rem, rows 2.75rem apart. On phones they stack.

Flights is a sketchbook spread: the globe sticky on the left page, journeys on the right (`min(36rem, 100%)`), with a faint gutter shadow down the middle. On phones the globe stays pinned at the top above the list. Behind the spread lies a photograph (his request, 2026-10-03): the one the sea shows, and while the hand is on a journey, the cover of that journey's first place that has one (back to the sea's when the hand leaves); two `img` layers crossfade (900ms) at the Photo dial's strength (`--sea`). The journeys page, and on phones the pinned globe, stand on a leaf of paper laid over it (paper at 78% with a 10px blur behind), so the words read.

Breakpoints: 64rem (the guide goes to one column) and 47.99rem (phone). Every touch target is at least 2.75rem.

## Elevation & Depth

Depth is mostly paper and ink: hatching, a paper halo, and a soft blur under the photograph. There are four shadows, all soft and warm-tinted, none of them hard or offset:
- **Lift** (`0 1px 2px oklch(22% 0.025 55 / 0.1), 0 10px 28px -12px oklch(22% 0.025 55 / 0.32)`): the index drawer only.
- **Page rising** (`0 -18px 40px -24px oklch(20% 0.012 50 / 0.45)`): the place or guide page as it rises over the cover.
- **Thumbnail hover** (`0 7px 16px -9px oklch(22% 0.025 55 / 0.5)`, with a 2px lift).
- **The globe's cast shadow**: drawn on canvas as a grey wash with a few hatch strokes through it.

The books are the one truly three-dimensional object. They are design 1's 3D books (perspective 70rem, turned 24°) standing on the map at 0.25 to 0.46 scale (0.17 to 0.32 on phones). Each turns to face you and rises 2rem when woken.

### Named Rules
**The Paper Is the Surface Rule.** Nothing floats over the map except the books and the index drawer. Margins, controls and lettering sit on the paper itself, with no panels or bars.

## Shapes

Square corners everywhere (`border-radius: 0` on every button and box). Rules are 1px hairlines, or 1px ink at the top of a list. Round shapes appear only as pen marks drawn by hand: the place ring (a slightly open, wobbling loop of 1.1 turns), the place mark (3.5px paper dot, ink rim, 1.5px vermilion centre), the flight head, the guide's contents dot, the "best" dot and the hollow tick circles, and the globe itself. Brush dabs (tapered, wandering, pooled at the edge) are painted on canvas from the map's own colours and used as the key's swatch, the ochre mark on the followed journey, the cerulean rule under guide headings and the no-photographs patch.

## Components

### Word controls
Quiet, lettered, at the edges.
- **Shape:** no box and no fill, square corners, at least 2.75rem tall.
- **Default:** label type, ink, underlined 1px at 0.55em offset (`.word`); or ink-2 with no underline for margin words (zoom, language, index close).
- **Hover / Focus:** colour moves to deep vermilion (or ink, for faded words). Focus is a 2px deep-vermilion outline at a 3px offset. On the cover, controls are paper-coloured, hover to vermilion wash, and their focus outline is paper.
- **Selected:** the language and speed words are underlined in ink when pressed (`aria-pressed`).
- **Disabled:** ink-3.

### Books on the map, and their leaders
Design 1's 3D book (cover photograph, a paper band naming the place, spine in clay, olive or slate) stands on its place. Books scale with zoom. A relaxation pass (60 iterations, 0.3 pull toward the true spot) pushes books and their names apart until nothing touches, with a 9px gap (5px on phones). Pushes go sideways by preference and toward each book's own side, so leaders stay short and never cross. A book never covers any place mark, its own included, and never leaves the window while its place is in view. A 0.8px pen leader (ink 60%) runs from the true spot to the book's foot, or to under its name when the spot lies below. On phones, a name that would still collide waits, hidden, until its book wakes.

### The painted map
Painted offscreen into textures per zoom band and region, then placed while panning. Regional paintings fade at their edges.
- **Pen:** coasts split into five pressure classes along each line (weight × 0.55 to 1.6), ink 90%. Borders dashed (2.2 on, 2.8 off), lighter. Lakes are cut out of the land and their shores inked a little lighter: the 50m lakes from afar, the small 10m lakes (Zurich, Lucerne, Como, Garda and others) only very close in.
- **Hatching:** parallel strokes at one angle (−1 rad), 3.1px apart, laid where the shaded relief turns from the light. A light slope gets every fourth line and the steepest gets every line. Strokes are 5 to 11px long with small gaps, each a hair off true, kept off sea and lakes, and none nearer the poles than 70°.
- **Washes:** see Colors. Each wash drifts its own few pixels off the line.
- **Lettering:** oceans in italic, then countries by rank and zoom (see Typography).
- **Photograph spots:** past about 36px per degree each photograph's spot shows as a place mark.

### The dive
Choosing a book: the margins and books fade (420ms). The map flies to the place, a country's land filling the view, or a city with about 7° × 4.5° around it (2000ms). A pen ring tightens on the spot (drawn in 500ms, scale 6 to 1). At 900ms the **arrival name card** rises: the place name in Display type, centred, with the country and coordinates under it in 0.8125rem spaced capitals, on a paper glow, fading in from a 6px blur over 900ms. At 2250ms the photograph dissolves in over the whole window from soft to sharp (opacity 0 to 1, blur 8px to 0, scale 1.04 to 1, 1800ms). The card fades out over 1100ms and the map softens beneath (blur 5px, 55% opacity). A place with no photographs fades its page in at 2500ms instead. Going back reverses the dissolve (1250ms), then the camera draws back (1600ms) while the ring loosens and lets go (1400ms).

### Cover gallery and caption
The photograph fills the window (100svh, object-fit cover) and is swiped, dragged, stepped or wheeled one photograph at a time. It counts from the photograph it opened on. Nothing is written across it. A soft darkening (15rem, max 45%) rises from the bottom edge to carry the **caption** at bottom left: the place in Alegreya, then the country and "1 / N". "Back to the map" sits at top left, Previous and Next at bottom right, and a hint at bottom centre. All are in paper on a soft text-shadow. The words come in after the dissolve. After 2.5s of stillness the controls step back to 62% (the caption stays) and return at once on any input.

### Place page and the Barcelona guide
The page rises over the cover, which stays put. A bar with Back, the place and its coordinates, and EN / 中文 slides down once the page has passed 85% of the cover. **Place page:** title in Alegreya; a quiet status line in spaced capitals (how far the guide has got), then country, dates and photo count; a lede for country books; justified photo rows with captions under them (name, then where in italic); a closing line with words to go on. **Guide:** design 1's guide markup in this system's voice: a 13rem sticky contents list topped by a 1px ink rule (the current section gets a vermilion dot), section titles over a cerulean brush stroke, an "at a glance" card (1px hair border), tables with ink-ruled heads, a day plan in a 10rem column, and cerulean-tinted notes.

### Flights
The corner globe lifts out and grows onto the left page (950ms) of a paper spread with its tooth. Journeys are listed on the right: a date word, the route in italic and each place's thumbnail (a hatched blank where there is no photograph).
- **At rest:** flights leave Taipei for every other place all at once, each with a vermilion head and a fading ink tail. The nearer ones land first, each ringed by the pen. After a pause they leave again. Taipei itself is a small ink dot, never ringed. A drag turns the globe, and a few seconds after the hand lets go it turns back to Taipei.
- **Replay:** hovering or tapping a journey replays it leg by leg in order (on touch the first tap plays and the next dives). The camera frames each leg with the whole country it touches and holds still across consecutive ground legs in the same country. The leg being travelled is named under the globe ("date  From → To, by mode"). Other journeys dim to 55%.
- **Timing:** at most 7s from start to end at 1x. "Slow" gives each leg its full time, up to 16s a journey. 0.5x, 1.5x and 2x scale the whole timetable. The choice is remembered on the browser, and changing it restarts the current journey.
- **Route marks:** a flight is an ink line (1.05px) over a vermilion wash laid off the line, travelled by a small inked airliner seen from above, nose along its course, on a paper halo. A return flight on the same pair is lifted 1.7× higher so the two arcs stand apart. Trans-Pacific flights are bowed toward a steady course so they leave Asia low. Railway: a fine line crossed by sleepers every 6.5px. Car: dashes 2.6 / 2.2. Other ground travel: dashes 4.4 / 3.4. Ground legs carry a small ink capsule with a wash smudge behind it. The parts of a route on the far side of the globe show through it as a fine dotted line at 42%, but not when the globe is seen close through its round frame. Landings ring in with the pen, and crowded rings draw in so they never merge.
- **Finale:** once all of a journey is drawn, a warm wash runs along it from first leg to last (1500ms), the line swells under it and each ring swells once in order. The route stays a little stronger afterwards.
- Close in, the globe hatches mountains in the same strokes as the map and draws the finer lakes.

### Opening
Plays on the first visit of a session only, and never when the address names a page or under reduced motion. Any pointer, wheel, key or touch skips it with a 450ms fade. A painted globe turns for 2.5s under the title, drawn solid (his call, 2026-10-03; `solid` and `style` in `WC.paintGlobe`, flattening out as it unrolls) in one of three looks he is choosing between (`?globe=1|2|3|4`, `GLOBE_STYLE_DEFAULT` in `app.js`): 1 wash, a painter's shade deepening toward the limb away from the light, a breath of light upper left, a band of shade inside the rim and a heavier pen line; 2 lit (after his reference, the Earth on a phone's lock screen), the sun off to the left: day on the left, a soft terminator, the right side in night, his places glowing warm like city lights where they lie in the dark, a line of light along the lit limb and a blue atmosphere outside the rim; 3 desk globe, the wash with a brass meridian ring round the limb, tilted with the axis, and the axis pins at the poles; 4 the photo ball (his idea), the sphere covered in his photographs, each on a thin paper mat, laid on the sphere in bands (three at each pole, eight in the middle latitudes, twelve round the equator, so none is squeezed) and wrapped round it on the graphics card (`photoball.js`), lit softly from the upper left, which sits just above it (lowered at his word, 2026-10-03, so the corridor's prints never crowd it), fades up over about 1.1s and loosens its tracking into place. The globe then unrolls into the map's own plate over 1.6s while the title glides to the centre and grows 14%. The globe keeps turning until the map beneath is painted and the sea's photograph is decoded (at most 8s), so the unroll never lands on a half-made page; the backdrop photograph rises from the moment it is decoded, never popping in. From about 78% of the unroll, every flight draws across the flat map (each pair drawn once). The drawing dissolves into the real map (900ms) and the flights and title fade (1200ms), about 7s in all. Then the books, leaders and margins draw in (900ms, 200ms delay). Afterwards the title remains as the page's heading for screen readers only.

**The corridor (`?opening=corridor`; it was the default for a day on 2026-10-03, then taken off at his word after a friend found it odd).** Before the globe, 3.3s of his prints: all 93 photographs in a fixed shuffle, hung round and round until the corridor is covered (about 150 prints on a desktop window, about 55 on a phone), each on a thin mat (`--print`, a shade whiter than the paper) with the Lift shadow, tiling the two walls, floor and ceiling of a corridor of paper drawn in CSS perspective like a pinned wall: down each wall, columns of four prints (three on phones) sharing one width and stacked to fill the height; across the floor and ceiling, rows of three landscapes (one on phones) sharing one height and laid to fill the width; thin gutters between and a hair of jitter so no two columns line up. The floor and ceiling take landscapes only (a grazing angle squashes a print's depth), and a wall column holds at most two portraits. The camera starts some way in (so the far end is a window, not a pinhole) and glides forward on an exponential ease-out (3s), the nearest prints drifting past the edges, while the globe and the name stand at the far end, scaled about the middle of the window, and grow as it nears (both fade in from about 0.7s). From 2.8s the last prints fall away to the sides (500ms, an outward push and a fade) and the opening continues exactly as above, with the globe's hold trimmed from 2.5s to 1.8s: about 9.5s in all. The prints are decoded before it starts, never waiting past 1.5s; one still on its way shows its mat. Only transforms and opacity move; the corridor is hidden from assistive technology and lies over the margin words, so a print leaving past a corner covers them rather than carrying them. Skip, reduced motion and once-a-session behave as above. `OPENING_DEFAULT` in `app.js` says which version a first visit plays (`classic`); `?opening` plays the classic every time and `?opening=corridor` the corridor.

### The traffic
On the home map a few of his flights are always in the air (his request, 2026-10-03: the page was otherwise too still): up to six at a time, never all, each on its own route at its own pace (about 4.5s for a short hop, 11s across the Pacific), a new one leaving 0.5 to 1.6s after one lands, out and home by turns, no route twice in a row. Its own canvas (`.map__sky`) over the pen and under the books, in the opening's hand: the fine ink line flown so far with a thread of wash beside it, the last stretch warming to vermilion behind the small airliner, a ring of the pen where it lands, then the line fades (1.5s). The routes are the same bowed courses the globe and the opening fly. It rests with the small globe (a page or the Flights view open, the tab hidden) and carries on from where it was; hidden during the opening and a dive; none under reduced motion.

### Index of photographs
A drawer of paper with the Lift shadow. Groups by place (spaced-capital name, meta in tabular figures), two-column thumbnails (three on phones) with two-line names. Picking a photograph brings its place into view on the map, and opening it dives in with that photograph as the cover.

### Viewer
A paper sheet over everything: the photograph contained on the left, a 20rem caption column on the right (title, italic meta, coordinates, note, camera facts read from the file), with Previous, Next and Close as words.

### Motion and reduced motion
Two curves: `--ease` `cubic-bezier(0.16, 1, 0.3, 1)` for arrivals and responses, `--soft` `cubic-bezier(0.45, 0, 0.55, 1)` for dissolves. Map zooms use an exponential ease-out (450ms wheel step, 420ms buttons, 260ms arrow-key pans). Strokes draw on like a pen. Fades go through a blur rather than sliding. **Reduced motion:** every CSS transition and animation drops to 1ms. The opening never plays. The dive becomes a jump plus a 300ms fade. The cover steps without sliding. Zooms are instant. The pen-stroke draw-ons, finale sweep and leg-line animation are skipped.

## Do's and Don'ts

### Do:
- **Do** keep the site light only: `color-scheme: light`, paper ground, no dark theme.
- **Do** lay colour on the map as a wash over paper, a few pixels off its pen line, with white paper sparkle left in it.
- **Do** letter everything written on the painting with a paper halo, and countries in Alegreya Sans small capitals by rank.
- **Do** keep vermilion for travel: flight heads, place-mark centres, the travelled-country wash and route washes. Use `warm-deep` for hover and focus.
- **Do** make every control a word of at least 2.75rem, and keep it at the edges.
- **Do** put every string in both English and 繁體中文. In 中文, drop italic and uppercase, add tracking, and use Noto Serif TC 500 for names.
- **Do** strip long dashes from data on the way to the page (ranges become hyphens, asides become commas).
- **Do** keep the Flights replay to 7s at 1x, and keep each leg's country in frame.
- **Do** give every new colour a `:root` token or a named canvas constant before using it.

### Don't:
- **Don't** write anything across a photograph. The cover carries only the bottom-left caption, with its small word-controls at the very edges over a soft darkening.
- **Don't** offer any contact other than Instagram tuan_1127. No email, no form.
- **Don't** single out Taiwan. It is washed like every other country travelled. Taipei appears only as the flights' origin: a small ink dot, never ringed.
- **Don't** show anything that is not his: only his own photographs, his real journeys, dates and places, and camera data read from the file.
- **Don't** use long dashes (– or —) anywhere on the page.
- **Don't** add bars, panels, headers or icons over the map, or round the corners of any box.
- **Don't** fill a shape with flat opaque colour on the map, or use vermilion as a background or button fill.
- **Don't** play the opening for a returning visitor in the same session, under reduced motion, or when the address names a page.

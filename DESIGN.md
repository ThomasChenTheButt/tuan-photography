---
name: tuan photography 陳亮元
description: A quiet gallery. Photographs are shown bare and large; type stays small.
colors:
  bg: "oklch(98.6% 0.002 250)"
  surface: "oklch(96.2% 0.003 250)"
  line: "oklch(89% 0.004 250)"
  text: "oklch(21% 0.006 250)"
  text-2: "oklch(46% 0.008 250)"
  on-text: "oklch(98.6% 0.002 250)"
  bg-dark: "oklch(15.5% 0.004 250)"
  surface-dark: "oklch(19.5% 0.005 250)"
  line-dark: "oklch(29% 0.006 250)"
  text-dark: "oklch(94% 0.003 250)"
  text-2-dark: "oklch(70% 0.006 250)"
  on-text-dark: "oklch(15.5% 0.004 250)"
typography:
  display:
    fontFamily: "Geist, Noto Sans TC, system-ui, sans-serif"
    fontSize: "clamp(2rem, 1.2rem + 3vw, 3.5rem)"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Geist, Noto Sans TC, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 1.2rem + 1.1vw, 2rem)"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Geist, Noto Sans TC, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "-0.012em"
  body:
    fontFamily: "Geist, Noto Sans TC, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Geist, Noto Sans TC, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
  label-strong:
    fontFamily: "Geist, Noto Sans TC, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 500
    lineHeight: 1.2
  caption:
    fontFamily: "Geist, Noto Sans TC, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    fontFeature: "tnum, lnum"
rounded:
  none: "0"
  pill: "999px"
spacing:
  s-1: "0.5rem"
  s-2: "1rem"
  s-3: "1.5rem"
  s-4: "2.5rem"
  s-5: "4.5rem"
  s-6: "8rem"
  gap: "6px"
  edge: "clamp(1.15rem, 4vw, 3.5rem)"
  wide: "90rem"
components:
  button-primary:
    backgroundColor: "{colors.text}"
    textColor: "{colors.on-text}"
    typography: "{typography.label-strong}"
    rounded: "{rounded.pill}"
    padding: "0.85rem 1.4rem"
  button-line:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    typography: "{typography.label-strong}"
    rounded: "{rounded.pill}"
    padding: "0.85rem 1.4rem"
  photograph:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.none}"
  note:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.none}"
    padding: "1.3rem 1.5rem 1.45rem"
  viewer:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.text}"
    rounded: "{rounded.none}"
---

# Design System: tuan photography 陳亮元

## Overview

**Creative North Star: "The Quiet Gallery"**

The site is a quiet gallery. Photographs are shown bare and large, with no frames around them and no labels on top of them. Everything that is not a photograph is small ink on a neutral ground: one sans-serif face, two text colours, hairlines, and a great deal of empty space. The design's job is to stay out of the way. The owner's stated fear is the design upstaging the photographs, and every rule below follows from that.

There are no icons and no accent colour. Controls are words ("Menu", "Previous", "Next", "Close", "Read the guide"). Links are ink with a thin underline. The only colour on a page comes from the photographs themselves. Light and dark follow the visitor's system setting, and the same rules hold in both.

Motion is a response, never a greeting. Nothing animates when a page loads and nothing reveals on scroll. A photograph dims slightly under the pointer; opening one carries it from its place in the row to a large view with the account of how it was made beside it. Work that does not exist yet is said in one plain sentence, never filled with a stand-in.

**Key Characteristics:**
- Bare photographs: no frames, no mounts, no captions or labels laid over them.
- Rows of photographs fill the width and are never cropped; on a phone they stack one per row.
- Ink on a neutral ground, light and dark. No accent colour.
- No icons. Every control is a word.
- One sans-serif family in three weights (400, 500, 600).
- Square corners on photographs and surfaces; the two kinds of button are pills.
- Flat: no shadows and no gradients. Structure is drawn with 1px hairlines and space.
- Both languages are first-class; Chinese has its own line-height, tracking, weight and full-width punctuation.

## Colors

A neutral palette with a barely perceptible cool cast (hue 250, chroma at or below 0.008), in a light set and a dark set that swap under `prefers-color-scheme`. The stylesheet uses six token names; the dark set redefines the same six.

### Neutral
- **Gallery Wall** (`bg` / `bg-dark`): the page ground, the viewer's ground and its backdrop.
- **Holding Grey** (`surface` / `surface-dark`): the fill of a note box, and the colour a photograph's place shows while the file is still loading.
- **Hairline** (`line` / `line-dark`): 1px rules between rows, the rule above the footer and above each continent in the index, the outline of the line button, the divider in the language switch, the slash in a breadcrumb.
- **Ink** (`text` / `text-dark`): reading text, headings, the fill of the primary button, the focus ring, the text selection ground.
- **Second Ink** (`text-2` / `text-2-dark`): quiet text. Sentences under titles, meta lines, menu items at rest, captions, table headers, labels in data lists, places in the index that have no work yet.
- **Reversed Ink** (`on-text` / `on-text-dark`): lettering on an Ink fill (the primary button, selected text).

Measured contrast from the built tokens. Light: Ink on Gallery Wall 17.0:1, Second Ink on Gallery Wall 6.8:1, Second Ink on Holding Grey 6.4:1. Dark: 16.4:1, 7.3:1, 6.9:1. Hairline against the ground measures 1.3:1 to 1.4:1 and is decorative.

### Named Rules
**The No Accent Rule.** There is no accent colour, by the owner's decision. Emphasis is made with Ink against Second Ink, with weight, or with an underline. A colour that is not in the six tokens does not appear in the interface.

**The Photographs Carry The Colour Rule.** Every saturated colour on a page belongs to a photograph. Surfaces, rules and lettering stay neutral in both themes.

**The Same In The Dark Rule.** Dark is not a second design. It is the same six roles with their values exchanged, chosen by the visitor's system setting. There is no theme switch on the page.

## Typography

**Display Font:** Geist (with Noto Sans TC for Chinese, then system-ui, sans-serif)
**Body Font:** Geist (same stack)
**Label/Mono Font:** none. Labels use the same face. Figures use tabular lining numerals.

**Character:** One plain, modern sans-serif at medium weight, set tight for names and open for reading. Hierarchy comes from size and from the two inks, not from a second typeface or heavy weights.

### Hierarchy
- **Display** (500, `clamp(2rem, 1.2rem + 3vw, 3.5rem)`, line-height 1.1, tracking -0.035em): page titles, the home page line, and the name of a guide shown as a feature. In Chinese: weight 600, line-height 1.3, tracking 0.02em.
- **Headline** (500, `clamp(1.5rem, 1.2rem + 1.1vw, 2rem)`, line-height 1.1, tracking -0.025em): section headings, headings inside a guide, the place name in the viewer. The same size at weight 400 and tracking -0.02em sets the country names in the destinations index and the Instagram handle in the footer.
- **Title** (500, 1.25rem, tracking -0.01em to -0.012em, line-height 1.1 to 1.25): continent names in the index, sub-headings in a guide; at weight 400, the name under a tile and the opening paragraph of About (line-height 1.5).
- **Body** (400, 1.0625rem, line-height 1.6): reading text. Paragraphs in a guide are at most 68ch; sentences under a title at most 46ch to 56ch. Emphasis is weight 600. In Chinese: line-height 1.85.
- **Label** (400, 0.9375rem): menu, language switch, breadcrumb, meta lines, table cells, contents list, viewer data, footer. Button labels are the same size at weight 500, line-height 1.2.
- **Caption** (400, 0.8125rem, Second Ink): photograph captions with camera data, table header cells, the "eaten" mark.

### Named Rules
**The One Face Rule.** Everything is set in Geist, with Noto Sans TC for Chinese. No second family, no serif, no handwriting, no monospace. Weights are 400, 500 and 600 only, which are the weights the pages load.

**The Real Figures Rule.** Camera data, times, dates and prices use tabular lining figures, and every camera value shown is read from the photograph's own file. Capture clock time is not shown.

**The Plain Name Rule.** A title is the place's name ("Barcelona", "Spain"). Descriptive detail goes in the small line under it.

**The Quiet Punctuation Rule.** No long dashes in either language: a dash that introduces becomes a colon, one that adds on becomes a comma, and ranges use a plain hyphen. At most one middle dot in a line; a list of places reads as a list, with commas. The build applies this to every string (`no_dash_en`, `no_dash_zh`, `few_dots` in `tools/build.py`).

**The Full-Width Rule.** Chinese strings are set with full-width punctuation and brackets; numbers, times and Latin words keep their own (`zh_punct`). Chinese headings drop the negative tracking, open their line-height and step up to weight 600.

## Layout

Content sits in one centred column, 90rem at its widest, with a fluid side margin (`clamp(1.15rem, 4vw, 3.5rem)`). Spacing uses a six-step scale (0.5, 1, 1.5, 2.5, 4.5, 8rem). Sections are padded 4.5rem top and bottom with no rule between them; a section's heading sits 2.5rem above its content. The page is generous with empty space and spare with elements.

- **Top bar:** the name at the left, a five-item menu and the language switch at the right, all small, in a bar 4.25rem high. Below 52rem the menu collapses behind the word "Menu".
- **Home:** one photograph across the full width of the window (66dvh, between 18rem and 46rem), then the line, one sentence and the two buttons beneath it on the ground, never over the photograph. One column below 52rem, where the photograph is 54dvh.
- **Rows of photographs:** rows are worked out when the pages are built (`rows_of()` in `tools/build.py`). Photographs are split into rows of nearly equal total width, about 3.5 square-widths each, and every photograph grows in proportion to its own shape, so each row fills the column at one height and nothing is cropped. The gap is 6px in both directions. A photograph alone in its row is held to 60rem. Below 40rem photographs stack one per row at full width.
- **Feature:** a guide is shown as a photograph (1.55fr) beside its name (1fr), bottom-aligned. One column below 52rem.
- **Index:** destinations are a list in type. Each continent is a band under a hairline: its name and one sentence in a 16rem column, its countries flowing beside it at Headline size.
- **Reading (guide):** a 14rem sticky contents list beside a text column of at most 46rem. Below 62rem the contents list moves above the text and sets in two columns, one below 30rem.
- **Tables on a phone:** below 40rem each table row becomes a short stack (name, then its facts); the header row is hidden from sight and kept for screen readers.
- **Viewer:** the photograph at the left at its full shape, a 17rem to 22rem column at the right. Below 56rem the photograph comes first and the column follows it.
- **Footer:** a hairline, the Instagram handle at Headline size with the follow button opposite, then a small row with the menu and the copyright line.

## Elevation & Depth

The system is flat. There are no shadows and no gradients anywhere in the stylesheet. Depth is not simulated: a photograph sits directly on the ground, and the only tonal step is Holding Grey, used for the note box and as the resting colour of a photograph's place. The viewer is not a layer above the page; it replaces the page with the same ground.

### Named Rules
**The Flat Rule.** Nothing casts a shadow, at rest or on hover. Separation is made with space first and a 1px hairline second.

**The Answer Only Rule.** Motion answers the visitor and is never an entrance. Built motion: menu and index colours (200ms), button opacity and press (200ms), a photograph dimming under the pointer (260ms), the viewer appearing (320ms fade), a photograph travelling from its row to the viewer (420ms view transition). All use one ease-out curve, `cubic-bezier(0.16, 1, 0.3, 1)`, and all are switched off under `prefers-reduced-motion`.

## Shapes

Photographs and surfaces are square-cornered. The two kinds of button are pills (999px). Nothing else in the system has a radius: the note box, the viewer, table cells and the focus ring are all square.

Lines are 1px and Hairline-coloured. They separate rows in a list, open each continent in the index, and sit above the footer. There are no boxes drawn with borders except the outline of the line button.

There are no icons, by the owner's decision. The breadcrumb separator is a typed slash, and the language switch is divided by a 1px line. Keyboard focus is a 2px Ink outline at a 3px offset.

## Components

### Buttons
Two kinds, both pills, both labelled with words only.
- **Shape:** pill (999px), padding 0.85rem by 1.4rem, label at 0.9375rem weight 500, never wrapping.
- **Primary:** Ink fill with Reversed Ink lettering. Used for the Instagram follow and, in the viewer, "Read the guide".
- **Line:** transparent with a 1px Hairline outline and Ink lettering. Used for the second action on the home page and the way out of an empty page.
- **Hover / Active:** primary drops to 86% opacity; the line button's outline turns to Ink. Pressing moves either down 1px. Transitions 200ms.
- **Text controls:** the menu word, the language switch and the viewer's Previous, Next and Close are plain words with no fill or outline; Second Ink at rest, Ink on hover or when active.

### Navigation
- **Name:** "tuan photography" at weight 500 with 陳亮元 beside it in Second Ink, tracked 0.1em. No logo mark.
- **Menu:** Label size, Second Ink at rest, Ink on hover and for the current page. No underline, no marker.
- **Language switch:** two words, EN and 中文, divided by a 1px line; the active one is Ink.
- **Small screens (below 52rem):** the word "Menu" opens a full-width stack under a hairline; items are Body size in Ink.
- **Path:** on continent, country and guide pages a small breadcrumb in Second Ink sits above the title, separated by typed slashes.
- **Links in text:** inherit the text colour with a 1px underline in Second Ink, offset 0.24em; the underline turns to the text colour on hover.

### Photograph wall (signature)
The unit of the whole site: bare photographs in rows that fill the column.
- **Rows:** computed at build time, each photograph carrying its own aspect ratio (`--ar`), so a row is one height and its photographs keep their shapes.
- **Surface:** no frame, no border, no radius, no caption, no overlay. Holding Grey shows only while the file loads.
- **Hover:** the photograph dims (82% opacity) over 260ms. Nothing moves or grows.
- **Link:** every photograph is a real link to its place in the gallery, so it works without the script; with the script it opens the viewer. Its spoken label is the place name and "how this was made".
- **Phone:** below 40rem the rows dissolve and photographs stack one per row.

### Viewer (looking at one photograph)
A full-screen dialog on the page's own ground. The photograph is shown whole, as large as the window allows. Beside it: Previous, Next and Close as words, the place name at Headline size, where it is in Second Ink, then "How it was made" as a ruled list (best time, focal length, aperture, shutter, ISO, lens, camera) with labels in Second Ink and values in tabular figures. Below the list, a short note, the primary button to the guide, and a quiet link to the map pin. Arrow keys step between photographs, every photograph has its own address (`#view-<id>`), and closing returns focus to the photograph it came from. Below 56rem the word bar sticks to the top.

### Feature (a guide)
A photograph beside the guide's name at Display size, one line of facts in Second Ink with tabular figures, and the underlined words "Read the guide". The whole block is the link; the photograph dims to 86% on hover.

### Index and names
- **Destinations index:** continents as bands under hairlines. Countries with work on the site are Ink and underlined; countries without are Second Ink. A continent with no countries says so in a short phrase.
- **Names:** a flowing list of place names at Headline size in Second Ink, used in the gallery for places that have no photographs yet.
- **Tiles:** on continent pages, a country shown as a photograph in a 3:2 opening with its name centred beneath it, never over it.

### Sheet (table)
Comparison tables in a guide. No fills, no vertical lines, no outer border. Caption at weight 500 in Second Ink, header cells at Caption size with one hairline beneath, a hairline between rows, first column at weight 500 (minimum 9.5rem). The recommended cell is marked by weight 500 only. Times and prices do not wrap and use tabular figures.

### Photographs in a guide
A row of figures that follows the same proportional rule as the wall. Each has a caption beneath it at Caption size: the place name, then focal length, aperture, shutter and ISO in tabular figures.

### Note
An aside in a guide: Holding Grey fill, no border, square corners, padding 1.3rem by 1.5rem, a heading at Body size weight 500, text below.

### Ruled lists
Days in a route (an 8rem column for the day number and its area, then the text, then a quiet line of light times), practical notes, the facts on About (a 9rem label column), and plain rows all share one pattern: 0.75rem to 1.5rem of vertical padding and a hairline between rows, none above the first.

### Contents list
Numbered with tabular figures, Label size, Second Ink; the section being read is Ink.

### Empty state
One sentence in Second Ink, at most 46ch, and a line button that leads somewhere with work. No image, no illustration.

## Do's and Don'ts

### Do:
- **Do** show photographs bare, on the ground, with their words beneath or beside them.
- **Do** let `rows_of()` lay out any row of photographs, so each row fills the column and no photograph is cropped.
- **Do** take every colour from the six tokens, so light and dark both hold.
- **Do** label every control with a word, in both languages.
- **Do** keep photographs and surfaces square, and buttons as pills.
- **Do** separate with space first, then a 1px hairline.
- **Do** set camera data, times, dates and prices in tabular lining figures, and show only values read from the photograph's file.
- **Do** write every string in both languages, with full-width punctuation and open line-height in Chinese.
- **Do** say plainly, in one sentence, when work does not exist yet.
- **Do** switch off every transition under `prefers-reduced-motion`.
- **Do** edit `data/site.json`, `content/` and `tools/build.py`, then rebuild; the HTML pages are written out by the build.

### Don't:
- **Don't** add an accent colour, a tinted link or a coloured button.
- **Don't** add icons, arrows or pictograms to controls or lists.
- **Don't** frame, mount, round, border or shadow a photograph.
- **Don't** set text, labels, badges or gradients on top of a photograph.
- **Don't** crop a photograph in a row to make a grid even.
- **Don't** add a second typeface, or weights outside 400, 500 and 600.
- **Don't** add shadows or gradients to any surface.
- **Don't** add entrance animations, scroll reveals or looping motion.
- **Don't** use long dashes, or more than one middle dot in a line.
- **Don't** fill an empty place with a stand-in image, an invented guide or invented camera data.
- **Don't** round anything except the two buttons.

## Open Decisions and Known Gaps

These are recorded as open. None of them is a settled part of the system.

- **Typeface hosting (waiting on the owner).** Geist and Noto Sans TC (weights 400 to 600) load from fonts.googleapis.com on every page. Hosting the files with the site needs the owner's permission to download them. The families are in use; their delivery is not decided.
- **About biography (waiting on the owner).** The text on the About page is copy carried over from the previous site and has not been confirmed by the owner as his own words. It is not a model for the site's voice.
- **Contact email (waiting on the owner).** No email address is published anywhere on the site. Whether to publish one is undecided.
- **Where a photograph is trimmed.** Rows never crop. Three places fit a photograph to a fixed opening and can trim its edges: the home page photograph (a full-width band), the photograph at the top of a guide (when taller than 82dvh), and tiles on continent pages (3:2). The whole photograph is always available in the viewer. Recorded as built, not as a rule to extend.
- **Hover dimming.** Photographs in a wall dim to 82%; features, tiles and guide figures dim to 86%. One value was probably intended.
- **Line button outline.** The outline is Hairline, 1.3:1 against the ground. The label carries the control; the outline alone would not.
- **Untokenised values.** Each page's browser theme colour is a literal hex pair in the HTML head (`#fafafb` light, `#0e0f11` dark), and neither is an exact conversion of the ground token.

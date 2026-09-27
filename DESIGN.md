---
name: tuan photography 陳亮元
description: A picture editor's light table. The photographs are the only things that glow.
colors:
  table: "oklch(96.4% 0.004 170)"
  table-lit: "oklch(99.2% 0.002 170)"
  table-edge: "oklch(91.5% 0.006 175)"
  hair: "oklch(83% 0.007 180)"
  ink: "oklch(21% 0.008 220)"
  ink-2: "oklch(43% 0.01 215)"
  mount: "oklch(24.5% 0.006 235)"
  mount-lip: "oklch(33% 0.007 235)"
  mount-ink: "oklch(94% 0.004 170)"
  mount-ink-2: "oklch(76% 0.008 190)"
  room: "oklch(14.5% 0.005 235)"
  pencil: "oklch(69% 0.19 46)"
typography:
  display:
    fontFamily: "Libre Franklin, Noto Sans TC, system-ui, sans-serif"
    fontSize: "clamp(2.2rem, 15.4cqi, 5rem)"
    fontWeight: 750
    lineHeight: 0.98
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Libre Franklin, Noto Sans TC, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 1.3rem + 4.4vw, 5rem)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Libre Franklin, Noto Sans TC, system-ui, sans-serif"
    fontSize: "clamp(1.6rem, 1.15rem + 1.7vw, 2.35rem)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.022em"
  lede:
    fontFamily: "Libre Franklin, Noto Sans TC, system-ui, sans-serif"
    fontSize: "1.3125rem"
    fontWeight: 400
    lineHeight: 1.45
  body:
    fontFamily: "Libre Franklin, Noto Sans TC, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Libre Franklin, Noto Sans TC, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
  label-strong:
    fontFamily: "Libre Franklin, Noto Sans TC, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.2
  caption:
    fontFamily: "Libre Franklin, Noto Sans TC, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    fontFeature: "tnum, lnum"
  hand:
    fontFamily: "Iansui, Noto Sans TC, sans-serif"
    fontSize: "clamp(0.875rem, 4.4cqi, 1.6rem)"
    fontWeight: 400
    lineHeight: 1.08
    letterSpacing: "0"
  hand-display:
    fontFamily: "Iansui, Noto Sans TC, sans-serif"
    fontSize: "clamp(2.4rem, 1.2rem + 5vw, 5.2rem)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0"
rounded:
  window: "0"
  focus: "2px"
  switch: "3px"
  box: "4px"
  button: "5px"
  mount: "clamp(4px, 1.6cqi, 12px)"
spacing:
  s-1: "0.5rem"
  s-2: "1rem"
  s-3: "1.5rem"
  s-4: "2.5rem"
  s-5: "4rem"
  s-6: "6.5rem"
  edge: "clamp(1.15rem, 4vw, 3.5rem)"
  wide: "84rem"
components:
  button-primary:
    backgroundColor: "{colors.mount}"
    textColor: "{colors.mount-ink}"
    typography: "{typography.label-strong}"
    rounded: "{rounded.button}"
    padding: "0.85rem 1.15rem"
  button-primary-hover:
    backgroundColor: "{colors.room}"
  button-line:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label-strong}"
    rounded: "{rounded.button}"
    padding: "0.85rem 1.15rem"
  button-line-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.table-lit}"
  button-on-dark:
    backgroundColor: "{colors.mount-ink}"
    textColor: "{colors.room}"
    typography: "{typography.label-strong}"
    rounded: "{rounded.button}"
    padding: "0.85rem 1.15rem"
  button-on-dark-hover:
    backgroundColor: "{colors.table-lit}"
  menu-button:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.box}"
    padding: "0.45rem 0.7rem"
  slide-mount:
    backgroundColor: "{colors.mount}"
    textColor: "{colors.mount-ink}"
    typography: "{typography.hand}"
    rounded: "{rounded.mount}"
  slide-window:
    backgroundColor: "{colors.room}"
    rounded: "{rounded.window}"
    width: "84cqi"
  slide-window-empty:
    backgroundColor: "{colors.table-edge}"
    rounded: "{rounded.window}"
    width: "84cqi"
  note:
    backgroundColor: "{colors.table-lit}"
    textColor: "{colors.ink}"
    rounded: "{rounded.box}"
    padding: "1.15rem 1.35rem 1.3rem"
  viewer:
    backgroundColor: "{colors.room}"
    textColor: "{colors.mount-ink}"
  viewer-button:
    backgroundColor: "transparent"
    textColor: "{colors.mount-ink}"
    rounded: "{rounded.button}"
    size: "2.75rem"
  close:
    backgroundColor: "{colors.room}"
    textColor: "{colors.mount-ink}"
---

# Design System: tuan photography 陳亮元

## Overview

**Creative North Star: "The Light Table"**

The site is a picture editor's light table. The page is a sheet of cool opal acrylic lit from below, brightest a little above the middle and falling off toward the edges. Photographs sit on it in graphite slide mounts, and they are the only things on the table that carry colour. Everything else is one of three materials: table (the lit ground and its hairline rules), mount (the dark card that holds a photograph and the lettering on it), or pencil (a single grease-pencil orange).

The system is quiet and dense in the way a working desk is. Type is a newspaper picture-desk grotesque, printed flat on the table. Place names are written on the mount by hand. Camera data is set in tabular figures and is always real, read from the photograph's own file. Work that does not exist yet is shown as an empty mount with the table showing through its window, never as a stand-in image.

Motion follows one grammar: the lamp strikes once when the visitor arrives (a 1100ms flicker from the dark room to the lit table, once per session), and after that nothing moves unless the visitor picks something up. Picking up a slide turns the lamp off: the room goes dark, the photograph is held up large, and its making is read beside it. The world refuses the category's full-bleed hero slideshow over a white masonry grid, and refuses its moody dark-serif opposite. It carries no cream, no serif, no film-strip ornament and no monospaced labels.

**Key Characteristics:**
- A lit, near-neutral ground with a radial lamp gradient; never a flat white page.
- Graphite mounts with three fixed bands: where, the window, the name.
- Photographs are never cropped; the window takes the photograph's shape inside a square area.
- Two hands: printed grotesque for everything typeset, a handwritten face for what is written on a mount.
- One accent, grease-pencil orange, absent from every page at rest.
- Lists and tables are ruled rows: one ink rule on top, hairlines between.
- Both languages are first-class; Chinese has its own line-height, tracking and full-width punctuation.

## Colors

A near-neutral palette with a faint cool green-to-blue cast (chroma at or below 0.01 everywhere except the pencil), so the photographs supply all the colour on the table.

### Primary
- **Grease Pencil Orange** (`pencil`): the mark a picture editor makes on the chosen slide. It draws the hand-drawn ring around the slide that was last picked up, and it is the keyboard focus ring. It has no other use.

### Neutral
- **Opal Table** (`table`): the lit ground, mid-field of the lamp gradient.
- **Lamp Centre** (`table-lit`): the brightest point of the lamp; also the fill of note boxes and the hover fill of buttons in the dark room.
- **Table Edge** (`table-edge`): the falloff at the edges of the lamp, the document background behind it, and the unlit window of an empty mount.
- **Hairline** (`hair`): 1px rules between rows, borders of note boxes and the menu button, the divider in the language switch.
- **Print Ink** (`ink`): text printed on the table, the top rule of every ruled list, the outline of the line button.
- **Second Ink** (`ink-2`): quiet text on the table: section sentences, row notes, meta lines, table headers, captions.
- **Graphite Mount** (`mount`): the slide mount and the primary button.
- **Mount Lip** (`mount-lip`): the 1px highlight along the top inside edge of a mount.
- **Mount Lettering** (`mount-ink`): text on mounts and in the dark room; the fill of buttons in the dark room.
- **Second Mount Lettering** (`mount-ink-2`): the "where" band on a mount, labels in the viewer's data list, footer text.
- **The Room** (`room`): the room with the lamp off. The viewer, the footer, the inside of a slide window behind its photograph, and the hover fill of the primary button.

### Named Rules
**The One Pencil Rule.** Grease-pencil orange marks the slide that was last picked up and the keyboard focus ring. It appears on no page at rest. It is never a link colour, a button fill, a heading colour or a decoration.

**The Only Glow Rule.** Photographs are the only saturated colour on the table. Every surface, rule and letter stays near-neutral, so nothing competes with the pictures.

**The Two Grounds Rule.** Text on the table uses the two inks; text on a mount or in the room uses the two mount letterings. The pairs are not swapped.

Measured contrast from the built tokens: Print Ink on Opal Table 16.0:1, Second Ink on Opal Table 7.3:1, Mount Lettering on Graphite Mount 13.6:1, Second Mount Lettering on Graphite Mount 7.6:1. The pencil focus ring measures 5.5:1 on a mount and 6.7:1 in the room, and 2.7:1 on the lit table; the table figure is recorded as measured, not as a target (see Open Decisions and Known Gaps).

## Typography

**Display Font:** Libre Franklin (with Noto Sans TC for Chinese, then system-ui, sans-serif)
**Body Font:** Libre Franklin (same stack)
**Label/Mono Font:** none; labels use the body face. Figures use tabular lining numerals.
**Hand Font:** Iansui (with Noto Sans TC, sans-serif)

**Character:** A picture-desk grotesque set tight and heavy for names and headlines, plain and open for reading, beside a schoolbook handwritten face that carries both Latin and Traditional Chinese. The contrast is between what was printed and what was written on the mount.

### Hierarchy
- **Display** (750, `clamp(2.2rem, 15.4cqi, 5rem)`, line-height 0.98, tracking -0.04em): the home page line only. In Chinese: weight 800, line-height 1.16, tracking 0.01em.
- **Headline** (700, `clamp(2.5rem, 1.3rem + 4.4vw, 5rem)`, line-height 1.08, tracking -0.04em): page titles, which are plain place names or section names. Listing pages are built at -0.035em; guide and About titles at -0.04em. In Chinese: tracking 0.01em to 0.02em, line-height 1.25.
- **Title** (700, `clamp(1.6rem, 1.15rem + 1.7vw, 2.35rem)`, line-height 1.08, tracking -0.022em): section headings and the name in a ruled row. Sub-headings in a guide use 1.3125rem at line-height 1.2.
- **Lede** (400, 1.3125rem, line-height 1.4 to 1.45, Second Ink): the sentence under a page title or beside the lead slide. Maximum 56ch. In Chinese: line-height 1.7 to 1.75.
- **Body** (400, 1.0625rem, line-height 1.55): reading text. Maximum 70ch. Emphasis is weight 650, never italic or colour. In Chinese: line-height 1.8.
- **Label** (400 or 600, 0.9375rem): menu, meta lines, buttons (600), table cells, footer.
- **Caption** (400, 0.8125rem, tabular lining figures, Second Ink): photograph captions with camera data, table headers.
- **Hand** (Iansui 400, `clamp(0.875rem, 4.4cqi, 1.6rem)`, line-height 1.08, tracking 0): the place name on a mount, clamped to two lines. Also the place name in the viewer (`clamp(2rem, 1.5rem + 1.6vw, 2.9rem)`), headings of note boxes (1.45rem), and the Instagram handle in the footer (`clamp(2.4rem, 1.2rem + 5vw, 5.2rem)`).

### Named Rules
**The Two Hands Rule.** Anything typeset is Libre Franklin. The handwritten face is used only for what a person would write by hand: a place name on a mount, the name of the slide being held up, the heading of a note, the handle in the footer. It is never used for body text, menus, buttons or data.

**The Real Figures Rule.** Camera data, times, dates and prices are set in tabular lining figures, and every camera value shown is read from the photograph's file. Capture clock time is not shown.

**The Plain Name Rule.** A title is the place's name. Descriptive detail goes in the meta line under it.

**The Full-Width Rule.** Chinese strings are set with full-width punctuation; numbers, times and Latin words keep their own. Headings in Chinese drop the negative tracking and open their line-height.

## Layout

Content sits in one centred column, 84rem at its widest, with a fluid side margin (`clamp(1.15rem, 4vw, 3.5rem)`). The table's top edge carries the name at the left and a five-item menu, the Instagram link and the language switch at the right, all small. The page ends in the room: a dark band with the handwritten handle, the follow button and a small footer row.

Spacing uses a six-step scale (0.5, 1, 1.5, 2.5, 4, 6.5rem). Sections are padded 4rem top and bottom and separated by a hairline. A section head puts its heading at the left and one quiet sentence (maximum 46ch) at the right on the same baseline.

- **First viewport (home):** two columns, 1.5fr for the lead slide and 1fr for the line, one sentence and the one primary button, top-aligned. One column below 60rem.
- **Slide grid:** `repeat(auto-fill, minmax(min(100%, 22rem), 1fr))` with a fluid gap (`clamp(1.1rem, 2.6vw, 2.5rem)`); two columns between 34rem and 48rem. A small variant uses 10rem columns. Because every mount is square, rows share their lines of lettering, and the grid accepts more photographs without being rebuilt.
- **Ruled rows:** lists of guides and places are a three-column subgrid (name, note, action); the note drops under the name below 46rem.
- **Reading (guide):** a 15rem sticky contents list beside a text column of at most 46rem; body paragraphs at most 70ch. Below 62rem the contents list moves above the text and sets in two columns, one below 30rem.
- **Tables on a phone:** below 40rem each table row becomes a short stack (name, then its facts) and the header row is hidden from sight but kept for screen readers.
- **Empty state:** an empty mount (at most 15rem) beside one sentence and a line button.

## Elevation & Depth

Depth is physical and has three levels. The table is the ground: a fixed radial gradient (`radial-gradient(115% 85% at 50% 30%, table-lit 0%, table 46%, table-edge 100%)`). Mounts rest on the table and are the only elements that cast a shadow. The room is what remains when the lamp is off: the viewer and the footer, flat and dark, where a photograph carries a faint bloom of light instead of a shadow.

### Shadow Vocabulary
- **Mount at rest** (`inset 0 1px 0 mount-lip, 0 0.4cqi 0.9cqi oklch(20% 0.01 235 / 0.28), 0 2cqi 4cqi -1.4cqi oklch(20% 0.01 235 / 0.4)`): a contact shadow plus a lip highlight, scaled to the mount's own width.
- **Mount lifted** (`inset 0 1px 0 mount-lip, 0 0.6cqi 1.2cqi oklch(20% 0.01 235 / 0.26), 0 4cqi 6cqi -2cqi oklch(20% 0.01 235 / 0.45)` with `translateY(-0.7cqi)`): hover on a mount that can be picked up.
- **Window cut** (`0 0 0 1px oklch(0% 0 0 / 0.55), 0 0 3cqi oklch(100% 0 0 / 0.08)`): the cut edge of the window and the light coming through it.
- **Empty window** (`0 0 0 1px oklch(0% 0 0 / 0.5), inset 0 0.6cqi 3cqi oklch(40% 0.01 220 / 0.3)`): the table seen through an unlit window.
- **Held to the light** (`0 0 5rem oklch(100% 0 0 / 0.06)`): the photograph in the viewer.

### Named Rules
**The Mounts Cast Shadows Rule.** Only a mount casts a shadow. Text, rows, tables, notes and buttons are printed flat on the table.

**The One Lamp Rule.** The lamp strike is the only entrance motion. Nothing fades, slides or reveals on scroll. Motion after arrival is a response to the visitor: a mount lifting under the pointer (320ms), a slide being picked up (460ms view transition, 420ms fade of the room), the pencil ring drawing itself (700ms), a menu underline (260ms). All use one ease-out curve, `cubic-bezier(0.16, 1, 0.3, 1)`, and all are switched off under `prefers-reduced-motion`.

## Shapes

Photographs and windows have square corners; a photograph is never rounded or clipped. Mounts have softly rounded corners that scale with the mount (`clamp(4px, 1.6cqi, 12px)`). Controls take small radii: buttons 5px, the note box and menu button 4px, language buttons 3px, the focus ring 2px. There are no pills and no circles.

Structure is drawn with 1px lines: an ink rule opens a list or a guide section, hairlines separate its rows. The one irregular shape in the system is the pencil ring, a single hand-drawn loop with a round cap that overshoots its own start.

Icons are line drawings on a 24-unit grid (stroke 1.75, round caps and joins, no fill), sized 1.05em and coloured by the text they sit in. Seven exist: right, left, out, close, menu, check, Instagram.

## Components

### Buttons
Plain and solid, like a label on the desk.
- **Shape:** slightly rounded (5px), padding 0.85rem by 1.15rem, label at 0.9375rem weight 600, optional icon before or after with a 0.6rem gap.
- **Primary:** Graphite Mount fill with Mount Lettering. One per view; on this site it is the Instagram follow.
- **Line:** transparent with a 1px Print Ink outline; used for the way back from an empty page.
- **On dark:** in the viewer and the footer the fill is Mount Lettering with The Room as text.
- **Hover / Active:** primary darkens to The Room; line fills with Print Ink; on dark brightens to Lamp Centre. Pressing moves the button down 1px. Transitions 180ms.
- **Text action:** an inline label with a trailing arrow, weight 600, underlined on hover ("Open the guide", "See every destination").

### Navigation
- **Style:** the name at weight 650 with 陳亮元 beside it, tracked 0.08em; menu items at 0.9375rem, no underline at rest.
- **Hover / current:** a 1.5px underline in the text colour grows from the left in 260ms; the current page keeps it.
- **Language switch:** two text buttons, EN and 中文, divided by a hairline; the active one is Print Ink at weight 650, the other Second Ink.
- **Small screens (below 60rem):** a bordered "Menu" button opens a full-width stack of ruled rows; the current page is marked by weight 650.
- **Path:** on country, continent and guide pages a small breadcrumb in Second Ink sits above the title, separated by hairline-coloured slashes.
- **Links in text:** inherit the text colour with a 1px underline, 2px on hover.

### Slide mount (signature)
The unit of the whole site: one photograph in a graphite mount.
- **Bands:** three fixed rows. Top: where (country or city, Second Mount Lettering, small print). Middle: the window. Bottom: the place name by hand, and at widths of 26rem and above the control "How this was made" with an arrow.
- **Window:** the window area is a square of 84% of the mount's width. A landscape photograph takes the full width, a portrait the full height, so both share one long edge and neither is cropped.
- **Sizing:** every dimension inside the mount is measured against the mount's own width (container units), so a mount looks the same at 10rem and at 40rem.
- **States:** at rest; lifted on hover when it can be picked up; ringed in pencil after it has been picked up and put back (one ring at a time across the page).
- **Address:** every slide has its own address (`#view-<id>`), and a mount is a real link that works without the script.

### Lead slide and guide plate
A stated adaptation of the mount for the two places a photograph is shown large outside the viewer: the home page lead and the plate at the top of a guide. The mount takes the photograph's own shape instead of the square: bands size to their content, the window is 90% of the mount's width, a portrait is limited to `min(70dvh, 120cqi)` high, and the bottom band always shows its second item. On the guide plate that item is the camera data in tabular figures.

### Empty mount
Stands in for work that does not exist yet: an empty country, an unpublished section, the missing portrait. The mount is lightened toward the table (`color-mix(in oklch, mount 88%, table)`), the window is an unlit 3:2 opening in Table Edge, and the handwritten line says plainly what is missing. It is not a link and does not lift.

### Viewer (picking up a slide)
A full-screen dialog in The Room. The photograph is held at the left at its full shape; a 17rem to 23rem column at the right carries previous, next and close buttons (2.75rem squares, 1px white outline at 22% opacity), the place name by hand, where it is, then "How it was made" as a ruled list: best time, focal length, aperture, shutter, ISO, lens, camera. Below it, a short note, the on-dark button to the guide, and a quiet link to the map pin. Arrow keys step between slides; closing returns focus to the mount and rings it. Below 56rem the bar sticks to the top and the column follows the photograph.

### Ruled rows
- **Guide and place rows:** name in Title size, a quiet note with figures, and the action at the right; the whole row is the link and the name underlines on hover (2px).
- **Fact lists and day lists:** a label column (10rem for facts, 8.5rem for days) and a text column, 0.85rem to 1.4rem of vertical padding per row.
- **Contents list:** numbered with tabular figures; the section being read is Print Ink at weight 650.

### Sheet (table)
Comparison tables in a guide. Top ink rule, caption at weight 650, header cells in Caption size and Second Ink, first column at weight 650 (minimum 9.5rem), hairline under each row, no fills and no vertical lines. The recommended cell is marked by weight 650 only. Times and prices do not wrap and use tabular figures.

### Note
A boxed aside in a guide: Lamp Centre fill, 1px hairline border, 4px corners, heading written by hand at 1.45rem, body text below.

### Photograph in text
A figure inside a guide holds a mount with a caption beneath it in Caption size carrying the camera data. Groups set two or three across and one across below 34rem.

## Do's and Don'ts

### Do:
- **Do** put every photograph in a mount, with where it is on the top band and its name written by hand on the bottom band.
- **Do** let the window take the photograph's shape. Landscape fills the width of the square, portrait fills the height.
- **Do** use an empty mount, with a plain sentence, wherever work does not exist yet.
- **Do** take every colour from the tokens, and size everything inside a mount in container units so it scales with the mount.
- **Do** open lists, tables and guide sections with a 1px Print Ink rule and separate rows with hairlines.
- **Do** set camera data, times, dates and prices in tabular lining figures, and show only values read from the photograph's file.
- **Do** write every string in both languages, with full-width punctuation and open line-height in Chinese.
- **Do** keep one primary button per view.
- **Do** switch off every transition and the lamp strike under `prefers-reduced-motion`.

### Don't:
- **Don't** use grease-pencil orange for anything except the picked slide's ring and the focus ring.
- **Don't** crop, round or overlay a photograph, and don't set text on top of one.
- **Don't** use a full-bleed hero, a slideshow or a masonry grid.
- **Don't** add cream or warm paper tones, serif type, film-strip ornament or monospaced labels.
- **Don't** use the handwritten face for body text, menus, buttons or data.
- **Don't** add entrance animations, scroll reveals or looping motion. The lamp strikes once and that is all.
- **Don't** put shadows on text, rows, tables, notes or buttons.
- **Don't** fill an empty place with a stand-in image, an invented guide or invented camera data.
- **Don't** mark emphasis with colour. Use weight 650.

## Open Decisions and Known Gaps

These are recorded as open. None of them is a settled part of the system.

- **Typeface hosting (waiting on the owner).** Libre Franklin, Noto Sans TC and Iansui are loaded from fonts.googleapis.com on every page. Hosting the files with the site needs the owner's permission to download them. Until he decides, the families are settled and their delivery is not.
- **About biography (waiting on the owner).** The text on the About page is copy carried over from the previous site and has not been confirmed by the owner as his own words. It is not a model for the site's voice.
- **Focus ring on the lit table.** The ring is 2px of pencil at a 3px offset. It measures 2.7:1 against the table, under the 3:1 usually asked of a focus indicator; it passes on mounts and in the room. Not repaired in this pass.
- **Chinese weights.** Noto Sans TC is requested at 400, 600 and 800 only, while the stylesheet asks for 650, 700 and 750. Chinese text at those weights falls to the nearest loaded weight, so Chinese headings and emphasis may print heavier than their Latin neighbours.
- **Untokenised values.** Shadow colours and the white hairlines used in the room (white at 13%, 14%, 22% and 30% opacity) are written as literal values in the stylesheet, and each page's browser theme colour is a literal hex (`#eef0ef`).

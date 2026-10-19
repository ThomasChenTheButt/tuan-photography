---
target: design 3 home page (cinematic)
total_score: 20
max_score: 32
na_heuristics: 7,10
p0_count: 2
p1_count: 3
target_identity: "file:/Users/chenliangyuan/Desktop/travel website/design 3/index.html"
target_fingerprint: "sha256:c3a719185f1eb504f927a0111358b0afd6b2235bdb294b50125deed42e6dbb4e"
target_path: /Users/chenliangyuan/Desktop/travel website/design 3/index.html
timestamp: 2026-10-19T04-17-34Z
slug: design-3-index-html
---
# Impeccable critique: design 3 home page (cinematic, by place)

Method: dual-agent (A: design review · B: detector and browser evidence), plus a 21st.dev research pass.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 2 | Oceania's ticks all lit on arrival; the Europe stack has no indicator; the document grows ~3,900px mid-scroll |
| 2 | Match with the real world | 3 | Coordinates to two decimals imply spot precision the data lacks; "41 flights" counts legs |
| 3 | User control and freedom | 2 | ~22 pinned screens; the only way past a device is the menu |
| 4 | Consistency and standards | 2 | Four scroll grammars; the country name set seven ways; empties treated three ways |
| 5 | Error prevention | 3 | Four focusable buttons inside an aria-hidden container |
| 6 | Recognition over recall | 3 | Inside the Europe stack nothing says which continent you are in |
| 7 | Flexibility and efficiency | n/a | Experience surface |
| 8 | Aesthetic and minimalist design | 2 | The 21 countries listed three times; the devices add length, not meaning |
| 9 | Error recovery | 3 | Nothing can error; 404 exists |
| 10 | Help and documentation | n/a | Experience surface |
| **Total** | | **20/32** | **Needs work** |

## Design specificity
Authored content, borrowed grammar. The data layer is unmistakably his (flights out of Taipei, airport codes, "Stamped, not yet photographed", "empty pages"); the motion is a showreel of known Awwwards devices. The route to "more epic" is one grammar that is his (home → flight → place), held longer, with bigger photographs.

Detector: 7 findings on the source, 35 on the rendered page; after verification only two stand: the 11.2px meta text on phone index rows, and the focusable buttons inside an aria-hidden group. The rest are false positives (hidden-until-hover images, scroll-scrub intermediate opacities, a design-system check against design 1's DESIGN.md).

## Priority issues
1. [P0] ScrollTrigger measures collapsed sections: `content-visibility: auto` on content-sized sections makes Europe 1,102px at load instead of 5,000px, so Oceania and North America fire 3,900px early and are seen only as end states. Verified by the orchestrator.
2. [P0] The Europe stack ghosts: sunk panels stay at 35% opacity with transparent backgrounds, so three photographs pile up behind the live one; no dwell per country.
3. [P1] The ending does not land: 2.5 screens of text after the last photograph, Instagram as the weakest button, no guide offered.
4. [P1] Hero words broken apart: per-letter inline-block spans make the name box 312px tall for 123px type, so the place line floats 200px above the name.
5. [P1] Photographs are soft on phones: 1280px copies stretched ~3× on portrait DPR 3 screens.
6. [P2] #globe-steps is aria-hidden but focusable; phone index meta at 11.2px.

## Emotional journey
Peak: the Asia name-mask push-through. Valleys: Europe's black head screen and ghosted stack; Oceania and North America static (bug 1); the typographic close. Opening count lands on Andorra by data order.

## Persona red flags
Photographer planning a trip: no path from the home to a guide or camera data. Phone visitor: soft photos, two stages that never play. 繁體中文 reader: the 亞洲 mask is half the height of ASIA; a half-width comma in the zoom stage list.

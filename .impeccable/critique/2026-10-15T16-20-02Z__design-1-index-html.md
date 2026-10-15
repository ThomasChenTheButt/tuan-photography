---
target: my homepage
total_score: 21
max_score: 32
na_heuristics: 9,10
p0_count: 0
p1_count: 3
target_identity: "file:/Users/chenliangyuan/Desktop/travel website/design 1/index.html"
target_fingerprint: "sha256:c078cb4615504da43d9c8cd0e215d9a2f826f0c3db4c33399a3f9b3a49b7d2ca"
target_path: /Users/chenliangyuan/Desktop/travel website/design 1/index.html
timestamp: 2026-10-15T16-20-02Z
slug: design-1-index-html
---
Method: dual-agent (A: design review · B: detector + browser evidence), 2026-10-16. Target: design 1/index.html (main, commit 9c43d32).

## Design Health Score: 21/32 (n/a: 9, 10), Acceptable

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of status | 3 | Timed cards auto-advance with no cue or stop |
| 2 | Match real world | 3 | "Guides" holds 18 places, 1 written guide |
| 3 | User control | 2 | 4 s advance, no pause on hover/focus (WCAG 2.2.2) |
| 4 | Consistency | 2 | Card labels mix country / continent / "UAE · Dubai"; stage breaks system rules (approved exception) |
| 5 | Error prevention | 2 | Focused .tc__btn changed destination under focus (Barcelona guide -> countries/uk.html) |
| 6 | Recognition | 3 | .tc__card look clickable, pointer-events none |
| 7 | Flexibility | 3 | Skip link, tab order, viewer keys; 18 places only by stepping |
| 8 | Minimalist | 3 | Stage loud; Westminster and Matterhorn-reflected appear twice |
| 9 | Error recovery | n/a | no forms |
| 10 | Help | n/a | Experience surface |

## Design Specificity
Opening (Aoraki through car window, paper drawn over) is authored for him. Timed-cards stage (Bebas 8rem, pill, round arrows, shadows, 01 / 18) is a category pattern and the one place the page stops being his. Detector: 12 findings; real ones = timed-cards counter "/ 18" contrast ~2.3:1 (B, measured over pixels), Bebas + radius outside the design system (approved exception). False positives: low-contrast x2 (static render vs paper), cramped-padding x2 (full-bleed blocks), undersized "/ 18" (clamp not resolved), stripes (dead .book CSS), cream-palette and Geist (pinned brand). Cover caption contrast passes (min 5.2:1).

## Priority Issues
1. [P1] Timed cards move under the user: no pause, aria-live every 4 s, counter contrast 2.3:1, cards look like links. Fix: pause on hover/focus-within, "Pause / 暫停" word, aria-live off while autoplaying, raise counter contrast. -> harden
2. [P1] Home promises 18 guides, has 1; "not written yet" three times. Fix: one label kind, real guides only or honest heading, apology becomes a way on (Journey). -> clarify
3. [P1 phones] Windows crop out their subject (Matterhorn missing; Westminster sky + crane). Fix: per-window focal point or portrait-safe picks. -> adapt
4. [P2] Way in before the hold: Guides stage before the wall; no doorway to Journey/About on the page. Fix: wall first, ways in after. -> layout
5. [P2] Repeated photos, weak final frame (Westminster landmark before footer). -> polish

## Persona Red Flags
Jordan: clicks a card, nothing; reads "not written yet" twice. Casey: 13.5 screens tall at 375px; button changes under thumb; arrows 43x43. Sam: polite announcement every 4 s; focus target changes silently. Instagram photographer: primary "Follow on Instagram" for an existing follower; stage reads travel agency; wall leans on landmarks.

## Minor
Japan card shows Fuji, note names other places. Phone Menu label stays "Menu" when open. DESIGN.md window list stale; PRODUCT.md says 16 countries (data: 21). Intro sentence small beside the h1.

## Questions
What would the guides look like shown like every other photo: photograph, name beneath? Should Home promise eighteen with one written? Which photograph should be last before @tuan_1127?

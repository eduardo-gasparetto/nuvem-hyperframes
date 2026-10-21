# Nuvem motion identity

The motion language of the Nuvemshop ads, extracted from measured footage. Part 1 is tool-agnostic (any engine:
CSS, GSAP, Framer Motion, After Effects, Rive). Part 2 is the HyperFrames adapter (`motion.js`, next to this file).

- **Source:** one piece so far — `Cubo_Nuvem Ads.mp4` (1512x672, 30 fps), scene 1 (0-23 s), rebuilt and measured in
  `projects/cubo-nuvem-ads-rmx/` (raw measurements: `reference/motion-rules.md`). Every number below comes from there.
  Color, type and surfaces: `visual-identity.md` (same folder).
- **Status:** v0, single source. Some rules may belong to that piece, not to the brand — see "Open questions".
- **Units:** `H` = canvas height (672 px in the source). Distances are given in px at the source size and relative to `H`
  (or to the element they belong to) so they carry over to other sizes of the same ratio (2.25:1); other ratios are an
  open question (see `visual-identity.md`).

---

# Part 1 — Identity (tool-agnostic)

## 1. Grammar

1. **Ease family by role — no exceptions in the source:**
   - things **arriving** ease **out** (fast start, soft landing);
   - things **leaving** either ease **in** (accelerate away) or fade **linearly**;
   - things **travelling** from A to B ease **in-out** (cursor, scroll jumps, focus growth);
   - **ambient** motion is **linear** (rings, drifts, floats, connector lines).
2. **No overshoot, no bounce, no elastic.** Arrivals settle without passing the target (a ~1 % overshoot seen once was ignored).
3. **Text never moves on exit** — it only fades. Objects never fade on exit — they shrink or fall.
4. **Persistent chrome stays:** the background, the isologo propagation and the top tag never leave between scenes.
   Only scene content enters and leaves.
5. **Scenes leave as one block** (everything falls together) and **enter in layers** (each layer rises with its own depth).
6. **Sequential, not simultaneous:** words, icons and exits are staggered; within one sequence nothing starts on the same
   frame. Parallel sequences (two caption lines, the four connector lines) may coincide.
7. **Overlap, don't wait:** the next beat starts while the previous one is still settling (see §4).

## 2. Tokens

### Durations — five bands

| Band | Range | Used for |
|---|---|---|
| micro | 0.10-0.20 s | click press/release, connector growth, avatar lead on exit |
| short | 0.27-0.42 s | text exit fade, pop-out, cursor appear |
| base | 0.55-0.77 s | word entrance, icon pop, avatar emerge, focus growth, tag phases |
| long | 0.88-1.04 s | scene fall, layer rise, number blur-in, scroll jump, cursor travel |
| deep | 1.25-1.34 s | slow caption fade, back-layer rise |

### Eases

GSAP names (power1 = quad, power2 = cubic, power3 = quartic, power4 = quintic) with their best `cubic-bezier`
approximation for other tools. Error = max deviation of progress over the whole curve (measured).

| Role | GSAP | cubic-bezier | Error |
|---|---|---|---|
| soft arrival (word rise, tag circle, slow fade) | `power1.out` | `0.5, 1, 0.89, 1` | 0.2 % |
| arrival (word fade, icon pop, layer rise) | `power2.out` | `0.33, 1, 0.68, 1` | 0.3 % |
| strong arrival (avatar emerge, blur clear, back layer) | `power3.out` | `0.25, 1, 0.5, 1` | 0.6 % |
| departure (scene fall, pop-out) | `power2.in` | `0.32, 0, 0.67, 0` | 0.3 % |
| travel (scroll jump, cursor, focus growth, tag widening) | `power2.inOut` | `0.65, 0, 0.35, 1` | 1.0 % |
| short travel (cursor arc, line retract) | `power1.inOut` | `0.45, 0, 0.55, 1` | 0.5 % |
| ambient, text exit | `none` / linear | `0, 0, 1, 1` | — |

### Distances and speeds

| Token | Source value | Relative |
|---|---|---|
| word rise | 26 px | 0.039 H |
| scene fall | 1440 px | 2.14 H |
| layer rise, front | from +640-650 px | starts just below the bottom edge (~0.95 H) |
| layer rise, back | from +820 px | ~1.22 H (deeper than the front layer) |
| scroll drift | 22-24 px/s | ~0.046 screen heights/s (screen = the scrolled viewport, 498 px) |
| scroll jump | 448-528 px | ~0.9-1.06 screen heights (one "page") |
| panel float | -2 px/s (up) | 0.003 H/s |
| connector growth | 620-830 px/s (default 800); one later line ~1050 | ~1.2 H/s |
| number blur | σ 48 px at 262 px type | 0.18 x font size |
| focus growth | x1.44 | — |
| cursor press | x0.90 | — |

### Staggers

| Group | Gap |
|---|---|
| headline words, two-line title | 0.112 s |
| headline words, one-line title | 0.166 s |
| caption words (two lines in parallel, line 2 starts ~0.10 s after line 1) | 0.05-0.11 s, ~0.065 s typical |
| big numbers | 0.06-0.07 s |
| icon pops | 0.20 s |
| pop-outs | 0.07-0.2 s (uneven) |

## 3. Patterns

Each pattern: what it is, then the recipe. Times are relative to the pattern's own start.

**P1 — Word cascade (headline entrance).** Words appear one by one, each fading in while rising into place.
Per word: opacity 0 → 1, 0.70 s `power2.out`; y +26 px → 0, 0.65 s `power1.out`. No blur, no scale.
Stagger per §2 (0.112 / 0.166 s).
*Slow variant (caption under a big number):* opacity over 1.25 s `power1.out`, same rise.

**P2 — Text exit.** The whole text block fades out, opacity 1 → 0, 0.33 s linear. No movement.

**P3 — Number blur-in.** Big figures come into focus. Opacity 0 → 1, 0.90 s `power1.out`, together with
blur 0.18 x font size → 0, 0.90 s `power3.out` (the blur clears faster than the fade). Stagger 0.06-0.07 s.

**P4 — Icon pop with satellite.** An icon grows from its centre: scale 0 → 1, 0.62 s `power2.out` (0.55-0.62).
Its satellite (avatar photo) starts 0.23 s later and emerges *from the icon's rim* — from the rim point facing its final
position — scaling 0 → 1 while travelling there, 0.725 s `power3.out` (scale and travel share the ease).
Several icons: 0.20 s apart.

**P5 — Pop-out.** Leaving objects shrink to their centre: scale 1 → 0, 0.33-0.42 s `power2.in`.
The satellite leaves first: 0.10 s earlier, 0.27 s, shrinking in place.

**P6 — Layer rise (scene entrance).** A layer enters from below the canvas, translate only (no fade, no scale).
Front layer (the panel): from just below the bottom edge, 0.94-1.0 s `power2.out`.
Back layer (objects around it): from deeper (~1.22 H), 1.34 s `power3.out`, starting 0.10 s *before* the front layer —
it starts first but lands last, which gives the parallax settle.

**P7 — Scene fall (scene exit).** Everything that belongs to the scene falls straight down together:
y += 2.14 H, 0.88 s `power2.in`. Elements attached to two layers (connector lines) move each end with its own layer.

**P8 — Connector line.** A straight thin line (white, 3 px, opacity 0.2, drawn *below* the objects) grows linearly from
inside the source object to the edge of the target at ~800 px/s (620-830). It draws while the target is still landing
(~0.06 s after the panel starts rising), not after.
Retract: the end point travels back to the source, 0.10-0.25 s (`power1.inOut`; the shortest one linear), then the line disappears.

**P9 — Page scroll inside a panel.** Two layers summed: a constant linear drift (22-24 px/s, never stops) plus
eased jumps of ~one screen height, ~1 s `power2.inOut`. The drift makes the page feel alive; the jumps change section.

**P10 — Ambient propagation (isologo rings).** Off-canvas circles (the isologo lobes) emit concentric rings:
one ring every 0.992 s, radius growing linearly at 0.31 x base radius per second, opacity 0.88 → 0 linearly over
3.07 s (end radius 1.95 x base). Stroke only (brand blue `#0050C3`, 1.5 px). The base outline itself drifts ~1 px/s inward.
Runs under every scene, never pauses.

**P11 — Cursor.** Appears with a small pop (scale 0.8 → 1 + fade in, 0.30 s `power2.out`). Travels to its target
in ~1 s `power2.inOut` along a shallow arc (up ~12 px and back, `power1.inOut` / `power2.out`).
Click = press to x0.90 in 0.15 s, release in 0.20 s (`power1.out`), scaled from its centre. It then rides on the target.

**P12 — Focus (the chosen one grows, the rest leave).** The clicked object grows x1.44, 0.77 s `power2.inOut`,
starting ~0.10 s after the press. Its satellite grows with it and keeps its relative position. ~0.26 s after the press
the other objects pop out (P5) one by one, their connector lines retract (P8), then the page jumps (P9).

**P13 — Tag build (the top pill).** Two phases: a dot grows into a circle (0 → full height, 0.70 s `power1.out`), then
the circle widens into the pill (0.60 s `power2.inOut`, height fixed). The label is not typed — it is anchored to the
left edge and revealed by the widening.

**Glass panel float.** While a panel holds, it drifts up ~2 px/s (linear). Objects around it do not float.

## 4. Choreography — how beats chain

From the source, scene 1 (seconds):

| t | Beat | Rule it shows |
|---|---|---|
| 0.00 | tag build starts (P13); title-1 cascade at 0.067 (P1) | chrome and the first text start together |
| 1.04 | first ring (P10) | ambient starts ~1 s in and never stops |
| 1.91 | icons pop, 0.2 s apart (P4) | objects come ~0.6 s after the headline lands (last word done at 1.33) |
| 3.65 | title-1 exit (P2) → title-2 cascade at 4.03 | next text starts 0.05 s after the fade ends |
| 5.64 | panel rises (P6 front) over title-2; lines grow at 5.70-5.83 (P8) | the panel covers the old text instead of waiting for its exit |
| 6.47 | page drift + jump at 7.22 (P9) | the page starts drifting just before the panel lands (6.47 vs 6.58) |
| 10.15 | scene fall (P7); title-3 cascade at 10.80 | new text starts 0.65 s into the fall, on the cleared stage |
| 13.20 | title-3 exit; back layer rises 13.51, front 13.61 (P6) | re-entry starts during the text fade |
| 14.16 | new icon pops in place (P4) | — |
| 15.52 | cursor appears, travels, clicks 16.85 (P11) | ~0.9 s after the panel lands |
| 16.96 | focus (P12): others leave 17.12-17.47, page jump 17.65 | the click drives a chain of short beats |
| 18.68 | scene fall (P7) | ~1.8 s after the click |
| 19.42 | numbers blur in (P3), caption at 19.68 (P1 slow) | cut-in while the fall clears; caption 0.26 s after the first number |

Rules of thumb drawn from it:
- **Hold times are short:** a headline stays 1.2-2.3 s after landing (or is covered sooner), a panel with a scrolling page ~3.5 s.
- **Every exit is followed by an entrance within ~0.05-0.75 s.** The stage is never empty.
- **One action per beat;** when a beat triggers a chain (click → focus → leave → scroll), the links are 0.1-0.3 s apart.

## 5. Open questions (to confirm on a second piece)

- Are the two headline staggers (0.112 / 0.166 s) a rule (two lines vs one line) or a coincidence of word count?
- Is the 1440 px fall a fixed distance or "whatever clears the canvas in 0.88 s"? Expressed here as 2.14 H.
- Scenes after 23 s of the source (photo scene, chat scene, closing logo) are not measured yet; they may add patterns
  (glass card entrance, chat bubbles, notifications, a blur transition, the final logo build).

---

# Part 2 — HyperFrames adapter (`motion.js`)

`motion.js` exposes `window.NuvemMotion`: the tokens above plus one function per pattern. Each function adds tweens
to a timeline you pass in, at absolute times, following the HyperFrames seek-safe idiom used in the source project:
every tween is a `fromTo` with `immediateRender: false` (except plain fades/moves from the current state — `textOut`,
`lineFall`, the `tagBuild` widening — which use `tl.to`), and hidden initial states are set once at load with `gsap.set`.

**Install in a project:** copy `shared/video/motion.js` into `projects/<name>/shared/motion.js` (the Studio does not
follow links outside the project folder) and load it in `index.html` right after GSAP:

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<script src="shared/motion.js"></script>
```

Sub-compositions are inlined into `index.html`, so their scripts can use `NuvemMotion` directly.

**Rule:** use the preset when the pattern matches; pass options only for what the piece measures differently.
Never re-type the numbers in a composition. If a new piece needs a new pattern, add it here first.

The API reference is the comment header of `motion.js`. The test `motion.test.mjs` checks that each preset produces
exactly the tweens of the source project (`node shared/video/motion.test.mjs`).

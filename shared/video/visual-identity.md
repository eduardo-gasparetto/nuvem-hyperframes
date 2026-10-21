# Nuvem video visual identity

Color, type, surfaces and layering of the Nuvemshop ads — the static half of the video identity
(the moving half is `motion-identity.md`). Tokens: `video-tokens.css`, next to this file.

- **Source:** `Cubo_Nuvem Ads.mp4` (1512x672), scene 1 (0-23 s), as rebuilt and measured in
  `projects/cubo-nuvem-ads-rmx/`. Where the video and the Figma storyboard differ, the video wins.
- **Not the interface system.** Site/app tokens (`shared/ui/nuvem-tokens.css`, from the `insti-styleguide` skill) are a
  separate system. The two share the brand colours and the fonts; sizes, tracking, surfaces and motion are video-only.
- **Units:** px at the source size. `H` = canvas height (672). In CSS every size is `px x --nuvem-video-unit`, so another
  canvas only sets `--nuvem-video-h` on `:root`.
- **Status:** v0, single source — confirm on a second piece.

## 1. Color

| Role | Value | Same as UI token |
|---|---|---|
| Brand blue: rings, isologo outline, glass tint, gradient core | `#0050C3` | `--nuvem-nimbus-blue` |
| Highlight: big numbers, glass hairlines and inner highlights | `#59A9FF` | `--nuvem-lib-highlight-blue` |
| Canvas base (under the gradient) | `#010B23` | `--nuvem-lib-galaxy-blue` |
| Text | `#FFFFFF` | `--nuvem-white` |
| Glass drop shadow | `rgba(0, 21, 70, 0.03-0.08)` | — |

Rules:
- **Dark stage only.** Everything sits on the "nimbus night" gradient; there is no light scene in scene 1.
- **Text is white; only figures are blue** (`#59A9FF`). No coloured words in headlines.
- **Lines are white, not blue:** connector lines are white at 0.2 opacity; the brand blue is reserved for the
  isologo outline and its rings (0.88 opacity).
- **Glass is tinted blue, never grey:** fill `rgba(0, 80, 195, 0.15-0.20)` (brand blue), border and top highlight in the
  highlight blue at 0.08-0.15.

### Background

Radial gradient, fixed (it never animates). The stops match the UI token `--nuvem-lib-nimbus-night`; the geometry is
specific to the video (centre above the top edge, right of the canvas centre, darkening downwards). Exact SVG for 1512x672:

```html
<radialGradient id="bg-grad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"
  gradientTransform="translate(918 -447) rotate(108.398) scale(1951.76 1744.69)">
  <stop offset="0" stop-color="#0050C3" />
  <stop offset="0.298077" stop-color="#00298F" />
  <stop offset="0.653846" stop-color="#080558" />
  <stop offset="1" stop-color="#010B23" />
</radialGradient>
```

For another canvas of the same ratio, scale the `translate` and `scale` values with the canvas (the rotation stays);
for another ratio, see Open questions.

## 2. Typography

Two families, both in `shared/fonts/`: **Plus Jakarta Sans 600** (always semibold in video — no regular, no bold)
and **Ivy Presto Display Light Italic** (emphasis only).

| Role | Font | Size | Leading | Tracking | Class |
|---|---|---|---|---|---|
| Headline | Jakarta 600 | 92 px (0.137 H) | 1.28 | -1.4 px stacked / -0.92 px one line | `.nuvem-video-headline` |
| Headline emphasis | Ivy Presto 300 italic | 97 px (1.054 x headline) | 1.28 | -1.5 px stacked / -0.924 px one line | `.nuvem-video-headline-serif` |
| Stat figure | Jakarta 600, `#59A9FF` | 261.8 px (0.39 H) | 1.2 | -5 % | `.nuvem-video-stat` |
| Stat joiner ("em") | Jakarta 600, `#59A9FF` | 136 px (0.52 x figure) + ~12 px extra space after | 1.2 | inherits the figure's | — |
| Caption (under a stat) | Jakarta 600 | 66.7 px (0.099 H) | 1.15 | -1 % | `.nuvem-video-caption` |
| Tag label | Jakarta 600 | 25 px | normal | -1 % | `.nuvem-video-tag-label` |

Rules:
- **Sans states, serif italic emphasises.** Two-line titles: line 1 sans, line 2 serif italic
  ("Seu cliente / *está em todo lugar*"). One-line titles: the emphasised words switch to serif ("E agora, *Chat GPT*").
- **The serif is set 5 % larger** than the sans (97 vs 92 px) so both read at the same optical size.
- **Stacked lines are pulled together:** line 1 has a negative bottom margin of 17-26 px (0.18-0.28 x its size) on
  top of the 1.28 leading.
- **Tight tracking everywhere** (-1 % to -1.5 %; -5 % on the big figures). Stacked titles in the video are tighter
  than the Figma (-1.4/-1.5 px instead of -1 %).
- **Centred** headlines, stats and captions; headline box ~65 % of the canvas width (989 px).
- **Ligatures off** (`"liga" 0`) on figures, captions and the tag; the tag also uses lining, proportional numerals.
- Letter-spacing on the stat block is set on the container, so the small joiner inherits the figure's absolute
  tracking (-13.1 px) — put `.nuvem-video-stat` on the container, not on each span.
- Per-word animation needs each word in its own `inline-block` span (see `motion-identity.md`, P1).

## 3. Surfaces — glass

Two recipes, same construction: blue-tinted fill + backdrop blur + highlight-blue hairline border +
a 1-2 px inner highlight on the top edge + an almost invisible navy drop shadow.

| | Panel (site/app window) | Tag (top-left pill) |
|---|---|---|
| Class | `.nuvem-video-glass-panel` | `.nuvem-video-glass-tag` |
| Size | 767.9 x 553 px | 75 px high, width by label (324 px) |
| Radius | 35 px | full |
| Fill | `rgba(0, 80, 195, 0.15)` | `rgba(0, 80, 195, 0.20)` (Figma says 0.05; the video is stronger) |
| Backdrop blur | 21 px | 40 px |
| Border | 1.4 px `rgba(89, 169, 255, 0.10)` | 2 px `rgba(89, 169, 255, 0.08)` |
| Top inner highlight | 1.4 px `rgba(89, 169, 255, 0.15)` | 2 px `rgba(89, 169, 255, 0.15)` |
| Drop shadow | `0 9.1 8.4 rgba(0, 21, 70, 0.03)` | `0 8 13 rgba(0, 21, 70, 0.08)` |
| Content | screen inset 26.6 px left/right/top inside the border (25.2 bottom), radius 14 px, clips the page | label 40 px from the left outer edge, 38 from the right |

Rule: **the screen inside a panel is the only opaque thing on stage** (a real page screenshot); everything else is
glass, line or type.

## 4. Objects

- **Brand icons:** flat app icons in circles. The four around the panel (Google, TikTok, WhatsApp, Instagram) are
  116 px (0.17 H); the featured one (ChatGPT) is larger, 126.7 px, and grows to 182.6 px (1.44x) when it is clicked.
- **Satellite avatars:** a portrait photo clipped to a circle, **no border, no shadow**, overlapping the icon's rim and
  drawn above it: 0.645 x the icon on the four (74.8 px), 0.51 x on the featured icon (65 px).
- **Connector lines:** straight, 3 px, white at 0.2, butt caps; from inside the icon to the panel's outer edge.
- **Isologo propagation:** the isologo lobes as big circles centred off-canvas at the left and right edges (only a
  sliver visible), outline `#0050C3` 1.5 px at 0.88, rings emitted outward (P10 in `motion-identity.md`).
- **Cursor:** the standard pointer arrow, 46.8 x 73.9 px (0.11 H), drawn above the scene (only the tag is above it).

## 5. Layout and layering

Back to front:

1. background gradient;
2. isologo propagation (edges);
3. headlines and stats (middle band);
4. connector lines;
5. icons, then their avatars;
6. glass panel — covers the headline when it arrives;
7. cursor;
8. the tag, top-left — persistent, above everything, never leaves.

Composition rules seen in scene 1:
- **Centre axis:** the panel and the stats are centred on the canvas (panel 372-1140 px, centre 756). Headline boxes
  sit within ±9 px of the centre (box centres 748-766 px, per-title optical offsets measured in the video).
- **Objects frame the centre:** icons sit left and right of the panel (two each side; the featured icon joins on the
  right, mid-height), never over it.
- **Edges breathe:** the propagation lives at the left/right edges, so the centre stays clean for text and panel.
- **One headline at a time:** icons may sit around a headline, but two headlines are never on screen together, and
  the panel replaces the headline (rising over it) instead of sitting beside it.

## 6. Open questions

- The photo scene (23-35 s), chat scene (35-54 s) and closing logo (54-64 s) are not measured: they may add a light
  surface, chat bubbles, notifications and the full isologo lockup.
- Is "Jakarta 600 only" a video rule or a choice of this piece?
- Are the tag's 0.20 fill and the panel's 0.15 fill two tokens or one value that read differently over different
  backgrounds?
- **Other aspect ratios** (9:16, 1:1, 16:9): scaling by height only holds at the source ratio (2.25:1). For another
  ratio, type and object sizes need a chosen scale (e.g. by the shorter side) and positions, box widths and the
  background geometry must be laid out again — not decided yet.

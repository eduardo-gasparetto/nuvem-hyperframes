# Motion rules — measured from the reference video

Source: `~/Downloads/Cubo_Nuvem Ads.mp4` (1512x672, 30 fps, 64.03 s, no audio).
Method: pixel rows sampled frame by frame (kymograph), circle fits on enhanced frames, peak tracking.
Only the scene-1 background (isologo propagation) is measured so far. Everything else is TODO (see bottom).

## Canvas and background

- Canvas 1512x672, 30 fps.
- Background: radial gradient, userSpaceOnUse, `translate(918 -447) rotate(108.398) scale(1951.76 1744.69)`,
  stops `#0050C3` 0, `#00298F` 0.298, `#080558` 0.654, `#010B23` 1 (= token `nimbus-night`).
- Fonts (from storyboard + frames): Plus Jakarta Sans (bold, titles) + Ivy Presto Display light italic (emphasis words).

## Isologo propagation (left and right edges, behind everything)

Two mirrored copies. Each is a big circle (the isologo's right/left lobe) whose centre lies off-canvas:

| Item | Left | Right |
|---|---|---|
| Ring centre | (-372, 335) | (1878, 335) (mirror of left would be 1884; measured 6 px less) |
| Base radius | 374 px | 374 px |
| Visible part | a sliver of the lobe at the canvas edge | same |

Isologo outline: stroke `#0050C3`, 1.5 px, group opacity 0.88 (vector in `figma/isologo-propag-center.svg`,
scaled 1.4522 for the sides).

### Rings (emission)

- A new ring is born every **29.76 frames = 0.992 s**; first birth at **1.043 s** (frame ~31).
- Motion is **linear** (no easing): radius grows **3.88 px/frame = 116.4 px/s**.
- Opacity fades **linearly** from 0.88 to 0 over ~92 frames (**3.07 s**); radius at death ≈ 731 px.
- Stroke `#0050C3`, 1.5 px, no fill. Rings are plain circles (offset of the lobe = bigger concentric circle).
- Both sides emit in sync.

### Base outline drift

- The isologo base outline (not the rings) drifts slowly **inward**: left `x(t) = 1.21 + 0.938·t`,
  right (distance from the right edge) `x'(t) = 3.63 + 1.036·t`, in px, measured on row y=296 over 22 s.

### Verification numbers (row y=296)

- t=1.5 s: first ring at x≈54 (left); t=3.0 s: rings at 112 and 226; t=6.0 s: 116, 231 (left) and 120, 235 (right, distance from right edge).

## Text entrance (titles, scene 1) — measured, verified to <=1 px / ~0.01 s

Calibration rule: the VIDEO is the ground truth, not the Figma storyboard (they differ slightly, see below).

- Words animate one by one, sequentially, **+0.112 s (3.35 frames) between words**; title-1 starts at 0.067 s.
- Per word: opacity 0 -> 1 over **0.70 s, ease-out ~power2**; and translateY +26 px -> 0 over **0.65 s, ease-out ~power1**. No blur, no scale (x extents do not change).
- Exit of a title: whole block fades **linearly** (ease none) over 0.33 s (title-1: 3.65 -> 3.98 s), no movement.
- Next title starts right after the exit: title-2 words begin at 4.03 s, same per-word animation and stagger.
- Typography (Figma): line 1 Plus Jakarta Sans 600 / 92 px; line 2 Ivy Presto Display Light Italic / 97 px; line-height 1.28; white; centered, box width 989.163 px.
- Differences video vs Figma that we follow: letter-spacing -1.4 px (line 1) / -1.5 px (line 2) instead of -1%; no trailing-space shift on line 2;
  title-1 box top 219.5 (line-1 margin-bottom -25.9), title-2 box left 256.5 / top 220.5 (margin-bottom -16.9).

## Pill "Anúncios Integrados" (fixed tag, top-left)

- Final: 324x75 px, centre (204, 77.5), radius 190, border 2 px rgba(89,169,255,.08), backdrop blur 40, inset highlight, label Jakarta 600 / 25 px / -0.25 px.
- Phase 1 (0 -> 0.7 s): a dot grows into a circle, diameter 0 -> 75 px, **power1.out**.
- Phase 2 (0.7 -> 1.3 s): width 75 -> 324 px, **power2.inOut**, height stays 75. Label is anchored to the pill's left edge (40 px inset each side)
  and revealed by the widening (not typed): first letter appears at ~0.73 s, complete at ~1.33 s.
- Fill measured in the video is much stronger than Figma's 0.05: use `rgba(0,80,195,0.20)`.
- Frames decoded from the video with ffmpeg read ~5 levels (G,B) darker than the browser render of the same gradient; compare relative deltas, not absolute colours.

## Social icons + avatars (scene 1) — measured

- Four icons (116 px circles) with one 74.8 px avatar photo each. Figma positions (px, top-left) were verified against the video to <=1 px:
  Google icon (1256.3, 481.5) / avatar (1340.3, 539.1); TikTok (143.0, 487.0) / (86.0, 512.6); WhatsApp (155.5, 161.4) / (99.0, 159.0); Instagram (1215.5, 98.7) / (1306.7, 145.9).
- Avatars are the portrait photos clipped to a circle (no border/shadow), drawn ABOVE their icon.
- Icon "pop": scale 0 -> 1 about its centre in place, **~0.55-0.62 s, ease-out ~power2 (k≈2.5)**, tiny (~1%) overshoot ignored.
  Start times, in order and exactly 0.2 s apart: Google 1.914 s, TikTok 2.114 s, WhatsApp 2.314 s, Instagram 2.514 s.
- Avatar: starts **0.23 s after its icon**, scales 0 -> 1 while travelling from the icon's rim point (towards its final centre) to the final position,
  **0.725 s, ease-out ~power3**. Both scale and travel share the same ease.
- From ~3.4 s to ~9.9 s everything stays still (measured: no floating/drift). The Figma states with shifted icon positions (frames 71-73) do not occur in that window.
- At ~10.4 s the icons move down with the scene transition and leave; they come back from below at ~13.4-14.4 s and settle at the same positions;
  they are gone by ~17.9 s (those moves belong to the transition steps, not built yet).
- Connector lines between icons and the site mockup only exist from the mockup onwards (not in the entrance phase).

## Site mockup + page scroll + connector lines (scene 1) — measured

- Mockup = glass window: 767.9 x 553 px, border 1.4 px rgba(89,169,255,.1), radius 35, rgba(0,80,195,.15) + blur 21; inner screen 711.9 x 498.4 px, radius 14.
  **Final position in the video: left 372, top 76** (the Figma frame 71 says top 60 — the video is 16 px lower; screen window at canvas (400,104), glass bottom ~630).
  The page content keeps the canvas position it would have with the Figma geometry, so the page image starts 16 px scrolled (img top -16 px).
- Entrance: translateY only (no scale, no fade), from below the canvas (start top ≈ 726) to top 76, **0.94 s, power2.out, starting 5.64 s** (fit rmse ~1.5 px).
- The mockup is drawn ABOVE the icons, lines and title-2 (title-2 is simply covered; hidden for good at 6.6 s).
- Page = one tall store screenshot (776x4096 JPEG, shown at 711.9 x 3757.6 px). Scroll offset (px) = `22*(t-6.47)` (linear drift, 22 px/s)
  + `478 * power2.inOut((t-7.22)/1.03)` (fast jump between sections, ~7.22 -> 8.25 s). Fit rmse ~1 px, valid 6.5 -> ~10.2 s.
  The same slow-drift + fast-jump pattern repeats around 14.2-18.5 s (jump to the product grid ~17.8-18.4 s) — not built yet.
- Connector lines: straight, white, 3 px, opacity 0.2, drawn BELOW the icons and the mockup, growing linearly (no ease) from inside the icon to the mockup's outer edge
  at ~600-780 px/s: WhatsApp (268,216.5)->(372,240.6) 5.700 s/0.173 s; TikTok (256,539.3)->(372,496) 5.745/0.150;
  Google (1262,519.8)->(1140,473.6) 5.737/0.163; Instagram (1222,180.1)->(1140,219.4) 5.825/0.114.
- At ~10.0-10.4 s the whole scene starts to leave (mockup nudges up, icons go down) — exit transition not built yet.

## Scene 1 exit, "E agora, Chat GPT", re-entry, ChatGPT icon (10-15.5 s) — measured

Power names follow GSAP: power1 = quad, power2 = cubic, power3 = quartic.

- **Exit (10.15 s):** mockup, icons+avatars and the connector lines fall together, straight down, `power2.in`, displacement = 1440*p^3 over 0.88 s (gone by ~10.8 s).
  The connector lines' two ends fall with the same curve. Pill, background and isologo propagation never leave.
- **Text "E agora, *Chat GPT*" (one line):** "E agora," Plus Jakarta 600 / 92 px + "Chat GPT" Ivy Presto Light Italic / 97 px, **Figma tracking (-0.92 / -0.924 px)**,
  box left 253, top 258.3 (video-calibrated; titles 1-2 use tighter -1.4/-1.5 px). Words enter sequentially with **0.166 s stagger** (base 10.797 s),
  same per-word animation as titles 1-2 (opacity 0.70 s power2.out, rise 26 px / 0.65 s power1.out). Exit: linear fade 13.20 -> 13.53 s.
- **Re-entry:** everything rises from below the canvas.
  Mockup layer: from +640 px, `power2.out`, 1.0 s, starting 13.61 s. Icons+avatars layer: from +820 px, `power3.out`, 1.34 s, starting 13.51 s.
  Connector lines: the end under the icon follows the icons' curve, the end on the mockup edge follows the mockup's curve.
- **Page scroll on re-entry:** offset = 24*(t-12.0) (drift 24 px/s) + 448*power2.inOut((t-13.74)/0.94); ~42 px at 13.74, ~263 at 14.2, ~509 at 14.6, ~520 at 15.0, then the drift continues (~22-24 px/s).
- **ChatGPT group** appears in place (not in the rising layer), at 69.4% of the Figma frame-72 layout: icon 126.7 px, centre (1294.4, 338.4); avatar 65 px, centre (1367.6, 347.8).
  Icon pop: scale 0 -> 1, 0.62 s `power2.out`, starts 14.155 s. Avatar emerges from the icon rim +0.23 s later, 0.725 s `power3.out`.
  Connector (white 3 px, opacity 0.2): (1256, 336.4) -> (1140, 340.0), grows linearly 14.50 -> 14.61 s.
## ChatGPT click, other icons leave, second scroll, scene exit (15.5-19.4 s) — measured

- **Cursor** (Figma "Pointer", 46.78 x 73.9 px, drawn above everything in the mockup area): appears 15.52 s with a pop (scale 0.8 -> 1, 0.30 s power2.out) at (733, 382).
  Travels x +554 px (to 1287) with `power2.inOut`, start 15.85 s, 0.97 s, along a shallow arc (y -12 px by 16.3 s, back to 0 by 16.7 s).
  Click: scale 1 -> 0.9 (0.15 s, 16.85 s) -> 1 (0.20 s, 17.00 s), scaled from its centre. It then rides on the ChatGPT icon and falls with the scene.
- **ChatGPT grows** 1.441x (126.7 -> 182.6 px, the Figma frame-73 size) with `power2.inOut`, start 16.955 s, 0.77 s; its avatar grows 1.441x and moves (+20.2, +34) px.
- **Other icons leave** in order Instagram -> WhatsApp -> TikTok -> Google: scale 1 -> 0, `power2.in`; starts 17.115 / 17.200 / 17.267 / 17.473 s, durations 0.33 / 0.36 / 0.42 / 0.33 s.
  Each avatar shrinks in place 0.10 s earlier (0.27 s). The four connector lines retract toward their icon (17.17-17.45 s).
- **Page scroll #2:** +528 px with `power2.inOut`, start 17.65 s, 1.04 s (on top of the 24 px/s drift); total offset ~1138 px at 18.7 s.
- **Mockup float:** the glass drifts up ~2 px/s (-1.8 px/s from 7.6 s in the first scene, -2.1 px/s from 14.6 s after the re-entry). Icons do not float.
- **Scene exit #2 (18.68 s):** exactly the same fall as exit #1 (`power2.in`, 1440 px over 0.88 s) for mockup + ChatGPT group + cursor.
- Known small differences left: GPT icon centre is 2 px left of the video's after the click; connector retraction ~0.03 s late.
## "7 em 10" stat scene (19.4-23.0 s) — measured (Figma frame 59, verified: caption lines 0 px, numbers <=3 px)

- Blue numbers `#59A9FF`, Plus Jakarta 600: "7" and "10" 261.848 px, "em" 136 px (video) with ~12 px extra space after it, tracking -13.09 px, block top 83 px, centred on x=756.
- Caption in white, 66.652 px, tracking -0.6665 px, line-height 1.15, top 384.2 px, two lines ("brasileiros já usam IA" / "na  jornada de compra", double space kept).
- **Numbers = blur-in:** each starts fully blurred (σ ≈ 48 px) and transparent. Opacity 0 -> 1 over 0.90 s `power1.out`, blur 48 -> 0 over 0.90 s `power3.out`;
  starts 7 = 19.415, em = 19.485, 10 = 19.545 s.
- **Caption words:** opacity 0 -> 1 over **1.25 s `power1.out`** (slower than titles 1-3) plus the usual rise (26 px -> 0, 0.65 s `power1.out`), word by word:
  line 1 brasileiros 19.675 / já 19.745 / usam 19.805 / IA 19.890; line 2 na 19.771 / jornada 19.833 / de 19.883 / compra 19.995 s. No exit; hard cut at 23.0 s.
- Next (not built yet): the photo scene (23-35 s), chat scene (35-54 s), closing (54-64 s).

## Scene cuts seen so far

## Scene cuts seen so far

Hard cuts at 23 s and 35 s (ffmpeg scene detection, threshold 5). Blocks: 0-23 s (blue, icons, site mockups),
23-35 s (photo of a person with phone, glass cards), 35-64 s (chat mockup, sales notifications, closing logo).

## TODO (not measured yet)

- Title entrances (sans line + italic line), icon orbit / entrance, connector lines, site mockup transitions.
- Cursor movement and click, typing effects (prompt text, "E agora, Chat GPT").
- Glass card (blur) entrance, chat bubbles, sales notifications, blur transition at ~44 s.
- Final logo build (0:54-1:04): the central isologo outline with outward propagation (needs real offset paths, the four `Propagation` outlines in `figma/isologo-propag-center.svg`).
- Easing and durations for all of the above.

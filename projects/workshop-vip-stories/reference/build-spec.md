# Build spec — workshop-vip-stories

One 1080x1920, 30 fps HyperFrames composition = three Instagram stories back to back, with narration and music.
Source of truth for layout and color: the approved Figma frames (numbers below, screenshots in `reference/figma-story1.png`,
`figma-story2.png`, `figma-story3.png`, overview in `figma-overview.png`). Figma colors win over the video tokens.
Motion: `shared/motion.js` (`window.NuvemMotion`, call `NuvemMotion.setCanvas(1920)` first so px@672 tokens scale) and
`/Users/eduardogasparetto/Claude Projects/nuvem-hyperframes/shared/video/motion-identity.md` (read it fully). Never retype its numbers.

## Assets (all under this project)
- `assets/gemini/s1.mp4` — 720x1280, 24 fps, 4.0 s, silent-ish (has a near-silent AAC track: do NOT use its audio). Photo of the D2C stage, push-in.
- `assets/gemini/s2.mp4` — same format; workshop room, push-in.
- `assets/img/juliana.png` — 1024x1024 RGBA cutout (already blue-tinted).
- `assets/img/logo-enp.svg`, `d2c-type.svg` ("D2Csummit" wordmark), `d2c-isologo.svg` (D2C mark). Use the SVG files as-is.
- `assets/audio/vo-s1.wav` (5.40 s), `vo-s2.wav` (2.76 s), `vo-s3.wav` (18.20 s), `bgm-a.wav` (14 s), `bgm-b.wav` (20 s).
- Fonts/CSS: `shared/fonts.css` (Plus Jakarta Sans; check it has weights 400 and 600 — the Figma description text is Regular 400, everything else SemiBold 600), `shared/motion.js`.

## Timeline (seconds, absolute) — voice start offsets are fixed
| Scene | Visible | Voice file @ start | Voice ends |
|---|---|---|---|
| 1 | 0.00 – 6.20 | vo-s1 @ 0.45 | 5.85 |
| 2 | 6.00 – 10.10 | vo-s2 @ 6.55 | 9.31 |
| 3 | 9.80 – 29.30 | vo-s3 @ 10.30 | 28.50 |

Total duration 29.30 s. Scenes overlap by 0.2-0.3 s on purpose (motion grammar: overlap, don't wait; the stage is never empty).
Sub-compositions per scene (`compositions/scene-1.html` etc., referenced with `data-composition-src`), plus persistent
background in the root. Scene = full-frame, time-windowed in the parent (overlapping full-frame slides fail `check`: see the
note in docs/worklog/2026-10-20-1005-social-specs.md — window each scene with `data-start`/`data-duration`).

## Background (persistent, root, never animates)
Figma radial gradient, 1080x1920:
`<radialGradient id="g" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="10" gradientTransform="matrix(175.95 206.22 -29.542 251.77 -241.87 -234.67)">`
stops: `rgb(0,80,195)` 0, `rgb(0,41,143)` 0.29808, `rgb(4,23,115)` 0.47596, `rgb(8,5,88)` 0.65385, `rgb(4,8,61)` 0.82692, `rgb(1,11,35)` 1.

## Scene 1 (Figma "Instagram story - 5")
- Photo layer: `s1.mp4` full-bleed 1080x1920 (object-fit cover), **opacity 0.30** over the gradient. s1.mp4 is 4.0 s and the scene is 6.2 s:
  pre-render a slowed copy with ffmpeg to `assets/gemini/s1-slow.mp4` (`setpts=1.55*PTS`, then `minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc`,
  scale 1080x1920, h264, no audio) and use that. Verify the frame count/duration with ffprobe.
- Text, Plus Jakarta Sans 600, 66 px, white, letter-spacing -0.165 px, left-aligned in a 906 px wide box:
  - Line A "Você esteve no": left 91, top 1216, line-height 1.234.
  - Logo group at left 82, top 1311: isologo (227.5x77.9 at x=90) then wordmark `d2c-type.svg` (377.9x54.4 at x=352.3, y=1322.6), i.e. the "D2C summit" lockup on the same line.
  - Line B "e não conseguiu participar dos workshops presenciais?": left 82, top 1312 + 85.8 (one blank 66 px x 1.3 line holds the logo), line-height 1.3, 906 wide, wraps into 2 lines.
- Motion: word cascade P1 for line A, logo pops/cascades with the word group, line B cascade P1; sync starts to the transcript (see Voice sync).
  Scene exit: text fades (P2) then the photo layer falls (P7 `sceneFall`) while scene 2 enters.

## Scene 2 (Figma "Instagram story - 10")
- Photo layer: `s2.mp4` full-bleed, opacity 0.30. Clip is 4.0 s, scene is 4.1 s: just hold the last frame for the leftover 0.1 s (or trim the scene to 4.0).
- Text "Então agora chegou sua vez!" — NOTE the briefing/voice say "a sua vez" but the approved Figma text is "Então agora chegou sua vez!": keep the Figma text on screen.
  Jakarta 600, 117 px, white, centered (box centre x=540, width 906), top 840, line-height 1.234, letter-spacing -0.2925 px, wraps to 2 lines.
- Motion: layer rise P6 for the photo (enter from below, ~1 s) starting at 6.00 over the falling scene 1; words cascade P1 synced to vo-s2 (start 6.55).

## Scene 3 (Figma "Instagram story - 8")
Layers back to front (all coordinates inside the 1080x1920 frame):
1. Juliana: `juliana.png`, wrapper box left -90, top 97, 1906.434 x 1881.275, inner image box 1705.847 x 1676.72 centered in it, `object-fit: cover`, rotated **-7.35°** around the wrapper centre (863.2, 1037.6).
2. Gradient veil over her: box 1737 x 1454.022 centered at (518.2, 1318.5) (left -537.78, top 351.11 of a 2111.972 x 1934.873 wrapper), rotated **18.73°**, background `linear-gradient(180deg, rgba(6,8,69,0) 3.846%, rgba(7,6,78,0.5) 29.327%, #080558 77.093%)`.
3. Logo EnP `logo-enp.svg` at left 81, top 483, 278.5 x 80.
4. Text group (white, Jakarta, left 76-81, width up to 671):
   - "WORKSHOP": 27.467 px 600, uppercase, letter-spacing 8.24 px, left 81, top 651.
   - "Grupo VIP": 91 px 600, letter-spacing -0.2275 px, line-height 1.234, left 76, top 696.
   - "Como transformar clientes em compradores recorrentes": 46.8 px 600, letter-spacing -0.117 px, lh 1.234, left 81, top 823, width 671.
   - Description "Juliana Marques, da loja Siiis Kids, mostra na prática as melhores estratégias para usar em grupos no WhatsApp e fazer clientes voltarem a comprar.": 36.8 px **400**, letter-spacing -0.092 px, lh 1.264, left 81, top 989, width 584.
   - Pill: background `#0050C3`, left 79, top 1304, 557 x 100, radius 100; text "22 de Outubro às 15h" 46.8 px 600 white, centred at (358, 1352), letter-spacing -0.117 px, nowrap.
- Motion: Juliana enters as a layer rise (P6; she is the front layer, her veil follows with the "back" depth timing). Text blocks come in with P1 word cascade (pill: P4-style pop is NOT in the grammar for pills — use the P1 rise/fade or `tagBuild` P13 for the pill). Ambient: slow linear drift on Juliana (`drift`, a few px/s) while it holds. No overshoot or bounce anywhere.
- Each text block enters when its first words are spoken (see Voice sync): pill ↔ "Dia 22 de outubro às 15 horas"; WORKSHOP + Grupo VIP ↔ "Workshop Grupo VIP"; title ↔ "como transformar clientes…"; description ↔ "A Juliana Marques…". Logo EnP + Juliana at scene start (9.8-10.3).
- Blocks stay on screen until the end (no exits inside scene 3). At the very end (28.8-29.3) nothing leaves — hold.

## Voice sync
Run `npx hyperframes transcribe` (see `/hyperframes-cli`, `/hyperframes-media` → `tts-to-captions.md`/`transcribe.md`) on each VO file to get word-level timings, then offset by the start times above. Use those times as the `at` values of the cascades. Also compare the transcript with the script text and report any mis-heard words ("Siiis Kids", "D2C Summit", "WhatsApp") — that is an objective pronunciation check.

## Audio mix (use `/hyperframes-audio`; all gains are linear unless dB)
Measured source loudness (integrated LUFS): vo-s1 -13.9 (TP +0.5 dBFS), vo-s2 -13.6, vo-s3 -16.8, bgm-a -16.8, bgm-b -14.6 (TP +0.2).
Target: voice ≈ -16.8 LUFS in all three scenes, music bed ≈ 13-14 dB BELOW the voice (≈ -30 LUFS), final mix true peak <= -1 dBFS.
- vo-s1 gain 0.72 (-2.9 dB), vo-s2 gain 0.69 (-3.2 dB), vo-s3 gain 1.0.
- bgm-a: starts 0.0, gain 0.22 (-13 dB), fade in 0.8 s, then crossfade into bgm-b between 8.5 and 9.8 (bgm-a fades out by 9.8, truncated there).
- bgm-b: starts 8.5, gain 0.17 (-15.4 dB), fade in over the crossfade (8.5-9.8), plays its full 20 s to 28.5 with a 1.0 s fade-out at the end (27.5-28.5).
- Optional: carve 2-3 dB from the music while a voice line plays (voiceover carve in `/hyperframes-audio`), only if it keeps the two music levels consistent.
- Mute the audio of the .mp4 clips (`muted` on `<video>`; do not add their audio track).

## Verification you must run and report
1. `npm run check` (inside this project folder) → no errors.
2. `npx hyperframes snapshot` (see `/hyperframes-cli`) at t = 1.5, 3.0, 5.5, 6.8, 8.0, 10.0, 12.0, 16.0, 22.0, 28.9 s into `snapshots/`; compare each against the Figma screenshots yourself (positions, sizes, text, wrapping) and fix mismatches.
3. Render: `npm run render` → mp4 1080x1920, 30 fps, h264+aac. Report `ffprobe` (duration, size, fps, streams).
4. Loudness of the final file: `ffmpeg -i <mp4> -af ebur128=peak=true -f null - 2>&1 | tail -12`; also measure the music-only and voice-only portions if you can (e.g. 0.0-0.4 s music only, a voiced second vs a gap) and report the dB difference.
5. Do NOT open the composition in any browser or run `npm run dev` / Studio. Do not touch git. Do not edit anything outside this project folder.

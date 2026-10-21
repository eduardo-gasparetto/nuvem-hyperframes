# 2026-10-15 — cubo-nuvem-ads-rmx (recreating "Cubo_Nuvem Ads.mp4" in HyperFrames)

## What was done
- Analysed the reference video (`~/Downloads/Cubo_Nuvem Ads.mp4`, 64 s, 1512x672, 30 fps, no audio) and the approved Figma storyboard
  (file `SKQs2AeYcQTmKzKasWce8j`, section node `117:46`, 21 static keyframes).
- Created `projects/cubo-nuvem-ads-rmx/` and rebuilt **scene 1 (0-23 s)**: gradient background, isologo propagation rings (left/right edges), pill "Anúncios Integrados",
  titles ("Seu cliente / está em todo lugar" -> "Sua marca / também deve estar" -> "E agora, Chat GPT"), social icons + avatars, site mockup with a scrolling store page,
  connector lines, scene exit/re-entry, ChatGPT icon, cursor + click, icons leaving, second scroll, exit, and the "7 em 10" stat scene. Timeline is 23 s.
- Extracted `reference/` (64 frames, 1/s, full-res) + Figma exports, and wrote `reference/motion-rules.md` with every measured rule.
- Verification loop for each piece: measure the video -> spec with exact numbers -> Haiku subagent builds -> compare snapshots vs video numerically -> fix -> commit.
  The scripts used are saved in `reference/tools/` (they take the video path and a snapshot folder as arguments).

## Decisions + why
- **The video is the ground truth, not the Figma storyboard.** Differences found and followed: mockup 16 px lower (top 76), tighter tracking on titles 1-2 (-1.4/-1.5 px) but Figma tracking on
  "E agora, Chat GPT", pill fill alpha 0.20 instead of 0.05, ChatGPT group at 69.4% of the Figma layout before the click, ring centres/offsets, 22-24 px/s page drift.
- Motion is measured, not guessed (kymographs, circle fits, template matching, per-word opacity/blur fits). Easing names follow GSAP: power1 = quad, power2 = cubic, power3 = quartic.
- Work split: main model plans/measures/reviews; Haiku 5.5 (high) subagents execute builds from numeric specs (see memory note).
- Studio edits by Eduardo (data-hf-id attributes, a stray label edit) are treated as the current state and never reverted without asking.

## Files touched
- `projects/cubo-nuvem-ads-rmx/` — `index.html`, `compositions/{bg,propagation,titles-scene1,stat-scene,icons-scene1,gpt-scene1,connectors-scene1,mockup-scene1,cursor-scene1,pill}.html`,
  `assets/{icons,avatars,site}/`, `shared/` (fonts + tokens copied from nuvem-hyper-01), `reference/{frames,figma,tools,motion-rules.md,README.md}`.
- `docs/worklog/` (this file). Branch: `session/2026-10-15-cubo-nuvem-ads-rmx` (from the git session branch; not merged to `main`).

## Final state
- `npm run check` passes (0 errors). Remaining lint: inert `css_transition_used` from shared tokens, `gsap_tween_tail` x4 on connector lines (false positives), layout infos for off-canvas motion.
- Measured agreement with the video: ring/word/cursor positions <= 1-3 px, exits/entrances within ~1 frame. Eduardo validated each piece visually in his own browser.
- Studio hub runs once at `http://localhost:4402/#cubo-nuvem-ads-rmx` (LaunchAgent `com.nuvem.hyperframes-hub`).

## Next step (planned for the next session)
- **Analyse this project and `reference/motion-rules.md` to extract the motion identity**: how text enters (per-word stagger 0.112 s / 0.166 s, fade power2.out 0.70 s + rise 26 px power1.out 0.65 s, linear exits of 0.33 s),
  blur-in for big numbers, pop-in for icons (power2.out ~0.6 s, +0.2 s stagger), exits as one cubic ease-in fall (1440 px / 0.88 s), re-entry ease-outs, linear connector lines, slow drift + eased "jump" scrolls,
  the pill's circle -> pill growth, and other recurring patterns. Turn them into reusable tokens/rules (a "motion identity" doc and possibly a skill or shared component library).

## Pending
- Scenes after 23 s are not built: photo scene (23-35 s), chat scene (35-54 s), closing logo (54-64 s) — measure first, same loop.
- No render to MP4 yet; no comparison of a full render vs the video.
- Known small gaps: ChatGPT icon centre 2 px left after the click; connector retraction ~0.03 s late; first-exit timing ~0.02 s late; pill label has Studio `data-hf-id` metadata.
- `reference/tools/*.py` expect python3 with numpy + Pillow and `ffmpeg` on PATH; paths are passed as arguments.

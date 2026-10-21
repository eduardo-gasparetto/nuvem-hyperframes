# Social pipeline — spec interview (complete)

Started 2026-10-19, branch `session/2026-10-15-social-specs`. Goal: write `SPEC.md` for the HyperFrames social pipeline, then implement in a fresh session.
Inputs: `shared/social/` (specs.json, rules.md, test), `docs/social-specs-research.md` sections 6, 7, 10, `docs/sources/`.

## Resolved
1. **Order of pieces the pipeline must produce:** (1) video created from scratch (animated Reel/Story in HyperFrames), then
   (2) recorded talking-head video with captions/overlays (`embedded-captions`, `graphic-overlays`), then (3) static images
   (4:5 post, carousel exported as PNG per slide). Build and verify in that order.
2. **How lints/standards act** (already in `shared/social/rules.md`): lints only detect; the agent adapts when the brief is
   silent, follows the brief and warns when it deviates on purpose, offers numbered options when the fix is more than an adjustment.
3. **Multi-ratio (Q2):** one composition per ratio, each with its own layout (matches rule "own layout per ratio, never
   auto-crop"). Text edits repeat per ratio — accepted. May evolve later to shared base content + per-ratio layout file.
4. **Carousel (Q3):** one parent composition with one sub-composition per slide (`compositions/slide-NN.html`, sequential
   on one track); shared elements live in the parent. Export via `snapshot` (see verification below).
   Verified 2026-10-19 (hyperframes 0.8.177, scratch test, 3 sub-composition slides at 1080×1350): `snapshot --composition=<id>
   --frames=1 --no-end` exports one PNG for one slide, `snapshot --at 0.5,1.5,2.5 --no-end` exports all slides; PNGs are 1080×1350
   RGB with shared parent elements (brand) included. Caveats: file names are `frame-NN-at-Xs.png` (renaming needed), and
   `--composition` picks a frame mid-interval, so slides must be static or settled at that point.

5. **Deviation notices (Q4):** terminal/chat plus one report file per piece next to its exports (e.g. `renders/<piece>/report.md`
   or `.json`), recording each deviation and whether it was intentional (brief) or adapted. No Studio/engine changes; Studio
   display may come later on request.

6. **Pilot (Q5):** Eduardo provides the real test piece when implementation reaches that step. The spec must not depend on
   a specific project; the implementation session pauses and asks for the piece before the end-to-end test.

7. **Folder layout and naming (Q6):** flat folders, one HyperFrames project per ratio: `projects/<piece>-9x16/`,
   `projects/<piece>-4x5/` (works with the hub today, no `apply-hack.mjs` change). Each project's `meta.json` carries
   `audio_license`; the export script checks it matches across the piece's ratios. Exports named
   `project_placement_ratio_variant_vNN`, next to the per-piece report (Q4). Verified 2026-10-19: hub discovery
   (`__hfDiscoverProjects` in `hub/apply-hack.mjs`) scans only direct children of `projects/`; a nested test project
   `projects/zz-nest-test/9x16/` did NOT appear in `GET localhost:4402/api/projects`.

8. **Script location (Q7):** pipeline scripts (safe-zone lint, export/rename, report, batch) live centrally in
   `shared/social/` next to `specs.json` / `rules.md`, run from the repo root (e.g. `node shared/social/export.mjs
   projects/<piece>-4x5`). Not copied into projects; `engine/` and `hub/` untouched.
   Presets sub-question settled by test 2026-10-19 (hyperframes 0.8.177): no engine/hack change needed. Canvas comes from
   `data-width`/`data-height`; a 1080×1350 scratch project passed `check`, exported PNGs via `snapshot` and rendered
   `out.mp4` as h264 1080×1350, 30 fps, 3.0 s (ffprobe). Only `hyperframes init` lacks a 4:5 / 3:4 preset, so new projects
   need a scaffold/template that sets the size.

9. **Still format (Q8):** export both PNG and JPG for every still, in separate folders (`png/` and `jpg/` inside the
   piece's render output). PNG comes from `snapshot`; JPG is converted from it with ffmpeg at high quality (default
   `-q:v 2`, adjustable). Both checked against the 30 MB image limit in `specs.json`.

10. **Out of scope for v1 (Q9), all deferred to a later version:** ad strategy and copy (hooks, best length, text limits,
   hashtags, wording); music selection (pipeline only records `audio_license`); open gaps (IG grid 3:4, IG 20-item carousel,
   TikTok organic specs, official TikTok safe-zone numbers, Facebook Reels max size and cover); publishing/scheduling to
   platforms; showing deviation notices inside Studio.

11. **End-to-end verification (Q10):** pilot + automated negative tests + carousel. Pilot (Eduardo's real piece, 9:16 + 4:5)
   runs lint → export → report; checks: video dims/fps/duration via ffprobe against `specs.json`, PNG + JPG in their
   folders with correct size and under 30 MB, names match `project_placement_ratio_variant_vNN`, one report per piece,
   Eduardo validates visuals. `node shared/social/pipeline.test.mjs` with fixtures that must warn (element outside safe
   zone, `audio_license` mismatch across ratios, bad name, image over limit). Pilot includes a 3-slide carousel exported as
   PNG + JPG. Recorded-video front depends on Eduardo having footage; if absent, marked pending, not verified.

Interview complete → `SPEC.md` written.

## Resume
In the new session: read this file, `shared/social/rules.md` and the research doc, then continue with the open question above.

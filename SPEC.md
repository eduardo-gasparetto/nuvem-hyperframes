# SPEC — Social content pipeline v1 (HyperFrames)

Status: agreed 2026-10-19 via spec-interview (`docs/social-pipeline-interview.md`). Implement in a fresh session.
Background: `docs/social-specs-research.md`, dataset and rules in `shared/social/` (`specs.json`, `rules.md`, `specs.test.mjs`).

## 1. What and why

A repeatable pipeline that turns one social piece into platform-ready files per aspect ratio (minimum Meta set: 9:16 + 4:5),
checks them against the standards dataset (`shared/social/specs.json`) and writes a report of every deviation. Today each
piece is built by hand with no safe-zone check, no naming standard and no record of what was delivered off-standard.

Build and verify in this order (Q1):
1. **Video from scratch** — animated Reel / Story composed in HyperFrames.
2. **Recorded video** — talking-head footage with captions / overlays (existing `embedded-captions`, `graphic-overlays` workflows).
3. **Stills** — 4:5 post and carousel, exported per slide.

## 2. Decisions (from the interview)

| # | Topic | Decision |
|---|---|---|
| Q1 | Order | Video from scratch → recorded video → stills. |
| — | Lint behaviour | As in `shared/social/rules.md`: lints only detect and warn, never block. Agent adapts when the brief is silent, follows the brief and warns when it deviates on purpose, offers numbered options when the fix is more than an adjustment. |
| Q2 | Multi-ratio | One composition per ratio, each with its own layout. No auto-crop, no shared-layout variables. Text edits repeat per ratio (accepted). |
| Q3 | Carousel | One parent composition + one sub-composition per slide (`compositions/slide-NN.html`, sequential on one track, 1 s each is enough). Shared elements (brand, background, numbering) live in the parent. |
| Q4 | Deviation notices | Printed in terminal/chat **and** written to one report per piece next to its exports. Nothing in Studio. |
| Q5 | Pilot | Eduardo provides the real piece when implementation reaches the end-to-end step. Implementation must not assume a specific project; pause and ask. |
| Q6 | Folders | Flat: one HyperFrames project per ratio, `projects/<piece>-9x16/`, `projects/<piece>-4x5/`. Each `meta.json` carries `audio_license`; the pipeline checks it matches across the piece's ratios. |
| Q7 | Scripts | Central in `shared/social/`, run from the repo root. Not copied into projects. `engine/` and `hub/` untouched. |
| Q8 | Still format | PNG **and** JPG for every still, in separate `png/` and `jpg/` folders. JPG converted from the PNG with ffmpeg, default `-q:v 2`. |
| Q9 | Out of scope | See section 5 — all deferred to a later version. |
| Q10 | Verification | Pilot + automated negative tests + carousel (section 6). |

## 3. Verified facts the design relies on (re-verified 2026-10-20, hyperframes 0.8.181 via npx; first run 2026-10-19 on 0.8.177)

- Canvas size comes only from `data-width` / `data-height`. A 1080×1350 scratch project passed `hyperframes check`,
  `hyperframes snapshot` exported 1080×1350 RGB PNGs, and `hyperframes render` produced h264 1080×1350, 30 fps, 3.0 s
  (ffprobe). No engine or hack change is needed for 4:5 / 3:4. `hyperframes init` has no 4:5 / 3:4 preset → the pipeline
  needs its own scaffold. Re-confirmed on 0.8.181: check passes, snapshots are 1080×1350 PNGs, render gives h264 1080×1350, 30/1 fps, 3.000 s (ffprobe).
- Carousel export works both ways: `snapshot --composition=slide-NN --frames=1 --no-end` (one slide) and
  `snapshot --at <t1>,<t2>,… --no-end` (all slides). Parent elements appear in every slide. Output names are
  `frame-NN-at-Xs.png` → must be renamed. `--composition` captures mid-interval → slides must be static/settled there. Re-confirmed on 0.8.181 (snapshot --composition and snapshot --at give identical images per slide). **Layout rule found on 0.8.181:** full-frame slides that overlap in time fail `check` (layout errors `text_occluded` and `content_overlap`); the slide sub-compositions must be time-windowed in the parent (e.g. slide 1 data-start 0 / data-duration 1.5, slide 2 data-start 1.5 / data-duration 1.5). The scaffold must generate them that way.
- Hub discovery (`__hfDiscoverProjects`, `hub/apply-hack.mjs`) scans only direct children of `projects/`. Nested
  projects are invisible to the Studio → reason for flat folders. Re-confirmed on 0.8.181 with a second hub instance on a scratch workspace: the flat project is listed, the nested one is not. Note: upstream moved the watcher ignore-set to packages/core/src/projectFolders.ts (PREVIEW_IGNORED_DIRS); apply-hack.mjs was retargeted to it. That set already ignores renders/ and outputs/ for live reload.
- `**/renders/` is already gitignored.
- **Version:** the engine in engine/ is now 0.8.181 (hub/engine.ref b7fa007bf). Existing projects still pin `hyperframes@0.8.158` in package.json; the checks above ran on 0.8.181 via npx. Decided by Eduardo on 2026-10-20: the scaffold for new social projects pins the latest tested version (0.8.181) and is bumped on purpose (use `hub/check-updates.mjs` before bumping); existing projects are left as they are.

## 4. What to build

All new code in `shared/social/`, ESM Node scripts in the style of `specs.test.mjs` (no new dependencies unless unavoidable;
ffmpeg/ffprobe are already installed). Names below are the defaults, approved by Eduardo on 2026-10-20 (meta.json `social` block, script names,
`renders/<piece>/`, `data-safe="critical"`, `_sNN`); adjust only if implementation shows a reason, and say so.

### 4.1 Piece metadata — `projects/<piece>-<ratio>/meta.json`
Keep the existing `id` / `name` fields and add a `social` block:
```json
{
  "id": "<piece>-4x5",
  "name": "<piece>-4x5",
  "social": {
    "piece": "<piece>",
    "placement": "ig_feed_4x5",
    "kind": "video | still | carousel",
    "variant": "a",
    "version": 1,
    "audio_license": "<license id or 'none'>"
  }
}
```
`placement` must be an `id` from `specs.json`. The ratio comes from that record's `canvas.ratio`.

### 4.2 Scaffold — `shared/social/new.mjs`
`node shared/social/new.mjs <piece> <placement-id> [--kind video|still|carousel] [--slides N]`
→ creates `projects/<piece>-<ratio>/` with `index.html` at the placement's canvas size, `meta.json` (4.1),
`package.json` matching existing projects, the brand copies the project needs (`shared/fonts`, `shared/video` per
the root `CLAUDE.md`), and for `carousel` the parent + `compositions/slide-01..N.html`. Must pass `npx hyperframes check`
right after creation.

### 4.3 Lint — `shared/social/lint.mjs`
`node shared/social/lint.mjs projects/<piece>-<ratio>` → warnings only (exit 0 unless `--strict`):
- **Safe zone:** critical content inside the placement's `safe_zone` (incl. the `notch` strip when present). Which
  elements are critical: elements marked `data-safe="critical"`, plus all text by default. `safe_zone: null` → no check,
  one info line. Warned once per element, not per frame (`rules.md`). **Sampled, not continuous (decided
  2026-10-20, simpler on purpose):** element boxes are measured at a few moments only — start, middle and end for video;
  the settled frame of each slide for stills/carousels — using the same snapshot mechanism as export. A text that crosses
  the zone only mid-animation can slip through; the visual guide (4.4) covers that by eye. Exact method (e.g. `snapshot` +
  page measurement) is picked at implementation; if no way works without touching `engine/`, stop and offer options.
- **Canvas:** `data-width`/`data-height` equal the placement canvas.
- **Duration / file size:** against `video.duration_s` and `video.max_file_mb` / image limit (30 MB); `null` → skip.
- **Carousel:** same ratio for all slides; slide count within `carousel.ad` / `carousel.organic` max.
- **Naming and metadata:** `meta.json` `social` block valid; placement id exists.
- Warning format from `rules.md`: what the brief/piece has, what the standard says (`specs.json` id + value + `status`),
  likely consequence.

### 4.4 Export — `shared/social/export.mjs`
`node shared/social/export.mjs <piece>` → for every `projects/<piece>-*` project:
1. Run lint (4.3).
2. Check `audio_license` is identical across the piece's projects; mismatch → warning.
3. Video: `hyperframes render`, then ffprobe the result against the placement (dims, fps, codec, duration).
4. Still / carousel: `hyperframes snapshot` (one PNG per slide), rename, then ffmpeg → JPG. Both checked for dims and size limit.
5. Visual guide: for each exported image (and for the start/middle/end frames of each video) write a copy with the
   placement's `safe_zone` (and `notch`) drawn on top (ffmpeg `drawbox`, from the `specs.json` values), so the safe zone
   can be checked by eye.
6. Write outputs to `renders/<piece>/` (repo root, gitignored):
   ```
   renders/<piece>/
     video/<project>_<placement>_<ratio>_<variant>_vNN.mp4
     png/<project>_<placement>_<ratio>_<variant>_vNN[_sNN].png
     jpg/<project>_<placement>_<ratio>_<variant>_vNN[_sNN].jpg
     guide/<project>_..._vNN[_sNN|_start|_mid|_end].png   (safe zone drawn over the frame)
     report.md
   ```
   Ratio written as `9x16` / `4x5`; `_sNN` = slide number for carousels; `vNN` from `meta.json` `version`.

### 4.5 Report — `renders/<piece>/report.md`
One per piece: date, hyperframes version used, per project: placement, files produced (+ ffprobe/size results),
`audio_license`, and every warning from lint/export, each tagged **adapted** (agent fixed it), **brief** (intentional
deviation) or **open** (not fixed). The same warnings are printed in the terminal.

### 4.6 Tests — `shared/social/pipeline.test.mjs`
`node shared/social/pipeline.test.mjs`, fixtures under `shared/social/fixtures/`. Each must produce its warning:
- element outside the safe zone (incl. one inside the 9:16 notch strip),
- `audio_license` mismatch across two ratios of one piece,
- bad output name / invalid `meta.json` placement,
- image over the size limit,
- plus one clean fixture that produces **no** warnings.
`specs.test.mjs` keeps passing.

### 4.7 Docs
Short "how to run" section in `shared/social/rules.md` (scaffold → build → lint → export). Root `CLAUDE.md`: one line
pointing to it.

## 5. Out of scope (v1) — deferred to a later version

- Ad strategy and copy: hooks, best length, text limits, hashtags, wording.
- Music selection (pipeline only records `audio_license`).
- Open dataset gaps: IG grid 3:4, IG 20-item carousel, TikTok organic specs, official TikTok safe-zone numbers,
  Facebook Reels max file size and cover.
- Publishing / scheduling to platforms.
- Showing deviation notices inside the Studio.
- Shared base content across ratios (possible v2 evolution of Q2).
- Any change to `engine/` or `hub/`.

## 6. End-to-end verification

1. `node shared/social/specs.test.mjs` and `node shared/social/pipeline.test.mjs` pass; paste the output.
2. **Pause and ask Eduardo for the pilot piece.** Build it with the pipeline:
   - video from scratch in 9:16 + 4:5 (`new.mjs` → compose → `lint.mjs` → `export.mjs`);
   - a 3-slide carousel in 4:5 exported as PNG + JPG;
   - recorded video with captions/overlays **if Eduardo has footage**; otherwise mark this front **pending, not verified**.
3. Check and paste evidence:
   - `npx hyperframes check` passes in every pilot project;
   - ffprobe of each MP4 matches the placement (dims, fps, codec, duration within limits);
   - PNG and JPG exist in their folders, correct dims, under 30 MB;
   - every file name matches `project_placement_ratio_variant_vNN[_sNN]`;
   - `renders/<piece>/report.md` exists and lists every warning with its tag.
4. Eduardo validates the visuals in his own browser (agent does not judge aesthetics).
5. Adversarial review (`/code-review`) of the diff against this spec before delivery.

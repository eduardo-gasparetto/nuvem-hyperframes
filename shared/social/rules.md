# Social content rules

Pipeline rules for social content (stories, reels, posts, carousels, ad creatives). Scope: graphic design and production
only — no ad strategy or copy. Values live in `specs.json`; research and sources in `docs/social-specs-research.md`.

## These are standards, not laws

Everything below is the default, not a gate. If a storyboard, script or brief deviates (other safe zone, ratio, duration,
carousel count, etc.): **follow the brief, cite the inconsistency, and warn the user.** Never block or stall production.
- Lints only detect and describe; the agent that runs them decides what to do:
  1. Brief is silent on the point → follow the standard, adapt the work (move/resize the element) and say what changed.
  2. Brief deviates on purpose → follow the brief and warn about the inconsistency.
  3. Following the standard would need more than an adjustment (cutting content, changing duration, redoing layout) →
     stop and offer 2–3 numbered options for the user to pick.
- Warning format: what the brief says, what the standard says (`specs.json` id + value + `status`), the likely consequence.
- Lints report as warnings by default. Only an explicit request from the user makes one an error.
- Mismatches that are only a crop risk (e.g. text outside the safe zone) are warned once, not repeated per frame.

## Dataset

- One record per placement in `specs.json`: canvas, safe zone (px + %), video specs, carousel rules, cover, sources.
- Every section carries `status` (`official` | `press` | `third-party` | `internal`); every record carries `verified_at`.
  `null` means "no published value" — never guess a number. Re-verify quarterly.
- `universal_9x16` is the conservative box for any 9:16 placement. The test enforces it covers every 9:16 record.
- Edit the JSON, then run `node shared/social/specs.test.mjs`.

## Rules

1. Own layout per ratio. Never rely on platform auto-crop. Minimum Meta ad set: 4:5 + 9:16.
2. Background bleeds to the canvas edges; critical content stays inside the safe zone (taller screens may zoom or letterbox).
3. Lint before render (warnings, never blocking): content inside the safe zone, duration and file size within the placement limits.
4. Clean render per platform: no other platform's watermark (TikTok treats watermarked repurposed content as unoriginal).
5. Carousels: one aspect ratio for all items; respect the max item count of the placement.
6. Burned-in captions always sit inside the safe zone.
7. Legibility is our own rule (no platform publishes a minimum font size or contrast) — defined in the visual identity, not here.
8. Every export records `audio_license`. TikTok commercial use requires the Commercial Music Library.
9. File naming: `project_placement_ratio_variant_vNN`.

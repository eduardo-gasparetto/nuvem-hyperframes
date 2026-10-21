# Social content specs — research (2026-10-15)

Input for the next session: build reusable **graphic design + production pipeline** standards for social content
(stories, reels, posts, carousels, ad creatives) in this hub.

**Scope.** In: canvas/formats, grid crop, covers/thumbnails, safe zones, technical specs (codec, fps, bitrate, file size,
accepted duration), carousel production rules, on-image text legibility as design, burned-in captions (visual only: zone,
size, contrast, style), pipeline (presets, per-ratio layout, safe-zone lint, batch variants, video + still export, naming,
clean per-platform render, `audio_license` check). **Out:** ad strategy (hooks, best-performing length, variant counts,
fatigue, CTA strategy), copy (caption/headline/primary-text limits, hashtags, "more" truncation), ad wording policy,
music selection.

**Status legend:** `official` = official page read · `press` = official statement via press · `third-party` · `internal` =
our own decision (no platform value exists). Specs change — every value carries a source and `verified_at`.

## 1. Canvas

| Ratio | Size | Use | Status |
|---|---|---|---|
| 9:16 | 1080×1920 (Meta ads recommend 1440×2560) | Stories, Reels, TikTok, Shorts | official (Meta Ads Guide; TikTok video advertising guide: "1080×1920 or higher") |
| 4:5 | 1080×1350 (Meta ads recommend 1440×1800) | IG/FB feed, IG carousel, LinkedIn | official (Meta Ads Guide) |
| 3:4 | 1080×1440 | Shows uncropped in the IG profile grid (3:4 since Jan 2025) | press — feed acceptance of 3:4 not verified |
| 1:1 | 1080×1080 | Meta + LinkedIn carousel ads, X | official |
| 2:3 | 1000×1500 | Pinterest | official |
| 16:9 | 1920×1080 | YouTube, LinkedIn video | official |

- Each ratio gets its own layout — never rely on platform auto-crop. Meta Advantage+ enables 4:5 and 9:16 by default
  (developers.facebook.com, advantage-creative/get-started) → minimum ad set is 4:5 + 9:16.
- A 4:5 post loses ~34 px per side in the 3:4 grid thumbnail (1350 × 0.75 = 1012 px wide). Keep key content centred.
- Taller-than-9:16 screens: Meta may zoom to fill (crops outside the safe zone) or letterbox in black → bleed the
  background to the edges, keep critical content well inside the safe zone.

## 2. Safe zones (1080×1920)

| Placement | Top | Bottom | Sides | Status / source |
|---|---|---|---|---|
| Meta 9:16 (Stories, Reels, 9:16 feed video, FB in-stream reels) | 14% (~270 px) | 35% (~670 px); **40% (~770 px) when Reels ads carry labels** | 6% (~65 px) | official — pt-br.facebook.com/business/ads-guide/update/video/instagram-reels; pt-br.facebook.com/business/help/980593475366490 |
| FB Stories ad | 14% (~250 px) | 20% (~340 px) | — | official — pt-br.facebook.com/business/ads-guide/update/video/facebook-story |
| IG feed 1:1 / 4:5 | — | keep clear (no number) | keep clear (no number) | official wording, numbers → internal |
| TikTok | ~160 | ~440 | ~80; right action rail ~240 measured | third-party. TikTok publishes no numbers — only downloadable overlays (ads.tiktok.com/resources/help/article/tiktok-auction-in-feed-ads) |
| YouTube Shorts | ~120 | ~300 | ~96 | third-party; Google offers an official template without px (support.google.com/google-ads/answer/13547298) |

- **Proposed universal 9:16 box (worst case per side):** top 14%, bottom 40%, left 6%, right enlarged for TikTok
  (~12–22%, confirm against the official overlay). Status: internal.
- Official check before publishing: Meta Ads Manager safe-zone grid (yellow overlay).

## 3. Technical specs

- Universal video: MP4, H.264, AAC ≥ 128 kbps (Meta, LinkedIn, X — official). YouTube: AAC-LC 384 kbps stereo, 1080p 8 Mbps
  at 24–30 fps / 12 Mbps at 48–60 (support.google.com/youtube/answer/1722171). 30 fps default; LinkedIn wants < 30 fps; X caps at 60.
- Accepted durations (official unless noted): Meta Reels ad up to 15 min · FB Stories ad 1 s–3 min (cards of 15 s) ·
  IG Stories ad 1–120 s (one-sheeter; conflicts with Ads Guide "1 s–60 min") · IG Reels 3 s–3 min (about.instagram.com, Sep 2026) ·
  IG Stories 60 s per card · YouTube Shorts up to 3 min · TikTok ad up to 10 min, ≤ 500 MB · LinkedIn 3 s–30 min, 75 KB–500 MB ·
  Pinterest 4 s–15 min, 2 GB · X up to 2:20, ≤ 1 GB.
- Thumbnails: YouTube 3840×2160 (16:9), Shorts 2160×3840 (9:16), 50 MB desktop (support.google.com/youtube/answer/72431).

## 4. Carousels

- One aspect ratio per carousel (X requires it; others conflict → treat as mandatory).
- Max items: Meta ad 2–10 (1:1) · LinkedIn ad 2–10 (1080×1080) · TikTok ad 2–20 · X 2–6 — official. IG organic 20 — press (Aug 2024), not verified.
- LinkedIn document posts: PDF, up to 300 pages / 100 MB (snippet only); animations render static.

## 5. Legibility (design only)

- Meta official: "modern, clean font, large enough, contrasting colour; don't obstruct the visuals; keep content inside the
  safe zone" (help/980593475366490). TikTok official: "everything easy to see without zooming"; captions recommended.
- No platform publishes a minimum font size or contrast ratio → define our own (internal).
- Burned-in captions: always inside the safe zone.

## 6. Pipeline rules

1. One spec record per placement in a JSON dataset (canvas, safe zone px + %, technical specs, duration range, carousel rules,
   cover/thumb, source URL, `status`, `verified_at`). Re-verify quarterly.
2. Own layout per ratio; background bleeds to the edge.
3. Lint before render: content inside the safe zone, duration and file size within limits.
4. Clean render per platform — no other platform's watermark (TikTok originality policy, official: watermarked/repurposed
   content without creative edits is unoriginal and can leave the For You feed).
5. `audio_license` field on export — TikTok: "Businesses should instead use the Commercial Music Library for all commercial
   TikTok activities" (ads.tiktok.com/help/article/commercial-music-library), covering organic, ads and branded content.
6. File naming: `project_placement_ratio_variant_vNN`.

## 7. What HyperFrames already has (engine scan)

- Canvas presets: landscape 1920×1080, portrait 1080×1920, square 1080×1080 (+ 4k) — `engine/packages/cli/src/commands/init.ts:756`.
  No 4:5 or 3:4 render preset (4:5 / 9:16 exist only as Studio crop presets). Canvas comes from `data-width` / `data-height`.
- Render: `--format` mp4 | webm | mov (ProRes 4444 alpha) | gif | png-sequence | hls; `--fps`, `--quality`, `--crf`, `--video-bitrate`.
- Batch: `--batch rows.json --output "renders/{name}.mp4"` + `--variables` / `--variables-file`.
- Safe-zone-like lint: `hyperframes check --caption-zone "x0=…;y0=…;x1=…;y1=…;severity=error"` (`check.ts:229`), waiver
  `data-layout-allow-caption-zone`. Studio preview has only generic action/title safe (90% / 80%).
- Stills: `hyperframes snapshot --at t1,t2` → PNG. No JPG / per-slide carousel export.
- `engine/` is never edited by hand — build the pipeline outside it (shared/ + hub scripts) or via `hub/apply-hack.mjs`.

## 8. References

- No ready, trustworthy JSON dataset of specs + safe zones exists → we build ours.
- Cross-check only: AdKit safe-zone overlays (adkit.so/tools/safe-zones/meta, updated Sep 2026; self-declared buffers, not official).
- Official overlays: TikTok (in-feed ads help article), Google Ads (answer/13547298).

## 9. Open gaps (still relevant to the scope)

- [ ] IG grid 3:4 and whether 3:4 feed uploads stay uncropped — test on a test account.
- [ ] IG organic carousel max 20 — test on a test account.
- [x] Reels cover size — resolved 2026-10-19 from pasted help.instagram.com/1038071743007909: official recommendation is still 420x654 (1:1.55), png/jpg, not editable after upload; reels 1.91:1–9:16, min 30 fps, min 720 px.
- [ ] TikTok organic technical specs (max length, photo mode count/size).
- [x] Facebook Reels specs — organic resolved 2026-10-19 from Meta for Developers reels-publishing guide (min 540x960, 24–60 fps, 3–90 s, H.264/H.265; conflicts with Meta statement of no length limits). Still unknown: max file size, cover size. Ads: covered by meta_9x16.
- [x] IG Stories ad safe zone — closed 2026-10-19 from help/980593475366490 incl. official diagram: 14% top, 6% sides, 35% bottom (40% in the right-hand 21% strip, Reels ads with labels); Meta says Stories share this zone with Reels. Duration conflict (60 min vs 1–120 s) stays recorded in specs.json (120 s stored).
- [x] Meta recommended aspect-ratio set — resolved 2026-10-19 from pasted help/682655495435254: IG Feed images 4:5, IG Feed videos 9:16, FB Feed 4:5; Stories/Reels 9:16. Confirms min set 4:5 + 9:16.
- [ ] TikTok safe-zone numbers from the official overlay files — **deferred by Eduardo (not the current focus)**; dataset keeps the third-party values.

Official help centers (Instagram, TikTok, many Meta pages) render empty to the research agents; pasting the page text in chat worked.

## 10. Next session — plan

1. **Spec dataset** (small): `shared/social/specs.json` + `shared/social/rules.md` + a node test (required fields, safe zone
   inside canvas). Open gaps enter as `third-party` with conservative values.
2. **HyperFrames pipeline** (large → run `spec-interview` first): 4:5 / 3:4 presets, safe-zone lint generated from the
   dataset, still export for posts/carousels, batch render per ratio, naming.
3. **Close gaps** in parallel; update `status` / `verified_at` as data arrives.

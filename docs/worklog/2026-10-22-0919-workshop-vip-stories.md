# 2026-10-22 — workshop-vip-stories (v1 benchmark)

## What was done
- Real brief (3 Instagram stories announcing the online "Workshop Grupo VIP", 22 Oct 15h) built end to end as a benchmark of everything made in the last days: HyperFrames hub, `nuvem-gemini` plugin (video, voice), motion identity, cost tracking.
- Analyzed the approved Figma frames (file `MuJFHhtG9jKET6qF4jcwtm`, node 127:34); extracted exact layout numbers, photo crops and assets.
- New project `projects/workshop-vip-stories/` (engine pinned 0.8.181): one 1080x1920, 30 fps, 29.3 s composition with 3 scene sub-compositions, transitions from `shared/video/motion.js`, narration and 2 music tracks with a crossfade at the scene 2→3 transition. Final file: `renders/workshop-vip-stories.mp4` (gitignored, local only).
- Subagents: Haiku 5.5 (2 Gemini image→video clips; 3 TTS voice files + 2 Lyria tracks), Sonnet 5.5 high (composition, transcription sync, mix, render). Orchestrator did the Figma extraction, crops, spec and verification.
- Fixed a cost-tracking bug in `nuvem-gemini/scripts/cost_tracker.py`: the log path was relative to the current directory, so the 2 video entries landed in `projects/workshop-vip-stories/assets/img/generated-media/`. Now relative paths resolve from the plugin root; the 2 entries were appended to the plugin log (old file renamed `.cost-log.jsonl.migrated`). Verified `session-total` and `report` from `/tmp` and `~`: 5 entries, US$ 0.8059.

## Decisions + why
- Story 1 photo = D2C stage variant, story 2 = workshop room variant (the 3 Figma variants per story share the same text; treated as alternatives). Eduardo approved.
- Juliana (transparent cutout) animated with the motion presets, not Gemini: generated video would not keep the alpha.
- One composition rendered in a single pass instead of 3 renders joined with ffmpeg: simpler, audio mixed inside the composition.
- Gemini caps raised to US$ 100 (call and session) in `nuvem-gemini/references/config.md` because the project is a benchmark. Not restored yet.
- Music: Gemini TTS/Omni cannot make music, so Lyria (via `media-use` recipe, same API key); its cost is not published and not tracked.
- Figma colors and text win over video tokens (Eduardo's rule). The screen shows "chegou sua vez" (Figma) while the voice says "chegou a sua vez" (briefing).

## Files / areas touched
- `projects/workshop-vip-stories/` (index.html, compositions/scene-1..3.html, assets/{img,gemini,audio}, transcripts/, snapshots/, reference/build-spec.md and Figma screenshots). Commit `585d482` on `session/2026-10-22-workshop-vip-stories`.
- Outside the repo: `nuvem-gemini/scripts/cost_tracker.py` (path fix), `nuvem-gemini/references/config.md` (caps), `nuvem-gemini/generated-media/.cost-log.jsonl` (migrated entries).

## Final state / next step
- v1 delivered and kept as is. Measured: 1080x1920, 30 fps, 29.3 s, final true peak -1.1 dBFS, voice 12-15 dB above music (spec asked 13-14; scene 1 is 12.3 dB).
- Next session: v2 with adjustments Eduardo will name.
- Candidates seen, not decided: re-record scene 1 voice ("D2C Summit" was transcribed as "Dítio C"), shorten scene 3 narration (18 s), raise music 2-3 dB, restore Gemini caps (US$ 1 / US$ 5).

## Pending
- Not verified: how the video looks and sounds (Eduardo validates in his own player); pronunciation of "D2C Summit" and "Siiis Kids".
- Branch not merged to main (no order given). `projects/cubo-nuvem-ads-rmx/.hyperframes/` changes were left untouched on purpose.

## Production cost estimate (this piece, this session only)
- Claude: US$ 4.31 billed (account-wide delta, includes some noise) / US$ 3.53 list-price estimate.
- Gemini: US$ 0.81 (2 video clips US$ 0.80 + 3 voice files US$ 0.0059).
- Lyria (34 s of music): unknown, not published.
- Total ≈ US$ 4.3 (estimate basis) to US$ 5.1 (billed basis) + Lyria. Does not include building the hub, the Gemini plugin or the cost hooks in earlier sessions.

## Cost
- Billed (extra usage delta): US$ 4.31 (US$ 155.45 at 2026-10-22T07:48:48 -> US$ 159.76; account-wide)
- Estimate (transcript, list price): US$ 3.53 (claude-sonnet-5-5: 14.03M in / 85k out, claude-haiku-5-5: 1.28M in / 11k out; prices: docs 2026-10-19 (cache))

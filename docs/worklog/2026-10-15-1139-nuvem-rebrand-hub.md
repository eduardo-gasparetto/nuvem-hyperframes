# 2026-10-15 — Re-scope hub to Nuvemshop (drop EnP)

## What was done
- Renamed root folder `enp-hyperframes` → `nuvem-hyperframes`.
- Archived EnP content in `archive/enp/` (outside the Studio workspace, kept as history):
  - `projects/enp-*` (6 projects) → `archive/enp/projects/`
  - everything in `shared/` (EnP tokens, template, fonts, logos) → `archive/enp/shared/`
  - "Camada de marca EnP" section of `docs/notes.md` → `archive/enp/README.md` (verbatim)
  - old LaunchAgent plist and logs → `archive/enp/service/`
- `projects/` now holds `nuvem-hyper-01`, `demo`, `fake-landing`, `fake-promo`. `shared/` kept as an empty dir.
- LaunchAgent renamed `com.enp.hyperframes-hub` → `com.nuvem.hyperframes-hub` (port 4402 unchanged); paths and log names updated.
- Rewrote `CLAUDE.md`, `hub/HACK.md`, `docs/notes.md` for the new name/layout.
- Saved the local engine patch as `hub/engine-patch.diff` (safety copy; the source of truth is still `hub/apply-hack.mjs`).
- Copied Claude Code project memory to the new path key (`-Users-...-nuvem-hyperframes`); old one left in place.

## Decisions + why
- Archive instead of delete: Eduardo wanted EnP only "registered in history".
- Engine untouched: it has no absolute paths, so the rename cannot break the hack/build.
- Non-EnP-named projects (`demo`, `fake-*`) stay in `projects/`.

## State / next step
- Reopen Claude Code in `/Users/eduardogasparetto/Claude Projects/nuvem-hyperframes`.
- `AGENTS.md` and `skills-lock.json` were not touched (no EnP refs).
- Historical entries in `docs/WORKLOG.md` and `docs/notes.md` timeline still mention the old folder name on purpose.

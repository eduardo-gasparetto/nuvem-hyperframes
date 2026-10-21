# nuvem-hyperframes — Hub multi-projeto HyperFrames

**Esta pasta não é uma composição HyperFrames** — é um hub local que roda **um único Studio
multi-projeto** sobre o engine open-source (patch local, não é feature oficial do framework).
As composições de verdade vivem cada uma na sua subpasta dentro de `projects/`.

```
nuvem-hyperframes/
├── engine/      ← clone git oficial do heygen-com/hyperframes. NUNCA editar à mão —
│                  mudanças tocadas por node update.mjs/apply-hack.mjs (ver hub/).
├── hub/         ← tooling do hack multi-projeto. Ler hub/HACK.md antes de mexer aqui.
│   │              apply-hack.mjs (codemod idempotente) / update.mjs (pull + reaplica +
│   │              rebuild) / start.mjs (sobe o Studio). Roda como LaunchAgent macOS
│   │              (com.nuvem.hyperframes-hub, porta 4402 fixa) — ver HACK.md pra status/restart.
├── projects/    ← HF_WORKSPACE. CADA SUBPASTA AQUI é um projeto HyperFrames de verdade
│   │              (index.html próprio, roda `npm run dev`/`npx hyperframes check` dentro
│   │              dela). O Studio do hub detecta cada subpasta automaticamente.
├── shared/      ← matriz de marca, copiada (não linkada) pra dentro de cada projeto que usa:
│   │              fonts/ + fonts.css (comuns), ui/ (tokens de interface, skill insti-styleguide),
│   │              video/ (identidade de vídeo: visual-identity.md, video-tokens.css,
│   │              motion-identity.md, motion.js). ui e video são sistemas separados — não misturar.
├── archive/enp/ ← projetos e assets EnP arquivados (fora do Studio). Só histórico —
│                  este hub não tem mais ligação com EnP. Ver archive/enp/README.md.
└── docs/        ← WORKLOG.md (log de sessão) e notes.md (notas de arquitetura do framework)
```

**Sem `package.json` na raiz** — comandos `npm run dev/check/render` rodam *dentro* de uma
pasta de `projects/<nome>/`, nunca aqui.

**Repositório git (raiz):** versiona hub, projects, docs, archive e skills. O `engine/` **não** é
versionado — `hub/engine.ref` fixa o commit do upstream. Pra reconstruir numa máquina nova:
`git clone <repo> && node hub/update.mjs --first-time` (clona o engine no commit fixado, reaplica o
hack e builda). Um `update.mjs` normal bem-sucedido regrava o `engine.ref` — commitar essa mudança.

**Atualizar o engine:** `cd hub && node update.mjs` (reset --hard → pull → reaplica o hack →
rebuild). Depois `launchctl kickstart -k gui/$(id -u)/com.nuvem.hyperframes-hub` pro serviço
pegar o build novo. Se o `apply-hack.mjs` falhar, o upstream mudou o trecho-alvo — ver a
seção "Failure mode" do HACK.md.

**Identidade visual:** Nuvemshop. Vídeo → `shared/video/` (ler `visual-identity.md` e
`motion-identity.md` antes de compor; usar `video-tokens.css` + `motion.js`). Interface → `shared/ui/`
(skill `insti-styleguide`). Cada projeto carrega sua própria cópia dentro da própria pasta em
`projects/` — o Studio não segue symlinks pra fora dela. Editar sempre a matriz em `shared/` e
recopiar; `node shared/video/motion.test.mjs` depois de mexer no `motion.js`.

---

## Skills — USE THESE FIRST

**Always invoke the relevant skill before writing or modifying compositions.** Skills encode framework-specific patterns (e.g., `window.__timelines` registration, `data-*` attribute semantics, shader-compatible CSS rules) that are NOT in generic web docs. Skipping them produces broken compositions.

**Doing anything with HyperFrames?** Start at `/hyperframes` — it tells you what HyperFrames can do and which skill or workflow handles your intent (make a video, TTS / BGM, prep footage, author / animate, render, install blocks), and routes every "make me a video" request to the right workflow. Read it first, especially when there's no project context to orient you. The video workflows it routes to:

- `/product-launch-video` — a **product** URL or brief / script → 60-90s product launch / SaaS / promo video.
- `/website-to-video` — a **general** website / URL → a video _of_ the site (tour / showcase / social clip from captured visuals); a product **launch / promo** is `/product-launch-video`.
- `/faceless-explainer` — arbitrary text (topic / article / notes), **no URL, no website capture** → 60-90s faceless explainer.
- `/embedded-captions` — an existing talking-head video (MP4) → the same footage with captions / subtitles added (rail + embed, or pure-cinematic embed); the footage itself is untouched.
- `/graphic-overlays` — an existing talking-head / interview / podcast video (MP4) → the same footage **packaged with designed graphic overlays** (kinetic titles, lower-thirds, data callouts, pull-quotes, side panels, pip) synced to the transcript; the clip plays unchanged underneath. (Plain captions/subtitles → `/embedded-captions`.)
- `/pr-to-video` — a GitHub PR (URL / `owner/repo#N` / "this PR") → 30-90s code-change explainer (changelog / feature reveal / fix / refactor).
- `/motion-graphics` — a short (typically under 10s) design-led **motion graphic**, motion-is-the-message, no narration: kinetic type, a stat / number count-up, a chart, a logo sting, a lower-third / overlay, or an animated tweet / headline / captured-page highlight; rendered to MP4 or a transparent overlay. Longer / narrated / custom → `/general-video`.
- `/general-video` — fallback for any other video (title card, longer brand / sizzle reel, multi-scene montage, static loop, custom composition); the original hyperframes authoring flow, any length.

**Porting an existing composition?** `/remotion-to-hyperframes` translates a Remotion (React) composition into HyperFrames HTML — a source migration, separate from the creation workflows above.

The domain skills (`/hyperframes-core`, `/hyperframes-animation`, `/hyperframes-creative`, `/hyperframes-cli`, `/hyperframes-media`, `/hyperframes-registry`) and the full capability map live inside `/hyperframes` — it is the single source of truth for which skill handles which intent.

> **Tailwind v4 projects** (`hyperframes init --tailwind`): see `/hyperframes-core` → `references/tailwind.md`.

> **Skills not available?** Ask the user to run `npx hyperframes skills` and restart their
> agent session, or install manually: `npx skills add heygen-com/hyperframes`.

## Commands

**Rodar sempre dentro da pasta do projeto** (`projects/<nome>/`), nunca na raiz — não há
`package.json` aqui. Pra ver os 8 projetos num Studio só, use o hub: `cd hub && node start.mjs`
(ou o serviço do LaunchAgent já fixo em `localhost:4402`, ver seção acima).

```bash
npm run dev          # start the preview server (long-running — keep it alive in background)
npm run check        # lint + validate + inspect
npm run render       # render to MP4
npm run publish      # publish and get a shareable link
npx hyperframes lint --verbose  # include info-level findings
npx hyperframes lint --json     # machine-readable output for CI
npx hyperframes docs <topic> # reference docs in terminal
```

> **`npm run dev` is a long-running server, not a one-shot command.** It blocks until stopped.
> In Claude Code, always run it with `run_in_background: true`. Never run it as a foreground
> command — it will time out and the server will die, breaking the browser preview.

## Documentation

**For quick reference**, use the local CLI docs command (no network required):

```bash
npx hyperframes docs <topic>
```

Topics: `data-attributes`, `gsap`, `compositions`, `rendering`, `examples`, `troubleshooting`

**For full documentation**, discover pages via the machine-readable index — do NOT guess URLs:

```
https://hyperframes.heygen.com/llms.txt
```

## Project Structure

- `index.html` — main composition (root timeline)
- `compositions/` — sub-compositions referenced via `data-composition-src`
- `meta.json` — project metadata (id, name)
- `transcript.json` — whisper word-level transcript (if generated)

## Linting — ALWAYS RUN AFTER CHANGES

After creating or editing any `.html` composition, **always** run the full check before considering the task complete:

```bash
npm run check
```

Fix all errors before presenting the result. Inspect warnings should be reviewed before rendering.

## Key Rules

1. Every timed element needs `data-start`, `data-duration`, and `data-track-index`
2. Elements with timing **MUST** have `class="clip"` — the framework uses this for visibility control
3. Timelines must be paused and registered on `window.__timelines`:
   ```js
   window.__timelines = window.__timelines || {};
   window.__timelines["composition-id"] = gsap.timeline({ paused: true });
   ```
4. Videos use `muted` with a separate `<audio>` element for the audio track
5. Sub-compositions use `data-composition-src="compositions/file.html"` to reference other HTML files
6. Only deterministic logic — no `Date.now()`, no `Math.random()`, no network fetches

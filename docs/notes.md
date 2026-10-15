# HyperFrames — Notas de Exploração

> Repo: https://github.com/heygen-com/hyperframes
> "Write HTML. Render video. Built for agents." — framework open-source (HeyGen, Apache 2.0)

## Visão geral

HyperFrames transforma **HTML + CSS + mídia + animações seekable** em **vídeos MP4 determinísticos**.
Você descreve o vídeo como uma página web e o motor "filma" essa página quadro a quadro.

Mecânica completa em uma frase:
> HTML declara timing (`data-*`) → scripts/adapters dizem como cada frame aparece → o motor
> varre frame a frame em Chrome headless e encoda com FFmpeg → skills ensinam agentes a dirigir
> esse pipeline → o registry fornece as peças prontas. Tudo determinístico, tudo HTML, feito pra agentes.

Monorepo (bun workspaces) com pacotes principais:
- `core` / `engine` / `producer` — parse de composições, dirige Chrome headless, encoda, mixa áudio
- `cli` — scaffold, preview, lint, inspect, render
- `player` — web component pra embutir composições
- `studio` — superfície no browser pra editar/preview
- `sdk` — engine de edição headless e neutro
- `aws-lambda` / `gcp-cloud-run` — render distribuído na nuvem
- `shader-transitions` — transições WebGL

---

## (2) Modelo de composição

**Conceito-raiz:** uma composição é um HTML que descreve uma timeline. Elemento raiz com
`data-composition-id` define o palco (canvas). `index.html` é a composição de topo; qualquer
composição pode ser aninhada dentro de outra (não existe "tipo raiz" especial).

**Duas camadas que NÃO se misturam:**
- **HTML (declarativo):** o quê / quando / em qual track — via `data-*`
- **Script (criativo):** efeitos, transições, animação — GSAP, CSS, canvas...

Regra de ouro: scripts NUNCA dão play/pause/seek na mídia nem escondem clips por tempo.
O framework faz isso a partir dos `data-*`. O script só responde "como a tela deve parecer no frame N?".

**Tipos de clip:** `<video>`, `<img>`, `<audio>`, `<div data-composition-id>` (composição aninhada).

**Atributos principais:**
- Timing: `data-start` (segundos OU referência a outro clip id), `data-duration`, `data-track-index`
  (z-order + agrupa em linhas; clips na mesma track não se sobrepõem)
- Mídia: `data-media-start` (trim), `data-volume`, `data-has-audio`
- Todo elemento com timing precisa de `class="clip"`

**Timing relativo (truque elegante):** `data-start="intro"` = comece quando o clip "intro" acabar.
Suporta offsets: `data-start="intro + 2"` (gap), `data-start="intro - 0.5"` (overlap/crossfade).
Se a duração de um clip muda, tudo a jusante se desloca automaticamente. Sem ciclos (resolver detecta).

**Composições aninhadas + variáveis = reuso:** `data-composition-src` importa HTML externo;
`data-variable-values='{"title":"Pro"}'` passa valores por instância; sub-comp lê com
`window.__hyperframes.getVariables()`.

**Determinismo (pilar):** loop de render =
`t = floor(frame)/fps → adapter.seekFrame(frame) → beginFrame capta pixels → FFmpeg encoda`.
Sem `Date.now()`, sem `requestAnimationFrame`, sem `Math.random()` sem seed, sem fetch em render-time.
fps/width/height travados antes do frame 0. Modo `--docker` trava até versão do Chrome e fontes.

**Frame Adapter (v0):** qualquer runtime (GSAP, Lottie, Three.js...) pluga se responder a
`seekFrame(frame)` idempotente, em qualquer ordem. O adapter nunca tem relógio próprio.

---

## (3) Skills — como o agente é guiado

As skills são o "manual de produção" que os agentes não têm. Instaladas via `npx skills add heygen-com/hyperframes`.
Três níveis, carregados sob demanda:

**1. Roteador (`/hyperframes`) — "leia isto primeiro":** decide qual workflow usar pela intenção
(produto? site? PR? tema?), com regras de desambiguação e defaults (16:9, idioma do usuário).

**2. Skills de capacidade (verbos atômicos):**
- `/hyperframes-core` — contrato `data-*`
- `/hyperframes-animation` — GSAP, Lottie, Three.js, transições, adapters
- `/hyperframes-creative` — frame.md, paletas, tipografia, narração, beats
- `/hyperframes-media` — TTS, música, transcrição, captions
- `/hyperframes-cli` — init, lint, preview, render
- `/hyperframes-registry` — `hyperframes add`

**3. Workflows (receitas end-to-end):** `/product-launch-video`, `/website-to-video`, `/pr-to-video`,
`/faceless-explainer`, `/embedded-captions`, `/graphic-overlays`, `/motion-graphics`, `/music-to-video`,
`/general-video`, `/remotion-to-hyperframes`.

**Exemplo `/pr-to-video` (máquina de estados com gates):**
```
Step 0  Setup    → hyperframes.json + trava brief
Step 1  Ingest   → roda `gh` → capture/extracted/ (offline, determinístico)
Step 2  Design   → adota preset "claude" → frame.md
Step 3  Storyboard → STORYBOARD.md + SCRIPT.md   [GATE usuário]
Step 3.1 Audio   → TTS + música + word-timings (background)
Step 4  Visual   → enriquece frames (effects/focal/motion)
Step 5  Frames   → 1 sub-agente POR frame (paralelo) → compositions/frames/NN.html
Step 6  Finalize → transitions + lint + validate + inspect  [GATE] → render MP4
```

Princípios de design:
- Trabalho determinístico fica em scripts `.mjs`, não no LLM (fetch-pr, ingest, audio, transitions...)
- Fan-out por sub-agentes (1 por frame, em paralelo; workers nunca editam o storyboard)
- Carregamento progressivo de contexto (lê cada reference só quando o step pede)
- Gates de usuário nos pontos caros (antes do áudio e antes do render)
- Regras anti-alucinação explícitas ("não invente IDs de bloco"; "se fetch falhar, pare, não fabrique")

---

## (4) Catalog / Registry — peças reusáveis

Filosofia shadcn/ui: `hyperframes add <nome>` **copia o HTML da peça pro seu projeto** (vira código seu,
editável; sem caixa-preta npm).

**Dois tipos:**
- **Blocks** — sub-composição autônoma (dimensões + duração + timeline próprias). Entra via
  `data-composition-src`. Vai pra `compositions/<nome>.html`. Ex: `data-chart`, `code-diff`, `flowchart`.
- **Components** — snippet de efeito (sem dimensões). Colado direto no HTML do host. Vai pra
  `compositions/components/<nome>.html`. Ex: `grain-overlay`, `motion-blur`, `caption-highlight`.

Total atual: ~97 blocks + 25 components + 13 examples (muitas variações temáticas — terminais, temas de caption).

**Anatomia:** cada peça = pasta com HTML + `registry-item.json` (manifesto: name, type, title, tags,
`dimensions`/`duration` p/ blocks, `files` com `target`, `preview` p/ catálogo, `params` = vars
customizáveis que viram UI no Studio).

**`hyperframes add` (em packages/cli/src/registry/):**
1. Resolve nome contra `registry.json` (índice de itens)
2. Busca arquivos do registry remoto (default: raw.githubusercontent.com/heygen-com/hyperframes/main/registry)
3. Copia pro local conforme `hyperframes.json` (`paths.blocks`, `paths.components`)
4. Imprime arquivos escritos + snippet pra colar (block ainda precisa de `data-composition-id` que bata
   com o ID interno + `data-start` + `data-track-index`)

Por isso o `/pr-to-video` Step 5 pré-instala todos os blocks antes de disparar sub-agentes paralelos
(evita corrida no registry).

---

# (5) Customização: Hub multi-projeto local

> Registro do que foi construído sobre o HyperFrames (não é feature do framework — é nosso patch local).
> Objetivo: rodar **um único Studio** servindo **vários** projetos de vídeo, alternando por dropdown —
> simulando o dashboard multi-projeto que normalmente só existe no hyperframes.dev hospedado.

## O problema que o hack resolve

O Studio open-source é **mono-projeto por design**: o server do CLI fixa `listProjects: () => [project]`
(um projeto só, vindo do cwd). Mas o **frontend** já é multi-projeto (busca `/api/projects`, roteia por
`#project/<id>` na URL) e a API é montada via `createStudioApi(adapter)` — o `adapter` é o único ponto que
decide quantos projetos existem. O hack ataca exatamente esse ponto.

## Layout final (tudo dentro de `nuvem-hyperframes/`)

```
nuvem-hyperframes/       ← raiz do workspace (aberta no Claude Code)
├── engine/              ← repo oficial clonado (HeyGen). Tem .git, patch aplicado, build em packages/cli/dist
├── hub/                 ← a tooling do hack (apply-hack / start / update / HACK.md)
├── projects/            ← HF_WORKSPACE (default). SÓ projetos aqui — 1 subpasta cada
│   ├── nuvem-hyper-01/  ← stories 1080×1920, identidade Nuvemshop
│   ├── demo/            ← hello-world (era o index.html da raiz)
│   ├── fake-landing/    ← placeholder de teste
│   └── fake-promo/      ← placeholder de teste
├── shared/              ← assets/tokens compartilhados (hoje vazio; cada marca tem o seu)
├── archive/enp/         ← projetos e assets EnP arquivados (fora do Studio, só histórico)
├── .agents/ agent/ .claude/ docs/   ← scaffolding compartilhado (skills, config, estas notas)
└── CLAUDE.md AGENTS.md skills-lock.json
```

> O workspace observado é **`projects/`**, não a raiz. Logo `engine/` e `hub/` ficam fora da varredura:
> nunca viram "projeto" no seletor nem disparam reload do preview.

## Como o hack funciona (2 patches no `engine/`, via codemod)

Tudo aplicado por `hub/apply-hack.mjs` — um **codemod idempotente por arquivo** (âncora de texto
`// [HF-MULTIPROJECT]`, não nº de linha, pra sobreviver a updates do upstream). Patcheia:

**1. `packages/cli/src/server/studioServer.ts`** (multi-projeto + seletor):
- Adiciona `readdirSync` ao import de `node:fs`.
- Injeta `__hfDiscoverProjects(root)` — varre subpastas de `HF_WORKSPACE` que tenham
  `index.html`/`hyperframes.json` (ignora as que começam com `.`).
- Injeta `__hfResolveProject(id, root, ...)`.
- `const __hfRoot = process.env.HF_WORKSPACE ? resolve(...) : null` — **sem a env, comportamento idêntico ao oficial**.
- watcher observa `__hfRoot ?? projectDir`; `listProjects`/`resolveProject` passam a usar os helpers.
- Injeta um `<script>` (o **seletor de projetos**) no HTML servido da SPA.

**2. `packages/cli/src/server/fileWatcher.ts`** (Parte A — qualidade de vida):
- Adiciona `"engine"` e `"hub"` ao `WATCHER_EXCLUDED_DIRS`. Rede de segurança: se alguém apontar
  `HF_WORKSPACE` pra raiz `nuvem-hyperframes/` (em vez de `projects/`), o watcher não reage à fonte do engine.

### O seletor de projetos (script injetado)
- Vanilla JS, embutido via `JSON.stringify` (sem backticks/`${}`).
- **Posição:** acha o botão por `aria-label="Undo"` e insere o `<select>` como primeiro irmão →
  fica **dentro da barra superior, antes do undo/redo** (não é mais overlay flutuante).
- **Rota:** o Studio roteia por `#project/<id>?<query>`. A troca faz `location.hash = 'project/'+id`
  (preservando a query atual); a leitura/pré-seleção extrai o id de `#project/<id>` via regex.
- **Resiliência:** `setInterval(ensure, 800ms)` re-injeta se o React re-renderizar e remover o nó,
  e mantém o `<select>` sincronizado no `hashchange`.

## A tooling (`hub/`)

| Arquivo | Função |
|---|---|
| `apply-hack.mjs` | Codemod idempotente **por arquivo**. Cada alvo já patchado é pulado; se o upstream mudou demais, falha dizendo **qual arquivo**. |
| `update.mjs` | Update sem conflito: `git reset --hard` → `git pull --ff-only` → reaplica → `bun install && bun run build`. |
| `start.mjs` | Sobe o Studio buildado. `HF_WORKSPACE` default = `../projects`. Passa `PWD: cwd` no spawn (senão o label do CLI herda o PWD do shell). |
| `HACK.md` | Doc canônica do hack (resumo operacional). |

### Por que `update.mjs` faz `git reset --hard`
O patch toca 2 arquivos e o build regenera artefatos (ex.: `hf-early-stub-inline.ts`). Reverter só um
arquivo deixaria os outros sujos e o `pull --ff-only` poderia abortar. Como **tudo** que muda na árvore é
regenerável (patch reaplicado pelo `apply-hack`; artefatos saem do rebuild), o `reset --hard` é seguro e
garante pull limpo sempre.

## Fluxo de uso

```bash
cd nuvem-hyperframes/hub
node update.mjs --first-time   # 1ª vez: aplica codemod + bun install + build
node start.mjs                 # sobe o hub (default HF_WORKSPACE=../projects); mostra a URL
node update.mjs                # atualizar mantendo o hack: reset --hard → pull → reaplica → rebuild
```

> **`npm run dev` dentro de um projeto NÃO usa o hack** (roda o `hyperframes` do npm, mono-projeto).
> O hub multi-projeto só existe via `node hub/start.mjs`, que usa o CLI buildado em `engine/packages/cli/dist`.

## Histórico de correções (timeline)

**Sessões anteriores** — exploração do framework (seções 1-4 acima) + criação do hack original:
patch multi-projeto no `studioServer.ts` + seletor flutuante; tooling em `hf-multiproject/`; layout com
`hyperframes-repo/` + `hf-workspace/` soltos.

**Esta sessão** — consolidação e correções:
1. **Tudo em uma pasta:** `hyperframes-repo → enp-hyperframes/engine`, `hf-multiproject → enp-hyperframes/hub` (nome antigo da pasta; renomeada em 2026-10-15)
   (com `.git` intacto). Paths dos scripts retargetados (`hyperframes-repo` → `engine`).
2. **Codemod idempotente por arquivo** (antes saía cedo se o `studioServer.ts` já estava patchado, o que
   bloquearia patchear um 2º arquivo).
3. **Parte A:** patch no `fileWatcher.ts` excluindo `engine`/`hub` do watcher.
4. **Parte B:** `update.mjs` passou a fazer `git reset --hard` (robustez do pull).
5. **Pasta `projects/`:** criada; `fake-landing`/`fake-promo` movidos; demo da raiz virou `projects/demo`;
   sobras órfãs `__hf_tmp` (meta/package/hyperframes.json) da raiz removidas. `HF_WORKSPACE` default = `../projects`.
6. **`.json-formatter-container`:** investigado — **não era bug**; é a extensão "JSON Formatter" do Chrome
   embrulhando uma resposta `/api/...` crua aberta numa aba. 0 ocorrências no DOM ao vivo do Studio.
7. **Seletor movido pra dentro da barra**, antes do undo/redo, com pré-seleção.
8. **Bug da hash route (raiz de 2 sintomas):** o switcher setava `#<id>`, mas o Studio roteia por
   `#project/<id>`. Por isso o dropdown "não trocava" e os fakes "davam erro" (ficavam no demo preto do
   frame 0). Corrigido. Fakes nunca estiveram quebrados.
9. **Lint do demo:** `overlapping_clips_same_track` resolvido (subtítulo → `data-track-index="2"`).
10. **Label "Project hub":** o CLI usa `basename(process.env.PWD)` ([preview.ts:127]); o `start.mjs` herdava
    o PWD do shell pai. Corrigido passando `PWD: cwd` no spawn → agora mostra `Project demo`.

## Serviço macOS (LaunchAgent)

O hub roda como serviço nativo via **launchd** — sempre online, sem terminal aberto, sobrevive a
reboots e se reinicia automaticamente se cair.

- **Plist:** `~/Library/LaunchAgents/com.nuvem.hyperframes-hub.plist`
- **URL:** http://localhost:4402
- **Logs:** `~/Library/Logs/nuvem-hyperframes-hub.out.log` / `.err.log`
- **`RunAtLoad: true`** → inicia no login
- **`KeepAlive: true`** → reinicia se cair (testado: novo pid em ~8s após kill manual)

```bash
UID_=$(id -u)
launchctl print gui/$UID_/com.nuvem.hyperframes-hub | grep -E "state|pid"  # status
launchctl kickstart -k gui/$UID_/com.nuvem.hyperframes-hub                  # reiniciar (ex: pós-update)
launchctl bootout gui/$UID_/com.nuvem.hyperframes-hub                       # parar de vez
launchctl bootstrap gui/$UID_ ~/Library/LaunchAgents/com.nuvem.hyperframes-hub.plist  # religar
```

> **Fluxo de update:** `node update.mjs` → `launchctl kickstart -k ...` (para o serviço pegar o novo
> build). Um `kill` simples também funciona, mas o launchd sobe um novo processo em ~5s;
> `kickstart -k` (kill + restart imediato) é mais limpo.

## Cópia física, não symlink

O servidor do HyperFrames Studio serve arquivos via `/api/projects/<id>/preview/` **sem seguir symlinks**.
Qualquer `<link>` ou `<img>` que aponte para fora da pasta do projeto retorna 404 — por isso assets
compartilhados (fontes, tokens) são **copiados** para dentro de cada projeto (`projects/<nome>/shared/`).

> A camada de marca EnP (tokens, template, escala tipográfica `--enp-v-*`) foi arquivada em
> [`archive/enp/README.md`](../archive/enp/README.md).

### `position: absolute` — regra obrigatória para clips HF

**Todo elemento com `class="clip"` deve ter `position: absolute` com `top` e `left` explícitos.**

O HyperFrames controla visibilidade de clips via `display: none / block` conforme `data-start` / `data-duration`. Se o container usa `display: flex` ou `grid`, cada show/hide de qualquer filho causa reflow: todos os elementos visíveis colapsam para o centro e se sobrepõem.

**Padrão de template (layout esquerdo):**
```css
#root {
  position: relative;
  width: 1920px;
  height: 1080px;
}

/* Todos os clips herdam left: 160px */
.clip {
  position: absolute;
  left: 160px;
}

/* Cada elemento define apenas seu top */
#title   { top: 440px; }
#subtitle { top: 596px; }
```

```html
<h1 id="title" class="clip" data-start="0.5" data-duration="7.5" data-track-index="4">
  Título da composição
</h1>
```

**Proibido em containers de clip:** `display: flex`, `display: grid`, `align-items`, `justify-content`, `gap`.
Use `padding` só em elementos folha (botão), nunca para posicionar clips entre si.

---

### Distribuição vertical — canvas 1920×1080

Para composições tipo title card, centralizar o grupo de conteúdo verticalmente no canvas de 1080px.

**Fórmula:**
1. Some a altura total do grupo: font-size × line-height × nº linhas + gaps
2. `top_inicial = (1080 - altura_total) / 2`
3. Cada elemento: `top = top_anterior + altura_anterior + gap`

**Valores do template** (grupo ~584px, margens iguais ~248px):

| Elemento | `top` | Altura | Gap até próximo |
|---|---|---|---|
| logo (72px svg) | 248px | 72px | 48px |
| accent-line (3px) | 368px | 3px | 25px |
| eyebrow (24px × 1.2) | 396px | ~29px | 15px |
| title (110px × 1.05, 1 linha) | 440px | ~116px | 40px |
| subtitle (40px × 1.5, 2 linhas) | 596px | ~120px | 48px |
| cta (~68px) | 764px | 68px | — |

Bottom do CTA: 832px → margem inferior: 1080 − 832 = **248px** ✓

> **Atenção com quebra de linha:** subtítulo com ~50 chars a 40px e `width: 880px` quebra em 2 linhas.
> Leve isso em conta ao recalcular se mudar o texto ou a fonte.

---

## Gotchas conhecidos

- **Edição persiste:** editar um projeto direto no Studio salva em disco no projeto certo (testado — o keyframe
  path do subtítulo do demo foi salvo). Multi-projeto não é só leitura.
- **Servers órfãos:** ao subir o hub em background com `&` e matar o processo pai, o filho (`cli.js preview`)
  pode sobreviver órfão segurando a porta. Num terminal interativo, `Ctrl+C` derruba certo. O LaunchAgent
  resolve isso para o uso cotidiano.
- **Failure mode do codemod:** se um update do upstream reescrever as linhas-alvo (`listProjects: () => [project]`,
  `WATCHER_EXCLUDED_DIRS = new Set([`, etc.), o `apply-hack.mjs` falha com mensagem clara dizendo qual arquivo —
  é o único momento de manutenção manual, raro e sinalizado.
- **Studio reescreve `data-start` e GSAP:** ao mover/ajustar clips no Studio, ele atualiza `data-start` no HTML
  e adiciona/modifica `tl.set(...)` no script. Os tempos de entrada no GSAP podem divergir do `data-start` original.
  Se reescrever as animações, ajuste os offsets de `tl.from()` para bater com os novos `data-start`.
- **Preview via `serve` sem trailing slash:** navegar para `http://localhost:PORT/projects/<nome>` (sem `/`)
  faz o browser resolver paths relativos (CSS, imagens) relativos ao diretório pai. Resultado: tokens não carregam,
  fundo fica preto. Sempre use a URL com trailing slash: `http://localhost:PORT/projects/<nome>/`.

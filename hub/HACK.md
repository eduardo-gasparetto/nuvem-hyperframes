# HyperFrames — Hub multi-projeto local (HACK)

> Um único Studio local servindo **vários** projetos de vídeo, alternando por URL.
> Simula localmente o "dashboard multi-projeto" que normalmente só existe no hyperframes.dev hospedado.

## O que é

O Studio open-source é **mono-projeto por design**: o server do CLI fixa
`listProjects: () => [project]` (um projeto só, vindo do cwd). Porém todo o **frontend** já é
multi-projeto (busca `/api/projects`, troca por `#<id>` na URL) e a API é montada via
`createStudioApi(adapter)` — onde o `adapter` é o único ponto que decide quantos projetos existem.

Este hack aplica um **patch mínimo** no `packages/cli/src/server/studioServer.ts` do repo
(`../engine`) que faz `listProjects` / `resolveProject` varrerem a pasta-workspace quando a env
`HF_WORKSPACE` está setada. Sem a env, o comportamento é **idêntico ao oficial**.

## Layout (tudo dentro de `nuvem-hyperframes/`)

```
nuvem-hyperframes/
├── engine/              ← repo oficial clonado. update.mjs cuida do pull+build. Patch reaplicado automático.
├── hub/                 ← esta pasta (a tooling do hack)
├── projects/            ← HF_WORKSPACE (default). SÓ projetos aqui — 1 subpasta cada
│   ├── nuvem-hyper-01/  ← stories 1080×1920, identidade Nuvemshop
│   ├── demo/            ← hello-world (era o index.html da raiz)
│   ├── fake-landing/    ← placeholder de teste
│   └── fake-promo/      ← placeholder de teste
├── shared/              ← assets/tokens compartilhados (hoje vazio; cada marca tem o seu)
├── archive/enp/         ← projetos e assets EnP arquivados (fora do Studio, só histórico)
├── .agents/ agent/ .claude/ docs/   ← scaffolding compartilhado (skills, config, notas)
└── CLAUDE.md AGENTS.md
```

> O workspace observado é **`projects/`**, não a raiz. Logo `engine/` e `hub/` ficam **fora** da
> varredura: nunca viram "projeto" no seletor nem disparam reload do preview. O patch do
> `fileWatcher.ts` (exclui `engine`/`hub`) vira rede de segurança extra — só importa se alguém
> apontar `HF_WORKSPACE` pra raiz `nuvem-hyperframes/` em vez de `projects/`.

## Arquivos da tooling (`hub/`)

| Arquivo | Função |
|---|---|
| `apply-hack.mjs` | Codemod **idempotente por arquivo**. Patcheia `studioServer.ts` (multi-projeto + seletor), `core/src/projectFolders.ts` (exclui `engine`/`hub` do watcher) e `inspector/build.mjs` (paths com espaço — ver abaixo). Por padrão de texto, não por nº de linha. Cada arquivo já patchado é pulado; se o upstream mudou demais, falha avisando qual arquivo. |
| `update.mjs` | Update sem conflito: `git reset --hard` → `git pull --ff-only` → reaplica → `bun install && bun run build`. |
| `check-updates.mjs` | Manual, só avisa (não toca no `engine/`): compara versão com o npm `latest`, roda o `apply-hack` num clone descartável do upstream (via `HF_ENGINE_DIR`) e faz smoke test (check + snapshot + render 1080×1350) com `npx hyperframes@latest`. Sai com 0 = pode rodar `update.mjs`; 1 = não atualize. Não cobre o build do engine. |
| `start.mjs` | Sobe o Studio buildado apontando pra `HF_WORKSPACE`. |
| `HACK.md` | Este arquivo. |

## Como o patch muda o `studioServer.ts`

1. Adiciona `readdirSync` ao import de `node:fs` (se faltar).
2. Injeta 2 helpers (`__hfDiscoverProjects`, `__hfResolveProject`) antes de `createStudioServer`.
3. Dentro de `createStudioServer`:
   - `const __hfRoot = process.env.HF_WORKSPACE ? resolve(...) : null;`
   - watcher passa a observar `__hfRoot ?? projectDir` (hot-reload cobre todos os projetos)
   - `listProjects` → `__hfDiscoverProjects(__hfRoot, project)`
   - `resolveProject` → `__hfResolveProject(id, __hfRoot, projectId, project)`
4. Injeta um `<script>` no HTML servido (SPA fallback) com um **seletor de projetos** flutuante.

## Como o patch muda o watcher (`core/src/projectFolders.ts`)

Adiciona `"engine"` e `"hub"` a `PREVIEW_IGNORED_DIRS` (até 0.8.158 era `WATCHER_EXCLUDED_DIRS` no `fileWatcher.ts`). Como essas pastas agora vivem **dentro**
do workspace (que o watcher observa recursivamente), sem isso editar a fonte do engine dispararia
reload do preview à toa. Os pesos-pesados (`node_modules`, `dist`, `.git`…) já são excluídos pelo
upstream.

Tudo marcado com o comentário-âncora `// [HF-MULTIPROJECT]` (usado pela idempotência).

## Como o patch muda o `inspector/build.mjs`

Bug de upstream, não relacionado ao multi-projeto: `const at = (path) => new URL(path, import.meta.url).pathname`
deixa `%20` no lugar de espaço. Como o workspace mora em `.../Claude Projects/...`, o `readFileSync`/`esbuild`
seguinte dá `ENOENT`. Isso trava a cadeia `bun run build` **antes** de chegar no `cli` (o pacote que o hub
realmente serve) — então sem esse patch, `update.mjs` atualiza o `engine/` mas o Studio continua rodando o
build antigo. Fix: troca `.pathname` por `fileURLToPath(...)`.

## Uso

```bash
cd hub

# 1. Aplicar o patch + buildar (primeira vez)
node update.mjs --first-time      # = aplica codemod + bun install + build

# 2. Subir o hub — HF_WORKSPACE default = ../projects, então só:
node start.mjs
#   abre em http://localhost:<porta>  → alterna projetos com #<nome-da-subpasta>
#   (pra outra pasta de projetos: HF_WORKSPACE="/outro/caminho" node start.mjs)

# 3. Atualizar o HyperFrames mantendo o hack (sempre que quiser a versão nova)
node update.mjs
#   reset --hard → git pull → reaplica → rebuild. Zero conflito.
```

> **`npm run dev` (dentro de um projeto) NÃO usa este hack.** Ele roda o `hyperframes` do npm
> (mono-projeto, sem seletor). O hub multi-projeto **só** existe via `node hub/start.mjs`, que usa o
> CLI buildado em `engine/packages/cli/dist`.

## Por que `update.mjs` faz `git reset --hard`

O patch toca 2 arquivos e o build regenera artefatos (ex.: `hf-early-stub-inline.ts`). Reverter só
um arquivo deixaria os outros "sujos" e o `git pull --ff-only` poderia abortar. Como **tudo** que
muda na árvore é regenerável (o patch é reaplicado pelo `apply-hack` logo em seguida; os artefatos
saem do rebuild), o `reset --hard` é seguro e garante um pull limpo sempre. Não há trabalho manual
no `engine/` pra preservar.

## Serviço macOS (LaunchAgent)

O hub roda como serviço nativo do macOS via **launchd**, garantindo que o Studio fique online mesmo
sem terminal aberto, sobreviva a reboots e se reinicie automaticamente se cair.

**Plist:** `~/Library/LaunchAgents/com.nuvem.hyperframes-hub.plist`
**URL fixa:** http://localhost:4402
**Logs:** `~/Library/Logs/nuvem-hyperframes-hub.out.log` / `.err.log`

> **`ProgramArguments` precisa de `--foreground --no-open` depois do `--port`.** Sem eles, o
> `hyperframes preview` (sob o shell não-interativo do launchd) se auto-destaca em background e
> abre o navegador — e como ele "sai" logo em seguida, o `KeepAlive` reinicia o serviço, que abre
> outra aba, em loop (~10 em 10s). `--foreground` mantém o processo preso mesmo sem TTY;
> `--no-open` corta o auto-open. Se o plist for recriado do zero, lembrar desses dois flags.

```bash
UID_=$(id -u)

# ver status
launchctl print gui/$UID_/com.nuvem.hyperframes-hub | grep -E "state|pid"

# reiniciar (ex.: depois de node update.mjs)
launchctl kickstart -k gui/$UID_/com.nuvem.hyperframes-hub

# parar de vez (kill sozinho não basta — KeepAlive ressuscita)
launchctl bootout gui/$UID_/com.nuvem.hyperframes-hub

# religar depois de ter parado
launchctl bootstrap gui/$UID_ ~/Library/LaunchAgents/com.nuvem.hyperframes-hub.plist
```

> **Fluxo de update:** rode `node update.mjs` → depois `launchctl kickstart -k ...` para o serviço
> pegar o novo build. O `kill` simples funciona mas o launchd inicia um processo novo em ~5s;
> `kickstart -k` (kill + restart imediato) é mais limpo.

## Failure mode (honesto)

Se um update do upstream **renomear/reescrever** as linhas-alvo (`listProjects: () => [project]`,
`PREVIEW_IGNORED_DIRS`, etc.), o `apply-hack.mjs` **falha com mensagem clara dizendo
qual arquivo** em vez de aplicar errado. Aí é só abrir o arquivo citado, achar o novo equivalente, e
ajustar os padrões no `apply-hack.mjs`. É o único momento de manutenção manual — raro, e sinalizado.

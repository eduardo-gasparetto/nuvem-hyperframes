# WORKLOG

Log de sessões deste projeto — entrada mais recente no topo.
Escrito via comando `/log` ou pelo agente ao fim de uma sessão com trabalho real.

---

## 2026-10-14

**O que foi feito:**

1. **Análise da pasta** — mapeado o hub multi-projeto (engine/hub/projects/shared), achado
   3 arquivos não commitados no `engine/` (patch local do hack) e o WORKLOG vazio.
2. **Update do engine** (`node hub/update.mjs`) — de `f622e5a7` (23/06) pra `8c00ebad`
   (14/10), 3615 commits. Dois problemas no caminho, ambos corrigidos:
   - `apply-hack.mjs` falhou ao reaplicar o patch: upstream renomeou `envScript`→`headScript`
     e mudou a assinatura do `c.html(...)` na SPA fallback do `studioServer.ts`. Ajustado o
     padrão do codemod.
   - Build travou em `packages/inspector/build.mjs`: usa `new URL().pathname` (deixa `%20`
     no lugar de espaço), e o path do workspace tem espaço ("Claude Projects") → ENOENT.
     Virou 3º alvo do `apply-hack.mjs` (`fileURLToPath` em vez de `.pathname`), documentado
     no HACK.md.
3. **Dropdown multi-projeto sumiu** — o redesign do Studio (parte do update) tirou o botão
   "Undo" global do header, que era a âncora do seletor. Trocado pra âncora no botão "Export"
   (ainda único e estável no header). Patch reaplicado, `cli` rebuildado.
4. **Loop de abas no launchd** — o `hyperframes preview` mudou o default (auto-abre browser +
   se autodestaca sob shell não-interativo); o `KeepAlive` do launchd reiniciava o serviço a
   cada ~10s, abrindo uma aba nova a cada vez. Fix: `--foreground --no-open` no
   `ProgramArguments` do plist. Documentado no HACK.md.
5. **Erro de lint "font sem @font-face" no enp-stories-v3** — falso positivo de um bug do
   HyperFrames (regra antiga tratava `var(--enp-font)` como nome literal de fonte), já
   corrigido no upstream (`11432ea8c`) e resolvido pelo update do item 2.
6. **Novo projeto `nuvem-hyper-01`** (`projects/nuvem-hyper-01/`) — stories 1080×1920,
   identidade **Nuvemshop** própria (não reaproveita `shared/` EnP):
   - `shared/nuvem-tokens.css` — tokens `--nuvem-*` a partir da skill `insti-styleguide`.
   - Fonte Plus Jakarta Sans self-hosted (mesmos arquivos da EnP, mesma fonte).
   - Fonte **Ivy Presto Display Light Italic** adicionada (`~/Library/Fonts/Ivy-Presto-Display-Light.otf`
     copiada pro projeto) — descoberta: os 4 `.otf` instalados no Mac são todos cortes
     **itálicos** por nome interno (não existe reto/upright instalado com esses nomes).
   - **17 tokens de cor da library Figma "[Brand] Design Guidelines"** (Tiendanube/Nuvemshop,
     arquivo `-ENP--Performance---Social`) extraídos e adicionados em `nuvem-tokens.css`
     (`--nuvem-lib-*`): Main Colors, Support Blue, Grayscale (Nimbus Gray), Composition
     Colors. 5 confirmados via uso real no arquivo; os outros 12 (incl. gradiente radial do
     "Nimbus Night") só deram pra confirmar criando rectangles temporários numa section
     "claude draft" que o Eduardo criou pra isso e depois apagou — nada mais foi alterado
     no arquivo Figma.
7. **CLAUDE.md da raiz corrigido** — estava com o template genérico de "projeto HyperFrames
   único"; não descrevia a estrutura real do hub. Adicionada seção explicando
   engine/hub/projects/shared, onde rodar os comandos, e a separação de identidade visual
   por projeto (EnP vs. Nuvemshop).

**Decisões + porquês:**
- Projetos de marcas diferentes não compartilham `shared/` — cada um tem seu próprio
  `shared/<algo>-tokens.css`, pra não misturar tokens EnP com Nuvemshop por engano.
- Valores de cor/tipografia só entram no CSS com evidência real (uso no arquivo Figma ou
  leitura direta do style) — nunca estimados por pixel de screenshot (testado, erra:
  Sky Blue saiu ~10% errado por essa via).

**Arquivos tocados:**
`hub/apply-hack.mjs`, `hub/HACK.md`, `~/Library/LaunchAgents/com.enp.hyperframes-hub.plist`,
`engine/packages/cli/src/server/studioServer.ts` (gerado pelo patch), `CLAUDE.md`,
`projects/nuvem-hyper-01/` (novo), `docs/WORKLOG.md`.

**Estado final / próximo passo:** hub atualizado e estável, Studio rodando em
`localhost:4402` com o seletor multi-projeto funcionando. `nuvem-hyper-01` tem identidade
Nuvemshop completa (fontes + tokens) mas só o placeholder "Title" — aguardando instruções
de conteúdo do Eduardo.

**Pendências:** nenhuma em aberto.

---

# `shared/` — situação atual (2026-11-04)

Retrato do que a camada compartilhada de marca e social contém, do que falta e do que está especificado mas não construído.
Fontes: `CLAUDE.md`, `shared/video/*`, `shared/social/*`, `SPEC.md`, worklogs. Nada aqui foi renderizado ou testado de novo hoje.

## 1. Pronto (existe no repositório)

### Fundação de marca
| Item | Onde | O que é |
|---|---|---|
| Fontes | `shared/fonts/`, `shared/fonts.css` | Plus Jakarta Sans (texto) + Ivy Presto Display Light Italic (ênfase). Comuns a vídeo e interface. |
| Tokens de interface | `shared/ui/nuvem-tokens.css` | Sistema de site/app (da skill `insti-styleguide`). Separado do vídeo; não se misturam. |

### Identidade de vídeo (v0, fonte única)
| Item | Onde | O que é |
|---|---|---|
| Identidade visual | `shared/video/visual-identity.md` + `video-tokens.css` | Cores, tipografia, superfícies de vidro, camadas, regras de layout. Só palco escuro; Jakarta 600; serifa itálica só para ênfase. |
| Identidade de movimento | `shared/video/motion-identity.md` + `motion.js` | Gramática (entrar = ease out, sair = ease in ou fade, sem bounce), 5 faixas de duração, 7 curvas de easing e 13 padrões reutilizáveis, expostos como `window.NuvemMotion`. |
| Teste de movimento | `shared/video/motion.test.mjs` | Confere se cada preset reproduz as animações do projeto de origem. |

Limites que já estão escritos nos próprios arquivos:
- Medida em uma única peça (`Cubo_Nuvem Ads.mp4`, cena 1, 0–23 s). Algumas regras podem ser da peça, não da marca.
- Outras proporções (9:16, 4:5, 1:1, 16:9) **não estão decididas**: escalar pela altura só vale na proporção original (2,25:1).
- Pergunta em aberto: "só Jakarta 600" é regra de vídeo ou escolha daquela peça?

### Padrões sociais (dados + regras)
| Item | Onde | O que é |
|---|---|---|
| Base de formatos | `shared/social/specs.json` | 15 formatos (Meta Stories/Reels/feed, TikTok, Shorts, YouTube, LinkedIn, Pinterest, X): canvas, zona segura, duração, peso de arquivo, regras de carrossel. Cada seção marcada como oficial / imprensa / terceiros / interno, com `verified_at`. `null` = sem valor publicado. |
| Regras | `shared/social/rules.md` | 9 regras de produção + o princípio "padrão, não lei": seguir o briefing, avisar da divergência, nunca bloquear. |
| Teste da base | `shared/social/specs.test.mjs` | Mantém a base coerente. |

## 2. Pendente: kit inicial padrão para projeto novo (comando não construído)

**Problema.** Os arquivos de marca são copiados à mão para cada projeto (o agente seguindo o `CLAUDE.md`). Não há script nem gatilho.
O Studio não segue links simbólicos para fora da pasta do projeto, então copiar é necessário, mas não é automatizado.

**Evidência (conferida em 2026-11-04, `projects/*/shared/`):**
| Projeto | Tem |
|---|---|
| `workshop-vip-stories` | fontes, `fonts.css`, `video-tokens.css`, `motion.js` |
| `cubo-nuvem-ads-rmx` | fontes, `fonts.css`, `nuvem-tokens.css` |
| `nuvem-hyper-01` | fontes, `fonts.css`, `nuvem-tokens.css` |
| `demo`, `fake-landing`, `fake-promo` | nada |

**Consequências.** Os kits são desiguais, as cópias não se atualizam quando a matriz muda e nada detecta uma cópia desatualizada.

**Ideia (não decidida, não construída).** Um comando de "novo projeto" que sempre copia o mesmo kit (fontes + `fonts.css` + `video-tokens.css` + `motion.js`), com o conteúdo do kit definido uma vez.
Pontos em aberto: um kit para todos, ou variantes de vídeo e interface? O comando também deveria avisar sobre cópias desatualizadas nos projetos existentes?

Registrado na lista de trabalho do claude-mem `leaders-debate`.

## 3. Especificado, não construído (`SPEC.md`, pipeline social v1)

Situação: acordado em 2026-10-19/20 via spec-interview. Aguarda sua revisão dos padrões propostos, para depois implementar numa sessão nova. Nenhum dos scripts existe ainda (`shared/social/` só tem `rules.md`, `specs.json` e `specs.test.mjs`).

| Peça | Arquivo previsto | O que faz |
|---|---|---|
| Scaffold | `shared/social/new.mjs` | Cria `projects/<peça>-<proporção>/` no tamanho do formato, com `meta.json` (bloco `social`), cópias de marca e slides de carrossel. Cobre a lacuna do kit **só para projetos sociais**. |
| Lint | `shared/social/lint.mjs` | Só avisa: zona segura (amostrada no início/meio/fim), canvas, duração, peso, carrossel e nome. |
| Export | `shared/social/export.mjs` | Render de MP4 / snapshot PNG + JPG por proporção, checagem com ffprobe, imagens-guia com a zona segura e saída em `renders/<peça>/`. |
| Relatório | `renders/<peça>/report.md` | Cada aviso marcado como adaptado / briefing / aberto. |
| Testes | `shared/social/pipeline.test.mjs` | Casos negativos (fora da zona segura, licença de áudio divergente, nome inválido, imagem grande demais) + um caso limpo. |

Decisões já fechadas: ordem de construção vídeo do zero → vídeo gravado → imagens estáticas; um projeto por proporção, sem corte automático; carrossel = composição-pai + uma subcomposição por slide; sempre PNG e JPG; peça piloto fornecida pelo Eduardo.

Fora da v1: estratégia e copy de anúncio, escolha de música, publicação, avisos dentro do Studio e lacunas da base (grid 3:4 do IG, TikTok orgânico, peso de arquivo de Reels no Facebook).

## 4. Lacuna entre as seções

O spec social cobre formatos e zonas seguras. Ele **não** diz como a identidade de vídeo (seção 1) escala para 9:16 e 4:5. Até isso ser decidido, cada peça vertical (ex.: `workshop-vip-stories`) é diagramada à mão a partir do Figma.

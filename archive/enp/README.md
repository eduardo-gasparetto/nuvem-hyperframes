# EnP — brand layer (archived)

> Archived 2026-10-15 when this hub was re-scoped to Nuvemshop. Moved verbatim from `docs/notes.md`.
> The EnP projects live in `archive/enp/projects/`, the shared assets in `archive/enp/shared/`.
> Paths below describe the old layout (root folder was `enp-hyperframes/`, `shared/` and `projects/enp-template/` at top level).

## Camada de marca EnP

> Assets, tokens e template base para compor vídeos com identidade EnP sobre o HyperFrames.

### Estrutura de arquivos

```
enp-hyperframes/
├── shared/                    ← assets compartilhados (fonte de verdade)
│   ├── enp-tokens.css         ← tokens CSS EnP (gerados de enp-design-system/data/tokens.json)
│   ├── fonts.css              ← @font-face Plus Jakarta Sans (self-hosted)
│   ├── fonts/                 ← woff2 por subset (latin, latin-ext, cyrillic-ext, vietnamese)
│   ├── assets/                ← logos SVG (7 variantes)
│   └── enp-template.html      ← template-fonte (copiar para criar novo projeto)
└── projects/
    └── enp-template/          ← projeto de referência funcionando no Studio
        ├── index.html         ← composição atual (pronto para editar no Studio)
        └── shared/            ← cópia física de shared/ (ver nota abaixo)
```

### Por que cópia física e não symlink

O servidor do HyperFrames Studio serve arquivos via `/api/projects/<id>/preview/` **sem seguir symlinks**.
Qualquer `<link>` ou `<img>` que aponte para fora da pasta do projeto retorna 404.

**Fluxo para criar um projeto novo:**
```bash
cp -r projects/enp-template projects/meu-novo-video
# O shared/ já vai junto — sem configuração adicional
```

**Atualizar tokens após mudança no enp-design-system:**
```bash
cp shared/enp-tokens.css projects/*/shared/enp-tokens.css
```

---

### Tipografia em vídeo — escala `--enp-v-*`

Composições HTML para vídeo/motion usam uma escala tipográfica separada (`--enp-v-*`), **não** a escala web padrão (`--enp-h1`, `--enp-lead`, etc.).

**Por quê:** a escala web foi calibrada para leitura em monitor (~60cm). Vídeos são assistidos em TV/fullscreen (~1-3m) — a mesma fonte parece ~2× menor. O H1 web de 58px vira 110px no vídeo.

| Token | Vídeo 1080p | Web (ref.) | Uso |
|---|---|---|---|
| `--enp-v-display` | 140px | 70px | Hero de capa |
| `--enp-v-h1`      | 110px | 58px | Título principal de cena |
| `--enp-v-h2`      |  80px | 42px | Título de seção/slide |
| `--enp-v-h3`      |  58px | 30px | Subtítulo de cena |
| `--enp-v-h4`      |  42px | 22px | Cabeçalho de card |
| `--enp-v-lead`    |  40px | 18px | Chamada de apoio |
| `--enp-v-body`    |  32px | 16px | Corpo de texto |
| `--enp-v-caption` |  28px | 14px | Legendas |
| `--enp-v-small`   |  24px | 12px | Rodapé / metadados |
| `--enp-v-eyebrow` |  24px | 12px | Uppercase · rótulos |

Tracking (`--enp-v-track-*`) e leading (`--enp-leading-*`) são idênticos à escala web — só o `px` muda.
A escala completa está documentada em `enp-design-system/SKILL.md §1` e em `data/tokens.json → typography.scale_video`.

---


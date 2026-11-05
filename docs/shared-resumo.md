# `shared/` — resumo (2026-11-04)

Versão curta de `docs/shared-status.md`. A pasta `shared/` é a "caixa de marca" do hub: fontes, cores, regras de movimento e padrões de redes sociais.

## Pronto

- **Fontes**
  - Plus Jakarta Sans para texto e Ivy Presto Display Light Italic para ênfase.
  - Valem para vídeo e para interface.
- **Tokens de interface**
  - Cores, espaçamentos e botões de site e app, vindos da skill `insti-styleguide`.
  - Ficam separados do vídeo.
- **Identidade visual de vídeo**
  - Palco sempre escuro, texto branco, números grandes em azul de destaque.
  - Jakarta em peso 600, e serifa itálica só para ênfase.
  - "Vidro" azulado para painéis e pílulas, com receita fixa de transparência e blur.
- **Identidade de movimento**
  - Regra geral: o que entra desacelera, o que sai acelera ou some, sem bounce.
  - 13 animações prontas (cascata de palavras, número entrando em foco, painel subindo, cursor e clique) em `motion.js`.
  - Um teste automático confere se elas reproduzem o vídeo original.
- **Padrões de redes sociais**
  - Tabela com 15 formatos: tamanho, zona segura, duração, peso máximo e regras de carrossel.
  - Cada dado tem selo de confiança (oficial, imprensa, terceiros, interno) e data de verificação.
  - 9 regras de produção, sob o princípio "padrão, não lei": o agente segue o briefing e avisa da divergência, sem bloquear.

**Limites já assumidos nos arquivos**
- Identidade de vídeo medida em uma única peça (cena 1 do Cubo Nuvem Ads). Ainda é v0.
- Proporções verticais (9:16, 4:5) não têm regra de escala decidida.

## Pendente: kit inicial padrão para projeto novo

- **Hoje:** o agente copia a marca para cada projeto à mão, seguindo o `CLAUDE.md`. Não existe script nem gatilho.
- **O que isso causou (conferido nas pastas):**
  - `workshop-vip-stories` tem fontes, `video-tokens.css` e `motion.js`.
  - `cubo-nuvem-ads-rmx` e `nuvem-hyper-01` têm só fontes e `nuvem-tokens.css`.
  - `demo`, `fake-landing` e `fake-promo` não têm nada.
- **Outro efeito:** as cópias não se atualizam quando a matriz muda.
- **Ideia:** um comando de "novo projeto" que sempre copia o mesmo kit.
- **A decidir:** um kit único ou variantes de vídeo e interface, e se o comando avisa sobre cópias antigas.
- **Estado:** não decidido e não construído.

## Especificado, não construído (pipeline social v1)

- **Estado:** acordado em entrevista, no `SPEC.md`. Aguarda sua revisão dos padrões propostos e depois implementação em sessão nova.
- **Scaffold (`new.mjs`):**
  - cria o projeto já no tamanho certo do formato, com marca copiada e metadados;
  - cobre a lacuna do kit, mas só para projetos sociais.
- **Lint (`lint.mjs`):** avisa sobre zona segura, canvas, duração, peso, carrossel e nome. Nunca bloqueia.
- **Export (`export.mjs`):**
  - gera MP4, PNG e JPG por proporção;
  - cria imagens-guia com a zona segura desenhada;
  - confere os arquivos gerados.
- **Relatório:** um por peça, com cada aviso marcado como adaptado, intencional do briefing ou aberto.
- **Testes:** casos que devem gerar aviso e um caso limpo.
- **Decisões fechadas:**
  - ordem: vídeo do zero, vídeo gravado, imagens estáticas;
  - um projeto por proporção, sem corte automático;
  - carrossel com uma composição-pai e um slide por arquivo;
  - sempre PNG e JPG;
  - peça piloto fornecida por você.
- **Fora da v1:** copy e estratégia de anúncio, escolha de música, publicação automática e avisos dentro do Studio.

## A lacuna que une tudo

- O spec social define formatos e zonas seguras, mas não diz como a identidade de vídeo escala para 9:16 e 4:5.
- Enquanto isso não for decidido, cada peça vertical é diagramada à mão a partir do Figma.

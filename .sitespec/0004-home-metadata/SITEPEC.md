---
schemaVersion: "1.0.0"
id: "0004"
slug: home-metadata
title: Configurar SEO e compartilhamento da Home
summary: Publicar os metadados aprovados da Home e uma imagem social compatível com a marca.
status: in_progress
createdAt: "2026-10-18T00:57:05Z"
updatedAt: "2026-10-18T01:47:09Z"
primarySkill: astrofy-seo
reviewSkills:
  - astrofy-open-graph
  - astrofy-editorial-review
relatedFiles:
  - astro.config.mjs
  - src/pages/index.astro
  - public/images/og-home.png
page: home
task: metadata
source: Plano técnico derivado de .astrofy/pages$LOCAL_PATH e da aprovação da Home nesta conversa.
dependsOn:
  - "0001"
estimateMinutes: 60
estimateBasis: expectativa técnica; configurar domínio e tags para uma rota, compor ativo social com marca aprovada e conferir o HTML inicial.
---

## Descrição

Configurar os metadados da Home usando a copy aprovada em `.astrofy/pages$LOCAL_PATH título “dGaspar | Consultoria de IA e automação”, descrição aprovada e canônica pública `https://douglasgaspar.com/`. O projeto ainda não define `site` em `astro.config.mjs` nem possui layout ou componente compartilhado de metadados. Centralizar a saída se a composição criada para esta rota justificar reuso, evitando tags duplicadas. Preparar uma imagem social para a Home usando a marca e a direção de diagrama aprovadas, sem retrato ou imagem de banco.

## Checklist

- [x] Configurar o domínio público aprovado e emitir uma única canonical absoluta para `/` no HTML inicial `#astrofy-seo` {#m4c1}
- [x] Renderizar título e descrição aprovados em `<title>` e `meta description`, sem duplicar valores no head `#astrofy-seo` {#m4c2}
- [x] Preparar `public/images/og-home.png` com a marca e o diagrama aprovados, sem foto, e emitir `og:title`, `og:description`, `og:type`, `og:url` e `og:image` com URL absoluta `#astrofy-open-graph` {#m4c3}
- [ ] Conferir o HTML de acesso direto à Home, canonical, idioma `pt-BR`, metadados sociais e acesso público à imagem `#astrofy-seo` {#m4c4}

## Notas

- 2026-10-18: domínio, canonical, título, descrição e imagem social adicionados. A conferência de HTML renderizado e imagem no ambiente publicado permanece na checklist.
- Canonical e textos de SEO aprovados pelo responsável em 2026-10-17.
- Imagem social deve seguir a direção aprovada para a Home: usar logo/diagrama, sem retrato.
- Validação prevista: `astrofy check --category seo` e `astrofy check --category og`; conferir a URL publicada da imagem no ambiente de publicação.

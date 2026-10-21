# Arquitetura atual

As rotas Astro usam um layout comum e instâncias de componentes autocontidos.
Esse formato mantém cada página legível no código e compatível com o modelo
visual do Stacki: layout opcional seguido por componentes importados com tags
autofechadas.

## Rotas e composição

| Rota | Página | Layout | Componentes de conteúdo |
| --- | --- | --- | --- |
| `/` | `src/pages/index.astro` | `src/layouts/SiteLayout.astro` | `HomeHero`, `HomePaths`, `HomeAbout`, `HomeProjects`, `HomeToolkit`, `HomeConsulting`, `HomeServices`, `HomeFooter` |
| `/consultorias/` | `src/pages/consultorias.astro` | `src/layouts/SiteLayout.astro` | `ConsultingHero`, `ConsultingTopics`, `ConsultingOrientation`, `ConsultingBoundary`, `ConsultingCTA`, `ConsultingTechnicalCTA`, `ConsultingFooter` |
| `/servicos/criacao-de-sites/` | `src/pages/servicos/criacao-de-sites.astro` | `src/layouts/SiteLayout.astro` | `ServiceHeader`, `ServiceHero`, `ServiceIntro`, `ServiceSteps`, `ServiceAI`, `ServiceScope`, `ServiceFooter` |

As páginas preservam os caminhos públicos. Cada rota lista a ordem dos blocos
como componentes Astro autocontidos. O layout concentra `<html>`, `<head>`,
metadados, link de acessibilidade, `main` e slots para cabeçalho e rodapé.

## Responsabilidades

- `src/pages/` define as rotas e a ordem dos componentes; não contém loops,
  scripts inline ou markup de seção.
- `src/layouts/SiteLayout.astro` recebe os metadados de cada página, carrega
  `src/styles/global.css` e mantém os landmarks comuns.
- `src/components/` contém as seções. Os campos `Props` expõem títulos, textos,
  imagens, listas e destinos de ação ao painel de propriedades do Stacki. O
  conjunto decorativo de ícones e a lógica de animação continuam no código de
  `HomeHero.astro`.
- O script em `HomeHero.astro` executa no navegador as animações, o menu e os
  efeitos da Home depois que o documento foi carregado.
- `src/lib/contact-links.ts` centraliza endereço de e-mail e destinos de
  contato reutilizados pelos componentes.
- `src/styles/global.css` é carregado pelo layout. A página de criação de sites
  também carrega `src/styles/service-page.css` por seus componentes.

Não há ilhas React, Vue ou Svelte. A composição é HTML renderizado pelo Astro;
apenas o script da Home acrescenta comportamento no navegador. Listas e
animações continuam pertencendo ao código dos componentes, enquanto a ordem das
seções e os campos de texto simples podem ser alterados no Stacki.

## Edição no Stacki

As rotas seguem o formato descrito no README do Stacki: importam um layout e
usam instâncias de componentes com propriedades simples. No editor, selecione
uma seção para ajustar seus campos, remova ou reordene a instância no navegador
de estrutura, ou abra o componente Astro para editar listas e comportamento.
Mantenha o frontmatter da rota limitado a imports e preserve as tags
autofechadas de seus componentes.

---
schemaVersion: "1.0.0"
id: "0006"
slug: google-analytics
title: Instalar a medição GA4 do site
summary: Publicar o snippet do Google Analytics 4 no layout compartilhado, com opt-out nas páginas que não devem rastrear.
status: done
createdAt: "2026-11-03T10:45:00Z"
updatedAt: "2026-11-03T13:20:00Z"
primarySkill: astrofy-seo
reviewSkills:
  - astrofy-accessibility
  - astrofy-security
relatedFiles:
  - src/lib/analytics.ts
  - src/components/GoogleAnalytics.astro
  - src/layouts/SiteLayout.astro
  - src/scripts/analytics.test.ts
page: site
task: analytics
source: Pedido direto do responsável em 2026-11-03 para instalar o GA4 da propriedade "douglasgaspar.com – GA4".
dependsOn:
  - "0001"
estimateMinutes: 45
estimateBasis: um componente de script, uma constante de configuração, um ponto de inclusão no layout e uma suíte de testes.
---

## Descrição

Instalar a medição do Google Analytics 4 no site estático Astro usando a propriedade **douglasgaspar.com – GA4** (`properties/310294296`, conta *Douglas Gaspar*), cujo fluxo web aponta para `https://douglasgaspar.com` e cujo ID de métricas é `G-739P03GM5K`.

O snippet é emitido por `src/components/GoogleAnalytics.astro`, incluído uma única vez em `src/layouts/SiteLayout.astro`, cobrindo as sete rotas publicadas. O ID vive em `src/lib/analytics.ts` e pode ser sobrescrito por `PUBLIC_GA_MEASUREMENT_ID`; valor vazio desliga a coleta. O layout aceita `analytics={false}` para páginas que não devem rastrear — caso das rotas de pós-compra do LAB, que têm requisito explícito de zero rastreador.

O ID de métricas do GA4 é público (aparece em todo HTML publicado) e não é segredo: não há credencial nem token nesta implementação.

## Checklist

- [x] Registrar a propriedade, o fluxo web e o ID de métricas conferidos no Google Analytics `#astrofy-seo` {#a6c1}
- [x] Emitir o snippet gtag.js assíncrono a partir de um componente único, sem bloquear a renderização `#astrofy-seo` {#a6c2}
- [x] Incluir a medição uma única vez no layout compartilhado e permitir opt-out por página `#astrofy-accessibility` {#a6c3}
- [x] Reduzir o ID ao formato do GA4 antes de entrar no HTML `#astrofy-security` {#a6c4}
- [x] Cobrir lib, componente, layout e HTML compilado com testes `#astrofy-seo` {#a6c5}
- [x] Publicar no GitHub e conferir o build do Cloudflare Pages `#astrofy-seo` {#a6c6}
- [x] Desativar a ferramenta GA4 duplicada do Cloudflare Zaraz e conferir o HTML servido `#astrofy-security` {#a6c7}

## Notas

- Sem banner de consentimento nesta entrega: o público é brasileiro e a medição roda sem Consent Mode. Se houver tráfego da UE/Reino Unido, ativar o Consent Mode v2 antes de manter a coleta.
- Eventos de negócio (checkout do LAB, envio de cadastro) não foram instrumentados; ficam para uma fatia própria.
- **Cloudflare Zaraz desativado em 2026-11-03.** O Zaraz tinha, na configuração *publicada*, a ferramenta `google-analytics_v4` "Google Analytics Site" com `tid` **G-739P03GM5K**, três ações (`AllPageviews`, `AllTracks` e `kARO` "Visita Humana") e `autoInjectScript: true` — ou seja, era uma segunda fonte enviando para a mesma propriedade, contando sessões e pageviews em dobro com o snippet deste repositório. A configuração *publicada* foi substituída por `tools: {}` e `autoInjectScript: false` via `cf zaraz config update` + `cf zaraz publish create`, preservando os gatilhos. Atenção: `cf zaraz config get` lê o rascunho; `cf zaraz export get` lê o publicado.
- Efeito colateral aceito: a desativação é por zona e vale também para `lab.douglasgaspar.com` e `crmtest.douglasgaspar.com`. A medição desses hosts precisa ser refeita dentro de cada aplicação (ou com uma ferramenta Zaraz restrita por regra de URL).
- Verificação final em Chrome real: zero requisições a `/cdn-cgi/zaraz/*` e a única fonte GA é `googletagmanager.com/gtag/js?id=G-739P03GM5K`, com hits em `analytics.google.com/g/collect` carregando `tid=G-739P03GM5K`, `en=page_view` e `en=user_engagement`.
- `src/scripts/lab-obrigado.test.ts`, `src/scripts/lab-signup.test.ts` e um caso de `src/scripts/seo.test.ts` já estavam vermelhos antes desta fatia porque `src/pages/lab/obrigado.astro` e `src/pages/lab/bem-vindo.astro` estão removidos no diretório de trabalho. Nada nesta fatia altera essas páginas.

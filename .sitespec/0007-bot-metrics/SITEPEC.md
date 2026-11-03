---
schemaVersion: "1.0.0"
id: "0007"
slug: bot-metrics
title: Medir visitas de crawlers sem sujar as visitas humanas
summary: Enviar um evento por acesso de crawler, classificado por provedor, para uma propriedade GA4 separada, mantendo a medição humana do navegador intacta.
status: in-progress
createdAt: "2026-11-03T14:10:00Z"
updatedAt: "2026-11-03T14:10:00Z"
primarySkill: astrofy-cloudflare-deploy
reviewSkills:
  - astrofy-seo
  - astrofy-security
relatedFiles:
  - src/lib/bots.ts
  - functions/_middleware.ts
  - src/scripts/bots.test.ts
page: site
task: analytics
source: Pedido direto do responsável em 2026-11-03 para separar visitas humanas de visitas de bots de IA (OpenAI, Gemini e outros).
dependsOn:
  - "0006"
estimateMinutes: 90
estimateBasis: um classificador de User-Agent, um middleware de borda, uma suíte de testes de contrato e a configuração de duas variáveis de ambiente no Cloudflare Pages.
---

## Descrição

O GA4 instalado na fatia `0006` conta **apenas humanos**, e isso não é uma escolha de configuração: GPTBot, ClaudeBot, PerplexityBot e os crawlers equivalentes não executam JavaScript, então o `gtag` nunca dispara para eles. Nenhum filtro no GA4 poderia enxergá-los.

Esta fatia adiciona a segunda camada: `functions/_middleware.ts`, uma Pages Function que roda em toda requisição, deixa a resposta passar normalmente (`context.next()`) e, somente quando a resposta é um documento HTML 200 pedido por um crawler conhecido, envia um evento ao Measurement Protocol da propriedade **douglasgaspar.com — Bots**.

Decisões de desenho:

- **O nome do evento identifica o provedor** (`bot_openai`, `bot_google`, `bot_anthropic`, `bot_perplexity`, …) em vez de depender de uma dimensão personalizada. Dimensões personalizadas exigem acesso de escrita à Admin API do GA4, que está indisponível nesta conta (a conexão OAuth disponível tem escopo `analytics.readonly`). O nome do evento já é uma dimensão reportável nativa.
- **A query string é descartada** do `page_location`, para não vazar parâmetro de campanha nem identificador em relatório.
- **Nada de IP nem User-Agent em claro**: `client_id` é SHA-256 de `IP|User-Agent|dia`, recalculado a cada dia, então o identificador deixa de ser reidentificável no dia seguinte.
- **Sem as duas variáveis de ambiente o middleware é inerte** — não envia nada e não altera a resposta. É o que permite publicar o código antes de a propriedade de bots existir.

## Requisitos

- **NFR-001** — As visitas humanas continuam exatamente como em `0006`: o middleware não altera status, cabeçalhos nem corpo da resposta, e só mede `GET` de documento HTML com status 200.
- **NFR-002** — Cada acesso de crawler gera um evento `bot_<provedor>` no Measurement Protocol, com `bot_name`, `bot_provider`, `bot_is_ai`, `page_path`, `country`, `session_id`.
- **NFR-003** — O classificador reconhece OpenAI, Google/Gemini, Anthropic, Perplexity, Microsoft, Meta, ByteDance, Amazon, Apple, Cohere, Mistral, Common Crawl e You.com, e guarda crawler desconhecido em `other` em vez de descartar.
- **NFR-004** — O evento não carrega IP nem User-Agent em claro; o `client_id` é hash diário.

## Checklist

- [x] Classificar User-Agent em provedor, nome e indicador de IA `#astrofy-seo` {#a7c1}
- [x] Enviar um evento por acesso de crawler ao Measurement Protocol, sem alterar a resposta `#astrofy-security` {#a7c2}
- [x] Medir apenas documento HTML 200 e ignorar assets, `HEAD` e `/cdn-cgi/` `#astrofy-seo` {#a7c3}
- [x] Anonimizar o visitante com hash diário de IP e User-Agent `#astrofy-security` {#a7c4}
- [x] Cobrir classificador, corpo do evento e contrato do middleware com testes `#astrofy-seo` {#a7c5}
- [x] Publicar no GitHub e conferir que o Pages continua servindo o site com `functions/` no root `#astrofy-cloudflare-deploy` {#a7c6}
- [ ] Criar a propriedade "douglasgaspar.com — Bots", o fluxo web e o segredo do Measurement Protocol `#astrofy-seo` {#a7c7}
- [ ] Definir `GA_BOTS_MEASUREMENT_ID` e `GA_BOTS_API_SECRET` no Pages e reimplantar `#astrofy-cloudflare-deploy` {#a7c8}
- [ ] Validar com User-Agents de bot reais e conferir o relatório em tempo real da propriedade de bots `#astrofy-seo` {#a7c9}

## Notas

- **2026-11-03 — bloqueio de escrita no GA4.** `POST https://analyticsadmin.googleapis.com/v1beta/properties` e `POST …/customDimensions` pela conexão Composio devolvem `403 PERMISSION_DENIED` / `ACCESS_TOKEN_SCOPE_INSUFFICIENT`. A conexão `ca_1tbrwgc40lkJ` usa a auth config `ac__W-NOWrrgrGj`, que é gerenciada pelo Composio e portanto traz apenas escopo de leitura — refazer o link não acrescenta `analytics.edit`. Não há `gcloud` nem service account na máquina. Consequência: a propriedade e o segredo do Measurement Protocol precisam ser criados na interface do GA4; o restante (variáveis de ambiente, deploy, validação) é automatizável.
- O User-Agent é auto-declarado. A contagem desta fatia é **declarada**, não verificada. Endurecer exige comparar o IP de origem com os intervalos publicados por cada provedor (OpenAI, Google, Anthropic, Perplexity); fica registrado como evolução, não como pendência bloqueante.
- Sem banner de consentimento, mesma situação de `0006`: o hash diário e a ausência de IP/User-Agent em claro reduzem a exposição, mas tráfego da UE/Reino Unido ainda exigiria decisão de Consent Mode.
- Não instrumentar de novo o Cloudflare Zaraz: a ferramenta foi removida em `0006` por duplicar a medição humana. Esta fatia usa Measurement Protocol direto, sem Zaraz.
- O botão "Testar" desta medição é `curl` com User-Agent de bot mais o relatório em tempo real da propriedade de bots; não há tela de inspeção no site.

---
schemaVersion: "1.0.0"
id: "0007"
slug: bot-metrics
title: Medir visitas de crawlers sem sujar as visitas humanas
summary: Gravar cada acesso de crawler, classificado por provedor, no Workers Analytics Engine e publicar um relatório protegido em /metricas — mantendo a medição humana do navegador intacta.
status: in-progress
createdAt: "2026-11-03T14:10:00Z"
updatedAt: "2026-11-03T14:40:00Z"
primarySkill: astrofy-cloudflare-deploy
reviewSkills:
  - astrofy-seo
  - astrofy-security
relatedFiles:
  - src/lib/bots.ts
  - src/lib/bot-metrics.ts
  - functions/_middleware.ts
  - functions/metricas.ts
  - wrangler.jsonc
  - src/scripts/bots.test.ts
  - src/scripts/bot-metrics.test.ts
page: site
task: analytics
source: Pedido direto do responsável em 2026-11-03 para separar visitas humanas de visitas de bots de IA (OpenAI, Gemini e outros), com a opção B escolhida em 2026-11-03.
dependsOn:
  - "0006"
estimateMinutes: 150
estimateBasis: um classificador de User-Agent, um middleware de borda, uma página de relatório com autenticação, o binding de Analytics Engine no Cloudflare Pages e duas suítes de teste de contrato.
---

## Descrição

O GA4 instalado na fatia `0006` conta **apenas humanos**, e isso não é uma escolha de configuração: GPTBot, ClaudeBot, PerplexityBot e os crawlers equivalentes não executam JavaScript, então o `gtag` nunca dispara para eles. Nenhum filtro no GA4 poderia enxergá-los.

Esta fatia adiciona a segunda camada, sem tocar na primeira:

1. `functions/_middleware.ts` roda em toda requisição, deixa a resposta passar normalmente (`context.next()`) e, somente quando a resposta é um documento HTML 200 pedido por um crawler conhecido, grava **um** ponto de dados no dataset `dgaspar_bots` do Workers Analytics Engine.
2. `functions/metricas.ts` responde em `/metricas` com o relatório agregado, lido pela SQL API do Cloudflare.

O binding `BOT_METRICS` é declarado em `wrangler.jsonc`, porque a API de projetos do Pages não aceita `analytics_engine_datasets` — a tentativa por `PATCH /pages/projects/dgaspar-site` devolve `8000006 Request body is incorrect`.

## Requisitos

- **NFR-001** — As visitas humanas continuam exatamente como em `0006`: o middleware não altera status, cabeçalhos nem corpo, e só mede `GET` de documento HTML com status 200.
- **NFR-002** — Cada acesso de crawler vira um ponto de dados com `index1 = bot_<provedor>` e o layout `blob1..blob7` / `double1` documentado em `src/lib/bots.ts`.
- **NFR-003** — O classificador reconhece OpenAI, Google/Gemini, Anthropic, Perplexity, Microsoft, Meta, ByteDance, Amazon, Apple, Cohere, Mistral, Common Crawl, You.com e Diffbot, e guarda crawler desconhecido em `other` em vez de descartar.
- **NFR-004** — O IP do visitante nunca é lido; o middleware não acessa `cf-connecting-ip` nem `x-forwarded-for`.
- **NFR-005** — O relatório consulta o dataset pela SQL API com janela de tempo explícita e leva `_sample_interval` em conta nas contagens.
- **NFR-006** — A página mostra total, provedores, crawlers, páginas, origem, série diária e a divisão IA/não-IA, e avisa quando uma consulta falhou em vez de exibir zero.
- **NFR-007** — `/metricas` exige HTTP Basic Auth, responde `503` quando a configuração está incompleta e nunca é indexada (`X-Robots-Tag` e `<meta name="robots">`).

## Layout do dataset `dgaspar_bots`

| coluna | conteúdo |
|---|---|
| `index1` | `bot_<provedor>` (`bot_openai`, `bot_google`, …) |
| `blob1` | provedor |
| `blob2` | nome do crawler declarado no User-Agent |
| `blob3` | caminho da página, sem query string |
| `blob4` | país de origem (`CF-IPCountry`) |
| `blob5` | referrer |
| `blob6` | host |
| `blob7` | User-Agent do crawler, truncado em 180 caracteres |
| `double1` | `1` quando o crawler alimenta IA, `0` quando não |

## Checklist

- [x] Classificar User-Agent em provedor, nome e indicador de IA `#astrofy-seo` {#a7c1}
- [x] Gravar um ponto de dados por acesso de crawler sem alterar a resposta `#astrofy-security` {#a7c2}
- [x] Medir apenas documento HTML 200 e ignorar assets, `HEAD` e `/cdn-cgi/` `#astrofy-seo` {#a7c3}
- [x] Não ler o IP do visitante em nenhum caminho `#astrofy-security` {#a7c4}
- [x] Cobrir classificador, ponto de dados e contrato do middleware com testes `#astrofy-seo` {#a7c5}
- [x] Declarar o binding `BOT_METRICS` em `wrangler.jsonc` e conferir que o Pages continua servindo o site `#astrofy-cloudflare-deploy` {#a7c6}
- [x] Publicar o relatório em `/metricas` com Basic Auth, `noindex` e aviso de consulta falha `#astrofy-seo` {#a7c7}
- [x] Criar o token de leitura *Account Analytics: Read* e configurar as variáveis de ambiente do Pages `#astrofy-cloudflare-deploy` {#a7c8}
- [ ] Validar com User-Agents de bot reais e conferir as linhas gravadas no dataset `#astrofy-seo` {#a7c9}
- [ ] Conferir `/metricas` autenticado mostrando os provedores reais `#astrofy-seo` {#a7ca}

## Notas

- **Por que não a segunda propriedade GA4 (opção A).** `POST https://analyticsadmin.googleapis.com/v1beta/properties` e `POST …/customDimensions` devolvem `403 PERMISSION_DENIED` / `ACCESS_TOKEN_SCOPE_INSUFFICIENT`. A conexão `ca_1tbrwgc40lkJ` usa a auth config `ac__W-NOWrrgrGj`, gerenciada pelo Composio, portanto só tem escopo de leitura — refazer o link não acrescenta `analytics.edit`. Sem `gcloud` e sem service account na máquina. A opção B removeu essa dependência por completo.
- **Token de leitura.** O OAuth do `cf` CLI não é aceito pela SQL API, e `POST /accounts/{id}/tokens` responde `403`. Foi possível criar um token de usuário por `POST /user/tokens` com o grupo de permissão `b89a480218d04ceb98b4fe57ca29dc1f` (*Account Analytics Read*), escopo restrito à conta e validade até 2027-11-03. O valor vive só nas variáveis de ambiente do Pages.
- **Endpoint.** A SQL API nova (`POST /client/v4/analytics/sql`) exige `scope.accountTag` e `time_range`; o endpoint antigo (`/analytics_engine/sql`) recusa tanto o token OAuth quanto o token criado.
- O User-Agent é auto-declarado. A contagem é **declarada**, não verificada. Endurecer exige comparar o IP de origem com os intervalos publicados por cada provedor — decisão futura, não pendência bloqueante.
- Guardar `blob7` com o User-Agent do crawler é proposital: é o que permite auditar a classificação e reconhecer crawler novo. Nenhum User-Agent de visitante humano é gravado, porque humano nunca chega ao middleware de bots.
- Sem banner de consentimento, mesma situação de `0006`. Aqui não há cookie nem identificador de visitante: apenas contagem de crawler por página e país.
- Não reativar o Cloudflare Zaraz: a ferramenta foi removida em `0006` por duplicar a medição humana. Esta fatia grava direto no Analytics Engine, sem Zaraz.

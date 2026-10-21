---
schemaVersion: "1.0.0"
id: "0005"
slug: home-contact-form
title: Integrar o envio do formulário da Home
summary: Integração de formulário fora do escopo atual; manter CTA de e-mail escolhido pelo responsável.
status: blocked
createdAt: "2026-10-18T00:57:05Z"
updatedAt: "2026-10-18T00:57:05Z"
primarySkill: astrofy-forms
reviewSkills:
  - astrofy-accessibility
  - astrofy-editorial-review
relatedFiles:
  - src/pages/index.astro
  - .astrofy/config/integrations.json
page: home
task: contact-form
source: Plano técnico derivado de .astrofy/pages$LOCAL_PATH e da aprovação da Home nesta conversa.
dependsOn:
  - "0002"
blockedReason: O responsável decidiu usar CTAs mailto nesta versão da Home. Esta tarefa histórica não bloqueia a Home atual e só deve ser retomada se o formulário for solicitado novamente.
---

## Descrição

O escopo atual da Home substituiu o formulário por CTAs `mailto:` para `contato@douglasgaspar.com`, conforme decisão explícita do responsável em 2026-10-20. Não há implementação ou promessa de formulário. Este registro fica bloqueado como histórico; só volte a planejar uma integração real se o responsável reabrir o formulário e fornecer destino e privacidade.

## Checklist

- [ ] Registrar o serviço/endereço, método, contrato de resposta e ambiente de teste autorizados `#astrofy-forms` {#f5c1}
- [ ] Registrar a URL e o texto de privacidade aprovados e definir sua apresentação junto ao formulário `#astrofy-forms` {#f5c2}
- [ ] Implementar validação no servidor, prevenção de submissão duplicada e estados acessíveis; preservar os campos e permitir nova tentativa em erro `#astrofy-forms` {#f5c3}
- [ ] Conferir labels, foco, mensagens de erro e sucesso com teclado; o sucesso só pode aparecer após confirmação do destino `#astrofy-accessibility` {#f5c4}
- [ ] Enviar mensagem controlada ao destino de teste autorizado e confirmar recebimento sem registrar o conteúdo pessoal completo `#astrofy-forms` {#f5c5}

## Notas

- Fora do escopo atual por decisão do responsável; a Home concluída usa `mailto:` sem simular envio.
- Se o formulário for reaberto, revisar requisitos e obter confirmação nova de destino e privacidade antes de implementar.
- Validação prevista após a integração: `astrofy check --category forms` e percurso manual por teclado. Não enviar mensagens reais sem um destino de teste autorizado.

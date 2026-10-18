---
schemaVersion: "1.0.0"
id: "0005"
slug: home-contact-form
title: Integrar o envio do formulário da Home
summary: Integrar o formulário com validação e estados acessíveis após definir destino e privacidade.
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
blockedReason: A pessoa responsável ainda precisa definir o serviço/endereço de recebimento e fornecer URL e texto de privacidade aprovados.
---

## Descrição

O conteúdo visual do formulário pertence à tarefa de conteúdo da Home. Esta tarefa cobre a integração real do envio, que não deve ser implementada nem apresentar sucesso até que o destino esteja definido. Antes de ativar o formulário, obter o serviço/endereço de recebimento e os dados de privacidade aprovados. Então selecionar a execução compatível com o ambiente de deploy (provedor externo, endpoint próprio ou Astro Action), validar também no servidor e confirmar recebimento em destino de teste autorizado.

## Checklist

- [ ] Registrar o serviço/endereço, método, contrato de resposta e ambiente de teste autorizados `#astrofy-forms` {#f5c1}
- [ ] Registrar a URL e o texto de privacidade aprovados e definir sua apresentação junto ao formulário `#astrofy-forms` {#f5c2}
- [ ] Implementar validação no servidor, prevenção de submissão duplicada e estados acessíveis; preservar os campos e permitir nova tentativa em erro `#astrofy-forms` {#f5c3}
- [ ] Conferir labels, foco, mensagens de erro e sucesso com teclado; o sucesso só pode aparecer após confirmação do destino `#astrofy-accessibility` {#f5c4}
- [ ] Enviar mensagem controlada ao destino de teste autorizado e confirmar recebimento sem registrar o conteúdo pessoal completo `#astrofy-forms` {#f5c5}

## Notas

- Pendente de informação do responsável: destino de envio, URL e texto de privacidade.
- A tarefa fica bloqueada até as duas pendências serem resolvidas. Não substituir o endpoint por `mailto:` ou simular sucesso.
- O estado aprovado prevê nome, e-mail e mensagem obrigatórios; assunto opcional; sucesso apenas após envio aceito; erro preserva valores e permite nova tentativa.
- Validação prevista após a integração: `astrofy check --category forms` e percurso manual por teclado. Não enviar mensagens reais sem um destino de teste autorizado.

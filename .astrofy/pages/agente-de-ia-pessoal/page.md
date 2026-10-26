# Consultoria para criar seu agente de IA pessoal

- **Tipo:** página de serviço (`service`), não página de software.
- **Estado:** rascunho implementado em 2026-10-22 (`noindex`); copy, FAQ e anúncio de disponibilidade aguardam aprovação para publicação.
- **Rota confirmada:** `/consultorias/agente-de-ia-pessoal/`.
- **Objetivo confirmado:** fazer a pessoa se cadastrar para a primeira consultoria gratuita. Em 26/10/2026 o responsável pediu um formulário local em duas etapas antes da agenda. O botão abre o formulário e, ao concluir, abre `https://cal.com/douglasgaspar/consultorias-servicos?overlayCalendar=true` com nome, e-mail e telefone já preenchidos. Manter esse evento compartilhado, sem criar outro.
- **Arquitetura escolhida:** apresentar a oferta gratuita antes dos detalhes técnicos. Na primeira conversa, Douglas faz o diagnóstico, uma demonstração breve com dados de exemplo e entrega um diagnóstico passo a passo pré-montado. Quem contratar mais horas entra na orientação e nos testes com resumo escrito; um agente operacional, com documentação e suporte definidos, pode ser uma evolução mediante novo escopo/proposta.
- **Público confirmado:** qualquer pessoa que queira criar um agente para uma tarefa própria, inclusive fora do trabalho. O caso individual ainda precisa ser qualificado; não restringir a página a empreendedores ou empresas.
- **Fronteira de publicação:** não alterar `/consultorias/`; não criar evento novo no Cal.com. A página segue `noindex, nofollow` até copy aprovada. Por decisão de 2026-10-22, o item 02 da Home passou a ligar para esta rota como “Consultoria pessoal” (selos `(EM BREVE)` e botão de serviços removidos), sem tornar a página indexável nem vinculá-la a partir de `/consultorias/`.

## Voz e redação

Usar como referência aprovada `brand/voice.md` e `.inboundfy/context/marca-voz.md`: primeira pessoa, especialista acessível, prática e clara, sem jargão ou promessa de autonomia, ganho de tempo e resultado sem prova. A mensagem em `comercial/estrategia-agentes-e-automacoes.md` é uma proposta, não copy aprovada para esta rota. O verbo “criar” no título descreve a finalidade do cliente, não um agente já incluído na consultoria.

## Estrutura de leitura proposta

1. **Hero — convite ao agendamento:** H1 “Consultoria para criar seu agente de IA pessoal”. Texto sugerido, pendente de aprovação: “Traga uma tarefa do seu dia a dia. Na consulta gratuita, conversamos sobre ela, faço uma demonstração com dados de exemplo e entrego um roteiro de diagnóstico passo a passo.” Internamente, o material segue o modelo pré-montado confirmado pelo responsável; não dizer que foi personalizado enquanto isso não for definido. CTA proposto: “Agendar minha consultoria gratuita” → `https://cal.com/douglasgaspar/consultorias-servicos`. Uma só ação principal acima da dobra. Não anunciar que a sessão gratuita entrega um agente pronto.
2. **O que acontece de graça:** destacar o diagnóstico do caso, a demonstração breve com dados de exemplo e a entrega do diagnóstico passo a passo pré-montado. Mostrar uma prévia fiel do material somente quando o modelo estiver pronto; não apresentar mockup fictício como amostra real. Esclarecer quando e em qual formato o diagnóstico é entregue depois que isso for definido.
3. **Como se cadastrar e qual o próximo passo:** o botão abre o formulário local. Ao concluir, a pessoa vai para `https://cal.com/douglasgaspar/consultorias-servicos?overlayCalendar=true` com nome, e-mail e telefone preenchidos. A página não cria conta. Preparar a pessoa para ver uma agenda chamada “Consultorias & Serviços”, que atualmente apresenta 45 minutos e uma descrição genérica. Não afirmar que o Cal.com explicará a oferta específica. Conferir os campos e a mensagem de confirmação antes de descrevê-los. Dizer o que trazer para a conversa só depois de definir essa preparação.
4. **Situações e casos de uso:** apresentar tarefas pessoais e profissionais reconhecíveis antes de citar ferramentas. Para cada exemplo hipotético, mostrar quem faz a tarefa, qual informação entra, o que um agente *poderia* fazer e como a pessoa confere a saída. Exemplos a validar: alguém organiza notas próprias de estudo → agente propõe perguntas para revisão → a pessoa verifica as respostas nas fontes; profissional reúne notas de reuniões → agente propõe organização dos pontos → profissional revisa antes de usar. Não chamar de casos entregues, provas de resultado ou recursos disponíveis.
5. **Da conversa às próximas horas, se fizer sentido:** a consulta gratuita não configura a conta da pessoa. Em horas contratadas depois, a pessoa cria e testa o agente na própria conta com orientação de Douglas e recebe resumo escrito das decisões, limites e próximos passos. Se quiser que Douglas conclua a criação e coloque o agente em operação, o trabalho pode evoluir mediante nova proposta com documentação e suporte definidos. Sem promessa de resultado operacional na oferta gratuita.
6. **Escopo e responsabilidades:** explicar quem prepara o contexto, quem controla contas e acessos, como dados sensíveis são tratados e o que depende de ferramentas externas. Preço, duração, quantidade de horas, revisões e custos de terceiros da etapa contratada não foram definidos.
7. **Perguntas frequentes:** “Preciso saber programar?”, “O diagnóstico é personalizado?”, “Quando recebo o material?”, “A conversa gratuita já configura meu agente?”, “E se eu quiser que você faça por mim?” As respostas sobre personalização e entrega do diagnóstico dependem de definição; a conversa gratuita não configura a conta.
8. **CTA de fechamento:** repetir o convite “Agendar minha consultoria gratuita” (copy proposta) com o mesmo destino Cal.com. Explicar que o agendamento é o cadastro; evitar CTA concorrente para as horas pagas antes da inscrição inicial.

## O que a página não promete

- Agente pronto na primeira conversa gratuita ou necessariamente ao final das horas adicionais.
- Automação completa, disponibilidade contínua, substituição de decisões humanas, privacidade garantida ou retorno financeiro.
- Preço, duração, número de sessões, gravação, plataforma específica, custos de API incluídos ou suporte sem escopo contratado. O diagnóstico pré-montado da etapa gratuita e o resumo escrito das horas adicionais foram confirmados, mas seu formato, prazo e profundidade seguem pendentes.
- Prova social inventada. O case Auttus comprova atuação em automação e integração com IA no alcance relatado, não uma consultoria específica de agente pessoal.

## Comportamento e mídia

- Propor página estática Astro, com `SiteLayout`, hierarquia semântica e estilos existentes. `ServiceHeader` e `ServiceFooter` podem ser avaliados para reuso, sem impor o visual de criação de sites a esta consultoria.
- Usar a agenda já registrada, agora com `overlayCalendar=true`, como destino depois do formulário. Não criar evento novo, banco, backend ou conta no site. O formulário local de 26/10/2026 só encaminha nome, e-mail, telefone e o caso para a URL.
- Ilustração `public/images/conversa.webp` é uma alternativa existente a avaliar; não há screenshot nem vídeo de demonstração autorizado para publicação nesta página. A demonstração na conversa não vira automaticamente mídia do site. A leitura deve funcionar sem imagem.
- Mobile com seções em uma coluna, textos e botões legíveis. Foco visível e navegação por teclado; qualquer movimento decorativo respeita `prefers-reduced-motion`.
- SEO provisório: title “Consultoria para criar seu agente de IA pessoal | Douglas Gaspar”; descrição provisória, canonical na rota confirmada; `noindex, nofollow` ativo em `SiteLayout`. Não tornar indexável nem adicionar links a partir de `/consultorias/` enquanto a copy não estiver aprovada; a Home já liga para a rota por decisão registrada em 22/10/2026.

## Pendências para a próxima rodada

1. Aprovar o texto do CTA e conferir se os 45 minutos exibidos no Cal.com comportam o diagnóstico, a demonstração e a entrega prometidos. Como a agenda escolhida é genérica, avisar na página que a pessoa verá “Consultorias & Serviços”. Verificar campos e confirmação antes de publicar; não mudar a URL escolhida.
2. Definir conteúdo, formato, prazo de entrega e grau de personalização do diagnóstico passo a passo pré-montado; duração e exemplo adequado para a demonstração breve.
3. Definir preço, número de horas, prazo do resumo escrito, dados que a pessoa precisa preparar e limites da prática guiada.
4. Definir condições da proposta opcional para agente operacional, documentação, aceite e suporte.
5. Aprovar copy, FAQ, exemplos, mídia e anúncio de disponibilidade antes de transformar o plano em página pública.

## Fontes e rastreabilidade

- Escolhas do responsável nesta conversa: arquitetura 1+2, configuração acompanhada ou criação por Douglas conforme o cliente, consultoria antes de proposta de execução, primeira consultoria gratuita com Cal.com atual e demonstração breve com dados de exemplo sem configurar conta, rota `/consultorias/agente-de-ia-pessoal/`, público amplo, diagnóstico passo a passo pré-montado na oferta gratuita e horas adicionais com orientação, testes e resumo escrito, evoluindo sob novo escopo para agente operacional. Em 26/10/2026 o responsável substituiu o agendamento direto por um formulário local em duas etapas, nas três páginas, com destino `https://cal.com/douglasgaspar/consultorias-servicos?overlayCalendar=true` e nome, e-mail e telefone preenchidos.
- Implementação de 2026-10-22: rota composta por `AgentHeader`, `AgentHero`, `AgentFreeOffer`, `AgentRegistration`, `AgentUseCases`, `AgentGuided`, `AgentScope`, `AgentExecution`, `AgentFaq` e `AgentClosingCTA`, com CSS próprio em `src/styles/agent-page.css`, `noindex` e branch `agent-consultation` no `SiteLayout`; testes em `src/scripts/agent-page.test.ts` passando e build local gerado sem `max-old-space-size` alto.
- Decisão de 2026-10-22: item 02 da Home virou “Consultoria pessoal” apontando para esta rota (confirmado pelo responsável), item 03 virou “Consultoria empresarial” apontando para `/consultorias/`, selos `(EM BREVE)` e botão de serviços removidos — registrada em `.specsfy/USER-PROFILE.md`, `.specsfy/RULES.md` e `../.astrofy/pages/home/page.md`.
- `comercial/estrategia-agentes-e-automacoes.md` — estratégia comercial proposta, não aprovada para publicação.
- `src/pages/consultorias/index.astro`, `src/components/ConsultingHero.astro`, `src/lib/contact-links.ts` e `src/components/HomeServices.astro` — página, agenda e status atuais.
- [Agenda Cal.com “Consultorias & Serviços”](https://cal.com/douglasgaspar/consultorias-servicos) — título, duração exibida e descrição observados em 22/10/2026; não comprova que o fluxo de confirmação ou o novo escopo já estejam configurados.
- `../BRAND.md`, `../brand/strategy.md`, `../brand/voice.md`, `../.inboundfy/context/publico.md` e `../.specsfy/RULES.md` (caminhos relativos à raiz `site/`: os arquivos de marca e contexto ficam na raiz do repositório) — público, voz, prova e limites.

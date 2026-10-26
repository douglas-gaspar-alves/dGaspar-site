# Página de vendas do LAB dGaspar

- **Estado:** implementação local para revisão editorial e comercial; não publicada.
- **Tipo:** página de vendas (`sales`).
- **Rota:** `/lab/` no site público dGaspar.
- **Objetivo:** explicar a comunidade, comparar os planos confirmados, conduzir ao cadastro gratuito real e à assinatura dos dois planos pagos (Empreendedor e IA Coder) no checkout externo da Cakto.
- **Público:** curiosos, empreendedores e IA coders.
- **Ação principal:** “Criar conta gratuita” → `https://lab.douglasgaspar.com/?fcom_action=auth&form=register` (URL conferida em 22/10/2026).
- **Ação dos planos pagos:** “Conhecer o LAB” de cada um dos dois planos pagos (Empreendedor e IA Coder) abre um modal local de assinatura instanciado por plano (`LabCheckoutModal` recebe `plan="empreendedor" | "ia-coder"`; os destinos saem do registro `CHECKOUT_LINKS[plan]` em `src/lib/lab-checkout.ts`): nome, e-mail e telefone opcional; botões “Assinatura mensal” e “Assinatura anual” bloqueados até nome e e-mail válidos, prefill por query `?name=&email=` e `&phone=` quando preenchido (o telefone ganha máscara digitável `(XX) XXXXX-XXXX` enquanto se digita e vai normalizado em dígitos, sem validação dura nem mensagens de erro) — Empreendedor navega para `https://pay.cakto.com.br/mtya7hj_1232361` e `https://pay.cakto.com.br/e98y5m2_1232361`, IA Coder para `https://pay.cakto.com.br/kuif3kg` e `https://pay.cakto.com.br/thu2zrf` (links dos dois planos restantes preservados; oferta atualizada pelo responsável em 26/10/2026). A página do site **não** processa cobrança; o pagamento e a liberação (manual) acontecem fora do site.

## Ordem de leitura

1. Hero: agentes de IA não se aprendem assistindo — se aprendem criando; acesso gratuito.
2. Jornada: ponto de partida, desafio em turma, relato no encontro ao vivo.
3. Trilha superAgents e formatos: conteúdos por níveis, desafios, aulas ao vivo e grupos.
4. Três planos: Curioso free; Empreendedor R$ 29,99/mês ou R$ 299/ano; IA Coder R$ 47,99/mês ou R$ 470/ano, com chat ilimitado. Sem selo Studio Alma.
5. Perguntas: entrada sem programação, limites do plano free, exclusão de consultoria, cancelamento e captura de assinatura (sem checkout processado nesta página — os links levam ao Cakto).
6. Encerramento: cadastro gratuito.

## Voz e redação

Referência: `BRAND.md` e `brand/voice.md` do projeto LAB, mais `.inboundfy/context/marca-voz.md` e `comercial/lab-dgaspar.md` do hub. Tom curioso, didático, realista e direto; explicar o mecanismo antes do benefício. Usar “LAB dGaspar”, “superAgents”, “IA coders” e “desafio”. Não prometer dinheiro, autonomia total da IA, resultado garantido ou depoimento não registrado. **Copy desta página é proposta local**, ainda não aprovada pelo responsável.

## Mídia e implementação

Ícone LAB já presente em `public/images/icons/lab.svg`, usado como ilustração decorativa. O cabeçalho usa o logo oficial do LAB em fundo escuro, `public/images/logo-lab-escuro.svg`, copiado de `/home/douglas/Projetos/dGaspar/produtos/lab/brand/logo/svg/lab-dgaspar-escuro.svg` (Ato de origem: export brandfy do projeto LAB); o cabeçalho é fixo no topo com fundo translúcido e blur. Headline da hero: “Agentes de IA não se aprendem assistindo. Se aprendem criando.” Arte do herói: duas órbitas circulares (sólida externa + tracejada interna, contrarrotacionais) com satélites luminosos, halo pulsante atrás do ícone e flutuação sutil do quadro e das etiquetas — tudo em CSS (`@keyframes lab-*`) e desativado em `prefers-reduced-motion`. Layout comum `SiteLayout.astro`, seções em componentes `Lab*.astro`, estilos em `src/styles/lab-page.css`; três modais nativos `<dialog>` locais (cadastro gratuito `LabSignupModal`; assinatura paga `LabCheckoutModal` com lib `src/lib/lab-checkout.ts`, componente instanciado por plano — uma instância por cada um dos dois planos pagos, destinos por `CHECKOUT_LINKS[plan]`, telefone opcional com máscara digitável e envio em dígitos) sem dependência nova de runtime. Tema dark-first do produto LAB, distinto do modo claro da marca-mãe no site principal. Padrão para qualquer plano novo: chave no `CHECKOUT_LINKS` + uma instância `<LabCheckoutModal plan="…"/>` — nenhum outro acoplamento (continuidade do aprendizado de T020).

## Fontes e pendências

- Fonte de preço: `.inboundfy/context/ofertas.md` deste projeto e pedido direto de Douglas em 26/10/2026 (SPEC-0003). Mensalidades atualizadas, anuidades preservadas.
- Escopo, público e limites: `/home/douglas/Projetos/dGaspar/produtos/lab/MVP.md` e `comercial/lab-dgaspar.md`.
- Destino do free verificado na comunidade pública em 22/10/2026.
- Links de checkout dos planos pagos conferidos com o responsável em 22/10/2026 e 23/10/2026 (requisito direto do Ato I reaberto de SPEC-0003 e da reabertura de 2026-10-23: mensal/anual `mtya7hj_1232361`/`e98y5m2_1232361` no Empreendedor, `kuif3kg`/`thu2zrf` no IA Coder).
- **Antes de publicar:** Douglas aprova copy, acesso e disponibilidade real dos planos; as pendências de destinos dos planos pagos com checkout estão fechadas (os dois planos pagos têm links fixos Cakto mensal/anual com prefill e liberação manual na comunidade — DEC-012); resta confirmar condições de cancelamento e agenda das aulas. O prefill de nome/e-mail do checkout Cakto está provado por navegação real (23/10/2026); quanto ao prefill do `phone`, a plataforma aceita o valor digitado mas não aplica o parâmetro da query nesta rota (FIND-PROD-005 — pendência de plataforma, não do site). Sem depoimentos, urgência, desconto inventado nem promessa de benefício financeiro.
- `interview.json` foi iniciado pelo CLI Astrofy, mas os campos comerciais sem resposta ainda não podem ser marcados como aprovados. Nenhuma `page-spec.json` pronta foi gerada.

- Limite desta atualização: preços efetivos na Cakto e permissões de chat da comunidade não foram modificados nem verificados; revisão de agenda e demais sugestões da auditoria permanecem fora desta rodada.

## Decisão vigente do LAB — 26/10/2026

Dois planos: Curioso (free) e Empreendedor. Uma aula no segundo sábado e uma live de update na primeira segunda-feira de cada mês. LAB é produto do projeto dGaspar. Os planos e cadências anteriores neste documento ficam superados por `comercial/lab-dgaspar.md` da raiz dGaspar.

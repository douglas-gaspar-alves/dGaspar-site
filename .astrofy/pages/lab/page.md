# Página de vendas do LAB dGaspar

- **Estado:** implementação local para revisão editorial e comercial; não publicada.
- **Tipo:** página de vendas (`sales`).
- **Rota:** `/lab/` no site público dGaspar.
- **Objetivo:** explicar a comunidade, comparar os planos confirmados e conduzir ao cadastro gratuito real.
- **Público:** curiosos, empreendedores e IA coders.
- **Ação principal:** “Criar conta gratuita” → `https://lab.douglasgaspar.com/?fcom_action=auth&form=register` (URL conferida em 22/10/2026).
- **Ação dos planos pagos:** “Conhecer o LAB” → `https://lab.douglasgaspar.com/` (a página **não** contém checkout pago).

## Ordem de leitura

1. Hero: agentes de IA não se aprendem assistindo — se aprendem criando; acesso gratuito.
2. Jornada: ponto de partida, desafio em turma, relato no encontro ao vivo.
3. Trilha superAgents e formatos: conteúdos por níveis, desafios, aulas ao vivo e grupos.
4. Quatro planos: Curioso free; Empreendedor R$ 29,90/mês ou R$ 299/ano; IA Coder R$ 47/mês ou R$ 470/ano; PRO Plus R$ 59,90/mês ou R$ 539/ano, com IArte.
5. Perguntas: entrada sem programação, limites do plano free, exclusão de consultoria, cancelamento e ausência de checkout nesta página.
6. Encerramento: cadastro gratuito.

## Voz e redação

Referência: `BRAND.md` e `brand/voice.md` do projeto LAB, mais `.inboundfy/context/marca-voz.md` e `comercial/lab-dgaspar.md` do hub. Tom curioso, didático, realista e direto; explicar o mecanismo antes do benefício. Usar “LAB dGaspar”, “superAgents”, “IA coders” e “desafio”. Não prometer dinheiro, autonomia total da IA, resultado garantido ou depoimento não registrado. **Copy desta página é proposta local**, ainda não aprovada pelo responsável.

## Mídia e implementação

Ícone LAB já presente em `public/images/icons/lab.svg`, usado como ilustração decorativa. O cabeçalho usa o logo oficial do LAB em fundo escuro, `public/images/logo-lab-escuro.svg`, copiado de `/home/douglas/Projetos/lab/brand/logo/svg/lab-dgaspar-escuro.svg` (Ato de origem: export brandfy do projeto LAB); o cabeçalho é fixo no topo com fundo translúcido e blur. Headline da hero: “Agentes de IA não se aprendem assistindo. Se aprendem criando.” Arte do herói: duas órbitas circulares (sólida externa + tracejada interna, contrarrotacionais) com satélites luminosos, halo pulsante atrás do ícone e flutuação sutil do quadro e das etiquetas — tudo em CSS (`@keyframes lab-*`) e desativado em `prefers-reduced-motion`. Layout comum `SiteLayout.astro`, seções em componentes `Lab*.astro`, estilos em `src/styles/lab-page.css`, sem formulário novo nem dependência nova. Tema dark-first do produto LAB, distinto do modo claro da marca-mãe no site principal.

## Fontes e pendências

- Fonte de preço: `/home/douglas/Projetos/lab/.inboundfy/context/ofertas.md` (DEC-010, 16/10/2026).
- Escopo, público e limites: `/home/douglas/Projetos/lab/MVP.md` e `comercial/lab-dgaspar.md`.
- Destino do free verificado na comunidade pública em 22/10/2026.
- **Antes de publicar:** Douglas aprova copy, acesso e disponibilidade real dos planos; confirma checkout/link de pagamento e fluxo de liberação de cada plano, condições de cancelamento e agenda das aulas. Sem depoimentos, urgência, desconto inventado nem promessa de benefício financeiro.
- `interview.json` foi iniciado pelo CLI Astrofy, mas os campos comerciais sem resposta ainda não podem ser marcados como aprovados. Nenhuma `page-spec.json` pronta foi gerada.

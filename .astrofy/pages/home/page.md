# Home dGaspar — revisão de conteúdo

- **Estado:** `ready` para planejamento técnico; destino do formulário e privacidade seguem pendentes antes de habilitar/publicar o envio.
- **Tipo:** `homepage`
- **Rota:** `/`
- **Objetivo:** gerar conversas sobre a consultoria individual de IA & Automação; encaminhar como prioridade secundária as pessoas interessadas em vibe coding e agentes de IA ao LAB dGaspar.
- **Público principal:** empreendedores e donos de negócios físicos ou digitais que avaliam como IA e automação podem se encaixar no negócio. Necessidades específicas continuam hipóteses quando não validadas.
- **Público secundário:** pessoas interessadas em vibe coding e agentes de IA, público associado ao LAB dGaspar.
- **Ação principal aprovada:** “Converse comigo sobre seu caso.”, com destino ao formulário na própria página (`#contato`).
- **Arquitetura aprovada:** consultoria em primeiro plano; Auttus como prova limitada; serviços e LAB como caminhos de apoio.

## Página na ordem de leitura

### 1. Hero — copy aprovada

**Título:** Entenda onde IA e automação podem fazer sentido no seu negócio.

**Texto:** Eu começo pela realidade do seu negócio para conversar sobre processos, ferramentas e decisões. Se uma implementação fizer sentido, a execução é tratada separadamente.

**Ação:** Converse comigo sobre seu caso. → `#contato`

**Mídia:** logo dGaspar horizontal para fundo claro e um diagrama simples com as etapas contexto → decisão → teste. Não usar foto no hero. O diagrama deve ter alternativa acessível: “Diagrama das etapas contexto, decisão e teste”.

### 2. Consultoria — copy aprovada

**Título:** Uma conversa sobre o seu caso.

**Texto:** Na consultoria online individual, eu conheço seu processo e o que você precisa decidir. Conversamos sobre IA, automação, ferramentas e caminhos possíveis, incluindo n8n. Se você quiser delegar a implementação, a execução é contratada separadamente.

### 3. Projeto Auttus — copy aprovada

**Título:** Auttus

**Texto:** Atuei com automação e integração com IA em um projeto da Auttus.

**Ação:** Visitar o site da Auttus → <https://auttus.com/>.

**Limite factual:** não atribuir outras partes do projeto nem incluir resultados, métricas ou depoimentos sem fonte.

### 4. Serviços de execução — copy aprovada

**Título:** Serviços com escopo tratado por proposta.

O título, o texto e a ação abaixo foram aprovados.

**Texto:** Também posso cuidar da criação de sites, da instalação de n8n e de outras implementações de IA e automação, com escopo tratado por proposta.

**Ação:** Peça uma proposta para a execução. → `#contato`

### 5. LAB dGaspar — copy aprovada

**Título:** LAB dGaspar

**Texto:** O LAB dGaspar é uma comunidade com acesso por login para pessoas interessadas em vibe coding e agentes de IA.

**Ação:** Conheça o LAB → <https://lab.douglasgaspar.com>.

### 6. Formulário de contato — conteúdo aprovado, integração pendente

**Título:** Converse comigo sobre seu caso.

**Campos aprovados:** nome, e-mail e mensagem obrigatórios; assunto opcional com as opções “Consultoria”, “Serviço de execução” e “Outro”.

**Botão:** Enviar mensagem.

**Sucesso:** “Mensagem enviada. Obrigado por compartilhar seu caso.” Exibir somente após confirmação de envio pelo serviço de destino.

**Erro:** “Não foi possível enviar a mensagem. Tente novamente.” Preservar os valores e permitir uma nova tentativa.

**Pendências antes de implementar/publicar o envio:** definir o destino das mensagens e fornecer URL e texto de privacidade aprovados. Os textos de formulário foram aprovados. Não prometer prazo de resposta.

## Navegação

- **Header:** Consultoria (`#consultoria`), Projetos (`#projetos`), Serviços (`#servicos`), LAB (`#lab`) e Contato (`#contato`).
- **Footer:** Instagram → <https://www.instagram.com/doug.gaspar/>; YouTube → <https://www.youtube.com/@d-Gaspar>.
- Todos os destinos principais permanecem nesta Home, exceto links externos de Auttus e LAB. Blog e feed social ficam fora da primeira fase.

## Voz e redação

- **Referência aprovada:** `../brand/voice.md` e `../BRAND.md`.
- **Tom:** primeira pessoa, especialista acessível, prática, clara e próxima.
- **Preservar:** a frase aprovada “Converse comigo sobre seu caso.”; explicar o contexto antes de falar de ferramentas; separar consultoria de execução.
- **Evitar:** promessas de vendas, economia, velocidade ou automação completa; urgência artificial; transformar hipótese de público em fato; usar elogios ou resultados sem fonte.
- A copy completa, incluindo título dos serviços, textos do formulário e metadados de SEO, foi aprovada pelo responsável em 2026-10-17. Destino do formulário e privacidade permanecem pendentes.

## SEO — metadados aprovados

- **Título:** dGaspar | Consultoria de IA e automação.
- **Descrição:** Conversas individuais sobre IA e automação no contexto do seu negócio, com n8n entre os focos e execução contratada separadamente.
- **Canônica:** <https://douglasgaspar.com/> (URL principal registrada no contexto do projeto)..

## Mídia e acessibilidade

- Logo: `../brand/logo/svg/logo-fundo-claro.svg`; proporção horizontal aproximada 3,22:1; texto alternativo “dGaspar”. Copiar para dentro de `site/public/` durante implementação.
- Diagrama: referência visual em `../brand/templates/site-homepage.html`; não é arquivo final. Pode ser composto como ilustração vetorial/CSS, com a descrição acessível indicada acima.
- Foto de retrato: ausente por escolha aprovada; não usar banco de imagens.
- A página deve manter landmarks semânticos, operação por teclado e alternativas textuais para mídia não decorativa.

## Itens em aberto

1. Definir o serviço ou endereço que receberá o formulário antes de implementar o envio.
2. Fornecer URL e texto de privacidade aprovados antes de publicar o formulário.

## Fontes

- `../BRAND.md` — identidade, ofertas, limites de comunicação e prova Auttus.
- `../brand/strategy.md` — públicos e posicionamento.
- `../brand/voice.md` — tom, mensagem e CTA.
- `../brand/templates/site-homepage.html` — referência visual do diagrama e da hierarquia.
- `../.inboundfy/context/empresa.md`, `../.inboundfy/context/publico.md` e `../.inboundfy/context/links.md` — fatos institucionais, públicos e destinos.
- Decisões confirmadas nesta conversa em 2026-10-17 — arquitetura, cópia completa, mídia, campos, navegação, estados do formulário e SEO.

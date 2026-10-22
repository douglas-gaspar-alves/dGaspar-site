# Home pessoal dGaspar

- **Estado:** implementada localmente; publicação não autorizada nem realizada.
- **Tipo:** homepage editorial e portfólio pessoal.
- **Rota:** `/`.
- **Objetivo:** apresentar Douglas Gaspar e orientar visitantes a aprendizado, projetos, consultoria e serviços.
- **Ação de contato:** “Falar no WhatsApp” → link `wa.me` com mensagem pré-preenchida (rodapé). O e-mail `contato@douglasgaspar.com` continua disponível nos demais CTAs e no rodapé.
- **Arquitetura:** apresentação pessoal em fundo azul, cinco caminhos, projetos, toolkit, consultoria e serviços.

## Estrutura de leitura

1. **Hero:** abertura em tela inteira e sem menu. O wordmark dGaspar ocupa a largura da tela atrás do retrato central; as ferramentas aparecem em camadas independentes, com movimento. A borda inferior traz a foto do método A.C.R.E. à esquerda e YouTube/Instagram à direita.
2. **Caminhos:** Quem eu sou, Vamos aprender fazendo, O que estou fazendo, Consultorias, Serviços. Traz o menu fixo do site, que nasce transparente sobre o azul do mapa e vira vidro ao grudar no topo.
3. **Sobre:** fundo azul `#1952c6`, texto em coluna única e os quatro retratos ilustrados alinhados numa faixa com sobreposição leve, com parallax de scroll. Convite ao currículo.
4. **Projetos:** LAB dGaspar, Studio Alma (em desenvolvimento) e o Método A.C.R.E., que saiu da borda da hero para o seu próprio cartão.
5. **Kit de ferramentas:** composição visual rotulada “Meu kit de ferramentas para 2027”, sem catálogo.
6. **Consultoria:** orientação individual; qualquer execução é definida e proposta separadamente.
7. **Serviços:** criação de sites (01), consultoria pessoal (02) e consultoria empresarial (03), todas como âncoras clicáveis. Ajuste de 2026-10-22: os itens 02 e 03 saem de `(EM BREVE)` e o botão “Quero colocar meu projeto em prática” foi removido.
8. **Rodapé:** WhatsApp, e-mail e redes confirmadas.

## Navegação e destinos

- Consultoria: `mailto:contato@douglasgaspar.com?subject=Consultoria...`.
- Serviços: item 01 → `/servicos/criacao-de-sites/`; item 02 “Consultoria pessoal” → `/consultorias/agente-de-ia-pessoal/`; item 03 “Consultoria empresarial” → `/consultorias/`. Ajuste de 2026-10-22.
- Contato geral: `https://wa.me/5522992591418?text=...` (+55 22 99259-1418), aberto em nova aba; o número vive em `whatsappNumber`, em `src/lib/contact-links.ts`.
- Instalação de n8n e implementações de IA e automação: itens `(EM BREVE)`, sem link próprio.
- Próxima aula: `http://lab.douglasgaspar.com/events`, nova aba. O DNS do host falhou durante a validação local; preservar a URL escolhida e revalidar antes de publicar.
- Studio Alma não recebe link público nesta versão.
- O caminho "Vamos aprender fazendo" aponta para `https://lab.douglasgaspar.com`, já que o bloco do LAB saiu do site.
- O convite "Currículo" aponta para `#projetos` até existir um documento de currículo próprio.

## Interface, mídia e validação

- Astro + CSS local, Inter local e GSAP/ScrollTrigger. Respeita `prefers-reduced-motion`.
- Assets selecionados das referências do projeto, copiados para `public/images/`; retrato, foto A.C.R.E. e os quatro retratos ilustrados do bloco Sobre (`eu-bust`, `eu-head`, `eu-frame-smile`, `eu-frame-laugh`) foram reencodados para WebP com alfa. O bloco do LAB saiu do site e a imagem do LAB foi removida.
- A primeira dobra tem teste de contrato em Vitest; os comandos de validação devem ser executados após cada alteração.
- A auditoria automática do Astrofy não está inicializada neste projeto (checklist ausente); a revisão visual foi feita manualmente no navegador local.
- Sem formulário, backend ou deploy. O WhatsApp entra apenas como link `wa.me`; não há automação de mensagem nem integração com a API do WhatsApp.

## Limites factuais

- Não alegar resultados, depoimentos, métricas ou disponibilidade.
- Não apresentar consultoria como execução.
- Studio Alma fica descrito como projeto em desenvolvimento.
- Destino da próxima aula precisa de verificação DNS antes de publicação.
- Itens 02 e 03 da Home deixaram de ser `(EM BREVE)` por decisão de 2026-10-22. A página de “Consultoria pessoal” segue sem aprovação de copy e com `noindex`; o item agora liga para ela por decisão do responsável, mas não reverter isso nem tornar a página indexável sem nova decisão.
- O número do WhatsApp do CTA do rodapé foi confirmado em 2026-10-21 (+55 22 99259-1418); qualquer troca precisa passar por decisão registrada.

## Proveniência

Plano e decisões aprovados nesta conversa em 2026-10-20; desenho de navegação enviado pelo responsável; marca e links registrados em `BRAND.md` e `.inboundfy/context/links.md`. Ajustes de 2026-10-21: rótulos `(EM BREVE)`, destino do CTA de serviços e CTA do rodapé pelo WhatsApp. Ajustes de 2026-10-22: itens 02 e 03 viram consultorias clicíveis (pessoal → `/consultorias/agente-de-ia-pessoal/`, empresarial → `/consultorias/`), selos e botão de serviços removidos.

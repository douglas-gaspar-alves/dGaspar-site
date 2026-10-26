# Mapa de arquivos

## Rotas e composição

- `src/pages/index.astro` monta a Home para `/`.
- `src/pages/consultorias/index.astro` monta a página `/consultorias/`.
- `src/pages/servicos/criacao-de-sites.astro` monta a página
  `/servicos/criacao-de-sites/`.
- `src/layouts/SiteLayout.astro` centraliza o documento HTML, metadados,
  acessibilidade e slots de cabeçalho e rodapé.
- `src/components/` guarda os blocos das páginas e suas propriedades editáveis.
- `src/lib/contact-links.ts` centraliza os destinos reutilizados de contato.

## Estilos e mídia

- `src/styles/global.css` contém os estilos gerais do site.
- `src/styles/service-page.css` contém os estilos da página de criação de sites.
- `src/styles/fonts/fonts.css` e `src/styles/fonts/Inter-Variable.woff2`
  definem a fonte local.
- `public/images/` contém logos, retratos, ilustrações e ícones usados pelas
  páginas.

## Configuração e documentação

- `astro.config.mjs`, `package.json`, `package-lock.json` e `tsconfig.json`
  configuram o projeto e suas dependências.
- `.stacki/guide.json` guarda as preferências do guia visual do Stacki.
- `.astrofy/pages/home/` guarda a especificação editorial da Home.
- `.astrofy/docs/architecture.md` explica a composição das rotas e o contrato
  de edição no Stacki.

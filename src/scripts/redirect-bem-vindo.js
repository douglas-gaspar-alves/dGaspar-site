// Redireciona a página para a página de boas-vindas do Lab assim que ela carregar.
// Usa location.replace() para que o usuário não volte para esta página
// ao usar o botão "voltar" do navegador (evita loop de redirecionamento).

window.addEventListener("load", () => {
  window.location.replace("https://lab.douglasgaspar.com/bem-vindo/");
});

// Lib da página de obrigado do LAB (fatia 0005) — constantes puras, sem I/O.
//
// A Cakto redireciona o comprador aprovado para uma URL configurada no produto
// (campos `upsell`/`upsellPage` do `products_update`, ver R-001/R-003 da spec
// 0005). Esta lib concentra essa URL e o contato de suporte usados pela página
// e pelos testes; o executor do wiring (T012) usa os mesmos valores.
//
// O número de WhatsApp é confirmado e sua troca exige nova decisão registrada
// em `.specsfy/RULES.md` (fonte: `site/src/lib/contact-links.ts`).

/** URL canônica e alvo único do redirecionamento pós-compra do LAB. */
export const LAB_OBRIGADO_URL = "https://douglasgaspar.com/lab/obrigado/";

/** Suporte pós-compra do LAB: liberação do acesso é manual pelo Douglas. */
export const SUPPORT_WHATSAPP_URL = "https://wa.me/5522992591418?text=Ol%C3%A1%2C%20Douglas!%20Comprei%20o%20LAB%20e%20quero%20a%20libera%C3%A7%C3%A3o%20do%20meu%20acesso.";

/**
 * Registro do redirecionamento no produto LAB na Cakto, informado pelos casos
 * de teste (AC-003/AC-006) e pelo executor do wiring:
 * - `on` — estado ativo: obrigado/upsell configurado para a página do site;
 * - `off` — rollback documentado pela mesma operação (`products_update`),
 *   restaurando o comportamento padrão da Cakto.
 */
export const REDIRECT_WIRING = {
	on: { upsell: true, upsellPage: LAB_OBRIGADO_URL },
	off: { upsell: false, upsellPage: "" },
} as const;

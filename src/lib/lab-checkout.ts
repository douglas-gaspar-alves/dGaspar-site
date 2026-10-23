// Assinatura paga do LAB via checkout Cakto dos planos Empreendedor, IA Coder
// e PRO Plus (destinos por plano no registro CHECKOUT_LINKS, FR-003). Site 100%
// estático: os dados do formulário existem apenas para compor a query de
// prefill do checkout (R-001/R-002, research/cakto-prefill-checkout.md) e não
// são enviados para backend do site. O telefone é normalizado para dígitos
// antes de codificar (FR-004, reabertura de 2026-10-23). Funções puras, sem
// I/O e sem dependências.

/** Checkout mensal do plano Empreendedor na Cakto. */
export const CHECKOUT_MONTHLY_URL = "https://pay.cakto.com.br/mtya7hj_1232361";

/** Checkout anual do plano Empreendedor na Cakto. */
export const CHECKOUT_ANNUAL_URL = "https://pay.cakto.com.br/e98y5m2_1232361";

/** Checkout mensal do plano IA Coder na Cakto (pedido do responsável, 2026-10-22). */
export const CHECKOUT_CODER_MONTHLY_URL = "https://pay.cakto.com.br/kuif3kg";

/** Checkout anual do plano IA Coder na Cakto (pedido do responsável, 2026-10-22). */
export const CHECKOUT_CODER_ANNUAL_URL = "https://pay.cakto.com.br/thu2zrf";

/** Checkout mensal do plano PRO Plus na Cakto (pedido do responsável, 2026-10-23). */
export const CHECKOUT_PLUS_MONTHLY_URL = "https://pay.cakto.com.br/o4gpj7n_1232361";

/** Checkout anual do plano PRO Plus na Cakto (pedido do responsável, 2026-10-23). */
export const CHECKOUT_PLUS_ANNUAL_URL = "https://pay.cakto.com.br/kq2kw8q_1232361";

/**
 * Destinos de assinatura por plano consumido no pop-up (seção 7, FR-003):
 * o modal instancia os hrefs do plano que o abriu; chaves casam com
 * `plan`/`plan.key` dos componentes. `buildCheckoutUrl` recebe o link da vez
 * e permanece plano-agnóstico.
 */
export const CHECKOUT_LINKS = {
	empreendedor: { mensal: CHECKOUT_MONTHLY_URL, anual: CHECKOUT_ANNUAL_URL },
	"ia-coder": { mensal: CHECKOUT_CODER_MONTHLY_URL, anual: CHECKOUT_CODER_ANNUAL_URL },
	"pro-plus": { mensal: CHECKOUT_PLUS_MONTHLY_URL, anual: CHECKOUT_PLUS_ANNUAL_URL },
} as const;

export type CheckoutInput = {
	nome: string;
	email: string;
	telefone: string;
};

/** Mesmo formato de e-mail aceito no registro gratuito (lib lab-signup). */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Mínimo de nome vigente no modal gratuito: 3 caracteres com conteúdo real. */
const NOME_MIN_LEN = 3;

/**
 * Valida os campos do pop-up e devolve a mensagem de erro (pt-BR) ou null
 * quando a pessoa está apta a assinar. Telefone é opcional: nunca validado aqui.
 */
export function validateCheckoutInput(input: CheckoutInput): string | null {
	if (input.nome.trim().length < NOME_MIN_LEN) return "Informe o seu nome completo.";
	if (!EMAIL_PATTERN.test(input.email.trim())) return "Informe um e-mail válido.";
	return null;
}

/** Indica se os cliques nas duas assinaturas podem navegar ao checkout. */
export function isCheckoutReady(input: CheckoutInput): boolean {
	return validateCheckoutInput(input) === null;
}

/**
 * Normaliza o telefone para só dígitos antes de ir ao checkout (FR-004,
 * reabertura de 2026-10-23): qualquer máscara ou sinal digitado — "(22)
 * 99925-9141", "+55 22 99925-9141" — chega nos formatos reconhecidos pela
 * plataforma (R-001; prova real R-003). Sem validação dura e sem erro: valor
 * sem nenhum dígito vira string vazia e o `phone` simplesmente sai da query
 * (o telefone segue opcional).
 */
export function normalizePhoneForCheckout(valor: string): string {
	return valor.replace(/\D/g, "");
}

/**
 * Monta a URL de prefill do checkout: `name` e `email` sempre, `phone` só
 * quando há dígitos no valor informado (FR-004). Cada valor é codificado
 * individualmente (`encodeURIComponent`, NFR-002) e o telefone chega
 * normalizado para dígitos — o formato reconhecido pela plataforma (R-003).
 */
export function buildCheckoutUrl(checkoutUrl: string, input: CheckoutInput): string {
	const phone = normalizePhoneForCheckout(input.telefone.trim());
	const params = [
		`name=${encodeURIComponent(input.nome.trim())}`,
		`email=${encodeURIComponent(input.email.trim())}`,
	];
	if (phone) params.push(`phone=${phone}`);
	return `${checkoutUrl}?${params.join("&")}`;
}

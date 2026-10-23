// Fio do pop-up de assinatura paga do LAB (planos Empreendedor, IA Coder e
// PRO Plus). Padrão idêntico ao modal de cadastro gratuito: gatilhos <a> com
// data-lab-checkout-open (valor = plano) abrem o <dialog> nativo do próprio
// plano; os dois botões de assinatura só navegam com nome e e-mail válidos,
// compondo a URL de prefill pela lib src/lib/lab-checkout.ts (sem rede
// — NFR-001). O telefone ganha máscara digitável dígito a dígito e segue
// opcional (FR-004). Sem JavaScript os <a> mantêm o href real do checkout
// mensal do próprio plano.

import {
	buildCheckoutUrl,
	isCheckoutReady,
	type CheckoutInput,
} from "../lib/lab-checkout";

const triggers = Array.from(document.querySelectorAll<HTMLAnchorElement>("[data-lab-checkout-open]"));
const dialogs = Array.from(document.querySelectorAll<HTMLDialogElement>("[data-lab-checkout-modal]"));

function currentInput(form: HTMLFormElement | null): CheckoutInput {
	const getString = (name: string) =>
		form?.querySelector<HTMLInputElement>(`[name="${name}"]`)?.value ?? "";
	return {
		nome: getString("nome"),
		email: getString("email"),
		telefone: getString("telefone"),
	};
}

/** Alterna aria-disabled dos dois botões conforme nome + e-mail válidos. */
function syncAvailability(form: HTMLFormElement | null, actionLinks: HTMLAnchorElement[]) {
	const ready = isCheckoutReady(currentInput(form));
	for (const link of actionLinks) {
		link.setAttribute("aria-disabled", ready ? "false" : "true");
	}
}

/**
 * Máscara digitável do telefone (FR-004, AC-012): função pura, sem estado
 * global, aplicada dígito a dígito no evento `input` de cada diálogo. Só
 * formata, nunca bloqueia a digitação e nunca gera erro — quem reconduz o
 * valor a dígitos no envio é a lib (normalizePhoneForCheckout). Valores com
 * mais de 11 dígitos (colado com DDI, ex.: "+55 22 99925-9141") não são
 * truncados: permanecem em dígitos e seguem íntegros para a query.
 */
function formatTelefone(valor: string): string {
	const digits = valor.replace(/\D/g, "");
	if (digits.length === 0) return "";
	if (digits.length <= 2) return digits;
	if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
	if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
	if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
	return digits;
}

// Um binding completo por diálogo: cada plano tem os próprios campos, botões,
// gatilho e fechamento. O script roda uma única vez mesmo com o componente
// instanciado duas vezes na página (o Astro deduplica o <script>).
for (const dialog of dialogs) {
	const dialogPlan = dialog.dataset.labCheckoutModal ?? "";
	const form = dialog.querySelector<HTMLFormElement>("[data-lab-checkout-form]");
	const actionLinks = Array.from(
		dialog.querySelectorAll<HTMLAnchorElement>("[data-lab-checkout-monthly], [data-lab-checkout-annual]"),
	);

	// Só o gatilho que declara este plano abre este diálogo.
	for (const trigger of triggers) {
		if ((trigger.dataset.labCheckoutOpen ?? "") !== dialogPlan) continue;
		trigger.addEventListener("click", (event) => {
			event.preventDefault();
			dialog.showModal();
		});
	}

	dialog.querySelector<HTMLButtonElement>("[data-lab-checkout-close]")?.addEventListener("click", () => {
		dialog.close();
	});

	// Clique no fundo fecha; Esc é tratado pelo <dialog> nativo.
	dialog.addEventListener("click", (event) => {
		if (event.target === dialog) dialog.close();
	});

	// Reage à digitação: desbloqueia/bloqueia os dois botões sem requisição.
	form?.addEventListener("input", () => syncAvailability(form, actionLinks));

	// Máscara do telefone deste diálogo (FR-004, AC-012): formata enquanto
	// digita, sem bloquear e sem mensagem de erro (telefone segue opcional).
	const telefoneField = form?.querySelector<HTMLInputElement>('input[name="telefone"]');
	if (telefoneField) {
		telefoneField.addEventListener("input", () => {
			telefoneField.value = formatTelefone(telefoneField.value);
		});
	}

	// Bloqueado → o clique não navega; livre → navega na mesma aba com prefill.
	for (const link of actionLinks) {
		link.addEventListener("click", (event) => {
			const input = currentInput(form);
			if (!isCheckoutReady(input)) {
				event.preventDefault();
				return;
			}
			event.preventDefault();
			window.location.assign(buildCheckoutUrl(link.href, input));
		});
	}
}

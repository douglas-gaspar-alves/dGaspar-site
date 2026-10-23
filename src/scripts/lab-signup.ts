// Lógica do formulário de cadastro gratuito do LAB (modal acionado pelos CTAs
// "Começar grátis" / "Criar conta gratuita"). Cadastro sem senha: o portal
// gera a senha e o membro a define no primeiro acesso. A validação e o payload
// ficam em src/lib/lab-signup.ts; aqui fica só o fio com o DOM.

import {
	buildPayload,
	postSignup,
	validateSignup,
} from "../lib/lab-signup";

const triggers = Array.from(document.querySelectorAll<HTMLElement>("[data-lab-signup-open]"));
const dialog = document.querySelector<HTMLDialogElement>("[data-lab-signup-modal]");
const form = dialog?.querySelector<HTMLFormElement>("[data-lab-signup-form]");
const statusNode = dialog?.querySelector<HTMLElement>("[data-lab-signup-status]");
const submitButton = dialog?.querySelector<HTMLButtonElement>("[data-lab-signup-submit]");

function showStatus(message: string, kind: "error" | "success" = "error") {
	if (!statusNode) return;
	statusNode.hidden = false;
	statusNode.dataset.kind = kind;
	statusNode.textContent = message;
	if (kind === "error") statusNode.focus();
}

function clearStatus() {
	if (!statusNode) return;
	statusNode.hidden = true;
	statusNode.textContent = "";
}

function openDialog(event: Event, target: HTMLElement, element: HTMLDialogElement) {
	// Sem JavaScript o link original (portal do FluentCommunity) continua
	// funcionando; com JS intercepta-se o clique e abrimos o modal no lugar.
	if (!(target instanceof HTMLAnchorElement) || target.dataset.labSignupOpen === undefined) return;
	event.preventDefault();
	element.showModal();
}

triggers.forEach((trigger) => {
	trigger.addEventListener("click", (event) => {
		if (!dialog) return;
		openDialog(event, trigger, dialog);
	});
});

dialog?.querySelector<HTMLButtonElement>("[data-lab-signup-close]")?.addEventListener("click", () => {
	dialog.close();
});

// Clique no fundo fecha; Esc é tratado pelo <dialog> nativo.
dialog?.addEventListener("click", (event) => {
	if (event.target === dialog) dialog.close();
});

form?.addEventListener("submit", async (event) => {
	event.preventDefault();
	if (!form || !(form instanceof HTMLFormElement)) return;
	const getString = (name: string) =>
		form.querySelector<HTMLInputElement>(`[name="${name}"]`)?.value ?? "";

	const input = {
		nome: getString("nome"),
		whatsapp: getString("whatsapp"),
		email: getString("email"),
		aceitouTermos: form.querySelector<HTMLInputElement>('[name="aceite_termos"]')?.checked ?? false,
	};

	const validationError = validateSignup(input);
	if (validationError) {
		showStatus(validationError);
		return;
	}

	clearStatus();

	const webhookUrl = form.dataset.webhookUrl ?? "";
	const successUrl = form.dataset.successUrl ?? "";
	if (!webhookUrl || !successUrl) {
		showStatus("Formulário sem destino configurado. Tente o cadastro direto no portal.");
		return;
	}

	if (submitButton) {
		submitButton.disabled = true;
		submitButton.dataset.sending = "true";
	}
	try {
		const payload = buildPayload(input);
		const result = await postSignup(payload, webhookUrl);
		if (!result.ok) throw new Error(`webhook respondeu ${result.status}`);
		window.location.assign(successUrl);
	} catch {
		showStatus("Não conseguimos registrar agora. Tente novamente em instantes.");
	} finally {
		if (submitButton) {
			submitButton.disabled = false;
			submitButton.dataset.sending = "false";
		}
	}
});

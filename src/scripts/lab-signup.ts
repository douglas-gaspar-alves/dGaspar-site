// Lógica do formulário de cadastro gratuito do LAB (modal acionado pelos CTAs
// "Começar grátis" / "Criar conta gratuita"). Cadastro sem senha: o portal
// gera a senha e o membro a define no primeiro acesso. A validação e o payload
// ficam em src/lib/lab-signup.ts; aqui fica só o fio com o DOM.

import {
	buildPayload,
	postSignup,
	signupValidationError,
} from "../lib/lab-signup";
import { trackSignup } from "../lib/lab-signup-analytics";

const triggers = Array.from(document.querySelectorAll<HTMLElement>("[data-lab-signup-open]"));
const dialog = document.querySelector<HTMLDialogElement>("[data-lab-signup-modal]");
const form = dialog?.querySelector<HTMLFormElement>("[data-lab-signup-form]");
const statusNode = dialog?.querySelector<HTMLElement>("[data-lab-signup-status]");
const submitButton = dialog?.querySelector<HTMLButtonElement>("[data-lab-signup-submit]");
let sending = false;

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
	void trackSignup("lab_signup_open");
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
	if (sending) return;
	const getString = (name: string) =>
		form.querySelector<HTMLInputElement>(`[name="${name}"]`)?.value ?? "";

	const input = {
		nome: getString("nome"),
		whatsapp: getString("whatsapp"),
		email: getString("email"),
		aceitouTermos: form.querySelector<HTMLInputElement>('[name="aceite_termos"]')?.checked ?? false,
	};

	for (const field of form.querySelectorAll("input")) field.removeAttribute("aria-invalid");
	const validationError = signupValidationError(input);
	if (validationError) {
		void trackSignup("lab_signup_validation_error", "validation");
		form.querySelector(`[name="${validationError.field}"]`)?.setAttribute("aria-invalid", "true");
		showStatus(validationError.message);
		return;
	}

	clearStatus();

	const webhookUrl = form.dataset.webhookUrl ?? "";
	const successUrl = form.dataset.successUrl ?? "";
	if (!webhookUrl || !successUrl) {
		showStatus("Formulário sem destino configurado. Tente o cadastro direto no portal.");
		return;
	}

	sending = true;
	form.setAttribute("aria-busy", "true");
	showStatus("Criando sua conta. Aguarde…", "success");
	void trackSignup("lab_signup_submit");
	if (submitButton) {
		submitButton.disabled = true;
		submitButton.dataset.sending = "true";
	}
	try {
		const payload = buildPayload(input);
		const result = await postSignup(payload, webhookUrl);
		if (!result.ok) {
			void trackSignup("lab_signup_error", result.status === 0 ? "network" : "integration");
			throw new Error("signup_failed");
		}
		await trackSignup("lab_signup_complete");
		window.location.assign(successUrl);
	} catch {
		showStatus("Não conseguimos registrar agora. Tente novamente em instantes.");
	} finally {
		sending = false;
		form.removeAttribute("aria-busy");
		if (submitButton) {
			submitButton.disabled = false;
			submitButton.dataset.sending = "false";
		}
	}
});

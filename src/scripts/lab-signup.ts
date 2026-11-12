// Modal do LAB: valida os campos e envia o lead por POST nativo ao webhook de criação de conta.
// A máscara do WhatsApp mantém a apresentação atual; o campo enviado é telefone.

import {
	signupValidationError,
} from "../lib/lab-signup";
import { trackSignup } from "../lib/lab-signup-analytics";

const triggers = Array.from(document.querySelectorAll<HTMLElement>("[data-lab-signup-open]"));
const dialog = document.querySelector<HTMLDialogElement>("[data-lab-signup-modal]");
const form = dialog?.querySelector<HTMLFormElement>("[data-lab-signup-form]");
const statusNode = dialog?.querySelector<HTMLElement>("[data-lab-signup-status]");
const submitButton = dialog?.querySelector<HTMLButtonElement>("[data-lab-signup-submit]");
let sending = false;

function maskSignupPhone(value: string): string {
	const digits = value.replace(/\D/g, "");
	const hasCountryCode = (value.trimStart().startsWith("+") && digits.startsWith("55")) || (digits.length > 11 && digits.startsWith("55"));
	const countryCode = hasCountryCode ? "+55 " : "";
	const phone = (hasCountryCode ? digits.slice(2) : digits).slice(0, 11);
	if (!phone) return countryCode;

	if (phone.length <= 2) return `${countryCode}(${phone}`;
	const area = phone.slice(0, 2);
	const subscriber = phone.slice(2);
	const firstGroupSize = subscriber.startsWith("9") ? 5 : 4;
	const number = subscriber.length > firstGroupSize
		? `${subscriber.slice(0, firstGroupSize)}-${subscriber.slice(firstGroupSize)}`
		: subscriber;
	return `${countryCode}(${area}) ${number}`;
}

const phoneInput = form?.querySelector<HTMLInputElement>('[name="telefone"]');
phoneInput?.addEventListener("input", () => {
	const cursor = phoneInput.selectionStart ?? phoneInput.value.length;
	const digitsBeforeCursor = phoneInput.value.slice(0, cursor).replace(/\D/g, "").length;
	const masked = maskSignupPhone(phoneInput.value);
	if (masked === phoneInput.value) return;

	phoneInput.value = masked;
	let nextCursor = 0;
	let digitsAtCursor = 0;
	while (nextCursor < masked.length && digitsAtCursor < digitsBeforeCursor) {
		if (/\d/.test(masked[nextCursor])) digitsAtCursor += 1;
		nextCursor += 1;
	}
	phoneInput.setSelectionRange(nextCursor, nextCursor);
});

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

form?.addEventListener("submit", (event) => {
	event.preventDefault();
	if (!form || !(form instanceof HTMLFormElement)) return;
	if (sending) return;
	const getString = (name: string) =>
		form.querySelector<HTMLInputElement>(`[name="${name}"]`)?.value ?? "";

	const input = {
		nome: getString("nome"),
		whatsapp: getString("telefone"),
		email: getString("email"),
		aceitouTermos: form.querySelector<HTMLInputElement>('[name="aceite_termos"]')?.checked ?? false,
	};

	for (const field of form.querySelectorAll("input")) field.removeAttribute("aria-invalid");
	const validationError = signupValidationError(input);
	if (validationError) {
		void trackSignup("lab_signup_validation_error", "validation");
		form.querySelector(`[name="${validationError.field === "whatsapp" ? "telefone" : validationError.field}"]`)?.setAttribute("aria-invalid", "true");
		showStatus(validationError.message);
		return;
	}

	clearStatus();

	sending = true;
	form.setAttribute("aria-busy", "true");
	showStatus("Enviando seu cadastro. Aguarde…", "success");
	void trackSignup("lab_signup_submit");
	if (submitButton) {
		submitButton.disabled = true;
		submitButton.dataset.sending = "true";
	}
	try {
		// POST nativo: segue o destino configurado no formulário sem depender de CORS.
		HTMLFormElement.prototype.submit.call(form);
	} catch {
		showStatus("Não conseguimos registrar agora. Tente novamente em instantes.");
		sending = false;
		form.removeAttribute("aria-busy");
		if (submitButton) {
			submitButton.disabled = false;
			submitButton.dataset.sending = "false";
		}
	}
});

import {
	buildBookingUrl,
	formatTelefone,
	validateCase,
	validateIdentity,
	type BookingCase,
	type BookingVariant,
} from "../lib/booking-link";

const dialogs = Array.from(document.querySelectorAll<HTMLDialogElement>("[data-booking-dialog]"));
const triggers = Array.from(document.querySelectorAll<HTMLElement>("[data-booking-open]"));

function fieldValue(form: HTMLFormElement, name: string): string {
	return form.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(`[name="${name}"]`)?.value ?? "";
}

function isChecked(form: HTMLFormElement, name: string): boolean {
	return form.querySelector<HTMLInputElement>(`[name="${name}"]`)?.checked ?? false;
}

function readCase(form: HTMLFormElement, variant: BookingVariant): BookingCase {
	if (variant === "negocio") {
		return {
			variant,
			negocio: fieldValue(form, "negocio"),
			avaliar: fieldValue(form, "avaliar"),
			hoje: fieldValue(form, "hoje"),
		};
	}
	if (variant === "agente") {
		return {
			variant,
			tarefa: fieldValue(form, "tarefa"),
			onde: fieldValue(form, "onde"),
			confirma: isChecked(form, "confirma"),
		};
	}
	return {
		variant,
		negocio: fieldValue(form, "negocio"),
		precisa: fieldValue(form, "precisa"),
		resolver: fieldValue(form, "resolver"),
	};
}

function showStatus(status: HTMLElement | null, message: string) {
	if (!status) return;
	status.hidden = false;
	status.textContent = message;
	status.focus();
}

function clearStatus(status: HTMLElement | null) {
	if (!status) return;
	status.hidden = true;
	status.textContent = "";
}

function setStep(dialog: HTMLDialogElement, step: 1 | 2) {
	dialog.querySelectorAll<HTMLElement>("[data-booking-step]").forEach((panel) => {
		panel.hidden = panel.dataset.bookingStep !== String(step);
	});
	dialog.querySelectorAll<HTMLElement>("[data-step-label]").forEach((label) => {
		const n = Number(label.dataset.stepLabel);
		label.classList.toggle("is-on", n === step);
		label.classList.toggle("is-done", n < step);
	});
	const heading = dialog.querySelector<HTMLElement>("[data-booking-heading]");
	if (heading) heading.textContent = step === 1 ? "Seus dados" : heading.dataset.caseTitle ?? "Seu caso";
	dialog.dataset.bookingCurrentStep = String(step);
}

for (const dialog of dialogs) {
	const form = dialog.querySelector<HTMLFormElement>("[data-booking-form]");
	const status = dialog.querySelector<HTMLElement>("[data-booking-status]");
	const variant = (form?.dataset.variant ?? "negocio") as BookingVariant;

	for (const trigger of triggers) {
		trigger.addEventListener("click", (event) => {
			event.preventDefault();
			clearStatus(status);
			setStep(dialog, 1);
			dialog.showModal();
		});
	}

	dialog.querySelector<HTMLButtonElement>("[data-booking-close]")?.addEventListener("click", () => {
		dialog.close();
	});

	dialog.addEventListener("click", (event) => {
		if (event.target === dialog) dialog.close();
	});

	dialog.addEventListener("close", () => {
		form?.reset();
		clearStatus(status);
		setStep(dialog, 1);
	});

	const phone = form?.querySelector<HTMLInputElement>('[name="telefone"]');
	phone?.addEventListener("input", () => {
		phone.value = formatTelefone(phone.value);
	});

	const goNext = () => {
		if (!form) return;
		const error = validateIdentity({
			nome: fieldValue(form, "nome"),
			email: fieldValue(form, "email"),
			telefone: fieldValue(form, "telefone"),
		});
		if (error) {
			showStatus(status, error);
			return;
		}
		clearStatus(status);
		setStep(dialog, 2);
		dialog.querySelector<HTMLElement>('[data-booking-step="2"] input, [data-booking-step="2"] select, [data-booking-step="2"] textarea')?.focus();
	};

	dialog.querySelector("[data-booking-next]")?.addEventListener("click", goNext);
	dialog.querySelector("[data-booking-back]")?.addEventListener("click", () => {
		clearStatus(status);
		setStep(dialog, 1);
	});

	form?.addEventListener("submit", (event) => {
		event.preventDefault();
		if (dialog.dataset.bookingCurrentStep !== "2") {
			goNext();
			return;
		}
		const identity = {
			nome: fieldValue(form, "nome"),
			email: fieldValue(form, "email"),
			telefone: fieldValue(form, "telefone"),
		};
		const bookingCase = readCase(form, variant);
		const error = validateIdentity(identity) ?? validateCase(bookingCase);
		if (error) {
			showStatus(status, error);
			return;
		}
		window.location.assign(buildBookingUrl(identity, bookingCase));
	});
}

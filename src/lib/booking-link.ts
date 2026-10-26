// Agenda compartilhada das consultorias e da criação de sites.
// O site não guarda os dados: eles só entram na URL do Cal.com.

export const bookingCalendarUrl =
	"https://cal.com/douglasgaspar/consultorias-servicos?overlayCalendar=true";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NOME_MIN_LEN = 3;

export type BookingVariant = "negocio" | "agente" | "sites";

export type BookingIdentity = {
	nome: string;
	email: string;
	telefone: string;
};

export type BookingCase =
	| { variant: "negocio"; negocio: string; avaliar: string; hoje: string }
	| { variant: "agente"; tarefa: string; onde: string; confirma: boolean }
	| { variant: "sites"; negocio: string; precisa: string; resolver: string };

export function validateIdentity(input: BookingIdentity): string | null {
	if (input.nome.trim().length < NOME_MIN_LEN) return "Informe o seu nome completo.";
	if (!EMAIL_PATTERN.test(input.email.trim())) return "Informe um e-mail válido.";
	if (localPhoneDigits(input.telefone).length < 10) return "Informe um WhatsApp com DDD.";
	return null;
}

export function validateCase(input: BookingCase): string | null {
	if (input.variant === "negocio") {
		if (!input.avaliar.trim()) return "Escolha o que você quer avaliar.";
		if (input.hoje.trim().length < 3) return "Conte como isso acontece hoje.";
		return null;
	}
	if (input.variant === "agente") {
		if (input.tarefa.trim().length < 3) return "Conte a tarefa que você quer trazer.";
		if (!input.onde.trim()) return "Escolha onde a tarefa acontece hoje.";
		if (!input.confirma) return "Confirme que a consulta gratuita não configura o agente.";
		return null;
	}
	if (!input.precisa.trim()) return "Escolha o que você precisa.";
	if (input.resolver.trim().length < 3) return "Conte o que o site precisa resolver.";
	return null;
}

/** Máscara digitável. Mais de 11 dígitos ficam só em dígitos, para não cortar um +55 colado. */
export function formatTelefone(valor: string): string {
	const digits = valor.replace(/\D/g, "");
	if (digits.length === 0) return "";
	if (digits.length <= 2) return digits;
	if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
	if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
	if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
	return digits;
}

/**
 * Telefone no formato que o Cal.com preenche em `attendeePhoneNumber`.
 * 10 ou 11 dígitos locais ganham 55. Um número que já veio com 55 e pelo
 * menos 12 dígitos não é prefixado de novo. O DDD 55 existe, então 11
 * dígitos começando com 55 continuam sendo um número local.
 */
export function phoneForCal(valor: string): string {
	const digits = valor.replace(/\D/g, "");
	if (digits.length < 10) return "";
	const withCountry = digits.startsWith("55") && digits.length >= 12 ? digits : `55${digits}`;
	return `+${withCountry}`;
}

export function caseTitle(input: BookingCase): string {
	if (input.variant === "agente") return "Uso pessoal";
	const negocio = input.negocio.trim();
	if (negocio) return negocio;
	return input.variant === "sites" ? "Criação de sites" : "Consultoria empresarial";
}

export function caseNotes(input: BookingCase): string {
	if (input.variant === "negocio") {
		return [
			"Página: /consultorias/",
			`O que avaliar: ${input.avaliar.trim()}`,
			`Como acontece hoje: ${input.hoje.trim()}`,
		].join("\n");
	}
	if (input.variant === "agente") {
		return [
			"Página: /consultorias/agente-de-ia-pessoal/",
			`Tarefa: ${input.tarefa.trim()}`,
			`Onde acontece: ${input.onde.trim()}`,
		].join("\n");
	}
	return [
		"Página: /servicos/criacao-de-sites/",
		`O que precisa: ${input.precisa.trim()}`,
		`O que o site precisa resolver: ${input.resolver.trim()}`,
	].join("\n");
}

export function buildBookingUrl(identity: BookingIdentity, bookingCase: BookingCase): string {
	const url = new URL(bookingCalendarUrl);
	url.searchParams.set("name", identity.nome.trim());
	url.searchParams.set("email", identity.email.trim());
	url.searchParams.set("attendeePhoneNumber", phoneForCal(identity.telefone));
	url.searchParams.set("title", caseTitle(bookingCase));
	url.searchParams.set("notes", caseNotes(bookingCase).slice(0, 700));
	return url.toString();
}

function localPhoneDigits(valor: string): string {
	const digits = valor.replace(/\D/g, "");
	if (digits.startsWith("55") && digits.length >= 12) return digits.slice(2);
	return digits;
}

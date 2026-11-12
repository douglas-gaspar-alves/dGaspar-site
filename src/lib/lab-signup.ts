// Cadastro gratuito do LAB — constants e utilitários compartilhados entre o
// site (_BROWSER) e o webhook de criação de conta do LAB.
//
// O formulário é SEM senha: só a ponte no servidor gera a senha interna.
// O membro define a própria senha pelo "Perdeu a senha?" do portal,
// recebendo o link por e-mail. Cadastro não autentica automaticamente.

/** Destino do formulário de criação de conta do LAB. */
export const SIGNUP_WEBHOOK_URL = "https://webhook.douglasgaspar.com/webhook/criar-conta";

/** Ponte same-origin: nenhuma credencial ou senha interna chega ao navegador. */
export const SIGNUP_API_URL = "/api/lab/signup";

/** Primeiros passos do LAB — destino após a confirmação do webhook. */
export const SIGNUP_SUCCESS_URL = "https://lab.douglasgaspar.com/space/geral-sk/page/primeiros-passos";

/** Portal do FluentCommunity, tela de login/acesso de quem já é membro. */
export const SIGNUP_MEMBER_URL = "https://lab.douglasgaspar.com/?fcom_action=auth";

export type SignupInput = {
	nome: string;
	whatsapp: string;
	email: string;
	aceitouTermos: boolean;
};

export type SignupPayload = {
	nome: string;
	first_name: string;
	last_name: string;
	user_login: string;
	whatsapp: string;
	email: string;
	aceite_termos: boolean;
	origem: string;
	enviado_em: string;
};

/** Divide o nome completo em first_name/last_name no corte do FluentCommunity. */
export function splitName(nome: string): { first_name: string; last_name: string } {
	const parts = nome.trim().replace(/\s+/g, " ").split(" ").filter(Boolean);
	return { first_name: parts[0] ?? "", last_name: parts.slice(1).join(" ") };
}

/**
 * Valida o formulário e devolve a mensagem de erro (pt-BR) ou null quando está
 * apto a enviar.
 */
export function validateSignup(input: SignupInput): string | null {
	return signupValidationError(input)?.message ?? null;
}

export function signupValidationError(input: SignupInput): { field: "nome" | "whatsapp" | "email" | "aceite_termos"; message: string } | null {
	if (input.nome.trim().length < 3 || input.nome.length > 200) return { field: "nome", message: "Informe o seu nome completo (3 a 200 caracteres)." };
	if (!normalizeSignupPhone(input.whatsapp)) return { field: "whatsapp", message: "Informe um WhatsApp válido com DDD." };
	if (input.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.email.trim())) return { field: "email", message: "Informe um e-mail válido." };
	if (!input.aceitouTermos) return { field: "aceite_termos", message: "É preciso aceitar os termos de uso para criar a conta." };
	return null;
}

/** Formato simples BR; não consulta operadora nem comprova titularidade. */
export function normalizeSignupPhone(value: string): string | null {
	if (value.length > 32 || !/^[+\d\s().-]+$/.test(value)) return null;
	let digits = value.replace(/\D/g, "");
	if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
	if (!/^55[1-9]\d[2-9]\d{7,8}$/.test(digits)) return null;
	if (/^(\d)\1+$/.test(digits.slice(4))) return null;
	return digits;
}

/** Monta os dados enviados ao webhook (sem senha). */
export function buildPayload(input: SignupInput, now: Date = new Date()): SignupPayload {
	const { first_name, last_name } = splitName(input.nome);
	const loginFromEmail = input.email.trim().toLowerCase().split("@")[0] ?? "";
	const userLogin = loginFromEmail.replace(/[^a-z0-9._-]/g, "") || splitName(input.nome).first_name.toLowerCase().replace(/[^a-z0-9._-]/g, "");
	return {
		nome: input.nome.trim(),
		first_name,
		last_name,
		user_login: userLogin,
		whatsapp: normalizeSignupPhone(input.whatsapp) ?? "",
		email: input.email.trim().toLowerCase(),
		aceite_termos: input.aceitouTermos,
		origem: "douglasgaspar.com/lab/",
		enviado_em: now.toISOString(),
	};
}

/** POST JSON no webhook; keepalive protege o envio durante o redirect. */
export async function postSignup(
	payload: SignupPayload,
	webhookUrl: string,
	fetchImpl: typeof fetch = fetch,
): Promise<{ ok: boolean; status: number }> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 45_000);
	try {
		const response = await fetchImpl(webhookUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json", "X-Lab-Signup": "1" },
			body: JSON.stringify(payload),
			keepalive: true,
			signal: controller.signal,
		});
		const data: unknown = await response.json().catch(() => null);
		return { ok: response.status === 200 && isSignupComplete(data), status: response.status };
	} catch {
		return { ok: false, status: 0 };
	} finally {
		clearTimeout(timeout);
	}
}

export function isSignupComplete(data: unknown): boolean {
	return typeof data === "object" && data !== null &&
		"ok" in data && data.ok === true &&
		"status" in data && data.status === "completed";
}

// Cadastro gratuito do LAB — constants e utilitários compartilhados entre o
// site (_BROWSER) e o fluxo n8n "Novo usuario no lab" (R5GMLa8IBp4D1RxD), que
// normaliza os dados e chama o incoming webhook do FluentCommunity.
//
// O formulário é SEM senha: o payload não leva user_pass, então o
// FluentCommunity gera uma senha interna ao criar o usuário e o membro define
// a própria senha no primeiro acesso (campo "Perdeu a senha?" da tela de
// login do portal), recebendo o link por e-mail.

/** Destino do formulário: gatilho webhook do fluxo "Novo usuario no lab". */
export const SIGNUP_WEBHOOK_URL = "https://acre.apps.n8nitro.com/webhook/new-user";

/** Página de boas-vindas — redireciono para ela após OK do webhook. */
export const SIGNUP_SUCCESS_URL = "https://douglasgaspar.com/lab-bem-vindo/";

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
	if (input.nome.trim().length < 3) return "Informe o seu nome completo.";
	const digits = input.whatsapp.replace(/\D/g, "");
	if (digits.length < 10 || digits.length > 13) return "Informe um WhatsApp válido com DDD (10 a 13 dígitos).";
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.email.trim())) return "Informe um e-mail válido.";
	if (!input.aceitouTermos) return "É preciso aceitar os termos de uso para criar a conta.";
	return null;
}

/** Monta o payload exato esperado pelo webhook do fluxo n8n (sem senha). */
export function buildPayload(input: SignupInput, now: Date = new Date()): SignupPayload {
	const { first_name, last_name } = splitName(input.nome);
	const loginFromEmail = input.email.trim().toLowerCase().split("@")[0] ?? "";
	const userLogin = loginFromEmail.replace(/[^a-z0-9._-]/g, "") || splitName(input.nome).first_name.toLowerCase().replace(/[^a-z0-9._-]/g, "");
	return {
		nome: input.nome.trim(),
		first_name,
		last_name,
		user_login: userLogin,
		whatsapp: input.whatsapp.trim(),
		email: input.email.trim(),
		aceite_termos: input.aceitouTermos,
		origem: "douglasgaspar.com/lab/",
		enviado_em: now.toISOString(),
	};
}

/** POST JSON no webhook do n8n; keepalive protege o envio durante o redirect. */
export async function postSignup(
	payload: SignupPayload,
	webhookUrl: string,
	fetchImpl: typeof fetch = fetch,
): Promise<{ ok: boolean; status: number }> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 8_000);
	try {
		const response = await fetchImpl(webhookUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
			keepalive: true,
			signal: controller.signal,
		});
		return { ok: response.ok, status: response.status };
	} catch {
		return { ok: false, status: 0 };
	} finally {
		clearTimeout(timeout);
	}
}

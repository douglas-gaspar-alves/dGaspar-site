import { buildPayload, isSignupComplete, SIGNUP_WEBHOOK_URL, validateSignup } from "../../../src/lib/lab-signup";

interface SignupEnv {
	LAB_SIGNUP_WEBHOOK_TOKEN?: string;
	/** Override reservado ao ambiente de preview/staging; nunca vem do corpo. */
	LAB_SIGNUP_WEBHOOK_URL?: string;
}

interface SignupContext {
	request: Request;
	env: SignupEnv;
}

const LIMIT = 8192;

const reply = (status: number, ok = false) => Response.json(
	{ ok, status: ok ? "completed" : "error" },
	{ status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" } },
);

/** Limita também corpos chunked sem confiar em Content-Length. */
async function readJson(request: Pick<Request, "body" | "headers">): Promise<unknown> {
	if (Number(request.headers.get("content-length")) > LIMIT) throw new Error("body_limit");
	const reader = request.body?.getReader();
	if (!reader) return null;
	const chunks: Uint8Array[] = [];
	let size = 0;
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		size += value.byteLength;
		if (size > LIMIT) { await reader.cancel(); throw new Error("body_limit"); }
		chunks.push(value);
	}
	const bytes = new Uint8Array(size);
	let offset = 0;
	for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
	return JSON.parse(new TextDecoder().decode(bytes));
}

export const onRequest = async ({ request, env }: SignupContext): Promise<Response> => {
	if (request.method !== "POST") return new Response(null, { status: 405, headers: { Allow: "POST", "Cache-Control": "no-store" } });
	const origin = new URL(request.url).origin;
	if (request.headers.get("origin") !== origin || request.headers.get("X-Lab-Signup") !== "1") return reply(403);
	if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return reply(415);
	if (!env.LAB_SIGNUP_WEBHOOK_TOKEN || env.LAB_SIGNUP_WEBHOOK_TOKEN.length < 32) return reply(503);

	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), 40_000);
	try {
		let data: unknown;
		try { data = await readJson(request); }
		catch (error) { return reply(error instanceof Error && error.message === "body_limit" ? 413 : 400); }
		if (!data || typeof data !== "object" || Array.isArray(data)) return reply(422);
		const body = data as Record<string, unknown>;
		if (typeof body.nome !== "string" || typeof body.email !== "string" || typeof body.whatsapp !== "string" || body.aceite_termos !== true) return reply(422);
		const input = { nome: body.nome, email: body.email, whatsapp: body.whatsapp, aceitouTermos: true };
		if (validateSignup(input)) return reply(422);

		const webhook = new URL(env.LAB_SIGNUP_WEBHOOK_URL || SIGNUP_WEBHOOK_URL);
		if (webhook.protocol !== "https:" || webhook.username || webhook.password) return reply(503);
		const payload = buildPayload(input);
		const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload.email));
		const identity = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
		const password = Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) => byte.toString(16).padStart(2, "0")).join("");
		// Workers não implementa redirect:"error": o fetch lança TypeError antes de
		// enviar e a ponte responde 502 sem chamar o n8n. "manual" recusa o 3xx.
		const response = await fetch(webhook.href, {
			method: "POST",
			headers: { "Content-Type": "application/json", "X-Lab-Signup-Token": env.LAB_SIGNUP_WEBHOOK_TOKEN },
			body: JSON.stringify({ ...payload, user_login: `lab_${identity.slice(0, 40)}`, internal_password: password }),
			redirect: "manual",
			signal: controller.signal,
		});
		// Nunca repassa IDs, senha interna, erros de API ou existência da conta ao cliente.
		if (response.status !== 200) return reply(502);
		const content = await readJson(response).catch(() => null);
		return isSignupComplete(content) ? reply(200, true) : reply(502);
	} catch {
		return reply(controller.signal.aborted ? 504 : 502);
	} finally {
		clearTimeout(timer);
	}
};

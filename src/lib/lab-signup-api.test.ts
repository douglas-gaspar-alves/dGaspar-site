import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "../../functions/api/lab/signup";

const token = "test-only-not-a-real-secret-0123456789";
const data = { nome: "Pessoa Teste", email: " TESTE@example.com ", whatsapp: "(22) 98765-4321", aceite_termos: true };
const request = (body: unknown = data, headers: Record<string, string> = {}) => new Request("https://site.test/api/lab/signup", { method: "POST", headers: { Origin: "https://site.test", "Content-Type": "application/json", "X-Lab-Signup": "1", ...headers }, body: JSON.stringify(body) });
const run = (req = request()) => onRequest({ request: req, env: { LAB_SIGNUP_WEBHOOK_TOKEN: token } });
afterEach(() => vi.unstubAllGlobals());

describe("ponte autenticada de cadastro", () => {
	it("envia apenas campos autorizados, cria senha no servidor e não a devolve", async () => {
		const mock = vi.fn(async () => Response.json({ ok: true, status: "completed", password: "never-return", id: 123 }));
		vi.stubGlobal("fetch", mock);
		const response = await run(request({ ...data, user_login: "admin", internal_password: "injected", roles: ["administrator"], origem: "fake" }));
		expect(await response.json()).toEqual({ ok: true, status: "completed" });
		const [, init] = mock.mock.calls[0] as unknown as [string, RequestInit];
		const sent = JSON.parse(String(init.body));
		expect(sent).toMatchObject({ email: "teste@example.com", whatsapp: "5522987654321", origem: "douglasgaspar.com/lab/" });
		expect(sent.user_login).toMatch(/^lab_[a-f0-9]{40}$/);
		expect(sent.internal_password).toMatch(/^[a-f0-9]{64}$/);
		expect(sent.roles).toBeUndefined();
		expect(init.headers).toMatchObject({ "X-Lab-Signup-Token": token });
		expect(response.headers.get("cache-control")).toBe("no-store");
	});
	it("fecha quando o segredo está ausente e recusa origem ou tipo indevido", async () => {
		expect((await onRequest({ request: request(), env: {} })).status).toBe(503);
		expect((await run(request(data, { Origin: "https://evil.test" }))).status).toBe(403);
		expect((await run(request(data, { "X-Lab-Signup": "" }))).status).toBe(403);
		expect((await run(request(data, { "Content-Type": "text/plain" }))).status).toBe(415);
		expect((await run(new Request("https://site.test/api/lab/signup"))).status).toBe(405);
	});
	it("rejeita campos inválidos e payload excessivo antes do webhook", async () => {
		const mock = vi.fn(); vi.stubGlobal("fetch", mock);
		for (const body of [null, [], {}, { ...data, aceite_termos: "true" }, { ...data, email: "no" }, { ...data, whatsapp: "123" }]) expect((await run(request(body))).status).toBe(422);
		expect((await run(request({ ...data, extra: "a".repeat(9000) }))).status).toBe(413);
		expect(mock).not.toHaveBeenCalled();
	});
	it("não converte recebido, 202 ou falha de API em cadastro concluído", async () => {
		for (const reply of [Response.json({ message: "Workflow got started." }), Response.json({ ok: true, status: "completed" }, { status: 202 }), new Response("api-private-error", { status: 500 })]) {
			vi.stubGlobal("fetch", async () => reply);
			const response = await run();
			expect(response.status).toBe(502);
			expect(await response.json()).toEqual({ ok: false, status: "error" });
		}
	});
	it("reenvio usa o mesmo login e nunca a mesma senha interna", async () => {
		const sent: Array<Record<string, string>> = [];
		vi.stubGlobal("fetch", async (_: string, init: RequestInit) => { sent.push(JSON.parse(String(init.body))); return Response.json({ ok: true, status: "completed" }); });
		await run(); await run();
		expect(sent[0].user_login).toBe(sent[1].user_login);
		expect(sent[0].internal_password).not.toBe(sent[1].internal_password);
	});
});

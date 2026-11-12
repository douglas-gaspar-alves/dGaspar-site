import { describe, expect, it, vi } from "vitest";
import { buildPayload, postSignup, validateSignup } from "./lab-signup";

const input = { nome: "Pessoa Teste", email: " TESTE@Example.com ", whatsapp: "(22) 98765-4321", aceitouTermos: true };

describe("SPEC-0007 — confirmação do cadastro gratuito", () => {
	it("SPECSFY: SPEC-0007 US-001 FR-001 NFR-001 AC-001 — só aceita confirmação de negócio", async () => {
		const fetcher = vi.fn(async () => Response.json({ ok: true, status: "completed" }));
		expect(await postSignup(buildPayload(input), "/api/lab/signup", fetcher)).toMatchObject({ ok: true });
	});
	it("SPECSFY: SPEC-0007 US-001 FR-001 NFR-001 AC-002 — normaliza e limita dados sem verificar titularidade", () => {
		expect(buildPayload(input)).toMatchObject({ email: "teste@example.com", whatsapp: "5522987654321" });
		expect(validateSignup({ ...input, nome: "a".repeat(201) })).not.toBeNull();
		expect(validateSignup({ ...input, whatsapp: "0".repeat(11) })).not.toBeNull();
		expect(validateSignup(input)).toBeNull();
	});
	it("SPECSFY: SPEC-0007 US-001 FR-001 NFR-001 AC-003 — recebido, HTML e 202 não são sucesso", async () => {
		for (const response of [Response.json({ message: "Workflow got started." }), new Response("OK"), Response.json({ ok: true, status: "completed" }, { status: 202 }), Response.json({ ok: false, status: "completed" })]) {
			expect(await postSignup(buildPayload(input), "/api/lab/signup", async () => response)).toMatchObject({ ok: false });
		}
	});
});

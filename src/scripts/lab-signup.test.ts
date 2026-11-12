import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	buildPayload,
	postSignup,
	SIGNUP_MEMBER_URL,
	SIGNUP_SUCCESS_URL,
	SIGNUP_WEBHOOK_URL,
	validateSignup,
} from "../lib/lab-signup";

const component = (name: string) => readFileSync(fileURLToPath(new URL(`../components/${name}.astro`, import.meta.url)), "utf8");
const script = readFileSync(fileURLToPath(new URL("./lab-signup.ts", import.meta.url)), "utf8");

const validInput = {
	nome: "Douglas Gaspar Filho",
	whatsapp: "(22) 99259-1418",
	email: "Douglas@Example.com",
	aceitouTermos: true,
};

describe("lib do cadastro do LAB", () => {
	it("divide o nome em first_name e last_name", () => {
		expect(buildPayload(validInput)).toMatchObject({
			first_name: "Douglas",
			last_name: "Gaspar Filho",
			nome: "Douglas Gaspar Filho",
			email: "douglas@example.com",
			user_login: "douglas",
			aceite_termos: true,
		});
	});

	it("cobre nome de uma palavra só e login derivado do e-mail", () => {
		const payload = buildPayload({ ...validInput, nome: "Marco" });
		expect(payload.first_name).toBe("Marco");
		expect(payload.last_name).toBe("");
		expect(payload.user_login).toBe("douglas");
	});

	it("nunca coleta nem envia senha nenhuma no payload", () => {
		const serialized = JSON.stringify(buildPayload(validInput)).toLowerCase();
		expect(serialized).not.toContain("password");
		expect(serialized).not.toContain("senha");
	});

	it("valida os campos do formulário em pt-BR", () => {
		expect(validateSignup(validInput)).toBeNull();
		expect(validateSignup({ ...validInput, nome: "A" })).toContain("nome");
		expect(validateSignup({ ...validInput, whatsapp: "123" })).toContain("WhatsApp");
		expect(validateSignup({ ...validInput, email: "sem-arroba.com" })).toContain("e-mail");
		expect(validateSignup({ ...validInput, aceitouTermos: false })).toContain("termos");
	});
});

describe("envio do formulário ao webhook de criação de conta", () => {
	beforeEach(() => {
		vi.unstubAllGlobals();
	});

	it("POST JSON com keepalive e reporta sucesso", async () => {
		const fetchMock = vi.fn(async () => Response.json({ ok: true, status: "completed" }));
		const result = await postSignup(buildPayload(validInput), "https://webhook.douglasgaspar.com/webhook/criar-conta", fetchMock as unknown as typeof fetch);
		expect(result.ok).toBe(true);
		const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
		expect(url).toBe("https://webhook.douglasgaspar.com/webhook/criar-conta");
		expect(init.method).toBe("POST");
		expect(init.keepalive).toBe(true);
		expect((init.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
		expect(String(init.body)).toContain('"email"');
	});

	it("falha em silêncio quando a rede derruba a requisição", async () => {
		const fetchMock = vi.fn(async () => { throw new Error("offline"); });
		const result = await postSignup(buildPayload(validInput), "https://invalid.local", fetchMock as unknown as typeof fetch);
		expect(result).toEqual({ ok: false, status: 0 });
	});
});

describe("modal de cadastro nos componentes do LAB", () => {
	it("exibe os campos Nome, WhatsApp, Email, aceite de termos e cadastra — sem campo de senha", () => {
		const modal = component("LabSignupModal");
		for (const item of ["Nome", "WhatsApp", "Email", "Cadastrar", "Aceito os termos de uso"]) {
			expect(modal).toContain(item);
		}
		expect(modal).toContain('name="aceite_termos" required');
		expect(modal).not.toContain('type="password"');
	});

	it("deixa o link Já sou membro logo abaixo do Cadastrar, indo ao portal", () => {
		const modal = component("LabSignupModal");
		expect(SIGNUP_MEMBER_URL).toBe("https://lab.douglasgaspar.com/?fcom_action=auth");
		expect(modal.indexOf("data-lab-signup-submit")).toBeGreaterThan(-1);
		expect(modal.indexOf('class="lab-signup-member"')).toBeGreaterThan(modal.indexOf("data-lab-signup-submit"));
		expect(modal).toContain('href={SIGNUP_MEMBER_URL}>Já sou membro.');
	});

	it("envia o cadastro diretamente para o webhook de criação de conta por formulário", () => {
		const modal = component("LabSignupModal");
		expect(SIGNUP_WEBHOOK_URL).toBe("https://webhook.douglasgaspar.com/webhook/criar-conta");
		expect(modal).toContain('action={SIGNUP_WEBHOOK_URL}');
		expect(modal).toContain('method="POST"');
		expect(modal).not.toContain('data-success-url');
		expect(script).toContain("HTMLFormElement.prototype.submit.call(form)");
		expect(script).not.toContain("postSignup");
	});

	it("dispara de ambos os CTAs de cadastro gratuito mantendo o fallback do portal", () => {
		expect(component("LabPlans")).toContain("action: \"Começar grátis\"");
		expect(component("LabPlans")).toContain('data-lab-signup-open={plan.modal === "signup" ? "" : undefined}');
		expect(component("LabHero")).toContain("data-lab-signup-open");
		expect(component("LabHero")).toContain("https://lab.douglasgaspar.com/?fcom_action=auth&form=register");
		expect(readFileSync(fileURLToPath(new URL("../pages/lab/index.astro", import.meta.url)), "utf8")).toContain("<LabSignupModal");
	});
});

describe("primeiro acesso", () => {
	it("mantém a orientação de definir senha no portal e o destino externo confirmado", () => {
		expect(component("LabSignupModal")).toContain("Perdeu a senha");
		expect(SIGNUP_SUCCESS_URL).toBe("https://lab.douglasgaspar.com/space/geral-sk/page/primeiros-passos");
	});
});

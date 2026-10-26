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
const welcome = readFileSync(fileURLToPath(new URL("../pages/lab/bem-vindo.astro", import.meta.url)), "utf8");

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
			email: "Douglas@Example.com",
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

describe("envio do formulário ao webhook do n8n", () => {
	beforeEach(() => {
		vi.unstubAllGlobals();
	});

	it("POST JSON com keepalive e reporta sucesso", async () => {
		const fetchMock = vi.fn(async () => new Response(null, { status: 200 }));
		const result = await postSignup(buildPayload(validInput), "https://acre.apps.n8nitro.com/webhook/new-user", fetchMock as unknown as typeof fetch);
		expect(result.ok).toBe(true);
		const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
		expect(url).toBe("https://acre.apps.n8nitro.com/webhook/new-user");
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

	it("envia ao webhook do fluxo e redireciona para /lab/bem-vindo/", () => {
		const modal = component("LabSignupModal");
		expect(SIGNUP_WEBHOOK_URL).toBe("https://acre.apps.n8nitro.com/webhook/new-user");
		expect(SIGNUP_SUCCESS_URL).toBe("https://douglasgaspar.com/lab/bem-vindo/");
		expect(modal).toContain('data-webhook-url={SIGNUP_WEBHOOK_URL}');
		expect(modal).toContain('data-success-url={SIGNUP_SUCCESS_URL}');
		expect(script).toContain("window.location.assign(successUrl)");
	});

	it("monta o payload sem senha e não embute segredo no componente", () => {
		expect(script).toContain("buildPayload(input)");
		expect(component("LabSignupModal")).not.toContain("8blDlhhnEOrhSaBLgsGFvU61BqGZiOEuu9ClMsDp5+s=");
	});

	it("dispara de ambos os CTAs de cadastro gratuito mantendo o fallback do portal", () => {
		expect(component("LabPlans")).toContain("action: \"Começar grátis\"");
		expect(component("LabPlans")).toContain('data-lab-signup-open={plan.modal === "signup" ? "" : undefined}');
		expect(component("LabHero")).toContain("data-lab-signup-open");
		expect(component("LabHero")).toContain("https://lab.douglasgaspar.com/?fcom_action=auth&form=register");
		expect(readFileSync(fileURLToPath(new URL("../pages/lab/index.astro", import.meta.url)), "utf8")).toContain("<LabSignupModal");
	});
});

describe("página de boas-vindas", () => {
	it("existe na rota anunciada, orienta o primeiro acesso e mantém a identidade do LAB", () => {
		expect(welcome).toContain('canonical="https://douglasgaspar.com/lab/bem-vindo/"');
		expect(welcome).toContain("Bem-vindo <em>ao LAB.</em>");
		expect(welcome).toContain('href={SIGNUP_MEMBER_URL}');
		expect(welcome).toContain("Perdeu a senha");
	});
});

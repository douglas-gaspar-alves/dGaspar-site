// Contratos do pop-up de assinatura Cakto no plano Empreendedor (SPEC-0003,
// specs/defined/0003-popup-checkout-cakto-empreendedor). Testes TDD derivados
// do Gherkin da seção 6 da spec: cada caso carrega o marcador SPECSFY do AC de
// origem. A lib é importada por demanda e os componentes são lidos como fonte,
// no padrão de contrato textual de lab-page.test.ts e lab-signup.test.ts.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

type LabCheckout = typeof import("../lib/lab-checkout");

const readSource = (relative: string) =>
	readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");
const component = (name: string) => readSource(`../components/${name}.astro`);
const libSource = () => readSource("../lib/lab-checkout.ts");
const checkoutScript = () => readSource("./lab-checkout.ts");
const checkoutPage = () => readSource("../pages/lab/index.astro");
const checkoutLib = (): Promise<LabCheckout> => import("../lib/lab-checkout");

/** Recorta o bloco de um plano dentro da lista de planos de LabPlans.astro. */
const planBlock = (source: string, start: string, end: string) =>
	source.slice(source.indexOf(start), source.indexOf(end));

const MONTHLY = "https://pay.cakto.com.br/mtya7hj_1232361";
const ANNUAL = "https://pay.cakto.com.br/e98y5m2_1232361";

const happyInput = {
	nome: "Douglas Gaspar Filho",
	email: "Douglas@Example.com",
	telefone: "",
};

describe("lib do pop-up de assinatura do LAB", () => {
	// SPECSFY: US-001 FR-001 FR-002 FR-003 NFR-001 NFR-002 AC-001
	it("monta a URL mensal com name e email codificados quando nome e e-mail são válidos", async () => {
		const { CHECKOUT_MONTHLY_URL, isCheckoutReady, buildCheckoutUrl } = await checkoutLib();
		expect(CHECKOUT_MONTHLY_URL).toBe(MONTHLY);
		expect(isCheckoutReady(happyInput)).toBe(true);
		expect(buildCheckoutUrl(CHECKOUT_MONTHLY_URL, happyInput)).toBe(
			`${MONTHLY}?name=Douglas%20Gaspar%20Filho&email=Douglas%40Example.com`,
		);
		// trim nas bordas antes de codificar (caracteres especiais seguros por valor)
		expect(
			buildCheckoutUrl(MONTHLY, { ...happyInput, nome: "  Douglas Gaspar Filho  " }),
		).toBe(`${MONTHLY}?name=Douglas%20Gaspar%20Filho&email=Douglas%40Example.com`);
	});

	// SPECSFY: US-001 FR-002 FR-003 NFR-001 AC-002
	it("bloqueia as duas assinaturas com nome curto ou e-mail vazio", async () => {
		const { validateCheckoutInput, isCheckoutReady } = await checkoutLib();
		const validEmail = "douglas@example.com";
		expect(isCheckoutReady({ nome: "Ab", email: validEmail, telefone: "" })).toBe(false);
		expect(validateCheckoutInput({ nome: "Ab", email: validEmail, telefone: "" })).toContain("nome");
		expect(isCheckoutReady({ nome: "   ", email: validEmail, telefone: "" })).toBe(false);
		expect(isCheckoutReady({ nome: "Douglas Gaspar Filho", email: "", telefone: "" })).toBe(false);
		expect(
			validateCheckoutInput({ nome: "Douglas Gaspar Filho", email: "", telefone: "" }),
		).toContain("e-mail");
	});

	// SPECSFY: US-001 FR-004 NFR-002 AC-003
	it("telefone vazio não gera parâmetro phone", async () => {
		const { CHECKOUT_MONTHLY_URL, buildCheckoutUrl } = await checkoutLib();
		const url = buildCheckoutUrl(CHECKOUT_MONTHLY_URL, happyInput);
		expect(url).not.toContain("phone=");
		expect(url).toBe(`${MONTHLY}?name=Douglas%20Gaspar%20Filho&email=Douglas%40Example.com`);
	});

	// SPECSFY: US-001 FR-002 FR-003 NFR-001 AC-005
	it("e-mail sem formato válido bloqueia sem requisição de rede", async () => {
		const { validateCheckoutInput, isCheckoutReady } = await checkoutLib();
		const invalid = { nome: "Douglas Gaspar Filho", email: "sem-arroba.com", telefone: "" };
		expect(isCheckoutReady(invalid)).toBe(false);
		expect(validateCheckoutInput(invalid)).toContain("e-mail");
		// validação é client-side e silenciosa: a lib não faz I/O (NFR-001)
		expect(libSource()).not.toContain("fetch");
	});

	// SPECSFY: US-001 FR-003 FR-004 NFR-002 AC-006
	it("telefone preenchido vai normalizado em dígitos na URL anual mantendo name e email", async () => {
		const { CHECKOUT_ANNUAL_URL, buildCheckoutUrl } = await checkoutLib();
		expect(CHECKOUT_ANNUAL_URL).toBe(ANNUAL);
		// normalização de 2026-10-23: qualquer máscara digitada chega em dígitos (AC-006)
		expect(
			buildCheckoutUrl(CHECKOUT_ANNUAL_URL, {
				...happyInput,
				telefone: "(22) 99925-9141",
			}),
		).toBe(
			`${ANNUAL}?name=Douglas%20Gaspar%20Filho&email=Douglas%40Example.com&phone=22999259141`,
		);
	});

	// SPECSFY: US-001 FR-003 FR-004 NFR-001 NFR-002 AC-006 AC-011
	it("normaliza o telefone e limita o checkout ao único plano pago vigente", async () => {
		const {
			CHECKOUT_MONTHLY_URL,
			CHECKOUT_LINKS,
			normalizePhoneForCheckout,
			buildCheckoutUrl,
		} = await checkoutLib();
		expect(Object.keys(CHECKOUT_LINKS)).toEqual(["empreendedor"]);
		// normalização (AC-006): máscara, +55/país e valor já em dígitos
		expect(normalizePhoneForCheckout("(22) 99925-9141")).toBe("22999259141");
		expect(normalizePhoneForCheckout("+55 22 99925-9141")).toBe("5522999259141");
		expect(normalizePhoneForCheckout("22999259141")).toBe("22999259141");
		// O envio mantém a normalização no Empreendedor.
		expect(buildCheckoutUrl(CHECKOUT_MONTHLY_URL, { ...happyInput, telefone: "(22) 99925-9141" })).toBe(
			`${MONTHLY}?name=Douglas%20Gaspar%20Filho&email=Douglas%40Example.com&phone=22999259141`,
		);
	});


});

describe("pop-up de assinatura nos componentes do LAB", () => {
	// SPECSFY: US-001 US-002 FR-001 FR-005 NFR-003 AC-004
	it("gatilho do Empreendedor abre o pop-up que fecha por ×, fundo ou Esc", () => {
		const plans = component("LabPlans");
		const modal = component("LabCheckoutModal");
		const script = checkoutScript();
		// gatilho só no plano com modal de checkout, carregando o plano que abre o diálogo
		expect(plans).toContain('data-lab-checkout-open={plan.modal === "checkout" ? plan.key : undefined}');
		// abertura e fechamento por ×, fundo; Esc é o fechamento nativo do <dialog>
		expect(script).toContain("[data-lab-checkout-open]");
		expect(script).toContain("showModal()");
		expect(script).toContain('data-lab-checkout-close');
		expect(script).toContain("if (event.target === dialog) dialog.close()");
		expect(modal).toContain("data-lab-checkout-modal");
		expect(modal).toContain("data-lab-checkout-close");
	});

	// SPECSFY: US-001 US-002 FR-001 FR-003 FR-005 NFR-003 AC-004 AC-010 AC-011
	it("só o Empreendedor abre checkout e PRO Plus não tem gatilho", () => {
		const plans = component("LabPlans");
		expect(plans).not.toContain('name: "IA Coder"');
		expect(plans).not.toContain("CHECKOUT_CODER");
		expect(plans).not.toContain('name: "PRO Plus"');
		expect(plans.match(/modal: "(signup|checkout)"/g) ?? []).toEqual([
			'modal: "signup"',
			'modal: "checkout"',
		]);
	});

	// SPECSFY: US-001 FR-002 FR-004 AC-007
	it("componente exibe rótulo opcional do telefone, dois botões bloqueados e nenhuma mensagem de erro", () => {
		const modal = component("LabCheckoutModal");
		for (const label of ["Nome completo", "Email", "Telefone (opcional)"]) {
			expect(modal).toContain(label);
		}
		expect(modal).toContain('autocomplete="name"');
		expect(modal).toContain('autocomplete="email"');
		expect(modal).toContain('autocomplete="tel"');
		expect(modal).toContain('from "../lib/lab-checkout"');
		// os dois destinos ficam nos <a>, vindos do registro por plano da lib (Ato I)
		expect(modal).toContain('href={links.mensal}');
		expect(modal).toContain('href={links.anual}');
		expect(modal).toContain("Assinatura mensal");
		expect(modal).toContain("Assinatura anual");
		// bloqueio inicial comunicável e sem elemento de status de erro
		expect(modal.split('aria-disabled="true"').length - 1).toBeGreaterThanOrEqual(2);
		expect(modal).not.toContain("data-lab-checkout-status");
	});

	// SPECSFY: US-001 FR-001 FR-003 AC-010 AC-011
	it("componente instancia destinos por plano e o script casa gatilho com diálogo do plano", () => {
		const modal = component("LabCheckoutModal");
		const script = checkoutScript();
		const page = checkoutPage();
		// o diálogo carrega o plano; os dois <a> recebem os links do plano que o abriu
		expect(modal).toContain("data-lab-checkout-modal={plan}");
		expect(modal).toContain("href={links.mensal}");
		expect(modal).toContain("href={links.anual}");
		// A página monta o diálogo do Empreendedor e o cadastro gratuito.
		expect(page).toContain('<LabCheckoutModal plan="empreendedor" />');
		expect(page).not.toContain('plan="ia-coder"');
		expect(page).not.toContain('plan="pro-plus"');
		// o script casa o gatilho com o diálogo do mesmo plano
		expect(script).toContain("[data-lab-checkout-modal]");
		expect(script).toContain("dialog.dataset.labCheckoutModal");
	});

	// SPECSFY: US-001 FR-004 AC-012
	it("o script aplica a máscara digitável no telefone de cada diálogo", () => {
		const script = checkoutScript();
		// formatação dígito a dígito, nunca bloqueando a digitação (FR-004)
		expect(script).toContain("formatTelefone");
		expect(script).toContain('replace(/\\D/g, "")');
	});

	// SPECSFY: US-002 FR-005 NFR-003 AC-008
	it("gatilhos gratuitos do card e da hero abrem o modal de cadastro", () => {
		const plans = component("LabPlans");
		const hero = component("LabHero");
		// literal exigida por lab-signup.test.ts depois desta fatia
		expect(plans).toContain('data-lab-signup-open={plan.modal === "signup" ? "" : undefined}');
		const curioso = planBlock(plans, 'name: "Curioso"', 'name: "Empreendedor"');
		expect(curioso).toContain('modal: "signup"');
		expect(curioso).toContain("href: registerUrl");
		// a hero mantém o destino real do cadastro gratuito
		const heroCta = hero
			.split("\n")
			.find((line) => line.includes("Criar conta gratuita")) ?? "";
		expect(heroCta).toContain("data-lab-signup-open");
		expect(heroCta).toContain("href={registerUrl}");
	});

	// SPECSFY: US-001 US-002 FR-005 NFR-003 AC-009 AC-010 AC-011
	it("gatilhos pagos mantêm href mensal real como fallback por plano", () => {
		const plans = component("LabPlans");
		const page = checkoutPage();
		expect(planBlock(plans, 'name: "Empreendedor"', "];")).toContain(
			"href: CHECKOUT_MONTHLY_URL",
		);
		expect(plans).not.toContain("CHECKOUT_CODER");
		expect(plans).not.toContain("CHECKOUT_PLUS");
		expect(plans).toContain("CHECKOUT_MONTHLY_URL");
		// o CTA continua <a> com href real e a página monta os pop-ups
		expect(plans).toContain("href={plan.href}");
		expect(page).toContain("<LabCheckoutModal");
	});
});

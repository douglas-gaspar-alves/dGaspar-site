// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const valid = { nome: "Pessoa Teste", telefone: "22987654321", email: "test@example.com" };

beforeEach(async () => {
	vi.resetModules();
	document.body.innerHTML = `<dialog data-lab-signup-modal><form data-lab-signup-form action="https://webhook.douglasgaspar.com/webhook/criar-conta-lab-free" method="POST"><input name="nome"><input name="email"><input name="telefone"><input type="checkbox" name="aceite_termos"><p data-lab-signup-status tabindex="-1" hidden></p><button data-lab-signup-submit>Cadastrar</button></form></dialog>`;
	window.umami = { track: vi.fn() };
	document.querySelector("dialog")?.setAttribute("open", "");
	await import("./lab-signup");
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); delete window.umami; document.body.innerHTML = ""; });
const form = () => document.querySelector("form")!;
const fill = () => {
	for (const [name, value] of Object.entries(valid)) (form().querySelector(`[name="${name}"]`) as HTMLInputElement).value = value;
	(form().querySelector('[name="aceite_termos"]') as HTMLInputElement).checked = true;
};
const submit = () => form().dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

describe("comportamento do formulário gratuito", () => {
	it("marca campo inválido, anuncia erro e não chama destino", () => {
		const mock = vi.fn(); vi.stubGlobal("fetch", mock);
		submit();
		expect(mock).not.toHaveBeenCalled();
		expect(document.querySelector('[name="nome"]')?.getAttribute("aria-invalid")).toBe("true");
		expect(document.activeElement).toBe(document.querySelector("[data-lab-signup-status]"));
	});
	it("envia os campos ao webhook por POST nativo e bloqueia submissão duplicada", () => {
		const nativeSubmit = vi.spyOn(HTMLFormElement.prototype, "submit").mockImplementation(() => {});
		fill(); submit(); submit();
		expect(nativeSubmit).toHaveBeenCalledTimes(1);
		expect(form().method).toBe("post");
		expect(form().action).toContain("webhook.douglasgaspar.com/webhook/criar-conta");
		const data = new FormData(form());
		expect(data.get("nome")).toBe(valid.nome);
		expect(data.get("telefone")).toBe(valid.telefone);
		expect(data.get("email")).toBe(valid.email);
		expect(document.querySelector("button")?.disabled).toBe(true);
		expect(window.umami?.track).not.toHaveBeenCalledWith("lab_signup_complete", expect.anything());
	});
	it("preserva os dados e permite tentar novamente se o envio não iniciar", () => {
		vi.spyOn(HTMLFormElement.prototype, "submit").mockImplementation(() => { throw new Error("blocked"); });
		fill(); submit();
		expect(document.querySelector("[data-lab-signup-status]")?.textContent).toContain("Não conseguimos");
		expect(document.querySelector("button")?.disabled).toBe(false);
		expect((document.querySelector('[name="email"]') as HTMLInputElement).value).toBe(valid.email);
	});
});

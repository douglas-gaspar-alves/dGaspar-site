// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const valid = { nome: "Pessoa Teste", whatsapp: "22987654321", email: "test@example.com" };

beforeEach(async () => {
	vi.resetModules();
	document.body.innerHTML = `<dialog data-lab-signup-modal><form data-lab-signup-form data-webhook-url="/api/lab/signup" data-success-url="https://lab.douglasgaspar.com/space/geral-sk/page/primeiros-passos"><input name="nome"><input name="email"><input name="whatsapp"><input type="checkbox" name="aceite_termos"><p data-lab-signup-status tabindex="-1" hidden></p><button data-lab-signup-submit>Cadastrar</button></form></dialog>`;
	window.umami = { track: vi.fn() };
	document.querySelector("dialog")?.setAttribute("open", "");
	await import("./lab-signup");
});
afterEach(() => { vi.unstubAllGlobals(); delete window.umami; document.body.innerHTML = ""; });
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
	it("bloqueia dois submits simultâneos e preserva os campos após falha", async () => {
		let release!: (r: Response) => void;
		const mock = vi.fn(() => new Promise<Response>(resolve => { release = resolve; }));
		vi.stubGlobal("fetch", mock); fill(); submit(); submit();
		expect(mock).toHaveBeenCalledTimes(1);
		expect(form().getAttribute("aria-busy")).toBe("true");
		expect(document.querySelector("button")?.disabled).toBe(true);
		release(Response.json({ ok: false }, { status: 502 }));
		await vi.waitFor(() => expect(document.querySelector("button")?.disabled).toBe(false));
		expect((document.querySelector('[name="email"]') as HTMLInputElement).value).toBe(valid.email);
		expect(form().hasAttribute("aria-busy")).toBe(false);
		expect(window.umami?.track).not.toHaveBeenCalledWith("lab_signup_complete", expect.anything());
	});
	it("HTTP 200 recebido não redireciona nem mede conversão", async () => {
		vi.stubGlobal("fetch", vi.fn(async () => Response.json({ message: "Workflow got started." })));
		fill(); submit();
		await vi.waitFor(() => expect(document.querySelector("[data-lab-signup-status]")?.textContent).toContain("Não conseguimos"));
		expect(window.umami?.track).toHaveBeenCalledWith("lab_signup_error", { form: "lab_free", plan: "curioso", category: "integration" });
		expect(window.umami?.track).not.toHaveBeenCalledWith("lab_signup_complete", expect.anything());
	});
});

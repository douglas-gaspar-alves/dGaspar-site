// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { trackSignup } from "./lab-signup-analytics";

afterEach(() => { delete window.umami; vi.useRealTimers(); });
describe("eventos do cadastro sem dados pessoais", () => {
	it("só transmite propriedades controladas", async () => {
		const track = vi.fn(); window.umami = { track };
		await trackSignup("lab_signup_error", "integration");
		expect(track).toHaveBeenCalledWith("lab_signup_error", { form: "lab_free", plan: "curioso", category: "integration" });
	});
	it("falha e ausência de tracker não interrompem cadastro", async () => {
		await expect(trackSignup("lab_signup_complete")).resolves.toBeUndefined();
		window.umami = { track: () => { throw new Error("blocked"); } };
		await expect(trackSignup("lab_signup_complete")).resolves.toBeUndefined();
	});
	it("tracker pendurado tem espera limitada", async () => {
		vi.useFakeTimers();
		window.umami = { track: () => new Promise(() => {}) };
		const tracking = trackSignup("lab_signup_complete");
		await vi.advanceTimersByTimeAsync(250);
		await expect(tracking).resolves.toBeUndefined();
	});
});

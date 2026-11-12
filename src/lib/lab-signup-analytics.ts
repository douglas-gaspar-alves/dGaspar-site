type SignupEvent = "lab_signup_open" | "lab_signup_submit" | "lab_signup_validation_error" | "lab_signup_complete" | "lab_signup_error";
type ErrorCategory = "validation" | "network" | "integration";

declare global {
	interface Window {
		umami?: { track: (event: string, data: Record<string, string>) => unknown };
	}
}

/** Somente valores controlados; nunca recebe payload ou mensagem da API. */
export async function trackSignup(event: SignupEvent, category?: ErrorCategory): Promise<void> {
	if (typeof window === "undefined" || !window.umami) return;
	let timer: ReturnType<typeof setTimeout> | undefined;
	try {
		await Promise.race([
			Promise.resolve(window.umami.track(event, { form: "lab_free", plan: "curioso", ...(category ? { category } : {}) })),
			new Promise<void>((resolve) => { timer = setTimeout(resolve, 250); }),
		]);
	} catch {
		// Bloqueador de rastreio ou falha no analytics não impede cadastro.
	} finally {
		if (timer) clearTimeout(timer);
	}
}

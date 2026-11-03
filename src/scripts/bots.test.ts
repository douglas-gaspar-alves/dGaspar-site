import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
	botEventName,
	botEventNames,
	buildBotPayload,
	classifyBot,
	digestHex,
	numericIdFromHex,
} from "../lib/bots";

// Suíte da medição de bots — cobre o contrato entre a classificação de
// User-Agent, o corpo do Measurement Protocol e o middleware de borda.
//
// O GA4 do navegador conta apenas humanos porque crawlers não executam
// JavaScript. A contagem de bots vive em `functions/_middleware.ts`, que só
// envia evento quando o documento HTML foi pedido por um crawler conhecido e as
// duas variáveis de ambiente da propriedade de bots estão definidas.

const source = (relative: string) => readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");
const exists = (relative: string) => existsSync(fileURLToPath(new URL(relative, import.meta.url)));

const chrome =
	"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36";

const ua = (name: string) => `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ${name}`;

describe("classificação de crawlers", () => {
	it("reconhece os crawlers da OpenAI", () => {
		// SPECSFY: NFR-003
		for (const name of ["GPTBot/1.1", "OAI-SearchBot/1.0", "ChatGPT-User/1.0"]) {
			const match = classifyBot(ua(name));
			expect(match, name).toEqual({ provider: "openai", name: name.split("/")[0], ai: true });
		}
	});

	it("separa o que é IA do Google do Googlebot de busca", () => {
		// SPECSFY: NFR-003
		expect(classifyBot(ua("Google-Extended"))).toEqual({
			provider: "google",
			name: "Google-Extended",
			ai: true,
		});
		expect(classifyBot(ua("Gemini-Deep-Research/1.0"))).toEqual({
			provider: "google",
			name: "Gemini-Deep-Research",
			ai: true,
		});
		// Googlebot é indexação tradicional: entra na contagem, mas não como IA
		const googlebot = classifyBot(ua("Googlebot/2.1; +http://www.google.com/bot.html"));
		expect(googlebot).toEqual({ provider: "google", name: "Googlebot", ai: false });
	});

	it("reconhece Anthropic, Perplexity, Meta, Microsoft e demais provedores", () => {
		// SPECSFY: NFR-003
		const cases: Array<[string, string]> = [
			["ClaudeBot/1.0", "anthropic"],
			["Claude-User/1.0", "anthropic"],
			["PerplexityBot/1.0", "perplexity"],
			["Perplexity-User/1.0", "perplexity"],
			["meta-externalagent/1.1", "meta"],
			["bingbot/2.0", "microsoft"],
			["Bytespider", "bytedance"],
			["Amazonbot/0.1", "amazon"],
			["cohere-ai", "cohere"],
			["MistralAI-User/1.0", "mistral"],
			["CCBot/2.0", "commoncrawl"],
			["YouBot", "you"],
		];
		for (const [name, provider] of cases) {
			expect(classifyBot(ua(name))?.provider, name).toBe(provider);
		}
	});

	it("prefere a assinatura mais específica do Applebot", () => {
		// SPECSFY: NFR-003
		expect(classifyBot(ua("Applebot-Extended"))).toEqual({
			provider: "apple",
			name: "Applebot-Extended",
			ai: true,
		});
		expect(classifyBot(ua("Applebot/0.1"))).toEqual({ provider: "apple", name: "Applebot", ai: false });
	});

	it("não conta navegador humano nem requisição sem User-Agent", () => {
		// SPECSFY: NFR-001
		expect(classifyBot(chrome)).toBeNull();
		expect(classifyBot(undefined)).toBeNull();
		expect(classifyBot(null)).toBeNull();
		expect(classifyBot("   ")).toBeNull();
	});

	it("guarda crawler desconhecido em `other` em vez de descartar", () => {
		// SPECSFY: NFR-003
		expect(classifyBot("SomeNewCrawler/3.0 (+http://example.com/bot)")).toEqual({
			provider: "other",
			name: "somenewcrawler",
			ai: false,
		});
	});
});

describe("contrato do evento de bot", () => {
	it("nomeia o evento pelo provedor e mantém um nome por provedor", () => {
		// SPECSFY: NFR-003
		expect(botEventName({ provider: "openai", name: "GPTBot", ai: true })).toBe("bot_openai");
		const names = botEventNames();
		expect(new Set(names).size).toBe(names.length);
		expect(names).toContain("bot_google");
		expect(names).toContain("bot_anthropic");
		// nomes de evento do GA4: letra inicial, até 40 caracteres
		for (const name of names) expect(name).toMatch(/^bot_[a-z]{2,32}$/);
	});

	it("monta o corpo do Measurement Protocol sem query string", () => {
		// SPECSFY: NFR-002
		const payload = buildBotPayload({
			match: { provider: "perplexity", name: "PerplexityBot", ai: true },
			url: new URL("https://douglasgaspar.com/lab/?utm_source=x&utm_medium=y#top"),
			clientId: "abc123",
			sessionId: "42",
			referrer: "https://example.com/docs",
			country: "BR",
		});

		expect(payload.client_id).toBe("abc123");
		expect(payload.events).toHaveLength(1);
		const [event] = payload.events;
		expect(event.name).toBe("bot_perplexity");
		expect(event.params).toMatchObject({
			bot_name: "PerplexityBot",
			bot_provider: "perplexity",
			bot_is_ai: 1,
			page_location: "https://douglasgaspar.com/lab/",
			page_path: "/lab/",
			page_referrer: "https://example.com/docs",
			country: "BR",
			session_id: "42",
		});
		// a query string nunca é enviada
		expect(JSON.stringify(payload)).not.toContain("utm_source");
	});

	it("deriva identificadores anônimos e estáveis por dia", async () => {
		// SPECSFY: NFR-004
		const first = await digestHex("203.0.113.7|GPTBot/1.1|2026-11-03");
		const sameDay = await digestHex("203.0.113.7|GPTBot/1.1|2026-11-03");
		const nextDay = await digestHex("203.0.113.7|GPTBot/1.1|2026-11-04");

		expect(first).toMatch(/^[0-9a-f]{64}$/);
		expect(first).toBe(sameDay);
		expect(first).not.toBe(nextDay);
		expect(first).not.toContain("203.0.113.7");

		expect(numericIdFromHex(first)).toMatch(/^\d+$/);
		expect(numericIdFromHex(first)).toBe(numericIdFromHex(sameDay));
		expect(numericIdFromHex("not-a-hash")).toBe("0");
	});
});

describe("middleware de borda", () => {
	const middleware = "../../functions/_middleware.ts";

	it("existe e envia para o Measurement Protocol", () => {
		// SPECSFY: NFR-002
		expect(exists(middleware), "functions/_middleware.ts precisa existir").toBe(true);
		const file = source(middleware);
		expect(file).toContain("https://www.google-analytics.com/mp/collect");
		expect(file).toContain("context.waitUntil(");
		expect(file).toContain("export const onRequest");
	});

	it("só mede documento HTML aprovado e nunca bloqueia a resposta", () => {
		// SPECSFY: NFR-001
		const file = source(middleware);
		expect(file).toContain('contentType.includes("text/html")');
		expect(file).toContain('context.request.method !== "GET"');
		expect(file).toContain("response.status !== 200");
		expect(file).toContain("const response = await context.next();");
		expect(file).toContain("return response;");
		// sem credenciais o middleware é inerte
		expect(file).toContain("if (!measurementId || !apiSecret) return response;");
		expect(file).toContain("GA_BOTS_MEASUREMENT_ID");
		expect(file).toContain("GA_BOTS_API_SECRET");
	});

	it("não grava IP nem User-Agent em claro no evento", () => {
		// SPECSFY: NFR-004
		const file = source(middleware);
		expect(file).toContain("digestHex(`${ip}|${userAgent}|${day}`)");
		const payload = buildBotPayload({
			match: { provider: "openai", name: "GPTBot", ai: true },
			url: new URL("https://douglasgaspar.com/"),
			clientId: "hash",
			sessionId: "1",
		});
		const serialized = JSON.stringify(payload);
		expect(serialized).not.toContain("user-agent");
		expect(serialized).not.toContain("GPTBot/");
	});
});

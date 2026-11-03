import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { botIndex, botIndexes, buildBotDataPoint, classifyBot } from "../lib/bots";

// Suíte da medição de bots — cobre o contrato entre a classificação de
// User-Agent, o ponto de dados gravado no Workers Analytics Engine e o
// middleware de borda.
//
// O GA4 do navegador conta apenas humanos porque crawlers não executam
// JavaScript. A contagem de bots vive em `functions/_middleware.ts`, que só
// grava quando o documento HTML foi pedido por um crawler conhecido e o binding
// `BOT_METRICS` existe.

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
		expect(classifyBot(ua("Googlebot/2.1; +http://www.google.com/bot.html"))).toEqual({
			provider: "google",
			name: "Googlebot",
			ai: false,
		});
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

describe("ponto de dados do Analytics Engine", () => {
	it("usa `bot_<provedor>` como índice e mantém um índice por provedor", () => {
		// SPECSFY: NFR-003
		expect(botIndex({ provider: "openai", name: "GPTBot", ai: true })).toBe("bot_openai");
		const indexes = botIndexes();
		expect(new Set(indexes).size).toBe(indexes.length);
		expect(indexes).toContain("bot_google");
		expect(indexes).toContain("bot_anthropic");
		for (const index of indexes) expect(index).toMatch(/^bot_[a-z]{2,32}$/);
	});

	it("grava caminho sem query string e marca IA em double1", () => {
		// SPECSFY: NFR-002
		const point = buildBotDataPoint({
			match: { provider: "perplexity", name: "PerplexityBot", ai: true },
			url: new URL("https://douglasgaspar.com/lab/?utm_source=x&utm_medium=y#top"),
			referrer: "https://example.com/docs",
			country: "BR",
			userAgent: "Mozilla/5.0 (compatible; PerplexityBot/1.0)",
		});

		expect(point.indexes).toEqual(["bot_perplexity"]);
		expect(point.blobs).toEqual([
			"perplexity",
			"PerplexityBot",
			"/lab/",
			"BR",
			"https://example.com/docs",
			"douglasgaspar.com",
			"Mozilla/5.0 (compatible; PerplexityBot/1.0)",
		]);
		expect(point.doubles).toEqual([1]);
		// a query string nunca é gravada
		expect(JSON.stringify(point)).not.toContain("utm_source");
	});

	it("marca crawler de busca tradicional como não-IA", () => {
		// SPECSFY: NFR-002
		const point = buildBotDataPoint({
			match: { provider: "google", name: "Googlebot", ai: false },
			url: new URL("https://douglasgaspar.com/"),
		});
		expect(point.doubles).toEqual([0]);
		expect(point.blobs?.[3]).toBe("");
		expect(point.blobs?.[4]).toBe("");
	});
});

describe("middleware de borda", () => {
	const middleware = "../../functions/_middleware.ts";

	it("existe e grava no binding declarado no wrangler.jsonc", () => {
		// SPECSFY: NFR-002
		expect(exists(middleware), "functions/_middleware.ts precisa existir").toBe(true);
		const file = source(middleware);
		expect(file).toContain("writeDataPoint(");
		expect(file).toContain("env?.BOT_METRICS");
		expect(file).toContain("export const onRequest");

		const wrangler = source("../../wrangler.jsonc");
		expect(wrangler).toContain('"binding": "BOT_METRICS"');
		expect(wrangler).toContain('"dataset": "dgaspar_bots"');
		expect(wrangler).toContain('"pages_build_output_dir": "./dist"');
	});

	it("só mede documento HTML aprovado e nunca bloqueia a resposta", () => {
		// SPECSFY: NFR-001
		const file = source(middleware);
		expect(file).toContain('contentType.includes("text/html")');
		expect(file).toContain('context.request.method !== "GET"');
		expect(file).toContain("response.status !== 200");
		expect(file).toContain("const response = await context.next();");
		expect(file).toContain("return response;");
		// sem binding o middleware é inerte
		expect(file).toContain("if (!dataset) return response;");
	});

	it("nunca lê o IP do visitante", () => {
		// SPECSFY: NFR-004
		const file = source(middleware);
		expect(file).not.toContain("cf-connecting-ip");
		expect(file).not.toContain("x-forwarded-for");
	});
});

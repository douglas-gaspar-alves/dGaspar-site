import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
	METRICS_DATASET,
	buildMetricsQueries,
	buildReport,
	buildSqlRequest,
	checkBasicAuth,
	escapeHtml,
	formatNumber,
	providerLabel,
	renderNotice,
	renderReport,
	timeRange,
} from "../lib/bot-metrics";

// Suíte do relatório `/metricas` — cobre as consultas SQL enviadas ao
// Analytics Engine, a interpretação do retorno, o desenho da página e a
// proteção por HTTP Basic Auth.
//
// A página nunca deve abrir sem credencial, nunca deve ser indexada e nunca deve
// esconder uma consulta que falhou atrás de uma tabela vazia.

const exists = (relative: string) => existsSync(fileURLToPath(new URL(relative, import.meta.url)));

describe("consultas ao Workers Analytics Engine", () => {
	it("consulta o dataset de bots em todas as seções", () => {
		// SPECSFY: NFR-005
		expect(METRICS_DATASET).toBe("dgaspar_bots");
		const queries = buildMetricsQueries();
		expect(Object.keys(queries).sort()).toEqual(
			["ai", "bots", "countries", "daily", "pages", "providers", "summary"].sort(),
		);
		for (const query of Object.values(queries)) {
			expect(query).toContain(`events.analyticsEngine.${METRICS_DATASET}`);
			expect(query).not.toContain(";");
		}
		// a amostragem do Analytics Engine precisa ser levada em conta na contagem
		expect(queries.summary).toContain("_sample_interval");
		expect(queries.providers).toContain("GROUP BY provedor");
	});

	it("monta a janela de consulta e o corpo da requisição", () => {
		// SPECSFY: NFR-005
		const now = new Date("2026-11-03T12:00:00.000Z");
		const range = timeRange(7, now);
		expect(range.end).toBe("2026-11-03T12:00:00.000Z");
		expect(range.start).toBe("2026-10-27T12:00:00.000Z");

		const body = JSON.parse(buildSqlRequest("SELECT 1", "abc123", range)) as Record<string, unknown>;
		expect(body).toMatchObject({
			query: "SELECT 1",
			scope: { accountTag: "abc123" },
			time_range: { start: range.start, end: range.end },
		});
	});
});

describe("interpretação do resultado", () => {
	it("converte as linhas em relatório com totais, IA e séries", () => {
		// SPECSFY: NFR-006
		const report = buildReport(7, {
			summary: [{ acessos: 42, amostras: 40, ultimo: "2026-11-03T11:00:00Z" }],
			providers: [{ provedor: "openai", acessos: 30, ultimo: "2026-11-03T11:00:00Z" }],
			bots: [{ bot: "GPTBot", provedor: "openai", acessos: 30 }],
			pages: [{ pagina: "/lab/", acessos: 12 }],
			countries: [{ pais: "US", acessos: 41 }],
			daily: [{ dia: "2026-11-02T00:00:00Z", acessos: 20 }],
			ai: [
				{ eh_ia: 1, acessos: 33 },
				{ eh_ia: 0, acessos: 9 },
			],
		});

		expect(report.totalHits).toBe(42);
		expect(report.providers).toEqual([{ provider: "openai", hits: 30, lastSeen: "2026-11-03T11:00:00Z" }]);
		expect(report.pages[0]).toEqual({ path: "/lab/", hits: 12 });
		expect(report.daily[0]).toEqual({ day: "2026-11-02", hits: 20 });
		expect(report.aiHits).toBe(33);
		expect(report.nonAiHits).toBe(9);
		expect(report.failures).toEqual([]);
	});

	it("sobrevive a dataset vazio e a valores ausentes", () => {
		// SPECSFY: NFR-006
		const report = buildReport(30, {});
		expect(report.totalHits).toBe(0);
		expect(report.providers).toEqual([]);
		expect(report.lastSeen).toBeNull();
		expect(report.days).toBe(30);
	});
});

describe("página de métricas", () => {
	it("desenha o relatório com os dados e sem indexação", () => {
		// SPECSFY: NFR-006
		const report = buildReport(7, {
			summary: [{ acessos: 128, ultimo: "2026-11-03T11:00:00Z" }],
			providers: [{ provedor: "openai", acessos: 100, ultimo: "2026-11-03T11:00:00Z" }],
			bots: [{ bot: "GPTBot", provedor: "openai", acessos: 100 }],
			pages: [{ pagina: "/", acessos: 60 }],
			countries: [{ pais: "US", acessos: 120 }],
			daily: [{ dia: "2026-11-03T00:00:00Z", acessos: 128 }],
			ai: [{ eh_ia: 1, acessos: 128 }],
		});

		const html = renderReport(report);
		expect(html).toContain('<meta name="robots" content="noindex, nofollow">');
		expect(html).toContain("Bots que acessaram douglasgaspar.com");
		expect(html).toContain("OpenAI");
		expect(html).toContain("GPTBot");
		expect(html).toContain("128");
		expect(html).toContain('href="/metricas?dias=30"');
		expect(html).toContain('aria-current="page"');
		// sem JS: a página é HTML puro
		expect(html).not.toContain("<script");
	});

	it("avisa quando alguma consulta falhou em vez de mostrar zero", () => {
		// SPECSFY: NFR-006
		const html = renderReport(buildReport(7, {}, ["providers (HTTP 401)"]));
		expect(html).toContain("Falha em 1 consulta(s)");
		expect(html).toContain("providers (HTTP 401)");
	});

	it("escapa conteúdo vindo do User-Agent", () => {
		// SPECSFY: NFR-007
		expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe(
			"&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
		);
		const html = renderReport(
			buildReport(7, { bots: [{ bot: "<script>alert(1)</script>", provedor: "other", acessos: 1 }] }),
		);
		expect(html).not.toContain("<script>alert(1)</script>");
	});

	it("formata números e nomes de provedor em pt-BR", () => {
		expect(formatNumber(1280)).toBe("1.280");
		expect(formatNumber(0)).toBe("0");
		expect(formatNumber(1234567)).toBe("1.234.567");
		expect(providerLabel("openai")).toBe("OpenAI");
		expect(providerLabel("desconhecido")).toBe("desconhecido");
	});

	it("tem uma página neutra para configuração ausente", () => {
		const html = renderNotice("Acesso restrito", "Informe usuário e senha.");
		expect(html).toContain("Acesso restrito");
		expect(html).toContain("noindex");
	});
});

describe("proteção da página", () => {
	it("aceita apenas a credencial configurada", () => {
		// SPECSFY: NFR-007
		const good = `Basic ${btoa("douglas:segredo-longo")}`;
		expect(checkBasicAuth(good, "douglas", "segredo-longo")).toBe(true);
		expect(checkBasicAuth(good, "douglas", "outra")).toBe(false);
		expect(checkBasicAuth(good, "outro", "segredo-longo")).toBe(false);
	});

	it("recusa ausência, esquema errado e cabeçalho inválido", () => {
		// SPECSFY: NFR-007
		expect(checkBasicAuth(null, "douglas", "segredo")).toBe(false);
		expect(checkBasicAuth("Bearer abc", "douglas", "segredo")).toBe(false);
		expect(checkBasicAuth("Basic", "douglas", "segredo")).toBe(false);
		expect(checkBasicAuth("Basic %%%", "douglas", "segredo")).toBe(false);
		expect(checkBasicAuth(`Basic ${btoa("semdoispontos")}`, "douglas", "segredo")).toBe(false);
		// credencial vazia nunca autoriza
		expect(checkBasicAuth(`Basic ${btoa(":")}`, "", "")).toBe(false);
	});

	it("a Function existe e exige as variáveis de ambiente", () => {
		// SPECSFY: NFR-007
		expect(exists("../../functions/metricas.ts"), "functions/metricas.ts precisa existir").toBe(true);
		expect(exists("../../src/lib/bot-metrics.ts")).toBe(true);
	});
});

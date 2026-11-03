// Relatório de bots de douglasgaspar.com.
//
// Os pontos de dados são gravados por `functions/_middleware.ts` no dataset
// `dgaspar_bots` do Workers Analytics Engine. Este módulo monta as consultas
// SQL, interpreta o resultado e desenha a página `/metricas`.
//
// As visitas humanas não passam por aqui: elas continuam apenas no GA4 do
// navegador. Esta tela existe para responder "quais crawlers entram, de qual
// provedor, em qual página e de onde".

/** Dataset do Workers Analytics Engine. */
export const METRICS_DATASET = "dgaspar_bots";

/** Endpoint da SQL API do Cloudflare. */
export const SQL_ENDPOINT = "https://api.cloudflare.com/client/v4/analytics/sql";

const TABLE = `events.analyticsEngine.${METRICS_DATASET}`;

/** Consultas executadas por requisição, na ordem de exibição. */
export function buildMetricsQueries(): Record<string, string> {
	return {
		summary: `SELECT SUM(_sample_interval) AS acessos, COUNT() AS amostras, MAX(timestamp) AS ultimo FROM ${TABLE}`,
		providers: `SELECT blob1 AS provedor, SUM(_sample_interval) AS acessos, MAX(timestamp) AS ultimo FROM ${TABLE} GROUP BY provedor ORDER BY acessos DESC LIMIT 50`,
		bots: `SELECT blob2 AS bot, blob1 AS provedor, SUM(_sample_interval) AS acessos FROM ${TABLE} GROUP BY bot, provedor ORDER BY acessos DESC LIMIT 60`,
		pages: `SELECT blob3 AS pagina, SUM(_sample_interval) AS acessos FROM ${TABLE} GROUP BY pagina ORDER BY acessos DESC LIMIT 25`,
		countries: `SELECT blob4 AS pais, SUM(_sample_interval) AS acessos FROM ${TABLE} GROUP BY pais ORDER BY acessos DESC LIMIT 25`,
		daily: `SELECT toStartOfDay(timestamp) AS dia, SUM(_sample_interval) AS acessos FROM ${TABLE} GROUP BY dia ORDER BY dia ASC`,
		ai: `SELECT double1 AS eh_ia, SUM(_sample_interval) AS acessos FROM ${TABLE} GROUP BY eh_ia`,
	};
}

export interface TimeRange {
	start: string;
	end: string;
}

/** Janela de consulta em ISO 8601, terminando agora. */
export function timeRange(days: number, now: Date = new Date()): TimeRange {
	const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
	return { start: start.toISOString(), end: now.toISOString() };
}

/** Corpo da requisição para a SQL API. */
export function buildSqlRequest(query: string, accountTag: string, range: TimeRange): string {
	return JSON.stringify({ query, scope: { accountTag }, time_range: range });
}

/* -------------------------------------------------------------------------- */
/* Interpretação do resultado                                                 */
/* -------------------------------------------------------------------------- */

export interface ProviderRow {
	provider: string;
	hits: number;
	lastSeen: string | null;
}

export interface BotRow {
	bot: string;
	provider: string;
	hits: number;
}

export interface PageRow {
	path: string;
	hits: number;
}

export interface CountryRow {
	country: string;
	hits: number;
}

export interface DailyRow {
	day: string;
	hits: number;
}

export interface MetricsReport {
	days: number;
	totalHits: number;
	lastSeen: string | null;
	providers: ProviderRow[];
	bots: BotRow[];
	pages: PageRow[];
	countries: CountryRow[];
	daily: DailyRow[];
	aiHits: number;
	nonAiHits: number;
	/** Consultas que falharam, para a página não fingir que está vazia. */
	failures: string[];
}

type RawRows = Record<string, unknown[] | undefined>;

const num = (value: unknown): number => {
	const parsed = typeof value === "number" ? value : Number(value ?? 0);
	return Number.isFinite(parsed) ? parsed : 0;
};

const str = (value: unknown): string => (typeof value === "string" ? value : value == null ? "" : String(value));

/** Converte o retorno da SQL API em um relatório pronto para desenhar. */
export function buildReport(days: number, rows: RawRows, failures: string[] = []): MetricsReport {
	const summary = (rows.summary?.[0] ?? {}) as Record<string, unknown>;

	const providers = (rows.providers ?? []).map((row) => {
		const item = row as Record<string, unknown>;
		return {
			provider: str(item.provedor) || "desconhecido",
			hits: num(item.acessos),
			lastSeen: item.ultimo ? str(item.ultimo) : null,
		};
	});

	const bots = (rows.bots ?? []).map((row) => {
		const item = row as Record<string, unknown>;
		return { bot: str(item.bot), provider: str(item.provedor), hits: num(item.acessos) };
	});

	const pages = (rows.pages ?? []).map((row) => {
		const item = row as Record<string, unknown>;
		return { path: str(item.pagina) || "/", hits: num(item.acessos) };
	});

	const countries = (rows.countries ?? []).map((row) => {
		const item = row as Record<string, unknown>;
		return { country: str(item.pais) || "—", hits: num(item.acessos) };
	});

	const daily = (rows.daily ?? []).map((row) => {
		const item = row as Record<string, unknown>;
		return { day: str(item.dia).slice(0, 10), hits: num(item.acessos) };
	});

	let aiHits = 0;
	let nonAiHits = 0;
	for (const row of rows.ai ?? []) {
		const item = row as Record<string, unknown>;
		if (num(item.eh_ia) >= 1) aiHits += num(item.acessos);
		else nonAiHits += num(item.acessos);
	}

	return {
		days,
		totalHits: num(summary.acessos),
		lastSeen: summary.ultimo ? str(summary.ultimo) : null,
		providers,
		bots,
		pages,
		countries,
		daily,
		aiHits,
		nonAiHits,
		failures,
	};
}

/* -------------------------------------------------------------------------- */
/* HTML                                                                       */
/* -------------------------------------------------------------------------- */

/** Agrupa milhares com ponto, sem depender de ICU do runtime. */
export function formatNumber(value: number): string {
	const rounded = Math.round(value);
	const sign = rounded < 0 ? "-" : "";
	return sign + String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

const SITE_FONTS = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

/** Rótulos legíveis para cada provedor. */
const PROVIDER_LABELS: Record<string, string> = {
	openai: "OpenAI",
	google: "Google / Gemini",
	anthropic: "Anthropic",
	perplexity: "Perplexity",
	microsoft: "Microsoft",
	meta: "Meta",
	bytedance: "ByteDance",
	amazon: "Amazon",
	apple: "Apple",
	cohere: "Cohere",
	mistral: "Mistral",
	commoncrawl: "Common Crawl",
	you: "You.com",
	diffbot: "Diffbot",
	other: "Outros",
};

export function providerLabel(provider: string): string {
	return PROVIDER_LABELS[provider] ?? provider;
}

export function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

const dateLabel = (iso: string | null): string => {
	if (!iso) return "—";
	const parsed = new Date(iso);
	if (Number.isNaN(parsed.getTime())) return escapeHtml(iso);
	return parsed.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
};

const rows = (items: Array<[string, string]>): string =>
	items.map(([label, value]) => `<tr><th scope="row">${label}</th><td>${value}</td></tr>`).join("");

/** Desenha a página `/metricas`. */
export function renderReport(report: MetricsReport): string {
	const periodLinks = [1, 7, 30, 90]
		.map(
			(days) =>
				`<a href="/metricas?dias=${days}"${days === report.days ? ' aria-current="page"' : ""}>${days === 1 ? "24 h" : `${days} dias`}</a>`,
		)
		.join("");

	const maxDaily = Math.max(1, ...report.daily.map((row) => row.hits));
	const chart = report.daily.length
		? `<ol class="chart" role="list">${report.daily
				.map(
					(row) =>
						`<li><span class="bar" style="--h:${Math.max(2, Math.round((row.hits / maxDaily) * 100))}%" title="${escapeHtml(
							row.day,
						)}: ${formatNumber(row.hits)}"></span><span class="sr">${escapeHtml(row.day)}: ${formatNumber(
							row.hits,
						)} acessos</span></li>`,
				)
				.join("")}</ol>`
		: `<p class="muted">Ainda sem série diária.</p>`;

	const providerTable = report.providers.length
		? `<table>
			<caption>Por provedor</caption>
			<thead><tr><th scope="col">Provedor</th><th scope="col">Acessos</th><th scope="col">Último acesso</th></tr></thead>
			<tbody>${report.providers
				.map(
					(row) =>
						`<tr><th scope="row">${escapeHtml(providerLabel(row.provider))}<span class="code">${escapeHtml(
							row.provider,
						)}</span></th><td class="num">${formatNumber(row.hits)}</td><td>${dateLabel(row.lastSeen)}</td></tr>`,
				)
				.join("")}</tbody>
		</table>`
		: `<p class="muted">Nenhum provedor no período.</p>`;

	const botTable = report.bots.length
		? `<table>
			<caption>Por crawler</caption>
			<thead><tr><th scope="col">Crawler</th><th scope="col">Provedor</th><th scope="col">Acessos</th></tr></thead>
			<tbody>${report.bots
				.map(
					(row) =>
						`<tr><th scope="row">${escapeHtml(row.bot)}</th><td>${escapeHtml(
							providerLabel(row.provider),
						)}</td><td class="num">${formatNumber(row.hits)}</td></tr>`,
				)
				.join("")}</tbody>
		</table>`
		: `<p class="muted">Nenhum crawler no período.</p>`;

	const pageTable = report.pages.length
		? `<table>
			<caption>Páginas mais visitadas</caption>
			<thead><tr><th scope="col">Página</th><th scope="col">Acessos</th></tr></thead>
			<tbody>${report.pages
				.map(
					(row) =>
						`<tr><th scope="row"><a href="${escapeHtml(row.path)}">${escapeHtml(row.path)}</a></th><td class="num">${formatNumber(
							row.hits,
						)}</td></tr>`,
				)
				.join("")}</tbody>
		</table>`
		: `<p class="muted">Nenhuma página no período.</p>`;

	const countryTable = report.countries.length
		? `<table>
			<caption>Origem</caption>
			<thead><tr><th scope="col">País</th><th scope="col">Acessos</th></tr></thead>
			<tbody>${report.countries
				.map(
					(row) =>
						`<tr><th scope="row">${escapeHtml(row.country)}</th><td class="num">${formatNumber(row.hits)}</td></tr>`,
				)
				.join("")}</tbody>
		</table>`
		: `<p class="muted">Nenhuma origem no período.</p>`;

	const failureNote = report.failures.length
		? `<p class="alert">Falha em ${report.failures.length} consulta(s): ${report.failures
				.map(escapeHtml)
				.join(", ")}. Os números abaixo podem estar incompletos.</p>`
		: "";

	return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Bots que acessaram douglasgaspar.com</title>
<style>
:root {
	color-scheme: light dark;
	--bg: #fbfbfa; --fg: #1a1a1a; --muted: #666; --line: #e3e3e0; --card: #fff; --accent: #1a6b4a; --alert: #8a2b12;
	--font: ${SITE_FONTS};
}
@media (prefers-color-scheme: dark) {
	:root { --bg: #12130f; --fg: #eceae4; --muted: #9a978f; --line: #2b2d27; --card: #191a15; --accent: #7fd6ab; --alert: #e8a08a; }
}
* { box-sizing: border-box; }
body { margin: 0; padding: 2rem 1.25rem 4rem; background: var(--bg); color: var(--fg); font-family: var(--font); line-height: 1.55; }
main { max-width: 62rem; margin: 0 auto; }
header h1 { font-size: clamp(1.4rem, 1rem + 1.5vw, 2rem); margin: 0 0 .35rem; }
header p { margin: 0; color: var(--muted); }
nav { display: flex; gap: .5rem; flex-wrap: wrap; margin: 1.5rem 0; }
nav a { padding: .4rem .8rem; border: 1px solid var(--line); border-radius: 999px; color: inherit; text-decoration: none; font-size: .9rem; }
nav a[aria-current="page"] { border-color: var(--accent); color: var(--accent); font-weight: 600; }
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr)); gap: .75rem; margin-bottom: 1.5rem; }
.card { background: var(--card); border: 1px solid var(--line); border-radius: .6rem; padding: .9rem 1rem; }
.card dt { font-size: .78rem; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); }
.card dd { margin: .25rem 0 0; font-size: 1.6rem; font-variant-numeric: tabular-nums; }
.chart { display: flex; align-items: flex-end; gap: 2px; height: 7rem; margin: 0 0 1.5rem; padding: .5rem; list-style: none; background: var(--card); border: 1px solid var(--line); border-radius: .6rem; }
.chart li { flex: 1; display: flex; align-items: flex-end; height: 100%; }
.chart .bar { width: 100%; height: var(--h); background: var(--accent); border-radius: 2px 2px 0 0; opacity: .85; }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
table { width: 100%; border-collapse: collapse; margin-bottom: 1.75rem; background: var(--card); border: 1px solid var(--line); border-radius: .6rem; overflow: hidden; }
caption { text-align: left; font-weight: 600; padding: .75rem 1rem; border-bottom: 1px solid var(--line); }
th, td { text-align: left; padding: .55rem 1rem; border-bottom: 1px solid var(--line); font-weight: 400; font-size: .94rem; }
thead th { font-size: .78rem; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); }
tbody tr:last-child th, tbody tr:last-child td { border-bottom: 0; }
.num { text-align: right; font-variant-numeric: tabular-nums; }
.code { display: block; font-family: ui-monospace, 'SF Mono', Menlo, monospace; font-size: .75rem; color: var(--muted); }
a { color: var(--accent); }
.muted { color: var(--muted); }
.alert { color: var(--alert); border: 1px solid currentColor; border-radius: .5rem; padding: .6rem .9rem; }
footer { margin-top: 2.5rem; color: var(--muted); font-size: .85rem; }
</style>
</head>
<body>
<main>
<header>
	<h1>Bots que acessaram douglasgaspar.com</h1>
	<p>Leitura do dataset <code>${METRICS_DATASET}</code> no Workers Analytics Engine. As visitas humanas continuam apenas no GA4.</p>
</header>
<nav aria-label="Período">${periodLinks}</nav>
${failureNote}
<dl class="cards">
	<div class="card"><dt>Acessos de bot</dt><dd>${formatNumber(report.totalHits)}</dd></div>
	<div class="card"><dt>Provedores</dt><dd>${formatNumber(report.providers.length)}</dd></div>
	<div class="card"><dt>Crawlers</dt><dd>${formatNumber(report.bots.length)}</dd></div>
	<div class="card"><dt>De IA</dt><dd>${formatNumber(report.aiHits)}</dd></div>
</dl>
${chart}
${providerTable}
${botTable}
${pageTable}
${countryTable}
<details>
	<summary>Diagnóstico</summary>
	<table><tbody>${rows([
		["Acessos de IA", formatNumber(report.aiHits)],
		["Acessos que não são de IA", formatNumber(report.nonAiHits)],
		["Último acesso", dateLabel(report.lastSeen)],
		["Janela", `${report.days} dia(s)`],
		["Dataset", `<code>${METRICS_DATASET}</code>`],
	])}</tbody></table>
</details>
<footer>Gerado em ${dateLabel(new Date().toISOString())}. O User-Agent é auto-declarado: a contagem é declarada, não verificada por faixa de IP.</footer>
</main>
</body>
</html>`;
}

/** Página neutra para configuração ausente ou falha de credencial. */
export function renderNotice(title: string, message: string): string {
	return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>${escapeHtml(title)}</title>
<style>body{margin:0;padding:3rem 1.25rem;font-family:${SITE_FONTS};line-height:1.6;background:#fbfbfa;color:#1a1a1a}
@media(prefers-color-scheme:dark){body{background:#12130f;color:#eceae4}}main{max-width:38rem;margin:0 auto}
h1{font-size:1.3rem;margin:0 0 .5rem}code{background:#0001;padding:.1em .35em;border-radius:.25em}</style></head>
<body><main><h1>${escapeHtml(title)}</h1><p>${message}</p></main></body></html>`;
}

/** Confere o cabeçalho `Authorization` contra as credenciais configuradas. */
export function checkBasicAuth(header: string | null, user: string, password: string): boolean {
	if (!header || !user || !password) return false;
	const prefix = "Basic ";
	if (!header.startsWith(prefix)) return false;
	let decoded: string;
	try {
		decoded = atob(header.slice(prefix.length).trim());
	} catch {
		return false;
	}
	const separator = decoded.indexOf(":");
	if (separator < 0) return false;
	const givenUser = decoded.slice(0, separator);
	const givenPassword = decoded.slice(separator + 1);
	return constantTimeEqual(givenUser, user) && constantTimeEqual(givenPassword, password);
}

const constantTimeEqual = (a: string, b: string): boolean => {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let index = 0; index < a.length; index += 1) diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
	return diff === 0;
};

// Página `/metricas` — relatório de crawlers de douglasgaspar.com.
//
// Lê o dataset `dgaspar_bots` pela SQL API do Cloudflare usando um token só de
// leitura de análises (`CF_ANALYTICS_TOKEN`). A página é protegida por HTTP
// Basic Auth (`METRICS_USER` / `METRICS_PASSWORD`) e nunca é indexada.
//
// Sem as quatro variáveis de ambiente a página responde 503 explicando o que
// falta, em vez de expor um relatório aberto.

import {
	SQL_ENDPOINT,
	buildMetricsQueries,
	buildReport,
	buildSqlRequest,
	checkBasicAuth,
	renderNotice,
	renderReport,
	timeRange,
} from "../src/lib/bot-metrics";

interface MetricsEnv {
	METRICS_USER?: string;
	METRICS_PASSWORD?: string;
	CF_ANALYTICS_TOKEN?: string;
	CF_ACCOUNT_ID?: string;
}

interface PagesContext {
	request: Request;
	env: MetricsEnv;
}

const PERIODS = [1, 7, 30, 90];

const html = (body: string, status: number, extra: Record<string, string> = {}): Response =>
	new Response(body, {
		status,
		headers: {
			"content-type": "text/html; charset=utf-8",
			"cache-control": "no-store",
			"x-robots-tag": "noindex, nofollow",
			"referrer-policy": "no-referrer",
			"x-content-type-options": "nosniff",
			...extra,
		},
	});

export const onRequest = async (context: PagesContext): Promise<Response> => {
	const url = new URL(context.request.url);
	if (url.pathname !== "/metricas") {
		return Response.redirect(`${url.origin}/metricas${url.search}`, 308);
	}

	const user = context.env?.METRICS_USER?.trim() ?? "";
	const password = context.env?.METRICS_PASSWORD?.trim() ?? "";
	const token = context.env?.CF_ANALYTICS_TOKEN?.trim() ?? "";
	const accountTag = context.env?.CF_ACCOUNT_ID?.trim() ?? "";

	if (!user || !password) {
		return html(
			renderNotice(
				"Relatório sem proteção configurada",
				"Defina <code>METRICS_USER</code> e <code>METRICS_PASSWORD</code> nas variáveis de ambiente do projeto no Cloudflare Pages. Enquanto isso, a página fica fechada.",
			),
			503,
		);
	}

	if (!checkBasicAuth(context.request.headers.get("authorization"), user, password)) {
		return html(
			renderNotice("Acesso restrito", "Informe usuário e senha para ver o relatório de bots."),
			401,
			{ "www-authenticate": 'Basic realm="metricas de bots", charset="UTF-8"' },
		);
	}

	if (!token || !accountTag) {
		return html(
			renderNotice(
				"Consulta sem credencial",
				"Faltam <code>CF_ANALYTICS_TOKEN</code> e/ou <code>CF_ACCOUNT_ID</code> nas variáveis de ambiente do projeto. O token precisa da permissão <em>Account Analytics: Read</em>.",
			),
			503,
		);
	}

	const requested = Number(url.searchParams.get("dias") ?? "7");
	const days = PERIODS.includes(requested) ? requested : 7;
	const range = timeRange(days);

	const queries = buildMetricsQueries();
	const results: Record<string, unknown[]> = {};
	const failures: string[] = [];

	await Promise.all(
		Object.entries(queries).map(async ([key, query]) => {
			try {
				const response = await fetch(SQL_ENDPOINT, {
					method: "POST",
					headers: {
						authorization: `Bearer ${token}`,
						"content-type": "application/json",
					},
					body: buildSqlRequest(query, accountTag, range),
				});
				if (!response.ok) {
					const detail = await response.text().catch(() => "");
					failures.push(`${key} (HTTP ${response.status}${detail ? `: ${detail.slice(0, 120)}` : ""})`);
					return;
				}
				const payload = (await response.json().catch(() => ({}))) as { data?: unknown[] };
				results[key] = Array.isArray(payload.data) ? payload.data : [];
			} catch (error) {
				failures.push(`${key} (${error instanceof Error ? error.message : "falha de rede"})`);
			}
		}),
	);

	return html(renderReport(buildReport(days, results, failures)), 200);
};

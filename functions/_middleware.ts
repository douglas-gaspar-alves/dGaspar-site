// Medição de crawlers na borda do Cloudflare Pages.
//
// O GA4 do navegador (`src/components/GoogleAnalytics.astro`) só conta humanos:
// GPTBot, ClaudeBot, PerplexityBot e os demais nunca executam JavaScript. Este
// middleware existe para eles.
//
// Fluxo: a requisição passa normalmente (`context.next()`), e apenas quando a
// resposta é um documento HTML 200 acessado por um User-Agent conhecido de
// crawler um ponto de dados é gravado no Workers Analytics Engine, no dataset
// `dgaspar_bots`. A leitura acontece em `/metricas`.
//
// Sem o binding `BOT_METRICS` o middleware é inerte: não grava nada, não altera
// a resposta, e não precisa de configuração local para `npm run dev`.

import { botIndex, buildBotDataPoint, classifyBot } from "../src/lib/bots";

/** Formato mínimo do binding de Analytics Engine. */
interface AnalyticsEngineDataset {
	writeDataPoint(event: { indexes?: string[]; blobs?: string[]; doubles?: number[] }): void;
}

interface BotMetricsEnv {
	/** Binding declarado em `wrangler.jsonc`. */
	BOT_METRICS?: AnalyticsEngineDataset;
}

interface PagesContext {
	request: Request;
	env: BotMetricsEnv;
	next: () => Promise<Response>;
}

export const onRequest = async (context: PagesContext): Promise<Response> => {
	const response = await context.next();

	try {
		const dataset = context.env?.BOT_METRICS;
		if (!dataset) return response;

		// Só documentos navegáveis: um crawler que baixa CSS e imagens geraria
		// dezenas de pontos por página visitada.
		if (context.request.method !== "GET") return response;
		if (response.status !== 200) return response;
		const contentType = response.headers.get("content-type") ?? "";
		if (!contentType.includes("text/html")) return response;

		const url = new URL(context.request.url);
		if (url.pathname.startsWith("/cdn-cgi/")) return response;

		const userAgent = context.request.headers.get("user-agent");
		const match = classifyBot(userAgent);
		if (!match) return response;

		dataset.writeDataPoint(
			buildBotDataPoint({
				match,
				url,
				referrer: context.request.headers.get("referer"),
				country: context.request.headers.get("cf-ipcountry"),
				userAgent,
			}),
		);
	} catch {
		// Medição de bot nunca pode alterar a resposta entregue ao visitante.
	}

	return response;
};

/** Exportado para o teste conferir o índice usado no dataset. */
export { botIndex };

// Medição de crawlers na borda do Cloudflare Pages.
//
// O GA4 do navegador (`src/components/GoogleAnalytics.astro`) só conta humanos:
// GPTBot, ClaudeBot, PerplexityBot e os demais nunca executam JavaScript. Este
// middleware existe para eles.
//
// Fluxo: a requisição passa normalmente (`context.next()`), e apenas quando a
// resposta é um documento HTML acessado por um User-Agent conhecido de crawler
// um evento `bot_<provedor>` é enviado por Measurement Protocol para a
// propriedade "douglasgaspar.com — Bots".
//
// Sem `GA_BOTS_MEASUREMENT_ID` e `GA_BOTS_API_SECRET` o middleware é inerte:
// nunca derruba a página, nunca envia nada, e não precisa de configuração local
// para rodar `npm run dev` ou `npm run build`.

import { buildBotPayload, classifyBot, digestHex, numericIdFromHex } from "../src/lib/bots";

interface BotMetricsEnv {
	/** ID de métricas (`G-…`) da propriedade de bots. */
	GA_BOTS_MEASUREMENT_ID?: string;
	/** Segredo da API do Measurement Protocol dessa propriedade. */
	GA_BOTS_API_SECRET?: string;
}

interface PagesContext {
	request: Request;
	env: BotMetricsEnv;
	next: () => Promise<Response>;
	waitUntil: (promise: Promise<unknown>) => void;
}

const COLLECT_ENDPOINT = "https://www.google-analytics.com/mp/collect";

export const onRequest = async (context: PagesContext): Promise<Response> => {
	const response = await context.next();

	try {
		const measurementId = context.env?.GA_BOTS_MEASUREMENT_ID?.trim();
		const apiSecret = context.env?.GA_BOTS_API_SECRET?.trim();
		if (!measurementId || !apiSecret) return response;

		// Só documentos navegáveis: um crawler que baixa CSS e imagens geraria
		// dezenas de eventos por página visitada.
		if (context.request.method !== "GET") return response;
		if (response.status !== 200) return response;
		const contentType = response.headers.get("content-type") ?? "";
		if (!contentType.includes("text/html")) return response;

		const url = new URL(context.request.url);
		if (url.pathname.startsWith("/cdn-cgi/")) return response;

		const userAgent = context.request.headers.get("user-agent");
		const match = classifyBot(userAgent);
		if (!match) return response;

		// Identificador anônimo: hash de IP + User-Agent + dia. O IP original não
		// é gravado em lugar nenhum e o hash deixa de ser reidentificável no dia
		// seguinte.
		const day = new Date().toISOString().slice(0, 10);
		const ip = context.request.headers.get("cf-connecting-ip") ?? "";
		const clientId = await digestHex(`${ip}|${userAgent}|${day}`);

		const payload = buildBotPayload({
			match,
			url,
			clientId,
			sessionId: numericIdFromHex(clientId),
			referrer: context.request.headers.get("referer"),
			country: context.request.headers.get("cf-ipcountry"),
		});

		const endpoint = `${COLLECT_ENDPOINT}?measurement_id=${encodeURIComponent(
			measurementId,
		)}&api_secret=${encodeURIComponent(apiSecret)}`;

		context.waitUntil(
			fetch(endpoint, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(payload),
			}).catch(() => undefined),
		);
	} catch {
		// Medição de bot nunca pode alterar a resposta entregue ao visitante.
	}

	return response;
};

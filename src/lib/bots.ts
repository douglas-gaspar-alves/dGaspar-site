// Classificação de crawlers para a medição de bots de douglasgaspar.com.
//
// Crawlers não executam JavaScript, então nunca aparecem no GA4 do navegador.
// Esta lib roda na borda (Cloudflare Pages Function) e traduz o User-Agent em
// provedor + nome, que viram o nome do evento enviado ao Measurement Protocol
// da propriedade "douglasgaspar.com — Bots".
//
// O User-Agent é auto-declarado: um cliente pode mentir. A contagem aqui é
// "declarada", não "verificada" por faixa de IP. Endurecer exige validar contra
// os intervalos publicados por cada provedor.

/** Provedor responsável pelo crawler. Vira o sufixo do nome do evento. */
export type BotProvider =
	| "openai"
	| "google"
	| "anthropic"
	| "perplexity"
	| "microsoft"
	| "meta"
	| "bytedance"
	| "amazon"
	| "apple"
	| "cohere"
	| "mistral"
	| "commoncrawl"
	| "you"
	| "diffbot"
	| "other";

export interface BotMatch {
	/** Provedor responsável pelo crawler. */
	provider: BotProvider;
	/** Assinatura que aparece no User-Agent. */
	name: string;
	/** `true` quando o crawler alimenta treinamento ou resposta de IA. */
	ai: boolean;
}

interface BotSignature extends BotMatch {
	/** Trecho procurado no User-Agent em minúsculas. */
	match: string;
}

// A ordem importa: assinaturas mais específicas vêm antes das genéricas, para
// que "applebot-extended" não seja classificado como "applebot".
const BOT_SIGNATURES: readonly BotSignature[] = [
	// OpenAI
	{ match: "oai-searchbot", name: "OAI-SearchBot", provider: "openai", ai: true },
	{ match: "chatgpt-user", name: "ChatGPT-User", provider: "openai", ai: true },
	{ match: "gptbot", name: "GPTBot", provider: "openai", ai: true },

	// Google (Gemini) — treinamento/agente
	{ match: "google-extended", name: "Google-Extended", provider: "google", ai: true },
	{ match: "gemini-deep-research", name: "Gemini-Deep-Research", provider: "google", ai: true },
	{ match: "google-cloudvertexbot", name: "Google-CloudVertexBot", provider: "google", ai: true },
	{ match: "googleother", name: "GoogleOther", provider: "google", ai: true },
	// Google Search — indexação tradicional
	{ match: "mediapartners-google", name: "Mediapartners-Google", provider: "google", ai: false },
	{ match: "googlebot", name: "Googlebot", provider: "google", ai: false },

	// Anthropic
	{ match: "claude-searchbot", name: "Claude-SearchBot", provider: "anthropic", ai: true },
	{ match: "claude-user", name: "Claude-User", provider: "anthropic", ai: true },
	{ match: "claudebot", name: "ClaudeBot", provider: "anthropic", ai: true },

	// Perplexity
	{ match: "perplexity-user", name: "Perplexity-User", provider: "perplexity", ai: true },
	{ match: "perplexitybot", name: "PerplexityBot", provider: "perplexity", ai: true },

	// Microsoft (Bing / Copilot)
	{ match: "microsoftpreview", name: "MicrosoftPreview", provider: "microsoft", ai: false },
	{ match: "bingbot", name: "bingbot", provider: "microsoft", ai: false },
	{ match: "msnbot", name: "msnbot", provider: "microsoft", ai: false },

	// Meta
	{ match: "meta-externalagent", name: "meta-externalagent", provider: "meta", ai: true },
	{ match: "meta-externalfetcher", name: "meta-externalfetcher", provider: "meta", ai: false },
	{ match: "facebookexternalhit", name: "facebookexternalhit", provider: "meta", ai: false },

	// ByteDance
	{ match: "bytespider", name: "Bytespider", provider: "bytedance", ai: true },
	{ match: "tiktokspider", name: "TikTokSpider", provider: "bytedance", ai: false },

	// Outros provedores de IA
	{ match: "amazonbot", name: "Amazonbot", provider: "amazon", ai: true },
	{ match: "applebot-extended", name: "Applebot-Extended", provider: "apple", ai: true },
	{ match: "applebot", name: "Applebot", provider: "apple", ai: false },
	{ match: "cohere-training-data-crawler", name: "cohere-training-data-crawler", provider: "cohere", ai: true },
	{ match: "cohere-ai", name: "cohere-ai", provider: "cohere", ai: true },
	{ match: "mistralai-user", name: "MistralAI-User", provider: "mistral", ai: true },
	{ match: "youbot", name: "YouBot", provider: "you", ai: true },
	{ match: "diffbot", name: "Diffbot", provider: "diffbot", ai: true },

	// Acervos públicos usados por modelos
	{ match: "ccbot", name: "CCBot", provider: "commoncrawl", ai: true },
];

/**
 * Classifica um User-Agent em provedor + nome.
 *
 * Devolve `null` para navegadores humanos e para requisições sem User-Agent.
 * User-Agents com "bot", "crawler", "spider" ou "scraper" fora da tabela caem
 * no provedor genérico `other`.
 */
export function classifyBot(userAgent: string | null | undefined): BotMatch | null {
	const ua = (userAgent ?? "").toLowerCase();
	if (!ua.trim()) return null;

	for (const signature of BOT_SIGNATURES) {
		if (ua.includes(signature.match)) {
			return { provider: signature.provider, name: signature.name, ai: signature.ai };
		}
	}

	const generic = ua.match(/[a-z0-9_.-]*(?:bot|crawler|spider|scraper)[a-z0-9_.-]*/);
	if (generic?.[0]) return { provider: "other", name: generic[0], ai: false };

	return null;
}

/** Nome do evento enviado ao GA4. Sempre `bot_<provedor>`. */
export function botEventName(match: BotMatch): string {
	return `bot_${match.provider}`;
}

/** Nomes de evento possíveis, na ordem da tabela, sem repetição. */
export function botEventNames(): string[] {
	const providers = BOT_SIGNATURES.map((signature) => signature.provider);
	return [...new Set(providers)].map((provider) => `bot_${provider}`);
}

/** SHA-256 em hexadecimal, para derivar identificadores sem guardar IP. */
export async function digestHex(value: string): Promise<string> {
	const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
	return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Converte os primeiros bytes de um hash em um id numérico estável. */
export function numericIdFromHex(hex: string, modulo = 1_000_000_000): string {
	if (!/^[0-9a-f]+$/i.test(hex)) return "0";
	return String(Number.parseInt(hex.slice(0, 12), 16) % modulo);
}

export interface BotHitInput {
	match: BotMatch;
	/** URL original da requisição; a query string é descartada. */
	url: URL;
	/** Identificador anônimo e diário do visitante. */
	clientId: string;
	/** Identificador anônimo e diário da sessão. */
	sessionId: string;
	referrer?: string | null;
	country?: string | null;
}

export interface BotPayload {
	client_id: string;
	events: Array<{ name: string; params: Record<string, string | number> }>;
}

/** Monta o corpo do Measurement Protocol para um acesso de crawler. */
export function buildBotPayload(input: BotHitInput): BotPayload {
	const { match, url } = input;
	return {
		client_id: input.clientId,
		events: [
			{
				name: botEventName(match),
				params: {
					bot_name: match.name,
					bot_provider: match.provider,
					bot_is_ai: match.ai ? 1 : 0,
					page_location: `${url.origin}${url.pathname}`,
					page_path: url.pathname,
					page_referrer: (input.referrer ?? "").slice(0, 420),
					country: (input.country ?? "").slice(0, 8),
					session_id: input.sessionId,
					engagement_time_msec: 1,
				},
			},
		],
	};
}

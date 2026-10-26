import type { APIRoute } from "astro";
import lesson from "../data/proxima-aula.json";
import { PUBLICADO as AULA_PUBLICADA } from "../lib/aula-agente";

// Apenas páginas públicas com conteúdo aprovado; páginas de confirmação e
// a consultoria de agente pessoal continuam fora do índice.
export const indexablePaths = [
  "/",
  "/consultorias/",
  "/servicos/criacao-de-sites/",
  "/lab/",
  ...(lesson.publicado ? ["/lab/proxima-aula/"] : []),
  ...(AULA_PUBLICADA ? ["/lab/aula-agente/"] : []),
] as const;

export const GET: APIRoute = ({ site }) => {
  if (!site) throw new Error("Configure a URL pública do site no astro.config.mjs");

  const urls = indexablePaths.map((path) => `  <url><loc>${new URL(path, site).href}</loc></url>`).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};

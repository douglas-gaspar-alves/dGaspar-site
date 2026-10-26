// Dados voláteis da MasterClass "Faça a IA trabalhar para você" (rota
// /lab/aula-agente/). O texto da página vive nos componentes AulaAgente*; aqui
// ficam apenas os valores que mudam por aula: destino do checkout, status de
// publicação e a janela do encontro ao vivo. Função pura de contagem é
// testada em src/scripts/aula-agente/.

/** Plano Empreendedor do LAB, 30 dias — o mesmo checkout mensal já usado na
 * página do LAB (`site/src/lib/lab-checkout.ts`). Destino da opção de R$ 29,99
 * e do closing. */
export const CHECKOUT_EMPREENDEDOR_URL = "https://pay.cakto.com.br/mtya7hj_1232361";

/** Plano Empreendedor do LAB, 12 meses — o mesmo checkout anual já usado na
 * página do LAB. Destino da opção de R$ 299,99. */
export const CHECKOUT_EMPREENDEDOR_ANUAL_URL = "https://pay.cakto.com.br/e98y5m2_1232361";

/** false = prévia: aplica noindex e mantém a rota fora do sitemap. */
export const PUBLICADO = false;

/** Início do encontro ao vivo, horário de Brasília (sábado, 14/11/2026). */
export const INICIO_AO_VIVO = "2026-11-14T09:00:00-03:00";

/** Fim planejado do encontro ao vivo, horário de Brasília. */
export const FIM_AO_VIVO = "2026-11-14T12:00:00-03:00";

/**
 * Rótulo da contagem regressiva para a janela ao vivo. Devolve "em 4d 22h",
 * "em 21h 4min", "em 12min", "em menos de 1 min" ou "agora" (aula em curso).
 * null depois do fim, quando o chip deve sumir.
 */
export function rotuloContagem(agora: Date, inicio: string, fim: string): string | null {
  const start = new Date(inicio).getTime();
  const end = new Date(fim).getTime();
  const t = agora.getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null;
  if (t >= end) return null;
  if (t >= start) return "agora";
  const min = Math.round((start - t) / 60000);
  if (min < 1) return "em menos de 1 min";
  if (min < 60) return `em ${min}min`;
  const h = Math.floor(min / 60);
  if (h < 48) return `em ${h}h ${String(min % 60).padStart(2, "0")}min`;
  const d = Math.floor(h / 24);
  return `em ${d}d ${h % 24}h`;
}

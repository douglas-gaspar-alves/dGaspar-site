import { z } from "astro/zod";
import { YOUTUBE_ID_PATTERN } from "./youtube-video";
export { youtubeWatchUrl } from "./youtube-video";

const text = z.string().trim().min(1);
const optionalText = z.string().trim().default("");
const httpsUrl = z.string().trim().pipe(z.url({ protocol: /^https$/ }));
const youtubeId = z.string().trim().regex(YOUTUBE_ID_PATTERN, "Informe apenas o ID de 11 caracteres do YouTube.");
const emptyToNull = (value: unknown) => typeof value === "string" && !value.trim() ? null : value;

export const nextClassSchema = z.object({
  publicado: z.boolean().default(false),
  titulo: text,
  destaque: optionalText,
  resumo: text,
  inicio: z.preprocess(emptyToNull, z.iso.datetime({ offset: true }).nullable().default(null)),
  duracao: optionalText,
  youtubeId: z.preprocess(emptyToNull, youtubeId.nullable().default(null)),
  capa: text.regex(/^\/images\/[^?#]+$/, "Use o caminho de uma imagem em /images/."),
  capaAlt: text,
  topicos: z.array(z.object({ titulo: text, descricao: optionalText })).default([]),
  publico: z.array(text).default([]),
  preparacao: z.array(text).default([]),
  apresentador: z.object({ nome: text, descricao: text, imagem: text, imagemAlt: text, largura: z.number().int().positive(), altura: z.number().int().positive() }),
  duvidas: z.array(z.object({ pergunta: text, resposta: text })).default([]),
  cadastroUrl: httpsUrl,
  ctaTexto: text.default("Fazer meu cadastro"),
  chamadaFinal: z.object({ titulo: text, descricao: optionalText }),
}).superRefine((data, context) => {
  if (!data.publicado) return;
  if (!data.inicio) context.addIssue({ code: "custom", path: ["inicio"], message: "Preencha a data antes de publicar." });
  if (!data.youtubeId) context.addIssue({ code: "custom", path: ["youtubeId"], message: "Preencha o vídeo antes de publicar." });
  if (!data.topicos.length) context.addIssue({ code: "custom", path: ["topicos"], message: "Preencha o programa antes de publicar." });
});

export type NextClass = z.infer<typeof nextClassSchema>;

export function formatClassSchedule(start: string | null): { date: string; time: string | null } {
  if (!start) return { date: "Data a definir", time: null };
  const date = new Date(start);
  return {
    date: new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", timeZone: "America/Sao_Paulo" }).format(date),
    time: `${new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(date)} · Brasília`,
  };
}


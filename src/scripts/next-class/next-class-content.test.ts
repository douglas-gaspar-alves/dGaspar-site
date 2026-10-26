import { describe, expect, it } from "vitest";
import data from "../../data/proxima-aula.json";
import { formatClassSchedule, nextClassSchema } from "../../lib/next-class";
import { youtubeEmbedUrl, youtubeWatchUrl } from "../../lib/youtube-video";

describe("conteúdo reutilizável da aula", () => {
  it("aceita o conteúdo atual e normaliza data e vídeo vazios da prévia", () => {
    expect(nextClassSchema.parse(data).titulo).toBe(data.titulo);
    const preview = nextClassSchema.parse({ ...data, publicado: false, inicio: " ", youtubeId: "" });
    expect(preview.inicio).toBeNull();
    expect(preview.youtubeId).toBeNull();
  });

  it("rejeita publicação sem data, vídeo e programa", () => {
    const result = nextClassSchema.safeParse({ ...data, publicado: true, inicio: null, youtubeId: null, topicos: [] });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.map((issue) => issue.path[0])).toEqual(["inicio", "youtubeId", "topicos"]);
  });

  it("aceita uma aula completa alterando apenas seus dados", () => {
    const lesson = nextClassSchema.parse({ ...data, publicado: true, titulo: "Título de teste", inicio: "2026-11-01T20:00:00-03:00", youtubeId: "abcdefghijk", topicos: [{ titulo: "Tópico de teste" }] });
    expect(lesson.publicado).toBe(true);
    expect(lesson.topicos[0].descricao).toBe("");
  });

  it.each(["javascript:alert(1)", "http://example.com", " "])("rejeita destino de cadastro inválido: %s", (cadastroUrl) => {
    expect(nextClassSchema.safeParse({ ...data, cadastroUrl }).success).toBe(false);
  });

  it.each(["https://youtu.be/abcdefghijk", "abc", 'abc\"<script>'])("rejeita identificador de vídeo inválido: %s", (youtubeId) => {
    expect(nextClassSchema.safeParse({ ...data, youtubeId }).success).toBe(false);
    expect(() => youtubeEmbedUrl(youtubeId)).toThrow();
  });

  it("exige data ISO com fuso e não aceita datas impossíveis", () => {
    for (const inicio of ["amanhã", "2026-11-01T20:00:00", "2026-02-31T20:00:00-03:00"]) {
      expect(nextClassSchema.safeParse({ ...data, inicio }).success).toBe(false);
    }
  });

  it("formata a data em Brasília independentemente do fuso do computador", () => {
    expect(formatClassSchedule(null)).toEqual({ date: "Data a definir", time: null });
    expect(formatClassSchedule("2026-11-02T01:30:00Z")).toEqual({ date: "01 de novembro", time: "22:30 · Brasília" });
  });

  it("mantém controles e reprodução no celular e cria a alternativa no YouTube", () => {
    const embed = new URL(youtubeEmbedUrl("abcdefghijk"));
    expect(embed.origin).toBe("https://www.youtube-nocookie.com");
    expect(embed.searchParams.get("playsinline")).toBe("1");
    expect(embed.searchParams.get("controls")).toBe("1");
    expect(youtubeWatchUrl("abcdefghijk")).toBe("https://www.youtube.com/watch?v=abcdefghijk");
  });
});

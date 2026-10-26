import { describe, expect, it } from "vitest";
import { CHECKOUT_EMPREENDEDOR_ANUAL_URL, CHECKOUT_EMPREENDEDOR_URL, FIM_AO_VIVO, INICIO_AO_VIVO, rotuloContagem } from "../../lib/aula-agente";

const data = (iso: string) => new Date(iso);

describe("dados da MasterClass do Agente", () => {
  it("aponta as duas opções do Empreendedor para checkouts https reais", () => {
    for (const url of [CHECKOUT_EMPREENDEDOR_URL, CHECKOUT_EMPREENDEDOR_ANUAL_URL]) {
      expect(() => new URL(url)).not.toThrow();
      expect(url.startsWith("https://")).toBe(true);
      expect(url.includes("COLOQUE_O_LINK")).toBe(false);
    }
    expect(CHECKOUT_EMPREENDEDOR_URL).not.toBe(CHECKOUT_EMPREENDEDOR_ANUAL_URL);
  });

  it("mantém a janela ao dentro do mesmo sábado, das 9h às 12h de Brasília", () => {
    const inicio = data(INICIO_AO_VIVO);
    const fim = data(FIM_AO_VIVO);
    expect(fim.getTime() - inicio.getTime()).toBe(3 * 60 * 60 * 1000);
    expect(INICIO_AO_VIVO.endsWith("-03:00")).toBe(true);
    expect(FIM_AO_VIVO.endsWith("-03:00")).toBe(true);
  });
});

describe("rótulo da contagem regressiva", () => {
  const inicio = "2026-10-31T09:00:00-03:00";
  const fim = "2026-10-31T12:00:00-03:00";

  it("conta dias quando falta mais de dois dias", () => {
    expect(rotuloContagem(data("2026-10-27T10:00:00-03:00"), inicio, fim)).toBe("em 3d 23h");
  });

  it("conta horas e minutos no mesmo dia", () => {
    expect(rotuloContagem(data("2026-10-31T06:30:00-03:00"), inicio, fim)).toBe("em 2h 30min");
    expect(rotuloContagem(data("2026-10-31T08:48:00-03:00"), inicio, fim)).toBe("em 12min");
  });

  it("marca a aula em curso e some depois do fim", () => {
    expect(rotuloContagem(data("2026-10-31T10:00:00-03:00"), inicio, fim)).toBe("agora");
    expect(rotuloContagem(data("2026-10-31T13:00:00-03:00"), inicio, fim)).toBeNull();
  });

  it("rejeita janelas inválidas em vez de inventar contagem", () => {
    expect(rotuloContagem(data("2026-10-30T10:00:00-03:00"), "x", fim)).toBeNull();
    expect(rotuloContagem(data("2026-10-30T10:00:00-03:00"), fim, inicio)).toBeNull();
  });
});

// @vitest-environment jsdom
import { existsSync, readFileSync } from "node:fs";
import { URL as NodeURL } from "node:url";
import { describe, expect, it } from "vitest";
import { CHECKOUT_EMPREENDEDOR_ANUAL_URL, CHECKOUT_EMPREENDEDOR_URL, INICIO_AO_VIVO, PUBLICADO } from "../../lib/aula-agente";

const builtPage = new NodeURL("../../../dist/lab/aula-agente/index.html", import.meta.url);
const html = existsSync(builtPage) ? readFileSync(builtPage, "utf8") : "";
const document = new DOMParser().parseFromString(html, "text/html");

describe("página da MasterClass do Agente", () => {
  it("gera a rota pública com um título principal e retorno ao site", () => {
    expect(document.querySelectorAll("h1")).toHaveLength(1);
    expect(document.querySelector('header a[href="/"]')).not.toBeNull();
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe("https://douglasgaspar.com/lab/aula-agente/");
  });

  it("aplica noindex somente enquanto a prévia não é publicada", () => {
    const robots = document.querySelector('meta[name="robots"]')?.getAttribute("content") ?? null;
    expect(robots).toBe(PUBLICADO ? null : "noindex, nofollow");
  });

  it("leva o CTA da abertura à seção de investimento e os demais ao checkout externo", () => {
    const heroCta = document.querySelector<HTMLAnchorElement>(".aula-hero .aula-signup");
    expect(heroCta?.getAttribute("href")).toBe("#preco");
    expect(heroCta?.hasAttribute("target")).toBe(false);

    const internos = [...document.querySelectorAll<HTMLAnchorElement>(".aula-signup[href^='#']")];
    expect(internos.length).toBeGreaterThanOrEqual(3);
    for (const cta of internos) {
      expect(cta.getAttribute("href")).toBe("#preco");
      expect(cta.hasAttribute("target")).toBe(false);
    }

    const externos = [...document.querySelectorAll<HTMLAnchorElement>(".aula-signup[href^='https://']")];
    expect(externos.length).toBeGreaterThanOrEqual(3);
    for (const cta of externos) {
      expect(cta.target).toBe("_blank");
      expect(cta.rel).toContain("noopener");
      expect(cta.hasAttribute("data-lab-signup-open")).toBe(false);
    }
    const destinos = externos.map((cta) => cta.getAttribute("href"));
    expect(destinos).toContain(CHECKOUT_EMPREENDEDOR_URL);
    expect(destinos).toContain(CHECKOUT_EMPREENDEDOR_ANUAL_URL);
  });

  it("mantém preço e horário visíveis na primeira dobra e o chip de contagem oculto sem JS", () => {
    const hero = document.querySelector(".aula-hero");
    expect(hero?.textContent).toContain("R$ 29,99");
    expect(hero?.querySelector(".aula-schedule time")?.getAttribute("datetime")).toBe(INICIO_AO_VIVO);
    expect(hero?.querySelector(".aula-count")?.hasAttribute("hidden")).toBe(true);
  });

  it("mostra a simulação das três provas como imagem decorativa, sem iframe", () => {
    const terminal = document.querySelector(".aula-terminal");
    expect(terminal?.getAttribute("role")).toBe("img");
    expect(terminal?.querySelector("iframe")).toBeNull();
    expect(terminal?.textContent).toContain("plano-estudos.md");
  });

  it("preserva salto de conteúdo, landmarks e rodapé", () => {
    expect(document.querySelector('a.skip-link[href="#conteudo"]')).not.toBeNull();
    expect(document.querySelector("main#conteudo[tabindex='-1']")).not.toBeNull();
    expect(document.querySelector(".aula-presenter-art img")?.getAttribute("alt")).toBe("Douglas Gaspar");
    expect(document.querySelector("footer")).not.toBeNull();
  });

  it("renderiza todas as seções do texto aprovado", () => {
    for (const id of ["programa", "pecas", "entregavel", "agenda", "requisitos", "publico", "preco", "perguntas"]) {
      expect(document.getElementById(id)).not.toBeNull();
    }
    expect(document.querySelectorAll(".aula-etapas li")).toHaveLength(3);
    expect(document.querySelectorAll(".aula-pecas-list li")).toHaveLength(4);
    expect(document.querySelectorAll(".aula-kit-list li")).toHaveLength(5);
    expect(document.querySelectorAll(".aula-agenda-track li")).toHaveLength(4);
    expect(document.querySelectorAll(".aula-faq details")).toHaveLength(8);
  });

  it("apresenta as duas opções de acesso do plano Empreendedor", () => {
    const planos = [...document.querySelectorAll(".aula-plano")];
    expect(planos).toHaveLength(2);
    const texto = planos.map((plano) => plano.textContent ?? "").join(" ");
    expect(texto).toContain("Empreendedor");
    expect(texto).toContain("R$ 29,99");
    expect(texto).toContain("30 dias de acesso");
    expect(texto).toContain("R$ 299,99");
    expect(texto).toContain("12 meses de acesso");
    expect(texto).not.toContain("IA Coder");
    expect(texto).not.toContain("47,99");
    const destaque = document.querySelector(".aula-plano--destaque");
    expect(destaque?.textContent).toContain("Escolha da aula");
    expect(destaque?.textContent).toContain("30 dias de acesso");
    expect(document.getElementById("preco-title")?.textContent).toContain("plano Empreendedor");
  });

  it("apresenta somente Curioso e Empreendedor na FAQ", () => {
    const ultima = document.querySelector(".aula-faq details:last-of-type");
    expect(ultima?.textContent).toContain("Curioso");
    expect(ultima?.textContent).toContain("Empreendedor");
    expect(ultima?.textContent).not.toContain("47,99");
    expect(ultima?.textContent).not.toContain("IA Coder");
  });

  it("deriva os metadados de compartilhamento da capa da aula", () => {
    expect(document.querySelector('meta[property="og:image"]')?.getAttribute("content")).toContain("/images/aula-agente-capa.png");
    expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toBeTruthy();
    expect(document.title).toContain("MasterClass");
  });

  it("mantém a rota fora do sitemap enquanto não publicada", async () => {
    const { GET, indexablePaths } = await import("../../pages/sitemap.xml");
    const response = await GET({ site: new URL("https://douglasgaspar.com/") } as Parameters<typeof GET>[0]);
    const xml = await response.text();
    expect(xml.includes("<loc>https://douglasgaspar.com/lab/aula-agente/</loc>")).toBe(PUBLICADO);
    expect(indexablePaths.includes("/lab/aula-agente/")).toBe(PUBLICADO);
  });
});

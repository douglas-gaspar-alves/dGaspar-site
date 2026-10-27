// @vitest-environment jsdom
import { existsSync, readFileSync } from "node:fs";
import { URL as NodeURL } from "node:url";
import { describe, expect, it } from "vitest";
import data from "../../data/proxima-aula.json";

const builtPage = new NodeURL("../../../dist/lab/proxima-aula/index.html", import.meta.url);
const html = existsSync(builtPage) ? readFileSync(builtPage, "utf8") : "";
const document = new DOMParser().parseFromString(html, "text/html");
const signupUrl = data.cadastroUrl;

describe("modelo da próxima aula", () => {
  // SPECSFY: US-001 FR-001 NFR-001 AC-001
  it("gera a rota pública com um título principal e retorno ao site", () => {
    expect(document.querySelectorAll("h1")).toHaveLength(1);
    expect(document.querySelector('header a[href="/"]')).not.toBeNull();
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe("https://douglasgaspar.com/lab/proxima-aula/");
  });

  // SPECSFY: US-001 FR-001 NFR-001 AC-001
  it("mantém o cadastro junto ao vídeo e repete o mesmo destino sem interceptação", () => {
    const hero = document.querySelector(".next-hero");
    expect(hero?.querySelector("[data-lesson-video]")).not.toBeNull();
    expect(hero?.querySelector(`a[href="${signupUrl}"]`)).not.toBeNull();
    const ctas = [...document.querySelectorAll<HTMLAnchorElement>(".next-signup")];
    expect(ctas).toHaveLength(3);
    for (const cta of ctas) {
      expect(cta.href).toBe(signupUrl);
      expect(cta.target).toBe("_blank");
      expect(cta.rel).toContain("noopener");
      expect(cta.textContent).toContain(data.ctaTexto);
      expect(cta.hasAttribute("data-lab-signup-open")).toBe(false);
    }
  });

  // SPECSFY: US-001 FR-001 NFR-001 AC-001
  it("liga o botão da Home à página do LAB em nova aba", () => {
    const home = new DOMParser().parseFromString(readFileSync(new NodeURL("../../../dist/index.html", import.meta.url), "utf8"), "text/html");
    const link = [...home.querySelectorAll("a")].find((a) => a.textContent?.trim() === "Próxima aula");
    expect(link?.getAttribute("href")).toBe("https://lab.douglasgaspar.com/proxima-aula");
    expect(link?.getAttribute("target")).toBe("_blank");
    expect(link?.getAttribute("rel")).toBe("noreferrer");
  });

  // SPECSFY: US-001 FR-001 NFR-001 AC-002
  it("reserva o espaço do vídeo sem carregar iframe antes do clique", () => {
    const video = document.querySelector("[data-lesson-video]");
    expect(video).not.toBeNull();
    expect(video?.querySelector("iframe")).toBeNull();
    const cover = video?.querySelector("img");
    expect(cover?.getAttribute("width")).toBe("1280");
    expect(cover?.getAttribute("height")).toBe("720");
    expect(cover?.getAttribute("src")).toBeTruthy();
  });

  // SPECSFY: US-001 FR-001 NFR-001 AC-002
  it("reflete a disponibilidade do vídeo informada no conteúdo", () => {
    const video = document.querySelector("[data-lesson-video]");
    if (data.youtubeId) {
      expect(video?.querySelector("button[data-video-play]")).not.toBeNull();
      expect(video?.querySelector('a[href*="youtube.com/watch"]')?.getAttribute("href")).toBe(`https://www.youtube.com/watch?v=${data.youtubeId}`);
    } else {
      expect(video?.textContent).toContain("Apresentação em preparação");
      expect(video?.querySelector("button")).toBeNull();
      expect(video?.querySelector('a[href*="youtube.com/watch"]')).toBeNull();
    }
  });

  // SPECSFY: US-001 FR-001 NFR-001 AC-002
  it("preserva salto de conteúdo, landmarks e imagem do apresentador", () => {
    expect(document.querySelector('a.skip-link[href="#conteudo"]')).not.toBeNull();
    expect(document.querySelector('main#conteudo[tabindex="-1"]')).not.toBeNull();
    expect(document.querySelector(".next-presenter-art img")?.getAttribute("alt")).toBe(data.apresentador.imagemAlt);
    expect(document.querySelector("footer")).not.toBeNull();
  });

  // SPECSFY: US-001 FR-001 NFR-001 AC-003
  it("reflete o estado editorial e a data sem inventar disponibilidade", () => {
    expect(document.querySelector('meta[name="robots"]')?.getAttribute("content") ?? null).toBe(data.publicado ? null : "noindex, nofollow");
    expect(document.querySelector(".next-preview") !== null).toBe(!data.publicado);
    if (!data.inicio) expect(document.querySelector(".next-schedule")?.textContent).toContain("Data a definir");
    else expect(document.querySelector(".next-schedule time")?.getAttribute("datetime")).toBe(data.inicio);
  });

  // SPECSFY: US-001 FR-001 NFR-001 AC-003
  it("omite seções editoriais opcionais vazias em vez de inventar o programa", () => {
    expect(document.querySelector(".next-closing")).not.toBeNull();
    for (const [id, items] of [["programa", data.topicos], ["para-quem", data.publico], ["preparacao", data.preparacao], ["duvidas", data.duvidas]] as const) {
      expect(document.getElementById(id) !== null).toBe(items.length > 0);
    }
  });

  // SPECSFY: US-001 FR-001 NFR-001 AC-003
  it("deriva os metadados do conteúdo e inclui uma capa de compartilhamento", () => {
    expect(document.title).toContain("Próxima aula");
    expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toBeTruthy();
    expect(document.querySelector('meta[property="og:image"]')?.getAttribute("content")).toContain(data.capa);
    expect(document.querySelector("h1")?.textContent).toBe(`${data.titulo} ${data.destaque}`.trim());
    expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(data.resumo);
  });
});

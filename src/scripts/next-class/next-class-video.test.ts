// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { initLessonVideos } from "../next-class-video";

describe("player sob demanda", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div data-lesson-video data-youtube-id="abcdefghijk" data-video-title="Apresentação de teste"><div data-video-frame><img alt="Capa" /><button data-video-play>Reproduzir</button></div><a href="https://www.youtube.com/watch?v=abcdefghijk">Assistir no YouTube</a><p class="sr-only" data-video-status role="status"></p></div><a class="next-signup" href="https://example.com">Cadastro</a>';
  });

  it("não cria conexões via iframe antes da interação e mantém um único player após cliques repetidos", () => {
    initLessonVideos();
    initLessonVideos();
    const button = document.querySelector<HTMLButtonElement>("button")!;
    expect(document.querySelector("iframe")).toBeNull();
    button.click();
    button.click();
    expect(document.querySelectorAll("iframe")).toHaveLength(1);
    expect(document.querySelector("iframe")?.src).toContain("https://www.youtube-nocookie.com/embed/abcdefghijk?");
  });

  it("transfere foco ao player, dá título acessível e preserva o cadastro e o link alternativo", () => {
    initLessonVideos();
    document.querySelector<HTMLButtonElement>("button")!.click();
    const iframe = document.querySelector("iframe")!;
    expect(iframe.title).toBe("Apresentação de teste");
    expect(iframe.allowFullscreen).toBe(true);
    expect(document.activeElement).toBe(iframe);
    expect(document.querySelector("[role=status]")?.textContent).toContain("Player carregado");
    expect(document.querySelector(".next-signup")).not.toBeNull();
    expect(document.querySelector('a[href*="youtube.com/watch"]')).not.toBeNull();
  });

  it("mantém a capa e exibe recuperação textual se os dados do player forem inválidos", () => {
    document.querySelector<HTMLElement>("[data-lesson-video]")!.dataset.youtubeId = "inválido";
    initLessonVideos();
    document.querySelector<HTMLButtonElement>("button")!.click();
    expect(document.querySelector("iframe")).toBeNull();
    expect(document.querySelector("img")).not.toBeNull();
    expect(document.querySelector("[data-video-status]")?.classList.contains("sr-only")).toBe(false);
    expect(document.querySelector("[data-video-status]")?.textContent).toContain("Não foi possível");
    expect(document.querySelector(".next-signup")).not.toBeNull();
  });

  it("não transforma a capa de uma aula sem vídeo em um botão quebrado", () => {
    document.querySelector("button")!.remove();
    expect(() => initLessonVideos()).not.toThrow();
    expect(document.querySelector("iframe")).toBeNull();
  });
});

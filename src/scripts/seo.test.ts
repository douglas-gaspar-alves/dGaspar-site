import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { GET, indexablePaths } from "../pages/sitemap.xml";

const source = (path: string) => readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");
const publicFile = (path: string) => readFileSync(fileURLToPath(new URL(`../../public/${path}`, import.meta.url)), "utf8");

describe("descoberta das páginas públicas", () => {
  it("publica apenas rotas aprovadas no sitemap e aponta para ele no robots.txt", async () => {
    const response = await GET({ site: new URL("https://douglasgaspar.com/") } as Parameters<typeof GET>[0]);
    const xml = await response.text();

    expect(response.headers.get("Content-Type")).toContain("application/xml");
    for (const path of indexablePaths) {
      expect(xml).toContain(`<loc>https://douglasgaspar.com${path}</loc>`);
    }
    expect(xml).not.toContain("agente-de-ia-pessoal");
    expect(xml).not.toContain("obrigado");
    expect(xml).not.toContain("bem-vindo");
    expect(publicFile("robots.txt")).toContain("Sitemap: https://douglasgaspar.com/sitemap.xml");
    expect(publicFile("robots.txt")).not.toContain("Disallow:");
  });

  it("mantém a oferta pendente e as páginas pós-conversão fora do índice", () => {
    expect(source("pages/consultorias/agente-de-ia-pessoal.astro")).toMatch(/\snoindex\s/);
    expect(source("pages/lab/obrigado.astro")).toMatch(/\snoindex\s/);
    expect(source("pages/lab/bem-vindo.astro")).toMatch(/\snoindex\s/);
    expect(source("pages/lab/bem-vindo.astro")).toContain('canonical="https://douglasgaspar.com/lab/bem-vindo/"');
    expect(source("lib/lab-signup.ts")).toContain('"https://douglasgaspar.com/lab/bem-vindo/"');
  });

  it("gera um grafo legível por máquina com URLs canônicas e JSON seguro", () => {
    const layout = source("layouts/SiteLayout.astro");
    expect(layout).toContain('"@type": "WebPage"');
    expect(layout).toContain('"@type": "Service"');
    expect(layout).toContain('"@id": `${canonical}#webpage`');
    expect(layout).toContain(String.raw`JSON.stringify(schemaData).replace(/</g, "\\u003c")`);
    expect(source("pages/servicos/criacao-de-sites.astro")).toContain('schemaKind="site-creation"');
    expect(publicFile("llms.txt")).toContain("https://douglasgaspar.com/consultorias/");
  });

  it("mantém destinos de navegação e salto de conteúdo acessíveis nas rotas de confirmação", () => {
    expect(source("components/LabHeader.astro")).toContain('"/lab/#planos"');
    expect(source("layouts/SiteLayout.astro")).toContain('id="conteudo" tabindex="-1"');
    expect(source("components/HomeHero.astro")).toContain('class="hero-tools" aria-hidden="true"');
    expect(source("components/HomeProjects.astro")).toContain('href="/lab/"');
    expect(source("components/LabSignupModal.astro")).toContain('role="alert" tabindex="-1"');
  });
});

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const pagePath = fileURLToPath(new URL("../pages/servicos/criacao-de-sites.astro", import.meta.url));
const homePath = fileURLToPath(new URL("../pages/index.astro", import.meta.url));
const stylesPath = fileURLToPath(new URL("../styles/service-page.css", import.meta.url));

describe("SPECSFY: US-001 FR-001 FR-002 FR-003 NFR-001", () => {
  it("SPECSFY: US-001 FR-001 FR-002 FR-003 NFR-001 NFR-002 AC-001 links the Home service to the route", async () => {
    const home = await readFile(homePath, "utf8");
    expect(home).toContain('href="/servicos/criacao-de-sites/"');
  });

  it("SPECSFY: US-001 FR-001 FR-002 FR-003 NFR-001 NFR-002 AC-002 explains both roles of AI", async () => {
    const page = await readFile(pagePath, "utf8");
    expect(page).toContain("IA pode apoiar a criação");
    expect(page).toContain("pode fazer parte do site");
  });

  it("SPECSFY: US-001 FR-001 FR-002 FR-003 NFR-001 NFR-002 AC-003 offers a proposal CTA by email", async () => {
    const page = await readFile(pagePath, "utf8");
    const styles = await readFile(stylesPath, "utf8");
    expect(page).toContain("mailto:contato@douglasgaspar.com?subject=Cria%C3%A7%C3%A3o%20de%20sites%20%E2%80%94%20quero%20uma%20proposta");
    expect(styles).toContain("@media(max-width:720px)");
  });
});

import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Suíte TDD da fatia 0005 — página de obrigado do LAB (pós-compra Cakto).
// Cada caso deriva de um AC Gherkin da spec e recebe seu próprio marcador
// SPECSFY (um marcador por caso, sem criar .feature).

const source = (relative: string) => readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");
const exists = (relative: string) => existsSync(fileURLToPath(new URL(relative, import.meta.url)));

const pageFile = "../pages/lab/obrigado.astro";
const libFile = "../lib/lab-obrigado.ts";
const distFile = "../../dist/lab/obrigado/index.html";

const pageReady = "RED da fatia: página `lab/obrigado.astro` ainda não criada (T008)";
const libReady = "RED da fatia: lib `lab-obrigado.ts` ainda não criada (T007)";
const buildReady = "RED da fatia: build de produção pendente — rode `npm run build` (T011)";

describe("página de obrigado do LAB (pós-compra)", () => {
  it("compõe a rota com o layout do site e os dois contatos pós-compra", () => {
    // SPECSFY: US-001 FR-001 FR-002 FR-003 NFR-001 NFR-002 AC-001
    expect(exists(pageFile), pageReady).toBe(true);
    const page = source(pageFile);
    expect(page).toContain('canonical="https://douglasgaspar.com/lab/obrigado/"');
    expect(page).toContain('bodyClass="lab-page"');
    for (const name of ["SiteLayout", "LabHeader", "LabFooter"]) {
      expect(page).toContain(`<${name}`);
    }
    expect(page).toContain("lab-welcome");
    expect(page).toContain("aria-labelledby");
    // ações de AC-001: suporte WhatsApp + portal da comunidade
    expect(page).toContain("SUPPORT_WHATSAPP_URL");
    expect(page).toContain("SIGNUP_MEMBER_URL");
  });

  it("confirma a compra sem prometer acesso imediato nem prazo fixo", () => {
    // SPECSFY: US-001 FR-002 NFR-002 NFR-003 NFR-004 AC-002
    expect(exists(pageFile), pageReady).toBe(true);
    const page = source(pageFile);
    // confirmação e explicação da liberação manual (FR-002)
    expect(page).toContain("compra confirmada");
    expect(page).toContain("liberação manual");
    // copy honesta: nenhum prazo prometido e nenhum acesso automático prometido
    expect(page).not.toContain("acesso liberado automaticamente");
    expect(page).not.toContain("24 horas");
    expect(page).not.toContain("mesmo dia");
    // rótulos dos dois links (NFR-002) e nenhum formulário/PII (NFR-003/004)
    expect(page).toContain("WhatsApp");
    expect(page).not.toMatch(/type="email"/i);
    expect(page).not.toMatch(/<form\b/i);
  });

  it("expõe a lib estática com o rollback documentado e sem I/O", () => {
    // SPECSFY: US-001 FR-002 FR-004 AC-003
    expect(exists(libFile), libReady).toBe(true);
    const lib = source(libFile);
    expect(lib).toContain('export const LAB_OBRIGADO_URL = "https://douglasgaspar.com/lab/obrigado/"');
    expect(lib).toMatch(/export const SUPPORT_WHATSAPP_URL = "https:\/\/wa\.me\/5522992591418/);
    expect(lib).toContain("REDIRECT_WIRING");
    // estado de rollback documentado (FR-004): mesma operação desliga o redirect
    const off = lib.slice(lib.indexOf("off:"));
    expect(off).toContain("upsell: false");
    expect(off).toContain('upsellPage: ""');
    // sem I/O na lib pura
    expect(lib).not.toMatch(/\bfetch\(/);
    expect(lib).not.toMatch(/\baxios\b/);
  });

  it("produz HTML compilado correto no build de produção", () => {
    // SPECSFY: US-001 FR-001 FR-003 NFR-001 NFR-002 NFR-003 NFR-004 AC-004
    expect(exists(distFile), buildReady).toBe(true);
    const html = source(distFile);
    expect(html).toContain('<link rel="canonical" href="https://douglasgaspar.com/lab/obrigado/">');
    expect(html).toContain("lab-page");
    expect(html.split("<h1").length - 1).toBe(1);
    // zero tracker/PII/pixel no HTML final
    expect(html).not.toContain("gtag(");
    expect(html).not.toContain("www.facebook.com/tr");
    expect(html).not.toContain('type="email"');
  });

  it("mantém o contrato de regressão: classes LAB, zero scripts de página e rollback intacto", () => {
    // SPECSFY: US-001 FR-001 FR-004 NFR-001 NFR-003 NFR-004 AC-005
    expect(exists(distFile), buildReady).toBe(true);
    const html = source(distFile);
    // identidade visual LAB no HTML compilado (NFR-001)
    expect(html).toContain('class="lab-page"');
    expect(html).toContain("lab-welcome");
    expect(html).toContain("lab-kicker");
    // página estática: nenhum script do comprador-carreira (NFR-003) e sem trackers (NFR-004)
    expect(html).not.toContain("gtag(");
    expect(html).not.toContain("www.facebook.com/tr");
    // payload de rollback permanece documentado e utilizável (FR-004)
    const lib = source(libFile);
    const off = lib.slice(lib.indexOf("off:"));
    expect(off).toContain("upsell: false");
    expect(off).toContain('upsellPage: ""');
  });

  it("alinha canonical da página, constante da lib e alvo do wiring", () => {
    // SPECSFY: US-001 FR-003 FR-004 AC-006
    expect(exists(libFile), libReady).toBe(true);
    const lib = source(libFile);
    const url = lib.match(/export const LAB_OBRIGADO_URL = "([^"]+)"/)?.[1] ?? "";
    expect(url).toBe("https://douglasgaspar.com/lab/obrigado/");
    // wiring ativo aponta para a mesma URL única usada no `upsellPage` (R-001/R-003)
    expect(lib).toContain("on: { upsell: true, upsellPage: LAB_OBRIGADO_URL }");
    expect(exists(pageFile), pageReady).toBe(true);
    expect(source(pageFile)).toContain(`canonical="${url}"`);
  });
});

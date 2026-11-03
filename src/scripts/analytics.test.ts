import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_GA_MEASUREMENT_ID,
  DEFAULT_META_PIXEL_ID,
  GA_MEASUREMENT_ID,
  META_PIXEL_ID,
} from "../lib/analytics";

// Suíte da medição GA4 — cobre o contrato entre a lib, o componente, o layout
// e o HTML compilado. O snippet só pode existir com um ID válido e precisa
// continuar desligável nas páginas que não devem rastrear.

const source = (relative: string) => readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");
const exists = (relative: string) => existsSync(fileURLToPath(new URL(relative, import.meta.url)));

const homeBuilt = "../../dist/index.html";
const buildReady = "build de produção pendente — rode `npm run build`";

describe("medição GA4 do site", () => {
  it("expõe o ID de métricas do fluxo web de douglasgaspar.com", () => {
    expect(DEFAULT_GA_MEASUREMENT_ID).toBe("G-739P03GM5K");
    // sem PUBLIC_GA_MEASUREMENT_ID no ambiente de teste, vale o padrão
    expect(GA_MEASUREMENT_ID).toBe(DEFAULT_GA_MEASUREMENT_ID);
  });

  it("carrega o gtag.js assíncrono e configura a propriedade", () => {
    const component = source("../components/GoogleAnalytics.astro");
    expect(component).toContain("https://www.googletagmanager.com/gtag/js?id=");
    expect(component).toContain(`gtag("config","\${safeId}")`);
    expect(component).toContain("window.dataLayer=window.dataLayer||[]");
    // sem ID válido o componente não emite nada
    expect(component).toContain("{safeId && (");
  });

  it("injeta a medição no head do layout com opt-out por página", () => {
    const layout = source("../layouts/SiteLayout.astro");
    expect(layout).toContain('import GoogleAnalytics from "../components/GoogleAnalytics.astro"');
    expect(layout).toContain("analytics && <GoogleAnalytics />");
    expect(layout).toContain("analytics = true,");
    expect(layout).toContain("analytics?: boolean;");
  });

  it("publica o snippet no HTML compilado da Home", () => {
    // SPECSFY: NFR-001
    expect(exists(homeBuilt), buildReady).toBe(true);
    const html = source(homeBuilt);
    expect(html).toContain("https://www.googletagmanager.com/gtag/js?id=G-739P03GM5K");
    expect(html).toContain(`gtag("config","G-739P03GM5K")`);
    // o carregador não pode bloquear a renderização
    expect(html).toMatch(/<script[^>]+async[^>]+googletagmanager\.com\/gtag\/js/);
  });
});

describe("Pixel da Meta no site", () => {
  it("expõe o ID do Pixel HubWeb", () => {
    expect(DEFAULT_META_PIXEL_ID).toBe("1470769825003164");
    expect(META_PIXEL_ID).toBe(DEFAULT_META_PIXEL_ID);
  });

  it("inicializa o Pixel e dispara PageView sem emitir snippet sem ID", () => {
    const component = source("../components/MetaPixel.astro");
    expect(component).toContain("https://connect.facebook.net/en_US/fbevents.js");
    expect(component).toContain('fbq("init","${safeId}")');
    expect(component).toContain('fbq("track","PageView")');
    expect(component).toContain("www.facebook.com/tr?id=");
    expect(component).toContain("ev=PageView");
    expect(component).toContain("{safeId && (");
  });

  it("injeta o Pixel no mesmo opt-out do layout", () => {
    const layout = source("../layouts/SiteLayout.astro");
    expect(layout).toContain('import MetaPixel from "../components/MetaPixel.astro"');
    expect(layout).toContain("analytics && <MetaPixel />");
  });

  it("publica o PageView no HTML compilado da Home", () => {
    expect(exists(homeBuilt), buildReady).toBe(true);
    const html = source(homeBuilt);
    expect(html).toContain("https://connect.facebook.net/en_US/fbevents.js");
    expect(html).toContain('fbq("init","1470769825003164")');
    expect(html).toContain('fbq("track","PageView")');
    expect(html).toContain("https://www.facebook.com/tr?id=1470769825003164&amp;ev=PageView&amp;noscript=1");
  });
});

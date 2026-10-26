import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const pagePath = fileURLToPath(new URL("../pages/servicos/criacao-de-sites.astro", import.meta.url));
const homePath = fileURLToPath(new URL("../pages/index.astro", import.meta.url));
const homeServicesPath = fileURLToPath(new URL("../components/HomeServices.astro", import.meta.url));
const serviceAIPath = fileURLToPath(new URL("../components/ServiceAI.astro", import.meta.url));
const serviceHeroPath = fileURLToPath(new URL("../components/ServiceHero.astro", import.meta.url));
const contactLinksPath = fileURLToPath(new URL("../lib/contact-links.ts", import.meta.url));
const bookingLinkPath = fileURLToPath(new URL("../lib/booking-link.ts", import.meta.url));
const stylesPath = fileURLToPath(new URL("../styles/service-page.css", import.meta.url));

describe("SPECSFY: US-001 FR-001 FR-002 FR-003 NFR-001", () => {
  it("SPECSFY: US-001 FR-001 FR-002 FR-003 NFR-001 NFR-002 AC-001 links the Home service to the route", async () => {
    const home = await readFile(homePath, "utf8");
    const services = await readFile(homeServicesPath, "utf8");
    expect(home).toContain("<HomeServices />");
    expect(services).toContain('siteHref = "/servicos/criacao-de-sites/"');
    expect(services).toContain('href={siteHref}');
  });

  it("SPECSFY: US-001 FR-001 FR-002 FR-003 NFR-001 NFR-002 AC-002 explains both roles of AI", async () => {
    const page = await readFile(pagePath, "utf8");
    const serviceAI = await readFile(serviceAIPath, "utf8");
    expect(page).toContain("<ServiceAI />");
    expect(serviceAI).toContain("IA pode apoiar a criação");
    expect(serviceAI).toContain("pode fazer parte do site");
  });

  it("SPECSFY: US-001 FR-001 FR-002 FR-003 NFR-001 NFR-002 AC-003 offers a proposal CTA through scheduling", async () => {
    const page = await readFile(pagePath, "utf8");
    const hero = await readFile(serviceHeroPath, "utf8");
    const links = await readFile(contactLinksPath, "utf8");
    const bookingLink = await readFile(bookingLinkPath, "utf8");
    const styles = await readFile(stylesPath, "utf8");
    expect(page).toContain("<ServiceHero />");
    expect(hero).toContain("proposalHref = siteCreationProposalHref");
    expect(hero).toContain("href={proposalHref}");
    expect(links).toContain("export const siteCreationProposalHref = firstConsultationHref");
    expect(bookingLink).toContain("https://cal.com/douglasgaspar/consultorias-servicos?overlayCalendar=true");
    expect(page).toContain('<BookingDialog variant="sites" />');
    expect(hero).toContain("data-booking-open");
    expect(styles).toContain("@media (max-width: 720px)");
  });
});

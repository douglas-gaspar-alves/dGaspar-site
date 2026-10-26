import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync(new URL("../pages/consultorias/index.astro", import.meta.url), "utf8");
const home = readFileSync(new URL("../pages/index.astro", import.meta.url), "utf8");
const homePaths = readFileSync(new URL("../components/HomePaths.astro", import.meta.url), "utf8");
const homeServices = readFileSync(new URL("../components/HomeServices.astro", import.meta.url), "utf8");
const layout = readFileSync(new URL("../layouts/SiteLayout.astro", import.meta.url), "utf8");
const css = readFileSync(new URL("../styles/global.css", import.meta.url), "utf8");
const hero = readFileSync(new URL("../components/ConsultingHero.astro", import.meta.url), "utf8");
const orientation = readFileSync(new URL("../components/ConsultingOrientation.astro", import.meta.url), "utf8");
const boundary = readFileSync(new URL("../components/ConsultingBoundary.astro", import.meta.url), "utf8");
const technicalCta = readFileSync(new URL("../components/ConsultingTechnicalCTA.astro", import.meta.url), "utf8");
const consultingCta = readFileSync(new URL("../components/ConsultingCTA.astro", import.meta.url), "utf8");
const contactLinks = readFileSync(new URL("../lib/contact-links.ts", import.meta.url), "utf8");
const bookingLink = readFileSync(new URL("../lib/booking-link.ts", import.meta.url), "utf8");

describe("página de consultorias", () => {
	it("apresenta a primeira consultoria gratuita sem prometer duração ou resultado", () => {
		expect(page).toContain("<ConsultingHero />");
		expect(page).toContain("<ConsultingBoundary />");
		expect(hero).toContain("Consultoria individual · online");
		expect(consultingCta).toContain("A primeira consultoria é gratuita");
		expect(boundary).toContain("proposta separada");
		expect(hero + orientation + boundary).not.toMatch(/duração|garantid[oa]|resultado garantido/i);
	});

	it("direciona os CTAs de consultoria ao agendamento", () => {
		expect(contactLinks).toContain("firstConsultationHref = bookingCalendarUrl");
		expect(bookingLink).toContain("https://cal.com/douglasgaspar/consultorias-servicos?overlayCalendar=true");
		expect(page).toContain('<BookingDialog variant="negocio" />');
		expect(hero).toContain("data-booking-open");
		expect(orientation).toContain("data-booking-open");
		expect(consultingCta).toContain("data-booking-open");
		expect(consultingCta).not.toContain("mailto:");
	});

	it("dá um destino real para o público técnico sem anunciar uma página pronta", () => {
		expect(page).toContain("<ConsultingTechnicalCTA />");
		expect(technicalCta).toContain("Sou técnico");
		expect(technicalCta).toContain("vibe coding ou no-code");
		expect(technicalCta).toContain("ctaHref = technicalContactHref");
		expect(technicalCta).toContain("href={ctaHref}");
		expect(contactLinks).toContain("export const technicalContactHref = mailTo(");
	});

	it("conecta a home à rota própria e preserva o layout responsivo", () => {
		expect(home).toContain("<HomePaths />");
		expect(home).toContain("<HomeServices />");
		expect(homePaths).toContain('path04Href = "/consultorias/"');
		expect(homePaths).toContain('href={path.href}');
		expect(homeServices).toContain('businessHref = "/consultorias/"');
		expect(homeServices).toContain('href={businessHref}');
		expect(hero).toContain('class="wrap consulting-page-hero-content"');
		expect(page).not.toContain('class="consulting-page-hero-visual"');
		expect(css).toContain("/images/consultorias-hero.webp");
		expect(css).toContain(".consulting-topic-grid");
		expect(css).toContain(".consulting-page-header-inner");
	});

	it("troca a imagem de fundo do herói apenas no celular", () => {
		const desktop = css.slice(css.indexOf(".consulting-page-hero{"), css.indexOf(".consulting-page-hero::before{"));
		expect(desktop).toContain("/images/consultorias-hero.webp");
		expect(desktop).not.toContain("consultorias-hero-mobile.webp");

		const start = css.indexOf("@media(max-width:640px){.consulting-page-header-inner");
		expect(start).toBeGreaterThan(-1);
		let depth = 0;
		let end = start;
		for (let i = start; i < css.length; i++) {
			if (css[i] === "{") depth++;
			else if (css[i] === "}" && --depth === 0) { end = i + 1; break; }
		}
		const mobile = css.slice(start, end);
		expect(mobile).toContain("/images/consultorias-hero-mobile.webp");
		expect(mobile).not.toContain("/images/consultorias-hero.webp");
	});

	it("ancora o texto no topo e amplia a cena no celular para revelar a tela do notebook", () => {
		const start = css.indexOf("@media(max-width:640px){.consulting-page-header-inner");
		let depth = 0;
		let end = start;
		for (let i = start; i < css.length; i++) {
			if (css[i] === "{") depth++;
			else if (css[i] === "}" && --depth === 0) { end = i + 1; break; }
		}
		const mobile = css.slice(start, end);
		expect(mobile).toMatch(/\.consulting-page-hero\{[^}]*align-items:flex-start/);
		expect(mobile).toMatch(/\.consulting-page-hero\{[^}]*background-size:auto 118%/);
		expect(mobile).toMatch(/\.consulting-page-hero\{[^}]*background-position:52% 0%/);
		// o véu branco acompanha o texto para cima e libera a parte de baixo da ilustração
		expect(mobile).toMatch(/\.consulting-page-hero::before\{[^}]*rgba\(238,245,255,\.24\) 86%/);
	});

	it("precarrega a imagem do herói de acordo com a tela", () => {
		expect(page).toContain('preloadDesktopImage="/images/consultorias-hero.webp"');
		expect(page).toContain('preloadMobileImage="/images/consultorias-hero-mobile.webp"');
		expect(layout).toContain('href={preloadDesktopImage}');
		expect(layout).toContain('media="(min-width: 641px)"');
		expect(layout).toContain('href={preloadMobileImage}');
		expect(layout).toContain('media="(max-width: 640px)"');
	});
});

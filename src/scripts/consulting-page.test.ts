import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync(new URL("../pages/consultorias.astro", import.meta.url), "utf8");
const home = readFileSync(new URL("../pages/index.astro", import.meta.url), "utf8");
const css = readFileSync(new URL("../styles/global.css", import.meta.url), "utf8");
const hero = readFileSync(new URL("../components/ConsultingHero.astro", import.meta.url), "utf8");
const orientation = readFileSync(new URL("../components/ConsultingOrientation.astro", import.meta.url), "utf8");
const consultingCta = readFileSync(new URL("../components/ConsultingCTA.astro", import.meta.url), "utf8");
const contactLinks = readFileSync(new URL("../lib/contact-links.ts", import.meta.url), "utf8");

describe("página de consultorias", () => {
	it("apresenta a primeira consultoria gratuita sem prometer duração ou resultado", () => {
		expect(page).toContain("Consultoria individual · online");
		expect(page).toContain("A primeira consultoria é gratuita");
		expect(page).toContain("proposta separada");
		expect(page).not.toMatch(/duração|garantid[oa]|resultado garantido/i);
	});

	it("direciona os CTAs de consultoria ao agendamento", () => {
		expect(contactLinks).toContain("https://cal.com/douglasgaspar/consultorias-servicos");
		expect(hero).toContain("primaryHref = firstConsultationHref");
		expect(orientation).toContain("ctaHref = firstConsultationHref");
		expect(consultingCta).toContain("ctaHref = firstConsultationHref");
		expect(consultingCta).not.toContain("mailto:");
	});

	it("dá um destino real para o público técnico sem anunciar uma página pronta", () => {
		expect(page).toContain("Sou técnico");
		expect(page).toContain("vibe coding ou no-code");
		expect(page).toContain("href={technicalContact}");
	});

	it("conecta a home à rota própria e preserva o layout responsivo", () => {
		expect(home).toContain('href: "/consultorias/"');
		expect(home).toContain('href="/consultorias/"');
		expect(page).toContain('class="wrap consulting-page-hero-content"');
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
		expect(page).toContain('href="/images/consultorias-hero.webp"');
		expect(page).toContain('href="/images/consultorias-hero-mobile.webp"');
		expect(page).toMatch(/consultorias-hero\.webp[^>]*media="\(min-width: 641px\)"/);
		expect(page).toMatch(/consultorias-hero-mobile\.webp[^>]*media="\(max-width: 640px\)"/);
	});
});

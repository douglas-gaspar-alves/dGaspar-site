import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const home = readFileSync(new URL("../pages/index.astro", import.meta.url), "utf8");
const css = readFileSync(new URL("../styles/global.css", import.meta.url), "utf8");

describe("primeira dobra da Home", () => {
	it("prioriza o retrato, o wordmark e ferramentas independentes", () => {
		expect(home).toContain('class="hero-wordmark"');
		expect(home).toContain('src="/images/douglas-portrait.webp"');
		expect(home).toContain('class="hero-tools"');
		expect((home.match(/name: "/g) ?? []).length).toBeGreaterThanOrEqual(6);
	});

	it("remove o menu da primeira dobra e mantém os destinos sociais visíveis", () => {
		const hero = home.slice(home.indexOf('<section class="hero"'), home.indexOf("</section>"));
		expect(hero).not.toContain("menu-toggle");
		expect(hero).not.toContain("site-menu");
		expect(hero).not.toContain("site-header");
		expect(home).toContain('src="/images/acre-logo.webp"');
		expect(home).toContain('src="/images/icons/youtube.svg"');
		expect(home).toContain('src="/images/icons/instagram.svg"');
	});

	it("mantem um menu fixo e transparente que já nasce dentro do mapa", () => {
		expect(home).toContain('class="site-header"');
		expect(home).toContain('class="menu-toggle"');
		expect(home).toContain("Próxima aula");
		expect(css).toMatch(/\.site-header\{[^}]*position:sticky/);
		expect(css).toMatch(/\.header-inner\{[^}]*background:transparent/);
		expect(css).toMatch(/\.site-header\.is-stuck \.header-inner\{[^}]*backdrop-filter:/);
		expect(css).toMatch(/\.menu-panel\{[^}]*position:fixed/);
		expect(css).toMatch(/\.menu-panel\{[^}]*translateX\(100%\)/);
		expect(css).toMatch(/\.menu-panel\{[^}]*width:75%/);
		expect(css).toMatch(/\.menu-path\{[^}]*display:grid/);
		// o menu vive dentro da secao do mapa, que vem logo depois da hero
		const mapa = home.slice(home.indexOf('id="caminhos"'), home.indexOf('id="sobre"'));
		expect(mapa).toContain('class="site-header"');
		expect(mapa).toContain('class="paths-surface"');
		expect(home.indexOf('id="caminhos"')).toBeGreaterThan(home.indexOf('class="hero"'));
	});

	it("simplifica o titulo do mapa no celular", () => {
		const start = css.indexOf("@media(max-width:640px)");
		let depth = 0;
		let end = start;
		for (let i = start; i < css.length; i++) {
			if (css[i] === "{") depth++;
			else if (css[i] === "}" && --depth === 0) { end = i + 1; break; }
		}
		const mobile = css.slice(start, end);
		expect(mobile).toContain(".section-title-row>.section-index{display:none}");
		expect(mobile).toContain(".section-title-row>div:first-child{width:100%}");
	});

	it("coloca o mapa antes de quem eu sou", () => {
		expect(home.indexOf('id="caminhos"')).toBeLessThan(home.indexOf('id="sobre"'));
	});

	it("traz todos os ícones da base para a coroa da cabeça", () => {
		const icons = [...home.matchAll(/image: "\/images\/icons\/([a-z0-9]+)\.svg"/g)].map((match) => match[1]);
		expect(new Set(icons).size).toBe(11);
		expect(home).toContain('class="hero-tools-row hero-tools-row-front"');
		expect(home).toContain('class="hero-tools-row hero-tools-row-back"');
		expect(css).toMatch(/\.hero-tools-row-back\{[^}]*margin-bottom:/);
	});

	it("fixa o wordmark para gerar parallax e deixa a logo sem halo", () => {
		expect(css).toMatch(/\.hero-wordmark\{[^}]*position:fixed/);
		expect(css).not.toMatch(/\.hero-wordmark-logo\{[^}]*filter/);
	});

	it("mantem o retrato na frente do nome e as ferramentas sobre a cabeca", () => {
		const sceneZ = Number(css.match(/\.hero-scene\{[^}]*z-index:(\d+)/)?.[1] ?? 0);
		const markZ = Number(css.match(/\.hero-wordmark\{[^}]*z-index:(\d+)/)?.[1] ?? 0);
		expect(sceneZ).toBeGreaterThan(markZ);
		expect(home.indexOf('class="hero-portrait-stage"')).toBeLessThan(home.indexOf('class="hero-tools"'));
		expect(css).not.toMatch(/\.hero-tool\{[^}]*background:/);
	});

	it("declara dimensoes intrinsecas e textos alternativos nas imagens", () => {
		const images = home.match(/<img[^>]*>/g) ?? [];
		expect(images.length).toBeGreaterThan(0);
		for (const image of images) {
			expect(image).toMatch(/\bwidth=("|\{)/);
			expect(image).toMatch(/\bheight=("|\{)/);
			expect(image).toMatch(/\balt=("|\{)/);
		}
	});
});

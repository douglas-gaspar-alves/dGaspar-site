import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const component = (name: string) => readFileSync(fileURLToPath(new URL(`../components/${name}.astro`, import.meta.url)), "utf8");
const page = readFileSync(fileURLToPath(new URL("../pages/lab/index.astro", import.meta.url)), "utf8");
const css = readFileSync(fileURLToPath(new URL("../styles/lab-page.css", import.meta.url)), "utf8");

describe("página de vendas do LAB", () => {
  it("compõe a rota em seções e usa o layout do site", () => {
    expect(page).toContain('canonical="https://douglasgaspar.com/lab/"');
    expect(page).toContain('bodyClass="lab-page"');
    for (const name of ["LabHeader", "LabHero", "LabJourney", "LabPlans", "LabQuestions", "LabFooter"]) {
      expect(page).toContain(`<${name}`);
    }
  });

  // SPECSFY: US-001 FR-006 NFR-003 AC-013
  it("mostra só Curioso gratuito e Empreendedor, com a anuidade preservada", () => {
    const plans = component("LabPlans");
    for (const price of ["Grátis", "R$ 29,99 / mês", "R$ 299 / ano"]) {
      expect(plans).toContain(price);
    }
    expect(plans).not.toContain("R$ 47,99 / mês");
    expect(plans).not.toContain("R$ 470 / ano");
    expect(plans).not.toContain('name: "IA Coder"');
    expect(plans.match(/name: "/g)).toHaveLength(2);
  });

  it("leva o cadastro à rota real e a contratação paga ao checkout Cakto do Empreendedor", () => {
    expect(component("LabHero")).toContain("https://lab.douglasgaspar.com/?fcom_action=auth&form=register");
    expect(component("LabPlans")).toContain("href: CHECKOUT_MONTHLY_URL");
    expect(component("LabPlans")).not.toContain("CHECKOUT_CODER");
    expect(component("LabPlans")).not.toContain("CHECKOUT_PLUS");
    expect(component("LabPlans")).not.toContain("href: communityUrl");
    expect(component("LabPlans")).toContain("checkout seguro da Cakto");
    expect(component("LabQuestions")).toContain("Assinatura mensal");
  });

  // SPECSFY: US-001 FR-006 NFR-003 AC-014
  it("remove PRO Plus e selo Studio Alma dos planos e da FAQ", () => {
    for (const source of [component("LabPlans"), component("LabQuestions")]) {
      expect(source).not.toMatch(/PRO Plus|pro-plus|Selo Studio Alma/i);
    }
  });

  // SPECSFY: US-001 FR-006 NFR-003 AC-015
  it("inclui chat ilimitado no Empreendedor e chat limitado no Curioso", () => {
    const plans = component("LabPlans");
    const curioso = plans.slice(plans.indexOf('name: "Curioso"'), plans.indexOf('name: "Empreendedor"'));
    const empreendedor = plans.slice(plans.indexOf('name: "Empreendedor"'));
    expect(curioso).toContain("Chat Limitado");
    expect(curioso).not.toMatch(/chat ilimitado/i);
    expect(empreendedor).toContain("Chat ilimitado");
    expect(css).toContain("grid-template-columns: repeat(2, minmax(0, 1fr))");
  });

  it("explicita o que o plano gratuito não inclui e separa comunidade de consultoria", () => {
    expect(component("LabHero")).toContain("acesso limitado à trilha");
    expect(component("LabQuestions")).toContain("Consultorias e serviços de implementação");
    expect(component("LabQuestions")).toContain("nem promete resultados financeiros");
  });

  it("usa o logo do LAB no cabeçalho fixo, sem o logo do hub", () => {
    const header = component("LabHeader");
    expect(header).toContain("/images/logo-lab-escuro.svg");
    expect(header).toContain('alt="LAB dGaspar"');
    expect(header).not.toContain("logo-dgaspar");
    expect(css).toContain(".lab-header { position: sticky; top: 0");
    expect(css).toContain("backdrop-filter");
  });

  it("apresenta a headline de teste-prático e lead realista", () => {
    expect(component("LabHero")).toContain("Se aprendem criando.");
    expect(component("LabHero")).toContain("quem decide o resultado é o teste, não a opinião.");
    expect(component("LabHero")).not.toContain("juntar vídeos");
  });

  it("anima a arte do herói com órbitas e respeita movimento reduzido", () => {
    const hero = component("LabHero");
    expect(hero).toContain("lab-orbit-outer");
    expect(hero).toContain("lab-orbit-mid");
    expect(hero).toContain("lab-art-glow");
    for (const rule of ["@keyframes lab-spin", "@keyframes lab-float", "@keyframes lab-pulse"]) {
      expect(css).toContain(rule);
    }
    const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(reduced).toContain("lab-orbit");
    expect(reduced).toContain("animation: none");
  });
});

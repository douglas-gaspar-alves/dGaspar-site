import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const component = (name: string) => readFileSync(fileURLToPath(new URL(`../components/${name}.astro`, import.meta.url)), "utf8");
const page = readFileSync(fileURLToPath(new URL("../pages/consultorias/agente-de-ia-pessoal.astro", import.meta.url)), "utf8");
const links = readFileSync(fileURLToPath(new URL("../lib/contact-links.ts", import.meta.url)), "utf8");

describe("página da consultoria de agente de IA pessoal", () => {
  it("compõe a rota com os componentes da oferta e mantém a página fora do índice", () => {
    expect(page).toContain('canonical="https://douglasgaspar.com/consultorias/agente-de-ia-pessoal/"');
    expect(page).toContain('bodyClass="agent-page"');
    expect(page).toContain("noindex");
    for (const name of [
      "AgentHeader",
      "AgentHero",
      "AgentFreeOffer",
      "AgentRegistration",
      "AgentUseCases",
      "AgentGuided",
      "AgentScope",
      "AgentExecution",
      "AgentFaq",
      "AgentClosingCTA",
    ]) {
      expect(page).toContain(`<${name}`);
    }
  });

  it("usa a URL exata do Cal.com como cadastro, sem formulário local", () => {
    expect(links).toContain('"https://cal.com/douglasgaspar/consultorias-servicos"');
    expect(component("AgentHero")).toContain("firstConsultationHref");
    expect(component("AgentRegistration")).toContain("firstConsultationHref");
    expect(component("AgentClosingCTA")).toContain("firstConsultationHref");
    expect(component("AgentHero")).not.toContain("<form");
    expect(component("AgentRegistration")).not.toContain("<form");
  });

  it("separa a oferta gratuita das horas adicionais e da execução", () => {
    expect(component("AgentFreeOffer")).toContain("Diagnóstico passo a passo pré-montado");
    expect(component("AgentFreeOffer")).toContain("Configuração do agente na sua conta");
    expect(component("AgentGuided")).toContain("resumo escrito");
    expect(component("AgentExecution")).toContain("novo escopo e proposta");
    expect(component("AgentScope")).toContain("Garantia de resultado");
  });

  it("esclarece que a consulta gratuita não configura o agente", () => {
    expect(component("AgentHero")).toContain("não configura o seu agente");
    expect(component("AgentFaq")).toContain("A conversa gratuita já configura meu agente?");
    expect(component("AgentFaq")).toContain("A configuração na sua conta acontece apenas se você contratar horas adicionais");
  });

  it("identifica a agenda compartilhada e não promete personalização do roteiro", () => {
    expect(component("AgentRegistration")).toContain("Consultorias &amp; Serviços");
    expect(component("AgentRegistration")).toContain("45 minutos");
    expect(component("AgentFaq")).toContain("material passo a passo pré-montado");
    expect(component("AgentUseCases")).toContain("Não são cases entregues");
  });
});

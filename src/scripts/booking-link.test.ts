import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
	CONSULTING_FORM_WEBHOOK_URL,
	bookingCalendarUrl,
	buildBookingUrl,
	buildConsultingFormBody,
	formatTelefone,
	phoneForCal,
	validateCase,
	validateIdentity,
} from "../lib/booking-link";

const identity = {
	nome: "Ana Souza",
	email: "ana@exemplo.com",
	telefone: "(22) 99999-9999",
};

describe("agenda Cal.com", () => {
	it("mantém o link com overlayCalendar e preenche nome, e-mail e telefone", () => {
		const url = new URL(buildBookingUrl(identity, {
			variant: "negocio",
			negocio: "Padaria Centro",
			avaliar: "Atendimento e respostas repetidas",
			hoje: "As perguntas chegam no WhatsApp e alguém copia para a planilha.",
		}));

		expect(bookingCalendarUrl).toBe("https://cal.com/douglasgaspar/consultorias-servicos?overlayCalendar=true");
		expect(`${url.origin}${url.pathname}`).toBe("https://cal.com/douglasgaspar/consultorias-servicos");
		expect(url.searchParams.get("overlayCalendar")).toBe("true");
		expect(url.searchParams.get("name")).toBe("Ana Souza");
		expect(url.searchParams.get("email")).toBe("ana@exemplo.com");
		expect(url.searchParams.get("attendeePhoneNumber")).toBe("+5522999999999");
		expect(url.searchParams.get("title")).toBe("Padaria Centro");
		expect(url.searchParams.get("notes")).toContain("Página: /consultorias/");
	});

	it("não duplica o 55 e trata o DDD 55 como número local", () => {
		expect(phoneForCal("+55 22 99999-9999")).toBe("+5522999999999");
		expect(phoneForCal("(55) 99999-9999")).toBe("+5555999999999");
	});

	it("formata o WhatsApp enquanto a pessoa digita", () => {
		expect(formatTelefone("22999999999")).toBe("(22) 99999-9999");
	});

	it("exige os três dados antes de avançar", () => {
		expect(validateIdentity({ nome: "An", email: identity.email, telefone: identity.telefone })).toContain("nome");
		expect(validateIdentity({ nome: identity.nome, email: "ana", telefone: identity.telefone })).toContain("e-mail");
		expect(validateIdentity({ nome: identity.nome, email: identity.email, telefone: "2299" })).toContain("WhatsApp");
	});

	it("marca a origem de cada página nas notas", () => {
		const agente = buildBookingUrl(identity, {
			variant: "agente",
			tarefa: "Organizar notas de estudo",
			onde: "Notas e estudo",
			confirma: true,
		});
		const sites = buildBookingUrl(identity, {
			variant: "sites",
			negocio: "",
			precisa: "Um site novo",
			resolver: "Apresentar o negócio e receber contato.",
		});

		expect(new URL(agente).searchParams.get("title")).toBe("Uso pessoal");
		expect(new URL(agente).searchParams.get("notes")).toContain("/consultorias/agente-de-ia-pessoal/");
		expect(new URL(sites).searchParams.get("title")).toBe("Criação de sites");
		expect(new URL(sites).searchParams.get("notes")).toContain("/servicos/criacao-de-sites/");
		expect(validateCase({ variant: "agente", tarefa: "Nota", onde: "Notas e estudo", confirma: false })).toContain("não configura");
	});

	it("envia os campos da consultoria ao webhook e só então abre a agenda atual", () => {
		const body = buildConsultingFormBody(identity, {
			variant: "negocio",
			negocio: "Padaria Centro",
			avaliar: "Atendimento e respostas repetidas",
			hoje: "As perguntas chegam no WhatsApp.",
		}, "https://douglasgaspar.com/consultorias/?utm_source=ig");

		expect(CONSULTING_FORM_WEBHOOK_URL).toBe("https://webhook.douglasgaspar.com/webhook/servicos-geral");
		expect(body.get("nome")).toBe("Ana Souza");
		expect(body.get("email")).toBe("ana@exemplo.com");
		expect(body.get("telefone")).toBe("(22) 99999-9999");
		expect(body.get("negocio")).toBe("Padaria Centro");
		expect(body.get("avaliar")).toBe("Atendimento e respostas repetidas");
		expect(body.get("hoje")).toBe("As perguntas chegam no WhatsApp.");
		expect(body.get("proposta")).toBe("sim");
		expect(body.get("pagina")).toBe("/consultorias/");
		expect(body.get("origem")).toContain("/consultorias/");

		const dialog = readFileSync(new URL("./booking-dialog.ts", import.meta.url), "utf8");
		expect(dialog).toContain("CONSULTING_FORM_WEBHOOK_URL");
		expect(dialog).toContain('variant === "negocio"');
		expect(dialog).toContain("keepalive: true");
		expect(dialog).toContain("window.location.assign(destination)");
	});
});

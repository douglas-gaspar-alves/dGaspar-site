import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

const workflow = JSON.parse(readFileSync(new URL("../../integrations/lab-signup.workflow.json", import.meta.url), "utf8"));
interface WorkflowNode { name: string; type: string; parameters: Record<string, unknown> }
const nodes: WorkflowNode[] = workflow.nodes;
const get = (name: string) => nodes.find(n => n.name === name)!;
const execute = (name: string, response: unknown) => runInNewContext(`(function(){${get(name).parameters.jsCode}})()`, {
	$input: { first: () => ({ json: response }) },
	$: () => ({ first: () => ({ json: { email: "test@example.com" } }) }),
});

describe("contrato do rascunho n8n — sem executar serviços reais", () => {
	it("busca exata não confunde correspondência parcial com conta existente", () => {
		expect(execute("Resolver usuario existente", { statusCode: 200, body: [{ id: 1, email: "other@example.com" }] })[0].json.wp_id).toBe(0);
		expect(execute("Resolver usuario existente", { statusCode: 200, body: [{ id: 2, email: " TEST@example.com " }] })[0].json.wp_id).toBe(2);
	});
	it("criação exige confirmação por leitura e trata ausência/falha", () => {
		expect(execute("Resolver usuario criado", { statusCode: 200, body: [{ id: 3, email: "test@example.com" }] })[0].json.wp_id).toBe(3);
		expect(() => execute("Resolver usuario criado", { statusCode: 200, body: [] })).toThrow("wordpress_user_missing");
		expect(() => execute("Resolver usuario existente", { statusCode: 403, body: {} })).toThrow("wordpress_lookup_failed");
	});
	it("identidade comum exige ID positivo", () => {
		expect(execute("Identidade WordPress confirmada", { wp_id: 9 })[0].json.wp_id).toBe(9);
		expect(() => execute("Identidade WordPress confirmada", { wp_id: 0 })).toThrow();
	});
	it("CRM só conclui com ID de lead confirmado e HTTP 2xx", () => {
		const data = { data: { lead_id: "00000000-0000-4000-8000-000000000001" } };
		expect(execute("Confirmar conclusao", { statusCode: 200, body: data })[0].json).toMatchObject({ ok: true, status: "completed", response_code: 200 });
		for (const response of [{ statusCode: 200, body: {} }, { statusCode: 500, body: data }, { statusCode: 200, body: { data: { lead_id: "invalid" } } }]) expect(execute("Confirmar conclusao", response)[0].json.ok).toBe(false);
	});
	it("conta existente não passa pelo POST e nenhum nó altera usuário", () => {
		expect(workflow.connections).toContainEqual(["Usuario ja existe", "Identidade WordPress confirmada", 0]);
		expect(nodes.some(n => n.parameters.method === "PATCH" || n.parameters.method === "PUT")).toBe(false);
		expect(get("Criar usuario subscriber").parameters.jsonBody).toContain("roles: ['subscriber']");
		expect(get("Cadastrar no Deskcomm").parameters.jsonBody).toContain("'lab-free:wp:' + $json.wp_id");
	});
	it("entrada exige credencial e execuções não armazenam senha nem PII", () => {
		expect(get("Webhook").parameters.authentication).toBe("headerAuth");
		expect(workflow.settings).toMatchObject({ saveDataSuccessExecution: "none", saveDataErrorExecution: "none", saveManualExecutions: false, saveExecutionProgress: false });
		expect(get("Cadastrar no Deskcomm").parameters.url).toBe("={{ $vars.LAB_DESKCOMM_CAPTURE_URL }}");
	});
});

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
	it("SPECSFY: SPEC-0007 US-001 FR-001 NFR-001 AC-002 — formulário aciona busca e Deskcomm com identidade estável sem alterar conta", () => {
		const fields = get("On form submission").parameters.formFields as { values: Array<{ fieldLabel: string; fieldName: string; fieldType?: string; requiredField?: boolean; fieldOptions?: { values: Array<{ option: string }> } }> };
		expect(fields.values.map(field => field.fieldName)).toEqual(["nome", "whatsapp", "email", "aceite_termos"]);
		expect(fields.values.every(field => field.requiredField)).toBe(true);
		expect(fields.values.find(field => field.fieldName === "whatsapp")?.fieldType).toBe("text");
		expect(fields.values.find(field => field.fieldName === "aceite_termos")?.fieldOptions?.values).toEqual([{ option: "Aceito os termos de uso do LAB" }]);
		expect(workflow.connections).toContainEqual(["On form submission", "Validar formulario LAB", 0]);
		expect(workflow.connections).toContainEqual(["Usuario ja existe", "Identidade WordPress confirmada", 0]);
		expect(workflow.connections).toContainEqual(["Identidade WordPress confirmada", "Cadastrar no Deskcomm", 0]);
		expect(get("Cadastrar no Deskcomm").parameters.jsonBody).toContain("'lab-free:wp:' + $json.wp_id");
		expect(nodes.some(n => n.parameters.method === "PATCH" || n.parameters.method === "PUT")).toBe(false);
	});
	it("SPECSFY: SPEC-0007 US-001 FR-001 NFR-001 AC-003 — conclusão só após CRM confirmado e falhas levam à tela de erro", () => {
		expect(get("On form submission").parameters.responseMode).toBe("lastNode");
		expect(workflow.connections).toContainEqual(["Confirmar conclusao", "Resultado do cadastro LAB", 0]);
		expect(get("Resultado do cadastro LAB").parameters.operation).toBe("completion");
		expect(get("Resultado do cadastro LAB").parameters.completionTitle).toContain("$json.ok === true");
	});
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
		expect(JSON.stringify(get("Criar usuario WordPress").parameters)).toContain("subscriber");
		expect(get("Cadastrar no Deskcomm").parameters.jsonBody).toContain("'lab-free:wp:' + $json.wp_id");
	});
	it("execuções não armazenam senha nem PII e a cópia local omite o destino privado", () => {
		expect(workflow.settings).toMatchObject({ saveDataSuccessExecution: "none", saveDataErrorExecution: "none", saveManualExecutions: false, saveExecutionProgress: false });
		expect(get("Cadastrar no Deskcomm").parameters.url).toBe("={{ $vars.LAB_DESKCOMM_CAPTURE_URL }}");
	});
});


describe("validação do formulário antes de criar conta", () => {
 const valid = { nome: "Pessoa Teste", email: " TESTE@example.com ", whatsapp: "(22) 98765-4321", aceite_termos: ["Aceito os termos de uso do LAB"] };
 it("normaliza campos nativos para o contrato do cadastro", () => {
  expect(execute("Validar formulario LAB", valid)[0].json.body).toMatchObject({ nome: "Pessoa Teste", email: "teste@example.com", whatsapp: "5522987654321", aceite_termos: true });
 });
 it("recusa nome, email, telefone e aceite inválidos antes de efeitos externos", () => {
  for (const patch of [{nome: "A"}, {email: "invalid"}, {whatsapp: "123"}, {aceite_termos: []}, {aceite_termos: false}]) expect(() => execute("Validar formulario LAB", {...valid, ...patch})).toThrow();
 });
});

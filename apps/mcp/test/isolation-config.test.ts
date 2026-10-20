import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { seedResponsibility } from "./seed-responsibility";

const SECRET_PHASE = { name: "Secret phase", color: "#22c55e", entry: true } as const;

describe("cross-organization isolation: ticket phases", () => {
  it("hides one organization's phases and refuses them as transition targets", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const secret = await call({ client: a, name: "ticketPhase_create", args: SECRET_PHASE });
    const own = await call({
      client: b,
      name: "ticketPhase_create",
      args: { ...SECRET_PHASE, name: "Own phase" },
    });
    const listed = await call({ client: b, name: "ticketPhase_list" });
    expect(listed.data.items.map((item: { id: string }) => item.id)).not.toContain(secret.data.id);
    const get = await call({ client: b, name: "ticketPhase_get", args: { id: secret.data.id } });
    expect(get.data.code).toBe("NOT_FOUND");
    const transitions = await call({
      client: b,
      name: "ticketPhase_setTransitions",
      args: { id: own.data.id, toPhaseIds: [secret.data.id] },
    });
    expect(transitions.isError).toBe(true);
    expect(["NOT_FOUND", "VALIDATION"]).toContain(transitions.data.code);
    const from = await call({
      client: b,
      name: "ticketPhase_setTransitions",
      args: { id: secret.data.id, toPhaseIds: [own.data.id] },
    });
    expect(from.data.code).toBe("NOT_FOUND");
  });
});

describe("cross-organization isolation: sheets, setups and fields", () => {
  it("hides sheet definitions, setups and field definitions from another organization", async () => {
    const context = testContext();
    const a = await connect({ context });
    const b = await connect({ context: testContext() });
    const responsibilityId = await seedResponsibility({ client: a, context });
    const type = await call({
      client: a,
      name: "entityType_create",
      args: { base: "ITEM", name: "Secret room", capabilities: ["BOOKABLE", "SETUPS"] },
    });
    const field = await call({
      client: a,
      name: "fieldDefinition_create",
      args: { entityTypeId: type.data.id, name: "Style", kind: "TEXT" },
    });
    const setup = await call({ client: a, name: "setup_create", args: { name: "Secret theatre" } });
    const sheet = await call({
      client: a,
      name: "sheetDefinition_create",
      args: { name: "Secret sheet", entityTypeIds: [type.data.id], responsibilityId },
    });
    expect(sheet.isError, JSON.stringify(sheet.data)).toBe(false);
    const cases = [
      ["sheetDefinition", sheet.data.id, { name: "Hacked" }],
      ["setup", setup.data.id, { name: "Hacked" }],
      ["fieldDefinition", field.data.id, { name: "Hacked" }],
    ] as const;
    for (const [entity, id, patch] of cases) {
      expect((await call({ client: b, name: `${entity}_list` })).data.items, entity).toEqual([]);
      for (const [action, args] of [
        ["get", { id }],
        ["update", { id, ...patch }],
        ["archive", { id }],
      ] as const) {
        const result = await call({ client: b, name: `${entity}_${action}`, args });
        expect(result.data.code, `${entity}_${action}`).toBe("NOT_FOUND");
      }
    }
    const graph = await call({
      client: b,
      name: "graphql_query",
      args: { query: "query { sheetDefinitions { items { id } } setups { items { id } } }" },
    });
    expect(graph.data.data).toEqual({
      sheetDefinitions: { items: [] },
      setups: { items: [] },
    });
    const own = await call({ client: a, name: "sheetDefinition_get", args: { id: sheet.data.id } });
    expect(own.data.status).toBe("ACTIVE");
  });
});

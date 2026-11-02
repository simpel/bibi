import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { seedResponsibility } from "./seed-responsibility";

const SECRET_STATUS = { name: "Secret status", color: "#22c55e" } as const;

describe("cross-organization isolation: ticket statuses", () => {
  it("hides one organization's statuses and refuses them as transition targets", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const secret = await call({ client: a, name: "ticketStatus_create", args: SECRET_STATUS });
    const own = await call({
      client: b,
      name: "ticketStatus_create",
      args: { ...SECRET_STATUS, name: "Own status" },
    });
    const listed = await call({ client: b, name: "ticketStatus_list" });
    expect(listed.data.items.map((item: { id: string }) => item.id)).not.toContain(secret.data.id);
    const get = await call({ client: b, name: "ticketStatus_get", args: { id: secret.data.id } });
    expect(get.data.code).toBe("NOT_FOUND");
    const transitions = await call({
      client: b,
      name: "ticketStatus_setTransitions",
      args: { id: own.data.id, allowedNext: "ONLY_THESE", toStatusIds: [secret.data.id] },
    });
    expect(transitions.isError).toBe(true);
    expect(["NOT_FOUND", "VALIDATION"]).toContain(transitions.data.code);
    const from = await call({
      client: b,
      name: "ticketStatus_setTransitions",
      args: { id: secret.data.id, allowedNext: "ONLY_THESE", toStatusIds: [own.data.id] },
    });
    expect(from.data.code).toBe("NOT_FOUND");
    const foreignSource = await call({
      client: b,
      name: "ticketStatus_setGates",
      args: { id: own.data.id, gates: [{ fromStatusId: secret.data.id, gates: ["REASON"] }] },
    });
    expect(foreignSource.isError).toBe(true);
    expect(["NOT_FOUND", "VALIDATION"]).toContain(foreignSource.data.code);
    const foreignTarget = await call({
      client: b,
      name: "ticketStatus_setGates",
      args: { id: secret.data.id, gates: [] },
    });
    expect(foreignTarget.data.code).toBe("NOT_FOUND");
  });
});

describe("cross-organization isolation: work orders, setups and fields", () => {
  it("hides work order definitions, setups and field definitions from another organization", async () => {
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
    const workOrder = await call({
      client: a,
      name: "workOrderDefinition_create",
      args: { name: "Secret work order", entityTypeIds: [type.data.id], responsibilityId },
    });
    expect(workOrder.isError, JSON.stringify(workOrder.data)).toBe(false);
    const cases = [
      ["workOrderDefinition", workOrder.data.id, { name: "Hacked" }],
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
      args: { query: "query { workOrderDefinitions { items { id } } setups { items { id } } }" },
    });
    expect(graph.data.data).toEqual({
      workOrderDefinitions: { items: [] },
      setups: { items: [] },
    });
    const own = await call({
      client: a,
      name: "workOrderDefinition_get",
      args: { id: workOrder.data.id },
    });
    expect(own.data.status).toBe("ACTIVE");
  });
});

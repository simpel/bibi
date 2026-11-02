import type { ExecuteContext } from "@bibi/core";
import { describe, expect, it } from "vitest";
import { call, connect, type Json, testContext } from "./helpers";
import { seedResponsibility } from "./seed-responsibility";
import { seedTicket } from "./seed-ticket";

type Client = Awaited<ReturnType<typeof connect>>;
type SeedInput = { client: Client; context: ExecuteContext };

async function seedWorkOrder({ client, context }: SeedInput): Promise<Json> {
  const ticket = await seedTicket({ client });
  const responsibilityId = await seedResponsibility({ client, context });
  const type = await call({
    client,
    name: "entityType_create",
    args: { base: "ITEM", name: "Secret room" },
  });
  const definition = await call({
    client,
    name: "workOrderDefinition_create",
    args: { name: "Secret work order", entityTypeIds: [type.data.id], responsibilityId },
  });
  expect(definition.isError, JSON.stringify(definition.data)).toBe(false);
  const workOrder = await call({
    client,
    name: "workOrder_generate",
    args: { ticketId: ticket.id, workOrderDefinitionId: definition.data.id },
  });
  expect(workOrder.isError, JSON.stringify(workOrder.data)).toBe(false);
  return {
    ticket,
    type: type.data,
    responsibilityId,
    definition: definition.data,
    workOrder: workOrder.data,
  };
}

describe("cross-organization isolation: work orders and work order definitions", () => {
  it("refuses work order and work order definition operations on another organization's rows", async () => {
    const [contextA, contextB] = [testContext(), testContext()];
    const a = await connect({ context: contextA });
    const b = await connect({ context: contextB });
    const { ticket, definition, workOrder, responsibilityId } = await seedWorkOrder({
      client: a,
      context: contextA,
    });
    const mine = await seedWorkOrder({ client: b, context: contextB });
    const cases = [
      ["workOrder_get", { id: workOrder.id }],
      ["workOrder_send", { id: workOrder.id }],
      ["workOrder_generate", { ticketId: ticket.id, workOrderDefinitionId: mine.definition.id }],
      ["workOrder_generate", { ticketId: mine.ticket.id, workOrderDefinitionId: definition.id }],
      ["workOrderDefinition_update", { id: definition.id, name: "Hacked" }],
      ["workOrderDefinition_archive", { id: definition.id }],
    ] as const;
    for (const [name, args] of cases) {
      const result = await call({ client: b, name, args });
      expect(result.isError, name).toBe(true);
      expect(result.data.code, name).toBe("NOT_FOUND");
    }
    const borrowed = await call({
      client: b,
      name: "workOrderDefinition_create",
      args: { name: "Borrowed receiver", entityTypeIds: [mine.type.id], responsibilityId },
    });
    expect(borrowed.data.code).toBe("VALIDATION");
    const workOrders = await call({ client: b, name: "workOrder_list" });
    expect(workOrders.data.items.map((item: { id: string }) => item.id)).toEqual([
      mine.workOrder.id,
    ]);
    const filtered = await call({
      client: b,
      name: "workOrder_list",
      args: { ticketId: ticket.id },
    });
    expect(filtered.data.items).toEqual([]);
    const definitions = await call({ client: b, name: "workOrderDefinition_list" });
    const ids = definitions.data.items.map((item: { id: string }) => item.id);
    expect(ids).toEqual([mine.definition.id]);
  });

  it("leaves the owning organization's work order and definition untouched", async () => {
    const context = testContext();
    const a = await connect({ context });
    const { definition, workOrder } = await seedWorkOrder({ client: a, context });
    const own = await call({ client: a, name: "workOrder_get", args: { id: workOrder.id } });
    expect(own.data.version).toBe(1);
    expect(own.data.sentAt).toBeNull();
    const list = await call({ client: a, name: "workOrderDefinition_list" });
    expect(list.data.items.map((item: { id: string }) => item.id)).toEqual([definition.id]);
    const fetched = await call({
      client: a,
      name: "workOrderDefinition_get",
      args: { id: definition.id },
    });
    expect(fetched.data.name).toBe("Secret work order");
    expect(fetched.data.status).toBe("ACTIVE");
  });
});

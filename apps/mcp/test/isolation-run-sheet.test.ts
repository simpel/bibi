import type { ExecuteContext } from "@bibi/core";
import { describe, expect, it } from "vitest";
import { call, connect, type Json, testContext } from "./helpers";
import { seedResponsibility } from "./seed-responsibility";
import { seedOrder } from "./seed-order";

type Client = Awaited<ReturnType<typeof connect>>;
type SeedInput = { client: Client; context: ExecuteContext };

async function seedRunSheet({ client, context }: SeedInput): Promise<Json> {
  const order = await seedOrder({ client });
  const responsibilityId = await seedResponsibility({ client, context });
  const type = await call({
    client,
    name: "entityType_create",
    args: { base: "ITEM", name: "Secret room" },
  });
  const definition = await call({
    client,
    name: "runSheetDefinition_create",
    args: { name: "Secret run sheet", entityTypeIds: [type.data.id], responsibilityId },
  });
  expect(definition.isError, JSON.stringify(definition.data)).toBe(false);
  const runSheet = await call({
    client,
    name: "runSheet_generate",
    args: { orderId: order.id, runSheetDefinitionId: definition.data.id },
  });
  expect(runSheet.isError, JSON.stringify(runSheet.data)).toBe(false);
  return {
    order,
    type: type.data,
    responsibilityId,
    definition: definition.data,
    runSheet: runSheet.data,
  };
}

describe("cross-organization isolation: run sheets and run sheet definitions", () => {
  it("refuses run sheet and run sheet definition operations on another organization's rows", async () => {
    const [contextA, contextB] = [testContext(), testContext()];
    const a = await connect({ context: contextA });
    const b = await connect({ context: contextB });
    const { order, definition, runSheet, responsibilityId } = await seedRunSheet({
      client: a,
      context: contextA,
    });
    const mine = await seedRunSheet({ client: b, context: contextB });
    const cases = [
      ["runSheet_get", { id: runSheet.id }],
      ["runSheet_publish", { id: runSheet.id }],
      ["runSheet_fulfill", { id: runSheet.id }],
      ["runSheet_unfulfill", { id: runSheet.id }],
      ["runSheet_generate", { orderId: order.id, runSheetDefinitionId: mine.definition.id }],
      ["runSheet_generate", { orderId: mine.order.id, runSheetDefinitionId: definition.id }],
      ["runSheetDefinition_update", { id: definition.id, name: "Hacked" }],
      ["runSheetDefinition_archive", { id: definition.id }],
    ] as const;
    for (const [name, args] of cases) {
      const result = await call({ client: b, name, args });
      expect(result.isError, name).toBe(true);
      expect(result.data.code, name).toBe("NOT_FOUND");
    }
    const borrowed = await call({
      client: b,
      name: "runSheetDefinition_create",
      args: { name: "Borrowed receiver", entityTypeIds: [mine.type.id], responsibilityId },
    });
    expect(borrowed.data.code).toBe("VALIDATION");
    const runSheets = await call({ client: b, name: "runSheet_list" });
    expect(runSheets.data.items.map((item: { id: string }) => item.id)).toEqual([
      mine.runSheet.id,
    ]);
    const filtered = await call({
      client: b,
      name: "runSheet_list",
      args: { orderId: order.id },
    });
    expect(filtered.data.items).toEqual([]);
    const definitions = await call({ client: b, name: "runSheetDefinition_list" });
    const ids = definitions.data.items.map((item: { id: string }) => item.id);
    expect(ids).toEqual([mine.definition.id]);
  });

  it("leaves the owning organization's run sheet and definition untouched", async () => {
    const context = testContext();
    const a = await connect({ context });
    const { definition, runSheet } = await seedRunSheet({ client: a, context });
    const own = await call({ client: a, name: "runSheet_get", args: { id: runSheet.id } });
    expect(own.data.version).toBe(1);
    expect(own.data.publishedAt).toBeNull();
    const list = await call({ client: a, name: "runSheetDefinition_list" });
    expect(list.data.items.map((item: { id: string }) => item.id)).toEqual([definition.id]);
    const fetched = await call({
      client: a,
      name: "runSheetDefinition_get",
      args: { id: definition.id },
    });
    expect(fetched.data.name).toBe("Secret run sheet");
    expect(fetched.data.status).toBe("ACTIVE");
  });
});

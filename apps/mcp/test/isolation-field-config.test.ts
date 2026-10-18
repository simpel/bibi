import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";

describe("cross-organization isolation: entity types and field definitions", () => {
  it("refuses another organization's entity type and field definition", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const type = await call({
      client: a,
      name: "entityType_create",
      args: { base: "ITEM", name: "Secret room" },
    });
    const field = await call({
      client: a,
      name: "fieldDefinition_create",
      args: { entityTypeId: type.data.id, name: "Style", kind: "TEXT" },
    });
    expect(field.isError, JSON.stringify(field.data)).toBe(false);
    const typeId = type.data.id;
    const fieldId = field.data.id;

    const cases = [
      ["entityType_update", { id: typeId, name: "Hacked" }],
      ["entityType_archive", { id: typeId }],
      ["fieldDefinition_get", { id: fieldId }],
      ["fieldDefinition_update", { id: fieldId, name: "Hacked" }],
      ["fieldDefinition_archive", { id: fieldId }],
    ] as const;
    for (const [name, args] of cases) {
      const result = await call({ client: b, name, args });
      expect(result.data.code, name).toBe("NOT_FOUND");
    }
    const listed = await call({ client: b, name: "fieldDefinition_list" });
    expect(listed.data.items).toEqual([]);
    const byType = await call({
      client: b,
      name: "fieldDefinition_list",
      args: { entityTypeId: typeId },
    });
    expect(byType.isError ? [] : byType.data.items).toEqual([]);

    const ownType = await call({
      client: a,
      name: "entityType_get",
      args: { id: typeId },
    });
    expect(ownType.data.name).toBe("Secret room");
    expect(ownType.data.status).toBe("ACTIVE");
    const ownField = await call({ client: a, name: "fieldDefinition_get", args: { id: fieldId } });
    expect(ownField.data.name).toBe("Style");
    expect(ownField.data.status).toBe("ACTIVE");
    const ownList = await call({ client: a, name: "fieldDefinition_list" });
    expect(ownList.data.items.map((item: { id: string }) => item.id)).toEqual([fieldId]);
  });
});

import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";

describe("cross-organization isolation: item parts", () => {
  it("refuses another organization's item as a part or a choice option", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const typeA = await call({
      client: a,
      name: "entityType_create",
      args: { base: "ITEM", name: "Secret dish" },
    });
    const secret = await call({
      client: a,
      name: "item_create",
      args: { entityTypeId: typeA.data.id, name: "Hemlig" },
    });
    const typeB = await call({
      client: b,
      name: "entityType_create",
      args: { base: "ITEM", name: "Own bundle", capabilities: ["BUNDLE", "CUSTOMISATIONS"] },
    });
    const own = await call({
      client: b,
      name: "item_create",
      args: { entityTypeId: typeB.data.id, name: "Own" },
    });
    expect(own.isError, JSON.stringify(own.data)).toBe(false);
    const parts = [{ itemId: secret.data.id }];
    const customisationGroups = [
      { name: "Pick", minPick: 1, maxPick: 1, itemIds: [secret.data.id] },
    ];
    const created = await call({
      client: b,
      name: "item_create",
      args: { entityTypeId: typeB.data.id, name: "Borrowing", parts },
    });
    expect(["NOT_FOUND", "VALIDATION"]).toContain(created.data.code);
    const updated = await call({
      client: b,
      name: "item_update",
      args: { id: own.data.id, parts },
    });
    expect(["NOT_FOUND", "VALIDATION"]).toContain(updated.data.code);
    const grouped = await call({
      client: b,
      name: "item_update",
      args: { id: own.data.id, parts, customisationGroups },
    });
    expect(grouped.isError, JSON.stringify(grouped.data)).toBe(true);
    const after = await call({ client: b, name: "item_get", args: { id: own.data.id } });
    expect(after.data.parts).toEqual([]);
    expect(after.data.customisationGroups).toEqual([]);
    const listed = await call({ client: b, name: "item_list" });
    expect(listed.data.items).toHaveLength(1);
    expect(listed.data.items[0].parts).toEqual([]);
    const intact = await call({ client: a, name: "item_get", args: { id: secret.data.id } });
    expect(intact.data.name).toBe("Hemlig");
  });
});

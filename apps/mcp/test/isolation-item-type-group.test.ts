import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";

describe("cross-organization isolation: item type groups", () => {
  it("hides one organization's groups and refuses its ids in another's", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const group = await call({ client: a, name: "itemTypeGroup_create", args: { name: "Spaces" } });
    expect(group.isError, JSON.stringify(group.data)).toBe(false);
    const own = await call({ client: b, name: "itemTypeGroup_create", args: { name: "Food" } });
    expect(own.isError, JSON.stringify(own.data)).toBe(false);
    const ownType = await call({
      client: b,
      name: "entityType_create",
      args: { base: "ITEM", name: "Lunch" },
    });
    expect(ownType.isError, JSON.stringify(ownType.data)).toBe(false);

    const listed = await call({ client: b, name: "itemTypeGroup_list", args: {} });
    expect(listed.data.items.map((item: { id: string }) => item.id)).toEqual([own.data.id]);
    const refused = [
      ["itemTypeGroup_get", { id: group.data.id }],
      ["itemTypeGroup_update", { id: group.data.id, name: "Hacked" }],
      ["itemTypeGroup_archive", { id: group.data.id }],
    ] as const;
    for (const [name, args] of refused) {
      const result = await call({ client: b, name, args });
      expect(result.data.code, name).toBe("NOT_FOUND");
    }
    const foreign = [
      ["itemTypeGroup_reorder", { ids: [group.data.id, own.data.id] }],
      ["entityType_create", { base: "ITEM", name: "Room", groupId: group.data.id }],
      ["entityType_update", { id: ownType.data.id, groupId: group.data.id }],
    ] as const;
    for (const [name, args] of foreign) {
      const result = await call({ client: b, name, args });
      expect(result.isError, `${name} ${JSON.stringify(args)}`).toBe(true);
      expect(["NOT_FOUND", "VALIDATION"], name).toContain(result.data.code);
    }
    const items = await call({ client: b, name: "item_list", args: { groupId: group.data.id } });
    expect(items.data.items).toEqual([]);
    const mine = await call({ client: a, name: "itemTypeGroup_get", args: { id: group.data.id } });
    expect(mine.data.name).toBe("Spaces");
  });
});

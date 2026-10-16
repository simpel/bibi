import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";

describe("cross-organization isolation: price lists", () => {
  it("hides one organization's price lists and their item prices from another", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const type = await call({
      client: a,
      name: "entityType_create",
      args: { base: "ITEM", name: "Secret room", behaviours: ["BOOKABLE", "PRICED"] },
    });
    const item = await call({
      client: a,
      name: "item_create",
      args: { entityTypeId: type.data.id, name: "Hemlig" },
    });
    const list = await call({
      client: a,
      name: "priceList_create",
      args: { name: "Secret agreement" },
    });
    const priced = await call({
      client: a,
      name: "priceList_setItems",
      args: { id: list.data.id, items: [{ itemId: item.data.id, priceMinor: 450_000 }] },
    });
    expect(priced.data.items).toEqual([{ itemId: item.data.id, priceMinor: 450_000 }]);

    expect((await call({ client: b, name: "priceList_list" })).data.items).toEqual([]);
    const get = await call({ client: b, name: "priceList_get", args: { id: list.data.id } });
    expect(get.data.code).toBe("NOT_FOUND");
    const setItems = await call({
      client: b,
      name: "priceList_setItems",
      args: { id: list.data.id, items: [] },
    });
    expect(setItems.data.code).toBe("NOT_FOUND");
    const archive = await call({
      client: b,
      name: "priceList_archive",
      args: { id: list.data.id },
    });
    expect(archive.data.code).toBe("NOT_FOUND");
    const graph = await call({
      client: b,
      name: "graphql_query",
      args: { query: "query { priceLists { items { id } } }" },
    });
    expect(graph.data.data.priceLists.items).toEqual([]);

    const own = await call({ client: a, name: "priceList_get", args: { id: list.data.id } });
    expect(own.data.items).toHaveLength(1);
  });
});

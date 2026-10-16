import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";

const DAY = 86_400_000;

describe("cross-organization isolation: options", () => {
  it("hides one organization's options and item from another across tools and graph", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const type = await call({
      client: a,
      name: "entityType_create",
      args: { base: "ITEM", name: "Secret room", behaviours: ["BOOKABLE"] },
    });
    const item = await call({
      client: a,
      name: "item_create",
      args: { entityTypeId: type.data.id, name: "Secret hall" },
    });
    const period = { startsAt: "2026-11-03T07:00:00.000Z", endsAt: "2026-11-03T15:00:00.000Z" };
    const expiresAt = new Date(Date.now() + 7 * DAY).toISOString();
    const option = await call({
      client: a,
      name: "option_create",
      args: { itemId: item.data.id, ...period, expiresAt },
    });
    expect(option.isError, JSON.stringify(option.data)).toBe(false);
    const id = option.data.id;
    for (const [name, args] of [
      ["option_get", { id }],
      ["option_release", { id }],
    ] as const) {
      expect((await call({ client: b, name, args })).data.code, name).toBe("NOT_FOUND");
    }
    const foreign = await call({
      client: b,
      name: "option_create",
      args: { itemId: item.data.id, ...period, expiresAt },
    });
    expect(foreign.data.code).toBe("VALIDATION");
    expect((await call({ client: b, name: "option_expireDue" })).data.items).toEqual([]);
    expect((await call({ client: b, name: "option_list" })).data.items).toEqual([]);
    const graph = await call({
      client: b,
      name: "graphql_query",
      args: { query: "query { options { items { id } } }" },
    });
    expect(graph.data.data.options.items).toEqual([]);
    const own = await call({ client: a, name: "option_get", args: { id } });
    expect(own.data).toMatchObject({ optionStatus: "ACTIVE", rank: 1 });
  });
});

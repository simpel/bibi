import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";

describe("cross-organization isolation", () => {
  it("hides one organization's rows from another across curated and graph tools", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const venue = await call({ client: a, name: "venue_create", args: { name: "Secret" } });
    expect(
      (await call({ client: b, name: "venue_get", args: { id: venue.data.id } })).data.code,
    ).toBe("NOT_FOUND");
    expect((await call({ client: b, name: "venue_list" })).data.items).toEqual([]);
    const update = await call({
      client: b,
      name: "venue_update",
      args: { id: venue.data.id, name: "Hacked" },
    });
    expect(update.data.code).toBe("NOT_FOUND");
    const graph = await call({
      client: b,
      name: "graphql_query",
      args: { query: "query { venues { items { id } } }" },
    });
    expect(graph.data.data.venues.items).toEqual([]);
    const own = await call({ client: a, name: "venue_get", args: { id: venue.data.id } });
    expect(own.data.name).toBe("Secret");
  });
});

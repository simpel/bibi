import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";

describe("graphql tools", () => {
  it("graphql_schema returns SDL with a usage hint", async () => {
    const client = await connect({ context: testContext() });
    const schema = await call({ client, name: "graphql_schema" });
    expect(schema.data.sdl).toContain("type Query");
    expect(schema.data.sdl).toContain("type Venue");
    expect(schema.data.usage).toContain("graphql_query");
  });

  it("graphql_query reads through the graph with the caller's org", async () => {
    const client = await connect({ context: testContext() });
    const venue = await call({ client, name: "venue_create", args: { name: "Graph Hall" } });
    const type = await call({
      client,
      name: "entityType_create",
      args: { base: "ITEM", name: "Konferensrum", capabilities: ["BOOKABLE"] },
    });
    await call({
      client,
      name: "item_create",
      args: { entityTypeId: type.data.id, venueId: venue.data.id, name: "Room A" },
    });
    const result = await call({
      client,
      name: "graphql_query",
      args: { query: "query { venues { items { name items { name } } } }" },
    });
    expect(result.isError).toBe(false);
    expect(result.data.errors).toBeUndefined();
    expect(JSON.stringify(result.data.data)).toContain("Graph Hall");
    expect(JSON.stringify(result.data.data)).toContain("Room A");
  });

  it("rejects mutations, subscriptions, oversized and invalid documents before executing", async () => {
    const context = testContext();
    const client = await connect({ context });
    const mutation = await call({
      client,
      name: "graphql_query",
      args: { query: 'mutation { createVenue(input: { name: "X" }) { id } }' },
    });
    expect(mutation).toMatchObject({ isError: true, data: { code: "FORBIDDEN" } });
    expect(await context.db.venue.count()).toBe(0);
    const subscription = await call({
      client,
      name: "graphql_query",
      args: { query: "subscription { a }" },
    });
    expect(subscription.data.code).toBe("FORBIDDEN");
    const mixed = await call({
      client,
      name: "graphql_query",
      args: { query: "query A { venues { items { id } } } mutation B { x }", operationName: "A" },
    });
    expect(mixed.isError).toBe(true);
    const long = await call({
      client,
      name: "graphql_query",
      args: { query: `query { ${"a ".repeat(6000)} }` },
    });
    expect(long.data.code).toBe("VALIDATION");
    const broken = await call({ client, name: "graphql_query", args: { query: "query {" } });
    expect(broken.data.code).toBe("VALIDATION");
  });
});

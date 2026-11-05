import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { seedQuoteBasis } from "./seed-quote-basis";

const VALID_UNTIL = "2099-12-01T00:00:00.000Z";

describe("cross-organization isolation: quotes", () => {
  it("hides one organization's quotes, order and items from another across tools and graph", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const secret = await seedQuoteBasis({ client: a });
    const quote = await call({
      client: a,
      name: "quote_create",
      args: { orderId: secret.orderId, validUntil: VALID_UNTIL },
    });
    expect(quote.isError, JSON.stringify(quote.data)).toBe(false);
    const id = quote.data.id;
    for (const [name, args] of [
      ["quote_get", { id }],
      ["quote_update", { id, terms: "Hacked" }],
      ["quote_revise", { id }],
      ["quote_send", { id }],
      ["quote_accept", { id }],
      ["quote_decline", { id }],
      ["quote_expire", { id }],
      ["quote_create", { orderId: secret.orderId }],
    ] as const) {
      expect((await call({ client: b, name, args })).data.code, name).toBe("NOT_FOUND");
    }
    const own = await seedQuoteBasis({ client: b });
    const foreign = await call({
      client: b,
      name: "line_create",
      args: {
        orderId: own.orderId,
        entityTypeId: own.lineTypeId,
        itemId: secret.itemId,
        name: "Stolen lunch",
      },
    });
    expect(foreign.data.code).toBe("VALIDATION");
    expect((await call({ client: b, name: "quote_list" })).data.items).toEqual([]);
    const graph = await call({
      client: b,
      name: "graphql_query",
      args: { query: "query { quotes { items { id } } }" },
    });
    expect(graph.data.data.quotes.items).toEqual([]);
    const mine = await call({ client: a, name: "quote_get", args: { id } });
    expect(mine.data).toMatchObject({ quoteStatus: "DRAFT", totalExclVatMinor: 50_000 });
    expect(mine.data.lines.map((line: { name: string }) => line.name)).toEqual(["Secret lunch"]);
  });
});

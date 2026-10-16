import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { seedBooking } from "./seed-booking";

const VALID_UNTIL = "2099-12-01T00:00:00.000Z";

/** An open inquiry and a priced item in the client's organization. */
async function seedQuoteBasis({ client }: { client: Client }) {
  const { customerId } = await seedBooking({ client });
  const inquiryType = await call({
    client,
    name: "entityType_create",
    args: { base: "INQUIRY", name: "Secret inquiry" },
  });
  const inquiry = await call({
    client,
    name: "inquiry_create",
    args: { entityTypeId: inquiryType.data.id, customerId, quantity: 30 },
  });
  const itemType = await call({
    client,
    name: "entityType_create",
    args: { base: "ITEM", name: "Secret dish", behaviours: ["PRICED"] },
  });
  const item = await call({
    client,
    name: "item_create",
    args: {
      entityTypeId: itemType.data.id,
      name: "Secret lunch",
      priceMinor: 25_000,
      vatRatePercent: 12,
    },
  });
  expect(item.isError, JSON.stringify(item.data)).toBe(false);
  return { inquiryId: inquiry.data.id as string, itemId: item.data.id as string };
}

describe("cross-organization isolation: quotes", () => {
  it("hides one organization's quotes, inquiry and items from another across tools and graph", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const secret = await seedQuoteBasis({ client: a });
    const lines = [{ itemId: secret.itemId, quantity: 2 }];
    const quote = await call({
      client: a,
      name: "quote_create",
      args: { inquiryId: secret.inquiryId, validUntil: VALID_UNTIL, lines },
    });
    expect(quote.isError, JSON.stringify(quote.data)).toBe(false);
    const id = quote.data.id;
    for (const [name, args] of [
      ["quote_get", { id }],
      ["quote_update", { id, terms: "Hacked" }],
      ["quote_revise", { id }],
      ["quote_send", { id }],
      ["quote_decline", { id }],
      ["quote_expire", { id }],
      ["quote_create", { inquiryId: secret.inquiryId }],
    ] as const) {
      expect((await call({ client: b, name, args })).data.code, name).toBe("NOT_FOUND");
    }
    const own = await seedQuoteBasis({ client: b });
    const foreign = await call({
      client: b,
      name: "quote_create",
      args: { inquiryId: own.inquiryId, lines },
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
  });
});

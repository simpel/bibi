import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { seedTicket } from "./seed-ticket";

const VALID_UNTIL = "2099-12-01T00:00:00.000Z";

/** An open ticket with a priced line in the client's organization. */
async function seedQuoteBasis({ client }: { client: Client }) {
  const ticket = await seedTicket({ client });
  const itemType = await call({
    client,
    name: "entityType_create",
    args: { base: "ITEM", name: "Secret dish", capabilities: ["PRICED"] },
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
  const lineTypeId = await addLine({ client, ticketId: ticket.id, itemId: item.data.id });
  return { ticketId: ticket.id, itemId: item.data.id as string, lineTypeId };
}

type AddLineInput = { client: Client; ticketId: string; itemId: string };

/** A line type and one priced line of the item on the ticket; returns the line type's id. */
async function addLine({ client, ticketId, itemId }: AddLineInput): Promise<string> {
  const lineType = await call({
    client,
    name: "entityType_create",
    args: { base: "LINE", name: "Secret point" },
  });
  const line = await call({
    client,
    name: "line_create",
    args: {
      ticketId,
      entityTypeId: lineType.data.id,
      itemId,
      name: "Secret lunch",
      quantity: 2,
    },
  });
  expect(line.isError, JSON.stringify(line.data)).toBe(false);
  return lineType.data.id as string;
}

describe("cross-organization isolation: quotes", () => {
  it("hides one organization's quotes, ticket and items from another across tools and graph", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const secret = await seedQuoteBasis({ client: a });
    const quote = await call({
      client: a,
      name: "quote_create",
      args: { ticketId: secret.ticketId, validUntil: VALID_UNTIL },
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
      ["quote_create", { ticketId: secret.ticketId }],
    ] as const) {
      expect((await call({ client: b, name, args })).data.code, name).toBe("NOT_FOUND");
    }
    const own = await seedQuoteBasis({ client: b });
    const foreign = await call({
      client: b,
      name: "line_create",
      args: {
        ticketId: own.ticketId,
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

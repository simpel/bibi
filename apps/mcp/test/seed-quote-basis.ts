import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { expect } from "vitest";
import { call } from "./helpers";
import { seedTicket } from "./seed-ticket";

/** An open ticket with a priced line in the client's organization. */
export async function seedQuoteBasis({ client }: { client: Client }) {
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

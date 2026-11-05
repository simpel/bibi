import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { expect } from "vitest";
import { call } from "./helpers";
import { seedOrder } from "./seed-order";

/** An open order with a priced line in the client's organization. */
export async function seedQuoteBasis({ client }: { client: Client }) {
  const order = await seedOrder({ client });
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
  const lineTypeId = await addLine({ client, orderId: order.id, itemId: item.data.id });
  return { orderId: order.id, itemId: item.data.id as string, lineTypeId };
}

type AddLineInput = { client: Client; orderId: string; itemId: string };

/** A line type and one priced line of the item on the order; returns the line type's id. */
async function addLine({ client, orderId, itemId }: AddLineInput): Promise<string> {
  const lineType = await call({
    client,
    name: "entityType_create",
    args: { base: "LINE", name: "Secret point" },
  });
  const line = await call({
    client,
    name: "line_create",
    args: {
      orderId,
      entityTypeId: lineType.data.id,
      itemId,
      name: "Secret lunch",
      quantity: 2,
    },
  });
  expect(line.isError, JSON.stringify(line.data)).toBe(false);
  return lineType.data.id as string;
}

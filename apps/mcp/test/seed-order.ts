import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { expect } from "vitest";
import { call } from "./helpers";
import { seedContact } from "./seed-contact";

export type SeededOrder = {
  id: string;
  entityTypeId: string;
  customerId: string;
  contactId: string;
};

export type SeedOrderInput = { client: Client };

/** A customer of its own customer type. */
async function seedCustomer({ client }: SeedOrderInput) {
  const args = { base: "CUSTOMER", name: "Secret company" };
  const customerType = await call({ client, name: "entityType_create", args });
  const customer = { entityTypeId: customerType.data.id, name: "Secret AB" };
  return call({ client, name: "customer_create", args: customer });
}

/** An order with its own type, customer and entry status in the client's organization. */
export async function seedOrder({ client }: SeedOrderInput): Promise<SeededOrder> {
  const type = await call({
    client,
    name: "entityType_create",
    args: { base: "ORDER", name: "Secret conference" },
  });
  const customer = await seedCustomer({ client });
  const contactId = await seedContact({ client, customerId: customer.data.id });
  const status = await call({
    client,
    name: "orderStatus_create",
    args: { name: "Secret status", color: "#22c55e" },
  });
  await call({ client, name: "orderStatus_update", args: { id: status.data.id, entry: true } });
  const order = await call({
    client,
    name: "order_create",
    args: {
      entityTypeId: type.data.id,
      customerId: customer.data.id,
      contactId,
      desiredStartsAt: "2037-11-03T08:00:00.000Z",
      desiredEndsAt: "2037-11-03T16:00:00.000Z",
      estimatedHeadcount: 12,
    },
  });
  expect(order.isError, JSON.stringify(order.data)).toBe(false);
  return {
    id: order.data.id,
    entityTypeId: type.data.id,
    customerId: customer.data.id,
    contactId,
  };
}

import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { createId } from "@paralleldrive/cuid2";
import { expect } from "vitest";
import { call, connect, testContext } from "./helpers";
import { seedContact } from "./seed-contact";

type AddOrderInput = { client: Client; entityTypeId: string; customerId: string };

/** One order of the customer, created by `client`. */
export async function addArchiveOrder({ client, entityTypeId, customerId }: AddOrderInput) {
  const contactId = await seedContact({ client, customerId });
  const order = await call({
    client,
    name: "order_create",
    args: {
      entityTypeId,
      customerId,
      contactId,
      desiredStartsAt: "2037-11-03T08:00:00.000Z",
      desiredEndsAt: "2037-11-03T16:00:00.000Z",
    },
  });
  expect(order.isError, JSON.stringify(order.data)).toBe(false);
  // A customer with active contacts cannot be archived, so the contact is archived at once.
  await call({ client, name: "contact_archive", args: { id: contactId } });
  return order.data.id as string;
}

type SeedInput = { client: Client; orders: number };

/** A customer with `orders` orders in the client's organization; returns the customer id. */
export async function seedArchiveCustomer({ client, orders }: SeedInput): Promise<string> {
  const type = await call({
    client,
    name: "entityType_create",
    args: { base: "ORDER", name: "Conference" },
  });
  const customerType = await call({
    client,
    name: "entityType_create",
    args: { base: "CUSTOMER", name: "Company" },
  });
  const customer = await call({
    client,
    name: "customer_create",
    args: { entityTypeId: customerType.data.id, name: "Kvarnby Design AB" },
  });
  const status = { name: "Lead", color: "#22c55e" };
  const lead = await call({ client, name: "orderStatus_create", args: status });
  await call({ client, name: "orderStatus_update", args: { id: lead.data.id, entry: true } });
  for (let index = 0; index < orders; index += 1)
    await addArchiveOrder({ client, entityTypeId: type.data.id, customerId: customer.data.id });
  return customer.data.id;
}

/** A user client and an assistant client acting for the same user in one organization. */
export async function setupArchiveClients() {
  const userId = `user_${createId()}`;
  const base = testContext({ actor: { type: "user", userId } });
  const ai = testContext({
    organizationId: base.organizationId,
    actor: { type: "ai", userId, conversationId: "conv_134" },
  });
  return { user: await connect({ context: base }), assistant: await connect({ context: ai }) };
}

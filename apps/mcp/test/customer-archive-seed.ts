import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { createId } from "@paralleldrive/cuid2";
import { expect } from "vitest";
import { call, connect, testContext } from "./helpers";

type AddTicketInput = { client: Client; entityTypeId: string; customerId: string };

/** One ticket of the customer, created by `client`. */
export async function addArchiveTicket({ client, entityTypeId, customerId }: AddTicketInput) {
  const ticket = await call({
    client,
    name: "ticket_create",
    args: {
      entityTypeId,
      customerId,
      desiredStartsAt: "2026-11-03T08:00:00.000Z",
      desiredEndsAt: "2026-11-03T16:00:00.000Z",
    },
  });
  expect(ticket.isError, JSON.stringify(ticket.data)).toBe(false);
  return ticket.data.id as string;
}

type SeedInput = { client: Client; tickets: number };

/** A customer with `tickets` tickets in the client's organization; returns the customer id. */
export async function seedArchiveCustomer({ client, tickets }: SeedInput): Promise<string> {
  const type = await call({
    client,
    name: "entityType_create",
    args: { base: "TICKET", name: "Conference" },
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
  const status = { name: "Lead", color: "#22c55e", entry: true };
  await call({ client, name: "ticketStatus_create", args: status });
  for (let index = 0; index < tickets; index += 1)
    await addArchiveTicket({ client, entityTypeId: type.data.id, customerId: customer.data.id });
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

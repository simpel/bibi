import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { expect } from "vitest";
import { call } from "./helpers";

export type SeededTicket = { id: string; entityTypeId: string; customerId: string };

export type SeedTicketInput = { client: Client };

/** A ticket with its own type, customer and entry phase in the client's organization. */
export async function seedTicket({ client }: SeedTicketInput): Promise<SeededTicket> {
  const type = await call({
    client,
    name: "entityType_create",
    args: { base: "TICKET", name: "Secret conference" },
  });
  const customerType = await call({
    client,
    name: "entityType_create",
    args: { base: "CUSTOMER", name: "Secret company" },
  });
  const customer = await call({
    client,
    name: "customer_create",
    args: { entityTypeId: customerType.data.id, name: "Secret AB" },
  });
  await call({
    client,
    name: "ticketPhase_create",
    args: { name: "Secret phase", color: "#22c55e", entry: true },
  });
  const ticket = await call({
    client,
    name: "ticket_create",
    args: {
      entityTypeId: type.data.id,
      customerId: customer.data.id,
      desiredStartsAt: "2026-11-03T08:00:00.000Z",
      desiredEndsAt: "2026-11-03T16:00:00.000Z",
      estimatedHeadcount: 12,
    },
  });
  expect(ticket.isError, JSON.stringify(ticket.data)).toBe(false);
  return { id: ticket.data.id, entityTypeId: type.data.id, customerId: customer.data.id };
}

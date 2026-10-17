import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { createId } from "@paralleldrive/cuid2";
import { expect } from "vitest";
import { call, connect, testContext } from "./helpers";

type AddBookingInput = { client: Client; entityTypeId: string; customerId: string };

/** One booking of the customer, created by `client`. */
export async function addArchiveBooking({ client, entityTypeId, customerId }: AddBookingInput) {
  const booking = await call({
    client,
    name: "booking_create",
    args: {
      entityTypeId,
      customerId,
      startsAt: "2026-11-03T08:00:00.000Z",
      endsAt: "2026-11-03T16:00:00.000Z",
    },
  });
  expect(booking.isError, JSON.stringify(booking.data)).toBe(false);
  return booking.data.id as string;
}

type SeedInput = { client: Client; bookings: number };

/** A customer with `bookings` bookings in the client's organization; returns the customer id. */
export async function seedArchiveCustomer({ client, bookings }: SeedInput): Promise<string> {
  const type = await call({
    client,
    name: "entityType_create",
    args: { base: "BOOKING", name: "Conference" },
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
  const status = { name: "Tentative", color: "#22c55e", phase: "TENTATIVE" };
  await call({ client, name: "bookingStatus_create", args: status });
  for (let index = 0; index < bookings; index += 1)
    await addArchiveBooking({ client, entityTypeId: type.data.id, customerId: customer.data.id });
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

import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { expect } from "vitest";
import { call } from "./helpers";

export type SeededBooking = { id: string; entityTypeId: string; customerId: string };

export type SeedBookingInput = { client: Client };

/** A booking with its own type, customer and TENTATIVE status in the client's organization. */
export async function seedBooking({ client }: SeedBookingInput): Promise<SeededBooking> {
  const type = await call({
    client,
    name: "entityType_create",
    args: { base: "BOOKING", name: "Secret conference" },
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
    name: "bookingStatus_create",
    args: { name: "Secret status", color: "#22c55e", phase: "TENTATIVE" },
  });
  const booking = await call({
    client,
    name: "booking_create",
    args: {
      entityTypeId: type.data.id,
      customerId: customer.data.id,
      startsAt: "2026-11-03T08:00:00.000Z",
      endsAt: "2026-11-03T16:00:00.000Z",
      estimatedHeadcount: 12,
    },
  });
  expect(booking.isError, JSON.stringify(booking.data)).toBe(false);
  return { id: booking.data.id, entityTypeId: type.data.id, customerId: customer.data.id };
}

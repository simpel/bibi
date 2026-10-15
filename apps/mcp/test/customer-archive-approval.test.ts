import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";

type SeedInput = { client: Client; bookings: number };

/** A customer with `bookings` bookings in the client's organization; returns the customer id. */
async function seedCustomer({ client, bookings }: SeedInput): Promise<string> {
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
  for (let index = 0; index < bookings; index += 1) {
    const booking = await call({
      client,
      name: "booking_create",
      args: {
        entityTypeId: type.data.id,
        customerId: customer.data.id,
        startsAt: "2026-11-03T08:00:00.000Z",
        endsAt: "2026-11-03T16:00:00.000Z",
      },
    });
    expect(booking.isError, JSON.stringify(booking.data)).toBe(false);
  }
  return customer.data.id;
}

async function setup() {
  const userId = `user_${createId()}`;
  const base = testContext({ actor: { type: "user", userId } });
  const ai = testContext({
    organizationId: base.organizationId,
    actor: { type: "ai", userId, conversationId: "conv_134" },
  });
  return { user: await connect({ context: base }), assistant: await connect({ context: ai }) };
}

describe("customer_archive approval (#134)", () => {
  it("says how many bookings will be archived and archives them once approved", async () => {
    const { user, assistant } = await setup();
    const id = await seedCustomer({ client: user, bookings: 3 });
    const blocked = await call({ client: user, name: "customer_archive", args: { id } });
    expect(blocked.data).toMatchObject({ code: "CONFLICT", issues: [{ path: "archiveBookings" }] });
    const proposal = await call({
      client: assistant,
      name: "customer_archive",
      args: { id, archiveBookings: true },
    });
    expect(proposal.data).toMatchObject({
      status: "approval_required",
      summary: 'Archive customer "Kvarnby Design AB" and its 3 bookings',
    });
    const confirmed = await call({
      client: user,
      name: "approval_confirm",
      args: { approvalToken: proposal.data.approvalToken },
    });
    expect(confirmed.data).toMatchObject({ id, status: "ARCHIVED", bookingCount: 0 });
    expect((await call({ client: user, name: "booking_list" })).data.items).toEqual([]);
  });
});

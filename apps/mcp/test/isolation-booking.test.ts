import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { bookingInboundAddress, deliverInboundEmail } from "@okazi/core";
import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { gqlQuery } from "./parity-graphql";

type SeedBookingInput = { client: Client };

/** A booking with its own type, customer and TENTATIVE status in the client's organization. */
async function seedBooking({ client }: SeedBookingInput): Promise<string> {
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
  return booking.data.id;
}

describe("cross-organization isolation for bookings", () => {
  it("hides one organization's bookings from another across tools and graph", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const id = await seedBooking({ client: a });
    for (const [name, args] of [
      ["booking_get", { id }],
      ["booking_update", { id, estimatedHeadcount: 99 }],
      ["booking_assign", { id, salesOwnerId: null }],
    ] as const) {
      expect((await call({ client: b, name, args })).data.code, name).toBe("NOT_FOUND");
    }
    expect((await call({ client: b, name: "booking_list" })).data.items).toEqual([]);
    const graph = await call({
      client: b,
      name: "graphql_query",
      args: { query: "query { bookings { items { id } } }" },
    });
    expect(graph.data.data.bookings.items).toEqual([]);
    const own = await call({ client: a, name: "booking_get", args: { id } });
    expect(own.data.estimatedHeadcount).toBe(12);
  });

  it("hides one organization's inbound emails from another across tools and graph", async () => {
    const contextA = testContext();
    const contextB = testContext();
    const a = await connect({ context: contextA });
    const b = await connect({ context: contextB });
    const bookingId = await seedBooking({ client: a });
    const domain = "in.isolation.test";
    const address = bookingInboundAddress({ bookingId, domain });
    const delivered = await deliverInboundEmail({
      domain,
      mail: {
        providerEmailId: `email_${bookingId}`,
        messageId: null,
        fromAddress: "Guest <guest@example.test>",
        toAddresses: [address],
        subject: "Secret reply",
        text: "Secret",
        html: null,
        attachments: [],
        receivedAt: new Date("2026-11-01T08:00:00.000Z"),
        recipients: [address],
      },
    });
    if (!delivered.ok || delivered.value.status === "unmatched") throw new Error("Not stored");
    const id = delivered.value.inboundEmail.id;

    const own = await call({ client: a, name: "inboundEmail_list", args: { bookingId } });
    expect(own.data.items.map((item: { id: string }) => item.id)).toEqual([id]);
    expect((await call({ client: b, name: "inboundEmail_get", args: { id } })).data.code).toBe(
      "NOT_FOUND",
    );
    const listed = await call({ client: b, name: "inboundEmail_list", args: { bookingId } });
    expect(listed.data.items).toEqual([]);
    const query =
      "query($bookingId: String!) { inboundEmails(bookingId: $bookingId) { items { id } } }";
    const graph = await call({
      client: b,
      name: "graphql_query",
      args: { query, variables: { bookingId } },
    });
    expect(graph.data.data.inboundEmails.items).toEqual([]);
    const direct = await gqlQuery({ context: contextB, query, variables: { bookingId } });
    expect(direct.inboundEmails.items).toEqual([]);
  });
});

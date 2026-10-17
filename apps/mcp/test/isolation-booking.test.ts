import { bookingInboundAddress, deliverInboundEmail } from "@okazi/core";
import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { gqlQuery } from "./parity-graphql";
import { seedBooking } from "./seed-booking";

describe("cross-organization isolation for bookings", () => {
  it("hides one organization's bookings from another across tools and graph", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const { id } = await seedBooking({ client: a });
    const statusB = await call({
      client: b,
      name: "bookingStatus_create",
      args: { name: "Other status", color: "#ef4444", phase: "CONFIRMED" },
    });
    for (const [name, args] of [
      ["booking_get", { id }],
      ["booking_changeStatus", { bookingId: id, statusId: statusB.data.id }],
      ["booking_update", { id, estimatedHeadcount: 99 }],
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
    const { id: bookingId } = await seedBooking({ client: a });
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

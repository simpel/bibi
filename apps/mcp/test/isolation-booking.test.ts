import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";

describe("cross-organization isolation for bookings", () => {
  it("hides one organization's bookings from another across tools and graph", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const type = await call({
      client: a,
      name: "entityType_create",
      args: { base: "BOOKING", name: "Secret conference" },
    });
    const customerType = await call({
      client: a,
      name: "entityType_create",
      args: { base: "CUSTOMER", name: "Secret company" },
    });
    const customer = await call({
      client: a,
      name: "customer_create",
      args: { entityTypeId: customerType.data.id, name: "Secret AB" },
    });
    await call({
      client: a,
      name: "bookingStatus_create",
      args: { name: "Secret status", color: "#22c55e", phase: "TENTATIVE" },
    });
    const booking = await call({
      client: a,
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
    const id = booking.data.id;
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
});

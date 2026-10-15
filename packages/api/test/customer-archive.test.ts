import { describe, expect, it } from "vitest";
import { call, newOrgId } from "./helpers";

type SeedInput = { org: string };

/** A customer with one booking; returns the customer id. */
async function seed({ org }: SeedInput): Promise<string> {
  const post = ({ path, body }: { path: string; body: unknown }) =>
    call({ method: "POST", path, org, body });
  const customerType = await post({
    path: "/entity-types",
    body: { base: "CUSTOMER", name: "Company" },
  });
  const bookingType = await post({
    path: "/entity-types",
    body: { base: "BOOKING", name: "Conference" },
  });
  await post({
    path: "/booking-statuses",
    body: { name: "Tentative", color: "#22c55e", phase: "TENTATIVE" },
  });
  const customer = await post({
    path: "/customers",
    body: {
      entityTypeId: customerType.json.id,
      name: "Kvarnby Design AB",
    },
  });
  const booking = await post({
    path: "/bookings",
    body: {
      entityTypeId: bookingType.json.id,
      customerId: customer.json.id,
      startsAt: "2026-11-03T08:00:00.000Z",
      endsAt: "2026-11-03T16:00:00.000Z",
    },
  });
  expect(booking.status, JSON.stringify(booking.json)).toBe(201);
  return customer.json.id;
}

describe("DELETE /customers/{id} with bookings (#134)", () => {
  it("answers 409 with the reason, and archives the bookings with archiveBookings=true", async () => {
    const org = newOrgId();
    const id = await seed({ org });
    expect((await call({ path: `/customers/${id}`, org })).json.bookingCount).toBe(1);
    const blocked = await call({ method: "DELETE", path: `/customers/${id}`, org });
    expect(blocked.status).toBe(409);
    expect(blocked.json.error.issues).toEqual([
      expect.objectContaining({ path: "archiveBookings" }),
    ]);
    const path = `/customers/${id}?archiveBookings=true`;
    const archived = await call({ method: "DELETE", path, org });
    expect(archived.status).toBe(200);
    expect(archived.json).toMatchObject({ status: "ARCHIVED", bookingCount: 0 });
    expect((await call({ path: "/bookings", org })).json.items).toEqual([]);
  });
});

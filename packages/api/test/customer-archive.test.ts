import { describe, expect, it } from "vitest";
import { call, newOrgId } from "./helpers";

type SeedInput = { org: string };

/** A customer with one ticket; returns the customer id. */
async function seed({ org }: SeedInput): Promise<string> {
  const post = ({ path, body }: { path: string; body: unknown }) =>
    call({ method: "POST", path, org, body });
  const customerType = await post({
    path: "/entity-types",
    body: { base: "CUSTOMER", name: "Company" },
  });
  const ticketType = await post({
    path: "/entity-types",
    body: { base: "TICKET", name: "Conference" },
  });
  await post({
    path: "/ticket-statuses",
    body: { name: "Lead", color: "#22c55e", entry: true },
  });
  const customer = await post({
    path: "/customers",
    body: {
      entityTypeId: customerType.json.id,
      name: "Kvarnby Design AB",
    },
  });
  const ticket = await post({
    path: "/tickets",
    body: {
      entityTypeId: ticketType.json.id,
      customerId: customer.json.id,
      desiredStartsAt: "2026-11-03T08:00:00.000Z",
      desiredEndsAt: "2026-11-03T16:00:00.000Z",
    },
  });
  expect(ticket.status, JSON.stringify(ticket.json)).toBe(201);
  return customer.json.id;
}

describe("DELETE /customers/{id} with tickets (#134)", () => {
  it("answers 409 with the reason, and archives the tickets with archiveTickets=true", async () => {
    const org = newOrgId();
    const id = await seed({ org });
    expect((await call({ path: `/customers/${id}`, org })).json.ticketCount).toBe(1);
    const blocked = await call({ method: "DELETE", path: `/customers/${id}`, org });
    expect(blocked.status).toBe(409);
    expect(blocked.json.error.issues).toEqual([
      expect.objectContaining({ path: "archiveTickets" }),
    ]);
    const path = `/customers/${id}?archiveTickets=true`;
    const archived = await call({ method: "DELETE", path, org });
    expect(archived.status).toBe(200);
    expect(archived.json).toMatchObject({ status: "ARCHIVED", ticketCount: 0 });
    expect((await call({ path: "/tickets", org })).json.items).toEqual([]);
  });
});

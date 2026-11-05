import { describe, expect, it } from "vitest";
import { call, newOrgId } from "./helpers";

type SeedInput = { org: string };

/** An entry status "Lead": a new status is a name and a colour, the entry flag is an update. */
async function seedEntryStatus({ org }: SeedInput) {
  const body = { name: "Lead", color: "#22c55e" };
  const lead = await call({ method: "POST", path: "/order-statuses", org, body });
  await call({
    method: "PATCH",
    path: `/order-statuses/${lead.json.id}`,
    org,
    body: { entry: true },
  });
}

type ContactInput = SeedInput & { customerId: string };

/** A contact at the customer: every new order needs one (ADR 0081). */
async function seedContact({ org, customerId }: ContactInput) {
  const body = { base: "CONTACT", name: "Contact" };
  const type = await call({ method: "POST", path: "/entity-types", org, body });
  const contact = { entityTypeId: type.json.id, customerId, name: "Anna Berg" };
  return call({ method: "POST", path: "/contacts", org, body: contact });
}

/** A customer with one order; returns the customer id. */
async function seed({ org }: SeedInput): Promise<string> {
  const post = ({ path, body }: { path: string; body: unknown }) =>
    call({ method: "POST", path, org, body });
  const customerType = await post({
    path: "/entity-types",
    body: { base: "CUSTOMER", name: "Company" },
  });
  const orderType = await post({
    path: "/entity-types",
    body: { base: "ORDER", name: "Conference" },
  });
  await seedEntryStatus({ org });
  const customer = await post({
    path: "/customers",
    body: {
      entityTypeId: customerType.json.id,
      name: "Kvarnby Design AB",
    },
  });
  const contact = await seedContact({ org, customerId: customer.json.id });
  const order = await post({
    path: "/orders",
    body: {
      entityTypeId: orderType.json.id,
      customerId: customer.json.id,
      contactId: contact.json.id,
      desiredStartsAt: "2037-11-03T08:00:00.000Z",
      desiredEndsAt: "2037-11-03T16:00:00.000Z",
    },
  });
  expect(order.status, JSON.stringify(order.json)).toBe(201);
  // A customer with active contacts cannot be archived, so the contact is archived at once.
  await call({ method: "DELETE", path: `/contacts/${contact.json.id}`, org });
  return customer.json.id;
}

describe("DELETE /customers/{id} with orders (#134)", () => {
  it("answers 409 with the reason, and archives the orders with archiveOrders=true", async () => {
    const org = newOrgId();
    const id = await seed({ org });
    expect((await call({ path: `/customers/${id}`, org })).json.orderCount).toBe(1);
    const blocked = await call({ method: "DELETE", path: `/customers/${id}`, org });
    expect(blocked.status).toBe(409);
    expect(blocked.json.error.issues).toEqual([
      expect.objectContaining({ path: "archiveOrders" }),
    ]);
    const path = `/customers/${id}?archiveOrders=true`;
    const archived = await call({ method: "DELETE", path, org });
    expect(archived.status).toBe(200);
    expect(archived.json).toMatchObject({ status: "ARCHIVED", orderCount: 0 });
    expect((await call({ path: "/orders", org })).json.items).toEqual([]);
  });
});

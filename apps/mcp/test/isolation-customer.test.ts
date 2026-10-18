import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";

type TypeInput = { client: Client; base: "CUSTOMER" | "CONTACT" };

async function createType({ client, base }: TypeInput): Promise<string> {
  const type = await call({
    client,
    name: "entityType_create",
    args: { base, name: `Secret ${base}` },
  });
  return type.data.id;
}

async function seedCustomerAndContact({ client }: { client: Client }) {
  const customerType = await createType({ client, base: "CUSTOMER" });
  const contactType = await createType({ client, base: "CONTACT" });
  const customer = await call({
    client,
    name: "customer_create",
    args: { entityTypeId: customerType, name: "Secret AB" },
  });
  const contact = await call({
    client,
    name: "contact_create",
    args: { entityTypeId: contactType, customerId: customer.data.id, name: "Secret Person" },
  });
  expect(contact.isError, JSON.stringify(contact.data)).toBe(false);
  return { customerId: customer.data.id, contactId: contact.data.id, contactType, customerType };
}

describe("cross-organization isolation for customers", () => {
  it("hides customers from another organization", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const { customerId } = await seedCustomerAndContact({ client: a });
    for (const [name, args] of [
      ["customer_get", { id: customerId }],
      ["customer_update", { id: customerId, name: "Hijacked" }],
      ["customer_archive", { id: customerId }],
    ] as const) {
      expect((await call({ client: b, name, args })).data.code, name).toBe("NOT_FOUND");
    }
    expect((await call({ client: b, name: "customer_list" })).data.items).toEqual([]);
    const searched = await call({ client: b, name: "customer_list", args: { query: "Secret" } });
    expect(searched.data.items).toEqual([]);
    const own = await call({ client: a, name: "customer_get", args: { id: customerId } });
    expect(own.data.name).toBe("Secret AB");
    expect(own.data.status).toBe("ACTIVE");
  });

  it("keeps a customer created by one organization out of the other's list", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const typeB = await createType({ client: b, base: "CUSTOMER" });
    const created = await call({
      client: b,
      name: "customer_create",
      args: { entityTypeId: typeB, name: "B only" },
    });
    expect(created.isError, JSON.stringify(created.data)).toBe(false);
    expect((await call({ client: a, name: "customer_list" })).data.items).toEqual([]);
    const typeA = await createType({ client: a, base: "CUSTOMER" });
    const foreign = await call({
      client: a,
      name: "customer_create",
      args: { entityTypeId: typeB, name: "Borrowed type" },
    });
    expect(["NOT_FOUND", "VALIDATION"]).toContain(foreign.data.code);
    expect(typeA).not.toBe(typeB);
  });
});

describe("cross-organization isolation for contacts", () => {
  it("hides contacts from another organization", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const { customerId, contactId } = await seedCustomerAndContact({ client: a });
    for (const [name, args] of [
      ["contact_get", { id: contactId }],
      ["contact_update", { id: contactId, name: "Hijacked" }],
      ["contact_archive", { id: contactId }],
    ] as const) {
      expect((await call({ client: b, name, args })).data.code, name).toBe("NOT_FOUND");
    }
    expect((await call({ client: b, name: "contact_list" })).data.items).toEqual([]);
    const byCustomer = await call({ client: b, name: "contact_list", args: { customerId } });
    expect(byCustomer.data.items).toEqual([]);
    const own = await call({ client: a, name: "contact_get", args: { id: contactId } });
    expect(own.data.name).toBe("Secret Person");
  });

  it("refuses a contact at another organization's customer", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const { customerId } = await seedCustomerAndContact({ client: a });
    const typeB = await createType({ client: b, base: "CONTACT" });
    const created = await call({
      client: b,
      name: "contact_create",
      args: { entityTypeId: typeB, customerId, name: "Intruder" },
    });
    expect(created.data.code).toBe("VALIDATION");
    expect((await call({ client: b, name: "contact_list" })).data.items).toEqual([]);
    expect((await call({ client: a, name: "contact_list" })).data.items).toHaveLength(1);
  });
});

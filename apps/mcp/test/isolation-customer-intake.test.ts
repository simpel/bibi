import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";

type TypeInput = { client: Client; base: "CUSTOMER" | "CONTACT" };

async function createType({ client, base }: TypeInput): Promise<string> {
  const args = { base, name: `Intake ${base}` };
  return (await call({ client, name: "entityType_create", args })).data.id;
}

const contact = { name: "Anna Secret", email: "anna@secretcorp.test" };

/** Organization A's customer, created with its first contact (ADR 0081). */
async function seedA({ client }: { client: Client }) {
  const entityTypeId = await createType({ client, base: "CUSTOMER" });
  const contactType = await createType({ client, base: "CONTACT" });
  const created = await call({
    client,
    name: "customer_create",
    args: { entityTypeId, name: "Secretcorp AB", contact },
  });
  expect(created.isError, JSON.stringify(created.data)).toBe(false);
  return { customerId: created.data.id as string, contactType };
}

describe("cross-organization isolation for the customer intake (ADR 0081)", () => {
  it("never suggests another organization's customers as duplicates", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    await seedA({ client: a });
    const args = { name: "Secretcorp", email: "new@secretcorp.test" };
    const own = await call({ client: a, name: "customer_findSimilar", args });
    expect(own.data.items).toHaveLength(1);
    const foreign = await call({ client: b, name: "customer_findSimilar", args });
    expect(foreign.data.items).toEqual([]);
  });

  it("refuses a first contact of another organization's contact type", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const { contactType } = await seedA({ client: a });
    const entityTypeId = await createType({ client: b, base: "CUSTOMER" });
    const created = await call({
      client: b,
      name: "customer_create",
      args: {
        entityTypeId,
        name: "Borrowed AB",
        contact: { ...contact, entityTypeId: contactType },
      },
    });
    expect(created.data.code).toBe("VALIDATION");
    expect((await call({ client: b, name: "customer_list" })).data.items).toEqual([]);
    expect((await call({ client: b, name: "contact_list" })).data.items).toEqual([]);
    expect((await call({ client: a, name: "contact_list" })).data.items).toHaveLength(1);
  });

  it("lists only the organization's own customers by recent tickets", async () => {
    const a = await connect({ context: testContext() });
    await seedA({ client: a });
    const b = await connect({ context: testContext() });
    const recent = await call({ client: b, name: "customer_list", args: { recent: true } });
    expect(recent.data.items).toEqual([]);
  });
});

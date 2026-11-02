import { getDb } from "@bibi/db";
import { describe, expect, it } from "vitest";
import {
  createCustomer,
  createEntityType,
  createIndexingHook,
  createSearchOperation,
  type ExecuteContext,
  execute,
  listContacts,
} from "../src/index";
import { createTypeWithField } from "./customer-helpers";
import { fakeEmbed } from "./fake-embed";
import { errorCode, testContext, unwrap } from "./helpers";

type Ctx = { context: ExecuteContext };

const typeOf = async ({ context, base }: Ctx & { base: "CUSTOMER" | "CONTACT" }) =>
  unwrap({
    result: await execute({ operation: createEntityType, input: { base, name: base }, context }),
  }).id;

const contact = { name: "Karin Wallin", email: "karin@nordkust.test", phone: "031-1" };

const countOf = async ({ context }: Ctx) => {
  const { organizationId } = context;
  const db = getDb();
  return {
    customers: await db.customer.count({ where: { organizationId } }),
    contacts: await db.contact.count({ where: { organizationId } }),
    records: await db.record.count({ where: { organizationId } }),
  };
};

describe("customer.create with its first contact (ADR 0081)", () => {
  it("creates the contact with the customer, audited and indexed, with the only contact type", async () => {
    const context = testContext();
    const entityTypeId = await typeOf({ context, base: "CUSTOMER" });
    const contactType = await typeOf({ context, base: "CONTACT" });
    const afterCommit = [createIndexingHook({ embed: fakeEmbed })];
    const input = { entityTypeId, name: "Nordkust Logistik AB", contact };
    const customer = unwrap({
      result: await execute({ operation: createCustomer, input, context, afterCommit }),
    });
    const contacts = unwrap({
      result: await execute({
        operation: listContacts,
        input: { customerId: customer.id },
        context,
      }),
    }).items;
    expect(contacts).toMatchObject([{ ...contact, entityTypeId: contactType }]);
    const audit = await getDb().auditLog.findMany({
      where: { organizationId: context.organizationId, operation: "customer.create" },
    });
    expect(audit.map((row) => row.entityType).sort()).toEqual(["contact", "customer"]);
    const search = createSearchOperation({ embed: fakeEmbed });
    const hits = unwrap({
      result: await execute({ operation: search, input: { query: "Karin Wallin" }, context }),
    }).hits;
    expect(hits.map((hit) => hit.entityId)).toContain(contacts[0]?.id);
  });

  it("rolls the customer back when the contact is refused", async () => {
    const context = testContext();
    const entityTypeId = await typeOf({ context, base: "CUSTOMER" });
    const { type } = await createTypeWithField({ context, base: "CONTACT", name: "Person" });
    const result = await execute({
      operation: createCustomer,
      input: {
        entityTypeId,
        name: "Rolled back AB",
        contact: { ...contact, entityTypeId: type.id, fields: { unknown: "x" } },
      },
      context,
    });
    expect(errorCode({ result })).toBe("VALIDATION");
    if (!result.ok) expect(result.error.issues[0]?.path).toMatch(/^contact\./);
    const counts = await countOf({ context });
    expect(counts).toEqual({ customers: 0, contacts: 0, records: 0 });
  });

  it("asks for the contact type unless the organization has exactly one", async () => {
    const context = testContext();
    const entityTypeId = await typeOf({ context, base: "CUSTOMER" });
    const input = { entityTypeId, name: "No type AB", contact };
    const none = await execute({ operation: createCustomer, input, context });
    expect(errorCode({ result: none })).toBe("VALIDATION");
    await typeOf({ context, base: "CONTACT" });
    await createTypeWithField({ context, base: "CONTACT", name: "Second" });
    const two = await execute({ operation: createCustomer, input, context });
    expect(two.ok ? null : two.error.issues).toEqual([
      { path: "contact.entityTypeId", message: "Choose a contact type" },
    ]);
    expect((await countOf({ context })).customers).toBe(0);
  });

  it("refuses the contact without an email and a caller without customer:write", async () => {
    const context = testContext();
    const entityTypeId = await typeOf({ context, base: "CUSTOMER" });
    await typeOf({ context, base: "CONTACT" });
    const noEmail = await execute({
      operation: createCustomer,
      input: { entityTypeId, name: "Mailless AB", contact: { name: "Karin" } },
      context,
    });
    expect(errorCode({ result: noEmail })).toBe("VALIDATION");
    const { organizationId } = context;
    const reader = testContext({ organizationId, permissions: { customer: ["read"] } });
    const input = { entityTypeId, name: "Forbidden AB", contact };
    const forbidden = await execute({ operation: createCustomer, input, context: reader });
    expect(errorCode({ result: forbidden })).toBe("FORBIDDEN");
    expect(await countOf({ context })).toEqual({ customers: 0, contacts: 0, records: 0 });
  });
});

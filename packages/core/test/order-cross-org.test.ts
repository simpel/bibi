import { describe, expect, it } from "vitest";
import {
  createContact,
  createOrder,
  type ExecuteContext,
  execute,
  grantAll,
  updateOrder,
} from "../src/index";
import { createTestCustomer } from "./customer-helpers";
import { unwrap } from "./helpers";
import { testOrg } from "./org-helpers";
import {
  contactAt,
  createTestContact,
  createTestOrder,
  memberUser,
  orderSetup,
} from "./order-helpers";

type PathsInput = {
  context: ExecuteContext;
  input: Record<string, unknown>;
  /** Present = `order.update` of this order, absent = `order.create`. */
  orderId?: string;
};

async function refusal({ context, input, orderId }: PathsInput) {
  const result = orderId
    ? await execute({ operation: updateOrder, input: { id: orderId, ...input }, context })
    : await execute({ operation: createOrder, input, context });
  return result.ok ? null : { code: result.error.code, path: result.error.issues[0]?.path };
}

describe("order referenced ids (ADR 0004)", () => {
  it("refuses ids from another organization on create and update", async () => {
    const { context, type, customer } = await orderSetup();
    const foreign = await testOrg();
    const foreignCustomer = await createTestCustomer({ context: foreign, name: "Foreign AB" });
    const foreignContact = await createTestContact({
      context: foreign,
      customerId: foreignCustomer.id,
    });
    const foreignUser = await memberUser({ context: foreign, name: "Outsider" });
    const contactId = (await contactAt({ context, customerId: customer.id })).id;
    const base = { entityTypeId: type.id, customerId: customer.id, contactId };
    const order = await createTestOrder({ context, ...base });
    for (const input of [{ customerId: foreignCustomer.id }, { contactId: foreignContact.id }]) {
      const path = Object.keys(input)[0];
      const create = await refusal({ context, input: { ...base, ...input } });
      expect(create).toMatchObject({ code: "VALIDATION", path });
      expect(await refusal({ context, input, orderId: order.id })).toMatchObject({
        code: "VALIDATION",
        path,
      });
    }
    const assignee = await refusal({ context, input: { ...base, assigneeId: foreignUser } });
    expect(assignee).toMatchObject({ code: "VALIDATION", path: "assigneeId" });
  });

  it("needs read access to the customer and contact it refers to", async () => {
    const { context, type, customer } = await orderSetup();
    const contact = await createTestContact({ context, customerId: customer.id });
    const base = { entityTypeId: type.id, customerId: customer.id, contactId: contact.id };
    const all = grantAll({});
    // Contacts are part of the customer feature (ADR 0050).
    const noCustomer = { ...context, permissions: { ...all, customer: [] } };
    expect(await refusal({ context: noCustomer, input: base })).toMatchObject({
      code: "VALIDATION",
      path: "customerId",
    });
    const order = await createTestOrder({ context, ...base });
    const second = unwrap({
      result: await execute({
        operation: createContact,
        input: { customerId: customer.id, entityTypeId: contact.entityTypeId, name: "Per Holm" },
        context,
      }),
    });
    const update = await refusal({
      context: noCustomer,
      input: { contactId: second.id },
      orderId: order.id,
    });
    expect(update).toMatchObject({ code: "VALIDATION", path: "contactId" });
  });
});

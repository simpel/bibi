import { describe, expect, it } from "vitest";
import { archiveContact, execute, updateOrder } from "../src/index";
import { unwrap } from "./helpers";
import { createTestContact, createTestOrder, orderSetup } from "./order-helpers";

describe("order.update with an archived contact (ADR 0043)", () => {
  it("keeps the contact and updates other details after it has been archived", async () => {
    const { context, type, customer } = await orderSetup();
    const contact = await createTestContact({ context, customerId: customer.id });
    const order = await createTestOrder({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
      contactId: contact.id,
    });
    unwrap({
      result: await execute({ operation: archiveContact, input: { id: contact.id }, context }),
    });
    const updated = unwrap({
      result: await execute({
        operation: updateOrder,
        input: { id: order.id, budgetMinor: 1_000_000 },
        context,
      }),
    });
    expect(updated).toMatchObject({ budgetMinor: 1_000_000, contactId: contact.id });
    const again = await execute({
      operation: updateOrder,
      input: { id: order.id, contactId: contact.id, budgetMinor: 2_000_000 },
      context,
    });
    expect(again.ok).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { archiveContact, createInquiry, execute, updateInquiry } from "../src/index";
import { unwrap } from "./helpers";
import { createTestContact, inquirySetup } from "./inquiry-helpers";

describe("inquiry.update with an archived contact", () => {
  it("updates other details after the contact has been archived", async () => {
    const { context, type, customer } = await inquirySetup();
    const contact = await createTestContact({ context, customerId: customer.id });
    const inquiry = unwrap({
      result: await execute({
        operation: createInquiry,
        input: {
          entityTypeId: type.id,
          customerId: customer.id,
          contactId: contact.id,
          quantity: 20,
        },
        context,
      }),
    });
    unwrap({
      result: await execute({ operation: archiveContact, input: { id: contact.id }, context }),
    });
    const updated = unwrap({
      result: await execute({
        operation: updateInquiry,
        input: { id: inquiry.id, budgetMinor: 1_000_000 },
        context,
      }),
    });
    expect(updated).toMatchObject({ budgetMinor: 1_000_000, contactId: contact.id });
    const reassigned = await execute({
      operation: updateInquiry,
      input: { id: inquiry.id, contactId: contact.id, budgetMinor: 2_000_000 },
      context,
    });
    expect(reassigned.ok).toBe(true);
  });
});

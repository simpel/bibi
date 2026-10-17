import { describe, expect, it } from "vitest";
import {
  createInquiry,
  execute,
  getInquiry,
  type InquiryUpdateInput,
  listInquiries,
  updateInquiry,
} from "../src/index";
import { createTestCustomer } from "./customer-helpers";
import { errorCode, peer, unwrap } from "./helpers";
import { createTestContact, createTestInquiry, inquirySetup } from "./inquiry-helpers";
import { testOrg } from "./org-helpers";

describe("inquiry.create|update|list|get (ADR 0022)", () => {
  it("creates a NEW inquiry with its fields, contact and budget", async () => {
    const { context, type, key, customer } = await inquirySetup();
    const contact = await createTestContact({ context, customerId: customer.id });
    const inquiry = unwrap({
      result: await execute({
        operation: createInquiry,
        input: {
          entityTypeId: type.id,
          customerId: customer.id,
          contactId: contact.id,
          desiredStartsAt: new Date("2027-03-01T08:00:00Z"),
          desiredEndsAt: new Date("2027-03-01T16:00:00Z"),
          quantity: 40,
          budgetMinor: 5_000_000,
          fields: { [key]: "Kick-off" },
        },
        context,
      }),
    });
    expect(inquiry).toMatchObject({
      inquiryStatus: "NEW",
      contactId: contact.id,
      quantity: 40,
      budgetMinor: 5_000_000,
      lossReason: null,
      fields: { [key]: "Kick-off" },
    });
    const listed = unwrap({
      result: await execute({ operation: listInquiries, input: { inquiryStatus: "NEW" }, context }),
    });
    expect(listed.items.map((item) => item.id)).toEqual([inquiry.id]);
  });

  it("refuses a contact at another customer and a desired end before the start", async () => {
    const { context, type, customer } = await inquirySetup();
    const other = await createTestCustomer({ context, name: "Other AB" });
    const contact = await createTestContact({ context, customerId: other.id });
    const base = { entityTypeId: type.id, customerId: customer.id };
    const wrongContact = await execute({
      operation: createInquiry,
      input: { ...base, contactId: contact.id },
      context,
    });
    expect(errorCode({ result: wrongContact })).toBe("VALIDATION");
    const backwards = await execute({
      operation: createInquiry,
      input: {
        ...base,
        desiredStartsAt: new Date("2027-03-02T08:00:00Z"),
        desiredEndsAt: new Date("2027-03-01T08:00:00Z"),
      },
      context,
    });
    expect(errorCode({ result: backwards })).toBe("VALIDATION");
  });

  it("never changes status or owner through update", async () => {
    const { context, type, customer } = await inquirySetup();
    const inquiry = await createTestInquiry({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
    });
    const sneaky = {
      id: inquiry.id,
      quantity: 25,
      inquiryStatus: "WON",
      assigneeId: "user_x",
      lossReason: "nope",
    } as InquiryUpdateInput;
    const updated = unwrap({
      result: await execute({ operation: updateInquiry, input: sneaky, context }),
    });
    expect(updated).toMatchObject({
      quantity: 25,
      inquiryStatus: "NEW",
      lossReason: null,
    });
  });

  it("keeps inquiries inside the organization", async () => {
    const { context, type, customer } = await inquirySetup();
    const inquiry = await createTestInquiry({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
    });
    const outsider = await testOrg();
    const read = await execute({
      operation: getInquiry,
      input: { id: inquiry.id },
      context: outsider,
    });
    expect(errorCode({ result: read })).toBe("NOT_FOUND");
    const own = await execute({
      operation: getInquiry,
      input: { id: inquiry.id },
      context: peer({ of: context, access: "read" }),
    });
    expect(own.ok).toBe(true);
  });
});

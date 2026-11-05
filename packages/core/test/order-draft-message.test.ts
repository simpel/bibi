import { getDb } from "@bibi/db";
import { afterEach, describe, expect, it } from "vitest";
import { formFieldDraft } from "../src/features/order-draft/form-fields";
import { createOrder, execute, setExtract } from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { inboxSetup, mailTo } from "./inbound-message-helpers";
import { draft, EMPTY_DRAFT, mockModel, said } from "./order-draft-helpers";
import { contactAt } from "./order-helpers";

afterEach(() => setExtract({ extract: undefined }));

describe("orderDraft.fromMessage from an inbox message (ADR 0084, 0085)", () => {
  it("takes the sender as given and resolves a date from when the message came in", async () => {
    const setup = await inboxSetup();
    const message = await mailTo({ recipients: [setup.address] });
    const date = { asWritten: "1 Oct", year: null, month: 10, day: 1, quote: "40", guessed: false };
    const calls = mockModel({
      answer: { ...EMPTY_DRAFT, date, email: said({ value: "other@invented.test" }) },
    });
    const input = { inboundMessageId: message.id };
    const result = unwrap({ result: await draft({ context: setup.context, input }) });
    // Received 2026-10-15: 1 October has passed, so it is next year's.
    expect(result.date?.value).toBe("2027-10-01");
    expect(result.email).toEqual({
      value: "guest@example.test",
      quote: "guest@example.test",
      guessed: false,
    });
    // A public (example) domain matches no customer.
    expect(result.customerId).toBeNull();
    expect(result.inboundMessageId).toBe(message.id);
    expect(calls[0]?.prompt).toContain("We will be 40 guests.");
    expect(calls[0]?.prompt).not.toContain("guest@example.test");
  });

  it("is NOT_FOUND for another organization's message and needs inbox:read", async () => {
    const setup = await inboxSetup();
    const message = await mailTo({ recipients: [setup.address] });
    mockModel({ answer: EMPTY_DRAFT });
    const input = { inboundMessageId: message.id };
    const other = testContext();
    expect(errorCode({ result: await draft({ context: other, input }) })).toBe("NOT_FOUND");
    const noInbox = { ...setup.context, permissions: { order: ["write"] as const } };
    expect(errorCode({ result: await draft({ context: noInbox, input }) })).toBe("VALIDATION");
  });

  it("takes form fields as given and leaves what does not parse to the model", () => {
    const overlay = formFieldDraft({
      fields: { date: "2026-12-21", from: "15:00", guests: 14, email: "a@b.se", to: "late" },
    });
    expect(overlay.date).toMatchObject({ year: 2026, month: 12, day: 21, guessed: false });
    expect(overlay.start).toMatchObject({ time: "15:00", quote: "15:00", guessed: false });
    expect(overlay.end).toBeUndefined();
    expect(overlay.headcount).toEqual({ value: 14, quote: "14", guessed: false });
    expect(overlay.email).toEqual({ value: "a@b.se", quote: "a@b.se", guessed: false });
  });

  it("records on the created order's audit that it was drafted from the message", async () => {
    const { context, type, customer, address } = await inboxSetup();
    const message = await mailTo({ recipients: [address] });
    const contact = await contactAt({ context, customerId: customer.id });
    const input = {
      ...{ entityTypeId: type.id, customerId: customer.id, contactId: contact.id },
      ...{ inboundMessageId: message.id, draftedFromMessage: true },
    };
    const order = unwrap({ result: await execute({ operation: createOrder, input, context }) });
    const rows = await getDb().auditLog.findMany({
      where: { organizationId: context.organizationId, entityType: "order", entityId: order.id },
    });
    const afters = rows.map((row) => row.after);
    expect(afters).toContainEqual({ draftedFromMessage: true, inboundMessageId: message.id });
  });
});

import { describe, expect, it } from "vitest";
import {
  archiveCustomer,
  archiveItem,
  archiveSetup,
  createEntityType,
  type ExecuteContext,
  execute,
  grantAll,
  saveItemAsPackage,
} from "../src/index";
import { bookingSetup, createTestBooking } from "./booking-helpers";
import { errorCode, testContext, unwrap } from "./helpers";
import { createTestInquiry } from "./inquiry-helpers";
import { createMealSetup } from "./item-choice-group-helpers";
import { addProgramItem, programSetup } from "./program-item-helpers";

type ArchiveInput = {
  context: ExecuteContext;
  id: string;
  archiveBookings?: boolean;
  archiveInquiries?: boolean;
};

const archive = ({ context, ...input }: ArchiveInput) =>
  execute({ operation: archiveCustomer, input, context });

describe("customer.archive with inquiries (#159)", () => {
  it("is blocked by an active inquiry unless archiveInquiries is set, then audits it", async () => {
    const { context, customer } = await bookingSetup();
    const inquiryType = unwrap({
      result: await execute({
        operation: createEntityType,
        input: { base: "INQUIRY", name: "Meeting" },
        context,
      }),
    });
    const inquiry = await createTestInquiry({
      context,
      entityTypeId: inquiryType.id,
      customerId: customer.id,
    });
    const refused = await archive({ context: context, id: customer.id });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    if (refused.ok) throw new Error("expected a conflict");
    expect(refused.error.issues?.[0]?.path).toBe("archiveInquiries");

    const reader = testContext({
      organizationId: context.organizationId,
      permissions: { ...grantAll({ upTo: "admin" }), inquiry: ["read" as const] },
    });
    const forbidden = await archive({ context: reader, id: customer.id, archiveInquiries: true });
    expect(errorCode({ result: forbidden })).toBe("FORBIDDEN");

    unwrap({
      result: await archive({ context: context, id: customer.id, archiveInquiries: true }),
    });
    const row = await context.db.inquiry.findFirst({
      where: { id: inquiry.id, status: "ARCHIVED" },
    });
    expect(row).not.toBeNull();
    const audit = await context.db.auditLog.findMany({
      where: { operation: "customer.archive", entityType: "inquiry", entityId: inquiry.id },
    });
    expect(audit).toHaveLength(1);
  });
});

describe("customer.archive with packages (#151)", () => {
  it("archives the customer's packages with it, one audit row each", async () => {
    const { context, customer } = await bookingSetup();
    const { meal, cod, veal } = await createMealSetup({ context });
    const pkg = unwrap({
      result: await execute({
        operation: saveItemAsPackage,
        input: {
          entityTypeId: meal.id,
          customerId: customer.id,
          name: "Acme lunch",
          components: [{ itemId: cod }, { itemId: veal }],
        },
        context,
      }),
    });
    unwrap({ result: await archive({ context: context, id: customer.id }) });
    const row = await context.db.item.findFirst({ where: { id: pkg.id, status: "ARCHIVED" } });
    expect(row).not.toBeNull();
    const audit = await context.db.auditLog.findMany({
      where: { operation: "customer.archive", entityType: "item", entityId: pkg.id },
    });
    expect(audit).toHaveLength(1);
  });
});

describe("archiving bookings releases program items and rooms (#166, #145)", () => {
  it("frees the room after the customer cascade and archives the program item", async () => {
    const { context, booking, type, room, setup } = await programSetup();
    const base = { context, bookingId: booking.id, entityTypeId: type.id, itemId: room.id };
    const item = unwrap({
      result: await addProgramItem({ ...base, from: 10, to: 12, setupId: setup.id }),
    });
    const other = await createTestBooking({
      context,
      entityTypeId: booking.entityTypeId,
      customerId: booking.customerId,
    });
    const clash = await addProgramItem({ ...base, bookingId: other.id, from: 10, to: 12 });
    expect(errorCode({ result: clash })).toBe("CONFLICT");

    unwrap({
      result: await archive({ context: context, id: booking.customerId, archiveBookings: true }),
    });

    const archived = await context.db.programItem.findFirst({
      where: { id: item.id, status: "ARCHIVED" },
    });
    expect(archived).not.toBeNull();
    const held = await context.db.occupancy.findMany({
      where: { sourceType: "programItem", sourceId: item.id },
    });
    expect(held).toHaveLength(0);
    const audit = await context.db.auditLog.findMany({
      where: { operation: "customer.archive", entityType: "programItem" },
    });
    expect(audit).toHaveLength(1);
  });
});

describe("item.archive and setup.archive with program items", () => {
  it("are refused while an active program item uses the item or the setup", async () => {
    const { context, booking, type, room, setup } = await programSetup();
    const base = { context, bookingId: booking.id, entityTypeId: type.id, itemId: room.id };
    unwrap({ result: await addProgramItem({ ...base, from: 10, to: 12, setupId: setup.id }) });
    const item = await execute({ operation: archiveItem, input: { id: room.id }, context });
    expect(errorCode({ result: item })).toBe("CONFLICT");
    const archivedSetup = await execute({
      operation: archiveSetup,
      input: { id: setup.id },
      context,
    });
    expect(errorCode({ result: archivedSetup })).toBe("CONFLICT");
  });
});

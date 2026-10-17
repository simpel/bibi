import { describe, expect, it } from "vitest";
import { createQuickBookingOperation, execute } from "../src/index";
import { memberUser } from "./booking-helpers";
import { errorCode, unwrap } from "./helpers";
import { hours } from "./occupancy-helpers";
import { programSetup } from "./program-item-helpers";

async function quickSetup() {
  const setup = await programSetup();
  const { context, booking, type, room } = setup;
  const assigneeId = await memberUser({ context, name: "Johan Ek" });
  const input = {
    entityTypeId: booking.entityTypeId,
    programItemTypeId: type.id,
    customerId: booking.customerId,
    itemId: room.id,
    quantity: 8,
    assigneeId,
    ...hours({ from: 9, to: 11 }),
  };
  return { ...setup, input };
}

describe("booking.createQuick (ADR 0022)", () => {
  it("creates booking and program item, confirmed at once against invoice", async () => {
    const { context, input, room } = await quickSetup();
    const booking = unwrap({
      result: await execute({
        operation: createQuickBookingOperation,
        input: { ...input, paymentMethod: "INVOICE" },
        context,
      }),
    });
    const status = await context.db.bookingStatus.findFirstOrThrow({
      where: { id: booking.bookingStatusId },
    });
    expect(status.phase).toBe("CONFIRMED");
    expect(booking).toMatchObject({ estimatedHeadcount: 8 });
    const assigned = await context.db.assignment.findFirst({ where: { subjectId: booking.id } });
    expect(assigned?.assigneeId).toBe(input.assigneeId);
    const items = await context.db.programItem.findMany({ where: { bookingId: booking.id } });
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ itemId: room.id, quantity: 8 });
    const occupied = await context.db.occupancy.count({ where: { itemId: room.id } });
    expect(occupied).toBeGreaterThan(0);
  });

  it("leaves the booking tentative when paid by payment link", async () => {
    const { context, input } = await quickSetup();
    const booking = unwrap({
      result: await execute({
        operation: createQuickBookingOperation,
        input: { ...input, paymentMethod: "PAYMENT_LINK" },
        context,
      }),
    });
    const status = await context.db.bookingStatus.findFirstOrThrow({
      where: { id: booking.bookingStatusId },
    });
    expect(status.phase).toBe("TENTATIVE");
  });

  it("creates nothing when the item is occupied", async () => {
    const { context, input } = await quickSetup();
    const run = () =>
      execute({
        operation: createQuickBookingOperation,
        input: { ...input, paymentMethod: "INVOICE" },
        context,
      });
    unwrap({ result: await run() });
    const before = await context.db.booking.count();
    expect(errorCode({ result: await run() })).toBe("CONFLICT");
    expect(await context.db.booking.count()).toBe(before);
  });

  it("refuses an unknown item", async () => {
    const { context, input } = await quickSetup();
    const result = await execute({
      operation: createQuickBookingOperation,
      input: { ...input, itemId: "nope", paymentMethod: "INVOICE" },
      context,
    });
    expect(errorCode({ result })).toBe("VALIDATION");
  });
});

import { describe, expect, it } from "vitest";
import { changeBookingStatus, execute } from "../src/index";
import { createTestBooking } from "./booking-helpers";
import { statusByName } from "./booking-status-helpers";
import { errorCode, unwrap } from "./helpers";
import { addProgramItem, programSetup } from "./program-item-helpers";

describe("cancelling a booking releases its program items' occupancy (ADR 0022)", () => {
  it("frees the item and the changeover for another booking, keeping the program item", async () => {
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

    const cancelled = await statusByName({ context, name: "Cancelled" });
    unwrap({
      result: await execute({
        operation: changeBookingStatus,
        input: { bookingId: booking.id, statusId: cancelled.id, reason: "Moved online" },
        context,
      }),
    });

    const retry = await addProgramItem({ ...base, bookingId: other.id, from: 9, to: 12 });
    expect(errorCode({ result: retry })).toBeNull();
    const kept = await context.db.programItem.findFirstOrThrow({ where: { id: item.id } });
    expect(kept.status).toBe("ACTIVE");
    const audit = await context.db.auditLog.findMany({
      where: { entityType: "occupancy", operation: "booking.changeStatus" },
    });
    expect(audit).toHaveLength(2);
  });
});

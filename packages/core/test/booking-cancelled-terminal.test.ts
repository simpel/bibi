import { describe, expect, it } from "vitest";
import { changeBookingStatus, execute, setBookingStatusTransitions } from "../src/index";
import { bookingSetup, createTestBooking } from "./booking-helpers";
import { provisionedContext, statusByName } from "./booking-status-helpers";
import { errorCode, unwrap } from "./helpers";

describe("CANCELLED is terminal (ADR 0022)", () => {
  it("refuses transitions out of a CANCELLED-phase status in setTransitions", async () => {
    const context = await provisionedContext();
    const cancelled = await statusByName({ context, name: "Cancelled" });
    const tentative = await statusByName({ context, name: "Tentative" });
    const refused = await execute({
      operation: setBookingStatusTransitions,
      input: { id: cancelled.id, toStatusIds: [tentative.id] },
      context,
    });
    expect(errorCode({ result: refused })).toBe("VALIDATION");
    const empty = unwrap({
      result: await execute({
        operation: setBookingStatusTransitions,
        input: { id: cancelled.id, toStatusIds: [] },
        context,
      }),
    });
    expect(empty.transitionsTo).toEqual([]);
  });

  it("refuses to reopen a cancelled booking, even with a stray transition row", async () => {
    const { context, type, customer } = await bookingSetup();
    const booking = await createTestBooking({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
    });
    const cancelled = await statusByName({ context, name: "Cancelled" });
    const tentative = await statusByName({ context, name: "Tentative" });
    unwrap({
      result: await execute({
        operation: changeBookingStatus,
        input: { bookingId: booking.id, statusId: cancelled.id, reason: "Moved" },
        context,
      }),
    });
    await context.db.bookingStatusTransition.create({
      data: {
        organizationId: context.organizationId,
        fromStatusId: cancelled.id,
        toStatusId: tentative.id,
      },
    });
    const reopened = await execute({
      operation: changeBookingStatus,
      input: { bookingId: booking.id, statusId: tentative.id },
      context,
    });
    expect(errorCode({ result: reopened })).toBe("CONFLICT");
  });
});

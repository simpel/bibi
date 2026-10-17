import { describe, expect, it } from "vitest";
import { changeBookingStatus, execute } from "../src/index";
import { bookingSetup, createTestBooking, memberUser } from "./booking-helpers";
import { statusByName } from "./booking-status-helpers";
import { errorCode, unwrap } from "./helpers";
import { createBookableItem, insertRaw } from "./occupancy-helpers";
import { testOrg } from "./org-helpers";

describe("booking.changeStatus (ADR 0022)", () => {
  it("moves along an allowed transition and audits the change", async () => {
    const { context, type, customer } = await bookingSetup();
    const assigneeId = await memberUser({ context, name: "Johan Ek" });
    const booking = await createTestBooking({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
      assigneeId,
    });
    const confirmed = await statusByName({ context, name: "Confirmed" });
    const input = { bookingId: booking.id, statusId: confirmed.id };
    const moved = unwrap({
      result: await execute({ operation: changeBookingStatus, input, context }),
    });
    expect(moved).toMatchObject({ bookingStatusId: confirmed.id, statusReason: null });
    expect(moved.statusChangedAt.getTime()).toBeGreaterThan(booking.statusChangedAt.getTime());
    const audit = await context.db.auditLog.findFirstOrThrow({
      where: { entityId: booking.id, operation: "booking.changeStatus" },
    });
    expect(audit.before).toMatchObject({ bookingStatusId: booking.bookingStatusId });
    expect(audit.after).toMatchObject({ bookingStatusId: confirmed.id });
  });

  it("refuses transitions the organization does not allow, and unknown ids", async () => {
    const { context, type, customer } = await bookingSetup();
    const booking = await createTestBooking({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
    });
    const completed = await statusByName({ context, name: "Completed" });
    const tentative = await statusByName({ context, name: "Tentative" });
    const change = ({ bookingId, statusId }: { bookingId: string; statusId: string }) =>
      execute({ operation: changeBookingStatus, input: { bookingId, statusId }, context });
    expect(
      errorCode({ result: await change({ bookingId: booking.id, statusId: completed.id }) }),
    ).toBe("CONFLICT");
    expect(
      errorCode({ result: await change({ bookingId: booking.id, statusId: tentative.id }) }),
    ).toBe("CONFLICT");
    expect(errorCode({ result: await change({ bookingId: booking.id, statusId: "nope" }) })).toBe(
      "VALIDATION",
    );
    expect(errorCode({ result: await change({ bookingId: "nope", statusId: completed.id }) })).toBe(
      "NOT_FOUND",
    );
  });

  it("never reads another organization's booking or status", async () => {
    const { context, type, customer } = await bookingSetup();
    const booking = await createTestBooking({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
    });
    const other = await bookingSetup();
    const foreign = await statusByName({ context: other.context, name: "Cancelled" });
    const ownCancelled = await statusByName({ context, name: "Cancelled" });
    const withForeignStatus = await execute({
      operation: changeBookingStatus,
      input: { bookingId: booking.id, statusId: foreign.id, reason: "Test" },
      context,
    });
    expect(errorCode({ result: withForeignStatus })).toBe("VALIDATION");
    const fromOutside = await execute({
      operation: changeBookingStatus,
      input: { bookingId: booking.id, statusId: ownCancelled.id, reason: "Test" },
      context: await testOrg(),
    });
    expect(errorCode({ result: fromOutside })).toBe("NOT_FOUND");
  });

  it("cancels only with a reason and releases the booking's occupancy", async () => {
    const { context, type, customer } = await bookingSetup();
    const booking = await createTestBooking({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
    });
    const item = await createBookableItem({ context });
    const held = await context.db.occupancy.update({
      where: {
        id: (await insertRaw({ context, itemId: item.id, type: "BOOKING", from: 9, to: 12 })).id,
      },
      data: { sourceType: "booking", sourceId: booking.id },
    });
    const unrelated = await insertRaw({
      context,
      itemId: item.id,
      type: "OPTION",
      from: 9,
      to: 12,
    });
    const cancelled = await statusByName({ context, name: "Cancelled" });
    const withoutReason = await execute({
      operation: changeBookingStatus,
      input: { bookingId: booking.id, statusId: cancelled.id },
      context,
    });
    expect(withoutReason.ok ? null : withoutReason.error.issues[0]?.path).toBe("reason");
    const done = unwrap({
      result: await execute({
        operation: changeBookingStatus,
        input: { bookingId: booking.id, statusId: cancelled.id, reason: "The event moved online" },
        context,
      }),
    });
    expect(done).toMatchObject({
      bookingStatusId: cancelled.id,
      statusReason: "The event moved online",
    });
    const rows = await context.db.occupancy.findMany({
      where: { id: { in: [held.id, unrelated.id] }, status: { in: ["ACTIVE", "ARCHIVED"] } },
    });
    const statusOf = ({ id }: { id: string }) => rows.find((row) => row.id === id)?.status;
    expect(statusOf({ id: held.id })).toBe("ARCHIVED");
    expect(statusOf({ id: unrelated.id })).toBe("ACTIVE");
    const audit = await context.db.auditLog.count({ where: { entityId: held.id } });
    expect(audit).toBe(1);
  });
});

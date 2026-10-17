import { describe, expect, it } from "vitest";
import { changeBookingStatus, execute, setBookingStatusTransitions } from "../src/index";
import { bookingSetup, createTestBooking, memberUser } from "./booking-helpers";
import { statusByName } from "./booking-status-helpers";
import { errorCode, unwrap } from "./helpers";

const HOUR = 3_600_000;

/** An organization whose Tentative status may jump straight to every other status. */
async function permissiveSetup() {
  const setup = await bookingSetup();
  const { context } = setup;
  const tentative = await statusByName({ context, name: "Tentative" });
  const confirmed = await statusByName({ context, name: "Confirmed" });
  const completed = await statusByName({ context, name: "Completed" });
  const cancelled = await statusByName({ context, name: "Cancelled" });
  unwrap({
    result: await execute({
      operation: setBookingStatusTransitions,
      input: { id: tentative.id, toStatusIds: [confirmed.id, completed.id, cancelled.id] },
      context,
    }),
  });
  return { ...setup, confirmed, completed, cancelled };
}

type BookingInput = { past: boolean; coordinated: boolean };

describe("custom transitions never bypass the phase rules (ADR 0022)", () => {
  it.each([
    { target: "confirmed", past: false, coordinated: false, reason: undefined, code: "CONFLICT" },
    { target: "confirmed", past: false, coordinated: true, reason: undefined, code: null },
    { target: "completed", past: false, coordinated: true, reason: undefined, code: "CONFLICT" },
    { target: "completed", past: true, coordinated: false, reason: undefined, code: "CONFLICT" },
    { target: "completed", past: true, coordinated: true, reason: undefined, code: null },
    { target: "cancelled", past: false, coordinated: false, reason: undefined, code: "VALIDATION" },
    { target: "cancelled", past: false, coordinated: false, reason: "Moved", code: null },
  ] as const)(
    "Tentative → $target past=$past coordinated=$coordinated reason=$reason → $code",
    async ({ target, past, coordinated, reason, code }) => {
      const setup = await permissiveSetup();
      const { context } = setup;
      const booking = await bookingFor({ setup, past, coordinated });
      const result = await execute({
        operation: changeBookingStatus,
        input: { bookingId: booking.id, statusId: setup[target].id, ...(reason ? { reason } : {}) },
        context,
      });
      expect(errorCode({ result })).toBe(code);
      const after = await context.db.booking.findUniqueOrThrow({ where: { id: booking.id } });
      expect(after.bookingStatusId).toBe(code ? booking.bookingStatusId : setup[target].id);
    },
  );
});

type BookingForInput = BookingInput & { setup: Awaited<ReturnType<typeof bookingSetup>> };

async function bookingFor({ setup, past, coordinated }: BookingForInput) {
  const { context, type, customer } = setup;
  const startsAt = new Date(Date.now() + (past ? -3 : 24) * HOUR);
  return createTestBooking({
    context,
    entityTypeId: type.id,
    customerId: customer.id,
    startsAt,
    endsAt: new Date(startsAt.getTime() + 2 * HOUR),
    ...(coordinated ? { assigneeId: await memberUser({ context, name: "Johan Ek" }) } : {}),
  });
}

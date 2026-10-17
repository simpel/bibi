import { getDb } from "@okazi/db";
import { describe, expect, it } from "vitest";
import { archiveCustomer, execute } from "../src/index";
import { bookingSetup, createTestBooking } from "./booking-helpers";
import { errorCode } from "./helpers";

async function setupWithBookings({ count }: { count: number }) {
  const setup = await bookingSetup();
  const { context, type, customer } = setup;
  for (let index = 0; index < count; index += 1)
    await createTestBooking({ context, entityTypeId: type.id, customerId: customer.id });
  return setup;
}

const activeBookings = ({ customerId }: { customerId: string }) =>
  getDb().booking.count({ where: { customerId, status: "ACTIVE" } });

describe("customer.archive expectedBookingCount (#144)", () => {
  it("refuses with CONFLICT when bookings were added after the approval", async () => {
    const { context, type, customer } = await setupWithBookings({ count: 2 });
    await createTestBooking({ context, entityTypeId: type.id, customerId: customer.id });
    const refused = await execute({
      operation: archiveCustomer,
      input: { id: customer.id, archiveBookings: true, expectedBookingCount: 2 },
      context,
    });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    if (refused.ok) throw new Error("expected a conflict");
    expect(refused.error.issues).toEqual([
      expect.objectContaining({ path: "expectedBookingCount" }),
    ]);
    expect(await activeBookings({ customerId: customer.id })).toBe(3);
  });

  it("archives when the count matches what was approved", async () => {
    const { context, customer } = await setupWithBookings({ count: 2 });
    const archived = await execute({
      operation: archiveCustomer,
      input: { id: customer.id, archiveBookings: true, expectedBookingCount: 2 },
      context,
    });
    expect(errorCode({ result: archived })).toBeNull();
    expect(await activeBookings({ customerId: customer.id })).toBe(0);
  });

  it("refuses when fewer bookings remain than were approved, even none", async () => {
    const { context, customer } = await setupWithBookings({ count: 0 });
    const refused = await execute({
      operation: archiveCustomer,
      input: { id: customer.id, archiveBookings: true, expectedBookingCount: 1 },
      context,
    });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    const row = await getDb().customer.findUnique({ where: { id: customer.id } });
    expect(row?.status).toBe("ACTIVE");
  });
});

import { getDb } from "@okazi/db";
import { describe, expect, it } from "vitest";
import { archiveCustomer, type ExecuteContext, execute, getBooking, grantAll } from "../src/index";
import { bookingSetup, createTestBooking } from "./booking-helpers";
import { statuses } from "./booking-status-helpers";
import { errorCode, testContext, unwrap } from "./helpers";

type BookingsInput = { context: ExecuteContext; entityTypeId: string; customerId: string };

/** One booking in each status phase (TENTATIVE, CONFIRMED, COMPLETED, CANCELLED). */
async function bookingPerPhase({ context, ...input }: BookingsInput): Promise<string[]> {
  const ids: string[] = [];
  for (const status of await statuses({ context })) {
    const booking = await createTestBooking({ context, ...input });
    // booking.changeStatus does not exist yet (#48), so the status is moved directly.
    await getDb().booking.update({
      where: { id: booking.id },
      data: { bookingStatusId: status.id },
    });
    ids.push(booking.id);
  }
  return ids;
}

async function setupWithBookings() {
  const setup = await bookingSetup();
  const { context, type, customer } = setup;
  const ids = await bookingPerPhase({ context, entityTypeId: type.id, customerId: customer.id });
  return { ...setup, ids };
}

const archivedStatus = async ({ ids }: { ids: string[] }) =>
  (await getDb().booking.findMany({ where: { id: { in: ids } } })).map((row) => row.status);

describe("customer.archive with the customer's bookings (#134)", () => {
  it("is blocked by bookings in every phase, with the count, unless archiveBookings is set", async () => {
    const { context, customer, ids } = await setupWithBookings();
    expect(ids).toHaveLength(4);
    const refused = await execute({
      operation: archiveCustomer,
      input: { id: customer.id },
      context,
    });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    if (refused.ok) throw new Error("expected a conflict");
    expect(refused.error.message).toContain("4 bookings");
    expect(refused.error.issues).toEqual([
      expect.objectContaining({ path: "archiveBookings", message: expect.stringContaining("4") }),
    ]);
    expect(await archivedStatus({ ids })).toEqual(["ACTIVE", "ACTIVE", "ACTIVE", "ACTIVE"]);
  });

  it("archives the customer and all its bookings, with one audit row each", async () => {
    const { context, customer, ids } = await setupWithBookings();
    const archived = unwrap({
      result: await execute({
        operation: archiveCustomer,
        input: { id: customer.id, archiveBookings: true },
        context,
      }),
    });
    expect(archived).toMatchObject({ status: "ARCHIVED", bookingCount: 0 });
    expect(await archivedStatus({ ids })).toEqual(Array(4).fill("ARCHIVED"));
    const gone = await execute({ operation: getBooking, input: { id: ids[0] ?? "" }, context });
    expect(errorCode({ result: gone })).toBe("NOT_FOUND");
    const audit = await getDb().auditLog.findMany({
      where: { organizationId: context.organizationId, operation: "customer.archive" },
    });
    const rows = audit.map((row) => [row.entityType, row.entityId]);
    expect(rows).toHaveLength(5);
    expect(rows).toEqual(
      expect.arrayContaining([["customer", customer.id], ...ids.map((id) => ["booking", id])]),
    );
    const bookingRow = audit.find((row) => row.entityId === ids[0]);
    expect(bookingRow?.before).toMatchObject({ status: "ACTIVE" });
    expect(bookingRow?.after).toMatchObject({ status: "ARCHIVED" });
  });

  it("never touches another organization's bookings", async () => {
    const own = await setupWithBookings();
    const other = await setupWithBookings();
    unwrap({
      result: await execute({
        operation: archiveCustomer,
        input: { id: own.customer.id, archiveBookings: true },
        context: own.context,
      }),
    });
    expect(await archivedStatus({ ids: other.ids })).toEqual(Array(4).fill("ACTIVE"));
    const foreign = await execute({
      operation: archiveCustomer,
      input: { id: other.customer.id, archiveBookings: true },
      context: own.context,
    });
    expect(errorCode({ result: foreign })).toBe("NOT_FOUND");
    expect(await archivedStatus({ ids: other.ids })).toEqual(Array(4).fill("ACTIVE"));
  });

  it("needs booking:write to archive the bookings and then changes nothing", async () => {
    const { context, customer, ids } = await setupWithBookings();
    const permissions = { ...grantAll({ upTo: "admin" }), booking: ["read" as const] };
    const reader = testContext({ organizationId: context.organizationId, permissions });
    const refused = await execute({
      operation: archiveCustomer,
      input: { id: customer.id, archiveBookings: true },
      context: reader,
    });
    expect(errorCode({ result: refused })).toBe("FORBIDDEN");
    expect(await archivedStatus({ ids })).toEqual(Array(4).fill("ACTIVE"));
  });

  it("ignores bookings that are already archived", async () => {
    const { context, customer, ids } = await setupWithBookings();
    await getDb().booking.updateMany({ where: { id: { in: ids } }, data: { status: "ARCHIVED" } });
    const archived = await execute({
      operation: archiveCustomer,
      input: { id: customer.id },
      context,
    });
    expect(errorCode({ result: archived })).toBeNull();
  });
});

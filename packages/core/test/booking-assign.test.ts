import { getDb } from "@okazi/db";
import { describe, expect, it } from "vitest";
import { assignBooking, createBooking, execute } from "../src/index";
import { bookingSetup, createTestBooking, memberUser } from "./booking-helpers";
import { statuses } from "./booking-status-helpers";
import { errorCode, unwrap } from "./helpers";
import { testOrg } from "./org-helpers";

describe("booking.assign (ADR 0022)", () => {
  it("changes salesperson and coordinator and audits each change", async () => {
    const { context, type, customer } = await bookingSetup();
    const erik = await memberUser({ context, name: "Erik Lund" });
    const johan = await memberUser({ context, name: "Johan Ek" });
    const booking = await createTestBooking({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
      salesOwnerId: erik,
    });
    expect(booking.salesOwnerId).toBe(erik);
    const assigned = unwrap({
      result: await execute({
        operation: assignBooking,
        input: { id: booking.id, coordinatorId: johan },
        context,
      }),
    });
    expect(assigned).toMatchObject({ salesOwnerId: erik, coordinatorId: johan });
    const cleared = unwrap({
      result: await execute({
        operation: assignBooking,
        input: { id: booking.id, salesOwnerId: null },
        context,
      }),
    });
    expect(cleared).toMatchObject({ salesOwnerId: null, coordinatorId: johan });
    const rows = await context.db.auditLog.findMany({
      where: { entityId: booking.id },
      orderBy: { createdAt: "asc" },
    });
    expect(rows.map((row) => row.operation)).toEqual([
      "booking.create",
      "booking.assign",
      "booking.assign",
    ]);
    expect(rows[1]?.before).toMatchObject({ coordinatorId: null });
    expect(rows[1]?.after).toMatchObject({ coordinatorId: johan });
  });

  it("refuses owners who are not members of the organization", async () => {
    const { context, type, customer } = await bookingSetup();
    const elsewhere = await memberUser({ context: await testOrg(), name: "Outsider" });
    const booking = await createTestBooking({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
    });
    const assign = await execute({
      operation: assignBooking,
      input: { id: booking.id, salesOwnerId: elsewhere },
      context,
    });
    expect(assign.ok ? null : assign.error.issues[0]?.path).toBe("salesOwnerId");
    const assignCoordinator = await execute({
      operation: assignBooking,
      input: { id: booking.id, coordinatorId: elsewhere },
      context,
    });
    expect(assignCoordinator.ok ? null : assignCoordinator.error.issues[0]?.path).toBe(
      "coordinatorId",
    );
    const create = await execute({
      operation: createBooking,
      input: {
        entityTypeId: type.id,
        customerId: customer.id,
        startsAt: booking.startsAt,
        endsAt: booking.endsAt,
        coordinatorId: "user_unknown",
      },
      context,
    });
    expect(create.ok ? null : create.error.issues[0]?.path).toBe("coordinatorId");
    const empty = await execute({ operation: assignBooking, input: { id: booking.id }, context });
    expect(errorCode({ result: empty })).toBe("VALIDATION");
  });

  it("keeps the coordinator from the CONFIRMED phase on", async () => {
    const { context, type, customer } = await bookingSetup();
    const johan = await memberUser({ context, name: "Johan Ek" });
    const booking = await createTestBooking({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
      coordinatorId: johan,
    });
    const confirmed = (await statuses({ context })).find((s) => s.phase === "CONFIRMED");
    // booking.changeStatus does not exist yet (#48), so the status is moved directly.
    await getDb().booking.update({
      where: { id: booking.id },
      data: { bookingStatusId: confirmed?.id ?? "" },
    });
    const removed = await execute({
      operation: assignBooking,
      input: { id: booking.id, coordinatorId: null },
      context,
    });
    expect(errorCode({ result: removed })).toBe("CONFLICT");
    const maria = await memberUser({ context, name: "Maria Holm" });
    const replaced = await execute({
      operation: assignBooking,
      input: { id: booking.id, coordinatorId: maria },
      context,
    });
    expect(errorCode({ result: replaced })).toBeNull();
  });
});

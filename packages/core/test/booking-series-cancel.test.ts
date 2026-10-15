import { describe, expect, it } from "vitest";
import {
  cancelBookingSeries,
  createBookingSeries,
  type ExecuteContext,
  execute,
} from "../src/index";
import { bookingsOn, seriesSetup, updateOccurrences } from "./booking-series-helpers";
import { errorCode, unwrap } from "./helpers";

const WEEK = 7 * 24 * 3_600_000;

/** A weekly series that started three weeks ago: occurrences 1–3 are past, 4–6 upcoming. */
async function runningSeries() {
  const { context, type, customer, room } = await seriesSetup();
  const startsAt = new Date(Date.now() - 3 * WEEK + 3_600_000);
  const input = {
    ...{ entityTypeId: type.id, customerId: customer.id, itemIds: [room.id] },
    ...{ rule: "FREQ=WEEKLY;COUNT=6", startsAt, durationMinutes: 60 },
  };
  const series = unwrap({
    result: await execute({ operation: createBookingSeries, input, context }),
  });
  const completed = await context.db.bookingStatus.findFirstOrThrow({
    where: { phase: "COMPLETED" },
  });
  const first = series.occurrences[0]?.bookingId ?? "";
  await context.db.booking.update({
    where: { id: first },
    data: { bookingStatusId: completed.id },
  });
  return { context, room, series, completedId: completed.id };
}

const cancel = ({ context, id }: { context: ExecuteContext; id: string }) =>
  execute({ operation: cancelBookingSeries, input: { id, reason: "Customer moved" }, context });

describe("bookingSeries.cancel (ADR 0023)", () => {
  it("cancels the upcoming occurrences and leaves completed and past ones untouched", async () => {
    const { context, room, series, completedId } = await runningSeries();
    const cancelled = unwrap({ result: await cancel({ context, id: series.id }) });
    const status = await context.db.bookingStatus.findFirstOrThrow({
      where: { phase: "CANCELLED" },
    });
    const statuses = cancelled.occurrences.map((o) => o.bookingStatusId);
    const tentative = series.occurrences[1]?.bookingStatusId;
    expect(statuses).toEqual([completedId, tentative, tentative, ...Array(3).fill(status.id)]);
    expect(cancelled.occurrences.slice(0, 3).map((o) => o.startsAt)).toEqual(
      series.occurrences.slice(0, 3).map((o) => o.startsAt),
    );
    const held = await bookingsOn({ context, itemId: room.id });
    expect(held.sort()).toEqual(
      series.occurrences
        .slice(0, 3)
        .map((o) => o.bookingId)
        .sort(),
    );
    expect(cancelled.cancelledAt).toBeInstanceOf(Date);
    expect(cancelled.cancellationReason).toBe("Customer moved");
    const audit = await context.db.auditLog.findMany({
      where: { operation: "bookingSeries.cancel", entityType: "booking" },
    });
    expect(audit).toHaveLength(3);
  });

  it("refuses a second cancel, later changes and a status outside the CANCELLED phase", async () => {
    const { context, series, completedId } = await runningSeries();
    const wrong = await execute({
      operation: cancelBookingSeries,
      input: { id: series.id, reason: "x", statusId: completedId },
      context,
    });
    expect(errorCode({ result: wrong })).toBe("VALIDATION");
    unwrap({ result: await cancel({ context, id: series.id }) });
    expect(errorCode({ result: await cancel({ context, id: series.id }) })).toBe("CONFLICT");
    const change = await updateOccurrences({
      ...{ context, seriesId: series.id, fromIndex: 2, scope: "THIS" },
      patch: { estimatedHeadcount: 4 },
    });
    expect(errorCode({ result: change })).toBe("CONFLICT");
  });
});

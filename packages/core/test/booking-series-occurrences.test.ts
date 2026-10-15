import { describe, expect, it } from "vitest";
import {
  blockOccurrence,
  bookingsOn,
  createS1,
  S1_START,
  seriesSetup,
  updateOccurrences,
} from "./booking-series-helpers";
import { errorCode, unwrap } from "./helpers";
import { createTestItem } from "./item-helpers";
import { testOrg } from "./org-helpers";

const HOUR = 3_600_000;

/** S1 with occurrence 4 blocked in the room, plus a second room "Vrångö" of the same type. */
async function s1WithClash() {
  const { context, type, customer, room } = await seriesSetup();
  const vrango = await createTestItem({ context, entityTypeId: room.entityTypeId, name: "Vrångö" });
  await blockOccurrence({ context, itemId: room.id, index: 4 });
  const input = { context, entityTypeId: type.id, customerId: customer.id, itemIds: [room.id] };
  const series = unwrap({ result: await createS1(input) });
  return { context, room, vrango, series };
}

describe("bookingSeries.updateOccurrences (ADR 0023)", () => {
  it("moves S1's clashing occurrence 4 alone to Vrångö", async () => {
    const { context, room, vrango, series } = await s1WithClash();
    const patch = { itemIds: [vrango.id] };
    const input = { context, seriesId: series.id, fromIndex: 4, scope: "THIS" as const, patch };
    const updated = unwrap({ result: await updateOccurrences(input) });
    const fourth = updated.occurrences.find((o) => o.occurrenceIndex === 4);
    expect(updated.clashes).toEqual([]);
    expect(await bookingsOn({ context, itemId: vrango.id })).toEqual([fourth?.bookingId]);
    expect(await bookingsOn({ context, itemId: room.id })).toHaveLength(9);
    expect(updated.template.itemIds).toEqual([room.id]);
    const audit = await context.db.auditLog.findMany({
      where: { operation: "bookingSeries.updateOccurrences", entityType: "booking" },
    });
    expect(audit.map((row) => row.entityId)).toEqual([fourth?.bookingId]);
  });

  it("moves a single occurrence to another time and refuses a taken slot", async () => {
    const { context, room, series } = await s1WithClash();
    const third = series.occurrences[2];
    const taken = updateOccurrences({
      ...{ context, seriesId: series.id, fromIndex: 3, scope: "THIS" },
      patch: { itemIds: [room.id], startsAt: series.occurrences[3]?.startsAt },
    });
    expect(errorCode({ result: await taken })).toBe("CONFLICT");
    const later = new Date((series.occurrences[3]?.startsAt.getTime() ?? 0) + 5 * HOUR);
    const moved = unwrap({
      result: await updateOccurrences({
        ...{ context, seriesId: series.id, fromIndex: 4, scope: "THIS" },
        patch: { startsAt: later },
      }),
    });
    const fourth = moved.occurrences[3];
    expect(fourth?.startsAt).toEqual(later);
    expect(fourth?.clash).toBe(false);
    expect(moved.occurrences[2]).toEqual(third);
    expect(moved.startsAt).toEqual(S1_START);
  });

  it("changes this and following occurrences and the template going forward", async () => {
    const { context, vrango, series } = await s1WithClash();
    const startsAt = new Date((series.occurrences[5]?.startsAt.getTime() ?? 0) + HOUR);
    const patch = { itemIds: [vrango.id], startsAt, estimatedHeadcount: 12 };
    const input = { context, seriesId: series.id, fromIndex: 6, scope: "FOLLOWING" as const };
    const updated = unwrap({ result: await updateOccurrences({ ...input, patch }) });
    const following = updated.occurrences.slice(5);
    expect(await bookingsOn({ context, itemId: vrango.id })).toHaveLength(5);
    following.forEach((o, i) => {
      expect(o.startsAt.getTime()).toBe(
        (series.occurrences[5 + i]?.startsAt.getTime() ?? 0) + HOUR,
      );
    });
    expect(updated.occurrences.slice(0, 5)).toEqual(series.occurrences.slice(0, 5));
    expect(updated.template).toMatchObject({ itemIds: [vrango.id], estimatedHeadcount: 12 });
    expect(updated.startsAt).toEqual(new Date(S1_START.getTime() + HOUR));
    expect(updated.clashes.map((o) => o.occurrenceIndex)).toEqual([4]);
  });

  it("is scoped to the organization and refuses unknown items", async () => {
    const { context, series } = await s1WithClash();
    const base = { seriesId: series.id, fromIndex: 4, scope: "THIS" as const };
    const unknown = await updateOccurrences({ context, ...base, patch: { itemIds: ["nope"] } });
    expect(errorCode({ result: unknown })).toBe("VALIDATION");
    const outsider = await testOrg();
    const foreign = await updateOccurrences({
      ...{ context: outsider, ...base },
      patch: { estimatedHeadcount: 3 },
    });
    expect(errorCode({ result: foreign })).toBe("NOT_FOUND");
  });
});

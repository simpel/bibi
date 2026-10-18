import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { seedBooking } from "./seed-booking";

describe("cross-organization isolation: booking series occurrences", () => {
  it("refuses another organization's series when changing occurrences", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const seeded = await seedBooking({ client: a });
    const series = await call({
      client: a,
      name: "bookingSeries_create",
      args: {
        entityTypeId: seeded.entityTypeId,
        customerId: seeded.customerId,
        rule: "FREQ=WEEKLY;BYDAY=TU;COUNT=3",
        startsAt: "2026-11-03T08:00:00.000Z",
        durationMinutes: 240,
      },
    });
    expect(series.isError, JSON.stringify(series.data)).toBe(false);
    const seriesId = series.data.id as string;
    for (const scope of ["THIS", "FOLLOWING"]) {
      const changed = await call({
        client: b,
        name: "bookingSeries_updateOccurrences",
        args: { seriesId, fromIndex: 1, scope, patch: { estimatedHeadcount: 99 } },
      });
      expect(changed.data.code, scope).toBe("NOT_FOUND");
    }
    const own = await call({
      client: a,
      name: "bookingSeries_updateOccurrences",
      args: { seriesId, fromIndex: 2, scope: "THIS", patch: { estimatedHeadcount: 7 } },
    });
    expect(own.isError, JSON.stringify(own.data)).toBe(false);
    expect((await call({ client: b, name: "booking_list" })).data.items).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { seedBooking } from "./seed-booking";

describe("cross-organization isolation: booking series and program items", () => {
  it("hides one organization's booking series from another", async () => {
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
    const get = await call({ client: b, name: "bookingSeries_get", args: { id: series.data.id } });
    expect(get.data.code).toBe("NOT_FOUND");
    expect((await call({ client: b, name: "bookingSeries_list" })).data.items).toEqual([]);
    const cancel = await call({
      client: b,
      name: "bookingSeries_cancel",
      args: { id: series.data.id, reason: "Hacked" },
    });
    expect(cancel.data.code).toBe("NOT_FOUND");
    const graph = await call({
      client: b,
      name: "graphql_query",
      args: { query: "query { bookingSeriesList { items { id } } bookings { items { id } } }" },
    });
    expect(graph.data.data.bookingSeriesList.items).toEqual([]);
    expect(graph.data.data.bookings.items).toEqual([]);
    const own = await call({ client: a, name: "bookingSeries_get", args: { id: series.data.id } });
    expect(own.data.cancelledAt ?? null).toBeNull();
  });

  it("hides one organization's program items from another", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const seeded = await seedBooking({ client: a });
    const type = await call({
      client: a,
      name: "entityType_create",
      args: { base: "PROGRAM_ITEM", name: "Secret session" },
    });
    const program = await call({
      client: a,
      name: "programItem_create",
      args: {
        bookingId: seeded.id,
        entityTypeId: type.data.id,
        name: "Secret session",
        startsAt: "2026-11-03T09:00:00.000Z",
        endsAt: "2026-11-03T11:00:00.000Z",
      },
    });
    expect(program.isError, JSON.stringify(program.data)).toBe(false);
    const id = program.data.id;
    for (const [name, args] of [
      ["programItem_get", { id }],
      ["programItem_update", { id, name: "Hacked" }],
      ["programItem_archive", { id }],
    ] as const) {
      expect((await call({ client: b, name, args })).data.code, name).toBe("NOT_FOUND");
    }
    const listed = await call({ client: b, name: "programItem_list" });
    expect(listed.data.items).toEqual([]);
    const byBooking = await call({
      client: b,
      name: "programItem_list",
      args: { bookingId: seeded.id },
    });
    expect(byBooking.data.items).toEqual([]);
    const graph = await call({
      client: b,
      name: "graphql_query",
      args: { query: "query { programItems { items { id } } }" },
    });
    expect(graph.data.data.programItems.items).toEqual([]);
    const own = await call({ client: a, name: "programItem_get", args: { id } });
    expect(own.data.name).toBe("Secret session");
  });
});

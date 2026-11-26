import { describe, expect, it } from "vitest";
import {
  cancelReservation,
  completeReservation,
  createOccupancy,
  createReservation,
  createSystemContext,
  createTableBlock,
  eraseReservationBookers,
  execute,
  getReservation,
  listReservations,
  markReservationNoShow,
  reservationAvailability,
  seatReservation,
  updateReservation,
} from "../src/index";
import { aheadDate, at, diningRoomReady } from "./dining-helpers";
import { errorCode, testContext, unwrap } from "./helpers";

const booker = { bookerName: "Anna Lind", bookerPhone: "070-1234567" };

describe("table reservations (ADR 0119)", () => {
  it("offers the sitting's times and books the smallest free table", async () => {
    const context = testContext();
    const { item, table } = await diningRoomReady({ context });
    const { date, iso } = aheadDate({});
    const free = unwrap({
      result: await execute({
        operation: reservationAvailability,
        input: { roomItemId: item.id, date: iso, partySize: 2, online: true },
        context,
      }),
    });
    expect(free.slots).toHaveLength(9);
    expect(free.slots[0]).toMatchObject({ available: true, tableIds: [table({ label: "1" })] });

    const startsAt = at({ date, hour: 19 });
    const book = ({ partySize }: { partySize: number }) =>
      execute({
        operation: createReservation,
        input: { roomItemId: item.id, startsAt, partySize, ...booker },
        context,
      });
    const first = unwrap({ result: await book({ partySize: 2 }) });
    expect(first).toMatchObject({ state: "BOOKED", tables: [{ label: "1" }], warnings: [] });
    expect(first.endsAt.getTime() - startsAt.getTime()).toBe(120 * 60_000);
    expect(unwrap({ result: await book({ partySize: 2 }) }).tables).toEqual([
      { elementId: table({ label: "2" }), label: "2" },
    ]);
    expect(unwrap({ result: await book({ partySize: 4 }) }).tables[0]?.label).toBe("3");
    // Table 4 is staff-only but staff may use it.
    expect(unwrap({ result: await book({ partySize: 6 }) }).tables[0]?.label).toBe("4");
    expect(errorCode({ result: await book({ partySize: 2 }) })).toBe("CONFLICT");

    const listed = unwrap({
      result: await execute({
        operation: listReservations,
        input: { roomItemId: item.id, from: at({ date, hour: 0 }), to: at({ date, hour: 23 }) },
        context,
      }),
    });
    expect(listed.totals).toMatchObject({ reservations: 4, covers: 14 });
  });

  it("never gives one table to two parties, even at the same moment", async () => {
    const context = testContext();
    const { item, table } = await diningRoomReady({ context });
    const startsAt = at({ date: aheadDate({}).date, hour: 18 });
    const input = {
      roomItemId: item.id,
      startsAt,
      partySize: 2,
      tableIds: [table({ label: "1" })],
      ...booker,
    };
    const results = await Promise.all(
      [1, 2].map(() => execute({ operation: createReservation, input, context })),
    );
    expect(results.map((result) => errorCode({ result })).sort()).toEqual(["CONFLICT", null]);
  });

  it("warns outside a sitting and over the pace, and moves a booking", async () => {
    const context = testContext();
    const { item } = await diningRoomReady({ context });
    const { date } = aheadDate({});
    const late = unwrap({
      result: await execute({
        operation: createReservation,
        input: {
          roomItemId: item.id,
          startsAt: at({ date, hour: 22, minute: 15 }),
          partySize: 2,
          ...booker,
        },
        context,
      }),
    });
    expect(late.warnings).toEqual(["OUTSIDE_SITTING"]);
    const big = unwrap({
      result: await execute({
        operation: createReservation,
        input: { roomItemId: item.id, startsAt: at({ date, hour: 17 }), partySize: 6, ...booker },
        context,
      }),
    });
    const crowded = unwrap({
      result: await execute({
        operation: createReservation,
        input: { roomItemId: item.id, startsAt: at({ date, hour: 17 }), partySize: 5, ...booker },
        context,
      }),
    });
    expect(crowded.warnings).toEqual(["OVER_PACE"]);
    expect(crowded.tables.map((t) => t.label).sort()).toEqual(["1", "3"]);
    const moved = unwrap({
      result: await execute({
        operation: updateReservation,
        input: { id: big.id, startsAt: at({ date, hour: 20 }) },
        context,
      }),
    });
    expect(moved.tables.map((t) => t.label)).toEqual(big.tables.map((t) => t.label));
  });

  it("moves through its lifecycle and frees the table when cancelled or a no-show", async () => {
    const context = testContext();
    const { item, table } = await diningRoomReady({ context });
    const startsAt = at({ date: aheadDate({}).date, hour: 18 });
    const input = {
      roomItemId: item.id,
      startsAt,
      partySize: 2,
      tableIds: [table({ label: "1" })],
      ...booker,
    };
    const book = () => execute({ operation: createReservation, input, context });
    const move = ({ operation, id }: { operation: typeof seatReservation; id: string }) =>
      execute({ operation, input: { id }, context });

    const one = unwrap({ result: await book() });
    expect(unwrap({ result: await move({ operation: seatReservation, id: one.id }) }).state).toBe(
      "SEATED",
    );
    expect(
      unwrap({ result: await move({ operation: completeReservation, id: one.id }) }).state,
    ).toBe("COMPLETED");
    expect(errorCode({ result: await move({ operation: seatReservation, id: one.id }) })).toBe(
      "CONFLICT",
    );
    // Completed keeps the table held until its end.
    expect(errorCode({ result: await book() })).toBe("CONFLICT");

    const other = { ...input, startsAt: at({ date: aheadDate({ days: 4 }).date, hour: 18 }) };
    const two = unwrap({
      result: await execute({ operation: createReservation, input: other, context }),
    });
    unwrap({
      result: await execute({ operation: cancelReservation, input: { id: two.id }, context }),
    });
    const three = unwrap({
      result: await execute({ operation: createReservation, input: other, context }),
    });
    unwrap({ result: await move({ operation: markReservationNoShow, id: three.id }) });
    unwrap({ result: await execute({ operation: createReservation, input: other, context }) });
  });

  it("honours blocks: online-only tables stay with staff, blocked ones with nobody", async () => {
    const context = testContext();
    const { item, table } = await diningRoomReady({ context });
    const { date, iso } = aheadDate({});
    const evening = { startsAt: at({ date, hour: 17 }), endsAt: at({ date, hour: 23 }) };
    unwrap({
      result: await execute({
        operation: createTableBlock,
        input: {
          elementIds: [table({ label: "1" }), table({ label: "2" })],
          kind: "ONLINE_ONLY",
          ...evening,
        },
        context,
      }),
    });
    unwrap({
      result: await execute({
        operation: createTableBlock,
        input: { elementIds: [table({ label: "3" })], kind: "BLOCK", ...evening },
        context,
      }),
    });
    const online = unwrap({
      result: await execute({
        operation: reservationAvailability,
        input: { roomItemId: item.id, date: iso, partySize: 2, online: true },
        context,
      }),
    });
    expect(online.slots.every((slot) => !slot.available)).toBe(true);
    const staff = unwrap({
      result: await execute({
        operation: createReservation,
        input: { roomItemId: item.id, startsAt: at({ date, hour: 19 }), partySize: 2, ...booker },
        context,
      }),
    });
    expect(staff.tables[0]?.label).toBe("1");
    const blocked = await execute({
      operation: createReservation,
      input: {
        roomItemId: item.id,
        startsAt: at({ date, hour: 19 }),
        partySize: 4,
        tableIds: [table({ label: "3" })],
        ...booker,
      },
      context,
    });
    expect(errorCode({ result: blocked })).toBe("CONFLICT");
  });

  it("keeps whole-room bookings and table reservations apart", async () => {
    const context = testContext();
    const { item } = await diningRoomReady({ context });
    const { date, iso } = aheadDate({});
    unwrap({
      result: await execute({
        operation: createReservation,
        input: { roomItemId: item.id, startsAt: at({ date, hour: 18 }), partySize: 2, ...booker },
        context,
      }),
    });
    const overReservations = await execute({
      operation: createOccupancy,
      input: {
        itemId: item.id,
        type: "INTERNAL",
        startsAt: at({ date, hour: 17 }),
        endsAt: at({ date, hour: 23 }),
      },
      context,
    });
    expect(errorCode({ result: overReservations })).toBe("CONFLICT");

    const later = aheadDate({ days: 5 });
    unwrap({
      result: await execute({
        operation: createOccupancy,
        input: {
          itemId: item.id,
          type: "INTERNAL",
          startsAt: at({ date: later.date, hour: 17 }),
          endsAt: at({ date: later.date, hour: 23 }),
        },
        context,
      }),
    });
    const hidden = unwrap({
      result: await execute({
        operation: reservationAvailability,
        input: { roomItemId: item.id, date: later.iso, partySize: 2 },
        context,
      }),
    });
    expect(hidden.slots.every((slot) => !slot.available)).toBe(true);
    const refused = await execute({
      operation: createReservation,
      input: {
        roomItemId: item.id,
        startsAt: at({ date: later.date, hour: 18 }),
        partySize: 2,
        ...booker,
      },
      context,
    });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    expect(iso).toBeTruthy();
  });

  it("erases the booker 90 days after the visit and keeps the numbers", async () => {
    const context = testContext();
    const { item } = await diningRoomReady({ context });
    const old = aheadDate({ days: -100 });
    const recent = aheadDate({ days: -10 });
    const book = async ({ date }: { date: typeof old.date }) =>
      unwrap({
        result: await execute({
          operation: createReservation,
          input: {
            roomItemId: item.id,
            startsAt: at({ date, hour: 18 }),
            partySize: 3,
            note: "Birthday",
            ...booker,
          },
          context,
        }),
      });
    const gone = await book({ date: old.date });
    const kept = await book({ date: recent.date });
    const system = createSystemContext({ organizationId: context.organizationId });
    const run = unwrap({
      result: await execute({ operation: eraseReservationBookers, input: {}, context: system }),
    });
    expect(run.erased).toBe(1);
    const read = async ({ id }: { id: string }) =>
      unwrap({ result: await execute({ operation: getReservation, input: { id }, context }) });
    expect(await read({ id: gone.id })).toMatchObject({
      bookerName: null,
      bookerPhone: null,
      note: null,
      partySize: 3,
    });
    expect((await read({ id: kept.id })).bookerName).toBe("Anna Lind");
    const forbidden = await execute({ operation: eraseReservationBookers, input: {}, context });
    expect(errorCode({ result: forbidden })).toBe("FORBIDDEN");
  });
});

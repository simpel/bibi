import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { must, STARTS, seedReservation } from "./reservation-seed";

const RANGE = { from: "2037-11-01T00:00:00.000Z", to: "2037-11-30T00:00:00.000Z" };

describe("cross-organization isolation: table reservations (ADR 0119)", () => {
  it("refuses another organization's reservations, rooms, tables and blocks", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const { roomItemId, reservationId, elementIds } = await seedReservation({ client: a });
    const block = await must({
      client: a,
      name: "tableBlock_create",
      args: {
        elementIds: [elementIds[1]],
        startsAt: "2037-11-04T17:00:00.000Z",
        endsAt: "2037-11-04T22:00:00.000Z",
      },
    });
    const blockId = block.items[0].id as string;
    const id = reservationId;

    for (const [name, args] of [
      ["reservation_get", { id }],
      ["reservation_update", { id, partySize: 3 }],
      ["reservation_cancel", { id }],
      ["reservation_seat", { id }],
      ["reservation_unseat", { id }],
      ["reservation_complete", { id }],
      ["reservation_markNoShow", { id }],
      ["reservation_availability", { roomItemId, date: "2037-11-03", partySize: 2 }],
      [
        "reservation_create",
        { roomItemId, startsAt: STARTS, partySize: 2, bookerName: "Intruder" },
      ],
      [
        "tableBlock_create",
        { elementIds, startsAt: "2037-11-06T17:00:00.000Z", endsAt: "2037-11-06T22:00:00.000Z" },
      ],
      ["tableBlock_delete", { id: blockId }],
    ] as const) {
      const result = await call({ client: b, name, args });
      expect(["NOT_FOUND", "VALIDATION"], `${name}: ${JSON.stringify(result.data)}`).toContain(
        result.data.code,
      );
    }

    const reservations = await call({ client: b, name: "reservation_list", args: RANGE });
    expect(reservations.data.items).toEqual([]);
    expect(reservations.data.totals.reservations).toBe(0);
    const view = await call({
      client: b,
      name: "reservation_dayView",
      args: { roomItemId, date: "2037-11-03" },
    });
    expect(view.data.reservations.items).toEqual([]);
    expect(view.data.blocks).toEqual([]);
    expect(view.data.rooms.map((room: { itemId: string }) => room.itemId)).not.toContain(
      roomItemId,
    );
    const blocks = await call({ client: b, name: "tableBlock_list", args: RANGE });
    expect(blocks.data.items).toEqual([]);

    const own = await call({ client: a, name: "reservation_get", args: { id } });
    expect(own.data.state, "A's reservation is unchanged").toBe("BOOKED");
    expect(own.data.partySize).toBe(2);
    const ownBlocks = await call({ client: a, name: "tableBlock_list", args: RANGE });
    expect(ownBlocks.data.items).toHaveLength(1);
  });
});

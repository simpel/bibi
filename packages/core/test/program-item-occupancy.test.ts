import { describe, expect, it } from "vitest";
import { archiveProgramItem, execute, updateProgramItem } from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { hours } from "./occupancy-helpers";
import { activeOccupancies, addProgramItem, programSetup } from "./program-item-helpers";

describe("program item occupancy (ADR 0022)", () => {
  it("occupies the item with BOOKING plus SETUP changeover time", async () => {
    const { context, booking, type, room, setup } = await programSetup();
    const base = { context, bookingId: booking.id, entityTypeId: type.id, itemId: room.id };
    const item = unwrap({
      result: await addProgramItem({ ...base, from: 10, to: 12, setupId: setup.id }),
    });
    const rows = await activeOccupancies({ context, sourceId: item.id });
    expect(rows.map(({ type: kind, startsAt, endsAt }) => ({ kind, startsAt, endsAt }))).toEqual([
      { kind: "SETUP", ...hours({ from: 9, to: 10 }) },
      { kind: "BOOKING", ...hours({ from: 10, to: 12 }) },
    ]);
  });

  it("refuses an overlap with CONFLICT, including the changeover time", async () => {
    const { context, booking, type, room, setup } = await programSetup();
    const base = { context, bookingId: booking.id, entityTypeId: type.id, itemId: room.id };
    unwrap({ result: await addProgramItem({ ...base, from: 10, to: 12 }) });
    expect(errorCode({ result: await addProgramItem({ ...base, from: 11, to: 13 }) })).toBe(
      "CONFLICT",
    );
    // Back to back is fine, but the setup's hour of changeover would overlap.
    expect(errorCode({ result: await addProgramItem({ ...base, from: 12, to: 14 }) })).toBeNull();
    const clash = await addProgramItem({ ...base, from: 14, to: 15, setupId: setup.id });
    expect(errorCode({ result: clash })).toBe("CONFLICT");
    const count = await context.db.programItem.count({ where: { bookingId: booking.id } });
    expect(count).toBe(2);
  });

  it("moves the occupancy on update and releases it on archive", async () => {
    const { context, booking, type, room, setup } = await programSetup();
    const base = { context, bookingId: booking.id, entityTypeId: type.id, itemId: room.id };
    const item = unwrap({
      result: await addProgramItem({ ...base, from: 10, to: 12, setupId: setup.id }),
    });
    const moved = { id: item.id, ...hours({ from: 14, to: 16 }) };
    unwrap({ result: await execute({ operation: updateProgramItem, input: moved, context }) });
    const rows = await activeOccupancies({ context, sourceId: item.id });
    expect(rows.map((row) => row.startsAt)).toEqual([
      hours({ from: 13, to: 14 }).startsAt,
      hours({ from: 14, to: 16 }).startsAt,
    ]);
    // The old period is free again.
    unwrap({ result: await addProgramItem({ ...base, from: 10, to: 12 }) });
    const off = { id: item.id, itemId: null };
    const updated = unwrap({
      result: await execute({ operation: updateProgramItem, input: off, context }),
    });
    expect(updated).toMatchObject({ itemId: null, setupId: null });
    expect(await activeOccupancies({ context, sourceId: item.id })).toEqual([]);
    const input = { id: item.id };
    unwrap({ result: await execute({ operation: archiveProgramItem, input, context }) });
  });

  it("releases the item when the program item is archived", async () => {
    const { context, booking, type, room } = await programSetup();
    const base = { context, bookingId: booking.id, entityTypeId: type.id, itemId: room.id };
    const item = unwrap({ result: await addProgramItem({ ...base, from: 10, to: 12 }) });
    const input = { id: item.id };
    unwrap({ result: await execute({ operation: archiveProgramItem, input, context }) });
    expect(await activeOccupancies({ context, sourceId: item.id })).toEqual([]);
    expect(errorCode({ result: await addProgramItem({ ...base, from: 10, to: 12 }) })).toBeNull();
  });
});

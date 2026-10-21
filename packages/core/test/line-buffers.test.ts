import { describe, expect, it } from "vitest";
import {
  createEntityType,
  type ExecuteContext,
  execute,
  getItem,
  getLine,
  updateEntityType,
  updateItem,
  updateLine,
} from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { activeOccupancies, createTestLine, programSetup } from "./line-helpers";

const rowsOf = async ({ context, lineId }: { context: ExecuteContext; lineId: string }) =>
  (await activeOccupancies({ context, lineId })).map(
    (row) =>
      `${row.type}:${row.holdKind} ${row.startsAt.toISOString().slice(11, 16)}-` +
      row.endsAt.toISOString().slice(11, 16),
  );

describe("setup and teardown buffers (ADR 0059)", () => {
  it("inherits line → item → type and takes the larger of setup and changeover", async () => {
    const { context, ticket, type, room, setup } = await programSetup();
    const typeInput = { id: room.entityTypeId, setupMinutes: 30, teardownMinutes: 20 };
    unwrap({ result: await execute({ operation: updateEntityType, input: typeInput, context }) });
    const item = unwrap({
      result: await execute({ operation: getItem, input: { id: room.id }, context }),
    });
    expect(item).toMatchObject({
      ...{ setupMinutes: null, effectiveSetupMinutes: 30, setupMinutesSource: "TYPE" },
      ...{ teardownMinutes: null, effectiveTeardownMinutes: 20, teardownMinutesSource: "TYPE" },
    });
    const itemInput = { id: room.id, teardownMinutes: 15 };
    unwrap({ result: await execute({ operation: updateItem, input: itemInput, context }) });
    const line = unwrap({
      result: await createTestLine({
        ...{ context, ticketId: ticket.id, entityTypeId: type.id, from: 10, to: 12 },
        ...{ itemId: room.id, setupId: setup.id },
      }),
    });
    // The setup's changeover (60) is larger than the type's 30: it wins, the two never add up.
    expect(line).toMatchObject({
      ...{ effectiveSetupMinutes: 60, setupMinutesSource: "SETUP" },
      ...{ effectiveTeardownMinutes: 15, teardownMinutesSource: "ITEM" },
    });
    expect(await rowsOf({ context, lineId: line.id })).toEqual([
      "SETUP:HARD 09:00-10:00",
      "HOLD:HARD 10:00-12:00",
      "TEARDOWN:HARD 12:00-12:15",
    ]);
    const own = { id: line.id, setupMinutes: 90, teardownMinutes: 0 };
    const updated = unwrap({
      result: await execute({ operation: updateLine, input: own, context }),
    });
    expect(updated).toMatchObject({
      ...{ effectiveSetupMinutes: 90, setupMinutesSource: "LINE" },
      ...{ effectiveTeardownMinutes: 0, teardownMinutesSource: "LINE" },
    });
    expect(await rowsOf({ context, lineId: line.id })).toEqual([
      "SETUP:HARD 08:30-10:00",
      "HOLD:HARD 10:00-12:00",
    ]);
    const read = unwrap({
      result: await execute({ operation: getLine, input: { id: line.id }, context }),
    });
    expect(read.effectiveSetupMinutes).toBe(90);
  });

  it("re-derives holds when an item's or a type's minutes change", async () => {
    const { context, ticket, type, room } = await programSetup();
    const input = { context, ticketId: ticket.id, entityTypeId: type.id, itemId: room.id };
    const line = unwrap({ result: await createTestLine({ ...input, from: 10, to: 12 }) });
    expect(await rowsOf({ context, lineId: line.id })).toEqual(["HOLD:HARD 10:00-12:00"]);
    const typeInput = { id: room.entityTypeId, teardownMinutes: 30 };
    unwrap({ result: await execute({ operation: updateEntityType, input: typeInput, context }) });
    expect(await rowsOf({ context, lineId: line.id })).toEqual([
      "HOLD:HARD 10:00-12:00",
      "TEARDOWN:HARD 12:00-12:30",
    ]);
    const itemInput = { id: room.id, setupMinutes: 45, teardownMinutes: 0 };
    unwrap({ result: await execute({ operation: updateItem, input: itemInput, context }) });
    expect(await rowsOf({ context, lineId: line.id })).toEqual([
      "SETUP:HARD 09:15-10:00",
      "HOLD:HARD 10:00-12:00",
    ]);
  });

  it("refuses minutes on a type that is not an item type", async () => {
    const { context } = await programSetup();
    const input = { base: "CUSTOMER" as const, name: "Company", setupMinutes: 10 };
    const result = await execute({ operation: createEntityType, input, context });
    expect(errorCode({ result })).toBe("VALIDATION");
  });
});

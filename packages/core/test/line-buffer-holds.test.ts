import { describe, expect, it } from "vitest";
import {
  type ExecuteContext,
  execute,
  updateEntityType,
  updateItem,
  updateItemState,
} from "../src/index";
import { lineHoldsReconciliation } from "../src/seed/demo/line-holds-reconcile";
import { runReconciliations } from "../src/seed/demo/reconcile";
import { errorCode, unwrap } from "./helpers";
import { roomStates, toState } from "./item-state-helpers";
import { activeOccupancies, createTestLine, programSetup } from "./line-helpers";

const rowsOf = async ({ context, lineId }: { context: ExecuteContext; lineId: string }) =>
  (await activeOccupancies({ context, lineId })).map(
    (row) => `${row.type}:${row.holdKind} ${row.startsAt.toISOString().slice(11, 16)}`,
  );

const reconcile = ({ context }: { context: ExecuteContext }) =>
  runReconciliations({ context, checks: [lineHoldsReconciliation] });

describe("buffers block like the hold they belong to (ADR 0059)", () => {
  it("a hard teardown blocks the next hard booking; soft buffers block nothing", async () => {
    const { context, ticket, type, room } = await programSetup();
    const itemInput = { id: room.id, teardownMinutes: 30 };
    unwrap({ result: await execute({ operation: updateItem, input: itemInput, context }) });
    const input = { context, ticketId: ticket.id, entityTypeId: type.id, itemId: room.id };
    const first = unwrap({ result: await createTestLine({ ...input, from: 10, to: 12 }) });
    const clash = await createTestLine({ ...input, from: 12, to: 13 });
    expect(errorCode({ result: clash })).toBe("CONFLICT");
    const soft = { id: first.stateId ?? "", hold: "SOFT" as const };
    unwrap({ result: await execute({ operation: updateItemState, input: soft, context }) });
    const second = unwrap({ result: await createTestLine({ ...input, from: 12, to: 13 }) });
    expect(await rowsOf({ context, lineId: first.id })).toEqual([
      "HOLD:SOFT 10:00",
      "TEARDOWN:SOFT 12:00",
    ]);
    expect(await rowsOf({ context, lineId: second.id })).toEqual([
      "HOLD:SOFT 12:00",
      "TEARDOWN:SOFT 13:00",
    ]);
    // Back to hard, the first line's teardown collides with the second line's hold.
    const hard = { id: soft.id, hold: "HARD" as const };
    const refused = await execute({ operation: updateItemState, input: hard, context });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    expect(await reconcile({ context })).toEqual([]);
  });

  it("refuses a type's longer buffer that would make hard holds collide", async () => {
    const { context, ticket, type, room } = await programSetup();
    const input = { context, ticketId: ticket.id, entityTypeId: type.id, itemId: room.id };
    const first = unwrap({ result: await createTestLine({ ...input, from: 10, to: 12 }) });
    const second = unwrap({ result: await createTestLine({ ...input, from: 13, to: 14 }) });
    const longer = { id: room.entityTypeId, setupMinutes: 90 };
    const refused = await execute({ operation: updateEntityType, input: longer, context });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    expect(refused.ok ? [] : refused.error.issues.map((issue) => issue.path)).toEqual([
      `lines.${second.id}`,
    ]);
    const kept = await context.db.entityType.findFirstOrThrow({ where: { id: room.entityTypeId } });
    expect(kept.setupMinutes).toBeNull();
    expect(await rowsOf({ context, lineId: first.id })).toEqual(["HOLD:HARD 10:00"]);
    const fits = { id: room.entityTypeId, setupMinutes: 60 };
    unwrap({ result: await execute({ operation: updateEntityType, input: fits, context }) });
    expect(await rowsOf({ context, lineId: second.id })).toEqual([
      "SETUP:HARD 12:00",
      "HOLD:HARD 13:00",
    ]);
    expect(await reconcile({ context })).toEqual([]);
  });

  it("names the hard hold a line's teardown would collide with before moving it", async () => {
    const { context, ticket, type, room } = await programSetup();
    const { booked } = await roomStates({ context, entityTypeId: room.entityTypeId });
    const typeInput = { id: room.entityTypeId, teardownMinutes: 30 };
    unwrap({ result: await execute({ operation: updateEntityType, input: typeInput, context }) });
    const input = { context, ticketId: ticket.id, entityTypeId: type.id, itemId: room.id };
    const first = unwrap({ result: await createTestLine({ ...input, from: 10, to: 12 }) });
    const second = unwrap({ result: await createTestLine({ ...input, from: 12, to: 13 }) });
    // A soft teardown blocks nothing, so the second line can be booked hard.
    unwrap({ result: await toState({ context, lineId: second.id, stateId: booked.id }) });
    const refused = await toState({ context, lineId: first.id, stateId: booked.id });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    const issues = refused.ok ? [] : refused.error.issues;
    expect(issues.map((issue) => issue.path)).toEqual([`lines.${first.id}`]);
    expect(issues[0]?.message).toContain("booked by ticket");
    expect(await rowsOf({ context, lineId: first.id })).toEqual([
      "HOLD:SOFT 10:00",
      "TEARDOWN:SOFT 12:00",
    ]);
    expect(await reconcile({ context })).toEqual([]);
  });
});

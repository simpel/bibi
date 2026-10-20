import { getDb } from "@okazi/db";
import { describe, expect, it } from "vitest";
import { fromUnknown } from "../src/errors/from-unknown";
import { execute, updateLine } from "../src/index";
import { unwrap } from "./helpers";
import { roomStates, toState } from "./item-state-helpers";
import { activeOccupancies, createTestLine, programSetup } from "./line-helpers";

async function setup() {
  const { context, ticket, type, room } = await programSetup();
  const states = await roomStates({ context, entityTypeId: room.entityTypeId });
  const base = { context, ticketId: ticket.id, entityTypeId: type.id, itemId: room.id };
  return { context, ticket, type, room, states, base };
}

const historyOf = ({ lineId }: { lineId: string }) =>
  getDb().lineStateChange.findMany({ where: { lineId }, orderBy: { seq: "asc" } });

describe("line state history (ADR 0054)", () => {
  it("records every state change; the newest row is the state and held since", async () => {
    const { context, states, base } = await setup();
    const line = unwrap({ result: await createTestLine({ ...base, from: 9, to: 12 }) });
    const booked = unwrap({
      result: await toState({ context, lineId: line.id, stateId: states.booked.id }),
    });
    const rows = await historyOf({ lineId: line.id });
    expect(rows.map((row) => [row.fromStateId, row.toStateId, row.trigger])).toEqual([
      [null, states.prebooked.id, "SYSTEM"],
      [states.prebooked.id, states.booked.id, "MANUAL"],
    ]);
    expect(rows[1]?.changedBy).toBe(context.actor.userId);
    expect(booked.heldAt).toEqual(rows[1]?.changedAt);
    // The trigger set the state, and the holds trigger followed in the same transaction.
    const holds = await activeOccupancies({ context, lineId: line.id });
    expect(holds.map((row) => `${row.type}:${row.holdKind}`)).toEqual(["HOLD:HARD"]);
  });

  it("leaves the state history when a line loses its item", async () => {
    const { context, base } = await setup();
    const line = unwrap({ result: await createTestLine({ ...base, from: 9, to: 12 }) });
    const input = { id: line.id, itemId: null };
    const moved = unwrap({ result: await execute({ operation: updateLine, input, context }) });
    expect(moved.stateId).toBeNull();
    const rows = await historyOf({ lineId: line.id });
    expect(rows.at(-1)).toMatchObject({ toStateId: null, trigger: "SYSTEM" });
    expect(await activeOccupancies({ context, lineId: line.id })).toEqual([]);
  });

  it("refuses a direct write of the state and a change from a stale state", async () => {
    const { context, states, base } = await setup();
    const line = unwrap({ result: await createTestLine({ ...base, from: 9, to: 12 }) });
    const direct = getDb().line.update({
      where: { id: line.id },
      data: { stateId: states.booked.id },
    });
    await expect(direct).rejects.toThrow(/history_projection_only/);
    const stale = getDb().lineStateChange.create({
      data: {
        ...{ organizationId: context.organizationId, lineId: line.id, trigger: "MANUAL" },
        ...{ fromStateId: states.booked.id, toStateId: states.released.id },
      },
    });
    const error = await stale.then(() => null).catch((caught: unknown) => caught);
    expect(fromUnknown({ error }).code).toBe("CONFLICT");
    const after = await getDb().line.findUniqueOrThrow({ where: { id: line.id } });
    expect(after.stateId).toBe(states.prebooked.id);
  });
});

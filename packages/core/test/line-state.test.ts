import { describe, expect, it } from "vitest";
import { createEntityType, execute, listProgramItems, updateItemState } from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { createTestItem } from "./item-helpers";
import { addState, roomStates, toState } from "./item-state-helpers";
import { activeOccupancies, addProgramItem, programSetup } from "./program-item-helpers";

/** A ticket with a room of the bookable template (ADR 0044) and a base for its lines. */
async function setup() {
  const { context, ticket, type, room } = await programSetup();
  const states = await roomStates({ context, entityTypeId: room.entityTypeId });
  const base = { context, ticketId: ticket.id, entityTypeId: type.id, itemId: room.id };
  return { context, ticket, type, room, states, base };
}

const holdsOf = async ({ ...input }: Parameters<typeof activeOccupancies>[0]) =>
  (await activeOccupancies(input)).map((row) => `${row.type}:${row.holdKind}`);

describe("line states and derived holds (ADR 0044)", () => {
  it("lets soft holds overlap, oldest first, and lets only one line hold hard", async () => {
    const { context, room, states, base } = await setup();
    const first = unwrap({ result: await addProgramItem({ ...base, from: 9, to: 12 }) });
    const second = unwrap({ result: await addProgramItem({ ...base, from: 9, to: 12 }) });
    expect([first.stateId, second.stateId]).toEqual([states.prebooked.id, states.prebooked.id]);
    expect(await holdsOf({ context, sourceId: second.id })).toEqual(["HOLD:SOFT"]);
    const input = { itemId: room.id, limit: 50 };
    const listed = unwrap({
      result: await execute({ operation: listProgramItems, input, context }),
    });
    expect(listed.items.map((line) => line.id)).toEqual([first.id, second.id]);
    const booked = unwrap({
      result: await toState({ context, lineId: first.id, stateId: states.booked.id }),
    });
    expect(booked).toMatchObject({ stateId: states.booked.id, stateOverridden: true });
    expect(booked.heldAt.getTime()).toBeGreaterThanOrEqual(first.heldAt.getTime());
    expect(await holdsOf({ context, sourceId: first.id })).toEqual(["HOLD:HARD"]);
    const clash = await toState({ context, lineId: second.id, stateId: states.booked.id });
    expect(errorCode({ result: clash })).toBe("CONFLICT");
  });

  it("follows the type's transitions and never leaves a released state", async () => {
    const { context, states, base } = await setup();
    const line = unwrap({ result: await addProgramItem({ ...base, from: 9, to: 10 }) });
    const released = unwrap({
      result: await toState({ context, lineId: line.id, stateId: states.released.id }),
    });
    expect(await holdsOf({ context, sourceId: released.id })).toEqual([]);
    const back = await toState({ context, lineId: line.id, stateId: states.prebooked.id });
    expect(errorCode({ result: back })).toBe("CONFLICT");
  });

  it("refuses a state of another type and a line without an item", async () => {
    const { context, base } = await setup();
    const input = { base: "ITEM" as const, name: "Dish" };
    const dish = unwrap({ result: await execute({ operation: createEntityType, input, context }) });
    const other = unwrap({
      result: await addState({ context, entityTypeId: dish.id, name: "Ordered" }),
    });
    const line = unwrap({ result: await addProgramItem({ ...base, from: 9, to: 10 }) });
    const wrong = await toState({ context, lineId: line.id, stateId: other.id });
    expect(errorCode({ result: wrong })).toBe("VALIDATION");
    const { itemId: _item, ...free } = base;
    const bare = unwrap({ result: await addProgramItem({ ...free, from: 9, to: 10 }) });
    expect(bare.stateId).toBeNull();
    const none = await toState({ context, lineId: bare.id, stateId: other.id });
    expect(errorCode({ result: none })).toBe("VALIDATION");
  });

  it("moves a food line through its states without holding anything", async () => {
    const { context, base } = await setup();
    const input = { base: "ITEM" as const, name: "Dish" };
    const dish = unwrap({ result: await execute({ operation: createEntityType, input, context }) });
    const add = async ({ name, initial = false }: { name: string; initial?: boolean }) =>
      unwrap({ result: await addState({ context, entityTypeId: dish.id, name, initial }) });
    const estimated = await add({ name: "Estimated", initial: true });
    const ordered = await add({ name: "Ordered" });
    const locked = await add({ name: "Locked" });
    const food = await createTestItem({ context, entityTypeId: dish.id, name: "Fish stew" });
    const line = unwrap({
      result: await addProgramItem({ ...base, itemId: food.id, from: 12, to: 13 }),
    });
    expect(line.stateId).toBe(estimated.id);
    for (const state of [ordered, locked]) {
      const moved = unwrap({
        result: await toState({ context, lineId: line.id, stateId: state.id }),
      });
      expect(moved.stateId).toBe(state.id);
    }
    expect(await activeOccupancies({ context, sourceId: line.id })).toEqual([]);
  });

  it("derives the holds again when a state's hold changes, all or nothing", async () => {
    const { context, states, base } = await setup();
    const first = unwrap({ result: await addProgramItem({ ...base, from: 9, to: 12 }) });
    unwrap({ result: await addProgramItem({ ...base, from: 10, to: 11 }) });
    const hard = { id: states.prebooked.id, hold: "HARD" as const };
    const clash = await execute({ operation: updateItemState, input: hard, context });
    expect(errorCode({ result: clash })).toBe("CONFLICT");
    expect(await holdsOf({ context, sourceId: first.id })).toEqual(["HOLD:SOFT"]);
  });
});

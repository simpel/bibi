import { describe, expect, it } from "vitest";
import {
  archiveItemState,
  createEntityType,
  execute,
  listItemStates,
  reorderItemStates,
  setItemStateTransitions,
  updateItemState,
} from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { createRoomType } from "./item-helpers";
import { addState, roomStates } from "./item-state-helpers";

type Failure =
  | { ok: true }
  | { ok: false; error: { code: string; issues: readonly { path: string }[] } };

const issueOf = ({ result }: { result: Failure }) =>
  result.ok ? null : { code: result.error.code, path: result.error.issues[0]?.path };

async function statesOf({
  context,
  entityTypeId,
}: {
  context: ReturnType<typeof testContext>;
  entityTypeId: string;
}) {
  const input = { entityTypeId, limit: 50 };
  return unwrap({ result: await execute({ operation: listItemStates, input, context }) }).items;
}

describe("itemState (ADR 0044)", () => {
  it("gives a new item type one initial state that holds bookable items hard", async () => {
    const context = testContext();
    const room = await createRoomType({ context });
    const input = { base: "ITEM" as const, name: "Dish" };
    const dish = unwrap({ result: await execute({ operation: createEntityType, input, context }) });
    const [roomState] = await statesOf({ context, entityTypeId: room.id });
    const [dishState] = await statesOf({ context, entityTypeId: dish.id });
    expect(roomState).toMatchObject({ name: "Active", initial: true, hold: "HARD" });
    expect(dishState).toMatchObject({ name: "Active", initial: true, hold: "NONE" });
  });

  it("hands over the initial flag and links every forward move and the move to released", async () => {
    const context = testContext();
    const room = await createRoomType({ context });
    const { prebooked, booked, released } = await roomStates({ context, entityTypeId: room.id });
    const states = await statesOf({ context, entityTypeId: room.id });
    expect(states.filter((state) => state.initial).map((state) => state.id)).toEqual([
      prebooked.id,
    ]);
    const byId = new Map(states.map((state) => [state.id, state.transitionsTo]));
    expect(byId.get(prebooked.id)).toEqual([booked.id, released.id]);
    expect(byId.get(booked.id)).toEqual([released.id]);
    expect(byId.get(released.id)).toEqual([]);
  });

  it("refuses flags that contradict each other or the type", async () => {
    const context = testContext();
    const room = await createRoomType({ context });
    const input = { base: "ITEM" as const, name: "Dish" };
    const dish = unwrap({ result: await execute({ operation: createEntityType, input, context }) });
    const cases = [
      [{ entityTypeId: dish.id, name: "Held", hold: "SOFT" }, "hold"],
      [{ entityTypeId: room.id, name: "Gone", released: true, hold: "HARD" }, "hold"],
      [{ entityTypeId: room.id, name: "Gone", released: true, expires: true }, "expires"],
      [{ entityTypeId: room.id, name: "Gone", released: true, initial: true }, "initial"],
      [{ entityTypeId: dish.id + "x", name: "Lost" }, "entityTypeId"],
    ] as const;
    for (const [args, path] of cases) {
      const result = await addState({ context, ...args });
      expect(issueOf({ result }), path).toEqual({ code: "VALIDATION", path });
    }
    const taken = await addState({ context, entityTypeId: room.id, name: "Active" });
    expect(errorCode({ result: taken })).toBe("CONFLICT");
  });

  it("keeps one initial state and makes a released state a dead end", async () => {
    const context = testContext();
    const room = await createRoomType({ context });
    const { prebooked, booked, released } = await roomStates({ context, entityTypeId: room.id });
    const unset = { id: prebooked.id, initial: false };
    const refused = await execute({ operation: updateItemState, input: unset, context });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    const final = { id: booked.id, released: true, hold: "NONE" as const };
    const after = unwrap({
      result: await execute({ operation: updateItemState, input: final, context }),
    });
    expect(after.transitionsTo).toEqual([]);
    const exits = { id: released.id, toStateIds: [booked.id] };
    const blocked = await execute({ operation: setItemStateTransitions, input: exits, context });
    expect(issueOf({ result: blocked })).toEqual({ code: "VALIDATION", path: "toStateIds" });
  });

  it("allows transitions only within one type and reorders a type's states", async () => {
    const context = testContext();
    const room = await createRoomType({ context });
    const input = { base: "ITEM" as const, name: "Dish" };
    const dish = unwrap({ result: await execute({ operation: createEntityType, input, context }) });
    const { prebooked, booked } = await roomStates({ context, entityTypeId: room.id });
    const [dishState] = await statesOf({ context, entityTypeId: dish.id });
    const foreign = { id: prebooked.id, toStateIds: [dishState?.id ?? ""] };
    const refused = await execute({ operation: setItemStateTransitions, input: foreign, context });
    expect(issueOf({ result: refused })).toEqual({ code: "VALIDATION", path: "toStateIds" });
    const ids = (await statesOf({ context, entityTypeId: room.id })).map((state) => state.id);
    const reversed = { entityTypeId: room.id, ids: [...ids].reverse() };
    unwrap({ result: await execute({ operation: reorderItemStates, input: reversed, context }) });
    const order = (await statesOf({ context, entityTypeId: room.id })).map((state) => state.id);
    expect(order).toEqual([...ids].reverse());
    const partial = { entityTypeId: room.id, ids: [booked.id] };
    const incomplete = await execute({ operation: reorderItemStates, input: partial, context });
    expect(issueOf({ result: incomplete })).toEqual({ code: "VALIDATION", path: "ids" });
  });

  it("archives a state only with a target for its lines and never the initial one", async () => {
    const context = testContext();
    const room = await createRoomType({ context });
    const { prebooked, released } = await roomStates({ context, entityTypeId: room.id });
    const initial = await execute({
      operation: archiveItemState,
      input: { id: prebooked.id },
      context,
    });
    expect(errorCode({ result: initial })).toBe("CONFLICT");
    const [active] = await statesOf({ context, entityTypeId: room.id });
    const input = { id: released.id, targetStateId: active?.id };
    const archived = unwrap({
      result: await execute({ operation: archiveItemState, input, context }),
    });
    expect(archived.status).toBe("ARCHIVED");
    const type = await context.db.entityType.findFirst({ where: { id: room.id } });
    expect(type?.expiryStateId).toBe(active?.id);
    const left = await statesOf({ context, entityTypeId: room.id });
    expect(left.flatMap((state) => state.transitionsTo)).not.toContain(released.id);
  });
});

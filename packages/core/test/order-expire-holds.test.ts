import { describe, expect, it } from "vitest";
import { execute, expireOrderHolds, getLine, getOrder, updateOrder } from "../src/index";
import { unwrap } from "./helpers";
import { roomStates, toState } from "./item-state-helpers";
import { activeOccupancies, createTestLine, programSetup } from "./line-helpers";
import { createTestOrder } from "./order-helpers";

const PAST = new Date(Date.now() - 60_000);

describe("order.expireHolds (ADR 0044)", () => {
  it("drops the expiring lines of orders whose holdsUntil has passed, and nothing else", async () => {
    const { context, order, type, room } = await programSetup();
    const states = await roomStates({ context, entityTypeId: room.entityTypeId });
    const base = { context, entityTypeId: type.id, itemId: room.id };
    const soft = unwrap({
      result: await createTestLine({ ...base, orderId: order.id, from: 9, to: 10 }),
    });
    const hard = unwrap({
      result: await createTestLine({ ...base, orderId: order.id, from: 11, to: 12 }),
    });
    unwrap({ result: await toState({ context, lineId: hard.id, stateId: states.booked.id }) });
    const open = await createTestOrder({
      context,
      entityTypeId: order.entityTypeId,
      customerId: order.customerId,
    });
    const waiting = unwrap({
      result: await createTestLine({ ...base, orderId: open.id, from: 9, to: 10 }),
    });
    const update = { id: order.id, holdsUntil: PAST };
    unwrap({ result: await execute({ operation: updateOrder, input: update, context }) });

    const result = unwrap({
      result: await execute({ operation: expireOrderHolds, input: {}, context }),
    });
    expect(result.items.map((line) => line.id)).toEqual([soft.id]);
    const stateOf = async ({ id }: { id: string }) =>
      unwrap({ result: await execute({ operation: getLine, input: { id }, context }) }).stateId;
    expect(await stateOf(soft)).toBe(states.released.id);
    expect(await stateOf(hard)).toBe(states.booked.id);
    expect(await stateOf(waiting)).toBe(states.prebooked.id);
    expect(await activeOccupancies({ context, lineId: soft.id })).toEqual([]);
    // The expiry is recorded in the line's state history (ADR 0054).
    const last = await context.db.lineStateChange.findFirst({
      where: { lineId: soft.id },
      orderBy: { seq: "desc" },
    });
    expect(last).toMatchObject({ toStateId: states.released.id, trigger: "EXPIRY" });
    const after = unwrap({
      result: await execute({ operation: getOrder, input: { id: order.id }, context }),
    });
    expect(after.statusId).toBe(order.statusId);
    const again = unwrap({
      result: await execute({ operation: expireOrderHolds, input: {}, context }),
    });
    expect(again.items).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import { execute, updateItem, updateLine, updateOrder } from "../src/index";
import { unwrap } from "./helpers";
import { createTestLine, programSetup } from "./line-helpers";

type Failure = { ok: boolean; error?: { code: string; issues: readonly { path: string }[] } };

const issueOf = ({ result }: { result: Failure }) =>
  result.ok ? null : { code: result.error?.code, path: result.error?.issues[0]?.path };

/** A room with a people limit of 150 (its layout seats 120); an order of 10 estimated guests. */
async function limitedRoom() {
  const setup = await programSetup();
  const { context, room, order } = setup;
  const limit = { id: room.id, maxPeople: 150 };
  unwrap({ result: await execute({ operation: updateItem, input: limit, context }) });
  const headcount = { id: order.id, estimatedHeadcount: 10 };
  unwrap({ result: await execute({ operation: updateOrder, input: headcount, context }) });
  const base = { context, orderId: order.id, entityTypeId: setup.type.id, itemId: room.id };
  return { ...setup, base };
}

describe("the room's people limit is hard (ADR 0103 decision 4)", () => {
  it("refuses a line with more people than the limit, on create and update", async () => {
    const { context, base } = await limitedRoom();
    const over = await createTestLine({ ...base, from: 9, to: 10, quantity: 151 });
    expect(issueOf({ result: over })).toEqual({ code: "VALIDATION", path: "quantity" });
    expect(over.ok ? "" : over.error.message).toContain("limit of 150");
    const line = unwrap({
      result: await createTestLine({ ...base, from: 9, to: 10, quantity: 150 }),
    });
    const raised = await execute({
      operation: updateLine,
      input: { id: line.id, quantity: 160 },
      context,
    });
    expect(issueOf({ result: raised })).toEqual({ code: "VALIDATION", path: "quantity" });
  });

  it("counts the order's headcount for a line without a quantity", async () => {
    const { context, order, base } = await limitedRoom();
    const line = unwrap({ result: await createTestLine({ ...base, from: 9, to: 10 }) });
    expect(line.effectiveQuantity).toBe(10);
    const estimated = { id: order.id, estimatedHeadcount: 160 };
    const refused = await execute({ operation: updateOrder, input: estimated, context });
    expect(issueOf({ result: refused })).toEqual({
      code: "VALIDATION",
      path: "estimatedHeadcount",
    });
    const guaranteed = { id: order.id, estimatedHeadcount: 160, guaranteedHeadcount: 151 };
    const alsoRefused = await execute({ operation: updateOrder, input: guaranteed, context });
    expect(issueOf({ result: alsoRefused })).toEqual({
      code: "VALIDATION",
      path: "guaranteedHeadcount",
    });
    // A line with its own quantity no longer counts the headcount.
    const own = { id: line.id, quantity: 15 };
    unwrap({ result: await execute({ operation: updateLine, input: own, context }) });
    unwrap({ result: await execute({ operation: updateOrder, input: estimated, context }) });
  });

  it("allows any number on a room without a limit", async () => {
    const { context, room, base } = await limitedRoom();
    const none = { id: room.id, maxPeople: null };
    unwrap({ result: await execute({ operation: updateItem, input: none, context }) });
    const line = await createTestLine({ ...base, from: 9, to: 10, quantity: 900 });
    expect(line.ok).toBe(true);
  });
});

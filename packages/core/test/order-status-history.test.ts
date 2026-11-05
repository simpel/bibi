import { getDb } from "@bibi/db";
import { describe, expect, it } from "vitest";
import {
  acceptQuote,
  execute,
  sendQuote,
  setOrderStatusGates,
  orderStatusHistory,
} from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { draftQuote } from "./quote-helpers";
import { moveToStatus } from "./order-helpers";
import { statusByName } from "./order-status-helpers";

type Ctx = Awaited<ReturnType<typeof draftQuote>>["context"];

const historyOf = async ({ context, orderId }: { context: Ctx; orderId: string }) =>
  unwrap({
    result: await execute({ operation: orderStatusHistory, input: { orderId }, context }),
  });

/** An order in Lead with a draft quote, and the move Lead → Confirmed gated on an accepted quote. */
async function guarded() {
  const setup = await draftQuote();
  const { context } = setup;
  const [lead, confirmed] = await Promise.all(
    ["Lead", "Confirmed"].map((name) => statusByName({ context, name })),
  );
  if (!lead || !confirmed) throw new Error("Missing statuses");
  const gates = [
    { fromStatusId: null, gates: ["ASSIGNEE" as const] },
    { fromStatusId: lead.id, gates: ["ACCEPTED_QUOTE" as const] },
  ];
  const input = { id: confirmed.id, gates };
  unwrap({ result: await execute({ operation: setOrderStatusGates, input, context }) });
  return { ...setup, confirmed };
}

const accept = async ({ context, id }: { context: Ctx; id: string }) => {
  unwrap({ result: await execute({ operation: sendQuote, input: { id }, context }) });
  unwrap({ result: await execute({ operation: acceptQuote, input: { id }, context }) });
};

describe("order status history (ADR 0054)", () => {
  it("starts with the create, appends each move and is the order's status", async () => {
    const { context, order } = await draftQuote();
    const lost = unwrap({
      result: await moveToStatus({ context, orderId: order.id, name: "Lost", reason: "Price" }),
    });
    const { items, warnings } = await historyOf({ context, orderId: order.id });
    expect(items.map((row) => [row.fromStatusId, row.toStatusId, row.trigger, row.reason])).toEqual(
      [
        [null, order.statusId, "MANUAL", null],
        [order.statusId, lost.statusId, "MANUAL", "Price"],
      ],
    );
    expect(items[1]?.changedBy).toBe(context.actor.userId);
    expect(lost).toMatchObject({ statusReason: "Price", statusChangedAt: items[1]?.changedAt });
    expect(warnings).toEqual([]);
  });

  it("refuses a direct write of the status", async () => {
    const { context, order } = await draftQuote();
    const lost = await statusByName({ context, name: "Lost" });
    const direct = getDb().order.update({ where: { id: order.id }, data: { statusId: lost.id } });
    await expect(direct).rejects.toThrow(/history_projection_only/);
  });

  it("guards the accepted-quote fact on entry", async () => {
    const { context, order, quote, confirmed } = await guarded();
    const refused = await moveToStatus({ context, orderId: order.id, name: "Confirmed" });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    expect(refused.ok ? [] : refused.error.issues.map((issue) => issue.path)).toEqual(["quote"]);
    await accept({ context, id: quote.id });
    const moved = unwrap({
      result: await moveToStatus({ context, orderId: order.id, name: "Confirmed" }),
    });
    expect(moved.statusId).toBe(confirmed.id);
  });

  it("warns when an accepted quote meets an earlier status, only to quote readers", async () => {
    const { context, order, quote } = await guarded();
    await accept({ context, id: quote.id });
    const { warnings } = await historyOf({ context, orderId: order.id });
    expect(warnings).toEqual(["QUOTE_ACCEPTED_IN_EARLIER_STATUS"]);
    const ordersOnly = testContext({
      organizationId: context.organizationId,
      permissions: { order: ["read"] },
    });
    const hidden = await historyOf({ context: ordersOnly, orderId: order.id });
    expect(hidden.warnings).toEqual([]);
    expect(hidden.items).toHaveLength(1);
    unwrap({ result: await moveToStatus({ context, orderId: order.id, name: "Confirmed" }) });
    expect((await historyOf({ context, orderId: order.id })).warnings).toEqual([]);
  });
});

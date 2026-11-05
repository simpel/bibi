import { describe, expect, it } from "vitest";
import {
  acceptQuote,
  changeOrderStatus,
  createOrderStatus,
  type ExecuteContext,
  execute,
  getOrder,
  getQuote,
  grantAll,
  sendQuote,
  setOrderStatusTransitions,
  updateOrderStatus,
} from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { statusByName } from "./order-status-helpers";
import { addTestLines, createTestQuote, quoteSetup } from "./quote-helpers";

type Ctx = { context: ExecuteContext };

/** "Quote sent" (QUOTE_SENT) after Lead, and Confirmed as the QUOTE_ACCEPTED status. */
async function configure({ context }: Ctx) {
  const input = { name: "Quote sent", color: "#7c3aed" };
  const made = unwrap({ result: await execute({ operation: createOrderStatus, input, context }) });
  const event = { id: made.id, event: "QUOTE_SENT" as const };
  const sent = unwrap({
    result: await execute({ operation: updateOrderStatus, input: event, context }),
  });
  const confirmed = await statusByName({ context, name: "Confirmed" });
  const update = { id: confirmed.id, event: "QUOTE_ACCEPTED" as const };
  unwrap({ result: await execute({ operation: updateOrderStatus, input: update, context }) });
  // Movement is free and the template already gates Confirmed on a main assignee (ADR 0076).
  const lead = await statusByName({ context, name: "Lead" });
  return { sent, confirmed, lead };
}

async function sendable() {
  const setup = await quoteSetup();
  const { context, order, lineType } = setup;
  const lines = [{ itemId: setup.lunch.id }];
  await addTestLines({ context, orderId: order.id, lineTypeId: lineType.id, lines });
  const quote = await createTestQuote({ context, orderId: order.id });
  return { ...setup, quote };
}

const statusOf = async ({ context, id }: Ctx & { id: string }) =>
  unwrap({ result: await execute({ operation: getOrder, input: { id }, context }) }).statusId;

describe("quote events move the order (ADR 0043)", () => {
  it("moves the order on send and on accept, and stores who accepted", async () => {
    const { context, order, quote } = await sendable();
    const { sent, confirmed } = await configure({ context });
    const input = { id: quote.id };
    unwrap({ result: await execute({ operation: sendQuote, input, context }) });
    expect(await statusOf({ context, id: order.id })).toBe(sent.id);
    const accepted = unwrap({ result: await execute({ operation: acceptQuote, input, context }) });
    expect(await statusOf({ context, id: order.id })).toBe(confirmed.id);
    expect(accepted).toMatchObject({ quoteStatus: "ACCEPTED", acceptanceMethod: "MANUAL" });
    expect(accepted.acceptedBy).toBe(context.actor.userId);
    expect(accepted.acceptedAt).toBeInstanceOf(Date);
  });

  it("leaves the status when the organization has no status for the event", async () => {
    const { context, order, quote } = await sendable();
    const input = { id: quote.id };
    unwrap({ result: await execute({ operation: sendQuote, input, context }) });
    const accepted = unwrap({ result: await execute({ operation: acceptQuote, input, context }) });
    expect(await statusOf({ context, id: order.id })).toBe(order.statusId);
    expect(accepted.quoteStatus).toBe("ACCEPTED");
    const again = await execute({ operation: acceptQuote, input, context });
    expect(errorCode({ result: again })).toBe("CONFLICT");
  });

  it("leaves the status when the organization does not allow the move", async () => {
    const { context, order, quote } = await sendable();
    const { sent, lead } = await configure({ context });
    const none = { id: lead.id, allowedNext: "ONLY_THESE" as const, toStatusIds: [] };
    unwrap({
      result: await execute({ operation: setOrderStatusTransitions, input: none, context }),
    });
    const input = { id: quote.id };
    unwrap({ result: await execute({ operation: sendQuote, input, context }) });
    expect(await statusOf({ context, id: order.id })).toBe(lead.id);
    expect(sent.id).not.toBe(lead.id);
  });

  it("fails the accept without any change when the move is blocked", async () => {
    const { context, order, quote } = await sendable();
    await configure({ context });
    const input = { id: quote.id };
    unwrap({ result: await execute({ operation: sendQuote, input, context }) });
    const nobody = await context.db.assignment.deleteMany({ where: { recordId: order.id } });
    expect(nobody.count).toBeGreaterThan(0);
    const result = await execute({ operation: acceptQuote, input, context });
    expect(errorCode({ result })).toBe("CONFLICT");
    const kept = unwrap({ result: await execute({ operation: getQuote, input, context }) });
    expect(kept).toMatchObject({ quoteStatus: "SENT", acceptedAt: null, acceptanceMethod: null });
  });

  it("needs order:write when a status would move", async () => {
    const { context, quote, order } = await sendable();
    const { sent } = await configure({ context });
    const limited = { ...grantAll({}), order: ["read" as const] };
    const caller = { ...context, permissions: limited };
    const input = { id: quote.id };
    const result = await execute({ operation: sendQuote, input, context: caller });
    expect(errorCode({ result })).toBe("FORBIDDEN");
    expect(await statusOf({ context, id: order.id })).not.toBe(sent.id);
  });

  it("does not let a status with an event be entered by hand", async () => {
    const { context, order } = await sendable();
    const { sent } = await configure({ context });
    const input = { orderId: order.id, statusId: sent.id };
    const result = await execute({ operation: changeOrderStatus, input, context });
    expect(errorCode({ result })).toBe("CONFLICT");
  });

  it("gives an event to one status only", async () => {
    const { context } = await sendable();
    const { sent, confirmed } = await configure({ context });
    const input = { id: confirmed.id, event: "QUOTE_SENT" as const };
    const moved = unwrap({
      result: await execute({ operation: updateOrderStatus, input, context }),
    });
    expect(moved.event).toBe("QUOTE_SENT");
    expect((await statusByName({ context, name: sent.name })).event).toBeNull();
  });
});

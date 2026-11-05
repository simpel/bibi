import { describe, expect, it } from "vitest";
import {
  acceptQuote,
  archiveLine,
  type ExecuteContext,
  execute,
  getQuote,
  sendQuote,
  updateLine,
  updateOrder,
} from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { createTestOrder } from "./order-helpers";
import { addTestLines, createTestQuote, quoteSetup } from "./quote-helpers";

async function sentQuote() {
  const setup = await quoteSetup();
  const { context, order, lineType, lunch, coffee } = setup;
  const lines = [{ itemId: lunch.id }, { itemId: coffee.id, name: "Coffee", quantity: 20 }];
  const created = await addTestLines({
    ...{ context, orderId: order.id, lineTypeId: lineType.id, lines },
  });
  const draft = await createTestQuote({ context, orderId: order.id });
  const input = { id: draft.id };
  const sent = unwrap({ result: await execute({ operation: sendQuote, input, context }) });
  return { ...setup, sent, lunchLine: created[0], coffeeLine: created[1] };
}

const read = async ({ context, id }: { context: ExecuteContext; id: string }) =>
  unwrap({ result: await execute({ operation: getQuote, input: { id }, context }) });

describe("a sent quote is a frozen snapshot of the lines (ADR 0052)", () => {
  it("writes one order line per priced line with its lineId and freezes the totals", async () => {
    const { context, sent, lunchLine, coffeeLine } = await sentQuote();
    const rows = await context.db.orderLine.findMany({
      where: { quoteId: sent.id },
      orderBy: { position: "asc" },
    });
    expect(rows.map((row) => row.lineId)).toEqual([lunchLine?.id, coffeeLine?.id]);
    const stored = await context.db.quote.findFirst({ where: { id: sent.id } });
    expect(stored).toMatchObject({ totalExclVatMinor: 580_000, totalInclVatMinor: 649_600 });
    expect(sent).toMatchObject({ quoteStatus: "SENT", differsFromOrder: null });
  });

  it("is unchanged by a later line edit, which the accepted quote shows", async () => {
    const { context, order, sent, lineType, lunch, lunchLine, coffeeLine } = await sentQuote();
    const edit = { id: lunchLine?.id ?? "", quantity: 25 };
    unwrap({ result: await execute({ operation: updateLine, input: edit, context }) });
    const after = await read({ context, id: sent.id });
    expect(after.lines).toEqual(sent.lines);
    expect(after.totalExclVatMinor).toBe(sent.totalExclVatMinor);
    const input = { id: sent.id };
    const accepted = unwrap({ result: await execute({ operation: acceptQuote, input, context }) });
    expect(accepted.lines.map((line) => line.quantity)).toEqual([20, 20]);
    expect(accepted.differsFromOrder).toBe(true);
    expect(
      accepted.orderChanges.map((line) => [line.lineId, line.change, line.changedFields]),
    ).toEqual([[lunchLine?.id, "CHANGED", ["quantity"]]]);
    const extra = [{ itemId: lunch.id, name: "Dinner" }];
    await addTestLines({ context, orderId: order.id, lineTypeId: lineType.id, lines: extra });
    const archive = { id: coffeeLine?.id ?? "" };
    unwrap({ result: await execute({ operation: archiveLine, input: archive, context }) });
    const drifted = await read({ context, id: sent.id });
    expect(drifted.orderChanges.map((line) => [line.name, line.change])).toEqual([
      ["Lunch", "CHANGED"],
      ["Dinner", "ADDED"],
    ]);
    expect(drifted.orderRemovedLines.map((line) => line.lineId)).toEqual([coffeeLine?.id]);
    expect(drifted.lines).toEqual(accepted.lines);
  });

  it("matches the order until it changes, also through the headcount", async () => {
    const { context, order, sent } = await sentQuote();
    const input = { id: sent.id };
    const accepted = unwrap({ result: await execute({ operation: acceptQuote, input, context }) });
    expect(accepted).toMatchObject({ differsFromOrder: false, orderChanges: [] });
    const headcount = { id: order.id, estimatedHeadcount: 30 };
    unwrap({ result: await execute({ operation: updateOrder, input: headcount, context }) });
    const drifted = await read({ context, id: sent.id });
    expect(drifted.differsFromOrder).toBe(true);
    expect(drifted.orderChanges.map((line) => line.quantity)).toEqual([30]);
  });

  it("refuses to send a priced line without a quantity", async () => {
    const { context, type, customer, lineType, lunch } = await quoteSetup();
    const order = await createTestOrder({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
    });
    const lines = [{ itemId: lunch.id }];
    await addTestLines({ context, orderId: order.id, lineTypeId: lineType.id, lines });
    const draft = await createTestQuote({ context, orderId: order.id });
    expect(draft.lines[0]?.quantity).toBe(0);
    const sent = await execute({ operation: sendQuote, input: { id: draft.id }, context });
    expect(errorCode({ result: sent })).toBe("VALIDATION");
    if (!sent.ok) expect(sent.error.issues?.[0]?.path).toBe("lines.0.quantity");
    expect(await context.db.orderLine.count({ where: { quoteId: draft.id } })).toBe(0);
  });
});

import { describe, expect, it } from "vitest";
import {
  acceptQuote,
  type ExecuteContext,
  execute,
  orderEstimateHistory,
  pipelineBoard,
  sendQuote,
  updateOrder,
} from "../src/index";
import { testContext, unwrap } from "./helpers";
import { addTestLines, createTestQuote, quoteSetup } from "./quote-helpers";

const board = async ({ context }: { context: ExecuteContext }) =>
  unwrap({ result: await execute({ operation: pipelineBoard, input: {}, context }) });

/** An order with lunch for 20 at 250 kr, coffee for 10 at 40 kr and an unpriced dish. */
async function pricedOrder() {
  const setup = await quoteSetup();
  const { context, order, lineType, lunch, coffee, unpriced } = setup;
  const lines = [
    { itemId: lunch.id },
    { itemId: coffee.id, quantity: 10 },
    { itemId: unpriced.id },
  ];
  await addTestLines({ context, orderId: order.id, lineTypeId: lineType.id, lines });
  return setup;
}

describe("pipeline.board card values (ADR 0074)", () => {
  it("estimates an order without its own estimate at its priced lines, none without program", async () => {
    const { context } = await pricedOrder();
    const { cards, currency } = await board({ context });
    expect(cards[0]).toMatchObject({ estimatedValueMinor: 540_000, confirmedValueMinor: null });
    expect(currency).toBe("SEK");
    const reader = testContext({
      organizationId: context.organizationId,
      permissions: { order: ["read"] },
    });
    expect((await board({ context: reader })).cards[0]?.estimatedValueMinor).toBeNull();
  });

  it("prefers the order's own estimate and keeps each change in its history", async () => {
    const { context, order } = await pricedOrder();
    for (const estimatedValueMinor of [800_000, 800_000, 650_000]) {
      const input = { id: order.id, estimatedValueMinor };
      unwrap({ result: await execute({ operation: updateOrder, input, context }) });
    }
    expect((await board({ context })).cards[0]?.estimatedValueMinor).toBe(650_000);
    const input = { orderId: order.id };
    const history = unwrap({
      result: await execute({ operation: orderEstimateHistory, input, context }),
    });
    expect(history.items.map((item) => item.valueMinor)).toEqual([800_000, 650_000]);
  });

  it("confirms the accepted quote's total, hidden without quote:read", async () => {
    const { context, order } = await pricedOrder();
    const quote = await createTestQuote({ context, orderId: order.id });
    unwrap({ result: await execute({ operation: sendQuote, input: { id: quote.id }, context }) });
    unwrap({ result: await execute({ operation: acceptQuote, input: { id: quote.id }, context }) });
    expect((await board({ context })).cards[0]?.confirmedValueMinor).toBe(540_000);
    const reader = testContext({
      organizationId: context.organizationId,
      permissions: { order: ["read"], program: ["read"] },
    });
    expect((await board({ context: reader })).cards[0]?.confirmedValueMinor).toBeNull();
  });
});

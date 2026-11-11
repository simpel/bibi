import { describe, expect, it } from "vitest";
import {
  acceptQuote,
  type ExecuteContext,
  execute,
  getCustomer,
  listCustomers,
  sendQuote,
} from "../src/index";
import { testContext, unwrap } from "./helpers";
import { addTestLines, createTestQuote, quoteSetup } from "./quote-helpers";

/** An order with lunch for 20 at 250 kr and coffee for 10 at 40 kr. */
async function pricedOrder() {
  const setup = await quoteSetup();
  const { context, order, lineType, lunch, coffee } = setup;
  const lines = [{ itemId: lunch.id }, { itemId: coffee.id, quantity: 10 }];
  await addTestLines({ context, orderId: order.id, lineTypeId: lineType.id, lines });
  return setup;
}

const valueOf = async ({ context, id }: { context: ExecuteContext; id: string }) =>
  unwrap({ result: await execute({ operation: getCustomer, input: { id }, context }) }).valueMinor;

describe("customer value: billed so far", () => {
  it("counts nothing before a quote is accepted, then the accepted quote incl. VAT", async () => {
    const { context, order } = await pricedOrder();
    const id = order.customerId;
    expect(await valueOf({ context, id })).toBe(0);
    const quote = await createTestQuote({ context, orderId: order.id });
    unwrap({ result: await execute({ operation: sendQuote, input: { id: quote.id }, context }) });
    expect(await valueOf({ context, id })).toBe(0);
    unwrap({ result: await execute({ operation: acceptQuote, input: { id: quote.id }, context }) });
    expect(await valueOf({ context, id })).toBe(quote.totalInclVatMinor);
    const list = unwrap({
      result: await execute({ operation: listCustomers, input: { ids: [id] }, context }),
    });
    expect(list.items[0]?.valueMinor).toBe(quote.totalInclVatMinor);
  });

  it("is hidden without payment:read", async () => {
    const { context, order } = await pricedOrder();
    const reader = testContext({
      organizationId: context.organizationId,
      permissions: { customer: ["read"], order: ["read"] },
    });
    expect(await valueOf({ context: reader, id: order.customerId })).toBeNull();
  });
});

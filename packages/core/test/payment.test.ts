import { getDb } from "@bibi/db";
import { afterEach, describe, expect, it } from "vitest";
import {
  createPayment,
  type ExecuteContext,
  execute,
  getPayment,
  getPaymentSettings,
  listPayments,
  resetProviderAdapters,
  updateCustomer,
  updatePaymentSettings,
} from "../src/index";
import { errorCode, peer, testContext, unwrap } from "./helpers";
import { createTestOrder, orderSetup } from "./order-helpers";
import { paymentSetup, sentDeposit } from "./payment-helpers";

afterEach(() => {
  resetProviderAdapters();
});

type CreateInput = { context: ExecuteContext; depositId: string; method?: "CARD" | "INVOICE" };
const create = ({ context, depositId, method = "CARD" }: CreateInput) =>
  execute({
    operation: createPayment,
    input: { depositId, method, amountMinor: 125_000 },
    context,
  });

describe("payment", () => {
  it("creates a card checkout as a direct charge on the connected account", async () => {
    const { context, orderId, depositId, account, provider } = await paymentSetup();
    const payment = unwrap({ result: await create({ context, depositId }) });
    expect(payment).toMatchObject({
      orderId,
      depositId,
      quoteId: null,
      invoiceId: null,
      method: "CARD",
      status: "PENDING",
      amountMinor: 125_000,
      currency: "SEK",
      applicationFeeMinor: null,
    });
    expect(payment.paymentUrl).toContain(payment.providerReference);
    expect(payment.expiresAt).toBeInstanceOf(Date);
    expect(provider.charges).toHaveLength(1);
    expect(provider.charges[0]).toMatchObject({
      kind: "checkout",
      connectedAccountId: account.stripeAccountId,
      idempotencyKey: `bibi-payment-${payment.id}`,
      metadata: { paymentId: payment.id, orderId },
    });
    const { publicToken } = await getDb().payment.findUniqueOrThrow({ where: { id: payment.id } });
    expect(provider.charges[0]).toHaveProperty(
      "successUrl",
      expect.stringContaining(`/pay/${publicToken}?checkout=success`),
    );
    expect(provider.charges[0]).toHaveProperty(
      "cancelUrl",
      expect.stringMatching(new RegExp(`/pay/${publicToken}$`)),
    );
    expect(JSON.stringify(payment)).not.toContain(publicToken);
  });

  it("lists and gets payments of an order", async () => {
    const { context, orderId, depositId } = await paymentSetup();
    const first = unwrap({ result: await create({ context, depositId }) });
    const second = unwrap({ result: await create({ context, depositId }) });
    const page = unwrap({
      result: await execute({ operation: listPayments, input: { orderId }, context }),
    });
    expect(page.items.map(({ id }) => id).sort()).toEqual([first.id, second.id].sort());
    const read = unwrap({
      result: await execute({ operation: getPayment, input: { id: first.id }, context }),
    });
    expect(read).toEqual(first);
    expect(read).not.toHaveProperty("providerAccountId");
  });

  it("sends an invoice only to a customer with an email", async () => {
    const { context, depositId, customerId, provider } = await paymentSetup();
    const refused = await create({ context, depositId, method: "INVOICE" });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    const input = { id: customerId, email: "billing@example.com", paymentTermsDays: 15 };
    unwrap({ result: await execute({ operation: updateCustomer, input, context }) });
    const payment = unwrap({ result: await create({ context, depositId, method: "INVOICE" }) });
    expect(payment).toMatchObject({ method: "INVOICE", status: "PENDING", expiresAt: null });
    expect(provider.charges.at(-1)).toMatchObject({
      kind: "invoice",
      recipient: { email: "billing@example.com" },
      daysUntilDue: 15,
    });
  });

  it("refuses to charge before the payment account is active", async () => {
    const { context, type, customer } = await orderSetup();
    const order = await createTestOrder({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
    });
    const { id: depositId } = await sentDeposit({ context, orderId: order.id });
    const result = await create({ context, depositId });
    expect(errorCode({ result })).toBe("CONFLICT");
  });

  it("charges through the chosen payment operator and refuses one that is not connected", async () => {
    const { context, depositId } = await paymentSetup();
    unwrap({
      result: await execute({
        operation: updatePaymentSettings,
        input: { paymentOperator: "STRIPE" },
        context,
      }),
    });
    const settings = unwrap({
      result: await execute({ operation: getPaymentSettings, input: {}, context }),
    });
    expect(settings.paymentOperator).toBe("STRIPE");
    unwrap({ result: await create({ context, depositId }) });
    await context.db.providerConnection.updateMany({ data: { disconnectedAt: new Date() } });
    const refused = await create({ context, depositId });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
  });

  it("keeps payments per organization and needs payment:write to create", async () => {
    const { context, orderId, depositId } = await paymentSetup();
    const payment = unwrap({ result: await create({ context, depositId }) });
    const stranger = testContext();
    const read = await execute({
      operation: getPayment,
      input: { id: payment.id },
      context: stranger,
    });
    expect(errorCode({ result: read })).toBe("NOT_FOUND");
    const page = unwrap({
      result: await execute({ operation: listPayments, input: { orderId }, context: stranger }),
    });
    expect(page.items).toEqual([]);
    expect(errorCode({ result: await create({ context: stranger, depositId }) })).toBe("NOT_FOUND");
    const reader = peer({ of: context, access: "read" });
    expect(errorCode({ result: await create({ context: reader, depositId }) })).toBe("FORBIDDEN");
  });
});

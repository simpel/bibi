import { afterEach, describe, expect, it } from "vitest";
import { depositFromRule } from "../src/features/deposit/deposit-rule";
import {
  disconnectPaymentAccount,
  execute,
  getPaymentSettings,
  requestDeposit,
  resetProviderAdapters,
  startPaymentOnboarding,
  suggestDepositAmount,
  updatePaymentSettings,
} from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { connectLedger } from "./ledger-helpers";
import { moneySetup } from "./receivable-helpers";

afterEach(() => {
  resetProviderAdapters();
});

const rule = { depositPercent: 30, depositMinimumMinor: 1_000_000 };

describe("the deposit rule (ADR 0090)", () => {
  it("asks a percentage, the whole total below the minimum, or nothing without a rule", () => {
    expect(depositFromRule({ totalMinor: 2_000_000, settings: rule })).toEqual({
      basis: "PERCENT",
      amountMinor: 600_000,
    });
    expect(depositFromRule({ totalMinor: 560_000, settings: rule })).toEqual({
      basis: "FULL",
      amountMinor: 560_000,
    });
    const none = { depositPercent: null, depositMinimumMinor: null };
    expect(depositFromRule({ totalMinor: 560_000, settings: none })).toEqual({
      basis: "NONE",
      amountMinor: null,
    });
  });

  it("is an admin setting that starts empty and keeps omitted fields", async () => {
    const context = await testContext({ role: "admin" });
    const empty = unwrap({
      result: await execute({ operation: getPaymentSettings, input: {}, context }),
    });
    expect(empty).toEqual({
      id: null,
      depositPercent: null,
      depositMinimumMinor: null,
      routes: [
        { method: "CARD", provider: null },
        { method: "SWISH", provider: null },
        { method: "INVOICE", provider: null },
      ],
      choices: [
        { method: "CARD", providers: ["STRIPE"] },
        { method: "SWISH", providers: ["SWISH"] },
        { method: "INVOICE", providers: ["FORTNOX", "VISMA"] },
      ],
      invoiceProvider: null,
      paymentOperator: null,
    });
    await execute({ operation: updatePaymentSettings, input: rule, context });
    // A route can only name a service that is connected (the memory ledger stands in for Visma).
    await connectLedger({ context });
    const input = { invoiceProvider: "VISMA" as const };
    const saved = unwrap({
      result: await execute({ operation: updatePaymentSettings, input, context }),
    });
    expect(saved).toMatchObject({ ...rule, invoiceProvider: "VISMA" });
    const manager = await testContext({ role: "manager", organizationId: context.organizationId });
    const refused = await execute({ operation: updatePaymentSettings, input, context: manager });
    expect(errorCode({ result: refused })).toBe("FORBIDDEN");
  });

  it("suggests from the order's priced lines and requests a deposit with a /pay link", async () => {
    const { context, order, provider } = await moneySetup();
    const orderId = order.id;
    const ask = () => execute({ operation: suggestDepositAmount, input: { orderId }, context });
    expect(unwrap({ result: await ask() })).toEqual({
      totalInclVatMinor: 560_000,
      basis: "NONE",
      amountMinor: null,
      paymentLinksAvailable: true,
      ledgerConnected: true,
    });
    const description = "Advance";
    const refused = await execute({
      operation: requestDeposit,
      input: { orderId, description },
      context,
    });
    expect(errorCode({ result: refused })).toBe("VALIDATION");
    await execute({ operation: updatePaymentSettings, input: rule, context });
    expect(unwrap({ result: await ask() })).toMatchObject({ basis: "FULL", amountMinor: 560_000 });
    const payment = unwrap({
      result: await execute({
        operation: requestDeposit,
        input: { orderId, description },
        context,
      }),
    });
    expect(payment).toMatchObject({ method: "CARD", status: "PENDING", amountMinor: 560_000 });
    expect(payment.depositId).not.toBeNull();
    expect(payment.paymentUrl).toContain(payment.providerReference);
    expect(provider.charges).toHaveLength(1);
  });

  it("hides another organization's order", async () => {
    const { order } = await moneySetup();
    const other = await testContext({ role: "admin" });
    const result = await execute({
      operation: suggestDepositAmount,
      input: { orderId: order.id },
      context: other,
    });
    expect(errorCode({ result })).toBe("NOT_FOUND");
  });
});

describe("disconnecting Stripe (ADR 0090)", () => {
  it("stops payment links until the same account is connected again", async () => {
    const { context, order } = await moneySetup();
    const orderId = order.id;
    const account = unwrap({
      result: await execute({ operation: disconnectPaymentAccount, input: {}, context }),
    });
    expect(account.status).toBe("DISCONNECTED");
    const suggestion = unwrap({
      result: await execute({ operation: suggestDepositAmount, input: { orderId }, context }),
    });
    expect(suggestion.paymentLinksAvailable).toBe(false);
    const input = { orderId, description: "Advance", amountMinor: 10_000 };
    const refused = await execute({ operation: requestDeposit, input, context });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    const again = unwrap({
      result: await execute({ operation: startPaymentOnboarding, input: {}, context }),
    });
    expect(again).toMatchObject({ status: "ACTIVE", stripeAccountId: account.stripeAccountId });
  });
});

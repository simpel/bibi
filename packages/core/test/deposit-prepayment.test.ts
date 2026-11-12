import { afterEach, describe, expect, it } from "vitest";
import {
  createDeposit,
  createMemoryProvider,
  execute,
  type MemoryProvider,
  recordManualPayment,
  resetProviderAdapters,
  sendDeposit,
  setProviderAdapter,
  updateCustomer,
  updatePaymentSettings,
  voidDeposit,
} from "../src/index";
import { connectFortnox } from "./fortnox-invoicing-helpers";
import { errorCode, unwrap } from "./helpers";
import { useFortnoxEnv } from "./integration-helpers";
import { moneySetup } from "./receivable-helpers";

useFortnoxEnv();

afterEach(() => {
  resetProviderAdapters();
});

/** The order of `moneySetup` with Fortnox (a memory ledger) taking invoices. */
async function ledgerSetup() {
  const setup = await moneySetup();
  const { context } = setup;
  await connectFortnox({ context });
  const fake: MemoryProvider = createMemoryProvider({
    key: "FORTNOX",
    connectKind: "OAUTH",
    invoicing: true,
    ledger: true,
    registerPayment: true,
  });
  setProviderAdapter({ key: "FORTNOX", adapter: fake.adapter });
  const routes = [{ method: "INVOICE" as const, provider: "FORTNOX" as const }];
  unwrap({
    result: await execute({ operation: updatePaymentSettings, input: { routes }, context }),
  });
  const draft = unwrap({
    result: await execute({
      operation: createDeposit,
      input: { orderId: setup.order.id, description: "Advance", amountMinor: 150_000 },
      context,
    }),
  });
  return { ...setup, fake, draft };
}

describe("a deposit is a prepayment invoice in the ledger (ADR 0106)", () => {
  it("is raised on the advances account when sent and takes payments booked there", async () => {
    const { context, fake, draft } = await ledgerSetup();
    const sent = unwrap({
      result: await execute({ operation: sendDeposit, input: { id: draft.id }, context }),
    });
    expect(sent).toMatchObject({ provider: "FORTNOX", providerReference: "1" });
    // The order's 12 % (ADR 0093): 1 500 kr = 1 339.29 excl. VAT on the advances account.
    expect(fake.raised[0]).toMatchObject({
      reference: expect.stringMatching(/, deposit$/),
      deductions: [],
      lines: [
        {
          name: "Advance",
          quantity: 1,
          unitPriceMinor: 133_929,
          vatRatePercent: 12,
          revenueAccount: "2420",
        },
      ],
    });
    const input = { depositId: draft.id, amountMinor: 150_000, paidAt: new Date() };
    unwrap({ result: await execute({ operation: recordManualPayment, input, context }) });
    expect(fake.portCalls).toEqual(["register:1:150000"]);
  });

  it("is raised before its first payment is booked when sending it to the ledger failed", async () => {
    const { context, fake, draft } = await ledgerSetup();
    fake.failing.add("issue");
    const sent = await execute({ operation: sendDeposit, input: { id: draft.id }, context });
    expect(errorCode({ result: sent })).toBe("UNAVAILABLE");
    const row = await context.db.deposit.findFirstOrThrow({ where: { id: draft.id } });
    expect(row).toMatchObject({ status: "SENT", provider: "FORTNOX", providerReference: null });
    const input = { depositId: draft.id, amountMinor: 50_000, paidAt: new Date() };
    unwrap({ result: await execute({ operation: recordManualPayment, input, context }) });
    expect(fake.raised).toHaveLength(1);
    expect(fake.portCalls).toEqual(["register:1:50000"]);
  });

  it("needs the buyer's reference when the customer requires one", async () => {
    const { context, draft, order } = await ledgerSetup();
    const required = { id: order.customerId, requiresBuyerReference: true };
    unwrap({ result: await execute({ operation: updateCustomer, input: required, context }) });
    const sent = await execute({ operation: sendDeposit, input: { id: draft.id }, context });
    expect(errorCode({ result: sent })).toBe("VALIDATION");
  });

  it("is credited in full there when voided", async () => {
    const { context, fake, draft } = await ledgerSetup();
    unwrap({ result: await execute({ operation: sendDeposit, input: { id: draft.id }, context }) });
    const voided = unwrap({
      result: await execute({ operation: voidDeposit, input: { id: draft.id }, context }),
    });
    expect(voided.status).toBe("VOID");
    expect(fake.portCalls).toEqual(["credit:1:150000"]);
  });

  it("is SENT again when the ledger refuses the credit", async () => {
    const { context, fake, draft } = await ledgerSetup();
    unwrap({ result: await execute({ operation: sendDeposit, input: { id: draft.id }, context }) });
    fake.refusing.add("credit");
    const voided = await execute({ operation: voidDeposit, input: { id: draft.id }, context });
    expect(voided.ok).toBe(false);
    const row = await context.db.deposit.findFirstOrThrow({ where: { id: draft.id } });
    expect(row.status).toBe("SENT");
  });
});

import { afterEach, describe, expect, it } from "vitest";
import {
  createInvoice,
  createMemoryProvider,
  createPayment,
  type ExecuteContext,
  execute,
  listPayments,
  type MemoryProvider,
  recordManualPayment,
  resetProviderAdapters,
  sendInvoice,
  setProviderAdapter,
  syncInvoice,
  updateOrganizationProfile,
  updatePaymentSettings,
  voidInvoice,
} from "../src/index";
import { connectFortnox } from "./fortnox-invoicing-helpers";
import { errorCode, unwrap } from "./helpers";
import { useFortnoxEnv } from "./integration-helpers";
import { makeReaders, notificationsOf } from "./notification-helpers";
import { makeInvoiceable, moneySetup } from "./receivable-helpers";

useFortnoxEnv();

afterEach(() => {
  resetProviderAdapters();
});

/** A ledger provider in Fortnox's place; `registerPayment` books payments taken elsewhere. */
function ledger({ registerPayment }: { registerPayment: boolean }): MemoryProvider {
  const fake = createMemoryProvider({
    key: "FORTNOX",
    connectKind: "OAUTH",
    invoicing: true,
    ledger: true,
    registerPayment,
  });
  setProviderAdapter({ key: "FORTNOX", adapter: fake.adapter });
  return fake;
}

/** A SENT invoice of 5 600 kr raised and booked in the ledger provider. */
async function bookedInvoice({ registerPayment = false } = {}) {
  const setup = await moneySetup();
  const { context, order } = setup;
  const profile = { legalName: "Gården AB", orgNumber: "556000-0000" };
  unwrap({
    result: await execute({ operation: updateOrganizationProfile, input: profile, context }),
  });
  await connectFortnox({ context });
  const fake = ledger({ registerPayment });
  const routes = [{ method: "INVOICE" as const, provider: "FORTNOX" as const }];
  unwrap({
    result: await execute({ operation: updatePaymentSettings, input: { routes }, context }),
  });
  await makeInvoiceable({ context, statusId: order.statusId });
  const draft = unwrap({
    result: await execute({ operation: createInvoice, input: { orderId: order.id }, context }),
  });
  const invoice = unwrap({
    result: await execute({ operation: sendInvoice, input: { id: draft.id }, context }),
  });
  return { ...setup, fake, invoice };
}

const sync = ({ context, id }: { context: ExecuteContext; id: string }) =>
  execute({ operation: syncInvoice, input: { id }, context });

describe("an invoice booked in a ledger provider (ADR 0100)", () => {
  it("is credited, never voided, and takes no payment its provider cannot book", async () => {
    const { context, invoice } = await bookedInvoice();
    expect(invoice).toMatchObject({ provider: "FORTNOX", providerReference: "1" });
    const voided = await execute({ operation: voidInvoice, input: { id: invoice.id }, context });
    expect(errorCode({ result: voided })).toBe("CONFLICT");
    const card = await execute({
      operation: createPayment,
      input: { invoiceId: invoice.id, amountMinor: 10_000 },
      context,
    });
    expect(errorCode({ result: card })).toBe("CONFLICT");
    const manual = await execute({
      operation: recordManualPayment,
      input: { invoiceId: invoice.id, amountMinor: 10_000, paidAt: new Date() },
      context,
    });
    expect(errorCode({ result: manual })).toBe("CONFLICT");
  });

  it("books a manual payment there when it can, and a sync adds nothing", async () => {
    const { context, fake, invoice, order } = await bookedInvoice({ registerPayment: true });
    const input = { invoiceId: invoice.id, amountMinor: 100_000, paidAt: new Date() };
    unwrap({ result: await execute({ operation: recordManualPayment, input, context }) });
    expect(fake.portCalls).toEqual(["register:1:100000"]);
    const synced = unwrap({ result: await sync({ context, id: invoice.id }) });
    expect(synced).toMatchObject({ paidMinor: 100_000 });
    const page = unwrap({
      result: await execute({ operation: listPayments, input: { orderId: order.id }, context }),
    });
    expect(page.items.map((p) => p.method)).toEqual(["MANUAL"]);
  });

  it("mirrors its payments through the signal path, notifying once", async () => {
    const { context, fake, invoice, orderId } = await bookedInvoice().then((s) => ({
      ...s,
      orderId: s.order.id,
    }));
    const main = await context.db.assignment.findFirstOrThrow({
      where: { recordId: orderId, responsibilityId: null },
    });
    const assigneeId = main.assigneeId ?? "";
    await makeReaders({ context, userIds: [assigneeId] });
    fake.payments = [{ reference: "7", amountMinor: 560_000, paidAt: new Date() }];
    unwrap({ result: await sync({ context, id: invoice.id }) });
    unwrap({ result: await sync({ context, id: invoice.id }) });
    const { items } = await notificationsOf({ context, userId: assigneeId });
    expect(items.map((item) => item.kind)).toEqual(["PAYMENT_RECEIVED"]);
    const mirrored = await context.db.payment.count({ where: { invoiceId: invoice.id } });
    expect(mirrored).toBe(1);
  });
});

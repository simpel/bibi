import { afterEach, describe, expect, it } from "vitest";
import {
  createInvoice,
  execute,
  handleFortnoxEvent,
  listPayments,
  rememberFortnoxTenant,
  sendInvoice,
  setFortnoxInvoicingGateway,
  setPaymentProvider,
  setStripeConnectGateway,
  updatePaymentSettings,
} from "../src/index";
import { connectFortnox, installFakeInvoicing } from "./fortnox-invoicing-helpers";
import { unwrap } from "./helpers";
import { useFortnoxEnv } from "./integration-helpers";
import { makeInvoiceable, moneySetup } from "./receivable-helpers";

useFortnoxEnv();

afterEach(() => {
  setPaymentProvider({ provider: undefined });
  setStripeConnectGateway({ gateway: undefined });
  setFortnoxInvoicingGateway({ gateway: undefined });
});

describe("the Fortnox Topics stream (ADR 0090)", () => {
  it("routes a payment event by tenant id and ignores invoices Bibi did not raise", async () => {
    const { context, ticket } = await moneySetup();
    await connectFortnox({ context });
    const fake = installFakeInvoicing();
    const input = { invoiceProvider: "FORTNOX" as const };
    await execute({ operation: updatePaymentSettings, input, context });
    await makeInvoiceable({ context, statusId: ticket.statusId });
    const draft = unwrap({
      result: await execute({ operation: createInvoice, input: { ticketId: ticket.id }, context }),
    });
    await execute({ operation: sendInvoice, input: { id: draft.id }, context });
    const tenantId = Math.floor(Math.random() * 1_000_000_000);
    await rememberFortnoxTenant({ organizationId: context.organizationId, tenantId });
    fake.payments = [{ number: "1", amountMinor: 560_000, paidAt: new Date() }];
    const base = { topic: "invoices", offset: "a1", tenantId };
    const paid = { ...base, type: "invoicepayment-bookkeep-v1", invoiceId: "1" };
    expect(await handleFortnoxEvent({ event: paid })).toBe("applied");
    const other = { ...paid, invoiceId: "999" };
    expect(await handleFortnoxEvent({ event: other })).toBe("ignored");
    const stranger = { ...paid, tenantId: tenantId + 1 };
    expect(await handleFortnoxEvent({ event: stranger })).toBe("unmatched");
    const page = unwrap({
      result: await execute({ operation: listPayments, input: { ticketId: ticket.id }, context }),
    });
    expect(page.items.find((p) => p.provider === "FORTNOX")).toMatchObject({ status: "SUCCEEDED" });
  });
});

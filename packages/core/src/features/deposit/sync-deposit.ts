import { ok, type Result } from "../../errors/result";
import type { ProviderKey } from "../../providers/provider-keys";
import {
  invoiceProviderCall,
  type ProviderCallContext,
  raisedInProvider,
} from "../invoice/invoice-provider";
import { recordProviderPayments } from "../invoice/record-provider-payments";
import { issueDepositInProvider } from "./deposit-provider";

export type SyncDepositInput = { context: ProviderCallContext; id: string };

/** What Bibi booked on the prepayment invoice itself (`registerOnInvoice`), minor units. */
async function registeredMinorOf({
  context,
  id,
  provider,
}: SyncDepositInput & { provider: ProviderKey }) {
  const registered = await context.db.payment.aggregate({
    where: {
      depositId: id,
      status: { in: ["SUCCEEDED", "REFUNDED"] },
      method: { not: "INVOICE" },
      attempts: { some: { provider, status: "SUCCEEDED" } },
    },
    _sum: { amountMinor: true },
  });
  return registered._sum.amountMinor ?? 0;
}

/**
 * Brings a SENT deposit raised in the accounting system up to date (ADR 0106): raises it there
 * when sending did not reach it, then mirrors the payments booked on its prepayment invoice
 * (a bank transfer staff booked there, say) through the signal path, as `invoice.sync` does for
 * invoices. A deposit kept in Bibi is a no-op. Runs outside any transaction (a provider call).
 */
export async function syncDepositWithProvider({
  context,
  id,
}: SyncDepositInput): Promise<Result<true>> {
  const raised = await issueDepositInProvider({ context, id });
  if (!raised.ok) return raised;
  const row = await context.db.deposit.findFirst({ where: { id, status: "SENT" } });
  if (!row?.provider || !row.providerReference || !raisedInProvider({ invoice: row })) {
    return ok({ value: true });
  }
  const call = await invoiceProviderCall({ context, invoice: row });
  if (!call.ok) return call;
  const payments = await call.value.invoicing.listPayments({
    auth: call.value.auth,
    providerReference: row.providerReference,
    creditedMinor: 0,
    registeredMinor: await registeredMinorOf({ context, id, provider: row.provider }),
  });
  if (!payments.ok) return payments;
  const invoice = { ...row, provider: row.provider, kind: "deposit" as const };
  return recordProviderPayments({ context, invoice, payments: payments.value });
}

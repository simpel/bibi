import { ok, type Result } from "../../errors/result";
import { conflict } from "../../shared/errors";
import { invoiceRows } from "../invoice-rows";
import type { InvoicingPort, ProviderAuth, ProviderPayment } from "../types";
import { vismaNotConnected } from "./visma-config";
import { findOrCreateCustomer } from "./visma-customers";
import { createInvoice, creditRows, readInvoice } from "./visma-invoices";
import { toVismaRows } from "./visma-rows";

const tokenOf = ({ auth }: { auth: ProviderAuth }): Result<string> =>
  auth.accessToken ? ok({ value: auth.accessToken }) : vismaNotConnected();

/**
 * What Visma has received on the invoice, derived from its total and what is left to pay, less
 * what credit invoices took off it (`creditedMinor`; Visma lowers the remaining amount by them): one
 * entry per paid level, keyed by the invoice and the paid sum, so a further payment replaces the
 * entry (removed, then recorded at the new sum). Visma lists no single payments on an invoice
 * through this API. // Verify against Visma sandbox (a per-payment listing would replace this)
 */
export function derivedPayments({
  id,
  totalAmount,
  remainingAmount,
  creditedMinor,
  now,
}: {
  id: string;
  totalAmount: number;
  remainingAmount: number;
  creditedMinor: number;
  now: Date;
}): ProviderPayment[] {
  const paidMinor = Math.round((totalAmount - remainingAmount) * 100) - creditedMinor;
  if (paidMinor <= 0) return [];
  return [{ reference: `${id}:paid:${paidMinor}`, amountMinor: paidMinor, paidAt: now }];
}

/**
 * Visma eEkonomi invoicing (ADR 0100): finds or creates the customer, raises a booked invoice
 * from the frozen rows, credits it with a credit invoice, and reads what has been paid. A booked
 * invoice cannot be voided, only credited. No `registerPayment` yet: Bibi could not tell a
 * payment it booked from one Visma received (see `derivedPayments`).
 */
export const vismaInvoicing: InvoicingPort = {
  async issue({ auth, invoice }) {
    const accessToken = tokenOf({ auth });
    if (!accessToken.ok) return accessToken;
    const token = accessToken.value;
    const customerId = await findOrCreateCustomer({ accessToken: token, ...invoice.customer });
    if (!customerId.ok) return customerId;
    const rows = await toVismaRows({ accessToken: token, rows: invoiceRows({ invoice }) });
    if (!rows.ok) return rows;
    const id = await createInvoice({
      accessToken: token,
      customerId: customerId.value,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      currency: invoice.currency,
      reference: invoice.reference,
      rows: rows.value,
    });
    return id.ok ? ok({ value: { providerReference: id.value, url: null } }) : id;
  },
  void: async () => conflict({ message: "A Visma invoice is booked; credit it instead" }),
  async credit({ auth, providerReference, amountMinor }) {
    const accessToken = tokenOf({ auth });
    if (!accessToken.ok) return accessToken;
    const original = await readInvoice({ accessToken: accessToken.value, id: providerReference });
    if (!original.ok) return original;
    const id = await createInvoice({
      accessToken: accessToken.value,
      customerId: original.value.CustomerId,
      invoiceDate: new Date().toISOString().slice(0, 10),
      dueDate: null,
      currency: original.value.CurrencyCode ?? "SEK",
      reference: `Credit of ${providerReference}`,
      rows: creditRows({ invoice: original.value, amountMinor }),
      creditedInvoiceId: providerReference,
    });
    return id.ok ? ok({ value: { providerReference: id.value, url: null } }) : id;
  },
  async listPayments({ auth, providerReference, creditedMinor }) {
    const accessToken = tokenOf({ auth });
    if (!accessToken.ok) return accessToken;
    const invoice = await readInvoice({ accessToken: accessToken.value, id: providerReference });
    if (!invoice.ok) return invoice;
    const { Id, TotalAmount, RemainingAmount } = invoice.value;
    return ok({
      value: derivedPayments({
        id: Id,
        totalAmount: TotalAmount,
        remainingAmount: RemainingAmount,
        creditedMinor,
        now: new Date(),
      }),
    });
  },
};
